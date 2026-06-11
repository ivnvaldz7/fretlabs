/**
 * SVG export — generates a standalone, physically-sized SVG string.
 *
 * The exported file uses a white background and is intended as a
 * design / reference document suitable for Inkscape, Illustrator,
 * or direct laser cutter import. Coordinates are kept in mm (the
 * internal unit) regardless of ExportOptions.unit; the width/height
 * attributes are expressed in the chosen unit so the file opens at
 * the correct physical size in CAD applications.
 *
 * Visual layers (bottom to top):
 *   1. White background rect
 *   2. Fretboard fill (light tan wood)
 *   3. Fret lines (nut is thicker)
 *   4. String lines
 *   5. Fretboard outline stroke
 *   6. Annotations (dimensions, labels)
 */

import type { FretboardResult } from '../calculator/types';
import type { ExportOptions } from './types';
import { fromMm } from '../../utils/unit-converter';
import { extendSegmentToOutline } from '../../utils/extend-line-to-outline';
import { lineLength } from '../../utils/geometry';

// ── Visual constants (light / print-friendly palette) ──────────────────────

const COLOR_BACKGROUND = '#FFFFFF';
const COLOR_BOARD_FILL = '#F5EFE0';
const COLOR_BOARD_EDGE = '#1A1A1A';
const COLOR_FRET = '#2A2A2A';
const COLOR_NUT = '#1A1A1A';
const COLOR_STRING = '#888888';
const COLOR_ANNOTATION = '#FFFFFF';
const COLOR_ANNOTATION_BG = 'rgba(0,0,0,0.75)';

const STROKE_FRET_MM = 0.6;
const STROKE_NUT_MM = 2.5;
const STROKE_STRING_MM = 0.35;
const STROKE_BOARD_EDGE_MM = 0.8;

const SVG_PADDING_MM = 10;
const FONT_SIZE_MM = 3;
const ANNOTATION_PADDING = 2;

/** Format a number to 4 decimal places for SVG coordinates */
function f(n: number): string {
  return n.toFixed(4);
}

/** Format a mm value for display */
function formatMm(valueMm: number, unit: string): string {
  const converted = valueMm / (unit === 'cm' ? 10 : unit === 'in' ? 25.4 : 1);
  return converted.toFixed(2);
}

/** Escape text for SVG */
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Generate a standalone SVG string from a fretboard calculation.
 *
 * @param result - Complete fretboard calculation result
 * @param options - Export options (unit is used for the width/height attributes)
 * @returns Complete SVG file content as a string
 */
