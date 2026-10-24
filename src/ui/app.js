import { h, reducedMotion, FILTERS } from './dom.js';
import { createStore } from './state.js';
import { createControls } from './controls.js';
import { createMap } from './map.js';
import { createPanel, TAG_INFO, filterOf } from './panel.js';
import { loadRegions, CATEGORIES } from '../lib/data.js';
import { search, searchPlaces, typesFor, entryKey, isCommonMonster, findEntry } from '../lib/search.js';
import { toHash, fromHash } from '../lib/hash.js';
import { availability, sanitizeRanks } from '../lib/ranks.js';
import { createStorage } from './storage.js';

export const RANKS_KEY = 'gnm:ranks:v1';

export function mountApp(root, json, { imageSrc, hash = '', onHash, storage = createStorage() } = {}) {
  const data = loadRegions(json);
  const { regions } = data;
  const regionById = (id) => regions.find((r) => r.id === id);
  const valid = {
    categories: FILTERS,
    regionIds: regions.map((r) => r.id),
    types: Object.fromEntries(FILTERS.slice(1).map((c) => [c, typesFor(regions, c, data.typeOrder[c]).map((t) => t.type)])),
    entries: Object.fromEntries(regions.map((r) => [r.id, CATEGORIES.flatMap((c) => r[c].map(entryKey))])),
  };
  // A linked common monster, or one above your rank, unfolds its list (see panel.js monsterGroup / lockedFold).
  const withFolds = (s, ranks) => {
    const r = regionById(s.selectedId);
    const e = findEntry(r, s.openKey);
    return {
      ...s,
      commonFor: isCommonMonster(r, s.openKey) ? s.selectedId : null,
      lockedFor: e && availability(e, ranks[r.id]) === 'locked' ? s.selectedId : null,
    };
  };
  const ranks = sanitizeRanks(storage.get(RANKS_KEY, {}), valid.regionIds);
  const store = createStore({ ...withFolds(fromHash(hash, valid), ranks), ranks, mine: false, zoom: 1, fromResults: false });
  store.subscribe((s, prev) => { if (s.ranks !== prev.ranks) storage.set(RANKS_KEY, s.ranks); });

  const controls = createControls(store, regions, data.typeOrder);
  const map = createMap(store, regions, {
    imageSrc,
    imageAlt: 'Map of Ginormosia with its 15 regions numbered and labelled',
    width: data.image.width,
    height: data.image.height,
  });
  const panel = createPanel(store, data);

  const myGame = h('button', { class: 'mygame', type: 'button', 'aria-pressed': 'false', onclick: () => store.set({ mine: !store.get().mine }) }, 'My game');

  const jump = h('button', {
    class: 'jump', type: 'button', hidden: true,
    onclick: () => panel.el.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }),
  });
  controls.status.append(jump);

  root.replaceChildren(
    h('header', { class: 'top' },
      h('div', { class: 'titles' },
        h('h1', {}, 'Ginormosia Resource Map'),
        h('p', { class: 'sub' }, 'Where every ore, tree, fish and monster spawns. Ranks are the Area Rank a spawn starts at.')),
      h('div', { class: 'top-actions', id: 'top-actions' }, myGame)),
    controls.el,
    h('main', { class: 'layout' }, map.el, panel.el),
    h('footer', { class: 'foot' },
      h('details', { class: 'mechanics' },
        h('summary', {}, 'How spawns work'),
        h('ul', {}, data.mechanics.map((m) => h('li', {}, m))),
        h('p', { class: 'legend-hint' }, 'Tap a badge to see everything that has it.'),
        h('p', { class: 'legend-keys' }, Object.entries(TAG_INFO).map(([tag, [icon, label]]) => h('button', {
          class: 'legend-key', type: 'button', dataset: { tag }, title: 'Show everything with this badge',
          onclick: () => {
            store.set({ category: 'all', type: null, tag, selectedId: null, fromResults: false, openKey: null, mine: false });
            controls.el.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
          },
        }, h('span', { 'aria-hidden': 'true' }, icon), ` ${label}`)),
          h('span', {}, h('span', { class: 'approx-mark', 'aria-hidden': 'true' }, '≈'), ' Name translated from Japanese or not yet confirmed; the in-game English name may differ'))),
      h('h2', {}, 'Not found in Ginormosia'),
      h('ul', {}, data.notInGinormosia.map((n) => h('li', {}, h('strong', {}, n.name), ` — ${n.foundAt}`))),
      h('p', {}, 'Common fish, herbs and ground pickups aren’t mapped.'),
      h('p', {}, 'Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), Gamer Guides and Game Rant, plus GameWith, Game8, kokorogu.com, wikiwiki.jp, FLiDB (hassaku74kg.com) and gget.jp (Japanese).'),
      h('p', { class: 'legal' }, h('cite', {}, 'Fantasy Life i: The Girl Who Steals Time'),
        ' and the map artwork © LEVEL-5 Inc. Fan-made, unofficial and not affiliated with or endorsed by LEVEL-5.')),
  );

  function renderStatus(s) {
    const active = s.query.trim() || s.type || s.tag;
    if (!active || s.selectedId || s.mine) { jump.hidden = true; return; }
    const matches = search(regions, filterOf(s));
    const places = searchPlaces(regions, s.query).length;
    const n = new Set(matches.map((m) => m.regionId)).size;
    const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;
    const parts = [places && plural(places, 'place'), matches.length && `${plural(matches.length, 'spawn')} in ${plural(n, 'region')}`].filter(Boolean);
    jump.hidden = false;
    jump.textContent = parts.length ? `${parts.join(' · ')} — see list ↓` : 'No matches — see why ↓';
  }

  const render = (s, prev) => {
    myGame.setAttribute('aria-pressed', String(s.mine));
    controls.render(s);
    map.render(s, prev);
    panel.render(s, prev);
    renderStatus(s);
  };
  store.subscribe(render);
  if (onHash) store.subscribe((s, prev) => {
    const next = toHash(s);
    if (next !== toHash(prev)) onHash(next);
  });
  render(store.get(), null);

  const ac = new AbortController();
  if (globalThis.ResizeObserver) {
    const ro = new ResizeObserver(([e]) => document.documentElement.style.setProperty('--toolbar-h', `${Math.ceil(e.target.offsetHeight)}px`));
    ro.observe(controls.el);
    ac.signal.addEventListener('abort', () => ro.disconnect());
  }
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea, select, [contenteditable]');
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      controls.input.focus();
    } else if (e.key === 'Escape') {
      const s = store.get();
      if (s.mine) store.set({ mine: false });
      else if (s.openKey) store.set({ openKey: null });
      else if (s.selectedId) store.set({ selectedId: null, fromResults: false });
      else if (s.query || s.type || s.tag) store.set({ query: '', type: null, tag: null });
    }
  }, { signal: ac.signal });

  const applyHash = (h) => {
    if (h !== toHash(store.get())) store.set({ ...withFolds(fromHash(h, valid), store.get().ranks), fromResults: false });
  };

  return { store, applyHash, actions: root.querySelector('#top-actions'), destroy: () => ac.abort() };
}
