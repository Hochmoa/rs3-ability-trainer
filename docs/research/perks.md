# Invention perks – combat mechanics (RS3, wiki state September 2026)

Researched 2026-09-04 against https://runescape.wiki (pages fetched: Perks, Critical strike, Ancient weapon gizmo and one
page per perk). Quotes are verbatim from the wiki. 1 tick = 0.6 s. This document is the source for
`tools/fetch-perks.py` (→ `public/data/perks.json`), `src/app/engine/loadout-resolver.ts` (`applyPerk`, gizmo checks),
the perk parts of `src/app/engine/trainer-engine.ts` and `src/app/engine/perks.spec.ts`. The older overview
`perks-and-set-effects.md` (part A) stays valid; this file goes deeper on the numbers and on what the simulator does with them.

## 1. General rules

### 1.1 Same perk on several gizmos does not stack

Perks page: **"These perks do not stack with themselves, and the gizmo with the highest rank will take priority."**
Example given there: Crackling 3 on the top and Crackling 2 on the bottom → only Crackling 3 counts. Wise page: "Like all
perks, Wise does not stack with itself, so only one item with Wise needs to be equipped to fully benefit from it."
Ruthless page: "The highest-ranked Ruthless equipped determines damage calculations". Aftershock page: one damage counter
per player, "Switching to a different weapon with Aftershock of any rank prevents the damage stored from resetting."

Exception (per item, not per player): Efficient / Enhanced Efficient – "Each item worn with an Efficient perk is affected by
the perk individually." (charge drain only, no combat effect).

**Simulator**: `resolveLoadout` collapses all gizmos (both weapon gizmos, body, legs, shield) into one `Map<perkId, maxRank>`
before `applyPerk` runs – two Precise 6 = one Precise 6, Precise 6 + Precise 4 = Precise 6. `loadoutWarnings` reports a
repeated perk ("… is on 2 gizmos: perks do not stack with themselves, only rank N counts").

### 1.2 Perks that exclude each other

| Pair | Wiki | Simulator |
|---|---|---|
| Devoted / Enhanced Devoted | Enhanced Devoted: "This does not stack with devoted." (Devoted page: "Enhanced Devoted takes priority over Devoted") | warning |
| Efficient / Enhanced Efficient | "This does not stack with efficient." / "It does not stack with the Enhanced Efficient perk when both are installed on the same item." | warning |
| Equilibrium / Biting (and every crit source) | Equilibrium "prevents critically striking"; Critical strike page lists Equilibrium as "-100%" crit chance | Biting has no effect → warning; `critDisabled` |
| Bulwark / Shield Bashing | Bulwark: "Debilitate deals no damage" | Shield Bashing has no effect → warning; Debilitate damage × 0 |
| Enhanced Devoted / Enhanced Efficient + any other perk in the same gizmo | "takes up two slots in a gizmo, meaning that it cannot be paired with any other perk in the same gizmo." / "This perk will take up two slots in a gizmo." | warning "more than two perk slots used" |

### 1.3 Gizmos

* Weapon gizmo / armour gizmo / tool gizmo; ancient versions "Have 9 material slots instead of 5" and "Allow most
  'positive' perks to reach a higher rank (that is not possible in normal gizmos)". Two ancient-only combat perks:
  Relentless (max 5, ancient weapon + ancient armour) and Ruthless (max 3, ancient weapon only); Fortune is tool-only.
* Each gizmo holds up to two perks (or one two-slot perk). Two-handed weapons take two weapon gizmos, one-handed weapons
  one; body, legs and shields take one armour gizmo each (Invention page, quoted in perks-and-set-effects.md A.2).
* Max ranks (Perks page table, `max rank standard` / `max rank ancient`): Precise 5/6, Spendthrift 5/6, Trophy-taker's 5/6,
  Lucky 5/6, Aftershock 3/4, Biting 3/4, Equilibrium 3/4, Eruptive 3/4, Crackling 3/4, Lunging 3/4, Caroming 3/4,
  Flanking 3/4, Ultimatums 3/4, Impatient 3/4, Invigorating 3/4, Clear Headed 3/4, Preparation 3/4, Turtling 3/4,
  Bulwark 3/4, Brief Respite 3/4, Devoted 3/4, Enhanced Devoted 3/4, Crystal Shield 3/4, Absorbative 3/4, Energising 3/4,
  Shield Bashing 3/4, Wise 3/4, Efficient 3/4, Enhanced Efficient 3/4, Enlightened 3/4; Mobile / Planted Feet / Reflexes /
  Genocidal / Undead–Dragon–Demon Slayer / Hoarding / Looting 1/1; Relentless –/5, Ruthless –/3.
