# RS3 weapon data from the RuneScape Wiki (Bucket API)

Research state: 3 September 2026. All URLs below were executed with
`User-Agent: rs3-ability-trainer/0.2` against `https://runescape.wiki/api.php`.
Raw dumps used for the counts (`bonuses_all.json`, `items.json`, `specs.json`,
`removal.json`) are reproducible with the URLs in section 2.

## TL;DR

* One bucket, `infobox_bonuses`, holds every equipment infobox on the wiki
  (10 499 rows, 9 567 distinct pages). Weapons are the rows with
  `equipment_slot` in `main hand weapon | off-hand weapon | 2h weapon` and
  `combat_class` in `melee | ranged | magic | necromancy`.
* Icons + item ids come from `infobox_item` (33 829 rows), joined on `page_name`
  (or `page_name_sub` when the bonuses row carries a `#version`).
* Special attacks come from `infobox_weapon_special_attack` (78 rows, 102 weapon
  pages). `infobox_bonuses` does not reference specs; join on the spec's `weapon` (PAGE list).
* There is no explicit "removed" flag in `infobox_bonuses`; use the `removal_date`
  bucket (4 883 rows) as a blacklist. Only 20 weapon pages are affected.
* Attack speed is still stored (`weapon_attack_speed`) even though the March 2026
  Combat Style Modernisation unified all weapons to 3 ticks; the wiki keeps it because
  the *ability damage* formula still needs the old speed multiplier.
* Proposed filter (section 4) yields 2 041 fightable weapons across all tiers,
  627 at tier >= 70, 245 at tier >= 85.

---

## 1. Buckets that exist

`https://runescape.wiki/api.php?action=query&list=allpages&apnamespace=9592&aplimit=500&format=json`
returns 88 `Bucket:` pages. The equipment-relevant ones:

| Bucket | Purpose |
|---|---|
| `Bucket:Infobox bonuses` | combat stats of every equipable item (`{{Infobox Bonuses}}`) |
| `Bucket:Infobox item` | item metadata (`{{Infobox Item}}`): name, image, ids, tradeable, disassembly |
| `Bucket:Infobox weapon special attack` | one row per weapon special attack |
| `Bucket:Removal date` | pages that carry a removal date (removed content) |
| `Bucket:Disassembly` | Invention disassembly categories (not needed for combat) |
| `Bucket:Item id` | item id -> page mapping (alternative to `infobox_item.item_id`) |

Other buckets (not equipment): Infobox ability, Infobox monster, Infobox spell, Infobox
prayer, Infobox familiar, Infobox buff, Dropsline, Recipe, Quest, ... (full list in the
API response above).

### 1.1 Schema `Bucket:Infobox bonuses`

`https://runescape.wiki/index.php?title=Bucket:Infobox_bonuses&action=raw`

```json
{
  "combat_class": {"type": "TEXT"},
  "equipment_slot": {"type": "TEXT"},
  "equipment_type": {"type": "TEXT"},
  "weapon_damage": {"type": "TEXT"},
  "weapon_accuracy": {"type": "TEXT"},
  "attack_style": {"type": "TEXT"},
  "attack_range": {"type": "TEXT"},
  "equipment_armour": {"type": "TEXT"},
  "equipment_life_points": {"type": "INTEGER"},
  "weapon_attack_speed": {"type": "TEXT"},
  "prayer_bonus": {"type": "DOUBLE"},
  "strength_bonus": {"type": "DOUBLE"},
  "ranged_bonus": {"type": "DOUBLE"},
  "magic_bonus": {"type": "DOUBLE"},
  "necromancy_bonus": {"type": "DOUBLE"},
  "equipment_tier": {"type": "INTEGER"},
  "degradation_charges": {"type": "TEXT"},
  "invention_tier": {"type": "TEXT"},
  "is_cosmetic_recolour": {"type": "BOOLEAN"},
  "has_integer_bonuses": {"type": "TEXT"},
  "pvm_damage_reduction": {"type": "DOUBLE"},
  "pvp_damage_reduction": {"type": "DOUBLE"},
  "json": {"type": "TEXT", "index": false}
}
```

