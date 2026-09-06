# Fontes

## IBM VGA 8x16 — embutida (usada no logo ASCII)

`WebPlus_IBM_VGA_8x16.woff` vem do **Ultimate Oldschool PC Font Pack v2.2**,
de **VileR** (https://int10h.org/oldschool-pc-fonts/), sob licença
**Creative Commons Attribution-ShareAlike 4.0** — texto completo em
`IBM-VGA-LICENSE.txt`.

É a fonte de tela do adaptador VGA da IBM, reconstruída fielmente. O logo
da página de nova aba é desenhado com ela em corpo 16px numa grade de
8×16 — o tamanho de projeto. Qualquer outro corpo borra o desenho, então
`config.cellW/cellH` em `src/newtab/ascii-logo.js` devem acompanhar a
fonte se ela for trocada.

A licença exige **atribuição** e que **adaptações da própria fonte** sejam
compartilhadas sob a mesma licença. Usá-la para desenhar texto não cria
adaptação: o restante do Zeos permanece MIT.

## Brunea Mono — fonte padrão da interface (não incluída)

A interface está configurada para usar **Brunea Mono**, da Any-Type®
Foundry, vendida na Creative Market (~US$ 18, licença Desktop).

Ela **não acompanha o repositório**: distribuir o arquivo sem licença
seria pirataria. Enquanto não estiver aqui, o Zeos cai automaticamente na
próxima fonte do stack (IBM Plex Mono → SF Mono → Consolas → monospace) e
nada quebra.

### Para ativar depois de comprar

1. Compre a licença **Desktop** (e a **Webfont**, se quiser o `.woff2`).
2. Copie o arquivo para esta pasta com um destes nomes:

   ```
   src/assets/fonts/BruneaMono.woff2     (preferido)
   src/assets/fonts/BruneaMono.otf
   src/assets/fonts/BruneaMono.ttf
   ```

3. Abra o Zeos. Ela passa a ser usada em toda a interface
   automaticamente — o `@font-face` já está declarado e o nome já é o
   padrão em Configurações → Aparência → Fonte.

Guarde o comprovante da licença. A licença Desktop normalmente **não**
cobre redistribuir a fonte dentro de um aplicativo — confira antes de
publicar builds com ela embutida.
