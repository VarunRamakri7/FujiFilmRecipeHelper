/**
 * Draggable before/after comparison divider.
 *
 * Wires pointer (mouse + touch) and keyboard events to the #divider-handle.
 * Moves the divider by updating:
 *   - .photo-before clip-path: inset(0 <right>% 0 0)  where right = 100 - pct
 *   - .divider-handle left: <pct>%
 *
 * Safe to call multiple times — each call replaces the previous listeners
 * because the overlay is re-hidden/re-shown by the toggle.
 */
export function initComparisonSlider(figure) {
  const overlay = figure.querySelector('#comparison-overlay');
  const before  = figure.querySelector('#photo-before');
  const handle  = figure.querySelector('#divider-handle');
  if (!overlay || !before || !handle) return;

  let pct = 50; // current divider position as percentage of figure width

  function applyPosition(p) {
    pct = Math.min(100, Math.max(0, p));
    before.style.clipPath = `inset(0 ${(100 - pct).toFixed(2)}% 0 0)`;
    handle.style.left     = `${pct.toFixed(2)}%`;
    handle.setAttribute('aria-valuenow', Math.round(pct));
  }

  function pctFromClientX(clientX) {
    const rect = figure.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // ── Mouse ──────────────────────────────────────────────────────────────
  function onMouseMove(e) {
    applyPosition(pctFromClientX(e.clientX));
  }
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',  onMouseUp);
  }
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',  onMouseUp);
  });

  // ── Touch ──────────────────────────────────────────────────────────────
  function onTouchMove(e) {
    if (e.touches.length < 1) return;
    e.preventDefault();
    applyPosition(pctFromClientX(e.touches[0].clientX));
  }
  handle.addEventListener('touchstart', e => {
    e.preventDefault();
    handle.addEventListener('touchmove',  onTouchMove, { passive: false });
    handle.addEventListener('touchend',   removeTouchListeners, { once: true });
    handle.addEventListener('touchcancel',removeTouchListeners, { once: true });
  }, { passive: false });
  function removeTouchListeners() {
    handle.removeEventListener('touchmove', onTouchMove);
  }

  // ── Keyboard (arrow keys on the handle) ───────────────────────────────
  handle.addEventListener('keydown', e => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft')  { applyPosition(pct - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { applyPosition(pct + step); e.preventDefault(); }
  });

  // Set initial position
  applyPosition(50);
}
