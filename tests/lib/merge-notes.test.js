import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { validateRegions } from '../../src/lib/data.js';
import { mergeNotes, reportMarkdown } from '../../src/lib/merge-notes.js';

const fixture = () => ({
  version: 4,
  image: { width: 100, height: 100 },
  categories: ['ore', 'trees', 'fish', 'monsters', 'other'],
  typeOrder: { ore: ['Gold', 'Platinum'], trees: [], fish: ['Tuna'], monsters: ['Gold-crown boss', 'Common'], other: [] },
  sources: { gg: 'Gamer Guides', ingame: 'In-game observation (field notes)' },
  monsters: {
    'burrow-star': { name: 'Burrow Star', nameStatus: 'unofficial', drops: [{ name: 'Wool', ja: '羊毛', official: false }] },
    'night-bat': { name: 'Night Bat', time: 'night', drops: [{ name: 'Wool', ja: '羊毛', official: false }] },
    'big-boss': { name: 'Big Boss', crown: 'gold' },
  },
  regions: [{
    id: 'alpha', name: 'Alpha', pin: { x: 0.5, y: 0.5 },
    ore: [
      { name: 'Gold Deposit', type: 'Gold', minRank: '-', confidence: 'single-source', sources: ['gg'], drops: [{ name: 'Wool', ja: '羊毛', official: false }] },
      { name: 'Platinum Deposit', type: 'Platinum', minRank: '5', confidence: 'confirmed', sources: ['gg'] },
      { name: 'Great Platinum Deposit', type: 'Platinum', minRank: '3', confidence: 'disputed', sources: ['gg'], spawnType: 'tier-roll' },
    ],
    trees: [],
    fish: [{ name: 'Coldwater Tuna', type: 'Tuna', minRank: '1 or 5', confidence: 'disputed', sources: ['gg'], tags: ['day'], note: 'Sources disagree.' }],
    monsters: [
      { id: 'burrow-star', minRank: '-', spawnType: 'overworld', confidence: 'single-source', sources: ['gg'] },
      { id: 'night-bat', minRank: '2', spawnType: 'overworld', confidence: 'confirmed', sources: ['gg'], maxRank: '4' },
      { id: 'big-boss', minRank: '5', spawnType: 'fixed-boss', confidence: 'confirmed', sources: ['gg'] },
    ],
    other: [],
    places: [{ name: 'Old Mine', x: 0.1, y: 0.1 }],
  }],
});

let n = 0;
const note = (kind, fields) => ({ id: `n-20261024-${String(n++).padStart(6, '0')}`, date: '2026-10-24', kind, ...fields });
const at = (entry, category = 'ore') => ({ region: 'alpha', category, entry });
const seen = (entry, rank, time = null, category) => note('seen', { ...at(entry, category), rank, time });
const absent = (entry, rank, time = null, category) => note('absent', { ...at(entry, category), rank, time });
const run = (notes, opts) => mergeNotes(fixture(), notes, opts);
const region = (d) => d.regions[0];
const ore = (d, name) => region(d).ore.find((e) => e.name === name);
const app = (d, id) => region(d).monsters.find((a) => a.id === id);

describe('mergeNotes: seen', () => {
  it('adds the in-game source, confirms, and records the rank for an unranked entry', () => {
    const { data, report } = run([seen('gold-deposit', 3)]);
    expect(ore(data, 'Gold Deposit')).toMatchObject({ minRank: '3', confidence: 'confirmed', sources: ['gg', 'ingame'] });
    expect(report.applied.join('\n')).toMatch(/Gold Deposit.*R3/);
    expect(validateRegions(data)).toBe(data);
  });

  it('lowers a rank seen earlier than recorded, and never raises one', () => {
    expect(ore(run([seen('platinum-deposit', 4)]).data, 'Platinum Deposit').minRank).toBe('4');
    expect(ore(run([seen('platinum-deposit', 6)]).data, 'Platinum Deposit').minRank).toBe('5');
  });

  it('works on monster appearances by id', () => {
    const { data } = run([seen('burrow-star', 2, null, 'monsters')]);
    expect(app(data, 'burrow-star')).toMatchObject({ minRank: '2', confidence: 'confirmed', sources: ['gg', 'ingame'] });
  });

  it('resolves "1 or 5" to "1" from a sighting at R3, but leaves a dispute for review', () => {
    const { data, report } = run([seen('coldwater-tuna', 3, 'day', 'fish')]);
    const tuna = region(data).fish[0];
    expect(tuna.minRank).toBe('1');
    expect(tuna.confidence).toBe('disputed');
    expect(tuna.sources).toContain('ingame');
    expect(report.review.join('\n')).toMatch(/Coldwater Tuna.*disputed/);
  });

  it('sends a sighting above maxRank or at the wrong time of day to review, unchanged', () => {
    const { data, report } = run([seen('night-bat', 6, 'night', 'monsters'), seen('night-bat', 3, 'day', 'monsters'), seen('coldwater-tuna', 1, 'night', 'fish')]);
    expect(data.regions).toEqual(fixture().regions);
    expect(report.review).toHaveLength(3);
    expect(report.review.join('\n')).toMatch(/above R4/);
    expect(report.review.join('\n')).toMatch(/night-only.*day|day-only.*night/);
  });
});

