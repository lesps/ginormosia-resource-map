// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import raw from '../../data/regions.json';
import { mount, memoryStorage } from './helpers.js';
import { createStorage, memoryBackend } from '../../src/ui/storage.js';

const NOTES = 'gnm:notes:v1';
let t, storage;
const on = (extra = {}) => {
  storage = memoryStorage();
  storage.set('gnm:notesOn:v1', true);
  for (const [k, v] of Object.entries(extra)) storage.set(k, v);
  t = mount(undefined, { storage });
};
const notes = () => storage.get(NOTES, []);
const btn = (sel, root = t.panel()) => root.querySelector(sel);
const btns = (sel, root = t.panel()) => [...root.querySelectorAll(sel)];
const key = (k) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
const openEntry = (region, name) => { t.pin(region).click(); if (!t.entry(name)) btn('.show-common')?.click(); if (!t.entry(name)) btns('.show-locked').forEach((b) => b.click()); t.entry(name).click(); };
const input = (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };

afterEach(() => { document.querySelectorAll('.toast').forEach((x) => x.remove()); vi.restoreAllMocks(); });

describe('field notes off', () => {
  it('adds no controls anywhere', () => {
    t = mount();
    t.pin('Moltana Wastes').click();
    const before = btns('button').map((b) => b.textContent);
    expect(btns('[class*="fn-"]')).toHaveLength(0);
    t.entry('Golemstone').click();
    expect(btns('.fn-actions')).toHaveLength(0);
    t.pin('Moltana Wastes').click();
    expect(btns('button').map((b) => b.textContent).filter((x) => !/^Golemstone/.test(x))).toEqual(before.filter((x) => !/^Golemstone/.test(x)));
  });

  it('is switched on in My game and saved', () => {
    storage = memoryStorage();
    t = mount(undefined, { storage });
    t.$('.mygame').click();
    const sw = btn('input.fn-switch');
    expect(sw.checked).toBe(false);
    sw.click();
    expect(storage.get('gnm:notesOn:v1')).toBe(true);
    key('Escape');
    t.pin('Moltana Wastes').click();
    expect(btn('.fn-bar')).not.toBeNull();
  });
});

describe('field notes on: region panel', () => {
  beforeEach(() => on({ 'gnm:ranks:v1': { moltana: 3 } }));

  it('shows the tower and time-of-day bar, defaulting the tower to your rank', () => {
    t.pin('Moltana Wastes').click();
    expect(btn('select.fn-tower').value).toBe('3');
    t.setRank(5, btn('select.fn-tower'));
    expect(storage.get('gnm:tower:v1')).toEqual({ moltana: 5 });
    t.setRank(3, btn('select.fn-tower'));
    expect(storage.get('gnm:tower:v1')).toEqual({});
    const night = btn('.fn-tod[data-tod="night"]');
    night.click();
    expect(btn('.fn-tod[data-tod="night"]').getAttribute('aria-pressed')).toBe('true');
    btn('.fn-tod[data-tod="night"]').click();
    expect(btn('.fn-tod[data-tod="night"]').getAttribute('aria-pressed')).toBe('false');
  });

  it('lists open questions, collapsed, and opens an entry from one', () => {
    t.pin('Moltana Wastes').click();
    const toggle = btn('.fn-questions-toggle');
    expect(toggle.textContent).toBe('Open questions (20)');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    const rows = btns('.fn-q');
    expect(rows).toHaveLength(20);
    const burrow = rows.find((r) => r.textContent.includes('Burrow Star'));
    expect(btns('.fn-chip', burrow).map((c) => c.textContent)).toEqual(['one source', 'rank?', 'name?']);
    burrow.click();
    expect(t.entry('Burrow Star').getAttribute('aria-expanded')).toBe('true');
  });

  it('shows open-question counts in the region list', () => {
    expect(t.panel().querySelector('.region-list button').querySelector('.fn-count').textContent).toMatch(/^\? \d+$/);
  });
});

