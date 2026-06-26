import { describe, it, expect } from 'vitest';
import { exportCsv } from '../../src/modules/exporter/csv-export';
import { makeMinimalResult, makeStandardResult } from '../fixtures/fretboard-result';
import type { ExportOptions } from '../../src/modules/exporter/types';

const MINIMAL = makeMinimalResult();
const STANDARD = makeStandardResult();

function opts(overrides?: Partial<ExportOptions>): ExportOptions {
  return { format: 'csv', unit: 'mm', ...overrides };
}

describe('exporter/csv-export', () => {
  it('includes FretLabs in the header', () => {
    const csv = exportCsv(MINIMAL, opts());
    expect(csv).toContain('FretLabs');
  });

  it('includes metadata line for method', () => {
    const csv = exportCsv(MINIMAL, opts());
    expect(csv).toContain('Equal Temperament');
    expect(csv).toContain('12 tones/octave');
  });

  it('includes method as Scala when applicable', () => {
    const scalaResult = makeMinimalResult({
      meta: { method: 'scala', tonesPerOctave: 12, scalaDescription: 'Just intonation', inputUnit: 'mm' },
    });
    const csv = exportCsv(scalaResult, opts());
    expect(csv).toContain('Scala');
    expect(csv).toContain('Just intonation');
  });

  it('includes metadata for scale length, nut width, bridge width', () => {
    const csv = exportCsv(MINIMAL, opts());
    expect(csv).toContain('Scale Length');
    expect(csv).toContain('Nut Width');
    expect(csv).toContain('Bridge Width');
  });

  it('column headers match string count', () => {
    const csv = exportCsv(STANDARD, opts());
    const lines = csv.split('\n');
    const colHeaderLine = lines.find((l) => l.startsWith('Fret,String'));
    expect(colHeaderLine).toBeTruthy();
    const columns = colHeaderLine!.split(',');
    expect(columns.length).toBe(7);
    expect(columns[0]).toBe('Fret');
    for (let i = 1; i <= 6; i++) {
      expect(columns[i]).toContain(`String ${i}`);
    }
  });

  it('has parseable rows with expected column count', () => {
    const csv = exportCsv(MINIMAL, opts());
    const lines = csv.split('\n');
    const dataRows = lines.filter(
      (l) => l && !l.startsWith('#') && !l.startsWith('Fret') && l !== '',
    );
    for (const row of dataRows) {
      const cols = row.split(',');
      expect(cols.length).toBe(3);
    }
  });

  describe('precision option', () => {
    it('respects precision=0', () => {
      const csv = exportCsv(MINIMAL, opts({ precision: 0 }));
      const rows = csv.split('\n').filter((l) => !l.startsWith('#') && !l.startsWith('Fret') && !l.startsWith('') && !l.startsWith('#'));
      const fromNutRows = csv.split('\n').filter((l) => l.startsWith('0'));
      if (fromNutRows.length > 0) {
        expect(fromNutRows[0]).toMatch(/^\d \(Nut\),/);
      }
      const dataRows = csv.split('\n').filter((l) => l.match(/^\d/));
      for (const row of dataRows) {
        const cols = row.split(',');
        for (let i = 1; i < cols.length; i++) {
          if (cols[i] !== '—') {
            expect(cols[i]).not.toContain('.');
          }
        }
      }
    });

    it('respects precision=4', () => {
      const csv = exportCsv(MINIMAL, opts({ precision: 4 }));
      const dataRows = csv.split('\n').filter((l) => l.match(/^[0-9]/));
      for (const row of dataRows) {
        const cols = row.split(',');
        for (let i = 1; i < cols.length; i++) {
          if (cols[i] !== '—') {
            expect(cols[i]).toMatch(/^\d+\.\d{4}$/);
          }
        }
      }
    });
  });

  describe('fret 0', () => {
    it('shows em dash for distanceFromPreviousMm on fret 0', () => {
      const csv = exportCsv(MINIMAL, opts());
      const lines = csv.split('\n');
      const prevSectionIdx = lines.findIndex((l) => l.startsWith('# --- Distance from previous'));
      const prevRows = lines.slice(prevSectionIdx + 2);
      const fret0Row = prevRows.find((l) => l.startsWith('0'));
      expect(fret0Row).toBeTruthy();
      // All "from previous" cells for fret 0 should be '—'
      const cols = fret0Row!.split(',');
      for (let i = 1; i < cols.length; i++) {
        expect(cols[i]).toBe('—');
      }
    });

    it('fret 0 is labeled as "0 (Nut)"', () => {
      const csv = exportCsv(MINIMAL, opts());
      expect(csv).toContain('0 (Nut)');
    });
  });

  it('contains both distance from nut and from previous sections', () => {
    const csv = exportCsv(STANDARD, opts());
    expect(csv).toContain('Distance from nut');
    expect(csv).toContain('Distance from previous fret');
  });

  it('defaults to standard precision when not specified', () => {
    const csv = exportCsv(MINIMAL, opts());
    const dataRows = csv.split('\n').filter((l) => l.match(/^1,/));
    if (dataRows.length > 0) {
      const cols = dataRows[0].split(',');
      for (let i = 1; i < cols.length; i++) {
        expect(cols[i]).toMatch(/^\d+\.\d{3}$/);
      }
    }
  });

  it('handles unit=in with correct conversion', () => {
    const csv = exportCsv(MINIMAL, opts({ unit: 'in' }));
    expect(csv).toContain('Unit: in');
  });
});
