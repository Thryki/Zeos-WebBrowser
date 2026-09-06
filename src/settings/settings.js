'use strict';

// Static markup declares icons with data-icon; fill them from the Lucide set.
for (const holder of document.querySelectorAll('[data-icon]')) {
  holder.innerHTML = iconMarkup(holder.dataset.icon, 14);
}


const themesGrid = document.querySelector('#themes-grid');
const btnBack = document.querySelector('#btn-back');
const btnForward = document.querySelector('#btn-forward');
const btnReload = document.querySelector('#btn-reload');
const btnHome = document.querySelector('#btn-home');
const btnShowCpu = document.querySelector('#btn-show-cpu');
const btnShowRam = document.querySelector('#btn-show-ram');
const downloadModeSelect = document.querySelector('#download-mode');
const zoomOutBtn = document.querySelector('#zoom-out');
const zoomInBtn = document.querySelector('#zoom-in');
const zoomResetBtn = document.querySelector('#zoom-reset');
const zoomValueDisplay = document.querySelector('#zoom-value');
const bgInput = document.querySelector('#background');
const fgInput = document.querySelector('#foreground');
const accentInput = document.querySelector('#accent');
const fontSelect = document.querySelector('#font');
const initialPageInput = document.querySelector('#initial-page');
const searchProviderSelect = document.querySelector('#search-provider');
const notificationsCheck = document.querySelector('#notifications');
const microphoneCheck = document.querySelector('#microphone');
const cameraCheck = document.querySelector('#camera');
const newTab3DCheck = document.querySelector('#newtab-3d');
const clearCookiesBtn = document.querySelector('#clear-cookies');

// Chrome Extensions elements
const extensionsList = document.querySelector('#extensions-list');
const extensionsEmpty = document.querySelector('#extensions-empty');
const loadExtensionBtn = document.querySelector('#load-extension-btn');
const openExtensionsPageBtn = document.querySelector('#open-extensions-page-btn');

// History elements & Modal
const historyList = document.querySelector('#history');
const historySearchInput = document.querySelector('#history-search');
const filterChips = document.querySelectorAll('.filter-chip');
const openClearModalBtn = document.querySelector('#open-clear-modal-btn');
const clearHistoryModal = document.querySelector('#clear-history-modal');
const modalCloseBtn = document.querySelector('#modal-close-btn');
const modalCancelBtn = document.querySelector('#modal-cancel-btn');
const modalConfirmBtn = document.querySelector('#modal-confirm-btn');
const clearConfirmBox = document.querySelector('#clear-confirm-box');

let currentSettings = null;
let activeTimeFilter = 'all';
let currentSearchQuery = '';
let isConfirmingClear = false;

function applyThemeColors(appearance = {}) {
  const root = document.documentElement.style;
  root.setProperty('--bg', appearance.background || '#0b0b0b');
  root.setProperty('--fg', appearance.foreground || '#f5f5f5');
  root.setProperty('--accent', appearance.accent || '#22c55e');
  root.setProperty('--panel', appearance.panel || '#181818');
  root.setProperty('--panel-hover', appearance.panelHover || '#242424');
  root.setProperty('--border', appearance.border || '#2a2a2a');
  root.fontFamily = `"${appearance.font || 'IBM Plex Mono'}", Consolas, monospace`;
}

