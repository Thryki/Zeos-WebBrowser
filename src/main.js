'use strict';

const { app, BrowserWindow, WebContentsView, Menu, MenuItem, ipcMain, session, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { HOME_URL, SEARCH_PROVIDERS, toNavigationTarget } = require('./navigation');
const { THEMES, getTheme } = require('./themes');

const WORKSPACES_FILE = 'workspaces.json';

const TAB_HEIGHT = 38;
const ADDRESS_HEIGHT = 38;
const FIND_HEIGHT = 40;
const DEFAULT_BOUNDS = { width: 1200, height: 760 };
const FONTS = ['IBM Plex Mono', 'Cascadia Mono', 'Consolas', 'JetBrains Mono', 'SF Mono', 'Menlo', 'Courier New'];

const DEFAULT_SETTINGS = {
  initialPage: HOME_URL,
  searchProvider: 'duckduckgo',
  developerMode: true,
  disabledExtensions: [],
  appearance: {
    themeId: 'orca',
    background: '#0b0b0b',
    foreground: '#f5f5f5',
    accent: '#22c55e',
    panel: '#181818',
    panelHover: '#242424',
    border: '#2a2a2a',
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
  siteZoom: {},
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

const workspaces = new Map();

function loadWorkspaces() {
  const stored = readJson(WORKSPACES_FILE, null);
  if (stored && typeof stored === 'object' && Array.isArray(stored.workspaces)) {
    stored.workspaces.forEach((ws) => {
      ws.tabs = Array.isArray(ws.tabs) ? ws.tabs : [];
      workspaces.set(ws.id, ws);
    });
  }
}

function saveWorkspaces() {
  const data = { workspaces: Array.from(workspaces.values()) };
  writeJson(WORKSPACES_FILE, data);
}

function getWorkspace(id) { return workspaces.get(id) || null; }
function getCurrentWorkspace() {
  if (browsers.size > 0) {
    const firstBrowser = browsers.values().next().value;
    return firstBrowser.workspaceId ? getWorkspace(firstBrowser.workspaceId) : null;
  }
  return null;
}

// Download tracking system
const sessionDownloads = [];
const activeDownloadItems = new Map();

function hostOfUrl(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

// Restores the zoom the user chose for this site, like other browsers do.
function applySiteZoom(contents, url) {
  if (!contents || contents.isDestroyed()) return;
  const host = hostOfUrl(url);
  const level = host && settings.siteZoom ? Number(settings.siteZoom[host]) || 0 : 0;
  if (contents.getZoomLevel() !== level) contents.setZoomLevel(level);
}

function userFile(name) { return path.join(app.getPath('userData'), name); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
// State files are read through the previous good copy and never silently
// discarded: a truncated write (crash/power loss) would otherwise reset
// settings — losing extensions and history — on the next launch.
function readJson(name, fallback) {
  for (const candidate of [name, `${name}.bak`]) {
    let raw;
    try { raw = fs.readFileSync(userFile(candidate), 'utf8'); } catch { continue; }
    try { return JSON.parse(raw); } catch (error) {
      console.error(`Corrupted ${candidate}, keeping it as ${candidate}.corrupt:`, error.message);
      try { fs.renameSync(userFile(candidate), userFile(`${candidate}.corrupt`)); } catch {}
    }
  }
  return fallback;
}
function writeJson(name, data) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    const target = userFile(name);
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
    try { fs.copyFileSync(target, `${target}.bak`); } catch {}
    fs.renameSync(tmp, target);
  } catch (error) { console.error(`Error writing ${name}:`, error); }
}

function loadSettings() {
  const stored = readJson('settings.json', {});
  const loaded = {
    ...copy(DEFAULT_SETTINGS),
    ...stored,
    developerMode: typeof stored.developerMode === 'boolean' ? stored.developerMode : DEFAULT_SETTINGS.developerMode,
    disabledExtensions: Array.isArray(stored.disabledExtensions) ? stored.disabledExtensions : [],
    appearance: { ...DEFAULT_SETTINGS.appearance, ...(stored.appearance || {}) },
    navbarButtons: { ...DEFAULT_SETTINGS.navbarButtons, ...(stored.navbarButtons || {}) },
    permissions: { ...DEFAULT_SETTINGS.permissions, ...(stored.permissions || {}) },
    siteZoom: (stored.siteZoom && typeof stored.siteZoom === 'object' && !Array.isArray(stored.siteZoom)) ? stored.siteZoom : {},
    extensions: Array.isArray(stored.extensions) ? stored.extensions : [],
    history: Array.isArray(stored.history) ? stored.history.slice(0, 2000) : []
  };
  loadWorkspaces();
  loadFavorites();
  return loaded;
}

function saveSettingsSoon() { clearTimeout(settingsTimer); settingsTimer = setTimeout(saveSettings, 250); }
function saveSettings() {
  clearTimeout(settingsTimer);
  writeJson('settings.json', settings);
}

// app.getAppMetrics() enumerates every process synchronously. sendState()
// runs on each tab/title/loading/download event, so the result is cached and
// only refreshed at roughly the rate the stats timer pushes it.
let systemStatsCache = null;
let systemStatsAt = 0;
function getSystemStats(maxAgeMs = 2000) {
  if (systemStatsCache && Date.now() - systemStatsAt < maxAgeMs) return systemStatsCache;
  const stats = computeSystemStats();
  systemStatsCache = stats;
  systemStatsAt = Date.now();
  return stats;
}

function computeSystemStats() {
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
    // Pages keep their own per-site zoom; the setting scales the UI only.
    for (const tab of browser.tabs) {
      applySiteZoom(tab.view.webContents, tab.url);
    }
  }
  browser.layout();
}

function notifySettings() {
  for (const browser of browsers) {
    applyZoomToBrowser(browser);
    browser.sendState();
    for (const tab of browser.tabs) {
      if ((tab.kind === 'settings' || tab.kind === 'favorites' || tab.kind === 'extensions' || tab.kind === 'newtab') && !tab.view.webContents.isDestroyed()) {
        tab.view.webContents.send('settings:changed', { ...copy(settings), themes: THEMES });
      }
    }
  }
}

function updateSettings(patch) {
  if (!patch || typeof patch !== 'object') return { ...copy(settings), themes: THEMES };
  if (SEARCH_PROVIDERS[patch.searchProvider]) settings.searchProvider = patch.searchProvider;
  if (typeof patch.initialPage === 'string' && patch.initialPage.trim() && patch.initialPage.length < 2048) {
    const wanted = patch.initialPage.trim();
    settings.initialPage = /^zeos:\/\/(nova-aba|newtab)$/i.test(wanted)
      ? 'zeos://nova-aba'
      : toNavigationTarget(wanted, settings.searchProvider).url;
  }
  
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
  } else if (range === '30d' || range === '4w') {
    const threshold = now - 30 * 24 * 3600 * 1000;
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

function addHistory(url, title, opts = {}) {
  if (!url || !url.startsWith('http')) return;
  const entry = {
    url,
    title: title || url,
    visitedAt: Date.now(),
    lastVisitedAt: Date.now(),
    visitCount: 1,
    tags: opts.tags || [],
    searchableText: opts.searchableText || (title || '').toLowerCase() + ' ' + url.toLowerCase(),
    workspaceId: opts.workspaceId || null
  };
  settings.history = [{ ...entry }, ...settings.history.filter((entry) => entry.url !== url)].slice(0, 2000);
  saveSettingsSoon();
  // A visit changes neither zoom nor tab state, so the full notifySettings()
  // fan-out (zoom re-apply + relayout + sendState per window) is wasted work
  // on every navigation. Only the internal pages that render history need it.
  notifyHistorySoon();
}

// Favorites
const FAVORITES_FILE = 'favorites.json';
let favorites = [];

function loadFavorites() {
  const stored = readJson(FAVORITES_FILE, []);
  favorites = Array.isArray(stored)
    ? stored
      .filter((item) => item && typeof item.url === 'string' && /^https?:\/\//i.test(item.url))
      .map((item) => ({
        id: String(item.id || item.url),
        url: item.url,
        title: typeof item.title === 'string' && item.title ? item.title : item.url,
        favicon: typeof item.favicon === 'string' ? item.favicon : '',
        addedAt: Number(item.addedAt) || Date.now()
      }))
    : [];
  return favorites;
}

function saveFavorites() { writeJson(FAVORITES_FILE, favorites); }

function notifyFavorites() {
  for (const browser of browsers) {
    browser.sendState();
    for (const tab of browser.tabs) {
      if (tab.kind === 'favorites' && !tab.view.webContents.isDestroyed()) {
        tab.view.webContents.send('favorites:changed', favorites);
      }
    }
  }
}

function isFavorite(url) { return favorites.some((item) => item.url === url); }

function addFavorite({ url, title, favicon }) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || url.length > 2048) return false;
  if (isFavorite(url)) return true;
  favorites.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    title: (typeof title === 'string' && title.trim()) ? title.slice(0, 300) : url,
    favicon: typeof favicon === 'string' ? favicon.slice(0, 4096) : '',
    addedAt: Date.now()
  });
  saveFavorites();
  notifyFavorites();
  return true;
}

function removeFavorite(url) {
  const before = favorites.length;
  favorites = favorites.filter((item) => item.url !== url && item.id !== url);
  if (favorites.length === before) return false;
  saveFavorites();
  notifyFavorites();
  return true;
}

let historyNotifyTimer;
function notifyHistorySoon() {
  clearTimeout(historyNotifyTimer);
  historyNotifyTimer = setTimeout(() => {
    const payload = { ...copy(settings), themes: THEMES };
    for (const browser of browsers) {
      for (const tab of browser.tabs) {
        if ((tab.kind === 'settings' || tab.kind === 'favorites' || tab.kind === 'extensions' || tab.kind === 'newtab') && !tab.view.webContents.isDestroyed()) {
          tab.view.webContents.send('settings:changed', payload);
        }
      }
    }
  }, 1000);
}

// The session holds every open window. Writing only the window that happened
// to save last meant quitting with more than one window silently dropped all
// but one window's tabs.
let sessionFrozen = false;

function readSessionWindows() {
  return normalizeSessionWindows(readJson('session.json', {}), DEFAULT_BOUNDS);
}

function sessionEntryFor(browser) {
  return buildSessionEntry({
    bounds: browser.window.getBounds(),
    tabs: browser.tabs,
    activeId: browser.activeId,
    fallbackUrl: settings.initialPage
  });
}

