import { type ReactNode } from 'react';
import { FretboardSVG } from '../../renderer/FretboardSVG';
import { FretTable } from './FretTable';
import { useLocale } from '../../../hooks/useLocale';
import type { FretboardResult } from '../../calculator/types';
import type { Unit, DisplayPrecision } from '../../../config/constants';
import type { FretboardDisplayOptions } from '../../renderer/types';

type MainView = 'design' | 'table';

interface FretboardPreviewProps {
  result: FretboardResult | null;
  error: string | null;
  errorDetail: string | null;
  unit: Unit;
  displayOptions: FretboardDisplayOptions;
  displayPrecision: DisplayPrecision;
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  onToggleDisplayOption: (key: keyof FretboardDisplayOptions) => void;
  /** Extra buttons rendered in the toolbar next to the Design/Table toggle */
  toolbarButtons?: ReactNode;
}

export function FretboardPreview({
  result,
  error,
  errorDetail,
  unit,
  displayOptions,
  displayPrecision,
  mainView,
  onMainViewChange,
  onToggleDisplayOption,
  toolbarButtons,
}: FretboardPreviewProps) {
  const { t } = useLocale();

  return (
    <>
      <div className="flex flex-none items-center justify-between border-b border-border px-4 py-2 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded border border-border">
            <button
              type="button"
              onClick={() => onMainViewChange('design')}
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
              onClick={() => onMainViewChange('table')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mainView === 'table'
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-muted hover:text-text'
              }`}
            >
              {t('nav.table')}
            </button>
          </div>
          {toolbarButtons && (
            <div className="flex items-center gap-1">{toolbarButtons}</div>
          )}
          <span className="hidden text-sm font-medium text-text-muted md:inline">
            {mainView === 'design' ? t('preview.title') : t('table.title')}
          </span>
        </div>
        <div className="hidden items-center gap-3 md:flex md:gap-4">
          {mainView === 'design' &&
            (
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
                  onChange={() => onToggleDisplayOption(key)}
                  className="accent-primary"
                />
                <span className="hidden sm:inline">{t(labelKey)}</span>
              </label>
            ))}
        </div>
      </div>

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
              <FretboardSVG result={result} options={displayOptions} unit={unit} />
            </div>
          ) : (
            <FretTable
              result={result}
              unit={unit}
              precision={displayPrecision}
            />
          )
        ) : null}
      </div>
    </>
  );
}
