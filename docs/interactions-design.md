# Ability interactions – simulator design

State: 2026-09-03, branch `feature/interactions`. Source of truth: `docs/research/*.md` (wiki quotes per rule,
state after the Combat Style Modernisation of 2 March 2026). Every rule in the code carries the wiki URL.

## 1. What the engine simulates (and what not)

Simulated per tick, exactly as documented: GCD, internal cooldowns (incl. charges, shared cooldowns, resets,
reductions, overrides while a buff is active), adrenaline (gains, costs, thresholds, per-hit gains, drains,
over-time), style resources (Bloodlust, Necrosis, Residual Souls, Storm Shards), buffs/debuffs with real
durations, extensions and consumption, requirements (stacks, buffs, conjures, adrenaline windows, Limitless),
sequence abilities (Dismember → Slaughter → Massacre, Spectral Scythe 1→2→3, Conjure X ↔ Command X), channels
(hit schedule, cancel by the next ability, "complete channel" effects), off-GCD abilities.

Not simulated (data is stored for later): damage numbers, hit chance, target life points (Punish < 50 %,
Flurry missing-HP bonus, Spectral Scythe cast 3 scaling), damage taken (Preparation, Revenge, Divert, Reflect,
Resonance heals), PvP, familiar/equipment procs beyond the loadout. Critical strikes are rolled (10 % base,
+ Wild Magic, guaranteed for Greater Fury / Smoke Tendrils / Shadow Tendrils) only where adrenaline depends on
them (Tsunami +8 % per magic crit).

## 2. Data corrections

- Add `Runic Charge` (magic utility, off-GCD, 50-tick cooldown → Anima Charged 25 ticks).
- Remove `Demoralise` (removed 2 March 2026; Constitution version never existed).
- Off-GCD list = Surge, Escape, Dive, Bladed Dive, Provoke, Limitless, Runic Charge. **Anticipation and
  Freedom are normal GCD abilities** (our old list was wrong). Bladed Dive / Provoke: inside the GCD no
  adrenaline and no GCD; outside the GCD they behave like a normal basic (+9 %, start a GCD).
- Thresholds (Devotion, Revenge, Reflect, Debilitate, Shatter, Reprisal): require 50 %, drain 15 %.
- Charges: Backhand, Impact, Binding Shot have 2 charges (level 54+), independent cooldowns.
- Durations/cooldowns where the wiki pages disagree, decided as in the research files (e.g. Berserk 33 ticks,
  Death Skulls in Living Death 17 ticks, Sunshine 50 / Greater 63, Death's Swiftness 50 / 63 with Planted
  Feet, Snap Shot no cooldown, second stun charge at 54).

## 3. Rule model (`src/app/engine/rules.ts`)

Per ability a `Rules` object, evaluated by the engine at fixed hook points:

```
canCast(ability, state)        -> null | reason           requirements
cost(ability, state)           -> adrenaline cost         Flow, Necrosis, Limitless, Glacial Embrace (later)
cooldown(ability, state)       -> ticks                   Living Death→Death Skulls 17, Berserk→Overpower 15
onCast(ability, state)         -> effects                 stacks, buffs, resets, sequence steps, consume buffs
onHit(ability, hitIndex, state)-> effects                 per-hit adrenaline, cooldown reductions, buff extension
onTick(state)                  -> effects                 adrenaline per tick (Meteor Strike), expiry
```

Effect vocabulary (all data, no ability-specific code in the engine):

