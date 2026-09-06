/**
 * Dislexfy — service worker (background)
 *
 * Responsabilidades:
 *  - Criar o item "Ler com Zyrex" no menu de contexto do Chrome (para seleção).
 *  - Encaminhar cliques no menu de contexto e no ícone da extensão como mensagens
 *    pro content script da aba ativa.
 *  - Fazer o fetch da API TTS (zyrex:synthesize) — item 4.2: o fetch saiu do
 *    content script porque lá ele é governado pela CSP connect-src DA PÁGINA
 *    (GitHub etc. bloqueavam); o SW é imune à CSP da página e as
 *    host_permissions autorizam o cross-origin. O SW é o DONO da URL da API:
 *    constante default + override em chrome.storage.sync (zyrex_prefs.apiUrl,
 *    que a options page da Etapa 4 vai escrever).
 *  - Warm-up da lambda (zyrex:warmup → OPTIONS com throttle de 60s).
 *  - Gerenciar o offscreen document (item 4.3): criado sob demanda quando o
 *    content script pede zyrex:off:ensure (fallback de reprodução pra sites
 *    cuja CSP media-src bloqueia o <audio> do shadow), encerrado quando a
 *    aba que o usa fecha/navega. As mensagens zyrex:off:load/play/pause/
 *    seek/rate/stop que o content script manda com chrome.runtime.sendMessage
 *    já chegam direto no offscreen document (broadcast pro contexto da
 *    extensão) — o SW não precisa repassá-las. O caminho INVERSO precisa de
 *    ponte manual: chrome.tabs.sendMessage exige um tabId, então o SW guarda
 *    qual aba pediu o offscreen e repassa zyrex:off:tick/ended/error/
 *    preempted pra ela.
 *  - Modo Leitura (item 5.4/5.5): dono do chrome.storage.session (o content
 *    script não acessa por padrão — setAccessLevel roda no onInstalled/
 *    onStartup abaixo); handler zyrex:get-article serve de fallback pro
 *    reader.js quando o acesso direto ao storage.session falhar; handler
 *    zyrex:open-reader-tab cria a aba de pop-out (chrome.tabs.create); menu
 *    de contexto "Abrir no Modo Leitura" (page + selection) manda
 *    zyrex:open-reader pro content script da aba.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE WORKER CLÁSSICO, ARQUIVO ÚNICO — de propósito.
//
// Este arquivo já foi um módulo ES (manifest "type": "module") importando
// lib/auth-bg.js, e isso quebrou em campo: o Chrome só relê o manifest no
// RELOAD COMPLETO da extensão, mas relê o background.js a cada restart do SW.
// Bastou o arquivo ganhar `import` antes de o usuário recarregar a extensão
// pra o SW morrer com SyntaxError sob o manifest antigo — e TODA mensagem
// (auth, share, TTS) passou a falhar com "não foi possível falar com a
// extensão". Um SW clássico e autocontido não tem essa classe de falha.
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXT_MENU_ID = "zyrex-read-selection";
const READ_ALL_MENU_ID = "zyrex-read-all";
const OPEN_READER_MENU_ID = "zyrex-open-reader";

// Domínio canônico do produto (site + API + links compartilhados). O
// subdomínio zyrex-tts.vercel.app continua servindo /api/tts para instalações
// antigas, mas tudo novo aponta pra marca.
const SITE_BASE = "https://dislexfy.com";
const DEFAULT_API_URL = SITE_BASE + "/api/tts";
const SHARE_LINK_BASE = SITE_BASE;
const PREFS_KEY = "zyrex_prefs";

// URL da API: zyrex_prefs.apiUrl no storage.sync quando existir (a chave pode
// ainda não existir — o item 4.4/4.6 escreve lá depois), senão a default.
async function getApiUrl() {
  try {
    const result = await chrome.storage.sync.get(PREFS_KEY);
    const prefs = result && result[PREFS_KEY];
    if (prefs && typeof prefs.apiUrl === "string" && prefs.apiUrl.trim()) {
      return prefs.apiUrl.trim();
    }
  } catch (_) {
    // storage indisponível/corrompido — segue com a default
  }
  return DEFAULT_API_URL;
}

// AbortController por requisição em voo, pra zyrex:synthesize-cancel achar o
// fetch certo. Limpo no settle (finally) e no próprio cancel.
const synthAborts = new Map(); // requestId → AbortController

// Faz UMA tentativa de síntese e devolve {status, contentType, body} — body
// já parseado se a resposta for JSON, senão o texto cru (mesmo contrato do
// httpTransport do módulo). Retry/timeout/mensagens ficam no content script
// (synthesize do zx-player.js), NUNCA aqui — o transport não re-tenta.
async function handleSynthesize(msg) {
  const controller = new AbortController();
  if (msg.requestId) synthAborts.set(msg.requestId, controller);
  try {
    const apiUrl = await getApiUrl();
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg.text, voice: msg.voice }),
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    let body = await res.text(); // áudio base64 dentro do JSON viaja bem por mensagem
    if (contentType.includes("json")) {
      try { body = JSON.parse(body); } catch (_) {}
    }
    return { ok: true, status: res.status, contentType, body };
  } catch (err) {
    return {
      ok: false,
      error: err && err.name === "AbortError" ? "aborted" : "network",
      message: err && err.message ? String(err.message) : "",
    };
  } finally {
    if (msg.requestId) synthAborts.delete(msg.requestId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO SUPABASE (ex-lib/auth-bg.js, absorvido — ver nota no topo)
//
// Tokens (access/refresh) NUNCA saem deste service worker: nem o content
// script, nem o bundle React, nem o iframe de login recebem token algum —
// eles só recebem a projeção pública {email, name, plan, isPro}. A sessão
// vive no IndexedDB da própria extensão (não em storage.sync: o refresh token
// não deve viajar entre máquinas pela conta do Chrome; não em storage.session:
// o Chrome a zera quando o browser fecha). O plano é relido do PostgREST a cada
// login/refresh — quem manda no Pro é o servidor.
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://sioephltznhovvnlgmnh.supabase.co";
const SUPABASE_KEY = "sb_publishable_WrSP-IeqRqJHw6Y6deOUbg_taXQeCXh"; // pública por design; RLS protege

// A SESSÃO (com access/refresh token) vive no IndexedDB DO PRÓPRIO service
// worker (origem chrome-extension://<id>), não em chrome.storage.
//
// Por que não storage.local: é sempre legível por content scripts (widget-core
// roda no mundo isolado em TODA página https), então tokens lá ficam ao alcance
// de um content script comprometido — exatamente o que uma revisão adversarial
// pegou.
// Por que não storage.session: é trusted-only (bom), mas o Chrome a ZERA quando
// o browser fecha — era isso que obrigava a relogar a cada vez que o navegador
// abria. Login que não sobrevive ao reinício não é padrão de mercado.
// Por que IndexedDB resolve os dois: um content script só enxerga o IndexedDB da
// ORIGEM DA PÁGINA em que roda; o banco da extensão vive em outra origem, fora
// do alcance dele e de qualquer site. E, ao contrário de storage.session,
// persiste entre reinícios do browser (e do reciclo do service worker).
const SESSION_KEY = "zyrex_session";   // IndexedDB da extensão (tokens — SW-only)
// Espelho PÚBLICO da sessão (SEM token: só {email,name,plan,isPro}). Fica em
// storage.LOCAL de propósito: é por chrome.storage.onChanged nele que os
// widgets em outras abas (content scripts) sabem do login. Content script PODE
// ler isto — e tudo bem, não há segredo aqui. tabs.sendMessage falharia calado
// em sites fora das host_permissions, por isso o canal é o storage.
const ACCOUNT_KEY = "zyrex_account";   // storage.local (público — sync entre abas)
// Renova com folga: um access_token que expira no meio de uma leitura derruba
// a checagem de plano justamente quando o usuário está usando o produto.
const REFRESH_MARGIN_MS = 120000;

/** Planos que valem Pro na extensão. 'familia' são 3 assentos Pro. */
const PRO_PLANS = new Set(["pro", "familia"]);

