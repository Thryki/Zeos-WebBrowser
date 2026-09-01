'use strict';

// DOM Elements
const tabsElement = document.querySelector('#tabs');
const omnibox = document.querySelector('#omnibox');
const backButton = document.querySelector('#back');
const forwardButton = document.querySelector('#forward');
const reloadButton = document.querySelector('#reload');
const homeButton = document.querySelector('#home');
const appMenuTopBtn = document.querySelector('#app-menu-btn');
const downloadButton = document.querySelector('#downloads');
const downloadBadge = document.querySelector('#downloads-badge');
const downloadRingFill = document.querySelector('.dl-ring-fill');
const downloadsPanel = document.querySelector('#downloads-panel');
const downloadsBackdrop = document.querySelector('#downloads-backdrop');
const downloadsList = document.querySelector('#downloads-list');
const downloadsEmpty = document.querySelector('#downloads-empty');
const dlOpenFolderBtn = document.querySelector('#dl-open-folder');
const dlClosePanelBtn = document.querySelector('#dl-close-panel');
const chrome = document.querySelector('#chrome');
const tabsBar = document.querySelector('#tabs-bar');
const tabsSpacer = document.querySelector('#tabs-spacer');
const newTabButton = document.querySelector('#new-tab');
const tabsOverflowButton = document.querySelector('#tabs-overflow');
const minimizeButton = document.querySelector('#minimize');
const maximizeButton = document.querySelector('#maximize');
const closeWindowButton = document.querySelector('#close-window');
const omniboxRow = document.querySelector('#omnibox-row');
const extensionsToolbar = document.querySelector('#extensions-toolbar');

// Stats elements (Zeos Browser memory and CPU)
const statCpu = document.querySelector('#stat-cpu');
const statRam = document.querySelector('#stat-ram');
const statCpuVal = document.querySelector('#stat-cpu-val');
const statRamVal = document.querySelector('#stat-ram-val');

let state = {
  tabs: [],
  activeId: null,
  expanded: false,
  downloadsPanelOpen: false,
  extensions: [],
  appearance: { zoomLevel: 100 },
  navbarButtons: {
    back: true,
    forward: true,
    reload: true,
    home: true,
    appMenu: true,
    showCpu: true,
    showRam: true,
    downloadMode: 'active-only'
  },
  downloads: 0,
  canGoBack: false,
  canGoForward: false
};
let currentDownloads = { activeCount: 0, overallPercent: 0, items: [] };
let hidingTimer;
let draggedTabId = null;
const CIRCUMFERENCE = 69.115; // 2 * PI * 11

const command = (name, payload) => window.zeos.command(name, payload);

function menu(name, event, extra = {}) {
  const point = event ? { x: event.clientX, y: event.clientY, ...extra } : { x: 200, y: 40, ...extra };
  window.zeos.showMenu(name, point);
}

function focusAddress() {
  clearTimeout(hidingTimer);
  window.zeos.setChromeExpanded(true).then(() => {
    omnibox.focus();
    omnibox.select();
  });
}

function scheduleHide() {
  clearTimeout(hidingTimer);
  if (document.activeElement === omnibox || isPanelOpen()) return;
  hidingTimer = setTimeout(() => {
    if (!isPanelOpen() && document.activeElement !== omnibox) {
      window.zeos.setChromeExpanded(false);
    }
  }, 250);
}

