# 🪐 Zeos WebBrowser

<div align="center">

<img src="src/assets/zeos-logo-512.png" width="140" alt="Zeos Logo">

**Navegador Web Desktop Ultraleve, Fluido e 100% Livre de Rastreadores**

[![Version](https://img.shields.io/badge/version-1.1.0-22c55e.svg?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-40.x-1B1C26.svg?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933.svg?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Trackers](https://img.shields.io/badge/Trackers-0%20(Zero)-success.svg?style=flat-square)]()
[![Telemetry](https://img.shields.io/badge/Telemetry-Disabled-blue.svg?style=flat-square)]()

[Recursos](#-recursos) • [Filosofia](#-filosofia--privacidade) • [Atalhos](#-atalhos-de-teclado) • [Instalação](#-instalação-e-uso) • [Arquitetura](#-arquitetura-do-projeto) • [Licença](#-licença)

</div>

---

## 📖 Visão Geral

O **Zeos WebBrowser** é um navegador desktop desenvolvido para quem valoriza **privacidade absoluta**, **minimalismo** e **alto desempenho**. Construído com Chromium e Electron, o Zeos elimina todo o inchaço (*bloatware*), telemetrias ocultas e recursos desnecessários presentes nos navegadores tradicionais, entregando uma experiência de navegação direta, rápida e com consumo otimizado de memória RAM e processamento.

---

## 🛡️ Filosofia & Privacidade

- **Zero Telemetria e Rastreadores:** O Zeos não coleta nenhum dado de navegação, cliques, histórico ou métricas para servidores remotos. Toda a sua atividade fica estritamente na sua máquina.
- **Interface Ultra Enxuta (Zen UI):** O conteúdo da web é o foco total. A barra de endereços e navegação pode ser recolhida ou expandida dinamicamente para aproveitar 100% da sua tela.
- **Consumo Mínimo de Recursos:** Gerenciamento eficiente de processos de abas (WebContentsView) com monitoramento visual em tempo real do uso de CPU e memória RAM consumida pelo navegador.
- **Mecanismos de Busca Privados por Padrão:** Integração nativa com provedores de busca focados em privacidade (DuckDuckGo, Brave Search, Ecosia, entre outros).

---

## ✨ Recursos

### 🗂️ Gerenciamento Avançado de Abas
- **Multi-abas fluido:** Crie, feche, duplique e alterne abas instantaneamente.
- **Arrastar e Soltar Completo (*Drag & Drop*):**
  - Reordene abas na mesma janela com indicador de posição.
  - Puxe abas para fora para criar uma nova janela (*tear-off* — a página é recarregada na nova janela).
  - **Mova abas entre janelas diferentes:** Arraste uma aba de uma janela para outra mantendo o estado da página sem recarregar. Se a janela de origem ficar sem abas, ela é fechada automaticamente.
- **Fixar Abas (*Pinned Tabs*):** Fixe suas abas mais usadas como ícones compactos na barra.
- **Fechamento Inteligente:** Fechar a última aba fecha a janela correspondente (igual ao Google Chrome).
- **Menu de Contexto de Abas:** Opções rápidas para *Nova aba à direita*, *Duplicar*, *Fixar*, *Fechar outras abas* e *Fechar abas à direita*.

### 🔒 Privacidade & Segurança
- **Modo Anônimo / Janela Privada (Ctrl + Shift + N):** Cria janelas isoladas com partição de memória temporária e sem armazenamento de histórico ou cookies em disco.
- **Gerenciamento de Dados Locais:** Limpeza fácil de cookies, cache e histórico por período (última hora, 24 horas, 7 dias, 30 dias ou todo o período).
- **Favicons sem serviços externos:** Os ícones dos sites vêm exclusivamente das próprias páginas — nenhum domínio visitado é enviado a serviços de terceiros.

### ⚡ Produtividade & Utilidades
- **Painel de Downloads Integrado (Ctrl + J):** Gerenciador de downloads com anel de progresso em tempo real e acesso direto à pasta de arquivos.
- **Gerenciador Completo de Extensões (zeos://extensions ou Ctrl + Shift + E):**
  - Interface inspirada no Google Chrome com pesquisa em tempo real, alternador de Modo de Desenvolvedor e cards detalhados.
  - Carregamento de extensões descompactadas (*Manifest V2* e *Manifest V3*).
  - Inspeção direta de Service Workers / Background Pages com DevTools em 1 clique.
  - Ativar/Desativar extensões com alternadores persistentes e recarregamento individual ou global.
  - Ferramenta integrada de empacotamento de extensões em `.zip`.
  - Visualização de atalhos e comandos de teclado configurados.
- **Métricas do Sistema em Tempo Real:** Visualização do uso de CPU (%) e memória RAM (MB) do navegador diretamente no cabeçalho.
- **Personalização Visual e Temas:** 16 paletas de cores (*Orca*, *Dracula*, *Nord*, *Tokyo Night*, etc.), ajuste de zoom global persistente e escolha de fontes monoespaçadas modernas.
- **Histórico:** Página dedicada com busca e filtros por período. (A página de Favoritos ainda está em desenvolvimento.)

---

## ⌨️ Atalhos de Teclado

> No macOS, use **Cmd** no lugar de **Ctrl** (DevTools: **Cmd + Opt + I**).

| Atalho | Ação |
| :--- | :--- |
| Ctrl + T | Abrir nova aba |
| Ctrl + W | Fechar aba ativa (ou clique com botão do meio do mouse) |
| Ctrl + N | Abrir nova janela |
| Ctrl + Shift + N | Abrir nova janela privada (anônima) |
| Ctrl + L | Focar na barra de endereços (Omnibox) |
| Shift | Alternar exibição da barra de navegação (expandir/recolher) |
| Ctrl + Tab / Ctrl + Shift + Tab | Alternar para a próxima / anterior aba |
| Ctrl + 1 até Ctrl + 9 | Selecionar aba pelo número de posição |
| Ctrl + J | Abrir / fechar painel de downloads |
| Ctrl + Shift + E | Abrir Gerenciador de Extensões (`zeos://extensions`) |
| Ctrl + H ou Ctrl + , | Abrir Configurações |
| Ctrl + D ou Ctrl + B | Abrir Favoritos |
| F5 / Ctrl + R | Recarregar página |
| Ctrl + F5 / Ctrl + Shift + R | Recarregar ignorando cache |
| Alt + ← / Alt + → | Voltar / Avançar no histórico |
| Ctrl + + / Ctrl + - / Ctrl + 0 | Aumentar zoom / Diminuir zoom / Redefinir zoom (100%) |
| F12 / Ctrl + Shift + I | Abrir Ferramentas do Desenvolvedor (DevTools) |

---

## 📦 Downloads (Binários Prontos)

Baixe a versão mais recente na página de [**Releases**](https://github.com/Thryki/Zeos-WebBrowser/releases):

| Plataforma | Arquivo |
| :--- | :--- |
| Windows (instalador) | `Zeos Setup x.y.z.exe` |
| Windows (portátil, sem instalação) | `Zeos x.y.z.exe` |
| macOS (Apple Silicon) | `Zeos-x.y.z-arm64.dmg` |
| macOS (Intel) | `Zeos-x.y.z.dmg` |
| Linux | `Zeos-x.y.z.AppImage` |

> **⚠️ Builds não assinadas:**
> - **Windows:** o SmartScreen pode alertar "aplicativo não reconhecido" — clique em **Mais informações → Executar assim mesmo**.
> - **macOS:** o Gatekeeper pode dizer que o app "está danificado" ou é de "desenvolvedor não identificado". Na primeira abertura use **clique-direito → Abrir → Abrir**, ou remova a quarentena com:
>   ```bash
>   xattr -cr /Applications/Zeos.app
>   ```

---

## 🚀 Instalação e Uso (a partir do código)

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 22 ou superior.
- [Git](https://git-scm.com/) instalado no sistema.

### 1. Clonar o Repositório
```bash
git clone https://github.com/Thryki/Zeos-WebBrowser.git
cd Zeos-WebBrowser
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar o Navegador

- **Modo Desenvolvimento:**
  ```bash
  npm start
  ```

- **No Windows sem terminal (Background Launcher):**
  Dê um duplo clique no arquivo Zeos.vbs ou execute start.bat.

### 4. Executar Testes Automatizados
```bash
npm test
```

### 5. Gerar Builds (empacotamento)
```bash
npm run dist:win    # Windows: instalador NSIS + portátil
npm run dist:mac    # macOS: DMG + ZIP (requer macOS)
npm run dist:linux  # Linux: AppImage
```
Os artefatos são gerados em `dist/`. As builds de macOS são produzidas pelo CI
(GitHub Actions) a cada tag `v*`, junto com as de Windows e Linux.

---

## 🏗️ Arquitetura do Projeto

```
Zeos WebBrowser/
├── src/
│   ├── assets/              # Logotipos e ícones visuais
│   ├── extensions/          # Gerenciador avançado de extensões (zeos://extensions)
│   │   ├── extensions.css   # Estilização do painel de extensões
│   │   ├── extensions.js    # Lógica de cards, busca, dev mode e packing
│   │   └── index.html       # Estrutura base da página de extensões
│   ├── favorites/           # Interface interna do gerenciador de favoritos
│   ├── settings/            # Interface interna de configurações e histórico
│   ├── ui/                  # Interface gráfica minimalista (HTML, CSS e JS)
│   │   ├── app.css          # Estilização moderna e temas da interface
│   │   ├── app.js           # Lógica do frontend e eventos de abas / drag & drop
│   │   └── index.html       # Estrutura base do cabeçalho e janelas
│   ├── extension-utils.js   # Lógica pura de extensões (zip, crc32, guardas) testável sem Electron
│   ├── main.js              # Processo principal Electron (janelas, WebContentsViews, IPC)
│   ├── navigation.js        # Parser inteligente de URLs e motores de busca
│   ├── preload.js           # Bridge segura entre Main Process e Renderer (Context Isolation)
│   ├── settings-preload.js  # Bridge para páginas especiais internas
│   └── themes.js            # Definições de paletas e temas visuais
├── test/                    # Testes unitários com Node Test Runner
├── build/                   # Ícones e recursos de empacotamento (electron-builder)
├── docs/                    # Documentação de release e baseline
├── .github/workflows/       # CI (testes) e Release (builds multiplataforma)
├── ROADMAP.md               # Visão futura (Zeos, LLM/MCP, agent workspaces)
├── package.json             # Metadados, dependências e configuração de build
├── Zeos.vbs                 # Inicializador silencioso para Windows
├── start.bat                # Inicializador via terminal para Windows
└── README.md                # Documentação oficial do projeto
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Se você deseja contribuir:

1. Faça um **Fork** do projeto.
2. Crie uma branch para sua funcionalidade: git checkout -b feature/minha-feature.
3. Faça commit das alterações: git commit -m 'feat: adiciona nova funcionalidade'.
4. Execute os testes para garantir a integridade: `npm test`.
5. Faça push para a sua branch: git push origin feature/minha-feature.
6. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.
