import { h } from './dom.js';
import { toast } from './toast.js';
import { rankSelect } from './mine.js';
import { REPO_URL } from '../config.js';
import { newNote, exportNotes, openQuestions, issueUrl, localDate, noteEntryId, NO_SPOT, NO_ABSENT, MAX_TEXT } from '../lib/notes.js';

const CHIP = { disputed: 'disputed', 'one-source': 'one source', rank: 'rank?', spot: 'spot?', name: 'name?' };
const ENTRY_KINDS = ['seen', 'absent', 'spot', 'text'];
// A landmark's short name: the text before its first " (" or ",".
const placeName = (landmark) => landmark.split(/ \(|,/)[0].trim();

// Field notes UI: the region bar, open questions, card actions and the export controls in My game.
// Notes are only captured here; app.js persists them and map.js handles placement taps.
export function createFieldNotes(store, data, { select }) {
  const merged = data.fieldNotesMerged ?? [];
  let draft = '';
  let armed = null;
  let clearBtn;

  const towerFor = (s, regionId) => s.tower[regionId] ?? s.ranks[regionId] ?? null;
  const add = (kind, fields) => store.set({ notes: [...store.get().notes, newNote(kind, fields)], editing: null });
  const remove = (id) => store.set({ notes: store.get().notes.filter((n) => n.id !== id) });
  const edit = (editing, initial = '') => {
    draft = initial;
    store.set({ editing });
  };
  const button = (cls, label, onclick, extra = {}) => h('button', { class: `link ${cls}`, type: 'button', dataset: { focus: cls }, onclick, ...extra }, label);

  function exportEnv(s) {
    return exportNotes(s.notes, { dataVersion: data.version, today: localDate(), includeMerged: s.exportMerged, merged, gameLanguage: s.gameEnglish ? 'en' : 'other' });
  }

  // --- region panel -------------------------------------------------------
  function bar(r, s) {
    const tower = towerFor(s, r.id);
    const setTower = (v) => {
      const next = { ...s.tower };
      if (!v || +v === s.ranks[r.id]) delete next[r.id];
      else next[r.id] = +v;
      store.set({ tower: next });
    };
    const tod = (value, label) => h('button', {
      class: 'fn-tod', type: 'button', dataset: { tod: value, focus: `fn-tod-${value}` }, 'aria-pressed': String(s.tod === value),
      onclick: () => store.set({ tod: store.get().tod === value ? null : value }),
    }, label);
    const picking = s.editing?.kind === 'place' && s.editing.region === r.id;
    return h('div', { class: 'fn-bar' },
      h('p', { class: 'fn-bar-title' }, 'Field notes'),
      h('div', { class: 'fn-bar-row' },
        h('label', { class: 'rank-row fn-tower-row' }, 'Tower set to',
          rankSelect({ class: 'fn-tower', dataset: { focus: 'fn-tower' }, onchange: (e) => setTower(e.target.value) }, tower)),
        h('div', { class: 'fn-tods', role: 'group', 'aria-label': 'Time of day' }, tod('day', '☀️ Day'), tod('night', '🌙 Night'))),
      button('fn-mark-place', '📍 Mark a place', () => (picking ? store.set({ editing: null }) : edit({ kind: 'place', region: r.id }))),
      picking && placePicker(r));
  }

  function placePicker(r) {
    const go = (name) => name.trim() && store.set({ placing: { kind: 'place', region: r.id, name: name.trim() }, editing: null });
    return h('div', { class: 'fn-place-picker' },
      h('p', { class: 'note' }, 'Which place? Then tap it on the map.'),
      h('div', { class: 'fn-places' }, [...new Set((r.landmarks ?? []).map(placeName))].map((name) =>
        h('button', { class: 'chip fn-place', type: 'button', dataset: { name }, onclick: () => go(name) }, name))),
      h('div', { class: 'fn-editor' },
        h('input', { class: 'fn-input fn-place-new', type: 'text', maxlength: '80', placeholder: 'Or type a new place', 'aria-label': 'New place name', oninput: (e) => { draft = e.target.value; } }),
        button('fn-place-go', 'Mark', () => go(draft))));
  }

  function questions(r, s) {
    const list = openQuestions(r, s.notes);
    if (!list.length) return null;
    const open = s.questionsFor === r.id;
    return h('div', { class: 'fn-questions-group' },
      h('button', {
        class: 'link fn-questions-toggle', type: 'button', 'aria-expanded': String(open), dataset: { focus: 'fn-questions' },
        onclick: () => store.set({ questionsFor: open ? null : r.id }),
      }, `Open questions (${list.length})`),
      open && h('ul', { class: 'fn-questions' }, list.map((q) => h('li', {},
        h('button', { class: 'fn-q', type: 'button', dataset: { key: q.key }, onclick: () => select(r.id, false, q.key) },
          h('span', { class: 'dot', dataset: { cat: q.category }, 'aria-hidden': 'true' }),
          h('span', { class: 'name' }, q.name),
          h('span', { class: 'fn-chips' }, q.kinds.map((k) => h('span', { class: 'fn-chip', dataset: { kind: k } },
            k === 'drops' ? `${q.drops} drop name${q.drops === 1 ? '' : 's'}` : CHIP[k]))))))));
  }

  const regionCount = (r, s) => {
    const n = openQuestions(r, s.notes).length;
    return n ? h('span', { class: 'fn-count', title: `${n} open question${n === 1 ? '' : 's'}` }, `? ${n}`) : null;
  };

  // --- entry card ---------------------------------------------------------
  function noteLabel(n) {
    const when = n.date === localDate() ? 'today' : n.date;
    const where = [n.rank && `tower R${n.rank}`, n.time].filter(Boolean);
    const what = {
      seen: ['Seen', ...where], absent: ['Looked, not here', ...where], spot: ['Spot marked'],
      text: [`Note: ${n.text}`], name: [`Name in game: ${n.inGame}`], 'drop-name': [`Drop ${n.shown} is “${n.inGame}” in game`],
    }[n.kind];
    return [...what, when].join(' · ');
  }

  function editor(s, { multiline, label, onSave }) {
    const attrs = {
      class: 'fn-input', 'aria-label': label, maxlength: String(multiline ? MAX_TEXT : 80),
      oninput: (e) => { draft = e.target.value; },
    };
    const field = multiline ? h('textarea', { ...attrs, rows: '3' }, draft) : h('input', { ...attrs, type: 'text', value: draft });
    return h('div', { class: 'fn-editor' },
      field,
      h('div', { class: 'fn-editor-actions' },
        button('fn-save', 'Save', () => draft.trim() && onSave(draft.trim())),
        button('fn-cancel', 'Cancel', () => store.set({ editing: null }))));
  }

  function cardRow(r, entry, cat, s) {
    const id = noteEntryId(entry, cat);
    const ref = { region: r.id, category: cat, entry: id };
    const sighting = () => ({ ...ref, rank: towerFor(s, r.id), time: s.tod ?? null });
    const editing = s.editing?.region === r.id && s.editing.entry === id ? s.editing : null;
    const dropJas = new Set((entry.drops ?? []).map((d) => d.ja).filter(Boolean));
    const mine = s.notes.filter((n) => (ENTRY_KINDS.includes(n.kind) && n.region === r.id && n.category === cat && n.entry === id)
      || (n.kind === 'name' && cat === 'monsters' && n.monster === entry.id)
      || (n.kind === 'drop-name' && dropJas.has(n.ja))).reverse();
    const names = entry.nameStatus && s.gameEnglish;
    return h('div', { class: 'fn-actions' },
      h('div', { class: 'fn-buttons' },
        button('fn-seen', 'Seen here', () => add('seen', sighting())),
        !NO_ABSENT.includes(entry.spawnType) && button('fn-absent', 'Looked, not here', () => add('absent', sighting())),
        !NO_SPOT.includes(entry.spawnType) && button('fn-spot', '📍 Mark spot', () => store.set({ placing: { kind: 'spot', ...ref }, editing: null })),
        button('fn-note', '✎ Note', () => edit({ kind: 'text', ...ref }))),
      names && h('p', { class: 'fn-name' }, 'English name in game: ',
        button('fn-name-same', 'Same as shown', () => add('name', { monster: entry.id, shown: entry.name, inGame: entry.name })),
        ' ',
        button('fn-name-diff', 'Different…', () => edit({ kind: 'name', ...ref }, entry.name))),
      editing?.kind === 'text' && editor(s, { multiline: true, label: 'Your note', onSave: (text) => add('text', { ...ref, text }) }),
      editing?.kind === 'name' && editor(s, { label: 'English name in game', onSave: (inGame) => add('name', { monster: entry.id, shown: entry.name, inGame }) }),
      editing?.kind === 'drop' && h('div', {}, h('p', { class: 'note' }, `English name in game for “${editing.shown}”:`),
        editor(s, { label: `English name in game for ${editing.shown}`, onSave: (inGame) => add('drop-name', { ja: editing.ja, shown: editing.shown, inGame }) })),
      mine.length > 0 && h('ul', { class: 'fn-mine' }, mine.map((n) => h('li', {},
        h('span', {}, noteLabel(n)),
        merged.includes(n.id) ? h('span', { class: 'fn-merged' }, 'merged') : button('fn-undo', 'Undo', () => remove(n.id), { dataset: { focus: `fn-undo-${n.id}` } })))));
  }

  // The ✎ next to a ≈ drop name (English games only).
  const dropEdit = (r, entry, cat, d, s) => (s.gameEnglish && !d.official && d.ja
    ? h('button', {
      class: 'fn-drop-edit', type: 'button', dataset: { ja: d.ja, focus: `fn-drop-${d.ja}` }, 'aria-label': `Correct the name of ${d.name}`,
      onclick: () => edit({ kind: 'drop', region: r.id, entry: noteEntryId(entry, cat), ja: d.ja, shown: d.name }, d.name),
    }, '✎')
    : null);

  // --- My game ------------------------------------------------------------
  function settings(s) {
    const env = exportEnv(s);
    const json = JSON.stringify(env, null, 2);
    const name = `ginormosia-field-notes-${env.exported}.json`;
    const file = typeof File === 'function' ? new File([json], name, { type: 'application/json' }) : null;
    const canShare = !!(file && navigator.canShare?.({ files: [file] }));
    const issue = issueUrl(REPO_URL, env);
    const mergedCount = s.notes.filter((n) => merged.includes(n.id)).length;
    const disarm = () => {
      clearTimeout(armed);
      armed = null;
      if (clearBtn) clearBtn.textContent = 'Clear all notes';
    };
    clearBtn = button('fn-clear-all', armed ? 'Tap again to clear' : 'Clear all notes', () => {
      if (armed) {
        disarm();
        store.set({ notes: [] });
      } else {
        armed = setTimeout(disarm, 4000);
        clearBtn.textContent = 'Tap again to clear';
      }
    });
    const download = () => {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = h('a', { href: url, download: name });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const copy = () => Promise.resolve(navigator.clipboard?.writeText(json))
      .then(() => toast('Copied your field notes as JSON.'), () => toast('Couldn’t copy. Use Download instead.'));
    return h('div', { class: 'fn-settings' },
      h('h3', {}, 'Field notes'),
      h('label', { class: 'switch-row' },
        h('input', { class: 'fn-switch', type: 'checkbox', role: 'switch', checked: s.notesOn, onchange: (e) => store.set({ notesOn: e.target.checked }) }),
        h('span', {}, h('strong', {}, 'Field notes'), h('span', { class: 'note' }, ' Record what you see in the game (sightings, spots, names), then send it in.'))),
      s.notesOn && h('label', { class: 'switch-row' },
        h('input', { class: 'fn-english', type: 'checkbox', checked: s.gameEnglish, onchange: (e) => store.set({ gameEnglish: e.target.checked }) }),
        h('span', {}, 'My game is in English', h('span', { class: 'note' }, ' (name corrections need the English release)'))),
      (s.notesOn || s.notes.length > 0) && h('div', { class: 'fn-export' },
        h('p', { class: 'fn-summary' }, `Field notes: ${s.notes.length} note${s.notes.length === 1 ? '' : 's'} (${mergedCount} merged)`),
        h('div', { class: 'fn-export-buttons' },
          canShare && h('button', { class: 'chip fn-share', type: 'button', onclick: () => navigator.share({ files: [file], title: 'Ginormosia field notes' }).catch(() => {}) }, 'Share file'),
          h('button', { class: 'chip fn-download', type: 'button', onclick: download }, 'Download'),
          h('button', { class: 'chip fn-copy', type: 'button', onclick: copy }, 'Copy JSON'),
          h('button', { class: 'chip fn-issue', type: 'button', disabled: issue.tooLong, onclick: () => window.open(issue.url, '_blank', 'noopener') }, 'Open GitHub issue')),
        issue.tooLong && h('p', { class: 'note fn-issue-note' }, 'Too long for a prefilled issue. Download or copy the file and attach it to a new issue instead.'),
        h('label', { class: 'switch-row' },
          h('input', { class: 'fn-include-merged', type: 'checkbox', checked: s.exportMerged, onchange: (e) => store.set({ exportMerged: e.target.checked }) }),
          'Include merged notes'),
        h('p', { class: 'fn-clear' },
          button('fn-clear-merged', 'Clear merged notes', () => store.set({ notes: s.notes.filter((n) => !merged.includes(n.id)) })),
          ' · ', clearBtn),
        h('p', { class: 'note' }, 'Notes live only on this device until you export them.')));
  }

  return { bar, questions, regionCount, cardRow, dropEdit, settings, add };
}