* Gizmo type per perk (`gizmo=` infobox field): weapon only – Precise, Aftershock, Eruptive, Planted Feet, Caroming,
  Lunging, Flanking, Spendthrift, Ruthless (ancient); armour only – Devoted, Enhanced Devoted, Crystal Shield, Turtling,
  Preparation, Bulwark, Brief Respite, Reflexes, Lucky, Absorbative, Venomblood; weapon + armour – Biting, Equilibrium,
  Crackling, Ultimatums, Energising, Impatient, Invigorating, Mobile, Clear Headed, Genocidal, the three Slayer perks,
  Shield Bashing, Looting, Scavenging, Trophy-taker's, Taunting; Relentless (ancient weapon + ancient armour);
  weapon + armour + tool – Efficient, Enhanced Efficient, Enlightened, Wise, Hoarding, Talking, Glow Worm, Brassican,
  Hallucinogenic, Mysterious.

**Simulator** (`checkGizmo` / `checkPerkConflicts` in loadout-resolver.ts): perk type vs gizmo type, ancient-only perks on
a standard gizmo, rank > max (standard / ancient), rank < 1, more than two slots (two-slot perks), the same perk twice in a
gizmo, unknown perk ids, and the cross-gizmo conflicts of 1.1 / 1.2.

### 1.4 Removed perks (20 July 2026, "Patch Notes: Mid-Game Rebalance")

