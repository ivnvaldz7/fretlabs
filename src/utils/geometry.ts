/**
 * Centralized geometry utilities for 2D calculations.
 */

export interface Pt {
  x: number;
  y: number;
}

/**
 * Calculate Euclidean distance between two 2D points.
 */
export function ptDistance(p1: Pt, p2: Pt): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calculate the length of a line segment connecting two coordinates.
 */
export function lineLength(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Normalize a 2D vector. Returns a unit vector.
 * If length is 0, returns { x: 0, y: 0 }.
 */
export function normalizeVector(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}
