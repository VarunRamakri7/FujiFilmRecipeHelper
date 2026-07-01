# Skill: Data Modeling

## Purpose
Define and maintain the static JS data files that underpin film simulations, sensor generations, and recipe parameters. No TypeScript — plain ES module objects and arrays.

## File Locations

| File | Contents |
|---|---|
| `js/data/filmSimulations.js` | Array of all film simulation definitions |
| `js/data/parameters.js` | Array of all adjustable parameter definitions |
| `js/data/sensorGenerations.js` | Array of X-Trans sensor generations + camera models |

## Data Shapes

### Film Simulation (`js/data/filmSimulations.js`)

```js
{
  id: 'classic-chrome',          // kebab-case, used as identifier throughout
  name: 'Classic Chrome',
  shortName: 'CCHM',             // matches camera LCD display
  description: '2–3 sentences for the UI info panel',
  inspiredBy: 'Kodachrome slide film from the 1960s–70s',
  sensorMinGeneration: 'xtrans-ii',
  characteristics: {
    contrast: 'medium',          // 'low' | 'medium' | 'high'
    saturation: 'low',
    skinTones: 'Plain-English note on skin tone rendering',
    highlights: 'Plain-English note on highlight behaviour',
    shadows: 'Plain-English note on shadow behaviour',
  },
  baselineCssFilter: 'saturate(0.75) contrast(1.05) sepia(0.12) brightness(1.02)',
  accentColor: '#7a8a96',        // hex used for card accent in the UI
}
```

### Parameter (`js/data/parameters.js`)

```js
{
  id: 'highlightTone',
  label: 'Highlight Tone',
  description: 'Plain-English tooltip copy explaining what this parameter does',
  type: 'range',                 // 'range' | 'select'
  range: [-2, 4],                // only for type: 'range'
  step: 1,
  default: 0,
  options: null,                 // array of { value, label } for type: 'select', else null
  sensorMinGeneration: null,     // null = available on all generations
}
```

### Sensor Generation (`js/data/sensorGenerations.js`)

```js
{
  id: 'xtrans-iv',               // 'xtrans-i' | 'xtrans-ii' | 'xtrans-iii' | 'xtrans-iv' | 'xtrans-v'
  label: 'X-Trans IV',
  models: ['X-T3', 'X-T4', 'X-T30', 'X-T30 II', 'X-S10', 'X-E4', 'X-Pro3', 'X100V'],
  supportedSimIds: ['provia', 'velvia', 'astia', 'classic-chrome', 'acros',
                    'pro-neg-hi', 'pro-neg-std', 'eterna', 'classic-neg', 'eterna-bleach-bypass'],
}
```

## Sensor Generation Table

| ID | Label | Representative Models | Cumulative Film Sims Added |
|---|---|---|---|
| `xtrans-i` | X-Trans I | X-Pro1, X-E1, X-M1 | Provia, Velvia, Astia, Pro Neg Hi, Pro Neg Std |
| `xtrans-ii` | X-Trans II | X-T1, X-E2, X-E2S, X-T10, X-T20, X100T | + Classic Chrome, Acros |
| `xtrans-iii` | X-Trans III | X-T2, X-T20 II, X-Pro2, X-E3, X100F, X-H1 | + Acros color filters (R/G/Ye) |
| `xtrans-iv-old` | X-Trans IV (Early) | X-T3, X-T30 | + Eterna/Cinema only (no Classic Neg, no Bleach Bypass, no CCE Blue, no Clarity) |
| `xtrans-iv` | X-Trans IV | X-T4, X-T30 II, X-S10, X-E4, X-Pro3, X100V | + Classic Neg, Color Chrome Effect Blue, Clarity, updated Grain Size options |
| `xtrans-v` | X-Trans V | X-T5, X-H2, X-H2S, X-T50, X-S20, X100VI | + Nostalgic Neg, Reala Ace |

> **Important (verified):** X-Trans IV splits into two functional subgroups. The "Early" group (X-T3, X-T30) lacks Classic Neg, Eterna Bleach Bypass, Color Chrome Effect Blue, and Clarity. Within the full X-Trans IV group, Eterna Bleach Bypass is further restricted — available on X-T4 but NOT on X100V or X-Pro3 (unverified, treat with medium confidence). Bayer-sensor cameras (X-A series) are out of scope for v1.

## Parameter Table

| id | Label | Type | Range / Options | Default | Sensor Gate |
|---|---|---|---|---|---|
| `highlightTone` | Highlight Tone | range | –2 to +4 | 0 | none |
| `shadowTone` | Shadow Tone | range | –2 to +4 | 0 | none |
| `color` | Color | range | –4 to +4 | 0 | none |
| `sharpness` | Sharpness | range | –4 to +4 | 0 | none |
| `noiseReduction` | Noise Reduction | range | –4 to +4 | 0 | none |
| `grainEffect` | Grain Effect | select | Off, Weak, Strong | Off | none |
| `grainSize` | Grain Size | select | Small, Large | Small | xtrans-iv |
| `colorChromeEffect` | Color Chrome Effect | select | Off, Weak, Strong | Off | xtrans-iv |
| `colorChromeBlue` | Color Chrome Effect Blue | select | Off, Weak, Strong | Off | xtrans-iv |
| `clarity` | Clarity | range | –5 to +5 | 0 | xtrans-v |

## Conventions

- All data files use `export const` — plain arrays, never classes or mutable state.
- Generation ordering: `xtrans-i` = 0, `xtrans-ii` = 1, ..., `xtrans-v` = 4. Use a `GENERATION_ORDER` array in `sensorGenerations.js` to convert id → index for gating comparisons.
- Film sim IDs use kebab-case: `classic-chrome`, `pro-neg-hi`, `eterna-bleach-bypass`, etc.
