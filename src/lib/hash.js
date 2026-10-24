export function toHash({ category, type, query, selectedId, openKey }) {
  const p = new URLSearchParams();
  if (category && category !== 'all') p.set('cat', category);
  if (type) p.set('type', type);
  if (query?.trim()) p.set('q', query);
  if (selectedId) p.set('r', selectedId);
  if (selectedId && openKey) p.set('e', openKey);
  const s = p.toString();
  return s ? `#${s}` : '';
}

export function fromHash(hash, { categories, regionIds, types, entries = {} }) {
  const p = new URLSearchParams(String(hash ?? '').replace(/^#/, ''));
  const cat = p.get('cat') === 'boss' ? 'monsters' : p.get('cat'); // bosses folded into monsters in data v4
  const category = categories.includes(cat) ? cat : 'all';
  const type = types[category]?.includes(p.get('type')) ? p.get('type') : null;
  const selectedId = regionIds.includes(p.get('r')) ? p.get('r') : null;
  const openKey = selectedId && entries[selectedId]?.includes(p.get('e')) ? p.get('e') : null;
  return { category, type, query: p.get('q') ?? '', selectedId, openKey };
}
