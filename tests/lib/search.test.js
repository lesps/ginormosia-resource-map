import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { search, searchPlaces, sortMatches, regionHasCategory, regionMatches, typesFor, entryKey, isCommonMonster } from '../../src/lib/search.js';
import { loadRegions } from '../../src/lib/data.js';

const { regions } = loadRegions(raw);
const byId = (id) => regions.find((r) => r.id === id);
const ids = (res) => [...new Set(res.map((m) => m.regionId))].sort();

describe('search', () => {
  it('returns [] for empty or whitespace queries', () => {
    expect(search(regions, { query: '', category: 'all' })).toEqual([]);
    expect(search(regions, { query: '   ', category: 'all' })).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(search(regions, { query: 'SKYTREE', category: 'all' })).toEqual(search(regions, { query: 'skytree', category: 'all' }));
    expect(search(regions, { query: 'SKYTREE', category: 'all' }).length).toBe(2);
  });

  it('returns region, category and entry', () => {
    const [m] = search(regions, { query: 'eruptuna', category: 'all' });
    expect(m).toEqual({ regionId: 'moltana', category: 'fish', via: 'name', entry: expect.objectContaining({ name: 'Eruptuna' }) });
  });

  it('scopes to the category', () => {
    expect(search(regions, { query: 'Oak', category: 'ore' })).toEqual([]);
    expect(search(regions, { query: 'Oak', category: 'trees' }).length).toBeGreaterThan(0);
  });

  it('"platinum" matches exactly sgg, moltana and scorchrock', () => {
    expect(ids(search(regions, { query: 'platinum', category: 'all' }))).toEqual(['moltana', 'scorchrock', 'sgg']);
  });

  it('searches "other" entries only under "all"', () => {
    expect(ids(search(regions, { query: 'crops', category: 'all' }))).toEqual(['viridia']);
    expect(search(regions, { query: 'crops', category: 'trees' })).toEqual([]);
  });

  it('with a type and no query returns every entry of that type', () => {
    const res = search(regions, { query: '', category: 'ore', type: 'Platinum' });
    expect(ids(res)).toEqual(['moltana', 'scorchrock', 'sgg']);
    expect(res.every((m) => m.entry.type === 'Platinum')).toBe(true);
  });

  it('combines type and query', () => {
    const res = search(regions, { query: 'great', category: 'trees', type: 'Oak' });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((m) => m.entry.type === 'Oak' && /great/i.test(m.entry.name))).toBe(true);
  });
});

describe('search over details', () => {
  it('finds monsters under "all" and "monsters"', () => {
    expect(ids(search(regions, { query: 'napdragon', category: 'all' }))).toContain('wgg');
    expect(search(regions, { query: 'napdragon', category: 'monsters' }).every((m) => m.category === 'monsters')).toBe(true);
    expect(search(regions, { query: 'napdragon', category: 'ore' }).every((m) => m.drop)).toBe(true);
  });

  it('finds monsters by drop and by type', () => {
    const fleece = search(regions, { query: "sheep king's fleece", category: 'monsters' });
    expect(fleece.map((m) => [m.regionId, m.entry.name])).toEqual([['wgg', 'King Woolie']]);
    expect(ids(search(regions, { query: '', category: 'monsters', type: 'Legendary' }))).toEqual(['crickneck', 'drakeseye', 'drakesnout']);
  });

  it('matches drop names and reports which drop matched', () => {
    const res = search(regions, { query: 'ruby', category: 'all' });
    const claw = res.find((m) => m.entry.name === "Dragon's Claw");
    expect(claw.regionId).toBe('scorchrock');
    expect(claw.drop.name).toBe('Ruby');
  });

  it('does not report a drop when the name itself matches', () => {
    const [m] = search(regions, { query: 'golden swordfish', category: 'all' });
    expect(m.drop).toBeUndefined();
  });

  it('matches Japanese names', () => {
    expect(search(regions, { query: '白金', category: 'ore' }).map((m) => m.entry.name)).toContain('Platinum Deposit');
  });
});

describe('entryKey', () => {
  it('slugs names', () => {
    expect(entryKey({ name: "Dragon's Claw" })).toBe('dragons-claw');
    expect(entryKey({ name: 'Oak / Great Oak Tree' })).toBe('oak-great-oak-tree');
  });
});

describe('isCommonMonster', () => {
  it('is true only for a common monster key in that region', () => {
    expect(isCommonMonster(byId('crickneck'), 'white-woolie')).toBe(true);
    expect(isCommonMonster(byId('crickneck'), 'mimic')).toBe(false);
    expect(isCommonMonster(byId('crickneck'), 'gold-deposit')).toBe(false);
    expect(isCommonMonster(undefined, 'white-woolie')).toBe(false);
  });
});

describe('regionHasCategory', () => {
  it('is always true for "all"', () => expect(regionHasCategory(byId('crickneck'), { category: 'all' })).toBe(true));
  it('reflects non-empty arrays', () => {
    expect(regionHasCategory(byId('moltana'), { category: 'trees' })).toBe(false);
    expect(regionHasCategory(byId('moltana'), { category: 'fish' })).toBe(true);
  });
  it('can require a type', () => {
    expect(regionHasCategory(byId('moltana'), { category: 'ore', type: 'Platinum' })).toBe(true);
    expect(regionHasCategory(byId('wingtip'), { category: 'ore', type: 'Platinum' })).toBe(false);
  });
});

