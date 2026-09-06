// highlight-engine.js — motor de destaque v2 do Dislexfy (Etapa 3).
// CSS Custom Highlight API + Ranges sobre os text nodes originais — zero
// mutação de DOM. Substitui por completo o destaque com spans da Etapa 2
// (wrapWordsInContainer/alignChunkWords).
//
// Camadas (ver PLANO.md, Etapa 3):
//   1. TEXT MAP      — buildTextMap(target): flatten dos text nodes visíveis
//                      com mapa flat↔DOM (aceita Element OU Range).
//   2. TOKENIZAÇÃO   — tokenize(flatText): Intl.Segmenter word+sentence.
//      ALINHAMENTO   — alignBoundaries(tokens, subtitle, charBase, charEnd):
//                      matcher de dois ponteiros boundaries↔tokens → timeline.
//   3. RENDERIZAÇÃO  — Highlights 'zx-word' (priority 2) e 'zx-sentence' (1).
//   4. PLAYBACK      — tick(mediaTime) com ponteiro monotônico (item 3.5) +
//                      hitTest(x, y) do clique-na-palavra (item 3.6).
//   5. ROBUSTEZ SPA  — MutationObserver debounced + re-map (item 3.8).
//
// Este módulo NÃO toca em rede nem em <audio>: ele consome os callbacks do
// PlaybackController (onChunkChange → setChunkSubtitle, onWordTick → tick).
// Funções núcleo exportadas individualmente pra teste em node (tests/).
//
// Dados reais que guiaram o matcher (tests/fixtures/*.json): o Edge TTS em
// pt-BR AGRUPA expansões num boundary só, mantendo o texto original —
// "Dr. Silva", "R$ 1.500,00", "Em 2024", "1.234 alunos" chegam como UM
// boundary cada. Ou seja, o caso dominante é split (1 boundary ↔ k tokens);
// merge e a janela de ressincronização ficam como rede de segurança.

// ---------------------------------------------------------------------------
// Camada 1 — TEXT MAP
// ---------------------------------------------------------------------------

// Elementos cujo texto nunca é lido nem destacado.
const SKIP_SELECTOR = "script, style, noscript";
// O widget do próprio Zyrex (pill, botão de parágrafo) fica fora do mapa.
// Também é o default de opts.ignoreSelector do engine; na extensão o widget
// mora num shadow root fechado (host <zyrex-tts>) — o TreeWalker da página
// nunca o alcança, então buildTextMap pode manter este seletor fixo.
const WIDGET_SELECTOR = "#zx-root, #zx-para-play";

// nodeType numérico pra não depender do global Node (facilita teste em node).
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const DOCUMENT_NODE = 9;

/**
 * Achata o texto visível de um alvo (Element OU Range) preservando o mapa
 * de ida e volta entre offsets do texto plano e posições (node, offset) no DOM.
 *
 * O `flatText` é EXATAMENTE a string que deve ir pra /api/tts — mesma fonte
 * pro áudio e pro destaque, sem re-normalização divergente.
 *
 * @param {Element|Range} target parágrafo/bloco OU Range clonado da seleção
 * @returns {{
 *   flatText: string,
 *   segments: Array<{node: Text, nodeStart: number, flatStart: number, flatEnd: number}>,
 *   flatToDOM: (off: number) => ({node: Text, offset: number} | null),
 *   rangeFromFlat: (a: number, b: number) => (Range | null),
 *   domToFlat: (node: Node, offset: number) => number  // -1 se fora do mapa
 * }}
 */
