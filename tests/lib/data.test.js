import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { loadRegions, validateRegions } from '../../src/lib/data.js';

const clone = () => structuredClone(raw);

describe('regions.json', () => {
  it('passes validation and has exactly 15 regions', () => {
    const data = loadRegions(raw);
    expect(data.regions).toHaveLength(15);
  });

  it('gives every entry a type', () => {
    const data = loadRegions(raw);
    for (const r of data.regions)
      for (const c of data.categories)
        for (const e of r[c]) expect(typeof e.type, `${r.id}/${e.name}`).toBe('string');
  });
});

describe('monsters', () => {
  const data = loadRegions(raw);
  const m = (regionId, name) => data.regions.find((r) => r.id === regionId).monsters.find((e) => e.name === name);

  it('replaces the boss category with monsters on every region', () => {
    for (const r of raw.regions) {
      expect(Array.isArray(r.monsters), r.id).toBe(true);
      expect(r.boss, r.id).toBeUndefined();
    }
    expect(raw.categories).toEqual(['ore', 'trees', 'fish', 'monsters', 'other']);
  });

  it('stores each monster once and joins it onto its appearances at load', () => {
    expect(raw.regions.find((r) => r.id === 'drakesnout').monsters.find((a) => a.id === 'pandoras-box').name).toBeUndefined();
    const box = m('drakesnout', "Pandora's Box");
    expect(box).toMatchObject({ id: 'pandoras-box', type: 'Silver-crown', minRank: '1', where: 'Nostruul Cave', element: 'Dark', aggressive: false });
    expect(box.tags).toEqual(['silver-crown', 'cave']);
    expect(box.drops.map((d) => d.name)).toContain('Sack of Gold');
  });

  it('derives the type from the spawn type and crown', () => {
    expect(m('crickneck', 'Legendary Don Woolie').type).toBe('Legendary');
    expect(m('scorchrock', 'Goliath').type).toBe('Challenge');
    expect(m('scorchrock', 'Napdragon').type).toBe('Challenge');
    expect(m('wgg', 'Napdragon').type).toBe('Gold-crown boss');
    expect(m('wgg', 'White Woolie').type).toBe('Common');
  });

  it('derives tags: crown only for its own type, time unless the monster just sleeps then, mount', () => {
    expect(m('scorchrock', 'Napdragon').tags).toEqual(['event']);
    expect(m('moltana', 'Pyro Panther').tags).toEqual(['gold-crown', 'night', 'cave']);
    expect(m('sgg', 'Red Wolf').tags).toEqual(['night']);
    expect(m('viridia', 'Hill Spider').tags).toEqual([]);
    expect(m('wgg', 'Tortortoise').tags).toEqual(['mount']);
  });

  it('lets an appearance override the drops and adds its own note', () => {
    expect(m('wgg', 'Big Spooky').drops).toEqual([]);
    expect(m('wdd', 'Big Spooky').drops.length).toBeGreaterThan(0);
    expect(m('wgg', 'Big Spooky').note).toMatch(/drop nothing/);
  });

  it('rejects an appearance of an undefined monster', () => {
    const d = clone();
    d.regions[0].monsters[0].id = 'nessie';
    expect(() => validateRegions(d)).toThrow(/drakeseye.*unknown monster "nessie"/);
  });

  it('rejects an invalid crown, time or maxRank', () => {
    const d = clone();
    d.monsters.mimic.crown = 'bronze';
    expect(() => validateRegions(d)).toThrow(/mimic.*crown "bronze"/);
    const e = clone();
    e.monsters.mimic.sleeps = 'noon';
    expect(() => validateRegions(e)).toThrow(/mimic.*sleeps "noon"/);
    const f = clone();
    f.regions[0].monsters[0].maxRank = 'top';
    expect(() => validateRegions(f)).toThrow(/maxRank "top"/);
  });

  it('orders type chips bosses first: Gold-crown boss, Silver-crown, Legendary, Challenge, Common', () => {
    expect(raw.typeOrder.monsters).toEqual(['Gold-crown boss', 'Silver-crown', 'Legendary', 'Challenge', 'Common']);
  });
});

