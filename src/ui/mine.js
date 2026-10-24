import { h } from './dom.js';
import { MAX_RANK } from '../lib/ranks.js';

const rankOptions = (current, blank) => [
  h('option', { value: '', selected: current == null }, blank),
  ...Array.from({ length: MAX_RANK }, (_, i) => h('option', { value: String(i + 1), selected: current === i + 1 }, `R${i + 1}`)),
];

export const rankSelect = (attrs, current, blank = 'Not set') => h('select', attrs, rankOptions(current, blank));

// "My game": your unlocked Area Rank per region, saved on this device (persisted by app.js).
export function createMine(store, regions, { extra = () => null } = {}) {
  const sorted = regions.slice().sort((a, b) => a.name.localeCompare(b.name));
  let armed = null;
  let clearBtn;
  const disarm = () => {
    clearTimeout(armed);
    armed = null;
    if (clearBtn) clearBtn.textContent = 'Clear all';
  };

  const setRank = (id, value) => {
    const ranks = { ...store.get().ranks };
    if (value) ranks[id] = +value;
    else delete ranks[id];
    store.set({ ranks });
  };

  function view(s) {
    clearBtn = h('button', {
      class: 'link clear-ranks', type: 'button', dataset: { focus: 'clear-ranks' },
      onclick: () => {
        if (armed) {
          disarm();
          store.set({ ranks: {} });
        } else {
          armed = setTimeout(disarm, 4000);
          clearBtn.textContent = 'Tap again to clear';
        }
      },
    }, armed ? 'Tap again to clear' : 'Clear all');
    return [
      h('div', { class: 'panel-head' },
        h('div', {}, h('h2', {}, 'Your Area Ranks'),
          h('p', { class: 'where' }, 'The highest Area Rank you’ve reached in each region. Lists then show what you can get now.')),
        h('button', { class: 'close', type: 'button', 'aria-label': 'Close My game', onclick: () => store.set({ mine: false }) }, '×')),
      h('label', { class: 'rank-row set-all-row' }, 'Set all to',
        rankSelect({
          class: 'set-all', dataset: { focus: 'set-all' },
          onchange: (e) => {
            if (e.target.value) store.set({ ranks: Object.fromEntries(regions.map((r) => [r.id, +e.target.value])) });
          },
        }, null, 'Choose…')),
      h('ul', { class: 'mine-list' }, sorted.map((r) => h('li', {},
        h('label', { class: 'rank-row' }, r.name,
          rankSelect({ class: 'region-rank', dataset: { region: r.id, focus: `rank:${r.id}` }, onchange: (e) => setRank(r.id, e.target.value) }, s.ranks[r.id]))))),
      h('p', { class: 'mine-actions' }, clearBtn),
      h('p', { class: 'note' }, 'Saved on this device only.'),
      extra(s),
    ];
  }

  return { view, setRank };
}
