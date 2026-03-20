/**
 * CSV export — generates a fret position table as comma-separated values.
 *
 * Output structure:
 *   • Metadata header (# comment lines with method, unit, fret/string counts)
 *   • Section 1 — "Distance from nut" — one column per string
 *   • Blank line separator
 *   • Section 2 — "Distance from previous fret" — same layout
 *
 * All distances are converted from mm to the unit specified in ExportOptions.
 * For single-scale instruments all string columns are identical; they are
 * still included so the file structure is consistent across designs.
 */

import type { FretboardResult } from '../calculator/types';
import type { ExportOptions } from './types';
import { fromMm } from '../../utils/unit-converter';
import { UNIT_PRECISION } from '../../config/constants';

/**
 * Generate a CSV fret position table.
 *
 * @param result - Complete fretboard calculation result
 * @param options - Export options (unit and optional precision)
 * @returns CSV file content as a string
 */
export function exportCsv(result: FretboardResult, options: ExportOptions): string {
  const { unit } = options;
  const precision = options.precision ?? UNIT_PRECISION[unit];

  const { fretPositions, fretLines, strings: stringLines } = result;

  const numStrings = stringLines.length;
  // fretLines includes fret 0 (nut), so numFrets = fretLines.length - 1
  const fretsPerString = fretLines.length;

  // Convert a mm value to the output unit, formatted to the chosen precision
  const fmt = (mm: number): string => fromMm(mm, unit).toFixed(precision);

  // ── Metadata header ───────────────────────────────────────────────────────

  const method = result.meta.method === 'equal'
    ? `Equal Temperament (${result.meta.tonesPerOctave ?? 12} tones/octave)`
    : `Scala — ${result.meta.scalaDescription ?? 'custom'}`;

  const numFrets = fretsPerString - 1;

  const header = [
    `# FretLabs — Fret Position Table`,
    `# Method: ${method}`,
    `# Frets: ${numFrets} | Strings: ${numStrings} | Unit: ${unit}`,
  ];

  // ── Column headers ────────────────────────────────────────────────────────

  const stringHeaders = Array.from(
    { length: numStrings },
    (_, i) => `String ${i + 1} (${unit})`,
  );

  const columnHeader = ['Fret', ...stringHeaders].join(',');

  // ── Build per-fret rows ───────────────────────────────────────────────────
  // fretPositions layout: string 0 frets 0..N, string 1 frets 0..N, …
  // Index formula: stringIndex * fretsPerString + fretIndex

  const fromNutRows: string[] = [];
  const fromPrevRows: string[] = [];

  for (let fn = 0; fn < fretsPerString; fn++) {
    // Fret label: "0 (Nut)" for fret 0, number for the rest
    const fretLabel = fn === 0 ? '0 (Nut)' : String(fn);

    const fromNutCells: string[] = [fretLabel];
    const fromPrevCells: string[] = [fretLabel];

    for (let si = 0; si < numStrings; si++) {
      const fp = fretPositions[si * fretsPerString + fn];
      fromNutCells.push(fmt(fp.distanceFromNutMm));
      fromPrevCells.push(fn === 0 ? '—' : fmt(fp.distanceFromPreviousMm));
    }

    fromNutRows.push(fromNutCells.join(','));
    fromPrevRows.push(fromPrevCells.join(','));
  }

  // ── Assemble output ───────────────────────────────────────────────────────

  const lines: string[] = [
    ...header,
    '',
    '# --- Distance from nut ---',
    columnHeader,
    ...fromNutRows,
    '',
    '# --- Distance from previous fret ---',
    columnHeader,
    ...fromPrevRows,
  ];

  return lines.join('\n');
}
