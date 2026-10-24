const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => MAP[c]);

export function highlight(text, query) {
  const s = String(text);
  const q = (query ?? '').trim();
  const i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return escapeHtml(s);
  return escapeHtml(s.slice(0, i)) + '<mark>' + escapeHtml(s.slice(i, i + q.length)) + '</mark>' + escapeHtml(s.slice(i + q.length));
}

// A window of at most `max` characters around the first match, cut at word boundaries, with … where text was cut.
export function excerpt(text, query, max = 50) {
  const s = String(text);
  const q = (query ?? '').trim().toLowerCase();
  const i = q ? s.toLowerCase().indexOf(q) : -1;
  if (s.length <= max || i < 0) return s;
  let start = Math.max(0, Math.min(i - Math.floor((max - q.length) / 3), s.length - max));
  const space = start > 0 ? s.indexOf(' ', start) : -1;
  if (space >= 0 && space < i) start = space + 1;
  let end = Math.min(s.length, start + max);
  if (end < s.length) end = Math.max(s.lastIndexOf(' ', end), i + q.length);
  return `${start > 0 ? '…' : ''}${s.slice(start, end).trim()}${end < s.length ? '…' : ''}`;
}
