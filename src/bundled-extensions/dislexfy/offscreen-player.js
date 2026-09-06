// offscreen-player.js — shim de fallback pro <audio> do shadow (item 4.3).
//
// Some sites bloqueiam mídia blob: via CSP media-src (o <audio> do shadow
// dispara 'error' antes de tocar). O offscreen document (extension/offscreen/)
// roda num contexto de extensão, imune à CSP da página, e reproduz o áudio lá.
//
// DESIGN ADITIVO: o controller (createPlaybackController) NÃO muda — ele
// continua fazendo exatamente o que já fazia com o <audio> real: setar
// `.src` com uma blob: URL, ler/escrever currentTime, chamar play()/pause().
// Este arquivo cria um objeto com A MESMA SUPERFÍCIE que o controller usa no
// audioEl (ver zx-player.js): setter de src, currentTime get/set, duration,
// readyState, playbackRate, preservesPitch/webkitPreservesPitch, paused,
// play(), pause(), load(), removeAttribute('src'), addEventListener/
// removeEventListener('ended'|'error'|'loadedmetadata'). O content.js só
// precisa trocar QUAL objeto passa como deps.audioEl ao criar um controller
// novo — nada dentro do módulo do player precisa saber que existe offscreen.
//
// Como o áudio chega ao offscreen document: blob: URLs só são válidas no
// documento que as criou (o content script), então NÃO dá pra mandar a URL
// pro offscreen por mensagem. O setter de `src` deste shim RODA NO CONTENT
// SCRIPT (só o <audio> real mora no offscreen) — por isso ele pode fazer
// fetch(blobUrl) ali mesmo, converter o Blob pra base64, e mandar os bytes
// pro offscreen via chrome.runtime.sendMessage. Esse fetch é local (mesma
// origem/contexto que criou o blob) e não passa pela CSP media-src da
// página — só o <audio> real é sujeito a ela. loadBase64() faz a mesma
// coisa mas pulando o fetch, pra quem já tem o base64 à mão (nenhum
// consumidor atual chama isso diretamente; existe como saída de emergência
// documentada caso um chamador queira evitar o round-trip do fetch).

const TICK_INTERVAL_MS = 250;

