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

export function typesFor(regions, category) {
  if (category === 'all') return [];
  const counts = new Map();
  for (const r of regions) for (const t of new Set((r[category] ?? []).map((e) => e.type))) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([type, n]) => ({ type, regions: n })).sort((a, b) => a.type.localeCompare(b.type));
}