describe('mergeNotes: absent', () => {
  it('skips spawns where absence means nothing', () => {
    const { data, report } = run([absent('great-platinum-deposit', 5)]);
    expect(data.regions).toEqual(fixture().regions);
    expect(report.skipped.join('\n')).toMatch(/tier-roll/);
  });

  it('skips absences that are expected: below the rank, wrong time, or no rank recorded', () => {
    const { data, report } = run([absent('platinum-deposit', 3), absent('coldwater-tuna', 5, 'night', 'fish'), absent('gold-deposit', null)]);
    expect(data.regions).toEqual(fixture().regions);
    expect(report.skipped).toHaveLength(3);
  });

  it('disputes a single-source entry with a dated note', () => {
    const { data } = run([absent('gold-deposit', 3, 'night')]);
    expect(ore(data, 'Gold Deposit')).toMatchObject({ confidence: 'disputed', note: 'Not found in game at R3 (night) on 2026-10-24.' });
  });

  it('appends to a disputed entry and keeps it disputed', () => {
    const tuna = region(run([absent('coldwater-tuna', 5, 'day', 'fish')]).data).fish[0];
    expect(tuna.confidence).toBe('disputed');
    expect(tuna.note).toBe('Sources disagree. Not found in game at R5 (day) on 2026-10-24.');
  });

  it('only flags a confirmed entry for review, and never deletes', () => {
    const { data, report } = run([absent('platinum-deposit', 6)]);
    expect(data.regions).toEqual(fixture().regions);
    expect(report.review.join('\n')).toMatch(/Platinum Deposit/);
  });
});

describe('mergeNotes: names', () => {
  it('renames a monster and drops its name status, reporting the key change', () => {
    const { data, report } = run([note('name', { monster: 'burrow-star', shown: 'Burrow Star', inGame: ' Burrowstar ' })]);
    expect(data.monsters['burrow-star']).toEqual({ name: 'Burrowstar', drops: fixture().monsters['burrow-star'].drops });
    expect(report.applied.join('\n')).toMatch(/Burrow Star → Burrowstar.*links/);
  });

  it('just confirms a name that matches', () => {
    expect(run([note('name', { monster: 'burrow-star', shown: 'Burrow Star', inGame: 'Burrow Star' })]).data.monsters['burrow-star'].nameStatus).toBeUndefined();
  });

  it('renames a drop everywhere it appears and marks it official', () => {
    const { data, report } = run([note('drop-name', { ja: '羊毛', shown: 'Wool', inGame: 'Fleece' })]);
    const all = [...ore(data, 'Gold Deposit').drops, ...data.monsters['burrow-star'].drops, ...data.monsters['night-bat'].drops];
    expect(all).toEqual(Array(3).fill({ name: 'Fleece', ja: '羊毛', official: true }));
    expect(report.applied.join('\n')).toMatch(/3 places/);
  });

  it('sends name notes from a non-English game to review', () => {
    const { data, report } = run([note('drop-name', { ja: '羊毛', shown: 'Wool', inGame: 'Laine' }), note('name', { monster: 'burrow-star', shown: 'Burrow Star', inGame: 'Étoile' })], { gameLanguage: 'other' });
    expect(data.monsters).toEqual(fixture().monsters);
    expect(report.review).toHaveLength(2);
  });
});

