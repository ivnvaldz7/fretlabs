/**
 * "PDF" export — implemented as a print-ready HTML document.
 *
 * Generating real PDF bytes reliably requires a dedicated PDF library, which
 * this project intentionally avoids. Instead, we generate a standalone HTML
 * page that embeds the physically-sized SVG and triggers the browser's print
 * dialog; users can "Save as PDF" at 100% scale.
 */

import type { FretboardResult } from '../calculator/types';
import type { ExportOptions } from './types';
import { exportSvg } from './svg-export';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportPdfHtml(result: FretboardResult, options: ExportOptions): string {
  const svg = exportSvg(result, { ...options, format: 'svg' });

  const method =
    result.meta.method === 'equal'
      ? `Equal (${result.meta.tonesPerOctave ?? 12} TPO)`
      : `Scala (${result.meta.scalaDescription ?? 'custom'})`;

  const caption = `FretLabs | ${method} | Unit: ${options.unit} | Print at 100% scale`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(caption)}</title>`,
    '  <style>',
    '    @page { margin: 0; }',
    '    html, body { height: 100%; }',
    '    body { margin: 0; background: #fff; }',
    '    .wrap { height: 100%; display: flex; align-items: center; justify-content: center; }',
    '    .note {',
    '      position: fixed;',
    '      left: 10mm;',
    '      top: 10mm;',
    '      font: 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;',
    '      color: #111;',
    '      opacity: 0.75;',
    '    }',
    '    @media print { .note { opacity: 0.45; } }',
    '  </style>',
    '</head>',
    '<body>',
    `  <div class="note">${escapeHtml(caption)}</div>`,
    '  <div class="wrap">',
    svg,
    '  </div>',
    '  <script>',
    '    window.addEventListener("load", () => {',
    '      try { window.focus(); } catch {}',
    '      try { window.print(); } catch {}',
    '    });',
    '  </script>',
    '</body>',
    '</html>',
  ].join('\n');
}

