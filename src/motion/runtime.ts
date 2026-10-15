import Lenis from "lenis";
import { motion } from "./config";

/**
 * One RAF loop for the whole page. Modules subscribe instead of running their
 * own loops, so scroll-linked work happens once per frame after Lenis updates.
 */

type FrameFn = (time: number, dt: number) => void;
type ScrollFn = (scrollY: number) => void;
type ResizeFn = () => void;

const frameSubs = new Set<FrameFn>();
const scrollSubs = new Set<ScrollFn>();
const resizeSubs = new Set<ResizeFn>();

let lenis: Lenis | null = null;
let lastScroll = -1;
let lastTime = 0;
let running = false;
let forceScroll = true;

const mq = (q: string) => (typeof window !== "undefined" ? window.matchMedia(q) : null);
const reducedMq = mq("(prefers-reduced-motion: reduce)");
const fineMq = mq("(hover: hover) and (pointer: fine)");
const desktopMq = mq("(min-width: 1025px)");

export const env = {
  get reduced() {
    return reducedMq?.matches ?? false;
  },
  get finePointer() {
    return fineMq?.matches ?? false;
  },
  get desktop() {
    return desktopMq?.matches ?? false;
  },
  get vh() {
    return window.innerHeight;
  },
  get vw() {
    return document.documentElement.clientWidth;
  },
};

export function scrollY(): number {
  return lenis ? lenis.scroll : window.scrollY;
}

function tick(time: number) {
  const dt = lastTime ? Math.min(64, time - lastTime) : 16;
  lastTime = time;
  lenis?.raf(time);
  const y = scrollY();
  if (forceScroll || y !== lastScroll) {
    lastScroll = y;
    forceScroll = false;
    scrollSubs.forEach((fn) => fn(y));
  }
  frameSubs.forEach((fn) => fn(time, dt));
  requestAnimationFrame(tick);
}

function ensureRunning() {
  if (running) return;
  running = true;
  requestAnimationFrame(tick);
}

export function onFrame(fn: FrameFn): () => void {
  frameSubs.add(fn);
  ensureRunning();
  return () => frameSubs.delete(fn);
}

export function onScroll(fn: ScrollFn): () => void {
  scrollSubs.add(fn);
  forceScroll = true;
  ensureRunning();
  return () => scrollSubs.delete(fn);
}

let resizeTimer = 0;
export function onResize(fn: ResizeFn): () => void {
  resizeSubs.add(fn);
  return () => resizeSubs.delete(fn);
}

export function remeasure() {
  resizeSubs.forEach((fn) => fn());
  forceScroll = true;
}

/** Page-space top of an element, independent of transforms on ancestors' scroll. */
export function pageTop(el: Element): number {
  return el.getBoundingClientRect().top + scrollY();
}

export function startRuntime() {
  if (!env.reduced && env.desktop && env.finePointer) {
    lenis = new Lenis({
      lerp: motion.lenis.lerp,
      wheelMultiplier: motion.lenis.wheelMultiplier,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
  }
  let lastWidth = window.innerWidth;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Ignore mobile URL-bar height jitter; only react to width changes there.
        if (!env.desktop && window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        remeasure();
      }, 120);
    },
    { passive: true },
  );
  document.fonts?.ready.then(remeasure).catch(() => {});
  window.addEventListener("load", remeasure, { once: true });
  ensureRunning();
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Smooth scroll to a page Y (used by nav). Honors reduced motion. */
export function scrollToY(y: number, duration: number, ease: (t: number) => number, onDone?: () => void) {
  if (env.reduced) {
    window.scrollTo(0, y);
    onDone?.();
    return;
  }
  if (lenis) {
    lenis.scrollTo(y, { duration: duration / 1000, easing: ease, onComplete: () => onDone?.() });
    return;
  }
  const from = window.scrollY;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + (y - from) * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}
