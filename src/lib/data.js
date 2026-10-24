import { RANKS } from './rank.js';

export const CATEGORIES = ['ore', 'trees', 'fish', 'monsters', 'other'];
export const TAGS = ['gold-crown', 'silver-crown', 'legendary', 'event', 'night', 'day', 'cave', 'mount'];
export const CONFIDENCE = ['confirmed', 'single-source', 'disputed'];
export const SPAWN_TYPES = ['overworld', 'tier-roll', 'roaming', 'legendary-event', 'area-challenge', 'fixed-boss', 'cave-or-fort'];
// Spawn types that aren't at one place (no spots), and where an absence means nothing.
export const NO_SPOT = ['overworld', 'tier-roll', 'roaming', 'legendary-event', 'area-challenge'];
export const NO_ABSENT = ['tier-roll', 'legendary-event', 'area-challenge'];
export const PRECISIONS = ['approx', 'exact'];
const unit = (v) => typeof v === 'number' && v >= 0 && v <= 1;
const MONSTER_FIELDS = { crown: ['gold', 'silver'], time: ['day', 'night'], sleeps: ['day', 'night'], nameStatus: ['probable', 'unofficial'] };
const OTHER_HALF = { day: 'night', night: 'day' };

function monsterType(m, a) {
  if (a.spawnType === 'legendary-event') return 'Legendary';
  if (a.spawnType === 'area-challenge') return 'Challenge';
  return { gold: 'Gold-crown boss', silver: 'Silver-crown' }[m.crown] ?? 'Common';
}

// A monster that only sleeps through the other half of the day is there all day, so it gets no day/night tag.
function monsterTags(m, a, type) {
  const time = a.time ?? m.time;
  return [
    type === 'Gold-crown boss' && 'gold-crown',
    type === 'Silver-crown' && 'silver-crown',
    type === 'Legendary' && 'legendary',
    type === 'Challenge' && 'event',
    time && m.sleeps !== OTHER_HALF[time] && time,
    /\bcave\b/i.test(a.where ?? '') && 'cave',
    m.mount && 'mount',
  ].filter(Boolean);
}

// Joins each region's monster appearances ({id, minRank, spawnType, ...}) with data.monsters[id].
// Returns a copy; the input is untouched.
export function expandMonsters(data) {
  for (const [id, m] of Object.entries(data.monsters ?? {}))
    for (const [k, allowed] of Object.entries(MONSTER_FIELDS))
      if (m[k] !== undefined && !allowed.includes(m[k])) throw new Error(`Monster "${id}" has invalid ${k} "${m[k]}"`);
  return {
    ...data,
    regions: data.regions.map((r) => !Array.isArray(r.monsters) ? r : {
      ...r,
      monsters: r.monsters.map((a) => {
        const m = data.monsters?.[a.id];
        if (!m) throw new Error(`Region "${r.id}": unknown monster "${a.id}"`);
        if (a.maxRank !== undefined && !/^[1-6]$/.test(a.maxRank)) throw new Error(`Region "${r.id}": "${m.name}" has invalid maxRank "${a.maxRank}"`);
        const { crown, time, mount, note, drops, ...rest } = m;
        const { time: _, ...appearance } = a;
        const type = monsterType(m, a);
        return {
          ...rest, ...appearance, type,
          tags: monsterTags(m, a, type),
          drops: a.drops ?? drops,
          note: [note, a.note].filter(Boolean).join(' ') || undefined,
        };
      }),
    }),
  };
}

