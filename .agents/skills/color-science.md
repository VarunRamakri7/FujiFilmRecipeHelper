# Skill: Color Science & CSS Filter Simulation

## Purpose
Translate Fujifilm film simulation characteristics and parameter adjustments into CSS filter strings applied to the preview photo. This is an *approximation*, not hardware-identical processing.

## How the Preview Works

1. The user selects a film sim — a **baseline CSS filter** is loaded from `js/data/filmSimulations.js`
2. The user adjusts parameters — **delta filters** are computed and merged on top
3. The final composed filter string is applied via `previewImg.style.filter = ...`
4. The "before" half of the comparison slider renders the raw image with no filter

## CSS Filter Primitives Available

| CSS Function | Controls |
|---|---|
| `brightness(n)` | Overall exposure (1 = neutral) |
| `contrast(n)` | Tonal contrast (1 = neutral) |
| `saturate(n)` | Color saturation (1 = neutral) |
| `hue-rotate(deg)` | Global hue shift |
| `sepia(n)` | Warm/brown tone wash (0–1) |
| `grayscale(n)` | Desaturation toward B&W (0–1) |
| `invert(n)` | Inversion (used at low values for lifted blacks) |

SVG-based `feColorMatrix` is available for per-channel work but should only be used if CSS primitives are insufficient.

## Film Simulation Baseline Filters

Each simulation is an object `{ filter, description, inspiredBy }` in `js/data/filmSimulations.js`.

The following characteristics are sourced from Fujifilm's official product pages (X-T5, X100VI, GFX100S) — all verified:

| Simulation | Modeled After | Color Rendering | Baseline Filter Approach |
|---|---|---|---|
| **PROVIA/Standard** | Fujifilm PROVIA positive film | Neutral, balanced. Standard starting point. | `saturate(1.05) contrast(1.0) brightness(1.0)` |
| **Velvia/Vivid** | Fujifilm Velvia reversal film | Hyper-saturated, punchy contrast. Vivid greens and reds. | `saturate(1.45) contrast(1.15) brightness(0.97)` |
| **ASTIA/Soft** | FUJICHROME ASTIA reversal (portrait film) | Soft, faithful skin tones. Vivid blue skies and greenery. Reduced contrast. | `saturate(0.95) contrast(0.92) brightness(1.02) sepia(0.05)` |
| **Classic Chrome** | Documentary magazine film (20th century) | Low saturation, hard tonal gradation in shadows. Cool, muted, lifted. | `saturate(0.75) contrast(1.05) sepia(0.12) brightness(1.02)` |
| **PRO Neg Hi** | Fujifilm color negative (professional portrait) | Medium-high contrast, slightly muted. Neutral skin rendering. | `saturate(0.9) contrast(1.08) brightness(0.99)` |
| **PRO Neg Std** | Fujifilm color negative (professional standard) | Low-medium contrast, muted, cooler than ASTIA. | `saturate(0.85) contrast(0.94) brightness(1.01)` |
| **Classic Neg** | Fujifilm SUPERIA color negative | High contrast, reduced saturation. Adjusts hues in highlights and shadows. | `saturate(0.8) contrast(1.12) brightness(0.98) hue-rotate(3deg)` |
| **Nostalgic Neg** | Classic color negative (vintage aesthetic) | Warm shadows, faded oranges, subdued greens. Retro feel. | `saturate(0.85) contrast(0.95) sepia(0.15) brightness(1.03) hue-rotate(5deg)` |
| **ETERNA/Cinema** | Fujifilm ETERNA motion picture negative | Minimized saturation (no color dominates). Extremely soft highlight gradation. Deep shadows — prevents clipping. | `saturate(0.7) contrast(0.88) brightness(1.04) sepia(0.05)` |
| **ETERNA Bleach Bypass** | Bleach bypass chemical process on ETERNA | Reduced saturation (~–40%), high contrast. Silver-halide desaturated look. | `saturate(0.58) contrast(1.18) brightness(0.97) grayscale(0.15)` |
| **ACROS** | Fujifilm ACROS black-and-white film | Near-grayscale. Fine grain, smooth tones. Variants: +Ye filter (boosts sky/skin contrast), +R filter (dramatic sky), +G filter (smooth skin). | `grayscale(1.0) contrast(1.08) brightness(0.99)` (base) |
| **Reala Ace** | Fujifilm REALA ACE color negative (20th simulation) | Faithful color reproduction, hard tonality. Closest to natural rendering. Suitable for all subjects. | `saturate(1.0) contrast(1.02) brightness(1.0) sepia(0.02)` |

> Note: Provia/Standard is named after a real Fujifilm slide film. Claims that it was designed for non-film-background users (rather than as a film recreation) were adversarially refuted — treat it as a genuine film-based simulation.

## Parameter → Filter Delta Mapping

Each parameter adjustment modifies a CSS property by a delta per step:

| Parameter | Range | CSS Property | Delta per Step |
|---|---|---|---|
| Highlight Tone | –2 to +4 | `brightness` | ±0.04 |
| Shadow Tone | –2 to +4 | `contrast` (inverse curve) | ±0.03 |
| Color | –4 to +4 | `saturate` | ±0.08 |
| Sharpness | –4 to +4 | (no CSS equivalent — skip or use `contrast` ±0.01 as proxy) |
| Noise Reduction | –4 to +4 | (no CSS equivalent — no-op in preview) |
| Grain Effect Roughness | Off/Weak/Strong | SVG filter: `url(#grain-off)` / `url(#grain-weak)` / `url(#grain-strong)` |
| Grain Effect Size | Small/Large | Adjusts `baseFrequency` of grain SVG filter |
| Color Chrome Effect | Off/Weak/Strong | `saturate` ±0.06 per step (deepens vivid color gradation) |
| Color Chrome Effect Blue | Off/Weak/Strong | `hue-rotate` –3deg + `saturate` –0.04 per step (targets blues specifically) |
| Clarity | –5 to +5 | `contrast` ±0.02 (mid-tone contrast proxy; Fujifilm calls it "definition") |

**Important corrections vs. earlier drafts:**
- Grain Effect has two sub-parameters: **Roughness** (Off/Weak/Strong) and **Size** (Small/Large) — NOT "Fine/Large"
- Color Chrome Effect has **three** levels (Off/Weak/Strong), not two — a "Weak/Strong only" claim was refuted
- Color Chrome Effect Blue has three levels (Off/Weak/Strong) and targets **blue tones specifically**, like a polarizing filter
- Clarity operates on mid-tone contrast with minimal highlight/shadow impact

## Composition Function

Located at `js/utils/buildFilter.js`, exported as a plain ES module function:

```js
// buildFilter(filmSim, params) => string
export function buildFilter(filmSim, params) { ... }
```

Takes the baseline filter string + each parameter value, merges deltas, returns a single composed CSS filter string. Clamps all values to safe ranges to avoid visual artifacts.

## Grain Overlay

Grain is rendered as SVG `<filter>` elements using `<feTurbulence>` + `<feColorMatrix>` defined inline in `index.html`, then referenced in the computed filter string:
- `url(#grain-weak)` / `url(#grain-strong)` for Roughness
- Small vs Large grain adjusts `baseFrequency` on the turbulence element

## Accuracy Disclaimer

The preview is directionally correct but not hardware-identical. Actual Fujifilm in-camera processing uses proprietary color matrices, tone curves, and lens correction that cannot be fully replicated in CSS. A compact disclaimer is shown near the photo preview in the UI.
