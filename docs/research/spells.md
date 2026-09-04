# Spellbooks and combat spells – simulator spec (RuneScape 3)

Research date: 2026-09-04. Source: RuneScape Wiki (page text and `?action=raw` wikitext of each spell page, the `infobox_spell` bucket for level / description / icon / id). Live-game state assumed: after the Combat Style Modernisation (2 March 2026).

Conventions: 1 tick = 0.6 s; "GCD" = global cooldown = 3 ticks. Quoted text is verbatim from the named wiki page. The trainer ignores rune costs entirely.

What the trainer models: spells are pressable entities `spell:<id>` (public/data/spells.json, built by tools/fetch-spells.py). A loadout has one active spellbook (`Loadout.spellbook`, default `standard`); a spell of another book fails with "needs the Lunar spellbook" (etc.). Rules live in src/app/engine/rules-spells.ts.

---

## 0. The three spellbooks

Source: https://runescape.wiki/w/Spellbook – Standard, Ancient Magicks (Desert Treasure) and Lunar (Lunar Diplomacy) are mutually exclusive; the active book is switched at an altar, or one spell at a time with Spellbook Swap / Borrowed Power.

The infobox field `cooldown` of combat spells is the **cast speed** (3 ticks for a normal GCD cast, 4 for the auto-attack spells), not an ability cooldown – only Vengeance (50) and Disruption Shield (100) carry a real cooldown.

Source: https://runescape.wiki/w/Cooldown#Global_cooldown – "The global cooldown, frequently shortened to "GCD", is the 3 ticks (1.8 seconds) cooldown which starts every time a player begins to use a spell or ability." / "Some abilities and spells are not affected by the global cooldown, and do not trigger the global cooldown when used."

---

## 1. Lunar spells

### Disruption Shield – https://runescape.wiki/w/Disruption_Shield
- Level 90 Magic, infobox `cooldown = 100` (60 s), status id 14865.
- "The next hit you receive from another player or NPC is negated."
- Blocks "the next melee, magic, ranged, necromancy or soft typeless hit that the player receives" – one hitsplat per cast. It "does not block damage from recoils, such as Vengeance" and most hard typeless attacks.
- "Disruption shield takes priority over Vengeance and Resonance. It also takes priority over the ability Devotion and perk Enhanced Devoted, which means Disruption Shield is wasted on a hit that does 1 damage."
- "Unlike Vengeance, Disruption Shield stays active between logging in and out and the player cannot cast it again if it is still active."
- GCD: patch note 26 March 2018 – "Vengeance spells & Disruption shield will no longer be affected by global cooldown."
- Duration: none stated – it lasts until it blocks a hit.
- **Trainer:** off-GCD, 100-tick cooldown, buff `disruption-shield` without a timer (`untilConsumed`), requirement `notBuff` while active; an enemy attack landing while it is up is *absorbed* (counted in `prayerStats.absorbed`, neither prayed nor a hit) and removes the buff. Priority: Barricade (blocks everything, kept) → Disruption Shield → Resonance / Divert.

### Vengeance – https://runescape.wiki/w/Vengeance
- Level 94 Magic, infobox `cooldown = 50` (30 s), id 14870.
- "The next time you receive damage, 75% of the damage received is instead dealt to the attacker."
- "Vengeance can hit up to a maximum of 8000 damage, and is affected by the Vulnerability spell."
- The player still takes the full hit; it does not trigger on 0–1 damage hits or typeless damage.
- GCD: "Vengeance spells & Disruption shield will no longer be affected by global cooldown" (26 March 2018).
- Duration: none stated – until the next hit lands (removed on logout).
- **Trainer:** off-GCD, 50-tick cooldown shared (`sharedCooldown: 'vengeance'`) with Vengeance Other / Group, buff `vengeance` without a timer. The first enemy attack that lands (not absorbed) removes it and flags the attack event `reflected`; the reflected damage itself is not simulated (the enemy has no damage numbers).

