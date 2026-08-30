'use strict';

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
const mediaCheck = document.querySelector('#media');
const clearCookiesBtn = document.querySelector('#clear-cookies');

// Chrome Extensions elements
const extensionsList = document.querySelector('#extensions-list');
const extensionsEmpty = document.querySelector('#extensions-empty');
const loadExtensionBtn = document.querySelector('#load-extension-btn');

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
  root.setProperty('--bg', appearance.background || '#050805');
  root.setProperty('--fg', appearance.foreground || '#8abe85');
  root.setProperty('--accent', appearance.accent || '#69a865');
  root.setProperty('--panel', appearance.panel || '#0a120b');
  root.setProperty('--panel-hover', appearance.panelHover || '#121f14');
  root.setProperty('--border', appearance.border || 'rgba(105, 168, 101, 0.2)');
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
    checkEl.textContent = '✓';
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
      return;
    }

    if (extensionsEmpty) extensionsEmpty.style.display = 'none';

    for (const ext of exts) {
      const card = document.createElement('div');
      card.className = 'extension-card';

      const header = document.createElement('div');
      header.className = 'extension-header';

      const titleArea = document.createElement('div');
      titleArea.className = 'extension-title-area';

      const icon = document.createElement('div');
      icon.className = 'extension-icon';
      if (ext.icon) {
        const img = document.createElement('img');
        img.src = ext.icon;
        img.alt = ext.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        icon.appendChild(img);
      } else {
        icon.textContent = (ext.name || 'E')[0].toUpperCase();
      }

      const name = document.createElement('div');
      name.className = 'extension-name';
      name.textContent = ext.name || 'Extensão';

      titleArea.append(icon, name);

      const ver = document.createElement('span');
      ver.className = 'extension-version';
      ver.textContent = `v${ext.version || '1.0'}`;

      header.append(titleArea, ver);

      const desc = document.createElement('div');
      desc.className = 'extension-desc';
      desc.textContent = ext.description || 'Extensão do Chrome ativa no navegador.';

      const footer = document.createElement('div');
      footer.className = 'extension-footer';

      const idSpan = document.createElement('span');
      idSpan.className = 'extension-id';
      idSpan.title = `ID: ${ext.id}`;
      idSpan.textContent = `ID: ${ext.id}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'extension-remove-btn';
      removeBtn.textContent = 'Remover';
      removeBtn.addEventListener('click', async () => {
        if (confirm(`Deseja realmente remover a extensão "${ext.name}"?`)) {
          await window.zeosSettings.extensions.remove(ext.id);
          loadExtensionsList();
        }
      });

      footer.append(idSpan, removeBtn);
      card.append(header, desc, footer);
      extensionsList.appendChild(card);
    }
  } catch (err) {
    console.error(err);
  }
}

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

function renderHistory(history) {
  if (!historyList) return;
  historyList.replaceChildren();

  const filtered = filterHistoryItems(history);

  if (filtered.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'history-empty';
    emptyDiv.textContent = currentSearchQuery || activeTimeFilter !== 'all'
      ? 'Nenhum histórico encontrado para os filtros atuais.'
      : 'Nenhum histórico recente registrado.';
    historyList.appendChild(emptyDiv);
    return;
  }

  for (const item of filtered) {
    const li = document.createElement('li');
    li.className = 'history-item';

    const mainDiv = document.createElement('div');
    mainDiv.className = 'history-main';
    mainDiv.title = `Clique para abrir: ${item.url}`;

    const titleEl = document.createElement('span');
    titleEl.className = 'history-title';
    titleEl.textContent = item.title || item.url;

    const urlEl = document.createElement('span');
    urlEl.className = 'history-url';
    urlEl.textContent = item.url;

    mainDiv.append(titleEl, urlEl);

    mainDiv.addEventListener('click', () => {
      if (window.zeosSettings && window.zeosSettings.openUrl) {
        window.zeosSettings.openUrl(item.url);
      }
    });

    const metaDiv = document.createElement('div');
    metaDiv.className = 'history-meta';

    if (item.visitedAt) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = new Date(item.visitedAt).toLocaleString('pt-BR');
      metaDiv.appendChild(timeSpan);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-delete-btn';
    deleteBtn.title = 'Remover este item do histórico';
    deleteBtn.innerHTML = '✕';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const updated = await window.zeosSettings.removeHistoryItem(item.url);
      renderSettings(updated);
    });
    metaDiv.appendChild(deleteBtn);

    li.append(mainDiv, metaDiv);
    historyList.appendChild(li);
  }
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

  if (bgInput) bgInput.value = app.background || '#050805';
  if (fgInput) fgInput.value = app.foreground || '#8abe85';
  if (accentInput) accentInput.value = app.accent || '#69a865';
  if (fontSelect) fontSelect.value = app.font || 'IBM Plex Mono';

  if (initialPageInput) initialPageInput.value = settings.initialPage || '';
  if (searchProviderSelect) searchProviderSelect.value = settings.searchProvider || 'duckduckgo';

  if (notificationsCheck) notificationsCheck.checked = Boolean(perm.notifications);
  if (mediaCheck) mediaCheck.checked = Boolean(perm.media);

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

  mediaCheck?.addEventListener('change', () => {
    window.zeosSettings.update({ permissions: { media: mediaCheck.checked } });
  });

  clearCookiesBtn?.addEventListener('click', async () => {
    await window.zeosSettings.clearCookies();
    clearCookiesBtn.textContent = 'Cookies limpos!';
    setTimeout(() => { clearCookiesBtn.textContent = 'Limpar cookies'; }, 2000);
  });

  // Chrome Extensions Load Button
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
