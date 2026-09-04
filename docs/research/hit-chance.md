# Hit chance (accuracy vs the target)

Research date: 2026-09-04. Sources: https://runescape.wiki/w/Hit_chance, https://runescape.wiki/w/Armour_rating,
https://runescape.wiki/w/Affinity, https://runescape.wiki/w/Weapon_accuracy, https://runescape.wiki/w/Necromancy,
https://runescape.wiki/w/Wen_arrow, https://runescape.wiki/w/Ful_arrow, the prayer pages (numbers as in `public/data/prayers.json`)
and the boss infoboxes (`?action=raw`). Legend: **[VERIFIED]** quoted from the wiki, **[INFERRED]** my reading, **[OPEN]** the wiki is silent.

Code: `src/app/engine/hit-chance.ts` (formulas, prayer levels, item constants), `loadout-resolver.ts` (weapon accuracy, multipliers,
additive bonuses), `trainer-engine.ts` `hitChanceFor()` / `hitRoll()` / `dealHit()`, `core/models.ts` `EnemyConfig` / `ENEMY_PRESETS`.

## 1. Formula

- **[VERIFIED]** `H = Aff × a/d + m`, "capped at 100%". Aff = affinity, a = the player's accuracy, d = the target's armour rating,
  m = additive hit chance modifiers.
- **[VERIFIED]** `f(x) = x³/1250 + 4x + 40`. Accuracy `a = ⌊L + T⌋` with the level bonus `L = f(ℓ)` (ℓ = skill level incl. boosts)
  and the weapon bonus `T = 2.5 × f(t)` (t = weapon tier); "The target's armour rating d is the sum of their armour and armour
  bonus granted by their Defence level, rounded down": `d = ⌊armour + f(Defence)⌋`.
- **[VERIFIED]** Weapon accuracy page: "Accuracy: t³/500 + 10t + 100" – the same as 2.5 × f(t) (2,765 at tier 95, 1,924 at 80,
  1,486 at 70 – the `accuracy` field of `public/data/weapons.json`). The engine uses the unrounded 2.5 × f(tier) so the wiki's
  worked example reproduces exactly; the infobox value is the fallback for a weapon without a tier.
- **[VERIFIED]** Worked example (Hit chance / Armour rating pages): Saradomin godsword (tier 75) at 99 Attack against abyssal demons
  (Defence 70, armour 1,608, affinity 90): `a = ⌊f(99) + 2.5×f(75)⌋ = 2,905`, `d = ⌊1,608 + f(70)⌋ = 2,202`,
  `H = 90 × 2,905 / 2,202 ≈ 118.7%` → 100%. (f(99) = 1,212.24, 2.5 × f(75) = 1,693.75, f(70) = 594.4.) These are the numbers
  `hit-chance.spec.ts` pins.
- **[VERIFIED]** Skill per style (Weapon accuracy page): Attack for melee, Ranged, Magic, Necromancy. The overload-boosted level from
  `ResolvedLoadout.levels` is used (elder overload: 99 → 120), so potions are not counted twice.
- **[VERIFIED]** Prayers add *levels* "(for accuracy)" (prayers.json): Clarity of Thought / Sharp Eye / Mystic Will / Hand of Judgement
  +2, the middle tier +4, the top tier +6, Chivalry +7, Piety / Rigour / Augury / Sanctity +8, Turmoil / Anguish / Torment / Sorrow +10,
  Malevolence / Desolation / Affliction / Ruination +12, Leech (attack) "+2 to +5 levels" (grows over 1–3 min). Saps only drain the enemy.
  Table: `PRAYER_ACCURACY_LEVELS`. **[INFERRED]** the levels are added to ℓ before f(ℓ) – the same place a potion boost enters.
- **[VERIFIED]** Multiplicative accuracy modifiers on the Hit chance page: defenders / reprisers / rebounders in the off-hand 1.03,
  nihil familiars 1.05, Void knight 1.03, slayer helm 1.125–1.145 on task, Salve 1.15 / 1.2 vs undead, scrimshaws 1.02–1.04. Modelled:
  defender 1.03 (`hasDefender`), nihils 1.05 for their style (`NIHIL_ACCURACY`), Ful arrows "−10% accuracy" (× 0.9, set-effects.json
  `accuracy`). Not modelled: Void / slayer helm / accuracy scrimshaws / Energising perk (no data in the loadout).
- **[VERIFIED]** Additive hit chance modifiers (m) on the page: Keris, Silverlight, Balmung, Hexhunter, bane ammo, Blisterwood,
  Confuse −5%, Stagger −10%, reaper necklace 0.1% per stack, Nightmare gauntlets Snipe +25%, Fleeting boots Rapid Fire +10%.
  Modelled from set-effects.json `hitChance`: reaver's ring −5%, Nightmare gauntlets Snipe +25%, Salve amulet +15% / (e) +20% and
  Jas dragonbane / demonbane arrows +20% against their target type (`EngineConfig.targetType`). Wen arrows: "Icy Precision grants
  Ranged enhanced and ultimate abilities (and special attacks) +30% hit chance and +30% base damage" but "The consuming enhanced,
  ultimate, or special ability benefits from the damage buff but not the hit chance buff" – `BUFF_HIT_CHANCE_ADD`, treated as
  additive m **[INFERRED]** (the wiki words it as "hit chance", like the other additive entries).

## 2. What the hit chance does – damage potential, not a miss roll

