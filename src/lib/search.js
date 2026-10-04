import { rankOrder } from './rank.js';

const SEARCHABLE = { all: ['ore', 'trees', 'fish', 'other'], ore: ['ore'], trees: ['trees'], fish: ['fish'] };

const cats = (category) => SEARCHABLE[category] ?? [category];

export function search(regions, query, category, type = null) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q && !type) return [];
  const out = [];
  for (const region of regions)
    for (const c of cats(category))
      for (const entry of region[c] ?? [])
        if ((!type || entry.type === type) && (!q || entry.name.toLowerCase().includes(q)))
          out.push({ regionId: region.id, category: c, entry });
  return out;
}

export function regionHasCategory(region, category, type = null) {
  if (category === 'all') return true;
  const list = region[category] ?? [];
  return type ? list.some((e) => e.type === type) : list.length > 0;
}

export const regionMatches = (region, query, category, type = null) =>
  search([region], query, category, type).length > 0;

// Most common first: earliest spawn rank, then more regions, then name.
export function typesFor(regions, category) {
  if (category === 'all') return [];
  const byType = new Map();
  for (const r of regions) {
    for (const e of r[category] ?? []) {
      const t = byType.get(e.type) ?? { type: e.type, ids: new Set(), minRank: e.minRank };
      t.ids.add(r.id);
      if (rankOrder(e.minRank) < rankOrder(t.minRank)) t.minRank = e.minRank;
      byType.set(e.type, t);
    }
  }
  return [...byType.values()]
    .map(({ type, ids, minRank }) => ({ type, regions: ids.size, minRank }))
    .sort((a, b) => rankOrder(a.minRank) - rankOrder(b.minRank) || b.regions - a.regions || a.type.localeCompare(b.type));
}
