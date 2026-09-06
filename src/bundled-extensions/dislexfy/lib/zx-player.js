// zx-player.js — núcleo compartilhado do pipeline de áudio do Dislexfy.
// Módulo ES importado pelo content.js (via chrome.runtime.getURL) e pelo
// demo index.html (via <script type="module">). Nada aqui toca o DOM da
// página: a porta de player (PlayerPort) e os callbacks de UI chegam por
// injeção de dependências.

// ---------------------------------------------------------------------------
// chunkText — corta o texto em chunks por fronteira de sentença.
// ---------------------------------------------------------------------------

// Alvo ~2500 chars por chunk; nenhum chunk passa de 3000 (o limite de 4900
// do servidor fica inalcançável). Sentença única maior que o cap é quebrada
// na última vírgula/espaço antes do cap.
const CHUNK_SOFT = 2500;
const CHUNK_HARD = 3000;

// O PRIMEIRO chunk da sessão é deliberadamente curto (~600 chars, ~40s de
// áudio). Quem espera pela síntese é sempre ele: com 2500 chars o usuário
// olhava pra tela por segundos até a voz começar. Cortando o primeiro em ~1/4,
// o "tempo até a primeira palavra" cai na mesma proporção — e o prefetch já
// buscou o chunk 2 muito antes de o 1 acabar, então nada gagueja depois.
export const FIRST_CHUNK_SOFT = 600;

// Fronteiras de sentença contíguas cobrindo o texto inteiro: [{start, end}].
function sentenceRanges(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    try {
      const seg = new Intl.Segmenter("pt", { granularity: "sentence" });
      const out = [];
      for (const s of seg.segment(text)) {
        out.push({ start: s.index, end: s.index + s.segment.length });
      }
      if (out.length) return out;
    } catch (_) {
      // Segmenter indisponível/quebrado — cai no fallback por regex.
    }
  }
  // Fallback: corta depois de pontuação final seguida de espaço/quebra.
  const out = [];
  const re = /[.!?…]+[\s\n]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index + m[0].length;
    out.push({ start: last, end });
    last = end;
  }
  if (last < text.length) out.push({ start: last, end: text.length });
  if (!out.length) out.push({ start: 0, end: text.length });
  return out;
}

// Última vírgula/espaço antes do cap — corta logo depois dela, pra nunca
// partir palavra no meio. Sem nenhuma, corte seco no cap (caso patológico).
function findBreak(text, from, capEnd) {
  for (let i = capEnd - 1; i > from; i--) {
    const ch = text[i];
    if (ch === "," || /\s/.test(ch)) return i + 1;
  }
  return capEnd;
}

// Retorna [{text, charStart, charEnd}] com ranges relativos ao texto original;
// a concatenação dos pedaços reconstrói exatamente o texto de entrada.
//
// opts.firstSoft: cap (mais baixo) só pro PRIMEIRO chunk gerado nesta chamada
// — é o truque de latência descrito em FIRST_CHUNK_SOFT. Omitido, todos os
// chunks usam CHUNK_SOFT (comportamento antigo, usado pelos blocos 2..N).
export function chunkText(text, opts) {
  if (!text) return [];
  const firstSoft = opts && Number.isFinite(opts.firstSoft) && opts.firstSoft > 0 ? opts.firstSoft : CHUNK_SOFT;
  const chunks = [];
  let cur = null; // range {start, end} do chunk em montagem
  const flush = () => {
    if (cur && cur.end > cur.start) {
      chunks.push({ text: text.slice(cur.start, cur.end), charStart: cur.start, charEnd: cur.end });
    }
    cur = null;
  };

  for (const r of sentenceRanges(text)) {
    let s = r.start;
    const e = r.end;
    // Sentença maior que o hard cap: vira chunks próprios, quebrados em vírgula/espaço.
    while (e - s > CHUNK_HARD) {
      flush();
      const cut = findBreak(text, s, s + CHUNK_HARD);
      chunks.push({ text: text.slice(s, cut), charStart: s, charEnd: cut });
      s = cut;
    }
    // Só o primeiro chunk emitido usa o cap reduzido.
    const soft = chunks.length === 0 ? firstSoft : CHUNK_SOFT;
    if (!cur) {
      cur = { start: s, end: e };
    } else if (cur.end - cur.start + (e - s) > soft) {
      flush();
      cur = { start: s, end: e };
    } else {
      cur.end = e;
    }
  }
  flush();
  return chunks;
}

