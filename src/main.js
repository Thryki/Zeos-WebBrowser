'use strict';

const { app, BrowserWindow, WebContentsView, Menu, MenuItem, ipcMain, session, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { HOME_URL, SEARCH_PROVIDERS, toNavigationTarget } = require('./navigation');
const { THEMES, getTheme } = require('./themes');

const TAB_HEIGHT = 38;
const ADDRESS_HEIGHT = 38;
const DEFAULT_BOUNDS = { width: 1200, height: 760 };
const FONTS = ['IBM Plex Mono', 'Cascadia Mono', 'Consolas', 'JetBrains Mono', 'Courier New'];

const DEFAULT_SETTINGS = {
  initialPage: HOME_URL,
  searchProvider: 'duckduckgo',
  appearance: {
    themeId: 'orca',
    background: '#050805',
    foreground: '#8abe85',
    accent: '#69a865',
    panel: '#0a120b',
    panelHover: '#121f14',
    border: 'rgba(105, 168, 101, 0.2)',
    font: 'IBM Plex Mono',
    zoomLevel: 100
  },
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
  permissions: { notifications: false, media: false },
  extensions: [],
  history: []
};

let settings;
let settingsTimer;
let privateNumber = 0;
const browsers = new Set();
const chromeOwners = new Map();
const pageOwners = new Map();
const configuredSessions = new WeakSet();

// Download tracking system
const sessionDownloads = [];
const activeDownloadItems = new Map();

function userFile(name) { return path.join(app.getPath('userData'), name); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function readJson(name, fallback) { try { return JSON.parse(fs.readFileSync(userFile(name), 'utf8')); } catch { return fallback; } }

function loadSettings() {
  const stored = readJson('settings.json', {});
  return {
    ...copy(DEFAULT_SETTINGS),
    ...stored,
    appearance: { ...DEFAULT_SETTINGS.appearance, ...(stored.appearance || {}) },
    navbarButtons: { ...DEFAULT_SETTINGS.navbarButtons, ...(stored.navbarButtons || {}) },
    permissions: { ...DEFAULT_SETTINGS.permissions, ...(stored.permissions || {}) },
    extensions: Array.isArray(stored.extensions) ? stored.extensions : [],
    history: Array.isArray(stored.history) ? stored.history.slice(0, 2000) : []
  };
}

function saveSettingsSoon() { clearTimeout(settingsTimer); settingsTimer = setTimeout(saveSettings, 250); }
function saveSettings() {
  clearTimeout(settingsTimer);
  try { fs.mkdirSync(app.getPath('userData'), { recursive: true }); fs.writeFileSync(userFile('settings.json'), JSON.stringify(settings), 'utf8'); } catch (error) { console.error(error); }
}

function getSystemStats() {
  let ramMB = 0;
  let cpuPercent = 0;
  try {
    const metrics = app.getAppMetrics();
    let totalMemKB = 0;
    for (const m of metrics) {
      totalMemKB += (m.memory?.workingSetSize || m.memory?.privateBytes || 0);
      cpuPercent += (m.cpu?.percentCPUUsage || 0);
    }
    ramMB = Math.round(totalMemKB / 1024);
  } catch {}
  if (!ramMB || ramMB < 50) {
    ramMB = Math.round(process.memoryUsage().rss / 1024 / 1024) || 280;
  }
  return {
    ramMB: Math.max(120, ramMB),
    cpuPercent: Math.min(100, Math.round(cpuPercent))
  };
}

function applyZoomToBrowser(browser) {
  const factor = (settings.appearance?.zoomLevel || 100) / 100;
  if (!browser.chrome.webContents.isDestroyed()) {
    browser.chrome.webContents.setZoomFactor(factor);
  }
  if (browser.tabs) {
    for (const tab of browser.tabs) {
      if (!tab.view.webContents.isDestroyed()) {
        tab.view.webContents.setZoomFactor(factor);
      }
    }
  }
  browser.layout();
}

function notifySettings() {
  for (const browser of browsers) {
    applyZoomToBrowser(browser);
    browser.sendState();
    for (const tab of browser.tabs) {
      if ((tab.kind === 'settings' || tab.kind === 'favorites') && !tab.view.webContents.isDestroyed()) {
        tab.view.webContents.send('settings:changed', { ...copy(settings), themes: THEMES });
      }
    }
  }
}

function updateSettings(patch) {
  if (!patch || typeof patch !== 'object') return { ...copy(settings), themes: THEMES };
  if (typeof patch.initialPage === 'string' && patch.initialPage.trim() && patch.initialPage.length < 2048) settings.initialPage = toNavigationTarget(patch.initialPage).url;
  if (SEARCH_PROVIDERS[patch.searchProvider]) settings.searchProvider = patch.searchProvider;
  
  // Theme ID selection
  if (typeof patch.themeId === 'string') {
    const selectedTheme = getTheme(patch.themeId);
    if (selectedTheme) {
      const currentZoom = settings.appearance?.zoomLevel || 100;
      settings.appearance = { ...settings.appearance, ...selectedTheme.appearance, zoomLevel: currentZoom };
    }
  }

  // Appearance customization
  if (patch.appearance && typeof patch.appearance === 'object') {
    if (typeof patch.appearance.themeId === 'string') {
      const selectedTheme = getTheme(patch.appearance.themeId);
      if (selectedTheme) {
        settings.appearance = { ...settings.appearance, ...selectedTheme.appearance };
      }
    }
    for (const key of ['background', 'foreground', 'accent', 'panel', 'panelHover', 'border']) {
      if (typeof patch.appearance[key] === 'string' && patch.appearance[key].trim()) {
        settings.appearance[key] = patch.appearance[key];
      }
    }
    if (FONTS.includes(patch.appearance.font)) settings.appearance.font = patch.appearance.font;
    if (typeof patch.appearance.zoomLevel === 'number') {
      const clamped = Math.max(50, Math.min(200, Math.round(patch.appearance.zoomLevel)));
      settings.appearance.zoomLevel = clamped;
    }
  }

  // Navbar Buttons customization
  if (patch.navbarButtons && typeof patch.navbarButtons === 'object') {
    for (const key of ['back', 'forward', 'reload', 'home', 'appMenu', 'showCpu', 'showRam']) {
      if (typeof patch.navbarButtons[key] === 'boolean') {
        settings.navbarButtons[key] = patch.navbarButtons[key];
      }
    }
    if (['active-only', 'always', 'hidden'].includes(patch.navbarButtons.downloadMode)) {
      settings.navbarButtons.downloadMode = patch.navbarButtons.downloadMode;
    }
  }

  if (patch.permissions && typeof patch.permissions === 'object') {
    for (const key of ['notifications', 'media']) {
      if (typeof patch.permissions[key] === 'boolean') settings.permissions[key] = patch.permissions[key];
    }
  }

  saveSettingsSoon();
  notifySettings();
  return { ...copy(settings), themes: THEMES };
}

function clearHistoryRange(range) {
  const now = Date.now();
  if (range === '1h') {
    const threshold = now - 3600 * 1000;
    settings.history = settings.history.filter(item => (item.visitedAt || 0) < threshold);
  } else if (range === '24h') {
    const threshold = now - 24 * 3600 * 1000;
    settings.history = settings.history.filter(item => (item.visitedAt || 0) < threshold);
  } else if (range === '7d') {
    const threshold = now - 7 * 24 * 3600 * 1000;
    settings.history = settings.history.filter(item => (item.visitedAt || 0) < threshold);
  } else if (range === '4w') {
    const threshold = now - 28 * 24 * 3600 * 1000;
    settings.history = settings.history.filter(item => (item.visitedAt || 0) < threshold);
  } else {
    settings.history = [];
  }
  saveSettingsSoon();
  notifySettings();
  return { ...copy(settings), themes: THEMES };
}

function removeHistoryItem(url) {
  settings.history = settings.history.filter(item => item.url !== url);
  saveSettingsSoon();
  notifySettings();
  return { ...copy(settings), themes: THEMES };
}

function addHistory(url, title) {
  if (!url || !url.startsWith('http')) return;
  settings.history = [{ url, title: title || url, visitedAt: Date.now() }, ...settings.history.filter((entry) => entry.url !== url)].slice(0, 2000);
  saveSettingsSoon();
}

function readSession() {
  const stored = readJson('session.json', {});
  const tabs = Array.isArray(stored.tabs) ? stored.tabs.filter((tab) => typeof tab.url === 'string' && tab.url).map((tab) => ({ ...tab, pinned: Boolean(tab.pinned) })) : [];
  return { bounds: stored.bounds || DEFAULT_BOUNDS, tabs, activeIndex: Math.max(0, Number(stored.activeIndex) || 0) };
}

// Chrome Extension management
async function loadSavedExtensions() {
  if (!Array.isArray(settings.extensions)) {
    settings.extensions = [];
  }
  const loaded = [];
  for (const extPath of settings.extensions) {
    if (fs.existsSync(extPath)) {
      try {
        await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
        loaded.push(extPath);
      } catch (err) {
        console.error('Failed to load extension:', extPath, err);
      }
    }
  }
  settings.extensions = loaded;
}

function getExtensionDetails(ext) {
  let manifest = ext.manifest;
  if (!manifest && ext.path) {
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(ext.path, 'manifest.json'), 'utf8'));
    } catch {}
  }
  manifest = manifest || {};

  const action = manifest.action || manifest.browser_action || manifest.page_action || {};
  const popup = action.default_popup || '';

  // Determine icon data url
  let iconDataUrl = '';
  const iconCandidates = [];

  if (typeof action.default_icon === 'string') {
    iconCandidates.push(action.default_icon);
  } else if (typeof action.default_icon === 'object' && action.default_icon) {
    const sizes = ['32', '48', '24', '16', '128'];
    for (const s of sizes) {
      if (action.default_icon[s]) iconCandidates.push(action.default_icon[s]);
    }
    Object.values(action.default_icon).forEach(p => iconCandidates.push(p));
  }

  if (typeof manifest.icons === 'object' && manifest.icons) {
    const sizes = ['32', '48', '24', '16', '128'];
    for (const s of sizes) {
      if (manifest.icons[s]) iconCandidates.push(manifest.icons[s]);
    }
    Object.values(manifest.icons).forEach(p => iconCandidates.push(p));
  }

  if (ext.path) {
    for (const relPath of iconCandidates) {
      if (!relPath || typeof relPath !== 'string') continue;
      const fullPath = path.join(ext.path, relPath);
      if (fs.existsSync(fullPath)) {
        try {
          const extName = path.extname(fullPath).toLowerCase();
          let mime = 'image/png';
          if (extName === '.svg') mime = 'image/svg+xml';
          else if (extName === '.jpg' || extName === '.jpeg') mime = 'image/jpeg';
          else if (extName === '.webp') mime = 'image/webp';
          else if (extName === '.ico') mime = 'image/x-icon';
          const base64 = fs.readFileSync(fullPath).toString('base64');
          iconDataUrl = `data:${mime};base64,${base64}`;
          break;
        } catch {}
      }
    }
  }

  return {
    id: ext.id,
    name: manifest.name || ext.name,
    version: manifest.version || ext.version,
    description: manifest.description || ext.description || '',
    icon: iconDataUrl,
    popup,
    optionsPage: manifest.options_page || (manifest.options_ui?.page) || '',
    path: ext.path
  };
}

