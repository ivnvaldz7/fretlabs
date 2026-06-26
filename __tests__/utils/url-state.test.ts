import { describe, it, expect } from 'vitest';
import {
  serializeConfigToHash,
  parseConfigFromHash,
  isUrlPayloadV1,
} from '../../src/utils/url-state';
import type { FretboardConfig } from '../../src/modules/calculator/types';

function minimalConfig(): FretboardConfig {
  return {
    scaleLength: {
      mode: 'single',
      fundamentalMm: 647.7,
      perpendicularDistance: 0.5,
    },
    strings: {
      count: 6,
      nutWidthMm: 42.86,
      bridgeWidthMm: 52.39,
      spacing: 'equal',
    },
    calculation: {
      method: 'equal',
      tonesPerOctave: 12,
    },
    numFrets: 22,
    unit: 'mm',
  };
}

describe('serializeConfigToHash / parseConfigFromHash', () => {
  it('serialize → parse is identity (round-trip)', () => {
    const config = minimalConfig();
    const hash = serializeConfigToHash(config);
    const parsed = parseConfigFromHash(hash);
    expect(parsed).not.toBeNull();

    const obj = parsed as Record<string, unknown>;
    expect(obj.v).toBe(1);
    expect((obj.config as Record<string, unknown>).numFrets).toBe(22);
    expect((obj.config as Record<string, unknown>).unit).toBe('mm');
  });

  it('handles multi-scale config', () => {
    const config = minimalConfig();
    config.scaleLength = {
      mode: 'multi',
      fundamentalMm: 647.7,
      lastMm: 685.8,
      perpendicularDistance: 0.5,
    };
    const hash = serializeConfigToHash(config);
    const parsed = parseConfigFromHash(hash) as Record<string, unknown>;
    const scaleCfg = (parsed.config as Record<string, unknown>).scaleLength as Record<string, unknown>;
    expect(scaleCfg.mode).toBe('multi');
    expect(scaleCfg.lastMm).toBe(685.8);
  });

  it('handles scala method with tuning', () => {
    const config = minimalConfig();
    config.calculation = {
      method: 'scala',
      tonesPerOctave: 12,
      scalaContent: '! test\nTest\n12\n100.0\n200.0\n',
      tuning: [0, 2, 4, 5, 7, 9],
    };
    const hash = serializeConfigToHash(config);
    const parsed = parseConfigFromHash(hash) as Record<string, unknown>;
    const calcCfg = (parsed.config as Record<string, unknown>).calculation as Record<string, unknown>;
    expect(calcCfg.method).toBe('scala');
    expect(calcCfg.tuning).toEqual([0, 2, 4, 5, 7, 9]);
  });

  it('output hash starts with #cfg=', () => {
    const config = minimalConfig();
    const hash = serializeConfigToHash(config);
    expect(hash.startsWith('#cfg=')).toBe(true);
  });

  it('generates URL-safe base64 (no + or /)', () => {
    const config = minimalConfig();
    const hash = serializeConfigToHash(config);
    const encoded = hash.slice(5);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });
});

describe('parseConfigFromHash', () => {
  it('returns null for empty hash', () => {
    expect(parseConfigFromHash('')).toBeNull();
  });

  it('returns null for hash without cfg param', () => {
    expect(parseConfigFromHash('#other=abc')).toBeNull();
  });

  it('returns null for malformed base64', () => {
    expect(parseConfigFromHash('#cfg=!!!not-base64!!!')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseConfigFromHash('#cfg=dGVzdA')).toBeNull();
  });

  it('handles hash with leading #', () => {
    const config = minimalConfig();
    const hash = serializeConfigToHash(config);
    const parsed1 = parseConfigFromHash(hash);
    const parsed2 = parseConfigFromHash(hash.slice(1));
    expect(JSON.stringify(parsed1)).toBe(JSON.stringify(parsed2));
  });
});

describe('isUrlPayloadV1', () => {
  it('returns true for valid payload', () => {
    const payload = { v: 1, config: { numFrets: 22 } };
    expect(isUrlPayloadV1(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isUrlPayloadV1(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isUrlPayloadV1('string')).toBe(false);
    expect(isUrlPayloadV1(42)).toBe(false);
    expect(isUrlPayloadV1(undefined)).toBe(false);
  });

  it('returns false for missing version', () => {
    expect(isUrlPayloadV1({ config: {} })).toBe(false);
  });

  it('returns false for wrong version', () => {
    expect(isUrlPayloadV1({ v: 2, config: {} })).toBe(false);
  });

  it('returns false for null config', () => {
    expect(isUrlPayloadV1({ v: 1, config: null })).toBe(false);
  });

  it('returns true when config is an empty object', () => {
    expect(isUrlPayloadV1({ v: 1, config: {} })).toBe(true);
  });
});
