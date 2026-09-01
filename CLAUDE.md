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
`sourcePath` em alvo de deleção.

Segurança: conteúdo remoto é não confiável e nunca recebe Node; não
desabilitar `contextIsolation`/`sandbox` para "resolver" bugs; IPC
privilegiado valida entrada; navegação iniciada por conteúdo web só resulta
em http/https (nunca `file:`, `zeos:`, `chrome:`, `data:`, `blob:`); páginas
internas privilegiadas só são alcançáveis por ação do usuário.

## Documentos

- `ROADMAP.md` — visão futura (camada Zeos, LLM/MCP, agent workspaces).
- `docs/release/v1.1.0-baseline.md` — estado medido antes da estabilização.
