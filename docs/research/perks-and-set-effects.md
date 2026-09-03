# Invention perks and armour set effects (RS3, wiki state September 2026)

Researched 2026-09-03 against https://runescape.wiki via the MediaWiki API (User-Agent `rs3-ability-trainer/0.2`).
All quotes are verbatim wikitext (link markup stripped). Times: 1 tick = 0.6 s.

Simulator classes used throughout:

| Class | Meaning |
|---|---|
| **1 ADR** | changes adrenaline gain / cost / cap |
| **2 CD** | changes cooldowns, durations, hit counts or grants a timed buff |
| **3 DMG** | damage / accuracy / crit only (no change to ability timing) |
| **4 NONE** | no effect on the combat simulation (skilling, cosmetic, defensive-only marked `4-def`) |

---

## Part A — Invention perks

### A.1 Data sources (tested)

There is **no `Bucket:Infobox perk`** (full bucket list: `https://runescape.wiki/api.php?action=query&list=allpages&apnamespace=9592&aplimit=500&format=json` → 88 buckets, none for perks). Perk data lives in `Template:Infobox Perk` parameters on each perk page; the list on https://runescape.wiki/w/Perks is a DPL query over that template (`uses=Template:Infobox Perk`, fields `name:max rank standard:max rank ancient:gizmo:level:desc`).

Machine-readable path (all tested, all return JSON):

| Step | URL |
|---|---|
| 1. Enumerate perk pages | `https://runescape.wiki/api.php?action=query&list=embeddedin&eititle=Template:Infobox_Perk&eilimit=500&format=json` → 87 pages (84 perks + `Template:Infobox Perk/doc` + 2 `User:` sandboxes) |
| 2. Per-gizmo-type lists | `https://runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Weapon_gizmo_perks&cmlimit=500&format=json` (also `Armour_gizmo_perks`, `Tool_gizmo_perks`, `Ancient_weapon_gizmo_perks`, `Ancient_armour_gizmo_perks`, `Ancient_tool_gizmo_perks`) – categories are set by the template from the `gizmo=` field |
| 3. Fetch wikitext (50 titles/call) | `https://runescape.wiki/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&formatversion=2&format=json&titles=Precise\|Biting\|Aftershock` |
| 4. Numeric ID (Jagex dbrow) | `https://runescape.wiki/api.php?action=bucket&query=bucket('dbrow').select('page_name','id').where('page_name','Precise').run()&format=json` → `{"bucket":[{"page_name":"Precise","id":525}]}` (fed by `{{BucketPut\|dbrow\|id=…}}` inside Infobox Perk; cross-link to Jagex cache: `https://chisel.weirdgloop.org/structs_rs3/index.html?type=dbrows&id=525`) |
| 5. Template schema | `https://runescape.wiki/w/Template:Infobox_Perk?action=raw` – fields: `name, image, release, update, gizmo, level, max rank standard, max rank ancient, desc, id` |

Example raw row (step 3, page `Precise`, the `{{Infobox Perk}}` block) and the parsed record used for this document:

```wikitext
{{Infobox Perk
|name = Precise
|gizmo = Weapon
|max rank standard = 5
|max rank ancient = 6
|desc = Increases your minimum damage by 1.5% per rank of your maximum damage.
|id = 525
...}}
```
```json
{"title":"Precise","gizmo":"Weapon","max_rank_standard":5,"max_rank_ancient":6,"level":null,"dbrow_id":525,
 "desc":"Increases your minimum damage by 1.5% per rank of your maximum damage.","class":"3 DMG"}
```

Per-rank tables are **not** in the infobox; they are prose/tables on each perk page (extracted below). The desc strings are "X% per rank" so ranks can be generated for most perks.

**Important 2026 change** (Perks page, Update history, patch 20 July 2026 "Mid-Game Rebalance"): 15 negative perks were removed from the game and auto-stripped from gizmos: Antitheism, Profane, Inaccurate, Junk Food, Undead Bait, Demon Bait, Dragon Bait, Cautious, Mediocrity, Fatiguing, Committed, Butterfingers, Blunted, Cheapskate, Confused. Their pages still exist (and still transclude the infobox), so filter them out. **84 perk pages → 69 live perks.**

### A.2 Gizmo / slot rules (sources)

Source: https://runescape.wiki/w/Invention#Maximum_number_of_gizmos (quoted) plus https://runescape.wiki/w/Augmentation and https://runescape.wiki/w/Armour_gizmo.

> "Two-handed weapons allow the attachment of two gizmos, each with up to two perks, while only one gizmo may be attached to one-handed weapons or shields. However, tools can have two tool gizmos even though they're one-handed […] The maximum number of perks is twice the number of gizmos. […] Some perks use up both slots and can't be combined with a second perk."

| Setup | Main-hand | Off-hand | Body | Legs | Weapon gizmos | Armour gizmos |
|---|---|---|---|---|---|---|
| Two-handed | 2 weapon gizmos | – | 1 armour gizmo | 1 armour gizmo | 2 | 2 |
| Dual-wield | 1 weapon gizmo | 1 weapon gizmo | 1 armour gizmo | 1 armour gizmo | 2 | 2 |
| One-handed + shield | 1 weapon gizmo | 1 **armour** gizmo | 1 armour gizmo | 1 armour gizmo | 1 | 3 |

(The wiki table lists "2 armour gizmos" under Body and Legs as the column total; the per-item rule is one gizmo per augmented body/leg piece — Armour gizmo page: "It can be attached to any augmented shield or piece of body or leg armour".)

* Each gizmo holds up to **2 perks**; standard gizmo = 5 material slots, ancient gizmo = 9 slots (Perks page). Ancient gizmos raise the max rank of most positive perks by +1 (`max rank ancient` field) and unlock Relentless / Ruthless / Fortune (Ancient Invention).
* **Enhanced Devoted** "takes up two slots in a gizmo, meaning that it cannot be paired with any other perk in the same gizmo" (Enhanced Devoted page). Same is documented for Enhanced Efficient (2-slot).
* Shields (tier 70+) take **one armour gizmo**; shieldbows take one weapon + one armour gizmo (Augmentation page, update history).
* Perks with a general player effect **do not stack with themselves**; "the gizmo with the highest rank will take priority" (Perks page). Efficient/Enhanced Efficient are per-item.
* Practical consequences for the simulator: max 4 weapon-perk slots and 4 armour-perk slots (dual-wield/2h); only-weapon perks (Precise, Aftershock, Eruptive, Planted Feet, Caroming, Lunging, Flanking, Spendthrift, Ruthless) compete for 4 slots; only-armour perks (Biting is W+A, but Devoted/Enh. Devoted, Crystal Shield, Turtling, Preparation, Bulwark, Brief Respite, Reflexes, Lucky, Absorbative, Venomblood) compete for 4 armour slots.
* Weapon gizmo unlock: Invention 3; armour gizmo: 16 (body) / 45 (legs); ancient gizmos: 85 Invention + research or blueprint (Gizmo, Augmentor pages).

Which perks go where (from `gizmo=` field; W = weapon, A = armour, T = tool, aW/aA/aT = ancient only):