function setTheme(a = {}) {
  const root = document.documentElement.style;
  root.setProperty('--bg', a.background || '#0b0b0b');
  root.setProperty('--fg', a.foreground || '#f5f5f5');
  root.setProperty('--accent', a.accent || '#22c55e');
  root.setProperty('--panel', a.panel || '#181818');
  root.setProperty('--panel-hover', a.panelHover || '#242424');
  root.setProperty('--border', a.border || '#2a2a2a');
  root.fontFamily = `"${a.font || 'IBM Plex Mono'}", Consolas, "Cascadia Mono", monospace`;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function checkTabsOverflow() {
  if (!tabsElement || !tabsOverflowButton) return;
  const isOverflowing = tabsElement.scrollWidth > tabsElement.clientWidth + 10;
  tabsOverflowButton.style.display = (isOverflowing || state.tabs.length > 8) ? 'flex' : 'none';
}

function renderTabs() {
  tabsElement.replaceChildren();

  state.tabs.forEach((tab, idx) => {
    // Workspace tab filtering stays disabled until a workspace switcher UI
    // exists — with no way to switch back, hiding tabs would strand them.
    const button = document.createElement('button');
    const isActive = tab.id === state.activeId;
    const isPinned = Boolean(tab.pinned);

    button.className = `tab${isActive ? ' active' : ''}${isPinned ? ' pinned' : ''}${tab.isLoading ? ' loading' : ''}`;
    button.type = 'button';
    button.role = 'tab';
    button.title = `${tab.title || tab.url || 'Nova aba'}${isPinned ? ' (Fixada)' : ''}`;
    button.draggable = true;

    // Click to select
    button.addEventListener('click', () => {
      command('select-tab', tab.id);
    });

    // Middle click to close (only unpinned)
    button.addEventListener('auxclick', (event) => {
      if (event.button === 1) {
        event.preventDefault();
        event.stopPropagation();
        if (!isPinned) {
          command('close-tab', tab.id);
        }
      }
    });

    // Right-click context menu (Chrome style)
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      menu('tab-context', event, { tabId: tab.id });
    });

    // Drag and Drop Tab Reordering, Cross-Window Attachment & Tear-off
    button.addEventListener('dragstart', (event) => {
      draggedTabId = tab.id;
      button.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tab.id);
      event.dataTransfer.setData('application/x-zeos-tab', tab.id);
    });

    button.addEventListener('dragend', (event) => {
      button.classList.remove('dragging');
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.remove('drag-over');
        t.classList.remove('drag-over-right');
      });

      // If dragged outside the browser header and not dropped into another window, tear off into a new window!
      if (event.dataTransfer.dropEffect === 'none') {
        if (event.screenY > window.screenY + 120 || event.screenY < window.screenY - 40 ||
            event.screenX < window.screenX - 40 || event.screenX > window.screenX + window.innerWidth + 40) {
          if (state.tabs.length > 1 && window.zeos.tearOffTab) {
            window.zeos.tearOffTab(tab.id, event.screenX, event.screenY);
          }
        }
      }
      draggedTabId = null;
    });

    button.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const rect = button.getBoundingClientRect();
      const isRight = event.clientX > (rect.left + rect.width / 2);
      if (isRight) {
        button.classList.add('drag-over-right');
        button.classList.remove('drag-over');
      } else {
        button.classList.add('drag-over');
        button.classList.remove('drag-over-right');
      }
    });

    button.addEventListener('dragleave', () => {
      button.classList.remove('drag-over');
      button.classList.remove('drag-over-right');
    });

    button.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.remove('drag-over');
      button.classList.remove('drag-over-right');
      const tabId = event.dataTransfer.getData('application/x-zeos-tab') || event.dataTransfer.getData('text/plain') || draggedTabId;
      const rect = button.getBoundingClientRect();
      const insertIdx = event.clientX > (rect.left + rect.width / 2) ? idx + 1 : idx;
      if (tabId && window.zeos.attachTab) {
        window.zeos.attachTab(tabId, insertIdx);
      }
    });

    // Favicon
    const favicon = document.createElement('span');
    favicon.className = 'tab-favicon';
    if (tab.kind === 'settings') {
      favicon.innerHTML = '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path fill="currentColor" d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/></svg>';
    } else if (tab.kind === 'favorites') {
      favicon.innerHTML = '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>';
    } else if (tab.favicon) {
      const img = document.createElement('img');
      img.src = tab.favicon;
      img.alt = '';
      img.width = 14;
      img.height = 14;
      const fallbackSvg = document.createElement('span');
      fallbackSvg.style.display = 'none';
      fallbackSvg.innerHTML = '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zm4.93 7h-2.18a10.87 10.87 0 0 0-.91-4.05A6.02 6.02 0 0 1 12.93 7zM8 2.06c.66 1.34 1.16 3.03 1.29 4.94H6.71C6.84 5.09 7.34 3.4 8 2.06zM2.07 9h2.18a10.87 10.87 0 0 0 .91 4.05A6.02 6.02 0 0 1 2.07 9zm2.18-2H2.07a6.02 6.02 0 0 1 3.99-4.05A10.87 10.87 0 0 0 4.25 7zM8 13.94c-.66-1.34-1.16-3.03-1.29-4.94h2.58C9.16 10.91 8.66 12.6 8 13.94zm2.84-4.94h2.18a6.02 6.02 0 0 1-3.99 4.05 10.87 10.87 0 0 0 .91-4.05z"/></svg>';
      img.onerror = () => {
        img.style.display = 'none';
        fallbackSvg.style.display = 'inline-flex';
      };
      favicon.append(img, fallbackSvg);
    } else {
      favicon.innerHTML = '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zm4.93 7h-2.18a10.87 10.87 0 0 0-.91-4.05A6.02 6.02 0 0 1 12.93 7zM8 2.06c.66 1.34 1.16 3.03 1.29 4.94H6.71C6.84 5.09 7.34 3.4 8 2.06zM2.07 9h2.18a10.87 10.87 0 0 0 .91 4.05A6.02 6.02 0 0 1 2.07 9zm2.18-2H2.07a6.02 6.02 0 0 1 3.99-4.05A10.87 10.87 0 0 0 4.25 7zM8 13.94c-.66-1.34-1.16-3.03-1.29-4.94h2.58C9.16 10.91 8.66 12.6 8 13.94zm2.84-4.94h2.18a6.02 6.02 0 0 1-3.99 4.05 10.87 10.87 0 0 0 .91-4.05z"/></svg>';
    }

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'nova aba';

    // Close button (only for unpinned tabs)
    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '✕';
    close.title = 'Fechar aba (Ctrl+W)';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      command('close-tab', tab.id);
    });

    if (isPinned) {
      button.append(favicon);
    } else {
      button.append(favicon, title, close);
    }

    tabsElement.appendChild(button);
  });

  checkTabsOverflow();
}

