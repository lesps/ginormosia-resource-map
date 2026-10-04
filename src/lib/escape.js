const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => MAP[c]);

export function highlight(text, query) {
  const s = String(text);
  const q = (query ?? '').trim();
  const i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return escapeHtml(s);
  return escapeHtml(s.slice(0, i)) + '<mark>' + escapeHtml(s.slice(i, i + q.length)) + '</mark>' + escapeHtml(s.slice(i + q.length));
}
