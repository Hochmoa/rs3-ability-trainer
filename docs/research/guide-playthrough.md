# Guide accounts: every PvME boss rotation played through the trainer (7 September 2026)

Question: can the rotations PvME publishes be played in the trainer as written – and where not, is it the guide, a game update, or a bug in the trainer? Every boss guide of the PvME repository (pvme-guides/rs3-full-boss-guides) was turned into a boss setup (`tools/fetch-presets.py` → `public/data/presets.json`), every setup was added through `PresetsService.add()` like a click on the Boss setups page, and every rotation was played on the Train page by a perfect player (`tools/ui-sim.js`: the page's own engine, synthetic ticks, the expected step pressed the moment it is due). The same loadouts and rotations are published under the guide accounts (below), so players copy exactly what was tested here.

## The guide accounts

One account per boss, named after the boss ("Vorkath", "Rasial", "ED2 Dragonkin Lab" …), `profiles.kind = 'guide'`. They cannot log in (no password, banned until 2999) and show a **Guide** badge wherever a rotation or setup names its owner: the explorer ("Guides" chip lists only them, the default feed hides them unless a search matches), Shared setups, and copied rotations (`Rotation.sourceOwnerKind`). Migrations `0012_guide_accounts.sql` (schema, `ensure_guide_account`) and `0013_guide_content.sql` (content, idempotent upserts on deterministic ids) are applied to the live project. Regenerate the content after a parser or preset change: `tools/ui-sim.js` (adds every preset), `tools/guide-seed-dump.js` (dumps `tools/guide-seed.json`), `python tools/guide-seed-to-sql.py --number <n>`, `npx supabase db push`.

| | Count |
|---|---|
| Guide accounts (bosses) | 38 |
| Boss setups (loadout + rotations, one per style/variant) | 127 |
| Rotations | 840 |

## How the playthrough works

Settings of a training session: full adrenaline at the start, adrenaline recharging (PvME rotations assume a built bar), ping 0, automatic basic attacks off, every hit lands, advanced UI. Each setup's pre-build rotation ("Pre-fight", "War's Retreat", "Prebuild" …) is played first; its end state (conjures, buffs, prayers, stacks, adrenaline) becomes the pre-build of the fight rotations, and a necromancy fight rotation always starts with 12 Necrosis and 5 Residual Souls and the three conjures out (or none, when it conjures them itself) – exactly what `PresetsService` stores for a player.

A rotation ends as **finished** (every step done, the last hits landed), **stuck** (the engine's stuck marker: the expected step refused for good – a cooldown of 10 s or more, a requirement the rotation cannot meet, a weapon the rotation never switches to, a spec the slot cannot fire – the session ends with a red panel naming the step and the reason), **timeout** (1200 ticks without finishing and without a marker), **cannot start** (a step without a key) or **notes only** (no playable step, prose only).

## Result

| Outcome | Rotations |
|---|---|
| finished | 315 |
| stuck | 497 |
| timeout | 8 |
| notes-only | 20 |
| total | 840 |

315 of 820 playable rotations (38 %) play through as written. Three runs before the fixes of this round ended at 283, 286 and 296 finished; the classes below are what stops the rest. Every stuck rotation is in the appendix with its step and marker text.

### By boss

| Boss | Setups | Rotations | Finished | Stuck | Timeout | Notes only |
|---|---|---|---|---|---|---|
| Amascut, the Devourer | 6 | 40 | 8 | 31 | 1 | 0 |
| Angel of Death (7-man) | 12 | 82 | 28 | 54 | 0 | 0 |
| Angel of Death (small teams) | 7 | 32 | 3 | 29 | 0 | 0 |
| Araxxor | 2 | 13 | 3 | 10 | 0 | 0 |
| Arch-Glacor | 3 | 12 | 3 | 9 | 0 | 0 |
| Barrows | 4 | 4 | 2 | 2 | 0 | 0 |
| Beastmaster Durzag | 1 | 1 | 0 | 0 | 0 | 1 |
| Corporeal Beast | 3 | 3 | 1 | 2 | 0 | 0 |
| Dagannoth Kings | 1 | 1 | 0 | 1 | 0 | 0 |
| ED1 – Temple of Aminishi | 2 | 47 | 17 | 30 | 0 | 0 |
| ED2 – Dragonkin Laboratory | 2 | 33 | 20 | 10 | 3 | 0 |
| ED3 – The Shadow Reef | 2 | 67 | 42 | 25 | 0 | 0 |
| Flesh-hatcher Mhekarnahz | 4 | 4 | 2 | 2 | 0 | 0 |
| Giant Mole (HM) | 1 | 1 | 1 | 0 | 0 | 0 |
| Gregorovic | 3 | 4 | 2 | 2 | 0 | 0 |
| Helwyr | 3 | 4 | 3 | 1 | 0 | 0 |
| Hermod, the Spirit of War | 1 | 2 | 2 | 0 | 0 | 0 |
| Kalphite King | 2 | 3 | 0 | 3 | 0 | 0 |
| Kalphite Queen | 1 | 1 | 0 | 1 | 0 | 0 |
| Kerapac, the bound | 6 | 54 | 25 | 28 | 1 | 0 |
| Legiones | 1 | 6 | 0 | 6 | 0 | 0 |
| Nex | 3 | 22 | 15 | 7 | 0 | 0 |
| Queen Black Dragon | 1 | 4 | 2 | 2 | 0 | 0 |
| Raksha, the Shadow Colossus | 6 | 37 | 16 | 20 | 1 | 0 |
| Rasial, the First Necromancer | 1 | 3 | 3 | 0 | 0 | 0 |
| Rex Matriarchs | 5 | 11 | 3 | 7 | 0 | 1 |
| Rise of the Six | 5 | 5 | 3 | 2 | 0 | 0 |
| Sanctum of Rebirth | 5 | 100 | 33 | 58 | 2 | 7 |
| Solak | 5 | 30 | 4 | 26 | 0 | 0 |
| Telos, the Warden | 5 | 41 | 29 | 12 | 0 | 0 |
| Twin Furies | 3 | 4 | 3 | 1 | 0 | 0 |
| TzKal-Zuk | 2 | 44 | 11 | 33 | 0 | 0 |
| Vindicta | 3 | 4 | 1 | 3 | 0 | 0 |
| Vorago | 2 | 10 | 4 | 6 | 0 | 0 |
| Vorago (HM) | 2 | 11 | 5 | 5 | 0 | 1 |
| Vorkath | 5 | 27 | 9 | 18 | 0 | 0 |
| Yakamaru | 1 | 8 | 1 | 1 | 0 | 6 |
| Zamorak, Lord of Chaos | 6 | 65 | 11 | 50 | 0 | 4 |

### Failure classes

| Class | Rotations | What it is | Whose problem |
|---|---|---|---|
| style-switch | 170 | the expected ability needs another combat style than the wielded weapon and the rotation has no switch step | guide notation |
| spec-weapon | 139 | the expected special attack belongs to a weapon in the backpack or to a second Essence of Finality | trainer model (one EoF) |
| cooldown | 88 | the expected ability is on a cooldown of 10 s or more | guide notation, a few to check |
| two-handed | 42 | Hurricane / Pulverise need a two-handed weapon, the setup wields dual weapons | preset choice |
| spellbook | 15 | a spell of another spellbook than the setup's | guide mixes books |
| souls | 15 | Volley of Souls with fewer than 2 Residual Souls | to check |
| eof-missing | 14 | an "eofspec" step while the setup wears no Essence of Finality, or the wielded weapon has another style | preset choice |
| timeout | 8 | no marker fired: the slot fires another spec than expected, or an adrenaline shortfall | trainer |
| limitless | 5 | Limitless pressed at 100 % adrenaline | guide (adrenaline assumption) |
| conduit | 3 | a necromancy ability while wielding no siphon + conduit | preset choice |
| slaughter | 3 | Slaughter / Massacre outside their window | guide |
| conjure-active | 2 | Conjure Undead Army while every spirit is out | pre-build |
| command-timing | 1 | Command X within 6 ticks of the conjure | to check |

#### style-switch – 170 rotations

PvME hybrid guides (melee + ranged, magic + melee, necromancy + ranged …) write "grico" or "gsunshine" in a melee rotation and expect the reader to switch weapons; the switch is a picture in the gear section, never a step in the rotation text. The setups now carry every switch weapon in the backpack with a key (F1–F4, F6–F10), and a switch written as "ezk spec" or "sgb eofspec" works, but "grico" alone stops at the marker *needs a Ranged weapon wielded – the rotation has no switch to one*. Not a bug in the trainer: the rotation as text has no switch. Fix worth making: the preset import inserts the switch to the backpack weapon of the needed style before the first ability of another style (the loadout knows both, the step would be marked "added"). That alone would make most of these playable.

| Needs | Wields | Rotations |
|---|---|---|
| Ranged | Melee | 47 |
| Magic | Melee | 30 |
| Melee | Ranged | 27 |
| Melee | Magic | 17 |
| Necromancy | Ranged | 17 |
| Necromancy | Melee | 6 |
| Ranged | Magic | 4 |
| Necromancy | Magic | 4 |
| Constitution | Magic | 3 |
| Constitution | Necromancy | 2 |
| Melee | Necromancy | 2 |
| Magic | Ranged | 2 |
| Constitution | Melee | 2 |
| Ranged | Necromancy | 2 |
| Ranged | nothing | 2 |
| Necromancy | nothing | 2 |
| Melee | nothing | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Amascut, the Devourer | Magic | Phase 1 | step 4: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Amascut, the Devourer | Ranged | Phase 2 and 3 | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | Ranged | Phase 4 | step 2: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | Ranged | Phase 5 | step 2: Adaptive Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | Ranged | Phase 6 | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | Ranged | Phase 7 | step 1: Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |

#### spec-weapon – 139 rotations

"varanussmercy eofspec", "deathguard90 eofspec", "sgb eofspec", "gloomfirebow eofspec", "dclaws eofspec", "ecb eofspec", "swh eofspec": PvME players carry one Essence of Finality per stored special attack and swap amulets mid-rotation. The trainer's loadout has one EoF with one stored spec (`Loadout.eofSpec`); the preset stores the first "eofspec" the guide names, every other one stops at the marker *X is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality* (new this round – before, these rotations ran into the timeout). The fix is a model change: several EoF amulets in the loadout (`eofSpecs`), the EoF slot fires the spec the step names, the amulet swap is free like in the game. That is the single largest win left.

| Special attack | Weapon | Rotations |
|---|---|---|
| The Final Flurry | Varanus's Mercy | 33 |
| Death Grasp | Death guard (T70–90) | 22 |
| Crystal Rain | Seren godbow | 20 |
| Shadowfall | Gloomfire bow | 18 |
| Slice & Dice | Dragon claws | 10 |
| Obliterate | Statius's warhammer | 8 |
| Split Soul | Eldritch crossbow | 7 |
| Locate | Decimation | 5 |
| Descent of Darkness | Dark bow | 5 |
| The Last Command |  | 3 |
| Claws of Guthix |  | 2 |
| Gravitate |  | 2 |
| Destructive Shot | Zamorak bow | 1 |
| Powerstab |  | 1 |
| Blackhole |  | 1 |
| Weapon Special Attack |  | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Amascut, the Devourer | Magic | Phase 6 | step 8: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | Necromancy | Phase 2 and 3 | step 2: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | Necromancy | Phase 7 | step 4: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | Ranged | Phase 1 | step 7: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | Ranged | Phase 4 | step 16: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | Magic | Zaros | step 11: Claws of Guthix is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |

#### cooldown – 88 rotations

The marker the request asked for: the expected ability is on a cooldown of 10 s or more, so something is certainly wrong. Reading the PvME source lines of every class (the text is in `public/data/presets.json`, field `text`):

- **Alternative lines merged into one rotation** (Overpower, Igneous Showdown, Death Skulls, Galeshot, Command Skeleton Warrior, Death Grasp, Threads of Fate …): a PvME rotation block often holds several lines that are alternatives, not a sequence – ">50% adren: … / <50% adren: …" (Telos Drop Down), "Easier dummy build … / Harder dummy build …" (Kalphite King), "Pillar 1 … / Pillar 2 … / Pillar 4 deathskulls" (Angel of Death), "If ≤3 residualsoul: …" (Solak), "Rotation A" lines for different phases. The parser joins the lines, so the second line casts Overpower or Death Skulls again 5–10 ticks after the first. Not a game change and not an engine bug: the cooldowns were checked against the wiki (Overpower 30 s, Death Skulls 30 s, Command Skeleton Warrior 15 s and first available 6 ticks after the conjure, Threads of Fate 45 s since 29 August 2023, Death Grasp 30 s, Igneous Showdown 60 s). Fix worth making: `tools/fetch-presets.py` splits a block into one rotation per line when a line starts with a condition (">50%", "If", "Alt", "Easier"/"Harder", "Pillar n", "Phase n"); rotation ids of the guide accounts change with it (the seed ids are preset id + rotation index).
- **Stall / release notation** (Meteor Strike, Overpower, Galeshot, Greater Ricochet …): "smeteorstrike → … → rmeteorstrike" is one cast – the stall queues it, the release fires it. The parser produced two casts; fixed this round (`mergeStallRelease` in `src/app/core/pvme.ts`: the stall becomes a note, the release the step).
- **Surge → Surge / Dive → Surge → Surge** (Angel of Death Lure, Araxxor Phase 2, Amascut): the Double Surge relic power (two Surge charges) and the Mobile perk. The setups carry no relics or perks, so the second Surge hits a 20 s cooldown. Trainer limitation to note on the setup, or a relic/perk model for the loadout.
- **Weapon Special Attack after Igneous Showdown** (Araxxor Phase 1, Arch-Glacor Opener, Kerapac): "ezk spec" earlier and a bare "spec" later in the same block – the generic step now takes whatever the slot fires (fixed this round), so these are the wielded weapon's spec pressed twice inside its cooldown, again two alternative lines.

| Ability | Rotations |
|---|---|
| Surge | 26 |
| Overpower | 11 |
| Death Skulls | 8 |
| Igneous Showdown | 4 |
| Hurricane | 4 |
| Death Essence | 4 |
| Death Grasp | 4 |
| Weapon Special Attack | 3 |
| Dive | 3 |
| Essence of Finality | 2 |
| Greater Barge | 2 |
| Threads of Fate | 2 |
| Split Soul | 2 |
| Berserk | 2 |
| Deadshot | 2 |
| Escape | 2 |
| Anticipation | 1 |
| Soulfire | 1 |
| Punish | 1 |
| Bladed Dive | 1 |
| Combust | 1 |
| Disruption Shield | 1 |
| Immortality | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Amascut, the Devourer | Magic | Wars | step 4: Igneous Showdown is still on cooldown for 58.2 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | Magic | Phase 2 and 3 | step 10: Overpower is still on cooldown for 20.4 s |
| Amascut, the Devourer | Magic | Phase 4 | step 9: Overpower is still on cooldown for 28.2 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |
| Angel of Death (7-man) | Magic | Lure | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | Magic | Lure | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | Magic | Lure | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | Necromancy | Rotation – Pillars | step 10: Death Skulls is still on cooldown for 43.8 s |

#### two-handed – 42 rotations

Hurricane and Pulverise need a two-handed weapon; the melee guides list both a dual-wield and a two-handed set and the preset takes the first (dual wield: Dark Shard of Leng + Dark Sliver, Ek-ZekKil is the exception). Same shape as the style switch: the loadout has the 2h in the backpack, the rotation never switches. Same fix: the import inserts the switch before Hurricane / Pulverise and back afterwards (PvME reads "hurricane" as "switch to 2h, hurricane").

- Hurricane: 28
- Pulverise: 14

#### spellbook, eof-missing, souls, command-timing and the rest

- **spellbook** (15): the setup's spellbook is the one of the first spell the guide names; Amascut's magic guides then cast Smoke Cloud / Ice Barrage (Ancient) in one rotation and Enfeeble (Standard) in another. One spellbook per loadout is the game's rule too – the guide assumes the reader picks the book per phase. Marker text is exact; nothing to fix in the trainer beyond a spellbook-switch note.
  - Smoke Cloud: needs the Ancient Magicks spellbook: 10
  - Ice Barrage: needs the Ancient Magicks spellbook: 2
  - Enfeeble: needs the Standard spellbook: 2
  - Vulnerability: needs the Standard spellbook: 1
- **eof-missing** (14): an "eofspec" step while the setup wears no Essence of Finality (the guide's preset lists another amulet) or the wielded weapon is of another style than the stored spec. Preset choice, same fix as spec-weapon.
- **souls** (15): Volley of Souls with fewer than 2 Residual Souls – "volleyofsouls → soulsap → volleyofsouls" (Angel of Death, Nex, Vorkath, Sanctum). Soul Sap gives one soul, so the second Volley needs the souls the guide expects from elsewhere (Zorgoth's soul ring procs, auto-attacks the rotation does not write). Worth a look: whether a Necromancy auto-attack should build a soul in the engine, or whether the guide counts on the ring.
- **command-timing** (1): the wiki confirms Command X is first available on tick 6 after the conjure (the "conjure skeleton" problem): a rotation that conjures on tick 0 and commands on tick 3 cannot be played in the game either; the ones listed conjure late in the rotation while commanding early, and the pre-build's spirits expire before the conjure (a modelling compromise this round – the pre-build follows the rotation's conjure and command order). A pre-built spirit is now commandable at once whatever lifetime it has left (the old rule computed its age from the base duration and made Life-Transfer-extended spirits "just conjured"; that was a real engine bug and the cause of the earlier "Command Skeleton Warrior is still on cooldown for 11 s" markers at the first step).
- **limitless** (5): Limitless at 100 % adrenaline – the session starts full, the guide assumes a partly spent bar.
- **timeout** (8): the slot fires another spec than the step names (Split Soul instead of Locate: the EoF stores one, the step wants the other – spec-weapon in disguise) or Imbue: Shadows without adrenaline. The marker should cover the wrong-fired case too (a wrong-fired of the expected spec three times in a row).
- **conduit / slaughter / other**: a necromancy ability in a ranged/necro hybrid while wielding the bow (no switch), Slaughter / Massacre outside their window (guide), Life Transfer without a spirit.

## Fixes made in this round

- `PresetsService.add()`: switch weapons of the guide go into the backpack with keys (nine weapon keys F1–F4, F6–F10), the familiar comes from the scroll the rotations press, the spellbook from the spells, the EoF spec from the first "eofspec", the necromancy pre-build (12 Necrosis, 5 souls, conjures) per rotation (`necroPrebuild`).
- Engine: switch-to-wielded-weapon steps and prayers already on complete themselves; a wrong-weapon press of the expected step three times ends the session stuck (`weaponStrike`); a slot press that cannot fire the expected spec is such a strike; a generic "Weapon Special Attack" step takes whatever spec the slot fires; a pre-built spirit is commandable at once.
- PvME parser: "X eofspec" fires from the EoF; the "s"/"r" stall/release prefixes; a stall released later is one cast; lead-in prose before an alias stays a note; "(tc)" etc. as before.
- Combat dummy key (`` ` ``), six skills up to level 120.
- Explore: guide rotations have their own chip and stay out of the default feed unless a search matches.

## Open, in order of value

1. Several Essence of Finality amulets per loadout (153 rotations).
2. Preset import inserts the weapon switch a style change or a 2h ability needs (212 rotations).
3. `tools/fetch-presets.py` splits alternative lines into separate rotations (most of the 88 cooldown markers); the guide seed is regenerated afterwards.
4. Double Surge relic / Mobile perk on the loadout, or a note on the setups that use them.
5. Volley of Souls soul income (15): check the engine against the wiki (auto-attack souls, Zorgoth's soul ring).
6. Stuck marker for a spec fired wrongly three times (the remaining timeouts).
7. The pre-build of a guide rotation is not copied with it (pre-builds are local per rotation id) – a copied necromancy rotation starts without stacks and conjures unless the player sets the pre-build on the Train page.

## Reproduce

Dev app (`preview_start rs3trainer`, port 4400), Train page, paste `tools/ui-sim.js` into the console, then `window.__sim.run({ recharge: true, clear: true })` (about 20 minutes for all setups; keep the tab in front). Results in `window.__sim.results`; the tables of this file come from that json (counts per outcome, per boss, per marker text). Clear storage afterwards: the run leaves every setup in the browser.

## Appendix A – every rotation that did not finish

| Boss | Variant | Style | Rotation | Outcome | Class | Step and marker |
|---|---|---|---|---|---|---|
| Amascut, the Devourer | 1000% base | Magic | Wars | stuck | cooldown | step 4: Igneous Showdown is still on cooldown for 58.2 s |
| Amascut, the Devourer | 1000% base | Magic | Phase 1 | stuck | spellbook | step 3: Smoke Cloud: needs the Ancient Magicks spellbook |
| Amascut, the Devourer | 1000% base | Magic | Phase 2 and 3 | stuck | spellbook | step 1: Ice Barrage: needs the Ancient Magicks spellbook |
| Amascut, the Devourer | 1000% base | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 1000% base | Magic | Phase 6 | stuck | two-handed | step 14: Pulverise: needs a two-handed weapon |
| Amascut, the Devourer | 1000% dps | Magic | Phase 1 | stuck | style-switch | step 4: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Amascut, the Devourer | 1000% dps | Magic | Phase 2 and 3 | stuck | cooldown | step 10: Overpower is still on cooldown for 20.4 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 4 | stuck | cooldown | step 9: Overpower is still on cooldown for 28.2 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 6 | stuck | spec-weapon | step 8: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 1 | timeout | timeout | waiting at Shadowfall · no-adrenaline Imbue: Shadows need 40 have 30 · wrong-fired Split Soul expected Shadowfall |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 2 and 3 | stuck | style-switch | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 4 | stuck | style-switch | step 2: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 5 | stuck | style-switch | step 2: Adaptive Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 6 | stuck | style-switch | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 7 | stuck | style-switch | step 1: Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 1 | stuck | style-switch | step 5: Living Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 2 and 3 | stuck | spec-weapon | step 2: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 4 | stuck | style-switch | step 19: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 6 | stuck | style-switch | step 10: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 7 | stuck | spec-weapon | step 4: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | 2000% base | Magic | Phase 1 | stuck | style-switch | step 4: Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Amascut, the Devourer | 2000% base | Magic | Phase 2 and 3 | stuck | style-switch | step 4: Combust needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Amascut, the Devourer | 2000% base | Magic | Phase 4 | stuck | style-switch | step 7: Adaptive Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Amascut, the Devourer | 2000% base | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 2000% base | Magic | Phase 6 | stuck | two-handed | step 14: Pulverise: needs a two-handed weapon |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 1 | stuck | spec-weapon | step 7: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 2 and 3 | stuck | style-switch | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 4 | stuck | spec-weapon | step 16: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 5 | stuck | style-switch | step 2: Adaptive Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 6 | stuck | style-switch | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 7 | stuck | style-switch | step 1: Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Angel of Death (7-man) | base | Magic | Prefight | stuck | style-switch | step 7: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Lure | stuck | cooldown | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | base | Magic | Prefight | stuck | style-switch | step 7: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Phase 3 | stuck | style-switch | step 1: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Lure | stuck | cooldown | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | base | Magic | Prefight | stuck | style-switch | step 7: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Phase 2 | stuck | style-switch | step 1: Greater Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Phase 3 | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | base | Magic | Lure | stuck | cooldown | step 2: Surge is still on cooldown for 19.8 s |
| Angel of Death (7-man) | base | Magic | Zaros | stuck | spec-weapon | step 11: Claws of Guthix is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | base | Melee | Phase 1 | stuck | two-handed | step 4: Hurricane: needs a two-handed weapon |
| Angel of Death (7-man) | base | Melee | Phase 2 | stuck | style-switch | step 4: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | base | Melee | Phase 3 | stuck | style-switch | step 1: Greater Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | base | Melee | Zaros | stuck | style-switch | step 1: Galeshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | base | Necromancy | Phase 1 | stuck | spec-weapon | step 6: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | base | Necromancy | Phase 2 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | base | Necromancy | Lure | stuck | style-switch | step 9: Soul Sap needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | base | Necromancy | Last Pillar and Zaros | stuck | spec-weapon | step 8: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation – Prebuild | stuck | spec-weapon | step 5: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation – Phase 1 | stuck | spec-weapon | step 1: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation – Phase 3 | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation – Pillars | stuck | cooldown | step 10: Death Skulls is still on cooldown for 43.8 s |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Prebuild | stuck | spec-weapon | step 5: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Phase 1 | stuck | spec-weapon | step 1: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Phase 2 | stuck | cooldown | step 10: Essence of Finality is still on cooldown for 22.8 s |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Phase 3 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Pillars | stuck | cooldown | step 10: Death Skulls is still on cooldown for 45.6 s |
| Angel of Death (7-man) | minion tank | Magic | Phase 1 | stuck | two-handed | step 6: Hurricane: needs a two-handed weapon |
| Angel of Death (7-man) | minion tank | Magic | Phase 2 and 3 | stuck | style-switch | step 1: Greater Sonic Wave needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | minion tank | Magic | Pillars | stuck | style-switch | step 2: Dragon Breath needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | minion tank | Magic | Phase 1 | stuck | limitless | step 5: Limitless: cannot be used at 60% adrenaline or more |
| Angel of Death (7-man) | minion tank | Magic | Prefight | stuck | style-switch | step 5: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Magic | Phase 1 | stuck | spec-weapon | step 11: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | minion tank | Magic | Phase 2 | stuck | style-switch | step 1: Greater Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Magic | Phase 3 | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Magic | Pillars | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Magic | Zaros | stuck | spec-weapon | step 4: Claws of Guthix is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | minion tank | Melee | Prefight | stuck | style-switch | step 7: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Phase 1 | stuck | style-switch | step 2: Chaos Roar needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Phase 2 | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Phase 3 | stuck | style-switch | step 2: Greater Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Pillars | stuck | style-switch | step 3: Greater Fury needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Zaros | stuck | style-switch | step 1: Greater Fury needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank | Melee | Prefight | stuck | cooldown | step 13: Greater Barge is still on cooldown for 15 s |
| Angel of Death (7-man) | minion tank | Melee | Phase 2 | stuck | style-switch | step 1: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | minion tank | Melee | Phase 3 | stuck | spec-weapon | step 1: Locate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (7-man) | minion tank | Melee | Pillars | stuck | style-switch | step 2: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation – Phase 1 | stuck | style-switch | step 2: Death Skulls needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation – Phase 3 | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation – Pillars | stuck | cooldown | step 10: Death Skulls is still on cooldown for 43.8 s |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Phase 1 | stuck | style-switch | step 2: Death Skulls needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Phase 2 | stuck | cooldown | step 10: Essence of Finality is still on cooldown for 22.8 s |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Phase 3 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Pillars | stuck | cooldown | step 10: Death Skulls is still on cooldown for 45.6 s |
| Angel of Death (small teams) | base | Magic | Prebuild | stuck | style-switch | step 5: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | base | Magic | Phase 1 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | base | Magic | Phase 2 | stuck | style-switch | step 1: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | base | Magic | Phase 3 | stuck | style-switch | step 3: Magma Tempest needs a Magic weapon wielded – the rotation has no switch to one and you wield Ranged |
| Angel of Death (small teams) | base | Magic | Pillars | stuck | style-switch | step 6: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | base | Magic | Zaros | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | base with rangers | Necromancy | Phase 1 | stuck | spec-weapon | step 3: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | base with rangers | Necromancy | Pillars | stuck | spec-weapon | step 3: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | base with rangers | Necromancy | Zaros | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Angel of Death (small teams) | dps | Magic | Prebuild | stuck | style-switch | step 12: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | dps | Magic | Phase 1 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | dps | Magic | Phase 2 | stuck | style-switch | step 1: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | dps | Magic | Phase 3 | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | dps | Magic | Pillars | stuck | style-switch | step 6: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | dps | Magic | Zaros | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | duo trio basic | Necromancy | Phase 1 | stuck | spec-weapon | step 12: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | duo trio basic | Necromancy | Phase 2 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Prebuild | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Phase 1 | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Phase 2 | stuck | style-switch | step 1: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Phase 3 | stuck | spec-weapon | step 1: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Pillars | stuck | style-switch | step 1: Essence of Finality needs a Constitution weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Zaros | stuck | spec-weapon | step 6: Destructive Shot is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | solo | Ranged | Phase 1 Rotation | stuck | style-switch | step 3: Soul Sap needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | solo | Ranged | Phase 2 Rotation: Clearing Amalgamations | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | solo | Ranged | Phase 2: Luring Minions | stuck | spec-weapon | step 6: Locate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | solo | Ranged | Phase 2 Rotation: Killing Minions | stuck | spec-weapon | step 2: Locate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Angel of Death (small teams) | solo | Ranged | Phase 3 Rotation | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | solo basic | Necromancy | Phase 2 | stuck | cooldown | step 13: Threads of Fate is still on cooldown for 37.8 s |
| Araxxor | Araxxor – melee | Melee | Phase 1 | stuck | cooldown | step 3: Weapon Special Attack is still on cooldown for 58.2 s |
| Araxxor | Araxxor – melee | Melee | Phase 2 | stuck | cooldown | step 9: Surge is still on cooldown for 19.8 s |
| Araxxor | Araxxor – melee | Melee | Phase 4 (All Paths) | stuck | spec-weapon | step 13: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Araxxor | Araxxor – necromancy | Necromancy | Top Path – Phase 2 | stuck | cooldown | step 4: Surge is still on cooldown for 19.2 s |
| Araxxor | Araxxor – necromancy | Necromancy | Top Path – Phase 3 | stuck | style-switch | step 2: Death Skulls needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Araxxor | Araxxor – necromancy | Necromancy | Middle Path – Phase 2 | stuck | style-switch | step 3: Command Vengeful Ghost needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Araxxor | Araxxor – necromancy | Necromancy | Middle Path – Phase 3 | stuck | style-switch | step 1: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Araxxor | Araxxor – necromancy | Necromancy | Bottom Path – Phase 2 | stuck | style-switch | step 3: Command Vengeful Ghost needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Araxxor | Araxxor – necromancy | Necromancy | Bottom Path – Phase 3 | stuck | style-switch | step 2: Death Skulls needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Araxxor | Araxxor – necromancy | Necromancy | Phase 4 (All Paths) | stuck | style-switch | step 2: Touch of Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Arch-Glacor | high enrage | Melee | Opener | stuck | spellbook | step 11: Enfeeble: needs the Standard spellbook |
| Arch-Glacor | high enrage | Melee | Magic Phase | stuck | style-switch | step 3: Greater Sonic Wave needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Arch-Glacor | high enrage | Melee | Melee Phase | stuck | two-handed | step 7: Pulverise: needs a two-handed weapon |
| Arch-Glacor | high enrage | Melee | Opener | stuck | cooldown | step 14: Weapon Special Attack is still on cooldown for 49.2 s |
| Arch-Glacor | high enrage | Melee | Ranged Phase | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Arch-Glacor | high enrage | Melee | Melee Phase | stuck | two-handed | step 7: Pulverise: needs a two-handed weapon |
| Arch-Glacor | high enrage | Necromancy | Example Arms rotation | stuck | style-switch | step 7: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Arch-Glacor | high enrage | Necromancy | Clearing Glacyte Minions | stuck | cooldown | step 5: Threads of Fate is still on cooldown for 41.4 s |
| Arch-Glacor | high enrage | Necromancy | Defensive & utility usage | stuck | cooldown | step 7: Anticipation is still on cooldown for 19.2 s |
| Barrows | Barrows – magic | Magic | Rotations | stuck | cooldown | step 18: Soulfire is still on cooldown for 30 s |
| Barrows | Barrows – melee | Melee | Rotations | stuck | cooldown | step 15: Surge is still on cooldown for 15.6 s |
| Corporeal Beast | T90 | Necromancy | T90 Necro Rotation | stuck | conduit | step 7: Conjure Undead Army: needs a siphon and a conduit |
| Corporeal Beast | T95–T100 | Necromancy | T95-T100 Necro Rotation | stuck | conduit | step 6: Conjure Undead Army: needs a siphon and a conduit |
| Dagannoth Kings | Dagannoth Kings – magic | Magic | Rotations | stuck | style-switch | step 6: Corruption Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 9 Elite Sotapannas | stuck | two-handed | step 3: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Rotations – 3 Elite Sakadagami | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Rotations – 3 Elite Sakadagami (2) | stuck | two-handed | step 1: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Rotations – 3 Elite Sakadagami (3) | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Sanctum Guardian | stuck | style-switch | step 4: Galeshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Post Sanctum to Pre Masuta | stuck | cooldown | step 3: Surge is still on cooldown for 19.2 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 2 Cloaked Zealots | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 1 Cloaked Zealot | stuck | two-handed | step 2: Pulverise: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 6 Cloaked Zealots | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 4 Renegade Menaphite Soldier + 2 Eastern Mercenary | stuck | two-handed | step 4: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 4 Cloaked Zealots | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Phase 1 (1st Persistent Hurricane + Greater Shadow Tsunami + Pulverise) | stuck | style-switch | step 8: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Phase 2/3 (Water Skip) | stuck | cooldown | step 9: Punish is still on cooldown for 22.2 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | 3 Defence Pylon | stuck | style-switch | step 11: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Seiryu | stuck | style-switch | step 3: Galeshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Crystal 1 | stuck | two-handed | step 10: Hurricane: needs a two-handed weapon |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Crystal 2 | stuck | spec-weapon | step 7: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Crystal 3 | stuck | spec-weapon | step 5: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | After entering instance | stuck | cooldown | step 6: Surge is still on cooldown for 18.6 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Rotations – 3 Elite Sakadagami | stuck | style-switch | step 5: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 4 Elite Sakadagami + 1 Elite Sotapanna | stuck | style-switch | step 1: Threads of Fate needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Rotations – 3 Elite Sakadagami (2) | stuck | style-switch | step 3: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Necromancy |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Rotations – 3 Elite Sakadagami (3) | stuck | spec-weapon | step 8: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Sanctum Guardian | stuck | spellbook | step 3: Smoke Cloud: needs the Ancient Magicks spellbook |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 4 Cloaked Zealots | stuck | style-switch | step 1: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Phase 1 (Water Skip) | stuck | spellbook | step 2: Smoke Cloud: needs the Ancient Magicks spellbook |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Phase 2/3 (Water Skip) | stuck | cooldown | step 7: Surge is still on cooldown for 13.2 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 3 Defence Pylon | stuck | style-switch | step 5: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Seiryu | stuck | spellbook | step 3: Smoke Cloud: needs the Ancient Magicks spellbook |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Crystal 2 | stuck | spec-weapon | step 8: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | 3 Red Dragons | stuck | eof-missing | step 2: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | 3 Celestial Dragons | stuck | spec-weapon | step 6: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | 2 Celestial Dragons | stuck | spec-weapon | step 4: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | 6 Black Dragons | stuck | spec-weapon | step 5: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | Verak Lith – Example Rotation | stuck | cooldown | step 6: Surge is still on cooldown for 17.4 s |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | Rotation | stuck | spec-weapon | step 9: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Section 1 | timeout | timeout | waiting at Locate · wrong-fired Split Soul expected Locate |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Astellarn | stuck | spec-weapon | step 5: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Section 2 | timeout | timeout | waiting at Locate · wrong-fired Split Soul expected Locate |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Verak Lith | stuck | spec-weapon | step 8: Descent of Darkness is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Section 3 | stuck | style-switch | step 4: Invoke Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Black Stone Dragon – Black Stone Dragon | timeout | timeout | waiting at Crystal Rain · wrong-fired Split Soul expected Crystal Rain |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Black Stone Dragon – Black Stone Dragon (2) | stuck | spec-weapon | step 10: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Scuttlers 3 Scouts | stuck | spec-weapon | step 2: Powerstab is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 4 Zombies 1 Armoured zombie | stuck | two-handed | step 3: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Crassian Leviathan | stuck | spec-weapon | step 5: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 1 Zealot 4 Scuttlers | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 3 Armoured Zombies | stuck | two-handed | step 1: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Necromancers | stuck | cooldown | step 2: Surge is still on cooldown for 19.8 s |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 1 Necromancer 2 Sea Horrors [Bridge of Death] | stuck | style-switch | step 1: Greater Chain needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 3 Sotapannas | stuck | style-switch | step 1: Greater Chain needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Necromancers 2 Huge Skeletons | stuck | style-switch | step 2: Omnipower needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Nuke | stuck | two-handed | step 8: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Taraket the Necromancer – 1 Necromancer (2) | stuck | style-switch | step 2: Greater Sonic Wave needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 5 Warriors 1 Scuttler | stuck | two-handed | step 3: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Warped Skeletons | stuck | two-handed | step 2: Hurricane: needs a two-handed weapon |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 3 Zealots + 2 Warped Skeletons | stuck | style-switch | step 2: Tsunami needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Warped Skeletons + 2 Scouts | stuck | style-switch | step 2: Greater Chain needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Phase 1 + Spinner Skip | stuck | spec-weapon | step 17: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Phase 3 | stuck | style-switch | step 2: Impact needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 2 Scuttlers 2 Scouts | stuck | cooldown | step 7: Surge is still on cooldown for 13.2 s |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | The Crassian Leviathan | stuck | conjure-active | step 24: Conjure Undead Army: all spirits are already active |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 8 Zombies | stuck | souls | step 6: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 1 Necromancer 2 Sea Horrors [Bridge of Death] | stuck | souls | step 4: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Start of fight | stuck | eof-missing | step 15: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 3 Zealots + 2 Warped Skeletons | stuck | souls | step 4: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Phase 1 | stuck | souls | step 26: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Phase 3 - 650k-400k and Phase 4 (400k-0) | stuck | cooldown | step 5: Split Soul is still on cooldown for 56.4 s |
| Flesh-hatcher Mhekarnahz | Instance Camp 140 KPH | Melee | Melee Instance Camp (140 KPH) | stuck | cooldown | step 8: Greater Barge is still on cooldown for 16.8 s |
| Flesh-hatcher Mhekarnahz | Wars Reset 120 KPH | Melee | Melee Wars Reset (120 KPH) | stuck | limitless | step 8: Limitless: cannot be used at 60% adrenaline or more |
| Gregorovic | Gregorovic – melee | Melee | Rotation | stuck | cooldown | step 19: Berserk is still on cooldown for 48.6 s |
| Gregorovic | Gregorovic – necromancy | Necromancy | HM Rotation | stuck | conduit | step 14: Soul Sap: needs a conduit (necromancy off-hand) |
| Helwyr | Helwyr – melee | Melee | Rotation | stuck | cooldown | step 12: Dive is still on cooldown for 15.6 s |
| Kalphite King | solo | Necromancy | omniguard Rotation | stuck | cooldown | step 7: Surge is still on cooldown for 16.8 s |
| Kalphite King | solo | Necromancy | devourersguard Rotation | stuck | cooldown | step 7: Surge is still on cooldown for 16.8 s |
| Kalphite King | solo | Ranged | Rotation | stuck | spec-weapon | step 26: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kalphite Queen | Kalphite Queen – melee | Melee | Active Strategy | stuck | style-switch | step 9: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM duo | Necromancy | Prebuild | stuck | cooldown | step 4: Surge is still on cooldown for 19.2 s |
| Kerapac, the bound | HM duo | Necromancy | Player 1 – Kerapac | stuck | spec-weapon | step 5: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM duo | Necromancy | Player 2 – Phase 1 | stuck | spec-weapon | step 6: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM duo | Necromancy | Player 2 – Kerapac | stuck | spec-weapon | step 5: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Magic | Prior to Start | stuck | cooldown | step 9: Bladed Dive is still on cooldown for 17.4 s |
| Kerapac, the bound | HM solo | Magic | Phase 1 | stuck | cooldown | step 10: Overpower is still on cooldown for 18 s |
| Kerapac, the bound | HM solo | Magic | Phase 2 | stuck | style-switch | step 9: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Magic | Phase 3 | stuck | style-switch | step 10: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Kerapac, the bound | HM solo | Magic | Clone 3 | stuck | two-handed | step 5: Pulverise: needs a two-handed weapon |
| Kerapac, the bound | HM solo | Melee | War's Retreat | stuck | style-switch | step 4: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Melee | Instance Dummy | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Melee | Phase 1 | stuck | cooldown | step 8: Overpower is still on cooldown for 16.2 s |
| Kerapac, the bound | HM solo | Melee | Rotations – Prephase | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Melee | Phase 2 | stuck | style-switch | step 1: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Melee | Rotations – Prephase (2) | stuck | spec-weapon | step 1: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Melee | Phase 3 | stuck | spec-weapon | step 1: Descent of Darkness is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Melee | Clone 2 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Melee | Kerapac | stuck | spec-weapon | step 4: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Melee | Phase 1 | stuck | cooldown | step 15: Overpower is still on cooldown for 21 s |
| Kerapac, the bound | HM solo | Melee | Phase 2 | stuck | eof-missing | step 3: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Kerapac, the bound | HM solo | Melee | Phase 3 | stuck | two-handed | step 15: Hurricane: needs a two-handed weapon |
| Kerapac, the bound | HM solo | Melee | Clone 3 | stuck | spec-weapon | step 3: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Melee | Kerapac | stuck | cooldown | step 8: Weapon Special Attack is still on cooldown for 56.4 s |
| Kerapac, the bound | HM solo | Necromancy | Phase 1 | stuck | spellbook | step 2: Vulnerability: needs the Standard spellbook |
| Kerapac, the bound | HM solo | Necromancy | Phase 4 | stuck | cooldown | step 37: Dive is still on cooldown for 12 s |
| Kerapac, the bound | HM solo | Ranged | Phase 1 | stuck | cooldown | step 10: Deadshot is still on cooldown for 11.4 s |
| Kerapac, the bound | HM solo | Ranged | Phase 2 | stuck | spec-weapon | step 2: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Kerapac, the bound | HM solo | Ranged | Phase 3 | timeout | timeout | waiting at Shadowfall · no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Deadshot need 60 have 30 |
| Kerapac, the bound | HM solo | Ranged | Kerapac | stuck | spec-weapon | step 3: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Legiones | Legiones – ranged | Ranged | Primus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Secundus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Tertius | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Quartus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Quintus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Sextus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Nex | solo | Melee | Shadow Phase | stuck | eof-missing | step 3: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Nex | solo | Melee | Umbra | stuck | spec-weapon | step 2: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Nex | solo | Melee | Cruor | stuck | slaughter | step 1: Slaughter: only within 40 ticks after Dismember |
| Nex | solo | Melee | Glacies | stuck | spec-weapon | step 2: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Nex | solo | Melee | Zaros Phase | stuck | slaughter | step 4: Massacre: only within 40 ticks after Slaughter |
| Nex | solo | Necromancy | Shadow Phase | stuck | cooldown | step 15: Death Essence is still on cooldown for 49.8 s |
| Nex | solo | Ranged | Ice Phase | stuck | spec-weapon | step 1: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Queen Black Dragon | Queen Black Dragon – ranged | Ranged | Phase 1 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Queen Black Dragon | Queen Black Dragon – ranged | Ranged | Phase 4 | stuck | spec-weapon | step 1: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic/melee hybrid | Magic | Phase 1 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic/melee hybrid | Magic | Phase 2 | stuck | spec-weapon | step 4: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic/melee hybrid | Magic | Phase 4 | stuck | style-switch | step 1: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic | Magic | Phase 1-3 | stuck | spec-weapon | step 21: The Last Command is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic | Magic | Phase 4 | stuck | cooldown | step 4: Combust is still on cooldown for 16.2 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee/ranged hybrid | Melee | Phase 1 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee/ranged hybrid | Melee | Phase 2 | stuck | spec-weapon | step 4: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee/ranged hybrid | Melee | Phase 3 | stuck | style-switch | step 5: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee/ranged hybrid | Melee | Phase 4 | stuck | style-switch | step 1: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee | Melee | Method 1 – Phase 2 | stuck | spec-weapon | step 6: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee | Melee | Method 1 – Phase 4 | stuck | cooldown | step 23: Berserk is still on cooldown for 37.8 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – necromancy | Necromancy | Phase 3 | stuck | souls | step 11: Volley of Souls: needs 2 Residual Souls |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – necromancy | Necromancy | Phase 4 | stuck | cooldown | step 19: Death Essence is still on cooldown for 51 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 1 – Phase 1 | timeout | timeout | waiting at Shadowfall · wrong-fired Split Soul expected Shadowfall |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 1 – Phase 2 | stuck | spec-weapon | step 4: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 1 – Phase 3 | stuck | spec-weapon | step 1: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 1 – Phase 4 | stuck | spec-weapon | step 12: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 2 – Phase 1 | stuck | spec-weapon | step 4: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 2 – Phase 2 | stuck | spec-weapon | step 3: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 2 – Phase 3 | stuck | spec-weapon | step 2: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 2 – Phase 4 | stuck | spec-weapon | step 15: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Rex Matriarchs | all matriarchs | Melee | Orikalka – Example Rotation | stuck | spellbook | step 2: Smoke Cloud: needs the Ancient Magicks spellbook |
| Rex Matriarchs | all matriarchs | Melee | Rotation A | stuck | cooldown | step 7: Igneous Showdown is still on cooldown for 54.6 s |
| Rex Matriarchs | all matriarchs | Melee | Pthentraken – Example Rotation | stuck | style-switch | step 1: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Magic |
| Rex Matriarchs | all matriarchs | Melee | Osseous | stuck | style-switch | step 2: Conjure Undead Army needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Rex Matriarchs | Osseous basic | Necromancy | Attack Rotation | stuck | style-switch | step 2: Ranged needs a Ranged weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Rex Matriarchs | Pthentraken basic | Magic | Attack Rotation | stuck | style-switch | step 1: Magic needs a Magic weapon wielded – the rotation has no switch to one and you wield Ranged |
| Rex Matriarchs | Rathis basic | Ranged | Attack Rotation | stuck | style-switch | step 1: Ranged needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Rise of the Six | 4-man duo | Necromancy | Necromancy | stuck | cooldown | step 13: Death Grasp is still on cooldown for 26.4 s |
| Rise of the Six | solo | Ranged | Rotation | stuck | spec-weapon | step 15: Locate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Vermyx, Brood Mother – Phase 1 | stuck | spellbook | step 6: Smoke Cloud: needs the Ancient Magicks spellbook |
| Sanctum of Rebirth | HM solo | Magic | Vermyx, Brood Mother – Phase 2 | stuck | two-handed | step 4: Hurricane: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Magic | Vermyx, Brood Mother – Coilspawn (2) | stuck | style-switch | step 1: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Magic | Vermyx, Brood Mother – Phase 3 | stuck | spec-weapon | step 8: The Last Command is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Kezalam, the Wanderer – Phase 1 | stuck | spec-weapon | step 4: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Moonstone Obelisk 1 | stuck | spec-weapon | step 2: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Kezalam, the Wanderer – Phase 2 | stuck | spellbook | step 9: Smoke Cloud: needs the Ancient Magicks spellbook |
| Sanctum of Rebirth | HM solo | Magic | Moonstone Obelisk 2 | stuck | style-switch | step 1: Wild Magic needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Magic | Kezalam, the Wanderer – Phase 3 | stuck | style-switch | step 1: Asphyxiate needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Magic | Nakatra, Devourer Eternal – Phase 1 | stuck | spec-weapon | step 9: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Nakatra, Devourer Eternal – Phase 2 | stuck | spec-weapon | step 3: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Magic | Nefthys 2 | stuck | style-switch | step 1: Greater Sunshine needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Magic | Prephase | stuck | style-switch | step 2: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Magic | Shadowsands | stuck | two-handed | step 5: Pulverise: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Magic | Nakatra | stuck | spec-weapon | step 13: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Phase 1 | stuck | spellbook | step 6: Smoke Cloud: needs the Ancient Magicks spellbook |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Coilspawn | stuck | style-switch | step 3: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Phase 2 | stuck | two-handed | step 5: Hurricane: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Coilspawn (2) | stuck | style-switch | step 1: Greater Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Phase 3 | stuck | style-switch | step 1: Deadshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Kezalam, the Wanderer – Phase 1 | stuck | spec-weapon | step 9: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Moonstone Obelisk 1 | stuck | cooldown | step 6: Hurricane is still on cooldown for 15.6 s |
| Sanctum of Rebirth | HM solo | Melee | Kezalam, the Wanderer – Phase 2 | stuck | style-switch | step 2: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Moonstone Obelisk 2 | stuck | spec-weapon | step 2: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nakatra, Devourer Eternal – Phase 1 | stuck | spec-weapon | step 9: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nakatra, Devourer Eternal – Phase 2 | stuck | spec-weapon | step 1: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nefthys 1 | stuck | style-switch | step 1: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Nefthys 2 | stuck | style-switch | step 1: Snipe needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Prephase | stuck | style-switch | step 1: Deadshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Sanctum of Rebirth | HM solo | Melee | Shadowsands | stuck | two-handed | step 5: Pulverise: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Melee | Nakatra | stuck | spec-weapon | step 13: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Phase 2 | stuck | two-handed | step 4: Hurricane: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Coilspawn (2) | stuck | spec-weapon | step 1: Gravitate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Vermyx, Brood Mother – Phase 3 | stuck | spec-weapon | step 2: Blackhole is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Kezalam, the Wanderer – Phase 1 | stuck | spec-weapon | step 4: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Moonstone Obelisk 2 (obelisk you didn't use ezk spec on) | stuck | spec-weapon | step 2: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Kezalam, the Wanderer – Phase 2 | stuck | two-handed | step 7: Hurricane: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Melee | Kezalam, the Wanderer – Phase 3 | stuck | spec-weapon | step 10: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nakatra, Devourer Eternal – Phase 1 | stuck | spec-weapon | step 9: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nakatra, Devourer Eternal – Phase 2 | stuck | spec-weapon | step 1: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Nefthys 2 | stuck | style-switch | step 4: Adaptive Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Sanctum of Rebirth | HM solo | Melee | Prephase | stuck | spec-weapon | step 2: Obliterate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Melee | Shadowsands | stuck | two-handed | step 7: Hurricane: needs a two-handed weapon |
| Sanctum of Rebirth | HM solo | Melee | Nakatra | stuck | spec-weapon | step 16: Slice & Dice is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Necromancy | T95 Rotation | stuck | cooldown | step 7: Surge is still on cooldown for 17.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Kezalam, the Wanderer – Phase 1 (2) | stuck | souls | step 28: Volley of Souls: needs 2 Residual Souls |
| Sanctum of Rebirth | HM solo | Necromancy | T100 Rotation | stuck | cooldown | step 7: Surge is still on cooldown for 17.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Kezalam, the Wanderer – Phase 1 (3) | stuck | cooldown | step 22: Surge is still on cooldown for 16.8 s |
| Sanctum of Rebirth | HM solo | Necromancy | Kezalam, the Wanderer – Phase 3 (3) | stuck | cooldown | step 8: Death Skulls is still on cooldown for 47.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 2 (2) | stuck | cooldown | step 33: Death Grasp is still on cooldown for 26.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 4 (2) | stuck | limitless | step 34: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 2 (3) | stuck | limitless | step 13: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 4 (3) | stuck | limitless | step 32: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Ranged | Vermyx, Brood Mother – Phase 1 | timeout | timeout | waiting at Split Soul · on-cooldown Greater Ricochet 14t · wrong-fired Crystal Rain expected Split Soul |
| Sanctum of Rebirth | HM solo | Ranged | Vermyx, Brood Mother – Phase 3 | timeout | timeout | waiting at Split Soul · wrong-fired Crystal Rain expected Split Soul · on-cooldown Crystal Rain 47t |
| Sanctum of Rebirth | HM solo | Ranged | Kezalam, the Wanderer – Phase 1 | stuck | spec-weapon | step 9: Descent of Darkness is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Ranged | Kezalam, the Wanderer – Phase 2 | stuck | spec-weapon | step 4: Descent of Darkness is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Ranged | Nakatra, Devourer Eternal – Phase 1 | stuck | spec-weapon | step 5: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Ranged | Nakatra, Devourer Eternal – Phase 2 | stuck | spec-weapon | step 1: Split Soul is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Sanctum of Rebirth | HM solo | Ranged | Phase 4 | stuck | spec-weapon | step 1: Locate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Solak | 4–5 man | Magic | P0 (Start on signal by base) | stuck | style-switch | step 1: Tsunami needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | P1 | stuck | style-switch | step 1: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | Arms Legs and Core | stuck | style-switch | step 3: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | Eruptions | stuck | cooldown | step 4: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Solak | stuck | cooldown | step 6: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Phase 3 | stuck | style-switch | step 4: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | Phase 3 – Elf | stuck | cooldown | step 3: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Phase 4 – Outside | stuck | style-switch | step 2: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | Phase 4 – Elf | stuck | cooldown | step 3: Overpower is still on cooldown for 28.2 s |
| Solak | duo | Melee | Prefight | stuck | two-handed | step 3: Pulverise: needs a two-handed weapon |
| Solak | duo | Melee | Phase 1 | stuck | cooldown | step 6: Overpower is still on cooldown for 19.2 s |
| Solak | duo | Melee | Phase 2 | stuck | style-switch | step 6: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | duo | Melee | Phase 3 | stuck | style-switch | step 2: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | duo | Melee | Phase 4 | stuck | style-switch | step 2: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | solo | Magic | Phase 1 | stuck | style-switch | step 15: Greater Sonic Wave needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | solo | Magic | Phase 2 | stuck | two-handed | step 6: Pulverise: needs a two-handed weapon |
| Solak | solo | Magic | Phase 3 | stuck | spec-weapon | step 9: The Last Command is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Solak | solo | Magic | Phase 4 | stuck | spec-weapon | step 16: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Solak | solo | Melee | Phase 1 | stuck | spec-weapon | step 9: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Solak | solo | Melee | Phase 2 | stuck | two-handed | step 6: Pulverise: needs a two-handed weapon |
| Solak | solo | Melee | Phase 3 | stuck | style-switch | step 2: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | solo | Melee | Phase 4 | stuck | spec-weapon | step 16: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Solak | solo | Necromancy | Phase 1 | stuck | cooldown | step 29: Death Grasp is still on cooldown for 24.6 s |
| Solak | solo | Necromancy | Phase 2 | stuck | cooldown | step 8: Surge is still on cooldown for 15 s |
| Solak | solo | Necromancy | Phase 3 | stuck | cooldown | step 18: Death Essence is still on cooldown for 43.8 s |
| Solak | solo | Necromancy | Phase 4 | stuck | spec-weapon | step 14: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Telos, the Warden | Telos, the Warden – melee | Melee | Phase 2 | stuck | two-handed | step 5: Hurricane: needs a two-handed weapon |
| Telos, the Warden | Telos, the Warden – melee | Melee | Phase 4 | stuck | two-handed | step 3: Hurricane: needs a two-handed weapon |
| Telos, the Warden | Telos, the Warden – melee | Melee | Red beam rotation | stuck | spec-weapon | step 9: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Telos, the Warden | Telos, the Warden – melee | Melee | Green beam rotation | stuck | spec-weapon | step 10: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Telos, the Warden | Telos, the Warden – ranged | Ranged | Font 3 | stuck | souls | step 13: Volley of Souls: needs 2 Residual Souls |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Phase 2 | stuck | spec-weapon | step 3: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Phase 3 | stuck | style-switch | step 1: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Drop | stuck | style-switch | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Font 2 | stuck | cooldown | step 13: Surge is still on cooldown for 18.6 s |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Font 3 | stuck | style-switch | step 6: Chaos Roar needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Telos, the Warden | Telos, the Warden – ranged/melee hybrid | Ranged | Phase 5 | stuck | spec-weapon | step 5: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Telos, the Warden | Safe Push | Necromancy | Drop Down | stuck | cooldown | step 8: Death Grasp is still on cooldown for 21 s |
| Twin Furies | Twin Furies – melee | Melee | Rotation | stuck | eof-missing | step 18: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 2 – Specific rotations | stuck | two-handed | step 4: Pulverise: needs a two-handed weapon |
| TzKal-Zuk | HM | Melee | Wave 3 – Specific rotations | stuck | style-switch | step 2: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 4 (Igneous wave) – Specific rotations | stuck | two-handed | step 10: Hurricane: needs a two-handed weapon |
| TzKal-Zuk | HM | Melee | Wave 6 – Specific rotations | stuck | style-switch | step 3: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 7 – Specific rotations | stuck | two-handed | step 5: Hurricane: needs a two-handed weapon |
| TzKal-Zuk | HM | Melee | Wave 8 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 8 – Specific rotations | stuck | style-switch | step 2: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 11 | stuck | eof-missing | step 2: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 11 – Specific rotations | stuck | style-switch | step 3: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 12 – Specific rotations | stuck | cooldown | step 9: Overpower is still on cooldown for 24.6 s |
| TzKal-Zuk | HM | Melee | Wave 13 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 13 – Specific rotations | stuck | style-switch | step 3: Greater Ricochet needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 15 (Challenge wave) | stuck | style-switch | step 4: Piercing Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 16 (Triple Jad) | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 16 (Triple Jad) – Specific rotations | stuck | style-switch | step 1: Greater Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Wave 17 (Har-aken) | stuck | spec-weapon | step 10: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| TzKal-Zuk | HM | Melee | Zuk | stuck | spellbook | step 3: Smoke Cloud: needs the Ancient Magicks spellbook |
| TzKal-Zuk | HM | Melee | Pizza | stuck | style-switch | step 1: Binding Shot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| TzKal-Zuk | HM | Melee | Conduits | stuck | spec-weapon | step 16: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| TzKal-Zuk | HM | Necromancy | Wave 1 | stuck | cooldown | step 15: Death Essence is still on cooldown for 58.2 s |
| TzKal-Zuk | HM | Necromancy | Wave 2 | stuck | cooldown | step 10: Death Skulls is still on cooldown for 51 s |
| TzKal-Zuk | HM | Necromancy | Wave 6 | stuck | cooldown | step 11: Surge is still on cooldown for 15 s |
| TzKal-Zuk | HM | Necromancy | Wave 8 | stuck | souls | step 25: Volley of Souls: needs 2 Residual Souls |
| TzKal-Zuk | HM | Necromancy | Wave 9 (Igneous wave) – Specific rotations | stuck | conjure-active | step 34: Conjure Undead Army: all spirits are already active |
| TzKal-Zuk | HM | Necromancy | Wave 10 (Challenge wave) | stuck | spec-weapon | step 4: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| TzKal-Zuk | HM | Necromancy | Wave 11 | stuck | cooldown | step 5: Surge is still on cooldown for 16.8 s |
| TzKal-Zuk | HM | Necromancy | Wave 13 | stuck | command-timing | step 14: Command Vengeful Ghost: needs an active Vengeful Ghost (6 ticks after the conjure) |
| TzKal-Zuk | HM | Necromancy | Wave 14 (Igneous wave) – Specific rotations | stuck | spec-weapon | step 18: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| TzKal-Zuk | HM | Necromancy | Wave 15 (Challenge wave) | stuck | cooldown | step 14: Disruption Shield is still on cooldown for 40.8 s |
| TzKal-Zuk | HM | Necromancy | Wave 16 (Triple Jad) | stuck | cooldown | step 9: Death Skulls is still on cooldown for 49.2 s |
| TzKal-Zuk | HM | Necromancy | First cycle | stuck | cooldown | step 29: Surge is still on cooldown for 13.2 s |
| TzKal-Zuk | HM | Necromancy | Second cycle | stuck | cooldown | step 26: Surge is still on cooldown for 11.4 s |
| TzKal-Zuk | HM | Necromancy | Conduits | stuck | spec-weapon | step 30: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vindicta | Vindicta – melee | Melee | NM Rotation | stuck | cooldown | step 12: Dive is still on cooldown for 15.6 s |
| Vindicta | Vindicta – necromancy | Necromancy | HM Rotation | stuck | style-switch | step 9: Bladed Dive needs a Melee weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Vindicta | NM | Ranged | NM Rotation | stuck | spec-weapon | step 14: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorago | Vorago – melee | Melee | Phase 1 – Bomb Tank | stuck | spec-weapon | step 1: Weapon Special Attack is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorago | Vorago – melee | Melee | Phase 1 – Bomb Tank (2) | stuck | style-switch | step 2: Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago | Vorago – melee | Melee | Phase 1 – Bomb Tank (3) | stuck | style-switch | step 1: Touch of Death needs a Necromancy weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago | introductory solo | Necromancy | Solo bleed clears | stuck | cooldown | step 5: Surge is still on cooldown for 19.8 s |
| Vorago | introductory solo | Necromancy | P5 Teamsplit & Ceiling | stuck | cooldown | step 39: Escape is still on cooldown for 11.4 s |
| Vorago | introductory solo | Necromancy | P5 Purple Bomb & Scopulus | stuck | cooldown | step 33: Escape is still on cooldown for 12 s |
| Vorago (HM) | duo | Magic | Bring Him Down | stuck | style-switch | step 1: Ranged needs a Ranged weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago (HM) | duo | Magic | Base Tank | stuck | style-switch | step 6: Bladed Dive needs a Melee weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago (HM) | duo | Magic | Mauling | stuck | style-switch | step 6: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago (HM) | solo | Necromancy | P4: Scopulus | stuck | spec-weapon | step 10: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorago (HM) | solo | Necromancy | P8: Purple Bomb | stuck | cooldown | step 17: Split Soul is still on cooldown for 43.8 s |
| Vorkath | Vorkath – melee | Melee | Method 1 – Fort Forinthry | stuck | cooldown | step 5: Surge is still on cooldown for 19.8 s |
| Vorkath | Vorkath – melee | Melee | Method 1 – Zemouregal | stuck | cooldown | step 33: Igneous Showdown is still on cooldown for 48 s |
| Vorkath | Vorkath – melee | Melee | Method 2 – Vorkath | stuck | slaughter | step 23: Slaughter: only within 40 ticks after Dismember |
| Vorkath | Vorkath – melee | Melee | Method 2 – Zemouregal | stuck | cooldown | step 20: Igneous Showdown is still on cooldown for 34.8 s |
| Vorkath | Vorkath – necromancy | Necromancy | The Fight | stuck | souls | step 68: Volley of Souls: needs 2 Residual Souls |
| Vorkath | Vorkath – necromancy | Necromancy | NM Solo (Vorkath Skip) | stuck | spec-weapon | step 53: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | Vorkath – necromancy | Necromancy | Phase 2 | stuck | cooldown | step 15: Death Skulls is still on cooldown for 47.4 s |
| Vorkath | Vorkath – necromancy | Necromancy | Rotations – Zemouregal | stuck | spec-weapon | step 14: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | Vorkath – necromancy | Necromancy | Rotations – Zemouregal (2) | stuck | spec-weapon | step 14: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | HM | Magic | Vorkath | stuck | style-switch | step 24: Greater Chain needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Vorkath | HM | Magic | Zemouregal | stuck | style-switch | step 1: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Vorkath | HM | Melee | Wars's Retreat | stuck | style-switch | step 5: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Vorkath | HM | Melee | Vorkath (no immediate scriptureofful proc) | stuck | spec-weapon | step 10: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | HM | Melee | Vorkath (immediate scriptureofful proc on grico) | stuck | spec-weapon | step 7: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | HM | Melee | Zemouregal | stuck | style-switch | step 1: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Vorkath | HM | Ranged | Rotation – Vorkath | stuck | cooldown | step 12: Deadshot is still on cooldown for 12.6 s |
| Vorkath | HM | Ranged | Rotation – Vorkath (2) | stuck | spec-weapon | step 7: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Vorkath | HM | Ranged | Rotation – Zemouregal (2) | stuck | spec-weapon | step 5: Descent of Darkness is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Yakamaru | Yakamaru – magic | Magic | Stun Pool (north-most) | stuck | style-switch | step 10: Backhand needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base | stuck | spec-weapon | step 6: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch | stuck | spec-weapon | step 6: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (2) | stuck | style-switch | step 1: Greater Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch (2) | stuck | style-switch | step 1: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (3) | stuck | spec-weapon | step 3: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch (3) | stuck | spec-weapon | step 7: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (4) | stuck | style-switch | step 1: Greater Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch (4) | stuck | style-switch | step 1: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (5) | stuck | spec-weapon | step 3: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch (5) | stuck | spec-weapon | step 7: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (6) | stuck | style-switch | step 1: Greater Barge needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Witch (6) | stuck | style-switch | step 1: Berserk needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Melee | stuck | style-switch | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Ranged | stuck | spec-weapon | step 15: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 1 | stuck | spec-weapon | step 9: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Rotations – Witch | stuck | style-switch | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 2 | stuck | style-switch | step 1: Greater Flurry needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 3 | stuck | spec-weapon | step 6: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Rotations – Witch (3) | stuck | style-switch | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 4 | stuck | style-switch | step 1: Greater Flurry needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 5 | stuck | spec-weapon | step 6: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Rotations – Witch (5) | stuck | style-switch | step 2: Meteor Strike needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 6 | stuck | style-switch | step 1: Greater Flurry needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 7 | stuck | style-switch | step 2: Overpower needs a Melee weapon wielded – the rotation has no switch to one and you wield Ranged |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Witches | stuck | two-handed | step 8: Pulverise: needs a two-handed weapon |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 1 | stuck | spec-weapon | step 9: Gravitate is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Rotations – Witch | stuck | style-switch | step 3: Imbue: Shadows needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 2 | stuck | spellbook | step 2: Enfeeble: needs the Standard spellbook |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Rotations – Witch (2) | stuck | style-switch | step 1: Deadshot needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 3 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 4 | stuck | two-handed | step 1: Pulverise: needs a two-handed weapon |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 5 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Rotations – Witch (4) | stuck | two-handed | step 4: Hurricane: needs a two-handed weapon |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 6 | stuck | eof-missing | step 1: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 7 | stuck | spec-weapon | step 12: The Final Flurry is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Necromancy | Phases 1, 3, 5, and 6 | stuck | spellbook | step 1: Smoke Cloud: needs the Ancient Magicks spellbook |
| Zamorak, Lord of Chaos | 500% | Necromancy | Phase 7 Rotation | stuck | spec-weapon | step 33: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Necromancy | Phase 7 Rotation - B-rune | stuck | spec-weapon | step 18: Death Grasp is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 1 | stuck | spec-weapon | step 12: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 3 | stuck | spec-weapon | step 6: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 4 | stuck | spec-weapon | step 9: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 5 | stuck | spec-weapon | step 6: Shadowfall is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 6 | stuck | spec-weapon | step 5: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 500% | Ranged | Phase 7 | stuck | spec-weapon | step 21: Crystal Rain is not the special attack of the wielded weapon – switch to its weapon or store it in the Essence of Finality |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 1 Rotation | stuck | style-switch | step 24: Greater Concentrated Blast needs a Magic weapon wielded – the rotation has no switch to one and you wield Melee |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 2 Rotation | stuck | style-switch | step 25: Chaos Roar needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 3 Rotation | stuck | cooldown | step 30: Immortality is still on cooldown for 99.6 s |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 4 Rotation | stuck | eof-missing | step 17: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 5 Rotation | stuck | style-switch | step 25: Chaos Roar needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 7 | stuck | spellbook | step 3: Ice Barrage: needs the Ancient Magicks spellbook |

## Appendix B – finished rotations with late steps or issues

The player is perfect, so a late step here is a timing quirk of the engine worth a look (channel cuts, off-GCD companions, weapon switches inside a GCD).

| Boss | Style | Rotation | Perfect / late (worst) | Issues |
|---|---|---|---|---|
| Angel of Death (7-man) | Magic | Last Pillar and Zaros | 6 / 5 (5) |  |
| Angel of Death (7-man) | Magic | Phase 2 | 7 / 1 (1) | no-adrenaline Tsunami need 100 have 95 |
| Angel of Death (7-man) | Magic | Zaros | 4 / 3 (5) |  |
| Angel of Death (7-man) | Melee | Prefight | 5 / 3 (4) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Natural Instinct need 100 have 45 · no-adrenaline Berserk need 100 have 95 |
| Angel of Death (7-man) | Magic | Prefight | 6 / 2 (4) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Berserk need 100 have 45 |
| Angel of Death (7-man) | Magic | Phase 2 | 7 / 6 (4) | on-cooldown Magma Tempest 4t |
| Angel of Death (7-man) | Magic | Phase 3 | 6 / 4 (5) |  |
| Angel of Death (small teams) | Necromancy | Phase 2 | 9 / 2 (3) |  |
| Barrows | Necromancy | Rotations | 9 / 4 (6) | on-cooldown Command Skeleton Warrior 6t |
| Barrows | Ranged | Rotations | 8 / 3 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED1 – Temple of Aminishi | Ranged | Sanctum Guardian – 3 Cloaked Zealots (2) | 3 / 2 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 |
| ED2 – Dragonkin Laboratory | Necromancy | 2 Lava Strykewyrms | 7 / 3 (3) |  |
| ED2 – Dragonkin Laboratory | Necromancy | 3 Dragonstone dragons 1 Onyx dragon | 9 / 4 (9) |  |
| ED2 – Dragonkin Laboratory | Necromancy | 1 Hydrix dragon | 6 / 5 (16) | on-cooldown Surge 15t · on-cooldown Surge 10t · on-cooldown Surge 5t |
| ED2 – Dragonkin Laboratory | Ranged | Fourth Hand | 7 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED3 – The Shadow Reef | Melee | Rotations – 2 Zealots (2) | 3 / 1 (1) | no-adrenaline Meteor Strike need 60 have 51.5 |
| ED3 – The Shadow Reef | Necromancy | 2 Warped Skeletons + 2 Scouts | 1 / 1 (3) |  |
| Giant Mole (HM) | Melee | Rotations | 7 / 2 (6) | on-cooldown Overpower 6t |
| Gregorovic | Necromancy | NM Rotation | 12 / 2 (3) |  |
| Gregorovic | Ranged | Rotation | 8 / 4 (5) | no-adrenaline Greater Death's Swiftness need 100 have 90 · on-cooldown Greater Ricochet 5t |
| Helwyr | Ranged | Rotation | 9 / 3 (2) | no-adrenaline Greater Death's Swiftness need 100 have 90 |
| Hermod, the Spirit of War | Necromancy | Level 99+ Rotation | 12 / 2 (3) |  |
| Kerapac, the bound | Necromancy | Player 1 – Phase 2 | 14 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 1 – Solo Clone (N or S) | 8 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 2 – Phase 2 | 14 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 2 – Solo Clone (N or S) | 8 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Magic | War's Retreat | 1 / 1 (1) | no-adrenaline Meteor Strike need 60 have 50 |
| Kerapac, the bound | Melee | Clone 2 | 2 / 1 (5) |  |
| Kerapac, the bound | Necromancy | Phase 2 | 13 / 2 (11) | on-cooldown Death Skulls 11t · on-cooldown Death Skulls 5t |
| Kerapac, the bound | Necromancy | Phase 3 | 17 / 1 (8) | on-cooldown Death Skulls 8t |
| Kerapac, the bound | Ranged | Clone 2 | 5 / 2 (3) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Deadshot need 60 have 30 |
| Raksha, the Shadow Colossus | Magic | Pre-fight | 5 / 3 (1) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Gravitate need 60 have 45 · no-adrenaline Berserk need 100 have 90 |
| Raksha, the Shadow Colossus | Melee | Pre-fight | 4 / 3 (1) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Gravitate need 60 have 45 · no-adrenaline Berserk need 100 have 90 |
| Raksha, the Shadow Colossus | Melee | Method 1 – Pre-fight | 2 / 2 (5) | no-adrenaline Berserk need 100 have 50 |
| Raksha, the Shadow Colossus | Melee | Method 1 – Phase 3 | 5 / 2 (9) |  |
| Raksha, the Shadow Colossus | Melee | Method 2 – Phase 4 | 16 / 1 (7) | on-cooldown Greater Barge 7t |
| Rise of the Six | Melee | Melee | 2 / 1 (1) | no-adrenaline Sunfall Slam need 40 have 31.5 |
| Sanctum of Rebirth | Necromancy | Vermyx, Brood Mother – Phase 2 (2) | 15 / 1 (3) |  |
| Sanctum of Rebirth | Ranged | War's Retreat | 3 / 2 (14) | on-cooldown Greater Ricochet 14t · no-adrenaline Imbue: Shadows need 40 have 30 |
| Sanctum of Rebirth | Ranged | Nakatra, Devourer Eternal – Phase 3 | 6 / 1 (1) | no-adrenaline Deadshot need 60 have 10 |
| Solak | Magic | Prefight | 8 / 1 (5) | no-adrenaline Natural Instinct need 100 have 50 |
| Solak | Melee | Prefight | 8 / 1 (5) | no-adrenaline Natural Instinct need 100 have 50 |
| Telos, the Warden | Magic | Phase 2 | 3 / 4 (3) |  |
| Telos, the Warden | Magic | Drop | 2 / 1 (6) |  |
| Telos, the Warden | Magic | Font 2 | 7 / 1 (6) |  |
| Telos, the Warden | Magic | Phase 5 | 7 / 8 (9) | no-adrenaline Soulfire need 35 have 30 |
| Telos, the Warden | Melee | Wars | 1 / 1 (5) | no-adrenaline Rampage need 100 have 50 |
| Telos, the Warden | Melee | Phase 1 | 7 / 3 (4) | no-adrenaline Devotion need 50 have 10 · no-adrenaline Berserk need 100 have 65 |
| Telos, the Warden | Melee | Phase 3 | 5 / 1 (1) | no-adrenaline Blackhole need 50 have 20 |
| Telos, the Warden | Ranged | Phase 1 | 10 / 2 (5) | on-cooldown Greater Ricochet 5t |
| Telos, the Warden | Ranged | Phase 3 | 6 / 3 (8) |  |
| Telos, the Warden | Ranged | Phase 5 | 8 / 4 (7) | no-adrenaline Barricade need 100 have 30 |
| Telos, the Warden | Ranged | Wars | 1 / 1 (7) | no-adrenaline Death's Swiftness need 100 have 30 |
| Telos, the Warden | Ranged | Font 1 | 9 / 3 (1) | no-adrenaline Reflect need 50 have 10 |
| Telos, the Warden | Necromancy | Phase 5 | 7 / 6 (7) | no-adrenaline Living Death need 100 have 78 · no-adrenaline Death Skulls need 60 have 30 · no-adrenaline Barricade need 100 have 30 |
| Twin Furies | Necromancy | HM Rotation | 17 / 2 (3) |  |
| Twin Furies | Ranged | Rotation | 10 / 4 (5) | no-adrenaline Greater Death's Swiftness need 100 have 90 · on-cooldown Greater Ricochet 5t |
| TzKal-Zuk | Melee | Wave 1 – Specific rotations | 7 / 4 (9) |  |
| TzKal-Zuk | Necromancy | Wave 12 | 16 / 2 (3) |  |
| TzKal-Zuk | Necromancy | Pizza Phase | 19 / 2 (20) | on-cooldown Surge 16t · on-cooldown Surge 11t · on-cooldown Surge 6t |
| Vorkath | Melee | Method 1 – Vorkath | 13 / 9 (8) | no-adrenaline Meteor Strike need 60 have 50 |
| Vorkath | Ranged | Rotation – Zemouregal | 9 / 2 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Zamorak, Lord of Chaos | Ranged | Last Witch | 2 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Zamorak, Lord of Chaos | Necromancy | Phases 2 and 4 | 18 / 3 (3) |  |
| Zamorak, Lord of Chaos | Magic | P6 rotation | 11 / 11 (14) | no-adrenaline Tsunami need 100 have 70 · on-cooldown Runic Charge 15t · on-cooldown Runic Charge 10t |
