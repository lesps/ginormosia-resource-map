import { describe, it, expect } from 'vitest';
import raw from '../../data/regions.json';
import { howToFind } from '../../src/lib/find.js';

const region = (id) => raw.regions.find((r) => r.id === id);
const entry = (id, name) => raw.categories.flatMap((c) => region(id)[c].map((e) => ({ ...e, category: c }))).find((e) => e.name === name);
const steps = (id, name) => howToFind(entry(id, name), region(id), entry(id, name).category).join('\n');

describe('howToFind', () => {
  it('gives rank, place, respawn and level steps for a gold-crown fish', () => {
    const s = steps('wdd', 'Golden Swordfish');
    expect(s).toContain("Raise West Dryridge Desert to Area Rank 5 at Googlina's Tower");
    expect(s).toContain('Go to: Off the coast');
    expect(s).toMatch(/respawns 5 minutes/);
    expect(s).toContain('Recommended level 60+');
  });

  it('says when a spawn is available from the start, and when a spot is not recorded', () => {
    const s = steps('wdd', 'Palm Tree');
    expect(s).toMatch(/Area Rank 1/);
    expect(s).toMatch(/Common across West Dryridge Desert/);
    expect(howToFind({ name: 'X', minRank: '1' }, region('wdd'), 'trees').join('\n')).toMatch(/exact spot isn’t recorded/i);
  });

  it('explains legendary challenges', () => {
    const s = steps('wingtip', 'Legendary God Tree');
    expect(s).toMatch(/Area Rank 3 or higher/);
    expect(s).toMatch(/reroll/);
  });

  it('adds the cave respawn trick for gatherable nodes only', () => {
    expect(steps('drakesnout', 'Gold Deposit')).toMatch(/leave and re-enter/);
    expect(steps('drakesnout', 'Black Box')).not.toMatch(/leave and re-enter/);
    expect(steps('drakesnout', 'Black Box')).toMatch(/Anywhere Gate/);
    expect(steps('moltana', 'Superior Red Ore Deposit').match(/re-enter/g)).toHaveLength(1);
  });

  it('notes time of day', () => {
    expect(steps('scorchrock', 'Pyro Panther')).toMatch(/at night/);
  });

  it('explains random tier rolls for higher-tier nodes', () => {
    expect(steps('wdd', 'Great Desert Tree')).toMatch(/Rolls on West Dryridge Desert’s regular spots/);
    expect(howToFind({ name: 'Great Oak Tree', minRank: '3' }, region('wdd'), 'trees').join('\n')).toMatch(/roll at random/);
    expect(steps('wdd', 'Desert Tree')).not.toMatch(/roll at random/);
  });

  it('handles disputed and unrecorded ranks', () => {
    expect(steps('drakesnout', 'Coldwater Tuna')).toMatch(/sources disagree/i);
    expect(steps('viridia', 'Golemstone')).toMatch(/rank isn’t recorded/i);
  });

  it('keeps extra condition details', () => {
    expect(steps('fangshore', 'Legendary Rocket Fish')).toMatch(/Fishing 400\+/);
  });

  it('does not call a normal spawn event-only when a challenge is just an alternative', () => {
    expect(steps('wgg', 'King Woolie')).not.toMatch(/Only appears during/);
    expect(steps('wgg', 'King Woolie')).toMatch(/Also via 'Head of the Flock'/);
    expect(steps('shroomhaven', 'Great Skytree')).not.toMatch(/Only appears during/);
    expect(steps('wingtip', 'Oak / Great Oak Tree')).toMatch(/Only appears during the 'Watch Out for Fakes' event/);
  });

  it('merges a level note instead of repeating it', () => {
    const s = steps('moltana', 'Superior Red Ore Deposit');
    expect(s.match(/30\+/g)).toHaveLength(1);
    expect(s).toContain('Recommended level 30+, even at Area Rank 1.');
  });

  it('uses a plain apostrophe for names ending in s', () => {
    expect(howToFind({ name: 'X', minRank: '1' }, region('fangshore'), 'fish').join('\n')).toContain('Fangshore Isles’ waters');
  });
});

describe('howToFind with spawn types and shadows', () => {
  const r = { id: 'x', name: 'Test Isles', tower: "Test's Tower" };
  const s = (e, cat = 'ore') => howToFind({ minRank: '1', ...e }, r, cat).join('\n');

  it('describes common overworld spawns', () => {
    expect(s({ name: 'Oak Tree', spawnType: 'overworld' }, 'trees')).toMatch(/Common across Test Isles/);
    expect(s({ name: 'Tuna', spawnType: 'overworld' }, 'fish')).toMatch(/sea fishing spots along Test Isles’ coast/);
  });

  it('describes tier rolls without repeating the tier tip', () => {
    const t = s({ name: 'Great Oak Tree', spawnType: 'tier-roll' }, 'trees');
    expect(t).toMatch(/Rolls on Test Isles’ regular spots/);
    expect(t.match(/roll/gi).length).toBeLessThanOrEqual(2);
  });

  it('describes roaming, legendary, challenge and fixed-boss spawns', () => {
    expect(s({ name: 'Iron Golem', spawnType: 'roaming' }, 'boss')).toMatch(/Roams the overworld/);
    expect(s({ name: 'Legendary God Tree', spawnType: 'legendary-event', tags: ['legendary'] }, 'trees')).toMatch(/marked on the map while active/);
    expect(s({ name: 'Giant Ancient Fossil', spawnType: 'area-challenge' })).toMatch(/only during the challenge/);
    expect(s({ name: 'Stone Golem', spawnType: 'fixed-boss' }, 'boss')).toMatch(/shows on the in-game map/);
  });

  it('prefers a recorded spot over the spawn type', () => {
    expect(s({ name: 'Oak Tree', spawnType: 'overworld', where: 'Around the town' }, 'trees')).toContain('Go to: Around the town.');
  });

  it('adds shadow size for fish', () => {
    expect(s({ name: 'Tuna', shadow: 'big' }, 'fish')).toMatch(/big fish shadows/);
    expect(s({ name: 'Flying Fish', shadow: 'small' }, 'fish')).toMatch(/small fish shadows/);
  });
});
