/**
 * AppShell — main application layout.
 *
 * Desktop (md+): sidebar (left) + main preview area (right).
 * Mobile (<md):  all panels stacked vertically (collapsible), preview below.
 */

import { useState } from 'react';
import { useFretboard } from '../../../hooks/useFretboard';
import { FretboardSVG } from '../../renderer/FretboardSVG';
import {
  DEFAULT_DISPLAY_OPTIONS,
  type FretboardDisplayOptions,
} from '../../renderer/types';
import { PresetSelector } from '../panels/PresetSelector';
import { ScaleLengthPanel } from '../panels/ScaleLengthPanel';
import { StringsPanel } from '../panels/StringsPanel';
import { OverhangPanel } from '../panels/OverhangPanel';
import { CalculationPanel } from '../panels/CalculationPanel';
import { ExportMenu } from '../export/ExportMenu';
import { FretTable } from '../display/FretTable';
import { HelpTip } from '../display/HelpTip';
import { useLocale } from '../../../hooks/useLocale';
import type { Locale } from '../../../i18n';
import type { Unit, DisplayPrecision } from '../../../config/constants';
import {
  DISPLAY_PRECISIONS,
  DEFAULT_DISPLAY_PRECISION,
} from '../../../config/constants';

const UNITS: Unit[] = ['mm', 'in', 'cm'];

type SectionKey = 'preset' | 'scaleLength' | 'strings' | 'overhang' | 'calculation' | 'frets' | 'export';
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

  const {
    config,
    result,
    error,
    errorDetail,
    notice,
    clearNotice,
    updateScaleLength,
    updateStrings,
    updateCalculation,
    updateOverhang,
    setNumFrets,
    setUnit,
    applyPreset,
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
        <div className="flex items-center gap-3">
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

        {/* ── Sidebar / Panel stack ──────────────────────────────────── */}
        <aside className="flex flex-none flex-col overflow-y-auto border-b border-border md:w-72 md:border-b-0 md:border-r md:p-4">

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

          {/* Calculation — collapsible on mobile */}
          <Section sectionKey="calculation" title={t('panel.calculation.label')} open={isOpen('calculation')} onToggle={toggleSection}>
            <CalculationPanel
              calculation={config.calculation}
              numStrings={config.strings.count}
              onChange={updateCalculation}
            />
          </Section>

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

        {/* ── Main content ───────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-auto">
          {/* Preview toolbar */}
          <div className="flex flex-none items-center justify-between border-b border-border px-4 py-2 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex overflow-hidden rounded border border-border">
                <button
                  type="button"
                  onClick={() => setMainView('design')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    mainView === 'design'
                      ? 'bg-primary text-white'
                      : 'bg-surface-alt text-text-muted hover:text-text'
                  }`}
                >
                  {t('nav.design')}
                </button>
                <button
                  type="button"
                  onClick={() => setMainView('table')}
                  className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    mainView === 'table'
                      ? 'bg-primary text-white'
                      : 'bg-surface-alt text-text-muted hover:text-text'
                  }`}
                >
                  {t('nav.table')}
                </button>
              </div>
              <span className="hidden text-sm font-medium text-text-muted md:inline">
                {mainView === 'design' ? t('preview.title') : t('table.title')}
              </span>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {mainView === 'design' &&
                ((
                  [
                    ['showEdges', 'preview.options.showEdges'],
                    ['showStrings', 'preview.options.showStrings'],
                    ['extendFrets', 'preview.options.extendFrets'],
                    ['showAnnotations', 'preview.options.showAnnotations'],
                  ] as [keyof FretboardDisplayOptions, string][]
                ).map(([key, labelKey]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-text-muted"
                  >
                    <input
                      type="checkbox"
                      checked={displayOptions[key]}
                      onChange={() => toggleDisplayOption(key)}
                      className="accent-primary"
                    />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                  </label>
                )))}
            </div>
          </div>

          {/* Main area (Preview or Table) */}
          <div className="flex flex-1 items-center justify-center p-4 md:p-8">
            {error ? (
              <div className="max-w-lg rounded border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                <div>{t(error)}</div>
                {errorDetail && (
                  <div className="mt-1 font-mono text-xs text-error/90">
                    {errorDetail}
                  </div>
                )}
              </div>
            ) : result ? (
              mainView === 'design' ? (
                <div className="w-full max-w-5xl">
                  <FretboardSVG result={result} options={displayOptions} unit={config.unit} />
                </div>
              ) : (
                <FretTable
                  result={result}
                  unit={config.unit}
                  precision={displayPrecision}
                />
              )
            ) : null}
          </div>

          {notice && (
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
    </div>
  );
}
