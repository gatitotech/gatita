(function (root) {
  function safeAccountRedirect(value, origin) {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    try {
      const destination = new URL(candidate, origin);
      if (destination.username || destination.password) return '';
      if (destination.origin === origin && candidate.startsWith('/') && !candidate.startsWith('//')) {
        return destination.pathname + destination.search + destination.hash;
      }
      if (destination.origin === 'https://search.gatita.tech') return destination.href;
    } catch (_) {}
    return '';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { safeAccountRedirect };
  else root.GatitaSessionLinks = { safeAccountRedirect };
})(typeof window !== 'undefined' ? window : this);
