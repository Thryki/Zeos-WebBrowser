// reader.js — Dislexfy, Modo Leitura (item 5.2: layout/tipografia/temas;
// item 5.3: player + destaque + seek por clique + modo foco).
//
// Este arquivo:
//   1. resolve o artigo (hash #id= → storage.session via background, com
//      fallback window.__ZX_ARTICLE__ pra teste standalone);
//   2. renderiza title/byline/contentHTML (já sanitizado por extract.js) via
//      DOM parse controlado — nunca innerHTML direto na página real;
//   3. aplica/persiste tema, fonte, tamanho, largura e toggle de imagens em
//      chrome.storage.local ('zyrex_reader_prefs');
//   4. fecha (ESC/botão) via postMessage ao pai (overlay) OU window.close()
//      (aba própria — pop-out), e liga o botão de pop-out;
//   5. (item 5.3) instancia createPlaybackController + createHighlightEngine
//      de ../lib/zx-player.js e ../lib/highlight-engine.js: botão de play na
//      margem de cada bloco, "Ler artigo" contínuo (fila com todos os
//      blocos), destaque de palavra/frase, clique-na-palavra faz seek, modo
//      foco esmaecendo blocos inativos. Mesmo padrão do content.js (widget),
//      mas aqui o DOM é NOSSO — sem Shadow DOM, sem retargeting de eventos.
//
// reader.html é página de extensão (chrome-extension://): sem CSP de site,
// então o reader fala DIRETO com a API (httpTransport + apiUrl), sem passar
// pelo service worker — mais simples, e não há problema de CSP a contornar
// aqui (diferente do content script, que roda no contexto da página).

import { isSafeUrl } from "../lib/extract.js";

const PREFS_KEY = "zyrex_reader_prefs";
const AUDIO_PREFS_KEY = "zyrex_prefs"; // storage.sync — mesmo bucket do widget (voice/speed/apiUrl)
const DEFAULT_API_URL = "https://dislexfy.com/api/tts";
const DEFAULT_VOICE = "pt-BR-AntonioNeural";
const DEFAULT_SPEED = 1;

const DEFAULT_PREFS = {
  theme: "light", // 'light' | 'sepia' | 'dark'
  font: "atkinson", // 'atkinson' | 'lexend' | 'opendyslexic'
  focusMode: false, // esmaece blocos inativos durante a leitura (item 5.3)
  fontSize: 19, // 16–28
  width: 65, // 55 | 65 | 75
  imagesVisible: true,
  hlColor: "yellow", // 'yellow' | 'blue' | 'pink' — cor do destaque de leitura
  hlStyle: "background", // 'background' | 'underline' — estilo do destaque
};

const FONT_SIZE_MIN = 16;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_STEP = 1;

// Handoff de posição de leitura (item 5.4): overlay → pop-out precisa
// retomar no MESMO bloco/tempo em que a leitura estava, não do zero.
// Preenchido por initPlayer() a cada troca de chunk/tick; lido só por
// requestPopout() (overlay) e por boot() (aba pop-out, via query string) —
// por isso vive num objeto de módulo simples em vez de um estado por closure
// dentro de initPlayer(), que não teria como vazar pra requestPopout().
const readingPosition = { blockIdx: -1, mediaTime: 0, isArticleSession: false };

// ---------------------------------------------------------------------------
// Utilidades de ambiente
// ---------------------------------------------------------------------------

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
}

function hasChromeRuntime() {
  return typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
}

// Estamos numa aba própria (pop-out) ou num iframe de overlay? Convenção:
// a aba pop-out é aberta com `?tab=1` no hash/query (o content.js, no item
// 5.4, adiciona isso ao montar o pop-out); sem esse marcador e dentro de um
// iframe, tratamos como overlay e fechamos via postMessage ao pai.
function isPopoutTab() {
  if (window.top === window.self) return true; // não está em iframe nenhum
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "1";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Resolução do artigo
// ---------------------------------------------------------------------------

// Extrai o id do artigo de location.hash. Formato: '#id=<chave>' (pode vir
// acompanhado de outros pares, ex. '#id=abc123&tab=1' — mantém compatível).
function getArticleIdFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get("id");
}

// Handoff de posição de leitura (item 5.4): '&pos=<blockIdx>,<mediaTime>,<article 0|1>'
// no hash, escrito por background.js:handleOpenReaderTab a partir da posição
// que o overlay reportou no momento do pop-out. Ausente/malformado → null
// (retomada normal: nada tocando, controles habilitados e parados).
function getPositionFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const raw = params.get("pos");
  if (!raw) return null;
  const parts = raw.split(",");
  const blockIdx = parseInt(parts[0], 10);
  const mediaTime = parseFloat(parts[1]);
  const article = parts[2] === "1";
  if (!Number.isInteger(blockIdx) || blockIdx < 0) return null;
  return { blockIdx, mediaTime: Number.isFinite(mediaTime) ? mediaTime : 0, article };
}

// Busca o artigo em chrome.storage.session pela chave. storage.session não é
// acessível a documentos de página comuns, mas reader.html É uma página de
// extensão (chrome-extension://...) — se o background já chamou
// chrome.storage.session.setAccessLevel('TRUSTED_AND_UNTRUSTED_CONTEXTS'),
// chrome.storage.session fica acessível diretamente aqui também. Tentamos
// direto primeiro; se não existir/falhar, pedimos ao background via mensagem
// (rota mais robusta, funciona independente do access level).
async function fetchArticleByIdViaStorageSession(id) {
  if (hasChromeStorage() && chrome.storage.session) {
    try {
      const result = await chrome.storage.session.get(id);
      if (result && result[id]) return result[id];
    } catch (err) {
      console.warn("[Zyrex Reader] storage.session direto falhou, tentando via background:", err);
    }
  }
  if (hasChromeRuntime()) {
    try {
      const response = await chrome.runtime.sendMessage({ type: "zyrex:get-article", id });
      if (response && response.article) return response.article;
    } catch (err) {
      console.warn("[Zyrex Reader] mensagem zyrex:get-article falhou:", err);
    }
  }
  return null;
}

