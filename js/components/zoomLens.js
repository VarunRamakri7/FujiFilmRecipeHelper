// Hover magnifier — shows a circular lens that follows the pointer over the image.
// In comparison mode it samples each half's own image source independently.

const LENS_R     = 88;   // lens radius in CSS px
const ZOOM       = 3;    // magnification factor
const SAMPLE_PX  = (LENS_R * 2) / ZOOM; // source region width/height in natural image px

let figure, afterImg, beforeImg, overlay;
let lens, lensCtx;
let active = false;

// ── Build the lens canvas ─────────────────────────────────────────────────
function createLens() {
  const c = document.createElement('canvas');
  c.className  = 'mag-lens';
  c.setAttribute('aria-hidden', 'true');
  figure.appendChild(c);
  return c;
}

function sizeLens() {
  const dpr    = window.devicePixelRatio || 1;
  const px     = LENS_R * 2;
  lens.width   = Math.round(px * dpr);
  lens.height  = Math.round(px * dpr);
  lens.style.width  = px + 'px';
  lens.style.height = px + 'px';
  lensCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Draw ──────────────────────────────────────────────────────────────────
function drawLens(pctX, pctY) {
  const D  = LENS_R * 2;
  const dpr = window.devicePixelRatio || 1;

  lensCtx.clearRect(0, 0, D, D);

  // Clip to circle
  lensCtx.save();
  lensCtx.beginPath();
  lensCtx.arc(LENS_R, LENS_R, LENS_R, 0, Math.PI * 2);
  lensCtx.clip();

  const isComparison = !overlay.hidden;

  if (isComparison) {
    // Determine which half the pointer is in
    const handle  = figure.querySelector('.divider-handle');
    const splitPct = handle ? parseFloat(handle.style.left || '50') / 100 : 0.5;
    const inBefore = pctX <= splitPct;
    const sourceImg = inBefore ? beforeImg : afterImg;
    drawSource(lensCtx, sourceImg, pctX, pctY);
  } else {
    drawSource(lensCtx, afterImg, pctX, pctY);
  }

  lensCtx.restore();

  // Border ring
  lensCtx.save();
  lensCtx.beginPath();
  lensCtx.arc(LENS_R, LENS_R, LENS_R - 1, 0, Math.PI * 2);
  lensCtx.strokeStyle = 'rgba(255,255,255,0.85)';
  lensCtx.lineWidth   = 1.5;
  lensCtx.stroke();
  // Outer shadow ring (drawn on top for depth)
  lensCtx.beginPath();
  lensCtx.arc(LENS_R, LENS_R, LENS_R - 0.5, 0, Math.PI * 2);
  lensCtx.strokeStyle = 'rgba(0,0,0,0.25)';
  lensCtx.lineWidth   = 1;
  lensCtx.stroke();
  lensCtx.restore();
}

function drawSource(ctx, img, pctX, pctY) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const sx = Math.max(0, Math.min(iw - SAMPLE_PX, pctX * iw - SAMPLE_PX / 2));
  const sy = Math.max(0, Math.min(ih - SAMPLE_PX, pctY * ih - SAMPLE_PX / 2));
  const D  = LENS_R * 2;
  ctx.drawImage(img, sx, sy, SAMPLE_PX, SAMPLE_PX, 0, 0, D, D);
}

// ── Pointer position helpers ──────────────────────────────────────────────
function pctFromEvent(e) {
  // Measure the padded image area (same rect the comparison overlay uses)
  const target = overlay.hidden ? afterImg : overlay;
  const rect   = target.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: Math.max(0, Math.min(1, (clientX - rect.left)  / rect.width)),
    y: Math.max(0, Math.min(1, (clientY - rect.top)   / rect.height)),
    cx: clientX,
    cy: clientY,
  };
}

function positionLens(cx, cy) {
  const figRect = figure.getBoundingClientRect();
  // Offset from figure top-left, accounting for padding so lens stays in-frame
  const pad     = 12;
  const D       = LENS_R * 2;
  let lx = cx - figRect.left - LENS_R;
  let ly = cy - figRect.top  - LENS_R;
  // Clamp so lens never exits the figure
  lx = Math.max(pad, Math.min(figRect.width  - D - pad, lx));
  ly = Math.max(pad, Math.min(figRect.height - D - pad, ly));
  lens.style.left = lx + 'px';
  lens.style.top  = ly + 'px';
}

// ── Slider hit-test ───────────────────────────────────────────────────────
function overSlider(cx) {
  if (overlay.hidden) return false;
  const handle = figure.querySelector('.divider-handle');
  if (!handle) return false;
  const r = handle.getBoundingClientRect();
  return cx >= r.left && cx <= r.right;
}

// ── Event handlers ────────────────────────────────────────────────────────
function onMove(e) {
  if (!active) return;
  const { x, y, cx, cy } = pctFromEvent(e);
  if (overSlider(cx)) {
    lens.classList.remove('is-visible');
    figure.classList.remove('mag-active');
    return;
  }
  lens.classList.add('is-visible');
  figure.classList.add('mag-active');
  positionLens(cx, cy);
  drawLens(x, y);
}

function onEnter() {
  active = true;
  sizeLens();
}

function onLeave() {
  active = false;
  lens.classList.remove('is-visible');
  figure.classList.remove('mag-active');
}

// ── Init ──────────────────────────────────────────────────────────────────
export function initMagnifier({ figure: fig, after, before, overlay: ov }) {
  figure    = fig;
  afterImg  = after;
  beforeImg = before;
  overlay   = ov;

  lens    = createLens();
  lensCtx = lens.getContext('2d');
  sizeLens();

  // Listen on the figure so it covers after + comparison overlay
  figure.addEventListener('mouseenter', onEnter);
  figure.addEventListener('mouseleave', onLeave);
  figure.addEventListener('mousemove',  onMove);
}