async function loadUnpackedExtension(win) {
  const targetWin = win || BrowserWindow.getFocusedWindow() || (browsers.values().next().value?.window);
  const result = await dialog.showOpenDialog(targetWin, {
    title: 'Selecionar pasta da extensão descompactada do Chrome (contendo manifest.json)',
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  const extPath = result.filePaths[0];
  try {
    const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
    if (!settings.extensions.includes(extPath)) {
      settings.extensions.push(extPath);
      saveSettingsSoon();
    }
    notifySettings();
    return getExtensionDetails(ext);
  } catch (error) {
    dialog.showErrorBox('Erro ao carregar extensão', error.message || 'Pasta inválida ou sem manifest.json.');
    return null;
  }
}

function getInstalledExtensions() {
  const exts = session.defaultSession.getAllExtensions();
  return exts.map(getExtensionDetails);
}

function removeExtension(extensionId) {
  try {
    const ext = session.defaultSession.getAllExtensions().find(e => e.id === extensionId);
    if (ext) {
      session.defaultSession.removeExtension(extensionId);
      if (ext.path) {
        settings.extensions = settings.extensions.filter(p => p !== ext.path);
        saveSettingsSoon();
      }
      notifySettings();
      return true;
    }
  } catch (err) {
    console.error(err);
  }
  return false;
}

function getDownloadsSummary() {
  const active = sessionDownloads.filter(d => d.state === 'progressing');
  const activeCount = active.length;
  let totalBytes = 0;
  let receivedBytes = 0;
  for (const item of active) {
    if (item.totalBytes > 0) {
      totalBytes += item.totalBytes;
      receivedBytes += item.receivedBytes;
    }
  }
  const overallPercent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : (activeCount > 0 ? 50 : 100);
  return {
    activeCount,
    overallPercent,
    items: sessionDownloads.slice(0, 30)
  };
}

function broadcastDownloads() {
  const summary = getDownloadsSummary();
  for (const browser of browsers) {
    browser.sendState();
    if (!browser.chrome.webContents.isDestroyed()) {
      browser.chrome.webContents.send('browser:downloads-updated', summary);
    }
  }
}

function setupSession(browserSession) {
  if (configuredSessions.has(browserSession)) return;
  configuredSessions.add(browserSession);
  browserSession.setPermissionRequestHandler((_contents, permission, callback) => callback(Boolean(
    (permission === 'notifications' && settings.permissions.notifications) || (permission === 'media' && settings.permissions.media)
  )));

  browserSession.on('will-download', (_event, item, source) => {
    const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const savePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(savePath);

    const downloadRecord = {
      id: downloadId,
      filename: item.getFilename(),
      savePath,
      totalBytes: item.getTotalBytes() || 0,
      receivedBytes: item.getReceivedBytes() || 0,
      state: 'progressing',
      startTime: Date.now(),
      mimeType: item.getMimeType() || ''
    };

    activeDownloadItems.set(downloadId, item);
    sessionDownloads.unshift(downloadRecord);
    broadcastDownloads();

    const owner = source && pageOwners.get(source.id);
    if (owner) {
      owner.downloads += 1;
      owner.sendState();
      if (!owner.chrome.webContents.isDestroyed()) {
        owner.chrome.webContents.send('browser:download-started', downloadRecord);
      }
    }

    item.on('updated', (_evt, state) => {
      downloadRecord.receivedBytes = item.getReceivedBytes();
      downloadRecord.totalBytes = item.getTotalBytes() || downloadRecord.totalBytes;
      downloadRecord.state = state;
      broadcastDownloads();
    });

    item.once('done', (_evt, state) => {
      activeDownloadItems.delete(downloadId);
      downloadRecord.state = state;
      downloadRecord.receivedBytes = item.getReceivedBytes();
      if (owner) {
        owner.downloads = Math.max(0, owner.downloads - 1);
        owner.sendState();
      }
      broadcastDownloads();
    });
  });
}

class Browser {
  constructor(privateMode = false, restoreSession = false, initialUrl = null, initialBounds = null) {
    this.privateMode = privateMode;
    this.restoreSession = restoreSession;
    this.initialUrl = initialUrl;
    this.initialBounds = initialBounds;
    this.partition = privateMode ? `temp:zeos-${++privateNumber}` : undefined;
    this.tabs = [];
    this.activeId = null;
    this.expanded = false;
    this.downloadsPanelOpen = false;
    this.downloads = 0;
    this.sessionTimer = undefined;
    this.dragStartBounds = null;
    this.dragStartMouse = null;
    this.lastMenuClosedAt = 0;
    this.open();
  }
  open() {
    const sessionData = (!this.privateMode && this.restoreSession) ? readSession() : { bounds: DEFAULT_BOUNDS, tabs: [], activeIndex: 0 };
    const bounds = this.initialBounds || sessionData.bounds;
    this.window = new BrowserWindow({
      ...bounds,
      minWidth: 520,
      minHeight: 360,
      frame: false,
      show: false,
      backgroundColor: settings.appearance.background || '#050805',
      icon: path.join(__dirname, 'assets', 'zeos-logo.png'),
      title: this.privateMode ? 'zeos privado' : 'zeos',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    browsers.add(this);
    this.window.on('resize', () => this.layout());
    this.window.on('close', () => this.saveSession());
    this.window.on('closed', () => this.destroy());
    this.chrome = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    this.window.contentView.addChildView(this.chrome);
    chromeOwners.set(this.chrome.webContents.id, this);
    this.chrome.webContents.loadFile(path.join(__dirname, 'ui', 'index.html'));
    this.chrome.webContents.once('did-finish-load', () => {
      const zoomFactor = (settings.appearance?.zoomLevel || 100) / 100;
      this.chrome.webContents.setZoomFactor(zoomFactor);
      this.sendState();
    });

    const startupTabs = sessionData.tabs.length ? sessionData.tabs : [{ url: this.initialUrl || settings.initialPage }];
    startupTabs.forEach((tab, index) => {
      const created = this.createWebTab(tab.url, index === Math.min(sessionData.activeIndex, startupTabs.length - 1));
      if (tab.pinned) created.pinned = true;
    });
    this.reorderPinnedTabs();
    if (!this.activeId) this.activeId = this.tabs[0]?.id;
    this.layout();
    this.window.show();
  }
  destroy() {
    clearTimeout(this.sessionTimer);
    browsers.delete(this);
    chromeOwners.delete(this.chrome.webContents.id);
    for (const tab of this.tabs) {
      pageOwners.delete(tab.view.webContents.id);
      if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
    }
    if (!this.chrome.webContents.isDestroyed()) this.chrome.webContents.close();
    this.tabs = [];
  }
  active() { return this.tabs.find((tab) => tab.id === this.activeId); }
  layout() {
    if (this.window.isDestroyed()) return;
    const { width, height } = this.window.getContentBounds();
    const zoomFactor = (settings?.appearance?.zoomLevel || 100) / 100;
    const baseTop = TAB_HEIGHT + (this.expanded ? ADDRESS_HEIGHT : 0);
    const top = Math.round(baseTop * zoomFactor);

    if (this.downloadsPanelOpen) {
      this.window.contentView.addChildView(this.chrome);
      this.chrome.setBounds({ x: 0, y: 0, width, height: Math.min(height, Math.round(520 * zoomFactor)) });
    } else {
      this.chrome.setBounds({ x: 0, y: 0, width, height: top });
    }

    for (const tab of this.tabs) {
      tab.view.setBounds(
        tab.id === this.activeId
          ? { x: 0, y: top, width, height: Math.max(0, height - top) }
          : { x: 0, y: height + 1, width: 0, height: 0 }
      );
    }
  }
  setExpanded(value, focus = false) {
    if (this.expanded !== Boolean(value)) {
      this.expanded = Boolean(value);
      this.layout();
      this.sendState();
    }
    if (focus && this.expanded) {
      this.chrome.webContents.focus();
      this.chrome.webContents.send('browser:focus-omnibox');
    }
  }
  setDownloadsPanelOpen(value) {
    const next = Boolean(value);
    if (this.downloadsPanelOpen !== next) {
      this.downloadsPanelOpen = next;
      this.layout();
      this.sendState();
    }
  }
  toggleChrome() { this.setExpanded(!this.expanded, !this.expanded); }
  handleDrag(action, payload = {}) {
    if (this.window.isDestroyed()) return;
    if (action === 'start') {
      this.dragStartBounds = this.window.getBounds();
      this.dragStartMouse = { x: payload.screenX, y: payload.screenY };
    } else if (action === 'move' && this.dragStartBounds && this.dragStartMouse) {
      if (this.window.isMaximized()) {
        this.window.unmaximize();
        const bounds = this.window.getBounds();
        this.dragStartBounds = bounds;
        this.dragStartBounds.x = payload.screenX - Math.round(bounds.width / 2);
        this.dragStartBounds.y = payload.screenY - 14;
        this.window.setBounds({
          x: this.dragStartBounds.x,
          y: this.dragStartBounds.y,
          width: bounds.width,
          height: bounds.height
        });
        return;
      }
      const dx = payload.screenX - this.dragStartMouse.x;
      const dy = payload.screenY - this.dragStartMouse.y;
      this.window.setPosition(
        Math.round(this.dragStartBounds.x + dx),
        Math.round(this.dragStartBounds.y + dy)
      );
    } else if (action === 'end') {
      this.dragStartBounds = null;
      this.dragStartMouse = null;
    }
  }
  stateFor(tab) {
    const history = tab.view.webContents.navigationHistory;
    return {
      id: tab.id,
      title: tab.title || 'nova aba',
      url: tab.url || '',
      favicon: tab.favicon || '',
      isLoading: tab.loading,
      kind: tab.kind,
      pinned: Boolean(tab.pinned),
      canGoBack: history.canGoBack(),
      canGoForward: history.canGoForward()
    };
  }
  sendState() {
    if (this.chrome?.webContents.isDestroyed()) return;
    const active = this.active();
    const history = active?.view.webContents.navigationHistory;
    const downloadsSummary = getDownloadsSummary();
    this.chrome.webContents.send('browser:state', {
      tabs: this.tabs.map((tab, idx) => ({ ...this.stateFor(tab), index: idx + 1 })),
      activeId: this.activeId,
      activeUrl: active?.url || '',
      activeLoading: Boolean(active?.loading),
      canGoBack: Boolean(history?.canGoBack()),
      canGoForward: Boolean(history?.canGoForward()),
      expanded: this.expanded,
      downloadsPanelOpen: this.downloadsPanelOpen,
      downloads: this.downloads,
      downloadsSummary,
      extensions: getInstalledExtensions(),
      privateMode: this.privateMode,
      appearance: settings.appearance,
      navbarButtons: settings.navbarButtons,
      systemStats: getSystemStats()
    });
  }
  createView(kind) {
    const view = new WebContentsView({
      webPreferences: {
        preload: (kind === 'settings' || kind === 'favorites') ? path.join(__dirname, 'settings-preload.js') : undefined,
        partition: this.partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });
    const zoomFactor = (settings.appearance?.zoomLevel || 100) / 100;
    view.webContents.setZoomFactor(zoomFactor);
    setupSession(view.webContents.session);
    return view;
  }
  createWebTab(url = settings.initialPage, activate = true) { return this.createTab('web', url, activate); }
  createSpecialTab(kind) { return this.createTab(kind, '', true); }
  createTab(kind, target, activate) {
    const view = this.createView(kind);
    let initialFavicon = '';
    if (target && target.startsWith('http')) {
      try {
        const host = new URL(target).hostname;
        initialFavicon = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
      } catch {}
    }
    const tab = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      view,
      title: kind === 'settings' ? 'configurações' : kind === 'favorites' ? 'favoritos' : 'nova aba',
      url: target || '',
      favicon: initialFavicon,
      loading: true,
      pinned: false
    };
    this.tabs.push(tab);
    pageOwners.set(view.webContents.id, this);
    this.window.contentView.addChildView(view);
    this.tabEvents(tab);
    if (activate) this.activeId = tab.id;
    this.layout();
    if (kind === 'settings') view.webContents.loadFile(path.join(__dirname, 'settings', 'index.html'));
    else if (kind === 'favorites') view.webContents.loadFile(path.join(__dirname, 'favorites', 'index.html'));
    else this.navigate(tab, target);
    this.sendState();
    this.saveSessionSoon();
    return tab;
  }
  tabEvents(tab) {
    const contents = tab.view.webContents;
    const getOwner = () => pageOwners.get(contents.id) || this;
    contents.on('before-input-event', (event, input) => getOwner().keyboard(event, input));
    contents.on('page-title-updated', (_event, title) => {
      tab.title = title || 'sem título';
      const owner = getOwner();
      owner.sendState();
      owner.saveSessionSoon();
    });
    contents.on('did-start-loading', () => {
      tab.loading = true;
      getOwner().sendState();
    });
    contents.on('did-stop-loading', () => {
      tab.loading = false;
      const owner = getOwner();
      owner.sendState();
      owner.saveSessionSoon();
    });
    contents.on('did-navigate', (_event, url) => {
      if (tab.kind === 'web') {
        tab.url = url;
        if (url.startsWith('http')) {
          try {
            const host = new URL(url).hostname;
            if (!tab.favicon || tab.favicon.includes('google.com/s2/favicons')) {
              tab.favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
            }
          } catch {}
        }
        addHistory(url, tab.title);
        const owner = getOwner();
        owner.sendState();
        owner.saveSessionSoon();
      }
    });
    contents.on('did-navigate-in-page', (_event, url) => {
      if (tab.kind === 'web') {
        tab.url = url;
        addHistory(url, tab.title);
        const owner = getOwner();
        owner.sendState();
        owner.saveSessionSoon();
      }
    });
    contents.on('did-fail-load', (_event, code, description, url, mainFrame) => {
      if (mainFrame && code !== -3) {
        tab.url = url || tab.url;
        tab.title = `erro: ${description}`;
        tab.loading = false;
        getOwner().sendState();
      }
    });
    contents.on('page-favicon-updated', (_event, favicons) => {
      if (Array.isArray(favicons) && favicons.length > 0) {
        tab.favicon = favicons[0];
        getOwner().sendState();
      }
    });
    contents.setWindowOpenHandler(({ url }) => {
      getOwner().createWebTab(url);
      return { action: 'deny' };
    });

    // Context menu for web pages
    contents.on('context-menu', (_event, params) => {
      const owner = getOwner();
      const menu = new Menu();
      if (params.linkURL) {
        menu.append(new MenuItem({ label: 'Abrir link em nova aba', click: () => owner.createWebTab(params.linkURL) }));
        menu.append(new MenuItem({ label: 'Copiar endereço do link', click: () => { const { clipboard } = require('electron'); clipboard.writeText(params.linkURL); } }));
        menu.append(new MenuItem({ type: 'separator' }));
      }
      if (params.editFlags.canCopy) menu.append(new MenuItem({ role: 'copy', label: 'Copiar' }));
      if (params.editFlags.canCut) menu.append(new MenuItem({ role: 'cut', label: 'Recortar' }));
      if (params.editFlags.canPaste) menu.append(new MenuItem({ role: 'paste', label: 'Colar' }));
      if (params.editFlags.canSelectAll) menu.append(new MenuItem({ role: 'selectAll', label: 'Selecionar tudo' }));

      if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Voltar', enabled: contents.navigationHistory.canGoBack(), click: () => contents.navigationHistory.goBack() }));
      menu.append(new MenuItem({ label: 'Avançar', enabled: contents.navigationHistory.canGoForward(), click: () => contents.navigationHistory.goForward() }));
      menu.append(new MenuItem({ label: 'Recarregar', click: () => contents.reload() }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Inspecionar elemento', click: () => contents.inspectElement(params.x, params.y) }));

      menu.popup({ window: owner.window });
    });
  }
  keyboard(event, input) {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    const key = input.key.toLowerCase(); const ctrl = input.control || input.meta; const tab = this.active();
    if (key === 'shift') { event.preventDefault(); this.toggleChrome(); return; }
    if (ctrl && key === 'l') { event.preventDefault(); this.setExpanded(true, true); return; }
    if (ctrl && key === 't') { event.preventDefault(); this.createWebTab(); return; }
    if (ctrl && key === 'n') {
      event.preventDefault();
      if (input.shift) new Browser(true, false);
      else new Browser(false, false);
      return;
    }
    if (ctrl && key === 'w') { event.preventDefault(); this.closeTab(this.activeId); return; }
    if (ctrl && key === 'j') {
      event.preventDefault();
      this.chrome.webContents.send('browser:toggle-downloads');
      return;
    }
    if (ctrl && (key === 'h' || (ctrl && key === ','))) {
      event.preventDefault();
      this.createSpecialTab('settings');
      return;
    }
    if (ctrl && (key === 'd' || key === 'b')) {
      event.preventDefault();
      this.createSpecialTab('favorites');
      return;
    }
    if (key === 'f5' || (ctrl && key === 'r')) {
      event.preventDefault();
      if (input.shift || (ctrl && input.shift)) tab?.view.webContents.reloadIgnoringCache();
      else tab?.view.webContents.reload();
      return;
    }
    if (key === 'f12' || (ctrl && input.shift && key === 'i')) {
      event.preventDefault();
      tab?.view.webContents.toggleDevTools();
      return;
    }
    if (ctrl && (key === '=' || key === '+')) {
      event.preventDefault();
      const cur = settings.appearance?.zoomLevel || 100;
      updateSettings({ appearance: { zoomLevel: Math.min(200, cur + 10) } });
      return;
    }
    if (ctrl && key === '-') {
      event.preventDefault();
      const cur = settings.appearance?.zoomLevel || 100;
      updateSettings({ appearance: { zoomLevel: Math.max(50, cur - 10) } });
      return;
    }
    if (ctrl && key === '0') {
      event.preventDefault();
      updateSettings({ appearance: { zoomLevel: 100 } });
      return;
    }
    if (ctrl && key === 'tab') { event.preventDefault(); this.cycle(input.shift ? -1 : 1); return; }
    if (ctrl && /^[1-9]$/u.test(key)) { event.preventDefault(); const next = this.tabs[Number(key) - 1] || this.tabs.at(-1); if (next) this.selectTab(next.id); return; }
    if (input.alt && input.key === 'ArrowLeft' && tab?.view.webContents.navigationHistory.canGoBack()) { event.preventDefault(); tab.view.webContents.navigationHistory.goBack(); return; }
    if (input.alt && input.key === 'ArrowRight' && tab?.view.webContents.navigationHistory.canGoForward()) { event.preventDefault(); tab.view.webContents.navigationHistory.goForward(); return; }
  }
  navigate(tab, target) {
    if (!tab) return;
    tab.kind = 'web';
    const { url } = toNavigationTarget(target, settings.searchProvider);
    tab.url = url;
    tab.loading = true;
    if (url.startsWith('http')) {
      try {
        const host = new URL(url).hostname;
        tab.favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
      } catch {}
    }
    tab.view.webContents.loadURL(url).catch(() => { tab.loading = false; tab.title = 'falha ao abrir'; this.sendState(); });
    this.sendState();
  }
  selectTab(id) {
    if (this.tabs.some((tab) => tab.id === id)) {
      this.activeId = id;
      this.layout();
      this.sendState();
      this.saveSessionSoon();
    }
  }
  cycle(direction) {
    const index = this.tabs.findIndex((tab) => tab.id === this.activeId);
    if (index >= 0 && this.tabs.length > 1) {
      this.selectTab(this.tabs[(index + direction + this.tabs.length) % this.tabs.length].id);
    }
  }
  reorderPinnedTabs() {
    const pinned = this.tabs.filter(t => t.pinned);
    const unpinned = this.tabs.filter(t => !t.pinned);
    this.tabs = [...pinned, ...unpinned];
  }
  togglePinTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (tab) {
      tab.pinned = !tab.pinned;
      this.reorderPinnedTabs();
      this.sendState();
      this.saveSessionSoon();
    }
  }
  duplicateTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (tab) {
      const origIndex = this.tabs.findIndex(t => t.id === id);
      const newTab = this.createWebTab(tab.url || settings.initialPage, true);
      const newIndex = this.tabs.findIndex(t => t.id === newTab.id);
      if (origIndex >= 0 && newIndex >= 0 && origIndex !== newIndex) {
        const [moved] = this.tabs.splice(newIndex, 1);
        this.tabs.splice(origIndex + 1, 0, moved);
      }
      this.sendState();
      this.saveSessionSoon();
    }
  }
  closeOtherTabs(id) {
    const others = this.tabs.filter(t => t.id !== id);
    for (const other of others) {
      this.closeTab(other.id);
    }
    this.selectTab(id);
  }
  closeTabsToRight(id) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index >= 0) {
      const toClose = this.tabs.slice(index + 1);
      for (const t of toClose) {
        this.closeTab(t.id);
      }
    }
  }
  reorderTab(tabId, targetIndex) {
    const currentIndex = this.tabs.findIndex(t => t.id === tabId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= this.tabs.length) return;
    const [tab] = this.tabs.splice(currentIndex, 1);
    this.tabs.splice(targetIndex, 0, tab);
    this.reorderPinnedTabs();
    this.sendState();
    this.saveSessionSoon();
  }
  attachTab(tabId, targetIndex = -1) {
    let sourceBrowser = null;
    let tab = null;
    let sourceIndex = -1;

    for (const b of browsers) {
      const idx = b.tabs.findIndex(t => t.id === tabId);
      if (idx >= 0) {
        sourceBrowser = b;
        tab = b.tabs[idx];
        sourceIndex = idx;
        break;
      }
    }

    if (!sourceBrowser || !tab) return;

    if (sourceBrowser === this) {
      const idx = (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < this.tabs.length) ? targetIndex : this.tabs.length - 1;
      this.reorderTab(tabId, idx);
      return;
    }

    // Moving from sourceBrowser to targetBrowser (this)
    sourceBrowser.tabs.splice(sourceIndex, 1);
    sourceBrowser.window.contentView.removeChildView(tab.view);

    if (sourceBrowser.tabs.length === 0) {
      if (sourceBrowser.window && !sourceBrowser.window.isDestroyed()) {
        sourceBrowser.window.close();
      }
    } else {
      if (sourceBrowser.activeId === tabId) {
        sourceBrowser.activeId = sourceBrowser.tabs[sourceIndex]?.id || sourceBrowser.tabs[sourceIndex - 1]?.id || sourceBrowser.tabs[0]?.id;
      }
      sourceBrowser.layout();
      sourceBrowser.sendState();
      sourceBrowser.saveSessionSoon();
    }

    pageOwners.set(tab.view.webContents.id, this);

    const zoomFactor = (settings?.appearance?.zoomLevel || 100) / 100;
    if (!tab.view.webContents.isDestroyed()) {
      tab.view.webContents.setZoomFactor(zoomFactor);
    }

    this.window.contentView.addChildView(tab.view);
    const insertIdx = (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= this.tabs.length)
      ? targetIndex
      : this.tabs.length;
    this.tabs.splice(insertIdx, 0, tab);
    this.reorderPinnedTabs();
    this.activeId = tab.id;
    this.layout();
    this.sendState();
    this.saveSessionSoon();
    if (!this.window.isDestroyed()) {
      this.window.focus();
    }
  }
  tearOffTab(tabId, screenX, screenY) {
    if (this.tabs.length <= 1) return;
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;
    const url = tab.url || settings.initialPage;
    this.closeTab(tabId);
    new Browser(this.privateMode, false, url, {
      x: Math.max(0, Math.round(screenX - 200)),
      y: Math.max(0, Math.round(screenY - 20)),
      width: 1100,
      height: 700
    });
  }
  closeTab(id) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    const [tab] = this.tabs.splice(index, 1);
    this.window.contentView.removeChildView(tab.view);
    pageOwners.delete(tab.view.webContents.id);
    tab.view.webContents.close();
    if (!this.tabs.length) {
      if (this.window && !this.window.isDestroyed()) {
        this.window.close();
      }
      return;
    }
    if (this.activeId === id) this.activeId = this.tabs[index]?.id || this.tabs[index - 1]?.id || null;
    if (!this.activeId && this.tabs.length > 0) this.activeId = this.tabs[0].id;
    this.layout();
    this.sendState();
    this.saveSessionSoon();
  }
  saveSessionSoon() { if (!this.privateMode) { clearTimeout(this.sessionTimer); this.sessionTimer = setTimeout(() => this.saveSession(), 300); } }
  saveSession() {
    clearTimeout(this.sessionTimer);
    if (this.privateMode || !this.window || this.window.isDestroyed()) return;
    const data = { bounds: this.window.getBounds(), activeIndex: Math.max(0, this.tabs.findIndex((tab) => tab.id === this.activeId)), tabs: this.tabs.filter((tab) => tab.kind === 'web').map((tab) => ({ url: tab.url || settings.initialPage, pinned: Boolean(tab.pinned) })) };
    try { fs.writeFileSync(userFile('session.json'), JSON.stringify(data), 'utf8'); } catch (error) { console.error(error); }
  }
  showMenu(menu, point = {}) {
    const options = { window: this.window, x: Math.round(Number(point.x) || 0), y: Math.round(Number(point.y) || 0) };
    if (menu === 'plus' || menu === 'app-menu') {
      const now = Date.now();
      if (now - this.lastMenuClosedAt < 250) {
        return;
      }
      const menuObj = Menu.buildFromTemplate([
        { label: 'Nova aba', accelerator: 'Ctrl+T', click: () => this.createWebTab() },
        { label: 'Nova janela', accelerator: 'Ctrl+N', click: () => new Browser(false, false) },
        { label: 'Nova janela privada', accelerator: 'Ctrl+Shift+N', click: () => new Browser(true, false) },
        { type: 'separator' },
        { label: 'Downloads', accelerator: 'Ctrl+J', click: () => this.chrome.webContents.send('browser:toggle-downloads') },
        { label: 'Favoritos', accelerator: 'Ctrl+D', click: () => this.createSpecialTab('favorites') },
        { label: 'Extensões', accelerator: 'Ctrl+Shift+X', click: () => this.createSpecialTab('settings') },
        { label: 'Configurações', accelerator: 'Ctrl+,', click: () => this.createSpecialTab('settings') },
        { type: 'separator' },
        { label: 'Personalizar barra de navegação...', click: () => this.createSpecialTab('settings') },
        { type: 'separator' },
        { label: 'Ferramentas de desenvolvedor', accelerator: 'F12', click: () => this.active()?.view.webContents.toggleDevTools() }
      ]);
      menuObj.popup({
        ...options,
        callback: () => {
          this.lastMenuClosedAt = Date.now();
        }
      });
    } else if (menu === 'tab-context') {
      const tabId = point.tabId || this.activeId;
      const tab = this.tabs.find(t => t.id === tabId) || this.active();
      if (!tab) return;
      const tabIndex = this.tabs.findIndex(t => t.id === tab.id);
      const isPinned = Boolean(tab.pinned);
      const hasTabsToRight = tabIndex < this.tabs.length - 1;
      const hasOtherTabs = this.tabs.length > 1;

      Menu.buildFromTemplate([
        { label: 'Nova aba à direita', click: () => {
          const newTab = this.createWebTab(settings.initialPage, true);
          const newIdx = this.tabs.findIndex(t => t.id === newTab.id);
          if (newIdx >= 0 && newIdx !== tabIndex + 1) {
            const [moved] = this.tabs.splice(newIdx, 1);
            this.tabs.splice(tabIndex + 1, 0, moved);
            this.sendState();
          }
        }},
        { type: 'separator' },
        { label: isPinned ? 'Desafixar aba' : 'Fixar aba', click: () => this.togglePinTab(tab.id) },
        { label: 'Duplicar aba', click: () => this.duplicateTab(tab.id) },
        { label: 'Recarregar', accelerator: 'Ctrl+R', click: () => tab.view.webContents.reload() },
        { type: 'separator' },
        { label: 'Mover para uma nova janela', enabled: hasOtherTabs, click: () => {
          const bounds = this.window.getBounds();
          this.tearOffTab(tab.id, bounds.x + 40, bounds.y + 40);
        }},
        { type: 'separator' },
        { label: 'Fechar aba', accelerator: 'Ctrl+W', click: () => this.closeTab(tab.id) },
        { label: 'Fechar outras abas', enabled: hasOtherTabs, click: () => this.closeOtherTabs(tab.id) },
        { label: 'Fechar abas à direita', enabled: hasTabsToRight, click: () => this.closeTabsToRight(tab.id) }
      ]).popup(options);
    } else if (menu === 'tabs-overflow') {
      Menu.buildFromTemplate(
        this.tabs.map((tab) => ({
          label: `${tab.pinned ? '📌 ' : ''}${tab.title || 'nova aba'}`,
          type: 'radio',
          checked: tab.id === this.activeId,
          click: () => this.selectTab(tab.id)
        }))
      ).popup(options);
    } else if (menu === 'stat-pill-cpu') {
      Menu.buildFromTemplate([
        {
          label: 'Ocultar indicador de CPU',
          click: () => updateSettings({ navbarButtons: { ...settings.navbarButtons, showCpu: false } })
        },
        { type: 'separator' },
        {
          label: 'Personalizar barra de navegação...',
          click: () => this.createSpecialTab('settings')
        }
      ]).popup(options);
    } else if (menu === 'stat-pill-ram') {
      Menu.buildFromTemplate([
        {
          label: 'Ocultar indicador de memória RAM',
          click: () => updateSettings({ navbarButtons: { ...settings.navbarButtons, showRam: false } })
        },
        { type: 'separator' },
        {
          label: 'Personalizar barra de navegação...',
          click: () => this.createSpecialTab('settings')
        }
      ]).popup(options);
    } else if (menu === 'navbar-customization') {
      const cur = settings.navbarButtons || DEFAULT_SETTINGS.navbarButtons;
      Menu.buildFromTemplate([
        {
          label: 'Botão Voltar',
          type: 'checkbox',
          checked: cur.back !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, back: !cur.back } })
        },
        {
          label: 'Botão Avançar',
          type: 'checkbox',
          checked: cur.forward !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, forward: !cur.forward } })
        },
        {
          label: 'Botão Recarregar',
          type: 'checkbox',
          checked: cur.reload !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, reload: !cur.reload } })
        },
        {
          label: 'Botão Página Inicial',
          type: 'checkbox',
          checked: cur.home !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, home: !cur.home } })
        },
        {
          label: 'Botão de Menu (≡)',
          type: 'checkbox',
          checked: cur.appMenu !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, appMenu: !cur.appMenu } })
        },
        { type: 'separator' },
        {
          label: 'Indicador de CPU',
          type: 'checkbox',
          checked: cur.showCpu !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, showCpu: !cur.showCpu } })
        },
        {
          label: 'Indicador de RAM',
          type: 'checkbox',
          checked: cur.showRam !== false,
          click: () => updateSettings({ navbarButtons: { ...cur, showRam: !cur.showRam } })
        },
        { type: 'separator' },
        {
          label: 'Exibição do Botão de Downloads',
          submenu: [
            {
              label: 'Apenas durante downloads ativos (Padrão)',
              type: 'radio',
              checked: (cur.downloadMode || 'active-only') === 'active-only',
              click: () => updateSettings({ navbarButtons: { ...cur, downloadMode: 'active-only' } })
            },
            {
              label: 'Sempre visível',
              type: 'radio',
              checked: cur.downloadMode === 'always',
              click: () => updateSettings({ navbarButtons: { ...cur, downloadMode: 'always' } })
            },
            {
              label: 'Ocultar sempre',
              type: 'radio',
              checked: cur.downloadMode === 'hidden',
              click: () => updateSettings({ navbarButtons: { ...cur, downloadMode: 'hidden' } })
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Abrir Configurações de Personalização...',
          click: () => this.createSpecialTab('settings')
        }
      ]).popup(options);
    }
  }
  showExtensionMenu(extensionId, point = {}) {
    const ext = session.defaultSession.getAllExtensions().find(e => e.id === extensionId);
    if (!ext) return;
    const details = getExtensionDetails(ext);
    const options = { window: this.window, x: Math.round(Number(point.x) || 0), y: Math.round(Number(point.y) || 0) };

    const template = [
      { label: `${details.name} (v${details.version})`, enabled: false },
      { type: 'separator' }
    ];

    if (details.optionsPage) {
      template.push({
        label: 'Opções da extensão',
        click: () => this.createWebTab(`chrome-extension://${ext.id}/${details.optionsPage}`, true)
      });
      template.push({ type: 'separator' });
    }

    template.push(
      {
        label: 'Gerenciar extensões',
        click: () => this.createSpecialTab('settings')
      },
      {
        label: 'Remover extensão...',
        click: () => removeExtension(ext.id)
      }
    );

    Menu.buildFromTemplate(template).popup(options);
  }
  command(command, payload) {
    const tab = this.active();
    if (command === 'navigate') { this.setExpanded(false); this.navigate(tab, payload); }
    else if (command === 'new-tab') this.createWebTab();
    else if (command === 'new-window') new Browser(false, false);
    else if (command === 'new-private-window') new Browser(true, false);
    else if (command === 'close-tab') this.closeTab(payload);
    else if (command === 'select-tab') this.selectTab(payload);
    else if (command === 'toggle-pin') this.togglePinTab(payload);
    else if (command === 'duplicate-tab') this.duplicateTab(payload);
    else if (command === 'close-other-tabs') this.closeOtherTabs(payload);
    else if (command === 'close-tabs-to-right') this.closeTabsToRight(payload);
    else if (command === 'back' && tab?.view.webContents.navigationHistory.canGoBack()) tab.view.webContents.navigationHistory.goBack();
    else if (command === 'forward' && tab?.view.webContents.navigationHistory.canGoForward()) tab.view.webContents.navigationHistory.goForward();
    else if (command === 'home') this.navigate(tab, settings.initialPage);
    else if (command === 'reload') tab?.view.webContents.reload();
    else if (command === 'reload-hard') tab?.view.webContents.reloadIgnoringCache();
    else if (command === 'stop') tab?.view.webContents.stop();
    else if (command === 'toggle-devtools') tab?.view.webContents.toggleDevTools();
    else if (command === 'open-settings') this.createSpecialTab('settings');
    else if (command === 'open-favorites' || command === 'toggle-sidebar') this.createSpecialTab('favorites');
    else if (command === 'minimize') this.window.minimize();
    else if (command === 'toggle-maximize') this.window.isMaximized() ? this.window.unmaximize() : this.window.maximize();
    else if (command === 'close-window') this.window.close();
    else if (command === 'cycle-next') this.cycle(1);
    else if (command === 'cycle-previous') this.cycle(-1);
    else if (command === 'toggle-chrome') this.toggleChrome();
    else if (command === 'show-downloads') shell.openPath(app.getPath('downloads'));
    else if (command === 'zoom-in') {
      const cur = settings.appearance?.zoomLevel || 100;
      updateSettings({ appearance: { zoomLevel: Math.min(200, cur + 10) } });
    }
    else if (command === 'zoom-out') {
      const cur = settings.appearance?.zoomLevel || 100;
      updateSettings({ appearance: { zoomLevel: Math.max(50, cur - 10) } });
    }
    else if (command === 'zoom-reset') {
      updateSettings({ appearance: { zoomLevel: 100 } });
    }
    this.sendState();
  }
}