Every bucket row additionally has the implicit columns `page_name` (article title) and
`page_name_sub` (`page_name` + `#version` when the infobox has several versions,
e.g. `Zaros godsword#new`, `Omni guard#Innate Mastery`).

The `json` column is a JSON string written by `Module:Infobox Bonuses new`
(function `bucketjsonarg`) and carries the *raw* infobox values, including keys that are
not separate columns: `style`, `type`, `speed`, `charges`, `invention`, `tier_damage`,
`tier_accuracy`, `tier_armour`, `tier_armour_damage`, `ability_damage`,
`ability_damage_note`, `requirements` (HTML), `meleeaccuracy/rangedaccuracy/...`.

### 1.2 Schema `Bucket:Infobox item`

`https://runescape.wiki/index.php?title=Bucket:Infobox_item&action=raw`

```json
{
  "item_name": {"type": "TEXT"},
  "image": {"type": "PAGE", "repeated": true},
  "is_members_only": {"type": "BOOLEAN"},
  "item_id": {"type": "INTEGER", "repeated": true},
  "item_id_historical": {"type": "INTEGER", "repeated": true},
  "examine": {"type": "TEXT"},
  "league_region": {"type": "TEXT"},
  "high_alchemy_value": {"type": "INTEGER"},
  "low_alchemy_value": {"type": "INTEGER"},
  "tradeable": {"type": "BOOLEAN"},
  "stackable": {"type": "BOOLEAN"},
  "bankable": {"type": "BOOLEAN"},
  "stacks_in_bank": {"type": "BOOLEAN"},
  "lendable": {"type": "BOOLEAN"},
  "disassembleable": {"type": "TEXT"},
  "noteable": {"type": "BOOLEAN"},
  "value": {"type": "INTEGER"},
  "weight": {"type": "DOUBLE"},
  "version_anchor": {"type": "TEXT"},
  "buy_limit": {"type": "INTEGER"},
  "exchange_page": {"type": "PAGE"},
  "location_restriction": {"type": "TEXT"},
  "kept_on_death": {"type": "TEXT"},
  "calculated_value": {"type": "TEXT"},
  "estimated_market_value": {"type": "TEXT"}
}
```

### 1.3 Schema `Bucket:Infobox weapon special attack`

`https://runescape.wiki/index.php?title=Bucket:Infobox_weapon_special_attack&action=raw`

```json
{
  "name": {"type": "TEXT"},
  "image": {"type": "PAGE", "repeated": true},
  "weapon": {"type": "PAGE", "repeated": true},
  "style": {"type": "TEXT"},
  "target": {"type": "TEXT"},
  "is_members_only": {"type": "BOOLEAN"},
  "json": {"type": "TEXT", "index": false}
}
```

`json` keys: `description` (wikitext, contains the damage % lines), `damage`,
`adrenaline`, `cooldown`, `target`, `weapon`, `image`, `anim`, `sfx`, `buffs` (16 rows),
`removal` (1 row).

### 1.4 Schema `Bucket:Removal date`

```json
{"date_text": {"type": "TEXT"}, "date": {"type": "INTEGER"},
 "year": {"type": "INTEGER"}, "month": {"type": "INTEGER"}, "day": {"type": "INTEGER"}}
```

---

## 2. Querying a bucket (`action=bucket`)

The API module takes a single `query` parameter with Bucket-Lua syntax:

```
bucket('<name>').select('f1','f2',...).where(...).limit(N).offset(N).run()
```

Observed behaviour:

* `limit` up to **5000** works; page via `offset`. Default without `limit` is 500.
* `.where('field', value)` = equality. Comparison: `.where('field', '>=', 90)`.
  **The operator must be URL-encoded** (`%3E%3D`); a literal `>=` in the URL is rejected
  by the CDN with HTTP 400 (HTML "Bad Request", not JSON).
