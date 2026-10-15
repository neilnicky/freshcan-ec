import logoUrl from "@/assets/brand/freshcan-logo.svg?url";
import type { Format } from "@/content/freshcan-content";
import { motion, ease } from "./config";
import { env, onFrame, onResize } from "./runtime";
import { webglAvailable } from "@/three/support";

type Item = Format & { href: string };

const TONES: Record<Format["tone"], string> = {
  steel: "var(--steel)",
  husk: "var(--husk)",
  palm: "var(--palm)",
};

/**
 * Ruta Fresh box: format carousel. The can morphs between 250/330/500 ml and a
 * circular colour wipe changes the box.
 */
export function initRuta(): void {
  const box = document.querySelector<HTMLElement>("[data-carousel]");
  if (!box) return;
  const data = box.querySelector<HTMLScriptElement>("[data-carousel-data]");
  const items: Item[] = data ? JSON.parse(data.textContent || "[]") : [];
  if (!items.length) return;
  const mlEl = box.querySelector<HTMLElement>("[data-carousel-ml]");
  const order = box.querySelector<HTMLAnchorElement>("[data-carousel-order]");
  const wipe = box.querySelector<HTMLElement>("[data-carousel-wipe]");
  const canvas = box.querySelector<HTMLCanvasElement>("[data-carousel-canvas]");
  let index = 1;
  let from = items[index]!;
  let to = items[index]!;
  let morphStart = 0;

  const apply = (i: number) => {
    const n = items.length;
    index = ((i % n) + n) % n;
    from = currentShape();
    to = items[index]!;
    morphStart = performance.now();
    if (mlEl) mlEl.textContent = String(to.ml);
    if (order) order.href = to.href;
    box.dataset.tone = to.tone;
    if (wipe) {
      wipe.style.setProperty("--tone", TONES[to.tone]);
      if (env.reduced) {
        box.style.background = TONES[to.tone];
      } else {
        wipe.animate([{ transform: "translate(-50%,-50%) scale(0)" }, { transform: "translate(-50%,-50%) scale(1)" }], {
          duration: motion.ruta.wipeMs,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }).finished.then(() => (box.style.background = TONES[to.tone])).catch(() => {});
      }
    }
  };

  const currentShape = (): Item => {
    const p = env.reduced ? 1 : ease.inOutCubic(Math.min(1, (performance.now() - morphStart) / motion.ruta.morphMs));
    return { ...to, heightScale: from.heightScale + (to.heightScale - from.heightScale) * p, widthScale: from.widthScale + (to.widthScale - from.widthScale) * p };
  };

  box.querySelector("[data-carousel-prev]")?.addEventListener("click", () => apply(index - 1));
  box.querySelector("[data-carousel-next]")?.addEventListener("click", () => apply(index + 1));
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") apply(index - 1);
    if (e.key === "ArrowRight") apply(index + 1);
  });
  box.dataset.tone = to.tone;
  if (wipe) wipe.style.setProperty("--tone", TONES[to.tone]);
  box.style.background = TONES[to.tone];

  if (!canvas || !webglAvailable()) return;
  let started = false;
  let inView = false;
  new IntersectionObserver(
    ([e]) => {
      inView = !!e?.isIntersecting;
      if (inView && !started) {
        started = true;
        void start();
      }
    },
    { rootMargin: "50% 0px" },
  ).observe(box);

  async function start() {
    const [{ createCan, logoCanvas }, { CanStage }] = await Promise.all([import("@/three/can"), import("@/three/stage")]);
    const logo = await logoCanvas(logoUrl);
    const stage = new CanStage(canvas!, motion.can.maxDpr);
    const can = createCan({ logo, droplets: true });
    const slot = stage.add(can, null, 0.62);
    onResize(() => stage.resize());
    let spin = 0;
    let lastIndex = index;
    let kick = 0;
    onFrame((_t, dt) => {
      if (!inView || document.hidden) return;
      if (index !== lastIndex) {
        lastIndex = index;
        kick += Math.PI * 2;
      }
      const s = currentShape();
      can.setFormat(s.heightScale, s.widthScale);
      const k = env.reduced ? 0 : dt / 1000;
      spin += k;
      const settle = kick * 0.08;
      kick -= settle;
      // A full turn on each change, otherwise a gentle sway that keeps the logo front
      slot.rotY = Math.sin(spin * 0.6) * 0.45 + (Math.PI * 2 - kick) % (Math.PI * 2);
      slot.y = (1 - s.heightScale) * 0.1;
      slot.rotZ = -0.1;
      stage.render();
    });
  }
}