let activeExtensionPopup = null;

function openExtensionAction(browser, extensionId, anchorBounds = {}) {
  if (activeExtensionPopup && !activeExtensionPopup.isDestroyed()) {
    activeExtensionPopup.close();
    activeExtensionPopup = null;
    return;
  }

  const ext = session.defaultSession.getAllExtensions().find(e => e.id === extensionId);
  if (!ext) return;

  const details = getExtensionDetails(ext);

  if (details.popup) {
    const popupUrl = `chrome-extension://${ext.id}/${details.popup}`;
    const winBounds = browser.window.getBounds();

    const popupWidth = 380;
    const popupHeight = 520;

    let x = winBounds.x + Math.round(Number(anchorBounds.x) || (winBounds.width - 250)) + Math.round((Number(anchorBounds.width) || 28) / 2) - Math.round(popupWidth / 2);
    let y = winBounds.y + Math.round(Number(anchorBounds.bottom || anchorBounds.y || 76)) + 4;

    if (x + popupWidth > winBounds.x + winBounds.width - 10) {
      x = winBounds.x + winBounds.width - popupWidth - 10;
    }
    if (x < winBounds.x + 10) {
      x = winBounds.x + 10;
    }

    activeExtensionPopup = new BrowserWindow({
      x,
      y,
      width: popupWidth,
      height: popupHeight,
      frame: false,
      resizable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      parent: browser.window,
      backgroundColor: settings.appearance.background || '#050805',
      webPreferences: {
        session: session.defaultSession,
        contextIsolation: false,
        nodeIntegration: false,
        sandbox: false
      }
    });

    activeExtensionPopup.loadURL(popupUrl);
    activeExtensionPopup.on('blur', () => {
      if (activeExtensionPopup && !activeExtensionPopup.isDestroyed()) {
        activeExtensionPopup.close();
      }
      activeExtensionPopup = null;
    });
  } else if (details.optionsPage) {
    browser.createWebTab(`chrome-extension://${ext.id}/${details.optionsPage}`, true);
  } else {
    browser.createSpecialTab('settings');
  }
}

