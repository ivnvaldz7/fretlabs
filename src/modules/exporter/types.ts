import type { Unit } from '../../config/constants';

/**
 * Options passed to every export function.
 * Each exporter only reads the fields relevant to its format.
 */
export interface ExportOptions {
  /** Target file format */
  format: 'svg' | 'dxf' | 'csv' | 'pdf';
  /** Active application locale */
  locale?: string;
  /** Unit for all coordinate / distance values in the exported file */
  unit: Unit;
  /**
   * DXF only: separate geometry into named CAD layers (FRETS, STRINGS, OUTLINE).
   * Defaults to true. When false, everything goes on layer 0.
   */
  layers?: boolean;
  /**
   * SVG/DXF/PDF: extend fret lines until they reach the fretboard outline edges.
   * Defaults to false.
   */
  extendFrets?: boolean;
  /**
   * SVG/PDF: include dimension annotations on the exported file.
   * Defaults to true.
   */
  annotations?: boolean;
  /**
   * CSV only: number of decimal places for distance values.
   * Defaults to the precision appropriate for the chosen unit
   * (mm → 3, cm → 4, in → 5).
   */
  precision?: number;
}