export function exportSvg(result: FretboardResult, options: ExportOptions): string {
  const { unit } = options;
  const { fretLines, strings: stringLines, outline } = result;
  const extendFrets = options.extendFrets === true;
  const showAnnotations = options.annotations !== false;

  // ── Compute bounding box and viewBox (all in mm) ──────────────────────────

  const xs = [
    outline.nutFirst.x,
    outline.nutLast.x,
    outline.bridgeFirst.x,
    outline.bridgeLast.x,
  ];
  const ys = [
    outline.nutFirst.y,
    outline.nutLast.y,
    outline.bridgeFirst.y,
    outline.bridgeLast.y,
  ];

  const minX = Math.min(...xs) - SVG_PADDING_MM;
  const minY = Math.min(...ys) - SVG_PADDING_MM;
  const maxX = Math.max(...xs) + SVG_PADDING_MM;
  const maxY = Math.max(...ys) + SVG_PADDING_MM;
  const widthMm = maxX - minX;
  const heightMm = maxY - minY;

  // Physical dimensions in the chosen unit (for width/height attributes)
  const widthDisplay = fromMm(widthMm, unit).toFixed(4);
  const heightDisplay = fromMm(heightMm, unit).toFixed(4);

  const viewBox = `${f(minX)} ${f(minY)} ${f(widthMm)} ${f(heightMm)}`;

  // ── Outline path (closed quadrilateral) ─────────────────��────────────────

  const boardPath = [
    `M ${f(outline.nutFirst.x)} ${f(outline.nutFirst.y)}`,
    `L ${f(outline.nutLast.x)} ${f(outline.nutLast.y)}`,
    `L ${f(outline.bridgeLast.x)} ${f(outline.bridgeLast.y)}`,
    `L ${f(outline.bridgeFirst.x)} ${f(outline.bridgeFirst.y)}`,
    'Z',
  ].join(' ');

  // ── Build SVG sections ────────────────────────────────────────────────────

  // Background
  const background = `  <rect x="${f(minX)}" y="${f(minY)}" width="${f(widthMm)}" height="${f(heightMm)}" fill="${COLOR_BACKGROUND}"/>`;

  // Fretboard fill
  const boardFill = `  <path d="${boardPath}" fill="${COLOR_BOARD_FILL}"/>`;

  // Fret lines
  const fretSvgLines = fretLines.map((fl) => {
    const isNut = fl.fret === 0;
    const stroke = isNut ? COLOR_NUT : COLOR_FRET;
    const strokeWidth = isNut ? STROKE_NUT_MM : STROKE_FRET_MM;
    const seg = extendFrets
      ? extendSegmentToOutline(fl.x1, fl.y1, fl.x2, fl.y2, outline)
      : { x1: fl.x1, y1: fl.y1, x2: fl.x2, y2: fl.y2 };
    return `  <line x1="${f(seg.x1)}" y1="${f(seg.y1)}" x2="${f(seg.x2)}" y2="${f(seg.y2)}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
  }).join('\n');

  // String lines
  const stringSvgLines = stringLines.map((sl) =>
    `  <line x1="${f(sl.nutX)}" y1="${f(sl.nutY)}" x2="${f(sl.bridgeX)}" y2="${f(sl.bridgeY)}" stroke="${COLOR_STRING}" stroke-width="${STROKE_STRING_MM}" stroke-opacity="0.75"/>`,
  ).join('\n');

  // Outline stroke
  const boardStroke = `  <path d="${boardPath}" fill="none" stroke="${COLOR_BOARD_EDGE}" stroke-width="${STROKE_BOARD_EDGE_MM}" stroke-linejoin="round"/>`;

  // ── Annotations ────────────────────────────────────────────────────
  const annotations: string[] = [];

  if (showAnnotations) {
    // Scale length
    const scaleLengths = stringLines.map((s) => s.scaleLengthMm);
    const scaleText = scaleLengths.length === 1
      ? `${formatMm(scaleLengths[0], unit)} ${unit}`
      : `${formatMm(Math.min(...scaleLengths), unit)} - ${formatMm(Math.max(...scaleLengths), unit)} ${unit}`;

    const midX = (minX + maxX) / 2;
    const labelText = `Scale: ${scaleText}`;
    const textWidth = labelText.length * FONT_SIZE_MM * 0.7;
    const boxW = textWidth + ANNOTATION_PADDING * 2;
    const boxH = FONT_SIZE_MM + ANNOTATION_PADDING * 2;
    const labelY = maxY - 15;

    annotations.push(
      `  <rect x="${f(midX - boxW/2)}" y="${f(labelY - boxH/2)}" width="${f(boxW)}" height="${f(boxH)}" fill="${COLOR_ANNOTATION_BG}" rx="1"/>`,
      `  <text x="${f(midX)}" y="${f(labelY + FONT_SIZE_MM/3)}" fill="${COLOR_ANNOTATION}" font-size="${FONT_SIZE_MM}" font-family="monospace" text-anchor="middle">${escapeXml(labelText)}</text>`,
    );

    // Nut width
    const nutWidth = lineLength(outline.nutFirst.x, outline.nutFirst.y, outline.nutLast.x, outline.nutLast.y);
    const nutX = outline.nutFirst.x - 15;
    annotations.push(
      `  <line x1="${f(nutX)}" y1="${f(outline.nutFirst.y)}" x2="${f(nutX)}" y2="${f(outline.nutLast.y)}" stroke="${COLOR_ANNOTATION}" stroke-width="0.3"/>`,
      `  <text x="${f(nutX)}" y="${f((outline.nutFirst.y + outline.nutLast.y)/2)}" fill="${COLOR_ANNOTATION}" font-size="${FONT_SIZE_MM}" font-family="monospace" text-anchor="end" transform="rotate(90 ${f(nutX)} ${f((outline.nutFirst.y + outline.nutLast.y)/2)})">${formatMm(nutWidth, unit)} ${unit}</text>`,
    );

    // Bridge width
    const bridgeWidth = lineLength(outline.bridgeFirst.x, outline.bridgeFirst.y, outline.bridgeLast.x, outline.bridgeLast.y);
    const bridgeX = outline.bridgeFirst.x + 15;
    annotations.push(
      `  <line x1="${f(bridgeX)}" y1="${f(outline.bridgeFirst.y)}" x2="${f(bridgeX)}" y2="${f(outline.bridgeLast.y)}" stroke="${COLOR_ANNOTATION}" stroke-width="0.3"/>`,
      `  <text x="${f(bridgeX)}" y="${f((outline.bridgeFirst.y + outline.bridgeLast.y)/2)}" fill="${COLOR_ANNOTATION}" font-size="${FONT_SIZE_MM}" font-family="monospace" text-anchor="start" transform="rotate(90 ${f(bridgeX)} ${f((outline.bridgeFirst.y + outline.bridgeLast.y)/2)})">${formatMm(bridgeWidth, unit)} ${unit}</text>`,
    );

    // Fret markers (12, 24)
    fretLines
      .filter((fl) => fl.fret === 12 || fl.fret === 24)
      .forEach((fl) => {
        const fretMidX = (fl.x1 + fl.x2) / 2;
        annotations.push(
          `  <rect x="${f(fretMidX - 4)}" y="${f(outline.nutFirst.y - 12)}" width="8" height="5" fill="${COLOR_ANNOTATION_BG}" rx="1"/>`,
          `  <text x="${f(fretMidX)}" y="${f(outline.nutFirst.y - 9)}" fill="${COLOR_ANNOTATION}" font-size="${FONT_SIZE_MM}" font-family="monospace" text-anchor="middle">${fl.fret}</text>`,
        );
      });
  }

  // ── Assemble metadata comment ───────────────────────────────────────

  const method = result.meta.method === 'equal'
    ? `Equal Temperament (${result.meta.tonesPerOctave ?? 12} tones/octave)`
    : `Scala — ${result.meta.scalaDescription ?? 'custom'}`;

  const numStrings = stringLines.length;
  const fretsPerString = Math.floor(result.fretPositions.length / Math.max(1, numStrings));
  const numFrets = Math.max(0, fretsPerString - 1);

  const comment = [
    `Generated by FretLabs`,
    `Method: ${method}`,
    `Frets: ${numFrets} | Strings: ${numStrings}`,
    `Coordinates in mm | Physical size in ${unit}`,
  ].map((l) => `  ${l}`).join('\n');

  // ── Final SVG ─────────────────────────────────────────────────────────

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!--`,
    comment,
    `-->`,
    `<svg`,
    `  xmlns="http://www.w3.org/2000/svg"`,
    `  width="${widthDisplay}${unit}"`,
    `  height="${heightDisplay}${unit}"`,
    `  viewBox="${viewBox}"`,
`>`,
    background,
    boardFill,
    fretSvgLines,
    stringSvgLines,
    boardStroke,
    ...annotations,
    `</svg>`,
].join('\n');
}
