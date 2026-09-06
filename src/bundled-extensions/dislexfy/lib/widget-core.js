/**
 * widget-core.js — núcleo headless do widget Dislexfy (compartilhado).
 *
 * Toda a LÓGICA do widget (player TTS, motor de destaque, seleção, botão de
 * parágrafo, Ler Tudo, Modo Leitura, histórico, preferências, auto-scroll,
 * modo foco, tipografia, sincronia entre abas, mensagens do service worker e
 * fallback offscreen) mora aqui, sem NENHUMA suposição sobre a apresentação.
 *
 * A UI (hoje a React em ui/, amanhã a única) é só um consumidor: assina
 * `subscribe()` pra receber o estado e chama `actions.*` pra agir. Isso é o
 * que o comentário do vite.config.ts antecipava — o core é JS puro carregado
 * por import(chrome.runtime.getURL("lib/widget-core.js")), então o bundler da
 * UI nunca o vê e ele mesmo importa os módulos irmãos (zx-player etc.) por
 * getURL. A instância do core é criada pelo content.js e passada pro
 * mountWidget() — o bundle React recebe o core pronto, não o importa.
 *
 * Enquanto a flag zyrexNewUI convive com a UI antiga, este core roda SÓ no
 * caminho novo (o boot() antigo retorna antes por causa do early-return em
 * inject()). Na Fase 7 o boot() antigo sai e este core vira o único.
 *
 * A superfície dos módulos reutilizados é a mesma que o content.js usa:
 *   createPlaybackController → {start,togglePlayPause,stop,seekRelative,seekTo,
 *                               getTime,setRate,downloadBlob,dispose,getState,cache}
 *   createHighlightEngine    → {isSupported,startSession,setChunkSubtitle,tick,
 *                               hitTest,endSession,rerender}
 *   buildTextMap(target)     → {flatText,...}
 *   extractArticle / isProbablyReaderable
 */

// ============ CONSTANTES (espelham content.js) ============
const OLD_STORAGE_KEY = "zyrex_state_v2"; // legado — só na migração one-shot
const PREFS_KEY = "zyrex_prefs";          // storage.sync
const LOCAL_KEY = "zyrex_local";          // storage.local
// Espelho público da conta escrito pelo service worker (seção AUTH do background.js). Sem
// token: só {email, name, plan, isPro}. É o canal de sincronia entre abas.
const ACCOUNT_KEY = "zyrex_account";      // storage.local
const MAX_HISTORY = 30;
// Generoso de propósito: o cursor precisa atravessar o vão até o botão. Quem
// segura de verdade é o corredor seguro (pointerInSafeZone); o timer é só a
// rede de segurança pra quando o ponteiro sai de vez.
const PARA_HIDE_DELAY = 900;

const HL_COLORS = ["yellow", "blue", "pink"];
const HL_STYLES = ["background", "underline"];
const READ_FONTS = ["page", "atkinson", "opendyslexic", "lexend"];
const ORIENTATIONS = ["horizontal", "vertical"];
// Como o widget nasce em cada página nova:
//   hidden    — nada na tela; só aparece pelo ícone da extensão (padrão histórico)
//   collapsed — a pílula "Mostrar Dislexfy" (só a logo), pronta pra um clique
//   open      — a interface completa, já aberta
const START_MODES = ["hidden", "collapsed", "open"];
function enumOr(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

const PREVIEW_KEY = "zyrex_voice_preview_v1";
const PREVIEW_PHRASE = "Olá! Assim é como eu leio para você.";

const READABLE = "p, h1, h2, h3, h4, li, article, blockquote";

// Seletor do BOTÃO DE PARÁGRAFO — de propósito SEM `article`.
//
// `article` existe em READABLE para o "Ler página inteira" achar texto em
// páginas que não usam <p>. Como alvo de hover ele é péssimo: num portal de
// notícias o <article> envolve a página toda, então a borda esquerda dele fica
// a centenas de pixels do texto. Bastava o cursor encostar na margem vazia do
// contêiner pra o botão saltar pra lá — que foi exatamente o bug relatado.
const HOVER_READABLE = "p, h1, h2, h3, h4, li, blockquote";

// ============ TRANSPORT VIA SERVICE WORKER (item 4.2) ============
function transportAbortError(signal) {
  if (signal && signal.reason) return signal.reason;
  return typeof DOMException === "function"
    ? new DOMException("Aborted", "AbortError")
    : Object.assign(new Error("Aborted"), { name: "AbortError" });
}

// A extensão foi recarregada/atualizada e este content script ficou órfão:
// nenhuma re-tentativa resolve, só recarregar a página. Marcamos .fatal pro
// synthesize não gastar 4 tentativas num caso perdido e pro usuário receber a
// instrução certa em vez de "verifique sua internet".
function staleContextError() {
  const e = new Error("O Dislexfy foi atualizado. Recarregue a página (F5) para continuar.");
  e.fatal = true;
  return e;
}
function isStaleContextMessage(m) {
  return /Extension context invalidated|receiving end does not exist|message port closed/i.test(String(m || ""));
}

function bgTransport({ text, voice, signal }) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(transportAbortError(signal));
      return;
    }
    // chrome.runtime some quando a extensão é recarregada com a página aberta.
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
      reject(staleContextError());
      return;
    }
    const requestId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    let settled = false;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      try {
        chrome.runtime.sendMessage(
          { type: "zyrex:synthesize-cancel", requestId },
          () => void chrome.runtime.lastError
        );
      } catch (_) {}
      reject(transportAbortError(signal));
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    try {
      chrome.runtime.sendMessage({ type: "zyrex:synthesize", requestId, text, voice }, (resp) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        if (settled) return;
        settled = true;
        const lastError = chrome.runtime.lastError;
        if (lastError || !resp) {
          // Contexto órfão é definitivo; qualquer outra falta de resposta é o
          // service worker tendo dormido/reiniciado — vale re-tentar (TypeError
          // é o que o synthesize entende como "retryable").
          if (lastError && isStaleContextMessage(lastError.message)) {
            reject(staleContextError());
          } else {
            reject(new TypeError("Sem resposta do service worker."));
          }
          return;
        }
        if (resp.ok === false) {
          if (resp.error === "aborted") {
            reject(transportAbortError(signal));
            return;
          }
          reject(new TypeError(resp.message || "Falha de rede no service worker."));
          return;
        }
        resolve({ status: resp.status, contentType: resp.contentType, body: resp.body });
      });
    } catch (err) {
      if (signal) signal.removeEventListener("abort", onAbort);
      if (!settled) {
        settled = true;
        reject(
          isStaleContextMessage(err && err.message)
            ? staleContextError()
            : new TypeError("Sem conexão com o service worker.")
        );
      }
    }
  });
}

// Warm-up: acorda o service worker E a lambda antes de o usuário mandar tocar.
// O throttle real (60s) mora no background; este aqui é só pra não inundar de
// mensagens quando o gatilho é o hover em parágrafo (dispara a cada parágrafo).
let lastWarmUpSent = 0;
function warmUpViaSW() {
  const now = Date.now();
  if (now - lastWarmUpSent < 20000) return;
  lastWarmUpSent = now;
  try {
    if (!chrome.runtime || !chrome.runtime.id) return;
    chrome.runtime.sendMessage({ type: "zyrex:warmup" }, () => void chrome.runtime.lastError);
  } catch (_) {}
}

// ============ FÁBRICA DO NÚCLEO ============
/**
 * @param {{ shadow: ShadowRoot, host: Element, doc?: Document, win?: Window }} deps
 * @returns {Promise<WidgetCore>}
 */