* **W only**: Precise, Aftershock, Eruptive, Planted Feet, Caroming, Lunging, Flanking, Spendthrift (+ removed: Inaccurate, Blunted, Mediocrity); **aW only**: Ruthless
* **A only**: Devoted, Enhanced Devoted, Crystal Shield, Turtling, Preparation, Bulwark, Brief Respite, Reflexes, Lucky, Absorbative, Venomblood (+ removed: Profane)
* **W + A**: Biting, Equilibrium, Crackling, Ultimatums, Energising, Impatient, Invigorating, Mobile, Clear Headed, Genocidal, Undead/Dragon/Demon Slayer, Shield Bashing, Taunting, Looting, Scavenging, Trophy-taker's (+ removed: Junk Food, the three Baits, Fatiguing); **aW + aA**: Relentless
* **W + A + T**: Efficient, Enhanced Efficient, Talking, Glow Worm, Brassican, Wise, Hoarding, Hallucinogenic, Enlightened, Mysterious (+ removed: Antitheism, Cautious, Committed)
* **T only**: 20 skilling perks (list in A.5); **aT only**: Fortune

### A.3 Combat-relevant perks (classes 1–3) — per-rank numbers

Columns: Std = max rank standard gizmo, Anc = max rank ancient gizmo. "L20" = extra chance on a level-20 item.

#### Class 1 ADR — adrenaline

| Perk | Gizmo | Std/Anc | In-game desc (verbatim) | Per-rank numbers | Notes / URL |
|---|---|---|---|---|---|
| Impatient | W, A | 3/4 | "9% chance per rank for basic abilities to generate 3 extra adrenaline." | r1 9 %, r2 18 %, r3 27 %, r4 36 % chance; basic 9 % → 12 % adrenaline on proc | Stacks additively with Fury of the Small (+1 %); proc result is multiplied by Invigorating on basic attacks. L20 applies. https://runescape.wiki/w/Impatient |
| Invigorating | W, A | 3/4 | "Boosts adrenaline gained from basic attacks by 5% per rank." | ×1.05 / ×1.10 / ×1.15 / ×1.20 on **basic (auto) attacks only**, applied multiplicatively after Impatient/FotS | Does not affect abilities. https://runescape.wiki/w/Invigorating |
| Relentless | aW, aA | –/5 | "1% chance per rank to prevent adrenaline being consumed when using an ability that requires adrenaline." | 1/2/3/4/5 % (1.1–5.5 % L20); on proc a 30 s "Relentless" debuff blocks further procs | Applies to thresholds, ultimates, specials (incl. EoF). https://runescape.wiki/w/Relentless |

#### Class 2 CD — cooldowns, durations, timed buffs

| Perk | Gizmo | Std/Anc | In-game desc (verbatim) | Per-rank numbers | Notes / URL |
|---|---|---|---|---|---|
| Planted Feet | W | 1/1 | "The duration of Sunshine and Death's Swiftness is increased by 25%, but they no longer deal periodic damage to your target." | Sunshine / DS 50 → 63 ticks (30 s → 37.8 s); Sunshine DoT removed | No effect on Greater Sunshine / Greater DS (already 63/65 ticks; PF only strips the DoT). Effect persists after weapon switch once cast; Berserk not affected. https://runescape.wiki/w/Planted_Feet |
| Mobile | W, A | 1/1 | "Reduces cooldown of Surge, Escape, Dive, Bladed Dive, Barge and Greater Barge by 50%." | Surge/Escape 20 s → 10 s; Dive/Bladed Dive 20 s → 10 s; Barge/Greater Barge 20.4 s → 10.2 s | https://runescape.wiki/w/Mobile |
| Preparation | A | 3/4 | "Preparation's duration and cooldown are increased by 15% per rank." | none: 9.6 s / 20.4 s; r1 11.4/23.4; r2 13.2/26.4; r3 14.4/29.4; r4 15.6/32.4 (duration/cooldown) | Uptime peaks at r2 (50 %). https://runescape.wiki/w/Preparation_(perk) |
| Turtling | A | 3/4 | "The Barricade ability's duration and cooldown are both increased by 10% per rank." | Barricade base 17 t (10.2 s) / 100 t (60 s); r1 18 t/110 t; r4 23 t (13.8 s)/140 t (84 s) | Stacks with Malletops totem (+3 / +6 ticks, see B.3). https://runescape.wiki/w/Turtling |
| Devoted | A | 3/4 | "3% chance per rank on being hit that protection prayers will work at 100% (or 75% in PvP) for 3 seconds." | 3/6/9/12 % (3.3–13.2 % L20); Devotion effect 3 s, does not put Devotion on CD | Effective level req 74. https://runescape.wiki/w/Devoted |
| Enhanced Devoted | A | 3/4 | "4.5% chance per rank on being hit that protection prayers will work at 100% (or 75% in PvP) for 3 seconds. This does not stack with devoted." | 4.5/9/13.5/18 % | **2-slot perk** (occupies whole gizmo). https://runescape.wiki/w/Enhanced_Devoted |
| Brief Respite | A | 3/4 | "Reduces cooldown for Guthix's Blessing and Rejuvenate by 5% per rank, and total healing by 1% of max lifepoints per rank." | CD −5/−10/−15/−20 % (base 300 s); healing −1…−4 % max LP | Ice Asylum shares the reduced CD; Enhanced Excalibur keeps 5 min. https://runescape.wiki/w/Brief_Respite |
| Bulwark | A | 3/4 | "Debilitate deals no damage but gains up to 6% per rank extra duration from shield value." | Debilitate damage → 0; duration +6 %/rank of shield-derived duration, minimum +1 tick per rank | https://runescape.wiki/w/Bulwark |
| Crystal Shield | A | 3/4 | "Has a 10% chance to activate on taking damage, lasting 10 seconds. 5% of damage taken per rank is totalled for this period, becoming temporary lifepoints afterwards. These last either 30 seconds or until depleted through further damage. (1 minute cooldown)" | 10 % (11 % L20) proc; pool = 5/10/15/20 % of damage taken over 10 s; shield 30 s; 60 s CD | https://runescape.wiki/w/Crystal_Shield_(perk) |
| Clear Headed | W, A | 3/4 | "Anticipation lasts one additional second per rank, but no longer reduces damage taken." | Anticipation 17 t (10.2 s) → r1 19 t (11.4 s), r2 20 t (12.0 s), r3 ≈22 t, r4 ≈24 t; damage reduction removed | Added after Reflexes halving. https://runescape.wiki/w/Clear_Headed |
| Reflexes | A | 1/1 | "Anticipation's duration and cooldown are halved." | duration 10.2 s → 4.8 s (8 t); cooldown 24 s → 12 s | https://runescape.wiki/w/Reflexes |

#### Class 3 DMG — damage / accuracy / crit

