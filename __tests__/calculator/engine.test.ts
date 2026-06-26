import { describe, it, expect } from 'vitest';
import { calculateFretboard } from '../../src/modules/calculator/engine';
import type { FretboardConfig } from '../../src/modules/calculator/types';

const VALID_12TET_SCL = `! 12tet.scl
!
12 tone equal temperament
12
!
100.0
200.
300.
400.
500.
600.
700.
800.
900.
1000.
1100.
2/1`;

function baseConfig(): FretboardConfig {
  return {
    scaleLength: {
      mode: 'single',
      fundamentalMm: 647.7,
      perpendicularDistance: 0.5,
    },
    strings: {
      count: 3,
      nutWidthMm: 42.86,
      bridgeWidthMm: 52.39,
      spacing: 'equal',
    },
    calculation: {
      method: 'scala',
      tonesPerOctave: 12,
      scalaContent: VALID_12TET_SCL,
    },
    numFrets: 5,
    unit: 'mm',
  };
}

describe('calculator/engine', () => {
  it('builds fretPositions as a packed array (strings × frets)', () => {
    const result = calculateFretboard(baseConfig());
    expect(result.strings.length).toBe(3);
    expect(result.fretPositions.length).toBe(3 * (5 + 1));
  });

  it('uses standard full-width fret lines when scala tuning does not vary', () => {
    const cfg = baseConfig();
    cfg.calculation.tuning = [0, 0, 0];
    const result = calculateFretboard(cfg);
    expect(result.fretLines.length).toBe(5 + 1);
    expect(result.fretLines.every((fl) => fl.isPartial === false)).toBe(true);
  });

  it('groups scala frets by absolute degree when tuning varies, producing partial frets', () => {
    const cfg = baseConfig();
    cfg.calculation.tuning = [0, 2, 4];
    const result = calculateFretboard(cfg);

    // Nut + degree-grouped segments; with this tuning, some degrees are only present on 2 of 3 strings.
    expect(result.fretLines.some((fl) => fl.isPartial)).toBe(true);

    const partial = result.fretLines.filter((fl) => fl.isPartial);
    expect(partial.length).toBeGreaterThanOrEqual(1);

    // Degree 3 exists on strings 1-2 but not 3 (fn: 3,1,-1), so it should be partial.
    const fl3 = result.fretLines.find((fl) => fl.fret === 3);
    expect(fl3).toBeTruthy();
    expect(fl3?.isPartial).toBe(true);
  });

  it('does not bridge missing strings: emits one segment per contiguous run', () => {
    const cfg = baseConfig();
    cfg.strings.count = 5;
    cfg.numFrets = 5;
    cfg.calculation.tuning = [0, 0, 10, 0, 0];

    const result = calculateFretboard(cfg);

    // Degree 2 is present on strings 1-2 and 4-5, but not on string 3.
    const segs = result.fretLines.filter((fl) => fl.fret === 2);
    expect(segs.length).toBe(2);

    const topSeg = segs[0];
    const botSeg = segs[1];

    const topMaxY = Math.max(topSeg.y1, topSeg.y2);
    const botMinY = Math.min(botSeg.y1, botSeg.y2);

    // Segments should be separated across the missing middle string.
    expect(topMaxY).toBeLessThan(0);
    expect(botMinY).toBeGreaterThan(0);
  });

  it('applies tuning offset to scala distances per string', () => {
    const cfg = baseConfig();
    cfg.strings.count = 2;
    // Use a non-equal scale so relative fret ratios differ by open degree.
  cfg.calculation.scalaContent = `! just_major.scl
Just major scale
7
!
9/8
5/4
4/3
3/2
5/3
15/8
2/1`;
  cfg.calculation.tuning = [0, 1];
  const result = calculateFretboard(cfg);

    const fretsPerString = cfg.numFrets + 1;
    const s1f1 = result.fretPositions[0 * fretsPerString + 1].distanceFromNutMm;
  const s2f1 = result.fretPositions[1 * fretsPerString + 1].distanceFromNutMm;

  // With an open-degree offset, fret 1 should not match between strings.
  expect(s1f1).not.toBeCloseTo(s2f1, 10);
  });

  it('expands the outline by overhang at nut and bridge', () => {
    const cfg = baseConfig();
    cfg.calculation.method = 'equal';
    cfg.calculation.tonesPerOctave = 12;
    cfg.strings.count = 2;
    cfg.strings.nutWidthMm = 40;
    cfg.strings.bridgeWidthMm = 60;
    cfg.overhang = { mode: 'equal', equalMm: 5 };

    const result = calculateFretboard(cfg);

    // With 2 strings and equal spacing, base nut y positions are [-20, +20] (totalWidth/2).
    // Overhang 5 extends to [-25, +25].
    expect(result.outline.nutFirst.y).toBeCloseTo(-25, 10);
    expect(result.outline.nutLast.y).toBeCloseTo(25, 10);

    // With physical truncation past the 5th fret + 10mm default lastFretExtensionMm:
    // Treble/bass side Y coordinates should be close to -27.66 and +27.66.
    expect(result.outline.bridgeFirst.y).toBeCloseTo(-27.66, 2);
    expect(result.outline.bridgeLast.y).toBeCloseTo(27.66, 2);
  });
});