// Migração one-shot: versões anteriores guardavam a sessão (com tokens) em
// storage.LOCAL, onde content scripts a alcançavam. Apagamos o resíduo pra a
// correção valer também para quem já estava logado — senão os tokens antigos
// ficariam lá parados.
try {
  chrome.storage.local.remove("zyrex_session").catch(() => {});
} catch (_) {}

// ---- Cofre da sessão: IndexedDB da origem da extensão (SW-only) ----
// Um único par chave/valor. Sem biblioteca: são ~30 linhas e o SW não deve
// carregar dependência nenhuma só pra isso.
const AUTH_DB_NAME = "zyrex-auth";
const AUTH_STORE = "kv";
let authDbPromise = null;

function openAuthDb() {
  if (authDbPromise) return authDbPromise;
  authDbPromise = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(AUTH_DB_NAME, 1);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(AUTH_STORE)) req.result.createObjectStore(AUTH_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // O browser fechando/limpando dados pode abortar a abertura; a próxima
    // chamada reabre em vez de ficar presa numa promise rejeitada em cache.
    req.onblocked = () => reject(new Error("indexedDB blocked"));
  }).catch((err) => {
    authDbPromise = null;
    throw err;
  });
  return authDbPromise;
}

function idbRequest(mode, run) {
  return openAuthDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(AUTH_STORE, mode);
        const req = run(tx.objectStore(AUTH_STORE));
        tx.onabort = () => reject(tx.error);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

const vaultGet = (key) => idbRequest("readonly", (store) => store.get(key));
const vaultSet = (key, value) => idbRequest("readwrite", (store) => store.put(value, key));
const vaultDel = (key) => idbRequest("readwrite", (store) => store.delete(key));

let cachedSession = undefined; // undefined = não lido; null = deslogado

async function readSession() {
  if (cachedSession !== undefined) return cachedSession;
  let session = null;
  try {
    session = (await vaultGet(SESSION_KEY)) || null;
  } catch (_) {
    // IndexedDB indisponível (modo anônimo com storage bloqueado, cota, perfil
    // corrompido): tratamos como deslogado em vez de derrubar o SW.
  }
  if (!session) {
    // Migração: quem estava logado com a versão anterior tem a sessão em
    // storage.session. Enquanto o browser não fechar, ela ainda está lá —
    // movemos pro cofre pra ele não precisar relogar nem uma vez.
    try {
      const legacy = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY] || null;
      if (legacy) {
        session = legacy;
        try { await vaultSet(SESSION_KEY, legacy); } catch (_) {}
        chrome.storage.session.remove(SESSION_KEY).catch(() => {});
      }
    } catch (_) {}
  }
  cachedSession = session;
  return cachedSession;
}