* Category filter: `.where({'Category:Removed content'})` and
  `.where(bucket.Not({'Category:Removed content'}))` (this is what
  `Module:SpecialAttackList` uses to separate "Removed" specs). Braces must be
  URL-encoded (`%7B` / `%7D`).
* `NULL` columns are simply omitted from the returned objects.
* `BOOLEAN` true comes back as `""` (empty string), false as absent (see
  `is_cosmetic_recolour`, `tradeable`, `is_members_only`).
* Response shape: `{"bucketQuery": "...", "bucket": [ {...}, ... ]}`; errors as
  `{"bucketQuery": ..., "error": "..."}`.

Tested URLs:

Single item (Zaros godsword):

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_bonuses').select('page_name','equipment_tier','equipment_slot','combat_class','equipment_type','weapon_damage','weapon_accuracy','weapon_attack_speed').where('page_name','Zaros%20godsword').run()
```

Necromancy main hands tier >= 90 (comparison operator encoded):

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_bonuses').select('page_name_sub','equipment_tier').where('combat_class','necromancy').where('equipment_slot','main%20hand%20weapon').where('equipment_tier','%3E%3D',90).limit(500).run()
```
-> `Death guard (tier 90)`, `Omni guard#Normal`, `Omni guard#Innate Mastery`,
`Augmented Death guard (tier 90)`, `Augmented Omni guard#Normal`, ...,
`Omni guard (Barrows)#Normal`, ...

Full dump (3 requests):

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_bonuses').select('page_name','page_name_sub','combat_class','equipment_slot','equipment_type','weapon_damage','weapon_accuracy','attack_style','attack_range','equipment_armour','equipment_life_points','weapon_attack_speed','prayer_bonus','strength_bonus','ranged_bonus','magic_bonus','necromancy_bonus','equipment_tier','degradation_charges','invention_tier','is_cosmetic_recolour','has_integer_bonuses','pvm_damage_reduction','pvp_damage_reduction','json').limit(5000).offset(0).run()
```
(then `offset(5000)`, `offset(10000)`; pages returned 5000 / 5000 / 499 rows = 10 499.)

Removed specs:

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_weapon_special_attack').select('name','weapon','style').where(%7B'Category:Removed%20content'%7D).limit(500).run()
```
-> one row: `Igneous Cleave` / `Ek-ZekKil`.

---

## 3. What `infobox_bonuses` contains

Total: **10 499 rows / 9 567 distinct `page_name`** (multiple rows per page = infobox
versions, distinguished by `page_name_sub`).

### 3.1 How weapons are identified

`equipment_slot` (17 values):

| slot | rows | notes |
|---|---|---|
| `main hand weapon` | 1 367 | |
| `2h weapon` | 1 205 | |
| `off-hand weapon` | 851 | off-hand weapons **and** defenders/rebounders/reprisers/necro lanterns |
| `off-hand` | 359 | shields (`equipment_type = Shield`, 317) + misc (satchels, bug lantern, ...) |
| `head`, `torso`, `legs`, `back`, `feet`, `hands`, `neck`, `pocket`, `ammo`, `ring`, `aura`, `sigil` | rest | armour etc. |

`combat_class` (7 values): `none` 3 426, `melee` 2 883, `ranged` 1 387, `magic` 1 268,
`hybrid` 1 187, `necromancy` 343, missing 5. Weapon-slot rows with class `none`/`hybrid`
are junk for a simulator (greegrees, pet rocks, croziers, broken pickaxes, gnomeball...).

`equipment_tier` (INTEGER): 0 for untiered items (3 551 rows), otherwise 1..114.

`equipment_type` is **not** a weapon-type taxonomy. It is only set for 3 592 rows and
holds: `Tank armour`, `Power armour`, `Power Hybrid armour`, `Shield`, `Prevents attack`,
`Cosmetic`, `Spear`, `PvP armour`, `Hybrid armour`, `Halberd`, `Chargebow`, `Longbow`,
`Defender`, `Rebounder`, `Repriser`, `Shieldbow`, plus a malformed
`{"1":"Spear","2":"Halberd"}` (4 rows). So there is no "Sword"/"Bow"/"Crossbow" field;
the closest proxy is `attack_style` (`slash|crush|stab|arrows|bolts|thrown|spell-casting|necromancy`)
together with `attack_range` and `weapon_attack_speed`. Halberd/spear (reach) and
chargebow/shieldbow are flagged via `equipment_type`.

