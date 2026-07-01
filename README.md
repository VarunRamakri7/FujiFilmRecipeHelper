# Fuji Recipe Helper

A web-based tool for Fujifilm X-series photographers to build, preview, and save film simulation recipes — no account, no install, no build required.

## What it does

- **Recipe builder** — pick a film simulation, dial in parameters (Highlight Tone, Shadow Tone, Color, Grain, Clarity, and more), and see a live approximate preview
- **Before/after comparison** — toggle a draggable slider to reveal the original photo alongside the filtered result
- **Sensor-aware** — select your X-Trans generation and the UI automatically shows only the film sims and parameters your camera supports
- **Local recipe saving** — name and save recipes to your browser; export any recipe as a `.json` file

## Usage

Open [`index.html`](index.html) in any modern browser. No server, no dependencies, no installation.

## Camera support

All Fujifilm X-Trans sensor generations are supported:

| Generation | Example models |
|---|---|
| X-Trans I | X-Pro1, X-E1 |
| X-Trans II | X-T1, X-E2, X100T |
| X-Trans III | X-T2, X-T20, X-Pro2, X100F |
| X-Trans IV (Early) | X-T3, X-T30 |
| X-Trans IV | X-T4, X-T30 II, X-Pro3, X100V, X-S10 |
| X-Trans V | X-T5, X-H2, X-H2S, X-T50, X100VI |

## Notes

- The photo preview is an approximation, actual in-camera results will differ.
- Recipe storage uses `localStorage` — clearing browser data will remove saved recipes. Export important recipes as JSON.
- Bayer-sensor cameras (X-A series) are not currently supported.

## Tech stack

Vanilla HTML, CSS, and JavaScript. No frameworks, no build tools.

---

## Implementation

### How it works

The app is a single HTML page. On load, `app.js` reads the active sensor from `localStorage`, renders film simulation cards and parameter controls from the static data files, and loads a stock photo into the preview area. Every user interaction — selecting a film sim, moving a slider, changing a parameter — calls `buildFilter()` which composes a CSS `filter` string and applies it to the preview image in real time.

Sensor selection gates what the user can see: film simulations and parameters not supported by the chosen generation are rendered as dimmed/disabled. Recipes are saved to `localStorage` as JSON objects and can be exported as `.json` files.

### File reference

- [`index.html`](index.html): The single page entry point. Defines the full page structure: header, two-column layout (controls left, preview right), sensor selector modal, and the SVG grain filter definitions used by the preview. All UI sections are empty containers — content is rendered into them by `app.js` on load.

---

- [`css/variables.css`](css/variables.css): All design tokens as CSS custom properties: the full color palette (`--fuji-black`, `--fuji-orange`, etc.), font stack references, spacing scale, border radii, and transition durations. Everything in `styles.css` references these tokens rather than hard-coded values.

- [`css/styles.css`](css/styles.css): All layout and component styles. Covers the header, two-column app grid, film simulation card grid, parameter sliders and option buttons, filmstrip frame, before/after comparison overlay, photo picker, tooltip, sensor modal, recipe save panel, and responsive breakpoints.

---

- [`js/app.js`](js/app.js): Main entry point and application controller. Holds the single shared state object (active sensor, selected film sim, photo choice, all parameter values). On init it renders film sim cards and parameter controls from the data files, loads the first stock photo, and wires up all event listeners. On every interaction it updates state, re-renders where needed, and calls `buildFilter()` to refresh the preview. Also handles the Reset button and the sensor-change callback.

---

- [`js/data/filmSimulations.js`](js/data/filmSimulations.js): Static array of all 18 film simulation definitions. Each entry includes the simulation name, short camera-display name, a plain-English description, the analog film or aesthetic it's modeled after, the earliest X-Trans generation that supports it, color rendering characteristics (contrast, saturation, skin tones, highlights, shadows), a baseline CSS filter string, and an accent color used by the UI card.

- [`js/data/parameters.js`](js/data/parameters.js): Static array of the 10 adjustable recipe parameters. Each entry defines the parameter ID, label, plain-English tooltip description, type (`range` or `select`), numeric range or option list, default value, and the minimum sensor generation required (or `null` if universally supported).

- [`js/data/sensorGenerations.js`](js/data/sensorGenerations.js): Static array of the six X-Trans sensor generations, each listing its ID, display label, representative camera models, and the full set of film simulation IDs it supports. Also exports `GENERATION_ORDER` — an ordered array of generation IDs used to compare generations numerically for gating logic.

---

- [`js/utils/buildFilter.js`](js/utils/buildFilter.js): Pure function that takes a film simulation object and the current parameter values and returns a single CSS `filter` string. Applies the simulation's baseline filter then layers deltas for each parameter: brightness adjustments for Highlight/Shadow Tone, saturation for Color and Color Chrome Effect, hue-rotate for Color Chrome Blue, contrast for Clarity, and SVG filter references for grain. The result is applied directly to the preview image's `style.filter`.

- [`js/utils/recipes.js`](js/utils/recipes.js): All localStorage recipe logic. Exports `loadRecipes` (reads and validates stored recipes), `saveRecipe` (adds a new recipe with a UUID and timestamp), `deleteRecipe` (removes by ID), and `exportRecipe` (triggers a `.json` file download). No component touches `localStorage` directly.

---

- [`js/components/sensorSelector.js`](js/components/sensorSelector.js): Manages the sensor selection modal and header button. Renders a button for each sensor generation into the modal, handles open/close (including backdrop click and Escape key), saves the selection to `localStorage`, updates the header label, and calls back into `app.js` to re-render the UI for the new sensor.

- [`js/components/tooltip.js`](js/components/tooltip.js): Lightweight hover/focus tooltip system. Uses a single shared tooltip element appended to `<body>`. Listens for `mouseover`/`mouseout` and `focusin`/`focusout` on any element with a `data-tooltip` attribute. Positions the tooltip above the trigger by default, flipping below if there is insufficient space at the top of the viewport.

- [`js/components/comparisonSlider.js`](js/components/comparisonSlider.js): Draggable before/after divider overlaid on the preview photo. Handles `mousedown`/`mousemove`/`mouseup` and equivalent touch events. Moves the divider and clips the "before" image using a CSS `clip-path` percentage so the original and filtered halves are always visible side by side.

---

- [`assets/photos/`](assets/photos/): Three CC-licensed stock photos used as preview subjects: `stock-landscape.jpg`, `stock-architecture.jpg`, and `stock-color.jpg`. Chosen to cover a broad tonal range so that film simulation and parameter adjustments are clearly visible across different subject types.
