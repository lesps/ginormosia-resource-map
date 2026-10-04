import { h, reducedMotion } from './dom.js';
import { createStore } from './state.js';
import { createControls } from './controls.js';
import { createMap } from './map.js';
import { createPanel, TAG_INFO } from './panel.js';
import { loadRegions, CATEGORIES } from '../lib/data.js';
import { search, typesFor, entryKey } from '../lib/search.js';
import { toHash, fromHash } from '../lib/hash.js';

export function mountApp(root, json, { imageSrc, hash = '', onHash } = {}) {
  const data = loadRegions(json);
  const { regions } = data;
  const valid = {
    categories: ['all', 'ore', 'trees', 'fish', 'boss'],
    regionIds: regions.map((r) => r.id),
    types: Object.fromEntries(['ore', 'trees', 'fish', 'boss'].map((c) => [c, typesFor(regions, c, data.typeOrder[c]).map((t) => t.type)])),
    entries: Object.fromEntries(regions.map((r) => [r.id, CATEGORIES.flatMap((c) => r[c].map(entryKey))])),
  };
  const initial = fromHash(hash, valid);
  const store = createStore({ ...initial, zoom: 1, fromResults: false });

  const controls = createControls(store, regions, data.typeOrder);
  const map = createMap(store, regions, {
    imageSrc,
    imageAlt: 'Map of Ginormosia with its 15 regions numbered and labelled',
    width: data.image.width,
    height: data.image.height,
  });
  const panel = createPanel(store, data);

  const jump = h('button', {
    class: 'jump', type: 'button', hidden: true,
    onclick: () => panel.el.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }),
  });
  controls.status.append(jump);

  root.replaceChildren(
    h('header', { class: 'top' },
      h('div', { class: 'titles' },
        h('h1', {}, 'Ginormosia Resource Map'),
        h('p', { class: 'sub' }, 'Where every ore, tree and fish spawns. Ranks are the Area Rank a node starts at.')),
      h('div', { class: 'top-actions', id: 'top-actions' })),
    controls.el,
    h('main', { class: 'layout' }, map.el, panel.el),
    h('footer', { class: 'foot' },
      h('details', { class: 'mechanics' },
        h('summary', {}, 'How spawns work'),
        h('ul', {}, data.mechanics.map((m) => h('li', {}, m))),
        h('p', { class: 'legend-keys' }, Object.values(TAG_INFO).map(([icon, label]) => h('span', {}, h('span', { 'aria-hidden': 'true' }, icon), ` ${label}`)),
          h('span', {}, h('span', { class: 'approx-mark', 'aria-hidden': 'true' }, '≈'), ' Drop name translated from Japanese; the in-game English name may differ'))),
      h('h2', {}, 'Not found in Ginormosia'),
      h('ul', {}, data.notInGinormosia.map((n) => h('li', {}, h('strong', {}, n.name), ` — ${n.foundAt}`))),
      h('p', {}, 'Common fish, herbs and ground pickups aren’t mapped.'),
      h('p', {}, 'Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), cross-checked with Gamer Guides and Game Rant.'),
      h('p', { class: 'legal' }, h('cite', {}, 'Fantasy Life i: The Girl Who Steals Time'),
        ' and the map artwork © LEVEL-5 Inc. Fan-made, unofficial and not affiliated with or endorsed by LEVEL-5.')),
  );

  function renderStatus(s) {
    const active = s.query.trim() || s.type;
    if (!active || s.selectedId) { jump.hidden = true; return; }
    const matches = search(regions, s.query, s.category, s.type);
    const n = new Set(matches.map((m) => m.regionId)).size;
    jump.hidden = false;
    jump.textContent = n ? `${n} region${n === 1 ? '' : 's'} · ${matches.length} spawn${matches.length === 1 ? '' : 's'} — see list ↓` : 'No matches — see why ↓';
  }

  const render = (s, prev) => {
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
      if (s.openKey) store.set({ openKey: null });
      else if (s.selectedId) store.set({ selectedId: null, fromResults: false });
      else if (s.query || s.type) store.set({ query: '', type: null });
    }
  }, { signal: ac.signal });

  const applyHash = (h) => {
    if (h !== toHash(store.get())) store.set({ ...fromHash(h, valid), fromResults: false });
  };

  return { store, applyHash, actions: root.querySelector('#top-actions'), destroy: () => ac.abort() };
}
