/**
 * FretboardSVG renders a calculated fretboard as an SVG.
 *
 * Receives a FretboardResult (already computed by the calculator module)
 * and uses geometry.ts to build the viewBox. Does NOT perform any
 * mathematical calculations — only visual rendering.
 *
 * Coordinate system: 1 SVG unit = 1mm. The browser scales the SVG to
 * fit its container while maintaining the aspect ratio.
 *
 * Visual layers (bottom to top):
 *   1. Fretboard fill (wood)
 *   2. Fret lines (metal, nut is thicker + distinct color)
 *   3. String lines (optional)
 *   4. Fretboard outline stroke (dark edge)
 *   5. Annotations (dimension lines with labels outside)
 */

import type { FretboardResult } from '../calculator/types';
import type { FretboardDisplayOptions } from './types';
import { computeSvgViewport } from './geometry';
import { extendSegmentToOutline } from '../../utils/extend-line-to-outline';
import type { Unit } from '../../config/constants';
import { lineLength } from '../../utils/geometry';

// ── Visual constants ────────────────────────────────────────────────────────

/**
 * SVG color tokens — driven by CSS custom properties so they adapt
 * to the active theme (dark / light) without a React re-render.
 * Defined in src/index.css via --svg-* variables.
 */
const COLOR_BOARD_FILL = 'var(--svg-board-fill, #3A1C08)';
const COLOR_BOARD_EDGE = 'var(--svg-board-edge, #1A0A02)';
const COLOR_FRET = 'var(--svg-fret, #C0B882)';
const COLOR_NUT = 'var(--svg-nut, #E8D8A0)';
const COLOR_STRING = 'var(--svg-string, #C8C8C8)';
const COLOR_DIMENSION = 'var(--svg-dimension, #FFD700)';

/** Fret stroke width in mm (a real fret slot is ~0.5mm wide) */
const STROKE_FRET_MM = 0.6;
/** Nut stroke width in mm (visually thicker) */
const STROKE_NUT_MM = 2.5;
/** String stroke width in mm */
const STROKE_STRING_MM = 0.35;
/** Board outline stroke width in mm */
const STROKE_BOARD_EDGE_MM = 0.8;
/** Annotation font size in mm (larger for visibility) */
const FONT_SIZE_MM = 7;
/** Dimension line offset from fretboard */
const DIM_OFFSET = 20;
/** Annotation box size */
const ANNOT_BOX_W = 22;
const ANNOT_BOX_H = 10;

/**
 * Format a mm value for display with unit */
function formatMm(valueMm: number, unit: Unit): string {
  const converted = valueMm / (unit === 'cm' ? 10 : unit === 'in' ? 25.4 : 1);
  if (unit === 'in') {
    return converted.toFixed(3);
  }
  return converted.toFixed(1);
}

// ── Component ───────────────────────────────────────────────────────────────

interface FretboardSVGProps {
  result: FretboardResult;
  options: FretboardDisplayOptions;
  className?: string;
  unit?: Unit;
}

/**
 * Render dimension line with arrows outside the fretboard */
