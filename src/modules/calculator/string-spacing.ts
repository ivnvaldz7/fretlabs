/**
 * String spacing calculations.
 *
 * Equal spacing: strings are evenly distributed center-to-center.
 * Proportional spacing: accounts for string diameter so the visible
 * gap between strings is uniform.
 */

import type { SpacingMode } from './types';

/**
 * Calculate string positions along a line (nut or bridge).
 * Returns positions as distances from the centerline.
 *
 * @param totalWidthMm - Total width from first to last string center
 * @param numStrings - Number of strings
 * @param mode - Spacing mode
 * @param gaugesMm - String gauges in mm (required for proportional mode)
 * @returns Array of positions in mm from centerline (negative = first string side)
 */
export function calculateStringPositions(
  totalWidthMm: number,
  numStrings: number,
  mode: SpacingMode,
  gaugesMm?: number[],
): number[] {
  if (numStrings === 1) return [0];

  if (mode === 'equal' || !gaugesMm || gaugesMm.length < numStrings) {
    return equalSpacing(totalWidthMm, numStrings);
  }

  return proportionalSpacing(totalWidthMm, numStrings, gaugesMm);
}

/**
 * Equal spacing: evenly distributed center-to-center.
 */
function equalSpacing(totalWidthMm: number, numStrings: number): number[] {
  const positions: number[] = [];
  const step = totalWidthMm / (numStrings - 1);
  const halfWidth = totalWidthMm / 2;

  for (let i = 0; i < numStrings; i++) {
    // First string at -halfWidth, last at +halfWidth
    positions.push(-halfWidth + i * step);
  }

  return positions;
}

/**
 * Proportional spacing: the empty space between each pair of strings is equal.
 * This accounts for string diameter so thicker strings don't appear closer together.
 *
 * The formula ensures that the gap (edge-to-edge) between all adjacent strings is the same.
 */
function proportionalSpacing(
  totalWidthMm: number,
  numStrings: number,
  gaugesMm: number[],
): number[] {
  // Total diameter of all "inner" gaps:
  // Total available gap = totalWidth - sum of half of first gauge - sum of half of last gauge
  // For each pair, the center-to-center distance = gap + (gauge_i + gauge_i+1) / 2
  const totalInnerDiameter = gaugesMm
    .slice(0, numStrings)
    .reduce((sum, g, i) => {
      if (i === 0 || i === numStrings - 1) return sum;
      return sum + g;
    }, 0);

  const outerHalf = (gaugesMm[0] + gaugesMm[numStrings - 1]) / 2;
  const totalGapSpace = totalWidthMm - outerHalf - totalInnerDiameter;
  const gapPerPair = totalGapSpace / (numStrings - 1);

  const positions: number[] = [];
  const halfWidth = totalWidthMm / 2;
  let current = -halfWidth;

  for (let i = 0; i < numStrings; i++) {
    positions.push(current);
    if (i < numStrings - 1) {
      // Center-to-center = gap + half of this gauge + half of next gauge
      current += gapPerPair + (gaugesMm[i] + gaugesMm[i + 1]) / 2;
    }
  }

  return positions;
}

/**
 * Convert string gauges from inches (the standard unit) to mm.
 */
export function gaugesInchesToMm(gaugesInches: number[]): number[] {
  return gaugesInches.map((g) => g * 25.4);
}
