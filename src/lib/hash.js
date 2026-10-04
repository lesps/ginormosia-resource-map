export function toHash({ category, type, query, selectedId }) {
  const p = new URLSearchParams();
  if (category && category !== 'all') p.set('cat', category);
  if (type) p.set('type', type);
  if (query?.trim()) p.set('q', query);
  if (selectedId) p.set('r', selectedId);
  const s = p.toString();
  return s ? `#${s}` : '';
}

export function fromHash(hash, { categories, regionIds, types }) {
  const p = new URLSearchParams(String(hash ?? '').replace(/^#/, ''));
  const category = categories.includes(p.get('cat')) ? p.get('cat') : 'all';
  const type = types[category]?.includes(p.get('type')) ? p.get('type') : null;
  const selectedId = regionIds.includes(p.get('r')) ? p.get('r') : null;
  return { category, type, query: p.get('q') ?? '', selectedId };
}
