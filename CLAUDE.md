# CLAUDE.md

Ginormosia Resource Map: an offline-capable PWA mapping Fantasy Life i resources to Ginormosia regions. `SPEC.md` is the original build spec; see "Deviations from SPEC.md" below for what changed.

## Stack
Vite 8 + vanilla ES modules (no framework), `vite-plugin-pwa` (generateSW, autoUpdate), Vitest 5 + jsdom, sharp (asset scripts only), `@fontsource` Fredoka/Nunito.

## Commands
```bash
npm ci
npm test                       # tests/lib + tests/ui
npm run build && npm run test:build   # tests/build runs against dist/
npm run dev | npm run preview
npm run assets                 # regenerate public/map.webp + icons; commit the output
BASE_PATH=/sub/ npm run build  # sub-path build (CI sets /<repo-name>/)
```

## Layout
- `data/regions.json`: **source of truth** for all resource data and pin coordinates. Corrections are data edits, not code edits. It's imported (bundled) by `src/main.js`.
- `src/lib/`: pure logic, no DOM: `data.js` (validation, `CATEGORIES`, `TAGS`), `rank.js` (`formatRank`, `rankTitle`), `search.js` (search over names, `nameJa` and drops; `typesFor`; `entryKey` slugs for deep links), `escape.js`, `hash.js` (URL state incl. `e=` open entry), `find.js` (`howToFind`: the detail card's "How to find" steps, derived from rank, tower, `where`, `tags`, `level` and `conditions`).
- `src/ui/`: DOM. `app.js` (`mountApp`, wires everything, keyboard shortcuts), `state.js` (store), `controls.js`, `map.js`, `panel.js`, `install.js`, `toast.js`, `dom.js` (`h()` helper).
- `src/main.js`: entry point (fonts, CSS, SW registration, hash sync). It's untested by design; keep logic out of it.
- `src/styles.css`: tokens and light/dark themes. Pin styling is in the "Pins" section.
- `scripts/`: sharp scripts. `assets/`: source map `ginormosia-map.jpg` (1024×1012, not shipped; converted to `public/map.webp` at native size) and `icon.svg`. `public/`: generated outputs. `reference/prototype.html`: behavior reference only.
- `tests/lib`, `tests/ui` (jsdom via `// @vitest-environment jsdom`), `tests/build` (separate config `vitest.build.config.js`).

## Rules
- TDD: write or update the failing test first. Flag any untested change.
- All data-derived text goes through `textContent` or `highlight()`/`escapeHtml()`. Never interpolate raw data into `innerHTML`.
- Keep README, CHANGELOG and this file accurate to the code.

## Deviations from SPEC.md
- Data `version` 3: required `type` on every entry; a `boss` category; optional per-entry `where`, `conditions`, `tags`, `level`, `drops`, `note`, `confidence`, `sources`, `nameJa`, `spawnType`, `shadow` (fish), `ggXY`; region `tower`/`landmarks`/`summary`/`nameJa`; top-level `mechanics`, `sources`, `confidenceLevels`. `search`/`regionMatches`/`regionHasCategory` take an optional 4th `type` argument, and `search` results can carry `drop` when only a drop matched.
- Resource rows are buttons that expand a detail card (store key `openKey`, hash `e=`). Bosses have their own chip. Rank 6 exists.
- The map image is a different, labelled 1024×1012 map (not the 3200² fan-annotated one). The frame's aspect ratio comes from `data.image`, and pins sit on each region's tower (located from an in-game screenshot via a coastline fit). On this image the towers sit inside the printed labels, so pins can cover part of a label at 1×/2×.
- Zoom is 1×/2×/3×, not 1×/2×. Pin markers draw smaller at 1× on narrow screens; the tap target stays 44×56.
- Results lists are sorted lowest rank first instead of data order. Type chips follow `data.typeOrder` (the game's tiers; validated to match the types in use exactly).
- Additions not in the spec: idle region list, sticky toolbar, URL-hash state, keyboard shortcuts, install button/iOS help, offline badge.

## Known data caveats
- Coldwater Tuna rank disputed (`"1 or 5"`); Rainbow Flying Fish disputed between East Dryridge and South Greatgut. Shroomhaven's "Great Darkness Tree" is treated as the Darkwood R4 tier (likely the Great Darkwood Tree; unconfirmed in game). `"-"` = spawns, rank unknown. Common fish, herbs and ground pickups aren't covered.
- Data v3 was migrated once from an external guide (not in the repo); the old/new reconciliation rules are in CHANGELOG 'Unreleased'. Entries only in the earlier data carry `sources: ["earlier"]` and `confidence: "single-source"`.
- Drop names with `official: false` are translations, not confirmed English names; never present them as official.
- `type` groupings are this project's own grouping, not the game's. `typeOrder` positions for Haniwa Stone, Fossil, Eel and Sand Fish are unverified guesses; trees follow Gamer Guides' rarity field.
- Round-2 research (2026-10-04) was merged once from an external JSON (not in the repo): confidence only moves up, or to `disputed`; "not found" verdicts become `disputed`, not deletions; boilerplate locations became `spawnType`, not `where` text.