// Tokens no cofre IndexedDB (fora do alcance de content scripts e de qualquer
// site); espelho público em storage.local (dispara o onChanged que as abas
// escutam). Áreas separadas — e essa separação É a proteção.
//
// Os dois try são INDEPENDENTES de propósito. Já foram um só, e um cofre que
// falhasse (IndexedDB bloqueado, cota, perfil corrompido) pulava a escrita do
// espelho e engolia o erro — nenhuma aba descobria o login, e o usuário só saía
// disso com F5. A assimetria de custo manda aqui: cofre que falha custa relogar
// no próximo restart do browser; espelho que falha custa o login INTEIRO, agora.
async function writeSession(session) {
  cachedSession = session || null;
  const account = publicAccount(cachedSession);
  let vaultOk = true;
  try {
    if (session) {
      await vaultSet(SESSION_KEY, session);
    } else {
      await vaultDel(SESSION_KEY);
      chrome.storage.session.remove(SESSION_KEY).catch(() => {}); // resíduo da versão anterior
    }
  } catch (_) {
    // Sessão segue em memória até o SW reciclar. reconcileAccountMirror() no
    // próximo onStartup limpa o espelho que sobrar sem cofre por trás.
    vaultOk = false;
  }
  try {
    if (session) await chrome.storage.local.set({ [ACCOUNT_KEY]: account });
    else await chrome.storage.local.remove(ACCOUNT_KEY);
  } catch (_) {}
  // Extras pra quem não é aba (options page, iframe de login) e, principalmente,
  // canal REDUNDANTE ao storage.onChanged: se a escrita do espelho for
  // justamente o que falhou, é por aqui que os widgets ficam sabendo.
  try {
    chrome.runtime.sendMessage({ type: "zyrex:auth:changed", account }, () => void chrome.runtime.lastError);
  } catch (_) {}
  return { vaultOk };
}

/** Projeção segura da sessão: o que pode sair do service worker. Sem tokens. */
function publicAccount(session) {
  if (!session || !session.user) return null;
  const plan = session.plan || "free";
  return {
    email: session.user.email || "",
    name: session.user.name || "",
    plan,
    isPro: PRO_PLANS.has(plan),
  };
}

function authHeaders(extra) {
  return Object.assign({ apikey: SUPABASE_KEY, "Content-Type": "application/json" }, extra || {});
}

/** Traduz o erro do GoTrue pra uma frase que o usuário entende. */
function friendlyAuthError(status, body) {
  const raw = String((body && (body.error_description || body.msg || body.message || body.error)) || "");
  if (/invalid login credentials/i.test(raw)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(raw)) return "Confirme seu e-mail antes de entrar.";
  if (/user already registered|already been registered/i.test(raw)) return "Este e-mail já tem conta. Tente entrar.";
  if (/password should be at least/i.test(raw)) return "A senha precisa de pelo menos 6 caracteres.";
  if (/weak password|pwned|leaked/i.test(raw)) return "Essa senha apareceu em vazamentos conhecidos. Escolha outra.";
  if (/rate limit|too many requests/i.test(raw) || status === 429) {
    return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
  }
  if (status === 0) return "Sem conexão. Verifique sua internet.";
  return raw || "Não foi possível concluir. Tente de novo.";
}

async function postAuth(path, body) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  } catch (_) {
    // status 0 = a rede falhou (fetch lançou). Transitório por natureza.
    return { ok: false, status: 0, message: friendlyAuthError(0, null) };
  }
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) return { ok: false, status: res.status, message: friendlyAuthError(res.status, data) };
  return { ok: true, status: res.status, data: data || {} };
}

