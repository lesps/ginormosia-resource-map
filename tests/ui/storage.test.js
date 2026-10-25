import { describe, it, expect } from 'vitest';
import { createStorage, memoryBackend } from '../../src/ui/storage.js';

const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('denied'); } };

describe('createStorage', () => {
  it('round-trips JSON values', () => {
    const s = createStorage(memoryBackend());
    expect(s.set('k', { a: 1 })).toBe(true);
    expect(s.get('k', null)).toEqual({ a: 1 });
    s.remove('k');
    expect(s.get('k', 'gone')).toBe('gone');
  });

  it('returns the fallback for missing keys and invalid JSON', () => {
    const b = memoryBackend();
    b.setItem('bad', '{not json');
    const s = createStorage(b);
    expect(s.get('missing', 5)).toBe(5);
    expect(s.get('bad', 'fallback')).toBe('fallback');
  });

  it('survives a backend that throws', () => {
    const s = createStorage(throwing);
    expect(s.get('k', 'fallback')).toBe('fallback');
    expect(s.set('k', 1)).toBe(false);
    expect(() => s.remove('k')).not.toThrow();
  });

  it('falls back to memory when localStorage is unavailable', () => {
    const s = createStorage();
    expect(s.set('gnm:test', 1)).toBe(true);
    expect(s.get('gnm:test', 0)).toBe(1);
  });
});
