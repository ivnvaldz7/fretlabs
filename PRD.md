# FretLabs — PRD (Product Requirements Document)

## Problema

Las herramientas actuales para diseñar diapasones con trastes personalizados (fanned frets, microtonales, multi-escala) son o bien potentes pero con UX de 2008 (FretFind2D), o modernas pero limitadas a equal temperament (StewMac, FretCalc).

Los luthiers profesionales que trabajan con CNC/laser cutter sufren un flujo roto: calculan en FretFind2D → anotan los números → abren su software CAD → redibujan todo manualmente. Esto consume tiempo y es propenso a errores de transcripción que arruinan piezas.

### Cómo lo resuelven hoy

- **FretFind2D**: la opción menos mala. Potente en cálculo pero UI anticuada (jQuery 1.4), no responsive, export limitado.
- **StewMac Fret Calculator**: solo equal temperament, sin visualización 2D, sin multiscale.
- **Calculadoras simples**: solo posiciones básicas, sin modelado 2D.
- **Manualmente**: planillas de Excel + CAD. Lento y propenso a errores.

### Nuestra solución

FretLabs es una versión moderna de FretFind2D que mantiene toda la potencia de cálculo (multiscale, microtonales, Scala SCL) con UX contemporánea, preview en tiempo real, presets de instrumentos, y export directo a DXF listo para CNC.

Es una PWA instalable que funciona 100% offline en Android y Windows.

---

## Usuario

**Perfil principal**: Luthier profesional que construye instrumentos de cuerda custom y usa CNC/laser cutter en su flujo de trabajo.

**Lo que sabe**: entiende scale length, equal temperament vs just intonation, perpendicular fret distance, spacing proporcional de cuerdas. NO necesita tutoriales de qué es un traste.

**Lo que necesita**:

- **Precisión**: los números tienen que ser exactos. Un error de décimas arruina una pieza en CNC.
- **Velocidad**: llegar al diseño final y al archivo DXF en el menor tiempo posible.
- **Offline**: funcionar en el taller sin depender de internet.
- **Exportabilidad**: DXF limpio con polilíneas cerradas para importar directo a CAD/CAM.

**Contexto de uso**: alterna entre PC en el escritorio (diseño detallado) y celular en el taller (consulta rápida de medidas).

---

## Features del MVP

### MUST (sin esto no hay producto)

- [ ] Cálculo de posiciones de trastes con equal temperament (raíz Nᵃ de 2)
- [ ] Cálculo con escalas Scala SCL (microtonales / just intonation)
- [ ] Single scale y multi-scale (2 longitudes + perpendicular distance)
- [ ] Configuración de: número de trastes, número de cuerdas, ancho en cejilla y puente
- [ ] Espaciado de cuerdas: equal y proporcional (por grosor)
- [ ] Preview visual del diapasón que se actualiza en tiempo real
- [ ] Tabla de posiciones exportable (copiar / CSV)
- [ ] Export SVG del diseño
- [ ] **Export DXF para CNC/CAD** (polilíneas cerradas, capas separadas)
- [ ] Presets de instrumentos comunes (Strat 25.5", Les Paul 24.75", Bass 34", Baritone 27", etc.)
- [ ] Unidades: mm, pulgadas, cm (con conversión)
- [ ] Responsive: funciona en desktop y mobile
- [ ] **PWA instalable** con funcionamiento 100% offline (sin push notifications)
- [ ] **Precisión matemática verificable**: los cálculos deben coincidir con FretFind2D original
- [ ] **Bilingüe (español / inglés)**: toggle de idioma en la UI. Implementación simple con JSON por idioma + hook `useLocale`. La terminología técnica de luthería se mantiene en inglés en ambos idiomas.

### SHOULD (en orden de prioridad)

1. Overhang del diapasón (4 modos: equal, nut & bridge, first & last, all)
2. Configuración individual de escala por cuerda
3. Export PDF imprimible a escala real
4. Tooltips explicativos en cada parámetro
5. URL compartible para guardar/compartir diseños (parámetros en hash)

### COULD (nice to have)

- Biblioteca de escalas Scala precargadas (las más comunes: 19-TET, 31-TET, etc.)
- Dark mode / light mode toggle
- Undo/redo de cambios
- Comparar 2 diseños side by side
- Compensación de entonación básica

