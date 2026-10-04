import { RANKS } from './rank.js';

export const CATEGORIES = ['ore', 'trees', 'fish', 'other'];

export function validateRegions(data) {
  const seen = new Set();
  for (const r of data.regions) {
    if (seen.has(r.id)) throw new Error(`Duplicate region id "${r.id}"`);
    seen.add(r.id);
    for (const axis of ['x', 'y']) {
      const v = r.pin?.[axis];
      if (typeof v !== 'number' || v < 0 || v > 1)
        throw new Error(`Region "${r.id}": pin.${axis} must be a number in [0,1], got ${JSON.stringify(v)}`);
    }
    for (const cat of CATEGORIES) {
      if (!Array.isArray(r[cat])) throw new Error(`Region "${r.id}": category "${cat}" must be an array`);
      r[cat].forEach((e, i) => {
        if (typeof e?.name !== 'string' || !e.name)
          throw new Error(`Region "${r.id}": ${cat}[${i}] is missing a name`);
        if (typeof e.type !== 'string' || !e.type)
          throw new Error(`Region "${r.id}": "${e.name}" is missing a type`);
        if (typeof e.minRank !== 'string' || !RANKS.includes(e.minRank))
          throw new Error(`Region "${r.id}": "${e.name}" has invalid minRank "${e.minRank}"`);
      });
    }
  }
  return data;
}

export const loadRegions = (json) => validateRegions(json);
