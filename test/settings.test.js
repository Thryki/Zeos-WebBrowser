'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { THEMES, getTheme } = require('../src/themes');
const { HOME_URL, SEARCH_PROVIDERS, toNavigationTarget } = require('../src/navigation');

test('search providers configuration contains expected search engines', () => {
  assert.ok(SEARCH_PROVIDERS.duckduckgo);
  assert.ok(SEARCH_PROVIDERS.google);
  assert.ok(SEARCH_PROVIDERS.bing);
  assert.ok(SEARCH_PROVIDERS.brave);
  assert.ok(SEARCH_PROVIDERS.ecosia);
});

test('themes provide proper appearance keys', () => {
  for (const theme of THEMES) {
    assert.ok(theme.id);
    assert.ok(theme.name);
    assert.ok(theme.appearance.background);
    assert.ok(theme.appearance.foreground);
    assert.ok(theme.appearance.accent);
    assert.ok(theme.appearance.panel);
    assert.ok(theme.appearance.border);
  }
});
