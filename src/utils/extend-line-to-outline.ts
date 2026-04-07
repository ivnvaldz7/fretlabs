import type { FretboardOutline } from '../modules/calculator/types';

type Pt = { x: number; y: number };

function cross(a: Pt, b: Pt): number {
  return a.x * b.y - a.y * b.x;
}

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
}

function mul(a: Pt, k: number): Pt {
  return { x: a.x * k, y: a.y * k };
}

/**
 * Intersect infinite line AB with segment CD.
 * Returns the intersection point if it lies on segment CD, otherwise null.
 */
function intersectLineWithSegment(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const rxs = cross(r, s);
  if (Math.abs(rxs) < 1e-12) return null; // parallel

  const cma = sub(c, a);
  const t = cross(cma, s) / rxs;
  const u = cross(cma, r) / rxs;

  if (u < -1e-9 || u > 1 + 1e-9) return null;
  return add(a, mul(r, t));
}

function uniqPoints(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    if (out.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-6)) continue;
    out.push(p);
  }
  return out;
}

export function extendSegmentToOutline(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  outline: FretboardOutline,
): { x1: number; y1: number; x2: number; y2: number } {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };

  const edges: Array<[Pt, Pt]> = [
    [outline.nutFirst, outline.nutLast],
    [outline.nutLast, outline.bridgeLast],
    [outline.bridgeLast, outline.bridgeFirst],
    [outline.bridgeFirst, outline.nutFirst],
  ];

  const hits: Pt[] = [];
  for (const [c, d] of edges) {
    const p = intersectLineWithSegment(a, b, c, d);
    if (p) hits.push(p);
  }

  const pts = uniqPoints(hits);
  if (pts.length < 2) return { x1, y1, x2, y2 };

  // Pick the farthest pair.
  let bestI = 0;
  let bestJ = 1;
  let bestDist = -1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d > bestDist) {
        bestDist = d;
        bestI = i;
        bestJ = j;
      }
    }
  }

  return { x1: pts[bestI].x, y1: pts[bestI].y, x2: pts[bestJ].x, y2: pts[bestJ].y };
}

