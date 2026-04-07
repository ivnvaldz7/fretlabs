import { useMemo, useState } from 'react';
import type { FretboardResult } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import { fromMm } from '../../../utils/unit-converter';
import { UNIT_PRECISION } from '../../../config/constants';
import { useLocale } from '../../../hooks/useLocale';

interface FretTableProps {
  result: FretboardResult;
  unit: Unit;
}

type TableMode = 'fromNut' | 'fromPrevious';

function buildCopyText(result: FretboardResult, unit: Unit): string {
  const numStrings = result.strings.length;
  const fretsPerString = Math.floor(result.fretPositions.length / Math.max(1, numStrings));
  const precision = UNIT_PRECISION[unit];
  const fmt = (mm: number) => fromMm(mm, unit).toFixed(precision);

  const header = ['Fret', ...Array.from({ length: numStrings }, (_, i) => `String ${i + 1} (${unit})`)];

  const section = (title: string, mode: TableMode) => {
    const rows: string[] = [];
    rows.push(`# ${title}`);
    rows.push(header.join('\t'));
    for (let fn = 0; fn < fretsPerString; fn++) {
      const fretLabel = fn === 0 ? '0 (Nut)' : String(fn);
      const cells: string[] = [fretLabel];
      for (let si = 0; si < numStrings; si++) {
        const fp = result.fretPositions[si * fretsPerString + fn];
        if (!fp) continue;
        if (mode === 'fromNut') cells.push(fmt(fp.distanceFromNutMm));
        else cells.push(fn === 0 ? '—' : fmt(fp.distanceFromPreviousMm));
      }
      rows.push(cells.join('\t'));
    }
    return rows.join('\n');
  };

  return [
    'FretLabs — Fret Position Table',
    '',
    section('Distance from nut', 'fromNut'),
    '',
    section('Distance from previous fret', 'fromPrevious'),
  ].join('\n');
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback: create a temporary textarea
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

export function FretTable({ result, unit }: FretTableProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<TableMode>('fromNut');
  const [copied, setCopied] = useState(false);

  const numStrings = result.strings.length;
  const fretsPerString = Math.floor(result.fretPositions.length / Math.max(1, numStrings));
  const precision = UNIT_PRECISION[unit];

  const rows = useMemo(() => {
    const fmt = (mm: number) => fromMm(mm, unit).toFixed(precision);
    return Array.from({ length: fretsPerString }, (_, fn) => {
      const fretLabel = fn === 0 ? '0 (Nut)' : String(fn);
      const values = Array.from({ length: numStrings }, (_, si) => {
        const fp = result.fretPositions[si * fretsPerString + fn];
        if (!fp) return '';
        return mode === 'fromNut'
          ? fmt(fp.distanceFromNutMm)
          : fn === 0
            ? '—'
            : fmt(fp.distanceFromPreviousMm);
      });
      return { fn, fretLabel, values };
    });
  }, [fretsPerString, mode, numStrings, precision, result.fretPositions, unit]);

  const copy = async () => {
    await copyToClipboard(buildCopyText(result, unit));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const btnCls = (active: boolean) =>
    `rounded border px-2 py-1 text-xs transition-colors ${
      active
        ? 'border-primary bg-primary text-white'
        : 'border-border bg-surface-alt text-text-muted hover:text-text'
    }`;

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-muted">
            {t('table.title')}
          </span>
          <div className="flex overflow-hidden rounded border border-border">
            <button
              type="button"
              className={btnCls(mode === 'fromNut')}
              onClick={() => setMode('fromNut')}
            >
              {t('table.distanceFromNut')}
            </button>
            <button
              type="button"
              className={btnCls(mode === 'fromPrevious')}
              onClick={() => setMode('fromPrevious')}
            >
              {t('table.distanceFromPrevious')}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={copy}
          className="rounded border border-primary px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {copied ? t('table.copied') : t('table.copy')}
        </button>
      </div>

      <div className="overflow-auto rounded border border-border bg-surface-elevated">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-alt">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t('table.fret')}
              </th>
              {Array.from({ length: numStrings }, (_, i) => (
                <th
                  key={i}
                  className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-dim"
                >
                  {`S${i + 1} (${unit})`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.fn} className="odd:bg-surface">
                <td className="border-b border-border px-3 py-2 font-mono text-xs text-text-dim">
                  {r.fretLabel}
                </td>
                {r.values.map((v, i) => (
                  <td key={i} className="border-b border-border px-3 py-2 font-mono">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

