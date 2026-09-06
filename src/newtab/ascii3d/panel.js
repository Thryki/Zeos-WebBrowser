import { FONT_OPTIONS, EFFECT_TYPES, MATRIX_TYPES, ACCEPTED_EXTENSIONS } from './settings.js';
import { EFFECT_PRESETS } from './presets.js';

// The lab's control panel, rebuilt in the browser's own visual language.
// Every control is built once and only shown or hidden as the state changes:
// rebuilding the tree on each edit would drop focus and break a slider drag
// half-way through.

const icon = (name, size = 14) => (globalThis.iconMarkup ? globalThis.iconMarkup(name, size) : '');

const HEX = /^#[0-9a-fA-F]{6}$/;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function field(labelText, control) {
  const wrap = el('div', 'fx-field');
  const label = el('label', 'fx-label', labelText);
  if (control.id) label.htmlFor = control.id;
  wrap.append(label, control);
  wrap.labelEl = label;
  return wrap;
}

function slider(id, { min, max, step, value }) {
  const input = el('input', 'fx-slider');
  input.type = 'range';
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  return input;
}

function select(id, options, value) {
  const node = el('select', 'fx-select');
  node.id = id;
  for (const option of options) {
    const item = el('option', null, option.label);
    item.value = String(option.value);
    if (option.disabled) item.disabled = true;
    node.appendChild(item);
  }
  node.value = String(value);
  return node;
}

function switchBox(id, checked) {
  const input = el('input', 'fx-check');
  input.type = 'checkbox';
  input.id = id;
  input.checked = Boolean(checked);
  return input;
}

// A swatch plus a hex field that share one value. The lab gated its hex input
// so tightly that typing a colour by hand never committed; here the text stays
// as typed and only a complete six-digit hex is written through.
function colorRow(id, value, onChange) {
  const row = el('div', 'fx-color');
  const swatch = el('input', 'fx-swatch');
  swatch.type = 'color';
  swatch.id = id;
  swatch.value = value;
  const hex = el('input', 'fx-hex');
  hex.type = 'text';
  hex.spellcheck = false;
  hex.value = value;

  swatch.addEventListener('input', () => {
    hex.value = swatch.value;
    onChange(swatch.value);
  });
  hex.addEventListener('input', () => {
    const text = hex.value.trim();
    if (!HEX.test(text)) return;
    swatch.value = text;
    onChange(text);
  });

  row.append(swatch, hex);
  row.set = (next) => {
    swatch.value = next;
    if (document.activeElement !== hex) hex.value = next;
  };
  return row;
}

function section(title, iconName, open) {
  const details = el('details', 'fx-section');
  details.open = open;
  const summary = el('summary', 'fx-summary');
  const mark = el('span', 'fx-summary-icon');
  mark.innerHTML = icon(iconName, 14);
  summary.append(mark, el('span', null, title));
  const body = el('div', 'fx-body');
  details.append(summary, body);
  details.body = body;
  return details;
}

// The preset list, with the lab's own grouping headers.
function presetOptions() {
  const groups = [
    { label: 'EFEITOS ASCII', prefix: 'ascii-' },
    { label: 'EFEITOS DITHER', prefix: 'dither-' },
    { label: 'MISTOS', prefix: 'mixed-' },
  ];
  const options = [{ value: 'none', label: 'Nenhum (personalizado)' }];
  for (const group of groups) {
    const members = EFFECT_PRESETS.filter((preset) => preset.id.startsWith(group.prefix));
    if (!members.length) continue;
    options.push({ value: `header:${group.prefix}`, label: group.label, disabled: true });
    for (const preset of members) options.push({ value: preset.id, label: preset.name });
  }
  return options;
}

