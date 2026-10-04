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
npm run assets                 # regenerate public/map-1600.webp + icons; commit the output
BASE_PATH=/sub/ npm run build  # sub-path build (CI sets /<repo-name>/)
```

## Layout
- `data/regions.json`: **source of truth** for all resource data and pin coordinates. Corrections are data edits, not code edits. It's imported (bundled) by `src/main.js`.
- `src/lib/`: pure logic, no DOM: `data.js` (validation), `rank.js`, `search.js` (search, filters, `typesFor`), `escape.js`, `hash.js` (URL state).
- `src/ui/`: DOM. `app.js` (`mountApp`, wires everything, keyboard shortcuts), `state.js` (store), `controls.js`, `map.js`, `panel.js`, `install.js`, `toast.js`, `dom.js` (`h()` helper).
- `src/main.js`: entry point (fonts, CSS, SW registration, hash sync). It's untested by design; keep logic out of it.
- `src/styles.css`: tokens and light/dark themes. Pin styling is in the "Pins" section.
- `scripts/`: sharp scripts. `assets/`: source map (3200², not shipped) and `icon.svg`. `public/`: generated outputs. `reference/prototype.html`: behavior reference only.
- `tests/lib`, `tests/ui` (jsdom via `// @vitest-environment jsdom`), `tests/build` (separate config `vitest.build.config.js`).

## Rules
- TDD: write or update the failing test first. Flag any untested change.
- All data-derived text goes through `textContent` or `highlight()`/`escapeHtml()`. Never interpolate raw data into `innerHTML`.
- Keep README, CHANGELOG and this file accurate to the code.

## Deviations from SPEC.md
- Data `version` 2 adds a required `type` on every entry (sub-type filtering). `search`/`regionMatches`/`regionHasCategory` take an optional 4th `type` argument.
- Zoom is 1×/2×/3×, not 1×/2×. The selected pin shows its name label (the spec said no labels; this is only for the selection, hover and focus).
- Pins anchor their tip on the tower (the marker sits above it) rather than covering it.
- Results lists are sorted lowest rank first instead of data order. Type chips are sorted common → rare (`typesFor`: earliest `minRank`, then region count desc, then name).
- Additions not in the spec: idle region list, sticky toolbar, URL-hash state, keyboard shortcuts, install button/iOS help, offline badge.

## Known data caveats
- West/East Greatgut labels on the image look swapped; pins follow guides (`wgg` left x≈0.418, `egg` right x≈0.606). Don't edit the image.
- Hot Spring Bream rank disputed (`"1 or 5"`). Great Darkwood Tree vs Shroomhaven "Great Darkness Tree" unconfirmed (typed separately). `"-"` = spawns, rank unknown. Common fish, herbs and ground pickups aren't covered.
- `type` groupings are this project's own grouping, not the game's.
