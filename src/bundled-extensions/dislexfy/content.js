/**
 * Dislexfy — content script
 *
 * Faz UMA coisa: injeta o host <zyrex-tts> com shadow root fechado e monta o
 * widget (núcleo headless + UI React) dentro dele. Toda a lógica mora em
 * lib/widget-core.js; toda a apresentação, no bundle ui/widget.js. Este
 * arquivo é de propósito o menor elo da corrente — ele roda em TODA página
 * que o usuário visita, então cada linha aqui é superfície de ataque e custo
 * de memória multiplicados pelo número de abas.
 *
 * História: até jul/2026 este arquivo tinha ~2400 linhas — a UI "clássica"
 * inteira (WIDGET_HTML + boot()) convivia com a React atrás do escape hatch
 * localStorage.zyrexClassicUI. A Fase 7 removeu a clássica: a React é a única
 * UI, verificada pelos harnesses (npm run verify:all). Se precisar arqueologia,
 * o git guarda tudo.
 */

(function () {
  if (window.__ZYREX_INJECTED__) return;
  window.__ZYREX_INJECTED__ = true;

  /**
   * Carrega, em paralelo, o NÚCLEO headless (lib/widget-core.js, JS puro) e o
   * bundle React (ui/widget.js): o core é criado aqui e injetado no
   * mountWidget — o bundle React nunca importa o core (o vite nunca o vê).
   * Lazy de verdade: páginas em que o widget nunca abre pagam só este arquivo.
   */
  async function mountNewUi(targetHost, targetShadow) {
    const [{ createWidgetCore }, { mountWidget }, cssText] = await Promise.all([
      import(chrome.runtime.getURL("lib/widget-core.js")),
      import(chrome.runtime.getURL("ui/widget.js")),
      fetch(chrome.runtime.getURL("ui/widget.css")).then((r) => r.text()),
    ]);
    const core = await createWidgetCore({
      shadow: targetShadow,
      host: targetHost,
      doc: document,
      win: window,
    });
    return mountWidget({
      shadow: targetShadow,
      cssText,
      core,
      // Assets grandes moram fora do bundle (WAR): a URL chrome-extension:// é
      // isenta da CSP da página, então carregam em qualquer site. A página de
      // auth PRECISA ser chrome-extension:// — o formulário de senha vive numa
      // origem que o site visitado não alcança.
      assets: {
        proHeader: chrome.runtime.getURL("img/pro-header.png"),
        authPage: chrome.runtime.getURL("auth/auth.html"),
        // O bundle React não enxerga chrome.*; a versão vem daqui pro rodapé
        // das Configurações.
        version: (chrome.runtime.getManifest() || {}).version || "",
      },
    });
  }

  function inject() {
    // documentElement sempre existe em document_idle (diferente do body).
    if (!document.documentElement) return;
    // Host único com shadow FECHADO: os estilos da página não alcançam o
    // widget, os do widget não vazam, e a página não enxerga a árvore interna.
    const host = document.createElement("zyrex-tts");
    const shadow = host.attachShadow({ mode: "closed" });
    document.documentElement.appendChild(host);
    mountNewUi(host, shadow).catch((err) => {
      console.error("[Dislexfy] Falha ao montar o widget:", err);
    });
  }

  inject();
})();