| Perk | Gizmo | Std/Anc | In-game desc (verbatim) | Per-rank numbers | Notes / URL |
|---|---|---|---|---|---|
| Precise | W | 5/6 | "Increases your minimum damage by 1.5% per rank of your maximum damage." | min += 1.5/3/4.5/6/7.5/9 % of max | Not DoTs (except Bloat), not conjures. https://runescape.wiki/w/Precise |
| Eruptive (ex-Equilibrium) | W | 3/4 | "Ability damage is increased by 0.5% per rank." | ability-damage stat ×1.005/1.010/1.015/1.020 | Affects everything derived from ability damage (DoTs, poison, conjures, Aftershock, Crackling). https://runescape.wiki/w/Eruptive |
| Equilibrium (2024 version) | W, A | 3/4 | "Ability damage is increased by 6%, plus an additional 2% per rank, but prevents critically striking. (Cannot critically strike for 30s after unequipping this perk)." | +8/+10/+12/+14 % ability damage; **no crits**; 30 s no-crit debuff on unequip | https://runescape.wiki/w/Equilibrium |
| Aftershock | W | 3/4 | "After dealing 50,000 damage, create an explosion centered on your current target, dealing up to 40% per rank weapon damage to nearby enemies." | 40/80/120/160 % ability damage (3×3 AoE, 100 % hit chance) per 50 000 damage dealt; min 6 s between procs; counter resets on switching to a weapon without Aftershock | Level req 89. https://runescape.wiki/w/Aftershock |
| Biting | W, A | 3/4 | "+2% chance per rank to critically hit opponents." | +2/4/6/8 % crit chance (+2.2 %/rank L20 → 8.8 %) | Not DoTs. https://runescape.wiki/w/Biting |
| Crackling | W, A | 3/4 | "Periodically zaps your combat target for 50% per rank of your weapon's damage (or 10% per rank in PvP). (1 minute cooldown)" | 50/100/150/200 % ability damage every 60 s (PvP 10 %/rank) | Ignores Berserk/DS/Sunshine; style = main-hand. https://runescape.wiki/w/Crackling |
| Ultimatums | W, A | 3/4 | "Ultimate abilities gain 3% + 1% base damage per rank." | ×1.04/1.05/1.06/1.07 on damaging ultimates only | No effect on Berserk/DS/Sunshine/Living Death. https://runescape.wiki/w/Ultimatums |
| Lunging | W | 3/4 | "The damage of Combust and Dismember is increased by 10% + an additional 3% per rank." | ×1.13/1.16/1.19/1.22 on Combust & Dismember | Level req 89. https://runescape.wiki/w/Lunging |
| Caroming | W | 3/4 | "Ricochet deals 4% bonus damage per rank, with each hit. Abilities copied with Chain deal an additional 5% + 5% damage per rank against secondary targets." | Ricochet +4/8/12/16 % per hit (avg 7-hit total 135 → 163/191/219/247 %); Chain/Greater Chain secondary +10/15/20/25 % | Level req 89. Pure damage change (no timing) → class 3. https://runescape.wiki/w/Caroming |
| Flanking | W | 3/4 | "Soul Strike, Backhand, Impact and Binding Shot no longer stun and deal 40% more damage per rank to targets that are not facing you." | ×1.4/1.8/2.2/2.6 (Impact 65–75 % → r4 169–195 %; Backhand 95–105 % → 247–273 %; Soul Strike 135–165 % → 351–429 %); stun removed | https://runescape.wiki/w/Flanking |
| Ruthless | aW | –/3 | "Whenever you defeat an enemy you gain a 0.5% damage boost per rank for 20 seconds. This can stack up to 5 times. (Does not work in PvP areas.)" | +0.5/1.0/1.5 % per stack, max 5 stacks (2.5/5/7.5 %), 20 s refreshed on kill; bleeds unaffected | Highest equipped rank applies to existing stacks. https://runescape.wiki/w/Ruthless |
| Genocidal | W, A | 1/1 | "Deal up to +5% extra damage to your current Slayer target proportional to progress through your current task." | 0 → 4.9 % in 0.1 % steps (avg 2.5 % over a task) | https://runescape.wiki/w/Genocidal |
| Undead / Dragon / Demon Slayer | W, A | 1/1 | "Deal 7% additional damage to undead." (analog dragons / demons) | +7 % vs type incl. bleeds | Boss applicability tables on each page. https://runescape.wiki/w/Undead_Slayer |
| Energising | W, A | 3/4 | "Gain by 50 + 25 per rank accuracy bonus." | +75/100/125/150 accuracy bonus (flat) | https://runescape.wiki/w/Energising |
| Spendthrift | W | 5/6 | "1% chance per rank to deal 1% extra damage per rank, at the cost of 1 gold coin per extra point of damage dealt." | r % chance for +r % damage (r = 1…6); not bleeds | https://runescape.wiki/w/Spendthrift |
| Shield Bashing | W, A | 3/4 | "Debilitate's damage is increased by 15% per rank." | Debilitate 115/130/145/160 % | https://runescape.wiki/w/Shield_Bashing |

#### Class 4-def — defensive only (no effect on damage/adrenaline/cooldowns)

| Perk | Gizmo | Std/Anc | Desc (verbatim) | Numbers |
|---|---|---|---|---|
| Absorbative | A | 3/4 | "20% chance to reduce an attack by 5% per rank." | 20 % (22 % L20) chance of −5/10/15/20 % → ≈1 %/rank average; not hard typeless; not PvP |
| Lucky | A | 5/6 | "0.5% chance per rank when hit that the damage dealt will be reduced to 1. Does not stack with the equivalent Warpriest effect." | 0.5 … 3 % chance |
| Venomblood | A | 1/1 | "Regular poison damage is negated." | – |

### A.4 Perk classification summary (69 live perks)

| Class | Count | Perks |
|---|---|---|
| 1 ADR | 3 | Impatient, Invigorating, Relentless |
| 2 CD | 11 | Planted Feet, Mobile, Preparation, Turtling, Devoted, Enhanced Devoted, Brief Respite, Bulwark, Crystal Shield, Clear Headed, Reflexes |
| 3 DMG | 18 | Precise, Eruptive, Equilibrium, Aftershock, Biting, Crackling, Ultimatums, Lunging, Caroming, Flanking, Ruthless, Genocidal, Undead Slayer, Dragon Slayer, Demon Slayer, Energising, Spendthrift, Shield Bashing |
| 4-def | 3 | Absorbative, Lucky, Venomblood |
| 4 NONE (combat gizmo, no sim effect) | 14 | Taunting (Provoke 5×5 taunt), Looting, Scavenging, Trophy-taker's, Efficient, Enhanced Efficient, Talking, Glow Worm, Brassican, Wise, Hoarding, Hallucinogenic, Enlightened, Mysterious |
| 4 NONE (tool only) | 20 | Rapid, Tinker, Furnace, Refined, Honed, Polishing, Charitable, Scraps, Naturalist, Imp Souled, Pyromaniac, Prosper, Breakdown, Hasty, Careless, Explosive, Oblivious, Wild Runes, Preservationist, Fortune (ancient) |
| Removed 20 Jul 2026 | 15 | Antitheism, Profane, Inaccurate, Junk Food, Undead Bait, Demon Bait, Dragon Bait, Cautious, Mediocrity, Fatiguing, Committed, Butterfingers, Blunted, Cheapskate, Confused |

**Combat-relevant for the simulator: 32 perks (3 + 11 + 18); 35 defensive/none/tool.**

Full per-perk field dump (title, gizmo, std, anc, level, dbrow id, desc) for all 84 pages is in `A.5`.

### A.5 All 84 perk pages (infobox fields)

