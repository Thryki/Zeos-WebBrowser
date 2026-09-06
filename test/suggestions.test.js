'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { rankSuggestions } = require('../src/suggestions');

const NOW = 1_700_000_000_000;
const day = 86400000;
const hist = (url, extra = {}) => ({ url, title: url, visitCount: 1, lastVisitedAt: NOW - day, ...extra });

test('an empty query suggests nothing', () => {
  assert.deepEqual(rankSuggestions('', { history: [hist('https://github.com')] }), []);
  assert.deepEqual(rankSuggestions('   ', { history: [hist('https://github.com')] }), []);
});

test('only matching entries are returned', () => {
  const history = [hist('https://github.com'), hist('https://news.ycombinator.com')];
  const results = rankSuggestions('git', { history, now: NOW });
  assert.equal(results.length, 1);
  assert.equal(results[0].url, 'https://github.com');
});

test('a host prefix match outranks a match inside the title', () => {
  const history = [
    hist('https://example.com/artigo', { title: 'Tudo sobre github' }),
    hist('https://github.com')
  ];
  const results = rankSuggestions('github', { history, now: NOW });
  assert.equal(results[0].url, 'https://github.com');
});

test('favorites outrank plain history and are flagged', () => {
  const history = [hist('https://github.com/explore', { visitCount: 3 })];
  const favorites = [{ url: 'https://github.com', title: 'GitHub', addedAt: NOW - day }];
  const results = rankSuggestions('github', { history, favorites, now: NOW });
  assert.equal(results[0].url, 'https://github.com');
  assert.equal(results[0].favorite, true);
});

test('a url present in both history and favorites appears once', () => {
  const url = 'https://github.com';
  const results = rankSuggestions('github', {
    history: [hist(url)],
    favorites: [{ url, title: 'GitHub', addedAt: NOW }],
    now: NOW
  });
  assert.equal(results.filter((r) => r.url === url).length, 1);
});

test('more visits and more recent visits rank higher', () => {
  const results = rankSuggestions('site', {
    history: [
      hist('https://site.com/a', { visitCount: 1, lastVisitedAt: NOW - 40 * day }),
      hist('https://site.com/b', { visitCount: 9, lastVisitedAt: NOW - 1000 })
    ],
    now: NOW
  });
  assert.equal(results[0].url, 'https://site.com/b');
});

test('matching is case-insensitive and the limit is respected', () => {
  const history = Array.from({ length: 20 }, (_, i) => hist(`https://site${i}.com`));
  const results = rankSuggestions('SITE', { history, limit: 4, now: NOW });
  assert.equal(results.length, 4);
});

test('entries with a broken url never crash the ranking', () => {
  const results = rankSuggestions('foo', { history: [hist('not a url foo'), hist('https://foo.com')], now: NOW });
  assert.equal(results[0].url, 'https://foo.com');
});
