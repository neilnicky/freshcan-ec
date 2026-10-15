import { content } from "@/content/freshcan-content";
import { motion, ease } from "./config";

/**
 * Preloader: counts 000 → 330 ml while an outline can fills, then a lime
 * can-shaped column sweeps across and reveals the
 * page. Only on the first visit of a session, never with reduced motion.
 */
export function runLoader(ready: Promise<unknown>): Promise<void> {
  const root = document.documentElement;
  const el = document.querySelector<HTMLElement>("[data-loader]");
  if (!root.classList.contains("is-loading") || !el) {
    root.classList.remove("is-loading");
    return Promise.resolve();
  }
  const count = el.querySelector<HTMLElement>("[data-loader-count]");
  const liquid = el.querySelector<SVGElement>(".loader__liquid");
  const target = content.loader.target;
  const { minMs, maxMs, exitMs, sessionKey } = motion.loader;
  const start = performance.now();
  let isReady = false;
  ready.then(() => (isReady = true)).catch(() => (isReady = true));

  return new Promise((resolve) => {
    let shown = 0;
    let last = start;
    const step = (now: number) => {
      const elapsed = now - start;
      const dt = Math.min(100, now - last);
      last = now;
      // Progress chases time, but waits at 85% until assets are ready.
      const timeP = Math.min(1, elapsed / minMs);
      const cap = isReady || elapsed > maxMs ? 1 : 0.85;
      // Time-based easing so a slow device can't stretch the loader
      shown += (Math.min(timeP, cap) - shown) * (1 - Math.exp(-dt / 110));
      if ((cap === 1 && timeP === 1 && shown > 0.99) || elapsed > maxMs + 600) shown = 1;
      const p = ease.outCubic(shown);
      if (count) count.textContent = String(Math.round(p * target)).padStart(3, "0");
      liquid?.style.setProperty("--p", String(p));
      if (shown < 1) {
        requestAnimationFrame(step);
        return;
      }
      exit();
    };
    const exit = () => {
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {}
      const col = document.querySelector<HTMLElement>(".wipe span");
      el.classList.add("is-leaving");
      if (!col) {
        root.classList.remove("is-loading");
        resolve();
        return;
      }
      sweep(col, exitMs, () => {
        root.classList.remove("is-loading");
        resolve();
      });
    };
    requestAnimationFrame(step);
  });
}

/**
 * Can-shaped column: enters narrow from the right, widens to cover the screen,
 * `onCovered` runs while covered, then it slides off to the left.
 */
export function sweep(col: HTMLElement, ms: number, onCovered: () => void): Promise<void> {
  return new Promise((resolve) => {
    const vw = window.innerWidth;
    const cover = Math.max(vw / (vw * 0.18), 1) * 1.25;
    col.style.visibility = "visible";
    const keys: Keyframe[] = [
      { transform: `translateX(${vw * 0.6}px) scaleX(0.35)`, borderRadius: "9vw" },
      { transform: `translateX(0px) scaleX(1)`, borderRadius: "9vw", offset: 0.35 },
      { transform: `translateX(0px) scaleX(${cover})`, borderRadius: "0px", offset: 0.5 },
      { transform: `translateX(0px) scaleX(${cover})`, borderRadius: "0px", offset: 0.58 },
      { transform: `translateX(${-vw * 0.65}px) scaleX(0.35)`, borderRadius: "9vw" },
    ];
    const anim = col.animate(keys, { duration: ms * 1.6, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" });
    let covered = false;
    const check = () => {
      if (covered) return;
      const t = (anim.currentTime as number | null) ?? 0;
      if (t >= ms * 1.6 * 0.52) {
        covered = true;
        onCovered();
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
    anim.finished
      .catch(() => {})
      .then(() => {
        if (!covered) onCovered();
        col.style.visibility = "hidden";
        anim.cancel();
        resolve();
      });
  });
}
