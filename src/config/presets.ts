
export interface InstrumentPreset {
  /** Unique identifier */
  id: string;
  /** Display name (not translated — instrument names are universal) */
  name: string;
  /** Category for grouping */
  category: 'guitar' | 'bass' | 'other';
  /** Scale length in mm */
  scaleLengthMm: number;
  /** Second scale length for multiscale (null = single scale) */
  scaleLengthMm2: number | null;
  /** Number of frets */
  numFrets: number;
  /** Number of strings */
  numStrings: number;
  /** Nut width in mm */
  nutWidthMm: number;
  /** Bridge width in mm */
  bridgeWidthMm: number;
  /** Perpendicular distance (only for multiscale) */
  perpendicularDistance: number;
  /** String gauges in inches for proportional spacing (optional) */
  stringGauges?: number[];
}

export const PRESETS: InstrumentPreset[] = [
  {
    id: 'strat',
    name: 'Fender Stratocaster',
    category: 'guitar',
    scaleLengthMm: 647.7, // 25.5"
    scaleLengthMm2: null,
    numFrets: 22,
    numStrings: 6,
    nutWidthMm: 42.86,
    bridgeWidthMm: 52.39,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046],
  },
  {
    id: 'les-paul',
    name: 'Gibson Les Paul',
    category: 'guitar',
    scaleLengthMm: 628.65, // 24.75"
    scaleLengthMm2: null,
    numFrets: 22,
    numStrings: 6,
    nutWidthMm: 43.05,
    bridgeWidthMm: 51.56,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046],
  },
  {
    id: 'prs',
    name: 'PRS Custom 24',
    category: 'guitar',
    scaleLengthMm: 635.0, // 25"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 6,
    nutWidthMm: 42.47,
    bridgeWidthMm: 52.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046],
  },
  {
    id: 'tele',
    name: 'Fender Telecaster',
    category: 'guitar',
    scaleLengthMm: 647.7, // 25.5"
    scaleLengthMm2: null,
    numFrets: 21,
    numStrings: 6,
    nutWidthMm: 42.86,
    bridgeWidthMm: 54.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046],
  },
  {
    id: 'classical',
    name: 'Classical Guitar',
    category: 'guitar',
    scaleLengthMm: 650.0, // Standard classical
    scaleLengthMm2: null,
    numFrets: 19,
    numStrings: 6,
    nutWidthMm: 52.0,
    bridgeWidthMm: 58.0,
    perpendicularDistance: 0.5,
  },
  {
    id: 'baritone',
    name: 'Baritone Guitar',
    category: 'guitar',
    scaleLengthMm: 685.8, // 27"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 6,
    nutWidthMm: 43.0,
    bridgeWidthMm: 53.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.013, 0.017, 0.026, 0.036, 0.046, 0.056],
  },
  {
    id: '7-string',
    name: '7-String Guitar',
    category: 'guitar',
    scaleLengthMm: 660.4, // 26"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 7,
    nutWidthMm: 47.63,
    bridgeWidthMm: 57.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046, 0.059],
  },
  {
    id: '8-string',
    name: '8-String Guitar',
    category: 'guitar',
    scaleLengthMm: 673.1, // 26.5"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 8,
    nutWidthMm: 52.0,
    bridgeWidthMm: 62.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.009, 0.012, 0.016, 0.024, 0.032, 0.042, 0.054, 0.065],
  },
  {
    id: 'multiscale-guitar',
    name: 'Multiscale Guitar (25.5"–27")',
    category: 'guitar',
    scaleLengthMm: 647.7, // 25.5" (treble)
    scaleLengthMm2: 685.8, // 27" (bass)
    numFrets: 24,
    numStrings: 6,
    nutWidthMm: 43.0,
    bridgeWidthMm: 53.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.010, 0.013, 0.017, 0.026, 0.036, 0.046],
  },
  {
    id: 'bass-long',
    name: 'Bass (Long Scale 34")',
    category: 'bass',
    scaleLengthMm: 863.6, // 34"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 4,
    nutWidthMm: 42.0,
    bridgeWidthMm: 62.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.045, 0.065, 0.085, 0.105],
  },
  {
    id: 'bass-short',
    name: 'Bass (Short Scale 30")',
    category: 'bass',
    scaleLengthMm: 762.0, // 30"
    scaleLengthMm2: null,
    numFrets: 22,
    numStrings: 4,
    nutWidthMm: 42.0,
    bridgeWidthMm: 60.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.045, 0.065, 0.085, 0.105],
  },
  {
    id: 'bass-5',
    name: '5-String Bass (35")',
    category: 'bass',
    scaleLengthMm: 889.0, // 35"
    scaleLengthMm2: null,
    numFrets: 24,
    numStrings: 5,
    nutWidthMm: 47.63,
    bridgeWidthMm: 72.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.045, 0.065, 0.085, 0.105, 0.130],
  },
  {
    id: 'multiscale-bass',
    name: 'Multiscale Bass (34"–37")',
    category: 'bass',
    scaleLengthMm: 863.6, // 34" (treble)
    scaleLengthMm2: 939.8, // 37" (bass)
    numFrets: 24,
    numStrings: 5,
    nutWidthMm: 47.63,
    bridgeWidthMm: 72.0,
    perpendicularDistance: 0.5,
    stringGauges: [0.045, 0.065, 0.085, 0.105, 0.130],
  },
  {
    id: 'ukulele',
    name: 'Ukulele (Soprano)',
    category: 'other',
    scaleLengthMm: 345.44, // 13.6"
    scaleLengthMm2: null,
    numFrets: 12,
    numStrings: 4,
    nutWidthMm: 35.0,
    bridgeWidthMm: 38.0,
    perpendicularDistance: 0.5,
  },
  {
    id: 'mandolin',
    name: 'Mandolin',
    category: 'other',
    scaleLengthMm: 352.43, // 13.875"
    scaleLengthMm2: null,
    numFrets: 22,
    numStrings: 8,
    nutWidthMm: 28.58,
    bridgeWidthMm: 38.0,
    perpendicularDistance: 0.5,
  },
  {
    id: 'banjo',
    name: 'Banjo (5-String)',
    category: 'other',
    scaleLengthMm: 665.48, // 26.2"
    scaleLengthMm2: null,
    numFrets: 22,
    numStrings: 5,
    nutWidthMm: 31.75,
    bridgeWidthMm: 44.0,
    perpendicularDistance: 0.5,
  },
];
