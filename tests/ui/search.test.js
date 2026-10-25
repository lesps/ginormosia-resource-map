// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from './helpers.js';

let t;
beforeEach(() => { t = mount(); });

const section = (title) => [...t.panel().querySelectorAll('.results-section')].find((s) => s.querySelector('h3').textContent === title);
const rows = (el = t.panel()) => [...el.querySelectorAll('.results button')];
const tagChip = (tag) => t.$$('.tag-chip').find((c) => c.dataset.tag === tag);
const hits = () => t.$$('.pin.hit').map((p) => p.getAttribute('aria-label')).sort();

describe('searching places and challenges', () => {
  it('lists matching places first, then spawns, and counts both', () => {
    t.typeQuery('agekara');
    const places = section('Places');
    expect(places).toBeTruthy();
    expect(t.panel().querySelector('.results-section')).toBe(places);
    expect(rows(places).map((b) => b.querySelector('.name').textContent)).toEqual(['Moltana Wastes', 'Scorchrock Mountain']);
    expect(rows(places)[0].querySelector('mark').textContent).toBe('Agekara');
    expect(rows(section('Spawns'))).toHaveLength(8);
    expect(t.$('.jump').textContent).toBe('2 places · 8 spawns in 2 regions — see list ↓');
  });

  it('shows the matched location, challenge or note on the row', () => {
    t.typeQuery('glittering');
    const row = rows()[0];
    expect(row.querySelector('.note').textContent).toMatch(/^.+ · during 'Beware the Glittering Silk' challenge$/);
    expect(row.querySelector('.note mark').textContent).toBe('Glittering');
  });

  it('marks a place-only region pin with a dot', () => {
    t.typeQuery('moltana');
    expect(hits()).toEqual(['Moltana Wastes', 'Scorchrock Mountain']);
    expect(t.pin('Moltana Wastes').querySelector('.count').textContent).toBe('•');
    expect(t.pin('Scorchrock Mountain').querySelector('.count').textContent).toBe('1');
    expect(t.$('.jump').textContent).toBe('1 place · 1 spawn in 1 region — see list ↓');
  });

  it('opens a region from a place row', () => {
    t.typeQuery('fort gardhart');
    rows(section('Places'))[0].click();
    expect(t.panel().querySelector('h2').textContent).toBe('West Greatgut Plains');
  });

  it('keeps name matches above location matches', () => {
    t.typeQuery('panther');
    const names = rows().map((b) => b.querySelector('.name').textContent);
    expect(names.indexOf('Superior Red Ore Deposit')).toBe(names.length - 1);
  });
});

describe('badge filters', () => {
  it('shows tag chips with region counts under All only', () => {
    expect(t.$$('.tag-chip').map((c) => c.dataset.tag)).toEqual(['', 'gold-crown', 'silver-crown', 'legendary', 'event', 'mount', 'night', 'day', 'cave']);
    expect(t.$$('.tag-chip')[0].textContent).toBe('All');
    expect(tagChip('mount').textContent).toBe('🐴 Mount12');
    expect(t.$$('.type-chip')).toHaveLength(0);
    t.chip('Ore').click();
    expect(t.$$('.tag-chip')).toHaveLength(0);
  });

  it('filters like a type chip and turns off on a second tap', () => {
    tagChip('mount').click();
    expect(tagChip('mount').getAttribute('aria-pressed')).toBe('true');
    expect(hits()).toHaveLength(12);
    expect(t.panel().querySelector('h2').textContent).toBe('🐴 Mount');
    expect(rows()).toHaveLength(23);
    tagChip('mount').click();
    expect(t.$$('.pin.hit')).toHaveLength(0);
    expect(tagChip('').getAttribute('aria-pressed')).toBe('true');
  });

  it('limits a region to the tag, with a way back', () => {
    tagChip('mount').click();
    t.pin('West Greatgut Plains').click();
    expect([...t.panel().querySelectorAll('.entry .name')].map((n) => n.textContent)).toEqual(['King Woolie', 'Taurus', 'Tortortoise', 'White Woolie']);
    expect(t.panel().querySelector('.scope').textContent).toContain('🐴 Mount only');
  });

  it('is cleared by changing category', () => {
    tagChip('mount').click();
    t.chip('Monsters').click();
    t.chip('All').click();
    expect(tagChip('').getAttribute('aria-pressed')).toBe('true');
  });

  it('round-trips through the hash', () => {
    const seen = [];
    t = mount(undefined, { hash: '#tag=mount', onHash: (h) => seen.push(h) });
    expect(tagChip('mount').getAttribute('aria-pressed')).toBe('true');
    tagChip('night').click();
    expect(seen.at(-1)).toBe('#tag=night');
    t = mount(undefined, { hash: '#cat=ore&tag=mount' });
    expect(t.chip('Ore').getAttribute('aria-pressed')).toBe('true');
    expect(t.$$('.pin.hit')).toHaveLength(0);
  });

  it('applies from the badge key in How spawns work', () => {
    t.chip('Ore').click();
    const key = t.$$('.legend-keys button').find((b) => b.dataset.tag === 'mount');
    key.click();
    expect(t.chip('All').getAttribute('aria-pressed')).toBe('true');
    expect(tagChip('mount').getAttribute('aria-pressed')).toBe('true');
  });

  it('Escape clears the tag with the search', () => {
    tagChip('mount').click();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(t.$$('.pin.hit')).toHaveLength(0);
  });
});
