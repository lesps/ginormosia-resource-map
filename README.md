# Ginormosia Resource Map

A phone-first, installable, offline web app showing where every gatherable resource (ore, trees, fish) spawns in Ginormosia, the open-world continent in *Fantasy Life i: The Girl Who Steals Time*.

Live: `https://<user>.github.io/ginormosia-resource-map/` (once Pages is enabled; see Hosting).

## Features

- **Map with 15 pins**, one on each region's tower. Pins are red teardrop markers with a white outline and shadow so they stand out on the art. Each one carries colored dots for the categories found there (ore, trees, fish).
- **Category and sub-type filters.** Pick Ore, Trees or Fish, then a type row appears (for example Gold, Platinum, Starcrystal; Oak, Cherry, Angeltree; Tuna, Lordfish). Each type chip shows how many regions have it. Choosing a type turns matching pins gold with a count badge, dims the rest, and lists every spawn, lowest rank first.
- **Search** across all names (case-insensitive substring), combined with the active filters. Matches are highlighted.
- **Region panel**: tap a pin, a result, or a name in the region list. Shows where the region is and its resources with the minimum Area Rank. Close with × or Esc.
- **Zoom** 1× / 2× / 3×. The map pans inside its frame and centers on the selected pin. Pins keep a 44×56 px hit target at every zoom.
- **Shareable state**: the filter, type, search and selected region are kept in the URL hash (`#cat=ore&type=Platinum&r=moltana`).
- **Keyboard**: `/` focuses search, Esc closes the region and then clears the search, Enter/Space selects a focused pin.
- **Installable and offline**: an Install button (Android/desktop Chrome) or Add-to-Home-Screen steps (iOS). Once loaded, it works fully offline. An "Offline" badge shows when you lose your connection.
- Light/dark themes, safe-area aware, self-hosted fonts, about 0.7 MB in total.

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
npm run assets       # regenerate public/map-1600.webp and the icons (sharp)
```

`npm run test:build` needs a fresh `npm run build` first. To check a sub-path build: `BASE_PATH=/ginormosia-resource-map/ npm run build && BASE_PATH=/ginormosia-resource-map/ npm run test:build`.

## Editing data

All resource data is in `data/regions.json`. A correction should only need a data edit. Each entry looks like this:

```json
{ "name": "Great Platinum Deposit", "type": "Platinum", "minRank": "3", "note": "optional" }
```

- `type` groups tiers of the same resource and drives the sub-type chips. Reuse an existing type where one fits.
- `minRank` is a string: `"1"`–`"5"`, `"any"`, `"top"`, `"3+"`, `"-"` (rank not recorded) or `"1 or 5"` (disputed).
- Pins use normalized coordinates (`0–1`, origin top-left) on the region's tower diamond.

`npm test` validates the file (unique ids, pin range, ranks, names, types, category arrays), so run it after editing.

## Known data caveats

These are deliberate; don't "fix" them by accident.

- **Swapped labels:** the image's West/East Greatgut labels look swapped. Pins follow the guide descriptions: `wgg` is the left diamond (x≈0.418), `egg` the right (x≈0.606). The image is not edited.
- **Hot Spring Bream** rank is disputed (`"1 or 5"`).
- **Great Darkwood Tree:** whether it is Shroomhaven's "Great Darkness Tree" event is unconfirmed, so Shroomhaven's tree has its own `Darkness Tree` type and Great Darkwood Tree stays on the not-in-Ginormosia list.
- **Rank `"-"` entries** (Starry Tree, Electric Eel, etc.) are known to spawn, but the rank isn't recorded.
- **Not covered:** common fish, herbs and ground pickups.
- **Type groupings** (`type` field) were added for filtering and are this project's own grouping, not the game's. `Cherry Fruit Tree` and `Palm Fruit Tree` are grouped as `Fruit Tree`, separate from lumber `Cherry`/`Palm`. `Eruptuna` is grouped under `Tuna`.

## Hosting

`.github/workflows/deploy.yml` runs tests, builds with `BASE_PATH=/<repo-name>/`, checks the build and deploys to GitHub Pages on every push to `main`. To turn it on, go to Settings → Pages → Source: **GitHub Actions**.

**Public repo means public art.** GitHub Pages on a free account needs a public repo. The map image is Level-5 game art with fan annotations, so publishing the site redistributes it. That's the owner's call.

**Private-repo fallback:** build and serve on your local network, then install from the phone:

```bash
npm run build && npx serve dist
```

Open `http://<your-computer-ip>:3000` on the phone. Note that service workers (and so offline mode and install) need HTTPS except on `localhost`, so over plain LAN HTTP the app runs but won't install or cache. For full offline use from a private repo, use any HTTPS static host, or keep using the claude.ai artifact.

## Credits

Data: Ginormosia FAQ & Data Project (fli-ginormosia.bearblog.dev), cross-checked with Gamer Guides and Game Rant. Fan project; not affiliated with Level-5.