Perks page update history: 15 negative perks were removed and stripped from existing gizmos – Antitheism, Profane,
Inaccurate, Junk Food ("Food gives 3% less health per rank."), Undead Bait, Demon Bait, Dragon Bait, Cautious ("Cannot
auto-retaliate while this item is equipped."), Mediocrity, Fatiguing (−2 % adrenaline per rank; "Fully removed from weapon
and armour gizmos. Despite the patch note messaging, can still be created in tool gizmos, but it will have no effect."),
Committed ("Always skulled while this item is equipped."), Butterfingers, Blunted ("Reduces the weapon's damage by 1% per
rank."), Cheapskate, Confused. They are excluded from perks.json (`REMOVED` in fetch-perks.py) and cannot be selected.

### 1.5 Level-20 items

Perks with "This perk has an increased chance to activate on level 20 items." get × 1.1 on their chance (Biting 2.2 %/rank,
Impatient 9.9 %/rank, Relentless 1.1 %/rank, Devoted 3.3 %/rank, Enhanced Devoted 4.95 %/rank, Crystal Shield 11 %,
Absorbative 22 %, Lucky, Spendthrift, Trophy-taker's …). perks.json carries `level20Mult: 1.1` on those perks; the
simulator does not model item levels (open, see §4).

### 1.6 Critical strikes (Critical strike page)

* "Abilities and attacks have a 10% base critical strike chance" – engine `BASE_CRIT_CHANCE = 0.1` ✓.
* Damage: "a hit that would normally deal 2,000 damage would increase to 2000×1.5=3,000 damage if it rolls a critical at
  level 90" (10 % at level 1 … 50 % at level 90+) – engine `critMultiplier(99) = 1.5` ✓.
* "Most damage over time abilities (bleeds, burns, etc.) can never critically strike … The initial hit of Bloat may
  critically strike, but the subsequent hits cannot" – engine: DoT hits never crit ✓.
* PvP: "critical strike damage has only 20% effectiveness" – not simulated (PvM only).

### 1.7 What does not apply to bleeds / burns (Template:Bleeds: Unaffected boosts, quoted in mechanics.md)

Unaffected: Berserk / Death's Swiftness / Sunshine, critical strikes, "Most perks affecting variable damage, including
Genocidal, Precise, and Ruthless", Spendthrift ("does not increase the damage from bleed attacks"). Applied: "The Eruptive
perk", Equilibrium (ability damage stat), "Dragon, Demon, and Undead Slayer perks", Lunging (Combust / Dismember are the
bleeds it names).

## 2. Combat perks – numbers, scope, simulator status

Legend: **W/A** gizmo types (a = ancient only); **Std/Anc** max ranks. "Engine" = what the simulator does.

### 2.1 Damage perks

**Precise** (W, 5/6) – "Increases your minimum damage by 1.5% per rank of your maximum damage." Ranks: 1.5 / 3 / 4.5 / 6 /
7.5 / 9 % of the max. Precise page: affects "most abilities" but not "Damage-over-time abilities (except Bloat)", not
conjured spirits, bleeds, poison, Aftershock, Crackling. Bloat page: "Any effects that do not apply on-npc will affect the
initial hit of Bloat, and thereby the damage over time portion". Engine: `min = min + 0.015·rank·max` for every non-DoT hit
and for Bloat's hits (`dealHit`). Example noxious scythe (AD 1692), basic attack 110–130 %, roll 0.5: 2030 → Precise 6
min 121.7 % → 2129.

**Equilibrium** (W+A, 3/4; 2024 version) – "Ability damage is increased by 6%, plus an additional 2% per rank, but
prevents critically striking. (Cannot critically strike for 30s after unequipping this perk)." Ranks +8 / +10 / +12 / +14 %.
"The ability damage stat itself receives a direct boost", so it reaches "damage over time abilities, weapon poison,
conjured spirits, Aftershock, Crackling, and god books". Engine: `abilityDamageMult` × 1.08–1.14 applied to the ability
damage stat at the end of `resolveLoadout` (floored), `critDisabled = true` (also blocks guaranteed crits such as Smoke
Tendrils / Shadow Tendrils – wiki says "prevents critically striking" without exception). The *old* Equilibrium (min +3 % /
max −1 % per rank) is gone: "Originally called Equilibrium … On March 4, 2024, it was renamed [Eruptive] and repurposed" –
the engine's previous min/max code was that old version and has been replaced.

**Eruptive** (W, 3/4) – "Ability damage is increased by 0.5% per rank." "applies at the base level, increasing damage over
time, poison and other effects". Engine: `abilityDamageMult` × (1 + 0.005·rank).

**Biting** (W+A, 3/4) – "+2% chance per rank to critically hit opponents." 2 / 4 / 6 / 8 % (2.2 … 8.8 % on level-20
items). "Biting does not affect damage-over time abilities". Engine: `critChanceAdd += 0.02·rank`, added to the 10 % base.

**Aftershock** (W, 3/4, level 89) – "After dealing 50,000 damage, create an explosion centered on your current target,
dealing up to 40% per rank weapon damage to nearby enemies." Table (PvM): rank 1 24–39.6 % (avg 31.8), rank 2 48–79.2 %,
rank 3 72–118.8 %, rank 4 96–158.4 %; "The distinct damage values that Aftershock can hit are found in 0.4% ability damage
(per rank) intervals" → explosion = rank × 40 % × (60 … 99 % in 1 % steps) of the ability damage. "deals auto-attack damage
in a three-by-three area", "100% hit chance". "Aftershock can activate at most every 6 seconds; if the damage requirement is
met again shortly after its previous activation, the next activation will be delayed." "Unequipping the perked weapon or
switching to a different weapon without the perk resets the stored damage to zero." Not affected by Precise (Precise
page); affected by Equilibrium / Eruptive (ability damage stat). Engine: `applyDamage` adds every hit of the player to a
counter; at ≥ 50 000 and ≥ 10 ticks after the last explosion a hit `perk:aftershock` of rank × 0.4 × roll × AD lands (no
crit, no Precise, no style buffs); switching to a weapon without Aftershock resets the counter. Open: whether the
explosion's own damage counts (engine: no) and whether Berserk-type buffs apply (engine: no).

**Crackling** (W+A, 3/4) – "Periodically zaps your combat target for 50% per rank of your weapon's damage (or 10% per rank
in PvP). (1 minute cooldown)". 50 / 100 / 150 / 200 % ability damage (fixed, no range). "The style of damage Crackling
inflicts is based on the equipped main-hand weapon." "Other damage modifiers are ignored, including Berserk, Death's
Swiftness, and Sunshine". "The Crackling perk now triggers on the next attack after the cooldown ends, rather than
immediately." Engine: the first non-DoT hit of the session zaps (`perk:crackling`, rank × 50 % × AD, no crit), then the
first hit ≥ 100 ticks later, etc. Open: exact first trigger after equipping.