function renderExtensions(extensions = []) {
  if (!extensionsToolbar) return;
  extensionsToolbar.replaceChildren();

  if (!Array.isArray(extensions) || extensions.length === 0) {
    extensionsToolbar.style.display = 'none';
    return;
  }

  extensionsToolbar.style.display = 'flex';

  for (const ext of extensions) {
    const btn = document.createElement('button');
    btn.className = 'nav-icon-btn extension-action-btn';
    btn.type = 'button';
    btn.title = `${ext.name}${ext.description ? ' - ' + ext.description : ''}`;
    btn.setAttribute('aria-label', ext.name);

    if (ext.icon) {
      const img = document.createElement('img');
      img.src = ext.icon;
      img.alt = ext.name;
      img.width = 16;
      img.height = 16;
      btn.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'extension-fallback-icon';
      span.textContent = (ext.name || 'E')[0].toUpperCase();
      btn.appendChild(span);
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = btn.getBoundingClientRect();
      if (window.zeos.openExtensionAction) {
        window.zeos.openExtensionAction(ext.id, {
          x: rect.left,
          y: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
      }
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.zeos.showExtensionMenu) {
        window.zeos.showExtensionMenu(ext.id, { x: e.clientX, y: e.clientY });
      }
    });

    extensionsToolbar.appendChild(btn);
  }
}

