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

/** Number of decimal places to show per unit */
export const UNIT_PRECISION: Record<Unit, number> = {
  mm: 3,
  cm: 4,
  in: 5,
};
