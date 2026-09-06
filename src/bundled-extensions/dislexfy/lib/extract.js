// extract.js — extração de conteúdo do Modo Leitura (Etapa 5, item 5.1).
// Módulo ES consumido via `import(chrome.runtime.getURL('lib/extract.js'))`,
// no mesmo padrão de lib/zx-player.js e lib/highlight-engine.js (ver
// content.js:boot()). Funciona tanto injetado no content script (página do
// usuário, Shadow DOM) quanto dentro de reader.html (página da extensão).
//
// Dependências vendorizadas (Etapa 0/1, Mozilla @mozilla/readability 0.5.0):
//   lib/Readability.js            → define `function Readability(doc, opts)`
//   lib/Readability-readerable.js → define `function isProbablyReaderable(doc, opts)`
// Ambos os arquivos são scripts CLÁSSICOS (declaração de função no escopo
// top-level; só fazem `module.exports` quando `typeof module === "object"`,
// isto é, em CommonJS/Node). Carregados como <script src> comum eles viram
// globais em `window`. Carregados como `<script type=module>` os top-level
// `function`/`var` NÃO vazam para o global — por isso este módulo garante o
// carregamento via injeção de <script> clássico (ensureReadabilityGlobals),
// e não via `import()` dinâmico dos arquivos vendorizados.
//
// Consumidores:
//   - reader.html: pode simplesmente declarar
//       <script src="lib/Readability.js"></script>
//       <script src="lib/Readability-readerable.js"></script>
//     antes do <script type=module src="reader.js">; ensureReadabilityGlobals
//     vira no-op (os globais já existem) — mas funciona igual se preferir
//     deixar só o import dinâmico cuidar disso.
//   - content.js (mundo isolado do content script, MV3): ensureReadabilityGlobals
//     carrega os arquivos vendorizados via `import(chrome.runtime.getURL(...))`
//     — o MESMO mecanismo que já traz o próprio extract.js (content.js:
//     loadExtractModule), e que funciona sem esbarrar em CSP. NÃO usamos
//     eval/new Function: a CSP de extensão do MV3 os proíbe no mundo isolado
//     do content script (independente da CSP da página). A abordagem antiga
//     (fetch + `(0, eval)(code)`) falhava silenciosamente em TODA página, o
//     que jogava a extração sempre no fallback heurístico — visível como
//     "lixo" de navegação (menus da Wikipédia etc.) no Modo Leitura.
//     Como `import()` de um arquivo sem import/export roda-o em escopo de
//     módulo (strict), a `function` de topo não vira global sozinha; por isso
//     os arquivos vendorizados ganharam um rodapé `globalThis.X = X` — o
//     import por efeito colateral deixa o global pronto (e o registro de
//     módulos por URL torna chamadas repetidas um no-op).

const READABILITY_URLS = {
  Readability: "lib/Readability.js",
  isProbablyReaderable: "lib/Readability-readerable.js",
};

let readabilityLoadPromise = null;

// Garante que `Readability` e `isProbablyReaderable` existem como globais
// (`self.Readability` / `self.isProbablyReaderable`). Idempotente e seguro
// pra chamar de qualquer contexto (content script ou reader.html).
async function ensureReadabilityGlobals() {
  if (typeof Readability !== "undefined" && typeof isProbablyReaderable !== "undefined") {
    return true;
  }
  if (readabilityLoadPromise) return readabilityLoadPromise;

  readabilityLoadPromise = (async () => {
    // chrome.runtime.getURL só existe em contexto de extensão (content
    // script ou página chrome-extension://). Sem ele não há como localizar
    // os arquivos vendorizados — quem chamar extractArticle fora desse
    // contexto precisa ter os globais prontos por conta própria.
    const getURL =
      (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) || null;
    if (!getURL) {
      return typeof Readability !== "undefined" && typeof isProbablyReaderable !== "undefined";
    }

    for (const [globalName, relPath] of Object.entries(READABILITY_URLS)) {
      if (typeof self[globalName] !== "undefined") continue;
      try {
        // import() de um recurso chrome-extension:// (web_accessible_resource)
        // funciona no content script MV3 SEM esbarrar em CSP — é o mesmo
        // mecanismo pelo qual o próprio extract.js é carregado (content.js:
        // loadExtractModule). NÃO usamos eval/new Function aqui: a CSP de
        // extensão do MV3 os proíbe no mundo isolado do content script (o
        // `'unsafe-eval'` da página é irrelevante nesse mundo), então o eval
        // falhava em TODA página e a extração caía sempre no fallback
        // heurístico — que na Wikipédia arrasta todos os menus (Ferramentas,
        // Imprimir/exportar, etc.). Os arquivos vendorizados atribuem o
        // símbolo a globalThis no rodapé, então o import por efeito colateral
        // já deixa self[globalName] pronto (ES module cacheia por URL — chamar
        // de novo é no-op).
        await import(getURL(relPath));
        if (typeof self[globalName] === "undefined") {
          throw new Error(`"${globalName}" não ficou disponível após importar ${relPath}`);
        }
      } catch (err) {
        console.warn("[Zyrex] falha ao carregar", relPath, err);
      }
    }
    return typeof Readability !== "undefined" && typeof isProbablyReaderable !== "undefined";
  })();

  return readabilityLoadPromise;
}

