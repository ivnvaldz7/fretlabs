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
import { parseScala, allScalaFretDistances, allScalaFretDistancesWithTuning } from './scala-parser';
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
  OverhangConfig,
} from './types';
import { LIMITS, DEFAULTS } from '../../config/constants';
import { normalizeVector } from '../../utils/geometry';

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
  const { numFrets, strings, scaleLength, calculation, overhang, compensation } = config;

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

  if (calculation.method === 'scala' && calculation.tuning) {
    if (calculation.tuning.length < strings.count) {
      throw new CalculationError(
        'Scala tuning must provide one value per string',
        `Received ${calculation.tuning.length} values for ${strings.count} strings`,
      );
    }
    for (let i = 0; i < strings.count; i++) {
      const v = calculation.tuning[i];
      if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
        throw new CalculationError(
          'Scala tuning values must be non-negative integers (scale degrees)',
          `tuning[${i}] = ${String(v)}`,
        );
      }
    }
  }

  if (compensation) {
    if (compensation.mode === 'equal') {
      const v = compensation.equalMm;
      if (
        !Number.isFinite(v) ||
        v < LIMITS.MIN_COMPENSATION_MM ||
        v > LIMITS.MAX_COMPENSATION_MM
      ) {
        throw new CalculationError(
          `Compensation must be between ${LIMITS.MIN_COMPENSATION_MM}mm and ${LIMITS.MAX_COMPENSATION_MM}mm`,
          `Received: ${String(v)}`,
        );
      }
    } else if (compensation.mode === 'perString') {
      const arr = compensation.perStringMm;
      if (!arr || arr.length < strings.count) {
        throw new CalculationError(
          'perString compensation requires perStringMm with one value per string',
          `Received ${arr?.length ?? 0} values for ${strings.count} strings`,
        );
      }
      for (let i = 0; i < arr.length; i++) {
        if (
          !Number.isFinite(arr[i]) ||
          arr[i] < LIMITS.MIN_COMPENSATION_MM ||
          arr[i] > LIMITS.MAX_COMPENSATION_MM
        ) {
          throw new CalculationError(
            `Compensation value out of range for string ${i}`,
            `Expected ${LIMITS.MIN_COMPENSATION_MM}..${LIMITS.MAX_COMPENSATION_MM}mm, received: ${String(arr[i])}`,
          );
        }
      }
    }
  }

  if (overhang) {
    const values: Array<[string, number | undefined]> = [
      ['equalMm', overhang.equalMm],
      ['nutMm', overhang.nutMm],
      ['bridgeMm', overhang.bridgeMm],
      ['firstMm', overhang.firstMm],
      ['lastMm', overhang.lastMm],
      ['nutFirstMm', overhang.nutFirstMm],
      ['nutLastMm', overhang.nutLastMm],
      ['bridgeFirstMm', overhang.bridgeFirstMm],
      ['bridgeLastMm', overhang.bridgeLastMm],
    ];

    for (const [key, v] of values) {
      if (v === undefined) continue;
      if (
        !Number.isFinite(v) ||
        v < LIMITS.MIN_OVERHANG_MM ||
        v > LIMITS.MAX_OVERHANG_MM
      ) {
        throw new CalculationError(
          `Overhang value out of range for ${key}`,
          `Expected ${LIMITS.MIN_OVERHANG_MM}..${LIMITS.MAX_OVERHANG_MM}mm, received: ${String(v)}`,
        );
      }
    }

    const extensions: Array<[string, number | undefined]> = [
      ['nutExtensionMm', overhang.nutExtensionMm],
      ['lastFretExtensionMm', overhang.lastFretExtensionMm],
    ];

    for (const [key, v] of extensions) {
      if (v === undefined) continue;
      if (
        !Number.isFinite(v) ||
        v < LIMITS.MIN_EXTENSION_MM ||
        v > LIMITS.MAX_EXTENSION_MM
      ) {
        throw new CalculationError(
          `Extension value out of range for ${key}`,
          `Expected ${LIMITS.MIN_EXTENSION_MM}..${LIMITS.MAX_EXTENSION_MM}mm, received: ${String(v)}`,
        );
      }
    }
  }
}

