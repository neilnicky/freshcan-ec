import { motion } from "./config";
import { env, onScroll, pageTop, scrollToY, getLenis } from "./runtime";
import { sweep } from "./loader";
import { ease } from "./config";

/**
 * Menu overlay (fade + masked staggered links), header inversion over
 * ink sections, and anchor navigation. Long jumps go through the can-shaped
 * wipe instead of racing through the pinned 3D scene.
 */
export function initNav(): void {
  const root = document.documentElement;
  const header = document.querySelector<HTMLElement>("[data-header]");
  const menu = document.querySelector<HTMLElement>("[data-menu]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const col = document.querySelector<HTMLElement>(".wipe span");
  const inertTargets = () => [...document.querySelectorAll<HTMLElement>("main, footer, .skip-link, .header__logo, .header__wa")];
  let open = false;
  let closeTimer = 0;
  let busy = false;

  function setOpen(next: boolean, restoreFocus = true) {
    if (!menu || !toggle || next === open) return;
    open = next;
    window.clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(next));
    toggle.querySelector("[data-open-label]")?.setAttribute("aria-hidden", String(next));
    toggle.querySelector("[data-close-label]")?.setAttribute("aria-hidden", String(!next));
    inertTargets().forEach((el) => (el.inert = next));
    if (next) {
      menu.hidden = false;
      getLenis()?.stop();
      // next frame so the opacity transition runs
      requestAnimationFrame(() => root.classList.add("menu-open"));
      menu.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    } else {
      root.classList.remove("menu-open");
      getLenis()?.start();
      closeTimer = window.setTimeout(() => (menu.hidden = true), env.reduced ? 0 : motion.menu.overlayMs);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
  }

  toggle?.addEventListener("click", () => setOpen(!open));

  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Tab" && menu && toggle) {
      const items = [...menu.querySelectorAll<HTMLElement>("a, button"), toggle];
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function targetY(el: HTMLElement): number {
    return Math.max(0, pageTop(el));
  }

  function land(el: HTMLElement) {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }

  function jump(id: string) {
    const el = id === "inicio" ? document.body : document.getElementById(id);
    if (!el) return;
    const section = id === "inicio" ? document.getElementById("inicio")! : el;
    const y = id === "inicio" ? 0 : targetY(el);
    history.replaceState(null, "", `#${id}`);
    const far = Math.abs(y - window.scrollY) > window.innerHeight * 1.6;
    if (env.reduced || !col) {
      setOpen(false, false);
      window.scrollTo(0, y);
      land(section);
      return;
    }
    if (open || far) {
      busy = true;
      sweep(col, motion.menu.wipeInMs, () => {
        setOpen(false, false);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      }).then(() => {
        busy = false;
        land(section);
      });
      return;
    }
    scrollToY(y, 1100, ease.inOutCubic, () => land(section));
  }

  document.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-nav-link]");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("#")) return;
    e.preventDefault();
    if (busy) return;
    jump(href.slice(1));
  });

  // Header colour flips over [data-dark] sections
  const darks = [...document.querySelectorAll<HTMLElement>("[data-dark]")];
  const main = document.querySelector<HTMLElement>("main");
  if (header) {
    let last = false;
    onScroll(() => {
      const probe = header.offsetHeight / 2;
      // The footer sits under <main> (sticky reveal), so it counts once main has scrolled past.
      const footerShown = !!main && main.getBoundingClientRect().bottom <= probe;
      const dark =
        footerShown ||
        darks.some((d) => {
          const r = d.getBoundingClientRect();
          return r.top <= probe && r.bottom >= probe;
        });
      if (dark !== last) {
        last = dark;
        header.classList.toggle("is-dark", dark);
      }
    });
  }
}
