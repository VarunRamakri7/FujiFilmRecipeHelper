# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two equally-served audiences:

1. **Newcomers** — photographers who recently acquired a Fujifilm X-series camera and want to understand what each film simulation does and how parameters shape the look before committing to shots in the field.
2. **Experienced shooters** — Fuji users who already know the simulations and come to dial in precise recipe values, save settings they've landed on, and export them for reference or sharing.

Both audiences use the tool in a similar situation: sitting with their camera (or just their curiosity), browsing what's possible before or after a shoot.

## Product Purpose

Fuji Recipe Helper is a browser-based film simulation lab. It lets photographers build, preview, and save Fujifilm X-series recipes without an account, an install, or a camera in hand. Every parameter change is reflected live on the preview photo via a real-time CSS filter pipeline. The tool doubles as a learning environment: by experimenting with simulations and parameters side by side, photographers develop an intuition for what each setting does and why — not just a number to memorize.

## Positioning

The tool's meaningful difference is *learning through live experimentation*. Unlike reference sites (Fuji X Weekly, SOOC) that present recipes as static lists, or in-camera menus where the feedback loop is slow and contextless, this tool makes the consequence of every adjustment immediately visible. You do not need to remember what "Shadow Tone –2" means — you can see it.

## Operating Context

- Used on desktop or mobile before or after a shoot, usually not while actively shooting
- Photographers cross-reference with in-camera menus; the app uses Fujifilm's own parameter names and terminology throughout
- Recipes are exported as JSON for safekeeping or PNG cards for sharing on social media / printing
- `localStorage` is the persistence layer — no server, no sync; users who care about their recipes must export them

## Capabilities and Constraints

- **Simulation engine:** CSS `filter`-based approximation applied to JPEG source images; not color-accurate, explicitly described as an approximation throughout
- **Parameters supported:** Highlight Tone, Shadow Tone, Color, Sharpness (display only), Noise Reduction (display only), Grain Effect (Size + Roughness), Color Chrome Effect, Color Chrome FX Blue, Clarity
- **Sensor gating:** Film simulations and parameters are gated by X-Trans generation (I–V); the UI disables unsupported options for the selected sensor
- **Bayer sensor cameras (X-A series):** not supported
- **No server, no build tools:** vanilla HTML/CSS/ES Modules only; no framework, no bundler, no account system
- **White balance:** not modeled in the preview
- **Sharpness / Noise Reduction:** stored in recipe state and exported in recipes, but have no visual effect in the preview (CSS has no equivalent)

## Brand Commitments

- **Name:** Fuji Recipe Helper (also displayed as "fujirecipehelper.com" in prose)
- **Voice:** Premium and editorial — photography-magazine aesthetic; measured, confident, high craft. Uses Fujifilm's own terminology without hedging or over-explaining. Does not apologize for the tool's approximation limitations; states them once, plainly, and moves on.
- **Visual direction (incumbent):** Dark-primary UI with `--fuji-orange` (#d4622a) as the single accent; `Bebas Neue` display face, `Inter` body, `Space Mono` for data/mono. Heavy use of glass-panel layering and a near-black filmstrip mat frame around the preview.

## Evidence on Hand

- `assets/photos/`: four stock subjects — wildlife (fox), color, and people — chosen to stress-test tonal response across simulation types
- `js/data/filmSimulations.js`: 18 simulation definitions with descriptions, `inspiredBy` references, and color rendering characterizations
- `SIMULATION_ENGINE.md`: detailed technical write-up of the CSS filter approach, its known limitations, and a roadmap for higher-fidelity alternatives
- No user testimonials, benchmark data, press coverage, or third-party performance data currently exist; do not fabricate them

## Product Principles

1. **The preview is the product.** Every interaction — selecting a sim, moving a slider — should produce an immediate, visible result. Latency or abstraction between action and outcome breaks the learning loop.
2. **Respect the craft vocabulary.** Use Fujifilm's own names and scales. Photographers learn on real cameras; the tool should reinforce that mental model, not introduce a parallel one.
3. **Zero friction, zero footprint.** No sign-up, no install, no server dependency. The tool should open and be useful in under five seconds on any modern browser.
4. **Honest about limits.** The approximation caveat is stated once, clearly. It does not need to appear on every screen or in every tooltip.
5. **Export is a first-class output.** A recipe that cannot leave the browser is a dead end. JSON export, card export, and clipboard copy are all supported; they should be discoverable at the moment the user wants them.

## Accessibility & Inclusion

No specific accessibility requirement has been established beyond browser defaults. The UI uses semantic HTML, ARIA labels on interactive elements, and keyboard-navigable bottom sheets. Reduced motion is not yet explicitly handled — undecided.
