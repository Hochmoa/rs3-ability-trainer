# Revolution combat mode – research for the trainer (state: September 2026)

Research date: 2026-09-04. Sources: https://runescape.wiki/w/Revolution, https://runescape.wiki/w/Ability_queueing,
https://runescape.wiki/w/Combat_Settings (redirects to Settings → Combat & Action Bar), https://runescape.wiki/w/Action_bar.
Quotes are verbatim from the wiki (rendered page or `?action=raw`).

Legend: **[VERIFIED]** = quoted from the wiki. **[INFERRED]** = my reading of the quotes / common in-game knowledge.
**[OPEN]** = the wiki is silent or ambiguous. **[MODEL]** = what the trainer engine does.

---

## 1. What Revolution is

- **[VERIFIED]** "Revolution (colloquially revo) is a combat mode that automatically uses abilities for the player."
- **[VERIFIED]** "Revolution automatically triggers the first available compatible ability on the action bar."
- **[VERIFIED]** "Only the main action bar can be used by Revolution; additional action bars are not used."
- **[VERIFIED]** Settings text (Combat Mode): "Full Manual" – "Trigger all abilities manually for full control."; "Revolution" –
  "Automate ability usage on the main action bar. Manual input overrides automation until it is activated."
- **[VERIFIED]** Combat modes can be switched mid-fight: "Players are now able to switch between revolution and full manual mode
  whilst engaged in combat." (22 August 2016)

## 2. How the next ability is picked

- **[VERIFIED]** "the first available compatible ability on the action bar" – i.e. scanning the main bar from the left, the first
  slot whose ability is usable right now (off cooldown, enough adrenaline, requirements met, matching weapon) fires.
- **[VERIFIED]** Range: "Revolution size" – "Set how many slots on the main action bar are automatically used in revolution
  combat. (1-14)". Revolution page: "This number can range anywhere from 1 to 14 abilities."
- **[VERIFIED]** The game draws a yellow frame around those slots: Action bar patch notes mention "the Revolution highlight on the
  action bar" ("Fixed the size of the Revolution highlight on the action bar.").
- **[OPEN]** The wiki does not state the default Revolution size. The trainer defaults to **9** (the in-game default as far as
  known; change it in the settings).
- **[INFERRED]** Revolution scans on every tick on which the player could act: when the global cooldown has ended (or was never
  started) it fires the leftmost usable ability *on that tick*, so a Revolution rotation runs at exactly one ability per GCD
  (3 ticks) as long as something is usable. Supporting patch notes: "Revolution will now start up faster after all basic abilities
  have been on cooldown." (2 March 2015); "Made revolution begin firing abilities faster." (28 July 2014).
- **[INFERRED]** Channelled abilities are not cut short by Revolution – the next ability fires after the channel ends
  ("Revolution Combat Mode will now fire off Abilities more consistently after a channelled Ability is used.", 29 March 2021).
  **[MODEL]** The engine treats a channel as over once its last hit has landed (or it was cancelled); Revolution fires on that tick.
- **[VERIFIED]** A slot that is *not usable* is skipped, it does not stall the bar – e.g. "Revolution no longer stops working
  when Storm Shards is in the first slot of an action bar and the target already has 10 stacks." (18 July 2016) and "Revolution
  will now continue to trigger abilities after using a stun-based threshold or the Salt in the Wound ability." (13 Nov 2017).
- **[VERIFIED]** Slot morphing is honoured: "The Cleave ability can now be used by Revolution while action bar slot 6 has a
  queued ability." (13 November 2017) – the trainer uses what the slot *shows* (Command Skeleton while the conjure lives, ...).

## 3. Which ability types are triggered (the "Revolution++" toggles)

- **[VERIFIED]** Settings: "Automatically trigger Basic abilities during revolution combat." / "Automatically trigger Threshold
  abilities during revolution combat." / "Automatically trigger Enhanced abilities during revolution combat." / "Automatically
  trigger Ultimate abilities during revolution combat."
- **[VERIFIED]** History: "Revolution now supports automatic threshold and ultimate ability triggering" (6 November 2017),
  "Players can now choose whether or not Revolution activates basic, threshold or ultimate abilities" (13 November 2017),
  "Enhanced abilities can now be toggled on or off during revolution combat" (16 March 2026).
- **[VERIFIED]** Naming: "Revolution with threshold abilities set to automatic is sometimes called 'Revolution+'." and
  "Revolution++" = "All ability types set to automatic".