export function createPanel({ getSettings, onChange, onFile, onAction }) {
  const root = el('aside', 'fx-panel');
  root.setAttribute('aria-label', 'Configurações do efeito 3D');

  const head = el('div', 'fx-head');
  head.append(el('h2', null, 'Efeito 3D'));
  const closeBtn = el('button', 'fx-icon-btn');
  closeBtn.type = 'button';
  closeBtn.title = 'Fechar';
  closeBtn.setAttribute('aria-label', 'Fechar configurações');
  closeBtn.innerHTML = icon('x', 14);
  closeBtn.addEventListener('click', () => onAction('close'));
  head.appendChild(closeBtn);
  root.appendChild(head);

  const scroll = el('div', 'fx-scroll');
  root.appendChild(scroll);

  const patch = (path, value) => {
    const keys = path.split('.');
    const update = {};
    let cursor = update;
    for (let index = 0; index < keys.length - 1; index += 1) {
      cursor[keys[index]] = {};
      cursor = cursor[keys[index]];
    }
    cursor[keys[keys.length - 1]] = value;
    onChange(update);
  };

  const settings = () => getSettings();

  // ---- Arquivo e tela -----------------------------------------------------
  const fileSection = section('Arquivo e tela', 'folder-open', true);

  const drop = el('div', 'fx-drop');
  drop.tabIndex = 0;
  drop.setAttribute('role', 'button');
  const dropIcon = el('div', 'fx-drop-icon');
  dropIcon.innerHTML = icon('download', 20);
  drop.append(dropIcon, el('p', null, 'Clique ou arraste um modelo 3D, imagem ou vídeo'));
  const dropHint = el('p', 'fx-drop-hint', ACCEPTED_EXTENSIONS.join(' '));
  drop.appendChild(dropHint);

  const fileInput = el('input');
  fileInput.type = 'file';
  fileInput.accept = ACCEPTED_EXTENSIONS.join(',');
  fileInput.hidden = true;
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) onFile(fileInput.files[0]);
    fileInput.value = '';
  });
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
  for (const type of ['dragenter', 'dragover']) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      drop.classList.add('over');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      drop.classList.remove('over');
      if (type === 'drop' && event.dataTransfer?.files?.[0]) onFile(event.dataTransfer.files[0]);
    });
  }

  // The lab passes a status string down and never renders it, so a rejected
  // file fails silently. Here it is visible.
  const status = el('p', 'fx-status');
  status.hidden = true;

  const ratio = el('div', 'fx-ratio');
  const ratioW = el('input', 'fx-num');
  ratioW.type = 'number';
  ratioW.id = 'fx-ratio-w';
  ratioW.step = '0.1';
  const ratioH = el('input', 'fx-num');
  ratioH.type = 'number';
  ratioH.id = 'fx-ratio-h';
  ratioH.step = '0.1';
  ratio.append(ratioW, el('span', 'fx-sep', ':'), ratioH);
  ratioW.addEventListener('input', () => patch('aspectRatio.width', parseFloat(ratioW.value) || 1));
  ratioH.addEventListener('input', () => patch('aspectRatio.height', parseFloat(ratioH.value) || 1));

  const actions = el('div', 'fx-actions');
  const rotateBtn = el('button', 'fx-btn');
  rotateBtn.type = 'button';
  rotateBtn.addEventListener('click', () => onAction('toggle-rotation'));
  const resetBtn = el('button', 'fx-btn', 'Recentralizar');
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => onAction('reset-camera'));
  const pngBtn = el('button', 'fx-btn', 'Exportar PNG');
  pngBtn.type = 'button';
  pngBtn.addEventListener('click', () => onAction('export-image'));
  const webmBtn = el('button', 'fx-btn', 'Exportar vídeo');
  webmBtn.type = 'button';
  webmBtn.addEventListener('click', () => onAction('export-video'));
  actions.append(rotateBtn, resetBtn, pngBtn, webmBtn);

  fileSection.body.append(drop, fileInput, status, field('Proporção', ratio), actions);
  scroll.appendChild(fileSection);

  // ---- Luz ----------------------------------------------------------------
  const lightSection = section('Luz', 'lightbulb', false);
  const angle = slider('fx-angle', { min: -180, max: 180, step: 5, value: -45 });
  const angleField = field('Ângulo', angle);
  angle.addEventListener('input', () => patch('lighting.directionalAngle', Number(angle.value)));
  const intensity = slider('fx-intensity', { min: 0, max: 200, step: 5, value: 80 });
  const intensityField = field('Intensidade', intensity);
  intensity.addEventListener('input', () => patch('lighting.intensity', Number(intensity.value)));
  lightSection.body.append(angleField, intensityField);
  scroll.appendChild(lightSection);

  // ---- Efeito -------------------------------------------------------------
  const fxSection = section('Efeito', 'palette', true);

  const preset = select('fx-preset', presetOptions(), 'none');
  preset.addEventListener('change', () => {
    if (preset.value.startsWith('header:')) return;
    onAction('preset', preset.value);
  });
  const effectType = select('fx-type', EFFECT_TYPES, 'ascii');
  effectType.addEventListener('change', () => patch('effectType', effectType.value));
  fxSection.body.append(field('Predefinições', preset), field('Tipo de efeito', effectType));

  const tunables = el('div', 'fx-group');
  fxSection.body.appendChild(tunables);

  const levels = el('div', 'fx-block');
  levels.appendChild(el('div', 'fx-subtitle', 'Níveis'));
  const brightness = slider('fx-brightness', { min: -0.5, max: 0.5, step: 0.01, value: 0 });
  const brightnessField = field('Brilho', brightness);
  brightness.addEventListener('input', () => patch('brightness', Number(brightness.value)));
  const contrast = slider('fx-contrast', { min: 0.5, max: 2.5, step: 0.01, value: 1 });
  const contrastField = field('Contraste', contrast);
  contrast.addEventListener('input', () => patch('contrast', Number(contrast.value)));
  levels.append(brightnessField, contrastField);

  const asciiBlock = el('div', 'fx-block');
  asciiBlock.appendChild(el('div', 'fx-subtitle', 'ASCII'));
  const font = select('fx-font', FONT_OPTIONS, 'monospace');
  font.addEventListener('change', () => patch('ascii.font', font.value));
  const characters = el('input', 'fx-text');
  characters.type = 'text';
  characters.id = 'fx-characters';
  characters.spellcheck = false;
  characters.addEventListener('input', () => patch('ascii.characters', characters.value));
  const resolution = slider('fx-resolution', { min: 2, max: 14, step: 1, value: 6 });
  const resolutionField = field('Resolução', resolution);
  resolution.addEventListener('input', () => patch('ascii.resolution', Number(resolution.value)));
  const charScale = slider('fx-char-scale', { min: 0.1, max: 1.5, step: 0.05, value: 0.9 });
  const charScaleField = field('Escala do caractere', charScale);
  charScale.addEventListener('input', () => patch('ascii.scale', Number(charScale.value)));

  const trioSwitch = switchBox('fx-trio', false);
  const trioRow = el('label', 'fx-strip');
  trioRow.append(el('span', null, 'Caracteres em 3 cores'), trioSwitch);
  trioSwitch.addEventListener('change', () => patch('ascii.useColorTrio', trioSwitch.checked));

  const inkRow = colorRow('fx-ink', '#000000', (value) => patch('ascii.color', value));
  const inkField = field('Cor do caractere', inkRow);
  const trioFields = ['Sombras', 'Meios-tons', 'Luzes'].map((label, index) => {
    const row = colorRow(`fx-trio-${index}`, '#000000', (value) => {
      const next = [...settings().ascii.colorTrio];
      next[index] = value;
      patch('ascii.colorTrio', next);
    });
    const wrap = field(label, row);
    wrap.row = row;
    return wrap;
  });

  asciiBlock.append(
    field('Fonte', font),
    field('Caracteres', characters),
    resolutionField,
    charScaleField,
    trioRow,
    inkField,
    ...trioFields,
  );

  const ditherBlock = el('div', 'fx-block');
  ditherBlock.appendChild(el('div', 'fx-subtitle', 'Dither'));
  const matrix = select('fx-matrix', MATRIX_TYPES, 2);
  matrix.addEventListener('change', () => patch('dither.matrixType', parseInt(matrix.value, 10)));
  const matrixField = field('Tipo de matriz', matrix);
  const ditherScale = slider('fx-dither-scale', { min: 1, max: 32, step: 1, value: 3 });
  const ditherScaleField = field('Escala do dither', ditherScale);
  ditherScale.addEventListener('input', () => patch('dither.scale', Number(ditherScale.value)));
  ditherBlock.append(matrixField, ditherScaleField);

  const colorsBlock = el('div', 'fx-block');
  const paletteSwitch = switchBox('fx-use-palette', true);
  const paletteRow = el('label', 'fx-strip');
  paletteRow.append(el('span', null, 'Paleta de cores'), paletteSwitch);
  paletteSwitch.addEventListener('change', () => patch('colors.usePalette', paletteSwitch.checked));

  const bgRow = colorRow('fx-bg', '#eeeeee', (value) => patch('colors.background', value));
  const bgField = field('Fundo', bgRow);

  const reverseSwitch = switchBox('fx-reverse', false);
  const reverseRow = el('label', 'fx-strip');
  reverseRow.append(el('span', null, 'Inverter paleta'), reverseSwitch);
  reverseSwitch.addEventListener('change', () => patch('colors.reversePalette', reverseSwitch.checked));

  const paletteList = el('div', 'fx-palette');
  let paletteRows = [];

  function buildPalette(count) {
    paletteList.replaceChildren();
    paletteRows = [];
    for (let index = 0; index < count; index += 1) {
      const card = el('div', 'fx-swatch-card');
      const header = el('div', 'fx-swatch-head');
      const active = switchBox(`fx-active-${index}`, true);
      active.addEventListener('change', () => {
        const next = [...settings().colors.active];
        next[index] = active.checked;
        patch('colors.active', next);
      });
      header.append(el('span', null, `Cor ${index + 1}`), active);
      const row = colorRow(`fx-color-${index}`, '#000000', (value) => {
        const next = [...settings().colors.palette];
        next[index] = value;
        patch('colors.palette', next);
      });
      card.append(header, row);
      paletteList.appendChild(card);
      paletteRows.push({ active, row });
    }
  }

  colorsBlock.append(paletteRow, bgField, reverseRow, paletteList);
  tunables.append(levels, asciiBlock, ditherBlock, colorsBlock);
  scroll.appendChild(fxSection);

  // ---- Sync ---------------------------------------------------------------
  function sync(state, { autoRotate } = {}) {
    const isNone = state.effectType === 'none';
    const isAscii = state.effectType === 'ascii';
    const isDither = state.effectType === 'bayer' || state.effectType === 'noise';

    effectType.value = state.effectType;
    tunables.hidden = isNone;
    asciiBlock.hidden = !isAscii;
    ditherBlock.hidden = !isDither;
    matrixField.hidden = state.effectType !== 'bayer';

    if (document.activeElement !== ratioW) ratioW.value = String(state.aspectRatio.width);
    if (document.activeElement !== ratioH) ratioH.value = String(state.aspectRatio.height);

    angle.value = String(state.lighting.directionalAngle);
    angleField.labelEl.textContent = `Ângulo: ${state.lighting.directionalAngle}°`;
    intensity.value = String(state.lighting.intensity);
    intensityField.labelEl.textContent = `Intensidade: ${state.lighting.intensity}%`;

    brightness.value = String(state.brightness);
    brightnessField.labelEl.textContent = `Brilho: ${state.brightness.toFixed(2)}`;
    contrast.value = String(state.contrast);
    contrastField.labelEl.textContent = `Contraste: ${state.contrast.toFixed(2)}`;

    font.value = state.ascii.font;
    if (document.activeElement !== characters) characters.value = state.ascii.characters;
    resolution.value = String(state.ascii.resolution);
    resolutionField.labelEl.textContent = `Resolução ASCII: ${state.ascii.resolution}`;
    charScale.value = String(state.ascii.scale);
    charScaleField.labelEl.textContent = `Escala do caractere: ${state.ascii.scale.toFixed(2)}`;

    trioSwitch.checked = state.ascii.useColorTrio;
    inkField.hidden = state.ascii.useColorTrio;
    inkRow.set(state.ascii.color);
    trioFields.forEach((wrap, index) => {
      wrap.hidden = !state.ascii.useColorTrio;
      wrap.row.set(state.ascii.colorTrio[index]);
    });

    matrix.value = String(state.dither.matrixType);
    ditherScale.value = String(state.dither.scale);
    ditherScaleField.labelEl.textContent = `Escala do dither: ${state.dither.scale}`;

    paletteSwitch.checked = state.colors.usePalette;
    // The lab only offers Background in ASCII mode without a palette, because
    // that is the only mode where it reaches a uniform.
    bgField.hidden = state.colors.usePalette || !isAscii;
    bgRow.set(state.colors.background);
    reverseRow.hidden = !state.colors.usePalette;
    reverseSwitch.checked = state.colors.reversePalette;
    paletteList.hidden = !state.colors.usePalette;

    if (paletteRows.length !== state.colors.palette.length) buildPalette(state.colors.palette.length);
    paletteRows.forEach((entry, index) => {
      entry.active.checked = Boolean(state.colors.active[index]);
      entry.row.set(state.colors.palette[index]);
    });

    rotateBtn.textContent = autoRotate ? 'Parar rotação' : 'Girar';
  }

  function setStatus(message, tone) {
    status.hidden = !message;
    status.textContent = message || '';
    status.dataset.tone = tone || '';
  }

  return { root, sync, setStatus };
}
