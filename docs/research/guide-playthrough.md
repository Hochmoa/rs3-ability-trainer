# Guide accounts: every PvME boss rotation played through the trainer (7 September 2026)

Question: can the rotations PvME publishes be played in the trainer as written – and where not, is it the guide, a game update, or a bug in the trainer? Every boss guide of the PvME repository (pvme-guides/rs3-full-boss-guides) was turned into a boss setup (`tools/fetch-presets.py` → `public/data/presets.json`), every setup was added through `PresetsService.add()` like a click on the Boss setups page, and every rotation was played on the Train page by a perfect player (`tools/ui-sim.js`: the page's own engine, synthetic ticks, the expected step pressed the moment it is due). The same loadouts and rotations are published under the guide accounts (below), so players copy exactly what was tested here.

## The guide accounts

One account per boss, named after the boss ("Vorkath", "Rasial", "ED2 Dragonkin Lab" …), `profiles.kind = 'guide'`. They cannot log in (no password, banned until 2999) and show a **Guide** badge wherever a rotation or setup names its owner: the explorer ("Guides" chip lists only them, the default feed hides them unless a search matches), Shared setups, and copied rotations (`Rotation.sourceOwnerKind`). Migrations `0012_guide_accounts.sql` (schema, `ensure_guide_account`) and `0013_guide_content.sql` (content, idempotent upserts on deterministic ids) are applied to the live project. Regenerate the content after a parser or preset change: `tools/ui-sim.js` (adds every preset), `tools/guide-seed-dump.js` (dumps `tools/guide-seed.json`), `python tools/guide-seed-to-sql.py --number <n>`, `npx supabase db push`.

| | Count |
|---|---|
| Guide accounts (bosses) | 38 |
| Boss setups (loadout + rotations, one per style/variant) | 127 |
| Rotations | 905 |

## How the playthrough works

Settings of a training session: full adrenaline at the start, adrenaline recharging (PvME rotations assume a built bar), ping 0, automatic basic attacks off, every hit lands, advanced UI. Each setup's pre-build rotation ("Pre-fight", "War's Retreat", "Prebuild" …) is played first; its end state (conjures, buffs, prayers, stacks, adrenaline) becomes the pre-build of the fight rotations, and a necromancy fight rotation always starts with 12 Necrosis and 5 Residual Souls and the three conjures out (or none, when it conjures them itself) – exactly what `PresetsService` stores for a player.

A rotation ends as **finished** (every step done, the last hits landed), **stuck** (the engine's stuck marker: the expected step refused for good – a cooldown of 10 s or more, a requirement the rotation cannot meet, a weapon the rotation never switches to, a spec the slot cannot fire – the session ends with a red panel naming the step and the reason), **timeout** (1200 ticks without finishing and without a marker), **cannot start** (a step without a key) or **notes only** (no playable step, prose only).

## Result

| Outcome | Rotations |
|---|---|
| finished | 691 |
| stuck | 189 |
| notes-only | 25 |
| total | 905 |

691 of 880 playable rotations (78 %) play through as written. The first round (7 September, morning) ended at 315 of 820 after its fixes; the second round (same day, afternoon) added several Essence of Finality amulets per loadout, the weapon switches the guides leave out, the split of alternative lines into their own rotations and the marker for a special-attack slot that holds another special – the classes below are what stops the rest. Every stuck rotation is in the appendix with its step and marker text.

### By boss

| Boss | Setups | Rotations | Finished | Stuck | Timeout | Notes only |
|---|---|---|---|---|---|---|
| Amascut, the Devourer | 6 | 50 | 32 | 17 | 0 | 1 |
| Angel of Death (7-man) | 12 | 105 | 90 | 14 | 0 | 1 |
| Angel of Death (small teams) | 7 | 44 | 36 | 8 | 0 | 0 |
| Araxxor | 2 | 13 | 11 | 2 | 0 | 0 |
| Arch-Glacor | 3 | 13 | 4 | 9 | 0 | 0 |
| Barrows | 4 | 4 | 2 | 2 | 0 | 0 |
| Beastmaster Durzag | 1 | 1 | 0 | 0 | 0 | 1 |
| Corporeal Beast | 3 | 3 | 1 | 2 | 0 | 0 |
| Dagannoth Kings | 1 | 1 | 1 | 0 | 0 | 0 |
| ED1 – Temple of Aminishi | 2 | 48 | 41 | 7 | 0 | 0 |
| ED2 – Dragonkin Laboratory | 2 | 33 | 29 | 4 | 0 | 0 |
| ED3 – The Shadow Reef | 2 | 70 | 60 | 9 | 0 | 1 |
| Flesh-hatcher Mhekarnahz | 4 | 4 | 2 | 2 | 0 | 0 |
| Giant Mole (HM) | 1 | 1 | 1 | 0 | 0 | 0 |
| Gregorovic | 3 | 7 | 5 | 2 | 0 | 0 |
| Helwyr | 3 | 4 | 3 | 1 | 0 | 0 |
| Hermod, the Spirit of War | 1 | 2 | 2 | 0 | 0 | 0 |
| Kalphite King | 2 | 5 | 5 | 0 | 0 | 0 |
| Kalphite Queen | 1 | 2 | 1 | 1 | 0 | 0 |
| Kerapac, the bound | 6 | 55 | 43 | 11 | 0 | 1 |
| Legiones | 1 | 6 | 0 | 6 | 0 | 0 |
| Nex | 3 | 22 | 19 | 3 | 0 | 0 |
| Queen Black Dragon | 1 | 4 | 4 | 0 | 0 | 0 |
| Raksha, the Shadow Colossus | 6 | 37 | 32 | 5 | 0 | 0 |
| Rasial, the First Necromancer | 1 | 3 | 3 | 0 | 0 | 0 |
| Rex Matriarchs | 5 | 11 | 4 | 6 | 0 | 1 |
| Rise of the Six | 5 | 5 | 4 | 1 | 0 | 0 |
| Sanctum of Rebirth | 5 | 101 | 82 | 12 | 0 | 7 |
| Solak | 5 | 32 | 19 | 13 | 0 | 0 |
| Telos, the Warden | 5 | 42 | 40 | 2 | 0 | 0 |
| Twin Furies | 3 | 4 | 3 | 1 | 0 | 0 |
| TzKal-Zuk | 2 | 44 | 30 | 14 | 0 | 0 |
| Vindicta | 3 | 4 | 2 | 2 | 0 | 0 |
| Vorago | 2 | 10 | 5 | 5 | 0 | 0 |
| Vorago (HM) | 2 | 11 | 6 | 4 | 0 | 1 |
| Vorkath | 5 | 28 | 23 | 5 | 0 | 0 |
| Yakamaru | 1 | 8 | 1 | 1 | 0 | 6 |
| Zamorak, Lord of Chaos | 6 | 68 | 45 | 18 | 0 | 5 |

### Failure classes

| Class | Rotations | What it is | Whose problem |
|---|---|---|---|
| cooldown | 104 | the expected ability is on a cooldown of 10 s or more | guide notation, a few to check |
| style-switch | 23 | the expected ability needs another combat style than the wielded weapon and the rotation has no switch step | guide notation |
| souls | 22 | Volley of Souls with fewer than 2 Residual Souls | to check |
| spellbook | 12 | a spell of another spellbook than the setup's | guide mixes books |
| eof-missing | 7 | an "eofspec" step while the setup wears no Essence of Finality, or the wielded weapon has another style | preset choice |
| limitless | 6 | Limitless pressed at 100 % adrenaline | guide (adrenaline assumption) |
| conjure-active | 5 | Conjure Undead Army while every spirit is out | pre-build |
| conduit | 4 | a necromancy ability while wielding no siphon + conduit | preset choice |
| slaughter | 3 | Slaughter / Massacre outside their window | guide |
| command-timing | 2 | Command X within 6 ticks of the conjure | to check |
| spec-weapon | 1 | the expected special attack belongs to a weapon in the backpack or to a second Essence of Finality | trainer model (one EoF) |
| two-handed | 0 | Hurricane / Pulverise need a two-handed weapon, the setup wields dual weapons | preset choice |

#### style-switch – 23 rotations

PvME hybrid guides (melee + ranged, magic + melee, necromancy + ranged …) write "grico" or "gsunshine" in a melee rotation and expect the reader to switch weapons; the switch is a picture in the gear section, never a step in the rotation text. Since the second round the import inserts the switch itself (`src/app/core/preset-switches.ts`: the steps are walked with the weapons in hand; an ability of another style, a two-handed ability or the special of a backpack weapon gets the switch to the backpack weapon in front of it, hint "switch added"). What remains here is a rotation whose style the setup has no weapon for at all – the guide's preset lists no weapon of that style (a "necrobasic" in a ranged guide, a melee opener in a magic setup), so nothing can be switched to. Not a trainer bug; the marker names the missing style.

| Needs | Wields | Rotations |
|---|---|---|
| Necromancy | Ranged | 6 |
| Necromancy | Melee | 5 |
| Necromancy | Magic | 2 |
| Melee | Necromancy | 2 |
| Magic | Ranged | 2 |
| Ranged | Necromancy | 1 |
| Ranged | Melee | 1 |
| Ranged | nothing | 1 |
| Melee | nothing | 1 |
| Necromancy | nothing | 1 |
| Melee | Magic | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Angel of Death (small teams) | Magic | Prebuild | step 5: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | Magic | Phase 2 | step 7: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (small teams) | Magic | Phase 2 | step 7: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (small teams) | Ranged | Prebuild | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Arch-Glacor | Necromancy | Defensive & utility usage – Alternatively; anti | step 10: Flurry needs a Melee weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Kalphite Queen | Melee | Active Strategy – Second form | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |

#### spec-weapon – 1 rotations

"varanussmercy eofspec", "deathguard90 eofspec", "sgb eofspec", "gloomfirebow eofspec", "dclaws eofspec", "ecb eofspec", "swh eofspec": PvME players carry one Essence of Finality per stored special attack and swap amulets mid-rotation. Since the second round the loadout carries several amulets: every EoF item (neck or backpack) holds its own stored special (`ItemRef.spec`), the resolved loadout lists them (`eofSpecs`), and the EoF slot fires the special the rotation expects next when an amulet stores it – the swap is free like in the game. The import assigns the guide's "eofspec" specials to the amulets the preset carries and adds amulets when it carries fewer. What remains: a stored special whose style no weapon of the setup has (the marker says "stored in an Essence of Finality but needs a Ranged weapon wielded"), and specials of weapons the setup does not carry.

| Special attack | Weapon | Rotations |
|---|---|---|
| Weapon Special Attack |  | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Vorago | Melee | Phase 1 – Bomb Tank | step 1: Weapon Special Attack is not the special attack of the wielded weapon and no Essence of Finality you carry stores it – switch to its weapon or |

#### cooldown – 104 rotations

The marker the request asked for: the expected ability is on a cooldown of 10 s or more, so something is certainly wrong. Reading the PvME source lines of every class (the text is in `public/data/presets.json`, field `text`):

- **Alternative lines merged into one rotation** (Overpower, Igneous Showdown, Death Skulls, Galeshot, Command Skeleton Warrior, Death Grasp, Threads of Fate …): a PvME rotation block often holds several lines that are alternatives, not a sequence – ">50% adren: … / <50% adren: …" (Telos Drop Down), "Easier dummy build … / Harder dummy build …" (Kalphite King), "Pillar 1 … / Pillar 2 … / Pillar 4 deathskulls" (Angel of Death), "If ≤3 residualsoul: …" (Solak), "Rotation A" lines for different phases. The parser joins the lines, so the second line casts Overpower or Death Skulls again 5–10 ticks after the first. Not a game change and not an engine bug: the cooldowns were checked against the wiki (Overpower 30 s, Death Skulls 30 s, Command Skeleton Warrior 15 s and first available 6 ticks after the conjure, Threads of Fate 45 s since 29 August 2023, Death Grasp 30 s, Igneous Showdown 60 s). Fix worth making: `tools/fetch-presets.py` splits a block into one rotation per line when a line starts with a condition (">50%", "If", "Alt", "Easier"/"Harder", "Pillar n", "Phase n"); rotation ids of the guide accounts change with it (the seed ids are preset id + rotation index).
- **Alternative lines, second round**: `tools/fetch-presets.py` now cuts a section into one rotation per part when a line opens an alternative or a later part (">50% adren:", "If ≤3 residualsoul:", "Easier / Harder dummy build", "Pillar 1 …", "First form:", a line ending in ":"), named "<section> – <label>"; a remark without a sequence stays a note. 840 rotations became 905. What remains are lines that read as a sequence but are alternatives without a marker word (Rise of the Six: five lines for five situations) – nothing in the text tells them apart.
- **Stall / release notation** (Meteor Strike, Overpower, Galeshot, Greater Ricochet …): "smeteorstrike → … → rmeteorstrike" is one cast – the stall queues it, the release fires it. The parser produced two casts; fixed in the first round (`mergeStallRelease` in `src/app/core/pvme.ts`: the stall becomes a note, the release the step).
- **Surge → Surge** (Angel of Death Lure, Araxxor Phase 2, Amascut): the Double Surge relic power – Surge has a second charge with its own cooldown. Modelled since the second round (relic "Double Surge" on the Loadout page, `ResolvedLoadout.chargesAdd`); the import sets it on a setup whose rotations write Surge twice within three steps. What remains are Surge chains longer than two (Araxxor's eight Surges and Dives across a phase, played with time between them in the game) and Escape/Dive pairs that need the Mobile perk the setups do not carry.
- **Weapon Special Attack after Igneous Showdown** (Araxxor Phase 1, Arch-Glacor Opener, Kerapac): "ezk spec" earlier and a bare "spec" later in the same block – the generic step now takes whatever the slot fires (fixed this round), so these are the wielded weapon's spec pressed twice inside its cooldown, again two alternative lines.

| Ability | Rotations |
|---|---|
| Overpower | 22 |
| Hurricane | 8 |
| Surge | 7 |
| Igneous Showdown | 5 |
| Weapon Special Attack | 5 |
| Greater Barge | 4 |
| Death Grasp | 4 |
| Death Essence | 4 |
| Death Skulls | 4 |
| Bladed Dive | 3 |
| Threads of Fate | 3 |
| Dive | 3 |
| Deadshot | 3 |
| Berserk | 3 |
| Crystal Rain | 3 |
| Pulverise | 2 |
| Punish | 2 |
| Essence of Finality | 2 |
| Split Soul | 2 |
| Resonance | 2 |
| Escape | 2 |
| Immortality | 2 |
| Smoke Tendrils | 1 |
| Rapid Fire | 1 |
| Soulfire | 1 |
| Tsunami | 1 |
| Combust | 1 |
| Galeshot | 1 |
| Chaos Roar | 1 |
| Disruption Shield | 1 |
| Meteor Strike | 1 |

| Boss | Style | Rotation | Marker |
|---|---|---|---|
| Amascut, the Devourer | Magic | Wars | step 4: Igneous Showdown is still on cooldown for 58.2 s |
| Amascut, the Devourer | Magic | Phase 2 and 3 | step 35: Overpower is still on cooldown for 17.4 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | Magic | Phase 6 | step 24: Pulverise is still on cooldown for 50.4 s |
| Amascut, the Devourer | Magic | Phase 2 and 3 | step 10: Overpower is still on cooldown for 20.4 s |
| Amascut, the Devourer | Magic | Phase 4 | step 9: Overpower is still on cooldown for 28.2 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | Ranged | Phase 2 and 3 | step 21: Overpower is still on cooldown for 16.2 s |
| Amascut, the Devourer | Ranged | Phase 4 | step 18: Punish is still on cooldown for 18.6 s |
| Amascut, the Devourer | Magic | Phase 5 | step 8: Hurricane is still on cooldown for 15.6 s |

#### two-handed – 0 rotations

Hurricane and Pulverise need a two-handed weapon; the melee guides list both a dual-wield and a two-handed set and the preset takes the first. Since the second round the import inserts the switch to the 2h of the style before such an ability (and back to the pair when a later step needs it). What remains: setups whose backpack holds no two-handed weapon of the style at all.


#### spellbook, eof-missing, souls, command-timing and the rest

- **spellbook** (12): the setup's spellbook is the one of the first spell the guide names; Amascut's magic guides then cast Smoke Cloud / Ice Barrage (Ancient) in one rotation and Enfeeble (Standard) in another. One spellbook per loadout is the game's rule too – the guide assumes the reader picks the book per phase. Marker text is exact; nothing to fix in the trainer beyond a spellbook-switch note.
  - Disruption Shield: needs the Lunar spellbook: 6
  - Smoke Cloud: needs the Ancient Magicks spellbook: 4
  - Vulnerability: needs the Standard spellbook: 1
  - Enfeeble: needs the Standard spellbook: 1
- **eof-missing** (7): an "eofspec" step while the setup wears no Essence of Finality (the guide's preset lists another amulet) or the wielded weapon is of another style than the stored spec. Preset choice, same fix as spec-weapon.
- **souls** (22): Volley of Souls with fewer than 2 Residual Souls – "volleyofsouls → soulsap → volleyofsouls" (Angel of Death, Nex, Vorkath, Sanctum). Soul Sap gives one soul, so the second Volley needs the souls the guide expects from elsewhere (Zorgoth's soul ring procs, auto-attacks the rotation does not write). Worth a look: whether a Necromancy auto-attack should build a soul in the engine, or whether the guide counts on the ring.
- **command-timing** (2): the wiki confirms Command X is first available on tick 6 after the conjure (the "conjure skeleton" problem): a rotation that conjures on tick 0 and commands on tick 3 cannot be played in the game either; the ones listed conjure late in the rotation while commanding early, and the pre-build's spirits expire before the conjure (a modelling compromise this round – the pre-build follows the rotation's conjure and command order). A pre-built spirit is now commandable at once whatever lifetime it has left (the old rule computed its age from the base duration and made Life-Transfer-extended spirits "just conjured"; that was a real engine bug and the cause of the earlier "Command Skeleton Warrior is still on cooldown for 11 s" markers at the first step).
- **limitless** (6): Limitless at 100 % adrenaline – the session starts full, the guide assumes a partly spent bar.
- **timeout** (0): no marker fired within 1200 ticks. Since the second round a special-attack slot that holds another special than the step due refuses the press (three refusals end the session stuck), and a special fired by its own key against a different special due counts the same way – what is left are adrenaline shortfalls the guide assumes away (Imbue: Shadows at low adrenaline).
- **conduit / slaughter / other**: a necromancy ability in a ranged/necro hybrid while wielding the bow (no switch), Slaughter / Massacre outside their window (guide), Life Transfer without a spirit.

## Fixes made in this round

- `PresetsService.add()`: switch weapons of the guide go into the backpack with keys (nine weapon keys F1–F4, F6–F10), the familiar comes from the scroll the rotations press, the spellbook from the spells, the EoF spec from the first "eofspec", the necromancy pre-build (12 Necrosis, 5 souls, conjures) per rotation (`necroPrebuild`).
- Engine: switch-to-wielded-weapon steps and prayers already on complete themselves; a wrong-weapon press of the expected step three times ends the session stuck (`weaponStrike`); a slot press that cannot fire the expected spec is such a strike; a generic "Weapon Special Attack" step takes whatever spec the slot fires; a pre-built spirit is commandable at once.
- PvME parser: "X eofspec" fires from the EoF; the "s"/"r" stall/release prefixes; a stall released later is one cast; lead-in prose before an alias stays a note; "(tc)" etc. as before.
- Combat dummy key (`` ` ``), six skills up to level 120.
- Explore: guide rotations have their own chip and stay out of the default feed unless a search matches.
- Second round, later: the EoF slot takes any carried amulet whose special fits the wielded style when no special is due (a bare "eofspec" step), and the import switches to the style of a stored special for such a step; the Double Surge relic.
- Second round: several Essence of Finality amulets per loadout (`ItemRef.spec` on every EoF item, `ResolvedLoadout.eofSpecs`, `eofSpecReady(wantId)`), the EoF slot fires the special the rotation expects; weapon switches inserted by the import (`preset-switches.ts`: style changes, two-handed abilities, specials of backpack weapons, stored specials of another style); PvME alternative lines as separate rotations (`split_alternatives` in `tools/fetch-presets.py`); the spellbook of a setup is the book most of its spells belong to; the special-attack slot refuses a press while another special is due and marks the session stuck after three; `tools/guide-seed-to-sql.py` deletes rotations that left the dump.

## Open, in order of value

1. Setups whose backpack lacks a weapon of a style or the 2h the rotation needs (23 rotations): the preset could take the weapons from the guide's gear pictures, or a second weapon set per setup.
2. Cooldown markers from lines that are alternatives without a marker word (104): only a hand-made override list per guide can tell them apart.
3. Mobile perk (Bladed Dive / Escape / Surge chains) on the setups that need it – perks are not imported from the guides.
4. Volley of Souls soul income (22): the engine models Soul Sap, Threads of Fate multi-target, Spectral Scythe 25 %, Zorgoth's ring 5 % and the Devourer's Guard like the wiki; the guides count on multi-target Soul Sap or luck.
5. Specials of weapons the setup does not carry, stored specials whose style no weapon of the setup has (8).
6. The pre-build of a guide rotation is not copied with it (pre-builds are local per rotation id) – a copied necromancy rotation starts without stacks and conjures unless the player sets the pre-build on the Train page.

## Reproduce

Dev app (`preview_start rs3trainer`, port 4400), Train page, paste `tools/ui-sim.js` into the console, then `window.__sim.run({ recharge: true, clear: true })` (about 20 minutes for all setups; keep the tab in front). Results in `window.__sim.results`; `python tools/…` is not needed – the tables of this file come from the results json through a small script (counts per outcome, per boss, per marker text). Clear storage afterwards: the run leaves every setup in the browser.

## Appendix A – every rotation that did not finish

| Boss | Variant | Style | Rotation | Outcome | Class | Step and marker |
|---|---|---|---|---|---|---|
| Amascut, the Devourer | 1000% base | Magic | Wars | stuck | cooldown | step 4: Igneous Showdown is still on cooldown for 58.2 s |
| Amascut, the Devourer | 1000% base | Magic | Phase 1 | stuck | spellbook | step 21: Disruption Shield: needs the Lunar spellbook |
| Amascut, the Devourer | 1000% base | Magic | Phase 2 and 3 | stuck | cooldown | step 35: Overpower is still on cooldown for 17.4 s |
| Amascut, the Devourer | 1000% base | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 1000% base | Magic | Phase 6 | stuck | cooldown | step 24: Pulverise is still on cooldown for 50.4 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 2 and 3 | stuck | cooldown | step 10: Overpower is still on cooldown for 20.4 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 4 | stuck | cooldown | step 9: Overpower is still on cooldown for 28.2 s |
| Amascut, the Devourer | 1000% dps | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 2 and 3 | stuck | cooldown | step 21: Overpower is still on cooldown for 16.2 s |
| Amascut, the Devourer | 1000% dps | Ranged | Phase 4 | stuck | cooldown | step 18: Punish is still on cooldown for 18.6 s |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 2 and 3 | stuck | souls | step 42: Volley of Souls: needs 2 Residual Souls |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 4 | stuck | souls | step 17: Volley of Souls: needs 2 Residual Souls |
| Amascut, the Devourer | 1000%–2000% | Necromancy | Phase 6 – Non-jump | stuck | conjure-active | step 23: Conjure Undead Army: all spirits are already active |
| Amascut, the Devourer | 2000% base | Magic | Phase 5 | stuck | cooldown | step 8: Hurricane is still on cooldown for 15.6 s |
| Amascut, the Devourer | 2000% base | Magic | Phase 6 | stuck | cooldown | step 24: Pulverise is still on cooldown for 50.4 s |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 2 and 3 | stuck | cooldown | step 30: Overpower is still on cooldown for 22.2 s |
| Amascut, the Devourer | 2000% dps | Ranged | Phase 5 | stuck | cooldown | step 10: Hurricane is still on cooldown for 15.6 s |
| Angel of Death (7-man) | base | Necromancy | Phase 2 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation – Phase 3 | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Phase 2 | stuck | cooldown | step 10: Essence of Finality is still on cooldown for 22.8 s |
| Angel of Death (7-man) | HAMM | Necromancy | Rotation (2/3+ Rangers on team) – Phase 3 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | minion tank | Magic | Phase 1 | stuck | limitless | step 5: Limitless: cannot be used at 60% adrenaline or more |
| Angel of Death (7-man) | minion tank | Magic | Phase 1 | stuck | cooldown | step 18: Smoke Tendrils is still on cooldown for 19.8 s |
| Angel of Death (7-man) | minion tank | Magic | Pillars – Pillar 4 gconc | stuck | limitless | step 2: Limitless: cannot be used at 60% adrenaline or more |
| Angel of Death (7-man) | minion tank | Melee | Phase 2 | stuck | cooldown | step 24: Bladed Dive is still on cooldown for 17.4 s |
| Angel of Death (7-man) | minion tank | Melee | Pillars | stuck | eof-missing | step 15: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Angel of Death (7-man) | minion tank | Melee | Prefight – When everyone is in | stuck | cooldown | step 11: Greater Barge is still on cooldown for 15 s |
| Angel of Death (7-man) | minion tank | Melee | Pillars | stuck | cooldown | step 18: Bladed Dive is still on cooldown for 17.4 s |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation – Phase 3 | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Phase 2 | stuck | cooldown | step 10: Essence of Finality is still on cooldown for 22.8 s |
| Angel of Death (7-man) | minion tank free | Necromancy | Rotation (2/3+ Rangers on team) – Phase 3 | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (small teams) | base | Magic | Prebuild | stuck | style-switch | step 5: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | base | Magic | Phase 2 | stuck | style-switch | step 7: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (small teams) | dps | Magic | Phase 2 | stuck | style-switch | step 7: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Magic |
| Angel of Death (small teams) | duo trio basic | Necromancy | Phase 1 | stuck | conjure-active | step 39: Conjure Undead Army: all spirits are already active |
| Angel of Death (small teams) | duo trio basic | Necromancy | Phase 2 | stuck | cooldown | step 12: Threads of Fate is still on cooldown for 37.8 s |
| Angel of Death (small teams) | minion tank no prebuild | Ranged | Prebuild | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Angel of Death (small teams) | solo | Ranged | Phase 2 Rotation: Clearing Amalgamations | stuck | souls | step 18: Volley of Souls: needs 2 Residual Souls |
| Angel of Death (small teams) | solo basic | Necromancy | Phase 2 | stuck | cooldown | step 13: Threads of Fate is still on cooldown for 37.8 s |
| Araxxor | Araxxor – melee | Melee | Phase 1 | stuck | cooldown | step 3: Weapon Special Attack is still on cooldown for 58.2 s |
| Araxxor | Araxxor – necromancy | Necromancy | Top Path – Phase 2 | stuck | cooldown | step 5: Surge is still on cooldown for 18.6 s |
| Arch-Glacor | high enrage | Melee | Opener | stuck | cooldown | step 14: Weapon Special Attack is still on cooldown for 49.2 s |
| Arch-Glacor | high enrage | Melee | Magic Phase | stuck | cooldown | step 19: Weapon Special Attack is still on cooldown for 49.2 s |
| Arch-Glacor | high enrage | Melee | Melee Phase | stuck | cooldown | step 20: Hurricane is still on cooldown for 15.6 s |
| Arch-Glacor | high enrage | Melee | Opener | stuck | cooldown | step 14: Weapon Special Attack is still on cooldown for 49.2 s |
| Arch-Glacor | high enrage | Melee | Ranged Phase | stuck | cooldown | step 13: Rapid Fire is still on cooldown for 13.2 s |
| Arch-Glacor | high enrage | Melee | Melee Phase | stuck | cooldown | step 22: Hurricane is still on cooldown for 15.6 s |
| Arch-Glacor | high enrage | Necromancy | Example Arms rotation | stuck | cooldown | step 23: Death Grasp is still on cooldown for 28.2 s |
| Arch-Glacor | high enrage | Necromancy | Clearing Glacyte Minions | stuck | cooldown | step 5: Threads of Fate is still on cooldown for 41.4 s |
| Arch-Glacor | high enrage | Necromancy | Defensive & utility usage – Alternatively; anti | stuck | style-switch | step 10: Flurry needs a Melee weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Barrows | Barrows – magic | Magic | Rotations | stuck | cooldown | step 18: Soulfire is still on cooldown for 30 s |
| Barrows | Barrows – melee | Melee | Rotations | stuck | cooldown | step 15: Surge is still on cooldown for 15.6 s |
| Corporeal Beast | T90 | Necromancy | T90 Necro Rotation | stuck | conduit | step 7: Conjure Undead Army: needs a siphon and a conduit |
| Corporeal Beast | T95–T100 | Necromancy | T95-T100 Necro Rotation | stuck | conduit | step 6: Conjure Undead Army: needs a siphon and a conduit |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Phase 1 (1st Persistent Hurricane + Greater Shadow Tsunami + Pulverise) | stuck | cooldown | step 23: Igneous Showdown is still on cooldown for 33 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – melee/ranged hybrid | Melee | Phase 2/3 (Water Skip) | stuck | cooldown | step 9: Punish is still on cooldown for 22.2 s |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 4 Elite Sakadagami + 1 Elite Sotapanna | stuck | souls | step 6: Volley of Souls: needs 2 Residual Souls |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Sanctum Guardian | stuck | spellbook | step 12: Disruption Shield: needs the Lunar spellbook |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 4 Cloaked Zealots | stuck | souls | step 7: Volley of Souls: needs 2 Residual Souls |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | Phase 2/3 (Water Skip) | stuck | spellbook | step 10: Disruption Shield: needs the Lunar spellbook |
| ED1 – Temple of Aminishi | ED1 – Temple of Aminishi – ranged | Ranged | 3 Defence Pylon | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | 3 Red Dragons | stuck | eof-missing | step 2: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – necromancy | Necromancy | Rotation | stuck | spellbook | step 37: Smoke Cloud: needs the Ancient Magicks spellbook |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Section 1 | stuck | cooldown | step 13: Surge is still on cooldown for 11.4 s |
| ED2 – Dragonkin Laboratory | ED2 – Dragonkin Laboratory – ranged | Ranged | Section 3 | stuck | souls | step 10: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | 2 Necromancers | stuck | cooldown | step 7: Surge is still on cooldown for 16.2 s |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – melee/magic hybrid | Melee | Nuke | stuck | cooldown | step 12: Greater Barge is still on cooldown for 13.2 s |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | The Crassian Leviathan | stuck | conjure-active | step 24: Conjure Undead Army: all spirits are already active |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 8 Zombies | stuck | souls | step 6: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 1 Necromancer 2 Sea Horrors [Bridge of Death] | stuck | souls | step 4: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Start of fight | stuck | eof-missing | step 15: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | 3 Zealots + 2 Warped Skeletons | stuck | souls | step 4: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Phase 1 | stuck | souls | step 26: Volley of Souls: needs 2 Residual Souls |
| ED3 – The Shadow Reef | ED3 – The Shadow Reef – necromancy | Necromancy | Phase 3 - 650k-400k and Phase 4 (400k-0) – Otherwise, splitsoul | stuck | command-timing | step 36: Command Skeleton Warrior: needs an active Skeleton Warrior (6 ticks after the conjure) |
| Flesh-hatcher Mhekarnahz | Instance Camp 140 KPH | Melee | Melee Instance Camp (140 KPH) | stuck | cooldown | step 8: Greater Barge is still on cooldown for 16.8 s |
| Flesh-hatcher Mhekarnahz | Wars Reset 120 KPH | Melee | Melee Wars Reset (120 KPH) | stuck | limitless | step 8: Limitless: cannot be used at 60% adrenaline or more |
| Gregorovic | Gregorovic – melee | Melee | Rotation – Without | stuck | eof-missing | step 13: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Gregorovic | Gregorovic – necromancy | Necromancy | HM Rotation | stuck | conduit | step 14: Soul Sap: needs a conduit (necromancy off-hand) |
| Helwyr | Helwyr – melee | Melee | Rotation | stuck | cooldown | step 12: Dive is still on cooldown for 15.6 s |
| Kalphite Queen | Kalphite Queen – melee | Melee | Active Strategy – Second form | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Kerapac, the bound | HM solo | Magic | Prior to Start | stuck | cooldown | step 9: Bladed Dive is still on cooldown for 17.4 s |
| Kerapac, the bound | HM solo | Magic | Phase 1 | stuck | cooldown | step 10: Overpower is still on cooldown for 18 s |
| Kerapac, the bound | HM solo | Magic | Phase 2 | stuck | cooldown | step 24: Tsunami is still on cooldown for 47.4 s |
| Kerapac, the bound | HM solo | Melee | Phase 1 | stuck | cooldown | step 8: Overpower is still on cooldown for 15 s |
| Kerapac, the bound | HM solo | Melee | Phase 1 | stuck | cooldown | step 15: Overpower is still on cooldown for 21 s |
| Kerapac, the bound | HM solo | Melee | Phase 2 | stuck | eof-missing | step 3: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Kerapac, the bound | HM solo | Melee | Kerapac | stuck | cooldown | step 8: Weapon Special Attack is still on cooldown for 56.4 s |
| Kerapac, the bound | HM solo | Necromancy | Phase 1 | stuck | spellbook | step 2: Vulnerability: needs the Standard spellbook |
| Kerapac, the bound | HM solo | Necromancy | Phase 4 | stuck | cooldown | step 37: Dive is still on cooldown for 12 s |
| Kerapac, the bound | HM solo | Ranged | Phase 1 | stuck | cooldown | step 10: Deadshot is still on cooldown for 11.4 s |
| Kerapac, the bound | HM solo | Ranged | Phase 3 | stuck | cooldown | step 11: Deadshot is still on cooldown for 21 s |
| Legiones | Legiones – ranged | Ranged | Primus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Secundus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Tertius | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Quartus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Quintus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Legiones | Legiones – ranged | Ranged | Sextus | stuck | style-switch | step 1: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Ranged |
| Nex | solo | Melee | Cruor | stuck | slaughter | step 1: Slaughter: only within 40 ticks after Dismember |
| Nex | solo | Melee | Zaros Phase | stuck | slaughter | step 4: Massacre: only within 40 ticks after Slaughter |
| Nex | solo | Necromancy | Shadow Phase | stuck | cooldown | step 15: Death Essence is still on cooldown for 49.8 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – magic | Magic | Phase 4 | stuck | cooldown | step 4: Combust is still on cooldown for 16.2 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – melee | Melee | Method 1 – Phase 4 | stuck | cooldown | step 23: Berserk is still on cooldown for 37.8 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – necromancy | Necromancy | Phase 3 | stuck | souls | step 11: Volley of Souls: needs 2 Residual Souls |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – necromancy | Necromancy | Phase 4 | stuck | cooldown | step 19: Death Essence is still on cooldown for 51 s |
| Raksha, the Shadow Colossus | Raksha, the Shadow Colossus – ranged | Ranged | Method 1 – Phase 4 | stuck | cooldown | step 12: Crystal Rain is still on cooldown for 17.4 s |
| Rex Matriarchs | all matriarchs | Melee | Orikalka – Example Rotation | stuck | spellbook | step 2: Smoke Cloud: needs the Ancient Magicks spellbook |
| Rex Matriarchs | all matriarchs | Melee | Rotation A | stuck | cooldown | step 7: Igneous Showdown is still on cooldown for 54.6 s |
| Rex Matriarchs | all matriarchs | Melee | Osseous | stuck | conduit | step 3: Conjure Undead Army: needs a siphon and a conduit |
| Rex Matriarchs | Osseous basic | Necromancy | Attack Rotation | stuck | style-switch | step 2: Ranged needs a Ranged weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Rex Matriarchs | Pthentraken basic | Magic | Attack Rotation | stuck | style-switch | step 1: Magic needs a Magic weapon wielded – the rotation has no switch to one and you wield Ranged |
| Rex Matriarchs | Rathis basic | Ranged | Attack Rotation | stuck | style-switch | step 1: Ranged needs a Ranged weapon wielded – the rotation has no switch to one and you wield Melee |
| Rise of the Six | 4-man duo | Necromancy | Necromancy | stuck | cooldown | step 13: Death Grasp is still on cooldown for 26.4 s |
| Sanctum of Rebirth | HM solo | Magic | Nakatra, Devourer Eternal – Phase 2 | stuck | spellbook | step 11: Disruption Shield: needs the Lunar spellbook |
| Sanctum of Rebirth | HM solo | Melee | Moonstone Obelisk 1 | stuck | cooldown | step 6: Hurricane is still on cooldown for 15.6 s |
| Sanctum of Rebirth | HM solo | Melee | Nakatra, Devourer Eternal – Phase 2 | stuck | cooldown | step 12: Overpower is still on cooldown for 19.2 s |
| Sanctum of Rebirth | HM solo | Necromancy | T95 Rotation | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Sanctum of Rebirth | HM solo | Necromancy | Kezalam, the Wanderer – Phase 1 (2) | stuck | souls | step 28: Volley of Souls: needs 2 Residual Souls |
| Sanctum of Rebirth | HM solo | Necromancy | T100 Rotation | stuck | souls | step 9: Volley of Souls: needs 2 Residual Souls |
| Sanctum of Rebirth | HM solo | Necromancy | Kezalam, the Wanderer – Phase 3 (3) | stuck | cooldown | step 8: Death Skulls is still on cooldown for 47.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 2 (2) | stuck | cooldown | step 33: Death Grasp is still on cooldown for 26.4 s |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 4 (2) | stuck | limitless | step 34: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 2 (3) | stuck | limitless | step 13: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Necromancy | Nakatra, Devourer Eternal – Phase 4 (3) | stuck | limitless | step 32: Limitless: cannot be used at 60% adrenaline or more |
| Sanctum of Rebirth | HM solo | Ranged | Vermyx, Brood Mother – Phase 1 | stuck | cooldown | step 15: Galeshot is still on cooldown for 11.4 s |
| Solak | 4–5 man | Magic | Eruptions | stuck | cooldown | step 4: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Solak | stuck | cooldown | step 6: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Phase 3 – Elf | stuck | cooldown | step 3: Overpower is still on cooldown for 28.2 s |
| Solak | 4–5 man | Magic | Phase 4 – Outside | stuck | style-switch | step 2: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | 4–5 man | Magic | Phase 4 – Elf | stuck | cooldown | step 3: Overpower is still on cooldown for 28.2 s |
| Solak | duo | Melee | Prefight | stuck | style-switch | step 19: Invoke Lord of Bones needs a Necromancy weapon wielded – the rotation has no switch to one and you wield Melee |
| Solak | duo | Melee | Phase 1 | stuck | cooldown | step 6: Overpower is still on cooldown for 19.2 s |
| Solak | solo | Magic | Phase 2 | stuck | cooldown | step 30: Overpower is still on cooldown for 18.6 s |
| Solak | solo | Melee | Phase 2 | stuck | cooldown | step 29: Overpower is still on cooldown for 18.6 s |
| Solak | solo | Necromancy | Phase 1 | stuck | cooldown | step 29: Death Grasp is still on cooldown for 24.6 s |
| Solak | solo | Necromancy | Phase 2 | stuck | cooldown | step 8: Surge is still on cooldown for 15 s |
| Solak | solo | Necromancy | Phase 3 | stuck | cooldown | step 18: Death Essence is still on cooldown for 43.8 s |
| Solak | solo | Necromancy | Phase 4 | stuck | cooldown | step 16: Split Soul is still on cooldown for 47.4 s |
| Telos, the Warden | Telos, the Warden – melee | Melee | Phase 4 | stuck | cooldown | step 20: Resonance is still on cooldown for 15.6 s |
| Telos, the Warden | Telos, the Warden – ranged | Ranged | Font 3 | stuck | souls | step 13: Volley of Souls: needs 2 Residual Souls |
| Twin Furies | Twin Furies – melee | Melee | Rotation | stuck | eof-missing | step 18: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| TzKal-Zuk | HM | Melee | Wave 4 (Igneous wave) – Specific rotations | stuck | cooldown | step 17: Chaos Roar is still on cooldown for 58.2 s |
| TzKal-Zuk | HM | Melee | Wave 7 – Specific rotations | stuck | cooldown | step 14: Hurricane is still on cooldown for 10.2 s |
| TzKal-Zuk | HM | Melee | Wave 12 – Specific rotations | stuck | cooldown | step 9: Overpower is still on cooldown for 24.6 s |
| TzKal-Zuk | HM | Melee | Zuk | stuck | spellbook | step 3: Smoke Cloud: needs the Ancient Magicks spellbook |
| TzKal-Zuk | HM | Melee | Pizza | stuck | cooldown | step 13: Surge is still on cooldown for 16.2 s |
| TzKal-Zuk | HM | Melee | Conduits | stuck | cooldown | step 19: Resonance is still on cooldown for 13.8 s |
| TzKal-Zuk | HM | Necromancy | Wave 1 | stuck | cooldown | step 15: Death Essence is still on cooldown for 58.2 s |
| TzKal-Zuk | HM | Necromancy | Wave 2 | stuck | cooldown | step 10: Death Skulls is still on cooldown for 51 s |
| TzKal-Zuk | HM | Necromancy | Wave 8 | stuck | souls | step 25: Volley of Souls: needs 2 Residual Souls |
| TzKal-Zuk | HM | Necromancy | Wave 9 (Igneous wave) – Specific rotations | stuck | conjure-active | step 34: Conjure Undead Army: all spirits are already active |
| TzKal-Zuk | HM | Necromancy | Wave 13 | stuck | command-timing | step 14: Command Vengeful Ghost: needs an active Vengeful Ghost (6 ticks after the conjure) |
| TzKal-Zuk | HM | Necromancy | Wave 15 (Challenge wave) | stuck | cooldown | step 14: Disruption Shield is still on cooldown for 40.8 s |
| TzKal-Zuk | HM | Necromancy | Wave 16 (Triple Jad) | stuck | cooldown | step 9: Death Skulls is still on cooldown for 49.2 s |
| TzKal-Zuk | HM | Necromancy | Pizza Phase | stuck | conjure-active | step 18: Conjure Undead Army: all spirits are already active |
| Vindicta | Vindicta – melee | Melee | NM Rotation | stuck | cooldown | step 12: Dive is still on cooldown for 15.6 s |
| Vindicta | Vindicta – necromancy | Necromancy | HM Rotation | stuck | style-switch | step 10: Bladed Dive needs a Melee weapon wielded – the rotation has no switch to one and you wield Necromancy |
| Vorago | Vorago – melee | Melee | Phase 1 – Bomb Tank | stuck | spec-weapon | step 1: Weapon Special Attack is not the special attack of the wielded weapon and no Essence of Finality you carry stores it – switch to its weapon or store it in an amulet |
| Vorago | Vorago – melee | Melee | Phase 1 – Bomb Tank (2) | stuck | style-switch | step 2: Death's Swiftness needs a Ranged weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago | introductory solo | Necromancy | Solo bleed clears | stuck | cooldown | step 7: Surge is still on cooldown for 18.6 s |
| Vorago | introductory solo | Necromancy | P5 Teamsplit & Ceiling | stuck | cooldown | step 39: Escape is still on cooldown for 11.4 s |
| Vorago | introductory solo | Necromancy | P5 Purple Bomb & Scopulus | stuck | cooldown | step 33: Escape is still on cooldown for 12 s |
| Vorago (HM) | duo | Magic | Bring Him Down | stuck | style-switch | step 7: Magic needs a Magic weapon wielded – the rotation has no switch to one and you wield Ranged |
| Vorago (HM) | duo | Magic | Base Tank | stuck | style-switch | step 6: Bladed Dive needs a Melee weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago (HM) | duo | Magic | Mauling | stuck | style-switch | step 6: Necromancy needs a Necromancy weapon wielded – the rotation has no switch to one and you wield nothing |
| Vorago (HM) | solo | Necromancy | P8: Purple Bomb | stuck | cooldown | step 17: Split Soul is still on cooldown for 43.8 s |
| Vorkath | Vorkath – melee | Melee | Method 1 – Zemouregal | stuck | cooldown | step 33: Igneous Showdown is still on cooldown for 48 s |
| Vorkath | Vorkath – melee | Melee | Method 2 – Vorkath | stuck | slaughter | step 23: Slaughter: only within 40 ticks after Dismember |
| Vorkath | Vorkath – melee | Melee | Method 2 – Zemouregal | stuck | cooldown | step 20: Igneous Showdown is still on cooldown for 34.8 s |
| Vorkath | Vorkath – necromancy | Necromancy | Phase 2 | stuck | cooldown | step 15: Death Skulls is still on cooldown for 47.4 s |
| Vorkath | HM | Ranged | Rotation – Vorkath | stuck | cooldown | step 12: Deadshot is still on cooldown for 12.6 s |
| Yakamaru | Yakamaru – magic | Magic | Stun Pool (north-most) | stuck | style-switch | step 11: Backhand needs a Melee weapon wielded – the rotation has no switch to one and you wield Magic |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Rotations – Base (6) | stuck | cooldown | step 9: Overpower is still on cooldown for 21 s |
| Zamorak, Lord of Chaos | 1000% group | Ranged | Ranged | stuck | cooldown | step 15: Crystal Rain is still on cooldown for 19.2 s |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 2 | stuck | cooldown | step 13: Overpower is still on cooldown for 19.2 s |
| Zamorak, Lord of Chaos | 1000% solo | Ranged | Phase 4 | stuck | cooldown | step 12: Overpower is still on cooldown for 19.8 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Witches | stuck | cooldown | step 11: Greater Barge is still on cooldown for 16.8 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 1 | stuck | cooldown | step 12: Overpower is still on cooldown for 21 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 2 | stuck | spellbook | step 2: Enfeeble: needs the Standard spellbook |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 3 | stuck | cooldown | step 21: Berserk is still on cooldown for 42 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 4 | stuck | cooldown | step 19: Crystal Rain is still on cooldown for 17.4 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 5 | stuck | cooldown | step 21: Berserk is still on cooldown for 35.4 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 6 | stuck | cooldown | step 13: Overpower is still on cooldown for 10.2 s |
| Zamorak, Lord of Chaos | 2000% group | Ranged | Phase 7 | stuck | cooldown | step 18: Meteor Strike is still on cooldown for 31.8 s |
| Zamorak, Lord of Chaos | 500% | Necromancy | Phases 1, 3, 5, and 6 | stuck | spellbook | step 1: Smoke Cloud: needs the Ancient Magicks spellbook |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 1 Rotation | stuck | spellbook | step 35: Disruption Shield: needs the Lunar spellbook |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 3 Rotation | stuck | cooldown | step 30: Immortality is still on cooldown for 99.6 s |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 4 Rotation | stuck | eof-missing | step 17: Essence of Finality: needs an Essence of Finality amulet with a stored special attack and a weapon of the same style |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 5 Rotation | stuck | cooldown | step 33: Immortality is still on cooldown for 92.4 s |
| Zamorak, Lord of Chaos | 900%–4000% solo | Magic | Phase 7 | stuck | spellbook | step 15: Disruption Shield: needs the Lunar spellbook |

## Appendix B – finished rotations with late steps or issues

The player is perfect, so a late step here is a timing quirk of the engine worth a look (channel cuts, off-GCD companions, weapon switches inside a GCD).

| Boss | Style | Rotation | Perfect / late (worst) | Issues |
|---|---|---|---|---|
| Amascut, the Devourer | Magic | Phase 1 | 11 / 9 (9) |  |
| Amascut, the Devourer | Magic | Phase 6 | 19 / 16 (6) | on-cooldown Overpower 6t · no-adrenaline Tsunami need 100 have 78 |
| Amascut, the Devourer | Ranged | Phase 1 | 17 / 5 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Amascut, the Devourer | Ranged | Phase 5 | 8 / 2 (14) | on-cooldown Hurricane 14t |
| Amascut, the Devourer | Ranged | Phase 6 – Non tumekensfragment | 22 / 9 (13) | no-adrenaline Imbue: Shadows need 40 have 30 · on-cooldown Meteor Strike 13t |
| Amascut, the Devourer | Ranged | Phase 6 – tumekensfragment Jump Rotation | 17 / 8 (4) | no-adrenaline Locate need 35 have 30 · no-adrenaline Shadowfall need 65 have 35 |
| Amascut, the Devourer | Magic | Phase 1 | 13 / 11 (15) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Amascut, the Devourer | Magic | Phase 2 and 3 | 28 / 14 (4) |  |
| Amascut, the Devourer | Magic | Phase 4 | 13 / 4 (2) | no-adrenaline Overpower need 60 have 49 |
| Amascut, the Devourer | Ranged | Phase 1 | 19 / 6 (3) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Amascut, the Devourer | Ranged | Phase 4 | 23 / 6 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Amascut, the Devourer | Ranged | Phase 6 – Non tumekensfragment | 21 / 11 (11) | no-adrenaline Imbue: Shadows need 40 have 30 · on-cooldown Meteor Strike 11t |
| Amascut, the Devourer | Ranged | Phase 6 – tumekensfragment Jump Rotation | 17 / 8 (4) | no-adrenaline Locate need 35 have 30 · no-adrenaline Shadowfall need 65 have 35 |
| Angel of Death (7-man) | Magic | Prefight | 10 / 6 (16) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Angel of Death (7-man) | Magic | Last Pillar and Zaros | 6 / 5 (5) |  |
| Angel of Death (7-man) | Magic | Prefight | 10 / 6 (16) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Angel of Death (7-man) | Magic | Phase 2 | 7 / 1 (1) | no-adrenaline Tsunami need 100 have 95 |
| Angel of Death (7-man) | Magic | Zaros | 4 / 3 (5) |  |
| Angel of Death (7-man) | Magic | Prefight | 10 / 6 (16) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Angel of Death (7-man) | Melee | Prefight | 5 / 3 (4) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Natural Instinct need 100 have 45 · no-adrenaline Berserk need 100 have 95 |
| Angel of Death (7-man) | Melee | Phase 3 | 11 / 4 (2) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 |
| Angel of Death (7-man) | Magic | Prefight | 6 / 2 (4) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Berserk need 100 have 45 |
| Angel of Death (7-man) | Magic | Phase 2 and 3 | 9 / 8 (2) | no-adrenaline Instability need 50 have 39 |
| Angel of Death (7-man) | Magic | Pillars | 10 / 3 (3) |  |
| Angel of Death (7-man) | Magic | Phase 2 | 7 / 6 (4) | on-cooldown Magma Tempest 4t |
| Angel of Death (7-man) | Magic | Phase 3 | 6 / 4 (5) |  |
| Angel of Death (7-man) | Magic | Phase 3 | 6 / 1 (1) | no-adrenaline Descent of Darkness need 65 have 60 |
| Angel of Death (7-man) | Melee | Prefight | 7 / 3 (3) | no-adrenaline Tsunami need 100 have 88 · no-adrenaline Berserk need 100 have 94 |
| Angel of Death (7-man) | Melee | Zaros | 4 / 3 (8) | on-cooldown Greater Fury 8t |
| Angel of Death (7-man) | Melee | Phase 3 – If the team struggles killing mi | 2 / 2 (4) | no-adrenaline Shadowfall need 65 have 30 |
| Angel of Death (small teams) | Magic | Phase 1 | 5 / 1 (2) | no-adrenaline Igneous Showdown need 50 have 31.5 |
| Angel of Death (small teams) | Necromancy | Phase 1 | 9 / 4 (15) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Angel of Death (small teams) | Necromancy | Phase 2 | 9 / 2 (3) |  |
| Angel of Death (small teams) | Magic | Prebuild | 10 / 4 (13) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Draconic Slash need 50 have 45 · on-cooldown Greater Barge 13t |
| Angel of Death (small teams) | Magic | Phase 1 | 4 / 2 (2) | no-adrenaline Overpower need 60 have 49 · no-adrenaline Igneous Showdown need 50 have 40.5 |
| Angel of Death (small teams) | Magic | Phase 3 | 5 / 6 (1) | no-adrenaline Tsunami need 100 have 90 |
| Angel of Death (small teams) | Ranged | Phase 1 | 6 / 3 (1) | no-adrenaline Destructive Shot need 40 have 30 |
| Angel of Death (small teams) | Ranged | Phase 2 | 7 / 7 (6) | no-adrenaline Tsunami need 100 have 69 · on-cooldown Greater Ricochet 6t |
| Angel of Death (small teams) | Ranged | Phase 3 | 6 / 2 (1) | no-adrenaline Descent of Darkness need 65 have 64 |
| Angel of Death (small teams) | Ranged | Phase 3 Rotation | 7 / 7 (4) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Shadowfall need 65 have 30 · no-adrenaline Shadowfall need 65 have 35 |
| Barrows | Necromancy | Rotations | 9 / 4 (6) | on-cooldown Command Skeleton Warrior 6t |
| Barrows | Ranged | Rotations | 8 / 3 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Dagannoth Kings | Magic | Rotations | 9 / 3 (3) |  |
| ED1 – Temple of Aminishi | Melee | 9 Elite Sotapannas | 2 / 1 (1) | no-adrenaline Berserk need 100 have 40 |
| ED1 – Temple of Aminishi | Melee | Rotations – 3 Elite Sakadagami (3) | 8 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED1 – Temple of Aminishi | Melee | 6 Cloaked Zealots | 2 / 0 (0) | no-adrenaline Berserk need 100 have 40 |
| ED1 – Temple of Aminishi | Melee | 3 Defence Pylon | 8 / 3 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · on-cooldown Dive 15t · on-cooldown Dive 10t |
| ED1 – Temple of Aminishi | Melee | Crystal 1 | 6 / 4 (1) | no-adrenaline Berserk need 100 have 40 |
| ED1 – Temple of Aminishi | Ranged | Rotations – 3 Elite Sakadagami (3) | 4 / 3 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 |
| ED1 – Temple of Aminishi | Ranged | Sanctum Guardian – 3 Cloaked Zealots (2) | 3 / 2 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 |
| ED1 – Temple of Aminishi | Ranged | Phase 1 (Water Skip) | 19 / 4 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED2 – Dragonkin Laboratory | Necromancy | 2 Lava Strykewyrms | 7 / 3 (3) |  |
| ED2 – Dragonkin Laboratory | Necromancy | 3 Dragonstone dragons 1 Onyx dragon | 9 / 4 (4) |  |
| ED2 – Dragonkin Laboratory | Necromancy | 1 Hydrix dragon | 6 / 5 (16) | on-cooldown Dive 15t · on-cooldown Dive 10t · on-cooldown Dive 5t |
| ED2 – Dragonkin Laboratory | Ranged | Section 2 | 42 / 9 (2) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED2 – Dragonkin Laboratory | Ranged | Verak Lith | 8 / 3 (6) |  |
| ED2 – Dragonkin Laboratory | Ranged | Fourth Hand | 7 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| ED2 – Dragonkin Laboratory | Ranged | Black Stone Dragon – Black Stone Dragon (2) | 9 / 3 (6) |  |
| ED3 – The Shadow Reef | Melee | Rotations – 2 Zealots (2) | 3 / 1 (1) | no-adrenaline Meteor Strike need 60 have 51.5 |
| ED3 – The Shadow Reef | Melee | 1 Necromancer 2 Sea Horrors [Bridge of Death] | 2 / 3 (7) | no-adrenaline Tsunami need 100 have 95 · no-adrenaline Rampage need 100 have 30 |
| ED3 – The Shadow Reef | Melee | 3 Zealots + 2 Warped Skeletons | 3 / 3 (2) | no-adrenaline Soulfire need 35 have 30 · no-adrenaline Rampage need 100 have 82 |
| ED3 – The Shadow Reef | Melee | Phase 3 | 8 / 7 (9) | no-adrenaline Tsunami need 100 have 79 · no-adrenaline Instability need 50 have 38 · on-cooldown Runic Charge 6t |
| ED3 – The Shadow Reef | Necromancy | 2 Warped Skeletons + 2 Scouts | 1 / 1 (3) |  |
| Giant Mole (HM) | Melee | Rotations | 7 / 2 (6) | on-cooldown Overpower 6t |
| Gregorovic | Melee | Rotation – With War's Blessing 4 | 1 / 1 (5) | no-adrenaline Berserk need 100 have 50 |
| Gregorovic | Necromancy | NM Rotation | 12 / 2 (3) |  |
| Gregorovic | Ranged | Rotation | 8 / 4 (5) | no-adrenaline Greater Death's Swiftness need 100 have 90 · on-cooldown Greater Ricochet 5t |
| Helwyr | Ranged | Rotation | 9 / 3 (2) | no-adrenaline Greater Death's Swiftness need 100 have 90 |
| Hermod, the Spirit of War | Necromancy | Level 99+ Rotation | 12 / 2 (3) |  |
| Kalphite King | Ranged | Rotation – Harder dummy build | 16 / 2 (15) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Kalphite Queen | Melee | Active Strategy – First form | 5 / 2 (15) | wrong-fired Provoke expected Provoke · on-cooldown Provoke 12t |
| Kerapac, the bound | Necromancy | Player 1 – Phase 2 | 14 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 1 – Solo Clone (N or S) | 8 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 2 – Phase 2 | 14 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Necromancy | Player 2 – Solo Clone (N or S) | 8 / 1 (14) | on-cooldown Death Skulls 14t |
| Kerapac, the bound | Magic | War's Retreat | 1 / 1 (1) | no-adrenaline Meteor Strike need 60 have 50 |
| Kerapac, the bound | Magic | Phase 3 | 8 / 4 (3) |  |
| Kerapac, the bound | Melee | War's Retreat | 2 / 1 (5) | no-adrenaline Natural Instinct need 100 have 50 |
| Kerapac, the bound | Melee | Phase 2 | 8 / 2 (2) | no-adrenaline Imbue: Shadows need 40 have 25 |
| Kerapac, the bound | Melee | Phase 3 | 8 / 4 (2) | no-adrenaline Shadowfall need 65 have 47 |
| Kerapac, the bound | Melee | Kerapac | 1 / 2 (2) | no-adrenaline Igneous Showdown need 50 have 36.5 · no-adrenaline The Final Flurry need 50 have 39 |
| Kerapac, the bound | Melee | Clone 2 | 2 / 1 (5) |  |
| Kerapac, the bound | Necromancy | Phase 2 | 13 / 2 (11) | on-cooldown Death Skulls 11t · on-cooldown Death Skulls 5t |
| Kerapac, the bound | Necromancy | Phase 3 | 17 / 1 (8) | on-cooldown Death Skulls 8t |
| Kerapac, the bound | Ranged | Clone 2 | 5 / 2 (3) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Deadshot need 60 have 30 |
| Kerapac, the bound | Ranged | Kerapac | 2 / 2 (3) | no-adrenaline Shadowfall need 65 have 35 |
| Raksha, the Shadow Colossus | Magic | Pre-fight | 5 / 3 (1) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Gravitate need 60 have 45 · no-adrenaline Berserk need 100 have 90 |
| Raksha, the Shadow Colossus | Magic | Phase 4 | 5 / 6 (2) | no-adrenaline Greater Sunshine need 80 have 69 |
| Raksha, the Shadow Colossus | Magic | Phase 1-3 | 13 / 10 (9) |  |
| Raksha, the Shadow Colossus | Melee | Pre-fight | 4 / 3 (1) | no-adrenaline Meteor Strike need 60 have 50 · no-adrenaline Gravitate need 60 have 45 · no-adrenaline Berserk need 100 have 90 |
| Raksha, the Shadow Colossus | Melee | Method 1 – Pre-fight | 2 / 2 (5) | no-adrenaline Berserk need 100 have 50 |
| Raksha, the Shadow Colossus | Melee | Method 1 – Phase 3 | 5 / 2 (9) |  |
| Raksha, the Shadow Colossus | Melee | Method 2 – Phase 4 | 16 / 1 (7) | on-cooldown Greater Barge 7t |
| Raksha, the Shadow Colossus | Ranged | Method 2 – Phase 4 | 14 / 3 (3) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Shadowfall need 65 have 35 |
| Rex Matriarchs | Melee | Pthentraken – Example Rotation | 5 / 2 (1) | no-adrenaline Death's Swiftness need 100 have 90 |
| Rise of the Six | Melee | Melee | 2 / 1 (1) | no-adrenaline Sunfall Slam need 40 have 31.5 |
| Sanctum of Rebirth | Magic | Kezalam, the Wanderer – Phase 2 | 11 / 6 (8) |  |
| Sanctum of Rebirth | Melee | Vermyx, Brood Mother – Coilspawn (2) | 8 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Sanctum of Rebirth | Melee | Kezalam, the Wanderer – Phase 2 | 9 / 3 (1) | no-adrenaline Imbue: Shadows need 40 have 31.5 |
| Sanctum of Rebirth | Necromancy | Vermyx, Brood Mother – Phase 2 (2) | 15 / 1 (3) |  |
| Sanctum of Rebirth | Ranged | War's Retreat | 3 / 2 (14) | on-cooldown Greater Ricochet 14t · no-adrenaline Imbue: Shadows need 40 have 30 |
| Sanctum of Rebirth | Ranged | Kezalam, the Wanderer – Phase 1 | 10 / 1 (1) | no-adrenaline Balance by Force need 30 have 10 |
| Sanctum of Rebirth | Ranged | Nakatra, Devourer Eternal – Phase 1 | 10 / 5 (16) | no-adrenaline Deadshot need 60 have 10 · no-adrenaline Greater Death's Swiftness need 100 have 69 · no-adrenaline Imbue: Shadows need 40 have 30 |
| Sanctum of Rebirth | Ranged | Nakatra, Devourer Eternal – Phase 2 | 9 / 3 (1) | no-adrenaline Split Soul need 25 have 20 |
| Sanctum of Rebirth | Ranged | Nakatra, Devourer Eternal – Phase 3 | 6 / 1 (1) | no-adrenaline Deadshot need 60 have 10 |
| Sanctum of Rebirth | Ranged | Phase 4 | 14 / 4 (1) | no-adrenaline Locate need 35 have 10 · no-adrenaline Imbue: Shadows need 40 have 30 |
| Solak | Magic | P0 (Start on signal by base) | 2 / 1 (2) | no-adrenaline Greater Sunshine need 80 have 69 |
| Solak | Magic | P1 | 5 / 7 (4) |  |
| Solak | Melee | Phase 2 | 19 / 4 (3) |  |
| Solak | Magic | Prefight | 8 / 1 (5) | no-adrenaline Natural Instinct need 100 have 50 |
| Solak | Magic | Phase 1 | 23 / 10 (2) | no-adrenaline Instability need 50 have 31.5 |
| Solak | Magic | Phase 3 | 8 / 8 (3) |  |
| Solak | Melee | Prefight | 8 / 1 (5) | no-adrenaline Natural Instinct need 100 have 50 |
| Solak | Melee | Phase 1 | 21 / 5 (2) | no-adrenaline Imbue: Shadows need 40 have 31.5 · no-adrenaline Locate need 35 have 33.5 |
| Telos, the Warden | Magic | Phase 2 | 3 / 4 (3) |  |
| Telos, the Warden | Magic | Drop | 2 / 1 (6) |  |
| Telos, the Warden | Magic | Font 2 | 7 / 1 (6) |  |
| Telos, the Warden | Magic | Phase 5 | 7 / 8 (9) | no-adrenaline Soulfire need 35 have 30 |
| Telos, the Warden | Melee | Wars | 1 / 1 (5) | no-adrenaline Rampage need 100 have 50 |
| Telos, the Warden | Melee | Phase 1 | 7 / 3 (4) | no-adrenaline Devotion need 50 have 10 · no-adrenaline Berserk need 100 have 65 |
| Telos, the Warden | Melee | Phase 3 | 5 / 1 (1) | no-adrenaline Blackhole need 50 have 20 |
| Telos, the Warden | Melee | Red beam rotation | 6 / 4 (1) | no-adrenaline Berserk need 100 have 10 |
| Telos, the Warden | Melee | Green beam rotation | 6 / 6 (8) | no-adrenaline Berserk need 100 have 10 · no-adrenaline Overpower need 60 have 51.5 · no-adrenaline The Final Flurry need 50 have 32 |
| Telos, the Warden | Ranged | Phase 1 | 10 / 2 (5) | on-cooldown Greater Ricochet 5t |
| Telos, the Warden | Ranged | Phase 3 | 6 / 3 (8) |  |
| Telos, the Warden | Ranged | Phase 5 | 8 / 4 (7) | no-adrenaline Barricade need 100 have 30 |
| Telos, the Warden | Ranged | Wars | 1 / 1 (7) | no-adrenaline Death's Swiftness need 100 have 30 |
| Telos, the Warden | Ranged | Phase 2 | 3 / 4 (7) | no-adrenaline Shadowfall need 65 have 58 · on-cooldown Greater Ricochet 7t |
| Telos, the Warden | Ranged | Phase 3 | 6 / 2 (1) | no-adrenaline Berserk need 100 have 30 |
| Telos, the Warden | Ranged | Drop | 2 / 2 (1) | no-adrenaline Overpower need 60 have 40 |
| Telos, the Warden | Ranged | Font 1 | 9 / 3 (1) | no-adrenaline Reflect need 50 have 10 |
| Telos, the Warden | Ranged | Phase 5 | 5 / 0 (0) | no-adrenaline Weapon Special Attack need 30 have 20 |
| Telos, the Warden | Necromancy | Phase 5 | 7 / 6 (7) | no-adrenaline Living Death need 100 have 78 · no-adrenaline Death Skulls need 60 have 30 · no-adrenaline Barricade need 100 have 30 |
| Twin Furies | Necromancy | HM Rotation | 17 / 2 (3) |  |
| Twin Furies | Ranged | Rotation | 10 / 4 (5) | no-adrenaline Greater Death's Swiftness need 100 have 90 · on-cooldown Greater Ricochet 5t |
| TzKal-Zuk | Melee | Wave 1 – Specific rotations | 7 / 4 (9) |  |
| TzKal-Zuk | Melee | Wave 3 – Specific rotations | 3 / 3 (3) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 · no-adrenaline Deadshot need 60 have 35 |
| TzKal-Zuk | Melee | Wave 6 – Specific rotations | 9 / 4 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Locate need 35 have 30 |
| TzKal-Zuk | Melee | Wave 8 – Specific rotations | 9 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| TzKal-Zuk | Melee | Wave 13 – Specific rotations | 11 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| TzKal-Zuk | Melee | Wave 16 (Triple Jad) – Specific rotations | 3 / 5 (1) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Essence of Finality need 35 have 30 |
| TzKal-Zuk | Necromancy | Wave 6 | 18 / 2 (4) |  |
| TzKal-Zuk | Necromancy | Wave 12 | 16 / 2 (3) |  |
| TzKal-Zuk | Necromancy | Second cycle | 22 / 4 (3) |  |
| Vindicta | Ranged | NM Rotation | 6 / 3 (1) | no-adrenaline Greater Death's Swiftness need 100 have 90 |
| Vorkath | Melee | Method 1 – Vorkath | 13 / 9 (8) |  |
| Vorkath | Necromancy | The Fight | 10 / 3 (3) |  |
| Vorkath | Necromancy | NM Solo (Vorkath Skip) | 42 / 4 (7) | on-cooldown Split Soul 7t |
| Vorkath | Magic | Vorkath | 9 / 9 (9) | no-adrenaline Greater Sunshine need 100 have 80 |
| Vorkath | Magic | Zemouregal | 15 / 10 (6) | no-adrenaline The Final Flurry need 50 have 30 · no-adrenaline Weapon Special Attack need 50 have 30 · no-adrenaline Quick Smash need 50 have 10 |
| Vorkath | Melee | Wars's Retreat | 2 / 3 (7) | no-adrenaline Rampage need 100 have 30 · no-adrenaline Imbue: Shadows need 40 have 30 |
| Vorkath | Ranged | Rotation – Zemouregal | 9 / 2 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Vorkath | Ranged | Rotation – Vorkath (2) | 4 / 3 (9) |  |
| Zamorak, Lord of Chaos | Ranged | Last Witch | 2 / 1 (1) | no-adrenaline Imbue: Shadows need 40 have 30 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Base | 11 / 3 (3) | no-adrenaline Shadowfall need 65 have 35 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Witch | 11 / 4 (3) | no-adrenaline Shadowfall need 65 have 35 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Base (2) | 12 / 3 (4) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Weapon Special Attack need 65 have 30 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Base (3) | 8 / 4 (3) | no-adrenaline Shadowfall need 65 have 35 · no-adrenaline Devotion need 50 have 43.5 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Base (4) | 12 / 3 (4) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Weapon Special Attack need 65 have 30 |
| Zamorak, Lord of Chaos | Ranged | Rotations – Base (5) | 9 / 3 (3) | no-adrenaline Shadowfall need 65 have 35 |
| Zamorak, Lord of Chaos | Ranged | Melee | 13 / 5 (11) | no-adrenaline Berserk need 100 have 55.5 · on-cooldown Overpower 11t |
| Zamorak, Lord of Chaos | Ranged | Phase 1 | 9 / 4 (4) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Shadowfall need 65 have 30 |
| Zamorak, Lord of Chaos | Ranged | Phase 3 | 10 / 2 (4) | no-adrenaline Shadowfall need 65 have 30 |
| Zamorak, Lord of Chaos | Ranged | Phase 5 | 12 / 3 (4) | no-adrenaline Shadowfall need 65 have 30 |
| Zamorak, Lord of Chaos | Ranged | Phase 7 | 14 / 7 (4) | no-adrenaline Imbue: Shadows need 40 have 30 · no-adrenaline Shadowfall need 65 have 30 |
| Zamorak, Lord of Chaos | Necromancy | Phases 2 and 4 | 18 / 3 (3) |  |
| Zamorak, Lord of Chaos | Ranged | Phase 3 | 8 / 7 (3) | no-adrenaline Deadshot need 60 have 30 |
| Zamorak, Lord of Chaos | Ranged | Phase 7 | 11 / 5 (3) |  |
| Zamorak, Lord of Chaos | Magic | Phase 2 Rotation | 13 / 9 (2) | no-adrenaline Devotion need 50 have 39 |
| Zamorak, Lord of Chaos | Magic | Phase 2 Rotation – if fsoa is still on cooldown com | 10 / 3 (2) | no-adrenaline Instability need 50 have 30 |
| Zamorak, Lord of Chaos | Magic | P6 rotation | 11 / 11 (14) | no-adrenaline Tsunami need 100 have 70 · on-cooldown Runic Charge 15t · on-cooldown Runic Charge 10t |
