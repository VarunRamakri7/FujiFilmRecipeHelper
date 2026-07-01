# Fuji Recipe Helper

A web-based tool for Fujifilm X-series photographers to build, preview, and save film simulation recipes — no account, no install, no build required.

## What it does

- **Recipe builder** — pick a film simulation, dial in parameters (Highlight Tone, Shadow Tone, Color, Grain, Clarity, and more), and see a live approximate preview
- **Before/after comparison** — toggle a draggable slider to reveal the original photo alongside the filtered result
- **Custom photo preview** — use one of three stock photos or upload your own image; uploaded photos persist for the session
- **Sensor-aware** — select your X-Trans generation and the UI automatically shows only the film sims and parameters your camera supports
- **Local recipe saving** — name and save recipes to your browser; export any recipe as a `.json` file
- **Recipe card export** — download the current recipe as a styled PNG card (dark or light theme-matched)

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

- The photo preview is an approximation; actual in-camera results will differ.
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

- [`index.html`](index.html): The single page entry point. Defines the full page structure: header, two-column layout (controls left, preview right), sensor selector modal, and the SVG grain filter definitions used by the preview. The grain section defines four filter variants (`grain-small-weak`, `grain-small-strong`, `grain-large-weak`, `grain-large-strong`) for every combination of Grain Size and Grain Effect Roughness. All UI sections are empty containers — content is rendered into them by `app.js` on load.

---

- [`css/variables.css`](css/variables.css): All design tokens as CSS custom properties: the full color palette (`--fuji-black`, `--fuji-orange`, etc.), font stack references, spacing scale, border radii, and transition durations. Includes theme-aware tokens (`--preview-bg`, `--filmstrip-bg`, etc.) that switch between dark and light values via `[data-theme]`. Everything in `styles.css` references these tokens rather than hard-coded values.

- [`css/styles.css`](css/styles.css): All layout and component styles. Covers the header, three-column app grid (film sim panel | preview | parameters panel), film simulation card grid, parameter sliders and option buttons, filmstrip frame, before/after comparison overlay, photo picker (including custom upload empty state), tooltip, sensor modal, recipe save panel, and responsive breakpoints at 1100px, 760px, 540px, and 390px. The preview photo sits inside a padded mat frame (`--preview-pad: 20px`) using `object-fit: contain` so the image is always fully visible with equal whitespace on all four sides. On screens 760px and below the preview photo is shown first, above the controls.

---

- [`js/app.js`](js/app.js): Main entry point and application controller. Holds the single shared state object (active sensor, selected film sim, photo choice, all parameter values). On init it renders film sim cards and parameter controls from the data files, loads the first stock photo, and wires up all event listeners. On every interaction it updates state, re-renders where needed, and calls `buildFilter()` to refresh the preview. Handles the photo picker including the Custom tab: switching to Custom shows an empty state with an upload prompt when no image has been uploaded, or the previously uploaded image if one exists. The uploaded blob URL persists for the session; a reupload button appears in the preview footer whenever a custom image is active. The "Export Card" button wires to `exportCard()` with the current film sim, params, and sensor label.

---

- [`js/data/filmSimulations.js`](js/data/filmSimulations.js): Static array of all 18 film simulation definitions. Each entry includes the simulation name, short camera-display name, a plain-English description, the analog film or aesthetic it's modeled after, the earliest X-Trans generation that supports it, color rendering characteristics (contrast, saturation, skin tones, highlights, shadows), a baseline CSS filter string, and an accent color used by the UI card.

- [`js/data/parameters.js`](js/data/parameters.js): Static array of the 10 adjustable recipe parameters. Each entry defines the parameter ID, label, plain-English tooltip description, type (`range` or `select`), numeric range or option list, default value, and the minimum sensor generation required (or `null` if universally supported).

- [`js/data/sensorGenerations.js`](js/data/sensorGenerations.js): Static array of the six X-Trans sensor generations, each listing its ID, display label, representative camera models, and the full set of film simulation IDs it supports. Also exports `GENERATION_ORDER` — an ordered array of generation IDs used to compare generations numerically for gating logic.

---

- [`js/utils/buildFilter.js`](js/utils/buildFilter.js): Pure function that takes a film simulation object and the current parameter values and returns a single CSS `filter` string. Parses the simulation's baseline filter into a function map, then applies deltas: `brightness` for Highlight Tone, `contrast` for Shadow Tone, `saturate` for Color and Color Chrome Effect, `hue-rotate` + `saturate` for Color Chrome FX Blue, `contrast` for Clarity. Grain appends an SVG filter reference (`url(#grain-small-weak)` etc.) chosen by the Roughness × Size combination. The result is applied directly to the preview image's `style.filter`.

- [`js/utils/recipes.js`](js/utils/recipes.js): All localStorage recipe logic. Exports `loadRecipes` (reads and validates stored recipes), `saveRecipe` (adds a new recipe with a UUID and timestamp), `deleteRecipe` (removes by ID), and `exportRecipe` (triggers a `.json` file download). No component touches `localStorage` directly.

- [`js/utils/exportCard.js`](js/utils/exportCard.js): Canvas-based recipe card renderer. Draws a 640×820px PNG using the HTML Canvas API — no external libraries. Reads the current `data-theme` and applies matching palette tokens (dark: deep charcoal / light: warm ivory). The card shows the film simulation name in display font, the `inspiredBy` reference, and a full parameter table with mini dot-track indicators for range params and accent-colored values for anything non-default. Triggered by the "Export Card" button; downloads as `<filmSimId>-recipe.png`.

---

- [`js/components/sensorSelector.js`](js/components/sensorSelector.js): Manages the sensor selection modal and header button. Renders a button for each sensor generation into the modal, handles open/close (including backdrop click and Escape key), saves the selection to `localStorage`, updates the header label, and calls back into `app.js` to re-render the UI for the new sensor.

- [`js/components/tooltip.js`](js/components/tooltip.js): Lightweight hover/focus tooltip system. Uses a single shared tooltip element appended to `<body>`. Listens for `mouseover`/`mouseout` and `focusin`/`focusout` on any element with a `data-tooltip` attribute. Positions the tooltip above the trigger by default, flipping below if there is insufficient space. Uses `visibility: hidden` for the height-measurement pass to avoid the inline `opacity` override bug that would keep tooltips invisible.

- [`js/components/comparisonSlider.js`](js/components/comparisonSlider.js): Draggable before/after divider overlaid on the preview photo. Handles `mousedown`/`mousemove`/`mouseup` and equivalent touch events. Moves the divider and clips the "before" image using a CSS `clip-path` percentage so the original and filtered halves are always visible side by side. Arrow key support on the handle (Shift+arrow for 10% jumps). Initialized lazily on the first time the comparison toggle is enabled. The divider position is computed relative to the `.comparison-overlay` element (not the outer figure) so it tracks correctly within the padded image area.

---

- [`assets/photos/`](assets/photos/): Three CC-licensed stock photos used as preview subjects: `stock-landscape.jpg`, `stock-architecture.jpg`, and `stock-color.jpg`. Chosen to cover a broad tonal range so that film simulation and parameter adjustments are clearly visible across different subject types.
