import { LIMITS } from '../../config/constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateNumFrets(value: number): ValidationResult {
  if (!Number.isInteger(value) || value < LIMITS.MIN_FRETS || value > LIMITS.MAX_FRETS) {
    return { valid: false, error: `errors.outOfRange` };
  }
  return { valid: true };
}

export function validateNumStrings(value: number): ValidationResult {
  if (!Number.isInteger(value) || value < LIMITS.MIN_STRINGS || value > LIMITS.MAX_STRINGS) {
    return { valid: false, error: `errors.outOfRange` };
  }
  return { valid: true };
}

export function validateScaleLength(valueMm: number): ValidationResult {
  if (isNaN(valueMm) || valueMm < LIMITS.MIN_SCALE_LENGTH_MM || valueMm > LIMITS.MAX_SCALE_LENGTH_MM) {
    return { valid: false, error: `errors.outOfRange` };
  }
  return { valid: true };
}

export function validatePerpendicularDistance(value: number): ValidationResult {
  if (isNaN(value) || value < LIMITS.MIN_PERPENDICULAR_DISTANCE || value > LIMITS.MAX_PERPENDICULAR_DISTANCE) {
    return { valid: false, error: `errors.outOfRange` };
  }
  return { valid: true };
}

export function validatePositiveNumber(value: number): ValidationResult {
  if (isNaN(value) || value <= 0) {
    return { valid: false, error: `errors.invalidNumber` };
  }
  return { valid: true };
}
