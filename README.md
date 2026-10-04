# Ginormosia Resource Map

A phone-first, installable, offline web app showing where every gatherable resource (ore, trees, fish) spawns in Ginormosia, the open-world continent in *Fantasy Life i: The Girl Who Steals Time*.

Live: `https://<user>.github.io/ginormosia-resource-map/` (once Pages is enabled; see Hosting).

## Features

- **Map with 15 pins**, one just above each region's numbered label. Pins are red teardrop markers with a white outline and shadow so they stand out on the art. Each one carries colored dots for the categories found there (ore, trees, fish, bosses). On phones the marker is drawn smaller at 1× so labels stay readable, while the tap target stays 44×56 px.
- **Category and sub-type filters.** Pick Ore, Trees, Fish or Bosses, then a type row appears (for example Gold, Platinum, Starcrystal; Oak, Cherry, Angeltree; Tuna, Lordfish; Field boss, Silver-crown, Legendary). Type chips follow the game's tier order (Copper → Iron → Silver → Gold → Platinum…; Oak → Palm → Pine…), and each shows how many regions have it. Choosing a type turns matching pins gold with a count badge, dims the rest, and lists every spawn, lowest rank first.
- **Search** across resource and boss names, their Japanese names, and drops (case-insensitive substring), combined with the active filters. Search "ruby" and you get every node and boss that drops Ruby, labelled "drops Ruby". Matches are highlighted.
- **Region panel**: tap a pin, a result, or a name in the region list. It shows the region's summary, tower and landmarks, then its ore, trees, fish, bosses and other resources. Close with × or Esc.
- **Resource detail cards.** Each row shows the name, a one-line location, badges and the minimum rank. Badges: 👑 gold-crown, 🥈 silver-crown, ★ legendary, ⚑ event or challenge, 🌙 night, ☀️ day, ⛰️ cave, a level badge like Lv60, and "unconfirmed"/"disputed" for weaker data. Tapping a row opens its card: where, conditions, drops, note, reliability, sources and the Japanese name. One card is open at a time. Tapping a search result opens that exact card.
- **How spawns work**: a collapsible box in the footer explains tier rolls, crowns, legendary challenges and Area Points, with a key to the badges.
- **Zoom** 1× / 2× / 3×. The map pans inside its frame and centers on the selected pin. Pins keep a 44×56 px hit target at every zoom.
- **Shareable state**: the filter, type, search and selected region are kept in the URL hash (`#cat=ore&type=Platinum&r=moltana&e=golemstone`), including an open detail card.
- **Keyboard**: `/` focuses search, Esc closes the open card, then the region, then clears the search, Enter/Space selects a focused pin.
- **Installable and offline**: an Install button (Android/desktop Chrome) or Add-to-Home-Screen steps (iOS). Once loaded, it works fully offline. An "Offline" badge shows when you lose your connection.
- Light/dark themes, safe-area aware, self-hosted fonts, about 0.45 MB in total.

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

Only `name`, `type` and `minRank` are required. Categories are `ore`, `trees`, `fish`, `boss` and `other`. Entry names must be unique within a region, because they form the deep-link key.

- `type` groups tiers of the same resource and drives the sub-type chips. Reuse an existing type where one fits.
- `minRank` is a string: `"1"`–`"6"`, `"any"`, `"top"`, `"3+"`, `"-"` (rank not recorded) or `"1 or 5"` (disputed).
- Pins use normalized coordinates (`0–1`, origin top-left), placed just above the region's number on the map. `image.width`/`height` must match `assets/ginormosia-map.jpg`; the map frame takes its aspect ratio from them.

- `tags` come from a fixed set: `gold-crown`, `silver-crown`, `legendary`, `event`, `night`, `day`, `cave`. `confidence` is `confirmed`, `single-source` or `disputed`, and every key in `sources` must exist in the top-level `sources` map.
- `drops[].official` is `true` only when the English name is confirmed. Translated names are `false`, keep the original in `ja`, and show with a ≈ mark in the app. Drops from silver-crown monster groups carry `from` (the monster) and optionally `when` (`night`/`day`).
- Regions also carry `nameJa`, `tower`, `landmarks` and `summary`. Top-level `mechanics` feeds the "How spawns work" box.
- `typeOrder` lists each category's types in the game's tier order and sets the chip order. Every type used in the data must appear there exactly once, and nothing else. To fix a tier, move the name in the list.

