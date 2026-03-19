# CLAUDE.md — FretLabs

## Proyecto

**FretLabs**: Herramienta web PWA para diseño de diapasones de instrumentos de cuerda.
Calcula posiciones de trastes con precisión profesional para luthiers que usan CNC/laser cutter.
Soporta equal temperament, escalas microtonales (Scala SCL), single y multi-scale.

Stack: React + TypeScript + Tailwind CSS + Vite
Deploy: Vercel
PWA: vite-plugin-pwa (offline-first, sin push notifications)
Todo corre en el browser. No hay backend.

---

## Estructura

```
fretlabs/
├── public/
│   ├── icons/              → PWA icons (192x192, 512x512)
│   └── manifest.json       → PWA manifest (generado por vite-plugin-pwa)
├── src/
│   ├── config/
│   │   ├── presets.ts       → presets de instrumentos (Strat, Bass, etc.)
│   │   └── constants.ts     → constantes globales (unidades, límites, defaults)
│   ├── i18n/
│   │   ├── es.json          → strings en español
│   │   ├── en.json          → strings en inglés
│   │   └── index.ts         → helper para acceder a traducciones
│   ├── modules/
│   │   ├── calculator/
│   │   │   ├── engine.ts            → lógica matemática principal (posiciones de trastes)
│   │   │   ├── equal-temperament.ts → cálculo por raíz Nᵃ de 2
│   │   │   ├── scala-parser.ts      → parser de archivos .scl
│   │   │   ├── scala-temperament.ts → cálculo por intervalos Scala
│   │   │   ├── multiscale.ts        → interpolación multi-escala + perpendicular distance
│   │   │   ├── string-spacing.ts    → espaciado equal y proporcional
│   │   │   └── types.ts             → tipos/interfaces del módulo
│   │   ├── renderer/
│   │   │   ├── FretboardSVG.tsx     → componente SVG del diapasón
│   │   │   ├── geometry.ts          → conversión de datos a coordenadas SVG
│   │   │   └── types.ts             → tipos del renderer
│   │   ├── exporter/
│   │   │   ├── svg-export.ts        → export SVG descargable
│   │   │   ├── dxf-export.ts        → export DXF para CNC
│   │   │   ├── csv-export.ts        → export tabla de posiciones
│   │   │   └── types.ts             → tipos del exporter
│   │   └── ui/
│   │       ├── panels/
│   │       │   ├── ScaleLengthPanel.tsx
│   │       │   ├── StringsPanel.tsx
│   │       │   ├── CalculationPanel.tsx
│   │       │   ├── OverhangPanel.tsx
│   │       │   └── PresetSelector.tsx
│   │       ├── display/
│   │       │   ├── FretboardPreview.tsx  → contenedor del preview con controles
│   │       │   └── FretTable.tsx         → tabla de posiciones
│   │       ├── export/
│   │       │   └── ExportMenu.tsx        → botones de export (SVG, DXF, CSV)
│   │       └── layout/
│   │           ├── AppShell.tsx          → layout principal (sidebar + canvas)
│   │           └── MobileLayout.tsx      → layout mobile (stack vertical)
│   ├── hooks/
│   │   ├── useFretboard.ts       → hook principal que conecta estado → cálculo → render
│   │   ├── usePresets.ts         → gestión de presets
│   │   ├── useUnits.ts          → conversión de unidades
│   │   └── useLocale.ts         → idioma activo (es/en) + helper t() para traducciones
│   ├── utils/
│   │   ├── unit-converter.ts    → mm ↔ inches ↔ cm
│   │   ├── url-state.ts         → serializar/deserializar estado en URL hash
│   │   └── validators.ts        → validación de inputs numéricos y .scl
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                → Tailwind base + custom properties
├── __tests__/
│   ├── calculator/
│   │   ├── engine.test.ts
│   │   ├── equal-temperament.test.ts
│   │   ├── scala-parser.test.ts
│   │   └── multiscale.test.ts
│   ├── exporter/
│   │   └── dxf-export.test.ts
│   └── utils/
│       └── unit-converter.test.ts
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── PRD.md
├── CLAUDE.md
├── README.md
└── package.json
```

---

## Convenciones de código

- Archivos: kebab-case (`equal-temperament.ts`, `string-spacing.ts`)
- Variables y funciones: camelCase (`calculateFretPositions`, `scaleLength`)
- Componentes React: PascalCase (`FretboardPreview`, `ExportMenu`)
- Tipos e interfaces: PascalCase con sufijo descriptivo (`FretPosition`, `ScalaScale`, `ExportOptions`)
- Constantes: UPPER_SNAKE_CASE (`MAX_FRETS`, `DEFAULT_SCALE_LENGTH`)

- TypeScript strict mode habilitado
- Funciones async SIEMPRE con try/catch
- Cada función pública tiene JSDoc con descripción de params y return
- Imports ordenados: 1) react/libs 2) modules 3) hooks 4) utils 5) types
- Números matemáticos como `number`, NUNCA como `string` internamente
- Toda operación matemática con comentario explicando la fórmula

---

## Patrones obligatorios

### Módulo calculator: lógica pura, cero React

- Los archivos en `modules/calculator/` son TypeScript puro
- NO importan React, NO conocen componentes, NO acceden al DOM
- Reciben datos tipados, devuelven datos tipados
- Son 100% testeables con Vitest sin setup de React