function writeSessionSnapshot() {
  if (sessionFrozen) return;
  const windows = [];
  for (const browser of browsers) {
    if (browser.privateMode || browser.sessionDropped) continue;
    if (!browser.window || browser.window.isDestroyed()) continue;
    const entry = sessionEntryFor(browser);
    if (entry.tabs.length) windows.push(entry);
  }
  if (!windows.length) return; // never replace a good session with an empty one
  writeJson('session.json', { version: 2, windows });
}

const { crc32, packZip, isRemovableRunnerDir } = require('./extension-utils');
const { normalizeSessionWindows, buildSessionEntry } = require('./session-store');
const { rankSuggestions } = require('./suggestions');

const ZEOS_EXTENSION_POLYFILL = `
// === ZEOS CHROME EXTENSION POLYFILL ===
(function() {
  if (typeof self === 'undefined' && typeof window !== 'undefined') self = window;
  if (typeof self.chrome === 'undefined') self.chrome = {};

  function createEvent() {
    const listeners = new Set();
    const ev = {
      addListener(fn) { if (typeof fn === 'function') listeners.add(fn); },
      removeListener(fn) { listeners.delete(fn); },
      hasListener(fn) { return listeners.has(fn); },
      hasListeners() { return listeners.size > 0; },
      dispatch(...args) {
        for (const fn of Array.from(listeners)) {
          try { fn(...args); } catch(e) { console.error('[ZeosExtEvent Error]', e); }
        }
      }
    };
    return ev;
  }

  // chrome.action
  if (!self.chrome.action) {
    self.chrome.action = {
      onClicked: createEvent(),
      setTitle(d, cb) { if (cb) cb(); return Promise.resolve(); },
      getTitle(d, cb) { if (cb) cb(''); return Promise.resolve(''); },
      setIcon(d, cb) { if (cb) cb(); return Promise.resolve(); },
      setPopup(d, cb) { if (cb) cb(); return Promise.resolve(); },
      getPopup(d, cb) { if (cb) cb(''); return Promise.resolve(''); },
      setBadgeText(d, cb) { if (cb) cb(); return Promise.resolve(); },
      getBadgeText(d, cb) { if (cb) cb(''); return Promise.resolve(); },
      setBadgeBackgroundColor(d, cb) { if (cb) cb(); return Promise.resolve(); },
      getBadgeBackgroundColor(d, cb) { if (cb) cb([0,0,0,0]); return Promise.resolve([0,0,0,0]); },
      enable(tabId, cb) { if (cb) cb(); return Promise.resolve(); },
      disable(tabId, cb) { if (cb) cb(); return Promise.resolve(); },
      getUserSettings(cb) { const s = { isOnToolbar: true }; if (cb) cb(s); return Promise.resolve(s); }
    };
  }
  if (!self.chrome.browserAction) self.chrome.browserAction = self.chrome.action;
  if (!self.chrome.pageAction) self.chrome.pageAction = self.chrome.action;

  // chrome.contextMenus
  if (!self.chrome.contextMenus) {
    const menus = new Map();
    self.__zeosContextMenus = () => Array.from(menus.entries()).map(([id, props]) => ({
      id,
      title: String(props.title || ''),
      contexts: Array.isArray(props.contexts) ? props.contexts : ['page'],
      enabled: props.enabled !== false,
      visible: props.visible !== false,
      parentId: props.parentId || null,
      type: props.type || 'normal'
    }));
    self.chrome.contextMenus = {
      onClicked: createEvent(),
      create(props, cb) {
        if (props && props.id) menus.set(props.id, props);
        if (cb) cb();
        return props?.id;
      },
      update(id, props, cb) {
        if (menus.has(id)) Object.assign(menus.get(id), props);
        if (cb) cb();
        return Promise.resolve();
      },
      remove(id, cb) {
        menus.delete(id);
        if (cb) cb();
        return Promise.resolve();
      },
      removeAll(cb) {
        menus.clear();
        if (cb) cb();
        return Promise.resolve();
      }
    };
  }

  // chrome.commands
  if (!self.chrome.commands) {
    self.chrome.commands = {
      onCommand: createEvent(),
      getAll(cb) {
        const cmds = [];
        if (cb) cb(cmds);
        return Promise.resolve(cmds);
      }
    };
  }

  // chrome.offscreen
  if (!self.chrome.offscreen) {
    self.chrome.offscreen = {
      Reason: {
        TESTING: 'TESTING',
        AUDIO_PLAYBACK: 'AUDIO_PLAYBACK',
        IFRAME_SCRIPTING: 'IFRAME_SCRIPTING',
        DOM_SCRAPING: 'DOM_SCRAPING',
        BLOBS: 'BLOBS',
        CLIPBOARD: 'CLIPBOARD'
      },
      createDocument(props) { return Promise.resolve(); },
      closeDocument() { return Promise.resolve(); },
      hasDocument() { return Promise.resolve(false); }
    };
  }

  // chrome.storage
  if (!self.chrome.storage || !self.chrome.storage.local) {
    function createStorageArea() {
      const memoryStore = new Map();
      return {
        get(keys, cb) {
          return new Promise((resolve) => {
            const res = {};
            if (!keys) {
              for (const [k, v] of memoryStore.entries()) res[k] = v;
            } else if (typeof keys === 'string') {
              if (memoryStore.has(keys)) res[keys] = memoryStore.get(keys);
            } else if (Array.isArray(keys)) {
              for (const k of keys) {
                if (memoryStore.has(k)) res[k] = memoryStore.get(k);
              }
            } else if (typeof keys === 'object') {
              for (const k in keys) {
                res[k] = memoryStore.has(k) ? memoryStore.get(k) : keys[k];
              }
            }
            if (cb) cb(res);
            resolve(res);
          });
        },
        set(items, cb) {
          return new Promise((resolve) => {
            if (items && typeof items === 'object') {
              for (const [k, v] of Object.entries(items)) memoryStore.set(k, v);
            }
            if (cb) cb();
            resolve();
          });
        },
        remove(keys, cb) {
          return new Promise((resolve) => {
            const arr = Array.isArray(keys) ? keys : [keys];
            for (const k of arr) memoryStore.delete(k);
            if (cb) cb();
            resolve();
          });
        },
        clear(cb) {
          return new Promise((resolve) => {
            memoryStore.clear();
            if (cb) cb();
            resolve();
          });
        },
        getBytesInUse(keys, cb) { if (cb) cb(0); return Promise.resolve(0); },
        setAccessLevel(opts, cb) { if (cb) cb(); return Promise.resolve(); }
      };
    }
    self.chrome.storage = {
      local: createStorageArea(),
      sync: createStorageArea(),
      session: createStorageArea(),
      managed: createStorageArea(),
      onChanged: createEvent()
    };
  }

  // chrome.windows
  if (!self.chrome.windows) {
    self.chrome.windows = {
      WINDOW_ID_NONE: -1,
      WINDOW_ID_CURRENT: -2,
      getCurrent(opts, cb) {
        const win = { id: 1, focused: true, state: 'normal', type: 'normal' };
        if (typeof opts === 'function') { opts(win); return; }
        if (cb) cb(win);
        return Promise.resolve(win);
      },
      getAll(opts, cb) {
        const wins = [{ id: 1, focused: true, state: 'normal', type: 'normal' }];
        if (typeof opts === 'function') { opts(wins); return; }
        if (cb) cb(wins);
        return Promise.resolve(wins);
      },
      onCreated: createEvent(),
      onRemoved: createEvent(),
      onFocusChanged: createEvent()
    };
  }

  // Intercept runtime messages for Zeos triggers
  if (self.chrome.runtime && self.chrome.runtime.onMessage) {
    self.chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg && msg.__zeos_trigger_action) {
        const tab = msg.tab || { id: 1, url: '', active: true };
        if (self.chrome.action && self.chrome.action.onClicked) {
          self.chrome.action.onClicked.dispatch(tab);
        }
        if (self.chrome.browserAction && self.chrome.browserAction.onClicked) {
          self.chrome.browserAction.onClicked.dispatch(tab);
        }
        sendResponse({ success: true });
        return true;
      }
      if (msg && msg.__zeos_trigger_command) {
        if (self.chrome.commands && self.chrome.commands.onCommand) {
          self.chrome.commands.onCommand.dispatch(msg.command);
        }
        sendResponse({ success: true });
        return true;
      }
      if (msg && msg.__zeos_trigger_context_menu) {
        if (self.chrome.contextMenus && self.chrome.contextMenus.onClicked) {
          self.chrome.contextMenus.onClicked.dispatch(msg.info || {}, msg.tab || { id: 1 });
        }
        sendResponse({ success: true });
        return true;
      }
      // Zeos reads the registered items to draw them in the native page menu.
      if (msg && msg.__zeos_get_context_menus) {
        sendResponse({ menus: self.__zeosContextMenus ? self.__zeosContextMenus() : [] });
        return true;
      }
    });
  }
})();
// === END POLYFILL ===
`;

const extensionRunnerMap = new Map();
const extensionSourceMap = new Map();

