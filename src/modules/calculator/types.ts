import type { Unit } from '../../config/constants';

/** A single fret position on a single string */
export interface FretPosition {
  /** Fret number (0 = nut) */
  fret: number;
  /** String index (0 = first/treble string) */
  string: number;
  /** Distance from nut in mm */
  distanceFromNutMm: number;
  /** Distance from previous fret in mm (0 for fret 0) */
  distanceFromPreviousMm: number;
  /** X coordinate on the 2D fretboard plane */
  x: number;
  /** Y coordinate on the 2D fretboard plane */
  y: number;
  /** Whether this is a partial fret (microtonal — fret doesn't span full width) */
  isPartial: boolean;
}

/** A line segment representing a fret across the fretboard */
export interface FretLine {
  fret: number;
  /** Start point (first string side) */
  x1: number;
  y1: number;
  /** End point (last string side) */
  x2: number;
  y2: number;
  /** Whether this fret is partial (doesn't span all strings) */
  isPartial: boolean;
}

/** A string line from nut to bridge */
export interface StringLine {
  /** String index (0 = first/treble) */
  index: number;
  /** Nut end */
  nutX: number;
  nutY: number;
  /** Bridge end */
  bridgeX: number;
  bridgeY: number;
  /** Scale length of this string in mm */
  scaleLengthMm: number;
}

/** The fretboard outline (quadrilateral) */
export interface FretboardOutline {
  /** Nut edge, first string side */
  nutFirst: { x: number; y: number };
  /** Nut edge, last string side */
  nutLast: { x: number; y: number };
  /** Bridge edge, first string side */
  bridgeFirst: { x: number; y: number };
  /** Bridge edge, last string side */
  bridgeLast: { x: number; y: number };
}

/** Metadata about the calculation */
export interface CalculationMeta {
  /** Method used */
  method: 'equal' | 'scala';
  /** Tones per octave (for equal temperament) */
  tonesPerOctave?: number;
  /** Scala file name/description (if applicable) */
  scalaDescription?: string;
  /** Unit used in the original input */
  inputUnit: Unit;
}

/** Complete result of a fretboard calculation */
export interface FretboardResult {
  /** All fret positions per string */
  fretPositions: FretPosition[];
  /** Fret lines (connecting positions across strings) */
  fretLines: FretLine[];
  /** String lines from nut to bridge */
  strings: StringLine[];
  /** Fretboard outline */
  outline: FretboardOutline;
  /** Calculation metadata */
  meta: CalculationMeta;
}

// ── Input configuration types ──

export type ScaleLengthMode = 'single' | 'multi' | 'individual';

export interface ScaleLengthConfig {
  mode: ScaleLengthMode;
  /** Fundamental / first string scale length in mm */
  fundamentalMm: number;
  /** Last string scale length in mm (only for 'multi' mode) */
  lastMm?: number;
  /** Individual scale lengths per string in mm (only for 'individual' mode) */
  individualMm?: number[];
  /** Perpendicular fret distance 0-1 (only for multi/individual) */
  perpendicularDistance: number;
}

export type SpacingMode = 'equal' | 'proportional';

export interface StringConfig {
  count: number;
  nutWidthMm: number;
  bridgeWidthMm: number;
  spacing: SpacingMode;
  /** String gauges in inches (required for proportional spacing) */
  gauges?: number[];
}

export type CalculationMethod = 'equal' | 'scala';

export interface CalculationConfig {
  method: CalculationMethod;
  /** Tones per octave (for equal temperament, default 12) */
  tonesPerOctave: number;
  /** Raw Scala SCL file content (for scala method) */
  scalaContent?: string;
  /** Tuning: scale step per string (for scala method) */
  tuning?: number[];
}

/** Complete input configuration for a fretboard calculation */
export interface FretboardConfig {
  scaleLength: ScaleLengthConfig;
  strings: StringConfig;
  calculation: CalculationConfig;
  numFrets: number;
  unit: Unit;
}
