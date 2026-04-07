/**
 * CalculationPanel — selects equal temperament vs. Scala (microtonal / just intonation).
 *
 * Equal mode: exposes the tones-per-octave parameter.
 * Scala mode: exposes a textarea for pasting a .scl file's content.
 */

import { useLocale } from '../../../hooks/useLocale';
import type { CalculationConfig, CalculationMethod } from '../../calculator/types';
import { HelpTip } from '../display/HelpTip';

interface CalculationPanelProps {
  calculation: CalculationConfig;
  numStrings: number;
  onChange: (update: Partial<CalculationConfig>) => void;
}

const DEFAULT_12TET_SCL = `! 12tet.scl
12 equal temperament
12
100.
200.
300.
400.
500.
600.
700.
800.
900.
1000.
1100.
2/1`;

/**
 * Calculation method configuration panel.
 *
 * @param calculation - Current calculation config
 * @param numStrings - Number of strings (for per-string tuning inputs)
 * @param onChange - Partial update callback
 */
export function CalculationPanel({ calculation, numStrings, onChange }: CalculationPanelProps) {
  const { t } = useLocale();

  const inputCls =
    'w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none';
  const labelCls = 'mb-0.5 block text-xs text-text-muted';

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
                      : DEFAULT_12TET_SCL,
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
            <label className={labelCls}>
              {t('panel.calculation.tonesPerOctave')}
              <HelpTip text={t('help.calculation.tonesPerOctave')} />
            </label>
            <input
              type="number"
              min="1"
              max="144"
              step="1"
              className={inputCls}
              value={calculation.tonesPerOctave}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n >= 1) onChange({ tonesPerOctave: n });
              }}
            />
          </div>
        )}

        {/* Scala: paste the raw .scl file content */}
        {calculation.method === 'scala' && (
          <>
            <div>
              <label className={labelCls}>
                {t('panel.calculation.scalaInput')}
                <HelpTip text={t('help.calculation.scalaInput')} />
              </label>
              <textarea
                className={`${inputCls} font-mono text-xs leading-relaxed`}
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
              <label className={labelCls}>
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
                        className={`${inputCls} flex-1 font-mono`}
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