`attack_style` distribution in weapon slots: slash 841, spell-casting 632, crush 494,
stab 425, bolts 328, arrows 271, thrown 136, necromancy 133.

### 3.2 Versions (`page_name_sub` suffixes) among weapon rows

`''` 1 871, `new` 319, `unbound` 261, `charged` 254, `Normal` 152, `Innate Mastery` 152,
numeric Dungeoneering/enhancement levels (`1`, `40`, `20`, ...), `bonus`, `usable`, ...

* Degradable weapons only carry the `#new` row (no `#used`/`#broken` in this bucket).
* Every tier-95 boss weapon (and each dyed copy) has two rows: `#Normal` and
  `#Innate Mastery` (Shard of Genesis Essence enchantment -> tier-100 stats:
  accuracy 2765 -> 3100, damage x1.05, `tier_accuracy`/`tier_damage` = 100 in `json`).
* Augmented items are their own pages (`Augmented Zaros godsword`; 812 pages, 548 in
  weapon slots) with suffix `#charged`/`#uncharged`.
* Dyed cosmetics are their own pages: `X (blood)`, `X (ice)`, `X (shadow)`,
  `X (Barrows)`, `X (Third Age)` (492 weapon rows), plus `(or)` / `(Soul)` for the
  ornament/soul variants of Omni guard / Soulbound lantern.
* `is_cosmetic_recolour` is set on 1 476 rows, but it is *not* the dye flag (it marks
  recolour infobox versions like `Pet rock (red)`); filter dyes by name suffix instead.

### 3.3 "Removed" items

No flag in `infobox_bonuses`. Cross-reference the `removal_date` bucket
(`bucket('removal_date').select('page_name','date_text','year').limit(5000).run()`,
4 883 rows). Intersection with weapon pages is only 20 pages:
Academy 2h sword/crossbow/dagger/knife/mace/scimitar/shortbow/wand, Basket of eggs,
Enchanted/Exploding snowball, Ghost buster 500 (colours), Imcando pickaxe (e),
Impling net, Poisoned dagger (p). Alternatively filter with
`.where(bucket.Not({'Category:Removed content'}))` (verified on the spec bucket,
not yet on `infobox_bonuses`).

### 3.4 Special attack reference

`infobox_bonuses` has **no** field or `json` key pointing to a special attack.
The link is the other way round: `infobox_weapon_special_attack.weapon` is a repeated
PAGE column listing the weapon pages. 78 spec rows, 102 distinct weapon pages, all of
which exist in the weapon set of `infobox_bonuses` (checked). Styles: Melee 39,
Ranged 20, Magic 16, Necromancy 3. Category `Weapons that have special attacks` has
365 pages (includes augmented/dyed copies) and `Weapons which previously had special
attacks` has 5.

Example spec row (`Clobber`):

```json
{"page_name": "Clobber", "page_name_sub": "Clobber", "name": "Clobber", "style": "Melee",
 "target": "Single", "is_members_only": "",
 "image": ["File:Dragon hatchet.png", "File:Crystal hatchet.png"],
 "weapon": ["Dragon hatchet", "Crystal hatchet"],
 "json": "{\"description\":\"Hack at your target, reducing their stats.\\n* 90-110% [[File:Ability damage.png|16px]] Melee damage.\\n* ...\",\"adrenaline\":\"<span class=\\\"text-red\\\">-30%</span>\",\"damage\":\"100%\",\"cooldown\":\"[[File:Ability timer.png|20px]]0 seconds (0 ticks)\",\"weapon\":\"[[Dragon hatchet]]<br>[[Crystal hatchet]]\", ...}"}
```