// ---------------------------------------------------------------------------
// AudioCache — LRU em memória por bytes, com dedup de requisições in-flight.
// ---------------------------------------------------------------------------

// Separador que nunca aparece em nome de voz nem em texto de página.
const KEY_SEP = "\u0000";

export class AudioCache {
  constructor(maxBytes = 25 * 1024 * 1024) {
    this.maxBytes = maxBytes;
    this.bytes = 0;
    // Map itera em ordem de inserção → LRU de graça (delete+set renova no hit).
    this.map = new Map(); // key → {blob, subtitle, duration, bytes}
    this.inflight = new Map(); // key → Promise (dedup de buscas simultâneas)
  }

  // Velocidade fica FORA da chave: o áudio é sempre 1.0x (playbackRate no cliente).
  static key(voice, chunkText) {
    return voice + KEY_SEP + chunkText;
  }

  get(key) {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // Renova a posição de inserção pra manter a semântica LRU.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    const bytes = value.bytes != null ? value.bytes : (value.blob ? value.blob.size : 0);
    if (this.map.has(key)) {
      this.bytes -= this.map.get(key).bytes;
      this.map.delete(key);
    }
    const entry = { blob: value.blob, subtitle: value.subtitle, duration: value.duration, bytes };
    this.map.set(key, entry);
    this.bytes += bytes;
    this.evict();
    return entry;
  }

  // Evict do mais antigo até caber no orçamento. Nunca remove o último item:
  // uma entrada sozinha maior que o orçamento é melhor que thrash infinito.
  evict() {
    while (this.bytes > this.maxBytes && this.map.size > 1) {
      const oldest = this.map.keys().next().value;
      this.bytes -= this.map.get(oldest).bytes;
      this.map.delete(oldest);
    }
  }

  // Retorna do cache, ou da busca já em voo pra mesma chave, ou dispara fn().
  // O resultado vai pro cache principal e o Map de in-flight é limpo no settle.
  getOrFetch(key, fn) {
    const hit = this.get(key);
    if (hit !== undefined) return Promise.resolve(hit);
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const p = Promise.resolve()
      .then(fn)
      .then(
        (value) => {
          this.inflight.delete(key);
          return this.set(key, value);
        },
        (err) => {
          this.inflight.delete(key);
          throw err;
        }
      );
    this.inflight.set(key, p);
    return p;
  }

  clear() {
    this.map.clear();
    this.inflight.clear();
    this.bytes = 0;
  }
}

// ---------------------------------------------------------------------------
// synthesize — camada de rede: transport + timeout + retry + base64→Blob.
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 30000;
// Backoff das tentativas extras (só rede/429/5xx); jitter somado na hora.
// Quatro tentativas no total: a maior parte das falhas de "não consegui
// conectar" que o usuário via era o service worker dormindo ou uma queda
// momentânea da lambda — casos que a PRIMEIRA re-tentativa já resolve. Por
// isso o primeiro backoff caiu de 600ms pra 350ms (o usuário nem percebe) e
// entrou uma terceira tentativa pro caso de a lambda estar subindo do zero.
const RETRY_DELAYS = [350, 1200, 2800];