### WON'T (no en v1)

- Radio del diapasón (curvatura) — es modelado 3D, mucha complejidad
- Diseño completo de guitarra (body, headstock, etc.)
- Cuentas de usuario / login / base de datos
- Backend / API — toda la lógica corre en el browser
- App nativa mobile (la PWA cubre este caso)
- Simulación de sonido / audio preview
- Idiomas más allá de español e inglés
- Push notifications

---

## Flujos de usuario

### Flujo 1: Diseño rápido con preset (caso más común)

1. Luthier abre la app → ve un diapasón default (Strat 6 cuerdas, 25.5", 22 trastes)
2. Selecciona preset "Baritone 27" → todos los campos se actualizan, preview se redibuja
3. Ajusta ancho de cejilla a 44mm → preview se actualiza en tiempo real
4. Revisa tabla de posiciones → todo correcto
5. Click en "Export DXF" → descarga archivo listo para importar a su CAD/CAM

### Flujo 2: Diseño microtonal custom

1. Selecciona "Scala (just/microtonal)" como método de cálculo
2. Pega contenido de un archivo .scl (ej: 19-TET) en el campo de texto
3. Configura tuning por cuerda
4. Preview muestra trastes parciales y no paralelos (esperable)
5. Ajusta perpendicular distance → preview se actualiza
6. Exporta DXF + tabla de posiciones

### Flujo 3: Consulta rápida en mobile (taller)

1. Luthier en el taller abre la app en el celular (funciona offline)
2. Necesita la posición del traste 12 para una escala 25.5"
3. El diseño default ya muestra eso → scrollea a la tabla → copia el valor
4. Vuelve al trabajo en menos de 30 segundos

### Casos borde

- **Archivo .scl inválido**: mostrar error claro con detalle de qué está mal
- **Números absurdos** (200 trastes, escala de 1mm): mostrar warning pero permitir (los luthiers experimentales hacen cosas raras)
- **0 cuerdas / 0 trastes**: no permitir. Mínimo 1 cuerda, 1 traste
- **URL compartida con parámetros inválidos**: cargar defaults + mostrar aviso
- **Archivo DXF**: debe tener polilíneas cerradas y capas separadas (frets, strings, outline) para que sea usable en CAD/CAM

---

## Fuera de alcance v1

- **Backend / base de datos**: todo corre en el browser. Sin servidor, sin API, sin login.
- **Radio del diapasón (fretboard radius)**: modelado 3D, es v2.
- **Diseño de body / headstock / neck profile**: eso es un CAD de guitarra, otro producto.
- **Simulación de sonido**: otro proyecto entero.
- **Marketplace de escalas Scala**: un link al archivo Scala alcanza.
- **Multi-idioma**: inglés first.
- **Accounts / save to cloud**: localStorage + URL-sharing es suficiente para v1.
- **Push notifications**: no agregan valor y complican el service worker.

---

## Stack técnico

| Capa       | Decisión                            | Razón                                                          |
| ---------- | ----------------------------------- | -------------------------------------------------------------- |
| Framework  | React 18+ con TypeScript            | Familiaridad + tipado para precisión matemática                |
| Styling    | Tailwind CSS                        | Velocidad de desarrollo + responsive nativo                    |
| Build      | Vite                                | Rápido en dev, buen tree-shaking en prod                       |
| PWA        | vite-plugin-pwa                     | Service worker automático, precaching de assets                |
| Gráficos   | SVG nativo (React)                  | Control total para export, sin dependencias pesadas            |
| DXF Export | Librería TBD (dxf-writer o similar) | Debe generar polilíneas cerradas válidas                       |
| Deploy     | Vercel                              | Gratis, HTTPS automático (requerido para PWA), CI/CD integrado |
| Testing    | Vitest                              | Nativo de Vite, compatible con Jest API                        |

---

## Métricas de éxito

- El cliente puede generar un DXF usable en su CNC en menos de 2 minutos
- Los cálculos de posición coinciden con FretFind2D original (verificable con tests)
- La app funciona 100% offline después de la primera carga
- El preview se actualiza en menos de 100ms al cambiar un parámetro