export function validateRegions(data) {
  for (const k of ['width', 'height']) {
    const v = data.image?.[k];
    if (typeof v !== 'number' || v <= 0) throw new Error(`image.${k} must be a positive number, got ${JSON.stringify(v)}`);
  }
  const seen = new Set();
  const { regions } = expandMonsters(data);
  for (const r of regions) {
    if (seen.has(r.id)) throw new Error(`Duplicate region id "${r.id}"`);
    seen.add(r.id);
    for (const axis of ['x', 'y']) {
      const v = r.pin?.[axis];
      if (typeof v !== 'number' || v < 0 || v > 1)
        throw new Error(`Region "${r.id}": pin.${axis} must be a number in [0,1], got ${JSON.stringify(v)}`);
    }
    const places = new Set();
    for (const p of r.places ?? []) {
      if (typeof p?.name !== 'string' || !p.name.trim() || !unit(p.x) || !unit(p.y))
        throw new Error(`Region "${r.id}": each place needs a name and x/y in [0,1]`);
      if (places.has(p.name.toLowerCase())) throw new Error(`Region "${r.id}": duplicate place "${p.name}"`);
      places.add(p.name.toLowerCase());
    }
    const names = new Set();
    for (const cat of CATEGORIES) {
      if (!Array.isArray(r[cat])) throw new Error(`Region "${r.id}": category "${cat}" must be an array`);
      r[cat].forEach((e, i) => {
        if (typeof e?.name !== 'string' || !e.name)
          throw new Error(`Region "${r.id}": ${cat}[${i}] is missing a name`);
        if (typeof e.type !== 'string' || !e.type)
          throw new Error(`Region "${r.id}": "${e.name}" is missing a type`);
        if (typeof e.minRank !== 'string' || !RANKS.includes(e.minRank))
          throw new Error(`Region "${r.id}": "${e.name}" has invalid minRank "${e.minRank}"`);
        validateDetails(data, r, e, cat);
        if (names.has(e.name)) throw new Error(`Region "${r.id}": duplicate entry "${e.name}"`);
        names.add(e.name);
      });
    }
  }
  const merged = data.fieldNotesMerged ?? [];
  if (!Array.isArray(merged) || merged.some((id) => typeof id !== 'string') || new Set(merged).size !== merged.length)
    throw new Error('fieldNotesMerged must be a list of unique note ids');
  for (const cat of CATEGORIES) {
    const order = data.typeOrder?.[cat];
    if (!Array.isArray(order)) throw new Error(`typeOrder.${cat} must be an array`);
    const used = new Set(regions.flatMap((r) => r[cat].map((e) => e.type)));
    for (const t of used) if (!order.includes(t)) throw new Error(`typeOrder.${cat} is missing type "${t}"`);
    for (const t of order) if (!used.has(t)) throw new Error(`typeOrder.${cat} lists "${t}", which no entry uses`);
  }
  return data;
}

function validateDetails(data, r, e, cat) {
  const where = `Region "${r.id}": "${e.name}"`;
  if (e.spawnType !== undefined && !SPAWN_TYPES.includes(e.spawnType)) throw new Error(`${where} has unknown spawnType "${e.spawnType}"`);
  if (e.shadow !== undefined && (cat !== 'fish' || !['big', 'small'].includes(e.shadow))) throw new Error(`${where} has invalid shadow "${e.shadow}" (fish only: big or small)`);
  if (e.confidence !== undefined && !CONFIDENCE.includes(e.confidence)) throw new Error(`${where} has invalid confidence "${e.confidence}"`);
  for (const src of e.sources ?? []) if (!data.sources?.[src]) throw new Error(`${where} cites undefined source "${src}"`);
  for (const t of e.tags ?? []) if (!TAGS.includes(t)) throw new Error(`${where} has unknown tag "${t}"`);
  for (const sp of e.spots ?? []) {
    if (!unit(sp?.x) || !unit(sp?.y) || !PRECISIONS.includes(sp.precision) || !Array.isArray(sp.sources) || sp.sources.some((k) => !data.sources?.[k]))
      throw new Error(`${where} has an invalid spot (x/y in [0,1], precision approx or exact, defined sources)`);
  }
  if (e.spots?.length && NO_SPOT.includes(e.spawnType)) throw new Error(`${where} has a spot, but ${e.spawnType} spawns aren't at one place`);
  for (const d of e.drops ?? []) {
    if (typeof d?.name !== 'string' || !d.name || typeof d.official !== 'boolean')
      throw new Error(`${where} has a drop without an English name and official flag`);
  }
}

export const loadRegions = (json) => expandMonsters(validateRegions(json));