/** Lê profiles.plan do usuário logado (RLS garante que só vê a própria linha). */
async function fetchPlan(accessToken, userId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=plan,full_name&id=eq.${encodeURIComponent(userId)}`,
      { headers: authHeaders({ Authorization: `Bearer ${accessToken}` }) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return (Array.isArray(rows) && rows[0]) || null;
  } catch (_) {
    return null;
  }
}

/** Monta a sessão persistida a partir da resposta de token do GoTrue. */
async function sessionFromTokenResponse(data) {
  const user = data.user || {};
  const meta = user.user_metadata || {};
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    user: {
      id: user.id,
      email: user.email || "",
      name: meta.full_name || meta.name || "",
    },
    plan: "free",
  };
  const profile = await fetchPlan(session.access_token, session.user.id);
  if (profile) {
    if (profile.plan) session.plan = profile.plan;
    if (!session.user.name && profile.full_name) session.user.name = profile.full_name;
  }
  return session;
}

// Época da sessão: incrementa a cada login/logout. Um refresh que dispara,
// suspende no await e resolve DEPOIS de um signOut carrega a época em que
// começou; se ela mudou no meio, o resultado é descartado — senão o refresh
// tardio regravaria uma sessão que o usuário acabou de encerrar (bug pego em
// revisão: o logout "não pegava").
let authEpoch = 0;
// Single-flight: refreshes concorrentes (onStartup + abrir o widget, p.ex.)
// compartilham UMA promise. Sem isto, dois POST usam o MESMO refresh_token; o
// GoTrue rotaciona no primeiro e o segundo poderia falhar com invalid_grant.
let refreshInFlight = null;

/**
 * Devolve um access_token válido, renovando quando perto de expirar.
 *
 * Desloga SÓ quando o servidor RECUSA o refresh_token de forma definitiva
 * (400/401 — invalid_grant, token revogado). Erro transitório — rede caída
 * (status 0), rate limit (429) ou instabilidade do GoTrue (5xx) — mantém a
 * sessão e devolve o access_token atual: uma manutenção do Supabase não pode
 * deslogar quem está no meio de uma leitura.
 */
async function validAccessToken() {
  const session = await readSession();
  if (!session) return null;
  if (session.expires_at - REFRESH_MARGIN_MS > Date.now()) return session.access_token;
  if (!session.refresh_token) return session.access_token;
  if (refreshInFlight) return refreshInFlight;
  const epochAtStart = authEpoch;
  refreshInFlight = (async () => {
    const res = await postAuth("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    if (!res.ok || !res.data.access_token) {
      // Definitivo (o servidor recusou o token) → desloga. Transitório → segura.
      const definitive = res.status === 400 || res.status === 401;
      if (definitive && authEpoch === epochAtStart) await writeSession(null);
      return definitive && authEpoch === epochAtStart ? null : session.access_token;
    }
    // Um signOut aconteceu enquanto o refresh estava em voo: descarta o
    // resultado em vez de ressuscitar a sessão encerrada.
    if (authEpoch !== epochAtStart) return null;
    const next = await sessionFromTokenResponse(res.data);
    if (authEpoch !== epochAtStart) return null;
    await writeSession(next);
    return next.access_token;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function authState() {
  const session = await readSession();
  return { ok: true, account: publicAccount(session) };
}

async function signIn({ email, password }) {
  if (!email || !password) return { ok: false, message: "Preencha e-mail e senha." };
  const res = await postAuth("token?grant_type=password", { email: String(email).trim(), password });
  if (!res.ok) return res;
  if (!res.data.access_token) return { ok: false, message: "Resposta inesperada do servidor." };
  authEpoch++; // novo limite de sessão: invalida qualquer refresh em voo
  const session = await sessionFromTokenResponse(res.data);
  await writeSession(session);
  return { ok: true, account: publicAccount(session) };
}

async function signUp({ email, password, name }) {
  if (!email || !password) return { ok: false, message: "Preencha e-mail e senha." };
  if (String(password).length < 6) return { ok: false, message: "A senha precisa de pelo menos 6 caracteres." };
  const res = await postAuth("signup", {
    email: String(email).trim(),
    password,
    data: name ? { full_name: String(name).trim() } : undefined,
  });
  if (!res.ok) return res;
  // Com confirmação de e-mail desligada o signup já devolve sessão; ligada,
  // não vem token — a resposta pede a confirmação em vez de fingir que logou.
  if (!res.data.access_token) {
    return { ok: true, account: null, needsConfirmation: true };
  }
  authEpoch++;
  const session = await sessionFromTokenResponse(res.data);
  await writeSession(session);
  return { ok: true, account: publicAccount(session) };
}

async function resetPassword({ email }) {
  if (!email) return { ok: false, message: "Informe seu e-mail." };
  const res = await postAuth("recover", {
    email: String(email).trim(),
    // O link do e-mail cai na página de conta do site, que sabe tratar o modo
    // "recovery". Exige a URL na allowlist do Supabase Auth (passo manual).
    redirect_to: `${SITE_BASE}/conta.html`,
  });
  if (!res.ok) return res;
  return { ok: true };
}

async function signOut() {
  authEpoch++; // um refresh em voo que resolver depois daqui será descartado
  const session = await readSession();
  if (session && session.access_token) {
    // Revoga no servidor sem bloquear o logout local.
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: authHeaders({ Authorization: `Bearer ${session.access_token}` }),
      });
    } catch (_) {}
  }
  await writeSession(null);
  return { ok: true, account: null };
}

/**
 * Relê o plano no servidor (ex.: assinou no site com o navegador aberto).
 *
 * INVARIANTE: isto NUNCA devolve account:null com uma sessão viva no cofre.
 * Devolvia — quando validAccessToken() voltava null por época trocada no meio
 * do voo ou refresh transitório — e o widget aplicava esse null sem checar,
 * apagando uma conta válida. Como o widget chama refreshAccountPlan() a cada
 * openWidget(), bastava um azar pra o Pro re-travar e só voltar com F5.
 * "Não consegui confirmar agora" não é "está deslogado".
 */
async function refreshPlan() {
  const session = await readSession();
  if (!session) return { ok: true, account: null }; // deslogado de verdade
  const token = await validAccessToken();
  // O refresh pode ter regravado a sessão (rotação do refresh_token).
  const current = (await readSession()) || session;
  if (!token) return { ok: true, account: publicAccount(current) };
  const profile = await fetchPlan(token, current.user.id);
  if (profile && profile.plan && profile.plan !== current.plan) {
    await writeSession({ ...current, plan: profile.plan });
    return { ok: true, account: publicAccount(cachedSession) };
  }
  return { ok: true, account: publicAccount(current) };
}

/** Roteia zyrex:auth:*. Retorna true quando assumiu (resposta async). */
function handleAuthMessage(msg, sendResponse) {
  switch (msg.type) {
    case "zyrex:auth:state":
      authState().then(sendResponse);
      return true;
    case "zyrex:auth:signin":
      signIn(msg).then(sendResponse);
      return true;
    case "zyrex:auth:signup":
      signUp(msg).then(sendResponse);
      return true;
    case "zyrex:auth:reset":
      resetPassword(msg).then(sendResponse);
      return true;
    case "zyrex:auth:signout":
      signOut().then(sendResponse);
      return true;
    case "zyrex:auth:refresh-plan":
      refreshPlan().then(sendResponse);
      return true;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARTILHAR TRECHO
// ═══════════════════════════════════════════════════════════════════════════

// Publica o trecho compartilhado chamando a função create_shared_snippet no
// Postgres. Duas escolhas que valem registrar:
//
//  - Sai DAQUI, não do content script: um POST disparado da página morreria na
//    CSP connect-src de muitos sites (mesmo motivo do TTS).
//  - Vai direto ao PostgREST em vez de passar por uma rota na Vercel. A rota
//    precisaria da service_role key como segredo de deploy; a função no banco
//    dá as mesmas garantias (ela gera o id e a expiração, o cliente só manda
//    conteúdo) sem segredo nenhum e com um salto de rede a menos.
//
// Só as preferências de LEITURA viajam — nada que identifique quem compartilhou.
const SHARE_PREF_KEYS = ["voice", "speed", "readFont", "readSpacing", "hlColor", "hlStyle"];

function sharePrefs(prefs) {
  if (!prefs || typeof prefs !== "object") return null;
  const out = {};
  for (const k of SHARE_PREF_KEYS) {
    if (prefs[k] !== undefined) out[k] = prefs[k];
  }
  return Object.keys(out).length ? out : null;
}

async function handleShareCreate(msg) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_shared_snippet`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_text: msg.text,
        p_title: msg.title || null,
        p_source_url: msg.sourceUrl || null,
        p_source_title: msg.sourceTitle || null,
        p_prefs: sharePrefs(msg.prefs),
      }),
    });
    // A função devolve o id como um JSON string ("abc123"); um RAISE (ex.:
    // rate limit) vira {code, message} — a mensagem é escrita pra usuário e
    // merece chegar na tela em vez do genérico.
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data !== "string" || !data) {
      const raised = data && typeof data === "object" && typeof data.message === "string" ? data.message : "";
      return { ok: false, message: raised || "Não foi possível criar o link agora." };
    }
    return { ok: true, id: data, url: `${SHARE_LINK_BASE}/ler#${data}` };
  } catch (_) {
    return { ok: false, message: "Sem conexão para criar o link. Verifique sua internet." };
  }
}

