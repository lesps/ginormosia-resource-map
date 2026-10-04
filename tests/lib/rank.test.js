import { describe, it, expect } from 'vitest';
import { formatRank, rankOrder, RANKS } from '../../src/lib/rank.js';

describe('formatRank', () => {
  it.each([
    ['1', 'R1'], ['2', 'R2'], ['3', 'R3'], ['4', 'R4'], ['5', 'R5'],
    ['any', 'any rank'], ['top', 'top rank'], ['3+', 'R3+'], ['-', 'rank n/a'], ['1 or 5', 'R1 or R5'],
  ])('%s → %s', (input, out) => expect(formatRank(input)).toBe(out));

  it('covers every allowed rank', () => {
    for (const r of RANKS) expect(formatRank(r)).toBeTypeOf('string');
  });

  it('throws on unknown ranks', () => expect(() => formatRank('9')).toThrow());
});

describe('rankOrder', () => {
  it('sorts easiest-first, unknown last', () => {
    const sorted = ['-', 'top', '5', '3+', '1 or 5', 'any', '2'].sort((a, b) => rankOrder(a) - rankOrder(b));
    expect(sorted).toEqual(['any', '1 or 5', '2', '3+', '5', 'top', '-']);
  });
});