function renderThemes(themes, currentThemeId) {
  if (!themesGrid || !Array.isArray(themes)) return;
  themesGrid.replaceChildren();

  for (const theme of themes) {
    const card = document.createElement('div');
    const isActive = theme.id === currentThemeId;
    card.className = `theme-card${isActive ? ' active' : ''}`;

    const swatches = document.createElement('div');
    swatches.className = 'theme-swatches';
    for (const color of (theme.swatches || [])) {
      const swatch = document.createElement('span');
      swatch.className = 'theme-swatch';
      swatch.style.backgroundColor = color;
      swatches.appendChild(swatch);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'theme-name';
    nameEl.textContent = theme.name;
    const checkEl = document.createElement('span');
    checkEl.className = 'theme-check';
    checkEl.innerHTML = iconMarkup('check', 12);
    nameEl.appendChild(checkEl);

    const descEl = document.createElement('div');
    descEl.className = 'theme-desc';
    descEl.textContent = theme.desc;

    card.append(swatches, nameEl, descEl);

    card.addEventListener('click', () => {
      window.zeosSettings.update({ themeId: theme.id });
    });

    themesGrid.appendChild(card);
  }
}

async function loadExtensionsList() {
  if (!extensionsList || !window.zeosSettings?.extensions) return;
  extensionsList.replaceChildren();

  try {
    const exts = await window.zeosSettings.extensions.getAll();
    if (!exts || exts.length === 0) {
      if (extensionsEmpty) extensionsEmpty.style.display = 'block';
      extensionsList.style.display = 'none';
      return;
    }

    if (extensionsEmpty) extensionsEmpty.style.display = 'none';
    extensionsList.style.display = '';

    for (const ext of exts) {
      const row = document.createElement('div');
      row.className = 'row';

      const icon = document.createElement('div');
      icon.className = 'row-icon';
      if (ext.icon) {
        const img = document.createElement('img');
        img.src = ext.icon;
        img.alt = '';
        icon.appendChild(img);
      } else {
        icon.textContent = (ext.name || 'E')[0].toUpperCase();
      }

      const text = document.createElement('div');
      text.className = 'row-text';

      const name = document.createElement('strong');
      name.textContent = ext.name || 'Extensão';
      if (ext.builtin) {
        const badge = document.createElement('span');
        badge.className = 'row-badge';
        badge.textContent = 'Integrada';
        badge.title = 'Vem com o Zeos e não pode ser removida.';
        name.appendChild(badge);
      }

      const desc = document.createElement('span');
      desc.textContent = `v${ext.version || '1.0'} · ${ext.description || 'Extensão do Chrome ativa no navegador.'}`;

      text.append(name, desc);

      const lead = document.createElement('div');
      lead.className = 'row-lead';
      lead.append(icon, text);

      const control = document.createElement('div');
      control.className = 'row-control';
      if (!ext.builtin) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'action-btn danger-outline';
        removeBtn.textContent = 'Remover';
        removeBtn.addEventListener('click', async () => {
          if (confirm(`Deseja realmente remover a extensão "${ext.name}"?`)) {
            await window.zeosSettings.extensions.remove(ext.id);
            loadExtensionsList();
          }
        });
        control.appendChild(removeBtn);
      }

      row.append(lead, control);
      extensionsList.appendChild(row);
    }
  } catch (err) {
    console.error(err);
  }
}

// Sidebar navigation and settings search
const settingsNav = document.querySelector('#settings-nav');
const settingsSearch = document.querySelector('#settings-search');
const searchEmpty = document.querySelector('#search-empty');

function showPanel(name) {
  for (const panel of document.querySelectorAll('.panel')) {
    panel.classList.toggle('active', panel.dataset.panel === name);
  }
  for (const item of document.querySelectorAll('.nav-item')) {
    item.classList.toggle('active', item.dataset.panel === name);
  }
  window.scrollTo(0, 0);
}

if (settingsNav) {
  settingsNav.addEventListener('click', (event) => {
    const item = event.target.closest('.nav-item');
    if (!item) return;
    if (settingsSearch) settingsSearch.value = '';
    applySettingsSearch();
    showPanel(item.dataset.panel);
  });
}

// Typing in the search box flattens every panel into one filtered list.
// Accent-insensitive: searching "camera" must find "Câmera".
const foldText = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function applySettingsSearch() {
  const query = foldText(settingsSearch?.value).trim();
  document.body.classList.toggle('searching', Boolean(query));

  if (!query) {
    for (const row of document.querySelectorAll('.panel .row')) row.hidden = false;
    if (searchEmpty) searchEmpty.hidden = true;
    return;
  }

  let matches = 0;
  for (const row of document.querySelectorAll('.panel .row')) {
    const hit = foldText(row.textContent).includes(query);
    row.hidden = !hit;
    if (hit) matches += 1;
  }
  if (searchEmpty) searchEmpty.hidden = matches > 0;
}

if (settingsSearch) settingsSearch.addEventListener('input', applySettingsSearch);

function filterHistoryItems(history) {
  const now = Date.now();
  let items = Array.isArray(history) ? history : [];

  // Time filter
  if (activeTimeFilter === '1h') {
    const threshold = now - 3600 * 1000;
    items = items.filter(item => (item.visitedAt || 0) >= threshold);
  } else if (activeTimeFilter === '24h') {
    const threshold = now - 24 * 3600 * 1000;
    items = items.filter(item => (item.visitedAt || 0) >= threshold);
  } else if (activeTimeFilter === '7d') {
    const threshold = now - 7 * 24 * 3600 * 1000;
    items = items.filter(item => (item.visitedAt || 0) >= threshold);
  } else if (activeTimeFilter === '30d') {
    const threshold = now - 30 * 24 * 3600 * 1000;
    items = items.filter(item => (item.visitedAt || 0) >= threshold);
  }

  // Text search filter
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    items = items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const url = (item.url || '').toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }

  return items;
}

