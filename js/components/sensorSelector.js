import { SENSOR_GENERATIONS, GENERATION_ORDER } from '../data/sensorGenerations.js';

const STORAGE_KEY = 'fuji-sensor-generation';
const DEFAULT     = 'xtrans-v';

export function getSensorGeneration() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT;
}

export function generationIndex(id) {
  return GENERATION_ORDER.indexOf(id);
}

export function isSupported(itemMinGeneration, activeSensorId) {
  if (!itemMinGeneration) return true;
  return generationIndex(activeSensorId) >= generationIndex(itemMinGeneration);
}

export function initSensorSelector(onSelect) {
  const modal      = document.getElementById('sensor-modal');
  const list       = document.getElementById('sensor-list');
  const btnSensor  = document.getElementById('btn-sensor');
  const sensorLabel = document.getElementById('sensor-label');

  // Populate the list
  list.innerHTML = SENSOR_GENERATIONS.map(gen => `
    <button class="sensor-btn" data-id="${gen.id}">
      <span class="sensor-gen">${gen.label}</span>
      <span class="sensor-models">${gen.models.join(' · ')}</span>
    </button>
  `).join('');

  function open() {
    const active = getSensorGeneration();
    list.querySelectorAll('.sensor-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.id === active);
    });
    modal.hidden = false;
    // Focus first button for keyboard users
    list.querySelector('.sensor-btn')?.focus();
  }

  function close() {
    modal.hidden = true;
    btnSensor.focus();
  }

  function select(id) {
    localStorage.setItem(STORAGE_KEY, id);
    const gen = SENSOR_GENERATIONS.find(g => g.id === id);
    sensorLabel.textContent = gen ? gen.label : id;
    close();
    onSelect(id);
  }

  // Show on first visit (no stored preference)
  if (!localStorage.getItem(STORAGE_KEY)) {
    open();
  } else {
    const gen = SENSOR_GENERATIONS.find(g => g.id === getSensorGeneration());
    if (gen) sensorLabel.textContent = gen.label;
  }

  btnSensor.addEventListener('click', open);

  list.addEventListener('click', e => {
    const btn = e.target.closest('.sensor-btn');
    if (btn) select(btn.dataset.id);
  });

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) close();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}