### Vengeance Group – https://runescape.wiki/w/Vengeance_Group
- Level 95 Magic, cooldown 50 ticks.
- "The next time any nearby player receives damage, 75% of the damage received is instead dealt to the attacker." Affects up to 50 players in a 7×7 area centred on the caster.
- "Vengeance spells & Disruption shield will no longer be affected by global cooldown" – shares the 30 s cooldown with the other Vengeance variants ("casting Vengeance Group triggers a 30-second shared cooldown preventing use of other Vengeance variants").
- **Trainer:** like Vengeance (applies `vengeance` to yourself).

### Vengeance Other (93) – same cooldown group, applied to another player; the trainer only starts the shared cooldown.

### Heal Other (92) / Heal Group (95) – https://runescape.wiki/w/Lunar_spells
- "Consume 75% of your current life points to heal the targeted player" / "…to heal all nearby players". No cooldown stated; treated as normal GCD casts without an effect the trainer tracks.

### Spellbook Swap – https://runescape.wiki/w/Spellbook_Swap
- Level 96, "Allows you to cast a single spell from the Standard or Ancient spellbooks", up to two minutes. Update history: "Spellbook Swap can now be used off GCD from the action bar."
- **Trainer:** off-GCD, 200-tick buff (display only – it does not unlock the other book's spells).

### Cure Me (71) – cures poison; normal GCD cast, no effect tracked.

---

## 2. Ancient Magicks – https://runescape.wiki/w/Ancient_Magicks

### Auto-cast attack spells (selected, not cast)
The elemental lines replace the basic Magic attack (auto-attack) once selected; selecting a spell from the action bar is instant:
- Smoke Rush/Burst/Blitz/Barrage (50/62/74/86): "reduces the targets chance to hit by 5% for 10 seconds"
- Shadow … (52/64/76/88): "reduces the targets damage dealt by 5% for 10 seconds"
- Blood … (56/68/80/92): "heals you for 5% of the damage dealt"
- Ice … (58/70/82/94): "prevents creatures and players from moving for 2.4-9.6 seconds"
- Exsanguinate (96) – https://runescape.wiki/w/Exsanguinate: "An extremely powerful fire spell. On ability cast, gain a stack of Blood Tithe (max 12) for 20s." Each stack "a 1% increase" to basic ability damage; infobox `cooldown = 4` (cast speed), `autocast = yes`.
- Incite Fear (98) – https://runescape.wiki/w/Incite_Fear: "An extremely powerful water spell. On ability cast, gain a stack of Glacial Embrace (max 5) for 20s." – reduces Tsunami's cost by 12% per stack; at 5 stacks Frost Surge (10–50% to up to 9 targets, 12 s cooldown) "will not consume Glacial Embrace stacks".
- **Trainer:** the four Barrages, Exsanguinate and Incite Fear (and the four Surges of the standard book) are `kind: "autocast"` entities: pressing one is instant, off the GCD and applies a timer-less `autocast-<id>` buff that replaces the previous selection. Blood Tithe / Glacial Embrace stacks and the auto-attack itself are **not** simulated (open point).

### Smoke Cloud (74) – https://runescape.wiki/w/Smoke_Cloud
- Infobox `cooldown = 3`, `duration = 200`. "Disorient the target with a veil of smoke, leaving them vulnerable. - Increases the critical strike damage by 15%. - 2m duration. - 40% effective for non-magic attacks."
- Cast on the target from the action bar, no magic weapon needed, normal 3-tick GCD.
- **Trainer:** GCD cast, target debuff `smoke-cloud` 200 ticks with `critDamageAdd 0.15` (the 40 % rule for other styles is not applied).

### Animate Dead (84) – https://runescape.wiki/w/Animate_Dead
- Infobox `cooldown = none`, `duration = 1200`. "Replace life with shadows to create a shield from the fallen." – 10 % of each magic tank armour piece's armour value (+25 % of the Defence level) as flat damage reduction, max 60 %, 12 minutes, recasting refreshes.
- "Casting the spell does not interrupt channelled abilities and ignores global cooldown."
- **Trainer:** off-GCD, 1200-tick self buff (display only).

### Penance (67) / Vampyrism (69) – 12-minute self buffs: "5% of damage taken restored as Prayer Points, up to 100 per hit" / "Heals for 5% of damage dealt, up to 50 Life Points per hit". Trainer: GCD casts, 1200-tick buffs (display only).

### Intercept (77) – "Place a ward on an ally for 10 seconds. You take all damage they would receive with 5% reduction." Trainer: GCD cast, 17-tick buff.

### Shield Dome (84) – "Create energy shield for 15 seconds protecting all players. Reduces damage up to 50%. Diminishing returns after repeated casting." Trainer: GCD cast, 25-tick buff.

---

## 3. Standard spellbook – https://runescape.wiki/w/Standard_spells

### Curses cast on the target (normal GCD casts, 1 minute = 100 ticks)
- Vulnerability (66) – https://runescape.wiki/w/Vulnerability: infobox `cooldown = 3`, `duration = 100`; "Increases the target's damage received by 10% for 1 minute." / "A magic weapon is not required to cast this spell." The same debuff can be applied "by throwing a vulnerability bomb". **Trainer:** target debuff `vulnerability` (×1.1 damage like the bomb's debuff).
- Enfeeble (73): "Reduces the target's damage dealt by 10%" for 1 minute.
- Stagger (80): "Reduces the target's chance to hit by 10%" for 1 minute.
- Confuse (1) / Weaken (11) / Curse (19): the 5 % versions – not included (obsolete).

### Binds (normal GCD casts)
- Bind (20): "Prevents creatures from moving for 12 seconds, or players for 6 seconds" → 20 ticks
- Snare (50): "Prevents creatures from moving for 18 seconds, or players for 9 seconds" → 30 ticks
- Entangle (79): "Prevents creatures from moving for 24 seconds, or players for 12 seconds" → 40 ticks
- **Trainer:** apply the generic `bound` debuff with these durations.

### Auto-cast attack spells
Air / Water / Earth / Fire Surge (81 / 85 / 90 / 95) – "A very powerful … spell" – selection entities like the Ancient ones.

Teleport Block (85) is PvP only and left out.

---

## 4. Rules the simulator implements

1. WHEN a spell is pressed THEN its spellbook must equal the loadout's spellbook, else the press fails with "needs the <book> spellbook" (rules-spells.ts `book()`), and the bar shows it as unusable (`usable() === 'book'`).
2. Off-GCD spells (Disruption Shield, Vengeance ×3, Spellbook Swap, Animate Dead, every auto-cast selection) are handled like prayers / potions: no GCD started, usable inside one, they complete off-GCD rotation steps.
3. GCD spells (Smoke Cloud, Vulnerability, Enfeeble, Stagger, Bind, Snare, Entangle, Penance, Vampyrism, Intercept, Shield Dome, Heal Other / Group, Cure Me) are GCD steps like abilities, 0 % adrenaline, no hit.
4. Disruption Shield: 100-tick cooldown, cannot be recast while active, blocks the next enemy attack (absorbed).
5. Vengeance / Vengeance Group: 50-tick cooldown shared as `vengeance`, buff until the first attack that lands; Vengeance Other only starts the shared cooldown.
6. Prayer score: an absorbed attack is neither "prayed" nor a "hit"; it counts +1 like a prayed attack on the train page and is listed as "Absorbed".

## 5. Open points / assumptions
- Vengeance and Disruption Shield have no stated duration; modelled as lasting until consumed.
- Auto-cast spells: only the selection is modelled – no Blood Tithe / Glacial Embrace stacks, no changed basic attack damage, no rune use. Whether a magic weapon is required to *select* a spell is not enforced.
- Heal Other / Heal Group / Cure Me / Vengeance Other have no self effect in the trainer (they target other players).
- Smoke Cloud's "40% effective for non-magic attacks" is not applied; the full +15 % crit damage is used for every style.
- Animate Dead's damage reduction, Penance / Vampyrism healing and Shield Dome / Intercept are display-only buffs (the trainer does not track the player's life points).