- **[VERIFIED]** "with enough adrenaline, you can now automatically trigger thresholds and ultimates" – i.e. the adrenaline
  requirement is checked like for a manual press; a threshold/ultimate without enough adrenaline is simply skipped.
- **[OPEN]** Defaults of the four toggles are not on the wiki. The trainer defaults to Basic + Enhanced on, Threshold + Ultimate
  off (plain "Revolution").
- **[MODEL]** Necromancy incantations (Conjure X, Invoke Death, ...) are GCD abilities without an "Enhanced/Threshold/Ultimate"
  class; the wiki's Necromancy Revolution bars contain the conjures, so they follow the **Basic** toggle.

## 4. What Revolution never triggers

- **[VERIFIED]** "Revolution will no longer trigger special attacks." (13 November 2017 hotfix) – neither the Weapon Special
  Attack slot nor Essence of Finality.
- **[VERIFIED]** "Regenerate is no longer triggered by Revolution" (20 November 2017).
- **[VERIFIED]** Non-combat spells: "Revolution will no longer use the Create Gatestone spell from the action bar." (10 March 2014).
- **[VERIFIED]** Untargeted movement abilities sit on a Revolution bar without being used: "Revolution now supports untargeted
  Agility abilities, so Escape and Surge can once again be put on a Revolution bar." (12 December 2022).
- **[INFERRED]** Prayers, potions, weapon switches and other off-GCD actions are not abilities; Revolution only fires abilities
  that start the global cooldown. Defensive **basic** abilities such as Freedom / Anticipation *are* basic abilities and are
  triggered when they sit inside the Revolution range (well-known in game – keep them outside the yellow box).
- **[MODEL]** The engine triggers only entities of kind `ability` that start the GCD (`isGcdStep`), whose type is enabled by the
  toggles, excluding `weapon-special-attack`, `essence-of-finality` and `regenerate`.

## 5. Manual input and ability queueing

- **[VERIFIED]** "Manual input overrides automation until it is activated." (Combat Mode setting text).
- **[VERIFIED]** Ability queueing "can be used with the Full Manual and Revolution Combat Modes. It cannot be used with the
  Classic Combat Mode."
- **[VERIFIED]** "Queuing threshold & ultimate abilities in certain situations no longer halts revolution until the queued
  ability is triggered." (12 June 2017) – a queued manual ability *is* what fires next; Revolution resumes after it.
- **[VERIFIED]** Ability queueing: "The main function of ability queuing is to either queue an ability during global cooldown at
  a time before global cooldown ends such that it is cast after global cooldown, or for the ability to be cast when it's no
  longer on internal cooldown (and the player is not on global cooldown)."
- **[VERIFIED]** On the last tick: "A queued ability can be bypassed if the player manually clicks or presses another ability on
  the tick before the queued ability is set to be cast."
- **[VERIFIED]** Revolution(++) casts count as automatic for tick-sensitive buffs: "These buffs will not apply on the final tick if
  the player is attempting to trigger the ability through either ability queueing or through revolution(++)."
- **[MODEL]** A manual press that is processed on the tick the GCD ends (or queued before it with ability queueing on) becomes the
  pending cast and Revolution stays silent while anything is pending – manual input wins. With ability queueing off, a press
  inside the GCD is ignored (too early) exactly like in Full manual, and Revolution then fires its own choice when the GCD ends.

## 6. Trainer semantics (docs for the engine)

- `EngineConfig.combatMode: 'revolution'` + `EngineConfig.revolution = { slots, basics, enhanced, thresholds, ultimates, bar, resolveBar? }`.
  `bar` is the ordered list of slot keys of the main bar (null = empty slot); `resolveBar(style)` re-reads it after a weapon
  switch because the main bar is bound per style.
- On every server tick, after inputs of that tick were handled: if nothing is pending, the GCD is free and no channel runs,
  the engine picks the leftmost usable slot among the first `slots` slots and casts it on this tick through the normal cast
  path (cooldowns, adrenaline, effects, hits). Every auto-cast emits `{ kind: 'auto', key, tick, matched, expected }`.
- Scoring: an auto-cast that is the expected rotation step completes the step; its `StepResult` gets `auto: true` (outcome as
  usual – `perfect` when it fired on the GCD end). An auto-cast that is *not* the expected step is **not** a player mistake: no
  `wrong` counter, no `wrong-fired` event, the rotation index does not move. Steps skipped by an auto-cast (an open prayer step
  before the expected ability) are still `missed`, like after a manual cast.
- Everything else (prayers, potions, weapon switches, manual presses, off-GCD abilities) behaves exactly like in Full manual.
