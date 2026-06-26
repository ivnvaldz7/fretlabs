import type { FretboardResult } from '../../src/modules/calculator/types';

export function makeMinimalResult(
  overrides?: Partial<FretboardResult>,
): FretboardResult {
  return {
    fretPositions: [
      { fret: 0, string: 0, distanceFromNutMm: 0, distanceFromPreviousMm: 0, x: 0, y: -10, isPartial: false },
      { fret: 0, string: 1, distanceFromNutMm: 0, distanceFromPreviousMm: 0, x: 0, y: 10, isPartial: false },
      { fret: 1, string: 0, distanceFromNutMm: 36.35, distanceFromPreviousMm: 36.35, x: 36.35, y: -10, isPartial: false },
      { fret: 1, string: 1, distanceFromNutMm: 36.35, distanceFromPreviousMm: 36.35, x: 36.35, y: 10, isPartial: false },
    ],
    fretLines: [
      { fret: 0, x1: 0, y1: -10, x2: 0, y2: 10, isPartial: false },
      { fret: 1, x1: 36.35, y1: -10, x2: 36.35, y2: 10, isPartial: false },
    ],
    strings: [
      { index: 0, nutX: 0, nutY: -10, bridgeX: 647.7, bridgeY: -10, scaleLengthMm: 647.7 },
      { index: 1, nutX: 0, nutY: 10, bridgeX: 647.7, bridgeY: 10, scaleLengthMm: 647.7 },
    ],
    outline: {
      nutFirst: { x: 0, y: -15 },
      nutLast: { x: 0, y: 15 },
      bridgeFirst: { x: 647.7, y: -15 },
      bridgeLast: { x: 647.7, y: 15 },
    },
    meta: { method: 'equal', tonesPerOctave: 12, inputUnit: 'mm' },
    ...overrides,
  };
}

export function makeStandardResult(): FretboardResult {
  const numFrets = 24;
  const numStrings = 6;
  const scaleLength = 647.7;
  const stringSpacing = 10;
  const startY = -((numStrings - 1) * stringSpacing) / 2;

  const fretPositions = [];
  const fretLines = [];
  const strings = [];

  for (let s = 0; s < numStrings; s++) {
    const y = startY + s * stringSpacing;
    strings.push({
      index: s,
      nutX: 0,
      nutY: y,
      bridgeX: scaleLength,
      bridgeY: y,
      scaleLengthMm: scaleLength,
    });
    for (let f = 0; f <= numFrets; f++) {
      const d = scaleLength * (1 - 1 / Math.pow(2, f / 12));
      const prev = f > 0 ? scaleLength * (1 - 1 / Math.pow(2, (f - 1) / 12)) : 0;
      fretPositions.push({
        fret: f,
        string: s,
        distanceFromNutMm: d,
        distanceFromPreviousMm: d - prev,
        x: d,
        y,
        isPartial: false,
      });
    }
  }

  for (let f = 0; f <= numFrets; f++) {
    const d = f === 0 ? 0 : scaleLength * (1 - 1 / Math.pow(2, f / 12));
    fretLines.push({
      fret: f,
      x1: d,
      y1: startY,
      x2: d,
      y2: startY + (numStrings - 1) * stringSpacing,
      isPartial: false,
    });
  }

  return {
    fretPositions,
    fretLines,
    strings,
    outline: {
      nutFirst: { x: 0, y: startY - 5 },
      nutLast: { x: 0, y: startY + (numStrings - 1) * stringSpacing + 5 },
      bridgeFirst: { x: scaleLength, y: startY - 5 },
      bridgeLast: { x: scaleLength, y: startY + (numStrings - 1) * stringSpacing + 5 },
    },
    meta: { method: 'equal', tonesPerOctave: 12, inputUnit: 'mm' },
  };
}

export function makeScalaResult(): FretboardResult {
  return makeMinimalResult({
    meta: { method: 'scala', tonesPerOctave: 12, scalaDescription: 'Just intonation', inputUnit: 'mm' },
  });
}
