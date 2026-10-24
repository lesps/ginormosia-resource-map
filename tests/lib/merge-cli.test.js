import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repo = new URL('../../', import.meta.url).pathname;
let dir, env;
const exportFile = (notes, extra = {}) => {
  const f = join(dir, `export-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(f, JSON.stringify({ format: 'ginormosia-field-notes', version: 1, dataVersion: 4, exported: '2026-10-24', gameLanguage: 'en', notes, ...extra }));
  return f;
};
const run = (...args) => spawnSync('node', [join(repo, 'scripts/merge-notes.mjs'), ...args], { env: { ...process.env, ...env }, encoding: 'utf8' });
const note = { id: 'n-20261024-aaaaaa', date: '2026-10-24', kind: 'seen', region: 'moltana', category: 'monsters', entry: 'burrow-star', rank: 4, time: 'night' };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'gnm-merge-'));
  copyFileSync(join(repo, 'data/regions.json'), join(dir, 'regions.json'));
  env = { MERGE_DATA: join(dir, 'regions.json'), MERGE_ARCHIVE: join(dir, 'field-notes.json') };
});

describe('npm run merge-notes', () => {
  it('prints the report and writes nothing on --dry-run', () => {
    const before = readFileSync(env.MERGE_DATA, 'utf8');
    const out = run(exportFile([note]), '--dry-run');
    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/## Applied \(1\)[\s\S]*Burrow Star \(Moltana Wastes\): seen at R4/);
    expect(out.stdout).toMatch(/Dry run/);
    expect(readFileSync(env.MERGE_DATA, 'utf8')).toBe(before);
    expect(existsSync(env.MERGE_ARCHIVE)).toBe(false);
  });

  it('writes the data in the repo format, archives the notes, and is idempotent', () => {
    const f = exportFile([note]);
    expect(run(f).status).toBe(0);
    const written = readFileSync(env.MERGE_DATA, 'utf8');
    const data = JSON.parse(written);
    expect(written).toBe(`${JSON.stringify(data, null, 2)}\n`);
    expect(data.fieldNotesMerged).toEqual([note.id]);
    expect(data.regions.find((r) => r.id === 'moltana').monsters.find((a) => a.id === 'burrow-star').minRank).toBe('4');
    expect(JSON.parse(readFileSync(env.MERGE_ARCHIVE, 'utf8'))).toEqual({ format: 'ginormosia-field-notes-archive', notes: [note] });
    const again = run(f);
    expect(again.stdout).toMatch(/already merged/);
    expect(readFileSync(env.MERGE_DATA, 'utf8')).toBe(written);
  });

  it('refuses to write data that would not validate', () => {
    const before = readFileSync(env.MERGE_DATA, 'utf8');
    const clash = { id: 'n-20261024-bbbbbb', date: '2026-10-24', kind: 'name', monster: 'mimic', shown: 'Mimic', inGame: 'Goliath' };
    const out = run(exportFile([clash]));
    expect(out.status).toBe(1);
    expect(out.stderr).toMatch(/invalid.*nothing written/i);
    expect(readFileSync(env.MERGE_DATA, 'utf8')).toBe(before);
  });

  it('rejects a file that is not a field notes export', () => {
    const out = run(exportFile([], { format: 'other' }));
    expect(out.status).not.toBe(0);
    expect(out.stderr).toMatch(/format/);
  });
});
