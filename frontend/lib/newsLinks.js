export function newsSearchHref(query) {
  const q = String(query || '').trim();
  if (!q) return '/news';
  return `/news?q=${encodeURIComponent(q)}`;
}