describe('validateRegions', () => {
  it('rejects duplicate ids', () => {
    const d = clone();
    d.regions[1].id = d.regions[0].id;
    expect(() => validateRegions(d)).toThrow(/duplicate region id "drakeseye"/i);
  });

  it.each([
    ['x', -0.01],
    ['x', 1.01],
    ['y', 2],
    ['y', 'a'],
  ])('rejects pin %s = %s', (axis, v) => {
    const d = clone();
    d.regions[2].pin[axis] = v;
    expect(() => validateRegions(d)).toThrow(new RegExp(`fangshore.*pin\\.${axis}`));
  });

  it('rejects an unknown minRank', () => {
    const d = clone();
    d.regions[0].ore[0].minRank = '9';
    expect(() => validateRegions(d)).toThrow(/drakeseye.*Gold Deposit.*minRank "9"/);
  });

  it('rejects a numeric minRank', () => {
    const d = clone();
    d.regions[0].ore[0].minRank = 1;
    expect(() => validateRegions(d)).toThrow(/minRank/);
  });

  it('rejects a missing category key', () => {
    const d = clone();
    delete d.regions[3].fish;
    expect(() => validateRegions(d)).toThrow(/crickneck.*"fish".*array/);
  });

  it('rejects a category that is not an array', () => {
    const d = clone();
    d.regions[3].trees = {};
    expect(() => validateRegions(d)).toThrow(/crickneck.*"trees".*array/);
  });

  it('rejects an entry without a name', () => {
    const d = clone();
    delete d.regions[0].trees[0].name;
    expect(() => validateRegions(d)).toThrow(/drakeseye.*trees\[0\].*name/);
  });

  it('rejects an entry without a type', () => {
    const d = clone();
    delete d.regions[0].trees[0].type;
    expect(() => validateRegions(d)).toThrow(/drakeseye.*Oak Tree.*type/);
  });

  it('rejects a type missing from typeOrder', () => {
    const d = clone();
    d.typeOrder.ore = d.typeOrder.ore.filter((t) => t !== 'Platinum');
    expect(() => validateRegions(d)).toThrow(/typeOrder\.ore.*"Platinum"/);
  });

  it('rejects a typeOrder entry no data uses', () => {
    const d = clone();
    d.typeOrder.fish.push('Kraken');
    expect(() => validateRegions(d)).toThrow(/typeOrder\.fish.*"Kraken"/);
  });

  it.each([['width', 0], ['height', 'x']])('rejects image %s = %s', (k, v) => {
    const d = clone();
    d.image[k] = v;
    expect(() => validateRegions(d)).toThrow(new RegExp(`image\\.${k}`));
  });

  it('rejects an unknown confidence', () => {
    const d = clone();
    d.regions[0].ore[0].confidence = 'probably';
    expect(() => validateRegions(d)).toThrow(/confidence "probably"/);
  });

  it('rejects a source key that is not defined', () => {
    const d = clone();
    d.regions[0].ore[0].sources = ['nowhere'];
    expect(() => validateRegions(d)).toThrow(/source "nowhere"/);
  });

  it('rejects an unknown tag', () => {
    const d = clone();
    d.regions[0].ore[0].tags = ['shiny'];
    expect(() => validateRegions(d)).toThrow(/tag "shiny"/);
  });

  it('rejects a drop without an English name or official flag', () => {
    const d = clone();
    const e = d.regions.flatMap((r) => ['ore', 'trees', 'fish'].flatMap((c) => r[c])).find((x) => x.drops);
    e.drops[0] = { ja: '石' };
    expect(() => validateRegions(d)).toThrow(/drop/);
  });

  it('rejects duplicate entry names within a region', () => {
    const d = clone();
    d.regions[0].ore.push({ ...d.regions[0].ore[0] });
    expect(() => validateRegions(d)).toThrow(/duplicate entry/i);
  });

  it('rejects an unknown spawnType', () => {
    const d = clone();
    d.regions[0].ore[0].spawnType = 'teleporting';
    expect(() => validateRegions(d)).toThrow(/spawnType "teleporting"/);
  });

  it('rejects a shadow on a non-fish or an unknown size', () => {
    const d = clone();
    d.regions[0].ore[0].shadow = 'big';
    expect(() => validateRegions(d)).toThrow(/shadow/);
    const e = clone();
    e.regions.find((r) => r.fish.length).fish[0].shadow = 'huge';
    expect(() => validateRegions(e)).toThrow(/shadow/);
  });

  it('accepts rank 6', () => {
    const d = clone();
    d.regions[0].ore[0].minRank = '6';
    expect(() => validateRegions(d)).not.toThrow();
  });

  it('keeps Japanese text only in nameJa and drop ja fields', () => {
    const JP = /[\u3040-\u30ff\u4e00-\u9fff]/;
    const bad = [];
    const walk = (o, path) => {
      if (typeof o === 'string') { if (JP.test(o) && !/\.(nameJa|ja)$/.test(path)) bad.push(path); }
      else if (o && typeof o === 'object') for (const k in o) walk(o[k], `${path}.${k}`);
    };
    walk(raw, '');
    expect(bad).toEqual([]);
  });

  it('returns the data object from validateRegions, and an expanded copy from loadRegions', () => {
    const d = clone();
    expect(validateRegions(d)).toBe(d);
    const loaded = loadRegions(d);
    expect(loaded).not.toBe(d);
    expect(d).toEqual(raw);
  });
});
