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
    remove: (extensionId) => ipcRenderer.invoke('extensions:remove', extensionId)
  },
  onChanged: (handler) => {
    const listener = (_event, settings) => handler(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  }
});