### 3.5 Example rows (verbatim from the API, `json` pretty-printed)

**Zaros godsword** (`page_name_sub = Zaros godsword#new`):

```json
{"page_name": "Zaros godsword", "page_name_sub": "Zaros godsword#new",
 "combat_class": "melee", "equipment_slot": "2h weapon", "equipment_tier": 92,
 "attack_style": "slash", "attack_range": "1", "weapon_attack_speed": "6",
 "weapon_damage": "2056.2", "weapon_accuracy": "2577", "equipment_armour": "0.0",
 "equipment_life_points": 0, "prayer_bonus": 0, "strength_bonus": 0, "ranged_bonus": 0,
 "magic_bonus": 0, "necromancy_bonus": 0, "degradation_charges": "60000",
 "pvm_damage_reduction": 0, "pvp_damage_reduction": 0,
 "json": {"class": "melee", "slot": "2h weapon", "style": "slash", "tier": 92,
          "speed": "6", "damage": 2056.2, "accuracy": 2577, "ability_damage": "1324.8",
          "ability_damage_note": "1324.8", "attack_range": 1, "charges": 60000,
          "armour": "0.0", "lp": 0, "prayer": 0, "strength": 0, "ranged": 0, "magic": 0,
          "necromancy": 0, "meleeaccuracy": 0, "rangedaccuracy": 0, "magicaccuracy": 0,
          "necromancyaccuracy": 0,
          "requirements": "<span class=\"skillreq\" data-skill=\"Attack\" data-level=\"92\" ...>92 [[File:Attack-icon.png|...]]</span>"}}
```

**Ascension crossbow** (single version):

```json
{"page_name": "Ascension crossbow", "page_name_sub": "Ascension crossbow",
 "combat_class": "ranged", "equipment_slot": "main hand weapon", "equipment_tier": 90,
 "attack_style": "bolts", "attack_range": "7", "weapon_attack_speed": "4",
 "weapon_damage": "0", "weapon_accuracy": "2458", "degradation_charges": "30000",
 "json": {"class": "ranged", "slot": "main hand weapon", "style": "bolts", "tier": 90,
          "speed": "4", "damage": 0, "accuracy": 2458, "attack_range": 7, "charges": 30000,
          "ability_damage": "864",
          "ability_damage_note": "<span class=\"hover-text\" title=\"Assuming tier 90 or higher ammunition is used\">864</span>",
          "requirements": "... data-skill=\"Ranged\" data-level=\"90\" ..."}}
```
Note `weapon_damage = 0` for ammo-based ranged and for magic weapons: the tooltip damage
comes from ammo/spell; `json.ability_damage` is the tier-derived value.

**Omni guard** (two versions):

```json
[{"page_name": "Omni guard", "page_name_sub": "Omni guard#Normal",
  "combat_class": "necromancy", "equipment_slot": "main hand weapon", "equipment_tier": 95,
  "attack_style": "necromancy", "attack_range": "6", "weapon_attack_speed": "6",
  "weapon_damage": "1415.5", "weapon_accuracy": "2765",
  "json": {"tier": 95, "tier_accuracy": 95, "tier_damage": 95, "speed": "6",
           "damage": 1415.5, "accuracy": 2765, "ability_damage": "912", "...": "..."}},
 {"page_name": "Omni guard", "page_name_sub": "Omni guard#Innate Mastery",
  "combat_class": "necromancy", "equipment_slot": "main hand weapon", "equipment_tier": 95,
  "weapon_damage": "1490", "weapon_accuracy": "3100",
  "json": {"tier": 95, "tier_accuracy": 100, "tier_damage": 100, "speed": "6",
           "damage": 1490, "accuracy": 3100, "ability_damage": "960", "...": "..."}}]
```

---

## 4. Proposed filter: "weapons a player can actually fight with"

