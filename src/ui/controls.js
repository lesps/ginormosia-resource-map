import { h, CAT_LABEL } from './dom.js';
import { typesFor } from '../lib/search.js';
import { formatRank } from '../lib/rank.js';

const FILTERS = ['all', 'ore', 'trees', 'fish'];

export function createControls(store, regions, typeOrder = {}) {
  const input = h('input', {
    id: 'q', type: 'search', placeholder: 'Search, e.g. Platinum or Skytree',
    'aria-label': 'Find a resource', autocomplete: 'off', enterkeyhint: 'search',
    oninput: (e) => store.set({ query: e.target.value, selectedId: null, fromResults: false }),
  });
  const clear = h('button', {
    class: 'clear', type: 'button', 'aria-label': 'Clear search', hidden: true,
    onclick: () => { store.set({ query: '', selectedId: null, fromResults: false }); input.focus(); },
  }, '×');

  const chips = FILTERS.map((cat) =>
    h('button', {
      class: 'chip', type: 'button', dataset: { cat },
      onclick: () => {
        const s = store.get();
        if (s.category !== cat) store.set({ category: cat, type: null, fromResults: s.fromResults && !s.type });
      },
    }, cat !== 'all' && h('span', { class: 'dot', dataset: { cat } }), cat === 'all' ? 'All' : CAT_LABEL[cat]));

  const typeRow = h('div', { class: 'types', role: 'group', 'aria-label': 'Filter by resource type' });
  const status = h('p', { class: 'status', role: 'status' });

  const el = h('div', { class: 'toolbar', role: 'search' },
    h('div', { class: 'searchbox' }, h('span', { class: 'glass', 'aria-hidden': 'true' }), input, clear),
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by category' }, chips),
    typeRow,
    status,
  );

  let renderedCat;
  function renderTypes(s) {
    if (renderedCat !== s.category) {
      renderedCat = s.category;
      const types = typesFor(regions, s.category, typeOrder[s.category]);
      typeRow.replaceChildren(...(types.length ? [
        h('button', { class: 'type-chip', type: 'button', dataset: { type: '' }, onclick: () => store.set({ type: null }) },
          `Any ${CAT_LABEL[s.category].toLowerCase()}`),
        ...types.map(({ type, regions: n, minRank }) =>
          h('button', {
            class: 'type-chip', type: 'button', dataset: { type },
            title: `${type}: ${n} region${n === 1 ? '' : 's'}, from ${formatRank(minRank)}`,
            onclick: () => store.set({ type: store.get().type === type ? null : type, selectedId: null, fromResults: false }),
          }, type, h('span', { class: 'n', 'aria-label': `${n} regions` }, String(n)))),
      ] : []));
      typeRow.hidden = !types.length;
    }
    for (const b of typeRow.children) b.setAttribute('aria-pressed', String((b.dataset.type || null) === s.type));
  }

  function render(s) {
    if (input.value !== s.query) input.value = s.query;
    clear.hidden = !s.query;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === s.category)));
    renderTypes(s);
  }

  return { el, input, status, render };
}
