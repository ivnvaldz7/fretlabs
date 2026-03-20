/**
 * Main fretboard calculation engine.
 *
 * Orchestrates equal-temperament and scala calculators, string spacing,
 * and multi-scale geometry to produce a complete FretboardResult.
 *
 * Coordinate system:
 *   - Single-scale: nut at x=0, bridge at x=scaleLength. Frets are
 *     straight vertical lines.
 *   - Multi / individual scale: the perpendicular fret is at x=0.
 *     Nut of string i at x = -perpendicularDistance * scaleLengths[i].
 *     Bridge of string i at x = (1 - perpendicularDistance) * scaleLengths[i].
 *     This produces the "fan fret" geometry where the perpendicular fret
 *     is exactly perpendicular to all strings simultaneously.
 *   - Y axis: across strings, 0 = centerline. First string at negative Y,
 *     last string at positive Y (matching calculateStringPositions output).
 */

import { allFretDistances } from './equal-temperament';
import { parseScala, allScalaFretDistances } from './scala-parser';
import type { ScalaScale } from './scala-parser';
import { calculateStringPositions, gaugesInchesToMm } from './string-spacing';
import type {
  FretboardConfig,
  FretboardResult,
  FretPosition,
  FretLine,
  StringLine,
  FretboardOutline,
  CalculationMeta,
} from './types';
import { LIMITS } from '../../config/constants';

// ── Error type ─────────────────────────────────────────────────────────────