describe('field notes on: card actions', () => {
  beforeEach(() => on({ 'gnm:ranks:v1': { moltana: 3 } }));

  it('records a sighting with the tower rank and time of day', () => {
    t.pin('Moltana Wastes').click();
    btn('.fn-tod[data-tod="night"]').click();
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-seen').click();
    expect(notes()).toHaveLength(1);
    expect(notes()[0]).toMatchObject({ kind: 'seen', region: 'moltana', category: 'ore', entry: 'golemstone', rank: 3, time: 'night' });
    expect(btn('.detail:not([hidden]) .fn-mine').textContent).toMatch(/Seen · tower R3 · night · today/);
  });

  it('identifies monsters by id', () => {
    openEntry('Moltana Wastes', 'Burrow Star');
    btn('.detail:not([hidden]) .fn-seen').click();
    expect(notes()[0]).toMatchObject({ category: 'monsters', entry: 'burrow-star' });
  });

  it('hides "Looked, not here" and "Mark spot" where they mean nothing', () => {
    openEntry('Moltana Wastes', 'Great Platinum Deposit');
    const d = t.detail();
    expect(btn('.fn-seen', d)).not.toBeNull();
    expect(btn('.fn-absent', d)).toBeNull();
    expect(btn('.fn-spot', d)).toBeNull();
    openEntry('Moltana Wastes', 'Gold Deposit');
    expect(btn('.fn-absent', t.detail())).not.toBeNull();
    expect(btn('.fn-spot', t.detail())).toBeNull();
  });

  it('undoes a note', () => {
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-absent').click();
    expect(notes()).toHaveLength(1);
    btn('.detail:not([hidden]) .fn-undo').click();
    expect(notes()).toEqual([]);
  });

  it('saves a text note up to 500 characters', () => {
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-note').click();
    const ta = btn('.detail:not([hidden]) textarea.fn-input');
    expect(ta.getAttribute('maxlength')).toBe('500');
    input(ta, 'Behind the big rock.');
    btn('.detail:not([hidden]) .fn-save').click();
    expect(notes()[0]).toMatchObject({ kind: 'text', entry: 'golemstone', text: 'Behind the big rock.' });
  });

  it('records the in-game name of a ≈ monster', () => {
    openEntry('Moltana Wastes', 'Burrow Star');
    btn('.detail:not([hidden]) .fn-name-same').click();
    expect(notes()[0]).toMatchObject({ kind: 'name', monster: 'burrow-star', shown: 'Burrow Star', inGame: 'Burrow Star' });
    btn('.detail:not([hidden]) .fn-name-diff').click();
    const box = btn('.detail:not([hidden]) input.fn-input');
    expect(box.value).toBe('Burrow Star');
    input(box, 'Burrowstar');
    btn('.detail:not([hidden]) .fn-save').click();
    expect(notes()[1]).toMatchObject({ kind: 'name', inGame: 'Burrowstar' });
  });

  it('records the in-game name of a ≈ drop by its Japanese name', () => {
    openEntry('Moltana Wastes', 'Golemstone');
    const edits = btns('.detail:not([hidden]) .fn-drop-edit');
    expect(edits.length).toBe(2);
    edits[0].click();
    const box = btn('.detail:not([hidden]) input.fn-input');
    input(box, `${box.value} X`);
    btn('.detail:not([hidden]) .fn-save').click();
    expect(notes()[0]).toMatchObject({ kind: 'drop-name', ja: expect.any(String), inGame: expect.stringMatching(/ X$/) });
  });

  it('hides name corrections when your game is not in English', () => {
    storage.set('gnm:gameEnglish:v1', false);
    t = mount(undefined, { storage });
    openEntry('Moltana Wastes', 'Burrow Star');
    expect(btn('.detail:not([hidden]) .fn-name-same')).toBeNull();
    openEntry('Moltana Wastes', 'Golemstone');
    expect(btn('.detail:not([hidden]) .fn-drop-edit')).toBeNull();
  });
});

describe('placement', () => {
  beforeEach(() => on());
  const tapMap = (x, y) => {
    const inner = t.$('.map-inner');
    inner.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400, right: 400, bottom: 400 });
    inner.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
  };

  it('marks a spot by tapping the map, and shows it as a dashed halo', () => {
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-spot').click();
    expect(t.$('.mapcard').classList.contains('placing')).toBe(true);
    expect(t.$('.place-banner').textContent).toMatch(/Tap the spot/);
    tapMap(100, 300);
    expect(notes()[0]).toMatchObject({ kind: 'spot', region: 'moltana', entry: 'golemstone', x: 0.25, y: 0.75, zoom: 1 });
    expect(t.$('.mapcard').classList.contains('placing')).toBe(false);
    const halo = t.$('.halo.local');
    expect(halo.style.left).toBe('25%');
    expect(halo.style.top).toBe('75%');
  });

  it('leaves placement with Escape or Cancel without saving', () => {
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-spot').click();
    key('Escape');
    expect(t.$('.mapcard').classList.contains('placing')).toBe(false);
    expect(t.entry('Golemstone').getAttribute('aria-expanded')).toBe('true');
    btn('.detail:not([hidden]) .fn-spot').click();
    t.$('.place-cancel').click();
    expect(t.$('.mapcard').classList.contains('placing')).toBe(false);
    expect(notes()).toEqual([]);
  });

  it('marks a named place from the landmarks', () => {
    t.pin('Moltana Wastes').click();
    btn('.fn-mark-place').click();
    const names = btns('.fn-place').map((b) => b.dataset.name);
    expect(names).toContain('Agekara Cave');
    expect(names).toContain('Panther Preserve town');
    btns('.fn-place').find((b) => b.dataset.name === 'Agekara Cave').click();
    tapMap(200, 40);
    expect(notes()[0]).toMatchObject({ kind: 'place', region: 'moltana', name: 'Agekara Cave', x: 0.5, y: 0.1 });
  });
});