// Resolve o artigo a renderizar. Ordem de prioridade:
//   1. window.__ZX_ARTICLE__ — semeado por teste standalone (sempre vence,
//      útil pra abrir reader.html direto no navegador/dev-server sem
//      extensão nenhuma carregada);
//   2. #id= no hash → chrome.storage.session (fluxo real, item 5.4).
async function resolveArticle() {
  if (window.__ZX_ARTICLE__ && typeof window.__ZX_ARTICLE__ === "object") {
    return window.__ZX_ARTICLE__;
  }
  const id = getArticleIdFromHash();
  if (!id) return null;
  return fetchArticleByIdViaStorageSession(id);
}

// ---------------------------------------------------------------------------
// Renderização segura do artigo
// ---------------------------------------------------------------------------

// O HTML em article.contentHTML já vem sanitizado por allowlist em
// extract.js (extension/lib/extract.js — sanitizeFragment). Ainda assim,
// nunca fazemos `articleEl.innerHTML = article.contentHTML` diretamente:
// fazemos o parse num documento ISOLADO (DOMParser, igual ao próprio
// extract.js faz) e só então importamos os nós pro documento real via
// importNode — layer extra de defesa caso o handoff venha de uma fonte não
// confiável (ex.: um id forjado no hash).
function renderArticleHtmlInto(container, html) {
  const parser = new DOMParser();
  const isolatedDoc = parser.parseFromString(
    `<!doctype html><html><body>${html || ""}</body></html>`,
    "text/html"
  );
  container.textContent = "";
  const frag = document.createDocumentFragment();
  for (const node of Array.from(isolatedDoc.body.childNodes)) {
    frag.appendChild(document.importNode(node, true));
  }
  container.appendChild(frag);
}

function renderArticle(article) {
  const articleEl = document.getElementById("zx-article");
  const topbarTitleEl = document.getElementById("zx-topbar-title");
  const sourceLinkEl = document.getElementById("zx-topbar-source");
  const sourceTextEl = document.getElementById("zx-topbar-source-text");

  articleEl.textContent = "";

  if (!article) {
    const p = document.createElement("p");
    p.className = "zx-empty-state";
    p.textContent =
      "Não foi possível carregar este artigo. Feche e tente abrir o Modo Leitura novamente a partir da página original.";
    articleEl.appendChild(p);
    topbarTitleEl.textContent = "Modo Leitura";
    return null;
  }

  const title = (article.title || "").trim() || "Artigo sem título";
  document.title = `${title} — Modo Leitura`;
  topbarTitleEl.textContent = title;
  topbarTitleEl.setAttribute("tabindex", "-1");

  if (article.sourceUrl && isSafeUrl(article.sourceUrl)) {
    try {
      const host = new URL(article.sourceUrl).hostname.replace(/^www\./, "");
      sourceTextEl.textContent = host;
      sourceLinkEl.href = article.sourceUrl;
      sourceLinkEl.hidden = false;
    } catch {
      sourceLinkEl.hidden = true;
    }
  } else {
    sourceLinkEl.hidden = true;
  }

  if (article.lang) {
    articleEl.setAttribute("lang", article.lang);
  }

  const h1 = document.createElement("h1");
  h1.className = "zx-article-title";
  h1.textContent = title;
  articleEl.appendChild(h1);

  if (article.byline) {
    const byline = document.createElement("p");
    byline.className = "zx-article-byline";
    byline.textContent = article.byline;
    articleEl.appendChild(byline);
  }

  // Artigo gigante (item 5.6): background.js:truncateContentHtml cortou o
  // HTML acima de ~2MB antes de gravar em storage.session — aviso permanente
  // no topo do artigo (não só na live region, que desaparece) pra deixar
  // claro que o texto foi cortado, não que o artigo "acabou aí" de verdade.
  if (article.truncated) {
    const notice = document.createElement("p");
    notice.className = "zx-truncated-notice";
    notice.setAttribute("role", "note");
    notice.textContent =
      "Este artigo é muito grande e foi encurtado para exibição no Modo Leitura. Para o texto completo, use a página original.";
    articleEl.appendChild(notice);
  }

  const bodyContainer = document.createElement("div");
  bodyContainer.className = "zx-article-body";
  renderArticleHtmlInto(bodyContainer, article.contentHTML || "");
  articleEl.appendChild(bodyContainer);

  // Foco inicial no título (item 5.2/5.6 — acessibilidade básica já aqui).
  topbarTitleEl.focus({ preventScroll: true });

  return bodyContainer;
}

// ---------------------------------------------------------------------------
// Preferências (tema, fonte, tamanho, largura, imagens)
// ---------------------------------------------------------------------------

async function loadPrefs() {
  if (!hasChromeStorage()) return { ...DEFAULT_PREFS };
  try {
    const result = await chrome.storage.local.get(PREFS_KEY);
    const stored = result && result[PREFS_KEY];
    if (!stored || typeof stored !== "object") return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...stored };
  } catch (err) {
    console.warn("[Zyrex Reader] falha ao carregar zyrex_reader_prefs:", err);
    return { ...DEFAULT_PREFS };
  }
}

