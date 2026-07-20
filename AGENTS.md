# FujiFilm Recipe Helper — Agent Guidance

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

A web-based tool for Fujifilm X-series camera users to build, preview, and manage film simulation recipes. The UI has a retro-analog aesthetic. Targets the recipe builder (film sim selector + parameter controls + live photo preview) and local recipe saving — no backend, no accounts, no community features.

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework, no build step; open `index.html` directly in a browser
- **CSS custom properties** — retro palette and design tokens defined in `css/variables.css`
- **ES Modules** — JS files use `type="module"`; no bundler required
- **localStorage** — recipe persistence; no backend

## Running the App

No build step. Open `index.html` directly in a browser, or serve it locally to avoid ES module CORS restrictions:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

There are no tests, no linter, and no package manager.

## Repo Layout

```
index.html        # single page entry point
css/              # variables.css (tokens) + styles.css (all styles)
js/
  app.js          # main entry and application controller
  data/           # filmSimulations.js, parameters.js, sensorGenerations.js
  utils/          # buildFilter.js, recipes.js, exportCard.js
  components/     # comparisonSlider.js, tooltip.js, sensorSelector.js, zoomLens.js
assets/photos/    # CC-licensed stock photos
.agents/skills/   # per-task skill definitions
```

## Architecture

Single-page app. All state lives in one object in `js/app.js`. Every user interaction updates state and re-renders.

**Data flow:**
1. User selects a film sim or moves a slider → `app.js` updates `state`
2. `buildFilter(sim, state.params)` composes a CSS `filter` string
3. That string is applied directly to `photoAfter.style.filter`

**Rendering pattern — dual targets:**
Film sim cards and parameter controls are rendered into two containers each (desktop hidden panels + mobile sheet containers). `filmSimHTML()` and `parametersHTML()` return HTML strings; `renderFilmSims()` and `renderParameters()` write the same string to both. Event delegation handles both lists via shared handlers (`handleFilmSimClick`, `handleParamInput`, `handleParamClick`).

**Bottom sheet system:**
`openSheet(key)` / `closeSheet()` in `app.js` drive four sheets (`film`, `params`, `recipe`, `options`). Open state uses a CSS class (`is-open`) with a `transform` transition. Because sheets use `left: 50%; transform: translateX(-50%)` for centering, the closed state must compose both transforms: `translateX(-50%) translateY(calc(100% + var(--sp-3)))`.

**Simulation engine:**
`js/utils/buildFilter.js` parses the simulation's `baselineCssFilter` into a `Map`, accumulates parameter deltas into that Map, then serializes it back to a filter string. This prevents double-applying functions when multiple parameters affect the same CSS function (e.g. Shadow Tone + Clarity both modify `contrast`). See `SIMULATION_ENGINE.md` for full documentation including drawbacks.

**Sensor gating:**
`sensorMinGeneration` on each film sim and parameter is compared against `GENERATION_ORDER` (an ordered array in `sensorGenerations.js`) to determine if a feature is available on the selected camera. Gated items render as disabled/dimmed with a tooltip.

## Domain Knowledge

### Film Simulations
Each simulation is defined in `js/data/filmSimulations.js`. Every entry includes:
- `id`, `name`, `shortName`, `description`, `inspiredBy` (analog film reference)
- `sensorMinGeneration` — the earliest X-Trans generation that supports it
- `baselineCssFilter` — a baseline CSS filter string approximating the look
- `characteristics` — plain-English color rendering notes used for tooltips
- `accentColor` — hex color used for the UI card swatch

### Parameters
All adjustable parameters live in `js/data/parameters.js`. Each has:
- `id`, `label`, `range` (`[min, max]`), `default`, `step`
- `description` — plain-English tooltip copy explaining what the parameter does
- `sensorMinGeneration` — sensor generation gate (if applicable, e.g., Clarity is X-Trans IV+)

### Sensor Generations
Defined in `js/data/sensorGenerations.js`:
- X-Trans I through X-Trans V
- Each entry lists representative camera models and a `supportedSimIds` array
- `GENERATION_ORDER` is an ordered array used to compare generations numerically for gating logic

## Key Conventions

- **No pixel-perfect simulation** — the CSS filter preview is directionally accurate, not hardware-identical. The disclaimer shown in the UI reflects this.
- **Theme system** — `data-theme="dark|light"` on `<html>` drives all theming via CSS custom properties. Theme persists to `localStorage` under key `fuji-theme`. Never hard-code light/dark color values in `styles.css`; always use tokens from `css/variables.css`.
- **No backdrop blur on sheets** — the sheet backdrop uses `rgba(0,0,0,0.35)` only, no `backdrop-filter`.
- **Comparison slider geometry** — drag tracking is relative to `.comparison-overlay`, not `.photo-figure`, because the image sits inside a padded mat frame. The magnifier (`zoomLens.js`) uses the same reference for consistency.
- **Canvas sizing (zoomLens.js)** — use `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` (absolute), not `ctx.scale()` (cumulative). Observe the parent element with ResizeObserver, never the canvas itself — setting `canvas.width` triggers relayout which re-fires the observer infinitely.
- **Framed preview** — the photo sits inside a padded mat frame (`--preview-pad: 20px`, `object-fit: contain`) with a solid `--preview-bg` background.
- **Custom photo** — the Custom tab accepts user-uploaded images via `URL.createObjectURL`. The blob URL persists for the session; the figure's `aspect-ratio` is updated to match the uploaded image's natural dimensions.
- **Recipe card export** — `js/utils/exportCard.js` renders a PNG via the Canvas API (no external libs). Reads `data-theme` at call time.
- **localStorage** — only `js/utils/recipes.js` touches localStorage for recipes.
- **Accessibility** — all interactive controls have ARIA labels; sliders are keyboard-navigable.

## Adding a New Film Simulation

1. Add an entry to `js/data/filmSimulations.js` — include `id`, `name`, `shortName`, `description`, `inspiredBy`, `sensorMinGeneration`, `characteristics`, `baselineCssFilter`, `accentColor`.
2. Add the sim ID to the appropriate generation(s) in `js/data/sensorGenerations.js` under `supportedSimIds`.
3. No other changes needed — rendering is fully data-driven.

## Adding a New Parameter

1. Add an entry to `js/data/parameters.js` — include `id`, `label`, `description`, `type` (`range` or `select`), `range`/`options`, `default`, `step`, `sensorMinGeneration`.
2. Add the parameter ID and default value to the `state.params` object in `js/app.js`.
3. Implement the CSS delta in `js/utils/buildFilter.js`.

## Agent Task Areas

See `.agents/skills/` for detailed skill files covering:
- `ui-components` — building and styling HTML/CSS UI elements, including the framed preview, theme system, and export button
- `color-science` — CSS filter math and film simulation approximation
- `data-modeling` — JS data structures, film sim data, sensor generation data
- `recipe-management` — localStorage save/load/export logic and canvas-based recipe card export