function renderTabResourceMetrics(tabs) {
  // Update per-tab metrics in the UI
  // Show metrics for active tab or all tabs in a condensed format
  const activeTab = tabs.find((t) => t.id === state.activeId);
  if (!activeTab || !activeTab.resourceMetrics) return;

  const { cpu, memory } = activeTab.resourceMetrics;
  // Nothing feeds tab:set-metrics yet, so per-tab metrics stay zeroed;
  // an all-zero reading must not overwrite the live system-wide stats.
  if (!cpu && !memory) return;

  if (statCpuVal) {
    statCpuVal.textContent = `${cpu}%`;
  }
  if (statRamVal) {
    statRamVal.textContent = `${memory} MB`;
  }
}

function isPanelOpen() {
  return downloadsPanel.style.display !== 'none';
}

function toggleDownloadsPanel() {
  if (isPanelOpen()) {
    closeDownloadsPanel();
  } else {
    openDownloadsPanel();
  }
}

function openDownloadsPanel() {
  downloadsPanel.style.display = 'flex';
  downloadsBackdrop.style.display = 'block';
  downloadButton.classList.add('open');
  clearTimeout(hidingTimer);
  window.zeos.setDownloadsPanelOpen(true);
  renderDownloadsList();
  updateDownloadButton(currentDownloads);
}

function closeDownloadsPanel() {
  downloadsPanel.style.display = 'none';
  downloadsBackdrop.style.display = 'none';
  downloadButton.classList.remove('open');
  window.zeos.setDownloadsPanelOpen(false);
  updateDownloadButton(currentDownloads);
}

function updateDownloadButton(summary) {
  if (!summary) return;
  const activeCount = summary.activeCount || 0;
  const hasActive = activeCount > 0;
  const mode = state.navbarButtons?.downloadMode || 'active-only';

  if (mode === 'hidden') {
    downloadButton.style.display = 'none';
  } else if (mode === 'always') {
    downloadButton.style.display = 'flex';
  } else {
    downloadButton.style.display = (hasActive || isPanelOpen()) ? 'flex' : 'none';
  }

  downloadButton.classList.toggle('has-active', hasActive);

  if (hasActive) {
    downloadBadge.style.display = 'flex';
    downloadBadge.textContent = String(activeCount);
    const percent = Math.max(0, Math.min(100, summary.overallPercent || 0));
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * percent / 100);
    if (downloadRingFill) {
      downloadRingFill.style.strokeDashoffset = String(offset);
    }
  } else {
    downloadBadge.style.display = 'none';
    if (downloadRingFill) {
      downloadRingFill.style.strokeDashoffset = String(CIRCUMFERENCE);
    }
  }
}

function renderDownloadsList() {
  const items = currentDownloads.items || [];
  downloadsList.replaceChildren();

  if (items.length === 0) {
    downloadsEmpty.style.display = 'flex';
    return;
  }

  downloadsEmpty.style.display = 'none';

  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'dl-item';
    el.title = item.savePath;

    const iconEl = document.createElement('div');
    iconEl.className = 'dl-item-icon';
    iconEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';

    const infoEl = document.createElement('div');
    infoEl.className = 'dl-item-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'dl-item-name';
    nameEl.textContent = item.filename || 'Arquivo baixado';

    const metaEl = document.createElement('div');
    metaEl.className = 'dl-item-meta';

    if (item.state === 'progressing') {
      const rec = formatBytes(item.receivedBytes);
      const total = item.totalBytes > 0 ? formatBytes(item.totalBytes) : 'desconhecido';
      const pct = item.totalBytes > 0 ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0;
      metaEl.textContent = `${rec} / ${total} (${pct}%) • Baixando...`;

      const track = document.createElement('div');
      track.className = 'dl-item-progress-track';
      const fill = document.createElement('div');
      fill.className = 'dl-item-progress-fill';
      fill.style.width = `${pct}%`;
      track.appendChild(fill);
      infoEl.append(nameEl, metaEl, track);
    } else if (item.state === 'completed') {
      metaEl.textContent = `${formatBytes(item.totalBytes || item.receivedBytes)} • Concluído`;
      infoEl.append(nameEl, metaEl);
    } else if (item.state === 'cancelled') {
      metaEl.textContent = 'Cancelado';
      infoEl.append(nameEl, metaEl);
    } else {
      metaEl.textContent = 'Interrompido';
      infoEl.append(nameEl, metaEl);
    }

    const actionsEl = document.createElement('div');
    actionsEl.className = 'dl-item-actions';

    if (item.state === 'progressing') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'dl-btn-action';
      cancelBtn.title = 'Cancelar download';
      cancelBtn.innerHTML = '✕';
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.zeos.downloads.cancel(item.id);
      });
      actionsEl.appendChild(cancelBtn);
    }

    const folderBtn = document.createElement('button');
    folderBtn.className = 'dl-btn-action';
    folderBtn.title = 'Mostrar na pasta';
    folderBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" fill="currentColor"/></svg>';
    folderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.zeos.downloads.showInFolder(item.savePath);
    });
    actionsEl.appendChild(folderBtn);

    el.append(iconEl, infoEl, actionsEl);

    el.addEventListener('click', () => {
      if (item.state === 'completed') {
        window.zeos.downloads.openFile(item.savePath);
      } else {
        window.zeos.downloads.showInFolder(item.savePath);
      }
    });

    downloadsList.appendChild(el);
  }
}

