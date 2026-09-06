# Dislexfy — Chrome Extension

Leitor de texto por voz natural que funciona em qualquer site. Selecione um trecho, ouça, e acompanhe palavra por palavra.

Pensado para acessibilidade e para quem tem dislexia.

---

## Como instalar (modo desenvolvedor)

**Antes de tudo — buildar a UI.** A pasta `ui/` (React) compila para `extension/ui/`,
que é gitignorada. Num clone limpo, "Carregar sem compactação" falha até você rodar:

```bash
npm run install:ext   # uma vez
npm run build:ext     # gera extension/ui/{widget.js,widget.css}
```

Durante o desenvolvimento da UI, `npm run dev:ext` fica em watch. Não há HMR
(não existe dev server dentro de um content script) — o loop é: salvar →
"Recarregar" em `chrome://extensions` → F5 na aba.

Depois:

1. Abra o Chrome e vá em `chrome://extensions`.
2. Ligue **"Modo do desenvolvedor"** (canto superior direito).
3. Clique em **"Carregar sem compactação"**.
4. Selecione esta pasta (`extension/`).
5. Fixe o ícone do Zyrex na barra do Chrome (clique no botão de puzzle e no alfinete).

Pronto — o widget está disponível em qualquer aba.

### UI nova (React) — completa, atrás de flag

A interface React já é funcional ponta a ponta e convive com a atual (as duas
são mutuamente exclusivas por página). Para ligar a nova, no console de qualquer
página: `localStorage.zyrexNewUI = "1"` + F5. Para voltar à atual:
`localStorage.removeItem("zyrexNewUI")` + F5.

**Arquitetura.** Toda a lógica (player TTS, destaque, seleção, Modo Leitura,
histórico, preferências, mensagens do SW, fallback offscreen) mora num núcleo
headless JS puro em [`lib/widget-core.js`](lib/widget-core.js), carregado em
runtime e reutilizando `lib/zx-player.js` + `lib/highlight-engine.js` +
`lib/extract.js`. A UI React (`ui/`) só apresenta: assina o estado do core e
chama suas ações. O `content.js` cria o core e o injeta no `mountWidget({ core })`
— o bundle React nunca importa o core (por isso o vite não o vê). Na Fase 7,
quando a nova for a única, o `boot()` antigo e o `WIDGET_HTML` saem.

`npm run verify:ext` monta a UI nova em Chrome real com um core mock e mede
geometria (pílula 220×40, 6 slots), imunidade a `html{font-size:62.5%}`, fonte,
CSP restritiva e a renderização de todos os painéis. Ele NÃO exercita o núcleo
real (TTS/destaque/storage/SW) — isso só ao carregar sem compactação.

---

## Como usar

**Abrir o widget:** clique no ícone da extensão na barra. Ele fica flutuando no canto inferior direito.

**Ler um parágrafo:** passe o mouse sobre qualquer parágrafo — aparece um botão de play à esquerda. Clique.

**Ler uma seleção:**
- Selecione o texto.
- Vá até o widget e clique no play (botão ▶).
- **Ou** clique com o botão direito → **"Ler com Zyrex"** no menu de contexto.

**Enquanto está lendo:**
- As palavras são destacadas conforme o áudio toca.
- Botões ⟲10s / 10⟳ para voltar/avançar 10 segundos.
- Pause pausa o áudio; clique de novo para retomar.

**Salvar:** clique no marcador (verde quando tem itens). Máx 3 textos salvos. Modal abre com opção de tocar ou apagar cada um.

**Configurações** (engrenagem):
- Voz (5 vozes em português brasileiro)
- Velocidade
- Destacar palavras (toggle)
- Modo escuro (toggle)

**Fechar:** clique no X. Widget some. Para reabrir, clique no ícone da extensão.

**Arrastar:** use a barra fininha cinza no topo da pílula.

---

## Configuração

O backend TTS fica na Vercel usando Edge-TTS da Microsoft (grátis, sem chave de API). A URL default é:

```
https://dislexfy.com/api/tts
```

Se você deployar seu próprio backend, edite `content.js`:

```js
const API_URL = "https://SEU-DEPLOY.vercel.app/api/tts";
```

E atualize `manifest.json` em `host_permissions` se o domínio for diferente.

---

## Arquitetura

```
extension/
├── manifest.json      # MV3 manifest
├── background.js      # service worker: menu de contexto + toggle
├── content.js         # injeta widget em qualquer página (Shadow DOM)
├── highlight.css      # estilos injetados na página (::highlight do destaque)
├── widget.css         # estilos do widget, carregados dentro do Shadow DOM
├── icons/             # ícones 16/48/128
└── README.md
```

### Fluxo

1. **Content script** (`content.js`) é injetado em toda página em `document_idle`.
2. Ele constrói o widget no DOM (fica `hidden` inicialmente).
3. Instala listeners de mouse (para hover-play), seleção, teclado.
4. Escuta mensagens do service worker.
5. **Service worker** (`background.js`):
   - Cria item de menu de contexto "Ler com Zyrex" (contexto: `selection`).
   - No clique do ícone da extensão → manda `zyrex:toggle` pro content script.
   - No clique do menu de contexto → manda `zyrex:read-selection` com o texto.
6. Content script chama a API TTS via `fetch` (CORS aberto no backend).

### Isolamento

- O widget inteiro (pills, modais, botão de parágrafo e `<audio>`) vive num
  shadow root **fechado** do host `<zyrex-tts>` anexado ao `documentElement` —
  nenhum id `zx-*` fica no DOM da página e o CSS do site não alcança o widget.
- `widget.css` entra no shadow via `adoptedStyleSheets` (com `:host{all:initial}`);
  `highlight.css` continua injetado na página (o `::highlight` estiliza texto do site).
- JS numa IIFE, guard contra dupla injeção (`window.__ZYREX_INJECTED__`).
- Estado persiste em `chrome.storage.local` sob chave `zyrex_state_v2`.
- `z-index: 2147483000` no widget pra ficar sobre qualquer conteúdo.

---

## Compatibilidade

- Chrome 88+ (Manifest V3).
- Funciona em qualquer site que permita content scripts (não roda em `chrome://` nem na Web Store).
- Backend precisa aceitar CORS (o Edge-TTS da Vercel já aceita `*`).

---

## Empacotar pra publicação

Para submeter à Chrome Web Store:

1. Compacte a pasta `extension/` em ZIP (sem `README.md` opcionalmente).
2. Suba em [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Preencha screenshots, descrição, etc.

---

## Limitações atuais

- Vozes só em português brasileiro (Edge-TTS suporta mais idiomas, mas o UI está fixo em pt-BR).
- Chat e Ditar são placeholders (roadmap futuro).
- Limite de ~5000 caracteres por chamada de síntese (limite da API).

---

## Licença

MIT.
