# RS3 Magic abilities — simulator spec (post Combat Style Modernisation, 2 March 2026)

Research date: 2026-09-03. Source: RuneScape Wiki (raw wikitext, `?action=raw`, fetched 2026-09-03).
All quotes are verbatim wiki text unless marked *[paraphrase]*. 1 tick = 0.6 s. "GCD" = global cooldown = 3 ticks (1.8 s).

Primary sources used for every ability:

- Combat Style Modernisation (CSM) page, section "Magic details": https://runescape.wiki/w/Combat_Style_Modernisation
- Patch Notes Part 2 (magic design notes): https://runescape.wiki/w/Update:Patch_Notes:_Part_2_-_Combat_Style_Modernisation
- Runic Charge / Anima Charged (the new magic resource): https://runescape.wiki/w/Runic_Charge , https://runescape.wiki/w/Anima_Charged
- Flow / Greater Flow / Channelled Might / Blast Infused / Glacial Embrace (buff pages)
- Abilities (channelled, DoT, GCD rules): https://runescape.wiki/w/Abilities ; Cooldown: https://runescape.wiki/w/Cooldown
- Critical strike: https://runescape.wiki/w/Critical_strike
- Freedom: https://runescape.wiki/w/Freedom ; Stun: https://runescape.wiki/w/Stun ; Bind: https://runescape.wiki/w/Bind

Later patches that changed magic abilities after 2 March 2026 (all included below, since the simulator should mirror live):

- 9 March 2026 "Combat Style Refinements": FSOA and Tumeken's nerfs; rune consume chance 20% -> 15%.
- 16 March 2026 "DailyScape Overhaul": Surge/Escape no longer share cooldown (except PvP); Surge/Escape/Runic Charge no longer clear stalled abilities; enhanced abilities can be toggled for Revolution.
- 30 March 2026 "Blooming Burrow Returns!": Wild Magic gained +10% crit chance / +20% crit damage; Asphyxiate damage 110-130% -> 120-140% and gained Channelled Might buff.
- 7 April 2026: Magma Tempest "Toggle: Target Mode"; channelled tooltips re-spelled; Chain projectile timings sped up.

---

## 0. Global rules that apply to every magic ability

### 0.1 Ability classes (CSM "All styles", https://runescape.wiki/w/Combat_Style_Modernisation)

> "The 'threshold' ability type was removed from the three styles. Abilities with [[adrenaline]] costs can be used as soon as the player has enough adrenaline."
> "Abilities that are not basic or ultimate abilities were divided up into 2 groups: 'enhanced' abilities that don't generate adrenaline (usually consume it), and 'utility' abilities (such as [[Surge]])."
> "Ultimate abilities remain, but they do not always require 100% adrenaline."
> "Basic abilities now generate 9% adrenaline by default (increased from 8%), though some can generate more."
> "Like Necromancy, a distinction is made between 'basic abilities' (generate adrenaline) and 'basic attack' (generate adrenaline, automatically used if no other ability is selected)."
> "All 'lesser' abilities were removed"
> "All threshold-stuns ([[Forceful Backhand]], [[Deep Impact]], [[Tight Bindings]]) and movement-stuns ... were removed."
> "Basic stuns remain, and unlock a second charge allowing the player to use them twice before needing to wait for the cooldown (similar to [[Double Surge]])."
> "Basic stuns can have knockback toggled on or off via the right-click [[Choose Option]] if [[Scare Tactics]] has been read."
> "The adrenaline cost from eating food was reduced from 10% to 3%."
> "Magic and Ranged attacks now always have a chance to consume runes/ammunition, rather than just when special effects were active (15% for most spells/ammo)"
> "All weapons (of all styles) were unified to a 3-tick [[attack speed]]"
> "[[Ability stalling|Stalled abilities]] are no longer cleared by [[Surge]], [[Escape]], [[Runic Charge]], and former-[[sigil]] abilities." (16 March patch)
> "[[Surge]] and [[Escape]] no longer share cooldowns, except in [[pvp|PvP scenarios]]." (16 March patch)

