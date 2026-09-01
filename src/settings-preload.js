'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zeosSettings', {
  get: () => ipcRenderer.invoke('settings:get'),
  getThemes: () => ipcRenderer.invoke('settings:get-themes'),
  update: (patch) => ipcRenderer.invoke('settings:update', patch),
  clearHistory: () => ipcRenderer.invoke('settings:clear-history'),
  clearHistoryRange: (range) => ipcRenderer.invoke('settings:clear-history-range', range),
  removeHistoryItem: (url) => ipcRenderer.invoke('settings:remove-history-item', url),
  openUrl: (url) => ipcRenderer.invoke('settings:open-url', url),
  clearCookies: () => ipcRenderer.invoke('settings:clear-cookies'),
  extensions: {
    getAll: () => ipcRenderer.invoke('extensions:get-all'),
    loadUnpacked: () => ipcRenderer.invoke('extensions:load-unpacked'),
    remove: (extensionId) => ipcRenderer.invoke('extensions:remove', extensionId),
    toggleEnable: (extensionId, enabled) => ipcRenderer.invoke('extensions:toggle-enable', { extensionId, enabled }),
    reload: (extensionId) => ipcRenderer.invoke('extensions:reload', extensionId),
    reloadAll: () => ipcRenderer.invoke('extensions:reload-all'),
    inspectBackground: (extensionId) => ipcRenderer.invoke('extensions:inspect-background', extensionId),
    pack: (extensionId) => ipcRenderer.invoke('extensions:pack', extensionId),
    showInFolder: (extensionId) => ipcRenderer.invoke('extensions:show-in-folder', extensionId),
    openOptions: (extensionId) => ipcRenderer.invoke('extensions:open-options', extensionId),
    openWebStore: () => ipcRenderer.invoke('extensions:open-web-store'),
    setDevMode: (enabled) => ipcRenderer.invoke('extensions:set-dev-mode', Boolean(enabled)),
    getDevMode: () => ipcRenderer.invoke('extensions:get-dev-mode')
  },
  onChanged: (handler) => {
    const listener = (_event, settings) => handler(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  }
});

contextBridge.exposeInMainWorld('zeosExtensions', {
  getAll: () => ipcRenderer.invoke('extensions:get-all'),
  loadUnpacked: () => ipcRenderer.invoke('extensions:load-unpacked'),
  remove: (extensionId) => ipcRenderer.invoke('extensions:remove', extensionId),
  toggleEnable: (extensionId, enabled) => ipcRenderer.invoke('extensions:toggle-enable', { extensionId, enabled }),
  reload: (extensionId) => ipcRenderer.invoke('extensions:reload', extensionId),
  reloadAll: () => ipcRenderer.invoke('extensions:reload-all'),
  inspectBackground: (extensionId) => ipcRenderer.invoke('extensions:inspect-background', extensionId),
  pack: (extensionId) => ipcRenderer.invoke('extensions:pack', extensionId),
  showInFolder: (extensionId) => ipcRenderer.invoke('extensions:show-in-folder', extensionId),
  openOptions: (extensionId) => ipcRenderer.invoke('extensions:open-options', extensionId),
  openWebStore: () => ipcRenderer.invoke('extensions:open-web-store'),
  setDevMode: (enabled) => ipcRenderer.invoke('extensions:set-dev-mode', Boolean(enabled)),
  getDevMode: () => ipcRenderer.invoke('extensions:get-dev-mode'),
  openUrl: (url) => ipcRenderer.invoke('settings:open-url', url),
  onChanged: (handler) => {
    const listener = (_event, settings) => handler(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  }
});

