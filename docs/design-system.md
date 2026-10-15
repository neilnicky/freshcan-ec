# Fresh Can — design system

## Idea: "Lo que ves es lo que tomas"

Fresh Can's defining asset is a **transparent can**: the coconut water itself is the colour. The site is built around transparency and liquid.

- The hero object is a procedural **3D clear PET can** (three.js) with the traced logo and cloudy coconut water inside, modelled on the brand's packshots.
- Scroll empties and refills the can; the liquid level doubles as the progress indicator.
- Section transitions use a **liquid meniscus edge** (a soft wave), like coconut water rising in the can.
- Copy is **Spanish (es-EC)**, keeping the English phrases the brand already uses ("moments", "Natural hydration", "Official retailer").

"Lo que ves es lo que tomas" is a creative line derived from the clear can, not a brand slogan. All other headlines reuse the brand's own wording.

## Page structure

| Section | What it does |
|---|---|
| Loader | Ink screen with the logo; counter runs 000 → 330 ml while an outline can fills; exits with a can-shaped lime column wipe. First visit per session only. |
| Header + menu | Logo and MENU pill (sticker style), inverts over ink sections. Overlay menu with staggered links; contact is WhatsApp + Instagram. |
| Hero | "100% coco / 100% fresh." split around the 3D can, with a rotating curved-text sticker. |
| Scene | Pinned: the can drains over a photo of coconuts, then refills; ml counter, COCO → LATA bar, and badges showing verified facts only. |
| Break | "Agarra tu / Fresh Can" with the can passing between the words. |
| Manifesto | Ink section, cycling sticker word in lime. |
| Formats | 250 / 330 / 500 ml cards sharing one WebGL canvas; "+" opens an order popover that builds a WhatsApp message. No prices, no cart. |
| Collage | "Planes que se sienten mejor" — tilted real photos with scroll parallax. |
| Moments | #FreshCanMoments: real activations as a draggable, drifting strip linking to the posts. |
| Ruta Fresh | Verified retailer + unconfirmed spots; format carousel where the can morphs between sizes. |
| Footer | Revealed underneath the page; giant logo and the "Abre el coco" slicing game (500 ml = win). |

Menu jumps longer than ~1.6 viewports reuse the column wipe instead of scrolling through the pinned scene.

## Colour (sampled from brand photography)

| Token | Hex | Source |
|---|---|---|
| `--ink` | `#111210` | logo / sticker black |
| `--paper` | `#f4f6f5` | packshot studio highlight |
| `--mist` | `#e6e9e7` | packshot studio mid |
| `--steel` | `#c9cfd4` | "3 presentaciones" backdrop |
| `--milk` | `#eef1ea` | coconut water through clear PET |
| `--husk` | `#7a8369` | young coconut husk |
| `--palm` | `#3c4618` | palms / grass in lifestyle shots |
| `--lime` | `#a8d214` | "¡Hemos llegado!" parachute, lifted for screen |

Ink on paper is the default, like the packaging. Lime is the single accent (sticker fills, active states, focus rings on dark); never lime text on paper. Palm green is the alternate dark.

## Typography

- **Display — Bricolage Grotesque Variable**: wdth 75, wght 800, uppercase, tracking −0.04em, line-height 0.86.
- **Body — Instrument Sans Variable** 400/500; italic for small handwritten-feel notes.
- **Stickers** — Bricolage 800 in black-outlined rounded labels, rotated −4…6°, like the brand's "PARA TI" / "LATA".
- Scale is vw-driven: display `clamp(3.4rem, 9.4vw, 11rem)`, section `clamp(2.6rem, 7.5vw, 9rem)`, body `clamp(1rem, 1.35vw, 1.3rem)`, labels 0.8rem caps.

## Imagery

Real brand images only, each with its source post and focal point in `src/content/freshcan-content.ts`. Packshots sit on mist/steel; lifestyle shots get a thin paper border and slight rotation.

## Motion principles

1. **The can is the protagonist**: every scroll scene moves, fills or rotates it.
2. **Liquid, not mechanical**: `cubic-bezier(.22,1,.36,1)` for reveals; spring-damped slosh from scroll velocity.
3. **Scrubbed and reversible** for scroll scenes; time-based only for loops.
4. **Reduced motion**: no loader, no smooth scroll, static can, scenes shown resolved, strip natively scrollable.
5. **One rAF runtime** (Lenis + subscribers) in `src/motion/runtime.ts`.

## Tech

Astro (static), TypeScript strict, vanilla motion modules + Lenis. three.js renders only the can and is lazy-loaded after first paint (~18 kB gz initial JS). Can choreography is pure, unit-tested maths in `src/motion/track.ts`.
