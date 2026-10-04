import { h, reducedMotion, CAT_LABEL, PIN_CATS } from './dom.js';
import { search } from '../lib/search.js';
import { formatRank, rankOrder } from '../lib/rank.js';
import { highlight } from '../lib/escape.js';

const VIEW_CATS = { all: ['ore', 'trees', 'fish', 'other'], ore: ['ore'], trees: ['trees'], fish: ['fish'] };

const rank = (r) => h('span', { class: 'rank', dataset: { rank: r } }, formatRank(r));

function entryRow(entry, query) {
  return h('li', {},
    h('span', { class: 'what' },
      h('span', { class: 'name', html: highlight(entry.name, query) }),
      entry.note && h('span', { class: 'note' }, entry.note)),
    rank(entry.minRank));
}

export function createPanel(store, data) {
  const { regions } = data;
  const byId = new Map(regions.map((r) => [r.id, r]));
  const el = h('section', { id: 'panel', class: 'panel', 'aria-live': 'polite', tabindex: '-1' });
  const select = (id, fromResults = false) => store.set({ selectedId: id, fromResults });

  function regionView(r, s) {
    const groups = VIEW_CATS[s.category]
      .map((c) => ({ c, list: r[c].filter((e) => !s.type || e.type === s.type) }))
      .filter((g) => g.list.length);
    return [
      h('div', { class: 'panel-head' },
        h('div', {},
          s.fromResults && h('button', { class: 'back', type: 'button', onclick: () => store.set({ selectedId: null, fromResults: false }) }, '← Back to search results'),
          h('h2', {}, r.name),
          h('p', { class: 'where' }, r.where)),
        h('button', { class: 'close', type: 'button', 'aria-label': 'Close region', onclick: () => store.set({ selectedId: null, fromResults: false }) }, '×')),
      s.type && h('p', { class: 'scope' }, `Showing ${s.type} only. `,
        h('button', { class: 'link', type: 'button', onclick: () => store.set({ type: null }) }, `Show all ${CAT_LABEL[s.category].toLowerCase()}`)),
      groups.length
        ? groups.map(({ c, list }) => h('div', { class: 'group' },
            h('h3', {}, h('span', { class: 'dot', dataset: { cat: c } }), CAT_LABEL[c]),
            h('ul', {}, list.map((e) => entryRow(e, s.query)))))
        : h('p', { class: 'empty' }, `No ${s.type ?? CAT_LABEL[s.category].toLowerCase()} in this region.`),
    ];
  }

  function describeFilter(s) {
    return [s.type, s.category !== 'all' && CAT_LABEL[s.category].toLowerCase()].filter(Boolean).join(' / ');
  }

  function resultsView(s) {
    const matches = search(regions, s.query, s.category, s.type)
      .map((m, i) => ({ ...m, i }))
      .sort((a, b) => rankOrder(a.entry.minRank) - rankOrder(b.entry.minRank) || a.i - b.i);
    const filt = describeFilter(s);
    if (!matches.length) {
      return [
        h('h2', {}, 'No matches'),
        h('p', { class: 'empty' },
          `Nothing in Ginormosia matches “${s.query.trim()}”${filt ? ` with the ${filt} filter on` : ''}. `,
          filt && h('button', { class: 'link', type: 'button', onclick: () => store.set({ category: 'all', type: null }) }, 'Search everything'),
          filt && '. ',
          'Some resources are not found in Ginormosia at all; see the list below.'),
      ];
    }
    const regionCount = new Set(matches.map((m) => m.regionId)).size;
    const title = s.query.trim() ? `“${s.query.trim()}”` : s.type;
    return [
      h('h2', {}, title),
      h('p', { class: 'where' }, `${matches.length} spawn${matches.length === 1 ? '' : 's'} in ${regionCount} region${regionCount === 1 ? '' : 's'}${filt && s.query.trim() ? ` · ${filt}` : ''} · earliest rank first`),
      h('ul', { class: 'results' }, matches.map(({ regionId, category, entry }) => {
        const r = byId.get(regionId);
        return h('li', {}, h('button', { type: 'button', onclick: () => select(regionId, true) },
          h('span', { class: 'dot', dataset: { cat: category }, 'aria-hidden': 'true' }),
          h('span', { class: 'what' },
            h('span', { class: 'name', html: highlight(entry.name, s.query) }),
            h('span', { class: 'note' }, r.name, entry.note ? ` · ${entry.note}` : '')),
          rank(entry.minRank)));
      })),
    ];
  }

  function idleView(s) {
    const list = regions
      .filter((r) => s.category === 'all' || r[s.category].length)
      .slice().sort((a, b) => a.name.localeCompare(b.name));
    return [
      h('h2', {}, 'Regions'),
      h('p', { class: 'where' }, 'Tap a pin or a region, search above, or pick a type to see where it spawns.'),
      h('ul', { class: 'region-list' }, list.map((r) => h('li', {},
        h('button', { type: 'button', onclick: () => select(r.id) },
          h('span', { class: 'what' }, h('span', { class: 'name' }, r.name), h('span', { class: 'note' }, r.where)),
          h('span', { class: 'dots', 'aria-hidden': 'true' },
            PIN_CATS.filter((c) => r[c].length).map((c) => h('span', { class: 'dot', dataset: { cat: c }, title: `${r[c].length} ${CAT_LABEL[c].toLowerCase()}` }))))))),
    ];
  }

  function render(s, prev) {
    const r = s.selectedId && byId.get(s.selectedId);
    const active = s.query.trim() || s.type;
    el.replaceChildren(...[r ? regionView(r, s) : active ? resultsView(s) : idleView(s)].flat(2).filter(Boolean));
    if (r && prev && prev.selectedId !== s.selectedId) {
      el.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  return { el, render };
}
