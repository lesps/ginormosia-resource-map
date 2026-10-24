import { h, reducedMotion, CAT_LABEL, PIN_CATS } from './dom.js';
import { search, searchPlaces, sortMatches, entryKey, isCommonMonster, findEntry } from '../lib/search.js';
import { formatRank, rankTitle } from '../lib/rank.js';
import { highlight, excerpt } from '../lib/escape.js';
import { howToFind } from '../lib/find.js';
import { availability, lowestRank } from '../lib/ranks.js';
import { createMine, rankSelect } from './mine.js';
import { createFieldNotes } from './fieldnotes.js';

// Monsters go last in the All view so a long monster list doesn't bury the resources.
const VIEW_CATS = { all: ['ore', 'trees', 'fish', 'other', 'monsters'] };
const viewCats = (category) => VIEW_CATS[category] ?? [category];

export const TAG_INFO = {
  'gold-crown': ['👑', 'Gold-crown: from Area Rank 5; respawns 5 minutes after you gather or defeat it'],
  'silver-crown': ['🥈', 'Silver-crown: no cooldown; changing a tower’s rank respawns it'],
  legendary: ['★', 'Legendary challenge: appears at random from Area Rank 3'],
  event: ['⚑', 'Only during an event or area challenge'],
  night: ['🌙', 'Night only'],
  day: ['☀️', 'Day only'],
  cave: ['⛰️', 'In a cave'],
  mount: ['🐴', 'Can drop a mount'],
};
// Badge filter chips: short labels, in chip order.
export const TAG_SHORT = {
  'gold-crown': 'Gold-crown', 'silver-crown': 'Silver-crown', legendary: 'Legendary', event: 'Challenge',
  mount: 'Mount', night: 'Night only', day: 'Day only', cave: 'Cave',
};
export const tagLabel = (t) => `${TAG_INFO[t][0]} ${TAG_SHORT[t]}`;
export const filterOf = (s) => ({ query: s.query, category: s.category, type: s.type, tag: s.tag });
// The badge each monster type carries, shown on its type chip too.
export const TYPE_TAG = { 'Gold-crown boss': 'gold-crown', 'Silver-crown': 'silver-crown', Legendary: 'legendary', Challenge: 'event' };
const NAME_NOTE = {
  unofficial: 'Translated from Japanese; the in-game English name may differ.',
  probable: 'Matched to an English list by region only; the in-game name may differ.',
};
const CONF_LABEL = { 'single-source': 'unconfirmed', disputed: 'disputed' };

const rank = (r, cat) => h('span', { class: 'rank', dataset: { rank: r }, title: rankTitle(r, cat) }, formatRank(r));
const approx = (title) => h('span', { class: 'approx-mark', title, 'aria-label': title, role: 'img' }, '≈');

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

const dropList = (drops, edit = () => null) => h('p', { class: 'drops' }, drops.flatMap((d, i) => [i ? ', ' : null, dropItem(d), edit(d)]));

const sourceLabel = (data, k) => data.sources[k].replace(/\s*\(.*\)\s*$/, '');

const locked = (s, regionId, entry) => availability(entry, s.ranks?.[regionId]) === 'locked';

