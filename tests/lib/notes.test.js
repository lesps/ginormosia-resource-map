import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { loadRegions } from '../../src/lib/data.js';
import { newNote, validateNote, exportNotes, parseNotesExport, openQuestions, toNormalized, issueUrl, noteEntryId } from '../../src/lib/notes.js';

const data = loadRegions(raw);
const region = (id) => data.regions.find((r) => r.id === id);
const now = new Date(2026, 9, 24, 15, 30);
let i = 0;
const random = () => ((i++ * 7) % 36) / 36;
const mk = (kind, fields) => newNote(kind, fields, { now, random });

describe('newNote', () => {
  it('stamps an id and a local date, nothing else', () => {
    const n = mk('seen', { region: 'moltana', category: 'monsters', entry: 'burrow-star', rank: 4, time: 'night' });
    expect(n.id).toMatch(/^n-20261024-[0-9a-z]{6}$/);
    expect(n).toEqual({ id: n.id, date: '2026-10-24', kind: 'seen', region: 'moltana', category: 'monsters', entry: 'burrow-star', rank: 4, time: 'night' });
  });
});

describe('validateNote', () => {
  const ok = {
    seen: { region: 'moltana', category: 'ore', entry: 'golemstone', rank: 5, time: null },
    absent: { region: 'moltana', category: 'ore', entry: 'gold-deposit', rank: null, time: 'day' },
    spot: { region: 'moltana', category: 'ore', entry: 'golemstone', x: 0.5, y: 0.25, zoom: 2 },
    place: { region: 'moltana', name: 'Agekara Cave', x: 0, y: 1, zoom: 1 },
    name: { monster: 'burrow-star', shown: 'Burrow Star', inGame: 'Burrowstar' },
    'drop-name': { ja: '羊毛', shown: 'Wool', inGame: 'Wool' },
    text: { region: 'moltana', category: 'ore', entry: 'golemstone', text: 'Behind the big rock.' },
  };

  it.each(Object.keys(ok))('accepts a valid %s note', (kind) => expect(() => validateNote(mk(kind, ok[kind]))).not.toThrow());

  it('rejects missing fields and unknown kinds', () => {
    const n = mk('seen', ok.seen);
    delete n.region;
    expect(() => validateNote(n)).toThrow(/region/);
    expect(() => validateNote({ ...mk('seen', ok.seen), kind: 'vibes' })).toThrow(/kind/);
    expect(() => validateNote({ ...mk('seen', ok.seen), id: 'x' })).toThrow(/id/);
  });

  it('rejects ranks outside 1–7 and bad times', () => {
    expect(() => validateNote(mk('seen', { ...ok.seen, rank: 8 }))).toThrow(/rank/);
    expect(() => validateNote(mk('seen', { ...ok.seen, rank: 0 }))).toThrow(/rank/);
    expect(() => validateNote(mk('absent', { ...ok.absent, time: 'dusk' }))).toThrow(/time/);
  });

  it('rejects coordinates outside 0–1', () => {
    expect(() => validateNote(mk('spot', { ...ok.spot, x: 1.2 }))).toThrow(/x/);
    expect(() => validateNote(mk('place', { ...ok.place, y: -0.1 }))).toThrow(/y/);
  });

  it('rejects text over 500 characters or empty', () => {
    expect(() => validateNote(mk('text', { ...ok.text, text: 'a'.repeat(501) }))).toThrow(/500/);
    expect(() => validateNote(mk('text', { ...ok.text, text: '  ' }))).toThrow(/text/);
    expect(() => validateNote(mk('name', { ...ok.name, inGame: '' }))).toThrow(/inGame/);
  });
});

describe('export and parse', () => {
  const notes = [mk('seen', { region: 'moltana', category: 'ore', entry: 'golemstone', rank: 5, time: null }), mk('text', { region: 'wgg', category: 'fish', entry: 'evil-carp', text: 'x' })];

  it('wraps notes in a versioned envelope and round-trips', () => {
    const env = exportNotes(notes, { dataVersion: 4, today: '2026-10-24', gameLanguage: 'en' });
    expect(env).toEqual({ format: 'ginormosia-field-notes', version: 1, dataVersion: 4, exported: '2026-10-24', gameLanguage: 'en', notes });
    expect(parseNotesExport(JSON.stringify(env))).toEqual(env);
  });

  it('leaves merged notes out unless asked', () => {
    const merged = [notes[0].id];
    expect(exportNotes(notes, { dataVersion: 4, today: 'x', merged }).notes).toEqual([notes[1]]);
    expect(exportNotes(notes, { dataVersion: 4, today: 'x', merged, includeMerged: true }).notes).toEqual(notes);
  });

  it('rejects other formats, versions and invalid notes', () => {
    const env = exportNotes(notes, { dataVersion: 4, today: 'x' });
    expect(() => parseNotesExport({ ...env, format: 'other' })).toThrow(/format/);
    expect(() => parseNotesExport({ ...env, version: 2 })).toThrow(/version/);
    expect(() => parseNotesExport('{oops')).toThrow();
    expect(() => parseNotesExport({ ...env, notes: [{ kind: 'seen' }] })).toThrow();
  });
});

