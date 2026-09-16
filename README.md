# guimavng.com

Site oficial do **GUIMA** (rapper, Vila Nova de Gaia). One-page com álbum, singles/freestyles, galeria, loja e leitor. Reconstrução de setembro de 2026 em Astro; a versão de 2025 (HTML/SCSS à mão) está em `lotsofsmiley/guima-legacy`.

## Correr

```bash
npm install
npm run dev        # http://localhost:4321 (usa --port 4323 para não colidir com os outros projetos)
npm run build      # dist/ estático
npm run preview    # serve dist/
npx astro check    # TypeScript + templates
```

Node ≥ 22.12. Sem variáveis obrigatórias; ver `.env.example`.

## Stack

| Camada | Escolha | Porquê |
|---|---|---|
| Framework | Astro 7, output estático | Conteúdo é HTML puro; só o carrinho e o leitor precisam de JS |
| Estilos | Tailwind v4 + tokens em `src/styles/global.css` (`@theme`) | Uma fonte de verdade para cores, tipos e breakpoints |
| Ilhas | React 19 (`CartDrawer`, `PlayerDock`) | Estado real (quantidades, engine de áudio) |
| Estado partilhado | nanostores (`src/stores/`) | Botões em scripts simples e ilhas React leem a mesma store |
| Imagens | `astro:assets` (`<Picture>` AVIF/WebP, `srcset`) | 10,6 MB → ~0,4 MB no primeiro load |
| Ícones | Lucide (UI) + simple-icons (marcas) | SVG inline, sem kit JS de terceiros |
| Fontes | Sofia Sans Extra Condensed · League Gothic · Pirata One (OFL, self-hosted via fontsource) | Substituem Field Gothic e DX Gotha (esta era "personal use only") |
| Leitor | `<audio>` para ficheiros próprios; Spotify iFrame API como fallback | Faixa completa para quem tem sessão Spotify; 30 s caso contrário |
| Legal | Content collection `src/content/legal/*.md` | Privacidade, termos, envios, cookies |

## Estrutura

```
src/
  data/        site.ts (nav, redes, identidade legal) · album.ts · discography.json · products.ts
  components/  uma secção = um componente; islands/ = React
  stores/      cart.ts (persistido em localStorage) · player.ts
  lib/         commerce/ (interface do checkout — Stripe ou Shopify entram aqui) · format.ts
  layouts/     Base.astro (head, OG, JSON-LD, nav, footer, ilhas) · Legal.astro
  content/     legal/*.md
  assets/      imagens ≤ 2400 px (originais estão no NAS, não no git)
public/        og.jpg, ícones, robots.txt, audio/ (ficheiros das faixas, quando existirem)
scripts/       discography-seed/ — scripts Python sem chave que geraram o discography.json
```

## Convenções

- **Swap letters:** `|N|OVA` nos dados → `<span class="sw">N</span>OVA` via `swapHtml()`. Nunca escrever o `<span>` à mão.
- **Nada de PII** de clientes no repo. O carrinho fica só no browser; encomendas vivem no fornecedor de pagamento.
- **Produtos com `draft: true`** aparecem como "Em breve" e não são compráveis em produção.
- Commits em conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Antes de abrir a loja

1. Decidir o fornecedor (Stripe Checkout vs Shopify Basic) e implementar `CheckoutProvider` em `src/lib/commerce/`.
2. Preencher `legal` em `src/data/site.ts` (nome, NIF, morada, email) — o banner de dev desaparece quando estiver completo.
3. Preços, fotografias e stock reais em `src/data/products.ts`; custos de envio em `src/content/legal/envios-e-devolucoes.md`.
4. Faturação certificada (Vendus ou equivalente) ligada ao webhook de pagamento.
5. Ficheiros de áudio em `public/audio/` + campo `audio` nas faixas (opcional; sem eles o leitor usa o Spotify).

## Deploy

Cloudflare Pages, build `npm run build`, output `dist/`. O domínio `guimavng.com` continua na Hostinger até o DNS ser movido.