let savePrefsTimer = null;
function savePrefsDebounced(prefs) {
  if (!hasChromeStorage()) return;
  clearTimeout(savePrefsTimer);
  savePrefsTimer = setTimeout(() => {
    chrome.storage.local.set({ [PREFS_KEY]: prefs }).catch((err) => {
      console.warn("[Zyrex Reader] falha ao salvar zyrex_reader_prefs:", err);
    });
  }, 300);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyPrefsToDom(prefs) {
  const html = document.documentElement;
  html.setAttribute("data-zx-theme", prefs.theme);
  html.setAttribute("data-zx-font", prefs.font);
  html.setAttribute("data-zx-width", String(prefs.width));
  html.setAttribute("data-zx-images", prefs.imagesVisible ? "show" : "hide");
  html.setAttribute("data-zx-hl-color", prefs.hlColor);
  html.setAttribute("data-zx-hl-style", prefs.hlStyle);

  // A var vai no <html> (não no #zx-article) pra que a .zx-column também a herde:
  // a largura da coluna é em `ch`, que precisa ser medido na fonte de leitura
  // real (senão a coluna encolhe pro `ch` da fonte padrão de 16px).
  html.style.setProperty("--zx-font-size", `${prefs.fontSize}px`);

  // Reflete estado nos controles (chips aria-pressed, valores exibidos).
  document.querySelectorAll("[data-zx-set-theme]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.zxSetTheme === prefs.theme));
  });
  document.querySelectorAll("[data-zx-set-font]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.zxSetFont === prefs.font));
  });
  document.querySelectorAll("[data-zx-set-width]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.zxSetWidth) === prefs.width));
  });
  document.querySelectorAll("[data-zx-set-hl-color]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.zxSetHlColor === prefs.hlColor));
  });
  document.querySelectorAll("[data-zx-set-hl-style]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.zxSetHlStyle === prefs.hlStyle));
  });

  const fontSizeValueEl = document.getElementById("zx-font-size-value");
  if (fontSizeValueEl) fontSizeValueEl.textContent = `${prefs.fontSize}px`;

  const decBtn = document.getElementById("zx-btn-font-dec");
  const incBtn = document.getElementById("zx-btn-font-inc");
  if (decBtn) decBtn.disabled = prefs.fontSize <= FONT_SIZE_MIN;
  if (incBtn) incBtn.disabled = prefs.fontSize >= FONT_SIZE_MAX;

  const imagesToggle = document.getElementById("zx-toggle-images");
  if (imagesToggle) imagesToggle.checked = prefs.imagesVisible;

  const focusToggle = document.getElementById("zx-toggle-focus");
  if (focusToggle) focusToggle.checked = prefs.focusMode;
  const articleEl = document.getElementById("zx-article");
  if (articleEl) articleEl.classList.toggle("zx-focus-mode", !!prefs.focusMode);
}

function wireAppearanceControls(prefs) {
  const persist = () => savePrefsDebounced(prefs);

  document.querySelectorAll("[data-zx-set-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.theme = btn.dataset.zxSetTheme;
      applyPrefsToDom(prefs);
      persist();
    });
  });

  document.querySelectorAll("[data-zx-set-font]").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.font = btn.dataset.zxSetFont;
      applyPrefsToDom(prefs);
      persist();
    });
  });

  document.querySelectorAll("[data-zx-set-width]").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.width = Number(btn.dataset.zxSetWidth);
      applyPrefsToDom(prefs);
      persist();
    });
  });

  document.querySelectorAll("[data-zx-set-hl-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.hlColor = btn.dataset.zxSetHlColor;
      applyPrefsToDom(prefs);
      persist();
    });
  });

  document.querySelectorAll("[data-zx-set-hl-style]").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.hlStyle = btn.dataset.zxSetHlStyle;
      applyPrefsToDom(prefs);
      persist();
    });
  });

  const decBtn = document.getElementById("zx-btn-font-dec");
  const incBtn = document.getElementById("zx-btn-font-inc");
  decBtn.addEventListener("click", () => {
    prefs.fontSize = clamp(prefs.fontSize - FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX);
    applyPrefsToDom(prefs);
    persist();
  });
  incBtn.addEventListener("click", () => {
    prefs.fontSize = clamp(prefs.fontSize + FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX);
    applyPrefsToDom(prefs);
    persist();
  });

  const imagesToggle = document.getElementById("zx-toggle-images");
  imagesToggle.addEventListener("change", () => {
    prefs.imagesVisible = imagesToggle.checked;
    applyPrefsToDom(prefs);
    persist();
  });

  const focusToggle = document.getElementById("zx-toggle-focus");
  focusToggle.addEventListener("change", () => {
    prefs.focusMode = focusToggle.checked;
    applyPrefsToDom(prefs);
    persist();
  });
}

// ---------------------------------------------------------------------------
// Player (item 5.3) — play por bloco, "Ler artigo" contínuo, destaque,
// clique-na-palavra, modo foco.
// ---------------------------------------------------------------------------
//
// Mesmo padrão de content.js:boot() (ver relatório da Etapa 5.2/5.3), mas
// aqui NÃO há Shadow DOM nem retargeting de eventos — o DOM do artigo é
// nosso, criado por renderArticle(). reader.html é chrome-extension://,
// então falamos DIRETO com a API (httpTransport + apiUrl de zyrex_prefs),
// sem passar pelo service worker.

// Preferências de voz/velocidade/apiUrl vêm do MESMO bucket do widget
// (zyrex_prefs, storage.sync) — o reader não duplica essas prefs; só lê,
// pra manter a última voz/velocidade escolhida coerente entre widget e
// Modo Leitura. Falha ao ler cai nos defaults (Antônio, 1.0x, API pública).
async function loadAudioPrefs() {
  const fallback = { voice: DEFAULT_VOICE, speed: DEFAULT_SPEED, apiUrl: DEFAULT_API_URL };
  if (!hasChromeStorage() || !chrome.storage.sync) return fallback;
  try {
    const result = await chrome.storage.sync.get(AUDIO_PREFS_KEY);
    const saved = (result && result[AUDIO_PREFS_KEY]) || {};
    return {
      voice: typeof saved.voice === "string" && saved.voice ? saved.voice : DEFAULT_VOICE,
      speed: Number.isFinite(saved.speed) && saved.speed > 0 ? saved.speed : DEFAULT_SPEED,
      apiUrl: typeof saved.apiUrl === "string" && saved.apiUrl.trim() ? saved.apiUrl.trim() : DEFAULT_API_URL,
    };
  } catch (err) {
    console.warn("[Zyrex Reader] falha ao carregar zyrex_prefs:", err);
    return fallback;
  }
}

