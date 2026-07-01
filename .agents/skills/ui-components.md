# Skill: UI Components

## Purpose
Build and maintain the HTML/CSS UI elements for the recipe builder interface. All styles live in `css/styles.css`; interactive behaviour in `js/components/`.

## Design Language
- **Aesthetic**: Retro-analog meets modern web. Think camera LCD panels, film strip borders, aged cream/ivory backgrounds, deep warm blacks.
- **Palette** (CSS custom properties in `css/variables.css`):
  - Background: `--fuji-black` (#1a1714), `--fuji-dark` (#2a2520)
  - Surface: `--fuji-cream` (#f5f0e8), `--fuji-ivory` (#ede8dc)
  - Accent: `--fuji-orange` (#d4622a), `--fuji-silver` (#9ba3a8)
  - Text: `--fuji-ink` (#1a1714), `--fuji-muted` (#6b6560)
- **Typography**: Display font (condensed, vintage) for headings; clean sans-serif for body/controls
- **Controls**: Dials and sliders styled to evoke camera hardware; avoid generic unstyled browser inputs

## Module Inventory

| Module | File | Responsibility |
|---|---|---|
| Comparison Slider | `js/components/comparisonSlider.js` | Draggable before/after divider on the preview photo |
| Tooltip | `js/components/tooltip.js` | Hover tooltip positioning and show/hide logic |
| Sensor Selector | `js/components/sensorSelector.js` | First-load modal + header button for sensor generation |
| App wiring | `js/app.js` | Renders film sim cards, parameter sliders, recipe save/load UI |

All other UI is static HTML in `index.html` styled via `css/styles.css`.

## Key Patterns

### Tooltips
- Triggered on `mouseenter`/`mouseleave` and `focus`/`blur` (for keyboard users)
- Positioned above the control by default; flip to below near the viewport edge
- Content stored in a `data-tooltip` attribute on the trigger element
- `tooltip.js` queries all `[data-tooltip]` elements on init and wires the events

### Comparison Slider
- An absolutely-positioned `<div class="comparison-divider">` overlaid on the preview `<figure>`
- Draggable via `mousedown`/`mousemove`/`mouseup` and equivalent touch events
- Position stored as a CSS custom property `--divider-pct` (0–100) on the figure element
- Toggled by a `<button>` below the photo; hidden (`display: none`) by default

### Sensor Gating
- Each film sim card and parameter row has a `data-sensor-min` attribute
- `app.js` reads the active sensor from localStorage and adds `.gated` to ineligible elements
- `.gated` items render visually dimmed; their tooltip is overridden with "Not available on your sensor"

### Film Sim Cards
- Rendered as `<button role="radio">` elements inside a `<div role="radiogroup">`
- Clicking a card sets it as `aria-checked="true"` and triggers a filter recompose

### Parameter Sliders
- Native `<input type="range">` elements, fully styled via CSS
- Each wrapped in a `<label>` with a `[data-tooltip]` info icon
- On `input` event, calls `buildFilter()` and updates the preview image's `style.filter`

## Accessibility Checklist
- All range inputs: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`
- Comparison slider divider: keyboard arrow key support (move divider left/right)
- Film sim cards: `role="radio"` within a `role="radiogroup"`
- Tooltips: `role="tooltip"`, linked via `aria-describedby`
- Sensor selector modal: focus trap while open, `aria-modal="true"`
