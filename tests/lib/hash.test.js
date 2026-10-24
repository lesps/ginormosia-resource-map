import { describe, it, expect } from 'vitest';
import { toHash, fromHash } from '../../src/lib/hash.js';

const valid = { categories: ['all', 'ore', 'trees', 'fish', 'monsters'], regionIds: ['moltana'], types: { ore: ['Platinum'] }, entries: { moltana: ['golemstone'] } };

describe('hash state', () => {
  it('round-trips', () => {
    const s = { category: 'ore', type: 'Platinum', tag: null, query: 'great plat', selectedId: 'moltana', openKey: 'golemstone' };
    expect(fromHash(toHash(s), valid)).toEqual(s);
  });
  it('omits defaults', () => {
    expect(toHash({ category: 'all', type: null, query: '', selectedId: null, openKey: null })).toBe('');
  });
  it('drops invalid values', () => {
    expect(fromHash('#cat=lava&type=Nope&r=atlantis&q=x', valid)).toEqual({ category: 'all', type: null, tag: null, query: 'x', selectedId: null, openKey: null });
    expect(fromHash('#r=moltana&e=nope', valid).openKey).toBeNull();
    expect(fromHash('#e=golemstone', valid).openKey).toBeNull();
    expect(fromHash('#cat=trees&type=Platinum', valid).type).toBeNull();
  });
  it('round-trips a tag under All only', () => {
    expect(toHash({ category: 'all', tag: 'mount' })).toBe('#tag=mount');
    expect(fromHash('#tag=mount', valid).tag).toBe('mount');
    expect(fromHash('#cat=ore&tag=mount', valid).tag).toBeNull();
    expect(fromHash('#tag=shiny', valid).tag).toBeNull();
  });
  it('maps the old boss category to monsters', () => {
    expect(fromHash('#cat=boss&type=Field%20boss', valid)).toMatchObject({ category: 'monsters', type: null });
  });
});