// Warm-up: acorda a lambda com um OPTIONS barato. Throttle de 60s mora AQUI
// (o content só manda a mensagem); o reset do SW zera o relógio, sem drama.
let lastWarmUpAt = 0;

function handleWarmUp() {
  const now = Date.now();
  if (now - lastWarmUpAt < 60000) return;
  lastWarmUpAt = now;
  getApiUrl()
    .then((apiUrl) => fetch(apiUrl, { method: "OPTIONS" }))
    .catch(() => {
      // fire-and-forget: warm-up nunca pode derrubar nada
    });
}

// ============ OFFSCREEN DOCUMENT — fallback de reprodução (item 4.3) ============
//
// Criado sob demanda na primeira vez que uma aba precisa dele (o <audio> do
// shadow falhou por CSP media-src). Fica vivo entre chunks/sessões da MESMA
// aba; é encerrado quando a aba fecha ou navega — nunca fica orfão consumindo
// memória. Como só existe UM documento offscreen por extensão (limite da API),
// ele é compartilhado: só a aba que o abriu (ownerTabId) é dona da vez; se
// outra aba pedir enquanto a primeira ainda usa, a leitura antiga é derrubada
// (o próprio offscreen.js já tem essa semântica de single-reader).
const OFFSCREEN_URL = "offscreen/offscreen.html";
let ownerTabId = null;      // aba dona da leitura offscreen vigente
let creatingOffscreen = null; // Promise em voo pra evitar corrida no createDocument

async function hasOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
    });
    return contexts.length > 0;
  }
  // Fallback pra Chrome sem getContexts (110–115): chrome.offscreen.hasDocument.
  if (chrome.offscreen && chrome.offscreen.hasDocument) {
    return chrome.offscreen.hasDocument();
  }
  return false;
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;
  if (creatingOffscreen) { await creatingOffscreen; return; }
  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Reproduzir leitura TTS em sites cuja CSP bloqueia mídia no content script.",
    })
    .catch((err) => {
      // "Only a single offscreen document may be created" — outra chamada
      // concorrente já criou; não é erro real, o documento existe.
      if (!err || !/single offscreen document|already exists/i.test(String(err.message || err))) {
        throw err;
      }
    });
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