function resolveOverhangCornersMm(
  overhang: OverhangConfig | undefined,
): { nutFirstMm: number; nutLastMm: number; bridgeFirstMm: number; bridgeLastMm: number } {
  if (!overhang) {
    return { nutFirstMm: 0, nutLastMm: 0, bridgeFirstMm: 0, bridgeLastMm: 0 };
  }

  const eq = overhang.equalMm ?? 0;

  if (overhang.mode === 'equal') {
    return { nutFirstMm: eq, nutLastMm: eq, bridgeFirstMm: eq, bridgeLastMm: eq };
  }

  if (overhang.mode === 'nutBridge') {
    const nut = overhang.nutMm ?? eq;
    const bridge = overhang.bridgeMm ?? eq;
    return { nutFirstMm: nut, nutLastMm: nut, bridgeFirstMm: bridge, bridgeLastMm: bridge };
  }

  if (overhang.mode === 'firstLast') {
    const first = overhang.firstMm ?? eq;
    const last = overhang.lastMm ?? eq;
    return { nutFirstMm: first, nutLastMm: last, bridgeFirstMm: first, bridgeLastMm: last };
  }

  // all
  return {
    nutFirstMm: overhang.nutFirstMm ?? overhang.firstMm ?? overhang.nutMm ?? eq,
    nutLastMm: overhang.nutLastMm ?? overhang.lastMm ?? overhang.nutMm ?? eq,
    bridgeFirstMm: overhang.bridgeFirstMm ?? overhang.firstMm ?? overhang.bridgeMm ?? eq,
    bridgeLastMm: overhang.bridgeLastMm ?? overhang.lastMm ?? overhang.bridgeMm ?? eq,
  };
}

// Removed local normalize function as it is now imported from utils/geometry as normalizeVector

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
function resolveCompensation(config: FretboardConfig): number[] {
  const { compensation, strings } = config;
  const n = strings.count;

  if (!compensation) {
    return Array<number>(n).fill(0);
  }

  if (compensation.mode === 'equal') {
    return Array<number>(n).fill(compensation.equalMm);
  }

  // perString mode — validated above
  const arr = compensation.perStringMm as number[];
  return arr.length >= n ? arr.slice(0, n) : [...arr, ...Array<number>(n - arr.length).fill(0)];
}

