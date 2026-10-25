import { describe, it, expect } from 'vitest';
import { escapeHtml, highlight, excerpt } from '../../src/lib/escape.js';

describe('escapeHtml', () => {
  it('escapes the five specials', () => expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'));
  it('coerces non-strings', () => expect(escapeHtml(5)).toBe('5'));
});

describe('highlight', () => {
  it('wraps the first case-insensitive match', () => {
    expect(highlight('Great Oak Tree, oak', 'OAK')).toBe('Great <mark>Oak</mark> Tree, oak');
  });
  it('escapes HTML around and inside the match', () => {
    expect(highlight('<b>Tom & Jerry</b>', '& j')).toBe('&lt;b&gt;Tom <mark>&amp; J</mark>erry&lt;/b&gt;');
  });
  it('does not double-escape', () => {
    expect(highlight('Fish &amp; Chips', 'chips')).toBe('Fish &amp;amp; <mark>Chips</mark>');
    expect(highlight('a < b', '<')).toBe('a <mark>&lt;</mark> b');
  });
  it('returns escaped text when there is no query or match', () => {
    expect(highlight('<x>', '')).toBe('&lt;x&gt;');
    expect(highlight('<x>', 'zzz')).toBe('&lt;x&gt;');
  });
});

describe('excerpt', () => {
  const long = 'A trio along the NE edge of the region. Also: one more deep inside Agekara Cave, east half.';

  it('keeps short text whole', () => expect(excerpt('Off the coast', 'coast', 50)).toBe('Off the coast'));

  it('cuts long text to a window around the match, on word boundaries', () => {
    const e = excerpt(long, 'agekara', 40);
    expect(e).toMatch(/^…/);
    expect(e).toContain('Agekara');
    expect(e.length).toBeLessThanOrEqual(42);
    const inner = e.replace(/^…|…$/g, '');
    const at = long.indexOf(inner);
    expect(at).toBeGreaterThan(0);
    expect(long[at - 1]).toBe(' ');
  });

  it('keeps the start when the match is early', () => {
    expect(excerpt(long, 'trio', 30)).toMatch(/^A trio along.*…$/);
  });

  it('never cuts into the match', () => {
    expect(excerpt('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxAgekaraCave and more words after it', 'agekara', 20)).toContain('Agekara');
  });

  it('returns the text unchanged without a match', () => expect(excerpt(long, 'nowhere', 30)).toBe(long));
});