// Mensagens amigáveis por status HTTP (usadas pela leitura e pela prévia de voz).
export function httpErrorMessage(status) {
  return status === 400
    ? "Não consegui ler esse texto."
    : status === 413
      ? "Trecho muito longo para uma requisição."
      : status === 429
        ? "Muitas leituras seguidas — aguarde alguns segundos."
        : "O serviço de voz está indisponível. Tente de novo em instantes.";
}

function friendlyError(message, retryable) {
  const e = new Error(message);
  e.retryable = !!retryable;
  return e;
}

function makeAbortError() {
  return typeof DOMException === "function"
    ? new DOMException("Aborted", "AbortError")
    : Object.assign(new Error("Aborted"), { name: "AbortError" });
}

// Espera que respeita o abort da sessão (cancela o backoff do retry).
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) { reject(makeAbortError()); return; }
    const t = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(makeAbortError());
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}

// Compõe o signal da sessão com timeout de 30s. AbortSignal.timeout/any pedem
// Chrome ≥116 — sem eles, segue só com o signal puro (sem timeout).
function composeSignal(signal) {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function" &&
    typeof AbortSignal.any === "function"
  ) {
    const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
  }
  return signal;
}

// Transport default: fetch direto do contexto que importou o módulo (demo,
// reader). A extensão injeta um transport próprio que fala com o service
// worker (imune à CSP connect-src da página — item 4.2). Contrato: recebe
// {text, voice, apiUrl, signal} e resolve {status, contentType, body} — body
// já parseado quando a resposta é JSON, senão o texto cru. O transport NÃO
// re-tenta nem mapeia mensagens: retry/backoff/timeout/mensagens amigáveis
// moram no synthesize, EM VOLTA do transport.
export async function httpTransport({ text, voice, apiUrl, signal }) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // speed fica fora do body: velocidade agora é playbackRate no cliente.
    body: JSON.stringify({ text, voice }),
    signal,
  });
  const contentType = res.headers.get("content-type") || "";
  let body = await res.text();
  if (contentType.includes("json")) {
    // Content-type mentiroso (JSON que não parseia) segue como texto cru;
    // o synthesize trata como resposta inesperada.
    try { body = JSON.parse(body); } catch (_) {}
  }
  return { status: res.status, contentType, body };
}

// Uma tentativa: erros saem com .retryable marcando se valem nova tentativa.
async function requestOnce({ text, voice, signal, apiUrl, transport }) {
  let res;
  try {
    // O timeout continua composto AQUI: o transport recebe o signal já
    // combinado (sessão + 30s) e só precisa repassá-lo/observá-lo.
    res = await transport({ text, voice, apiUrl, signal: composeSignal(signal) });
  } catch (err) {
    if (err && err.name === "AbortError") throw err; // cancelamento nunca re-tenta
    if (err && err.name === "TimeoutError") {
      throw friendlyError("O serviço de voz demorou para responder. Tente de novo.", false);
    }
    if (err && err.fatal) {
      // O transport já sabe que re-tentar não adianta (ex.: a extensão foi
      // recarregada e este content script ficou órfão). Passa direto.
      throw friendlyError(err.message, false);
    }
    if (err instanceof TypeError) {
      // Falha de rede — vale re-tentar.
      throw friendlyError("Sem conexão com o serviço de voz. Verifique sua internet.", true);
    }
    throw err;
  }
  if (!res || !Number.isFinite(res.status)) {
    throw friendlyError("Resposta inesperada do servidor de voz.", false);
  }
  if (res.status < 200 || res.status >= 300) {
    // Corpo com .error (tipicamente 400: "Voz inválida", "Texto vazio") é
    // mais específico que a mensagem genérica por status — usa quando
    // presente; senão cai no fallback de httpErrorMessage. O mapeamento de
    // retryable (429/5xx) continua só pelo status, nunca pelo corpo.
    const apiError = res.body && typeof res.body === "object" && res.body.error;
    const e = friendlyError(apiError || httpErrorMessage(res.status), res.status === 429 || res.status >= 500);
    e.status = res.status;
    throw e;
  }
  const data = res.body;
  if (!data || typeof data !== "object" || !data.audio) {
    const apiError = data && typeof data === "object" && data.error;
    throw friendlyError(apiError ? "Erro: " + apiError : "Resposta inesperada do servidor de voz.", false);
  }
  // Decodifica o base64 UMA vez; o player usa URL.createObjectURL(blob).
  const bin = atob(data.audio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "audio/mpeg" });
  const subtitle = Array.isArray(data.subtitle) ? data.subtitle : [];
  const lastWord = subtitle[subtitle.length - 1];
  const duration = lastWord ? lastWord.offset + lastWord.duration : 0;
  return { blob, subtitle, duration };
}

