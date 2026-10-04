# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- "How to find" checklist in each detail card: rank and tower, location, and the spawn rules that apply (crowns, legendary rolls, events, night/day, cave respawns, tier rolls, level), from `src/lib/find.js`.
- Pins now sit on each region's tower. Positions came from the tower diamonds in an in-game map screenshot, mapped onto the current image by fitting the two coastlines (pins moved 31–87 px).
- Resource detail cards: rows expand to show where, conditions, drops, note, reliability, sources and the Japanese name. Rows carry badges (gold/silver crown, legendary, event, night, day, cave, level, unconfirmed/disputed) and a one-line location. Search results open the exact card, and the open card is kept in the URL (`e=`).
- Bosses category and chip (29 bosses with drops), typed Silver-crown / Field boss / Dungeon / Challenge / Legendary.
- Region summary, tower and landmarks in the region panel. A "How spawns work" box in the footer with a badge key.
- Search also matches Japanese names and drop names ("ruby" lists everything that drops Ruby).
- Data v3: details from a new region-by-region guide (Gamer Guides, FAQ & Data Project, GameWith, Game8, kokorogu, wikiwiki). Japanese drop and monster names were translated; 96 translated drop names are flagged as unconfirmed English names (≈ in the app). Validation covers tags, confidence, sources, drops, unique entry names, rank 6, and no Japanese outside `nameJa`/`ja`.
- LEVEL-5 copyright credit and non-affiliation notice in the site footer and README.
- Credit and link for the fan map annotations by u/dzchan (r/fantasylife “Ginormosia map WIP”).

### Changed
- Detail cards no longer show Reliability or the Japanese name; Where and Conditions are folded into the How to find checklist. The unconfirmed/disputed row badges stay, and Japanese names still match in search.
- Corrections from the guide: Rainbow Flying Fish moved from West Dryridge/South Greatgut to East Dryridge; Coldwater Tuna any → R5; Great Dragontree top → R5; Poseidon Swordfish top → R5; Starry/Great Starry Tree and Electric Eel ranks recorded (R1); Legendary Shiny Geode and Rocket Fish 3 → 3+; Crops any → R1. Viridia's Magic Ore Deposit is now Great Magic Ore Deposit, and King Woolie moved from Other to Bosses.
- New entries include Sand Fish, Cactus Fish, Skeleton Fish, Sneakfish, Crystalline Bass (disputed), Blackgill, Sneaky Tuna, Evil Carp, Faraway Sweetfish, Lulab Trout, Redgill, Lavashrimp, Godfish, Gold in Moltana Wastes, Superior Gold in Drakesnout, Legendary King Spud in four plains regions, and the Pickaxe/Axe of Time recipes.
- Entries found only in the earlier data (coastal Tuna/Dunefin Tuna/Flying Fish in several regions) are kept but marked unconfirmed.
- Escape now closes an open card before the region. Type chip rows start with "All …" instead of "Any …".
- New map image: a labelled 1024×1012 map replaces the fan-annotated one. It ships as `public/map.webp` at native size (90 KB, down from 335 KB). All 15 pins were re-placed just above each region's number, and the map frame now follows the image's aspect ratio from `data.image`.
- Pin markers draw smaller at 1× on phone-width screens so map labels stay readable (the tap target is unchanged).
- Sub-type chips follow the game's tier order, set by a new `typeOrder` list in `data/regions.json` (validated against the types in use). Chip tooltips show the earliest rank.

### Removed
- The selected pin's name tag; the new image labels every region.
- The r/fantasylife fan-annotation credit, and the swapped West/East Greatgut caveat, which no longer applies.

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
