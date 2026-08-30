'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HOME_URL, toNavigationTarget } = require('../src/navigation');

test('uses the home page for an empty omnibox', () => {
  assert.deepEqual(toNavigationTarget('  '), { type: 'url', url: HOME_URL });
});

test('keeps a full HTTPS address', () => {
  assert.deepEqual(toNavigationTarget('https://example.com/path'), { type: 'url', url: 'https://example.com/path' });
});

test('adds HTTPS to a bare domain', () => {
  assert.deepEqual(toNavigationTarget('example.com/docs'), { type: 'url', url: 'https://example.com/docs' });
  assert.deepEqual(toNavigationTarget('google.com'), { type: 'url', url: 'https://google.com/' });
  assert.deepEqual(toNavigationTarget('www.google.com'), { type: 'url', url: 'https://www.google.com/' });
  assert.deepEqual(toNavigationTarget('globo.com'), { type: 'url', url: 'https://globo.com/' });
});

test('resolves localhost and 127.0.0.1 to HTTP by default', () => {
  assert.deepEqual(toNavigationTarget('localhost:3000'), { type: 'url', url: 'http://localhost:3000/' });
  assert.deepEqual(toNavigationTarget('127.0.0.1:8080/dashboard'), { type: 'url', url: 'http://127.0.0.1:8080/dashboard' });
});

test('turns single search word into configured search provider query', () => {
  assert.deepEqual(toNavigationTarget('notebooks', 'duckduckgo'), {
    type: 'search',
    url: 'https://duckduckgo.com/?q=notebooks'
  });
  assert.deepEqual(toNavigationTarget('notebooks', 'google'), {
    type: 'search',
    url: 'https://www.google.com/search?q=notebooks'
  });
  assert.deepEqual(toNavigationTarget('notebooks', 'bing'), {
    type: 'search',
    url: 'https://www.bing.com/search?q=notebooks'
  });
  assert.deepEqual(toNavigationTarget('notebooks', 'brave'), {
    type: 'search',
    url: 'https://search.brave.com/search?q=notebooks'
  });
});

test('turns multi-word text into configured search query', () => {
  assert.deepEqual(toNavigationTarget('minimal browser ui'), {
    type: 'search',
    url: 'https://duckduckgo.com/?q=minimal%20browser%20ui'
  });
  assert.deepEqual(toNavigationTarget('electron js', 'google'), {
    type: 'search',
    url: 'https://www.google.com/search?q=electron%20js'
  });
  assert.deepEqual(toNavigationTarget('notebooks gamer baratas', 'brave'), {
    type: 'search',
    url: 'https://search.brave.com/search?q=notebooks%20gamer%20baratas'
  });
});
