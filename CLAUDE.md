# CLAUDE.md

Ginormosia Resource Map: an offline-capable PWA mapping Fantasy Life i resources and monsters to Ginormosia regions. `SPEC.md` is the original build spec; see "Deviations from SPEC.md" below for what changed.

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
- `src/lib/`: pure logic, no DOM: `data.js` (validation, `CATEGORIES`, `TAGS`; `expandMonsters` joins `data.monsters` onto region appearances and derives their `type`/`tags`; `loadRegions` = validate, then expand), `rank.js` (`formatRank`, `rankTitle`), `search.js` (`search(regions, { query, category, type, tag })` over names, `nameJa`, drops and, from 3 characters, `where`/`conditions`/`note`, each result tagged `via`; `sortMatches` by via then rank; `searchPlaces` over region name, tower and landmarks; `typesFor`; `tagsFor`; `entryKey` slugs for deep links; `isCommonMonster`; `findEntry`), `escape.js` (`escapeHtml`, `highlight`, `excerpt`), `hash.js` (URL state incl. `e=` open entry), `find.js` (`howToFind(entry, region, category, { unlocked })`: the detail card's "How to find" steps, derived from rank, tower, `where`, `spawnType`, `tags`, `level`, `conditions`, for monsters `sleeps`/`aggressive`/`maxRank`, and your unlocked rank), `ranks.js` (`MAX_RANK` 7, `lowestRank`, `availability` → unset/likely/available/locked, `sanitizeRanks`), `notes.js` (field notes format v1: `newNote`, `validateNote`, `exportNotes`, `parseNotesExport`, `openQuestions`, `entryRef`, `toNormalized`, `issueUrl`; format documented in README "Field notes").
- `src/ui/`: DOM. `app.js` (`mountApp`, wires everything, keyboard shortcuts), `state.js` (store), `controls.js`, `map.js`, `panel.js`, `install.js`, `toast.js`, `dom.js` (`h()` helper, `CAT_LABEL`, `PIN_CATS`, `FILTERS`), `storage.js` (`createStorage(backend)`: JSON get/set/remove that never throws; localStorage or memory), `mine.js` (the My game view), `fieldnotes.js` (notes bar, open questions, card actions, drop ✎, export controls in My game). `map.js` also handles field-notes placement (`onPlace`) and dashed halos for your unmerged spots. `src/config.js`: `REPO_URL`. `panel.js` keeps keyboard focus across re-renders via `data-focus` ids.
- Store key and hash param `tag` (badge filter, All only; `fromHash` drops it under another category). Tag chip labels and order: `TAG_SHORT` next to `TAG_INFO` in `panel.js`.
- Personal state lives in `localStorage` only, never in the hash. Storage key `gnm:ranks:v1` = `{ [regionId]: 1..7 }`. Store keys `ranks`, `lockedFor` (locked fold, one region at a time), `mine` (My game open). Field notes: storage keys `gnm:notesOn:v1`, `gnm:notes:v1`, `gnm:tower:v1` (explicit tower choice per region), `gnm:gameEnglish:v1`; store keys `notesOn`, `notes`, `tower`, `gameEnglish`, plus memory-only `tod`, `placing`, `questionsFor`, `editing`, `exportMerged`. `mountApp(root, json, { storage })` takes the storage so tests inject a memory one (`tests/ui/helpers.js` does by default).
- `src/main.js`: entry point (fonts, CSS, SW registration, hash sync). It's untested by design; keep logic out of it.
- `src/styles.css`: tokens and light/dark themes. Pin styling is in the "Pins" section.
- `scripts/`: sharp scripts. `assets/`: source map `ginormosia-map.jpg` (1024×1012, not shipped; converted to `public/map.webp` at native size) and `icon.svg`. `public/`: generated outputs. `reference/prototype.html`: behavior reference only.
- `tests/lib`, `tests/ui` (jsdom via `// @vitest-environment jsdom`), `tests/build` (separate config `vitest.build.config.js`).

## Rules
- TDD: write or update the failing test first. Flag any untested change.
- All data-derived text goes through `textContent` or `highlight()`/`escapeHtml()`. Never interpolate raw data into `innerHTML`.
- Keep README, CHANGELOG and this file accurate to the code.

## Deviations from SPEC.md
- Data `version` 4: required `type` on every resource entry; a `monsters` category stored as a top-level `monsters` map plus per-region appearances (`id`, `minRank`, `spawnType`, `confidence`, `sources`, optional `where`/`time`/`maxRank`/`conditions`/`note`/`drops`), with monster `type` and `tags` derived at load (no `boss` category since v4); optional per-entry `where`, `conditions`, `tags`, `level`, `drops`, `note`, `confidence`, `sources`, `nameJa`, `spawnType`, `shadow` (fish), `ggXY`; region `tower`/`landmarks`/`summary`/`nameJa`; top-level `mechanics`, `sources`, `confidenceLevels`. `search`, `regionMatches` and `regionHasCategory` take a filter object `{ query, category, type, tag }`; `search` results carry `via` (name/drop/where/conditions/note) and `drop` when a drop matched.
- Resource rows are buttons that expand a detail card (store key `openKey`, hash `e=`). Monsters have their own chip (old `cat=boss` links map to it; type chips put bosses first, with badge icons via `TYPE_TAG` in `panel.js`); in the All view monsters are the last group and common monsters fold behind a toggle (store key `commonFor`, not in the hash; opening a common monster from a link or result sets it). Rank 6 exists; an unrecorded rank shows as "R?".
- The map image is a different, labelled 1024×1012 map (not the 3200² fan-annotated one). The frame's aspect ratio comes from `data.image`, and pins sit on each region's tower (located from an in-game screenshot via a coastline fit). On this image the towers sit inside the printed labels, so pins can cover part of a label at 1×/2×.
- Zoom is 1×/2×/3×, not 1×/2×. Pin markers draw smaller at 1× on narrow screens; the tap target stays 44×56. Pins carry ore/trees/fish dots only (every region has monsters).
- Results lists are sorted lowest rank first instead of data order. Type chips follow `data.typeOrder` (the game's tiers for resources, bosses first for monsters; validated to match the types in use exactly). Under the Monsters chip the idle region list shows boss counts instead of resource dots.
- Additions not in the spec: idle region list, sticky toolbar, URL-hash state, keyboard shortcuts, install button/iOS help, offline badge, your ranks / My game, place and challenge search, badge filters, field notes (`SPEC-player-tools` phases 1–3).

## Known data caveats
- Coldwater Tuna rank disputed (`"1 or 5"`); Rainbow Flying Fish disputed between East Dryridge and South Greatgut. Shroomhaven's "Great Darkness Tree" is treated as the Darkwood R4 tier (likely the Great Darkwood Tree; unconfirmed in game). `"-"` = spawns, rank unknown. Common fish, herbs and ground pickups aren't covered.
- Data v3 was migrated once from an external guide (not in the repo); the old/new reconciliation rules are in CHANGELOG 'Unreleased'. Entries only in the earlier data carry `sources: ["earlier"]` and `confidence: "single-source"`.
- Drop names with `official: false` are translations, not confirmed English names; never present them as official.
- `type` groupings are this project's own grouping, not the game's. `typeOrder` positions for Haniwa Stone, Fossil, Eel and Sand Fish are unverified guesses; trees follow Gamer Guides' rarity field.
- Round-2 research (2026-10-04) was merged once from an external JSON (not in the repo): confidence only moves up, or to `disputed`; "not found" verdicts become `disputed`, not deletions; boilerplate locations became `spawnType`, not `where` text.
- Monster data (v4) was merged once from an external survey JSON (2026-10-23, not in the repo). Old boss rows were folded into their monsters (group rows split; confidence only up). `nameStatus` `probable`/`unofficial` names are not confirmed English (they show ≈ and a Name note); element names are translations too. Never present either as official. Scorchrock's Pyro Panther is disputed (the survey puts Agekara Cave's boss in Moltana). 136 of 255 appearances have rank `"-"`. Hearhare is unplaced.
