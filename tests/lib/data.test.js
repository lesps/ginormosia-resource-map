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
    for (const r of raw.regions)
      for (const c of raw.categories)
        for (const e of r[c]) expect(typeof e.type, `${r.id}/${e.name}`).toBe('string');
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
    d.regions[0].ore[0].minRank = '6';
    expect(() => validateRegions(d)).toThrow(/drakeseye.*Gold Deposit.*minRank "6"/);
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

  it('returns the data object from loadRegions', () => {
    const d = clone();
    expect(loadRegions(d)).toBe(d);
  });
});