`npm test` validates the file (unique ids, pin range, ranks, names, types, category arrays, tags, confidence, sources, drops, unique entry names, and no Japanese text outside `nameJa`/`ja`), so run it after editing.

## Known data caveats

These are deliberate; don't "fix" them by accident.

- **Hot Spring Bream** rank is disputed (`"1 or 5"`).
- **Great Darkwood Tree:** whether it is Shroomhaven's "Great Darkness Tree" event is unconfirmed, so Shroomhaven's tree has its own `Darkness Tree` type and Great Darkwood Tree stays on the not-in-Ginormosia list.
- **Rank `"-"` entries** (Starry Tree, Electric Eel, etc.) are known to spawn, but the rank isn't recorded.
- **Not covered:** common fish, herbs and ground pickups.
- **Data v3 provenance:** details, bosses and corrections come from a region-by-region guide compiled on 2026-10-04 from Gamer Guides, the FAQ & Data Project and Japanese sources (GameWith, Game8, kokorogu, wikiwiki). Entries found only in the earlier dataset (mostly coastal Tuna and Flying Fish) are kept, marked unconfirmed, with source `earlier`.
- **Translated names:** Japanese drop and monster names were translated for this app. 96 drop names have no confirmed English name (`official: false`) and may not match the English release.
- **Per-node pins** aren't available yet. They need tower coordinates measured on Gamer Guides' interactive map plus tower positions on the current map image.
- **Tier order** (`typeOrder`) comes from published mining and woodcutting levels (Copper Lv 2, Iron 18, Blue Ore ~20, Silver ~23, Marine Ore ~25, Gold ~30, Platinum ~43; Oak 2–3, Palm 9–10, Pine 15, Sugar/Desert ~22–30, Skytree ~35, Darkwood ~50) and fish star ratings. No level was found for Haniwa Stone, Fossil, Red Ore, Pear, Fruit Tree or Eel, so those positions are best guesses. Boss, legendary and event types go last.
- **Type groupings** (`type` field) were added for filtering and are this project's own grouping, not the game's. Boss types (Silver-crown, Field boss, Dungeon, Challenge, Legendary) were derived from each boss's conditions and location. New fish types (Sand Fish, Skeleton Fish, Evil Carp, Crystalline Bass, Godfish) have guessed tier positions. `Cherry Fruit Tree` and `Palm Fruit Tree` are grouped as `Fruit Tree`, separate from lumber `Cherry`/`Palm`. `Eruptuna` is grouped under `Tuna`.

## Hosting

`.github/workflows/deploy.yml` runs tests, builds with `BASE_PATH=/<repo-name>/`, checks the build and deploys to GitHub Pages on every push to `main`. To turn it on, go to Settings → Pages → Source: **GitHub Actions**.

**Public repo means public art.** GitHub Pages on a free account needs a public repo. The map image is Level-5 game art, so publishing the site redistributes it. That's the owner's call.

**Private-repo fallback:** build and serve on your local network, then install from the phone:

```bash
npm run build && npx serve dist
```

Open `http://<your-computer-ip>:3000` on the phone. Note that service workers (and so offline mode and install) need HTTPS except on `localhost`, so over plain LAN HTTP the app runs but won't install or cache. For full offline use from a private repo, use any HTTPS static host, or keep using the claude.ai artifact.

## Credits

Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), Gamer Guides and Game Rant, plus GameWith, Game8, kokorogu.com and wikiwiki.jp (Japanese).

*Fantasy Life i: The Girl Who Steals Time* and the map artwork © LEVEL-5 Inc. Fan-made, unofficial and not affiliated with or endorsed by LEVEL-5. The app icon is original artwork.