export function createPanel(store, data) {
  const { regions } = data;
  const byId = new Map(regions.map((r) => [r.id, r]));
  const el = h('section', { id: 'panel', class: 'panel', 'aria-live': 'polite', tabindex: '-1' });
  // Opening a folded entry (common monster, or one above your rank) unfolds it, so closing the card leaves the row in place.
  const select = (id, fromResults = false, openKey = null) => {
    const e = findEntry(byId.get(id), openKey);
    store.set({
      selectedId: id, fromResults, openKey,
      ...(isCommonMonster(byId.get(id), openKey) && { commonFor: id }),
      ...(e && locked(store.get(), id, e) && { lockedFor: id }),
    });
  };
  const notes = createFieldNotes(store, data, { select });
  const mine = createMine(store, regions, { extra: notes.settings });

  function detail(r, entry, cat, id, open, s) {
    const rows = [
      ['How to find', h('ol', { class: 'find' }, howToFind(entry, r, cat, { unlocked: s.ranks?.[r.id] }).map((step) => h('li', {}, step)))],
      ['Drops', entry.drops?.length && dropList(entry.drops, s.notesOn ? (d) => notes.dropEdit(r, entry, cat, d, s) : undefined)],
      ['Element', entry.element],
      ['Name', NAME_NOTE[entry.nameStatus]],
      ['Note', entry.note],
      ['Sources', entry.sources?.length && entry.sources.map((k) => sourceLabel(data, k)).join(' · ')],
      ['Field notes', s.notesOn && notes.cardRow(r, entry, cat, s)],
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
        class: 'entry', type: 'button', 'aria-expanded': String(open), 'aria-controls': id, dataset: { focus: `entry:${key}` },
        onclick: () => store.set({ openKey: open ? null : key }),
      },
        h('span', { class: 'what' },
          h('span', { class: 'title' },
            h('span', { class: 'name', html: highlight(entry.name, s.query) }),
            NAME_NOTE[entry.nameStatus] && approx(NAME_NOTE[entry.nameStatus])),
          entry.where && h('span', { class: 'note clamp' }, entry.where)),
        badges(entry),
        rank(entry.minRank, cat),
        h('span', { class: 'chev', 'aria-hidden': 'true' })),
      detail(r, entry, cat, id, open, s));
  }

  // With a rank set, entries above it fold to the end of their group (one region at a time, like commonFor).
  function lockedFold(r, c, list, s) {
    if (!list.length) return null;
    const open = s.lockedFor === r.id;
    const from = Math.min(...list.map((e) => lowestRank(e.minRank)));
    return {
      list: open ? list : [],
      toggle: h('button', {
        class: 'link show-locked', type: 'button', 'aria-expanded': String(open), dataset: { focus: `show-locked:${c}` },
        onclick: () => store.set({ lockedFor: open ? null : r.id, ...(open && list.some((e) => entryKey(e) === s.openKey) && { openKey: null }) }),
      }, open ? 'Hide higher-rank entries' : `Show ${list.length} more from R${from}`),
    };
  }

  function group(r, c, all, s) {
    const above = all.filter((e) => locked(s, r.id, e));
    const now = above.length ? all.filter((e) => !above.includes(e)) : all;
    const { list, more } = c === 'monsters' ? monsterGroup(r, now, s) : { list: now };
    const fold = lockedFold(r, c, above, s);
    return h('div', { class: 'group' },
      h('h3', {}, h('span', { class: 'dot', dataset: { cat: c } }), CAT_LABEL[c]),
      list.length > 0 && h('ul', { class: 'entries' }, list.map((e) => entryRow(r, e, c, s))),
      more,
      fold?.list.length > 0 && h('ul', { class: 'entries locked' }, fold.list.map((e) => entryRow(r, e, c, s))),
      fold?.toggle);
  }

  // In the All view, common monsters fold behind a toggle.
  function monsterGroup(r, list, s) {
    const common = list.filter((e) => e.type === 'Common');
    if (s.category !== 'all' || s.tag || !common.length) return { list };
    const expanded = s.commonFor === r.id;
    return {
      list: expanded ? list : list.filter((e) => e.type !== 'Common'),
      more: h('button', {
        class: 'link show-common', type: 'button', 'aria-expanded': String(expanded), dataset: { focus: 'show-common' },
        onclick: () => store.set({ commonFor: expanded ? null : r.id, ...(expanded && isCommonMonster(r, s.openKey) && { openKey: null }) }),
      }, expanded ? 'Hide common monsters' : `Show ${common.length} common monster${common.length === 1 ? '' : 's'}`),
    };
  }

  function regionView(r, s) {
    const groups = viewCats(s.category)
      .map((c) => ({ c, list: r[c].filter((e) => (!s.type || e.type === s.type) && (!s.tag || e.tags?.includes(s.tag))) }))
      .filter((g) => g.list.length);
    const setRank = (value) => mine.setRank(r.id, value);
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
      h('label', { class: 'rank-row your-rank-row' }, 'Your rank here',
        rankSelect({ class: 'your-rank', dataset: { focus: 'your-rank' }, onchange: (e) => setRank(e.target.value) }, s.ranks?.[r.id])),
      s.notesOn && notes.bar(r, s),
      s.notesOn && notes.questions(r, s),
      s.type && h('p', { class: 'scope' }, `Showing ${s.type} only. `,
        h('button', { class: 'link', type: 'button', onclick: () => store.set({ type: null }) }, `Show all ${CAT_LABEL[s.category].toLowerCase()}`)),
      s.tag && h('p', { class: 'scope' }, `Showing ${tagLabel(s.tag)} only. `,
        h('button', { class: 'link', type: 'button', onclick: () => store.set({ tag: null }) }, 'Show everything')),
      groups.length
        ? groups.map(({ c, list }) => group(r, c, list, s))
        : h('p', { class: 'empty' }, `No ${s.type ?? (s.tag ? `${tagLabel(s.tag)} entries` : CAT_LABEL[s.category].toLowerCase())} in this region.`),
    ];
  }

  function describeFilter(s) {
    return [s.type, s.tag && tagLabel(s.tag), s.category !== 'all' && CAT_LABEL[s.category].toLowerCase()].filter(Boolean).join(' / ');
  }

  // The second line of a result: what matched, when it wasn't the name.
  function matchNote(r, { entry, via, drop }, q) {
    if (drop) return [r.name, h('span', {}, ' · drops ', h('span', { html: highlight(drop.name, q) }))];
    if (via === 'where' || via === 'conditions' || via === 'note') {
      const during = via === 'conditions' && /challenge|event/i.test(entry.conditions) ? 'during ' : '';
      return [r.name, ' · ', during, h('span', { html: highlight(excerpt(entry[via], q), q) })];
    }
    return [r.name, entry.where ? ` · ${entry.where}` : ''];
  }

  function placeList(places, q) {
    return h('ul', { class: 'results' }, places.map(({ regionId, via, text }) => {
      const r = byId.get(regionId);
      return h('li', {}, h('button', { type: 'button', onclick: () => select(regionId, true) },
        h('span', { class: 'place-mark', 'aria-hidden': 'true' }, '📍'),
        h('span', { class: 'what' },
          h('span', { class: 'title' }, h('span', { class: 'name', html: highlight(r.name, q) })),
          h('span', { class: 'note clamp2' }, via === 'region' ? r.where : [via === 'tower' ? 'Tower: ' : '', h('span', { html: highlight(excerpt(text, q, 70), q) })]))));
    }));
  }

  function resultsView(s) {
    const matches = sortMatches(search(regions, filterOf(s)));
    const places = searchPlaces(regions, s.query);
    const filt = describeFilter(s);
    if (!matches.length && !places.length) {
      return [
        h('h2', {}, 'No matches'),
        h('p', { class: 'empty' },
          `Nothing in Ginormosia matches “${s.query.trim()}”${filt ? ` with the ${filt} filter on` : ''}. `,
          filt && h('button', { class: 'link', type: 'button', onclick: () => store.set({ category: 'all', type: null, tag: null }) }, 'Search everything'),
          filt && '. ',
          'Some resources are not found in Ginormosia at all; see the list below.'),
      ];
    }
    const regionCount = new Set(matches.map((m) => m.regionId)).size;
    const title = s.query.trim() ? `“${s.query.trim()}”` : s.type ?? tagLabel(s.tag);
    const resultList = (list) => h('ul', { class: 'results' }, list.map(({ regionId, category, entry, via, drop }) => {
        const r = byId.get(regionId);
        const above = locked(s, regionId, entry);
        return h('li', {}, h('button', { type: 'button', onclick: () => select(regionId, true, entryKey(entry)) },
          h('span', { class: 'dot', dataset: { cat: category }, 'aria-hidden': 'true' }),
          h('span', { class: 'what' },
            h('span', { class: 'title' },
              h('span', { class: 'name', html: highlight(entry.name, s.query) }),
              NAME_NOTE[entry.nameStatus] && approx(NAME_NOTE[entry.nameStatus])),
            h('span', { class: 'note clamp2' }, matchNote(r, { entry, via, drop }, s.query))),
          badges(entry),
          above
            ? h('span', { class: 'rank-col' }, rank(entry.minRank, category), h('span', { class: 'you' }, `you: R${s.ranks[regionId]}`))
            : rank(entry.minRank, category)));
      }));
    // With any listed region's rank set, split into what you can get now and what needs ranking up.
    const split = matches.some((m) => s.ranks?.[m.regionId]);
    const above = split ? matches.filter((m) => locked(s, m.regionId, m.entry)) : [];
    const now = matches.filter((m) => !above.includes(m));
    const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
    const counts = [
      places.length && plural(places.length, 'place'),
      matches.length && `${plural(matches.length, 'match', 'matches')} in ${plural(regionCount, 'region')}`,
    ].filter(Boolean).join(' · ');
    const section = (label, body) => h('div', { class: 'results-section' }, h('h3', {}, label), body);
    const spawns = split
      ? [['Available to you', now], ['Needs a higher rank', above]].filter(([, list]) => list.length).map(([label, list]) => section(label, resultList(list)))
      : places.length ? matches.length && section('Spawns', resultList(matches)) : resultList(matches);
    return [
      h('h2', {}, title),
      h('p', { class: 'where' }, `${counts}${filt && s.query.trim() ? ` · ${filt}` : ''}${matches.length ? ' · earliest rank first' : ''}`),
      places.length > 0 && section('Places', placeList(places, s.query)),
      spawns || null,
    ];
  }

  function bossCount(r) {
    const n = (type) => r.monsters.filter((e) => e.type === type).length;
    const parts = [['Gold-crown boss', 'gold-crown boss', 'gold-crown bosses'], ['Silver-crown', 'silver-crown monster', 'silver-crown monsters']]
      .map(([type, one, many]) => ({ tag: TYPE_TAG[type], k: n(type), label: n(type) === 1 ? one : many }))
      .filter((p) => p.k);
    if (!parts.length) return null;
    return h('span', { class: 'boss-count', role: 'img', 'aria-label': parts.map((p) => `${p.k} ${p.label}`).join(', ') },
      parts.map((p) => h('span', {}, TAG_INFO[p.tag][0], ` ${p.k}`)));
  }

  function idleView(s) {
    const list = regions
      .filter((r) => s.category === 'all' || r[s.category].length)
      .slice().sort((a, b) => a.name.localeCompare(b.name));
    return [
      h('h2', {}, 'Regions'),
      h('p', { class: 'where' }, 'Tap a pin or a region, search above (names and drops), or pick a type to see where it spawns.'),
      !Object.keys(s.ranks ?? {}).length && h('p', { class: 'note rank-hint' }, 'Set your Area Ranks in My game to see what you can get now.'),
      h('ul', { class: 'region-list' }, list.map((r) => h('li', {},
        h('button', { type: 'button', onclick: () => select(r.id) },
          h('span', { class: 'what' }, h('span', { class: 'name' }, r.name), h('span', { class: 'note' }, r.where)),
          s.notesOn && notes.regionCount(r, s),
          s.ranks?.[r.id] && h('span', { class: 'your-rank-chip', title: `Your Area Rank here: R${s.ranks[r.id]}` }, `R${s.ranks[r.id]}`),
          s.category === 'monsters' ? bossCount(r) : h('span', { class: 'dots', 'aria-hidden': 'true' },
            PIN_CATS.filter((c) => r[c].length).map((c) => h('span', { class: 'dot', dataset: { cat: c }, title: `${r[c].length} ${CAT_LABEL[c].toLowerCase()}` }))))))),
    ];
  }

  function render(s, prev) {
    const r = s.selectedId && byId.get(s.selectedId);
    const active = s.query.trim() || s.type || s.tag;
    const focused = el.contains(document.activeElement) && document.activeElement.dataset.focus;
    el.replaceChildren(...[s.mine ? mine.view(s) : r ? regionView(r, s) : active ? resultsView(s) : idleView(s)].flat(3).filter(Boolean));
    if (focused) el.querySelector(`[data-focus="${focused}"]`)?.focus({ preventScroll: true });
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    if (s.mine) {
      if (!prev?.mine) {
        el.scrollIntoView?.({ behavior, block: 'nearest' });
        el.focus({ preventScroll: true });
      }
    } else if (r && s.openKey && (!prev || prev.openKey !== s.openKey || prev.selectedId !== s.selectedId)) {
      el.querySelector(`li[data-key="${s.openKey}"]`)?.scrollIntoView?.({ behavior, block: 'nearest' });
    } else if (r && prev && prev.selectedId !== s.selectedId) {
      el.scrollIntoView?.({ behavior, block: 'nearest' });
    }
  }

  return { el, render };
}
