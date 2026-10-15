/**
 * Adds `.is-in` to [data-reveal] elements as they enter the viewport. Line
 * masks and fades are pure CSS transitions keyed off that class.
 */
export function initReveal(): void {
  const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
  );
  els.forEach((el) => io.observe(el));
}

/** Reveal the hero (called once the loader has gone). */
export function revealHero(): void {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;
  hero.classList.add("is-in");
  hero.querySelectorAll<HTMLElement>(".line, [data-fade]").forEach((el) => el.classList.add("is-in"));
}
