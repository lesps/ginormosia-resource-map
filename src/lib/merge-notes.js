// Folds exported field notes into the data (scripts/merge-notes.mjs). Pure: returns a new data object
// and a report; anything that needs judgement goes to "Needs review" instead of being applied.
// Rules: README "Field notes" → "Merging".
import { expandMonsters, NO_SPOT, NO_ABSENT } from './data.js';
import { lowestRank } from './ranks.js';
import { entryKey } from './search.js';

export const ARCHIVE_FORMAT = 'ginormosia-field-notes-archive';
const INGAME = 'ingame';
const DUPLICATE = 0.015; // spots closer than this (in map widths) are the same spot
const RESOURCES = ['ore', 'trees', 'fish', 'other'];

const join = (...parts) => parts.filter(Boolean).join(' ');
const xy = (n) => `(${n.x}, ${n.y})`;
const onlyAt = (entry) => (entry.tags?.includes('day') ? 'day' : entry.tags?.includes('night') ? 'night' : null);

// The earliest rank consistent with a sighting at `seen`: minRank means "earliest seen".
function lowered(minRank, seen) {
  const either = /^(\d) or (\d)$/.exec(minRank);
  if (either) {
    const left = either.slice(1).map(Number).filter((r) => r <= seen);
    return left.length === 1 ? String(left[0]) : left.length ? minRank : String(seen);
  }
  if (minRank === 'any') return minRank;
  const low = lowestRank(minRank);
  return low == null || low > seen ? String(seen) : minRank;
}

function locate(data, view, n) {
  const region = data.regions.find((r) => r.id === n.region);
  if (!region) return { error: `unknown region "${n.region}"` };
  const list = region[n.category] ?? [];
  const i = n.category === 'monsters' ? list.findIndex((a) => a.id === n.entry) : list.findIndex((e) => entryKey(e) === n.entry);
  if (i < 0) return { error: `unknown entry "${n.entry}" in ${region.name} ${n.category}` };
  const shown = view.regions.find((r) => r.id === region.id)[n.category][i];
  return { region, raw: list[i], shown, label: `${shown.name} (${region.name})` };
}

const RULES = {
  seen(n, t) {
    const time = onlyAt(t.shown);
    if (n.rank != null && t.raw.maxRank && n.rank > +t.raw.maxRank) return [['review', `${t.label}: seen at R${n.rank}, above R${t.raw.maxRank} where it should be gone. Nothing changed.`]];
    if (n.time && time && n.time !== time) return [['review', `${t.label}: recorded as ${time}-only, but seen at ${n.time}. Nothing changed.`]];
    const changes = [];
    if (!t.raw.sources?.includes(INGAME)) { t.raw.sources = [...(t.raw.sources ?? []), INGAME]; changes.push('in-game source added'); }
    if (n.rank != null) {
      const next = lowered(t.raw.minRank, n.rank);
      if (next !== t.raw.minRank) { changes.push(`rank ${t.raw.minRank} → ${next}`); t.raw.minRank = next; }
    }
    const out = [];
    if (t.raw.confidence === 'disputed') {
      out.push(['review', `${t.label}: seen in game${n.rank ? ` at R${n.rank}` : ''}${n.time ? ` (${n.time})` : ''}, but it's disputed${t.raw.note ? ` (“${t.raw.note}”)` : ''}. Check whether this settles it.`]);
    } else if (t.raw.confidence !== 'confirmed') {
      t.raw.confidence = 'confirmed';
      changes.push('now confirmed');
    }
    if (changes.length) out.unshift(['applied', `${t.label}: seen${n.rank ? ` at R${n.rank}` : ''}${n.time ? ` (${n.time})` : ''}: ${changes.join(', ')}.`]);
    return out;
  },

  absent(n, t) {
    const time = onlyAt(t.shown);
    const low = lowestRank(t.raw.minRank);
    if (NO_ABSENT.includes(t.shown.spawnType)) return [['skipped', `${t.label}: absence means nothing for ${t.shown.spawnType} spawns.`]];
    if (n.rank == null) return [['skipped', `${t.label}: looked, but no tower rank was recorded, so the absence can't be weighed.`]];
    if (low != null && n.rank < low) return [['skipped', `${t.label}: looked at R${n.rank}, below its R${low}, so the absence is expected.`]];
    if (t.raw.maxRank && n.rank > +t.raw.maxRank) return [['skipped', `${t.label}: looked at R${n.rank}, above R${t.raw.maxRank} where it's gone anyway.`]];
    if (n.time && time && n.time !== time) return [['skipped', `${t.label}: looked at ${n.time}, but it's ${time}-only, so the absence is expected.`]];
    const text = `Not found in game at R${n.rank}${n.time ? ` (${n.time})` : ''} on ${n.date}.`;
    const conf = t.raw.confidence ?? 'confirmed';
    if (conf === 'confirmed') return [['review', `${t.label}: ${text} It's confirmed by other sources, so nothing changed.`]];
    t.raw.note = join(t.raw.note, text);
    if (conf === 'single-source') {
      t.raw.confidence = 'disputed';
      return [['applied', `${t.label}: now disputed. ${text}`]];
    }
    return [['applied', `${t.label}: note added. ${text}`]];
  },

  spot(n, t) {
    if (NO_SPOT.includes(t.shown.spawnType)) return [['skipped', `${t.label}: ${t.shown.spawnType} spawns aren't at one place, so a spot isn't kept.`]];
    if ((t.raw.spots ?? []).some((s) => Math.hypot(s.x - n.x, s.y - n.y) < DUPLICATE)) return [['skipped', `${t.label}: spot ${xy(n)} is a duplicate of an existing spot.`]];
    t.raw.spots = [...(t.raw.spots ?? []), { x: n.x, y: n.y, precision: 'approx', sources: [INGAME] }];
    return [['applied', `${t.label}: approximate spot added at ${xy(n)}.`]];
  },

  text(n, t) {
    return [['review', `${t.label}: “${n.text}” Decide whether this becomes where, a note, or nothing.`]];
  },
};

