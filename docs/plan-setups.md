# Setups restructure (Sept 2026)

Approved by Martin on 2026-09-08. One page "Setups" replaces Boss setups (/presets), Shared setups (/setups) and Explore (/explore).

## Model
- `Setup` = boss + name (variant) + style + exactly one loadout + N rotations. `Rotation.setupId`, `Setup.loadoutId`.
  Every rotation and loadout belongs to one setup; a setup without a boss is "General".
- The setup is the unit of sharing (`isPublic`) and of copying. Rotations are no longer shared or copied on their own.
- PVME = one real guide account on the server (`profiles.kind = 'guide'`, display name "PVME") holding every PvME setup.
  The 36 per-boss guide accounts are deleted.
- Bars: no profiles any more – the 18 in-game presets, 5 positions, style bindings. Nothing imported ever writes bars
  or keybinds; the only additive path is "Auto-place on my bars" on the Train page (free slots only).
- Keybinds live in `action_bars.setup` (own account only). The legacy per-entity `keybinds` table/store is dropped.
- Settings + enemy sync moves to a private `user_settings` row (was part of the shared bundle).

## Server (migration 0018)
- drop old bundle table `setups` + `list_public_setups` / `get_public_setup` (they handed out keybinds and bars)
- new `setups` (id, owner_id, boss, name, style, loadout jsonb, is_public, source_id, created_at, updated_at)
- `rotations.setup_id` (nullable while old rows are re-assigned by the client), drop is_public/copies/source_id/styles,
  `public_rotations` view, `copy_rotation`
- views `public_setups` (no loadout) and `setup_users`; `get_public_setup_rotations(id)` not needed – rotations of a public
  setup are readable through RLS
- `user_settings` (user_id pk, settings, enemy, updated_at)
- delete guide accounts; 0019 seeds the PVME account (tools/guide-seed-dump.js + guide-seed-to-sql.py)

## Pages
- /setups: views Mine · All · Players. /presets and /explore redirect there.
- Train: Setup select + Rotation select (loadout follows). Rotations page grouped by setup. Loadout page = gear editor with a
  setup picker on top. Bars page without the profile chips. Account page without the share toggle.

## Stages
1. bars profiles out  2. Setup model + storage + local migration  3. server migration + sync  4. Setups page
5. Train / Rotations / Loadout / Account  6. seed pipeline + PVME content  7. docs, memory

## Follow-up round (Martin, 2026-09-08): the Loadout page itself
- every item gets a usage score = how often the PvME presets use it; default sort by that score
- "Hide obscure equipment" = hide everything below a hard-coded score threshold (tune together)
- dropping gear into the backpack opens its sub-options at once: EoF special, gizmos
- EoF special: no dropdown – small tiles, grouped by weapon style, sorted by how often PvME stores that special
- gizmos: no free composition; research the gizmo combos players use (a4e2 …), score by usage, sort; normal/ancient
  distinction disappears
- weapons: main-hand + off-hand pairs as one group (Ode of Deceit + Roar of Awakening), 2h alone; grouped by style
- gear: grouped by style, whole sets together; think about how set items and the usage score fit together
- the block of text under the gear becomes an "i" icon → modal with everything about the current gear
- bottom: the relics section text/format (checkbox – name – text spacing), Double Surge is an unlockable, not a relic:
  remove it, always unlocked

Done 2026-09-08 (branch feature/loadout): usage scores (tools/usage-stats.py → public/data/usage.json, core/gear-catalog.ts),
USAGE_THRESHOLD in core/obscure.ts, sub-options on landing, EoF tiles, gizmo combos (core/gizmo-combos.ts from the PvME
perks guide), weapon pairs / armour sets / style sections, the "i" modal, relics grid, Double Surge always on.

## Guided tour (2026-09-08)
core/tour.ts holds the script (TOUR_STEPS) and the pure geometry (spotlight, blockers, cardPosition, visibleSteps),
shared/tour.ts the TourService + the overlay component (mounted in app.html). Targets are `data-tour="…"` attributes
on the pages, so no CSS class is load-bearing. It starts itself once per browser (localStorage rs3trainer.tour) after
the consent banner is answered, and Settings → Tour replays it.

## Feedback round, 8 Sep 2026 (evening)

- Gone: the enemy-rhythm hint, the "same tick / 2 ticks later" legend, the backpack hint under the gear panel, the
  head box and the Revolution box on the Action bars page. The preset row says "Main bar by default, Main bar with
  Ranged" instead of "Main bar, Ranged -> Main bar".
