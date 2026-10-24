# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Field notes merge: `npm run merge-notes -- <export.json> [--dry-run]` folds exports into the data with tested rules (sightings confirm and lower ranks, expected absences are skipped, unexpected ones dispute single-source entries, name and drop corrections apply from English games, spots and places are added, free text goes to review), validates the result, archives the notes in `data/field-notes.json` and records their ids in `fieldNotesMerged`. New data fields `spots` and `places` (validated); the map shows the selected region's places as diamonds (tap to search) and an open card's spots as halos or pins, centring on them when zoomed in, and How to find says "Marked on the map". New source `ingame`.
- Field notes (opt-in, in My game): a region bar with the tower rank and time of day, an "Open questions (N)" checklist per region (disputed, one source, rank?, spot?, name?, drop names) with counts in the region list, and card actions — Seen here, Looked, not here, 📍 Mark spot, ✎ Note, English name corrections for ≈ monsters and drops — plus 📍 Mark a place. Placement mode records a tap on the map; your spots show as dashed halos. Notes stay on the device until exported (Share file, Download, Copy JSON, or a prefilled GitHub issue); merged notes are marked and left out by default. Format v1 is documented in the README.
- Search covers places and challenges: locations, challenge names and notes match from 3 characters ("agekara", "Fort Gardhart", "Glittering Silk"), with the matched text excerpted on the row, and matching regions (name, tower, landmark) are listed first under Places. Pins light up for place matches too ("•" when only a place matched), and the status line counts places.
- Badge filters: under the All chip, a row of badge chips (👑 🥈 ★ ⚑ 🐴 🌙 ☀️ ⛰️) with region counts filters every category by badge (`#tag=mount`). The badge key in "How spawns work" applies them.
- Your ranks: a "Your rank here" picker per region and a My game view (header button) for all 15 regions, saved on this device only. With a rank set, higher-rank entries fold behind "Show N more from R5", results split into "Available to you" / "Needs a higher rank" with "you: R2" on locked rows, pins whose matches all need a higher rank turn grey with a 🔒 count, the region list shows your ranks, and How to find tells you what to set the tower to (including "Gone above R4" for entries that disappear at higher ranks and a try-your-rank hint for disputed ranks). Unknown ranks count as available.
- The page meta description and the app manifest mention monsters. The footer data credit lists the same sources as the README.
- Monsters layer (data v4): 111 monsters in 255 region appearances from a 2026-10-23 survey (FLiDB, Gamer Guides, the Japanese wiki, kokorogu, gget.jp). A Monsters chip with type chips 👑 Gold-crown boss · 🥈 Silver-crown · ★ Legendary · ⚑ Challenge · Common (bosses first, so they're on screen on a phone); matching pins light up like resource types. Region panels list bosses first; in the All view monsters come after the other groups and common monsters fold behind "Show N common monsters" (a link to one opens it anyway). Under the Monsters chip the region list shows each region's boss count instead of resource dots. Monster cards show How to find (roams the field / only inside a cave or fort, sleeps by day or night, attacks on sight or not, the rank it disappears at, can drop a mount), drops, element, and a Name note when the English name is a translation (≈) or an unconfirmed match. New 🐴 mount badge, `cave-or-fort` spawn type, and 60 new drop names (59 translated; Sack of Copper is official).
- Monsters are stored once in a top-level `monsters` map and joined onto appearances at load; type and tags are derived from crown, spawn type, time and sleep. Validation rejects unknown monster ids and bad crown/time/sleeps/nameStatus/maxRank values.
- Keyboard focus stays on the row or toggle you pressed when the panel re-renders.
- Round-2 research merged: real locations for 17 entries (e.g. Drakeseye and Crickneck Oak, the Fangshore Sugar Tree ring, Godfish and Poseidon Swordfish east of Wyrm Maw Cave, Tunoco Quetzal and Forest Lordfish by the Monkey Village), and Gamer Guides node coordinates kept as `ggXY`.
- `spawnType` on 112 of 202 entries (overworld, tier roll, roaming, legendary, area challenge, fixed boss), so How to find now says how a spawn appears instead of "the exact spot isn't recorded". `shadow` (big/small) on 19 fish entries, shown as a checklist step.
- New entries, marked unconfirmed: Palm Tree in 5 regions, Palm Fruit Tree in 4, Cherry and Starry Tree in Shroomhaven, Great Starry Tree in Fangshore (challenge), and Rainbow Flying Fish in South Greatgut (disputed). New landmarks for Fangshore and Shroomhaven.
- Official English names for 6 drops (Fire/Earth Mana and Shard, Good Mysteria Masonry, Sack of Gold), plus better translations for Sack of Silver and Cherry Lordfish Moss.
- "How to find" checklist in each detail card: rank and tower, location, and the spawn rules that apply (crowns, legendary rolls, events, night/day, cave respawns, tier rolls, level), from `src/lib/find.js`.
- Pins now sit on each region's tower. Positions came from the tower diamonds in an in-game map screenshot, mapped onto the current image by fitting the two coastlines (pins moved 31–87 px).
- Resource detail cards: rows expand to show where, conditions, drops, note, reliability, sources and the Japanese name. Rows carry badges (gold/silver crown, legendary, event, night, day, cave, level, unconfirmed/disputed) and a one-line location. Search results open the exact card, and the open card is kept in the URL (`e=`).
- Region summary, tower and landmarks in the region panel. A "How spawns work" box in the footer with a badge key.
- Search also matches Japanese names and drop names ("ruby" lists everything that drops Ruby).
- Data v3: details from a new region-by-region guide (Gamer Guides, FAQ & Data Project, GameWith, Game8, kokorogu, wikiwiki). Japanese drop and monster names were translated; 96 translated drop names are flagged as unconfirmed English names (≈ in the app). Validation covers tags, confidence, sources, drops, unique entry names, rank 6, and no Japanese outside `nameJa`/`ja`.
- LEVEL-5 copyright credit and non-affiliation notice in the site footer and README.
- Credit and link for the fan map annotations by u/dzchan (r/fantasylife “Ginormosia map WIP”).

### Changed
- How to find no longer says "only during a challenge" twice for a challenge-only spawn without a named challenge (e.g. Burrow Star).
- `search` takes a filter object `{ query, category, type, tag }` and reports how each result matched (`via`).
- Bosses folded into Monsters: each old boss row merged into its monster (drops, spots and conditions kept, sources merged, confidence only up). The group rows "Silver-crown monsters" and "Fort Gardhart dark bosses" became individual monsters, Prairie Dragon / Goldmeer and Scorchrock's Napdragon / Prairie Dragon were split, Black Box is now Pandora's Box, Rock Ghost / Bouldergeist is Bouldergeist, and Fortoise is a common monster. Scorchrock's Pyro Panther is kept but disputed. Survey ranks win where both exist (e.g. Iron Golem in Wingtip 1 → 5); Lord of Curses' horn drop is now Bone Dragon Horn.
- Unrecorded ranks show as "R?" instead of "rank n/a". Monster rank tooltips say "Appears from Area Rank N" without the tier-roll wording.
- A challenge-only spawn names its challenge once ("Appears only during the '…' challenge and is marked on the map while active") instead of in two steps.
- Category chips tighten on phones so all five fit at 360 px and wider.
- The ≈ key in the footer now covers names as well as drops; the subtitle, search placeholder ("Platinum or Mimic") and footer credits mention monsters.
- Translated drop names keep the ≈ but lose the dotted underline, which was noise on monster cards where most drops are translations. Long locations in search results clamp to two lines.
- Round-2 rank changes: Amazing Gold (Drakeseye) 5 → 4; Superior Gold (Drakesnout) 3 → 2; Amazing Blue (Pettlewing) 4 → 5; Great Iron (Shroomhaven) 3 → 2; Darkwood (Shroomhaven) 3 → 4; Great Starry (Wingtip) 1 → 3; Dunefin Tuna (West Dryridge) 1 → 3; Electric Eel 1 → 3; Hot Spring Bream resolved to R1; Coldwater Tuna disputed (1 or 5).
- Confirmed by new sources: East Dryridge copper, Drakeseye Amazing Gold, Shroomhaven blue/iron ore and Darkwood, Fangshore Silver and Superior Marine Ore, Crystalline Bass, Iron Golems, Godfish and Poseidon Swordfish. Marked disputed: Drakesnout Amazing Gold, Fangshore Great Silver and Amazing Marine Ore, West Dryridge Great Haniwa, Rainbow Flying Fish.
- Great Darkness Tree is now a Darkwood tier roll at R4 (was an event). Tree tier order follows Gamer Guides' rarity field.
- Detail cards no longer show Reliability or the Japanese name; Where and Conditions are folded into the How to find checklist. The unconfirmed/disputed row badges stay, and Japanese names still match in search.
- Corrections from the guide: Rainbow Flying Fish moved from West Dryridge/South Greatgut to East Dryridge; Coldwater Tuna any → R5; Great Dragontree top → R5; Poseidon Swordfish top → R5; Starry/Great Starry Tree and Electric Eel ranks recorded (R1); Legendary Shiny Geode and Rocket Fish 3 → 3+; Crops any → R1. Viridia's Magic Ore Deposit is now Great Magic Ore Deposit, and King Woolie moved from Other to the bosses (now Monsters).
- New entries include Sand Fish, Cactus Fish, Skeleton Fish, Sneakfish, Crystalline Bass (disputed), Blackgill, Sneaky Tuna, Evil Carp, Faraway Sweetfish, Lulab Trout, Redgill, Lavashrimp, Godfish, Gold in Moltana Wastes, Superior Gold in Drakesnout, Legendary King Spud in four plains regions, and the Pickaxe/Axe of Time recipes.
- Entries found only in the earlier data (coastal Tuna/Dunefin Tuna/Flying Fish in several regions) are kept but marked unconfirmed.
- Escape now closes an open card before the region. Type chip rows start with "All …" instead of "Any …".
- New map image: a labelled 1024×1012 map replaces the fan-annotated one. It ships as `public/map.webp` at native size (90 KB, down from 335 KB). All 15 pins were re-placed just above each region's number, and the map frame now follows the image's aspect ratio from `data.image`.
- Pin markers draw smaller at 1× on phone-width screens so map labels stay readable (the tap target is unchanged).
- Sub-type chips follow the game's tier order, set by a new `typeOrder` list in `data/regions.json` (validated against the types in use). Chip tooltips show the earliest rank.

### Removed
- Shroomhaven's duplicate "monkey village" landmark (the Monkey Village entry stays).
- The Bosses chip and the red boss dot on pins and in the region list (bosses live under Monsters; every region has monsters, so there's no monster dot). Drop grouping by monster (`from`/`when`), which no entry uses any more.
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
