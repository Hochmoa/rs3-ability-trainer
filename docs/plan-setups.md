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