- Special items show no "+0% adrenaline" line in the bars catalog.
- Command X is no longer a catalog entry on the Action bars page: the Conjure X slot turns into it (engine/morphs.ts),
  and auto-place puts the Conjure on the bar for a Command step.
- Weapon switches have no keys any more. A weapon is switched with a click on it (backpack, or the Switches chips in
  the simple view). Keybinds page, key drill, layouts and auto-place lost their weapon parts; `weaponKeybinds` stays
  in the stored setup, unread.
- Every gizmo is ancient. The Gizmos dialog, the tooltip, the validation and the preset perk placer know no standard
  gizmo; the stored `ancient` flag is forced to true on load.
- Notes that ask for a click ("enter instance", "run md", "(click crystal)", "tag pillar") get their button on import
  and on load (core/note-actions.ts, applied in cleanStep, migrateRotation and the PvME parser), so the guide
  rotations already stored behave the same.
- "Play on into the next rotations" on the Train page: the selected rotation and every one after it in the setup run
  as one session, with a "Next: Phase 2" button between them (a click note with 0 ticks). Nothing resets in between.
  First version; the popout / focus view plays single rotations only.

## Train page, 9 Sep 2026

- The boss stands under the setup select (the select shows only the setup's name).
- The equipment warning checks every weapon the loadout carries (core/weapon-reach.ts), not only the worn ones.
- Idle, the backpack and the worn gear are managed on the Train page like on the Gear page: click to wear or take
  off, drag between backpack and body, drag out of the panel to drop (GearDragService.droppedOutside, GearAction
  'drop-out'; the Gear page drops the same way).
- An icon dragged off the action bars leaves the bar (ActionBar onDragEnded).

## Session trace, 9 Sep 2026

Every training session is recorded (src/app/core/trace.ts): the setup, the steps, the loadout and bars at the start,
then every press with the engine's state, every engine event (decisive ones with state), every gear change and
feedback line, and the end. The last 5 stay in the browser (IndexedDB 'traces', Settings page: copy / save); signed
in, each one is uploaded to session_traces (0022, last 20 per account). Reading one:

    python tools/trace-report.py --latest --user Y0loFrodo     # newest trace of that account, as a timeline
    python tools/trace-report.py --list                        # what is on the server
    python tools/trace-report.py trace.json                    # a file saved from the Settings page

## Adrenaline crystal, 10 Sep 2026

- Rotations carry "In War's Retreat" (Rotation.warsRetreat, rotations.wars_retreat in 0023): the player's toggle on
  the Rotations page; unset, the name decides (`inWarsRetreat`: Wars, War's Retreat, Pre-build). A chained session
  keeps segments, so the crystal is offered only while the current step is in a War's Retreat rotation.
- The Train page shows an "Adren crystal" button next to the adrenaline bar for such rotations. A press is one 1.8 s
  channel (engine useCrystal): 25% adrenaline, or with the setting "Adrenaline crystal fully upgraded" (default on,
  War's Blessing 4 + the 2,000-kill upgrade) 100% and the adrenaline potions off cooldown. Never a wrong press, never
  a step; the next ability is due after the channel. Source: runescape.wiki/w/Adrenaline_crystal_(War's_Retreat).

## Adrenaline only from casts, 10 Sep 2026

Nothing in the trainer gives adrenaline by the clock any more. The "Recharge +10%/tick" option is gone and the combat
dummy adds nothing on its own: the adrenaline comes from what is cast, as the wiki has it (runescape.wiki/w/Adrenaline,
read 10 Sep 2026): "Basic abilities, including basic attacks: +9%" per use (Adaptive Strike 12%), thresholds -15%,
ultimates -100% or -60%, with the modifiers the engine already applied: Impatient (9% per rank chance of +3%),
Invigorating (+5% per rank on basic attacks), Fury of the Small (+1% on basics), Conservation of Energy (+10% after
an ultimate), Ring of Vigour (10% saved), Relentless (1% per rank chance to pay nothing). Not modelled: the drain
out of combat (5% every 2 ticks after 10 s) and Divert's damage-based extra.

## Adrenaline in the trace, 10 Sep 2026

Martin saw the adrenaline climb by the tick in a Wars session. The trace explained it once every change carried its
source: Vestments of havoc (2 pieces) "After casting a melee ultimate ability, regenerate 15% adrenaline over 18
seconds", 0.5% a tick for 30 ticks after the stalled Meteor Strike. Every adrenaline change is now an engine event
('adrenaline', delta, source) that the trace records and tools/trace-report.py prints. Dropped on the way: a rule that
let abilities generate no adrenaline under Rampage; neither the Rampage nor the Dragon battleaxe page knows such a
thing (both read 10 Sep 2026).
