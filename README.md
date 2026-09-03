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
- **Import from PvME notation**: paste a rotation as written on pvme.io / Discord into the editor
  (`(tc) bloat + vulnbomb → deathskulls → necrobasic`). `→` = next tick, `+` = same tick, `2t x` = x two ticks after the
  previous input, `omniguard spec` = weapon switch + that weapon's special attack, `(tc)` = target cycle (a client
  keybind, bound on the Keybinds page). Aliases come from the PvME emoji list (`public/data/pvme-aliases.json`); unknown
  words and phase headings become note steps that show up in the queue but are not inputs. Same-tick companions are
  scored against the tick of the previous input (perfect / early / late).
- Weapon special attacks (`public/data/specs.json`, wiki table of 75 specs) are steps of their own; pressing the generic
  "Weapon Special Attack" slot fires whichever spec the rotation expects for the wielded weapon style.

- Hover any icon for the full wiki data: adrenaline, cooldown, damage range and hits, target, duration, description,
  buffs applied.
- **Action bars like in the game**: five visible bars (main + additional 1–4, 14 slots each), 18 presets you fill by
  drag & drop on the *Action bars* page, positions and *action bar binding* per weapon style (Melee / Ranged /
  Magic / Necromancy → which position shows which preset). Keybinds belong to position + slot (*Keybinds* page),
  plus one key per weapon switch. While training, the slot of the next step glows, GCD abilities get the cooldown
  overlay, abilities you can't use are greyed out (wrong weapon, equipment requirement, adrenaline, cooldown).
  Presets can be copied into each other. Signed in, the whole setup syncs across devices (table `action_bars`).
  *Layout* on the Train page arranges the five bars: drag to reorder, make a bar half as wide (two rows of seven) so
  two of them share a line.
- **Weapon switches** are rotation steps (catalog tab "Weapons"); switching is instant. Each style has one weapon
  whose type (two-handed / dual wield / one-handed + shield) decides which abilities are usable.
- **Prayers** behave like in the game: pressing toggles, conflicting prayers switch off automatically (one overhead at a
  time, Turmoil-tier vs. saps/leeches, stat prayers vs. Piety & co.), the active ones are always shown, and the
  *Loadout* fixes the prayer book (Ancient Curses or standard prayers) – the other book is greyed out.
- **Incoming attacks** (checkbox on the Train page): a simulated enemy attacks in a fixed rhythm; the matching Protect /
  Deflect prayer must be active on the tick the hit lands, Soul Split earns a point on every other tick. Styles, pattern
  (random / never twice the same / in order / streaks), interval and warning time are configurable; presets for Nakatra,
  Zamorak and Raksha use the wiki's auto-attack styles and 5-tick rate (specials are not simulated).
- Two bars above the queue show the tick (0.6 s) and the GCD (1.8 s) progress, a third one the adrenaline.
- Rotations, keybinds (with Ctrl/Shift/Alt), loadout, settings and session results are stored in IndexedDB after you
  accept the storage banner.

- **Ability interactions** are simulated the way the wiki documents them (`docs/research/*.md`, ~190 rules,
  `src/app/engine/rules-*.ts`): style resources (Bloodlust, Necrosis, Residual Souls, Storm Shards), cooldown
  resets and overrides (Living Death → Death Skulls 17 ticks, Berserk → Overpower 15 ticks), per-hit effects
  (Piercing Shot shortens Snipe, Rapid Fire extends Searing Winds, Shadow Imbued pays adrenaline per hit),
  consumable buffs (Anima Charged → Flow, Chaos Roar, Greater Fury), sequence slots (Dismember → Slaughter →
  Massacre, Spectral Scythe casts), conjures and commands, charges (Backhand, Impact, Binding Shot), channels with
  their hit schedule (cancelled by the next ability), thresholds and Limitless, off-GCD abilities (Surge, Escape,
  Dive, Bladed Dive, Provoke, Limitless, Runic Charge). Hover any ability for its "Interactions" list with wiki links.
- **Loadouts** (several, switchable): main-hand / off-hand / two-handed weapon (all ~1 900 weapons, shields and
  defenders), the weapon's special attack and an Essence of Finality spec (75 specs), armour set with piece count,
  item passives, Invention perks in weapon and armour gizmos (all 69 perks; the 32 combat perks act), Archaeology
  relics, Spirit Pact, start adrenaline. Equipment requirements (two-handed, shield, conduit, spec weapon) are checked
  like in game.

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
python tools/fetch-specs.py       # public/data/specs.json (weapon special attacks) – run before fetch-abilities.py
python tools/fetch-weapons.py     # public/data/weapons.json (all weapons/shields/defenders), icons in public/assets/weapons
python tools/fetch-perks.py       # public/data/perks.json (Invention perks), icons in public/assets/perks
python tools/fetch-pvme-aliases.py # public/data/pvme-aliases.json (PvME emoji alias -> entity key), run last
```
`public/data/set-effects.json` (armour sets and item passives) is hand-written from the wiki with a source URL per entry.

The scripts read the RuneScape Wiki Bucket API (`infobox_ability`, `infobox_buff`, `infobox_prayer`, `infobox_item`)
plus the wikitext of the linked status pages, drop abilities the wiki marks as removed (Combat Style Modernisation,
March 2026) and keep all metadata: type, level, target, equipment, adrenaline, cooldown, damage range and hit count,
duration, description, applied buffs/debuffs. Commit the result; the build never calls the wiki. The damage numbers are
stored for a later damage calculator.

## Attribution

Not affiliated with Jagex. Ability names and icons are © Jagex Ltd, taken from the
[RuneScape Wiki](https://runescape.wiki) (text CC BY-NC-SA 3.0). Non-commercial fan tool.
