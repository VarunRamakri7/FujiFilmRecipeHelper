import { FILM_SIMS }  from '../data/filmSimulations.js';
import { PARAMETERS } from '../data/parameters.js';

const THEME = {
  dark: {
    bgCard:        '#1e1a16',
    borderColor:   'rgba(255,255,255,0.08)',
    textPrimary:   '#f0ebe2',
    textSecondary: '#b8b0a4',
    textMuted:     '#6e6660',
    accentLine:    'rgba(255,255,255,0.06)',
  },
  light: {
    bgCard:        '#faf7f2',
    borderColor:   'rgba(0,0,0,0.10)',
    textPrimary:   '#1a1714',
    textSecondary: '#4a4540',
    textMuted:     '#8a8278',
    accentLine:    'rgba(0,0,0,0.07)',
  },
};

const CARD_W      = 640;
const PAD         = 40;
const PAD_BOTTOM  = 20;

function hex2rgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fmtValue(param, value) {
  if (param.type === 'select') return value;
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

function drawDot(ctx, x, y, radius, filled, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function measureDescHeight(ctx, text, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let lines = 1;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW) { line = word; lines++; }
    else line = test;
  }
  return lines * lineH;
}

export function exportCard(filmSimId, params, sensorLabel) {
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const t     = THEME[theme];
  const sim   = FILM_SIMS.find(s => s.id === filmSimId) ?? FILM_SIMS[0];

  const barH     = 6;
  const rowH     = 36;
  const maxDescW = CARD_W - PAD * 2 - 32;

  // ── Measure pass to get exact canvas height ───────────────────────────────
  const mc = document.createElement('canvas').getContext('2d');
  mc.font = '400 12px Inter, system-ui, sans-serif';
  const descH      = measureDescHeight(mc, sim.inspiredBy, maxDescW, 16);
  const paramCount = PARAMETERS.filter(p => params[p.id] !== undefined).length;

  const totalH =
    PAD +
    barH + 32 +   // accent bar + branding row
    14 +           // gap to sim name box
    72 +           // sim name box
    44 + descH +   // description
    24 + 1 + 20 +  // divider
    16 +           // section label
    paramCount * rowH +
    16 + 14 +      // footer gap + text
    PAD_BOTTOM;

  // ── Draw pass ─────────────────────────────────────────────────────────────
  const canvas  = document.createElement('canvas');
  canvas.width  = CARD_W;
  canvas.height = Math.ceil(totalH);
  const ctx     = canvas.getContext('2d');
  const CARD_H  = canvas.height;

  // Card background fill
  ctx.fillStyle = t.bgCard;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD - PAD_BOTTOM, 18);
  ctx.fill();

  // Border
  ctx.strokeStyle = t.borderColor;
  ctx.lineWidth   = 1;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD - PAD_BOTTOM, 18);
  ctx.stroke();

  // Accent bar
  ctx.fillStyle = sim.accentColor;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, barH + 18, 18);
  ctx.fill();
  ctx.fillRect(PAD, PAD + 12, CARD_W - PAD * 2, barH + 6);

  // Branding + sensor label
  let cy = PAD + barH + 32;
  ctx.font         = '500 11px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '0.12em';
  ctx.fillStyle    = t.textMuted;
  ctx.textAlign    = 'left';
  ctx.fillText('FUJIFILM RECIPE', PAD + 16, cy);
  ctx.textAlign    = 'right';
  ctx.fillText(sensorLabel ?? '', CARD_W - PAD - 16, cy);
  ctx.letterSpacing = '0';

  // Sim name box
  cy += 14;
  const { r, g, b } = hex2rgb(sim.accentColor);
  ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
  drawRoundRect(ctx, PAD + 16, cy, CARD_W - PAD * 2 - 32, 72, 10);
  ctx.fill();

  cy += 20;
  ctx.textAlign = 'left';
  ctx.font      = 'bold 34px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.fillStyle = t.textPrimary;
  ctx.fillText(sim.name, PAD + 28, cy + 26);

  // Description
  cy += 44;
  ctx.font      = '400 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = t.textSecondary;
  let descLine  = '';
  let descY     = cy;
  for (const word of sim.inspiredBy.split(' ')) {
    const test = descLine ? descLine + ' ' + word : word;
    if (ctx.measureText(test).width > maxDescW) {
      ctx.fillText(descLine, PAD + 28, descY);
      descLine = word;
      descY += 16;
    } else {
      descLine = test;
    }
  }
  if (descLine) ctx.fillText(descLine, PAD + 28, descY);

  // Divider
  cy = descY + 24;
  ctx.strokeStyle = t.accentLine;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 16,         cy);
  ctx.lineTo(CARD_W - PAD - 16, cy);
  ctx.stroke();
  cy += 20;

  // Section label
  ctx.font         = '500 10px Inter, system-ui, sans-serif';
  ctx.fillStyle    = t.textMuted;
  ctx.letterSpacing = '0.10em';
  ctx.textAlign    = 'left';
  ctx.fillText('PARAMETERS', PAD + 16, cy);
  ctx.letterSpacing = '0';
  cy += 16;

  // Parameter rows
  const dotR   = 3.5;
  const dotGap = 8;

  for (const param of PARAMETERS) {
    const value = params[param.id];
    if (value === undefined) continue;

    const rowX = PAD + 16;
    const rowW = CARD_W - PAD * 2 - 32;

    ctx.fillStyle = t.textPrimary;
    ctx.font      = '400 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(param.label, rowX, cy + 21);

    ctx.font      = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const displayVal = fmtValue(param, value);

    const isDefault = (param.type === 'range' && value === 0) ||
                      (param.type === 'select' && value === 'Off') ||
                      (param.id === 'grainSize' && params.grainRoughness === 'Off');
    ctx.fillStyle = isDefault ? t.textMuted : sim.accentColor;
    ctx.fillText(displayVal, CARD_W - PAD - 16, cy + 21);

    if (param.type === 'range') {
      const [minV, maxV] = param.range;
      const steps   = maxV - minV;
      const trackW  = steps * (dotR * 2 + dotGap) - dotGap;
      const trackX  = CARD_W - PAD - 16 - ctx.measureText(displayVal).width - 28 - trackW;
      const trackCy = cy + 21 - dotR;

      for (let i = 0; i <= steps; i++) {
        const v      = minV + i;
        const dotX   = trackX + i * (dotR * 2 + dotGap) + dotR;
        const active = (value >= 0 && v >= 0 && v <= value) ||
                       (value <  0 && v <= 0 && v >= value);
        drawDot(ctx, dotX, trackCy, dotR, active, active ? sim.accentColor : t.textMuted);
      }
    }

    ctx.strokeStyle = t.accentLine;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(rowX,        cy + rowH);
    ctx.lineTo(rowX + rowW, cy + rowH);
    ctx.stroke();

    cy += rowH;
  }

  // Footer
  cy += 16;
  ctx.font         = '500 10px Inter, system-ui, sans-serif';
  ctx.fillStyle    = t.textMuted;
  ctx.letterSpacing = '0.08em';
  ctx.textAlign    = 'center';
  ctx.fillText('fujifilm-recipe-helper', CARD_W / 2, cy);
  ctx.letterSpacing = '0';

  // Download
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `${filmSimId}-recipe.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
