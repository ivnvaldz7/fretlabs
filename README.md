# FretLabs

**Professional fretboard designer for luthiers.** Single-scale, multi-scale (fanned frets), and microtonal instruments with precision export for CNC/laser cutter workflows.

Built with React + TypeScript + Tailwind CSS v4. Runs 100% in the browser. Zero backend. Installable as a PWA.

---

## Features

| Feature | Description |
|---------|-------------|
| **Equal temperament** | Any number of tones per octave — standard 12-TET, 19-TET, 31-TET, 53-TET, etc. |
| **Scala SCL support** | Just intonation, meantone, and any custom microtonal scale via .scl files |
| **Multi-scale / fanned frets** | Dual scale lengths + configurable perpendicular fret distance |
| **Individual string scales** | Every string gets its own scale length |
| **String spacing** | Equal (uniform gaps) or proportional (adjusted by string gauge) |
| **Real-time SVG preview** | Fretboard visualization updates on every parameter change |
| **Intonation compensation** | Saddle offset per string (equal or per-string modes) |
| **Overhang control** | 4 modes (equal, nut & bridge, first & last, all) + longitudinal extensions |
| **Instrument presets** | Strat, Les Paul, Bass, Baritone, 7/8-string, and more |
| **Scale presets** | 10 preloaded Scala scales (19-TET, 24-TET, 31-TET, 5-limit JI, Pythagorean, etc.) |
| **Undo/redo** | 50-deep history with 300ms coalescing for rapid input |
| **Compare designs** | Side-by-side view with frozen reference snapshot |
| **Dark / Light theme** | Persistent preference with system detection |
| **CNC-ready DXF export** | Closed polylines, separated layers (frets, strings, outline) |
| **SVG export** | Clean SVG for vector editing |
| **CSV export** | Fret position table for spreadsheets |
| **PDF export** | Print-ready 1:1 scale with multi-page tiling |
| **URL sharing** | Full state serialized in URL hash |
| **Bilingual** | English and Spanish — toggle in the header |
| **PWA / Offline** | Installable, works without internet |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (`@theme` directives, `@custom-variant`) |
| Build | Vite |
| PWA | vite-plugin-pwa (offline-first, no push notifications) |
| Testing | Vitest (171+ tests across 13 files) |
| Graphics | Native SVG (React components) |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/YOUR_USERNAME/fretlabs.git
cd fretlabs
npm install
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Run tests

```bash
npm test              # Run all
npm test -- --watch   # Watch mode
npm test -- --coverage
```

### Build for production

```bash
npm run build
npm run preview   # Preview the production build locally
```

### Quality checks

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript strict check
npx prettier --write . # Format
```

---

## Library API — Programmatic Usage

The calculator module is **pure TypeScript with zero React dependencies**. You can import and use it in any Node.js or browser project.

### Quick example

```typescript
import { calculateFretboard } from './src/modules/calculator/engine';
import type { FretboardConfig } from './src/modules/calculator/types';

const config: FretboardConfig = {
  numFrets: 22,
  unit: 'mm',
  scaleLength: {
    mode: 'single',
    fundamentalMm: 647.7,    // 25.5"
    perpendicularDistance: 0.5,
  },
  strings: {
    count: 6,
    nutWidthMm: 42.86,
    bridgeWidthMm: 52.39,
    spacing: 'equal',
  },
  calculation: {
    method: 'equal',
    tonesPerOctave: 12,
  },
  overhang: {
    mode: 'equal',
    equalMm: 3,
    nutExtensionMm: 0,
    lastFretExtensionMm: 10,
  },
};

const result = calculateFretboard(config);
// result.fretPositions  → positions per string & fret
// result.fretLines      → line segments for each fret
// result.strings        → nut-to-bridge lines
// result.outline        → fretboard edge polygon
// result.meta           → method, unit, etc.
```

### With intonation compensation

```typescript
const config: FretboardConfig = {
  // ... base config ...
  compensation: {
    mode: 'equal',
    equalMm: 3,   // 3mm saddle offset for all strings
  },
};
```

### With a Scala SCL scale

```typescript
import { parseScala } from './src/modules/calculator/scala-parser';