describe('regionMatches', () => {
  it('matches query within category', () => {
    expect(regionMatches(byId('shroomhaven'), { query: 'skytree', category: 'all' })).toBe(true);
    expect(regionMatches(byId('shroomhaven'), { query: 'skytree', category: 'fish' })).toBe(false);
    expect(regionMatches(byId('wingtip'), { query: 'skytree', category: 'all' })).toBe(false);
  });
  it('matches by type alone', () => {
    expect(regionMatches(byId('egg'), { query: '', category: 'fish', type: 'Eel' })).toBe(true);
    expect(regionMatches(byId('wdd'), { query: '', category: 'fish', type: 'Eel' })).toBe(false);
  });
});

describe('typesFor', () => {
  const order = raw.typeOrder;

  it('reports region count and earliest rank per type', () => {
    expect(typesFor(regions, 'ore', order.ore).find((x) => x.type === 'Platinum')).toEqual({ type: 'Platinum', regions: 3, minRank: '1' });
  });

  it.each(['ore', 'trees', 'fish', 'monsters'])('follows the game tier order in typeOrder.%s', (cat) => {
    const t = typesFor(regions, cat, order[cat]).map((x) => x.type);
    expect(t).toEqual(order[cat]);
  });

  it('puts copper before iron before silver before gold before platinum', () => {
    const ore = typesFor(regions, 'ore', order.ore).map((x) => x.type);
    const idx = ['Copper', 'Iron', 'Silver', 'Gold', 'Platinum'].map((t) => ore.indexOf(t));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });

  it('falls back to alphabetical without an order', () => {
    const t = typesFor(regions, 'fish').map((x) => x.type);
    expect(t).toEqual([...t].sort((a, b) => a.localeCompare(b)));
  });

  it('is empty for "all"', () => expect(typesFor(regions, 'all')).toEqual([]));
});

describe('search over places, locations and challenges', () => {
  const via = (res) => res.map((m) => `${m.regionId}/${m.entry.name}:${m.via}`).sort();
  const places = (q) => searchPlaces(regions, q).map((p) => `${p.regionId}:${p.via}`).sort();

  it('"agekara" finds 7 spawns by location, 1 by note, and 2 places', () => {
    expect(via(search(regions, { query: 'agekara' }))).toEqual([
      'moltana/Fiery Panther:note', 'moltana/King Cobra:where', 'moltana/Platinum Deposit:where', 'moltana/Pyro Panther:where',
      'moltana/Superior Red Ore Deposit:where', 'scorchrock/Amazing Red Ore Deposit:where', "scorchrock/Dragon's Claw:where", 'scorchrock/Pyro Panther:where',
    ]);
    expect(places('agekara')).toEqual(['moltana:landmark', 'scorchrock:landmark']);
    expect(searchPlaces(regions, 'agekara').find((p) => p.regionId === 'scorchrock').text).toBe('Agekara Cave (west half)');
  });

  it('"glittering" finds the 7 Goliath appearances by challenge and no places', () => {
    const res = search(regions, { query: 'glittering' });
    expect(res).toHaveLength(7);
    expect(res.every((m) => m.entry.name === 'Goliath' && m.via === 'conditions')).toBe(true);
    expect(places('glittering')).toEqual([]);
  });

  it('"moltana" finds the region and one note', () => {
    expect(places('moltana')).toEqual(['moltana:region']);
    expect(via(search(regions, { query: 'moltana' }))).toEqual(['scorchrock/Pyro Panther:note']);
  });

  it.each([['fort gardhart', 'wgg', 8], ['wyrm maw', 'fangshore', 7]])('"%s" finds one place and %s spawns by location', (q, region, n) => {
    expect(places(q)).toEqual([`${region}:landmark`]);
    const res = search(regions, { query: q });
    expect(res).toHaveLength(n);
    expect(res.every((m) => m.via === 'where' && m.regionId === region)).toBe(true);
  });

  it('matches towers', () => {
    expect(places("googlisha's")).toEqual(['moltana:tower']);
  });

  it('only matches the new fields from 3 characters', () => {
    expect(search(regions, { query: 'ag' }).every((m) => m.via === 'name' || m.via === 'drop')).toBe(true);
    expect(searchPlaces(regions, 'ag')).toEqual([]);
  });

  it('sorts name matches above location matches, then by rank', () => {
    const sorted = sortMatches(search(regions, { query: 'panther' }));
    const vias = sorted.map((m) => m.via);
    expect(vias.indexOf('where')).toBeGreaterThan(vias.lastIndexOf('name'));
    expect(sorted.find((m) => m.via === 'where').entry.name).toBe('Superior Red Ore Deposit');
  });
});

describe('search by tag', () => {
  it('lists every mount-dropping appearance', () => {
    const res = search(regions, { tag: 'mount' });
    expect(res).toHaveLength(23);
    expect(ids(res)).toHaveLength(12);
    expect(res.every((m) => m.entry.tags.includes('mount'))).toBe(true);
  });

  it('combines a tag with a query and a category', () => {
    expect(search(regions, { query: 'woolie', tag: 'mount' }).map((m) => m.entry.name)).toEqual(expect.arrayContaining(['King Woolie', 'White Woolie']));
    expect(search(regions, { category: 'ore', tag: 'mount' })).toEqual([]);
  });

  it('feeds regionHasCategory and regionMatches', () => {
    expect(regionHasCategory(byId('wgg'), { category: 'all', tag: 'mount' })).toBe(true);
    expect(regionMatches(byId('wgg'), { tag: 'mount' })).toBe(true);
    expect(regionMatches(byId('moltana'), { tag: 'mount' })).toBe(false);
  });
});
