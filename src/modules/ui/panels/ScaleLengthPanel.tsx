/**
 * ScaleLengthPanel — inputs for scale length mode and values.
 *
 * Displays values in the user's chosen unit and converts to mm
 * before updating the config (conversion happens at the input boundary).
 */

import { fromMm, toMm } from '../../../utils/unit-converter';
import { useLocale } from '../../../hooks/useLocale';
import type { ScaleLengthConfig, ScaleLengthMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { HelpTip } from '../display/HelpTip';

const MODES: ScaleLengthMode[] = ['single', 'multi', 'individual'];

interface ScaleLengthPanelProps {
  scaleLength: ScaleLengthConfig;
  numStrings: number;
  unit: Unit;
  onChange: (update: Partial<ScaleLengthConfig>) => void;
}

/**
 * Convert a mm value to a display string in the given unit.
 * Uses 7 significant figures then strips trailing zeros.
 */
function toDisplayValue(mm: number, unit: Unit): string {
  return parseFloat(fromMm(mm, unit).toPrecision(7)).toString();
}

/**
 * Parse a display string in the given unit to mm.
 */
function parseToMm(raw: string, unit: Unit): number {
  return toMm(parseFloat(raw), unit);
}

/**
 * Scale length configuration panel.
 *
 * @param scaleLength - Current scale length config
 * @param numStrings - Number of strings (needed for individual mode)
 * @param unit - Active display unit
 * @param onChange - Partial update callback
 */
export function ScaleLengthPanel({
  scaleLength,
  numStrings,
  unit,
  onChange,
}: ScaleLengthPanelProps) {
  const { t } = useLocale();

  const inputCls =
    'w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none';
  const labelCls = 'mb-0.5 block text-xs text-text-muted';

  const handleModeChange = (mode: ScaleLengthMode) => {
    const update: Partial<ScaleLengthConfig> = { mode };
    // Initialize the per-string array when switching to individual mode
    if (mode === 'individual' && !scaleLength.individualMm) {
      update.individualMm = Array<number>(numStrings).fill(scaleLength.fundamentalMm);
    }
    onChange(update);
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.scaleLength.label')}
      </h3>

      {/* Mode selector */}
      <div className="mb-3 flex overflow-hidden rounded border border-border">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`flex-1 py-1 text-xs transition-colors ${
              scaleLength.mode === mode
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-muted hover:text-text'
            }`}
          >
            {t(`panel.scaleLength.mode.${mode}`)}
          </button>
        ))}
      </div>

      {/* Single: one scale length */}
      {scaleLength.mode === 'single' && (
        <div>
          <label className={labelCls}>
            {t('panel.scaleLength.fundamental')} ({unit})
            <HelpTip text={t('help.scaleLength.fundamental')} />
          </label>
          <input
            type="number"
            step="any"
            className={inputCls}
            value={toDisplayValue(scaleLength.fundamentalMm, unit)}
            onChange={(e) => {
              const mm = parseToMm(e.target.value, unit);
              if (!isNaN(mm)) onChange({ fundamentalMm: mm });
            }}
          />
        </div>
      )}

      {/* Multi: treble + bass + perpendicular distance */}
      {scaleLength.mode === 'multi' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>
              {t('panel.scaleLength.first')} ({unit})
              <HelpTip text={t('help.scaleLength.first')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(scaleLength.fundamentalMm, unit)}
              onChange={(e) => {
                const mm = parseToMm(e.target.value, unit);
                if (!isNaN(mm)) onChange({ fundamentalMm: mm });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t('panel.scaleLength.last')} ({unit})
              <HelpTip text={t('help.scaleLength.last')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(scaleLength.lastMm ?? scaleLength.fundamentalMm, unit)}
              onChange={(e) => {
                const mm = parseToMm(e.target.value, unit);
                if (!isNaN(mm)) onChange({ lastMm: mm });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t('panel.scaleLength.perpendicular')} (0–1)
              <HelpTip text={t('help.scaleLength.perpendicular')} />
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className={inputCls}
              value={scaleLength.perpendicularDistance}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange({ perpendicularDistance: v });
              }}
            />
          </div>
        </div>
      )}

      {/* Individual: one input per string */}
      {scaleLength.mode === 'individual' && (
        <div className="space-y-1.5">
          {Array.from({ length: numStrings }, (_, i) => {
            const mm =
              scaleLength.individualMm?.[i] ?? scaleLength.fundamentalMm;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 flex-none text-right text-xs text-text-dim">
                  {i + 1}
                </span>
                <input
                  type="number"
                  step="any"
                  className={`${inputCls} flex-1`}
                  value={toDisplayValue(mm, unit)}
                  onChange={(e) => {
                    const newMm = parseToMm(e.target.value, unit);
                    if (!isNaN(newMm)) {
                      const base =
                        scaleLength.individualMm ??
                        Array<number>(numStrings).fill(scaleLength.fundamentalMm);
                      const updated = [...base];
                      updated[i] = newMm;
                      onChange({ individualMm: updated });
                    }
                  }}
                />
              </div>
            );
          })}
          <div className="pt-1">
            <label className={labelCls}>
              {t('panel.scaleLength.perpendicular')} (0–1)
              <HelpTip text={t('help.scaleLength.perpendicular')} />
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className={inputCls}
              value={scaleLength.perpendicularDistance}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange({ perpendicularDistance: v });
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
