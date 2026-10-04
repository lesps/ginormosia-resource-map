// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import raw from '../../data/regions.json';
import { mount } from './helpers.js';

let t;
beforeEach(() => { t = mount(); });

const headings = () => [...t.panel().querySelectorAll('.group h3')].map((h) => h.textContent.trim());

describe('map', () => {
  it('renders 15 pins labelled with region names', () => {
    const pins = t.$$('.pin');
    expect(pins).toHaveLength(15);
    expect(pins.map((p) => p.getAttribute('aria-label')).sort()).toEqual(raw.regions.map((r) => r.name).sort());
  });

  it('positions pins by normalized coordinates', () => {
    const p = t.pin('Drakeseye Valley');
    expect(p.style.left).toBe('8.4%');
    expect(p.style.top).toBe('48.7%');
  });

  it('shows a dot per category the region has', () => {
    expect([...t.pin('Moltana Wastes').querySelectorAll('.dot')].map((d) => d.dataset.cat)).toEqual(['ore', 'fish']);
  });

  it('zoom buttons scale the map and report state', () => {
    const z2 = t.$$('.zoom button').find((b) => b.textContent === '2×');
    z2.click();
    expect(t.$('.map-inner').style.width).toBe('200%');
    expect(z2.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('selecting a region', () => {
  it('shows the region and hides empty groups', () => {
    t.pin('Crickneck Canyon').click();
    expect(t.panel().querySelector('h2').textContent).toBe('Crickneck Canyon');
    expect(t.panel().textContent).toContain('Mountains northwest of the Greatgut Plains');
    expect(headings()).toEqual(['Ore', 'Trees']);
    expect(t.pin('Crickneck Canyon').classList.contains('sel')).toBe(true);
    expect(t.pin('Crickneck Canyon').getAttribute('aria-pressed')).toBe('true');
  });

  it('formats ranks and notes', () => {
    t.pin('Scorchrock Mountain').click();
    const row = [...t.panel().querySelectorAll('li')].find((li) => li.textContent.includes('Hot Spring Bream'));
    expect(row.textContent).toContain('R1 or R5');
    expect(row.textContent).toContain('inland lake');
  });

  it('selects with Enter on a focused pin', () => {
    const p = t.pin('Shroomhaven');
    p.focus();
    p.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(t.panel().querySelector('h2').textContent).toBe('Shroomhaven');
  });

  it('can be closed', () => {
    t.pin('Shroomhaven').click();
    t.panel().querySelector('.close').click();
    expect(t.panel().querySelector('h2')?.textContent).not.toBe('Shroomhaven');
    expect(t.pin('Shroomhaven').classList.contains('sel')).toBe(false);
  });

  it('idle panel lists regions that can be tapped', () => {
    const rows = t.panel().querySelectorAll('.region-list button');
    expect(rows).toHaveLength(15);
    [...rows].find((b) => b.textContent.includes('Viridia Plateau')).click();
    expect(t.panel().querySelector('h2').textContent).toBe('Viridia Plateau');
  });
});

describe('category filter', () => {
  it('is single-select with aria-pressed', () => {
    t.chip('Trees').click();
    expect(t.chip('Trees').getAttribute('aria-pressed')).toBe('true');
    expect(t.chip('All').getAttribute('aria-pressed')).toBe('false');
  });

  it('dims regions without that category and limits the panel to it', () => {
    t.pin('Scorchrock Mountain').click();
    t.chip('Trees').click();
    expect(t.pin('Moltana Wastes').classList.contains('dim')).toBe(true);
    expect(t.pin('Scorchrock Mountain').classList.contains('dim')).toBe(false);
    expect(headings()).toEqual(['Trees']);
  });
});

describe('sub-type filter', () => {
  it('appears only when a category is chosen', () => {
    expect(t.$$('.type-chip')).toHaveLength(0);
    t.chip('Ore').click();
    expect(t.type('Platinum')).toBeTruthy();
    expect(t.type('Platinum').textContent).toContain('3');
    expect(t.type('Oak')).toBeUndefined();
  });

  it('highlights regions with that type and lists them easiest first', () => {
    t.chip('Ore').click();
    t.type('Platinum').click();
    expect(t.type('Platinum').getAttribute('aria-pressed')).toBe('true');
    const hits = t.$$('.pin.hit').map((p) => p.getAttribute('aria-label')).sort();
    expect(hits).toEqual(['Moltana Wastes', 'Scorchrock Mountain', 'South Greatgut Plains']);
    expect(t.pin('Wingtip Valley').classList.contains('dim')).toBe(true);
    const rows = [...t.panel().querySelectorAll('.results button')];
    expect(rows).toHaveLength(6);
    expect(rows[0].textContent).toContain('R1');
    expect(rows.at(-1).textContent).toContain('R4');
  });

  it('shows a per-region match count on hit pins', () => {
    t.chip('Ore').click();
    t.type('Platinum').click();
    expect(t.pin('Moltana Wastes').querySelector('.count').textContent).toBe('2');
  });

  it('filters the region view to the type', () => {
    t.chip('Ore').click();
    t.type('Platinum').click();
    t.pin('Moltana Wastes').click();
    const names = [...t.panel().querySelectorAll('li .name')].map((n) => n.textContent);
    expect(names).toEqual(['Platinum Deposit', 'Great Platinum Deposit']);
  });

  it('resets when the category changes', () => {
    t.chip('Ore').click();
    t.type('Platinum').click();
    t.chip('Fish').click();
    expect(t.$$('.pin.hit')).toHaveLength(0);
    expect(t.type('Tuna')).toBeTruthy();
  });
});

describe('search', () => {
  it('"skytree" lists only Shroomhaven and marks its pin as a hit', () => {
    t.typeQuery('skytree');
    const rows = [...t.panel().querySelectorAll('.results button')];
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.textContent.includes('Shroomhaven'))).toBe(true);
    expect(rows[0].querySelector('mark').textContent.toLowerCase()).toBe('skytree');
    expect(t.$$('.pin.hit').map((p) => p.getAttribute('aria-label'))).toEqual(['Shroomhaven']);
    expect(t.pin('Wingtip Valley').classList.contains('dim')).toBe(true);
  });

  it('shows a no-match message naming the filter', () => {
    t.chip('Fish').click();
    t.typeQuery('platinum');
    const text = t.panel().textContent;
    expect(text).toMatch(/Nothing in Ginormosia matches/);
    expect(text).toMatch(/fish/i);
    expect(text).toMatch(/not found in Ginormosia/i);
  });

  it('tapping a result selects the region with a way back', () => {
    t.typeQuery('platinum');
    [...t.panel().querySelectorAll('.results button')].find((b) => b.textContent.includes('Moltana')).click();
    expect(t.panel().querySelector('h2').textContent).toBe('Moltana Wastes');
    t.panel().querySelector('.back').click();
    expect(t.panel().querySelectorAll('.results button').length).toBeGreaterThan(0);
  });

  it('clear button empties the query', () => {
    t.typeQuery('platinum');
    t.$('.clear').click();
    expect(t.$('#q').value).toBe('');
    expect(t.$$('.pin.hit')).toHaveLength(0);
  });
});

describe('safety', () => {
  it('renders data containing <script> as text', () => {
    const data = structuredClone(raw);
    data.regions[0].name = '<script>alert(1)</script>';
    data.regions[0].ore[0].name = '<img src=x onerror=alert(1)>';
    t = mount(data);
    t.$$('.pin')[0].click();
    expect(t.root.querySelector('script')).toBeNull();
    expect(t.root.querySelector('#panel img')).toBeNull();
    expect(t.panel().querySelector('h2').textContent).toBe('<script>alert(1)</script>');
  });
});

describe('footer', () => {
  it('lists resources not in Ginormosia and the source', () => {
    const foot = t.$('footer').textContent;
    for (const n of raw.notInGinormosia) expect(foot).toContain(n.name);
    expect(foot).toContain('fli-ginormosia.bearblog.dev');
  });

  it('credits LEVEL-5 and disclaims affiliation', () => {
    const foot = t.$('footer').textContent;
    expect(foot).toContain('© LEVEL-5 Inc.');
    expect(foot).toMatch(/not affiliated with or endorsed by LEVEL-5/);
  });
});

describe('url state', () => {
  it('restores filter, type, query and selection from the hash', () => {
    t = mount(undefined, { hash: '#cat=ore&type=Platinum&r=moltana' });
    expect(t.chip('Ore').getAttribute('aria-pressed')).toBe('true');
    expect(t.type('Platinum').getAttribute('aria-pressed')).toBe('true');
    expect(t.panel().querySelector('h2').textContent).toBe('Moltana Wastes');
  });

  it('reports state changes', () => {
    const seen = [];
    t = mount(undefined, { onHash: (h) => seen.push(h) });
    t.chip('Trees').click();
    expect(seen.at(-1)).toBe('#cat=trees');
  });
});

describe('keyboard shortcuts', () => {
  const key = (k, target = document.body) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  it('"/" focuses the search box', () => {
    key('/');
    expect(document.activeElement).toBe(t.$('#q'));
  });

  it('Escape closes the region, then clears the search', () => {
    t.typeQuery('platinum');
    [...t.panel().querySelectorAll('.results button')][0].click();
    key('Escape');
    expect(t.panel().querySelector('.results')).not.toBeNull();
    key('Escape', t.$('#q'));
    expect(t.$('#q').value).toBe('');
  });
});

describe('hash changes after load', () => {
  it('applyHash updates state', () => {
    t.app.applyHash('#q=skytree');
    expect(t.$$('.pin.hit').map((p) => p.getAttribute('aria-label'))).toEqual(['Shroomhaven']);
    expect(t.$('#q').value).toBe('skytree');
  });
});
