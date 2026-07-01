let tooltipEl = null;

function getTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function show(trigger) {
  const text = trigger.dataset.tooltip;
  if (!text) return;

  const el   = getTooltip();
  const uid  = `tooltip-${Math.random().toString(36).slice(2, 8)}`;
  el.id      = uid;
  el.textContent = text;
  trigger.setAttribute('aria-describedby', uid);

  const rect  = trigger.getBoundingClientRect();
  const ttW   = 240;
  const gap   = 8;

  // Position above by default, flip below if too close to top
  let top  = rect.top - gap;
  let left = rect.left + rect.width / 2 - ttW / 2;

  el.style.maxWidth = `${ttW}px`;
  el.style.left     = `${Math.max(8, Math.min(left, window.innerWidth - ttW - 8))}px`;

  // Temporarily make visible to measure height
  el.style.opacity  = '0';
  el.classList.add('is-visible');
  const ttH = el.offsetHeight;
  el.classList.remove('is-visible');

  if (rect.top < ttH + gap + 8) {
    // Not enough room above — show below
    top = rect.bottom + gap;
  } else {
    top = rect.top - ttH - gap;
  }

  el.style.top = `${top}px`;
  el.classList.add('is-visible');
}

function hide(trigger) {
  const el = getTooltip();
  el.classList.remove('is-visible');
  trigger.removeAttribute('aria-describedby');
}

export function initTooltips() {
  document.addEventListener('mouseover', e => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) show(trigger);
  });
  document.addEventListener('mouseout', e => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) hide(trigger);
  });
  document.addEventListener('focusin', e => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) show(trigger);
  });
  document.addEventListener('focusout', e => {
    const trigger = e.target.closest('[data-tooltip]');
    if (trigger) hide(trigger);
  });
}
