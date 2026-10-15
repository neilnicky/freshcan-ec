import { buildKeys, type Key, type Marks } from "./track";
import { env, pageTop } from "./runtime";

/** Measures the sections the protagonist can is keyed to. */
export function measureMarks(): Marks | null {
  const scene = document.querySelector<HTMLElement>("[data-scene]");
  const brk = document.querySelector<HTMLElement>("[data-break]");
  if (!scene || !brk) return null;
  return {
    vh: window.innerHeight,
    sceneTop: pageTop(scene),
    sceneHeight: scene.offsetHeight,
    breakTop: pageTop(brk),
    breakHeight: brk.offsetHeight,
  };
}

/** Phones and portrait tablets get the centred choreography (matches the CSS query in Scene.astro). */
export const COMPACT_QUERY = "(max-width: 760px), (max-width: 1100px) and (orientation: portrait)";
export function isCompact(): boolean {
  return window.matchMedia(COMPACT_QUERY).matches;
}

/** Reduced motion: the can stays put in the hero and fades out after it. */
export function keysFor(m: Marks): Key[] {
  const keys = buildKeys(m, isCompact());
  if (!env.reduced) return keys;
  const hero = keys[0]!.pose;
  return [
    { at: 0, pose: hero },
    { at: m.vh * 0.45, pose: hero },
    { at: m.vh * 0.9, pose: { ...hero, opacity: 0 } },
  ];
}
