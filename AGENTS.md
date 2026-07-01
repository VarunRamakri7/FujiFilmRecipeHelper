# FujiFilm Recipe Helper — Agent Guidance

## Project Overview

A web-based tool for Fujifilm X-series camera users to build, preview, and manage film simulation recipes. The UI has a retro-analog aesthetic. v1 targets the recipe builder (film sim selector + parameter controls + live photo preview) and local recipe saving — no backend, no accounts, no community features.

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework, no build step; open `index.html` directly in a browser
- **CSS custom properties** — retro palette and design tokens defined in `css/variables.css`
- **ES Modules** — JS files use `type="module"`; no bundler required
- **localStorage** — recipe persistence; no backend in v1

## Repo Layout

```
index.html        # single page entry point
css/              # variables.css (tokens) + styles.css (all styles)
js/
  app.js          # main entry
  data/           # filmSimulations.js, parameters.js, sensorGenerations.js
  utils/          # buildFilter.js, recipes.js, exportCard.js
  components/     # comparisonSlider.js, tooltip.js, sensorSelector.js
assets/photos/    # CC-licensed stock photos (portrait, landscape, street)
.agents/skills/   # per-task skill definitions
```

## Domain Knowledge

### Film Simulations
Each simulation is defined in `js/data/filmSimulations.js`. Every entry includes:
- `id`, `name`, `description`, `inspiredBy` (analog film reference)
- `sensorMinGeneration` — the earliest X-Trans generation that supports it
- `baselineCssFilter` — a baseline CSS filter string approximating the look
- `characteristics` — plain-English color rendering notes used for tooltips

### Parameters
All adjustable parameters live in `js/data/parameters.js`. Each has:
- `id`, `label`, `range` (`[min, max]`), `default`, `step`
- `description` — plain-English tooltip copy explaining what the parameter does
- `sensorMinGeneration` — sensor generation gate (if applicable, e.g., Clarity is X-Trans V only)

### Sensor Generations
Defined in `js/data/sensorGenerations.js`:
- X-Trans I through X-Trans V
- Each entry lists representative camera models (e.g., X-T20, X-T30 under X-Trans III/IV)
- Used to gate film sim and parameter availability in the UI

## Key Conventions

- **No pixel-perfect simulation** — the CSS filter preview is directionally accurate, not hardware-identical. The disclaimer shown in the UI reflects this.
- **Progressive disclosure** — every parameter has a tooltip; complex parameters have a "learn more" expansion.
- **Responsive layout** — collapses to 2-col at ≤ 1100px and 1-col at ≤ 760px; preview photo appears first on small screens. `.panel-preview` uses `display: contents` so its children can be individually ordered in the grid.
- **Framed preview** — the photo sits inside a padded mat frame (`--preview-pad: 20px`, `object-fit: contain`) with a solid `--preview-bg` background. The comparison slider's drag tracking is relative to `.comparison-overlay` (not `.photo-figure`) to match the inset image area.
- **Theme system** — `data-theme="dark|light"` on `<html>` drives all theming via CSS custom properties. Theme persists to `localStorage`. Never hard-code light/dark color values in `styles.css`.
- **Custom photo** — the Custom tab in the photo picker accepts user-uploaded images via `URL.createObjectURL`. The blob URL persists for the session; the figure's `aspect-ratio` is updated to match the uploaded image's natural dimensions.
- **Recipe card export** — `js/utils/exportCard.js` renders a PNG recipe card via the Canvas API (no external libs). Theme-aware: reads `data-theme` at call time and applies matching palette.
- **Accessibility** — all interactive controls have ARIA labels; sliders are keyboard-navigable.

## Agent Task Areas

See `.agents/skills/` for detailed skill files covering:
- `ui-components` — building and styling HTML/CSS UI elements, including the framed preview, theme system, and export button
- `color-science` — CSS filter math and film simulation approximation
- `data-modeling` — JS data structures, film sim data, sensor generation data
- `recipe-management` — localStorage save/load/export logic and canvas-based recipe card export
