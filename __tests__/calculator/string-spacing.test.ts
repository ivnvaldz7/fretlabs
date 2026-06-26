import { describe, it, expect } from 'vitest';
import {
  calculateStringPositions,
  gaugesInchesToMm,
} from '../../src/modules/calculator/string-spacing';

describe('calculateStringPositions', () => {
  describe('equal spacing', () => {
    it('returns centered position for 1 string', () => {
      const positions = calculateStringPositions(50, 1, 'equal');
      expect(positions).toEqual([0]);
    });

    it('returns symmetric positions for 2 strings', () => {
      const positions = calculateStringPositions(40, 2, 'equal');
      expect(positions[0]).toBeCloseTo(-20);
      expect(positions[1]).toBeCloseTo(20);
    });

    it('returns uniform spacing for 6 strings', () => {
      const totalWidth = 50;
      const positions = calculateStringPositions(totalWidth, 6, 'equal');
      expect(positions.length).toBe(6);
      expect(positions[0]).toBeCloseTo(-totalWidth / 2);
      expect(positions[5]).toBeCloseTo(totalWidth / 2);
      for (let i = 1; i < positions.length; i++) {
        const step = positions[i] - positions[i - 1];
        expect(step).toBeCloseTo(totalWidth / 5);
      }
    });

    it('handles zero width', () => {
      const positions = calculateStringPositions(0, 3, 'equal');
      expect(positions.every((p) => p === 0)).toBe(true);
    });
  });

  describe('proportional spacing', () => {
    it('produces different positions from equal when gauges vary', () => {
      const equalPositions = calculateStringPositions(50, 3, 'equal');
      const propPositions = calculateStringPositions(50, 3, 'proportional', [0.5, 0.7, 0.9]);
      expect(propPositions).not.toEqual(equalPositions);
    });

    it('falls back to equal when gauges are missing', () => {
      const positions = calculateStringPositions(50, 3, 'proportional');
      const equalPositions = calculateStringPositions(50, 3, 'equal');
      expect(positions).toEqual(equalPositions);
    });

    it('falls back to equal when too few gauges provided', () => {
      const positions = calculateStringPositions(50, 6, 'proportional', [0.5, 0.6]);
      const equalPositions = calculateStringPositions(50, 6, 'equal');
      expect(positions).toEqual(equalPositions);
    });

    it('first and last positions match total width', () => {
      const totalWidth = 50;
      const positions = calculateStringPositions(totalWidth, 4, 'proportional', [0.4, 0.5, 0.5, 0.6]);
      expect(positions[0]).toBeCloseTo(-totalWidth / 2);
      expect(positions[3]).toBeCloseTo(totalWidth / 2);
    });

    it('positions are sorted ascending', () => {
      const positions = calculateStringPositions(50, 5, 'proportional', [0.3, 0.4, 0.5, 0.4, 0.6]);
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThan(positions[i - 1]);
      }
    });
  });
});

describe('gaugesInchesToMm', () => {
  it('converts a single gauge from inches to mm', () => {
    const result = gaugesInchesToMm([0.01]);
    expect(result[0]).toBeCloseTo(0.254);
  });

  it('converts standard string gauges', () => {
    const gauges = gaugesInchesToMm([0.010, 0.013, 0.017, 0.026, 0.036, 0.046]);
    expect(gauges.length).toBe(6);
    expect(gauges[0]).toBeCloseTo(0.254);
    expect(gauges[5]).toBeCloseTo(1.1684);
  });

  it('returns empty array for empty input', () => {
    expect(gaugesInchesToMm([])).toEqual([]);
  });

  it('handles zero gauge', () => {
    const result = gaugesInchesToMm([0]);
    expect(result[0]).toBe(0);
  });
});