// ---------------------------------------------------------------------------
// Sanitização por allowlist
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote",
  "figure", "figcaption",
  "img",
  "a",
  "em", "strong", "b", "i",
  "br",
  "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
]);

// Atributos permitidos por tag (além disso, tudo cai fora — inclusive todo on*/style).
const ALLOWED_ATTRS = {
  img: new Set(["src", "alt"]),
  a: new Set(["href"]),
};

const BLOCK_TEXT_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "figcaption"]);

export function isSafeUrl(value, { allowDataImage } = {}) {
  if (!value) return false;
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return true;
  if (allowDataImage && /^data:image\//i.test(v)) return true;
  return false;
}

// Remove recursivamente tudo que não está na allowlist, atributo a atributo,
// elemento a elemento. Opera sobre um DocumentFragment isolado (produzido via
// DOMParser em outro `document`), nunca sobre o DOM real da página.
function sanitizeFragment(fragment, doc) {
  // NodeIterator/TreeWalker vivo sofre com remoções durante o walk; junta os
  // elementos primeiro (querySelectorAll é snapshot), depois decide de fora
  // pra dentro pra não perder texto de elementos removidos (unwrap, não strip).
  const all = Array.from(fragment.querySelectorAll("*"));
  for (const el of all) {
    const tag = el.tagName.toLowerCase();

    if (tag === "script" || tag === "iframe" || tag === "object" ||
        tag === "embed" || tag === "svg" || tag === "form" || tag === "input" ||
        tag === "style" || tag === "link" || tag === "noscript") {
      el.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: preserva os filhos/texto, descarta só o elemento não-permitido
      // (ex.: <div>, <span>, <section> viram texto solto no pai).
      const parent = el.parentNode;
      if (!parent) continue;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      continue;
    }

    // Remove todos os atributos fora da allowlist (isso já mata on*, style,
    // class, id, data-*, etc. — a allowlist é positiva, não uma denylist).
    const keep = ALLOWED_ATTRS[tag] || new Set();
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!keep.has(name)) {
        el.removeAttribute(attr.name);
      }
    }

    if (tag === "img") {
      const src = el.getAttribute("src");
      if (!isSafeUrl(src, { allowDataImage: true })) {
        el.remove();
        continue;
      }
    }
    if (tag === "a") {
      const href = el.getAttribute("href");
      if (!isSafeUrl(href)) {
        el.removeAttribute("href");
      }
    }
  }
  return fragment;
}

// Poda blocos que são (quase) só links — assinatura de menu/navegação/portal
// que o Readability deixa passar em páginas-índice (ex.: Página principal da
// Wikipédia: "Ajuda", "Índice", "Portais", listas de idiomas...). Critério
// conservador: densidade de texto-em-link > 0.8 E bloco curto (< 200 chars) —
// parágrafos legítimos cheios de links (introduções de artigo) têm densidade
// bem menor, e citações/links longos passam pelo limite de tamanho. Headings
// ficam de fora (títulos linkados são comuns em artigos legítimos).
const LINK_PRUNE_SELECTOR = "p, li, figcaption, blockquote";
const LINK_DENSITY_MAX = 0.8;
const LINK_PRUNE_MAX_CHARS = 200;