describe('mergeNotes: spots and places', () => {
  const spot = (entry, x, y, category = 'monsters') => note('spot', { ...at(entry, category), x, y, zoom: 2 });

  it('adds an approximate spot and skips a near-duplicate', () => {
    const { data, report } = run([spot('big-boss', 0.3, 0.4), spot('big-boss', 0.31, 0.405)]);
    expect(app(data, 'big-boss').spots).toEqual([{ x: 0.3, y: 0.4, precision: 'approx', sources: ['ingame'] }]);
    expect(report.skipped.join('\n')).toMatch(/duplicate/);
  });

  it('skips a spot on a spawn that is not at one place', () => {
    expect(run([spot('burrow-star', 0.3, 0.4)]).report.skipped.join('\n')).toMatch(/overworld/);
  });

  it('adds a place, and moves one that already exists', () => {
    const { data, report } = run([note('place', { region: 'alpha', name: 'Lake', x: 0.5, y: 0.6, zoom: 1 }), note('place', { region: 'alpha', name: 'old mine', x: 0.2, y: 0.25, zoom: 3 })]);
    expect(region(data).places).toEqual([{ name: 'Old Mine', x: 0.2, y: 0.25 }, { name: 'Lake', x: 0.5, y: 0.6 }]);
    expect(report.applied.join('\n')).toMatch(/moved/i);
  });
});

describe('mergeNotes: review, unknowns and repeats', () => {
  it('puts free text up for review only', () => {
    const { data, report } = run([note('text', { ...at('gold-deposit'), text: 'Behind the waterfall.' })]);
    expect(data.regions).toEqual(fixture().regions);
    expect(report.review.join('\n')).toMatch(/Behind the waterfall/);
  });

  it('skips notes about unknown regions, entries, monsters and drops, with the reason', () => {
    const { report } = run([
      note('seen', { region: 'atlantis', category: 'ore', entry: 'x', rank: 1, time: null }),
      seen('mithril-deposit', 1),
      note('name', { monster: 'nessie', shown: 'Nessie', inGame: 'Nessie' }),
      note('drop-name', { ja: '謎', shown: 'Riddle', inGame: 'Riddle' }),
    ]);
    expect(report.skipped).toHaveLength(4);
    expect(report.skipped.join('\n')).toMatch(/unknown region "atlantis"/);
    expect(report.skipped.join('\n')).toMatch(/unknown entry/);
    expect(report.skipped.join('\n')).toMatch(/unknown monster "nessie"/);
    expect(report.skipped.join('\n')).toMatch(/no drop/);
  });

  it('records merged ids and changes nothing on a second run', () => {
    const notes = [seen('gold-deposit', 3), note('place', { region: 'alpha', name: 'Lake', x: 0.5, y: 0.6, zoom: 1 })];
    const first = run(notes);
    expect(first.data.fieldNotesMerged).toEqual(notes.map((x) => x.id));
    expect(first.merged).toEqual(notes);
    const second = mergeNotes(first.data, notes, { archivedIds: first.data.fieldNotesMerged });
    expect(second.data).toEqual(first.data);
    expect(second.merged).toEqual([]);
    expect(second.report.skipped.join('\n')).toMatch(/already merged/);
  });

  it('does not touch its input', () => {
    const d = fixture();
    mergeNotes(d, [seen('gold-deposit', 3)]);
    expect(d).toEqual(fixture());
  });

  it('writes a Markdown report with Applied, Needs review and Skipped', () => {
    const md = reportMarkdown(run([seen('gold-deposit', 3), absent('platinum-deposit', 6), absent('great-platinum-deposit', 5)]).report);
    expect(md).toMatch(/## Applied \(1\)[\s\S]*## Needs review \(1\)[\s\S]*## Skipped \(1\)/);
  });
});

describe('mergeNotes on the real data', () => {
  it('produces data that still validates', () => {
    const notes = [
      note('seen', { region: 'moltana', category: 'monsters', entry: 'burrow-star', rank: 4, time: 'night' }),
      note('absent', { region: 'moltana', category: 'ore', entry: 'gold-deposit', rank: 3, time: 'day' }),
      note('spot', { region: 'moltana', category: 'ore', entry: 'golemstone', x: 0.62, y: 0.21, zoom: 2 }),
      note('place', { region: 'moltana', name: 'Agekara Cave', x: 0.58, y: 0.22, zoom: 2 }),
      note('name', { monster: 'burrow-star', shown: 'Burrow Star', inGame: 'Burrow Star' }),
      note('drop-name', { ja: '羊毛', shown: 'Wool', inGame: 'Wool' }),
      note('text', { region: 'moltana', category: 'ore', entry: 'golemstone', text: 'Near the lava fall.' }),
    ];
    const { data } = mergeNotes(structuredClone(raw), notes);
    expect(() => validateRegions(data)).not.toThrow();
    expect(data.fieldNotesMerged).toHaveLength(7);
  });
});