// History is grouped by day and entries can be ticked and acted on together,
// the way a browser's own history page works. Drawn in Zeos's terminal idiom.
const selectedUrls = new Set();

function historyDayKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function historyDayLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const long = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  if (historyDayKey(timestamp) === historyDayKey(today.getTime())) return `Hoje · ${long}`;
  if (historyDayKey(timestamp) === historyDayKey(yesterday.getTime())) return `Ontem · ${long}`;
  return long;
}

function historyHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function updateHistorySelection() {
  const bar = document.querySelector('#history-selection');
  const label = document.querySelector('#history-selection-count');
  if (!bar || !label) return;
  bar.hidden = selectedUrls.size === 0;
  label.textContent = selectedUrls.size === 1
    ? '1 item selecionado'
    : `${selectedUrls.size} itens selecionados`;
  const rows = [...document.querySelectorAll('.history-item')];
  for (const row of rows) {
    row.classList.toggle('selected', selectedUrls.has(row.dataset.url));
  }

}

function renderHistory(history) {
  if (!historyList) return;
  historyList.replaceChildren();

  const filtered = filterHistoryItems(history);
  // Entries filtered out of view can no longer be part of the selection.
  const visible = new Set(filtered.map((item) => item.url));
  for (const url of [...selectedUrls]) if (!visible.has(url)) selectedUrls.delete(url);

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-empty';
    empty.textContent = currentSearchQuery || activeTimeFilter !== 'all'
      ? 'Nenhum item corresponde aos filtros.'
      : 'Nenhum histórico registrado.';
    historyList.appendChild(empty);
    updateHistorySelection();
    return;
  }

  let lastDay = null;
  for (const item of filtered) {
    const when = Number(item.lastVisitedAt || item.visitedAt) || 0;
    const key = historyDayKey(when);

    if (key !== lastDay) {
      lastDay = key;
      const heading = document.createElement('li');
      heading.className = 'history-day';
      heading.textContent = historyDayLabel(when);
      heading.title = 'Selecionar tudo deste dia';
      // Clicking a day header takes or releases that whole day.
      heading.addEventListener('click', () => {
        const sameDay = filtered.filter((entry) => (
          historyDayKey(Number(entry.lastVisitedAt || entry.visitedAt) || 0) === key
        ));
        const allTaken = sameDay.every((entry) => selectedUrls.has(entry.url));
        for (const entry of sameDay) {
          if (allTaken) selectedUrls.delete(entry.url);
          else selectedUrls.add(entry.url);
        }
        renderHistory(history);
      });
      historyList.appendChild(heading);
    }

    const li = document.createElement('li');
    li.className = 'history-item';
    li.dataset.url = item.url;

    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.className = 'history-tick';
    tick.checked = selectedUrls.has(item.url);
    tick.setAttribute('aria-label', `Selecionar ${item.title || item.url}`);
    tick.addEventListener('change', () => {
      if (tick.checked) selectedUrls.add(item.url);
      else selectedUrls.delete(item.url);
      updateHistorySelection();
    });

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = when
      ? new Date(when).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const mark = document.createElement('span');
    mark.className = 'history-mark';
    mark.textContent = (historyHost(item.url)[0] || '?').toUpperCase();

    const title = document.createElement('span');
    title.className = 'history-title';
    title.textContent = item.title || item.url;
    title.title = item.url;

    const host = document.createElement('span');
    host.className = 'history-host';
    host.textContent = historyHost(item.url);

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'history-open';
    open.title = 'Abrir';
    open.textContent = 'abrir';
    open.addEventListener('click', (event) => {
      event.stopPropagation();
      window.zeosSettings?.openUrl(item.url);
    });

    const drop = document.createElement('button');
    drop.type = 'button';
    drop.className = 'history-drop';
    drop.title = 'Remover do histórico';
    drop.textContent = 'remover';
    drop.addEventListener('click', async (event) => {
      event.stopPropagation();
      selectedUrls.delete(item.url);
      const next = await window.zeosSettings?.removeHistoryItem(item.url);
      if (next) renderHistory(next.history || []);
    });

    li.append(tick, time, mark, title, host, open, drop);
    li.addEventListener('click', (event) => {
      if (event.target === tick) return;
      // A click anywhere on the row toggles the tick, like a list of records.
      tick.checked = !tick.checked;
      tick.dispatchEvent(new Event('change'));
    });
    historyList.appendChild(li);
  }

  updateHistorySelection();
}

