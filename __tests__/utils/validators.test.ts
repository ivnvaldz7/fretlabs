import { describe, it, expect } from 'vitest';
import {
  validateNumFrets,
  validateNumStrings,
  validateScaleLength,
  validatePerpendicularDistance,
  validatePositiveNumber,
} from '../../src/utils/validators';

describe('validateNumFrets', () => {
  it('returns valid for minimum fret count (1)', () => {
    const result = validateNumFrets(1);
    expect(result.valid).toBe(true);
  });

  it('returns valid for maximum fret count (72)', () => {
    const result = validateNumFrets(72);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for 0', () => {
    const result = validateNumFrets(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for 73', () => {
    const result = validateNumFrets(73);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for non-integer', () => {
    const result = validateNumFrets(5.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for negative value', () => {
    const result = validateNumFrets(-5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for NaN', () => {
    const result = validateNumFrets(NaN);
    expect(result.valid).toBe(false);
  });
});

describe('validateNumStrings', () => {
  it('returns valid for minimum string count (1)', () => {
    const result = validateNumStrings(1);
    expect(result.valid).toBe(true);
  });

  it('returns valid for maximum string count (24)', () => {
    const result = validateNumStrings(24);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for 0', () => {
    const result = validateNumStrings(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for 25', () => {
    const result = validateNumStrings(25);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for non-integer', () => {
    const result = validateNumStrings(3.7);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for NaN', () => {
    const result = validateNumStrings(NaN);
    expect(result.valid).toBe(false);
  });
});

describe('validateScaleLength', () => {
  it('returns valid for minimum scale length (100)', () => {
    const result = validateScaleLength(100);
    expect(result.valid).toBe(true);
  });

  it('returns valid for maximum scale length (2000)', () => {
    const result = validateScaleLength(2000);
    expect(result.valid).toBe(true);
  });

  it('returns valid for typical guitar scale (647.7)', () => {
    const result = validateScaleLength(647.7);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for 99 (below min)', () => {
    const result = validateScaleLength(99);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for 2001 (above max)', () => {
    const result = validateScaleLength(2001);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for negative value', () => {
    const result = validateScaleLength(-100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for NaN', () => {
    const result = validateScaleLength(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });
});

describe('validatePerpendicularDistance', () => {
  it('returns valid for 0', () => {
    const result = validatePerpendicularDistance(0);
    expect(result.valid).toBe(true);
  });

  it('returns valid for 1', () => {
    const result = validatePerpendicularDistance(1);
    expect(result.valid).toBe(true);
  });

  it('returns valid for 0.5', () => {
    const result = validatePerpendicularDistance(0.5);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for -0.1', () => {
    const result = validatePerpendicularDistance(-0.1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for 1.1', () => {
    const result = validatePerpendicularDistance(1.1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });

  it('returns invalid for NaN', () => {
    const result = validatePerpendicularDistance(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.outOfRange');
  });
});

describe('validatePositiveNumber', () => {
  it('returns valid for positive number', () => {
    const result = validatePositiveNumber(42);
    expect(result.valid).toBe(true);
  });

  it('returns valid for 0.1', () => {
    const result = validatePositiveNumber(0.1);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for 0', () => {
    const result = validatePositiveNumber(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.invalidNumber');
  });

  it('returns invalid for negative number', () => {
    const result = validatePositiveNumber(-5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.invalidNumber');
  });

  it('returns invalid for NaN', () => {
    const result = validatePositiveNumber(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('errors.invalidNumber');
  });
});
