# Zeos — Roadmap

Este documento registra a visão futura do ecossistema Zeos e o papel do
WebBrowser dentro dele. **Nada descrito aqui está implementado nesta release**
— é fronteira documentada, não funcionalidade.

## Arquitetura em camadas

```
                 Zeos — sistema maior
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Agents        Memory       Orchestration
          │             │             │
          └─────────────┼─────────────┘
                        │  (LLM · Chat · MCP · Automações)
                        ▼
                Zeos WebBrowser  ← este repositório
                        │
              ┌─────────┼─────────┐
              │         │         │
            Tabs      Pages    Extensions
                  (+ fundação de Workspaces)
```

**Princípio:** o WebBrowser é infraestrutura de navegação — robusta,
previsível, modular e reutilizável. Agentes, memória, orquestração, chat e
MCP pertencem à camada superior do Zeos, que **consome** as capacidades do
navegador. O navegador nunca absorve essas responsabilidades.

## Capacidades que o WebBrowser exporá (fronteira futura)

As APIs internas da classe `Browser` (src/main.js) já cobrem o essencial e
serão a base de uma superfície de controle estável:

| Capacidade futura | Base já existente |
| :--- | :--- |
| Listar/criar/fechar/selecionar abas | `stateFor`, `createWebTab`, `closeTab`, `selectTab` |
| Navegar com normalização de URL/busca | `navigate` + `src/navigation.js` |
| Ler conteúdo da página | `webContents.executeJavaScript` |
| Capturar screenshot | `webContents.capturePage` |
| Histórico de navegação | `webContents.navigationHistory` |

Nenhuma dessas interfaces é exposta externamente hoje. Quando forem, a
exposição acontecerá por uma camada de ferramentas única com permissão por
ação (ver abaixo), nunca por acesso direto.

## Visão: integração LLM (camada Zeos)

- **Chat lateral** no navegador, conversando com o modelo escolhido.
- **Provedores**: chave de API própria (Anthropic, OpenAI, …) via `fetch`
  puro, com chaves criptografadas por `safeStorage`; **modelos locais** por
  detecção de Ollama primeiro (zero dependências) e `node-llama-cpp` como
  opt-in posterior com download sob demanda — nunca embutido no instalador.
- **Controle do navegador pela LLM**: somente através da camada de
  ferramentas com política por ferramenta `deny | ask | allow` (leitura
  liberada, mutação confirmada), escopos separados para chat interno vs
  cliente externo, log de atividade visível e gating independente de quem
  pediu (mitigação de prompt injection).

## Visão: servidor MCP (camada Zeos)

- Transporte **Streamable HTTP em 127.0.0.1** (porta configurável),
  desligado por padrão, bearer token gerado no primeiro uso e validação de
  Origin/Host (anti DNS-rebinding).
- Permite que agentes externos (ex.: Claude Code) usem o navegador:
  `claude mcp add --transport http zeos http://127.0.0.1:<porta>/mcp`.
- Fases: (1) ferramentas read-only → (2) ferramentas de input + chat →
  (3) modelos locais → (4) hardening e log de auditoria.

## Visão: Agent Workspaces

Inspirado no conceito do [alethe-agents](https://github.com/Kc1t/alethe-agents):
workspaces que agrupam abas **e** um contexto de agente (sessão de chat,
permissões, projeto), com sessões persistentes e handoff de contexto.

A fundação já existe neste repositório: backend de workspaces
(`workspaces.json`, handlers IPC `workspaces:*` em src/main.js) com os
invariantes que qualquer evolução deve preservar:

- `Tab.workspaceId` é a fonte de verdade da associação aba → workspace.
- Trocar de workspace não move abas.
- Excluir um workspace não apaga abas.
- Restaurar sessão não duplica nem perde abas.

Próximo passo natural (ainda no navegador, sem agentes): um seletor de
workspaces na UI. Os passos com agentes pertencem à camada Zeos.

## Backlog técnico do WebBrowser

- Migrar `session.getAllExtensions` → `session.extensions.getAllExtensions`
  (deprecação anunciada no Electron 40).
- Página de Favoritos real (hoje é placeholder).
- Métricas de CPU/RAM por aba (canal `tab:set-metrics` existe e está ocioso).
- Testes de workspaces importando a lógica real (hoje documentam a
  especificação sem importar src/).
- Despacho de comandos de teclado e menus de contexto de extensões
  (`__zeos_trigger_command` / `__zeos_trigger_context_menu`).
- Assinatura de código (Windows/macOS) quando houver certificados.
- Auto-update via electron-updater (a infraestrutura de publish já gera
  os metadados `latest*.yml`).
