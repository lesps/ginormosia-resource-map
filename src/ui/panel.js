import { h, reducedMotion, CAT_LABEL, PIN_CATS } from './dom.js';
import { search, entryKey } from '../lib/search.js';
import { formatRank, rankOrder, rankTitle } from '../lib/rank.js';
import { highlight } from '../lib/escape.js';
import { howToFind } from '../lib/find.js';

const VIEW_CATS = { all: ['ore', 'trees', 'fish', 'boss', 'other'], ore: ['ore'], trees: ['trees'], fish: ['fish'], boss: ['boss'] };

export const TAG_INFO = {
  'gold-crown': ['👑', 'Gold-crown: from Area Rank 5; respawns 5 minutes after you gather or defeat it'],
  'silver-crown': ['🥈', 'Silver-crown: no cooldown; changing a tower’s rank respawns it'],
  legendary: ['★', 'Legendary challenge: appears at random from Area Rank 3'],
  event: ['⚑', 'Only during an event or area challenge'],
  night: ['🌙', 'Night only'],
  day: ['☀️', 'Day only'],
  cave: ['⛰️', 'In a cave'],
};
const CONF_LABEL = { 'single-source': 'unconfirmed', disputed: 'disputed' };

const rank = (r) => h('span', { class: 'rank', dataset: { rank: r }, title: rankTitle(r) }, formatRank(r));

function badges(entry) {
  return h('span', { class: 'badges' },
    (entry.tags ?? []).map((t) => h('span', { class: 'tag', role: 'img', dataset: { tag: t }, 'aria-label': TAG_INFO[t][1], title: TAG_INFO[t][1] }, TAG_INFO[t][0])),
    entry.level && h('span', { class: 'lv', title: `Recommended level ${entry.level}` }, `Lv${entry.level}`),
    CONF_LABEL[entry.confidence] && h('span', { class: 'conf', dataset: { conf: entry.confidence } }, CONF_LABEL[entry.confidence]));
}

function dropItem(d) {
  return h('span', {
    class: d.official ? 'drop' : 'drop approx',
    title: d.official ? d.ja ?? null : `Translated from Japanese (${d.ja}); the in-game English name may differ`,
  }, d.name, !d.official && h('span', { class: 'approx-mark', 'aria-hidden': 'true' }, '≈'));
}

function dropList(drops) {
  const groups = new Map();
  for (const d of drops) {
    const k = d.from ? `${d.from}${d.when ? ` (${d.when})` : ''}` : '';
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }
  return h('ul', { class: 'drops' }, [...groups].map(([from, items]) => h('li', {},
    from && h('strong', {}, `${from}: `),
    items.flatMap((d, i) => [i ? ', ' : null, dropItem(d)]))));
}

const sourceLabel = (data, k) => data.sources[k].replace(/\s*\(.*\)\s*$/, '');

