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
 */

import type { FretboardResult } from '../calculator/types';
import type { FretboardDisplayOptions } from './types';
import { computeSvgViewport } from './geometry';

// ── Visual constants ────────────────────────────────────────────────────────

/** Fretboard wood fill (dark rosewood / ebony) */
const COLOR_BOARD_FILL = '#3A1C08';
/** Fretboard outline / edge stroke */
const COLOR_BOARD_EDGE = '#1A0A02';
/** Standard fret (nickel-silver) */
const COLOR_FRET = '#C0B882';
/** Nut (bone) */
const COLOR_NUT = '#E8D8A0';
/** String (steel) */
const COLOR_STRING = '#C8C8C8';

/** Fret stroke width in mm (a real fret slot is ~0.5mm wide) */
const STROKE_FRET_MM = 0.6;
/** Nut stroke width in mm (visually thicker) */
const STROKE_NUT_MM = 2.5;
/** String stroke width in mm */
const STROKE_STRING_MM = 0.35;
/** Board outline stroke width in mm */
const STROKE_BOARD_EDGE_MM = 0.8;

// ── Component ───────────────────────────────────────────────────────────────

interface FretboardSVGProps {
  result: FretboardResult;
  options: FretboardDisplayOptions;
  className?: string;
}

/**
 * Render a FretboardResult as an inline SVG element.
 *
 * @param result - Complete fretboard calculation result
 * @param options - Display toggles (showStrings, showEdges)
 * @param className - Optional CSS class for the <svg> element
 */
export function FretboardSVG({ result, options, className }: FretboardSVGProps) {
  const { showStrings, showEdges } = options;
  const vp = computeSvgViewport(result);

  const { fretLines, strings: stringLines, outline } = result;

  // Fretboard outline as a closed quadrilateral path:
  // nut-treble → nut-bass → bridge-bass → bridge-treble → close
  const boardPath = [
    `M ${outline.nutFirst.x} ${outline.nutFirst.y}`,
    `L ${outline.nutLast.x} ${outline.nutLast.y}`,
    `L ${outline.bridgeLast.x} ${outline.bridgeLast.y}`,
    `L ${outline.bridgeFirst.x} ${outline.bridgeFirst.y}`,
    'Z',
  ].join(' ');

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

      {/* Layer 2: Fret lines
          Fret 0 is the nut — rendered thicker and in a distinct color.
          All other frets are standard nickel-silver lines. */}
      {fretLines.map((fl) => {
        const isNut = fl.fret === 0;
        return (
          <line
            key={fl.fret}
            x1={fl.x1}
            y1={fl.y1}
            x2={fl.x2}
            y2={fl.y2}
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

      {/* Layer 4: Fretboard outline stroke (drawn last to sit on top of fill) */}
      {showEdges && (
        <path
          d={boardPath}
          fill="none"
          stroke={COLOR_BOARD_EDGE}
          strokeWidth={STROKE_BOARD_EDGE_MM}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