```
equipment_slot   in ('main hand weapon', 'off-hand weapon', '2h weapon')
combat_class     in ('melee', 'ranged', 'magic', 'necromancy')
page_name        not starting with 'Augmented '           (augmented = same stats, own page)
page_name        not matching / \((blood|ice|shadow|Barrows|Third Age|Soulflame|or|Soul)\)$/
page_name        not in removal_date bucket
one row per page_name, preferring page_name_sub suffix
                 '' | 'new' | 'Normal'  >  'unbound' | 'usable'  >  'charged'  >  'Innate Mastery'
                 (keep the 'Innate Mastery' row as an optional upgrade flag)
equipment_tier   >= T   (T configurable; tier 0 rows are toys such as Dramen staff, boxing gloves)
```

Shields and defenders are handled separately (section 6).

Counts with this filter (one row per page, all four styles; 2 041 rows at tier >= 1):

| tier >= | total | melee MH / OH / 2H | ranged MH / OH / 2H | magic MH / OH / 2H | necro MH / OH / 2H |
|---|---|---|---|---|---|
| 1  | 2 041 | 689 / 344 / 277 | 121 / 87 / 139 | 74 / 65 / 192 | 27 / 26 / 0 |
| 50 | 946 | 227 / 159 / 161 | 59 / 49 / 86 | 39 / 40 / 91 | 18 / 17 / 0 |
| 70 | 627 | 130 / 89 / 131 | 36 / 32 / 65 | 27 / 28 / 64 | 13 / 12 / 0 |
| 80 | 386 | 82 / 61 / 55 | 23 / 23 / 40 | 21 / 22 / 38 | 11 / 10 / 0 |
| 85 | 245 | 50 / 34 / 30 | 15 / 14 / 30 | 18 / 18 / 21 | 8 / 7 / 0 |
| 90 | 188 | 36 / 23 / 20 | 10 / 11 / 26 | 15 / 15 / 17 | 8 / 7 / 0 |

Necromancy has no 2h weapons (guard = main hand, lantern = off-hand; both `attack_range 6`).
For a simulator UI, tier >= 70 (627 rows) is a sensible default; tier >= 1 still fits in
a single JSON file (~2 000 rows x ~15 fields).

Recommendation for the pipeline: dump the whole bucket (3 requests) and filter locally
rather than composing many `where` queries; the `page_name` regex rules and the
"one row per page" logic cannot be expressed in the query language.

### 4.1 Icon and page name

* Page name = `page_name` (URL: `https://runescape.wiki/w/<page_name, spaces -> _>`).
* Icon: `infobox_item.image` (repeated PAGE, e.g. `["File:Omni guard.png"]`). Join on
  `page_name_sub` first (`Zaros godsword#new` exists in both buckets), fall back to
  `page_name` (`Omni guard#Normal` in bonuses vs. `Omni guard` / `version_anchor DEFAULT`
  in items). Only 2 weapon pages lack an `infobox_item` row (`Mindspike`, `Tower mindspike`,
  disambiguation-style pages).
* Direct image URL (tested, HTTP 200 image/png):
  `https://runescape.wiki/images/<File name without "File:", spaces -> underscores>`
  e.g. `https://runescape.wiki/images/Zaros_godsword.png`. Canonical URL with cache-buster
  via `?action=query&titles=File:Omni_guard.png&prop=imageinfo&iiprop=url|size&format=json`
  -> `https://runescape.wiki/images/Omni_guard.png?c184b` (27x29 px inventory icon).
* Item id(s): `infobox_item.item_id` (repeated INTEGER), e.g. Zaros godsword new 37640,
  used 37642, broken 37643; Omni guard 55480.

