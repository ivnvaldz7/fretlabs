/**
 * useFretboard — the central state hook for the fretboard designer.
 *
 * Holds FretboardConfig state, runs the calculator on every config change
 * (via useMemo), and exposes typed setters for each config section.
 *
 * The calculation runs synchronously in the browser. At typical sizes
 * (≤72 frets × 24 strings) it completes well under 1ms, so no debouncing
 * or worker is needed.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { calculateFretboard } from '../modules/calculator/engine';
import { ScalaParseError } from '../modules/calculator/scala-parser';
import type {
  FretboardConfig,
  FretboardResult,
  ScaleLengthConfig,
  StringConfig,
  CalculationConfig,
  OverhangConfig,
  CompensationConfig,
} from '../modules/calculator/types';
import type { Unit } from '../config/constants';
import {
  DEFAULTS,
  LIMITS,
  WARN_MAX_FRETS,
  WARN_MAX_STRINGS,
  WARN_MIN_SCALE_LENGTH,
  WARN_MAX_SCALE_LENGTH,
} from '../config/constants';
import { useLocale } from './useLocale';
import type { InstrumentPreset } from '../config/presets';
import { isUrlPayloadV1, parseConfigFromHash, serializeConfigToHash } from '../utils/url-state';

// ── Undo/redo constants ──────────────────────────────────────────────────────
const MAX_HISTORY = 50;
const COALESCE_MS = 300;

// ── Default config (Fender Stratocaster, equal temperament, mm) ─────────────

function defaultGaugesInches(numStrings: number): number[] {
  // Pragmatic default: light electric guitar-ish; repeated/truncated to fit.
  // Users can override per-string in the UI when proportional spacing is enabled.
  const base = [0.010, 0.013, 0.017, 0.026, 0.036, 0.046, 0.056, 0.065];
  if (numStrings <= base.length) return base.slice(0, numStrings);
  const last = base[base.length - 1];
  return [...base, ...Array<number>(numStrings - base.length).fill(last)];
}

const DEFAULT_CONFIG: FretboardConfig = {
  scaleLength: {
    mode: 'single',
    fundamentalMm: DEFAULTS.SCALE_LENGTH_MM,
    perpendicularDistance: DEFAULTS.PERPENDICULAR_DISTANCE,
  },
  strings: {
    count: DEFAULTS.NUM_STRINGS,
    nutWidthMm: DEFAULTS.NUT_WIDTH_MM,
    bridgeWidthMm: DEFAULTS.BRIDGE_WIDTH_MM,
    spacing: 'equal',
  },
  calculation: {
    method: 'equal',
    tonesPerOctave: 12,
  },
  overhang: {
    mode: 'equal',
    equalMm: DEFAULTS.OVERHANG_MM,
    nutExtensionMm: DEFAULTS.NUT_EXTENSION_MM,
    lastFretExtensionMm: DEFAULTS.LAST_FRET_EXTENSION_MM,
  },
  numFrets: DEFAULTS.NUM_FRETS,
  unit: DEFAULTS.UNIT,
};

// ── Public API ──────────────────────────────────────────────────────────────

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function clampNumber(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  const v = Math.trunc(n);
  return Math.min(max, Math.max(min, v));
}

function sanitizeLoadedConfig(raw: unknown): FretboardConfig | null {
  if (!isRecord(raw)) return null;

  const out: FretboardConfig = structuredClone(DEFAULT_CONFIG);

  // unit
  if (raw.unit === 'mm' || raw.unit === 'in' || raw.unit === 'cm') out.unit = raw.unit;

  // num frets
  out.numFrets = clampInt(raw.numFrets, LIMITS.MIN_FRETS, LIMITS.MAX_FRETS, out.numFrets);

  // strings
  if (isRecord(raw.strings)) {
    out.strings.count = clampInt(raw.strings.count, LIMITS.MIN_STRINGS, LIMITS.MAX_STRINGS, out.strings.count);
    out.strings.nutWidthMm = clampNumber(raw.strings.nutWidthMm, LIMITS.MIN_WIDTH_MM, LIMITS.MAX_WIDTH_MM, out.strings.nutWidthMm);
    out.strings.bridgeWidthMm = clampNumber(raw.strings.bridgeWidthMm, LIMITS.MIN_WIDTH_MM, LIMITS.MAX_WIDTH_MM, out.strings.bridgeWidthMm);
    if (raw.strings.spacing === 'equal' || raw.strings.spacing === 'proportional') out.strings.spacing = raw.strings.spacing;
    if (Array.isArray(raw.strings.gauges)) {
      out.strings.gauges = raw.strings.gauges
        .slice(0, out.strings.count)
        .map((g) => (typeof g === 'number' && Number.isFinite(g) && g > 0 ? g : 0.010));
    }
  }

  // scale length
  if (isRecord(raw.scaleLength)) {
    const mode = raw.scaleLength.mode;
    if (mode === 'single' || mode === 'multi' || mode === 'individual') out.scaleLength.mode = mode;
    out.scaleLength.fundamentalMm = clampNumber(
      raw.scaleLength.fundamentalMm,
      LIMITS.MIN_SCALE_LENGTH_MM,
      LIMITS.MAX_SCALE_LENGTH_MM,
      out.scaleLength.fundamentalMm,
    );
    out.scaleLength.perpendicularDistance = clampNumber(
      raw.scaleLength.perpendicularDistance,
      LIMITS.MIN_PERPENDICULAR_DISTANCE,
      LIMITS.MAX_PERPENDICULAR_DISTANCE,
      out.scaleLength.perpendicularDistance,
    );
    if (typeof raw.scaleLength.lastMm === 'number') {
      out.scaleLength.lastMm = clampNumber(
        raw.scaleLength.lastMm,
        LIMITS.MIN_SCALE_LENGTH_MM,
        LIMITS.MAX_SCALE_LENGTH_MM,
        out.scaleLength.fundamentalMm,
      );
    }
    if (Array.isArray(raw.scaleLength.individualMm)) {
      out.scaleLength.individualMm = raw.scaleLength.individualMm
        .slice(0, out.strings.count)
        .map((v) =>
          clampNumber(v, LIMITS.MIN_SCALE_LENGTH_MM, LIMITS.MAX_SCALE_LENGTH_MM, out.scaleLength.fundamentalMm),
        );
    }
  }

  // calculation
  if (isRecord(raw.calculation)) {
    const method = raw.calculation.method;
    if (method === 'equal' || method === 'scala') out.calculation.method = method;
    out.calculation.tonesPerOctave = clampInt(raw.calculation.tonesPerOctave, 1, 144, out.calculation.tonesPerOctave);

    if (typeof raw.calculation.scalaContent === 'string') {
      out.calculation.scalaContent = raw.calculation.scalaContent;
    }
    if (Array.isArray(raw.calculation.tuning)) {
      out.calculation.tuning = raw.calculation.tuning
        .slice(0, out.strings.count)
        .map((v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.trunc(v) : 0));
    }
  }

  // overhang
  if (isRecord(raw.overhang)) {
    const mode = raw.overhang.mode;
    if (mode === 'equal' || mode === 'nutBridge' || mode === 'firstLast' || mode === 'all') {
      out.overhang = { mode };
      // Lateral overhang fields
      const keys = [
        'equalMm',
        'nutMm',
        'bridgeMm',
        'firstMm',
        'lastMm',
        'nutFirstMm',
        'nutLastMm',
        'bridgeFirstMm',
        'bridgeLastMm',
      ] as const;
      for (const k of keys) {
        const v = (raw.overhang as Record<string, unknown>)[k];
        if (typeof v === 'number' && Number.isFinite(v)) {
          (out.overhang as unknown as Record<string, unknown>)[k] = clampNumber(
            v,
            LIMITS.MIN_OVERHANG_MM,
            LIMITS.MAX_OVERHANG_MM,
            DEFAULTS.OVERHANG_MM,
          );
        }
      }

      // Longitudinal extension fields
      const extKeys = ['nutExtensionMm', 'lastFretExtensionMm'] as const;
      for (const k of extKeys) {
        const v = (raw.overhang as Record<string, unknown>)[k];
        if (typeof v === 'number' && Number.isFinite(v)) {
          (out.overhang as unknown as Record<string, unknown>)[k] = clampNumber(
            v,
            LIMITS.MIN_EXTENSION_MM,
            LIMITS.MAX_EXTENSION_MM,
            k === 'nutExtensionMm' ? DEFAULTS.NUT_EXTENSION_MM : DEFAULTS.LAST_FRET_EXTENSION_MM,
          );
        }
      }
    }
  }

  // Resize / initialize dependent arrays
  if (out.scaleLength.mode === 'individual') {
    const base = out.scaleLength.individualMm ?? Array<number>(out.strings.count).fill(out.scaleLength.fundamentalMm);
    if (base.length < out.strings.count) {
      const fill = base[base.length - 1] ?? out.scaleLength.fundamentalMm;
      out.scaleLength.individualMm = [...base, ...Array<number>(out.strings.count - base.length).fill(fill)];
    } else {
      out.scaleLength.individualMm = base.slice(0, out.strings.count);
    }
  } else {
    delete out.scaleLength.individualMm;
  }

  if (out.strings.spacing === 'proportional') {
    if (!out.strings.gauges || out.strings.gauges.length < out.strings.count) {
      out.strings.gauges = defaultGaugesInches(out.strings.count);
    }
  } else {
    delete out.strings.gauges;
  }

  if (out.calculation.method === 'scala') {
    if (!out.calculation.scalaContent || !out.calculation.scalaContent.trim()) {
      // Can't run scala without content; fall back to equal.
      out.calculation.method = 'equal';
      delete out.calculation.scalaContent;
      delete out.calculation.tuning;
    } else {
      const t = out.calculation.tuning ?? Array<number>(out.strings.count).fill(0);
      out.calculation.tuning = t.length < out.strings.count
        ? [...t, ...Array<number>(out.strings.count - t.length).fill(0)]
        : t.slice(0, out.strings.count);
    }
  } else {
    delete out.calculation.scalaContent;
    delete out.calculation.tuning;
  }

  // compensation
  if (isRecord(raw.compensation)) {
    const mode = raw.compensation.mode;
    if (mode === 'equal' || mode === 'perString') {
      const comp: CompensationConfig = { mode };

      if (mode === 'equal') {
        comp.equalMm = clampNumber(
          raw.compensation.equalMm,
          LIMITS.MIN_COMPENSATION_MM,
          LIMITS.MAX_COMPENSATION_MM,
          0,
        );
      } else {
        comp.equalMm = clampNumber(
          raw.compensation.equalMm,
          LIMITS.MIN_COMPENSATION_MM,
          LIMITS.MAX_COMPENSATION_MM,
          0,
        );
        if (Array.isArray(raw.compensation.perStringMm)) {
          comp.perStringMm = raw.compensation.perStringMm
            .slice(0, out.strings.count)
            .map((v: unknown) =>
              clampNumber(v, LIMITS.MIN_COMPENSATION_MM, LIMITS.MAX_COMPENSATION_MM, comp.equalMm),
            );
        } else {
          comp.perStringMm = Array<number>(out.strings.count).fill(comp.equalMm);
        }
      }

      out.compensation = comp;
    }
  }

  // Keep multi mode coherent
  if (out.scaleLength.mode === 'multi') {
    if (typeof out.scaleLength.lastMm !== 'number') out.scaleLength.lastMm = out.scaleLength.fundamentalMm;
  } else {
    delete out.scaleLength.lastMm;
  }

  if (!out.overhang) {
    out.overhang = {
      mode: 'equal',
      equalMm: DEFAULTS.OVERHANG_MM,
      nutExtensionMm: DEFAULTS.NUT_EXTENSION_MM,
      lastFretExtensionMm: DEFAULTS.LAST_FRET_EXTENSION_MM,
    };
  } else {
    // Ensure extension defaults are always present
    if (out.overhang.nutExtensionMm === undefined) {
      out.overhang.nutExtensionMm = DEFAULTS.NUT_EXTENSION_MM;
    }
    if (out.overhang.lastFretExtensionMm === undefined) {
      out.overhang.lastFretExtensionMm = DEFAULTS.LAST_FRET_EXTENSION_MM;
    }
  }

  return out;
}

export interface UseFretboardReturn {
  /** Current full configuration */
  config: FretboardConfig;
  /** Calculated fretboard result, or null if there is an error */
  result: FretboardResult | null;
  /** Human-readable error message, or null if calculation succeeded */
  error: string | null;
  /** Optional error detail (e.g. Scala line number) */
  errorDetail: string | null;
  /** Informational banner key (i18n) */
  notice: string | null;
  /** Clear notice banner */
  clearNotice: () => void;
  /** Non-blocking warnings about the current config */
  warnings: string[];
  /** Update the scale length section */
  updateScaleLength: (update: Partial<ScaleLengthConfig>) => void;
  /** Update the strings section */
  updateStrings: (update: Partial<StringConfig>) => void;
  /** Update the calculation section */
  updateCalculation: (update: Partial<CalculationConfig>) => void;
  /** Update the overhang section */
  updateOverhang: (update: Partial<OverhangConfig>) => void;
  /** Update the compensation section */
  updateCompensation: (update: Partial<CompensationConfig>) => void;
  /** Set the number of frets */
  setNumFrets: (n: number) => void;
  /** Set the display unit (mm / in / cm) */
  setUnit: (u: Unit) => void;
  /** Replace the current config with values from a preset */
  applyPreset: (preset: InstrumentPreset) => void;
  // ── Compare mode ────────────────────────────────────────────────────
  /** Snapshot of the result for side-by-side comparison, or null */
  compareResult: FretboardResult | null;
  /** Whether compare mode is active */
  isCompareMode: boolean;
  /** Enter compare mode: snapshots the current result */
  enterCompareMode: () => void;
  /** Exit compare mode: discards the snapshot */
  exitCompareMode: () => void;
  // ── Undo/redo ──────────────────────────────────────────────────────
  /** Undo the last config change */
  undo: () => void;
  /** Redo a previously undone config change */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Main fretboard state hook.
 *
 * @returns State, result, error, and typed setters
 */
