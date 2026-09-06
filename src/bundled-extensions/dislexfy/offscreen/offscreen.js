/**
 * Dislexfy — offscreen document (item 4.3)
 *
 * Reproduz o áudio TTS quando a CSP media-src da página bloqueia o <audio>
 * do shadow DOM (ex.: GitHub). Este documento roda num contexto de extensão
 * (chrome-extension://…), imune à CSP da página. Só existe UM <audio> aqui:
 * um novo load derruba a leitura anterior (single-reader) e avisa quem
 * perdeu a corrida via zyrex:off:preempted.
 *
 * Mensagens recebidas (background repassa do content script):
 *   zyrex:off:load  {audio: base64, rate}  — carrega e toca um chunk novo
 *   zyrex:off:play  / zyrex:off:pause      — controle
 *   zyrex:off:seek  {t}                    — currentTime = t
 *   zyrex:off:rate  {rate}                 — playbackRate = rate
 *   zyrex:off:stop                         — derruba a leitura corrente
 *
 * Mensagens emitidas (pro background repassar ao content script que pediu):
 *   zyrex:off:tick      {t, playing, duration} — a cada ~250ms enquanto há áudio carregado
 *   zyrex:off:ended
 *   zyrex:off:error
 *   zyrex:off:preempted — esta leitura foi derrubada por um novo load
 */

const TICK_INTERVAL_MS = 250;

const audio = new Audio();
audio.hidden = true;
try {
  audio.preservesPitch = true;
  audio.webkitPreservesPitch = true;
} catch (_) {}

let currentUrl = null;   // blob: URL do chunk carregado agora (revogada na troca)
let loadGen = 0;         // geração do load vigente — invalida callbacks de loads antigos
let tickTimer = null;
// Intenção de tocar (refletindo os play()/pause() do shim), independente do
// load em andamento: como o load chega por uma mensagem separada e mais
// lenta (o content.js faz um fetch(blobUrl) antes de mandar zyrex:off:load),
// zyrex:off:play/pause podem chegar ANTES do load terminar — sem isso, o
// chunk sempre tocaria sozinho ao carregar, ignorando uma pausa pedida
// enquanto o próximo chunk ainda carregava (bug: áudio tocando pausado).
let wantPlay = false;

function post(msg) {
  try {
    chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
  } catch (_) {
    // contexto invalidado — nada a fazer num documento sem UI.
  }
}

function stopTicker() {
  if (tickTimer != null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}
function startTicker() {
  if (tickTimer != null) return;
  tickTimer = setInterval(() => {
    post({
      type: "zyrex:off:tick",
      t: audio.currentTime || 0,
      playing: !audio.paused,
      duration: Number.isFinite(audio.duration) ? audio.duration : undefined,
    });
  }, TICK_INTERVAL_MS);
}

function releaseUrl() {
  if (currentUrl) {
    try { URL.revokeObjectURL(currentUrl); } catch (_) {}
    currentUrl = null;
  }
}

function base64ToBlob(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "audio/mpeg" });
}

function loadChunk(b64, rate) {
  const myGen = ++loadGen;
  // Um load novo derruba o anterior — quem estava tocando perde a corrida.
  stopTicker();
  try { audio.pause(); } catch (_) {}
  releaseUrl();
  let blob;
  try {
    blob = base64ToBlob(b64);
  } catch (_) {
    post({ type: "zyrex:off:error" });
    return;
  }
  currentUrl = URL.createObjectURL(blob);
  audio.src = currentUrl;
  if (Number.isFinite(rate) && rate > 0) {
    try { audio.playbackRate = rate; } catch (_) {}
  }
  try { audio.load(); } catch (_) {}
  // Só toca automaticamente se a intenção vigente (wantPlay) for tocar — ela
  // pode ter sido setada por um zyrex:off:play que chegou ANTES deste load
  // terminar, ou zerada por um zyrex:off:pause nesse meio tempo (ver o
  // comentário em wantPlay acima). Sem isso, o chunk tocaria mesmo pausado.
  const playIfWanted = () => {
    if (myGen !== loadGen) return; // outro load chegou antes do metadata
    if (!wantPlay) return;
    audio.play().then(startTicker).catch(() => {
      if (myGen !== loadGen) return;
      post({ type: "zyrex:off:error" });
    });
  };
  if (audio.readyState >= 1) playIfWanted();
  else audio.addEventListener("loadedmetadata", playIfWanted, { once: true });
}

audio.addEventListener("ended", () => {
  stopTicker();
  post({ type: "zyrex:off:ended" });
});
audio.addEventListener("error", () => {
  stopTicker();
  post({ type: "zyrex:off:error" });
});

function stopAll(notifyPreempted) {
  loadGen++; // invalida qualquer loadedmetadata pendente do load anterior
  wantPlay = false;
  stopTicker();
  try { audio.pause(); } catch (_) {}
  try { audio.removeAttribute("src"); audio.load(); } catch (_) {}
  releaseUrl();
  if (notifyPreempted) post({ type: "zyrex:off:preempted" });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || !msg.type) return;
  if (msg.type === "zyrex:off:load") {
    // loadChunk já derruba a leitura anterior (loadGen++/pause/releaseUrl) —
    // é o único "preempt" que existe: o content.js mantém um shim por
    // controller, então loads seguidos são sempre a mesma sessão avançando
    // de chunk, nunca duas sessões concorrentes disputando o documento.
    loadChunk(msg.audio, msg.rate);
  } else if (msg.type === "zyrex:off:play") {
    wantPlay = true;
    // Sem src ainda (load em voo): playIfWanted() do loadChunk toca assim
    // que o metadata chegar — nada a fazer aqui além de registrar a intenção.
    if (!audio.src) return;
    audio.play().then(startTicker).catch(() => post({ type: "zyrex:off:error" }));
  } else if (msg.type === "zyrex:off:pause") {
    wantPlay = false;
    stopTicker();
    try { audio.pause(); } catch (_) {}
  } else if (msg.type === "zyrex:off:seek") {
    try {
      const d = audio.duration;
      const t = Number.isFinite(msg.t) ? msg.t : 0;
      audio.currentTime = Number.isFinite(d) && d > 0 ? Math.min(t, Math.max(0, d - 0.05)) : t;
    } catch (_) {}
  } else if (msg.type === "zyrex:off:rate") {
    try { audio.playbackRate = msg.rate; } catch (_) {}
  } else if (msg.type === "zyrex:off:stop") {
    stopAll(false);
  }
});
