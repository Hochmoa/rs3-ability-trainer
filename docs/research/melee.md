# RS3 Melee abilities — simulator spec (post Combat Style Modernisation, 2 March 2026)

Research date: 2026-09-03. Source: RuneScape Wiki (raw wikitext of every page, `?action=raw`), plus the
Combat Style Modernisation summary page and the 2 / 9 / 16 March 2026 patch notes. All quotations are
verbatim from the wiki. Tick = 0.6 s. "GCD" = global cooldown = 3 ticks (1.8 s).

Legend for the per-ability header line:
`type | adrenaline | cooldown | duration | channelled? | usable during GCD?`

Damage values are the **current live values** (9 March 2026 refinements applied). Where the wiki
contradicts itself or is silent, the item is marked **AMBIGUOUS** and repeated in the final section.

General rules that apply to every melee ability (sources in the summary section):

- Every basic/enhanced/ultimate melee ability "requires a melee weapon in main hand"
  (https://runescape.wiki/w/Melee_abilities).
- Every ability (except those explicitly marked "Can be cast during the global cooldown") triggers the
  3-tick GCD on activation. "This triggers from the moment of use, so after a channelled ability, the
  player can immediately use another ability." (https://runescape.wiki/w/Abilities#Cooldown)
- Enhanced abilities "don't generate adrenaline (usually consume it)" and "can be used as soon as the
  player has enough adrenaline" — there is no 50 % threshold gate any more
  (https://runescape.wiki/w/Combat_Style_Modernisation#All_styles).
- Basic abilities generate 9 % adrenaline by default (Adaptive Strike 12 %).

---

## 1. Dive

https://runescape.wiki/w/Dive

`Utility | 0 % | 20.4 s (34 ticks) | instant | not channelled | YES, usable during GCD`

- Infobox: "Dive forward. * Move up to 10 tiles towards tile. Can be cast during the global cooldown.
  Must be manually triggered during revolution combat." Requirement: 30 Agility, members only
  (27 July 2026: "The Dive ability is now only usable in P2P."). Equipment: "None".
- **Cooldown start rule**: "Unlike most abilities, the ability cooldown for Dive begins on successfully
  diving rather than on activating the ability. The cooldown will not be triggered at all if the player
  does not actually dive, for example due to obstructions, being in an area that does not allow movement
  abilities, or the player cancelling the targeting action by pressing Escape."
- "Dive can be used outside of the global cooldown. It generates no adrenaline."
- RESOURCES: none. Does not generate Bloodlust (it is a utility ability, not a basic).
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: "this ability is affected by the Mobile perk and Shadow's Grace relic, reducing the
  cooldown to 10.2 seconds."
- REQUIREMENTS: none beyond level; "The ability may be manually executed without any equipment
  requirements."
- SHARED COOLDOWNS: "Both abilities share the same cooldown" (Dive and Bladed Dive). "Dive also shares
  cooldowns with Surge and Escape if used in the Wilderness with PvP-enabled or other PvP-enabled areas."
  7 April 2026 patch: "Bladed Dive and Dive are unlinked and now appear as 2 separated abilities, they
  still share the same cooldown though."
- GREATER version: none.
- BUFFS/DEBUFFS: none.
- CHANNEL rules: not channelled.
- OTHER: Some boss mechanics reset movement-ability cooldowns (Template:Movement abilities reset) —
  out of scope for a dummy simulator.

## 2. Attack (basic attack)

https://runescape.wiki/w/Attack_(ability)

`Basic attack | +9 % | none (GCD only; infobox "cooldown = 1.8") | instant | not channelled | no`

- Infobox: "Attack the target. * 110%-130% Melee damage. * Generates 1 Bloodlust stack.
  * Generates 9% Adrenaline. Automatically triggered during combat." Level 1, equipment "Any",
  "It can be used when unarmed."
- CSM page: "Your basic melee attack. Automatically used when no other abilities are selected (full
  manual can toggle off automatic use). * 110-130% melee ability damage * Generate 1 Bloodlust stack
  * No cooldown (other than global cooldown)".
- Basic attacks page: "All basic attacks operate on a fixed 1.8 second global cooldown." "during
  Revolution, basic attacks are never used unless there are no other useable abilities within the action
  bar's specified Revolution size, even if basic attacks are placed first in the action bar."
- RESOURCES: generates 1 Bloodlust (2 during Berserk: "Basic attacks and basic abilities generate 2x
  Bloodlust stack", https://runescape.wiki/w/Berserk).
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: Berserk ×1.75; Chaos Roar (next melee ability); Fury/Greater Fury crit buff.
  **AMBIGUOUS – Meteor Strike**: CSM page says "Melee basic abilities generate 1.5× adrenaline (not
  Attack (ability))", but the Meteor Strike (status) page says only "Melee basic abilities generate 1.5x
  adrenaline" and the Basic attacks page says "any effect that applies to a basic ability will also apply
  to a basic attack". Treat the CSM wording (basic attack excluded) as the specific statement.
- REQUIREMENTS: none (works unarmed).
- SHARED COOLDOWNS: none. GREATER: none. BUFFS: none. CHANNEL: n/a.

## 3. Adaptive Strike

https://runescape.wiki/w/Adaptive_Strike

`Basic | +12 % | 5.4 s (9 ticks) | instant | not channelled | no`

- Three forms depending on weapon (infobox versions):
  - Main hand, no off-hand: "120%-140% Melee damage."
  - Two-handed: "120%-140% Melee damage to the target and up to 8 additional enemies in a cone in the
    attack direction."
  - Dual wield: "60%-75% Melee damage per hit. * 2 hits."
  - All: "Generates 1 Bloodlust stack. * Generates 12% Adrenaline."
- "All versions also generate one stack of Bloodlust and an additional 3% adrenaline (12% total)
  compared to other basic abilities."
- CSM: "9 ticks cooldown". Level 7.
- RESOURCES: +1 Bloodlust (2 during Berserk). +12 % adrenaline (×1.5 under Meteor Strike).
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: Berserk, Chaos Roar (Chaos Roar "will boost the damage from all hits of multi-hitting
  abilities … and all hits of area of effect abilities" → both DW hits / all cone targets), Greater Fury
  (only one hit / main target guaranteed crit), Meteor Strike adrenaline ×1.5.
- REQUIREMENTS: any melee main hand; form determined by 2h / dual-wield / main-hand-only.
- SHARED COOLDOWNS: none. GREATER: none. BUFFS: none. CHANNEL: n/a.
- OTHER: replaced Decimate and Cleave.

## 4. Rend

https://runescape.wiki/w/Rend

`Basic | +9 % | 10.2 s (17 ticks) | instant | not channelled | no`

- Infobox: "Slice through the target. * 135%-165% Melee damage. * Generates 2 Bloodlust stacks.
  * Generates 9% Adrenaline." Level 18, equipment "Any".
- RESOURCES: **+2 Bloodlust** (4 during Berserk — Bloodlust page: "whilst active causes basic abilities to
  grant twice the usual number of stacks").
- MODIFIES OTHER ABILITIES: none directly. Equipment: "Gloves of passage / Enhanced gloves of passage: A
  successful hit with Rend triggers the Enduring Ruin passive effect: Your next melee attack used within
  6 seconds deals 10% additional damage. The target receives the Corrupted Wounds debuff for 10.2
  seconds, causing them to take 20% additional damage from bleeds (does not apply in PvP)." (16 % / 25 %
  with Enchantment of agony.)
- IS MODIFIED BY: Berserk, Chaos Roar, Fury/Greater Fury, Meteor Strike ×1.5 adrenaline.
- REQUIREMENTS: none. SHARED: none. GREATER: none. BUFFS: none (gloves only). CHANNEL: n/a.

## 5. Fury

https://runescape.wiki/w/Fury

`Basic | +9 % | 15 s (25 ticks) | instant | not channelled | no`

- Infobox: "Swing your weapon at the target with fury. *110-130% melee ability damage. *Increases the
  Critical Strike Chance of your next Melee attack by 25%. *Generates 1 Bloodlust stack. *Generates 9%
  Adrenaline." Level 21.
- "players deal damage equal to 110%-130 of ability damage to their target and their next melee attack
  has +25% chance to critically strike."
- RESOURCES: +1 Bloodlust.
- MODIFIES OTHER ABILITIES: next melee attack +25 % crit chance. Critical strike page: "For the next Melee
  hit after using Fury."
- **AMBIGUOUS**: no duration is given anywhere for the Fury +25 % buff (the old "Fury (status)" page was
  removed 4 March 2024). Greater Fury's buff is 25 ticks; assume the same or "until next melee hit".
  Also not stated whether bleeds consume it (Greater Fury explicitly is not consumed by bleeds).
- IS MODIFIED BY: Berserk, Chaos Roar, Meteor Strike.
- REQUIREMENTS: none. SHARED: none.
- GREATER: "Fury can be upgraded to Greater Fury through the use of a Greater Fury ability codex" —
  upgrade replaces Fury (see Greater Fury).
- BUFFS: "+25% crit on next melee attack" (self). CHANNEL: n/a (single hit since 4 March 2024).

## 6. Greater Fury

https://runescape.wiki/w/Greater_Fury

`Basic | +9 % | 15 s (25 ticks) | buff 25 ticks | not channelled | no`

- Infobox: "Strike at the target with unmatched fury. * 120%-140% Melee damage. * Your next Melee attack
  within 25 ticks is guaranteed to Critically Strike. * Generates 1 Bloodlust stack. * Generates 9%
  Adrenaline." Level 21, members.
- Status page https://runescape.wiki/w/Greater_Fury_(status): duration "15 seconds; Removed after dealing
  a critical strike", effect "Guarantees a critical strike on the next non-bleed Melee ability."
  4 March 2024: "Is now granted by Greater Fury, regardless of whether it is a critical strike or not."
- Consumption rules (Mechanics section): "the next non-bleed melee attack used that hits in the next 15
  seconds has a 100% chance to critically strike … If the next ability used is a channeled ability, only
  the first hit of the channeled ability will receive the critical hit chance boost from Greater Fury.
  Multi-hit abilities like Hurricane will only have one guaranteed critical strike. Area-of-effect
  abilities will only have the guaranteed critical strike applied to the main target."
- "Bleed abilities are not affected by the guaranteed effect of Greater Fury. If a bleed ability is used
  following Greater Fury, the guaranteed Critical strike buff is not consumed."
- Note "that hits" — the buff is consumed by a hit that lands (a miss presumably does not consume it;
  the wiki does not state this explicitly → **AMBIGUOUS**).
- RESOURCES: +1 Bloodlust.
- MODIFIES OTHER ABILITIES: next non-bleed melee hit = guaranteed crit (one hit only).
- IS MODIFIED BY: Berserk, Chaos Roar, Meteor Strike.
- GREATER vs Fury: 120-140 % instead of 110-130 %; guaranteed crit instead of +25 %; explicit 25-tick
  window. Replacement: "It is unlocked by reading a Greater Fury ability codex … If a player who has
  unlocked Greater Fury enters a non-members' world, it will temporarily return to Fury" → the codex
  upgrades the single ability; both cannot coexist on the bar.
- BUFFS: "Greater Fury (status)" self buff, 25 ticks, no stacking, removed on crit.
- OTHER: Greater Barge DoT'd channels can crit ("channelled enhanced abilities under the effects of
  Greater Barge are not considered bleeds and may critically strike", https://runescape.wiki/w/Critical_strike).

## 7. Backhand

https://runescape.wiki/w/Backhand

`Basic | +9 % | 15 s (25 ticks), 2 charges from 54 Attack | stun 3 ticks | not channelled | no`

- Infobox: "Strike the target with the back of the hand. * 95%-105% Melee damage. * Stuns and Binds the
  target for 3 ticks. * (With Scare Tactics enabled) Knocks back the target by 1 tile. * Generates 1
  Bloodlust stack. * Generates 9% Adrenaline. (With at least level 54 Attack) Maximum charges: 2."
  Level 31.
- "A second charge of Backhand is gained at level 54." Patch notes 2 March 2026: "Gains a second charge at
  Level 54". (**AMBIGUOUS**: the CSM summary table says "Second charge unlocked at level 70 Attack" —
  the ability page and official patch notes say 54; use 54.)
- CSM "All styles": "Basic stuns remain, and unlock a second charge allowing the player to use them twice
  before needing to wait for the cooldown (similar to Double Surge)."
- "Backhand hits the tick after it was activated."
- RESOURCES: +1 Bloodlust.
- MODIFIES OTHER ABILITIES: none (Punish no longer has a stun bonus).
- IS MODIFIED BY: Flanking perk ("Backhand is one of the abilities that benefits from the Flanking
  perk."); Berserk; Chaos Roar; Greater Fury.
- REQUIREMENTS: "Now requires a melee weapon to be activated." (2015 patch).
- BUFFS/DEBUFFS: Stunned + Bound on target, 3 ticks (1.8 s). Stun page: "Stuns and binds for 1.8
  seconds." Bound "Can be removed by activating Freedom … Barge or Greater Barge". Stun-immune targets
  ignore the stun. Cannot be applied to a target under Freedom.
- SHARED: none. GREATER: none. CHANNEL: n/a.

## 8. Punish

https://runescape.wiki/w/Punish

`Basic | +9 % | 24 s (40 ticks) | instant | not channelled | no`

- Infobox: "Slash at the target unexpectedly. * 110%-130% Melee damage. * Generates 1 Bloodlust stack.
  * Deals 2.5x damage if the target's Life Points are below 50%. * Generates 9% Adrenaline." Level 60.
- "the player deals 110-130% ability damage increased by 2.5x (to 275-325% ability damage, average 300%)
  if the target is below 50% health."
- RESOURCES: +1 Bloodlust ("Punish now generates only 1 stack unconditionally" — beta 3).
- REQUIREMENTS (for bonus): target LP < 50 % of max. No stun/bind condition any more.
- IS MODIFIED BY: Berserk, Chaos Roar, Greater Fury.
- SHARED: none. GREATER: none. BUFFS: none. CHANNEL: n/a.

## 9. Barge

https://runescape.wiki/w/Barge

`Basic | +9 % | 20.4 s (34 ticks) | bind 11 ticks | not channelled | no`

- Infobox: "Run up and ram the target. * Move up to 10 tiles towards the target. * 75%-95% Melee damage.
  * Clears Bound debuff. * Binds the target for 11 ticks. * Generates 1 Bloodlust stack. * Generates 9%
  Adrenaline." Level 65.
- "the player breaks free of all binds (but not stuns) and charges to their target, dealing 75-95%
  ability damage and binding them for 6.6 seconds. Barge has a maximum range of 10 squares."
- "Barge hits 1 tick after it was activated."
- RESOURCES: +1 Bloodlust.
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: "The Mobile perk and the Shadow's Grace relic power halve its cooldown to 10.2 seconds."
  Berserk, Chaos Roar, Greater Fury.
- REQUIREMENTS: needs a target ("the player has to target something in order to barge into them").
  Cannot be used while stunned (stun blocks all abilities except Freedom).
- SHARED COOLDOWNS: "Barge does not share a cooldown with Surge, Escape, and (Bladed) Dive" (even in
  PvP).
- GREATER: "Barge can be upgraded to Greater Barge through the use of a Greater Barge ability codex."
  Greater Barge page: "replacing the former ability" → not both on the bar.
- DEBUFFS: Bound on target 11 ticks (6.6 s). Self: clears own Bound.
- CHANNEL: n/a.

## 10. Bladed Dive

https://runescape.wiki/w/Bladed_Dive

`Basic | +9 % (0 % if cast during GCD) | 20.4 s (34 ticks) | instant | not channelled | YES (no damage/adrenaline then)`

- Infobox: "Dash forward striking the enemies around you. * Move up to 10 tiles towards enemy or tile.
  * 75%-95% Melee damage to the target and up to 8 additional enemies within 1 tile of you. * Enemies
  hit will reset the cooldown of Bladed Dive if they die within 10 ticks. * Generates 9% Adrenaline. Can
  be cast during the global cooldown but will not generate adrenaline or deal damage. Must be manually
  triggered during revolution combat." Level 65, members, equipment "Dual wield".
- "Bladed Dive may be used outside of the global cooldown. If used this way, it deals no damage and
  generates no adrenaline. Using Bladed Dive in this manner does not trigger Impatient. If any target
  dies within 6 seconds after Bladed Dive damaging them, the ability's cooldown is reset, immediately
  allowing Bladed Dive to be used again."
- "Choosing a ground tile instead of a monster results in the player leaping to that tile, dealing no
  damage."
- RESOURCES: **no Bloodlust** — Bloodlust page: "All Melee basic abilities, with the exception of Bladed
  Dive, generate 1 stack"; CSM: "remains a basic (generates 9% adrenaline), but does not generate
  Bloodlust stacks".
- MODIFIES OTHER ABILITIES: resets its own cooldown on a kill within 10 ticks.
- IS MODIFIED BY: Mobile / Shadow's Grace → 10.2 s. Halberd + laceration boots → 5x5 AoE. Berserk,
  Chaos Roar (AoE — all targets), Greater Fury (main target only).
- REQUIREMENTS: "Dual-wielding melee weapons or selected skilling items … or Equipping laceration boots …
  and any main-hand melee weapon." Attack level 65 (boosts count).
- SHARED COOLDOWNS: "Bladed Dive shares cooldown with Dive. It also shares cooldowns with Surge and
  Escape if used in the Wilderness or other PvP-enabled areas". Not with Barge.
- GREATER: none. BUFFS: none. CHANNEL: n/a.
- OTHER: "Bladed Dive is not activated as soon as its keybind is pressed … Pressing the escape key before
  selecting a location cancels Bladed Dive." Movement-stall exempt (Ability queueing page).

## 11. Greater Barge

https://runescape.wiki/w/Greater_Barge

`Basic | +9 % | 20.4 s (34 ticks) | bind 11 ticks; Endless Assault 10 ticks | not channelled | no`

- Infobox: "Run up and ram the target. * Move up to 10 tiles towards the target. * 75%-95% Melee damage.
  * Clears Bound debuff. * Binds the target for 11 ticks. * Deals an additional 5%-7% Melee damage for
  every 1 tick since your last attack. * After 8 ticks since your last attack, your next Channelled
  ability cast within 10 ticks is dealt as Damage over time. * Generates 1 Bloodlust stack. * Generates 9%
  Adrenaline. Maximum additional damage duration: 10 ticks."
- Damage ramp: "for each tick (0.6 seconds) since the player has stopped attacking their target, Greater
  Barge's damage range is increased by 5-12% (the tooltip incorrectly states 5-7%), capping at 10 ticks
  (6 seconds) for a range of 125-165% ability damage." **AMBIGUOUS**: the prose says 5-12 %/tick but its
  own table and the 125-165 % cap use 5-7 %/tick (75+50 / 95+70). Use 5-7 % per tick (max +50 / +70).
  Re-checked 2026-09-05: the page's per-tick table (0 → 75–95 %, 1 → 80–102 %, … 10 → 125–165 %) is
  exactly +5 / +7 per tick; "5-12%" in the prose has no table behind it, so the rule keeps 5–7.
  Analysis: "Greater Barge's damage is based on the time since the player has moved off their target
  (either by moving away, or by using Surge, Escape, or Bladed Dive)." Opening attack from out of combat
  = full 125-165 %. "If already engaged in combat, Greater Barge effectively becomes a minimum of a
  80%-102% damage ability in normal use".
- Endless Assault trigger: "If this period of time has been at least 4.8 seconds (8 ticks), indicated by
  the buff icon Greater Barge (self status), Greater Barge gains another effect: using it as the next
  ability grants the player the Endless Assault buff, causing the first melee channeled ability (Assault,
  Flurry, or Greater Flurry) used within 6 seconds (10 ticks) of casting Greater Barge to deal its damage
  as damage over time, as opposed to being a channeled ability. This does not, however, change the ability
  to be considered a Damage Over Time ability — it retains its original classification."
- "The ability's tooltip is partially incorrect - it states that the player has to be in combat with a
  target and wait for the buff icon for the secondary effect to activate, but it may be used as an initial
  attack and the secondary effect will still activate."
- Status pages: Greater Barge (status) https://runescape.wiki/w/Greater_Barge_(status): "Applied to
  players out of combat with their target for at least 4.8 seconds if you have Greater Barge unlocked",
  "Removed upon attacking your target". Endless Assault https://runescape.wiki/w/Endless_Assault:
  duration "6 seconds; Removed upon using a melee channelled ability".
- DoT'd channel behaviour: "This means that another ability can be used once this effect is consumed
  without cancelling out the channeled ability used to consume the Greater Barge effect. Critical strikes
  and damage boosting effects will also increase the damage dealt from these hits." "Channelled abilities
  under the Endless Assault effect now deal hits using the normal hit timings of the ability" (4 March
  2024). "When using Flurry or its stronger variant with Greater Barge's effect, the AoE effect is
  completely removed, converting all hits to standard attacks against the player's current target."
  Abilities page: "Unlike the rest of DoT abilities, these abilities are affected by damage modifiers such
  as Berserk in the same way as their normal, channelled versions." Greater Flurry page: "the ability will
  extend the duration of Berserk as usual, however it will not act as an area-of-effect".
  "unequipping or changing the weapon during the damage-over-time effect will alter the damage due to the
  nature of this ability rolling each hit."
- Last-tick rule (https://runescape.wiki/w/Ability_queueing): "if the player attempts to cast one of these
  melee combo abilities on the last game tick of the buff, it will not be applied as DoT and instead will
  be cast as a normal channelled ability" — applies to queued / Revolution casts only; a manual cast on
  the last tick works.
- "Greater Barge hits 1 tick after it was activated."
- RESOURCES: +1 Bloodlust. Note: Bloodlust is still consumed by the DoT'd Assault/Flurry as normal (not
  stated otherwise).
- MODIFIES OTHER ABILITIES: Assault / Flurry / Greater Flurry → converted to DoT (un-cancellable, another
  ability may be used in parallel, Flurry loses AoE, Greater Flurry still extends Berserk).
- IS MODIFIED BY: Mobile / Shadow's Grace → 10.2 s; Berserk; Chaos Roar; Greater Fury.
- REQUIREMENTS: target; Greater Barge codex.
- SHARED COOLDOWNS: "it does not share a cooldown with Surge, Escape, Dive, and Bladed Dive in the
  Wilderness."
- GREATER vs Barge: adds ramp damage (+5-7 %/tick off-target, max 10 ticks) and the Endless Assault
  conversion; otherwise identical. Replaces Barge.
- BUFFS: Greater Barge (status) self (no timer, until you attack); Endless Assault self 10 ticks; Bound
  on target 11 ticks.

## 12. Chaos Roar

https://runescape.wiki/w/Chaos_Roar

`Basic | +9 % | 60 s (100 ticks) | buff 12 ticks | not channelled | no`

- Infobox: "Release a savage war cry, empowering your next strike. * 100%-120% Melee damage. * Your next
  melee ability within 12 ticks deals 1.75x (PvP: 1.25x) base damage. * Generates 1 Bloodlust stack.
  * Generates 9% Adrenaline." Level 92, codex from Zamorak.
- "Chaos Roar deals 100%-120% ability damage and causes the next melee ability used within 7.2 seconds to
  deal 1.75x base damage (1.25x in PvP). This bonus also applies to bleed abilities, which normally do not
  receive damage boosts. The buff is not consumed by abilities that do not deal damage."
- "Chaos Roar only affects the next cast from an ability, meaning that channelled abilities such as
  Assault will only have their first hit's damage multiplied, with the rest dealing their normal damage.
  This is true even for channelled abilities dealt over time by Greater Barge. Chaos Roar will boost the
  damage from all hits of multi-hitting abilities such as Hurricane, Overpower (if used with Igneous
  Kal-Ket), special attacks … and all hits of area of effect abilities."
- Status page: trigger "Landing an attack with the Chaos Roar ability" (2022 patch: "needs to hit in order
  to apply the buff"), "Increases the base damage of the next ability hit by 75% (25% in PvP)".
- **AMBIGUOUS**: for bleeds — "next cast" would suggest the whole Dismember/Slaughter/Massacre bleed is
  boosted, but the status page says "next ability hit"; the wiki does not say whether every bleed tick or
  only the first tick gets 1.75×. Also unstated whether Chaos Roar's multiplier is multiplicative with
  Berserk (patch notes only say it "no longer double-dips").
- RESOURCES: +1 Bloodlust.
- MODIFIES OTHER ABILITIES: next damaging melee ability ×1.75 base damage (whole multi-hit / AoE, first
  hit of channels).
- IS MODIFIED BY: Berserk (its own 100-120 % hit), Greater Fury.
- REQUIREMENTS: "Ability now requires a target to cast and needs to hit in order to apply the buff".
- BUFFS: Chaos Roar (status) self, 12 ticks (7.2 s), consumed by next damaging melee ability.
- SHARED: none. GREATER: none. CHANNEL: n/a.

## 13. Assault

https://runescape.wiki/w/Assault

`Enhanced | −25 % | 6 s (10 ticks) | 7 ticks (hits at 1,3,5,7) | CHANNELLED | no`

- Infobox: "Strike at the target multiple times. * Attack 4 times over 7 ticks. * 130%-150% Melee damage
  per hit. * Channelled. Bloodlust (consumes 4 Bloodlust stacks) * Deals 170%-190% Melee damage per hit.
  Damage is 75% effective in PvP. Can move while channelling." Level 3, equipment "Any".
- "Assault hits 1 tick after it was cast, and deals subsequent hits every 2 ticks (1.2 seconds)
  afterwards: Cast 0 | Hit 1: 1 | Hit 2: 3 | Hit 3: 5 | Hit 4: 7".
- RESOURCES: "Assault can be empowered if the player has 4 or more Bloodlust stacks when it is cast. This
  will consume 4 Bloodlust stacks and increase the damage to 170-190% ability damage per hit". Consumption
  is automatic (no toggle mentioned) and happens at cast.
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: Berserk ×1.75 (all hits); Chaos Roar (first hit only); Greater Fury (first hit only);
  Greater Barge / Endless Assault → dealt as DoT (see §11).
- REQUIREMENTS: any melee weapon; ≥25 % adrenaline.
- SHARED: none. GREATER: none. BUFFS: none.
- CHANNEL rules: 4 hits, ticks 1/3/5/7 after cast. "Like all melee channelled abilities, Assault can be
  channelled while moving as long as the player stays within attack range of their target." Abilities
  page: "These abilities are able to be cancelled by performing another ability (or by walking or similar
  actions)." → for melee, walking out of range cancels; walking within range does not. Pressing another
  ability cancels the remaining hits (GCD already elapsed at tick 3, so any ability pressed from tick 3
  onward cancels hits at 5 and 7). The cooldown (10 ticks) starts at cast, not at end of channel.
- OTHER: PvP damage 75 %.

## 14. Hurricane

https://runescape.wiki/w/Hurricane

`Enhanced | −25 % | 20.4 s (34 ticks) minus 5 ticks per enemy hit | instant (2–3 hits) | not channelled | no`

- Infobox: "Spin on the spot with your weapon. * 135%-165% Melee damage. * 155%-185% Melee damage to the
  target and up to 9 additional enemies within 1 tile of you. * Reduces the cooldown of Hurricane by 5
  ticks for each enemy hit. * 2 hits. Bloodlust (consumes 4 Bloodlust stacks) * Third hit of 75%-95% Melee
  damage to the target and up to 9 additional enemies within 1 tile of you. Damage is 55% effective in
  PvP. Area targeting varies based on the attack range of your main-hand weapon." Level 37, equipment
  "Two-handed".
- "dealing 135-165% ability damage to the primary target, and then a second hit of 155-185% is dealt to
  the primary target and up to 9 additional targets in a within a 3x3 area of the player, including
  targets standing on the player's square. In addition, for each target hit, the cooldown of Hurricane is
  reduced by 3 seconds." "Halberds … increase Hurricane's range to 5x5 around the player."
- "Because Hurricane's cooldown is reduced by 3 seconds for every enemy hit, if the ability hits at least
  7 enemies its cooldown will be reduced to zero. If the ability is empowered by bloodlust, the number of
  required enemies to negate the cooldown is reduced to 3."
  **AMBIGUOUS**: "7 enemies" (7×3 s = 21 s ≥ 20.4 s) implies one reduction per *enemy*, but "3 enemies
  with bloodlust" only works if every *hit instance* counts (main 3 hits + 2×2 = 7 hits). The two
  statements are inconsistent; the tooltip says "for each enemy hit". Recommend: count hit instances that
  land (per target per hit), and flag as a parameter.
- Hit timing: 2015 patch "Once again both hits are dealt the same time" — no post-2026 timing given
  (**AMBIGUOUS** whether the 3 hits land on the same tick).
- RESOURCES: consumes 4 Bloodlust at cast if ≥4 → third hit 75-95 % AoE.
- MODIFIES OTHER ABILITIES: reduces its own cooldown.
- IS MODIFIED BY: Berserk (all hits); Chaos Roar ("Hurricane ability will now double against all targets"
  → all hits, all targets); Greater Fury (one hit on main target only); halberd 5x5.
- REQUIREMENTS: two-handed melee weapon ("Can no longer be used with dual-wielded Dark ice shard …").
- SHARED: none ("Now shares a cooldown with Destroy" — Destroy was removed). GREATER: none. BUFFS: none.
  CHANNEL: n/a. PvP 55 %.

## 15. Flurry

https://runescape.wiki/w/Flurry

`Enhanced | −25 % | 20.4 s (34 ticks) | 8 ticks (hits at 1..8) | CHANNELLED | no`

- Infobox: "Swing both weapons rapidly around you. * Attack 8 times over 8 ticks. * 60%-70% Melee damage
  per hit to up to 8 enemies within 1 tile of you. * Channelled. * Stuns and Binds the target for 6 ticks.
  Bloodlust (consumes 4 Bloodlust stacks) * Deals 1% increased damage for each 1% Life Points the target is
  missing, up to a maximum of 65%. Area targeting varies based on the attack range of your main-hand
  weapon. Can move while channelling." Level 45, equipment "Dual wield".
- "dealing 60-70% ability damage eight times once every 0.6 seconds for 4.8 seconds for a total of
  480-560% ability damage".
- "If Flurry kills its initial target before the ability is finished, surrounding targets will no longer
  take damage from the rest of the combo attack."
- Bloodlust: "consume 4 Bloodlust stacks and increase the damage by 1% for each 1% life points the target
  is missing, up to a maximum of 65%. This means that for an enemy that is below 35% of its maximum life
  points, Flurry will deal an average of 858% ability damage." **AMBIGUOUS**: whether the missing-LP % is
  evaluated once at cast or per hit, and whether the bonus applies to secondary targets (based on their
  own or the main target's LP) — wiki silent. Stun page lists "Up to 3.6 seconds" for the stun.
- RESOURCES: consumes 4 Bloodlust at cast if ≥4.
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: Berserk; Chaos Roar (first hit only); Greater Fury (first hit, main target); Greater
  Barge → DoT, AoE removed; halberd (with laceration boots) 5x5.
- REQUIREMENTS: dual-wielded melee weapons; ≥25 % adrenaline.
- SHARED: none.
- GREATER: "Flurry can be upgraded to Greater Flurry by reading a Greater Flurry ability codex." (replaces).
- DEBUFFS: Stunned + Bound on main target 6 ticks (3.6 s) ("Flurry and Greater Flurry now stun opponents
  as expected", 16 March 2026).
- CHANNEL rules: 8 hits, 1 per tick, ticks 1-8 after cast; movement within range allowed; cancelled by
  another ability or leaving range; cooldown starts at cast.

## 16. Greater Flurry

https://runescape.wiki/w/Greater_Flurry

`Enhanced | −25 % | 20.4 s (34 ticks) | 8 ticks (hits at 1..8) | CHANNELLED | no`

- Infobox identical to Flurry plus: "* Each attack extends the duration of Berserk by 1 tick."
- "Each hit extends the duration of the Berserk ability by 0.6 seconds, essentially pausing the duration
  while channelling Greater Flurry. The Berserk duration extension is not affected if Greater Flurry hits
  multiple targets." "The 8 hits will each land 1 tick apart starting with tick 1, with tick 0 being the
  tick that the ability was used."
- Berserk page: "Using Greater Flurry extends the duration of Berserk by 1 tick for every successful hit
  regardless of how many targets are hit by it. … it can extend Berserk's duration by up to 8 ticks,
  depending on how long the ability is channelled." "Since the cooldown of Greater Flurry is 34 ticks, it
  can be used twice in one activation of Berserk, provided it is used within the first 7 ticks after
  activating Berserk. This extends Berserk to a total duration of 49 ticks."
- "If Greater Flurry is used as damage-over-time after Greater Barge, the ability will extend the duration
  of Berserk as usual, however it will not act as an area-of-effect".
- RESOURCES: consumes 4 Bloodlust (same rule as Flurry).
- MODIFIES OTHER ABILITIES: Berserk duration +1 tick per successful hit (only while Berserk active; "Each
  attack increases the duration of Berserk, if active, by 1 tick" — CSM).
- IS MODIFIED BY: same as Flurry.
- REQUIREMENTS: dual wield; codex; members.
- GREATER vs Flurry: identical damage/stun/bloodlust; only adds the Berserk extension ("greater version
  now deals the same damage as non-greater"). Replaces Flurry.
- CHANNEL rules: as Flurry.

## 17. Dismember

https://runescape.wiki/w/Dismember

`Enhanced | 0 % | 24 s (40 ticks) | bleed 16 ticks (8 hits every 2 ticks) | not channelled (DoT) | no`

- Infobox: "Slice at the target causing them to Bleed. * 25%-35% Melee damage per hit every 2 ticks.
  * 8 hits. * Damage over time. * Heals you for 4% of the damage dealt. * Can be recast within 40 ticks of
  the previous cast. Second Cast: Stab the target, causing them to Bleed. Third Cast: Swing at the target
  causing them to Bleed." Level 50, equipment "Any".
- "Dismember is a three-stage ability, with Slaughter recast unlocked at level 60 Attack and Massacre
  recast unlocked at level 75. The Slaughter and Massacre recasts apply a more powerful bleed at the cost
  of 25% adrenaline each. All three bleeds can be active at the same time, and they heal the player for
  4%-12% of the damage they deal, depending on the bleed." "Each individual hit is rounded down."
- CSM table: "Enables second cast for 40 ticks * 40 ticks cooldown (applies if you use all of your
  available casts)". Abilities page (Sequence): "These abilities all occupy one space on the action bar,
  with each new ability in the sequence replacing the previous as it becomes accessible. Therefore, only
  one ability in the sequence can be used at a given time." "Melee bleeds: Resets if no ability in
  sequence is used for 25 seconds, or when Massacre is used."
- Buff page https://runescape.wiki/w/Dismember_(status,_buff): trigger "Activating Dismember or
  Slaughter", duration "24 seconds", effect "Allows Slaughter or Massacre to be cast, respectively".
- **AMBIGUOUS**: (a) whether the 40-tick Dismember cooldown starts at the first cast or only when the
  sequence ends (CSM says it "applies if you use all of your available casts"; the ability page says
  cooldown 24 s and the recast window is 40 ticks); (b) 25 s (Abilities page) vs 24 s / 40 ticks (buff
  page) for the sequence reset; (c) whether recasting Dismember on a target that still has the Dismember
  bleed refreshes or stacks the bleed (wiki silent — only "All three bleeds can be active at the same
  time" is stated).
- Bleed modifier rules (Template:Bleeds: Unaffected boosts): affected by equipment damage bonus, visible
  skill boosts, Vulnerability/Curse, Eruptive, slayer perks etc. NOT affected by "Damage boosting
  abilities: Berserk, Death's Swiftness, and Sunshine", "Critical strikes", "Most perks affecting
  variable damage, including Genocidal, Precise, and Ruthless", prayers. Exception: Chaos Roar does apply.
- Extensions: "The Masterwork Spear of Annihilation special effect extends Dismember by 4 hits to a total
  of 12 hits. The Strength cape's perk extends Dismember by 3 hits to a total of 11 hits. The Strength
  master cape's perk heals an additional 3% life points for Dismember, Slaughter, and Massacre. All
  ability modifiers stack with each other." Lunging perk: +10 % + 3 %/rank.
- RESOURCES: 0 adrenaline; does not generate Bloodlust (Enhanced). Heals 4 % of damage dealt.
- MODIFIES OTHER ABILITIES: unlocks Slaughter (second cast) for 40 ticks.
- IS MODIFIED BY: Chaos Roar; Lunging; Strength cape; MSoA; Corrupted Wounds (Rend + gloves of passage);
  NOT Berserk / Greater Fury / Fury (Greater Fury buff is not consumed).
- DEBUFFS: Dismember (status) on target; "Removed upon activating Freedom or eating numbing root"
  (player targets). Not cancellable by the caster. Abilities page: "if the player casts one of these
  abilities, the effect will continue for the appropriate duration of the ability (unless specific
  mechanics of the target prevent or cancel it)". Trivia (Slaughter): "If the player using Slaughter is
  killed before the effect ends, the target stops receiving damage."
- Hit timing: first bleed hit tick not stated explicitly; "every 2 ticks", 8 hits (16 ticks total).

## 18. Slaughter

https://runescape.wiki/w/Slaughter

`Enhanced (Dismember 2nd cast) | −25 % | 0 (own); gated by Dismember window | bleed 18 ticks (6 hits every 3 ticks) | not channelled (DoT) | no`

- Infobox: "Stab the target, causing them to Bleed. * 80%-100% Melee damage per hit every 3 ticks.
  * 6 hits. * Damage over time. * Heals for 6% of damage dealt. Third Cast: Swing at the target causing
  them to Bleed." cooldown = 0, level 60.
- "Slaughter is the second recast of Dismember, with the third recast Massacre unlocked at level 75."
  "No longer deals increased damage when the target moves."
- Status page https://runescape.wiki/w/Slaughter_(status): duration "10.8 seconds", "Removed upon
  activating Freedom or eating numbing root", "maximum of 6 hits", "Heals for 6% of damage dealt".
- RESOURCES: −25 % adrenaline; heals 6 %.
- MODIFIES OTHER ABILITIES: enables Massacre (third cast) for 40 ticks (Dismember buff page: "Activating
  Dismember or Slaughter … 24 seconds").
- REQUIREMENTS: Dismember must have been cast within the last 40 ticks (buff "Dismember (status, buff)"
  present); ≥25 % adrenaline; 60 Attack.
- IS MODIFIED BY: as Dismember (bleed rules; Chaos Roar yes; Berserk no; Strength master cape +3 % heal).
- DEBUFFS: Slaughter (status) on target, 18 ticks. Stacks alongside Dismember/Massacre bleeds.

## 19. Massacre

https://runescape.wiki/w/Massacre

`Enhanced (Dismember 3rd cast) | −25 % | 0 (own); ends the sequence | 1 direct hit + 6 bleed hits every 4 ticks (24 ticks) | not channelled (DoT) | no`

- Infobox: "Swing at the target causing them to Bleed. * 110%-130% Melee damage on first hit. * 100%
  Melee damage per hit every 4 ticks. * 7 hits. * Damage over time. * Heals for 12% of damage dealt."
  cooldown = 0, level 75, F2P ("Massacre has been correctly made available to F2P players", 9 March).
- "doing 7 hits, dealing 110-130% ability damage on first hit and 100% ability damage per hit every 4
  ticks. Each individual hit is rounded down. The player receives healing for 12% of the damage that is
  dealt." CSM: "110-130% melee ability damage * Followed by 6 hits of 100% melee ability damage every 4
  ticks (bleed)".
- Sequence: "Resets … when Massacre is used" → after Massacre the slot returns to Dismember (on its
  cooldown).
- **AMBIGUOUS**: status page says duration "6 seconds" (stale, 6×4 ticks = 14.4 s by the ability page);
  whether the 110-130 % first hit is a normal (crit-able, Berserk-affected) hit or part of the bleed is
  not stated (Abilities page note: "Massacre and Deadshot have a standard 188% ability hit and 5 bleed
  hits" — stale numbers but implies the first hit is a *standard* hit).
- RESOURCES: −25 %; heals 12 %.
- REQUIREMENTS: Slaughter cast within last 40 ticks; ≥25 % adrenaline; 75 Attack.
- IS MODIFIED BY: as Dismember for the bleed part.
- DEBUFFS: Massacre (status) on target; removed by Freedom / numbing root.

## 20. Overpower

https://runescape.wiki/w/Overpower

`Ultimate | −60 % | 30 s (50 ticks); 15 ticks while Berserk active | hit lands 3 ticks after cast | not channelled | no`

- Infobox (standard): "Strike the target with a massive overhead swing. * 520%-570% Melee damage. Damage
  is 55% effective in PvP." Level 15, equipment "Any".
- Igneous variant: "* 280%-340% Melee damage. * 2 hits." with Igneous Kal-Ket / Kal-Zuk; "Both hitsplats
  are dealt simultaneously." Update history 9 March 2026: base "550%–600% → 520%–570%", igneous per hit
  "310%–370% (340% average) → 280%–340% (310% average)" – the Kal-Zuk page still shows 310–370.
  **[MODEL]** `set-effects.json` igneous-kal-ket: 2 hits × 280–340 % (checked 2026-09-05).
- "Overpower hits 3 ticks after it was cast."
- "Overpower is affected by the Ultimatums perk, increasing its damage by 3% + 1% per rank."
- CSM: "Removed Overpower adrenaline cost reduction effect (Overpower now always costs 60%)".
- RESOURCES: −60 %.
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: **Berserk**: "Overpower: Cooldown reduced to 15 ticks." CSM: "Cooldown of Overpower
  reduced to 15 ticks (does not reset cooldown)" → while Berserk is active the cooldown length is 15
  ticks; an already-running 50-tick cooldown is not reset (**AMBIGUOUS** whether a running cooldown is
  shortened to 15 or only new casts get 15; the wiki says only "does not reset"). Berserk ×1.75; Chaos
  Roar (both igneous hits); Greater Fury (one hit).
- REQUIREMENTS: ≥60 % adrenaline. SHARED: none. GREATER: none. BUFFS: none. CHANNEL: n/a.

## 21. Pulverise

https://runescape.wiki/w/Pulverise

`Ultimate | −60 % | 60 s (100 ticks) | Pulverised 50 ticks | not channelled | no`

- Infobox: "Charge up a massive strike and pulverise the target. * 300%-340% Melee damage. * Applies
  Pulverised to the target for 50 ticks. * On killing blow: Generates 50% Adrenaline. Pulverised: Reduced
  to dust. * Reduces damage dealt by 25%." Level 71, equipment "Two-handed".
- "applies the Pulverised status which reduces all damage the target deals by 25% for 30 seconds; if it
  kills the target, it grants 50% adrenaline (NPC targets only)." "If used to kill an NPC while Natural
  Instinct is active, Pulverise will grant 100% adrenaline".
- **AMBIGUOUS**: CSM table says "Requires dual-wielded weapon" but the ability infobox says "Two-handed"
  (and it has always been 2h). Use two-handed.
- RESOURCES: −60 %; +50 % on killing blow (NPC).
- MODIFIES OTHER ABILITIES: none.
- IS MODIFIED BY: Ultimatums perk (all ultimates, +3 % + 1 %/rank); Berserk; Chaos Roar; Greater Fury.
- DEBUFFS: Pulverised on target, 50 ticks, "Reduces damage dealt by 25%", no stacking (stacks = No).
- SHARED: none. GREATER: none. CHANNEL: n/a.

## 22. Berserk

https://runescape.wiki/w/Berserk

`Ultimate | −100 % | 60 s (100 ticks) | 33 ticks (extendable) | not channelled | no`

- Infobox: "Go berserk, empowering yourself. * Melee attacks deal 1.75x damage. * Increases damage taken by
  25%. * Generates 4 Bloodlust stacks. * Basic attacks and basic abilities generate 2x Bloodlust stack.
  * Maximum number of Bloodlust stacks are increased by 4. * Overpower: Cooldown reduced to 15 ticks.
  * 33 ticks duration." Level 76, members, equipment "Any", target Self.
- "For 33 ticks, all melee damage dealt by the player, excluding bleeds or Onslaught, is multiplied by
  1.75x and damage taken from monsters and other players is increased by 25%. In addition, maximum
  Bloodlust stacks are increased by 4, basic abilities generate double Bloodlust stacks, and Overpower has
  its cooldown reduced to 9 seconds." "Hard typeless attacks do not deal increased damage to a player under
  the effects of Berserk." "Berserk's damage buff is now applied multiplicatively instead of additively."
- **AMBIGUOUS**: status page https://runescape.wiki/w/Berserk_(status) says duration "20.4 seconds"
  (34 ticks) vs ability page "33 ticks" (19.8 s). Use 33 ticks of buffed hits (the extra tick is the
  activation tick).
- Duration table: base 33; +Greater Flurry 41; +2×Greater Flurry 49; 3-piece Vestments of havoc +10 → 43
  / 51 / 59. "Using at least 3 pieces of the Vestments of havoc armour extends Berserk's duration by 10
  ticks".
- Interactions: "The Zaros godsword's special attack, Blackhole, … if both are active by the user at the
  same time, Berserk overrides Blackhole. … Annihilation's special attack, Gravitate, does stack
  multiplicatively with Berserk". PvP: "if the player activates Berserk and goes after anyone other than
  their aggressor … Berserk's effects will automatically be removed".
- RESOURCES: −100 % adrenaline; **+4 Bloodlust on activation**; Bloodlust cap 4 → 8 while active; basic
  attacks/abilities generate 2× stacks while active. (Bloodlust page: "Activating Berserk grants 4 stacks,
  and whilst active causes basic abilities to grant twice the usual number of stacks … Increases to 8
  stacks during Berserk".) **AMBIGUOUS**: what happens to stacks 5-8 when Berserk ends (capped back to 4
  or kept) — wiki silent.
- MODIFIES OTHER ABILITIES: all melee non-bleed hits ×1.75 (incl. Greater Barge DoT'd channels); Overpower
  cooldown 15 ticks; Bloodlust generation ×2 for basics; Bloodlust max 8.
- IS MODIFIED BY: Greater Flurry (+1 tick per hit); Vestments of havoc (+10 ticks).
- REQUIREMENTS: 100 % adrenaline. SHARED: none. GREATER: none.
- BUFFS: Berserk (status) self, timer, no stacking; recasting not possible within cooldown.
- CHANNEL: n/a.

## 23. Meteor Strike

https://runescape.wiki/w/Meteor_Strike

`Ultimate | −60 % | 60 s (100 ticks) | buff 50 ticks | not channelled | no`

- Infobox: "Jump up and strike the ground. * 220%-250% Melee damage to the target and up to 8 additional
  targets within 1 tile of you. * Melee basic abilities generate 1.5x Adrenaline. * Generates 4.5%
  Adrenaline every 1 tick while you have a Melee weapon equipped. * 50 ticks duration. Area targeting
  varies based on the attack range of your main-hand weapon." Level 90, equipment "Any" ("No longer
  requires a two-handed weapon to use.").
- "gains 4.5% adrenaline every 0.6 seconds for the next 30s, totalling 225% adrenaline gained total,
  provided it doesn't reach the cap". "Halberds increase the AoE of this ability to 5x5 squares."
- "Meteor Strike's adrenaline buff is melee-specific. Recasting Meteor Strike itself where possible …
  refreshes the adrenaline buff timer. The adrenaline generation is unaffected by Natural Instinct."
- Status page https://runescape.wiki/w/Meteor_Strike_(status): duration "30 seconds", effects "Melee basic
  abilities generate 1.5x adrenaline * Generate 4.5% adrenaline per 0.6 seconds if you have a melee
  weapon equipped". Beta note: "No longer clears when switching style, but only granted while you have a
  Melee weapon equipped".
- CSM: "Melee basic abilities generate 1.5× adrenaline (not Attack (ability))" — see §2 ambiguity.
- Crit: "The chance for Meteor Strike to land critical hits can be increased by 20% for each Corbicula rex
  perk … +20% or +40%".
- RESOURCES: −60 %; then +4.5 %/tick for 50 ticks and basics ×1.5.
- MODIFIES OTHER ABILITIES: adrenaline of Adaptive Strike/Rend/Fury/Greater Fury/Backhand/Punish/Barge/
  Greater Barge/Bladed Dive/Chaos Roar ×1.5 (Attack basic attack: see ambiguity).
- IS MODIFIED BY: Ultimatums; Berserk; Chaos Roar (all AoE hits); Greater Fury (main target).
- REQUIREMENTS: ≥60 %. SHARED: none. GREATER: none. BUFFS: Meteor Strike (status) self 50 ticks,
  recast refreshes. CHANNEL: n/a.

---

## Melee mechanics summary

### Bloodlust (https://runescape.wiki/w/Bloodlust)

- Generation: "Activating any basic Melee ability, except for Bladed Dive, grants 1 stack * Activating
  Rend grants 2 stacks * Activating Berserk grants 4 stacks, and whilst active causes basic abilities to
  grant twice the usual number of stacks". Generation happens on *activation* (not on hit). Generators:
  Attack (basic attack), Adaptive Strike, Rend (2), Fury, Greater Fury, Backhand, Punish, Barge, Greater
  Barge, Chaos Roar; Berserk (+4 flat). Enhanced/ultimate abilities and Dive/Bladed Dive generate none.
- Cap: "Maximum of 4 stacks ** Increases to 8 stacks during Berserk". Generation above cap is lost.
- Expiry: "Until consumed by affected abilities * Removed by some teleports" → no timer.
- Consumption (4 stacks, only when ≥4 at cast, always automatic): Assault (170-190 %/hit instead of
  130-150 %), Hurricane (extra third hit 75-95 % AoE), Flurry / Greater Flurry (+1 % damage per 1 %
  target LP missing, cap +65 %). With 8 stacks (Berserk) two spenders can be empowered back-to-back.
- 29 June 2026: "Bloodlust stacks are now disabled during classic combat mode".

### Melee-wide passives / rules

- Melee channels (Assault, Flurry, Greater Flurry) allow movement while in range
  (https://runescape.wiki/w/Abilities#Channelled).
- Bleeds (Dismember/Slaughter/Massacre) ignore Berserk, crits, prayers, Precise/Ruthless etc.; they DO
  take Chaos Roar, Lunging, Corrupted Wounds (Rend + gloves of passage), Strength cape (+3 hits
  Dismember), MSoA (+50 % hits), Strength master cape (+3 % heal). Freedom removes them from a player
  target. (https://runescape.wiki/w/Abilities#Damage_over_Time_abilities, https://runescape.wiki/w/Freedom)
- Greater-Barge DoT'd channels are NOT bleeds: Berserk and crits apply, the hits keep normal timings,
  can't be cancelled, Flurry loses AoE, Greater Flurry still extends Berserk.
- Ultimatums perk: all ultimates +(3+1/rank) % damage. Flanking: Backhand. Lunging: Dismember.
- Attack master cape: "2% hit chance increase for Melee attacks". Jaws of the Abyss: +2 % adrenaline per
  bleed on target for damaging basic melee abilities.
- Stun blocks all abilities except Freedom; Bound only blocks movement (Barge/Greater Barge clear own
  Bound but not stun).

### Cross-ability rules (WHEN … THEN …)

1. WHEN a basic melee ability other than Bladed Dive is activated THEN +1 Bloodlust (Rend +2), cap 4
   (https://runescape.wiki/w/Bloodlust).
2. WHEN Berserk is activated THEN +4 Bloodlust, cap becomes 8, and every basic attack/ability grants 2×
   stacks for 33 ticks (https://runescape.wiki/w/Berserk, https://runescape.wiki/w/Bloodlust).
3. WHEN Berserk is active THEN all non-bleed melee hits ×1.75, damage taken ×1.25, Overpower cooldown =
   15 ticks (does not reset a running cooldown) (https://runescape.wiki/w/Berserk,
   https://runescape.wiki/w/Combat_Style_Modernisation#Abilities_changed).
4. WHEN Berserk is active AND a Greater Flurry hit lands THEN Berserk duration +1 tick (max +8 per cast,
   independent of target count; also when DoT'd by Greater Barge) (https://runescape.wiki/w/Greater_Flurry).
5. WHEN Assault / Hurricane / Flurry / Greater Flurry is cast with ≥4 Bloodlust THEN 4 stacks are consumed
   and the empowered version is used (https://runescape.wiki/w/Bloodlust).
6. WHEN Hurricane hits an enemy THEN Hurricane's cooldown −5 ticks per enemy hit
   (https://runescape.wiki/w/Hurricane). (Per-enemy vs per-hit-instance ambiguous.)
7. WHEN Fury hits THEN next melee attack +25 % crit chance; WHEN Greater Fury is activated THEN next
   non-bleed melee hit within 25 ticks is a guaranteed crit (first hit of channels / one hit of multi-hit /
   main target of AoE); bleeds neither benefit nor consume (https://runescape.wiki/w/Greater_Fury).
8. WHEN Chaos Roar lands THEN next damaging melee ability within 12 ticks deals 1.75× base damage —
   all hits of multi-hit/AoE, first hit only of channels (also Greater-Barge DoT'd channels), applies to
   bleeds; not consumed by non-damaging abilities (https://runescape.wiki/w/Chaos_Roar).
9. WHEN ≥8 ticks have passed since the player last attacked the target (or the player opens from out of
   combat) AND Greater Barge is cast THEN Endless Assault for 10 ticks; WHEN Assault/Flurry/Greater
   Flurry is then cast (manually, or queued before the last tick) THEN it is dealt as an un-cancellable DoT
   with normal hit timing, other abilities can be used meanwhile, Flurry AoE removed
   (https://runescape.wiki/w/Greater_Barge, https://runescape.wiki/w/Endless_Assault,
   https://runescape.wiki/w/Ability_queueing).
10. WHEN Greater Barge is cast THEN +5-7 % damage per tick since last attack, max 10 ticks
    (https://runescape.wiki/w/Greater_Barge).
11. WHEN Dismember is cast THEN Slaughter becomes available in the same slot for 40 ticks; WHEN Slaughter
    is cast THEN Massacre becomes available for 40 ticks; WHEN Massacre is cast OR 40 ticks pass with no
    cast THEN the slot resets to Dismember (https://runescape.wiki/w/Dismember,
    https://runescape.wiki/w/Dismember_(status,_buff), https://runescape.wiki/w/Abilities#Sequence).
12. WHEN Meteor Strike is cast THEN for 50 ticks +4.5 % adrenaline per tick (melee weapon equipped) and
    melee basic abilities generate 1.5× adrenaline; recast refreshes the buff
    (https://runescape.wiki/w/Meteor_Strike).
13. WHEN Pulverise kills an NPC THEN +50 % adrenaline (100 % with Natural Instinct); WHEN it hits THEN
    target deals −25 % damage for 50 ticks (https://runescape.wiki/w/Pulverise).
14. WHEN Punish is cast on a target below 50 % LP THEN damage ×2.5 (https://runescape.wiki/w/Punish).
15. WHEN Bladed Dive damages an enemy that dies within 10 ticks THEN Bladed Dive cooldown resets
    (https://runescape.wiki/w/Bladed_Dive).
16. WHEN Dive or Bladed Dive is used THEN both go on the shared 34-tick cooldown (Dive: only on a
    successful dive); Barge/Greater Barge never share with them (https://runescape.wiki/w/Dive,
    https://runescape.wiki/w/Barge).
17. WHEN Barge / Greater Barge is cast THEN the player's own Bound is cleared (not stuns) and the target is
    Bound 11 ticks (https://runescape.wiki/w/Barge).
18. WHEN Backhand is cast THEN target Stunned+Bound 3 ticks; second charge at 54 Attack; WHEN Flurry /
    Greater Flurry is cast THEN main target Stunned+Bound 6 ticks (https://runescape.wiki/w/Backhand,
    https://runescape.wiki/w/Flurry).
19. WHEN Flurry / Greater Flurry's initial target dies mid-channel THEN remaining hits deal no AoE damage
    (https://runescape.wiki/w/Flurry).
20. WHEN any ability is pressed during a channel (after the GCD) OR the player leaves attack range THEN the
    channel is cancelled; the channel's cooldown started at cast (https://runescape.wiki/w/Abilities).
21. WHEN Rend hits with (Enhanced) gloves of passage THEN next melee attack within 6 s +10 % (16 %) and the
    target takes +20 % (25 %) bleed damage for 10.2 s (https://runescape.wiki/w/Rend).
22. WHEN a Greater codex is read THEN the base ability is replaced (Greater Barge "replacing the former
    ability"; Greater Fury reverts to Fury on F2P worlds) — base and Greater cannot both be on the bar
    (https://runescape.wiki/w/Greater_Barge, https://runescape.wiki/w/Greater_Fury).

### Open ambiguities (wiki silent or self-contradictory)

- Hurricane CDR: per enemy hit vs per hit instance (page examples contradict each other).
- Fury +25 % crit buff: no duration given; unknown whether bleeds consume it.
- Greater Fury: consumed only by a hit "that hits" — miss handling not stated.
- Chaos Roar on bleeds: whole bleed or first tick only; multiplicativity with Berserk.
- Berserk: 33 vs 34 ticks; fate of stacks 5-8 when Berserk ends; whether a running Overpower cooldown is
  shortened to 15 ticks or only new casts get 15.
- Dismember: cooldown start (first cast vs end of sequence); 24 s vs 25 s window; refresh vs stack when
  recast on an already-bleeding target; exact tick of the first bleed hit.
- Massacre: whether the 110-130 % opener is a standard (crit/Berserk-able) hit; stale "6 s" status duration.
- Flurry Bloodlust bonus: evaluated per hit or at cast; applies to secondary targets?
- Hurricane: whether 2/3 hits land on the same tick.
- Backhand second charge: 54 (ability page, patch notes) vs 70 (CSM table) — use 54.
- Pulverise equipment: Two-handed (ability page) vs dual-wield (CSM table) — use two-handed.
- Greater Barge ramp: 5-7 % (tooltip, table) vs 5-12 % (prose) — use 5-7 %.
- Meteor Strike 1.5× adrenaline: applies to the Attack basic attack or not (CSM says not).
