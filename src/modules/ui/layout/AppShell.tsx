/**
 * AppShell — main application layout.
 *
 * Desktop (md+): sidebar (left) + main preview area (right).
 * Mobile (<md):  all panels stacked vertically (collapsible), preview below.
 */

import { useState } from 'react';
import { useFretboard } from '../../../hooks/useFretboard';
import {
  DEFAULT_DISPLAY_OPTIONS,
  type FretboardDisplayOptions,
} from '../../renderer/types';
import { PresetSelector } from '../panels/PresetSelector';
import { ScaleLengthPanel } from '../panels/ScaleLengthPanel';
import { StringsPanel } from '../panels/StringsPanel';
import { OverhangPanel } from '../panels/OverhangPanel';
import { CompensationPanel } from '../panels/CompensationPanel';
import { CalculationPanel } from '../panels/CalculationPanel';
import { ExportMenu } from '../export/ExportMenu';
import { HelpTip } from '../display/HelpTip';
import { FretboardPreview } from '../display/FretboardPreview';
import { CompareView } from '../display/CompareView';
import { MobileLayout } from './MobileLayout';
import { WarningBadge } from '../shared/WarningBadge';
import { useLocale } from '../../../hooks/useLocale';
import { useTheme } from '../../../hooks/useTheme';
import type { Locale } from '../../../i18n';
import type { Unit, DisplayPrecision } from '../../../config/constants';
import {
  DISPLAY_PRECISIONS,
  DEFAULT_DISPLAY_PRECISION,
} from '../../../config/constants';

const UNITS: Unit[] = ['mm', 'in', 'cm'];

type SectionKey = 'preset' | 'scaleLength' | 'strings' | 'overhang' | 'compensation' | 'calculation' | 'frets' | 'export';
type MainView = 'design' | 'table';

/** Chevron icon — rotates when open */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-none text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}

/**
 * Collapsible section wrapper.
 * On mobile: shows a tappable header that expands/collapses the content.
 * On desktop (md+): header is hidden, content always visible.
 */
