'use strict';

// Static markup declares icons with data-icon; fill them from the Lucide set.
for (const holder of document.querySelectorAll('[data-icon]')) {
  holder.innerHTML = iconMarkup(holder.dataset.icon, Number(holder.dataset.iconSize) || 14);
}

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
const favoriteButton = document.querySelector('#favorite-btn');

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

if (navigator.platform.toLowerCase().includes('mac')) {
  document.body.classList.add('platform-darwin');
}

function menu(name, event, extra = {}) {
  const point = event ? { x: event.clientX, y: event.clientY, ...extra } : { x: 200, y: 40, ...extra };
  window.zeos.showMenu(name, point);
}

function focusAddress() {
  if (omniboxRow && omniboxRow.hidden) return;
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
  root.fontFamily = `"${a.font || 'Brunea Mono'}", "IBM Plex Mono", "SF Mono", Menlo, Consolas, "Cascadia Mono", monospace`;
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
      favicon.innerHTML = iconMarkup('settings', 14);
    } else if (tab.kind === 'favorites') {
      favicon.innerHTML = iconMarkup('star', 14);
    } else if (tab.favicon) {
      const img = document.createElement('img');
      img.src = tab.favicon;
      img.alt = '';
      img.width = 14;
      img.height = 14;
      const fallbackSvg = document.createElement('span');
      fallbackSvg.style.display = 'none';
      fallbackSvg.innerHTML = iconMarkup('globe', 14);
      img.onerror = () => {
        img.style.display = 'none';
        fallbackSvg.style.display = 'inline-flex';
      };
      favicon.append(img, fallbackSvg);
    } else {
      favicon.innerHTML = iconMarkup('globe', 14);
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
    iconEl.innerHTML = iconMarkup('file', 16);

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
    folderBtn.innerHTML = iconMarkup('folder-open', 14);
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
    // Internal pages hide the address row entirely; main shrinks the chrome to
  // match, so leaving it visible here would float over the page.
  if (omniboxRow) omniboxRow.hidden = Boolean(state.hideAddressBar);
  omnibox.value = state.activeUrl || '';
  if (favoriteButton) {
    favoriteButton.classList.toggle('favorited', Boolean(state.activeFavorited));
    favoriteButton.disabled = !state.canFavorite;
    favoriteButton.title = state.activeFavorited ? 'Remover dos favoritos (Ctrl+D)' : 'Adicionar aos favoritos (Ctrl+D)';
  }
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
  // Keeping focus left the typed text stale and blocked the auto-hide, so the
  // bar stayed open showing what was typed instead of the loaded URL.
  omnibox.blur();
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
  const modKey = event.ctrlKey || event.metaKey;

  if (key === 'escape') {
    if (isFindOpen()) {
      closeFind();
      return;
    }
    if (isPanelOpen()) {
      closeDownloadsPanel();
      return;
    }
  }

  if (modKey && key === 'f') {
    event.preventDefault();
    openFind();
    return;
  }

  if (key === 'f3') {
    event.preventDefault();
    if (isFindOpen()) runFind(findInput.value, { findNext: true, forward: !event.shiftKey });
    else openFind();
    return;
  }

  if (modKey && key === 'l') {
    event.preventDefault();
    focusAddress();
  }

  if (modKey && key === 't') {
    event.preventDefault();
    command('new-tab');
  }

  if (modKey && key === 'n') {
    event.preventDefault();
    command(event.shiftKey ? 'new-private-window' : 'new-window');
  }

  if (modKey && (key === 'h' || key === ',')) {
    event.preventDefault();
    command('open-settings');
  }

  if (modKey && (key === 'd' || key === 'b')) {
    event.preventDefault();
    command('open-favorites');
  }

  if (modKey && event.shiftKey && (key === 'e' || key === 'x')) {
    event.preventDefault();
    command('open-extensions');
  }

  if (key === 'f12' || (modKey && event.shiftKey && key === 'i')) {
    event.preventDefault();
    command('toggle-devtools');
  }

  if (modKey && (key === '=' || key === '+')) {
    event.preventDefault();
    command('zoom-in');
  }

  if (modKey && key === '-') {
    event.preventDefault();
    command('zoom-out');
  }

  if (modKey && key === '0') {
    event.preventDefault();
    command('zoom-reset');
  }

  if (modKey && key === 'j') {
    event.preventDefault();
    toggleDownloadsPanel();
  }

  if (modKey && key === 'w') {
    event.preventDefault();
    command('close-tab', state.activeId);
  }

  if ((modKey && key === 'r') || key === 'f5') {
    event.preventDefault();
    command(event.shiftKey ? 'reload-hard' : 'reload');
  }

  if (modKey && event.shiftKey && key === 't') {
    event.preventDefault();
    command('reopen-closed-tab');
    return;
  }

  if (modKey && key === 'tab') {
    event.preventDefault();
    command(event.shiftKey ? 'cycle-previous' : 'cycle-next');
  }

  if (modKey && /^[1-9]$/u.test(key)) {
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

// Find in page
const findBar = document.querySelector('#find-bar');
const findInput = document.querySelector('#find-input');
const findCount = document.querySelector('#find-count');
let findRequestId = 0;

function isFindOpen() { return findBar && !findBar.hidden; }

function openFind() {
  if (!findBar) return;
  const selection = String(window.getSelection?.() || '').trim();
  findBar.hidden = false;
  window.zeos.setFindOpen(true);
  if (selection) findInput.value = selection;
  findInput.focus();
  findInput.select();
  if (findInput.value) runFind(findInput.value, {});
}

function closeFind() {
  if (!findBar || findBar.hidden) return;
  findBar.hidden = true;
  findCount.textContent = '';
  findInput.classList.remove('no-match');
  window.zeos.stopFind();
  window.zeos.setFindOpen(false);
}

function runFind(text, options) {
  if (!text) {
    findCount.textContent = '';
    findInput.classList.remove('no-match');
    window.zeos.stopFind();
    return;
  }
  findRequestId += 1;
  window.zeos.find(text, options);
}

if (findBar) {
  findInput.addEventListener('input', () => runFind(findInput.value, {}));
  findInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runFind(findInput.value, { findNext: true, forward: !event.shiftKey });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeFind();
    }
  });
  document.querySelector('#find-next').addEventListener('click', () => runFind(findInput.value, { findNext: true, forward: true }));
  document.querySelector('#find-prev').addEventListener('click', () => runFind(findInput.value, { findNext: true, forward: false }));
  document.querySelector('#find-close').addEventListener('click', closeFind);

  window.zeos.onFindResult((result) => {
    if (!isFindOpen()) return;
    const total = result.matches || 0;
    const current = total ? (result.activeMatchOrdinal || 0) : 0;
    findCount.textContent = findInput.value ? `${current}/${total}` : '';
    findInput.classList.toggle('no-match', Boolean(findInput.value) && total === 0);
  });
}