| Perk | gizmo | Std | Anc | Lvl | dbrow | Class |
|---|---|---|---|---|---|---|
| Absorbative | Armour | 3 | 4 | – | 530 | 4-def |
| Aftershock | Weapon | 3 | 4 | 89 | 567 | 3 |
| Antitheism | W,A,T | 1 | 1 | – | 490 | removed |
| Biting | W,A | 3 | 4 | – | 504 | 3 |
| Blunted | Weapon | 5 | 5 | – | 521 | removed |
| Brassican | W,A,T | 1 | 1 | 54 | 499 | 4 |
| Breakdown | Tool | 5 | 6 | – | 820 | 4 |
| Brief Respite | Armour | 3 | 4 | – | 529 | 2 |
| Bulwark | Armour | 3 | 4 | – | 535 | 2 |
| Butterfingers | Tool | 5 | 5 | – | 550 | removed |
| Careless | Tool | 5 | 5 | – | 15377 | 4 |
| Caroming | Weapon | 3 | 4 | 89 | 568 | 3 |
| Cautious | W,A,T | 1 | 1 | – | 493 | removed |
| Charitable | Tool | 3 | 4 | – | 552 | 4 |
| Cheapskate | Tool | 3 | 3 | – | 548 | removed |
| Clear Headed | W,A | 3 | 4 | – | 520 | 2 |
| Committed | W,A,T | 1 | 1 | – | 492 | removed |
| Confused | Tool | 3 | 3 | – | 553 | removed |
| Crackling | W,A | 3 | 4 | – | 513 | 3 |
| Crystal Shield | Armour | 3 | 4 | – | 780 | 2 |
| Demon Bait | W,A | 1 | 1 | – | 510 | removed |
| Demon Slayer | W,A | 1 | 1 | – | 507 | 3 |
| Devoted | Armour | 3 | 4 | 74 | 533 | 2 |
| Dragon Bait | W,A | 1 | 1 | – | 508 | removed |
| Dragon Slayer | W,A | 1 | 1 | – | 505 | 3 |
| Efficient | W,A,T | 3 | 4 | – | 498 | 4 |
| Energising | W,A | 3 | 4 | – | 519 | 3 |
| Enhanced Devoted | Armour | 3 | 4 | – | 779 | 2 (2-slot) |
| Enhanced Efficient | W,A,T | 3 | 4 | – | 777 | 4 (2-slot) |
| Enlightened | W,A,T | 3 | 4 | – | 488 | 4 |
| Equilibrium | W,A | 3 | 4 | – | 543 | 3 |
| Eruptive | Weapon | 3 | 4 | – | 13200 | 3 |
| Explosive | Tool | 1 | 1 | – | 15378 | 4 |
| Fatiguing | W,A,T | 3 | 3 | – | 500 | removed |
| Flanking | Weapon | 3 | 4 | – | 778 | 3 |
| Fortune | Ancient tool | – | 3 | – | 3443 | 4 |
| Furnace | Tool | 3 | 4 | – | 546 | 4 |
| Genocidal | W,A | 1 | 1 | – | 501 | 3 |
| Glow Worm | W,A,T | 1 | 1 | – | 489 | 4 |
| Hallucinogenic | W,A,T | 1 | 1 | – | 494 | 4 |
| Hasty | Tool | 5 | 5 | – | 15382 | 4 |
| Hoarding | W,A,T | 1 | 1 | – | 491 | 4 |
| Honed | Tool | 5 | 6 | – | 537 | 4 |
| Imp Souled | Tool | 5 | 6 | – | 549 | 4 |
| Impatient | W,A | 3 | 4 | – | 514 | 1 |
| Inaccurate | Weapon | 5 | 5 | – | 522 | removed |
| Invigorating | W,A | 3 | 4 | – | 515 | 1 |
| Junk Food | W,A | 3 | 3 | – | 518 | removed |
| Looting | W,A | 1 | 1 | – | 487 | 4 |
| Lucky | Armour | 5 | 6 | – | 527 | 4-def |
| Lunging | Weapon | 3 | 4 | 89 | 569 | 3 |
| Mediocrity | Weapon | 3 | 3 | – | 524 | removed |
| Mobile | W,A | 1 | 1 | – | 512 | 2 |
| Mysterious | W,A,T | 5 | 6 | – | 503 | 4 |
| Naturalist | Tool | 5 | 5 | – | 15383 | 4 |
| Oblivious | Tool | 1 | 1 | – | 15379 | 4 |
| Planted Feet | Weapon | 1 | 1 | 89 | 570 | 2 |
| Polishing | Tool | 3 | 4 | – | 547 | 4 |
| Precise | Weapon | 5 | 6 | – | 525 | 3 |
| Preparation | Armour | 3 | 4 | – | 536 | 2 |
| Preservationist | Tool | 5 | 5 | – | 15381 | 4 |
| Profane | Armour | 1 | 1 | – | 531 | removed |
| Prosper | Tool | 1 | 1 | – | 821 | 4 |
| Pyromaniac | Tool | 5 | 6 | – | 819 | 4 |
| Rapid | Tool | 3 | 4 | – | 817 | 4 |
| Refined | Tool | 3 | 4 | – | 551 | 4 |
| Reflexes | Armour | 1 | 1 | – | 534 | 2 |
| Relentless | Ancient W, Ancient A | – | 5 | – | 3441 | 1 |
| Ruthless | Ancient weapon | – | 3 | – | 3442 | 3 |
| Scavenging | W,A | 3 | 4 | – | 496 | 4 |
| Scraps | Tool | 1 | 1 | – | 15376 | 4 |
| Shield Bashing | W,A | 3 | 4 | – | 516 | 3 |
| Spendthrift | Weapon | 5 | 6 | – | 526 | 3 |
| Talking | W,A,T | 1 | 1 | – | 495 | 4 |
| Taunting | W,A | 1 | 1 | – | 511 | 4 |
| Tinker | Tool | 3 | 4 | – | 818 | 4 |
| Trophy-taker's | W,A | 5 | 6 | – | 502 | 4 |
| Turtling | Armour | 3 | 4 | – | 528 | 2 |
| Ultimatums | W,A | 3 | 4 | – | 517 | 3 |
| Undead Bait | W,A | 1 | 1 | – | 509 | removed |
| Undead Slayer | W,A | 1 | 1 | – | 506 | 3 |
| Venomblood | Armour | 1 | 1 | – | 532 | 4-def |
| Wild Runes | Tool | 5 | 5 | – | 15380 | 4 |
| Wise | W,A,T | 3 | 4 | – | 497 | 4 |

---

## Part B — Armour set effects and item passives

### B.1 Data sources