function wireHistorySelectionBar() {

  document.querySelector('#history-clear-btn')?.addEventListener('click', openHistoryClearModal);

  const clear = document.querySelector('#history-selection-clear');
  const openAll = document.querySelector('#history-selection-open');
  const dropAll = document.querySelector('#history-selection-delete');

  clear?.addEventListener('click', () => {
    selectedUrls.clear();
    for (const tick of document.querySelectorAll('.history-tick')) tick.checked = false;
    updateHistorySelection();
  });

  openAll?.addEventListener('click', () => {
    for (const url of selectedUrls) window.zeosSettings?.openUrl(url);
  });

  dropAll?.addEventListener('click', async () => {
    if (!selectedUrls.size) return;
    const urls = [...selectedUrls];
    selectedUrls.clear();
    const next = await window.zeosSettings?.removeHistoryItems(urls);
    if (next) renderHistory(next.history || []);
  });
}

wireHistorySelectionBar();

// zeos://historico lands here with ?panel=historico instead of on Geral.
const wantedPanel = new URLSearchParams(location.search).get('panel');
if (wantedPanel && document.querySelector(`.nav-item[data-panel="${CSS.escape(wantedPanel)}"]`)) {
  showPanel(wantedPanel);
}


function openHistoryClearModal() {
  isConfirmingClear = false;
  if (clearConfirmBox) clearConfirmBox.style.display = 'none';
  if (modalConfirmBtn) modalConfirmBtn.textContent = 'Limpar dados';
  if (clearHistoryModal) clearHistoryModal.style.display = 'flex';
}

function closeHistoryClearModal() {
  if (clearHistoryModal) clearHistoryModal.style.display = 'none';
  isConfirmingClear = false;
}

function renderSettings(settings) {
  if (!settings) return;
  currentSettings = settings;

  const app = settings.appearance || {};
  const nb = settings.navbarButtons || {};
  const perm = settings.permissions || {};

  applyThemeColors(app);
  renderThemes(settings.themes, app.themeId);

  if (btnBack) btnBack.checked = nb.back !== false;
  if (btnForward) btnForward.checked = nb.forward !== false;
  if (btnReload) btnReload.checked = nb.reload !== false;
  if (btnHome) btnHome.checked = nb.home !== false;
  if (btnShowCpu) btnShowCpu.checked = nb.showCpu !== false;
  if (btnShowRam) btnShowRam.checked = nb.showRam !== false;

  if (downloadModeSelect) downloadModeSelect.value = nb.downloadMode || 'active-only';

  const zoom = app.zoomLevel || 100;
  if (zoomValueDisplay) zoomValueDisplay.textContent = `${zoom}%`;

  if (bgInput) bgInput.value = app.background || '#0b0b0b';
  if (fgInput) fgInput.value = app.foreground || '#f5f5f5';
  if (accentInput) accentInput.value = app.accent || '#22c55e';
  if (fontSelect) fontSelect.value = app.font || 'IBM Plex Mono';

  if (initialPageInput) initialPageInput.value = settings.initialPage || '';
  if (searchProviderSelect) searchProviderSelect.value = settings.searchProvider || 'duckduckgo';

  if (notificationsCheck) notificationsCheck.checked = Boolean(perm.notifications);
  if (microphoneCheck) microphoneCheck.checked = Boolean(perm.microphone);
  if (cameraCheck) cameraCheck.checked = Boolean(perm.camera);
  // newTab3D is a top-level key, not part of appearance: the appearance
  // whitelist in the main process would drop a boolean placed there.
  if (newTab3DCheck) newTab3DCheck.checked = settings.newTab3D !== false;

  renderHistory(settings.history);
  loadExtensionsList();
}