function handleDownloadsUpdate(summary) {
  currentDownloads = summary;
  updateDownloadButton(summary);
  if (isPanelOpen()) {
    renderDownloadsList();
  }
}

function updateNavbarButtonsVisibility() {
  const nb = state.navbarButtons || {};
  if (backButton) backButton.style.display = nb.back !== false ? 'flex' : 'none';
  if (forwardButton) forwardButton.style.display = nb.forward !== false ? 'flex' : 'none';
  if (reloadButton) reloadButton.style.display = nb.reload !== false ? 'flex' : 'none';
  if (homeButton) homeButton.style.display = nb.home !== false ? 'flex' : 'none';
  if (appMenuTopBtn) appMenuTopBtn.style.display = nb.appMenu !== false ? 'flex' : 'none';
  if (statCpu) statCpu.style.display = nb.showCpu !== false ? 'flex' : 'none';
  if (statRam) statRam.style.display = nb.showRam !== false ? 'flex' : 'none';
  updateDownloadButton(currentDownloads);
}

function updateSystemStats(stats) {
  if (!stats) return;
  if (statCpuVal && typeof stats.cpuPercent === 'number') {
    statCpuVal.textContent = `${stats.cpuPercent}%`;
  }
  if (statRamVal && typeof stats.ramMB === 'number') {
    statRamVal.textContent = `${stats.ramMB} MB`;
  }
}

function applyState(next) {
  state = next;
  setTheme(state.appearance);
  updateNavbarButtonsVisibility();
  renderTabs();
  renderExtensions(state.extensions);

  if (document.activeElement !== omnibox) {
    omnibox.value = state.activeUrl || '';
  }

  if (backButton) backButton.disabled = !state.canGoBack;
  if (forwardButton) forwardButton.disabled = !state.canGoForward;
  if (reloadButton) {
    reloadButton.title = state.activeLoading ? 'Parar carregamento (Esc)' : 'Recarregar (Ctrl+R)';
  }

  if (state.systemStats) {
    updateSystemStats(state.systemStats);
  }

  if (state.downloadsSummary) {
    handleDownloadsUpdate(state.downloadsSummary);
  }

  // Update per-tab resource metrics display
  if (state.tabs) {
    renderTabResourceMetrics(state.tabs);
  }
}

