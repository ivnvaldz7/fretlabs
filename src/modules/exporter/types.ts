import type { Unit } from '../../config/constants';

/**
 * Options passed to every export function.
 * Each exporter only reads the fields relevant to its format.
 */
export interface ExportOptions {
  /** Target file format */
  format: 'svg' | 'dxf' | 'csv';
  /** Unit for all coordinate / distance values in the exported file */
  unit: Unit;
  /**
   * DXF only: separate geometry into named CAD layers (FRETS, STRINGS, OUTLINE).
   * Defaults to true. When false, everything goes on layer 0.
   */
  layers?: boolean;
  /**
   * CSV only: number of decimal places for distance values.
   * Defaults to the precision appropriate for the chosen unit
   * (mm → 3, cm → 4, in → 5).
   */
  precision?: number;
}
