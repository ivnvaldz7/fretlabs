/**
 * ExportMenu — download buttons for SVG, DXF, and CSV.
 *
 * This component is the only place that touches the browser download API.
 * The three exporter modules (svg-export, dxf-export, csv-export) return
 * pure strings; ExportMenu converts them to Blob URLs and triggers the save.
 *
 * Buttons are disabled when there is no valid FretboardResult (e.g. during
 * an invalid Scala input).
 */

import { useState } from 'react';
import { exportSvg } from '../../exporter/svg-export';
import { exportDxf } from '../../exporter/dxf-export';
import { exportCsv } from '../../exporter/csv-export';
import type { FretboardResult } from '../../calculator/types';
import type { ExportOptions } from '../../exporter/types';
import type { Unit } from '../../../config/constants';
import { useLocale } from '../../../hooks/useLocale';

interface ExportMenuProps {
  result: FretboardResult | null;
  unit: Unit;
}

/**
 * Trigger a browser file download from a string.
 * The URL is revoked immediately after the download is initiated.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type FormatKey = 'svg' | 'dxf' | 'csv';

/**
 * Export menu with SVG, DXF, and CSV download buttons.
 *
 * @param result - Calculated fretboard data (null disables all buttons)
 * @param unit   - Active unit used as the default export unit
 */
export function ExportMenu({ result, unit }: ExportMenuProps) {
  const { t } = useLocale();
  // Track which button is in a transient "success" state
  const [successKey, setSuccessKey] = useState<FormatKey | null>(null);

  const options: ExportOptions = { format: 'svg', unit, layers: true };

  const handleExport = (format: FormatKey) => {
    if (!result) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'svg') {
      content = exportSvg(result, { ...options, format: 'svg' });
      filename = 'fretlabs-design.svg';
      mimeType = 'image/svg+xml';
    } else if (format === 'dxf') {
      content = exportDxf(result, { ...options, format: 'dxf' });
      filename = 'fretlabs-design.dxf';
      mimeType = 'application/dxf';
    } else {
      content = exportCsv(result, { ...options, format: 'csv' });
      filename = 'fretlabs-positions.csv';
      mimeType = 'text/csv';
    }

    downloadFile(content, filename, mimeType);

    // Brief visual feedback on the button
    setSuccessKey(format);
    setTimeout(() => setSuccessKey(null), 1500);
  };

  const buttons: { key: FormatKey; label: string; successLabel: string }[] = [
    { key: 'svg', label: t('export.svg'), successLabel: '✓ SVG' },
    { key: 'dxf', label: t('export.dxf'), successLabel: '✓ DXF' },
    { key: 'csv', label: t('export.csv'), successLabel: '✓ CSV' },
  ];

  const disabled = result === null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('export.title')}
      </h3>
      <div className="flex flex-col gap-1.5">
        {buttons.map(({ key, label, successLabel }) => {
          const isSuccess = successKey === key;
          return (
            <button
              key={key}
              onClick={() => handleExport(key)}
              disabled={disabled}
              className={`w-full rounded border px-3 py-1.5 text-sm transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-border text-text-dim opacity-40'
                  : isSuccess
                  ? 'border-success bg-success/10 text-success'
                  : 'border-primary text-primary hover:bg-primary hover:text-white'
              }`}
            >
              {isSuccess ? successLabel : label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
