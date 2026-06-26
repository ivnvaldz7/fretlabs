/**
 * OverhangPanel — controls fretboard edge overhang relative to the outer strings.
 *
 * Overhang is the distance from the center of the outer string to the fretboard edge.
 * It is applied in the calculator to expand the outline quadrilateral.
 */

import { useState } from 'react';
import { toDisplayValue, parseToMm, fromMm } from '../../../utils/unit-converter';
import { INPUT_CLS, LABEL_CLS } from '../../../utils/ui-classes';
import { useLocale } from '../../../hooks/useLocale';
import { validatePositiveNumber } from '../../../utils/validators';
import type { OverhangConfig, OverhangMode } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { DEFAULTS, LIMITS } from '../../../config/constants';
import { HelpTip } from '../display/HelpTip';
import { FieldError } from '../shared/FieldError';

const MODES: OverhangMode[] = ['equal', 'nutBridge', 'firstLast', 'all'];

interface OverhangPanelProps {
  overhang: OverhangConfig | undefined;
  unit: Unit;
  onChange: (update: Partial<OverhangConfig>) => void;
}

function ensure(overhang: OverhangConfig | undefined): OverhangConfig {
  return overhang ?? { mode: 'equal', equalMm: DEFAULTS.OVERHANG_MM };
}

export function OverhangPanel({ overhang, unit, onChange }: OverhangPanelProps) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const oh = ensure(overhang);

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
          <label className={LABEL_CLS}>
            {t('panel.overhang.equal')} ({unit})
            <HelpTip text={t('help.overhang.about')} />
          </label>
          <input
            type="number"
            step="any"
            min={fromMm(LIMITS.MIN_OVERHANG_MM, unit)}
            max={fromMm(LIMITS.MAX_OVERHANG_MM, unit)}
            className={INPUT_CLS}
            value={toDisplayValue(oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
            onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ equalMm: clampOverhang(parsed) });
            }}
          />
          <FieldError message={error} />
        </div>
      )}

      {oh.mode === 'nutBridge' && (
        <div className="space-y-2">
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.nut')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={INPUT_CLS}
              value={toDisplayValue(oh.nutMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ nutMm: clampOverhang(parsed) });
              }}
            />
            <FieldError message={error} />
          </div>
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.bridge')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={INPUT_CLS}
              value={toDisplayValue(oh.bridgeMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ bridgeMm: clampOverhang(parsed) });
              }}
            />
            <FieldError message={error} />
          </div>
        </div>
      )}

      {oh.mode === 'firstLast' && (
        <div className="space-y-2">
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.first')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={INPUT_CLS}
              value={toDisplayValue(oh.firstMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ firstMm: clampOverhang(parsed) });
              }}
            />
            <FieldError message={error} />
          </div>
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.last')} ({unit})
              <HelpTip text={t('help.overhang.about')} />
            </label>
            <input
              type="number"
              step="any"
              className={INPUT_CLS}
              value={toDisplayValue(oh.lastMm ?? oh.equalMm ?? DEFAULTS.OVERHANG_MM, unit)}
              onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ lastMm: clampOverhang(parsed) });
              }}
            />
            <FieldError message={error} />
          </div>
        </div>
      )}

      {oh.mode === 'all' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>
                {t('panel.overhang.nutFirst')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={INPUT_CLS}
                value={toDisplayValue(oh.nutFirstMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ nutFirstMm: clampOverhang(parsed) });
                }}
              />
            <FieldError message={error} />
            </div>
            <div>
              <label className={LABEL_CLS}>
                {t('panel.overhang.nutLast')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={INPUT_CLS}
                value={toDisplayValue(oh.nutLastMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ nutLastMm: clampOverhang(parsed) });
                }}
              />
            <FieldError message={error} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>
                {t('panel.overhang.bridgeFirst')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={INPUT_CLS}
                value={toDisplayValue(oh.bridgeFirstMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ bridgeFirstMm: clampOverhang(parsed) });
                }}
              />
            <FieldError message={error} />
            </div>
            <div>
              <label className={LABEL_CLS}>
                {t('panel.overhang.bridgeLast')} ({unit})
                <HelpTip text={t('help.overhang.about')} />
              </label>
              <input
                type="number"
                step="any"
                className={INPUT_CLS}
                value={toDisplayValue(oh.bridgeLastMm ?? DEFAULTS.OVERHANG_MM, unit)}
                onChange={(e) => {
              const parsed = parseToMm(e.target.value, unit);
              if (parsed === null) return;
              const result = validatePositiveNumber(parsed);
              setError(result.valid ? null : result.error ?? null);
              if (result.valid) onChange({ bridgeLastMm: clampOverhang(parsed) });
                }}
              />
            <FieldError message={error} />
            </div>
          </div>
        </div>
      )}

      {/* ── Longitudinal extensions (shared across all lateral modes) ── */}
      <div className="mt-3 border-t border-border pt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-dim">
          {t('panel.overhang.extensions')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.nutExtension')} ({unit})
              <HelpTip text={t('help.overhang.nutExtension')} />
            </label>
            <input
              type="number"
              step="any"
              min={fromMm(LIMITS.MIN_EXTENSION_MM, unit)}
              max={fromMm(LIMITS.MAX_EXTENSION_MM, unit)}
              className={INPUT_CLS}
              value={toDisplayValue(oh.nutExtensionMm ?? DEFAULTS.NUT_EXTENSION_MM, unit)}
              onChange={(e) => {
                const mm = parseToMm(e.target.value, unit);
                if (mm === null) return;
                const result = validatePositiveNumber(mm);
                setError(result.valid ? null : result.error ?? null);
                if (result.valid) {
                  const clamped = Math.min(LIMITS.MAX_EXTENSION_MM, Math.max(LIMITS.MIN_EXTENSION_MM, mm));
                  onChange({ nutExtensionMm: clamped });
                }
              }}
            />
            <FieldError message={error} />
          </div>
          <div>
            <label className={LABEL_CLS}>
              {t('panel.overhang.lastFretExtension')} ({unit})
              <HelpTip text={t('help.overhang.lastFretExtension')} />
            </label>
            <input
              type="number"
              step="any"
              min={fromMm(LIMITS.MIN_EXTENSION_MM, unit)}
              max={fromMm(LIMITS.MAX_EXTENSION_MM, unit)}
              className={INPUT_CLS}
              value={toDisplayValue(oh.lastFretExtensionMm ?? DEFAULTS.LAST_FRET_EXTENSION_MM, unit)}
              onChange={(e) => {
                const mm = parseToMm(e.target.value, unit);
                if (mm === null) return;
                const result = validatePositiveNumber(mm);
                setError(result.valid ? null : result.error ?? null);
                if (result.valid) {
                  const clamped = Math.min(LIMITS.MAX_EXTENSION_MM, Math.max(LIMITS.MIN_EXTENSION_MM, mm));
                  onChange({ lastFretExtensionMm: clamped });
                }
              }}
            />
            <FieldError message={error} />
          </div>
        </div>
      </div>
    </section>
  );
}
