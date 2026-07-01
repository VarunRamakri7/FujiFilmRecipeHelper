import { FILM_SIMS }  from '../data/filmSimulations.js';
import { PARAMETERS } from '../data/parameters.js';

// ── Theme palette lookup (matches variables.css) ───────────────────────────
const THEME = {
  dark: {
    bgPage:      '#14120f',
    bgCard:      '#1e1a16',
    borderColor: 'rgba(255,255,255,0.08)',
    textPrimary: '#f0ebe2',
    textSecondary:'#b8b0a4',
    textMuted:   '#6e6660',
    surface1:    '#28231e',
    accentLine:  'rgba(255,255,255,0.06)',
  },
  light: {
    bgPage:      '#e8e2d8',
    bgCard:      '#faf7f2',
    borderColor: 'rgba(0,0,0,0.10)',
    textPrimary: '#1a1714',
    textSecondary:'#4a4540',
    textMuted:   '#8a8278',
    surface1:    '#f0ebe3',
    accentLine:  'rgba(0,0,0,0.07)',
  },
};

const CARD_W = 640;
const CARD_H = 820;
const PAD    = 40;

function hex2rgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Format a parameter value for display (e.g., "+2", "–1", "Weak")
function fmtValue(param, value) {
  if (param.type === 'select') return value;
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

// Draw a small dot indicator for range values mapped 0→1
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

export function exportCard(filmSimId, params, sensorLabel) {
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const t = THEME[theme];

  const sim = FILM_SIMS.find(s => s.id === filmSimId) ?? FILM_SIMS[0];

  const canvas = document.createElement('canvas');
  canvas.width  = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = t.bgPage;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Card surface
  ctx.fillStyle = t.bgCard;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD * 2, 18);
  ctx.fill();

  // Card border
  ctx.strokeStyle = t.borderColor;
  ctx.lineWidth = 1;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD * 2, 18);
  ctx.stroke();

  // ── Accent bar (sim color) ────────────────────────────────────────────────
  const barH = 6;
  ctx.fillStyle = sim.accentColor;
  drawRoundRect(ctx, PAD, PAD, CARD_W - PAD * 2, barH + 18, 18);
  ctx.fill();
  // Flatten bottom of bar
  ctx.fillRect(PAD, PAD + 12, CARD_W - PAD * 2, barH + 6);

  // ── Header: branding + sensor ─────────────────────────────────────────────
  let cy = PAD + barH + 32;

  ctx.fillStyle = t.textMuted;
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '0.12em';
  ctx.textAlign = 'left';
  ctx.fillText('FUJIFILM RECIPE', PAD + 16, cy);

  ctx.textAlign = 'right';
  ctx.fillStyle = t.textMuted;
  ctx.fillText(sensorLabel ?? '', CARD_W - PAD - 16, cy);

  ctx.letterSpacing = '0';

  // ── Film Sim name ─────────────────────────────────────────────────────────
  cy += 14;
  const accentRgb = hex2rgb(sim.accentColor);
  ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`;
  drawRoundRect(ctx, PAD + 16, cy, CARD_W - PAD * 2 - 32, 72, 10);
  ctx.fill();

  cy += 20;
  ctx.textAlign = 'left';
  ctx.font = 'bold 34px "Bebas Neue", "Arial Narrow", sans-serif';
  ctx.fillStyle = t.textPrimary;
  ctx.fillText(sim.name, PAD + 28, cy + 26);

  // Short description line
  cy += 44;
  ctx.font = '400 12px Inter, system-ui, sans-serif';
  ctx.fillStyle = t.textSecondary;
  const descWords = sim.inspiredBy.split(' ');
  let descLine = '';
  const maxDescW = CARD_W - PAD * 2 - 32;
  let descY = cy;
  for (const word of descWords) {
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

  // ── Divider ───────────────────────────────────────────────────────────────
  cy = descY + 24;
  ctx.strokeStyle = t.accentLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 16, cy);
  ctx.lineTo(CARD_W - PAD - 16, cy);
  ctx.stroke();
  cy += 20;

  // ── Section label ─────────────────────────────────────────────────────────
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.fillStyle = t.textMuted;
  ctx.letterSpacing = '0.10em';
  ctx.textAlign = 'left';
  ctx.fillText('PARAMETERS', PAD + 16, cy);
  ctx.letterSpacing = '0';
  cy += 16;

  // ── Parameter rows ────────────────────────────────────────────────────────
  const rowH  = 36;
  const dotR  = 3.5;
  const dotGap = 8;

  for (const param of PARAMETERS) {
    const value = params[param.id];
    if (value === undefined) continue;

    // Row background alternation (subtle)
    const rowX = PAD + 16;
    const rowW = CARD_W - PAD * 2 - 32;

    ctx.fillStyle = t.textPrimary;
    ctx.font = '400 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(param.label, rowX, cy + 21);

    // Value
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const displayVal = fmtValue(param, value);

    // Color the value: accent for non-zero/non-Off, muted for zero/Off
    const isDefault = (param.type === 'range' && value === 0) ||
                      (param.type === 'select' && value === 'Off') ||
                      (param.type === 'select' && param.id === 'grainSize' && params.grainRoughness === 'Off');
    ctx.fillStyle = isDefault ? t.textMuted : sim.accentColor;
    ctx.fillText(displayVal, CARD_W - PAD - 16, cy + 21);

    // Mini dot track for range params
    if (param.type === 'range') {
      const [minV, maxV] = param.range;
      const total = maxV - minV;
      const steps = total;
      const trackW = steps * (dotR * 2 + dotGap) - dotGap;
      const trackX = CARD_W - PAD - 16 - ctx.measureText(displayVal).width - 16 - trackW;
      const trackCy = cy + 21 - dotR;

      for (let i = 0; i <= steps; i++) {
        const v = minV + i;
        const dotX = trackX + i * (dotR * 2 + dotGap) + dotR;
        const active = (value >= 0 && v >= 0 && v <= value) ||
                       (value < 0  && v <= 0 && v >= value);
        drawDot(ctx, dotX, trackCy, dotR, active, active ? sim.accentColor : t.textMuted);
      }
    }

    // Divider
    ctx.strokeStyle = t.accentLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rowX, cy + rowH);
    ctx.lineTo(rowX + rowW, cy + rowH);
    ctx.stroke();

    cy += rowH;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  cy += 16;
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.fillStyle = t.textMuted;
  ctx.letterSpacing = '0.08em';
  ctx.textAlign = 'center';
  ctx.fillText('fujifilm-recipe-helper', CARD_W / 2, cy);
  ctx.letterSpacing = '0';

  // ── Trigger download ──────────────────────────────────────────────────────
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
