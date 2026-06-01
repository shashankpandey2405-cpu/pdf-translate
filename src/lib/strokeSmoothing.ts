export type StrokePoint = { x: number; y: number };

function distance(a: StrokePoint, b: StrokePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Drop points closer than minDist — reduces jitter and draw cost on touch devices. */
export function decimateStrokePoints(points: StrokePoint[], minDist = 2.5): StrokePoint[] {
  if (points.length < 2) return points;
  const out: StrokePoint[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    const last = out[out.length - 1]!;
    if (distance(p, last) >= minDist) out.push(p);
  }
  const tail = points[points.length - 1]!;
  if (out[out.length - 1] !== tail) out.push(tail);
  return out;
}

/** Chaikin corner-cutting — rounds sharp zig-zags into smooth signature-like curves. */
export function chaikinStrokeSmooth(points: StrokePoint[], iterations = 2): StrokePoint[] {
  if (points.length < 3) return points;
  let current = points;
  for (let pass = 0; pass < iterations; pass++) {
    const next: StrokePoint[] = [current[0]!];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i]!;
      const p1 = current[i + 1]!;
      next.push(
        { x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 },
        { x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 },
      );
    }
    next.push(current[current.length - 1]!);
    current = next;
  }
  return current;
}

export function smoothStrokePoints(
  points: StrokePoint[],
  opts?: { minDist?: number; chaikinPasses?: number },
): StrokePoint[] {
  const decimated = decimateStrokePoints(points, opts?.minDist ?? 2.5);
  return chaikinStrokeSmooth(decimated, opts?.chaikinPasses ?? 2);
}
