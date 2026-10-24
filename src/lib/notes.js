// Field notes: observations recorded in the game (format v1, see README "Field notes").
// The app only captures and exports them; scripts/merge-notes.mjs draws conclusions later.
import { CATEGORIES, NO_SPOT, NO_ABSENT } from './data.js';
import { MAX_RANK } from './ranks.js';
import { entryKey } from './search.js';

export const NOTES_FORMAT = 'ginormosia-field-notes';
export const NOTES_VERSION = 1;
export const MAX_TEXT = 500;
const ISSUE_MAX = 8000;

export { NO_SPOT, NO_ABSENT };

const ENTRY = ['region', 'category', 'entry'];
const FIELDS = {
  seen: [...ENTRY, 'rank', 'time'],
  absent: [...ENTRY, 'rank', 'time'],
  spot: [...ENTRY, 'x', 'y', 'zoom'],
  place: ['region', 'name', 'x', 'y', 'zoom'],
  name: ['monster', 'shown', 'inGame'],
  'drop-name': ['ja', 'shown', 'inGame'],
  text: [...ENTRY, 'text'],
};
export const NOTE_KINDS = Object.keys(FIELDS);

const pad = (n) => String(n).padStart(2, '0');
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function newNote(kind, fields, { now = new Date(), random = Math.random } = {}) {
  const rand = Array.from({ length: 6 }, () => Math.floor(random() * 36).toString(36)).join('');
  const date = localDate(now);
  return { id: `n-${date.replaceAll('-', '')}-${rand}`, date, kind, ...fields };
}

const str = (v) => typeof v === 'string' && v.trim().length > 0;
const unit = (v) => typeof v === 'number' && v >= 0 && v <= 1;

export function validateNote(n) {
  const fail = (msg) => { throw new Error(`Invalid field note ${n?.id ?? ''}: ${msg}`); };
  if (!n || typeof n !== 'object') fail('not an object');
  if (!/^n-\d{8}-[0-9a-z]{6}$/.test(n.id)) fail('bad id');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) fail('bad date');
  if (!FIELDS[n.kind]) fail(`unknown kind "${n.kind}"`);
  for (const f of FIELDS[n.kind]) if (!(f in n)) fail(`missing ${f}`);
  for (const f of ['region', 'entry', 'monster', 'ja', 'shown', 'inGame', 'name']) if (f in n && FIELDS[n.kind].includes(f) && !str(n[f])) fail(`empty ${f}`);
  if ('category' in n && !CATEGORIES.includes(n.category)) fail(`unknown category "${n.category}"`);
  if ('rank' in n && n.rank !== null && !(Number.isInteger(n.rank) && n.rank >= 1 && n.rank <= MAX_RANK)) fail(`rank must be 1–${MAX_RANK} or null`);
  if ('time' in n && ![null, 'day', 'night'].includes(n.time)) fail('time must be day, night or null');
  for (const f of ['x', 'y']) if (f in n && !unit(n[f])) fail(`${f} must be in 0–1`);
  if ('zoom' in n && !(typeof n.zoom === 'number' && n.zoom > 0)) fail('bad zoom');
  if (n.kind === 'text' && !str(n.text)) fail('empty text');
  if (n.kind === 'text' && n.text.length > MAX_TEXT) fail(`text over ${MAX_TEXT} characters`);
  return n;
}

export function exportNotes(notes, { dataVersion, today = localDate(), includeMerged = false, merged = [], gameLanguage } = {}) {
  return {
    format: NOTES_FORMAT, version: NOTES_VERSION, dataVersion, exported: today,
    ...(gameLanguage && { gameLanguage }),
    notes: includeMerged ? notes : notes.filter((n) => !merged.includes(n.id)),
  };
}

export function parseNotesExport(json) {
  const env = typeof json === 'string' ? JSON.parse(json) : json;
  if (env?.format !== NOTES_FORMAT) throw new Error(`Not a field notes export (format "${env?.format}")`);
  if (env.version !== NOTES_VERSION) throw new Error(`Unsupported field notes version ${env.version}`);
  if (!Array.isArray(env.notes)) throw new Error('Field notes export has no notes');
  env.notes.forEach(validateNote);
  return env;
}

// Notes name monsters by id and everything else by entry key.
export const noteEntryId = (entry, category) => (category === 'monsters' ? entry.id : entryKey(entry));

// The entry an open card's key points at, with the id notes use for it.
export function entryRef(region, key) {
  for (const category of CATEGORIES) {
    const entry = region?.[category]?.find((e) => entryKey(e) === key);
    if (entry) return { category, entry, id: noteEntryId(entry, category) };
  }
  return null;
}

const ORDER = ['disputed', 'one-source', 'rank', 'spot', 'name', 'drops'];

// What the data doesn't know about each entry in a region, minus what your notes answer.
export function openQuestions(region, notes) {
  const about = (kind, cat, id) => notes.some((n) => n.kind === kind && n.region === region.id && n.category === cat && n.entry === id);
  const namedDrops = new Set(notes.filter((n) => n.kind === 'drop-name').map((n) => n.ja));
  const named = new Set(notes.filter((n) => n.kind === 'name').map((n) => n.monster));
  const out = [];
  CATEGORIES.forEach((category) => (region[category] ?? []).forEach((e, i) => {
    const id = noteEntryId(e, category);
    const checked = about('seen', category, id) || about('absent', category, id);
    const ranked = notes.some((n) => n.kind === 'seen' && n.region === region.id && n.category === category && n.entry === id && n.rank != null);
    const drops = (e.drops ?? []).filter((d) => !d.official && d.ja && !namedDrops.has(d.ja)).length;
    const kinds = [
      e.confidence === 'disputed' && !checked && 'disputed',
      e.confidence === 'single-source' && !checked && 'one-source',
      e.minRank === '-' && !ranked && 'rank',
      !NO_SPOT.includes(e.spawnType) && !e.spots?.length && !about('spot', category, id) && 'spot',
      e.nameStatus && !named.has(e.id) && 'name',
      drops > 0 && 'drops',
    ].filter(Boolean);
    if (kinds.length) out.push({ category, entry: id, key: entryKey(e), name: e.name, kinds, ...(drops && { drops }), i: out.length });
  }));
  return out
    .sort((a, b) => ORDER.indexOf(a.kinds[0]) - ORDER.indexOf(b.kinds[0]) || a.i - b.i)
    .map(({ i, ...q }) => q);
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round = (v) => Math.round(v * 10000) / 10000;

export const toNormalized = (clientX, clientY, rect) => ({
  x: round(clamp01((clientX - rect.left) / rect.width)),
  y: round(clamp01((clientY - rect.top) / rect.height)),
});

export function issueUrl(repoUrl, env) {
  const n = env.notes.length;
  const body = `Field notes exported from the Ginormosia Resource Map (data v${env.dataVersion}).\n\n\`\`\`json\n${JSON.stringify(env, null, 2)}\n\`\`\`\n`;
  const p = new URLSearchParams({ title: `[field notes] ${n} note${n === 1 ? '' : 's'}`, labels: 'field-notes', body });
  const url = `${repoUrl}/issues/new?${p}`;
  return { url, tooLong: url.length > ISSUE_MAX };
}
