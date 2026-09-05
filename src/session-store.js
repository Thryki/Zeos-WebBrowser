'use strict';

// Pure session-shape helpers, importable without Electron so the tab-loss
// invariants ("restoring never duplicates or loses tabs") are covered by tests.

// Accepts both the v2 shape ({ version, windows: [...] }) and the pre-v2
// single-window file ({ bounds, tabs, activeIndex }).
function normalizeSessionWindows(stored, defaultBounds) {
  const source = stored && typeof stored === 'object' ? stored : {};
  const rawWindows = Array.isArray(source.windows) ? source.windows
    : (source.tabs || source.bounds ? [source] : []);
  return rawWindows
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const tabs = Array.isArray(entry.tabs)
        ? entry.tabs
          .filter((tab) => tab && typeof tab.url === 'string' && tab.url)
          .map((tab) => ({ ...tab, pinned: Boolean(tab.pinned) }))
        : [];
      return {
        bounds: entry.bounds || defaultBounds,
        tabs,
        activeIndex: Math.min(Math.max(0, Number(entry.activeIndex) || 0), Math.max(0, tabs.length - 1))
      };
    })
    .filter((entry) => entry.tabs.length > 0);
}

// activeIndex must index the persisted web-only list, not the full tab list
// which also contains settings/extensions/favorites tabs.
function buildSessionEntry({ bounds, tabs, activeId, fallbackUrl }) {
  const webTabs = (tabs || []).filter((tab) => tab.kind === 'web');
  return {
    bounds,
    activeIndex: Math.max(0, webTabs.findIndex((tab) => tab.id === activeId)),
    tabs: webTabs.map((tab) => ({
      url: tab.url || fallbackUrl,
      pinned: Boolean(tab.pinned),
      workspaceId: tab.workspaceId || null
    }))
  };
}

module.exports = { normalizeSessionWindows, buildSessionEntry };
