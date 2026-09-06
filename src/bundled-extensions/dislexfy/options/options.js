/**
 * Dislexfy — options page
 *
 * Página própria de configurações (chrome://extensions → "Detalhes" →
 * "Opções da extensão", aberta embutida porque manifest.json declara
 * options_ui.open_in_tab = false). Lê/escreve o MESMO bucket zyrex_prefs
 * (storage.sync) que o painel de Configurações do widget usa, então os dois
 * convergem via chrome.storage.onChanged.
 *
 * Esta página é a casa de TODAS as preferências — inclusive as que o widget
 * não mostra mais (voz, velocidade) e as que só fazem sentido aqui (como o
 * Dislexfy nasce em cada página). Também é onde dá pra entrar na conta sem
 * abrir o site.
 *
 * ARMADILHA JÁ PAGA: savePrefsDebounced() grava o bucket INTEIRO. Qualquer
 * campo que normalizePrefs() esqueça é APAGADO no próximo salvamento. Foi
 * exatamente o que acontecia com `orientation` e `isPro`: mexer na velocidade
 * aqui zerava a orientação escolhida no widget. Por isso normalizePrefs()
 * abaixo tem que cobrir todo campo que qualquer parte do produto escreva.
 *
 * DEFAULT_API_URL é duplicado do background.js de propósito: esta página não
 * importa background.js (contextos diferentes) e o valor só serve de
 * placeholder/fallback visual — a fonte da verdade em tempo de fetch
 * continua sendo o getApiUrl() do service worker.
 */

