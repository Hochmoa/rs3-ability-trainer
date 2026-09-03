# RS3 Ability Trainer

Practice pressing RuneScape 3 ability keybinds with correct tick and global-cooldown timing, in the browser.
Live at **https://rs3trainer.hochware.com** (GitHub Pages).

## How it works

- The game tick is 0.6 s; every ability starts a 1.8 s (3 tick) global cooldown (GCD).
- A simulated ping (default 60 ms ± 20 ms jitter) delays each key press before the "server" sees it; the press is
  processed at the next tick boundary.
- The *ability queue* shows the next step of your rotation with its keybind and a cooldown overlay. Press the key so
  that it is processed on the tick the GCD ends and the ability casts right then – **perfect**. Press later: it casts on
  that tick – **late by n ticks**.
- The in-game **Ability queueing** setting is simulated (Settings page, off by default like for new accounts):
  - **Off:** presses during the GCD are ignored (*too early*); you have to press in the last tick (0.6 s) of the GCD.
  - **On:** a press any time during the GCD is queued and casts when the GCD ends. A later press replaces the queued
    ability; a different ability pressed on the last tick casts instead and the queued one stays queued for the next
    GCD end (the game's bypass rule). Abilities without enough adrenaline or still on cooldown stay queued until possible.
- A wrong ability that gets cast starts a GCD like in the game; the step stays open until the right one is cast.
- **Adrenaline** is simulated: basics +9 %, enhanced abilities cost their own amount, ultimates 60 % / 100 %, capped at
  100 % (more with Heightened Senses / Vestments of havoc). The **Loadout** page holds the modifiers: Ring of vigour,
  Impatient rank, Fury of the Small, Conservation of Energy, Heightened Senses, Vestments of havoc, start adrenaline.
- **Prayers / curses** and **adrenaline potions** are rotation steps of their own. They don't touch the GCD, must be
  pressed before the next GCD ability casts (any order inside that group) and are reported as *missed* otherwise.
  Potions share the 120 s adrenaline potion cooldown.
- The **buff bar** (self) and **target bar** (debuffs) show the status effects the abilities apply, with the wiki's
  durations; prayers stay until the session ends.
- Hover any icon for the full wiki data: adrenaline, cooldown, damage range and hits, target, duration, description,
  buffs applied.
- Two bars above the queue show the tick (0.6 s) and the GCD (1.8 s) progress, a third one the adrenaline.
- Rotations, keybinds (with Ctrl/Shift/Alt), loadout, settings and session results are stored in IndexedDB after you
  accept the storage banner.

Off-GCD abilities (Surge, Escape, Anticipation, …) are in the catalog as normal steps that ignore the GCD.

## Development

```bash
npm ci
npx ng serve            # http://localhost:4200
npx ng test             # engine unit tests (vitest)
npx ng build            # production build → dist/rs3-ability-trainer/browser
```

Push to `main` deploys via `.github/workflows/deploy.yml`.

### Refresh the game data

```bash
python tools/fetch-abilities.py   # public/data/abilities.json + buffs.json, icons in public/assets/abilities + status
python tools/fetch-prayers.py     # public/data/prayers.json, icons in public/assets/prayers
python tools/fetch-specials.py    # public/data/specials.json (adrenaline potions), icons in public/assets/specials
```

The scripts read the RuneScape Wiki Bucket API (`infobox_ability`, `infobox_buff`, `infobox_prayer`, `infobox_item`)
plus the wikitext of the linked status pages, drop abilities the wiki marks as removed (Combat Style Modernisation,
March 2026) and keep all metadata: type, level, target, equipment, adrenaline, cooldown, damage range and hit count,
duration, description, applied buffs/debuffs. Commit the result; the build never calls the wiki. The damage numbers are
stored for a later damage calculator.

## Attribution

Not affiliated with Jagex. Ability names and icons are © Jagex Ltd, taken from the
[RuneScape Wiki](https://runescape.wiki) (text CC BY-NC-SA 3.0). Non-commercial fan tool.
