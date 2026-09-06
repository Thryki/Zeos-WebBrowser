'use strict';

// Pure omnibox ranking, importable without Electron.

function normalize(value) { return String(value || '').toLowerCase().trim(); }

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// Ranks history and favorites against what the user typed. Prefix matches on
// the host win over matches buried in a path or title, favorites outrank plain
// history, and frequent/recent pages outrank one-off visits.
function rankSuggestions(query, { history = [], favorites = [], limit = 6, now = Date.now() } = {}) {
  const q = normalize(query);
  if (!q) return [];

  const favoriteUrls = new Set(favorites.map((item) => item.url));
  const candidates = [
    ...favorites.map((item) => ({ url: item.url, title: item.title, visitCount: 0, lastVisitedAt: item.addedAt, favorite: true })),
    ...history.map((item) => ({
      url: item.url,
      title: item.title,
      visitCount: Number(item.visitCount) || 1,
      lastVisitedAt: Number(item.lastVisitedAt || item.visitedAt) || 0,
      favorite: favoriteUrls.has(item.url)
    }))
  ];

  const scored = [];
  const seen = new Set();
  for (const item of candidates) {
    if (!item.url || seen.has(item.url)) continue;

    const host = hostOf(item.url);
    const url = normalize(item.url);
    const title = normalize(item.title);
    const haystack = `${url} ${title}`;
    if (!haystack.includes(q)) continue;

    seen.add(item.url);
    let score = 0;
    if (host.startsWith(q)) score += 100;
    else if (host.includes(q)) score += 60;
    if (title.startsWith(q)) score += 45;
    else if (title.includes(q)) score += 25;
    if (url.includes(q)) score += 10;
    if (item.favorite) score += 50;
    score += Math.min(30, item.visitCount * 3);
    const ageDays = item.lastVisitedAt ? (now - item.lastVisitedAt) / 86400000 : 999;
    if (ageDays < 1) score += 20;
    else if (ageDays < 7) score += 12;
    else if (ageDays < 30) score += 5;
    // Shorter URLs are usually the canonical page rather than a deep link.
    score -= Math.min(15, Math.floor(item.url.length / 40));

    scored.push({ url: item.url, title: item.title || item.url, favorite: item.favorite, score });
  }

  scored.sort((a, b) => b.score - a.score || a.url.length - b.url.length);
  return scored.slice(0, Math.max(0, limit));
}

module.exports = { rankSuggestions };
