# Simulation Engine

## Overview

The preview is entirely CSS-based. When a user selects a film simulation or adjusts a parameter, `buildFilter()` in `js/utils/buildFilter.js` composes a single CSS `filter` string and applies it to the preview `<img>` element via `style.filter`. No pixel data is read or written — the browser's compositor handles all rendering.

This means the simulation runs at 60fps with zero image decoding overhead, works on any device, and requires no server. It also means it is a visual approximation, not a color-accurate reproduction.

---

## How a Simulation is Built

### Step 1 — Baseline filter

Each film simulation in `js/data/filmSimulations.js` defines a `baselineCssFilter` string:

```
PROVIA:   saturate(1.05) contrast(1.0) brightness(1.0)
Velvia:   saturate(1.45) contrast(1.15) brightness(0.97)
Classic Chrome: saturate(0.75) contrast(1.05) sepia(0.12) brightness(1.02)
Eterna:   saturate(0.7) contrast(0.88) brightness(1.04) sepia(0.05)
Classic Neg: saturate(0.8) contrast(1.12) brightness(0.98) hue-rotate(3deg)
```

These are hand-tuned values chosen to approximate the visual character of each simulation — its relative saturation level, contrast curve, and any dominant color cast.

### Step 2 — Parameter deltas

`buildFilter()` parses the baseline into a Map of `{ functionName → value }`, then accumulates per-parameter deltas on top:

| Parameter | CSS function affected | Delta per step |
|---|---|---|
| Highlight Tone | `brightness` | ±0.04 |
| Shadow Tone | `contrast` | ±0.03 |
| Color | `saturate` | ±0.08 |
| Color Chrome Effect | `saturate` | +0.06 per level (Off/Weak/Strong) |
| Color Chrome FX Blue | `hue-rotate` + `saturate` | –3deg / –0.04 per level |
| Clarity | `contrast` | ±0.02 |
| Grain Effect + Grain Size | SVG `<filter>` reference | Appended as `url(#grain-…)` |
| Sharpness | — | Not implemented |
| Noise Reduction | — | Not implemented |

The Map approach prevents double-application: if both Shadow Tone and Clarity both affect `contrast`, their deltas are summed into a single `contrast(x)` call in the final string.

### Step 3 — Grain

Grain is handled separately as a pre-built SVG `<filter>` defined in `index.html`. Four variants cover the Size × Roughness combinations (`grain-small-weak`, `grain-small-strong`, `grain-large-weak`, `grain-large-strong`). When Grain Effect is not Off, the matching filter ID is appended to the CSS filter string as `url(#grain-…)`.

The SVG filters use `feTurbulence` (fractalNoise) blended over the image with `feBlend mode="overlay"`, which produces a static grain pattern. It does not animate per-frame the way real film grain would.

### Step 4 — Output

The full composed string is assigned directly:

```js
photoAfter.style.filter = buildFilter(sim, params);
```

The `photoBefore` element (used by the comparison slider) always has no filter applied — it always shows the unmodified source image.

---

## B&W and Toned Simulations

Monochrome and ACROS use `grayscale(1.0)` as their base. The ACROS color filter variants (Ye/R/G) approximate darkroom contrast filters with tuned `contrast` and a faint `sepia` tint to shift tonal response:

| Simulation | Approximation |
|---|---|
| ACROS+Ye | `sepia(0.05)` — slight warm tint, sky/cloud contrast via `contrast(1.1)` |
| ACROS+R | `sepia(0.04)` + `contrast(1.2)` — strong sky darkening |
| ACROS+G | `sepia(0.02)` + `contrast(1.05)` — subtle foliage brightening |

In reality, color filters work by selectively blocking or passing specific wavelengths before the photosensitive layer responds. CSS has no per-channel luminance mapping, so these are perceptual stand-ins, not physical simulations.

Sepia uses `sepia(0.9)` as its base. Eterna Bleach Bypass blends `grayscale(0.15)` into a low-saturation base to approximate the retained silver-halide metallic character.

---

## Drawbacks

### No per-channel color grading
CSS `filter` operates on the entire image uniformly. Real Fujifilm simulations use per-channel tone curves — separate response curves for R, G, and B across the tonal range. This means Classic Chrome's characteristic "warm highlights, cool shadows" cannot be reproduced: CSS cannot lift shadows in one direction while pulling highlights in another within the same channel.

