/**
 * Geometry helpers for converting calculator coordinates to SVG viewport.
 *
 * Calculator coordinates are in mm (model space).
 * The SVG uses a viewBox in mm so 1 SVG unit = 1mm. Scaling to screen
 * pixels is handled by the browser via the SVG element's width/height.
 *
 * This keeps the coordinate system consistent with real-world dimensions
 * and makes SVG/DXF export trivial: file coordinates are already mm values.
 */

import type { FretboardResult } from '../calculator/types';

/** Default padding around the fretboard design in mm */
export const SVG_PADDING_MM = 20;

/** Computed SVG viewport data derived from a FretboardResult */
export interface SvgViewport {
  /** SVG viewBox attribute string: "minX minY width height" */
  viewBox: string;
  /** Left edge of the viewBox in mm */
  minX: number;
  /** Top edge of the viewBox in mm */
  minY: number;
  /** Total viewBox width in mm */
  width: number;
  /** Total viewBox height in mm */
  height: number;
  /** Width / height aspect ratio */
  aspectRatio: number;
}

/**
 * Compute the bounding box of the fretboard outline corners (in mm).
 * Uses only the four outline corners rather than all fret positions,
 * which is sufficient because the outline always contains all geometry.
 */
function computeBoundingBox(result: FretboardResult): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { nutFirst, nutLast, bridgeFirst, bridgeLast } = result.outline;
  const xs = [nutFirst.x, nutLast.x, bridgeFirst.x, bridgeLast.x];
  const ys = [nutFirst.y, nutLast.y, bridgeFirst.y, bridgeLast.y];

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Compute the SVG viewBox and aspect ratio from a FretboardResult.
 *
 * The coordinate system uses mm directly — no unit conversion needed here.
 * Padding is added uniformly around the fretboard bounding box.
 *
 * @param result - Calculated fretboard data
 * @param paddingMm - Padding around the design in mm (default: SVG_PADDING_MM)
 * @returns SvgViewport with viewBox string, dimensions, and aspect ratio
 */
export function computeSvgViewport(
  result: FretboardResult,
  paddingMm: number = SVG_PADDING_MM,
): SvgViewport {
  const bb = computeBoundingBox(result);

  const minX = bb.minX - paddingMm;
  const minY = bb.minY - paddingMm;
  const width = bb.maxX - bb.minX + paddingMm * 2;
  const height = bb.maxY - bb.minY + paddingMm * 2;

  return {
    viewBox: `${minX} ${minY} ${width} ${height}`,
    minX,
    minY,
    width,
    height,
    aspectRatio: width / height,
  };
}
