# Diagnóstico Patrimonial do Imóvel — SPU

Protótipo funcional do Diagnóstico Patrimonial do Imóvel no Módulo de
Instrução de Destinações do SPUnet Gestão.

O protótipo permite percorrer o fluxo com ou sem RIP, registrar divergências,
anexos, interferências, providências e visualizar o diagnóstico concluído.

**Acesso ao protótipo:**
https://sostena-boop.github.io/diagnostico-patrimonial-spu/

## Versão publicada

A partir de 12/11/2026 a página publicada é `diagnostico.html`, um arquivo HTML
único, sem build, no layout do SPUnet. Para publicar uma alteração, copie-o para
`docs/index.html` e envie para a branch `main`; o GitHub Actions publica o
conteúdo de `docs/` no GitHub Pages.

O código React em `app/` é a versão anterior, mantida para consulta. **Não rode
`npm run build:pages`**: ele recria `docs/` a partir da versão antiga e
sobrescreve a página publicada.