let saveAudioPrefsTimer = null;
function saveAudioPrefsDebounced(partial) {
  if (!hasChromeStorage() || !chrome.storage.sync) return;
  clearTimeout(saveAudioPrefsTimer);
  saveAudioPrefsTimer = setTimeout(async () => {
    try {
      const result = await chrome.storage.sync.get(AUDIO_PREFS_KEY);
      const current = (result && result[AUDIO_PREFS_KEY]) || {};
      await chrome.storage.sync.set({ [AUDIO_PREFS_KEY]: { ...current, ...partial } });
    } catch (err) {
      console.warn("[Zyrex Reader] falha ao salvar zyrex_prefs:", err);
    }
  }, 300);
}

// Blocos legíveis do artigo: mesmos seletores de BLOCK_TEXT_TAGS em
// extract.js (p/h1-h6/li/blockquote/figcaption), na ordem do documento —
// cada um vira um bloco endereçável pro player (1 bloco = 1 sessão de "play
// no parágrafo"; "Ler artigo" enfileira todos). Aninhados (li dentro de
// blockquote etc.) não existem no HTML sanitizado de extract.js, então não
// há necessidade de dedupe aqui.
const READER_BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption";

function collectReaderBlocks(bodyContainer) {
  const els = Array.from(bodyContainer.querySelectorAll(READER_BLOCK_SELECTOR));
  return els.filter((el) => (el.textContent || "").trim().length > 0);
}

// Ícones SVG reutilizados no botão de bloco e no botão "Ler artigo".
const ICON_PLAY = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

function setSvgIcon(svgEl, pathMarkup) {
  if (svgEl) svgEl.innerHTML = pathMarkup;
}

// Reflete o estado tocando/pausado no botão de bloco: ícone, classe visual,
// aria-pressed e aria-label (leitor de tela precisa saber "Pausar este
// trecho" vs. "Ler este trecho", não só a mudança de ícone).
function setBlockButtonPlaying(btn, playing) {
  if (!btn) return;
  btn.classList.toggle("zx-block-playing", playing);
  setSvgIcon(btn.querySelector("svg"), playing ? ICON_PAUSE : ICON_PLAY);
  btn.setAttribute("aria-pressed", String(!!playing));
  const label = playing ? "Pausar este trecho" : "Ler este trecho";
  btn.setAttribute("aria-label", label);
  btn.setAttribute("title", label);
}

// Cria (ou devolve, se já existir) o botão de play na margem do bloco.
function ensureBlockPlayButton(blockEl, onClick) {
  let btn = blockEl.querySelector(":scope > .zx-block-play");
  if (btn) return btn;
  btn = document.createElement("button");
  btn.type = "button";
  btn.className = "zx-block-play";
  btn.setAttribute("aria-label", "Ler este trecho");
  btn.setAttribute("title", "Ler este trecho");
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" data-zx-icon="play">${ICON_PLAY}</svg>`;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(blockEl, btn);
  });
  // position:absolute do CSS ancora no bloco — o bloco precisa de position
  // relative, já aplicado por .zx-reading-active, mas o botão deve existir
  // e se posicionar corretamente mesmo fora do estado ativo.
  const computed = window.getComputedStyle(blockEl);
  if (computed.position === "static") blockEl.style.position = "relative";
  blockEl.insertBefore(btn, blockEl.firstChild);
  return btn;
}