export function buildTextMap(target) {
  const isRange = typeof Range !== "undefined" && target instanceof Range;
  const range = isRange ? target : null;

  // Raiz da varredura: o próprio Element, ou o ancestral comum do Range
  // (se o ancestral for um text node, sobe pro pai — TreeWalker pede nó raiz).
  let root = isRange ? range.commonAncestorContainer : target;
  if (root && root.nodeType === TEXT_NODE) root = root.parentNode;
  const doc = (root && root.ownerDocument) || document;

  const segments = [];
  let flatText = "";

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Seleção: só text nodes que o Range realmente toca.
      if (range && !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      // Nunca ler/destacar o texto do próprio widget.
      if (parent.closest(WIDGET_SELECTOR)) return NodeFilter.FILTER_REJECT;
      // display:none / visibility:hidden / content-visibility (Chrome 105+);
      // guard pra ambientes sem checkVisibility (jsdom, browsers antigos).
      if (typeof parent.checkVisibility === "function" && !parent.checkVisibility()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const data = node.data;
    // Recorte do primeiro/último node quando a seleção começa/termina no meio.
    let a = 0;
    let b = data.length;
    if (range) {
      if (node === range.startContainer) a = range.startOffset;
      if (node === range.endContainer) b = Math.min(b, range.endOffset);
    }
    if (b <= a) continue;
    segments.push({
      node,
      nodeStart: a, // offset dentro do node onde o trecho mapeado começa
      flatStart: flatText.length,
      flatEnd: flatText.length + (b - a),
    });
    flatText += data.slice(a, b);
  }

  // Mapa reverso node→segment (cada text node aparece no máximo uma vez).
  const byNode = new Map();
  for (const seg of segments) byNode.set(seg.node, seg);

  // Busca binária: último segmento com flatStart <= off.
  function segIndexFor(off) {
    let lo = 0;
    let hi = segments.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (segments[mid].flatStart <= off) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  /** Offset plano → posição DOM (pra início de Range / comparações). */
  function flatToDOM(off) {
    if (!segments.length) return null;
    if (off <= 0) {
      const s = segments[0];
      return { node: s.node, offset: s.nodeStart };
    }
    const s = segments[segIndexFor(off)];
    const local = Math.min(off, s.flatEnd) - s.flatStart;
    return { node: s.node, offset: s.nodeStart + local };
  }

  // Variante pra FIM de Range: offset que coincide com fronteira de segmento
  // fecha no node anterior (evita Range terminando no início do node seguinte).
  function flatToDOMEnd(off) {
    if (!segments.length) return null;
    let i = segIndexFor(off);
    while (i > 0 && segments[i].flatStart >= off) i--;
    const s = segments[i];
    const local = Math.max(0, Math.min(off, s.flatEnd) - s.flatStart);
    return { node: s.node, offset: s.nodeStart + local };
  }

  /** Cria um Range DOM cobrindo [a, b) do texto plano. */
  function rangeFromFlat(a, b) {
    const start = flatToDOM(a);
    const end = flatToDOMEnd(b);
    if (!start || !end) return null;
    const r = doc.createRange();
    r.setStart(start.node, start.offset);
    r.setEnd(end.node, end.offset);
    return r;
  }

  /**
   * Posição DOM → offset plano (pro hit-testing do clique-na-palavra).
   * Aceita Element com offset de filho (caretPositionFromPoint pode devolver
   * isso); retorna -1 quando o node não pertence ao mapa.
   */
  function domToFlat(node, offset) {
    if (node && node.nodeType === ELEMENT_NODE) {
      const child =
        node.childNodes[Math.min(offset, Math.max(0, node.childNodes.length - 1))];
      if (child && child.nodeType === TEXT_NODE) {
        node = child;
        offset = 0;
      }
    }
    const seg = byNode.get(node);
    if (!seg) return -1;
    const len = seg.flatEnd - seg.flatStart;
    const local = Math.max(seg.nodeStart, Math.min(offset, seg.nodeStart + len));
    return seg.flatStart + (local - seg.nodeStart);
  }

  return { flatText, segments, flatToDOM, rangeFromFlat, domToFlat };
}

// ---------------------------------------------------------------------------
// Camada 2a — TOKENIZAÇÃO
// ---------------------------------------------------------------------------

// Hífens que colam compostos ("guarda-chuva"): ASCII, U+2010 e o não-quebrável.
const HYPHEN_CHARS = new Set(["-", "‐", "‑"]);

// Abreviações que o Intl.Segmenter trata (errado) como fim de frase — a frase
// "Dr. Silva chegou." não pode virar duas pro destaque de sentença.
const SENT_ABBREVS = new Set([
  "dr", "dra", "sr", "sra", "srta", "prof", "profa", "eng", "exmo", "exma",
  "av", "gen", "cel", "dep", "sen", "min", "pe", "art", "pag", "pág", "tel",
  "sto", "sta", "obs", "ltda", "etc",
]);

// Segmenters são caros de construir; a locale é fixa → singletons do módulo.
let wordSegmenter = null;
let sentenceSegmenter = null;
function getSegmenters() {
  if (!wordSegmenter) {
    wordSegmenter = new Intl.Segmenter("pt-BR", { granularity: "word" });
    sentenceSegmenter = new Intl.Segmenter("pt-BR", { granularity: "sentence" });
  }
  return { wordSegmenter, sentenceSegmenter };
}

// Emenda frases quebradas por abreviação ("Dr. " + "Silva chegou.") in-place.
function mergeAbbreviationSentences(sentences, text) {
  const abbrevRe = /(?:^|[\s(["'«‘“])([\p{L}]{1,6})\.\s*$/u;
  const initialRe = /(?:^|\s)\p{Lu}\.\s*$/u; // inicial de nome: "J. Silva"
  for (let i = 0; i < sentences.length - 1; ) {
    const s = text.slice(sentences[i].start, sentences[i].end);
    const m = s.match(abbrevRe);
    if ((m && SENT_ABBREVS.has(m[1].toLowerCase())) || initialRe.test(s)) {
      sentences[i].end = sentences[i + 1].end;
      sentences.splice(i + 1, 1);
    } else {
      i++;
    }
  }
}

/**
 * Tokeniza o texto plano em palavras (com offsets) e frases.
 * Compostos com hífen viram UM token ("guarda-chuva") — a palavra inteira
 * acende junta, o que também casa com o boundary agrupado do Edge TTS.
 *
 * @param {string} flatText
 * @returns {{
 *   tokens: Array<{text: string, start: number, end: number, sentenceIdx: number}>,
 *   sentences: Array<{start: number, end: number}>
 * }}
 */
export function tokenize(flatText) {
  if (!flatText) return { tokens: [], sentences: [] };
  const { wordSegmenter: ws, sentenceSegmenter: ss } = getSegmenters();

  // Palavras: só segmentos isWordLike (pontuação/espaços ficam de fora).
  const tokens = [];
  for (const s of ws.segment(flatText)) {
    if (!s.isWordLike) continue;
    const start = s.index;
    const end = s.index + s.segment.length;
    const prev = tokens[tokens.length - 1];
    // Cola compostos: token imediatamente após um hífen gruda no anterior.
    if (prev && start === prev.end + 1 && HYPHEN_CHARS.has(flatText[prev.end])) {
      prev.end = end;
    } else {
      tokens.push({ start, end });
    }
  }

  // Frases contíguas cobrindo o texto todo + emenda de abreviações.
  const sentences = [];
  for (const s of ss.segment(flatText)) {
    sentences.push({ start: s.index, end: s.index + s.segment.length });
  }
  mergeAbbreviationSentences(sentences, flatText);

  // Cada token ganha o índice da frase que o contém (ponteiro linear).
  let si = 0;
  for (const t of tokens) {
    while (si < sentences.length - 1 && t.start >= sentences[si].end) si++;
    t.sentenceIdx = si;
    t.text = flatText.slice(t.start, t.end);
  }

  return { tokens, sentences };
}

// ---------------------------------------------------------------------------
// Camada 2b — ALINHAMENTO boundaries ↔ tokens
// ---------------------------------------------------------------------------

// Normalização de comparação: NFKC + lowercase, mantendo acentos.
// normEdge tira pontuação/símbolos/espaços só das BORDAS ("87%" → "87").
// normAll tira de TUDO — é a chave frouxa que casa boundaries agrupados
// ("R$ 1.500,00" → "r150000" == "r" + "150000" dos tokens).
const EDGE_STRIP_RE = /^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu;
const ALL_STRIP_RE = /[\p{P}\p{S}\s]+/gu;

function normEdge(s) {
  return s.normalize("NFKC").toLowerCase().replace(EDGE_STRIP_RE, "");
}
function normAll(s) {
  return s.normalize("NFKC").toLowerCase().replace(ALL_STRIP_RE, "");
}

// Janela de ressincronização: até 4 tokens × 6 boundaries (expansões tipo
// "Dr." → "doutor", "1.500" por extenso, "R$ 20" → "vinte reais").
const RESYNC_TOKENS = 4;
const RESYNC_BOUNDARIES = 6;

// concat(parts[from..from+k-1]) === target → devolve k; 0 se não fecha.
function matchConcat(target, parts, from, maxK) {
  if (!target) return 0;
  let acc = "";
  for (let k = 0; k < maxK && from + k < parts.length; k++) {
    acc += parts[from + k];
    if (acc === target) return k + 1;
    if (acc.length >= target.length) return 0; // passou do alvo — não fecha
  }
  return 0;
}

/**
 * Alinha os word boundaries do Edge TTS (subtitle do chunk, offsets em MEDIA
 * TIME relativos ao áudio DO CHUNK) aos tokens do texto plano da sessão.
 *
 * `charBase`/`charEnd` recortam a janela do chunk dentro do flatText: só
 * entram tokens com início em [charBase, charEnd). Os offsets planos da saída
 * continuam ABSOLUTOS (coordenadas do flatText inteiro da sessão).
 *
 * Casos do matcher, em ordem:
 *   (a) 1↔1 exato/frouxo;
 *   (b) split — 1 boundary ↔ k tokens (caso dominante: Edge agrupa
 *       "Dr. Silva", "R$ 1.500,00", "Em 2024" num boundary só);
 *   (c) merge — 1 token ↔ k boundaries (hífen que o Edge fatiar);
 *   (d) ressincronização — próximo casamento 1↔1 numa janela 4×6; o bloco
 *       não-casado vira UMA entrada em grupo (degradação suave);
 *   (e) nada casou na janela — degrada 1↔1 e segue (nunca dessincroniza o resto).
 *
 * @param {Array<{text: string, start: number, end: number, sentenceIdx: number}>} tokens
 * @param {Array<{offset: number, duration: number, text: string}>} subtitle
 * @param {number} [charBase=0]
 * @param {number} [charEnd=Infinity]
 * @returns {Array<{tStart: number, tEnd: number, flatStart: number, flatEnd: number, sentenceIdx: number}>}
 *          ordenada por tStart (não-decrescente garantido)
 */
export function alignBoundaries(tokens, subtitle, charBase = 0, charEnd = Infinity) {
  const toks = (tokens || []).filter((t) => t.start >= charBase && t.start < charEnd);
  const bnds = (subtitle || []).filter(
    (b) => b && typeof b.text === "string" && Number.isFinite(b.offset)
  );
  if (!toks.length || !bnds.length) return [];

  const tokEdge = toks.map((t) => normEdge(t.text));
  const tokLoose = toks.map((t) => normAll(t.text));
  const bndEdge = bnds.map((b) => normEdge(b.text));
  const bndLoose = bnds.map((b) => normAll(b.text));

  const bStart = (j) => bnds[j].offset;
  const bEnd = (j) => bnds[j].offset + (Number.isFinite(bnds[j].duration) ? bnds[j].duration : 0);

  const one = (i, j) =>
    (tokEdge[i] !== "" && tokEdge[i] === bndEdge[j]) ||
    (tokLoose[i] !== "" && tokLoose[i] === bndLoose[j]);

  const timeline = [];
  // Órfãos no INÍCIO do chunk (antes da primeira entrada) grudam nela.
  let pendingFlatStart = -1;
  let pendingTStart = -1;

  // Emite uma entrada cobrindo tokens [ti0..ti1] × boundaries [bi0..bi1].
  function push(ti0, ti1, bi0, bi1) {
    timeline.push({
      tStart: pendingTStart >= 0 ? Math.min(pendingTStart, bStart(bi0)) : bStart(bi0),
      tEnd: bEnd(bi1),
      flatStart:
        pendingFlatStart >= 0 ? Math.min(pendingFlatStart, toks[ti0].start) : toks[ti0].start,
      flatEnd: toks[ti1].end,
      sentenceIdx: toks[ti0].sentenceIdx,
    });
    pendingFlatStart = -1;
    pendingTStart = -1;
  }

  // Menor desalinhamento primeiro: procura casamento 1↔1 em (ti+di, bi+dj).
  function findResync(ti, bi) {
    for (let total = 1; total <= RESYNC_TOKENS + RESYNC_BOUNDARIES; total++) {
      for (let di = 0; di <= Math.min(total, RESYNC_TOKENS); di++) {
        const dj = total - di;
        if (dj > RESYNC_BOUNDARIES) continue;
        if (ti + di >= toks.length || bi + dj >= bnds.length) continue;
        if (one(ti + di, bi + dj)) return { di, dj };
      }
    }
    return null;
  }

  let ti = 0;
  let bi = 0;
  while (ti < toks.length && bi < bnds.length) {
    // (a) 1↔1
    if (one(ti, bi)) {
      push(ti, ti, bi, bi);
      ti++;
      bi++;
      continue;
    }
    // (b) split: 1 boundary ↔ k tokens
    let k = matchConcat(bndLoose[bi], tokLoose, ti, RESYNC_TOKENS);
    if (k > 1) {
      push(ti, ti + k - 1, bi, bi);
      ti += k;
      bi++;
      continue;
    }
    // (c) merge: 1 token ↔ k boundaries
    k = matchConcat(tokLoose[ti], bndLoose, bi, RESYNC_BOUNDARIES);
    if (k > 1) {
      push(ti, ti, bi, bi + k - 1);
      ti++;
      bi += k;
      continue;
    }
    // (c2) número escrito em 1 token, falado POR EXTENSO em k boundaries
    // ("1924" → "mil novecentos e vinte e quatro"; "914" → "novecentos e
    // catorze"). Os boundaries falados não concatenam de volta pros dígitos
    // (o merge (c) falha) e podem ser mais que a janela de resync — então o
    // matcher degradava 1↔1 e arrastava uma DEFASAGEM até o fim do chunk. Aqui:
    // como já falhou (a)/(b)/(c), o dígito está sendo falado expandido; consome
    // os boundaries até o próximo que casa com o TOKEN SEGUINTE (reanchor) e
    // faz o número cobrir toda a sua própria fala. Se nada casar, o teto (12)
    // limita o estrago; a cauda/resync seguinte reconcilia o resto.
    if (/\d/.test(toks[ti].text)) {
      // Agrupa tokens numéricos consecutivos ("1 176 914" = 3 tokens, falado
      // "um milhão cento e setenta e seis mil novecentos e catorze") num só
      // grupo — senão a reancoragem pelo token seguinte falharia (ele também é
      // número expandido).
      let te = ti;
      while (te + 1 < toks.length && /\d/.test(toks[te + 1].text)) te++;
      const afterTok = te + 1 < toks.length ? te + 1 : -1;
      const cap = Math.min(bnds.length, bi + 16);
      let j = bi + 1;
      while (j < cap && !(afterTok >= 0 && one(afterTok, j))) j++;
      if (j > bi + 1) {
        push(ti, te, bi, j - 1); // o grupo numérico cobre toda a sua própria fala
        ti = te + 1;
        bi = j;
        continue;
      }
    }
    // (d) ressincroniza no próximo casamento 1↔1 dentro da janela 4×6.
    const hit = findResync(ti, bi);
    if (hit) {
      const { di, dj } = hit;
      if (di > 0 && dj > 0) {
        // Bloco desconhecido dos dois lados → uma entrada em grupo.
        push(ti, ti + di - 1, bi, bi + dj - 1);
      } else if (di > 0) {
        // Tokens sem boundary (Edge pulou algo): grudam na entrada vizinha.
        if (timeline.length) timeline[timeline.length - 1].flatEnd = toks[ti + di - 1].end;
        else pendingFlatStart = toks[ti].start;
      } else if (dj > 0) {
        // Boundaries sem token (falado sem texto visível): idem, no tempo.
        if (timeline.length) {
          const last = timeline[timeline.length - 1];
          last.tEnd = Math.max(last.tEnd, bEnd(bi + dj - 1));
        } else {
          pendingTStart = bStart(bi);
        }
      }
      ti += di;
      bi += dj;
      continue;
    }
    // (e) nada casou na janela: degrada 1↔1 pra nunca travar o resto.
    push(ti, ti, bi, bi);
    ti++;
    bi++;
  }

  // Sobras de cauda: tokens restantes acendem com a última entrada; tempo
  // restante dos boundaries estica a última entrada.
  if (timeline.length) {
    const last = timeline[timeline.length - 1];
    if (ti < toks.length) last.flatEnd = toks[toks.length - 1].end;
    if (bi < bnds.length) last.tEnd = Math.max(last.tEnd, bEnd(bnds.length - 1));
  } else {
    // Degenerado (nunca houve push): bloco único cobrindo tudo.
    timeline.push({
      tStart: bStart(0),
      tEnd: bEnd(bnds.length - 1),
      flatStart: toks[0].start,
      flatEnd: toks[toks.length - 1].end,
      sentenceIdx: toks[0].sentenceIdx,
    });
  }

  // Garantia final pro ponteiro monotônico do tick: tStart não-decrescente
  // e tEnd >= tStart (boundaries já chegam ordenados; isso é cinto de segurança).
  let prev = 0;
  for (const e of timeline) {
    if (e.tStart < prev) e.tStart = prev;
    if (e.tEnd < e.tStart) e.tEnd = e.tStart;
    prev = e.tStart;
  }
  return timeline;
}

// ---------------------------------------------------------------------------
// Utilitário compartilhado — busca binária na timeline
// ---------------------------------------------------------------------------

/**
 * Índice da última entrada com tStart <= t (-1 se t vem antes da primeira).
 * Usada pelo tick() no seek pra trás e pelo hitTest() (item 3.5/3.6).
 */
export function timelineIndexAt(timeline, t) {
  let lo = 0;
  let hi = timeline.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].tStart <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

// ---------------------------------------------------------------------------
// Camadas 3–5 — motor com estado (sessão / tick / hitTest / observer)
// ---------------------------------------------------------------------------

// Debounce do MutationObserver (item 3.8): rajada de mutações → 1 re-map.
const MUTATION_DEBOUNCE_MS = 150;

/**
 * Cria o motor de destaque. Sem Custom Highlight API (Chrome < 105) vira
 * no-op com a MESMA superfície — o áudio segue, só não há destaque.
 *
 * opts: {
 *   ignoreEl?:       Element   // host do widget (ex. <zyrex-tts> com Shadow
 *                              // DOM): mutações e hit-tests dentro dele são
 *                              // ignorados — nunca são "da página"
 *   ignoreSelector?: string    // idem pra widget em DOM normal (o demo passa
 *                              // o dele); default: "#zx-root, #zx-para-play"
 *   onDegraded?:   () => void  // SPA levou o texto embora → seguimos só-áudio
 *   onActiveWord?: (range, {sentenceIdx, sentenceChanged}) => void
 *                              // palavra ativa mudou — gancho do auto-scroll
 *                              // do content.js (item 3.7); range é a palavra
 * }
 *
 * Contrato de integração (content.js / reader):
 *   const engine = createHighlightEngine({ onDegraded, onActiveWord });
 *   const { flatText } = engine.startSession(elementOuRange, { twoLevel: true, trail: false });
 *   // trail:true (item 6.1/D3, opt-in — default false) registra um 3º
 *   // Highlight 'zx-past' (priority 0) com toda palavra já lida nesta
 *   // sessão; custo zero quando desligado (o Highlight nem chega a existir).
 *   // → flatText é O texto a enviar pra API (mesma string do destaque);
 *   // deps do PlaybackController:
 *   onChunkChange: (chunk) => engine.setChunkSubtitle(chunk, chunk.subtitle),
 *   onWordTick:    (chunk, mediaTime) => engine.tick(mediaTime),
 *   // clique-na-palavra (D4): engine.hitTest(x, y) → {chunkIdx, tStart}|null,
 *   //   e o chamador faz controller.seekTo(chunkIdx, tStart);
 *   // fim/stop/fechar widget/pagehide:
 *   engine.endSession();
 */
export function createHighlightEngine(opts = {}) {
  const onDegraded = typeof opts.onDegraded === "function" ? opts.onDegraded : () => {};
  const onActiveWord = typeof opts.onActiveWord === "function" ? opts.onActiveWord : null;
  // Onde o widget do Zyrex mora: aceita um Element (o host <zyrex-tts> da
  // extensão, Shadow DOM) E/OU um seletor (o demo, com widget em DOM normal,
  // passa o dele). Suporta ambos ao mesmo tempo; sem opts vale o seletor
  // clássico. Checagem em isWidgetNode (observer + hitTest).
  const ignoreEl =
    opts.ignoreEl && opts.ignoreEl.nodeType === ELEMENT_NODE ? opts.ignoreEl : null;
  const ignoreSelector =
    typeof opts.ignoreSelector === "string" && opts.ignoreSelector
      ? opts.ignoreSelector
      : WIDGET_SELECTOR;

  // Guard central (decisão técnica do PLANO): sem a API, no-op integral.
  const supported =
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof Highlight !== "undefined" &&
    typeof document !== "undefined";

  if (!supported) {
    // No-op integral, MAS startSession ainda entrega o flatText (o contrato
    // "mesma string pro áudio e pro destaque" vale também sem destaque).
    const noop = () => {};
    return {
      isSupported: false,
      startSession: (target) => {
        try {
          return { flatText: buildTextMap(target).flatText };
        } catch (_) {
          return { flatText: textOf(target) };
        }
      },
      setChunkSubtitle: noop,
      tick: noop,
      hitTest: () => null,
      endSession: noop,
      rerender: noop,
    };
  }

  // ---- estado da sessão ----
  let session = null; // { target, map, tokens, sentences, twoLevel, trail, timelines, chunk, timeline, ptr, sentenceIdx, lastTime }
  let hlWord = null;
  let hlSentence = null;
  let hlPast = null; // rastro do que já foi lido (item 6.1) — só existe com trail:true
  let observer = null; // MutationObserver (item 3.8)
  let mutationTimer = null; // debounce do re-map (150ms)

  function clearHighlights() {
    try {
      CSS.highlights.delete("zx-word");
      CSS.highlights.delete("zx-sentence");
      CSS.highlights.delete("zx-past");
    } catch (_) {}
    hlWord = null;
    hlSentence = null;
    hlPast = null;
  }

  // O node pertence ao widget do Zyrex? (host/shadow via ignoreEl; DOM normal
  // via ignoreSelector.) Usado pelo MutationObserver — mutações do widget não
  // são "da página" — e pelo hitTest — clique no widget nunca seek-a.
  function isWidgetNode(node) {
    if (!node) return false;
    const el = node.nodeType === ELEMENT_NODE ? node : node.parentElement;
    if (!el) return false;
    if (ignoreEl) {
      if (el === ignoreEl || ignoreEl.contains(el)) return true;
      // Nós de DENTRO do shadow root do host: sobe pelo root.host.
      const root = typeof el.getRootNode === "function" ? el.getRootNode() : null;
      if (root && root.host && (root.host === ignoreEl || ignoreEl.contains(root.host))) {
        return true;
      }
    }
    if (el.closest) {
      try {
        if (el.closest(ignoreSelector)) return true;
      } catch (_) {}
    }
    return false;
  }

  /**
   * Abre uma sessão de destaque pro alvo (Element ou Range clonado).
   * Constrói o text map + tokens e registra os Highlights vazios.
   * Retorna { flatText } — a string exata a enviar pra /api/tts.
   */
  function startSession(target, { twoLevel = true, trail = false } = {}) {
    endSession();
    const map = buildTextMap(target);
    const { tokens, sentences } = tokenize(map.flatText);
    session = {
      target,               // Element/Range de origem (o re-map do 3.8 reconstrói daqui)
      map,
      tokens,
      sentences,
      twoLevel,
      trail,                 // rastro do que já foi lido (item 6.1/D3 — opt-in)
      timelines: new Map(), // chunk → timeline (cache por sessão)
      chunk: null,          // chunk ativo (o que o <audio> está tocando)
      timeline: null,       // timeline do chunk ativo
      ptr: -1,              // ponteiro monotônico na timeline ativa
      sentenceIdx: -1,      // frase acesa (só re-renderiza quando muda)
      lastTime: NaN,        // último mediaTime visto (o re-map re-renderiza daqui)
    };
    hlWord = new Highlight();
    hlWord.priority = 2; // palavra pinta por cima da frase
    CSS.highlights.set("zx-word", hlWord);
    if (twoLevel) {
      hlSentence = new Highlight();
      hlSentence.priority = 1;
      CSS.highlights.set("zx-sentence", hlSentence);
    }
    // Rastro (item 6.1, D3): só registrado quando pedido — custo zero (nem o
    // Highlight nasce) quando o toggle está desligado, que é o padrão.
    if (trail) {
      hlPast = new Highlight();
      hlPast.priority = 0; // fica por baixo da frase e da palavra
      CSS.highlights.set("zx-past", hlPast);
    }
    startObserver(target); // robustez SPA (item 3.8)
    return { flatText: map.flatText };
  }

  /**
   * Chegou (ou trocou) o chunk em reprodução: alinha o subtitle dele contra
   * os tokens da sessão e ativa a timeline. Idempotente por chunk (cache).
   * Chamar no onChunkChange do PlaybackController.
   */
  function setChunkSubtitle(chunk, subtitle) {
    if (!session || !chunk) return;
    let timeline = session.timelines.get(chunk);
    if (!timeline) {
      const base = Number.isFinite(chunk.charStart) ? chunk.charStart : 0;
      const end = Number.isFinite(chunk.charEnd) ? chunk.charEnd : Infinity;
      timeline = alignBoundaries(session.tokens, subtitle || chunk.subtitle, base, end);
      session.timelines.set(chunk, timeline);
    }
    // Troca de chunk com o rastro ligado: a última palavra do chunk anterior
    // já foi lida — entra pro rastro antes do ponteiro resetar (senão a
    // fronteira entre chunks perderia exatamente essa palavra do acúmulo).
    if (hlPast && session.timeline && session.ptr >= 0) {
      const prevEntry = session.timeline[session.ptr];
      if (prevEntry) {
        const r = safeRange(prevEntry.flatStart, prevEntry.flatEnd);
        if (r) hlPast.add(r);
      }
    }
    session.chunk = chunk;
    session.timeline = timeline;
    session.ptr = -1;
    session.sentenceIdx = -1;
    if (hlWord) hlWord.clear();
    // A frase só apaga aqui se o próximo tick não a reacender (chunk pode
    // começar no meio da mesma frase — o tick resolve pelo sentenceIdx).
  }

  // Range de [a, b) que nunca derruba o tick: node removido/encurtado pela
  // página vira null (o 3.8 cuida do re-map; aqui só não pode crashar).
  function safeRange(a, b) {
    try {
      return session.map.rangeFromFlat(a, b);
    } catch (_) {
      return null;
    }
  }

  /**
   * Ponteiro monotônico no rAF (item 3.5): avanço O(1) por frame (quase sempre
   * 0 ou 1 passo); busca binária SÓ quando o tempo volta (seek pra trás /
   * replay). Os Highlights só são tocados quando o ponteiro muda — frame sem
   * mudança não faz trabalho nenhum. A frase (zx-sentence) só re-renderiza
   * quando o sentenceIdx muda.
   * @param {number} mediaTime tempo corrente do <audio> DO CHUNK (segundos)
   */
  function tick(mediaTime) {
    if (!session || !session.timeline || !session.timeline.length) return;
    session.lastTime = mediaTime; // o re-map do 3.8 re-renderiza a partir daqui
    const tl = session.timeline;
    let ptr = session.ptr;
    if (ptr >= 0 && mediaTime < tl[ptr].tStart) {
      // Seek pra trás: reposiciona por busca binária.
      ptr = timelineIndexAt(tl, mediaTime);
    } else {
      // Caminho quente: avança em O(1).
      while (ptr + 1 < tl.length && tl[ptr + 1].tStart <= mediaTime) ptr++;
    }
    if (ptr === session.ptr) return;
    const prevPtr = session.ptr;
    session.ptr = ptr;
    const entry = ptr >= 0 ? tl[ptr] : null;

    // Rastro (item 6.1, D3 — só quando hlTrail): toda entrada que o ponteiro
    // ultrapassou avançando (nunca em seek pra trás/replay) vira rastro.
    // Cinza neutro sempre — nunca a cor do destaque (evita competir com a
    // palavra ativa).
    if (hlPast && ptr > prevPtr) {
      for (let i = Math.max(prevPtr, 0); i < ptr; i++) {
        const r = safeRange(tl[i].flatStart, tl[i].flatEnd);
        if (r) hlPast.add(r);
      }
    }

    // Palavra ativa (priority 2 pinta por cima da frase).
    let wordRange = null;
    if (hlWord) {
      hlWord.clear();
      if (entry) {
        wordRange = safeRange(entry.flatStart, entry.flatEnd);
        if (wordRange) hlWord.add(wordRange);
      }
    }

    // Frase em leitura (priority 1) — só quando muda de frase.
    const sIdx = entry ? entry.sentenceIdx : -1;
    const sentenceChanged = sIdx !== session.sentenceIdx;
    if (sentenceChanged) {
      session.sentenceIdx = sIdx;
      if (hlSentence) {
        hlSentence.clear();
        const sent = sIdx >= 0 ? session.sentences[sIdx] : null;
        if (sent) {
          // O segmento de sentença carrega o whitespace até a frase seguinte —
          // recorta as bordas pro fundo não vazar além da pontuação final.
          const text = session.map.flatText;
          let a = sent.start;
          let b = sent.end;
          while (b > a && /\s/.test(text[b - 1])) b--;
          while (a < b && /\s/.test(text[a])) a++;
          const r = b > a ? safeRange(a, b) : null;
          if (r) hlSentence.add(r);
        }
      }
    }

    // Gancho do auto-scroll (item 3.7): a palavra mudou — quem decide rolar
    // (banda de conforto, 1 por frase, suspensão manual) é o chamador.
    if (onActiveWord && entry && wordRange) {
      try {
        onActiveWord(wordRange, { sentenceIdx: sIdx, sentenceChanged });
      } catch (_) {}
    }
  }

  /**
   * Clique-na-palavra (item 3.6): (x, y) do clique → posição de caret →
   * offset plano (domToFlat) → chunk cuja janela [charStart, charEnd)
   * contém o offset → entrada da timeline dele (busca binária por flatStart).
   * Só enxerga chunks já alinhados nesta sessão (setChunkSubtitle) — clicar
   * em texto que ainda não tocou não seek-a. Links/botões/inputs nunca
   * chegam aqui (decisão D4): o listener do content.js filtra antes.
   * O chunkIdx devolvido é o `queueIdx` estampado pelo PlaybackController —
   * vai direto pro controller.seekTo(chunkIdx, tStart).
   * @returns {{chunkIdx: number, tStart: number} | null}
   */
  function hitTest(x, y) {
    if (!session || !session.timelines.size) return null;
    let node = null;
    let offset = 0;
    try {
      if (typeof document.caretPositionFromPoint === "function") {
        // Padrão (Chrome 128+).
        const pos = document.caretPositionFromPoint(x, y);
        if (!pos) return null;
        node = pos.offsetNode;
        offset = pos.offset;
      } else if (typeof document.caretRangeFromPoint === "function") {
        // Fallback não-padrão, estável no Chromium 105–127.
        const r = document.caretRangeFromPoint(x, y);
        if (!r) return null;
        node = r.startContainer;
        offset = r.startOffset;
      } else {
        return null;
      }
    } catch (_) {
      return null;
    }
    if (!node) return null;
    if (isWidgetNode(node)) return null; // clique no próprio widget — passa
    const off = session.map.domToFlat(node, offset);
    if (off < 0) return null; // fora do trecho em leitura — o clique passa
    for (const [chunk, timeline] of session.timelines) {
      const base = Number.isFinite(chunk.charStart) ? chunk.charStart : 0;
      const end = Number.isFinite(chunk.charEnd) ? chunk.charEnd : Infinity;
      if (off < base || off >= end || !timeline.length) continue;
      // flatStart é não-decrescente na timeline → busca binária pela última
      // entrada com flatStart <= off.
      let lo = 0;
      let hi = timeline.length - 1;
      let ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (timeline[mid].flatStart <= off) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (ans < 0) break; // antes da primeira palavra alinhada do chunk
      const entry = timeline[ans];
      if (off >= entry.flatEnd) break; // clique entre palavras/pontuação — passa
      return {
        chunkIdx: Number.isInteger(chunk.queueIdx) ? chunk.queueIdx : -1,
        tStart: entry.tStart,
      };
    }
    return null;
  }

  // ---- robustez SPA (item 3.8) ----

  // O alvo da sessão ainda serve de base pra um re-map?
  function targetAlive(target) {
    try {
      if (typeof Range !== "undefined" && target instanceof Range) {
        // Range encolhe/colapsa sozinho quando a página remove nodes dele.
        return (
          !target.collapsed &&
          target.startContainer.isConnected &&
          target.endContainer.isConnected
        );
      }
      return !!(target && target.isConnected);
    } catch (_) {
      return false;
    }
  }

  // SPA levou o texto embora: destaque desliga de vez, o áudio segue no
  // controller (que não passa por aqui). Nunca crasha o host.
  function degrade() {
    if (!session) return;
    endSession();
    try {
      onDegraded();
    } catch (_) {}
  }

  // Re-map depois de uma mutação (debounced): se o texto visível continua
  // IGUAL (ou o antigo virou prefixo — página anexou conteúdo no fim, ex.
  // lazy-load), basta trocar o mapa flat↔DOM e re-renderizar o destaque na
  // última posição conhecida — as timelines seguem válidas porque guardam
  // offsets planos, não Ranges. Texto mudou/sumiu → degrada pra só-áudio.
  function remap() {
    if (!session) return;
    let newMap = null;
    try {
      if (targetAlive(session.target)) newMap = buildTextMap(session.target);
    } catch (_) {
      newMap = null;
    }
    const oldFlat = session.map.flatText;
    const ok =
      newMap &&
      newMap.flatText.trim() !== "" &&
      (newMap.flatText === oldFlat || newMap.flatText.startsWith(oldFlat));
    if (!ok) {
      degrade();
      return;
    }
    session.map = newMap;
    // Os Ranges acesos podem apontar pra nodes soltos: força re-render.
    session.ptr = -1;
    session.sentenceIdx = -1;
    if (hlWord) hlWord.clear();
    if (hlSentence) hlSentence.clear();
    if (hlPast) hlPast.clear();
    if (session.timeline && Number.isFinite(session.lastTime)) tick(session.lastTime);
  }

  // Observa o ancestral comum da leitura. Como o motor nunca muta o DOM
  // (CSS.highlights não gera MutationRecord), o observer jamais reage ao
  // próprio destaque — só a mudanças reais da página.
  function startObserver(target) {
    let root =
      typeof Range !== "undefined" && target instanceof Range
        ? target.commonAncestorContainer
        : target;
    if (root && root.nodeType === TEXT_NODE) root = root.parentNode;
    if (!root || (root.nodeType !== ELEMENT_NODE && root.nodeType !== DOCUMENT_NODE)) return;
    observer = new MutationObserver((records) => {
      // Mutações do PRÓPRIO widget não contam: o timer da pill muda a cada
      // frame e, quando a raiz observada contém o widget (ex. seleção
      // multi-parágrafo com ancestral body), essas mutações adiavam o
      // debounce pra sempre — a robustez SPA ficava inerte.
      let pageMutation = false;
      for (const rec of records) {
        if (!isWidgetNode(rec.target)) {
          pageMutation = true;
          break;
        }
      }
      if (!pageMutation) return;
      // Debounce 150ms: rajadas de mutação (render de SPA) viram 1 re-map.
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(remap, MUTATION_DEBOUNCE_MS);
    });
    try {
      observer.observe(root, { childList: true, characterData: true, subtree: true });
    } catch (_) {
      observer = null;
    }
  }

  /** Encerra a sessão: apaga highlights, desliga observer, solta referências. */
  function endSession() {
    if (observer) {
      try {
        observer.disconnect();
      } catch (_) {}
      observer = null;
    }
    clearTimeout(mutationTimer);
    mutationTimer = null;
    clearHighlights();
    session = null;
  }

  // Repinta a palavra/frase CORRENTE na geometria atual, sem mexer no ponteiro
  // nem no tempo. Útil após um reflow (troca de fonte/tamanho/largura, ou
  // chegada tardia de web font): a timeline é media-time e os Ranges são por
  // offset de caractere (independem do layout), mas o `tick` só re-toca os
  // Highlights quando o ponteiro MUDA — então, no meio de uma palavra longa, o
  // destaque podia continuar pintado na geometria antiga até a próxima palavra.
  function rerender() {
    if (!session || !session.timeline || session.ptr < 0) return;
    const entry = session.timeline[session.ptr];
    if (hlWord) {
      hlWord.clear();
      const r = entry ? safeRange(entry.flatStart, entry.flatEnd) : null;
      if (r) hlWord.add(r);
    }
    if (hlSentence && session.sentenceIdx >= 0) {
      hlSentence.clear();
      const sent = session.sentences ? session.sentences[session.sentenceIdx] : null;
      if (sent) {
        const text = session.map.flatText;
        let a = sent.start;
        let b = sent.end;
        while (b > a && /\s/.test(text[b - 1])) b--;
        while (a < b && /\s/.test(text[a])) a++;
        const r = b > a ? safeRange(a, b) : null;
        if (r) hlSentence.add(r);
      }
    }
  }

  return { isSupported: true, startSession, setChunkSubtitle, tick, hitTest, endSession, rerender };
}

// Texto de um alvo no modo no-op (sem Highlight API): mantém o contrato de
// startSession devolvendo a mesma string que iria pra API.
function textOf(target) {
  try {
    if (typeof Range !== "undefined" && target instanceof Range) return target.toString();
    return target && target.textContent ? target.textContent : "";
  } catch (_) {
    return "";
  }
}