export function createPanel(store, data) {
  const { regions } = data;
  const byId = new Map(regions.map((r) => [r.id, r]));
  const el = h('section', { id: 'panel', class: 'panel', 'aria-live': 'polite', tabindex: '-1' });
  const select = (id, fromResults = false, openKey = null) => store.set({ selectedId: id, fromResults, openKey });

  function detail(r, entry, cat, id, open) {
    const rows = [
      ['How to find', h('ol', { class: 'find' }, howToFind(entry, r, cat).map((step) => h('li', {}, step)))],
      ['Drops', entry.drops?.length && dropList(entry.drops)],
      ['Note', entry.note],
      ['Sources', entry.sources?.length && entry.sources.map((k) => sourceLabel(data, k)).join(' · ')],
    ].filter(([, v]) => v);
    return h('div', { class: 'detail', id, hidden: !open },
      h('dl', {}, rows.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])));
  }

  function entryRow(r, entry, cat, s) {
    const key = entryKey(entry);
    const open = s.openKey === key;
    const id = `d-${r.id}-${key}`;
    return h('li', { class: open ? 'open' : null, dataset: { key } },
      h('button', {
        class: 'entry', type: 'button', 'aria-expanded': String(open), 'aria-controls': id,
        onclick: () => store.set({ openKey: open ? null : key }),
      },
        h('span', { class: 'what' },
          h('span', { class: 'name', html: highlight(entry.name, s.query) }),
          entry.where && h('span', { class: 'note clamp' }, entry.where)),
        badges(entry),
        rank(entry.minRank),
        h('span', { class: 'chev', 'aria-hidden': 'true' })),
      detail(r, entry, cat, id, open));
  }

  function regionView(r, s) {
    const groups = VIEW_CATS[s.category]
      .map((c) => ({ c, list: r[c].filter((e) => !s.type || e.type === s.type) }))
      .filter((g) => g.list.length);
    const close = () => store.set({ selectedId: null, fromResults: false, openKey: null });
    return [
      h('div', { class: 'panel-head' },
        h('div', {},
          s.fromResults && h('button', { class: 'back', type: 'button', onclick: close }, '← Back to search results'),
          h('h2', {}, r.name),
          h('p', { class: 'where' }, r.where)),
        h('button', { class: 'close', type: 'button', 'aria-label': 'Close region', onclick: close }, '×')),
      (r.summary || r.tower) && h('div', { class: 'region-info' },
        r.summary && h('p', {}, r.summary),
        h('p', { class: 'note' }, [r.tower && `Tower: ${r.tower}`, r.landmarks?.length && `Landmarks: ${r.landmarks.join(' · ')}`].filter(Boolean).join('. '))),
      s.type && h('p', { class: 'scope' }, `Showing ${s.type} only. `,
        h('button', { class: 'link', type: 'button', onclick: () => store.set({ type: null }) }, `Show all ${CAT_LABEL[s.category].toLowerCase()}`)),
      groups.length
        ? groups.map(({ c, list }) => h('div', { class: 'group' },
            h('h3', {}, h('span', { class: 'dot', dataset: { cat: c } }), CAT_LABEL[c]),
            h('ul', { class: 'entries' }, list.map((e) => entryRow(r, e, c, s)))))
        : h('p', { class: 'empty' }, `No ${s.type ?? CAT_LABEL[s.category].toLowerCase()} in this region.`),
    ];
  }

  function describeFilter(s) {
    return [s.type, s.category !== 'all' && CAT_LABEL[s.category].toLowerCase()].filter(Boolean).join(' / ');
  }

  function resultsView(s) {
    const matches = search(regions, s.query, s.category, s.type)
      .map((m, i) => ({ ...m, i }))
      .sort((a, b) => !!a.drop - !!b.drop || rankOrder(a.entry.minRank) - rankOrder(b.entry.minRank) || a.i - b.i);
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
      h('p', { class: 'where' }, `${matches.length} match${matches.length === 1 ? '' : 'es'} in ${regionCount} region${regionCount === 1 ? '' : 's'}${filt && s.query.trim() ? ` · ${filt}` : ''} · earliest rank first`),
      h('ul', { class: 'results' }, matches.map(({ regionId, category, entry, drop }) => {
        const r = byId.get(regionId);
        return h('li', {}, h('button', { type: 'button', onclick: () => select(regionId, true, entryKey(entry)) },
          h('span', { class: 'dot', dataset: { cat: category }, 'aria-hidden': 'true' }),
          h('span', { class: 'what' },
            h('span', { class: 'name', html: highlight(entry.name, s.query) }),
            h('span', { class: 'note' }, r.name, drop ? h('span', {}, ' · drops ', h('span', { html: highlight(drop.name, s.query) })) : entry.where ? ` · ${entry.where}` : '')),
          badges(entry),
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
      h('p', { class: 'where' }, 'Tap a pin or a region, search above (names and drops), or pick a type to see where it spawns.'),
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
    el.replaceChildren(...[r ? regionView(r, s) : active ? resultsView(s) : idleView(s)].flat(3).filter(Boolean));
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    if (r && s.openKey && (!prev || prev.openKey !== s.openKey || prev.selectedId !== s.selectedId)) {
      el.querySelector(`li[data-key="${s.openKey}"]`)?.scrollIntoView?.({ behavior, block: 'nearest' });
    } else if (r && prev && prev.selectedId !== s.selectedId) {
      el.scrollIntoView?.({ behavior, block: 'nearest' });
    }
  }

  return { el, render };
}