describe('export', () => {
  const seen = { id: 'n-20261024-abcdef', date: '2026-10-24', kind: 'seen', region: 'moltana', category: 'ore', entry: 'golemstone', rank: 5, time: null };
  const openMine = () => t.$('.mygame').click();

  it('summarises and downloads, copies and shares the export', async () => {
    const write = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), configurable: true });
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    on({ [NOTES]: [seen] });
    openMine();
    expect(btn('.fn-summary').textContent).toBe('Field notes: 1 note (0 merged)');
    btn('.fn-download').click();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    btn('.fn-copy').click();
    const copied = JSON.parse(write.mock.calls[0][0]);
    expect(copied).toMatchObject({ format: 'ginormosia-field-notes', version: 1, dataVersion: 4, gameLanguage: 'en', notes: [seen] });
    btn('.fn-share').click();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.any(File)] }));
    delete navigator.canShare;
    delete navigator.share;
  });

  it('opens a prefilled GitHub issue, or explains when it is too long', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    on({ [NOTES]: [seen] });
    openMine();
    expect(btn('.fn-share')).toBeNull();
    btn('.fn-issue').click();
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/github\.com\/lesps\/ginormosia-resource-map\/issues\/new\?/);
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `n-20261024-${String(i).padStart(6, '0')}`, date: '2026-10-24', kind: 'text', region: 'wgg', category: 'fish', entry: 'evil-carp', text: 'a'.repeat(200) }));
    on({ [NOTES]: many });
    openMine();
    expect(btn('.fn-issue').disabled).toBe(true);
    expect(btn('.fn-issue-note').textContent).toMatch(/too long/i);
  });

  it('marks merged notes and leaves them out unless included', () => {
    const data = structuredClone(raw);
    data.fieldNotesMerged = [seen.id];
    storage = memoryStorage();
    storage.set('gnm:notesOn:v1', true);
    storage.set(NOTES, [seen]);
    const write = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true });
    t = mount(data, { storage });
    openMine();
    expect(btn('.fn-summary').textContent).toBe('Field notes: 1 note (1 merged)');
    btn('.fn-copy').click();
    expect(JSON.parse(write.mock.calls[0][0]).notes).toEqual([]);
    btn('input.fn-include-merged').click();
    btn('.fn-copy').click();
    expect(JSON.parse(write.mock.calls[1][0]).notes).toEqual([seen]);
    key('Escape');
    openEntry('Moltana Wastes', 'Golemstone');
    expect(btn('.detail:not([hidden]) .fn-merged')).not.toBeNull();
    expect(btn('.detail:not([hidden]) .fn-undo')).toBeNull();
    openMine();
    btn('.fn-clear-merged').click();
    expect(storage.get(NOTES)).toEqual([]);
  });

  it('needs two taps to clear all notes', () => {
    on({ [NOTES]: [seen] });
    openMine();
    btn('.fn-clear-all').click();
    expect(storage.get(NOTES)).toHaveLength(1);
    expect(btn('.fn-clear-all').textContent).toBe('Tap again to clear');
    btn('.fn-clear-all').click();
    expect(storage.get(NOTES)).toEqual([]);
  });
});

describe('storage', () => {
  it('warns when a note cannot be saved, and asks for persistence once', () => {
    const persist = vi.fn(() => Promise.resolve(true));
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true });
    storage = memoryStorage();
    storage.set('gnm:notesOn:v1', true);
    t = mount(undefined, { storage });
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-seen').click();
    btn('.detail:not([hidden]) .fn-absent').click();
    expect(persist).toHaveBeenCalledTimes(1);

    const backend = memoryBackend();
    const failing = createStorage({ ...backend, setItem: (k, v) => { if (k === NOTES) throw new Error('full'); backend.setItem(k, v); } });
    failing.set('gnm:notesOn:v1', true);
    t = mount(undefined, { storage: failing });
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-seen').click();
    expect(document.querySelector('.toast').textContent).toBe('Couldn’t save on this device — export your notes now.');
    delete navigator.storage;
  });

  it('keeps notes, tower and settings out of the hash', () => {
    const seen = [];
    storage = memoryStorage();
    storage.set('gnm:notesOn:v1', true);
    t = mount(undefined, { storage, onHash: (h) => seen.push(h) });
    openEntry('Moltana Wastes', 'Golemstone');
    btn('.detail:not([hidden]) .fn-seen').click();
    for (const h of seen) for (const k of new URLSearchParams(h.slice(1)).keys()) expect(['cat', 'type', 'tag', 'q', 'r', 'e']).toContain(k);
  });
});
