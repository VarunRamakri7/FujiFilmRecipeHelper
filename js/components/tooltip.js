const TOOLTIP_ID = 'app-tooltip';
let tooltipEl = null;

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

  const rect  = trigger.getBoundingClientRect();
  const ttW   = 240;
  const gap   = 8;

  el.style.maxWidth = `${ttW}px`;
  el.style.left     = `${Math.max(8, Math.min(rect.left + rect.width / 2 - ttW / 2, window.innerWidth - ttW - 8))}px`;

  // Measure height off-screen to decide whether to flip above/below
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

export function initTooltips() {
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) show(t);
  });
  document.addEventListener('focusin', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) show(t);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) hide(t);
  });
  document.addEventListener('focusout', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) hide(t);
  });
}