// Window Dragging and Context Menu on Header
function setupHeaderInteractions() {
  let isDragging = false;

  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('button, input, .tab, .downloads-panel, .stat-pill')) {
      isDragging = true;
      window.zeos.windowDrag('start', { screenX: e.screenX, screenY: e.screenY });

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        window.zeos.windowDrag('move', { screenX: moveEvt.screenX, screenY: moveEvt.screenY });
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          window.zeos.windowDrag('end');
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  const handleDblClick = (e) => {
    if (!e.target.closest('button, input, .tab, .downloads-panel, .stat-pill')) {
      command('toggle-maximize');
    }
  };

  const handleContextMenu = (e) => {
    if (e.target.closest('.tab')) {
      // Tab context menu is handled in tab listener
      return;
    } else if (e.target.closest('#stat-cpu')) {
      e.preventDefault();
      e.stopPropagation();
      menu('stat-pill-cpu', e);
    } else if (e.target.closest('#stat-ram')) {
      e.preventDefault();
      e.stopPropagation();
      menu('stat-pill-ram', e);
    } else {
      e.preventDefault();
      menu('navbar-customization', e);
    }
  };

  tabsBar.addEventListener('mousedown', handleMouseDown);
  tabsBar.addEventListener('dblclick', handleDblClick);
  tabsBar.addEventListener('contextmenu', handleContextMenu);

  statCpu?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu('stat-pill-cpu', e);
  });

  statRam?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu('stat-pill-ram', e);
  });

  omniboxRow.addEventListener('contextmenu', (e) => {
    if (e.target !== omnibox) {
      e.preventDefault();
      menu('navbar-customization', e);
    }
  });

  [backButton, forwardButton, reloadButton, homeButton, appMenuTopBtn, downloadButton].forEach((btn) => {
    if (btn) {
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu('navbar-customization', e);
      });
    }
  });

  // Cross-window and empty space drag & drop support for tabs
  function getDropIndex(clientX) {
    const tabButtons = [...tabsElement.querySelectorAll('.tab')];
    for (let i = 0; i < tabButtons.length; i++) {
      const rect = tabButtons[i].getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (clientX < midX) {
        return i;
      }
    }
    return tabButtons.length;
  }

  tabsElement.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  tabsElement.addEventListener('drop', (event) => {
    event.preventDefault();
    const tabId = event.dataTransfer.getData('application/x-zeos-tab') || event.dataTransfer.getData('text/plain') || draggedTabId;
    if (tabId && window.zeos.attachTab) {
      const insertIdx = getDropIndex(event.clientX);
      window.zeos.attachTab(tabId, insertIdx);
    }
  });

  tabsSpacer?.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  tabsSpacer?.addEventListener('drop', (event) => {
    event.preventDefault();
    const tabId = event.dataTransfer.getData('application/x-zeos-tab') || event.dataTransfer.getData('text/plain') || draggedTabId;
    if (tabId && window.zeos.attachTab) {
      window.zeos.attachTab(tabId, state.tabs.length);
    }
  });
}

// Event Listeners
window.zeos.onState(applyState);
window.zeos.onFocusOmnibox(() => {
  omnibox.focus();
  omnibox.select();
});
window.zeos.onDownloadsUpdated(handleDownloadsUpdate);
window.zeos.onDownloadStarted(() => {
  openDownloadsPanel();
});
window.zeos.onToggleDownloads(() => {
  toggleDownloadsPanel();
});
window.zeos.onSystemStats(updateSystemStats);

// Downloads Panel Button Actions
downloadButton.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleDownloadsPanel();
});

dlOpenFolderBtn.addEventListener('click', () => {
  window.zeos.downloads.openFolder();
});

dlClosePanelBtn.addEventListener('click', () => {
  closeDownloadsPanel();
});

downloadsBackdrop.addEventListener('click', () => {
  closeDownloadsPanel();
});

document.addEventListener('click', (event) => {
  if (isPanelOpen() && !downloadsPanel.contains(event.target) && !downloadButton.contains(event.target)) {
    closeDownloadsPanel();
  }
});

// App Menu button
if (appMenuTopBtn) {
  appMenuTopBtn.addEventListener('click', (event) => menu('app-menu', event));
}

