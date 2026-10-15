# Fresh Can — freshcan.ec

Speculative brand site for **Fresh Can** (@freshcan.ec), 100% coconut water in clear PET cans from Ecuador. Structure and motion are reverse-engineered from palmo.co.in; the identity, copy and assets are Fresh Can's own.

## Run

```bash
pnpm install
pnpm dev            # http://localhost:4321
pnpm build          # astro check + static build to dist/
pnpm preview        # serve dist/
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright (desktop + mobile) against the production build — run `pnpm build` first
```

## Where things live

| Path | What |
|---|---|
| `src/content/freshcan-content.ts` | **All copy, links, formats, contact, SEO.** Edit here, not in components. |
| `src/assets/media/` | Brand photos (from Instagram; sources listed in the content file and research doc) |
| `src/assets/brand/freshcan-logo.svg` | Logo traced from the brand's own post (currentColor) |
| `src/components/` | One component per section |
| `src/motion/` | Vanilla motion modules + one rAF runtime (Lenis). Timings in `config.ts`; can choreography is pure maths in `track.ts` |
| `src/three/` | Procedural 3D clear can (`can.ts`) and the multi-slot renderer (`stage.ts`); lazy-loaded |
| `docs/` | Reference analysis, brand research, design direction |

## Before launch (needs the brand)

- Prices, delivery areas and an email address are intentionally absent; ordering goes to WhatsApp (+593 93 994 1356, from the Instagram bio).
- The 📍 "spots" come from Instagram highlight titles that require login to open; they are labelled as spots, not stockists. Only The Urban Market is a confirmed retailer.
- Replace Instagram-sourced images with originals and confirm usage rights; get a vector logo.
- Set the real domain in `astro.config.mjs` (`site`) and `content.seo.canonical`.
