import logoUrl from "@/assets/brand/freshcan-logo.svg?url";
import { content, orderMessage, whatsappHref } from "@/content/freshcan-content";
import { motion } from "./config";
import { env, onFrame, onResize } from "./runtime";
import { webglAvailable } from "@/three/support";

/**
 * Format cards: colour flood from the pointer on hover,
 * "+" order popover that builds a WhatsApp message, and the three 3D cans in
 * one shared canvas.
 */
export function initFormats(): void {
  const grid = document.querySelector<HTMLElement>("[data-formats-grid]");
  if (!grid) return;
  const cards = [...grid.querySelectorAll<HTMLElement>("[data-format]")];

  // Hover flood
  cards.forEach((card) => {
    const stage = card.querySelector<HTMLElement>("[data-can-slot]");
    const set = (e: PointerEvent) => {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      stage.style.setProperty("--fx", `${e.clientX - r.left}px`);
      stage.style.setProperty("--fy", `${e.clientY - r.top}px`);
    };
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      set(e);
      card.classList.add("is-hover");
    });
    card.addEventListener("pointerleave", (e) => {
      set(e);
      card.classList.remove("is-hover");
    });
  });

  // Order popovers
  const toggles = cards.map((c) => c.querySelector<HTMLButtonElement>("[data-order-toggle]")!);
  const pops = cards.map((c) => c.querySelector<HTMLElement>("[data-order-pop]")!);
  const close = (i: number, focus = false) => {
    toggles[i]?.setAttribute("aria-expanded", "false");
    if (pops[i]) pops[i].hidden = true;
    cards[i]?.classList.remove("is-open");
    if (focus) toggles[i]?.focus();
  };
  toggles.forEach((t, i) => {
    t?.addEventListener("click", () => {
      const isOpen = t.getAttribute("aria-expanded") === "true";
      toggles.forEach((_, j) => close(j));
      if (isOpen) return;
      t.setAttribute("aria-expanded", "true");
      pops[i]!.hidden = false;
      cards[i]!.classList.add("is-open", "is-hover");
      pops[i]!.querySelector<HTMLElement>("[data-order-link]")?.focus({ preventScroll: true });
    });
  });
  pops.forEach((pop, i) => {
    const ml = Number(pop.dataset.ml);
    const out = pop.querySelector<HTMLElement>("[data-qty-value]");
    const link = pop.querySelector<HTMLAnchorElement>("[data-order-link]");
    let qty = 1;
    pop.querySelectorAll<HTMLButtonElement>("[data-qty]").forEach((b) =>
      b.addEventListener("click", () => {
        qty = Math.min(48, Math.max(1, qty + Number(b.dataset.qty)));
        if (out) out.textContent = String(qty);
        if (link) link.href = whatsappHref(orderMessage({ ml }, qty));
      }),
    );
    pop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(i, true);
    });
  });
  document.addEventListener("click", (e) => {
    const t = e.target as Element;
    cards.forEach((c, i) => {
      if (toggles[i]?.getAttribute("aria-expanded") === "true" && !c.contains(t)) close(i);
    });
  });

  // 3D cans, created when the grid approaches the viewport
  const canvas = grid.querySelector<HTMLCanvasElement>("[data-formats-canvas]");
  if (!canvas || !webglAvailable()) return;
  let started = false;
  let inView = false;
  const io = new IntersectionObserver(
    ([e]) => {
      inView = !!e?.isIntersecting;
      if (inView && !started) {
        started = true;
        void start(canvas, cards, () => inView);
      }
    },
    { rootMargin: "60% 0px" },
  );
  io.observe(grid);
}

async function start(canvas: HTMLCanvasElement, cards: HTMLElement[], visible: () => boolean) {
  const [{ createCan, logoCanvas }, { CanStage }] = await Promise.all([import("@/three/can"), import("@/three/stage")]);
  const logo = await logoCanvas(logoUrl);
  const stage = new CanStage(canvas, motion.can.maxDpr);
  const formats = content.formats.items;
  const slots = cards.map((card, i) => {
    const el = card.querySelector<HTMLElement>("[data-can-slot]")!;
    const f = formats[i]!;
    const can = createCan({ logo, droplets: true, segments: 56 });
    can.setFormat(f.heightScale, f.widthScale);
    const fill = 0.66;
    const slot = stage.add(can, el, fill);
    // Cans stand on a common baseline so the three sizes compare honestly
    slot.y = 0.45 - (fill / 2) * f.heightScale;
    return { slot, card, base: i * 1.3, turn: 0, tilt: 0, tx: 0 };
  });
  onResize(() => stage.resize());
  cards.forEach((card, i) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      slots[i]!.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    });
    card.addEventListener("pointerleave", () => (slots[i]!.tx = 0));
  });
  let t = 0;
  const frame = (dt: number) => {
    if (!visible() || document.hidden) return;
    t += env.reduced ? 0 : dt / 1000;
    for (const s of slots) {
      const hover = s.card.classList.contains("is-hover");
      // Hover turns the can to show its back through the clear PET
      s.turn += ((hover ? Math.PI : 0) - s.turn) * 0.08;
      s.tilt += (s.tx * 0.25 - s.tilt) * 0.1;
      // Sway rather than spin, so the printed logo stays readable
      s.slot.rotY = Math.sin(t * 0.7 + s.base) * 0.5 + s.turn;
      s.slot.rotZ = -s.tilt;
    }
    stage.render();
  };
  frame(16);
  onFrame((_t, dt) => frame(dt));
}
