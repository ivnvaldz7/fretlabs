import { describe, it, expect } from 'vitest';
import {
  toMm,
  fromMm,
  roundToInchFraction,
  formatForDisplay,
  toDisplayValue,
  parseToMm,
} from '../../src/utils/unit-converter';

describe('toMm', () => {
  it('converts inches to mm', () => {
    expect(toMm(1, 'in')).toBeCloseTo(25.4);
  });

  it('converts cm to mm', () => {
    expect(toMm(1, 'cm')).toBe(10);
  });

  it('returns mm unchanged', () => {
    expect(toMm(42, 'mm')).toBe(42);
  });

  it('handles zero', () => {
    expect(toMm(0, 'in')).toBe(0);
  });

  it('converts fractional inches to mm', () => {
    expect(toMm(0.5, 'in')).toBeCloseTo(12.7);
  });
});

describe('fromMm', () => {
  it('converts mm to inches', () => {
    expect(fromMm(25.4, 'in')).toBeCloseTo(1);
  });

  it('converts mm to cm', () => {
    expect(fromMm(10, 'cm')).toBe(1);
  });

  it('returns mm unchanged', () => {
    expect(fromMm(42, 'mm')).toBe(42);
  });

  it('converts zero mm to any unit as zero', () => {
    expect(fromMm(0, 'in')).toBe(0);
    expect(fromMm(0, 'cm')).toBe(0);
  });
});

describe('roundToInchFraction', () => {
  it('returns exact value unchanged', () => {
    expect(roundToInchFraction(1.2345, 'exact')).toBe(1.2345);
  });

  it('rounds to nearest 1/16', () => {
    const result = roundToInchFraction(1.0625, '16th');
    expect(result).toBeCloseTo(1.0625, 4);
  });

  it('rounds to nearest whole number', () => {
    const result = roundToInchFraction(25.7, 'whole');
    expect(result).toBe(26);
  });

  it('rounds to nearest 2th (half)', () => {
    const result = roundToInchFraction(1.3, '2th');
    expect(result).toBeCloseTo(1.5, 4);
  });

  it('rounds to nearest 128th', () => {
    const result = roundToInchFraction(1.0 / 128, '128th');
    expect(result).toBeCloseTo(1.0 / 128, 6);
  });
});

describe('formatForDisplay', () => {
  it('formats mm with 3 decimal places', () => {
    const result = formatForDisplay(647.7, 'mm');
    expect(result).toBe('647.700');
  });

  it('formats cm with 4 decimal places', () => {
    const result = formatForDisplay(647.7, 'cm');
    expect(result).toBe('64.7700');
  });

  it('formats inches with 5 decimal places when exact', () => {
    const result = formatForDisplay(25.4, 'in', 'exact');
    expect(result).toBe('1.00000');
  });

  it('formats inches as fraction when precision is set', () => {
    const result = formatForDisplay(12.7, 'in', '4th');
    expect(result).toMatch(/\d/);
  });

  it('returns whole number when fraction rounds to zero', () => {
    const result = formatForDisplay(25.4 * 2, 'in', 'whole');
    expect(result).toBe('2');
  });

  it('returns fraction without whole part when value is less than 1', () => {
    const mmValue = 25.4 * 0.5; // 0.5 inches
    const result = formatForDisplay(mmValue, 'in', '2th');
    expect(result).toBe('1/2');
  });

  it('returns mixed fraction when value is greater than 1 with fraction', () => {
    const mmValue = 25.4 * 1.75; // 1.75 inches
    const result = formatForDisplay(mmValue, 'in', '4th');
    expect(result).toBe('1 3/4');
  });
});

describe('toDisplayValue', () => {
  it('formats mm value for display in mm', () => {
    const result = toDisplayValue(647.7, 'mm');
    expect(result).toMatch(/^647\.7/);
  });

  it('formats mm value for display in inches', () => {
    const result = toDisplayValue(25.4, 'in');
    expect(result).toMatch(/^1\.0/);
  });

  it('formats mm value for display in cm', () => {
    const result = toDisplayValue(100, 'cm');
    expect(result).toMatch(/^10\.0/);
  });
});

describe('parseToMm', () => {
  it('parses valid mm string', () => {
    expect(parseToMm('647.7', 'mm')).toBe(647.7);
  });

  it('parses valid inch string', () => {
    const result = parseToMm('25.5', 'in');
    expect(result).toBeCloseTo(647.7, 1);
  });

  it('parses valid cm string', () => {
    expect(parseToMm('10', 'cm')).toBe(100);
  });

  it('returns null for invalid input', () => {
    expect(parseToMm('abc', 'mm')).toBeNull();
  });

  it('returns null for negative values', () => {
    expect(parseToMm('-5', 'mm')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseToMm('', 'mm')).toBeNull();
  });

  it('returns 0 for zero', () => {
    expect(parseToMm('0', 'mm')).toBe(0);
  });
});