ipcMain.handle('browser:chrome-expanded', (event, expanded) => chromeOwners.get(event.sender.id)?.setExpanded(expanded));
ipcMain.handle('browser:set-downloads-panel', (event, isOpen) => chromeOwners.get(event.sender.id)?.setDownloadsPanelOpen(isOpen));
ipcMain.handle('browser:window-drag', (event, { action, payload } = {}) => chromeOwners.get(event.sender.id)?.handleDrag(action, payload));
ipcMain.handle('browser:command', (event, { command, payload } = {}) => chromeOwners.get(event.sender.id)?.command(command, payload));
ipcMain.handle('browser:show-menu', (event, { menu, point } = {}) => chromeOwners.get(event.sender.id)?.showMenu(menu, point));
ipcMain.handle('browser:show-extension-menu', (event, { extensionId, point } = {}) => chromeOwners.get(event.sender.id)?.showExtensionMenu(extensionId, point));
ipcMain.handle('browser:open-extension-action', (event, { extensionId, bounds } = {}) => {
  const owner = chromeOwners.get(event.sender.id);
  if (owner) openExtensionAction(owner, extensionId, bounds);
});
ipcMain.handle('browser:reorder-tabs', (event, { tabId, newIndex } = {}) => chromeOwners.get(event.sender.id)?.attachTab(tabId, newIndex));
ipcMain.handle('browser:attach-tab', (event, { tabId, newIndex } = {}) => chromeOwners.get(event.sender.id)?.attachTab(tabId, newIndex));
ipcMain.handle('browser:tear-off-tab', (event, { tabId, screenX, screenY } = {}) => chromeOwners.get(event.sender.id)?.tearOffTab(tabId, screenX, screenY));

