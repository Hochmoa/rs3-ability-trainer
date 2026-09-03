# Defence and Constitution abilities – simulator spec (RuneScape 3, post Combat Style Modernisation)

Research date: 2026-09-03. Source: RuneScape Wiki (raw wikitext of each page, fetched via `?action=raw`, plus status-effect pages and the 2 March 2026 update pages). Live-game state assumed: after the **Combat Style Modernisation** update of 2 March 2026 and its follow-up patches (9 March, 16 March, 13 April 2026).

Conventions used in this document:

- 1 tick = 0.6 s. Wiki `{{ticks|N}}` values are given as `N ticks (N×0.6 s)`.
- "GCD" = global cooldown = 3 ticks (1.8 s).
- All quoted text is verbatim from the named wiki page unless marked `[paraphrase]`.
- "hard typeless" / "soft typeless" follow wiki usage: soft typeless can be reduced by defensive abilities but never healed/converted (Resonance heals 0, Divert gives no adrenaline); hard typeless ignores defensive abilities entirely (except Barricade).
- Field value `none` = the wiki states nothing that applies.

---

## 0. Global rules that apply to this ability set (from the update pages)

Source: https://runescape.wiki/w/Combat_Style_Modernisation

- "The 'threshold' ability type was removed from the three styles. Abilities with adrenaline costs can be used as soon as the player has enough adrenaline."
  - "Some Defence and Constitution abilities remained as threshold abilities."
- "Ultimate abilities remain, but they do not always require 100% adrenaline."
- "Basic abilities now generate 9% adrenaline by default (increased from 8%), though some can generate more."
- "All threshold-stuns (Forceful Backhand, Deep Impact, Tight Bindings) and movement-stuns (Kick, Stomp, Shock, Horror, Demoralise, Rout) were removed."
- "Removed the scaling factor from food based on the player's Constitution level."
- "The adrenaline cost from eating food was reduced from 10% to 3%."
- "All weapons (of all styles) were unified to a 3-tick attack speed"
- "Stalled abilities are no longer cleared by Surge, Escape, Runic Charge, and former-sigil abilities." (16 March patch)
- "Surge and Escape no longer share cooldowns, except in PvP scenarios." (16 March patch)
- Kalphite King: "Now triggers Immortality with Bombardment, Pulverise and Tsunami (instead of Unload, Frenzy, and Smoke Tendrils)." / "increasing the chance to trigger Immortality from 10% to 20%, and increasing the duration of Immortality from 6 seconds to 30 seconds."

Source: https://runescape.wiki/w/Update:Combat_Style_Refinements_%26_March_Marketplace_Drop (9 March 2026 hotfix)
- "Abilities that can be activated outside of the global cooldown (such as Surge or Dive) no longer generate adrenaline."

Source: https://runescape.wiki/w/Threshold_abilities
- "All threshold abilities require 50% adrenaline to cast and will drain 15% per cast." Defence thresholds: Devotion, Revenge, Reflect, Debilitate. Constitution thresholds: Shatter, Reprisal.

Source: https://runescape.wiki/w/Ultimate_abilities
- "Ultimate abilities require and drain a 60% or 100% of adrenaline" – all Defence/Constitution ultimates in this document cost 100%.
- "The Invention perk Ultimatums increases the base damage of all ultimate abilities by 3% + 1% × rank."

Source: https://runescape.wiki/w/Adrenaline
- "When a player is out of combat for 10 seconds, their adrenaline will deplete by 5% every 2 ticks until it hits zero unless the Persistent Rage relic power, Infernal Puzzle Box (tier 3) buff, or adrenaline urn is active."
  - NOTE: the same page's "Using" list says "Out of combat: -5% per tick". Contradiction – see ambiguities.
- "Basic abilities, including basic attacks: +9%, with a few exceptions"
- "Threshold abilities: -15% adrenaline, requires 50% to activate"
- "Ultimate ability: -60% to -100%"
- "Consuming food: -3% (only when fighting a target)"
- "Logging out or hopping worlds will reset the player's adrenaline"
- Perks: "Impatient: Grants 9% chance per rank for basic abilities to generate 3% extra adrenaline." / "Relentless: Grants 1% chance per rank to prevent adrenaline being consumed when using an ability that requires adrenaline." / "Invigorating: Boosts adrenaline gained from basic attacks by 5% per rank."
- Relics: "Fury of the Small: All basic abilities generate 1% more adrenaline." / "Conservation of Energy: After using an ultimate ability, you will regain 10% adrenaline." / "Heightened Senses: Increases maximum adrenaline by 10%." / "Persistent Rage: Prevents adrenaline from draining when outside of combat, and instead generates it at a rate of 5% every 1.2 seconds."
- "Asylum surgeon's ring: gives 10% chance to reduce the adrenaline cost of abilities by 15%." and "(additive; e.g. 25% becomes 10%). This effect also applies to special attacks, including Essence of Finality."

### 0.1 Adrenaline stalling (which of these abilities work out of combat)

Source: https://runescape.wiki/w/Adrenaline#Stalling (verbatim):

