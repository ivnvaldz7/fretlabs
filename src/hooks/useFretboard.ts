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

import { useState, useMemo } from 'react';
import { calculateFretboard } from '../modules/calculator/engine';
import { ScalaParseError } from '../modules/calculator/scala-parser';
import type {
  FretboardConfig,
  FretboardResult,
  ScaleLengthConfig,
  StringConfig,
  CalculationConfig,
} from '../modules/calculator/types';
import type { Unit } from '../config/constants';
import { DEFAULTS } from '../config/constants';
import type { InstrumentPreset } from '../config/presets';

// ── Default config (Fender Stratocaster, equal temperament, mm) ─────────────

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
  numFrets: DEFAULTS.NUM_FRETS,
  unit: DEFAULTS.UNIT,
};

// ── Public API ──────────────────────────────────────────────────────────────

export interface UseFretboardReturn {
  /** Current full configuration */
  config: FretboardConfig;
  /** Calculated fretboard result, or null if there is an error */
  result: FretboardResult | null;
  /** Human-readable error message, or null if calculation succeeded */
  error: string | null;
  /** Update the scale length section */
  updateScaleLength: (update: Partial<ScaleLengthConfig>) => void;
  /** Update the strings section */
  updateStrings: (update: Partial<StringConfig>) => void;
  /** Update the calculation section */
  updateCalculation: (update: Partial<CalculationConfig>) => void;
  /** Set the number of frets */
  setNumFrets: (n: number) => void;
  /** Set the display unit (mm / in / cm) */
  setUnit: (u: Unit) => void;
  /** Replace the current config with values from a preset */
  applyPreset: (preset: InstrumentPreset) => void;
}

/**
 * Main fretboard state hook.
 *
 * @returns State, result, error, and typed setters
 */
export function useFretboard(): UseFretboardReturn {
  const [config, setConfig] = useState<FretboardConfig>(DEFAULT_CONFIG);

  // Re-run the calculator whenever config changes.
  // ScalaParseError gets mapped to the i18n key so the UI can translate it.
  // CalculationError messages are descriptive English sentences that pass
  // through t() unchanged (getTranslation returns the key itself when not found).
  const { result, error } = useMemo(() => {
    try {
      return { result: calculateFretboard(config), error: null };
    } catch (e) {
      if (e instanceof ScalaParseError) {
        return { result: null, error: 'errors.invalidScala' };
      }
      const message = e instanceof Error ? e.message : String(e);
      return { result: null, error: message };
    }
  }, [config]);

  const updateScaleLength = (update: Partial<ScaleLengthConfig>) => {
    setConfig((prev) => ({
      ...prev,
      scaleLength: { ...prev.scaleLength, ...update },
    }));
  };

  const updateStrings = (update: Partial<StringConfig>) => {
    setConfig((prev) => {
      const newStrings = { ...prev.strings, ...update };
      const newScaleLength = { ...prev.scaleLength };

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

      return { ...prev, strings: newStrings, scaleLength: newScaleLength };
    });
  };

  const updateCalculation = (update: Partial<CalculationConfig>) => {
    setConfig((prev) => ({
      ...prev,
      calculation: { ...prev.calculation, ...update },
    }));
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

  return {
    config,
    result,
    error,
    updateScaleLength,
    updateStrings,
    updateCalculation,
    setNumFrets,
    setUnit,
    applyPreset,
  };
}
