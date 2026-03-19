/**
 * Equal temperament fret position calculator.
 *
 * Uses the standard formula: d = s - (s / 2^(n/N))
 * where s = scale length, n = fret number, N = tones per octave
 *
 * This produces positions identical to FretFind2D's equal temperament mode.
 */

/**
 * Calculate the distance from the nut to fret `n` on a string of length `scaleLengthMm`,
 * using equal temperament with `tonesPerOctave` divisions.
 *
 * @param scaleLengthMm - Total scale length in mm
 * @param fretNumber - Fret number (1-based, 0 = nut)
 * @param tonesPerOctave - Number of equal divisions per octave (12 for standard)
 * @returns Distance from nut to fret in mm
 */
export function fretDistanceFromNut(
  scaleLengthMm: number,
  fretNumber: number,
  tonesPerOctave: number,
): number {
  if (fretNumber === 0) return 0;

  // d = s - (s / 2^(n/N))
  // Equivalent to: d = s * (1 - 1 / 2^(n/N))
  return scaleLengthMm * (1 - 1 / Math.pow(2, fretNumber / tonesPerOctave));
}

/**
 * Calculate all fret distances from the nut for a given scale length.
 *
 * @param scaleLengthMm - Total scale length in mm
 * @param numFrets - Number of frets to calculate
 * @param tonesPerOctave - Number of equal divisions per octave
 * @returns Array of distances from nut in mm, indexed by fret number (0 = nut = 0mm)
 */
export function allFretDistances(
  scaleLengthMm: number,
  numFrets: number,
  tonesPerOctave: number,
): number[] {
  const distances: number[] = [];

  for (let fret = 0; fret <= numFrets; fret++) {
    distances.push(fretDistanceFromNut(scaleLengthMm, fret, tonesPerOctave));
  }

  return distances;
}

/**
 * Calculate the ratio of fret position along the string (0 = nut, 1 = bridge).
 * Used for perpendicular distance calculations in multiscale.
 *
 * @param fretNumber - Fret number
 * @param tonesPerOctave - Tones per octave
 * @returns Ratio 0-1
 */
export function fretRatio(fretNumber: number, tonesPerOctave: number): number {
  if (fretNumber === 0) return 0;
  return 1 - 1 / Math.pow(2, fretNumber / tonesPerOctave);
}
