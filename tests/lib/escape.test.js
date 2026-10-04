import { describe, it, expect } from 'vitest';
import { escapeHtml, highlight } from '../../src/lib/escape.js';

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
