# Licenças dos assets vendorizados — extension/fonts/

Fontes baixadas em 2026-07-02 via CDN do Fontsource (jsDelivr). Todas sob licenças livres.

## Fontes

| Arquivo | Fonte | Peso | Subset | Versão / Origem | Licença |
|---|---|---|---|---|---|
| `atkinson-400.woff2` | Atkinson Hyperlegible | 400 (regular) | latin | `@fontsource/atkinson-hyperlegible@5.2.8` — https://cdn.jsdelivr.net/fontsource/fonts/atkinson-hyperlegible@latest/latin-400-normal.woff2 | SIL OFL 1.1 |
| `atkinson-700.woff2` | Atkinson Hyperlegible | 700 (bold) | latin | `@fontsource/atkinson-hyperlegible@5.2.8` — https://cdn.jsdelivr.net/fontsource/fonts/atkinson-hyperlegible@latest/latin-700-normal.woff2 | SIL OFL 1.1 |
| `opendyslexic-400.woff2` | OpenDyslexic | 400 (regular) | latin (fonte completa, ver nota) | `@fontsource/opendyslexic@5.2.5` — https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff2 | SIL OFL 1.1 (bases derivadas de Bitstream Vera) |
| `lexend-400.woff2` | Lexend | 400 (regular) | latin | `@fontsource/lexend@5.2.11` — https://cdn.jsdelivr.net/fontsource/fonts/lexend@latest/latin-400-normal.woff2 | SIL OFL 1.1 |

- **Atkinson Hyperlegible** — Braille Institute of America. Upstream: https://github.com/googlefonts/atkinson-hyperlegible (Google Fonts v12). Licença: SIL Open Font License 1.1.
- **OpenDyslexic** — Abbie Gonzalez. Upstream: https://github.com/antijingoist/opendyslexic (v0.910.12). Licença: SIL Open Font License 1.1; as formas-base derivam de Bitstream Vera (Bitstream Vera license).
- **Lexend** — Bonnie Shaver-Troup / Thomas Jockin et al. Upstream: https://github.com/googlefonts/lexend (Google Fonts v26). Licença: SIL Open Font License 1.1.

Nota: o ID correto do OpenDyslexic no Fontsource é `opendyslexic` (sem hífen); a URL com `open-dyslexic` retorna 404.

## Cobertura pt-BR (subset latin)

Subset baixado: **latin** para todas as fontes, verificado via API do Fontsource (`https://api.fontsource.org/v1/fonts/<id>` → campo `subsets`).

- Atkinson Hyperlegible e Lexend: unicode-range do subset latin = `U+0000-00FF, U+0131, U+0152-0153, ...` — inclui todo o bloco Latin-1 Supplement (U+00C0–U+00FF), que cobre **à á â ã ç é ê í ó ô õ ú ü** (maiúsculas e minúsculas). Acentos do português totalmente cobertos.
- OpenDyslexic: o Fontsource publica um único subset `latin` que é a fonte completa (o CSS do pacote não declara `unicode-range`, ou seja, o arquivo se aplica a todos os codepoints); cobre Latin-1 Supplement e portanto os acentos do português.

## Validação dos arquivos

Cada `.woff2` foi validado: magic bytes `wOF2` nos 4 primeiros bytes e tamanho entre 10 KB e 200 KB.

| Arquivo | Tamanho | Magic |
|---|---|---|
| `atkinson-400.woff2` | 17.208 bytes | `wOF2` |
| `atkinson-700.woff2` | 17.524 bytes | `wOF2` |
| `opendyslexic-400.woff2` | 115.280 bytes | `wOF2` |
| `lexend-400.woff2` | 14.476 bytes | `wOF2` |

## Outros assets vendorizados

- **Readability** (Mozilla, `@mozilla/readability@0.5.0`) em `extension/lib/` — licença **Apache-2.0**; o texto da licença está em `extension/lib/READABILITY-LICENSE.md`.