`infobox_item` dump URL (7 requests of 5000):

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_item').select('page_name','page_name_sub','item_name','image','item_id','is_members_only','disassembleable','tradeable','version_anchor','league_region').limit(5000).offset(0).run()
```

---

## 5. Fields needed later for damage

| need | where | notes |
|---|---|---|
| tier | `equipment_tier` (INTEGER); `json.tier`, plus `json.tier_damage` / `json.tier_accuracy` when they differ (400 rows, e.g. Seercull 50/52/50, sighted longbows, Innate Mastery = 100/100) | use `tier_damage` for damage, `tier_accuracy` for hit chance when present |
| weapon damage (tooltip) | `weapon_damage` (TEXT, numeric string; all weapon rows parse as numbers) | 0 for magic and ammo-based ranged weapons |
| weapon accuracy | `weapon_accuracy` (TEXT, numeric string) | |
| attack speed | `weapon_attack_speed` (TEXT): `4` 1 274, `6` 1 218, `5` 512, `3` 20 (necro conduits/siphons), `12` 5 (Dark bow, Gloomfire bow), plus legacy words `fastest`/`fast`/`average`/`slowest` (still used on ~170 weapon rows, e.g. Roar of Awakening = `fastest`), `no` for non-weapons | **Still present after the 2026 update.** The wiki hid the row in the infobox (module comment: "Hide speed param after 2026 Combat Style Modernisation ... it still exists") because ability damage is still derived from it. Normalise: `fastest`->4, `fast`->5, `average`->6, `slowest`->12 |
| ability damage | `json.ability_damage` (string number) | computed by `Module:Infobox Bonuses new`: melee/necro = `damage * mult(speed)` with mult 4/3/fastest = 1, 5/fast = 192/245, 6/average = 96/149; ranged non-thrown = `tier * slotMult` (MH 9.6, OH 4.8, 2H 14.4, repriser tier/2, shieldbow counts as MH); magic = tier-based likewise. Present on every filtered row with tier >= 70 |
| style | `attack_style` / `json.style` (`slash|crush|stab|arrows|bolts|thrown|spell-casting|necromancy`) | 32 melee + 6 ranged core rows lack it |
| range | `attack_range` / `json.attack_range` (1..10) | halberd/spear reach via `equipment_type` |
| degradation | `degradation_charges` / `json.charges` | |
| Augmentable | **no column.** Derive: an `Augmented <page_name>` page exists in `infobox_bonuses` (466 of the filtered weapons); more complete than `Category:Augmentable items` (272 pages). `invention_tier` / `json.invention` holds the Invention level on the *augmented* pages | |
| requirements | `json.requirements` (HTML with `data-skill` / `data-level`) | parse with regex `data-skill="(\w+)" data-level="(\d+)"` |
| members | `infobox_item.is_members_only` | |

Style bonus columns (`strength_bonus`, `ranged_bonus`, `magic_bonus`, `necromancy_bonus`)
are the flat damage bonuses that armour/jewellery carry; they are 0 on weapons.
`pvm_damage_reduction` / `pvp_damage_reduction` are armour fields.

Context: the Combat Style Modernisation update (2 March 2026,
`https://runescape.wiki/w/Combat_Style_Modernisation`) states "All weapons (of all
styles) were unified to a 3-tick attack speed, and thus the speed was removed from
tooltips - the overall ability damage of weapons is the same." The `Attack rate` page
(`Attack speed` redirects there) keeps the historical weapon speed table (3 = necro
siphons/conduits; 4 = claws, daggers, defenders, maces, scimitars, whips, crossbows,
darts, knives, reprisers, wands; 5 = hastae, longswords, rapiers, shortbows, chinchompas;
6 = battleaxes, halberds, mauls, spears, 2h swords, javelins, shieldbows, 2h crossbows,
staves; 12 = Dark bow, Gloomfire bow).

---

## 6. Shields, defenders, conduits, Essence of Finality

### 6.1 Slot / type representation

