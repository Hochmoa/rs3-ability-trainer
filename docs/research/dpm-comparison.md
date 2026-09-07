# Damage check: the trainer against the RS Wiki rotation calculator (7 September 2026)

Question: do the rotations the community plays deal the damage in the trainer that they deal elsewhere? The trainer was
driven through its own UI (tools/ui-autoplayer.js presses the keys, reads the hitsplats and the page counters) and
compared with the RuneScape Wiki's rotation calculator "RS Analysis" (https://tools.runescape.wiki/rs-rot/rotation_builder,
by Lo Sugar and Akritia – the tool PvME links for damage questions). Nothing else on the web publishes rotation damage
numbers any more: the wiki's Revolution bars show "[Unknown]" AADPT since the Combat Style Modernisation (2 March 2026),
the old revocalc site is gone, and the PvME DPM guides give rotations but no numbers.

## Rotations (from pvme.io/pvme-guides/dpm-advice, September 2026)

| Style | Rotation | Inputs |
|---|---|---|
| Magic | "1 Minute Example (without Adrenaline Potion)": runic charge + gsonic → gsunshine → gconc → asphyx → gconc → wm → dbreath → … → runic charge + gsonic | 35 |
| Ranged | "1 Minute Standard Example": imbue shadows → ricochet → piercing → gdeathsswift → … → gdeathsswift | 33 |
| Necromancy | "Living Death Rotation (without Adrenaline Potion)": death skulls → soul sap → touch → … → death skulls → bloat | 23 |
| Melee | Berserk window built from the PvME priorities (no spec, no Igneous, no Hurricane – it is 2h only) | 19 |

## Settings on both sides

Level 120 in the style's skill (trainer: 99 + elder overload), no armour, jewellery, prayer, perks or familiar, hit chance
100 %, ping 0, automatic basic attacks off, weapon poison off, adrenaline recharge on (the PvME rotations are not
adrenaline-feasible as written: Omnipower comes at 55 %; PvME assumes Ring of Vigour / relics). Calculator mode "Mean".
Same weapons where possible: Magic Corruption wand + orb (T95, no passive) / calculator custom T95; Ranged Bow of the
Last Guardian without ammunition on both; Necromancy Ruinous guard + lantern / custom T90; Melee Khopesh of Tumeken +
Elidinis / custom T92.

## Totals

| Rotation | Trainer (UI run) | Calculator | Trainer / calculator |
|---|---|---|---|
| Magic | 161,383 | 186,754 | 0.864 |
| Ranged | 182,828 | 205,794 | 0.888 |
| Necromancy | 96,285 | 84,561 | 1.139 |
| Melee | 139,512 | 181,364 | 0.769 |

The trainer rolls real damage (crits 10 %, uniform rolls); one run has a few per cent of noise.

## Where the difference comes from

Single-ability probes in the calculator (a rotation of one ability, modes mean / mean-no-crit / all-crit) show that its
baseline is not the wiki's:

| | Calculator | Trainer (wiki formulas) |
|---|---|---|
| Ability damage, dual wield T95, level 120, nothing worn | 1,923 | 1,833 |
| Reason | "Reaper Crew" (+12) is on by default, plus ~+48 of unknown origin | Ability_damage formula |
| Critical strike chance | 15 % (Kal'gerion demon special on by default) | 10 % (wiki: Critical strike) |
| Critical strike damage | +70 % | +50 % at level 90+ (wiki) |
| Mean crit factor | 1.105 | 1.05 |

1,923 / 1,833 × 1.105 / 1.05 = 1.104, so the calculator is 10 % above the wiki formulas before any ability is cast.
Re-implementing the calculator's own ability table (min/max per hit, hit timings, Sunshine ×1.5, crit 10 %/+50 %) for
the magic rotation gives 162,912 – the trainer's 161,383. The per-ability data match: every ability in the four
rotations has the same percentages, hit counts and timings in the trainer's abilities.json and in the calculator's
table, with three calculator defaults that are Igneous-cape variants (Deadshot 8 × 55–75 %, Overpower 2 × 280–340 %,
Death Skulls modelled as one hit unless "death skulls 4" is placed).

What is left after the 10 %:

- Magic −4 %: Greater Concentrated Blast's crit bonus for the next ability (+7 % per hit, wiki) is modelled by both; the
  calculator gives an auto after gconc +13 %, i.e. a larger crit bonus. Worth a look at rules-global concentrated-crit.
- Ranged +1 %: fine.
- Necromancy +14 %: the calculator's plain "death skulls" is a single hit (the wiki: the skull bounces target → player →
  target → player → target, three hits – the trainer does three). Bloat's damage over time (10 hits) landed only
  partly because the session ended at the last input – fixed in this commit (the session now waits for the damage in
  the air).
- Melee −23 % (−13 % after the baseline): Berserk windows shifted by late presses of the auto-player (Greater Flurry
  and Assault holds), the calculator's melee auto is 2,389 = 120 % of 1,991 (its melee AD is another 4 % above the
  T92 formula) – melee needs a second look with a human-played run.

## Findings in the trainer (fixed here unless noted)

1. Level caps: Attack, Strength, Ranged, Magic and Defence were capped at 99 on the Loadout page; they go to 120 since
   the modernisation. Fixed (defaults stay 99, Necromancy 120).
2. Damage in the air at the end: the session finished on the last cast, so hit-delayed hits, the last Death Skulls
   bounces and a trailing Bloat/Dismember bleed were never counted. Fixed: the engine keeps ticking until those hits
   have landed (at most 34 ticks), presses are ignored meanwhile, the feedback line says so, Esc ends it early.
3. The "Default" loadout has Weapon poison+++ preselected – every run silently includes poison procs (5.8k of 187k in
   the first magic run). Left as is, but worth deciding.
4. Adrenaline: the PvME magic rotation stalls at Omnipower with 55 % in the trainer. Both tools agree on the per-ability
   adrenaline (+9 basics, Flow discounts); PvME assumes Ring of Vigour / Conservation of Energy, which the trainer has
   as relic options. Not a bug.
5. Scoring oddities seen with the auto-player (presses 5–40 ms after the previous cast fired are scored "1 tick late",
   an off-GCD Runic Charge inside Asphyxiate made the next ability "7 ticks late"): both cases pass as unit tests
   (dpm-timing.spec.ts), so the engine is right and the auto-player's key events arrive differently from a keyboard
   (probably the rAF `now` used for the press). Open; a human run does not show them.
6. PvME alias `runic_charge` (underscore) resolves through the normaliser; `deathspark` is a status marker, not an input.

## Reproduce

1. Loadout page: weapons as above, level 99 + elder overload, poison none. Settings: ping 0, jitter 0, auto basic
   attacks off, hit chance off. Train page: 100 % at start, Recharge +10 %/tick.
2. Rotations page: paste the PvME line, Train, "Auto-place on my bars".
3. Console: paste tools/ui-autoplayer.js; `window.__drv.summary()` when the finish overlay shows.
4. Calculator: settings tab of the style → Equipment → preset None, perks 0 (scroll), familiar None, weapon custom; General →
   prayer None, vulnerability none, level 120, Reaper Crew off, Kal'gerion spec off; Paste → the rotation string is
   base64 of `{"data":{"a":[300 ticks],"e":[[...]],"n":[false…],"t":[""…]}}` (scratch script mkrot.py builds it from
   the ability keys of the calculator's table).
