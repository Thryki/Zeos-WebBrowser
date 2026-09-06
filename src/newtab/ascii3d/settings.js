// Effect state for the 3D panel, ported from Razi's 3D ASCII & Dither Lab.
// The control surface, the value ranges and the setting paths are the tool's;
// only the opening colours are Zeos's, because the original opens on a white
// canvas and this runs behind a dark new tab.

// The tool's own defaults, kept verbatim so "Nenhum (personalizado)" restores
// exactly what the lab starts with.
export const TOOL_DEFAULTS = {
  effectType: 'ascii',
  brightness: 0.0,
  contrast: 1.0,
  target: {
    mode: 'fullScene',
    background: {
      type: 'solid',
      solidColor: '#eeeeee',
      gradientStart: '#eeeeee',
      gradientEnd: '#ffffff',
      gradientDirection: 'vertical',
    },
  },
  ascii: {
    font: 'monospace',
    characters: ' .:-=+*#%@',
    resolution: 6,
    scale: 0.9,
    color: '#000000',
    colorTrio: ['#000000', '#333333', '#666666'],
    useColorTrio: false,
  },
  dither: {
    matrixType: 2,
    scale: 3,
  },
  colors: {
    usePalette: true,
    reversePalette: false,
    background: '#eeeeee',
    palette: ['#1b1c19', '#5f2398', '#025ffb', '#f0e800', '#f1cccc'],
    active: [true, true, true, true, true],
  },
  aspectRatio: { width: 1, height: 1 },
  lighting: { directionalAngle: -45, intensity: 80 },
  isDark: false,
};

// What a fresh Zeos new tab opens with: the lab's "Neon Cityscape" preset, with
// two departures. Its font is Roboto Mono, which this browser does not fetch
// from Google; IBM VGA carries the block glyphs the preset draws with anyway.
// And the scene ground is pinned to the palette's own darkest stop so the
// backdrop and the page agree.
export const ZEOS_DEFAULTS = deepMerge(TOOL_DEFAULTS, {
  effectType: 'ascii',
  brightness: 0.12,
  contrast: 1.65,
  ascii: {
    font: '"IBM VGA 8x16"',
    characters: ' ░▒▓█▌▐▀▄■□▬▭▮▯◘◙',
    resolution: 7,
    scale: 1,
    color: '#00ff80',
    colorTrio: ['#003322', '#00ff80', '#66ffaa'],
    useColorTrio: true,
  },
  target: { background: { solidColor: '#001122' } },
  colors: {
    usePalette: true,
    background: '#001122',
    palette: ['#001122', '#00ff80', '#ff0060', '#0080ff', '#ffff00', '#ff8000'],
    active: [true, true, true, true, true, true],
  },
  isDark: true,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Arrays are replaced wholesale, never merged element-wise: colors.palette and
// colors.active are parallel and a per-index merge would desynchronise them.
export function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return patch === undefined ? clone(base) : clone(patch);
  const out = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : clone(value);
  }
  return out;
}

export function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, inner] of Object.entries(value)) out[key] = clone(inner);
    return out;
  }
  return value;
}

// The lab spreads presets shallowly, which leaves ascii.colorTrio and
// ascii.useColorTrio undefined whenever a preset omits them and drops
// colors.reversePalette on every single one. Merging against the defaults
// instead keeps every key populated.
export function applyPreset(current, presetSettings) {
  const merged = deepMerge(current, presetSettings || {});
  return normalize(merged);
}

// Guards the two states the shaders cannot survive: a palette with no active
// entry (the dither pass divides by uPaletteColorCount with no zero check) and
// active/palette arrays of different lengths.
export function normalize(settings) {
  const out = deepMerge(ZEOS_DEFAULTS, settings);
  const palette = Array.isArray(out.colors.palette) && out.colors.palette.length
    ? out.colors.palette
    : clone(ZEOS_DEFAULTS.colors.palette);
  let active = Array.isArray(out.colors.active) ? out.colors.active.slice(0, palette.length) : [];
  while (active.length < palette.length) active.push(true);
  active = active.map(Boolean);
  if (!active.some(Boolean)) active = palette.map(() => true);
  out.colors.palette = palette;
  out.colors.active = active;

  const trio = Array.isArray(out.ascii.colorTrio) ? out.ascii.colorTrio.slice(0, 3) : [];
  while (trio.length < 3) trio.push(TOOL_DEFAULTS.ascii.colorTrio[trio.length]);
  out.ascii.colorTrio = trio;

  out.dither.matrixType = Number(out.dither.matrixType) || 0;
  out.ascii.resolution = Number(out.ascii.resolution) || TOOL_DEFAULTS.ascii.resolution;
  return out;
}

// Reversal is render-time only: the panel always lists the authored order, so
// Color 1 keeps meaning palette[0] no matter how the canvas is drawn.
export function effectiveSettings(settings) {
  if (!settings.colors.reversePalette) return settings;
  const out = clone(settings);
  out.colors.palette = [...settings.colors.palette].reverse();
  out.colors.active = [...settings.colors.active].reverse();
  return out;
}

// Only locally available faces. The lab pulls 13 of its 14 fonts from
// fonts.googleapis.com on demand; a browser that advertises itself as
// tracker-free cannot reach out to Google to draw its own new tab.
export const FONT_OPTIONS = [
  { value: 'monospace', label: 'Monospace padrão' },
  { value: '"IBM VGA 8x16"', label: 'IBM VGA 8x16' },
  { value: '"Brunea Mono"', label: 'Brunea Mono' },
  { value: '"IBM Plex Mono"', label: 'IBM Plex Mono' },
  { value: '"Cascadia Mono"', label: 'Cascadia Mono' },
  { value: 'Consolas', label: 'Consolas' },
  { value: '"Courier New"', label: 'Courier New' },
  { value: 'serif', label: 'Serifada' },
  { value: 'sans-serif', label: 'Sem serifa' },
];

export const EFFECT_TYPES = [
  { value: 'none', label: 'Nenhum' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'bayer', label: 'Dither Bayer' },
  { value: 'noise', label: 'Dither por ruído' },
];

export const MATRIX_TYPES = [
  { value: 0, label: '2x2 Bayer' },
  { value: 1, label: '4x4 Bayer' },
  { value: 2, label: '8x8 Bayer' },
  { value: 3, label: '16x16 Bayer' },
];

export const ACCEPTED_EXTENSIONS = [
  '.obj', '.glb', '.gltf',
  '.mp4', '.webm', '.mov',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
];
