'use strict';

const HOME_URL = 'https://start.duckduckgo.com/';
const SEARCH_PROVIDERS = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  ecosia: 'https://www.ecosia.org/search?q='
};

function isNavigableProtocol(protocol) {
  return protocol === 'http:' || protocol === 'https:' || protocol === 'about:' || protocol === 'data:' || protocol === 'blob:' || protocol === 'file:' || protocol === 'zeos:' || protocol === 'chrome:' || protocol === 'chrome-extension:';
}

function toNavigationTarget(input, searchProvider = 'duckduckgo') {
  const value = String(input ?? '').trim();
  if (!value) return { type: 'url', url: HOME_URL };

  // Explicit full URL protocol
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//u.test(value)) {
    try {
      const direct = new URL(value);
      if (isNavigableProtocol(direct.protocol)) return { type: 'url', url: direct.href };
    } catch {
      // Fall through to general resolution
    }
  }

  // Localhost resolution
  const isLocalHost = /^localhost(?::\d+)?(?:\/[^\s]*)?$/iu.test(value)
    || /^127(?:\.\d{1,3}){3}(?::\d+)?(?:\/[^\s]*)?$/u.test(value);

  if (isLocalHost) {
    try {
      return { type: 'url', url: new URL(`http://${value}`).href };
    } catch {
      // Fall through
    }
  }

  // Domain / IP address resolution:
  // Must not have spaces, must match a valid domain pattern (e.g. google.com, www.site.co.uk, sub.domain.org/path)
  // or an IPv4 address (e.g. 192.168.1.1:8080)
  const looksLikeDomain = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,24}(?::\d+)?(?:\/[^\s]*)?$/u.test(value)
    || /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/[^\s]*)?$/u.test(value)
    || /^www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(?:\/[^\s]*)?$/u.test(value);

  if (looksLikeDomain && !value.includes(' ')) {
    try {
      return { type: 'url', url: new URL(`https://${value}`).href };
    } catch {
      // An invalid address is treated as a search query.
    }
  }

  // Fallback: search query with the configured search provider
  const searchUrl = SEARCH_PROVIDERS[searchProvider] || SEARCH_PROVIDERS.duckduckgo;
  return { type: 'search', url: `${searchUrl}${encodeURIComponent(value)}` };
}

module.exports = { HOME_URL, SEARCH_PROVIDERS, toNavigationTarget };
