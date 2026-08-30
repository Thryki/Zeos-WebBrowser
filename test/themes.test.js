'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { THEMES, getTheme } = require('../src/themes');

test('provides Alethe themes matching reference designs', () => {
  assert.ok(THEMES.length >= 14);
  const ids = THEMES.map((t) => t.id);
  assert.ok(ids.includes('dark'));
  assert.ok(ids.includes('light'));
  assert.ok(ids.includes('dracula'));
  assert.ok(ids.includes('nord'));
  assert.ok(ids.includes('gruvbox'));
  assert.ok(ids.includes('solarized'));
  assert.ok(ids.includes('tokyo-night'));
  assert.ok(ids.includes('vscode'));
  assert.ok(ids.includes('min-dark'));
  assert.ok(ids.includes('min-light'));
  assert.ok(ids.includes('dark-lemon'));
  assert.ok(ids.includes('orca'));
  assert.ok(ids.includes('ember'));
  assert.ok(ids.includes('golden-premium'));
});

test('getTheme returns the matching theme or defaults to orca', () => {
  const dracula = getTheme('dracula');
  assert.equal(dracula.id, 'dracula');
  assert.equal(dracula.appearance.accent, '#bd93f9');

  const fallback = getTheme('non-existent');
  assert.equal(fallback.id, 'orca');
});
