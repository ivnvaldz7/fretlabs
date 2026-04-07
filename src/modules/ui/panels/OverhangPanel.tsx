/**
 * OverhangPanel — controls fretboard edge overhang relative to the outer strings.
 *
 * Overhang is the distance from the center of the outer string to the fretboard edge.
 * It is applied in the calculator to expand the outline quadrilateral.
 */

import { fromMm, toMm } from '../../../utils/unit-converter';
import { useLocale } from '../../../hooks/useLocale';
import type { OverhangConfig, OverhangMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { DEFAULTS, LIMITS } from '../../../config/constants';
import { HelpTip } from '../display/HelpTip';

const MODES: OverhangMode[] = ['equal', 'nutBridge', 'firstLast', 'all'];

interface OverhangPanelProps {
  overhang: OverhangConfig | undefined;
  unit: Unit;
  onChange: (update: Partial<OverhangConfig>) => void;
}

function toDisplayValue(mm: number, unit: Unit): string {
  return parseFloat(fromMm(mm, unit).toPrecision(7)).toString();
}

function parseToMm(raw: string, unit: Unit): number {
  return toMm(parseFloat(raw), unit);
}

function ensure(overhang: OverhangConfig | undefined): OverhangConfig {
  return overhang ?? { mode: 'equal', equalMm: DEFAULTS.OVERHANG_MM };
}

export function OverhangPanel({ overhang, unit, onChange }: OverhangPanelProps) {
  const { t } = useLocale();
  const oh = ensure(overhang);

  const inputCls =
    'w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none';
  const labelCls = 'mb-0.5 block text-xs text-text-muted';

  const clampOverhang = (mm: number): number => {
    if (!Number.isFinite(mm)) return DEFAULTS.OVERHANG_MM;
    return Math.min(LIMITS.MAX_OVERHANG_MM, Math.max(LIMITS.MIN_OVERHANG_MM, mm));
  };

  const setMode = (mode: OverhangMode) => {
    // Initialize missing values with a reasonable default for the new mode.
    const base = oh.equalMm ?? DEFAULTS.OVERHANG_MM;
    const next: Partial<OverhangConfig> = { mode };
    if (mode === 'equal') next.equalMm = base;
    if (mode === 'nutBridge') {
      next.nutMm = oh.nutMm ?? base;
      next.bridgeMm = oh.bridgeMm ?? base;
    }
    if (mode === 'firstLast') {
      next.firstMm = oh.firstMm ?? base;
      next.lastMm = oh.lastMm ?? base;
    }
    if (mode === 'all') {
      next.nutFirstMm = oh.nutFirstMm ?? oh.firstMm ?? oh.nutMm ?? base;
      next.nutLastMm = oh.nutLastMm ?? oh.lastMm ?? oh.nutMm ?? base;
      next.bridgeFirstMm = oh.bridgeFirstMm ?? oh.firstMm ?? oh.bridgeMm ?? base;
      next.bridgeLastMm = oh.bridgeLastMm ?? oh.lastMm ?? oh.bridgeMm ?? base;
    }
    onChange(next);
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.overhang.label')}
      </h3>

      <div className="mb-3 flex overflow-hidden rounded border border-border">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`flex-1 py-1 text-xs transition-colors ${
              oh.mode === mode
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-muted hover:text-text'
            }`}
          >
            {t(`panel.overhang.mode.${mode}`)}
          </button>
        ))}
      </div>

      {oh.mode === 'equal' && (
        <div>
          <label className={labelCls}>
            {t('panel.overhang.equal')} ({unit})
            <HelpTip text={t('help.overhang.about')} />
          </label>
          <input
            type="number"
            step="any"
            min={fromMm(LIMITS.MIN_OVERHANG_MM, unit)}
            max={fromMm(LIMITS.MAX_OVERHANG_MM, unit)}
            className={inputCls}
            value={toDisplayValue(oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
            onChange={(e) => {
              const mm = clampOverhang(parseToMm(e.target.value, unit));
              if (!isNaN(mm)) onChange({ equalMm: mm });
            }}
          />
        </div>
      )}

      {oh.mode === 'nutBridge' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>
              {t('panel.overhang.nut')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(oh.nutMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
                const mm = clampOverhang(parseToMm(e.target.value, unit));
                if (!isNaN(mm)) onChange({ nutMm: mm });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t('panel.overhang.bridge')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(oh.bridgeMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
                const mm = clampOverhang(parseToMm(e.target.value, unit));
                if (!isNaN(mm)) onChange({ bridgeMm: mm });
              }}
            />
          </div>
        </div>
      )}

      {oh.mode === 'firstLast' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>
              {t('panel.overhang.first')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(oh.firstMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
                const mm = clampOverhang(parseToMm(e.target.value, unit));
                if (!isNaN(mm)) onChange({ firstMm: mm });
              }}
            />
          </div>
          <div>
            <label className={labelCls}>
              {t('panel.overhang.last')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={toDisplayValue(oh.lastMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
                const mm = clampOverhang(parseToMm(e.target.value, unit));
                if (!isNaN(mm)) onChange({ lastMm: mm });
              }}
            />
          </div>
        </div>
      )}

      {oh.mode === 'all' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>
                {t('panel.overhang.nutFirst')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={toDisplayValue(oh.nutFirstMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
                  const mm = clampOverhang(parseToMm(e.target.value, unit));
                  if (!isNaN(mm)) onChange({ nutFirstMm: mm });
                }}
              />
            </div>
            <div>
              <label className={labelCls}>
                {t('panel.overhang.nutLast')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={toDisplayValue(oh.nutLastMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
                  const mm = clampOverhang(parseToMm(e.target.value, unit));
                  if (!isNaN(mm)) onChange({ nutLastMm: mm });
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>
                {t('panel.overhang.bridgeFirst')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={toDisplayValue(oh.bridgeFirstMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
                  const mm = clampOverhang(parseToMm(e.target.value, unit));
                  if (!isNaN(mm)) onChange({ bridgeFirstMm: mm });
                }}
              />
            </div>
            <div>
              <label className={labelCls}>
                {t('panel.overhang.bridgeLast')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={toDisplayValue(oh.bridgeLastMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
                  const mm = clampOverhang(parseToMm(e.target.value, unit));
                  if (!isNaN(mm)) onChange({ bridgeLastMm: mm });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