* **Master list page**: https://runescape.wiki/w/Set_bonus (`Set effect` and `Armour set effects` redirect there). It is a hand-maintained wikitable per style (Melee / Ranged / Magic / Necromancy / Hybrid / Skilling), columns `Set | Items | Effect name | Pieces for effect | Description`. Prose, not a bucket. Last edit 2026-08-15.
* **Per-set effect templates** (the closest thing to machine-readable): each high-level set's effect text lives in a template named after the effect and is transcluded on every piece page, e.g. `Template:Herald_of_Chaos`, `Template:Robes_of_the_First_Necromancer`, `Template:Dracolich_Remnant`, `Template:Elite_Dracolich_Remnant`, `Template:Tumeken's_Resplendence`, `Template:Elite_Fracture_Point`, `Template:Fracture_Point`, `Template:Chromatic_Choir`, `Template:Elite_Chromatic_Choir`, `Template:Trimmed_masterwork_set_bonus`, `Template:Achto_Set_Bonus`, `Template:Nature's_Envoy`, `Template:Song_of_Destruction`, `Template:Defender_passive_effect`, `Template:Death_Spark_details`, `Template:Perfect_Equilibrium_details`, `Template:Soul_Reave_details`, `Template:Soul_Siphon_details`. Fetch: `…/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&formatversion=2&format=json&titles=Template:Herald_of_Chaos`. No category groups them (`Category:Set effect templates` / `Passive effect templates` are empty), so discover them by scanning `==Set bonus==` / `==Passive effect==` sections of the item pages for `{{Name}}` transclusions.
* **Item membership**: `Category:Items that contribute to a set bonus` (471 members) via `list=categorymembers`.
* **Single-item passives**: https://runescape.wiki/w/Passive_effect – tabbed sub-lists `Passive effect/Clothing and armour/{Head,Torso,Legs,Hands,Feet,Back,Shield}`, `Passive effect/Other equipment/{Neck,Ring,Pocket,Ammunition}`, `Passive effect/Weapons/{Melee,Magic,Ranged,Necromancy}` – wikitables `Item | Effect` (prose). One line there is stale (Feet lists Fleeting boots as a Rapid Fire effect; the item, Snipe and Piercing Shot pages all agree on the Snipe cooldown effect below).
* **Status effects** produced by set effects are in buckets: `bucket('infobox_buff_details').select('page_name','json').where('page_name','Havoc (status)').run()` → `{"page_name":"Havoc (status)","json":"{\"trigger\":\"Activating an Attack or Strength ultimate ability whilst wearing at least 2 pieces of the Vestments of havoc armour set\",\"duration\":\"18 seconds\",\"effects\":\"<ul><li>Grants 15% adrenaline over its duration</li><li>If the effect is triggered whilst the buff is still active, 20% adrenaline is granted instantly instead and the buff is removed</li></ul>\"}"}` and `bucket('infobox_buff')` gives the buff-bar id (Havoc = 46213). Same works for `Channelled Might` (Tumeken). `Dracolich infusion` has an empty details box.
* **Conclusion**: there is **no machine-readable list of set/item effects**; the effect templates + Set bonus table + buff-details bucket are the best structured inputs. Numbers below were hand-verified against the ability pages (Berserk, Asphyxiate, Rapid Fire, Snipe, Piercing Shot, Combust, Rend, Overpower, Omnipower, Deadshot, Death Skulls, Sunshine, Death's Swiftness, Barricade, Anticipation, Dismember, Ricochet, Chain, Debilitate).

### B.2 Armour sets (multi-piece thresholds)

| Set | Style | Pieces | Effect (verbatim) | Class | Source |
|---|---|---|---|---|---|
| **Vestments of havoc** ("Herald of Chaos") — hood, top, bottom, boots (4 pieces max) | Melee | 2 | "After casting a melee ultimate ability, regenerate 15% adrenaline over 18 seconds. If this effect is already active, instead regenerate 20% adrenaline instantly, ending the regeneration effect." | 1 ADR | https://runescape.wiki/w/Template:Herald_of_Chaos |
| | | 3 | "The duration of Berserk is extended by 6 seconds, increasing its duration from 20.4 to 26.4 seconds." (Berserk page: 33 → 43 ticks) | 2 CD | https://runescape.wiki/w/Berserk |
| | | 4 | "The player's maximum adrenaline is increased by 20% whilst wielding a melee weapon." (cap 120 %; stacks with Heightened Senses to 130 %; extra adrenaline lost on unequip / non-melee MH) | 1 ADR | https://runescape.wiki/w/Vestments_of_havoc_armour |
| **Robes of the First Necromancer** — crown, top, bottom, hand wrap, foot wraps (Visage counts as 2, cap 5) | Necromancy | 2 | "Per piece worn (up to 5 pieces), increase the basic attack damage of your conjured spirits by 7%." (2–5 pieces → +14/21/28/35 %; heals of Vengeful Ghost included; not zombie poison / Command abilities) | 3 DMG | https://runescape.wiki/w/Template:Robes_of_the_First_Necromancer |
| | | 4 | "Per piece worn (up to 5 pieces), increase the duration of your conjured spirits by 5%." (4 pcs +20 %, 5 pcs +25 %; "applied the moment a conjure is summoned") | 2 CD | same |
| Spirit Pact interplay (talents, not a set) | Necromancy | – | Spirit Pact I/II/III: "+6 / +12 / +18 seconds", "bringing the total conjure time to 48 / 54 / 60 seconds"; tiers do not stack, highest wins. Base conjure = 42 s. Wiki does not state the order of operations with the +25 % robe bonus; treat as open (60 × 1.25 = 75 s if multiplicative on the final duration). | 2 CD | https://runescape.wiki/w/Spirit_Pact_III |
| **Dracolich armour** ("Dracolich Remnant", active after 9 s equipped) | Ranged | 1 | "Channelling Rapid Fire generates an additional 0.2 adrenaline per piece worn every 0.6 seconds." | 1 ADR | https://runescape.wiki/w/Template:Dracolich_Remnant |
| | | 3 | "Whilst wielding a bow, channelling Rapid Fire for its full duration grants Dracolich infusion for 3 seconds, increasing critical strike chance by 20% with ranged attacks." | 2 CD (+3 DMG) | same |
| | | 4 / 5 | "The duration of Dracolich infusion is increased by 1.8 seconds." / "…by an additional 1.8 seconds." (→ 4.8 s / 6.6 s) | 2 CD | same |
| **Elite Dracolich armour** ("Elite Dracolich Remnant") | Ranged | 1 / 3 / 4 / 5 | identical, but "0.5 adrenaline per piece worn every 0.6 seconds" and "critical strike chance by 40%" | 1 ADR / 2 CD | https://runescape.wiki/w/Template:Elite_Dracolich_Remnant |
| **Tumeken's resplendence** ("Tumeken's Resplendence", active after 5.4 s equipped; 5 pieces) | Magic | 3 | "Increase critical strike chance by 1.5% per piece worn while inside Sunshine." (3–5 pcs → 4.5/6/7.5 %) | 3 DMG | https://runescape.wiki/w/Template:Tumeken's_Resplendence |
| | | 4 | "Asphyxiate deals 40% less damage, but strikes once every 0.6 seconds for a total of eight hits." (Asphyxiate page: 8 hits at 71.5–84.5 % instead of 4 hits; ≈ +20 % total; the Set bonus master table still says "25% less" – template/ability page are the current values) | 2 CD | https://runescape.wiki/w/Asphyxiate |
| | | 5 | "Channelling Asphyxiate for its full duration extends the Channelled Might buff to 9 seconds and increases the player's critical strike damage by 35%." (baseline since 30 Mar 2026: Channelled Might 3.6 s / +15 % crit damage without the set) | 2 CD | https://runescape.wiki/w/Channelled_Might |
| Elite tectonic ("Elite Fracture Point") | Magic | 1 | "grants 2% critical strike chance per piece worn" (3 pieces → 6 %) | 3 DMG | https://runescape.wiki/w/Template:Elite_Fracture_Point |
| Tectonic ("Fracture Point") | Magic | 1 | "1% critical strike chance per piece worn" | 3 DMG | https://runescape.wiki/w/Template:Fracture_Point |
| Elite sirenic ("Elite Chromatic Choir") | Ranged | 2 / 3 | "Whilst wielding a crossbow, attacks have a 12% chance to trigger the effect of enchanted Dragonstone bolts." / 3 pcs: "…either enchanted Dragonstone, Onyx or Hydrix bolts." | 3 DMG | https://runescape.wiki/w/Template:Elite_Chromatic_Choir |
| Sirenic ("Chromatic Choir") | Ranged | 2 / 3 | same with 6 % | 3 DMG | https://runescape.wiki/w/Template:Chromatic_Choir |
| Trimmed masterwork (melee) / Masterwork ranged & magic sets | Melee / Ranged / Magic | 3 | "when damaged: Per piece worn, 10% of the incoming damage is delayed and dealt out over the next 6 seconds. (50% with all five pieces.)" | 4-def | https://runescape.wiki/w/Template:Trimmed_masterwork_set_bonus |
| Untrimmed Masterwork armour | Melee | – | no set effect (Masterwork equipment page) | 4 | https://runescape.wiki/w/Masterwork_equipment |
| Achto Primeval / Tempest / Teralith | Mag / Rng / Mel | 1–5 | Strength-bonus increase "0.05/0.1/0.15/0.2/0.25" × off-hand-tier weapon damage (shield/defender required); 3+: "When damaged, there is a chance for all cooldowns of defensive abilities to have their cooldowns reset" 3 % / 4 % / 8 % (3/4/5 pcs), 1 min internal CD | 3 DMG + 2 CD | https://runescape.wiki/w/Template:Achto_Set_Bonus |
| Cryptbloom ("Nature's Envoy") | Magic | 2 / 3 / 4 / 5 | −12 % magic / −8 % melee damage taken; 3: 18 % / 12 % (doubled with earth autocast); 4: 6 % chance "Croesus Deathspores" +10 % damage from behind for 15 s; 5: Fungal Shield below 20 % LP, 120 s CD | 4-def (4-pc = 3 DMG situational) | https://runescape.wiki/w/Template:Nature's_Envoy |
| Nakatra weapons Roar of Awakening + Ode to Deceit ("Song of Destruction") | Magic | 1 | DoT abilities build "Essence Corruption" (max 100, 30 s): "1+ stacks: Damage over time abilities have a 30% chance to deal all of their hitsplats immediately and remove their cooldown." "10+ stacks: The damage of magic attacks is increased by the sum of number of Essence Corruption stacks times 3 and the player's Magic level." "25+ stacks: Basic abilities generate an additional 1% adrenaline each tick over 3.6s for a total of 6% additional adrenaline." | 2 CD + 3 DMG + 1 ADR | https://runescape.wiki/w/Template:Song_of_Destruction |
| | | 2 | "Damage over time abilities deal 30% increased damage." (Combust, Corruption Blast, Soulfire) | 3 DMG | same |
| Deathdealer robes T70 / T80 / T90 | Necromancy | 1 | "Per piece worn, gain 1% / 1.5% / 2% chance to apply Death Mark with all Necromancy attacks." (max 5 / 7.5 / 10 %) | 3 DMG (Death Mark proc) | https://runescape.wiki/w/Deathdealer_robe_armour |
| Deathwarden robes T70/80/90 | Necromancy | 1 | 1 / 1.5 / 2 % dodge chance per piece | 4-def | Set bonus page |
| Void knight (melee/ranger/mage helm + 3 pieces) | any | 4 | "+3% accuracy and +5% … damage. If only wearing superior Void Knight equipment, the damage boost is increased to +7%." | 3 DMG | Set bonus page |
| Warpriest of Armadyl / Bandos | hybrid | 3 | "Chance to reduce cooldown duration on abilities." | 2 CD | Set bonus page |
| Warpriest of Saradomin / Zamorak | hybrid | 3 | "Chance to reduce damage by 90%, increasing by an additional 1% per piece equipped." | 4-def | Set bonus page |
| Warpriest of Tuska | hybrid | 3 | "Chance to deal critical damage to the target." | 3 DMG | Set bonus page |
| Barrows: Dharok's / Guthan's / Torag's / Verac's / Karil's / Ahrim's / Akrisae's / Linza's | various | 4 (Linza 5) | Dharok "more damage … the lower your current life points", Guthan heal chance, Torag "chance to lower the target's adrenaline", Verac improved damage / prayer bypass, Karil drains Magic, Ahrim drains Strength, Akrisae restores prayer, Linza counter-attack | 3 DMG / 4 | Set bonus page |
| Gemstone armour ("Enchanted touch") | Ranged | 3 / 4 / 5 | bolt-enchant procs at 40 / 70 / 100 % of base frequency | 3 DMG | Set bonus page |
| Ghost hunter / Demon slayer equipment | – | 1–3 | +3/6/10 % vs ghosts; +4 % per piece vs demons | 3 DMG (niche) | Set bonus page |
| Crystal / attuned crystal armour, Superior ports sets, Battle/Combat/Druidic robes, skilling outfits | – | – | no relevance for ability simulation | 4 | Set bonus page |

### B.3 Single items that change ability behaviour

| Item | Style | Effect (verbatim / numbers) | Class | Source |
|---|---|---|---|---|
| Igneous Kal-Ket (and Kal-Zuk) | Melee | Overpower "hits the target twice for 310-370% ability damage each (instead of once for 550-600%)" (Kal-Zuk page; Overpower update history: "average damage per hit: 300% → 340% (total damage: 600% → 680%)"; the Kal-Ket page still shows the pre-buff 280–340 %). PvP 55 %. Chaos Roar applies to both hits. | 2 CD (hit count) + 3 DMG | https://runescape.wiki/w/Igneous_Kal-Zuk , https://runescape.wiki/w/Overpower |
| Igneous Kal-Mej (and Kal-Zuk) | Magic | "Omnipower hits the target four times, each hit dealing 120%–150% ability damage (instead of once for 420-500%)." total 480–600 %, PvP 60 %. | 2 CD + 3 DMG | https://runescape.wiki/w/Igneous_Kal-Mej |
| Igneous Kal-Xil (and Kal-Zuk) | Ranged | "Deadshot hits the target eight times for 55-75% ability damage each (instead of 4 times for 105-125% each)." total 440–600 %, PvP 60 %. | 2 CD + 3 DMG | https://runescape.wiki/w/Igneous_Kal-Xil |
| Igneous Kal-Mor (and Kal-Zuk) | Necromancy | "Death Skulls bounces two additional times when used against monsters (6 bounces instead of 4)." Single target: 900–1,100 % (vs 675–825 %). PvP: no bounce. | 2 CD + 3 DMG | https://runescape.wiki/w/Igneous_Kal-Mor , https://runescape.wiki/w/Death_Skulls |
| Igneous Kal-Zuk | hybrid | all four effects above in one T100 cape | – | https://runescape.wiki/w/Igneous_Kal-Zuk |
| Greater Sunshine codex | Magic | "lasts 13 ticks longer for a total duration of 65 ticks (39 seconds)", damage buff 64 ticks; DoT 10–20 % every 1.8 s; "does not benefit from the Planted Feet perk" (PF only removes the DoT) | 2 CD | https://runescape.wiki/w/Greater_Sunshine |
| Greater Death's Swiftness codex | Ranged | "lasts 11 ticks longer for a total duration of 63 ticks (37.8 seconds)", buff 62 ticks; not affected by Planted Feet | 2 CD | https://runescape.wiki/w/Greater_Death's_Swiftness |
| Fleeting boots / Enhanced fleeting boots ("Winds End") | Ranged | "Piercing Shot reduces the cooldown of Snipe by an additional 2 ticks with each hit (6 ticks per hit instead of 4)"; "Basic Attack additionally applies the cooldown reduction effect of Piercing Shot (6 ticks per hit)." Snipe CD 60 s; Piercing Shot 2 hits → 7.2 s total with boots (4.8 s without). | 2 CD | https://runescape.wiki/w/Fleeting_boots , https://runescape.wiki/w/Snipe |
| Nightmare gauntlets / Enhanced ("Steady Hands") | Ranged | "+25% hit chance and allows movement when using the Snipe ability." Enchantment of dread (enhanced, after 9 s equipped): "Snipe fires an additional shot dealing 50% reduced damage against targets not facing you." (Flanking rules) | 3 DMG (+ hit count) | https://runescape.wiki/w/Enhanced_nightmare_gauntlets |
| Blast diffusion boots / Enhanced ("Inner Wrath") | Magic | "Using Wild Magic applies a self-buff called Blast Infused for 10 ticks"; "Blast Infused: basic Magic abilities gain +8% base damage" (incl. auto-attack and Combust; ≈ 3 basics fit) | 2 CD (buff) + 3 DMG | https://runescape.wiki/w/Blast_diffusion_boots |
| Kerapac's wrist wraps / Enhanced | Magic | "For 6 seconds after using the Dragon Breath, damage dealt from the Combust ability will happen instantly and deal 25% more damage." Enchantment of flames (enhanced, after 9 s): "from 25% to 40%". Not PvP. | 2 CD (Combust becomes instant) + 3 DMG | https://runescape.wiki/w/Enhanced_Kerapac's_wrist_wraps , https://runescape.wiki/w/Combust |
| Gloves of passage / Enhanced ("Enduring Ruin") | Melee | "After the Rend ability successfully hits: Your next melee attack within 6 seconds deals 10% increased damage. The target takes 20% increased damage from bleeds for 10 seconds. (Does not apply in PvP)". Enchantment of agony (enhanced, after 9 s): 10 → 16 % and 20 → 25 %. | 2 CD (timed buff/debuff) + 3 DMG | https://runescape.wiki/w/Enhanced_gloves_of_passage , https://runescape.wiki/w/Rend |
| Cinderbane gloves | hybrid | "1/8 (12.5%) chance to apply tier 2 poison on hit"; "+1 poison tier with another poison source"; re-applying on a poisoned target "will deal an additional poison hit and refresh the poison effect" (chain ≈ 1/7); multi-target abilities count per hit | 3 DMG (poison) | https://runescape.wiki/w/Cinderbane_gloves |
| Malletops (Anachronia Dinosaur Farm totem "Armoured Hide", Farming 117) | any | Tier 1: "Increases the duration of Barricade by 3 ticks, i.e. 1.8 seconds." Tier 2: "…by 6 ticks, i.e. 3.6 seconds." Stacks with Turtling. | 2 CD | https://runescape.wiki/w/Template:Anachronia_Dinosaur_Farm_totem_perks , https://runescape.wiki/w/Barricade |
| Ring of vigour (or unlocked passive) | any | "10% adrenaline is retained after an ultimate ability."; "When the weapon special attack is used, it only requires 90% of the normally required adrenaline" (also EoF specials) | 1 ADR | https://runescape.wiki/w/Ring_of_vigour |
| Asylum surgeon's ring | any | "10% chance to negate the adrenaline cost from using threshold abilities"; "40% chance of saving 25% of a special attack's original adrenaline cost" | 1 ADR | https://runescape.wiki/w/Passive_effect/Other_equipment/Ring |
| Ring of death | any | on kill "50% chance of restoring the wearer's adrenaline by 1% for every 1,500 of the target's maximum life points, to a maximum of 5% adrenaline" | 1 ADR | https://runescape.wiki/w/Ring_of_death |
| Jaws of the Abyss (helm) | Melee | "Basic Melee abilities generate an additional 2% adrenaline (1% in PvP) for each bleed affecting the target." | 1 ADR | https://runescape.wiki/w/Passive_effect/Clothing_and_armour/Head |
| Reaver's ring ("Reckless Assault") | any | "+5% critical strike chance. Reduces hit chance by 5%." (multiplicative: 50 % → 47.5 %) | 3 DMG | https://runescape.wiki/w/Reaver's_ring |
| Champion's ring ("Crimson Strikes") | Melee | "+3% critical strike chance against bleeding targets"; Enchantment of heroism (after 9 s): +1 % → 4 %, "+1.5% critical strike damage for each bleed affecting the target" (melee bleeds only) | 3 DMG | https://runescape.wiki/w/Champion's_ring |
| Channeller's ring ("Runic Embrace") | Magic | "+4% stacking critical strike chance per hit on Magic channelled abilities, including the first hit"; Enchantment of metaphysics: "+2.5% stacking critical strike damage per hit" | 3 DMG | https://runescape.wiki/w/Channeller's_ring |
| Stalker's ring ("Shadow's Mercy") | Ranged | "+3% critical strike chance when wielding a bow"; Enchantment of shadows: +1 % → 4 % and "+3% critical strike damage when using a bow" | 3 DMG | https://runescape.wiki/w/Stalker's_ring |
| Enchantment of affliction / savagery / dispelling | Nec / Mel / Rng | Inquisitor staff / terrasaur maul / hexhunter bow "+12.5% to +17.5% damage" vs their target class | 3 DMG | https://runescape.wiki/w/Enchantments |
| Shard of Genesis Essence enchantment | all T95 weapons | "Increases weapon damage and accuracy by 5 tiers." (T95 → T100 stats) | 3 DMG | https://runescape.wiki/w/Enchantments |
| Amulet of souls / EoF (soul part) | any | "Soul Split has a 50% chance to heal 25–50% more"; "base damage reduction of protection prayers … increased by 10% (giving them 60%)" | 4-def | https://runescape.wiki/w/Amulet_of_souls |
| Essence of Finality amulet | any | stores one weapon special attack usable via the EoF ability (adrenaline cost of the stored spec; ring of vigour discount applies) | 1 ADR / 2 CD (spec access) | https://runescape.wiki/w/Essence_of_Finality_amulet |
| Scripture of Ful ("Gladiator's Rage") | any | "6.6% chance on the release of a damaging attack … For 15 seconds, it increases damage dealt by 20% and damage taken by 10%. … 15 second cooldown" | 2 CD (buff) + 3 DMG | https://runescape.wiki/w/Scripture_of_Ful |
| Scripture of Jas ("Time Rift") | any | 6.6 % proc; "releases 20% of that tracked damage" after 17 ticks, cap 30,000, cannot crit; 15 s CD | 3 DMG | https://runescape.wiki/w/Scripture_of_Jas |
| Scripture of Wen ("Sheer Cold") | any | 6.6 % proc; 5 beam hits 2.4–4 % + shatter 240–400 % (3×3); 19-tick lockout | 3 DMG | https://runescape.wiki/w/Scripture_of_Wen |
| Erethdor's grimoire / Chaotic grimoire | any | "+12% critical strike chance" / "+7%" (additive with Biting) | 3 DMG | https://runescape.wiki/w/Erethdor's_grimoire |
| Kalphite defender (all defenders) | Melee | "+3% hit chance"; "6.6% chance to reduce incoming damage by 50-95% and grant your next attack +20% hit chance" | 3 DMG / 4-def | https://runescape.wiki/w/Template:Defender_passive_effect |
| Dark Shard of Leng ("Endless Frost") / Dark Sliver ("Boundless Chill") | Melee | Shard: "every hit has a 10% chance to apply a stack of Primordial Ice"; Sliver: 2 % chance on player → "Frostblades" 9 s: "flat damage to all melee ability hits equal to 24% of the player's ability damage" | 2 CD (buff) + 3 DMG | https://runescape.wiki/w/Dark_Shard_of_Leng |
| Bow of the Last Guardian ("Perfect Equilibrium") | Ranged | 8 stacks (1/hit) → extra hit "12%-16% ability damage and 33%-37% of the damage from the attack that triggered"; spec Balance by Force (30 % adren, no CD) lowers to 4 stacks for 30 s | 3 DMG / 1 ADR | https://runescape.wiki/w/Template:Perfect_Equilibrium_details |
| Fractured Staff of Armadyl ("Surging Storm") | Magic | "additively increases critical strike damage by 15%–25%"; spec Instability (50 % adren, 60 s CD): crits fire Lightning Surge 70–90 % for 30 s | 3 DMG / 2 CD | https://runescape.wiki/w/Surging_Storm |
| Ek-ZekKil ("Ashen Vow") | Melee | "+12% damage against their Flamebound Rival" (after spec Igneous Showdown, 50 % adren, 60 s CD, which also "Generates 15% Adrenaline") | 3 DMG / 1 ADR | https://runescape.wiki/w/Ashen_Vow |
| Tumeken's Light ("Purifying Light") | Melee | "Upon killing a monster, it deals 65%-75% melee damage to up to 4 additional enemies within 6 tiles" | 3 DMG | https://runescape.wiki/w/Purifying_Light |
| Omni guard ("Death Spark") / Soulbound lantern ("Soul Siphon") / Devourer's Guard ("Soul Reave") | Necromancy | 5 basic attacks → next basic double damage; +2 max Residual Souls; 4 basics → empowered basic gives +1 Residual Soul. Death Essence spec (30 % adren, 60 s CD): 360–440 %, readies Death Spark, ToD/FoD/Death Skulls ready Death Spark for 30 s. | 2 CD + 3 DMG | https://runescape.wiki/w/Template:Death_Spark_details |

### B.4 Counts

* Multi-piece **armour sets** with combat relevance on the Set bonus page: 30 (incl. Barrows/void/warpriest/ports). Of these, **8 sets (14 thresholds) change ability behaviour** (adrenaline / duration / cooldown / hit count): Vestments of havoc (2/3/4), Robes of the First Necromancer (4), Dracolich & Elite Dracolich (1/3/4/5), Tumeken's Resplendence (4/5), Achto ×3 (3+ cooldown reset), Nakatra "Song of Destruction" (1), Warpriest of Armadyl/Bandos (3). Torag's (target adrenaline drain) is PvP-only relevant.
* Pure damage/crit sets: Elite tectonic, Tectonic, Elite sirenic, Sirenic, Void, Warpriest of Tuska, Deathdealer, Barrows (Dharok/Verac/etc.), Gemstone, Ghost hunter, Demon slayer, Tumeken 3-piece, First Necromancer 2-piece.
* Defensive only: Trimmed masterwork / masterwork ranged & magic, Cryptbloom, Deathwarden, Warpriest Sara/Zam.
* **Single items changing ability behaviour: 24** (B.3 rows with class 1 or 2): 5 Igneous capes (4 distinct effects), 2 greater codices, fleeting boots, blast diffusion boots, Kerapac's wrist wraps, gloves of passage, Malletops totem, ring of vigour, asylum surgeon's ring, ring of death, Jaws of the Abyss, EoF, Scripture of Ful, Dark Sliver of Leng (Frostblades), FSOA (Instability), Ek-ZekKil (spec adrenaline), Omni guard (Death Essence), plus Nightmare gauntlets (extra Snipe shot with dread).

### B.5 Gaps / caveats

1. No bucket or template exposes set/item effect **numbers** as fields; everything in Part B is prose (templates or tables). A scraper must parse `Template:<Effect name>` bullet lists ("Set bonus (N): …") — the format is consistent for post-2021 sets (Herald of Chaos, Dracolich Remnant, Tumeken's Resplendence, Song of Destruction, Trimmed masterwork, Robes of the First Necromancer) but older sets only exist in the Set bonus table.
2. Inconsistencies found on the wiki (current values chosen from the most recently edited page): Tumeken 4-piece "25 % less" (Set bonus table) vs "40 % less" (template + Asphyxiate page, 2026); Igneous Kal-Ket Overpower 280–340 % (item page) vs 310–370 % (Kal-Zuk page + Overpower update history); `Passive effect/…/Feet` still lists an old Rapid Fire effect for fleeting boots.
3. `Dracolich infusion` buff-details bucket entry is empty; duration/crit values come from the set template only.
4. Order of operations for First Necromancer +25 % conjure duration vs Spirit Pact flat +18 s is not documented on the wiki.
5. Perk per-rank values are only in prose; Clear Headed ranks 3–4 tick values are not tabulated on the wiki (derived from "one additional second per rank").
6. Set bonus master table has no "activation delay" column; the 9 s (Dracolich) / 5.4 s (Tumeken) / 9 s (enchantment upgrades) delays are only in the templates / item pages.
7. `Optimal PvM perk setup` is flagged `{{Outdated}}` since the July 2026 rebalance – do not use it for material/perk-weight data; use `Calculator:Perks` (a Lua-driven calculator page, not fetched here) if perk probabilities are ever needed.

### B.6 Scratch files (local, for re-parsing)

`C:\Users\marho\AppData\Local\Temp\claude\C--Users-marho\9ef9ceb0-d16e-41a1-847b-ed36272e9906\scratchpad\` — `perk_wikitext.json` (all 84 perk pages), `perk_rows.json` (parsed infobox), `set_bonus.txt`, `effect_templates.json`, `set_wikitext*.json`, `ability_wikitext.json`, `passive_subpages.json`, `fetch.py` (API helper).
