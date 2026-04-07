import { describe, it, expect } from 'vitest';
import { exportPdfHtml } from '../../src/modules/exporter/pdf-export';
import type { FretboardResult } from '../../src/modules/calculator/types';

describe('exporter/pdf-export', () => {
  it('generates a standalone HTML document with embedded SVG', () => {
    const result: FretboardResult = {
      fretPositions: [
        { fret: 0, string: 0, distanceFromNutMm: 0, distanceFromPreviousMm: 0, x: 0, y: -10, isPartial: false },
        { fret: 0, string: 1, distanceFromNutMm: 0, distanceFromPreviousMm: 0, x: 0, y: 10, isPartial: false },
      ],
      fretLines: [
        { fret: 0, x1: 0, y1: -10, x2: 0, y2: 10, isPartial: false },
      ],
      strings: [
        { index: 0, nutX: 0, nutY: -10, bridgeX: 100, bridgeY: -10, scaleLengthMm: 100 },
        { index: 1, nutX: 0, nutY: 10, bridgeX: 100, bridgeY: 10, scaleLengthMm: 100 },
      ],
      outline: {
        nutFirst: { x: 0, y: -10 },
        nutLast: { x: 0, y: 10 },
        bridgeFirst: { x: 100, y: -10 },
        bridgeLast: { x: 100, y: 10 },
      },
      meta: { method: 'equal', tonesPerOctave: 12, inputUnit: 'mm' },
    };

    const html = exportPdfHtml(result, { format: 'pdf', unit: 'mm', layers: true });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<svg');
    expect(html).toContain('window.print');
  });
});

