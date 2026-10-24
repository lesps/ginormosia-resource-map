// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import raw from '../../data/regions.json';
import { mount, memoryStorage } from './helpers.js';

let t;
const withMarks = () => {
  const d = structuredClone(raw);
  const molt = d.regions.find((r) => r.id === 'moltana');
  molt.places = [{ name: 'Agekara Cave', x: 0.4, y: 0.3 }];
  d.regions.find((r) => r.id === 'wgg').places = [{ name: 'Fort Gardhart', x: 0.3, y: 0.5 }];
  molt.ore.find((e) => e.name === 'Golemstone').spots = [{ x: 0.62, y: 0.21, precision: 'approx', sources: ['ingame'] }];
  molt.monsters.find((a) => a.id === 'pyro-panther').spots = [{ x: 0.45, y: 0.33, precision: 'exact', sources: ['ingame'] }];
  d.fieldNotesMerged = ['n-20261024-merged'];
  return d;
};
beforeEach(() => { t = mount(withMarks()); });

describe('places on the map', () => {
  it('shows the selected region’s places only', () => {
    expect(t.$$('.place-marker')).toHaveLength(0);
    t.pin('Moltana Wastes').click();
    const marks = t.$$('.place-marker');
    expect(marks).toHaveLength(1);
    expect(marks[0].querySelector('.place-label').textContent).toBe('Agekara Cave');
    expect(marks[0].style.left).toBe('40%');
    expect(marks[0].style.top).toBe('30%');
  });

  it('searches everything at a place when tapped', () => {
    t.chip('Ore').click();
    t.pin('Moltana Wastes').click();
    t.$('.place-marker').click();
    expect(t.$('#q').value).toBe('Agekara Cave');
    expect(t.chip('All').getAttribute('aria-pressed')).toBe('true');
    expect(t.panel().querySelector('h2').textContent).toBe('“Agekara Cave”');
  });
});

describe('spots on the map', () => {
  it('shows an open card’s spots: a halo when approximate, a small pin when exact', () => {
    t.pin('Moltana Wastes').click();
    expect(t.$$('.marks .halo, .marks .spot-pin')).toHaveLength(0);
    t.entry('Golemstone').click();
    const halo = t.$('.marks .halo');
    expect(halo.classList.contains('local')).toBe(false);
    expect(halo.style.left).toBe('62%');
    t.entry('Pyro Panther').click();
    expect(t.$$('.marks .halo')).toHaveLength(0);
    expect(t.$('.marks .spot-pin').style.top).toBe('33%');
  });

  it('shows local unmerged spots dashed, and hides merged ones', () => {
    const storage = memoryStorage();
    storage.set('gnm:notesOn:v1', true);
    storage.set('gnm:notes:v1', [
      { id: 'n-20261024-merged', date: '2026-10-24', kind: 'spot', region: 'moltana', category: 'ore', entry: 'golemstone', x: 0.62, y: 0.21, zoom: 2 },
      { id: 'n-20261024-fresh1', date: '2026-10-24', kind: 'spot', region: 'moltana', category: 'ore', entry: 'golemstone', x: 0.7, y: 0.3, zoom: 2 },
    ]);
    t = mount(withMarks(), { storage });
    t.pin('Moltana Wastes').click();
    t.entry('Golemstone').click();
    const local = t.$$('.halo.local');
    expect(local).toHaveLength(1);
    expect(local[0].style.left).toBe('70%');
  });

  it('says the entry is marked on the map', () => {
    t.pin('Moltana Wastes').click();
    t.entry('Golemstone').click();
    expect(t.detail().textContent).toContain('Marked on the map (approximate, from in-game notes).');
  });

  it('centres on the first spot when zoomed in', () => {
    t.pin('Moltana Wastes').click();
    t.$$('.zoom button').find((b) => b.textContent === '2×').click();
    const scroller = t.$('.map-scroll');
    const calls = [];
    scroller.scrollTo = (o) => calls.push(o);
    t.entry('Golemstone').click();
    expect(calls.length).toBeGreaterThan(0);
  });
});
