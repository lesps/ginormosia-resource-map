# Ginormosia Resource Map — Build Spec

A phone-first, installable, offline-capable web app that shows where every gatherable resource (ore, trees, fish) spawns in Ginormosia, the open-world continent in *Fantasy Life i: The Girl Who Steals Time*. Pins sit on each region's tower on a real map image. Tapping a pin lists that region's resources with the minimum Area Rank each needs; a search box highlights every region that has a given resource.

A working single-file prototype already exists (`reference/prototype.html`). This project turns it into a maintainable, tested PWA hosted on GitHub Pages.

## Package contents

| Path | What it is |
|---|---|
| `SPEC.md` | This file. |
| `assets/ginormosia-map.webp` | Source map, 3200×3200, ~1 MB. Annotated fan image with region labels and tower diamonds. |
| `data/regions.json` | All resource data plus pin coordinates. **Source of truth.** |
| `reference/prototype.html` | The current prototype. Behavior reference only; do not copy its structure (it inlines data, CSS, and JS in one file). Open it from inside this package so its relative image path resolves. |

## Goals

1. Same features as the prototype: map with 15 pins, region detail panel, resource search with highlighting, Ore / Trees / Fish filter, the "not in Ginormosia" list.
2. Installable to the home screen and fully usable offline after first load.
3. Data lives in `regions.json`, separate from code, so corrections are a data edit.
4. Tested (Vitest), documented (README, CHANGELOG, CLAUDE.md), deployed by GitHub Actions.

## Non-goals

No accounts, no backend, no analytics, no per-node coordinates (pins are per region), no framework (React/Vue). No user-editable data in v1.

## Tech decisions (load-bearing)

- **Vite + vanilla ES modules.** Vite handles the GitHub Pages base path and asset hashing; no framework needed for ~15 interactive elements.
- **`vite-plugin-pwa` (Workbox, `generateSW`, `registerType: 'autoUpdate'`).** Precaches the build output, including the map image and `regions.json`, so the app works offline. Do not hand-write a service worker.
- **Pins are absolutely positioned `<button>`s over an `<img>`**, positioned with `left: x*100%; top: y*100%`. This is simpler and more accessible than the prototype's SVG approach, and the normalized coordinates in the JSON map directly onto it.
- **Pure logic in `src/lib/`** (search, filter, rank formatting, data validation) with no DOM access, so it's unit-testable without jsdom. DOM code lives in `src/ui/` and gets jsdom tests.
- **`sharp`** (dev dependency) generates the display image variant and the app icons from scripts under `scripts/`, run on `npm run assets`.

## Data model (`data/regions.json`)

```jsonc
{
  "version": 1,
  "image": { "file": "...", "width": 3200, "height": 3200, "coordSpace": "normalized 0-1, origin top-left" },
  "categories": ["ore", "trees", "fish", "other"],
  "rankLegend": { "1-5": "minimum Area Rank", "any": "...", "top": "...", "3+": "...", "-": "...", "1 or 5": "..." },
  "regions": [
    {
      "id": "drakeseye",                 // unique, kebab/lowercase
      "name": "Drakeseye Valley",
      "where": "West coast, central lake with four rivers",
      "pin": { "x": 0.084, "y": 0.487 }, // normalized, on the region's tower diamond
      "ore":   [{ "name": "Gold Deposit", "minRank": "1" }],
      "trees": [{ "name": "Giant's Tree", "minRank": "5", "note": "boss" }],
      "fish":  [],
      "other": []
    }
  ],
  "notInGinormosia": [{ "name": "Luminous Magic Ore", "foundAt": "..." }]
}
```

`minRank` is always a string. Valid values: `"1"`–`"5"`, `"any"`, `"top"`, `"3+"`, `"-"`, `"1 or 5"`. Display mapping: digits → `R1`…`R5`, `any` → `any rank`, `top` → `top rank`, `3+` → `R3+`, `-` → `rank n/a`, `1 or 5` → `R1 or R5`.

