/** Segment (ax,ay)-(bx,by) to point distance, used for slice hit tests. */
export function segmentDistance(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  const x = ax + t * dx - px;
  const y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

export interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

/**
 * Edges of the blade trail: each point is pushed out along its normal by a
 * half-width that shrinks with age (sqrt falloff, so the blade stays wide for
 * most of its length), so the head is a flat, full-width cut and the tail thins
 * to a hairline. left[i]/right[i] pair up with points[i]; drawn
 * as same-winding quads so self-crossing strokes never punch holes.
 */
export function trailRibbon(
  points: readonly TrailPoint[],
  now: number,
  lifeMs: number,
  halfWidth: number,
): { left: [number, number][]; right: [number, number][] } {
  const n = points.length;
  if (n < 2) return { left: [], right: [] };
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const a = points[Math.max(0, i - 1)]!;
    const b = points[Math.min(n - 1, i + 1)]!;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const life = Math.max(0, Math.min(1, 1 - (now - p.t) / lifeMs));
    const hw = halfWidth * Math.sqrt(life);
    left.push([p.x - dy * hw, p.y + dx * hw]);
    right.push([p.x + dy * hw, p.y - dx * hw]);
  }
  return { left, right };
}