// Sintetiza um chunk. Retry com backoff 600ms/1800ms+jitter SÓ pra erro de
// rede/429/5xx — nunca AbortError nem 4xx (erro do cliente não muda sozinho).
// transport é injetável (default: httpTransport, fetch direto); a extensão
// passa o transport do service worker.
export async function synthesize({ text, voice, signal, apiUrl, transport }) {
  const send = transport || httpTransport;
  let lastErr = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS[attempt - 1] + Math.random() * 300, signal);
    }
    try {
      return await requestOnce({ text, voice, signal, apiUrl, transport: send });
    } catch (err) {
      if (!err || !err.retryable) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// warmUp — acorda a lambda antes do primeiro play (fire-and-forget).
// ---------------------------------------------------------------------------

let lastWarmUpAt = 0;

export function warmUp(apiUrl) {
  const now = Date.now();
  if (now - lastWarmUpAt < 60000) return; // throttle: no máximo 1 por minuto
  lastWarmUpAt = now;
  try {
    fetch(apiUrl, { method: "OPTIONS" }).catch(() => {});
  } catch (_) {
    // fire-and-forget: warm-up nunca pode derrubar quem chamou
  }
}

// ---------------------------------------------------------------------------
// createPlaybackController — state machine da sessão de reprodução.
// ---------------------------------------------------------------------------
//
// Sessão = fila de chunks construída de blocos {text, container?}:
// "Ouvir seleção" = 1 bloco; parágrafo = 1 bloco; "Ler tudo" = M blocos.
// As corridas morrem por construção: cada start() incrementa a geração e cria
// um AbortController próprio; após TODO await, `if (myGen !== gen) return`
// descarta resultados obsoletos. A intenção do usuário (wantPlaying) vive
// separada do estado — o botão só alterna a intenção e reconcile() decide se
// o <audio> toca ou pausa (pausar durante a geração nunca dispara áudio depois).
//
// deps: {audioEl, apiUrl?, transport?, getVoice, getSpeed, onState, onStatus,
//        onChunkChange, onWordTick, onSessionEnd, cache?}
// transport é repassado ao synthesize (default httpTransport); a extensão
// injeta o transport do service worker e nem precisa de apiUrl (o SW é o
// dono da URL). Nada de DOM aqui além do <audio> injetado — destaque, ícones
// e timer ficam do lado de fora, alimentados pelos callbacks.
export function createPlaybackController(deps) {
  const {
    audioEl,
    apiUrl,
    transport,
    getVoice,
    getSpeed,
    onState,
    onStatus,
    onChunkChange,
    onWordTick,
    onSessionEnd,
  } = deps;
  const cache = deps.cache || new AudioCache();

  // Pitch preservado uma vez só — velocidade é playbackRate, não re-síntese.
  try {
    audioEl.preservesPitch = true;
    audioEl.webkitPreservesPitch = true;
  } catch (_) {}

  let gen = 0;             // geração da sessão: invalida awaits pendentes
  let abort = null;        // AbortController da sessão vigente
  let state = "idle";      // idle | loading | ready | playing | paused | ended
  let wantPlaying = false; // intenção do usuário, separada do estado
  let queue = [];          // [{text, charStart, charEnd, blockIdx, container, subtitle?}]
  let voice = "";          // voz capturada no start — vale pra sessão inteira
  let idx = -1;            // índice do chunk atual na fila
  let elapsedBefore = 0;   // Σ durações dos chunks já tocados (media time)
  let durations = [];      // duração conhecida por chunk (pro seek global)
  let pendingSeek = null;  // offset local a aplicar quando o chunk carregar
  let rate = 1;            // playbackRate — reaplicado a cada troca de src
  let currentUrl = null;   // blob: URL corrente (revogada na troca/stop)
  let srcGen = -1;         // geração dona do src atual (valida ended/error)
  let rafId = null;

  // Ticker de UI: enquanto toca, entrega (chunk, mediaTime) a cada frame —
  // timer e destaque são responsabilidade de quem ouve o callback.
  function tick() {
    if (state === "playing" && idx >= 0 && queue[idx]) {
      onWordTick(queue[idx], audioEl.currentTime);
    }
    rafId = requestAnimationFrame(tick);
  }
  function startTicker() {
    if (rafId == null) rafId = requestAnimationFrame(tick);
  }
  function stopTicker() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setState(next) {
    state = next;
    if (next === "playing") startTicker();
    else stopTicker();
    onState(next);
  }

  function keyFor(i) {
    return AudioCache.key(voice, queue[i].text);
  }

  // Duração conhecida do chunk i: a medida no elemento (chunks já tocados)
  // ou a estimada pelo subtitle (chunks já sintetizados). null = desconhecida.
  function durationOf(i) {
    if (Number.isFinite(durations[i]) && durations[i] > 0) return durations[i];
    const hit = cache.get(keyFor(i));
    if (hit && Number.isFinite(hit.duration) && hit.duration > 0) return hit.duration;
    return null;
  }

  function fetchChunk(i) {
    const chunk = queue[i];
    return cache.getOrFetch(keyFor(i), () =>
      synthesize({ text: chunk.text, voice, signal: abort ? abort.signal : undefined, apiUrl, transport })
    );
  }

  // Profundidade 2: os DOIS próximos chunks. Com o primeiro chunk agora curto
  // (~40s de áudio), buscar só um adiante deixava a fila apertada em conexões
  // ruins — o chunk 2 chegava em cima da hora e a leitura engasgava na virada.
  // Erro aqui é silencioso: quando a vez do chunk chegar, o playChunk re-tenta
  // (o reject já limpou o in-flight do cache).
  const PREFETCH_DEPTH = 2;
  function prefetch(i) {
    for (let k = 0; k < PREFETCH_DEPTH; k++) {
      const j = i + k;
      if (j < 0 || j >= queue.length) return;
      fetchChunk(j).catch(() => {});
    }
  }

  function setSrc(entry) {
    if (currentUrl) {
      try { URL.revokeObjectURL(currentUrl); } catch (_) {}
    }
    currentUrl = URL.createObjectURL(entry.blob);
    srcGen = gen;
    audioEl.src = currentUrl;
    // Reaplica a velocidade após cada troca de src (o load pode resetá-la).
    try { audioEl.playbackRate = rate; } catch (_) {}
  }

  // Posiciona o áudio em t (media time local do chunk), esperando o metadata
  // quando preciso; clampa pra não cair depois do fim do chunk.
  function applySeek(t, myGen) {
    const seek = () => {
      if (myGen !== gen) return;
      const d = audioEl.duration;
      const clamped = Number.isFinite(d) && d > 0 ? Math.min(t, Math.max(0, d - 0.05)) : t;
      try { audioEl.currentTime = clamped; } catch (_) {}
    };
    if (audioEl.readyState >= 1 /* HAVE_METADATA */) seek();
    else audioEl.addEventListener("loadedmetadata", seek, { once: true });
  }

  // A intenção encontra o estado: play só acontece com estado pronto E
  // intenção vigente E geração atual — não existe caminho que toque sem querer.
  function reconcile() {
    if (wantPlaying) {
      if (state === "ready" || state === "paused") {
        const myGen = gen;
        setState("playing");
        const p = audioEl.play();
        if (p && typeof p.catch === "function") {
          p.catch((err) => {
            if (myGen !== gen) return;
            if (err && err.name === "AbortError") return; // pause()/troca de src atropelou o play()
            if (state !== "playing") return;
            onStatus("Não foi possível reproduzir o áudio.");
            stop();
          });
        }
      }
    } else {
      if (state === "playing") {
        audioEl.pause();
        setState("paused");
      } else if (state === "ready") {
        setState("paused");
      }
    }
  }

  // Resolve (cache → rede) e apresenta o chunk i; depois reconcilia e
  // pré-busca o i+1. Todo retorno de await revalida a geração.
  async function playChunk(i) {
    const myGen = gen;
    const chunk = queue[i];
    let entry = cache.get(keyFor(i));
    if (!entry) {
      setState("loading");
      onStatus("Gerando áudio...");
      // Sessões consecutivas com o MESMO texto dividem a promise in-flight do
      // cache: o abort da sessão antiga rejeita a promise herdada. Se a NOSSA
      // sessão segue viva, repete uma vez (o reject já limpou o in-flight, a
      // nova busca sai com o signal desta sessão).
      let inheritedRetry = true;
      while (entry === undefined) {
        try {
          entry = await fetchChunk(i);
        } catch (err) {
          if (myGen !== gen) return;
          if (err && err.name === "AbortError") {
            if (abort && !abort.signal.aborted && inheritedRetry) {
              inheritedRetry = false;
              continue;
            }
            return;
          }
          onStatus(err && err.message ? err.message : "Falha ao gerar o áudio.");
          stop();
          return;
        }
      }
      if (myGen !== gen) return;
      onStatus("");
    }
    idx = i;
    // O subtitle viaja no chunk: onChunkChange/onWordTick recebem tudo junto.
    chunk.subtitle = entry.subtitle;
    if (durations[i] == null && Number.isFinite(entry.duration) && entry.duration > 0) {
      durations[i] = entry.duration;
    }
    setSrc(entry);
    onChunkChange(chunk);
    if (pendingSeek != null) {
      const seekTo = pendingSeek;
      pendingSeek = null;
      applySeek(seekTo, myGen);
    }
    setState("ready");
    reconcile();
    prefetch(i + 1);
  }

  // Inicia uma sessão nova a partir de blocos {text, container?}. A fila de
  // chunks nasce aqui; blockIdx e container viajam em cada chunk pro destaque.
  function start(blocks) {
    gen++;
    if (abort) abort.abort();
    abort = new AbortController();
    try { audioEl.pause(); } catch (_) {}
    // Zera o relógio da sessão anterior — o timer não pode mostrar tempo velho
    // enquanto o primeiro chunk da sessão nova ainda gera.
    try { audioEl.currentTime = 0; } catch (_) {}
    voice = getVoice();
    rate = getSpeed();
    queue = [];
    (blocks || []).forEach((block, blockIdx) => {
      // Só o bloco 0 pede o primeiro-chunk-curto: é o único cuja síntese o
      // usuário espera olhando pra tela. Os demais já são pré-buscados durante
      // a reprodução, então mantêm o tamanho cheio (menos requisições).
      const opts = blockIdx === 0 ? { firstSoft: FIRST_CHUNK_SOFT } : undefined;
      for (const piece of chunkText(block && block.text ? block.text : "", opts)) {
        queue.push({
          text: piece.text,
          charStart: piece.charStart,
          charEnd: piece.charEnd,
          blockIdx,
          // Posição do chunk na fila: o hitTest do highlight-engine devolve
          // esse índice pro clique-na-palavra chamar seekTo(chunkIdx, t).
          queueIdx: queue.length,
          container: (block && block.container) || null,
        });
      }
    });
    idx = -1;
    elapsedBefore = 0;
    durations = [];
    pendingSeek = null;
    if (!queue.length) {
      wantPlaying = false;
      setState("idle");
      return;
    }
    wantPlaying = true;
    setState("loading");
    playChunk(0);
  }

  // Desfaz a sessão inteira: aborta fetches, solta o src e volta pro repouso.
  // Incrementar a geração invalida qualquer await ainda pendente.
  function stop() {
    gen++;
    if (abort) {
      abort.abort();
      abort = null;
    }
    try { audioEl.pause(); } catch (_) {}
    srcGen = -1;
    audioEl.removeAttribute("src");
    try { audioEl.load(); } catch (_) {}
    if (currentUrl) {
      try { URL.revokeObjectURL(currentUrl); } catch (_) {}
      currentUrl = null;
    }
    queue = [];
    idx = -1;
    elapsedBefore = 0;
    durations = [];
    pendingSeek = null;
    wantPlaying = false;
    setState("idle");
  }

  // O botão só mexe na intenção; reconcile() aplica. Exceção: pausar durante
  // a geração cancela a sessão (garantia da Etapa 1 — nada toca depois).
  function togglePlayPause() {
    if (state === "idle" || state === "ended") return;
    if (state === "loading") {
      if (wantPlaying) {
        stop();
        return;
      }
      // Estava pausado e o chunk do seek ainda carrega: só retoma a intenção
      // (o reconcile roda quando o chunk ficar pronto).
      wantPlaying = true;
      return;
    }
    wantPlaying = !wantPlaying;
    reconcile();
  }

  // ±10s global: converte pra posição na sessão inteira e localiza o chunk
  // alvo pelo acumulado de durações; chunk fora do cache vira loading com
  // seek pendente (aplicado no loadedmetadata).
  function seekRelative(dt) {
    if (!queue.length) return;
    if (state === "loading" || state === "ended" || state === "idle") return;
    let target = elapsedBefore + (audioEl.currentTime || 0) + dt;
    if (!Number.isFinite(target)) return;
    if (target < 0) target = 0;
    let i = 0;
    let acc = 0;
    while (i < queue.length - 1) {
      const d = durationOf(i);
      if (d == null) break; // não dá pra saltar além do que já se conhece
      if (target < acc + d) break;
      acc += d;
      i++;
    }
    const local = Math.max(0, target - acc);
    if (i === idx && audioEl.readyState >= 1) {
      const d = audioEl.duration;
      const clamped = Number.isFinite(d) && d > 0 ? Math.min(local, Math.max(0, d - 0.05)) : local;
      try { audioEl.currentTime = clamped; } catch (_) {}
      return;
    }
    // Chunk diferente: reancora o acumulado e (re)carrega o alvo.
    elapsedBefore = acc;
    pendingSeek = local;
    playChunk(i);
  }

  // Seek absoluto pra (chunk, tempo local) — item 3.6, clique-na-palavra: o
  // hitTest do destaque devolve {chunkIdx, tStart} e este método pula pra lá.
  // Mesma mecânica do seekRelative: chunk atual seek-a direto no elemento;
  // chunk diferente reancora o relógio acumulado e (re)carrega via playChunk
  // (gerações e cache valem como sempre — pausado continua pausado).
  function seekTo(chunkIdx, mediaTime) {
    if (!queue.length) return;
    if (state === "loading" || state === "ended" || state === "idle") return;
    if (!Number.isInteger(chunkIdx) || chunkIdx < 0 || chunkIdx >= queue.length) return;
    const t = Number.isFinite(mediaTime) && mediaTime > 0 ? mediaTime : 0;
    if (chunkIdx === idx && audioEl.readyState >= 1) {
      const d = audioEl.duration;
      const clamped = Number.isFinite(d) && d > 0 ? Math.min(t, Math.max(0, d - 0.05)) : t;
      try { audioEl.currentTime = clamped; } catch (_) {}
      return;
    }
    // Reancora o acumulado com as durações conhecidas. O clique-na-palavra só
    // alcança chunks já tocados nesta sessão (a timeline nasce no play deles),
    // então elas existem; o 0 é só cinto de segurança.
    let acc = 0;
    for (let i = 0; i < chunkIdx; i++) acc += durationOf(i) || 0;
    elapsedBefore = acc;
    pendingSeek = t;
    playChunk(chunkIdx);
  }

  // Timer = tempo de mídia acumulado (como YouTube — não muda com a velocidade).
  function getTime() {
    return elapsedBefore + (audioEl.currentTime || 0);
  }

  function setRate(r) {
    if (!Number.isFinite(r) || r <= 0) return;
    rate = r;
    try { audioEl.playbackRate = r; } catch (_) {}
  }

  // Concatena os MP3 dos chunks da sessão na ordem (frames MP3 emendados
  // tocam normalmente) — sintetizando antes o que ainda falta. Retorna null
  // sem sessão (ou se ela trocar no meio); erro de rede sobe pro chamador.
  async function downloadBlob() {
    if (!queue.length) return null;
    const myGen = gen;
    const sessionVoice = voice;
    const sessionAbort = abort;
    const missing = queue.some((c) => cache.get(AudioCache.key(sessionVoice, c.text)) === undefined);
    if (missing) onStatus("Preparando download...", 60000);
    const parts = [];
    for (const chunk of queue) {
      const entry = await cache.getOrFetch(AudioCache.key(sessionVoice, chunk.text), () =>
        synthesize({
          text: chunk.text,
          voice: sessionVoice,
          signal: sessionAbort ? sessionAbort.signal : undefined,
          apiUrl,
          transport,
        })
      );
      if (myGen !== gen) return null;
      parts.push(entry.blob);
    }
    if (missing) onStatus("");
    return new Blob(parts, { type: "audio/mpeg" });
  }

  // Fim do chunk: acumula a duração real e avança a fila (ou encerra a sessão).
  function onEnded() {
    if (srcGen !== gen) return; // áudio órfão de sessão antiga
    // 'ended' duplicado do mesmo src (ex. seek pro fim depois do fim natural)
    // não pode somar duração nem reemitir onSessionEnd.
    if (state === "ended") return;
    if (idx < 0 || idx >= queue.length) return;
    const d = Number.isFinite(audioEl.duration) && audioEl.duration > 0
      ? audioEl.duration
      : durations[idx] || 0;
    durations[idx] = d;
    elapsedBefore += d;
    if (idx + 1 < queue.length) {
      playChunk(idx + 1);
    } else {
      wantPlaying = false;
      setState("ended");
      onSessionEnd();
    }
  }
  audioEl.addEventListener("ended", onEnded);

  // Erro de mídia do src vigente (CSP, blob corrompido…): encerra com aviso.
  // Eventos de src antigo/limpo são ignorados pela geração.
  function onError() {
    if (srcGen !== gen) return;
    if (state === "idle" || state === "ended") return;
    onStatus("Não foi possível reproduzir o áudio.");
    stop();
  }
  audioEl.addEventListener("error", onError);

  // Solta os listeners do <audio>: chamado quando o controller é descartado
  // (ex. troca in-page <-> offscreen), pra não acumular closures no elemento.
  function dispose() {
    stop();
    audioEl.removeEventListener("ended", onEnded);
    audioEl.removeEventListener("error", onError);
  }

  return {
    start,
    togglePlayPause,
    stop,
    seekRelative,
    seekTo,
    getTime,
    setRate,
    downloadBlob,
    dispose,
    getState: () => state,
    cache, // exposto pra inspeção e pra compartilhar a instância se preciso
  };
}
