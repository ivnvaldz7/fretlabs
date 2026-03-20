/**
 * Unit conversion utilities.
 * All internal calculations use mm as the base unit.
 * Conversion happens at the boundaries: input → mm → calculation → mm → display.
 */

import { UNIT_TO_MM, UNIT_PRECISION, type Unit } from '../config/constants';

/**
 * Convert a value from a given unit to mm.
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @returns Value in mm
 */
export function toMm(value: number, fromUnit: Unit): number {
  return value * UNIT_TO_MM[fromUnit];
}

/**
 * Convert a value from mm to a given unit.
 * @param valueMm - The value in mm
 * @param toUnit - The target unit
 * @returns Value in the target unit
 */
export function fromMm(valueMm: number, toUnit: Unit): number {
  return valueMm / UNIT_TO_MM[toUnit];
}

/**
 * Format a mm value for display in a given unit, with appropriate precision.
 * @param valueMm - The value in mm
 * @param unit - The display unit
 * @returns Formatted string
 */
export function formatForDisplay(valueMm: number, unit: Unit): string {
  const converted = fromMm(valueMm, unit);
  return converted.toFixed(UNIT_PRECISION[unit]);
}
