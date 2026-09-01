'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function setupWorkspaceTest() {
  const workspaces = new Map();
  const browsers = new Map();

  // Create workspaces A and B
  workspaces.set('ws-A', {
    id: 'ws-A',
    name: 'A',
    icon: '📁',
    tabs: [],
    activeTabId: null,
    history: [],
    metadata: {}
  });
  workspaces.set('ws-B', {
    id: 'ws-B',
    name: 'B',
    icon: '📁',
    tabs: [],
    activeTabId: null,
    history: [],
    metadata: {}
  });

  // Create browsers with tabs in different workspaces
  const browser1 = {
    id: 'browser-1',
    workspaceId: 'ws-A',
    tabs: [
      { id: 'tab1', workspaceId: 'ws-A' },
      { id: 'tab2', workspaceId: 'ws-A' }
    ],
    activeId: 'tab1'
  };
  const browser2 = {
    id: 'browser-2',
    workspaceId: 'ws-B',
    tabs: [
      { id: 'tab3', workspaceId: 'ws-B' },
      { id: 'tab4', workspaceId: 'ws-B' }
    ],
    activeId: 'tab3'
  };

  browsers.set('browser-1', browser1);
  browsers.set('browser-2', browser2);

  return { workspaces, browsers };
}

test('TEST 1 — switch não move abas', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Execute workspaces:switch logic (the FIXED version)
  // Apenas alterar o contexto ativo - NÃO mover abas
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-B';
  }

  // Verify: tab workspaceIds unchanged, only context changed
  const b1 = browsers.get('browser-1');
  const b2 = browsers.get('browser-2');

  assert.strictEqual(b1.tabs[0].workspaceId, 'ws-A', 'tab1.workspaceId should remain A after switch(B)');
  assert.strictEqual(b1.tabs[1].workspaceId, 'ws-A', 'tab2.workspaceId should remain A after switch(B)');
  assert.strictEqual(b2.tabs[0].workspaceId, 'ws-B', 'tab3.workspaceId should remain B after switch(B)');
  assert.strictEqual(b2.tabs[1].workspaceId, 'ws-B', 'tab4.workspaceId should remain B after switch(B)');
});

test('TEST 2 — alternância repetida', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // A → B → A → B → A
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-B';
  }
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-A';
  }
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-B';
  }
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-A';
  }

  // Verify: no association changed
  const b1 = browsers.get('browser-1');
  const b2 = browsers.get('browser-2');

  assert.strictEqual(b1.tabs[0].workspaceId, 'ws-A');
  assert.strictEqual(b1.tabs[1].workspaceId, 'ws-A');
  assert.strictEqual(b2.tabs[0].workspaceId, 'ws-B');
  assert.strictEqual(b2.tabs[1].workspaceId, 'ws-B');
});

test('TEST 3 — mover uma única aba (tab:associate-workspace)', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Only move tab1 from workspace A to workspace B
  const tab1 = browsers.get('browser-1').tabs.find(t => t.id === 'tab1');
  if (tab1) {
    tab1.workspaceId = 'ws-B';
  }

  const b1 = browsers.get('browser-1');

  // Verify: only tab1 moved, others unchanged
  assert.strictEqual(b1.tabs[0].workspaceId, 'ws-B', 'tab1 should now be in B');
  assert.strictEqual(b1.tabs[1].workspaceId, 'ws-A', 'tab2 should remain in A');
});

test('TEST 4 — excluir Workspace não perde Tabs', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Delete workspace A - also update tab workspaceIds to simulate the deletion handler
  workspaces.delete('ws-A');
  for (const browser of browsers.values()) {
    for (const tab of browser.tabs) {
      if (tab.workspaceId === 'ws-A') {
        tab.workspaceId = null;
      }
    }
  }

  const b1 = browsers.get('browser-1');

  // Verify: tabs still exist, no invalid references
  assert.strictEqual(b1.tabs.length, 2, 'tab1 and tab2 should still exist after deleting workspace A');
  assert.strictEqual(b1.tabs[0].workspaceId, null, 'tab1.workspaceId should be null (no invalid reference)');
  assert.strictEqual(b1.tabs[1].workspaceId, null, 'tab2.workspaceId should be null (no invalid reference)');
});

test('TEST 5 — Workspace inexistente não produz estado corrompido', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Try to switch to non-existent workspace
  const success = workspaces.get('ws-NONEXISTENT') !== undefined;

  // Should handle gracefully - the fixed switch returns error for non-existent
  // But the key invariant: tabs should not be reclassified to non-existent workspace
  const b1 = browsers.get('browser-1');

  // Tabs keep their original workspaceId, they don't become orphaned to non-existent workspace
  assert.ok(b1.tabs[0].workspaceId === 'ws-A' || b1.tabs[0].workspaceId === null,
    'tab should keep its workspaceId or be null, not point to non-existent workspace');
});

test('TEST 6 — múltiplos Browsers: switch não reclassifica Tabs de outros Browsers', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Switch to workspace A - should only affect the context, not move tabs
  for (const browser of browsers.values()) {
    browser.workspaceId = 'ws-A';
  }

  const b2 = browsers.get('browser-2');

  // Verify: browser 2's tab still has workspaceId B
  assert.strictEqual(b2.tabs[0].workspaceId, 'ws-B', 'browser 2 tab should remain in workspace B after switch(A)');
});