function DimensionLine({
  start,
  end,
  label,
  orientation,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  label: string;
  orientation: 'horizontal' | 'vertical';
}) {
  const isVertical = orientation === 'vertical';
  const perp = isVertical ? DIM_OFFSET : -DIM_OFFSET;
  
  const startX = start.x + (isVertical ? perp : 0);
  const startY = start.y + (isVertical ? 0 : -perp);
  const endX = end.x + (isVertical ? perp : 0);
  const endY = end.y + (isVertical ? 0 : -perp);
  
  const textX = (startX + endX) / 2;
  const textY = (startY + endY) / 2;
  
  const arrowSize = 3;
  const arrowDir = isVertical ? 1 : -1;
  
  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={COLOR_DIMENSION}
        strokeWidth={0.6}
      />
      {/* Start arrow */}
      <line
        x1={startX}
        y1={startY}
        x2={startX + (isVertical ? arrowSize * arrowDir : arrowSize)}
        y2={startY + (isVertical ? arrowSize : arrowSize * arrowDir)}
        stroke={COLOR_DIMENSION}
        strokeWidth={0.6}
      />
      {/* End arrow */}
      <line
        x1={endX}
        y1={endY}
        x2={endX - (isVertical ? arrowSize * arrowDir : arrowSize)}
        y2={endY - (isVertical ? arrowSize : arrowSize * arrowDir)}
        stroke={COLOR_DIMENSION}
        strokeWidth={0.6}
      />
      <rect
        x={isVertical ? textX + 3 : textX - ANNOT_BOX_W / 2}
        y={textY - ANNOT_BOX_H / 2}
        width={isVertical ? ANNOT_BOX_W : ANNOT_BOX_W}
        height={ANNOT_BOX_H}
        fill={COLOR_DIMENSION}
        rx={2}
      />
      <text
        x={isVertical ? textX + 3 + ANNOT_BOX_W / 2 : textX}
        y={textY + FONT_SIZE_MM / 3}
        fill="#000"
        fontSize={FONT_SIZE_MM}
        fontFamily="monospace"
        textAnchor={isVertical ? 'start' : 'middle'}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Render a FretboardResult as an inline SVG element.
 *
 * @param result - Complete fretboard calculation result
 * @param options - Display toggles (showStrings, showEdges)
 * @param className - Optional CSS class for the <svg> element
 * @param unit - Display unit for annotations
 */
export function FretboardSVG({
  result,
  options,
  className,
  unit = 'mm',
}: FretboardSVGProps) {
  const { showStrings, showEdges, extendFrets, showAnnotations } = options;
  const vp = computeSvgViewport(result);

  const { fretLines, strings: stringLines, outline } = result;

  const scaleLengths = stringLines.map((s) => s.scaleLengthMm);

  const boardPath = [
    `M ${outline.nutFirst.x} ${outline.nutFirst.y}`,
    `L ${outline.nutLast.x} ${outline.nutLast.y}`,
    `L ${outline.bridgeLast.x} ${outline.bridgeLast.y}`,
    `L ${outline.bridgeFirst.x} ${outline.bridgeFirst.y}`,
    'Z',
  ].join(' ');

  const nutWidth = lineLength(outline.nutFirst.x, outline.nutFirst.y, outline.nutLast.x, outline.nutLast.y);
  const bridgeWidth = lineLength(outline.bridgeFirst.x, outline.bridgeFirst.y, outline.bridgeLast.x, outline.bridgeLast.y);

  return (
    <svg
      viewBox={vp.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-label="Fretboard preview"
    >
      {/* Layer 1: Fretboard fill */}
      {showEdges && <path d={boardPath} fill={COLOR_BOARD_FILL} />}

      {/* Layer 2: Fret lines */}
      {fretLines.map((fl, idx) => {
        const isNut = fl.fret === 0;
        const seg = extendFrets
          ? extendSegmentToOutline(fl.x1, fl.y1, fl.x2, fl.y2, outline)
          : { x1: fl.x1, y1: fl.y1, x2: fl.x2, y2: fl.y2 };
        return (
          <line
            key={`${fl.fret}-${idx}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={isNut ? COLOR_NUT : COLOR_FRET}
            strokeWidth={isNut ? STROKE_NUT_MM : STROKE_FRET_MM}
            strokeLinecap="round"
          />
        );
      })}

      {/* Layer 3: String lines (optional) */}
      {showStrings &&
        stringLines.map((sl) => (
          <line
            key={sl.index}
            x1={sl.nutX}
            y1={sl.nutY}
            x2={sl.bridgeX}
            y2={sl.bridgeY}
            stroke={COLOR_STRING}
            strokeWidth={STROKE_STRING_MM}
            strokeOpacity={0.75}
          />
        ))}

      {/* Layer 4: Fretboard outline stroke */}
      {showEdges && (
        <path
          d={boardPath}
          fill="none"
          stroke={COLOR_BOARD_EDGE}
          strokeWidth={STROKE_BOARD_EDGE_MM}
          strokeLinejoin="round"
        />
      )}

      {/* Layer 5: Annotations - dimension lines outside the fretboard */}
      {showAnnotations && (
        <g>
          {/* Scale length - horizontal line BELOW fretboard (between nut and bridge, below) */}
          <DimensionLine
            start={{ x: outline.nutFirst.x, y: outline.nutFirst.y + DIM_OFFSET + 15 }}
            end={{ x: outline.nutLast.x, y: outline.nutLast.y + DIM_OFFSET + 15 }}
            label={formatMm(scaleLengths[0] || 0, unit)}
            orientation="horizontal"
          />
          
          {/* Nut width - vertical line on the LEFT side */}
          <DimensionLine
            start={{ x: outline.nutFirst.x - DIM_OFFSET, y: outline.nutFirst.y }}
            end={{ x: outline.nutFirst.x - DIM_OFFSET, y: outline.nutLast.y }}
            label={formatMm(nutWidth, unit)}
            orientation="vertical"
          />
          
          {/* Bridge width - vertical line on the RIGHT side */}
          <DimensionLine
            start={{ x: outline.bridgeFirst.x + DIM_OFFSET, y: outline.bridgeFirst.y }}
            end={{ x: outline.bridgeFirst.x + DIM_OFFSET, y: outline.bridgeLast.y }}
            label={formatMm(bridgeWidth, unit)}
            orientation="vertical"
          />
          
          {/* Key fret markers (12, 24) - above the fretboard at center Y */}
          {/* (Removed for cleaner view) */}
        </g>
      )}
    </svg>
  );
}
