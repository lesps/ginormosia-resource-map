import { rankOrder } from './rank.js';

const SEARCHABLE = { all: ['ore', 'trees', 'fish', 'boss', 'other'], ore: ['ore'], trees: ['trees'], fish: ['fish'], boss: ['boss'] };

const cats = (category) => SEARCHABLE[category] ?? [category];

export function search(regions, query, category, type = null) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q && !type) return [];
  const out = [];
  for (const region of regions)
    for (const c of cats(category))
      for (const entry of region[c] ?? [])
        if (!type || entry.type === type) {
          if (!q || entry.name.toLowerCase().includes(q) || entry.nameJa?.includes(q)) out.push({ regionId: region.id, category: c, entry });
          else {
            const drops = entry.drops ?? [];
            const drop = drops.find((d) => d.name.toLowerCase() === q) ?? drops.find((d) => d.name.toLowerCase().includes(q) || d.ja?.includes(q));
            if (drop) out.push({ regionId: region.id, category: c, entry, drop });
          }
        }
  return out;
}

export function regionHasCategory(region, category, type = null) {
  if (category === 'all') return true;
  const list = region[category] ?? [];
  return type ? list.some((e) => e.type === type) : list.length > 0;
}

export const regionMatches = (region, query, category, type = null) =>
  search([region], query, category, type).length > 0;

// Ordered by `order` (the game's tiers, from data.typeOrder); alphabetical without one.
export function typesFor(regions, category, order = []) {
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
    .sort((a, b) => {
      const ia = order.indexOf(a.type), ib = order.indexOf(b.type);
      return (ia < 0) - (ib < 0) || ia - ib || a.type.localeCompare(b.type);
    });
}

export const entryKey = (entry) => entry.name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
