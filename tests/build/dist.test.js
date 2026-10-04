import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../../dist/', import.meta.url).pathname;
const base = process.env.BASE_PATH || '/';
const read = (f) => readFileSync(join(dist, f), 'utf8');

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

describe('dist/', () => {
  it('exists (run `npm run build` first)', () => expect(existsSync(join(dist, 'index.html'))).toBe(true));

  it('is under 1.5 MB in total', () => {
    const bytes = walk(dist).reduce((n, f) => n + statSync(f).size, 0);
    expect(bytes).toBeLessThan(1.5 * 1024 * 1024);
  });

  it('ships the 1600px map and not the 3200px source', () => {
    expect(existsSync(join(dist, 'map-1600.webp'))).toBe(true);
    expect(walk(dist).some((f) => f.endsWith('ginormosia-map.webp'))).toBe(false);
  });
});

describe('manifest', () => {
  const m = JSON.parse(read('manifest.webmanifest'));

  it('has the required fields', () => {
    expect(m).toMatchObject({ name: 'Ginormosia Resource Map', short_name: 'Ginormosia', display: 'standalone' });
    expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('scopes start_url and scope to BASE_PATH', () => {
    expect(m.start_url).toBe(base);
    expect(m.scope).toBe(base);
  });

  it('lists 192, 512 and a maskable 512 icon that exist', () => {
    const sizes = m.icons.map((i) => `${i.sizes}${i.purpose === 'maskable' ? ' maskable' : ''}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512 maskable']));
    for (const i of m.icons) expect(existsSync(join(dist, i.src)), i.src).toBe(true);
  });
});

describe('service worker', () => {
  const sw = read('sw.js');
  const mainJs = readdirSync(join(dist, 'assets')).find((f) => /^index-.*\.js$/.test(f));

  it('exists and precaches the map, the main bundle and the shell', () => {
    expect(sw).toContain('"map-1600.webp"');
    expect(mainJs).toBeTruthy();
    expect(sw).toContain(`"assets/${mainJs}"`);
    expect(sw).toContain('"index.html"');
    expect(sw).toMatch(/\.woff2"/);
  });
});

describe('index.html', () => {
  const html = read('index.html');
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|data:|#)/.test(u));

  it('has iOS install meta', () => {
    expect(html).toMatch(/rel="apple-touch-icon"/);
    expect(html).toMatch(/name="apple-mobile-web-app-capable" content="yes"/);
    expect(html).toMatch(/name="apple-mobile-web-app-title" content="Ginormosia"/);
    expect(html).toMatch(/rel="manifest"/);
  });

  it('prefixes every local asset URL with BASE_PATH', () => {
    expect(urls.length).toBeGreaterThan(3);
    for (const u of urls) expect(u.startsWith(base), u).toBe(true);
  });

  it('loads no remote fonts', () => expect(html).not.toMatch(/fonts\.googleapis/));
});