// Top bar controls
newTabButton.addEventListener('click', () => command('new-tab'));
newTabButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  event.stopPropagation();
  menu('plus', event);
});

tabsOverflowButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  menu('tabs-overflow', event);
});

minimizeButton.addEventListener('click', () => command('minimize'));
maximizeButton.addEventListener('click', () => command('toggle-maximize'));
closeWindowButton.addEventListener('click', () => command('close-window'));

// Navigation controls (in omnibox row)
backButton.addEventListener('click', () => command('back'));
forwardButton.addEventListener('click', () => command('forward'));
reloadButton.addEventListener('click', () => command(state.activeLoading ? 'stop' : 'reload'));
if (homeButton) homeButton.addEventListener('click', () => command('home'));

omniboxRow.addEventListener('submit', (event) => {
  event.preventDefault();
  command('navigate', omnibox.value);
});

omnibox.addEventListener('focus', () => window.zeos.setChromeExpanded(true));
omnibox.addEventListener('blur', scheduleHide);

chrome.addEventListener('mouseenter', () => {
  clearTimeout(hidingTimer);
  if (!state.expanded) window.zeos.setChromeExpanded(true);
});
chrome.addEventListener('mouseleave', scheduleHide);

setupHeaderInteractions();
new ResizeObserver(() => {
  checkTabsOverflow();
}).observe(tabsElement);

// Global Keyboard Shortcuts
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'escape') {
    if (isPanelOpen()) {
      closeDownloadsPanel();
      return;
    }
  }

  if (key === 'shift' && !event.repeat) {
    const el = document.activeElement;
    const isTyping = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (!isTyping) {
      event.preventDefault();
      command('toggle-chrome');
    }
  }

  if (event.ctrlKey && key === 'l') {
    event.preventDefault();
    focusAddress();
  }

  if (event.ctrlKey && key === 't') {
    event.preventDefault();
    command('new-tab');
  }

  if (event.ctrlKey && key === 'n') {
    event.preventDefault();
    command(event.shiftKey ? 'new-private-window' : 'new-window');
  }

  if (event.ctrlKey && (key === 'h' || key === ',')) {
    event.preventDefault();
    command('open-settings');
  }

  if (event.ctrlKey && (key === 'd' || key === 'b')) {
    event.preventDefault();
    command('open-favorites');
  }

  if (event.ctrlKey && event.shiftKey && (key === 'e' || key === 'x')) {
    event.preventDefault();
    command('open-extensions');
  }

  if (key === 'f12' || (event.ctrlKey && event.shiftKey && key === 'i')) {
    event.preventDefault();
    command('toggle-devtools');
  }

  if (event.ctrlKey && (key === '=' || key === '+')) {
    event.preventDefault();
    command('zoom-in');
  }

  if (event.ctrlKey && key === '-') {
    event.preventDefault();
    command('zoom-out');
  }

  if (event.ctrlKey && key === '0') {
    event.preventDefault();
    command('zoom-reset');
  }

  if (event.ctrlKey && key === 'j') {
    event.preventDefault();
    toggleDownloadsPanel();
  }

  if (event.ctrlKey && key === 'w') {
    event.preventDefault();
    command('close-tab', state.activeId);
  }

  if ((event.ctrlKey && key === 'r') || key === 'f5') {
    event.preventDefault();
    command(event.shiftKey ? 'reload-hard' : 'reload');
  }

  if (event.ctrlKey && key === 'tab') {
    event.preventDefault();
    command(event.shiftKey ? 'cycle-previous' : 'cycle-next');
  }

  if (event.ctrlKey && /^[1-9]$/u.test(key)) {
    event.preventDefault();
    const tab = state.tabs[Number(key) - 1] || state.tabs.at(-1);
    if (tab) command('select-tab', tab.id);
  }

  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault();
    command('back');
  }

  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault();
    command('forward');
  }
});

// Load initial downloads state
window.zeos.downloads.getSummary().then(handleDownloadsUpdate).catch(() => {});
