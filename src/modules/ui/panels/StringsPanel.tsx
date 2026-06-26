/**
 * StringsPanel — inputs for string count, widths, and spacing mode.
 *
 * Widths are displayed in the user's chosen unit and converted to mm
 * before updating the config.
 */

import { useState } from 'react';
import { toDisplayValue, parseToMm } from '../../../utils/unit-converter';
import { INPUT_CLS, LABEL_CLS } from '../../../utils/ui-classes';
import { useLocale } from '../../../hooks/useLocale';
import { validateNumStrings, validatePositiveNumber } from '../../../utils/validators';
import type { StringConfig, SpacingMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { HelpTip } from '../display/HelpTip';
import { FieldError } from '../shared/FieldError';

interface StringsPanelProps {
  strings: StringConfig;
  unit: Unit;
  onChange: (update: Partial<StringConfig>) => void;
}

/**
 * String configuration panel.
 *
 * @param strings - Current string config
 * @param unit - Active display unit
 * @param onChange - Partial update callback
 */
export function StringsPanel({ strings, unit, onChange }: StringsPanelProps) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  const gauges = strings.gauges ?? [];

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.strings.label')}
      </h3>

      <div className="space-y-2">
        {/* String count */}
        <div>
          <label className={LABEL_CLS}>
            {t('panel.strings.count')}
            <HelpTip text={t('help.strings.count')} />
          </label>
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            className={INPUT_CLS}
            value={strings.count}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (isNaN(n)) return;
              const result = validateNumStrings(n);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ count: n });
            }}
          />
          <FieldError message={error} />
        </div>

        {/* Nut width */}
        <div>
          <label className={LABEL_CLS}>
            {t('panel.strings.nutWidth')} ({unit})
            <HelpTip text={t('help.strings.nutWidth')} />
          </label>
          <input
            type="number"
            step="any"
            className={INPUT_CLS}
            value={toDisplayValue(strings.nutWidthMm, unit)}
            onChange={(e) => {
              const mm = parseToMm(e.target.value, unit);
              if (mm === null) return;
              const result = validatePositiveNumber(mm);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ nutWidthMm: mm });
            }}
          />
          <FieldError message={error} />
        </div>

        {/* Bridge width */}
        <div>
          <label className={LABEL_CLS}>
            {t('panel.strings.bridgeWidth')} ({unit})
            <HelpTip text={t('help.strings.bridgeWidth')} />
          </label>
          <input
            type="number"
            step="any"
            className={INPUT_CLS}
            value={toDisplayValue(strings.bridgeWidthMm, unit)}
            onChange={(e) => {
              const mm = parseToMm(e.target.value, unit);
              if (mm === null) return;
              const result = validatePositiveNumber(mm);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ bridgeWidthMm: mm });
            }}
          />
          <FieldError message={error} />
        </div>

        {/* Spacing mode */}
        <div>
          <label className={LABEL_CLS}>
            {t('panel.strings.spacing.label')}
            <HelpTip text={t('help.strings.spacing')} />
          </label>
          <div className="flex gap-3">
            {(['equal', 'proportional'] as SpacingMode[]).map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer items-center gap-1.5 text-sm text-text-muted"
              >
                <input
                  type="radio"
                  name="spacing-mode"
                  value={mode}
                  checked={strings.spacing === mode}
                  onChange={() => onChange({ spacing: mode })}
                  className="accent-primary"
                />
                {t(`panel.strings.spacing.${mode}`)}
              </label>
            ))}
          </div>
        </div>

        {/* Gauges (only for proportional spacing) */}
        {strings.spacing === 'proportional' && (
          <div>
            <label className={LABEL_CLS}>
              {t('panel.strings.gauges')} (in)
              <HelpTip text={t('help.strings.gauges')} />
            </label>
            <div className="space-y-1.5">
              {Array.from({ length: strings.count }, (_, i) => {
                const v = gauges[i] ?? '';
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 flex-none text-right text-xs text-text-dim">
                      {i + 1}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className={`${INPUT_CLS} flex-1 font-mono`}
                      value={v}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (isNaN(n)) return;
                        const result = validatePositiveNumber(n);
                        setError(result.valid ? null : result.error ?? null);
                        if (result.valid) {
                          const next = [...Array<number>(strings.count)].map((_, j) =>
                            typeof gauges[j] === 'number' ? gauges[j] : 0.010,
                          );
                          next[i] = n;
                          onChange({ gauges: next });
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