export function useFretboard(): UseFretboardReturn {
  const [config, setConfigState] = useState<FretboardConfig>(DEFAULT_CONFIG);
  const [notice, setNotice] = useState<string | null>(null);
  const { t } = useLocale();

  const didInitFromUrl = useRef(false);
  const isApplyingUrl = useRef(false);

  // ── Undo/redo state ────────────────────────────────────────────────────
  const historyRef = useRef<{ past: FretboardConfig[]; future: FretboardConfig[] }>({
    past: [],
    future: [],
  });
  const coalesceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wrapped setter that tracks history with coalescing for rapid changes.
  // IMPORTANT: ref mutations happen OUTSIDE setConfigState to avoid React
  // StrictMode double-invocation issues (functional updaters are called twice
  // in dev — the second call would see a mutated ref and skip history).
  const setConfig = useCallback(
    (updater: FretboardConfig | ((prev: FretboardConfig) => FretboardConfig)) => {
      const prev = config;
      const next = typeof updater === 'function' ? updater(prev) : updater;

      if (!isApplyingUrl.current) {
        if (!coalesceTimer.current) {
          const newPast = [...historyRef.current.past, structuredClone(prev)];
          if (newPast.length > MAX_HISTORY) newPast.shift();
          historyRef.current = { past: newPast, future: [] };
        }
        if (coalesceTimer.current) clearTimeout(coalesceTimer.current);
        coalesceTimer.current = setTimeout(() => {
          coalesceTimer.current = null;
        }, COALESCE_MS);
      }

      setConfigState(next);
    },
    [config],
  );

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const undo = useCallback(() => {
    const current = config;
    const history = historyRef.current;
    if (history.past.length === 0) return;
    const newPast = [...history.past];
    const previous = newPast.pop()!;
    historyRef.current = {
      past: newPast,
      future: [structuredClone(current), ...history.future],
    };
    setConfigState(previous);
  }, [config]);

  const redo = useCallback(() => {
    const current = config;
    const history = historyRef.current;
    if (history.future.length === 0) return;
    const newFuture = [...history.future];
    const next = newFuture.shift()!;
    historyRef.current = {
      past: [...history.past, structuredClone(current)],
      future: newFuture,
    };
    setConfigState(next);
  }, [config]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const clearNotice = () => setNotice(null);

  // Try to load from URL hash on mount, and on hash changes (shared links).
  useEffect(() => {
    const applyHash = (hash: string) => {
      const parsed = parseConfigFromHash(hash);
      if (!parsed) return;

      if (!isUrlPayloadV1(parsed)) {
        setConfig(DEFAULT_CONFIG);
        setNotice('url.invalid');
        return;
      }

      const next = sanitizeLoadedConfig((parsed as { config?: unknown }).config);
      if (!next) {
        setConfig(DEFAULT_CONFIG);
        setNotice('url.invalid');
        return;
      }

      isApplyingUrl.current = true;
      setConfig(next);
      setNotice('url.loaded');
      didInitFromUrl.current = true;

      // Clear applying flag after state commit.
      setTimeout(() => {
        isApplyingUrl.current = false;
      }, 0);
    };

    applyHash(window.location.hash);

    const onHashChange = () => applyHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Keep URL hash in sync with config changes.
  useEffect(() => {
    // Avoid feedback loops when applying a hash-driven config.
    if (isApplyingUrl.current) return;

    const nextHash = serializeConfigToHash(config);
    if (window.location.hash === nextHash) return;

    try {
      window.history.replaceState(null, '', nextHash);
    } catch {
      // Ignore URL update failures (very old browsers or restricted environments)
    }
  }, [config]);

  // Compute non-blocking warnings based on current config
  const warnings = useMemo(() => {
    const w: string[] = [];
    const scaleLength = config.scaleLength.fundamentalMm;

    if (config.numFrets > WARN_MAX_FRETS) {
      w.push(t('warnings.fretCount', { count: config.numFrets }));
    }
    if (config.strings.count > WARN_MAX_STRINGS) {
      w.push(t('warnings.stringCount', { count: config.strings.count }));
    }
    if (scaleLength < WARN_MIN_SCALE_LENGTH) {
      w.push(t('warnings.scaleLengthMin', { value: scaleLength }));
    }
    if (scaleLength > WARN_MAX_SCALE_LENGTH) {
      w.push(t('warnings.scaleLengthMax', { value: scaleLength }));
    }

    return w;
  }, [config, t]);

  // Re-run the calculator whenever config changes.
  // ScalaParseError gets mapped to the i18n key so the UI can translate it.
  // CalculationError messages are descriptive English sentences that pass
  // through t() unchanged (getTranslation returns the key itself when not found).
  const { result, error, errorDetail } = useMemo(() => {
    try {
      return { result: calculateFretboard(config), error: null as string | null, errorDetail: null as string | null };
    } catch (e) {
      if (e instanceof ScalaParseError) {
        const line = typeof e.line === 'number' ? `Line ${e.line}: ` : '';
        const detail = e.detail ? ` (${e.detail})` : '';
        return { result: null, error: 'errors.invalidScala', errorDetail: `${line}${e.message}${detail}` };
      }
      const message = e instanceof Error ? e.message : String(e);
      const detail =
        e && typeof e === 'object' && 'detail' in e && typeof (e as { detail?: unknown }).detail === 'string'
          ? (e as { detail: string }).detail
          : null;
      return { result: null, error: message, errorDetail: detail };
    }
  }, [config]);

  const updateScaleLength = (update: Partial<ScaleLengthConfig>) => {
    setConfig((prev) => {
      const next: ScaleLengthConfig = { ...prev.scaleLength, ...update };

      // Keep dependent fields coherent so the calculator never sees an invalid config.
      if (update.mode) {
        if (next.mode === 'multi') {
          // Engine requires lastMm in multi-scale mode.
          if (typeof next.lastMm !== 'number' || !Number.isFinite(next.lastMm)) {
            next.lastMm = next.fundamentalMm;
          }
          delete next.individualMm;
        } else if (next.mode === 'individual') {
          delete next.lastMm;
          const base = next.individualMm ?? Array<number>(prev.strings.count).fill(next.fundamentalMm);
          next.individualMm =
            base.length < prev.strings.count
              ? [...base, ...Array<number>(prev.strings.count - base.length).fill(base[base.length - 1] ?? next.fundamentalMm)]
              : base.slice(0, prev.strings.count);
        } else {
          // single
          delete next.lastMm;
          delete next.individualMm;
        }
      }

      return { ...prev, scaleLength: next };
    });
  };

  const updateStrings = (update: Partial<StringConfig>) => {
    setConfig((prev) => {
      const newStrings = { ...prev.strings, ...update };
      const newScaleLength = { ...prev.scaleLength };
      const newCalculation = { ...prev.calculation };

      // If in individual mode and the string count changed, resize the array
      // so the engine never receives an under-populated individualMm.
      if (
        prev.scaleLength.mode === 'individual' &&
        update.count !== undefined &&
        update.count !== prev.strings.count
      ) {
        const existing =
          prev.scaleLength.individualMm ??
          Array<number>(prev.strings.count).fill(prev.scaleLength.fundamentalMm);
        const newCount = update.count;

        if (newCount > existing.length) {
          // Extend: repeat the last value for the new strings
          const fill = existing[existing.length - 1] ?? prev.scaleLength.fundamentalMm;
          newScaleLength.individualMm = [
            ...existing,
            ...Array<number>(newCount - existing.length).fill(fill),
          ];
        } else {
          // Trim
          newScaleLength.individualMm = existing.slice(0, newCount);
        }
      }

      // Keep gauges array sized to the string count when proportional spacing is active.
      // Gauges are stored in inches per spec.
      if (update.count !== undefined && update.count !== prev.strings.count) {
        const newCount = update.count;
        const existing = prev.strings.gauges;

        if (existing && existing.length > 0) {
          if (newCount > existing.length) {
            const fill = existing[existing.length - 1] ?? 0.010;
            newStrings.gauges = [
              ...existing,
              ...Array<number>(newCount - existing.length).fill(fill),
            ];
          } else {
            newStrings.gauges = existing.slice(0, newCount);
          }
        } else if (newStrings.spacing === 'proportional') {
          newStrings.gauges = defaultGaugesInches(newCount);
        }

        // Keep scala tuning array sized to string count if present.
        if (prev.calculation.method === 'scala' && prev.calculation.tuning) {
          const t = prev.calculation.tuning;
          if (newCount > t.length) {
            const fill = t[t.length - 1] ?? 0;
            newCalculation.tuning = [...t, ...Array<number>(newCount - t.length).fill(fill)];
          } else {
            newCalculation.tuning = t.slice(0, newCount);
          }
        }
      }

      // If switching to proportional spacing and gauges are missing/undersized, initialize them.
      if (update.spacing === 'proportional') {
        const g = newStrings.gauges;
        if (!g || g.length < newStrings.count) {
          newStrings.gauges = defaultGaugesInches(newStrings.count);
        }
      }

      return { ...prev, strings: newStrings, scaleLength: newScaleLength, calculation: newCalculation };
    });
  };

  const updateCalculation = (update: Partial<CalculationConfig>) => {
    setConfig((prev) => ({
      ...prev,
      calculation: { ...prev.calculation, ...update },
    }));
  };

  const updateOverhang = (update: Partial<OverhangConfig>) => {
    setConfig((prev) => ({
      ...prev,
      overhang: { ...(prev.overhang ?? { mode: 'equal', equalMm: DEFAULTS.OVERHANG_MM }), ...update },
    }));
  };

  const updateCompensation = (update: Partial<CompensationConfig>) => {
    setConfig((prev) => {
      // Retain prior perStringMm array when switching to equal mode
      // so switching back to perString restores the array.
      const prevComp = prev.compensation;
      const next: CompensationConfig = {
        mode: prevComp?.mode ?? 'equal',
        equalMm: prevComp?.equalMm ?? 0,
        perStringMm: prevComp?.perStringMm,
        ...update,
      };

      // Initialize perStringMm when switching to perString mode
      if (next.mode === 'perString' && (!next.perStringMm || next.perStringMm.length < prev.strings.count)) {
        next.perStringMm = Array<number>(prev.strings.count).fill(next.equalMm);
      }

      // Trim/resize perStringMm when string count changes
      if (next.perStringMm && next.perStringMm.length > prev.strings.count) {
        next.perStringMm = next.perStringMm.slice(0, prev.strings.count);
      }

      return { ...prev, compensation: next };
    });
  };

  const setNumFrets = (n: number) => {
    setConfig((prev) => ({ ...prev, numFrets: n }));
  };

  const setUnit = (u: Unit) => {
    setConfig((prev) => ({ ...prev, unit: u }));
  };

  const applyPreset = (preset: InstrumentPreset) => {
    setConfig((prev) => ({
      ...prev,
      scaleLength: {
        mode: preset.scaleLengthMm2 !== null ? 'multi' : 'single',
        fundamentalMm: preset.scaleLengthMm,
        lastMm: preset.scaleLengthMm2 ?? undefined,
        perpendicularDistance: preset.perpendicularDistance,
      },
      strings: {
        count: preset.numStrings,
        nutWidthMm: preset.nutWidthMm,
        bridgeWidthMm: preset.bridgeWidthMm,
        spacing: preset.stringGauges ? 'proportional' : 'equal',
        gauges: preset.stringGauges,
      },
      numFrets: preset.numFrets,
    }));
  };

  // ── Compare mode ──────────────────────────────────────────────────────
  const [compareResult, setCompareResult] = useState<FretboardResult | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const enterCompareMode = useCallback(() => {
    if (!result) return;
    setCompareResult(structuredClone(result));
    setIsCompareMode(true);
  }, [result]);

  const exitCompareMode = useCallback(() => {
    setIsCompareMode(false);
    setCompareResult(null);
  }, []);

  return {
    config,
    result,
    error,
    errorDetail,
    notice,
    clearNotice,
    warnings,
    updateScaleLength,
    updateStrings,
    updateCalculation,
    updateOverhang,
    updateCompensation,
    setNumFrets,
    setUnit,
    applyPreset,
    compareResult,
    isCompareMode,
    enterCompareMode,
    exitCompareMode,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
