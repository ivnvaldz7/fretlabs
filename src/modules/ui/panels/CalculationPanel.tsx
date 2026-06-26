/**
 * CalculationPanel — selects equal temperament vs. Scala (microtonal / just intonation).
 *
 * Equal mode: exposes the tones-per-octave parameter.
 * Scala mode: exposes a textarea for pasting a .scl file's content.
 */

import { useState } from 'react';
import { INPUT_CLS, LABEL_CLS } from '../../../utils/ui-classes';
import { useLocale } from '../../../hooks/useLocale';
import { validatePositiveNumber } from '../../../utils/validators';
import { SCALE_PRESETS } from '../../../config/scale-presets';
import type { CalculationConfig, CalculationMethod } from '../../calculator/types';
import type { ScalePreset } from '../../../config/scale-presets';
import { HelpTip } from '../display/HelpTip';
import { FieldError } from '../shared/FieldError';
import { ScalePresetSelector } from './ScalePresetSelector';

interface CalculationPanelProps {
  calculation: CalculationConfig;
  numStrings: number;
  onChange: (update: Partial<CalculationConfig>) => void;
}

const PRESET_12TET_SCL = SCALE_PRESETS.find((p) => p.id === '12-tet')!.sclContent;

/**
 * Calculation method configuration panel.
 *
 * @param calculation - Current calculation config
 * @param numStrings - Number of strings (for per-string tuning inputs)
 * @param onChange - Partial update callback
 */
export function CalculationPanel({ calculation, numStrings, onChange }: CalculationPanelProps) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  const handleScalePreset = (preset: ScalePreset) => {
    onChange({ ...calculation, scalaContent: preset.sclContent });
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.calculation.label')}
      </h3>

      <div className="space-y-2">
        {/* Method toggle */}
        <div className="flex overflow-hidden rounded border border-border">
          {(['equal', 'scala'] as CalculationMethod[]).map((method) => (
            <button
              key={method}
              onClick={() => {
                if (method === 'scala') {
                  onChange({
                    method,
                    scalaContent: (calculation.scalaContent ?? '').trim()
                      ? calculation.scalaContent
                      : PRESET_12TET_SCL,
                    tuning:
                      calculation.tuning && calculation.tuning.length >= numStrings
                        ? calculation.tuning
                        : Array<number>(numStrings).fill(0),
                  });
                } else {
                  onChange({ method });
                }
              }}
              className={`flex-1 py-1 text-xs transition-colors ${
                calculation.method === method
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated text-text-muted hover:text-text'
              }`}
            >
              {t(`panel.calculation.${method}`)}
            </button>
          ))}
        </div>

        {/* Equal temperament: tones per octave (12 = standard, 19, 24, 31, etc.) */}
        {calculation.method === 'equal' && (
          <div>
            <label className={LABEL_CLS}>
              {t('panel.calculation.tonesPerOctave')}
              <HelpTip text={t('help.calculation.tonesPerOctave')} />
            </label>
            <input
              type="number"
              min="1"
              max="144"
              step="1"
              className={INPUT_CLS}
              value={calculation.tonesPerOctave}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (isNaN(n)) return;
                const result = validatePositiveNumber(n);
                setError(result.valid ? null : result.error ?? null);
                if (result.valid) onChange({ tonesPerOctave: n });
              }}
            />
            <FieldError message={error} />
          </div>
        )}

        {/* Scala: paste the raw .scl file content */}
        {calculation.method === 'scala' && (
          <>
            <ScalePresetSelector onSelect={handleScalePreset} />
            <div>
              <label className={LABEL_CLS}>
                {t('panel.calculation.scalaInput')}
                <HelpTip text={t('help.calculation.scalaInput')} />
              </label>
              <textarea
                className={`${INPUT_CLS} font-mono text-xs leading-relaxed`}
                rows={9}
                spellCheck={false}
                placeholder={
                  '! 12tet.scl\n12 equal temperament\n12\n100.\n200.\n300.\n400.\n500.\n600.\n700.\n800.\n900.\n1000.\n1100.\n2/1'
                }
                value={calculation.scalaContent ?? ''}
                onChange={(e) => onChange({ scalaContent: e.target.value })}
              />
            </div>

            <div>
              <label className={LABEL_CLS}>
                {t('panel.calculation.tuning')}
                <HelpTip text={t('help.calculation.tuning')} />
              </label>
              <div className="space-y-1.5">
                {Array.from({ length: numStrings }, (_, i) => {
                  const base =
                    calculation.tuning && calculation.tuning.length >= numStrings
                      ? calculation.tuning
                      : Array<number>(numStrings).fill(0);
                  const v = base[i] ?? 0;

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 flex-none text-right text-xs text-text-dim">
                        {i + 1}
                      </span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className={`${INPUT_CLS} flex-1 font-mono`}
                        value={v}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (isNaN(n) || n < 0) return;
                          const next = [...base];
                          next[i] = n;
                          onChange({ tuning: next });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
