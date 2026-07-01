import { FILM_SIMS }          from './data/filmSimulations.js';
import { PARAMETERS }         from './data/parameters.js';
import { SENSOR_GENERATIONS } from './data/sensorGenerations.js';
import { initSensorSelector, getSensorGeneration, isSupported } from './components/sensorSelector.js';
import { initTooltips }       from './components/tooltip.js';
import { buildFilter }        from './utils/buildFilter.js';
import { initComparisonSlider } from './components/comparisonSlider.js';

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
const paramList         = document.getElementById('parameter-list');
const photoAfter        = document.getElementById('photo-after');
const photoBefore       = document.getElementById('photo-before');
const photoPicker       = document.getElementById('photo-picker');
const photoFigure       = document.getElementById('photo-figure');
const comparisonOverlay = document.getElementById('comparison-overlay');
const toggleComparison  = document.getElementById('toggle-comparison');
const btnReupload       = document.getElementById('btn-reupload');

// ── Render: film sim cards ─────────────────────────────────────────────────
function renderFilmSims() {
  const gen = SENSOR_GENERATIONS.find(g => g.id === state.sensorId);
  const supported = new Set(gen?.supportedSimIds ?? []);

  filmSimGrid.innerHTML = FILM_SIMS.map(sim => {
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

// ── Render: parameters ────────────────────────────────────────────────────
function renderParameters() {
  paramList.innerHTML = PARAMETERS.map(param => {
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
    // Match the figure's aspect ratio to the uploaded image's natural dimensions
    const img = new Image();
    img.onload = () => {
      photoFigure.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    };
    img.src = src;
  } else {
    // Restore the default 3/2 ratio for the stock photos
    photoFigure.style.aspectRatio = '';
  }
}

// ── Event delegation: film sim grid ───────────────────────────────────────
filmSimGrid.addEventListener('click', e => {
  const card = e.target.closest('.film-sim-card:not(.is-gated)');
  if (!card) return;
  state.filmSimId = card.dataset.id;
  renderFilmSims();
  updatePreview();
});

// ── Event delegation: parameters ─────────────────────────────────────────
paramList.addEventListener('input', e => {
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
  updatePreview();
});

paramList.addEventListener('click', e => {
  const btn = e.target.closest('.param-option:not([disabled])');
  if (!btn) return;
  const id  = btn.dataset.param;
  const val = btn.dataset.value;
  state.params[id] = val;
  // Update active state within this group
  btn.closest('.param-options')?.querySelectorAll('.param-option').forEach(b => {
    b.classList.toggle('is-active', b.dataset.value === val);
  });
  updatePreview();
});

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

// Upload button inside the empty-state overlay
btnTriggerUpload.addEventListener('click', () => customPhotoInput.click());

// Reupload button in the preview footer
btnReupload.addEventListener('click', () => customPhotoInput.click());

customPhotoInput.addEventListener('change', () => {
  const file = customPhotoInput.files[0];
  if (!file) return;

  if (customBlobUrl) URL.revokeObjectURL(customBlobUrl);
  customBlobUrl = URL.createObjectURL(file);

  // Ensure Custom tab is active
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
  // If active sim is no longer supported, fall back to provia
  const gen = SENSOR_GENERATIONS.find(g => g.id === newId);
  if (gen && !gen.supportedSimIds.includes(state.filmSimId)) {
    state.filmSimId = 'provia';
  }
  renderFilmSims();
  renderParameters();
  updatePreview();
}

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

// ── Reset ─────────────────────────────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', () => {
  state.filmSimId = 'provia';
  PARAMETERS.forEach(p => { state.params[p.id] = p.default; });
  renderFilmSims();
  renderParameters();
  updatePreview();
});

// ── Init ──────────────────────────────────────────────────────────────────
initTooltips();
initSensorSelector(onSensorChange);
setPhoto(state.photo);
renderFilmSims();
renderParameters();
updatePreview();