> To stall adrenaline, a player maintains their combat stance by using certain abilities that are available outside of combat. These are:
> * Anticipation
> * Freedom
> * Escape or Surge (share a cooldown).
> * (Bladed) Dive
> * Resonance or Divert (requires a shield)
> * Preparation (requires a shield)
> * Devotion, Revenge, Reflect (threshold ability, requires 50% adrenaline, doesn't drain 15% adrenaline outside combat)
> ** To be able to use these threshold abilities outside of combat the previous main target has to die or the players lose the target by dropping out of combat stance (over 10 seconds out of combat)
> To stall effectively, a player must use an ability only when their combat stance is about to end. Combat stance lasts for 10 seconds after combat ends.

> Without a shield or any locked abilities, players will only have access to Anticipation, Freedom and Surge/Escape. This means they can only stall for a maximum of 48 seconds by using each of these abilities every 9.6 seconds following the rotation: last combat ability > Surge > Anticipation > Freedom > Surge. With perfect timing, they will then have 2 seconds before Anticipation is off cooldown, at this point they will start losing adrenaline.

> If in a location preventing use of movement abilities, a player can only stall for a short time because of cooldowns. However, the use of a shield provides the abilities Resonance and Preparation and allows infinite stalling anywhere. Revenge and Reflect, while both requiring a shield, are similar to Devotion that they are threshold abilities that do not consume adrenaline out of combat.

Note the "(share a cooldown)" remark for Surge/Escape on the Adrenaline page predates the 16 March 2026 patch that removed the shared cooldown outside PvP.

### 0.2 Bone Shield (Necromancy) substitute for a shield

Source: https://runescape.wiki/w/Template:Bone_shield_table and https://runescape.wiki/w/Bone_Shield_(status)

- Bone Shield: "Allows the activation of non-offensive abilities that require a shield at the cost of necrotic runes." / "Uses the Bone Shield level for abilities that scale to shield level."
- "Lesser Bone Shield grants a Bone Shield of level equal to 25% of the player's Necromancy level." / "Greater Bone Shield grants a Bone Shield of level equal to 50% of the player's Necromancy level." (Zemouregal's nexus adds +15 tier per the table headers: Greater = tier 60 → 75, Lesser = tier 30 → 45 at level 120.)
- "The following defensive abilities do not scale with shield tier, but Bone Shield allows them to be used: Preparation, Reflect, Immortality, and Rejuvenate."
- "The following defensive abilities require having a shield equipped, therefore cannot be used with Bone Shield: Bash and Revenge."
- Scaled with Bone Shield: Debilitate (duration; no rune cost), Resonance (heal %), Divert (adrenaline), Barricade (duration).

### 0.3 Defender / repriser / rebounder rule

For every shield-tier-scaled effect the wiki states defenders count as **half their tier**: Resonance ("When defenders, reprisers, or rebounders are used, its tier is halved"), Divert ("Defenders count as shields of half their tier"), Barricade ("If activated with a defender, the defender's level ... is halved"), Debilitate (status page: "Defenders are treated as having half their level"), Revenge ("only 2.5% per stack if activated with a defender"). Immortality: "Immortality's effect is consistent throughout all tiers of shields and defenders."

### 0.4 Stun / bind immunity – general

Source: https://runescape.wiki/w/Stun
- While stunned a player cannot use "any abilities, except for Freedom. Weapon Special Attack can still be activated by clicking the adrenaline bar."
- "Freedom removes and prevents further stuns and binds for another six seconds. It also prevents certain forms of dragging."
- "Anticipation renders players immune to stuns for 10 seconds."
- "Transfigure incapacitates the user for six seconds, then heals them afterwards for 250% of the damage they take in that time whilst providing a 15 second immunity to stuns and binds. However, Transfigure cannot be activated while the player is already stunned or immune to stuns."
- PvP: "Stuns applied to players in PvP combat will trigger diminishing returns. Consequently, after experiencing a certain number of stuns within a short period of time, the target will temporarily become immune to stun effect."
- "NPCs that have been stunned by another NPC will become immune to non-player stuns for 10 seconds"
- Thieving stuns: "The stun can be removed with Freedom but cannot be prevented with Freedom, Anticipation or Transfigure stun immunity effects."

Source: https://runescape.wiki/w/Bound_(status)
- Bound "Cannot be applied if the target is affected by Freedom, Transfigure stun immunity or Stun Immune" and "Can be removed by activating Freedom" / "Can be removed by activating Barge or Greater Barge". (Anticipation is NOT listed as blocking binds – see ambiguities.)

Player stun abilities after the update (Stun page): Backhand 1.8 s stun+bind (2 charges at 54 Attack), Binding Shot 1.2 s stun + 9.6 s bind (2 charges at 54 Ranged), Impact 1.8 s stun+bind (2 charges at 54 Magic), Flurry/Greater Flurry 3.6 s stun+bind on primary target, Asphyxiate 3×1.2 s stuns + 1.2 s bind, Soul Strike 3 s stun+bind.

---

# PART A – DEFENCE ABILITIES

## A1. Anticipation

Source: https://runescape.wiki/w/Anticipation and https://runescape.wiki/w/Anticipation_(status)

- **Type / adrenaline / cooldown / duration**: Basic, Self target, `adrenaline = +9`, `cooldown = 24.6` s (41 ticks), duration "17 ticks" = 10.2 s (status page: "duration = 10.2 seconds"). Level 3 Defence, F2P, no equipment.
- **Tooltip**: "Reduce all damage taken by 10%. Immune to stuns. 10.2s duration."
- **Channelled?** No. **GCD?** Normal ability (uses and is subject to GCD). Trivia: "During the 2023 combat beta, Anticipation was trialled as being a non-global cooldown ability ... This was ultimately determined to be undesirable and was reverted".
- **Usable out of combat (stalling)?** Yes – listed on Adrenaline#Stalling; "do not require a target to activate combat".
- **REQUIREMENTS**: none (no shield, no target).
- **Effect rules (verbatim)**: "When activated, the player reduces damage taken by 10% and gains immunity against stuns for 10 seconds. Anticipation must be activated before getting stunned in order to work. Anticipation will not reduce damage over time or stuns and binds if it is activated after the effect has started. This does not work on Thieving stuns."
- **MODIFIES OTHER ABILITIES**: none directly. Blocks Transfigure activation (Transfigure "cannot be used whilst immune to stuns"). Patch 11 Aug 2014: "Anticipation no longer causes channelled abilities to be interrupted."
- **IS MODIFIED BY**: "The Clear Headed perk lengthens Anticipation's duration by 2 ticks (1.2 s) per rank but removes its damage reducing effect." / "The Reflexes perk halves its duration and cooldown."
- **SHARED COOLDOWNS**: none. (Not shared with Freedom – both have independent cooldowns; the stalling rotation on the Adrenaline page uses both back-to-back.)
- **BUFF**: "Anticipation (status)", 10.2 s, timer, no stacks; effects "Reduces all damage taken by 10%", "Grants immunity to stuns". Not removable by Freedom (it is a buff).
- **Stuns/binds**: prevents stuns applied while active (10.2 s). Does not remove existing stuns/binds/DoTs. Bind prevention: the Anticipation page says "Outside of preventing of stuns and binds, Anticipation also has additional usage" but the tooltip/status list only "Immune to stuns" and the Bound status page does not list Anticipation – **ambiguous, see summary**.
- **Other interactions**: prevents Araxxor/Araxxi cleave drag and reduces cocoon clicks 5→2; prevents lava strykewyrm/Wildywyrm drag; stops Nex smoke-phase drag; "It prevents Rasial, the First Necromancer from disabling the player's protection prayers." Boss defensive resets (Yakamaru Quicksand, Vorago etc.) put defensive abilities on cooldown "except for Freedom and Anticipation" (Stun page).
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A2. Bash

Source: https://runescape.wiki/w/Bash

- **Type / adrenaline / cooldown**: Basic, Single target, `adrenaline = +9`, `cooldown = 15` s (25 ticks), damage "Varies", level 8 Defence, F2P, `equipment = Shield`.
- **Tooltip**: "Slam your shield into the target. 20%-100% ability damage. Deals an additional damage equal to 20%-100% of your shield's armour value plus your defence level."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (requires a target).
- **REQUIREMENTS**: "requires level 8 Defence and a shield to use. Bash is tagged as an offensive ability, which means that the requirement to wield a shield cannot be satisfied by using Bone Shield." Defenders count as shields for Bash ("Bash works the same when using a defender").
- **Damage formula (verbatim)**: "Despite the description, when activated, the player deals 20-100% of the sum of their ability damage, plus shield armour value, plus Defence level." Example: T90 shield, 120 Str, 99 Def → 20–100% of 1754.
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: shield armour value and Defence level (part of base). No stun since 10 Aug 2015 ("The Bash ability is no longer classed as a stun ability.").
- **SHARED COOLDOWNS**: none.
- **BUFFS/DEBUFFS**: none.
- **Other**: Vorago reflect quirk only.
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."; 7 Aug 2023 "The 'Bash' and 'Revenge' abilities have been tagged as 'Offensive' abilities."

## A3. Provoke

Source: https://runescape.wiki/w/Provoke and https://runescape.wiki/w/Provoke_(status)

- **Type / adrenaline / cooldown**: Basic, Single target, `adrenaline = +9`, `cooldown = 10.2` s (17 ticks), no damage, level 24 Defence, F2P, no equipment.
- **Tooltip**: "Taunt the target. Force the target to attack you. In PvP, reduce both targeted player's and your damage towards other players by 50% for 10 ticks (6 s). Can be cast during the global cooldown but will not generate adrenaline."
- **Channelled?** No. **GCD?** "Provoke can be activated outside the global cooldown but generates no adrenaline if used this way." (Patch 5 Feb 2018 "'Provoke' can now be used during the global cooldown."; 26 Nov 2018 "Can no longer be queued whilst ability queueing isn't active.") NOTE the 9 March 2026 hotfix "Abilities that can be activated outside of the global cooldown ... no longer generate adrenaline" may mean Provoke never generates adrenaline now – **ambiguous**.
- **Out of combat?** Requires a target; not in the stalling list.
- **REQUIREMENTS**: target required. "Some monsters have the Provoke Immune buff which prevents them from being provoked."
- **Effects (verbatim)**: PvP: "For 6 seconds, both the user and the target deal 50% less damage to any other players they attack ... It has no effect when both the user and the target attack each other." PvM: "the monster that the player used Provoke on will start attacking the user instead, provided that they are already in combat." Taunting perk: "all monsters in a 5x5 radius to attack the user." Elite Dungeon monsters "will immediately return to attacking the closest player".
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Taunting perk (radius). Some shields give a right-click Provoke option (Classic mode).
- **SHARED COOLDOWNS**: none.
- **DEBUFF**: "Provoke (status)" applied to players hit, 6 s, "Reduces damage dealt to players other than the user by 50%".
- **Trivia**: "Provoke and Natural Instinct are the only abilities that have completely different effects depending on whether they are used against a player or a monster."
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A4. Freedom

Source: https://runescape.wiki/w/Freedom and https://runescape.wiki/w/Freedom_(status)

- **Type / adrenaline / cooldown / duration**: Basic, Self, `adrenaline = +9`, `cooldown = 30` s (50 ticks), duration "10 ticks" = 6 s. Level 34 Defence, F2P, no equipment.
- **Tooltip**: "Break free from all that stops you. Remove stuns and binds. Clear damage over time effects. Gain immunity to stuns and binds. 6s duration."
- **Channelled?** No. **GCD?** Normal ability (uses GCD) but is the only ability usable while stunned: Stun page "Using any abilities, except for Freedom." Patch 29 Sep 2014: "The Freedom ability will no longer be put on a global cooldown when the player is hit by an interrupt."
- **Out of combat?** Yes – stalling list.
- **REQUIREMENTS**: none. Cannot be used during Transfigure's self-stun ("While under the effects of Transfigure, all other abilities (including Freedom) are disabled." – message "You may not try and escape this stun early!").
- **Effects (verbatim)**: "When activated, all binds, stuns, and bleeds on the player are removed. The player also gains immunity from further binds and stuns for six seconds." Caveat on the same page: "Freedom currently does not prevent a second stun within the 6 seconds it's intended to give stun immunity to the player, making NPCs capable of stunning the player again." – **ambiguous vs. status page "Grants immunity to stuns and binds"**.
- Thieving: "Freedom removes the stun from failing attempts at pickpocketing NPCs, allowing the player to move or attack, but not to pickpocket until the normal stun duration is over."
- **MODIFIES OTHER ABILITIES / debuffs**:
  - "Stack reduction: Activating Freedom removes half of the current stacks, rounded up, for the following debuffs: Combust (Beastmaster Durzag), Drenched, Fatigued, Rage (Beastmaster Durzag), Storm Shards". So Storm Shards stacks on **the Freedom user** (i.e. the PvP target of Storm Shards) go from n to n − ceil(n/2).
  - Removable DoTs (player-applied, non-exhaustive): Bloated, Combust, Corruption Blast, Corruption Shot, Deadshot, Dismember, Slaughter, Massacre, Fragmentation Shot, Devourer's Contagion, Penance Attack, Phantom Strike (Morrigan's javelin spec), Soulfire (Roar of Awakening spec), plus listed monster bleeds/burns (Araxxor bleed, Araxyte poison, Helwyr Bleeding, Nex AoD ice-crystal Dismember, Vorago Destroy tank, Geothermal Burn, demon boss burns/bleeds, Taking Damage, Toxic).
  - NOT removable: Assault/Flurry/Greater Flurry DoT under Endless Assault, Incendiary Shot, Abyssal Parasite, Deep Burn (strykebow spec), Ring of Death status, Stalled masterwork damage, wyvern crossbow poison, Apmeken's Burden, Telos viruses, Nex AoD Icicle Slam Dismember, Poisoned, ripper dinosaur bleed, weak anima bomb, wyvern poison, Yakamaru poison.
  - Patch 27 May 2014: "Players using the Freedom ability will now have the Blood Tendrils effect removed if it was caused by another player. Freedom will not remove the negative effects from casting the Blood Tendrils ability yourself."
  - Patch 13 Oct 2014: "Freedom now breaks binds applied by NPCs using Asphyxiate, Rapid Fire, Flurry and Assault."
- **IS MODIFIED BY**: none stated (no perk listed).
- **SHARED COOLDOWNS**: none (independent of Anticipation).
- **BUFF**: "Freedom (status)" 6 s, timer, no stacks: "Initially, clears most stun, bind and bleed effects" / "Grants immunity to stuns and binds".
- **Unique monster interactions**: Araxxor/Araxxi cleave drag prevented & cocoon clicks reduced "If the lingering immunity is active when the attack begins"; Nex AoD ice crystal removal; Kalphite King bind removal; lava strykewyrm drag; Nex smoke-phase drag. Boss defensive resets exclude Freedom (Stun page).
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A5. Divert

Source: https://runescape.wiki/w/Divert and https://runescape.wiki/w/Divert_(status)

- **Type / adrenaline / cooldown / duration**: Basic, Self, `adrenaline = +9`, `cooldown = 30` s (50 ticks), buff duration "10 ticks" = 6 s. Level 48 Defence, members, `equipment = Shield` (Bone Shield allowed, costs runes).
- **Tooltip**: "Channel power into your shield to block an attack. Block the next attack. 6s duration. Generate 0.8% adrenaline for every 100-200 damage blocked, based on the level of shield equipped with diminishing returns at 3,000, 6,000 and 9,000 damage blocked. Powerful attacks will have their damage blocked, but will not generate adrenaline."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes (stalling list, requires shield).
- **REQUIREMENTS**: shield or defender (or Bone Shield). Status page: buff lasts "6 seconds or until consumed or until the current shield or defender is unequipped".
- **Effects (verbatim)**: "activating Divert grants a buff that will reduce the damage from the next incoming attack to 1, but rather than restoring the player's health, the damage that would have been taken is instead converted to adrenaline." / "The buff remains for 6 seconds or until the player is attacked with a damaging attack."
- **Adrenaline formula (verbatim)**: "In order to generate any adrenaline, the player needs to take at least 200−T damage, where T is the tier of shield used. Defenders count as shields of half their tier. Damage used for calculations is the damage dealt before damage reduction from Defence level and armour." / "Every multiple of 200−T in the first 1 to 3,000 damage gives 0.8% adrenaline, every multiple between 3,001 and 6,000 damage gives 0.6% adrenaline, every multiple between 6,001 and 9,000 damage gives 0.4% adrenaline, and every multiple between 9,001 and 12,000 damage gives 0.1% adrenaline. Any damage over 12,000 does not contribute". Example: "5,000 hit using a tier 90 shield ... floor(3000/110)=27 multiples of 0.8% and floor(2000/110)=18 multiples of 0.6% ... 32.4% adrenaline." "The maximum amount of adrenaline Divert can generate from an attack is 50%". Bone shield table: T60 → 39.9%, T75 → 45.6%, T30 → 32.3%, T45 → 36.1% max.
- "As it is also a basic ability, normal adrenaline gain occurs when used with a target. This is separate from the damage converted to adrenaline through the buff." (i.e. +9% on cast only if a target is selected.)
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Preparation ("Like Resonance, Preparation affects Divert's cooldown"); Natural Instinct ("Natural Instinct can double its effects up to a maximum adrenaline gain of 100%"); shield tier.
- **SHARED COOLDOWNS**: "Divert shares its cooldown with Resonance."
- **BUFF**: "Divert (status)" – "Reduces the damage from the next attack that deals more than 1 damage to 1", "Soft typeless damage is blocked but does not grant adrenaline".
- **Damage-type interactions**: grants adrenaline vs Araxxor/Araxxi poison, Telos font absorption (not final hit), deflect damage, Solak blight. Blocks but no adrenaline vs soft typeless list (Raksha tail swipe, Nomad, Vorago Vitalis orb, Helwyr DoT, Twin Furies bomb, Telos uppercut/jump/shockwaves/So Much Power/weak anima bomb/tendrils/rockfall/virus, Nex AoD pulse bomb/elements/amalgamation, Penance King, Lucien, K'ril prayer smash, Solak mines/spore/consciousness, Astellarn solar storm, Verak Lith energies). Cannot affect: Gielinor red bombs, Verak Lith flame vortices, Sliske shadow hand, Ambassador Jabari magic.
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A6. Resonance

Source: https://runescape.wiki/w/Resonance and https://runescape.wiki/w/Resonance_(status)

- **Type / adrenaline / cooldown / duration**: Basic, Self, `adrenaline = +9`, `cooldown = 30` s (50 ticks), buff "10 ticks" = 6 s. Level 48 Defence, F2P, `equipment = Shield` (Bone Shield allowed, costs runes).
- **Tooltip**: "Channel power into your shield to block an attack. Block the next attack. 6s duration. Heal for 50%-100% damage blocked, based on the level of shield equipped. Powerful attacks will have their damage blocked, but will not heal you."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes (stalling, shield).
- **REQUIREMENTS**: shield/defender/Bone Shield; status: "6 seconds or until consumed or until the current shield/defender is unequipped".
- **Effects (verbatim)**: "the next melee, magic, or ranged attack received by the player within 6 seconds will heal the player instead of damaging them." / "When damage is converted to healing by this ability, the hit will still register, but it is reduced to 1. If the hit is meant to deal 1 damage via the effects of Devotion, Resonance will not be consumed. Disruption Shield, which completely negates a hit instead of reducing it to 1, is consumed by hits reduced by Devotion and takes priority over Resonance." / "Resonance heals from the first hit taken on any given tick while any other hits deal full damage. It does not prevent stuns, but any damage associated with the stunning attack is healed from."
- **Heal formula**: "Healing % = 50 + (0.5 × x) where x is the level of the shield. When defenders, reprisers, or rebounders are used, its tier is halved for this purpose." T90 → 95%, T1 → 50.5%, T90 defender → 72.5%. "This ignores most damage modifiers, so the relative amount healed is actually higher due to defence/armour damage reduction and effects such as spirit shields being ignored. Prayers and ability-induced damage reduction (such as Reflect) are not ignored, and so will reduce Resonance's healing." Example: 2000 hit → heals 87.5% × 2000 = 1750 with T75.
- Patch 22 Sep 2014: "Resonance and Disruption shields will no longer trigger from '1' damage hits."
- **MODIFIES OTHER ABILITIES**: Reprisal "does not count the damage healed or mitigated by Resonance." Reflect still reflects damage "that is healed off from with Resonance".
- **IS MODIFIED BY**: Preparation (−3 s remaining cooldown per hit taken), Devotion (1-damage hits do not consume it), Reflect and prayers reduce the heal, shield tier.
- **SHARED COOLDOWNS**: "Resonance shares the same cooldown as Divert."
- **BUFF**: "Resonance (status)": "Blocks the next attack that deals more than 1 damage", "Soft typeless damage is blocked but does not grant health".
- **Damage-type interactions**: identical lists to Divert (plus TzKal-Zuk empowered magic bomb in the soft-typeless list). Yakamaru multiplier quirk.
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A7. Preparation

Source: https://runescape.wiki/w/Preparation and https://runescape.wiki/w/Preparation_(status)

- **Type / adrenaline / cooldown / duration**: Basic, Self, `adrenaline = +9`, `cooldown = 20.4` s (34 ticks), duration "16 ticks" = 9.6 s. Level 67 Defence, F2P, `equipment = Shield` (Bone Shield allowed – "does not scale with shield tier, but Bone Shield allows them to be used").
- **Tooltip**: "Ready yourself for the coming attacks. Remaining cooldown of Resonance and Divert are reduced by 5 ticks (3 s) for every attack received. 9.6s duration."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes (stalling, shield).
- **REQUIREMENTS**: shield; "Like all shield abilities, if the shield is taken off while Preparation is still active, the effect will be cancelled."
- **Effect (verbatim)**: "When activated, each attack the player receives within the next 9.6 seconds reduces the remaining cooldown of Resonance and Divert by 3 seconds." / "Hard typeless hits do not contribute to Preparation reducing Resonance and Divert's cooldown."
- **MODIFIES OTHER ABILITIES**: Resonance and Divert cooldown (the shared cooldown) −5 ticks per attack received. It does NOT affect any other Defence ability's cooldown per the wiki.
- **IS MODIFIED BY**: "The Preparation perk increases the duration and cooldown of this ability by 15% per rank."
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Preparation (status)": "9.6 seconds or until the current shield/defender is unequipped"; "Every hit received reduces the cooldown of Resonance and Divert by 3 seconds".
- **Other**: Yakamaru/Vorago-style defensive resets: "all defensive abilities except for Anticipation, Freedom and Preparation placed on cooldown" (Stun page, Sinking adventurer). Trivia: "Preparation used to have a cooldown time of five seconds. This was later changed to 20 seconds".
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## A8. Devotion

Source: https://runescape.wiki/w/Devotion and https://runescape.wiki/w/Devotion_(status)

- **Type / adrenaline / cooldown / duration**: Threshold, Self, `adrenaline = -15`, `cooldown = 60` s (100 ticks), duration "16 ticks" = 9.6 s, extend "8 ticks" (4.8 s) per kill up to "32 ticks" (19.2 s). Level 1 Defence, F2P, no equipment. Unlocked from One Piercing Note.
- **Tooltip**: "Empower yourself with the protection of the gods. Increase the effectiveness of your protection prayers to 100%(75% in PvP). 9.6s duration. Killing an enemy extends the duration by 4.8s up to a maximum of 19.2s. Consumes 15% Adrenaline."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes: "Devotion, Revenge, Reflect (threshold ability, requires 50% adrenaline, doesn't drain 15% adrenaline outside combat)".
- **REQUIREMENTS**: threshold → 50% adrenaline (15% under Limitless). No shield.
- **Effects (verbatim)**: "When activated, protection prayers and deflection curses reduce the damage of the styles they defend against to 1 for 9.6 seconds. In PvP, damage is instead reduced by 75%. The effect can be extended by 4.8 seconds per opponent killed, capped at a maximum total duration of 19.2 seconds by killing two opponents. If the player kills multiple enemies on the same tick, it is still considered to be one kill."
- **Exceptions**: "Some monsters, such as nihil and muspah ignore the effects of Devotion even when their attacks are correctly prayed against. Devotion does not work against dragonfire despite being considered magic damage. Other monsters are capable of removing its effects." Araxxor extends Devotion when he "runs out of health" in phases 1-2. Hotfix 24 March 2026: "Devotion now works with sanguine crawlers."
- **MODIFIES OTHER ABILITIES**: Resonance is not consumed by 1-damage Devotion hits; Disruption Shield is consumed and takes priority; Reflect still reflects damage "blocked with any Devotion effect (the ability, perk and its enhanced variant)".
- **IS MODIFIED BY**: requires the matching protection prayer / deflect curse to be active.
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Devotion (status)": 9.6 s; "Can be extended by 4.8 seconds by killing an enemy (can only occur twice, maximum total duration: 19.2 seconds)".
- **Update history**: 2 March 2026 not listed (unchanged); 24 Feb 2014 "Devotion will now be turned off during the Kalphite King, Vorago and Barrows: Rise of the Six encounters, where appropriate, as with other defensive abilities."

## A9. Revenge

Source: https://runescape.wiki/w/Revenge and https://runescape.wiki/w/Revenge_(status)

- **Type / adrenaline / cooldown / duration**: Threshold, Self, `adrenaline = -15`, `cooldown = 45` s (75 ticks), duration "32 ticks" = 19.2 s, max stacks 10. Level 15 Defence, F2P, `equipment = Shield`.
- **Tooltip**: "The best defence is offence. Gain a stack of Revenge each time you are attacked. 19.2s duration. Consumes 15% Adrenaline. Maximum stacks: 10. Revenge: Deal an additional 5% damage per stack."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes (threshold stalling rule, needs shield; "do not consume adrenaline out of combat").
- **REQUIREMENTS**: 50% adrenaline (15% under Limitless). "Revenge is tagged as an offensive ability, which means that the requirement to wield a shield cannot be satisfied by using Lesser or Greater Bone Shield." Real shield or defender only.
- **Effects (verbatim)**: "any attacks the user receives increase the user's own damage dealt by 5%, up to a maximum of 50% with ten stacks. This ability lasts 19.2 seconds. Blocked and missed attacks do add Revenge stacks, as do hits blocked by Barricade. Removing the shield while Revenge is still active removes all stacks immediately. Hard typeless hits do not add Revenge stacks." / "Revenge increases damage by only 2.5% per stack if activated with a defender." / "If Revenge is used with Raids armour and a defensive reset occurs and Revenge is activated again before the duration of the first has ended, the stacks are all reset to zero."
- **MODIFIES OTHER ABILITIES**: +5%/stack to all damage dealt (since 18 Sep 2023 "5% total damage per stack", previously random-damage only).
- **IS MODIFIED BY**: Barricade (blocked hits still stack), defender (2.5%), shield removal (clears).
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Revenge (status)": "19.2 seconds or until the current shield/defender is unequipped"; "Each attack the user receives grants 1 stack to a maximum of 10"; icon shows time (upper half) and stacks (lower half).
- **Update history**: 7 Aug 2023 tagged Offensive; 18 Sep 2023 rebalance. No 2026 change listed.

## A10. Reflect

Source: https://runescape.wiki/w/Reflect and https://runescape.wiki/w/Reflect_(status)

- **Type / adrenaline / cooldown / duration**: Threshold, Self, `adrenaline = -15`, `cooldown = 30` s (50 ticks), duration "16 ticks" = 9.6 s. Level 37 Defence, F2P, `equipment = Shield` ("this requirement can be bypassed by using a Bone Shield Incantation").
- **Tooltip**: "Use your shield to return attacks back at the attacker. Reduce damage taken by 50% (25% in PvP). Reflect 100% of damage taken back at the attacker. 9.6s duration. Consumes 15% Adrenaline."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Yes (threshold stalling rule). "If a target is not selected, Reflect will not cost any adrenaline."
- **REQUIREMENTS**: 50% adrenaline (15% under Limitless); shield/defender/Bone Shield.
- **Effects (verbatim)**: "Reflect lasts for 9.6 seconds regardless of the shield's level. All incoming auto-attacks and soft typeless mechanics will deal 50% less damage to the player. If the monster is not immune to reflect damage, the other half of the damage that would have been inflicted is reflected back at the monster that caused that damage. This also includes damage that is healed off from with Resonance or blocked with any Devotion effect (the ability, perk and its enhanced variant). In PvP situations, the reflected damage is halved to 25%." / "For core damage types (Magic, Ranged, Melee, and Necromancy), Reflect applies before the damage reduction from the player's armour, Defence level, spirit shield damage reduction, and Animate Dead. This causes Reflect to deal more than 50% (25% in PvP) of the damage the player receives back to the attacker." Typeless: "a 1,500 typeless hit received would reflect 1,500 damage back."
- Spirit shields: "the damage reduction is calculated after Reflect takes place, effectively causing the player to reduce damage taken by 65% while the attacker takes 50% rebounded damage" (multiplicative stacking).
- **MODIFIES OTHER ABILITIES**: reduces Resonance healing ("ability-induced damage reduction (such as Reflect) are not ignored" by Resonance).
- **IS MODIFIED BY**: none (does not scale with shield tier).
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Reflect (status)": 9.6 s; "Reduces damage taken by 50% (25% in PvP)", "Reflect 100% of damage taken back at the attacker".
- **Other**: "'Reflect' style damage now deals 0 damage against Ascension bosses." Not affected by Bow of the Last Guardian PvP bug any more (fixed 2022).

## A11. Debilitate

Source: https://runescape.wiki/w/Debilitate and https://runescape.wiki/w/Debilitate_(status)

- **Type / adrenaline / cooldown / duration**: Threshold, Single target, `adrenaline = -15`, `cooldown = 30` s (50 ticks), damage "20%-100%" (avg 60%), duration "13 ticks–23 ticks" (7.8–13.8 s) based on shield level. Level 55 Defence, F2P, `equipment = None`.
- **Tooltip**: "Perform a debilitating kick to the target. 20%-100% ability damage. Reduce the damage taken from the target by 50%. 7.8s-13.8s duration based on the level of shield equipped. Consumes 15% Adrenaline."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (needs target; it is a damaging attack).
- **REQUIREMENTS**: 50% adrenaline (15% under Limitless). "Unlike other defensive abilities, Debilitate scales with shield level but does not require a shield to use. Therefore Necrotic runes are not consumed when Debilitate is used, however the duration of Debilitate is extended according to the tier of bone shield active."
- **Duration table** (ticks; shield / defender): no shield or T1 → 13 / 13; T10 → 15 / 13; T20 → 16 / 15; T30 → 17 / 15; T40 → 18 / 16; T50 → 19 / 16; T60 → 20 / 17; T70 → 21 / 17; T80 → 22 / 18; T90 → 23 / 18. Text: "For every 10 shield levels, 0.6 seconds are added, and the Bulwark perk can further increase the duration." Bone shield: T60 → 12 s, T75 → 12.6 s, T30 → 10.2 s, T45 → 10.8 s.
- **Effects (verbatim)**: "the target takes 20–100% ability damage and any damage they deal to the user is reduced by 50% for 7.8 or more seconds" / "Debilitate also works against soft typeless damage, but not hard typeless damage." / "Debilitate only affects the user - even though the icon may appear for other players, they will take appropriate damage as usual." / "If the player uses Debilitate against multiple enemies rapidly (only possible with Raids armour), then Debilitate will only affect the most recently struck target." / "If a shield-enhanced Debilitate is used but the player switches it for something that would replace that shield, Debilitate's effects are immediately removed from the target." / trivia: 2h→mainhand/dual-wield switch keeps the effect, switching back to the 2h removes it (and vice versa).
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: "Fortitude increases the accuracy of this ability by 10%"; "The Shield Bashing perk increases the damage of this ability by 15% per rank."; Bulwark perk (duration); shield tier; boss defensive resets remove it; stalling (can be stalled before a reset and released after).
- **SHARED COOLDOWNS**: none.
- **DEBUFF on target / buff icon**: "Debilitate (status)": "7.8-13.8 seconds or until the current shield/defender is unequipped (if used when activating)"; "Reduce the damage taken from the target by 50%"; "Defenders are treated as having half their level".

## A12. Immortality

Source: https://runescape.wiki/w/Immortality and https://runescape.wiki/w/Immortality_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Self, `adrenaline = -100`, `cooldown = 120` s (200 ticks), duration "50 ticks" = 30 s. Level 29 Defence, F2P, `equipment = Shield` ("this requirement can be bypassed by using a Bone Shield Incantation").
- **Tooltip**: "Show tenacity even in the face of death. Reduce all damage taken by 25%. 30s duration. If you die during this period, immediately return to life with 40% of your maximum lifepoints. The damage reduction effect is removed upon returning to life."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Not in the stalling list (ultimate).
- **REQUIREMENTS**: 100% adrenaline (90% with ring of vigour – see Template:Ultimate ability adrenaline: Immortality "100 / 90 / 80"); shield/defender/Bone Shield. Status: "30 seconds or until death or until the current shield/defender is unequipped".
- **Effects (verbatim)**: "melee, magic, ranged, and soft typeless damage the user receives is reduced by 25% for 30 seconds. If the user dies while the ability is in effect, they are returned to life, immediately cancelling Immortality." / "Unlike most other defensive abilities requiring a shield, Immortality's effect is consistent throughout all tiers of shields and defenders." / On death: "This will also recover 40% of the player's maximum health and provide a 1.8 second damage immunity from incoming attacks. Like portents and signs of life/death, however, the player is temporarily bound due to the animation playing out. In PvP situations, this will also remove any Teleport Block effect".
- **Bypassed by**: Vorago phase 5 / 10-11 push; Nex AoD elements attack ("The sheer force of the pillars smashes through your Immortality effect!"); Telos instant-kill bomb (phase 4 always; phase 5 only at 1000%+ enrage); losing Solak's conscience; TzKal-Zuk instant-kill explosion; Amascut "Bend the knee" at 4000%.
- **MODIFIES OTHER ABILITIES**: Onslaught: "Immortality and Sign of life will revive players killed by the recoil damage ... but Onslaught will be interrupted."
- **IS MODIFIED BY**: ring of vigour / Conservation of Energy (adrenaline refund); Ultimatums (damage – n/a, no damage).
- **SHARED COOLDOWNS**: none stated (Barricade and Immortality are independent).
- **BUFF**: "Immortality (status)": "Reduces damage taken by 25%", "If the user dies, return to life with 40% of their maximum life points".

## A13. Rejuvenate

Source: https://runescape.wiki/w/Rejuvenate and https://runescape.wiki/w/Rejuvenate_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Self, `adrenaline = -100`, `cooldown = 300` s (500 ticks). Infobox: "Restore 2.5% of your lifepoints every 1 tick over 17 ticks" (10.2 s); status page: "Restore 2.5% ... every 0.6s over 9.6s" / "40% in 16 instances". Level 52 Defence, F2P, `equipment = Shield` (Bone Shield allowed).
- **Tooltip**: "Channel your adrenaline to heal yourself. Restore 2.5% of your lifepoints every 0.6s over 9.6s. Heal over time. Fully restore your drained stats."
- **Channelled?** No (heal-over-time buff; player can act normally). **GCD?** Normal. **Out of combat?** Not in stalling list.
- **REQUIREMENTS**: 100% adrenaline; shield. "The shield must be equipped for the duration of the effect; removing the shield (including switching to another shield) will instantly end the effect and also prevent stat restoration."
- **Effects (verbatim)**: "the user is rapidly healed with purple hitsplats, which add up to a total of 40% of their maximum life points. The effect occurs over 10 seconds, and each second roughly 4% of the user's life points are restored. The stat restoration restores to full any drained combat stats besides Prayer, Summoning and Constitution." (Patch 11 Sep 2023: "The Rejuvenate ability now also restores Necromancy.")
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: "The Brief Respite perk reduces the cooldowns for Rejuvenate and Guthix's Blessing by 5% per rank, but reduces total healing by 1% of max lifepoints per rank. When Rejuvenate or Guthix's Blessing is used with the Brief Respite perk, Ice Asylum will share the reduced cooldown, but the effect of the Enhanced Excalibur will retain its 5 minute cooldown."
- **SHARED COOLDOWNS**: "Rejuvenate shares its cooldown with Guthix's Blessing, Ice Asylum, and the Enhanced excalibur's effect."
- **BUFF**: "Rejuvenate (status)" 9.6 s: "Restores 2.5% of the user's life points every 0.6 seconds (40% in 16 instances)", "Fully restores the user's drained combat stats (excluding Prayer and Summoning)".
- **Other**: "In order to reset the cooldown on the Rejuvenate ability, the player can log out to the lobby and then log back in." "Rejuvenate is also the only option available in Free-to-play."

## A14. Barricade

Source: https://runescape.wiki/w/Barricade and https://runescape.wiki/w/Barricade_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Self, `adrenaline = -100`, `cooldown = 60` s (100 ticks), duration "8 ticks–17 ticks" (4.8–10.2 s) based on shield level. Level 81 Defence, F2P, `equipment = Shield` (Bone Shield allowed).
- **Tooltip**: "Summon an impenetrable dome of shields. Prevent all damage received. 4.8s-10.2s duration based on the level of shield equipped."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Not in stalling list.
- **REQUIREMENTS**: 100% adrenaline (90% with ring of vigour); shield/defender/Bone Shield. "If the shield or defender is unequipped or switched to a different shield or defender (even to a second copy of the same item) while Barricade is still active, the ability is cancelled immediately."
- **Effects (verbatim)**: "For up to 10 seconds, the user is immune to all damage, including all typeless damage (both soft and hard), unless the player receives an attack that disables defensive abilities. It does not prevent stuns, but the damage associated with the stunning attacks is negated." Bypass: "The initial hit from challenging Vorago, as well as the damage dealt to the player when failing one of TzKal-Zuk's three challenges will ignore Barricade and still hit the player."
- **Duration formula**: "this duration varies from 4.8 seconds (8 game ticks) with a level 1 shield to 10.2 seconds (17 game ticks) with a level 90 shield. For every 10 levels of shield, one extra tick is added to the duration." → ticks = 8 + floor(tier / 10) (T40 → 12 ticks = 7.2 s, T60 → 14 ticks = 8.4 s, T70-75 → 15 ticks = 9 s, T90 → 17 ticks = 10.2 s, matches wiki table). Defender: half tier (T90 defender → as T45 → 12 ticks 7.2 s).
- **MODIFIES OTHER ABILITIES**: Revenge still gains stacks from blocked hits; "Barricade will block recoiled damage" of Onslaught ("Intercept and barricade combined also block this damage").
- **IS MODIFIED BY**: "The Turtling perk extends the duration of this ability in exchange for increasing its cooldown, up to a 13.8 second duration and a 84 second cooldown." (Turtling 4 at T90: 13.8 s / 84 s; at T40: 9.6 s; T60: 11.4 s; T70: 12 s). "The Malletops perk from the Anachronia Dinosaur Farm extends the duration of Barricade by 1.8 seconds per tier, and stacks with the Turtling perk, offering an additional 3.6 seconds at the maximum tier of 2." Max: T90 + Turtling 4 + 2× Malletops = 17.4 s / 84 s. Ring of vigour / CoE refund adrenaline.
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Barricade (status)": "4.8-10.2 seconds or until the current shield/defender is unequipped"; "Prevents all damage received".
- **Other**: Heal Other/Group still works through Barricade (cooldown added to those spells instead).

## A15. Natural Instinct

Source: https://runescape.wiki/w/Natural_Instinct and https://runescape.wiki/w/Natural_Instinct_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Single target, `adrenaline = -100`, `cooldown = 120` s (200 ticks), duration "34 ticks" = 20.4 s. Level 85 Defence, members, no equipment. From The World Wakes.
- **Tooltip**: "Leech the targets energy. Steal the target's adrenaline and grant yourself the same amount. If the target does not have adrenaline to leech, increase your adrenaline gain by 100%. 20.4s duration."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (target required).
- **REQUIREMENTS**: 100% adrenaline (90% with ring of vigour per Template:Ultimate ability adrenaline "Natural Instinct 100 / 90 / 80"); a target.
- **Effects (verbatim)**: PvP: "It steals all adrenaline from the user's opponent, transferring it to the user. If used on a player in Classic Combat Mode, their special attack energy will be drained instead." PvM: "doubling the user's adrenaline gain for 20.4 seconds. This affects most sources of adrenaline such as basic abilities, Divert, and Telos' green anima stream, but does not affect adrenaline potions, Meteor Strike, or the Vestments of havoc armour effect." Adrenaline page: "+1-100% based on target's adrenaline, -1–100% to target, also doubles player's adrenaline gain from non-potion sources". Jaws of the Abyss: "Natural Instinct will double this passive effect."
- Monsters that use the PvP (steal) effect instead: Nex's praesuls, Erethdor / Manifestations of Erethdor (Solak), some Temple of Aminishi monsters; Cadarn rangers/magi use adrenaline.
- **MODIFIES OTHER ABILITIES**: Divert (up to 100% per block), all basic abilities (+9 → +18), Sacrifice/Storm Shards/Tuska's Wrath basic gains, Siphon presumably (not stated).
- **IS MODIFIED BY**: ring of vigour / CoE refund. "Natural Instinct will no longer deactivate when transitioning between boss phases." (2019). "The effect of the Natural Instinct ability is now cleared upon initiating a fight in PvP." (2016).
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Natural Instinct (status)" – trigger "against targets that don't use adrenaline", 20.4 s, "Increases adrenaline gain by 100%". (No buff in the PvP steal case – instantaneous.)
- **Other**: "one can gain 150-200% adrenaline (assuming no solid food was eaten ...) in the uptime".

---

# PART B – CONSTITUTION ABILITIES

## B1. Limitless

Source: https://runescape.wiki/w/Limitless and https://runescape.wiki/w/Limitless_(status)

- **Type / adrenaline / cooldown / duration**: `type = Utility` (page text calls it "a basic Constitution ability"), Self, `adrenaline = 0`, `cooldown = 90` s (150 ticks), duration "10 ticks" = 6 s. Level 1 Constitution, members. Unlock: limitless ability codex (2,000 vital sparks).
- **Tooltip**: "Open your mind and realise your potential. Threshold abilities no longer require 50% adrenaline. 6s duration. Can be cast during the global cooldown. Must be manually triggered during revolution combat."
- **Channelled?** No. **GCD?** "It has a 90-second cooldown and can be used during, and does not incur, the global cooldown. It has no animation." **Out of combat?** Not stated; it generates no adrenaline so it cannot be used to stall.
- **REQUIREMENTS (verbatim)**: "Limitless cannot be activated if the player has 60% or more adrenaline; the message 'You have over 60% adrenaline so Limitless fails to activate.' appears if this is attempted. It cannot be used inside the Clan Wars Red portal." (Exact boundary at exactly 60% is ambiguous: text says "60% or more", message says "over 60%".)
- **What it does after the modernisation (verbatim)**: "When activated, for 6 seconds all threshold abilities can be used without the 50% adrenaline requirement - only requiring 15% adrenaline instead." / "Since Magic, Melee and Ranged threshold abilities were removed following the Combat Style Modernisation on 2 March 2026, limitless now only affects a few Defence and Constitution abilities." → affected set: **Devotion, Revenge, Reflect, Debilitate, Shatter, Reprisal** (the only remaining threshold abilities per Template:Defence abilities / Template:Constitution Abilities). Enhanced abilities of the three styles are not affected (they already have no 50% gate).
- "The ability does not generate nor consume adrenaline and deals no damage."
- **MODIFIES OTHER ABILITIES**: the six threshold abilities above (activation requirement 50% → 15%; cost remains −15%).
- **IS MODIFIED BY**: none.
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Limitless (status)" 6 s: "Allows the use of abilities with 15% instead of 50% adrenaline".
- **Update history**: hotfix 13 April 2026 "Fixed an issue that was not allowing the limitless ability to be triggered correctly."

## B2. Sacrifice

Source: https://runescape.wiki/w/Sacrifice

- **Type / adrenaline / cooldown**: Basic, Single, `adrenaline = 9`, `cooldown = 30` s (50 ticks), damage "65-75%" (avg 70%). Level 1 Constitution, F2P, no equipment. From One Piercing Note.
- **Tooltip**: "Offer a sacrifice, leaving the target forsaken. 65-75% damage. Heals you for 25% (On killing blow: 100%) of the damage dealt. PvP: Disables the target's Protection Prayers for 8 ticks (4.8 s)."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (target).
- **REQUIREMENTS**: target. "It can also be used without a weapon."
- **Effects (verbatim)**: "the player deals 65-75% ability damage to their target, disables the target's protection prayers for 4.8 seconds, and is healed by 25% of the damage dealt, or 100% if the ability kills the target." / "If the Swift gloves' extra shot passive effect activates while using Sacrifice, both hits will heal the player." / "The ability only bypasses protection prayers of other players. It will not hit through the prayers of monsters" / "Sacrifice will always heal the player for 25% of the damage dealt in PvP, and when the target dies it will heal the player for 100% of the damage dealt on top of that, essentially healing for 125% of the damage dealt in total." / "Sacrifice heals for 100% of the weapon damage dealt if the target is brought to 0 health, even if the target is not killed due to other mechanics, such as at Araxxor healing during first phase".
- **MODIFIES OTHER ABILITIES**: none (PvP prayer disable only).
- **IS MODIFIED BY**: "Berserk and similar effects can increase the damage of Sacrifice. In general, when Sacrifice's damage is increased, its healing is increased as well."; Natural Instinct doubles its +9.
- **SHARED COOLDOWNS**: none.
- **DEBUFF**: PvP protection-prayer disable 8 ticks.
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%." and "Now disable the target's protection prayers for 4.8s." 4 March 2024 "Damage range: 20-100% → 65-75%".

## B3. Siphon (Constitution ability)

Source: https://runescape.wiki/w/Siphon_(Constitution_ability) (note: https://runescape.wiki/w/Siphon is the Necromancy weapon type)

- **Type / adrenaline / cooldown**: Basic, Single, `adrenaline = 0`, `cooldown = 60` s (100 ticks), no damage. Level 20 Constitution, F2P, no equipment.
- **Tooltip**: "Siphon strength from the target. Steals 10% adrenaline from the target. Grants immunity to Siphon for 10 ticks (6 s)."
- **Channelled?** No. **GCD?** Normal (not stated as GCD-exempt). **Out of combat?** No (target).
- **REQUIREMENTS (verbatim)**: "It can only be used on players who have more adrenaline than the user."
- **Effects (verbatim)**: "When activated in PvP, it drains the target player's adrenaline by 10% and adds it to the siphoning player's. ... It also prevents the user from being affected by other players' Siphons for six seconds." / "It can be used in PvM against NPCs that have adrenaline. However, it does not drain the NPC's adrenaline; it only adds to the player's adrenaline." Adrenaline page: "Siphon: up to +10% to player, -10% to target".
- Does NOT generate the basic 9% (infobox adrenaline 0).
- **MODIFIES OTHER ABILITIES**: none. **IS MODIFIED BY**: none stated. **SHARED COOLDOWNS**: none. **BUFF**: Siphon immunity 6 s (self).
- Wilderness: skulls the user (2015 patch).

## B4. Tuska's Wrath

Source: https://runescape.wiki/w/Tuska%27s_Wrath

- **Type / adrenaline / cooldown**: Basic, Single, `adrenaline = 9`, `cooldown = 15` s ("25 ticks"), damage "75-85%" (avg 80%). Level 50 Constitution, members, no equipment. Unlock: Tuska's Wrath ability codex.
- **Tooltip**: "Invoke the wrath of Tuska on the target. 75-85% damage. If the target is your slayer assignment, the attack is empowered and deals 10,000% Slayer level damage. Empowered effect cooldown: 200 ticks (120 s). Damage cap: 15,000"
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (target). "The ability is also useful in PvM as it hits immediately, unlike many other basic abilities."
- **REQUIREMENTS**: target.
- **Non-task (verbatim)**: "When used on a monster that is not currently assigned or on a monster that is unaffected, the ability will deal 75-85% ability damage and have a cooldown of 25 ticks."
- **Slayer task (verbatim)**: "The ability deals damage equal to 10,000% of (or 100×) the player's Slayer level (including any stat changes) against their current Slayer assignment. This empowered effect is then put on a 200 ticks cooldown (shown in the chatbox: The empowered effect of Tuska's Wrath is on cooldown.). During the empowered effect cooldown, Tuska's Wrath can be used again, using the normal 75-85% damage range. Unlike other abilities, the damage cap of the empowered effect is 15,000 life points (rather than 30,000), and it cannot critically strike unless it is used after Greater Fury." / "The player will have access to Tuska's Wrath's empowered damage when carrying Slayer Wildcards against all non-boss Slayer targets." / "Every boss except the Magister is immune to the effects of Tuska's Wrath when on a Slayer task. Killing monsters for the special assignment of the Raptor does not trigger the empowered effects." / trivia: "Before the combat update of March 2024, splashing on a Slayer assignment creature did not apply the 120 second empowered effect cooldown." (i.e. now a splash still starts the empowered cooldown).
- **MODIFIES OTHER ABILITIES**: none. **IS MODIFIED BY**: Greater Fury (allows crit), Slayer level boosts, Natural Instinct (+9 doubled). **SHARED COOLDOWNS**: none; the empowered effect has its own separate 200-tick debuff-tracked cooldown ("The empowered effect now goes on cooldown, which is shown separately on the debuff bar.").
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."

## B5. Storm Shards

Source: https://runescape.wiki/w/Storm_Shards and https://runescape.wiki/w/Storm_Shards_(status)

- **Type / adrenaline / cooldown**: Basic, Single, `adrenaline = 9`, `cooldown = 30` s (50 ticks), `damage = 0% (stores 85%)`, equipment Any. Level 70 Constitution, members. Unlock: Mazcab ability codex / Storm Shards and Shatter codex.
- **Tooltip**: "Hurl a Storm Shard at the target. Applies 1 Storm Shards stack to the target for 80-90% damage. Maximum stacks: 10. Damage is 33% effective in PvP."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (target).
- **REQUIREMENTS (verbatim)**: "Up to ten Storm Shards can be stacked on a target at any given time, at which point the ability can no longer be activated against the target." (patch 19 Oct 2015 "Ability can no longer be used if 10 stacks are already applied to the target.")
- **Effects (verbatim)**: "If it hits the target, it will deal no damage, but instead apply 80-90% ability damage (an average of 85%), or 26.7-30% for an average of 28.3% in PvP situations, in the form of a Storm Shard stack. If it misses, no stacks are applied." / "Because Storm Shards deals 'stored' damage in preparation for Shatter, it deals no visible damage, and as such, is unaffected by critical strikes and damage-boosting abilities, with the exception of Chaos Roar. However, Shatter is affected by damage-boosting effects, with the exception of Chaos Roar."
- **Stack lifetime**: "Storm Shards stacks will clear if the user has been out of combat against the target for ten consecutive seconds." Status page: "Removed upon being hit by Shatter", "Removed upon exiting combat", "In PvP, removed if the user does not hit the target for 10 seconds". Bosses: most carry stacks across phases; Nex and Vorago clear on phase; Araxxi halves; Telos halves for phase 5. "The storm shards ability is now consistently cleared when an NPC dies".
- **MODIFIES OTHER ABILITIES**: Shatter (consumes stacks).
- **IS MODIFIED BY**: Chaos Roar (only damage boost that applies to the stored value); Freedom used by the (PvP) target halves the stacks ("the use of Freedom will halve the damage stored"); Natural Instinct (+9 doubled).
- **SHARED COOLDOWNS**: none.
- **BUFF/DEBUFF**: "Storm Shards (status)" – target debuff with stacks (max 10), no timer; self buff shows stack count on current target. "Activating Freedom halves the current number of stacks".
- **Update history**: 2 March 2026 "Adrenaline gain: 8% → 9%."; 4 March 2024 "Damage range: 75-95% → 80-90%".

## B6. Demoralise

Sources: https://runescape.wiki/w/Demoralise and https://runescape.wiki/w/Demoralise_(Open_Beta)

- **Status: NOT in the live game.** Two abilities carry this name:
  1. **Demoralise (Ranged basic, Scare Tactics)** – `{{Deleted content|update=March's Month Ahead & Combat Style Modernisation}}`, "removal = 2 March 2026". Former stats: Ranged basic, +8 adrenaline, 15 s cooldown, "65%-75% ability damage. Stuns and Binds the target for 2 ticks (1.2 s). Knocks-back the target by 1 tiles. Only 1x1 enemies are affected by knock-back." Shared cooldown with Backhand, Kick, Binding Shot, Impact, Shock. Update history: "2 March 2026 – Removed from game."
  2. **Demoralise (Open Beta) – Constitution threshold** – `{{Nonexistence}}`: "was a threshold ability that removed an opponent's protection prayer. It was only in the 2015 Open Beta, and was never released to the live game". Stats in beta: Constitution 37, Threshold, −15 adrenaline, 15 s cooldown, "Disable your opponents protection prayers for 5 seconds and dealing up to 150% weapon damage." Shared cooldown with Smash; only worked on Akrisae among NPCs. Template:Constitution Abilities lists it under "Unreleased".
- For the simulator: **do not implement** (neither version exists post-2 March 2026). The prayer-disable role moved to Sacrifice (PvP, 4.8 s).

## B7. Shatter

Source: https://runescape.wiki/w/Shatter

- **Type / adrenaline / cooldown**: Threshold, Single, `adrenaline = -15`, `cooldown = 120` s (200 ticks), damage Varies, equipment Any. Level 70 Constitution, members.
- **Tooltip**: "Shatter any shards on the target. Consumes all Storm Shards stacks on the target and deals 100% of the total damage applied."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** No (target).
- **REQUIREMENTS**: 50% adrenaline (15% under Limitless); target. Stacks not required to activate, but: "If Shatter is used on a target with no Storm Shard stacks, adrenaline will be lost, but the ability will not initiate cooldown."
- **Effects (verbatim)**: "When Shatter hits a target with a stack of Storm Shards, all stacked up damage is applied in one hitsplat, dealing up to a maximum of 30,000 damage. With the maximum of ten Storm Shard stacks against a monster, Shatter deals 800% to 900% ability damage (an average of 850%). Shatter does work in PvP, although the target's use of Freedom halves the number of Storm Shards and consequently their damage received. With ten Storm Shard stacks in a PvP situation, Shatter deals 266.7% to 300% ability damage". / "If Shatter critically strikes, it will deal increased damage according to number of Storm Shard stacks." / "Shatter is not affected by Chaos Roar, but is affected by damage boosting ultimates and Rend if used with gloves of passage or its enhanced version."
- **MODIFIES OTHER ABILITIES**: consumes Storm Shards stacks.
- **IS MODIFIED BY**: damage-boosting ultimates, Rend + gloves of passage, critical strikes; NOT Chaos Roar; Limitless (activation gate).
- **SHARED COOLDOWNS**: none.
- **BUFFS/DEBUFFS**: removes Storm Shards debuff.
- **Damage cap**: 30,000 (hit cap).

## B8. Reprisal

Source: https://runescape.wiki/w/Reprisal and https://runescape.wiki/w/Reprisal_(status)

- **Type / adrenaline / cooldown / duration**: Threshold, Single, `adrenaline = -15`, `cooldown = 60` s (100 ticks), duration "10 ticks" = 6 s, damage Varies. Level 85 Constitution, members, no equipment. Unlock: Reprisal ability codex (Telos).
- **Tooltip**: "Use the targets power against them. Stores 100% of damage taken over 10 ticks (6 s). After the duration, deals 100% of the damage stored. Can be recast within its duration. Damage dealt has diminishing returns in PvP."
- **Channelled?** No – "Unlike Transfigure ... the player is not bound or stunned when using Reprisal and is free to perform other abilities and actions during its 6-second timeframe." **GCD?** Initial cast normal; "Triggering the ability manually a second time can be done outside of the global cooldown." Patch 21 Jan 2019: "Added a small delay after first activating the Reprisal ability so that its effect cannot be immediately triggered by accident." **Out of combat?** No (target); patch 14 March 2022 "Fixed an issue where Reprisal couldn't be activated without a target and with the ability queue turned on." implies activation without a target is possible with queueing on – not explained further.
- **REQUIREMENTS**: 50% adrenaline (15% under Limitless).
- **Effects (verbatim)**: "it tracks damage taken from all sources for up to 6 seconds. After this time, or when Reprisal is recast, the player attacks their target for 100% of the damage stored, with a damage cap of 30,000. The damage has diminishing returns in player versus player combat." / "Self-inflicted and both types of typeless damage will be tracked by Reprisal (e.g. Vorago's TeamSplit mechanic, which deals hard typeless damage). It does not count the damage healed or mitigated by Resonance." / "Reprisal is locked to the target it was initiated on ... Reprisal will still damage the target it was initiated on." / "Reprisal damage can be increased with Vulnerability." / "The effective attack range of the Reprisal ability has increased to 15 tiles." / "Reprisal now correctly deals magic damage with a staff or wand equipped." (damage style follows weapon).
- Status page conflict: "Can cause up to 10,000 damage (25,000 damage in PvP)" vs main page cap 30,000 – **ambiguous** (main page and hit cap suggest 30,000).
- **MODIFIES OTHER ABILITIES**: none. **IS MODIFIED BY**: Vulnerability; Resonance (mitigated damage excluded); Limitless.
- **SHARED COOLDOWNS**: none.
- **BUFF**: "Reprisal (status)" 6 s, "Ends early upon activating Reprisal again".

## B9. Transfigure

Source: https://runescape.wiki/w/Transfigure, https://runescape.wiki/w/Transfigure_(status), https://runescape.wiki/w/Transfigure_stun_immunity

- **Type / adrenaline / cooldown / duration**: Ultimate, Self, `adrenaline = -100`, `cooldown = 180` s (300 ticks). Self-stun "10 ticks" (6 s) then stun/bind immunity "25 ticks" (15 s). Level 1 Constitution, F2P, no equipment. From One Piercing Note.
- **Tooltip**: "Empower your body. Incapacitates you granting immunity to all damage. After 10 ticks heal for 250% of the damage mitigated and gain immunity to Stuns and Binds for 25 ticks." – note "Despite the description stating 'immunity to all damage', no such immunity is granted and damage is taken as normal."
- **Channelled?** Effectively yes (self-stun for 6 s; "all other abilities (including Freedom) are disabled"). **GCD?** Normal. **Out of combat?** Not in stalling list.
- **REQUIREMENTS (verbatim)**: "The ability cannot be used whilst immune to stuns." Status page: "Cannot be activated when immune to stuns: You cannot use this ability while immune to stuns." Stun page: "Transfigure cannot be activated while the player is already stunned or immune to stuns." → cannot be cast while Anticipation, Freedom, or a previous Transfigure immunity is active.
- **Effects (verbatim)**: "It stuns the user for 6 seconds, and when the stun ends, the player heals 250% of any damage taken during the stun, and becomes immune to stuns and binds for 15 seconds. The healing is capped at 75% of your maximum life points, taking armour and bonfire boosts into account." / "Transfigure takes into account all incoming damage, including typeless damage, self-inflicted damage (provided that the source of damage can be performed while stunned), and even the delayed damage-over-time from wearing masterwork armour. It is still possible to die while the effect is in place. Transfigure's bind only disables abilities and movement, meaning that it is still possible to eat and change prayers under its effect."
- **MODIFIES OTHER ABILITIES**: disables all abilities incl. Freedom for 6 s (message "You may not try and escape this stun early!"); status page also says "Puts abilities on cooldown" (unclear which – **ambiguous**).
- **IS MODIFIED BY**: ring of vigour / CoE (adrenaline refund, generic ultimate rule).
- **SHARED COOLDOWNS**: none.
- **BUFFS**: "Transfigure (status)" 6 s (binds, prevents attacking, prevents Freedom); then "Transfigure stun immunity" 15 s: "Grants immunity to stuns and binds" (Bound status: cannot be applied while active).

## B10. Guthix's Blessing

Source: https://runescape.wiki/w/Guthix%27s_Blessing and https://runescape.wiki/w/Guthix%27s_Blessing_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Self, `adrenaline = -100`, `cooldown = 300` s (500 ticks), "Heals you for 8% Maximum Life Points every 3 ticks. 15 ticks duration." (9 s). Level 85 Constitution, members, no equipment. From The World Wakes.
- **Channelled?** No (butterfly entity). **GCD?** Normal. **Out of combat?** Not in stalling list.
- **REQUIREMENTS**: 100% adrenaline.
- **Effects (verbatim)**: "a green butterfly is summoned which heals 8% of a player's maximum life points every 1.8 seconds for 9 seconds for a total of 40% of the player's maximum life points. The summoned butterfly can be easily killed by both player and non-player enemies, ending the healing effect prematurely. ... Players can only attack and kill the butterfly in the Wilderness or the Clan Wars." / "If the area where the ability was used is left, the healing effect will be cancelled." Status: "Removed upon moving away from the butterfly", "Removed if the butterfly is killed" ("The Guthix Blessing butterfly will now consistently follow you after teleporting.").
- **MODIFIES OTHER ABILITIES**: none.
- **IS MODIFIED BY**: Brief Respite perk (−5% cooldown per rank, −1% max LP healing per rank; "Ice Asylum will share the reduced cooldown, but the effect of the Enhanced Excalibur will retain its 5 minute cooldown"); ring of vigour / CoE.
- **SHARED COOLDOWNS**: "Guthix's Blessing shares a cooldown with Rejuvenate, Ice Asylum, and the effect of the Enhanced Excalibur."
- **BUFF**: "Guthix's Blessing (status)" 9 s.

## B11. Onslaught

Source: https://runescape.wiki/w/Onslaught

- **Type / adrenaline / cooldown**: Ultimate, Single, `adrenaline = -100` (infobox; in practice paid per hit – see below), `cooldown = 120` s (200 ticks), equipment Any, damage Varies, "damage cap of 30,000 per hit". Level 90 Constitution, members. Unlock: Mazcab ability codex / Onslaught codex.
- **Tooltip**: "Assault the target with unbridled power. 100-120% damage per hit every 2 ticks (1.2 s). 26 hits. Channeled. Deals an additional 18-22% damage with each hit. Consumes up to 25% adrenaline per hit. If you run out of adrenaline, 25% of the damage dealt will be dealt to self per hit. After 10 hits an additional 1,000 damage is dealt to self per hit."
- **Channelled?** YES. Max 26 hits, one every 2 ticks → up to 52 ticks (31.2 s). "Onslaught automatically stops once the number of stacks in the buff bar reaches 25 (for a maximum total of 26 hits), even if the player still has adrenaline left."
- **REQUIREMENTS**: Ultimate → 100% adrenaline to activate (Adrenaline page: "Onslaught will drain 25% adrenaline with each hit and is unaffected by the ring of vigour and Conservation of Energy."). Target required.
- **Per-hit damage**: hit n deals (100 + 18·(n−1))% to (120 + 22·(n−1))% ability damage (wiki table: hit 1 100–120%, hit 26 550–670%; cumulative average 26 hits = 26×110 + 325×20 = 9,360%).
- **Payment rules (verbatim)**: "The user initially pays 25% adrenaline per attack. When adrenaline reaches 0–24%, the visual effect changes to orange, and the user pays with life points instead, starting with 25% of damage dealt. If a player only has 1–24% adrenaline remaining, it will both be drained and the player will still take damage. Adrenaline saving effects, like the ring of vigour and Conservation of Energy relic power, do not affect Onslaught." / "The damage dealt to the caster is increased by 1,000 per attack past 10 hits (if the 12th attack dealt 10,000 damage, the caster paid 4,500 health)." → self-damage on hit n (n > 10, no adrenaline) = 0.25 × damage + 1,000 × (n − 10). / "The user does not pay for missed attacks, but missed attacks are still counted as attacks for the purposes of calculating damage increase and payment. In most situations where the target takes modified damage (a Reflecting Jellyfish takes 0% damage) the caster receives recoil damage as if they had inflicted 100% damage to the target."
- **What cancels the channel (verbatim)**: "Onslaught can be cancelled at any time by moving or using another ability, halting adrenaline drain and self damage." / "Moving while using melee will interrupt the channel, always." / "Drinking potions or eating food will interrupt the channel" / "Switching weapons; switching other equipment will not interrupt the channel" / "Soul Link ... being healed via Soul Link stops Onslaught" / "Immortality and Sign of life will revive players killed by the recoil damage, and a phoenix necklace will heal them when they fall below 20% maximum life points, but Onslaught will be interrupted" / "Being healed by Heal Other or Heal Group will interrupt the channel" / "Being healed by a calorie bomb interrupts the channel" / familiar special moves other than Vampyre bat interrupt / "Onslaught is now cancelled if the player activates a constitution crystal within the Fight Kiln." / "If using Onslaught while the player in the middle of movement, Onslaught will initiate then be immediately interrupted by the player's movement after just one strike. 25% adrenaline will be drained for the one successful hit."
- **Does NOT work with**: "The ring of vigour has no effect on the adrenaline drained." / "Berserk, Death's Swiftness, and Sunshine" / "Precise perk" / "Critical hits of Onslaught do not generate any adrenaline once recoil damage starts to be taken." / "Soul Split will not heal the user" (nor Eldritch crossbow Split Soul) / "Portents of restoration will not be activated by Onslaught's recoil damage" / "Ring of life will teleport players when they fall below 10% maximum health".
- **Works with**: scrimshaws of the elements/cruelty; chinchompas (AoE, "adrenaline/life points will be drained for every single target hit"); "Defender's passive effect can reduce recoil damage"; "Barricade will block recoiled damage" (also Intercept+Barricade); (superior) leviathan ring blocks the damage; healing that does not interrupt: Vampyrism, Enhanced Excalibur (can be activated mid-channel), Prism of Loyalty, gunkan/gumbo/baron shark passive, blood necklace, Ice Asylum, Vampyric blood essence, scrimshaw of vampyrism, Fortitude, Redemption, Snowy knight, familiar passive healing (Bunyip, Void spinner), Vampyre bat Vampire Touch, Onyx bakriminel bolts (e), Ring of death.
- **BUFF**: "Onslaught (status)" stack counter 1–25 on buff bar; "The onslaught buff icon now disappears after dying with the ability active."
- **SHARED COOLDOWNS**: none.
- **Update history**: 4 March 2024 "Initial hit damage range: 49.5-150% → 100-120%", "Additional damage range: 11-33% → 18-22%".

## B12. Ice Asylum

Source: https://runescape.wiki/w/Ice_Asylum and https://runescape.wiki/w/Ice_Asylum_(status)

- **Type / adrenaline / cooldown / duration**: Ultimate, Area, `adrenaline = -100`, `cooldown = 300` s (500 ticks), duration "36 ticks" = 21.6 s (status tooltip says 22.2 s – minor conflict), heals "every 6 ticks" (3.6 s). Level 91 Constitution, members, no equipment. Unlock: Codex Ultimatus.
- **Tooltip**: "Summon a healing crystal. Creates a 1x1 area at your location. Heals anyone within 7 tiles of the area for 0-7% of their Maximum Life Points every 6 ticks. 300% Maximum Life Points heal capacity. 36 ticks duration. Healing is increased the closer you are to the area."
- **Channelled?** No. **GCD?** Normal. **Out of combat?** Not in stalling list.
- **REQUIREMENTS**: 100% adrenaline; no target needed.
- **Effects (verbatim)**: distance uses "the square surrounding the crystal ... city metric"; table: distance 0 → 7%, 1 → 7%, 2 → 6%, 3 → 5%, 4 → 4%, 5 → 3%, 6 → 2%, 7 → 1%, 8+ → no heal. "Ice Asylum's healing takes place over 21.6 seconds and does not end even if the user is restored to full health" / "this ability will heal up to 42% of the user's health" (6 heals × 7%) / "Ice Asylum can heal up to a total health equal to 300% of the player's maximum health." / "Ironmen and Hardcore ironmen accounts do not receive the healing benefit from the crystal if it was generated by another player" / "The healing effect works through barriers".
- **MODIFIES OTHER ABILITIES**: heals during Onslaught without interrupting ("Ice Asylum, including one created by the user prior to starting Onslaught").
- **IS MODIFIED BY**: Brief Respite on Rejuvenate/GB ("Ice Asylum will share the reduced cooldown"); ring of vigour / CoE.
- **SHARED COOLDOWNS**: "It shares its cooldown with the abilities Rejuvenate and Guthix's Blessing, and the special effect of the enhanced Excalibur."
- **BUFF**: "Ice Asylum (status)" 21.6 s, "Removed if the crystal capacity is drained".

## B13. Essence of Finality

Source: https://runescape.wiki/w/Essence_of_Finality

- **Type / adrenaline / cooldown**: `type = Special`, target Varies, `adrenaline = Varies`, `cooldown = 0`, `equipment = Essence of Finality amulet`, no animation. Level 1 Constitution, members. Template lists it under "Special" (text calls it "a basic Constitution ability").
- **Tooltip**: "Harness the power of a special attack stored within an Essence of Finality amulet."
- **Channelled?** Depends on stored special. **GCD?** Same as the stored special (Granite maul stored spec usable during GCD: patch 29 Nov 2021). **Out of combat?** Only for specials that need no target (see Weapon Special Attack list). **PvP**: "The ability cannot be used in player killing situations."
- **REQUIREMENTS (verbatim)**: "It is usable if the player has an equipped Essence of Finality amulet or its ornamental counterpart with a stored special attack." / "It will still require the same amount of adrenaline as is necessary for the regular weapon." / "The player needs appropriate ammo to use their weapon in order to use the weapon special attacks stored within the amulet." / style must match: "allowing special attacks of the weapon stored in the amulet to be used with any weapon of the same style" (Weapon Special Attack page); hotfix 7 Sep 2020 "special attacks could be used with mismatched attack styles through the Essence of Finality amulet has been resolved".
- **Cost modifiers (verbatim)**: "the adrenaline cost can be reduced with a ring of vigour, asylum surgeon's ring, and the Relentless perk." / "Revolution will not automatically trigger the Essence of Finality".
- **Channel rules**: "If the amulet is unequipped during the channelled special attack that is stored within the amulet, the special attack will not finish and only deal part of its damage while still consuming the usual amount of adrenaline required for the special attack." / hotfix 24 Aug 2020: "Players can no longer use an Essence of Finality to cast a channelled weapon special attack, then switch to another Essence of Finality with a different weapon's special attack to trigger that on the same global cooldown cycle." / "Adrenaline will no longer be incorrectly refunded when swapping Essence of Finality amulets."
- **Equipment interactions**: Dharok's/Guthan's/Akrisae's set effects work; Torag's/Verac's don't; Ahrim's triggers on specials; halberd-type weapons enlarge AoE of Vine Call (3x3→5x5), Powerstab (5x5→7x7), Sweep (2x3→3x3), Spear Wall (3x3→5x5), Disrupt (3x3→5x5); mechanised chinchompas / Locate give 3x3 to most ranged specials (table: Chain Hit and Locate not affected; others yes); Crystal Rain enchanted-bolt effects only on arrow 1; staff of light/darkness specials persist after removing the amulet; element-providing staves lose rune benefit when consumed.
- **SHARED COOLDOWNS**: none listed; per-weapon spec cooldowns still apply (tracked by debuffs, e.g. Crystal Rain cooldown).
- Trivia: degrade-to-dust weapon equipped while using a stored spec loses 0.1% charge.

## B14. Weapon Special Attack

Source: https://runescape.wiki/w/Weapon_Special_Attack (+ rendered tables)

- **Type / adrenaline / cooldown**: `type = Special`, `adrenaline = Varies`, `cooldown = 0` (except list below), `equipment = weapons that have special attacks`. Level 1 Constitution, members.
- **Activation (verbatim)**: "To activate Weapon Special Attack, a weapon that possesses a special attack must be equipped. ... the name of the ability changes to the name of the special attack for that weapon". "The player can also click on the adrenaline bar on the Action bar to activate a special attack." (works while stunned – Stun page). "Special Attacks cannot be automatically activated by Revolution."
- **Cost rule (verbatim)**: "Each special attack requires a certain amount of adrenaline to use, which is also consumed on use. For example, the Korasi's sword's special attack, Disrupt, may only be used at 60% adrenaline, and once it is used, 60% adrenaline is drained." → requirement == cost.
- **Cooldown rule (verbatim)**: "Unless stated otherwise, there are no cooldowns for using special attacks; the current exceptions ... Abyssal vine whip (19.8 seconds), Dark Shard of Leng (15 seconds), Ek-ZekKil (60 seconds), Fractured Staff of Armadyl (60 seconds), Seren godbow (30 seconds), Staff of darkness (90 seconds), Zaros godsword (60 seconds), Death guard (30 seconds), Omni guard (60 seconds), Roar of Awakening (45 seconds), Devourer's Guard (60 seconds), Tumeken's Light (60 seconds)". Patch 3 Oct 2022: "Special attacks no longer have an internal cooldown matching the player's attack speed. This allows special attacks to be cast back-to-back".
- **Ring of vigour (verbatim)**: "The ring of vigour reduces both the adrenaline needed to perform a special attack and the final amount of adrenaline that is drained by 10%." Ring page: "a special attack that normally requires 50% adrenaline to activate would only require 45% adrenaline with the ring equipped. This also applies to special attacks used via the Essence of Finality." / for ultimates: "After an ultimate ability is used, 10% adrenaline will be retained. However, the appropriate amount of adrenaline needed to cast a given ultimate ability is still required." / "stacks additively with Conservation of Energy" / passive after Extinction, "does not stack with an equipped ring of vigour". Patch 3 April 2018: "The special attacks refund will no longer be affected by adrenaline boosts."
- **Asylum surgeon's ring**: 10% chance to reduce cost by 15% (additive), applies to specials and EoF. **Relentless**: chance per rank to not consume adrenaline.
- **No-target specials**: "Special attacks that require no target can now be activated ... Staff of Light, Staff of Darkness, Dragon Battleaxe, Zaros Godsword, Eldritch Crossbow".
- **Hit chance**: "Draconic Puncture ... provides a 15% (multiplicative) increase ... Twin fang ... decreases hit chance by 30%." 4 March 2024: "Removed a number of hidden buffs that increased your hit chance when using special attacks or ultimate abilities."
- **Stalling**: "Weapon Special Attacks cannot be released using different weapons." / "For special attacks that track their cooldowns by a debuff (e.g. Crystal Rain cooldown) then the cooldown does not begin" when stalled.
- **Modernisation**: "Most special attacks main effects are the same, with the damage numbers altered (usually increased)" for melee; magic unchanged (FSoA slightly reduced 9 March); "Only one ranged special attack was altered".

### Special attack adrenaline costs (rendered table, https://runescape.wiki/w/Weapon_Special_Attack)

Melee: Keenblade Aimed Strike 35; Armadyl godsword Armadyl's Judgement 50; Bone dagger Backstab 75; Zaros godsword Blackhole 50 (60 s cd); Dragon hatchet Clobber 30; Korasi's sword Disrupt 60; Dragon mace Draconic Blow 20; Dragon longsword Draconic Cleave 25; Dragon dagger Draconic Puncture 50; Dragon scimitar Draconic Slash 50; Abyssal whip Energy Drain 50; Ancient mace Favour of the War God 100; Vesta's longsword Feint 25; Dragon harpoon Fishstabber 100; Lava whip Get Over Here! 75; Annihilation Gravitate 60; Saradomin godsword Healing Blade 50; Zamorak godsword Ice Cleave 60; Dark Shard of Leng Icy Tempest 30 (15 s cd); Ek-ZekKil Igneous Showdown 50 (60 s cd); Rune claws Impale 25; Brackish blade Liquefy 50; Noxious scythe Mirrorback 100; Statius's warhammer Obliterate 50; Dragon 2h sword Powerstab 50; Granite maul Quick Smash 50 (usable during GCD); Dragon battleaxe Rampage 100; Saradomin sword Saradomin's Lightning 100; Dragon spear Shove 25; Dragon claw Slice & Dice 50; Vesta's spear Spear Wall 50; Barrelchest anchor Sunder 50; Tumeken's Light Sunfall Slam 40 (60 s cd); Dragon halberd Sweep 30; Varanus's Mercy The Final Flurry 50; Abyssal vine whip Vine Call 60 (19.8 s cd); Bandos godsword Warstrike 100; Darklight Weaken 50.

Ranged: Hand cannon Aimed Shot 35; Bow of the Last Guardian Balance by Force 30; Guthix bow Balanced Shot 35; Rune throwing axe Chain Hit 10; Seren godbow Crystal Rain 30 (30 s cd); Strykebow Deep Burn 25; Zanik's crossbow Defiance 40; Dark bow Descent of Darkness 65; Zamorak bow Destructive Shot 40; Morrigan's throwing axe Hamstring 50; Decimation Locate 35; Noxious longbow Mirrorback 100; Morrigan's javelin Phantom strike 50; Magic longbow Powershot 35; Saradomin bow Restorative Shot 30; Gloomfire bow Shadowfall 65; Seercull Soulshot 50; Eldritch crossbow Split Soul 25; Magic shortbow Twin fang 50; Quickbow Twin Shot 35.

Magic: Guthix staff Claws of Guthix 25; Obliteration Devour 50; Zamorak staff Flames of Zamorak 25; Staff of Sliske From the Shadows 50; Iban's staff Iban Blast 50; Fractured Staff of Armadyl Instability 50 (60 s cd); Zuriel's staff Miasmic Barrage 50; Noxious staff Mirrorback 100; Staff of darkness Power of Darkness 100 (90 s cd); Staff of light Power of Light 100; Penance trident Reap 45; Mindspike Rune Flame 35; Saradomin staff Saradomin Strike 25; Roar of Awakening Soulfire 35 (45 s cd); Armadyl battlestaff Tempest of Armadyl 50; Legatus's Emberstaff The Last Command 35.

Necromancy: Omni guard Death Essence 30 (60 s cd); Death guard (T70/80/90) Death Grasp 25 (30 s cd); Devourer's Guard Soul Crush 25 (60 s cd).

(Costs are % adrenaline; with ring of vigour multiply requirement and cost by 0.9.)

---

# PART C – Defence/Constitution mechanics summary (cross-ability rules)

Each rule: WHEN condition THEN effect (source).

**Adrenaline & activation**
1. WHEN a Defence/Constitution basic (Anticipation, Bash, Provoke, Freedom, Divert, Resonance, Preparation, Sacrifice, Tuska's Wrath, Storm Shards) is cast THEN +9% adrenaline (Divert/Resonance/Freedom/Anticipation/Preparation only "with a target" for the +9; Divert page: "normal adrenaline gain occurs when used with a target") (https://runescape.wiki/w/Combat_Style_Modernisation, https://runescape.wiki/w/Divert).
2. WHEN Provoke is cast during the GCD THEN it does not trigger a GCD and grants 0 adrenaline; post 9 March 2026 GCD-exempt abilities "no longer generate adrenaline" (https://runescape.wiki/w/Provoke, https://runescape.wiki/w/Update:Combat_Style_Refinements_%26_March_Marketplace_Drop).
3. WHEN Limitless is cast THEN Limitless is GCD-exempt, costs/generates 0 adrenaline, 90 s cooldown; for 6 s the threshold abilities Devotion, Revenge, Reflect, Debilitate, Shatter, Reprisal need only 15% adrenaline instead of 50% (cost stays 15%) (https://runescape.wiki/w/Limitless).
4. WHEN adrenaline ≥ 60% (wiki: "60% or more"; game message: "over 60%") THEN Limitless fails to activate (https://runescape.wiki/w/Limitless).
5. WHEN a threshold ability (Devotion, Revenge, Reflect, Debilitate, Shatter, Reprisal) is cast THEN requires 50% adrenaline, drains 15% (https://runescape.wiki/w/Threshold_abilities).
6. WHEN Devotion, Revenge or Reflect is cast out of combat (no target / target dead / out of combat stance > 10 s) THEN the 50% requirement still applies but the 15% is NOT drained; the cast refreshes combat stance (stalls adrenaline) (https://runescape.wiki/w/Adrenaline#Stalling). Reflect: "If a target is not selected, Reflect will not cost any adrenaline." (https://runescape.wiki/w/Reflect).
7. WHEN Shatter hits a target with 0 Storm Shards stacks THEN 15% adrenaline is lost but no cooldown starts (https://runescape.wiki/w/Shatter).
8. WHEN an ultimate (Immortality, Rejuvenate, Barricade, Natural Instinct, Transfigure, Guthix's Blessing, Onslaught, Ice Asylum) is cast THEN 100% required and drained; ring of vigour / Extinction passive retains 10% (requirement unchanged); Conservation of Energy refunds a further 10% (additive) (https://runescape.wiki/w/Ring_of_vigour, https://runescape.wiki/w/Template:Ultimate_ability_adrenaline).
9. WHEN Onslaught is channelling THEN 25% adrenaline per hit is paid instead of 100% up front; ring of vigour and Conservation of Energy have no effect; missed hits cost nothing but count towards hit number (https://runescape.wiki/w/Onslaught).
10. WHEN Natural Instinct is active vs a non-adrenaline target THEN all adrenaline gains except adrenaline potions, Meteor Strike and Vestments of havoc are doubled (basic +9 → +18, Divert up to 100%); vs a player/adrenaline-using NPC THEN steal all of its adrenaline instead (https://runescape.wiki/w/Natural_Instinct).
11. WHEN Siphon is used on a player with more adrenaline than the user THEN −10% target, +10% user, user immune to Siphon for 6 s; on an NPC with adrenaline THEN +10% user only; Siphon itself gives 0 basic adrenaline (https://runescape.wiki/w/Siphon_(Constitution_ability)).
12. WHEN Divert blocks a hit of D pre-mitigation damage with shield tier T (defender: T/2) THEN adrenaline = 0.8%·floor(min(D,3000)/(200−T)) + 0.6%·(multiples in 3001–6000) + 0.4%·(6001–9000) + 0.1%·(9001–12000), cap 50% (100% under Natural Instinct); soft typeless hits give 0 (https://runescape.wiki/w/Divert).
13. WHEN a weapon special attack (or EoF) is used THEN cost = requirement; ring of vigour → 90% of both; asylum surgeon's ring → 10% chance of −15% (additive); Relentless → chance of no cost; Revolution never triggers it (https://runescape.wiki/w/Weapon_Special_Attack, https://runescape.wiki/w/Essence_of_Finality, https://runescape.wiki/w/Adrenaline).
14. WHEN out of combat for 10 s THEN adrenaline drains 5% every 2 ticks (Adrenaline page intro; the "Using" list says per tick) unless Persistent Rage / Infernal Puzzle Box T3 / adrenaline urn; WHEN Anticipation, Freedom, Surge/Escape, Dive, Resonance/Divert (shield), Preparation (shield), Devotion/Revenge/Reflect are used within the 10 s combat stance THEN the stance is refreshed (https://runescape.wiki/w/Adrenaline).
15. WHEN food is eaten with a target THEN −3% adrenaline (was 10%) (https://runescape.wiki/w/Combat_Style_Modernisation).

**Cooldowns**
16. WHEN Resonance or Divert is cast THEN both go on the same 30 s (50-tick) cooldown ("Divert shares its cooldown with Resonance") (https://runescape.wiki/w/Divert).
17. WHEN Preparation is active (9.6 s, shield kept on) AND the player receives an attack that is not hard typeless THEN the remaining Resonance/Divert cooldown is reduced by 5 ticks (3 s); no other cooldowns are affected (https://runescape.wiki/w/Preparation). Preparation perk: +15% duration and cooldown per rank.
18. WHEN Rejuvenate, Guthix's Blessing, Ice Asylum or Enhanced Excalibur is used THEN all four share the cooldown (300 s); Brief Respite reduces Rejuvenate/GB cooldown 5%/rank (Ice Asylum shares the reduced value, Enhanced Excalibur stays 5 min) and reduces healing 1% max LP/rank (https://runescape.wiki/w/Rejuvenate, https://runescape.wiki/w/Guthix%27s_Blessing).
19. Anticipation (41 ticks) and Freedom (50 ticks) have INDEPENDENT cooldowns; Reflect (50), Devotion (100), Revenge (75), Debilitate (50), Immortality (200), Barricade (100/140 with Turtling), Natural Instinct (200), Shatter (200), Reprisal (100), Transfigure (300), Onslaught (200), Limitless (150), Siphon (100), Sacrifice (50), Tuska's Wrath (25), Storm Shards (50), Bash (25), Provoke (17) – no shared cooldowns stated for any of these (respective pages).
20. WHEN Tuska's Wrath hits (or splashes, post-March 2024) the current Slayer assignment while the empowered effect is off cooldown THEN damage = 100 × Slayer level (cap 15,000, no crit unless after Greater Fury) and a separate 200-tick empowered cooldown starts; the ability's own 25-tick cooldown is unchanged and normal 75–85% casts remain possible (https://runescape.wiki/w/Tuska%27s_Wrath).
21. WHEN Reprisal is recast while its 6 s buff is active THEN the stored damage is released immediately; the recast can be done outside the GCD but not within a short delay after the first cast (https://runescape.wiki/w/Reprisal).
22. WHEN a boss "defensive reset" (Yakamaru Quicksand, Vorago, Telos, Beastmaster etc.) occurs THEN active defensive buffs are cleared and defensive abilities are put on cooldown except Anticipation, Freedom and Preparation (https://runescape.wiki/w/Stun, https://runescape.wiki/w/Debilitate).
23. WHEN the player lobbies and logs back in THEN all cooldowns reset (used with Rejuvenate) (https://runescape.wiki/w/Cooldown, https://runescape.wiki/w/Rejuvenate).

**Shields**
24. WHEN a shield/defender is unequipped or swapped (even to an identical item) THEN Barricade, Immortality, Rejuvenate (also loses stat restore), Preparation, Resonance/Divert buffs, Revenge (all stacks) and shield-enhanced Debilitate end immediately (status pages of each; https://runescape.wiki/w/Barricade, https://runescape.wiki/w/Revenge, https://runescape.wiki/w/Debilitate).
25. WHEN Bone Shield is active THEN Resonance, Divert, Preparation, Reflect, Immortality, Rejuvenate, Barricade may be cast at necrotic-rune cost using the Bone Shield level as shield tier; Debilitate scales with it without rune cost; Bash and Revenge (offensive) still need a real shield/defender (https://runescape.wiki/w/Template:Bone_shield_table).
26. WHEN a defender/repriser/rebounder is used THEN tier is halved for Resonance, Divert, Barricade, Debilitate; Revenge gives 2.5%/stack; Immortality unchanged (respective pages).
27. Barricade duration ticks = 8 + floor(tier/10) (T90 → 17); +Turtling (up to 13.8 s at T90, cooldown 84 s); +1.8 s per Malletops tier (max 2) (https://runescape.wiki/w/Barricade). Debilitate duration: table in A11 (T90 shield 23 ticks; defender T90 18 ticks) + Bulwark. Resonance heal % = 50 + 0.5×tier.

**Damage reduction / healing interactions**
28. WHEN Devotion reduces a prayed-against hit to 1 THEN Resonance is not consumed by it; Disruption Shield is consumed and has priority over Resonance (https://runescape.wiki/w/Resonance).
29. WHEN Reflect is active THEN Resonance healing is computed after Reflect's 50% reduction and after prayers, but armour/Defence/spirit-shield reduction is ignored for the heal (https://runescape.wiki/w/Resonance); Reflect returns 50% (25% PvP) of pre-armour damage including damage healed by Resonance or blocked by Devotion (https://runescape.wiki/w/Reflect).
30. WHEN Resonance/Divert is active and several hits land on the same tick THEN only the first hit is converted, the others deal full damage; a hit of exactly 1 does not consume it (https://runescape.wiki/w/Resonance).
31. WHEN Reprisal is active THEN all damage taken (self-inflicted, soft and hard typeless) is stored except damage healed/mitigated by Resonance; Vulnerability increases the release hit; cap 30,000 (main page) (https://runescape.wiki/w/Reprisal).
32. WHEN Barricade is active THEN all damage (incl. soft and hard typeless, Onslaught recoil) is negated except Vorago challenge hit and Zuk challenge-failure damage; stuns still apply; Revenge still gains stacks from the blocked hits (https://runescape.wiki/w/Barricade, https://runescape.wiki/w/Revenge, https://runescape.wiki/w/Onslaught).
33. Damage-reduction stacking is multiplicative (Reflect 50% + spirit shield 30% → 65%) (https://runescape.wiki/w/Reflect).
34. Immortality 25% and Anticipation 10% reduce melee/magic/ranged/necro and soft typeless; Debilitate 50% reduces from its target incl. soft typeless, not hard typeless (https://runescape.wiki/w/Immortality, https://runescape.wiki/w/Debilitate).
35. WHEN Revenge is active THEN each attack received (hit, miss, blocked, Barricade-blocked; not hard typeless) adds 1 stack up to 10; +5% (2.5% defender) damage per stack; recast after a Raids-armour reset before expiry resets stacks to 0 (https://runescape.wiki/w/Revenge).
36. WHEN Sacrifice deals damage THEN heal 25% of it; if the target reaches 0 LP THEN heal 100% (PvP: 125% total); PvP target loses protection prayers 8 ticks (https://runescape.wiki/w/Sacrifice).
37. WHEN Storm Shards hits THEN store 80–90% ability damage per stack (26.7–30% PvP), max 10 stacks, not boosted by crit/ultimates except Chaos Roar; WHEN Shatter hits THEN deal the stored total (cap 30,000), boosted by damage ultimates/Rend+gloves of passage/crit, not Chaos Roar; stacks clear after 10 s out of combat vs target, on NPC death, at Nex/Vorago phase change, halved at Araxxi and Telos P5 (https://runescape.wiki/w/Storm_Shards, https://runescape.wiki/w/Shatter).
38. WHEN Onslaught hit n lands THEN damage (100+18(n−1))%–(120+22(n−1))%, cap 30,000; WHEN adrenaline < 25% THEN pay 0.25×damage LP (+1,000×(n−10) for n > 10) and drain any remaining adrenaline; auto-stop after 26 hits; cancelled by moving, any other ability, eating/potions, weapon switch, Heal Other/Group, calorie bomb, Soul Link heal, most familiar specials, Immortality/Sign of life revival, phoenix necklace (https://runescape.wiki/w/Onslaught).
39. WHEN Transfigure ends (after 6 s) THEN heal 250% of all damage taken during it, cap 75% max LP; no damage immunity during it despite tooltip (https://runescape.wiki/w/Transfigure).
40. Guthix's Blessing: 8% max LP every 3 ticks × 5 (40%), ends if the butterfly is killed (Wilderness/Clan Wars only) or the player leaves the area; Rejuvenate: 2.5% max LP per tick (40% total) and restores drained stats except Prayer/Summoning/Constitution; Ice Asylum: up to 7% max LP every 6 ticks × 6, capacity 300% max LP, keeps healing at full LP (respective pages).

**Stuns / binds / bleeds**
41. WHEN Freedom is cast THEN it removes stuns, binds and the listed DoTs, and grants stun + bind immunity for 10 ticks (6 s); it is the only ability usable while stunned; it cannot be cast during Transfigure's self-stun; it halves (removes ceil(n/2)) Storm Shards, Combust (Durzag), Drenched, Fatigued, Rage stacks on the user (https://runescape.wiki/w/Freedom, https://runescape.wiki/w/Stun, https://runescape.wiki/w/Transfigure).
42. WHEN Anticipation is cast THEN stun immunity for 17 ticks (10.2 s) + 10% damage reduction; it must be active BEFORE the stun lands and never removes existing effects; thieving stuns are unaffected (https://runescape.wiki/w/Anticipation, https://runescape.wiki/w/Stun).
43. WHEN Transfigure's self-stun expires THEN "Transfigure stun immunity" for 25 ticks (15 s): immune to stuns and binds (Bound cannot be applied) (https://runescape.wiki/w/Transfigure_stun_immunity, https://runescape.wiki/w/Bound_(status)).
44. WHEN the player is immune to stuns (Anticipation, Freedom, Transfigure immunity) or currently stunned THEN Transfigure cannot be activated ("You cannot use this ability while immune to stuns.") (https://runescape.wiki/w/Transfigure_(status), https://runescape.wiki/w/Stun).
45. WHEN Resonance/Divert/Barricade block a stunning attack THEN the damage is blocked but the stun still applies (https://runescape.wiki/w/Resonance, https://runescape.wiki/w/Barricade).
46. WHEN Freedom/Anticipation immunity is active as an Araxxor cleave, lava strykewyrm burrow or Nex smoke-phase attack begins THEN no drag; cocoon clicks 5 → 2 (https://runescape.wiki/w/Freedom, https://runescape.wiki/w/Anticipation).
47. Player stuns in PvP suffer diminishing returns (temporary stun immunity after several stuns); NPCs stunned by another NPC are immune to non-player stuns for 10 s (https://runescape.wiki/w/Stun).
48. WHEN Immortality revives the player THEN 40% max LP, 1.8 s damage immunity, temporary bind during the animation, teleblock removed in PvP, the 25% reduction ends (https://runescape.wiki/w/Immortality).

**Removed / non-existent**
49. Demoralise (Ranged basic stun) was removed on 2 March 2026; the Constitution "Demoralise (Open Beta)" never existed in the live game – neither should be implemented (https://runescape.wiki/w/Demoralise, https://runescape.wiki/w/Demoralise_(Open_Beta)).

---

# PART D – Ambiguities / conflicts found on the wiki

1. **Adrenaline drain rate out of combat**: intro says "5% every 2 ticks", the "Using" list says "-5% per tick" (https://runescape.wiki/w/Adrenaline).
2. **Anticipation vs binds**: tooltip/status say "Immune to stuns" only; the page text says "Outside of preventing of stuns and binds..."; Bound (status) lists only Freedom/Transfigure/Stun Immune as blockers. Recommend: Anticipation blocks stuns only, unless play-tested otherwise.
3. **Freedom immunity reliability**: "Freedom currently does not prevent a second stun within the 6 seconds it's intended to give stun immunity" vs status page "Grants immunity to stuns and binds" and Stun page "prevents further stuns and binds for another six seconds".
4. **Provoke adrenaline**: page says +9 when cast outside the GCD and 0 during it; 9 March 2026 hotfix says GCD-exempt abilities "no longer generate adrenaline" (examples given: Surge, Dive). Unclear whether Provoke is now always 0.
5. **Limitless threshold**: "cannot be activated if the player has 60% or more adrenaline" vs message "You have over 60% adrenaline".
6. **Rejuvenate duration**: infobox "every 1 tick over 17 ticks", status page "9.6s ... 40% in 16 instances", prose "over 10 seconds".
7. **Ice Asylum duration**: infobox 36 ticks (21.6 s) vs status tooltip "22.2s".
8. **Reprisal cap**: main page 30,000; status page "up to 10,000 damage (25,000 damage in PvP)".
9. **Transfigure "Puts abilities on cooldown"** (status page) – which abilities and for how long is not specified anywhere.
10. **Reprisal without target**: 2022 patch implies it can be activated without a target when ability queueing is on; not otherwise documented.
11. **Debilitate duration table** gives T10 shield = 15 ticks (a +2 jump from 13 at T1) while the prose says "+0.6 s per 10 shield levels"; the table is presumably authoritative.
12. **Natural Instinct + Siphon / Sacrifice heal**: NI's doubling of "most sources" is not enumerated beyond basics, Divert, Telos stream, Jaws of the Abyss.
13. **Weapon-spec cost table** is from the rendered page (template-generated); a few entries (e.g. Zamorak bow listed as "Destructive Shot" in the table but "Twin Shot" on the EoF page) should be double-checked per weapon page before use.
14. The Modernisation page and patch notes contain **no changes to any Defence/Constitution ability other than the 8% → 9% basic adrenaline increase and Sacrifice's new 4.8 s PvP prayer disable**; Limitless got a functional hotfix on 13 April 2026, Devotion a sanguine-crawler fix on 24 March 2026.