## Behavior spec

**Map**
- The map image fills the content width (max 860px) at 1:1 aspect ratio.
- 15 pins, one per region. Each pin shows small colored dots for which of ore / trees / fish the region has (ore `#5a6888`, trees `#3f8a46`, fish `#2b7cc0`).
- A zoom toggle (1× / 2×) scales the map inside a scrollable container so pins are tappable on a ~380px-wide phone. Pin hit targets are at least 44×44 CSS px at every zoom level.
- No region name labels are drawn; the image already has them.

**Selecting a region**
- Tapping a pin (or Enter/Space when it's focused) selects it: gold outline on the pin, detail panel shows name, `where`, then groups Ore / Trees / Fish / Other, each entry as name, optional note, and formatted rank. Empty groups are hidden.
- The panel scrolls into view (`behavior: 'auto'` under reduced motion).

**Search**
- Case-insensitive substring match on entry names, across all regions, respecting the active category filter.
- While a query is active and no region is selected, the panel lists every match as "*name* in *region*, *note*", with a rank. Tapping a row selects that region and shows a "Back to search results" control.
- Matching pins turn gold; non-matching pins dim to ~22% opacity.
- No matches: say nothing in Ginormosia matches, name the active filter if one is on, and point to the not-in-Ginormosia list.
- Matched substrings are highlighted with `<mark>`. All data-derived text is escaped.

**Filter**
- Chips: All / Ore / Trees / Fish, single-select, `aria-pressed`. Regions with no entries in the active category dim. The detail panel shows only the active category.

**Footer**
- The `notInGinormosia` list, plus a source line: "Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), cross-checked with Gamer Guides and Game Rant."

**Quality floor**
- Light and dark themes via `prefers-color-scheme`.
- Visible keyboard focus.
- Safe-area insets respected (`viewport-fit=cover`).
- Lighthouse accessibility ≥ 95.
- First load under 1.5 MB transferred. The 3200px source image is not shipped; ship the generated 1600px variant.

## Known data caveats

Keep these visible in the README so they don't get "fixed" by accident:

- **Swapped labels:** the image's West/East Greatgut labels appear swapped. Pins follow the guide descriptions: `wgg` is the left diamond (x≈0.418), `egg` the right (x≈0.606). The image is not edited.
- **Hot Spring Bream** rank is disputed (`"1 or 5"`).
- **Great Darkwood Tree:** whether it is Shroomhaven's "Great Darkness Tree" event is unconfirmed.
- **Rank "-" entries** (Starry Tree, Electric Eel, etc.) are known to spawn, but the rank isn't recorded.
- **Not covered:** common fish, herbs and ground pickups.

## Hosting note

GitHub Pages on a free account requires a public repo. The map image is Level-5 game art with fan annotations, and publishing it publicly redistributes it. That's the owner's call to make. Session 4 supports both public Pages and, as a fallback, a private repo with local install.

---

# Sessions

Run each session in a fresh Claude Code context. Each one is self-contained: it restates what it needs and does not assume memory of earlier sessions beyond what's in the repo. Every session follows TDD (write or update the failing test first), keeps `CLAUDE.md`, `README.md` and `CHANGELOG.md` accurate to what actually exists at the end of the session, and flags any untested change instead of shipping it silently.

## Session 1: Scaffold, data, and pure logic

**Context.** New repo for a Vite + vanilla JS PWA that maps Fantasy Life i resources to Ginormosia regions. This package (`SPEC.md`, `assets/`, `data/`, `reference/`) has been copied into the repo root. Data lives in `data/regions.json` (schema in SPEC.md, "Data model"). This session builds no UI. It sets up tooling and the pure functions every later session depends on.

**Tasks**
1. `npm create vite@latest` (vanilla JS) in the repo root. Keep `data/`, `assets/`, `reference/` and `SPEC.md`. Add Vitest, and jsdom as a dev dependency for later sessions.
2. `src/lib/data.js`: `loadRegions(json)` returns the regions object after `validateRegions`. Validation throws a descriptive error if:
   - ids are not unique,
   - a pin x/y is outside [0,1],
   - a `minRank` is not in the allowed set,
   - a category key is missing or isn't an array,
   - an entry lacks `name`.
3. `src/lib/rank.js`: `formatRank(minRank)` per the display mapping in SPEC.md.
4. `src/lib/search.js`:
   - `search(regions, query, category)` returns `[{ regionId, category, entry }]`; empty or whitespace query returns `[]`.
   - `regionHasCategory(region, category)` (category `"all"` is always true).
   - `regionMatches(region, query, category)` returns a boolean.
5. `src/lib/escape.js`: `escapeHtml`, plus `highlight(text, query)` that escapes, then wraps the first case-insensitive match in `<mark>`.
6. Tests in `tests/lib/*.test.js`, written before the implementation. They cover:
   - the real `regions.json` passes validation and has exactly 15 regions,
   - each validation failure path,
   - every `formatRank` value,
   - search case-insensitivity,
   - search category scoping (e.g. "Oak" + `ore` returns nothing),
   - "platinum" returns exactly the regions sgg, moltana and scorchrock,
   - `highlight` escapes HTML and doesn't double-escape.
7. Docs:
   - `CLAUDE.md`: stack, commands, folder layout, "data is the source of truth", TDD rule, the known data caveats.
   - `README.md`: what it is, how to run, how to edit data.
   - `CHANGELOG.md`: Keep a Changelog format, entry under Unreleased.

**Definition of done**
- `npm test` passes with the cases above.
- No UI code exists yet.
- Docs describe only what exists.

**Verify**
```bash
npm ci && npm test
node -e "const d=require('./data/regions.json');console.log(d.regions.length)"   # 15
```

## Session 2: UI

**Context.** The repo is a Vite vanilla-JS app. Pure logic already exists and is tested in `src/lib/`: `loadRegions`, `formatRank`, `search`, `regionHasCategory`, `regionMatches`, `escapeHtml`, `highlight`. Data is `data/regions.json` with normalized pin coordinates. The map image is `assets/ginormosia-map.webp` (3200²). `reference/prototype.html` shows the intended look and behavior. This session builds the interface described in SPEC.md, "Behavior spec".

**Tasks**
1. `scripts/build-assets.mjs` (sharp): write `public/map-1600.webp` (quality ~78) from the source. Add an `npm run assets` script, and commit the output.
2. `index.html` + `src/main.js` + `src/ui/` modules:
   - `map.js`: renders the image and the pin buttons, and handles zoom.
   - `panel.js`: renders the region view, the search results view and the empty states.
   - `controls.js`: search input and filter chips.
   - `state.js`: a tiny store for `{ category, selectedId, query }` with subscribe.
3. CSS in `src/styles.css`:
   - color tokens with light/dark themes,
   - fonts: Fredoka for headings, Nunito for body, both with fallbacks,
   - pins absolutely positioned with percentages, hit targets ≥ 44px,
   - safe-area padding.
4. jsdom tests in `tests/ui/*.test.js`, written first:
   - 15 pins render, each with an `aria-label` equal to the region name,
   - clicking a pin shows that region's groups and hides empty ones,
   - the filter chip hides other groups and dims regions without that category,
   - typing "skytree" lists only Shroomhaven matches and marks its pin as a hit,
   - a no-match query shows the no-matches message,
   - keyboard Enter on a focused pin selects it,
   - data containing `<script>` renders as text.
5. Update the docs (README screenshots are optional; describe the features).

**Definition of done**
- `npm test` is green.
- `npm run dev` shows parity with `reference/prototype.html`, plus the zoom toggle.
- `npm run build` succeeds.
- `dist/` is under 1.5 MB.

**Verify**
```bash
npm test
npm run assets && npm run build && du -sh dist
npm run preview   # check manually on a phone-width viewport
```

## Session 3: Installable and offline (PWA)

**Context.** The repo is a working Vite vanilla-JS app (see README/CLAUDE.md) that renders the Ginormosia resource map from `data/regions.json` and `public/map-1600.webp`. This session makes it installable to a phone home screen and usable offline. Don't change UI behavior.

**Tasks**
1. Add `vite-plugin-pwa`:
   - `registerType: 'autoUpdate'`,
   - `workbox.globPatterns` including `**/*.{js,css,html,webp,png,json,woff2}`,
   - `maximumFileSizeToCacheInBytes` large enough for the map.
   - If `regions.json` is imported, it's bundled into JS; that's fine.
2. Manifest:
   - name "Ginormosia Resource Map", short_name "Ginormosia",
   - `display: standalone`, `start_url` and `scope` relative to the Vite `base`,
   - theme/background colors from the CSS tokens,
   - icons 192, 512 and a 512 maskable.
3. `scripts/build-icons.mjs` (sharp): generate the icons from a simple original SVG glyph (a map pin over a compass rose) committed at `assets/icon.svg`. Do not crop game art for the icon.
4. Fonts: self-host Fredoka and Nunito (`@fontsource/*`) so offline rendering matches. Remove the Google Fonts links.
5. iOS meta: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`.
6. Tests, written first:
   - after `npm run build`, `dist/manifest.webmanifest` has the required fields and the icon files exist,
   - `dist/sw.js` exists, and its precache list includes the map image and the main JS bundle.
   - Implement these as a Vitest suite that runs against `dist/`, behind `npm run test:build`.
7. Docs: install-to-home-screen instructions for iOS and Android in the README, and a CHANGELOG entry.

**Definition of done**
- `npm test && npm run build && npm run test:build` are green.
- In `npm run preview`, DevTools shows the service worker active and the app loads with the network set to Offline.
- The manifest is reported installable.

**Verify**
```bash
npm test && npm run build && npm run test:build
npm run preview
# Chrome DevTools: Application → Manifest (no errors), Service Workers (activated),
# Network → Offline → reload, app still fully works
```

## Session 4: Deploy and finalize docs

**Context.** The repo is a tested, installable Vite PWA (see README/CLAUDE.md). This session deploys it to GitHub Pages with Actions and makes sure the docs match the code.

**Tasks**
1. Set the Vite `base` from an env var (`BASE_PATH`, default `/`). The workflow sets it to `/<repo-name>/`. Confirm the manifest `scope` and `start_url` follow it.
2. `.github/workflows/deploy.yml`:
   - on push to `main`: `npm ci`, `npm test`, `npm run build`, `npm run test:build`, then `actions/upload-pages-artifact` and `actions/deploy-pages`,
   - fails the deploy if any test fails.
3. A test (under `test:build`) that `dist/index.html` asset URLs respect `BASE_PATH` when it's set.
4. README:
   - live URL placeholder,
   - the hosting note from SPEC.md (public repo means public art),
   - fallback for a private repo: `npm run build && npx serve dist` on the local network, then install from the phone, or keep using the claude.ai artifact.
5. Final docs audit:
   - every command in README and CLAUDE.md runs as written,
   - CHANGELOG gets a `1.0.0` release entry,
   - remove anything describing planned-but-unbuilt features,
   - list any drift found.

**Definition of done**
- The workflow file is valid.
- `BASE_PATH=/ginormosia-map/ npm run build && npm run test:build` is green.
- Docs are verified against the code.

**Verify**
```bash
BASE_PATH=/ginormosia-map/ npm run build && npm run test:build
npx --yes action-validator .github/workflows/deploy.yml   # or actionlint if installed
grep -n "npm " README.md CLAUDE.md   # run each listed command once
```

## Future ideas (not in v1)

- Per-node coordinates for common resources, if a data source with node positions turns up.
- "I've found this" checkmarks stored in `localStorage`.
- A link from each entry to its source page.
