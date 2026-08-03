const TOOLTIP_ID = 'app-tooltip';
let tooltipEl = null;
let pinnedTrigger = null; // the trigger whose tooltip is click-locked open

function getTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.id = TOOLTIP_ID;
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function show(trigger) {
  const text = trigger.dataset.tooltip;
  if (!text) return;

  const el = getTooltip();
  el.textContent = text;
  trigger.setAttribute('aria-describedby', TOOLTIP_ID);

  const rect = trigger.getBoundingClientRect();
  const ttW  = 240;
  const gap  = 8;

  el.style.maxWidth  = `${ttW}px`;
  el.style.left      = `${Math.max(8, Math.min(rect.left + rect.width / 2 - ttW / 2, window.innerWidth - ttW - 8))}px`;

  el.style.visibility = 'hidden';
  el.style.top        = '-9999px';
  el.classList.add('is-visible');
  const ttH = el.offsetHeight;

  el.style.top        = `${rect.top < ttH + gap + 8 ? rect.bottom + gap : rect.top - ttH - gap}px`;
  el.style.visibility = '';
}

function hide(trigger) {
  getTooltip().classList.remove('is-visible');
  trigger.removeAttribute('aria-describedby');
}

function unpin() {
  if (!pinnedTrigger) return;
  pinnedTrigger.removeAttribute('data-tooltip-pinned');
  hide(pinnedTrigger);
  pinnedTrigger = null;
}

export function unpinTooltip() { unpin(); }

export function initTooltips() {
  // ── Hover (desktop) ──────────────────────────────────────
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t && t !== pinnedTrigger) show(t);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('[data-tooltip]');
    // Don't hide if this tooltip is pinned open
    if (t && t !== pinnedTrigger) hide(t);
  });

  // ── Focus (keyboard) ─────────────────────────────────────
  document.addEventListener('focusin', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t && t !== pinnedTrigger) show(t);
  });
  document.addEventListener('focusout', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t && t !== pinnedTrigger) hide(t);
  });

  // ── Click / tap toggle ───────────────────────────────────
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tooltip]');

    if (!t) {
      // Click outside — unpin any open tooltip
      unpin();
      return;
    }

    if (t === pinnedTrigger) {
      // Second click on the same trigger — close it
      unpin();
    } else {
      // New trigger — unpin any existing, pin this one
      unpin();
      pinnedTrigger = t;
      t.setAttribute('data-tooltip-pinned', '');
      show(t);
    }
    // Stop the click from immediately re-triggering the outside handler
    e.stopPropagation();
  }, true); // capture so stopPropagation works against document-level listeners
}