function resolveScaleLengths(config: FretboardConfig): number[] {
  const { scaleLength, strings } = config;
  const n = strings.count;

  // Theoretical scale lengths
  let theoretical: number[];

  switch (scaleLength.mode) {
    case 'single':
      theoretical = Array<number>(n).fill(scaleLength.fundamentalMm);
      break;

    case 'multi': {
      const s0 = scaleLength.fundamentalMm;
      const s1 = scaleLength.lastMm as number; // validated above
      theoretical = Array.from({ length: n }, (_, i) =>
        n === 1 ? s0 : s0 + ((s1 - s0) * i) / (n - 1),
      );
      break;
    }

    case 'individual':
      theoretical = (scaleLength.individualMm as number[]).slice(0, n);
      break;
  }

  // Apply intonation compensation: effective = theoretical + compensation
  const compensation = resolveCompensation(config);
  return theoretical.map((s, i) => s + compensation[i]);
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
  stringIndex: number,
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
    const scale = scalaScale as ScalaScale;
    const openDegree = calculation.tuning?.[stringIndex] ?? 0;
    if (openDegree === 0) {
      // Fast path for the common case
      return allScalaFretDistances(scaleLengthMm, numFrets, scale);
    }
    return allScalaFretDistancesWithTuning(scaleLengthMm, numFrets, scale, openDegree);
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
  const distancesPerString: number[][] = scaleLengths.map((si, stringIndex) =>
    computeFretDistances(stringIndex, si, config, scalaScale),
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
  // Default: each fret line connects string 0 to string N-1 at the same fret number.
  //
  // For Scala with per-string tuning offsets, frets are grouped by absolute
  // scale degree. This produces partial frets at the extremes when some strings
  // don't have a given degree within their 0..numFrets range.
  const fretsPerString = numFrets + 1;
  const fretLines: FretLine[] = [];

  const tuning = (calculation.method === 'scala' && calculation.tuning)
    ? calculation.tuning.slice(0, numStrings)
    : Array<number>(numStrings).fill(0);

  const tuningVaries =
    calculation.method === 'scala' && tuning.some((v) => v !== tuning[0]);

  if (!tuningVaries) {
    for (let fn = 0; fn <= numFrets; fn++) {
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
  } else {
    // Nut is always a full-width line at fn=0 for every string.
    {
      const firstPos = fretPositions[0 * fretsPerString + 0];
      const lastPos = fretPositions[(numStrings - 1) * fretsPerString + 0];
      fretLines.push({
        fret: 0,
        x1: firstPos.x,
        y1: firstPos.y,
        x2: lastPos.x,
        y2: lastPos.y,
        isPartial: false,
      });
    }

    const minOpen = Math.min(...tuning);
    const maxOpen = Math.max(...tuning);
    const minDegree = minOpen + 1;
    const maxDegree = maxOpen + numFrets;

    for (let degree = minDegree; degree <= maxDegree; degree++) {
      // Build segments for each contiguous run of strings that contain this degree.
      // A string contains 'degree' iff fn = degree - tuning[string] is in [1..numFrets].
      let presentCount = 0;
      let runStart: number | null = null;

      const flushRun = (runEndInclusive: number) => {
        if (runStart === null) return;
        const len = runEndInclusive - runStart + 1;
        if (len < 2) {
          runStart = null;
          return;
        }

        const firstFn = degree - tuning[runStart];
        const lastFn = degree - tuning[runEndInclusive];

        const firstPos = fretPositions[runStart * fretsPerString + firstFn];
        const lastPos = fretPositions[runEndInclusive * fretsPerString + lastFn];

        fretLines.push({
          fret: degree,
          x1: firstPos.x,
          y1: firstPos.y,
          x2: lastPos.x,
          y2: lastPos.y,
          isPartial: true, // upgraded to false below if it spans all strings
        });

        runStart = null;
      };

      for (let si = 0; si < numStrings; si++) {
        const fn = degree - tuning[si];
        const present = fn >= 1 && fn <= numFrets;
        if (present) {
          presentCount++;
          if (runStart === null) runStart = si;
        } else {
          flushRun(si - 1);
        }
      }
      flushRun(numStrings - 1);

      // If the degree spans all strings, mark every segment as non-partial
      // (there will be exactly one segment in that case).
      if (presentCount === numStrings) {
        const last = fretLines[fretLines.length - 1];
        if (last && last.fret === degree) last.isPartial = false;
      }
    }
  }

  // ── Step 8: Build FretboardOutline ───────────────────────────────────────
  const nutExt = config.overhang?.nutExtensionMm ?? DEFAULTS.NUT_EXTENSION_MM;
  const lastFretExt = config.overhang?.lastFretExtensionMm ?? DEFAULTS.LAST_FRET_EXTENSION_MM;

  // Directions of the outer strings (nut -> bridge)
  const dirFirst = normalizeVector(
    endpoints[0].bridgeX - endpoints[0].nutX,
    endpoints[0].bridgeY - endpoints[0].nutY
  );
  const dirLast = normalizeVector(
    endpoints[numStrings - 1].bridgeX - endpoints[numStrings - 1].nutX,
    endpoints[numStrings - 1].bridgeY - endpoints[numStrings - 1].nutY
  );

  // Positions of the last fret on the first and last strings
  const lastFretFirst = fretPositions[0 * fretsPerString + numFrets];
  const lastFretLast = fretPositions[(numStrings - 1) * fretsPerString + numFrets];

  // Base outline corners projected longitudinally
  const baseOutline: FretboardOutline = {
    nutFirst: {
      x: endpoints[0].nutX - dirFirst.x * nutExt,
      y: endpoints[0].nutY - dirFirst.y * nutExt,
    },
    nutLast: {
      x: endpoints[numStrings - 1].nutX - dirLast.x * nutExt,
      y: endpoints[numStrings - 1].nutY - dirLast.y * nutExt,
    },
    bridgeFirst: {
      x: lastFretFirst.x + dirFirst.x * lastFretExt,
      y: lastFretFirst.y + dirFirst.y * lastFretExt,
    },
    bridgeLast: {
      x: lastFretLast.x + dirLast.x * lastFretExt,
      y: lastFretLast.y + dirLast.y * lastFretExt,
    },
  };

  const corners = resolveOverhangCornersMm(config.overhang);

  const nutDir = normalizeVector(
    baseOutline.nutLast.x - baseOutline.nutFirst.x,
    baseOutline.nutLast.y - baseOutline.nutFirst.y,
  );
  const bridgeDir = normalizeVector(
    baseOutline.bridgeLast.x - baseOutline.bridgeFirst.x,
    baseOutline.bridgeLast.y - baseOutline.bridgeFirst.y,
  );

  const outline: FretboardOutline = {
    nutFirst: {
      x: baseOutline.nutFirst.x - nutDir.x * corners.nutFirstMm,
      y: baseOutline.nutFirst.y - nutDir.y * corners.nutFirstMm,
    },
    nutLast: {
      x: baseOutline.nutLast.x + nutDir.x * corners.nutLastMm,
      y: baseOutline.nutLast.y + nutDir.y * corners.nutLastMm,
    },
    bridgeFirst: {
      x: baseOutline.bridgeFirst.x - bridgeDir.x * corners.bridgeFirstMm,
      y: baseOutline.bridgeFirst.y - bridgeDir.y * corners.bridgeFirstMm,
    },
    bridgeLast: {
      x: baseOutline.bridgeLast.x + bridgeDir.x * corners.bridgeLastMm,
      y: baseOutline.bridgeLast.y + bridgeDir.y * corners.bridgeLastMm,
    },
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
