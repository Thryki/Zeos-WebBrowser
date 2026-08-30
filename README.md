# Refatoração estratégica do Zeos WebBrowser

Você está trabalhando no projeto **Zeos WebBrowser**, um navegador desktop construído com **Electron + Chromium**.

Antes de alterar qualquer código, analise completamente a arquitetura atual do projeto, incluindo:

* `src/main.js`
* `src/navigation.js`
* `src/preload.js`
* `src/settings-preload.js`
* `src/themes.js`
* `src/ui/index.html`
* `src/ui/app.js`
* `src/ui/app.css`
* `src/favorites/`
* `src/settings/`
* `test/`
* `package.json`

## Objetivo estratégico

O Zeos não deve mais ser posicionado apenas como um navegador minimalista e privado.

A nova direção do produto é:

> **Um navegador local-first, minimalista e inteligente, projetado para manter o contexto de trabalho do usuário.**

O Chromium continua sendo a base de navegação.

O diferencial do Zeos deve ser construído em cima de quatro pilares:

1. **Workspaces**
2. **Gerenciamento inteligente de abas e recursos**
3. **Histórico e contexto pesquisáveis**
4. **IA local opcional**

Não reescreva funcionalidades existentes que já funcionam. Preserve compatibilidade e implemente a nova arquitetura de forma incremental.

---

# FASE 1 — Auditoria

Primeiro, produza uma análise interna da arquitetura atual.

Identifique:

* Como as janelas são gerenciadas;
* Como as abas são representadas;
* Como `WebContentsView` é utilizado;
* Como ocorre a comunicação IPC;
* Como favoritos e histórico são persistidos;
* Como funciona a sessão privada;
* Como downloads são controlados;
* Como temas são aplicados;
* Quais dados já possuem persistência local.

Depois disso, defina os pontos mínimos de alteração necessários.

Não altere o projeto inteiro sem necessidade.

---

# FASE 2 — Criar a base de Workspaces

Implemente um sistema de Workspaces.

Cada workspace deve possuir:

```text
Workspace
├── id
├── name
├── icon
├── createdAt
├── updatedAt
├── tabs
├── activeTabId
├── history
└── metadata
```

Inicialmente, a persistência deve ser local.

Requisitos:

* Criar workspace;
* Renomear;
* Alterar ícone;
* Excluir;
* Alternar entre workspaces;
* Associar abas a um workspace;
* Restaurar o último estado quando aplicável.

A mudança de workspace deve preservar o estado das abas sempre que tecnicamente possível.

Não recarregue páginas desnecessariamente.

---

# FASE 3 — Estados de abas

Cada aba deve possuir uma estrutura semelhante a:

```text
Tab
├── id
├── workspaceId
├── title
├── url
├── favicon
├── createdAt
├── lastActiveAt
├── state
└── resourceMetrics
```

Os estados possíveis devem incluir:

```text
active
background
inactive
frozen
suspended
```

Crie uma arquitetura preparada para políticas futuras de gerenciamento de recursos.

Ainda não implemente algoritmos agressivos de suspensão sem garantir estabilidade.

Priorize primeiro uma base observável e reversível.

---

# FASE 4 — Monitoramento de recursos

Melhore o sistema atual de métricas.

O objetivo é permitir visualizar:

* CPU;
* Memória RAM;
* Processos relevantes;
* Consumo por aba, quando tecnicamente disponível.

As métricas devem ser tratadas como observabilidade.

Não faça promessas artificiais de redução de consumo.

A interface deve permitir identificar facilmente quais abas estão consumindo mais recursos.

---

# FASE 5 — Histórico contextual

Prepare uma nova camada de histórico local.

Além da URL, a arquitetura deve suportar:

```text
HistoryEntry
├── id
├── url
├── title
├── workspaceId
├── visitedAt
├── lastVisitedAt
├── visitCount
├── tags
└── searchableText
```

A busca futura deve permitir consultas como:

> "A página sobre GPU que abri semana passada."

> "O edital que eu estava lendo ontem."

Neste momento, não é obrigatório implementar busca semântica completa.

Primeiro, crie uma arquitetura local capaz de suportá-la posteriormente.

---

# FASE 6 — Camada de IA

Crie uma abstração de provedores de IA.

A arquitetura deve separar completamente:

```text
AI Provider Interface
        │
        ├── Local Provider
        │
        └── External Provider
```

O navegador deve funcionar perfeitamente sem IA.

A IA deve ser opcional.

Nenhuma chave de API deve ser obrigatória.

Priorize suporte futuro para modelos locais.

Não implemente chamadas automáticas para serviços externos.

Toda comunicação externa relacionada à IA deve exigir configuração explícita do usuário.

---

# FASE 7 — Segurança

Revise toda a comunicação entre:

```text
Renderer
   ↕
Preload
   ↕
Main Process
```

Garanta:

* `contextIsolation` habilitado;
* APIs expostas explicitamente;
* Nenhum acesso Node.js desnecessário no Renderer;
* Validação de argumentos IPC;
* Nenhuma API perigosa exposta diretamente à interface web;
* Isolamento adequado de conteúdo externo.

Não use `eval`.

Não exponha `ipcRenderer` diretamente.

---

# FASE 8 — Interface

Atualize a interface sem abandonar a identidade visual atual.

A nova navegação deve introduzir gradualmente:

```text
┌──────────────────────────────────────────────┐
│ 🪐 ZEOS       Workspace       CPU     RAM    │
├──────────────────────────────────────────────┤
│ [Workspace] [Tabs] [Nova aba]               │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│                 WEB CONTENT                  │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

A interface deve continuar:

* Minimalista;
* Rápida;
* Escura;
* Sem elementos desnecessários;
* Compatível com a Zen UI.

Não transforme o navegador em um dashboard.

O conteúdo da web continua sendo o elemento principal.

---

# FASE 9 — Implementação incremental

Implemente na seguinte ordem:

1. Auditoria da arquitetura atual;
2. Modelo de dados de Workspace;
3. Persistência local;
4. Associação de abas;
5. Interface básica de workspaces;
6. Estados das abas;
7. Métricas por aba;
8. Histórico contextual;
9. Abstração de IA;
10. Testes.

Após cada fase:

* Execute os testes existentes;
* Adicione testes para novas funcionalidades;
* Não remova testes existentes;
* Corrija regressões antes de continuar.

---

# REGRAS IMPORTANTES

* Não reescreva o navegador inteiro;
* Preserve funcionalidades existentes;
* Não altere comportamento estável sem necessidade;
* Não introduza dependências pesadas sem justificativa;
* Prefira soluções nativas do Electron e Node.js;
* Priorize armazenamento local;
* Nenhum dado deve ser enviado automaticamente para servidores externos;
* Não faça chamadas de IA automaticamente;
* Não armazene conteúdo sensível sem necessidade;
* Toda mudança deve ser reversível e testável.

## Resultado esperado

Ao final, o Zeos deve continuar funcionando como navegador, mas sua arquitetura deve estar preparada para evoluir de:

> **Navegador minimalista**

para:

> **Sistema local-first de navegação, contexto e produtividade.**

A implementação deve preservar a estabilidade do navegador acima da velocidade de desenvolvimento.

