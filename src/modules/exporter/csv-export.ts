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
 */

import type { FretboardResult } from '../calculator/types';
import type { ExportOptions } from './types';
import { fromMm } from '../../utils/unit-converter';
import { UNIT_PRECISION } from '../../config/constants';
import { lineLength } from '../../utils/geometry';

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

  const { fretPositions, strings: stringLines, outline } = result;

  const numStrings = stringLines.length;
  const fretsPerString = Math.floor(fretPositions.length / Math.max(1, numStrings));

  const fmt = (mm: number): string => fromMm(mm, unit).toFixed(precision);

  // ── Metadata header ─────────────────────────────────────────────────────

  const method = result.meta.method === 'equal'
    ? `Equal Temperament (${result.meta.tonesPerOctave ?? 12} tones/octave)`
    : `Scala — ${result.meta.scalaDescription ?? 'custom'}`;

  const numFrets = fretsPerString - 1;

  // Calculate nut and bridge widths (Euclidean — handles both single-scale and fan-fret)
  const nutWidth = lineLength(outline.nutFirst.x, outline.nutFirst.y, outline.nutLast.x, outline.nutLast.y);
  const bridgeWidth = lineLength(outline.bridgeFirst.x, outline.bridgeFirst.y, outline.bridgeLast.x, outline.bridgeLast.y);
  const scaleLength = stringLines[0]?.scaleLengthMm ?? 0;

  const header = [
    `# FretLabs — Fret Position Table`,
    `# Method: ${method}`,
    `# Scale Length: ${fmt(scaleLength)} ${unit}`,
    `# Nut Width: ${fmt(nutWidth)} ${unit} | Bridge Width: ${fmt(bridgeWidth)} ${unit}`,
    `# Frets: ${numFrets} | Strings: ${numStrings} | Unit: ${unit}`,
  ];

  // ── Column headers ────────────────────────────────────────────────────────

  const stringHeaders = Array.from(
    { length: numStrings },
    (_, i) => `String ${i + 1} (${unit})`,
  );

  const columnHeader = ['Fret', ...stringHeaders].join(',');

  // ── Build per-fret rows ───────────────────────────────────────────

  const fromNutRows: string[] = [];
  const fromPrevRows: string[] = [];

  for (let fn = 0; fn < fretsPerString; fn++) {
    const fretLabel = fn === 0 ? '0 (Nut)' : String(fn);

    const fromNutCells: string[] = [fretLabel];
    const fromPrevCells: string[] = [fretLabel];

    for (let si = 0; si < numStrings; si++) {
      const fp = fretPositions[si * fretsPerString + fn];
      if (fp) {
        fromNutCells.push(fmt(fp.distanceFromNutMm));
        fromPrevCells.push(fn === 0 ? '—' : fmt(fp.distanceFromPreviousMm));
      } else {
        fromNutCells.push('');
        fromPrevCells.push('');
      }
    }

    fromNutRows.push(fromNutCells.join(','));
    fromPrevRows.push(fromPrevCells.join(','));
  }

  // ── Assemble output ───────────────────────────────────────────────

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