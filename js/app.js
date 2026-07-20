import { FILM_SIMS }          from './data/filmSimulations.js';
import { PARAMETERS }         from './data/parameters.js';
import { SENSOR_GENERATIONS } from './data/sensorGenerations.js';
import { initSensorSelector, getSensorGeneration, isSupported } from './components/sensorSelector.js';
import { initTooltips }       from './components/tooltip.js';
import { buildFilter }        from './utils/buildFilter.js';
import { initComparisonSlider } from './components/comparisonSlider.js';
import { exportCard }          from './utils/exportCard.js';
import { saveRecipe }    from './utils/recipes.js';
import { initMagnifier, setMagnifierEnabled } from './components/zoomLens.js';

// ── State ──────────────────────────────────────────────────────────────────
const PHOTOS = {
  landscape:    'assets/photos/stock-landscape.jpg',
  architecture: 'assets/photos/stock-architecture.jpg',
  color:        'assets/photos/stock-color.jpg',
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

// ── Render: film sim cards ─────────────────────────────────────────────────
function filmSimHTML() {
  const gen = SENSOR_GENERATIONS.find(g => g.id === state.sensorId);
  const supported = new Set(gen?.supportedSimIds ?? []);

  return FILM_SIMS.map(sim => {
    const gated   = !supported.has(sim.id);
    const active  = sim.id === state.filmSimId && !gated;
    const [, ...nameParts] = sim.name.split('/');
    const subName = nameParts.join('/') || '';

    return `<button
      class="film-sim-card${active ? ' is-active' : ''}${gated ? ' is-gated' : ''}"
      role="radio"
      aria-checked="${active}"
      data-id="${sim.id}"
      ${gated ? `data-tooltip="Not available on ${gen?.label ?? 'your sensor'}"` : `data-tooltip="${sim.description}"`}
      ${gated ? 'tabindex="-1"' : ''}
    >
      <div class="card-swatch" style="--swatch:${sim.accentColor}"></div>
      <span class="card-short">${sim.shortName}</span>
      ${subName ? `<span class="card-name">${subName}</span>` : ''}
    </button>`;
  }).join('');
}

function renderFilmSims() {
  const html = filmSimHTML();
  if (filmSimGrid) filmSimGrid.innerHTML = html;
  if (filmSimGridMobile) filmSimGridMobile.innerHTML = html;
}

// ── Render: parameters ────────────────────────────────────────────────────
function parametersHTML() {
  return PARAMETERS.map(param => {
    const gated = !isSupported(param.sensorMinGeneration, state.sensorId);

    if (param.type === 'select') {
      const optButtons = param.options.map(opt => `
        <button class="param-option${state.params[param.id] === opt.value ? ' is-active' : ''}"
                data-param="${param.id}" data-value="${opt.value}"
                ${gated ? 'disabled' : ''}>${opt.label}</button>
      `).join('');
      return `
        <div class="param-row${gated ? ' is-gated' : ''}" data-id="${param.id}"
             ${gated ? `data-tooltip="Not available on ${SENSOR_GENERATIONS.find(g=>g.id===state.sensorId)?.label ?? 'your sensor'}"` : ''}>
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
      <div class="param-row${gated ? ' is-gated' : ''}" data-id="${param.id}"
           ${gated ? `data-tooltip="Not available on ${SENSOR_GENERATIONS.find(g=>g.id===state.sensorId)?.label ?? 'your sensor'}"` : ''}>
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
  photoAfter.src  = src;
  photoBefore.src = src;

  if (key === 'custom') {
    const img = new Image();
    img.onload = () => {
      photoFigure.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    };
    img.src = src;
  } else {
    photoFigure.style.aspectRatio = '';
  }
}

// ── Bottom sheet manager ──────────────────────────────────────────────────
const backdrop   = document.getElementById('sheet-backdrop');
const sheets     = {
  film:    document.getElementById('sheet-film'),
  params:  document.getElementById('sheet-params'),
  recipe:  document.getElementById('sheet-recipe'),
  options: document.getElementById('sheet-options'),
};
const navBtns = {
  film:    document.getElementById('mob-btn-film'),
  params:  document.getElementById('mob-btn-params'),
  recipe:  document.getElementById('mob-btn-recipe'),
  options: document.getElementById('mob-btn-options'),
};
let activeSheet = null;

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
    requestAnimationFrame(() => sheet.classList.add('is-open'));
  });

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
document.getElementById('mob-btn-film').addEventListener('click',    () => openSheet('film'));
document.getElementById('mob-btn-params').addEventListener('click',  () => openSheet('params'));
document.getElementById('mob-btn-recipe').addEventListener('click',  () => openSheet('recipe'));
document.getElementById('mob-btn-options').addEventListener('click', () => openSheet('options'));

// ── Event delegation: film sim grid (desktop + mobile) ────────────────────
function handleFilmSimClick(e) {
  const card = e.target.closest('.film-sim-card:not(.is-gated)');
  if (!card) return;
  state.filmSimId = card.dataset.id;
  renderFilmSims();
  updatePreview();
}
if (filmSimGrid) filmSimGrid.addEventListener('click', handleFilmSimClick);
if (filmSimGridMobile) filmSimGridMobile.addEventListener('click', handleFilmSimClick);

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
  if (mirror) { mirror.value = val; mirror.closest('.param-row')?.querySelector('.param-value')?.textContent && (mirror.closest('.param-row').querySelector('.param-value').textContent = display); }
  updatePreview();
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
}

if (paramList) {
  paramList.addEventListener('input', handleParamInput);
  paramList.addEventListener('click', handleParamClick);
}
if (paramListMobile) {
  paramListMobile.addEventListener('input', handleParamInput);
  paramListMobile.addEventListener('click', handleParamClick);
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
      photoAfter.src  = '';
      photoBefore.src = '';
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
  if (gen && !gen.supportedSimIds.includes(state.filmSimId)) {
    state.filmSimId = 'provia';
  }
  renderFilmSims();
  renderParameters();
  updatePreview();
}

// ── Magnifier toggle ──────────────────────────────────────────────────────
document.getElementById('toggle-magnifier').addEventListener('change', e => {
  setMagnifierEnabled(e.target.checked);
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

// ── Reset (desktop + mobile) ──────────────────────────────────────────────
function doReset() {
  state.filmSimId = 'provia';
  PARAMETERS.forEach(p => { state.params[p.id] = p.default; });
  renderFilmSims();
  renderParameters();
  updatePreview();
}
document.getElementById('btn-reset').addEventListener('click', doReset);
document.getElementById('btn-reset-mobile').addEventListener('click', doReset);

// ── Export card (desktop + mobile) ────────────────────────────────────────
function doExport() {
  const gen = SENSOR_GENERATIONS.find(g => g.id === state.sensorId);
  exportCard(state.filmSimId, state.params, gen?.label ?? '');
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
}
document.getElementById('btn-save').addEventListener('click', () => doSave('recipe-name'));
document.getElementById('btn-save-mobile').addEventListener('click', () => doSave('recipe-name-mobile'));

// ── Theme toggle (desktop FAB + mobile nav) ───────────────────────────────
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

// ── Init ──────────────────────────────────────────────────────────────────
initTooltips();
initSensorSelector(onSensorChange);
setPhoto(state.photo);
renderFilmSims();
renderParameters();
updatePreview();
initMagnifier({ figure: photoFigure, after: photoAfter, before: photoBefore, overlay: comparisonOverlay });
