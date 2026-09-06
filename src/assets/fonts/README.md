# Fontes da interface

## Brunea Mono (fonte padrão pretendida)

A interface está configurada para usar **Brunea Mono** — uma fonte
**comercial** da Any-Type® Foundry, vendida na Creative Market
(https://creativemarket.com, ~US$ 18 pela licença Desktop).

Ela **não acompanha este repositório**: distribuir o arquivo sem licença
seria pirataria. Enquanto o arquivo não estiver aqui, o Zeos cai
automaticamente na próxima fonte do stack (IBM Plex Mono → SF Mono →
Consolas → monospace) e nada quebra.

### Para ativar depois de comprar

1. Compre a licença **Desktop** (e a **Webfont**, se quiser o `.woff2`).
2. Copie o arquivo para esta pasta com um destes nomes:

   ```
   src/assets/fonts/BruneaMono.woff2     (preferido)
   src/assets/fonts/BruneaMono.otf
   src/assets/fonts/BruneaMono.ttf
   ```

3. Abra o Zeos. A fonte passa a ser usada em toda a interface
   automaticamente — o `@font-face` já está declarado em cada página e o
   nome já é o padrão em Configurações → Aparência → Fonte.

Nada mais precisa ser alterado no código.

### Licenciamento

Guarde o comprovante da licença. Se algum dia o projeto for distribuído
com a fonte embutida, confira se a licença adquirida cobre redistribuição
em aplicativo — a licença Desktop normalmente **não** cobre.