| effect | examples |
|---|---|
| `stack +n / -n / set / consume-if ≥ n` | Bloodlust +1 per melee basic (Rend +2, ×2 in Berserk, cap 4/8); Assault/Hurricane/Flurry consume 4; Necrosis +4 (ToD), +2 basic attack in Living Death, Finger of Death consumes ≤ 6 and costs 60 − 10·n; Residual Souls +1 (Soul Sap), Spectral Scythe casts 1–2 25 % chance, Soul Strike −1 (needs ≥ 1), Volley needs ≥ 2 and consumes all; Storm Shards +1 (max 10), Shatter consumes all (no cooldown at 0) |
| `buff apply / extend / consume / refresh` | Anima Charged 25 → consumed by first Sonic Wave / Greater Sonic Wave / Dragon Breath / (Greater) Concentrated Blast; Flow 15 (10 %/20 %, 35 %/45 % when anima-charged) → consumed by next adrenaline-costing magic ability; Chaos Roar 12 → next damaging melee ability; Greater Fury 25 → next hit; Endless Assault 10 → next Assault/Flurry; Searing Winds 10 (+1 per Rapid Fire hit, max +8); Shadow Imbued 50 (+6 on Shadow Tendrils); Berserk 33 (+1 per Greater Flurry hit, max +8); Meteor Strike / Tsunami 50 (recast refreshes); Living Death 50; Sunshine 50 / Greater 63; Death's Swiftness 50 / 63; Limitless 10; Anticipation 17; Freedom 10; Devotion; Natural Instinct 25 |
| `cooldown reset / reduce / override-while` | Living Death cast → Touch of Death and Death Skulls 0; Death Skulls 17 while Living Death; Overpower 15 while Berserk (no reset); Piercing Shot hit → Snipe −4 (−6 fleeting boots); Hurricane −5 per enemy hit; Bladed Dive reset on kill (not simulated: no kills); Preparation −5 Resonance/Divert per hit taken (not simulated) |
| `shared cooldown` | Dive ↔ Bladed Dive 34; Corruption Shot ↔ Corruption Blast 25; Resonance ↔ Divert 50; Rejuvenate ↔ Guthix's Blessing ↔ Ice Asylum 500; Magma Tempest ↔ Targeted; adrenaline potions 200; Surge ↔ Escape only in PvP (not linked) |
| `adrenaline gain modifiers` | Living Death: Touch of Death +6; Natural Instinct: basics ×2; Meteor Strike: melee basic abilities ×1.5 and +4.5 per tick; Shadow Imbued: +5 per ranged hit (+10 NI); Tsunami: +8 per magic crit; Impatient / Fury of the Small (loadout, existing) |
| `requirement` | conjure active for Command X (available 6 ticks after conjure); souls / necrosis; Limitless not at ≥ 60 %; thresholds 50 % (15 % during Limitless); sequence step open (Slaughter only within 40 ticks after Dismember); charge available |
| `sequence / slot transform` | Dismember→Slaughter→Massacre (40-tick windows, Massacre resets); Spectral Scythe cast 1/2/3 (25-tick windows, cooldown from cast 1); Conjure X → Command X (spirit lifetime 70 ticks base, +Spirit Pact tier from loadout; Command Skeleton 25-tick cooldown; Command Zombie explodes at +4 and removes the zombie, re-conjure at conjure+50; Command Phantom 15; Undead Army conjures all selected) |
| `channel` | Assault hits 1/3/5/7 (7 ticks); Flurry / Greater Flurry 1..8; Rapid Fire 1..8 (movable); Asphyxiate 1/3/5/7; Concentrated Blast 3; Snipe 3; Smoke Tendrils 4; Blood Siphon 9 (4 hits every 2 + final); Onslaught every 2 ticks, 25 % per hit, ends when < 25 %; a GCD ability cast at cast+3 or later cancels the remaining hits; "complete channel" effects (Channelled Might) only if uncancelled |

Greater variants: `Greater X` replaces `X` in game (codex). The editor warns when a rotation contains both.

## 4. Engine changes (`trainer-engine.ts`)

- New state: `stacks`, `charges`, `sequences`, `conjures`, `channel` (active channel with pending hits),
  `buffs` gains `stacks`/`extensions`.
- `activate()` becomes `cast()` → `rules.onCast` → schedule hits → `rules.onHit` on each hit tick.
- `cooldownLeft()` uses `rules.cooldown()` at cast time (override while buff) and supports charges.
- `accept()/cast()` check `rules.canCast()` (new events: `requirement` with reason text) and `rules.cost()`.
- Ability queueing: an ability whose requirement is not met stays queued (queueing on) / is dropped (off), same
  as adrenaline today.

## 5. UI

- Train page: stack counters (Bloodlust, Necrosis, Residual Souls, Storm Shards) next to the adrenaline bar;
  cooldown overlays + seconds on *next* icons for internal cooldowns; sequence steps show the current slot
  state (e.g. Dismember icon becomes Slaughter after the cast, like the action bar); feedback for requirements
  ("Volley of Souls needs 2 Residual Souls, you have 1").
- Tooltip: new section "Interactions" listing every rule of the ability in plain text (from the rules data,
  with wiki link).
- Rotation editor: warning when base and Greater version are both in the rotation, or a Command without its
  Conjure before it.
