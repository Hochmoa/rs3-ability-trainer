# RS3 Ability Trainer

Practice pressing RuneScape 3 ability keybinds with correct tick and global-cooldown timing, in the browser.
Live at **https://rs3trainer.hochware.com** (GitHub Pages).

## How it works

- The game tick is 0.6 s; every ability starts a 1.8 s (3 tick) global cooldown (GCD).
- A simulated ping (default 60 ms ± 20 ms jitter) delays each key press before the "server" sees it; the press is
  processed at the next tick boundary.
- The *ability queue* shows the next ability of your rotation with its keybind and a cooldown overlay. Press the key
  in the queue window (default: the last tick of the GCD) and the ability fires exactly when the GCD ends – **perfect**.
  Press earlier: **too early** (ignored). Press after the GCD: the ability fires on that tick – **late by n ticks**.
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
