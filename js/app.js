import { FILM_SIMS }          from './data/filmSimulations.js';
import { PARAMETERS }         from './data/parameters.js';
import { SENSOR_GENERATIONS } from './data/sensorGenerations.js';
import { initSensorSelector, getSensorGeneration, isSupported } from './components/sensorSelector.js';
import { initTooltips, unpinTooltip } from './components/tooltip.js';
import { buildFilter }        from './utils/buildFilter.js';
import { initComparisonSlider } from './components/comparisonSlider.js';
import { exportCard }          from './utils/exportCard.js';
import { saveRecipe, loadRecipes, deleteRecipe, exportRecipe } from './utils/recipes.js';
import { initMagnifier, setMagnifierEnabled } from './components/zoomLens.js';

// ── State ──────────────────────────────────────────────────────────────────
const PHOTOS = {
  landscape:    'assets/photos/stock-landscape.jpg',
  architecture: 'assets/photos/stock-wildlife.jpg',
  color:        'assets/photos/stock-color.jpg',
  people:       'assets/photos/stock-people.jpg',
};

const state = {
  sensorId:   getSensorGeneration(),
  filmSimId:  'provia',
  photo:      'landscape',
  params: {
    highlightTone:      0,
    shadowTone:         0,
    color:              0,
    sharpness:          0,
    noiseReduction:     0,
    grainRoughness:     'Off',
    grainSize:          'Small',
    colorChromeEffect:  'Off',
    colorChromeBlue:    'Off',
    clarity:            0,
  },
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const filmSimGrid       = document.getElementById('film-sim-grid');
const filmSimGridMobile = document.getElementById('film-sim-grid-mobile');
const paramList         = document.getElementById('parameter-list');
const paramListMobile   = document.getElementById('parameter-list-mobile');
const photoAfter        = document.getElementById('photo-after');
const photoBefore       = document.getElementById('photo-before');
const photoPicker       = document.getElementById('photo-picker');
const photoFigure       = document.getElementById('photo-figure');
const comparisonOverlay = document.getElementById('comparison-overlay');
const toggleComparison  = document.getElementById('toggle-comparison');
const btnReupload       = document.getElementById('btn-reupload');
const panelSimSubtitle  = document.getElementById('panel-sim-subtitle');
const panelParamsBadge  = document.getElementById('panel-params-badge');
const panelParamsBadgeMobile = document.getElementById('panel-params-badge-mobile');

// ── Toast ──────────────────────────────────────────────────────────────────
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = '', duration = 2500) {
  const el = document.createElement('div');
  el.className = `toast${type ? ` toast--${type}` : ''}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
  setTimeout(() => {
    el.classList.remove('is-visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

// ── Modified-params badge ──────────────────────────────────────────────────
function countModifiedParams() {
  return PARAMETERS.reduce((n, p) => {
    const cur = state.params[p.id];
    const def = p.default;
    return n + (cur !== def ? 1 : 0);
  }, 0);
}

function updateParamsBadge() {
  const n = countModifiedParams();
  const show = n > 0;
  [panelParamsBadge, panelParamsBadgeMobile].forEach(el => {
    if (!el) return;
    el.textContent = String(n);
    el.classList.toggle('is-visible', show);
  });
  // Also update the Adjust pill nav button label on mobile
  const adjBtn = document.getElementById('mob-btn-params');
  if (adjBtn) {
    const span = adjBtn.querySelector('span');
    if (span) span.textContent = show ? `Adjust · ${n}` : 'Adjust';
  }
}

// ── Active sim subtitle (desktop panel header) ─────────────────────────────
function updateSimSubtitle() {  if (!panelSimSubtitle) return;
  const sim = FILM_SIMS.find(s => s.id === state.filmSimId);
  if (sim) {
    panelSimSubtitle.textContent = sim.shortName;
    panelSimSubtitle.classList.add('is-visible');
  }
}

// ── Render: film sim cards ─────────────────────────────────────────────────
function filmSimHTML() {
  const gen = SENSOR_GENERATIONS.find(g => g.id === state.sensorId);
  const supported = new Set(gen?.supportedSimIds ?? []);

  return FILM_SIMS.map(sim => {
    const gated   = !supported.has(sim.id);
    const active  = sim.id === state.filmSimId && !gated;
    const subName = sim.name.split('/').slice(1).join('/');

    return `<div
      class="film-sim-card${active ? ' is-active' : ''}${gated ? ' is-gated' : ''}"
      role="radio"
      aria-checked="${active}"
      data-id="${sim.id}"
      ${gated ? 'data-gated="true"' : ''}
      tabindex="${gated ? '-1' : '0'}"
    >
      <div class="card-swatch" style="--swatch:${sim.accentColor}"></div>
      <span class="card-short">${sim.shortName}</span>
      ${subName ? `<span class="card-name">${subName}</span>` : ''}
      <button class="card-info-btn" aria-label="About ${sim.shortName}"
              data-tooltip="${gated ? `Not available on ${gen?.label ?? 'your sensor'}` : sim.description}"
              tabindex="${gated ? '-1' : '0'}"
              aria-hidden="${gated ? 'true' : 'false'}">i</button>
    </div>`;
  }).join('');
}

function renderFilmSims() {
  unpinTooltip(); // clear any open tooltip before the DOM is replaced
  const html = filmSimHTML();
  if (filmSimGrid) filmSimGrid.innerHTML = html;
  if (filmSimGridMobile) filmSimGridMobile.innerHTML = html;
  updateSimSubtitle();
}

// ── Render: parameters ────────────────────────────────────────────────────
function parametersHTML() {
  const sensorLabel = SENSOR_GENERATIONS.find(g => g.id === state.sensorId)?.label ?? 'your sensor';
  return PARAMETERS.map(param => {
    const gated      = !isSupported(param.sensorMinGeneration, state.sensorId);
    const gatedAttr  = gated ? `data-tooltip="Not available on ${sensorLabel}" data-gated="true"` : '';

    if (param.type === 'select') {
      const optButtons = param.options.map(opt => `
        <button class="param-option${state.params[param.id] === opt.value ? ' is-active' : ''}"
                data-param="${param.id}" data-value="${opt.value}"
                ${gated ? 'disabled' : ''}>${opt.label}</button>
      `).join('');
      return `
        <div class="param-row${gated ? ' is-gated' : ''}" data-id="${param.id}" ${gatedAttr}>
          <div class="param-header">
            <span class="param-label">${param.label}</span>
            <button class="param-info" aria-label="About ${param.label}"
                    data-tooltip="${param.description}">i</button>
          </div>
          <div class="param-options" role="group" aria-label="${param.label}">${optButtons}</div>
        </div>`;
    }

    const val  = state.params[param.id];
    const display = val > 0 ? `+${val}` : `${val}`;
    const [min, max] = param.range;
    return `
      <div class="param-row${gated ? ' is-gated' : ''}" data-id="${param.id}" ${gatedAttr}>
        <div class="param-header">
          <label class="param-label" for="p-${param.id}">${param.label}</label>
          <button class="param-info" aria-label="About ${param.label}"
                  data-tooltip="${param.description}">i</button>
          <span class="param-value" aria-live="polite">${display}</span>
        </div>
        <input class="param-slider" type="range"
               id="p-${param.id}" data-param="${param.id}"
               min="${min}" max="${max}" value="${val}" step="${param.step ?? 1}"
               ${gated ? 'disabled' : ''}
               aria-label="${param.label}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${val}">
        <div class="param-ticks" aria-hidden="true">
          <span>${min}</span><span class="tick-zero" style="--zero-pct:${(-min / (max - min)).toFixed(4)}">0</span><span>+${max}</span>
        </div>
      </div>`;
  }).join('');
}

function renderParameters() {
  const html = parametersHTML();
  if (paramList) paramList.innerHTML = html;
  if (paramListMobile) paramListMobile.innerHTML = html;
  updateParamsBadge();
}

// ── Update preview ────────────────────────────────────────────────────────
function updatePreview() {
  const sim    = FILM_SIMS.find(s => s.id === state.filmSimId);
  const filter = sim ? buildFilter(sim, state.params) : '';
  photoAfter.style.filter = filter;
}

// ── Set photo ─────────────────────────────────────────────────────────────
let customBlobUrl = null;

function setPhoto(key) {
  const src = key === 'custom' ? customBlobUrl : PHOTOS[key];
  if (!src) return;
  photoAfter.style.display = '';
  photoAfter.setAttribute('alt', 'Photo with recipe applied');
  photoAfter.src  = src;
  photoBefore.setAttribute('alt', 'Original photo');
  photoBefore.src = src;

  if (key === 'custom') {
    photoAfter.onload = () => {
      photoFigure.style.aspectRatio = `${photoAfter.naturalWidth} / ${photoAfter.naturalHeight}`;
      photoAfter.onload = null;
    };
  } else {
    photoFigure.style.aspectRatio = '';
  }
}

// ── Focus trap ────────────────────────────────────────────────────────────
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

function trapFocus(container, e) {
  const els = [...container.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden]'));
  if (!els.length) return;
  const first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

// ── Bottom sheet manager ──────────────────────────────────────────────────
const backdrop   = document.getElementById('sheet-backdrop');
const sheets     = {
  film:    document.getElementById('sheet-film'),
  params:  document.getElementById('sheet-params'),
  recipe:  document.getElementById('sheet-recipe'),
  options: document.getElementById('sheet-options'),
  recipes: document.getElementById('sheet-recipes'),
};
const navBtns = {
  film:    document.getElementById('mob-btn-film'),
  params:  document.getElementById('mob-btn-params'),
  recipe:  document.getElementById('mob-btn-recipe'),
  options: document.getElementById('mob-btn-options'),
};
let activeSheet = null;
let activeTrapHandler = null;

function openSheet(key) {
  if (activeSheet === key) { closeSheet(); return; }
  closeSheet(false);

  const sheet = sheets[key];
  if (!sheet) return;
  activeSheet = key;

  backdrop.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add('is-visible');
    sheet.hidden = false;
    requestAnimationFrame(() => {
      sheet.classList.add('is-open');
      const first = sheet.querySelector(FOCUSABLE);
      if (first) first.focus();
    });
  });

  activeTrapHandler = e => { if (e.key === 'Tab') trapFocus(sheet, e); };
  sheet.addEventListener('keydown', activeTrapHandler);

  Object.entries(navBtns).forEach(([k, btn]) => {
    if (btn) btn.classList.toggle('is-active', k === key);
    if (btn) btn.setAttribute('aria-expanded', String(k === key));
  });

  document.addEventListener('keydown', onEscKey);
}

function closeSheet(restoreAria = true) {
  if (!activeSheet) return;
  const sheet = sheets[activeSheet];
  if (sheet) {
    if (activeTrapHandler) sheet.removeEventListener('keydown', activeTrapHandler);
    activeTrapHandler = null;
    sheet.classList.remove('is-open');
    sheet.addEventListener('transitionend', () => { sheet.hidden = true; }, { once: true });
  }
  backdrop.classList.remove('is-visible');
  backdrop.addEventListener('transitionend', () => { backdrop.hidden = true; }, { once: true });

  if (restoreAria) {
    Object.values(navBtns).forEach(btn => {
      if (btn) { btn.classList.remove('is-active'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }
  activeSheet = null;
  document.removeEventListener('keydown', onEscKey);
}

function onEscKey(e) {
  if (e.key === 'Escape') closeSheet();
}

backdrop.addEventListener('click', () => closeSheet());

// Close buttons inside each sheet
document.querySelectorAll('.sheet-close').forEach(btn => {
  btn.addEventListener('click', () => closeSheet());
});

// Nav button click handlers
Object.entries(navBtns).forEach(([key, btn]) => btn?.addEventListener('click', () => openSheet(key)));

// Desktop header Recipe + Options buttons wire to the same sheets
document.getElementById('btn-header-recipe')?.addEventListener('click', () => openSheet('recipe'));
document.getElementById('btn-header-options')?.addEventListener('click', () => openSheet('options'));

// My Recipes header button
document.getElementById('btn-my-recipes')?.addEventListener('click', () => {
  renderRecipesSheet();
  openSheet('recipes');
});

// ── My Recipes sheet ──────────────────────────────────────────────────────
const recipesListContainer = document.getElementById('recipes-list-container');

function formatRecipeText(recipe) {
  const sim = FILM_SIMS.find(s => s.id === recipe.filmSimId);
  const gen = SENSOR_GENERATIONS.find(g => g.id === recipe.sensorId);
  const lines = [
    `Recipe: ${recipe.name}`,
    `Film Sim: ${sim?.shortName ?? recipe.filmSimId}`,
    gen ? `Sensor: ${gen.label}` : null,
    '',
    ...PARAMETERS.map(p => {
      const val = recipe.params[p.id];
      return val !== undefined ? `${p.label}: ${val}` : null;
    }).filter(Boolean),
  ].filter(l => l !== null);
  return lines.join('\n');
}

function renderRecipesSheet() {
  if (!recipesListContainer) return;
  const recipes = loadRecipes();
  if (!recipes.length) {
    recipesListContainer.innerHTML = `
      <div class="recipes-empty">
        <svg class="recipes-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span class="recipes-empty-title">No saved recipes yet</span>
        <span class="recipes-empty-sub">Save a recipe using the Recipe panel, then find it here.</span>
      </div>`;
    return;
  }

  recipesListContainer.innerHTML = recipes.map(recipe => {
    const sim = FILM_SIMS.find(s => s.id === recipe.filmSimId);
    const gen = SENSOR_GENERATIONS.find(g => g.id === recipe.sensorId);
    const date = recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    const meta = [sim?.shortName, gen?.label, date].filter(Boolean).join(' · ');
    return `<div class="recipe-card" data-recipe-id="${recipe.id}">
      <div class="recipe-card-info">
        <span class="recipe-card-name">${recipe.name}</span>
        <span class="recipe-card-meta">${meta}</span>
      </div>
      <div class="recipe-card-actions">
        <button class="recipe-action-btn recipe-action-btn--load" data-action="load" data-recipe-id="${recipe.id}" aria-label="Load ${recipe.name}" title="Load recipe">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 12 5 19 12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
        </button>
        <button class="recipe-action-btn" data-action="copy" data-recipe-id="${recipe.id}" aria-label="Copy ${recipe.name}" title="Copy as text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="recipe-action-btn" data-action="export" data-recipe-id="${recipe.id}" aria-label="Export ${recipe.name}" title="Export as JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="recipe-action-btn recipe-action-btn--delete" data-action="delete" data-recipe-id="${recipe.id}" aria-label="Delete ${recipe.name}" title="Delete recipe">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

if (recipesListContainer) {
  recipesListContainer.addEventListener('click', e => {
    const btn = e.target.closest('[data-action][data-recipe-id]');
    if (!btn) return;
    const id = btn.dataset.recipeId;
    const action = btn.dataset.action;
    const recipes = loadRecipes();
    const recipe = recipes.find(r => r.id === id);
    if (!recipe && action !== 'delete') return;

    if (action === 'load') {
      state.filmSimId = recipe.filmSimId;
      state.params = { ...recipe.params };
      if (recipe.sensorId) state.sensorId = recipe.sensorId;
      renderFilmSims();
      renderParameters();
      updatePreview();
      closeSheet();
      showToast(`"${recipe.name}" loaded`, 'success');
    } else if (action === 'delete') {
      deleteRecipe(id);
      renderRecipesSheet();
      showToast('Recipe deleted');
    } else if (action === 'export') {
      exportRecipe(id);
      showToast('Recipe JSON saved');
    } else if (action === 'copy') {
      const text = formatRecipeText(recipe);
      navigator.clipboard.writeText(text).then(
        () => showToast('Copied to clipboard', 'success'),
        () => showToast('Copy failed — try again', 'warning'),
      );
    }
  });
}

// ── Swipe-to-dismiss on bottom sheets ─────────────────────────────────────
(function initSwipeToDismiss() {
  let startY = 0, startScrollTop = 0, dragging = false;

  document.addEventListener('touchstart', e => {
    if (!activeSheet) return;
    const sheet = sheets[activeSheet];
    if (!sheet || !sheet.contains(e.target)) return;
    const body = sheet.querySelector('.sheet-body');
    startScrollTop = body ? body.scrollTop : 0;
    startY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!dragging || !activeSheet) return;
    const sheet = sheets[activeSheet];
    if (!sheet) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0 && startScrollTop === 0) {
      sheet.style.transform = `translateX(-50%) translateY(${Math.min(dy * 0.6, 120)}px)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!dragging || !activeSheet) return;
    dragging = false;
    const sheet = sheets[activeSheet];
    if (!sheet) return;
    const dy = e.changedTouches[0].clientY - startY;
    sheet.style.transform = '';
    if (dy > 80) closeSheet();
  }, { passive: true });
})();

// ── Event delegation: film sim grid (desktop + mobile) ────────────────────
function handleFilmSimClick(e) {
  // Let info button clicks pass through to tooltip; don't select the sim
  if (e.target.closest('.card-info-btn')) return;

  const card = e.target.closest('.film-sim-card');
  if (!card) return;

  // Gated: flash feedback instead of silent ignore
  if (card.dataset.gated === 'true') {
    const needed = FILM_SIMS.find(s => s.id === card.dataset.id)?.sensorMinGeneration;
    const neededLabel = SENSOR_GENERATIONS.find(g => g.id === needed)?.label ?? 'a newer sensor';
    showToast(`Requires ${neededLabel} — change sensor to unlock`, 'warning', 3000);
    card.classList.add('gated-flash');
    card.addEventListener('animationend', () => card.classList.remove('gated-flash'), { once: true });
    return;
  }

  state.filmSimId = card.dataset.id;
  renderFilmSims();
  updatePreview();
}

function handleFilmSimKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  if (e.target.closest('.card-info-btn')) return;
  const card = e.target.closest('.film-sim-card');
  if (!card || card.dataset.gated === 'true') return;
  e.preventDefault();
  state.filmSimId = card.dataset.id;
  renderFilmSims();
  updatePreview();
}

if (filmSimGrid) {
  filmSimGrid.addEventListener('click', handleFilmSimClick);
  filmSimGrid.addEventListener('keydown', handleFilmSimKeydown);
}
if (filmSimGridMobile) {
  filmSimGridMobile.addEventListener('click', handleFilmSimClick);
  filmSimGridMobile.addEventListener('keydown', handleFilmSimKeydown);
}

// ── Event delegation: parameters (desktop + mobile) ───────────────────────
function handleParamInput(e) {
  const slider = e.target.closest('input[type="range"][data-param]');
  if (!slider) return;
  const id  = slider.dataset.param;
  const val = parseInt(slider.value, 10);
  state.params[id] = val;
  const display = val > 0 ? `+${val}` : `${val}`;
  const valueEl = slider.closest('.param-row')?.querySelector('.param-value');
  if (valueEl) {
    valueEl.textContent = display;
    slider.setAttribute('aria-valuenow', val);
  }
  // Mirror value to the other list
  const otherList = e.currentTarget === paramList ? paramListMobile : paramList;
  const mirror = otherList?.querySelector(`[data-param="${id}"][type="range"]`);
  if (mirror) {
    mirror.value = val;
    const mirrorVal = mirror.closest('.param-row')?.querySelector('.param-value');
    if (mirrorVal) mirrorVal.textContent = display;
  }
  updatePreview();
  updateParamsBadge();
}

function handleParamClick(e) {
  const btn = e.target.closest('.param-option:not([disabled])');
  if (!btn) return;
  const id  = btn.dataset.param;
  const val = btn.dataset.value;
  state.params[id] = val;
  [paramList, paramListMobile].forEach(list => {
    list?.querySelectorAll(`.param-option[data-param="${id}"]`).forEach(b => {
      b.classList.toggle('is-active', b.dataset.value === val);
    });
  });
  updatePreview();
  updateParamsBadge();
}

// Gated param-row tap feedback on mobile
function handleParamRowClick(e) {
  const row = e.target.closest('.param-row[data-gated="true"]');
  if (!row) return;
  const sensorLabel = SENSOR_GENERATIONS.find(g => g.id === state.sensorId)?.label ?? 'your sensor';
  showToast(`This parameter requires a newer sensor than ${sensorLabel}`, 'warning', 3000);
  row.classList.add('gated-flash');
  row.addEventListener('animationend', () => row.classList.remove('gated-flash'), { once: true });
}

if (paramList) {
  paramList.addEventListener('input', handleParamInput);
  paramList.addEventListener('click', handleParamClick);
  paramList.addEventListener('click', handleParamRowClick);
}
if (paramListMobile) {
  paramListMobile.addEventListener('input', handleParamInput);
  paramListMobile.addEventListener('click', handleParamClick);
  paramListMobile.addEventListener('click', handleParamRowClick);
}

// ── Photo picker ──────────────────────────────────────────────────────────
const customPhotoInput  = document.getElementById('custom-photo-input');
const customUploadPrompt = document.getElementById('custom-upload-prompt');
const btnTriggerUpload  = document.getElementById('btn-trigger-upload');

function syncReuploadBtn() {
  btnReupload.hidden = !(state.photo === 'custom' && customBlobUrl);
}

function showUploadPrompt(visible) {
  customUploadPrompt.hidden = !visible;
}

photoPicker.addEventListener('click', e => {
  const btn = e.target.closest('.photo-type-btn');
  if (!btn) return;

  photoPicker.querySelectorAll('.photo-type-btn').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  state.photo = btn.dataset.photo;

  if (btn.dataset.photo === 'custom') {
    if (customBlobUrl) {
      setPhoto('custom');
      showUploadPrompt(false);
    } else {
      photoAfter.style.display = 'none';
      photoAfter.removeAttribute('src');
      photoAfter.removeAttribute('alt');
      photoBefore.removeAttribute('src');
      photoFigure.style.aspectRatio = '';
      showUploadPrompt(true);
    }
  } else {
    showUploadPrompt(false);
    setPhoto(state.photo);
  }
  syncReuploadBtn();
});

btnTriggerUpload.addEventListener('click', () => customPhotoInput.click());
btnReupload.addEventListener('click', () => customPhotoInput.click());

customPhotoInput.addEventListener('change', () => {
  const file = customPhotoInput.files[0];
  if (!file) return;

  if (customBlobUrl) URL.revokeObjectURL(customBlobUrl);
  customBlobUrl = URL.createObjectURL(file);

  photoPicker.querySelectorAll('.photo-type-btn').forEach(b => b.classList.remove('is-active'));
  photoPicker.querySelector('[data-photo="custom"]').classList.add('is-active');
  state.photo = 'custom';

  showUploadPrompt(false);
  setPhoto('custom');
  syncReuploadBtn();

  customPhotoInput.value = '';
});

// ── Sensor change callback ────────────────────────────────────────────────
function onSensorChange(newId) {
  state.sensorId = newId;
  const gen = SENSOR_GENERATIONS.find(g => g.id === newId);
  const simWasSupported = gen?.supportedSimIds.includes(state.filmSimId);
  if (gen && !simWasSupported) {
    const oldSim = FILM_SIMS.find(s => s.id === state.filmSimId);
    state.filmSimId = 'provia';
    showToast(`${oldSim?.shortName ?? 'Film sim'} isn't available on ${gen.label} — switched to PROVIA`, 'warning', 4000);
  }
  renderFilmSims();
  renderParameters();
  updatePreview();
}

// ── Magnifier toggle ──────────────────────────────────────────────────────
let magnifierActive = false;
document.getElementById('toggle-magnifier').addEventListener('change', e => {
  magnifierActive = e.target.checked;
  setMagnifierEnabled(magnifierActive);
  if (magnifierActive) {
    showToast('Magnifier on — tap to expand is disabled', '', 3000);
  }
});

// ── Comparison toggle ─────────────────────────────────────────────────────
let sliderInitialized = false;
toggleComparison.addEventListener('change', () => {
  const on = toggleComparison.checked;
  comparisonOverlay.hidden = !on;
  comparisonOverlay.setAttribute('aria-hidden', String(!on));
  if (on && !sliderInitialized) {
    initComparisonSlider(photoFigure);
    sliderInitialized = true;
  }
});

// ── Reset parameters only (params sheet) ─────────────────────────────────
function doResetParams(silent = false) {
  PARAMETERS.forEach(p => { state.params[p.id] = p.default; });
  renderParameters();
  updatePreview();
  if (!silent) showToast('Parameters reset');
}
document.getElementById('btn-reset-params-mobile').addEventListener('click', () => doResetParams());

// ── Reset all (film sim + params) ─────────────────────────────────────────
function doReset() {
  state.filmSimId = 'provia';
  doResetParams(true);
  renderFilmSims();
  showToast('Recipe reset to defaults');
}
document.getElementById('btn-reset').addEventListener('click', doReset);
document.getElementById('btn-reset-mobile').addEventListener('click', doReset);

// ── Export card (desktop + mobile) ────────────────────────────────────────
function doExport() {
  const gen = SENSOR_GENERATIONS.find(g => g.id === state.sensorId);
  exportCard(state.filmSimId, state.params, gen?.label ?? '');
  showToast('Recipe card saved to downloads');
}
document.getElementById('btn-export-card').addEventListener('click', doExport);
document.getElementById('btn-export-card-mobile').addEventListener('click', doExport);

// ── Save recipe (desktop + mobile) ───────────────────────────────────────
function doSave(nameInputId) {
  const input = document.getElementById(nameInputId);
  const name  = input?.value.trim();
  if (!name) { input?.focus(); return; }
  saveRecipe({ name, filmSimId: state.filmSimId, params: { ...state.params }, sensorId: state.sensorId });
  if (input) input.value = '';
  showToast(`"${name}" saved`, 'success');
}
document.getElementById('btn-save').addEventListener('click', () => doSave('recipe-name'));
document.getElementById('btn-save-mobile').addEventListener('click', () => doSave('recipe-name-mobile'));

// ── Disclaimer icon toggle ────────────────────────────────────────────────
const disclaimerBtn = document.getElementById('btn-disclaimer');
if (disclaimerBtn) {
  disclaimerBtn.addEventListener('click', () => {
    const expanded = disclaimerBtn.getAttribute('aria-expanded') === 'true';
    disclaimerBtn.setAttribute('aria-expanded', String(!expanded));
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!disclaimerBtn.contains(e.target)) {
      disclaimerBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Theme toggle (desktop header + FAB) ──────────────────────────────────
const THEME_KEY = 'fuji-theme';
const htmlEl    = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

document.getElementById('btn-theme').addEventListener('click', toggleTheme);

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  applyTheme(savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
  applyTheme('light');
}

// ── Photo lightbox ────────────────────────────────────────────────────────
const lightboxEl  = document.getElementById('photo-lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox() {
  if (!lightboxEl || !lightboxImg) return;
  if (!photoAfter.src || photoAfter.style.display === 'none') return;
  lightboxImg.src = photoAfter.src;
  lightboxImg.style.filter = photoAfter.style.filter;
  lightboxEl.removeAttribute('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => lightboxEl.classList.add('is-open')));
  document.addEventListener('keydown', onLightboxKey);
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  lightboxEl.addEventListener('transitionend', () => {
    lightboxEl.hidden = true;
    lightboxImg.src = '';
    lightboxImg.style.filter = '';
  }, { once: true });
  document.removeEventListener('keydown', onLightboxKey);
}

function onLightboxKey(e) { if (e.key === 'Escape') closeLightbox(); }

if (photoFigure) {
  photoFigure.addEventListener('click', e => {
    if (magnifierActive) return;
    if (e.target.closest('.divider-handle') || e.target.closest('.mag-lens') || e.target.closest('.custom-upload-prompt')) return;
    openLightbox();
  });
}

if (lightboxEl) {
  lightboxEl.addEventListener('click', e => {
    if (!e.target.closest('.lightbox-img')) closeLightbox();
  });
  lightboxEl.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);

  // Swipe down to close
  let lbStartY = 0;
  lightboxEl.addEventListener('touchstart', e => { lbStartY = e.touches[0].clientY; }, { passive: true });
  lightboxEl.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - lbStartY > 80) closeLightbox();
  }, { passive: true });
}

// ── Init ──────────────────────────────────────────────────────────────────
initTooltips();
initSensorSelector(onSensorChange);
setPhoto(state.photo);
renderFilmSims();
renderParameters();
updatePreview();
initMagnifier({ figure: photoFigure, after: photoAfter, before: photoBefore, overlay: comparisonOverlay });