function Section({
  sectionKey,
  title,
  open,
  onToggle,
  children,
}: {
  sectionKey: SectionKey;
  title: string;
  open: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border md:border-none">
      {/* Mobile toggle header — hidden on desktop */}
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center justify-between px-4 py-3 text-left md:hidden"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
          {title}
        </span>
        <Chevron open={open} />
      </button>

      {/* Content: conditionally shown on mobile, always shown on desktop.
          On mobile, hide internal panel <h3> headings — the Section button above
          already provides the section title. On desktop the button is hidden so
          the panel's own <h3> shows as normal. */}
      <div
        className={`px-4 pb-4 md:block md:px-0 md:pb-0 [&>section>h3]:hidden md:[&>section>h3]:block [&>div>section>h3]:hidden md:[&>div>section>h3]:block ${open ? 'block' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
}

function DonationButton({ t }: { t: (key: string) => string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText('0000177509553009633357');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="mt-4 border-t border-border p-4 text-center md:mt-auto md:border-t-0 md:p-3 md:rounded md:bg-surface-elevated md:border md:border-border">
      <p className="mb-2 text-xs font-medium text-text-dim">{t('donations.title')}</p>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        {copied ? t('donations.copied') : t('donations.button')}
      </button>
    </div>
  );
}

export function AppShell() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const {
    config,
    result,
    error,
    errorDetail,
    warnings,
    notice,
    clearNotice,
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
  } = useFretboard();

  const [displayOptions, setDisplayOptions] =
    useState<FretboardDisplayOptions>(DEFAULT_DISPLAY_OPTIONS);

  const [displayPrecision, setDisplayPrecision] =
    useState<DisplayPrecision>(DEFAULT_DISPLAY_PRECISION);

  const [mainView, setMainView] = useState<MainView>('design');

  // Which sections are expanded on mobile. Desktop always shows all.
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(['scaleLength']),
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isOpen = (key: SectionKey) => openSections.has(key);

  const toggleDisplayOption = (key: keyof FretboardDisplayOptions) => {
    setDisplayOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const inputCls =
    'w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none';
  const labelCls = 'mb-0.5 block text-xs text-text-muted';

  return (
    <div className="flex h-screen flex-col bg-surface text-text">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-none items-center justify-between border-b border-border px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-bold text-primary">{t('app.title')}</h1>
          <p className="text-xs text-text-dim">{t('app.tagline')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="rounded border border-border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-surface-elevated"
            title={t('undo.shortcut')}
            aria-label={t('undo.button')}
          >
            ↩
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="rounded border border-border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-surface-elevated"
            title={t('redo.shortcut')}
            aria-label={t('redo.button')}
          >
            ↪
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded border border-border bg-surface-alt px-2.5 py-1 text-sm text-text transition-colors hover:bg-surface-elevated"
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <span className="hidden text-xs text-text-dim md:inline">{t('language.label')}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded border border-border bg-surface-alt px-2 py-1 text-sm text-text"
          >
            <option value="en">{t('language.en')}</option>
            <option value="es">{t('language.es')}</option>
          </select>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">

        {/* ── Desktop sidebar + main ─────────────────────────────────── */}
        <div className="hidden min-h-0 flex-1 flex-col md:flex md:flex-row">

          {/* ── Sidebar / Panel stack ────────────────────────────────── */}
          <aside className="flex flex-none flex-col overflow-y-auto border-r border-border w-72 p-4">

          {/* Unit selector — always visible, not collapsible */}
          
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:mb-2 md:border-none md:px-0 md:py-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {t('panel.units.label')}
              <HelpTip text={t('help.units.about')} align="right" />
            </span>
            <div className="flex overflow-hidden rounded border border-border">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-0.5 text-xs transition-colors ${
                    config.unit === u
                      ? 'bg-primary text-white'
                      : 'bg-surface-elevated text-text-muted hover:text-text'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Display precision — only shown when inches selected */}
          {config.unit === 'in' && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2 md:border-none md:px-0 md:py-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t('panel.units.precision')}
              </span>
              <select
                value={displayPrecision}
                onChange={(e) => setDisplayPrecision(e.target.value as DisplayPrecision)}
                className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-xs text-text"
              >
                {DISPLAY_PRECISIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(`panel.units.precisionOptions.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preset — collapsible on mobile */}
          <Section sectionKey="preset" title={t('panel.preset.label')} open={isOpen('preset')} onToggle={toggleSection}>
            <div className="md:mt-0">
              <PresetSelector onSelect={applyPreset} />
            </div>
          </Section>

          {/* Scale Length — collapsible on mobile, open by default */}
          <Section sectionKey="scaleLength" title={t('panel.scaleLength.label')} open={isOpen('scaleLength')} onToggle={toggleSection}>
            <ScaleLengthPanel
              scaleLength={config.scaleLength}
              numStrings={config.strings.count}
              unit={config.unit}
              onChange={updateScaleLength}
            />
          </Section>

          {/* Strings — collapsible on mobile */}
          <Section sectionKey="strings" title={t('panel.strings.label')} open={isOpen('strings')} onToggle={toggleSection}>
            <StringsPanel
              strings={config.strings}
              unit={config.unit}
              onChange={updateStrings}
            />
          </Section>

          {/* Overhang — collapsible on mobile */}
          <Section sectionKey="overhang" title={t('panel.overhang.label')} open={isOpen('overhang')} onToggle={toggleSection}>
            <OverhangPanel
              overhang={config.overhang}
              unit={config.unit}
              onChange={updateOverhang}
            />
          </Section>

          {/* Compensation — collapsible on mobile */}
          <Section sectionKey="compensation" title={t('panel.compensation.label')} open={isOpen('compensation')} onToggle={toggleSection}>
            <CompensationPanel
              compensation={config.compensation}
              numStrings={config.strings.count}
              unit={config.unit}
              onChange={updateCompensation}
            />
          </Section>

          {/* Calculation — collapsible on mobile */}
          <Section sectionKey="calculation" title={t('panel.calculation.label')} open={isOpen('calculation')} onToggle={toggleSection}>
            <CalculationPanel
              calculation={config.calculation}
              numStrings={config.strings.count}
              onChange={updateCalculation}
            />
          </Section>

          {/* Warnings — shown when any threshold is exceeded */}
          {warnings.length > 0 && (
            <div className="space-y-2 border-b border-border px-4 py-3 md:border-none md:px-0">
              {warnings.map((msg, i) => (
                <WarningBadge key={i} message={msg} />
              ))}
            </div>
          )}

          {/* Frets — collapsible on mobile */}
          <Section sectionKey="frets" title={t('panel.frets.label')} open={isOpen('frets')} onToggle={toggleSection}>
            <label className={labelCls}>
              {t('panel.frets.count')}
              <HelpTip text={t('help.frets.count')} />
            </label>
            <input
              type="number"
              min="1"
              max="72"
              step="1"
              className={inputCls}
              value={config.numFrets}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n >= 1) setNumFrets(n);
              }}
            />
          </Section>

          {/* Export — collapsible on mobile */}
          <Section sectionKey="export" title={t('export.title')} open={isOpen('export')} onToggle={toggleSection}>
            <ExportMenu result={result} unit={config.unit} />
          </Section>

          {/* Donations */}
          <DonationButton t={t} />
          </aside>

          {/* ── Desktop main content ────────────────────────────────── */}
          <main className="flex flex-1 flex-col overflow-auto">
            {isCompareMode && compareResult && result ? (
              <CompareView
                liveResult={result}
                referenceResult={compareResult}
                unit={config.unit}
                displayOptions={displayOptions}
              />
            ) : (
              <FretboardPreview
                result={result}
                error={error}
                errorDetail={errorDetail}
                unit={config.unit}
                displayOptions={displayOptions}
                displayPrecision={displayPrecision}
                mainView={mainView}
                onMainViewChange={setMainView}
                onToggleDisplayOption={toggleDisplayOption}
                toolbarButtons={
                  <button
                    type="button"
                    onClick={enterCompareMode}
                    disabled={!result}
                    className={`rounded border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      !result
                        ? 'cursor-not-allowed border-border bg-surface-alt text-text-dim opacity-40'
                        : 'border-primary bg-surface-alt text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    {t('compare.enter')}
                  </button>
                }
              />
            )}

            {isCompareMode && (
              <div className="flex flex-none items-center justify-between border-t border-border px-2 py-1 md:px-6">
                <span className="text-xs text-text-dim">{t('compare.exit')}</span>
                <button
                  type="button"
                  onClick={exitCompareMode}
                  className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
                >
                  {t('compare.exit')}
                </button>
              </div>
            )}

            {!isCompareMode && notice && (
              <div className="flex flex-none items-center justify-between border-t border-border px-4 py-3 text-sm md:px-6">
                <span className="text-text-muted">{t(notice)}</span>
                <button
                  type="button"
                  onClick={clearNotice}
                  className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
                >
                  OK
                </button>
              </div>
            )}
          </main>
        </div>

        {/* ── Mobile layout (hidden on desktop) ────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col md:hidden">
          {/* Unit selector */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {t('panel.units.label')}
            </span>
            <div className="flex overflow-hidden rounded border border-border">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-0.5 text-xs transition-colors ${
                    config.unit === u
                      ? 'bg-primary text-white'
                      : 'bg-surface-elevated text-text-muted hover:text-text'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Display precision — mobile */}
          {config.unit === 'in' && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-xs text-text-dim">{t('panel.units.precision')}</span>
              <select
                value={displayPrecision}
                onChange={(e) => setDisplayPrecision(e.target.value as DisplayPrecision)}
                className="rounded border border-border bg-surface-elevated px-2 py-0.5 text-xs text-text"
              >
                {DISPLAY_PRECISIONS.map((p) => (
                  <option key={p} value={p}>
                    {t(`panel.units.precisionOptions.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Warnings — mobile */}
          {warnings.length > 0 && (
            <div className="space-y-2 border-b border-border px-4 py-3">
              {warnings.map((msg, i) => (
                <WarningBadge key={i} message={msg} />
              ))}
            </div>
          )}

          <MobileLayout
            panels={[
              {
                id: 'preset',
                label: t('panel.preset.label'),
                content: <PresetSelector onSelect={applyPreset} />,
              },
              {
                id: 'scaleLength',
                label: t('panel.scaleLength.label'),
                content: (
                  <ScaleLengthPanel
                    scaleLength={config.scaleLength}
                    numStrings={config.strings.count}
                    unit={config.unit}
                    onChange={updateScaleLength}
                  />
                ),
              },
              {
                id: 'strings',
                label: t('panel.strings.label'),
                content: (
                  <StringsPanel
                    strings={config.strings}
                    unit={config.unit}
                    onChange={updateStrings}
                  />
                ),
              },
              {
                id: 'overhang',
                label: t('panel.overhang.label'),
                content: (
                  <OverhangPanel
                    overhang={config.overhang}
                    unit={config.unit}
                    onChange={updateOverhang}
                  />
                ),
              },
              {
                id: 'compensation',
                label: t('panel.compensation.label'),
                content: (
                  <CompensationPanel
                    compensation={config.compensation}
                    numStrings={config.strings.count}
                    unit={config.unit}
                    onChange={updateCompensation}
                  />
                ),
              },
              {
                id: 'calculation',
                label: t('panel.calculation.label'),
                content: (
                  <CalculationPanel
                    calculation={config.calculation}
                    numStrings={config.strings.count}
                    onChange={updateCalculation}
                  />
                ),
              },
              {
                id: 'frets',
                label: t('panel.frets.label'),
                content: (
                  <div>
                    <label className="mb-0.5 block text-xs text-text-muted">
                      {t('panel.frets.count')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      step="1"
                      className="w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
                      value={config.numFrets}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!isNaN(n) && n >= 1) setNumFrets(n);
                      }}
                    />
                  </div>
                ),
              },
              {
                id: 'export',
                label: t('export.title'),
                content: <ExportMenu result={result} unit={config.unit} />,
              },
            ]}
            preview={
              <div className="flex flex-1 flex-col">
                {isCompareMode && compareResult && result ? (
                  <CompareView
                    liveResult={result}
                    referenceResult={compareResult}
                    unit={config.unit}
                    displayOptions={displayOptions}
                  />
                ) : (
                  <FretboardPreview
                    result={result}
                    error={error}
                    errorDetail={errorDetail}
                    unit={config.unit}
                    displayOptions={displayOptions}
                    displayPrecision={displayPrecision}
                    mainView={mainView}
                    onMainViewChange={setMainView}
                    onToggleDisplayOption={toggleDisplayOption}
                  />
                )}
                {isCompareMode ? (
                  <button
                    type="button"
                    onClick={exitCompareMode}
                    className="flex-none border-t border-border px-4 py-3 text-xs text-text-muted hover:text-text"
                  >
                    {t('compare.exit')}
                  </button>
                ) : notice ? (
                  <div className="flex flex-none items-center justify-between border-t border-border px-4 py-3 text-sm">
                    <span className="text-text-muted">{t(notice)}</span>
                    <button
                      type="button"
                      onClick={clearNotice}
                      className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
                    >
                      OK
                    </button>
                  </div>
                ) : null}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
