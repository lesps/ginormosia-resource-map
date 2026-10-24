// npm run merge-notes -- <export.json> [more.json …] [--dry-run]
// Folds field-notes exports into data/regions.json (rules in src/lib/merge-notes.js), archives the notes in
// data/field-notes.json and prints a Markdown report. Writes nothing if the result doesn't validate.
// MERGE_DATA / MERGE_ARCHIVE override the two paths (used by the tests).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateRegions } from '../src/lib/data.js';
import { parseNotesExport } from '../src/lib/notes.js';
import { mergeNotes, reportMarkdown, ARCHIVE_FORMAT } from '../src/lib/merge-notes.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((a) => a !== '--dry-run');
const dataPath = process.env.MERGE_DATA ?? fileURLToPath(new URL('../data/regions.json', import.meta.url));
const archivePath = process.env.MERGE_ARCHIVE ?? fileURLToPath(new URL('../data/field-notes.json', import.meta.url));
const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

if (!files.length) fail('Usage: npm run merge-notes -- <export.json> [more.json …] [--dry-run]', 2);

let data = JSON.parse(readFileSync(dataPath, 'utf8'));
const archive = existsSync(archivePath) ? JSON.parse(readFileSync(archivePath, 'utf8')) : { format: ARCHIVE_FORMAT, notes: [] };
if (archive.format !== ARCHIVE_FORMAT) fail(`${archivePath} is not a field notes archive`);

const report = { applied: [], review: [], skipped: [] };
for (const file of files) {
  let env;
  try {
    env = parseNotesExport(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`${file}: ${e.message}`);
  }
  const res = mergeNotes(data, env.notes, { archivedIds: archive.notes.map((n) => n.id), gameLanguage: env.gameLanguage ?? 'en' });
  data = res.data;
  archive.notes.push(...res.merged);
  for (const k of Object.keys(report)) report[k].push(...res.report[k]);
}

try {
  validateRegions(data);
} catch (e) {
  fail(`Merged data is invalid; nothing written. ${e.message}`);
}
if (!dryRun) {
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(archivePath, `${JSON.stringify(archive, null, 2)}\n`);
}
console.log(reportMarkdown(report) + (dryRun ? '\n_Dry run: nothing written._\n' : ''));
