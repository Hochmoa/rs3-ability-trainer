# RS3 Weapon Special Attacks & Essence of Finality — Research

State: **3 September 2026** (post Combat Style Modernisation of 2 March 2026 and the 9/16 March refinement patches).
Source: https://runescape.wiki (MediaWiki API + raw wikitext, User-Agent `rs3-ability-trainer/0.2`).
All quotes are verbatim from the wiki; each is followed by its URL.

Companion research files: `mechanics.md`, `melee.md`, `ranged.md`, `magic.md`, `necromancy.md`, `defence-constitution.md` in this folder.

---

## 1. Mechanics

### 1.1 Two abilities trigger specs: "Weapon Special Attack" and "Essence of Finality"

Both are **Constitution abilities** (level 1, `type = Special`, `cooldown = 0`, `adrenaline = Varies`). Neither has a per-weapon icon — the icon is always the ability's own icon.

> "**Weapon Special Attack** is a Constitution ability that can only be used when specific weapons that have a special attack are equipped. It requires level 1 Constitution to use. The effect and adrenaline cost vary from weapon to weapon."
> "Essence of Finality, which requires the Essence of Finality amulet, is a more powerful version of this ability, allowing special attacks of the weapon stored in the amulet to be used with any weapon of the same style."
> — https://runescape.wiki/w/Weapon_Special_Attack (ability id 28430, icon `File:Weapon Special Attack.png`)

> "To activate Weapon Special Attack, a weapon that possesses a special attack must be equipped. The ability is found in the Powers interface in the Constitution abilities tab. When wielding a weapon that has a special attack, the name of the ability changes to the name of the special attack for that weapon; however, the icon will always be the same. The player can also click on the adrenaline bar on the Action bar to activate a special attack. It is also possible to designate a keybind for Weapon Special Attack in the options menu, which does not occupy any slot on any action bar. Special Attacks cannot be automatically activated by Revolution."
> — https://runescape.wiki/w/Weapon_Special_Attack

> "**Essence of Finality** is a basic Constitution ability. It is usable if the player has an equipped Essence of Finality amulet or its ornamental counterpart with a stored special attack."
> "The ability allows the player to use the special attack of whichever weapon has been stored inside the amulet. It will still require the same amount of adrenaline as is necessary for the regular weapon. Like the Weapon Special Attack ability, Revolution will not automatically trigger the Essence of Finality, and the adrenaline cost can be reduced with a ring of vigour, asylum surgeon's ring, and the Relentless perk."
> "The ability cannot be used in player killing situations."
> — https://runescape.wiki/w/Essence_of_Finality (ability id 11748, icon `File:Essence_of_Finality.png`)