export class CalculationError extends Error {
  constructor(
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Validate the fretboard configuration before calculating.
 * Shows warnings in the console for edge cases but throws for hard blockers.
 *
 * @throws CalculationError for invalid inputs
 */
function validateConfig(config: FretboardConfig): void {
  const { numFrets, strings, scaleLength, calculation } = config;

  if (numFrets < LIMITS.MIN_FRETS || numFrets > LIMITS.MAX_FRETS) {
    throw new CalculationError(
      `numFrets must be between ${LIMITS.MIN_FRETS} and ${LIMITS.MAX_FRETS}`,
      `Received: ${numFrets}`,
    );
  }

  if (strings.count < LIMITS.MIN_STRINGS || strings.count > LIMITS.MAX_STRINGS) {
    throw new CalculationError(
      `strings.count must be between ${LIMITS.MIN_STRINGS} and ${LIMITS.MAX_STRINGS}`,
      `Received: ${strings.count}`,
    );
  }

  if (
    scaleLength.fundamentalMm < LIMITS.MIN_SCALE_LENGTH_MM ||
    scaleLength.fundamentalMm > LIMITS.MAX_SCALE_LENGTH_MM
  ) {
    throw new CalculationError(
      `Scale length must be between ${LIMITS.MIN_SCALE_LENGTH_MM}mm and ${LIMITS.MAX_SCALE_LENGTH_MM}mm`,
      `Received: ${scaleLength.fundamentalMm}mm`,
    );
  }

  if (scaleLength.mode === 'multi') {
    if (scaleLength.lastMm === undefined) {
      throw new CalculationError(
        'Multi-scale mode requires lastMm to be defined',
      );
    }
    if (
      scaleLength.lastMm < LIMITS.MIN_SCALE_LENGTH_MM ||
      scaleLength.lastMm > LIMITS.MAX_SCALE_LENGTH_MM
    ) {
      throw new CalculationError(
        `Last string scale length must be between ${LIMITS.MIN_SCALE_LENGTH_MM}mm and ${LIMITS.MAX_SCALE_LENGTH_MM}mm`,
        `Received: ${scaleLength.lastMm}mm`,
      );
    }
  }

  if (scaleLength.mode === 'individual') {
    if (
      !scaleLength.individualMm ||
      scaleLength.individualMm.length < strings.count
    ) {
      throw new CalculationError(
        'Individual mode requires individualMm with one entry per string',
        `Received ${scaleLength.individualMm?.length ?? 0} values for ${strings.count} strings`,
      );
    }
  }

  if (
    scaleLength.perpendicularDistance < LIMITS.MIN_PERPENDICULAR_DISTANCE ||
    scaleLength.perpendicularDistance > LIMITS.MAX_PERPENDICULAR_DISTANCE
  ) {
    throw new CalculationError(
      `perpendicularDistance must be between ${LIMITS.MIN_PERPENDICULAR_DISTANCE} and ${LIMITS.MAX_PERPENDICULAR_DISTANCE}`,
      `Received: ${scaleLength.perpendicularDistance}`,
    );
  }

  if (calculation.method === 'equal' && calculation.tonesPerOctave < 1) {
    throw new CalculationError(
      'tonesPerOctave must be a positive integer',
      `Received: ${calculation.tonesPerOctave}`,
    );
  }

  if (calculation.method === 'scala' && !calculation.scalaContent) {
    throw new CalculationError(
      'Scala method requires scalaContent to be set',
    );
  }
}

/**
 * Resolve the scale length in mm for each string.
 *
 * - single: all strings share fundamentalMm
 * - multi: linear interpolation from fundamentalMm (treble) to lastMm (bass)
 * - individual: explicit per-string values from individualMm
 *
 * @param config - Full fretboard config (must have passed validateConfig)
 * @returns Array of scale lengths in mm, one per string
 */
function resolveScaleLengths(config: FretboardConfig): number[] {
  const { scaleLength, strings } = config;
  const n = strings.count;

  switch (scaleLength.mode) {
    case 'single':
      // All strings share the same scale length
      return Array<number>(n).fill(scaleLength.fundamentalMm);

    case 'multi': {
      const s0 = scaleLength.fundamentalMm;
      const s1 = scaleLength.lastMm as number; // validated above
      // Linear interpolation: treble string = s0, bass string = s1
      return Array.from({ length: n }, (_, i) =>
        n === 1 ? s0 : s0 + ((s1 - s0) * i) / (n - 1),
      );
    }

    case 'individual':
      // Explicit per-string scale lengths (validated above)
      return (scaleLength.individualMm as number[]).slice(0, n);
  }
}

/**
 * String endpoint pair in 2D coordinates.
 */
interface StringEndpoint {
  nutX: number;
  nutY: number;
  bridgeX: number;
  bridgeY: number;
}

/**
 * Compute 2D string endpoints for each string.
 *
 * For single-scale: nut at x=0, bridge at x=si.
 * For multi/individual: perpendicular fret at x=0, so
 *   nutX[i] = -p * si, bridgeX[i] = (1-p) * si.
 *
 * Y positions are determined by string spacing at nut and bridge.
 * If nut width ≠ bridge width, strings are slightly angled (tapered neck).
 *
 * @param scaleLengths - Scale length in mm per string
 * @param config - Fretboard configuration
 * @returns Array of nut/bridge endpoints per string
 */
function computeStringEndpoints(
  scaleLengths: number[],
  config: FretboardConfig,
): StringEndpoint[] {
  const { scaleLength, strings } = config;
  const n = strings.count;
  const p = scaleLength.perpendicularDistance;

  // Convert gauges from inches to mm (gauges are stored in inches per spec)
  const gaugesMm = strings.gauges ? gaugesInchesToMm(strings.gauges) : undefined;

  // String center positions at nut and bridge (Y offsets from centerline)
  const nutYPositions = calculateStringPositions(
    strings.nutWidthMm,
    n,
    strings.spacing,
    gaugesMm,
  );
  const bridgeYPositions = calculateStringPositions(
    strings.bridgeWidthMm,
    n,
    strings.spacing,
    gaugesMm,
  );

  return Array.from({ length: n }, (_, i): StringEndpoint => {
    const si = scaleLengths[i];

    if (scaleLength.mode === 'single') {
      // Standard layout: nut at x=0, bridge at x=scaleLength
      // Strings may be slightly angled if nut width ≠ bridge width
      return {
        nutX: 0,
        nutY: nutYPositions[i],
        bridgeX: si,
        bridgeY: bridgeYPositions[i],
      };
    }

    // Multi / individual: perpendicular fret anchored at x=0
    // Each string extends p*si to the left (nut) and (1-p)*si to the right (bridge)
    return {
      nutX: -p * si,
      nutY: nutYPositions[i],
      bridgeX: (1 - p) * si,
      bridgeY: bridgeYPositions[i],
    };
  });
}

/**
 * Calculate fret distances from nut for one string, dispatching to the
 * correct calculator based on the configured method.
 *
 * @param scaleLengthMm - This string's scale length in mm
 * @param config - Fretboard configuration
 * @param scalaScale - Pre-parsed scala scale (required when method === 'scala')
 * @returns Array of distances from nut in mm, indexed 0..numFrets (0 = nut = 0mm)
 * @throws CalculationError for unsupported methods
 */
function computeFretDistances(
  scaleLengthMm: number,
  config: FretboardConfig,
  scalaScale: ScalaScale | null,
): number[] {
  const { calculation, numFrets } = config;

  if (calculation.method === 'equal') {
    // d = s * (1 - 1 / 2^(n/N))  where s=scale, n=fret, N=tonesPerOctave
    return allFretDistances(scaleLengthMm, numFrets, calculation.tonesPerOctave);
  }

  if (calculation.method === 'scala') {
    // Ratio-based positions from the parsed Scala scale
    return allScalaFretDistances(scaleLengthMm, numFrets, scalaScale as ScalaScale);
  }

  throw new CalculationError(
    `Unknown calculation method: ${calculation.method as string}`,
  );
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculate a complete fretboard design.
 *
 * This is the single entry point for the calculator module.
 * It validates the configuration, resolves all geometrical parameters,
 * and returns a fully-formed FretboardResult ready for rendering and export.
 *
 * @param config - Complete fretboard input configuration
 * @returns FretboardResult with fret positions, geometry, and metadata
 * @throws CalculationError for invalid configuration values
 * @throws ScalaParseError if the Scala content is malformed (propagates from scala-parser)
 */
export function calculateFretboard(config: FretboardConfig): FretboardResult {
  validateConfig(config);

  const { calculation, numFrets, strings } = config;
  const numStrings = strings.count;

  // ── Step 1: Parse Scala file if needed ───────────────────────────────────
  let scalaScale: ScalaScale | null = null;
  if (calculation.method === 'scala') {
    // ScalaParseError propagates up — the UI is responsible for catching it
    scalaScale = parseScala(calculation.scalaContent as string);
  }

  // ── Step 2: Resolve per-string scale lengths ──────────────────────────────
  const scaleLengths = resolveScaleLengths(config);

  // ── Step 3: Compute string 2D endpoints ──────────────────────────────────
  const endpoints = computeStringEndpoints(scaleLengths, config);

  // ── Step 4: Compute fret distances per string ────────────────────────────
  // distancesPerString[stringIndex][fretIndex] = distance from nut in mm
  const distancesPerString: number[][] = scaleLengths.map((si) =>
    computeFretDistances(si, config, scalaScale),
  );

  // ── Step 5: Build StringLine array ───────────────────────────────────────
  const stringLines: StringLine[] = endpoints.map((ep, i) => ({
    index: i,
    nutX: ep.nutX,
    nutY: ep.nutY,
    bridgeX: ep.bridgeX,
    bridgeY: ep.bridgeY,
    scaleLengthMm: scaleLengths[i],
  }));

  // ── Step 6: Build FretPosition array ─────────────────────────────────────
  // Layout in memory: string 0 frets 0..N, string 1 frets 0..N, …
  // Index formula: stringIndex * (numFrets + 1) + fretIndex
  const fretPositions: FretPosition[] = [];

  for (let si = 0; si < numStrings; si++) {
    const ep = endpoints[si];
    const scaleMm = scaleLengths[si];
    const distances = distancesPerString[si];

    // String direction vector (nut → bridge)
    const stringDx = ep.bridgeX - ep.nutX;
    const stringDy = ep.bridgeY - ep.nutY;

    for (let fn = 0; fn <= numFrets; fn++) {
      const d = distances[fn];

      // Ratio of how far along the string this fret sits (0 = nut, 1 = bridge)
      // d = s * ratio  →  ratio = d / s
      const ratio = d / scaleMm;

      // 2D position: nut + ratio * (bridge - nut)
      const x = ep.nutX + ratio * stringDx;
      const y = ep.nutY + ratio * stringDy;

      const distanceFromPreviousMm = fn === 0 ? 0 : d - distances[fn - 1];

      fretPositions.push({
        fret: fn,
        string: si,
        distanceFromNutMm: d,
        distanceFromPreviousMm,
        x,
        y,
        isPartial: false,
      });
    }
  }

  // ── Step 7: Build FretLine array ─────────────────────────────────────────
  // Each fret line connects string 0 to string N-1 at the same fret number.
  // With the index formula above we can look them up directly.
  const fretsPerString = numFrets + 1;
  const fretLines: FretLine[] = [];

  for (let fn = 0; fn <= numFrets; fn++) {
    // Index in fretPositions for (string=0, fret=fn) and (string=last, fret=fn)
    const firstPos = fretPositions[0 * fretsPerString + fn];
    const lastPos = fretPositions[(numStrings - 1) * fretsPerString + fn];

    fretLines.push({
      fret: fn,
      x1: firstPos.x,
      y1: firstPos.y,
      x2: lastPos.x,
      y2: lastPos.y,
      isPartial: false,
    });
  }

  // ── Step 8: Build FretboardOutline ───────────────────────────────────────
  const outline: FretboardOutline = {
    nutFirst: { x: endpoints[0].nutX, y: endpoints[0].nutY },
    nutLast: { x: endpoints[numStrings - 1].nutX, y: endpoints[numStrings - 1].nutY },
    bridgeFirst: { x: endpoints[0].bridgeX, y: endpoints[0].bridgeY },
    bridgeLast: { x: endpoints[numStrings - 1].bridgeX, y: endpoints[numStrings - 1].bridgeY },
  };

  // ── Step 9: Build metadata ────────────────────────────────────────────────
  const meta: CalculationMeta = {
    method: calculation.method,
    inputUnit: config.unit,
    ...(calculation.method === 'equal' && {
      tonesPerOctave: calculation.tonesPerOctave,
    }),
    ...(calculation.method === 'scala' && scalaScale !== null && {
      scalaDescription: scalaScale.description,
    }),
  };

  return {
    fretPositions,
    fretLines,
    strings: stringLines,
    outline,
    meta,
  };
}