Ability-type adrenaline rules (https://runescape.wiki/w/Abilities#Adrenaline):
> "* Basic abilities generate 9% adrenaline.
> * Enhanced abilities require and drain zero to moderate amount of adrenaline, depending on the ability.
> * Threshold abilities require 50% adrenaline and will drain 15% on use.
> * Ultimate abilities require and drain 60% or 100% adrenaline."

Ultimatums perk (https://runescape.wiki/w/Ultimate_abilities): "The [[Invention]] perk [[Ultimatums]] increases the base damage of all ultimate abilities by 3% + 1% × rank."

### 0.2 Global cooldown (https://runescape.wiki/w/Cooldown#Global_cooldown, https://runescape.wiki/w/Abilities#Cooldown)

> "The '''global cooldown''', frequently shortened to "'''GCD'''", is the 3 ticks (1.8 seconds) cooldown which starts every time a player begins to use a [[Spells|spell]] or [[Abilities|ability], and affects all of other spells and abilities. There are exceptions to this."
> "After using an ability, the player cannot use another ability for 3 [[tick]]s (1.8 seconds). This is the global cooldown. This triggers from the moment of use, so after a [[#Channelled|channelled]] ability, the player can immediately use another ability."
> "Some abilities and spells are not affected by the global cooldown, and do not trigger the global cooldown when used. ... These types of abilities are often referred to as "Can be cast during the global cooldown." As such abilities are instant-cast, multiple can be used simultaneously, followed by other abilities."

Magic abilities usable during the GCD: **Surge** (and Double Surge), **Runic Charge**. All others in this document trigger and obey the GCD.

Adrenaline note (Refinements patch, 9 March 2026, https://runescape.wiki/w/Update:Combat_Style_Refinements_%26_March_Marketplace_Drop): "Abilities that can be activated outside of the global cooldown (such as Surge or Dive) no longer generate adrenaline."

### 0.3 Channelled abilities (https://runescape.wiki/w/Abilities#Channelled)

> "Channelled abilities are abilities that take a certain amount of time or a number of hits to execute. Unlike standard abilities, most channelled abilities require the player be locked in to using the ability, up to a maximum amount of time longer than a global cooldown. A [[Channel Bar]] displays while a channelled ability is performed."
> "These abilities are able to be cancelled by performing another ability (or by walking or similar actions)."
> "[[Melee]] channelled abilities allow the player to move around their target while using them, as long as they remain within attack range. [[Rapid Fire]] always allows movement, and [[Nightmare gauntlets]] allow movement while using [[Snipe]]."

Magic channelled list (same page): "Magic | Concentrated Blast | Greater Concentrated Blast | Asphyxiate | Smoke Tendrils". Movement therefore cancels all magic channels (no exception listed for magic).

Ability queueing during channel (https://runescape.wiki/w/Ability_queueing, 28 Jan 2019 patch): "Players can now reliably queue abilities while they are currently channeling an ability such as [[Concentrated Blast]]".

### 0.4 Damage over time (bleed/burn) abilities (https://runescape.wiki/w/Abilities#Damage_over_Time_abilities, https://runescape.wiki/w/Damage_over_time)

> "Damage over Time (DoT) abilities, described as bleeds or burns in game, are abilities that have their effects last longer than one global cooldown, but unlike channelled abilities, they cannot be cancelled by the player. This means that if the player casts one of these abilities, the effect will continue for the appropriate duration of the ability (unless specific mechanics of the target prevent or cancel it). DoT abilities are multi-hitting abilities that hit every 2 game ticks."
  (Note: Combust now hits every 3 ticks — the generic "every 2 game ticks" sentence is stale for Combust; see Combust section.)
> "Applying the same effect will only refresh the effect and maintain the same maximum duration."

Magic DoT list: "Magic | Combust | Corruption Blast". Burn list (Template:Burn abilities): "Magic | Combust | Roar of Awakening (Soulfire) | Dragon Rider amulet". Bleed list for Magic: N/A (Corruption Blast is neither burn nor bleed for equipment purposes: "Of the three, it is the only one not classified as a burn." https://runescape.wiki/w/Corruption_Blast).

Template "Bleeds: Unaffected boosts" (applies to Combust, Corruption Blast, Sunshine DoT):
> "Damage over time is only affected by some modifiers, including: Damage bonus from equipment; Visible combat skill boosts, from potions or other sources; Vulnerability or its lesser form, Curse; The Eruptive perk; Among the slayer (effect) group ...; The hexhunter bow, inquisitor staff and terrasaur maul; Scrimshaws and the Scripture of Amascut; Icy Precision effect granted by Wen arrows"
> "Unlike other abilities, damage over time is not affected by: Damage boosting prayers and Ancient Curses (aside from their accuracy bonus); Damage boosting abilities: Berserk, Death's Swiftness, and Sunshine; Zaros godsword's special attack; Berserker's Fury relic power; Berserker necklace's passive effect; Most perks affecting variable damage, including Genocidal, Precise, and Ruthless; Some items from the slayer (effect) groups ...; Critical strikes; Slayer helmet and its variants; All enchanted bolts ..."

Critical strike page: "Most damage over time abilities (bleeds, burns, etc.) can never critically strike and are unaffected by all forms of critical strike chance increases."

### 0.5 Critical strikes (https://runescape.wiki/w/Critical_strike)

> "Abilities and attacks have a 10% base critical strike '''chance'''"
> "Critical strikes deal a fixed percentage of bonus '''damage''' determined by the level of the relevent combat stat ... Base critical strike damage maxes out at level 90." Table: lvl 1 = 10%, 20 = 15%, 30 = 20%, 40 = 25%, 50 = 30%, 60 = 35%, 70 = 40%, 80 = 45%, 90 = 50%.
> "Critical strike chance can be increased ''additively''"
> "In [[Player-versus-player|PvP]] situations, critical strike damage has only 20% effectiveness"

Magic-ability crit modifiers listed there: Concentrated Blast "5-15% (15-45%)", Greater Concentrated Blast "7-21% (17-51%)", Wild Magic "+10%" chance and "+20%" damage, Smoke Tendrils "100%" (guaranteed), Channelled Might "+15-35%" crit damage, FSOA passive "15-25%" crit damage (CSM says nerfed to 10-25% on 9 March), Smoke Cloud "+15%" crit damage (40% effectiveness for non-magic), Tumeken's "1.5% per piece worn while inside Sunshine".

### 0.6 Rune consumption (CSM magic section)

> "All magic abilities now have a chance to consume runes, rather than never consuming runes unless some special effect was active. By default this is 15%." (footnote: "Prior to 9 March patches, rune consume chance was 20%.")

### 0.7 Freedom vs magic effects (https://runescape.wiki/w/Freedom)

Freedom: "Remove stuns and binds. Clear damage over time effects. Gain immunity to stuns and binds. 6 ticks duration." (tooltip says 10 ticks in infobox `{{ticks|10}}`; body says "immunity from further binds and stuns for six seconds" — six seconds = 10 ticks).
Removable DoTs (explicitly listed): "Combust — Applied to targets hit with [[Combust]]", "Corruption Blast — Applied to targets hit with [[Corruption Blast]]".
Stuns/binds removed: Impact and Asphyxiate stun/bind (generic "Bound"/"Stunned" statuses).
NOT removable / not listed: Sunshine DoT (not on either list — treat as not clearable; ambiguous), Magma Tempest (not a DoT: "Damage from this ability is not considered as [[damage over time]]"), Smoke Tendrils self-damage (not a DoT), Combust's Dragon-Rider mini-burn is a Combust status so is cleared.

---

## 1. Magic (basic attack)

URL: https://runescape.wiki/w/Magic_(ability)

- **Type**: Basic (basic attack, `basic_attack = Yes`). **Adrenaline**: +9%. **Cooldown**: "1.8" (infobox) — CSM: "No cooldown (other than [[global cooldown]])". **Duration**: instant. **Channelled**: no. **During GCD**: no (obeys GCD). Level 1 Magic. Equipment: Any. Target: Single.
- Tooltip: "Attack the target. * 90%-110% Magic damage. * Generates 9% Adrenaline. Automatically triggered during combat."
- CSM: "Your basic magic attack. Automatically used when no other abilities are selected (full manual can toggle off automatic use). * 90-110% magic ability damage * No cooldown (other than global cooldown)"
- Patch Notes 1: "Basic Attacks have been added to Magic, Ranged, and Melee, fully replacing auto-attacks." "Magic Basic Attacks use the data and effects of your currently selected spell"
- **RESOURCES**: generates 9% adrenaline. Does not interact with Anima Charged (not on the list). With Incite Fear selected it grants a Glacial Embrace stack ("Casting an ability with Incite Fear as your main-hand spell grants 1 stack").
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Sunshine (1.5x), Blast Infused (+8% base damage to basic magic abilities — it is a basic ability), crit buffs (Concentrated Blast next-ability crit, Channelled Might), Vulnerability, Chain copy effect (single-target Magic ability -> copied to Chain secondaries; not explicitly tested on the wiki table, but it is a single-target magic ability).
- **REQUIREMENTS**: "Ancient Magicks combat spells cast using this ability will have their special effects (and area targeting, if applicable) activate 100% of the time." Requires a combat spell selected/auto-cast (implied by "use the data and effects of your currently selected spell"). Weapon: Any.
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: none (except spell side-effects e.g. Ancient Magicks effects at 100%).
- **CHANNEL**: not channelled.
- **OTHER**: "The ability's animation varies depending on the spell currently being cast." Classic Mode locks the player to this ability: "Classic Mode locks the player into always only using the basic attack ... Attacks always occur every 3 ticks" (CSM).

---

## 2. Surge

URL: https://runescape.wiki/w/Surge

- **Type**: Utility ("type = Utility", found in the Magic ability book). **Adrenaline**: 0. **Cooldown**: 20.4 s (34 ticks). **Duration**: instant. **Channelled**: no. **During GCD**: YES — "Can be cast during the global cooldown." (tooltip); 4 March 2024: "Can always be cast during global cooldown"; "No longer generate adrenaline"; "Are now classed as 'Abilities' rather than 'Basic Abilities'". Requirement: level 5 Agility (`skill1 = Agility, skill1lvl = 5`). Equipment: None.
- Tooltip: "Teleport forward. * Move forwards 10 tiles. (After reading a Double Surge codex) Maximum charges: 2. Can be cast during the global cooldown. Must be manually triggered during revolution combat."
- **RESOURCES**: none (0 adrenaline; does not generate adrenaline).
- **MODIFIES OTHER ABILITIES**: "Also, this ability has an effect of cancelling out channelled or multi-hit abilities such as [[Assault]] in PvP if surging outside the enemy's attack range." Moving cancels your own magic channel (see 0.3). 16 March 2026: no longer clears stalled abilities ("Surge, Escape, Runic Charge and Sigils no longer clear stalled abilities.").
- **IS MODIFIED BY**: "The [[Mobile]] [[perk]] will halve its cooldown." "A [[powerburst of acceleration]] can be used to instantly reset the cooldown of Surge and reduce the cooldown to 1.2 seconds for six seconds." "The [[Shadow's Grace]] [[relic power]] will apply the Mobile perk as a permanent buff".
- **REQUIREMENTS**: no target needed; "Surge will not activate automatically through [[Revolution]]." (stun blocks all abilities except Freedom — Stun page).
- **SHARED COOLDOWNS**: 
  - Escape: "No longer shares a cooldown with Escape" (16 March 2026 patch). CSM: "[[Surge]] and [[Escape]] no longer share cooldowns, except in [[pvp|PvP scenarios]]." Patch text: "There does still however remain a very short anti-spam cooldown to prevent both abilities firing on the same cycle."
  - Dive/Bladed Dive: "In [[PvP]]-enabled areas, Surge shares its cooldown with [[Dive]]." Bladed Dive page: "It also shares cooldowns with [[Surge]] and [[Escape]] if used in the [[Wilderness]] or other [[PVP|PvP]]-enabled areas". Outside PvP: "Because Dive and Surge do not share cooldowns, performing a dive and surge can be done instantly when the keys are pressed within the same game tick".
  - Impact: none ("Players can now use the Surge ability after using the Impact ability." 2013; "The Surge and Escape abilities no longer share a cool down with stun abilities." 2014).
- **GREATER version**: none. **Double Surge** (codex): "Upon reading the [[double Surge codex]], Surge will gain a second charge with an independent cooldown, allowing the ability to be used twice in a row. At most one of the cooldowns is visible at any given time - the one that is closest to being available for use." "Double Surge is not enabled in the Wilderness if the player is opted in to PVP." "The antispam delay for double Surge can be modified at the lectern".
- **BUFFS/DEBUFFS**: none.
- **CHANNEL**: n/a.
- **OTHER**: "The Surge, Escape and Bladed Dive abilities will no longer cause you to enter combat stance. Using these abilities while in combat stance will still maintain it." Can be used for adrenaline stalling (Adrenaline page).
- CSM "Things not changed": "Surge (and double surge)".

---

## 3. Runic Charge (new utility; the magic "resource" enabler) and Anima Charged

URLs: https://runescape.wiki/w/Runic_Charge , https://runescape.wiki/w/Anima_Charged

- **Type**: Utility. **Adrenaline**: 0 (neither uses nor gains). **Cooldown**: 30 s (50 ticks). **Duration of buff**: 25 ticks (15 s). **During GCD**: YES ("Can be cast during the global cooldown." / "Runic Charge can be activated in between, and does not incur, the global cooldown."). Level 26 Magic. Target: Self. "Must be manually triggered during revolution combat." / "Will not be used by Revolution".
- Tooltip: "Charge yourself with Anima * Applies Anima Charged to self. * 25 ticks duration. ... Anima Charged: * Your next Magic ability is empowered: * Sonic Wave: Your next Magic ability costs 35% less Adrenaline. * Greater Sonic Wave: Your next Magic ability costs 45% less Adrenaline. * Dragon Breath: Deals 260%-310% Magic damage * Concentrated Blast: Each attack grants an additional 10% Critical Strike Chance. * Greater Concentrated Blast: Each attack grants an additional 10% Critical Strike Chance."
- Anima Charged buff page: "trigger = Activating Runic Charge; duration = 15 seconds or until casting one of the affected abilities; stacks = No".
- CSM: "The next magic ability (of the following) used will be empowered, consuming the buff * [Greater] Sonic Wave: [Greater] Flow buff improved by +25% * Dragon Breath: Deals 260-310% magic ability damage instead * [Greater] Concentrated Blast: Each attack grants +20% critical strike chance" — NOTE: the CSM table's "+20%" is the beta value; the live value is +10% ("Concentrated Blast and Greater Concentrated Blast additional crit chance 20% → 10%" in the 2 March 2026 update history on both Runic Charge and Anima Charged pages). Use **+10% per hit**.
- Patch Notes 2: "The ability is quite unique in that it neither applies the Global Cooldown, nor does it use or gain adrenaline, meaning it can be cast instantly to gain its effects".
- **Consumption rule**: Anima Charged is consumed ONLY by Sonic Wave / Greater Sonic Wave / Dragon Breath / Concentrated Blast / Greater Concentrated Blast ("lasts 15 seconds or until one of the following abilities is activated"). Other magic abilities do not consume it.
- **OTHER**: 16 March 2026: "Runic Charge ... no longer clear stalled abilities."

---

## 4. Sonic Wave

URL: https://runescape.wiki/w/Sonic_Wave ; buff: https://runescape.wiki/w/Flow

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 15 s (25 ticks). **Duration**: instant hit; Flow buff 15 ticks (9 s). **Channelled**: no. **During GCD**: no. Level 6 Magic. Equipment: Any. Target: Single.
- Tooltip: "A focused blast of magic that pummels the target. * 90%-110% Magic damage. * Applies Flow to self. * 15 ticks duration. * Generates 9% Adrenaline. Flow * Your next Magic ability costs 10% less Adrenaline"
- Body: "If the ability successfully damages your opponent, [[Flow]] is gained for 9 seconds or until an enhanced or ultimate Magic ability is used. Flow reduces the [[adrenaline]] cost of your next Magic ability by 10%. This can be empowered by casting [[Runic Charge]] before using Sonic Wave, further reducing adrenaline cost by 25% for a total of 35% cost reduction. [[Defence]], [[Constitution]], and [[Weapon Special Attack|special attacks]] do not have their adrenaline costs reduced by Flow, nor do they consume Flow."
- Hit timing: "Sonic Wave strikes the target 2 ticks after being cast. If the player stalls Sonic Wave, waits a global cooldown, then casts Sonic Wave while dual wielding magic weapons, Sonic Wave strikes the target 1 tick afterwards instead."
- **RESOURCES**: generates +9% adrenaline. Applies **Flow** (self) on a successful hit. Consumes **Anima Charged** if present (Flow becomes 35%).
- Flow buff page: "trigger = Landing a hit with [[Sonic Wave]]; duration = 9 seconds; Removed upon activating a [[Magic abilities|Magic ability]] that costs adrenaline; effects = Reduces the adrenaline cost of the next Magic ability by 10%; If [[Anima Charged]] was active when activating Sonic wave, reduces the adrenaline cost of the next Magic ability by 35%"; `stacks = No`.
- **MODIFIES OTHER ABILITIES**: next adrenaline-costing Magic ability (Wild Magic, Asphyxiate, Corruption Blast, Magma Tempest, Omnipower, Sunshine, Greater Sunshine, Tsunami; Smoke Tendrils costs 0 so nothing to reduce — whether it consumes Flow is not stated) costs 10% less (35% with Anima Charged). CSM wording: "Your next adrenaline-consuming ability costs -10% adrenaline". Flow is consumed by that ability. Not consumed by Defence/Constitution abilities or special attacks.
- **IS MODIFIED BY**: Anima Charged (Runic Charge). Sunshine 1.5x. Blast Infused +8% base damage (basic). Concentrated Blast crit buff. Chain/Greater Chain: "Sonic Wave — damage passes: Yes; effects pass: Yes" (Greater Chain table).
- **REQUIREMENTS**: none special ("no longer require a specific Magic weapon type to use" 22 July 2024). Flow only applied on a hit ("If the ability successfully damages your opponent").
- **SHARED COOLDOWNS**: none. "No longer shares a cooldown with [[Concentrated Blast]]." (2 March 2026).
- **GREATER version**: Greater Sonic Wave (section 5) — "replacing the standard version of the ability" (cannot have both).
- **BUFFS/DEBUFFS**: Flow (self, 9 s / 15 ticks, no stacks; refresh on re-cast presumed — not stated; removed when an adrenaline-costing Magic ability is used). Not affected by Freedom (self buff).
- **CHANNEL**: n/a.
- **OTHER**: Ambiguity — the page says Flow ends "until an enhanced or ultimate Magic ability is used" while the buff page says "Removed upon activating a Magic ability that costs adrenaline". These coincide except for zero-cost enhanced Smoke Tendrils (see ambiguities).

---

## 5. Greater Sonic Wave

URL: https://runescape.wiki/w/Greater_Sonic_Wave ; buff: https://runescape.wiki/w/Greater_Flow

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 15 s (25 ticks). **Duration**: Greater Flow 15 ticks (9 s). **Channelled**: no. **During GCD**: no. Level 6 Magic (requires reading the Greater Sonic Wave ability codex). Members. Equipment: Any.
- Tooltip: "A focused blast of magic that pummels the target and leaves behind residual energy. * 115-135% Magic damage. * Applies Greater Flow to self. * 15 ticks duration. * Generates 9% Adrenaline. Greater Flow * Your next Magic ability costs 20% less Adrenaline."
- Body: "Upon hitting, [[Greater Flow]] is gained for 9 seconds or until an enhanced or ultimate Magic ability is used. Greater flow reduces the [[adrenaline]] cost of your next Magic ability by 20%. This can be empowered by casting [[Runic Charge]] before using Greater Sonic Wave, further reducing adrenaline cost by 25% for a total of 45% cost reduction. [[Defence]], [[Constitution]], and [[Weapon Special Attack|special attacks]] do not have their adrenaline costs reduced by Greater Flow, nor do they consume Greater Flow."
- Greater Flow page: "trigger = Landing a hit with [[Greater Sonic Wave]]; duration = 9 seconds; Removed upon activating a [[Magic abilities|Magic ability]] that costs adrenaline; effects = Reduces the adrenaline cost of the next Magic ability by 20%; If [[Anima Charged]] was active when activating Greater Sonic wave, reduces the adrenaline cost of the next Magic ability by 45%"; `stacks = No`.
- **Differences from Sonic Wave** (exact): damage 115-135% vs 90-110%; buff = Greater Flow 20% (45% with Anima Charged) vs Flow 10% (35%). Same cooldown, adrenaline, level, target. "It is unlocked by reading a [[Greater Sonic Wave ability codex]], replacing the standard version of the ability." -> only one can be on the bar. "On free to play worlds" reverts (stated on the Greater Concentrated Blast page for that ability; GSW is members-only).
- All other fields identical to Sonic Wave. Greater Chain table: "Greater Sonic Wave — Yes / Yes".

---

## 6. Dragon Breath

URL: https://runescape.wiki/w/Dragon_Breath

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 7.2 s (12 ticks). **Duration**: instant. **Channelled**: no. **During GCD**: no. Level 19 Magic. Target: Area. Equipment: Any.
- Tooltip: "Breathe a mighty cloud of fire. * 110-130% Magic damage to the target and up to 4 in a cone in the attack direction. * Deals 1.25x damage to Combusted enemies. * Generates 9% Adrenaline."
- Body: "the player hits the primary target and up to 3 additional targets in a 3x3 square centred on the target, and on a straight line between the player and the target, for 110-130% [[ability damage]]." (tooltip says "up to 4"; CSM says "up to 4 additional enemies between you and the target or around the target" — treat as up to 4 additional, per tooltip/CSM.) "Additional targets hit by this ability will become aggressive towards the player. Dragon Breath will also deal 1.25x increased damage to targets currently affected by [[Combust]]."
- **RESOURCES**: +9% adrenaline. Consumes **Anima Charged** -> "Deals 260%-310% Magic damage" instead of 110-130% (Runic Charge tooltip / Anima Charged page: "Causes [[Dragon Breath]] to deal 260%-310% damage rather than 110%-130%").
- **MODIFIES OTHER ABILITIES**: Combust — only via Kerapac's wrist wraps: "upon using the ability, the player is given a six-second invisible self-buff that allows [[Combust]] to deal 25% more damage" (Enhanced + enchantment of flames: 40%) and Combust "will immediately apply all ten hits onto the target" (Combust page). Without the wraps: no effect on Combust.
- **IS MODIFIED BY**: Combust status on target -> 1.25x. Anima Charged -> 260-310%. Dragon Rider amulet: "this ability's damage will be increased by 1.1×, and it will have a 10% chance to burn the opponent with a shortened version of [[Combust]] that does 10% of Dragon Breath's minimum damage three times (i.e. 3 hits of 11% [[ability damage]]). If the target is already combusted, the damage multipliers are added together for a total damage multiplier of 1.35×." Sunshine 1.5x. Blast Infused +8% (basic). Concentrated Blast crit buff. Chain: NOT copied — "Dragon Breath — No / No" and "Area of effect attacks like [[Dragon Breath]] do not work" (Greater Chain page); AoE abilities "are not affected by Greater Chain, nor do they consume its effect".
- **REQUIREMENTS**: none. "No longer disables the target's protection prayers." (2 March 2026).
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: none by default (Dragon Rider amulet adds a 3.6 s Combust-type burn "Stacks with the Combust ability", per Combust (status) page).
- **CHANNEL**: n/a.
- **OTHER**: "Dragonbreath will now prioritise your main target before performing the usual AoE." "The damage is not affected by a target's use of a [[dragonfire]] protection."

---

## 7. Impact

URL: https://runescape.wiki/w/Impact

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 15 s (25 ticks) per charge. **Duration**: stun+bind 3 ticks (1.8 s). **Channelled**: no. **During GCD**: no. Level 31 Magic. Target: Single. Equipment: Any.
- Tooltip: "Smash the target with a burst of earth energy. * 65%-75% Magic damage. * Stuns and Binds the target for 3 ticks. * (With Scare Tactics enabled) Knocks back the target by 1 tile. * Generates 9% Adrenaline. (With at least level 54 Magic) Maximum charges: 2. (After reading Scare Tactics) Customisation options available."
- Body: "Impact stuns and binds the target for 1.8 seconds and deals 65-75% [[ability damage]]." "This ability starts with one charge with a 15 second cooldown at level 31 Magic and unlocks a second charge at level 54 Magic." Update: "Second charge at 54 Magic replacing Deep Impact." "Stun time: 1.2s → 1.8s."
  (CSM table says "Second charge unlocked at 70 Magic" — conflicts with the ability page/Stun page (54). Use 54; flag as ambiguity.)
- **RESOURCES**: +9% adrenaline. Two charges (like Double Surge: independent cooldowns, one visible).
- **MODIFIES OTHER ABILITIES**: none in magic (the old Wrack/Deep Impact stun synergy is gone — Wrack removed). Stun state matters for nothing in the current magic kit.
- **IS MODIFIED BY**: Flanking perk (tooltip "Invention perk: Flanking (rank [number])"; Greater Chain page: "secondary targets not facing the player will take increased damage and not be stunned/bound"). Sunshine 1.5x, Blast Infused, crit buffs. Greater Chain: "Impact — Yes / Yes" (damage and stun/bind copied: "they will still be stunned and bound by one-hit stuns such as [[Impact]]").
- **REQUIREMENTS**: none. Target must not be stun-immune for the stun to apply (Stun page: "Certain monsters, including most bosses, are capable of being immune to stuns, possessing the Stun Immune status").
- **SHARED COOLDOWNS**: none (Surge: "Players can now use the Surge ability after using the Impact ability.").
- **GREATER version**: none. Deep Impact removed: "Deep Impact was a threshold Magic ability available before the Combat Style Modernisation update".
- **BUFFS/DEBUFFS**: Stunned + Bound on target, 1.8 s; removed by Freedom ("Freedom removes and prevents further stuns and binds for another six seconds"); Anticipation prevents. Knockback 1 tile if Scare Tactics toggled on ("Toggle: Scare Tactics" right-click option).
- **CHANNEL**: n/a.

---

## 8. Combust

URL: https://runescape.wiki/w/Combust ; status: https://runescape.wiki/w/Combust_(status)

- **Type**: Basic (burn / DoT). **Adrenaline**: +9%. **Cooldown**: 18 s (30 ticks). **Duration**: 10 hits every 3 ticks = 30 ticks (18 s). **Channelled**: no (DoT cannot be cancelled by the caster). **During GCD**: no. Level 38 Magic. Target: Single. Equipment: Any.
- Tooltip: "Explode the target, causing them to burn. * 27%-33% Magic damage per hit every 3 ticks. * 10 hits. * Damage over time. * Generates 9% Adrenaline."
- Body: "When activated the target takes damage over eighteen seconds, dealing ten hits that total to 270–330% of active spell damage. The percentage is decided on the first hit, and each subsequent hit will deal the same damage as the first." Update: "No longer deals increased damage when the target moves." Status page: "Deals 27%-33% ability damage every 1.8 seconds (maximum of 5 hits)" (stale "5 hits" — update history on same page says "5 hits → 10 hits") and "Causes Dragon Breath to deal 1.25× damage"; "duration = Combust: 18 seconds"; "Removed upon activating [[Freedom]] or eating [[numbing root]]".
- **RESOURCES**: +9% adrenaline. Applies the Combust debuff (target). Generates Essence Corruption stacks per bleed hit only with Roar of Awakening/Ode to Deceit.
- **MODIFIES OTHER ABILITIES**: Dragon Breath deals 1.25x to Combusted targets (condition: Combust status active on the target at hit time).
- **IS MODIFIED BY** (all multiplicative): Dragon Breath + Kerapac's wrist wraps ("The player's next Combust within 6 seconds of using the [[Dragon Breath]] ability deals 25% increased damage and deal all of their hitsplats immediately."; enchantment of flames: 40%; "Combust can be used before Dragon Breath while wearing the wraps, but doing so this way will only apply the instant hit and damage bonus to the remaining hits that were not applied yet. This effect does not work in PvP."). Soulfire/Conflagrate: "The player's next Combust within 15 seconds deals 40% increased damage." Song of Destruction: "With at least 1 Essence Corruption stack - Damage-over-time abilities have a 30% chance to deal all of their hitsplats immediately and remove their cooldown." / "With 2 items equipped - Damage-over-time abilities deal 30% increased damage." Lunging: "Increases the base damage of this ability by 10% + an additional 3% per rank, up to +22% at rank 4." Blast Infused: "increases the base damage of basic Magic abilities by +8%." Blood Tithe: "Increases basic ability base damage by +1% per stack. Meaning this damage increase now affects Combust." (CSM). Vulnerability (yes, DoT list). **NOT** modified by: Sunshine ("Damage of magic ability bleeds such as [[Combust]] or [[Corruption Blast]] are not increased."), crits, prayers, Precise/Ruthless etc. (see 0.4). Greater Chain: "Combust — Yes (damage) / Yes (effects)" with footnote "damage-over-time hits are unaffected by the 50% damage reduction to secondary targets, and will deal their normal damage range."
- **REQUIREMENTS**: none.
- **SHARED COOLDOWNS**: none currently (2018 "Frag Shot and Combust now share a cooldown" — Fragmentation Shot was removed from players: "Players are no longer able to use this ability").
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: Combust (target) 18 s, `stacks = No`; re-application refreshes (generic DoT rule: "Applying the same effect will only refresh the effect and maintain the same maximum duration"). Removed by Freedom / numbing root.
- **CHANNEL**: n/a.
- **OTHER**: Sunshine DoT and Combust are independent. Incite Fear: DoT abilities "will only apply one stack".

---

## 9. Chain

URL: https://runescape.wiki/w/Chain

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 10.2 s (17 ticks). **Duration**: Chain effect on target 10 ticks (6 s). **Channelled**: no. **During GCD**: no. Level 51 Magic. Target: Multi. Equipment: Any.
- Tooltip: "A magical spell that chains between nearby targets. * 70-90% Magic damage to the target and up to 2 additional targets within 5 tiles of the target. * Your next Single-target Magic ability against the target within 10 ticks will also target the additional enemies, dealing 30% damage. * Generates 9% Adrenaline."
- Body: "It can hit secondary targets beyond the normal attack range but cannot hit secondary targets beyond straight line-of-sight. Additional targets hit by this ability will become aggressive towards the player. After using Chain, the next magic ability activated within 6 seconds will also deal damage to the secondary targets of Chain at 30% effectiveness." "The [[Caroming]] perk will increase the effectiveness of the next magic ability to secondary targets by 5% + 5% per rank, for a total effect of 10%–25%." CSM: "Caroming perk: Copied abilities deal +(0.05 × (rank + 1)) damage (i.e., rank 4 deals 0.55× damage)"; "Caroming perk no longer increases the number of targets".
- **RESOURCES**: +9% adrenaline. Applies "Chain (status)" to the primary target (`buff=Chain (status)`), 10 ticks.
- **MODIFIES OTHER ABILITIES**: the next single-target Magic ability used on the primary target within 10 ticks is copied to the secondary targets at 0.3x damage (0.55x with Caroming 4). The copy mechanics are documented on the Greater Chain page and apply equally (Chain now "includes the previous Greater Chain effect by default"). See section 10 for the per-ability table.
- **IS MODIFIED BY**: Sunshine, Blast Infused, crit buffs, Vulnerability. Greater Chain page: "'''Greater Chain''' — No / No" with footnote "If Greater Chain is used while another one by the same player is in effect, the previous Greater Chain's effects are overridden. This includes if Greater Chain was used on a different target, the previous target of Greater Chain loses its effects."
- **REQUIREMENTS**: none ("The next ability activated whilst using magic weapons" — Greater Chain page implies a magic weapon must be wielded for the copy).
- **SHARED COOLDOWNS**: none.
- **GREATER version**: Greater Chain (section 10) replaces it ("replacing the former ability").
- **BUFFS/DEBUFFS**: Chain (status) on primary target, 6 s; overridden by a new Chain cast; consumed by the next single-target magic ability. Not a stun/DoT, so Freedom irrelevant (not listed).
- **CHANNEL**: n/a.
- **OTHER**: "[[Ricochet]] is the [[Ranged]] equivalent of Chain. However, Ricochet goes on to hit other targets when the first hit misses, while Chain does not." "Resolved an issue with Chain not working as intended in multi-way PvP." (9 March 2026). "Chain projectile timings have been sped up." (7 April 2026).

---

## 10. Greater Chain

URL: https://runescape.wiki/w/Greater_Chain

- **Type**: Basic. **Adrenaline**: +9%. **Cooldown**: 10.2 s (17 ticks). **Duration**: effect 10 ticks (6 s). **Channelled**: no. **During GCD**: no. Level 51 Magic; members; codex.
- Tooltip: "A magical spell that chains between nearby targets. * 80-100% Magic damage to the target and up to 6 additional enemies within 5 tiles of the target. * Your next Single-target Magic ability against the target within 10 ticks will also target the additional enemies, dealing 50% damage. * Generates 9% Adrenaline. (With Caroming perk) Invention perk: Caroming (rank [number])."
- **Differences from Chain**: 80-100% vs 70-90%; up to 6 vs 2 secondaries; copy at 0.5x vs 0.3x (Caroming 4: 0.75x vs 0.55x). "In comparison, Chain only hits 70-90% to a primary and up to two nearby targets, with only 30% of the next ability's damage being passed on." Replaces Chain (both cannot be on the bar).
- **Copy mechanics** (verbatim, section "Mechanics"):
  > "Single target abilities with additional effects such as: damage over time, binding/stunning the target, or a channelled ability with multiple hits will be passed over to the secondary targets hit by Greater Chain for as long as the Greater Chain effect is active. Area of effect attacks like [[Dragon Breath]] do not work."
  > "* Secondary targets with the Greater Chain effect do not need to be in view of the player to receive damage.
  > * If the Greater Chain effect ends before a channelled ability is finished, the channelled ability will stop hitting the secondary targets and only hit the primary target.
  > * If the primary target dies, the secondary targets will not take any additional damage from Greater Chain as the damage has to be inflicted on the primary target.
  > ** Likewise, channelled stun abilities like [[Asphyxiate]] will not stun or bind secondary targets affected by Greater Chain, although they will still be stunned and bound by one-hit stuns such as [[Impact]].
  > * The damage dealt to secondary targets will not be affected by the hitcap of the remaining health of the primary target. ...
  > * Abilities that confer stacks, like [[Combust]] when paired with the [[Song of Destruction]] set, will generate stacks for each enemy hit, up to the maximum stack cap of that buff."
  > "Area-of-effect abilities and special attacks are not affected by Greater Chain, nor do they consume its effect. It is currently unknown if this is the intended behaviour or not."
  > "If using switches, Caroming needs to be equipped when casting Great Chain and the effect will persist even if Caroming is switched out for the follow up ability."
- **Per-ability copy table** (Ability — damage passes? / effects pass?): Greater Chain — No/No; Magma Tempest — No/No ("Magma Tempest does not work with Greater Chain's effects due to technical difficulties."); Dragon Breath — No/No; Concentrated Blast — Yes/No (footnote: "The critical hit chance increase from Concentrated Blast and its Greater variant do not scale to number of targets hit, but the player will still have an increased critical hit chance on secondary targets."); Greater Concentrated Blast — Yes/No; Sonic Wave — Yes/Yes; Greater Sonic Wave — Yes/Yes; Combust — Yes (DoT hits "unaffected by the 50% damage reduction") / Yes; Corruption Blast — No/No; Impact — Yes/Yes; Asphyxiate — Yes/No; Smoke Tendrils — Yes/Yes (footnote: "Smoke Tendrils and Onslaught's recoil damage is multiplied by the number of targets with Greater Chains' effect."); Tsunami — No/No; Omnipower — Yes/Yes ("Additional hits from Wild Magic and Omnipower abilities now hit nearby targets when combined with the Greater Chain ability." — so Wild Magic copies too); Instability (FSOA spec) — Yes/No; Soulfire — Yes/Yes.
- Niche: "[[Vulnerability]] and other debuff spells do not apply to secondary targets under the Greater Chain effect, nor does it consume the Greater Chain effect." "Secondary targets already debuffed with Vulnerability/[[Smoke Cloud]] will take increased damage from Greater Chain." "In PvP situations, Greater Chain is only applied to secondary targets whilst in Multicombat areas." "Tsunami may be used in conjunction with Greater Chain to increase adrenaline gain via critical hits".
- "Fixed an issue where Greater Chain could copy more than one ability if that ability was a special attack or channelled." (2022) -> exactly one ability is copied, then the effect is consumed.
- Everything else as Chain.

---

## 11. Concentrated Blast

URL: https://runescape.wiki/w/Concentrated_Blast

- **Type**: Basic, channelled. **Adrenaline**: +9%. **Cooldown**: 5.4 s (9 ticks). **Duration**: 3 hits over 3 ticks (fits in one GCD: "now fits into one global cooldown"). **Channelled**: YES. **During GCD**: no. Level 66 Magic. Target: Single. Equipment: Any.
- Tooltip: "Blast the target with beams of concentrated energy. * Attack 3 times over 3 ticks. * 30-40% Magic damage per hit. * Channelled. * Each attack increases the Critical Strike Chance of your next magic attack by 5%, stacking to a maximum of 15%. * Generates 9% Adrenaline."
- Body: "Each beam increases the next attack's chance to force a critical hit by 5% per strike, up to a maximum of 15%. Concentrated Blast, in addition to affecting the next ability, will also affect itself. This means the second beam will receive a +5% critical hit chance and the third beam will receive a +10% critical hit chance. As it is a channelled ability, movement will cancel it immediately. Swapping one's main hand weapon will remove the critical hit chance buff toward the next attack."
- 2 March 2026: "Critical strike chance now applies to the next ability, not the next hit (i.e. multi-hit abilities will benefit on all hits)." Patch Notes 2: "Example: Both hits of ''Wild Magic'' benefit." "Damage no longer increases with each hit" (all three hits 30-40%).
- Anima Charged: "When empowered by [[Runic Charge]], each hit has an additional 10% critical strike chance, meaning the second hit will have +15% critical strike chance, the third hit will have +30% critical strike chance, and the next ability will have +45% critical strike chance." (i.e. +15% per hit, max +45%.)
- **RESOURCES**: +9% adrenaline (once per cast, on activation). Builds the "Concentrated Blast" self-buff (+5% crit chance per hit, max 15%; +15%/hit, max 45% when Anima Charged). Consumes Anima Charged. Incite Fear: "Channelled abilities (Asphyxiate, Smoke Tendrils, Concentrated Blast) can apply multiple stacks" of Glacial Embrace.
- **MODIFIES OTHER ABILITIES**: the next Magic attack/ability (all hits of it) gets +crit chance equal to the accumulated stacks. Buff is consumed by that next magic ability. Lost on main-hand weapon swap.
- **IS MODIFIED BY**: Anima Charged; Sunshine 1.5x; Blast Infused +8%; channeller's ring "+4% per hit" stacking crit chance for channelled hits; enchantment of metaphysics +2.5% crit damage per hit. Greater Chain: damage copied, crit-buff effect not scaled.
- **REQUIREMENTS**: none (weapon type restriction removed 22 July 2024).
- **SHARED COOLDOWNS**: none ("No longer shares cooldown with [Greater] Sonic Wave").
- **GREATER version**: Greater Concentrated Blast (section 12), replaces it; "On free to play worlds this ability reverts back to [[Concentrated Blast]]."
- **BUFFS/DEBUFFS**: "Concentrated Blast" self buff (crit chance stacks). Duration not stated on the wiki; consumed by the next magic attack; removed on main-hand swap.
- **CHANNEL**: 3 hits on consecutive ticks (ticks 1, 2, 3 after cast — "Attack 3 times over 3 ticks"). Movement cancels immediately. Pressing another ability cancels the remaining beams (generic channel rule: "able to be cancelled by performing another ability") — but since the channel equals one GCD, a following ability cannot normally be cast before the third beam unless it is GCD-free (Surge/Runic Charge — Surge would move you and cancel). Abilities can be queued during the channel.
- **OTHER**: crit message "You deal a critical strike against your opponent!".

---

## 12. Greater Concentrated Blast

URL: https://runescape.wiki/w/Greater_Concentrated_Blast

- **Type**: Basic, channelled. **Adrenaline**: +9%. **Cooldown**: 5.4 s (9 ticks). **Duration**: 3 hits over 3 ticks. **Channelled**: YES. Level 66 Magic; members; codex.
- Tooltip: "Blast the target with beams of concentrated energy. * Attack 3 times over 3 ticks. * 40-50% Magic damage per hit. * Channelled. * Each attack increases the Critical Strike Chance of your next Magic attack by 7%, stacking to a maximum of 21%. * Generates 9% Adrenaline."
- Body: "the bonus is increased from 5% per strike to 7% per strike, up to a maximum of 21%. ... If the player switches weapons immediately after casting Greater Concentrated Blast, the +21% critical hit chance from the third hit will be lost." "the second beam will receive a +7% critical hit chance and the third beam will receive a +14% critical hit chance." "When empowered by [[Runic Charge]], each hit has an additional 10% critical strike chance, meaning the second hit will have +17% critical strike chance, the third hit will have +34% critical strike chance, and the next ability will have +51% critical strike chance."
- **Differences from Concentrated Blast**: 40-50% vs 30-40% per hit; +7%/hit (max 21%) vs +5%/hit (max 15%); Anima Charged: +17%/hit (max 51%) vs +15%/hit (max 45%). Same cooldown/duration/adrenaline. Replaces the base ability.
- Everything else identical to section 11.

---

## 13. Wild Magic

URL: https://runescape.wiki/w/Wild_Magic

- **Type**: Enhanced. **Adrenaline**: -25%. **Cooldown**: 5.4 s (9 ticks). **Duration**: instant (2 hits). **Channelled**: no. **During GCD**: no. Level 3 Magic. Target: Single. Equipment: Any.
- Tooltip: "Fire an unpredictable double magical attack at the target. * 125-155% Magic damage per hit. * 2 hits. * Each hit has +10% Critical Strike Chance and +20% Critical Strike Damage."
- Body: "Wild Magic fires two magical attacks at the target, each dealing 125-155% [[ability damage]], or 250-310% (280% average) in total. It also has +10% [[critical strike]] chance and +20% critical strike damage. At the default of 10% critical strike chance and 50% critical strike damage (at level 90+ Magic), this results in an average of 319.2% ability damage." "Using Wild Magic with the [[blast diffusion boots]] equipped grants the [[Blast Infused]] buff for 10 ticks, causing [[basic abilities]] to deal +8% base damage for its duration."
- Hit timing: "Once again both hits are dealt the same time." (2015). Trivia: "When used with a staff of any kind, Wild Magic will land one tick faster."
- **RESOURCES**: consumes 25% adrenaline (reduced by Flow/Greater Flow: -10/-20%, or -35/-45% with Anima-charged Flow; consumes Flow). Does not generate adrenaline (enhanced). Applies Blast Infused only with blast diffusion boots.
- **MODIFIES OTHER ABILITIES**: with blast diffusion boots: Blast Infused (6 s) "Basic Magic abilities gain +8% base damage" (affects Combust, Dragon Breath, Sonic Wave, Conc Blast, Chain, Impact, Magic basic attack).
- **IS MODIFIED BY**: Flow (cost). Concentrated Blast crit buff ("Both hits of Wild Magic benefit"). Channelled Might (+15% crit dmg). Sunshine 1.5x. Tsunami buff (each crit +8% adr). Greater Chain: "Additional hits from Wild Magic and Omnipower abilities now hit nearby targets when combined with the Greater Chain ability." Not affected by Blast Infused (not a basic).
- **REQUIREMENTS**: >= 25% adrenaline (after cost reductions; the wiki doesn't state whether Flow reduces the requirement — Incite Fear page for Tsunami says "Both the adrenaline cost and requirement of Tsunami are reduced" for Glacial Embrace, but for Flow only "cost" is stated).
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: Blast Infused (self, 6 s / 10 ticks, `stacks = No`) only with the boots.
- **CHANNEL**: n/a.
- **OTHER**: Patch Notes 2: "Wild Magic is magic's signature spender. Lowering the cooldown allows it to remove some reliance on special attacks, and lets it interact more frequently with Sonic Wave."

---

## 14. Asphyxiate

URL: https://runescape.wiki/w/Asphyxiate ; buff: https://runescape.wiki/w/Channelled_Might

- **Type**: Enhanced, channelled. **Adrenaline**: -25%. **Cooldown**: 20.4 s (34 ticks). **Duration**: "Attack 4 times over 7 ticks" (tooltip); body: "The ability deals one hit every 1.2 seconds and lasts for 4.2 seconds."; CSM: "4 hits of 120-140% magic ability damage, every 2 ticks (channelled)". **Channelled**: YES. **During GCD**: no. Level 59 Magic. Target: Single. Equipment: Any.
- Tooltip: "Reach out with magical force and choke the target. * Attack 4 times over 7 ticks. * 120%-140% Magic damage per hit. * Channelled. * Stuns and Binds the target for 6 ticks. * Completing the channel applies Channelled Might to self for 6 ticks. Channelled Might * Your Magic attacks gain +15% Critical Strike Damage."
- Body: "Each successful hit momentarily [[stuns]] the target". "Fully channelling Asphyxiate applies the Channelled Might buff to the player for 3.6 seconds, which increases [[critical strike]] damage by +15%."
- Stun page detail: "Channelled ability that hits 4 times, once every 1.2 seconds. The first 3 hits stun for 1.2 seconds each. The 1st hit is guaranteed to stun even if it misses. The 4th hit binds for 1.2 seconds. If channelling is cancelled, the target is still bound for 1.2 seconds." Bind page: Asphyxiate bind 3.6 s.
- Tumeken's resplendence (4+ pieces): "Attack 8 times over 8 ticks. * 72%-84% Magic damage per hit." "it will deal 8 hits instead of 4 at 40% reduced damage per hit, for 20% increased damage overall." 5 pieces: Channelled Might "3.6 seconds to 9 seconds, and buff strength ... +15% ... to +35%". Tumeken page: "8 hits over 4.8 seconds, or 1 tick between hits".
- Channelled Might page: "trigger = Casting [[Asphyxiate]] for its full duration. duration = 3.6 seconds (9 seconds with 5 Tumeken) effects = Increases critical strike damage by 15% (35%)"; `stacks = No`.
- **RESOURCES**: -25% adrenaline (Flow applies, consumed). Grants Channelled Might only on full channel. Incite Fear: multiple Glacial Embrace stacks (one per hit).
- **MODIFIES OTHER ABILITIES**: Channelled Might: +15% crit damage to Magic attacks for 6 ticks after the channel ends (≈ next 2 abilities; "This allows the player to use three standard abilities, or two channeled abilities" for the 9 s version).
- **IS MODIFIED BY**: Flow (cost). Concentrated Blast crit buff (applies to all 4 hits — "next ability"). Sunshine 1.5x. Tsunami buff. Channeller's ring (+4% crit chance stacking per hit) / metaphysics. Greater Chain: damage copied, stun not ("channelled stun abilities like Asphyxiate will not stun or bind secondary targets").
- **REQUIREMENTS**: >= 25% adrenaline; target in range; stun-immune targets take damage but no stun.
- **SHARED COOLDOWNS**: none ("The Hurricane ability will no longer put Asphyxiate on cooldown incorrectly.").
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: Stunned (target) 1.2 s per hit for hits 1-3, Bound 1.2 s from hit 4; total 3.6 s; removed by Freedom / prevented by Anticipation (PvP: "Use [[Anticipation]] before using this ability to avoid getting stunned"). Channelled Might (self) 3.6 s, no stacks.
- **CHANNEL**: 4 hits, one every 2 ticks (ticks 1,3,5,7 -> "over 7 ticks"); channel lasts 4.2 s = 7 ticks, longer than the GCD, so another ability CAN be pressed after 3 ticks and will cancel the channel (losing remaining hits and the Channelled Might buff). Movement cancels. Being stunned cancels. Target moving out of range cancels ("use Freedom then run outside the range of your opponent, cancelling the remaining duration"). Tumeken: 8 hits on consecutive ticks over 8 ticks.
- **OTHER**: 9 March 2026 Tumeken variant nerf "82.5%–97.5% → 71.5%–84.5%" (page also lists "72%-84%"; CSM lists "72-84%"). Pre-CSM Asphyxiate had no self buff.

---

## 15. Corruption Blast

URL: https://runescape.wiki/w/Corruption_Blast ; status: Corruption Blast (status)

- **Type**: Enhanced (DoT). **Adrenaline**: -20%. **Cooldown**: 15 s (25 ticks). **Duration**: 5 hits every 2 ticks (first hit on cast, then 4 more) = 8-10 ticks. **Channelled**: no (DoT). **During GCD**: no. Level 70 Magic; members. Target: Multi. Equipment: Any.
- Tooltip: "Blasts the target with corruption, causing them to take damage over time. * 90-110% Magic damage per hit every 2 ticks. * 5 hits. * Damage over time. * Damage is reduced by 20% of initial damage with each hit and will spread to enemies within 2 tiles."
- Mechanics: "The first hit of Corruption Blast applies a debuff to the target and deals anywhere from 90-110% ability damage. Each subsequent hit will deal less damage, decreasing by 20% of the initial hit. For example, if the initial hit is 1,080, the five damage-over-time hits will be: 1080, 864, 648, 432, and 216. This means that the ability does 270-330% ability damage over five hits. In player-versus-monster situations, each hit will spread to all adjacent targets in a 5x5 area centred around the target with the debuff. ... each hit will damage every target for the same base damage; e.g. if the initial hit on a target A is 1,080, the first hit when it spreads to a target B will be 864 ... In total, B will take 4 hits. ... The corruption can never spread back to a target that already had it."
- CSM: "Initial hit of 90-110% magic ability damage to target (bleed/burn) * 4 more hits (every 2 ticks), dealing 0.8×, 0.6×, 0.4×, and 0.2× of initial hit * Each additional hit can spread to nearby enemies".
- **RESOURCES**: -20% adrenaline (Flow applies). No adrenaline generated. Essence Corruption stacks only with RoA/OtD.
- **MODIFIES OTHER ABILITIES**: none. "The corruption can be used together with other damage over time abilities without overriding their effects, including Corruption Shot."
- **IS MODIFIED BY**: DoT rules (0.4): Vulnerability yes; Sunshine NO ("Damage of magic ability bleeds such as Combust or Corruption Blast are not increased."); crits NO. Song of Destruction (+30%, 30% instant). Greater Chain: "Corruption Blast — No / No". Not a burn, so burn-equipment doesn't apply.
- **REQUIREMENTS**: >= 20% adrenaline.
- **SHARED COOLDOWNS**: "Corruption Blast shares its cooldown timer with [[Corruption Shot]]." (Ranged ability.)
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: Corruption Blast (status) on each affected target; Freedom: "[[Freedom]] can be used to clear the corruption effect; however, it will still have a brief moment to spread. If targets are still adjacent to the player who used freedom when the attack is cleared, it can spread to applicable targets."
- **CHANNEL**: n/a.
- **OTHER**: "Secondary targets hit by the Corruption Blast ability are now aggressive towards the player." PvP: spreads only to players in combat with the caster in multi-combat.

---

## 16. Smoke Tendrils

URL: https://runescape.wiki/w/Smoke_Tendrils

- **Type**: Enhanced, channelled. **Adrenaline**: 0 (no cost, no gain). **Cooldown**: 45 s (75 ticks). **Duration**: 4 hits every 2 ticks over 4.2 s (7 ticks). **Channelled**: YES. **During GCD**: no. Level 75 Magic; members (Codex Ultimatus). Target: Single. Equipment: Any.
- Tooltip: "Tendrils of smoke whip at the target's feet. * 55-65% Magic damage per hit every 2 ticks. * Deals an additional (10%-15% Magic damage) with each hit. * 35-40% damage to self per hit. * 4 hits. * Channelled. Guaranteed to critically strike."
- Body: "When used, the player is bound in place (as with [[Shadow Tendrils]]) and performs four attacks in a span of 4.2 seconds, which deal 280-350% [[ability damage]] to the target and 140-160% ability damage back at the player. This rebounded damage is unaffected by damage-modifying effects. * The first hit deals 55-65% ability damage * The second hit deals 65-80% ability damage * The third hit deals 75-95% ability damage * The fourth and final hit deals 85-110% ability damage * The user is hit 4 times for 35-40% ability damage. The self-damage is not increased with each hit, or by the critical strike modifier, and is not tied to the hits to the target - it is essentially 4 separate damage rolls." "Smoke Tendrils is guaranteed to critically strike, so all 4 hits are multiplied by the user's critical strike damage modifier. The effective damage range at level 90+ Magic (1.5x modifier) is thus 420-525%."
- **RESOURCES**: none (0 adrenaline). Incite Fear: multiple Glacial Embrace stacks (channelled). Tsunami buff: each of the 4 guaranteed crits gives +8% adrenaline ("It will no longer give adrenaline twice per hit when affected by the Tsunami ability."), i.e. up to +32% (or +64% with Natural Instinct).
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Channelled Might (+crit damage), FSOA passive, Wild-Magic-style crit-damage modifiers; Sunshine 1.5x; Precise/Equilibrium ("It will be affected by both the Precise and Equilibrium invention perks."); Instability (each crit fires a Lightning Surge). Concentrated Blast crit chance is irrelevant (already 100%). Greater Chain: "Smoke Tendrils — Yes / Yes", recoil "multiplied by the number of targets with Greater Chains' effect". Self-damage: "unaffected by damage-modifying effects".
- **REQUIREMENTS**: none besides unlock. Whether it consumes Flow: not stated (cost is 0). 
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: none on target; caster is "bound in place" for the channel.
- **CHANNEL**: 4 hits at ticks 1,3,5,7 ("every 2 ticks", "span of 4.2 seconds"). Longer than the GCD -> pressing another ability after 3 ticks cancels the remaining hits (and their self-damage). Movement cancels. Target may move: "Smoke Tendrils no longer require the target to stay still." Boss note: Kalphite King's Immortality is no longer triggered by Smoke Tendrils (PN2).
- **OTHER**: "pairs very well with [[Tsunami]]'s critical strike adrenaline buff, especially when used with the [[Incite Fear]] spell and the fractured Staff of Armadyl's special attack, Instability."

---

## 17. Magma Tempest (and Magma Tempest (Targeted))

URLs: https://runescape.wiki/w/Magma_Tempest , https://runescape.wiki/w/Magma_Tempest_(Targeted)

- **Type**: Enhanced. **Adrenaline**: -20%. **Cooldown**: 21 s (35 ticks). **Duration**: 8 hits every 2 ticks over 16 ticks. **Channelled**: no (persistent area, not cancellable by the caster acting; it is not a DoT either). **During GCD**: no. Level 85 Magic (CSM table says 66 — page/infobox say "66 → 85"; use 85); members; codex. Target: Area. Equipment: Any.
- Tooltip: "Create a storm of fire and earth around the target. * Creates a 5x5 area at the target location. * 35-45% Magic damage per hit every 2 ticks to up to 25 enemies inside the area. * 8 hits. Cannot critically strike."
- Body: "The attack is a 5x5 area-of-effect that hits every 2 ticks over 16 ticks for a total of 8 hits and can hit up to 25 targets at a time. Each hit deals 35-45% ability damage, but cannot [[critical strike|critically strike]]. The damage stops if the player does not have a main-hand magic weapon equipped and will also stop if the target goes out of sight, such as by being behind a blocking obstacle, or leaves the area. The ability continues to damage even when the targets are out of range but can still "see" each other, although the cast [[attack range|range]] for the ability is still 8 squares. This ability shares a [[cooldown]] with its targeted version." "Damage from this ability is not considered as [[damage over time]]."
- Targeted version: "it can target location that does not have any targets (hence it can be used without a target), but it does not allow [[ability queueing]] and it is not triggered by [[Revolution]]." "It is possible to cast this ability outside of combat." 7 April 2026: "'Toggle: Target Mode' option added to switch between the targeted and untargeted versions of this ability."
- **RESOURCES**: -20% adrenaline (Flow applies, consumed — it is an adrenaline-costing magic ability). No gain.
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Sunshine — not a DoT, so the generic "Sunshine multiplies magic attacks" applies (the wiki does not explicitly exclude it; only Combust/Corruption Blast/Onslaught are excluded). Cannot crit (so Conc Blast / Tsunami / Channelled Might irrelevant). Greater Chain: "Magma Tempest — No / No". Vulnerability yes.
- **REQUIREMENTS**: >= 20% adrenaline; main-hand magic weapon must stay equipped for the damage to continue.
- **SHARED COOLDOWNS**: "shares a cooldown with its targeted version" (both directions).
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: none.
- **CHANNEL**: n/a (persistent area; the caster may act freely).
- **OTHER**: Incite Fear stack behaviour not explicitly listed (multi-hit non-channelled -> presumably one stack).

---

## 18. Omnipower

URL: https://runescape.wiki/w/Omnipower

- **Type**: Ultimate. **Adrenaline**: -60%. **Cooldown**: 30 s (50 ticks). **Duration**: instant. **Channelled**: no. **During GCD**: no. Level 12 Magic. Target: Single. Equipment: Any (igneous cape variant).
- Tooltip: "Bombard the target with each of the four elements. * 420-500% Magic damage. Damage is 60% effective in PvP." Igneous: "* 120-150% Magic damage with each hit. * 4 hits."
- Body: "The bolstered Omnipower deals one hitsplat, which is followed by the next three on the next tick immediately after, which all deal damage simultaneously. This is a total of 480%–600% ability damage with an average of 540% ability damage." "Omnipower is affected by the [[Ultimatums]] perk, increasing its base damage by 3% +1% per rank to a maximum of a 7% damage increase."
- CSM: "Adrenaline cost and requirement reduced from 100% (no longer requires igneous cape)". PN2 equipment: "Igneous Kal-Ket / Kal-Mej / Kal-Xil / Kal-Mor * No longer reduce the adrenaline cost of their related abilities, as those abilities now have their adjusted costs by default."
- **RESOURCES**: -60% adrenaline (Flow applies: e.g. 50% with Flow, 25% with Anima-charged Greater Flow; ring of vigour / Conservation of Energy refund). No gain.
- **MODIFIES OTHER ABILITIES**: none. **Sunshine interaction: none found on the wiki** (no cooldown reduction, no cost change while Sunshine is active).
- **IS MODIFIED BY**: Flow/Greater Flow (cost); Sunshine 1.5x; Concentrated Blast crit buff (all 4 igneous hits); Channelled Might; Tsunami; Ultimatums; Greater Chain: "Omnipower — Yes / Yes" ("Additional hits from Wild Magic and Omnipower abilities now hit nearby targets when combined with the Greater Chain ability.").
- **REQUIREMENTS**: >= 60% adrenaline. "This ability can be cast even if the player does not have the Magic level to cast spells of all 4 elements".
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none (igneous cape variant is an equipment variant: 4 hits of 120-150%).
- **BUFFS/DEBUFFS**: none.
- **CHANNEL**: n/a. Igneous: hit 1 on impact tick, hits 2-4 on the following tick.

---

## 19. Sunshine

URL: https://runescape.wiki/w/Sunshine ; status: https://runescape.wiki/w/Sunshine_(status)

- **Type**: Ultimate. **Adrenaline**: -100%. **Cooldown**: 60 s (100 ticks). **Duration**: 50 ticks (30 s); "The damage buff provided from Sunshine begins 0.6 seconds after cast." Ability-queueing page: "regular (52 game ticks, buff duration: 1 tick after cast, 51 game ticks total)" — conflicting tick counts, see ambiguities. Planted Feet: 63 ticks (37.8 s), no DoT. **Channelled**: no. **During GCD**: no. Level 76 Magic; members; The World Wakes. Target: Single (self-centred area). Equipment: Any (2014: "The Sunshine ability now requires wielding a magic weapon.").
- Tooltip: "Summon a sunbeam to shine over your location. * Creates a 7x7 area at your location. * Magic attacks deal 1.5x damage while inside the area. * 10%-20% Magic damage per hit every 3 ticks to the target while it is inside the area. * 50 ticks duration."
- Body: "granting the player an increase of 50% to their magic damage while they are within the beam. ... A damage-over-time effect is applied to the primary target (at time of casting) if it enters the beam's AoE, dealing 10% to 20% of the player's ability damage every 1.8 seconds, for a total of 30.6 seconds. This damage-over-time is not influenced by Magic level or stats from other equipment." "The damage over time effect will only apply to the player's target at the time of cast, and only when the target is within the area of effect. No other targets will receive the damage-over-time effect in any circumstance." "While in combat, if your current target is out of range and still alive then Sunshine cannot be activated until the target comes within range, dies, a new target within range is selected, or combat status is dropped." "It is now possible to cast Death's Swiftness and Sunshine without a target." (2015)
- Exclusions: "Damage of magic ability bleeds such as [[Combust]] or [[Corruption Blast]] are not increased. [[Onslaught]] is also unaffected by Sunshine."
- Status page: "trigger = Standing within a self-activated Sunshine; duration = 30 seconds; 37.8 seconds if cast with Planted Feet; Removed upon leaving the area of effect; Reapplied upon re-entering the area of effect; effects = Increases magic damage by 50%".
- Planted Feet: "With the [[Planted Feet]] perk, Sunshine will last for 63 ticks, although its damage-over-time effect is removed." "This effect is not cancelled by switching weapon while Death's Swiftness or Sunshine are in effect".
- Duration table: no PF: "Entire duration 31.2s", "Damage buff duration 30.6s"; PF: "37.8s" / "37.2s".
- Ability queueing page: "Sunshine, Death's Swiftness, and greater variants: The issue with having a queued ability or a revolution ability trigger on the final tick ... does not apply." (buff applies on final tick regardless of trigger method).
- **RESOURCES**: -100% adrenaline (Flow: -10/-20/-35/-45%; ring of vigour / Conservation of Energy). No gain.
- **MODIFIES OTHER ABILITIES**: all magic attacks (abilities, basic attack, Frost Surge: "Frost Surge benefits from damage bonuses like [[Sunshine]]") deal 1.5x while the caster is inside the area. NOT: Combust, Corruption Blast, Onslaught, Smoke Tendrils self-damage ("unaffected by damage-modifying effects"), Sunshine's own DoT. Combust / Dragon Breath have **no special behaviour** under Sunshine (nothing on the wiki). Omnipower cooldown/cost under Sunshine: **nothing on the wiki**. Tumeken's 3-piece: "+1.5% critical strike chance per piece worn while inside [[Sunshine]]".
- **IS MODIFIED BY**: Flow (cost). Planted Feet (duration/DoT). Ultimatums affects "base damage of all ultimate abilities" — Sunshine's DoT is "not influenced by Magic level or stats" so likely unaffected (not stated). Sunshine's own DoT follows DoT rules (Vulnerability yes; not boosted by Sunshine).
- **REQUIREMENTS**: 100% adrenaline; target in range if in combat (see above); can be cast with no target. Cannot cast in someone else's area? — "Sunshine can now be triggered when standing in someone else's area effect. This prevents the damage-over-time effect from triggering in the area." (2013; allowed).
- **SHARED COOLDOWNS**: none now (Metamorphosis shared a cooldown; Metamorphosis was removed by CSM).
- **GREATER version**: Greater Sunshine (section 20) — "Sunshine can be permanently upgraded into [[Greater Sunshine]]" (replaces; both cannot be on the bar).
- **BUFFS/DEBUFFS**: Sunshine (self) 30 s — removed when leaving the 7x7 area, reapplied on re-entry (area persists for the full duration); Sunshine DoT on the primary target only while inside the area, 10-20% every 3 ticks (not on Freedom's removable list). Both not stackable (`stacks = No`).
- **CHANNEL**: n/a.
- **OTHER**: "Sunshine can bypass the fiery item requirement to damage [[ice strykewyrm]]s." "The actual area of the sunshine ability extends outside the visual effect".

---

## 20. Greater Sunshine

URL: https://runescape.wiki/w/Greater_Sunshine

- **Type**: Ultimate. **Adrenaline**: -100%. **Cooldown**: 60 s (100 ticks). **Duration**: 63 ticks (37.8 s) per tooltip/CSM; body: "the ability lasts 13 ticks longer for a total duration of 65 ticks (39 seconds) although the damage buff begins 1 tick after cast, lasting a total of 64 ticks (38.4 seconds)". CSM: "Tooltip corrected to state 37.8 seconds instead of 39. The ability always actually lasted for 37.8 seconds." Level 76 Magic; members; codex (Cywir components + Codex of lost knowledge).
- Tooltip: "Summon a sunbeam to shine over your location. * Creates a 7x7 area at your location. * Magic attacks deal 1.5x damage while inside the area. * 10-20 Magic damage per hit every 3 ticks to the target while it is inside the area. * 63 ticks duration."
- **Differences from Sunshine** (exact): duration 63 ticks vs 50 ticks; DoT runs the full duration ("dealing 10% to 20% of the player's ability damage every 1.8 seconds for a total of 39 seconds") vs 30.6 s; same 1.5x, same cooldown, same cost. Planted Feet: "Greater Sunshine does not benefit from the [[Planted Feet]] perk although activating Greater Sunshine with Planted Feet removes the damage-dealing effect of the ability" (no extension, DoT removed). Replaces Sunshine.
- Everything else as Sunshine (sections 19). Tumeken's crit bonus "while inside Sunshine" presumably includes Greater Sunshine (not explicitly stated).

---

## 21. Tsunami

URL: https://runescape.wiki/w/Tsunami

- **Type**: Ultimate. **Adrenaline**: -100% (reducible to 40% via Glacial Embrace; further to ~20% with ring of vigour + Conservation of Energy). **Cooldown**: 60 s (100 ticks). **Duration**: buff 50 ticks (30.6 s; "despite the tooltip stating 30 seconds"). **Channelled**: no. **During GCD**: no. Level 90 Magic. Target: Area. Equipment: Any.
- Tooltip: "Summon forth a destructive wall of water. * 225-275% Magic damage to the target and up to 8 additional enemies within 4 tiles in the attack direction. * Critical Strikes generate an additional 8% Adrenaline for 50 ticks."
- Body: "the player gains 8% additional [[adrenaline]] for each Magic [[critical hit|critical strike]] they perform in the next 30.6 seconds ... If [[Natural Instinct]] is active, each Magic critical strike will give 16% adrenaline instead. Critical strikes from Tsunami itself grant 8% adrenaline. ... The buff will only be granted if Tsunami deals damage, including hits on a damage-immune target." "Tsunami's adrenaline buff is magic-specific. Recasting Tsunami itself where possible ... refreshes the adrenaline buff timer." "The primary target will be hit as long as the player is able to cast Tsunami; it does not need to be within the AoE of Tsunami." AoE: cardinal = 4 tiles long x 3 wide (12 tiles); diagonal = 12-tile pattern described on the page. "the wave itself has a maximum range of 4".
- 2 March 2026: "Adrenaline gain from Tsunami now only applies to Magic critical strikes."
- Glacial Embrace (Incite Fear): "Both the adrenaline cost and requirement of Tsunami are reduced by 12% per Glacial Embrace stack (down to 40% at 5 stacks)"; "Incite Fear does not need to be the active spell to benefit"; "Tsunami's cooldown is unaffected"; "Using Tsunami does not consume Glacial Embrace stacks". Stacks: "20.4 seconds; Gaining another stack causes the duration to be refreshed"; max 5; one stack per ability cast with Incite Fear selected (channelled abilities give one per hit).
- **RESOURCES**: consumes 100% (or reduced) adrenaline (Flow applies too). Grants the "Magic critical strikes generate 8% adrenaline" self buff for 50 ticks; each Magic crit -> +8% adrenaline (+16% with Natural Instinct). Smoke Tendrils' 4 guaranteed crits = +32%.
- **MODIFIES OTHER ABILITIES**: every Magic crit for 30.6 s gives +8% adrenaline (Wild Magic, Smoke Tendrils, Asphyxiate, Conc Blast hits, Omnipower hits, Lightning Surges/Frost Surge crits: "Critical hits from the Frost Surge passive stack with Tsunami's critical hit buff").
- **IS MODIFIED BY**: Glacial Embrace (cost+requirement); Flow (cost); ring of vigour, Conservation of Energy (refund); Sunshine 1.5x; Conc Blast crit buff; Ultimatums. Greater Chain: "Tsunami — No / No" (AoE).
- **REQUIREMENTS**: 100% adrenaline (or reduced requirement with Glacial Embrace). "The player character will not attempt to move closer to use the ability."
- **SHARED COOLDOWNS**: none.
- **GREATER version**: none.
- **BUFFS/DEBUFFS**: "Magic critical strikes generate 8% adrenaline" (self) 50 ticks, refreshed by recasting; `buff=` on infobox.
- **CHANNEL**: n/a.
- **OTHER**: Kalphite King's Immortality "is now triggered by Bombard, Pulverise and Tsunami" (PN2).

---

## 22. Magic mechanics summary

### 22.1 The magic "resource": Anima Charged (from Runic Charge) + Flow/Greater Flow + crit stacks

There are no persistent "magic stacks" comparable to Necromancy's necrosis/souls. Magic uses three short self-buffs that chain into each other:

1. **Anima Charged** (Runic Charge, GCD-free, 0 adrenaline, 50-tick cooldown, 25-tick buff, no stacks): consumed by the FIRST of {Sonic Wave, Greater Sonic Wave, Dragon Breath, Concentrated Blast, Greater Concentrated Blast} cast while active. Empowerment: SW -> Flow 35% (GSW -> Greater Flow 45%); Dragon Breath -> 260-310%; (G)Conc Blast -> +10% extra crit chance per hit.
2. **Flow / Greater Flow** (Sonic Wave / Greater Sonic Wave on a successful hit; 15 ticks; no stacks): next Magic ability that costs adrenaline costs 10% / 20% less (35% / 45% if Anima Charged was consumed by the Sonic Wave). Consumed by that ability. Not applied to / consumed by Defence, Constitution, special attacks.
3. **Concentrated Blast crit stacks** (5%/hit up to 15%; Greater 7%/hit up to 21%; +10%/hit more when Anima Charged -> 45% / 51%): applies to the next Magic ability (all its hits), and to the later beams of the same channel. Lost on main-hand weapon swap.
4. **Channelled Might** (full Asphyxiate; 6 ticks; +15% crit damage; Tumeken 5-piece: 15 ticks, +35%).
5. **Tsunami buff** (50 ticks): +8% adrenaline per Magic crit (+16% Natural Instinct).
6. **Blast Infused** (Wild Magic with blast diffusion boots; 10 ticks): basic Magic abilities +8% base damage.
7. **Glacial Embrace** (Incite Fear spell; 34-tick refreshable, 5 stacks): Tsunami cost & requirement -12%/stack; Frost Surge at 5 stacks (12 s cooldown).
8. **Sunshine / Greater Sunshine area** (self, area-bound): 1.5x magic attack damage; DoT on primary target only.

Magic-wide passives (CSM): rune consumption 15% chance per ability cast; 3-tick unified weapon speed; fixed impact timings ("Damage now lands at defined, predictable timings regardless of weapon or distance."); AoE computed from NPC centre/size; base crit chance 10%, crit damage 10-50% by level; DoTs never crit and ignore Sunshine/prayers/most perks.

### 22.2 Cross-ability rules: WHEN <condition> THEN <effect>

1. WHEN Runic Charge is activated THEN Anima Charged (25 ticks) is applied; Runic Charge does not trigger/obey the GCD and gives 0 adrenaline. (https://runescape.wiki/w/Runic_Charge)
2. WHEN Sonic Wave / Greater Sonic Wave / Dragon Breath / (Greater) Concentrated Blast is cast while Anima Charged THEN that ability is empowered and Anima Charged is removed; other abilities do not consume it. (https://runescape.wiki/w/Anima_Charged)
3. WHEN Sonic Wave hits THEN Flow (15 ticks): next adrenaline-costing Magic ability costs 10% less (35% if Anima Charged was consumed); Greater Sonic Wave -> 20% / 45%. (https://runescape.wiki/w/Flow , https://runescape.wiki/w/Greater_Flow)
4. WHEN a Magic ability that costs adrenaline is activated while Flow/Greater Flow is active THEN its cost is reduced and Flow is removed; Defence/Constitution abilities and special attacks neither benefit nor consume it. (https://runescape.wiki/w/Sonic_Wave)
5. WHEN Dragon Breath hits a target with the Combust status THEN Dragon Breath deals 1.25x. (https://runescape.wiki/w/Dragon_Breath)
6. WHEN Dragon Breath is cast while Anima Charged THEN it deals 260-310% instead of 110-130%. (https://runescape.wiki/w/Runic_Charge)
7. WHEN (Greater) Concentrated Blast beams land THEN each beam adds +5% (+7%) crit chance (+10% more per beam if Anima Charged) to the next Magic attack — including the channel's own later beams — up to 15% (21%) / 45% (51%); the next Magic ability consumes it on all of its hits; a main-hand weapon swap deletes it. (https://runescape.wiki/w/Concentrated_Blast , https://runescape.wiki/w/Greater_Concentrated_Blast)
8. WHEN Asphyxiate is channelled to completion (4th hit, or 8th with 4+ Tumeken) THEN Channelled Might (6 ticks, +15% crit damage; 15 ticks/+35% with 5 Tumeken); cancelling early grants nothing. (https://runescape.wiki/w/Channelled_Might)
9. WHEN Asphyxiate hits THEN hits 1-3 stun 1.2 s each (hit 1 stuns even on a miss), hit 4 binds 1.2 s; cancelling still leaves a 1.2 s bind. (https://runescape.wiki/w/Stun)
10. WHEN Tsunami deals damage THEN for 50 ticks each Magic critical strike gives +8% adrenaline (+16% under Natural Instinct); recasting refreshes. (https://runescape.wiki/w/Tsunami)
11. WHEN Smoke Tendrils hits THEN every hit is a guaranteed critical strike (so 4 x +8% under Tsunami, 4 Lightning Surges under Instability); self-damage 4 x 35-40% ignores all modifiers. (https://runescape.wiki/w/Smoke_Tendrils)
12. WHEN the caster stands inside their own (Greater) Sunshine area THEN Magic attacks deal 1.5x EXCEPT Combust, Corruption Blast, Onslaught (and Sunshine's own DoT / Smoke Tendrils recoil); leaving the area removes the buff, re-entering restores it. (https://runescape.wiki/w/Sunshine , https://runescape.wiki/w/Sunshine_(status))
13. WHEN Sunshine is cast with Planted Feet THEN duration 63 ticks and no DoT; Greater Sunshine with Planted Feet: duration unchanged, DoT removed. (https://runescape.wiki/w/Sunshine , https://runescape.wiki/w/Greater_Sunshine)
14. WHEN (Greater) Chain hits THEN for 10 ticks the next single-target Magic ability against the primary target is also dealt to the secondaries at 0.3x (0.5x Greater; +0.05x(rank+1) Caroming); one ability only; AoE abilities (Dragon Breath, Tsunami, Magma Tempest, Corruption Blast) neither copy nor consume; DoT hits (Combust) copy at full damage; Asphyxiate copies damage but not stun; Impact copies stun; Wild Magic/Omnipower extra hits copy; a new Chain overrides the old one. (https://runescape.wiki/w/Greater_Chain)
15. WHEN Wild Magic is cast with blast diffusion boots THEN Blast Infused (10 ticks): basic Magic abilities +8% base damage (includes Combust). (https://runescape.wiki/w/Blast_Infused)
16. WHEN Wild Magic hits THEN each hit has +10% crit chance and +20% crit damage. (https://runescape.wiki/w/Wild_Magic)
17. WHEN an ability is cast with Incite Fear selected THEN +1 Glacial Embrace (channelled abilities +1 per hit; multi-hit/multi-target/DoT abilities +1 only; Chain secondaries none); Tsunami cost & requirement -12%/stack (max 5 -> 40%); Tsunami does not consume stacks. (https://runescape.wiki/w/Incite_Fear , https://runescape.wiki/w/Glacial_Embrace)
18. WHEN Magma Tempest or Magma Tempest (Targeted) is cast THEN both are on cooldown (shared); damage stops if the main-hand magic weapon is removed or the target leaves the 5x5 / line of sight; hits cannot crit. (https://runescape.wiki/w/Magma_Tempest)
19. WHEN Corruption Blast is cast THEN Corruption Shot is on cooldown too (shared). (https://runescape.wiki/w/Corruption_Blast)
20. WHEN Freedom is used by the target THEN Combust and Corruption Blast DoTs are cleared and Impact/Asphyxiate stuns and binds are removed with 6 s immunity (Corruption Blast may still spread once). (https://runescape.wiki/w/Freedom)
21. WHEN Surge is used THEN no GCD is triggered, no adrenaline is gained, movement cancels any active magic channel; Escape is not put on cooldown (except in PvP); Dive/Bladed Dive share the cooldown only in PvP areas. (https://runescape.wiki/w/Surge , https://runescape.wiki/w/Bladed_Dive)
22. WHEN the player moves, is stunned, or activates another ability during Concentrated Blast / Greater Concentrated Blast / Asphyxiate / Smoke Tendrils THEN the channel ends immediately (remaining hits lost; the ability's cooldown and adrenaline are already spent). (https://runescape.wiki/w/Abilities#Channelled)
23. WHEN any ability other than Surge/Runic Charge is used THEN a 3-tick GCD starts; it starts on activation, so after a channel longer than 3 ticks the next ability can be pressed at once. (https://runescape.wiki/w/Abilities#Cooldown)
24. WHEN Impact is used THEN one of two charges (level 54+) goes on a 15 s cooldown; target stunned+bound 1.8 s; knockback 1 tile if Scare Tactics toggled. (https://runescape.wiki/w/Impact)
25. WHEN Omnipower is cast with Igneous Kal-Mej/Kal-Zuk THEN 4 hits of 120-150% (hit 1, then hits 2-4 on the next tick) instead of one 420-500% hit. (https://runescape.wiki/w/Omnipower)
26. WHEN Kerapac's wrist wraps are worn and Dragon Breath was used within the last 6 s THEN the next Combust applies all 10 hits instantly with +25% (+40% enhanced+enchantment); not in PvP. (https://runescape.wiki/w/Combust)
27. WHEN Combust is re-applied THEN the existing burn is refreshed, not stacked (generic DoT rule). (https://runescape.wiki/w/Damage_over_time)
28. WHEN Sunshine is cast while the current target is alive but out of range THEN the cast is refused. (https://runescape.wiki/w/Sunshine)

### 22.3 Ambiguities / things the wiki leaves open

- **Impact second charge level**: ability page + Stun page say 54; CSM table says 70. Recommend 54.
- **Greater Sunshine duration**: tooltip/CSM = 63 ticks; page body = 65 ticks total / 64 ticks buff; ability-queueing page for regular Sunshine says 52 ticks total / 51 buff vs tooltip 50. Treat: Sunshine buff active from tick 1 after cast for 50 ticks (30 s), Greater 63 ticks (37.8 s).
- **Asphyxiate hit spacing**: "4 times over 7 ticks" / "every 2 ticks" / "one hit every 1.2 seconds, lasts 4.2 seconds" -> hits on ticks 1,3,5,7 relative to cast (channel 7 ticks). Tumeken: 8 hits over 8 ticks (1 tick apart).
- **Concentrated Blast crit-buff duration**: not given; treat as "until next Magic attack or weapon swap".
- **Flow end condition**: "until an enhanced or ultimate Magic ability is used" (ability page) vs "Removed upon activating a Magic ability that costs adrenaline" (buff page). Smoke Tendrils (enhanced, 0 cost) is the only case where these differ; unknown whether it consumes Flow.
- **Does Flow reduce the adrenaline *requirement* as well as the cost?** Not stated (Glacial Embrace explicitly reduces both for Tsunami).
- **Sunshine DoT vs Freedom**: not on either Freedom list.
- **Magma Tempest under Sunshine**: not excluded, so assumed 1.5x; **Magma Tempest + Incite Fear stacks**: not listed.
- **CSM table's Anima-charged Conc Blast "+20%"** is the beta value; live is +10% per hit.
- **Magma Tempest level**: CSM table 66 vs ability page 85 (page says "66 → 85"). Use 85.
- **Combust (status) page** still says "maximum of 5 hits" while the ability and its own history say 10 hits. Use 10.
- **Sunshine ↔ Omnipower / Combust / Dragon Breath**: no special interaction exists on the wiki; Omnipower keeps its 30 s cooldown and 60% cost during Sunshine.
- **Dragon Breath AoE count**: tooltip "up to 4" additional; body "up to 3 additional targets in a 3x3 square". Use 4 (tooltip/CSM).
- Tumeken's Asphyxiate per-hit values appear as 71.5-84.5% (9 March patch note) and 72-84% (tooltip/CSM).