function prepareExtensionRunnerDir(sourceDir) {
  try {
    const hash = crypto.createHash('md5').update(sourceDir).digest('hex').slice(0, 12);
    const runnerDir = path.join(os.tmpdir(), 'zeos-ext-' + hash);
    
    if (fs.existsSync(runnerDir)) {
      try { fs.rmSync(runnerDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.cpSync(sourceDir, runnerDir, { recursive: true });

    const manifestPath = path.join(runnerDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.background) {
        if (manifest.background.service_worker) {
          const swPath = path.join(runnerDir, manifest.background.service_worker);
          if (fs.existsSync(swPath)) {
            const original = fs.readFileSync(swPath, 'utf8');
            fs.writeFileSync(swPath, ZEOS_EXTENSION_POLYFILL + '\n' + original, 'utf8');
          }
        }
        if (Array.isArray(manifest.background.scripts)) {
          for (const s of manifest.background.scripts) {
            const sPath = path.join(runnerDir, s);
            if (fs.existsSync(sPath)) {
              const original = fs.readFileSync(sPath, 'utf8');
              fs.writeFileSync(sPath, ZEOS_EXTENSION_POLYFILL + '\n' + original, 'utf8');
            }
          }
        }
      }
      // HTML entry points (MV2 background pages, popups, options) run in their
      // own contexts and need the polyfill too, otherwise chrome.action &
      // friends are undefined the moment the popup opens.
      const polyfillFile = 'zeos-polyfill.js';
      const htmlEntries = [
        manifest.background?.page,
        manifest.action?.default_popup,
        manifest.browser_action?.default_popup,
        manifest.page_action?.default_popup,
        manifest.options_page,
        manifest.options_ui?.page,
        manifest.devtools_page,
        manifest.side_panel?.default_path
      ].filter((entry) => typeof entry === 'string' && entry);
      if (htmlEntries.length) {
        fs.writeFileSync(path.join(runnerDir, polyfillFile), ZEOS_EXTENSION_POLYFILL, 'utf8');
        for (const entry of new Set(htmlEntries)) {
          const htmlPath = path.join(runnerDir, entry.split('?')[0].split('#')[0]);
          if (!fs.existsSync(htmlPath)) continue;
          const rel = path.relative(path.dirname(htmlPath), path.join(runnerDir, polyfillFile)).replace(/\\/g, '/');
          const tag = `<script src="${rel}"></script>`;
          const html = fs.readFileSync(htmlPath, 'utf8');
          if (html.includes(polyfillFile)) continue;
          // The polyfill must run before any of the page's own scripts.
          const injected = /<head[^>]*>/i.test(html)
            ? html.replace(/<head[^>]*>/i, (head) => `${head}\n${tag}`)
            : `${tag}\n${html}`;
          fs.writeFileSync(htmlPath, injected, 'utf8');
        }
      }
    }
    return runnerDir;
  } catch (err) {
    console.error('Error preparing extension runner directory:', err);
    return sourceDir;
  }
}

async function loadPreparedExtension(sourcePath) {
  const runnerPath = prepareExtensionRunnerDir(sourcePath);
  const ext = await session.defaultSession.loadExtension(runnerPath, { allowFileAccess: true });
  extensionRunnerMap.set(sourcePath, { runnerPath, id: ext.id });
  extensionSourceMap.set(ext.id, sourcePath);
  invalidateExtensionsCache();
  // The service worker registers its menus on install/startup; give it a
  // moment, then cache them so the page menu can be built synchronously.
  setTimeout(() => { refreshExtensionContextMenus(ext.id).catch(() => {}); }, 1500);
  return ext;
}

// Chrome Extension management
// Extensions shipped with the browser. They install themselves on first run,
// survive updates and cannot be removed — only disabled.
const BUILTIN_EXTENSIONS_DIR = path.join(__dirname, 'bundled-extensions');

function builtinExtensionPaths() {
  try {
    return fs.readdirSync(BUILTIN_EXTENSIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(BUILTIN_EXTENSIONS_DIR, entry.name))
      .filter((dir) => fs.existsSync(path.join(dir, 'manifest.json')));
  } catch {
    return [];
  }
}

function isBuiltinExtensionPath(extPath) {
  if (typeof extPath !== 'string' || !extPath) return false;
  const rel = path.relative(BUILTIN_EXTENSIONS_DIR, extPath);
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function readManifestName(extPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(extPath, 'manifest.json'), 'utf8')).name || '';
  } catch {
    return '';
  }
}

async function loadSavedExtensions() {
  if (!Array.isArray(settings.extensions)) {
    settings.extensions = [];
  }
  if (!Array.isArray(settings.disabledExtensions)) {
    settings.disabledExtensions = [];
  }

  const builtinNames = new Set();
  for (const extPath of builtinExtensionPaths()) {
    builtinNames.add(readManifestName(extPath));
    if (settings.disabledExtensions.includes(extPath)) continue;
    try {
      await loadPreparedExtension(extPath);
    } catch (err) {
      console.error('Failed to load built-in extension:', extPath, err);
    }
  }

  const loaded = [];
  for (const extPath of settings.extensions) {
    if (!fs.existsSync(extPath)) continue;
    // A copy the user had loaded by hand before it shipped built-in would
    // otherwise install twice.
    if (builtinNames.has(readManifestName(extPath))) continue;
    loaded.push(extPath);
    if (!settings.disabledExtensions.includes(extPath)) {
      try {
        await loadPreparedExtension(extPath);
      } catch (err) {
        console.error('Failed to load extension:', extPath, err);
      }
    }
  }
  settings.extensions = loaded;
}

function getExtensionDetails(ext, isExplicitlyEnabled = null) {
  const realPath = extensionSourceMap.get(ext.id) || ext.path;
  let manifest = ext.manifest;
  if (!manifest && realPath) {
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(realPath, 'manifest.json'), 'utf8'));
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

  if (realPath) {
    for (const relPath of iconCandidates) {
      if (!relPath || typeof relPath !== 'string') continue;
      const fullPath = path.join(realPath, relPath);
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

  const isEnabled = isExplicitlyEnabled !== null
    ? isExplicitlyEnabled
    : (!settings.disabledExtensions.includes(realPath) && Boolean(ext.id));

  const hasBackground = Boolean(manifest.background);
  const backgroundType = manifest.background?.service_worker ? 'service_worker' : (manifest.background?.page || manifest.background?.scripts ? 'page' : 'none');

  return {
    id: ext.id || (realPath ? path.basename(realPath).toLowerCase().replace(/[^a-z0-9]/g, '') : 'ext'),
    name: manifest.name || ext.name || 'Extensão',
    version: manifest.version || ext.version || '1.0',
    description: manifest.description || ext.description || '',
    icon: iconDataUrl,
    popup,
    optionsPage: manifest.options_page || (manifest.options_ui?.page) || '',
    path: realPath,
    enabled: isEnabled,
    permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
    hostPermissions: Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [],
    commands: manifest.commands || {},
    hasBackground,
    backgroundType,
    homepageUrl: manifest.homepage_url || ''
  };
}

async function loadUnpackedExtension(win) {
  const targetWin = win || BrowserWindow.getFocusedWindow() || (browsers.values().next().value?.window);
  const openOpts = {
    title: 'Selecionar pasta da extensão descompactada do Chrome (contendo manifest.json)',
    properties: ['openDirectory']
  };
  const result = await (targetWin ? dialog.showOpenDialog(targetWin, openOpts) : dialog.showOpenDialog(openOpts));
  if (result.canceled || !result.filePaths.length) return null;
  const extPath = result.filePaths[0];
  try {
    const ext = await loadPreparedExtension(extPath);
    if (!settings.extensions.includes(extPath)) {
      settings.extensions.push(extPath);
    }
    settings.disabledExtensions = settings.disabledExtensions.filter(p => p !== extPath);
    saveSettingsSoon();
    notifySettings();
    return getExtensionDetails(ext, true);
  } catch (error) {
    dialog.showErrorBox('Erro ao carregar extensão', error.message || 'Pasta inválida ou sem manifest.json.');
    return null;
  }
}

// sendState() calls this on every tab/download event; without a cache each
// call re-reads every manifest and re-encodes every icon from disk (sync I/O
// on the hot path). Invalidated whenever the extension set changes.
let installedExtensionsCache = null;
function invalidateExtensionsCache() {
  installedExtensionsCache = null;
  destroyExtensionBridges(); // bridges belong to a specific loaded instance
}

function getInstalledExtensions() {
  if (installedExtensionsCache) return installedExtensionsCache;
  const exts = session.defaultSession.getAllExtensions();
  const loadedMap = new Map();
  const result = [];

  for (const ext of exts) {
    const realPath = extensionSourceMap.get(ext.id) || ext.path;
    if (realPath) loadedMap.set(realPath, ext);
    result.push(getExtensionDetails(ext, true));
  }

  // Disabled extensions are not loaded, so they must be listed from their
  // source folder — both the user's own and the ones shipped with Zeos.
  const listedPaths = [...(Array.isArray(settings.extensions) ? settings.extensions : []), ...builtinExtensionPaths()];
  {
    for (const extPath of listedPaths) {
      if (!loadedMap.has(extPath) && fs.existsSync(extPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(path.join(extPath, 'manifest.json'), 'utf8'));
          result.push(getExtensionDetails({
            id: path.basename(extPath).toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            manifest,
            path: extPath
          }, false));
        } catch {}
      }
    }
  }

  for (const entry of result) entry.builtin = isBuiltinExtensionPath(entry.path);
  installedExtensionsCache = result;
  return result;
}

function removeExtension(extensionId) {
  try {
    const exts = getInstalledExtensions();
    const ext = exts.find(e => e.id === extensionId);
    // Extensions shipped with the browser can only be disabled.
    if (ext && isBuiltinExtensionPath(ext.path)) return false;
    if (ext) {
      try { session.defaultSession.removeExtension(extensionId); } catch {}
      if (ext.path) {
        settings.extensions = settings.extensions.filter(p => p !== ext.path);
        settings.disabledExtensions = settings.disabledExtensions.filter(p => p !== ext.path);
        const mapped = extensionRunnerMap.get(ext.path);
        if (mapped?.runnerPath && isRemovableRunnerDir(mapped.runnerPath, ext.path)) {
          try { fs.rmSync(mapped.runnerPath, { recursive: true, force: true }); } catch (e) {}
        }
        extensionRunnerMap.delete(ext.path);
        extensionSourceMap.delete(extensionId);
        saveSettingsSoon();
      }
      invalidateExtensionsCache();
      notifySettings();
      return true;
    }
  } catch (err) {
    console.error(err);
  }
  return false;
}

async function toggleExtensionEnable(extensionId, enabled) {
  try {
    const extList = getInstalledExtensions();
    const target = extList.find(e => e.id === extensionId);
    if (!target || !target.path) return false;

    if (!enabled) {
      try { session.defaultSession.removeExtension(extensionId); } catch {}
      if (!settings.disabledExtensions.includes(target.path)) {
        settings.disabledExtensions.push(target.path);
      }
    } else {
      settings.disabledExtensions = settings.disabledExtensions.filter(p => p !== target.path);
      if (fs.existsSync(target.path)) {
        await loadPreparedExtension(target.path);
      }
    }
    saveSettingsSoon();
    invalidateExtensionsCache();
    notifySettings();
    return true;
  } catch (err) {
    console.error('Error toggling extension:', err);
    return false;
  }
}

async function reloadExtension(extensionId) {
  try {
    const extList = getInstalledExtensions();
    const target = extList.find(e => e.id === extensionId);
    if (target && target.path && fs.existsSync(target.path)) {
      try { session.defaultSession.removeExtension(extensionId); } catch {}
      if (!settings.disabledExtensions.includes(target.path)) {
        await loadPreparedExtension(target.path);
      }
      invalidateExtensionsCache();
      notifySettings();
      return true;
    }
  } catch (err) {
    console.error('Error reloading extension:', err);
  }
  return false;
}