export async function createWidgetCore(deps) {
  const shadow = deps.shadow;
  const host = deps.host;
  const doc = deps.doc || document;
  const win = deps.win || window;

  const [
    { synthesize, createPlaybackController },
    { createHighlightEngine, buildTextMap },
  ] = await Promise.all([
    import(chrome.runtime.getURL("lib/zx-player.js")),
    import(chrome.runtime.getURL("lib/highlight-engine.js")),
  ]);

  // ---- <audio> real (caminho feliz); vive no shadow, irmão da UI React ----
  const player = doc.createElement("audio");
  player.id = "zx-player";
  player.hidden = true;
  shadow.appendChild(player);

  // ---- véu do Modo Foco: FORA do shadow (cobre a página, estilos em highlight.css) ----
  const focusVeilEl = doc.createElement("div");
  focusVeilEl.id = "zx-focus-veil";
  doc.documentElement.appendChild(focusVeilEl);

  // ============ ESTADO ============
  let state = {
    voice: "pt-BR-AntonioNeural",
    speed: 1,
    left: null,
    top: null,
    history: [],
    highlight: true,
    autoScroll: true,
    dark: true, // identidade da UI React é escura por padrão (loadState respeita a escolha salva)
    hlColor: "yellow",
    hlStyle: "background",
    hlTrail: false,
    focusMode: false,
    readFont: "page",
    readSpacing: false,
    orientation: "vertical", // pref nova da UI React (padrão vertical, mais discreto)
    startMode: "hidden",     // como o widget nasce em cada página (ver START_MODES)
    idleFade: true,          // esmaece o widget quando ninguém interage
    autoplay: false,         // ao acabar um parágrafo, emenda no próximo
    isPro: false, // Pro persistido localmente; a fonte de verdade é a conta (account)
  };

  // Conta logada, vinda do service worker (seção AUTH do background.js). NUNCA contém
  // token — só {email, name, plan, isPro}. null = deslogado.
  let account = null;
  // Distingue "sei que está deslogado" de "ainda não consegui descobrir". Sem
  // isso, uma consulta que falhou deixava account=null pra sempre e TODO caminho
  // de recuperação (openWidget, foco na janela, openAuth) desistia justamente
  // por ver null — o usuário só saía disso com F5.
  let accountLoaded = false;
  // Tela de autenticação: fechada, formulário, ou confirmação de login. A
  // confirmação é um modal PRÓPRIO (não um pedaço embaixo do formulário), e o
  // núcleo é dono da transição porque é aqui que onAuthenticated() acontece.
  let authView = "closed"; // closed | form | success

  // O backdoor de dev (localStorage.zyrexPro) foi REMOVIDO de propósito: com a
  // auth real na extensão, testar Pro é logar com uma conta cortesia. O flag
  // lia o localStorage DA PÁGINA — qualquer site podia se autopromover a Pro
  // no próprio domínio, e um "modo de teste" que sobrevive ao release é
  // exatamente o tipo de porta que auditoria nenhuma deveria encontrar.

  // ---- flags de reprodução (o resto mora no controller) ----
  let open = false;
  let isPlaying = false;
  let hasActiveReading = false;
  let currentReadingText = "";
  // Sobrevive ao fim da leitura, ao contrário de currentReadingText (que o
  // estado 'idle' limpa). É o que o botão Compartilhar usa quando não há
  // seleção: "o último trecho que você ouviu".
  let lastReadText = "";
  let currentBlocks = [];
  let currentBlockIdx = -1;
  let statusMsg = "";
  let previewLoading = false;
  let lastNotifiedSecond = -1; // throttle do timer: só notifica o React quando o segundo muda
  let hoverRect = null; // {left, top} viewport pro botão de parágrafo (null = escondido)
  let hasSelectionNow = false;
  let readerableChecked = false;
  let readerableResult = false;
  let playerStateStr = "idle";

  // ============ SUBSCRIÇÃO / SNAPSHOT ============
  const listeners = new Set();
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function snapshot() {
    return {
      open,
      mode: isPlaying ? "reading" : "idle",
      playerState: playerStateStr,
      isPlaying,
      hasActiveReading,
      time: controller ? controller.getTime() : 0,
      timeText: fmtTime(controller ? controller.getTime() : 0),
      status: statusMsg,
      hasSelection: hasSelectionNow,
      // Tem algo pra salvar? Vale a seleção viva OU a última capturada (o clique
      // no widget pode ter colapsado a viva) OU a leitura em curso.
      canSave: !!(hasSelectionNow || lastSelectionText || currentReadingText),
      // O que o botão Compartilhar vai publicar. A ordem é a intenção do
      // usuário: o que ele acabou de marcar > o que marcou por último > o que
      // acabou de ouvir. Compartilhar a URL da página (comportamento antigo)
      // não fazia sentido: o botão vive dentro de um leitor de TRECHOS.
      shareText: shareableText(),
      readerableKnown: readerableChecked,
      readerable: readerableResult,
      hover: hoverRect ? { left: hoverRect.left, top: hoverRect.top } : null,
      // O botão de parágrafo é CONTEXTUAL: sobre o parágrafo que está tocando
      // ele vira pause; enquanto o áudio dele gera, vira spinner. Sem isso, o
      // clique no play parecia "não fazer nada" por 1-2s (a síntese do 1º
      // chunk) e não havia como pausar dali mesmo.
      // Compara com o bloco EM CURSO, não com "a sessão tem um bloco só": com
      // autoplay a sessão tem N parágrafos e o botão precisava continuar
      // virando pause sobre o que está tocando.
      hoverMode: (() => {
        if (!hoverTarget || !hasActiveReading) return "play";
        if (playingContainer() !== hoverTarget) return "play";
        if (playerStateStr === "loading") return "loading";
        return isPlaying ? "pause" : "play";
      })(),
      previewLoading,
      historyCount: state.history.length,
      history: state.history.slice(),
      position: state.left != null && state.top != null ? { left: state.left, top: state.top } : null,
      prefs: {
        voice: state.voice,
        speed: state.speed,
        highlight: state.highlight,
        autoScroll: state.autoScroll,
        dark: state.dark,
        hlColor: state.hlColor,
        hlStyle: state.hlStyle,
        hlTrail: state.hlTrail,
        focusMode: state.focusMode,
        readFont: state.readFont,
        readSpacing: state.readSpacing,
        orientation: state.orientation,
        startMode: state.startMode,
        idleFade: state.idleFade,
        autoplay: state.autoplay,
      },
      account,
      authView,
      authOpen: authView !== "closed", // derivado, pra quem só quer "tem modal aberto?"
      // Efetivo = plano da CONTA logada (fonte de verdade, vem do servidor) OU
      // o Pro persistido localmente (setPro — cobre offline e a janela entre
      // o pagamento e o refresh do plano).
      isPro: !!(account && account.isPro) || state.isPro,
    };
  }
  let lastSnapshot = null;
  function notify() {
    lastSnapshot = snapshot();
    listeners.forEach((l) => {
      try { l(lastSnapshot); } catch (_) {}
    });
  }
  function subscribe(listener) {
    // Sem chamada síncrona aqui: o consumidor pega o estado inicial via
    // getState() (useSyncExternalStore faz exatamente isso). Chamar o listener
    // durante o subscribe causaria um render extra à toa no React.
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // ============ STATUS ============
  let statusTimer = null;
  function setStatus(msg, ms = 2500) {
    statusMsg = msg || "";
    clearTimeout(statusTimer);
    if (msg) statusTimer = setTimeout(() => { statusMsg = ""; notify(); }, ms);
    notify();
  }

  // ============ PERSISTÊNCIA (storage sync + local) ============
  async function migrateOldStateIfNeeded() {
    let old;
    try {
      const result = await chrome.storage.local.get(OLD_STORAGE_KEY);
      old = result[OLD_STORAGE_KEY];
    } catch (_) { return; }
    if (!old || typeof old !== "object") return;
    const prefs = {
      voice: old.voice || "pt-BR-AntonioNeural",
      speed: old.speed || 1,
      highlight: old.highlight !== false,
      autoScroll: old.autoScroll !== false,
      dark: old.dark === true,
    };
    const local = {
      left: typeof old.left === "number" ? old.left : null,
      top: typeof old.top === "number" ? old.top : null,
      history: Array.isArray(old.history)
        ? old.history
            .map((h) => (typeof h === "string" ? { text: h, title: "", url: "", date: 0 } : h))
            .filter((h) => h && h.text)
            .slice(0, MAX_HISTORY)
        : [],
    };
    try {
      await chrome.storage.sync.set({ [PREFS_KEY]: prefs });
      await chrome.storage.local.set({ [LOCAL_KEY]: local });
      await chrome.storage.local.remove(OLD_STORAGE_KEY);
    } catch (_) {}
  }

  async function loadState() {
    await migrateOldStateIfNeeded();
    let prefsSaved = {};
    let localSaved = {};
    try {
      const result = await chrome.storage.sync.get(PREFS_KEY);
      prefsSaved = result[PREFS_KEY] || {};
    } catch (_) {}
    try {
      const result = await chrome.storage.local.get(LOCAL_KEY);
      localSaved = result[LOCAL_KEY] || {};
    } catch (_) {}
    // Conta pelo ESPELHO, antes de falar com o service worker. É o caminho que
    // mata o "tem que dar F5 pra o Pro aparecer": o espelho zyrex_account é
    // público por projeto (sem token nenhum), mora em storage.local e NÃO
    // depende do SW estar acordado — e o caso clássico é justamente o content
    // script subir antes do service worker. O askBackground que vem depois só
    // confirma ou corrige.
    try {
      const result = await chrome.storage.local.get(ACCOUNT_KEY);
      const mirrored = result[ACCOUNT_KEY];
      if (mirrored && mirrored.email) {
        account = mirrored;
        accountLoaded = true;
      }
    } catch (_) {}
    state = {
      voice: prefsSaved.voice || "pt-BR-AntonioNeural",
      speed: prefsSaved.speed || 1,
      highlight: prefsSaved.highlight !== false,
      autoScroll: prefsSaved.autoScroll !== false,
      // Default escuro (identidade), mas respeita quem já salvou "claro" (false).
      dark: prefsSaved.dark !== false,
      hlColor: enumOr(prefsSaved.hlColor, HL_COLORS, "yellow"),
      hlStyle: enumOr(prefsSaved.hlStyle, HL_STYLES, "background"),
      hlTrail: prefsSaved.hlTrail === true,
      focusMode: prefsSaved.focusMode === true,
      readFont: enumOr(prefsSaved.readFont, READ_FONTS, "page"),
      readSpacing: prefsSaved.readSpacing === true,
      orientation: enumOr(prefsSaved.orientation, ORIENTATIONS, "vertical"),
      startMode: enumOr(prefsSaved.startMode, START_MODES, "hidden"),
      idleFade: prefsSaved.idleFade !== false,
      // Default DESLIGADO (=== true, não !== false): ligar por padrão mudaria
      // em silêncio o que já acontece hoje quando alguém aperta play.
      autoplay: prefsSaved.autoplay === true,
      // Pro REAL persistido (auth/setPro). O dev flag NÃO entra aqui: ele é um
      // overlay só de leitura aplicado no snapshot(), pra não vazar pro storage.
      isPro: prefsSaved.isPro === true,
      left: typeof localSaved.left === "number" ? localSaved.left : null,
      top: typeof localSaved.top === "number" ? localSaved.top : null,
      history: Array.isArray(localSaved.history)
        ? localSaved.history
            .map((h) => (typeof h === "string" ? { text: h, title: "", url: "", date: 0 } : h))
            .filter((h) => h && h.text)
            .slice(0, MAX_HISTORY)
        : [],
    };
  }

  let applyingRemoteChange = false;
  function savePrefsDebounced() {
    clearTimeout(savePrefsDebounced._t);
    savePrefsDebounced._t = setTimeout(() => {
      if (applyingRemoteChange) return;
      const prefs = {
        voice: state.voice, speed: state.speed, highlight: state.highlight,
        autoScroll: state.autoScroll, dark: state.dark, hlColor: state.hlColor,
        hlStyle: state.hlStyle, hlTrail: state.hlTrail, focusMode: state.focusMode,
        readFont: state.readFont, readSpacing: state.readSpacing, orientation: state.orientation,
        startMode: state.startMode, idleFade: state.idleFade,
        autoplay: state.autoplay,
        isPro: state.isPro,
      };
      chrome.storage.sync.set({ [PREFS_KEY]: prefs }).catch(() => {});
    }, 500);
  }
  function saveLocalDebounced() {
    clearTimeout(saveLocalDebounced._t);
    saveLocalDebounced._t = setTimeout(() => {
      if (applyingRemoteChange) return;
      const local = { left: state.left, top: state.top, history: state.history };
      chrome.storage.local.set({ [LOCAL_KEY]: local }).catch(() => {});
    }, 300);
  }

  // ============ TEMA (atributos na PÁGINA — highlight.css lê daqui) ============
  function applyPageTheme() {
    doc.documentElement.setAttribute("data-zx-theme", state.dark ? "dark" : "light");
    doc.documentElement.setAttribute("data-zx-hl-color", state.hlColor);
    doc.documentElement.setAttribute("data-zx-hl-style", state.hlStyle);
  }

  // ============ RETARGETING (Shadow DOM) ============
  function eventInWidget(e) {
    if (typeof e.composedPath === "function") {
      try { return e.composedPath().includes(host); } catch (_) {}
    }
    const t = e.target;
    return !!(t && (t === host || host.contains(t)));
  }
  function isWidgetNode(node) {
    if (!node) return false;
    if (node === host || host.contains(node)) return true;
    return typeof node.getRootNode === "function" && node.getRootNode() === shadow;
  }

  // ============ MOTOR DE DESTAQUE ============
  const engine = createHighlightEngine({
    ignoreEl: host,
    onDegraded: () => setStatus("O texto mudou — seguindo só com o áudio.", 3000),
    onActiveWord: handleActiveWord,
  });
  let engineTarget = null;
  let currentEngineChunk = null;
  let currentEngineSubtitle = null;

  function blockTarget(block) {
    if (block.range) {
      try {
        const r = block.range;
        if (!r.collapsed && r.startContainer.isConnected && r.endContainer.isConnected) return r;
      } catch (_) {}
      return null;
    }
    return block.container && block.container.isConnected ? block.container : null;
  }
  function blockTextFor(block, target) {
    if (target) {
      try {
        const flat = buildTextMap(target).flatText;
        if (flat && flat.trim()) return flat;
      } catch (_) {}
    }
    return block.text || "";
  }

  // ============ AUTO-SCROLL (item 3.7) ============
  const AUTO_SCROLL_SUSPEND_MS = 4000;
  const AUTO_SCROLL_FALLBACK_MS = 600;
  const prefersReducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");
  let autoScrollBusy = false;
  let autoScrollBusyTimer = null;
  let manualScrollUntil = 0;
  let lastScrollSentence = -1;
  function unlockAutoScroll() {
    autoScrollBusy = false;
    clearTimeout(autoScrollBusyTimer);
    win.removeEventListener("scrollend", unlockAutoScroll);
  }
  function lockAutoScroll() {
    autoScrollBusy = true;
    win.addEventListener("scrollend", unlockAutoScroll);
    clearTimeout(autoScrollBusyTimer);
    autoScrollBusyTimer = setTimeout(unlockAutoScroll, AUTO_SCROLL_FALLBACK_MS);
  }
  function handleActiveWord(range, info) {
    if (!state.autoScroll || !isPlaying) return;
    if (autoScrollBusy || Date.now() < manualScrollUntil) return;
    const reduced = prefersReducedMotion.matches;
    if (reduced && !info.sentenceChanged) return;
    let rect = null;
    try { rect = range.getBoundingClientRect(); } catch (_) { return; }
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const vh = win.innerHeight;
    if (rect.top >= vh * 0.2 && rect.bottom <= vh * 0.75) return;
    if (info.sentenceIdx === lastScrollSentence) return;
    lastScrollSentence = info.sentenceIdx;
    lockAutoScroll();
    try {
      win.scrollTo({
        top: Math.max(0, rect.top + win.scrollY - vh * 0.35),
        behavior: reduced ? "auto" : "smooth",
      });
    } catch (_) { unlockAutoScroll(); }
  }
  function suspendAutoScroll(e) {
    if (eventInWidget(e)) return;
    manualScrollUntil = Date.now() + AUTO_SCROLL_SUSPEND_MS;
  }
  const SCROLL_KEYS = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "PageUp", "PageDown", "Home", "End", " ",
  ]);
  function onScrollKey(e) { if (SCROLL_KEYS.has(e.key)) suspendAutoScroll(e); }

  // ============ MODO FOCO (item 6.2) ============
  const FOCUS_VEIL_PADDING = 12;
  let focusVeilTarget = null;
  let lastReadingContainer = null;
  function positionFocusVeil() {
    if (!focusVeilEl || !focusVeilTarget) return;
    let rect = null;
    try { rect = focusVeilTarget.getBoundingClientRect(); } catch (_) { return; }
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const pad = FOCUS_VEIL_PADDING;
    focusVeilEl.style.top = (rect.top - pad) + "px";
    focusVeilEl.style.left = (rect.left - pad) + "px";
    focusVeilEl.style.width = (rect.width + pad * 2) + "px";
    focusVeilEl.style.height = (rect.height + pad * 2) + "px";
  }
  function updateFocusVeil(container) {
    if (container !== undefined) lastReadingContainer = container;
    if (!focusVeilEl) return;
    const target = state.focusMode && hasActiveReading ? lastReadingContainer : null;
    if (!target) {
      focusVeilEl.classList.remove("zx-focus-active", "zx-focus-dim");
      focusVeilTarget = null;
      return;
    }
    focusVeilTarget = target;
    positionFocusVeil();
    const dim = !isPlaying;
    focusVeilEl.classList.toggle("zx-focus-dim", dim);
    focusVeilEl.classList.add("zx-focus-active");
  }

  // ============ TIPOGRAFIA NO TRECHO LIDO (item 6.3) ============
  let fontFaceInjected = false;
  function ensureFontFace() {
    if (fontFaceInjected) return;
    fontFaceInjected = true;
    try {
      const style = doc.createElement("style");
      style.textContent = `
@font-face { font-family: "Atkinson Hyperlegible"; src: url("${chrome.runtime.getURL("fonts/atkinson-400.woff2")}") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Atkinson Hyperlegible"; src: url("${chrome.runtime.getURL("fonts/atkinson-700.woff2")}") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "OpenDyslexic"; src: url("${chrome.runtime.getURL("fonts/opendyslexic-400.woff2")}") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Lexend"; src: url("${chrome.runtime.getURL("fonts/lexend-400.woff2")}") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
      `;
      doc.documentElement.appendChild(style);
    } catch (_) { fontFaceInjected = false; }
  }
  let typoTarget = null;
  function applyReadingTypo(container) {
    if (typoTarget && typoTarget !== container) clearReadingTypo();
    if (!container) return;
    const wantsFont = state.readFont !== "page";
    if (wantsFont) ensureFontFace();
    if (!wantsFont && !state.readSpacing) {
      if (typoTarget === container) clearReadingTypo();
      return;
    }
    container.classList.add("zx-reading-typo");
    container.classList.toggle("zx-reading-spacing", !!state.readSpacing);
    if (wantsFont) container.setAttribute("data-zx-read-font", state.readFont);
    else container.removeAttribute("data-zx-read-font");
    typoTarget = container;
  }
  function clearReadingTypo() {
    if (!typoTarget) return;
    try {
      typoTarget.classList.remove("zx-reading-typo", "zx-reading-spacing");
      typoTarget.removeAttribute("data-zx-read-font");
    } catch (_) {}
    typoTarget = null;
  }

  // ============ CONTROLLER + FALLBACK OFFSCREEN (item 4.3) ============
  function buildController(audioEl) {
    return createPlaybackController({
      audioEl,
      transport: bgTransport,
      getVoice: () => state.voice,
      getSpeed: () => state.speed,
      onState: renderPlayerState,
      onStatus: setStatus,
      onChunkChange: handleChunkChange,
      onWordTick: (chunk, mediaTime) => {
        // Roda por rAF (~60fps). O destaque e o véu precisam dessa cadência,
        // mas a UI só mostra segundos inteiros — notificar o React a cada frame
        // re-renderizaria o App 60×/s à toa. Só notifica quando o segundo
        // exibido muda (o clique-na-palavra/seek chamam notify() por conta).
        if (state.highlight) engine.tick(mediaTime);
        if (focusVeilTarget) positionFocusVeil();
        const sec = Math.floor(controller.getTime());
        if (sec !== lastNotifiedSecond) {
          lastNotifiedSecond = sec;
          notify();
        }
      },
      onSessionEnd: handleSessionEnd,
    });
  }

  let sessionEverPlayed = false;
  let triedOffscreenFallback = false;
  let usingOffscreen = false;
  let offscreenShim = null;
  function inFallbackAttemptWindow() {
    return hasActiveReading && !sessionEverPlayed && !usingOffscreen;
  }
  function onPlayerError() {
    if (!inFallbackAttemptWindow() || triedOffscreenFallback) return;
    triedOffscreenFallback = true;
    const blocksToRetry = currentBlocks.slice();
    if (!blocksToRetry.length) return;
    switchToOffscreenFallback(blocksToRetry);
  }
  player.addEventListener("error", onPlayerError);

  async function switchToOffscreenFallback(blocks) {
    controller.dispose();
    setStatus("Tentando um modo de reprodução alternativo...");
    try {
      const { createOffscreenAudioShim } = await import(chrome.runtime.getURL("offscreen-player.js"));
      const ok = await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: "zyrex:off:ensure" }, (resp) => {
            resolve(!chrome.runtime.lastError && resp && resp.ok);
          });
        } catch (_) { resolve(false); }
      });
      if (!ok) throw new Error("offscreen indisponível");
      offscreenShim = createOffscreenAudioShim();
      usingOffscreen = true;
      controller = buildController(offscreenShim);
      offscreenShim.addEventListener("error", () => {
        setStatus("Não foi possível reproduzir o áudio neste site.");
      });
      controller.setRate(state.speed);
      controller.start(blocks);
    } catch (_) {
      usingOffscreen = false;
      offscreenShim = null;
      setStatus("Não foi possível reproduzir o áudio neste site.");
    }
  }

  let controller = buildController(player);

  function renderPlayerState(st) {
    playerStateStr = st;
    hasActiveReading = st === "loading" || st === "ready" || st === "playing" || st === "paused";
    isPlaying = st === "loading" || st === "ready" || st === "playing";
    if (st === "playing") sessionEverPlayed = true;
    if (st === "idle") {
      engine.endSession();
      engineTarget = null;
      currentEngineChunk = null;
      currentEngineSubtitle = null;
      currentReadingText = "";
      currentBlocks = [];
      currentBlockIdx = -1;
      updateFocusVeil(null);
      clearReadingTypo();
    } else if (st !== "ended") {
      updateFocusVeil();
    } else {
      updateFocusVeil();
    }
    notify();
  }

  function handleChunkChange(chunk) {
    const container = chunk.container || null;
    const blockChanged = chunk.blockIdx !== currentBlockIdx;
    if (state.highlight) {
      if (container && container.isConnected) {
        if (container !== engineTarget) {
          try {
            engine.startSession(container, { trail: state.hlTrail });
            engineTarget = container;
            lastScrollSentence = -1;
          } catch (_) { engineTarget = null; }
        }
      } else if (engineTarget instanceof Element) {
        engine.endSession();
        engineTarget = null;
      }
      engine.setChunkSubtitle(chunk, chunk.subtitle);
      currentEngineChunk = chunk;
      currentEngineSubtitle = chunk.subtitle;
    }
    if (blockChanged && container && container.isConnected && currentBlocks.length > 1 && state.autoScroll) {
      const wordScrollActive = state.highlight && engine.isSupported;
      if (!wordScrollActive && Date.now() >= manualScrollUntil) {
        try { container.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
      }
    }
    if (blockChanged) {
      const typoAndVeilTarget = container && container.isConnected ? container : null;
      updateFocusVeil(typoAndVeilTarget);
      applyReadingTypo(typoAndVeilTarget);
    }
    currentBlockIdx = chunk.blockIdx;
  }

  function handleSessionEnd() {
    setTimeout(() => {
      if (!hasActiveReading) {
        engine.endSession();
        engineTarget = null;
        currentEngineChunk = null;
        currentEngineSubtitle = null;
      }
    }, 1000);
  }

  function resetToInPageController() {
    if (usingOffscreen) {
      try { chrome.runtime.sendMessage({ type: "zyrex:off:stop" }, () => void chrome.runtime.lastError); } catch (_) {}
      controller.dispose();
      if (offscreenShim) offscreenShim.destroy();
      usingOffscreen = false;
      offscreenShim = null;
      controller = buildController(player);
    }
    sessionEverPlayed = false;
    triedOffscreenFallback = false;
  }

  function startReading(blocks) {
    const cleaned = [];
    (blocks || []).forEach((b) => {
      const target = blockTarget(b);
      const text = blockTextFor(b, target);
      if (!text.trim()) return;
      cleaned.push({
        text,
        container: target && !(target instanceof Range) ? target : null,
        range: target instanceof Range ? target : null,
      });
    });
    if (!cleaned.length) { setStatus("Selecione um texto primeiro."); return; }
    resetToInPageController();
    engine.endSession();
    engineTarget = null;
    currentEngineChunk = null;
    currentEngineSubtitle = null;
    lastScrollSentence = -1;
    currentBlocks = cleaned;
    currentBlockIdx = -1;
    currentReadingText = cleaned.map((b) => b.text.trim()).join("\n\n");
    lastReadText = currentReadingText;
    if (state.highlight && cleaned.length === 1 && cleaned[0].range) {
      try {
        engine.startSession(cleaned[0].range, { trail: state.hlTrail });
        engineTarget = cleaned[0].range;
      } catch (_) { engineTarget = null; }
    }
    controller.start(cleaned);
  }
  function stopReading() { controller.stop(); }

  // ============ SELEÇÃO ============
  let lastSelectionText = "";
  let lastSelectionRange = null;
  function grabSelectionText() {
    const sel = win.getSelection();
    const s = sel ? sel.toString().trim() : "";
    return s || lastSelectionText;
  }
  function hasActiveSelection() {
    const sel = win.getSelection();
    return !!(sel && sel.toString().trim());
  }
  function captureSelection(sel) {
    const text = sel ? sel.toString().trim() : "";
    if (!text) return;
    lastSelectionText = text;
    try {
      lastSelectionRange = sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    } catch (_) { lastSelectionRange = null; }
  }
  function startSelectionReading() {
    if (lastSelectionRange) {
      startReading([{ text: grabSelectionText(), range: lastSelectionRange }]);
    } else {
      startReading([{ text: grabSelectionText() }]);
    }
  }
  // Comparação tolerante entre o texto que o Chrome mandou no menu de contexto
  // (info.selectionText, com espaços normalizados de um jeito próprio) e o do
  // Range capturado. Só precisa ser boa o bastante pra confirmar que os dois
  // falam da MESMA seleção antes de preferir o Range (que é o que dá destaque).
  function sameSelectionText(a, b) {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const x = norm(a);
    const y = norm(b);
    if (!x || !y) return false;
    if (x === y) return true;
    // Chrome trunca info.selectionText em seleções muito longas.
    return x.length > 40 && (y.startsWith(x.slice(0, 40)) || x.startsWith(y.slice(0, 40)));
  }
  // "Ler com Dislexfy" (menu de contexto). Antes isto caía sempre em
  // startReading([{text}]) — texto puro, SEM Range —, e por isso a leitura
  // rodava sem destaque de palavra, sem Modo Foco e sem tipografia do trecho.
  // Agora o Range vivo/capturado tem prioridade; o texto do menu só entra como
  // rede de segurança (seleção em iframe, campo de formulário, Range morto).
  function startContextMenuReading(text) {
    const sel = win.getSelection();
    if (sel && sel.toString().trim()) captureSelection(sel);
    if (lastSelectionRange && (!text || sameSelectionText(text, lastSelectionText))) {
      const target = blockTarget({ range: lastSelectionRange });
      if (target) {
        startReading([{ text: grabSelectionText(), range: lastSelectionRange }]);
        return;
      }
    }
    if (text) startReading([{ text }]);
    else startSelectionReading();
  }

  // ============ LER TUDO ============
  function extractReadableBlocks() {
    const scope = doc.querySelector("article") || doc.querySelector("main") || doc.body;
    const candidates = [];
    scope.querySelectorAll(READABLE).forEach((el) => {
      if (isWidgetNode(el)) return;
      if (typeof el.checkVisibility === "function" && !el.checkVisibility()) return;
      if (!el.textContent || el.textContent.trim().length < 16) return;
      candidates.push(el);
    });
    return candidates
      .filter((el) => !candidates.some((other) => other !== el && el.contains(other)))
      .map((el) => ({ text: el.textContent.trim(), container: el }));
  }
  function startReadAll() {
    const blocks = extractReadableBlocks();
    if (!blocks.length) { setStatus("Não encontrei texto legível nesta página."); return; }
    startReading(blocks);
  }

  // ============ CLIQUE NA PÁGINA: pular palavra OU encerrar ============
  const CLICK_SEEK_IGNORE =
    'a, button, input, select, textarea, [contenteditable], summary, ' +
    'label, [role="button"], [role="link"], audio, video';

  // O clique caiu DENTRO do que está sendo lido? Serve pra separar "quero
  // pular pra esta palavra" de "acabei com esta leitura".
  function clickInsideReading(target) {
    if (!target) return false;
    return currentBlocks.some((b) => {
      if (b.container) return b.container === target || b.container.contains(target);
      if (b.range) {
        // Aproximação boa o bastante: o ancestral comum do Range delimita a
        // região destacada. Range.comparePoint seria exato, mas lança em nós
        // de outro documento — não vale o risco por um ganho invisível.
        const scope = b.range.commonAncestorContainer;
        const el = scope && scope.nodeType === Node.ELEMENT_NODE ? scope : scope && scope.parentElement;
        return !!(el && (el === target || el.contains(target)));
      }
      return false;
    });
  }

  function onDocClickSeek(e) {
    if (!hasActiveReading) return;
    const st = controller.getState();
    if (st !== "playing" && st !== "paused" && st !== "ready") return;
    const t = e.target;
    if (!t || !t.closest) return;
    if (eventInWidget(e)) return;
    if (hasActiveSelection()) return;

    // Dentro do trecho em leitura: clicar numa palavra pula pra ela.
    if (state.highlight && !t.closest(CLICK_SEEK_IGNORE)) {
      let hit = null;
      try { hit = engine.hitTest(e.clientX, e.clientY); } catch (_) {}
      if (hit && hit.chunkIdx >= 0) {
        e.preventDefault();
        e.stopPropagation();
        controller.seekTo(hit.chunkIdx, hit.tStart);
        notify();
        return;
      }
    }

    // Fora dele: o usuário seguiu a vida. Encerrar é o que ele espera — antes
    // a leitura continuava tocando e o destaque ficava preso na tela mesmo
    // depois de pausar, sem jeito óbvio de limpar. NÃO chamamos preventDefault
    // aqui: se o clique era num link ou botão da página, ele tem que funcionar
    // normalmente; só a leitura para.
    if (clickInsideReading(t)) return;
    stopReading();
  }

  // ============ DOWNLOAD DO MP3 ============
  function downloadFileName(text) {
    const slug = (text || "")
      .split(/\s+/).slice(0, 6).join(" ")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "");
    return (slug || "zyrex-audio") + ".mp3";
  }
  async function downloadAudio() {
    const text = currentReadingText;
    let blob = null;
    try {
      blob = await controller.downloadBlob();
    } catch (err) {
      if (err && err.name === "AbortError") return;
      setStatus(err && err.message ? err.message : "Falha ao preparar o download.");
      return;
    }
    if (!blob) { setStatus("Nenhum áudio para baixar."); return; }
    const url = URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = downloadFileName(text);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ============ BOTÃO DE PARÁGRAFO (hover) ============
  // O core detecta o alvo e expõe a posição (viewport) do botão; a UI React
  // renderiza e anima o botão, chamando readHover() no clique.
  //
  // Regra difícil aprendida em teste real: o caminho do cursor ATÉ o botão
  // passa por fora do parágrafo, e ao sair do <p> pela esquerda o cursor entra
  // no ANCESTRAL (<article>/<li>), que antes roubava o hover e fazia o botão
  // "pular" pra borda do contêiner, longe do texto.
  //
  // A correção é o CORREDOR SEGURO: a união do retângulo do alvo com o do
  // botão, mais uma folga. Enquanto o ponteiro está dentro dele, o botão não
  // some NEM troca de alvo — o que permite manter o botão PARADO (ver
  // computeHoverRect) em vez de fazê-lo perseguir o cursor.
  const PARA_BTN_W = 28;
  const PARA_BTN_H = 28;
  const PARA_GAP = 6;   // respiro entre o botão e a borda esquerda do parágrafo
  const PARA_SAFE_PAD = 14; // folga do corredor (cobre tremor de mão)
  let hoverTarget = null;
  let hoverTargetRect = null; // retângulo do alvo no momento do último cálculo
  let paraHideTimer = null;
  let paraKept = false;
  let pointerX = 0;
  let pointerY = 0;
  // Posição FIXA por parágrafo: sempre no topo dele, nunca acompanhando o
  // cursor. Cheguei a fazer o botão seguir a altura do ponteiro pra encurtar o
  // trajeto, e o resultado foi um play deslizando pelo texto — irritante e
  // difícil de acertar, porque o alvo se move junto com a mão. Quem resolve o
  // trajeto é o corredor seguro (pointerInSafeZone), não o movimento do botão.
  // Aqui ele só pula de parágrafo em parágrafo, e fica parado no resto.
  function computeHoverRect(target) {
    let rect;
    try { rect = target.getBoundingClientRect(); } catch (_) { return null; }
    if (!rect) return null;
    hoverTargetRect = rect;
    // À esquerda do parágrafo; clamp pra nunca sumir fora da viewport.
    const left = Math.max(2, rect.left - PARA_BTN_W - PARA_GAP);
    // Topo do parágrafo, preso dentro dele E dentro da viewport — num
    // parágrafo mais alto que a tela, o topo pode estar fora de vista.
    const minTop = 8;
    const maxTop = Math.min(rect.bottom - PARA_BTN_H, win.innerHeight - PARA_BTN_H - 8);
    const top = Math.min(Math.max(rect.top + 3, minTop), Math.max(minTop, maxTop));
    return { left, top };
  }
  // O ponteiro está dentro do parágrafo (e não sobre um filho interativo)?
  function pointerInsideTarget(x, y) {
    if (!hoverTargetRect) return false;
    const r = hoverTargetRect;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  // O ponteiro está no corredor parágrafo→botão (com folga)?
  function pointerInSafeZone(x, y) {
    if (!hoverTargetRect || !hoverRect) return false;
    const r = hoverTargetRect;
    const left = Math.min(r.left, hoverRect.left) - PARA_SAFE_PAD;
    const right = Math.max(r.right, hoverRect.left + PARA_BTN_W) + PARA_SAFE_PAD;
    const top = Math.min(r.top, hoverRect.top) - PARA_SAFE_PAD;
    const bottom = Math.max(r.bottom, hoverRect.top + PARA_BTN_H) + PARA_SAFE_PAD;
    return x >= left && x <= right && y >= top && y <= bottom;
  }
  function showParaBtn(target) {
    clearTimeout(paraHideTimer);
    const isNewTarget = hoverTarget !== target;
    hoverTarget = target;
    hoverRect = computeHoverRect(target);
    // Parar o cursor sobre um parágrafo é o sinal de intenção mais antecipado
    // que existe — vários segundos antes do clique no play. Acordar a lambda
    // aqui é o que mais corta o tempo até a voz começar.
    if (isNewTarget) warmUpViaSW();
    notify();
  }
  function hideParaBtnDelayed() {
    clearTimeout(paraHideTimer);
    paraHideTimer = setTimeout(() => {
      if (paraKept) return;
      // Última checagem antes de sumir: se o ponteiro voltou pro corredor
      // (ou parou em cima do botão) no meio do timer, o botão fica.
      if (pointerInSafeZone(pointerX, pointerY)) return;
      hoverTarget = null;
      hoverTargetRect = null;
      hoverRect = null;
      notify();
    }, PARA_HIDE_DELAY);
  }
  function hideParaBtnNow() {
    clearTimeout(paraHideTimer);
    hoverTarget = null;
    hoverTargetRect = null;
    hoverRect = null;
    paraKept = false;
    notify();
  }
  // Elegível a virar alvo do botão? (usado pelo mouseover E pelo pointermove)
  //
  // O pointermove dispara a cada frame, então memorizamos o último elemento
  // consultado: varrer ancestrais e ler textContent de um <article> inteiro
  // 60×/s numa página grande custa caro e o resultado nunca muda enquanto o
  // cursor não troca de elemento.
  let lastCandidateEl = null;
  let lastCandidateResult = null;
  function paraCandidate(e) {
    const t = e.target;
    if (!t || !t.closest) return null;
    if (t === lastCandidateEl) return lastCandidateResult;
    lastCandidateEl = t;
    lastCandidateResult = null;
    const el = t.closest(HOVER_READABLE);
    if (!el) return null;
    if (!el.textContent || el.textContent.trim().length < 16) return null;
    // Segunda trava contra contêiner: um <li> ou <blockquote> que embrulha
    // outros blocos de texto é estrutura, não parágrafo. Ancorar o botão nele
    // colocaria o play longe do texto que o usuário está de fato lendo — então
    // devolvemos null e o alvo ANTERIOR (o parágrafo certo) permanece.
    if (hasReadableChild(el)) return null;
    lastCandidateResult = el;
    return el;
  }
  function hasReadableChild(el) {
    try {
      // Roda uma vez por elemento (o memo de paraCandidate segura o resto);
      // num <p> comum o querySelectorAll não encontra nada e sai barato.
      for (const child of el.querySelectorAll(HOVER_READABLE)) {
        if (child.textContent && child.textContent.trim().length >= 16) return true;
      }
    } catch (_) {}
    return false;
  }
  function onDocMouseOver(e) {
    if (!open) return;
    if (eventInWidget(e)) return;
    if (hasActiveSelection()) return;
    const el = paraCandidate(e);
    if (!el) return;
    if (hoverTarget === el) { clearTimeout(paraHideTimer); return; }
    // Não troca de alvo enquanto o usuário está indo até o botão — é
    // exatamente aí que o ancestral <article>/<li> roubava o hover.
    if (hoverTarget && (paraKept || pointerInSafeZone(e.clientX, e.clientY))) return;
    showParaBtn(el);
  }
  function onDocMouseOut(e) {
    if (!hoverTarget || !e.target || !e.target.closest) return;
    const leavingTarget = (e.target === hoverTarget) || (hoverTarget.contains && hoverTarget.contains(e.target));
    if (!leavingTarget) return;
    const to = e.relatedTarget;
    if (to && (isWidgetNode(to) || (hoverTarget.contains && hoverTarget.contains(to)))) return;
    hideParaBtnDelayed();
  }
  // Fonte de verdade do "para onde o cursor está indo". O mouseout sozinho não
  // basta: ele não sabe distinguir "saiu pra clicar no play" de "saiu de vez".
  function onDocPointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (!open) return;
    if (eventInWidget(e)) return; // sobre o widget/botão: quem manda é keepHover()
    if (!hoverTarget) {
      // Re-aquisição: depois de um clique na página (que esconde o botão) o
      // mouseover não dispara de novo no MESMO parágrafo — sem isto, o play só
      // voltaria depois de passear por outro elemento.
      if (hasActiveSelection()) return;
      const el = paraCandidate(e);
      if (el) showParaBtn(el);
      return;
    }
    if (pointerInsideTarget(e.clientX, e.clientY)) {
      // Dentro do parágrafo: só segura o botão vivo. NÃO recalcula a posição —
      // é isso que o mantém parado enquanto o cursor varre o texto.
      clearTimeout(paraHideTimer);
      return;
    }
    if (pointerInSafeZone(e.clientX, e.clientY)) {
      clearTimeout(paraHideTimer); // no corredor: congela o botão onde está
      return;
    }
    hideParaBtnDelayed();
  }
  /** O parágrafo que está tocando agora (ou null). Vale pra sessão de 1 bloco
   *  e pra sessão contínua do autoplay — daí comparar com currentBlockIdx em
   *  vez de assumir que a sessão tem um bloco só. */
  function playingContainer() {
    if (!hasActiveReading) return null;
    const i = currentBlockIdx >= 0 ? currentBlockIdx : 0;
    const b = currentBlocks[i];
    return (b && b.container) || null;
  }
  function readHover() {
    if (!hoverTarget) return;
    const target = hoverTarget;
    // Clicar no parágrafo que já está tocando é pausar/retomar — inclusive no
    // meio de uma leitura contínua.
    if (playingContainer() === target) {
      controller.togglePlayPause();
      return;
    }
    if (state.autoplay) {
      // Leitura contínua: monta a sessão do parágrafo clicado até o fim do
      // conteúdo legível. Não pré-carrega nada — o zx-player sintetiza cada
      // pedaço quando chega nele (com prefetch de 1 à frente, o suficiente pra
      // a emenda entre parágrafos não ter buraco). É a MESMA máquina que o
      // "Ler página inteira" usa; a única diferença é onde a fila começa.
      const blocks = extractReadableBlocks();
      const from = blocks.findIndex((b) => b.container === target);
      if (from >= 0) {
        startReading(blocks.slice(from));
        return;
      }
      // Parágrafo fora da lista legível (hover pega mais coisa que a extração):
      // lê só ele, que é melhor que não ler nada.
    }
    startReading([{ text: (target.textContent || "").trim(), container: target }]);
  }

  // ============ MODO LEITURA — overlay + iframe (item 5.4/5.5) ============
  const readerModuleUrl = chrome.runtime.getURL("lib/extract.js");
  let extractModulePromise = null;
  function loadExtractModule() {
    if (!extractModulePromise) extractModulePromise = import(readerModuleUrl);
    return extractModulePromise;
  }
  function ensureReaderableChecked() {
    if (readerableChecked) return;
    loadExtractModule()
      .then(({ isProbablyReaderable }) => {
        readerableChecked = true;
        readerableResult = !!isProbablyReaderable(doc);
        notify();
      })
      .catch(() => { readerableChecked = true; readerableResult = false; notify(); });
  }

  const READER_OVERLAY_TAG = "zyrex-tts-reader-overlay";
  let overlayHost = null;
  let overlayIframe = null;
  let overlayCurrentId = null;
  let restoreScrollFn = null;
  function lockHostScroll() {
    const docEl = doc.documentElement;
    const prevOverflow = docEl.style.overflow;
    docEl.style.overflow = "hidden";
    restoreScrollFn = () => { docEl.style.overflow = prevOverflow; };
  }
  function buildOverlayHost(id, { fromSelection = false } = {}) {
    const overlayShadowHost = doc.createElement(READER_OVERLAY_TAG);
    overlayShadowHost.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:block;";
    const overlayShadow = overlayShadowHost.attachShadow({ mode: "closed" });
    const style = doc.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .zx-reader-frame-wrap { position: fixed; inset: 0; background: rgba(20,20,22,0.55); }
      iframe { display: block; width: 100%; height: 100%; border: 0; background: #FAF9F6; }
    `;
    const wrap = doc.createElement("div");
    wrap.className = "zx-reader-frame-wrap";
    const iframe = doc.createElement("iframe");
    iframe.title = fromSelection ? "Modo Leitura — seleção" : "Modo Leitura";
    iframe.src = chrome.runtime.getURL("reader/reader.html") + `#id=${encodeURIComponent(id)}`;
    wrap.appendChild(iframe);
    overlayShadow.appendChild(style);
    overlayShadow.appendChild(wrap);
    overlayIframe = iframe;
    return overlayShadowHost;
  }
  function closeReaderOverlay({ keepArticle = false } = {}) {
    if (!overlayHost) return;
    const id = overlayCurrentId;
    overlayHost.remove();
    overlayHost = null;
    overlayIframe = null;
    overlayCurrentId = null;
    if (restoreScrollFn) { restoreScrollFn(); restoreScrollFn = null; }
    doc.removeEventListener("keydown", onOverlayKeydown, true);
    win.removeEventListener("message", onReaderMessage);
    if (id && !keepArticle) {
      try {
        chrome.runtime.sendMessage({ type: "zyrex:clear-article", id }, () => void chrome.runtime.lastError);
      } catch (_) {}
    }
  }
  function onOverlayKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeReaderOverlay();
    }
  }
  function onReaderMessage(event) {
    if (!overlayIframe || event.source !== overlayIframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "zyrex-reader") return;
    if (data.type === "zx-reader:close") {
      closeReaderOverlay();
    } else if (data.type === "zx-reader:popout" && data.id) {
      try {
        chrome.runtime.sendMessage(
          { type: "zyrex:open-reader-tab", id: data.id, position: data.position || null },
          () => void chrome.runtime.lastError
        );
      } catch (_) {}
      closeReaderOverlay({ keepArticle: true });
    }
  }
  function openReaderOverlayWithId(id, opts) {
    closeReaderOverlay();
    if (hasActiveReading) stopReading();
    overlayCurrentId = id;
    overlayHost = buildOverlayHost(id, opts);
    doc.documentElement.appendChild(overlayHost);
    lockHostScroll();
    doc.addEventListener("keydown", onOverlayKeydown, true);
    win.addEventListener("message", onReaderMessage);
  }
  async function saveArticleAndOpenOverlay(article, opts) {
    let resp;
    try {
      resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "zyrex:save-article", article }, (r) => {
          resolve(chrome.runtime.lastError ? null : r);
        });
      });
    } catch (_) { resp = null; }
    if (!resp || !resp.ok || !resp.id) {
      setStatus("Não foi possível abrir o Modo Leitura agora.");
      return;
    }
    openReaderOverlayWithId(resp.id, opts);
  }
  function buildSelectionArticle(text) {
    const escaped = String(text || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const paragraphs = escaped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const html = (paragraphs.length ? paragraphs : [escaped])
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("\n");
    return {
      title: "Trecho selecionado",
      byline: null,
      contentHTML: html,
      lang: doc.documentElement.lang || null,
      sourceUrl: location.href,
      textBlocks: (paragraphs.length ? paragraphs : [escaped]).map((p) => ({ tag: "p", text: p })),
    };
  }
  async function openReader() {
    const selectionText = grabSelectionText();
    if (hasActiveSelection() && selectionText) {
      setStatus("Abrindo seleção no Modo Leitura...");
      await saveArticleAndOpenOverlay(buildSelectionArticle(selectionText), { fromSelection: true });
      return;
    }
    setStatus("Extraindo artigo...");
    let article = null;
    try {
      const { extractArticle } = await loadExtractModule();
      article = await extractArticle(doc);
    } catch (err) {
      console.warn("[Dislexfy] extractArticle falhou:", err);
      article = null;
    }
    if (!article) {
      setStatus('Não consegui extrair esta página. Selecione o trecho e use "Abrir seleção no Modo Leitura".', 4500);
      return;
    }
    setStatus("");
    await saveArticleAndOpenOverlay(article, { fromSelection: false });
  }

  // ============ HISTÓRICO ============
  function addToHistory(text) {
    state.history = state.history.filter((h) => h.text !== text);
    state.history.unshift({ text, title: doc.title || "", url: location.href, date: Date.now() });
    state.history = state.history.slice(0, MAX_HISTORY);
    saveLocalDebounced();
    notify();
  }
  function removeFromHistory(idx) {
    state.history.splice(idx, 1);
    saveLocalDebounced();
    notify();
  }
  function saveCurrent() {
    const text = grabSelectionText() || currentReadingText;
    if (text) { addToHistory(text); setStatus("Salvo."); return true; }
    return false;
  }

  // ============ PREVIEW DE VOZ ============
  let previewAudio = null;
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler o áudio."));
      reader.readAsDataURL(blob);
    });
  }
  async function previewVoice() {
    if (isPlaying) { setStatus("Pause a leitura para ouvir a prévia."); return; }
    if (previewLoading) return;
    if (previewAudio) { try { previewAudio.pause(); } catch (_) {} previewAudio = null; }
    const voice = state.voice;
    let cache = {};
    try {
      const result = await chrome.storage.local.get(PREVIEW_KEY);
      cache = result[PREVIEW_KEY] || {};
    } catch (_) {}
    let b64 = cache[voice];
    if (!b64) {
      previewLoading = true;
      notify();
      setStatus("Gerando prévia...");
      try {
        const { blob } = await synthesize({ text: PREVIEW_PHRASE, voice, transport: bgTransport });
        b64 = await blobToBase64(blob);
        cache[voice] = b64;
        chrome.storage.local.set({ [PREVIEW_KEY]: cache }).catch(() => {});
        setStatus("");
      } catch (err) {
        if (!err || err.name !== "AbortError") {
          setStatus(err && err.message ? err.message : "Falha ao gerar a prévia.");
        }
        return;
      } finally {
        previewLoading = false;
        notify();
      }
    }
    previewAudio = new Audio("data:audio/mp3;base64," + b64);
    previewAudio.play().catch(() => {});
  }

  // ============ COMPARTILHAR TRECHO ============
  // Limite do servidor (shared_snippets.text tem CHECK de 20000). Cortar aqui,
  // com aviso, é melhor que levar um 400 depois de o usuário clicar.
  const SHARE_MAX = 20000;

  function shareableText() {
    let text = "";
    try {
      const sel = win.getSelection();
      text = sel ? sel.toString().trim() : "";
    } catch (_) {}
    return text || lastSelectionText || currentReadingText || lastReadText || "";
  }

  /**
   * Publica o trecho e devolve o link curto. O POST sai pelo service worker
   * pelo MESMO motivo do TTS: a CSP connect-src da página bloquearia um fetch
   * feito daqui em vários sites.
   */
  async function createShareLink() {
    const raw = shareableText();
    if (!raw) {
      return { ok: false, message: "Selecione um texto ou ouça um trecho antes de compartilhar." };
    }
    const truncated = raw.length > SHARE_MAX;
    const text = truncated ? raw.slice(0, SHARE_MAX) : raw;
    setStatus("Criando o link...", 20000);
    const resp = await askBackground({
      type: "zyrex:share:create",
      text,
      title: (doc.title || "").slice(0, 300),
      sourceUrl: win.location ? win.location.href : "",
      sourceTitle: (doc.title || "").slice(0, 300),
      prefs: {
        voice: state.voice,
        speed: state.speed,
        readFont: state.readFont,
        readSpacing: state.readSpacing,
        hlColor: state.hlColor,
        hlStyle: state.hlStyle,
      },
    });
    if (!resp || !resp.ok || !resp.url) {
      setStatus((resp && resp.message) || "Não foi possível criar o link agora.");
      return { ok: false, message: (resp && resp.message) || "Não foi possível criar o link agora." };
    }
    setStatus(truncated ? "Link criado (trecho longo foi encurtado)." : "");
    return { ok: true, url: resp.url, truncated };
  }

  // ============ CONTA (login dentro da extensão) ============
  // Todo o diálogo com o Supabase mora no service worker (seção AUTH do background.js).
  // Aqui só perguntamos "quem está logado?" e guardamos a projeção pública.
  // Erros de infraestrutura viram um {ok:false, message} ACIONÁVEL em vez de
  // null genérico — "recarregue a página" e "recarregue a extensão" são
  // problemas diferentes com soluções diferentes, e o usuário merece saber
  // qual dos dois tem na frente.
  function bgFailure(lastErrorMsg) {
    if (isStaleContextMessage(lastErrorMsg)) {
      return { ok: false, message: "O Dislexfy foi atualizado. Recarregue a página (F5) para continuar." };
    }
    return { ok: false, message: "A extensão não respondeu. Recarregue-a em chrome://extensions e tente de novo." };
  }
  function askBackground(message) {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          resolve(bgFailure("Extension context invalidated"));
          return;
        }
        chrome.runtime.sendMessage(message, (resp) => {
          const err = chrome.runtime.lastError;
          if (err || !resp) {
            resolve(bgFailure(err && err.message));
            return;
          }
          resolve(resp);
        });
      } catch (err) {
        resolve(bgFailure(err && err.message));
      }
    });
  }
  function applyAccount(next) {
    account = next || null;
    accountLoaded = true;
    notify();
  }
  /** Pergunta ao SW quem está logado. Devolve se conseguiu descobrir. */
  async function loadAccount() {
    const resp = await askBackground({ type: "zyrex:auth:state" });
    if (resp && resp.ok) {
      applyAccount(resp.account);
      return true;
    }
    return false;
  }
  // O service worker pode estar dormindo/reciclando quando o content script
  // sobe (MV3 desliga o SW o tempo todo). Uma tentativa só deixava a conta em
  // null pela vida inteira da página. Backoff curto, algumas tentativas, e para.
  const ACCOUNT_RETRY_MS = [400, 1200, 3000, 8000];
  let accountRetryTimer = null;
  function scheduleAccountRetries(step) {
    const i = step || 0;
    if (accountLoaded || i >= ACCOUNT_RETRY_MS.length) return;
    accountRetryTimer = setTimeout(async () => {
      accountRetryTimer = null;
      if (accountLoaded) return;
      const ok = await loadAccount();
      if (!ok) scheduleAccountRetries(i + 1);
    }, ACCOUNT_RETRY_MS[i]);
  }
  function openAuth() {
    if (account) return; // já logado: nada a fazer
    // Pode ser um null "não sei" em vez de um null "deslogado": tenta descobrir
    // enquanto a pessoa digita. Se ela já estava logada, a conta chega e o
    // modal de login some por conta própria.
    if (!accountLoaded) loadAccount();
    authView = "form";
    notify();
  }
  function closeAuth() {
    authView = "closed";
    notify();
  }
  // Chamado pela UI quando o iframe de login avisa que autenticou. O sinal NÃO
  // carrega a conta (evita vazar PII pra página — ver auth.js), então buscamos
  // a conta autoritativa no service worker.
  //
  // A confirmação aparece ANTES dessa busca de propósito: o 200 do service
  // worker já provou que o login deu certo, e prender a tela de sucesso a um
  // segundo round-trip seria reconstruir o bug do F5 dentro do modal novo. O
  // nome entra depois, quando a conta chega. Nada de applyAccount(null) aqui:
  // piscaria "deslogado" entre o sinal e a resposta.
  async function onAuthenticated() {
    authView = "success";
    notify();
    const resp = await askBackground({ type: "zyrex:auth:state" });
    if (resp && resp.ok) applyAccount(resp.account);
    // Sem setStatus aqui: o toast dizia a mesma coisa que o modal e, pior,
    // vivia os 4s inteiros ATRÁS dele (o overlay de auth é Z_INDEX+1 e o toast
    // é Z_INDEX), reaparecendo como eco depois. O logout mantém o dele — lá
    // não há modal nenhum.
  }
  async function signOut() {
    const resp = await askBackground({ type: "zyrex:auth:signout" });
    applyAccount(resp && resp.ok ? resp.account : null);
    // O Pro local é um override offline e acompanha a conta. Sem zerar aqui ele
    // fica em storage.sync.zyrex_prefs.isPro e sobrevive ao logout PARA SEMPRE
    // — e, por ser sync, viaja pra todas as máquinas do usuário.
    if (state.isPro) { state.isPro = false; savePrefsDebounced(); }
    authView = "closed";
    setStatus("Você saiu da conta.");
  }
  // Reconsulta o plano no servidor — usado depois de o usuário voltar do site
  // (assinou lá com a aba aberta) e ao reabrir o widget.
  async function refreshAccountPlan() {
    const resp = await askBackground({ type: "zyrex:auth:refresh-plan" });
    if (!resp || !resp.ok) return;
    // Um refresh de PLANO nunca desloga. Quem desloga é signOut() ou o espelho
    // zyrex_account sumindo (onChanged). Aplicar null aqui apagava uma conta
    // válida sempre que o token estivesse em transição.
    if (!resp.account && account) return;
    applyAccount(resp.account);
  }
  function openOptions() {
    askBackground({ type: "zyrex:open-options" });
  }

  // ============ OPEN / CLOSE ============
  function openWidget() {
    open = true;
    warmUpViaSW();
    ensureReaderableChecked();
    // Barato e oportuno: se o usuário assinou no site enquanto esta aba estava
    // aberta, o cadeado some assim que ele reabre o widget. E se a conta nunca
    // chegou (SW dormindo no boot), esta é a hora de tentar de novo em vez de
    // desistir por ver null — era assim que o Pro ficava travado até o F5.
    if (account) refreshAccountPlan();
    else if (!accountLoaded) loadAccount();
    notify();
  }
  function closeWidget() {
    stopReading();
    authView = "closed";
    if (usingOffscreen) {
      try { chrome.runtime.sendMessage({ type: "zyrex:off:stop" }, () => void chrome.runtime.lastError); } catch (_) {}
    }
    open = false;
    hideParaBtnNow();
    engine.endSession();
    engineTarget = null;
    currentEngineChunk = null;
    currentEngineSubtitle = null;
    updateFocusVeil(null);
    clearReadingTypo();
    closeReaderOverlay();
    notify();
  }

  // ============ POSIÇÃO (drag persistido) ============
  // Margem que o widget mantém das bordas da viewport — a mesma do canto padrão
  // (right/bottom 20 na UI), pra uma posição arrastada até a borda parecer
  // "encaixada" e não colada.
  const EDGE_MARGIN = 12;
  // Tamanho REAL do widget na tela, medido pela UI e informado no setPosition.
  // O tamanho varia muito (vertical ~34x210, horizontal com player ~330x40), e
  // era justamente por clampar com uma caixa fixa de 60x44 que trocar a
  // orientação jogava o widget pra fora: no vertical o `left` cabia, no
  // horizontal a barra crescia 300px pra direita e vazava da tela.
  let widgetSize = null; // { w, h }

  function clampPosition(left, top, size) {
    const s = size || widgetSize;
    // Sem medida ainda (primeiro drag antes do primeiro layout): cai na caixa
    // conservadora antiga, que ao menos garante um pedaço visível.
    const w = s && s.w > 0 ? s.w : 60;
    const h = s && s.h > 0 ? s.h : 44;
    // clientWidth/Height do <html>: é o bloco recipiente de position:fixed (o
    // widget) e, ao contrário de innerWidth, não conta a barra de rolagem.
    const root = doc.documentElement;
    const vw = (root && root.clientWidth) || win.innerWidth;
    const vh = (root && root.clientHeight) || win.innerHeight;
    // Widget maior que a viewport (janela minúscula): encosta no topo/esquerda
    // em vez de produzir um máximo negativo.
    const maxX = Math.max(EDGE_MARGIN, vw - w - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, vh - h - EDGE_MARGIN);
    return {
      left: Math.min(Math.max(EDGE_MARGIN, left), maxX),
      top: Math.min(Math.max(EDGE_MARGIN, top), maxY),
    };
  }
  /**
   * Grava a posição do widget. `size` é o retângulo medido pela UI ({w,h}) —
   * ela é quem sabe o tamanho renderizado; o core só guarda a última medida pra
   * poder reclampar sozinho num resize da janela.
   */
  function setPosition(left, top, size) {
    if (size && size.w > 0 && size.h > 0) widgetSize = { w: size.w, h: size.h };
    const c = clampPosition(left, top, widgetSize);
    if (c.left === state.left && c.top === state.top) return;
    state.left = c.left;
    state.top = c.top;
    saveLocalDebounced();
    notify();
  }
  function onResize() {
    if (focusVeilTarget) positionFocusVeil();
    if (state.left != null && state.top != null) {
      const c = clampPosition(state.left, state.top);
      if (c.left !== state.left || c.top !== state.top) {
        state.left = c.left; state.top = c.top;
        saveLocalDebounced();
        notify();
      }
    }
  }

  // ============ PLAY CONTEXTUAL (primary) ============
  function playPrimary() {
    if (hasActiveReading) { controller.togglePlayPause(); return; }
    if (controller.getState() === "ended" && currentBlocks.length && !hasActiveSelection()) {
      startReading(currentBlocks);
      return;
    }
    // Com seleção: lê a seleção. Sem seleção: lê a página inteira (não perde o
    // "Ler Tudo", que a pílula nova não tem como botão dedicado).
    if (hasActiveSelection() || lastSelectionText) {
      startSelectionReading();
    } else {
      startReadAll();
    }
  }

  // ============ LISTENERS GLOBAIS ============
  function onDocMouseUp(e) {
    if (eventInWidget(e)) return;
    const sel = win.getSelection();
    if (sel && sel.toString().trim()) {
      captureSelection(sel);
      warmUpViaSW();
    }
    hasSelectionNow = hasActiveSelection();
    notify();
  }
  function onDocMouseDown(e) {
    if (eventInWidget(e)) return;
    hideParaBtnNow();
  }
  let selChangeTimer = null;
  function onSelectionChange() {
    if (hasActiveSelection()) hideParaBtnNow();
    const changed = hasSelectionNow !== hasActiveSelection();
    hasSelectionNow = hasActiveSelection();
    if (changed) notify();
    clearTimeout(selChangeTimer);
    selChangeTimer = setTimeout(() => {
      const sel = win.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (!text) return;
      const anchor = sel.anchorNode;
      const anchorEl = anchor && (anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement);
      if (isWidgetNode(anchor) || isWidgetNode(anchorEl)) return;
      captureSelection(sel);
    }, 150);
  }
  function onWinScroll() {
    // O parágrafo se move com o scroll; o botão precisa acompanhar pra
    // continuar ancorado nele (e visível quando o topo sai da tela).
    if (hoverTarget) { hoverRect = computeHoverRect(hoverTarget); notify(); }
    if (focusVeilTarget) positionFocusVeil();
  }

  // Voltou pra esta aba (ex.: foi assinar/logar no site e retornou): relê o
  // plano no servidor, com throttle — o caso clássico é assinar o Pro numa
  // aba e voltar pra cá esperando o cadeado sumir sem F5.
  // Sem conta carregada, BUSCA em vez de desistir: voltar pra aba é exatamente
  // quando um null "não sei" precisa virar a verdade (a pessoa pode ter acabado
  // de logar em outra aba, ou o SW estava dormindo quando esta página subiu).
  let lastFocusRefresh = 0;
  function onWinFocus() {
    const now = Date.now();
    if (now - lastFocusRefresh < 30000) return;
    lastFocusRefresh = now;
    if (account) refreshAccountPlan();
    else loadAccount();
  }
  win.addEventListener("focus", onWinFocus);

  doc.addEventListener("mouseup", onDocMouseUp);
  doc.addEventListener("mousedown", onDocMouseDown);
  doc.addEventListener("selectionchange", onSelectionChange);
  doc.addEventListener("mouseover", onDocMouseOver);
  doc.addEventListener("mouseout", onDocMouseOut);
  doc.addEventListener("pointermove", onDocPointerMove, { passive: true });
  doc.addEventListener("click", onDocClickSeek, true);
  doc.addEventListener("wheel", suspendAutoScroll, { capture: true, passive: true });
  doc.addEventListener("touchmove", suspendAutoScroll, { capture: true, passive: true });
  doc.addEventListener("keydown", onScrollKey, true);
  win.addEventListener("scroll", onWinScroll, true);
  win.addEventListener("resize", onResize);
  win.addEventListener("pagehide", onPageHide);

  function onPageHide() {
    engine.endSession();
    engineTarget = null;
    currentEngineChunk = null;
    currentEngineSubtitle = null;
    updateFocusVeil(null);
    clearReadingTypo();
    closeReaderOverlay();
  }

  // ============ SINCRONIA ENTRE ABAS ============
  function onStorageChanged(changes, areaName) {
    if (areaName === "sync" && changes[PREFS_KEY]) {
      const prefs = changes[PREFS_KEY].newValue || {};
      applyingRemoteChange = true;
      try {
        if (typeof prefs.voice === "string") state.voice = prefs.voice;
        if (typeof prefs.speed === "number" && prefs.speed !== state.speed) {
          state.speed = prefs.speed;
          controller.setRate(state.speed);
        }
        const highlight = prefs.highlight !== false;
        if (highlight !== state.highlight) {
          state.highlight = highlight;
          if (!state.highlight) {
            engine.endSession();
            engineTarget = null;
            currentEngineChunk = null;
            currentEngineSubtitle = null;
          }
        }
        state.autoScroll = prefs.autoScroll !== false;
        const dark = prefs.dark !== false;
        if (dark !== state.dark) { state.dark = dark; }
        const hlColor = enumOr(prefs.hlColor, HL_COLORS, "yellow");
        const hlStyle = enumOr(prefs.hlStyle, HL_STYLES, "background");
        state.hlColor = hlColor;
        state.hlStyle = hlStyle;
        const hlTrail = prefs.hlTrail === true;
        if (hlTrail !== state.hlTrail) {
          state.hlTrail = hlTrail;
          if (state.highlight && engineTarget) {
            try {
              engine.startSession(engineTarget, { trail: state.hlTrail });
              if (currentEngineChunk) engine.setChunkSubtitle(currentEngineChunk, currentEngineSubtitle);
            } catch (_) {}
          }
        }
        const focusMode = prefs.focusMode === true;
        if (focusMode !== state.focusMode) { state.focusMode = focusMode; updateFocusVeil(); }
        const readFont = enumOr(prefs.readFont, READ_FONTS, "page");
        if (readFont !== state.readFont) {
          state.readFont = readFont;
          if (typoTarget || lastReadingContainer) applyReadingTypo(typoTarget || lastReadingContainer);
          if (state.readFont !== "page") ensureFontFace();
        }
        const readSpacing = prefs.readSpacing === true;
        if (readSpacing !== state.readSpacing) {
          state.readSpacing = readSpacing;
          if (typoTarget || lastReadingContainer) applyReadingTypo(typoTarget || lastReadingContainer);
        }
        state.orientation = enumOr(prefs.orientation, ORIENTATIONS, "vertical");
        state.startMode = enumOr(prefs.startMode, START_MODES, "hidden");
        state.idleFade = prefs.idleFade !== false;
        state.autoplay = prefs.autoplay === true;
        state.isPro = prefs.isPro === true; // real; o dev flag entra só no snapshot()
        applyPageTheme();
      } finally {
        applyingRemoteChange = false;
        notify();
      }
    }
    // Login/logout em QUALQUER aba (ou na página de opções) chega por aqui: o
    // service worker escreve o espelho público da conta em storage.local e o
    // onChanged alcança todo content script, sem depender de host permission.
    if (areaName === "local" && changes[ACCOUNT_KEY]) {
      applyAccount(changes[ACCOUNT_KEY].newValue || null);
    }
    if (areaName === "local" && changes[LOCAL_KEY]) {
      const local = changes[LOCAL_KEY].newValue || {};
      applyingRemoteChange = true;
      try {
        const history = Array.isArray(local.history) ? local.history : [];
        if (JSON.stringify(history) !== JSON.stringify(state.history)) {
          state.history = history;
        }
        if (typeof local.left === "number") state.left = local.left;
        if (typeof local.top === "number") state.top = local.top;
      } finally {
        applyingRemoteChange = false;
        notify();
      }
    }
  }
  chrome.storage.onChanged.addListener(onStorageChanged);

  // ============ MENSAGENS DO BACKGROUND ============
  function onRuntimeMessage(msg, sender, sendResponse) {
    if (!msg || !msg.type) return;
    if (msg.type === "zyrex:auth:changed") {
      // Canal REDUNDANTE ao storage.onChanged: o background transmite isto em
      // todo writeSession(). Vale exatamente quando a escrita do espelho é o
      // que falhou — aí o onChanged nunca dispara e só esta mensagem chega.
      applyAccount(msg.account || null);
      return;
    }
    if (msg.type === "zyrex:toggle") {
      if (!open) openWidget(); else closeWidget();
    } else if (msg.type === "zyrex:read-selection") {
      if (!open) openWidget();
      // msg.text vem do menu de contexto; sem ele, é o atalho Alt+Shift+L.
      // Os dois caminhos passam pelo mesmo lugar pra sempre tentar o Range
      // primeiro (destaque + foco + tipografia dependem dele).
      startContextMenuReading(msg.text || "");
    } else if (msg.type === "zyrex:read-all") {
      if (!open) openWidget();
      startReadAll();
    } else if (msg.type === "zyrex:play-pause") {
      if (!open) openWidget();
      if (hasActiveReading) controller.togglePlayPause();
      else if (controller.getState() === "ended" && currentBlocks.length && !hasActiveSelection()) startReading(currentBlocks);
      else startSelectionReading();
    } else if (msg.type === "zyrex:seek" && typeof msg.dt === "number") {
      if (hasActiveReading) { controller.seekRelative(msg.dt); notify(); }
    } else if (msg.type === "zyrex:open-reader") {
      if (!open) openWidget();
      if (msg.selectionText) {
        setStatus("Abrindo seleção no Modo Leitura...");
        saveArticleAndOpenOverlay(buildSelectionArticle(msg.selectionText), { fromSelection: true });
      } else {
        openReader();
      }
    }
    sendResponse({ ok: true });
    return true;
  }
  chrome.runtime.onMessage.addListener(onRuntimeMessage);

  // ============ INIT ============
  await loadState();
  controller.setRate(state.speed);
  applyPageTheme();
  if (state.readFont !== "page") ensureFontFace();
  hasSelectionNow = hasActiveSelection();
  // startMode "open": o widget já nasce aberto nesta página. "collapsed" só
  // muda o que a UI mostra no estado fechado (a pílula), então não abre nada
  // aqui. "hidden" é o comportamento histórico: espera o ícone da extensão.
  if (state.startMode === "open") openWidget();
  notify();
  // loadState() já pode ter populado a conta pelo espelho (storage.local). Esta
  // consulta ao service worker confirma/corrige; se ele estiver dormindo, o
  // retry insiste por alguns segundos em vez de deixar a conta em null pra
  // sempre — que era o que obrigava o F5.
  loadAccount().then((ok) => { if (!ok) scheduleAccountRetries(0); });

  // ============ AÇÕES / SETTERS ============
  function setVoice(v) { state.voice = v; savePrefsDebounced(); notify(); }
  function setSpeed(s) {
    state.speed = s; controller.setRate(state.speed); savePrefsDebounced(); notify();
  }
  function setHighlight(b) {
    state.highlight = !!b; savePrefsDebounced();
    if (!state.highlight) {
      engine.endSession(); engineTarget = null; currentEngineChunk = null; currentEngineSubtitle = null;
    }
    notify();
  }
  function setAutoScroll(b) { state.autoScroll = !!b; savePrefsDebounced(); notify(); }
  function setDark(b) { state.dark = !!b; savePrefsDebounced(); applyPageTheme(); notify(); }
  function setHlColor(c) { state.hlColor = enumOr(c, HL_COLORS, "yellow"); savePrefsDebounced(); applyPageTheme(); notify(); }
  function setHlStyle(s) { state.hlStyle = enumOr(s, HL_STYLES, "background"); savePrefsDebounced(); applyPageTheme(); notify(); }
  function setHlTrail(b) {
    state.hlTrail = !!b; savePrefsDebounced();
    if (state.highlight && engineTarget) {
      try {
        engine.startSession(engineTarget, { trail: state.hlTrail });
        if (currentEngineChunk) engine.setChunkSubtitle(currentEngineChunk, currentEngineSubtitle);
      } catch (_) {}
    }
    notify();
  }
  function setFocusMode(b) { state.focusMode = !!b; savePrefsDebounced(); updateFocusVeil(); notify(); }
  function setReadFont(f) {
    state.readFont = enumOr(f, READ_FONTS, "page"); savePrefsDebounced();
    if (state.readFont !== "page") ensureFontFace();
    if (typoTarget || lastReadingContainer) applyReadingTypo(typoTarget || lastReadingContainer);
    notify();
  }
  function setReadSpacing(b) {
    state.readSpacing = !!b; savePrefsDebounced();
    if (typoTarget || lastReadingContainer) applyReadingTypo(typoTarget || lastReadingContainer);
    notify();
  }
  function setOrientation(o) { state.orientation = enumOr(o, ORIENTATIONS, "vertical"); savePrefsDebounced(); notify(); }
  function setStartMode(m) { state.startMode = enumOr(m, START_MODES, "hidden"); savePrefsDebounced(); notify(); }
  function setIdleFade(b) { state.idleFade = !!b; savePrefsDebounced(); notify(); }
  function setAutoplay(b) { state.autoplay = !!b; savePrefsDebounced(); notify(); }
  // Liga/desliga o plano Pro localmente. Continua existindo pro dev flag e pra
  // cenários offline; a fonte de verdade em produção é `account.isPro`, que vem
  // do profiles.plan lido pelo service worker.
  function setPro(b) { state.isPro = !!b; savePrefsDebounced(); notify(); }

  // ============ DESTROY ============
  function destroy() {
    try { controller.dispose(); } catch (_) {}
    try { engine.endSession(); } catch (_) {}
    if (accountRetryTimer) { clearTimeout(accountRetryTimer); accountRetryTimer = null; }
    doc.removeEventListener("mouseup", onDocMouseUp);
    doc.removeEventListener("mousedown", onDocMouseDown);
    doc.removeEventListener("selectionchange", onSelectionChange);
    doc.removeEventListener("mouseover", onDocMouseOver);
    doc.removeEventListener("mouseout", onDocMouseOut);
    doc.removeEventListener("pointermove", onDocPointerMove);
    doc.removeEventListener("click", onDocClickSeek, true);
    doc.removeEventListener("wheel", suspendAutoScroll, { capture: true });
    doc.removeEventListener("touchmove", suspendAutoScroll, { capture: true });
    doc.removeEventListener("keydown", onScrollKey, true);
    win.removeEventListener("scroll", onWinScroll, true);
    win.removeEventListener("resize", onResize);
    win.removeEventListener("pagehide", onPageHide);
    win.removeEventListener("focus", onWinFocus);
    try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch (_) {}
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (_) {}
    closeReaderOverlay();
    clearReadingTypo();
    updateFocusVeil(null);
    try { focusVeilEl.remove(); } catch (_) {}
    try { player.remove(); } catch (_) {}
    listeners.clear();
  }

  return {
    subscribe,
    getState: () => lastSnapshot || snapshot(),
    destroy,
    actions: {
      open: openWidget,
      close: closeWidget,
      toggle: () => (open ? closeWidget() : openWidget()),
      playPrimary,
      togglePlayPause: () => { if (hasActiveReading) controller.togglePlayPause(); else playPrimary(); },
      readAll: startReadAll,
      readSelection: startSelectionReading,
      readHover,
      keepHover: () => { paraKept = true; clearTimeout(paraHideTimer); },
      releaseHover: () => { paraKept = false; hideParaBtnDelayed(); },
      readHistoryItem: (idx) => { const it = state.history[idx]; if (it) startReading([{ text: it.text }]); },
      removeHistory: removeFromHistory,
      save: saveCurrent,
      stop: stopReading,
      seekRelative: (dt) => { controller.seekRelative(dt); notify(); },
      download: downloadAudio,
      openReader,
      closeReader: () => closeReaderOverlay(),
      previewVoice,
      info: (msg, ms) => setStatus(msg, ms), // mensagem efêmera (ex.: "em breve")
      setPosition,
      setVoice, setSpeed, setHighlight, setAutoScroll, setDark,
      setHlColor, setHlStyle, setHlTrail, setFocusMode, setReadFont, setReadSpacing,
      setOrientation, setStartMode, setIdleFade, setAutoplay,
      setPro,
      // compartilhar
      createShareLink,
      // conta
      openAuth, closeAuth, onAuthenticated, signOut, refreshAccountPlan, openOptions,
    },
  };
}
