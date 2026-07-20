/**
 * Composes a CSS filter string from a film simulation's baseline + parameter deltas.
 *
 * Parameter → CSS delta mapping (per step unless noted):
 *   highlightTone    brightness ±0.04
 *   shadowTone       contrast   ±0.03
 *   color            saturate   ±0.08
 *   colorChromeEffect  saturate ±0.06 (Off/Weak/Strong → 0/+1/+2 steps, always positive deepening)
 *   colorChromeBlue    hue-rotate –3deg + saturate –0.04 per step (Off/Weak/Strong → 0/1/2 steps)
 *   clarity          contrast   ±0.02
 *   grainRoughness   SVG filter ref (Off → none, Weak → grain-weak, Strong → grain-strong)
 *   grainSize        adjusts baseFrequency via separate SVG filters (Small/Large)
 *   sharpness/noiseReduction  no CSS equivalent — skipped
 */
export function buildFilter(filmSim, params) {
  const baseline = filmSim.baselineCssFilter ?? '';

  // Parse the baseline into a map of { functionName: numericArg | rawArg }
  // so we can accumulate deltas without double-applying functions
  const parsed = parseFilter(baseline);

  // ── Highlight Tone → brightness ±0.04 per step ─────────────────────────
  delta(parsed, 'brightness', 1.0, params.highlightTone * 0.04);

  // ── Shadow Tone → contrast ±0.03 per step ──────────────────────────────
  delta(parsed, 'contrast', 1.0, params.shadowTone * 0.03);

  // ── Color (global saturation) → saturate ±0.08 per step ────────────────
  delta(parsed, 'saturate', 1.0, params.color * 0.08);

  // ── Color Chrome Effect → saturate +0.06 per level (Off=0, Weak=1, Strong=2) ─
  const cceLevel = { Off: 0, Weak: 1, Strong: 2 }[params.colorChromeEffect] ?? 0;
  delta(parsed, 'saturate', 1.0, cceLevel * 0.06);

  // ── Color Chrome FX Blue → hue-rotate –3deg + saturate –0.04 per level ─
  const ccbLevel = { Off: 0, Weak: 1, Strong: 2 }[params.colorChromeBlue] ?? 0;
  if (ccbLevel > 0) {
    delta(parsed, 'hue-rotate', 0, -(ccbLevel * 3)); // stored in degrees
    delta(parsed, 'saturate', 1.0, -(ccbLevel * 0.04));
  }

  // ── Clarity → contrast ±0.02 per step ──────────────────────────────────
  delta(parsed, 'contrast', 1.0, params.clarity * 0.02);

  // ── Build the filter string ─────────────────────────────────────────────
  const parts = [];
  for (const [fn, val] of parsed.entries()) {
    if (fn === 'hue-rotate') {
      parts.push(`hue-rotate(${val.toFixed(1)}deg)`);
    } else if (fn === 'grayscale' || fn === 'sepia') {
      // grayscale/sepia: keep raw — parameters don't touch these
      parts.push(`${fn}(${val})`);
    } else {
      parts.push(`${fn}(${val.toFixed(3)})`);
    }
  }

  // ── Grain → SVG filter appended after CSS filters ──────────────────────
  if (params.grainRoughness !== 'Off') {
    const size      = params.grainSize === 'Large' ? 'large' : 'small';
    const roughness = params.grainRoughness === 'Strong' ? 'strong' : 'weak';
    parts.push(`url(#grain-${size}-${roughness})`);
  }

  return parts.join(' ');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a CSS filter string like "saturate(1.2) contrast(1.05) sepia(0.1)"
 * into an ordered Map of { functionName → numericValue }.
 * For hue-rotate the value is the raw number in degrees.
 */
function parseFilter(filterStr) {
  const map = new Map();
  if (!filterStr) return map;
  const re = /([\w-]+)\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(filterStr)) !== null) {
    map.set(m[1], parseFloat(m[2]));
  }
  return map;
}

/**
 * Add `amount` to a filter function's current value.
 * If the function isn't in the map yet, start from `defaultVal`.
 */
function delta(map, fn, defaultVal, amount) {
  if (amount === 0) return;
  const current = map.has(fn) ? map.get(fn) : defaultVal;
  map.set(fn, current + amount);
}
