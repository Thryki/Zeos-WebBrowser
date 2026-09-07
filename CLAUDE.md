# Zeos WebBrowser — Guia Operacional

## Identidade arquitetural

O WebBrowser é UM COMPONENTE do sistema Zeos maior (que futuramente terá Agents,
Memory, Orchestration, MCP, LLM). Este repositório fornece infraestrutura de
navegação: Tabs, Pages, Navigation, Extensions e a fundação de Workspaces.
NÃO implementar aqui agentes, chat, MCP operacional ou orquestração — ver ROADMAP.md.

## Arquitetura (resumo)

- `src/main.js` — todo o processo principal: classe `Browser` (uma por janela),
  uma `WebContentsView` para o chrome (`src/ui/`) + uma por aba, sessões
  (janelas privadas usam partition `temp:` em memória), extensões
  (`session.defaultSession.loadExtension` de cópia em tmpdir com polyfill
  injetado), downloads, workspaces (backend), IPC.
- `src/preload.js` → `window.zeos` (chrome). `src/settings-preload.js` →
  `window.zeosSettings`/`window.zeosExtensions` (páginas internas).
- Páginas internas: `src/settings/`, `src/extensions/`, `src/favorites/` (stub).
- Lógica pura testável sem Electron: `src/navigation.js`, `src/themes.js`.
- Testes: `node --test` (exige Node ≥ 22 pelo glob).

## Comandos

- `npm start` — roda o app. `npm run check` — syntax check. `npm test` — testes.

## Invariantes — não negociáveis

Workspaces: `Tab.workspaceId` é a fonte de verdade; switch não move tabs;
excluir workspace não apaga tabs; restauração não duplica nem perde tabs.

Extensões: `sourcePath` (pasta do usuário) NUNCA pode ser apagado; só o
runner em tmpdir pertence ao app; falha de preparação nunca transforma
`sourcePath` em alvo de deleção. Exceção única: pastas que o próprio Zeos
criou em `userData/Extensions/<id>/<versão>_0` ao instalar da Chrome Web
Store (`isStoreExtensionPath`, que falha fechado) — essas vão embora junto
com a extensão. O `loadExtension` que a biblioteca chama é redirecionado
(`redirectStoreLoads`) para `adoptStoreExtension`, que carrega pelo runner e
registra a pasta em `settings.extensions`. Toda instalação passa por
`confirmStoreInstall`; antes do diálogo a biblioteca busca só o ícone que a
página da loja indica, e o `.crx` só é baixado de `clients2.google.com`
depois do sim. A biblioteca checa origem com `startsWith` sem âncora: por
isso nenhuma navegação a um host que só *começa* como a loja é permitida
na sessão padrão, e a desinstalação pedida pela loja é respondida pelo
Zeos (`uninstallFromStore`), nunca pelo handler dela.

Ciclo de vida: toda `BrowserWindow` oculta criada como infraestrutura (pontes
de extensão, inspetores) conta para `window-all-closed`. Se sobreviver à última
janela real, o processo fica vivo sem UI segurando o lock de instância única e
o próximo start morre calado — destrua-as quando `browsers` esvaziar.

Segurança: conteúdo remoto é não confiável e nunca recebe Node; não
desabilitar `contextIsolation`/`sandbox` para "resolver" bugs; IPC
privilegiado valida entrada; navegação iniciada por conteúdo web só resulta
em http/https (nunca `file:`, `zeos:`, `chrome:`, `data:`, `blob:`); páginas
internas privilegiadas só são alcançáveis por ação do usuário.

## Documentos

- `ROADMAP.md` — visão futura (camada Zeos, LLM/MCP, agent workspaces).
- `docs/release/v1.1.0-baseline.md` — estado medido antes da estabilização.