function place(data, n) {
  const region = data.regions.find((r) => r.id === n.region);
  if (!region) return [['skipped', `${n.id}: unknown region "${n.region}"`]];
  const name = n.name.trim();
  const existing = region.places?.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    Object.assign(existing, { x: n.x, y: n.y });
    return [['applied', `${region.name}: place “${existing.name}” moved to ${xy(n)}.`]];
  }
  region.places = [...(region.places ?? []), { name, x: n.x, y: n.y }];
  return [['applied', `${region.name}: place “${name}” added at ${xy(n)}.`]];
}

function rename(data, n) {
  const m = data.monsters?.[n.monster];
  if (!m) return [['skipped', `${n.id}: unknown monster "${n.monster}"`]];
  const name = n.inGame.trim();
  if (m.name === name) {
    delete m.nameStatus;
    return [['applied', `${name}: English name confirmed.`]];
  }
  const old = m.name;
  m.name = name;
  delete m.nameStatus;
  return [['applied', `${old} → ${name}: renamed. Its entry key changes, so old links fall back to the region.`]];
}

function renameDrop(data, n) {
  const name = n.inGame.trim();
  let count = 0;
  const fix = (d) => {
    if (d.ja !== n.ja) return;
    d.name = name;
    d.official = true;
    count++;
  };
  for (const r of data.regions) {
    for (const c of RESOURCES) for (const e of r[c] ?? []) e.drops?.forEach(fix);
    for (const a of r.monsters ?? []) a.drops?.forEach(fix);
  }
  for (const m of Object.values(data.monsters ?? {})) m.drops?.forEach(fix);
  if (!count) return [['skipped', `${n.id}: no drop with Japanese name ${n.ja}`]];
  return [['applied', `${n.ja}: “${n.shown}” → “${name}” (official) in ${count} place${count === 1 ? '' : 's'}.`]];
}

export function mergeNotes(input, notes, { archivedIds = [], gameLanguage = 'en' } = {}) {
  const data = structuredClone(input);
  data.sources = { ...data.sources, [INGAME]: data.sources?.[INGAME] ?? 'In-game observation (field notes)' };
  const view = expandMonsters(data); // monster names, tags and spawn types; resource entries are shared with `data`
  const report = { applied: [], review: [], skipped: [] };
  const done = new Set([...archivedIds, ...(data.fieldNotesMerged ?? [])]);
  const merged = [];

  for (const n of notes) {
    if (done.has(n.id)) { report.skipped.push(`${n.id}: already merged.`); continue; }
    done.add(n.id);
    merged.push(n);
    let out;
    if ((n.kind === 'name' || n.kind === 'drop-name') && gameLanguage !== 'en') {
      out = [['review', `${n.id}: “${n.inGame}” for “${n.shown}” comes from a game that isn't in English, so it wasn't applied.`]];
    } else if (n.kind === 'name') out = rename(data, n);
    else if (n.kind === 'drop-name') out = renameDrop(data, n);
    else if (n.kind === 'place') out = place(data, n);
    else if (RULES[n.kind]) {
      const t = locate(data, view, n);
      out = t.error ? [['skipped', `${n.id}: ${t.error}`]] : RULES[n.kind](n, t);
    } else out = [['skipped', `${n.id}: unknown kind "${n.kind}"`]];
    for (const [section, msg] of out) report[section].push(msg);
  }

  data.fieldNotesMerged = [...(data.fieldNotesMerged ?? []), ...merged.map((n) => n.id)];
  return { data, report, merged };
}

export function reportMarkdown(report) {
  const section = (title, list) => `## ${title} (${list.length})\n\n${list.length ? list.map((x) => `- ${x}`).join('\n') : '_None._'}\n`;
  return ['# Field notes merge\n', section('Applied', report.applied), section('Needs review', report.review), section('Skipped', report.skipped)].join('\n');
}