export function createOffscreenAudioShim() {
  // ---- estado espelhado localmente (os ticks do offscreen mantêm isso vivo) ----
  let _currentTime = 0;
  let _duration = NaN;
  let _readyState = 0; // HAVE_NOTHING até o primeiro tick/loadedmetadata
  let _playbackRate = 1;
  let _paused = true;
  let _src = "";
  let srcGen = 0; // invalida um fetch(blobUrl) obsoleto se o src mudar de novo antes dele resolver

  // Interpolação entre ticks: o offscreen manda {t, playing} a cada ~250ms;
  // entre dois ticks, o tempo decorrido (em wall-clock) * playbackRate estima
  // o avanço — evita currentTime "parado" pros consumidores que fazem polling
  // (ex. o tick() por rAF do controller, que lê audioEl.currentTime a cada frame).
  let lastTickAt = 0;
  let lastTickTime = 0;
  let tickPlaying = false;

  function estimatedCurrentTime() {
    if (!tickPlaying) return _currentTime;
    const elapsedMs = performance.now() - lastTickAt;
    const est = lastTickTime + (elapsedMs / 1000) * _playbackRate;
    return _duration > 0 ? Math.min(est, _duration) : est;
  }

  // ---- listeners registrados (mesma forma que EventTarget.addEventListener) ----
  const listeners = { ended: new Set(), error: new Set(), loadedmetadata: new Set() };

  function on(type, cb) {
    const set = listeners[type];
    if (set) set.add(cb);
  }
  function off(type, cb) {
    const set = listeners[type];
    if (set) set.delete(cb);
  }
  function emit(type) {
    const set = listeners[type];
    if (!set) return;
    // Cópia: um listener 'once' pode se remover durante a iteração.
    for (const cb of Array.from(set)) {
      try { cb(); } catch (_) {}
    }
  }

  // ---- mensageria com o background (que repassa ao offscreen document) ----
  function send(type, extra) {
    try {
      chrome.runtime.sendMessage(Object.assign({ type }, extra), () => void chrome.runtime.lastError);
    } catch (_) {
      // contexto invalidado (extensão recarregada) — silêncio, como o resto do bgTransport.
    }
  }

  // blob: → base64 sem passar por FileReader (evita depender de onload/onerror
  // aqui); Blob.arrayBuffer() já é suportado onde o resto da extensão roda.
  async function blobUrlToBase64(url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    // Em blocos, pra não estourar o limite de argumentos de String.fromCharCode
    // em áudios grandes (chunks ~2500 chars de texto viram no máximo alguns
    // segundos de MP3 — isso nunca deve rodar milhares de vezes, mas o loop
    // em blocos é barato e evita qualquer risco de RangeError).
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  let msgListener = null; // guardado pra destroy() poder remover

  function onRuntimeMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "zyrex:off:tick") {
      lastTickAt = performance.now();
      lastTickTime = Number.isFinite(msg.t) ? msg.t : lastTickTime;
      tickPlaying = !!msg.playing;
      _currentTime = lastTickTime;
      if (Number.isFinite(msg.duration) && msg.duration > 0) {
        const hadMeta = _duration > 0;
        _duration = msg.duration;
        if (!hadMeta) {
          _readyState = 1; // HAVE_METADATA — libera os `readyState >= 1` do controller
          emit("loadedmetadata");
        }
      }
    } else if (msg.type === "zyrex:off:ended") {
      tickPlaying = false;
      _paused = true;
      emit("ended");
    } else if (msg.type === "zyrex:off:error") {
      tickPlaying = false;
      emit("error");
    } else if (msg.type === "zyrex:off:preempted") {
      // Uma leitura nova derrubou esta no offscreen (single-reader) — o
      // controller que perdeu a corrida trata isso como erro de mídia comum.
      tickPlaying = false;
      emit("error");
    }
  }
  msgListener = (msg) => { onRuntimeMessage(msg); };
  chrome.runtime.onMessage.addListener(msgListener);

  // Manda o base64 pro offscreen document tocar. Compartilhado pelo setter
  // de `src` (via fetch(blobUrl)) e por loadBase64() (bytes já prontos).
  function loadBase64Internal(b64) {
    _currentTime = 0;
    lastTickTime = 0;
    lastTickAt = performance.now();
    _duration = NaN;
    _readyState = 0;
    _paused = true;
    tickPlaying = false;
    send("zyrex:off:load", { audio: b64, rate: _playbackRate });
  }

  return {
    // -------- propriedades lidas/escritas pelo controller --------
    get currentTime() { return estimatedCurrentTime(); },
    set currentTime(t) {
      _currentTime = t;
      lastTickTime = t;
      lastTickAt = performance.now();
      send("zyrex:off:seek", { t });
    },
    get duration() { return _duration; },
    get readyState() { return _readyState; },
    get paused() { return _paused; },
    set playbackRate(r) {
      _playbackRate = r;
      send("zyrex:off:rate", { rate: r });
    },
    get playbackRate() { return _playbackRate; },
    set preservesPitch(_v) { /* offscreen sempre preserva pitch — no-op */ },
    get preservesPitch() { return true; },
    set webkitPreservesPitch(_v) { /* idem */ },
    get webkitPreservesPitch() { return true; },
    // O controller faz `audioEl.src = currentUrl`, exatamente como faria com
    // o <audio> real. currentUrl é sempre blob: (setSrc do zx-player.js) —
    // buscamos o Blob de volta AQUI (mesmo contexto que o criou) e mandamos
    // os bytes pro offscreen document tocar.
    set src(v) {
      _src = v;
      const myGen = ++srcGen;
      _readyState = 0;
      _duration = NaN;
      _paused = true;
      tickPlaying = false;
      if (!v) return; // removeAttribute('src') já tem seu próprio caminho abaixo
      blobUrlToBase64(v)
        .then((b64) => {
          if (myGen !== srcGen) return; // src trocou nesse meio tempo — descarta
          loadBase64Internal(b64);
        })
        .catch(() => {
          if (myGen !== srcGen) return;
          emit("error"); // Blob ilegível — trata como falha de mídia comum
        });
    },
    get src() { return _src; },

    // -------- métodos usados pelo controller --------
    play() {
      _paused = false;
      send("zyrex:off:play");
      return Promise.resolve();
    },
    pause() {
      _paused = true;
      tickPlaying = false;
      send("zyrex:off:pause");
    },
    load() {
      // O <audio> real "recarrega" a src no stop(); no shim isso só zera o
      // relógio local — o stop() de verdade (derrubar o áudio no offscreen)
      // acontece via removeAttribute('src')/loadBase64, não aqui.
      _currentTime = 0;
      lastTickTime = 0;
      _readyState = 0;
    },
    removeAttribute(name) {
      if (name !== "src") return;
      srcGen++; // invalida um blobUrlToBase64 em voo pro src anterior
      _src = "";
      _duration = NaN;
      _readyState = 0;
      _paused = true;
      tickPlaying = false;
      send("zyrex:off:stop");
    },
    addEventListener(type, cb) { on(type, cb); },
    removeEventListener(type, cb) { off(type, cb); },

    // -------- API extra, fora da superfície do <audio> --------
    // Carrega um chunk a partir do base64 já decodificado, pulando o
    // fetch(blobUrl) que o setter de `src` faz — saída de emergência
    // documentada pra quem já tiver o base64 à mão; nenhum caminho atual do
    // content.js precisa chamar isso (o setter de src já resolve sozinho).
    loadBase64(b64, rate) {
      srcGen++; // este load não veio de um src novo — invalida qualquer um em voo
      if (Number.isFinite(rate) && rate > 0) _playbackRate = rate;
      loadBase64Internal(b64);
    },

    // Não faz parte da superfície do <audio> — chamado pelo content.js quando
    // este shim para de ser usado (volta pro <audio> real, ou o widget
    // fecha), pra não deixar o listener de chrome.runtime.onMessage vivo
    // indefinidamente a cada troca pro fallback.
    destroy() {
      if (msgListener) {
        try { chrome.runtime.onMessage.removeListener(msgListener); } catch (_) {}
        msgListener = null;
      }
    },
  };
}