| item family | `equipment_slot` | `equipment_type` | `combat_class` | example |
|---|---|---|---|---|
| shields (kite, square, spirit, ...) | `off-hand` | `Shield` | melee/magic/ranged/hybrid/necromancy | `Rune kiteshield` (melee, 50), `Elemental shield` (magic, 1) |
| melee defenders | `off-hand weapon` | `Defender` | melee | `Kalphite defender` (90, stab, dmg 216, acc 2458) |
| magic rebounders | `off-hand weapon` | `Rebounder` | magic | `Kalphite rebounder`, `Blighted rebounder#new`, `Ancient lantern#new` (typed Rebounder) |
| ranged reprisers | `off-hand weapon` | `Repriser` | ranged | `Kalphite repriser`, `Tainted repriser#new`, `Ancient repriser#new` |
| necromancy lanterns (off-hand conduit) | `off-hand weapon` | (none) | necromancy | `Soulbound lantern`, `Skull lantern (tier 90)`, `<metal> lantern` (Dungeoneering) |
| necromancy guards / siphons (main hand) | `main hand weapon` | (none) | necromancy | `Omni guard`, `Death guard (tier 90)`, `Devourer's Guard`, `<metal> guard` |
| off-hand slot misc | `off-hand` | none | none/hybrid | satchels, bug lantern, Defensive shield (quest): drop these |

Counts after dedupe (no augmented/dyed/removed): shields 264 (melee 172, magic 38,
ranged 30, hybrid 21, necromancy 3; tier >= 70: 39/13/12/2/1), defender-type 18
(12 Defender, 3 Rebounder, 3 Repriser). Shields carry `weapon_attack_speed = "no"`
and `equipment_armour`/`equipment_life_points` instead of weapon stats; defenders carry
weapon damage/accuracy (`ability_damage` present). Necromancy conduits are not typed
"conduit" anywhere; they are just `necromancy` + slot.

Shield query:
```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_bonuses').select('page_name_sub','combat_class','equipment_tier','equipment_armour','equipment_life_points').where('equipment_slot','off-hand').where('equipment_type','Shield').limit(5000).run()
```

### 6.2 Essence of Finality (EoF) sources

There is **no bucket, category or list of "weapons that can be dismantled into an
EoF"**. The rule from `Essence of Finality amulet`: the amulet stores the Weapon
Special Attack "from any weapon in the game with one (provided that the player meets the
requirements to wield said weapon)". So the machine-readable EoF source list is exactly
the `infobox_weapon_special_attack` bucket:

```
https://runescape.wiki/api.php?action=bucket&format=json&query=bucket('infobox_weapon_special_attack').select('page_name','name','style','target','weapon','image','is_members_only','json').limit(500).run()
```

78 specs / 102 weapon pages; exclude rows in `Category:Removed content` (currently only
`Igneous Cleave` / Ek-ZekKil, which also has `json.removal`). The `Essence of Finality`
ability page (`https://runescape.wiki/w/Essence_of_Finality`) documents behaviour
differences only in prose plus one ranged table ("Affected" by Locate/chinchompa AoE),
not bucketed. The spec's damage line is only in `json.description` wikitext
(e.g. "90-110% ... Melee damage"); `json.damage` is a coarse "100%" string.

---

## 7. Gaps / caveats

1. No weapon *type* taxonomy (sword, bow, crossbow, wand...). Only `attack_style`,
   `attack_range`, speed, and the few `equipment_type` values (Halberd, Spear, Chargebow,
   Longbow, Shieldbow, Defender, Rebounder, Repriser). A type label must be inferred
   from names or `Category:Weapon types` subcategories if needed.
2. No "removed"/"historical" flag in `infobox_bonuses`; use `removal_date` or the
   category-based `where`.
3. No "augmentable" column; derive from the existence of an `Augmented X` page.
4. `weapon_attack_speed` mixes numeric ticks and legacy words; must be normalised.
5. Boolean columns return `""` for true and are absent for false.
6. Dungeoneering weapons (`Primal`, `<metal> guard/lantern`, versions `#1`..`#70` for
   enhancement levels) inflate the tier <= 60 counts; consider excluding
   `Category:Dungeoneering items` if the simulator is surface-only.
7. `infobox_bonuses` covers *pages*, not item ids; `Death guard (tier 90)` and
   `Skull lantern (tier 90)` are separate pages, while Dungeoneering guards use
   `#<level>` versions on one page.
8. The API help for `action=bucket` documents only the `query` parameter; the Lua
   syntax (`select/where/limit/offset/bucket.Not`) was verified empirically and by
   reading `Module:SpecialAttackList`.