function pruneLinkOnlyBlocks(root) {
  const blocks = Array.from(root.querySelectorAll(LINK_PRUNE_SELECTOR));
  for (const el of blocks) {
    // Blocos aninhados (li dentro de blockquote não existe pós-sanitização,
    // mas p dentro de li sim): decide pelo nó mais interno primeiro — a
    // ordem do querySelectorAll (document order) + checagem de isConnected
    // cobre remoções em cascata.
    if (!el.isConnected) continue;
    const text = (el.textContent || "").trim();
    if (!text || text.length >= LINK_PRUNE_MAX_CHARS) continue;
    let linkLen = 0;
    for (const a of el.querySelectorAll("a")) {
      linkLen += (a.textContent || "").trim().length;
    }
    if (linkLen / text.length > LINK_DENSITY_MAX) el.remove();
  }
  // Listas/figuras que ficaram vazias após a poda não devem sobrar como
  // "esqueletos" (ul sem li vira um vão em branco no reader).
  for (const el of Array.from(root.querySelectorAll("ul, ol, figure"))) {
    if (!(el.textContent || "").trim() && !el.querySelector("img")) el.remove();
  }
}

// Faz o parse do HTML retornado por Readability num documento isolado
// (DOMParser), sanitiza por allowlist, e devolve { html, root } onde `root`
// é o body do documento isolado (útil pra extrair textBlocks em seguida).
function sanitizeHtml(html, baseURI) {
  const parser = new DOMParser();
  // "text/html" com baseURI custom: setamos via <base> pra manter href/src
  // relativos coerentes (Readability já deveria ter absolutizado, mas isso
  // cobre o caso do fallback heurístico, que não passa pelo Readability).
  const safeBase = baseURI ? String(baseURI).replace(/"/g, "&quot;") : "";
  const wrapped = safeBase
    ? `<!doctype html><html><head><base href="${safeBase}"></head><body>${html}</body></html>`
    : `<!doctype html><html><body>${html}</body></html>`;
  const isolatedDoc = parser.parseFromString(wrapped, "text/html");
  const body = isolatedDoc.body;
  sanitizeFragment(body, isolatedDoc);
  pruneLinkOnlyBlocks(body);
  return { html: body.innerHTML, root: body };
}

// ---------------------------------------------------------------------------
// textBlocks — lista ordenada dos blocos legíveis do HTML sanitizado
// ---------------------------------------------------------------------------

function extractTextBlocks(root) {
  const blocks = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  // TreeWalker começa no próprio root; avança pra primeiro filho.
  node = walker.nextNode();
  while (node) {
    const tag = node.tagName.toLowerCase();
    if (BLOCK_TEXT_TAGS.has(tag)) {
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (text) blocks.push({ tag, text });
    }
    node = walker.nextNode();
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Fallback heurístico
// ---------------------------------------------------------------------------

const FALLBACK_EXCLUDE_SELECTOR = "nav, footer, aside, header";
const MIN_FALLBACK_PARAGRAPH_CHARS = 60;
const MIN_READABILITY_TEXT_CHARS = 400;

function collectFallbackHtml(doc) {
  const candidates = doc.querySelectorAll('article, main, [role="main"]');
  let container = null;
  let bestLen = 0;
  for (const el of candidates) {
    if (el.closest && el.closest(FALLBACK_EXCLUDE_SELECTOR)) continue;
    const len = el.textContent.trim().length;
    if (len > bestLen) {
      bestLen = len;
      container = el;
    }
  }

  if (container && bestLen >= MIN_FALLBACK_PARAGRAPH_CHARS) {
    return container.innerHTML;
  }

  // Sem article/main utilizável: junta todos os <p> "de conteúdo" (>60
  // chars, fora de nav/footer/aside/header) na ordem em que aparecem.
  const paragraphs = Array.from(doc.querySelectorAll("p")).filter((p) => {
    if (p.closest && p.closest(FALLBACK_EXCLUDE_SELECTOR)) return false;
    return p.textContent.trim().length > MIN_FALLBACK_PARAGRAPH_CHARS;
  });
  if (!paragraphs.length) return "";
  return paragraphs.map((p) => `<p>${p.innerHTML}</p>`).join("\n");
}

function buildFallbackArticle(doc) {
  const html = collectFallbackHtml(doc);
  if (!html || !html.trim()) return null;

  const baseURI = doc.baseURI || (doc.location && doc.location.href) || undefined;
  const { html: sanitized, root } = sanitizeHtml(html, baseURI);
  const textBlocks = extractTextBlocks(root);
  if (!textBlocks.length) return null;

  return {
    title: (doc.title || "").trim() || null,
    byline: null,
    contentHTML: sanitized,
    lang: doc.documentElement ? doc.documentElement.lang || null : null,
    sourceUrl: (doc.location && doc.location.href) || doc.baseURI || null,
    textBlocks,
  };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

// extractArticle(doc = document): clona o documento (Readability MUTILA o
// DOM — nunca rodar no documento real), roda Readability nesse clone, sanitiza
// o HTML resultante por allowlist e monta textBlocks. Cai no fallback
// heurístico quando parse() falha ou o artigo é curto demais pra valer a
// pena. Retorna null quando nada aproveitável foi encontrado.
export async function extractArticle(doc = document) {
  const ok = await ensureReadabilityGlobals();

  let parsed = null;
  if (ok && typeof Readability !== "undefined") {
    try {
      // cloneNode(true) preserva baseURI (é propriedade derivada da URL do
      // documento de origem, não do conteúdo clonado) — por isso Readability
      // consegue absolutizar src/href relativos de imagens e links no clone
      // exatamente como faria no documento original.
      const clone = doc.cloneNode(true);
      parsed = new Readability(clone, { keepClasses: false }).parse();
    } catch (err) {
      console.warn("[Zyrex] Readability.parse() falhou:", err);
      parsed = null;
    }
  }

  const textLen = parsed && parsed.textContent ? parsed.textContent.trim().length : 0;

  if (!parsed || textLen < MIN_READABILITY_TEXT_CHARS) {
    return buildFallbackArticle(doc);
  }

  const baseURI = doc.baseURI || (doc.location && doc.location.href) || undefined;
  const { html: sanitized, root } = sanitizeHtml(parsed.content, baseURI);
  const textBlocks = extractTextBlocks(root);

  if (!textBlocks.length) {
    return buildFallbackArticle(doc);
  }

  return {
    title: parsed.title || (doc.title || "").trim() || null,
    byline: parsed.byline || null,
    contentHTML: sanitized,
    lang: parsed.lang || (doc.documentElement ? doc.documentElement.lang || null : null),
    sourceUrl: (doc.location && doc.location.href) || doc.baseURI || null,
    textBlocks,
  };
}

// isProbablyReaderable(doc = document): wrapper defensivo em torno da versão
// vendorizada — usado pra habilitar/esmaecer o botão de Modo Leitura sem
// custo de parse completo. Mantido SÍNCRONO de propósito (é chamado no
// primeiro hover/abertura do widget, não pode bloquear em await); se o
// global ainda não foi carregado, dispara ensureReadabilityGlobals() em
// segundo plano (fire-and-forget, prepara a próxima chamada) e retorna
// `false` já nesta primeira vez — botão esmaecido é o estado seguro.
// Qualquer falha (doc atípico, etc.) também degrada pra `false`, nunca
// lançar aqui.
export function isProbablyReaderable(doc = document) {
  try {
    if (typeof self.isProbablyReaderable !== "function") {
      ensureReadabilityGlobals().catch(() => {});
      return false;
    }
    return !!self.isProbablyReaderable(doc);
  } catch (err) {
    console.warn("[Zyrex] isProbablyReaderable falhou:", err);
    return false;
  }
}

// Exportado só pra teste/depuração manual (não é usado pelo fluxo normal,
// que resolve os globais sob demanda dentro de extractArticle).
export const __internal = {
  ensureReadabilityGlobals,
  sanitizeHtml,
  extractTextBlocks,
  buildFallbackArticle,
};
