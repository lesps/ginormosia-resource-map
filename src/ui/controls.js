import { h, CAT_LABEL, FILTERS } from './dom.js';
import { typesFor, tagsFor } from '../lib/search.js';
import { formatRank } from '../lib/rank.js';
import { TAG_INFO, TYPE_TAG, TAG_SHORT, tagLabel } from './panel.js';

export function createControls(store, regions, typeOrder = {}) {
  const input = h('input', {
    id: 'q', type: 'search', placeholder: 'Search, e.g. Platinum or Mimic',
    'aria-label': 'Find a resource', autocomplete: 'off', enterkeyhint: 'search',
    oninput: (e) => store.set({ query: e.target.value, selectedId: null, fromResults: false, openKey: null, mine: false }),
  });
  const clear = h('button', {
    class: 'clear', type: 'button', 'aria-label': 'Clear search', hidden: true,
    onclick: () => { store.set({ query: '', selectedId: null, fromResults: false, openKey: null }); input.focus(); },
  }, '×');

  const chips = FILTERS.map((cat) =>
    h('button', {
      class: 'chip', type: 'button', dataset: { cat },
      onclick: () => {
        const s = store.get();
        if (s.category !== cat || s.mine) store.set({ category: cat, type: null, tag: null, fromResults: s.fromResults && !s.type && !s.tag, mine: false });
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

  const tags = tagsFor(regions, Object.keys(TAG_SHORT));
  // Under All, the second row filters by badge instead of by type.
  function tagChips() {
    return [
      h('button', { class: 'tag-chip', type: 'button', dataset: { tag: '' }, onclick: () => store.set({ tag: null, mine: false }) }, 'All'),
      ...tags.map(({ tag, regions: n }) => h('button', {
        class: 'tag-chip', type: 'button', dataset: { tag }, title: `${TAG_INFO[tag][1]}: ${n} region${n === 1 ? '' : 's'}`,
        onclick: () => store.set({ tag: store.get().tag === tag ? null : tag, selectedId: null, fromResults: false, openKey: null, mine: false }),
      }, tagLabel(tag), h('span', { class: 'n', 'aria-label': `${n} regions` }, String(n)))),
    ];
  }

  let renderedCat;
  function renderTypes(s) {
    if (renderedCat !== s.category && s.category === 'all') {
      renderedCat = s.category;
      typeRow.replaceChildren(...tagChips());
      typeRow.hidden = false;
      typeRow.setAttribute('aria-label', 'Filter by badge');
    } else if (renderedCat !== s.category) {
      renderedCat = s.category;
      typeRow.setAttribute('aria-label', 'Filter by resource type');
      const types = typesFor(regions, s.category, typeOrder[s.category]);
      typeRow.replaceChildren(...(types.length ? [
        h('button', { class: 'type-chip', type: 'button', dataset: { type: '' }, onclick: () => store.set({ type: null, mine: false }) },
          `All ${CAT_LABEL[s.category].toLowerCase()}`),
        ...types.map(({ type, regions: n, minRank }) =>
          h('button', {
            class: 'type-chip', type: 'button', dataset: { type },
            title: `${type}: ${n} region${n === 1 ? '' : 's'}, from ${formatRank(minRank)}`,
            onclick: () => store.set({ type: store.get().type === type ? null : type, selectedId: null, fromResults: false, openKey: null, mine: false }),
          }, s.category === 'monsters' && TYPE_TAG[type] && h('span', { 'aria-hidden': 'true' }, TAG_INFO[TYPE_TAG[type]][0]),
          type, h('span', { class: 'n', 'aria-label': `${n} regions` }, String(n)))),
      ] : []));
      typeRow.hidden = !types.length;
    }
    for (const b of typeRow.children) b.setAttribute('aria-pressed', String(b.classList.contains('tag-chip') ? (b.dataset.tag || null) === s.tag : (b.dataset.type || null) === s.type));
  }

  function render(s) {
    if (input.value !== s.query) input.value = s.query;
    clear.hidden = !s.query;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === s.category)));
    renderTypes(s);
  }

  return { el, input, status, render };
}
