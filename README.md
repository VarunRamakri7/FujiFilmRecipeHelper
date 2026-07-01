# Fuji Recipe Helper

A web-based tool for Fujifilm X-series photographers to build, preview, and save film simulation recipes — no account, no install, no build required.

## What it does

- **Recipe builder** — pick a film simulation, dial in parameters (Highlight Tone, Shadow Tone, Color, Grain, Clarity, and more), and see a live approximate preview
- **Before/after comparison** — toggle a draggable slider to reveal the original photo alongside the filtered result
- **Sensor-aware** — select your X-Trans generation and the UI automatically shows only the film sims and parameters your camera supports
- **Local recipe saving** — name and save recipes to your browser; export any recipe as a `.json` file

## Usage

Open `index.html` in any modern browser. No server, no dependencies, no installation.

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

- The photo preview is an approximation, actual in-camera results will differ.
- Recipe storage uses `localStorage` — clearing browser data will remove saved recipes. Export important recipes as JSON.
- Bayer-sensor cameras (X-A series) are not currently supported.

## Tech stack

Vanilla HTML, CSS, and JavaScript. No frameworks, no build tools.
