import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { search, regionHasCategory, regionMatches, typesFor } from '../../src/lib/search.js';

const regions = raw.regions;
const byId = (id) => regions.find((r) => r.id === id);
const ids = (res) => [...new Set(res.map((m) => m.regionId))].sort();

describe('search', () => {
  it('returns [] for empty or whitespace queries', () => {
    expect(search(regions, '', 'all')).toEqual([]);
    expect(search(regions, '   ', 'all')).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(search(regions, 'SKYTREE', 'all')).toEqual(search(regions, 'skytree', 'all'));
    expect(search(regions, 'SKYTREE', 'all').length).toBe(2);
  });

  it('returns region, category and entry', () => {
    const [m] = search(regions, 'eruptuna', 'all');
    expect(m).toEqual({ regionId: 'moltana', category: 'fish', entry: expect.objectContaining({ name: 'Eruptuna' }) });
  });

  it('scopes to the category', () => {
    expect(search(regions, 'Oak', 'ore')).toEqual([]);
    expect(search(regions, 'Oak', 'trees').length).toBeGreaterThan(0);
  });

  it('"platinum" matches exactly sgg, moltana and scorchrock', () => {
    expect(ids(search(regions, 'platinum', 'all'))).toEqual(['moltana', 'scorchrock', 'sgg']);
  });

  it('searches "other" entries only under "all"', () => {
    expect(ids(search(regions, 'crops', 'all'))).toEqual(['viridia']);
    expect(search(regions, 'crops', 'trees')).toEqual([]);
  });

  it('with a type and no query returns every entry of that type', () => {
    const res = search(regions, '', 'ore', 'Platinum');
    expect(ids(res)).toEqual(['moltana', 'scorchrock', 'sgg']);
    expect(res.every((m) => m.entry.type === 'Platinum')).toBe(true);
  });

  it('combines type and query', () => {
    const res = search(regions, 'great', 'trees', 'Oak');
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((m) => m.entry.type === 'Oak' && /great/i.test(m.entry.name))).toBe(true);
  });
});

describe('regionHasCategory', () => {
  it('is always true for "all"', () => expect(regionHasCategory(byId('crickneck'), 'all')).toBe(true));
  it('reflects non-empty arrays', () => {
    expect(regionHasCategory(byId('moltana'), 'trees')).toBe(false);
    expect(regionHasCategory(byId('moltana'), 'fish')).toBe(true);
  });
  it('can require a type', () => {
    expect(regionHasCategory(byId('moltana'), 'ore', 'Platinum')).toBe(true);
    expect(regionHasCategory(byId('wingtip'), 'ore', 'Platinum')).toBe(false);
  });
});

describe('regionMatches', () => {
  it('matches query within category', () => {
    expect(regionMatches(byId('shroomhaven'), 'skytree', 'all')).toBe(true);
    expect(regionMatches(byId('shroomhaven'), 'skytree', 'fish')).toBe(false);
    expect(regionMatches(byId('wingtip'), 'skytree', 'all')).toBe(false);
  });
  it('matches by type alone', () => {
    expect(regionMatches(byId('egg'), '', 'fish', 'Eel')).toBe(true);
    expect(regionMatches(byId('wdd'), '', 'fish', 'Eel')).toBe(false);
  });
});

describe('typesFor', () => {
  it('lists types alphabetically with region counts', () => {
    const t = typesFor(regions, 'ore');
    expect(t.map((x) => x.type)).toEqual([...t.map((x) => x.type)].sort((a, b) => a.localeCompare(b)));
    expect(t.find((x) => x.type === 'Platinum')).toEqual({ type: 'Platinum', regions: 3 });
  });
  it('is empty for "all"', () => expect(typesFor(regions, 'all')).toEqual([]));
});
