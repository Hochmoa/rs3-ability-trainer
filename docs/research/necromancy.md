# RS3 Necromancy abilities – simulator spec (researched September 2026)

Source: https://runescape.wiki (raw wikitext via `?action=raw`, fetched 2026-09-03).
Every rule below is quoted verbatim from the wiki (in `>` blocks or "quotes") with the page URL. Numbers in ticks use the RS3 tick of 0.6 s.

## Global notes (apply to all Necromancy abilities)

- Requirement for all Necromancy abilities: "All basic, enhanced, and ultimate abilities requires a siphon in main hand." — https://runescape.wiki/w/Necromancy_abilities. "The ability damage dealt to targets are counted as Necromancy damage." (same page)
- Conduit requirement (off-hand) is per ability; listed under REQUIREMENTS below. Conjure/Command abilities and Soul Sap need a conduit; the rest have `equipment = Any`.
- **Combat Style Modernisation (2 March 2026) – Necromancy changes** (https://runescape.wiki/w/Update:Patch_Notes:_Part_2_-_Combat_Style_Modernisation):
  > * '''Death Skulls''' cooldown reduced from 12 seconds to 9 seconds while inside Living Death
  > * '''Impatient perk''' now also works with Basic Attacks
  > * '''Fury of the Small relic''' now also works with Basic Attacks
  > {{UB|Igneous Kal-Ket / Kal-Mej / Kal-Xil / Kal-Mor|header=4}}
  > * No longer reduce the adrenaline cost of their related abilities, as those abilities now have their adjusted costs by default.

  Plus, from the Death Skulls page update history: "Adrenaline: -100% → -60%" and "Cooldown of Death Skulls during Living Death: 20 ticks → 17 ticks" (https://runescape.wiki/w/Death_Skulls). Nothing else in the Necromancy ability set was changed. NOTE the patch notes say "9 seconds" (= 15 ticks) but every wiki ability page says 17 ticks (10.2 s) — see ambiguity list at the end.
- **Global cooldown:** "The global cooldown ... is the 3-tick (1.8 s) cooldown which starts every time a player begins to use a spell or ability, and affects all of other spells and abilities." — https://runescape.wiki/w/Cooldown. No Necromancy ability page marks any of the 20 abilities as usable during the GCD; the conjure hit-timing pages confirm conjures trigger it: "If the tick where the Conjure ability is activated is tick 0: Your next ability will be used on tick 3 (i.e. after the global cooldown (GCD))" — https://runescape.wiki/w/Skeleton_Warrior/Hit_timings. **Simulator rule: every ability in this file triggers the 3-tick GCD and none can be cast during it.**
- **Threads of Fate** (incantation, https://runescape.wiki/w/Threads_of_Fate): "Single-target necromancy attacks will also be cast on up to 4 additional enemies within 4 tiles of the target. 6.6s duration." Cooldown 45 s. Per-ability effects quoted under each ability.
- Damage for conjured spirits: "Conjured spirits and their command abilities always deal 100% of their damage potential, even when the player does not have 100% hit chance against the target." and "Conjured spirits can not perform critical hits." — https://runescape.wiki/w/Conjuration

---

## 1. Necromancy (basic attack)
URL: https://runescape.wiki/w/Necromancy_(ability)

- **type / adrenaline / cooldown / duration / channelled / GCD:** Basic (basic attack), level 1, target Single, equipment Any. Adrenaline `+9`. Cooldown `1.8` s (3 ticks). Not channelled. Triggers GCD; not usable during GCD.
  > Attack the target.
  > * 90%-110% Necromancy damage.
  > * Generates 9% Adrenaline.
  > Automatically triggered during combat.

  > It performs an attack against the target, generates 9% adrenaline, and triggers the global cooldown. By default, it is used whenever other abilities are not being cast. It can be toggled off from being used automatically in full manual and Classic combat modes. Regardless of the setting, Revolution will only trigger this ability when there are no other automatically triggered abilities available on the action bar.
- **RESOURCES:** Necrosis: none by default. "While Living Death is active, each use of this ability generates two stacks of Necrosis." Residual souls: none by default (Devourer's Guard: "each use of the ability generates one Soul Reave stack. Upon reaching four stacks, the next basic attack is empowered and generates one Residual Soul stack, consuming Soul Reave.").
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:**
  - Living Death: +2 Necrosis per use (see above).
  - Threads of Fate: "will only generate two stacks of Necrosis, regardless of how many targets are hit, when used in conjunction with Living Death" — https://runescape.wiki/w/Threads_of_Fate
  - Omni guard: "each use of the ability generates one Death Spark stack. Upon reaching five stacks, the next basic attack is empowered and deals double damage, consuming Death Spark." Death Spark page: "For 30 seconds after activating Death Essence, Touch of Death, Finger of Death and Death Skulls immediately ready Death Spark." — https://runescape.wiki/w/Death_Spark_(status)
  - Adrenaline modifiers: "Now considered to be a standard basic ability, meaning it gains +1% adrenaline from Fury of the Small and +3% adrenaline from Impatient." (update 2 March 2026). "Invigorating increases the adrenaline gained by 0.45% per rank (rounded down to the first decimal) up to 1.8% for Invigorating 4." (NOTE: https://runescape.wiki/w/Basic_attacks says instead "a specific interaction with the Invigorating perk which increases their adrenaline gain by 5% per rank. This is applied multiplicatively" — contradiction, see ambiguities.)
  - Haunted: full 10% (hit < 200%), 9.8% when Death-Spark-empowered (https://runescape.wiki/w/Command_Vengeful_Ghost).
- **REQUIREMENTS:** siphon in main hand. No stacks, no conjure.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** Necrosis (only under Living Death); Death Spark / Soul Reave stacks (weapon passives).
- **CHANNEL / multi-cast:** none.
- **OTHER:** none.

---

## 2. Touch of Death
URL: https://runescape.wiki/w/Touch_of_Death

- **type / adrenaline / cooldown / duration / channelled / GCD:** Basic, level 13, Single, equipment Any. Adrenaline `+9`. Cooldown `14.4` s (24 ticks). Not channelled. Triggers GCD.
  > Touch the target with a hand of Death.
  > * 90%-110% Necromancy damage.
  > * Generates 4 Necrosis stacks.
  > * Generates 9% Adrenaline.
- **RESOURCES:** "generates four stacks of Necrosis and 9% adrenaline." Necrosis max 12.
- **MODIFIES OTHER ABILITIES:** indirectly via Necrosis: "Necrosis stacks can be consumed by Finger of Death to reduce its adrenaline cost, or by the Death Grasp special attack to deal extra damage."
- **IS MODIFIED BY:**
  - Living Death: "While Living Death is active, Touch of Death generates an additional 6% adrenaline." and Living Death "On-cast: Resets the cooldown of Touch of Death and Death Skulls." (https://runescape.wiki/w/Living_Death)
  - "With active Living Death, Fury of the Small, and Impatient proc, Touch of Death will generate 19% adrenaline (9+6+1+3)."
  - Threads of Fate: "If Touch of Death hits multiple targets through the use of the Threads of Fate incantation, it will not generate any extra stacks."
  - Haunted: full 10%.
- **REQUIREMENTS:** siphon. No stacks/conjure needed.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** Necrosis (self, +4, no timer, max 12).
- **CHANNEL / multi-cast:** none.
- **OTHER:** none.

---

## 3. Soul Sap
URL: https://runescape.wiki/w/Soul_Sap

- **type / adrenaline / cooldown / duration / channelled / GCD:** Basic, level 54, Single, equipment **Conduit**. Adrenaline `+9`. Cooldown `5.4` s (9 ticks). Not channelled. Triggers GCD.
  > Sap the target's soul.
  > * 90%-110% Necromancy damage.
  > * Generates 1 Residual Soul stack with each hit.
  > * Generates 9% Adrenaline.
- **RESOURCES:** "Whenever a target is dealt damage by Soul Sap, it generates a Residual Soul stack". "If Soul Sap hits multiple targets (for example, if the player is under the effects of the Threads of Fate incantation), it will generate a Residual Soul stack for each enemy damaged." "targets without a health bar will not generate a Residual Soul stack." Residual Soul cap 3 (5 with soulbound lantern).
- **MODIFIES OTHER ABILITIES:** feeds Soul Strike / Volley of Souls via Residual Souls. Devourer's Guard: "For 30 seconds after activating Soul Crush, Soul Sap, Soul Strike, Volley of Souls, and Spectral Scythe immediately ready Soul Reave." (https://runescape.wiki/w/Soul_Reave)
- **IS MODIFIED BY:** Threads of Fate (one soul per target). Haunted: full 10%.
- **REQUIREMENTS:** siphon + conduit ("equipment = Conduit").
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** Residual Soul (self, +1 per target hit).
- **CHANNEL / multi-cast:** none.
- **OTHER:** the soul is generated on *hit* (damage dealt), not on cast.

---

## 4. Conjure Skeleton Warrior
URL: https://runescape.wiki/w/Conjure_Skeleton_Warrior

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 2, Self, equipment "Conduit, 1 ectoplasm". Adrenaline `0`. Cooldown `0`. Spirit duration 42 s base (70 ticks) — extended by Spirit Pact I/II/III to 48/54/60 s (see mechanics summary). Not channelled. Triggers GCD ("Your next ability will be used on tick 3").
  > Conjure a Skeleton Warrior from the Underworld.
  > * 22%-28% Necromancy Spirit damage every 3s (5 ticks).
  > * [number]s duration.
  > * Spirit.
  > Skeleton Warrior — Filled with uncontrollable anger.
  > * Generates 1 Rage stack with each attack.
  > * Damage is increased by 3% for each Rage stack.
- **RESOURCES:** consumes 1 ectoplasm ("It requires one ectoplasm to cast, which is consumed."). Rage stacks: "each attack made also grants it a Rage stack, causing each subsequent swing to deal a compounding 3% increase from this base damage, up to a maximum of 1.75x damage multiplier after 25 attacks. Attacks deal damage before a Rage stack is gained. Rage stacks do not decay or expire on their own, but are lost along with the warrior when its own duration expires." Max stacks 25 (https://runescape.wiki/w/Skeleton_Warrior_(status)).
- **MODIFIES OTHER ABILITIES:** "It replaces Command Skeleton Warrior when there are no skeletons active." i.e. while a Skeleton Warrior is active this slot becomes Command Skeleton Warrior. Occupies one conjure slot; blocks Conjure Undead Army from re-conjuring this type.
- **IS MODIFIED BY:** Spirit Pact (+6/12/18 s), Life Transfer (+21 s), Robes of the First Necromancer (+5 % duration/piece at 4-5 pieces, +7 % basic attack damage/piece at 2+), Conjurer's raising amulet (+5 %), Haunted (full 10 %), Invoke Lord of Bones (Shattering bones debuff). Unequipping the conduit dismisses it.
- **REQUIREMENTS:** siphon + conduit + 1 ectoplasm; a free conjure slot (1/2/3/4 at level 1/52/84/106); no Skeleton Warrior already active ("players cannot conjure a second spirit of the same type while one is already active" — https://runescape.wiki/w/Conjuration).
- **SHARED COOLDOWNS:** shares the action-bar slot with Command Skeleton Warrior (toggle, not a cooldown). "Any remaining cooldown of the Command ability will be carry over to the Conjure ability when the skeleton's timer expires. This does not apply if the skeleton is deconjured instantly by unequipping the equipped conduit" — https://runescape.wiki/w/Skeleton_Warrior/Hit_timings. BUT the Command page trivia says the visible cooldown "will not prevent the player from conjuring another one" — see ambiguities.
- **BUFFS/DEBUFFS applied:** "Skeleton Warrior (status)" self buff with timer + Rage stack count.
- **CHANNEL / multi-cast:** none.
- **OTHER – hit timings** (https://runescape.wiki/w/Skeleton_Warrior/Hit_timings):
  > * Your next ability will be used on tick 3 (i.e. after the global cooldown (GCD))
  > * Without Commands: First damage done by the Skeleton lands on tick 7 (This can be viewed as a 5-tick conjure animation time, then 2-tick attack animation time). Damage lands every 5 ticks thereafter (so tick 12, 17, ...)
  > * With Spirit Pact III (100 ticks duration): Without Commands, the Skeleton's last hit is tick 102. The Skeleton's duration bar vanishes at tick 105 and it begins the death animation (This can be viewed as the 100-tick duration beginning after the 5-tick conjure animation time). Conjure is available again 1 tick later (subject to GCD)

  "It moves at a running pace and has an attack range of two game squares." — https://runescape.wiki/w/Skeleton_Warrior. Default lifetime attack count: "a warrior will be able to make 14 attacks over its lifetime by default ... 20 at rank 3 [Spirit Pact]".

---

## 5. Finger of Death
URL: https://runescape.wiki/w/Finger_of_Death

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 8, Single, equipment Any. Adrenaline `-60 … 0` ("Adrenaline cost is reduced by 10% for each Necrosis stack", i.e. cost = 60 − 10 × min(stacks, 6)). Cooldown `0`. Not channelled. Triggers GCD.
  > Inflict searing pain on the target.
  > * 270%-330% Necromancy damage.
  > * Adrenaline cost is reduced by 10% for each Necrosis stack.
  > * Consumes up to 6 Necrosis stacks.
- **RESOURCES:** "It can use stacks of Necrosis generated by Touch of Death in order to reduce the adrenaline cost of the ability, reducing it to 0% adrenaline used when six stacks are consumed. Finger of Death will always consume up to six Necrosis stacks, even if the Relentless perk activates on this ability." Because stacks only come in pairs ("It is currently impossible to have an odd number of Necrosis stacks" — https://runescape.wiki/w/Necrosis) the practical costs are 60/40/20/0 % at 0/2/4/6+ stacks.
- **MODIFIES OTHER ABILITIES:** none (consumes Necrosis so Death Grasp gets less).
- **IS MODIFIED BY:**
  - Living Death: "While Living Death is active, Finger of Death deals 50% more damage. The damage bonus is applied multiplicatively, dealing 405%–495% ability damage." Living Death tooltip: "Finger of Death: Deals 1.5x damage."
  - Threads of Fate: "will only consume up to six stacks of Necrosis, regardless of how many targets are hit" — https://runescape.wiki/w/Threads_of_Fate
  - Relentless: "The relentless perk can prevent adrenaline loss for the Finger of Death ability if the player has fewer than 6 Necrosis stacks; however, the stacks will still be lost." — https://runescape.wiki/w/Relentless
  - Haunted: 6.7 % (300 % hit), 4.4 % in Living Death.
  - Death Spark (Omni guard): "For 30 seconds after activating Death Essence, Touch of Death, Finger of Death and Death Skulls immediately ready Death Spark."
- **REQUIREMENTS:** siphon; adrenaline ≥ current cost. No minimum stack requirement (usable at 0 stacks for 60 %).
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** none (consumes Necrosis).
- **CHANNEL / multi-cast:** none.
- **OTHER:** none.

---

## 6. Command Skeleton Warrior
URL: https://runescape.wiki/w/Command_Skeleton_Warrior

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 20, Single, equipment Conduit. Adrenaline `0`. Cooldown `15` s (25 ticks). Effect duration 6 s (10 ticks). Not channelled. Triggers GCD.
  > Command the Skeleton Warrior to unleash its inner rage.
  > * 22%-28% Necromancy Spirit damage per hit every 1.2s (2 ticks).
  > * 2 hits.
  > * 6s (10 ticks) duration.

  (The tooltip text above is what the wiki infobox quotes; the wiki prose and the hit-timing page describe the observed behaviour as 10 hits on consecutive ticks — use the hit-timing data for the simulator.)
  > It allows the player to command the Skeleton Warrior to attack the active target with increased speed for a total of six seconds. While commanded, the Skeleton Warrior will attack 10 times over the duration (assuming it does not need to reposition), a gain of 8 attacks compared to its normal attack speed. Each casted attack will build and be affected by Rage stacks.
- **RESOURCES:** no ectoplasm ("No ectoplasm is required when commanding the conjure." — https://runescape.wiki/w/Ectoplasm). Generates +1 Rage per command hit (10 stacks per use).
- **MODIFIES OTHER ABILITIES:** none directly. Skips the skeleton's normal attack cooldown ("using Command skips the skeleton's normal attack cooldown to make it attack at most 2 ticks after activating Command").
- **IS MODIFIED BY:** Rage stacks (3 %/stack), Haunted (full 10 %), conjure damage modifiers (see Conjuration).
- **REQUIREMENTS:** an active Skeleton Warrior ("It replaces Conjure Skeleton Warrior when a Skeleton Warrior is conjured."). First availability: "Command is first available on tick 6" after conjuring (https://runescape.wiki/w/Skeleton_Warrior/Hit_timings); Command page trivia: "Conjuring a new Skeleton Warrior will have the initial 3.6 second cooldown on the command ability."
- **SHARED COOLDOWNS:** "The 15-second cooldown of the command ability only applies to the currently conjured Skeleton Warrior. Conjuring a new Skeleton Warrior will have the initial 3.6 second cooldown on the command ability. If the command ability is used before the Skeleton Warrior despawns, the cooldown of the command ability will persist visually on top of Conjure Skeleton Warrior, but will not prevent the player from conjuring another one."
- **BUFFS/DEBUFFS applied:** none (a command duration bar appears under the conjure bar).
- **CHANNEL / multi-cast:** none.
- **OTHER – exact tick behaviour** (https://runescape.wiki/w/Skeleton_Warrior/Hit_timings):
  > * When used, text skeleton says RAAAR! and the command duration bar appears under the conjure duration bar
  > ** The skeleton begins hitting the tick following RAAAR
  > ** If it were to deal a normal attack on the RAAAR tick, it will still do so and then it will deal the 10 Command hits
  > * There are 10 hits dealt by the command, ending on the 11th tick after activating Command
  > * After these attacks, the skeleton will hit again in 2 ticks, then resume normal attack speed (every 5 ticks thereafter)
  > * Example: If the skeleton hits on tick 10 (with the normal hit on tick 7), and command is activated on tick 11, it says RAAAR on tick 12 and then hits on ticks 13,14,15,16,17,18,19,20,21,22, then resumes normal attacks on tick 24
  > * If used when the skeleton has less than its duration remaining, the skeleton will deal an attack on the tick it dies, and up to 2 ticks later.
  > *** Command is available again 25 ticks after use, but the GCD will be in effect for 2 more ticks if only non-channelled abilities are used, meaning it will be able to be used 27 ticks after previous activation

  Uses per lifetime: "By default, the command can be used three times assuming it is used promptly on cooldown ... a fourth with the Spirit Pact talents". Extra damage: "So long as the skeleton warrior eventually reaches 25 Rage stacks, the additional damage which the skeleton deals as a result of casting Command Skeleton Warrior will always equal exactly 8 fully enraged attacks, or an average of 350% ability damage."

---

## 7. Blood Siphon
URL: https://runescape.wiki/w/Blood_Siphon

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 36, Area, equipment Any. Adrenaline `0`. Cooldown `45` s (75 ticks). **Channelled**, 9 ticks (5.4 s). Triggers GCD (the channel is longer than the GCD).
  > Siphon blood from enemies before releasing a powerful attack on your target.
  > * Attack 5 times over 5.4s (9 ticks).
  > * 22%-28% Necromancy damage per hit to up to 25 enemies within 2 tiles of you.
  > * Channelled.
  > * Heals you for 70% of the damage dealt.
  > * The final attack instead deals 117%-143% Necromancy damage to the target plus 100% of the total heal value.
- **RESOURCES:** none.
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** Haunted (each hit < 200 %, full 10 %). Hit chance: "The additional damage based on healing is also reduced like other attacks if the player's hit chance is below 100%."
- **REQUIREMENTS:** siphon; a target.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** none.
- **CHANNEL rules:**
  > It is a channelled ability that deals four hits of 22–28% ability damage every 1.2 seconds to up to 25 enemies at most two game squares away that aren't the main targeted enemy. Only targets damaged by the ability will retaliate; only the final damage triggers retaliation from the main target. The user will be healed each time the ability hits an enemy, up to a possible of four heals of life points equal to 70% of the damage dealt. After the channel, the targeted enemy will be dealt 117–143% ability damage, with additional damage equalling 100% the healing that was done.

  Cancel rules: "if they were not normally aggressive, they can wander out of the player's attack range, which will immediately cancel the channelled attack. If the primary target is killed at any point during the channelled attack, the attack will also be cancelled." (Trivia.) Simulator: 4 AoE hits at 2-tick spacing (ticks 0,2,4,6 relative, or 1,3,5,7 — wiki does not specify the tick of the first hit), final hit at tick 8 (9-tick total); heal = 70 % of each AoE hit; final = 117–143 % + Σ heal.
  NOTE ambiguity: the tooltip says the AoE hits target "up to 25 enemies within 2 tiles of you", while the prose says enemies "that aren't the main targeted enemy" — see ambiguities.
- **OTHER:** "Fixed a number of issues with revolution being slow to act after finishing a channelled ability." (4 March 2024).

---

## 8. Conjure Putrid Zombie
URL: https://runescape.wiki/w/Conjure_Putrid_Zombie

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 40, Self, equipment "Conduit, 1 ectoplasm". Adrenaline `0`. Cooldown `30` s (50 ticks) — but only relevant when the zombie ends early: "The Conjure ability has a 50-tick cooldown before it can be used again - this applies if the zombie is deconjured early by unequipping the conduit, or exploded by using the Command. If it expires normally (when the timer runs out), the cooldown will have already finished so it can be used again immediately." (https://runescape.wiki/w/Putrid_Zombie/Hit_timings). Duration 42 s base. Not channelled. Triggers GCD.
  > Conjure a Putrid Zombie from the Underworld.
  > * 18%-22% Necromancy Spirit damage every 3.6s (6 ticks).
  > * [number]s duration.
  > * Spirit.
  > Putrid Zombie — Emits a fetid stench.
  > * 8%-12% Poison damage every 1.8s (3 ticks) to enemies within 1 tile.
- **RESOURCES:** 1 ectoplasm consumed.
- **MODIFIES OTHER ABILITIES:** "is replaced by Command Putrid Zombie if the player has a Putrid Zombie conjured."
- **IS MODIFIED BY:** Spirit Pact / Life Transfer / First Necromancer robes (duration & damage); poison boosted by "weapon poison, Bik arrows, Cinderbane gloves, kwuarm incense sticks, and Laniakea's spear"; "The poison from the putrid zombie will trigger as long as the player is in a combat stance, and does not need a target." Haunted applies fully to poison ("Typeless damage sources are not reduced by damage mitigation and receive the full effect of the Haunted debuff, such as the Putrid Zombie's poison damage" — Conjuration page).
- **REQUIREMENTS:** siphon + conduit + 1 ectoplasm, free conjure slot, no Putrid Zombie active, conjure cooldown not running.
- **SHARED COOLDOWNS:** action-bar slot shared with Command Putrid Zombie.
- **BUFFS/DEBUFFS applied:** "Putrid Zombie (status)" self buff (timer). NOTE the status page still says "By default 45 seconds" — outdated; the ability page update history says "Base Duration reduced to 42s (-3 seconds)" (23 Oct 2023) and the NPC page says "it will disappear after 42 seconds".
- **CHANNEL / multi-cast:** none.
- **OTHER – hit timings** (https://runescape.wiki/w/Putrid_Zombie/Hit_timings):
  > * First damage done by the Zombie lands on tick 7 (5-tick conjure animation time, then 2-tick attack animation time). Damage lands every 6 ticks thereafter (so tick 13, 19, ...)
  > * The first poison hit occurs on tick 9, and every 3 ticks thereafter (12, 15, 18, ...)
  > * With Spirit Pact III (100 ticks duration): The Zombie's last hit is tick 103. The Zombie will deal poison damage on tick 105 and 108. The Zombie's duration bar vanishes at tick 105 and it begins the death animation

  Default: "a zombie will be able to make 12 attacks over its lifetime by default ... and will poison enemies 24 times ... 16 attacks and 33 poisons ... at rank 3."

---

## 9. Conjure Vengeful Ghost
URL: https://runescape.wiki/w/Conjure_Vengeful_Ghost

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 40, Self, equipment "Conduit, 1 ectoplasm". Adrenaline `0`. Cooldown `0` ("The Conjure can be used again immediately, even if the Ghost is deconjured early by unequipping the conduit." — https://runescape.wiki/w/Vengeful_Ghost/Hit_timings). Duration 42 s base. Not channelled. Triggers GCD.
  > Conjure a Vengeful Ghost from the Underworld.
  > * 18%-22% Necromancy Spirit damage every 4.2s (7 ticks).
  > * [number]s duration.
  > * Spirit.
  > Vengeful Ghost — Drains the vigour of enemies.
  > * Heals you for 140% of the damage dealt.
- **RESOURCES:** 1 ectoplasm.
- **MODIFIES OTHER ABILITIES:** "It is replaced by Command Vengeful Ghost if there is a Vengeful Ghost already conjured."
- **IS MODIFIED BY:** Spirit Pact / Life Transfer / robes; Haunted increases its own damage and therefore healing ("The Haunted debuff does increase the healing capability that the Vengeful Ghost can do, as do all other damage increasing effects, such as vulnerability."); "Healing now happens on-hit, as opposed to on-attack" (23 Oct 2023). Devourer's Nexus: "If the ghost is summoned while under the effects of the Devourer's Nexus, the ghost's attacks will no longer heal the player." "The Vengeful Ghost will continue to heal the player when attacking targets that nullify its damage."
- **REQUIREMENTS:** siphon + conduit + 1 ectoplasm, free slot, no Vengeful Ghost active.
- **SHARED COOLDOWNS:** slot shared with Command Vengeful Ghost.
- **BUFFS/DEBUFFS applied:** "Vengeful Ghost (status)" self buff (timer). (Status page text "175%" and "30 seconds" is outdated; current values 140 % / 42 s per ability + NPC pages and update history "Base duration: 30s -> 42s", "Heal value: 125% -> 140%".)
- **CHANNEL / multi-cast:** none.
- **OTHER – hit timings** (https://runescape.wiki/w/Vengeful_Ghost/Hit_timings):
  > * First damage done by the Ghost lands on tick 6 (5-tick conjure animation time, then 1-tick attack animation time). Damage lands every 7 ticks thereafter (so tick 13, 20, ...)
  > * With Spirit Pact III (100 ticks duration): The Ghost's last hit is tick 104. The Ghost's duration bar vanishes at tick 105

  Default "10 attacks over its lifetime ... 14 attacks at rank 3".

---

## 10. Bloat
URL: https://runescape.wiki/w/Bloat ; debuff: https://runescape.wiki/w/Bloated

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 48, Single, equipment Any. Adrenaline `-20`. Cooldown `0`. DoT duration: 10 hits every 3 ticks (Bloat page: "19.8-second duration"; Bloated page: "18 seconds"). Not channelled. Triggers GCD.
  > Bloat the target, causing them to take damage over time.
  > * 135%-165% Necromancy damage.
  > * Applies Bloated to the target for 10 hits.
  > Bloated — Swollen from the inside.
  > * 25% of initial damage per hit every 1.8s (3 ticks).
  > * Damage over time.
  > * On-death: Applies Bloated to up to 9 enemies within 1 tile for 4 hits.
- **RESOURCES:** none.
- **MODIFIES OTHER ABILITIES:** none. (No wiki rule links Bloat to Command Skeleton Warrior or Soul Strike; the only documented interactions are with Haunted and Split Soul, below.)
- **IS MODIFIED BY:**
  - Re-activation: "Bloated will not hit between a back-to-back activations of the Bloat ability and its 19.8-second duration will be reset."
  - Crits: "If the initial hit is a critical strike, the damage over time hits will deal corresponding damage. However, they will not be critical strikes." "The base damage for Bloated is calculated after applying the critical strike damage boost, before any on-npc effects are applied. Any effects that apply on-npc will stop applying if the effect disappears or will start applying if added after bloated has been applied. Any effects that do not apply on-npc will affect the initial hit of Bloat, and thereby the damage over time portion, but will not apply individually to the damage over time hits."
  - Threads of Fate: "the damage from the initial hit will vary on other targets but the subsequent damage over time they suffer will be 25% of the initial hit on the main target."
  - Haunted: "all the hits are affected individually, so if the target is only Haunted for some of the hits, then only those hits will gain the damage increase." (https://runescape.wiki/w/Command_Vengeful_Ghost)
  - Freedom (target's): Bloated is "Removed upon activating Freedom or eating numbing root" (https://runescape.wiki/w/Bloated; Freedom page lists Bloated under "Removeable damage-over-time effects").
- **REQUIREMENTS:** siphon, 20 % adrenaline.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** Bloated (target debuff, no stacks, no timer icon; 10 hits × 25 % of initial hit every 3 ticks; refresh-on-recast; on-death spreads "with the same damage to up to nine enemies within one game square for four hits"; "May spread to further enemies on death even from the target that wasn't the primary target of Bloat.").
- **CHANNEL / multi-cast:** none.
- **OTHER:** total "472.5%–577.5% (average 525%) ability damage" over the full duration; "Bloat does not heal Nex during her blood phase."

---

## 11. Soul Strike
URL: https://runescape.wiki/w/Soul_Strike

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 54, Area, equipment Any. Adrenaline `0`. Cooldown `0`. Stun/bind 5 ticks (3 s). Not channelled. Triggers GCD.
  > Strike the target with a residual soul.
  > * 135%-165% Necromancy damage.
  > * Stuns and Binds the target for 3s (5 ticks).
  > * 90%-110% Necromancy damage to up to 9 enemies within 1 tile of the target.
- **RESOURCES:** "It uses one stack of Residual Soul on activation". Residual Soul page: "Residual soul stacks can be consumed one at a time by Soul Strike".
- **MODIFIES OTHER ABILITIES:** none (reduces souls available to Volley of Souls). Devourer's Guard: Soul Strike readies Soul Reave for 30 s after Soul Crush.
- **IS MODIFIED BY:** Flanking: "With the Flanking perk, Soul Strike loses its bind and stun property against targets that face away from the player in exchange for increased damage." Haunted: full 10 % without Flanking; "Rank 1 in the perk will start to cap damage against the primary target, and rank 3 or higher will start to cap damage against secondary targets."
- **REQUIREMENTS:** siphon; **at least 1 Residual Soul** (the wiki says it "uses one stack of Residual Soul on activation" — it does not state the exact behaviour with 0 stacks; treat as unusable at 0 stacks — see ambiguities). Does NOT require a conduit (equipment Any).
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** Stunned + Bound on primary target, 3 s (removed / prevented by the target's Freedom/Anticipation per general stun rules). "All targets hit by this ability will become aggressive."
- **CHANNEL / multi-cast:** none.
- **OTHER:** none.

---

## 12. Command Putrid Zombie
URL: https://runescape.wiki/w/Command_Putrid_Zombie

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 60, Area, equipment Conduit. Adrenaline `0`. Cooldown `0`. Explosion lands 4 ticks after activation. Not channelled. Triggers GCD.
  > Command the Putrid Zombie to explode.
  > * 360%-440% Necromancy Spirit damage to enemies within 2 tiles.
- **RESOURCES:** none; **kills the zombie** ("killing the zombie in the process"; status "Removed if Command Putrid Zombie is activated").
- **MODIFIES OTHER ABILITIES:** Conjure Putrid Zombie goes onto its 50-tick cooldown (measured from the conjure cast): "Conjure ability is on cooldown for 20 ticks" when the explosion occurs on tick 30 after conjuring; "Conjure ability can be used" at tick 64 when exploded on tick 64 (https://runescape.wiki/w/Putrid_Zombie/Hit_timings). Ends the zombie's auto-attacks and poison.
- **IS MODIFIED BY:** Haunted 5.0 % (400 % hit); conjure damage modifiers; ability damage snapshot at conjure time.
- **REQUIREMENTS:** active Putrid Zombie ("It replaces Conjure Putrid Zombie when a Putrid Zombie is active."). "Command is first available on tick 6" after conjuring. "Ability can now be cast without a target." (23 Oct 2023).
- **SHARED COOLDOWNS:** slot shared with Conjure Putrid Zombie.
- **BUFFS/DEBUFFS applied:** none. "Monsters hit by this ability will attack the player even if they weren't already doing so."
- **CHANNEL / multi-cast:** none.
- **OTHER – tick rules** (https://runescape.wiki/w/Putrid_Zombie/Hit_timings):
  > * Immediately upon use, the zombie will no longer move, even if you teleport away
  > * Three ticks after use, the zombie says Gah!! or Blueeurghh!
  > * The following tick the explosion occurs: dealing damage, removing the buff bar icon, and the zombie vanishes
  > * When the command is activated, the zombie will no longer attack (except if an attack happened on the tick the command was activated). Poison hits will continue up until (and including) the tick of the zombie's chat message
  > * If the command is activated at the very end of the zombie's timer, the normal death tick is ignored - the command will take priority and the zombie will explode after it would normally deconjure

  Ability page: "After activating this ability, the zombie can no longer move and explodes after 2.4 seconds."

---

## 13. Command Vengeful Ghost
URL: https://runescape.wiki/w/Command_Vengeful_Ghost ; debuff: https://runescape.wiki/w/Haunted

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 60, Single, equipment Conduit. Adrenaline `0`. Cooldown `0`. Effect lasts for the ghost's remaining lifetime ("Removed the 30 second duration, now making the effect active for the spirit's lifetime." 30 Oct 2023). Not channelled. Triggers GCD.
  > Command the Vengeful Ghost to haunt your enemies.
  > * Applies Haunted to the target with each attack for 4.8s (8 ticks).
  > Haunted
  > * Takes up to 10% bonus damage from all attacks, capped at [number] (20%) Necromancy damage.
- **RESOURCES:** none.
- **MODIFIES OTHER ABILITIES:** via Haunted on the target: "Every hit to that target deals up to 10% extra damage, with the extra damage capped at 20% of the commanding player's ability damage." "The extra damage is not reduced if the player has less than 100% accuracy; the full extra damage is added to the attacks." "The Haunted status is not player-specific." Applied "at the end of all damage calculations" (Conjuration page). Per-ability effective bonus (average hit → % increase): basic attack/ToD/Soul Sap/Soul Strike/all conjures/Bloat/Volley/Blood Siphon hits: full 10 %; Death-Spark basic & Scythe cast 2 (200 %): 9.8 %; Death Skulls per hit & Scythe cast 3 (250 %): 8.0 %; Finger of Death (300 %): 6.7 %; Command Putrid Zombie (400 %): 5.0 %; FoD in Living Death (450 %): 4.4 %; Death Grasp 4.4 %/2.2 %.
- **IS MODIFIED BY:** The Devourer's Nexus: "increases the damage boost from 10% to 15%, and increases the cap for this damage from 20% to 30% of ability damage, at the cost that the wearer does not heal from attacks made by their vengeful ghost."
- **REQUIREMENTS:** active Vengeful Ghost ("replacing Conjure Vengeful Ghost when a Vengeful Ghost has been conjured"). "Command is first available on tick 6."
- **SHARED COOLDOWNS:** slot shared with Conjure Vengeful Ghost.
- **BUFFS/DEBUFFS applied:** Haunted on the ghost's target, re-applied on each ghost hit. Duration: "There is a discrepancy with the duration of Haunted. The tooltip states a duration of 4.8, but it has an effective duration of 3.6 seconds. However, due to the Vengeful Ghost attacking every 4.2 seconds, the Haunted status will have 100% uptime." (Simulator: 6-tick debuff refreshed every 7 ticks ⇒ effectively permanent while the ghost hits.) Not stacking; not player-specific.
- **CHANNEL / multi-cast:** none.
- **OTHER – timing** (https://runescape.wiki/w/Vengeful_Ghost/Hit_timings): "The following tick, the Ghost says ... and future attacks will apply Haunted. The Ghost's normal attack timing is unaffected regardless of when the Command is used." Table: command used on tick 6 (ghost's first hit, no Haunted), Haunted first applied with the hit on tick 13.

---

## 14. Spectral Scythe
URL: https://runescape.wiki/w/Spectral_Scythe ; recast buff: https://runescape.wiki/w/Spectral_Scythe_(status)

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, Area, equipment Any. Cast 1: level 62, adrenaline `-10`, cooldown `15` s (25 ticks). Cast 2: level 70 (talent "Spectral Scythe Upgrade 1"), adrenaline `-20`, cooldown `0`. Cast 3: level 80 (talent "Spectral Scythe Upgrade 2"), adrenaline `-30`, cooldown `0`. Not channelled. Each cast triggers the GCD.
  > Cast 1: Swipe a spectral scythe in front of you.
  > * 72%-88% Necromancy damage to the target and up to 9 additional enemies in a cone in the attack direction.
  > * 25% chance to generate 1 Residual Soul stack.
  > * Can be recast within 15s (25 ticks) of the previous cast.
  > Cast 2: Spin around wildy with a spectral scythe.
  > * 180%-220% Necromancy damage to the target and up to 25 additional enemies within 2 tiles of you.
  > * On-hit: 25% chance to generate 1 Residual Soul stack.
  > Cast 3: Strike from above, shattering spectral energy around you.
  > * 225%-275% Necromancy damage to the target and up to 25 additional enemies within 2 tiles of you.
  > * Damage is increased by 0%-100% based on enemy's missing life points.
- **RESOURCES:** Residual Souls: "It also has a 25% chance to generate a stack of Residual Soul for each target hit even if a conduit is not equipped." Cast 2: "This second attack also has 25% chance per target hit to generate a stack of Residual Soul even if a conduit is not equipped." Cast 3: no soul generation.
- **MODIFIES OTHER ABILITIES:** none. Devourer's Guard: Spectral Scythe readies Soul Reave for 30 s after Soul Crush.
- **IS MODIFIED BY:** Haunted (cast 1 full 10 %, cast 2 9.8 %, cast 3 8.0 %). Cast 3: "the damage is increased by 1% for every 1% life points that the target has below their maximum life points. This increase is added multiplicatively to the resulting damage; for instance, a monster that has 50% of their maximum life points remaining will be dealt 337.5%–412.5% ability damage."
- **REQUIREMENTS:** siphon; cast 2 requires the Upgrade-1 talent + cast 1 within the previous 15 s; cast 3 requires the Upgrade-2 talent + cast 2 within the previous 15 s.
- **SHARED COOLDOWNS:** casts 2 and 3 do not have their own cooldown; the 25-tick cooldown starts at cast 1 ("Improved the recast functionality so that the cooldown for the ability is applied on first cast." 11 Sept 2023).
- **BUFFS/DEBUFFS applied:** "Spectral Scythe (status)" self buff: "Your Spectral Scythe ability is empowered and can be recast." Trigger: "Activating Spectral Scythe cast 1 or cast 2 with the 1st or 2nd upgrade unlocked respectively"; duration "15 seconds"; effect "Allows the activation of the next cast of Spectral Scythe". All targets "will become aggressive".
- **CHANNEL / multi-cast rules:** 3-cast sequence, strictly 1 → 2 → 3; each subsequent cast must be within 15 s (25 ticks) of the previous cast ("Increased the expiration duration for recasts from 5.4s to 15s."). After cast 3 (or after the window expires) the ability reverts to cast 1, which is on its 25-tick cooldown counted from cast 1. Cast 1: "Activating it causes the player to move within two game squares of the primary target and deal 72%–88% necromancy damage to the target and up to nine additional enemies in a three-by-three game square area centred one game square away in the direction the player is facing".
- **OTHER:** trivia: "Under some circumstances the buff remains on the buff bar even after the 15 seconds have run out and a subsequent cast of Spectral Scythe isn't available."

---

## 15. Volley of Souls
URL: https://runescape.wiki/w/Volley_of_Souls

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 66, Single, equipment Any. Adrenaline `0`. Cooldown `0`. Not channelled. Triggers GCD.
  > Send a volley of residual souls towards the target.
  > * 135%-165% Necromancy damage for each Residual Soul stack.
- **RESOURCES:** "Stacks of Residual Soul are spent in order to activate it, and 135%–165% Necromancy damage is dealt for each stack of Residual Soul consumed when activating the ability. It requires at least two stacks of Residual Souls to activate." Consumes ALL stacks (Residual Soul page: "consumed all at once by Volley of Souls"). Damage table: 2 → 270–330 %, 3 → 405–495 %, 4 → 540–660 %, 5 → 675–825 %.
- **MODIFIES OTHER ABILITIES:** none. Devourer's Guard: readies Soul Reave for 30 s after Soul Crush.
- **IS MODIFIED BY:** Soulbound lantern: "Equipping a soulbound lantern increases the cap for Residual Soul stacks to five, increasing the maximum damage of Volley of Souls." Haunted: "each individual hit is only 135%–165% ability damage. As such, it gets the full benefit of the Haunted debuff." (each soul is a separate hit). PvP: "it deals 55% as much damage." Threads of Fate: listed as a single-target ability that is copied to 4 additional targets.
- **REQUIREMENTS:** siphon; **≥ 2 Residual Souls**.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** none (consumes Residual Soul).
- **CHANNEL / multi-cast:** none.
- **OTHER:** none.

---

## 16. Conjure Phantom Guardian
URL: https://runescape.wiki/w/Conjure_Phantom_Guardian ; stacks: https://runescape.wiki/w/Valour ; status: https://runescape.wiki/w/Phantom_Guardian_(status)

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 70, Self, equipment "Conduit, 1 ectoplasm". Adrenaline `0`. Cooldown `0`. Duration: tooltip "1m duration"; status page "duration = 60 seconds". Not channelled. Triggers GCD.
  > Conjure a Phantom Guardian from the Underworld.
  > * 1m duration.
  > * Spirit.
  > Phantom Guardian — Protects against harm.
  > * Reduces damage taken from core damage types by up to 5%, capped at 10% of the player's ability damage.
  > * Generates 1 Valour stack with each incoming hit.
- **RESOURCES:** 1 ectoplasm. Valour: "The Phantom Guardian generates one stack for each hit taken by the player up to a maximum of 25 stacks. Unlike the damage reduction effect of the phantom guardian, Valour stacks are not restricted to hits of core damage types." "Hits which are dodged do not generate Valour." "Any source of stacks which is used within 5 ticks of conjuring the phantom [does not give Valour], as the buff is not yet active." Self-damage, poison, blocked hits, typeless hits all give Valour (list on the Valour page).
- **MODIFIES OTHER ABILITIES:** "is replaced by Command Phantom Guardian if there is a Phantom Guardian already conjured."
- **IS MODIFIED BY:** Spirit Pact / Life Transfer / robes (the wiki does not explicitly confirm whether the "1m" already includes Spirit Pact III — see ambiguities).
- **REQUIREMENTS:** siphon + conduit + 1 ectoplasm, free slot, no Phantom Guardian active.
- **SHARED COOLDOWNS:** slot shared with Command Phantom Guardian.
- **BUFFS/DEBUFFS applied:** "Phantom Guardian (status)" self buff with Valour count: "Reduces incoming damage from core types by up to 5%, capped at 10% of the player's ability damage" — "This damage reduction only applies to core damage types: melee, ranged, magic, and necromancy. It does not apply to typeless damage."
- **CHANNEL / multi-cast:** none.
- **OTHER:** "Unlike other conjured spirits the phantom does not have an auto attack".

---

## 17. Command Phantom Guardian
URL: https://runescape.wiki/w/Command_Phantom_Guardian

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 80, Single, equipment Conduit. Adrenaline `0`. Cooldown `9` s (15 ticks). Hit lands 4 ticks (2.4 s) after activation. Not channelled. Triggers GCD.
  > Command the Phantom Guardian to blast the target with its shield.
  > * 45%-55% Necromancy Spirit damage to the target and up to 4 additional enemies within 1 tile of the target.
  > * Damage is increased by 20% for each Valour stack.
  > * Consumes all Valour stacks.
- **RESOURCES:** consumes all Valour: "Damage is increased by 20% of the hit (not 20% ability damage) for each Valour stack, which will be consumed by the ability. A maximum of 25 Valour stacks can be gained, which increases the damage of this ability to 270%–330% ability damage." "The stacks are consumed on command cast, but the Phantom Guardian cannot gain more stacks until it has finished its attack." (Valour page)
- **MODIFIES OTHER ABILITIES:** none.
- **IS MODIFIED BY:** Valour stacks; conjure damage modifiers; Haunted.
- **REQUIREMENTS:** active Phantom Guardian ("replacing Conjure Phantom Guardian when a Phantom Guardian is active"). Can be used without a target: "If the player does not have a target when activating this ability, a progress bar will appear over the phantom's head which lasts 6 seconds. If a target is found before the progress bar ends, the phantom will then attack the target."
- **SHARED COOLDOWNS:** slot shared with Conjure Phantom Guardian.
- **BUFFS/DEBUFFS applied:** none. "Monsters hit by this ability will attack the player even if they weren't already doing so before."
- **CHANNEL / multi-cast:** none.
- **OTHER:** "The damage from the phantom will hit 2.4 seconds after activating this ability." Does NOT end the phantom (unlike Command Putrid Zombie).

---

## 18. Conjure Undead Army
URL: https://runescape.wiki/w/Conjure_Undead_Army

- **type / adrenaline / cooldown / duration / channelled / GCD:** Enhanced, level 99, Self, equipment "Conduit, 2–8 ectoplasm". Adrenaline `0`. Cooldown `0`. Not channelled. Triggers GCD (once for all conjures).
  > Conjure an Undead Army from the Underworld.
  > * Casts up to [number] conjure abilities.
  > * Consumes 2x Ectoplasm for each ability.
- **RESOURCES:** "It requires and consumes twice the ectoplasm cost of each individual conjure ability to activate." ("When using Conjure Undead Army, each conjure requires double the amount of ectoplasm." — Ectoplasm page). Only the conjures actually cast are charged.
- **MODIFIES OTHER ABILITIES:** casts the selected individual conjures simultaneously: "It conjures up to four spirits in the same way as the individual abilities (Conjure Skeleton Warrior, Conjure Putrid Zombie, Conjure Vengeful Ghost, and Conjure Phantom Guardian)." "When the player activates this ability, the spirits selected in the Undead Army customisation interface are conjured at the same time. If all of the selected spirits are currently conjured, the ability cannot be used. If some of the selected spirits are currently conjured, it only conjures the ones that are not, saving the ectoplasm cost of those conjures that are skipped." After use, the individual slots flip to their Command versions as normal.
- **IS MODIFIED BY:** conjure slot count: "Level 106 Necromancy is required to conjure all four spirits, as only three slots are available upon unlocking at level 99."
- **REQUIREMENTS:** siphon + conduit; at least one selected spirit not currently active; enough ectoplasm (2 per spirit conjured); enough free conjure slots (max active conjures 3 at 84–105, 4 at 106+). Talent tier 7 (35,000 souls).
- **SHARED COOLDOWNS:** none of its own. Individual conjure cooldowns still apply (e.g. Putrid Zombie's 50-tick cooldown after an early explosion — the hit-timing page notes Undead Army makes precise re-conjuring at tick 105 "much easier").
- **BUFFS/DEBUFFS applied:** the individual conjure status buffs.
- **CHANNEL / multi-cast:** none.
- **OTHER:** hit timings of each conjure are as for the individual abilities (all start on the same tick 0).

---

## 19. Death Skulls
URL: https://runescape.wiki/w/Death_Skulls

- **type / adrenaline / cooldown / duration / channelled / GCD:** Ultimate, level 28, Multi, equipment Any. Adrenaline `-60` (since 2 March 2026: "Adrenaline: -100% → -60%"). Cooldown `60` s (100 ticks); **17 ticks (10.2 s) during Living Death**. Not channelled. Triggers GCD. Skull bounce sequence continues independently after the cast.
  > Launch a flurry of skulls at the target.
  > * 225%-275% Necromancy damage per hit.
  > * Bounces between enemies within 6 tiles of each other up to 4 times (disabled in PvP).
  > Prioritises enemies with higher maximum life points. If there are no enemies nearby it will bounce to the caster dealing no damage.

  With igneous Kal-Mor / igneous Kal-Zuk: "Bounces between enemies within 6 tiles of each other up to 6 times (disabled in PvP)".
- **RESOURCES:** none.
- **MODIFIES OTHER ABILITIES:** none. (Death Spark: "For 30 seconds after activating Death Essence, Touch of Death, Finger of Death and Death Skulls immediately ready Death Spark.")
- **IS MODIFIED BY:**
  - Living Death: "While Living Death is activated, Death Skulls has its cooldown reset and reduced to 17 ticks." Living Death page: "Death Skulls: Cooldown reduced to 10.2s (17 ticks)." and "On-cast: Resets the cooldown of Touch of Death and Death Skulls."
  - Igneous Kal-Mor / Kal-Zuk: "wearing it causes Death Skulls to bounce 2 additional times (from 4 bounces to 6 bounces) when used against monsters." Kal-Mor no longer changes adrenaline cost ("Adrenaline cost reduction effect to Death Skulls removed (Death Skulls now always costs 60% adrenaline)." 2 March 2026 — https://runescape.wiki/w/Igneous_Kal-Mor).
  - Haunted: 8.0 % per hit; "It can hit the primary target up to 3 times (4 with an Igneous cape), for a total increase of 60% ability damage (80% with an Igneous cape)."
- **REQUIREMENTS:** siphon; 60 % adrenaline.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** none. "Monsters hit by the skulls after bouncing will become aggressive towards the player."
- **CHANNEL / multi-cast:** "Using Death Skulls again while the skulls from a previous use are still bouncing will not override nor cancel it out; a player may have more than one active Death Skulls at the same time."
- **OTHER – bounce mechanics:**
  > It is a multi-target ability that fires skulls that bounces up to four times after the initial hit, for a maximum of five hits, when used against monsters. Death Skulls can bounce to the player if there are no other targets, and no damage is dealt to the player. In a single-target scenario, the skulls will hit the monster a maximum of three times (monster, player, monster, player, and monster once more). Death Skulls behaves similar to Bloat, the damage of each bounce will be 100% of the initial hit of Death Skulls. This means if the initial hit was a critical hit, the remaining hits will also be critical hits.

  Targeting: "it looks for all potential targets within 6 tiles of the previous target, and uses the following prioritisation: 1. Monsters which are not immune to damage (If there are multiple monsters in range, the one with the highest life points will be selected) 2. The player (no damage is dealt to the player) 3. Monsters which are immune to damage. If there are no new targets within range of the previous target, then Death Skulls will stop bouncing."
  Speed: "when bouncing 0–5 tiles away, there is a 1.2-second (two game ticks) delay per bounce. When bouncing for the full six tiles, there is a 1.8-second (three game ticks) delay per bounce."
  Damage totals: "up to 675%–825% (900%–1,100% with igneous Kal-Mor) ability damage to a single target if the player is in range" (i.e. 3 hits, or 4 with Kal-Mor: 7 total hits → monster/player/monster/player/monster/player/monster). With one lower-LP secondary: "675%–825% ... to the main target and 450%–550% (675%–825% with igneous Kal-Mor) to any secondary targets." PvP: "it will deal the initial hit but will not bounce."

---

## 20. Living Death
URL: https://runescape.wiki/w/Living_Death ; status: https://runescape.wiki/w/Living_Death_(status)

- **type / adrenaline / cooldown / duration / channelled / GCD:** Ultimate, level 76, Self, equipment Any. Adrenaline `-100`. Cooldown `90` s (150 ticks). Duration **30 s = 50 ticks**. Not channelled. Triggers GCD.
  > Master your instincts and transcend into a Death form.
  > * Basic Attack: Generates 2 Necrosis stacks.
  > * Touch of Death: Generates an additional 6% Adrenaline.
  > * Finger of Death: Deals 1.5x damage.
  > * Death Skulls: Cooldown reduced to 10.2s (17 ticks).
  > * 30s (50 ticks) duration.
  > * On-cast: Resets the cooldown of Touch of Death and Death Skulls.
- **RESOURCES:** none itself; enables Necrosis from the basic attack (+2 per use, max 12).
- **MODIFIES OTHER ABILITIES (verbatim):**
  > * Necromancy (ability) generates 2 Necrosis stacks per use
  > * Touch of Death generates 6% extra adrenaline
  > * Finger of Death deals 50% extra damage (multiplicative)
  > * Death Skulls has its cooldown reduced to 10.2 seconds
  > Additionally, upon casting Living Death, Touch of Death and Death Skulls have their cooldown reset, allowing for their immediate use.

  Concretely for the simulator:
  - ON CAST: `ToD.cooldown = 0`, `DeathSkulls.cooldown = 0` (immediately available; still subject to the 3-tick GCD started by Living Death itself and to the 60 % adrenaline cost — Living Death drains to 0 %, so Death Skulls needs adrenaline to be rebuilt first).
  - WHILE ACTIVE (50 ticks): Death Skulls cooldown after each use = 17 ticks instead of 100; Finger of Death damage ×1.5 (405–495 %); Touch of Death adrenaline 9 % + 6 %; basic attack +2 Necrosis (also only 2 total under Threads of Fate).
  - Nothing on the wiki says Living Death changes Necrosis caps, Residual Souls, Soul Sap, Bloat, Spectral Scythe, Volley of Souls, conjures or commands.
- **IS MODIFIED BY:** "Living Death can be ended early due to some teleports and by other means, but the message indicating its end will not be received until its original expiration time." "Some teleports like the Max guild Teleport are restricted while under the effects of Living Death."
- **REQUIREMENTS:** siphon; 100 % adrenaline.
- **SHARED COOLDOWNS:** none.
- **BUFFS/DEBUFFS applied:** "Living Death" self buff (timer, no stacks). End message: "Your undead instinct fades."
- **CHANNEL / multi-cast:** none.
- **OTHER:** "Disassemble cannot be used while under the effects of Living Death." Status page still shows "Cooldown reduced to 12s" (old 20-tick value) — outdated.

---

## Necromancy mechanics summary

### Necrosis (https://runescape.wiki/w/Necrosis)
- Self buff, stacks, no timer, priority 60. "Max stacks: 12". "Players are able to have a maximum of 12 stacks at once." "It is currently impossible to have an odd number of Necrosis stacks."
- Sources: "Activating the Touch of Death ability grants four stacks." "Activating Necromancy auto attack under the effect of Living Death grants two stacks." "The passive effect of the occultist's ring grants Necromancy attacks a 10% chance to generate two stacks with each cast."
- Consumers: "Enhances Finger of Death by reducing its adrenaline cost by 10% per necrosis stack, consuming up to six stacks." "Enhances the Death Grasp special attack by dealing an additional 40% Necromancy damage per stack, consuming all stacks." (Death Grasp: tier 70+ death guard spec, 25 % adrenaline, 30 s cooldown, 405–495 % + 40 %/stack, stun/bind 8 ticks — https://runescape.wiki/w/Death_Grasp)
- Duration: "Until consumed with the Finger of Death ability or Death Grasp special attack. Certain teleports clear all the stacks."
- Threads of Fate never multiplies Necrosis generation/consumption.

### Residual Soul (https://runescape.wiki/w/Residual_Soul)
- Self buff, stacks, **has a timer**: "Six seconds outside of combat" (stacks persist indefinitely in combat, drop 6 s after leaving combat).
- Cap: "Residual Souls are normally capped at three stacks. Soulbound lantern increases the cap by two." Removing the lantern: "removing the soulbound lantern by any means will drop the held residual souls to three."
- Sources: Soul Sap (1 per target hit; none on targets without a health bar); Spectral Scythe cast 1 & 2 (25 % per target hit, no conduit needed); Zorgoth's soul ring (5 % per necromancy hit); Devourer's Guard Soul Reave (empowered basic attack).
- Consumers: Soul Strike (1 stack), Volley of Souls (all stacks, min 2), Soul Crush (Devourer's Guard spec, 2–5 stacks).
- "Residual souls are retained when switching between different conduits, switching from a conduit to a physical necromancy shield, as well as unequipping both necromancy weapons."

### Conjures (https://runescape.wiki/w/Conjuration)
- Need siphon + conduit to conjure; "Unequipping a conduit will immediately dismiss any active conjured spirits." Switching to an Underworld-Connection shield keeps them but cannot conjure more.
- Slots: "players can only have 1 conjured spirit active at a time. This limit increases to 2 conjured spirits at level 52 Necromancy, 3 at level 84, and 4 at level 106. Despite the limit being increased, players cannot conjure a second spirit of the same type while one is already active."
- Ectoplasm: 1 per conjure (2 each via Undead Army), 0 for commands.
- Base duration 42 s (70 ticks) for Skeleton Warrior, Putrid Zombie, Vengeful Ghost; Phantom Guardian tooltip "1m". Spirit Pact I/II/III: +6/+12/+18 s ("Spirit Pacts I, II and III do not stack with each other; the highest unlocked tier overrides the other tiers." → 48/54/60 s = 80/90/100 ticks). Life Transfer: +21 s to each active spirit (self-damage 50 % base LP, 75 s cooldown, needs an active spirit). Robes of the First Necromancer: +5 %/piece duration at 4–5 pieces "applied after the effects of Spirit Pact" (72 s / 75 s with SP III).
- Timing: 5-tick conjure animation; the duration bar (100 ticks with SP III) starts after it; deconjure on tick 105; the caster's next ability on tick 3 (GCD). Skeleton first hit tick 7 then every 5; Zombie first hit tick 7 then every 6, poison from tick 9 every 3; Ghost first hit tick 6 then every 7. Command abilities first available on tick 6.
- Damage: "Conjured spirits scale off the player's necromancy ability damage at the time of being summoned, this ability damage is applied to the conjures and their respective command abilities throughout their lifespan." Always 100 % hit chance, cannot crit, do not trigger Soul Split, not boosted by prayers; boosted by Haunted, Vulnerability, slayer effects, Eruptive/Equilibrium, Conjurer's raising amulet (+5 %), FN robes (+7 %/piece at 2+).
- Targeting: "Conjured spirits will target enemies that the player is currently targeting and they will stop attacking if Cease is cast." Teleport to the player at ≥ 16 tiles.
- Conjure-ability cooldowns: Skeleton 0 (Command's remaining cooldown carries over visually), Putrid Zombie 50 ticks from cast (only matters when exploded/deconjured early), Vengeful Ghost 0, Phantom Guardian 0.

### Cross-ability rules (WHEN condition THEN effect)
1. WHEN Living Death is cast THEN Touch of Death cooldown := 0 AND Death Skulls cooldown := 0 (https://runescape.wiki/w/Living_Death).
2. WHEN Living Death is active (50 ticks) AND Death Skulls is used THEN Death Skulls cooldown := 17 ticks instead of 100 (https://runescape.wiki/w/Living_Death, https://runescape.wiki/w/Death_Skulls).
3. WHEN Living Death is active AND Finger of Death hits THEN damage ×1.5 (405–495 %), multiplicative (https://runescape.wiki/w/Finger_of_Death).
4. WHEN Living Death is active AND Touch of Death is used THEN adrenaline gain = 9 % + 6 % (https://runescape.wiki/w/Touch_of_Death).
5. WHEN Living Death is active AND Necromancy basic attack is used THEN Necrosis += 2 (cap 12) (https://runescape.wiki/w/Necromancy_(ability)).
6. WHEN Touch of Death is used THEN Necrosis += 4 (cap 12); under Threads of Fate still only +4 (https://runescape.wiki/w/Touch_of_Death).
7. WHEN Finger of Death is used THEN cost = 60 % − 10 % × min(Necrosis, 6) AND Necrosis −= min(Necrosis, 6), even if Relentless procs or Threads of Fate hits several targets (https://runescape.wiki/w/Finger_of_Death, https://runescape.wiki/w/Relentless).
8. WHEN Death Grasp (death guard spec) is used THEN +40 % damage per Necrosis stack AND all Necrosis consumed (https://runescape.wiki/w/Necrosis).
9. WHEN Soul Sap damages a target with a health bar THEN Residual Soul += 1 per target hit (cap 3, or 5 with soulbound lantern) (https://runescape.wiki/w/Soul_Sap).
10. WHEN Spectral Scythe cast 1 or cast 2 hits a target THEN 25 % chance per target of Residual Soul += 1 (https://runescape.wiki/w/Spectral_Scythe).
11. WHEN Soul Strike is used THEN Residual Soul −= 1 (requires ≥ 1) (https://runescape.wiki/w/Soul_Strike).
12. WHEN Volley of Souls is used THEN requires Residual Soul ≥ 2, consumes all, one hit of 135–165 % per soul consumed (https://runescape.wiki/w/Volley_of_Souls).
13. WHEN the soulbound lantern is removed AND Residual Soul > 3 THEN Residual Soul := 3 (https://runescape.wiki/w/Residual_Soul).
14. WHEN the player leaves combat for 6 s THEN Residual Souls expire (https://runescape.wiki/w/Residual_Soul).
15. WHEN Conjure X is used THEN the slot shows Command X for the spirit's lifetime; WHEN the spirit expires/is dismissed THEN the slot reverts to Conjure X (all four Conjure/Command pages).
16. WHEN Command X is pressed THEN requires spirit X active; Command X first available 6 ticks after the conjure cast (Skeleton/Zombie/Ghost hit-timing pages).
17. WHEN Command Skeleton Warrior is used THEN skeleton performs 10 hits on the 10 consecutive ticks after the "RAAAR!" tick (which is the tick after activation), then hits 2 ticks later, then every 5 ticks; Command cooldown 25 ticks, valid only for the current skeleton; a new skeleton starts with a 6-tick initial command cooldown (https://runescape.wiki/w/Command_Skeleton_Warrior, https://runescape.wiki/w/Skeleton_Warrior/Hit_timings).
18. WHEN Command Putrid Zombie is used THEN zombie stops moving/attacking, poison continues through activation+3, explosion 360–440 % within 2 tiles at activation+4, zombie removed, Conjure Putrid Zombie available at max(now, conjureTick+50) (https://runescape.wiki/w/Putrid_Zombie/Hit_timings).
19. WHEN Command Vengeful Ghost is used THEN from the next ghost hit onward every ghost hit applies Haunted (6-tick effective, 8-tick tooltip) for the rest of the ghost's life; Haunted: +10 % damage on every hit to that target from any player source, extra capped at 20 % of commander's ability damage (15 %/30 % with Devourer's Nexus) (https://runescape.wiki/w/Command_Vengeful_Ghost).
20. WHEN Command Phantom Guardian is used THEN Valour := 0, hit at activation+4 ticks of 45–55 % × (1 + 0.2 × Valour), to target + up to 4 within 1 tile; cooldown 15 ticks; phantom survives (https://runescape.wiki/w/Command_Phantom_Guardian).
21. WHEN the player takes a (non-dodged, hitsplat-producing) hit AND a Phantom Guardian has been active for > 5 ticks THEN Valour += 1 (max 25) (https://runescape.wiki/w/Valour).
22. WHEN Conjure Undead Army is used THEN each selected spirit that is not currently active is conjured (2 ectoplasm each); unusable if all selected spirits are active; max 3 selected at level 99–105, 4 at 106+ (https://runescape.wiki/w/Conjure_Undead_Army).
23. WHEN the conduit is unequipped THEN all conjures are dismissed immediately (https://runescape.wiki/w/Conjuration).
24. WHEN Spectral Scythe cast 1 is used THEN 25-tick cooldown starts AND cast 2 becomes available for 25 ticks (with Upgrade 1); WHEN cast 2 is used THEN cast 3 becomes available for 25 ticks (with Upgrade 2); WHEN cast 3 is used or a window expires THEN the ability reverts to cast 1 (still on its cooldown) (https://runescape.wiki/w/Spectral_Scythe, https://runescape.wiki/w/Spectral_Scythe_(status)).
25. WHEN Spectral Scythe cast 3 hits a target with missing LP fraction m THEN damage × (1 + m), up to ×2 (https://runescape.wiki/w/Spectral_Scythe).
26. WHEN Bloat is re-cast on a Bloated target THEN Bloated resets to 10 hits/full duration and no DoT tick lands between the two casts (https://runescape.wiki/w/Bloat).
27. WHEN a Bloated target dies THEN up to 9 enemies within 1 tile receive Bloated with the same per-hit damage for 4 hits; can chain further (https://runescape.wiki/w/Bloated).
28. WHEN Bloat's initial hit crits THEN each DoT tick = 25 % of the crit-boosted hit, DoT ticks themselves never crit (https://runescape.wiki/w/Bloat).
29. WHEN the target uses Freedom (or numbing root) THEN Bloated is removed (https://runescape.wiki/w/Bloated, https://runescape.wiki/w/Freedom).
30. WHEN Death Skulls is used THEN initial hit + up to 4 bounces (6 with igneous Kal-Mor/Kal-Zuk), each bounce = 100 % of the initial hit (crit carried), 2-tick delay per bounce (3 ticks at exactly 6 tiles), target priority non-immune highest-max-LP > player (0 dmg) > immune; single target: 3 hits (4 with Kal-Mor) (https://runescape.wiki/w/Death_Skulls).
31. WHEN Death Skulls is cast while previous skulls are still bouncing THEN both instances continue (https://runescape.wiki/w/Death_Skulls).
32. WHEN in PvP THEN Death Skulls does not bounce, Volley of Souls deals 55 %, Death Grasp 40 % (respective pages).
33. WHEN Blood Siphon's primary target dies or leaves attack range during the channel THEN the channel is cancelled (no final hit) (https://runescape.wiki/w/Blood_Siphon).
34. WHEN Blood Siphon completes THEN final hit = 117–143 % + 100 % of the total healed during the channel (heal = 70 % of each of the 4 AoE hits) (https://runescape.wiki/w/Blood_Siphon).
35. WHEN Threads of Fate is active THEN single-target Necromancy abilities (basic attack, ToD, FoD, Bloat, Soul Sap, Volley of Souls, specs) also hit up to 4 extra enemies within 4 tiles; resource rules per abilities above (https://runescape.wiki/w/Threads_of_Fate).
36. WHEN the Omni guard is equipped THEN each basic attack gives 1 Death Spark; at 5 the next basic attack deals ×2 and consumes Death Spark; for 30 s after Death Essence, ToD/FoD/Death Skulls immediately ready Death Spark (https://runescape.wiki/w/Death_Spark_(status)).
37. WHEN the Devourer's Guard is equipped THEN each basic attack gives 1 Soul Reave; at 4 the next basic attack generates 1 Residual Soul; for 30 s after Soul Crush, Soul Sap/Soul Strike/Volley/Spectral Scythe immediately ready Soul Reave (https://runescape.wiki/w/Soul_Reave).
38. WHEN Living Death is active THEN Death Skulls is NOT automatically free of adrenaline cost — it still costs 60 % (no wiki rule says otherwise) and Living Death itself drains adrenaline to 0 on cast.

### Ambiguities / discrepancies on the wiki (for the simulator author)
1. **Death Skulls cooldown in Living Death:** Jagex patch notes (2 March 2026) say "reduced from 12 seconds to 9 seconds while inside Living Death" (= 15 ticks), but every ability page (Living Death, Death Skulls) says "20 ticks → 17 ticks" (10.2 s), and the Living Death (status) page still says 12 s. The 17-tick value appears to be wiki-verified post-update behaviour; the 9 s in the patch notes may be a Jagex rounding/typo. Recommend 17 ticks, with a config flag.
2. **Invigorating on the basic attack:** Necromancy (ability) page says +0.45 % per rank (max 1.8 %); the Basic attacks page says +5 % per rank multiplicative (max 15.6 % with FotS + Impatient). Contradiction — pick one and flag.
3. **Bloated duration:** Bloat page says 19.8 s (10 hits every 1.8 s after the initial hit → last hit at 18 s; 19.8 s if counted from the cast), Bloated page says 18 s. Tick model: hits at +3, +6, …, +30 ticks after the initial hit.
4. **Blood Siphon AoE hits and the main target:** tooltip says the 4 hits go "to up to 25 enemies within 2 tiles of you" while the prose says "enemies ... that aren't the main targeted enemy" and "only the final damage triggers retaliation from the main target". Whether the main target is also hit by the 4 small hits is not stated unambiguously. The exact tick of the first AoE hit within the 9-tick channel is not given.
5. **Command Skeleton Warrior tooltip vs behaviour:** infobox description reads "22%-28% ... per hit every 1.2s, 2 hits, 6s duration" but the prose and the hit-timing table say 10 hits on consecutive ticks over 10 ticks. Use the hit-timing table.
6. **Conjure Skeleton Warrior after Command cooldown:** hit-timing page says "Any remaining cooldown of the Command ability will be carry over to the Conjure ability when the skeleton's timer expires", but the Command page trivia says the cooldown "will persist visually on top of Conjure Skeleton Warrior, but will not prevent the player from conjuring another one." Treat as visual only (conjure allowed).
7. **Soul Strike at 0 Residual Souls:** the wiki says it "uses one stack ... on activation" but never states explicitly that it cannot be cast with 0 stacks. Most likely it is greyed out; treat ≥ 1 stack as a requirement.
8. **Phantom Guardian duration:** tooltip "1m" / status "60 seconds" — unclear whether that is the base (42 s + Spirit Pact III = 60 s like the other spirits) or a genuine 60 s base. The other three spirits are documented as 42 s base.
9. **Outdated status pages:** Putrid Zombie (status) says 45 s, Vengeful Ghost (status) says 30 s / 175 %, Skeleton Warrior (status) says "1 % ability damage per Rage stack", Living Death (status) says Death Skulls 12 s — all superseded by the ability/NPC pages (42 s, 140 %, 3 % multiplicative, 17 ticks).
10. **Necromancy abilities overview page** is template-generated (AbilityList); the per-ability infoboxes above are the authoritative numbers.

---

## Addendum (2026-09-04): bone shields and nexuses

Sources: https://runescape.wiki/w/Lesser_Bone_Shield, https://runescape.wiki/w/Greater_Bone_Shield, https://runescape.wiki/w/Nexuses, https://runescape.wiki/w/Zemouregal%27s_nexus, https://runescape.wiki/w/Incantations (raw wikitext, fetched 2026-09-04).

### Lesser Bone Shield (level 25) / Greater Bone Shield (level 73)
- Ability text: "Surround yourself with a whirlwind of bones. - Applies a level [number] (25% Necromancy) Bone Shield to self. - Togglable." (Greater: "(50% Necromancy)") and "Bone Shield - Allows the use of non-offensive abilities that require a shield, at the cost of necromancy runes."
- Infobox: `cooldown = None`, type Combat, incantations "activate the player's global cooldown" (Incantations page) – abilities.json has `triggersGcd: true` for both.
- Duration: "The buff will remain on until the player toggles it off by deactivating either bone shield ability, even if the player logs out." – a toggle without timer; the two replace each other.
- Tier: Lesser = 25 % of the Necromancy level rounded down ("equivalent to a mithril kiteshield at level 120" = tier 30); Greater = "50% of their Necromancy level, rounded down" (level 120 = tier 60, "dragon kiteshield tier").
- "Players which have a Zemouregal's nexus equipped will receive a 15 tier boost to their Bone Shield." – Zemouregal's nexus passive *Fortified Bones*: "increases the level of Bone Shield by 15" once worn for 9 seconds (Greater at 120: 75; Lesser at 120: 45).
- Abilities enabled: Debilitate, Resonance, Divert, Barricade, Preparation, Reflect, Immortality, Rejuvenate. "Bash and Revenge cannot be used" – they are "classed as 'offensive'". Scaling abilities (Barricade, Debilitate duration) use the bone shield tier; Reflect, Immortality, Rejuvenate do not scale ("players using only non-scaling abilities … should use Lesser Bone Shield instead to conserve runes").
- Runes: every activation / shield-ability cast costs runes (Lesser 5 spirit + 5 bone; Greater 10 spirit, 10 bone, 5 flesh); "No runes consumed if an actual shield is equipped".
- Works with every combat style.

### Nexuses
- "Nexuses are worn in the ammunition slot" (gear.json: `deathwarden-nexus` T60, `zemouregal-s-nexus` T80, `the-devourer-s-nexus` T80, all `slot: "ammo"`). They "store ectoplasm and necrotic runes" like a rune pouch; a nexus "does not have to be equipped to use its contents", only for its passive. The wiki nowhere requires a nexus for the bone shields – they need runes, which may sit in the backpack.

### Trainer model (src/app/engine/rules-necromancy.ts, trainer-engine.ts)
- `lesser-bone-shield` / `greater-bone-shield`: GCD incantations with `toggle-buff` effects (mutually exclusive, no timer). BuffDef `shieldTierShare` 0.25 / 0.5; tier = ⌊share × 99⌋ (+15 with Zemouregal's nexus – `ResolvedLoadout.boneShieldLevelBonus`); the trainer assumes level 99 like engine/damage.ts, so Lesser = 24, Greater = 49 (39 / 64 with the nexus).
- `requirementMet`: a `shield` / `defender-or-shield` requirement is met by an active bone shield unless the requirement is `offensive` (Bash, Revenge). `ResolvedLoadout.hasNexus` is recorded (ammunition slot) but not required, following the wiki.
- `TrainerEngine.shieldTier`: the worn shield (defender half) wins, else the bone shield tier – used by `durationByShieldTier` (Barricade 8 + ⌊t/10⌋, Debilitate 14 + ⌊t/10⌋).
- Enemy attacks: Barricade (`absorbs: 'all'`) blocks every attack while active; Disruption Shield, Resonance and Divert (`absorbs: 'next'`) block one attack and are removed, in that priority. Absorbed attacks are counted in `prayerStats.absorbed`, not as hits.
