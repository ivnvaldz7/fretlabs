# FretLabs 🎸

Professional fretboard designer for luthiers. Supports single-scale, multi-scale, and microtonal instruments with precision export for CNC/laser cutter workflows.

## Features

- **Equal temperament** — any number of tones per octave (standard 12-TET, 19-TET, 24-TET, etc.)
- **Scala SCL support** — just intonation, meantone, and any custom microtonal scale
- **Multi-scale (fanned frets)** — dual scale lengths with configurable perpendicular fret distance
- **Real-time preview** — SVG fretboard visualization updates as you change parameters
- **CNC-ready export** — DXF with closed polylines and separated layers, plus SVG and CSV
- **Instrument presets** — Strat, Les Paul, Bass, Baritone, 7/8-string, and more
- **PWA / Offline** — installable on Android and Windows, works without internet
- **Bilingual** — English and Spanish interface

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build | Vite |
| PWA | vite-plugin-pwa |
| Testing | Vitest |
| Deploy | Vercel |

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
npm test
```

### Build for production

```bash
npm run build
npm run preview  # Preview the build locally
```

## Environment Variables

See `.env.example`. Currently no environment variables are required.

## Project Structure

```
src/
├── config/         → Presets, constants
├── i18n/           → Translations (en.json, es.json)
├── modules/
│   ├── calculator/ → Pure math: fret positions, Scala parser, string spacing
│   ├── renderer/   → SVG fretboard visualization
│   ├── exporter/   → SVG, DXF, CSV export
│   └── ui/         → React components (panels, display, layout)
├── hooks/          → useFretboard, useLocale, usePresets, useUnits
└── utils/          → Unit converter, validators, URL state
```

Key architectural decision: **the calculator module is pure TypeScript with zero React dependencies**. All math is testable independently, and the renderer only consumes calculated data. This separation ensures fret position accuracy can be verified against reference implementations (FretFind2D).

## Technical Decisions

- **All-frontend, no backend**: Fret calculations are deterministic math that runs entirely in the browser. No server needed, which also enables full offline functionality via PWA.
- **mm as internal unit**: All calculations use millimeters internally. Conversion to inches/cm only happens at the display boundary. This avoids floating point accumulation errors from repeated conversions.
- **Scala SCL as the microtonal standard**: The Scala format has thousands of pre-defined scales and is the de-facto standard in the microtonal community.

## License

[AGPL-3.0](./LICENSE)
