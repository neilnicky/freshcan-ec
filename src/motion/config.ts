/**
 * Motion constants shared by the motion modules.
 */
export const ease = {
  /** Reveal curve used in CSS too (--ease-out). */
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
};

export const motion = {
  lenis: { lerp: 0.09, wheelMultiplier: 0.95 },

  loader: {
    /** Kept short so the page is never held back. */
    minMs: 1100,
    maxMs: 2600,
    exitMs: 900,
    sessionKey: "fc-loaded",
  },

  menu: {
    overlayMs: 350,
    linkStaggerMs: 60,
    /** Column wipe used when jumping to a section from the menu. */
    wipeInMs: 520,
    wipeOutMs: 620,
  },

  can: {
    idleSpin: 0.25, // rad/s in the hero
    pointerTilt: 0.18, // rad at screen edge
    smoothing: 0.085, // per-frame lerp toward the scroll pose
    slosh: { stiffness: 0.08, damping: 0.86, gain: 0.0009, max: 0.3 },
    maxDpr: 1.75,
  },

  manifesto: { holdMs: 1700, rollMs: 520 },

  moments: { driftPxPerSecond: 32, dragThreshold: 4, tiltPerVelocity: 0.0022, maxTilt: 6, friction: 0.92 },

  ruta: { morphMs: 900, wipeMs: 700 },

  game: { gravity: 1500, spawnEveryMs: 900, mlPerCoconut: 25, trailMs: 180 },
};
