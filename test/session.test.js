'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSessionWindows, buildSessionEntry } = require('../src/session-store');

const BOUNDS = { x: 0, y: 0, width: 1200, height: 800 };
const webTab = (id, url, extra = {}) => ({ id, url, kind: 'web', ...extra });

test('every window in the session is restored, not just one', () => {
  const stored = {
    version: 2,
    windows: [
      { bounds: BOUNDS, activeIndex: 0, tabs: [{ url: 'https://a.com' }, { url: 'https://b.com' }] },
      { bounds: BOUNDS, activeIndex: 1, tabs: [{ url: 'https://c.com' }] }
    ]
  };
  const windows = normalizeSessionWindows(stored, BOUNDS);
  assert.equal(windows.length, 2);
  assert.deepEqual(windows.flatMap((w) => w.tabs.map((t) => t.url)), ['https://a.com', 'https://b.com', 'https://c.com']);
});

test('a pre-v2 single-window session file still restores', () => {
  const windows = normalizeSessionWindows({ bounds: BOUNDS, activeIndex: 1, tabs: [{ url: 'https://a.com' }, { url: 'https://b.com' }] }, BOUNDS);
  assert.equal(windows.length, 1);
  assert.equal(windows[0].activeIndex, 1);
  assert.equal(windows[0].tabs.length, 2);
});

test('empty, missing and malformed sessions never produce phantom windows', () => {
  assert.deepEqual(normalizeSessionWindows({}, BOUNDS), []);
  assert.deepEqual(normalizeSessionWindows(null, BOUNDS), []);
  assert.deepEqual(normalizeSessionWindows({ version: 2, windows: [{ tabs: [] }, null] }, BOUNDS), []);
  const windows = normalizeSessionWindows({ version: 2, windows: [{ tabs: [{ url: '' }, { url: 'https://ok.com' }, {}] }] }, BOUNDS);
  assert.deepEqual(windows[0].tabs.map((t) => t.url), ['https://ok.com']);
});

test('activeIndex out of range is clamped instead of activating nothing', () => {
  const windows = normalizeSessionWindows({ version: 2, windows: [{ activeIndex: 99, tabs: [{ url: 'https://a.com' }] }] }, BOUNDS);
  assert.equal(windows[0].activeIndex, 0);
  const negative = normalizeSessionWindows({ version: 2, windows: [{ activeIndex: -5, tabs: [{ url: 'https://a.com' }] }] }, BOUNDS);
  assert.equal(negative[0].activeIndex, 0);
});

test('activeIndex indexes the persisted web tabs, ignoring internal pages', () => {
  // A settings tab before the active web tab used to shift the restored
  // selection, because the index was computed over the full tab list.
  const tabs = [
    { id: 's1', kind: 'settings', url: 'zeos://settings' },
    webTab('w1', 'https://a.com'),
    webTab('w2', 'https://b.com')
  ];
  const entry = buildSessionEntry({ bounds: BOUNDS, tabs, activeId: 'w2', fallbackUrl: 'https://home' });
  assert.deepEqual(entry.tabs.map((t) => t.url), ['https://a.com', 'https://b.com']);
  assert.equal(entry.activeIndex, 1);
  assert.equal(entry.tabs[entry.activeIndex].url, 'https://b.com');
});

test('an active internal page falls back to the first web tab', () => {
  const entry = buildSessionEntry({ bounds: BOUNDS, tabs: [{ id: 'e1', kind: 'extensions' }, webTab('w1', 'https://a.com')], activeId: 'e1', fallbackUrl: 'https://home' });
  assert.equal(entry.activeIndex, 0);
});

test('session round-trip preserves tabs, pinning and workspace without duplication', () => {
  const tabs = [webTab('w1', 'https://a.com', { pinned: true, workspaceId: 'ws-1' }), webTab('w2', 'https://b.com')];
  const entry = buildSessionEntry({ bounds: BOUNDS, tabs, activeId: 'w2', fallbackUrl: 'https://home' });
  const restored = normalizeSessionWindows({ version: 2, windows: [entry] }, BOUNDS)[0];
  assert.equal(restored.tabs.length, 2);
  assert.equal(restored.tabs[0].pinned, true);
  assert.equal(restored.tabs[0].workspaceId, 'ws-1');
  assert.equal(restored.tabs[1].pinned, false);
  assert.equal(restored.activeIndex, 1);
});

test('a tab with no url yet is persisted as the configured home page', () => {
  const entry = buildSessionEntry({ bounds: BOUNDS, tabs: [webTab('w1', '')], activeId: 'w1', fallbackUrl: 'https://home' });
  assert.equal(entry.tabs[0].url, 'https://home');
});