// Inicializa o player: importa os módulos compartilhados, cria o
// PlaybackController + o motor de destaque, liga os botões de bloco, a barra
// de controles e o clique-na-palavra. Chamado do boot() só quando o artigo
// renderizou com sucesso (bodyContainer não-nulo).
async function initPlayer(bodyContainer) {
  const [{ createPlaybackController, httpTransport }, { createHighlightEngine }] = await Promise.all([
    import(new URL("../lib/zx-player.js", import.meta.url).href),
    import(new URL("../lib/highlight-engine.js", import.meta.url).href),
  ]);

  const audioEl = document.createElement("audio");
  audioEl.id = "zx-audio";
  audioEl.hidden = true;
  document.body.appendChild(audioEl);

  const audioPrefs = await loadAudioPrefs();
  const audioState = { voice: audioPrefs.voice, speed: audioPrefs.speed, apiUrl: audioPrefs.apiUrl };

  const playArticleBtn = document.getElementById("zx-btn-play-article");
  const playArticleLabel = document.getElementById("zx-btn-play-article-label");
  const playArticleIcon = playArticleBtn.querySelector('[data-zx-icon="play"]');
  const rewindBtn = document.getElementById("zx-btn-rewind");
  const forwardBtn = document.getElementById("zx-btn-forward");
  const voiceSel = document.getElementById("zx-select-voice");
  const speedRange = document.getElementById("zx-range-speed");
  const speedValueEl = document.getElementById("zx-speed-value");
  const articleEl = document.getElementById("zx-article");
  const liveStatusEl = document.getElementById("zx-live-status");

  voiceSel.value = audioState.voice;
  speedRange.value = String(audioState.speed);
  speedValueEl.textContent = audioState.speed.toFixed(1) + "x";

  function setStatus(msg) {
    if (liveStatusEl) liveStatusEl.textContent = msg || "";
  }

  // ---- destaque (motor v2 — Custom Highlight API); no-op automático em
  // Chrome < 105 (a própria factory degrada, ver highlight-engine.js). Aqui
  // não há widget nenhum pra ignorar — todo o documento é o artigo.
  const engine = createHighlightEngine({
    onDegraded: () => setStatus("O texto mudou — seguindo só com o áudio."),
    onActiveWord: handleActiveWord,
  });
  let engineTarget = null; // bloco (Element) da sessão de destaque ativa

  // ---- auto-scroll do bloco ativo (mesma banda de conforto do widget) ----
  const AUTO_SCROLL_SUSPEND_MS = 4000;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let autoScrollBusy = false;
  let manualScrollUntil = 0;
  let lastScrollSentence = -1;

  // Troca de fonte/tamanho/largura (data-zx-font / --zx-font-size / data-zx-width
  // no <html>) e a chegada tardia das web fonts de dislexia relayoutam o texto.
  // Isso NÃO afeta o timing (a timeline é media-time; os Ranges são por offset
  // de caractere), mas move a palavra na tela — o destaque podia ficar pintado
  // na geometria antiga até a próxima palavra, e o auto-scroll (1 por frase)
  // podia deixar a palavra ativa fora da banda de conforto. Aqui repintamos o
  // destaque na geometria nova e liberamos o auto-scroll a recentralizar.
  const onReflow = () => {
    lastScrollSentence = -1;
    try { engine.rerender && engine.rerender(); } catch (_) {}
  };
  const reflowObserver = new MutationObserver(onReflow);
  reflowObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-zx-font", "data-zx-width", "style"],
  });
  if (document.fonts && typeof document.fonts.addEventListener === "function") {
    document.fonts.addEventListener("loadingdone", onReflow);
  }

  function suspendAutoScroll() {
    manualScrollUntil = Date.now() + AUTO_SCROLL_SUSPEND_MS;
  }
  window.addEventListener("wheel", suspendAutoScroll, { passive: true });
  window.addEventListener("touchmove", suspendAutoScroll, { passive: true });
  const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
  window.addEventListener("keydown", (e) => { if (SCROLL_KEYS.has(e.key)) suspendAutoScroll(); });

  function handleActiveWord(range, info) {
    if (!isPlayingNow()) return;
    if (autoScrollBusy || Date.now() < manualScrollUntil) return;
    const reduced = prefersReducedMotion.matches;
    if (reduced && !info.sentenceChanged) return;
    let rect = null;
    try { rect = range.getBoundingClientRect(); } catch (_) { return; }
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const vh = window.innerHeight;
    if (rect.top >= vh * 0.2 && rect.bottom <= vh * 0.75) return;
    if (info.sentenceIdx === lastScrollSentence) return;
    lastScrollSentence = info.sentenceIdx;
    autoScrollBusy = true;
    const unlock = () => { autoScrollBusy = false; };
    window.addEventListener("scrollend", unlock, { once: true });
    setTimeout(unlock, 600); // trava solta aqui se 'scrollend' não vier
    try {
      window.scrollTo({
        top: Math.max(0, rect.top + window.scrollY - vh * 0.35),
        behavior: reduced ? "auto" : "smooth",
      });
    } catch (_) {
      autoScrollBusy = false;
    }
  }

  // ---- estado local da sessão (fila de blocos, bloco ativo, ícones) ----
  let currentBlocks = []; // [{text, container}] na ordem da sessão vigente
  let currentBlockIdx = -1;
  let hasActiveReading = false;
  let activeBlockEl = null; // bloco Element com .zx-reading-active aplicada
  let activeBlockBtn = null; // botão de margem do bloco ativo (ícone play/pause)
  let isArticleSession = false; // sessão vigente é "Ler artigo" (multi-bloco)?

  function isPlayingNow() {
    return controller.getState() === "playing";
  }

  function setActiveBlockVisual(blockEl) {
    if (activeBlockEl && activeBlockEl !== blockEl) {
      activeBlockEl.classList.remove("zx-reading-active");
    }
    if (activeBlockBtn && activeBlockBtn !== (blockEl && blockEl.querySelector(":scope > .zx-block-play"))) {
      setBlockButtonPlaying(activeBlockBtn, false);
    }
    activeBlockEl = blockEl || null;
    if (activeBlockEl) {
      activeBlockEl.classList.add("zx-reading-active");
      activeBlockBtn = activeBlockEl.querySelector(":scope > .zx-block-play");
    } else {
      activeBlockBtn = null;
    }
  }

  function setPlayArticleIcon(playing) {
    setSvgIcon(playArticleIcon, playing ? ICON_PAUSE : ICON_PLAY);
    playArticleLabel.textContent = playing ? "Pausar" : "Ler artigo";
    playArticleBtn.setAttribute("aria-label", playing ? "Pausar leitura" : "Ler artigo");
    playArticleBtn.setAttribute("aria-pressed", String(!!playing));
  }

  function renderPlayerState(st) {
    hasActiveReading = st === "loading" || st === "ready" || st === "playing" || st === "paused";
    const playing = st === "loading" || st === "ready" || st === "playing";
    if (isArticleSession) setPlayArticleIcon(playing);
    if (activeBlockBtn) setBlockButtonPlaying(activeBlockBtn, playing);
    if (st === "loading") setStatus("Gerando áudio...");
    else if (st === "playing") setStatus("Lendo.");
    else if (st === "paused") setStatus("Pausado.");
    if (st === "idle") {
      engine.endSession();
      engineTarget = null;
      currentBlocks = [];
      currentBlockIdx = -1;
      isArticleSession = false;
      setActiveBlockVisual(null);
      setPlayArticleIcon(false);
      setStatus("");
      readingPosition.blockIdx = -1;
      readingPosition.mediaTime = 0;
      readingPosition.isArticleSession = false;
    }
    if (st === "ended") {
      setPlayArticleIcon(false);
      if (activeBlockBtn) setBlockButtonPlaying(activeBlockBtn, false);
      setStatus("Fim da leitura.");
    }
  }

  // Chunk novo: bloco mudou → sessão de destaque nova pro bloco inteiro, e o
  // visual (fundo + botão) segue o bloco ativo. Auto-scroll por bloco só
  // entra como fallback se o destaque estiver indisponível (sem Highlight
  // API) — com destaque, quem rola é o auto-scroll por palavra.
  function handleChunkChange(chunk) {
    const container = chunk.container || null;
    const blockChanged = chunk.blockIdx !== currentBlockIdx;
    if (container && container.isConnected) {
      if (container !== engineTarget) {
        try {
          engine.startSession(container, { twoLevel: true });
          engineTarget = container;
          lastScrollSentence = -1;
        } catch (_) {
          engineTarget = null;
        }
      }
      engine.setChunkSubtitle(chunk, chunk.subtitle);
      if (blockChanged) setActiveBlockVisual(container);
    }
    if (blockChanged && container && container.isConnected && currentBlocks.length > 1) {
      const wordScrollActive = engine.isSupported;
      if (!wordScrollActive && Date.now() >= manualScrollUntil) {
        try {
          container.scrollIntoView({
            block: "center",
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
          });
        } catch (_) {}
      }
    }
    currentBlockIdx = chunk.blockIdx;
    // Handoff de posição (item 5.4): bloco vigente + sinaliza se é sessão
    // "Ler artigo" (multi-bloco) — o mediaTime fica por conta de onWordTick,
    // que dispara com frequência bem maior.
    readingPosition.blockIdx = chunk.blockIdx;
    readingPosition.isArticleSession = isArticleSession;
  }

  function handleSessionEnd() {
    setTimeout(() => {
      if (!hasActiveReading) {
        engine.endSession();
        engineTarget = null;
      }
    }, 1000);
  }

  const controller = createPlaybackController({
    audioEl,
    apiUrl: audioState.apiUrl,
    transport: httpTransport,
    getVoice: () => audioState.voice,
    getSpeed: () => audioState.speed,
    onState: renderPlayerState,
    onStatus: (msg) => { if (msg) setStatus(msg); },
    onChunkChange: handleChunkChange,
    onWordTick: (chunk, mediaTime) => {
      engine.tick(mediaTime);
      readingPosition.mediaTime = mediaTime; // handoff de posição (item 5.4)
    },
    onSessionEnd: handleSessionEnd,
  });

  window.addEventListener("pagehide", () => {
    engine.endSession();
    engineTarget = null;
    try { reflowObserver.disconnect(); } catch (_) {}
    if (document.fonts && typeof document.fonts.removeEventListener === "function") {
      document.fonts.removeEventListener("loadingdone", onReflow);
    }
    try { controller.stop(); } catch (_) {}
  });

  // ---- construção da fila a partir de blocos do DOM ----
  function blocksFromElements(elements) {
    return elements
      .map((el) => ({ text: (el.textContent || "").trim(), container: el }))
      .filter((b) => b.text);
  }

  function startReading(blocks, { article = false } = {}) {
    if (!blocks.length) { setStatus("Nada para ler neste trecho."); return; }
    engine.endSession();
    engineTarget = null;
    lastScrollSentence = -1;
    currentBlocks = blocks;
    currentBlockIdx = -1;
    isArticleSession = article;
    if (article) setPlayArticleIcon(true);
    controller.start(blocks);
  }

  // ---- botão de play por bloco (margem esquerda) ----
  const readerBlocks = collectReaderBlocks(bodyContainer);
  readerBlocks.forEach((blockEl) => {
    ensureBlockPlayButton(blockEl, (target, btn) => {
      const sameBlock =
        hasActiveReading &&
        !isArticleSession &&
        currentBlocks.length === 1 &&
        currentBlocks[0].container === target;
      if (sameBlock) {
        controller.togglePlayPause();
        return;
      }
      startReading(blocksFromElements([target]), { article: false });
    });
  });

  // ---- "Ler artigo" (D2: contínuo, fila com TODOS os blocos) ----
  playArticleBtn.addEventListener("click", () => {
    if (isArticleSession && hasActiveReading) {
      controller.togglePlayPause();
      return;
    }
    if (controller.getState() === "ended" && isArticleSession && currentBlocks.length) {
      startReading(currentBlocks, { article: true });
      return;
    }
    const blocks = blocksFromElements(collectReaderBlocks(bodyContainer));
    startReading(blocks, { article: true });
  });

  // ---- retomada de posição no pop-out (item 5.4) ----
  // Chamado pelo boot() quando a aba nasce com '&pos=' no hash (handoff do
  // overlay). Reconstrói a MESMA fila que estaria tocando (bloco alvo em
  // diante, se for sessão "Ler artigo"; só o bloco, se era play por bloco) e
  // faz seek pro tempo de mídia salvo assim que o primeiro chunk carregar —
  // seekTo() exige sessão já iniciada (queue populada), por isso o seek
  // entra num listener de estado one-shot em vez de acontecer no mesmo tick.
  function resumeAtPosition(position) {
    const allBlockEls = collectReaderBlocks(bodyContainer);
    if (!allBlockEls.length || position.blockIdx >= allBlockEls.length) return;
    const targetEls = position.article ? allBlockEls.slice(position.blockIdx) : [allBlockEls[position.blockIdx]];
    const blocks = blocksFromElements(targetEls);
    if (!blocks.length) return;
    let seeked = false;
    startReading(blocks, { article: !!position.article });
    // O primeiro chunk da fila reconstruída corresponde ao blockIdx pedido
    // (chunkIdx 0); mediaTime é local a ESSE bloco (mesma convenção usada no
    // handoff — readingPosition.mediaTime vem de onWordTick, que já é tempo
    // dentro do chunk/bloco vigente). Aguarda 'ready' com um pequeno poll
    // (mais simples e robusto aqui do que estender a API pública do
    // controller só para este caso único de boot).
    const t0 = Date.now();
    const tryApplySeek = () => {
      if (seeked) return;
      if (controller.getState() === "ready" || controller.getState() === "playing") {
        seeked = true;
        controller.seekTo(0, position.mediaTime);
        return;
      }
      if (Date.now() - t0 > 8000) return; // desiste — a leitura já começou do início do bloco, estado seguro
      requestAnimationFrame(tryApplySeek);
    };
    requestAnimationFrame(tryApplySeek);
  }

  // ---- ±10s globais (cross-chunk, já resolvido pelo controller) ----
  rewindBtn.addEventListener("click", () => controller.seekRelative(-10));
  forwardBtn.addEventListener("click", () => controller.seekRelative(10));

  // ---- clique-na-palavra (item 3.6/D4): seek pro trecho clicado ----
  // Capture pra ganhar de qualquer handler do próprio artigo; só consome o
  // clique quando o hit-test acerta uma palavra já alinhada — links dentro
  // do artigo continuam clicáveis normalmente.
  const CLICK_SEEK_IGNORE = 'a, button, input, select, textarea, [contenteditable]';
  document.addEventListener(
    "click",
    (e) => {
      if (!hasActiveReading) return;
      const st = controller.getState();
      if (st !== "playing" && st !== "paused" && st !== "ready") return;
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest(CLICK_SEEK_IGNORE)) return;
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) return; // seleção viva tem prioridade
      let hit = null;
      try { hit = engine.hitTest(e.clientX, e.clientY); } catch (_) {}
      if (!hit || hit.chunkIdx < 0) return;
      e.preventDefault();
      e.stopPropagation();
      controller.seekTo(hit.chunkIdx, hit.tStart);
    },
    true
  );

  // ---- voz / velocidade (troca de voz re-sintetiza; velocidade é playbackRate) ----
  voiceSel.addEventListener("change", () => {
    audioState.voice = voiceSel.value;
    saveAudioPrefsDebounced({ voice: audioState.voice });
  });
  speedRange.addEventListener("input", () => {
    audioState.speed = parseFloat(speedRange.value);
    speedValueEl.textContent = audioState.speed.toFixed(1) + "x";
    controller.setRate(audioState.speed);
    saveAudioPrefsDebounced({ speed: audioState.speed });
  });

  // Habilita os controles (nasciam `disabled` no reader.html até este ponto).
  [playArticleBtn, rewindBtn, forwardBtn, voiceSel, speedRange].forEach((el) => {
    el.disabled = false;
  });

  return { controller, engine, resumeAtPosition };
}

