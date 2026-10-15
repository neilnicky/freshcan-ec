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