const config: FretboardConfig = {
  // ... base config ...
  calculation: {
    method: 'scala',
    tonesPerOctave: 12,
    scalaContent: `! 19-TET.scl\n19 tone equal temperament\n 19\n! 19-TET\n 63.157895\n 126.315789\n 189.473684\n ...`,
    tuning: [0, 0, 0, 0, 0, 0],  // scale step per string (0 = unison)
  },
};
```

### Multi-scale (fanned frets)

```typescript
const config: FretboardConfig = {
  scaleLength: {
    mode: 'multi',
    fundamentalMm: 647.7, // treble side  (25.5")
    lastMm: 685.8,        // bass side    (27.0")
    perpendicularDistance: 0.5, // 0 = nut, 0.5 = fret 12, 1 = bridge
  },
  // ...
};
```

---

## Module Reference

```
src/
├── config/              → Presets, constants
│   ├── presets.ts       → Instrument presets (Strat, Bass, etc.)
│   ├── scale-presets.ts → 10 preloaded Scala scales
│   └── constants.ts     → LIMITS, DEFAULTS, unit tables
├── i18n/                → Translations (en, es) via JSON + hook
├── modules/
│   ├── calculator/      → **Pure math** (zero React)
│   ├── renderer/        → SVG visualization (React components)
│   ├── exporter/        → File format conversion (SVG, DXF, CSV, PDF)
│   └── ui/              → React presentation components
├── hooks/               → React hooks (useFretboard, useTheme, etc.)
└── utils/               → Unit conversion, validation, URL state, geometry
```

### `modules/calculator/` — Pure math engine

**Types** (`types.ts`):

```typescript
// Input
FretboardConfig       — Complete design configuration
ScaleLengthConfig     — Single | Multi | Individual scale lengths
StringConfig          — Count, nut/bridge widths, spacing, gauges
CalculationConfig     — Method (equal | scala), tonesPerOctave, .scl content
OverhangConfig        — Fretboard edge overhang (4 modes)
CompensationConfig    — Intonation saddle offset (equal | per-string)

// Output
FretboardResult       — Complete calculation result
FretPosition          — One fret on one string (distance, 2D coordinates)
FretLine              — Fret line spanning all strings
StringLine            — String from nut to bridge (endpoints, scale length)
FretboardOutline      — Fretboard edge quadrilateral
CalculationMeta       — Method, unit, descriptions
```

**Functions** (`engine.ts`):

| Function | Description |
|----------|-------------|
| `calculateFretboard(config)` | Main entry point. Returns `FretboardResult` or throws `CalculationError` / `ScalaParseError`. |

**Standalone calculators:**

| Module | Functions | Description |
|--------|-----------|-------------|
| `equal-temperament.ts` | `fretDistanceFromNut(scale, fret, npo)`, `allFretDistances(scale, frets, npo)`, `fretRatio(fret, npo)` | Formula: `d = s × (1 − 1 / 2^(n/N))` |
| `scala-parser.ts` | `parseScala(content)`, `scalaFretDistance(scale, interval)`, `allScalaFretDistances(scale, frets, scaleDef)`, `scalaFretDistanceWithTuning`, `allScalaFretDistancesWithTuning` | Parses .scl files, computes fret positions from ratios/cents |
| `string-spacing.ts` | `calculateStringPositions(width, count, mode, gauges?)`, `gaugesInchesToMm(inches)` | Equal or proportional spacing |
| `multiscale.ts` | — | 2D interpolation helpers (called internally by engine) |

**Error types:**

- `CalculationError` — Invalid configuration (out of range, missing fields)
- `ScalaParseError` — Malformed .scl file (line number + detail)

**Contracts:**

```
Calculator (pure TS) ──→ FretboardResult ──→ Renderer (SVG)
                                          ──→ Exporter (SVG, DXF, CSV, PDF)
