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

  it('says when a spawn is available from the start and the spot is not recorded', () => {
    const s = steps('wdd', 'Palm Tree');
    expect(s).toMatch(/Area Rank 1/);
    expect(s).toMatch(/exact spot isn’t recorded/i);
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
    expect(steps('wdd', 'Great Desert Tree')).toMatch(/roll at random/);
    expect(steps('wdd', 'Desert Tree')).not.toMatch(/roll at random/);
  });

  it('handles disputed and unrecorded ranks', () => {
    expect(steps('scorchrock', 'Hot Spring Bream')).toMatch(/sources disagree/i);
    expect(steps('viridia', 'Golemstone')).toMatch(/rank isn’t recorded/i);
  });

  it('keeps extra condition details', () => {
    expect(steps('fangshore', 'Legendary Rocket Fish')).toMatch(/Fishing 400\+/);
  });

  it('does not call a normal spawn event-only when a challenge is just an alternative', () => {
    expect(steps('wgg', 'King Woolie')).not.toMatch(/Only appears during/);
    expect(steps('wgg', 'King Woolie')).toMatch(/Also via 'Head of the Flock'/);
    expect(steps('shroomhaven', 'Great Skytree')).not.toMatch(/Only appears during/);
    expect(steps('shroomhaven', 'Great Darkness Tree')).toMatch(/Only appears during an event/);
  });

  it('merges a level note instead of repeating it', () => {
    const s = steps('moltana', 'Superior Red Ore Deposit');
    expect(s.match(/30\+/g)).toHaveLength(1);
    expect(s).toContain('Recommended level 30+, even at Area Rank 1.');
  });

  it('uses a plain apostrophe for names ending in s', () => {
    expect(steps('fangshore', 'Godfish')).toContain('Fangshore Isles’ waters');
  });
});
