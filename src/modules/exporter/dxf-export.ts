/**
 * DXF export — generates a valid DXF file (AutoCAD 2000, AC1015) without
 * any external libraries. DXF is a plain-text format: every entry is a
 * group code (integer) on one line followed by its value on the next line.
 *
 * Geometry:
 *   • OUTLINE layer — closed POLYLINE (quadrilateral) for the fretboard perimeter
 *   • FRETS layer   — LINE entities for each fret (fret 0 = nut)
 *   • STRINGS layer — LINE entities for each string (nut → bridge)
 *
 * All coordinates are converted from mm to the unit in ExportOptions.
 * $INSUNITS is set so CAD software opens the file at the correct physical size.
 *
 * Reference: AutoCAD DXF Reference (Autodesk), Entities Section, R2000+
 */

import type { FretboardResult } from '../calculator/types';
import type { ExportOptions } from './types';
import { fromMm } from '../../utils/unit-converter';
import type { Unit } from '../../config/constants';
import { extendSegmentToOutline } from '../../utils/extend-line-to-outline';

// ── $INSUNITS values ─────────────────────────────────────────────────────────
// 1 = Inches, 4 = Millimeters, 5 = Centimeters
const INSUNITS: Record<Unit, number> = { mm: 4, in: 1, cm: 5 };

// $MEASUREMENT: 0 = English, 1 = Metric
const MEASUREMENT: Record<Unit, number> = { mm: 1, in: 0, cm: 1 };

// CAD color numbers (ACI palette)
const COLOR_OUTLINE = 7;  // white / black depending on background
const COLOR_FRETS = 5;    // blue
const COLOR_STRINGS = 3;  // green

// DXF coordinate precision (6 decimal places = 0.000001 mm resolution)
const DXF_PRECISION = 6;

// ── Low-level helpers ─────────────────────────────────────────────────────────

/**
 * A DXF group-code entry: two lines — the code and the value.
 * Every piece of DXF content is built from these pairs.
 */
function e(code: number, value: string | number): string {
  return `${code}\n${value}\n`;
}

/** Format a coordinate value to DXF_PRECISION decimal places */
function c(mm: number, unit: Unit): string {
  return fromMm(mm, unit).toFixed(DXF_PRECISION);
}

// ── Section builders ──────────────────────────────────────────────────────────

/**
 * HEADER section — declares the DXF version and unit system.
 */
function buildHeader(unit: Unit): string {
  return [
    e(0, 'SECTION'),
    e(2, 'HEADER'),
    // DXF format version: AC1015 = AutoCAD 2000
    e(9, '$ACADVER'),
    e(1, 'AC1015'),
    // Unit system for the file
    e(9, '$INSUNITS'),
    e(70, INSUNITS[unit]),
    // Measurement system: 0=English, 1=Metric
    e(9, '$MEASUREMENT'),
    e(70, MEASUREMENT[unit]),
    e(0, 'ENDSEC'),
  ].join('');
}

/**
 * One LAYER entry inside the TABLES/LAYER table.
 *
 * @param name   - Layer name (e.g. 'FRETS')
 * @param color  - ACI color number (62 group code)
 */
function buildLayerEntry(name: string, color: number): string {
  return [
    e(0, 'LAYER'),
    e(2, name),
    e(70, 0),         // flags: 0 = on, not frozen, not locked
    e(62, color),     // ACI color
    e(6, 'CONTINUOUS'),
  ].join('');
}

/**
 * TABLES section — declares the three CAD layers.
 */
function buildTables(useLayers: boolean): string {
  if (!useLayers) {
    // No explicit layer declarations needed; everything goes on layer 0
    return [
      e(0, 'SECTION'),
      e(2, 'TABLES'),
      e(0, 'ENDSEC'),
    ].join('');
  }

  return [
    e(0, 'SECTION'),
    e(2, 'TABLES'),
    e(0, 'TABLE'),
    e(2, 'LAYER'),
    e(70, 3),   // 3 layer entries follow
    buildLayerEntry('OUTLINE', COLOR_OUTLINE),
    buildLayerEntry('FRETS', COLOR_FRETS),
    buildLayerEntry('STRINGS', COLOR_STRINGS),
    e(0, 'ENDTAB'),
    e(0, 'ENDSEC'),
  ].join('');
}

// ── Entity builders ───────────────────────────────────────────────────────────

