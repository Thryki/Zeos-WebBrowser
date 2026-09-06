import { AsciiLab } from './engine.js';
import { createPanel } from './panel.js';
import { buildWordmarkWhenReady } from './wordmark.js';
import { EFFECT_PRESETS } from './presets.js';
import { ZEOS_DEFAULTS, TOOL_DEFAULTS, applyPreset, normalize, deepMerge, clone } from './settings.js';

// Boots the 3D panel as the new tab's background and hangs the lab's controls
// off the gear button. Everything here is presentation: the page works with the
// whole module absent, which is what the "nova aba com 3D" setting turns off.

const SAVE_DELAY = 400;

export function mount3D({ host, toggleButton, initial, enabled, onPersist }) {
  if (!enabled) return null;

  const mountEl = document.createElement('div');
  mountEl.className = 'fx-canvas';
  host.appendChild(mountEl);

  // A Zeos addition: the lab renders into a fixed-ratio box, which leaves bars
  // down the sides when the box is a full-window backdrop.
  let state = normalize(deepMerge(ZEOS_DEFAULTS, initial?.settings || {}));
  let fitWindow = initial?.fitWindow !== false;
  let autoRotate = initial?.autoRotate !== false;

  const lab = new AsciiLab(mountEl, { autoRotate });
  lab.init();

  const sizeFor = () => {
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;
    if (fitWindow) return { width, height, aspect: width / height };
    const target = state.aspectRatio.width / state.aspectRatio.height;
    let boxWidth = width;
    let boxHeight = height;
    if (boxWidth / boxHeight > target) boxWidth = boxHeight * target;
    else boxHeight = boxWidth / target;
    return { width: Math.max(320, boxWidth), height: Math.max(240, boxHeight), aspect: target };
  };

  const resize = () => {
    const { width, height, aspect } = sizeFor();
    mountEl.style.width = `${Math.round(width)}px`;
    mountEl.style.height = `${Math.round(height)}px`;
    lab.setSize(width, height, aspect);
  };

  let saveTimer = null;
  const persist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      onPersist?.({ settings: state, fitWindow, autoRotate });
    }, SAVE_DELAY);
  };

  const panel = createPanel({
    getSettings: () => state,
    onChange: (update) => {
      state = normalize(deepMerge(state, update));
      lab.apply(state);
      if (!fitWindow && (update.aspectRatio)) resize();
      panel.sync(state, { autoRotate });
      persist();
    },
    onFile: async (file) => {
      panel.setStatus('Carregando...', 'busy');
      try {
        const result = await lab.loadFile(file);
        // Media brings its own proportions and should not keep spinning.
        if (result.kind !== 'model') {
          autoRotate = false;
          lab.setAutoRotate(false);
          state = normalize(deepMerge(state, {
            aspectRatio: { width: result.width, height: result.height },
          }));
          lab.apply(state);
        }
        panel.sync(state, { autoRotate });
        panel.setStatus('Carregado.', 'ok');
        persist();
      } catch (error) {
        panel.setStatus(error.message || 'Falha ao carregar.', 'error');
      }
    },
    onAction: async (action, value) => {
      if (action === 'close') {
        setOpen(false);
        return;
      }
      if (action === 'reset-camera') {
        lab.resetCamera();
        return;
      }
      if (action === 'toggle-rotation') {
        autoRotate = !autoRotate;
        lab.setAutoRotate(autoRotate);
        panel.sync(state, { autoRotate });
        persist();
        return;
      }
      if (action === 'preset') {
        if (value === 'none') state = normalize(clone(TOOL_DEFAULTS));
        else {
          const preset = EFFECT_PRESETS.find((entry) => entry.id === value);
          if (!preset) return;
          state = applyPreset(state, preset.settings);
        }
        lab.apply(state);
        panel.sync(state, { autoRotate });
        persist();
        return;
      }
      if (action === 'export-image') {
        panel.setStatus('Exportando imagem...', 'busy');
        const data = await lab.exportImage(2);
        download(data, 'zeos-3d.png');
        panel.setStatus('Imagem exportada.', 'ok');
        return;
      }
      if (action === 'export-video') {
        panel.setStatus('Gravando 5s...', 'busy');
        const url = await lab.exportVideo(1, (progress) => {
          panel.setStatus(`Gravando ${Math.round(progress * 100)}%...`, 'busy');
        });
        download(url, 'zeos-3d.webm');
        panel.setStatus('Vídeo exportado.', 'ok');
      }
    },
  });

  document.body.appendChild(panel.root);

  function download(href, filename) {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  let open = false;
  function setOpen(next) {
    open = next;
    panel.root.classList.toggle('open', open);
    host.classList.toggle('fx-open', open);
    toggleButton.setAttribute('aria-expanded', String(open));
    if (open) panel.sync(state, { autoRotate });
  }

  toggleButton.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });

  window.addEventListener('resize', resize);
  // A new tab left in the background should not keep a GPU busy.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) lab.stop();
    else lab.start();
  });

  // The wordmark modelled in Blender from the logo's own vector outlines. The
  // bitmap-extruded one stays as a fallback so the tab is never empty if the
  // asset goes missing.
  const FIT = { margin: 2.1, anchor: 0.19 };
  lab.loadModelUrl('../assets/zeos-wordmark.glb')
    .catch(() => buildWordmarkWhenReady('ZEOS'))
    .then((model) => {
      if (model) lab.setModel(model, { frame: 'fit', fit: FIT });
      lab.apply(state);
    });

  resize();
  lab.apply(state);
  panel.sync(state, { autoRotate });
  lab.start();
  setOpen(false);

  return { lab, panel, setOpen };
}
