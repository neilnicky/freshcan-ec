import { startRuntime } from "./runtime";
import { initReveal, revealHero } from "./reveal";
import { runLoader } from "./loader";
import { initNav } from "./nav";
import { initProtagonist } from "./protagonist";
import { initScene } from "./scene";
import { initManifesto } from "./manifesto";
import { initFormats } from "./formats";
import { initCollage } from "./collage";
import { initMoments } from "./moments";
import { initRuta } from "./ruta";
import { initGame } from "./game";

/** Entry point. Each module is independent and fails soft. */
export function boot(): void {
  const safe = (name: string, fn: () => void) => {
    try {
      fn();
    } catch (err) {
      console.error(`[freshcan] ${name} failed`, err);
    }
  };
  startRuntime();
  safe("nav", initNav);
  safe("scene", initScene);
  safe("manifesto", initManifesto);
  safe("formats", initFormats);
  safe("collage", initCollage);
  safe("moments", initMoments);
  safe("ruta", initRuta);
  safe("game", initGame);
  safe("reveal", initReveal);

  const can = initProtagonist().catch((err) => console.error("[freshcan] can failed", err));
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const ready = Promise.all([can, fonts]);
  runLoader(ready).then(revealHero);
}
