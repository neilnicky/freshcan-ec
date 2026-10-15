import { env, onScroll } from "./runtime";

/** Scroll parallax for the polaroid stack. */
export function initCollage(): void {
  if (env.reduced) return;
  const items = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
  if (!items.length) return;
  const speeds = items.map((el) => Number(el.dataset.parallax) || 0);
  onScroll(() => {
    const vh = window.innerHeight;
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = r.top + r.height / 2 - vh / 2 - (parseFloat(el.dataset.ty || "0") || 0);
      const ty = -d * speeds[i]!;
      el.dataset.ty = String(ty);
      el.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) rotate(${(ty * 0.02).toFixed(2)}deg)`;
    });
  });
}