`Special attack` is a redirect to `Weapon Special Attack` (https://runescape.wiki/w/Special_attack → `#REDIRECT [[Weapon Special Attack]]`).

Specs that need **no target** can be fired from the ability button / action bar (since 23 Nov 2020):
> "Special attacks that require no target can now be activated using the Constitution special attack ability from both the Ability Book and the Action Bar. The Zaros Godsword and the Eldritch Crossbow have been added to the list of weapons that can be activated without a target. The full list is as follows: Staff of Light, Staff of Darkness, Dragon Battleaxe, Zaros Godsword, Eldritch Crossbow"
> — https://runescape.wiki/w/Weapon_Special_Attack#Update_history

### 1.2 Adrenaline: requirement == cost (with exceptions), ring of vigour = 90 %

> "Each special attack requires a certain amount of adrenaline to use, which is also consumed on use. For example, the Korasi's sword's special attack, Disrupt, may only be used at 60% adrenaline, and once it is used, 60% adrenaline is drained."
> — https://runescape.wiki/w/Weapon_Special_Attack

> "The ring of vigour reduces both the adrenaline needed to perform a special attack and the final amount of adrenaline that is drained by 10%."
> — https://runescape.wiki/w/Weapon_Special_Attack

> "When using a Weapon Special attack, there is a 10% discount to the adrenaline cost of the ability. For example, a special attack that normally requires 50% adrenaline to activate would only require 45% adrenaline with the ring equipped. This also applies to special attacks used via the Essence of Finality."
> "When the weapon special attack is used, it only requires 90% of the normally required adrenaline or special attack energy."
> — https://runescape.wiki/w/Ring_of_vigour (the effect can be made permanent with a warped gem after *Extinction*; "does not stack with an equipped ring of vigour"; "stacks additively with Conservation of Energy")

Requirement-vs-cost split exists for **Icy Tempest** (Dark Shard of Leng):
> "Adrenaline cost is reduced by 12% for each Primordial Ice stack. ** Adrenaline requirement is unchanged." … "The special attack will not cost any adrenaline when consuming 3 or more stacks of Primordial Ice."
> — https://runescape.wiki/w/Icy_Tempest

Refunds/generation on specs: Reap ("On killing blow: Generates 20% adrenaline"), Igneous Showdown ("Generates 15% Adrenaline" vs Flamebound Rival, 30 % under Natural Instinct).

Old "40 % chance to save 25 % of a special attack's cost" on the asylum surgeon's ring was **replaced** on 2 March 2026 by "10% chance to reduce the adrenaline cost of abilities by 15%" (https://runescape.wiki/w/Combat_Style_Modernisation#Multiple_styles_changes).

### 1.3 Cooldowns

Default: none.
> "Unless stated otherwise, there are no cooldowns for using special attacks; the current exceptions that do have cooldowns between uses of special attacks are the special attacks of:
> * Abyssal vine whip (19.8 seconds) * Dark Shard of Leng (15 seconds) * Ek-ZekKil (60 seconds) * Fractured Staff of Armadyl (60 seconds) * Seren godbow (30 seconds) * Staff of darkness (90 seconds) * Zaros godsword (60 seconds) * Death guard (30 seconds) * Omni guard (60 seconds) * Roar of Awakening (45 seconds) * Devourer's Guard (60 seconds) * Tumeken's Light (60 seconds)"
> — https://runescape.wiki/w/Weapon_Special_Attack

Bucket `cooldown` values agree for all of these **except**: Vine Call (`cooldown = 0` in the infobox, but the page text says "The special attack has a 19.8s cooldown." — https://runescape.wiki/w/Vine_Call) and Power of Darkness (`cooldown = 0` in the infobox; the WSA page says 90 s and the Staff of darkness update history mentions "The Staff of darkness cooldown is now cleared when entering a duel or dying"). Treat both as having the cooldown from the prose (19.8 s / 90 s).

Since 3 Oct 2022 there is no hidden internal cooldown:
> "Special attacks no longer have an internal cooldown matching the player's attack speed. This allows special attacks to be cast back-to-back when using slow weapons."
> — https://runescape.wiki/w/Weapon_Special_Attack#Update_history

Cooldown special cases:
- Crystal Rain: "If the attack is successful, there is a 30 second cooldown before it may be used again. If the attack misses due to damage potential below 1%, then the arrows will not fall, but no cooldown penalty is incurred" — https://runescape.wiki/w/Crystal_Rain
- Instability: "The special attack does not grant its critical strike effect in PvP scenarios but does not go on cooldown either." — https://runescape.wiki/w/Instability
- Igneous Showdown: "The cooldown for this special attack is governed by the Igneous Strike debuff." — https://runescape.wiki/w/Igneous_Showdown
- Death Grasp: cooldown "shown in a Death guard (status) debuff" — https://runescape.wiki/w/Death_Grasp
- Blackhole: "This attack has a 60 seconds cooldown." (Blackhole cooldown debuff) — https://runescape.wiki/w/Blackhole
- Soulfire: "The Essence Corruption effect may activate on Soulfire, dealing all of its damage immediately and refreshing its cooldown." — https://runescape.wiki/w/Soulfire
- Altar of War resets spec cooldowns: "they can pray at the Altar of War to reset the cooldown of all abilities, Weapon Special Attacks, incantations…" — https://runescape.wiki/w/Cooldown

**Weapon spec and EoF spec of the same weapon share the cooldown; EoF itself has no cooldown** (`cooldown = 0` in its infobox):
> "Wielding a physical copy of the same weapon currently stored within an equipped Essence of Finality amulet does not permit the player to use the special attack twice in a row, as either one will trigger its cooldown, if applicable."
> — https://runescape.wiki/w/Template:Essence_of_Finality_details (transcluded on https://runescape.wiki/w/Essence_of_Finality_amulet)

### 1.4 Global cooldown behaviour

> "The global cooldown, frequently shortened to "GCD", is the 3-tick (1.8-second) cooldown which starts every time a player begins to use a spell or ability … Some abilities and spells are not affected by the global cooldown, and do not trigger the global cooldown when used … These types of abilities are often referred to as "Can be cast during the global cooldown.""
> — https://runescape.wiki/w/Cooldown#Global_cooldown

Specs are normal abilities on the GCD. The **only** spec whose description carries "Can be cast during the global cooldown." is **Quick Smash** (granite maul):
> "Quick Smash is the special attack of the granite maul. It costs 50% adrenaline and instantly strikes the opponent for 115-135% ability damage, ignoring any cooldowns."
> — https://runescape.wiki/w/Quick_Smash
> "Fixed an issue that prevented the Granite Maul special attack from being used during global cooldown if stored inside an Essence of Finality." (29 Nov 2021)
> — https://runescape.wiki/w/Essence_of_Finality#Update_history

Channelled specs (tick-based): Aimed Shot ("300-360% Ranged damage after 3s (5 ticks). Channelled."), Tempest of Armadyl ("5 hits … every 0.6s (1 tick). Channelled."). Multi-tick non-channelled specs: Slice & Dice, Draconic Puncture, Sweep, Shadowfall, Descent of Darkness, Crystal Rain (arrow 1 lands one tick before 2–5), The Final Flurry, Igneous Showdown (all 4 hits "in one tick").
> "Players can no longer use an Essence of Finality to cast a channelled weapon special attack, then switch to another Essence of Finality with a different weapon's special attack to trigger that on the same global cooldown cycle."
> — https://runescape.wiki/w/Essence_of_Finality#Update_history (24 Aug 2020)
> "If the amulet is unequipped during the channelled special attack that is stored within the amulet, the special attack will not finish and only deal part of its damage while still consuming the usual amount of adrenaline required for the special attack."
> — https://runescape.wiki/w/Essence_of_Finality

### 1.5 Style requirement — EoF needs a weapon of the *same style* in hand

> "The same style has to be used. For instance, ranged special attacks only work while wielding ranged weapons."
> "Please note that the special attack can only be used while wielding a weapon of the same style. For example, the Statius's warhammer's special attack, Smash, can only be used while wielding melee-classed weapons, and the Seren godbow's special attack, Crystal Rain, can only be used while wielding ranged-classed weapons."
> — https://runescape.wiki/w/Template:Essence_of_Finality_details
> "An issue where special attacks could be used with mismatched attack styles through the Essence of Finality amulet has been resolved." (7 Sep 2020)
> — https://runescape.wiki/w/Essence_of_Finality#Update_history
> "The player needs appropriate ammo to use their weapon in order to use the weapon special attacks stored within the amulet. For example, the player will need ammo to use their crossbow or bow, and runes to cast spells."
> — https://runescape.wiki/w/Essence_of_Finality

Which weapon slot matters: a spec is tied to the **main-hand** weapon at cast time (Split Soul: "it is tied to the weapon in the main hand slot when the special attack has been cast … the weapon in the off-hand slot can be swapped out"; Locate: "Switching one's main-hand or two-handed weapon while under the effect of Locate will end the effect."; Death Essence / Soul Crush: "Swapping main-hand weapons (even to another Omni guard) will remove the … buff."). Self-buffs that *persist* through weapon/amulet swaps: Power of Light / Power of Darkness ("will persist even when the player swaps or removes their essence of finality or weapons"), Blackhole ("the damage-boosting effect of the special attack is not lost when the player switches weapons"), Balance by Force ("will persist when the bow is unequipped"), Instability ("unequipping the staff does not remove the self-buff"), Rampage (1 min). Gravitate is cleared "if you switch out your weapon".

### 1.6 How EoF stores a spec

> "the amulet has a special ability to store the Weapon Special Attack from any weapon in the game with one (provided that the player meets the requirements to wield said weapon), which can then be used via the Essence of Finality ability unlimited times during combat, without degrading the amulet."
> — https://runescape.wiki/w/Essence_of_Finality_amulet

> "* Players need to permanently sacrifice a weapon to store its special attack within the amulet.
> ** Augmented weapons can be used, but the perks won't carry over. (equipment separators can be used to salvage expensive perk gizmos.)
> ** Special attack weapons don't need to be fully charged to be sacrificed. This even applies to degrade-to-dust weapons like the Statius's warhammer or augmented superior Statius's warhammer.
> ** Any special attack can be stored and replaced with a new special attack, but the previous weapon will not be returned.
> * The damage and accuracy of the special attack are based on the player's current weapons, not the weapon sacrificed.
> * The same style has to be used. For instance, ranged special attacks only work while wielding ranged weapons.
> * The player can own multiple amulets with multiple special attacks stored within them. Dyeing the amulets can help with distinguishing multiple amulets with different special attacks, and ensure bank presets and action bars function in a consistent way.
> * If the player swaps an Essence of Finality amulet to a different one, the stacks and benefits provided from the initial special attack effect are not lost.
> * If the player swaps an Essence of Finality amulet with any other type of amulet, the stacks and benefits are lost."
> — https://runescape.wiki/w/Template:Essence_of_Finality_details

So: **one spec per amulet**, storing consumes the weapon permanently, style is *not* agnostic (the stored spec's style must match the wielded weapon's style), it is unusable in PvP ("The amulet's special attack cannot be used against other players in a player killing scenario"), and "Using the special attack does not consume any amulet charges." Dye/ornament kit never affects the stored spec. Tier of the *sacrificed* weapon is irrelevant — damage scales with the wielded weapon ("the Saradomin godsword special will deal 185%–215% ability damage of the currently wielded weapon").

Halberd-range / MSoA interactions when cast via EoF (https://runescape.wiki/w/Essence_of_Finality#Equipment-specific_interactions): Vine Call 3x3→5x5, Powerstab 5x5→7x7, Sweep 2x3→3x3, Spear Wall 3x3→5x5, Disrupt 3x3→5x5 with halberd-type weapons — **but** Vine Call's own page contradicts this ("The special attack's area of effect damage will not be increased to 5x5 if used from an Essence of Finality amulet with a halberd-type weapon. The special attack's duration will not be extended if used from an Essence of Finality amulet with a Masterwork Spear of Annihilation."), and Icy Tempest says the same ("will not be increased to 5x5"). Chinchompas / Locate AoE carries over to most ranged specs (table on the EoF ability page; exceptions: Chain Hit, Locate itself).

### 1.7 What changed on 2 March 2026 (Combat Style Modernisation) for specs

https://runescape.wiki/w/Combat_Style_Modernisation and https://runescape.wiki/w/Update:Patch_Notes:_Part_1_-_Combat_Style_Modernisation

- Mechanics unchanged: specs still use adrenaline, still cannot be Revolution-triggered, still keyed by WSA / EoF. The "threshold" type was removed for melee/ranged/magic but specs were never thresholds.
- **Melee specs got damage buffs** ("Most special attacks main effects are the same, with the damage numbers altered (usually increased).") — patch-note averages: Dark Shard of Leng 110→125 % / AoE 165→190 %; Ek-ZekKil 250→280 % / secondary 225→255 %; Tumeken's Light 260→295 %; Varanus's Mercy 75→90 % / 150→165 %; Statius's warhammer 150→170 %; Dragon claws 360→400 %; Dragon halberd 125→140 %; Dragon longsword 270→295 %; Dragon mace 230→260 %; Dragon scimitar 230→260 %; Armadyl godsword 400→440 %; Bandos godsword 220→245 %; Saradomin godsword 175→200 %; Zamorak godsword 175→200 %; Saradomin sword 175→200 %; Rune claws 120→140 %; Granite maul 110→125 %; Keenblade 140→160 %. Also Abyssal whip 55-65→75-85 %, Ancient mace 110-130→125-145 %, Barrelchest anchor 110-130→125-145 %, Bone dagger 130-150→150-170 %, Brine sabre/Brackish blade 110-130→125-145 %, Darklight 55-65→75-85 %, Dragon dagger 110-140→125-155 % x2, Korasi's 200-240→230-270 %, Vesta's longsword 230-270→255-295 %, Vesta's spear 90-110→105-125 %.
- Explicitly **not changed**: Abyssal vine whip, Annihilation, Dragon 2h sword, Dragon battleaxe, Dragon harpoon, Dragon/Crystal hatchet, Dragon/Zamorakian spear, Lava whip, Noxious scythe, Zaros godsword ("Things not changed" list).
- **Magic**: "No magic special attacks were changed in the initial update. The fractured staff of Armadyl's special attack was slightly reduced in power in the 9 March patches." (Lightning Surge 90-110 % → 80-100 %; the Instability infobox currently shows 70-90 % — see ambiguities.)
- **Ranged**: "Only one ranged special attack was altered in the update." Decimation/Locate: "Ranged attacks will also be cast on up to 9 targets within 1 tile of the target" → "up to 5 targets within 3 tiles of the target".
- **Necromancy**: no spec changes (only Death Skulls / Living Death / basic-attack classification).
- Cross-style: Asylum surgeon's ring spec-cost saving removed (see 1.2). Wen arrows: "Once you reach 10 stacks, the next enhanced ability, ultimate ability, or special attack consumes all 10 stacks to gain Icy Precision for 15 ticks" (+30 % base damage / hit chance for those). Ultimatums perk no longer touches adrenaline cost.
- 9 March 2026: EoF amulet damage bonus 56.0 → 55.7 ("the Essence of Finality amulet in particular was reduced slightly").
- All weapons unified to 3-tick attack speed — relevant to legacy per-speed spec maths only; Classic Mode "Adrenaline is still replaced by Special Attack Energy … 10% every 30 seconds" and "There is currently no way to use a special attack stored in the amulet while in Legacy Combat Mode."

---

## 2. Complete table of weapon special attacks

Data: Bucket `infobox_weapon_special_attack` (78 rows, dumped 3 Sep 2026) + spec pages. 78 rows = 76 unique spec pages (Mirrorback has 3 rows, one per Noxious weapon) of which **1 is removed (Igneous Cleave)** → **75 current specs / 77 current (weapon, style) rows**.

Column notes:
- *Adren* = requirement = cost unless noted. *CD* from bucket `cooldown` (0 = none) — corrected where prose differs.
- *Buff* = `buff` infobox param (page name of the status) + duration from the description.
- *Dmg* = bucket `damage` (average ability damage, post-CSM).
- *EoF* = can be stored/used via Essence of Finality. The wiki documents **no negative list**: "store the Weapon Special Attack from any weapon in the game with one". `Yes*` = additionally listed in the EoF "Recommended weapons" table (`Template:Essence_of_Finality_details`) or the EoF ability's ranged interaction table. Notes give documented EoF caveats.
- *Icon* = bucket `image` (this is the **weapon** icon; there is no per-spec icon — the ability icon is always `File:Weapon Special Attack.png` / `File:Essence of Finality.png`). Buff icons listed where the `infobox_buff` bucket has one.
- Variants = other members of `Category:Weapons that have special attacks` (augmented / dyed / lucky / golden / Dominion Tower / superior) matched to the base weapon — they use the same spec.

### 2.1 Melee (35 rows)

| Spec (page) | Weapon(s) | Variants | Adren | CD | Buff / duration | Dmg | Effect | EoF | Icon (File:) | Removed |
|---|---|---|---|---|---|---|---|---|---|---|
| Aimed Strike | Keenblade | – | 35 % | – | – | 160 % | 150-170 % melee; hit chance +20 %. | Yes | Keenblade.png | no |
| Armadyl's Judgement | Armadyl godsword | Augmented/Golden/Lucky AGS | 50 % | – | – | 440 % | Single hit 400-480 % melee. | Yes* | Armadyl godsword.png | no |
| Backstab | Bone dagger | – | 75 % | – | 1 m debuff | 160 % | 150-170 %; +100 % hit chance if target not attacking you; target Defence −8 %, base hit chance +2 (1 m). | Yes | Bone dagger.png | no |
| Blackhole | Zaros godsword | Augmented ZGS, dyed (Aurora/Barrows/Soul/Third Age/blood/ice/shadow) + augmented dyed | 50 % | **60 s (100 t)** | Blackhole (status), 19.8 s (33 t); "Blackhole cooldown" debuff | 440 % | 7x7 area at your location; melee attacks ×1.25 inside; target takes 35-45 % every 3 t (max 11 hits). **Interaction:** "If the player is under the effects of Berserk, and then uses the special attack, Berserk's damage-boosting properties will take priority." — used to alternate with Berserk; buff persists on weapon switch; needs no target. | Yes | Zaros godsword.png | no |
| Clobber | Dragon hatchet, Crystal hatchet | Augmented both | 30 % | – | 1 m debuff | 100 % | 90-110 %; target Defence −5 %, Magic −5 %, Magic damage −10 %; base hit chance +3. | Yes* | Dragon hatchet.png, Crystal hatchet.png | no |
| Disrupt | Korasi's sword | Augmented, (Dominion Tower) | 60 % | – | – | 250 % | 230-270 % **Magic** damage to target + up to 9 within 1 tile ("calculated based entirely on Strength and melee damage modifiers, like Berserk"). 5x5 with halberd via EoF. | Yes | Korasi's sword.png | no |
| Draconic Blow | Dragon mace, Superior dragon mace | – | 20 % | – | – | 260 % | 240-280 % melee (hit chance +25 % per CSM table). | Yes* | Dragon mace.png, Superior dragon mace.png | no |
| Draconic Cleave | Dragon longsword, Superior dragon longsword | – | 25 % | – | – | 295 % | 275-315 % melee. | Yes* | Dragon longsword.png, Superior dragon longsword.png | no |
| Draconic Puncture | Dragon dagger, Superior dragon dagger | – | 50 % (EoF table says 25 %) | – | – | 280 % | 2 hits of 125-155 %; hit chance +15 %. | Yes* | Dragon dagger.png, Superior dragon dagger.png | no |
| Draconic Slash | Dragon scimitar, Superior dragon scimitar | – | 50 % | – | 1 m self-buff | 260 % | 240-280 %; hit chance +25 %; +25 % hit chance with Slash weapons for 1 m. | Yes | Dragon scimitar.png, Superior dragon scimitar.png | no |
| Energy Drain | Abyssal whip | dyed (blue/green/white/yellow), Augmented, Lucky | 50 % | – | – | 80 % | 75-85 %; PvP: drains 100 % run energy. | Yes | Abyssal whip.png | no |
| Favour of the War God | Ancient mace | (Dominion Tower), Superior ancient mace | 100 % | – | – | 135 % | 125-145 %; restores Prayer = 10 % of damage; PvP: ignores protection prayers, drains prayer. | Yes | Ancient mace.png | no |
| Feint | Vesta's longsword, Superior Vesta's longsword | Augmented superior | 25 % | – | – | 275 % | 255-295 %; hit chance +75 %. | Yes | Vesta's longsword.png, Superior Vesta's longsword.png | no |
| Fishstabber | Dragon harpoon | Augmented | 100 % | – | self | 0 % | "Increases your Fishing stat by 3." (skilling gag; self-target) | Yes (not useful) | Dragon harpoon.png | no |
| Get Over Here! | Lava whip | Augmented | 75 % | – | – | 0 % | Stun + bind 6 s (10 t); PvP: pulls target from 10 tiles. | Yes | Lava whip.png | no |
| Gravitate | Annihilation | Augmented | 60 % | – | Gravitate Active (id 34984), 30 s (50 t), max 20 stacks | 0 % | Self-buff: attacks generate 1 stack (2 per auto), +1 % melee dmg per stack; cleared on miss / weapon switch; "stacks with Berserk multiplicatively (240% with Berserk and 20 stacks)". | Yes* | Annihilation.png | no |
| Healing Blade | Saradomin godsword | Augmented/Golden/Lucky SGS | 50 % | – | – | 200 % | 185-215 %; heals 50 % of damage; restores prayer 2.5 % of damage. | Yes* | Saradomin godsword.png | no |
| Ice Cleave | Zamorak godsword | Augmented/Golden/Lucky ZGS | 60 % | – | – | 200 % | 185-215 %; binds 9.6 s (16 t). | Yes | Zamorak godsword.png | no |
| Icy Tempest | Dark Shard of Leng, Dark ice shard | Augmented both, dyed DSoL + augmented dyed | 30 % req; cost −12 %/Primordial Ice stack (0 at ≥3) | **15 s (25 t)** | consumes Primordial Ice (id 49562, icon Primordial Ice.png) | 315 % (475 % @10 stacks) | 115-135 % to target + 175-205 % to target and up to 9 within 1 tile; +18-22 % per stack on every hit; consumes all stacks. **Resource:** Primordial Ice (DSoL passive). EoF: "will not be increased to 5x5 … with a halberd-type weapon". | Yes | Dark Shard of Leng.png, Dark ice shard.png | no |
| Igneous Cleave | Ek-ZekKil | (all Ek-ZekKil variants) | 50 % | 60 s | – | 584 % (1448 % @14 bleed ticks) | Old bleed spec (6 hits every 4 t, +5 %/hit, extendable by bleeds/burns; MSoA via EoF → 9 hits). | was Yes (EoF Ek-ZekKils "removed and refunded" 27 May 2025) | Ek-ZekKil.png | **REMOVED 27 May 2025** (`Category:Removed content`, `removal` param) |
| Igneous Showdown | Ek-ZekKil | Augmented, dyed (7) + augmented dyed | 50 % (+15 % refund vs Rival; 30 % under Natural Instinct) | **60 s (100 t)** ("governed by the Igneous Strike debuff") | Flamebound Rival (id 51672, icons Flamebound Rival.png / Flamebound Rival (buff).png), until target dies | 280 % (1045 % vs Rival) | 260-300 % + marks target as Flamebound Rival; vs your Rival: +3 simultaneous hits of 245-265 %, +15 % adren. **Interaction:** Ashen Vow passive (+12 %/−12 %), extra hits and refund need "a physical Ek-Zekkil (not stored in an Essence of Finality amulet or an override)". Recommended under Berserk. | Ambiguous (see §4) | Ek-ZekKil.png | no |
| Impale | Rune claws (+1/+2/+3) | Rune off hand claws (+1..+3) are in the weapons category but not in the bucket | 25 % | – | – | 140 % | 130-150 %; hit chance +10 %. | Yes | Rune claws.png (+1/+2/+3 .png) | no |
| Liquefy | Brackish blade, Brine sabre | – | 50 % | – | 1 m self-buff | 135 % | 125-145 %; +3+10 % Attack/Strength/Defence for 1 m. | Yes | Brackish blade.png, Brine sabre.png | no |
| Mirrorback (Melee) | Noxious scythe | Augmented, dyed (7) + augmented dyed | 100 % | – | self, 9.6 s (16 t), max mitigation 10,000 | 0 % | Summon mirrorback spider: −50 % damage taken, reflects 50 %. (Same spec on Noxious longbow/staff; one wiki page with switch infobox.) | Yes | Noxious scythe.png | no |
| Obliterate | Statius's warhammer, Superior Statius's warhammer | Augmented superior | 50 % (EoF table says 35 %) | – | 1 m debuff | 170 % | 160-180 %; target Defence −30 %; base hit chance +5 for 1 m. **Interaction:** stacks with Claws of Guthix affinity debuff; weapon degrades to dust (0.1 %/spec) but EoF gives "unlimited uses". Formerly named *Smash* (renamed 4 Mar 2024). | Yes* | Statius's warhammer.png, Superior Statius's warhammer.png | no |
| Powerstab | Dragon 2h sword | Lucky | 50 % | – | – | 290 % | 260-320 % to up to 25 enemies within 2 tiles (5x5; 7x7 with halberd via EoF). | Yes* | Dragon 2h sword.png | no |
| Quick Smash | Granite maul | – | 50 % | – | – | 125 % | 115-135 %; **"Can be cast during the global cooldown."** (also via EoF since 29 Nov 2021). | Yes* | Granite maul.png | no |
| Rampage | Dragon battleaxe | – | 100 % | – | Rampage (status) (id 47053), 1 m (or logout/death) | 0 % | Self: melee ×1.2, hit chance −10 %, drains Att/Def/Rng/Mag/Necro 10 %, Strength +10 +1 per 4 drained. **Interaction:** "scales multiplicatively with … Berserk, or the special attack of the Zaros godsword" (1.75×1.2 = 2.1; 1.25×1.2 = 1.5). Needs no target. | Yes | Dragon battleaxe.png | no |
| Saradomin's Lightning | Saradomin sword | Augmented, Lucky | 100 % | – | – | 610 % | 2 hits of 285-325 % **Magic** damage. | Yes | Saradomin sword.png | no |
| Shove | Dragon spear, Zamorakian spear | Augmented ZS, Lucky ZS | 25 % | – | – | 0 % | Stun + bind 3.6 s (6 t), knockback 1 tile. | Yes | Dragon spear.png, Zamorakian spear.png | no |
| Slice & Dice | Dragon claw, Superior dragon claw | Off-hand dragon claw, Superior off-hand, Lucky main/off-hand ("requires both the main hand and off-hand claws") | 50 % | – | – | 400 % | 4 hits: 180-220 %, 90-110 %, 45-55 %, 45-55 %. | Yes* (EoF needs "Main and off-hand dragon claws") | Dragon claw.png, Superior dragon claw.png | no |
| Spear Wall | Vesta's spear, Superior Vesta's spear | Augmented superior | 50 % | – | self, 4.8 s (8 t) | 115 % | 105-125 % to target + up to 9 within 1 tile; −50 % damage taken, reflect 50 %. 5x5 with halberd via EoF. | Yes* | Vesta's spear.png, Superior Vesta's spear.png | no |
| Sunder | Barrelchest anchor | – | 50 % | – | 1 m debuff | 135 % | 125-145 %; base hit chance +4; target damage −10 % (1 m). | Yes | Barrelchest anchor.png | no |
| Sunfall Slam | Tumeken's Light | Augmented | 40 % | **60 s (100 t)** | Lesser Purifying Light (id 52061, icon Lesser Purifying Light.png), 30 s (50 t) | 295 % | 290-300 % to target + up to 9 within 2 tiles (3 with halberd); for 30 s melee abilities trigger Lesser Purifying Light (45-55 % to up to 2 extra enemies within 4 tiles, once per ability use; channelled abilities once per hit). | Yes | Tumeken's Light.png | no |
| Sweep | Dragon halberd | – | 30 % | – | – | 270 % | 2 hits of 120-150 % in a cone to target + up to 9. | Yes | Dragon halberd.png | no |
| The Final Flurry | Varanus's Mercy | Augmented | 50 % | – | – | 491.25 % (incl. crit) | 3 hits: 80-100 %, 80-100 %, 150-180 %; +25 % crit chance & crit dmg on hits 1-2, +50 % on hit 3. | Yes* | Varanus's Mercy.png | no |
| Vine Call | Abyssal vine whip | dyed (blue/green/white/yellow), Augmented | 60 % | **19.8 s** (prose; infobox says 0) | 3x3 vine, 10 hits every 3 t (18 s) | 335 % | 100-120 % first hit + 20-25 % every 1.8 s to up to 9 in a 3x3 (10 hits); targets leaving the area stop being hit. EoF: no 5x5 with halberd, no MSoA extension (spec page) — EoF ability page claims the opposite. | Yes | Abyssal vine whip.png | no |
| Warstrike | Bandos godsword | Augmented/Golden/Lucky BGS; Superior bloodied/honourable kyzaj transclude `{{:Warstrike}}` (special-attack mode toggled at Bandos altar) but are not in the bucket `weapon` list | 100 % | – | – | 245 % | 225-265 %; drains target combat stats by 0.5 % of damage. | Yes | Bandos godsword.png | no |
| Weaken (special attack) | Darklight | – | 50 % | – | 1 m debuff | 80 % | 75-85 %; target Attack/Strength/Defence/hit chance/damage −6 % (×2 vs demons) for 1 m. | Yes | Darklight.png | no |

### 2.2 Ranged (22 rows)

| Spec (page) | Weapon(s) | Variants | Adren | CD | Buff / duration | Dmg | Effect | EoF | Icon (File:) | Removed |
|---|---|---|---|---|---|---|---|---|---|---|
| Aimed Shot | Hand cannon | Augmented | 35 % | – | – | 330 % | **Channelled**: 300-360 % after 3 s (5 t); hit chance +75 %. | Yes* | Hand cannon.png | no |
| Balance by Force | Bow of the Last Guardian | Augmented, dyed (7) + augmented dyed | 30 % | – ("has no cooldown") | Balance by Force (status) (id 49551, icon Balance by Force (status).png), 30 s (50 t) | 245 % | 235-255 % (70 % in PvP); Perfect Equilibrium threshold 8→4 stacks for 30 s; with ≥3 stacks the spec hit triggers the passive and clears stacks. **Interaction:** BotLG passive. EoF: works, but "Perfect Equilibrium will not trigger without a Bow of the Last Guardian equipped"; "intended to be used with the bow equipped instead of cast through the use of an Essence of Finality amulet." | Yes* (limited) | Bow of the Last Guardian.png | no |
| Balanced Shot | Guthix bow | – | 35 % | – | heal over 15 s (25 t) | 180 % (240 % w/ Guthix arrows) | 170-190 %; heals 60 % of damage over 15 s; +55-65 % Magic dmg with Guthix arrows. | Yes* | Guthix bow.png | no |
| Chain Hit | Rune throwing axe | – | 10 % | – | – | 60 % | 55-65 % per hit, bounces up to 3 times between enemies within 3 tiles (can re-hit original). Not affected by Locate/chins AoE. | Yes* | Rune throwing axe.png | no |
| Crystal Rain | Seren godbow | Augmented, dyed (7) + augmented dyed | 30 % | **30 s (50 t)** (only if arrow 1 hits) | – | 140 % per hit (max 700 %) | 5 pairs of arrows, 125-155 % each, landing randomly within 2 tiles of the target's centre; arrow 1 lands 1 tick before 2-5. **Interaction:** enchanted bolt/arrow procs only on arrow 1 (Deathspore excepted); Death's Swiftness; works with chins/Locate via EoF. | Yes* | Seren godbow.png | no |
| Deep Burn | Strykebow | Augmented | 25 % | – | consumes Dark Burn (bucket id −1 = no buff page) | 195 % | 180-210 % + 6 hits of 12.5 % of all Dark Burn stacks every 2 t; stun+bind 3 s (5 t); consumes all Dark Burn stacks. **Resource:** Dark Burn (Strykebow passive). | Yes* | Strykebow.png | no |
| Defiance | Zanik's crossbow | – | 40 % | – | – | 250 % | 225-275 %; PvP +10 % per active prayer (max 50 %). | Yes* | Zanik's crossbow.png | no |
| Descent of Darkness | Dark bow | dyed (4), Augmented | 65 % | – | – | 420 % | 2 hits of 190-230 %. (Dark bow passive: ranged basic attack hits twice.) | Yes* | Dark bow.png | no |
| Destructive Shot | Zamorak bow | – | 40 % | – | – | 340 % (400 % w/ Zamorak arrows) | 2 hits of 160-180 %; +55-65 % Magic dmg with Zamorak arrows. EoF note: "Zamorak arrows are not recommended as they will cap the damage at tier 55". (EoF ability page still calls it "Twin Shot".) | Yes* | Zamorak bow.png | no |
| Hamstring | Morrigan's throwing axe, Superior | Augmented superior | 50 % | – | – | 160 % | 150-170 %; PvP: no movement abilities 9 s. | Yes* | Morrigan's throwing axe.png, Superior Morrigan's throwing axe.png | no |
| Locate | Decimation | Augmented | 35 % (EoF table says 50 %) | – | Locate Active (id 34985), 10.8 s (18 t) | 0 % | Self: single-target ranged attacks also hit up to 5 additional enemies within 3 tiles of the target (CSM change from 9 within 1 tile). Ends on main-hand/2h swap. Re-cast resets timer. | Yes* | Decimation.png | no |
| Mirrorback (Ranged) | Noxious longbow | Augmented, dyed (7) + augmented dyed | 100 % | – | self 9.6 s (16 t) | 0 % | −50 % damage taken, reflect 50 %, cap 10,000. | Yes | Noxious longbow.png | no |
| Phantom strike | Morrigan's javelin, Superior | Augmented superior | 50 % | – | DoT 6 hits every 3 t | 305 % | 120-140 % + 6 hits of 30-40 % every 1.8 s. | Yes* | Morrigan's javelin.png, Superior Morrigan's javelin.png | no |
| Powershot | Magic longbow, Magic composite bow | – | 35 % | – | – | 220 % | 210-230 %; hit chance +40 %. | Yes* | Magic longbow.png, Magic composite bow.png | no |
| Restorative Shot | Saradomin bow | – | 30 % | – | heal over 15 s (25 t) | 140 % (200 % w/ Saradomin arrows) | 135-145 %; heals 100 % of damage over 15 s; +55-65 % Magic with Saradomin arrows. | Yes* | Saradomin bow.png | no |
| Shadowfall | Gloomfire bow | Augmented | 65 % | – | – | 465 % | 3 hits: 85-105 %, 85-105 %, 255-295 %. | Yes* | Gloomfire bow.png | no |
| Soulshot | Seercull | – | 50 % | – | – | 100-120 % (300-320 % vs lvl 99+ Magic) | 100-120 % +2-200 % by target Magic stat; target Magic −5 %. | Yes* | Seercull.png | no |
| Split Soul (special attack) | Eldritch crossbow | Augmented, dyed (7) + augmented dyed | 25 % | – ("has no cooldown") | Split Soul (status) (id 4549, icon Split Soul (status).png), 15 s (25 t) | 0 % | Self: Soul Split deals 400 % of what it would heal as damage to the target instead. **Interaction:** Soul Split curse; amulet of souls/EoF passive +18.75 % avg; tied to main-hand weapon (off-hand may be swapped); needs no target. | Yes* | Eldritch crossbow.png | no |
| Twin fang | Magic shortbow | – | 50 % | – | – | 260 % | 2 hits of 115-145 %; hit chance −30 %. | Yes* | Magic shortbow.png | no |
| Twin Shot | Quickbow | – | 35 % | – | – | 120 % | 2 hits of 55-65 %; hit chance +50 %. | Yes* | Quickbow.png | no |

### 2.3 Magic (18 rows)

| Spec (page) | Weapon(s) | Variants | Adren | CD | Buff / duration | Dmg | Effect | EoF | Icon (File:) | Removed |
|---|---|---|---|---|---|---|---|---|---|---|
| Claws of Guthix | Guthix staff | – (needs 100 Divine Storm casts to unlock) | 25 % | – | 1 m debuff | 220 % | 200-240 %; target Defence −5 %; base hit chance +5 for 1 m. **Interaction:** stacks with Obliterate (+5) → +7 total per EoF page; "commonly used as an Essence of Finality special attack for magic setups … as an adrenaline dump". | Yes* | Guthix staff.png | no |
| Devour | Obliteration | Augmented | 50 % | – | Devour Active (id 34986), 15 s (25 t) | 220 % | 200-240 %; target healing −50 % for 15 s. | Yes | Obliteration.png | no |
| Flames of Zamorak | Zamorak staff | – | 25 % | – | 1 m debuff | 220 % | 200-240 %; target Magic −5 %; target hit chance −5 % for 1 m. | Yes* | Zamorak staff.png | no |
| From the Shadows | Staff of Sliske | Augmented, dyed (7) + augmented dyed | 50 % | – | wight, 5 hits every 4 t | 300 % | Summons a wight: 5 hits of 55-65 % every 2.4 s. | Yes | Staff of Sliske.png | no |
| Iban Blast | Iban's staff | – | 50 % | – | – | 365 % | 340-390 %. | Yes* | Iban's staff.png | no |
| Instability | Fractured Staff of Armadyl | Augmented, dyed (7) + augmented dyed | 50 % | **60 s (100 t)** (no CD in PvP) | Instability (status), 30 s (50 t) | 130 % | 120-140 %; for 30 s every Magic crit on the primary target fires a Lightning Surge (70-90 % per infobox; CSM page says 80-100 % after 9 Mar 2026) landing 1 t later, no recursion. **Interaction:** crit chance stacking (Crit-i-Kal, grimoire, Biting 4, channeller's/reaver's ring, elite tectonic); buff survives unequipping the staff; only magic weapons proc. | Yes | Fractured Staff of Armadyl.png | no |
| Miasmic Barrage | Zuriel's staff, Superior Zuriel's staff | Augmented superior | 50 % | – | 15 s (25 t) debuff | 170 % | 200-240 % to up to 8 additional within 1 tile; enemies' attack rate −1 for 15 s; PvP adrenaline gain −50 %. EoF trivia: costs 0.1 % charge of an equipped degrade-to-dust weapon per target hit. | Yes | Zuriel's staff.png, Superior Zuriel's staff.png | no |
| Mirrorback (Magic) | Noxious staff | Augmented, dyed (7) + augmented dyed | 100 % | – | self 9.6 s (16 t) | 0 % | −50 % damage taken, reflect 50 %, cap 10,000. | Yes | Noxious staff.png | no |
| Power of Darkness | Staff of darkness | Augmented | 100 % | **90 s** (WSA page; infobox 0) | Power of Darkness (status) (id 44854), 19.8 s (33 t) | 0 % | Self: −25 % damage taken, reflects 25 %. Persists through weapon/amulet swaps; needs no target; cooldown cleared on duel/death. | Yes | Staff of darkness.png | no |
| Power of Light | Staff of light | dyed (4), Augmented | 100 % | – | Power of Light (status) (id 44853), 1 m | 0 % | Self: −50 % melee damage taken for 1 m. Persists through swaps; usable from EoF "without wielding the staff of light" (since 16 Nov 2020) and keeps working after switching combat style; Durzag cannot clear it. | Yes* | Staff of light.png | no |
| Reap | Penance trident, Penance master trident | – | 45 % | – | – | 290 % | 270-310 %; on killing blow generates 20 % adrenaline. | Yes* | Penance trident.png, Penance master trident.png | no |
| Rune Flame | Mindspike (air/water/earth/fire) | – | 35 % | – | – | 130 % | 120-140 %; hit chance +25 %. EoF: rune-providing staves lose that benefit when consumed. | Yes | Mindspike (air).png, (water).png, (earth).png, (fire).png | no |
| Saradomin Strike | Saradomin staff | – | 25 % | – | – | 220 % | 200-240 %; PvP: target prayer −30 %. | Yes | Saradomin staff.png | no |
| Soulfire | Roar of Awakening | Augmented | 35 % | **45 s (75 t)** | Conflagrate (id 50070, icon Conflagrate.png), 15 s (25 t); Soulfire (status) debuff on target | 1255 % | 130-160 % + 6 burn hits of 170-200 % every 3 t (1150-1360 % over 10.8 s); grants Conflagrate: next Combust within 15 s +40 % dmg. **Interaction:** Combust; Essence Corruption ("may activate on Soulfire, dealing all of its damage immediately and refreshing its cooldown"); Song of Destruction; 30 % in PvP. Only one-handed magic weapon with a spec. | Yes | Roar of Awakening.png | no |
| Tempest of Armadyl | Armadyl battlestaff | Augmented | 50 % | – | – | 300 % | **Channelled**: 5 hits of 45-55 % every 1 t, each +5 %; 2.4 s; benefits from channeller's ring crits. | Yes* | Armadyl battlestaff.png | no |
| The Last Command | Legatus's Emberstaff | Augmented | 35 % | – | – | 260 % (up to 455 % <25 % LP) | 240-280 %; +1 % per 1 % target LP missing (max +75 %); 70 % in PvP. | Yes* | Legatus's Emberstaff.png | no |

### 2.4 Necromancy (3 rows)

| Spec (page) | Weapon(s) | Variants | Adren | CD | Buff / duration | Dmg | Effect | EoF | Icon (File:) | Removed |
|---|---|---|---|---|---|---|---|---|---|---|
| Death Grasp | Death guard (tier 70/80/90) | Augmented tier 70/80/90 | 25 % | **30 s (50 t)** ("Death guard (status)" debuff) | consumes Necrosis (id 48333, icon Necrosis.png); stun+bind 4.8 s (8 t) | 450 % (930 % @12 Necrosis) | 405-495 % Necromancy + 40 % per Necrosis stack, consumes all; 40 % in PvP. **Resource:** Necrosis. | Yes* (listed in EoF Necromancy table) | Death guard (tier 70).png, (tier 80).png, (tier 90).png | no |
| Death Essence | Omni guard | Augmented, (or), dyed (7) + augmented dyed | 30 % | **60 s (100 t)** | Death Essence (status) (id 48351, icon Death Essence (status).png), 30 s (50 t) | 400 % | 360-440 % Necromancy; readies Death Spark on cast; for 30 s Touch of Death, Finger of Death, Death Skulls also ready Death Spark. **Interaction:** Death Spark (Omni guard passive), Necromancy basic attack ×2. "Swapping main-hand weapons (even to another Omni guard) will remove the Death Essence buff." | Not documented (see §4) | Omni guard.png | no |
| Soul Crush | Devourer's Guard | Augmented | 25 % | **60 s (100 t)** | Soul Crush (status) (id 52065, icon Soul Crush (status).png), 30 s (50 t); consumes Residual Soul | 150 % (900 % @5 Residual Souls) | 135-165 % Necromancy +135-165 % per Residual Soul stack, consumes all; readies Soul Reave on cast; for 30 s Soul Sap, Soul Strike, Volley of Souls, Spectral Scythe also ready Soul Reave. **Resource:** Residual Souls; Soul Reave (Devourer's Guard passive). Buff removed on main-hand swap. | Not documented (see §4) | Devourer's Guard.png | no |

**Not special attacks (asked about / easily confused):**
- **Soulbound lantern (or)** — off-hand Necromancy conduit. It has **no special attack**; its effect is the passive *Soul Siphon* (`{{Soul Siphon details}}`). `Soulbound lantern (or)` and `Augmented Soulbound lantern (or)` are in `Category:Weapons that have special attacks`, but neither page has a spec section and no bucket row references them — wiki categorisation error.
- **Enhanced Excalibur** — off-hand item; its heal is an item "Activate" effect (5-min cooldown shared with Rejuvenate/Guthix's Blessing/Ice Asylum, no adrenaline), not a Weapon Special Attack.
- **Shields / other off-hands** — no shield or off-hand has a weapon special attack. Off-hand dragon claw / rune off-hand claws only participate in the main-hand spec (Slice & Dice needs both claws equipped).
- `Category:Weapons which previously had special attacks`: Annihilation (Crucible), Decimation (Crucible), Obliteration (Crucible), Dorgeshuun crossbow, Dwarven army axe (historical; not in the bucket).

Spec ↔ ability/resource interaction index: Death Grasp → Necrosis; Soul Crush → Residual Souls / Soul Reave; Death Essence → Death Spark; Blackhole ↔ Berserk (Berserk takes priority, ZGS used to alternate); Rampage × Berserk / Blackhole (multiplicative); Gravitate × Berserk; Obliterate + Claws of Guthix (affinity stacking); Crystal Rain ← Death's Swiftness / enchanted ammo / Locate / chins; Split Soul → Soul Split; Descent of Darkness (dark bow passive double basic); Igneous Showdown ↔ Flamebound Rival / Ashen Vow / Berserk / Natural Instinct; Balance by Force ↔ Perfect Equilibrium; Soulfire → Conflagrate → Combust, Essence Corruption; Deep Burn → Dark Burn; Icy Tempest → Primordial Ice; Instability → crit chance; Sunfall Slam → Lesser Purifying Light on every melee ability; Reap → adrenaline on kill; Locate → all single-target ranged abilities; Wen arrows Icy Precision → specs.

---

## 3. Machine-readable plan

### 3.1 Primary source: Bucket `infobox_weapon_special_attack`

Schema (https://runescape.wiki/w/Bucket:Infobox_weapon_special_attack?action=raw):

```json
{ "name": {"type":"TEXT"},
  "image": {"type":"PAGE","repeated":true},
  "weapon": {"type":"PAGE","repeated":true},
  "style": {"type":"TEXT"},
  "target": {"type":"TEXT"},
  "is_members_only": {"type":"BOOLEAN"},
  "json": {"type":"TEXT","index":false} }
```
Plus the implicit `page_name` field (every bucket has it). Written by `Module:Infobox Weapon Special Attack` (https://runescape.wiki/w/Module:Infobox_Weapon_Special_Attack?action=raw) from `{{Infobox Weapon Special Attack}}` params: `name, image, release, update, removal, removalupdate, members, style, target, adrenaline, weapon, damage, cooldown, description, anim, sfx, sfx2, buff, requirements`.

Field mapping:

| Need | Where | Format / parsing |
|---|---|---|
| Spec name | `name` (indexed) / `json.name` | plain text. Page title is `page_name` (differs for "Weaken (special attack)", "Split Soul (special attack)") |
| Weapon(s) | `weapon` (indexed, repeated) | array of page names (base weapons only, "does not include augmented and cosmetic dyed variants"); `json.weapon` is the raw `[[A]]<br>[[B]]` wikitext |
| Style | `style` (indexed) | `Melee` / `Ranged` / `Magic` / `Necromancy` |
| Target | `target` (indexed) | `Single` / `Multi` / `Self` / `Area` (`json.target` is the rendered icon+label) |
| Adrenaline | `json.adrenaline` | `<span class="text-red">-30%</span>` → regex `-?\d+` (negative = cost). Raw infobox param is a plain number e.g. `-30` |
| Cooldown | `json.cooldown` | `[[File:Ability timer.png|20px]]60 seconds (100 ticks)` → regex `(\d+) seconds \((\d+) ticks\)`; `0 seconds (0 ticks)` = none. Override Vine Call → 19.8 s and Power of Darkness → 90 s from prose |
| Avg damage | `json.damage` | free text: `440%`, `450% (930% with 12 Necrosis stacks)`, `0%` for buff-only |
| Effect text | `json.description` | wikitext bullet list; `[[File:Ability damage.png|16px]]` marks the damage icon; `{{ticks|N||reverse}}` already expanded to `Xs (N ticks)`; italics `''…''` for PvP notes. Line "Can be cast during the global cooldown." ⇒ GCD-ignoring |
| Buff applied | `json.buffs` | `[{"id":48333,"pagename":"Necrosis"}]` (id −1 when the buff page has no id, e.g. Dark Burn). Duration must be parsed from description (`* 30s (50 ticks) duration.`) |
| Weapon icon | `image` (indexed, repeated) | `File:Omni guard.png` … — this is the **weapon** sprite; ability icon is constant |
| Buff icon | Bucket `infobox_buff` | `bucket('infobox_buff').select('page_name','id','json').where({'page_name','Necrosis'})` → `json.image` = `[[File:Necrosis.png|frameless]]` |
| Removed | `json.removal` non-null **or** page in `Category:Removed content` | `"[[27 May]] [[2025]] ([[Update:…|Update]])"` |
| Members | `is_members_only` | all `true` |
| Animation / sound | `json.anim`, `json.sfx` | `[[File:Death Grasp.gif|300px|frameless]]`, `[[File:Death Grasp.ogg|noicon]]` |

### 3.2 Tested API URLs (all HTTP 200, 3 Sep 2026; send `User-Agent: rs3-ability-trainer/0.2`)

Full dump (78 rows, ~62 KB):
```
https://runescape.wiki/api.php?action=bucket&format=json&formatversion=2&query=bucket('infobox_weapon_special_attack').select('page_name','name','image','weapon','style','target','is_members_only','json').limit(500).run()
```
Indexed fields only (what `Module:SpecialAttackList` uses):
```
https://runescape.wiki/api.php?action=bucket&format=json&formatversion=2&query=bucket('infobox_weapon_special_attack').select('name','page_name','weapon','json').orderBy('name','asc').limit(5000).run()
```
Per style (URL-encode `{`, `'`, spaces — plain `{` in the query string fails with "Did not understand WHERE condition"):
```
https://runescape.wiki/api.php?action=bucket&format=json&formatversion=2&query=bucket%28%27infobox_weapon_special_attack%27%29.select%28%27name%27%2C%27page_name%27%2C%27weapon%27%29.where%28%7B%27style%27%2C%27Necromancy%27%7D%29.run%28%29
```
Removed specs (category filter, exactly how the wiki's "Removed special attacks" table is built):
```
https://runescape.wiki/api.php?action=bucket&format=json&formatversion=2&query=bucket%28%27infobox_weapon_special_attack%27%29.select%28%27name%27%2C%27page_name%27%2C%27weapon%27%2C%27style%27%29.where%28%7B%27Category%3ARemoved+content%27%7D%29.limit%28500%29.run%28%29
```
→ `[{"page_name":"Igneous Cleave","style":"Melee","name":"Igneous Cleave","weapon":["Ek-ZekKil"]}]`. Current specs = `.where(bucket.Not({'Category:Removed content'}))` (Lua) — in the URL API use the unfiltered dump and subtract.

By weapon: `.where({'weapon','Ek-ZekKil'})` → Igneous Cleave + Igneous Showdown.

Variants (all 365 weapon pages incl. augmented/dyed/lucky):
```
https://runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Weapons_that_have_special_attacks&cmlimit=500&cmnamespace=0&format=json&formatversion=2
```
Spec pages + their categories (Melee/Ranged/Magic/Necromancy special attacks, Removed content, "missing animation/sound effect"):
```
https://runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Weapon_special_attacks&cmlimit=500&cmnamespace=0&format=json&formatversion=2
https://runescape.wiki/api.php?action=query&prop=categories&cllimit=500&titles=Death%20Grasp|Blackhole&format=json&formatversion=2
```
Raw wikitext of a spec page (for `buff`, `release`, `removal`, prose): `https://runescape.wiki/w/Death_Grasp?action=raw`.
Icon existence/URL: `https://runescape.wiki/api.php?action=query&titles=File:Necrosis.png|File:Weapon%20Special%20Attack.png&prop=imageinfo&iiprop=url&format=json&formatversion=2` (image URL pattern `https://runescape.wiki/images/<Name_with_underscores>.png`).
Buff icons: `bucket('infobox_buff').select('page_name','id','json').where(bucket.Or({'page_name','Necrosis'},{'page_name','Conflagrate'})).run()` (schema: `id`, `historical_id`, `json`; `json.image` holds the file link).

### 3.3 Example JSON row (Death Grasp, verbatim from the dump)

```json
{
  "page_name": "Death Grasp",
  "name": "Death Grasp",
  "style": "Necromancy",
  "target": "Single",
  "is_members_only": true,
  "image": ["File:Death guard (tier 70).png", "File:Death guard (tier 80).png", "File:Death guard (tier 90).png"],
  "weapon": ["Death guard (tier 70)", "Death guard (tier 80)", "Death guard (tier 90)"],
  "json": "{\"description\":\"Grasp the target with necrotic energy.\\n* 405-495% [[File:Ability damage.png|16px]]Necromancy damage.\\n* Stuns and binds the target for 4.8s (8 ticks).\\n* Deals an additional 40% Necromancy damage for each [[Necrosis]] stack.\\n* Consumes all Necrosis stacks.\\n''Damage is 40% effective in PvP.''\",\"image\":\"[[File:Death guard (tier 70).png]] [[File:Death guard (tier 80).png]] [[File:Death guard (tier 90).png]]\",\"target\":\"[[File:Ability single-target.png|20px|Single-target ability]] Single-target\",\"adrenaline\":\"<span class=\\\"text-red\\\">-25%</span>\",\"damage\":\"450% (930% with 12 Necrosis stacks)\",\"members\":\"Yes\",\"style\":\"Necromancy\",\"name\":\"Death Grasp\",\"sfx\":\"[[File:Death Grasp.ogg|noicon]]\",\"anim\":\"[[File:Death Grasp.gif|300px|frameless]]\",\"cooldown\":\"[[File:Ability timer.png|20px]]30 seconds (50 ticks)\",\"weapon\":\"[[Death guard (tier 70)]]<br>[[Death guard (tier 80)]]<br>[[Death guard (tier 90)]]\",\"buffs\":[{\"id\":48333,\"pagename\":\"Necrosis\"}]}"
}
```
(The `json.buffs` key appears only when the infobox `buff` param is set; `json.removal` only for removed specs.)

### 3.4 Detecting EoF compatibility

There is **no category, template parameter, bucket field or list page** that flags EoF compatibility. The wiki's model is: *every* weapon special attack can be stored ("store the Weapon Special Attack from any weapon in the game with one"). Recommended approach:

1. `eof_compatible = true` for every current bucket row (style must match the wielded weapon — store `style` and enforce at runtime).
2. Maintain a hand-curated `eof_notes` overlay (from spec pages) for documented differences:
   - Balance by Force — passive (Perfect Equilibrium) will not trigger from EoF.
   - Igneous Showdown — extra 3 hits / adrenaline refund / Ashen Vow need a physical Ek-ZekKil; Ek-ZekKils in EoFs were refunded 27 May 2025 (treat as *unknown/probably not storable*).
   - Death Essence, Soul Crush — no EoF documentation; buffs are removed on main-hand swap (treat as *unknown*).
   - Vine Call, Icy Tempest — no halberd 5x5 / no MSoA extension from EoF.
   - Destructive Shot — Zamorak arrows cap damage at tier 55 via EoF.
   - Slice & Dice — requires both claws when storing.
   - Power of Light — works from EoF without the staff (since 16 Nov 2020).
   - Rune Flame / Tempest of Armadyl — rune-providing staff benefit is lost when consumed.
   - Locate / Split Soul — tied to main-hand weapon; Locate must be cast from EoF or an equipped Decimation.
3. "Recommended" flag from the tables in `https://runescape.wiki/w/Template:Essence_of_Finality_details?action=raw` (rows start with `| {{plinkt|Weapon}}` / `{{plinkp|Weapon}}`; the Adrenaline column there is sometimes stale — e.g. Statius 35 % vs bucket 50 %, Locate 50 % vs 35 %, Dragon dagger 25 % vs 50 %; prefer the bucket) and from the ranged interaction table on `https://runescape.wiki/w/Essence_of_Finality?action=raw` (rows `| {{Yes}}/{{No}} | [[Spec]] | [[Weapon]]` — "Affected" = works with Locate/chinchompa AoE, not EoF compatibility).
4. Removed detection: `json.removal != null` OR page in `Category:Removed content`.
5. Ability metadata for the two trigger abilities (ids 28430 / 11748, icons) can come from the abilities bucket used elsewhere in this project (`Infobox Ability`), names `Weapon Special Attack` and `Essence of Finality`.

### 3.5 Suggested data model

```ts
interface WeaponSpecialAttack {
  page: string;            // page_name
  name: string;            // json.name
  style: 'Melee'|'Ranged'|'Magic'|'Necromancy';
  target: 'Single'|'Multi'|'Self'|'Area';
  weapons: string[];       // bucket.weapon (base)
  variants: string[];      // from Category:Weapons that have special attacks, matched by name
  adrenaline: number;      // 30 (requirement == cost unless costOverride)
  cooldownTicks: number;   // 0 = none; overrides: Vine Call 33, Power of Darkness 150
  ignoresGcd: boolean;     // description contains "Can be cast during the global cooldown."
  channelled: boolean;     // description contains "Channelled."
  needsTarget: boolean;    // target !== 'Self'
  buffs: {page: string; id: number; durationTicks?: number}[];
  avgDamage: string;       // json.damage
  description: string;     // json.description (wikitext)
  weaponIcons: string[];   // bucket.image
  eof: { storable: boolean|'unknown'; notes?: string; recommended: boolean };
  removed?: string;        // json.removal
}
```

---

## 4. Ambiguities / caveats found

1. **Cooldown mismatches**: Vine Call (page prose 19.8 s, infobox 0) and Power of Darkness (WSA list 90 s, infobox 0). Both cooldown claims come from the "Weapon Special Attack" page's exception list; the individual infoboxes were not updated. Use the prose values.
2. **EoF negative list does not exist.** Ek-ZekKil (Igneous Showdown): EoF copies were refunded when the spec was replaced (27 May 2025), and the Igneous Showdown page only describes the *physical-weapon-only* bonuses — it never says whether the new spec can be stored. Death Essence and Soul Crush likewise have no EoF statement. The recommended EoF Necromancy table lists only Death Grasp.
3. **Halberd/MSoA interactions** contradict between the EoF ability page (Vine Call 3x3→5x5) and the Vine Call / Icy Tempest pages ("will not be increased to 5x5"). The spec pages are more recent (2024/2025 edits).
4. **Stale numbers on EoF pages**: the EoF "Recommended weapons" adrenaline column (Statius 35 %, Locate 50 %, Dragon dagger 25 %) and the EoF ability ranged table (Zamorak bow spec still called "Twin Shot") differ from the bucket; the bucket reflects current tooltips.
5. **Instability Lightning Surge damage**: infobox says 70-90 %, the CSM page says 90-110 % → 80-100 % (9 Mar 2026). One of them is outdated.
6. **Warstrike weapons**: Superior bloodied/honourable kyzaj transclude the Warstrike page and sit in the weapons category, but are not in the bucket's `weapon` list; Superior ancient mace likewise for Favour of the War God. Rune off-hand claws are categorised but the spec is main-hand only.
7. **Soulbound lantern (or)** is mis-categorised as having a special attack; it has none.
8. `json.buffs[].id = -1` when the buff page has no id (Dark Burn); `Flamebound Rival` has two icon files (`Flamebound Rival.png`, `Flamebound Rival (buff).png`).
9. The bucket keeps the removed Igneous Cleave row; always filter on `Category:Removed content` / `json.removal`.