// Setup Event Listeners
if (window.zeosSettings) {
  window.zeosSettings.get().then(renderSettings).catch(console.error);
  window.zeosSettings.onChanged(renderSettings);

  btnBack?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { back: btnBack.checked } });
  });

  btnForward?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { forward: btnForward.checked } });
  });

  btnReload?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { reload: btnReload.checked } });
  });

  btnHome?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { home: btnHome.checked } });
  });

  btnShowCpu?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { showCpu: btnShowCpu.checked } });
  });

  btnShowRam?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { showRam: btnShowRam.checked } });
  });

  downloadModeSelect?.addEventListener('change', () => {
    window.zeosSettings.update({ navbarButtons: { downloadMode: downloadModeSelect.value } });
  });

  zoomOutBtn?.addEventListener('click', () => {
    const cur = currentSettings?.appearance?.zoomLevel || 100;
    window.zeosSettings.update({ appearance: { zoomLevel: Math.max(50, cur - 10) } });
  });

  zoomInBtn?.addEventListener('click', () => {
    const cur = currentSettings?.appearance?.zoomLevel || 100;
    window.zeosSettings.update({ appearance: { zoomLevel: Math.min(200, cur + 10) } });
  });

  zoomResetBtn?.addEventListener('click', () => {
    window.zeosSettings.update({ appearance: { zoomLevel: 100 } });
  });

  bgInput?.addEventListener('change', () => {
    window.zeosSettings.update({ appearance: { background: bgInput.value } });
  });

  fgInput?.addEventListener('change', () => {
    window.zeosSettings.update({ appearance: { foreground: fgInput.value } });
  });

  accentInput?.addEventListener('change', () => {
    window.zeosSettings.update({ appearance: { accent: accentInput.value } });
  });

  fontSelect?.addEventListener('change', () => {
    window.zeosSettings.update({ appearance: { font: fontSelect.value } });
  });

  initialPageInput?.addEventListener('change', () => {
    window.zeosSettings.update({ initialPage: initialPageInput.value });
  });

  searchProviderSelect?.addEventListener('change', () => {
    window.zeosSettings.update({ searchProvider: searchProviderSelect.value });
  });

  notificationsCheck?.addEventListener('change', () => {
    window.zeosSettings.update({ permissions: { notifications: notificationsCheck.checked } });
  });

  microphoneCheck?.addEventListener('change', () => {
    window.zeosSettings.update({ permissions: { microphone: microphoneCheck.checked } });
  });

  cameraCheck?.addEventListener('change', () => {
    window.zeosSettings.update({ permissions: { camera: cameraCheck.checked } });
  });

  newTab3DCheck?.addEventListener('change', () => {
    window.zeosSettings.update({ newTab3D: newTab3DCheck.checked });
  });

  clearCookiesBtn?.addEventListener('click', async () => {
    await window.zeosSettings.clearCookies();
    clearCookiesBtn.textContent = 'Cookies limpos!';
    setTimeout(() => { clearCookiesBtn.textContent = 'Limpar cookies'; }, 2000);
  });

  // Chrome Extensions Buttons
  openExtensionsPageBtn?.addEventListener('click', () => {
    window.zeosSettings.openUrl('zeos://extensions');
  });

  loadExtensionBtn?.addEventListener('click', async () => {
    const loaded = await window.zeosSettings.extensions.loadUnpacked();
    if (loaded) {
      loadExtensionsList();
    }
  });

  // History search and filters
  historySearchInput?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    if (currentSettings) renderHistory(currentSettings.history);
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeTimeFilter = chip.dataset.filter || 'all';
      if (currentSettings) renderHistory(currentSettings.history);
    });
  });

  // Modal handlers
  openClearModalBtn?.addEventListener('click', openHistoryClearModal);
  modalCloseBtn?.addEventListener('click', closeHistoryClearModal);
  modalCancelBtn?.addEventListener('click', closeHistoryClearModal);

  clearHistoryModal?.addEventListener('click', (e) => {
    if (e.target === clearHistoryModal) closeHistoryClearModal();
  });

  modalConfirmBtn?.addEventListener('click', async () => {
    if (!isConfirmingClear) {
      isConfirmingClear = true;
      if (clearConfirmBox) clearConfirmBox.style.display = 'block';
      modalConfirmBtn.textContent = 'Confirmar exclusão agora';
      return;
    }

    const selectedRadio = document.querySelector('input[name="clear-time-range"]:checked');
    const range = selectedRadio ? selectedRadio.value : 'all';

    const updated = await window.zeosSettings.clearHistoryRange(range);
    renderSettings(updated);
    closeHistoryClearModal();
  });
}
