// Ordered from oldest to newest. Used for gating: a feature with
// sensorMinGeneration 'xtrans-iii' is available if the user's generation
// index >= GENERATION_ORDER.indexOf('xtrans-iii').
export const GENERATION_ORDER = [
  'xtrans-i',
  'xtrans-ii',
  'xtrans-iii',
  'xtrans-iv-old',
  'xtrans-iv',
  'xtrans-v',
];

export const SENSOR_GENERATIONS = [
  {
    id: 'xtrans-i',
    label: 'X-Trans I',
    models: ['X-Pro1', 'X-E1', 'X-M1'],
    // Provia, Velvia, Astia, PRO Neg Hi/Std, Monochrome, Sepia
    supportedSimIds: ['provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia'],
  },
  {
    id: 'xtrans-ii',
    label: 'X-Trans II',
    models: ['X-T1', 'X-T10', 'X-E2', 'X-E2S', 'X100T', 'X70'],
    // + Classic Chrome, ACROS (base only — filter variants require X-Trans III)
    supportedSimIds: [
      'provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia',
      'classic-chrome', 'acros',
    ],
  },
  {
    id: 'xtrans-iii',
    label: 'X-Trans III',
    models: ['X-T2', 'X-T20', 'X-Pro2', 'X-E3', 'X100F', 'X-H1'],
    // + ACROS/Monochrome color filter variants, ETERNA/Cinema (via X-H1)
    supportedSimIds: [
      'provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia',
      'classic-chrome', 'acros', 'acros-ye', 'acros-r', 'acros-g',
      'eterna',
    ],
  },
  {
    id: 'xtrans-iv-old',
    label: 'X-Trans IV (Early)',
    models: ['X-T3', 'X-T30'],
    // Note: lacks Classic Neg, Eterna Bleach Bypass, Color Chrome Blue, Clarity, Grain Size
    supportedSimIds: [
      'provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia',
      'classic-chrome', 'acros', 'acros-ye', 'acros-r', 'acros-g',
      'eterna',
    ],
  },
  {
    id: 'xtrans-iv',
    label: 'X-Trans IV',
    models: ['X-T4', 'X-T30 II', 'X-Pro3', 'X100V', 'X-S10', 'X-E4'],
    // + Classic Neg, Eterna Bleach Bypass, Color Chrome Blue, Clarity, Grain Size
    supportedSimIds: [
      'provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia',
      'classic-chrome', 'acros', 'acros-ye', 'acros-r', 'acros-g',
      'eterna', 'classic-neg', 'eterna-bleach-bypass',
    ],
  },
  {
    id: 'xtrans-v',
    label: 'X-Trans V',
    models: ['X-T5', 'X-H2', 'X-H2S', 'X-T50', 'X-S20', 'X100VI'],
    // + Nostalgic Neg, Reala Ace
    supportedSimIds: [
      'provia', 'velvia', 'astia', 'pro-neg-hi', 'pro-neg-std', 'monochrome', 'sepia',
      'classic-chrome', 'acros', 'acros-ye', 'acros-r', 'acros-g',
      'eterna', 'classic-neg', 'eterna-bleach-bypass',
      'nostalgic-neg', 'reala-ace',
    ],
  },
];