// ---------------------------------------------------------------------------
// Fechar / pop-out
// ---------------------------------------------------------------------------

// Limpa a chave do artigo em chrome.storage.session (item 5.6). No overlay
// quem limpa é o content.js (closeReaderOverlay, dono do id desde que o
// pediu ao background) — mas a aba pop-out não tem um content.js "dono"
// vigiando: ela mesma precisa avisar o background ao fechar, senão o artigo
// (podendo ter até ~2MB de HTML) fica ocupando a cota de storage.session até
// o browser reiniciar. Chamado tanto pelo botão fechar (via closeReader)
// quanto por 'pagehide' (cobre fechar a aba pelo X do Chrome/Ctrl+W).
let articleCleanupSent = false;
function cleanupStoredArticle() {
  if (articleCleanupSent) return;
  const id = getArticleIdFromHash();
  if (!id || !hasChromeRuntime()) return;
  articleCleanupSent = true;
  try {
    chrome.runtime.sendMessage({ type: "zyrex:clear-article", id }, () => void chrome.runtime.lastError);
  } catch (_) {
    // Aba fechando: o SW pode já ter descartado a porta — sem problema, o
    // storage.session tem TTL pela sessão do browser mesmo sem essa limpeza.
  }
}

function closeReader() {
  if (isPopoutTab()) {
    cleanupStoredArticle();
    window.close();
    return;
  }
  // Overlay num iframe dentro da página do host: quem monta o iframe (item
  // 5.4, content.js) escuta esta mensagem pra remover o nó e destravar o
  // scroll da página (e é ele quem manda zyrex:clear-article, pois foi ele
  // quem pediu zyrex:save-article — reader.js não duplica a limpeza aqui).
  try {
    window.parent.postMessage({ source: "zyrex-reader", type: "zx-reader:close" }, "*");
  } catch (err) {
    console.warn("[Zyrex Reader] postMessage de close falhou:", err);
  }
}

