# 🪐 Zeos WebBrowser

<div align="center">

![Zeos Logo](src/assets/zeos-logo.svg)

# ZEOS

**Navegador local-first, minimalista e inteligente.**

**Seu navegador não deveria apenas abrir páginas. Deveria ajudar você a manter o contexto.**

[![Version](https://img.shields.io/badge/version-1.0.0-69a865.svg?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-40.0.0-1B1C26.svg?style=flat-square\&logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?style=flat-square\&logo=nodedotjs)](https://nodejs.org/)
[![Local First](https://img.shields.io/badge/Architecture-Local--First-blue.svg?style=flat-square)]()
[![Telemetry](https://img.shields.io/badge/App%20Telemetry-Disabled-success.svg?style=flat-square)]()

[Visão](#-visão) • [Recursos](#-recursos) • [Privacidade](#-privacidade) • [Arquitetura](#-arquitetura) • [Instalação](#-instalação) • [Roadmap](#-roadmap)

</div>

---

# 🧠 Visão

O **Zeos WebBrowser** é um navegador desktop construído sobre Chromium e Electron, desenvolvido com uma ideia central:

> **A web é temporária. O contexto não deveria ser.**

Navegadores tradicionais são excelentes em abrir páginas, mas pouco ajudam o usuário a responder perguntas como:

* Onde eu vi aquela informação?
* Em qual aba estava aquela pesquisa?
* Quais páginas fazem parte deste projeto?
* O que eu estava fazendo ontem?
* Qual é a relação entre essas cinco páginas abertas?

O Zeos foi pensado para transformar a navegação em um ambiente mais organizado, privado e consciente de contexto.

Ele combina:

* Navegação baseada em Chromium;
* Interface minimalista;
* Workspaces;
* Gerenciamento inteligente de abas;
* Memória e histórico pesquisáveis localmente;
* Controle de recursos;
* Inteligência artificial opcional;
* Privacidade por padrão.

O objetivo não é substituir o Google Chrome em todos os cenários.

O objetivo é criar uma nova forma de trabalhar com a web.

---

# 🪐 Filosofia

## Local-First

O Zeos prioriza o processamento e o armazenamento local.

Dados como histórico, favoritos, workspaces e contexto de navegação permanecem sob controle do usuário.

Recursos de inteligência artificial podem funcionar localmente ou utilizar provedores externos apenas quando configurados pelo usuário.

---

## Contexto antes de quantidade

Uma aba isolada possui pouco significado.

Um conjunto de abas pode representar:

* Um projeto;
* Uma pesquisa;
* Uma tarefa;
* Uma viagem;
* Um cliente;
* Um estudo;
* Uma ideia.

O Zeos organiza a navegação em torno desses contextos.

---

## Minimalismo funcional

A interface deve desaparecer quando não for necessária.

A web é o conteúdo principal.

A interface do navegador existe apenas para fornecer controle.

```text
┌─────────────────────────────────────┐
│ ZEOS                     CPU  RAM   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│             WEB CONTENT             │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

A Zen UI permite expandir ou recolher elementos de navegação para reduzir distrações.

---

## Privacidade por padrão

O Zeos não utiliza servidores próprios para coletar ou sincronizar automaticamente dados de navegação.

A atividade do navegador permanece local, exceto quando o usuário:

* Acessa um site;
* Utiliza um mecanismo de busca;
* Instala uma extensão;
* Configura um serviço externo;
* Utiliza um provedor de IA externo.

O usuário deve saber claramente:

> **O que está acontecendo, onde os dados estão armazenados e quando algo sai do computador.**

---

# ✨ Recursos

## 🗂️ Gerenciamento Avançado de Abas

### Multi-abas fluido

Crie, feche, duplique e alterne entre abas rapidamente.

### Drag & Drop completo

* Reordene abas na mesma janela;
* Arraste abas para fora para criar novas janelas;
* Mova abas entre janelas;
* Preserve o estado da página quando possível;
* Feche automaticamente janelas que ficarem sem abas.

### Pinned Tabs

Fixe páginas importantes como abas compactas.

### Menu de contexto

Ações rápidas:

* Nova aba à direita;
* Duplicar;
* Fixar;
* Fechar;
* Fechar outras abas;
* Fechar abas à direita.

---

# 🧩 Workspaces

Workspaces permitem organizar a navegação por contexto.

Exemplo:

```text
ZEOS
│
├── 💼 Trabalho
│   ├── GitHub
│   ├── Supabase
│   ├── Documentação
│   └── Figma
│
├── 🧠 Projeto
│   ├── Pesquisa
│   ├── Painel
│ 
│   └── Desenvolvimento
│
└── 🎵 Pessoal
    ├── Música
    ├── YouTube
    └── Redes sociais
```

Cada workspace pode possuir:

* Abas;
* Histórico;
* Favoritos;
* Contexto;
* Configurações;
* Memória associada.

O objetivo é impedir que tudo vire uma única lista infinita de abas.

---

# ⚡ Gerenciamento Inteligente de Recursos

O Zeos monitora o consumo de recursos das páginas e utiliza políticas para reduzir desperdícios.

```text
Aba ativa
    ↓
Prioridade máxima

Aba recente
    ↓
Prioridade normal

Aba inativa
    ↓
Redução de prioridade

Aba antiga
    ↓
Congelamento

Aba esquecida
    ↓
Suspensão
```

O usuário pode visualizar informações como:

* Uso de CPU;
* Uso de memória RAM;
* Número de processos;
* Estado das abas;
* Abas suspensas.

O objetivo não é prometer que o Zeos consumirá menos memória que qualquer outro navegador.

O objetivo é fornecer **controle e gerenciamento inteligente sobre os recursos utilizados**.

---

# 🧠 Inteligência Artificial Opcional

O Zeos pode integrar recursos de IA sem transformar a IA em uma dependência obrigatória.

A inteligência artificial pode ser utilizada para:

### Resumir abas

> "Resuma as cinco abas abertas."

### Comparar páginas

> "Compare estes dois editais."

### Encontrar informações

> "Onde eu vi aquela informação sobre GPU?"

### Compreender um workspace

> "Explique o que estou pesquisando neste projeto."

### Recuperar contexto

> "O que eu estava fazendo ontem?"

A arquitetura prioriza modelos locais sempre que possível.

Provedores externos podem ser utilizados apenas mediante configuração explícita.

---

# 🔎 Histórico Inteligente

O histórico não precisa ser apenas uma lista de URLs.

O Zeos pode permitir buscas baseadas em contexto.

Exemplos:

> "A página que eu abri semana passada sobre GPU."

> "O edital que eu estava lendo ontem."

> "Aquela pesquisa sobre navegadores privados."

O sistema pode utilizar informações locais como:

* Título da página;
* URL;
* Data e horário;
* Texto relevante;
* Workspace;
* Tags;
* Contexto de navegação.

---

# 🔒 Privacidade

## Sem telemetria própria

O Zeos não possui como objetivo coletar dados de navegação para servidores próprios.

Não são enviados automaticamente para servidores do projeto:

* Histórico;
* Cliques;
* URLs;
* Métricas de uso;
* Dados pessoais;
* Conteúdo das páginas.

---

## Dados sob controle do usuário

O usuário pode gerenciar:

* Histórico;
* Cookies;
* Cache;
* Dados de sites;
* Downloads;
* Workspaces;
* Dados da IA local.

---

## Navegação privada

Atalho:

```text
Ctrl + Shift + N
```

Janelas privadas utilizam uma sessão isolada e temporária.

Dados temporários da sessão são descartados quando a sessão privada é encerrada, conforme o comportamento implementado pela arquitetura de sessão.

---

# ⚡ Produtividade

## Downloads

Atalho:

```text
Ctrl + J
```

Gerenciador integrado com:

* Progresso em tempo real;
* Acesso à pasta;
* Status dos downloads.

---

## Extensões

Suporte para extensões compatíveis com a arquitetura implementada pelo navegador, incluindo extensões descompactadas quando suportadas.

---

## Temas

Paletas visuais personalizáveis, incluindo:

* Orca;
* Alethe;
* Outros temas definidos pelo usuário.

---

## Favoritos

Gerenciamento simples de links importantes.

Favoritos podem futuramente ser associados a:

* Workspaces;
* Tags;
* Projetos.

---

# ⌨️ Atalhos

| Atalho                    | Ação                           |
| ------------------------- | ------------------------------ |
| `Ctrl + T`                | Abrir nova aba                 |
| `Ctrl + W`                | Fechar aba ativa               |
| `Ctrl + N`                | Abrir nova janela              |
| `Ctrl + Shift + N`        | Abrir janela privada           |
| `Ctrl + L`                | Focar Omnibox                  |
| `Shift`                   | Expandir ou recolher navegação |
| `Ctrl + Tab`              | Próxima aba                    |
| `Ctrl + Shift + Tab`      | Aba anterior                   |
| `Ctrl + 1` até `Ctrl + 9` | Selecionar aba                 |
| `Ctrl + J`                | Downloads                      |
| `Ctrl + H`                | Histórico                      |
| `Ctrl + ,`                | Configurações                  |
| `Ctrl + D`                | Favoritos                      |
| `F5`                      | Recarregar                     |
| `Ctrl + R`                | Recarregar                     |
| `Ctrl + Shift + R`        | Recarregar ignorando cache     |
| `Alt + ←`                 | Voltar                         |
| `Alt + →`                 | Avançar                        |
| `Ctrl + +`                | Aumentar zoom                  |
| `Ctrl + -`                | Diminuir zoom                  |
| `Ctrl + 0`                | Redefinir zoom                 |
| `F12`                     | DevTools                       |

---

# 🏗️ Arquitetura

```text
                           ZEOS
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
      Browser             Context               AI
        │                    │                    │
    Chromium           Workspaces          Local Models
        │                    │                    │
    Electron           History              External AI
        │                    │                 Optional
        └────────────────────┼────────────────────┘
                             │
                        Local Storage
```

Estrutura atual:

```text
Zeos WebBrowser/
│
├── src/
│   ├── assets/              # Logos e recursos visuais
│   ├── favorites/           # Gerenciador de favoritos
│   ├── settings/            # Configurações
│   ├── ui/                  # Interface principal
│   │   ├── app.css
│   │   ├── app.js
│   │   └── index.html
│   │
│   ├── main.js              # Processo principal
│   ├── navigation.js        # Navegação e buscas
│   ├── preload.js           # Bridge segura
│   ├── settings-preload.js
│   └── themes.js
│
├── test/
├── package.json
├── Zeos.vbs
└── README.md
```

---

# 🚀 Instalação

## Pré-requisitos

* Node.js 18 ou superior;
* Git.

## Clonar

```bash
git clone https://github.com/seu-usuario/zeos-webbrowser.git
cd zeos-webbrowser
```

## Instalar dependências

```bash
npm install
```

## Executar

```bash
npm start
```

## Executar testes

```bash
npm test
```

---

# 🗺️ Roadmap

## v1.0 — Fundação

* [x] Navegação multi-abas;
* [x] Drag & drop;
* [x] Tear-off;
* [x] Janelas privadas;
* [x] Favoritos;
* [x] Histórico;
* [x] Downloads;
* [x] Métricas de recursos;
* [x] Temas.

## Próxima fase — Contexto

* [ ] Workspaces;
* [ ] Histórico por workspace;
* [ ] Tags;
* [ ] Busca contextual;
* [ ] Recuperação de sessões;
* [ ] Suspensão inteligente de abas.

## Futuro — Inteligência

* [ ] IA local opcional;
* [ ] Resumo de abas;
* [ ] Comparação de páginas;
* [ ] Busca semântica local;
* [ ] Memória contextual;
* [ ] Integração opcional com provedores externos.

---

# 🤝 Contribuindo

Contribuições são bem-vindas.

```bash
git checkout -b feature/minha-feature
git commit -m "feat: adiciona nova funcionalidade"
npm test
git push origin feature/minha-feature
```

Depois, abra um Pull Request.

---

# 📄 Licença

Este projeto está sob a licença **MIT**.

Consulte o arquivo [LICENSE](LICENSE) para mais informações.

---

<div align="center">

### 🪐 ZEOS

**A web abre páginas.
O Zeos mantém o contexto.**

</div>