### No hue-specific targeting
Color Chrome Effect in-camera deepens saturation only in already-saturated areas (reds, oranges, greens) without touching muted tones. CSS `saturate` applies uniformly to every pixel. The effect is globally present but lacks the selective quality of the real feature.

Similarly, Color Chrome FX Blue is approximated as a uniform `hue-rotate` shift, whereas the real feature targets blue channel response specifically.

### Highlight and shadow tone are conflated
`brightness` and `contrast` are blunt tools. Highlight Tone in-camera adjusts only the upper portion of the tone curve; Shadow Tone adjusts only the lower portion. Because CSS has no tone-range-aware operations, both parameters affect the full tonal range — changing Shadow Tone will also subtly affect midtones and highlights.

### Grain is static and global
The SVG `feTurbulence` grain is re-rendered each time the filter changes but is not per-frame randomized. Real film grain varies on every frame and across every print. The SVG approximation also applies grain uniformly, whereas real film grain is denser in midtones and shadows and falls off in highlights.

### Sharpness and Noise Reduction have no equivalent
There is no CSS filter function for unsharp masking or spatial frequency reduction. These two parameters are parsed and stored in state but produce no visual output. They are displayed in the UI so users can include them in exported recipes, but their effect is invisible in the preview.

### Source image dependency
All simulations are applied on top of the same source JPEG, which is already compressed and has its own color profile and white balance baked in. In-camera, simulations are applied to raw sensor data before any JPEG compression — a far wider dynamic range and neutral color space. The preview will look more dramatic on some images than others, and subtle simulations (PROVIA, Reala Ace, PRO Neg Std) can appear nearly identical on the stock photos.

### White balance is not modeled
The app has no white balance control. In-camera, white balance interacts significantly with film simulation output — particularly with Classic Chrome, Nostalgic Neg, and Eterna, which are commonly used with warmer WB shifts. The preview always assumes a neutral white balance.

---

## Next Steps

### Short-term (approximation improvements within CSS)

- **Simulate per-channel response with SVG `feColorMatrix`** — SVG color matrix filters can apply independent multipliers to R, G, B channels and allow cross-channel mixing. Wrapping the preview in an SVG `<feImage>` + `<feColorMatrix>` pipeline would allow lifted shadows with different per-channel weights, enabling warm-shadow/cool-highlight rendering for simulations like Classic Chrome and Nostalgic Neg.

- **Grain animation** — cycling the SVG `feTurbulence` `seed` attribute on a slow interval (or on parameter change) would make grain feel less static without impacting performance.

- **Expose White Balance as a parameter** — a WB slider mapping to `hue-rotate` + `brightness` delta would meaningfully change how cinematic simulations render and is a parameter photographers genuinely dial in.

- **Sharpness via CSS `filter: blur()` inversion** — negative sharpness could be approximated with a very low `blur(0.3px)` to give the soft rendering some visible effect, even if true USM is not possible.

### Medium-term (architectural changes)

- **Canvas-based rendering pipeline** — moving from `style.filter` to a `<canvas>` draw pipeline would unlock per-pixel operations: per-channel tone curves, luminosity-masked saturation, and highlight/shadow range-aware adjustments. This would bring the approximation substantially closer to real Fujifilm output at the cost of rendering latency and implementation complexity.

- **LUT (Look-Up Table) support** — 3D LUTs (`.cube` format) are the industry standard for film simulation in post-production tools. Loading a LUT and applying it on canvas via a texture lookup would allow the preview to match community-produced reference LUTs directly, making it far more accurate for simulations that have published LUTs.

- **WebGL rendering** — a WebGL shader pipeline could apply 3D LUTs in real time at full resolution with no perceptible latency, and would enable per-channel curve operations, grain synthesis per-frame, and HDR-aware tone mapping.

### Long-term

- **RAW file input** — accepting `.RAF` (Fujifilm RAW) input and decoding it in-browser via WebAssembly (e.g. LibRaw compiled to WASM) would allow simulation on actual unprocessed sensor data, removing the source JPEG limitation entirely. This is the approach that would produce preview fidelity closest to in-camera output.
