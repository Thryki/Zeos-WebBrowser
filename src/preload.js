'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zeos', {
  command: (command, payload) => ipcRenderer.invoke('browser:command', { command, payload }),
  setChromeExpanded: (expanded) => ipcRenderer.invoke('browser:chrome-expanded', Boolean(expanded)),
  setDownloadsPanelOpen: (isOpen) => ipcRenderer.invoke('browser:set-downloads-panel', Boolean(isOpen)),
  windowDrag: (action, payload) => ipcRenderer.invoke('browser:window-drag', { action, payload }),
  showMenu: (menu, point) => ipcRenderer.invoke('browser:show-menu', { menu, point }),
  reorderTabs: (tabId, newIndex) => ipcRenderer.invoke('browser:reorder-tabs', { tabId, newIndex }),
  attachTab: (tabId, newIndex) => ipcRenderer.invoke('browser:attach-tab', { tabId, newIndex }),
  tearOffTab: (tabId, screenX, screenY) => ipcRenderer.invoke('browser:tear-off-tab', { tabId, screenX, screenY }),
  openExtensionAction: (extensionId, bounds) => ipcRenderer.invoke('browser:open-extension-action', { extensionId, bounds }),
  showExtensionMenu: (extensionId, point) => ipcRenderer.invoke('browser:show-extension-menu', { extensionId, point }),
  downloads: {
    getSummary: () => ipcRenderer.invoke('downloads:get-summary'),
    openFile: (filePath) => ipcRenderer.invoke('downloads:open-file', filePath),
    showInFolder: (filePath) => ipcRenderer.invoke('downloads:show-in-folder', filePath),
    openFolder: () => ipcRenderer.invoke('downloads:open-folder'),
    cancel: (downloadId) => ipcRenderer.invoke('downloads:cancel', downloadId)
  },
  onState: (handler) => {
    const listener = (_event, state) => handler(state);
    ipcRenderer.on('browser:state', listener);
    return () => ipcRenderer.removeListener('browser:state', listener);
  },
  onFocusOmnibox: (handler) => {
    ipcRenderer.on('browser:focus-omnibox', handler);
    return () => ipcRenderer.removeListener('browser:focus-omnibox', handler);
  },
  onDownloadsUpdated: (handler) => {
    const listener = (_event, summary) => handler(summary);
    ipcRenderer.on('browser:downloads-updated', listener);
    return () => ipcRenderer.removeListener('browser:downloads-updated', listener);
  },
  onDownloadStarted: (handler) => {
    const listener = (_event, item) => handler(item);
    ipcRenderer.on('browser:download-started', listener);
    return () => ipcRenderer.removeListener('browser:download-started', listener);
  },
  onToggleDownloads: (handler) => {
    ipcRenderer.on('browser:toggle-downloads', handler);
    return () => ipcRenderer.removeListener('browser:toggle-downloads', handler);
  },
  onSystemStats: (handler) => {
    const listener = (_event, stats) => handler(stats);
    ipcRenderer.on('browser:system-stats', listener);
    return () => ipcRenderer.removeListener('browser:system-stats', listener);
  },
  workspaces: {
    list: () => ipcRenderer.invoke('workspaces:list'),
    create: (name, icon) => ipcRenderer.invoke('workspaces:create', { name, icon }),
    rename: (workspaceId, newName) => ipcRenderer.invoke('workspaces:rename', { workspaceId, newName }),
    icon: (workspaceId, icon) => ipcRenderer.invoke('workspaces:icon', { workspaceId, icon }),
    delete: (workspaceId) => ipcRenderer.invoke('workspaces:delete', workspaceId),
    switch: (workspaceId) => ipcRenderer.invoke('workspaces:switch', workspaceId)
  },
  tab: {
    associateWorkspace: (tabId, workspaceId) => ipcRenderer.invoke('tab:associate-workspace', { tabId, workspaceId }),
    setState: (tabId, state) => ipcRenderer.invoke('tab:set-state', { tabId, state }),
    setMetrics: (tabId, cpu, memory) => ipcRenderer.invoke('tab:set-metrics', { tabId, cpu, memory })
  }
});
