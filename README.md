# Ginormosia Resource Map

A phone-first, installable, offline web app showing where every gatherable resource (ore, trees, fish) and monster spawns in Ginormosia, the open-world continent in *Fantasy Life i: The Girl Who Steals Time*.

Live: `https://lesps.github.io/ginormosia-resource-map/`

## Features

- **Map with 15 pins**, one on each region's tower. Tower positions were located from an in-game map screenshot. Pins are red teardrop markers with a white outline and shadow so they stand out on the art. Each one carries colored dots for the resource categories found there (ore, trees, fish); monsters get no dot because every region has them. On phones the marker is drawn smaller at 1× so labels stay readable, while the tap target stays 44×56 px.
- **Category and sub-type filters.** Pick Ore, Trees, Fish or Monsters, then a type row appears (for example Gold, Platinum, Starcrystal; Oak, Cherry, Angeltree; Tuna, Lordfish; 👑 Gold-crown boss, 🥈 Silver-crown, ★ Legendary, ⚑ Challenge, Common). Resource type chips follow the game's tier order (Copper → Iron → Silver → Gold → Platinum…; Oak → Palm → Pine…); monster chips put bosses first and carry the same icon as the row badge. Each chip shows how many regions have it. Choosing a type turns matching pins gold with a count badge, dims the rest, and lists every spawn, lowest rank first.
- **Region list**: with no region selected, the panel lists all 15 regions with dots for their resource categories. Under the Monsters chip each row shows its boss count instead (👑 gold-crown, 🥈 silver-crown).
- **Search** across resource and monster names, their Japanese names and drops, and (from 3 characters) locations, challenges and notes, combined with the active filters. Search "ruby" and you get every node and monster that drops Ruby, labelled "drops Ruby"; search "agekara", "Fort Gardhart" or "Glittering Silk" and you get everything at that place or during that challenge, with the matched text shown on the row ("during 'Beware the Glittering Silk' challenge"). Matching regions (by name, tower or landmark) come first under **Places**; tapping one opens the region. Name matches sort above drop, location, challenge and note matches, then earliest rank first. Matches are highlighted.
- **Badge filters.** Under the All chip, the second row filters by badge: 👑 Gold-crown, 🥈 Silver-crown, ★ Legendary, ⚑ Challenge, 🐴 Mount, 🌙 Night only, ☀️ Day only, ⛰️ Cave, each with its region count. A badge works like a type chip (pins, a list of every spawn with it, tap again to turn it off) and is cleared by changing category. The badge key in "How spawns work" applies the same filters.
- **Region panel**: tap a pin, a result, or a name in the region list. It shows the region's summary, tower and landmarks, then its ore, trees, fish, other resources and monsters (last, so a long monster list doesn't bury the rest). Monsters are listed bosses first (gold-crown, silver-crown, legendary, challenge), then common ones. Under the All chip the common monsters fold behind a "Show N common monsters" button so the list stays short; the Monsters chip lists them all, and a link to a common monster opens it either way. Close with × or Esc.
- **Resource detail cards.** Each row shows the name, a one-line location, badges and the minimum rank. Badges: 👑 gold-crown, 🥈 silver-crown, ★ legendary, ⚑ event or challenge, 🌙 night, ☀️ day, ⛰️ cave, 🐴 can drop a mount, a level badge like Lv60, and "unconfirmed"/"disputed" for weaker data. A ≈ after a monster name means the English name is a translation or an unconfirmed match. Tapping a row opens its card: a numbered **How to find** checklist, then drops, element (monsters), a name note for unconfirmed names, note and sources. The checklist is built from the data, never invented: the rank to set and at which tower, where to go (or that the exact spot isn't recorded), plus the relevant spawn rules (gold-crown respawns, silver-crown resets, legendary rolls, event-only, night/day, cave-node respawns, random tier rolls, recommended level), for monsters whether it roams the field, when it sleeps, whether it attacks on sight, the rank it disappears at and whether it can drop a mount, and any extra condition notes. Japanese names aren't shown but still work in search. One card is open at a time. Tapping a search result opens that exact card.
- **Your ranks.** Each region panel has a "Your rank here" picker (Not set, R1–R7) for the highest Area Rank you've reached there. With a rank set, entries that need more fold to the end of their group behind "Show N more from R5"; entries with an unrecorded rank (R?) stay visible. Search and type results split into "Available to you" and "Needs a higher rank" (locked rows show "you: R2"), a pin whose matches all need a higher rank turns grey with a 🔒 count, the region list shows your rank per region, and How to find speaks to your rank ("You've unlocked R6 here, so set the tower to R5 or higher", "Gone above R4: set the tower to R4 or lower"). Opening a locked entry from a result or link unfolds it.
- **My game**: a header button opens your Area Ranks for all 15 regions, with "Set all to" and a two-tap "Clear all". Ranks are saved on this device only (`localStorage`, falling back to memory when storage is blocked) and never go in the URL.
- **Field notes** (opt-in, in My game): record what you see in the game — sightings with the tower rank and time, spots and places tapped on the map, English names for ≈ monsters and drops, free notes — against a per-region checklist of open questions, then export them as a file or a prefilled GitHub issue. See [Field notes](#field-notes).
- **How spawns work**: a collapsible box in the footer explains tier rolls, crowns, legendary challenges and Area Points, with a key to the badges.
- **Zoom** 1× / 2× / 3×. The map pans inside its frame and centers on the selected pin. Pins keep a 44×56 px hit target at every zoom.
- **Shareable state**: the filter, type, badge, search and selected region are kept in the URL hash (`#cat=ore&type=Platinum&r=moltana&e=golemstone`, `#tag=mount`), including an open detail card.
- **Keyboard**: `/` focuses search, Esc closes My game, then the open card, then the region, then clears the search, Enter/Space selects a focused pin.
- **Installable and offline**: an Install button (Android/desktop Chrome) or Add-to-Home-Screen steps (iOS). Once loaded, it works fully offline. An "Offline" badge shows when you lose your connection.
- Light/dark themes, safe-area aware, self-hosted fonts, about 0.4 MB precached. All five category chips fit on screens 360 px and wider.

## Field notes

The data still has gaps (151 spawns with no recorded rank, 98 resting on one source, 10 disputed, and many names that are translations), and the game screen settles them. Field notes turn those gaps into a checklist while you play and record each answer in a tap. They only capture what you saw; they never change the map's data in the app.

- **Turn it on** in My game ("Field notes"). Off by default; with it off, nothing changes anywhere.
- **Region panel:** a Field notes bar with **Tower set to** (defaults to your rank; an explicit choice is remembered per region) and a ☀️ Day / 🌙 Night toggle (not saved). **Open questions (N)** lists each entry with something unknown — `disputed`, `one source`, `rank?`, `spot?`, `name?`, `N drop names` — and tapping one opens its card. The region list shows each region's count ("? 14").
- **Entry card:** **Seen here** and **Looked, not here** (hidden for tier rolls, legendary and challenge spawns, where absence means nothing) record the tower rank and time of day. **📍 Mark spot** (hidden for spawns that aren't at one place) and **📍 Mark a place** (from the region bar, picking a landmark or typing a name) switch the map to placement mode: tap the spot (zoom in for accuracy), or Esc/Cancel. **✎ Note** saves up to 500 characters. For ≈ names, "English name in game: Same as shown / Different…" records the monster's name, and ✎ next to each ≈ drop records the drop's, keyed by its Japanese name. Your notes for the entry are listed newest first, each with Undo.
- **My game is in English** (on by default): name corrections only make sense from the English release, so turning it off hides them and marks the export `gameLanguage: "other"`.
- **Export** (in My game): Share file (where the browser supports it), Download, Copy JSON, or **Open GitHub issue** (prefilled with the JSON, titled "[field notes] N notes", label `field-notes`; disabled with an explanation when the URL would pass 8,000 characters). Merged notes (ids listed in `data.fieldNotesMerged`) are left out unless "Include merged notes" is on. "Clear merged notes" and a two-tap "Clear all notes" tidy up. Notes live only on this device (`localStorage`) until you export them; if a save fails, a toast asks you to export now.

**Note format v1.** Every note has `id` (`n-YYYYMMDD-` + 6 random base36 characters), `date` (local `YYYY-MM-DD`, no time, no personal data) and `kind`:

| kind | fields |
|---|---|
| `seen`, `absent` | `region`, `category`, `entry`, `rank` (1–7 or null), `time` (`day`/`night`/null) |
| `spot` | `region`, `category`, `entry`, `x`, `y` (0–1 on the map image), `zoom` |
| `place` | `region`, `name`, `x`, `y`, `zoom` |
| `name` | `monster` (id), `shown`, `inGame` |
| `drop-name` | `ja`, `shown`, `inGame` |
| `text` | `region`, `category`, `entry`, `text` (≤ 500 characters) |

`entry` is the monster id for monsters and the entry key (the `e=` slug) otherwise. An export is `{ "format": "ginormosia-field-notes", "version": 1, "dataVersion": 4, "exported": "YYYY-MM-DD", "gameLanguage": "en", "notes": [...] }`.

## Install on your phone

- **Android (Chrome):** open the site and tap **Install app** in the header, or use ⋮ → *Install app* / *Add to Home screen*.
- **iPhone/iPad (Safari):** tap **Install app** for the steps: Share → *Add to Home Screen* → Add.

Open it once while online. The service worker then caches everything, including the map, so later launches work in airplane mode. Updates install automatically the next time you open it online.

## Develop

```bash
npm ci
npm run dev          # local dev server
npm test             # unit + jsdom UI tests (Vitest)
npm run build        # production build to dist/
npm run test:build   # checks dist/: manifest, service worker precache, base path, size budget
npm run preview      # serve dist/ locally
npm run assets       # regenerate public/map.webp and the icons (sharp)
```

`npm run test:build` needs a fresh `npm run build` first. To check a sub-path build: `BASE_PATH=/ginormosia-resource-map/ npm run build && BASE_PATH=/ginormosia-resource-map/ npm run test:build`.

## Editing data

All resource data is in `data/regions.json`. A correction should only need a data edit. Each entry looks like this:

```json
{
  "name": "Golden Swordfish", "type": "Swordfish", "minRank": "5",
  "where": "Off the coast", "conditions": "gold-crown; Lv60", "tags": ["gold-crown"], "level": 60,
  "drops": [{ "name": "Golden Fin", "ja": "ゴールデンヒレ", "official": true }],
  "note": "optional", "confidence": "confirmed", "sources": ["gg_fish", "kokorogu"], "nameJa": "ゴールデンカジキ"
}
```

Only `name`, `type` and `minRank` are required. Categories are `ore`, `trees`, `fish`, `monsters` and `other`. Entry names must be unique within a region, because they form the deep-link key. Monsters are stored differently; see below.

- `type` groups tiers of the same resource and drives the sub-type chips. Reuse an existing type where one fits.
- `minRank` is a string: `"1"`–`"6"`, `"any"`, `"top"`, `"3+"`, `"-"` (rank not recorded) or `"1 or 5"` (sources disagree; currently Coldwater Tuna).
- Pins use normalized coordinates (`0–1`, origin top-left), placed on the region's tower. They were measured by detecting the tower diamonds in an in-game map screenshot and fitting the screenshot's coastline onto this image (about 1% of the map width of uncertainty). `image.width`/`height` must match `assets/ginormosia-map.jpg`; the map frame takes its aspect ratio from them.

- `tags` come from a fixed set: `gold-crown`, `silver-crown`, `legendary`, `event`, `night`, `day`, `cave`, `mount`. `confidence` is `confirmed`, `single-source` or `disputed`, and every key in `sources` must exist in the top-level `sources` map.
- `spawnType` (optional) describes how a spawn without a recorded spot appears: `overworld`, `tier-roll`, `roaming`, `legendary-event`, `area-challenge`, `fixed-boss` or `cave-or-fort`. The How to find checklist turns it into a sentence; a recorded `where` always wins (for `cave-or-fort` it reads "Only found inside …").
- `shadow` (fish only, optional) is `big` or `small`, the fish-shadow size to cast at.
- `ggXY` (optional) holds Gamer Guides map coordinates for individual nodes, kept for future per-node pins; the app doesn't use them yet.
- `drops[].official` is `true` only when the English name is confirmed. Translated names are `false`, keep the original in `ja`, and show with a ≈ mark in the app.
- Regions also carry `nameJa`, `tower`, `landmarks` and `summary`. Top-level `mechanics` feeds the "How spawns work" box.
- `typeOrder` lists each category's types in the game's tier order and sets the chip order (for monsters: Gold-crown boss, Silver-crown, Legendary, Challenge, Common). Every type used in the data must appear there exactly once, and nothing else. To fix a tier, move the name in the list.

### Monsters

Each monster is stored once in the top-level `monsters` map and joined onto its appearances when the app loads (`expandMonsters` in `src/lib/data.js`), so a drop or name fix is one edit:

```json
"monsters": {
  "white-woolie": {
    "name": "White Woolie", "nameJa": "バハ・ハ", "time": "day", "sleeps": "night", "aggressive": false, "mount": true,
    "element": "Neutral", "drops": [{ "name": "Wool", "ja": "羊毛", "official": false }]
  }
}
```

A region's `monsters` array holds appearances: `{ "id": "white-woolie", "minRank": "-", "spawnType": "overworld", "confidence": "confirmed", "sources": ["hassaku", "gg_monsters"] }`, plus optional `where`, `time` (overrides the monster's), `maxRank` (last rank it appears at), `conditions`, `note` (added after the monster's note) and `drops` (replaces the monster's; `[]` for none). The array order is the display order: bosses first, then common monsters, each by rank.

- Monster fields: `crown` (`gold`/`silver`), `time` and `sleeps` (`day`/`night`; `sleeps` means it stays but is asleep then), `aggressive` (attacks on sight), `mount`, `element`, `drops`, `note`, and `nameStatus`: absent for a confirmed English name, `probable` for a name matched by region only, `unofficial` for a translation. The last two show a ≈.
- `type` and `tags` are derived, not stored: `legendary-event` → Legendary, `area-challenge` → Challenge, otherwise the crown (Gold-crown boss, Silver-crown) or Common. Crown tags only go on their own type, `event` on challenges, `night`/`day` from the time unless the monster just sleeps through the other half, `cave` when `where` names a cave, and `mount`.

`npm test` validates the file (unique ids, pin range, ranks, names, types, category arrays, tags, confidence, sources, drops, unique entry names, monster ids and fields, and no Japanese text outside `nameJa`/`ja`), so run it after editing.

## Known data caveats

These are deliberate; don't "fix" them by accident.

- **Coldwater Tuna** rank is disputed (`"1 or 5"`): Japanese sources say Rank 1, Gamer Guides says Rank 5+.
- **Rainbow Flying Fish** is listed in both East Dryridge and South Greatgut, marked disputed: sources split 2–2.
- **Great Darkwood Tree:** Japanese sources list it in Shroomhaven from Rank 4 as a regular Darkwood tier, so Shroomhaven's "Great Darkness Tree" is now typed as Darkwood at R4. It stays on the not-in-Ginormosia list with a note, until checked in game.
- **Rank `"-"` entries** (Starry Tree, Electric Eel, etc.) are known to spawn, but the rank isn't recorded. They show as "R?". This covers 136 of the 255 monster appearances; for common monsters How to find says most are around from Area Rank 1.
- **Not covered:** common fish, herbs and ground pickups.
- **Data v3 provenance:** details, bosses and corrections come from a region-by-region guide compiled on 2026-10-04 from Gamer Guides, the FAQ & Data Project and Japanese sources (GameWith, Game8, kokorogu, wikiwiki). Entries found only in the earlier dataset (mostly coastal Tuna and Flying Fish) are kept, marked unconfirmed, with source `earlier`.
- **Translated names:** Japanese drop and monster names were translated for this app. 148 of 182 drop names have no confirmed English name (`official: false`), and 17 monster names are translations or unconfirmed matches (`nameStatus`). Element names (Water, Neutral, Wind…) are translations too. They may not match the English release.
- **Per-node pins** aren't available yet. Tower positions on the current image are now known (the region pins), but the towers' coordinates on Gamer Guides' interactive map still need measuring before node coordinates can be converted.
- **Tier order** (`typeOrder`) comes from published mining and woodcutting levels (Copper Lv 2, Iron 18, Blue Ore ~20, Silver ~23, Marine Ore ~25, Gold ~30, Platinum ~43; Oak 2–3, Palm 9–10, Pine 15, Sugar/Desert ~22–30, Skytree ~35, Darkwood ~50) and fish star ratings. Monster types aren't game tiers; they run bosses first (Gold-crown boss → Silver-crown → Legendary → Challenge → Common) to match the region panel. Tree tiers follow Gamer Guides' rarity field (Oak/Palm/Desert 1, Apple/Pine/Palm Fruit 2, Cherry/Sugar/Pear 3, Starry/Cherry Fruit 4, Darkwood 5). Red Ore is rarity 4, like Gold and Platinum. Haniwa Stone, Fossil, Eel and Sand Fish still have no published tier.
- **Monster data** (data v4) comes from a monster survey compiled on 2026-10-23 from FLiDB (hassaku74kg.com), Gamer Guides' monster list, the Japanese wiki, kokorogu and gget.jp: 111 monsters in 255 appearances. The old boss entries were folded in: drops, spots and conditions were kept, sources merged, and confidence only moved up. Old group rows ("Silver-crown monsters", "Fort Gardhart dark bosses") were split into their monsters, and the Prairie Dragon / Goldmeer row's drops were split by item type. Pyro Panther in Scorchrock's Agekara Cave is kept from the earlier sources but marked disputed, because the survey lists that cave boss under Moltana Wastes. Hearhare ("most grassy areas") has no region list, so it isn't placed.
- **Type groupings** (`type` field) were added for filtering and are this project's own grouping, not the game's. Monster types are derived from crown and spawn type (see Editing data). New fish types (Sand Fish, Skeleton Fish, Evil Carp, Crystalline Bass, Godfish) have guessed tier positions. `Cherry Fruit Tree` and `Palm Fruit Tree` are grouped as `Fruit Tree`, separate from lumber `Cherry`/`Palm`. `Eruptuna` is grouped under `Tuna`.

## Hosting

`.github/workflows/deploy.yml` runs tests, builds with `BASE_PATH=/<repo-name>/`, checks the build and deploys to GitHub Pages on every push to `main`. To turn it on, go to Settings → Pages → Source: **GitHub Actions**.

**Public repo means public art.** GitHub Pages on a free account needs a public repo. The map image is Level-5 game art, so publishing the site redistributes it. That's the owner's call.

**Private-repo fallback:** build and serve on your local network, then install from the phone:

```bash
npm run build && npx serve dist
```

Open `http://<your-computer-ip>:3000` on the phone. Note that service workers (and so offline mode and install) need HTTPS except on `localhost`, so over plain LAN HTTP the app runs but won't install or cache. For full offline use from a private repo, use any HTTPS static host, or keep using the claude.ai artifact.

## Credits

Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), Gamer Guides and Game Rant, plus GameWith, Game8, kokorogu.com, wikiwiki.jp, FLiDB (hassaku74kg.com) and gget.jp (Japanese).

*Fantasy Life i: The Girl Who Steals Time* and the map artwork © LEVEL-5 Inc. Fan-made, unofficial and not affiliated with or endorsed by LEVEL-5. The app icon is original artwork.
