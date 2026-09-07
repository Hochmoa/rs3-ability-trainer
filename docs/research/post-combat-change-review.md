# What the trainer still gets wrong, and where it needs work (review, 7 September 2026)

Question: six months after the **Combat Style Modernisation** (2 March 2026), does the trainer still match the game — and
where does the application itself need work? Method: four parallel research passes against the live RuneScape Wiki (game
updates 2 March – 7 September 2026; every ability; weapons, special attacks, set effects and perks; prayers, spells,
familiars and the damage/accuracy formulas), each diffed against `public/data/*.json` and `src/app/engine/rules-*.ts`,
plus a walk through the running application and the numbers from the 905-rotation playthrough
(`docs/research/guide-playthrough.md`).

**Headline:** the game data is in good shape. `specs.json` (75 special attacks) and `weapons.json` (1923 weapons) are
byte-identical to the wiki's own tables, `abilities.json` reproduces today's ability infoboxes with zero differences, and
there is **no main-game combat change between 3 September (our last research) and today** — August and September 2026 are
Leagues II: EQUILIBRIUM, which runs on separate worlds and must not be copied into the model. What is left is: a handful
of real engine bugs, four game systems we never modelled, a data/rules split that makes the JSON unreliable for anything
but the engine, and a set of application problems that hurt more than any of the numbers.

---

## The list, ranked

| # | What | Where | Impact |
|---|---|---|---|
| 1 | Session freezes silently when the page stops drawing (rAF stall) | `train.ts` | high – a training session that ignores every key |
| 2 | Dual-wield requirement does not exist in the engine | `rules-model.ts`, `trainer-engine.ts` | high – Flurry, Greater Flurry, Bladed Dive fire with a two-hander |
| 3 | Tsunami costs 100 % adrenaline instead of 40 % at 5 Glacial Embrace stacks | `rules-magic.ts`, `rules-buffs.ts` | high – magic rotations stall on an ultimate the game lets you cast |
| 4 | Glacial Embrace: 10 stacks without a timer instead of 5 for 34 ticks | `rules-buffs.ts` | high – feeds 3, and the stacks never expire |
| 5 | Reflect reflects 50 %, the game does 100 % (PvE) | `rules-defcon.ts` | medium – wrong damage whenever Reflect is used |
| 6 | Darkfang (Gloomfire bow, Dark bow) not modelled | `rules-ranged.ts` | medium – half the on-hit procs and Snipe cooldown reduction for those bows |
| 7 | Temporal Anomaly and Darkness missing entirely | `spells.json` | medium – up to 20 % magic-ability cooldown resets, used by PvME |
| 8 | Aspect exclusivity not enforced | `rules-buffs.ts` | medium – Animate Dead + Vampyrism + Penance can all run at once |
| 9 | Adaptive Strike modelled as dual-wield only | `rules-melee.ts` | medium – wrong damage and a false requirement for 2h / main-hand |
| 10 | Rotation and loadout pickers do not scale (905 / 128 flat entries) | `train.html`, `rotations.html`, `loadout.html` | high for usability |
| 11 | Explore "Guides" chip shows 500 of 905 guide rotations | `sync.service.ts` | medium – half the bosses are invisible there |
| 12 | "Load this setup" of a guide account wipes the player's keybinds and bars | `setups.ts`, `setup-sync.service.ts` | medium – data loss on the intended copy path |
| 13 | Berserk lasts 34 ticks instead of 33 | `buffs.json` | medium – a Berserk window is one tick long, rotations are built to the tick |
| 14 | Greater Sunshine / Greater Death's Swiftness duration 62 instead of 63 ticks | `rules-magic.ts`, `rules-ranged.ts` | small – one lost GCD per window |
| 15 | Weapon poison ticks every 17 ticks instead of 16 (17 hits instead of 18) | `damage.ts` | small – a few percent of poison damage |
| 16 | Magic ability damage ignores the spell-tier cap `min(t, s)` | `damage.ts` | small today, wrong for low-tier spells |
| 17 | Chaotic grimoire's +7 % critical chance never applied | `gear.json`, `set-effects.json` | small – silently 0 % |
| 18 | `abilities.json` damage fields wrong for ~18 abilities (rules compensate) | `public/data/abilities.json` | small in the sim, wrong in tooltips and previews |
| 19 | Familiars: Steel titan missing, two scroll costs wrong (6 vs 20 points) | `familiars.json` | small |
| 20 | No `Utility` ability class (Surge, Escape, Dive … filed under Basic) | `fetch-abilities.py`, catalog, revolution toggles | small |
| 21 | Only the worn Essence of Finality is shown, not the carried ones | `loadout.html` | small, but confusing after the multi-amulet change |
| 22 | Rejuvenate heals 40 % instead of 42.5 % | `rules-defcon.ts` | small |
| 23 | Ring of kinship: 12 selectable items, three Necromancy classes missing | `gear.json` | small |