describe('openQuestions', () => {
  const q = (regionId, notes = []) => openQuestions(region(regionId), notes);
  const find = (list, entry) => list.find((x) => x.entry === entry);

  it('lists what Moltana leaves open', () => {
    const list = q('moltana');
    expect(find(list, 'burrow-star').kinds).toEqual(['one-source', 'rank', 'name']);
    expect(find(list, 'golemstone')).toMatchObject({ category: 'ore', key: 'golemstone', kinds: ['spot', 'drops'], drops: 2 });
    expect(find(list, 'great-platinum-deposit')).toBeUndefined();
    expect(list.length).toBeGreaterThanOrEqual(12);
    expect(list.length).toBeLessThanOrEqual(28);
  });

  it('sorts disputed, one source, rank, spot, name, drops, then data order', () => {
    const order = ['disputed', 'one-source', 'rank', 'spot', 'name', 'drops'];
    const first = q('scorchrock').map((x) => order.indexOf(x.kinds[0]));
    expect(first).toEqual([...first].sort((a, b) => a - b));
    expect(q('scorchrock')[0].kinds[0]).toBe('disputed');
  });

  it('drops answered questions', () => {
    const seen = mk('seen', { region: 'moltana', category: 'monsters', entry: 'burrow-star', rank: 4, time: 'night' });
    expect(find(q('moltana', [seen]), 'burrow-star').kinds).toEqual(['name']);
    const unranked = mk('seen', { region: 'moltana', category: 'monsters', entry: 'goliath', rank: null, time: null });
    expect(find(q('moltana', [unranked]), 'goliath').kinds).toEqual(['rank']);
    const spot = mk('spot', { region: 'moltana', category: 'ore', entry: 'golemstone', x: 0.5, y: 0.5, zoom: 1 });
    expect(find(q('moltana', [spot]), 'golemstone').kinds).toEqual(['drops']);
  });

  it('counts a drop-name answer in every region', () => {
    const wool = mk('drop-name', { ja: '羊毛', shown: 'Wool', inGame: 'Wool' });
    const drops = (regionId, entry, notes = []) => find(q(regionId, notes), entry)?.drops ?? 0;
    for (const [r, e] of [['wgg', 'white-woolie'], ['wgg', 'king-woolie'], ['crickneck', 'black-woolie']])
      expect(drops(r, e, [wool]), `${r}/${e}`).toBe(drops(r, e) - 1);
  });

  it('identifies monsters by id and resources by entry key', () => {
    const r = region('moltana');
    expect(noteEntryId(r.monsters.find((e) => e.name === 'Burrow Star'), 'monsters')).toBe('burrow-star');
    expect(noteEntryId(r.ore.find((e) => e.name === 'Golemstone'), 'ore')).toBe('golemstone');
  });
});

describe('toNormalized', () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 };
  it('maps client coordinates into 0–1', () => expect(toNormalized(110, 45, rect)).toEqual({ x: 0.5, y: 0.25 }));
  it('clamps', () => expect(toNormalized(-50, 500, rect)).toEqual({ x: 0, y: 1 }));
});

describe('issueUrl', () => {
  const repo = 'https://github.com/lesps/ginormosia-resource-map';
  it('prefills a labelled issue with the export as a JSON block', () => {
    const env = exportNotes([mk('text', { region: 'wgg', category: 'fish', entry: 'evil-carp', text: 'Moat & bridge' })], { dataVersion: 4, today: '2026-10-24' });
    const { url, tooLong } = issueUrl(repo, env);
    expect(tooLong).toBe(false);
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe(`${repo}/issues/new`);
    expect(u.searchParams.get('labels')).toBe('field-notes');
    expect(u.searchParams.get('title')).toBe('[field notes] 1 note');
    expect(u.searchParams.get('body')).toContain('```json');
    expect(JSON.parse(u.searchParams.get('body').match(/```json\n([\s\S]*)\n```/)[1])).toEqual(env);
  });
  it('reports when the URL would pass 8,000 characters', () => {
    const many = Array.from({ length: 60 }, () => mk('text', { region: 'wgg', category: 'fish', entry: 'evil-carp', text: 'a'.repeat(200) }));
    expect(issueUrl(repo, exportNotes(many, { dataVersion: 4, today: 'x' })).tooLong).toBe(true);
  });
});