/**
 * A LINE entity connecting two points on the given layer.
 */
function buildLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  layer: string,
  unit: Unit,
): string {
  return [
    e(0, 'LINE'),
    e(8, layer),
    e(10, c(x1, unit)),  // start X
    e(20, c(y1, unit)),  // start Y
    e(30, '0.000000'),   // start Z (always 0 for 2D)
    e(11, c(x2, unit)),  // end X
    e(21, c(y2, unit)),  // end Y
    e(31, '0.000000'),   // end Z
  ].join('');
}

/**
 * A closed POLYLINE/VERTEX/SEQEND sequence for a polygon.
 *
 * POLYLINE with flag 1 (closed) is the DXF R12-compatible way to draw
 * closed polylines. It works in every CAD / CAM application.
 *
 * @param points - Array of {x, y} vertices in mm
 * @param layer  - Layer name
 * @param unit   - Output unit for coordinate conversion
 */
function buildClosedPolyline(
  points: Array<{ x: number; y: number }>,
  layer: string,
  unit: Unit,
): string {
  // POLYLINE header: 66=1 means "vertices follow", 70=1 means closed
  const header = [
    e(0, 'POLYLINE'),
    e(8, layer),
    e(66, 1),  // vertices-follow flag
    e(70, 1),  // closed polyline
  ].join('');

  // One VERTEX entity per point
  const vertices = points.map((pt) =>
    [
      e(0, 'VERTEX'),
      e(8, layer),
      e(10, c(pt.x, unit)),
      e(20, c(pt.y, unit)),
      e(30, '0.000000'),
    ].join(''),
  ).join('');

  // SEQEND marks the end of the vertex list
  const footer = [
    e(0, 'SEQEND'),
    e(8, layer),
  ].join('');

  return header + vertices + footer;
}

/**
 * ENTITIES section — all geometry.
 */
function buildEntities(result: FretboardResult, options: ExportOptions): string {
  const { unit } = options;
  const useLayers = options.layers !== false;
  const extendFrets = options.extendFrets === true;

  const layerOutline = useLayers ? 'OUTLINE' : '0';
  const layerFrets = useLayers ? 'FRETS' : '0';
  const layerStrings = useLayers ? 'STRINGS' : '0';

  // ── Outline: closed quadrilateral ─────────────────────────────────────────
  // Trace perimeter: nut-treble → nut-bass → bridge-bass → bridge-treble
  const { nutFirst, nutLast, bridgeLast, bridgeFirst } = result.outline;
  const outlinePolyline = buildClosedPolyline(
    [nutFirst, nutLast, bridgeLast, bridgeFirst],
    layerOutline,
    unit,
  );

  // ── Frets: one LINE per fret (fret 0 = nut) ──────────────────────────────
  const fretEntities = result.fretLines.map((fl) => {
    const seg = extendFrets
      ? extendSegmentToOutline(fl.x1, fl.y1, fl.x2, fl.y2, result.outline)
      : { x1: fl.x1, y1: fl.y1, x2: fl.x2, y2: fl.y2 };
    return buildLine(seg.x1, seg.y1, seg.x2, seg.y2, layerFrets, unit);
  }).join('');

  // ── Strings: one LINE per string (nut to bridge) ──────────────────────────
  const stringEntities = result.strings.map((sl) =>
    buildLine(sl.nutX, sl.nutY, sl.bridgeX, sl.bridgeY, layerStrings, unit),
  ).join('');

  return [
    e(0, 'SECTION'),
    e(2, 'ENTITIES'),
    outlinePolyline,
    fretEntities,
    stringEntities,
    e(0, 'ENDSEC'),
  ].join('');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a DXF file string from a fretboard calculation.
 *
 * The file is valid AutoCAD 2000 (AC1015) DXF with three optional layers:
 * OUTLINE (closed polyline), FRETS (lines), and STRINGS (lines).
 * It can be imported directly into any CAD/CAM software for CNC machining.
 *
 * @param result  - Complete fretboard calculation result
 * @param options - Export options (unit, layers flag)
 * @returns DXF file content as a string
 */
export function exportDxf(result: FretboardResult, options: ExportOptions): string {
  return [
    buildHeader(options.unit),
    buildTables(options.layers !== false),
    buildEntities(result, options),
    e(0, 'EOF'),
  ].join('');
}