Scope limits that are bigger than any single bug are in §5.

---

## 1. Engine bugs found against the wiki

### 1.1 The dual-wield requirement does not exist

`rules-model.ts` knows `equipment?: '2h' | 'shield' | 'defender-or-shield' | 'conduit' | 'spec-weapon' | 'eof'` — there is
no dual-wield case, and `trainer-engine.ts` (`requirementFailure`) has none either. The wiki is explicit for Flurry: the
infobox says `Dual wield`, the text says *"It requires level 45 Attack to use and only works while dual-wielding."*
(https://runescape.wiki/w/Flurry). The same holds for Greater Flurry and Bladed Dive.

Today the guide setups all wield main hand + off hand, so nothing breaks by accident — but since the preset import may now
switch a setup **into** a two-hander for Hurricane or Pulverise, a following Greater Flurry silently fires from the 2h.
110 of the 905 guide rotations contain a Flurry or Bladed Dive step.

Fix: add `'dw'` to the requirement union, a case in the engine (`!l.hasDualWield`), the requirement on the three
abilities, and teach `preset-switches.ts` to switch back to the pair (it already prefers main + off when it builds a set).

### 1.2 Reflect

`rules-defcon.ts` says "reflects 50 %". The wiki: *"Reflect 100% of damage taken back at the attacker"* in PvE, *"the
reflected damage is halved to 25%"* in PvP (https://runescape.wiki/w/Reflect). 50 % is the pre-2024 PvP number.

### 1.3 Darkfang: the ranged basic attack hits twice with those bows

`rules-ranged.ts` gives the `ranged` basic ability `hits: [0]` — one hit. The Gloomfire bow and the Dark bow carry
Darkfang since 2 March 2026: *"It changes the Ranged basic ability from dealing 90%-110% ability damage in one hit to
dealing 45%-55% ability damage per hit for two hits… allows it to count double for on-hit effects such as Searing Winds
and Shadow Imbued."* (https://runescape.wiki/w/Gloomfire_bow).

Average damage is unchanged, but we emit half the hit events, so everything counted per hit is halved: Shadow Imbued
adrenaline, Feasting Spores and Icy Chill stacks, Cinderbane poison, Zorgoth's and Occultist's ring procs, Aftershock —
and with fleeting boots the basic attack shortens the Snipe cooldown by 6 instead of 12 ticks per cast
(`rules-ranged.ts` `onHit: cooldown-reduce snipe 6`). Our own `docs/research/ranged.md` describes Darkfang correctly;
nothing in `src/` references it.

### 1.4 Adaptive Strike has three forms, we model one

We model the dual-wield form (2 × 60–75 %) and gate the ability on dual wield. The wiki lists three: main hand only
1 × 120–140 %, two-handed 1 × 120–140 % *"to the target and up to 8 additional enemies in a cone"*, dual wield 2 × 60–75 %
(https://runescape.wiki/w/Adaptive_Strike). All three cost the same and share the 9-tick cooldown, and the ability
replaced Decimate and Cleave in the modernisation, so it should not be gated at all.

### 1.5 Tsunami and Glacial Embrace: an ultimate the trainer refuses although the game allows it

Incite Fear grants Glacial Embrace, and *"Both the adrenaline cost and requirement of Tsunami are reduced by 12% per
Glacial Embrace stack (down to 40% at 5 stacks)"* (https://runescape.wiki/w/Incite_Fear). `rules-spells.ts` notes
"(stacks not simulated)" and keeps Tsunami at 100 % adrenaline, so a standard Ancient-magic rotation — Incite Fear to 5
stacks, then Tsunami at 40 % — is refused by the engine and everything after it is mis-scored.

The buff itself is defined wrongly too: `rules-buffs.ts` has `stacks.max: 10` where the wiki says 5, `durationTicks: null`
("No timer") where the wiki says 20.4 s / 34 ticks refreshed on every gain, and the text credits Wen arrows instead of
Incite Fear. Our own `spells.json` already carries 5 stacks / 20 s, so the engine contradicts our data. The engine has
what it needs (`costMult` and the split between requirement and cost, `trainer-engine.ts`).

### 1.6 Berserk is one tick too long, weapon poison one tick too slow

- `buffs.json` gives Berserk 34 ticks / "20.4 seconds"; the wiki says 19.8 s / 33 ticks (`abilities.json` and
  `rules-buffs.ts` already say 33). Berserk windows are counted to the tick in every melee guide.
- `damage.ts` `POISON_EVERY_TICKS = 17` yields 17 poison hits; the wiki says poison damages *"every 9.6 seconds, hitting
  18 times if not reapplied"* = 16 ticks. That is roughly 6 % of the poison damage on every Cinderbane loadout.
- Heal Other and Heal Group have a real 17-tick cooldown; we model 0.

### 1.7 Two small numbers

- Greater Sunshine and Greater Death's Swiftness: our rules use `durationTicks: 62`, the wiki infobox says
  *"37.8s (63 ticks)"* (https://runescape.wiki/w/Greater_Sunshine) and our own `abilities.json` says 63. One GCD is lost
  at the end of every ultimate window.
- Rejuvenate: our rule heals 40 %, the wiki is 2.5 % per tick over 17 ticks = 42.5 %.

---

## 2. Game systems we never modelled

### 2.1 Temporal Anomaly (and Darkness)

`spells.json` has 30 spells; `temporal-anomaly` and `darkness` are not among them, and no rule mentions either. Temporal
Anomaly is a Standard-spellbook aspect at 97 Magic: *"12.5% of magic power armour damage bonus as chance to reset the
cooldown of a magic ability"*, capped at 20 %, excluding *"Sunshine, Magma Tempest (Targeted), and Runic Charge"* and
magic weapon special attacks, for a *"12 minute long buff"* (https://runescape.wiki/w/Temporal_Anomaly). For a magic
rotation this is the single largest missing damage source — a fifth of magic cooldowns simply do not reset in the
trainer. Two boss setups name it, eight name Darkness.

The engine already has the machinery (`{ kind: 'cooldown-reset', abilities: [...] }` for Living Death); what is missing is
a chance-based variant driven by the loadout's magic damage bonus.

### 2.2 Aspects are not mutually exclusive

*"As it is an aspect, it cannot be used in tandem with other aspects, such as Animate Dead, Darkness, Penance, or
Vampyrism."* We keep Animate Dead, Vampyrism and Penance as independent buffs, so a loadout can run all of them at once.
`docs/research/mechanics.md` records the rule; nothing enforces it.

### 2.3 Chaotic grimoire

`gear.json` carries `chaotic-grimoire` with `passive: null`; the only crit-chance set effect is bound to Erethdor's
grimoire (+12 %). The chaotic grimoire's +7 % critical chance (11 May 2026) therefore does nothing when equipped.

### 2.4 Magic damage ignores the spell-tier cap

The wiki's ability-damage formula caps the weapon-tier part by the autocast spell's tier: `⌊9.6 · min(t_mh, s) + b⌋`.
`damage.ts` skips that deliberately ("no autocast spell is chosen in the loadout"). With tier-95 staves and Ice Barrage
(tier 94) or Fire Surge as the standard autocast this over-estimates magic ability damage a little, and a low-tier spell
on a high-tier staff is over-estimated a lot. The same cap exists for melee and ranged (`min(t, S)`) and is only applied
to ammunition today.

### 2.5 Familiar data

`familiars.json` has 9 entries; the **Steel titan is missing entirely** (level 99, attack speed 8, max hit 1296, Steel of
Legends 18 points, 4 hits). Soul Food (Hellhound) and Mammoth Feast (Pack mammoth) are stored at 6 special move points,
both scroll pages say 20.

### 2.6 Smaller equipment gaps

- Ring of kinship: still 12 separately selectable class items instead of one all-passive ring; the three Necromancy
  classes (Soulweaver's residual-soul generation among them) are missing.
- Warpbane (+12 % against Creatures of Daemonheim) on the Ruinous weapons — no enemy preset would trigger it today.
- Zemouregal's nexus needs 9 s equipped before Fortified Bones applies; we apply it at once.
- Aspect duration: fixed 1200 ticks, no recast extension to an hour (irrelevant inside a simulated fight).

---

## 3. The data/rules split makes `abilities.json` unreliable

The audit found ~18 abilities whose raw JSON damage is wrong while `rules-*.ts` already compensates: Greater Ricochet
(80 % vs 135 % single target), Corruption Shot and Corruption Blast (500 % vs 300 %), Smoke Tendrils (240 % vs 472.5 %),
Volley of Souls (150 % vs up to 750 %), Bloat (150 % vs 525 %), Massacre (840 % vs 720 %), Death Skulls (1 hit instead of
3), Command Skeleton Warrior (2 hits instead of 10), the conjures, Sunshine and Greater Sunshine, Storm Shards, plus
Runic Charge and Resonance which carry damage ranges for abilities that deal none. Nine buff windows are `null` in the
JSON (Chain 10, Chaos Roar 12, Greater Fury 25, Tsunami 50, Asphyxiate 6, Split Soul 34, Invoke Death 20, Threads of Fate
11) because `parse_duration_ticks()` only matches the word "duration"; all are correct in `rules-buffs.ts`. Finger of
Death has a fixed `-60` where the cost is −60 % plus 10 % per Necrosis stack.

The simulation is right in all these cases. Everything else that reads the JSON is not: tooltips, the damage preview, the
step captions, and anything exported. Either the fetch tool learns these shapes, or the JSON stops carrying damage and
the rules become the single source.

Related: the wiki classes Surge, Escape, Dive, Bladed Dive, Limitless and Runic Charge as **utility abilities**
(*"Type: Utility ability"*, https://runescape.wiki/w/Surge). `abilities.json` has no such type — they are filed as
`Basic`. Behaviour is right (0 adrenaline, off the GCD); the class name is what the catalog groups by and what the
Revolution toggles switch on.

---

## 4. The application

### 4.1 A session freezes when the page stops drawing, and says nothing

Measured in the running app: `document.hidden === false`, `visibilityState === "visible"`, `hasFocus() === true`, and
**0 animation frames in 1500 ms** because the window sat behind another window. The engine only advances inside the
`requestAnimationFrame` loop, so every key press is queued and never processed: the bars stand still, no feedback, no
error. The page has a fallback interval, but it only starts on `document.hidden`, which an occluded window never sets.

For a rhythm trainer this is the worst failure mode there is: alt-tab, a second monitor, an Alt1 overlay or a background
window and the session lies. Fix: drive the engine from a timer (interval or worker) and use rAF only for painting, or
start the fallback whenever no frame has arrived for more than ~200 ms and tell the user the session paused.

### 4.2 The pickers do not scale with the boss setups

With every boss setup added the Train page's rotation `<select>` holds 905 flat options (that one control is 111 KB of
accessibility tree), the Loadout page's picker 128, and the Rotations page renders every rotation as a card with no
search and no boss filter. The feature that makes the trainer useful — the PvME library — makes its own navigation
unusable. Group by boss, or add a search field and a boss facet.

### 4.3 Explore shows 500 of 905 guide rotations

`EXPLORE_GUIDES_LIMIT = 500` with `.order('owner_name').order('name')`: everything after roughly "R" (Sanctum, Solak,
Telos, TzKal-Zuk, Vorago, Vorkath, Yakamaru, Zamorak) never appears under the Guides chip. Only a name search finds it.
Paginate, or pick the boss account first.

### 4.4 "Load this setup" costs the player their configuration

`loadSetup` → `loadIntoMine` → `replaceSetup` replaces settings, loadouts, **keybinds**, **action bars** and the enemy.
The guide accounts publish settings and loadouts only, so loading a guide setup replaces the player's keybinds and bars
with nothing. The intended path ("copy a boss's loadout and rotations") should be additive: copy one loadout, keep
keybinds and bars.

### 4.5 Only the worn Essence of Finality is visible

A loadout can now carry several amulets, each with its own stored special, and the engine fires whichever the rotation
needs. The Loadout page still prints only the worn one — with three amulets in the backpack it says "no Essence of
Finality amulet worn (Neck)" and lists none of them. The context menu can edit each one; nothing shows what is stored
where.

---

## 5. Scope limits (bigger than any single bug)

- **Single target.** The engine has one enemy (`EnemyConfig`), no target count. 300 of the 905 guide rotations contain a
  multi-target ability (Greater Ricochet 206, Threads of Fate 70, caroming switches 62, Chain 41, Greater Chain 33).
  Their damage is single-target damage, and the effects that depend on hitting several targets never happen — which is
  exactly why 22 rotations still fail on "Volley of Souls: needs 2 Residual Souls": the guide builds those souls with a
  multi-target Soul Sap.
- **No life points, no incoming damage.** Devotion, Resonance, Immortality, Barricade, Debilitate, Preparation and every
  healing effect are no-ops; "Enable incoming attacks" simulates a rhythm, not a boss. Defensive rotations cannot be
  practised.
- **No boss phases or mechanics.** Guide steps such as "enter the portal" or "wait for the jump" stay notes.
- **Hit chance uses the wiki's cubic curve** while damage already uses the modernisation's logarithmic one
  (`f(x) = x³/1250 + 4x + 40` in `hit-chance.ts` versus `2.5·145·ln(1+0.6·level/145)/ln 1.6` in `damage.ts`). The wiki's
  Hit chance page still shows the cubic, so we follow it — but it predates the modernisation and is probably stale.
- Further known-open points are marked `[OPEN]` in `docs/research/*.md` (cooldown off-by-one, the second stun charge
  level, the Berserk Overpower cap, DoT tick spacing, dual-wield hit chance, leech curses, black stone arrows).

---

## 6. What is confirmed current (no work needed)

- **Special attacks:** all 75 in `specs.json` are byte-identical to the wiki — adrenaline, cooldown, damage, GCD
  behaviour, channelling, weapons. The Essence of Finality has no damage penalty, no tier cap and no cooldown of its own.
- **Weapons:** 1923 records, no name, tier, ability-damage or accuracy difference, including the Ruinous weapons of
  11 May 2026. No weapon tier changed in the modernisation, and no new endgame weapon has been released since.
- **Abilities:** the fetch pipeline reproduces today's infoboxes exactly; no ability is missing, none we carry was
  removed. The March refinements (Assault 140 %, Overpower 545 %, Slaughter 90 %, Massacre 100 %, Flurry 65 %, Asphyxiate
  130 %, Wen arrows 30 %, Caroming 4 %, FSOA Lightning Surge 80 %) are all in.
- **Set effects and perks:** all 13 modelled passives and all 12 perks match, including Equilibrium's rescale to
  6 % + 2 % per rank (30 March 2026).
- **Necromancy:** Death Skulls' 17-tick cooldown inside Living Death, the aura removal and the basic-attack adrenaline
  change of 2 March are modelled.
- **Prayers and spells:** all 90 prayers match on level, drain and effect numbers — the modernisation touched none of
  them — and so do all 30 spells. The four +12 % damage curses (Malevolence, Desolation, Affliction, Ruination) are
  correct.
- **The formulas are current:** ability damage already uses the modernisation's logarithmic curve
  `f(level) = 145·ln(1 + 0.6·level/145)/ln 1.6`; critical strikes (10 % base chance, 10 % → 50 % damage capped at level
  90) and the hit-chance model were **not** changed by the modernisation. Only the default monster affinities moved
  (65/55/45 → 70/60/50) and our presets already use the new ones. Elder overload, weapon poison +++, Kwuarm, adrenaline
  renewal and both powerbursts match.
- **Nothing to import from August and September 2026:** those updates are Leagues II on separate worlds. Its Blessings
  (30 % cooldown reduction, tier-120 weapons, hit chance always using the target's weakness) look like formula changes
  out of context and must not enter the model.

---

## 7. How to redo this

Four wiki passes (updates timeline, abilities, weapons and specials, prayers/spells/familiars/formulas), each diffing the
live wiki against `public/data/*.json` and `src/app/engine/rules-*.ts`; the raw reports of this round are in the session
scratchpad (`research/updates-timeline.md`, `abilities-audit.md`, `weapons-specs-audit.md`, `support-audit.md`,
`app-walkthrough.md`). The wiki's Bucket API and the `?action=raw` wikitext are the sources the `tools/fetch-*.py`
scripts already use, so a re-fetch plus a diff is the fastest check; the ability, weapon and spec data can be verified
mechanically that way.
