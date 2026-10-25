import { rankOrder } from './rank.js';

const SEARCHABLE = { all: ['ore', 'trees', 'fish', 'monsters', 'other'] };

const cats = (category) => SEARCHABLE[category] ?? [category];

// Where a match came from, best first. Location, challenge and note text need 3+ characters.
export const VIA = ['name', 'drop', 'where', 'conditions', 'note'];
const DETAIL = ['where', 'conditions', 'note'];
const MIN_DETAIL = 3;

function matchEntry(entry, q) {
  if (entry.name.toLowerCase().includes(q) || entry.nameJa?.includes(q)) return { via: 'name' };
  const drops = entry.drops ?? [];
  const drop = drops.find((d) => d.name.toLowerCase() === q) ?? drops.find((d) => d.name.toLowerCase().includes(q) || d.ja?.includes(q));
  if (drop) return { via: 'drop', drop };
  if (q.length < MIN_DETAIL) return null;
  const via = DETAIL.find((k) => entry[k]?.toLowerCase().includes(q));
  return via ? { via } : null;
}

export function search(regions, { query = '', category = 'all', type = null, tag = null } = {}) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q && !type && !tag) return [];
  const out = [];
  for (const region of regions)
    for (const c of cats(category))
      for (const entry of region[c] ?? []) {
        if ((type && entry.type !== type) || (tag && !entry.tags?.includes(tag))) continue;
        const m = q ? matchEntry(entry, q) : { via: 'name' };
        if (m) out.push({ regionId: region.id, category: c, entry, ...m });
      }
  return out;
}

export const sortMatches = (matches) => matches
  .map((m, i) => ({ m, i }))
  .sort((a, b) => VIA.indexOf(a.m.via) - VIA.indexOf(b.m.via) || rankOrder(a.m.entry.minRank) - rankOrder(b.m.entry.minRank) || a.i - b.i)
  .map(({ m }) => m);

// Regions whose name, tower or a landmark matches; one row per region (alphabetical), with the text that matched.
export function searchPlaces(regions, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (q.length < MIN_DETAIL) return [];
  const out = [];
  for (const r of regions.slice().sort((a, b) => a.name.localeCompare(b.name))) {
    if (r.name.toLowerCase().includes(q) || r.nameJa?.includes(q)) out.push({ regionId: r.id, via: 'region', text: r.name });
    else if (r.tower?.toLowerCase().includes(q)) out.push({ regionId: r.id, via: 'tower', text: r.tower });
    else {
      const l = r.landmarks?.find((x) => x.toLowerCase().includes(q));
      if (l) out.push({ regionId: r.id, via: 'landmark', text: l });
    }
  }
  return out;
}

export function regionHasCategory(region, { category = 'all', type = null, tag = null } = {}) {
  if (category === 'all' && !type && !tag) return true;
  return cats(category).some((c) => (region[c] ?? []).some((e) => (!type || e.type === type) && (!tag || e.tags?.includes(tag))));
}

export const regionMatches = (region, filter) => search([region], filter).length > 0;

// Tags in use, in `order`, with how many regions have each.
export function tagsFor(regions, order) {
  return order
    .map((tag) => ({ tag, regions: regions.filter((r) => regionHasCategory(r, { tag })).length }))
    .filter((t) => t.regions);
}

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

export const isCommonMonster = (region, key) => !!region?.monsters?.some((e) => e.type === 'Common' && entryKey(e) === key);

export const findEntry = (region, key) => (key && region ? SEARCHABLE.all.flatMap((c) => region[c] ?? []).find((e) => entryKey(e) === key) : undefined);
