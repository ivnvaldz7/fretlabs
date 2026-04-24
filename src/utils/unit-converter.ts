/**
 * Unit conversion utilities.
 * All internal calculations use mm as the base unit.
 * Conversion happens at the boundaries: input → mm → calculation → mm → display.
 */

import {
  UNIT_TO_MM,
  UNIT_PRECISION,
  ROUNDING_DENOMINATOR,
  type Unit,
  type DisplayPrecision,
} from '../config/constants';

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
 * Round a value to a specific fraction of an inch.
 * Only applies to inch display - mm/cm always show exact values.
 * @param value - The value in inches
 * @param precision - The rounding precision option
 * @returns Rounded value in inches
 */
export function roundToInchFraction(value: number, precision: DisplayPrecision): number {
  if (precision === 'exact') return value;

  const denom = ROUNDING_DENOMINATOR[precision];
  if (denom === 0) return value;

  return Math.round(value * denom) / denom;
}

/**
 * Format a mm value for display with optional rounding.
 * @param valueMm - The value in mm
 * @param unit - The display unit
 * @param precision - Optional rounding (only applies to inches)
 * @returns Formatted string
 */
export function formatForDisplay(
  valueMm: number,
  unit: Unit,
  precision: DisplayPrecision = 'exact',
): string {
  let converted = fromMm(valueMm, unit);

  if (unit === 'in' && precision !== 'exact') {
    converted = roundToInchFraction(converted, precision);
    const denom = ROUNDING_DENOMINATOR[precision];
    if (denom > 0) {
      const wholePart = Math.floor(converted);
      const fracPart = converted - wholePart;
      if (fracPart < 0.0001) {
        return wholePart.toString();
      }
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const num = fracPart * denom;
      const d = gcd(Math.round(num), denom);
      const numerator = Math.round(num) / d;
      const denominator = denom / d;
      if (denominator === 1) {
        return (wholePart + numerator).toString();
      }
      if (wholePart === 0) {
        return `${numerator}/${denominator}`;
      }
      return `${wholePart} ${numerator % denominator}/${denominator}`;
    }
  }

  return converted.toFixed(UNIT_PRECISION[unit]);
}
