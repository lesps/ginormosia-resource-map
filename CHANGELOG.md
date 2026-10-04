# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Sub-type chips follow the game's tier order, set by a new `typeOrder` list in `data/regions.json` (validated against the types in use). Chip tooltips show the earliest rank.

### Added
- LEVEL-5 copyright credit and non-affiliation notice in the site footer and README.
- Credit and link for the fan map annotations by u/dzchan (r/fantasylife “Ginormosia map WIP”).

## [1.0.0] - 2026-10-04

### Added
- Vite + vanilla JS app built from `SPEC.md`: map with 15 tower pins, region panel, search with highlighting, Ore/Trees/Fish filter, and the not-in-Ginormosia list.
- Sub-type filter: a `type` field on every data entry (data `version` 2) and a type chip row with per-type region counts. Choosing a type highlights matching pins with count badges and lists spawns lowest rank first.
- Redesigned pins: high-contrast teardrop markers anchored above each tower, gold hit state with a pulse ring, a name label on the selected pin, and a 44×56 px hit target.
- Usability: sticky search/filter bar, clear button, a "see list" jump link, a tappable region list when idle, 1×/2×/3× zoom that centers on the selection, URL-hash state, `/` and Esc shortcuts, and a two-column layout on wide screens.
- PWA via `vite-plugin-pwa` (auto-update, everything precached), manifest with 192/512/maskable icons from an original SVG, iOS meta, an install button or iOS instructions, an offline badge, and an offline-ready toast.
- Self-hosted Fredoka and Nunito (latin subset).
- `npm run assets` (sharp): 1600px map variant and icons.
- Tests: pure logic (`tests/lib`), jsdom UI (`tests/ui`), and a build suite (`npm run test:build`) covering the manifest, service worker precache, base path, iOS meta and the 1.5 MB budget.
- GitHub Pages deploy workflow gated on all tests.