**Lunging** (W, 3/4, level 89) – "The damage of Combust and Dismember is increased by 10% + an additional 3% per rank."
Formula "1.1+0.03R": × 1.13 / 1.16 / 1.19 / 1.22. Only Combust and Dismember (the Fragmentation Shot / moving-target
version was removed on 2 March 2026). Engine: `damageMultPerAbility` on every hit of those two bleeds.

**Caroming** (W, 3/4, level 89) – "Ricochet deals 4% bonus damage per rank, with each hit. Abilities copied with Chain deal
an additional 5% + 5% damage per rank against secondary targets." Ricochet page: "The Caroming perk increases each hit of
Ricochet by a flat +4% ability damage per rank." Chain multiplier 0.3 → 0.4 / 0.45 / 0.5 / 0.55 (Greater Chain 0.5 → 0.6 …
0.75). The old "+1 target per rank" was removed 2 March 2026. Engine: `flatAddPerAbility` +0.04·rank on every Ricochet /
Greater Ricochet hit (main hit and the returning arrows); Chain is single-target in the simulator → not modelled.

**Ultimatums** (W+A, 3/4) – "Ultimate abilities gain 3% + 1% base damage per rank." × 1.04 / 1.05 / 1.06 / 1.07; "affects
all Ultimate abilities" (2 March 2026), "It has no effect on ultimate abilities that do not deal damage themselves, such as
Berserk, Death's Swiftness, and Living Death." Engine: `ultimateDamageMult` on every non-DoT hit of an Ultimate (Sunshine's
periodic damage is excluded – open whether the wiki means DoTs of ultimates too).

**Flanking** (W, 3/4) – "Soul Strike, Backhand, Impact and Binding Shot no longer stun and deal 40% more damage per rank
to targets that are not facing you." × 1.4 / 1.8 / 2.2 / 2.6 (table: Backhand 95–105 % → 247–273 % at rank 4, Impact
65–75 % → 169–195 %, Binding Shot / Soul Strike 135–165 % → 351–429 %). Engine: `EngineConfig.targetFacingAway` (default
false) switches the multiplier on for those four abilities; the lost stun is not simulated (no stun model needed for damage).

**Ruthless** (aW, –/3) – "Whenever you defeat an enemy you gain a 0.5% damage boost per rank for 20 seconds. This can
stack up to 5 times. (Does not work in PvP areas.)" 0.5 / 1 / 1.5 % per stack → 2.5 / 5 / 7.5 % at 5 stacks; "Bleed
abilities are unaffected by this perk." "Only one player can gain a stack of Ruthless per target". Engine: **not simulated**
– the trainer fights one target and the session ends on its death, so stacks can never build; the rank is stored
(`ruthlessRank`) for the loadout page only.

**Spendthrift** (W, 5/6) – "1% chance per rank to deal 1% extra damage per rank, at the cost of 1 gold coin per extra point
of damage dealt." Reworked September 2023 to affect "all damage" except bleeds: "Spendthrift does not increase the damage
from bleed attacks, such as Dismember." Engine: on every non-DoT hit `random < 0.01·rank` → × (1 + 0.01·rank).

**Genocidal** (W+A, 1/1) – "Deal up to +5% extra damage to your current Slayer target proportional to progress through
your current task." "M=1/10⌊5(1−A/A₀)⋅10⌋%", "actually caps at 4.9%", "does not work on bleeds and burns". Engine: not
simulated (no Slayer task).

