import { motion } from "./config";
import { env, onFrame, onResize } from "./runtime";

/**
 * #FreshCanMoments strip: continuous drift, drag with inertia, and cards that
 * tilt with drag velocity. Items are cloned
 * once so the loop is seamless; clones are hidden from assistive tech.
 */
export function initMoments(): void {
  const viewport = document.querySelector<HTMLElement>("[data-moments]");
  const track = viewport?.querySelector<HTMLElement>("[data-moments-track]");
  const prev = document.querySelector<HTMLButtonElement>("[data-moments-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-moments-next]");
  if (!viewport || !track) return;
  const originals = [...track.children] as HTMLElement[];

  const step = () => (originals[0]?.getBoundingClientRect().width ?? 300) + parseFloat(getComputedStyle(track).columnGap || "16");

  if (env.reduced) {
    prev?.addEventListener("click", () => viewport.scrollBy({ left: -step() }));
    next?.addEventListener("click", () => viewport.scrollBy({ left: step() }));
    return;
  }

  originals.forEach((li) => {
    const c = li.cloneNode(true) as HTMLElement;
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
    track.appendChild(c);
  });

  const cards = [...track.children] as HTMLElement[];
  const cfg = motion.moments;
  let loopW = 0;
  const measure = () => {
    loopW = track.scrollWidth / 2;
  };
  measure();
  onResize(measure);

  let x = 0;
  let v = 0;
  let target: number | null = null;
  let dragging = false;
  let moved = 0;
  let startX = 0;
  let lastX = 0;
  let hovered = false;
  let inView = false;
  let tilt = 0;

  new IntersectionObserver(([e]) => (inView = !!e?.isIntersecting)).observe(viewport);
  viewport.addEventListener("pointerenter", () => (hovered = true));
  viewport.addEventListener("pointerleave", () => (hovered = false));

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = lastX = e.clientX;
    target = null;
    v = 0;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved = Math.abs(e.clientX - startX);
    if (moved > cfg.dragThreshold) {
      viewport.classList.add("is-dragging");
      if (!viewport.hasPointerCapture(e.pointerId)) viewport.setPointerCapture?.(e.pointerId);
    }
    x += dx;
    v = dx;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("is-dragging");
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  // A drag should not open the post
  viewport.addEventListener(
    "click",
    (e) => {
      if (moved > cfg.dragThreshold) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  prev?.addEventListener("click", () => (target = (target ?? x) + step()));
  next?.addEventListener("click", () => (target = (target ?? x) - step()));

  // Keyboard: bring a focused card fully into view
  track.addEventListener("focusin", (e) => {
    const li = (e.target as Element).closest<HTMLElement>("[data-mcard]");
    if (!li) return;
    const r = li.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    if (r.left < vr.left + 16) target = x + (vr.left + 16 - r.left);
    else if (r.right > vr.right - 16) target = x - (r.right - vr.right + 16);
  });

  onFrame((_t, dt) => {
    if (!inView || !loopW) return;
    const k = dt / 16.7;
    if (!dragging) {
      if (target !== null) {
        const d = target - x;
        x += d * 0.12 * k;
        v = d * 0.12;
        if (Math.abs(d) < 0.5) target = null;
      } else {
        v *= Math.pow(cfg.friction, k);
        x += v * k;
        if (!hovered && Math.abs(v) < 0.5) x -= (cfg.driftPxPerSecond * dt) / 1000;
      }
    }
    // wrap
    if (x <= -loopW) {
      x += loopW;
      if (target !== null) target += loopW;
    } else if (x > 0) {
      x -= loopW;
      if (target !== null) target -= loopW;
    }
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    const want = Math.max(-cfg.maxTilt, Math.min(cfg.maxTilt, v * cfg.tiltPerVelocity * 60));
    tilt += (want - tilt) * 0.15;
    const t = tilt.toFixed(2);
    cards.forEach((c, i) => c.style.setProperty("--tilt", `${i % 2 ? t : (-tilt * 0.8).toFixed(2)}deg`));
  });
}