- Loadout: Spirit Pact tier (conjure duration), Planted Feet (Sunshine / Death's Swiftness 63 ticks), fleeting
  boots (Snipe −6), Igneous Kal-Mor (Death Skulls bounces – damage only, stored).

## 6. Tests (`rules.spec.ts` + engine spec)

One test per cross-ability rule that affects timing/adrenaline/availability: Living Death resets and 17-tick
Death Skulls; Berserk 15-tick Overpower; Bloodlust generation/cap/consumption; Finger of Death cost by Necrosis;
Volley requirement; Runic Charge → Anima Charged → Flow costs; Piercing Shot reduces Snipe; Rapid Fire extends
Searing Winds; Shadow Imbued adrenaline per hit; Greater Flurry extends Berserk; Dismember sequence windows;
Spectral Scythe casts; Conjure/Command availability; charges; Limitless threshold window; channels cancelled
by the next ability; off-GCD abilities inside/outside the GCD.

## 7. Open wiki ambiguities (decided, flagged in code)

See "Ambiguities" sections of the research files. Decisions: Death Skulls in Living Death 17 ticks; Berserk 33
ticks; Overpower cap only for casts during Berserk; Snap Shot no cooldown; Anticipation stun-only immunity;
Provoke +9 % outside the GCD; Limitless blocked at ≥ 60 %; Flow reduces cost only (not the requirement);
Smoke Tendrils does not consume Flow (0 cost); Hurricane −5 per enemy; Soul Strike needs ≥ 1 soul.

## 8. Loadout v2: weapons, special attacks, Essence of Finality, perks, set effects

Sources: `docs/research/special-attacks.md`, `weapons-data.md`, `perks-and-set-effects.md`.

### Data (all generated from the wiki, committed)
- `public/data/weapons.json`: every main-hand / off-hand / 2h weapon of the four styles (bucket `infobox_bonuses`,
  ~2 000 rows, one per page, augmented/dyed variants folded into the base item): name, style, slot, tier, speed,
  damage, accuracy, type (shield / defender / conduit detected), spec id, icon. UI default filter tier >= 70.
- `public/data/specs.json`: the 75 current weapon special attacks (bucket `infobox_weapon_special_attack`):
  name, weapons, style, adrenaline cost, cooldown ticks, channel, off-GCD (Quick Smash), buffs, description,
  interaction rules (Death Grasp consumes Necrosis, Death Essence -> Death Spark, Blackhole vs Berserk, ...).
- `public/data/perks.json`: 69 live perks (Template:Infobox Perk): name, gizmo types, max rank (+1 ancient),
  per-rank effect text; 32 combat perks carry simulator parameters (adrenaline, cooldown/duration, damage).
- `public/data/set-effects.json` (hand-authored from the research, wiki URL per entry): armour sets with piece
  thresholds (Vestments of havoc, Robes of the First Necromancer, Dracolich/Elite, Tumeken's, Achto, Nakatra,
  Warpriest, elite tectonic/sirenic, masterwork, void, ...) and single-item passives (Igneous capes, fleeting boots,
  Kerapac's wrist wraps, gloves of passage, blast diffusion boots, Malletops totem, ring of vigour, asylum surgeon's
  ring, ring of death, Jaws of the Abyss, Scripture of Ful, nightmare gauntlets, ...). Each effect is typed:
  adrenaline / cooldown-duration-buff / damage-only / none, with parameters the engine understands.

### Model
```
Loadout { id, name, mainHand?, offHand?, twoHand?, eofSpec?, armourSet? {id, pieces}, items: string[],
          weaponGizmos: [Gizmo, Gizmo], armourGizmos: [Gizmo, Gizmo], relics: string[], spiritPact: 0..3,
          startAdrenaline }
Gizmo = { ancient: boolean, perks: [{perk, rank}, {perk, rank}] }
```
Several named loadouts, one active; stored in IndexedDB (settings store), synced later like keybinds.
The engine receives a `ResolvedLoadout`: style of the main hand, has2h / hasShield / hasConduit, spec entity of the
wielded weapon and of the EoF, max adrenaline, adrenaline multipliers, cooldown/duration overrides, buff extension
rules, requirement flags. Rules consult it in their hooks; "Weapon Special Attack" and "Essence of Finality" steps
resolve to the loadout's spec (cost, cooldown, buffs, off-GCD); cooldown shared between weapon spec and EoF copy.
Gizmo validation as in game: 2h = 2 weapon gizmos, dual-wield 1 + 1, 1h + shield = 1 weapon + 1 armour gizmo;
weapon-only / armour-only perks; ancient gizmo rank +1; Relentless/Ruthless/Fortune ancient only.

### UI
Loadout page: list (new / duplicate / rename / delete / activate); tabs Weapons (search, style/slot/tier filters,
icons), Armour & items (set + piece count, item passives), Perks (gizmo grid, perk + rank pickers with validation),
Relics, Adrenaline. Train page header shows the active loadout; editor warns when a step needs equipment the
loadout lacks (2h, shield, conduit, spec weapon, EoF spec).