// Downloads IPC
ipcMain.handle('downloads:get-summary', () => getDownloadsSummary());
ipcMain.handle('downloads:open-file', async (_event, filePath) => {
  if (typeof filePath === 'string' && fs.existsSync(filePath)) {
    return shell.openPath(filePath);
  }
  return 'Arquivo não encontrado';
});
ipcMain.handle('downloads:show-in-folder', (_event, filePath) => {
  if (typeof filePath === 'string' && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  shell.openPath(app.getPath('downloads'));
  return true;
});
ipcMain.handle('downloads:open-folder', () => shell.openPath(app.getPath('downloads')));
ipcMain.handle('downloads:cancel', (_event, downloadId) => {
  const item = activeDownloadItems.get(downloadId);
  if (item) {
    item.cancel();
    activeDownloadItems.delete(downloadId);
    const record = sessionDownloads.find(d => d.id === downloadId);
    if (record) record.state = 'cancelled';
    broadcastDownloads();
    return true;
  }
  return false;
});

// Extensions IPC
ipcMain.handle('extensions:get-all', () => getInstalledExtensions());
ipcMain.handle('extensions:load-unpacked', (event) => {
  const owner = chromeOwners.get(event.sender.id);
  const win = owner ? owner.window : BrowserWindow.getFocusedWindow();
  return loadUnpackedExtension(win);
});
ipcMain.handle('extensions:remove', (_event, extensionId) => removeExtension(extensionId));

ipcMain.handle('settings:get', () => ({ ...copy(settings), themes: THEMES }));
ipcMain.handle('settings:get-themes', () => THEMES);
ipcMain.handle('settings:update', (_event, patch) => updateSettings(patch));
ipcMain.handle('settings:clear-history', () => { settings.history = []; saveSettingsSoon(); notifySettings(); return { ...copy(settings), themes: THEMES }; });
ipcMain.handle('settings:clear-history-range', (_event, range) => clearHistoryRange(range));
ipcMain.handle('settings:remove-history-item', (_event, url) => removeHistoryItem(url));
ipcMain.handle('settings:open-url', (_event, url) => {
  const firstBrowser = browsers.values().next().value;
  if (firstBrowser) {
    firstBrowser.createWebTab(url, true);
    return true;
  }
  return false;
});
ipcMain.handle('settings:clear-cookies', async () => { await session.defaultSession.clearStorageData({ storages: ['cookies'] }); return true; });

app.whenReady().then(async () => {
  settings = loadSettings();
  setupSession(session.defaultSession);
  await loadSavedExtensions();
  new Browser(false, true);
  app.on('activate', () => { if (!browsers.size) new Browser(false, true); });

  // System stats timer
  setInterval(() => {
    const stats = getSystemStats();
    for (const browser of browsers) {
      if (!browser.chrome.webContents.isDestroyed()) {
        browser.chrome.webContents.send('browser:system-stats', stats);
      }
    }
  }, 2500);
});

app.on('before-quit', () => { for (const browser of browsers) browser.saveSession(); saveSettings(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
