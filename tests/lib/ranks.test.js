import { describe, it, expect } from 'vitest';
import { MAX_RANK, lowestRank, availability, sanitizeRanks } from '../../src/lib/ranks.js';
import { RANKS } from '../../src/lib/rank.js';

describe('lowestRank', () => {
  it.each([
    ['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6],
    ['3+', 3], ['1 or 5', 1], ['any', 1], ['top', MAX_RANK], ['-', null],
  ])('%s → %s', (r, n) => expect(lowestRank(r)).toBe(n));

  it('covers every allowed rank', () => {
    for (const r of RANKS) expect(() => lowestRank(r)).not.toThrow();
  });

  it('is 7 at the top, from the Area Point table', () => expect(MAX_RANK).toBe(7));
});

describe('availability', () => {
  it.each([
    [{ minRank: '5' }, undefined, 'unset'],
    [{ minRank: '5' }, null, 'unset'],
    [{ minRank: '-' }, 3, 'likely'],
    [{ minRank: '3' }, 3, 'available'],
    [{ minRank: '1' }, 7, 'available'],
    [{ minRank: '5' }, 3, 'locked'],
    [{ minRank: '3+' }, 2, 'locked'],
    [{ minRank: '1 or 5' }, 2, 'available'],
    [{ minRank: 'top' }, 6, 'locked'],
    [{ minRank: '1', maxRank: '4' }, 5, 'available'],
  ])('%o at R%s → %s', (entry, u, out) => expect(availability(entry, u)).toBe(out));
});

describe('sanitizeRanks', () => {
  const ids = ['moltana', 'wgg'];
  it('keeps integer ranks 1–7 for known regions', () => {
    expect(sanitizeRanks({ moltana: 3, wgg: 7 }, ids)).toEqual({ moltana: 3, wgg: 7 });
  });
  it('drops unknown ids and anything that is not an integer from 1 to 7', () => {
    expect(sanitizeRanks({ atlantis: 3, moltana: 0, wgg: '4' }, ids)).toEqual({});
    expect(sanitizeRanks({ moltana: 8, wgg: 2.5 }, ids)).toEqual({});
  });
  it('returns {} for junk', () => {
    for (const junk of [null, undefined, 'x', 4, []]) expect(sanitizeRanks(junk, ids)).toEqual({});
  });
});