window.zeos.onOpenFind(() => openFind());

// Favorites
if (favoriteButton) {
  favoriteButton.addEventListener('click', () => window.zeos.toggleFavorite());
}

// Omnibox suggestions
const suggestionsEl = document.querySelector('#suggestions');
let suggestions = [];
let suggestionIndex = -1;
let suggestSeq = 0;

function hideSuggestions() {
  if (!suggestionsEl) return;
  if (!suggestionsEl.hidden) window.zeos.setSuggestionsOpen(false);
  suggestionsEl.hidden = true;
  suggestionsEl.replaceChildren();
  suggestions = [];
  suggestionIndex = -1;
}

function renderSuggestions() {
  if (!suggestionsEl) return;
  suggestionsEl.replaceChildren();
  if (!suggestions.length) {
    if (!suggestionsEl.hidden) window.zeos.setSuggestionsOpen(false);
    suggestionsEl.hidden = true;
    return;
  }
  suggestions.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = `suggestion${index === suggestionIndex ? ' selected' : ''}`;
    row.role = 'option';
    row.setAttribute('aria-selected', String(index === suggestionIndex));

    if (item.favorite) {
      const star = document.createElement('span');
      star.className = 'suggestion-star';
      star.innerHTML = iconMarkup('star', 11);
      row.appendChild(star);
    }

    const title = document.createElement('span');
    title.className = 'suggestion-title';
    title.textContent = item.title || item.url;

    const url = document.createElement('span');
    title.title = item.title || '';
    url.className = 'suggestion-url';
    url.textContent = item.url;

    row.append(title, url);
    // mousedown, not click: the omnibox blur would tear the row down first.
    row.addEventListener('mousedown', (event) => {
      event.preventDefault();
      openSuggestion(index);
    });
    suggestionsEl.appendChild(row);
  });
  suggestionsEl.hidden = false;
  window.zeos.setSuggestionsOpen(true);
}

function openSuggestion(index) {
  const item = suggestions[index];
  if (!item) return;
  hideSuggestions();
  omnibox.value = item.url;
  command('navigate', item.url);
  omnibox.blur();
}

async function refreshSuggestions() {
  const query = omnibox.value.trim();
  if (!query || document.activeElement !== omnibox) {
    hideSuggestions();
    return;
  }
  const seq = ++suggestSeq;
  const results = await window.zeos.suggest(query);
  if (seq !== suggestSeq || document.activeElement !== omnibox) return;
  suggestions = Array.isArray(results) ? results : [];
  suggestionIndex = -1;
  renderSuggestions();
}

function moveSuggestion(delta) {
  if (!suggestions.length) return false;
  suggestionIndex += delta;
  if (suggestionIndex < -1) suggestionIndex = suggestions.length - 1;
  if (suggestionIndex >= suggestions.length) suggestionIndex = -1;
  renderSuggestions();
  return true;
}

if (suggestionsEl) {
  omnibox.addEventListener('input', refreshSuggestions);
  omnibox.addEventListener('blur', () => setTimeout(hideSuggestions, 120));
  omnibox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (moveSuggestion(event.key === 'ArrowDown' ? 1 : -1)) event.preventDefault();
    } else if (event.key === 'Enter' && suggestionIndex >= 0) {
      event.preventDefault();
      openSuggestion(suggestionIndex);
    } else if (event.key === 'Escape') {
      hideSuggestions();
    }
  });
}