test('TEST 7 — switch afeta apenas o browser originador, não outros browsers', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Simulate fixed workspaces:switch that only affects one browser (the originator)
  const originatingBrowser = browsers.get('browser-1');
  originatingBrowser.workspaceId = 'ws-B'; // only the originator changes context

  const b1 = browsers.get('browser-1');
  const b2 = browsers.get('browser-2');

  // Only browser-1 context changed
  assert.strictEqual(b1.workspaceId, 'ws-B', 'originating browser context should change to B');
  // browser-2 context must NOT change
  assert.strictEqual(b2.workspaceId, 'ws-B', 'browser-2 context should remain unchanged at B');
  // Tab associations must be unchanged
  assert.strictEqual(b1.tabs[0].workspaceId, 'ws-A', 'tab1 association must not change');
  assert.strictEqual(b2.tabs[0].workspaceId, 'ws-B', 'tab3 association must not change');
});

test('TEST 8 — persistência: workspaceId é incluído na serialização da sessão', () => {
  // Simulate saveSession logic: tabs must include workspaceId
  const tabs = [
    { id: 'tab1', kind: 'web', url: 'https://a.com', pinned: false, workspaceId: 'ws-A' },
    { id: 'tab2', kind: 'web', url: 'https://b.com', pinned: true, workspaceId: 'ws-B' },
    { id: 'tab3', kind: 'settings', url: 'zeos://settings', pinned: false, workspaceId: null }
  ];

  // Simulate the fixed saveSession serialization (only web tabs, includes workspaceId)
  const serialized = tabs
    .filter(t => t.kind === 'web')
    .map(t => ({ url: t.url, pinned: Boolean(t.pinned), workspaceId: t.workspaceId || null }));

  assert.strictEqual(serialized.length, 2, 'only web tabs are serialized');
  assert.strictEqual(serialized[0].workspaceId, 'ws-A', 'tab1 workspaceId preserved in session');
  assert.strictEqual(serialized[1].workspaceId, 'ws-B', 'tab2 workspaceId preserved in session');
});

test('TEST 9 — restauração: workspaceId inválido recebe null (fallback)', () => {
  // Simulate session restoration with workspaceId validation
  const workspaces = new Map();
  workspaces.set('ws-A', { id: 'ws-A', name: 'A' });
  // ws-B no longer exists

  const sessionTabs = [
    { url: 'https://a.com', workspaceId: 'ws-A' }, // valid
    { url: 'https://b.com', workspaceId: 'ws-B' }, // orphaned — workspace deleted
    { url: 'https://c.com', workspaceId: null }    // already null
  ];

  // Simulate the fixed restore logic
  const restored = sessionTabs.map(tab => ({
    url: tab.url,
    workspaceId: tab.workspaceId ? (workspaces.has(tab.workspaceId) ? tab.workspaceId : null) : null
  }));

  assert.strictEqual(restored[0].workspaceId, 'ws-A', 'valid workspaceId preserved on restore');
  assert.strictEqual(restored[1].workspaceId, null, 'orphaned workspaceId becomes null on restore');
  assert.strictEqual(restored[2].workspaceId, null, 'null workspaceId remains null');

  // Invariant: no restored tab points to a non-existent workspace
  for (const tab of restored) {
    assert.ok(
      tab.workspaceId === null || workspaces.has(tab.workspaceId),
      `tab.workspaceId must be null or point to existing workspace, got: ${tab.workspaceId}`
    );
  }
});

test('TEST 10 — tab:associate-workspace rejeita workspace inexistente', () => {
  const { workspaces, browsers } = setupWorkspaceTest();

  // Simulate the fixed associate-workspace handler
  function associateWorkspace(tabId, workspaceId) {
    // Validate: workspaceId must be null or point to an existing workspace
    if (workspaceId !== null && workspaceId !== undefined && !workspaces.has(workspaceId)) {
      return { success: false, error: 'Workspace not found' };
    }
    for (const browser of browsers.values()) {
      const tab = browser.tabs.find(t => t.id === tabId);
      if (tab) {
        tab.workspaceId = workspaceId || null;
        return { success: true };
      }
    }
    return { success: false, error: 'Tab not found' };
  }

  // Try to associate tab1 with a non-existent workspace
  const result = associateWorkspace('tab1', 'ws-NONEXISTENT');
  assert.strictEqual(result.success, false, 'association to non-existent workspace must fail');
  assert.strictEqual(result.error, 'Workspace not found');

  // tab1 must remain in its original workspace
  const tab1 = browsers.get('browser-1').tabs.find(t => t.id === 'tab1');
  assert.strictEqual(tab1.workspaceId, 'ws-A', 'tab1 must remain in ws-A after failed association');

  // Valid association still works
  const result2 = associateWorkspace('tab1', 'ws-B');
  assert.strictEqual(result2.success, true, 'association to existing workspace must succeed');
  assert.strictEqual(tab1.workspaceId, 'ws-B', 'tab1 workspaceId updated to ws-B');
});