(function () {
  const PREFS_KEY = "zyrex_prefs";
  const DEFAULT_API_URL = "https://dislexfy.com/api/tts";
  const DEFAULT_VOICE = "pt-BR-AntonioNeural";
  const PREVIEW_KEY = "zyrex_voice_preview_v1";
  const PREVIEW_PHRASE = "Olá! Assim é como eu leio para você.";

  // Mesmos enums/defaults do widget-core.js.
  const HL_COLORS = ["yellow", "blue", "pink"];
  const HL_STYLES = ["background", "underline"];
  const READ_FONTS = ["page", "atkinson", "opendyslexic", "lexend"];
  const ORIENTATIONS = ["horizontal", "vertical"];
  const START_MODES = ["hidden", "collapsed", "open"];
  const PLAN_LABEL = { free: "Grátis", pro: "Pro", familia: "Família" };
  const PRO_PLANS = ["pro", "familia"];

  function enumOr(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
  }
  const byId = (id) => document.getElementById(id);

  // ---- conta ----
  const accOut = byId("zx-account-out");
  const accIn = byId("zx-account-in");
  const accEmail = byId("zx-acc-email");
  const accPass = byId("zx-acc-pass");
  const accSignin = byId("zx-acc-signin");
  const accMsg = byId("zx-acc-msg");
  const accName = byId("zx-acc-name");
  const accMail = byId("zx-acc-mail");
  const accPlan = byId("zx-acc-plan");
  const accRefresh = byId("zx-acc-refresh");
  const accSignout = byId("zx-acc-signout");

  // ---- inicialização ----
  const startModeSel = byId("zx-start-mode");
  const orientationSel = byId("zx-orientation");
  const idleFadeToggle = byId("zx-idlefade-toggle");
  const autoplayToggle = byId("zx-autoplay-toggle");

  // ---- voz ----
  const voiceSel = byId("zx-voice");
  const previewBtn = byId("zx-preview-btn");
  const previewResult = byId("zx-preview-result");
  const speedRange = byId("zx-speed");
  const speedValueEl = byId("zx-speed-value");

  // ---- destaque ----
  const highlightToggle = byId("zx-highlight-toggle");
  const hlGroup = byId("zx-hl-group");
  const hlColorGroup = byId("zx-hl-color");
  const hlStyleSel = byId("zx-hl-style");
  const hlTrailToggle = byId("zx-hltrail-toggle");
  const focusToggle = byId("zx-focus-toggle");
  const autoScrollToggle = byId("zx-autoscroll-toggle");

  // ---- texto ----
  const readFontSel = byId("zx-readfont");
  const spacingToggle = byId("zx-spacing-toggle");
  const darkToggle = byId("zx-dark-toggle");

  // ---- avançado ----
  const apiUrlInput = byId("zx-api-url");
  const apiErrorEl = byId("zx-api-error");
  const testBtn = byId("zx-test-btn");
  const testResultEl = byId("zx-test-result");

  const saveStatusEl = byId("zx-save-status");

  let current = normalizePrefs({});
  let applyingRemoteChange = false;

  function isValidApiUrl(value) {
    return typeof value === "string" && /^https:\/\/.+/i.test(value.trim());
  }

  // Única fonte de verdade pra "prefs salvas → estado local". TODO campo que
  // o produto escreve no bucket precisa aparecer aqui (ver o comentário do
  // topo sobre o bucket ser gravado inteiro).
  function normalizePrefs(prefs) {
    prefs = prefs || {};
    return {
      apiUrl: typeof prefs.apiUrl === "string" && prefs.apiUrl.trim() ? prefs.apiUrl.trim() : DEFAULT_API_URL,
      voice: prefs.voice || DEFAULT_VOICE,
      speed: typeof prefs.speed === "number" ? prefs.speed : 1,
      highlight: prefs.highlight !== false,
      autoScroll: prefs.autoScroll !== false,
      // O widget nasce escuro (identidade); só `false` explícito vira claro.
      dark: prefs.dark !== false,
      hlColor: enumOr(prefs.hlColor, HL_COLORS, "yellow"),
      hlStyle: enumOr(prefs.hlStyle, HL_STYLES, "background"),
      hlTrail: prefs.hlTrail === true,
      focusMode: prefs.focusMode === true,
      readFont: enumOr(prefs.readFont, READ_FONTS, "page"),
      readSpacing: prefs.readSpacing === true,
      orientation: enumOr(prefs.orientation, ORIENTATIONS, "vertical"),
      startMode: enumOr(prefs.startMode, START_MODES, "hidden"),
      idleFade: prefs.idleFade !== false,
      autoplay: prefs.autoplay === true,
      // Pro persistido localmente. Esta página nunca o edita, mas precisa
      // preservá-lo — senão salvar qualquer coisa aqui derrubaria o Pro.
      isPro: prefs.isPro === true,
    };
  }

  function showSaveStatus(text) {
    saveStatusEl.textContent = text;
    clearTimeout(showSaveStatus._t);
    showSaveStatus._t = setTimeout(() => {
      saveStatusEl.textContent = "";
    }, 2000);
  }

  // ============ CARREGAR ============
  async function load() {
    let prefs = {};
    try {
      const result = await chrome.storage.sync.get(PREFS_KEY);
      prefs = result[PREFS_KEY] || {};
    } catch (_) {
      // storage indisponível — segue com os defaults
    }
    current = normalizePrefs(prefs);
    applyToForm(current);
  }

  function applySpeedLabel(speed) {
    speedValueEl.textContent = speed.toFixed(2) + "x";
    speedRange.setAttribute("aria-valuetext", speed.toFixed(2) + "x");
  }

  function applyHlColor(color) {
    hlColorGroup.querySelectorAll(".zx-opt-swatch").forEach((btn) => {
      btn.setAttribute("aria-checked", String(btn.dataset.color === color));
    });
  }

  function applyToForm(prefs) {
    apiUrlInput.value = prefs.apiUrl;
    startModeSel.value = prefs.startMode;
    orientationSel.value = prefs.orientation;
    idleFadeToggle.checked = prefs.idleFade;
    autoplayToggle.checked = prefs.autoplay;
    voiceSel.value = prefs.voice;
    speedRange.value = String(prefs.speed);
    applySpeedLabel(prefs.speed);
    highlightToggle.checked = prefs.highlight;
    applyHlColor(prefs.hlColor);
    hlStyleSel.value = prefs.hlStyle;
    hlTrailToggle.checked = prefs.hlTrail;
    hlGroup.dataset.off = prefs.highlight ? "" : "1";
    focusToggle.checked = prefs.focusMode;
    autoScrollToggle.checked = prefs.autoScroll;
    readFontSel.value = prefs.readFont;
    spacingToggle.checked = prefs.readSpacing;
    darkToggle.checked = prefs.dark;
  }

  // ============ SALVAR (debounced, mesmo bucket do widget) ============
  function savePrefsDebounced() {
    clearTimeout(savePrefsDebounced._t);
    savePrefsDebounced._t = setTimeout(() => {
      if (applyingRemoteChange) return;
      chrome.storage.sync
        .set({ [PREFS_KEY]: { ...current } })
        .then(() => showSaveStatus("Salvo."))
        .catch(() => showSaveStatus("Não foi possível salvar agora."));
    }, 400);
  }

  /** Liga um controle simples a um campo de `current`. */
  function bind(el, event, read) {
    el.addEventListener(event, () => {
      if (applyingRemoteChange) return;
      read();
      savePrefsDebounced();
    });
  }

  // ============ API URL ============
  function validateApiUrlField() {
    const value = apiUrlInput.value.trim();
    if (!value) {
      // Campo vazio: não é erro ainda (usuário pode estar digitando/apagando
      // pra colar algo novo), mas também não salva um valor inválido.
      apiUrlInput.removeAttribute("aria-invalid");
      apiErrorEl.hidden = true;
      return null;
    }
    if (!isValidApiUrl(value)) {
      apiUrlInput.setAttribute("aria-invalid", "true");
      apiErrorEl.textContent = "O endereço precisa começar com https://";
      apiErrorEl.hidden = false;
      return null;
    }
    apiUrlInput.removeAttribute("aria-invalid");
    apiErrorEl.hidden = true;
    return value;
  }

  apiUrlInput.addEventListener("input", () => {
    if (applyingRemoteChange) return;
    const valid = validateApiUrlField();
    if (valid) {
      current.apiUrl = valid;
      savePrefsDebounced();
    }
  });
  apiUrlInput.addEventListener("blur", () => {
    // Ao sair do campo vazio, restaura o valor salvo (não deixa o usuário
    // com um campo vazio "fantasma" que parece salvo mas não é).
    if (!apiUrlInput.value.trim()) {
      apiUrlInput.value = current.apiUrl;
      apiUrlInput.removeAttribute("aria-invalid");
      apiErrorEl.hidden = true;
    }
  });

  // ============ TESTAR CONEXÃO ============
  // Usa o MESMO caminho de produção do widget: chrome.runtime.sendMessage
  // zyrex:synthesize → background.js → getApiUrl() (zyrex_prefs.apiUrl com
  // fallback) → fetch. Testar aqui com um texto curtinho valida servidor +
  // CORS + voz numa tacada só, com o mesmo handler que a extensão usa de verdade.
  async function testConnection() {
    const typedUrl = apiUrlInput.value.trim();
    if (typedUrl && !isValidApiUrl(typedUrl)) {
      testResultEl.dataset.state = "error";
      testResultEl.textContent = "Corrija o endereço da API antes de testar (precisa começar com https://).";
      return;
    }
    // Se o campo tem um valor válido ainda não salvo (debounce em voo), salva
    // imediatamente pra garantir que o teste bate no endereço mostrado na tela.
    if (typedUrl && typedUrl !== current.apiUrl) {
      current.apiUrl = typedUrl;
      clearTimeout(savePrefsDebounced._t);
      try {
        await chrome.storage.sync.set({ [PREFS_KEY]: { ...current } });
      } catch (_) {
        // segue mesmo assim — o SW vai usar o default se o save falhar
      }
    }

    testBtn.disabled = true;
    testResultEl.dataset.state = "pending";
    testResultEl.textContent = "Testando conexão…";

    const requestId = "opt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const start = performance.now();
    try {
      const response = await chrome.runtime.sendMessage({
        type: "zyrex:synthesize",
        requestId,
        text: "Teste de conexão.",
        voice: current.voice || DEFAULT_VOICE,
      });
      const elapsed = Math.round(performance.now() - start);

      if (!response) {
        testResultEl.dataset.state = "error";
        testResultEl.textContent = "Sem resposta da extensão. Recarregue a página de opções e tente de novo.";
        return;
      }
      if (!response.ok) {
        testResultEl.dataset.state = "error";
        testResultEl.textContent =
          response.error === "aborted"
            ? "O teste foi cancelado. Tente novamente."
            : "Não foi possível conectar. Verifique sua internet e o endereço da API.";
        return;
      }
      if (response.status >= 200 && response.status < 300) {
        testResultEl.dataset.state = "ok";
        testResultEl.textContent = "✓ Conectado (" + elapsed + "ms)";
      } else if (response.status === 413) {
        // Texto de teste é curto — 413 aqui indicaria API incompatível, mas
        // ainda assim respondeu: trata como "conectado com aviso".
        testResultEl.dataset.state = "ok";
        testResultEl.textContent = "✓ Servidor respondeu (" + elapsed + "ms), mas recusou o texto de teste.";
      } else if (response.status === 404) {
        testResultEl.dataset.state = "error";
        testResultEl.textContent = "Endereço não encontrado (404). Confira a URL da API.";
      } else if (response.status >= 500) {
        testResultEl.dataset.state = "error";
        testResultEl.textContent = "O servidor da API está com problemas (erro " + response.status + ").";
      } else {
        testResultEl.dataset.state = "error";
        testResultEl.textContent = "O servidor respondeu com erro (código " + response.status + ").";
      }
    } catch (err) {
      testResultEl.dataset.state = "error";
      testResultEl.textContent = "Não foi possível falar com a extensão. Recarregue esta página e tente de novo.";
    } finally {
      testBtn.disabled = false;
    }
  }

  testBtn.addEventListener("click", testConnection);

  // ============ PRÉVIA DE VOZ ============
  // Mesmo cache (storage.local) que o widget usa, então ouvir a prévia aqui
  // adianta o trabalho lá — e vice-versa.
  let previewAudio = null;
  async function playPreview() {
    const voice = current.voice || DEFAULT_VOICE;
    if (previewAudio) {
      try { previewAudio.pause(); } catch (_) {}
      previewAudio = null;
    }
    let cache = {};
    try {
      const result = await chrome.storage.local.get(PREVIEW_KEY);
      cache = result[PREVIEW_KEY] || {};
    } catch (_) {}

    let b64 = cache[voice];
    if (!b64) {
      previewBtn.disabled = true;
      previewResult.dataset.state = "pending";
      previewResult.textContent = "Gerando prévia…";
      try {
        const response = await chrome.runtime.sendMessage({
          type: "zyrex:synthesize",
          requestId: "prev-" + Date.now().toString(36),
          text: PREVIEW_PHRASE,
          voice,
        });
        if (!response || !response.ok || response.status < 200 || response.status >= 300) {
          previewResult.dataset.state = "error";
          previewResult.textContent = "Não consegui gerar a prévia agora.";
          return;
        }
        const body = response.body;
        b64 = body && typeof body === "object" ? body.audio : null;
        if (!b64) {
          previewResult.dataset.state = "error";
          previewResult.textContent = "Resposta inesperada do servidor de voz.";
          return;
        }
        cache[voice] = b64;
        chrome.storage.local.set({ [PREVIEW_KEY]: cache }).catch(() => {});
        previewResult.dataset.state = "";
        previewResult.textContent = "";
      } catch (_) {
        previewResult.dataset.state = "error";
        previewResult.textContent = "Não foi possível falar com a extensão.";
        return;
      } finally {
        previewBtn.disabled = false;
      }
    } else {
      previewResult.dataset.state = "";
      previewResult.textContent = "";
    }

    previewAudio = new Audio("data:audio/mp3;base64," + b64);
    previewAudio.playbackRate = current.speed || 1;
    previewAudio.play().catch(() => {});
  }
  previewBtn.addEventListener("click", playPreview);

  // ============ CONTROLES ============
  bind(startModeSel, "change", () => { current.startMode = startModeSel.value; });
  bind(orientationSel, "change", () => { current.orientation = orientationSel.value; });
  bind(idleFadeToggle, "change", () => { current.idleFade = idleFadeToggle.checked; });
  bind(autoplayToggle, "change", () => { current.autoplay = autoplayToggle.checked; });

  bind(voiceSel, "change", () => {
    current.voice = voiceSel.value;
    previewResult.textContent = "";
    previewResult.dataset.state = "";
  });
  bind(speedRange, "input", () => {
    const value = parseFloat(speedRange.value);
    current.speed = value;
    applySpeedLabel(value);
  });

  bind(highlightToggle, "change", () => {
    current.highlight = highlightToggle.checked;
    hlGroup.dataset.off = current.highlight ? "" : "1";
  });
  hlColorGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".zx-opt-swatch");
    if (!btn || applyingRemoteChange) return;
    current.hlColor = enumOr(btn.dataset.color, HL_COLORS, "yellow");
    applyHlColor(current.hlColor);
    savePrefsDebounced();
  });
  bind(hlStyleSel, "change", () => { current.hlStyle = hlStyleSel.value; });
  bind(hlTrailToggle, "change", () => { current.hlTrail = hlTrailToggle.checked; });
  bind(focusToggle, "change", () => { current.focusMode = focusToggle.checked; });
  bind(autoScrollToggle, "change", () => { current.autoScroll = autoScrollToggle.checked; });

  bind(readFontSel, "change", () => { current.readFont = readFontSel.value; });
  bind(spacingToggle, "change", () => { current.readSpacing = spacingToggle.checked; });
  bind(darkToggle, "change", () => { current.dark = darkToggle.checked; });

  // ============ CONTA ============
  // Nenhum token passa por aqui: só mensagens pro service worker, que é o dono
  // da sessão (ver lib/auth-bg.js).
  function setAccMsg(text, state) {
    accMsg.textContent = text || "";
    accMsg.dataset.state = state || "";
  }

  function renderAccount(account) {
    const inAccount = !!account;
    accOut.hidden = inAccount;
    accIn.hidden = !inAccount;
    if (!inAccount) return;
    accName.textContent = account.name || account.email || "Minha conta";
    accMail.textContent = account.name ? account.email : "";
    const isPro = PRO_PLANS.includes(account.plan);
    accPlan.textContent = PLAN_LABEL[account.plan] || account.plan;
    accPlan.dataset.pro = isPro ? "1" : "";
  }

  function send(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (resp) => {
          void chrome.runtime.lastError;
          resolve(resp || { ok: false, message: "Não foi possível falar com a extensão." });
        });
      } catch (_) {
        resolve({ ok: false, message: "Não foi possível falar com a extensão." });
      }
    });
  }

  async function doSignIn() {
    const email = accEmail.value.trim();
    if (!email || !accPass.value) {
      setAccMsg("Preencha e-mail e senha.", "error");
      return;
    }
    accSignin.disabled = true;
    setAccMsg("Entrando…", "pending");
    const resp = await send({ type: "zyrex:auth:signin", email, password: accPass.value });
    accSignin.disabled = false;
    if (!resp.ok) {
      setAccMsg(resp.message || "Não foi possível entrar.", "error");
      return;
    }
    accPass.value = "";
    setAccMsg("");
    renderAccount(resp.account);
  }

  accSignin.addEventListener("click", doSignIn);
  accPass.addEventListener("keydown", (e) => { if (e.key === "Enter") doSignIn(); });
  accEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") accPass.focus(); });

  accSignout.addEventListener("click", async () => {
    const resp = await send({ type: "zyrex:auth:signout" });
    renderAccount(resp && resp.ok ? resp.account : null);
  });

  accRefresh.addEventListener("click", async () => {
    accRefresh.disabled = true;
    const resp = await send({ type: "zyrex:auth:refresh-plan" });
    accRefresh.disabled = false;
    if (resp && resp.ok) renderAccount(resp.account);
  });

  async function loadAccount() {
    const resp = await send({ type: "zyrex:auth:state" });
    renderAccount(resp && resp.ok ? resp.account : null);
  }

  // ============ SINCRONIA COM O WIDGET (chrome.storage.onChanged) ============
  // O usuário pode ter o widget aberto numa aba e a options page aberta em
  // outra ao mesmo tempo — qualquer mudança de um lado reflete no outro.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    // Login/logout feito no widget de outra aba (o SW espelha a conta aqui).
    if (areaName === "local" && changes.zyrex_account) {
      renderAccount(changes.zyrex_account.newValue || null);
    }
    if (areaName !== "sync" || !changes[PREFS_KEY]) return;
    const prefs = changes[PREFS_KEY].newValue || {};
    applyingRemoteChange = true;
    try {
      current = normalizePrefs(prefs);
      const typing = document.activeElement === apiUrlInput;
      const url = apiUrlInput.value;
      applyToForm(current);
      // Não pisa no campo de URL se o usuário estiver com foco nele digitando.
      if (typing) apiUrlInput.value = url;
    } finally {
      applyingRemoteChange = false;
    }
  });

  // Logou/saiu no widget de alguma aba — reflete aqui sem recarregar.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "zyrex:auth:changed") renderAccount(msg.account || null);
  });

  // Atalhos do teclado: chrome://extensions/shortcuts não abre por <a href>
  // (páginas não navegam pra chrome://), mas chrome.tabs.create pode.
  const shortcutsBtn = byId("zx-shortcuts-btn");
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener("click", () => {
      try { chrome.tabs.create({ url: "chrome://extensions/shortcuts" }); } catch (_) {}
    });
  }

  load();
  loadAccount();
})();
