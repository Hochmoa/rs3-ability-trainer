# RS3 Ability Trainer

Practice pressing RuneScape 3 ability keybinds with correct tick and global-cooldown timing, in the browser.
Live at **https://rs3trainer.hochware.com** (GitHub Pages).

## How it works

- The game tick is 0.6 s; every ability starts a 1.8 s (3 tick) global cooldown (GCD).
- A simulated ping (default 60 ms ± 20 ms jitter) delays each key press before the "server" sees it; the press is
  processed at the next tick boundary.
- The *ability queue* shows the next ability of your rotation with its keybind and a cooldown overlay. Press the key so
  that it is processed on the tick the GCD ends and the ability casts right then – **perfect**. Press later: it casts on
  that tick – **late by n ticks**.
- The in-game **Ability queueing** setting is simulated (Settings page, off by default like for new accounts):
  - **Off:** presses during the GCD are ignored (*too early*); you have to press in the last tick (0.6 s) of the GCD.
  - **On:** a press any time during the GCD is queued and casts when the GCD ends. A later press replaces the queued
    ability; a different ability pressed on the last tick casts instead and the queued one stays queued for the next
    GCD end (the game's bypass rule).
- A wrong ability that gets cast starts a GCD like in the game; the step stays open until the right one is cast.
- Two bars above the queue show the tick (0.6 s) and the GCD (1.8 s) progress.
- Rotations, keybinds (with Ctrl/Shift/Alt), settings and session results are stored in IndexedDB after you accept
  the storage banner.

Off-GCD abilities (Surge, Escape, Anticipation, …) are in the catalog but can't be queued yet; the data model already
carries a `triggersGcd` flag for that.

## Development

```bash
npm ci
npx ng serve            # http://localhost:4200
npx ng test             # engine unit tests (vitest)
npx ng build            # production build → dist/rs3-ability-trainer/browser
```

Push to `main` deploys via `.github/workflows/deploy.yml`.

### Refresh the ability catalog

```bash
python tools/fetch-abilities.py
```

Pulls the ability list from the RuneScape Wiki Bucket API and the 60×60 icons into `public/assets/abilities/`,
writing `public/assets/abilities.json`. Commit the result; the build never calls the wiki.

## Attribution

Not affiliated with Jagex. Ability names and icons are © Jagex Ltd, taken from the
[RuneScape Wiki](https://runescape.wiki) (text CC BY-NC-SA 3.0). Non-commercial fan tool.