async function closeOffscreenDocument() {
  ownerTabId = null;
  try {
    if (await hasOffscreenDocument()) await chrome.offscreen.closeDocument();
  } catch (_) {
    // já fechado/indisponível — silêncio.
  }
}

// A aba que possuía a leitura offscreen fechou ou navegou: derruba o
// documento (ele não serve mais pra ninguém até um novo ensure). Detecção de
// navegação via tabs.onUpdated (status "loading") — evita pedir a permissão
// webNavigation só pra isso; tabs.onRemoved já vem de "activeTab"/"tabs" (a
// extensão usa chrome.tabs.sendMessage em vários pontos sem permissão extra
// porque activeTab cobre o essencial e estas APIs de metadata não exigem
// permissão adicional além do que já está no manifest).
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === ownerTabId) closeOffscreenDocument();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === ownerTabId && changeInfo.status === "loading") closeOffscreenDocument();
});

// Ponte offscreen → content script: chrome.runtime.sendMessage do offscreen
// document chega aqui (e não na aba) porque tabs.sendMessage exige tabId.
// Só a aba dona (ownerTabId) recebe os ticks/eventos da leitura vigente.
function forwardToOwnerTab(msg) {
  if (ownerTabId == null) return;
  chrome.tabs.sendMessage(ownerTabId, msg).catch(() => {
    // aba fechada/sem content script — nada a fazer; onRemoved já limpa o resto.
  });
}

// ============ MODO LEITURA — storage.session + pop-out (item 5.4/5.5) ============
//
// storage.session fica no nível de acesso PADRÃO (TRUSTED_CONTEXTS): só
// contextos de extensão o enxergam. Isso é DELIBERADO. Aqui a área guarda só os
// artigos do Modo Leitura — dados efêmeros por natureza, que devem mesmo sumir
// quando o browser fecha. Os tokens de auth NÃO moram mais aqui: foram pro cofre
// IndexedDB (seção AUTH), que é igualmente inacessível a content scripts e, ao
// contrário desta área, persiste entre reinícios. Quem lê os artigos é
// reader.html, que é página de extensão (chrome-extension://), portanto
// trusted: enxerga direto, sem precisar abrir pra content scripts.
// content.js (contexto da PÁGINA, untrusted) nunca lê session direto — a
// gravação do artigo é roteada por mensagem (zyrex:save-article) e a leitura
// tem fallback por mensagem (zyrex:get-article). Já houve aqui um
// setAccessLevel('TRUSTED_AND_UNTRUSTED_CONTEXTS'); ele foi REMOVIDO numa
// auditoria porque expunha a área session inteira — incluindo os tokens de
// auth — a content scripts, sem que ninguém untrusted realmente precisasse.

// Abertura do browser: a sessão sobrevive no cofre IndexedDB, então aqui há
// mesmo o que renovar. refreshPlan() passa por validAccessToken(), que troca o
// refresh_token por um access_token novo quando o antigo expirou durante a
// noite, e relê profiles.plan — quem assinou o Pro no site com o navegador
// fechado já abre com o cadeado destravado.
//
// Antes disso, reconcilia o espelho público: se o cofre não tem sessão (logout
// em outro perfil, dados do site limpos, IndexedDB indisponível) mas o
// zyrex_account ficou em storage.local, os widgets abririam se dizendo logados
// e só descobririam o contrário na primeira ação. writeSession(null) apaga o
// espelho e o onChanged corrige todas as abas.
async function reconcileAccountMirror() {
  const session = await readSession();
  if (session) return;
  const mirrored = (await chrome.storage.local.get(ACCOUNT_KEY))[ACCOUNT_KEY];
  if (mirrored) await writeSession(null);
}

chrome.runtime.onStartup.addListener(() => {
  reconcileAccountMirror()
    .catch(() => {})
    .then(() => refreshPlan())
    .catch(() => {});
});

// Artigo gigante (item 5.6): chrome.storage.session tem cota total ~10MB
// (QUOTA_BYTES) e ~10MB por item (QUOTA_BYTES_PER_ITEM) — na prática, folgada
// pra um único artigo, mas páginas hostis/Wikipédia com centenas de imagens
// <img> em base64 (data:) coladas no HTML por algum site podem produzir
// contentHTML multi-megabyte. Cortamos bem abaixo da cota real (~2MB) por
// margem de segurança (o storage.session também guarda outros artigos abertos
// em outras abas ao mesmo tempo, e base64 de imagem em contentHTML — extract.js
// permite data:image/ — infla rápido). Truncar em vez de falhar: o reader
// ainda mostra o começo do artigo, com aviso.
const MAX_CONTENT_HTML_BYTES = 2 * 1024 * 1024; // ~2MB

function byteLength(str) {
  // TextEncoder mede bytes UTF-8 reais (o limite do storage é em bytes, não em
  // caracteres JS/UTF-16) sem precisar serializar pra Blob.
  return new TextEncoder().encode(str).length;
}