**Undead / Dragon / Demon Slayer** (W+A, 1/1) – "Deal 7% additional damage to undead." (dragons / demons alike; "+7%
damage, up from +2%"). "affects damage over time abilities that have a bleed effect"; stacks multiplicatively with the salve
amulet. Engine: `targetTypeDamageMult` × 1.07 on every hit incl. DoTs when `EngineConfig.targetType` names that type.

**Shield Bashing** (W+A, 3/4) – "Debilitate's damage is increased by 15% per rank." 115 / 130 / 145 / 160 %. Engine:
`damageMultPerAbility.debilitate`.

**Energising** (W+A, 3/4) – "Gain by 50 + 25 per rank accuracy bonus." (75 … 150; rework of 2 March 2026). Engine: no
accuracy model → no effect.

### 2.2 Adrenaline perks

**Impatient** (W+A, 3/4) – "9% chance per rank for basic abilities to generate 3 extra adrenaline." 9 / 18 / 27 / 36 %
(9.9 … 39.6 % level 20); basic 9 % → 12 % on a proc; "Impatient will no longer trigger on sigil abilities"; works on the
basic attacks (Slice, Piercing Shot, Wrack, the Necromancy basic attack). Engine ✓: `random < 0.09·rank → +3` on GCD basics.

**Invigorating** (W+A, 3/4) – "Boosts adrenaline gained from basic attacks by 5% per rank." Table: basic attack 9 % →
9.4 / 9.9 / 10.3 / 10.8 %; with an Impatient proc 12 → 12.6 / 13.2 / 13.8 / 14.4 % – "multiplicatively after any adrenaline
gain from the Fury of the Small or Impatient effects". Basic *attacks* only (the style's basic attack ability), not other
basics. Engine ✓: `gain × (1 + 0.05·rank)` after Fury of the Small / Impatient, only for `attack` / `ranged` / `magic` /
`necromancy`.

**Relentless** (aW+aA, –/5) – "1% chance per rank to prevent adrenaline being consumed when using an ability that
requires adrenaline." 1 … 5 % (1.1 … 5.5 % level 20); "When this perk activates, it gives the player a Relentless debuff
for 30 seconds during which it can't activate again." Works on "abilities and special attacks that require adrenaline",
Essence of Finality included. Engine ✓: `random < 0.01·rank` on any cost > 0, 50-tick lockout.

### 2.3 Cooldown / duration perks

**Planted Feet** (W, 1/1, level 89) – "The duration of Sunshine and Death's Swiftness is increased by 25%, but they no
longer deal periodic damage to your target." Page: 31.2 s → 37.8 s ("an increase of 11 game ticks … The tooltip claims
25%, but actual increase is approximately 21.2%"); "The duration of Greater Sunshine and Greater Death's Swiftness do not
benefit from the Planted Feet perk." (only their periodic damage is removed); "The changed effect of the ability is
unaffected by switching weapons after activating the ability". Engine ✓: rules-magic / rules-ranged give the buff 63 ticks
and drop the bleed when `item: planted-feet`; Greater versions only lose the DoT.

**Mobile** (W+A, 1/1) – "Reduces cooldown of Surge, Escape, Dive, Bladed Dive, Barge and Greater Barge by 50%." (Barge
20.4 s → 10.2 s; the old half-adrenaline drawback was removed 4 March 2024). Engine ✓: `cooldownMult 0.5` (floored: Surge
34 → 17 ticks).

**Preparation** (A, 3/4) – "Preparation's duration and cooldown are increased by 15% per rank." Perk page table: duration
9.6 s → 11.4 / 13.2 / 14.4 / 15.6 s, cooldown 20.4 s → 23.4 / 26.4 / 29.4 / 32.4 s; Preparation page: "9.6s (16 ticks)",
"20.4 seconds (34 ticks)". Engine: `× (1 + 0.15·rank)` floored → cooldown 39 / 44 / 49 / 54 ticks (= the table), duration
18 / 20 / 23 / 25 ticks – **[OPEN]** the table's durations (19 / 22 / 24 / 26 ticks) do not follow from 16 ticks with any
rounding; kept as floor like the cooldown.

**Turtling** (A, 3/4) – "The Barricade ability's duration and cooldown are both increased by 10% per rank." Table:
17 t / 100 t → 18/110, 20/120, 22/130, 23/140 ticks. Engine ✓: floor(× (1 + 0.1·rank)) gives exactly these. Malletops
totem "stacks with the Turtling perk" (+3 / +6 ticks) – engine adds the flat ticks after the multiplier (order not stated
on the wiki).

**Reflexes** (A, 1/1) – "Anticipation's duration and cooldown are halved." 17 → 8 ticks, 41 → 20 ticks. Engine ✓ (floor).

**Clear Headed** (W+A, 3/4) – "Anticipation lasts one additional second per rank, but no longer reduces damage taken."
Table: +2 / +3 / +5 / +6 ticks → 19 / 20 / 22 / 23 ticks; "The additional time from Clear Headed is added after the
duration is halved by Reflexes." (with Reflexes: 10 / 11 / 13 / 14 ticks). Engine: table `extraTicks [2,3,5,6]` in
perks.json (was `round(1.67·rank)` = 2/3/5/7 – rank 4 fixed); `applyBuff` now multiplies first and adds the flat ticks
afterwards (Reflexes 8 + Clear Headed 4 = 14). Damage reduction is not modelled anyway.

**Bulwark** (A, 3/4) – "Debilitate deals no damage but gains up to 6% per rank extra duration from shield value." Formula
"tB = t + max(R, ⌊t × .06 × R⌋)", "Bulwark's extra duration seems to be a minimum of +1 game tick per rank". Table: no shield
7.8 s → 8.4 / 9.0 / 9.6 / 10.2 s, T90 shield 13.8 s → 14.4 / 15.0 / 16.2 / 16.8 s. Engine: `buffDurationExtra.debilitate =
{share 0.06·rank, minTicks rank}` and Debilitate damage × 0.

**Brief Respite** (A, 3/4) – "Reduces cooldown for Guthix's Blessing and Rejuvenate by 5% per rank, and total healing by
1% of max lifepoints per rank." 300 s → 285 / 270 / 255 / 240 s; Ice Asylum shares the cooldown. Engine ✓ cooldowns; healing
is not simulated.

**Devoted** (A, 3/4, level 74) / **Enhanced Devoted** (A, 3/4, two slots) – "3% chance per rank on being hit that
protection prayers will work at 100% (or 75% in PvP) for 3 seconds." / "4.5% chance per rank … This does not stack with
devoted." Engine: no damage-taken model → no effect (only the conflict warning).

**Crystal Shield** (A, 3/4) – "Has a 10% chance to activate on taking damage, lasting 10 seconds. 5% of damage taken per
rank is totalled for this period, becoming temporary lifepoints afterwards. These last either 30 seconds or until depleted
through further damage. (1 minute cooldown)". Engine: no effect (defensive).

**Absorbative** (A, 3/4) – "20% chance to reduce an attack by 5% per rank." (22 % level 20; not hard typeless, not PvP).
**Lucky** (A, 5/6) – "0.5% chance per rank when hit that the damage dealt will be reduced to 1." Engine: no effect.

### 2.4 Perks without a combat effect (kept in perks.json for the loadout page)

Efficient / Enhanced Efficient (charge drain −6 % / −9 % per rank per item; Enhanced takes two slots), Enlightened (+3 %
item XP per rank), Wise (+1 % XP per rank, 50 000 XP per day), Hoarding (Protect Item keeps two items), Looting (25 % chance
of an extra resource drop, 5-minute cooldown), Trophy-taker's (3 %/rank zero kills, 2 %/rank double kills on a Slayer
task), Scavenging, Taunting, Talking, Glow Worm, Brassican, Hallucinogenic, Mysterious, Venomblood, plus the tool perks.

