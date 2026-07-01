import { FILM_SIMS } from './data/filmSimulations.js';
import { PARAMETERS } from './data/parameters.js';
import { SENSOR_GENERATIONS } from './data/sensorGenerations.js';

// Sanity check — remove before Phase 3
console.log(`Loaded: ${FILM_SIMS.length} film sims, ${PARAMETERS.length} parameters, ${SENSOR_GENERATIONS.length} sensor generations`);

document.getElementById('app') && document.getElementById('app').removeAttribute('id');