// Corta contentHTML no limite de bytes, recuando até a última fronteira segura
// de tag fechada ("</...>") anterior ao corte — nunca no meio de uma tag ou de
// uma entidade, o que deixaria o HTML malformado pro DOMParser do reader.js.
// Sanitização (allowlist) já rodou antes disto (extract.js) — este corte é só
// de tamanho, não de segurança, então um corte "no meio do texto" é aceitável
// (o parser fecha tags implicitamente); cortar após "</tag>" deixa o resultado
// mais limpo visualmente (não interrompe uma imagem/parágrafo pela metade de
// forma visualmente estranha, quando dá pra evitar facilmente).
function truncateContentHtml(html, maxBytes) {
  if (!html || byteLength(html) <= maxBytes) return { html, truncated: false };
  // Corte grosseiro por caracteres (aproxima bytes; 1 char pode ser >1 byte em
  // UTF-8, então o resultado real fica <= maxBytes, nunca acima).
  let cut = html.length;
  while (cut > 0 && byteLength(html.slice(0, cut)) > maxBytes) {
    cut = Math.floor(cut * 0.95);
  }
  let safeCut = html.lastIndexOf("</", cut);
  if (safeCut > 0) {
    const closeTagEnd = html.indexOf(">", safeCut);
    if (closeTagEnd > 0 && closeTagEnd < cut + 32) cut = closeTagEnd + 1;
  }
  return { html: html.slice(0, cut), truncated: true };
}

// Grava o artigo extraído sob um id único, devolvendo o id ao content script.
// Chamado por content.js via zyrex:save-article: mesmo com o access level
// setado acima, roteamos a ESCRITA sempre pelo background por simplicidade e
// robustez (independe de qualquer atraso de propagação do setAccessLevel
// logo após a instalação/reload) — o mesmo padrão que synthesize já usa pro
// fetch da API.
async function handleSaveArticle(msg) {
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  const article = msg.article || {};
  const { html, truncated } = truncateContentHtml(article.contentHTML || "", MAX_CONTENT_HTML_BYTES);
  const toStore = truncated ? { ...article, contentHTML: html, truncated: true } : article;
  try {
    await chrome.storage.session.set({ [id]: toStore });
    return { ok: true, id, truncated };
  } catch (err) {
    return { ok: false, message: err && err.message ? String(err.message) : "" };
  }
}

async function handleGetArticle(msg) {
  try {
    const result = await chrome.storage.session.get(msg.id);
    const article = result && result[msg.id];
    return { ok: true, article: article || null };
  } catch (err) {
    return { ok: false, article: null, message: err && err.message ? String(err.message) : "" };
  }
}

function handleClearArticle(msg) {
  if (!msg.id) return;
  chrome.storage.session.remove(msg.id).catch(() => {});
}