function requestPopout() {
  const id = getArticleIdFromHash();
  // Overlay → pede ao pai pra abrir uma aba nova (o pai tem acesso a
  // chrome.tabs via mensagem ao background) e então fecha o overlay. Se já
  // estamos numa aba própria, não há o que fazer (botão deveria estar
  // oculto/desabilitado nesse caso, mas a ação aqui é no-op seguro).
  if (isPopoutTab()) return;
  // Handoff de posição de leitura (item 5.4): bloco + tempo de mídia
  // vigentes, se houver uma sessão de leitura em andamento. content.js
  // repassa isso ao background, que acrescenta ao hash da aba nova; o
  // boot() da aba lê e retoma a leitura no mesmo ponto em vez de do zero.
  const position =
    readingPosition.blockIdx >= 0
      ? {
          blockIdx: readingPosition.blockIdx,
          mediaTime: readingPosition.mediaTime,
          article: readingPosition.isArticleSession,
        }
      : null;
  try {
    window.parent.postMessage({ source: "zyrex-reader", type: "zx-reader:popout", id, position }, "*");
  } catch (err) {
    console.warn("[Zyrex Reader] postMessage de popout falhou:", err);
  }
}

function wireChrome() {
  document.getElementById("zx-btn-close").addEventListener("click", closeReader);
  document.getElementById("zx-btn-popout").addEventListener("click", requestPopout);

  // Salvar PDF: dispara a impressão do navegador ("Salvar como PDF"). O
  // @media print em reader.css esconde a UI e mantém a tipografia escolhida
  // (tamanho/fonte/largura). Chrome imprime o próprio documento do reader —
  // tanto na aba pop-out quanto no iframe do overlay (imprime só o iframe).
  const pdfBtn = document.getElementById("zx-btn-pdf");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn("[Zyrex Reader] window.print() falhou:", err);
      }
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeReader();
    }
  });

  // Pop-out não precisa (nem deve) oferecer "abrir em nova aba" de novo.
  if (isPopoutTab()) {
    const popoutBtn = document.getElementById("zx-btn-popout");
    popoutBtn.hidden = true;
    // Cobre fechar a aba por qualquer via que não seja o botão (X da aba do
    // Chrome, Ctrl+W, navegar pra outra URL) — sem isso a chave em
    // storage.session só some quando a sessão do browser inteira reinicia.
    window.addEventListener("pagehide", cleanupStoredArticle);
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  wireChrome();

  const prefs = await loadPrefs();
  applyPrefsToDom(prefs);
  wireAppearanceControls(prefs);

  const article = await resolveArticle();
  const bodyContainer = renderArticle(article);
  applyPrefsToDom(prefs); // reaplica: renderArticle recriou #zx-article (classe zx-focus-mode)

  // Live region: anuncia o corte pra quem usa leitor de tela (o aviso visual
  // .zx-truncated-notice já foi inserido por renderArticle, mas quem não olha
  // a tela também precisa saber). setTimeout(0): alguns leitores de tela
  // perdem a primeira atualização de um aria-live se ela acontece antes da
  // região ter sido "vista" ao menos uma vez após o load.
  if (article && article.truncated) {
    const liveStatusEl = document.getElementById("zx-live-status");
    setTimeout(() => {
      if (liveStatusEl) {
        liveStatusEl.textContent =
          "Este artigo é muito grande e foi encurtado para exibição no Modo Leitura.";
      }
    }, 0);
  }

  // Sinaliza pro CSS/QA que o boot terminou (últimos toques de layout podem
  // depender disso; inofensivo se ninguém usar).
  document.documentElement.setAttribute("data-zx-ready", "true");

  // Player (item 5.3) só entra em campo quando há artigo renderizado de
  // verdade — sem isso os controles seguem `disabled` (estado seguro).
  if (bodyContainer) {
    try {
      const player = await initPlayer(bodyContainer);
      // Handoff de posição (item 5.4): só relevante na aba pop-out, que nasce
      // com '&pos=' no hash (ver getPositionFromHash). Overlay nunca tem
      // 'pos' — ele é sempre a origem do handoff, nunca o destino.
      const position = getPositionFromHash();
      if (position && player && typeof player.resumeAtPosition === "function") {
        player.resumeAtPosition(position);
      }
    } catch (err) {
      console.error("[Zyrex Reader] falha ao iniciar o player:", err);
    }
  }
}