## 3. perks.json vs research (what was fixed on 2026-09-04)

* Clear Headed: `extraTicksPerRank 1.67` → `extraTicks [2, 3, 5, 6]` (rank 4 was 7 ticks instead of 6).
* Bulwark: added `minTicksPerRank 1` (wiki minimum +1 tick per rank).
* Aftershock: added `minIntervalTicks 10`, `rollMin 0.6`, `rollMax 0.99` (the auto-attack style roll of the table).
* Crackling: added `ignoresStyleBuffs true` (documentation of the Berserk / Sunshine exclusion).
* Absorbative / Lucky: parameters added (were empty).
* `level20Mult 1.1` on every "increased chance to activate on level 20 items" perk.
* Everything else (max ranks, ancient ranks, gizmo types, two-slot flags, removed perks, per-rank numbers) matched the wiki.
  Both `tools/fetch-perks.py` (COMBAT table) and the JSON were changed; the JSON was hand-edited to match the script.

## 4. Open points / not simulated

* Item level 20 bonus (× 1.1 on chances) – no item levels in the loadout model.
* Ruthless (needs kills), Genocidal (Slayer task), Energising (accuracy), Devoted / Enhanced Devoted / Crystal Shield /
  Absorbative / Lucky / Brief Respite healing (damage taken / healing are not simulated).
* Caroming's Chain part, Flanking's stun removal, Aftershock's 3×3 area (single target).
* Aftershock: does its own damage count toward the next 50 000? Do Berserk-type buffs apply? (engine: no / no).
* Crackling: first trigger after equipping (engine: on the first attack).
* Ultimatums on DoTs of ultimates (engine: non-DoT hits only).
* Preparation perk duration rounding (see 2.3).
* Equilibrium's 30-second no-crit debuff after unequipping (no unequip in a session).