- **[VERIFIED]** Update history, 4 March 2024: "Replaced the 'roll to hit' system with the 'damage potential' system for Melee, Ranged
  and Magic combat against NPCs" and "Reduced the minimum hit chance required to damage an NPC under the new system. 25% → 1%".
  "If a player has between 1% and 100% hit chance, their damage is scaled accordingly. If a player has under 1% hit chance, they
  will miss all their attacks." Necromancy page: "In most cases it is not possible for attacks to miss—hit chance acts as a
  multiplier to damage, instead of a chance of missing." In PvP abilities still either land in full or miss.
- Engine: `Settings.hitChance` / `EngineConfig.hitChanceModel`: **scaled** (default, the wiki's PvM rule: `amount × H`, applied
  before Haunted's flat add because "The extra damage is not reduced if the player has less than 100% accuracy"; H < 1% = miss),
  **roll** (`random() < H` lands in full, otherwise a miss – the pre-2024 / PvP model, kept because the trainer wants visible
  misses), **off** (`hitChanceDisabled`). A miss emits `{ kind: 'hit', amount: 0, miss: true }`, counts in `missCount`, applies no
  on-hit effects (rule `onHit`, `hitBuffs`, global on-hit effects, item procs, poison, Perfect Equilibrium) and drops the later ticks
  of the bleed it would have applied. Crackling still fires (it bypasses hit chance, see below).
- The hit chance is rolled before the critical strike, so the pinned `random` of the other specs keeps its meaning; those specs pass
  `hitChanceDisabled: true` in their `make()` helpers anyway.

## 3. What bypasses hit chance

- **[VERIFIED]** Hit chance page list: boss mechanics, Crackling and Aftershock, poison, "Necromancy's conjured spirits", Split Soul,
  the Eldritch crossbow special, "Damage over time from normal and greater Sunshine and the Zaros godsword's special attack",
  Blood reaver healing damage. Conjuration page: "Conjured spirits and their command abilities always deal 100% of their damage
  potential, even when the player does not have 100% hit chance against the target."
- Engine: `h.spirit` (spirits and Command hits), `h.proc` (item proc hits), the Sunshine DoT (`HIT_CHANCE_BYPASS_DOTS`), poison,
  Crackling, Aftershock, Split Soul (derived from the dealt hit) and familiar attacks (own accuracy stat, not in the data –
  **[INFERRED]** always land) are not rolled / scaled. Bleed ticks: in the roll model only the first tick rolls and the rest follow
  it; in the scaled model every tick is scaled with the hit chance of its own tick **[INFERRED]** (the wiki scales "the ability's
  damage potential"; a snapshot at the first tick would differ only when prayers change during the bleed).

## 4. Affinity and the enemy presets

- **[VERIFIED]** Affinity page: 90 against the explicit weakness, 70 / 60 / 50 for the weakness's style / neutral / strong style; a
  style bonus of 0 equals 55. Hit chance page: "Necromancy always uses the middle affinity value for monsters with custom values";
  Necromancy page: "Necromancy attacks use the affinity of the target corresponding to the primary style the monster uses … For most
  monsters, this is 55." Affinity raisers (Claws of Guthix +2, Obliterate +5, Clobber +3, Sunder +4, Book of War +3, max +10) are not modelled.
- Infobox values (normal mode, `?action=raw`), Necromancy = the middle of the three:

  | preset | Melee | Ranged | Magic | Necromancy | Defence | Armour |
  |---|---|---|---|---|---|---|
  | Nakatra, Devourer Eternal | 55 | 65 | 55 | 55 | 95 | 2,765 (hard mode: 60/60/60, Defence 110, armour 3,862) |
  | Zamorak, Lord of Chaos | 55 | 55 | 55 | 55 | 80 | 1,924 |
  | Raksha, the Shadow Colossus | 55 | 65 | 55 | 55 | 85 | 2,178 |
  | Rasial, the First Necromancer | 55 | 55 | 55 | 55 (listed) | 95 | 2,458 |
  | Training dummy (melee) | 60 | 50 | 70 | 60 | 1 | 110 |
  | Custom (default) | 100 | 100 | 100 | 100 | 1 | 0 – always hit, existing sessions keep their numbers |

  With Ek-ZekKil at 99 Attack against Nakatra: a = 3,976, d = 3,870, H = 55 × 3,976 / 3,870 ≈ 56.5%; with Turmoil (+10) 60.8%.
  Against the dummy every style is far above 100%.

## 5. Approximations and open questions

- **[OPEN]** Dual wield: the Hit chance page says nothing about the off-hand; the engine uses the main-hand / two-hander's tier only
  (an off-hand of the same tier changes nothing under that reading; a defender adds the 1.03).
- **[OPEN]** Leech curses are taken at their maximum (+5 levels) instead of growing from +2; the enemy Defence drains of Turmoil-tier
  curses (−6 to −12 enemy Defence levels "for armour", growing over time) are not applied to the target's armour rating.
- **[OPEN]** Black stone arrows (armour −0.75% per hit, max 15%) stay in `NOT_SIMULATED_EFFECT_KINDS`.
- **[OPEN]** Defence / Constitution abilities with damage use the wielded style's affinity and skill (`affinityStyleOf`).
- **[OPEN]** The wiki's cubic f(x) predates the Combat Style Modernisation's logarithmic damage curve (`damage.ts levelCurve`); the
  Hit chance page (state September 2026) still shows the cubic, so that is what is used.
