/**
 * CompensationPanel — controls intonation compensation per string.
 *
 * Intonation compensation adds a small offset (in mm) to each string's scale
 * length, shifting ALL fret positions and the bridge endpoint proportionally.
 * Thicker strings require more compensation (2–5mm typical for wound strings,
 * 1–3mm for plain).
 *
 * - 'equal' mode: one value for all strings (simplest, good for fixed bridges)
 * - 'perString' mode: individual value per string (for adjustable saddles)
 */

import { useState } from 'react';
import { toDisplayValue, parseToMm, fromMm } from '../../../utils/unit-converter';
import { INPUT_CLS, LABEL_CLS } from '../../../utils/ui-classes';
import { useLocale } from '../../../hooks/useLocale';
import { validatePositiveNumber } from '../../../utils/validators';
import type { CompensationConfig, CompensationMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { LIMITS } from '../../../config/constants';
import { HelpTip } from '../display/HelpTip';
import { FieldError } from '../shared/FieldError';

const MODES: CompensationMode[] = ['equal', 'perString'];

interface CompensationPanelProps {
  compensation: CompensationConfig | undefined;
  numStrings: number;
  unit: Unit;
  onChange: (update: Partial<CompensationConfig>) => void;
}

function ensure(compensation: CompensationConfig | undefined): CompensationConfig {
  return compensation ?? { mode: 'equal', equalMm: 0 };
}

export function CompensationPanel({
  compensation,
  numStrings,
  unit,
  onChange,
}: CompensationPanelProps) {
  const { t } = useLocale();
  const comp = ensure(compensation);
  const [error, setError] = useState<string | null>(null);

  const clampMm = (mm: number): number => {
    if (!Number.isFinite(mm)) return 0;
    return Math.min(LIMITS.MAX_COMPENSATION_MM, Math.max(LIMITS.MIN_COMPENSATION_MM, mm));
  };

  const setMode = (mode: CompensationMode) => {
    const base = comp.equalMm ?? 0;
    if (mode === 'equal') {
      onChange({ mode, equalMm: base });
    } else {
      // Initialize perStringMm when switching to perString mode
      const arr = comp.perStringMm?.length === numStrings
        ? [...comp.perStringMm]
        : Array<number>(numStrings).fill(base);
      onChange({ mode, perStringMm: arr, equalMm: base });
    }
    setError(null);
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.compensation.label')}
        <HelpTip text={t('help.compensation.about')} align="right" />
      </h3>

      {/* Mode toggle */}
      <div className="mb-3 flex overflow-hidden rounded border border-border">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`flex-1 py-1 text-xs transition-colors ${
              comp.mode === mode
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-muted hover:text-text'
            }`}
          >
            {t(`panel.compensation.mode.${mode}`)}
          </button>
        ))}
      </div>

      {/* Equal mode: single input */}
      {comp.mode === 'equal' && (
        <div>
          <label className={LABEL_CLS}>
            {t('panel.compensation.offset')} ({unit})
          </label>
          <input
            type="number"
            step="any"
            min={fromMm(LIMITS.MIN_COMPENSATION_MM, unit)}
            max={fromMm(LIMITS.MAX_COMPENSATION_MM, unit)}
            className={INPUT_CLS}
            value={toDisplayValue(comp.equalMm, unit)}
            onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ equalMm: clampMm(parsed) });
            }}
          />
          <FieldError message={error} />
        </div>
      )}

      {/* Per-string mode: one input per string */}
      {comp.mode === 'perString' && (
        <div className="space-y-2">
          {Array.from({ length: numStrings }, (_, i) => {
            const val = comp.perStringMm?.[i] ?? comp.equalMm;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-right text-xs text-text-muted">{i + 1}</span>
                <input
                  type="number"
                  step="any"
                  min={fromMm(LIMITS.MIN_COMPENSATION_MM, unit)}
                  max={fromMm(LIMITS.MAX_COMPENSATION_MM, unit)}
                  className={INPUT_CLS}
                  value={toDisplayValue(val, unit)}
                  onChange={(e) => {
                    const parsed = parseToMm(e.target.value, unit);
                    if (parsed === null) return;
                    const result = validatePositiveNumber(parsed);
                    setError(result.valid ? null : result.error ?? null);
                    if (result.valid) {
                      const arr = [...(comp.perStringMm ?? Array<number>(numStrings).fill(comp.equalMm))];
                      arr[i] = clampMm(parsed);
                      onChange({ perStringMm: arr });
                    }
                  }}
                />
                <span className="text-xs text-text-muted">{unit}</span>
              </div>
            );
          })}
          <FieldError message={error} />
        </div>
      )}
    </section>
  );
}