```

### `modules/renderer/` — SVG visualization

| Component / Function | Description |
|----------------------|-------------|
| `FretboardSVG` | React component that renders the fretboard SVG |
| `computeSvgViewport(result)` | Viewport dimensions for SVG layout |

### `modules/exporter/` — File export

| Function | Output | Description |
|----------|--------|-------------|
| `exportSvg(result, options)` | `*.svg` | Clean standalone SVG for vector editors |
| `exportDxf(result, options)` | `*.dxf` | DXF R12 with closed polylines, separated layers (frets, strings, outline) |
| `exportCsv(result, options)` | `*.csv` | Fret position table with headers |
| `exportPdfHtml(result, options)` | `*.html` | Print-optimized HTML for 1:1 PDF via browser print |

**Export options** (`ExportOptions`):

```typescript
interface ExportOptions {
  format: 'svg' | 'dxf' | 'csv';
  unit: 'mm' | 'in' | 'cm';
  precision?: number;          // Decimal places (CSV)
  layers?: boolean;            // DXF: separate layers
  extendFrets?: boolean;       // SVG/PDF: extend fret lines to outline edge
}
```

### `hooks/` — React hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useFretboard()` | `{ config, result, error, warnings, updateScaleLength, updateStrings, updateOverhang, updateCalculation, updateCompensation, undo, redo, ... }` | Central state hook — config, calculation, compare mode, undo/redo |
| `useTheme()` | `{ theme, toggleTheme }` | Dark/light theme with localStorage + system preference |
| `useLocale()` | `{ t, locale, setLocale }` | i18n helper — `t('key')` returns translated string |
| `usePresets()` | — | Instrument preset management |
| `useUnits()` | — | Unit conversion |

### `utils/` — Utilities

| Module | Key functions | Description |
|--------|---------------|-------------|
| `unit-converter.ts` | `toMm()`, `fromMm()`, `toDisplayValue()`, `parseToMm()`, `formatForDisplay()`, `roundToInchFraction()` | All internal math in mm; conversion at display boundary |
| `validators.ts` | `validateNumFrets()`, `validateNumStrings()`, `validateScaleLength()`, `validatePositiveNumber()`, `validatePerpendicularDistance()` | Returns `{ valid, error }` — used by UI panels for inline validation |
| `url-state.ts` | `serializeConfigToHash(config)`, `parseConfigFromHash(hash)`, `isUrlPayloadV1()` | Full config serialized as base64 in URL hash |
| `geometry.ts` | `ptDistance()`, `lineLength()`, `normalizeVector()` | 2D vector utilities used by calculator and renderer |
| `ui-classes.ts` | `INPUT_CLS`, `LABEL_CLS`, `INPUT_GROUP_CLS` | Shared Tailwind class constants for UI consistency |

---

## Architecture Decisions

### Module Separation

```
┌─────────────┐    FretboardResult    ┌─────────────┐
│  Calculator  │ ──────────────────→ │   Renderer   │
│  (pure TS)   │                    │  (SVG, React) │
└─────────────┘                    └─────────────┘
       │
       │ FretboardResult
       ▼
┌─────────────┐
│   Exporter   │
│  (SVG/DXF/CSV/PDF)
└─────────────┘
```

The calculator module is **pure TypeScript with zero React dependencies**. All math is testable independently, and the renderer only consumes calculated data. This separation ensures fret position accuracy can be verified against reference implementations (FretFind2D).

### All math in mm

All calculations use millimeters internally. Conversion to inches/cm only happens at the display boundary (`toDisplayValue()` / `parseToMm()`). This avoids floating-point accumulation errors from repeated conversions.

### Key formulas

- **Equal temperament fret distance**: `d = s × (1 − 1 / 2^(n/N))`
  where `s` = scale length, `n` = fret number, `N` = tones per octave
- **Multi-scale 2D interpolation**: ratio-based along each string's vector
- **Effective scale length**: `effective = theoretical + compensation` (intonation offset)

### Error handling

- Calculator throws `CalculationError` or `ScalaParseError`
- UI catches errors and displays them inline (never `alert()`)
- Validation functions return `{ valid, error }` for inline feedback
- Warnings (non-blocking) shown as amber badges for extreme values

### PWA strategy

- `vite-plugin-pwa` generates service worker automatically (precache strategy)
- No push notifications — they add complexity without value for this use case
- Full offline capability after first load
- Service worker does NOT run in development mode

---

## Environment Variables

See `.env.example`. Currently no environment variables are required.

---

## License

[AGPL-3.0](./LICENSE)