// Pop-out: o reader.js (dentro do overlay/iframe) pede ao content.js, que
// repassa aqui — só o background tem chrome.tabs. Reusa o MESMO id (o artigo
// já está em storage.session) e acrescenta '&tab=1' ao hash pra reader.js se
// reconhecer como aba própria (ver isPopoutTab() em reader.js).
async function handleOpenReaderTab(msg, sender) {
  const id = msg.id;
  if (!id) return { ok: false };
  let hash = `#id=${encodeURIComponent(id)}&tab=1`;
  // Handoff de posição de leitura (item 5.4): bloco/tempo de mídia vigentes
  // no overlay, se houver. reader.js:boot() lê pos=blockIdx,mediaTime,article
  // do hash na aba nova e retoma a leitura em vez de começar do zero.
  const pos = msg.position;
  if (pos && Number.isInteger(pos.blockIdx) && pos.blockIdx >= 0) {
    const mediaTime = Number.isFinite(pos.mediaTime) ? pos.mediaTime : 0;
    const article = pos.article ? "1" : "0";
    hash += `&pos=${pos.blockIdx},${mediaTime},${article}`;
  }
  const readerUrl = chrome.runtime.getURL("reader/reader.html") + hash;
  try {
    const createProps = { url: readerUrl };
    const openerTabId = sender && sender.tab && sender.tab.id;
    if (openerTabId != null) createProps.openerTabId = openerTabId;
    await chrome.tabs.create(createProps);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err && err.message ? String(err.message) : "" };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  // Health check: o AuthModal pinga antes de deixar o usuário digitar a senha
  // — se o SW não responder, a UI mostra a instrução de recarregar em vez de
  // aceitar credenciais que vão falhar.
  if (msg.type === "zyrex:ping") {
    sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
    return;
  }
  // Autenticação: tokens nunca saem do service worker; as respostas só
  // carregam {email, plan, isPro}.
  if (typeof msg.type === "string" && msg.type.startsWith("zyrex:auth:")) {
    if (handleAuthMessage(msg, sendResponse)) return true;
    return;
  }
  if (msg.type === "zyrex:open-options") {
    // O content script não pode abrir a options page sozinho.
    try { chrome.runtime.openOptionsPage(); } catch (_) {}
    sendResponse({ ok: true });
    return;
  }
  if (msg.type === "zyrex:synthesize") {
    handleSynthesize(msg).then(sendResponse);
    return true; // resposta async — mantém a porta aberta
  }
  if (msg.type === "zyrex:share:create") {
    handleShareCreate(msg).then(sendResponse);
    return true;
  }
  if (msg.type === "zyrex:synthesize-cancel") {
    const controller = synthAborts.get(msg.requestId);
    if (controller) {
      synthAborts.delete(msg.requestId);
      controller.abort();
    }
    sendResponse({ ok: true });
    return; // resposta síncrona
  }
  if (msg.type === "zyrex:warmup") {
    handleWarmUp();
    sendResponse({ ok: true });
    return; // resposta síncrona (o fetch segue em background)
  }
  if (msg.type === "zyrex:off:ensure") {
    // O content script chama isto ANTES do primeiro zyrex:off:load — garante
    // que o documento existe e registra a aba como dona da vez.
    if (sender.tab && sender.tab.id != null) ownerTabId = sender.tab.id;
    ensureOffscreenDocument()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, message: err && err.message }));
    return true;
  }
  // Ticks/eventos vindos do offscreen document (sender.url aponta pro
  // offscreen.html — nunca chega de uma aba comum, mas o filtro por tipo já
  // basta: são os únicos tipos que o offscreen.js emite).
  if (
    msg.type === "zyrex:off:tick" ||
    msg.type === "zyrex:off:ended" ||
    msg.type === "zyrex:off:error" ||
    msg.type === "zyrex:off:preempted"
  ) {
    forwardToOwnerTab(msg);
    return; // síncrono — não espera resposta do content script
  }
  if (msg.type === "zyrex:save-article") {
    handleSaveArticle(msg).then(sendResponse);
    return true;
  }
  if (msg.type === "zyrex:get-article") {
    handleGetArticle(msg).then(sendResponse);
    return true;
  }
  if (msg.type === "zyrex:clear-article") {
    handleClearArticle(msg);
    sendResponse({ ok: true });
    return; // síncrono — fire-and-forget
  }
  if (msg.type === "zyrex:open-reader-tab") {
    handleOpenReaderTab(msg, sender).then(sendResponse);
    return true;
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  // Boas-vindas: só na instalação nova (nunca em update/reload) — abre a
  // homepage com ?welcome=1, que o boot-inline.js do site lê pra mostrar um
  // toast "Dislexfy instalado". (O antigo tutorial guiado de 3 passos e o
  // marcador dataset.zyrexExt saíram na Fase 7.)
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://dislexfy.com/?welcome=1" }).catch(() => {
      // Chrome pode bloquear tabs.create em contextos raros (ex.: perfil
      // gerenciado) — não é fatal, o usuário abre a extensão manualmente.
    });
  }
  // Remove qualquer duplicata de instalações anteriores antes de criar
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Ler com Dislexfy",
      contexts: ["selection"],
    });
    // Sem seleção: oferece ler a página inteira (o content script extrai os blocos).
    chrome.contextMenus.create({
      id: READ_ALL_MENU_ID,
      title: "Ler página inteira",
      contexts: ["page"],
    });
    // Modo Leitura (item 5.5): funciona com OU sem seleção — o content script
    // decide (seleção vira artigo de 1 bloco; sem seleção, extractArticle(document)).
    chrome.contextMenus.create({
      id: OPEN_READER_MENU_ID,
      title: "Abrir no Modo Leitura",
      contexts: ["page", "selection"],
    });
  });
});

// Clique nos itens de menu: manda a mensagem pro content script da aba
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === CONTEXT_MENU_ID) {
    if (!info.selectionText) return;
    chrome.tabs
      .sendMessage(tab.id, {
        type: "zyrex:read-selection",
        text: info.selectionText.trim(),
      })
      .catch(() => {
        // Content script pode não estar carregado (ex.: chrome:// URLs) — silêncio.
      });
  } else if (info.menuItemId === READ_ALL_MENU_ID) {
    chrome.tabs
      .sendMessage(tab.id, { type: "zyrex:read-all" })
      .catch(() => {});
  } else if (info.menuItemId === OPEN_READER_MENU_ID) {
    chrome.tabs
      .sendMessage(tab.id, {
        type: "zyrex:open-reader",
        // Com seleção, repassa o texto puro (o content script monta um artigo
        // de 1 bloco a partir dele); sem seleção, extractArticle(document) cuida.
        selectionText: info.selectionText ? info.selectionText.trim() : "",
      })
      .catch(() => {});
  }
});

// Clique no ícone da extensão na toolbar: pede pro content script abrir/fechar o widget
chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  chrome.tabs
    .sendMessage(tab.id, { type: "zyrex:toggle" })
    .catch(() => {});
});

// ============ ATALHOS DE TECLADO (item 4.5) ============
// chrome.commands entrega o comando pro SW, não pra aba — repassamos pro
// content script da aba ATIVA da janela corrente via tabs.query. .catch(()=>{})
// cobre abas sem content script (chrome://, Web Store, PDF viewer nativo...).
const COMMAND_MESSAGES = {
  "toggle-widget": { type: "zyrex:toggle" },
  "read-selection": { type: "zyrex:read-selection" }, // sem texto: usa a seleção local da aba
  "play-pause": { type: "zyrex:play-pause" },
  "rewind-10": { type: "zyrex:seek", dt: -10 },
};

chrome.commands.onCommand.addListener((command) => {
  const message = COMMAND_MESSAGES[command];
  if (!message) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || tab.id == null) return;
    chrome.tabs.sendMessage(tab.id, message).catch(() => {});
  });
});
