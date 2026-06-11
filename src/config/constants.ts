/** Supported unit systems */
export type Unit = 'mm' | 'in' | 'cm';

/** Minimum and maximum values for inputs */
export const LIMITS = {
  MIN_FRETS: 1,
  MAX_FRETS: 72,
  MIN_STRINGS: 1,
  MAX_STRINGS: 24,
  MIN_SCALE_LENGTH_MM: 100,
  MAX_SCALE_LENGTH_MM: 2000,
  MIN_WIDTH_MM: 10,
  MAX_WIDTH_MM: 200,
  MIN_OVERHANG_MM: 0,
  MAX_OVERHANG_MM: 50,
  MIN_EXTENSION_MM: 0,
  MAX_EXTENSION_MM: 100,
  MIN_PERPENDICULAR_DISTANCE: 0,
  MAX_PERPENDICULAR_DISTANCE: 1,
} as const;

/** Default values for a new fretboard design */
export const DEFAULTS = {
  SCALE_LENGTH_MM: 647.7, // 25.5" Fender Strat
  NUM_FRETS: 22,
  NUM_STRINGS: 6,
  NUT_WIDTH_MM: 42.86, // ~1.6875"
  BRIDGE_WIDTH_MM: 52.39, // ~2.0625"
  OVERHANG_MM: 3,
  NUT_EXTENSION_MM: 0,
  LAST_FRET_EXTENSION_MM: 10,
  PERPENDICULAR_DISTANCE: 0.5,
  UNIT: 'mm' as Unit,
  LOCALE: 'en' as const,
} as const;

/** Conversion factors to mm (base unit for all internal calculations) */
export const UNIT_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
};

/** Display names for units */
export const UNIT_LABELS: Record<Unit, string> = {
  mm: 'mm',
  cm: 'cm',
  in: 'in',
};

/** Rounding precision for display (inches only) */
export type DisplayPrecision = 'exact' | '128th' | '64th' | '32nd' | '16th' | '8th' | '4th' | '2th' | 'whole';

/** Denominator for each rounding option (fraction of an inch) */
export const ROUNDING_DENOMINATOR: Record<DisplayPrecision, number> = {
  exact: 0, // No rounding, show full precision
  '128th': 128,
  '64th': 64,
  '32nd': 32,
  '16th': 16,
  '8th': 8,
  '4th': 4,
  '2th': 2,
  whole: 1,
};

/** Rounding options displayed to user */
export const DISPLAY_PRECISIONS: DisplayPrecision[] = [
  'exact',
  '128th',
  '64th',
  '32nd',
  '16th',
  '8th',
  '4th',
  '2th',
  'whole',
];

/** Default display precision */
export const DEFAULT_DISPLAY_PRECISION: DisplayPrecision = 'exact';

/** Number of decimal places to show per unit */
export const UNIT_PRECISION: Record<Unit, number> = {
  mm: 3,
  cm: 4,
  in: 5,
};