async function reloadAllExtensions() {
  try {
    const exts = session.defaultSession.getAllExtensions();
    for (const ext of exts) {
      const realPath = extensionSourceMap.get(ext.id) || ext.path;
      if (realPath && fs.existsSync(realPath)) {
        try { session.defaultSession.removeExtension(ext.id); } catch {}
        await loadPreparedExtension(realPath);
      }
    }
    invalidateExtensionsCache();
    notifySettings();
    return true;
  } catch (err) {
    console.error('Error reloading all extensions:', err);
    return false;
  }
}

// Delivers the polyfill's __zeos_trigger_action message to the extension's
// background context. MV2 background pages are dispatched into directly;
// MV3 service workers are reached through chrome.runtime.sendMessage from a
// transient hidden extension-origin context. Resolves false when the action
// could not be delivered — callers must not hide that failure.
const extensionBridges = new Map();

function destroyExtensionBridges(extensionId = null) {
  for (const [id, win] of [...extensionBridges]) {
    if (extensionId && id !== extensionId) continue;
    extensionBridges.delete(id);
    try { if (win && !win.isDestroyed()) win.destroy(); } catch {}
  }
}

async function getExtensionBridge(extensionId) {
  const existing = extensionBridges.get(extensionId);
  if (existing && !existing.isDestroyed()) return existing;
  const win = new BrowserWindow({
    show: false,
    webPreferences: { session: session.defaultSession, contextIsolation: true, nodeIntegration: false }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  await win.loadURL(`chrome-extension://${extensionId}/manifest.json`);
  extensionBridges.set(extensionId, win);
  return win;
}

// Electron has no chrome.contextMenus, so the polyfill collects what an
// extension registers and Zeos draws those entries in the native page menu.
// The registry is cached because the menu has to be built synchronously.
const extensionContextMenus = new Map();

async function askExtension(extensionId, message) {
  try {
    const bridge = await getExtensionBridge(extensionId);
    return await bridge.webContents.executeJavaScript(`new Promise((res) => {
      try {
        chrome.runtime.sendMessage(${JSON.stringify(message)}, (reply) => { void chrome.runtime.lastError; res(reply || null); });
        setTimeout(() => res(null), 800);
      } catch (e) { res(null); }
    })`);
  } catch {
    return null;
  }
}

async function refreshExtensionContextMenus(extensionId) {
  const reply = await askExtension(extensionId, { __zeos_get_context_menus: true });
  const menus = Array.isArray(reply?.menus) ? reply.menus : [];
  if (menus.length) extensionContextMenus.set(extensionId, menus);
  else extensionContextMenus.delete(extensionId);
  return menus;
}

// Maps what the user right-clicked onto Chrome's context names.
// Chrome shows a single entry inline and groups several under the extension
// name; Zeos mirrors that.
function buildExtensionMenuItems(browser, contents, tab, params) {
  const active = contextsForParams(params);
  const items = [];
  for (const ext of getInstalledExtensions()) {
    if (!ext.enabled) continue;
    const registered = extensionContextMenus.get(ext.id) || [];
    const matching = registered.filter((entry) => (
      entry.visible !== false &&
      entry.title &&
      !entry.parentId &&
      entry.contexts.some((context) => active.includes(context))
    ));
    if (!matching.length) continue;

    const tabInfo = {
      id: contents.isDestroyed() ? -1 : contents.id,
      windowId: browser.window.id,
      url: tab.url || '',
      title: tab.title || '',
      active: true
    };
    const toMenuItem = (entry) => new MenuItem({
      label: entry.title,
      enabled: entry.enabled !== false,
      click: () => {
        triggerExtensionContextMenu(ext.id, extensionMenuInfo(params, entry.id), tabInfo)
          .then((reply) => { if (!reply) console.error('Extension context menu dispatch failed for', ext.id, entry.id); });
      }
    });

    if (matching.length === 1) items.push(toMenuItem(matching[0]));
    else items.push(new MenuItem({ label: ext.name, submenu: matching.map(toMenuItem) }));
  }
  return items;
}

function contextsForParams(params) {
  const contexts = ['all'];
  if (params.selectionText && params.selectionText.trim()) contexts.push('selection');
  if (params.linkURL) contexts.push('link');
  if (params.mediaType === 'image') contexts.push('image');
  if (params.mediaType === 'video') contexts.push('video');
  if (params.mediaType === 'audio') contexts.push('audio');
  if (params.isEditable) contexts.push('editable');
  if (!params.linkURL && params.mediaType === 'none' && !params.isEditable) contexts.push('page');
  return contexts;
}

function extensionMenuInfo(params, menuItemId) {
  return {
    menuItemId,
    selectionText: params.selectionText || '',
    pageUrl: params.pageURL || '',
    linkUrl: params.linkURL || '',
    srcUrl: params.srcURL || '',
    frameUrl: params.frameURL || '',
    mediaType: params.mediaType === 'none' ? undefined : params.mediaType,
    editable: Boolean(params.isEditable)
  };
}

function triggerExtensionContextMenu(extensionId, info, tabInfo) {
  return askExtension(extensionId, { __zeos_trigger_context_menu: true, info, tab: tabInfo });
}

async function triggerExtensionAction(extensionId, tabInfo) {
  const { webContents } = require('electron');
  const payload = JSON.stringify({ __zeos_trigger_action: true, tab: tabInfo });
  const bg = webContents.getAllWebContents().find(wc => {
    try { return wc.getType() === 'backgroundPage' && wc.getURL().includes(extensionId); } catch { return false; }
  });
  if (bg && !bg.isDestroyed()) {
    return bg.executeJavaScript(`(() => {
      const msg = ${payload};
      const fire = (ev) => Boolean(ev && typeof ev.dispatch === 'function' && (ev.dispatch(msg.tab), true));
      return fire(self.chrome?.action?.onClicked) || fire(self.chrome?.browserAction?.onClicked);
    })()`).then(Boolean).catch(() => false);
  }
  // MV3 service workers are reached from a hidden page on the extension's own
  // origin. The bridge is kept alive per extension — spawning and destroying a
  // renderer process on every toolbar click cost ~100-300ms and tens of MB.
  try {
    const bridge = await getExtensionBridge(extensionId);
    return await bridge.webContents.executeJavaScript(`new Promise((res) => {
      try {
        chrome.runtime.sendMessage(${payload}, () => { void chrome.runtime.lastError; res(true); });
        setTimeout(() => res(true), 400);
      } catch (e) { res(false); }
    })`).then(Boolean);
  } catch (error) {
    destroyExtensionBridges(extensionId);
    return false;
  }
}

function inspectBackground(extensionId) {
  const { webContents } = require('electron');
  const allContents = webContents.getAllWebContents();
  const target = allContents.find(wc => {
    try {
      const u = wc.getURL();
      return u && u.includes(extensionId);
    } catch {
      return false;
    }
  });
  if (target && !target.isDestroyed()) {
    target.openDevTools({ mode: 'detach' });
    return true;
  }
  const ext = session.defaultSession.getAllExtensions().find(e => e.id === extensionId);
  if (ext) {
    const details = getExtensionDetails(ext);
    if (details.popup) {
      const inspectWin = new BrowserWindow({
        width: 800,
        height: 600,
        title: `Inspecionar Extensão - ${details.name}`,
        webPreferences: {
          session: session.defaultSession
        }
      });
      inspectWin.loadURL(`chrome-extension://${ext.id}/${details.popup}`);
      inspectWin.webContents.openDevTools({ mode: 'detach' });
      return true;
    }
  }
  return false;
}

async function packExtensionDialog(win, extensionId) {
  const ext = getInstalledExtensions().find(e => e.id === extensionId);
  let extPath = ext?.path;
  const targetWin = win || BrowserWindow.getFocusedWindow() || browsers.values().next().value?.window;
  if (!extPath) {
    const pickOpts = {
      title: 'Selecionar pasta da extensão para compactar',
      properties: ['openDirectory']
    };
    const pickDir = await (targetWin ? dialog.showOpenDialog(targetWin, pickOpts) : dialog.showOpenDialog(pickOpts));
    if (pickDir.canceled || !pickDir.filePaths.length) return { success: false };
    extPath = pickDir.filePaths[0];
  }
  const saveOpts = {
    title: 'Salvar arquivo compactado (.zip)',
    defaultPath: `${path.basename(extPath)}.zip`,
    filters: [{ name: 'Arquivo ZIP (*.zip)', extensions: ['zip'] }]
  };
  const saveResult = await (targetWin ? dialog.showSaveDialog(targetWin, saveOpts) : dialog.showSaveDialog(saveOpts));
  if (saveResult.canceled || !saveResult.filePath) return { success: false };
  try {
    packZip(extPath, saveResult.filePath);
    return { success: true, path: saveResult.filePath };
  } catch (err) {
    dialog.showErrorBox('Erro ao compactar extensão', err.message);
    return { success: false, error: err.message };
  }
}

function setDevMode(enabled) {
  settings.developerMode = Boolean(enabled);
  saveSettingsSoon();
  notifySettings();
  return settings.developerMode;
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

// DownloadItem 'updated' fires continuously; without throttling each chunk
// fanned a full state broadcast plus a downloads message to every window.
let downloadsBroadcastTimer;
function broadcastDownloadsSoon() {
  if (downloadsBroadcastTimer) return;
  downloadsBroadcastTimer = setTimeout(() => {
    downloadsBroadcastTimer = null;
    broadcastDownloads();
  }, 250);
}

function broadcastDownloads() {
  clearTimeout(downloadsBroadcastTimer);
  downloadsBroadcastTimer = null;
  const summary = getDownloadsSummary();
  for (const browser of browsers) {
    browser.sendState();
    if (!browser.chrome.webContents.isDestroyed()) {
      browser.chrome.webContents.send('browser:downloads-updated', summary);
    }
  }
}

// Downloading the same file twice silently overwrote the first one; follow the
// browser convention of "name (1).ext" instead.
function uniqueDownloadPath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let candidate = path.join(dir, filename);
  for (let n = 1; n < 1000 && fs.existsSync(candidate); n += 1) {
    candidate = path.join(dir, `${base} (${n})${ext}`);
  }
  return candidate;
}

function setupSession(browserSession) {
  if (configuredSessions.has(browserSession)) return;
  configuredSessions.add(browserSession);
  // Electron's spellchecker downloads Hunspell dictionaries from a Google CDN
  // on first use; a tracker-free browser must not make that request.
  try { browserSession.setSpellCheckerEnabled(false); } catch {}

  // Capabilities that are part of ordinary browsing and carry no privacy cost
  // are granted; everything sensitive stays behind the explicit settings
  // toggles and is denied otherwise.
  const ALWAYS_ALLOWED = new Set(['fullscreen', 'pointerLock', 'clipboard-sanitized-write']);
  const allowPermission = (permission) => (
    ALWAYS_ALLOWED.has(permission) ||
    (permission === 'notifications' && settings.permissions.notifications) ||
    (permission === 'media' && settings.permissions.media)
  );
  browserSession.setPermissionRequestHandler((_contents, permission, callback) => callback(Boolean(allowPermission(permission))));
  // Without a check handler Electron reports every permission as granted, so
  // permissions.query()/Notification.permission would contradict the answers
  // above and device labels would leak from enumerateDevices().
  browserSession.setPermissionCheckHandler((_contents, permission) => Boolean(allowPermission(permission)));

  browserSession.on('will-download', (_event, item, source) => {
    const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const savePath = uniqueDownloadPath(app.getPath('downloads'), item.getFilename());
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
      broadcastDownloadsSoon();
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
  constructor(privateMode = false, restoreSession = false, initialUrl = null, initialBounds = null, workspaceId = null) {
    this.privateMode = privateMode;
    this.restoreSession = restoreSession;
    this.initialUrl = initialUrl;
    this.initialBounds = initialBounds;
    this.workspaceId = workspaceId;
    this.partition = privateMode ? `temp:zeos-${++privateNumber}` : undefined;
    this.tabs = [];
    this.activeId = null;
    this.expanded = false;
    this.downloads = 0;
    this.htmlFullscreen = false;
    this.findOpen = false;
    this.suggestionsOpen = false;
    this.closedTabs = [];
    this.downloadsPanelOpen = false;
    this.sessionTimer = undefined;
    this.dragStartBounds = null;
    this.dragStartMouse = null;
    this.lastMenuClosedAt = 0;
    this.sessionDropped = false;
    sessionFrozen = false; // a new window resumes session tracking (macOS reactivation)
    this.open();
  }
  open() {
    const restoreEntry = (!this.privateMode && this.restoreSession)
      ? (typeof this.restoreSession === 'object' ? this.restoreSession : (readSessionWindows()[0] || null))
      : null;
    const sessionData = restoreEntry || { bounds: DEFAULT_BOUNDS, tabs: [], activeIndex: 0 };
    const bounds = this.initialBounds || sessionData.bounds;
    this.window = new BrowserWindow({
      ...bounds,
      minWidth: 520,
      minHeight: 360,
      // macOS keeps native traffic lights over the custom chrome; other
      // platforms stay fully frameless with the HTML window controls.
      ...(process.platform === 'darwin'
        ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 12, y: 10 } }
        : { frame: false }),
      show: false,
      backgroundColor: settings.appearance.background || '#0b0b0b',
      icon: path.join(__dirname, 'assets', 'zeos-logo-512.png'),
      title: this.privateMode ? 'zeos privado' : 'zeos',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    browsers.add(this);
    this.window.on('resize', () => this.layout());
    this.window.on('close', () => {
      // Closing one window of several discards just that window; closing the
      // last one is effectively a quit, so its tabs are kept for next launch.
      if (browsers.size > 1) this.sessionDropped = true;
      writeSessionSnapshot();
      if (browsers.size <= 1) sessionFrozen = true;
    });
    this.window.on('closed', () => this.destroy());
    this.chrome = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    // The chrome view overlays the page when the downloads panel is open;
    // without a transparent background the uncovered area paints black.
    this.chrome.setBackgroundColor('#00000000');
    this.window.contentView.addChildView(this.chrome);
    chromeOwners.set(this.chrome.webContents.id, this);
    this.chrome.webContents.loadFile(path.join(__dirname, 'ui', 'index.html'));
    this.chrome.webContents.once('did-finish-load', () => {
      const zoomFactor = (settings.appearance?.zoomLevel || 100) / 100;
      this.chrome.webContents.setZoomFactor(zoomFactor);
      this.sendState();
    });

    // Determine startup tabs: prefer workspace tabs if workspace is set, fall back to session tabs
    let startupTabs = [];
    if (this.workspaceId) {
      const ws = getWorkspace(this.workspaceId);
      if (ws && ws.tabs && ws.tabs.length > 0) {
        startupTabs = ws.tabs.map((t) => ({ ...t, view: null }));
      }
    }
    if (startupTabs.length === 0) {
      startupTabs = sessionData.tabs.length ? sessionData.tabs : [{ url: this.initialUrl || settings.initialPage }];
    }
    const restoredActiveIndex = Math.min(Math.max(0, sessionData.activeIndex || 0), startupTabs.length - 1);
    startupTabs.forEach((tab, index) => {
      const created = this.createWebTab(tab.url, index === restoredActiveIndex);
      if (tab.pinned) created.pinned = true;
      // Restore workspaceId from stored tab, but only if the workspace still exists (fallback: null)
      if (tab.workspaceId) {
        this.tabs[this.tabs.length - 1].workspaceId = workspaces.has(tab.workspaceId) ? tab.workspaceId : null;
      }
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
    const baseTop = TAB_HEIGHT + (this.expanded ? ADDRESS_HEIGHT : 0) + (this.findOpen ? FIND_HEIGHT : 0);
    // A page in HTML5 fullscreen (video players, games) owns the whole window.
    const top = this.htmlFullscreen ? 0 : Math.round(baseTop * zoomFactor);

    if (this.htmlFullscreen) {
      this.chrome.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    } else if (this.suggestionsOpen) {
      // The dropdown is drawn by the chrome view, which is only as tall as the
      // header; it needs room or it would be clipped away.
      this.window.contentView.addChildView(this.chrome);
      this.chrome.setBounds({ x: 0, y: 0, width, height: Math.min(height, top + Math.round(320 * zoomFactor)) });
    } else if (this.downloadsPanelOpen) {
      this.window.contentView.addChildView(this.chrome);
      this.chrome.setBounds({ x: 0, y: 0, width, height: Math.min(height, Math.round(520 * zoomFactor)) });
    } else {
      this.chrome.setBounds({ x: 0, y: 0, width, height: top });
    }

    for (const tab of this.tabs) {
      const isActive = tab.id === this.activeId;
      // Parking a view off-screen leaves Chromium treating it as visible, so
      // background tabs keep full-rate timers, rAF and video decoding.
      if (typeof tab.view.setVisible === 'function') tab.view.setVisible(isActive);
      tab.view.setBounds(
        isActive
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
    const contents = tab.view.webContents;
    const history = contents.isDestroyed() ? null : contents.navigationHistory;
    return {
      id: tab.id,
      title: tab.title || 'nova aba',
      url: tab.url || '',
      favicon: tab.favicon || '',
      isLoading: tab.loading,
      kind: tab.kind,
      pinned: Boolean(tab.pinned),
      canGoBack: Boolean(history?.canGoBack()),
      canGoForward: Boolean(history?.canGoForward()),
      resourceMetrics: tab.resourceMetrics || { cpu: 0, memory: 0 },
      workspaceId: tab.workspaceId || null
    };
  }
  sendState() {
    if (this.chrome?.webContents.isDestroyed()) return;
    const active = this.active();
    const history = active?.view.webContents.navigationHistory;
    const downloadsSummary = getDownloadsSummary();
    const ws = getWorkspace(this.workspaceId);
    this.chrome.webContents.send('browser:state', {
      tabs: this.tabs.map((tab, idx) => ({ ...this.stateFor(tab), index: idx + 1, resourceMetrics: tab.resourceMetrics })),
      activeId: this.activeId,
      activeUrl: active?.url || '',
      activeLoading: Boolean(active?.loading),
      activeFavorited: Boolean(active && active.kind === 'web' && isFavorite(active.url)),
      canFavorite: Boolean(active && active.kind === 'web' && /^https?:\/\//i.test(active.url || '')),
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
      systemStats: getSystemStats(),
      workspaces: Array.from(workspaces.values()).map((ws) => {
        let tabCount = 0;
        for (const b of browsers) {
          for (const t of b.tabs) {
            if (t.workspaceId === ws.id) tabCount++;
          }
        }
        return { id: ws.id, name: ws.name, icon: ws.icon, tabCount };
      }),
      currentWorkspaceId: this.workspaceId
    });
  }
  createView(kind) {
    const isSpecial = kind === 'settings' || kind === 'favorites' || kind === 'extensions' || kind === 'newtab';
    const view = new WebContentsView({
      webPreferences: {
        preload: isSpecial ? path.join(__dirname, 'settings-preload.js') : undefined,
        partition: this.partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });
    setupSession(view.webContents.session);
    return view;
  }
  // Web content must only ever load in views created without the privileged
  // settings preload, and internal pages only in views created with it.
  // Crossing that boundary replaces the tab's view instead of reusing it.
  ensureViewKind(tab, kind) {
    const isPrivileged = (k) => k === 'settings' || k === 'favorites' || k === 'extensions' || k === 'newtab';
    if (isPrivileged(kind) === isPrivileged(tab.viewKind)) return;
    const old = tab.view;
    const view = this.createView(kind);
    tab.view = view;
    tab.viewKind = kind;
    pageOwners.delete(old.webContents.id);
    pageOwners.set(view.webContents.id, this);
    this.window.contentView.removeChildView(old);
    this.window.contentView.addChildView(view);
    this.tabEvents(tab);
    try { old.webContents.close(); } catch {}
    this.layout();
  }
  createWebTab(url = settings.initialPage, activate = true) { return this.createTab('web', url, activate); }
  createSpecialTab(kind) { return this.createTab(kind, '', true); }
  createTab(kind, target, activate) {
    const view = this.createView(kind);
    // Favicons come only from the page's own page-favicon-updated event —
    // an external favicon service would leak every visited hostname.
    const initialFavicon = '';
    const initialTitle = kind === 'settings' ? 'configurações' : kind === 'favorites' ? 'favoritos' : kind === 'extensions' ? 'extensões' : 'nova aba';
    const initialUrl = kind === 'settings' ? 'zeos://settings' : kind === 'favorites' ? 'zeos://favoritos' : kind === 'extensions' ? 'zeos://extensions' : kind === 'newtab' ? 'zeos://nova-aba' : (target || '');
    const tab = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      viewKind: kind,
      view,
      title: initialTitle,
      url: initialUrl,
      favicon: initialFavicon,
      loading: kind === 'web',
      pinned: false,
      state: 'active',
      lastActiveAt: Date.now(),
      resourceMetrics: {
        cpu: 0,
        memory: 0
      }
    };
    this.tabs.push(tab);
    pageOwners.set(view.webContents.id, this);
    this.window.contentView.addChildView(view);
    this.tabEvents(tab);
    if (activate) this.activeId = tab.id;
    this.layout();
    if (kind === 'settings') view.webContents.loadFile(path.join(__dirname, 'settings', 'index.html'));
    else if (kind === 'favorites') view.webContents.loadFile(path.join(__dirname, 'favorites', 'index.html'));
    else if (kind === 'newtab') view.webContents.loadFile(path.join(__dirname, 'newtab', 'index.html'));
    else if (kind === 'extensions') view.webContents.loadFile(path.join(__dirname, 'extensions', 'index.html'));
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
        const prevUrl = tab.url;
        tab.url = url;
        try {
          if (!prevUrl || new URL(prevUrl).hostname !== new URL(url).hostname) tab.favicon = '';
        } catch { tab.favicon = ''; }
        applySiteZoom(contents, url);
        if (!getOwner().privateMode) addHistory(url, tab.title);
        const owner = getOwner();
        owner.sendState();
        owner.saveSessionSoon();
      }
    });
    contents.on('did-navigate-in-page', (_event, url) => {
      if (tab.kind === 'web') {
        tab.url = url;
        if (!getOwner().privateMode) addHistory(url, tab.title);
        const owner = getOwner();
        owner.sendState();
        owner.saveSessionSoon();
      }
    });
    contents.on('did-fail-load', (_event, code, description, url, mainFrame) => {
      // -3 is ERR_ABORTED, which a normal navigation away also produces.
      if (mainFrame && code !== -3) {
        tab.url = url || tab.url;
        tab.title = 'falha ao carregar';
        tab.loading = false;
        // A failed load used to leave a blank view with no explanation.
        const appearance = settings.appearance || {};
        const query = new URLSearchParams({
          url: url || '',
          description: description || '',
          code: String(code),
          bg: appearance.background || '',
          fg: appearance.foreground || '',
          accent: appearance.accent || '',
          panel: appearance.panel || '',
          border: appearance.border || ''
        }).toString();
        contents.loadFile(path.join(__dirname, 'error', 'index.html'), { search: query }).catch(() => {});
        getOwner().sendState();
      }
    });
    contents.on('found-in-page', (_event, result) => {
      const owner = getOwner();
      if (owner.chrome && !owner.chrome.webContents.isDestroyed()) {
        owner.chrome.webContents.send('browser:find-result', { matches: result.matches, activeMatchOrdinal: result.activeMatchOrdinal });
      }
    });
    contents.on('enter-html-full-screen', () => { const owner = getOwner(); owner.htmlFullscreen = true; owner.layout(); });
    contents.on('leave-html-full-screen', () => { const owner = getOwner(); owner.htmlFullscreen = false; owner.layout(); });
    contents.on('page-favicon-updated', (_event, favicons) => {
      if (Array.isArray(favicons) && favicons.length > 0) {
        tab.favicon = favicons[0];
        getOwner().sendState();
      }
    });
    contents.setWindowOpenHandler(({ url }) => {
      // Web-content-initiated navigation may only produce http/https tabs —
      // never file:, zeos:, chrome:, data: or blob: (privilege escalation).
      if (url === 'about:blank' || /^https?:\/\//i.test(url)) {
        getOwner().createWebTab(url);
      }
      return { action: 'deny' };
    });
    contents.on('will-navigate', (event, url) => {
      // Privileged internal views must never navigate to external content.
      if (tab.viewKind !== 'web' && !url.startsWith('file://')) {
        event.preventDefault();
        if (/^https?:\/\//i.test(url)) getOwner().createWebTab(url);
      }
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
      if (params.mediaType === 'image' && params.srcURL) {
        menu.append(new MenuItem({ label: 'Abrir imagem em nova aba', click: () => owner.createWebTab(params.srcURL) }));
        menu.append(new MenuItem({ label: 'Salvar imagem como...', click: () => contents.downloadURL(params.srcURL) }));
        menu.append(new MenuItem({ label: 'Copiar endereço da imagem', click: () => { const { clipboard } = require('electron'); clipboard.writeText(params.srcURL); } }));
        menu.append(new MenuItem({ type: 'separator' }));
      }
      if (params.selectionText && params.selectionText.trim()) {
        const selection = params.selectionText.trim().slice(0, 200);
        const label = selection.length > 24 ? `${selection.slice(0, 24)}…` : selection;
        menu.append(new MenuItem({
          label: `Pesquisar por "${label}"`,
          click: () => owner.createWebTab(toNavigationTarget(selection, settings.searchProvider).url, true)
        }));
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
      if (tab.kind === 'web' && /^https?:\/\//i.test(tab.url || '')) {
        menu.append(new MenuItem({
          label: isFavorite(tab.url) ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
          click: () => owner.toggleFavorite()
        }));
      }
      menu.append(new MenuItem({ label: 'Localizar na página', click: () => owner.chrome.webContents.send('browser:open-find') }));

      const extensionItems = buildExtensionMenuItems(owner, contents, tab, params);
      if (extensionItems.length) {
        menu.append(new MenuItem({ type: 'separator' }));
        for (const item of extensionItems) menu.append(item);
      }

      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Inspecionar elemento', click: () => contents.inspectElement(params.x, params.y) }));

      menu.popup({ window: owner.window });

      // Refresh the cache for the next right-click, so items registered late
      // (or changed) still show up without a restart.
      for (const ext of getInstalledExtensions()) {
        if (ext.enabled) refreshExtensionContextMenus(ext.id).catch(() => {});
      }
    });
  }
  keyboard(event, input) {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    const key = input.key.toLowerCase(); const ctrl = input.control || input.meta; const tab = this.active();
    if (ctrl && key === 'f') { event.preventDefault(); this.chrome.webContents.send('browser:open-find'); return; }
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
    if (ctrl && key === 'd' && !input.shift) {
      event.preventDefault();
      this.toggleFavorite();
      return;
    }
    if (ctrl && (key === 'b' || (input.shift && key === 'd'))) {
      event.preventDefault();
      this.createSpecialTab('favorites');
      return;
    }
    if (ctrl && input.shift && (key === 'e' || key === 'x')) {
      event.preventDefault();
      this.createSpecialTab('extensions');
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
    if (ctrl && (key === '=' || key === '+')) { event.preventDefault(); this.zoomPage(1); return; }
    if (ctrl && key === '-') { event.preventDefault(); this.zoomPage(-1); return; }
    if (ctrl && key === '0') { event.preventDefault(); this.zoomPage(0); return; }
    if (ctrl && input.shift && key === 't') { event.preventDefault(); this.reopenClosedTab(); return; }
    if (ctrl && key === 'tab') { event.preventDefault(); this.cycle(input.shift ? -1 : 1); return; }
    if (ctrl && /^[1-9]$/u.test(key)) { event.preventDefault(); const next = this.tabs[Number(key) - 1] || this.tabs.at(-1); if (next) this.selectTab(next.id); return; }
    if (input.alt && input.key === 'ArrowLeft' && tab?.view.webContents.navigationHistory.canGoBack()) { event.preventDefault(); tab.view.webContents.navigationHistory.goBack(); return; }
    if (input.alt && input.key === 'ArrowRight' && tab?.view.webContents.navigationHistory.canGoForward()) { event.preventDefault(); tab.view.webContents.navigationHistory.goForward(); return; }
  }
  navigate(tab, target) {
    if (!tab) return;
    const cleanTarget = String(target || '').trim().toLowerCase();
    if (cleanTarget === 'zeos://extensions' || cleanTarget === 'chrome://extensions' || cleanTarget === 'about:extensions') {
      tab.kind = 'extensions';
      tab.title = 'extensões';
      tab.url = 'zeos://extensions';
      tab.loading = false;
      tab.favicon = '';
      this.ensureViewKind(tab, 'extensions');
      tab.view.webContents.loadFile(path.join(__dirname, 'extensions', 'index.html'));
      this.sendState();
      this.saveSessionSoon();
      return;
    }
    if (cleanTarget === 'zeos://settings' || cleanTarget === 'chrome://settings' || cleanTarget === 'about:settings') {
      tab.kind = 'settings';
      tab.title = 'configurações';
      tab.url = 'zeos://settings';
      tab.loading = false;
      tab.favicon = '';
      this.ensureViewKind(tab, 'settings');
      tab.view.webContents.loadFile(path.join(__dirname, 'settings', 'index.html'));
      this.sendState();
      this.saveSessionSoon();
      return;
    }
    if (cleanTarget === 'zeos://nova-aba' || cleanTarget === 'zeos://newtab') {
      tab.kind = 'newtab';
      tab.title = 'nova aba';
      tab.url = 'zeos://nova-aba';
      tab.loading = false;
      tab.favicon = '';
      this.ensureViewKind(tab, 'newtab');
      tab.view.webContents.loadFile(path.join(__dirname, 'newtab', 'index.html'));
      this.sendState();
      this.saveSessionSoon();
      return;
    }
    if (cleanTarget === 'zeos://favoritos' || cleanTarget === 'zeos://bookmarks' || cleanTarget === 'chrome://bookmarks' || cleanTarget === 'about:bookmarks') {
      tab.kind = 'favorites';
      tab.title = 'favoritos';
      tab.url = 'zeos://favoritos';
      tab.loading = false;
      tab.favicon = '';
      this.ensureViewKind(tab, 'favorites');
      tab.view.webContents.loadFile(path.join(__dirname, 'favorites', 'index.html'));
      this.sendState();
      this.saveSessionSoon();
      return;
    }
    tab.kind = 'web';
    this.ensureViewKind(tab, 'web');
    let { url } = toNavigationTarget(target, settings.searchProvider);
    // zeos:// pages other than the ones handled above do not exist; fall back
    // to the home page instead of surfacing ERR_UNKNOWN_URL_SCHEME.
    if (/^zeos:/i.test(url)) url = settings.initialPage || HOME_URL;
    tab.url = url;
    tab.loading = true;
    tab.favicon = '';
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
    // Remember it so Ctrl+Shift+T can bring it back where it was.
    if (tab.kind === 'web' && /^https?:\/\//i.test(tab.url || '')) {
      this.closedTabs.push({ url: tab.url, pinned: Boolean(tab.pinned), index, workspaceId: tab.workspaceId || null });
      if (this.closedTabs.length > 20) this.closedTabs.shift();
    }
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
  // Page zoom is per site and independent from the UI scale in Settings.
  // Ctrl +/-/0 used to resize the whole browser interface instead.
  zoomPage(direction) {
    const tab = this.active();
    const contents = tab?.view.webContents;
    if (!contents || contents.isDestroyed()) return;
    const host = hostOfUrl(tab.url);
    const current = contents.getZoomLevel();
    const level = direction === 0 ? 0 : Math.max(-5, Math.min(7, current + direction));
    contents.setZoomLevel(level);
    if (host) {
      if (!settings.siteZoom || typeof settings.siteZoom !== 'object') settings.siteZoom = {};
      if (level === 0) delete settings.siteZoom[host];
      else settings.siteZoom[host] = level;
      saveSettingsSoon();
    }
  }
  reopenClosedTab() {
    const entry = this.closedTabs.pop();
    if (!entry) return false;
    const tab = this.createWebTab(entry.url, true);
    if (!tab) return false;
    if (entry.pinned) tab.pinned = true;
    tab.workspaceId = entry.workspaceId;
    const from = this.tabs.indexOf(tab);
    const to = Math.min(Math.max(0, entry.index), this.tabs.length - 1);
    if (from >= 0 && to !== from) {
      this.tabs.splice(to, 0, ...this.tabs.splice(from, 1));
    }
    this.reorderPinnedTabs();
    this.layout();
    this.sendState();
    this.saveSessionSoon();
    return true;
  }
  toggleFavorite() {
    const tab = this.active();
    if (!tab || tab.kind !== 'web' || !/^https?:\/\//i.test(tab.url || '')) return false;
    const added = isFavorite(tab.url) ? !removeFavorite(tab.url) : addFavorite({ url: tab.url, title: tab.title, favicon: tab.favicon });
    this.sendState();
    return added;
  }
  saveSession() {
    clearTimeout(this.sessionTimer);
    if (this.privateMode) return;
    writeSessionSnapshot();
  }
  showMenu(menu, point = {}) {
    const zoom = (settings.appearance?.zoomLevel || 100) / 100;
    const options = { window: this.window, x: Math.round((Number(point.x) || 0) * zoom), y: Math.round((Number(point.y) || 0) * zoom) };
    if (menu === 'plus' || menu === 'app-menu') {
      const now = Date.now();
      if (now - this.lastMenuClosedAt < 250) {
        return;
      }
      const menuObj = Menu.buildFromTemplate([
        { label: 'Nova aba', accelerator: 'CmdOrCtrl+T', click: () => this.createWebTab() },
        { label: 'Nova janela', accelerator: 'CmdOrCtrl+N', click: () => new Browser(false, false) },
        { label: 'Nova janela privada', accelerator: 'CmdOrCtrl+Shift+N', click: () => new Browser(true, false) },
        { type: 'separator' },
        { label: 'Downloads', accelerator: 'CmdOrCtrl+J', click: () => this.chrome.webContents.send('browser:toggle-downloads') },
        { label: 'Favoritos', accelerator: 'CmdOrCtrl+D', click: () => this.createSpecialTab('favorites') },
        { label: 'Extensões', accelerator: 'CmdOrCtrl+Shift+E', click: () => this.createSpecialTab('extensions') },
        { label: 'Configurações', accelerator: 'CmdOrCtrl+,', click: () => this.createSpecialTab('settings') },
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
        { label: 'Recarregar', accelerator: 'CmdOrCtrl+R', click: () => tab.view.webContents.reload() },
        { type: 'separator' },
        { label: 'Mover para uma nova janela', enabled: hasOtherTabs, click: () => {
          const bounds = this.window.getBounds();
          this.tearOffTab(tab.id, bounds.x + 40, bounds.y + 40);
        }},
        { type: 'separator' },
        { label: 'Fechar aba', accelerator: 'CmdOrCtrl+W', click: () => this.closeTab(tab.id) },
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
    const zoom = (settings.appearance?.zoomLevel || 100) / 100;
    const options = { window: this.window, x: Math.round((Number(point.x) || 0) * zoom), y: Math.round((Number(point.y) || 0) * zoom) };

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

    template.push({
      label: 'Gerenciar extensões',
      click: () => this.createSpecialTab('extensions')
    });
    if (!isBuiltinExtensionPath(details.path)) {
      template.push({
        label: 'Remover extensão...',
        click: () => removeExtension(ext.id)
      });
    }

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
    else if (command === 'open-extensions') this.createSpecialTab('extensions');
    else if (command === 'open-favorites' || command === 'toggle-sidebar') this.createSpecialTab('favorites');
    else if (command === 'minimize') this.window.minimize();
    else if (command === 'toggle-maximize') this.window.isMaximized() ? this.window.unmaximize() : this.window.maximize();
    else if (command === 'close-window') this.window.close();
    else if (command === 'cycle-next') this.cycle(1);
    else if (command === 'cycle-previous') this.cycle(-1);
    else if (command === 'toggle-chrome') this.toggleChrome();
    else if (command === 'show-downloads') shell.openPath(app.getPath('downloads'));
    else if (command === 'zoom-in') this.zoomPage(1);
    else if (command === 'zoom-out') this.zoomPage(-1);
    else if (command === 'zoom-reset') this.zoomPage(0);
    else if (command === 'reopen-closed-tab') this.reopenClosedTab();
    this.sendState();
  }
}

let activeExtensionPopup = null;

function closePopup() {
  const popup = activeExtensionPopup;
  activeExtensionPopup = null;
  try { if (popup && !popup.isDestroyed()) popup.close(); } catch {}
}

function openExtensionAction(browser, extensionId, anchorBounds = {}) {
  if (activeExtensionPopup && !activeExtensionPopup.isDestroyed()) {
    closePopup();
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

    // Anchor bounds arrive in the chrome view's CSS pixels; scale by the UI
    // zoom factor to get window DIP coordinates.
    const zoom = (settings.appearance?.zoomLevel || 100) / 100;
    let x = winBounds.x + Math.round((Number(anchorBounds.x) * zoom) || (winBounds.width - 250)) + Math.round(((Number(anchorBounds.width) || 28) * zoom) / 2) - Math.round(popupWidth / 2);
    let y = winBounds.y + Math.round((Number(anchorBounds.bottom || anchorBounds.y || 76)) * zoom) + 4;

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
      backgroundColor: settings.appearance.background || '#0b0b0b',
      webPreferences: {
        session: session.defaultSession,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    const popupContents = activeExtensionPopup.webContents;
    // A link or chrome.tabs.create inside the popup would otherwise spawn an
    // unmanaged chromeless always-on-top window; route web URLs to a tab.
    popupContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) browser.createWebTab(url, true);
      closePopup();
      return { action: 'deny' };
    });
    popupContents.on('will-navigate', (event, url) => {
      if (url.startsWith(`chrome-extension://${ext.id}/`)) return;
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) browser.createWebTab(url, true);
      closePopup();
    });
    popupContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') closePopup();
    });

    activeExtensionPopup.loadURL(popupUrl);
    activeExtensionPopup.on('blur', closePopup);
    // A popup anchored to a window that moves or resizes would float detached.
    const reanchor = () => closePopup();
    browser.window.on('move', reanchor);
    browser.window.on('resize', reanchor);
    activeExtensionPopup.on('closed', () => {
      browser.window.removeListener('move', reanchor);
      browser.window.removeListener('resize', reanchor);
      activeExtensionPopup = null;
    });
  } else {
    // Chrome behavior: a click on the action icon fires onClicked in the
    // extension. The options page is reachable only via the context menu.
    const activeTab = browser.active();
    // Electron tab ids are webContents ids; a made-up id breaks
    // chrome.tabs.sendMessage / scripting.executeScript on the real tab.
    const contents = activeTab && !activeTab.view.webContents.isDestroyed() ? activeTab.view.webContents : null;
    triggerExtensionAction(ext.id, {
      id: contents ? contents.id : -1,
      windowId: browser.window.id,
      url: activeTab?.url || '',
      title: activeTab?.title || '',
      index: activeTab ? Math.max(0, browser.tabs.indexOf(activeTab)) : 0,
      active: true
    }).then((ok) => {
      if (!ok) console.error('Extension action dispatch failed for', ext.id);
    });
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
ipcMain.handle('browser:set-suggestions-open', (event, open) => {
  const browser = chromeOwners.get(event.sender.id);
  if (!browser) return false;
  if (browser.suggestionsOpen === Boolean(open)) return true;
  browser.suggestionsOpen = Boolean(open);
  browser.layout();
  return true;
});
ipcMain.handle('omnibox:suggest', (_event, query) => {
  if (typeof query !== 'string') return [];
  return rankSuggestions(query, { history: settings.history || [], favorites, limit: 6 });
});

// Lets an internal page drive its own tab (the new tab page's search box).
ipcMain.handle('page:navigate-self', (event, input) => {
  if (typeof input !== 'string' || !input.trim()) return false;
  const browser = pageOwners.get(event.sender.id);
  const tab = browser?.tabs.find((candidate) => candidate.view.webContents.id === event.sender.id);
  if (!browser || !tab) return false;
  browser.navigate(tab, input.trim());
  return true;
});

// Favorites
ipcMain.handle('favorites:list', () => favorites);
ipcMain.handle('favorites:toggle-active', (event) => chromeOwners.get(event.sender.id)?.toggleFavorite() ?? false);
ipcMain.handle('favorites:add', (_event, entry) => addFavorite(entry || {}));
ipcMain.handle('favorites:remove', (_event, url) => removeFavorite(url));
ipcMain.handle('favorites:open', (event, { url, newTab } = {}) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false;
  const browser = pageOwners.get(event.sender.id) || chromeOwners.get(event.sender.id) || browsers.values().next().value;
  if (!browser) return false;
  if (newTab) browser.createWebTab(url, true);
  else browser.navigate(browser.active(), url);
  return true;
});

// Find in page
ipcMain.handle('browser:find', (event, { text, options } = {}) => {
  const browser = chromeOwners.get(event.sender.id);
  const contents = browser?.active()?.view.webContents;
  if (!contents || contents.isDestroyed() || typeof text !== 'string' || !text) return false;
  contents.findInPage(text, {
    forward: options?.forward !== false,
    findNext: Boolean(options?.findNext),
    matchCase: false
  });
  return true;
});
ipcMain.handle('browser:stop-find', (event) => {
  const browser = chromeOwners.get(event.sender.id);
  for (const tab of browser?.tabs || []) {
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.stopFindInPage('clearSelection');
  }
  return true;
});
ipcMain.handle('browser:set-find-open', (event, open) => {
  const browser = chromeOwners.get(event.sender.id);
  if (!browser) return false;
  browser.findOpen = Boolean(open);
  browser.layout();
  return true;
});

ipcMain.handle('downloads:get-summary', () => getDownloadsSummary());
// Privileged IPC must validate its input: only paths belonging to downloads
// tracked this session may be opened or revealed from the renderer.
const isTrackedDownloadPath = (p) => typeof p === 'string' && sessionDownloads.some(d => d.savePath === p);
ipcMain.handle('downloads:open-file', async (_event, filePath) => {
  if (isTrackedDownloadPath(filePath) && fs.existsSync(filePath)) {
    return shell.openPath(filePath);
  }
  return 'Arquivo não encontrado';
});
ipcMain.handle('downloads:show-in-folder', (_event, filePath) => {
  if (isTrackedDownloadPath(filePath) && fs.existsSync(filePath)) {
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
ipcMain.handle('extensions:toggle-enable', (_event, { extensionId, enabled }) => toggleExtensionEnable(extensionId, enabled));
ipcMain.handle('extensions:reload', (_event, extensionId) => reloadExtension(extensionId));
ipcMain.handle('extensions:reload-all', () => reloadAllExtensions());
ipcMain.handle('extensions:inspect-background', (_event, extensionId) => inspectBackground(extensionId));
ipcMain.handle('extensions:pack', (event, extensionId) => {
  const owner = chromeOwners.get(event.sender.id);
  const win = owner ? owner.window : BrowserWindow.getFocusedWindow();
  return packExtensionDialog(win, extensionId);
});
ipcMain.handle('extensions:show-in-folder', (_event, extensionId) => {
  const ext = getInstalledExtensions().find(e => e.id === extensionId);
  if (ext?.path && fs.existsSync(ext.path)) {
    shell.showItemInFolder(ext.path);
    return true;
  }
  return false;
});
ipcMain.handle('extensions:open-options', (event, extensionId) => {
  const ext = session.defaultSession.getAllExtensions().find(e => e.id === extensionId);
  if (ext) {
    const details = getExtensionDetails(ext);
    if (details.optionsPage) {
      const owner = chromeOwners.get(event.sender.id) || browsers.values().next().value;
      if (owner) {
        owner.createWebTab(`chrome-extension://${ext.id}/${details.optionsPage}`, true);
        return true;
      }
    }
  }
  return false;
});
ipcMain.handle('extensions:open-web-store', (event) => {
  const owner = chromeOwners.get(event.sender.id) || browsers.values().next().value;
  if (owner) {
    owner.createWebTab('https://chromewebstore.google.com/', true);
    return true;
  }
  return false;
});
ipcMain.handle('extensions:set-dev-mode', (_event, enabled) => setDevMode(enabled));
ipcMain.handle('extensions:get-dev-mode', () => Boolean(settings.developerMode));

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

// Workspaces IPC
ipcMain.handle('workspaces:list', () => Array.from(workspaces.values()).map((ws) => {
  let tabCount = 0;
  for (const b of browsers) {
    for (const t of b.tabs) {
      if (t.workspaceId === ws.id) tabCount++;
    }
  }
  return { id: ws.id, name: ws.name, icon: ws.icon, tabCount };
}));
ipcMain.handle('workspaces:create', (_event, { name, icon }) => {
  const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newWorkspace = {
    id,
    name: name || `Workspace ${workspaces.size + 1}`,
    icon: icon || '📁',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tabs: [],
    activeTabId: null,
    history: [],
    metadata: {}
  };
  workspaces.set(id, newWorkspace);
  saveWorkspaces();
  return { id, name: newWorkspace.name, icon: newWorkspace.icon };
});
ipcMain.handle('workspaces:rename', (_event, { workspaceId, newName }) => {
  const ws = workspaces.get(workspaceId);
  if (!ws) return { success: false, error: 'Workspace not found' };
  ws.name = newName;
  ws.updatedAt = Date.now();
  saveWorkspaces();
  return { success: true, name: ws.name };
});
ipcMain.handle('workspaces:icon', (_event, { workspaceId, icon }) => {
  const ws = workspaces.get(workspaceId);
  if (!ws) return { success: false, error: 'Workspace not found' };
  ws.icon = icon;
  ws.updatedAt = Date.now();
  saveWorkspaces();
  return { success: true, icon: ws.icon };
});
ipcMain.handle('workspaces:delete', (_event, workspaceId) => {
  const ws = workspaces.get(workspaceId);
  if (!ws) return { success: false, error: 'Workspace not found' };
  // Move tabs out of the deleted workspace - tabs must survive, no orphaned references
  for (const browser of browsers) {
    for (const tab of browser.tabs) {
      if (tab.workspaceId === workspaceId) {
        tab.workspaceId = null;
      }
    }
    // If this browser's active context was the deleted workspace, clear it
    if (browser.workspaceId === workspaceId) {
      browser.workspaceId = null;
    }
    browser.sendState();
  }
  workspaces.delete(workspaceId);
  saveWorkspaces();
  return { success: true };
});
ipcMain.handle('workspaces:switch', (event, workspaceId) => {
  const ws = workspaces.get(workspaceId);
  if (!ws) return { success: false, error: 'Workspace not found' };

  // Apenas alterar o contexto ativo do browser originador - NÃO mover abas, NÃO afetar outros browsers
  const browser = chromeOwners.get(event.sender.id);
  if (browser) {
    browser.workspaceId = workspaceId;
    browser.sendState();
  }
  saveWorkspaces();
  return { success: true, name: ws.name };
});

// Associate tab with workspace IPC
ipcMain.handle('tab:associate-workspace', (_event, { tabId, workspaceId }) => {
  // Validate: workspaceId must be null or point to an existing workspace
  if (workspaceId !== null && workspaceId !== undefined && !workspaces.has(workspaceId)) {
    return { success: false, error: 'Workspace not found' };
  }
  for (const browser of browsers) {
    const tab = browser.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.workspaceId = workspaceId || null;
      tab.lastActiveAt = Date.now();
      saveWorkspaces();
      browser.sendState();
      return { success: true };
    }
  }
  return { success: false, error: 'Tab not found' };
});

// Tab state IPC
ipcMain.handle('tab:set-state', (_event, { tabId, state }) => {
  for (const browser of browsers) {
    const tab = browser.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.state = state;
      tab.lastActiveAt = Date.now();
      saveWorkspaces();
      return { success: true };
    }
  }
  return { success: false, error: 'Tab not found' };
});

// Tab resource metrics IPC
ipcMain.handle('tab:set-metrics', (_event, { tabId, cpu, memory }) => {
  for (const browser of browsers) {
    const tab = browser.tabs.find((t) => t.id === tabId);
    if (tab) {
      if (tab.resourceMetrics) {
        tab.resourceMetrics.cpu = cpu;
        tab.resourceMetrics.memory = memory;
      } else {
        tab.resourceMetrics = { cpu, memory };
      }
      saveWorkspaces();
      return { success: true };
    }
  }
  return { success: false, error: 'Tab not found' };
});

if (process.platform === 'win32') app.setAppUserModelId('com.thryki.zeos');

// A second instance would fight over session.json/settings.json; focus the
// existing window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const browser = browsers.values().next().value;
    if (browser?.window && !browser.window.isDestroyed()) {
      if (browser.window.isMinimized()) browser.window.restore();
      browser.window.focus();
    }
    // Windows and Linux hand a link to the already-running instance as argv.
    const url = urlFromArgv(argv);
    if (url && browser) browser.createWebTab(url, true);
  });
}

// Links opened from other applications arrive as a command-line argument
// (Windows/Linux) or through the open-url event (macOS).
// Checks GitHub releases for a newer build and installs it on quit, after
// asking. macOS is skipped: Squirrel.Mac refuses unsigned updates.
function setupAutoUpdate() {
  if (!app.isPackaged || process.platform === 'darwin') return;
  let updater;
  try { ({ autoUpdater: updater } = require('electron-updater')); } catch { return; }

  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;
  updater.on('error', (error) => console.error('Update check failed:', error?.message || error));
  updater.on('update-available', async (info) => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Baixar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
      title: 'Atualização disponível',
      message: `A versão ${info?.version || 'mais recente'} do Zeos está disponível.`,
      detail: 'O download acontece em segundo plano e a atualização é aplicada quando você fechar o navegador.'
    });
    if (response === 0) updater.downloadUpdate().catch((error) => console.error('Update download failed:', error?.message || error));
  });

  setTimeout(() => updater.checkForUpdates().catch(() => {}), 10000);
}

function urlFromArgv(argv) {
  if (!Array.isArray(argv)) return '';
  const candidate = argv.slice(1).find((arg) => /^https?:\/\//i.test(arg));
  return candidate || '';
}

let pendingOpenUrl = urlFromArgv(process.argv);
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (!/^https?:\/\//i.test(url)) return;
  const browser = browsers.values().next().value;
  if (browser) browser.createWebTab(url, true);
  else pendingOpenUrl = url;
});

app.whenReady().then(async () => {
  settings = loadSettings();
  if (process.platform === 'darwin') {
    // Without an application menu macOS loses Cmd+Q, Hide and copy/paste.
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'windowMenu' }
    ]));
  }
  setupSession(session.defaultSession);
  await loadSavedExtensions();
  setupAutoUpdate();

  // Register as a browser so the OS can offer Zeos as the default handler.
  for (const scheme of ['http', 'https']) {
    try { app.setAsDefaultProtocolClient(scheme); } catch {}
  }

  const savedWindows = readSessionWindows();
  if (savedWindows.length) for (const entry of savedWindows) new Browser(false, entry);
  else new Browser(false, true);
  if (pendingOpenUrl) {
    browsers.values().next().value?.createWebTab(pendingOpenUrl, true);
    pendingOpenUrl = '';
  }
  app.on('activate', () => { if (!browsers.size) new Browser(false, true); });

  // System stats timer
  setInterval(() => {
    const stats = getSystemStats(0);
    for (const browser of browsers) {
      if (!browser.chrome.webContents.isDestroyed()) {
        browser.chrome.webContents.send('browser:system-stats', stats);
      }
    }
  }, 2500);
}).catch((err) => {
  console.error('Fatal startup error:', err);
  try { dialog.showErrorBox('Zeos', `Falha ao iniciar: ${err?.message || err}`); } catch {}
  app.quit();
});

app.on('before-quit', () => {
  writeSessionSnapshot(); // snapshot every open window before any of them closes
  sessionFrozen = true;
  saveSettings();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
