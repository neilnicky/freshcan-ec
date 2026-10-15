/**
 * The protagonist can's scroll choreography, as pure functions so it can be
 * unit-tested. One object is carried from the
 * hero through the pinned scene to the section break.
 */

export interface Pose {
  /** Horizontal offset as a fraction of viewport width (0 = centre). */
  x: number;
  /** Vertical offset as a fraction of viewport height (0 = centre, + = down). */
  y: number;
  scale: number;
  /** Scroll-driven spin in radians (idle spin is added separately). */
  spin: number;
  /** Z-axis lean in radians. */
  tilt: number;
  /** Liquid level 0..1. */
  level: number;
  opacity: number;
}

export interface Key {
  at: number;
  pose: Pose;
}

/** Page-space measurements the choreography is keyed to. */
export interface Marks {
  vh: number;
  sceneTop: number;
  sceneHeight: number;
  breakTop: number;
  breakHeight: number;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale, b.scale, t),
    spin: lerp(a.spin, b.spin, t),
    tilt: lerp(a.tilt, b.tilt, t),
    level: lerp(a.level, b.level, t),
    opacity: lerp(a.opacity, b.opacity, t),
  };
}

/** Pose at scroll position `y`. Keys must be sorted by `at`. */
export function poseAt(keys: readonly Key[], y: number): Pose {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) throw new Error("poseAt needs at least one key");
  if (y <= first.at) return first.pose;
  if (y >= last.at) return last.pose;
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]!;
    if (y <= b.at) {
      const a = keys[i - 1]!;
      const span = b.at - a.at;
      const t = span <= 0 ? 1 : smooth((y - a.at) / span);
      return mixPose(a.pose, b.pose, t);
    }
  }
  return last.pose;
}

/** Progress (0..1) through the pinned scene for scroll `y`. */
export function sceneProgress(m: Marks, y: number): number {
  const travel = Math.max(1, m.sceneHeight - m.vh);
  return clamp01((y - m.sceneTop) / travel);
}

export function buildKeys(m: Marks, compact: boolean): Key[] {
  const travel = Math.max(1, m.sceneHeight - m.vh);
  const at = (p: number) => m.sceneTop + travel * p;
  const side = compact ? 0 : 0.2;
  const base = compact ? 0.82 : 1;
  const T = Math.PI * 2;

  // Spin is chosen so the logo faces the viewer when the can is full and at the break.
  const hero: Pose = { x: 0, y: compact ? 0.02 : 0.04, scale: base, spin: 0, tilt: -0.14, level: 1, opacity: 1 };
  const enter: Pose = { x: side, y: 0, scale: base * 1.06, spin: -0.3, tilt: 0.08, level: 1, opacity: 1 };
  const drained: Pose = { ...enter, spin: T * 0.5, level: 0, tilt: -0.05 };
  const hold: Pose = { ...drained, spin: T * 0.6 };
  const full: Pose = { ...enter, x: compact ? 0 : side * 0.9, spin: T, level: 1, tilt: 0.06 };
  const settle: Pose = { x: 0, y: 0, scale: base * 0.92, spin: T + 0.15, tilt: 0, level: 1, opacity: 1 };
  const through: Pose = { x: 0, y: compact ? 0.04 : 0.02, scale: base * 0.72, spin: T, tilt: -0.1, level: 1, opacity: 1 };
  const gone: Pose = { ...through, y: -1.15, spin: T * 1.25, tilt: 0.2, opacity: 0 };

  return [
    { at: 0, pose: hero },
    { at: m.sceneTop, pose: enter },
    { at: at(0.22), pose: drained },
    { at: at(0.32), pose: hold },
    { at: at(0.78), pose: full },
    { at: at(1), pose: settle },
    { at: m.breakTop + m.breakHeight * 0.45 - m.vh * 0.5, pose: through },
    { at: m.breakTop + m.breakHeight, pose: gone },
  ];
}

/** Liquid level → millilitres for the progress counter. */
export function levelToMl(level: number, max: number): number {
  return Math.round(clamp01(level) * max);
}
