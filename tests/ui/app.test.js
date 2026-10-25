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
    expect(p.style.left).toBe('12.7%');
    expect(p.style.top).toBe('42.2%');
  });

  it('sizes the map from the data image dimensions', () => {
    const img = t.$('.map-inner img');
    expect(img.getAttribute('width')).toBe('1024');
    expect(img.getAttribute('height')).toBe('1012');
    expect(t.$('.map-scroll').style.aspectRatio).toBe('1024 / 1012');
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
    expect(headings()).toEqual(['Ore', 'Trees', 'Monsters']);
    expect(t.pin('Crickneck Canyon').classList.contains('sel')).toBe(true);
    expect(t.pin('Crickneck Canyon').getAttribute('aria-pressed')).toBe('true');
  });

  it('formats ranks and shows location details when a row is opened', () => {
    t.pin('Drakesnout Range').click();
    const btn = t.entry('Coldwater Tuna');
    expect(btn.textContent).toContain('R1 or R5');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click();
    expect(t.entry('Coldwater Tuna').getAttribute('aria-expanded')).toBe('true');
    expect(t.detail().textContent).toContain('Off the shore');
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
    const names = [...t.panel().querySelectorAll('.entry .name')].map((n) => n.textContent);
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
    for (const src of ['fli-ginormosia.bearblog.dev', 'Gamer Guides', 'Game Rant', 'GameWith', 'Game8', 'kokorogu.com', 'wikiwiki.jp', 'hassaku74kg.com', 'gget.jp'])
      expect(foot).toContain(src);
  });

  it('credits LEVEL-5 and disclaims affiliation', () => {
    const foot = t.$('footer').textContent;
    expect(foot).toContain('© LEVEL-5 Inc.');
    expect(foot).toMatch(/not affiliated with or endorsed by LEVEL-5/);
  });

  it('does not credit the old fan-annotated map', () => {
    expect(t.$('footer').textContent).not.toMatch(/reddit|dzchan/i);
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

  it('Escape closes the open card, then the region, then clears the search', () => {
    t.typeQuery('platinum');
    [...t.panel().querySelectorAll('.results button')][0].click();
    key('Escape');
    expect(t.$$('.entry[aria-expanded="true"]')).toHaveLength(0);
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

describe('resource details', () => {
  it('shows the region tower, summary and landmarks', () => {
    t.pin('Moltana Wastes').click();
    const text = t.panel().textContent;
    expect(text).toContain("Googlisha's Tower");
    expect(text).toContain('No legendary challenges spawn here');
    expect(text).toContain('Panther Preserve town');
  });

  it('badges rows with crown, level and reliability', () => {
    t.pin('West Dryridge Desert').click();
    const sword = t.entry('Golden Swordfish');
    expect(sword.querySelector('[data-tag="gold-crown"]').getAttribute('aria-label')).toMatch(/gold-crown/i);
    expect(sword.querySelector('.lv').textContent).toBe('Lv60');
    expect(t.entry('Tuna').querySelector('.conf').textContent).toMatch(/unconfirmed/i);
    expect(sword.querySelector('.conf')).toBeNull();
  });

  it('opens one detail card at a time with how-to-find steps, drops and sources', () => {
    t.pin('West Dryridge Desert').click();
    t.entry('Golden Swordfish').click();
    const d = t.detail();
    const labels = [...d.querySelectorAll('dt')].map((x) => x.textContent);
    expect(labels).toEqual(['How to find', 'Drops', 'Sources']);
    expect(d.querySelectorAll('ol.find li').length).toBeGreaterThanOrEqual(3);
    expect(d.textContent).toContain('Off the coast');
    expect(d.textContent).toContain('Golden Fin');
    expect(d.textContent).toContain('Gamer Guides');
    expect(d.textContent).not.toContain('ゴールデンカジキ');
    expect(d.textContent).not.toMatch(/Reliability/);
    t.entry('Sand Fish').click();
    expect(t.$$('.entry[aria-expanded="true"]')).toHaveLength(1);
    t.entry('Sand Fish').click();
    expect(t.$$('.entry[aria-expanded="true"]')).toHaveLength(0);
  });

  it('marks translated drop names', () => {
    t.pin('West Dryridge Desert').click();
    t.entry('Golden Swordfish').click();
    const drops = [...t.detail().querySelectorAll('.drop')];
    const fin = drops.find((x) => x.textContent.includes('Golden Fin'));
    const scale = drops.find((x) => x.textContent.includes('Fish Scale'));
    expect(fin.classList.contains('approx')).toBe(false);
    expect(scale.classList.contains('approx')).toBe(true);
    expect(scale.getAttribute('title')).toMatch(/translated from Japanese/i);
  });


  it('opens the exact entry from a search result', () => {
    t.typeQuery('ruby');
    [...t.panel().querySelectorAll('.results button')].find((b) => b.textContent.includes("Dragon's Claw")).click();
    expect(t.panel().querySelector('h2').textContent).toBe('Scorchrock Mountain');
    expect(t.entry("Dragon's Claw").getAttribute('aria-expanded')).toBe('true');
  });

  it('says which drop matched in results', () => {
    t.typeQuery('ruby');
    const row = [...t.panel().querySelectorAll('.results button')].find((b) => b.textContent.includes('Golemstone'));
    expect(row.textContent).toMatch(/drops Ruby/);
  });

  it('restores an open entry from the hash and reports it', () => {
    const seen = [];
    t = mount(undefined, { hash: '#r=moltana&e=golemstone', onHash: (h) => seen.push(h) });
    expect(t.entry('Golemstone').getAttribute('aria-expanded')).toBe('true');
    t.entry('Golemstone').click();
    expect(seen.at(-1)).toBe('#r=moltana');
  });


  it('explains how spawns work', () => {
    const box = t.$('details.mechanics');
    expect(box.querySelectorAll('li').length).toBe(raw.mechanics.length);
  });
});

describe('monsters', () => {
  const names = () => [...t.panel().querySelectorAll('.entry .name')].map((n) => n.textContent);
  const toggle = () => t.panel().querySelector('.show-common');

  it('has a Monsters chip whose type chips put bosses first, with their badge icons', () => {
    t.chip('Monsters').click();
    expect(t.$$('.type-chip').map((c) => c.dataset.type)).toEqual(['', 'Gold-crown boss', 'Silver-crown', 'Legendary', 'Challenge', 'Common']);
    expect(t.$$('.type-chip')[0].textContent).toBe('All monsters');
    expect(t.type('Gold-crown boss').textContent).toMatch(/^👑/);
    expect(t.type('Challenge').textContent).toMatch(/^⚑/);
    expect(t.type('Common').textContent).toMatch(/^Common/);
    expect(t.chip('Bosses')).toBeUndefined();
  });

  it('lists monsters after the other resources in the All view', () => {
    t.pin('West Greatgut Plains').click();
    expect(headings()).toEqual(['Trees', 'Fish', 'Other', 'Monsters']);
  });

  it('summarises bosses in the region list under the Monsters chip', () => {
    t.chip('Monsters').click();
    const row = [...t.panel().querySelectorAll('.region-list button')].find((b) => b.textContent.includes('Crickneck Canyon'));
    expect(row.querySelector('.dots')).toBeNull();
    const sum = row.querySelector('.boss-count');
    expect(sum.getAttribute('aria-label')).toBe('1 gold-crown boss, 1 silver-crown monster');
    expect(sum.textContent.replace(/\s+/g, '')).toBe('👑1🥈1');
  });

  it('shows bosses and rare monsters in a region, with common ones one tap away', () => {
    t.pin('Crickneck Canyon').click();
    expect(names()).toEqual(expect.arrayContaining(['Bouldergeist', 'Mimic', 'Legendary Don Woolie', 'Goliath']));
    expect(names()).not.toContain('White Woolie');
    expect(toggle().textContent).toBe('Show 13 common monsters');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    expect(names()).toContain('White Woolie');
    expect(toggle().textContent).toBe('Hide common monsters');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    t.pin('Drakesnout Range').click();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps keyboard focus on the toggle and on rows across re-renders', () => {
    t.pin('Crickneck Canyon').click();
    toggle().focus();
    toggle().click();
    expect(document.activeElement).toBe(toggle());
    t.entry('Mimic').focus();
    t.entry('Mimic').click();
    expect(document.activeElement).toBe(t.entry('Mimic'));
  });

  it('marks unofficial names in search results too', () => {
    t.typeQuery('evil-spirit');
    expect(t.panel().querySelector('.results .approx-mark')).not.toBeNull();
  });

  it('lists every monster without a toggle under the Monsters chip', () => {
    t.chip('Monsters').click();
    t.pin('Crickneck Canyon').click();
    expect(names()).toHaveLength(17);
    expect(names().slice(0, 2)).toEqual(['Bouldergeist', 'Mimic']);
    expect(toggle()).toBeNull();
  });

  it('opens a common monster from a link even while commons are folded', () => {
    t = mount(undefined, { hash: '#r=crickneck&e=white-woolie' });
    expect(t.entry('White Woolie').getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps common monsters listed after closing a linked or searched card', () => {
    t = mount(undefined, { hash: '#r=crickneck&e=white-woolie' });
    t.entry('White Woolie').click();
    expect(names()).toContain('White Woolie');
    expect(toggle().textContent).toBe('Hide common monsters');
    t = mount();
    t.typeQuery('white woolie');
    [...t.panel().querySelectorAll('.results button')].find((b) => b.textContent.includes('Crickneck')).click();
    expect(t.entry('White Woolie').getAttribute('aria-expanded')).toBe('true');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(names()).toContain('White Woolie');
  });

  it('highlights every region with a type and lists it', () => {
    t.chip('Monsters').click();
    t.type('Legendary').click();
    expect(t.$$('.pin.hit').map((p) => p.getAttribute('aria-label')).sort()).toEqual(['Crickneck Canyon', 'Drakeseye Valley', 'Drakesnout Range']);
    expect(t.panel().querySelectorAll('.results button')).toHaveLength(3);
  });

  it('badges mounts and marks unofficial names, with a note in the card', () => {
    t.pin('Crickneck Canyon').click();
    toggle().click();
    expect(t.entry('Tortortoise').querySelector('[data-tag="mount"]').getAttribute('aria-label')).toMatch(/mount/i);
    t.pin('East Dryridge Desert').click();
    const ghost = t.entry('Evil-Spirit Ghost');
    expect(ghost.querySelector('.approx-mark')).not.toBeNull();
    expect(t.entry('Lord of Curses').querySelector('.approx-mark')).toBeNull();
    ghost.click();
    const d = t.detail();
    expect([...d.querySelectorAll('dt')].map((x) => x.textContent)).toContain('Name');
    expect(d.textContent).toMatch(/Translated from Japanese/);
    expect(d.textContent).not.toMatch(/Name translated/);
  });

  it('shows element and drops in a monster card', () => {
    t.pin('Moltana Wastes').click();
    toggle().click();
    t.entry('Fortoise').click();
    const d = t.detail();
    const labels = [...d.querySelectorAll('dt')].map((x) => x.textContent);
    expect(labels.slice(0, 3)).toEqual(['How to find', 'Drops', 'Element']);
    expect(d.textContent).toContain('Fire');
    expect(d.textContent).toContain('Magma Ore');
  });

  it('shows "R?" for an unrecorded rank', () => {
    t.pin('West Greatgut Plains').click();
    expect(t.entry('Shadow Behemoth').querySelector('.rank').textContent).toBe('R?');
  });

  it('maps an old boss link to the Monsters chip', () => {
    t = mount(undefined, { hash: '#cat=boss' });
    expect(t.chip('Monsters').getAttribute('aria-pressed')).toBe('true');
  });
});
