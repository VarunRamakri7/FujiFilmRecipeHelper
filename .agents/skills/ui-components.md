# Skill: UI Components

## Purpose
Build and maintain the HTML/CSS UI elements for the recipe builder interface. All styles live in `css/styles.css`; interactive behaviour in `js/components/`.

## Design Language
- **Aesthetic**: Retro-analog meets modern web. Think camera LCD panels, film strip borders, aged cream/ivory backgrounds, deep warm blacks.
- **Palette** (CSS custom properties in `css/variables.css`):
  - Background: `--fuji-black` (#1a1714), `--fuji-dark` (#2a2520)
  - Surface: `--fuji-cream` (#f5f0e8), `--fuji-ivory` (#ede8dc)
  - Accent: `--fuji-orange` (#d4622a), `--fuji-silver` (#9ba3a8)
  - Text: `--fuji-cream`, `--fuji-warm-grey`, `--fuji-muted`
- **Typography**: Display font (condensed, vintage) for headings; clean sans-serif for body/controls
- **Controls**: Dials and sliders styled to evoke camera hardware; avoid generic unstyled browser inputs

## Module Inventory

| Module | File | Responsibility |
|---|---|---|
| Comparison Slider | `js/components/comparisonSlider.js` | Draggable before/after divider on the preview photo |
| Tooltip | `js/components/tooltip.js` | Hover tooltip positioning and show/hide logic |
| Sensor Selector | `js/components/sensorSelector.js` | First-load modal + header button for sensor generation |
| App wiring | `js/app.js` | Renders film sim cards, parameter sliders, photo picker, recipe save/load UI |

All other UI is static HTML in `index.html` styled via `css/styles.css`.

## Key Patterns

### Tooltips
- Triggered on `mouseover`/`mouseout` and `focusin`/`focusout` (for keyboard users)
- Positioned above the control by default; flip to below near the viewport edge
- Content stored in a `data-tooltip` attribute on the trigger element
- Single shared `.tooltip` element appended to `<body>` on init
- **Important**: the height measurement pass uses `visibility: hidden` + `top: -9999px` — do NOT use `opacity: 0` as an inline style, as it overrides the `.is-visible { opacity: 1 }` CSS rule and keeps the tooltip permanently hidden

### Comparison Slider
- `.comparison-overlay` is `position: absolute; inset: 0; z-index: 2` over `.photo-figure`
- `.photo-before` (unfiltered, z-index 1) is clipped via `clip-path: inset(0 X% 0 0)`
- `.photo-after` (filtered, z-index 0) fills the full figure underneath
- Handle position and clip-path are driven by `initComparisonSlider()` in JS
- Initialized lazily — only on the first time `#toggle-comparison` is checked
- Toggled by `#toggle-comparison` checkbox in `.preview-footer`

### Custom Photo Upload
- The photo picker has four tabs: Landscape, Architecture, Color, Custom
- **Custom tab behaviour**:
  - If no custom image has been uploaded: shows `.custom-upload-prompt` — a centered dashed "Upload Image" button over the dark figure background. Does NOT open the file picker immediately.
  - If a custom image exists: shows it directly without prompting.
  - Clicking the "Upload Image" button (or the reupload button in the footer) triggers `#custom-photo-input` (hidden `<input type="file" accept="image/*">`).
- On file selection, `URL.createObjectURL()` creates a local blob URL; the previous blob URL is revoked to avoid memory leaks. The figure's `aspect-ratio` is updated to match the image's natural dimensions.
- A `#btn-reupload` button in `.preview-footer` is shown only when `state.photo === 'custom'` AND a blob URL exists. Because `.btn` sets `display: inline-flex`, the `[hidden]` attribute alone is not enough — `.btn-reupload[hidden] { display: none }` must be explicitly set in CSS.
- Switching back to any stock tab restores `aspect-ratio: 3/2` and hides the reupload button.

### Sensor Gating
- Each film sim card and parameter row has a `data-sensor-min` attribute
- `app.js` adds `.is-gated` to ineligible elements via `isSupported()` from `sensorSelector.js`
- `.is-gated` items render at 35% opacity with `pointer-events: none`; their tooltip is overridden with "Not available on your sensor"

### Film Sim Cards
- Rendered as `<button role="radio">` elements inside a `<div role="radiogroup">`
- Clicking a card sets it as `aria-checked="true"` and triggers a filter recompose

### Parameter Sliders
- Native `<input type="range">` elements, fully styled via CSS
- Tick labels below each slider: min and max are left/right anchors; the "0" label is absolutely positioned using `--zero-pct` (a 0–1 fraction) and `calc(var(--zero-pct) * (100% - 16px) + 8px)` to account for the 8px thumb half-width inset — this correctly places "0" on asymmetric ranges like `[–2, +4]`
- On `input` event, calls `buildFilter()` and updates the preview image's `style.filter`

### Responsive Layout
- **≤ 900px**: Single column. `.panel-preview` is set to `display: contents` so its children (`.preview-area`, `.recipe-save`) become direct grid items. CSS `order` places `.preview-area` first (order: -2), then `.panel-controls` (order: -1), then `.recipe-save` (order: 1).
- **≤ 600px**: Tighter spacing, 4-column film sim grid, narrower filmstrip rails (12px).
- **≤ 390px**: Compact header, 3-column film sim grid.

## Accessibility Checklist
- All range inputs: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`
- Comparison slider divider: keyboard arrow key support (move divider left/right; Shift+arrow = 10% jumps)
- Film sim cards: `role="radio"` within a `role="radiogroup"`
- Tooltips: `role="tooltip"`, linked via `aria-describedby`
- Sensor selector modal: focus trap while open, `aria-modal="true"`
- Custom upload input: `aria-label="Upload a custom photo"`
