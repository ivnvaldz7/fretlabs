import { describe, it, expect } from 'vitest';
import { exportDxf } from '../../src/modules/exporter/dxf-export';
import { makeMinimalResult } from '../fixtures/fretboard-result';
import type { ExportOptions } from '../../src/modules/exporter/types';

const RESULT = makeMinimalResult();

function opts(overrides?: Partial<ExportOptions>): ExportOptions {
  return { format: 'dxf', unit: 'mm', layers: true, ...overrides };
}

describe('exporter/dxf-export', () => {
  it('starts with 0 SECTION', () => {
    const dxf = exportDxf(RESULT, opts());
    expect(dxf.startsWith('0\nSECTION')).toBe(true);
  });

  it('ends with 0 EOF', () => {
    const dxf = exportDxf(RESULT, opts());
    expect(dxf.trimEnd().endsWith('0\nEOF')).toBe(true);
  });

  it('includes HEADER section', () => {
    const dxf = exportDxf(RESULT, opts());
    expect(dxf).toContain('SECTION\n2\nHEADER');
  });

  it('sets $INSUNITS to 4 for mm', () => {
    const dxf = exportDxf(RESULT, opts({ unit: 'mm' }));
    const lines = dxf.split('\n');
    const insIdx = lines.indexOf('$INSUNITS');
    expect(lines[insIdx + 1]).toBe('70');
    expect(lines[insIdx + 2]).toBe('4');
  });

  it('sets $INSUNITS to 1 for inches', () => {
    const dxf = exportDxf(RESULT, opts({ unit: 'in' }));
    const lines = dxf.split('\n');
    const insIdx = lines.indexOf('$INSUNITS');
    expect(lines[insIdx + 2]).toBe('1');
  });

  it('sets $INSUNITS to 5 for cm', () => {
    const dxf = exportDxf(RESULT, opts({ unit: 'cm' }));
    const lines = dxf.split('\n');
    const insIdx = lines.indexOf('$INSUNITS');
    expect(lines[insIdx + 2]).toBe('5');
  });

  it('includes ENTITIES section', () => {
    const dxf = exportDxf(RESULT, opts());
    expect(dxf).toContain('SECTION\n2\nENTITIES');
  });

  describe('layers', () => {
    it('includes layer definitions when layers=true', () => {
      const dxf = exportDxf(RESULT, opts({ layers: true }));
      expect(dxf).toContain('LAYER\n2\nOUTLINE');
      expect(dxf).toContain('LAYER\n2\nFRETS');
      expect(dxf).toContain('LAYER\n2\nSTRINGS');
    });

    it('does not include named layer definitions when layers=false', () => {
      const dxf = exportDxf(RESULT, opts({ layers: false }));
      expect(dxf).not.toContain('LAYER\nOUTLINE');
      expect(dxf).not.toContain('LAYER\nFRETS');
      expect(dxf).not.toContain('LAYER\nSTRINGS');
    });

    it('uses layer 0 when layers=false', () => {
      const dxf = exportDxf(RESULT, opts({ layers: false }));
      const lineLayer = dxf.split('\n').filter((_, i, arr) => arr[i - 1] === '8');
      expect(lineLayer.every((l) => l === '0')).toBe(true);
    });
  });

  describe('geometry', () => {
    it('includes a POLYLINE for the outline', () => {
      const dxf = exportDxf(RESULT, opts());
      expect(dxf).toContain('POLYLINE');
      expect(dxf).toContain('VERTEX');
      expect(dxf).toContain('SEQEND');
    });

    it('includes LINE entities for frets', () => {
      const dxf = exportDxf(RESULT, opts());
      const lineCount = dxf.split('\n').filter((l) => l === 'LINE').length;
      expect(lineCount).toBeGreaterThanOrEqual(2);
    });

    it('includes LINE entities for strings', () => {
      const dxf = exportDxf(RESULT, opts());
      const stringLines = dxf.split('\n').filter((l) => l === 'STRINGS');
      expect(stringLines.length).toBeGreaterThanOrEqual(2);
    });

    it('converts coordinates to inches when unit=in', () => {
      const result = makeMinimalResult({
        outline: {
          nutFirst: { x: 0, y: -25.4 },
          nutLast: { x: 0, y: 25.4 },
          bridgeFirst: { x: 254, y: -25.4 },
          bridgeLast: { x: 254, y: 25.4 },
        },
      });
      const dxf = exportDxf(result, opts({ unit: 'in' }));
      expect(dxf).toContain('-1.000000');
      expect(dxf).toContain('1.000000');
      expect(dxf).toContain('10.000000');
    });
  });
});
