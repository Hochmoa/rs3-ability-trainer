# RS3 combat mechanics for a tick-accurate simulator (state: September 2026)

Research date: 2026-09-03. All quotes are verbatim from the RuneScape Wiki wikitext (`?action=raw` / MediaWiki API), state after the **Combat Style Modernisation** of 2 March 2026 and its 9/16/30 March follow-up patches. The wiki template `{{ticks|N}}` is rendered here as "N ticks (N×0.6 s)"; wiki links `[[...]]` are kept as plain text.

Legend: **[VERIFIED]** = quoted from the wiki. **[INFERRED]** = my reading of the quotes. **[OPEN]** = wiki is silent, inconsistent or outdated.

---

## 0. Ground rules (tick, GCD, ability classes)

- Game tick = 0.6 s. "Each action registered within one tick will start to take place by the beginning of the next tick." — https://runescape.wiki/w/Game_tick
- Global cooldown (GCD): "the 3 ticks (1.8 s) long cooldown which starts every time a player begins to use a spell or ability, and affects all of other spells and abilities. There are exceptions to this." — https://runescape.wiki/w/Cooldown#Global_cooldown
- "After using an ability, the player cannot use another ability for 3 ticks (1.8 seconds). This is the global cooldown. This triggers from the moment of use, so after a channelled ability, the player can immediately use another ability." — https://runescape.wiki/w/Abilities#Cooldown
- Ability classes after 2 Mar 2026 (https://runescape.wiki/w/Combat_Style_Modernisation#All_styles):
  - "The 'threshold' ability type was removed from the three styles. Abilities with adrenaline costs can be used as soon as the player has enough adrenaline."
  - "Some Defence and Constitution abilities remained as threshold abilities."
  - "Abilities that are not basic or ultimate abilities were divided up into 2 groups: 'enhanced' abilities that don't generate adrenaline (usually consume it), and 'utility' abilities (such as Surge)."
  - "Ultimate abilities remain, but they do not always require 100% adrenaline."
  - "Basic abilities now generate 9% adrenaline by default (increased from 8%), though some can generate more."
  - "Like Necromancy, a distinction is made between 'basic abilities' (generate adrenaline) and 'basic attack' (generate adrenaline, automatically used if no other ability is selected)."
- Adrenaline by class: "Basic abilities generate 9% adrenaline. Enhanced abilities require and drain zero to moderate amount of adrenaline, depending on the ability. Threshold abilities require 50% adrenaline and will drain 15% on use. Ultimate abilities require and drain 60% or 100% adrenaline." — https://runescape.wiki/w/Abilities#Adrenaline
- Out-of-combat drain: "When a player is out of combat for 10 seconds, their adrenaline will deplete by 5% every 2 ticks until it hits zero" — https://runescape.wiki/w/Adrenaline
- Combat stance: "Combat stance lasts for 10 seconds after combat ends." — https://runescape.wiki/w/Adrenaline#Stalling
- Adrenaline modifiers relevant to a sim: Fury of the Small "+1%"; Impatient "9% chance per rank for basic abilities to generate 3% extra adrenaline"; Invigorating "Boosts adrenaline gained from basic attacks by 5% per rank" applied multiplicatively "after any adrenaline gain from the above two effects" (https://runescape.wiki/w/Basic_attacks#Adrenaline_interactions); Ring of vigour "After an ultimate ability is used, 10% adrenaline will be retained"; Conservation of Energy "After using an ultimate ability, you will regain 10% adrenaline"; these two "stack additively". Natural Instinct "doubling the user's adrenaline gain for 20.4 seconds" (PvM), but "does not affect adrenaline potions, Meteor Strike, or the Vestments of havoc armour effect". Food: "Consuming food: -3% (only when fighting a target)".

---

## 1. Cooldowns

### 1.1 When an internal cooldown starts, and how it counts

- **[VERIFIED]** "All abilities have a cooldown timer. The cooldown activates when the ability is used, and stays active for a period of time specific to the ability. While it is active, the ability cannot be used." — https://runescape.wiki/w/Abilities#Cooldown
- **[VERIFIED]** Cooldowns start on the cast tick even when the ability is stalled: "When an ability is stalled, its adrenaline cost is consumed and its cooldown begins. Therefore it is possible for the adrenaline and cooldown to be regained before the ability is released, allowing it to be used again immediately." Exception: "For special attacks that track their cooldowns by a debuff (e.g. Crystal Rain cooldown) then the cooldown does not begin, as the debuff is only applied when the special attack hits an enemy." — https://runescape.wiki/w/Ability_stalling
- **[VERIFIED]** Exception, Dive: "Unlike most abilities, the ability cooldown for Dive begins on successfully diving rather than on activating the ability. The cooldown will not be triggered at all if the player does not actually dive" — https://runescape.wiki/w/Dive
- **[VERIFIED]** Exception, Shatter: "If Shatter is used on a target with no Storm Shard stacks, adrenaline will be lost, but the ability will not initiate cooldown." — https://runescape.wiki/w/Shatter
- **[VERIFIED]** Cooldowns tick during the GCD (implicit in the queueing rule): "The main function of ability queuing is to either queue an ability during global cooldown at a time before global cooldown ends such that it is cast after global cooldown, or for the ability to be cast when it's no longer on internal cooldown (and the player is not on global cooldown)." — https://runescape.wiki/w/Ability_queueing. Also the 14 Sep 2015 patch: "Queuing abilities on cooldown will no longer wait an extra tick before triggering."
- **[INFERRED]** Model: on the cast tick T, set `readyTick = T + cooldownTicks`; the ability is castable on tick `readyTick`. Internal cooldown and GCD are independent timers; both must be ≤ 0 to cast. The wiki gives cooldowns in seconds/ticks (e.g. Assault "10 ticks (6 s) cooldown", Backhand "25 ticks (15 s)", Rend "17 ticks (10.2 s)").
- **[OPEN]** Whether the ability is usable on tick `T+cd` or `T+cd+1` (off-by-one) is not stated explicitly anywhere; the 2015 patch note above suggests no extra tick. Needs in-game verification.

### 1.2 Charges (basic stuns, Surge/Escape)

- **[VERIFIED]** "Basic stuns remain, and unlock a second charge allowing the player to use them twice before needing to wait for the cooldown (similar to Double Surge)." — https://runescape.wiki/w/Combat_Style_Modernisation#All_styles
- **[VERIFIED]** Double Surge charge model: "Surge will gain a second charge with an independent cooldown, allowing the ability to be used twice in a row. At most one of the cooldowns is visible at any given time" — https://runescape.wiki/w/Surge#Double_Surge
- **[VERIFIED]** Double Escape differs: "The first charge of escape has an invisible cooldown which is the same as the ability's normal cooldown, while the second charge will put the ability on cooldown for 20 seconds (10 with the Mobile perk). If Escape is only used once within the cooldown time of the first charge, it will reset" — https://runescape.wiki/w/Escape#Double_Escape
- **[OPEN]** Level for the second stun charge: Backhand/Impact/Binding Shot pages and Patch Notes Part 1 say level **54** ("Gains a second charge at Level 54"), the Combat Style Modernisation overview table says "Second charge unlocked at level 70". Ability pages + patch notes (54) are more likely correct.

### 1.3 "Cooldown reset" / "immediately available" wording

- **[VERIFIED]** Living Death: "On-cast: Resets the cooldown of Touch of Death and Death Skulls." and "upon casting Living Death, Touch of Death and Death Skulls have their cooldown reset, allowing for their immediate use." — https://runescape.wiki/w/Living_Death
- **[VERIFIED]** Bladed Dive: "Enemies hit will reset the cooldown of Bladed Dive if they die within 10 ticks (6 s)." / "If any target dies within 6 seconds after Bladed Dive damaging them, the ability's cooldown is reset, immediately allowing Bladed Dive to be used again." — https://runescape.wiki/w/Bladed_Dive
- **[VERIFIED]** Temporal Anomaly (aspect spell): "grants a chance to reset the cooldown of any Magic ability used ... up to a maximum cooldown reset chance of 20%." Cannot reset "Sunshine, Magma Tempest (Targeted), and Runic Charge (This is due to the fact that only abilities that have a 'targeted NPC' can be reset)" and "Magic Weapon Special Attacks". — https://runescape.wiki/w/Temporal_Anomaly
- **[VERIFIED]** Roar of Awakening/Ode to Deceit: "At 1 stack, bleed abilities have a 30% chance to deal all damage at once and reset their cooldown" — https://runescape.wiki/w/Combat_Style_Modernisation#Magic_details
- **[VERIFIED]** Full resets: "Exiting to Lobby and re-entering the world resets all cooldowns"; Altar of War with the War's Wares unlock resets "the cooldown of all abilities, Weapon Special Attacks, incantations (excluding Life Transfer) as well as ... powerburst of vitality, Excalibur, enhanced Excalibur, and the ancient elven ritual shard." — https://runescape.wiki/w/Cooldown
- **[INFERRED]** "Reset" = set `readyTick = now` (usable this tick if GCD allows); "reduced to X" = `readyTick = min(readyTick, now + X)` applied as a cap while the buff is active (see Berserk/Living Death below).

### 1.4 Cooldown-reduction effects (who reduces what)

| Source | Effect (verbatim) | URL |
|---|---|---|
| Berserk → Overpower | "Cooldown of Overpower reduced to 15 ticks (9 s) (does not reset cooldown)" (CSM table); Berserk page: "Overpower has its cooldown reduced to 9 seconds." | https://runescape.wiki/w/Berserk |
| Living Death → Death Skulls / Touch of Death | "Death Skulls: Cooldown reduced to 17 ticks (10.2 s)." + "On-cast: Resets the cooldown of Touch of Death and Death Skulls." Death Skulls page: "While Living Death is activated, Death Skulls has its cooldown reset and reduced to 17 ticks." | https://runescape.wiki/w/Living_Death, https://runescape.wiki/w/Death_Skulls |
| Preparation → Resonance/Divert | "Remaining cooldown of Resonance and Divert are reduced by 5 ticks (3 s) for every attack received. 16 ticks (9.6 s) duration." "Hard typeless hits do not contribute". | https://runescape.wiki/w/Preparation |
| Piercing Shot → Snipe | "Each hit reduces the cooldown of Snipe by 4 ticks (2.4 s)"; Snipe page: "reduces the cooldown by 2.4 seconds per shot that hits (4.8 seconds total). While wearing fleeting boots or enhanced fleeting boots this is increased to 3.6 seconds per shot (7.2 seconds total), and the ranged basic attack will also reduce the cooldown by 3.6 seconds." | https://runescape.wiki/w/Piercing_Shot, https://runescape.wiki/w/Snipe |
| Hurricane → itself | "Reduces cooldown of Hurricane by 5 ticks (3 s) per enemy hit" ... "if the ability hits at least 7 enemies its cooldown will be reduced to zero. If the ability is empowered by bloodlust, the number of required enemies to negate the cooldown is reduced to 3." | https://runescape.wiki/w/Hurricane |
| Greater Flurry → Berserk | No longer a cooldown reduction: "Now extends the duration of active Berserk, instead of reducing the cooldown of Berserk" — "Each attack increases the duration of Berserk, if active, by 1 tick (0.6 s)" | https://runescape.wiki/w/Combat_Style_Modernisation#Melee_details |
| Igneous Kal-Ket/Zuk (Overpower) | Not a cooldown effect any more: "Causes it to hit twice but reduces damage per hit from 520-570% to 280-340%" / "Removed Overpower adrenaline cost reduction effect (Overpower now always costs 60%)" | https://runescape.wiki/w/Combat_Style_Modernisation#Melee_details |
| Igneous Kal-Mej/Zuk (Omnipower) | "Omnipower hits the target four times, each hit dealing 120%–150% ability damage (instead of once for 420-500%)" | https://runescape.wiki/w/Igneous_Kal-Mej |
| Igneous Kal-Xil/Zuk (Deadshot) | "Deadshot deals 8 hits of 55-75% ability damage (instead of 4 hits of 105-125%)" | https://runescape.wiki/w/Igneous_Kal-Xil |
| Igneous Kal-Mor/Zuk (Death Skulls) | "Death Skulls bounces two additional times when used against monsters (6 bounces instead of 4)" | https://runescape.wiki/w/Igneous_Kal-Zuk |
| Planted Feet (perk) | Not a cooldown effect: "Increases duration of Death's Swiftness by 13 ticks" / Sunshine "will last for 63 ticks, although its damage-over-time effect is removed"; "The duration of Greater Sunshine and Greater Death's Swiftness do not benefit from the Planted Feet perk." | https://runescape.wiki/w/Planted_Feet |
| Greater Sunshine / Greater Death's Swiftness | Longer duration versions (63 ticks vs 50), not cooldown reducers. | https://runescape.wiki/w/Greater_Sunshine |
| Mobile perk / Shadow's Grace | Surge/Escape/Dive/Bladed Dive/Barge/Greater Barge: "bringing the cooldown down to 10.2 seconds" (halved). Surge: "If an item with Mobile is equipped after the first Surge was used, the second instance of Surge will not have a reduced cooldown". | https://runescape.wiki/w/Surge, https://runescape.wiki/w/Bladed_Dive |
| Powerburst of acceleration | "instantly reset the cooldown of Surge and reduce the cooldown to 1.2 seconds for six seconds" | https://runescape.wiki/w/Surge |
| Reflexes perk (Anticipation) | "The Reflexes perk halves its duration and cooldown." Clear Headed "lengthens Anticipation's duration by 2 ticks per rank but removes its damage reducing effect." | https://runescape.wiki/w/Anticipation |
| Preparation perk | "increases the duration and cooldown of this ability by 15% per rank." | https://runescape.wiki/w/Preparation |
| Turtling perk (Barricade) | "extends the duration of this ability in exchange for increasing its cooldown, up to a 13.8 second duration and a 84 second cooldown." | https://runescape.wiki/w/Barricade |

### 1.5 Does a reduction apply to an ability already on cooldown?

- **[VERIFIED]** Yes for "remaining cooldown" effects: Preparation "Remaining cooldown of Resonance and Divert are reduced"; Piercing Shot "reducing the remaining cooldown of Snipe by 2.4 seconds per hit"; Ranged basic attack with fleeting boots "reducing the remaining cooldown of Snipe by 3.6 seconds per hit" (https://runescape.wiki/w/Ranged_(ability)).
- **[VERIFIED]** Berserk explicitly does **not** reset: "Cooldown of Overpower reduced to 15 ticks (does not reset cooldown)". **[INFERRED]** so an Overpower on 40 ticks remaining when Berserk is cast is capped to 15 ticks remaining; an Overpower cast during Berserk gets a 15-tick cooldown.
- **[VERIFIED]** Living Death both resets on cast and caps subsequent Death Skulls cooldowns to 17 ticks.
- **[OPEN]** Whether the Berserk cap applies to the remaining cooldown at activation or only to Overpowers cast *during* Berserk is not stated; "does not reset" implies a cap on remaining time.

### 1.6 Shared cooldowns

- **[VERIFIED]** "Dive and Bladed Dive share a cooldown" ("Bladed Dive and Dive are unlinked and now appear as 2 separated abilities, they still share the same cooldown though." — 7 Apr 2026). "Concentrated Blast and Sonic Wave now share a cooldown" (2023) is **reverted**: "No longer shares cooldown with [Greater] Concentrated Blast". "Surge and Escape no longer share cooldowns, except in PvP scenarios." (16 Mar 2026). "Corruption Blast shares its cooldown timer with Corruption Shot." "Resonance shares the same cooldown as Divert." "Magma Tempest and Magma Tempest (Targeted)" share. — https://runescape.wiki/w/Cooldown#Shared_cooldown, https://runescape.wiki/w/Combat_Style_Modernisation, https://runescape.wiki/w/Corruption_Blast

---

## 2. Channelled abilities

### 2.1 General rules

- **[VERIFIED]** "Channelled abilities are abilities that take a certain amount of time or a number of hits to execute. Unlike standard abilities, most channelled abilities require the player be locked in to using the ability, up to a maximum amount of time longer than a global cooldown. A Channel Bar displays while a channelled ability is performed." — https://runescape.wiki/w/Abilities#Channelled
- **[VERIFIED]** Cancelling: "These abilities are able to be cancelled by performing another ability (or by walking or similar actions)." (same URL). Patch 26 Jun 2017: "While using combat channelling abilities, you can now click away to stop the channel."
- **[VERIFIED]** Movement: "Melee channelled abilities allow the player to move around their target while using them, as long as they remain within attack range. Rapid Fire always allows movement, and Nightmare gauntlets allow movement while using Snipe." (same URL). CSM: "Movement does not interrupt the ability, as long as you remain in range" (Assault/Flurry/Greater Flurry); Rapid Fire "Movement no longer interrupts the ability (no longer requires fleeting boots for this effect)".
- **[VERIFIED]** Non-melee channels are cancelled by movement: Concentrated Blast "As it is a channelled ability, movement will cancel it immediately."; Snipe "Using another ability, moving, or the target moving out of range before the channel is complete will prevent the ability's damage."; Onslaught "can be cancelled at any time by moving or using another ability, halting adrenaline drain and self damage." — https://runescape.wiki/w/Concentrated_Blast, https://runescape.wiki/w/Snipe, https://runescape.wiki/w/Onslaught
- **[VERIFIED]** Target dying (AoE channel): "If Flurry kills its initial target before the ability is finished, surrounding targets will no longer take damage from the rest of the combo attack." — https://runescape.wiki/w/Flurry
- **[VERIFIED]** GCD is 3 ticks, not the full channel: "This triggers from the moment of use, so after a channelled ability, the player can immediately use another ability." (Abilities#Cooldown). Also "Since most abilities are instant-cast, this means that the 'casting time' (or 'channelling time') is less than the global cooldown, and players usually need to wait for the remaining global cooldown." — https://runescape.wiki/w/Cooldown#Global_cooldown
- **[VERIFIED]** Cease "Stops any in use channelled ability." and "Cancels any queued abilities, including those queued by revolution." — https://runescape.wiki/w/Cease
- **[VERIFIED]** Queueing during a channel is allowed: "Players can now reliably queue abilities while they are currently channeling an ability such as Concentrated Blast" (28 Jan 2019). Queued/revo abilities fire when the GCD ends and therefore cut the channel — see §8 and the "Saving a tick with Rapid Fire" trick.
- **[VERIFIED]** Internal name for a hit: "the internal name Jagex uses to describe each cast of a channelled ability is 'iteration'." — https://runescape.wiki/w/Abilities#Trivia

### 2.2 Channel cancelling technique

- **[VERIFIED]** (historic wording, principle still valid) Concentrated Blast: "Cancelling it after the global cooldown effectively made it a 200% damage basic ability" — https://runescape.wiki/w/Concentrated_Blast (Update history). Asphyxiate: "If channelling is cancelled, the target is still bound for 1.2 seconds." (https://runescape.wiki/w/Stun#Abilities).
- **[INFERRED]** Model: a channel of N iterations schedules hits at fixed tick offsets; casting any GCD ability on tick ≥ cast+3 (or moving for non-melee channels, or Cease) removes all not-yet-landed iterations. "Completing the channel" effects (Channelled Might, Dracolich infusion) require all iterations.
- **[VERIFIED]** Completion-gated effects: Asphyxiate "Completing the channel applies Channelled Might for 10 ticks"; Channelled Might "trigger = Casting Asphyxiate for its full duration." Rapid Fire + Dracolich: "channelling Rapid Fire for its full duration grants Dracolich infusion".

### 2.3 List of channelled abilities after the modernisation

- **[VERIFIED]** Abilities page: Melee "Assault, Flurry, Greater Flurry"; Magic "Concentrated Blast, Greater Concentrated Blast, Asphyxiate, Smoke Tendrils"; Ranged "Snipe, Rapid Fire"; Necromancy "Blood Siphon"; Constitution "Onslaught". "Additionally, the Weapon Special Attacks for the hand cannon and Armadyl battlestaff are channelled." — https://runescape.wiki/w/Abilities#Channelled. (Channel Bar page also lists Lava whip "Get Over Here!" and still lists removed abilities Destroy/Frenzy/Detonate/Unload/Lesser variants — outdated.)
- Hit timings (verbatim):
  - Assault: "Attack 4 times over 7 ticks"; "Assault hits 1 tick after it was cast, and deals subsequent hits every 2 ticks ... Cast 0 | Hit 1 | 3 | 5 | 7". Cooldown "6" s (10 ticks). https://runescape.wiki/w/Assault
  - Flurry / Greater Flurry: "Attack 8 times over 8 ticks"; "The 8 hits will each land 1 tick apart starting with tick 1, with tick 0 being the tick that the ability was used." "Stuns and Binds the target for 6 ticks". https://runescape.wiki/w/Greater_Flurry
  - Rapid Fire: "Attack 8 times over 8 ticks"; "Binds the target for 10 ticks"; "Each attack extends the duration of Searing Winds by 1 tick"; "Can move while channelling." https://runescape.wiki/w/Rapid_Fire
  - Asphyxiate: "Attack 4 times over 7 ticks. 120%-140% ... per hit. Stuns and Binds the target for 6 ticks." Stun page: "The first 3 hits stun for 1.2 seconds each. The 1st hit is guaranteed to stun even if it misses. The 4th hit binds for 1.2 seconds." With 4+ Tumeken's: "Attack 8 times over 8 ticks. 72%-84%". https://runescape.wiki/w/Asphyxiate
  - Concentrated Blast / Greater: "Attack 3 times over 3 ticks"; "Duration reduced from 5 ticks - now fits into one global cooldown"; crit buff "applies to the next ability, not the next hit" (Patch Notes Part 2). Cooldown 9 ticks. https://runescape.wiki/w/Concentrated_Blast
  - Snipe: "300-360% Ranged damage after 3 ticks. Channelled."; "Duration reduced from 4 ticks - now fits inside a global cooldown"; 100-tick cooldown; no adrenaline. https://runescape.wiki/w/Snipe
  - Smoke Tendrils: "4 hits: 55-65%, 65-80%, 75-95%, 85-110% ... every 2 ticks (channelled)"; "the player is bound in place"; "Guaranteed to critically strike."; 75-tick cooldown. https://runescape.wiki/w/Smoke_Tendrils
  - Onslaught: "100-120% damage per hit every 2 ticks. 26 hits. Channeled. Deals an additional 18-22% damage with each hit. Consumes up to 25% adrenaline per hit." "Moving while using melee will interrupt the channel, always." Not affected by "Berserk, Death's Swiftness, and Sunshine". https://runescape.wiki/w/Onslaught
- **[VERIFIED]** Greater Barge → channel becomes a DoT: "After 8 ticks since your last attack, your next Channelled ability cast within 10 ticks is dealt as Damage over time." "This means that another ability can be used once this effect is consumed without cancelling out the channeled ability used to consume the Greater Barge effect. Critical strikes and damage boosting effects will also increase the damage dealt from these hits." "When using Flurry or its stronger variant with Greater Barge's effect, the AoE effect is completely removed". Beta note: "Channelled abilities that are converted to damage-over-time now use the normal hit timings of the ability, rather than being forced to every 4 ticks". — https://runescape.wiki/w/Greater_Barge, https://runescape.wiki/w/Combat_beta_(2023)

---

## 3. Basic attacks (auto-attacks are gone)

- **[VERIFIED]** "In the 2026 Combat Style Modernisation update, Magic, Ranged, and Melee basic attacks have been added to Magic, Ranged, and Melee respectively, fully replacing auto-attacks. All four basic attacks were then considered to be standard basic abilities". "With all basic attacks operating on a fixed 1.8 second global cooldown, individual weapon speeds are no longer functionally relevant." — https://runescape.wiki/w/Basic_attacks
- **[VERIFIED]** "All weapons (of all styles) were unified to a 3-tick attack speed, and thus the speed was removed from tooltips - the overall ability damage of weapons is the same." — https://runescape.wiki/w/Combat_Style_Modernisation#All_styles. Attack rate page: "Player's weapons also possess attack speeds, but this attribute is hidden and is only used to calculate a weapon's damage; all players attack every 3 ticks (1.8 s), which is the global cooldown." — https://runescape.wiki/w/Attack_rate
- **[VERIFIED]** Patch notes: "These new Basic Attacks: Operate on the standard global cooldown system ... Magic Basic Attacks use the data and effects of your currently selected spell ... Hex spells now operate on the standard global cooldown system instead of the legacy auto-attack timer ... Off-hand spellcasting has been removed" — https://runescape.wiki/w/Update:Patch_Notes:_Part_1_-_Combat_Style_Modernisation
- **[VERIFIED]** Auto-fire: "Basic attacks are automatically triggered during combat unless this is toggled off in ... Combat & Action Bar > Combat Mode". "during Revolution, basic attacks are never used unless there are no other useable abilities within the action bar's specified Revolution size, even if basic attacks are placed first in the action bar." — https://runescape.wiki/w/Basic_attacks
- **[VERIFIED]** Damage/adrenaline/cooldown: Attack (melee) "110-130% melee ability damage. Generate 1 Bloodlust stack. No cooldown (other than global cooldown)"; Ranged "90-110%"; Magic "90-110%"; all "+9%" adrenaline. Dark bow/Gloomfire "Now causes basic attack to deal 2 hits of 45-55% ranged ability damage." Magic: "Ancient Magicks combat spells cast using this ability will have their special effects (and area targeting, if applicable) activate 100% of the time." — https://runescape.wiki/w/Combat_Style_Modernisation, https://runescape.wiki/w/Magic_(ability)
- **[VERIFIED]** Perk interactions: "Fury of the Small and Invigorating 4 cause basic attacks to generate 12% adrenaline. An Impatient proc and Invigorating 4 cause basic attacks to generate 14.4% adrenaline." — https://runescape.wiki/w/Basic_attacks
- **[VERIFIED]** Old system is deleted content: Auto-attack page carries "{{Deleted content|update=March's Month Ahead & Combat Style Modernisation}}"; 4-tick auto-attack: "auto attacks were removed from the game, and thus it is no longer possible to perform four-tick auto-attacking." — https://runescape.wiki/w/Auto-attack, https://runescape.wiki/w/4-tick_auto-attack
- **[INFERRED]** Simulator: there is no separate attack timer. A basic attack is just a GCD-bound basic ability with 0 internal cooldown; "auto" mode fires it on any tick where the GCD is free and no other ability was chosen. Weapon speed tiers (fastest/fast/average/slowest) no longer exist as timing inputs.

---

## 4. Stuns and binds

### 4.1 Definitions / durations

- **[VERIFIED]** Stun: "cause the target to be unable to attack or move for the duration." Bind: "cause the targets to be locked in place, preventing them from moving. Unlike stun effects, targets under the bind effect can still use abilities, spells, and items". — https://runescape.wiki/w/Stun, https://runescape.wiki/w/Bind
- Player-sourced durations after 2 Mar 2026 (CSM tables + ability pages):
  - Backhand: "Stuns and binds target for 3 ticks (1.8 s)" (was 2); cooldown 25 ticks; 2 charges. https://runescape.wiki/w/Backhand
  - Impact: "Stuns and binds target for 3 ticks"; cooldown 25 ticks; 2 charges. https://runescape.wiki/w/Impact
  - Binding Shot: "Stuns target for 2 ticks. Binds target for 16 ticks."; cooldown 25 ticks; 2 charges. "With the Flanking perk Binding Shot loses its stun property". https://runescape.wiki/w/Binding_Shot
  - Flurry / Greater Flurry: "Stuns and binds main target for 6 ticks" (Stun page: "Up to 3.6 seconds").
  - Asphyxiate: "Stuns and binds target for 6 ticks" (see §2.3 for per-hit breakdown).
  - Rapid Fire: "Binds the target for 10 ticks".
  - Barge / Greater Barge: "Binds target for 11 ticks (6.6 s)"; "Clears user's Bound debuff".
  - Soul Strike (Necro): "Stuns and binds for 3 seconds. Uses one Residual Soul stack."
  - Removed: "All threshold-stuns (Forceful Backhand, Deep Impact, Tight Bindings) and movement-stuns (Kick, Stomp, Shock, Horror, Demoralise, Rout) were removed." Knockback moved to "Scare Tactics" toggle.
- **[VERIFIED]** Monster immunity: "Certain monsters, including most bosses, are capable of being immune to stuns, possessing the Stun Immune status". Stunned status "Cannot be applied if the target is affected by Freedom, Anticipation, Transfigure stun immunity or Stun Immune"; Bound status "Cannot be applied if the target is affected by Freedom, Transfigure stun immunity or Stun Immune". — https://runescape.wiki/w/Stunned_(status), https://runescape.wiki/w/Bound_(status)

### 4.2 Player immunity (Anticipation, Freedom, Transfigure)

- **[VERIFIED]** Anticipation: "Reduce all damage taken by 10%. Immune to stuns. 17 ticks (10.2 s) duration."; cooldown 24.6 s; "Anticipation must be activated before getting stunned in order to work." Note: **stun only, not bind**. — https://runescape.wiki/w/Anticipation
- **[VERIFIED]** Freedom: "Remove stuns and binds. Clear damage over time effects. Gain immunity to stuns and binds. 10 ticks (6 s) duration."; cooldown 30 s; "Freedom currently does not prevent a second stun within the 6 seconds it's intended to give stun immunity to the player, making NPCs capable of stunning the player again." A stunned player can still use Freedom: "Using any abilities, except for Freedom." — https://runescape.wiki/w/Freedom, https://runescape.wiki/w/Stun
- **[VERIFIED]** Transfigure: "The ability cannot be used whilst immune to stuns. While under the effects of Transfigure, all other abilities (including Freedom) are disabled." then "immunity to stuns and binds for 25 ticks (15 s)". — https://runescape.wiki/w/Transfigure

### 4.3 Bonus damage vs stunned/bound targets (post-modernisation)

- **[VERIFIED]** Piercing Shot: "Bonus damage against bound/stunned targets removed" — https://runescape.wiki/w/Combat_Style_Modernisation#Ranged_details
- **[VERIFIED]** Punish: "Deals 2.5× damage if the target's life points are below 50%" (HP-gated, not stun-gated) — https://runescape.wiki/w/Punish
- **[VERIFIED]** Wrack (was stun/bind-gated) is removed: "Abilities removed ... Wrack, Wrack and Ruin" — https://runescape.wiki/w/Combat_Style_Modernisation#Magic_details
- **[INFERRED]** No remaining player ability in melee/ranged/magic has a "vs stunned/bound" damage condition. Stuns now only matter for boss mechanics (Stun page lists e.g. Solak, Zamorak, Yakamaru, Telos Freedom).

### 4.4 Target immunity timer

- **[VERIFIED]** PvP only: "Stuns applied to players in PvP combat will trigger diminishing returns. Consequently, after experiencing a certain number of stuns within a short period of time, the target will temporarily become immune"; "The diminishing-returns drop off for stuns in PvP combat has been lowered to 7.2 seconds." Diminishing returns page: "On the third use, the duration is further reduced, rounding down. After this, the target becomes immune to all effects of that type for a short period of time." — https://runescape.wiki/w/Stun#Diminishing_returns, https://runescape.wiki/w/Diminishing_returns
- **[VERIFIED]** NPC-on-NPC only: "NPCs that have been stunned by another NPC will become immune to non-player stuns for 10 seconds, up from 3."
- **[OPEN]** No wiki statement of a post-stun immunity window for **player stuns on NPCs**. For PvM simulation assume none (stack/overwrite behaviour of overlapping stuns is also unstated).

---

## 5. Bleeds / damage over time

- **[VERIFIED]** Definition: "Damage over Time (DoT) abilities, described as bleeds or burns in game, are abilities that have their effects last longer than one global cooldown, but unlike channelled abilities, they cannot be cancelled by the player." — https://runescape.wiki/w/Abilities#Damage_over_Time_abilities. Post-CSM list: Melee "Dismember, Slaughter, Massacre"; Ranged "Corruption Shot"; Magic "Combust, Corruption Blast"; Necromancy "Bloat". Bleed subset: melee "Dismember, Slaughter, Massacre" (+Abyssal Parasite); Ranged only Phantom Strike (Morrigan's javelin); burns: Combust, Soulfire, Dragon Rider amulet Dragon Breath.
- **[VERIFIED]** Deadshot is no longer a bleed: "As it is no longer a bleed, it can now critically strike and benefit from Death's Swiftness". Death's Swiftness "No longer deals damage-over-time" (16 Mar patch). Sunshine/Greater Sunshine keep the area DoT ("10-20% magic ability damage every 3 ticks if it is standing inside the area"), removed by Planted Feet.
- **[OPEN]** The Abilities page still says "DoT abilities are multi-hitting abilities that hit every 2 game ticks" — outdated: Combust "every 3 ticks", Slaughter "every 3 ticks", Massacre "every 4 ticks", Dismember "every 2 ticks", Corruption Blast/Shot "every 2 ticks". Use the per-ability values.
- Per-ability (verbatim, https://runescape.wiki/w/Combat_Style_Modernisation#Melee_details and ability pages):
  - Dismember: "8 hits of 25-35% ... every 2 ticks (bleed). Heals user for 4% of damage dealt. Enables second cast for 40 ticks. 40 ticks cooldown (applies if you use all of your available casts)".
  - Slaughter: "6 hits of 80-100% ... every 3 ticks (bleed). Heals user for 6%. Enables third cast for 40 ticks", costs 25%.
  - Massacre: "110-130% ... Followed by 6 hits of 100% ... every 4 ticks (bleed). Heals user for 12%", costs 25%. Sequence "Resets if no ability in sequence is used for 25 seconds, or when Massacre is used."
  - Combust: "10 hits of 27-33% ... every 3 ticks (bleed/burn)"; "The percentage is decided on the first hit, and each subsequent hit will deal the same damage as the first." 30-tick cooldown.
  - Corruption Blast / Shot: "Initial hit of 90-110% ... 4 more hits (every 2 ticks), dealing 0.8×, 0.6×, 0.4×, and 0.2× of initial hit". 25-tick cooldown; both cost 20% and share a cooldown.
- **[VERIFIED]** Stacking / refresh: "All three bleeds can be active at the same time" (Dismember/Slaughter/Massacre). "The corruption can be used together with other damage over time abilities without overriding their effects, including Corruption Shot." General DoT rule: "Each effect has a base number of ticks and a base tick frequency ... There is no way to increase the frequency of effect and thus cause damage faster. Applying the same effect will only refresh the effect and maintain the same maximum duration." — https://runescape.wiki/w/Damage_over_time. **[INFERRED]** re-applying the *same* DoT refreshes (restarts) it rather than stacking a second instance; different DoTs coexist.
- **[VERIFIED]** Damage computed per tick with current modifiers: "At regular intervals, the damage over time effect will calculate the damage value and deal damage ... in certain situations (such as when Vulnerability is applied midway), the amount of damage will increase, and subsequent damage will be higher." (Combust is the exception quoted above: "decided on the first hit".) Greater Barge DoTs: "unequipping or changing the weapon during the damage-over-time effect will alter the damage due to the nature of this ability rolling each hit."
- **[VERIFIED]** Crits: "Most damage over time abilities (bleeds, burns, etc.) can never critically strike and are unaffected by all forms of critical strike chance increases. The initial hit of Bloat may critically strike, but the subsequent hits cannot critically strike. Note that channelled enhanced abilities under the effects of Greater Barge are not considered bleeds and may critically strike." Magma Tempest: "Cannot critically strike". — https://runescape.wiki/w/Critical_strike#Damage_over_time_abilities
- **[VERIFIED]** Modifiers that do NOT apply to DoTs: "Damage boosting prayers and Ancient Curses (aside from their accuracy bonus); Damage boosting abilities: Berserk, Death's Swiftness, and Sunshine; Zaros godsword's special attack; Berserker's Fury relic power; Berserker necklace's passive effect; Most perks affecting variable damage, including Genocidal, Precise, and Ruthless; ... Critical strikes; Slayer helmet and its variants; All enchanted bolts". Modifiers that DO apply: "Damage bonus from equipment; Visible combat skill boosts, from potions or other sources; Vulnerability or its lesser form, Curse; The Eruptive perk; ... Dragon, Demon, and Undead Slayer perks/abilities ...; The hexhunter bow, inquisitor staff and terrasaur maul; Scrimshaws and the Scripture of Amascut; Icy Precision effect granted by Wen arrows" — https://runescape.wiki/w/Template:Bleeds:_Unaffected_boosts
- **[VERIFIED]** Extension/boost effects: "Strength cape extends duration of Dismember, adding 3 additional hits." "Masterwork Spear of Annihilation extends the duration of bleeds by 50%. In practice this is rounded down, meaning that a 5 hit bleed will result in 2 extra hits." (Dismember page: "extends Dismember by 4 hits to a total of 12 hits"). "The Lunging perk increases the damage of Dismember by 10% + 3% additional per rank". Gloves of passage: "increase the damage a target takes from bleeds for 10 seconds after a successful Rend hit"; enchantment of agony "25%". Strength master cape: "Dismember, Slaughter and Massacre heal an additional 3%". Champion's ring "+3% critical hit chance against targets affected by a bleed" (+4% / +1.5% crit dmg per unique bleed enchanted). Jaws of the Abyss "2% additional adrenaline ... to damaging basic melee abilities per bleed on the target". Roar of Awakening/Ode: 30% instant-dump + reset at 1 stack; "With 2 items equipped - Damage-over-time abilities deal 30% increased damage." Kerapac's wrist wraps: Combust within 6 s after Dragon Breath "immediately apply all ten hits onto the target with an additional 25% damage bonus". — https://runescape.wiki/w/Abilities#Bleed_abilities, https://runescape.wiki/w/Combust
- **[VERIFIED]** Freedom removes: "Bloated, Combust, Corruption Blast, Corruption Shot, Deadshot, Dismember, Slaughter, Massacre, Fragmentation Shot ..." and does NOT remove Greater-Barge-converted "Assault / Flurry / Greater Flurry" DoTs ("Applied to targets hit with Assault whilst the user is under the effects of Endless Assault"). — https://runescape.wiki/w/Freedom#Removeable_damage-over-time_effects. Corruption Blast: "Freedom can be used to clear the corruption effect; however, it will still have a brief moment to spread."
- **[OPEN]** The status pages (Dismember (status) "maximum of 5 hits", Combust (status) "maximum of 5 hits ... every 1.8 seconds") are pre-CSM leftovers; trust the ability pages.

---

## 6. Style resources introduced 2 March 2026

### 6.1 Melee — Bloodlust (a real stacking resource)

- **[VERIFIED]** "All Melee basic abilities, with the exception of Bladed Dive, generate 1 stack of bloodlust, up to a maximum of 4, and Rend generates 2 stacks. When at 4 stacks, they can be spent to empower Assault, Hurricane, Flurry, or Greater Flurry" — https://runescape.wiki/w/Bloodlust
- Trigger/duration/effects (verbatim from the infobox):
  - "Activating any basic Melee ability, except for Bladed Dive, grants 1 stack"; "Activating Rend grants 2 stacks"; "Activating Berserk grants 4 stacks, and whilst active causes basic abilities to grant twice the usual number of stacks"; "Maximum of 4 stacks — Increases to 8 stacks during Berserk".
  - Duration: "Until consumed by affected abilities"; "Removed by some teleports". (No timer: `|timer = No`, `|stacks = Yes`.)
  - "Activating Assault consumes 4 stacks, causing the damage to be increased from 130%-150% damage to 170%-190% damage"; "Activating Hurricane consumes 4 stacks, causing it to deal another instance of 75%-95% damage to the target and up to 9 additional targets"; "Activating Flurry or Greater Flurry consumes 4 stacks, causing them to deal 1% increased damage for each 1% Life Points the target is missing, up to a maximum of 65%".
  - Attack (basic attack) "Generates 1 Bloodlust stack" (so the basic attack does generate; Bladed Dive does not). 29 Jun 2026: "Bloodlust stacks are now disabled during classic combat mode".
- **[VERIFIED]** Consumption is automatic when ≥ 4: Assault "can be empowered if the player has 4 or more Bloodlust stacks when it is cast. This will consume 4 Bloodlust stacks". **[OPEN]** no toggle to *not* spend is documented.
- **[OPEN]** Whether stacks expire on leaving combat/logout is not stated beyond "Removed by some teleports".

### 6.2 Magic — Runic Charge → Anima Charged (single-use empowerment, not a stack resource)

- **[VERIFIED]** Runic Charge: utility, level 26, "Applies Anima Charged to self. 25 ticks (15 s) duration. Can be cast during the global cooldown. Must be manually triggered during revolution combat." 30 s cooldown, 0 adrenaline. "The Anima Charged status lasts 15 seconds or until one of the following abilities is activated." — https://runescape.wiki/w/Runic_Charge
- Effects: "Sonic Wave: Your next Magic ability costs 35% less Adrenaline. Greater Sonic Wave: ... 45% less. Dragon Breath: Deals 260%-310% Magic damage. Concentrated Blast / Greater Concentrated Blast: Each attack grants an additional 10% Critical Strike Chance." (Anima Charged page: "duration = 15 seconds or until casting one of the affected abilities"). **[OPEN]** The CSM overview says "+20% critical strike chance" per Conc Blast attack and "+25%" Flow; the ability/status pages say +10% per attack; Critical strike page says "increases from 5% per hit to 15% per hit" (= +10). Use +10%/hit.
- Related magic buffs: Flow "Reduces the adrenaline cost of the next Magic ability by 10% ... duration 9 seconds, Removed upon activating a Magic ability that costs adrenaline" (Greater Flow 20%). Channelled Might "Increases critical strike damage by 15%" for 3.6 s after full Asphyxiate (35% / 9 s with 5 Tumeken's). Concentrated Blast crit stacks: "Swapping one's main hand weapon will remove the critical hit chance buff toward the next attack." Tsunami: "Critical Strikes generate an additional 8% Adrenaline for 50 ticks" ("30.6 seconds (despite the tooltip stating 30 seconds)"). — https://runescape.wiki/w/Flow, https://runescape.wiki/w/Channelled_Might, https://runescape.wiki/w/Tsunami

### 6.3 Ranged — no stack resource; two self-buffs (Searing Winds, Shadow Imbued)

- **[VERIFIED]** "No comparable new resources are introduced for ranged" (CSM). Identity: "'a lot of small hits', with many abilities taking an on-hit effect. This is capitalised on by the two new abilities, Galeshot and Imbue: Shadows".
- Galeshot (basic, lvl 58, 34-tick cd): "Apply Searing Winds buff to self for 10 ticks: ranged attacks deal additional bonus damage (20% ranged ability damage) with each hit". Searing Winds: "It adds flat damage to all ranged ability hits equal to 20% of the player's ability damage"; "Each iteration of Rapid Fire increases the duration by 0.6 second"; "The extra damage is calculated on cast, meaning that if an ability is cast on the same tick the buff runs out, it will still benefit from the effect." — https://runescape.wiki/w/Searing_Winds
- Imbue: Shadows (enhanced, lvl 90, −40%, 100-tick cd): "Apply Shadow Imbued to self for 50 ticks: ranged attacks against your target generate +5% adrenaline per hit". Shadow Imbued: "Activating Shadow Tendrils increases the duration by 3.6 seconds"; "or 10% adrenaline if Natural Instinct is active"; not triggered by "Damage over time hits from corruption shot", "Self damage from Shadow Tendrils", chinchompa extra hits, Split Soul. — https://runescape.wiki/w/Shadow_Imbued, https://runescape.wiki/w/Imbue:_Shadows
- Ammo-based stack systems (Wen "Icy Chill ... 10 stacks", Bik "Evolving Toxin ... 150 stacks", Deathspore "Feasting Spores ... 12 stacks", Splintering "Punctured ... 250 stacks") are listed in https://runescape.wiki/w/Combat_Style_Modernisation#Ranged_details.

### 6.4 Necromancy (unchanged resources, for completeness)

- Necrosis (Touch of Death "Generates 4 Necrosis stacks"; Finger of Death "Adrenaline cost is reduced by 10% for each Necrosis stack. Consumes up to 6"), Residual Souls (Soul Sap +1 per hit, Soul Strike/Volley consume). CSM: "Death Skulls now always costs 60% adrenaline"; "Living Death now reduces the cooldown of Death Skulls to 17 ticks (instead of 20)".

---

## 7. Buff interactions

- **[VERIFIED]** Re-cast refreshes timer (examples): Meteor Strike "Recasting Meteor Strike itself where possible ... refreshes the adrenaline buff timer."; Tsunami "Recasting Tsunami itself where possible ... refreshes the adrenaline buff timer." Aspect spells: "This duration can be extended up to an hour by repeatedly casting the spell". Devotion: "Killing an enemy extends the duration by 8 ticks up to a maximum of 32 ticks" ("If the player kills multiple enemies on the same tick, it is still considered to be one kill."). Greater Flurry extends Berserk "by 1 tick for every successful hit regardless of how many targets are hit". Vestments of havoc (3 pc) "extends Berserk's duration by 10 ticks"; (2 pc) "If another melee ultimate ability is cast while this effect is already active, it instead regenerates 20% adrenaline instantly and immediately ends the regeneration effect." — https://runescape.wiki/w/Meteor_Strike, https://runescape.wiki/w/Berserk, https://runescape.wiki/w/Adrenaline
- **[VERIFIED]** Damage-ult buffs start 1 tick after cast: "the ultimates do not provide the damage boost on the tick they are activated on" (Planted Feet); Sunshine "The damage buff provided from Sunshine begins 0.6 seconds after cast"; Greater DS "total duration of 63 ticks (37.8 seconds), although the damage buff provided begins 1 tick after cast, lasting a total of 62 ticks". Ability queueing page: regular Sunshine/DS "(52 game ticks, buff duration: 1 tick after cast, 51 game ticks total)" and Planted Feet "(64 game ticks, ... 63 game ticks total)". **[OPEN]** These tick counts (50 vs 51/52, 63 vs 64/65) are inconsistent across pages; CSM says Sunshine "for 50 ticks", Greater Sunshine "63 ticks" ("Tooltip corrected to state 37.8 seconds instead of 39. The ability always actually lasted for 37.8 seconds.").
- **[VERIFIED]** Sunshine is area-based, DS is self: Sunshine (status) "Removed upon leaving the area of effect — Reapplied upon re-entering the area of effect"; "While in combat, if your current target is out of range and still alive then Sunshine cannot be activated until the target comes within range". DS: "Death's Swiftness can also be cast even if the target is still alive and out of range." (16 Mar: "No longer places an area, now just applies to yourself"). — https://runescape.wiki/w/Sunshine_(status), https://runescape.wiki/w/Death's_Swiftness
- **[VERIFIED]** Style requirement to activate: "Sunshine and Death's Swiftness (and abilities in general) can only be activated if the main hand (or two-handed) weapon is of the same style as the ability ... The changed effect of the ability is unaffected by switching weapons after activating the ability." — https://runescape.wiki/w/Planted_Feet. Stalled abilities: "the stalled ability can only be released while the equipped weapons are of the same combat style as the ability."
- **[VERIFIED]** Buffs lost on equipment switch: Preparation "if the shield is taken off while Preparation is still active, the effect will be cancelled"; Barricade "If the shield or defender is unequipped or switched ... the ability is cancelled immediately"; Debilitate "If a shield-enhanced Debilitate is used but the player switches it ... Debilitate's effects are immediately removed from the target"; Concentrated Blast crit stacks lost on main-hand swap; Bloodlust "Removed by some teleports"; Living Death "can be ended early due to some teleports"; Golden Touch "Most forms of teleportation will cancel the ability". Style-specific buffs simply do not apply cross-style: "Meteor Strike's adrenaline buff is melee-specific", "Tsunami's adrenaline buff is magic-specific", Berserk multiplies "all melee damage dealt by the player, excluding bleeds or Onslaught".
- **[VERIFIED]** Ultimates are NOT mutually exclusive across styles (no rule found); only these exclusivity rules exist:
  - "Players are no longer able to use the Zaros Godsword's special attack if a different one is already active." (29 Mar 2021 patch, https://runescape.wiki/w/Abilities)
  - "if both are active by the user at the same time, Berserk overrides Blackhole. On the other hand, Annihilation's special attack, Gravitate, does stack multiplicatively with Berserk" — https://runescape.wiki/w/Berserk
  - Aspect spells: "You may only have one aspect active at once." (Vampyrism/Penance/Temporal Anomaly/Animate Dead/Darkness)
  - Transfigure "cannot be used whilst immune to stuns"; Limitless "cannot be activated if the player has 60% or more adrenaline"; Regenerate "Cannot be used in combat."
  - **[OPEN]** "Cannot cast Sunshine while Berserk" — not on the wiki; since ability activation needs a same-style main hand, casting a second style's ult requires a weapon switch, but nothing says the first buff is cleared. Onslaught explicitly ignores "Berserk, Death's Swiftness, and Sunshine".
- **[VERIFIED]** Final-tick rule for queued/revo casts: "These buffs will not apply on the final tick if the player is attempting to trigger the ability through either ability queueing or through revolution(++)" — affected: Greater Barge, Limitless, Ingenuity of the Humans, Berserk, Rampage; unaffected: Sunshine, Death's Swiftness (and greater), Blackhole, Split Soul. — https://runescape.wiki/w/Ability_queueing#Final_tick_of_buffs

---

## 8. Ability queueing and off-GCD abilities

### 8.1 Queueing mechanics

- **[VERIFIED]** "Trying to trigger an ability on cooldown will set it to activate once ready. This applies for abilities that are on their own internal cooldown as well as the global cooldown (GCD)." "During combat, an ability can only be queued if the icon is present at least one game tick earlier before cast. If a player attempts to queue an ability to cast sooner than this, the ability will not be considered queued." "a queued ability can be bypassed if the player manually clicks or presses another ability on the tick before the queued ability is set to be cast. If this is done, the ability that was previously queued remains queued." — https://runescape.wiki/w/Ability_queueing
- **[VERIFIED]** Works with Full Manual and Revolution, not Classic. "As of January 2026, it's disabled by default for new players."
- **[VERIFIED]** Cannot be queued: Bladed Dive, Golden Touch, Surge, Magma Tempest (Targeted), Escape, Quiver ammo slots, Aggression, Unsullied, Limitless, Ingenuity of the Humans, Slayer's Insight, Kuradal's Favour, Demon/Dragon/Undead Slayer, Eat Food. Provoke "Can only be queued without a target". Regenerate queues independently of the toggle.
- **[VERIFIED]** Movement stalling: "A queued offensive ability ... will always force the player to stop moving for casting the ability." (list of non-stalling abilities on the page).
- **[VERIFIED]** Spells during GCD only via queueing: "With ability queueing enabled, it is possible to use magic auto-attacks and other spells such as Vulnerability, Entangle, etc. during global cooldown."
- **[VERIFIED]** Rapid Fire tick save: "Use Rapid Fire on tick so that ability 2 remains on cooldown. Ability 2 will remain queued, even after another GCD passes after the cast of Rapid Fire and will automatically launch as the full channel of Rapid Fire ends such that ability 2 lands early."

### 8.2 Abilities that ignore the GCD — verified list

Wiki wording used: "Can be cast during the global cooldown." / "can be used during, and does not incur, the global cooldown".

| Ability | Verbatim | URL |
|---|---|---|
| Surge | "Can be cast during the global cooldown."; "Surge can be activated during the global cooldown timer." | https://runescape.wiki/w/Surge |
| Escape | "Can be cast during the global cooldown." | https://runescape.wiki/w/Escape |
| Dive | "Can be cast during the global cooldown."; "Dive can be used outside of the global cooldown. It generates no adrenaline." | https://runescape.wiki/w/Dive |
| Bladed Dive | "Can be cast during the global cooldown but will not generate adrenaline or deal damage."; "Using Bladed Dive in this manner does not trigger Impatient." | https://runescape.wiki/w/Bladed_Dive |
| Provoke | "Can be cast during the global cooldown but will not generate adrenaline." | https://runescape.wiki/w/Provoke |
| Limitless | "Can be cast during the global cooldown."; "can be used during, and does not incur, the global cooldown." | https://runescape.wiki/w/Limitless |
| Ingenuity of the Humans | "It can be used during, and does not incur, the global cooldown. Auto-attacks do not consume the effect." | https://runescape.wiki/w/Ingenuity_of_the_Humans |
| Runic Charge (new) | "Runic Charge can be activated in between, and does not incur, the global cooldown." | https://runescape.wiki/w/Runic_Charge |
| Golden Touch | "It can be used during, and does not incur the global cooldown." | https://runescape.wiki/w/Golden_Touch |
| Slayer's Insight, Kuradal's Favour, Demon/Dragon/Undead Slayer (ability) | "It can be used during, and does not incur, the global cooldown." | https://runescape.wiki/w/Demon_Slayer_(ability) |
| Quiver ammo slot 1 / 2 | listed by insource search for "Can be cast during the global cooldown" | https://runescape.wiki/w/Quiver_ammo_slot_1 |
| Aspect spells: Vampyrism, Penance, Temporal Anomaly (and other Aspects) | "Can be cast during the global cooldown."; Vampyrism: "Casting the spell does not interrupt channelled abilities and ignores global cooldown." | https://runescape.wiki/w/Vampyrism |
| Granite maul spec (Quick Smash) | "instantly strikes the opponent for 115-135% ability damage, ignoring any cooldowns."; CSM: "can be used during the global cooldown" | https://runescape.wiki/w/Quick_Smash |
| Cease | no GCD mentioned; "Generates no adrenaline", cooldown 0 | https://runescape.wiki/w/Cease |

**Not off-GCD (correct our current list):**
- **Anticipation** — normal GCD ability. "During the 2023 combat beta, Anticipation was trialled as being a non-global cooldown ability, like Surge. This meant it could be cast during the global cooldown and generated no adrenaline. This was ultimately determined to be undesirable and was reverted in a later version of the beta." — https://runescape.wiki/w/Anticipation#Trivia. Its infobox has `adrenaline = +9`, no "Can be cast during the global cooldown" line.
- **Freedom** — normal GCD basic (`adrenaline = +9`, cooldown 30 s); no off-GCD wording anywhere. The only special case: a stunned player may still use it.
- **Defensives** (Resonance, Divert, Reflect, Devotion, Debilitate, Barricade, Immortality, Natural Instinct, Preparation, Transfigure) — all normal GCD abilities (queueable, generate/consume adrenaline).
- **[INFERRED]** Off-GCD abilities: do not start the GCD, can be used while the GCD is running, multiple in one tick ("As such abilities are instant-cast, multiple can be used simultaneously, followed by other abilities." — Cooldown page). Bladed Dive/Provoke lose adrenaline (and BD damage) when used inside the GCD.
- **[VERIFIED]** Off-GCD abilities do not clear a stall: "Stalled abilities are no longer cleared by Surge, Escape, Runic Charge, and former-sigil abilities." (16 Mar 2026) and "Using any other ability after the stalled one, except for Bladed Dive, Dive, Surge or Escape" loses a stall.

---

## 9. Revolution priority (only what affects queueing/simulation)

- **[VERIFIED]** "Revolution automatically triggers the first available compatible ability on the action bar, and can access any number of slots in the bar." (1–14 slots; types basic/threshold/enhanced/ultimate toggleable; "Enhanced abilities can now be toggled on or off during revolution combat" 16 Mar 2026). "Only the main action bar can be used by Revolution". — https://runescape.wiki/w/Revolution
- **[VERIFIED]** Basic attacks are last resort: "during Revolution, basic attacks are never used unless there are no other useable abilities within the action bar's specified Revolution size, even if basic attacks are placed first" (Basic attacks). Necromancy (ability): "Regardless of the setting, Revolution will only trigger this ability when there are no other automatically triggered abilities available".
- **[VERIFIED]** Never auto-triggered: special attacks ("Special Attacks cannot be automatically activated by Revolution"), Regenerate, Cease, Create Gatestone, and every ability tagged "Must be manually triggered during revolution combat" (Surge, Escape, Dive, Bladed Dive, Runic Charge, Limitless, Ingenuity, Golden Touch, sigil abilities, Demon/Dragon/Undead Slayer). Provoke/Debilitate/bind spells: "These spells still obey the global cooldown and may now be cast via ability queuing".
- **[OPEN]** Surge/Escape on a revo bar: 12 Dec 2022 patch "Revolution now supports untargeted Agility abilities, so Escape and Surge can once again be put on a Revolution bar" vs Surge page "Surge will not activate automatically through Revolution."
- **[VERIFIED]** Queue + revo: "Queuing threshold & ultimate abilities in certain situations no longer halts revolution until the queued ability is triggered." Revo after channels: "Revolution Combat Mode will now fire off Abilities more consistently after a channelled Ability is used" (2021). Revo casts count as non-manual for the "final tick of buffs" rule (§7).
- **[INFERRED]** Simulator: on each tick where GCD == 0 and no manual/queued ability is pending, scan slots 1..N left→right, pick the first ability whose class is enabled, internal cooldown is ready, adrenaline/equipment/target requirements are met; if none, fire the basic attack (if auto-fire enabled).

---

## 10. Hit-timing reference (for damage scheduling)

- Basic melee stuns: "Backhand hits the tick after it was activated."; "Greater Barge hits 1 tick after it was activated."
- Overpower: "Overpower hits 3 ticks after it was cast."
- Assault: hits on cast+1,+3,+5,+7. Greater Flurry / Rapid Fire: cast+1…+8.
- Ranged abilities normally land 2 ticks after cast: "the Ranged ability lands one game tick after cast instead of two" (footnote about overrides, https://runescape.wiki/w/Ability_queueing).
- FSoA Lightning Surge "landing 1 game tick after the source hit"; Death Skulls bounce "1.2-second (two game ticks) delay per bounce ... full six tiles, ... three game ticks".
- Tuska's Wrath "hits immediately, unlike many other basic abilities".
- **[OPEN]** No consolidated per-ability hit-delay table exists on the wiki; the above are all the explicit statements found.

---

## 11. Sources consulted

Combat_Style_Modernisation, Cooldown (Global_cooldown redirect), Abilities (Channelled / Bleed redirects), Ability_queueing, Ability_stalling, Basic_attacks (Basic_attack redirect), Attack_rate, Auto-attack, 4-tick_auto-attack, Bleed → Abilities, Damage_over_time, Template:Bleeds:_Unaffected_boosts, Template:Bleed_abilities, Template:Burn_abilities, Stun, Bind, Stunned_(status), Bound_(status), Stun_Immune, Diminishing_returns, Crowd_control, Critical_strike (Critical_hit redirect), Buffs_and_debuffs, Revolution, Adrenaline, Game_tick, Channel_Bar, Cease, Bloodlust, Runic_Charge, Anima_Charged, Flow, Greater_Flow, Channelled_Might, Galeshot, Searing_Winds, Imbue:_Shadows, Shadow_Imbued, Attack_(ability), Ranged_(ability), Magic_(ability), Necromancy_(ability), Freedom (+status), Anticipation (+status), Transfigure (+stun immunity), Preparation, Resonance, Divert, Reflect, Devotion, Debilitate, Barricade, Immortality, Natural_Instinct, Limitless, Ingenuity_of_the_Humans, Provoke, Surge, Escape, Dive, Bladed_Dive, Golden_Touch, Slayer's_Insight, Kuradal's_Favour, Demon_Slayer_(ability), Vampyrism, Penance, Temporal_Anomaly, Quick_Smash, Weapon_Special_Attack, Ring_of_vigour, Berserk (+status), Overpower, Living_Death (+status), Death_Skulls, Touch_of_Death, Finger_of_Death, Soul_Sap, Sunshine (+status), Greater_Sunshine, Death's_Swiftness, Greater_Death's_Swiftness, Planted_Feet, Igneous_Kal-Zuk/-Ket/-Mej/-Xil, Assault, Flurry, Greater_Flurry, Hurricane, Rapid_Fire, Asphyxiate, Snipe, Concentrated_Blast, Smoke_Tendrils, Onslaught, Greater_Barge (+status), Endless_Assault, Dismember (+status), Slaughter, Massacre, Combust (+status), Corruption_Blast, Corruption_Shot, Masterwork_Spear_of_Annihilation, Punish, Piercing_Shot, Backhand, Impact, Binding_Shot, Scare_Tactics, Meteor_Strike, Tsunami, Storm_Shards, Shatter, Regenerate, Update:Patch_Notes:_Part_1/2_-_Combat_Style_Modernisation, Combat_beta_(2023). Base URL: https://runescape.wiki/w/<Title>

---

## 12. Consumables used in PvME rotations (added 2026-09-04)

Engine: `rules-consumables.ts` (pressed items: `special:<id>` from `specials.json`, `action:<id>`), `damage.ts` + `loadout-resolver.ts` (always-on choices on the Loadout page: overload, weapon poison, Kwuarm incense). PvME aliases in `pvme-aliases.json` (`powerburstofvitality`, `powerburstofacceleration`, `dommine`, `stickybomb`, `dummy`; `elderovl`, `weppoison`, `kwuarmsticks` become notes pointing at the Loadout page). Potions must be in the backpack to be pressable.

| Item | Wiki (verbatim where quoted) | Model |
|---|---|---|
| Powerburst of vitality | "doubles current and maximum life points for 6 seconds"; after it "current and maximum life points are halved"; max 32,000; "Drinking this triggers the global powerburst cooldown, which prevents drinking another powerburst potion for two minutes". Herblore 105. | Buff `powerburst-of-vitality` 10 ticks with `maxLifePointsMult: 2` (engine getter `maxLifePointsMult`); no GCD; shared cooldown group `powerburst`, 200 ticks. **[OPEN]** the trainer has no player life point pool (incoming attacks only count prayer hits), so the doubling has no numeric effect yet. https://runescape.wiki/w/Powerburst_of_vitality |
| Powerburst of acceleration | Surge, Dive and Bladed Dive "have their cooldowns reset" and "reduces the cooldown of both to 1.2 seconds (2 game ticks) for 6 seconds (10 game ticks)"; "Bladed dive will not deal any damage for the duration"; Escape is not reset (Escape no longer shares a cooldown with Surge outside PvP). Herblore 111. | On cast: `cooldown-reset` of surge / dive / bladed-dive (also clears the shared `dive` group), buff `powerburst-of-acceleration` 10 ticks; Surge / Dive / Bladed Dive carry `cooldownRules: 2 ticks while the buff`; Bladed Dive `damageRules mult 0` while the buff (adrenaline still granted). Shared `powerburst` cooldown 200 ticks. Mobile perk on top: ⌊2 × 0.5⌋ = 1 tick (the cooldown multiplier is applied after the rule) – negligible. https://runescape.wiki/w/Powerburst_of_acceleration |
| Elder overload (salve) / Supreme / Overload | "17% + 5" (elder, salve identical), "16% + 4" (supreme), "15% + 3" (overload) to Attack, Strength, Defence, Ranged, Magic, Necromancy; "Each dose lasts for 6 minutes, for a total of 36 minutes per flask", reapplied every 15 s. Ability damage: "f(level) = 145×ln(1+0.6×level/145)/ln(1.6)" with the level "including boosts". | Loadout choice `overload` (none / overload / supreme / elder, default elder): boosted level = 99 + ⌊99 × pct⌋ + flat = 116 / 118 / 120, fed into `abilityDamageOf` (`combatLevel` on the resolved loadout). Elder: 2h skill part 264 + 132 → 310 + 155 (+69 ability damage). Not pressed in rotations; the aliases map to a note. **[OPEN]** other level-dependent bits (bone shield tier, Essence Corruption flat add) still use 99. https://runescape.wiki/w/Elder_overload_potion, https://runescape.wiki/w/Ability_damage |
| Weapon poison (+, ++, +++) | "12.5% chance per hit to poison"; tier damage "20%, 25%, 30%, 35%, 40%" of ability damage (tier 1–5), "multiplied by a randomly chosen factor between 65% and 130%"; a hit every 9.6 s (17 ticks); +++ lasts 12 min, duration reset on re-application; Cinderbane gloves "1/8 chance to apply tier 2 poison on hit" and "if used with another source of poison, they increase the tier of poison by 1"; re-applying "will deal an additional poison hit and refresh the poison effect". | Loadout choice `weaponPoison` 0–4 (default 4 = +++): `poison = { chance 1/8, pct 20 + 5 × (tier − 1) }`; with cinderbane gloves tier + 1 (+++ → 40%) and chance 1 − (7/8)² ≈ 23.4% (both sources roll). Same engine path as the gloves (`rollHitProcs` / `poisonHit`, 17-tick ticks, extra hit on re-application). Not modelled: the 12-minute poison expiry, the damage-range decay when it is not re-applied. https://runescape.wiki/w/Weapon_poison%2B%2B%2B, https://runescape.wiki/w/Poison, https://runescape.wiki/w/Cinderbane_gloves |
| Kwuarm incense sticks | "Each potency level of Kwuarm incense sticks provides +2.5% weapon poison damage, up to a maximum +10% damage"; potency rises every 10 minutes to 4 (overloading 6 sticks gives 4 at once). | Loadout choice `kwuarmPotency` 0–4 (default 0): poison pct × (1 + 0.025 × potency). https://runescape.wiki/w/Kwuarm_incense_sticks |
| Combat dummy MKII | Stands for "a period of 60 seconds"; used "to generate or stall adrenaline prior to, or during a boss encounter"; no experience, no Reaper stacks. | Client action `action:combat-dummy` (keybind under Client actions) with a rule: buff `combat-dummy` 100 ticks, `adrenalinePerTick: 10` – the same rate as the "recharge adrenaline" option. **[INFERRED]** the game gives adrenaline per ability used on the dummy, not per tick; the per-tick model is the trainer's existing approximation. https://runescape.wiki/w/Combat_dummy_MKII |
| Dominion mine | "20% of the monster's maximum life points, up to 10,000 melee damage"; "Only triggered by NPCs of level 138 combat or less"; "it takes about 5 seconds for a mine to go off"; "Only two dominion mines can be placed per minute"; Vulnerability +10%. | `special:dominion-mine` (kind `device`): rule `charges: 2, cooldownTicks: 100`, `targetLpHit { share 0.2, cap 10000, delayTicks 8 }` – one hit of min(cap, ⌊0.2 × target LP⌋) 8 ticks after deployment, the cap when the target has no life point number; `TARGET_DAMAGE_MULT` (Vulnerability) applies. **[OPEN]** the trainer knows no target combat level, so the mine always detonates (against real bosses it would not). https://runescape.wiki/w/Dominion_mine |
| Sticky bomb | "creates a 3x3 area for 6 seconds which binds monsters standing in it"; no damage; Herblore 101. | `special:sticky-bomb` (kind `bomb`, no cooldown, off the GCD): target debuff `bound` 10 ticks (the existing Bound status). No engine effect beyond the debuff (the target model has no movement). https://runescape.wiki/w/Sticky_bomb |
