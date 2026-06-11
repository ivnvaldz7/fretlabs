import { describe, it, expect } from 'vitest';
import { ptDistance, lineLength, normalizeVector } from '../../src/utils/geometry';

describe('utils/geometry', () => {
  describe('ptDistance', () => {
    it('calculates the Euclidean distance between two points correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(ptDistance(p1, p2)).toBe(5);
    });

    it('returns 0 for the same point', () => {
      const p = { x: 10, y: 20 };
      expect(ptDistance(p, p)).toBe(0);
    });
  });

  describe('lineLength', () => {
    it('calculates line length correctly', () => {
      expect(lineLength(0, 0, 3, 4)).toBe(5);
      expect(lineLength(-1, -1, 2, 3)).toBe(5);
    });
  });

  describe('normalizeVector', () => {
    it('normalizes a non-zero vector to a unit vector', () => {
      const vec = normalizeVector(3, 4);
      expect(vec.x).toBeCloseTo(0.6, 5);
      expect(vec.y).toBeCloseTo(0.8, 5);
    });

    it('returns zero vector when input coordinates are zero', () => {
      const vec = normalizeVector(0, 0);
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
    });
  });
});
