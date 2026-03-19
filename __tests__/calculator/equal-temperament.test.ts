import { describe, it, expect } from 'vitest';
import {
  fretDistanceFromNut,
  allFretDistances,
  fretRatio,
} from '../../src/modules/calculator/equal-temperament';

describe('equal-temperament', () => {
  // Standard 12-TET on a 25.5" (647.7mm) Fender scale
  const SCALE_MM = 647.7;
  const TONES = 12;

  describe('fretDistanceFromNut', () => {
    it('fret 0 (nut) should be 0', () => {
      expect(fretDistanceFromNut(SCALE_MM, 0, TONES)).toBe(0);
    });

    it('fret 12 should be exactly half the scale length', () => {
      const fret12 = fretDistanceFromNut(SCALE_MM, 12, TONES);
      // 12-TET fret 12 = half scale length
      expect(fret12).toBeCloseTo(SCALE_MM / 2, 10);
    });

    it('fret 24 should be 3/4 of the scale length', () => {
      const fret24 = fretDistanceFromNut(SCALE_MM, 24, TONES);
      // Fret 24 = s * (1 - 1/4) = 3/4 scale
      expect(fret24).toBeCloseTo(SCALE_MM * 0.75, 10);
    });

    it('should match known FretFind2D values for 12-TET 25.5"', () => {
      // These ratios are from the FretFind2D reference table
      // Fret 1: PD = 0.05613 → distance = 0.05613 * 647.7 ≈ 36.356
      const fret1 = fretDistanceFromNut(SCALE_MM, 1, TONES);
      expect(fret1 / SCALE_MM).toBeCloseTo(0.05613, 4);

      // Fret 7: PD = 0.33258
      const fret7 = fretDistanceFromNut(SCALE_MM, 7, TONES);
      expect(fret7 / SCALE_MM).toBeCloseTo(0.33258, 4);

      // Fret 12: PD = 0.50000
      const fret12 = fretDistanceFromNut(SCALE_MM, 12, TONES);
      expect(fret12 / SCALE_MM).toBeCloseTo(0.5, 5);
    });

    it('should work with non-standard temperaments (19-TET)', () => {
      const fret19 = fretDistanceFromNut(SCALE_MM, 19, 19);
      // Fret N in N-TET = half scale length (one octave)
      expect(fret19).toBeCloseTo(SCALE_MM / 2, 10);
    });

    it('should work with 24-TET (quarter tones)', () => {
      const fret24 = fretDistanceFromNut(SCALE_MM, 24, 24);
      expect(fret24).toBeCloseTo(SCALE_MM / 2, 10);
    });
  });

  describe('allFretDistances', () => {
    it('should return numFrets + 1 values (including nut)', () => {
      const distances = allFretDistances(SCALE_MM, 22, TONES);
      expect(distances).toHaveLength(23); // 0 through 22
    });

    it('first value should be 0 (nut)', () => {
      const distances = allFretDistances(SCALE_MM, 22, TONES);
      expect(distances[0]).toBe(0);
    });

    it('distances should be monotonically increasing', () => {
      const distances = allFretDistances(SCALE_MM, 22, TONES);
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThan(distances[i - 1]);
      }
    });

    it('no distance should exceed scale length', () => {
      const distances = allFretDistances(SCALE_MM, 36, TONES);
      for (const d of distances) {
        expect(d).toBeLessThan(SCALE_MM);
      }
    });
  });

  describe('fretRatio', () => {
    it('fret 0 ratio should be 0', () => {
      expect(fretRatio(0, TONES)).toBe(0);
    });

    it('fret 12 ratio should be 0.5', () => {
      expect(fretRatio(12, TONES)).toBeCloseTo(0.5, 10);
    });

    it('ratios should match FretFind2D perpendicular distance table', () => {
      expect(fretRatio(1, TONES)).toBeCloseTo(0.05613, 4);
      expect(fretRatio(5, TONES)).toBeCloseTo(0.25085, 4);
      expect(fretRatio(7, TONES)).toBeCloseTo(0.33258, 4);
    });
  });
});
