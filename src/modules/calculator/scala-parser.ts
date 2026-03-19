/**
 * Parser for the Scala SCL file format.
 * Reference: http://www.huygens-fokker.org/scala/scl_format.html
 *
 * An SCL file defines a musical scale as a series of pitch values
 * relative to the starting note. Values can be ratios (3/2) or cents (701.955).
 */

export interface ScalaScale {
  /** Description line from the file */
  description: string;
  /** Number of notes in the scale */
  noteCount: number;
  /** Pitch values as ratios (e.g., 1.5 for a perfect fifth 3/2) */
  ratios: number[];
}

export class ScalaParseError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ScalaParseError';
  }
}

/**
 * Convert a cents value to a ratio.
 * Formula: ratio = 2^(cents/1200)
 */
function centsToRatio(cents: number): number {
  return Math.pow(2, cents / 1200);
}

/**
 * Parse a single pitch line from a Scala file.
 * Returns the value as a ratio (decimal number).
 *
 * Rules from the Scala format spec:
 * - If the line contains a '/' it's a ratio (e.g., "3/2" → 1.5)
 * - If the line contains a '.' it's a cents value (e.g., "701.955" → ratio)
 * - If it's a plain integer, it's treated as a ratio (e.g., "2" → 2.0)
 */
function parsePitchLine(raw: string, lineNumber: number): number {
  const trimmed = raw.trim().split(/\s/)[0]; // Take first token only

  if (!trimmed) {
    throw new ScalaParseError('Empty pitch value', lineNumber, 'Expected a ratio or cents value');
  }

  if (trimmed.includes('/')) {
    // Ratio format: "3/2"
    const parts = trimmed.split('/');
    if (parts.length !== 2) {
      throw new ScalaParseError(`Invalid ratio: "${trimmed}"`, lineNumber, 'Ratios must be in the form N/D');
    }
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      throw new ScalaParseError(`Invalid ratio: "${trimmed}"`, lineNumber, 'Numerator and denominator must be valid non-zero numbers');
    }
    return numerator / denominator;
  }

  if (trimmed.includes('.')) {
    // Cents format: "701.955"
    const cents = parseFloat(trimmed);
    if (isNaN(cents)) {
      throw new ScalaParseError(`Invalid cents value: "${trimmed}"`, lineNumber, 'Expected a decimal number');
    }
    return centsToRatio(cents);
  }

  // Plain integer → treated as ratio
  const value = parseInt(trimmed, 10);
  if (isNaN(value)) {
    throw new ScalaParseError(`Invalid pitch value: "${trimmed}"`, lineNumber, 'Expected a number, ratio, or cents value');
  }
  return value;
}

/**
 * Parse a Scala SCL file content string into a ScalaScale object.
 *
 * @param content - Raw content of a .scl file
 * @returns Parsed scale with ratios
 * @throws ScalaParseError if the content is invalid
 */
export function parseScala(content: string): ScalaScale {
  const lines = content.split(/\r?\n/);

  // Filter out comment lines (starting with !) and empty lines
  const dataLines: { text: string; originalLine: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('!') || line === '') continue;
    dataLines.push({ text: line, originalLine: i + 1 });
  }

  if (dataLines.length < 2) {
    throw new ScalaParseError(
      'Invalid Scala file: too few lines',
      undefined,
      'A Scala file needs at least a description and a note count',
    );
  }

  // First non-comment line is description
  const description = dataLines[0].text;

  // Second non-comment line is note count
  const noteCount = parseInt(dataLines[1].text, 10);
  if (isNaN(noteCount) || noteCount < 1) {
    throw new ScalaParseError(
      `Invalid note count: "${dataLines[1].text}"`,
      dataLines[1].originalLine,
      'The second non-comment line must be a positive integer',
    );
  }

  // Remaining lines are pitch values
  const pitchLines = dataLines.slice(2);

  if (pitchLines.length < noteCount) {
    throw new ScalaParseError(
      `Expected ${noteCount} pitch values but found ${pitchLines.length}`,
      undefined,
      'The number of pitch lines must match the declared note count',
    );
  }

  const ratios: number[] = [];
  for (let i = 0; i < noteCount; i++) {
    const ratio = parsePitchLine(pitchLines[i].text, pitchLines[i].originalLine);
    ratios.push(ratio);
  }

  return { description, noteCount, ratios };
}

/**
 * Get fret distance from nut using a Scala scale.
 * For a given fret number, finds the corresponding ratio in the scale
 * (wrapping around octaves as needed) and calculates the position.
 *
 * @param scaleLengthMm - Total scale length in mm
 * @param fretNumber - Fret number (1-based)
 * @param scale - Parsed Scala scale
 * @returns Distance from nut in mm
 */
export function scalaFretDistance(
  scaleLengthMm: number,
  fretNumber: number,
  scale: ScalaScale,
): number {
  if (fretNumber === 0) return 0;

  // Determine which octave and which step within the octave
  const stepsPerOctave = scale.noteCount;
  const octave = Math.floor((fretNumber - 1) / stepsPerOctave);
  const step = ((fretNumber - 1) % stepsPerOctave);

  // The ratio for this fret relative to the open string
  // Each complete octave multiplies by the last ratio (which should be ~2 for a standard octave)
  const octaveRatio = Math.pow(scale.ratios[stepsPerOctave - 1], octave);
  const stepRatio = scale.ratios[step];
  const totalRatio = octaveRatio * stepRatio;

  // Distance from nut: d = s * (1 - 1/ratio)
  return scaleLengthMm * (1 - 1 / totalRatio);
}

/**
 * Calculate all fret distances for a Scala scale.
 */
export function allScalaFretDistances(
  scaleLengthMm: number,
  numFrets: number,
  scale: ScalaScale,
): number[] {
  const distances: number[] = [0]; // fret 0 = nut

  for (let fret = 1; fret <= numFrets; fret++) {
    distances.push(scalaFretDistance(scaleLengthMm, fret, scale));
  }

  return distances;
}