### Módulo renderer: solo visualización

- Recibe datos calculados, genera SVG
- NO hace cálculos matemáticos propios
- NO muta estado

### Módulo exporter: solo conversión de formato

- Recibe datos calculados y geometría
- Genera archivos descargables (SVG, DXF, CSV)
- NO interactúa con UI directamente

### Componentes UI: solo presentación + estado local

- Los paneles reciben props y emiten cambios via callbacks
- Estado global del fretboard vive en `useFretboard` hook
- Los paneles NO llaman al calculator directamente

### Manejo de errores

- Funciones del calculator tiran `CalculationError` con mensaje descriptivo
- El parser Scala tira `ScalaParseError` con línea y detalle del error
- Los componentes atrapan errores y muestran inline, nunca alert()
- Formato de error: `{ type: string, message: string, detail?: string }`

### Internacionalización (i18n)

- Solo 2 idiomas: español (es) e inglés (en). NO usar i18next ni librerías pesadas.
- Cada idioma es un JSON plano en `src/i18n/` con keys descriptivas (ej: `"panel.scaleLength.label"`)
- El hook `useLocale` provee `t(key)` para obtener strings y `setLocale(lang)` para cambiar idioma
- Idioma activo se guarda en localStorage
- La terminología técnica de luthería (scale length, perpendicular distance, overhang, etc.) se mantiene en inglés en ambos idiomas — NO se traduce
- Los mensajes de error SÍ se traducen
- Los tooltips explicativos SÍ se traducen

---

## NO HACER (restricciones)

- NUNCA instalar dependencias sin preguntar primero
- NUNCA modificar archivos fuera de la carpeta asignada en la tarea
- NUNCA cambiar la estructura de carpetas
- NUNCA hacer refactors no solicitados
- NUNCA usar `any` en TypeScript — tipar todo explícitamente
- NUNCA usar `console.log` para debugging en código commiteado
- NUNCA poner lógica matemática en componentes React
- NUNCA poner lógica de UI (hooks, state, JSX) en módulos de cálculo
- NUNCA hardcodear valores numéricos — usar constantes de `config/constants.ts`
- NUNCA redondear resultados intermedios — solo redondear al mostrar al usuario
- NUNCA asumir unidades — siempre convertir explícitamente usando `unit-converter.ts`
- NUNCA modificar el service worker manualmente — vite-plugin-pwa lo gestiona
- NUNCA agregar push notifications ni APIs que requieran permisos del browser
- NUNCA hardcodear strings de UI en componentes — usar `t('key')` del hook `useLocale`
- NUNCA traducir terminología técnica de luthería — se mantiene en inglés en ambos idiomas
- NUNCA usar i18next ni librerías de i18n — la implementación es un JSON por idioma + hook

---

## Contratos entre módulos

### Calculator → Renderer

```typescript
// El calculator produce:
interface FretboardResult {
  frets: FretPosition[]; // posición de cada traste en cada cuerda
  strings: StringLine[]; // líneas de las cuerdas (nut a bridge)
  outline: FretboardOutline; // contorno del diapasón
  meta: CalculationMeta; // metadata (escala usada, unidad, etc.)
}

// El renderer consume FretboardResult y produce SVG
```

### Calculator → Exporter

```typescript
// El exporter recibe FretboardResult + ExportOptions
interface ExportOptions {
  format: 'svg' | 'dxf' | 'csv';
  unit: 'mm' | 'in' | 'cm';
  layers?: boolean; // DXF: separar en layers (frets, strings, outline)
  precision?: number; // decimales en tabla/CSV
}
```

### UI → Calculator (via useFretboard hook)

```typescript
interface FretboardConfig {
  scaleLength: ScaleLengthConfig;
  strings: StringConfig;
  calculation: CalculationConfig; // equal o scala
  overhang?: OverhangConfig;
  unit: Unit;
}

// El hook llama al calculator cuando FretboardConfig cambia
// y devuelve FretboardResult al UI
```

---

## Comandos útiles

### Desarrollo

- Dev: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`

### Testing

- Todos: `npm test`
- Watch: `npm test -- --watch`
- Calculator solo: `npm test -- --testPathPattern=calculator`
- Coverage: `npm test -- --coverage`

### Calidad

- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Format: `npx prettier --write .`
- Type check: `npx tsc --noEmit`

### PWA

- El service worker se genera automáticamente en build
- Para testear offline: build + preview + desactivar red en DevTools
- NO correr service worker en dev mode (causa problemas de caché)

---

## Notas de dominio (luthería)

Estas son referencias para entender la terminología del proyecto:

- **Scale length**: distancia nut → bridge. Determina las posiciones de trastes.
- **Equal temperament**: divide la octava en N partes iguales. Fórmula: `d = s - (s / (2^(n/N)))` donde s=scale, n=fret, N=tones per octave.
- **Just intonation / Scala**: cada intervalo se define con un ratio exacto o cents.
- **Perpendicular distance**: controla el ángulo de los trastes en multi-scale. 0=nut perpendicular, 0.5=traste 12 perpendicular, 1=bridge perpendicular.
- **Overhang**: distancia del centro de la cuerda exterior al borde del diapasón.
- **Proportional spacing**: el espacio entre cuerdas se ajusta por grosor para que el gap visible sea uniforme.
