// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, memoryStorage } from './helpers.js';

const KEY = 'gnm:ranks:v1';
let t, storage;
beforeEach(() => { storage = memoryStorage(); t = mount(undefined, { storage }); });

const names = () => [...t.panel().querySelectorAll('.entry .name')].map((n) => n.textContent);
const lockToggles = () => [...t.panel().querySelectorAll('.show-locked')];
const resultSections = () => [...t.panel().querySelectorAll('.results-section')].map((s) => ({
  title: s.querySelector('h3').textContent,
  rows: [...s.querySelectorAll('.results button')].map((b) => b.querySelector('.name').textContent + ' · ' + b.querySelector('.note').textContent.split(' · ')[0]),
}));
const key = (k, target = document.body) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('your rank in a region', () => {
  it('offers Not set and R1–R7, saved immediately', () => {
    t.pin('Moltana Wastes').click();
    const sel = t.rankSelect();
    expect([...sel.options].map((o) => o.textContent)).toEqual(['Not set', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
    expect(sel.value).toBe('');
    t.setRank(3);
    expect(storage.get(KEY)).toEqual({ moltana: 3 });
    t.setRank('');
    expect(storage.get(KEY)).toEqual({});
  });

  it('folds entries that need a higher rank to the end of each group', () => {
    t.pin('Moltana Wastes').click();
    t.setRank(3);
    expect(names()).not.toContain('Golemstone');
    expect(names()).not.toContain('Mohawkasaurus');
    expect(names()).toEqual(expect.arrayContaining(['Platinum Deposit', 'Great Platinum Deposit', 'Goliath', 'Burrow Star']));
    expect(lockToggles().map((b) => b.textContent)).toEqual(['Show 2 more from R5', 'Show 1 more from R5', 'Show 5 more from R5']);
    lockToggles()[0].click();
    expect(names()).toEqual(expect.arrayContaining(['Golemstone', 'Heart of Darkness', 'Eruptuna', 'Mohawkasaurus']));
    expect(names().indexOf('Golemstone')).toBeGreaterThan(names().indexOf('Gold Deposit'));
    expect(lockToggles().every((b) => b.textContent === 'Hide higher-rank entries' && b.getAttribute('aria-expanded') === 'true')).toBe(true);
    t.pin('Scorchrock Mountain').click();
    t.setRank(1);
    expect(lockToggles()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('leaves Esc and the close button as they were', () => {
    t.pin('Moltana Wastes').click();
    t.setRank(3);
    key('Escape');
    expect(t.panel().querySelector('h2').textContent).toBe('Regions');
    t.pin('Moltana Wastes').click();
    t.panel().querySelector('.close').click();
    expect(t.panel().querySelector('h2').textContent).toBe('Regions');
  });

  it('restores saved ranks on the next visit', () => {
    t.pin('Moltana Wastes').click();
    t.setRank(3);
    t = mount(undefined, { storage });
    t.pin('Moltana Wastes').click();
    expect(t.rankSelect().value).toBe('3');
    expect(names()).not.toContain('Golemstone');
  });

  it('ignores junk in storage', () => {
    storage.set(KEY, { moltana: 9, atlantis: 2, wgg: 4 });
    t = mount(undefined, { storage });
    t.pin('Moltana Wastes').click();
    expect(t.rankSelect().value).toBe('');
  });

  it('opens a locked entry from a link with the fold expanded', () => {
    storage.set(KEY, { moltana: 3 });
    t = mount(undefined, { storage, hash: '#r=moltana&e=golemstone' });
    expect(t.entry('Golemstone').getAttribute('aria-expanded')).toBe('true');
  });

  it('opens a locked entry from a search result with the fold expanded', () => {
    storage.set(KEY, { moltana: 3 });
    t = mount(undefined, { storage });
    t.typeQuery('golemstone');
    [...t.panel().querySelectorAll('.results button')].find((b) => b.textContent.includes('Moltana')).click();
    expect(t.entry('Golemstone').getAttribute('aria-expanded')).toBe('true');
  });

  it('never puts ranks in the URL hash', () => {
    const seen = [];
    t = mount(undefined, { storage, onHash: (h) => seen.push(h) });
    t.pin('Moltana Wastes').click();
    t.setRank(3);
    t.$('.mygame').click();
    expect(seen.length).toBeGreaterThan(0);
    for (const h of seen) for (const k of new URLSearchParams(h.slice(1)).keys()) expect(['cat', 'type', 'q', 'r', 'e']).toContain(k);
  });
});

describe('results and pins with ranks', () => {
  it('splits results into available and needs-a-higher-rank', () => {
    storage.set(KEY, { moltana: 2 });
    t = mount(undefined, { storage });
    t.chip('Ore').click();
    t.type('Platinum').click();
    const [avail, locked] = resultSections();
    expect(avail.title).toBe('Available to you');
    expect(locked.title).toBe('Needs a higher rank');
    expect(locked.rows).toEqual(['Great Platinum Deposit · Moltana Wastes']);
    expect(avail.rows).toHaveLength(5);
    const row = t.panel().querySelector('.results-section:last-child .results button');
    expect(row.querySelector('.you').textContent).toBe('you: R2');
  });

  it('leaves results unsplit with no ranks set', () => {
    t.chip('Ore').click();
    t.type('Platinum').click();
    expect(resultSections()).toEqual([]);
    expect(t.panel().querySelectorAll('.results button')).toHaveLength(6);
  });

  it('marks a pin whose matches all need a higher rank', () => {
    storage.set(KEY, { moltana: 3 });
    t = mount(undefined, { storage });
    t.chip('Ore').click();
    t.type('Golemstone').click();
    const pin = t.pin('Moltana Wastes');
    expect(pin.classList.contains('locked')).toBe(true);
    expect(pin.querySelector('.count').textContent).toBe('🔒1');
    expect(pin.getAttribute('aria-description')).toBe('1 match, all need a higher rank');
    expect(t.pin('Viridia Plateau').classList.contains('locked')).toBe(false);
    expect(resultSections()[0].rows).toEqual(['Golemstone · Viridia Plateau']);
  });
});

describe('region list with ranks', () => {
  const rows = () => [...t.panel().querySelectorAll('.region-list button')];

  it('suggests My game while no rank is set, and shows set ranks', () => {
    expect(t.panel().querySelector('.rank-hint').textContent).toBe('Set your Area Ranks in My game to see what you can get now.');
    storage.set(KEY, { moltana: 3 });
    t = mount(undefined, { storage });
    expect(t.panel().querySelector('.rank-hint')).toBeNull();
    expect(rows().find((b) => b.textContent.includes('Moltana')).querySelector('.your-rank-chip').textContent).toBe('R3');
    expect(rows().find((b) => b.textContent.includes('Wingtip')).querySelector('.your-rank-chip')).toBeNull();
  });
});

describe('My game', () => {
  const open = () => t.$('.mygame').click();
  const regionSelects = () => [...t.panel().querySelectorAll('select.region-rank')];

  it('sits in the header before Install and opens a view with every region', () => {
    expect(t.$('#top-actions').firstElementChild).toBe(t.$('.mygame'));
    open();
    expect(t.panel().querySelector('h2').textContent).toBe('Your Area Ranks');
    expect(regionSelects()).toHaveLength(15);
    const labels = regionSelects().map((s) => s.closest('label').textContent.replace(/Not set.*$/, '').trim());
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    expect(t.panel().textContent).toContain('Saved on this device only.');
  });

  it('sets one region or all of them', () => {
    open();
    t.setRank(4, regionSelects().find((s) => s.dataset.region === 'wgg'));
    expect(storage.get(KEY)).toEqual({ wgg: 4 });
    t.setRank(5, t.panel().querySelector('select.set-all'));
    expect(Object.values(storage.get(KEY))).toEqual(Array(15).fill(5));
    expect(regionSelects().every((s) => s.value === '5')).toBe(true);
  });

  it('needs a second tap within 4 s to clear all', () => {
    vi.useFakeTimers();
    try {
      storage.set(KEY, { moltana: 3 });
      t = mount(undefined, { storage });
      open();
      const btn = () => t.panel().querySelector('.clear-ranks');
      btn().click();
      expect(btn().textContent).toBe('Tap again to clear');
      expect(storage.get(KEY)).toEqual({ moltana: 3 });
      vi.advanceTimersByTime(4100);
      expect(btn().textContent).toBe('Clear all');
      btn().click();
      btn().click();
      expect(storage.get(KEY)).toEqual({});
    } finally { vi.useRealTimers(); }
  });

  it('gives way when you pick a region, a chip or search', () => {
    open();
    t.pin('Moltana Wastes').click();
    expect(t.panel().querySelector('h2').textContent).toBe('Moltana Wastes');
    open();
    t.chip('Ore').click();
    expect(t.panel().querySelector('h2').textContent).not.toBe('Your Area Ranks');
    open();
    t.typeQuery('platinum');
    expect(t.panel().querySelector('h2').textContent).toBe('“platinum”');
    expect(t.$('.mygame').getAttribute('aria-pressed')).toBe('false');
  });

  it('closes with × or Esc', () => {
    open();
    key('Escape');
    expect(t.panel().querySelector('h2').textContent).toBe('Regions');
    open();
    t.panel().querySelector('.close').click();
    expect(t.panel().querySelector('h2').textContent).toBe('Regions');
  });
});
