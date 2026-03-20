/**
 * StringsPanel — inputs for string count, widths, and spacing mode.
 *
 * Widths are displayed in the user's chosen unit and converted to mm
 * before updating the config.
 */

import { fromMm, toMm } from '../../../utils/unit-converter';
import { useLocale } from '../../../hooks/useLocale';
import type { StringConfig, SpacingMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';

interface StringsPanelProps {
  strings: StringConfig;
  unit: Unit;
  onChange: (update: Partial<StringConfig>) => void;
}

/**
 * Convert mm to a display string in the given unit (7 sig figs, no trailing zeros).
 */
function toDisplayValue(mm: number, unit: Unit): string {
  return parseFloat(fromMm(mm, unit).toPrecision(7)).toString();
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

  const inputCls =
    'w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none';
  const labelCls = 'mb-0.5 block text-xs text-text-muted';

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.strings.label')}
      </h3>

      <div className="space-y-2">
        {/* String count */}
        <div>
          <label className={labelCls}>{t('panel.strings.count')}</label>
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            className={inputCls}
            value={strings.count}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 1) onChange({ count: n });
            }}
          />
        </div>

        {/* Nut width */}
        <div>
          <label className={labelCls}>
            {t('panel.strings.nutWidth')} ({unit})
          </label>
          <input
            type="number"
            step="any"
            className={inputCls}
            value={toDisplayValue(strings.nutWidthMm, unit)}
            onChange={(e) => {
              const mm = toMm(parseFloat(e.target.value), unit);
              if (!isNaN(mm) && mm > 0) onChange({ nutWidthMm: mm });
            }}
          />
        </div>

        {/* Bridge width */}
        <div>
          <label className={labelCls}>
            {t('panel.strings.bridgeWidth')} ({unit})
          </label>
          <input
            type="number"
            step="any"
            className={inputCls}
            value={toDisplayValue(strings.bridgeWidthMm, unit)}
            onChange={(e) => {
              const mm = toMm(parseFloat(e.target.value), unit);
              if (!isNaN(mm) && mm > 0) onChange({ bridgeWidthMm: mm });
            }}
          />
        </div>

        {/* Spacing mode */}
        <div>
          <label className={labelCls}>{t('panel.strings.spacing.label')}</label>
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
      </div>
    </section>
  );
}
