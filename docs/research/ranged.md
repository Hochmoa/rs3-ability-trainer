# RS3 Ranged abilities – simulator spec (post "Combat Style Modernisation", 2 March 2026)

Research date: 2026-09-03. Sources: RuneScape Wiki raw wikitext (`?action=raw`) of every ability page, buff/status pages, the update overview page and the official patch-note transcripts. Every rule is quoted verbatim with its source URL. Tick = 0.6 s. "GCD" = global cooldown = 3 ticks (1.8 s).

State reflected: live game after 2 March 2026 **plus** the follow-up patches of 9 March 2026 (Caroming 4 %/rank, ammo break 15 %, Bombardment cooldown removed), 16 March 2026 (Death's Swiftness became a self buff, Surge/Escape cooldowns unlinked, enhanced abilities toggleable in Revolution) and 30 March 2026 (tooltip wording only).

Sources used (all runescape.wiki):
- Overview: https://runescape.wiki/w/Combat_Style_Modernisation (section "Ranged details")
- Official notes: https://runescape.wiki/w/Update:Patch_Notes:_Part_1_-_Combat_Style_Modernisation , https://runescape.wiki/w/Update:Patch_Notes:_Part_2_-_Combat_Style_Modernisation , https://runescape.wiki/w/Update:Combat_Style_Refinements_%26_March_Marketplace_Drop , https://runescape.wiki/w/Update:DailyScape_Overhaul_%26_Free_Runemetrics_for_Members
- Mechanics: https://runescape.wiki/w/Abilities , https://runescape.wiki/w/Cooldown , https://runescape.wiki/w/Ability_queueing , https://runescape.wiki/w/Adrenaline , https://runescape.wiki/w/Bind , https://runescape.wiki/w/Stun , https://runescape.wiki/w/Bound_(status) , https://runescape.wiki/w/Stunned_(status) , https://runescape.wiki/w/Freedom
- Buffs: https://runescape.wiki/w/Searing_Winds , https://runescape.wiki/w/Shadow_Imbued , https://runescape.wiki/w/Corruption_Shot_(status) , https://runescape.wiki/w/Death%27s_Swiftness_(status) , https://runescape.wiki/w/Greater_Death%27s_Swiftness_(status)

---

## 0. Global rules that apply to every ranged ability

- **Weapon requirement.** "All basic, enhanced, and ultimate abilities requires a ranged weapon in main hand." (https://runescape.wiki/w/Ranged_abilities). Escape is the exception (equipment "None", see §1). No ranged ability requires 2h / dual-wield / shield specifically – every infobox below says `equipment = Any`.
- **GCD.** "After using an ability, the player cannot use another ability for 3 ticks (1.8 seconds). This is the global cooldown. This triggers from the moment of use, so after a channelled ability, the player can immediately use another ability." (https://runescape.wiki/w/Abilities#Cooldown). "The global cooldown is 1.8 seconds long." (https://runescape.wiki/w/Cooldown). Only Escape is flagged "Can be cast during the global cooldown"; every other ability in this document triggers and obeys the GCD.
- **Ability types (post-update).** "Basic abilities generate 9% adrenaline. Enhanced abilities require and drain zero to moderate amount of adrenaline, depending on the ability. Threshold abilities require 50% adrenaline and will drain 15% on use. Ultimate abilities require and drain 60% or 100% adrenaline." (https://runescape.wiki/w/Abilities#Adrenaline). Thresholds no longer exist for Ranged: "They no longer require 50 percent Adrenaline to activate. They have been renamed Enhanced abilities. Each Enhanced ability now has an updated Adrenaline cost" (Part 1 notes). "All Basic abilities now generate 9 percent Adrenaline, increased from 8 percent on live." (Part 1 notes).
- **Revolution.** "Enhanced abilities can now be toggled on or off during revolution combat" (16 March 2026, https://runescape.wiki/w/Enhanced_abilities).
- **Fixed impact timings.** "Ranged abilities now use fixed impact timings. Previously, weapon overrides and attack speed differences could subtly alter when damage landed ... Damage now lands at consistent, defined timings regardless of weapon overrides" (Part 1 notes). "Weapon attack speeds are now hidden. With all Basic Attacks operating on a fixed 1.8 second global cooldown, individual weapon speeds are no longer functionally relevant" (Part 1 notes). Note: the wiki still documents the ranged hit landing "one game tick after cast instead of two" depending on overrides/distance (https://runescape.wiki/w/Nightmare_gauntlets note "overrides") – this pre-dates the update; the exact tick of impact per ability is NOT documented post-update.
- **AoE.** "Ranged AoE attacks now calculate their impact based on an NPC's size and centre coordinate, rather than their southwest tile." (Part 1 notes).
- **Ammunition.** "All Ranged abilities now require ammunition to cast." "Ammunition is consumed per shot fired, not per hit. For example, Ricochet fires a single shot that can hit up to seven targets. Under the new rules, this only provides a single chance to consume ammunition, rather than one per hit." (Part 1 notes). "There is a 15% chance that any ammunition is destroyed instead of dropping to the ground" (after 9 March; was 20 %), "Animal Magnetism does not reduce this", "This can be reduced by the ranged master cape, blightbound crossbows, and some other effects" (https://runescape.wiki/w/Combat_Style_Modernisation). Blightbound crossbow: "25% chance to prevent ranged ammunition from being consumed"; Ranged master cape: "10% chance to save your ranged ammunition" (same page). Chinchompas after 9 March: "Chinchompas will now only be destroyed 15% of the time instead of 100%" (Refinements notes).
- **Stun / bind semantics (for Binding Shot & Rapid Fire).** Stunned: "Prevents: Attacking, Moving, Using any abilities except Freedom, Changing prayers, ... Cannot be applied if the target is affected by Freedom, Anticipation, Transfigure stun immunity or Stun Immune ... Can be removed by activating Freedom" (https://runescape.wiki/w/Stunned_(status)). Bound: "prevents a player, monster, or other entity from moving ... targets under the bind effect can still use abilities, spells, and items ... Cannot be applied if the target is affected by Freedom, Transfigure stun immunity or Stun Immune ... Can be removed by activating Freedom ... Can be removed by activating Barge or Greater Barge" (https://runescape.wiki/w/Bound_(status), https://runescape.wiki/w/Bind). "NPCs that have been stunned by another NPC will become immune to non-player stuns for 10 seconds" (https://runescape.wiki/w/Stun) – player stuns are not subject to this.
- **Ability queueing / channels.** "Channelled abilities are abilities that take a certain amount of time or a number of hits to execute ... These abilities are able to be cancelled by performing another ability (or by walking or similar actions). ... Rapid Fire always allows movement, and Nightmare gauntlets allow movement while using Snipe." (https://runescape.wiki/w/Abilities#Channelled). "A queued offensive ability ... will always force the player to stop moving for casting the ability." Escape is listed among abilities that "do not cause movement stalling" and "Cannot be queued" (https://runescape.wiki/w/Ability_queueing).
- **Damage over time (Corruption Shot only).** "DoT abilities are multi-hitting abilities that hit every 2 game ticks" and "unlike channelled abilities, they cannot be cancelled by the player" (https://runescape.wiki/w/Abilities#Damage_over_Time_abilities). DoT is "not affected by: Damage boosting prayers and Ancient Curses ... Damage boosting abilities: Berserk, Death's Swiftness, and Sunshine ... Most perks affecting variable damage, including Genocidal, Precise, and Ruthless ... Critical strikes ... All enchanted bolts" and IS affected by "Damage bonus from equipment, Visible combat skill boosts, Vulnerability or its lesser form, Curse, The Eruptive perk, ... slayer (effect) group ..., The hexhunter bow ..., Scrimshaws ..., Icy Precision effect granted by Wen arrows" (https://runescape.wiki/w/Template:Bleeds:_Unaffected_boosts).

---

## 1. Escape

Source: https://runescape.wiki/w/Escape (raw: https://runescape.wiki/w/Escape?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Utility`, `skill1 = Agility, skill1lvl = 5`, `adrenaline = 0`, `cooldown = 20.4` (34 ticks), `equipment = None`, `damage = None`, `target = Self`. Instant, not channelled. Tooltip: "Can be cast during the global cooldown." and "Must be manually triggered during revolution combat." Update 4 March 2024: "Can always be cast during global cooldown", "No longer generate adrenaline", "Are now classed as 'Abilities' rather than 'Basic Abilities'". Escape does **not** start a GCD (Cooldown page: abilities that can be cast during the GCD "do not trigger the global cooldown when used").
- **Effect:** "Leap backwards to maintain range. Move backwards [number] tiles." "When wielding a Ranged weapon, the distance travelled becomes the attack range of the weapon minus 1, ranging from a minimum of 3 (with weapons that have an attack range of 4) to a maximum of 8 (with weapons that have an attack range of 9). If the player is not wielding a ranged weapon, the distance travelled is always 7 tiles."
- **RESOURCES:** none (no adrenaline, no ammo – it is not a ranged attack).
- **MODIFIES OTHER ABILITIES:** none. Explicitly (16 March 2026 notes): "Surge, Escape, Runic Charge and Sigils no longer clear stalled abilities." (https://runescape.wiki/w/Update:DailyScape_Overhaul_%26_Free_Runemetrics_for_Members)
- **IS MODIFIED BY:** "The Mobile perk will halve the cooldown of Escape." Double Escape codex (see below). Not touched by the modernisation: listed under "Things not changed: Escape (and double escape)" (https://runescape.wiki/w/Combat_Style_Modernisation).
- **REQUIREMENTS:** 5 Agility. No weapon needed. Cannot be used while stunned (Stunned status blocks all abilities except Freedom). Area limitations: "cannot be used in the following areas: Most quest instances, Player-owned houses, Private hunting areas, Cabbage Facepunch Bonanza, Rune Essence mine, Instanced versions of the Borehole ..." (https://runescape.wiki/w/Template:Surge_limitations).
- **SHARED COOLDOWNS:** As of 16 March 2026: "No longer shares a cooldown with Surge" (Escape page); "Surge and Escape no longer share cooldowns, except in PvP scenarios. ... There does still however remain a very short anti-spam cooldown to prevent both abilities firing on the same cycle." (DailyScape notes). Length of the anti-spam cooldown is not documented. In PvP the Surge/Escape shared cooldown still applies. Historic: "The Surge and Escape abilities no longer share a cool down with stun abilities" (3 March 2014).
- **GREATER version:** none. **Double Escape** (codex): "Escape will gain the ability to be used twice before going on cooldown. The first charge of escape has an invisible cooldown which is the same as the ability's normal cooldown, while the second charge will put the ability on cooldown for 20 seconds (10 with the Mobile perk). If Escape is only used once within the cooldown time of the first charge, it will reset, allowing the player to escape twice without putting the ability on cooldown." Tooltip: "Maximum charges: 2." "The antispam delay for double Escape can be modified at the lectern used to create the codex." "You can no longer use Double Surge/Escape in F2P."
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a.
- **OTHER:** "The Surge, Escape and Bladed Dive abilities will no longer cause you to enter combat stance. Using these abilities while in combat stance will still maintain it." Adrenaline page: Escape can be used to stall adrenaline drain out of combat ("which do not require a target to activate combat") – note the Adrenaline page still says "Escape or Surge (share a cooldown)", which is outdated since 16 March 2026. Some boss mechanics reset movement-ability cooldowns (https://runescape.wiki/w/Template:Movement_abilities_reset) – out of scope for a single-target simulator. Cannot be queued; does not cause movement stalling (Ability queueing page).

---

## 2. Ranged (basic attack)

Source: https://runescape.wiki/w/Ranged_(ability) (raw: https://runescape.wiki/w/Ranged_(ability)?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `basic_attack = Yes`, `level = 1` (the overview table lists it at Ranged 0), `adrenaline = +9`, `cooldown = 1.8` (GCD only: "No cooldown (other than global cooldown)" – overview page), `target = Single`, `equipment = Any`, `members = No`. Not channelled, obeys GCD. "Attack the target. 90%-110% Ranged damage. Generates 9% Adrenaline. (If auto attack is enabled): Automatically triggered during combat."
- **Damage:** 1 hit, 90–110 % (avg 100 %). With Dark bow / Gloomfire bow ("Darkfang"): "45%-55% Ranged damage. 2 hits." ("causes the ability to hit twice, with each hit dealing half of the usual damage").
- **RESOURCES:** generates 9 % adrenaline; consumes ammo per shot (see §0). "Since it is a Basic attack, this ability can give increased adrenaline when the Invigorating perk is active."
- **MODIFIES OTHER ABILITIES:** only with fleeting boots: "When fleeting boots or enhanced fleeting boots are worn, this basic attack gains the effect of reducing the remaining cooldown of Snipe by 3.6 seconds per hit." (6 ticks per hit). "Combined with fleeting boots, this [Darkfang] causes it to reduce the cooldown of Snipe by 7.2 seconds per cast." Without fleeting boots: no effect on Snipe.
- **IS MODIFIED BY:** Searing Winds (+20 % AD per hit), Shadow Imbued (+5 % adrenaline per hit), Death's Swiftness (×1.5), Darkfang (2 hits), fleeting boots (Snipe CD), Invigorating.
- **REQUIREMENTS:** ranged main-hand weapon + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a.
- **OTHER:** "Automatically used when no other abilities are selected (full manual can toggle off automatic use)" (overview page). It replaced auto-attacks entirely: "Basic Attacks have been added to Magic, Ranged, and Melee, fully replacing auto-attacks. These new Basic Attacks: Operate on the standard global cooldown system" (Part 1 notes).

---

## 3. Piercing Shot

Source: https://runescape.wiki/w/Piercing_Shot (raw: https://runescape.wiki/w/Piercing_Shot?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `level = 13`, `adrenaline = +9`, `cooldown = 3` (5 ticks; overview: "{{ticks|5}} cooldown"), `target = Single`, `equipment = Any`, `members = No`. Not channelled, obeys GCD.
- **Tooltip:** "Fire two piercing shots. 45%-55% Ranged damage per hit. 2 hits. Reduces the cooldown of Snipe by 4 ticks with each hit. Generates 9% Adrenaline."
- **RESOURCES:** +9 % adrenaline; 1 shot of ammo. "Since Piercing Shot hits twice, it will apply 2 stacks of stack-based arrows such as Wen or Bik arrows, and each hit will gain increased damage from Searing Winds or generate adrenaline from Shadow Imbued."
- **MODIFIES OTHER ABILITIES:** **Snipe cooldown.** "reducing the remaining cooldown of Snipe by 2.4 seconds per hit of Piercing Shot" (4 ticks/hit, 8 ticks per cast). "When fleeting boots or enhanced fleeting boots are worn, each hit of Piercing Shot reduces the cooldown of Snipe by 3.6 seconds instead." (6 ticks/hit, 12 ticks per cast). "When Decimation's Locate is active, each hit of Piercing Shot will reduce the cooldown of Snipe by 2.4 second per target hit." Snipe page wording: "reduces the cooldown by 2.4 seconds per shot that hits (4.8 seconds total)". The overview says "Each hit reduces the cooldown of Snipe by 4 ticks". Whether a hit that is dodged / deals 0 counts is not documented.
- **IS MODIFIED BY:** Searing Winds, Shadow Imbued, Death's Swiftness, fleeting boots, Locate. "Always hits twice" (2 March 2026). Removed: "No longer increases damage against bound or stunned targets" (2 March 2026) – there is no bound/stunned bonus any more.
- **REQUIREMENTS:** ranged main hand + ammo. No target-state requirement.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a (both hits are part of one instant cast; tick spacing of the 2 hits not documented).
- **OTHER:** "although Piercing Shot has the same average damage as the ranged basic attack, it is better in many situations to use Piercing Shot instead of the basic attack."

---

## 4. Binding Shot

Source: https://runescape.wiki/w/Binding_Shot (raw: https://runescape.wiki/w/Binding_Shot?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `level = 31`, `adrenaline = +9`, `cooldown = 15` (25 ticks), `damage = 70%`, `target = Single`, `equipment = Any`, `members = No`. Not channelled, obeys GCD.
- **Tooltip:** "Fire a binding shot. 65%-75% Ranged damage. Stuns the target for 2 ticks. Binds the target for 16 ticks. (With Scare Tactics enabled) Knocks back the target by 1 tile. Generates 9% Adrenaline. (With at least level 54 Ranged) Maximum charges: 2. (After reading Scare Tactics) Customisation options available. (With Flanking perk) Invention perk: Flanking (rank [number])."
- **RESOURCES:** +9 % adrenaline, 1 shot of ammo. Charges: "At level 54 Ranged a second charge of this ability is unlocked that can be used while the first charge is on cooldown. This allows the player to stun twice in quick succession". Patch notes Part 1: "Now gains a second charge at Level 54." **Discrepancy:** the overview table says "Second charge unlocked at 70 Ranged" – the ability page, the Bind page ("Gains a second charge at Ranged 54") and the official patch notes all say 54; treat 54 as correct. Charge-recovery model is not spelled out for Binding Shot; by analogy with Backhand (same "second charge" pattern) each charge presumably has its own 25-tick cooldown – NOT documented.
- **MODIFIES OTHER ABILITIES:** none (the old Piercing Shot bound/stunned bonus was removed).
- **IS MODIFIED BY:** Searing Winds, Shadow Imbued, Death's Swiftness. Flanking: "With the Flanking perk Binding Shot loses its stun property, but gains up to 160% increased damage against targets that face away from the player." Scare Tactics: "unlocks a customisation option that allows Binding Shot to knock back small (1x1) targets (with some exceptions) by 1 tile. This option is toggled by right clicking the Binding Shot ability in the ranged ability book interface."
- **REQUIREMENTS:** ranged main hand + ammo. Stun/bind cannot be applied to Stun Immune targets; damage still applies ("An issue with the binding shot not damaging stun immune enemies has been fixed", 2013).
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS applied:** **Stunned** 2 ticks (1.2 s) and **Bound** 16 ticks (9.6 s) on the target (Bind page: "Binds for 9.6 seconds"). Both removed by Freedom; both blocked by Freedom immunity / Anticipation (stun only) / Stun Immune. Neither stacks (`stacks = No` on the status pages); re-application refresh behaviour not documented.
- **CHANNEL rules:** n/a.
- **OTHER:** "Since this ability deals less damage than the ranged basic attack, it should only be used when the stun or bind effects outweigh the damage loss."

---

## 5. Galeshot

Source: https://runescape.wiki/w/Galeshot (raw: https://runescape.wiki/w/Galeshot?action=raw); buff: https://runescape.wiki/w/Searing_Winds

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `level = 58`, `adrenaline = +9`, `cooldown = 20.4` (34 ticks), `damage = 100%`, `target = Single`, `equipment = Any`, `members = No`, `buff = Searing Winds`. Not channelled; standard 1.8 s GCD (beta note: "GCD: 1.2s → 1.8s").
- **Tooltip:** "Fire an infused shot at the target, empowering yourself with searing winds. 90%-110% Ranged damage. Applies Searing Winds to self. 10 ticks duration. Generates 9% Adrenaline. Searing Winds: Ranged attacks deal an additional 20% bonus damage with each hit."
- **RESOURCES:** +9 % adrenaline, 1 shot of ammo. Generates the **Searing Winds** self-buff (see below).
- **MODIFIES OTHER ABILITIES:** via Searing Winds, every ranged hit for 10 ticks gets "+20% ability damage" flat: "This adds a flat bonus damage on-hit to all Ranged attacks equal to 20% of the player's ability damage." "which can apply to up to 4 abilities depending on cast timings". Notable multipliers per hit count: Igneous Deadshot 8, Rapid Fire 8, Greater Ricochet 7, Deadshot 4, Ricochet 3, Snap Shot 2, Piercing Shot 2.
- **IS MODIFIED BY:** Searing Winds itself? Not stated whether Galeshot's own hit benefits (buff applied on cast; "The extra damage is calculated on cast"). Death's Swiftness ×1.5, Shadow Imbued. Duration extended by Rapid Fire: "Each hit of Rapid Fire extends the duration of Searing Winds by 0.6 seconds, essentially pausing the duration while channelling Rapid Fire." "A maximum increase of 4.8 seconds per cast of Rapid Fire."
- **REQUIREMENTS:** ranged main hand + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS applied:** **Searing Winds** (self). `timer = Yes`, `stacks = No`. "trigger = Activating Galeshot; duration = 6 seconds; Each iteration of Rapid Fire increases the duration by 0.6 second; effects = Causes each hit of Ranged abilities to be increased by 20% of ability damage". "The extra damage is calculated on cast, meaning that if an ability is cast on the same tick the buff runs out, it will still benefit from the effect." Galeshot page: "An ability that is cast on the same tick that Searing Winds runs out will still fully benefit from the increased damage." "Buff now clears on death" (beta 3). Not a debuff → Freedom irrelevant. Refresh/stacking on re-cast cannot occur: cooldown (34 t) > max duration (10 t + 8 t from Rapid Fire = 18 t).
- **CHANNEL rules:** n/a.
- **OTHER:** Patch notes: "Think of it as the spiritual successor to Needle Strike, but instead of increasing the damage of your next attack by 7%, it instead increases the damage of ALL of your hits for a duration by a flat amount." Whether the flat 20 % is multiplied by Death's Swiftness or crits is not documented.

---

## 6. Ricochet

Source: https://runescape.wiki/w/Ricochet (raw: https://runescape.wiki/w/Ricochet?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `level = 67`, `adrenaline = +9`, `cooldown = 10.2` (17 ticks), `damage = 115%`, `target = Multi`, `equipment = Any`, `members = No`. Not channelled, obeys GCD.
- **Tooltip:** "Fire a shot which ricochets off the target. 75-85% Ranged damage to the target and up to 2 additional enemies within 5 tiles of the target. The target will be hit for an additional 15%-20% Ranged damage for each enemy that cannot be found. Generates 9% Adrenaline. (With Caroming perk) Invention perk: Caroming (rank [number])."
- **Hits:** primary 75–85 %; up to 2 secondary targets 75–85 % each ("will also strike 2 nearby targets within a 5 square radius of the primary target. It can hit secondary targets beyond your normal attack range, but cannot hit secondary targets you cannot see (straight line-of-sight required)"); for each missing secondary the primary takes 15–20 %. Single target → 3 hits on the primary (80 + 17.5 + 17.5 = 115 % avg). "Any secondary shots that land on the primary target appear as separate hitsplats and appear 1 game tick later than the initial shot. The separate hitsplats ensure that these hits are not subjected to the damage cap".
- **RESOURCES:** +9 % adrenaline, one ammo per cast ("Ricochet fires a single shot that can hit up to seven targets ... only provides a single chance to consume ammunition").
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** "Ricochet is a multi-hit ability, so it has synergy with Searing Winds for increased damage and Imbue: Shadows for generating adrenaline, as well as special ammo that has on-hit effects". Caroming: "increases each hit of Ricochet by a flat +4% ability damage per rank" (9 March 2026: "2.5% per rank → 4% per rank"; "Caroming perk no longer adds more targets"). Death's Swiftness ×1.5.
- **REQUIREMENTS:** ranged main hand + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** see §7. "Reading a Greater Ricochet ability codex replaces Ricochet with Greater Ricochet." – they cannot coexist on a bar; "On free-to-play worlds, the ability will temporarily revert back to Ricochet."
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a; timing: extra hits on the primary land 1 tick after the initial hit.
- **OTHER:** PvP: "Greater Ricochet applies in PvP whilst in Multicombat areas. Otherwise, the ability will hit only once." (stated on the Greater page; same logic for Ricochet).

---

## 7. Greater Ricochet

Source: https://runescape.wiki/w/Greater_Ricochet (raw: https://runescape.wiki/w/Greater_Ricochet?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Basic`, `level = 67`, `adrenaline = +9`, `cooldown = 10.2` (17 ticks), `damage = 135%`, `target = Multi`, `equipment = Any`, `members = Yes`. Not channelled, obeys GCD.
- **Tooltip:** "Fire a shot which ricochets off the target. 75-85% Ranged damage to the target and up to 6 enemies within 5 tiles of the target. The target will be hit for an additional 15-20% Ranged damage (4-6% Ranged damage after 2 hits) for each enemy that cannot be found. Generates 9% Adrenaline."
- **Hits:** primary 75–85 %; up to 6 secondaries; missing secondaries return to the primary: first 2 at 15–20 % each, remaining 4 at 4–6 % each. Single target → 7 hits on the primary: 80 + 17.5 + 17.5 + 5 + 5 + 5 + 5 = 135 % avg. Extra hits are separate hitsplats 1 tick after the first.
- **RESOURCES:** +9 % adrenaline; one ammo per cast. "Imbue: Shadows causes Ranged attacks to generate 5% adrenaline for each hit; therefore, Greater Ricochet will generate 35% adrenaline regardless of how many additional targets the shots hit."
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** "Searing Winds adds a flat 20% ability damage to each hit, so up to 140% ability damage if all 7 arrows hit the primary target." "Caroming adds a flat 4% ability damage per rank to each hit, so up to 112% ability damage at rank 4 if all 7 arrows hit the primary target." "Both Searing Winds and Caroming add flat damage to the secondary arrows, so even though arrows 4 to 7 only have a base of 5% ability damage if they return to the primary target, with Caroming 4 and searing winds these arrows are increased to 41% ability damage each." Death's Swiftness ×1.5. "Enchanted bolts have a chance to activate on every hitsplat of Greater Ricochet". "Up to seven stacks of black stone arrows can be applied to the primary target."
- **REQUIREMENTS:** ranged main hand + ammo; Greater Ricochet ability codex read; members.
- **SHARED COOLDOWNS:** none.
- **GREATER vs base:** identical cost, cooldown, level and primary/secondary damage; Greater has 6 secondary targets instead of 2, and returning arrows 3–6 deal 4–6 % instead of 15–20 %. Overview: "Greater Ricochet has the previous rank 4 number of targets". "It is unlocked by reading a Greater Ricochet ability codex, replacing the former ability." → only one of the two exists for a player.
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a.
- **OTHER:** "Greater Ricochet is particularly useful against monsters with damage caps."

---

## 8. Snap Shot

Source: https://runescape.wiki/w/Snap_Shot (raw: https://runescape.wiki/w/Snap_Shot?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 2`, `adrenaline = -25`, `cooldown = 1.8`, `damage = 290%`, `target = Single`, `equipment = Any`, `members = No`. Not channelled, obeys GCD. "It deals high damage with no cooldown besides the 1.8 second global cooldown, so its function is to be a quick and simple adrenaline spending ability." Update history 2 March 2026: "Cooldown removed." Patch notes: "Has no cooldown." **Discrepancy:** the overview table lists "{{ticks|9}} cooldown ... Cooldown reduced from 34 ticks" – the ability page and the official notes say no cooldown; treat as GCD-only.
- **Tooltip:** "Fire two shots in quick succession. 135%-155% Ranged damage per hit. 2 hits. Damage is 60% effective in PvP."
- **RESOURCES:** costs 25 % adrenaline (requires ≥25 %); one ammo per cast. 2 hits → 2 Shadow Imbued procs (+10 %), 2 Searing Winds bonuses, 2 ammo-stack applications.
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** "Searing Winds adds flat damage per hit; Shadow Imbued generates adrenaline per hit; Elder God arrows add stacking buffs or debuffs per hit; Enchanted bakriminel bolts can trigger effects per hit." Death's Swiftness ×1.5.
- **REQUIREMENTS:** ≥25 % adrenaline, ranged main hand + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a. Hit timing: "Once again both hits are dealt the same time." (12 Oct 2015) and "The damage of the second hit is no longer linked to the first" (4 Mar 2024) – two independent rolls landing on the same tick.
- **OTHER:** Patch notes: "Snap Shot is Ranged's core spender, dealing good damage and hitting twice."

---

## 9. Snipe

Source: https://runescape.wiki/w/Snipe (raw: https://runescape.wiki/w/Snipe?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 7`, `adrenaline = 0`, `cooldown = 60` (100 ticks), `damage = 330%`, `target = Single`, `equipment = Any`, `members = No`. **Channelled** for 3 ticks; "Duration reduced from {{ticks|4}} - now fits inside a global cooldown" (overview). Obeys/triggers GCD.
- **Tooltip:** "Fire a precise shot. 300-360% Ranged damage after 3 ticks. Channelled. Damage is 75% effective in PvP."
- **RESOURCES:** "an enhanced ability that does not consume or generate adrenaline" (overview); one ammo per cast. Does generate Shadow Imbued adrenaline on hit (it is a ranged ability hit; the enchantment-of-dread secondary hit is explicitly listed as a trigger).
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:**
  - Piercing Shot: "This cooldown can be affected by using Piercing Shot, which reduces the cooldown by 2.4 seconds per shot that hits (4.8 seconds total). While wearing fleeting boots or enhanced fleeting boots this is increased to 3.6 seconds per shot (7.2 seconds total), and the ranged basic attack will also reduce the cooldown by 3.6 seconds."
  - Nightmare gauntlets: "increases the player's hit chance by 25% when using Snipe, and allows the player to move around without interrupting the ability." Enchantment of dread: "Snipe fires an additional shot against targets not facing the player. This follows the same rules as the Flanking perk. The additional shot deals half damage; 150-180% ability damage with an average of 165%."
  - Searing Winds, Shadow Imbued, Death's Swiftness ×1.5.
- **REQUIREMENTS:** ranged main hand + ammo; target in range at the end of the channel.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none. "No longer disables the target's protection prayers." (2 March 2026).
- **CHANNEL rules:** "When used, the player will channel the ability for 1.8 seconds; once the channel is finished, the player will deal 300-360% ability damage (an average of 330%) provided that the target is still in range. Using another ability, moving, or the target moving out of range before the channel is complete will prevent the ability's damage." (moving does not cancel with Nightmare gauntlets). Number of hits: 1 (2 with enchantment of dread vs. a target facing away). Cooldown starts at cast, not at impact: "1 | Player starts animation for Snipe. Snipe goes on internal cooldown. | Global cooldown begins." and "4 | Player casts Snipe. | Global cooldown ends." "5 | Snipe hits target. Player casts Piercing Shot." (https://runescape.wiki/w/Nightmare_gauntlets#Three-tick_Snipe, pre-update 4-tick table; post-update the channel is 3 ticks, so the shot is released on the tick the GCD ends). Whether a cancelled Snipe keeps its 100-tick cooldown is not documented (the cooldown is applied on tick 1, which implies yes). "Snipe will no longer perform auto-attacks while channelling if the player clicks on their opponent again." "Queuing an ability will no longer be used a cycle earlier when used after the Snipe ability." (28 Jan 2019) and "The time you can perform an Ability after using Snipe is now correct. This removed the ability to 'three-tick snipe.'" (29 Mar 2021).
- **OTHER:** Patch notes: "Channel time reduced from 2.4s → 1.8s", "Has a 60-second cooldown", "Deals 330% average damage". "Snipe no longer causes Rapid Fire to only fire one shot." (2012 fix).

---

## 10. Bombardment

Source: https://runescape.wiki/w/Bombardment (raw: https://runescape.wiki/w/Bombardment?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 36`, `adrenaline = -25`, `cooldown = 1.8` (GCD only), `damage = 240%`, `target = Area`, `equipment = Any`, `members = No`. Not channelled, obeys GCD. 9 March 2026: "Bombardment no longer goes on cooldown after being used." (before that: 5.4 s / 9 ticks; overview table still says "{{ticks|9}} cooldown" – superseded by the 9 March patch).
- **Tooltip:** "Fire a volley of shots into the air, which come raining down. 220-260% Ranged damage to the target and up to 9 additional enemies within 2 tiles of the target. Damage is 60% effective in PvP."
- **Hits:** 1 hit per target, up to 10 targets in a 5×5 around the main target ("deals 220-260% ability damage to their target and to all enemies in a 5x5 area around the main target"). AoE is centre/size based (§0).
- **RESOURCES:** costs 25 % adrenaline; one ammo per cast.
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** Searing Winds (1 hit per target), Shadow Imbued (1 proc per target hit – "Ranged attacks against your target generate 5% adrenaline with each hit"; see Imbue: Shadows ambiguity about "your target"), Death's Swiftness ×1.5.
- **REQUIREMENTS:** ≥25 % adrenaline, ranged main hand + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a.
- **OTHER:** "when fighting a single target, Snap Shot and Rapid Fire should always be prioritised, as they deal significantly more damage to a single target for the same adrenaline cost".

---

## 11. Rapid Fire

Source: https://runescape.wiki/w/Rapid_Fire (raw: https://runescape.wiki/w/Rapid_Fire?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 62`, `adrenaline = -25`, `cooldown = 20.4` (34 ticks), `damage = 640%`, `target = Single`, `equipment = Any`, `members = No`. **Channelled**, 8 ticks (4.8 s). Triggers GCD at cast; the channel outlasts the GCD ("after a channelled ability, the player can immediately use another ability").
- **Tooltip:** "Rapidly fire at the target. Attack 8 times over 8 ticks. 75-85% Ranged damage per hit. Channelled. Binds the target for 10 ticks. Each attack extends the duration of Searing Winds by 1 tick. Damage is 80% effective in PvP. Can move while channelling."
- **Hits:** "Rapid Fire deals 8 hits with one hit every 0.6 second of 75-85% ability damage per hit, for a total of 600-680% ability damage." Overview: "8 hits of 75-85% ranged abilty damage every {{ticks|1}} (channelled)".
- **RESOURCES:** costs 25 % adrenaline. Ammo: per shot fired – whether 8 shots = 8 ammo rolls is not spelled out; the Part 1 rule "Ammunition is consumed per shot fired, not per hit" implies one roll per Rapid Fire shot (8). Dracolich armour: "With at least 1 piece of armour worn, channelling Rapid Fire generates an additional 0.2 or 0.5 adrenaline (per piece worn, respectively) every 0.6 seconds. With at least 3 pieces worn, whilst wielding a bow, channelling Rapid Fire for its full duration grants Dracolich infusion for 3 seconds, increasing the chance to critical strike with ranged attacks by 20% or 40% respectively."
- **MODIFIES OTHER ABILITIES:** **Galeshot / Searing Winds**: "Each attack extends the duration of Searing Winds by 1 tick" – "essentially pausing the duration while channelling Rapid Fire"; "Rapid Fire takes 4.8 seconds but adds 4.8 seconds to the duration" (max +8 ticks per cast; only "(if active)"). With Shadow Imbued: 8 × 5 % = 40 % adrenaline back.
- **IS MODIFIED BY:** Searing Winds (+20 % AD × 8), Shadow Imbued (+5 % × 8), Death's Swiftness ×1.5, Elder God arrows / bakriminel bolts per hit, Dracolich. Fleeting boots no longer needed: "Movement no longer interrupts the ability (no longer requires fleeting boots for this effect)".
- **REQUIREMENTS:** ≥25 % adrenaline, ranged main hand + ammo.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS applied:** **Bound** on the target for 10 ticks (6 s): Bind page "Channelled for 4.8 seconds. Binds for 6 seconds." Removed by Freedom ("Freedom now breaks binds applied by NPCs using Asphyxiate, Rapid Fire, Flurry and Assault"), blocked by Stun Immune / Freedom immunity. Does not stun ("Asphyxiate, Destroy and Rapid Fire will no longer stun NPCs", 2014). Which hit applies the bind is not documented (assume first hit).
- **CHANNEL rules:** 8 hits, 1 per tick, 8 ticks. "the player can move around without cancelling the ability." Cancelled by performing another ability (generic channel rule, §0). Pressing another ability mid-channel: the new ability is cast (GCD has already elapsed after tick 3) and the remaining Rapid Fire hits are lost; no refund of adrenaline or cooldown is documented. Ability queueing quirk: "Perform an ability, call it ability 1. Then during GCD, queue another ability, call it ability 2. Use Rapid Fire on tick so that ability 2 remains on cooldown. Ability 2 will remain queued, even after another GCD passes after the cast of Rapid Fire and will automatically launch as the full channel of Rapid Fire ends such that ability 2 lands early." (https://runescape.wiki/w/Ability_queueing#Saving_a_tick_with_Rapid_Fire).
- **OTHER:** "Rapid Fire is generally regarded as the most useful ranged ability ... capable of doing more damage than some of Ranged ultimate abilities." Airut: "if the airut is hit with Rapid Fire, Flurry or Greater Flurry, they will be stunned, bound and take double damage for a short duration."

---

## 12. Corruption Shot

Source: https://runescape.wiki/w/Corruption_Shot (raw: https://runescape.wiki/w/Corruption_Shot?action=raw); status: https://runescape.wiki/w/Corruption_Shot_(status)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 70`, `adrenaline = -20`, `cooldown = 15` (25 ticks), `damage = 300%`, `target = Multi`, `equipment = Any`, `members = Yes`, `buff = Corruption Shot (status)`. Not channelled (DoT), obeys GCD.
- **Tooltip:** "Corrupts the target and nearby enemies, causing them to to take damage over time. 90-110% Ranged damage per hit every 2 ticks to the target and up to 5 additional enemies within 5 tiles of the target. 5 hits. Damage over time. Damage is reduced by 20% of initial damage with each hit."
- **Hits:** "The first hit of Corruption Shot applies a debuff to up to 6 targets, and deals anywhere from 90-110% ability damage. Each subsequent hit will deal less damage, decreasing by 20% of the initial hit. For example, if the initial hit is 1080, the 5 hits will be: 1080–864–648–432–216. This means that the ability does a total of 270-330% ability damage." Status: "Deals damage every 1.2 seconds (maximum of 5 hits) ... Subsequent hits deal 80%, 60%, 40% and 20% respectively", duration "6 seconds". (The status page's "First hit deals 33-100%" is stale pre-2024 text.) "No longer spreads, instead initial hit can hit multiple targets" (overview).
- **RESOURCES:** costs 20 % adrenaline; one ammo per cast. Shadow Imbued: "The effect is not triggered by: ... Damage over time hits from corruption shot" – only the initial application hit could proc (not explicitly confirmed).
- **MODIFIES OTHER ABILITIES:** none. "The corruption can be used together with other damage over time abilities without overriding their effects, including Corruption Blast."
- **IS MODIFIED BY:** DoT rules (§0): "Damage of Corruption Shot is not increased as it is a damage-over-time ability" (Death's Swiftness page). Not affected by crits, prayers, Precise/Ruthless, enchanted bolts; affected by equipment damage bonus, Vulnerability/Curse, Eruptive, slayer effects, Icy Precision (Wen). Whether Searing Winds' flat bonus applies to the initial hit is not documented.
- **REQUIREMENTS:** ≥20 % adrenaline, ranged main hand + ammo; unlock via Corruption Shot Ability Codex / Mazcab ability codex; members.
- **SHARED COOLDOWNS:** "Corruption Shot shares its cooldown timer with Corruption Blast." (Magic ability – irrelevant to a ranged-only bar, but casting either puts both on the 25-tick cooldown.)
- **GREATER version:** none.
- **BUFFS/DEBUFFS applied:** **Corruption Shot (status)** debuff on each hit target: `timer = No`, `stacks = No`, duration 6 s, "Removed upon activating Freedom or eating numbing root". "Freedom can be used to clear the corruption effect." "The corruption shot and corruption blast abilities will now correctly clear after death."
- **CHANNEL rules:** n/a – "unlike channelled abilities, they cannot be cancelled by the player" (§0). Ticks: initial hit, then every 2 ticks, 5 hits total.
- **OTHER:** "Corruption Shot can continue to deal damage to monsters while you are far away from the scene, and even after you died." "If the corruption hits a monster that is not in combat, they will take damage over time and become aggressive towards the player who used it." Patch notes: "Ranged had few tools to tag monsters that weren't grouped up. By changing corruption shot we give Ranged a valuable 'tag' tool".

---

## 13. Shadow Tendrils

Source: https://runescape.wiki/w/Shadow_Tendrils (raw: https://runescape.wiki/w/Shadow_Tendrils?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 75`, `adrenaline = 0`, `cooldown = 45` (75 ticks), `damage = 330% (guaranteed to crit)`, `target = Single`, `equipment = Any`, `members = Yes`. Not channelled, obeys GCD.
- **Tooltip:** "Shadow tendrils whip at your feet, before striking the target. 200%-240% Ranged damage. 100%-135% damage to self. Extends the duration of Shadow imbued by 6 ticks. Guaranteed to critically strike."
- **Hits:** 1 hit on target (200–240 %), 1 self-hit (100–135 %). "Shadow Tendrils deals a single hit of 100-135% ability damage to the player, even if it hits multiple targets through the use of chinchompas or the Locate special attack." "it summons shadow tendrils to inflict 100-135% ability damage on the player, before dealing 200-240% ability damage on the target" (self-damage first).
- **RESOURCES:** "an enhanced ability that does not cost or generate adrenaline"; one ammo per cast. Self-damage does not trigger Shadow Imbued ("not triggered by ... Self damage from Shadow Tendrils"); the target hit does (+5 %).
- **MODIFIES OTHER ABILITIES:** **Imbue: Shadows / Shadow Imbued**: "Shadow Tendrils will extend the duration of Shadow Imbued by 3.6 seconds if it is active. Because another ability cannot be activated after Shadow Tendrils for 1.8 seconds, this effectively adds 1.8 seconds to the duration of Shadow Imbued." Only if the buff is active; no application if absent.
- **IS MODIFIED BY:** "The damage dealt to the target by Shadow Tendrils is increased by all buffs, but the self-damage is only increased by buffs that apply to the player's base ability damage. This attack is guaranteed to be a critical strike." So Death's Swiftness ×1.5 and Searing Winds apply to the target hit; not to the self-hit. Equilibrium perk fix noted (crit lands correctly).
- **REQUIREMENTS:** ranged main hand + ammo; Codex Ultimatus (after The Dig Site); members. No adrenaline requirement.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS:** none applied; extends Shadow Imbued (+6 ticks).
- **CHANNEL rules:** n/a.
- **OTHER:** Patch notes: "making it an important cooldown for maximising damage and Adrenaline gain through Imbue: Shadows."

---

## 14. Imbue: Shadows

Source: https://runescape.wiki/w/Imbue:_Shadows (raw: https://runescape.wiki/w/Imbue:_Shadows?action=raw); buff: https://runescape.wiki/w/Shadow_Imbued

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Enhanced`, `level = 90`, `adrenaline = -40`, `cooldown = 60` (100 ticks), `damage = None`, `target = Self`, `equipment = Any`, `members = No`, `buff = Shadow Imbued`. Not channelled; obeys GCD (nothing says it can be cast during the GCD).
- **Tooltip:** "Imbue your weapon with dark whispers. Applies Shadow Imbued to self. 50 ticks duration. Shadow Imbued: Ranged attacks against your target generate 5% Adrenaline with each hit."
- **RESOURCES:** costs 40 % adrenaline (requires ≥40 %). No ammo (no shot). "Fixed a bug that made it free to cast outside of combat." → it costs 40 % even out of combat. Generates the **Shadow Imbued** buff.
- **MODIFIES OTHER ABILITIES:** every ranged hit for 50 ticks gives +5 % adrenaline: "This causes each ranged hit against any target to generate an additional 5% adrenaline, or 10% adrenaline if Natural Instinct is active." Applies to hits from: "Ranged abilities; Ranged special attacks; Abilities or special attacks that hit multiple targets due to locate effects; Perfect Equilibrium hits from the Bow of the Last Guardian passive effect; Darkfang hits from the dark bow or gloomfire bow passive effects; Snipe secondary hits from the enchantment of dread; Aftershock procs (provided the player is wielding a ranged weapon); Crackling procs (provided the player is wielding a ranged weapon)". NOT triggered by: "Additional chinchompa hits; Split Soul hits; God book and scripture hits; Familiars that deal ranged damage; Dreadnips in ranged mode; Damage over time hits from corruption shot; Self damage from Shadow Tendrils". Per-ability yields: Rapid Fire 40 %, Greater Ricochet 35 %, Igneous Deadshot 40 %, Deadshot 20 %, Ricochet 15 %, Snap Shot / Piercing Shot 10 %, single-hit abilities 5 %.
- **IS MODIFIED BY:** Shadow Tendrils (+6 ticks duration). Natural Instinct doubles the 5 % to 10 %. Adrenaline page: "Meteor Strike, Imbue: Shadows, and Tsunami will give the player a 30 second buff that grants additional adrenaline."
- **REQUIREMENTS:** ≥40 % adrenaline, ranged main hand (ability book rule). No target required (self-target) – not explicitly documented.
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none.
- **BUFFS/DEBUFFS applied:** **Shadow Imbued** (self), `timer = Yes`, `stacks = No`, "duration = 30 seconds; Activating Shadow Tendrils increases the duration by 3.6 seconds; effects = Each hit from Ranged abilities generates 5% adrenaline". "Buff now clears on death." "Fixed a bug that stopped the buff applying to delayed attacks such as the Crystal Rain special." Not a debuff → Freedom irrelevant. Cannot overlap itself (cooldown 100 t > 50 + 6 t).
- **CHANNEL rules:** n/a.
- **OTHER:** "It is a rework of the Incendiary Shot ability." Tooltip says "against your target" but the wiki body says "against any target" – see ambiguities.

---

## 15. Deadshot

Source: https://runescape.wiki/w/Deadshot (raw: https://runescape.wiki/w/Deadshot?action=raw)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Ultimate`, `level = 21`, `adrenaline = -60`, `cooldown = 30` (50 ticks), `damage = 460%` (standard) / `520%` (Igneous), `target = Single`, `equipment = Any` (Igneous variant: "Back: Igneous Kal-Xil or Igneous Kal-Zuk"), `members = No` (Igneous variant members). Not channelled, obeys GCD. "Deadshot is the only ultimate Ranged ability usable by free-to-play players."
- **Tooltip (standard):** "Fire an enchanted shot at the target, striking them multiple times. 105%-125% Ranged damage per hit. 4 hits. Damage is 60% effective in PvP." **Igneous:** "55%-75% Ranged damage per hit. 8 hits."
- **Hits:** 4 × 105–125 % (420–500 %); with Igneous Kal-Xil / Kal-Zuk 8 × 55–75 % (440–600 %). "No longer applies damage-over-time, instead hits the target multiple times." Hit spacing is not documented.
- **RESOURCES:** costs 60 % adrenaline (requires ≥60 %). "As an ultimate ability, Deadshot is affected by the ring of vigour and the Conservation of Energy relic power, each reducing its adrenaline cost by 10%". One ammo per cast. Shadow Imbued: 4 × 5 % = 20 % (Igneous 40 %).
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** Igneous Kal-Xil / Kal-Zuk (8 hits, "greatly improves its synergy with Ranged abilities that enhance on-hit effects such as Imbue: Shadows and Galeshot"). Ultimatums: "increases its damage by 3% + 1% per rank". "As it is no longer a bleed, it can now critically strike and benefit from Death's Swiftness" (overview). Searing Winds per hit. Igneous capes "No longer reduce the adrenaline cost of their related abilities, as those abilities now have their adjusted costs by default" (Part 2 notes) – 60 % with or without the cape.
- **REQUIREMENTS:** ≥60 % adrenaline, ranged main hand + ammo. No cape required for the base version ("igneous cape no longer required").
- **SHARED COOLDOWNS:** none.
- **GREATER version:** none (the Igneous form is an equipment-conditional variant of the same ability, same id 14674).
- **BUFFS/DEBUFFS:** none.
- **CHANNEL rules:** n/a.
- **OTHER:** Revolution: ultimate auto-trigger can be toggled (https://runescape.wiki/w/Ultimate_abilities).

---

## 16. Death's Swiftness

Source: https://runescape.wiki/w/Death%27s_Swiftness (raw: https://runescape.wiki/w/Death's_Swiftness?action=raw); status: https://runescape.wiki/w/Death%27s_Swiftness_(status)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Ultimate`, `level = 76`, `adrenaline = -100`, `cooldown = 60` (100 ticks), `damage = None`, `target = Self`, `equipment = Any`, `members = Yes`, `buff = Death's Swiftness (status)`. Not channelled, obeys GCD.
- **Tooltip:** "Create a shroud of death. Ranged attacks deal 1.5x damage. 50 ticks duration."
- **Effect:** "granting them an increase of 50% to their ranged damage for the duration of the ability." Status: "Increases ranged damage by 50%", duration "30 seconds; 37.8 seconds if cast with Planted Feet". 16 March 2026: "Death Swiftness is now entirely mobile and features new visual effects too. No longer has a small damage over time effect. Can now be cast when out of range of an active target." "Unlike Sunshine, the magic equivalent, it is a self-buff, so the player is free to move without losing the damage bonus."
- **Buff timing:** "The damage buff provided from Death's Swiftness begins 0.6 seconds after cast." Page table: without Planted Feet "Entire duration 31.2s, Damage buff duration 30.6s"; with Planted Feet "37.8s / 37.2s". Ability queueing page: "regular (52 game ticks, buff duration: 1 tick after cast, 51 game ticks total) or a Planted Feet (64 game ticks, buff duration: 1 tick after cast, 63 game ticks total)". **Discrepancy:** infobox/overview say 50 ticks; the duration table and queueing page say 52 ticks total / 51 ticks of buff. See ambiguities.
- **RESOURCES:** costs 100 % adrenaline (ring of vigour / Conservation of Energy: "Saves 10% adrenaline after using an ultimate ability", https://runescape.wiki/w/Adrenaline). No ammo (self target, no shot). Does not trigger Shadow Imbued (no hit).
- **MODIFIES OTHER ABILITIES:** all ranged attacks ×1.5 for the duration: Ranged, Piercing Shot, Binding Shot, Galeshot, Ricochet(s), Snap Shot, Snipe, Bombardment, Rapid Fire, Shadow Tendrils (target hit only), Deadshot. **Not** Corruption Shot: "Damage of Corruption Shot is not increased as it is a damage-over-time ability." Not Shadow Tendrils self-damage (only "buffs that apply to the player's base ability damage"). Whether the flat Searing Winds +20 % is multiplied is undocumented.
- **IS MODIFIED BY:** Planted Feet: "With the Planted Feet perk, Death's Swiftness will last for 63 ticks." "the duration of Sunshine and Death's Swiftness are increased by 11 ticks, bringing their total duration from 31.2 seconds to 37.8 seconds ... the ultimates do not provide the damage boost on the tick they are activated on. This means that the damage buff duration has been increased from 30.6 seconds to 37.2 seconds" (https://runescape.wiki/w/Planted_Feet). "This effect is not cancelled by switching weapon while Death's Swiftness or Sunshine are in effect". Ultimatums affects damage of ultimates (no damage here). Natural Instinct synergy described on page.
- **REQUIREMENTS:** 100 % adrenaline; The World Wakes; ranged main hand ("Sunshine and Death's Swiftness (and abilities in general) can only be activated if the main hand (or two-handed) weapon is of the same style as the ability", Planted Feet page). "Death's Swiftness can also be cast even if the target is still alive and out of range." "It is now possible to cast Death's Swiftness and Sunshine without a target." (2015).
- **SHARED COOLDOWNS:** none documented.
- **GREATER version:** see §17. "Death's Swiftness can be permanently upgraded into Greater Death's Swiftness, by reading a Greater Death's Swiftness ability codex" → replaces it; only one on the bar.
- **BUFFS/DEBUFFS applied:** **Death's Swiftness (status)** self buff, `timer = Yes`, `stacks = No`. Not a debuff → Freedom irrelevant. Re-cast impossible while active (cooldown 100 t > 63 t).
- **CHANNEL rules:** n/a.
- **OTHER:** Ability queueing: "Sunshine, Death's Swiftness, and greater variants: ... an ability cast on the final tick of the buff ... There does not appear to be any difference between an ability cast on the final tick of the buff for a manual trigger, a revolution trigger, or a queueing trigger." (i.e. final-tick casts still get the buff).

---

## 17. Greater Death's Swiftness

Source: https://runescape.wiki/w/Greater_Death%27s_Swiftness (raw: https://runescape.wiki/w/Greater_Death's_Swiftness?action=raw); status: https://runescape.wiki/w/Greater_Death%27s_Swiftness_(status)

- **Type / adrenaline / cooldown / duration / channelled / GCD:** `type = Ultimate`, `level = 76`, `adrenaline = -100`, `cooldown = 60` (100 ticks), `damage = None`, `target = Self`, `equipment = Any`, `members = Yes`, `buff = Greater Death's Swiftness (status)`. Not channelled, obeys GCD.
- **Tooltip:** "Create a shroud of death. Ranged attacks deal 1.5x damage. 63 ticks duration."
- **Difference to base:** "In comparison to the standard Death's Swiftness, the greater version lasts 11 ticks longer for a total duration of 63 ticks (37.8 seconds), although the damage buff provided begins 1 tick after cast, lasting a total of 62 ticks (37.2 seconds)." "Greater Death's Swiftness does not benefit from the Planted Feet perk." Everything else (cost, cooldown, ×1.5, requirements, DoT exclusion, mobility, castable out of range) identical to §16. Unlocked by "reading a Greater Death's Swiftness ability codex (or untradeable version)" made from Cywir components + Codex of lost knowledge (Zamorak drop); it replaces Death's Swiftness.
- **BUFFS/DEBUFFS applied:** **Greater Death's Swiftness (status)**, `timer = Yes`, `stacks = No`, duration "37.8 seconds", "Increases ranged damage by 50%".
- **Everything else:** as §16.

---

## 18. Ranged mechanics summary

### 18.1 The ranged "resource"

Post-update Ranged has **no stack-counter resource** (unlike Melee's Bloodlust). The old stack mechanic was removed: "Abilities removed: Dazing Shot, Greater Dazing Shot, Salt the Wound, and the Punctured mechanic ... Needle Strike ... Fragmentation Shot ... Incendiary Shot ... Unload ... Tight Bindings, Demoralise, Rout" (https://runescape.wiki/w/Combat_Style_Modernisation). ("Puncture" now only exists as the Splintering arrows ammo effect.) The style's identity is instead: "Ranged's main identity is characterised as 'a lot of small hits', with many abilities taking an on-hit effect. This is capitalised on by the two new abilities, Galeshot and Imbue: Shadows to provide additional benefit to each hit." The simulator must therefore model three things:

1. **Searing Winds** (self buff, from Galeshot): 10 ticks; every ranged hit +20 % ability damage flat; +1 tick per Rapid Fire hit (max +8); calculated on cast so an ability cast on the expiry tick still benefits; no stacks; clears on death; cannot overlap itself. (https://runescape.wiki/w/Searing_Winds)
2. **Shadow Imbued** (self buff, from Imbue: Shadows): 50 ticks; every qualifying ranged hit +5 % adrenaline (+10 % with Natural Instinct); +6 ticks when Shadow Tendrils is cast while active; no stacks; clears on death; cannot overlap itself; DoT ticks of Corruption Shot and Shadow Tendrils self-damage do not count. (https://runescape.wiki/w/Shadow_Imbued, https://runescape.wiki/w/Imbue:_Shadows)
3. **Ammunition**: every ranged ability except Escape / Imbue: Shadows / Death's Swiftness fires a shot; one break roll (15 % default) per shot, not per hit; ammo effects (Wen/Bik/Splintering/Deathspore stacks, bakriminel bolt procs) apply per hit. (https://runescape.wiki/w/Combat_Style_Modernisation, Part 1 notes)

Plus the **Snipe cooldown economy**: Snipe (100-tick cooldown, 0 adrenaline, 330 % avg) is recharged by Piercing Shot hits (−4 ticks each, −6 with fleeting boots) and, with fleeting boots, by the basic attack (−6 ticks per hit).

### 18.2 Ranged-wide passives / rules

- All basics +9 % adrenaline; enhanced abilities cost 0–40 %; ultimates 60 % (Deadshot) or 100 % (Death's Swiftness).
- Requires ranged main-hand weapon (Escape excepted). No ability in the ranged book has a 2h / dual-wield / shield requirement.
- Fixed impact timings regardless of weapon; hidden weapon speed; AoE from NPC centre.
- PvP damage effectiveness: Snap Shot 60 %, Bombardment 60 %, Deadshot 60 %, Rapid Fire 80 %, Snipe 75 %.
- Equipment hooks the simulator may expose: fleeting boots (Snipe CD), nightmare gauntlets (+25 % hit chance on Snipe, move while sniping; enchantment of dread → extra 150–180 % flanking shot), Igneous Kal-Xil/Kal-Zuk (8-hit Deadshot), Dark bow/Gloomfire (2-hit basic attack), Caroming (+4 %/rank per Ricochet hit), Planted Feet (+11 ticks Death's Swiftness only, not Greater), Ultimatums (+3 % +1 %/rank on ultimates), Dracolich armour (Rapid Fire adrenaline / crit), ring of vigour / Conservation of Energy (−10 % ultimate cost), Mobile (halves Escape cooldown), Double Escape codex.

### 18.3 Cross-ability rules (WHEN … THEN …)

1. WHEN a Piercing Shot hit lands THEN Snipe's remaining cooldown −4 ticks (−6 ticks with fleeting boots); per target hit under Locate. (https://runescape.wiki/w/Piercing_Shot, https://runescape.wiki/w/Snipe, https://runescape.wiki/w/Fleeting_boots)
2. WHEN fleeting boots are worn AND a Ranged basic-attack hit lands THEN Snipe's remaining cooldown −6 ticks (Darkfang: 2 hits → −12 ticks per cast). (https://runescape.wiki/w/Ranged_(ability), https://runescape.wiki/w/Fleeting_boots)
3. WHEN Galeshot is cast THEN apply Searing Winds to self for 10 ticks. (https://runescape.wiki/w/Galeshot)
4. WHEN Searing Winds is active AND any ranged ability hit lands THEN that hit gets +20 % ability damage flat (evaluated at cast; expiry-tick casts still count). (https://runescape.wiki/w/Searing_Winds)
5. WHEN Searing Winds is active AND a Rapid Fire hit lands THEN Searing Winds duration +1 tick (max +8 per Rapid Fire). (https://runescape.wiki/w/Rapid_Fire, https://runescape.wiki/w/Searing_Winds)
6. WHEN Imbue: Shadows is cast THEN apply Shadow Imbued to self for 50 ticks, costing 40 % adrenaline. (https://runescape.wiki/w/Imbue:_Shadows)
7. WHEN Shadow Imbued is active AND a qualifying ranged hit lands THEN +5 % adrenaline (+10 % under Natural Instinct); excluded: Corruption Shot DoT ticks, Shadow Tendrils self-damage, chinchompa extra hits, Split Soul, god book, familiars, dreadnips. (https://runescape.wiki/w/Imbue:_Shadows)
8. WHEN Shadow Imbued is active AND Shadow Tendrils is cast THEN Shadow Imbued duration +6 ticks. (https://runescape.wiki/w/Shadow_Tendrils, https://runescape.wiki/w/Shadow_Imbued)
9. WHEN Death's Swiftness / Greater Death's Swiftness buff is active THEN all ranged ability hits ×1.5, EXCEPT Corruption Shot (DoT) and Shadow Tendrils self-damage; buff starts 1 tick after cast; lasts 50 (52?) / 63 ticks. (https://runescape.wiki/w/Death%27s_Swiftness, https://runescape.wiki/w/Template:Bleeds:_Unaffected_boosts, https://runescape.wiki/w/Greater_Death%27s_Swiftness)
10. WHEN Planted Feet is on the main hand at cast AND Death's Swiftness (not Greater) is cast THEN duration 63 ticks instead of 50. (https://runescape.wiki/w/Planted_Feet)
11. WHEN Snipe is cast THEN Snipe goes on its 100-tick cooldown immediately; damage lands after 3 ticks only if the target is still in range AND no other ability was used AND (without nightmare gauntlets) the player did not move. (https://runescape.wiki/w/Snipe, https://runescape.wiki/w/Nightmare_gauntlets)
12. WHEN another ability is used during a Rapid Fire channel THEN Rapid Fire is cancelled (remaining hits lost); moving does NOT cancel Rapid Fire. (https://runescape.wiki/w/Abilities#Channelled, https://runescape.wiki/w/Rapid_Fire)
13. WHEN Rapid Fire's channel starts THEN target is Bound for 10 ticks (removed by Freedom, blocked by Stun Immune). (https://runescape.wiki/w/Rapid_Fire, https://runescape.wiki/w/Bind)
14. WHEN Binding Shot hits THEN target Stunned 2 ticks + Bound 16 ticks (Flanking perk: no stun, +up to 160 % damage vs targets facing away). (https://runescape.wiki/w/Binding_Shot)
15. WHEN Ranged ≥ 54 THEN Binding Shot has 2 charges (second usable while the first is on cooldown). (https://runescape.wiki/w/Binding_Shot, Part 1 notes)
16. WHEN Ricochet / Greater Ricochet finds fewer secondary targets than its maximum THEN the primary target takes one extra 15–20 % hit per missing target (Greater: 4–6 % for the 3rd–6th missing), landing 1 tick after the initial hit as separate hitsplats. (https://runescape.wiki/w/Ricochet, https://runescape.wiki/w/Greater_Ricochet)
17. WHEN Caroming rank r is on the weapon THEN every Ricochet / Greater Ricochet hit +4 %·r ability damage flat. (https://runescape.wiki/w/Caroming)
18. WHEN Corruption Shot is cast THEN apply Corruption Shot (status) to the target and up to 5 enemies within 5 tiles: 5 hits every 2 ticks at 1.0/0.8/0.6/0.4/0.2 × initial (90–110 %); removed by Freedom / numbing root; cannot be cancelled by the caster; puts Corruption Blast on cooldown too. (https://runescape.wiki/w/Corruption_Shot, https://runescape.wiki/w/Corruption_Shot_(status))
19. WHEN Igneous Kal-Xil / Kal-Zuk is worn THEN Deadshot = 8 × 55–75 % instead of 4 × 105–125 % (cost still 60 %). (https://runescape.wiki/w/Deadshot)
20. WHEN Dark bow / Gloomfire bow is wielded THEN the Ranged basic attack = 2 × 45–55 %. (https://runescape.wiki/w/Ranged_(ability))
21. WHEN Escape is pressed THEN it ignores and does not start the GCD; cooldown 34 ticks (17 with Mobile); does not share with Surge outside PvP (a short undocumented anti-spam delay remains); Double Escape → 2 charges. (https://runescape.wiki/w/Escape, https://runescape.wiki/w/Update:DailyScape_Overhaul_%26_Free_Runemetrics_for_Members)
22. WHEN the player is Stunned THEN no ability can be used except Freedom; WHEN Bound THEN abilities still usable but no movement. (https://runescape.wiki/w/Stunned_(status), https://runescape.wiki/w/Bound_(status))
23. WHEN a ranged shot is fired THEN roll ammo break (15 %) once per shot, regardless of hit count; Blightbound crossbow 25 % save, Ranged master cape 10 % save. (Part 1 notes, https://runescape.wiki/w/Combat_Style_Modernisation)
24. WHEN a Greater codex has been read (Greater Ricochet / Greater Death's Swiftness) THEN the base ability is replaced; both cannot be on the bar. (https://runescape.wiki/w/Greater_Ricochet, https://runescape.wiki/w/Death%27s_Swiftness)

### 18.4 Quick reference table

| Ability | Type | Adren | Cooldown | Hits × dmg (avg total) | Channel | Notes |
|---|---|---|---|---|---|---|
| Escape | Utility | 0 | 34 t (17 Mobile) | – | – | during GCD, no ranged weapon needed |
| Ranged | Basic | +9 | GCD | 1 × 90–110 (100) | – | Darkfang 2 × 45–55 |
| Piercing Shot | Basic | +9 | 5 t | 2 × 45–55 (100) | – | Snipe −4 t/hit (−6 fleeting) |
| Binding Shot | Basic | +9 | 25 t, 2 charges @54 | 1 × 65–75 (70) | – | stun 2 t, bind 16 t |
| Galeshot | Basic | +9 | 34 t | 1 × 90–110 (100) | – | Searing Winds 10 t |
| Ricochet | Basic | +9 | 17 t | 80 + 2 × 17.5 (115) | – | up to 2 secondaries |
| Greater Ricochet | Basic | +9 | 17 t | 80 + 2 × 17.5 + 4 × 5 (135) | – | up to 6 secondaries |
| Snap Shot | Enhanced | −25 | GCD | 2 × 135–155 (290) | – | 60 % PvP |
| Snipe | Enhanced | 0 | 100 t | 1 × 300–360 (330) | 3 t | cancelled by ability/move |
| Bombardment | Enhanced | −25 | GCD | 1 × 220–260 (240) per target, 5×5 | – | 60 % PvP |
| Rapid Fire | Enhanced | −25 | 34 t | 8 × 75–85 (640) | 8 t, 1/t | bind 10 t, SW +1 t/hit, movable |
| Corruption Shot | Enhanced | −20 | 25 t (shared w/ Corruption Blast) | 5 DoT hits /2 t, 1.0/.8/.6/.4/.2 × 90–110 (300) | – | up to 6 targets, Freedom clears |
| Shadow Tendrils | Enhanced | 0 | 75 t | 1 × 200–240 (220) crit + self 100–135 | – | Shadow Imbued +6 t |
| Imbue: Shadows | Enhanced | −40 | 100 t | – | – | Shadow Imbued 50 t, +5 % adren/hit |
| Deadshot | Ultimate | −60 | 50 t | 4 × 105–125 (460) / Igneous 8 × 55–75 (520) | – | 60 % PvP |
| Death's Swiftness | Ultimate | −100 | 100 t | – | – | ×1.5 for 50 t (63 with Planted Feet) |
| Greater Death's Swiftness | Ultimate | −100 | 100 t | – | – | ×1.5 for 63 t, no Planted Feet |

### 18.5 Ambiguities / gaps in the wiki (decide explicitly in the simulator)

1. **Snap Shot cooldown**: overview table says 9 ticks; ability page + official notes say none (GCD only). → use GCD only.
2. **Binding Shot 2nd charge level**: overview says 70, ability page / Bind page / official notes say 54. → use 54. Charge-recharge model (independent 25-tick cooldown per charge?) not documented.
3. **Death's Swiftness duration**: 50 ticks (infobox, overview) vs 52 ticks total / 51 ticks buff (duration table, queueing page); buff starts 1 tick after cast in all sources. Greater: 63 total / 62 buff is consistent.
4. **Shadow Imbued target scope**: tooltip "against your target" vs wiki body "against any target"; multi-target hits (Bombardment, Ricochet secondaries, Corruption Shot initial) may or may not each proc.
5. **Does Searing Winds' flat +20 % get multiplied by Death's Swiftness / crits?** Not documented.
6. **Corruption Shot initial hit**: whether it counts as a "hit" for Searing Winds / Shadow Imbued is not stated (only the DoT ticks are excluded).
7. **Piercing Shot Snipe reduction on a miss / 0 hit**: "per shot that hits" vs "per hit" – undefined for misses.
8. **Snipe cancelled mid-channel**: cooldown already applied on tick 1 → presumably still 100 ticks; not explicitly confirmed. Also whether cancelling clears the GCD (documented only for spells).
9. **Rapid Fire interrupted**: no refund of adrenaline/cooldown documented; which hit applies the bind not documented; ammo rolls per shot (8) implied, not stated.
10. **Deadshot hit spacing** (4 or 8 hits on one tick or spread) not documented; the Ricochet extra hits are documented as +1 tick.
11. **Escape/Surge anti-spam delay** length not documented (only "very short ... to prevent both abilities firing on the same cycle").
12. **Ranged basic attack level**: 1 (infobox) vs 0 (overview) – irrelevant for a maxed simulator.
13. **Impact tick per ability** after "fixed impact timings" is not documented anywhere; the pre-update convention was "one game tick after cast instead of two" depending on override/distance.
