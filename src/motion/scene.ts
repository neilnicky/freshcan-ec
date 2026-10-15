import { content } from "@/content/freshcan-content";
import { env, onResize, onScroll } from "./runtime";
import { keysFor, measureMarks, isCompact } from "./marks";
import { clamp01, levelToMl, poseAt, sceneProgress, type Key, type Marks } from "./track";

const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Final badge positions (fractions of the pinned viewport) around the can. */
const SPOTS_WIDE: [number, number][] = [
  [0.53, 0.3],
  [0.88, 0.26],
  [0.55, 0.72],
  [0.87, 0.7],
];
const SPOTS_COMPACT: [number, number][] = [
  [0.17, 0.53],
  [0.83, 0.5],
  [0.17, 0.74],
  [0.83, 0.71],
];

/**
 * DOM side of the pinned scene: coconut photo window, orbiting badges,
 * coco → lata millilitre counter. Works without WebGL.
 */
export function initScene(): void {
  const scene = document.querySelector<HTMLElement>("[data-scene]");
  if (!scene) return;
  if (env.reduced) {
    document.documentElement.classList.add("static-scene");
    scene.querySelector("[data-scene] h2")?.closest("[data-reveal]")?.classList.add("is-in");
    return;
  }
  const win = scene.querySelector<HTMLElement>("[data-scene-window]");
  const body = scene.querySelector<HTMLElement>("[data-scene-body]");
  const badges = [...scene.querySelectorAll<HTMLElement>("[data-badge]")];
  const state = scene.querySelector<HTMLElement>("[data-progress-state]");
  const ml = scene.querySelector<HTMLElement>("[data-progress-ml]");
  const bar = scene.querySelector<HTMLElement>("[data-progress-bar]");
  const { from, to, max } = content.scene.progress;

  let marks: Marks | null = null;
  let keys: Key[] = [];
  const measure = () => {
    marks = measureMarks();
    if (marks) keys = keysFor(marks);
  };
  measure();
  onResize(measure);

  let lastMl = -1;
  let lastState = "";
  onScroll((y) => {
    if (!marks || !keys.length) return;
    const p = sceneProgress(marks, y);
    if (y < marks.sceneTop - marks.vh || y > marks.sceneTop + marks.sceneHeight) return;

    const open = smooth(p / 0.22) * (1 - smooth((p - 0.9) / 0.1) * 0.35);
    win?.style.setProperty("--o", open.toFixed(4));
    body?.style.setProperty("--b", smooth((p - 0.5) / 0.12).toFixed(3));

    const level = poseAt(keys, y).level;
    const value = levelToMl(level, max);
    if (value !== lastMl && ml) {
      lastMl = value;
      ml.textContent = String(value).padStart(3, "0");
    }
    bar?.style.setProperty("--l", level.toFixed(4));
    const label = p < 0.3 ? from : to;
    if (label !== lastState && state) {
      lastState = label;
      state.textContent = label;
    }

    const vw = window.innerWidth;
    const vh = marks.vh;
    const spots = isCompact() ? SPOTS_COMPACT : SPOTS_WIDE;
    badges.forEach((b, i) => {
      const t = smooth((p - (0.34 + i * 0.09)) / 0.16);
      const [fx, fy] = spots[i % spots.length]!;
      const cx = (isCompact() ? 0.5 : 0.7) * vw;
      const cy = 0.5 * vh;
      const ex = fx * vw - cx;
      const ey = fy * vh - cy;
      // Orbit in: rotate the final offset around the can while shrinking the lag
      const ang = (1 - t) * (1.4 + i * 0.3);
      const rad = 1 + (1 - t) * 0.9;
      const ox = (ex * Math.cos(ang) - ey * Math.sin(ang)) * rad;
      const oy = (ex * Math.sin(ang) + ey * Math.cos(ang)) * rad;
      b.style.opacity = t.toFixed(3);
      b.style.transform = `translate3d(${(cx + ox).toFixed(1)}px, ${(cy + oy).toFixed(1)}px, 0) rotate(${((1 - t) * -80 + (i % 2 ? 6 : -8)).toFixed(1)}deg) scale(${(0.6 + t * 0.4).toFixed(3)})`;
    });
  });
}