boot().catch((err) => {
  console.error("[Zyrex Reader] falha no boot:", err);
  renderArticle(null);
});

// Exposto só para QA/teste manual standalone (ex.: preview_eval no dev-server
// sem extensão carregada): permite semear window.__ZX_ARTICLE__ e re-renderizar
// sem recarregar a página. Não é usado pelo fluxo normal.
window.__zxReaderDebug = { renderArticle, resolveArticle, boot };

// ---------------------------------------------------------------------------
// CONTRATO PARA O PRÓXIMO AGENTE (item 5.4 — overlay + pop-out)
// ---------------------------------------------------------------------------
// Item 5.3 (player) está implementado: ver a seção "Player (item 5.3)" acima
// (initPlayer + toda a wiring de botões). Resumo do que já funciona:
//   - Botão de play na margem esquerda de cada bloco legível (p/h1-h6/li/
//     blockquote/figcaption) — .zx-block-play, criado dinamicamente por
//     ensureBlockPlayButton() dentro de initPlayer(); lê SÓ aquele bloco.
//   - "Ler artigo" (#zx-btn-play-article) — fila com TODOS os blocos legíveis
//     do artigo, na ordem do DOM; contínuo (D2), auto-avanço via fila do
//     controller (Etapa 2.6).
//   - Destaque (highlight-engine.js): sessão por bloco ativo, ::highlight
//     via CSS já calibrado por tema em reader.css; auto-scroll por palavra
//     (banda de conforto 20–75%, suspensão em scroll manual, 1 scroll por
//     frase, respeita prefers-reduced-motion).
//   - Clique numa palavra do trecho em leitura faz seek (engine.hitTest →
//     controller.seekTo); links do artigo continuam clicáveis (ignorados
//     pelo CLICK_SEEK_IGNORE).
//   - ±10s (#zx-btn-rewind/#zx-btn-forward), voz (#zx-select-voice, troca
//     re-sintetiza no próximo chunk) e velocidade (#zx-range-speed,
//     playbackRate instantâneo) — voz/velocidade/apiUrl persistidos em
//     zyrex_prefs (storage.sync), MESMO bucket do widget (content.js).
//   - Modo foco (#zx-toggle-focus, prefs.focusMode em zyrex_reader_prefs):
//     classe .zx-focus-mode em #zx-article esmaece (opacity) todo bloco que
//     não é .zx-reading-active.
//   - initPlayer() só roda quando renderArticle() devolve um bodyContainer
//     não-nulo (artigo carregou de verdade) — sem artigo, os controles
//     seguem `disabled` (estado seguro, sem exceptions).
//
// O reader fala DIRETO com a API (httpTransport + apiUrl de zyrex_prefs),
// SEM passar pelo service worker — reader.html é chrome-extension://, sem
// CSP de site pra contornar (diferente do content script). Se o 5.4 quiser
// unificar com o transport do SW por algum motivo (ex. contabilizar quota
// num só lugar), troque só o `transport` passado a createPlaybackController
// em initPlayer() — o resto não muda.
//
// Handoff do artigo (produzido pelo item 5.4, content.js):
//   - location.hash: '#id=<chave>' (mais parâmetros extras não quebram —
//     parse via URLSearchParams). Pop-out deve reconhecer via '?tab=1'
//     (query string) para: (a) esconder o botão de pop-out (já feito aqui);
//     (b) window.close() no fechar em vez de postMessage ao pai.
//   - Artigo em chrome.storage.session[id] = { title, byline, contentHTML,
//     lang, sourceUrl, textBlocks } (formato de extract.js:extractArticle).
//     reader.js tenta ler direto (storage.session.get) e cai pra mensagem
//     'zyrex:get-article' ao background se não tiver acesso direto — o
//     item 5.4 deve implementar UM dos dois no background (ou os dois).
//   - Pra teste sem extensão: window.__ZX_ARTICLE__ = {...} ANTES de
//     reader.js rodar (ver seção de testes do relatório).
//
// Mensagens postMessage já emitidas por este arquivo (pro content.js/item
// 5.4 escutar no `window` do documento que hospeda o iframe):
//   { source: 'zyrex-reader', type: 'zx-reader:close' }
//   { source: 'zyrex-reader', type: 'zx-reader:popout', id }
//
// Cuidado do 5.4 com o áudio ao fechar o overlay: hoje só window 'pagehide'
// para o controller (mesma convenção do content.js). Fechar o overlay via
// postMessage NÃO descarrega o documento do iframe sozinho — se o 5.4 optar
// por manter o iframe vivo escondido (em vez de remover o nó), ele deve
// também chamar algo que pare o áudio (ex. postMessage adicional pro
// reader.js parar o controller, ou simplesmente remover/recriar o <iframe>,
// que já dispara pagehide/unload nele).
