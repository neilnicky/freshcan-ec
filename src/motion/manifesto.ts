import { motion } from "./config";
import { env } from "./runtime";

/** Cycles the manifesto sticker word (words from the content file). */
export function initManifesto(): void {
  const rot = document.querySelector<HTMLElement>("[data-rotator]");
  if (!rot || env.reduced) return;
  const words = [...rot.querySelectorAll<HTMLElement>("[data-word]")];
  if (words.length < 2) return;
  let i = 0;
  let timer = 0;
  let inView = false;
  const tick = () => {
    const cur = words[i]!;
    i = (i + 1) % words.length;
    const next = words[i]!;
    cur.classList.remove("is-active");
    cur.classList.add("is-leaving");
    cur.setAttribute("aria-hidden", "true");
    next.classList.remove("is-leaving");
    next.classList.add("is-active");
    next.removeAttribute("aria-hidden");
    window.setTimeout(() => cur.classList.remove("is-leaving"), motion.manifesto.rollMs);
  };
  const loop = () => {
    window.clearInterval(timer);
    if (inView && !document.hidden) timer = window.setInterval(tick, motion.manifesto.holdMs);
  };
  new IntersectionObserver(([e]) => {
    inView = !!e?.isIntersecting;
    loop();
  }).observe(rot);
  document.addEventListener("visibilitychange", loop);
}
