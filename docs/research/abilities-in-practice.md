# How RS3 abilities are actually used — the community's practice after the combat rework

*Compiled 7 September 2026 from YouTube guides published after the Combat Style Modernisation of 2 March 2026
(the community calls it "EoC 2.0"). Every claim is traceable: each line links the video and the second it was said.*

## Why this document exists

The wiki tells you what an ability does. It does not tell you when to press it, what to press before it, or why a
rotation is built the way it is — and after the rework of 2 March 2026 the old written sources went stale in one day.
PvME's own front page says the majority of its content is outdated and being rebuilt. What survived the update fastest
were video guides: people re-recorded their DPS guides within weeks, and they explain the *reasoning*, which is exactly
what a rotation trainer needs to teach.

So this is the practice layer: the ability book as players use it, not as the game files describe it.

## How it was made

1. 198 candidate videos found through 18 YouTube searches (`yt-dlp`), reduced to those published after 2 March 2026 and
   really about RS3 combat.
2. Their transcripts pulled with timestamps (`youtube-transcript-api`), 39 videos, about 670 000 characters.
3. Each transcript read in full and condensed into ability-by-ability notes with a citation on every statement.
4. The numbers the videos state were then checked against the RuneScape Wiki — see *Verified numbers* below. The videos
   are the source for **when and why**; the wiki is the source for **how much**.

The pipeline is in `tools/yt/` (see its README) so the corpus can be rebuilt when the next patch lands. The
transcripts stay outside the repository as working copies: they are third-party material, and nothing here quotes
more than a sentence of them.

## How to read it

- **A citation like [Carguy, 25 Jun 2026 @12:34] is a claim by that video at that second**, not a fact. Videos are
  written by good players, but they are dated, and a few of their numbers are wrong. Where a number mattered, it was
  checked; where it was not checked, it says so.
- **Dates matter more than usual.** Melee was nerfed about a week after the rework; Deadshot stopped being a bleed;
  Death's Swiftness became mobile. Advice from March 2026 can already be wrong. Every source carries its publication
  date, so a claim can be aged.
- **Where two videos disagree, both are shown** with the disagreement named, and resolved against the wiki when
  possible. That is the honest state of the community's knowledge, and it is more useful than a smoothed-over average.
- Auto-generated captions garble game jargon ("grico", "e-o-f", "easy kill" for Ek-ZekKil). These were normalised to the
  canonical names; where a word could not be recovered, it is flagged as unrecoverable rather than guessed.

## The corpus

| Video | Channel | Published | Length |
|---|---|---|---|
| [Unlocking Wars Retreat AFK - RuneScape 3](https://youtu.be/vEFQVrVKjZc) | Abir RS | 21 Apr 2026 | 8 min |
| [RS3 free to play 1-99 skill guide](https://youtu.be/igPnkZa2QTU) | Bear | 28 Mar 2026 | 23 min |
| [people thought RANGED was DEAD (They're wrong, it's fire)](https://youtu.be/hkVUiN856S8) | Carguy | 15 Mar 2026 | 16 min |
| [No stalls, No problem! Melee Raksha goes CRAZY](https://youtu.be/olCJ8ET-KQw) | Carguy | 21 Mar 2026 | 11 min |
| [(New DPS Guides are out, or are soon to release) Here's what I](https://youtu.be/UrObmwGTX08) | Carguy | 8 Apr 2026 | 22 min |
| [Can this MAGIC GEAR keep up in EoC 2.0?](https://youtu.be/noJjrb0888s) | Carguy | 22 Apr 2026 | 19 min |
| [The MELEE DPS Guide you've been waiting for](https://youtu.be/HHygBM7jH8Y) | Carguy | 25 Jun 2026 | 40 min |
| [how I use RANGED in EoC 2.0 (DPS Guide)](https://youtu.be/PV46uTqg5Mg) | Carguy | 7 Jul 2026 | 46 min |
| [Cast FIREBALL and Much More! | RuneScape Magic DPS Guide](https://youtu.be/3lxLhk4l9R8) | Carguy | 14 Jul 2026 | 44 min |
| [Runescape Complete Melee PVM guide](https://youtu.be/pNp3M6YehxQ) | DiamondFang | 28 Mar 2026 | 38 min |
| [Runescape Complete Ranged PVM Guide](https://youtu.be/vQ4ExELCJF4) | DiamondFang | 6 Apr 2026 | 39 min |
| [Runescape Complete Magic PVM Guide](https://youtu.be/KyIGNqMIj8g) | DiamondFang | 14 Apr 2026 | 21 min |
| [Runescape Complete Necromancy PvM Guide](https://youtu.be/7x5efr5WlwI) | DiamondFang | 12 May 2026 | 35 min |
| [Ranged for Dummies](https://youtu.be/O1Fx1I4HO5w) | Hexed Titan | 10 Jun 2026 | 20 min |
| [Beginner's Guide to PvM in RuneScape for New and Returning Pla](https://youtu.be/xpghcq6-Zik) | Invoked by Red | 16 Jun 2026 | 9 min |
| [RuneScape 3 1-120 Magic Combat Guide 2026](https://youtu.be/VBnnFebHlCY) | Isaac DSE | 11 May 2026 | 9 min |
| [RS3 | RuneScape 3 | 1-99 Attack Melee Combat Guide](https://youtu.be/qTRGfTt47sA) | Isaac DSE | 23 Aug 2026 | 5 min |
| [BIS Magic DPS Rotation Guide](https://youtu.be/76-Bnr1WwRs) | Its Ya Boi Dragon | 17 Jun 2026 | 9 min |
| [Start Here: Learn Fast PvM Rotations (10-Second Boss Guide) | ](https://youtu.be/mxoVHIPzUh4) | KevMcGames | 25 Mar 2026 | 5 min |
| [RS3 Market Analysis: The Impact of Ecliptic Components](https://youtu.be/esoSvgF6ItI) | kruxor | 18 Mar 2026 | 4 min |
| [THE BEST MID GAME MONEY BOSSES! (SCRAP GEAR ONLY) - RS3 2026](https://youtu.be/RPmmk66BAqA) | MrEznorbRS | 29 Mar 2026 | 13 min |
| [EASY Way to Get YOUR FIRST 100%+ ZAMMY KILL - Rs3 2026](https://youtu.be/PRAUrPvS_ww) | MrEznorbRS | 26 Apr 2026 | 28 min |
| [This NEW Item SAVES You 5M Per Hour! (Rs3 Magic Midgame upgrad](https://youtu.be/6mVcYE0iQw0) | MrEznorbRS | 17 May 2026 | 7 min |
| [Is Necromancy Ruining Other Combat Styles in RS3?!](https://youtu.be/kwKL_X8zVcY) | MrEznorbRS | 7 Jun 2026 | 10 min |
| [How I FINALLY FIXED my MAGIC DPS | Rs3 Magic DPS Guide](https://youtu.be/T_y2bHBvHa8) | MrEznorbRS | 2 Aug 2026 | 15 min |
| [Raksha Pool Skips Explained Easily!  (Runescape 3)](https://youtu.be/3LNhQaTgduE) | Oyi RS | 28 Apr 2026 | 9 min |
| [A guide to leveling Ranged Combat 1-99](https://youtu.be/aGRV825noAo) | Protoxx | 29 Jun 2026 | 13 min |
| [May 2026 - Runescape RS3 - How to Kill Rasial](https://youtu.be/q1JVE10ISsE) | PsychAttack | 14 May 2026 | 6 min |
| [Updated Revolution Bar Guide 2026 levels 1-99/120 Magic](https://youtu.be/QRl8NJH82nA) | Qp RS | 13 Mar 2026 | 13 min |
| [Updated Ranged Revolution Bar Guide 2026 levels 1-99/120](https://youtu.be/3UzITrjpTIw) | Qp RS | 28 Mar 2026 | 13 min |
| [Silverquill RuneScape Boss Guide Achievements AFK Methods Atta](https://youtu.be/75Z9zdfrquM) | RainyScape | 28 Mar 2026 | 9 min |
| [Hungry Like the Wolf Relic Guide | No Adrenaline Loss from Foo](https://youtu.be/h0seitvhpOc) | RSBANDB | 23 Jun 2026 | 3 min |
| [Masterwork Range is Busted.](https://youtu.be/ufHZj98ZXYw) | The RS Guy | 1 Apr 2026 | 8 min |
| [The Easiest Way To Get A Zuk Cape For Beginners! (Low Stats, F](https://youtu.be/rV5PB2sGV7U) | The RS Guy | 5 Apr 2026 | 50 min |
| [A Guide to New Endgame Ranged on RuneScape](https://youtu.be/mOJhIsPl9GA) | Wings of Absurdity | 18 Mar 2026 | 25 min |
| [Ranged Special Attacks Guide on RuneScape](https://youtu.be/OfXWmwLuEmY) | Wings of Absurdity | 6 Apr 2026 | 20 min |
| [Random Combat Tips for Ranged on RuneScape](https://youtu.be/_rXrl_xgwzs) | Wings of Absurdity | 24 Apr 2026 | 5 min |
| [Which adrenaline potion should you use on RuneScape?](https://youtu.be/uRPVLAKjyx0) | Wings of Absurdity | 27 May 2026 | 6 min |
| [Ranged Gear Progression for RuneScape in 2026](https://youtu.be/joHe24sEaDY) | Wings of Absurdity | 25 Jul 2026 | 14 min |


The transcripts of these videos were read in full; the numbers they state were checked separately (see *Verified numbers*). Videos are listed by channel, then by date.


## The frame the videos assume

Every guide below takes these rules for granted and never states them. They come from the wiki (see
`docs/research/mechanics.md` for the sourced version), not from the videos, and they are what the rest of this
document hangs on.

- **A game tick is 0.6 s.** Everything below is counted in ticks, because that is the resolution the game works at.
- **The global cooldown is 3 ticks (1.8 s).** Every ability and spell starts it; a handful (Surge, Escape, Dive,
  Bladed Dive, Provoke, Limitless, Runic Charge) are off it and can be pressed inside another ability's GCD.
- **Ability classes since 2 March 2026:** *basic* abilities generate adrenaline (9 % by default), *enhanced*
  abilities spend a small to moderate amount, *ultimate* abilities spend 60 % or 100 %, and *utility* is a tiny
  leftover category. The old *threshold* class is gone from the three non-Necromancy styles: an ability with an
  adrenaline cost can be used the moment you can pay for it, without a 50 % gate.
- **The adrenaline economy is the real rotation.** Almost every rotation in this document is a loop of "generate with
  basics, spend on the biggest thing that is off cooldown", and the interesting decisions are about *what to spend on*
  and *how to avoid capping or starving*.
- **Damage windows.** Each style has one ultimate that multiplies damage for a window — Berserk (melee, 1.75×),
  Greater Sunshine (magic, 1.5× inside a 7×7 ground area), Greater Death's Swiftness (ranged, 1.5×, and since the
  rework it follows you instead of planting), Living Death (necromancy, which rewrites the necrosis economy instead of
  multiplying). The whole rest of a rotation exists to fill that window with the biggest hits available.
- **Stalling** — starting an ability and releasing it later (out of range, on a target cycle, entering an arena) — is
  still the standard way to open a boss fight on melee, ranged and magic. The cooldown and the adrenaline are spent
  when the ability is stalled, not when it lands. Necromancy can only stall through weapon special attacks.

### What actually changed in the rework, as the community describes it

Collected from the videos, dated, because several of these were already patched again afterwards:

| Change | Where it shows up |
|---|---|
| Threshold abilities became "enhanced"; lesser abilities removed | every guide's ability-book walkthrough |
| Melee damage was toned down about a week after the rework, cooldowns untouched — old rotations still work | Carguy, 8 Apr 2026 |
| Death's Swiftness became mobile; Greater Sunshine stayed a ground area | Carguy, 8 Apr 2026; wiki confirms |
| Deadshot stopped being a bleed and became a multi-hit ability | wiki update history |
| Asphyxiate now applies Channelled Might (crit damage) on a completed channel | Carguy, 8 Apr 2026; wiki confirms |
| Wild Magic gained crit chance and crit damage | Carguy, 8 Apr 2026 |
| Food's adrenaline penalty dropped from 10 % to 3 % | RSBANDB, 23 Jun 2026 |
| Wind arrows buffed to 30 % and need only 10 stacks; "wind sporing" is gone | Carguy, 8 Apr 2026 |
| Equilibrium was added as a perk; strong on Necromancy, usually not on melee | Carguy, 8 Apr 2026; DiamondFang, 12 May 2026 |
| Slice no longer exists; Adaptive Strike replaces it | DiamondFang, 12 May 2026 |

### The one shape every style now has

Read the four style chapters and the same skeleton appears each time, which is worth stating once:

1. **Build** — press basics until you can afford the window (or arrive with adrenaline already built, see *pre-build*).
2. **Buff** — the style's damage window plus its cheap multipliers (Chaos Roar, Runic Charge, Imbue: Shadows,
   Split Soul), fired in the order that makes the first big hit land inside every buff at once.
3. **Dump** — the biggest hits the window can hold, ordered so that nothing is wasted on a cooldown you could have
   used later, and so channels are not cut by the window ending.
4. **Refill** — a basic or a cheap enhanced ability that pays for the next window, plus the special attack as the
   filler that costs no adrenaline.

The differences between styles are which mechanic decides the dump order: melee counts Bloodlust stacks and Berserk
ticks, ranged counts hit splats and Perfect Equilibrium stacks, magic counts critical strikes and Runic Charge, and
necromancy counts necrosis and residual souls.

---

## Melee

*Berserk is the window; Bloodlust and Greater Flurry decide what goes in it.*


Sources (all citations point at these):

| ID | Author, title | Published |
|---|---|---|
| HHygBM7jH8Y | Carguy, "The MELEE DPS Guide you've been waiting for" | 25 Jun 2026 |
| pNp3M6YehxQ | DiamondFang, "Complete Melee PVM guide" | 28 Mar 2026 |
| olCJ8ET-KQw | Carguy, "No stalls, No problem! Melee Raksha goes CRAZY" | 21 Mar 2026 |
| qTRGfTt47sA | Isaac DSE, "1-99 Attack Melee Combat Guide" | 23 Aug 2026 |

Note on qTRGfTt47sA: this video contains no melee ability, rotation or adrenaline content at all. It is the author hitting combat dummies and talking about his Divination XP and Slayer level. Nothing in this document comes from it.

Note on revolution: neither guide gives a revolution bar with priorities. DiamondFang explicitly recommends partial revolution or full manual while learning, and recalls that revolution used to cause lag with channelled abilities [DiamondFang, 28 Mar 2026 @4:27](https://youtu.be/pNp3M6YehxQ?t=267). Carguy plays manual and describes his two action bars (one dual wield, one two-handed) as bars he fills out, not as revolution bars [Carguy, 25 Jun 2026 @2:47](https://youtu.be/HHygBM7jH8Y?t=167). Where a subsection mentions revolution below, it reports only what the videos actually support — mostly which abilities are safe autocasts and which must be manual — and says so when they are silent.

### Ability by ability

Order follows the melee ability book as Carguy walks it: basics, then enhanced, then ultimates, then utility [Carguy, 25 Jun 2026 @1:38](https://youtu.be/HHygBM7jH8Y?t=98).

#### Attack (basic)

The generic, no-cooldown basic every combat style now has, equivalent to the Necromancy basic. Costs a global cooldown (1.8 seconds / three game ticks) but has no cooldown of its own, generates one Bloodlust stack, and gives 9% adrenaline. Carguy keeps it on the bar purely as filler and says he presses it rarely — when on autopilot or building adrenaline on low-level targets — because everything else in the book is a better button. Common mistake it calls out: using it in a rotation instead of Rend or Adaptive Strike.
`[Carguy, 25 Jun 2026 @1:38](https://youtu.be/HHygBM7jH8Y?t=98)` `[Carguy, 25 Jun 2026 @2:13](https://youtu.be/HHygBM7jH8Y?t=133)` `[Carguy, 25 Jun 2026 @2:47](https://youtu.be/HHygBM7jH8Y?t=167)` `[Carguy, 25 Jun 2026 @3:20](https://youtu.be/HHygBM7jH8Y?t=200)` `[Carguy, 25 Jun 2026 @5:02](https://youtu.be/HHygBM7jH8Y?t=302)`

#### Adaptive Strike (basic)

Replaces the old Cleave and Decimate: with a two-handed weapon it cleaves a cone in front of you at multiple targets, with dual wield it delivers two hits (Carguy quotes two hits of 60-75%). It gives 12% adrenaline, more than any other basic, so it is the adrenaline-building basic and the standard "stall" ability in the opener. Press it when you need adrenaline rather than damage, when you want light AoE, or out of range of the target to build adrenaline before Berserk. DiamondFang's rule: use Rend first, Adaptive Strike when Rend is not the right press. Combos: it is the ability of choice for the pre-Berserk stall because 12% beats the 9% of a defensive or another basic.
`[Carguy, 25 Jun 2026 @3:20](https://youtu.be/HHygBM7jH8Y?t=200)` `[Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266)` `[Carguy, 25 Jun 2026 @5:02](https://youtu.be/HHygBM7jH8Y?t=302)` `[DiamondFang, 28 Mar 2026 @7:49](https://youtu.be/pNp3M6YehxQ?t=469)` `[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007)`

#### Rend (basic)

The best melee basic in both guides: highest basic damage and it generates two Bloodlust stacks instead of one (four inside Berserk). Adrenaline gain 9%. It is the intended partner for the Gloves of Passage: pressing Rend buffs the first hit of your next ability (Carguy is unsure whether the standard gloves give 7% or 10% and settles on 10%; the enhanced/colossal version adds a further 6% and makes active bleeds do 15% more damage for 10 seconds). Press it immediately before the ability you want buffed — in practice before Overpower. DiamondFang also pairs Rend into Dismember for the gloves boost, and notes there is a trick where a stalled Rend lets both abilities land on the same tick and both get the boost, which Fury cannot do. Common mistakes: spending basics on Attack instead, and pressing Rend when you did not need the adrenaline (with better gear DiamondFang drops the Rend and goes straight into Greater Flurry / Assault).
`[Carguy, 25 Jun 2026 @3:53](https://youtu.be/HHygBM7jH8Y?t=233)` `[Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266)` `[Carguy, 25 Jun 2026 @5:02](https://youtu.be/HHygBM7jH8Y?t=302)` `[DiamondFang, 28 Mar 2026 @5:01](https://youtu.be/pNp3M6YehxQ?t=301)` `[DiamondFang, 28 Mar 2026 @7:16](https://youtu.be/pNp3M6YehxQ?t=436)` `[DiamondFang, 28 Mar 2026 @8:22](https://youtu.be/pNp3M6YehxQ?t=502)` `[DiamondFang, 28 Mar 2026 @9:30](https://youtu.be/pNp3M6YehxQ?t=570)` `[DiamondFang, 28 Mar 2026 @26:09](https://youtu.be/pNp3M6YehxQ?t=1569)`

#### Greater Fury (basic)

Damage roughly equal to Adaptive Strike, but you press it for the secondary effect: it guarantees a critical strike on your next ability (the lesser Fury only gives 25% crit chance and a minor damage boost). Press it directly before a big hit — Carguy names Overpower and Hurricane. DiamondFang's caveat matters for a trainer: Fury scales inversely with your gear, because in best-in-slot setups you are already near the hit cap so the guaranteed crit is wasted; it is a good basic but overshadowed by Rend and Punish, and unlike Rend there is no stall trick to double it up. Carguy calls it niche but bar-worthy.
`[Carguy, 25 Jun 2026 @5:37](https://youtu.be/HHygBM7jH8Y?t=337)` `[Carguy, 25 Jun 2026 @6:10](https://youtu.be/HHygBM7jH8Y?t=370)` `[DiamondFang, 28 Mar 2026 @8:22](https://youtu.be/pNp3M6YehxQ?t=502)` `[DiamondFang, 28 Mar 2026 @8:57](https://youtu.be/pNp3M6YehxQ?t=537)`

#### Backhand (basic, stun)

The melee stun. Little damage on its own, exists for content that forces a stun. Two charges, then a 15-second cooldown; the two charges run essentially independent cooldowns, so spacing them 5 seconds apart means only 10 further seconds of wait, and the game does not hand both charges back at once. It is affected by the flanking perk, which was buffed to compensate for the deleted threshold version, and Carguy says with flanking it hits hard enough that a flanking off-hand — or, expensively, a flanking Ek-ZekKil — could technically be best in slot in some situations. He notes you should never actually run into cooldown trouble with it. DiamondFang does not discuss it.
`[Carguy, 25 Jun 2026 @6:10](https://youtu.be/HHygBM7jH8Y?t=370)` `[Carguy, 25 Jun 2026 @6:44](https://youtu.be/HHygBM7jH8Y?t=404)` `[Carguy, 25 Jun 2026 @7:17](https://youtu.be/HHygBM7jH8Y?t=437)` `[Carguy, 25 Jun 2026 @7:51](https://youtu.be/HHygBM7jH8Y?t=471)`

#### Punish (basic)

Execute basic. Base damage 110-130% is unremarkable, but it deals 2.5x damage when the target is below 50% life points, at which point Carguy has seen almost 30k from it inside Berserk. Press it as your basic whenever the boss is under 50%; above that it is a bad button. DiamondFang gives the same one-line rule and uses it to finish bosses at the end of a rotation.
`[Carguy, 25 Jun 2026 @7:51](https://youtu.be/HHygBM7jH8Y?t=471)` `[Carguy, 25 Jun 2026 @8:27](https://youtu.be/HHygBM7jH8Y?t=507)` `[DiamondFang, 28 Mar 2026 @9:30](https://youtu.be/pNp3M6YehxQ?t=570)` `[DiamondFang, 28 Mar 2026 @13:57](https://youtu.be/pNp3M6YehxQ?t=837)` `[DiamondFang, 28 Mar 2026 @26:09](https://youtu.be/pNp3M6YehxQ?t=1569)`

#### Greater Barge (basic)

The most mechanically complex basic, and the piece both guides build the opener around. You must not attack for two global cooldowns plus one game tick; then a charged icon appears in the buff bar and you may Barge. After barging you have a window of two global cooldowns plus one tick to press Assault or Greater Flurry, which converts that channelled ability into a damage-over-time ("bleed") — the ability's full damage goes out while you keep pressing other abilities. It also moves you up to 10 tiles to the target and hits harder when fully charged. DiamondFang states it the other way round: the bleed makes an eight-tick channel cost only three ticks, and the barge saves five ticks of Berserk; the activation requires not having hit an enemy for five ticks, but for adrenaline reasons the opener spends six.

Timing traps Carguy calls out: barging on the same game tick the charged icon appears does not give the effect (he is unsure whether that is a bug or a tick-system limit); conversely you can hold the barge until the last tick of the window, which is useful to push the bleed past a boss immunity or damage-reduction phase.

Combos: Berserk -> Barge -> Overpower -> bleed Assault (budget) or bleed Greater Flurry (better gear). Not a revolution ability — it is condition-timed and both guides press it manually.
`[Carguy, 25 Jun 2026 @8:27](https://youtu.be/HHygBM7jH8Y?t=507)` `[Carguy, 25 Jun 2026 @9:02](https://youtu.be/HHygBM7jH8Y?t=542)` `[Carguy, 25 Jun 2026 @9:36](https://youtu.be/HHygBM7jH8Y?t=576)` `[Carguy, 25 Jun 2026 @10:08](https://youtu.be/HHygBM7jH8Y?t=608)` `[Carguy, 25 Jun 2026 @10:42](https://youtu.be/HHygBM7jH8Y?t=642)` `[DiamondFang, 28 Mar 2026 @3:54](https://youtu.be/pNp3M6YehxQ?t=234)` `[DiamondFang, 28 Mar 2026 @10:36](https://youtu.be/pNp3M6YehxQ?t=636)` `[DiamondFang, 28 Mar 2026 @11:11](https://youtu.be/pNp3M6YehxQ?t=671)` `[DiamondFang, 28 Mar 2026 @11:42](https://youtu.be/pNp3M6YehxQ?t=702)` `[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007)`

#### Chaos Roar (basic)

Unlocked from a codex (Carguy: still around 150-200 million at time of recording; DiamondFang: unlocked from Zamorak). Weak on its own; its job is to multiply the next ability by 1.75x. It used to be 2x — the modernisation raised melee ability damage by 25%, cut Berserk's buff by 25%, and brought Chaos Roar in line, so effective top-end damage is unchanged while out-of-Berserk damage is better.

Press it immediately before a special attack, not before an ability: Carguy pairs it with the dagger Essence of Finality spec or the Ek-ZekKil spec; DiamondFang says dagger or Dragon claws, and that Chaos Roar into a raw Ek-ZekKil spec on a marked target is the 120k burst everyone sees. Common mistake, stated emphatically by Carguy: never Chaos Roar Overpower — the 30k hit cap eats the buff and Overpower already caps on its own. DiamondFang partially disagrees for budget setups (see Contradictions). If you have Chaos Roar but no Essence of Finality, DiamondFang suggests roaring Hurricane instead (the caption reads "sun cane", which is garbled — Hurricane is the reading consistent with the rest of that sentence, but it is inference, not something the video says cleanly).
`[Carguy, 25 Jun 2026 @11:15](https://youtu.be/HHygBM7jH8Y?t=675)` `[Carguy, 25 Jun 2026 @11:50](https://youtu.be/HHygBM7jH8Y?t=710)` `[Carguy, 25 Jun 2026 @12:23](https://youtu.be/HHygBM7jH8Y?t=743)` `[Carguy, 25 Jun 2026 @12:57](https://youtu.be/HHygBM7jH8Y?t=777)` `[Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280)` `[DiamondFang, 28 Mar 2026 @9:30](https://youtu.be/pNp3M6YehxQ?t=570)` `[DiamondFang, 28 Mar 2026 @10:03](https://youtu.be/pNp3M6YehxQ?t=603)` `[DiamondFang, 28 Mar 2026 @10:36](https://youtu.be/pNp3M6YehxQ?t=636)` `[DiamondFang, 28 Mar 2026 @32:21](https://youtu.be/pNp3M6YehxQ?t=1941)`

#### Bladed Dive (basic)

Movement basic that does a small AoE hit around you on landing. Dual wield only — it does not work with a two-handed weapon (Carguy names Tumeken's light and a scythe) unless you are wearing laceration boots. Killing the target resets its cooldown, and it resets even if the target was not killed by the dive itself. Uses named: diving pools at Raksha if you are not pool-skipping (a mid-level concern — best-in-slot melee skips them trivially), or moving between Solak roots in a solo instance. It costs a global cooldown, which is why most players keybind the utility Dive instead.
`[Carguy, 25 Jun 2026 @12:57](https://youtu.be/HHygBM7jH8Y?t=777)` `[Carguy, 25 Jun 2026 @13:29](https://youtu.be/HHygBM7jH8Y?t=809)` `[Carguy, 25 Jun 2026 @14:03](https://youtu.be/HHygBM7jH8Y?t=843)` `[Carguy, 25 Jun 2026 @25:22](https://youtu.be/HHygBM7jH8Y?t=1522)`

#### Assault (enhanced)

The bread-and-butter enhanced ability: 25% adrenaline, 6-second cooldown, eight-tick channel. DiamondFang's default advice is that when you do not know what to press, press Assault; he calls it the best general adrenaline spender and says it is usable roughly every three abilities. It is a Bloodlust spender: at four stacks it consumes them for a large damage bonus, and Carguy has it hitting 20-23k under Bloodlust inside Berserk.

Bloodlust routing rule: spend stacks on Assault while the boss is high HP — DiamondFang says above 70%, Carguy puts the crossover at ~60-61% remaining — and on Greater Flurry below that, because Flurry's Bloodlust bonus scales with missing HP.

Combos: it is the usual bleed target after Greater Barge in budget rotations. Channel handling: cancel it early — DiamondFang says watch the channel bar and press the next ability when it reads 0.6 seconds, because your input takes a tick to register. Common mistake Carguy names: using Assault during a window where you also need to press a defensive (Devotion, Resonance, Reflect, Barricade), because the full channel eats the time; use Hurricane there instead.
`[Carguy, 25 Jun 2026 @14:03](https://youtu.be/HHygBM7jH8Y?t=843)` `[Carguy, 25 Jun 2026 @14:37](https://youtu.be/HHygBM7jH8Y?t=877)` `[Carguy, 25 Jun 2026 @15:11](https://youtu.be/HHygBM7jH8Y?t=911)` `[Carguy, 25 Jun 2026 @17:57](https://youtu.be/HHygBM7jH8Y?t=1077)` `[Carguy, 25 Jun 2026 @38:51](https://youtu.be/HHygBM7jH8Y?t=2331)` `[Carguy, 25 Jun 2026 @39:25](https://youtu.be/HHygBM7jH8Y?t=2365)` `[DiamondFang, 28 Mar 2026 @3:54](https://youtu.be/pNp3M6YehxQ?t=234)` `[DiamondFang, 28 Mar 2026 @4:27](https://youtu.be/pNp3M6YehxQ?t=267)` `[DiamondFang, 28 Mar 2026 @5:01](https://youtu.be/pNp3M6YehxQ?t=301)` `[DiamondFang, 28 Mar 2026 @5:34](https://youtu.be/pNp3M6YehxQ?t=334)`

#### Hurricane (enhanced)

Two-handed only. The AoE enhanced ability and melee's burst button, because it front-loads its damage: the main target takes two instant hits (the second larger), and everything else within your weapon's attack range takes one — 3x3 for standard one-tile weapons, 5x5 for a halberd or scythe, up to nine targets. Bloodlust adds an extra hit on the main target and on every secondary target. Its cooldown is reduced by 3 seconds per enemy hit, so with enough targets it becomes a near-repeatable AoE button.

Press it when: you need a target dead on this exact game tick (Carguy: with Bloodlust it usually finishes something sitting around 20k); you are in an AoE pack; or you are in a mechanic window where you must also press a defensive, since it resolves in one press instead of a channel. DiamondFang rates it below Assault for overall single-target damage and says it gains less from Bloodlust, but likes that its Bloodlust value goes into the AoE hits. Carguy pairs Chaos Roar with Hurricane in elite dungeons.
`[Carguy, 25 Jun 2026 @15:11](https://youtu.be/HHygBM7jH8Y?t=911)` `[Carguy, 25 Jun 2026 @15:43](https://youtu.be/HHygBM7jH8Y?t=943)` `[Carguy, 25 Jun 2026 @16:16](https://youtu.be/HHygBM7jH8Y?t=976)` `[Carguy, 25 Jun 2026 @16:50](https://youtu.be/HHygBM7jH8Y?t=1010)` `[Carguy, 25 Jun 2026 @39:25](https://youtu.be/HHygBM7jH8Y?t=2365)` `[DiamondFang, 28 Mar 2026 @5:34](https://youtu.be/pNp3M6YehxQ?t=334)` `[DiamondFang, 28 Mar 2026 @6:08](https://youtu.be/pNp3M6YehxQ?t=368)` `[DiamondFang, 28 Mar 2026 @7:16](https://youtu.be/pNp3M6YehxQ?t=436)`

#### Greater Flurry (enhanced)

Dual wield only; unlocked from Elite Dungeon 2 (DiamondFang). It absorbed the effects of the thresholds that were deleted. 25% adrenaline, 20.4-second cooldown — much longer than Assault. Eight hits, one per game tick, hitting all targets equally; it stuns and binds for 3.6 seconds (Carguy compares this to the old Destroy).

The key change: it no longer reduces Berserk's cooldown, it extends Berserk by one game tick per hit. Since Berserk also ticks down during those eight ticks, this is Berserk-time neutral to slightly positive — DiamondFang phrases it as making Berserk stationary while it channels, worth about 3.6 seconds; Carguy says two Flurries take a Vestments Berserk well past 30 seconds. So you press Flurry inside Berserk even when Assault would out-damage it, purely for the extension.

Bloodlust on Flurry scales with the target's missing HP: use it here below ~60-61% target HP (Carguy) / below 70% (DiamondFang), and outside Berserk — Carguy specifically names a ZGS window on a low-HP target — Flurry beats Assault. Channel cancelling and the Barge bleed apply to it as they do to Assault; with better gear DiamondFang bleeds Flurry rather than Assault after the Barge.
`[Carguy, 25 Jun 2026 @16:16](https://youtu.be/HHygBM7jH8Y?t=976)` `[Carguy, 25 Jun 2026 @16:50](https://youtu.be/HHygBM7jH8Y?t=1010)` `[Carguy, 25 Jun 2026 @17:24](https://youtu.be/HHygBM7jH8Y?t=1044)` `[Carguy, 25 Jun 2026 @17:57](https://youtu.be/HHygBM7jH8Y?t=1077)` `[Carguy, 25 Jun 2026 @18:31](https://youtu.be/HHygBM7jH8Y?t=1111)` `[Carguy, 25 Jun 2026 @25:22](https://youtu.be/HHygBM7jH8Y?t=1522)` `[DiamondFang, 28 Mar 2026 @6:08](https://youtu.be/pNp3M6YehxQ?t=368)` `[DiamondFang, 28 Mar 2026 @6:42](https://youtu.be/pNp3M6YehxQ?t=402)` `[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007)` `[DiamondFang, 28 Mar 2026 @24:29](https://youtu.be/pNp3M6YehxQ?t=1469)`

#### Dismember / Slaughter / Massacre (enhanced, the bleed button)

One button, pressed three times in sequence for the three bleeds — Carguy compares the mechanism to the Necromancy scythe abilities. First press Dismember, second Slaughter, third Massacre. Blood Tendrils no longer exists. Slaughter was buffed and lost its walk-under mechanic entirely; Massacre had its adrenaline cost cut sharply and its damage raised, so it is no longer the never-press ability it was.

When to press: a Masterwork spear extends all three durations by 50%, so the practical pattern is equip spear, press the button until it stops producing bleeds, swap back to your real weapons — Carguy uses exactly this on Raksha phase 4 with a Masterwork spear of annihilation. Gloves of Passage: enhanced gloves give bleeds +15% damage for 10 seconds, and DiamondFang chains Rend into Dismember for the gloves boost.

Disagreement worth flagging for a trainer: DiamondFang rates Dismember as fine outside Berserk, bad inside it, and says Slaughter and Massacre are not worth the adrenaline in most cases. Carguy treats the bleeds as a niche melee-camp / spear-window tool rather than a rotation staple.
`[Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266)` `[Carguy, 25 Jun 2026 @18:31](https://youtu.be/HHygBM7jH8Y?t=1111)` `[Carguy, 25 Jun 2026 @19:07](https://youtu.be/HHygBM7jH8Y?t=1147)` `[Carguy, 25 Jun 2026 @19:39](https://youtu.be/HHygBM7jH8Y?t=1179)` `[DiamondFang, 28 Mar 2026 @9:30](https://youtu.be/pNp3M6YehxQ?t=570)` `[DiamondFang, 28 Mar 2026 @13:24](https://youtu.be/pNp3M6YehxQ?t=804)` `[Carguy, 21 Mar 2026 @3:50](https://youtu.be/olCJ8ET-KQw?t=230)` `[Carguy, 21 Mar 2026 @8:56](https://youtu.be/olCJ8ET-KQw?t=536)`

#### Overpower (ultimate)

The biggest melee damage ability outside the Ek-ZekKil special (DiamondFang). 60% adrenaline base. With the Zuk cape — igneous Kal-Zuk or the normal-mode version — it becomes two hits, which matters as much for dodging the 30k hit cap as for the raw damage: DiamondFang says the cape adds 20% damage and effectively lifts Overpower's cap from 30k to 60k, worth more like 90% in high-end gear.

Inside Berserk its cooldown drops to 9 seconds, so you get about four per Berserk (DiamondFang: roughly one every five abilities) and the Berserk rotation is built around fitting in as many as possible. Outside Berserk, DiamondFang allows one Overpower but says press it early in the non-Berserk window or you will hit cooldown problems when Berserk returns; and make sure the final Overpower of a rotation lands while Berserk is still up.

Common mistakes: Chaos Roaring it (Carguy: never, because of the hit cap); and mis-timing the last one so it resolves after Berserk ends (DiamondFang).
`[Carguy, 25 Jun 2026 @20:13](https://youtu.be/HHygBM7jH8Y?t=1213)` `[Carguy, 25 Jun 2026 @20:48](https://youtu.be/HHygBM7jH8Y?t=1248)` `[Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280)` `[DiamondFang, 28 Mar 2026 @2:48](https://youtu.be/pNp3M6YehxQ?t=168)` `[DiamondFang, 28 Mar 2026 @3:22](https://youtu.be/pNp3M6YehxQ?t=202)` `[DiamondFang, 28 Mar 2026 @20:37](https://youtu.be/pNp3M6YehxQ?t=1237)` `[DiamondFang, 28 Mar 2026 @21:09](https://youtu.be/pNp3M6YehxQ?t=1269)` `[DiamondFang, 28 Mar 2026 @26:43](https://youtu.be/pNp3M6YehxQ?t=1603)` `[DiamondFang, 28 Mar 2026 @27:18](https://youtu.be/pNp3M6YehxQ?t=1638)`

#### Pulverize (ultimate)

Two-handed only (DiamondFang). Think of it as a single-hit Overpower — same damage band, one hit instead of two, with a slightly higher floor (300% vs 280%) — that additionally grants 25% damage reduction for 30 seconds. Its underrated part, per Carguy, is the kill clause: killing something with Pulverize grants 50% adrenaline, which interacts with Natural Instinct, the Vestments effect and Ring of Vigour, making it adrenaline-neutral or even positive against its 60% base cost.

Press it as your ultimate when you expect to land the killing blow, or when you want the damage reduction. DiamondFang is lukewarm: not worth the adrenaline unless the kill is certain, and Punish would often have done the job.
`[Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280)` `[Carguy, 25 Jun 2026 @21:57](https://youtu.be/HHygBM7jH8Y?t=1317)` `[Carguy, 25 Jun 2026 @22:31](https://youtu.be/HHygBM7jH8Y?t=1351)` `[Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385)` `[DiamondFang, 28 Mar 2026 @11:42](https://youtu.be/pNp3M6YehxQ?t=702)` `[DiamondFang, 28 Mar 2026 @12:15](https://youtu.be/pNp3M6YehxQ?t=735)`

#### Meteor Strike (ultimate)

Rebuilt as melee's adrenaline engine. It no longer gives 8% adrenaline per critical strike; instead, once pressed, it generates 4.5% adrenaline every game tick. It kept its AoE: 220-250% to everything in your weapon's attack range (3x3 normal, 5x5 halberd or scythe) — Carguy describes the hit as a slightly weaker Pulverize on everything — but the adrenaline generation is the reason to press it.

Timing: it opens essentially every rotation. DiamondFang says Berserk is always tied to Meteor Strike, that the standard order is Meteor Strike, one ability, Berserk (so both have maximum uptime), that the two can be swapped in rare cases, and that there is almost never a reason to use one without the other — Meteor Strike pays for the abilities you spend inside Berserk. Carguy's trigger for committing to a Berserk rotation is Meteor Strike being ready. Because Meteor Strike now covers adrenaline, Carguy drops the crit-for-adrenaline consideration from his gear choice and takes the damage scripture instead.
`[Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385)` `[Carguy, 25 Jun 2026 @23:38](https://youtu.be/HHygBM7jH8Y?t=1418)` `[Carguy, 25 Jun 2026 @36:03](https://youtu.be/HHygBM7jH8Y?t=2163)` `[Carguy, 25 Jun 2026 @38:17](https://youtu.be/HHygBM7jH8Y?t=2297)` `[DiamondFang, 28 Mar 2026 @2:14](https://youtu.be/pNp3M6YehxQ?t=134)` `[DiamondFang, 28 Mar 2026 @2:48](https://youtu.be/pNp3M6YehxQ?t=168)` `[Carguy, 21 Mar 2026 @2:10](https://youtu.be/olCJ8ET-KQw?t=130)`

#### Berserk (ultimate)

The ability melee is built around. 1.75x damage on everything (down from 2x pre-update, compensated by the +25% to melee ability damage), at the cost of taking 25% more damage. On cast it grants four Bloodlust stacks, doubles all Bloodlust generation while active, and raises the Bloodlust cap from four to eight. It reduces Overpower's cooldown to 9 seconds. Base duration 19.8 seconds; Carguy says the full four-piece Vestments set takes it to 26 seconds and two Greater Flurries push it past 30. One-minute cooldown, so there is always a gap you have to fill.

Press it: after Meteor Strike plus one adrenaline-building ability (usually a stalled Adaptive Strike out of range), with the Greater Barge charge already banked. Everything else is subordinate — DiamondFang: every rotation and most gear upgrades exist to extend Berserk or to fit more abilities inside it. Outside Berserk, your first priority is banking enough adrenaline to open the next one. DiamondFang adds a hybrid caveat: when hybridding you deliberately end Berserk on higher adrenaline than normal, because you need to open the next style's Meteor-ability-Berserk cycle, rather than dumping everything.
`[Carguy, 25 Jun 2026 @12:23](https://youtu.be/HHygBM7jH8Y?t=743)` `[Carguy, 25 Jun 2026 @24:13](https://youtu.be/HHygBM7jH8Y?t=1453)` `[Carguy, 25 Jun 2026 @24:47](https://youtu.be/HHygBM7jH8Y?t=1487)` `[Carguy, 25 Jun 2026 @25:22](https://youtu.be/HHygBM7jH8Y?t=1522)` `[Carguy, 25 Jun 2026 @34:57](https://youtu.be/HHygBM7jH8Y?t=2097)` `[Carguy, 25 Jun 2026 @35:30](https://youtu.be/HHygBM7jH8Y?t=2130)` `[DiamondFang, 28 Mar 2026 @1:41](https://youtu.be/pNp3M6YehxQ?t=101)` `[DiamondFang, 28 Mar 2026 @2:14](https://youtu.be/pNp3M6YehxQ?t=134)` `[DiamondFang, 28 Mar 2026 @5:01](https://youtu.be/pNp3M6YehxQ?t=301)` `[DiamondFang, 28 Mar 2026 @14:31](https://youtu.be/pNp3M6YehxQ?t=871)` `[DiamondFang, 28 Mar 2026 @28:25](https://youtu.be/pNp3M6YehxQ?t=1705)`

#### Dive (utility)

The only ability in the utility category. A movement-only, non-combat version of Bladed Dive that does not trigger the global cooldown, which is why Carguy keybinds this rather than Bladed Dive on every action bar. It is also the only melee ability usable without a melee weapon equipped. No damage, no rotation role.
`[Carguy, 25 Jun 2026 @1:38](https://youtu.be/HHygBM7jH8Y?t=98)` `[Carguy, 25 Jun 2026 @25:22](https://youtu.be/HHygBM7jH8Y?t=1522)` `[Carguy, 25 Jun 2026 @25:56](https://youtu.be/HHygBM7jH8Y?t=1556)`

### Rotations

#### Carguy's generic end-game opener and long rotation (HHygBM7jH8Y, on dummies)

Assumes: four-piece Vestments, Zuk cape, Chaos Roar unlocked, dagger Essence of Finality, ZGS, Ek-ZekKil, Leng swords, Greater Barge and Greater Flurry. Framed as walking into a boss instance.

1. Take adrenaline at the crystal; stall an Ek-ZekKil, then top adrenaline up again.
2. Enter, target-cycle to release the stalled spec.
3. Meteor Strike.
4. Anticipate (this is the ability spent between Meteor Strike and Berserk).
5. Berserk.
6. Greater Barge.
7. Overpower.
8. Swap to dual wields; bleed Greater Flurry.
9. Assault; let it play out.
10. Rend -> Overpower -> Assault.
11. Chaos Roar -> dagger Essence of Finality spec.
12. Overpower -> Rend -> Greater Flurry.
13. Filler ability -> Overpower -> Hurricane to close the Berserk.
14. Build adrenaline; fire the ZGS spec as the between-Berserks damage window.
15. Filler ability, a basic, adrenaline potion if needed, Assault. (No Overpower here — Carguy deliberately withholds it.) Possibly Hurricane.
16. Greater Fury -> Meteor Strike, then build.
17. Anticipate -> second Berserk, then repeat the Berserk block, but this time bleed Greater Fury, Assault, Rend, Overpower, Assault, then Chaos Roar -> Ek-ZekKil spec (instead of the dagger), Overpower, Rend, swap to dual wields for Greater Flurry, Greater Fury, Overpower, Hurricane.

Carguy stresses this is a dummy-length demonstration; on real bosses you get shorter damage windows, and the actual skill is writing the backup rotation for immunity phases (use Hurricane rather than Assault there so you can also press Devotion / Resonance / Reflect / Barricade).
`[Carguy, 25 Jun 2026 @35:30](https://youtu.be/HHygBM7jH8Y?t=2130)` `[Carguy, 25 Jun 2026 @36:03](https://youtu.be/HHygBM7jH8Y?t=2163)` `[Carguy, 25 Jun 2026 @36:38](https://youtu.be/HHygBM7jH8Y?t=2198)` `[Carguy, 25 Jun 2026 @37:11](https://youtu.be/HHygBM7jH8Y?t=2231)` `[Carguy, 25 Jun 2026 @37:45](https://youtu.be/HHygBM7jH8Y?t=2265)` `[Carguy, 25 Jun 2026 @38:17](https://youtu.be/HHygBM7jH8Y?t=2297)` `[Carguy, 25 Jun 2026 @38:51](https://youtu.be/HHygBM7jH8Y?t=2331)` `[Carguy, 25 Jun 2026 @39:25](https://youtu.be/HHygBM7jH8Y?t=2365)`

#### DiamondFang tier 1: cheap gear (full Bandos, tier 80 weapons, all abilities unlocked, ~83 Attack)

Demonstrated on Vindicta. No Greater Barge / Greater Flurry / Essence of Finality assumed.

1. Meteor Strike.
2. Dismember (used only to spend time while adrenaline recovers).
3. Adaptive Strike.
4. Berserk.
5. Adrenaline potion, then Assault.
6. Rend (for the Gloves of Passage boost) -> Overpower.
7. Assault.
8. Adaptive Strike -> Assault.
9. Overpower.
10. Punish to finish, since the boss is now low.

`[DiamondFang, 28 Mar 2026 @12:15](https://youtu.be/pNp3M6YehxQ?t=735)` `[DiamondFang, 28 Mar 2026 @12:49](https://youtu.be/pNp3M6YehxQ?t=769)` `[DiamondFang, 28 Mar 2026 @13:24](https://youtu.be/pNp3M6YehxQ?t=804)` `[DiamondFang, 28 Mar 2026 @13:57](https://youtu.be/pNp3M6YehxQ?t=837)`

#### DiamondFang tier 2: Greater Barge + Greater Flurry unlocked, with Conservation of Energy and passive Ring of Vigour

1. Meteor Strike.
2. Escape (move out of the target's range) and cast Adaptive Strike so it does not hit — the stall, worth 12% adrenaline rather than 9%.
3. Berserk immediately (this also consumes the stall).
4. Greater Barge.
5. Overpower.
6. Bleed Assault. (With better gear, bleed Greater Flurry here instead — at this tier Assault is the better bleed.)
7. Rend -> Greater Flurry (target is now lower HP, so Flurry hits harder).
8. Overpower.
9. Punish if the target is low, otherwise Greater Fury as filler.
10. Assault -> Rend -> Overpower.

Three Overpowers and five ultimates in one rotation; DiamondFang says it is only affordable because Conservation of Energy plus passive Ring of Vigour save about 100% adrenaline over the rotation.
`[DiamondFang, 28 Mar 2026 @16:13](https://youtu.be/pNp3M6YehxQ?t=973)` `[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007)` `[DiamondFang, 28 Mar 2026 @17:20](https://youtu.be/pNp3M6YehxQ?t=1040)` `[DiamondFang, 28 Mar 2026 @17:52](https://youtu.be/pNp3M6YehxQ?t=1072)`

#### DiamondFang tier 3: Essence of Finality + Chaos Roar + Zuk cape, tier 90 weapons

Same opener (Meteor Strike, escape + stall ability, Berserk, Greater Barge, Overpower, bleed an ability), then Flurry and Overpower as before, then Chaos Roar -> Essence of Finality spec for the burst, then Assault and Overpower again. DiamondFang calls "Berserk, Barge, Overpower, bleed" the standard opening all the way up to high-end hybridding. One caption in this section reads "smash" as the ability before Flurry; there is no Smash ability in the book either video describes, so what was actually pressed there is unclear.
`[DiamondFang, 28 Mar 2026 @18:25](https://youtu.be/pNp3M6YehxQ?t=1105)` `[DiamondFang, 28 Mar 2026 @20:05](https://youtu.be/pNp3M6YehxQ?t=1205)` `[DiamondFang, 28 Mar 2026 @20:37](https://youtu.be/pNp3M6YehxQ?t=1237)`

#### DiamondFang tier 4: three-piece Vestments, colossal/enhanced Gloves of Passage, tier 90 armour (demonstrated on Raksha)

1. Meteor Strike -> escape + stall ability -> Berserk -> Greater Barge -> Overpower -> Greater Flurry.
2. No Rend needed for adrenaline at this tier: go straight Greater Flurry then Assault (Flurry first for cooldown reasons).
3. Rend -> Overpower -> Assault.
4. Chaos Roar -> dagger or Dragon claws Essence of Finality spec.
5. Rend -> Overpower -> Greater Flurry.
6. Punish if the boss is low, otherwise another Greater Flurry (or Adaptive Strike on an equilibrium build).
7. Three-tick Assault, then Rend -> Overpower. If you took the Assault route with the Rend already spent, skip the Rend and go Assault -> Overpower — the constraint is that the final Overpower must land while Berserk is still active.

`[DiamondFang, 28 Mar 2026 @26:09](https://youtu.be/pNp3M6YehxQ?t=1569)` `[DiamondFang, 28 Mar 2026 @26:43](https://youtu.be/pNp3M6YehxQ?t=1603)`

#### Pre-build / stalling openers (DiamondFang)

- Basic stall: outside the target's range, cast an ability; it is held on your character and released with no extra global cooldown when you click or target-cycle onto a target. Spells no longer release a stall — only gaining/clicking a target does. This stacks two abilities on one tick and smuggles buffs into instances.
- Common form: stall Meteor Strike, release it on a combat dummy with Natural Instinct for extra adrenaline, one ability, Berserk, burst the dummy, Chaos Roar the dummy, then stall an ability timed so the boss fight starts as you release it (he names AoD as needing the release on the right tick).
- Free Dragon battleaxe: at the Wars Retreat adrenaline crystal, spec a Dragon battleaxe from the inventory (no Essence of Finality needed) before the fight; also useful mid-fight where there is prep time or a burst window.
- Annihilation pre-build: stalled Meteor Strike + Natural Instinct on the same tick, a basic (or one tick wait), Annihilation spec, stall Adaptive Strike, surge, then dummy work and Berserk. DiamondFang: worth it sometimes, particularly for speed kills and for skipping slow early phases, not always.

`[DiamondFang, 28 Mar 2026 @30:41](https://youtu.be/pNp3M6YehxQ?t=1841)` `[DiamondFang, 28 Mar 2026 @31:15](https://youtu.be/pNp3M6YehxQ?t=1875)` `[DiamondFang, 28 Mar 2026 @31:48](https://youtu.be/pNp3M6YehxQ?t=1908)` `[DiamondFang, 28 Mar 2026 @32:21](https://youtu.be/pNp3M6YehxQ?t=1941)` `[DiamondFang, 28 Mar 2026 @32:55](https://youtu.be/pNp3M6YehxQ?t=1975)` `[DiamondFang, 28 Mar 2026 @33:27](https://youtu.be/pNp3M6YehxQ?t=2007)` `[DiamondFang, 28 Mar 2026 @34:00](https://youtu.be/pNp3M6YehxQ?t=2040)` `[DiamondFang, 28 Mar 2026 @35:39](https://youtu.be/pNp3M6YehxQ?t=2139)` `[DiamondFang, 28 Mar 2026 @36:12](https://youtu.be/pNp3M6YehxQ?t=2172)`

#### Carguy's Raksha kill (olCJ8ET-KQw) — no stalling

Gear: four-piece Vestments, enhanced Gloves of Passage, Leng swords, Ek-ZekKil, Masterwork spear of annihilation, dagger in the Essence of Finality, Reaver's ring, scripture of Ful, Berserker's Fury / Conservation of Energy / Font of Life relics. Rotation taken from PVME; kills average around 115 seconds and can reach the 110s and the grandmaster requirement.

1. Dragon battleaxe spec at the adrenaline crystal, re-equip Leng sword, take adrenaline, run in (no stall).
2. Surge in, Freedom with Surge to line up the next two abilities.
3. Berserk.
4. Target-cycle, Greater Barge, Overpower, Meteor Strike, bleed Greater Flurry — all of this on Leng swords, to fish for the frost/primordial passive proc.
5. Ek-ZekKil spec (this marks the target), then camp Ek-ZekKil from here.
6. Rend -> Adaptive Strike -> Overpower -> Greater Fury -> Hurricane.
7. Reposition, dagger Essence of Finality spec, re-equip, Rend, a late Overpower (he improvises an Assault in), then stall.
8. Punish to finish the phase.
9. Next phase: Freedom, Barge in, recall familiar, bleed Assault, Dismember, Rend, second bleed, Adaptive Strike, escape, run back in, Divert; wait out the Berserk cooldown.
10. Barge, bleed Greater Flurry, escape, Rend, Adaptive Strike, Punish, Overpower, Chaos Roar -> Ek-ZekKil, Hurricane.

Carguy explicitly does not follow the PVME script exactly and still gets the grandmaster time; he flags his own habit of swapping back to dual wields for Adaptive Strike as the mistake to avoid, since you should camp Ek-ZekKil once the target is marked.
`[Carguy, 21 Mar 2026 @1:05](https://youtu.be/olCJ8ET-KQw?t=65)` `[Carguy, 21 Mar 2026 @1:37](https://youtu.be/olCJ8ET-KQw?t=97)` `[Carguy, 21 Mar 2026 @2:10](https://youtu.be/olCJ8ET-KQw?t=130)` `[Carguy, 21 Mar 2026 @3:50](https://youtu.be/olCJ8ET-KQw?t=230)` `[Carguy, 21 Mar 2026 @6:05](https://youtu.be/olCJ8ET-KQw?t=365)` `[Carguy, 21 Mar 2026 @6:40](https://youtu.be/olCJ8ET-KQw?t=400)` `[Carguy, 21 Mar 2026 @7:49](https://youtu.be/olCJ8ET-KQw?t=469)` `[Carguy, 21 Mar 2026 @8:23](https://youtu.be/olCJ8ET-KQw?t=503)` `[Carguy, 21 Mar 2026 @8:56](https://youtu.be/olCJ8ET-KQw?t=536)` `[Carguy, 21 Mar 2026 @9:31](https://youtu.be/olCJ8ET-KQw?t=571)` `[Carguy, 21 Mar 2026 @10:04](https://youtu.be/olCJ8ET-KQw?t=604)` `[Carguy, 21 Mar 2026 @10:39](https://youtu.be/olCJ8ET-KQw?t=639)`

### Adrenaline and specials

Generation and saving:

- Meteor Strike is the primary generator: 4.5% adrenaline per game tick once active, which is what funds the Berserk window. Press it before Berserk in almost every opener. `[Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385)` `[DiamondFang, 28 Mar 2026 @2:14](https://youtu.be/pNp3M6YehxQ?t=134)`
- Basics: Adaptive Strike 12%, Rend 9%, Attack 9%. Adaptive Strike is the building basic; Rend is the damage basic. `[Carguy, 25 Jun 2026 @5:02](https://youtu.be/HHygBM7jH8Y?t=302)` `[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007)`
- Conservation of Energy (archaeology relic) plus the passive Ring of Vigour (from the Extinction quest) are, for DiamondFang, mandatory: together they take an Overpower from 60% to 40%, and save about 100% adrenaline across one Berserk rotation — more than an adrenaline potion. He tells newer players and Ironmen to prioritise these over most gear. `[DiamondFang, 28 Mar 2026 @14:31](https://youtu.be/pNp3M6YehxQ?t=871)` `[DiamondFang, 28 Mar 2026 @15:05](https://youtu.be/pNp3M6YehxQ?t=905)` `[DiamondFang, 28 Mar 2026 @15:40](https://youtu.be/pNp3M6YehxQ?t=940)` `[DiamondFang, 28 Mar 2026 @17:52](https://youtu.be/pNp3M6YehxQ?t=1072)`
- Vestments give adrenaline back on ultimates, which matters most on the opening Berserk; the effect also interacts with the Pulverize kill refund. `[Carguy, 25 Jun 2026 @22:31](https://youtu.be/HHygBM7jH8Y?t=1351)` `[DiamondFang, 28 Mar 2026 @23:55](https://youtu.be/pNp3M6YehxQ?t=1435)`
- Pulverize refunds 50% adrenaline on a kill, so with passive Ring of Vigour it is roughly free and with Conservation of Energy it is net positive. Carguy calls this the most slept-on thing in melee. `[Carguy, 25 Jun 2026 @22:31](https://youtu.be/HHygBM7jH8Y?t=1351)` `[Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385)`
- Adrenaline potions are used sparingly: DiamondFang deliberately writes rotations that work without one so they stay adaptable. `[DiamondFang, 28 Mar 2026 @13:24](https://youtu.be/pNp3M6YehxQ?t=804)`
- Stalling is an adrenaline/tick trick as much as a buff trick: an ability cast out of range is held and released by clicking or target-cycling a target, costing no extra global cooldown. `[DiamondFang, 28 Mar 2026 @31:15](https://youtu.be/pNp3M6YehxQ?t=1875)`

Spending:

- Spend inside Berserk, bank outside it. Outside Berserk the top priority is having enough adrenaline for the next Berserk; DiamondFang allows Assault with Bloodlust stacks plus a single early Overpower, and warns that a late non-Berserk Overpower creates cooldown problems in the next Berserk. `[DiamondFang, 28 Mar 2026 @27:18](https://youtu.be/pNp3M6YehxQ?t=1638)`
- Exception when hybridding: end Berserk on higher adrenaline than usual, because you are opening the next style's cycle rather than dumping. `[DiamondFang, 28 Mar 2026 @28:25](https://youtu.be/pNp3M6YehxQ?t=1705)`
- ZGS spec (Carguy) / "CGS" in DiamondFang's captions is the between-Berserks filler: a 7x7 zone at the cast location, +25% damage for 20 seconds — Carguy calls it a lesser Sunshine for melee. DiamondFang calls it a budget Berserk and would use it only where you genuinely need to reach a damage window sooner (he names Telos and a Solak-adjacent boss). Carguy puts it in an Essence of Finality only as a technicality: its small ticking hits scale with weapon tier, and ZGS is tier 92 while Ek-ZekKil / Leng swords with the shard are tier 100. `[Carguy, 25 Jun 2026 @30:57](https://youtu.be/HHygBM7jH8Y?t=1857)` `[Carguy, 25 Jun 2026 @31:33](https://youtu.be/HHygBM7jH8Y?t=1893)` `[Carguy, 25 Jun 2026 @32:06](https://youtu.be/HHygBM7jH8Y?t=1926)` `[Carguy, 25 Jun 2026 @37:11](https://youtu.be/HHygBM7jH8Y?t=2231)` `[DiamondFang, 28 Mar 2026 @27:51](https://youtu.be/pNp3M6YehxQ?t=1671)`

Special attacks and Essence of Finality:

- Leng swords: the passive builds primordial ice stacks (about a 12% chance per hit with both swords equipped, up to 10 stacks, each granting an additive damage buff for around 10 seconds). The spec consumes all stacks; base cost 30% adrenaline, effectively free at three stacks, and stronger the more stacks you had. It behaves like Hurricane — two big hits on the main target, one on everything in a 3x3. Carguy: anything from three stacks up is worth pressing; above about seven stacks in Berserk you generally cap. `[Carguy, 25 Jun 2026 @26:28](https://youtu.be/HHygBM7jH8Y?t=1588)` `[Carguy, 25 Jun 2026 @27:02](https://youtu.be/HHygBM7jH8Y?t=1622)` `[Carguy, 25 Jun 2026 @27:36](https://youtu.be/HHygBM7jH8Y?t=1656)` `[Carguy, 25 Jun 2026 @28:09](https://youtu.be/HHygBM7jH8Y?t=1689)`
- Ek-ZekKil: the first spec marks the target with Flamebound Rival for a single hit (Carguy ~24-25k, sometimes 30k; DiamondFang 20-25k). While marked and while you attack with Ek-ZekKil equipped you deal 12% more damage to it and take 12% less from it. A second spec on a marked target gains three extra hits, which is the ~120k burst. Cost 50% adrenaline, with 15% refunded on a marked target, so 35% net. Its old passives (Pulverize adrenaline reduction, a Smash interaction) were folded into the abilities themselves. Carguy pairs it with Chaos Roar; DiamondFang notes the first Berserk gets little from it because the marking hit is weak — you trade early damage for later damage — and that in fights shorter than a minute Leng swords beat it. He also likes firing a raw Ek-ZekKil outside Berserk together with a ZGS and Chaos Roar as a non-Berserk burst. `[Carguy, 25 Jun 2026 @28:09](https://youtu.be/HHygBM7jH8Y?t=1689)` `[Carguy, 25 Jun 2026 @28:43](https://youtu.be/HHygBM7jH8Y?t=1723)` `[Carguy, 25 Jun 2026 @29:17](https://youtu.be/HHygBM7jH8Y?t=1757)` `[Carguy, 25 Jun 2026 @29:50](https://youtu.be/HHygBM7jH8Y?t=1790)` `[DiamondFang, 28 Mar 2026 @28:58](https://youtu.be/pNp3M6YehxQ?t=1738)` `[DiamondFang, 28 Mar 2026 @29:31](https://youtu.be/pNp3M6YehxQ?t=1771)` `[DiamondFang, 28 Mar 2026 @30:06](https://youtu.be/pNp3M6YehxQ?t=1806)` `[DiamondFang, 28 Mar 2026 @30:41](https://youtu.be/pNp3M6YehxQ?t=1841)` `[Carguy, 21 Mar 2026 @10:04](https://youtu.be/olCJ8ET-KQw?t=604)`
- Dagger in the Essence of Finality: three hits inside one global cooldown, each successive hit adding crit chance and crit damage so the third is the big one. Carguy calls it the most popular and versatile melee spec and the usual Chaos Roar target, unless you specifically need the Ek-ZekKil delete. DiamondFang: dagger (he says "V dagger") or Dragon claws; claws pair with equilibrium builds. Carguy warns the dagger becomes nearly useless on an equilibrium setup, where Dragon claws take over. `[Carguy, 25 Jun 2026 @29:50](https://youtu.be/HHygBM7jH8Y?t=1790)` `[Carguy, 25 Jun 2026 @30:24](https://youtu.be/HHygBM7jH8Y?t=1824)` `[Carguy, 25 Jun 2026 @30:57](https://youtu.be/HHygBM7jH8Y?t=1857)` `[DiamondFang, 28 Mar 2026 @10:03](https://youtu.be/pNp3M6YehxQ?t=603)` `[DiamondFang, 28 Mar 2026 @19:31](https://youtu.be/pNp3M6YehxQ?t=1171)`
- Annihilation (official name Gravitate) in an Essence of Finality: 60% adrenaline base, +1% damage per hit up to 20 stacks, buff lasting around 30 seconds. It must go in an Essence of Finality because it is bound to the weapon: any weapon swap, even to another melee weapon, cancels it. Used in pre-builds and waiting periods — Carguy cites building it while waiting to kill Zamorak in ranged/melee Vorago; DiamondFang stacks it with the free Dragon battleaxe spec for pre-build burst. `[Carguy, 25 Jun 2026 @32:06](https://youtu.be/HHygBM7jH8Y?t=1926)` `[Carguy, 25 Jun 2026 @32:40](https://youtu.be/HHygBM7jH8Y?t=1960)` `[Carguy, 25 Jun 2026 @33:14](https://youtu.be/HHygBM7jH8Y?t=1994)` `[DiamondFang, 28 Mar 2026 @34:00](https://youtu.be/pNp3M6YehxQ?t=2040)` `[DiamondFang, 28 Mar 2026 @34:34](https://youtu.be/pNp3M6YehxQ?t=2074)`
- Dragon battleaxe: DiamondFang's free pre-fight damage boost, specced at the Wars Retreat adrenaline crystal from the inventory with no Essence of Finality required. He guesses the boost at about 8% and explicitly says he is unsure. Carguy runs the same opener at Raksha, equipping the battleaxe in the preset so he can spec it on the way past the crystal. `[DiamondFang, 28 Mar 2026 @33:27](https://youtu.be/pNp3M6YehxQ?t=2007)` `[DiamondFang, 28 Mar 2026 @34:00](https://youtu.be/pNp3M6YehxQ?t=2040)` `[Carguy, 21 Mar 2026 @2:10](https://youtu.be/olCJ8ET-KQw?t=130)` `[Carguy, 21 Mar 2026 @7:49](https://youtu.be/olCJ8ET-KQw?t=469)`
- Amulet swapping: DiamondFang recommends wearing a non-Essence-of-Finality amulet by default and swapping the Essence of Finality in only for the spec, then swapping back — worth building the habit, not fatal to forget. `[DiamondFang, 28 Mar 2026 @22:15](https://youtu.be/pNp3M6YehxQ?t=1335)` `[DiamondFang, 28 Mar 2026 @22:49](https://youtu.be/pNp3M6YehxQ?t=1369)`

### Numeric claims to verify

None of these are verified; they are what the videos state and should be checked against the wiki.

| Claim | Source |
|---|---|
| Global cooldown is 1.8 seconds / 3 game ticks; a game tick is 0.6 seconds | [Carguy, 25 Jun 2026 @1:38](https://youtu.be/HHygBM7jH8Y?t=98), 02:13 |
| Attack: generates 1 Bloodlust stack, gives 9% adrenaline | [Carguy, 25 Jun 2026 @2:13](https://youtu.be/HHygBM7jH8Y?t=133), 05:02 |
| Abilities show a damage band such as 135-165% melee damage | [Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266) |
| Adaptive Strike: two hits of 60-75% | [Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266) |
| Adaptive Strike gives 12% adrenaline | [Carguy, 25 Jun 2026 @5:02](https://youtu.be/HHygBM7jH8Y?t=302); [DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007) |
| Rend: 2 Bloodlust stacks, 9% adrenaline | [Carguy, 25 Jun 2026 @3:53](https://youtu.be/HHygBM7jH8Y?t=233), 05:02 |
| Rend generates 4 Bloodlust stacks inside Berserk; other basics generate 2 | [DiamondFang, 28 Mar 2026 @5:01](https://youtu.be/pNp3M6YehxQ?t=301) |
| Gloves of Passage: +10% damage on next ability (he first guesses 7%) | [Carguy, 25 Jun 2026 @3:53](https://youtu.be/HHygBM7jH8Y?t=233) |
| Enhanced Gloves of Passage: additional +6%, and bleeds +15% damage for 10 seconds | [Carguy, 25 Jun 2026 @4:26](https://youtu.be/HHygBM7jH8Y?t=266) |
| Fury (lesser) gives 25% crit chance | [DiamondFang, 28 Mar 2026 @8:22](https://youtu.be/pNp3M6YehxQ?t=502) |
| Backhand: 2 charges, 15-second cooldown | [Carguy, 25 Jun 2026 @6:10](https://youtu.be/HHygBM7jH8Y?t=370) |
| Punish: 110-130% base; 2.5x damage below 50% target life points | [Carguy, 25 Jun 2026 @7:51](https://youtu.be/HHygBM7jH8Y?t=471), 08:27 |
| Punish seen at almost 30k on a low-HP target inside Berserk | [Carguy, 25 Jun 2026 @8:27](https://youtu.be/HHygBM7jH8Y?t=507) |
| Greater Barge: charges after 2 global cooldowns + 1 tick; bleed window 2 global cooldowns + 1 tick | [Carguy, 25 Jun 2026 @9:02](https://youtu.be/HHygBM7jH8Y?t=542), 10:42 |
| Greater Barge moves you up to 10 tiles | [Carguy, 25 Jun 2026 @9:02](https://youtu.be/HHygBM7jH8Y?t=542) |
| Greater Barge saves 5 ticks of Berserk; activation needs 5 ticks without hitting, opener spends 6 for adrenaline | [DiamondFang, 28 Mar 2026 @10:36](https://youtu.be/pNp3M6YehxQ?t=636), 11:11 |
| A bled channel costs 3 ticks instead of 8 | [DiamondFang, 28 Mar 2026 @3:54](https://youtu.be/pNp3M6YehxQ?t=234), 11:11 |
| Chaos Roar: 1.75x next ability (was 2x) | [Carguy, 25 Jun 2026 @11:50](https://youtu.be/HHygBM7jH8Y?t=710), 12:23 |
| Modernisation: melee abilities +25% damage, Berserk buff -25% | [Carguy, 25 Jun 2026 @12:23](https://youtu.be/HHygBM7jH8Y?t=743) |
| Chaos Roar codex around 150-200 million gp at time of recording | [Carguy, 25 Jun 2026 @11:50](https://youtu.be/HHygBM7jH8Y?t=710) |
| Assault: 6-second cooldown, 25% adrenaline, 8-tick channel, consumes 4 Bloodlust | [Carguy, 25 Jun 2026 @14:37](https://youtu.be/HHygBM7jH8Y?t=877), 16:50; [DiamondFang, 28 Mar 2026 @3:54](https://youtu.be/pNp3M6YehxQ?t=234) |
| Assault with Bloodlust inside Berserk hits 20-23k | [Carguy, 25 Jun 2026 @15:11](https://youtu.be/HHygBM7jH8Y?t=911) |
| Assault usable roughly every 3 abilities | [DiamondFang, 28 Mar 2026 @3:54](https://youtu.be/pNp3M6YehxQ?t=234) |
| Hurricane: 3x3 with 1-tile weapons, 5x5 with halberd/scythe, up to 9 targets | [Carguy, 25 Jun 2026 @15:43](https://youtu.be/HHygBM7jH8Y?t=943), 16:16 |
| Hurricane cooldown reduced by 3 seconds per enemy hit | [Carguy, 25 Jun 2026 @16:16](https://youtu.be/HHygBM7jH8Y?t=976) |
| Hurricane can finish a target sitting around 20k when Bloodlust-buffed | [Carguy, 25 Jun 2026 @15:43](https://youtu.be/HHygBM7jH8Y?t=943) |
| Greater Flurry: 25% adrenaline, 20.4-second cooldown, 8 hits (one per tick) | [Carguy, 25 Jun 2026 @16:50](https://youtu.be/HHygBM7jH8Y?t=1010), 17:24 |
| Greater Flurry stuns and binds for 3.6 seconds | [Carguy, 25 Jun 2026 @17:24](https://youtu.be/HHygBM7jH8Y?t=1044) |
| Greater Flurry extends Berserk by 1 game tick per hit | [Carguy, 25 Jun 2026 @17:24](https://youtu.be/HHygBM7jH8Y?t=1044); [DiamondFang, 28 Mar 2026 @6:42](https://youtu.be/pNp3M6YehxQ?t=402) |
| Greater Flurry extends Berserk by 3.6 seconds | [DiamondFang, 28 Mar 2026 @24:29](https://youtu.be/pNp3M6YehxQ?t=1469) |
| Assault falls behind Flurry at roughly 60-61% target HP remaining | [Carguy, 25 Jun 2026 @17:57](https://youtu.be/HHygBM7jH8Y?t=1077) |
| Bloodlust switch point from Assault to Flurry is 70% boss HP | [DiamondFang, 28 Mar 2026 @5:34](https://youtu.be/pNp3M6YehxQ?t=334), 06:42 |
| Masterwork spear extends all three bleeds' duration by 50% | [Carguy, 25 Jun 2026 @19:39](https://youtu.be/HHygBM7jH8Y?t=1179) |
| Overpower: 60% adrenaline; 2 hits with the Zuk cape | [Carguy, 25 Jun 2026 @20:13](https://youtu.be/HHygBM7jH8Y?t=1213) |
| Overpower cooldown drops to 9 seconds inside Berserk, about 4 casts per Berserk | [Carguy, 25 Jun 2026 @20:48](https://youtu.be/HHygBM7jH8Y?t=1248) |
| Overpower usable about every 5 abilities inside Berserk | [DiamondFang, 28 Mar 2026 @2:48](https://youtu.be/pNp3M6YehxQ?t=168) |
| Hit cap is 30k | [Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280) |
| Zuk cape: +20% Overpower damage, two hits, cap 30k -> 60k; ~90% increase in high-end gear | [DiamondFang, 28 Mar 2026 @21:09](https://youtu.be/pNp3M6YehxQ?t=1269) |
| Pulverize: single hit, damage floor 300% vs Overpower's 280% | [Carguy, 25 Jun 2026 @21:57](https://youtu.be/HHygBM7jH8Y?t=1317) |
| Pulverize: 25% damage reduction for 30 seconds | [Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280) |
| Pulverize grants 50% adrenaline on a kill | [Carguy, 25 Jun 2026 @22:31](https://youtu.be/HHygBM7jH8Y?t=1351) |
| Pulverize gives "ten adrenaline" on a kill | [DiamondFang, 28 Mar 2026 @11:42](https://youtu.be/pNp3M6YehxQ?t=702) |
| Meteor Strike generates 4.5% adrenaline every game tick | [Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385) |
| Meteor Strike AoE hit is 220-250% | [Carguy, 25 Jun 2026 @23:38](https://youtu.be/HHygBM7jH8Y?t=1418) |
| Meteor Strike formerly gave 8% adrenaline per critical strike | [Carguy, 25 Jun 2026 @23:05](https://youtu.be/HHygBM7jH8Y?t=1385) |
| Berserk: 1.75x damage, +25% damage taken | [Carguy, 25 Jun 2026 @24:13](https://youtu.be/HHygBM7jH8Y?t=1453) |
| Berserk grants 4 Bloodlust stacks, doubles generation, raises cap 4 -> 8 | [Carguy, 25 Jun 2026 @24:13](https://youtu.be/HHygBM7jH8Y?t=1453), 24:47; [DiamondFang, 28 Mar 2026 @5:01](https://youtu.be/pNp3M6YehxQ?t=301) |
| Berserk base duration 19.8 seconds; 26 seconds with four-piece Vestments (caption garbles this as "26%") | [Carguy, 25 Jun 2026 @24:47](https://youtu.be/HHygBM7jH8Y?t=1487) |
| Berserk with Vestments plus two Greater Flurries exceeds 30 seconds | [Carguy, 25 Jun 2026 @24:47](https://youtu.be/HHygBM7jH8Y?t=1487), 35:30 |
| Berserk cooldown 1 minute | [Carguy, 25 Jun 2026 @24:47](https://youtu.be/HHygBM7jH8Y?t=1487), 35:30 |
| Berserk lasts "20 seconds to 36, something like that" | [DiamondFang, 28 Mar 2026 @1:41](https://youtu.be/pNp3M6YehxQ?t=101) |
| Three-piece Vestments extends Berserk by 6 seconds and costs around 1 billion gp | [DiamondFang, 28 Mar 2026 @23:55](https://youtu.be/pNp3M6YehxQ?t=1435), 24:29 |
| Leng swords: ~12% chance per hit for a primordial ice stack, up to 10, buff ~10 seconds | [Carguy, 25 Jun 2026 @26:28](https://youtu.be/HHygBM7jH8Y?t=1588), 27:02 |
| Leng spec: 30% adrenaline base, effectively free at 3 stacks; near hit cap above ~7 stacks in Berserk | [Carguy, 25 Jun 2026 @27:02](https://youtu.be/HHygBM7jH8Y?t=1622), 27:36 |
| Ek-ZekKil first spec hits ~24-25k, sometimes 30k | [Carguy, 25 Jun 2026 @28:43](https://youtu.be/HHygBM7jH8Y?t=1723) |
| Ek-ZekKil first cast does 20-25k | [DiamondFang, 28 Mar 2026 @28:58](https://youtu.be/pNp3M6YehxQ?t=1738) |
| Flamebound Rival: +12% damage dealt to the marked target, 12% less damage taken from it | [Carguy, 25 Jun 2026 @28:43](https://youtu.be/HHygBM7jH8Y?t=1723); [DiamondFang, 28 Mar 2026 @28:58](https://youtu.be/pNp3M6YehxQ?t=1738); [Carguy, 21 Mar 2026 @10:04](https://youtu.be/olCJ8ET-KQw?t=604) |
| Ek-ZekKil second spec on a marked target: 3 additional hits, around 120k total | [Carguy, 25 Jun 2026 @28:43](https://youtu.be/HHygBM7jH8Y?t=1723), 29:17; [DiamondFang, 28 Mar 2026 @29:31](https://youtu.be/pNp3M6YehxQ?t=1771) |
| Ek-ZekKil spec costs 50% adrenaline, refunds 15% on a marked target (35% net) | [Carguy, 25 Jun 2026 @29:17](https://youtu.be/HHygBM7jH8Y?t=1757) |
| Dagger Essence of Finality spec: 3 hits inside one global cooldown | [Carguy, 25 Jun 2026 @29:50](https://youtu.be/HHygBM7jH8Y?t=1790) |
| ZGS: 7x7 area, +25% damage for 20 seconds | [Carguy, 25 Jun 2026 @31:33](https://youtu.be/HHygBM7jH8Y?t=1893) |
| ZGS is tier 92; Ek-ZekKil / Leng swords with the shard are tier 100 | [Carguy, 25 Jun 2026 @32:06](https://youtu.be/HHygBM7jH8Y?t=1926) |
| Annihilation: 60% adrenaline, +1% damage per hit up to 20 stacks | [Carguy, 25 Jun 2026 @32:40](https://youtu.be/HHygBM7jH8Y?t=1960) |
| Annihilation buff lasts 30 seconds | [DiamondFang, 28 Mar 2026 @34:00](https://youtu.be/pNp3M6YehxQ?t=2040) |
| Dragon battleaxe boost is "like 8%" (author explicitly unsure) | [DiamondFang, 28 Mar 2026 @33:27](https://youtu.be/pNp3M6YehxQ?t=2007) |
| Conservation of Energy saves "like 60% adrenaline" | [DiamondFang, 28 Mar 2026 @14:31](https://youtu.be/pNp3M6YehxQ?t=871) |
| Conservation of Energy + passive Ring of Vigour: Overpower costs 40% instead of 60%; ~100% adrenaline saved per rotation | [DiamondFang, 28 Mar 2026 @15:05](https://youtu.be/pNp3M6YehxQ?t=905), 15:40, 17:52 |
| Reaver's ring gives a flat 5% crit chance | [DiamondFang, 28 Mar 2026 @22:49](https://youtu.be/pNp3M6YehxQ?t=1369); [Carguy, 21 Mar 2026 @2:44](https://youtu.be/olCJ8ET-KQw?t=164) |
| All melee abilities unlocked at roughly 83 Attack | [DiamondFang, 28 Mar 2026 @12:49](https://youtu.be/pNp3M6YehxQ?t=769) |
| Cancel channels when the channel bar reads 0.6 seconds | [DiamondFang, 28 Mar 2026 @4:27](https://youtu.be/pNp3M6YehxQ?t=267) |
| Raksha kills average around 115 seconds with this method, can reach the 110s | [Carguy, 21 Mar 2026 @6:05](https://youtu.be/olCJ8ET-KQw?t=365), 06:40 |
| Raksha perks: crackling 4 / relentless 5, impatient 4 / devoted 4, biting 4 / mobile, ultimatums 4 / energizing 2; weapons precise 6 aftershock 1; spear lunging 4 eruptive 2 | [Carguy, 21 Mar 2026 @1:37](https://youtu.be/olCJ8ET-KQw?t=97), 03:50 |

### Contradictions and dated advice

- **Chaos Roar on Overpower.** Carguy (25 Jun 2026) says never do it: the 30k hit cap makes the 1.75x multiplier wasted, and he calls it a mistake he sees people make [Carguy, 25 Jun 2026 @21:20](https://youtu.be/HHygBM7jH8Y?t=1280). DiamondFang (28 Mar 2026), three months earlier, says that at the exact tier where you have a Zuk cape but otherwise budget gear, roaring Overpower may actually be better, that he does not know the threshold, and that he still teaches roaring the Essence of Finality spec to build the right habit [DiamondFang, 28 Mar 2026 @19:31](https://youtu.be/pNp3M6YehxQ?t=1171). These are reconcilable — cap-bound versus not — so a trainer should encode the gear condition rather than a flat rule.
- **Bloodlust switch point between Assault and Greater Flurry.** Carguy puts it at about 60-61% target HP remaining [Carguy, 25 Jun 2026 @17:57](https://youtu.be/HHygBM7jH8Y?t=1077); DiamondFang puts it at 70% [[DiamondFang, 28 Mar 2026 @5:34](https://youtu.be/pNp3M6YehxQ?t=334), 06:42]. Same mechanic, different numbers.
- **Pulverize kill refund.** Carguy: 50% adrenaline [Carguy, 25 Jun 2026 @22:31](https://youtu.be/HHygBM7jH8Y?t=1351). DiamondFang's captions say "ten adrenaline" [DiamondFang, 28 Mar 2026 @11:42](https://youtu.be/pNp3M6YehxQ?t=702). Since he immediately jokes about it being one more adrenaline than Punish would give, his figure is probably a caption error rather than a real disagreement, but neither number should be trusted without checking.
- **Berserk duration.** Carguy is precise: 19.8 seconds base, 26 with four-piece Vestments, past 30 with two Flurries [Carguy, 25 Jun 2026 @24:47](https://youtu.be/HHygBM7jH8Y?t=1487). DiamondFang waves at 20 to 36 seconds and says it does not matter [DiamondFang, 28 Mar 2026 @1:41](https://youtu.be/pNp3M6YehxQ?t=101). DiamondFang separately quantifies three-piece Vestments as +6 seconds [DiamondFang, 28 Mar 2026 @23:55](https://youtu.be/pNp3M6YehxQ?t=1435) — a different set size from Carguy's four-piece, so the two Vestments figures are not directly comparable.
- **Value of the bleeds.** DiamondFang: Dismember is fine outside Berserk, poor inside it; Slaughter and Massacre are generally not worth the adrenaline [DiamondFang, 28 Mar 2026 @9:30](https://youtu.be/pNp3M6YehxQ?t=570). Carguy reports that the update buffed Slaughter (removing the walk-under mechanic) and cut Massacre's adrenaline cost while raising its damage, and treats the spear bleed window as a real if situational tool [[Carguy, 25 Jun 2026 @18:31](https://youtu.be/HHygBM7jH8Y?t=1111), 19:39]. Carguy's video is three months later and describes post-buff numbers; DiamondFang's verdict may predate testing them.
- **ZGS as the between-Berserks filler.** Carguy makes it the default filler in his generic rotation [Carguy, 25 Jun 2026 @37:11](https://youtu.be/HHygBM7jH8Y?t=2231). DiamondFang calls it a budget Berserk and advises against it unless the fight specifically demands reaching a damage window sooner [DiamondFang, 28 Mar 2026 @27:51](https://youtu.be/pNp3M6YehxQ?t=1671).
- **Which ability to bleed after Greater Barge.** DiamondFang: bleed Assault on lower-tier gear, bleed Greater Flurry once gear improves [[DiamondFang, 28 Mar 2026 @16:47](https://youtu.be/pNp3M6YehxQ?t=1007), 26:09]. Carguy bleeds Greater Flurry throughout [[Carguy, 25 Jun 2026 @36:03](https://youtu.be/HHygBM7jH8Y?t=2163); [Carguy, 21 Mar 2026 @8:23](https://youtu.be/olCJ8ET-KQw?t=503)]. Gear-dependent rather than a true conflict.
- **Ek-ZekKil versus Leng swords.** Both agree Ek-ZekKil is the burst weapon, but DiamondFang adds a duration rule: on fights under a minute the Leng swords' passive wins, because the Ek-ZekKil marking spec is nearly wasted damage in the first Berserk [[DiamondFang, 28 Mar 2026 @30:06](https://youtu.be/pNp3M6YehxQ?t=1806), 30:41, 35:07].
- **Dated by patch, explicitly.** Carguy's own earlier melee content is superseded: in the March Raksha video he says he is holding off on a proper DPS guide until magic is re-tuned and the news posts settle [Carguy, 21 Mar 2026 @0:32](https://youtu.be/olCJ8ET-KQw?t=32), and he calls his previous DPS video temporary [[Carguy, 25 Jun 2026 @34:23](https://youtu.be/HHygBM7jH8Y?t=2063), 34:57]. DiamondFang notes the PVME upgrade-order list was not up to date at the time of his video and still carried pre-update opinions [DiamondFang, 28 Mar 2026 @18:25](https://youtu.be/pNp3M6YehxQ?t=1105). He also states that stalls can no longer be released with spells, only by clicking or target-cycling a target [DiamondFang, 28 Mar 2026 @31:15](https://youtu.be/pNp3M6YehxQ?t=1875) — a changed mechanic that older guides will get wrong.
- **Perks: biting versus equilibrium.** DiamondFang reports an unsettled high-end debate, leans very slightly to equilibrium, and gives the practical split: biting for hybrid (melee-range or melee-mage), equilibrium for melee camping; claws favour equilibrium, dagger favours biting [[DiamondFang, 28 Mar 2026 @10:03](https://youtu.be/pNp3M6YehxQ?t=603), 21:41, 22:15]. Carguy states outright that he does nothing with equilibrium and excludes it from his guide, while noting the dagger becomes near-useless on such a build [Carguy, 25 Jun 2026 @30:57](https://youtu.be/HHygBM7jH8Y?t=1857).
- **Terms that could not be resolved.** Several caption garbles resisted normalisation and are recorded rather than guessed: "smash" as an ability in DiamondFang's tier-3 rotation [DiamondFang, 28 Mar 2026 @20:37](https://youtu.be/pNp3M6YehxQ?t=1237) (no such ability appears in the book either video describes); "sun cane" as the Chaos Roar target when you have no Essence of Finality [DiamondFang, 28 Mar 2026 @10:36](https://youtu.be/pNp3M6YehxQ?t=636) (Hurricane fits the sentence, but this is inference); "treat the cannon assault" [DiamondFang, 28 Mar 2026 @20:37](https://youtu.be/pNp3M6YehxQ?t=1237) (probably a three-tick channelled Assault, given his later explicit "three tick assault" [DiamondFang, 28 Mar 2026 @26:43](https://youtu.be/pNp3M6YehxQ?t=1603)); and the best-in-slot melee amulet, which Carguy renders as "Amheg" [Carguy, 21 Mar 2026 @3:17](https://youtu.be/olCJ8ET-KQw?t=197) and DiamondFang as "ammy hash" [DiamondFang, 28 Mar 2026 @18:58](https://youtu.be/pNp3M6YehxQ?t=1138) — clearly the same item, name not recoverable from these captions. Carguy's "mercy dagger" [Carguy, 25 Jun 2026 @29:50](https://youtu.be/HHygBM7jH8Y?t=1790) and DiamondFang's "V dagger" [DiamondFang, 28 Mar 2026 @19:31](https://youtu.be/pNp3M6YehxQ?t=1171) refer to the same dagger special used inside the Essence of Finality, but the exact item name is not stated unambiguously in either video.

---

## Ranged

*Everything counts hit splats: adrenaline, damage buffs and Perfect Equilibrium stacks.*


Sources (all citations use the video id + timestamp):

| id | author | title | date |
|---|---|---|---|
| PV46uTqg5Mg | Carguy | how I use RANGED in EoC 2.0 (DPS Guide) | 2026-07-07 |
| vQ4ExELCJF4 | DiamondFang | Complete Ranged PVM Guide | 2026-04-06 |
| mOJhIsPl9GA | Wings of Absurdity | A Guide to New Endgame Ranged | 2026-03-18 |
| OfXWmwLuEmY | Wings of Absurdity | Ranged Special Attacks Guide | 2026-04-06 |
| hkVUiN856S8 | Carguy | people thought RANGED was DEAD | 2026-03-15 |
| O1Fx1I4HO5w | Hexed Titan | Ranged for Dummies | 2026-06-10 |
| 3UzITrjpTIw | Qp RS | Updated Ranged Revolution Bar Guide 2026 | 2026-03-28 |
| joHe24sEaDY | Wings of Absurdity | Ranged Gear Progression 2026 | 2026-07-25 |
| aGRV825noAo | Protoxx | A guide to leveling Ranged Combat 1-99 | 2026-06-29 |
| _rXrl_xgwzs | Wings of Absurdity | Random Combat Tips for Ranged | 2026-04-24 |

Transcription notes: these are auto-captions. "grico / gree co / rico / quick bow / Quigley / quicken / Greek all / GCO" all normalise to **Greater Ricochet**; "bolg / bulk / bold / bolt / box / both the last guardian" = **Bow of the Last Guardian (BoLG)**; "g dead swift / death swiftness / swift / death's wardness" = **(Greater) Death's Swiftness**; "gale / gail / gill shot" = **Galeshot**; "imbue shadows / imbued shadow" = **Imbue: Shadows**; "desperado / death spore / deathpour / death's war / death ward" arrows = **Deathspore arrows**; "when / one / win / wind arrows" = **Wen arrows**; "full / ful arrows" = **Ful arrows**; "EOF / essence of felicity / essence of fanatic" = **Essence of Finality**; "Elite Reckoning / Draco Lich / Drakolith" = **(Elite) Dracolich armour**; "Zuk / Zach / Zack / sag cape" = **Igneous/Zuk cape**.

---

### Ability by ability

#### Ranged (basic attack / auto attack)
- **Class:** basic. 100% damage, one hit [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96).
- **What it is for:** free filler on the global cooldown; no extra cooldown of its own, so it can be pressed every GCD (3 ticks / 1.8 s) [Carguy, 7 Jul 2026 @2:16](https://youtu.be/PV46uTqg5Mg?t=136). Carguy misstates a game tick as "6 seconds" at that timestamp; 1.8 s per GCD is the figure he actually uses.
- **When to press:** only when you need a cheap +1 BoLG stack, need to build Wen/Deathspore stacks, or are out of everything else. Wings deliberately avoids autos and Piercing Shot inside Death's Swiftness unless Wen arrows force it [Wings of Absurdity, 18 Mar 2026 @7:49](https://youtu.be/mOJhIsPl9GA?t=469).
- **Combos:** Hexed Titan's "auto into Gloomfire" loop — an auto puts you back on 1 BoLG stack so the Gloomfire big hit lands on the proc [Hexed Titan, 10 Jun 2026 @15:13](https://youtu.be/O1Fx1I4HO5w?t=913).
- **Revolution:** it is the implicit fallback; Qp's level-1 bar is empty and revolution auto-fires it [Qp RS, 28 Mar 2026 @3:26](https://youtu.be/3UzITrjpTIw?t=206).
- **Mistake called out:** spamming it as your damage plan. Carguy: don't do that unless it is literally all you have [Carguy, 7 Jul 2026 @2:51](https://youtu.be/PV46uTqg5Mg?t=171).

#### Piercing Shot
- **Class:** basic. Two hits, 45–55% ranged damage each, generates 9 adrenaline [Carguy, 7 Jul 2026 @2:51](https://youtu.be/PV46uTqg5Mg?t=171); Hexed lists it as 100% over two hits [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96).
- **What it is for:** cheap +2 BoLG stacks and Snipe cooldown reduction. Every cast cuts Snipe's cooldown (2.4 s per Carguy [Carguy, 7 Jul 2026 @3:26](https://youtu.be/PV46uTqg5Mg?t=206); 5 s per Hexed Titan [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96) — see contradictions).
- **When to press:** to line up BoLG stacks, and outside Death's Swiftness while building Deathspore stacks. DiamondFang calls it the second-best basic and a fine filler once Greater Ricochet has been used [DiamondFang, 6 Apr 2026 @7:53](https://youtu.be/vQ4ExELCJF4?t=473).
- **Combos:** Piercing → Greater Ricochet → Piercing is the canonical Deathspore builder; with the extra BoLG-proc hit it reaches the 12 stacks needed [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575), [Hexed Titan, 10 Jun 2026 @16:56](https://youtu.be/O1Fx1I4HO5w?t=1016), [Carguy, 15 Mar 2026 @14:36](https://youtu.be/hkVUiN856S8?t=876). Piercing (2 stacks) → Dark Bow (2 hits) is Hexed's beginner stack loop [Hexed Titan, 10 Jun 2026 @13:35](https://youtu.be/O1Fx1I4HO5w?t=815).
- **Revolution:** yes, low priority — after Snipe, before Snapshot on Qp's single-target bar [Qp RS, 28 Mar 2026 @4:36](https://youtu.be/3UzITrjpTIw?t=276); ninth of ten on the final level-90 bar [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686). Excluded from the AoE bar because it does not benefit from the Invigorating perk's extra adrenaline [Qp RS, 28 Mar 2026 @5:43](https://youtu.be/3UzITrjpTIw?t=343).
- **Mistakes:** using it inside a buff window. Wings only falls back to it when a boss is unattackable, when finishing something off, or when his reflexes fail [Wings of Absurdity, 18 Mar 2026 @18:38](https://youtu.be/mOJhIsPl9GA?t=1118). He was forced into one at Vorago after getting greedy with Snapshot [Wings of Absurdity, 18 Mar 2026 @15:41](https://youtu.be/mOJhIsPl9GA?t=941).

#### Galeshot
- **Class:** basic. Single hit, damage equal to a basic attack [Carguy, 7 Jul 2026 @5:07](https://youtu.be/PV46uTqg5Mg?t=307), [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96); +1 BoLG stack [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240).
- **What it is for:** the "searing winds" self buff that adds bonus damage **per hit splat**, so it scales with multi-hit abilities [Wings of Absurdity, 18 Mar 2026 @5:37](https://youtu.be/mOJhIsPl9GA?t=337), [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240). Magnitude is stated three different ways (see contradictions): flat +465 per hit for 6 s [Carguy, 7 Jul 2026 @5:07](https://youtu.be/PV46uTqg5Mg?t=307); +20% per hit splat for the next three abilities, four if Rapid Fire is one of them [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96); +10% for the next few abilities [Qp RS, 28 Mar 2026 @7:26](https://youtu.be/3UzITrjpTIw?t=446).
- **When to press:** immediately before Rapid Fire, always. Rapid Fire extends the buff (each Rapid Fire hit adds 6 s per Carguy [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612)), so Rapid Fire effectively gets the buff for free [DiamondFang, 6 Apr 2026 @4:33](https://youtu.be/vQ4ExELCJF4?t=273).
- **Combos:** Galeshot → Rapid Fire → Deadshot → Gloomfire → SGB is Hexed's "make the most of Galeshot" line [Hexed Titan, 10 Jun 2026 @16:56](https://youtu.be/O1Fx1I4HO5w?t=1016). DiamondFang, in low-gear rotations, puts Galeshot **before** Greater Ricochet so Gale buffs Rico's seven hits [DiamondFang, 6 Apr 2026 @16:50](https://youtu.be/vQ4ExELCJF4?t=1010) — he notes this ordering changes in endgame rotations.
- **Target count per DS window:** two Galeshots per Death's Swiftness [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240), [Wings of Absurdity, 18 Mar 2026 @8:58](https://youtu.be/mOJhIsPl9GA?t=538).
- **Revolution:** yes, high — first on Qp's bar at unlock and fourth on the final bar (after DS, Imbue: Shadows, Greater Ricochet) [Qp RS, 28 Mar 2026 @7:26](https://youtu.be/3UzITrjpTIw?t=446), [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686). Also on the AoE bar.
- **Mistakes:** Wings admits skipping a Galeshot that was off cooldown at Kerapac and calls it out as a loss [Wings of Absurdity, 18 Mar 2026 @13:27](https://youtu.be/mOJhIsPl9GA?t=807); he also deliberately skips the first Galeshot at Vorago to prioritise two SGB specs [Wings of Absurdity, 18 Mar 2026 @15:08](https://youtu.be/mOJhIsPl9GA?t=908).
- **Trick:** stall a Galeshot and release it with Rapid Fire — extends the Galeshot buff by one ability [DiamondFang, 6 Apr 2026 @34:01](https://youtu.be/vQ4ExELCJF4?t=2041).

#### Binding Shot
- **Class:** basic (utility in practice). 70% damage, one hit, stuns and binds [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128).
- **What it is for:** the only ranged stun. Two charges, 15 s cooldown, and the charges regenerate independently — pressing them 5 s apart means only 10 s until the next one, and the second charge rebuilds after that [Carguy, 7 Jul 2026 @3:26](https://youtu.be/PV46uTqg5Mg?t=206).
- **When to press:** mechanics only — making something attackable, killing the Sanctum of Rebirth scarabs [Carguy, 7 Jul 2026 @4:34](https://youtu.be/PV46uTqg5Mg?t=274), [DiamondFang, 6 Apr 2026 @8:25](https://youtu.be/vQ4ExELCJF4?t=505). Wings notes two Binding Shots are usually enough that the Strykebow stun spec is redundant [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172).
- **Combos:** Carguy speculates it works with the Flanking perk but has not confirmed it and asks viewers to test [Carguy, 7 Jul 2026 @4:00](https://youtu.be/PV46uTqg5Mg?t=240) — treat as unverified.
- **Revolution:** never. It is less damage than an auto attack [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128), [Qp RS, 28 Mar 2026 @5:09](https://youtu.be/3UzITrjpTIw?t=309).

#### Ricochet / Greater Ricochet
- **Class:** basic. Ricochet 115% over three hits (1 + 2); Greater Ricochet 135% over seven hits (1 + 6) [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128).
- **What it is for:** adrenaline. Under Imbue: Shadows, seven hits return 35 adrenaline, or 40 if a BoLG proc adds a hit [DiamondFang, 6 Apr 2026 @2:54](https://youtu.be/vQ4ExELCJF4?t=174). DiamondFang calls the Greater Ricochet codex the first big unlock on a ranged account [DiamondFang, 6 Apr 2026 @5:40](https://youtu.be/vQ4ExELCJF4?t=340); Wings recommends it right after the Sun key in the gear path [Wings of Absurdity, 25 Jul 2026 @10:41](https://youtu.be/joHe24sEaDY?t=641).
- **How the AoE works:** it fires seven hit splats; each nearby secondary target siphons one, and the remainder land on the main target — three dummies means five splats on the main and one each on the others [Carguy, 7 Jul 2026 @5:41](https://youtu.be/PV46uTqg5Mg?t=341).
- **When to press:** whenever adrenaline runs dry. Wings: one Greater Ricochet is usually enough to get going again, and you rely on it "at all costs" to recover adrenaline [Wings of Absurdity, 18 Mar 2026 @7:16](https://youtu.be/mOJhIsPl9GA?t=436), [Wings of Absurdity, 18 Mar 2026 @10:39](https://youtu.be/mOJhIsPl9GA?t=639). Also as a BoLG stack manipulator: it is −1 on the counter, so from 0 stacks it lands you on 3, setting up Snipe [DiamondFang, 6 Apr 2026 @23:32](https://youtu.be/vQ4ExELCJF4?t=1412).
- **Combos:** stall a Greater Ricochet outside attack range, then release it into a second Greater Ricochet on the real target to instantly reach Deathspore stacks pre-fight [Carguy, 7 Jul 2026 @36:36](https://youtu.be/PV46uTqg5Mg?t=2196), [Carguy, 15 Mar 2026 @12:22](https://youtu.be/hkVUiN856S8?t=742), [DiamondFang, 6 Apr 2026 @26:49](https://youtu.be/vQ4ExELCJF4?t=1609). Greater Ricochet **before** the BoLG spec so the Rico hits themselves get doubled by the proc [DiamondFang, 6 Apr 2026 @22:24](https://youtu.be/vQ4ExELCJF4?t=1344).
- **Revolution:** yes, high — third on Qp's final single-target bar and on the AoE bar, placed after Galeshot so Gale modifies Rico rather than a basic [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686), [Qp RS, 28 Mar 2026 @9:08](https://youtu.be/3UzITrjpTIw?t=548).
- **Change to note:** it now fires seven hits by default; Caroming used to add the extra hits and now only adds damage to the secondary hits [Carguy, 7 Jul 2026 @5:41](https://youtu.be/PV46uTqg5Mg?t=341).

#### Snapshot
- **Class:** enhanced. Two hits of 135–155% each, 25% adrenaline, no cooldown beyond the GCD [Carguy, 7 Jul 2026 @6:48](https://youtu.be/PV46uTqg5Mg?t=408); 290% average per Wings and Hexed [Wings of Absurdity, 6 Apr 2026 @0:36](https://youtu.be/OfXWmwLuEmY?t=36), [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160).
- **What it is for:** the baseline adrenaline dump and the yardstick every EoF is measured against — Wings' bottom tier is literally "anything worse than Snapshot" [Wings of Absurdity, 6 Apr 2026 @0:36](https://youtu.be/OfXWmwLuEmY?t=36).
- **When to press:** when you have adrenaline and no better button, or when your reflexes cannot manage an EoF switch — Wings explicitly defaults to Snapshot at bosses like the Magister [Wings of Absurdity, 6 Apr 2026 @18:09](https://youtu.be/OfXWmwLuEmY?t=1089), [Wings of Absurdity, 18 Mar 2026 @7:49](https://youtu.be/mOJhIsPl9GA?t=469).
- **Combos:** +2 BoLG stacks, so from 3 stacks a Snapshot procs and leaves you at 1 — perfect Gloomfire setup [Hexed Titan, 10 Jun 2026 @16:20](https://youtu.be/O1Fx1I4HO5w?t=980). Good for lining up a BoLG proc's third hit inside Death's Swiftness [Carguy, 7 Jul 2026 @7:23](https://youtu.be/PV46uTqg5Mg?t=443).
- **Revolution:** yes, but **last** — Qp puts it at the bottom of every single-target bar precisely because you rarely sit at 100% adrenaline, so it never loses hits by being low priority [Qp RS, 28 Mar 2026 @4:01](https://youtu.be/3UzITrjpTIw?t=241), [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686).
- **Mistakes:** DiamondFang says it gets left behind in the endgame by weapon specials and amulet swapping [DiamondFang, 6 Apr 2026 @7:19](https://youtu.be/vQ4ExELCJF4?t=439); Wings notes getting greedy on Snapshot cost him the adrenaline for a Vorago SGB [Wings of Absurdity, 18 Mar 2026 @15:41](https://youtu.be/mOJhIsPl9GA?t=941).

#### Snipe
- **Class:** enhanced. One hit of 300–360% [Carguy, 7 Jul 2026 @7:56](https://youtu.be/PV46uTqg5Mg?t=476); 330% per Hexed [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195). Neither costs nor generates adrenaline. 1 minute cooldown.
- **What it is for:** a nuke / phase finisher. It is now a 3-tick ability instead of 4-tick, which removed the old flow-breaking charge-up; Carguy says he almost never pressed it before EoC 2.0 and now uses it regularly [Carguy, 7 Jul 2026 @8:29](https://youtu.be/PV46uTqg5Mg?t=509).
- **When to press:** on **3 BoLG stacks** with the spec active, so it is the hit that gets doubled — DiamondFang quotes roughly 60k [DiamondFang, 6 Apr 2026 @6:46](https://youtu.be/vQ4ExELCJF4?t=406), [Hexed Titan, 10 Jun 2026 @11:52](https://youtu.be/O1Fx1I4HO5w?t=712).
- **Cooldown reduction:** Piercing Shot cuts it; Fleeting boots reduce it a further 1.8 s per basic ability [Carguy, 7 Jul 2026 @8:29](https://youtu.be/PV46uTqg5Mg?t=509). Wings notes the Fleeting route forces you to spam Piercing Shot, which has poor synergy with the core buffs [Wings of Absurdity, 18 Mar 2026 @22:34](https://youtu.be/mOJhIsPl9GA?t=1354).
- **Revolution:** yes, high priority — Qp places it ahead of Snapshot and Piercing Shot because delay wastes its 1-minute cooldown, whereas Snapshot loses nothing from being lower [Qp RS, 28 Mar 2026 @4:01](https://youtu.be/3UzITrjpTIw?t=241); sixth on the final bar [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686).
- **Disagreement:** Wings prefers Snipe **outside** Death's Swiftness — it is channelled, single-hit, does not scale with hit-splat buffs, and can hit damage caps during DS [Wings of Absurdity, 18 Mar 2026 @21:27](https://youtu.be/mOJhIsPl9GA?t=1287). Carguy, DiamondFang and Hexed all place it inside the DS window on 3 stacks [Carguy, 7 Jul 2026 @38:51](https://youtu.be/PV46uTqg5Mg?t=2331), [DiamondFang, 6 Apr 2026 @32:23](https://youtu.be/vQ4ExELCJF4?t=1943), [Hexed Titan, 10 Jun 2026 @10:12](https://youtu.be/O1Fx1I4HO5w?t=612).
- **Niche:** with Nightmare gauntlets, flanking (attacking from the side or behind) boosts Snipe by roughly 50% and generates an extra arrow with another BoLG stack; DiamondFang says the Dracolich buff has made this uncommon in current rotations [DiamondFang, 6 Apr 2026 @6:46](https://youtu.be/vQ4ExELCJF4?t=406).

#### Rapid Fire
- **Class:** enhanced. Channelled, one arrow per game tick for 8 ticks, 8 hits of 75–85% each [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612); 640% total per Hexed [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160). Net 0 on the BoLG counter (8 hits = one full cycle) [DiamondFang, 6 Apr 2026 @4:33](https://youtu.be/vQ4ExELCJF4?t=273).
- **What it is for:** the adrenaline engine and the crit-window opener. Under Imbue: Shadows an 8-hit channel returns 40 adrenaline by itself [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778). With the full 5-piece Dracolich set it also generates 2.5% adrenaline per hit [Carguy, 7 Jul 2026 @33:46](https://youtu.be/PV46uTqg5Mg?t=2026).
- **When to press:** immediately after Galeshot, every time — each Rapid Fire hit extends searing winds [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612), [DiamondFang, 6 Apr 2026 @4:33](https://youtu.be/vQ4ExELCJF4?t=273). Two per Death's Swiftness is the standard goal [Wings of Absurdity, 18 Mar 2026 @8:58](https://youtu.be/mOJhIsPl9GA?t=538).
- **The payoff window:** fully channelling all 8 hits grants +40% crit chance afterwards — 3 s (≈2 GCDs) with a 3-piece Dracolich set, extended 1.8 s each by pieces 4 and 5 for ≈4 GCDs at full set [Carguy, 7 Jul 2026 @34:21](https://youtu.be/PV46uTqg5Mg?t=2061), [DiamondFang, 6 Apr 2026 @30:11](https://youtu.be/vQ4ExELCJF4?t=1811), [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160). Dump your biggest abilities into that window.
- **Combos:** Galeshot → Rapid Fire → Deadshot / Gloomfire / SGB. Wings times Rapid Fire's crit buff into SGB on 4x4+ targets [Wings of Absurdity, 18 Mar 2026 @14:35](https://youtu.be/mOJhIsPl9GA?t=875).
- **Movement:** you can now walk during the channel [Carguy, 15 Mar 2026 @14:36](https://youtu.be/hkVUiN856S8?t=876), but movement abilities (Escape, Surge, Dive) cancel it, as does pressing another ability too early [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160).
- **Free actions during the channel (Wings' tips):** eat a solid food (adrenaline dips to 97% then snaps back to 100% while Imbue: Shadows is running), spawn a Dreadnip, drink a summoning flask, throw Ripper demon or Hellhound scrolls, and — most importantly — pre-equip your next EoF [Wings of Absurdity, 24 Apr 2026 @0:33](https://youtu.be/_rXrl_xgwzs?t=33), [Wings of Absurdity, 24 Apr 2026 @1:09](https://youtu.be/_rXrl_xgwzs?t=69), [Wings of Absurdity, 6 Apr 2026 @15:54](https://youtu.be/OfXWmwLuEmY?t=954).
- **Revolution:** yes, high — second on Qp's single-target bar at unlock and fifth on the final bar; kept **off** the AoE bar unless using chinchompas [Qp RS, 28 Mar 2026 @8:02](https://youtu.be/3UzITrjpTIw?t=482).
- **Trick (bug):** with ability queuing on, an ability queued on the same tick as Rapid Fire fires one tick early and still gets the full Rapid Fire benefit; DiamondFang refuses to use it because it requires ability queuing [DiamondFang, 6 Apr 2026 @37:23](https://youtu.be/vQ4ExELCJF4?t=2243).

#### Shadow Tendrils
- **Class:** enhanced. One hit of 200–240% [Carguy, 7 Jul 2026 @11:53](https://youtu.be/PV46uTqg5Mg?t=713); 220%, effectively 330% because it always crits, except on an Equilibrium build [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234). 45 s cooldown. Damages you.
- **What it is for:** extending Imbue: Shadows by 3.6 s (one extra ability's worth) and delivering one very large single hit [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745), [Wings of Absurdity, 18 Mar 2026 @6:44](https://youtu.be/mOJhIsPl9GA?t=404), [Hexed Titan, 10 Jun 2026 @4:29](https://youtu.be/O1Fx1I4HO5w?t=269).
- **When to press:** on **3 BoLG stacks** so the proc doubles it [Hexed Titan, 10 Jun 2026 @11:52](https://youtu.be/O1Fx1I4HO5w?t=712), [DiamondFang, 6 Apr 2026 @21:49](https://youtu.be/vQ4ExELCJF4?t=1309); once per Death's Swiftness as a baseline goal [Wings of Absurdity, 18 Mar 2026 @8:58](https://youtu.be/mOJhIsPl9GA?t=538). With Imbue: Shadows and Tendrils together, Carguy gets Imbue up to 33.6 s of duration [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778).
- **When to skip:** if survivability is a problem [Wings of Absurdity, 18 Mar 2026 @6:44](https://youtu.be/mOJhIsPl9GA?t=404), or when the boss is nearly dead — no point extending a buff timer [Wings of Absurdity, 18 Mar 2026 @19:43](https://youtu.be/mOJhIsPl9GA?t=1183). DiamondFang notes it is awkward on an Equilibrium build since it always crits anyway [DiamondFang, 6 Apr 2026 @6:14](https://youtu.be/vQ4ExELCJF4?t=374).
- **Combos:** DiamondFang prefers Tendrils **then** Gloomfire over the reverse, even off-stacks, though he admits he did not calculate it for best-in-slot crit chance [DiamondFang, 6 Apr 2026 @23:32](https://youtu.be/vQ4ExELCJF4?t=1412). Stall a Greater Ricochet and release with Tendrils to force both BoLG procs onto the Tendrils hit [DiamondFang, 6 Apr 2026 @35:42](https://youtu.be/vQ4ExELCJF4?t=2142).
- **Revolution:** yes, mid — Qp adds it at level 75 after Ricochet, and it sits eighth on the final bar [Qp RS, 28 Mar 2026 @9:45](https://youtu.be/3UzITrjpTIw?t=585), [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686).
- **Mistake:** Carguy has killed himself with it while pushing the Zerker's Fury relic [Carguy, 7 Jul 2026 @11:53](https://youtu.be/PV46uTqg5Mg?t=713); DiamondFang says self-damage abilities are worth learning to live with because faster kills mean less incoming damage overall [DiamondFang, 6 Apr 2026 @6:14](https://youtu.be/vQ4ExELCJF4?t=374).

#### Imbue: Shadows
- **Class:** enhanced (self buff). 5% adrenaline per ranged hit splat for 30 s; costs 40% adrenaline [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745), [Hexed Titan, 10 Jun 2026 @4:29](https://youtu.be/O1Fx1I4HO5w?t=269), [Qp RS, 28 Mar 2026 @10:53](https://youtu.be/3UzITrjpTIw?t=653).
- **What it is for:** it is the reason ranged is built around multi-hit abilities — more hit splats means more adrenaline means more abilities [Wings of Absurdity, 18 Mar 2026 @5:02](https://youtu.be/mOJhIsPl9GA?t=302). It replaced Incendiary Shot and moved adrenaline gain off crit chance onto a flat per-hit return [Carguy, 15 Mar 2026 @1:42](https://youtu.be/hkVUiN856S8?t=102).
- **When to press:** immediately after Death's Swiftness in essentially every opener [DiamondFang, 6 Apr 2026 @5:08](https://youtu.be/vQ4ExELCJF4?t=308); it can be cast out of combat, so Wings casts it during the boss's spawn animation before the fight starts [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745), [Wings of Absurdity, 18 Mar 2026 @9:33](https://youtu.be/mOJhIsPl9GA?t=573).
- **Extended by:** Shadow Tendrils (+3.6 s each) [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745).
- **Interactions:** a BoLG perfect-equilibrium proc grants an extra 5% adrenaline while Imbue: Shadows is up [Wings of Absurdity, 6 Apr 2026 @6:51](https://youtu.be/OfXWmwLuEmY?t=411). Corruption Shot does **not** generate a hit, so it returns nothing [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539).
- **Revolution:** yes, second only to Death's Swiftness on Qp's level-90 bar — and only worth adding if you have Greater Ricochet [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686). Qp claims it can restore 100% adrenaline with Natural Instinct and adrenaline-boosting equipment [Qp RS, 28 Mar 2026 @10:53](https://youtu.be/3UzITrjpTIw?t=653).

#### Corruption Shot
- **Class:** enhanced (Mazcab codex). 300% as damage over time [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195). 15 s cooldown. Adrenaline cost disputed: 20% [Carguy, 7 Jul 2026 @13:32](https://youtu.be/PV46uTqg5Mg?t=812) vs 25% [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539).
- **What changed:** the main target no longer needs to be touching the others — it now searches up to 5 tiles for up to five additional enemies, similar to Greater Ricochet's six [Carguy, 7 Jul 2026 @13:32](https://youtu.be/PV46uTqg5Mg?t=812).
- **What the videos say now:** it is strictly an AoE ability and a weak one. It does not count as a hit for BoLG stacks [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195) and generates no hits for Imbue: Shadows [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539). It cannot crit [Qp RS, 28 Mar 2026 @9:08](https://youtu.be/3UzITrjpTIw?t=548). DiamondFang's advice: if you are thinking about pressing it, press something else [DiamondFang, 6 Apr 2026 @9:32](https://youtu.be/vQ4ExELCJF4?t=572). Carguy keeps it on his bar but rarely presses it [Carguy, 7 Jul 2026 @14:06](https://youtu.be/PV46uTqg5Mg?t=846).
- **Where it survives:** low-level AFK training and slayer XP/hr [Protoxx, 29 Jun 2026 @11:02](https://youtu.be/aGRV825noAo?t=662), and Qp's AoE revolution bar (third, after Galeshot and Greater Ricochet) [Qp RS, 28 Mar 2026 @9:08](https://youtu.be/3UzITrjpTIw?t=548). Never on a single-target bar.

#### Bombardment
- **Class:** enhanced. 240% AoE in a 5x5 area (2 tiles around the target, up from 1), counts as one hit per mob struck, 25% adrenaline [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195), [Carguy, 7 Jul 2026 @9:39](https://youtu.be/PV46uTqg5Mg?t=579), [Protoxx, 29 Jun 2026 @6:04](https://youtu.be/aGRV825noAo?t=364).
- **What it is for:** immediate AoE damage. DiamondFang prefers it over Corruption Shot because it generates hits (adrenaline back under Imbue: Shadows) and immediate damage always beats DoT, which most modifiers do not buff [DiamondFang, 6 Apr 2026 @9:32](https://youtu.be/vQ4ExELCJF4?t=572).
- **When to press:** wiping low-HP groups; once as a finisher when committing Decimation would be overkill [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612), [Wings of Absurdity, 18 Mar 2026 @23:41](https://youtu.be/mOJhIsPl9GA?t=1421).
- **Revolution:** yes, on AoE bars only — the whole low-level AoE bar at unlock, and last on Qp's endgame AoE bar [Qp RS, 28 Mar 2026 @5:43](https://youtu.be/3UzITrjpTIw?t=343), [Qp RS, 28 Mar 2026 @12:02](https://youtu.be/3UzITrjpTIw?t=722). A key early training ability [Protoxx, 29 Jun 2026 @6:04](https://youtu.be/aGRV825noAo?t=364).
- **Ceiling:** once you have the Decimation EoF, Bombardment is a backup [Wings of Absurdity, 18 Mar 2026 @23:41](https://youtu.be/mOJhIsPl9GA?t=1421); Carguy calls it still pretty bad but at least usable now [Carguy, 7 Jul 2026 @9:39](https://youtu.be/PV46uTqg5Mg?t=579).

#### Deadshot
- **Class:** ultimate. 60% adrenaline base regardless of cape [Carguy, 7 Jul 2026 @14:39](https://youtu.be/PV46uTqg5Mg?t=879). Without a Zuk cape: 4 hits, 460%; with it: 8 hits, 520% [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234), [Carguy, 7 Jul 2026 @14:39](https://youtu.be/PV46uTqg5Mg?t=879).
- **BoLG interaction:** 8 hits is exactly one full cycle, so it is **+0** on the stack counter — pressing it does not change your stack count [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240). With the BoLG spec active (4-stack threshold) the same 8 hits proc perfect equilibrium **twice** [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240), [Wings of Absurdity, 6 Apr 2026 @6:16](https://youtu.be/OfXWmwLuEmY?t=376), [Wings of Absurdity, 18 Mar 2026 @6:44](https://youtu.be/mOJhIsPl9GA?t=404).
- **When to press:** inside Death's Swiftness, inside the Galeshot buff, after a fully-channelled Rapid Fire for the crit window, and with the BoLG spec already up. Once per DS in most rotations; twice is possible [DiamondFang, 6 Apr 2026 @3:27](https://youtu.be/vQ4ExELCJF4?t=207). Carguy: with no buffs it is strong but not remarkable; it comes alive when everything is stacked [Carguy, 7 Jul 2026 @15:12](https://youtu.be/PV46uTqg5Mg?t=912).
- **Adrenaline note:** because of the hit count, Hexed says it nets +5% adrenaline under Imbue: Shadows, or +10% with the BoLG spec active [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234); Wings says he barely lost any adrenaline using it under those buffs [Wings of Absurdity, 18 Mar 2026 @10:06](https://youtu.be/mOJhIsPl9GA?t=606).
- **Revolution:** yes, mid-high on the endgame bar (seventh, after Snipe) [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686); leave it off low-level bars because you will not have the adrenaline [Qp RS, 28 Mar 2026 @5:09](https://youtu.be/3UzITrjpTIw?t=309).
- **Trick:** Deadshot can be stalled and released pre-fight instead of Greater Ricochet for a free Death's Swiftness plus more damage on P1 [DiamondFang, 6 Apr 2026 @26:49](https://youtu.be/vQ4ExELCJF4?t=1609), [Carguy, 15 Mar 2026 @12:55](https://youtu.be/hkVUiN856S8?t=775).

#### Death's Swiftness / Greater Death's Swiftness
- **Class:** ultimate. 1.5x ranged damage — a flat +50% to everything [Carguy, 7 Jul 2026 @16:52](https://youtu.be/PV46uTqg5Mg?t=1012). Duration: 30.6 s, +6.6 s from Greater DS or a planted-feet switch [DiamondFang, 6 Apr 2026 @2:20](https://youtu.be/vQ4ExELCJF4?t=140); Hexed says 30 s up to 37.8 s [Hexed Titan, 10 Jun 2026 @4:29](https://youtu.be/O1Fx1I4HO5w?t=269); the planted-feet switch is described as +7 s [DiamondFang, 6 Apr 2026 @16:16](https://youtu.be/vQ4ExELCJF4?t=976), [Wings of Absurdity, 25 Jul 2026 @8:59](https://youtu.be/joHe24sEaDY?t=539).
- **What changed:** it is now a **self buff**, not a placed 7x7 area — you can run anywhere and keep it [Carguy, 7 Jul 2026 @16:17](https://youtu.be/PV46uTqg5Mg?t=977). Carguy believes it carries from Telos P4 to P5; he says one other boss wipes all buffs, but the transcript garbles its name ("Raia") so I cannot say which [Carguy, 7 Jul 2026 @16:17](https://youtu.be/PV46uTqg5Mg?t=977). Wings credits the mobility for a master timer at hard mode Kerapac [Wings of Absurdity, 18 Mar 2026 @14:01](https://youtu.be/mOJhIsPl9GA?t=841).
- **What it is for:** it is the whole rotation clock. Press it every minute on the minute and build everything else around the window [Carguy, 7 Jul 2026 @15:45](https://youtu.be/PV46uTqg5Mg?t=945). Between windows your only goal is to get back to the next one with the adrenaline to press it [DiamondFang, 6 Apr 2026 @28:30](https://youtu.be/vQ4ExELCJF4?t=1710).
- **Goals inside one window (Wings' baseline):** two Rapid Fires, one Shadow Tendrils, one Deadshot, two Galeshots [Wings of Absurdity, 18 Mar 2026 @8:58](https://youtu.be/mOJhIsPl9GA?t=538).
- **Getting it for free:** Deathspore arrows (12 stacks) make the next ability cost no adrenaline, and 99% of the time that ability is Death's Swiftness [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575). Alternatively, activate it at the crystal in Wars Retreat and walk in with adrenaline restored [DiamondFang, 6 Apr 2026 @26:49](https://youtu.be/vQ4ExELCJF4?t=1609).
- **Revolution:** first on Qp's single-target bar from level 76 onward; excluded from the AoE bar until Imbue: Shadows makes it sustainable [Qp RS, 28 Mar 2026 @10:19](https://youtu.be/3UzITrjpTIw?t=619), [Qp RS, 28 Mar 2026 @12:02](https://youtu.be/3UzITrjpTIw?t=722).
- **Mistake called out:** building Deathspore stacks too early, so they expire before Death's Swiftness comes off cooldown — watch the DS timer while stacking [Wings of Absurdity, 18 Mar 2026 @11:47](https://youtu.be/mOJhIsPl9GA?t=707).

#### Escape (utility)
- Requires only 5 Agility, does no damage; with a bow equipped it moves you 8 tiles backwards instead of the default 7 [Carguy, 7 Jul 2026 @1:42](https://youtu.be/PV46uTqg5Mg?t=102). It cancels a Rapid Fire channel [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160).

#### Quiver switch abilities (utility)
- The Pernix quiver adds two abilities so each stored ammo type can be individually keybound; Carguy just binds the quiver itself [Carguy, 7 Jul 2026 @2:16](https://youtu.be/PV46uTqg5Mg?t=136). Wings places them reversed on his bar to mirror the quiver's visual layout, and now mostly just hovers the quiver [Wings of Absurdity, 24 Apr 2026 @3:22](https://youtu.be/_rXrl_xgwzs?t=202). The quiver also adds minor damage against targets below 25% health (transcript says "25 HP") [Hexed Titan, 10 Jun 2026 @9:40](https://youtu.be/O1Fx1I4HO5w?t=580).

#### Bow of the Last Guardian passive — Perfect Equilibrium (not an ability, but the core mechanic)
- Every ranged hit except bleed damage adds a stack; at **8 stacks** it consumes them all and adds an extra hit derived from the hit that triggered it [Carguy, 7 Jul 2026 @17:59](https://youtu.be/PV46uTqg5Mg?t=1079). Wings gives the numbers: the proc deals 12–16% ability damage while the triggering ability contributes 33–37% of its original damage [Wings of Absurdity, 6 Apr 2026 @5:08](https://youtu.be/OfXWmwLuEmY?t=308); Hexed frames it as 40% base + 35% of the used ability, roughly a 50% copy [Hexed Titan, 10 Jun 2026 @5:06](https://youtu.be/O1Fx1I4HO5w?t=306).
- The BoLG **special attack halves the threshold to 4 stacks** and refreshes it [Carguy, 7 Jul 2026 @19:42](https://youtu.be/PV46uTqg5Mg?t=1182), [Wings of Absurdity, 6 Apr 2026 @6:16](https://youtu.be/OfXWmwLuEmY?t=376). This is why "count to four" is the whole skill [Hexed Titan, 10 Jun 2026 @0:29](https://youtu.be/O1Fx1I4HO5w?t=29).
- Practical stack values: auto +1, Piercing Shot +2, Galeshot +1, Snapshot +2, Greater Ricochet −1 (7 hits), Rapid Fire +0 (8 hits), Deadshot +0 with cape, SGB +1 regardless of arrows landed, Gloomfire +3, Dark Bow +2 [[Hexed Titan, 10 Jun 2026 @11:20](https://youtu.be/O1Fx1I4HO5w?t=680) and the cheat sheets at 17:30], [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240), [DiamondFang, 6 Apr 2026 @13:28](https://youtu.be/vQ4ExELCJF4?t=808), [DiamondFang, 6 Apr 2026 @23:32](https://youtu.be/vQ4ExELCJF4?t=1412).
- **Rule:** put your biggest hit on the 4th (or 8th) hit. Snipe, Shadow Tendrils and the BoLG spec itself want **3 stacks**; Gloomfire wants **1 stack** (its third and biggest hit lands on the proc); Dark Bow wants **2 stacks** [Hexed Titan, 10 Jun 2026 @11:52](https://youtu.be/O1Fx1I4HO5w?t=712), [Hexed Titan, 10 Jun 2026 @13:35](https://youtu.be/O1Fx1I4HO5w?t=815), [Hexed Titan, 10 Jun 2026 @14:39](https://youtu.be/O1Fx1I4HO5w?t=879), [DiamondFang, 6 Apr 2026 @21:49](https://youtu.be/vQ4ExELCJF4?t=1309).
- If your stacks are out of position and nothing better is available, pressing the BoLG spec itself resets and re-arms the buff [DiamondFang, 6 Apr 2026 @10:38](https://youtu.be/vQ4ExELCJF4?t=638).
- The spec applies **before** the damage, so the triggering hit gets the doubling [DiamondFang, 6 Apr 2026 @21:14](https://youtu.be/vQ4ExELCJF4?t=1274).
- **Do not put BoLG in an Essence of Finality** — you need it equipped for the passive and its tier-100 damage [Wings of Absurdity, 6 Apr 2026 @5:08](https://youtu.be/OfXWmwLuEmY?t=308).
- History: before the March 2024 combat update the proc copy-pasted a full third hit; it now takes a percentage [Carguy, 7 Jul 2026 @18:32](https://youtu.be/PV46uTqg5Mg?t=1112).

---

### Rotations

All rotations assume Death's Swiftness (Greater, or a planted-feet switch) as the clock and Bow of the Last Guardian equipped unless stated.

#### A. Pre-fight opener (any gear with Greater Ricochet + Deathspore arrows)
Assumes: Pernix quiver with Deathspore + Ful arrows; a stallable target (combat dummy or nearby mob).
1. Equip Deathspore arrows.
2. Stand outside attack range of a dummy and press Greater Ricochet — your character wants to run in; click away instead. The ability is now stalled [Carguy, 7 Jul 2026 @36:36](https://youtu.be/PV46uTqg5Mg?t=2196).
3. Run to the boss.
4. Target-cycle (or click the boss) to release the stalled Greater Ricochet, then press a second Greater Ricochet. The 12 Deathspore stacks are there on the first GCD of the fight [Carguy, 7 Jul 2026 @37:11](https://youtu.be/PV46uTqg5Mg?t=2231), [Carguy, 15 Mar 2026 @12:22](https://youtu.be/hkVUiN856S8?t=742).
5. Death's Swiftness (free — Deathspore covers the cost), swap to Ful arrows, continue [Carguy, 7 Jul 2026 @38:18](https://youtu.be/PV46uTqg5Mg?t=2298).

Variants:
- Stall a Deadshot instead of a Greater Ricochet for more P1 damage [DiamondFang, 6 Apr 2026 @26:49](https://youtu.be/vQ4ExELCJF4?t=1609).
- Without stalling: Piercing Shot → Greater Ricochet → Piercing Shot builds the 12 stacks (the BoLG proc supplies the 12th) [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575), [Hexed Titan, 10 Jun 2026 @16:56](https://youtu.be/O1Fx1I4HO5w?t=1016).
- Without Deathspore arrows: Imbue: Shadows → Grimoire → Death's Swiftness; without a Grimoire: Death's Swiftness → auto → auto → Imbue: Shadows [Hexed Titan, 10 Jun 2026 @16:56](https://youtu.be/O1Fx1I4HO5w?t=1016).

#### B. Carguy's full best-in-slot DS rotation, with SGB (7 July 2026)
Gear: BoLG, full 5-piece Dracolich, Zuk cape, Ful arrows, EoFs for ECB / SGB / Gloomfire; relics COE + Zerker's Fury + Font of Life [Carguy, 7 Jul 2026 @34:56](https://youtu.be/PV46uTqg5Mg?t=2096), [Carguy, 7 Jul 2026 @35:29](https://youtu.be/PV46uTqg5Mg?t=2129). Adrenaline potion used as insurance.
1. Release the stalled Greater Ricochet → second Greater Ricochet
2. Death's Swiftness
3. Imbue: Shadows
4. ECB spec (EoF)
5. BoLG spec
6. Galeshot
7. Rapid Fire (adrenaline potion during/after)
8. Gloomfire spec
9. Deadshot
10. SGB spec
11. Gloomfire spec
12. Greater Ricochet
13. Shadow Tendrils
14. Snapshot, Snapshot
15. ECB spec
16. Galeshot
17. Rapid Fire
18. Gloomfire spec
19. Greater Ricochet
20. Snipe (end of window)

[Carguy, 7 Jul 2026 @38:18](https://youtu.be/PV46uTqg5Mg?t=2298)

#### C. Carguy's DS rotation without SGB (small targets)
Same gear minus SGB. He substitutes a second BoLG spec where SGB sat, so Shadow Tendrils and Snipe still land on procs [Carguy, 7 Jul 2026 @39:24](https://youtu.be/PV46uTqg5Mg?t=2364).
1. Stalled Greater Ricochet released → Greater Ricochet
2. Death's Swiftness → Imbue: Shadows → ECB spec → BoLG spec
3. Galeshot → Rapid Fire (adrenaline potion)
4. Gloomfire spec → Deadshot → BoLG spec → Gloomfire spec
5. Greater Ricochet → Shadow Tendrils → Snapshot → Snapshot
6. ECB spec → Galeshot → Rapid Fire
7. Gloomfire spec → Greater Ricochet → Snipe

[Carguy, 7 Jul 2026 @39:58](https://youtu.be/PV46uTqg5Mg?t=2398)

Carguy's note: after a DS ends there is very little time for an "off-window" rotation before you must start building Deathspore (and Wen) stacks for the next one [Carguy, 7 Jul 2026 @41:03](https://youtu.be/PV46uTqg5Mg?t=2463).

#### D. Carguy's Wen-arrow variant
1. Wen arrows on: Greater Ricochet → Piercing Shot → auto = 10 Wen stacks [Carguy, 7 Jul 2026 @42:10](https://youtu.be/PV46uTqg5Mg?t=2530)
2. Swap to Deathspore: Piercing Shot → auto → auto → Greater Ricochet = Deathspore stacks [Carguy, 7 Jul 2026 @42:42](https://youtu.be/PV46uTqg5Mg?t=2562)
3. Death's Swiftness → Imbue: Shadows → BoLG spec
4. Put Wen arrows on **for the Galeshot** (refreshes the 30 s Wen window), then Ful arrows for the Rapid Fire
5. Re-equip Wen arrows with about 2.4 s left on the Rapid Fire (Carguy believes 2.4 s is tick-perfect; some players go later) so the Wen buff covers the post-Rapid dump [Carguy, 7 Jul 2026 @43:16](https://youtu.be/PV46uTqg5Mg?t=2596)
6. Gloomfire spec → Deadshot → SGB spec → Gloomfire spec
7. Greater Ricochet → Shadow Tendrils → Piercing Shot → Snapshot
8. ECB spec → Galeshot → Rapid Fire
9. Greater Ricochet → Snipe [Carguy, 7 Jul 2026 @44:55](https://youtu.be/PV46uTqg5Mg?t=2695)

#### E. Carguy's Raksha ranged camp (15 March 2026 — dark bow era)
Gear: BoLG, 5-piece Dracolich, ECB / SGB / Dark Bow / Zamorak bow EoFs, Ful + Wen + Deathspore quivers; relics Zerker's Fury + Font of Life + Heightened Senses (for double dark bows); Ripper demon; vamp aura [Carguy, 15 Mar 2026 @5:37](https://youtu.be/hkVUiN856S8?t=337), [Carguy, 15 Mar 2026 @9:30](https://youtu.be/hkVUiN856S8?t=570). Result ≈ 1:16–1:20 on a Ful-arrow camp [Carguy, 15 Mar 2026 @6:43](https://youtu.be/hkVUiN856S8?t=403).

P1: dive to tile, drop combat dummy, target-cycle → release stalled Greater Ricochet, dismiss dummy, surge → Death's Swiftness → Imbue: Shadows → ECB spec → equip Ful arrows → target-cycle Galeshot → Rapid Fire → BoLG spec → Deadshot → Snapshot → Dark Bow spec → Greater Ricochet → Shadow Tendrils → Snapshot → Dark Bow spec → Galeshot → Rapid Fire → Snapshot → SGB spec → Greater Ricochet (phase) [Carguy, 15 Mar 2026 @13:28](https://youtu.be/hkVUiN856S8?t=808).

Interim: build adrenaline while watching the DS cooldown; optionally build Wen stacks here and consume the proc on hit 3–4 of the next Rapid Fire [Carguy, 15 Mar 2026 @15:10](https://youtu.be/hkVUiN856S8?t=910).

Next window: Piercing Shot → Greater Ricochet → Piercing Shot → Death's Swiftness → Imbue: Shadows → ECB spec → Galeshot → Rapid Fire → BoLG spec → Deadshot → SGB spec → a couple of Dark Bow specs [Carguy, 15 Mar 2026 @14:36](https://youtu.be/hkVUiN856S8?t=876).

#### F. DiamondFang's Raksha endgame camp (no pre-build, no dummies) — ≈1:15
Gear: BoLG, Gloomfire + ECB + SGB EoFs, Ful arrows with a Deathspore switch for P4, adrenaline potion [DiamondFang, 6 Apr 2026 @31:51](https://youtu.be/vQ4ExELCJF4?t=1911).
1. Death's Swiftness + adrenaline potion
2. Anticipate
3. Imbue: Shadows
4. Greater Ricochet
5. BoLG spec (Rico **before** the spec so the Rico hits get doubled) [DiamondFang, 6 Apr 2026 @22:24](https://youtu.be/vQ4ExELCJF4?t=1344)
6. ECB spec
7. Galeshot
8. Rapid Fire
9. Deadshot
10. Gloomfire spec — lands on 1 stack because Galeshot was +1 and Rapid Fire and Deadshot were +0 [DiamondFang, 6 Apr 2026 @31:51](https://youtu.be/vQ4ExELCJF4?t=1911)
11. Greater Ricochet (−1, puts you on 3)
12. Snipe (on 3 stacks → proc)
13. Snapshot
14. Shadow Tendrils
15. BoLG spec
16. ECB spec → Rapid Fire → ECB spec

P4 (after the pull skip): Piercing Shot → Greater Ricochet → Piercing Shot → Death's Swiftness → BoLG spec → Imbue: Shadows → ECB spec → Rapid Fire → Deadshot → Gloomfire → ECB → Snapshot [DiamondFang, 6 Apr 2026 @32:56](https://youtu.be/vQ4ExELCJF4?t=1976).

#### G. DiamondFang's progression rotations (lower gear)
Tier-80 weapon, no Greater Ricochet, no specs — 50 s Vindicta kill [DiamondFang, 6 Apr 2026 @14:34](https://youtu.be/vQ4ExELCJF4?t=874):
Death's Swiftness → adrenaline potion → Imbue: Shadows → Ricochet → Galeshot → Rapid Fire → Piercing Shot → Deadshot → Ricochet → Snapshot → Snipe → Shadow Tendrils → Snapshot → Snapshot → Galeshot → Rapid Fire [DiamondFang, 6 Apr 2026 @15:07](https://youtu.be/vQ4ExELCJF4?t=907).

With Greater Ricochet + Greater DS (or planted feet) [DiamondFang, 6 Apr 2026 @16:50](https://youtu.be/vQ4ExELCJF4?t=1010):
Death's Swiftness → Imbue: Shadows → **Galeshot → Greater Ricochet** (Gale first here, because Gale's per-hit bonus across seven Rico hits is huge at this gear level) → Deadshot → Rapid Fire → Snapshot → Greater Ricochet → Shadow Tendrils → Snipe → Snapshot → Snapshot → Galeshot → Greater Ricochet → Snapshot → Rapid Fire.

With Gloomfire bow as the camped weapon [DiamondFang, 6 Apr 2026 @18:28](https://youtu.be/vQ4ExELCJF4?t=1108):
Death's Swiftness → adrenaline potion → Imbue: Shadows → Galeshot → Greater Ricochet → Deadshot → Rapid Fire → Gloomfire → Greater Ricochet → Snipe → Shadow Tendrils → Snapshot → Snapshot → Galeshot → Greater Ricochet → Gloomfire → Rapid Fire.

#### H. Hexed Titan's teaching ladder
Simple DS rotation, ignoring BoLG stacks entirely — goals are Deadshot, Shadow Tendrils, Snipe, and Galeshot+Rapid Fire twice; dump with Snapshot; Greater Ricochet whenever adrenaline gets low [Hexed Titan, 10 Jun 2026 @10:12](https://youtu.be/O1Fx1I4HO5w?t=612).

Stack-aware version: same shape, but line up Shadow Tendrils / Snipe / BoLG spec on the 4th hit [Hexed Titan, 10 Jun 2026 @11:52](https://youtu.be/O1Fx1I4HO5w?t=712).

Dark Bow loop: Piercing Shot (+2) → Dark Bow (2 hits, procs on the 4th, back to 0) → Piercing Shot → Dark Bow [Hexed Titan, 10 Jun 2026 @13:35](https://youtu.be/O1Fx1I4HO5w?t=815).

Gloomfire loop: auto (+1) → Gloomfire (3 hits, big hit on the proc) → auto → Gloomfire; Greater Ricochet when adrenaline drops [Hexed Titan, 10 Jun 2026 @15:13](https://youtu.be/O1Fx1I4HO5w?t=913). From 3 stacks, a Snapshot procs and leaves you on 1, ready for Gloomfire [Hexed Titan, 10 Jun 2026 @16:20](https://youtu.be/O1Fx1I4HO5w?t=980).

Named combos [Hexed Titan, 10 Jun 2026 @16:56](https://youtu.be/O1Fx1I4HO5w?t=1016): Piercing → Greater Ricochet → Piercing (guarantees Deathspore stacks); Death's Swiftness → Imbue: Shadows → BoLG spec → Galeshot → Rapid Fire; Galeshot → Rapid Fire → Deadshot → Gloomfire → SGB.

Raksha P4→P5 [Hexed Titan, 10 Jun 2026 @19:14](https://youtu.be/O1Fx1I4HO5w?t=1154): on drop-down, Piercing → Piercing for Deathspore stacks → auto to renew the Wen timer → auto → ultimate → BoLG spec → switch to Wen arrows → Greater Ricochet → Deadshot → spam Snapshot.

#### I. Wings' improvised approach (goal-based, not a fixed list)
Wings explicitly does not follow strict rotations and does not stall [Wings of Absurdity, 18 Mar 2026 @0:35](https://youtu.be/mOJhIsPl9GA?t=35). His loop: buff abilities → high-impact abilities → adrenaline spenders → Greater Ricochet when dry; when Death's Swiftness ends, build Deathspore stacks toward 12 while watching the DS cooldown [Wings of Absurdity, 18 Mar 2026 @8:23](https://youtu.be/mOJhIsPl9GA?t=503).

Non-prebuild opener (3x3 boss, HM Kerapac, 2:39): Imbue: Shadows during the spawn animation → Greater Ricochet → Death's Swiftness + adrenaline potion → Shadow Tendrils, Galeshot, ECB spec → Rapid Fire → BoLG spec → Deadshot → Gloomfire → Greater Ricochet → Gloomfire → ECB spec [Wings of Absurdity, 18 Mar 2026 @9:33](https://youtu.be/mOJhIsPl9GA?t=573).

Large targets (4x4/5x5, HM Vorago): skip the first Galeshot to fit **two** SGB specs in one DS, the first buffed by Rapid Fire's crit window; 1.5M → 543k life points in one DS without ECB [Wings of Absurdity, 18 Mar 2026 @14:35](https://youtu.be/mOJhIsPl9GA?t=875), [Wings of Absurdity, 18 Mar 2026 @15:41](https://youtu.be/mOJhIsPl9GA?t=941).

Full pre-build (K'ril, attack the obelisk): make sure perfect equilibrium is active → build all Deathspore stacks → free Death's Swiftness → Imbue: Shadows → ECB spec → Galeshot → Rapid Fire → Deadshot → SGB → dump. No BoLG spec needed because PE is already up [Wings of Absurdity, 18 Mar 2026 @18:02](https://youtu.be/mOJhIsPl9GA?t=1082).

Partial pre-build (ED2): partially build Deathspore on nearby mobs, walk to the boss, finish with a Greater Ricochet for the free DS, switch to Jas dragonbane arrows, stack buffs, nuke with Deadshot + SGB — 31 s PR [Wings of Absurdity, 18 Mar 2026 @17:23](https://youtu.be/mOJhIsPl9GA?t=1043).

#### J. Revolution bars (Qp RS)
Endgame single-target bar, in priority order: Death's Swiftness, Imbue: Shadows, Greater Ricochet, Galeshot, Rapid Fire, Snipe, Deadshot, Shadow Tendrils, Piercing Shot, Snapshot [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686). Only use the Imbue: Shadows version if you actually have Greater Ricochet.

Endgame AoE bar: Death's Swiftness, Imbue: Shadows, Greater Ricochet, Galeshot, Tuska's Wrath, Corruption Shot, Sacrifice, Bombardment — Tuska's Wrath and Sacrifice exist purely to build enough adrenaline for the Imbue → Rico → DS chain [Qp RS, 28 Mar 2026 @12:02](https://youtu.be/3UzITrjpTIw?t=722).

Ordering principle: abilities with long cooldowns (Snipe, Death's Swiftness) go **above** no-cooldown spenders (Snapshot), because you rarely sit at 100% adrenaline so a low-priority Snapshot never loses hits, while a delayed Snipe wastes its 1-minute cooldown [Qp RS, 28 Mar 2026 @4:01](https://youtu.be/3UzITrjpTIw?t=241). Galeshot is placed above Greater Ricochet so Gale always modifies Rico rather than a basic attack [Qp RS, 28 Mar 2026 @9:08](https://youtu.be/3UzITrjpTIw?t=548).

---

### Adrenaline, specials and ammunition

#### Adrenaline
- The economy runs on hit splats, not crits. Imbue: Shadows pays 5% per hit splat for 30 s at a cost of 40% [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745), [Qp RS, 28 Mar 2026 @10:53](https://youtu.be/3UzITrjpTIw?t=653). This replaced the old crit-based Incendiary Shot model [Carguy, 15 Mar 2026 @1:42](https://youtu.be/hkVUiN856S8?t=102).
- Returns per ability under Imbue: Shadows: Greater Ricochet ≈35, or 40 with a BoLG proc hit [DiamondFang, 6 Apr 2026 @2:54](https://youtu.be/vQ4ExELCJF4?t=174); Rapid Fire ≈40 [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778), plus 2.5% per hit from a full Dracolich set [Carguy, 7 Jul 2026 @34:21](https://youtu.be/PV46uTqg5Mg?t=2061); Deadshot roughly breaks even or nets +5%/+10% [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234); Piercing Shot 9 [Carguy, 7 Jul 2026 @2:51](https://youtu.be/PV46uTqg5Mg?t=171); Snipe neither costs nor gives [Carguy, 7 Jul 2026 @7:56](https://youtu.be/PV46uTqg5Mg?t=476).
- A perfect-equilibrium proc under Imbue: Shadows grants an extra 5% adrenaline. Wings demonstrates it: a Gloomfire at 1 stack costs 58.5%, its three hits refund 15% (→ 56.5%), and the proc adds a further 5%, which paid for a second Gloomfire [Wings of Absurdity, 6 Apr 2026 @6:51](https://youtu.be/OfXWmwLuEmY?t=411).
- "Adrenaline is king" — the single biggest reason Greater Ricochet is the first big unlock [DiamondFang, 6 Apr 2026 @5:40](https://youtu.be/vQ4ExELCJF4?t=340).
- When you are dry: press Greater Ricochet, at all costs [Wings of Absurdity, 18 Mar 2026 @20:51](https://youtu.be/mOJhIsPl9GA?t=1251).
- Eating: blubber jellyfish cost no adrenaline; solid foods cost 3%. Trick — eat a solid **during** Rapid Fire while at 100% adrenaline; you dip to 97% and are back at 100% immediately, healing 2,000+ instead of 500–750 [Wings of Absurdity, 24 Apr 2026 @0:00](https://youtu.be/_rXrl_xgwzs?t=0), [Wings of Absurdity, 24 Apr 2026 @0:33](https://youtu.be/_rXrl_xgwzs?t=33).
- Wasted Deathspore stacks (DS still >10 s away) can be dumped into Natural Instinct, which doubles adrenaline gain from basics. With Ring of Vigor passive + Conservation of Energy relic + Fury of the Small you then need only one basic before Imbue: Shadows; otherwise two [Wings of Absurdity, 24 Apr 2026 @2:48](https://youtu.be/_rXrl_xgwzs?t=168).
- Relics: Carguy runs COE + Zerker's Fury + Font of Life in July [Carguy, 7 Jul 2026 @35:29](https://youtu.be/PV46uTqg5Mg?t=2129); in March he ran Zerker's Fury + Font of Life and swapped to Heightened Senses for the adrenaline headroom to fit double Dark Bows [Carguy, 15 Mar 2026 @9:30](https://youtu.be/hkVUiN856S8?t=570).

#### Special attacks and the Essence of Finality
- Wings' tier list (Snapshot is the yardstick at 290% average / 25% adrenaline / 0 cooldown) [Wings of Absurdity, 6 Apr 2026 @0:36](https://youtu.be/OfXWmwLuEmY?t=36):
  - **S:** Bow of the Last Guardian (equipped, never in an EoF), Gloomfire bow
  - **A:** Seren godbow, Eldritch crossbow, Saradomin bow (as healing utility), Decimation
  - **B:** Dark bow, Guthix bow
  - **C:** Morrigan's throwing axe, Seercull, Strykebow
  - **Snapshot tier (do not bother):** Hand cannon, Morrigan's javelin, Noxious longbow, Saradomin bow's damage spec
- **Minimum viable kit:** SGB EoF + ECB EoF gets you most of the way; the highest-DPS setup adds a Gloomfire EoF [Wings of Absurdity, 6 Apr 2026 @12:28](https://youtu.be/OfXWmwLuEmY?t=748). Carguy's three staples are SGB, ECB and Gloomfire, with Decimation as the situational AoE one [Carguy, 7 Jul 2026 @21:23](https://youtu.be/PV46uTqg5Mg?t=1283).
- **BoLG spec:** ~245% average, actually weaker than Snapshot on its own and slightly more expensive; its entire value is halving the perfect-equilibrium threshold from 8 to 4 [Wings of Absurdity, 6 Apr 2026 @5:43](https://youtu.be/OfXWmwLuEmY?t=343), [Wings of Absurdity, 6 Apr 2026 @6:16](https://youtu.be/OfXWmwLuEmY?t=376). Press it whenever the buff lapses and you are not about to Death's Swiftness [DiamondFang, 6 Apr 2026 @10:38](https://youtu.be/vQ4ExELCJF4?t=638). Pressing it at 3+ stacks doubles the spec's own hit [Carguy, 7 Jul 2026 @20:16](https://youtu.be/PV46uTqg5Mg?t=1216).
- **ECB (split soul):** converts soul split healing into damage — the original version, predating Necromancy's Split Soul; ECB was released in 2019 [Carguy, 7 Jul 2026 @24:10](https://youtu.be/PV46uTqg5Mg?t=1450). 25% adrenaline (22.5% with Ring of Vigor), 15 s duration, no cooldown [Wings of Absurdity, 6 Apr 2026 @4:01](https://youtu.be/OfXWmwLuEmY?t=241). Carguy states it applies 400% of the would-be heal as damage [Carguy, 7 Jul 2026 @24:42](https://youtu.be/PV46uTqg5Mg?t=1482); DiamondFang measures the net effect at 20–25% more damage, capped like healing so more hits = more value [DiamondFang, 6 Apr 2026 @12:19](https://youtu.be/vQ4ExELCJF4?t=739). Use it as a **buff before** the high-impact dump [Wings of Absurdity, 6 Apr 2026 @4:35](https://youtu.be/OfXWmwLuEmY?t=275). Skip it entirely if survivability is a problem — you can clear all content without it [DiamondFang, 6 Apr 2026 @25:42](https://youtu.be/vQ4ExELCJF4?t=1542), [Wings of Absurdity, 18 Mar 2026 @12:54](https://youtu.be/mOJhIsPl9GA?t=774).
- **SGB:** five arrows averaging 140% each; the first always hits, the other four depend on target size. 5x5+ ≈700% average; 4x4 ≈490%; 3x3 ≈326.7%; not worth it on 2x2 or 1x1 [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172). 30% adrenaline (27% with RoV), 30 s cooldown, one GCD, +1 BoLG stack regardless of arrows landed [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172), [DiamondFang, 6 Apr 2026 @13:28](https://youtu.be/vQ4ExELCJF4?t=808). Two per DS window are possible with Greater DS [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172). Carguy quotes 125–155% per arrow and 50–80k total under full buffs, naming Glacor and ED2 as showcases [Carguy, 7 Jul 2026 @22:30](https://youtu.be/PV46uTqg5Mg?t=1350). Solak is 3x3, which surprised Wings [Wings of Absurdity, 6 Apr 2026 @4:01](https://youtu.be/OfXWmwLuEmY?t=241). Check boss size on the wiki or PVME [Carguy, 7 Jul 2026 @23:37](https://youtu.be/PV46uTqg5Mg?t=1417).
- **Gloomfire bow:** 65% adrenaline (58.5% with RoV), three hits, no cooldown; first two weak, third huge. Carguy: 85–105% then 255–295% [Carguy, 7 Jul 2026 @25:50](https://youtu.be/PV46uTqg5Mg?t=1550); Hexed: 465% total with a 275% big hit [Hexed Titan, 10 Jun 2026 @5:43](https://youtu.be/O1Fx1I4HO5w?t=343). **Use at 1 BoLG stack** so the big hit is the proc. Misaligned it does slightly less than a Dark Bow, so mistakes are cheap [Carguy, 7 Jul 2026 @26:24](https://youtu.be/PV46uTqg5Mg?t=1584). Wings typically fires two or three back to back [Wings of Absurdity, 6 Apr 2026 @7:57](https://youtu.be/OfXWmwLuEmY?t=477). Tier 90, obtainable from Heists via Thieving [DiamondFang, 6 Apr 2026 @17:57](https://youtu.be/vQ4ExELCJF4?t=1077).
- **Dark bow:** 420% over two hits, same adrenaline as Gloomfire, best on 2–3 stacks; more flexible for stack timing but fewer hits, so less synergy with Imbue: Shadows, Galeshot and ECB [Wings of Absurdity, 6 Apr 2026 @8:29](https://youtu.be/OfXWmwLuEmY?t=509), [DiamondFang, 6 Apr 2026 @14:01](https://youtu.be/vQ4ExELCJF4?t=841). Still turns up in short windows where you cannot line up a Gloomfire, e.g. the new ranged Amascut P1 [DiamondFang, 6 Apr 2026 @37:55](https://youtu.be/vQ4ExELCJF4?t=2275).
- **Zamorak bow EoF:** two hits; a weaker Dark Bow at lower adrenaline — a midpoint between Snapshot and Dark Bow. Carguy has seen it in a PVME rotation but the boss name is garbled ("Nakatrell ... or maybe it was the Kzam") so I cannot identify it [Carguy, 7 Jul 2026 @29:17](https://youtu.be/PV46uTqg5Mg?t=1757), [Carguy, 15 Mar 2026 @6:10](https://youtu.be/hkVUiN856S8?t=370).
- **Decimation ("locate"):** makes your abilities AoE across a 7x7 grid / five additional enemies within three tiles for the next 5–6 abilities; excludes Ricochet, Corruption Shot and Bombardment [Wings of Absurdity, 6 Apr 2026 @11:20](https://youtu.be/OfXWmwLuEmY?t=680), [Carguy, 7 Jul 2026 @26:58](https://youtu.be/PV46uTqg5Mg?t=1618), [Hexed Titan, 10 Jun 2026 @6:17](https://youtu.be/O1Fx1I4HO5w?t=377). It interacts with Imbue: Shadows, so more targets = more adrenaline [Wings of Absurdity, 6 Apr 2026 @11:54](https://youtu.be/OfXWmwLuEmY?t=714). Wings used it for a grandmaster Seiryu and a master timer at HM Zamorak [Wings of Absurdity, 6 Apr 2026 @11:54](https://youtu.be/OfXWmwLuEmY?t=714), [Wings of Absurdity, 18 Mar 2026 @23:41](https://youtu.be/mOJhIsPl9GA?t=1421). Useless where there are no minions.
- **Saradomin bow / Guthix bow (healing utility):** Saradomin bow 30% adrenaline (27% RoV), 135–145% damage, heals over 15 s in 3-second instalments (e.g. 4,634 damage → 926 lp every 3 s); re-using it overrides the existing heal; it does not work on Zamorak's green health bar, only the purple one [Wings of Absurdity, 6 Apr 2026 @9:36](https://youtu.be/OfXWmwLuEmY?t=576). Guthix bow costs 35% (31.5% RoV), heals from 60% of the damage, more damage / less healing; the two stack [Wings of Absurdity, 6 Apr 2026 @10:45](https://youtu.be/OfXWmwLuEmY?t=645). Wings uses them to play aggressively with ECB and for endurance content like Seiryu and solo AoD [Wings of Absurdity, 6 Apr 2026 @10:13](https://youtu.be/OfXWmwLuEmY?t=613), [Wings of Absurdity, 18 Mar 2026 @22:34](https://youtu.be/mOJhIsPl9GA?t=1354).
- **EoF switching discipline (Wings' key practical advice):** pre-equip. Choose the first EoF for a boss in your preset; use the Rapid Fire channel as thinking time to switch the next one; when Death's Swiftness is down and you are building Deathspore stacks, decide what you will open the next window with and equip it then. Simplest default: ECB first, then SGB; if not using ECB, SGB then Gloomfire; when Gloomfire runs out of adrenaline, go back to ECB [Wings of Absurdity, 6 Apr 2026 @14:09](https://youtu.be/OfXWmwLuEmY?t=849), [Wings of Absurdity, 6 Apr 2026 @15:54](https://youtu.be/OfXWmwLuEmY?t=954), [Wings of Absurdity, 6 Apr 2026 @19:55](https://youtu.be/OfXWmwLuEmY?t=1195).

#### Arrows
- **Ful arrows — the default camp.** +15% damage, −10% hit chance; with 120 combat and modern accuracy you stay above 100% accuracy in practice [Carguy, 7 Jul 2026 @30:22](https://youtu.be/PV46uTqg5Mg?t=1822). DiamondFang qualifies it: only a gain while your accuracy/"potential" is over 95%, visible on the target's buff bar [DiamondFang, 6 Apr 2026 @19:35](https://youtu.be/vQ4ExELCJF4?t=1175). Hexed: camp these 90% of the time [Hexed Titan, 10 Jun 2026 @7:25](https://youtu.be/O1Fx1I4HO5w?t=445).
- **Deathspore arrows — the free-ultimate switch.** Every hit is a stack; at 12 stacks your next ability costs no adrenaline; the effect has a 30 s cooldown [Carguy, 7 Jul 2026 @30:22](https://youtu.be/PV46uTqg5Mg?t=1822), [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575). Hexed's clean method: equip for exactly four hits — three to build, one to spend on the ultimate — then swap back [Hexed Titan, 10 Jun 2026 @7:59](https://youtu.be/O1Fx1I4HO5w?t=479). 99% of the time you spend them on Death's Swiftness [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575).
- **Wen arrows — the burst-window switch.** Build 10 stacks from basics, then get a window of +30% damage. Duration is disputed: Carguy says a 9-second window and that the 10 stacks themselves expire after 30 s [Carguy, 7 Jul 2026 @30:55](https://youtu.be/PV46uTqg5Mg?t=1855), [Carguy, 7 Jul 2026 @42:42](https://youtu.be/PV46uTqg5Mg?t=2562); Hexed says the next enhanced/ultimate activates the effect for the next five attacks, +30% damage **and** hit chance [Hexed Titan, 10 Jun 2026 @8:31](https://youtu.be/O1Fx1I4HO5w?t=511). You cannot consume stacks before reaching 10 [Carguy, 7 Jul 2026 @30:55](https://youtu.be/PV46uTqg5Mg?t=1855). Carguy's handling: Wen on for the Galeshot to refresh the timer, Ful for most of the Rapid Fire, Wen back on at ~2.4 s remaining so the post-Rapid crit dump is covered [Carguy, 7 Jul 2026 @43:16](https://youtu.be/PV46uTqg5Mg?t=2596). Every guide agrees they are fiddly: Carguy mostly skips them when hybriding [Carguy, 7 Jul 2026 @31:29](https://youtu.be/PV46uTqg5Mg?t=1889); DiamondFang says he is unsure when they are worth it and mostly uses them where he can pre-stack or across a big phase transition [DiamondFang, 6 Apr 2026 @27:22](https://youtu.be/vQ4ExELCJF4?t=1642); Hexed calls them a min-max / accuracy-problem option, e.g. Vorago [Hexed Titan, 10 Jun 2026 @8:31](https://youtu.be/O1Fx1I4HO5w?t=511).
- **Jas dragonbane / demonbane arrows.** Flat +30% damage and +20% hit chance against dragons; casting Tune Bane Ore converts them to demonbane with identical behaviour. As strong as Wen arrows but only on the right creature type — ED2, Kalphite demons [Carguy, 7 Jul 2026 @32:03](https://youtu.be/PV46uTqg5Mg?t=1923), [Hexed Titan, 10 Jun 2026 @9:07](https://youtu.be/O1Fx1I4HO5w?t=547).
- **Blackstone arrows.** Reduce the target's defence ratings, raising your hit chance. Hexed: use for a couple of abilities at the start of a fight then switch back [Hexed Titan, 10 Jun 2026 @9:07](https://youtu.be/O1Fx1I4HO5w?t=547). Carguy has not needed them at 120 combat [Carguy, 7 Jul 2026 @33:13](https://youtu.be/PV46uTqg5Mg?t=1993).
- **Bik arrows.** Poison damage that ramps the longer you attack the same target. Hexed: usable at chill high-enrage Arch-Glacor [Hexed Titan, 10 Jun 2026 @8:31](https://youtu.be/O1Fx1I4HO5w?t=511). Carguy dismisses them for best-in-slot play — 30 s upkeep is too annoying for hybrid rotations and the damage is not worth it [Carguy, 7 Jul 2026 @32:39](https://youtu.be/PV46uTqg5Mg?t=1959).
- **Splintering arrows.** Carguy tested them at the start of the update and calls them terrible [Carguy, 7 Jul 2026 @32:39](https://youtu.be/PV46uTqg5Mg?t=1959). Qp and Wings still list them as a budget option [Qp RS, 28 Mar 2026 @2:51](https://youtu.be/3UzITrjpTIw?t=171), [Wings of Absurdity, 25 Jul 2026 @6:44](https://youtu.be/joHe24sEaDY?t=404).
- **Ammo economy:** 15% of ammo breaks by default; the master ranged cape perk reduces that by 10% and blightbound crossbows by 25%; do Animal Magnetism for auto-pickup [Qp RS, 28 Mar 2026 @1:42](https://youtu.be/3UzITrjpTIw?t=102).
- **Arrow-swap bug:** because BoLG proc damage is calculated after the ability, you can start an ability on Wen arrows and finish on Ful so the proc benefits from both. DiamondFang says it is rarely used outside min-maxers [DiamondFang, 6 Apr 2026 @36:50](https://youtu.be/vQ4ExELCJF4?t=2210).

#### Stalling and other advanced tricks
- Stalling in EoC 2.0: press an ability while out of attack range, then click away; release by clicking a target or pressing target-cycle [Carguy, 7 Jul 2026 @37:44](https://youtu.be/PV46uTqg5Mg?t=2264).
- BoLG stall bug: high-end DS rotations reportedly use 4–8 stalls; Carguy declines to use it and points at PVME / high-level write-ups [Carguy, 7 Jul 2026 @20:48](https://youtu.be/PV46uTqg5Mg?t=1248).
- The "BoLG bug" DiamondFang describes: stall a multi-hit ability (Greater Ricochet, Deadshot) and release with a hard-hitting one (Shadow Tendrils, Gloomfire) and **both** procs are attributed to the hard-hitting ability. He says most high-end rotations do not use it [DiamondFang, 6 Apr 2026 @35:42](https://youtu.be/vQ4ExELCJF4?t=2142).
- Ability queuing + Rapid Fire: queue an ability on the same tick as Rapid Fire and it fires a tick early with the full benefit [DiamondFang, 6 Apr 2026 @37:23](https://youtu.be/vQ4ExELCJF4?t=2243).

---

### Numeric claims to verify

| Claim | Video @ timestamp |
|---|---|
| Global cooldown is 3 game ticks = 1.8 s | [Carguy, 7 Jul 2026 @2:16](https://youtu.be/PV46uTqg5Mg?t=136) |
| Piercing Shot: 2 hits, 45–55% ranged damage each | [Carguy, 7 Jul 2026 @2:51](https://youtu.be/PV46uTqg5Mg?t=171) |
| Piercing Shot generates 9 adrenaline | [Carguy, 7 Jul 2026 @2:51](https://youtu.be/PV46uTqg5Mg?t=171) |
| Piercing Shot: 100% damage over 2 hits | [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96) |
| Piercing Shot reduces Snipe's cooldown by 2.4 s | [Carguy, 7 Jul 2026 @3:26](https://youtu.be/PV46uTqg5Mg?t=206) |
| Piercing Shot lowers Snipe's cooldown by 5 s | [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96) |
| Binding Shot: 2 charges, 15 s cooldown | [Carguy, 7 Jul 2026 @3:26](https://youtu.be/PV46uTqg5Mg?t=206) |
| Binding Shot: 70% damage, 1 hit | [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128) |
| Galeshot buff lasts 6 s, +465 bonus damage per hit | [Carguy, 7 Jul 2026 @5:07](https://youtu.be/PV46uTqg5Mg?t=307) |
| Galeshot: +20% per hit splat for next 3 abilities, 4 with Rapid Fire | [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96) |
| Galeshot causes next few abilities to hit 10% more | [Qp RS, 28 Mar 2026 @7:26](https://youtu.be/3UzITrjpTIw?t=446) |
| Rapid Fire hits extend searing winds by 6 s each | [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612) |
| Ricochet: 115%, 3 hits (1 + 2) | [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128) |
| Greater Ricochet: 135%, 7 hits (1 + 6) | [Hexed Titan, 10 Jun 2026 @2:08](https://youtu.be/O1Fx1I4HO5w?t=128) |
| Greater Ricochet fires 7 hit splats by default (was 3 + Caroming) | [Carguy, 7 Jul 2026 @5:41](https://youtu.be/PV46uTqg5Mg?t=341) |
| Greater Ricochet under Imbue: Shadows returns 35 adrenaline, 40 with a BoLG hit | [DiamondFang, 6 Apr 2026 @2:54](https://youtu.be/vQ4ExELCJF4?t=174) |
| Snapshot: 2 hits of 135–155% each, 25% adrenaline | [Carguy, 7 Jul 2026 @6:48](https://youtu.be/PV46uTqg5Mg?t=408) |
| Snapshot: 290% average, 25% adrenaline, 0 s cooldown | [Wings of Absurdity, 6 Apr 2026 @0:36](https://youtu.be/OfXWmwLuEmY?t=36) |
| Snipe: single hit of 300–360%, 1 minute cooldown, no adrenaline cost or gain | [Carguy, 7 Jul 2026 @7:56](https://youtu.be/PV46uTqg5Mg?t=476) |
| Snipe: 330%, 1 hit, no adrenaline cost | [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195) |
| Snipe is now a 3-tick ability (was 4-tick) | [Carguy, 7 Jul 2026 @8:29](https://youtu.be/PV46uTqg5Mg?t=509) |
| Snipe on 3 BoLG stacks does roughly 60k | [DiamondFang, 6 Apr 2026 @6:46](https://youtu.be/vQ4ExELCJF4?t=406) |
| Nightmare gauntlets flanked Snipe ≈ +50% damage plus an extra arrow/stack | [DiamondFang, 6 Apr 2026 @6:46](https://youtu.be/vQ4ExELCJF4?t=406) |
| Fleeting boots reduce Snipe's cooldown a further 1.8 s per basic ability | [Carguy, 7 Jul 2026 @8:29](https://youtu.be/PV46uTqg5Mg?t=509) |
| Bombardment: 25% adrenaline, 2 tiles from target (was 1) | [Carguy, 7 Jul 2026 @9:39](https://youtu.be/PV46uTqg5Mg?t=579) |
| Bombardment: 240%, 5x5 area, one hit counted per mob | [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195) |
| Bombardment hits up to 9 additional enemies within 2 tiles | [Protoxx, 29 Jun 2026 @6:04](https://youtu.be/aGRV825noAo?t=364) |
| Rapid Fire: 8 hits over 8 ticks, 75–85% each | [Carguy, 7 Jul 2026 @10:12](https://youtu.be/PV46uTqg5Mg?t=612) |
| Rapid Fire: 640% over 8 hits | [Hexed Titan, 10 Jun 2026 @2:40](https://youtu.be/O1Fx1I4HO5w?t=160) |
| Dracolich: +40% crit chance after a full Rapid Fire channel | [Carguy, 7 Jul 2026 @11:20](https://youtu.be/PV46uTqg5Mg?t=680) |
| Dracolich 3-piece: 3 s crit window (≈2 GCDs); pieces 4 and 5 add 1.8 s each → 4 GCDs | [Carguy, 7 Jul 2026 @34:21](https://youtu.be/PV46uTqg5Mg?t=2061) |
| Dracolich: 0.5% adrenaline per piece per 0.6 s while channelling Rapid Fire; 2.5% at 5-piece | [Carguy, 7 Jul 2026 @33:46](https://youtu.be/PV46uTqg5Mg?t=2026) |
| Elite Dracolich crit window brings you to almost 80% crit chance | [DiamondFang, 6 Apr 2026 @30:43](https://youtu.be/vQ4ExELCJF4?t=1843) |
| Shadow Tendrils: 200–240%, 45 s cooldown | [Carguy, 7 Jul 2026 @11:53](https://youtu.be/PV46uTqg5Mg?t=713) |
| Shadow Tendrils: 220%, effectively 330% because it always crits | [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234) |
| Shadow Tendrils extends Imbue: Shadows by 3.6 s | [Carguy, 7 Jul 2026 @12:25](https://youtu.be/PV46uTqg5Mg?t=745) |
| Imbue: Shadows returns 5% adrenaline per hit | [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778) |
| Imbue: Shadows costs 40% adrenaline, lasts 30 s | [Qp RS, 28 Mar 2026 @10:53](https://youtu.be/3UzITrjpTIw?t=653) |
| Rapid Fire under Imbue: Shadows returns 40% adrenaline | [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778) |
| Imbue: Shadows can be extended to 33.6 s with Shadow Tendrils | [Carguy, 7 Jul 2026 @12:58](https://youtu.be/PV46uTqg5Mg?t=778) |
| Corruption Shot: 20% adrenaline, 15 s cooldown | [Carguy, 7 Jul 2026 @13:32](https://youtu.be/PV46uTqg5Mg?t=812) |
| Corruption Shot: 25% adrenaline, generates no hit | [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539) |
| Corruption Shot: 300% damage over time | [Hexed Titan, 10 Jun 2026 @3:15](https://youtu.be/O1Fx1I4HO5w?t=195) |
| Corruption Shot spreads to up to 5 additional enemies within 5 tiles | [Carguy, 7 Jul 2026 @13:32](https://youtu.be/PV46uTqg5Mg?t=812) |
| Deadshot: 60% adrenaline base with or without the cape | [Carguy, 7 Jul 2026 @14:39](https://youtu.be/PV46uTqg5Mg?t=879) |
| Deadshot with Zuk cape: 8 hits of 55–75% | [Carguy, 7 Jul 2026 @14:39](https://youtu.be/PV46uTqg5Mg?t=879) |
| Deadshot: 460% / 4 hits without cape; 520% / 8 hits with Zuk cape | [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234) |
| Deadshot has a 30-second cooldown | [Carguy, 7 Jul 2026 @14:39](https://youtu.be/PV46uTqg5Mg?t=879) |
| Deadshot nets +5% adrenaline, or +10% with the BoLG spec active | [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234) |
| Death's Swiftness: 1.5x ranged damage (+50%) | [Carguy, 7 Jul 2026 @16:52](https://youtu.be/PV46uTqg5Mg?t=1012) |
| Death's Swiftness: 30.6 s, +6.6 s with Greater DS or planted feet | [DiamondFang, 6 Apr 2026 @2:20](https://youtu.be/vQ4ExELCJF4?t=140) |
| Death's Swiftness: 30 s, up to 37.8 s with the greater version | [Hexed Titan, 10 Jun 2026 @4:29](https://youtu.be/O1Fx1I4HO5w?t=269) |
| Planted feet switch extends Death's Swiftness by 7 s | [DiamondFang, 6 Apr 2026 @16:16](https://youtu.be/vQ4ExELCJF4?t=976) / [Wings of Absurdity, 25 Jul 2026 @8:59](https://youtu.be/joHe24sEaDY?t=539) |
| Perfect Equilibrium triggers at 8 stacks, 4 with the BoLG spec | [Carguy, 7 Jul 2026 @17:59](https://youtu.be/PV46uTqg5Mg?t=1079) / [Wings of Absurdity, 6 Apr 2026 @5:08](https://youtu.be/OfXWmwLuEmY?t=308) |
| PE proc deals 12–16% ability damage; triggering ability adds 33–37% of its original damage | [Wings of Absurdity, 6 Apr 2026 @5:08](https://youtu.be/OfXWmwLuEmY?t=308) |
| PE proc = 40% base damage + 35% of the used ability, roughly a 50% copy | [Hexed Titan, 10 Jun 2026 @5:06](https://youtu.be/O1Fx1I4HO5w?t=306) |
| PE proc grants an extra 5% adrenaline under Imbue: Shadows | [Wings of Absurdity, 6 Apr 2026 @6:51](https://youtu.be/OfXWmwLuEmY?t=411) |
| BoLG spec: single hit of "25 to 255%" (garbled; likely 225–255%) | [Carguy, 7 Jul 2026 @20:16](https://youtu.be/PV46uTqg5Mg?t=1216) |
| BoLG spec: ~245% average, weaker than Snapshot, costs 5% more adrenaline (2% more with RoV) | [Wings of Absurdity, 6 Apr 2026 @5:43](https://youtu.be/OfXWmwLuEmY?t=343) |
| BoLG spec: 245% damage, 1 hit | [Hexed Titan, 10 Jun 2026 @5:06](https://youtu.be/O1Fx1I4HO5w?t=306) |
| SGB: 5 arrows averaging 140% each | [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172) |
| SGB averages: 700% at 5x5+, 490% at 4x4, 326.7% at 3x3 | [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172) |
| SGB: 30% adrenaline (27% with RoV), 30 s cooldown | [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172) |
| SGB: 125–155% per arrow, 30% base adrenaline | [Carguy, 7 Jul 2026 @22:30](https://youtu.be/PV46uTqg5Mg?t=1350) |
| SGB does roughly 50–80k under full buffs when all arrows hit | [Carguy, 7 Jul 2026 @23:04](https://youtu.be/PV46uTqg5Mg?t=1384) |
| SGB: 700% total, gives only 1 BoLG stack | [Hexed Titan, 10 Jun 2026 @5:43](https://youtu.be/O1Fx1I4HO5w?t=343) |
| ECB applies 400% of the would-be heal as damage; 15 s; 25% base adrenaline | [Carguy, 7 Jul 2026 @24:42](https://youtu.be/PV46uTqg5Mg?t=1482) |
| ECB: 25% adrenaline (22.5% with RoV), 15 s duration, no cooldown | [Wings of Absurdity, 6 Apr 2026 @4:01](https://youtu.be/OfXWmwLuEmY?t=241) |
| ECB is worth roughly a 20–25% damage boost | [DiamondFang, 6 Apr 2026 @12:19](https://youtu.be/vQ4ExELCJF4?t=739) |
| Gloomfire: first two hits 85–105%, third hit 255–295% | [Carguy, 7 Jul 2026 @25:50](https://youtu.be/PV46uTqg5Mg?t=1550) |
| Gloomfire: 65% adrenaline (58.5% with RoV) | [Wings of Absurdity, 6 Apr 2026 @7:25](https://youtu.be/OfXWmwLuEmY?t=445) |
| Gloomfire: 465% over 3 hits, big hit 275% | [Hexed Titan, 10 Jun 2026 @5:43](https://youtu.be/O1Fx1I4HO5w?t=343) |
| Gloomfire bugged to 409% instead of 465%; small hits ~60% instead of 85–105% | [DiamondFang, 6 Apr 2026 @17:57](https://youtu.be/vQ4ExELCJF4?t=1077) / [DiamondFang, 6 Apr 2026 @11:11](https://youtu.be/vQ4ExELCJF4?t=671) |
| Gloomfire at 1 stack cost 58.5%, refunded 15% over 3 hits, plus 5% from the PE proc | [Wings of Absurdity, 6 Apr 2026 @6:51](https://youtu.be/OfXWmwLuEmY?t=411) |
| Dark bow: 420% average over 2 hits (210% each) | [Wings of Absurdity, 6 Apr 2026 @8:29](https://youtu.be/OfXWmwLuEmY?t=509) / [Hexed Titan, 10 Jun 2026 @5:06](https://youtu.be/O1Fx1I4HO5w?t=306) |
| Decimation copies abilities onto 5 additional enemies within 3 tiles | [Carguy, 7 Jul 2026 @26:58](https://youtu.be/PV46uTqg5Mg?t=1618) |
| Decimation hits a 7x7 grid | [Wings of Absurdity, 6 Apr 2026 @11:20](https://youtu.be/OfXWmwLuEmY?t=680) |
| Decimation makes attacks AoE for the next 5–6 abilities | [Hexed Titan, 10 Jun 2026 @6:17](https://youtu.be/O1Fx1I4HO5w?t=377) |
| Saradomin bow spec: 340% damage, 40% adrenaline (36% with RoV) | [Wings of Absurdity, 6 Apr 2026 @1:43](https://youtu.be/OfXWmwLuEmY?t=103) |
| Saradomin bow (healing): 30% adrenaline (27% RoV), 135–145% damage | [Wings of Absurdity, 6 Apr 2026 @9:36](https://youtu.be/OfXWmwLuEmY?t=576) |
| Saradomin bow example: 4,634 damage heals 926 lp every 3 s over 15 s | [Wings of Absurdity, 6 Apr 2026 @9:36](https://youtu.be/OfXWmwLuEmY?t=576) |
| Guthix bow: 35% adrenaline (31.5% RoV), heals from 60% of damage dealt | [Wings of Absurdity, 6 Apr 2026 @10:45](https://youtu.be/OfXWmwLuEmY?t=645) |
| Morrigan's javelin: 50% adrenaline (45% with RoV) | [Wings of Absurdity, 6 Apr 2026 @1:10](https://youtu.be/OfXWmwLuEmY?t=70) |
| Noxious longbow spec costs 100% adrenaline | [Wings of Absurdity, 6 Apr 2026 @1:10](https://youtu.be/OfXWmwLuEmY?t=70) |
| Ful arrows: +15% damage, −10% hit chance | [Carguy, 7 Jul 2026 @30:22](https://youtu.be/PV46uTqg5Mg?t=1822) / [Hexed Titan, 10 Jun 2026 @7:25](https://youtu.be/O1Fx1I4HO5w?t=445) |
| Ful arrows only gain damage while accuracy/potential is over 95% | [DiamondFang, 6 Apr 2026 @19:35](https://youtu.be/vQ4ExELCJF4?t=1175) |
| Wen arrows: 10 stacks then a 9-second window of +30% damage | [Carguy, 7 Jul 2026 @30:55](https://youtu.be/PV46uTqg5Mg?t=1855) |
| Wen arrows: 10 stacks, then +30% damage and hit chance for the next 5 attacks | [Hexed Titan, 10 Jun 2026 @8:31](https://youtu.be/O1Fx1I4HO5w?t=511) |
| Wen stacks expire 30 s after reaching 10 | [Carguy, 7 Jul 2026 @42:42](https://youtu.be/PV46uTqg5Mg?t=2562) |
| Re-equip Wen arrows at 2.4 s left on Rapid Fire for tick-perfect coverage | [Carguy, 7 Jul 2026 @43:16](https://youtu.be/PV46uTqg5Mg?t=2596) |
| Deathspore arrows: effect has a 30-second cooldown | [Carguy, 7 Jul 2026 @30:22](https://youtu.be/PV46uTqg5Mg?t=1822) |
| Deathspore arrows need 12 stacks | [DiamondFang, 6 Apr 2026 @26:15](https://youtu.be/vQ4ExELCJF4?t=1575) / [Hexed Titan, 10 Jun 2026 @7:59](https://youtu.be/O1Fx1I4HO5w?t=479) |
| Jas dragonbane / demonbane arrows: +30% damage, +20% hit chance | [Carguy, 7 Jul 2026 @32:03](https://youtu.be/PV46uTqg5Mg?t=1923) / [Hexed Titan, 10 Jun 2026 @9:07](https://youtu.be/O1Fx1I4HO5w?t=547) |
| 15% of ammo breaks by default; −10% master ranged cape, −25% blightbound crossbows | [Qp RS, 28 Mar 2026 @1:42](https://youtu.be/3UzITrjpTIw?t=102) |
| Escape moves 8 tiles with a bow equipped, 7 by default | [Carguy, 7 Jul 2026 @1:42](https://youtu.be/PV46uTqg5Mg?t=102) |
| Blubber jellyfish cost 0 adrenaline; solid food costs 3% | [Wings of Absurdity, 24 Apr 2026 @0:00](https://youtu.be/_rXrl_xgwzs?t=0) |
| Solid food eaten during Rapid Fire dips adrenaline 100% → 97% → 100% | [Wings of Absurdity, 24 Apr 2026 @0:33](https://youtu.be/_rXrl_xgwzs?t=33) |
| Blubber jellyfish heal only 500–750 vs 2,000+ from a solid | [Wings of Absurdity, 24 Apr 2026 @0:33](https://youtu.be/_rXrl_xgwzs?t=33) |
| Natural Instinct doubles adrenaline gain from basics | [Wings of Absurdity, 24 Apr 2026 @2:48](https://youtu.be/_rXrl_xgwzs?t=168) |
| With RoV passive + Conservation of Energy + Fury of the Small you need 1 basic before Imbue: Shadows, otherwise 2 | [Wings of Absurdity, 24 Apr 2026 @3:22](https://youtu.be/_rXrl_xgwzs?t=202) |
| Qp's level-90 revolution bar does about 25% more damage than the current PVME bar | [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686) |
| Dracolich is a tier 92 bow armour set (same tier as elite Seren, which is crossbow armour) | [Carguy, 7 Jul 2026 @33:46](https://youtu.be/PV46uTqg5Mg?t=2026) |
| Vindicta killed in 50 seconds on a tier-80 weapon with no specs | [DiamondFang, 6 Apr 2026 @14:34](https://youtu.be/vQ4ExELCJF4?t=874) |
| Raksha ranged camp: ~1:15 with DiamondFang's rotation | [DiamondFang, 6 Apr 2026 @32:23](https://youtu.be/vQ4ExELCJF4?t=1943) |
| Raksha ranged camp: 1:16–1:20 on a Ful-arrow camp (1:16.8 shown) | [Carguy, 15 Mar 2026 @6:43](https://youtu.be/hkVUiN856S8?t=403) / [Carguy, 15 Mar 2026 @15:10](https://youtu.be/hkVUiN856S8?t=910) |
| HM Kerapac 2:39 kill with the improvised approach | [Wings of Absurdity, 18 Mar 2026 @12:20](https://youtu.be/mOJhIsPl9GA?t=740) |
| HM Vorago 1.5M → 543k life points in one Death's Swiftness without ECB | [Wings of Absurdity, 18 Mar 2026 @15:41](https://youtu.be/mOJhIsPl9GA?t=941) |
| ED2 Verak Lith 31-second PR with a partial Deathspore pre-build | [Wings of Absurdity, 18 Mar 2026 @17:23](https://youtu.be/mOJhIsPl9GA?t=1043) |
| Combat XP: 50 XP per 1,000 damage; split 25/25 with Defence if set to both | [Protoxx, 29 Jun 2026 @0:32](https://youtu.be/aGRV825noAo?t=32) |
| Scrimshaw of sacrifice: +50% combat XP, costs all drops, ~12M | [Protoxx, 29 Jun 2026 @2:42](https://youtu.be/aGRV825noAo?t=162) |

---

### Contradictions and dated advice

**1. Piercing Shot's Snipe cooldown reduction — 2.4 s vs 5 s.** Carguy states 2.4 s twice [Carguy, 7 Jul 2026 @3:26](https://youtu.be/PV46uTqg5Mg?t=206), [Carguy, 7 Jul 2026 @8:29](https://youtu.be/PV46uTqg5Mg?t=509); Hexed Titan (10 June, later) states 5 s [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96). No patch is cited by either. Needs checking against the live game.

**2. Corruption Shot's adrenaline cost — 20% vs 25%.** Carguy says the ability now costs 20% [Carguy, 7 Jul 2026 @13:32](https://youtu.be/PV46uTqg5Mg?t=812); DiamondFang, three months earlier, says 25% [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539). Possibly a change between April and July, possibly one of them is simply wrong.

**3. Galeshot's magnitude and shape.** Three incompatible descriptions: a flat +465 bonus damage per hit for a 6-second window [Carguy, 7 Jul 2026 @5:07](https://youtu.be/PV46uTqg5Mg?t=307); +20% per hit splat for the next 3 abilities, 4 if Rapid Fire is used [Hexed Titan, 10 Jun 2026 @1:36](https://youtu.be/O1Fx1I4HO5w?t=96); +10% for "the next few abilities" [Qp RS, 28 Mar 2026 @7:26](https://youtu.be/3UzITrjpTIw?t=446). DiamondFang describes it neutrally as a flat per-hit bonus over the next three abilities [DiamondFang, 6 Apr 2026 @4:00](https://youtu.be/vQ4ExELCJF4?t=240). All agree it is both duration- and ability-count-based (Rapid Fire extends it) and that it scales with hit-splat count. The exact number is unresolved.

**4. Death's Swiftness duration — 30.6 s (+6.6 s) vs 30 s (up to 37.8 s) vs "+7 s" for the planted-feet switch.** [DiamondFang, 6 Apr 2026 @2:20](https://youtu.be/vQ4ExELCJF4?t=140), [Hexed Titan, 10 Jun 2026 @4:29](https://youtu.be/O1Fx1I4HO5w?t=269), [Wings of Absurdity, 25 Jul 2026 @8:59](https://youtu.be/joHe24sEaDY?t=539). Likely rounding of the same underlying value, but the trainer should pick one.

**5. Snipe inside vs outside Death's Swiftness.** Wings argues Snipe is a poor DS ability: channelled, single-hit, no hit-splat synergy, and it can hit damage caps inside DS — he prefers it as a finisher outside the window, or specifically on a 3-stack proc [Wings of Absurdity, 18 Mar 2026 @21:27](https://youtu.be/mOJhIsPl9GA?t=1287). Carguy, DiamondFang, Hexed and Qp all place it inside the DS window [Carguy, 7 Jul 2026 @38:51](https://youtu.be/PV46uTqg5Mg?t=2331), [DiamondFang, 6 Apr 2026 @32:23](https://youtu.be/vQ4ExELCJF4?t=1943), [Hexed Titan, 10 Jun 2026 @10:12](https://youtu.be/O1Fx1I4HO5w?t=612), [Qp RS, 28 Mar 2026 @11:26](https://youtu.be/3UzITrjpTIw?t=686). Note that Wings' guide is 18 March, before the others.

**6. Gloomfire bow vs Dark Bow — and Carguy changed his mind mid-year.** On 15 March Carguy was still camping Dark Bow, explaining that Gloomfire's three-hit pattern broke his two-hit muscle memory and gave him a headache [Carguy, 15 Mar 2026 @10:37](https://youtu.be/hkVUiN856S8?t=637). By 7 July he had switched, calls Gloomfire stronger, and advises newcomers to learn Gloomfire directly rather than learn Dark Bow and re-learn later [Carguy, 7 Jul 2026 @25:16](https://youtu.be/PV46uTqg5Mg?t=1516), [Carguy, 7 Jul 2026 @26:24](https://youtu.be/PV46uTqg5Mg?t=1584). Wings puts Gloomfire in S tier and Dark Bow in B, and says pick Gloomfire if you must pick one [Wings of Absurdity, 6 Apr 2026 @9:03](https://youtu.be/OfXWmwLuEmY?t=543) — but in his earlier DPS guide he noted the counter-argument that Dark Bow may be better overall DPS because it works more flexibly with perfect equilibrium [Wings of Absurdity, 18 Mar 2026 @7:16](https://youtu.be/mOJhIsPl9GA?t=436). DiamondFang says Dark Bow does more damage if you ignore BoLG entirely but costs more adrenaline because it refunds one fewer hit [DiamondFang, 6 Apr 2026 @14:01](https://youtu.be/vQ4ExELCJF4?t=841).

**7. The Gloomfire bug (April 2026).** Both 6 April videos report Gloomfire's first two hits bugged low — DiamondFang measures 409% instead of 465%, says the small hits do about 60% instead of 85–105%, and adds that Jagex is aware [DiamondFang, 6 Apr 2026 @17:57](https://youtu.be/vQ4ExELCJF4?t=1077), [DiamondFang, 6 Apr 2026 @11:11](https://youtu.be/vQ4ExELCJF4?t=671); Wings confirms it as of recording [Wings of Absurdity, 6 Apr 2026 @7:25](https://youtu.be/OfXWmwLuEmY?t=445). Carguy on 7 July quotes 85–105% and 255–295% with no mention of a bug [Carguy, 7 Jul 2026 @25:50](https://youtu.be/PV46uTqg5Mg?t=1550) — consistent with a fix between April and July, but no video states the fix landed.

**8. Number of SGB specs per Death's Swiftness.** Carguy uses one per rotation [Carguy, 7 Jul 2026 @38:18](https://youtu.be/PV46uTqg5Mg?t=2298); DiamondFang says most rotations use one, though more is possible [DiamondFang, 6 Apr 2026 @13:28](https://youtu.be/vQ4ExELCJF4?t=808); Wings explicitly builds his large-target windows around fitting **two** and will skip a Galeshot to do it [Wings of Absurdity, 6 Apr 2026 @2:52](https://youtu.be/OfXWmwLuEmY?t=172), [Wings of Absurdity, 18 Mar 2026 @14:35](https://youtu.be/mOJhIsPl9GA?t=875). The 30 s cooldown against a ~37 s Greater DS window makes two possible; whether it is optimal is where they disagree.

**9. Galeshot before or after Greater Ricochet.** DiamondFang puts Gale first in low/mid-gear rotations so the seven Rico hits get the bonus, and says this ordering does not survive into endgame rotations [DiamondFang, 6 Apr 2026 @16:50](https://youtu.be/vQ4ExELCJF4?t=1010). Qp's revolution bar also puts Galeshot above Greater Ricochet, for the same reason [Qp RS, 28 Mar 2026 @9:08](https://youtu.be/3UzITrjpTIw?t=548). Carguy's endgame rotations put Greater Ricochet early (for adrenaline and stack setup) and Galeshot immediately before Rapid Fire [Carguy, 7 Jul 2026 @38:18](https://youtu.be/PV46uTqg5Mg?t=2298).

**10. The Equilibrium perk / Masterwork build.** Carguy (15 March, right after the perk arrived) declines it: Dracolich-buffed abilities beat the Equilibrium gain, he will not spend 300M on a perk likely to be adjusted, and things are up in the air [Carguy, 15 Mar 2026 @3:22](https://youtu.be/hkVUiN856S8?t=202). DiamondFang (6 April) and Hexed (10 June) both present Masterwork + Equilibrium as a legitimate tanky alternative for solo HM Vorago, solo AoD, high-enrage Arch-Glacor and HM Zamorak, while agreeing Elite Dracolich + Biting is the higher-damage option [DiamondFang, 6 Apr 2026 @29:37](https://youtu.be/vQ4ExELCJF4?t=1777), [Hexed Titan, 10 Jun 2026 @6:52](https://youtu.be/O1Fx1I4HO5w?t=412). Note the Equilibrium build also removes Shadow Tendrils' guaranteed crit [Hexed Titan, 10 Jun 2026 @3:54](https://youtu.be/O1Fx1I4HO5w?t=234), [DiamondFang, 6 Apr 2026 @6:14](https://youtu.be/vQ4ExELCJF4?t=374).

**11. Relic setup.** Carguy in March: Zerker's Fury + Font of Life, swapping to Heightened Senses for adrenaline headroom to fit double Dark Bows; he says he will move to Conservation of Energy once the spreadsheets settle [Carguy, 15 Mar 2026 @9:30](https://youtu.be/hkVUiN856S8?t=570). By July he runs COE + Zerker's Fury + Font of Life [Carguy, 7 Jul 2026 @35:29](https://youtu.be/PV46uTqg5Mg?t=2129).

**12. Wen arrows: worth it or not.** Carguy says they are strong for a pure ranged camp and line up neatly with the DS cycle, but he mostly hybrids so he skips them [Carguy, 7 Jul 2026 @31:29](https://youtu.be/PV46uTqg5Mg?t=1889), [Carguy, 7 Jul 2026 @41:38](https://youtu.be/PV46uTqg5Mg?t=2498). DiamondFang openly says he is not sure when they are worth using and mostly does not [DiamondFang, 6 Apr 2026 @27:22](https://youtu.be/vQ4ExELCJF4?t=1642). Wings camps a single arrow type and only switches for Deathspore [Wings of Absurdity, 18 Mar 2026 @1:08](https://youtu.be/mOJhIsPl9GA?t=68). Hexed frames them as min-max / accuracy-fix only [Hexed Titan, 10 Jun 2026 @9:07](https://youtu.be/O1Fx1I4HO5w?t=547). Carguy (March) says building both Wen and Deathspore stacks on a dummy is annoying and speculates it may be changed [Carguy, 15 Mar 2026 @6:43](https://youtu.be/hkVUiN856S8?t=403) — no later video reports such a change.

**13. Saradomin bow's damage spec is explicitly dated.** Wings says it fell off after the combat modernisation update and now sits in Snapshot tier for damage; only its healing use retains value [Wings of Absurdity, 6 Apr 2026 @1:43](https://youtu.be/OfXWmwLuEmY?t=103), [Wings of Absurdity, 6 Apr 2026 @9:36](https://youtu.be/OfXWmwLuEmY?t=576).

**14. Corruption Shot is dated advice in the other direction.** Carguy notes it used to be a strong basic that synergised with the rest of ranged and is now strictly a weak AoE [Carguy, 7 Jul 2026 @14:06](https://youtu.be/PV46uTqg5Mg?t=846); DiamondFang: it used to be a good filler, it is not anymore [DiamondFang, 6 Apr 2026 @8:59](https://youtu.be/vQ4ExELCJF4?t=539). Protoxx (29 June) still recommends unlocking it for AFK training XP/hr [Protoxx, 29 Jun 2026 @11:02](https://youtu.be/aGRV825noAo?t=662) — that is a training recommendation, not a PvM one, so it does not actually conflict.

**15. Caroming's role changed.** Greater Ricochet now fires seven hits by default; Caroming used to supply the extra hits and now only adds damage to the secondary hits [Carguy, 7 Jul 2026 @5:41](https://youtu.be/PV46uTqg5Mg?t=341). Carguy also suspects Aftershock 2 now beats Caroming on the BoLG, but expects an update [Carguy, 15 Mar 2026 @3:56](https://youtu.be/hkVUiN856S8?t=236).

**16. Perfect Equilibrium's history.** The proc used to copy-paste a full third hit; that was changed in the March 2024 combat update to a percentage of the triggering hit [Carguy, 7 Jul 2026 @18:32](https://youtu.be/PV46uTqg5Mg?t=1112) — pre-dates EoC 2.0 but explains why older guides overstate it.

**17. Bombardment's standing depends on whether you have Decimation.** Wings: once you have the Decimation EoF, Bombardment is a backup you press once to finish a group [Wings of Absurdity, 18 Mar 2026 @23:41](https://youtu.be/mOJhIsPl9GA?t=1421). Carguy calls it still bad but usable after its buff to a 2-tile radius [Carguy, 7 Jul 2026 @9:39](https://youtu.be/PV46uTqg5Mg?t=579). DiamondFang rates it the better of the two ranged AoE abilities [DiamondFang, 6 Apr 2026 @9:32](https://youtu.be/vQ4ExELCJF4?t=572).

#### Things the transcripts do not resolve
- The second boss Carguy names as wiping all buffs (so Death's Swiftness cannot be carried across a phase) is transcribed as "Raia" and I cannot identify it [Carguy, 7 Jul 2026 @16:17](https://youtu.be/PV46uTqg5Mg?t=977).
- The PVME rotation Carguy says uses a Zamorak bow EoF is transcribed as "Nakatrell ... or maybe the Kzam"; unidentifiable [Carguy, 7 Jul 2026 @29:17](https://youtu.be/PV46uTqg5Mg?t=1757).
- Wings' repeated "quick bow / Quigley / quicken" is almost certainly Greater Ricochet from context (it is his adrenaline-recovery button and his opener after Imbue: Shadows), but the captions never say it clearly [Wings of Absurdity, 18 Mar 2026 @9:33](https://youtu.be/mOJhIsPl9GA?t=573), [Wings of Absurdity, 18 Mar 2026 @20:51](https://youtu.be/mOJhIsPl9GA?t=1251).
- DiamondFang's "Elite Reckoning" is the Elite Dracolich armour by description (4-ability window, +40% crit after Rapid Fire, Rapid Fire generates adrenaline), but the name is garbled throughout [DiamondFang, 6 Apr 2026 @29:02](https://youtu.be/vQ4ExELCJF4?t=1742).
- The quest Wings names as the Shadow Tendrils unlock is transcribed as "the big site quest" [Wings of Absurdity, 25 Jul 2026 @8:59](https://youtu.be/joHe24sEaDY?t=539).
- Hexed's Pernix quiver passive is described as damage "when targets are below 25 HP", which is almost certainly 25% health, but the caption says HP [Hexed Titan, 10 Jun 2026 @9:40](https://youtu.be/O1Fx1I4HO5w?t=580).
- Hexed's ECB line — "lower multi-hitting hits have better effect for the next seven attacks" — is garbled and contradicts every other source (which say **more** hits give more value); do not use this figure [Hexed Titan, 10 Jun 2026 @6:17](https://youtu.be/O1Fx1I4HO5w?t=377).

---

## Magic

*Critical strikes are the adrenaline economy; Greater Concentrated Blast and Wild Magic are the loop.*


Sources (all post-update):

| ID | Author / title | Date |
|---|---|---|
| `3lxLhk4l9R8` | Carguy — "Cast FIREBALL and Much More! \| Magic DPS Guide" | 2026-07-14 |
| `KyIGNqMIj8g` | DiamondFang — "Complete Magic PVM Guide" | 2026-04-14 |
| `noJjrb0888s` | Carguy — "Can this MAGIC GEAR keep up in EoC 2.0?" (elite tectonic test) | 2026-04-22 |
| `T_y2bHBvHa8` | MrEznorbRS — "How I FINALLY FIXED my MAGIC DPS" | 2026-08-02 |
| `76-Bnr1WwRs` | Its Ya Boi Dragon — "BIS Magic DPS Rotation Guide" | 2026-06-17 |
| `QRl8NJH82nA` | Qp RS — "Updated Revolution Bar Guide 2026 Magic" | 2026-03-13 |
| `6mVcYE0iQw0` | MrEznorbRS — "This NEW Item SAVES You 5M Per Hour" (Chaotic Grimoire) | 2026-05-17 |
| `VBnnFebHlCY` | Isaac DSE — "1-120 Magic Combat Guide 2026" | 2026-05-11 |

Transcription notes: captions are auto-generated, so names are normalised here (e.g. "conc/gconc/g conk" = Greater Concentrated Blast, "asphyx/as fix/esphixxiate" = Asphyxiate, "nami" = Tsunami, "insight fear / inside fear / instant fear" = the Ancient spell whose stacks cheapen Tsunami, "Tumacin's / Tume / two Mican / tumeken's resplendent" = Tumeken's Resplendent armour, "Carropac / carry wristwraps" = Kerapac's wrist wraps, "Calgaryian / Kalgerion demon" = Kal'gerion demon). `VBnnFebHlCY` is a low-content AFK-dummy training stream and contributes almost nothing beyond one tooltip reading.

---

### Ability by ability

#### Magic (basic attack) — basic
- 9% adrenaline, 90–110% ability damage; unlike the melee/ranged basic attack it fires whatever combat spell is auto-cast, so magic's basic attack is customisable [Carguy, 14 Jul 2026 @1:06](https://youtu.be/3lxLhk4l9R8?t=66).
- Carguy re-tested the old discrepancy where a keybound basic attack hit for less than casting the spell directly, and found the two now hit the same value [Carguy, 14 Jul 2026 @1:40](https://youtu.be/3lxLhk4l9R8?t=100).
- Only the basic *attack* (not basic abilities) benefits from the Invigorating perk's flat 20% adrenaline bonus; stacked with Fury of the Small and Impatient a single basic attack can reach 15.6% adrenaline, averaging around 13% [Qp RS, 13 Mar 2026 @2:15](https://youtu.be/QRl8NJH82nA?t=135).
- Revolution: it is what fires when nothing else on the bar is ready; QP's level-1 bar is empty by design [Qp RS, 13 Mar 2026 @5:03](https://youtu.be/QRl8NJH82nA?t=303).

#### Greater Sonic Wave — basic
- 115–135% magic damage, 9% adrenaline, 15-second cooldown [Carguy, 14 Jul 2026 @2:14](https://youtu.be/3lxLhk4l9R8?t=134).
- On cast it applies a 9-second self buff: the **next enhanced or ultimate ability costs 20% less adrenaline**. Basics do **not** consume or proc the buff, so pressing a basic after it is not a free adrenaline trick — it is simply wasted if the window expires [Carguy, 14 Jul 2026 @2:48](https://youtu.be/3lxLhk4l9R8?t=168).
- Ungreatered Sonic Wave only saves 10%; DiamondFang treats the greater codex as an early must-buy (easy for ironmen from normal-mode Kerapac) [DiamondFang, 14 Apr 2026 @4:29](https://youtu.be/KyIGNqMIj8g?t=269).
- QP frames it as "effectively giving you 30% adrenaline for casting it" (9% gained + 20% saved) and calls the adrenaline rework magic's biggest change [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33).
- Combo: press it immediately before Sunshine, Tsunami, Omnipower or Asphyxiate. Runic Charge upgrades the saving from 20% to 45% [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212) [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302) [Qp RS, 13 Mar 2026 @3:23](https://youtu.be/QRl8NJH82nA?t=203). MrEznorb opens Greater Sonic Wave → Sunshine specifically to make Sunshine cheap [MrEznorbRS, 2 Aug 2026 @8:26](https://youtu.be/T_y2bHBvHa8?t=506).
- Revolution: from level 6, place it at the **start** of the bar [Qp RS, 13 Mar 2026 @5:36](https://youtu.be/QRl8NJH82nA?t=336).

#### Dragon Breath — basic
- Cone AoE in front of the player (roughly 45° either side of your facing), hitting up to 4 additional enemies. Carguy compares it to the old melee Cleave and warns the target selection is buggy — expect trial and error before relying on the cone [Carguy, 14 Jul 2026 @3:22](https://youtu.be/3lxLhk4l9R8?t=202) [Carguy, 14 Jul 2026 @3:54](https://youtu.be/3lxLhk4l9R8?t=234).
- Deals an extra 25% damage against a target that is **Combusted** [Carguy, 14 Jul 2026 @3:54](https://youtu.be/3lxLhk4l9R8?t=234) [Qp RS, 13 Mar 2026 @7:19](https://youtu.be/QRl8NJH82nA?t=439).
- With Runic Charge it becomes a 260–310% ability [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212). DiamondFang says the Runic-charged version "almost doubles its damage" but that it drops out of rotations as your gear improves [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302).
- DiamondFang also lists it as synergising with Kerapac's wrist wraps and Combust [DiamondFang, 14 Apr 2026 @4:29](https://youtu.be/KyIGNqMIj8g?t=269).
- Revolution: from level 19 it goes at the **start of the AoE bar**; it changes little for single-target bars at that level [Qp RS, 13 Mar 2026 @6:09](https://youtu.be/QRl8NJH82nA?t=369).

#### Combust — basic (damage over time)
- 10 hits, one every 1.8 seconds (one global cooldown apart). Low damage per hit, but a good return for a single button press since you fire and forget [Carguy, 14 Jul 2026 @4:27](https://youtu.be/3lxLhk4l9R8?t=267) [Carguy, 14 Jul 2026 @5:00](https://youtu.be/3lxLhk4l9R8?t=300).
- Jagex labels it a "burn"; Carguy says burn/bleed/DoT currently behave identically outside of tooltips [Carguy, 14 Jul 2026 @4:27](https://youtu.be/3lxLhk4l9R8?t=267).
- Mistakes called out: bleeds are **not boosted by Sunshine**, cannot crit (so they feed neither the FSOA extra hits nor Tsunami's adrenaline), and in teams your Combust gets overridden by other players' [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302). QP adds: drop it from the bar if targets die before three ticks land [Qp RS, 13 Mar 2026 @7:19](https://youtu.be/QRl8NJH82nA?t=439).
- They *are* boosted by the Roar of Awakening / Ode to Deceit dual wield, and the wand special's Conflagrate window makes the next Combust hit 40% harder [Carguy, 14 Jul 2026 @32:08](https://youtu.be/3lxLhk4l9R8?t=1928) [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302).
- Combo: Combust → Dragon Breath (for the 25% bonus); wand special → Combust (Conflagrate). DiamondFang uses Combust inside Sunshine only because the wand/orb passive is still boosting it [DiamondFang, 14 Apr 2026 @12:17](https://youtu.be/KyIGNqMIj8g?t=737).
- Revolution: single-target bar from level 38 [Qp RS, 13 Mar 2026 @7:19](https://youtu.be/QRl8NJH82nA?t=439); on AoE bars place it before Wild Magic so Greater Chain sometimes copies it [Qp RS, 13 Mar 2026 @8:26](https://youtu.be/QRl8NJH82nA?t=506).

#### Impact — basic (utility stun)
- Magic's stun/bind, the equivalent of Backhand and Binding Shot. Two charges: fire both back-to-back and wait 15 seconds, or fire one, wait 5, fire the other; a spent charge starts refilling after 10 seconds and the second still needs its own 5 [Carguy, 14 Jul 2026 @5:33](https://youtu.be/3lxLhk4l9R8?t=333). (The transcript's charge/cooldown wording is loose — treat these three numbers as unreliable.)
- Compatible with the Flanking perk [Carguy, 14 Jul 2026 @5:33](https://youtu.be/3lxLhk4l9R8?t=333).
- Only pressed for mechanics. DiamondFang notes Asphyxiate also stuns, so Asphyxiate often covers the same need, but Impact chained through Greater Chain can stun a whole pack (e.g. Amascut scarabs) [DiamondFang, 14 Apr 2026 @6:43](https://youtu.be/KyIGNqMIj8g?t=403).
- Revolution: **exclude it** — QP says it hits for less than the basic attack [Qp RS, 13 Mar 2026 @6:46](https://youtu.be/QRl8NJH82nA?t=406).

#### Greater Chain — basic (AoE)
- Hits the main target and tags up to 6 additional enemies within 5 tiles; the **next** ability then deals 50% of its damage to every tagged target [Carguy, 14 Jul 2026 @6:05](https://youtu.be/3lxLhk4l9R8?t=365). DiamondFang says up to seven targets, and 70% instead of 50% with Caroming 4 [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369).
- Its own damage is weak at 80–100% [Carguy, 14 Jul 2026 @6:40](https://youtu.be/3lxLhk4l9R8?t=400).
- Classic combo: Greater Chain → Omnipower to clear a room [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369).
- Mistake called out: picking a nearly-dead mob as the chain anchor — if it dies you waste the whole setup. Carguy admits doing this repeatedly [Carguy, 14 Jul 2026 @7:13](https://youtu.be/3lxLhk4l9R8?t=433).
- Revolution: AoE bar only, from level 51 (ungreatered Chain hits two extra targets); always follow it with a strong ability on the bar. The greater codex is expensive and is a late purchase [Qp RS, 13 Mar 2026 @7:52](https://youtu.be/QRl8NJH82nA?t=472) [Qp RS, 13 Mar 2026 @8:26](https://youtu.be/QRl8NJH82nA?t=506).

#### Greater Concentrated Blast — basic (the core basic)
- Three hits on three consecutive game ticks, 40–50% each, 120–150% total. Carguy calls it a contender for the strongest basic in the game [Carguy, 14 Jul 2026 @7:13](https://youtu.be/3lxLhk4l9R8?t=433) [Carguy, 14 Jul 2026 @7:47](https://youtu.be/3lxLhk4l9R8?t=467).
- The reason it matters is the completion buff: **+21% critical strike chance on the next ability** (15% for the ungreatered version) [Carguy, 14 Jul 2026 @7:47](https://youtu.be/3lxLhk4l9R8?t=467) [DiamondFang, 14 Apr 2026 @2:15](https://youtu.be/KyIGNqMIj8g?t=135).
- With Runic Charge each of its attacks grants an additional 10% crit chance [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246); DiamondFang states the resulting figure as 51% crit chance on the next ability, enough to effectively guarantee a crit [DiamondFang, 14 Apr 2026 @2:15](https://youtu.be/KyIGNqMIj8g?t=135).
- Combos: Runic Charge + Greater Concentrated Blast → Omnipower is the signature magic burst [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246) [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539) [Its Ya Boi Dragon, 17 Jun 2026 @3:41](https://youtu.be/76-Bnr1WwRs?t=221). The default filler loop is Greater Concentrated Blast → Wild Magic, repeated; DiamondFang says you can fit it in every third ability [DiamondFang, 14 Apr 2026 @2:49](https://youtu.be/KyIGNqMIj8g?t=169).
- Mistake called out: putting it in front of Asphyxiate only buffs Asphyxiate's **first** hit — Carguy still does it as a marginal gain, but it is not the same value as buffing Omnipower [Carguy, 14 Jul 2026 @40:34](https://youtu.be/3lxLhk4l9R8?t=2434). MrEznorb notes you should not reflexively press it between every pair of abilities — use it when the *next* ability specifically needs to crit [MrEznorbRS, 2 Aug 2026 @13:28](https://youtu.be/T_y2bHBvHa8?t=808).
- Buy priority: Carguy calls the codex the single biggest purchase when getting into magic, roughly 10–20M [Carguy, 14 Jul 2026 @8:20](https://youtu.be/3lxLhk4l9R8?t=500); QP quotes ~15M [Qp RS, 13 Mar 2026 @9:33](https://youtu.be/QRl8NJH82nA?t=573); DiamondFang says get it first, and free-ish from normal-mode Kerapac for ironmen [DiamondFang, 14 Apr 2026 @9:31](https://youtu.be/KyIGNqMIj8g?t=571).
- Revolution: both single-target and AoE bars from level 66 [Qp RS, 13 Mar 2026 @9:33](https://youtu.be/QRl8NJH82nA?t=573).

#### Wild Magic — enhanced
- Single-GCD ability firing two hits, 5.4-second cooldown. Each hit carries a built-in +10% crit chance and +20% crit damage, so the second hit lands harder than the first [Carguy, 14 Jul 2026 @8:52](https://youtu.be/3lxLhk4l9R8?t=532) [Carguy, 14 Jul 2026 @9:27](https://youtu.be/3lxLhk4l9R8?t=567).
- The default adrenaline spender; DiamondFang builds the whole rotation around Greater Concentrated Blast → Wild Magic on a three-ability cycle [DiamondFang, 14 Apr 2026 @2:49](https://youtu.be/KyIGNqMIj8g?t=169).
- Gear synergy: Blast Diffusion Boots give +8% base damage on basic magic abilities after casting Wild Magic, which lines up perfectly with a Wild Magic → Greater Concentrated Blast → EOF loop [Carguy, 22 Apr 2026 @2:44](https://youtu.be/noJjrb0888s?t=164) [Carguy, 22 Apr 2026 @7:45](https://youtu.be/noJjrb0888s?t=465).
- Comparison: Carguy will not press the Gothic staff EOF because Wild Magic costs the same adrenaline and hits harder [Carguy, 14 Jul 2026 @37:13](https://youtu.be/3lxLhk4l9R8?t=2233).
- Revolution: unlocked level 3, and it is the entire early bar [Qp RS, 13 Mar 2026 @5:03](https://youtu.be/QRl8NJH82nA?t=303).

#### Asphyxiate — enhanced (channel)
- With the full Tumeken's Resplendent set: eight hits, one per game tick (behaving like Ranged's Rapid Fire), followed by a **+35% critical strike damage** window [Carguy, 14 Jul 2026 @9:27](https://youtu.be/3lxLhk4l9R8?t=567) [Carguy, 14 Jul 2026 @9:59](https://youtu.be/3lxLhk4l9R8?t=599). DiamondFang adds that the buff window is also longer with the set — he states 9 seconds [DiamondFang, 14 Apr 2026 @15:39](https://youtu.be/KyIGNqMIj8g?t=939).
- Without the set: four hits on every other tick, and the follow-up window is only 3.6 seconds at +15% crit damage [Carguy, 14 Jul 2026 @9:59](https://youtu.be/3lxLhk4l9R8?t=599) [Carguy, 14 Jul 2026 @10:34](https://youtu.be/3lxLhk4l9R8?t=634). DiamondFang says that without Tumeken's it is often better cancelled as a three-tick channel [DiamondFang, 14 Apr 2026 @3:22](https://youtu.be/KyIGNqMIj8g?t=202).
- It also stuns and binds the target for the channel [DiamondFang, 14 Apr 2026 @6:43](https://youtu.be/KyIGNqMIj8g?t=403) [Isaac DSE, 11 May 2026 @7:52](https://youtu.be/VBnnFebHlCY?t=472).
- When to press: full-channel it, then spend the crit-damage window on your biggest hits. Elite-tectonic practice — because the window is only 3.6 seconds — is to go straight into Runic Charge + Greater Concentrated Blast → Omnipower the instant it ends [Carguy, 22 Apr 2026 @3:52](https://youtu.be/noJjrb0888s?t=232) [Carguy, 22 Apr 2026 @4:26](https://youtu.be/noJjrb0888s?t=266). Its Ya Boi Dragon calls this phase "Tumeken's Channelled Might" [Its Ya Boi Dragon, 17 Jun 2026 @3:41](https://youtu.be/76-Bnr1WwRs?t=221).
- Gear-dependent verdict: Carguy dropped the *second* Asphyxiate entirely on elite tectonic, but keeps both on best-in-slot — at Kerapac the second one matters as much for the extra stun (preventing his specials) as for damage [Carguy, 22 Apr 2026 @3:52](https://youtu.be/noJjrb0888s?t=232) [Carguy, 22 Apr 2026 @12:14](https://youtu.be/noJjrb0888s?t=734). He says the gap between Tumeken's and elite tectonic is felt most on long fights with large HP pools such as Nakatra [Carguy, 22 Apr 2026 @12:46](https://youtu.be/noJjrb0888s?t=766) [Carguy, 22 Apr 2026 @13:18](https://youtu.be/noJjrb0888s?t=798).
- Dragon says his whole rotation's damage variance comes down to Asphyxiate [Its Ya Boi Dragon, 17 Jun 2026 @9:13](https://youtu.be/76-Bnr1WwRs?t=553).
- Revolution: QP puts it at the **end** of the single-target bar (level 59) purely as an adrenaline dump, judging it more adrenaline-efficient than Omnipower but too slow versus Wild Magic [Qp RS, 13 Mar 2026 @8:59](https://youtu.be/QRl8NJH82nA?t=539). Note this is the earliest video and the harshest verdict on the ability — see Contradictions.

#### Smoke Tendrils — enhanced (channel)
- Four hits over 4.2 seconds, each stronger than the last, and **every hit is a guaranteed critical strike** [Carguy, 14 Jul 2026 @11:07](https://youtu.be/3lxLhk4l9R8?t=667). DiamondFang describes it as an eight-tick channel with four hits [DiamondFang, 14 Apr 2026 @3:56](https://youtu.be/KyIGNqMIj8g?t=236).
- Adrenaline-neutral: it neither grants nor costs adrenaline [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700) [Qp RS, 13 Mar 2026 @10:07](https://youtu.be/QRl8NJH82nA?t=607). In practice it *does* generate adrenaline indirectly, because guaranteed crits under Tsunami each pay 8% [DiamondFang, 14 Apr 2026 @3:56](https://youtu.be/KyIGNqMIj8g?t=236) [DiamondFang, 14 Apr 2026 @10:04](https://youtu.be/KyIGNqMIj8g?t=604).
- Why it matters at high gear: guaranteed crits mean guaranteed FSOA extra hits, and under the Asphyxiate crit-damage window every one of them is inflated [DiamondFang, 14 Apr 2026 @3:56](https://youtu.be/KyIGNqMIj8g?t=236) [Its Ya Boi Dragon, 17 Jun 2026 @3:41](https://youtu.be/76-Bnr1WwRs?t=221).
- Cancelling: DiamondFang uses a three-tick or five-tick tendrils as a partial channel for adrenaline [DiamondFang, 14 Apr 2026 @10:04](https://youtu.be/KyIGNqMIj8g?t=604) [DiamondFang, 14 Apr 2026 @17:19](https://youtu.be/KyIGNqMIj8g?t=1039); Dragon cancels it with 0.6 seconds left into Greater Concentrated Blast → Wild Magic [Its Ya Boi Dragon, 17 Jun 2026 @6:26](https://youtu.be/76-Bnr1WwRs?t=386).
- Dissent: Carguy no longer presses it — he says it feels "completely limp" and he would rather spam EOF specials, while conceding the spreadsheets still rate it [Carguy, 14 Jul 2026 @10:34](https://youtu.be/3lxLhk4l9R8?t=634) [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700) [Carguy, 22 Apr 2026 @8:18](https://youtu.be/noJjrb0888s?t=498). He does recommend it for anyone **below** best-in-slot [Carguy, 22 Apr 2026 @7:45](https://youtu.be/noJjrb0888s?t=465).
- Revolution: single-target bar from level 75; QP notes its value scales with your crit damage bonus [Qp RS, 13 Mar 2026 @10:07](https://youtu.be/QRl8NJH82nA?t=607).

#### Magma Tempest — enhanced (AoE)
- Creates a 5×5 area on the target, hitting every 1.2 seconds for eight hits, and can hit up to 25 separate enemies — the highest target cap Carguy knows of [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700) [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733). DiamondFang: 16 ticks, eight hits [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369).
- **Changed by the update**: it used to grant 8% adrenaline as a basic; it now *costs* 20% adrenaline [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733) [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33).
- It cannot crit, so it feeds neither the FSOA nor Tsunami [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369) [Qp RS, 13 Mar 2026 @11:14](https://youtu.be/QRl8NJH82nA?t=674).
- Verdict: Carguy treats it as a Slayer/AFK-revolution ability and says the only time he presses it in PvM is by mistake [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733) [Carguy, 14 Jul 2026 @12:48](https://youtu.be/3lxLhk4l9R8?t=768). DiamondFang keeps it for AoE and for chipping at phase-immune enemies [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369).
- Revolution: QP excludes it from single-target bars (level 85, codex-gated) but rates it strongly for AoE [Qp RS, 13 Mar 2026 @11:14](https://youtu.be/QRl8NJH82nA?t=674).

#### Corruption Blast — enhanced (AoE damage over time)
- Initial hit then a draining DoT that spreads to targets touching the main one [Carguy, 14 Jul 2026 @12:48](https://youtu.be/3lxLhk4l9R8?t=768) [Carguy, 14 Jul 2026 @13:23](https://youtu.be/3lxLhk4l9R8?t=803). DiamondFang: five hits over ten ticks [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369).
- **Changed by the update** the same way as Magma Tempest: it now costs 20% adrenaline instead of being an adrenaline-gaining basic [Carguy, 14 Jul 2026 @12:48](https://youtu.be/3lxLhk4l9R8?t=768) [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33).
- Verdict: Slayer/AoE only. Carguy says the damage does not justify the GCD plus 20% adrenaline for single-target PvM [Carguy, 14 Jul 2026 @13:23](https://youtu.be/3lxLhk4l9R8?t=803); DiamondFang calls it mostly a waste of adrenaline outside a dedicated bleed build [DiamondFang, 14 Apr 2026 @6:43](https://youtu.be/KyIGNqMIj8g?t=403).
- Niche use: one Corruption Blast into a pack builds Roar of Awakening / Ode to Deceit bleed stacks very quickly [Carguy, 14 Jul 2026 @33:50](https://youtu.be/3lxLhk4l9R8?t=2030) [Carguy, 14 Jul 2026 @34:25](https://youtu.be/3lxLhk4l9R8?t=2065).
- Revolution: AoE bar only, level 70, Mazcab codex required [Qp RS, 13 Mar 2026 @10:07](https://youtu.be/QRl8NJH82nA?t=607).

#### Omnipower — ultimate
- The single biggest-hitting ability magic has [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101). Carguy: without the TzKal-Zuk cape it is one hit of 420–500%; with the cape it becomes four hits of 120–150%, which is both more total damage and four separate crit rolls, and it dodges the hit cap that a single mega-hit runs into [Carguy, 14 Jul 2026 @13:56](https://youtu.be/3lxLhk4l9R8?t=836) [Carguy, 14 Jul 2026 @14:29](https://youtu.be/3lxLhk4l9R8?t=869). (Carguy misspeaks "if you're **not** wearing the cape" for the four-hit case; the surrounding argument makes clear the four-hit version is the cape version.)
- Adrenaline cost and cooldown are unchanged by the cape [Carguy, 14 Jul 2026 @13:56](https://youtu.be/3lxLhk4l9R8?t=836). QP gives the cost as 60% adrenaline [Qp RS, 13 Mar 2026 @5:36](https://youtu.be/QRl8NJH82nA?t=336).
- **When you press it**: after a Runic-charged Greater Concentrated Blast, ideally also inside the Asphyxiate crit-damage window and inside Sunshine. Every hit that crits also procs an FSOA lightning hit, so a fully critting Omnipower is up to four extra hits [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101). MrEznorb reports this combo hitting up to 60,000 [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539).
- Carguy's fallback: if Omnipower is not available at that point in the rotation, press an EOF special there instead [Carguy, 14 Jul 2026 @42:13](https://youtu.be/3lxLhk4l9R8?t=2533).
- Revolution: unlocked level 12, placed at the **end** of the bar so it only fires on an adrenaline surplus [Qp RS, 13 Mar 2026 @5:36](https://youtu.be/QRl8NJH82nA?t=336).

#### Greater Sunshine — ultimate (the damage window)
- +50% damage for 37.8 seconds inside a 7×7 planted area, plus small hits of 10–20% every 1.8 seconds on targets inside it. Cooldown 1 minute [Carguy, 14 Jul 2026 @15:03](https://youtu.be/3lxLhk4l9R8?t=903) [Carguy, 14 Jul 2026 @15:36](https://youtu.be/3lxLhk4l9R8?t=936) [Carguy, 14 Jul 2026 @16:08](https://youtu.be/3lxLhk4l9R8?t=968). DiamondFang: base duration 30.6 seconds, extended to 37.8 by Planted Feet **or** the Greater codex [DiamondFang, 14 Apr 2026 @1:07](https://youtu.be/KyIGNqMIj8g?t=67).
- **It stayed a ground-planted effect** — unlike Greater Death's Swiftness it did not become a self-buff, so plant it where the boss actually is or you get none of the benefit [Carguy, 14 Jul 2026 @15:36](https://youtu.be/3lxLhk4l9R8?t=936).
- With Tumeken's Resplendent you gain extra crit chance only while standing inside it (Carguy's caption reads "7 12%", DiamondFang says 7.5% — treat the exact figure as unresolved); elite tectonic's 6% crit chance is always on instead [Carguy, 14 Jul 2026 @15:03](https://youtu.be/3lxLhk4l9R8?t=903) [Carguy, 14 Jul 2026 @16:08](https://youtu.be/3lxLhk4l9R8?t=968) [DiamondFang, 14 Apr 2026 @1:07](https://youtu.be/KyIGNqMIj8g?t=67).
- Everything is built around it: "this is what all rotations are centered around" [Carguy, 14 Jul 2026 @16:08](https://youtu.be/3lxLhk4l9R8?t=968). DiamondFang's rule outside Sunshine is that your priority is always getting back to the next Sunshine [DiamondFang, 14 Apr 2026 @17:52](https://youtu.be/KyIGNqMIj8g?t=1072).
- Costs 100% adrenaline base, reducible to as low as 35% with stacked savings [Qp RS, 13 Mar 2026 @2:47](https://youtu.be/QRl8NJH82nA?t=167). Temporal Anomaly explicitly cannot reset it [Carguy, 14 Jul 2026 @27:00](https://youtu.be/3lxLhk4l9R8?t=1620).
- Revolution: both bars from level 76 [Qp RS, 13 Mar 2026 @10:41](https://youtu.be/QRl8NJH82nA?t=641).

#### Tsunami — ultimate (adrenaline engine)
- 225–275% magic damage, hitting a 3×3 in front of you (still usable at max cast distance against a single target) [Carguy, 14 Jul 2026 @16:44](https://youtu.be/3lxLhk4l9R8?t=1004) [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040).
- The reason to press it: for 30 seconds **every critical strike grants an extra 8% adrenaline** [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040) [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101) [Qp RS, 13 Mar 2026 @3:57](https://youtu.be/QRl8NJH82nA?t=237). This is why magic's whole build is crit-focused — no crits means no adrenaline [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101) [MrEznorbRS, 2 Aug 2026 @2:16](https://youtu.be/T_y2bHBvHa8?t=136) [MrEznorbRS, 17 May 2026 @0:32](https://youtu.be/6mVcYE0iQw0?t=32).
- Carguy: the Tsunami window plus Greater Concentrated Blast is what gives magic "borderline infinite adrenaline" [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040).
- Cost: 100% base, dropping to 40% with five Insight Fear stacks plus Conservation of Energy and Ring of Vigor [Carguy, 14 Jul 2026 @17:55](https://youtu.be/3lxLhk4l9R8?t=1075). MrEznorb's rule is to have at least four or five stacks before casting it [MrEznorbRS, 2 Aug 2026 @5:38](https://youtu.be/T_y2bHBvHa8?t=338) [MrEznorbRS, 2 Aug 2026 @6:11](https://youtu.be/T_y2bHBvHa8?t=371).
- Runic-charged Greater Sonic Wave into Tsunami can actually **net you adrenaline** [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212).
- It is a good stall candidate: DiamondFang stalls a Tsunami at Wars Retreat, re-fills adrenaline, then releases it into the opening Sunshine [DiamondFang, 14 Apr 2026 @15:39](https://youtu.be/KyIGNqMIj8g?t=939) [DiamondFang, 14 Apr 2026 @16:45](https://youtu.be/KyIGNqMIj8g?t=1005).
- Revolution: immediately after Sunshine on both bars, level 90 [Qp RS, 13 Mar 2026 @11:49](https://youtu.be/QRl8NJH82nA?t=709).

#### Runic Charge — utility
- Self-buff, 30-second cooldown, **off the global cooldown**. Carguy's mental model: press it a fraction before the ability you want to charge, exactly like combo-eating; the rotation's rhythm does not change [Carguy, 14 Jul 2026 @18:29](https://youtu.be/3lxLhk4l9R8?t=1109) [Carguy, 14 Jul 2026 @19:06](https://youtu.be/3lxLhk4l9R8?t=1146). DiamondFang calls it the only utility ability in the game and compares it to a sigil [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302).
- You must **choose one** of three targets, and the choice is the interesting decision:
  - Greater Sonic Wave → next ability costs 45% less adrenaline [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212).
  - Dragon Breath → 260–310% ability damage [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212).
  - Greater Concentrated Blast → extra 10% crit chance per attack, effectively guaranteeing the next ability crits [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246).
- Practical usage: the Greater Concentrated Blast version, held for Omnipower, is the standard [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246) [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539). Use the Greater Sonic Wave version instead when you need to afford Sunshine or Tsunami without an adrenaline potion [Carguy, 14 Jul 2026 @43:19](https://youtu.be/3lxLhk4l9R8?t=2599) [DiamondFang, 14 Apr 2026 @10:04](https://youtu.be/KyIGNqMIj8g?t=604). The Dragon Breath version is a low-gear option that falls off [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302).
- MrEznorb states you have 15 seconds after pressing it to use the charged basic [MrEznorbRS, 2 Aug 2026 @7:17](https://youtu.be/T_y2bHBvHa8?t=437) — no other video gives a window length; unverified.
- Revolution: **cannot** be triggered by revolution; cast it manually. QP calls it a good first step towards manual input, unlocked level 26 [Qp RS, 13 Mar 2026 @6:09](https://youtu.be/QRl8NJH82nA?t=369).

#### Surge — utility
- Instant 10-tile movement, no damage role; it lives in the magic book for historical reasons [Carguy, 14 Jul 2026 @18:29](https://youtu.be/3lxLhk4l9R8?t=1109).
- Relevant to rotations because Surge does **not** break a stalled ability (nor do Escape, Blade Dive, or Necromancy incantations) [DiamondFang, 14 Apr 2026 @16:12](https://youtu.be/KyIGNqMIj8g?t=972) [Carguy, 14 Jul 2026 @42:13](https://youtu.be/3lxLhk4l9R8?t=2533).

---

### Rotations

#### Carguy — Sunshine with an adrenaline renewal flask (best-in-slot: Tumeken's, FSOA, Zuk cape, Kal'gerion demon, Grimoire, Conservation of Energy) [Carguy, 14 Jul 2026 @40:00](https://youtu.be/3lxLhk4l9R8?t=2400) [Carguy, 14 Jul 2026 @40:34](https://youtu.be/3lxLhk4l9R8?t=2434)
1. Greater Sunshine
2. Drink adrenaline renewal potion
3. Greater Concentrated Blast
4. Greater Sonic Wave
5. Tsunami
6. FSOA special attack
7. Asphyxiate (full channel)
8. Wild Magic
9. Runic Charge + Greater Concentrated Blast
10. Omnipower
11. Wild Magic
12. EOF special (Legatus Ember staff)
13. Greater Concentrated Blast → Wild Magic
14. EOF special
15. Greater Concentrated Blast → Asphyxiate (he notes this only buffs the first Asphyxiate hit, but takes it)
16. Wild Magic → EOF special

Carguy stresses these are his working rotations, not solved optimums, and expects you to bend them to the boss [Carguy, 14 Jul 2026 @39:28](https://youtu.be/3lxLhk4l9R8?t=2368).

#### Carguy — Sunshine without an adrenaline potion, with a stalled wand special [Carguy, 14 Jul 2026 @41:39](https://youtu.be/3lxLhk4l9R8?t=2499) [Carguy, 14 Jul 2026 @42:13](https://youtu.be/3lxLhk4l9R8?t=2533) [Carguy, 14 Jul 2026 @42:46](https://youtu.be/3lxLhk4l9R8?t=2566)
Pre-fight, at Wars Retreat: Combust a dummy to build Ode to Deceit / Roar of Awakening bleed stacks, then stall the wand special, take the adrenaline crystal, and travel to the boss without dropping the stall.
1. Target-cycle to release the stalled wand special
2. Greater Sunshine
3. Greater Concentrated Blast
4. Runic Charge + Greater Sonic Wave
5. Tsunami
6. FSOA special attack (**equip the FSOA before the Asphyxiate**)
7. Asphyxiate
8. Wild Magic
9. Greater Concentrated Blast → Omnipower (substitute an EOF special if Omnipower is unavailable)
10. Wild Magic → Greater Concentrated Blast → EOF special (repeat this Wild Magic / G-conc / EOF filler)
11. Second Asphyxiate
12. Runic Charge (now off cooldown) into Wild Magic or an EOF special

Why the stall: the stalled wand hit counts as an Insight Fear stack, so a single Greater Concentrated Blast plus a Runic-charged Greater Sonic Wave gets you to five stacks and the cheapest possible Tsunami [Carguy, 14 Jul 2026 @43:19](https://youtu.be/3lxLhk4l9R8?t=2599) [Carguy, 14 Jul 2026 @43:54](https://youtu.be/3lxLhk4l9R8?t=2634). He also suggests holding a stalled wand special for a specific damage check, e.g. securing the Raksha pool skip toward a 600k target [Carguy, 14 Jul 2026 @41:07](https://youtu.be/3lxLhk4l9R8?t=2467).

When you will not have an adrenaline potion: your second Sunshine, because the potion is on a 2-minute cooldown against Sunshine's 1 minute; or when you deliberately save the potion for a hybrid phase [Carguy, 14 Jul 2026 @43:54](https://youtu.be/3lxLhk4l9R8?t=2634) [Carguy, 14 Jul 2026 @44:27](https://youtu.be/3lxLhk4l9R8?t=2667).

#### DiamondFang — entry-level rotation (no FSOA, has Greater Concentrated Blast, Conservation of Energy, adrenaline potion) [DiamondFang, 14 Apr 2026 @9:31](https://youtu.be/KyIGNqMIj8g?t=571) [DiamondFang, 14 Apr 2026 @10:04](https://youtu.be/KyIGNqMIj8g?t=604) [DiamondFang, 14 Apr 2026 @10:37](https://youtu.be/KyIGNqMIj8g?t=637)
1. Runic Charge + Greater Sonic Wave → Greater Sunshine (the charged Sonic Wave pays for Sunshine)
2. Greater Concentrated Blast → Tsunami
3. Full Asphyxiate → Greater Concentrated Blast → Wild Magic
4. Three-tick Smoke Tendrils (for adrenaline) → Greater Concentrated Blast → Wild Magic
5. Pre-cast Greater Sonic Wave → Greater Concentrated Blast → Omnipower (the pre-cast Sonic Wave is what makes the Omnipower affordable)
6. Combust (filler) → Greater Concentrated Blast → Runic Charge + Dragon Breath
7. Asphyxiate → Greater Concentrated Blast → Wild Magic

He flags step 7 as uncertain — with both Conservation of Energy and Greater Concentrated Blast you can probably spend the Runic Charge on the G-conc + Wild Magic instead [DiamondFang, 14 Apr 2026 @10:37](https://youtu.be/KyIGNqMIj8g?t=637). He also says magic felt the weakest of melee/magic/ranged at this gear level, precisely because low crit chance starves adrenaline [DiamondFang, 14 Apr 2026 @9:31](https://youtu.be/KyIGNqMIj8g?t=571).

#### DiamondFang — mid-game with Ode to Deceit + Roar of Awakening, tectonic, blast diffusion boots (~500M) [DiamondFang, 14 Apr 2026 @11:43](https://youtu.be/KyIGNqMIj8g?t=703) [DiamondFang, 14 Apr 2026 @12:17](https://youtu.be/KyIGNqMIj8g?t=737) [DiamondFang, 14 Apr 2026 @12:51](https://youtu.be/KyIGNqMIj8g?t=771)
1. Runic Charge + Greater Concentrated Blast
2. Wand special (**before** Sunshine — its bleed does not benefit from Sunshine anyway)
3. Greater Sunshine → Greater Concentrated Blast → adrenaline potion → Tsunami
4. Three-tick Asphyxiate (he did not judge a full channel worth it without Tumeken's)
5. Greater Concentrated Blast → Wild Magic → Combust → Greater Concentrated Blast → Wild Magic
6. Greater Concentrated Blast → Omnipower
7. Smoke Tendrils (adrenaline) → Greater Concentrated Blast → Wild Magic
8. Asphyxiate → Greater Concentrated Blast → Wild Magic
9. Combust → Greater Concentrated Blast → Wild Magic
10. Runic Charge + Dragon Breath to finish

#### DiamondFang — FSOA + elite tectonic [DiamondFang, 14 Apr 2026 @13:25](https://youtu.be/KyIGNqMIj8g?t=805) [DiamondFang, 14 Apr 2026 @14:31](https://youtu.be/KyIGNqMIj8g?t=871) [DiamondFang, 14 Apr 2026 @15:05](https://youtu.be/KyIGNqMIj8g?t=905)
Gear assumed: FSOA (~1.5B), Reaver's or Channeller's ring, Kal'gerion demon, Airut scrimshaw in the pocket slot, Smoke Cloud applied.
1. Runic Charge + Greater Concentrated Blast → wand special → Smoke Cloud on the boss
2. Greater Sunshine → Greater Concentrated Blast → Tsunami
3. FSOA special attack
4. Greater Concentrated Blast → Wild Magic
5. Combust → Greater Concentrated Blast → Wild Magic
6. Three-tick Smoke Tendrils (harvest FSOA procs off the guaranteed crits) → Greater Concentrated Blast → Wild Magic
7. Full Asphyxiate
8. Runic Charge + Greater Concentrated Blast → Omnipower (near-guaranteed crit)
9. Legatus Ember staff EOF → Greater Concentrated Blast → Wild Magic → Legatus Ember staff EOF to finish

Swap the Ember staff for the other EOF if the boss is above ~60% HP [DiamondFang, 14 Apr 2026 @13:58](https://youtu.be/KyIGNqMIj8g?t=838) [DiamondFang, 14 Apr 2026 @7:49](https://youtu.be/KyIGNqMIj8g?t=469).

#### DiamondFang — Tumeken's Resplendent, with a stalled Tsunami [DiamondFang, 14 Apr 2026 @16:12](https://youtu.be/KyIGNqMIj8g?t=972) [DiamondFang, 14 Apr 2026 @16:45](https://youtu.be/KyIGNqMIj8g?t=1005) [DiamondFang, 14 Apr 2026 @17:19](https://youtu.be/KyIGNqMIj8g?t=1039)
Pre-fight: build and stall a Tsunami at Wars Retreat, recover adrenaline, walk in without dropping combat (Surge / Escape / Blade Dive / Necromancy incantations are all safe; target-cycle or click the boss to release).
1. Release the stalled Tsunami + Greater Sunshine + adrenaline potion
2. Greater Concentrated Blast → FSOA special attack
3. Asphyxiate → (hold Runic Charge here, since adrenaline is fine)
4. Runic Charge + Greater Concentrated Blast → Omnipower (near-guaranteed crit) → Wild Magic
5. Five-tick Smoke Tendrils → Greater Concentrated Blast → Wild Magic
6. Legatus Ember staff → Greater Concentrated Blast → Wild Magic
7. Full Asphyxiate → Greater Concentrated Blast → Wild Magic

His summary of the whole style: every rotation is the same cyclical Greater Concentrated Blast → Wild Magic skeleton with Tumeken's Asphyxiate buffs spent on Omnipower or Smoke Tendrils [DiamondFang, 14 Apr 2026 @17:19](https://youtu.be/KyIGNqMIj8g?t=1039) [DiamondFang, 14 Apr 2026 @17:52](https://youtu.be/KyIGNqMIj8g?t=1072).

#### Its Ya Boi Dragon — best-in-slot, 39.6-second Sunshine rotation, tuned for consistency not peak damage [Its Ya Boi Dragon, 17 Jun 2026 @0:00](https://youtu.be/76-Bnr1WwRs?t=0) [Its Ya Boi Dragon, 17 Jun 2026 @3:10](https://youtu.be/76-Bnr1WwRs?t=190) [Its Ya Boi Dragon, 17 Jun 2026 @5:53](https://youtu.be/76-Bnr1WwRs?t=353) [Its Ya Boi Dragon, 17 Jun 2026 @6:26](https://youtu.be/76-Bnr1WwRs?t=386)
Assumes: no Temporal Anomaly (deliberately, so it is 100% reproducible), Tumeken's Resplendent, FSOA camped with a Roar of Awakening / Ode to Deceit dual-wield switch, Zuk cape, Kal'gerion demon, curses + Soul Split, relics Font of Life / Fury of the Small / Conservation of Energy, EOF holds an ornament-kitted Legatus Ember staff but is **not** used in this rotation.

Part 1 — pre-Sunshine and FSOA setup:
1. Smoke Cloud → bone bomb
2. Greater Sunshine → adrenaline potion
3. Greater Sonic Wave → Greater Concentrated Blast → Tsunami
4. FSOA special attack

Part 2 — "Tumeken's Channelled Might":
5. Full-channel Asphyxiate as early as possible
6. (Runic Charge +) Greater Concentrated Blast → Omnipower — the charge is there to guarantee the crit, which is then multiplied by the 35% Channelled Might crit damage
7. Smoke Tendrils, channelled for its four guaranteed crits (each can also proc FSOA), cancelled with 0.6 seconds left
8. Greater Concentrated Blast → Wild Magic (the G-conc is the last ability inside the 35% window; Wild Magic is there to spend its 21% crit chance)

Part 3 — "the Roar and the crit finish":
9. Dual-wield switch to Roar of Awakening, wand special
10. Switch back to the staff → Greater Concentrated Blast → Wild Magic
11. Full-channel Asphyxiate
12. Greater Concentrated Blast → Wild Magic to close

Results on a level-151 dummy: 635k, then 580k, average ~610k, best ever ~675k, worst ~560k. He says the spread is driven almost entirely by Asphyxiate [Its Ya Boi Dragon, 17 Jun 2026 @7:00](https://youtu.be/76-Bnr1WwRs?t=420) [Its Ya Boi Dragon, 17 Jun 2026 @8:39](https://youtu.be/76-Bnr1WwRs?t=519) [Its Ya Boi Dragon, 17 Jun 2026 @9:13](https://youtu.be/76-Bnr1WwRs?t=553). He mentions 48.6-second and near-minute variants exist but does not give them [Its Ya Boi Dragon, 17 Jun 2026 @9:13](https://youtu.be/76-Bnr1WwRs?t=553).

#### MrEznorbRS — his working rotation, demonstrated at Raksha [MrEznorbRS, 2 Aug 2026 @8:26](https://youtu.be/T_y2bHBvHa8?t=506) [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539) [MrEznorbRS, 2 Aug 2026 @9:33](https://youtu.be/T_y2bHBvHa8?t=573)
1. Smoke Cloud on the target (he compares it to a bomb — it amplifies crit damage)
2. Greater Sonic Wave → Greater Sunshine (so Sunshine costs as little adrenaline as possible)
3. Adrenaline potion + vulnerability bomb
4. Build Insight Fear stacks (Greater Concentrated Blast is the fast way) → Tsunami
5. FSOA special attack — then **switch the auto-cast spell** (he admits forgetting this in the demo kill)
6. Greater Concentrated Blast → Wild Magic → Asphyxiate
7. Either Smoke Tendrils (if you need more channelled crits, or you are close to a phase transition) or Runic Charge → Greater Concentrated Blast → Omnipower
8. Essence of Finality (Legatus Ember staff) special as a filler hit

On the second Sunshine of the kill he re-runs from step 2 with Sunshine → Tsunami → weapon special → Greater Concentrated Blast → Asphyxiate → Runic Charge → Greater Concentrated Blast → Omnipower → Wild Magic → Greater Concentrated Blast → Wild Magic [MrEznorbRS, 2 Aug 2026 @12:21](https://youtu.be/T_y2bHBvHa8?t=741) [MrEznorbRS, 2 Aug 2026 @12:53](https://youtu.be/T_y2bHBvHa8?t=773).

#### Does the FSOA still matter after the update?
Every video that discusses gear says yes, emphatically.
- Carguy: the FSOA special is "the one that brings magic out of the dark depths" and you should **not** weapon-swap away from it during a Sunshine, because you would also lose its passive 15–25% crit damage [Carguy, 14 Jul 2026 @29:18](https://youtu.be/3lxLhk4l9R8?t=1758) [Carguy, 14 Jul 2026 @29:54](https://youtu.be/3lxLhk4l9R8?t=1794).
- DiamondFang: you camp the FSOA most of the time, and every crit-chance item exists to feed its proc rate [DiamondFang, 14 Apr 2026 @7:15](https://youtu.be/KyIGNqMIj8g?t=435) [DiamondFang, 14 Apr 2026 @12:51](https://youtu.be/KyIGNqMIj8g?t=771).
- MrEznorb: the passive crit damage plus the Instability window is what makes magic powerful, and simultaneously what makes it swingy [MrEznorbRS, 2 Aug 2026 @2:50](https://youtu.be/T_y2bHBvHa8?t=170) [MrEznorbRS, 2 Aug 2026 @3:24](https://youtu.be/T_y2bHBvHa8?t=204).
- The one thing that *changed*: Exsanguinate no longer buffs FSOA hits, which it used to do under the 2023 FSOA rework [Carguy, 14 Jul 2026 @23:36](https://youtu.be/3lxLhk4l9R8?t=1416) [Carguy, 14 Jul 2026 @24:12](https://youtu.be/3lxLhk4l9R8?t=1452).
- Older armour still holds up around it: Carguy's elite-tectonic test produced a 37–39 second Raksha pool skip, Raksha kills around 1:25–1:27, Sanctum of Rebirth first-boss times in the 2:00–2:10 range, and a sub-3-minute 2000% enrage Glacor kill (2:59.4) [Carguy, 22 Apr 2026 @6:39](https://youtu.be/noJjrb0888s?t=399) [Carguy, 22 Apr 2026 @8:51](https://youtu.be/noJjrb0888s?t=531) [Carguy, 22 Apr 2026 @10:35](https://youtu.be/noJjrb0888s?t=635) [Carguy, 22 Apr 2026 @17:12](https://youtu.be/noJjrb0888s?t=1032).

---

### Adrenaline, specials and spellbook

#### Adrenaline management
- The headline change of the update is how magic gets adrenaline: Greater Sonic Wave now discounts the next ability by 20%, and Jagex paid for that by turning Magma Tempest and Corruption Blast into 20%-cost abilities instead of adrenaline generators [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33).
- Basic-ability boosters: Fury of the Small (archaeology relic, +1% adrenaline on basics — Its Ya Boi Dragon calls it "Fear of the Small") and the Impatient perk (up to 40% chance of +3% on a basic), together averaging ~11% per basic [Qp RS, 13 Mar 2026 @1:39](https://youtu.be/QRl8NJH82nA?t=99) [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31). Invigorating adds a flat 20% to the basic **attack** only [Qp RS, 13 Mar 2026 @2:15](https://youtu.be/QRl8NJH82nA?t=135).
- Ultimate-cost reducers: Ring of Vigor (10%, made passive by the Extinction quest) and Conservation of Energy (another 10%), which stack; add a Runic-charged Greater Sonic Wave for 45% and you can save up to 65% on a Sunshine, taking it from 100% to as low as 35% [Qp RS, 13 Mar 2026 @2:47](https://youtu.be/QRl8NJH82nA?t=167) [Qp RS, 13 Mar 2026 @3:23](https://youtu.be/QRl8NJH82nA?t=203). Relentless can zero out an ability's adrenaline cost entirely [Qp RS, 13 Mar 2026 @3:23](https://youtu.be/QRl8NJH82nA?t=203).
- Tsunami is the engine: 8% adrenaline per critical strike for 30 seconds [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040). Insight Fear stacks cut its cost — Carguy reaches 40%, QP claims you can reach zero [Carguy, 14 Jul 2026 @17:55](https://youtu.be/3lxLhk4l9R8?t=1075) [Qp RS, 13 Mar 2026 @3:57](https://youtu.be/QRl8NJH82nA?t=237).
- Stalling is the main way to enter a fight with both a special and full adrenaline: build the stall at Wars Retreat, take the adrenaline crystal, then travel without dropping combat [Carguy, 14 Jul 2026 @41:39](https://youtu.be/3lxLhk4l9R8?t=2499) [DiamondFang, 14 Apr 2026 @16:12](https://youtu.be/KyIGNqMIj8g?t=972).
- Defensive abilities such as Natural Instinct can build adrenaline in advanced rotations [Qp RS, 13 Mar 2026 @4:30](https://youtu.be/QRl8NJH82nA?t=270). Carguy notes that when tanking he takes Resurrect over Divert to keep more adrenaline for damage [Carguy, 22 Apr 2026 @16:07](https://youtu.be/noJjrb0888s?t=967).
- Smoke Tendrils is adrenaline-neutral, so it is the ability to press when you need channel time without spending [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700) [DiamondFang, 14 Apr 2026 @10:04](https://youtu.be/KyIGNqMIj8g?t=604).

#### Special attacks and Essence of Finality
- **FSOA special**: 50% base adrenaline, 120–140% damage, and a 30-second Instability window where every critical strike launches an extra 70–90% lightning hit. Nothing to manage — it fires by itself [Carguy, 14 Jul 2026 @29:18](https://youtu.be/3lxLhk4l9R8?t=1758) [Carguy, 14 Jul 2026 @29:54](https://youtu.be/3lxLhk4l9R8?t=1794) [MrEznorbRS, 2 Aug 2026 @3:24](https://youtu.be/T_y2bHBvHa8?t=204). Passive: 15–25% extra crit damage while wielded [Carguy, 14 Jul 2026 @29:54](https://youtu.be/3lxLhk4l9R8?t=1794) [MrEznorbRS, 2 Aug 2026 @2:50](https://youtu.be/T_y2bHBvHa8?t=170). A fully critting Omnipower can therefore produce up to four extra FSOA hits [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101).
- **Roar of Awakening / Ode to Deceit (the "wand spec")**: Carguy believes Soulfire is the highest-percentage special attack in the game. Initial hit (can crit but is not guaranteed) plus a bleed of 170–200% every 1.8 seconds for seven hits; 45-second cooldown. It grants Conflagrate, a 15-second window in which Combust deals 40% more damage; that stacks with Kerapac's wrist wraps and the Lunging perk, though Carguy will not bring the wrist wraps as a switch [Carguy, 14 Jul 2026 @30:27](https://youtu.be/3lxLhk4l9R8?t=1827) [Carguy, 14 Jul 2026 @31:01](https://youtu.be/3lxLhk4l9R8?t=1861) [Carguy, 14 Jul 2026 @31:34](https://youtu.be/3lxLhk4l9R8?t=1894) [Carguy, 14 Jul 2026 @32:08](https://youtu.be/3lxLhk4l9R8?t=1928).
- The dual-wield passive builds bleed stacks up to 100. At **1** stack, bleeds (Corruption Blast, Combust, the wand special itself) already have a 30% chance to instantly refresh and dump all remaining hits at once — this is why targets sometimes evaporate. At **10** stacks a small magic damage bonus, at **25** stacks any basic ability grants an extra 6% adrenaline over 3.6 seconds [Carguy, 14 Jul 2026 @32:41](https://youtu.be/3lxLhk4l9R8?t=1961) [Carguy, 14 Jul 2026 @33:14](https://youtu.be/3lxLhk4l9R8?t=1994) [Carguy, 14 Jul 2026 @33:50](https://youtu.be/3lxLhk4l9R8?t=2030).
- Timing: fire the wand special **outside** Sunshine, since bleeds are not boosted by Sunshine — DiamondFang puts it immediately before Sunshine, and Dragon puts it in the middle of his Sunshine anyway as a dual-wield switch [DiamondFang, 14 Apr 2026 @11:43](https://youtu.be/KyIGNqMIj8g?t=703) [DiamondFang, 14 Apr 2026 @5:02](https://youtu.be/KyIGNqMIj8g?t=302) [Its Ya Boi Dragon, 17 Jun 2026 @4:48](https://youtu.be/76-Bnr1WwRs?t=288). DiamondFang notes hybriding changes this, and in a hybrid you might use the wand special inside Sunshine in place of Smoke Tendrils [DiamondFang, 14 Apr 2026 @17:52](https://youtu.be/KyIGNqMIj8g?t=1072) [DiamondFang, 14 Apr 2026 @18:25](https://youtu.be/KyIGNqMIj8g?t=1105).
- **EOF**: Carguy uses only two — Legatus Ember staff (240–280%, 35% adrenaline, gaining +1% damage per 1% of the target's max HP lost, capping at 25% HP remaining; he runs into the hit cap inside Sunshine once the target is around 50–60%) and the Gothic staff (200–240%, 25% adrenaline, +2 base hit chance/affinity for 1 minute, used purely for accuracy). He does not use the Armadyl battlestaff, judging it barely better than the Ember staff for the price [Carguy, 14 Jul 2026 @34:25](https://youtu.be/3lxLhk4l9R8?t=2065) [Carguy, 14 Jul 2026 @35:30](https://youtu.be/3lxLhk4l9R8?t=2130) [Carguy, 14 Jul 2026 @36:06](https://youtu.be/3lxLhk4l9R8?t=2166) [Carguy, 14 Jul 2026 @37:13](https://youtu.be/3lxLhk4l9R8?t=2233) [Carguy, 14 Jul 2026 @37:45](https://youtu.be/3lxLhk4l9R8?t=2265). Gothic-staff accuracy needs are rarer now that combat stats go to 120 [Carguy, 14 Jul 2026 @38:19](https://youtu.be/3lxLhk4l9R8?t=2299).
- DiamondFang's EOF rule: Ember staff below 60% boss HP, the other staff above 60% [DiamondFang, 14 Apr 2026 @7:49](https://youtu.be/KyIGNqMIj8g?t=469). (He names it "ebon's"; the intended item is not identifiable from the captions.)
- MrEznorb runs a "Legatus ascendant staff" in his EOF [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539) — almost certainly the Legatus Ember staff, but the caption does not confirm it.

#### Spellbook and spells
- **Ancients is the DPS spellbook.** DiamondFang: unlock ancient curses and the Sentisten spellbook, calling them the best spells in the game [DiamondFang, 14 Apr 2026 @8:22](https://youtu.be/KyIGNqMIj8g?t=502).
- **Insight Fear** is the camp spell. Small AoE, damage scaling to level 100 (as do all high-level ancient spells regardless of their listed level), and each of its five stacks makes Tsunami cost 12% less adrenaline. Ability *hits* generate stacks, so Greater Concentrated Blast alone gives three; two more abilities plus a G-conc always caps you [Carguy, 14 Jul 2026 @21:54](https://youtu.be/3lxLhk4l9R8?t=1314) [Carguy, 14 Jul 2026 @22:27](https://youtu.be/3lxLhk4l9R8?t=1347) [Carguy, 14 Jul 2026 @23:01](https://youtu.be/3lxLhk4l9R8?t=1381) [DiamondFang, 14 Apr 2026 @18:59](https://youtu.be/KyIGNqMIj8g?t=1139).
- **Exsanguinate** is the sweatier alternative: up to 12 stacks, +1% base damage to basic abilities per stack, so roughly a 12% basic-damage buff. The recommended pattern is Insight Fear to fuel Tsunami, then swap to Exsanguinate afterwards [Carguy, 14 Jul 2026 @23:01](https://youtu.be/3lxLhk4l9R8?t=1381) [MrEznorbRS, 2 Aug 2026 @6:11](https://youtu.be/T_y2bHBvHa8?t=371) [DiamondFang, 14 Apr 2026 @18:59](https://youtu.be/KyIGNqMIj8g?t=1139). Caveat: it no longer buffs FSOA hits [Carguy, 14 Jul 2026 @23:36](https://youtu.be/3lxLhk4l9R8?t=1416).
- **Ice Barrage** binds for 9.6 seconds; **Blood Barrage** heals from damage dealt; both are AoE [Carguy, 14 Jul 2026 @24:12](https://youtu.be/3lxLhk4l9R8?t=1452) [Carguy, 14 Jul 2026 @25:52](https://youtu.be/3lxLhk4l9R8?t=1552).
- **Combat spells now incur the global cooldown** when cast manually — this is new and worth building into muscle memory [Carguy, 14 Jul 2026 @28:10](https://youtu.be/3lxLhk4l9R8?t=1690).
- The **manual spell casting** setting (Settings → Gameplay → Combat and Action Bar → Action Bar) lets you keybind a one-off spell without changing your auto-cast. Downside: abilities clicked out of the book then need a second click on the target. Carguy notes it matters less now that four-ticking is gone [Carguy, 14 Jul 2026 @24:45](https://youtu.be/3lxLhk4l9R8?t=1485) [Carguy, 14 Jul 2026 @25:20](https://youtu.be/3lxLhk4l9R8?t=1520) [Carguy, 14 Jul 2026 @25:52](https://youtu.be/3lxLhk4l9R8?t=1552).
- **Swap to Standards / Swap to Lunars** give one cast on the other book; multicast means you rarely need to swap more than once [Carguy, 14 Jul 2026 @25:52](https://youtu.be/3lxLhk4l9R8?t=1552) [Carguy, 14 Jul 2026 @26:28](https://youtu.be/3lxLhk4l9R8?t=1588).
- Standards: **Temporal Anomaly** aspect — on full best-in-slot power gear, ~15% chance for any ability to instantly refresh its cooldown (max possible 20%), excluding Sunshine. Carguy dislikes it as gambling for damage; DiamondFang says you cannot build a fixed rotation around it and must improvise when an Omnipower resets; Its Ya Boi Dragon deliberately excludes it so his rotation is reproducible [Carguy, 14 Jul 2026 @26:28](https://youtu.be/3lxLhk4l9R8?t=1588) [Carguy, 14 Jul 2026 @27:00](https://youtu.be/3lxLhk4l9R8?t=1620) [Carguy, 14 Jul 2026 @27:36](https://youtu.be/3lxLhk4l9R8?t=1656) [DiamondFang, 14 Apr 2026 @20:07](https://youtu.be/KyIGNqMIj8g?t=1207) [Its Ya Boi Dragon, 17 Jun 2026 @0:00](https://youtu.be/76-Bnr1WwRs?t=0). **Crumble Undead** is niche but strong against undead [DiamondFang, 14 Apr 2026 @19:33](https://youtu.be/KyIGNqMIj8g?t=1173).
- Lunars: **Vengeance** (75% reflect, no damage reduction, does not use a global cooldown) and **Disruption Shield** (nullifies one hit, once a minute) [Carguy, 14 Jul 2026 @27:36](https://youtu.be/3lxLhk4l9R8?t=1656) [Carguy, 14 Jul 2026 @28:10](https://youtu.be/3lxLhk4l9R8?t=1690) [Carguy, 14 Jul 2026 @28:43](https://youtu.be/3lxLhk4l9R8?t=1723).
- **Smoke Cloud** is applied pre-Sunshine by DiamondFang, MrEznorb and Its Ya Boi Dragon: 15% crit damage on the target for the whole team, worth more to magic than to other styles, though the effective gain is smaller than 15% because crit damage is multiplicative [DiamondFang, 14 Apr 2026 @13:58](https://youtu.be/KyIGNqMIj8g?t=838) [DiamondFang, 14 Apr 2026 @19:33](https://youtu.be/KyIGNqMIj8g?t=1173) [MrEznorbRS, 2 Aug 2026 @7:51](https://youtu.be/T_y2bHBvHa8?t=471) [Its Ya Boi Dragon, 17 Jun 2026 @5:53](https://youtu.be/76-Bnr1WwRs?t=353).
- Prayers: Its Ya Boi Dragon runs curses for Soul Split despite normal prayers being technically better [Its Ya Boi Dragon, 17 Jun 2026 @1:03](https://youtu.be/76-Bnr1WwRs?t=63); DiamondFang says normal prayers with Eclipse Soul beat ancients if your hit chance and survivability allow [DiamondFang, 14 Apr 2026 @18:25](https://youtu.be/KyIGNqMIj8g?t=1105); Carguy used normal prayers for his elite tectonic testing and cites Eclipse Soul at 4% crit chance [Carguy, 22 Apr 2026 @4:58](https://youtu.be/noJjrb0888s?t=298) [Carguy, 22 Apr 2026 @7:12](https://youtu.be/noJjrb0888s?t=432).
- Crit-chance stack referenced across the videos: Kal'gerion demon, Grimoire, Tumeken's-in-Sunshine or elite tectonic's flat 6%, Reaver's / Channeller's ring, Biting 4, Eclipse Soul, Smoke Cloud [MrEznorbRS, 2 Aug 2026 @4:31](https://youtu.be/T_y2bHBvHa8?t=271) [DiamondFang, 14 Apr 2026 @13:25](https://youtu.be/KyIGNqMIj8g?t=805) [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31). Ring swapping is the high-end expression: start on the Channeller's ring for the first Asphyxiate, swap to Reaver's before Omnipower, swap back for the next Asphyxiate [DiamondFang, 14 Apr 2026 @18:59](https://youtu.be/KyIGNqMIj8g?t=1139).
- Budget crit option: the **Chaotic Grimoire** from the Dungeoneering shop gives 7% crit chance instead of the Grimoire's 12%, but costs 5,000 Dungeoneering tokens per 45-minute page instead of ~4.2M GP, i.e. roughly 5–6M GP per hour saved [MrEznorbRS, 17 May 2026 @1:41](https://youtu.be/6mVcYE0iQw0?t=101) [MrEznorbRS, 17 May 2026 @3:52](https://youtu.be/6mVcYE0iQw0?t=232) [MrEznorbRS, 17 May 2026 @5:01](https://youtu.be/6mVcYE0iQw0?t=301) [MrEznorbRS, 17 May 2026 @5:33](https://youtu.be/6mVcYE0iQw0?t=333).

---

### Numeric claims to verify

| Claim | Source |
|---|---|
| Basic attack: 9% adrenaline, 90–110% ability damage | [Carguy, 14 Jul 2026 @1:06](https://youtu.be/3lxLhk4l9R8?t=66) |
| Greater Sonic Wave: 115–135% damage, 9% adrenaline, 15s cooldown | [Carguy, 14 Jul 2026 @2:14](https://youtu.be/3lxLhk4l9R8?t=134) |
| Greater Sonic Wave buff lasts 9s, saves 20% adrenaline on next enhanced/ultimate | [Carguy, 14 Jul 2026 @2:48](https://youtu.be/3lxLhk4l9R8?t=168) |
| Sonic Wave (ungreatered) saves only 10% | [DiamondFang, 14 Apr 2026 @4:29](https://youtu.be/KyIGNqMIj8g?t=269) |
| Greater Sonic Wave is "effectively giving you 30% adrenaline" | [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33) |
| Dragon Breath: cone hits up to 4 additional enemies | [Carguy, 14 Jul 2026 @3:54](https://youtu.be/3lxLhk4l9R8?t=234) |
| Dragon Breath deals +25% against a combusted target | [Carguy, 14 Jul 2026 @3:54](https://youtu.be/3lxLhk4l9R8?t=234); [Qp RS, 13 Mar 2026 @7:19](https://youtu.be/QRl8NJH82nA?t=439) |
| Runic-charged Dragon Breath: 260–310% ability damage | [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212) |
| Combust: 10 hits, one every 1.8s | [Carguy, 14 Jul 2026 @5:00](https://youtu.be/3lxLhk4l9R8?t=300) |
| Impact: 2 charges, 15s cooldown, 5s stagger, 10s to regain first charge | [Carguy, 14 Jul 2026 @5:33](https://youtu.be/3lxLhk4l9R8?t=333) |
| Greater Chain: tags up to 6 extra targets within 5 tiles; next ability hits them for 50% | [Carguy, 14 Jul 2026 @6:05](https://youtu.be/3lxLhk4l9R8?t=365) |
| Greater Chain: up to 7 targets, 70% with Caroming 4 | [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369) |
| Greater Chain own damage: 80–100% | [Carguy, 14 Jul 2026 @6:40](https://youtu.be/3lxLhk4l9R8?t=400) |
| Chain (ungreatered) hits 2 extra targets | [Qp RS, 13 Mar 2026 @7:52](https://youtu.be/QRl8NJH82nA?t=472) |
| Greater Concentrated Blast: 3 hits of 40–50%, 120–150% total | [Carguy, 14 Jul 2026 @7:47](https://youtu.be/3lxLhk4l9R8?t=467) |
| Greater Concentrated Blast grants +21% crit chance on next ability (15% ungreatered) | [Carguy, 14 Jul 2026 @7:47](https://youtu.be/3lxLhk4l9R8?t=467); [DiamondFang, 14 Apr 2026 @2:15](https://youtu.be/KyIGNqMIj8g?t=135) |
| Runic Charge adds +10% crit chance per Greater Concentrated Blast attack | [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246) |
| Runic Charge brings Greater Concentrated Blast's next-ability crit chance to 51% | [DiamondFang, 14 Apr 2026 @2:15](https://youtu.be/KyIGNqMIj8g?t=135) |
| Greater Concentrated Blast codex ~10–20M | [Carguy, 14 Jul 2026 @8:20](https://youtu.be/3lxLhk4l9R8?t=500) |
| Greater Concentrated Blast codex ~15M | [Qp RS, 13 Mar 2026 @9:33](https://youtu.be/QRl8NJH82nA?t=573) |
| Greater Sonic Wave codex ~5M | [Qp RS, 13 Mar 2026 @5:36](https://youtu.be/QRl8NJH82nA?t=336) |
| Wild Magic: 2 hits, 5.4s cooldown, +10% crit chance and +20% crit damage per hit | [Carguy, 14 Jul 2026 @9:27](https://youtu.be/3lxLhk4l9R8?t=567) |
| Blast Diffusion Boots: +8% base damage on basic magic abilities after Wild Magic | [Carguy, 22 Apr 2026 @2:44](https://youtu.be/noJjrb0888s?t=164) |
| Asphyxiate with Tumeken's: 8 hits, one per tick, then +35% crit damage | [Carguy, 14 Jul 2026 @9:27](https://youtu.be/3lxLhk4l9R8?t=567); [Carguy, 14 Jul 2026 @9:59](https://youtu.be/3lxLhk4l9R8?t=599) |
| Asphyxiate without Tumeken's: 4 hits every other tick, 3.6s window, +15% crit damage | [Carguy, 14 Jul 2026 @9:59](https://youtu.be/3lxLhk4l9R8?t=599) |
| Asphyxiate Tumeken's crit-damage window lasts 9 seconds | [DiamondFang, 14 Apr 2026 @15:39](https://youtu.be/KyIGNqMIj8g?t=939); [Carguy, 22 Apr 2026 @17:12](https://youtu.be/noJjrb0888s?t=1032) |
| Asphyxiate is an 8-tick channel | [DiamondFang, 14 Apr 2026 @3:22](https://youtu.be/KyIGNqMIj8g?t=202) |
| Smoke Tendrils: 4 escalating hits over 4.2s, all guaranteed crits, adrenaline-neutral | [Carguy, 14 Jul 2026 @11:07](https://youtu.be/3lxLhk4l9R8?t=667); [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700) |
| Smoke Tendrils cancelled with 0.6s remaining | [Its Ya Boi Dragon, 17 Jun 2026 @6:26](https://youtu.be/76-Bnr1WwRs?t=386) |
| Magma Tempest: 5×5 area, hit every 1.2s, 8 hits, up to 25 targets | [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700); [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733) |
| Magma Tempest now costs 20% adrenaline (previously granted 8%) | [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733) |
| Magma Tempest deals roughly 320% damage to all targets | [Qp RS, 13 Mar 2026 @11:14](https://youtu.be/QRl8NJH82nA?t=674) |
| Magma Tempest: 16 ticks, 8 hits | [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369) |
| Corruption Blast now costs 20% adrenaline | [Carguy, 14 Jul 2026 @12:48](https://youtu.be/3lxLhk4l9R8?t=768) |
| Corruption Blast: 5 hits over 10 ticks | [DiamondFang, 14 Apr 2026 @6:09](https://youtu.be/KyIGNqMIj8g?t=369) |
| Omnipower without Zuk cape: one hit of 420–500% | [Carguy, 14 Jul 2026 @14:29](https://youtu.be/3lxLhk4l9R8?t=869) |
| Omnipower with Zuk cape: four hits of 120–150% | [Carguy, 14 Jul 2026 @14:29](https://youtu.be/3lxLhk4l9R8?t=869) |
| Omnipower: two hits, four with the cape | [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101) |
| Omnipower costs 60% adrenaline | [Qp RS, 13 Mar 2026 @5:36](https://youtu.be/QRl8NJH82nA?t=336) |
| Runic Charge + G-conc + Omnipower can hit ~60,000 | [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539) |
| Greater Sunshine: +50% damage, 37.8s duration, 7×7 area, 1-minute cooldown | [Carguy, 14 Jul 2026 @15:03](https://youtu.be/3lxLhk4l9R8?t=903); [Carguy, 14 Jul 2026 @16:08](https://youtu.be/3lxLhk4l9R8?t=968) |
| Sunshine base 30.6s, extended to 37.8s by Planted Feet or the Greater codex | [DiamondFang, 14 Apr 2026 @1:07](https://youtu.be/KyIGNqMIj8g?t=67) |
| Sunshine ticks for 10–20% magic damage every 1.8s | [Carguy, 14 Jul 2026 @15:36](https://youtu.be/3lxLhk4l9R8?t=936) |
| Tumeken's Resplendent adds 7.5% crit chance inside Sunshine | [DiamondFang, 14 Apr 2026 @1:07](https://youtu.be/KyIGNqMIj8g?t=67) |
| Tumeken's crit chance inside Sunshine stated as "7 12%" (garbled) | [Carguy, 14 Jul 2026 @15:03](https://youtu.be/3lxLhk4l9R8?t=903) |
| Elite tectonic gives a flat 6% crit chance | [Carguy, 14 Jul 2026 @16:08](https://youtu.be/3lxLhk4l9R8?t=968); [Carguy, 22 Apr 2026 @6:39](https://youtu.be/noJjrb0888s?t=399) |
| Sunshine costs 100% adrenaline, reducible to 35% | [Qp RS, 13 Mar 2026 @2:47](https://youtu.be/QRl8NJH82nA?t=167) |
| Tsunami: 225–275% magic damage, 3×3 in front | [Carguy, 14 Jul 2026 @16:44](https://youtu.be/3lxLhk4l9R8?t=1004); [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040) |
| Tsunami: +8% adrenaline per critical strike for 30 seconds | [Carguy, 14 Jul 2026 @17:20](https://youtu.be/3lxLhk4l9R8?t=1040); [Qp RS, 13 Mar 2026 @3:57](https://youtu.be/QRl8NJH82nA?t=237) |
| Tsunami costs 40% with 5 Insight Fear stacks plus COE and Ring of Vigor | [Carguy, 14 Jul 2026 @17:55](https://youtu.be/3lxLhk4l9R8?t=1075) |
| Insight Fear reduces Tsunami cost by 12% per stack, 5 stacks max | [Carguy, 14 Jul 2026 @22:27](https://youtu.be/3lxLhk4l9R8?t=1347) |
| Insight Fear reduces Tsunami cost by 60%, allowing a zero-adrenaline cast | [Qp RS, 13 Mar 2026 @3:57](https://youtu.be/QRl8NJH82nA?t=237) |
| Greater Concentrated Blast grants 3 Insight Fear stacks; Dragon Breath 1 | [Carguy, 14 Jul 2026 @23:01](https://youtu.be/3lxLhk4l9R8?t=1381) |
| Exsanguinate: up to 12 stacks, +1% basic damage each | [Carguy, 14 Jul 2026 @23:01](https://youtu.be/3lxLhk4l9R8?t=1381) |
| Runic Charge: 30s cooldown, off global cooldown | [Carguy, 14 Jul 2026 @19:06](https://youtu.be/3lxLhk4l9R8?t=1146) |
| Runic Charge gives a 15-second window to use the charged basic | [MrEznorbRS, 2 Aug 2026 @7:17](https://youtu.be/T_y2bHBvHa8?t=437) |
| Runic-charged Greater Sonic Wave saves 45% adrenaline on the next ability | [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212); [Qp RS, 13 Mar 2026 @3:23](https://youtu.be/QRl8NJH82nA?t=203) |
| Surge moves 10 tiles | [Carguy, 14 Jul 2026 @18:29](https://youtu.be/3lxLhk4l9R8?t=1109) |
| Ice Barrage binds for 9.6 seconds | [Carguy, 14 Jul 2026 @24:12](https://youtu.be/3lxLhk4l9R8?t=1452) |
| Temporal Anomaly: ~15% cooldown-reset chance on best-in-slot, hard cap 20%, excludes Sunshine | [Carguy, 14 Jul 2026 @27:00](https://youtu.be/3lxLhk4l9R8?t=1620) |
| Vengeance reflects 75% (versus 50% for Reflect) and costs no global cooldown | [Carguy, 14 Jul 2026 @27:36](https://youtu.be/3lxLhk4l9R8?t=1656); [Carguy, 14 Jul 2026 @28:10](https://youtu.be/3lxLhk4l9R8?t=1690) |
| Disruption Shield nullifies one hit, once per minute | [Carguy, 14 Jul 2026 @28:43](https://youtu.be/3lxLhk4l9R8?t=1723) |
| FSOA special: 50% base adrenaline, 120–140% damage | [Carguy, 14 Jul 2026 @29:18](https://youtu.be/3lxLhk4l9R8?t=1758) |
| FSOA Instability: 30s window, every crit adds a 70–90% hit | [Carguy, 14 Jul 2026 @29:18](https://youtu.be/3lxLhk4l9R8?t=1758); [MrEznorbRS, 2 Aug 2026 @3:24](https://youtu.be/T_y2bHBvHa8?t=204) |
| FSOA passive: +15–25% crit damage | [Carguy, 14 Jul 2026 @29:54](https://youtu.be/3lxLhk4l9R8?t=1794); [MrEznorbRS, 2 Aug 2026 @2:50](https://youtu.be/T_y2bHBvHa8?t=170) |
| Fully critting Omnipower under Instability adds ~360% extra damage | [Carguy, 14 Jul 2026 @29:54](https://youtu.be/3lxLhk4l9R8?t=1794) |
| Wand special bleed: 170–200% every 1.8s for 7 hits, 45s cooldown | [Carguy, 14 Jul 2026 @31:34](https://youtu.be/3lxLhk4l9R8?t=1894); [Carguy, 14 Jul 2026 @32:41](https://youtu.be/3lxLhk4l9R8?t=1961) |
| Conflagrate: 15s window making Combust deal 40% more | [Carguy, 14 Jul 2026 @32:08](https://youtu.be/3lxLhk4l9R8?t=1928) |
| Wand/orb bleed stacks cap at 100; at 1 stack a 30% chance to instantly finish a bleed | [Carguy, 14 Jul 2026 @32:41](https://youtu.be/3lxLhk4l9R8?t=1961); [Carguy, 14 Jul 2026 @33:14](https://youtu.be/3lxLhk4l9R8?t=1994) |
| At 25 stacks, basics grant an extra 6% adrenaline over 3.6s | [Carguy, 14 Jul 2026 @33:50](https://youtu.be/3lxLhk4l9R8?t=2030) |
| Legatus Ember staff EOF: 240–280%, 35% adrenaline; +1% damage per 1% target HP lost down to 25% | [Carguy, 14 Jul 2026 @35:30](https://youtu.be/3lxLhk4l9R8?t=2130); [Carguy, 14 Jul 2026 @36:06](https://youtu.be/3lxLhk4l9R8?t=2166) |
| Legatus Ember staff hits ~13–17k on a full-HP target inside Sunshine | [Carguy, 14 Jul 2026 @36:06](https://youtu.be/3lxLhk4l9R8?t=2166) |
| Gothic staff EOF: 200–240%, 25% adrenaline, +2 base hit chance for 1 minute | [Carguy, 14 Jul 2026 @37:13](https://youtu.be/3lxLhk4l9R8?t=2233); [Carguy, 14 Jul 2026 @37:45](https://youtu.be/3lxLhk4l9R8?t=2265) |
| Statius's warhammer applies 5 affinity stacks versus the Gothic staff's 2 | [Carguy, 14 Jul 2026 @38:19](https://youtu.be/3lxLhk4l9R8?t=2299) |
| Fury of the Small: +1% adrenaline on basics (9% becomes 10%) | [Qp RS, 13 Mar 2026 @1:39](https://youtu.be/QRl8NJH82nA?t=99) |
| Impatient: up to 40% chance of +3% adrenaline on a basic; ~11% average with Fury | [Qp RS, 13 Mar 2026 @1:39](https://youtu.be/QRl8NJH82nA?t=99) |
| Invigorating: flat +20% adrenaline on the basic attack only | [Qp RS, 13 Mar 2026 @2:15](https://youtu.be/QRl8NJH82nA?t=135) |
| Basic attack can reach 15.6% adrenaline, averaging ~13% | [Qp RS, 13 Mar 2026 @2:15](https://youtu.be/QRl8NJH82nA?t=135) |
| Ring of Vigor and Conservation of Energy each save 10% on ultimates | [Qp RS, 13 Mar 2026 @2:47](https://youtu.be/QRl8NJH82nA?t=167) |
| Stacked effects can save up to 65% adrenaline on an ultimate | [Qp RS, 13 Mar 2026 @3:23](https://youtu.be/QRl8NJH82nA?t=203) |
| Kal'gerion demon gives 6% crit chance | [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31); [DiamondFang, 14 Apr 2026 @13:25](https://youtu.be/KyIGNqMIj8g?t=805) |
| Kal'gerion demon gives +5 crit chance | [MrEznorbRS, 2 Aug 2026 @5:05](https://youtu.be/T_y2bHBvHa8?t=305) |
| Grimoire gives a flat 12% crit chance | [MrEznorbRS, 2 Aug 2026 @4:31](https://youtu.be/T_y2bHBvHa8?t=271); [MrEznorbRS, 17 May 2026 @5:33](https://youtu.be/6mVcYE0iQw0?t=333) |
| Chaotic Grimoire gives 7% crit chance | [MrEznorbRS, 17 May 2026 @3:52](https://youtu.be/6mVcYE0iQw0?t=232) |
| Grimoire page ~4.2M GP, 45 minutes per page, ~5–6M GP per hour | [MrEznorbRS, 17 May 2026 @1:41](https://youtu.be/6mVcYE0iQw0?t=101) |
| Chaotic Grimoire: 150,000 tokens to buy, 5,000 tokens per 45-minute page | [MrEznorbRS, 17 May 2026 @5:33](https://youtu.be/6mVcYE0iQw0?t=333) |
| Reaver's ring: +5% crit chance, −5% accuracy | [MrEznorbRS, 2 Aug 2026 @4:31](https://youtu.be/T_y2bHBvHa8?t=271) |
| Smoke Cloud: 15% crit damage on the target for the whole team | [DiamondFang, 14 Apr 2026 @19:33](https://youtu.be/KyIGNqMIj8g?t=1173) |
| Eclipse Soul: 4% crit chance | [Carguy, 22 Apr 2026 @7:12](https://youtu.be/noJjrb0888s?t=432) |
| FSOA price ~1.5B | [DiamondFang, 14 Apr 2026 @13:25](https://youtu.be/KyIGNqMIj8g?t=805) |
| Ode to Deceit + Roar of Awakening ~500M | [DiamondFang, 14 Apr 2026 @11:11](https://youtu.be/KyIGNqMIj8g?t=671) |
| Dragon's BIS rotation window: 39.6 seconds | [Its Ya Boi Dragon, 17 Jun 2026 @3:10](https://youtu.be/76-Bnr1WwRs?t=190) |
| Dragon's rotation damage: 635k, 580k, average ~610k, best ~675k, worst ~560k | [Its Ya Boi Dragon, 17 Jun 2026 @6:26](https://youtu.be/76-Bnr1WwRs?t=386); [Its Ya Boi Dragon, 17 Jun 2026 @8:04](https://youtu.be/76-Bnr1WwRs?t=484); [Its Ya Boi Dragon, 17 Jun 2026 @8:39](https://youtu.be/76-Bnr1WwRs?t=519) |
| Raksha pool skip target ~600k | [Carguy, 14 Jul 2026 @41:07](https://youtu.be/3lxLhk4l9R8?t=2467) |
| Elite tectonic Raksha pool skip in 37–39 seconds; kills ~1:25–1:27 | [Carguy, 22 Apr 2026 @6:39](https://youtu.be/noJjrb0888s?t=399); [Carguy, 22 Apr 2026 @8:51](https://youtu.be/noJjrb0888s?t=531) |
| Elite tectonic Glacor kill at 2000% enrage: 2:59.4 | [Carguy, 22 Apr 2026 @17:12](https://youtu.be/noJjrb0888s?t=1032) |
| Tumeken's Nakatra magic-camp PB ~2:30; elite tectonic ~3:00 | [Carguy, 22 Apr 2026 @13:18](https://youtu.be/noJjrb0888s?t=798) |
| Adrenaline renewal potion cooldown: 2 minutes | [Carguy, 14 Jul 2026 @43:54](https://youtu.be/3lxLhk4l9R8?t=2634) |

---

### Contradictions and dated advice

1. **Omnipower's hit count.** Carguy: one hit of 420–500% without the Zuk cape, four hits of 120–150% with it [Carguy, 14 Jul 2026 @14:29](https://youtu.be/3lxLhk4l9R8?t=869). DiamondFang: "It has two hits and four with the cape" [DiamondFang, 14 Apr 2026 @1:41](https://youtu.be/KyIGNqMIj8g?t=101). These cannot both be right for the capeless case. Carguy's video is later (14 July vs 14 April 2026) and gives explicit percentages; DiamondFang states outright he is less confident on magic than on melee/ranged [DiamondFang, 14 Apr 2026 @20:07](https://youtu.be/KyIGNqMIj8g?t=1207).

2. **Asphyxiate's standing.** QP (13 March 2026, the earliest video, eleven days after the update) calls it "not that great an ability anymore" and parks it at the bottom of the revolution bar as an adrenaline dump [Qp RS, 13 Mar 2026 @8:59](https://youtu.be/QRl8NJH82nA?t=539). Every later video treats a full-channel Asphyxiate as a load-bearing part of the rotation — the Tumeken's Channelled Might window is the whole point of the mid-rotation burst [Carguy, 14 Jul 2026 @9:27](https://youtu.be/3lxLhk4l9R8?t=567) [Its Ya Boi Dragon, 17 Jun 2026 @3:41](https://youtu.be/76-Bnr1WwRs?t=221) [DiamondFang, 14 Apr 2026 @15:39](https://youtu.be/KyIGNqMIj8g?t=939). The likeliest reconciliation is that QP is writing revolution bars for players without Tumeken's Resplendent, where the ability really is only four hits — but he does not say so.

3. **Smoke Tendrils: press it or not.** Carguy refuses on feel, saying it "does not feel worthwhile to press anymore" and that he would rather spam EOF specials, while admitting the calculators disagree with him [Carguy, 14 Jul 2026 @10:34](https://youtu.be/3lxLhk4l9R8?t=634) [Carguy, 14 Jul 2026 @11:40](https://youtu.be/3lxLhk4l9R8?t=700). Ten weeks earlier he had said that below best-in-slot it *is* worth pressing [Carguy, 22 Apr 2026 @7:45](https://youtu.be/noJjrb0888s?t=465) [Carguy, 22 Apr 2026 @8:18](https://youtu.be/noJjrb0888s?t=498). DiamondFang and Its Ya Boi Dragon both build it into every rotation, Dragon specifically for four guaranteed crits under the Channelled Might window [DiamondFang, 14 Apr 2026 @3:56](https://youtu.be/KyIGNqMIj8g?t=236) [Its Ya Boi Dragon, 17 Jun 2026 @3:41](https://youtu.be/76-Bnr1WwRs?t=221). Treat Carguy's position as a stated preference, not a measurement.

4. **Tsunami's floor cost.** Carguy: five Insight Fear stacks plus Conservation of Energy and Ring of Vigor bring it to 40% [Carguy, 14 Jul 2026 @17:55](https://youtu.be/3lxLhk4l9R8?t=1075). QP: Insight Fear reduces it by 60% and combined with other effects "you can cast it for zero adrenaline" [Qp RS, 13 Mar 2026 @3:57](https://youtu.be/QRl8NJH82nA?t=237). Carguy separately says a Runic-charged Greater Sonic Wave into Tsunami can profit adrenaline [Carguy, 14 Jul 2026 @20:12](https://youtu.be/3lxLhk4l9R8?t=1212), which is closer to QP's claim but only with the Runic Charge spent there.

5. **Runic-charged Greater Concentrated Blast crit figure.** Carguy gives the mechanic (+10% per attack, "effectively guaranteeing" the next crit) without a total [Carguy, 14 Jul 2026 @20:46](https://youtu.be/3lxLhk4l9R8?t=1246); DiamondFang gives a total of 51% [DiamondFang, 14 Apr 2026 @2:15](https://youtu.be/KyIGNqMIj8g?t=135). 21 + 3×10 = 51, so the two are consistent if all three G-conc attacks land — worth verifying that a cancelled channel gives less.

6. **Conservation of Energy: relic or perk?** Carguy calls it an archaeology relic [Carguy, 14 Jul 2026 @17:55](https://youtu.be/3lxLhk4l9R8?t=1075), as does Its Ya Boi Dragon's relic loadout [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31); QP calls it "an invention perk" [Qp RS, 13 Mar 2026 @2:47](https://youtu.be/QRl8NJH82nA?t=167). The relic reading has two votes and QP also lists it alongside actual perks, so his phrasing is probably the error. Similarly, QP calls the adrenaline relic "Fury of the Small" [Qp RS, 13 Mar 2026 @1:39](https://youtu.be/QRl8NJH82nA?t=99) and Dragon calls it "Fear of the Small" [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31).

7. **Kal'gerion demon crit bonus.** 6% [Its Ya Boi Dragon, 17 Jun 2026 @0:31](https://youtu.be/76-Bnr1WwRs?t=31) [DiamondFang, 14 Apr 2026 @13:25](https://youtu.be/KyIGNqMIj8g?t=805) versus "plus five" [MrEznorbRS, 2 Aug 2026 @5:05](https://youtu.be/T_y2bHBvHa8?t=305). Two sources against one.

8. **Asphyxiate's unlock level.** QP places it at magic level 59 [Qp RS, 13 Mar 2026 @8:59](https://youtu.be/QRl8NJH82nA?t=539); Isaac DSE reads an in-game unlock notification for Asphyxiate at magic level 92 [Isaac DSE, 11 May 2026 @7:52](https://youtu.be/VBnnFebHlCY?t=472). Isaac's video is otherwise a training stream with no rotation content and his commentary is unreliable, but the on-screen unlock is worth checking — it may be an ability-tier or codex unlock rather than the base ability.

9. **Prayer book.** DiamondFang says normal prayers with Eclipse Soul are strictly better than ancients if your accuracy and survivability hold, because you give up Soul Split healing and weaker protection prayers [DiamondFang, 14 Apr 2026 @18:25](https://youtu.be/KyIGNqMIj8g?t=1105). Its Ya Boi Dragon agrees normal prayers are technically better but runs curses anyway for Soul Split [Its Ya Boi Dragon, 17 Jun 2026 @1:03](https://youtu.be/76-Bnr1WwRs?t=63). Carguy used normal prayers when he wanted maximum crit for the elite tectonic test, and curses for the survivability-limited Glacor kill [Carguy, 22 Apr 2026 @4:58](https://youtu.be/noJjrb0888s?t=298) [Carguy, 22 Apr 2026 @16:07](https://youtu.be/noJjrb0888s?t=967).

10. **Update-dated advice (2 March 2026, "EoC 2.0").**
    - Magma Tempest and Corruption Blast flipped from granting 8% adrenaline as basics to costing 20% adrenaline as enhanced abilities. Any pre-March-2026 guide that lists them as adrenaline generators is stale [Carguy, 14 Jul 2026 @12:13](https://youtu.be/3lxLhk4l9R8?t=733) [Carguy, 14 Jul 2026 @12:48](https://youtu.be/3lxLhk4l9R8?t=768) [Qp RS, 13 Mar 2026 @0:33](https://youtu.be/QRl8NJH82nA?t=33).
    - Combat spells now trigger the global cooldown when cast manually [Carguy, 14 Jul 2026 @28:10](https://youtu.be/3lxLhk4l9R8?t=1690).
    - Greater Sunshine did **not** get converted to a self-buff even though Greater Death's Swiftness did — it is still ground-planted [Carguy, 14 Jul 2026 @15:36](https://youtu.be/3lxLhk4l9R8?t=936).
    - Four-ticking is gone, which is why the manual-spell-casting setting is now largely optional [Carguy, 14 Jul 2026 @25:20](https://youtu.be/3lxLhk4l9R8?t=1520).
    - Blast Diffusion Boots were changed by the update to their current Wild-Magic-triggered form [Carguy, 22 Apr 2026 @2:44](https://youtu.be/noJjrb0888s?t=164).
    - Combat stats now go to 120, which has largely removed magic's accuracy problems and shrunk the Gothic staff EOF's niche [Carguy, 14 Jul 2026 @38:19](https://youtu.be/3lxLhk4l9R8?t=2299) [MrEznorbRS, 17 May 2026 @2:46](https://youtu.be/6mVcYE0iQw0?t=166).
    - The Chaotic Grimoire arrived with a Dungeoneering update at some point before 17 May 2026 [MrEznorbRS, 17 May 2026 @3:19](https://youtu.be/6mVcYE0iQw0?t=199).

11. **Dated advice predating the update.** Exsanguinate used to buff FSOA hits because they counted as basic abilities — a side effect of the FSOA rework Carguy dates to roughly June/July 2023. That is no longer true; he is unsure whether the removal is a bug or intended and does not expect it to be reverted [Carguy, 14 Jul 2026 @23:36](https://youtu.be/3lxLhk4l9R8?t=1416) [Carguy, 14 Jul 2026 @24:12](https://youtu.be/3lxLhk4l9R8?t=1452). Also historical: the Eruptive perk was called Equilibrium until a March 2024 rename, so older perk guides use the other name [Carguy, 22 Apr 2026 @2:10](https://youtu.be/noJjrb0888s?t=130).

12. **Where magic sits overall.** Carguy: magic is "on the back burner as far as top-end bleeding edge DPM is concerned" but performs well at most bosses [Carguy, 14 Jul 2026 @0:00](https://youtu.be/3lxLhk4l9R8?t=0). DiamondFang: magic felt the weakest of the three early, and he expects a buff, though not one that reorders the priority list [DiamondFang, 14 Apr 2026 @9:31](https://youtu.be/KyIGNqMIj8g?t=571) [DiamondFang, 14 Apr 2026 @20:41](https://youtu.be/KyIGNqMIj8g?t=1241). As of the newest video in this set (2 August 2026) no such buff is mentioned [T_y2bHBvHa8].

13. **Unresolved caption garble (do not treat as fact).**
    - Carguy's Tumeken's-in-Sunshine crit figure transcribes as "7 12%" [Carguy, 14 Jul 2026 @15:03](https://youtu.be/3lxLhk4l9R8?t=903) — DiamondFang's 7.5% is probably what is meant, but the captions do not confirm it.
    - Its Ya Boi Dragon says to "full channel the asphyxiate cancel at 4.2 seconds" [Its Ya Boi Dragon, 17 Jun 2026 @4:48](https://youtu.be/76-Bnr1WwRs?t=288); his live commentary only ever gives a cancel figure for Smoke Tendrils (0.6 seconds) [Its Ya Boi Dragon, 17 Jun 2026 @6:26](https://youtu.be/76-Bnr1WwRs?t=386). Whether Asphyxiate is meant to be cancelled at all is unclear from this transcript.
    - DiamondFang's second EOF, transcribed "ebon's"/"evens", is not identifiable; his rule is only that it beats the Ember staff above 60% boss HP [DiamondFang, 14 Apr 2026 @7:49](https://youtu.be/KyIGNqMIj8g?t=469).
    - MrEznorb's "Legatus ascendant staff" [MrEznorbRS, 2 Aug 2026 @8:59](https://youtu.be/T_y2bHBvHa8?t=539) is most likely the Legatus Ember staff, unconfirmed.
    - Carguy's stalled-wand-spec figure "that one said 524" [Carguy, 14 Jul 2026 @40:34](https://youtu.be/3lxLhk4l9R8?t=2434) has no unit in the transcript; context (the 600k Raksha pool skip) suggests it is a damage total in the hundreds of thousands.

---

## Necromancy, and the rules that apply to every style

*An adrenaline-budget problem: necrosis inside Living Death, residual souls outside it.*


Sources read in full:

| id | author | title | date |
|---|---|---|---|
| 7x5efr5WlwI | DiamondFang | Complete Necromancy PvM Guide | 2026-05-12 |
| UrObmwGTX08 | Carguy | New DPS guides / what I've figured out | 2026-04-08 |
| kwKL_X8zVcY | MrEznorbRS | Is Necromancy Ruining Other Combat Styles? | 2026-06-07 |
| mxoVHIPzUh4 | KevMcGames | Learn Fast PvM Rotations (10-Second Boss Guide) | 2026-03-25 |
| xpghcq6-Zik | Invoked by Red | Beginner's Guide to PvM | 2026-06-16 |
| uRPVLAKjyx0 | Wings of Absurdity | Which adrenaline potion should you use | 2026-05-27 |
| h0seitvhpOc | RSBANDB | Hungry Like the Wolf Relic Guide | 2026-06-23 |

Effectively all Necromancy ability detail comes from 7x5efr5WlwI. The other six contribute
cross-style, potion, relic and practice material only.

**Caption-garble note.** The auto-captions in 7x5efr5WlwI consistently render *bloat* as
"blow"/"blood", *threads of fate* as "breath of faith"/"dread soul of fate", *weapon spec* as
"weapon's back", *Rasial* as "racial", *Amascut* as "a Masque", *Nakatra* as "Nakatara",
*Conjure Undead Army* as "summon undid army". Terms I could **not** resolve with confidence are
flagged inline with "(garbled …)" and are also listed at the end of section 6.

---

### Necromancy ability by ability

#### Living Death — ultimate
- Unlike other styles' ultimates it is not a flat damage buff; DiamondFang calls it a "loaded"
  ability with several distinct effects [DiamondFang, 12 May 2026 @1:45](https://youtu.be/7x5efr5WlwI?t=105).
- Effects while active: Death Skulls cooldown drops to 10.2 s; the Necromancy basic attack grants
  2 necrosis stacks; Finger of Death deals 50% more damage; Touch of Death grants 6% more
  adrenaline (15% total instead of the usual amount) [[DiamondFang, 12 May 2026 @1:45](https://youtu.be/7x5efr5WlwI?t=105), 02:17, 06:14].
- On cast it **resets** the cooldowns of Death Skulls and Touch of Death [DiamondFang, 12 May 2026 @2:17](https://youtu.be/7x5efr5WlwI?t=137).
- Its own cooldown is longer than other styles' ultimates; DiamondFang speculates this is
  compensation for Necromancy having no adrenaline buff, and says he does not really know
  [DiamondFang, 12 May 2026 @2:17](https://youtu.be/7x5efr5WlwI?t=137).
- **When to press:** after the opener has banked soul stacks and adrenaline; ideally on the same
  tick as the adrenaline potion so that Death Skulls is immediately affordable
  [DiamondFang, 12 May 2026 @30:14](https://youtu.be/7x5efr5WlwI?t=1814).
- **Combo:** Living Death → Touch of Death immediately (adrenaline) → Death Skulls. With full
  adrenaline gear: Living Death → adrenaline renewal → Touch → Death Skulls, which enables three
  Death Skulls inside one Living Death [[DiamondFang, 12 May 2026 @6:14](https://youtu.be/7x5efr5WlwI?t=374), 30:14].
- **Inside vs outside:** prioritise *necrosis* abilities (Finger, boosted autos) inside Living
  Death, and *soul* abilities (sap/volley) outside it [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546).
- **Mistake:** using the weapon special before Living Death — the spec eats all necrosis stacks
  [DiamondFang, 12 May 2026 @24:04](https://youtu.be/7x5efr5WlwI?t=1444).

#### Death Skulls — the main damage ability
- "It is the single biggest necro ability" and every rotation is built around fitting as many as
  possible [DiamondFang, 12 May 2026 @3:24](https://youtu.be/7x5efr5WlwI?t=204).
- Skulls bounce between you and the target(s); damage is calculated on the first hit. The main
  target is the one with the highest maximum HP in the room, which in practice is always the boss
  [DiamondFang, 12 May 2026 @2:50](https://youtu.be/7x5efr5WlwI?t=170).
- 3 hits on the main target without the Zuk cape, 4 with it; bounces also damage auxiliary targets,
  and with no other target it bounces back to you [DiamondFang, 12 May 2026 @3:24](https://youtu.be/7x5efr5WlwI?t=204).
- Cost: 60% adrenaline, 40% with the adrenaline-saving setup (transcript says "COE and bigger" —
  Conservation of Energy plus a second unnamed source) [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237).
- **Advanced use:** deliberately steering the bounces onto significant targets, e.g. at
  Angel of Death [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237).
- **Revolution:** DiamondFang never puts it on revo; MrEznorb's revo bar only automates conjures,
  Command Ghost and Command Skeleton, keeping Death Skulls/Finger/Volley manual
  [MrEznorbRS, 7 Jun 2026 @1:42](https://youtu.be/kwKL_X8zVcY?t=102).
- **Goal:** three Death Skulls inside every Living Death; he stresses this is a goal, not always
  achievable if the boss phases [DiamondFang, 12 May 2026 @25:11](https://youtu.be/7x5efr5WlwI?t=1511).

#### Split Soul — utility/buff (incantation)
- Converts Soul Split's healing into damage; 60-second cooldown, lasts 24.4 s
  [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237).
- Less punishing on Necromancy than on ranged because the conjured ghost replaces the lost healing;
  ranged has no cooldown on it so ranged always runs it [DiamondFang, 12 May 2026 @4:32](https://youtu.be/7x5efr5WlwI?t=272).
- **Use on cooldown.** DiamondFang argues it is probably more damage than Living Death, because
  Living Death only boosts Finger of Death while Split Soul boosts everything
  [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546).
- **Combo:** it favours multi-hit abilities, so Volley of Souls inside Split Soul is where volley
  shines [[DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512), 32:27].
- Cast in the pre-build, before the fight starts [[DiamondFang, 12 May 2026 @22:23](https://youtu.be/7x5efr5WlwI?t=1343), 30:14].

#### Bloat — bleed
- A bleed that behaves unusually: it can crit, a crit increases the damage, and the whole bleed is
  calculated from the initial hit. Damage is dealt over 19.8 s [DiamondFang, 12 May 2026 @4:32](https://youtu.be/7x5efr5WlwI?t=272).
- **When:** open the fight with it and re-apply as it expires; upkeep matters most in long fights
  [[DiamondFang, 12 May 2026 @4:32](https://youtu.be/7x5efr5WlwI?t=272)–05:05, 22:23].
- **Late-game conflict:** with better gear you often cannot keep it up, because adrenaline is
  needed for the T95 special instead — you cannot afford both the spec and Bloat inside Living
  Death unless you get an adrenaline proc [[DiamondFang, 12 May 2026 @5:05](https://youtu.be/7x5efr5WlwI?t=305), 29:07, 32:27].
- **Team rule:** multiple players cannot Bloat the same target; in a team of Necromancers agree who
  bloats, or in a disorganised team nobody does [DiamondFang, 12 May 2026 @32:27](https://youtu.be/7x5efr5WlwI?t=1947).

#### Necromancy basic attack ("necro basic") — basic
- Uniquely relevant: DiamondFang says it is the only basic ability in the game that actually earns
  a place in rotations, because Necromancy is so adrenaline-starved [DiamondFang, 12 May 2026 @5:05](https://youtu.be/7x5efr5WlwI?t=305).
- Gains 1% extra adrenaline from the Invigorating perk; is damage-boosted by the T95 special
  attack's buff; generates necrosis stacks while Living Death is active [DiamondFang, 12 May 2026 @5:39](https://youtu.be/7x5efr5WlwI?t=339).
- **When:** as filler ("a couple autos") to rebuild adrenaline and necrosis, and — in the late-game
  rotation — deliberately woven after every buffed key ability inside Living Death
  [[DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375), 30:46].

#### Touch of Death — basic (long cooldown)
- Generates 4 necrosis stacks both inside and outside Living Death; inside Living Death it also
  gives 6% extra adrenaline, i.e. 15% total [DiamondFang, 12 May 2026 @5:39](https://youtu.be/7x5efr5WlwI?t=339).
- **When:** immediately after Living Death (it is reset by the cast, and the adrenaline is what pays
  for the first Death Skulls); then again whenever it comes off cooldown inside the ultimate
  [[DiamondFang, 12 May 2026 @6:14](https://youtu.be/7x5efr5WlwI?t=374), 30:14].
- It is one of the "key abilities" that primes a boosted auto-attack under the T95 spec buff
  [DiamondFang, 12 May 2026 @29:07](https://youtu.be/7x5efr5WlwI?t=1747).

#### Finger of Death — enhanced, necrosis spender
- ~300% damage baseline; +50% multiplicative under Living Death, averaging about 445%
  [DiamondFang, 12 May 2026 @6:14](https://youtu.be/7x5efr5WlwI?t=374).
- Consumes up to 6 necrosis stacks; each stack makes the cast 10% cheaper as a flat percentage, so
  at 6 stacks it is free. Necrosis caps at 12 stacks [DiamondFang, 12 May 2026 @6:48](https://youtu.be/7x5efr5WlwI?t=408).
- Necrosis sources: the Necromancy basic, Touch of Death, and the Occultist's ring (10% chance of
  2 stacks per ability cast, averaging ~7 stacks per minute) [DiamondFang, 12 May 2026 @6:48](https://youtu.be/7x5efr5WlwI?t=408).
- **When:** inside Living Death, at 6 stacks, alternating with autos to rebuild stacks
  [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846).
- Also a "key ability" that primes the boosted auto under the T95 spec buff [DiamondFang, 12 May 2026 @29:07](https://youtu.be/7x5efr5WlwI?t=1747).

#### Soul Sap — soul (residual soul) generator
- The only ability that generates residual souls, apart from a ring [DiamondFang, 12 May 2026 @7:22](https://youtu.be/7x5efr5WlwI?t=442).
- Cap is 3 souls, raised to 5 by the Soulbound lantern. The base 3 are inherent and survive a style
  switch; the extra 2 from the lantern are lost if the lantern is unequipped
  [DiamondFang, 12 May 2026 @7:22](https://youtu.be/7x5efr5WlwI?t=442).
- **Usable every three abilities** [DiamondFang, 12 May 2026 @7:56](https://youtu.be/7x5efr5WlwI?t=476).
- Souls can only be harvested from targets with a health bar — so you cannot pre-stack souls on a
  practice dummy [DiamondFang, 12 May 2026 @7:56](https://youtu.be/7x5efr5WlwI?t=476).
- **Combo:** Threads of Fate → Soul Sap fills all soul stacks at once (transcript garbles Threads
  of Fate as "dread soul of fate") [DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512).
- **When:** front-load saps in the opener so that you do not have to spend GCDs on them inside
  Living Death, where synergising abilities are better [DiamondFang, 12 May 2026 @22:23](https://youtu.be/7x5efr5WlwI?t=1343).

#### Volley of Souls — enhanced, soul spender
- Best soul spender for single target, and with Threads of Fate possibly the best multi-target one
  as well [DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512).
- Every soul stack adds an extra hit; multi-hit means it scales unusually well with Split Soul
  [DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512).
- At 5 stacks (Soulbound lantern) it does 750% damage and consumes all souls
  [DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512).
- **When:** outside Living Death, ideally inside Split Soul [DiamondFang, 12 May 2026 @32:27](https://youtu.be/7x5efr5WlwI?t=1947).

#### Soul Strike — soul spender, stun/AoE
- A targeted AoE stun in a small area around the target; consumes a single soul
  [DiamondFang, 12 May 2026 @9:06](https://youtu.be/7x5efr5WlwI?t=546).
- With the Flanking perk it does a "pretty respectable 390%" and can substitute for Volley when
  there is no time to stack [DiamondFang, 12 May 2026 @9:06](https://youtu.be/7x5efr5WlwI?t=546).
- Per soul it is more efficient than Volley, but usually he still recommends Volley; a Flanking
  Soul Strike on 1 soul beats a 2-soul Volley, so use it when you are stuck on low souls. It needs
  a Flanking switch [DiamondFang, 12 May 2026 @9:06](https://youtu.be/7x5efr5WlwI?t=546).

#### Spectral Scythe — AoE (identification uncertain)
- Described as an ability that packs three melee abilities into one: a Slice-equivalent (he notes
  Slice no longer exists post-rework, so an adaptive-strike two-hander equivalent), a
  Cleave-equivalent, and a copy of Meteor Strike without the crit buff; the parts cost progressively
  more adrenaline [DiamondFang, 12 May 2026 @14:03](https://youtu.be/7x5efr5WlwI?t=843).
- Has a **chance** (not a guarantee) to generate soul stacks; he says guaranteed souls would have
  made it worth using [DiamondFang, 12 May 2026 @14:36](https://youtu.be/7x5efr5WlwI?t=876).
- **When:** essentially never on single target, and only in AoE once your better AoE tools are spent
  [DiamondFang, 12 May 2026 @14:36](https://youtu.be/7x5efr5WlwI?t=876).
- The captions call this "soul split", which cannot be right in context (Soul Split is the prayer,
  discussed separately). The three-melee-copy description matches Spectral Scythe, but I cannot
  confirm the name from the transcript alone.

#### Threads of Fate — utility (AoE converter)
- Called "the best area ability in the game": makes your next three abilities AoE
  [DiamondFang, 12 May 2026 @15:09](https://youtu.be/7x5efr5WlwI?t=909).
- Generates extra souls but **not** extra necrosis stacks [DiamondFang, 12 May 2026 @15:09](https://youtu.be/7x5efr5WlwI?t=909).
- **Combos:** Threads of Fate → Soul Sap → Volley to jump straight to 5 souls and dump them, or with
  souls pre-stacked, Volley → Sap → Volley for a large AoE burst [DiamondFang, 12 May 2026 @15:09](https://youtu.be/7x5efr5WlwI?t=909).
- Does not apply to Death Skulls (the captions say "souls", but the stated reason — it "would be
  way too OP" — and context point to Death Skulls) or to conjure abilities
  [DiamondFang, 12 May 2026 @15:09](https://youtu.be/7x5efr5WlwI?t=909).

#### Invoke Death — utility (execute mark)
- Places a mark; the target is executed when it is below 20% health **and** under 30k HP, and is
  then hit with Necromancy damage. The mark persists until those conditions are met
  [DiamondFang, 12 May 2026 @15:42](https://youtu.be/7x5efr5WlwI?t=942).
- Worth roughly 30k free damage [DiamondFang, 12 May 2026 @26:18](https://youtu.be/7x5efr5WlwI?t=1578).
- **Mistake:** marking a target and then leaving/not landing the Necromancy hit yourself, so it
  never triggers; DiamondFang admits forgetting Invoke Death in his own recorded kill and the boss
  surviving as a result [[DiamondFang, 12 May 2026 @15:42](https://youtu.be/7x5efr5WlwI?t=942), 26:18].

#### Conjure Undead Army — utility (summon all)
- Summons all your conjures at once; you select which ones, and he believes you can now slot four
  [DiamondFang, 12 May 2026 @9:39](https://youtu.be/7x5efr5WlwI?t=579).
- Its point is saving GCDs versus summoning one by one as on Necromancy release, and preserving
  ghost/skeleton stacks; use it together with Life Transfer to extend the conjures
  [DiamondFang, 12 May 2026 @10:11](https://youtu.be/7x5efr5WlwI?t=611).
- **Always the first action of the pre-build** [DiamondFang, 12 May 2026 @21:15](https://youtu.be/7x5efr5WlwI?t=1275).
- **Revolution:** MrEznorb has conjures on his revo bar so they are re-summoned automatically
  [MrEznorbRS, 7 Jun 2026 @1:42](https://youtu.be/kwKL_X8zVcY?t=102).

#### Life Transfer — utility
- Extends the conjures' lifetime; because the Command Ghost buff lasts only while your summons live,
  Life Transfer also extends the ghost buff [DiamondFang, 12 May 2026 @21:49](https://youtu.be/7x5efr5WlwI?t=1309).
- **Rule of thumb:** use it if the fight will run longer than roughly a minute (about 45 s without
  the Rasial set); he recommends just always doing it as a habit [DiamondFang, 12 May 2026 @21:15](https://youtu.be/7x5efr5WlwI?t=1275).

#### Command Ghost / the ghost conjure
- The ghost heals you; this innate sustain is why Necromancy can be played without prayer flicking
  [DiamondFang, 12 May 2026 @0:06](https://youtu.be/7x5efr5WlwI?t=6).
- Commanding it applies the Haunted debuff to the target it is attacking, making that target take
  extra damage **from the whole team** — up to 10%, though he says in practice it is often around
  3k per hit and is hard to quantify [DiamondFang, 12 May 2026 @10:44](https://youtu.be/7x5efr5WlwI?t=644).
- Because the buff is team-wide, a single Necromancer in a team of hybrids can be worth more than
  another DPS camp [[DiamondFang, 12 May 2026 @11:18](https://youtu.be/7x5efr5WlwI?t=678), 32:27].
- The Devious Nexus (transcript term; later garbled as "wars nexus") trades the ghost's healing for
  more damage — not recommended until you are comfortable, since the healing is Necromancy's main
  selling point [[DiamondFang, 12 May 2026 @11:18](https://youtu.be/7x5efr5WlwI?t=678)–11:51, 33:32].
- **Revolution:** MrEznorb puts Command Ghost on revo so it fires on cooldown
  [MrEznorbRS, 7 Jun 2026 @1:42](https://youtu.be/kwKL_X8zVcY?t=102).

#### Command Skeleton / the skeleton conjure
- The skeleton attacks every 5 ticks normally; commanded it attacks 10 times in 10 ticks
  [DiamondFang, 12 May 2026 @11:51](https://youtu.be/7x5efr5WlwI?t=711).
- It accumulates rage stacks while alive, so keeping conjures alive raises its damage
  [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744).
- Command Skeleton is worth about 305% ability damage and costs 0 adrenaline, but has no synergy
  with Soul Split or Living Death — "bottom of the totem pole" for priority
  [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744).
- **When:** as free filler when you have spare adrenaline, or pre-cast before the boss spawns; this
  is what lets Necromancy mostly skip stalling [DiamondFang, 12 May 2026 @26:18](https://youtu.be/7x5efr5WlwI?t=1578). Still good outside Living
  Death [DiamondFang, 12 May 2026 @32:27](https://youtu.be/7x5efr5WlwI?t=1947).
- **Revolution:** on MrEznorb's revo bar, and he singles it out as a large chunk of free damage for
  a player who does nothing else [MrEznorbRS, 7 Jun 2026 @1:42](https://youtu.be/kwKL_X8zVcY?t=102).

#### Command Zombie / the zombie conjure
- The zombie deals extra poison damage but is otherwise weak; commanded it deals 400% damage but
  the hit is heavily delayed and therefore awkward to use [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744).
- The commanded detonation can beat a Flanking Soul Strike, but you lose the zombie's later passive
  damage, so DiamondFang thinks it usually is not worth it [DiamondFang, 12 May 2026 @12:57](https://youtu.be/7x5efr5WlwI?t=777).
- **Where it shines:** poisonable encounters — the zombie's passive damage scales with every poison
  buff you have (he cites Cinderbanes and "sticks", probably poisoned weapon/ammo), and the
  detonation he believes does *not* stack with poison multipliers [DiamondFang, 12 May 2026 @12:57](https://youtu.be/7x5efr5WlwI?t=777).

#### Command Phantom Guardian / the phantom conjure
- Passive damage reduction; the command does up to 300 damage at maximum stacks, and the stacks
  only build from you being hit, so they take a long time [DiamondFang, 12 May 2026 @13:30](https://youtu.be/7x5efr5WlwI?t=810).
- DiamondFang calls the command "pretty much worthless" [DiamondFang, 12 May 2026 @13:30](https://youtu.be/7x5efr5WlwI?t=810).
- MrEznorb still values the phantom for tankiness for beginners [MrEznorbRS, 7 Jun 2026 @2:16](https://youtu.be/kwKL_X8zVcY?t=136).

#### Blood Siphon — utility/heal
- AoE ability that drains life from nearby enemies, 45-second cooldown; a healing tool for hard
  encounters (he names Telos as an example) [DiamondFang, 12 May 2026 @13:30](https://youtu.be/7x5efr5WlwI?t=810).

#### Cross-style Necromancy incantations (usable with other styles)
- Great Bone Shield (level 73) replaces a shield switch for Resonance; Darkness (level 86) is
  roughly a 10–20% tankiness increase and is treated as near-mandatory on every style
  [MrEznorbRS, 7 Jun 2026 @4:26](https://youtu.be/kwKL_X8zVcY?t=266).
- Split Soul, Invoke Death and Threads of Fate are Necromancy-only incantations that MrEznorb
  calls "insane" quality-of-life; the equivalents on other styles cost far more to unlock
  [MrEznorbRS, 7 Jun 2026 @5:33](https://youtu.be/kwKL_X8zVcY?t=333).

#### Weapon special attack (T95) — spec
- After each "key ability" — Touch of Death, Finger of Death, or the T95 spec itself — your next
  auto-attack is boosted; the buff lasts 30 s [DiamondFang, 12 May 2026 @29:07](https://youtu.be/7x5efr5WlwI?t=1747).
- The spec consumes all necrosis stacks and has diminishing returns from hit caps; use it at
  roughly 4–8 stacks [DiamondFang, 12 May 2026 @24:04](https://youtu.be/7x5efr5WlwI?t=1444).
- **Timing:** never immediately before Living Death (it would strip the necrosis you want for
  Finger); immediately after Living Death is described as perfect, and in the late-game rotation it
  is fired early *inside* Living Death to arm the auto-attack buff [[DiamondFang, 12 May 2026 @24:04](https://youtu.be/7x5efr5WlwI?t=1444), 30:14].
- Also the only way Necromancy can stall, because weapon specs are HP abilities rather than
  Necromancy abilities — DiamondFang thinks this is a Jagex oversight
  [DiamondFang, 12 May 2026 @33:32](https://youtu.be/7x5efr5WlwI?t=2012).
- Before you own T95 weapons, put the T90 weapon into an Essence of Finality amulet and use that as
  the spec weapon; if you are farming Rasial, camp the Salve amulet instead and carry the EoF as a
  switch [DiamondFang, 12 May 2026 @26:53](https://youtu.be/7x5efr5WlwI?t=1613).

---

### Necromancy rotations

#### Pre-build (both rotations start this way)
Necromancy's pre-build is innate — unlike other styles it comes from needing to summon and buff
minions, and unusually it does **not** need a dummy [DiamondFang, 12 May 2026 @21:15](https://youtu.be/7x5efr5WlwI?t=1275).

1. Conjure Undead Army [DiamondFang, 12 May 2026 @21:15](https://youtu.be/7x5efr5WlwI?t=1275)
2. Life Transfer (habit; required if the fight will exceed ~1 minute, ~45 s without Rasial gear)
   [DiamondFang, 12 May 2026 @21:49](https://youtu.be/7x5efr5WlwI?t=1309)
3. Command Ghost (buff persists while summons live) [DiamondFang, 12 May 2026 @21:49](https://youtu.be/7x5efr5WlwI?t=1309)
4. Split Soul [DiamondFang, 12 May 2026 @22:23](https://youtu.be/7x5efr5WlwI?t=1343)
5. Bloat as/into the first hit [DiamondFang, 12 May 2026 @22:23](https://youtu.be/7x5efr5WlwI?t=1343)

Late-game variant: Conjure Undead Army → Life Transfer → Ghost → Split Soul → **Command Skeleton
right before the boss spawns**, then Bloat on the first hit. At Raksha he surges in on the same tick
as the ghost cast [DiamondFang, 12 May 2026 @30:14](https://youtu.be/7x5efr5WlwI?t=1814).

Note: souls cannot be pre-stacked on a dummy because dummies have no health bar
[DiamondFang, 12 May 2026 @7:56](https://youtu.be/7x5efr5WlwI?t=476).

#### Basic (mid-game) fight loop
1. Soul Sap → Death Skulls → Touch of Death → Soul Sap [DiamondFang, 12 May 2026 @22:23](https://youtu.be/7x5efr5WlwI?t=1343)
2. A couple of basic attacks (nothing better to do; builds adrenaline) → Soul Sap
   [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
3. Adrenaline potion → **Living Death** [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
4. Touch of Death immediately (reset by Living Death, and it is the adrenaline source)
   [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
5. Finger of Death (boosted, and you hold stacks from the earlier Touches) [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
6. Death Skulls [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
7. Re-Bloat as it expires → couple of autos → Finger of Death [DiamondFang, 12 May 2026 @22:55](https://youtu.be/7x5efr5WlwI?t=1375)
8. Auto → Touch of Death → Death Skulls (Death Skulls here rather than Finger, otherwise it will not
   be off cooldown before Living Death ends) [DiamondFang, 12 May 2026 @23:30](https://youtu.be/7x5efr5WlwI?t=1410)
9. Autos → Finger → auto → Finger, cramming in as many Fingers as possible
   [DiamondFang, 12 May 2026 @23:30](https://youtu.be/7x5efr5WlwI?t=1410)
10. Final Death Skulls right before Living Death expires — this is the third one
    [DiamondFang, 12 May 2026 @23:30](https://youtu.be/7x5efr5WlwI?t=1410)
11. Post-ultimate: re-Bloat → dump souls (Volley of Souls) → Soul Sap → Touch → weapon spec →
    Soul Sap, then rebuild toward the next Death Skulls / Living Death cycle
    [DiamondFang, 12 May 2026 @24:04](https://youtu.be/7x5efr5WlwI?t=1444)

Caveat he states himself: this loop assumes uninterrupted damage on the target, which no real fight
provides, and it is long — at a short boss like Vindicta you cut the whole opener and ending and
just run the Living Death block with Split Soul, adapting with adaptive abilities as stacks require
[DiamondFang, 12 May 2026 @24:38](https://youtu.be/7x5efr5WlwI?t=1478).

#### Late-game fight loop (tested at Raksha)
Assumes T95 weapons and armour from Rasial, Equilibrium perk, Scripture of Ful, and the full
adrenaline kit [[DiamondFang, 12 May 2026 @26:53](https://youtu.be/7x5efr5WlwI?t=1613), 29:40].

1. Pre-build as above, ending with Command Skeleton before spawn [DiamondFang, 12 May 2026 @30:14](https://youtu.be/7x5efr5WlwI?t=1814)
2. Bloat on the first hit → Soul Sap → Death Skulls → Touch of Death → Soul Sap (identical opener to
   the basic rotation) [DiamondFang, 12 May 2026 @30:14](https://youtu.be/7x5efr5WlwI?t=1814)
3. A couple of autos → Soul Sap [DiamondFang, 12 May 2026 @30:14](https://youtu.be/7x5efr5WlwI?t=1814)
4. **Living Death and the adrenaline potion on the same tick** — click Living Death first, then the
   potion. This is what makes Death Skulls immediately affordable [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846)
5. Touch of Death → Death Skulls → T95 special attack (to arm the auto buff) → auto (spend the buff
   at once) [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846)
6. Finger → auto → Finger → auto (every auto is buffed and rebuilds necrosis)
   [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846)
7. Touch → Death Skulls (off cooldown) → auto → Finger → auto → auto → Finger
   [DiamondFang, 12 May 2026 @31:20](https://youtu.be/7x5efr5WlwI?t=1880)
8. Third Death Skulls → auto [DiamondFang, 12 May 2026 @31:20](https://youtu.be/7x5efr5WlwI?t=1880)
9. Tail: Soul Sap → Bloat → EoF/T90 spec → Soul Sap → Volley of Souls — he explicitly says the exact
   order here "doesn't really matter" [DiamondFang, 12 May 2026 @31:20](https://youtu.be/7x5efr5WlwI?t=1880)
10. At Raksha you clear pools after the last Death Skulls [DiamondFang, 12 May 2026 @31:52](https://youtu.be/7x5efr5WlwI?t=1912)

Trade-off: adrenaline is so tight that you cannot use both the T95 spec and Bloat inside Living
Death unless you get an adrenaline proc [DiamondFang, 12 May 2026 @32:27](https://youtu.be/7x5efr5WlwI?t=1947).

#### Rotation principles DiamondFang extracts
- Get as many Death Skulls as possible; aim for three inside every Living Death
  [DiamondFang, 12 May 2026 @25:11](https://youtu.be/7x5efr5WlwI?t=1511).
- Keep Bloat active as long as you can (mid-game; this changes at late game)
  [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546).
- Use Split Soul on cooldown [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546).
- Souls outside Living Death, necrosis inside [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546).
- Command Skeleton is the free filler; pre-cast it before the boss spawns instead of stalling
  [DiamondFang, 12 May 2026 @26:18](https://youtu.be/7x5efr5WlwI?t=1578).
- Remember Invoke Death [DiamondFang, 12 May 2026 @26:18](https://youtu.be/7x5efr5WlwI?t=1578).
- Practise rotations on the PvM Hub combat dummies before taking them to a boss; he says the best
  players do this routinely and there is no shame in it [DiamondFang, 12 May 2026 @18:32](https://youtu.be/7x5efr5WlwI?t=1112).

#### Practice methodology (not Necromancy-specific)
KevMcGames demonstrates learning a short published rotation at a boss by repetition, tracking kill
times (28 s → 21 s → 19.2 s → eventually near 10 s), isolating the one mechanic he kept failing —
releasing a stalled Dark Bow — on dummies, and then scaling the same approach to harder bosses
(QBD sub-30 s, then Nex) [KevMcGames, 25 Mar 2026 @0:33](https://youtu.be/mxoVHIPzUh4?t=33).

---

### Cross-style rules after the update

The rework is referred to as "EOC 2.0"; Carguy's video is an update to an initial DPS video he made
when it dropped [Carguy, 8 Apr 2026 @0:00](https://youtu.be/UrObmwGTX08?t=0). **None of these seven transcripts state the update's date** —
the 2 March 2026 date comes from outside them. Other names used for it: "the combat rework"
[DiamondFang, 12 May 2026 @24:38](https://youtu.be/7x5efr5WlwI?t=1478), "the combat update" [[MrEznorbRS, 7 Jun 2026 @0:34](https://youtu.be/kwKL_X8zVcY?t=34); [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66)]. The
transcripts discuss the rules only in fragments — see the gaps note at the end of this section.

#### Ability classes
- The classes named across the videos are **basic**, **enhanced**, **ultimate** and (implicitly)
  utility/incantation abilities. RSBANDB states the economy plainly: basics build adrenaline,
  enhanced and ultimate abilities spend it for damage [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66).
- MrEznorb calls Finger of Death and Volley of Souls "high-level enhanced abilities"
  [MrEznorbRS, 7 Jun 2026 @2:16](https://youtu.be/kwKL_X8zVcY?t=136).
- Necromancy's oddity: it is the only style where a **basic attack** genuinely belongs in a
  rotation, because the style is adrenaline-starved [DiamondFang, 12 May 2026 @5:05](https://youtu.be/7x5efr5WlwI?t=305).
- Necromancy alone has no adrenaline buff on its ultimate, which is why it does not hybrid well
  into other styles [DiamondFang, 12 May 2026 @1:45](https://youtu.be/7x5efr5WlwI?t=105).

#### Adrenaline
- Sources named for Necromancy: Conservation of Energy (relic), Ring of Vigour, the Invigorating 4
  perk, and Fury of the Small. Late-game rotations need all four; early rotations can drop
  Invigorating **or** Fury of the Small, never both [[DiamondFang, 12 May 2026 @20:08](https://youtu.be/7x5efr5WlwI?t=1208), 29:40].
- Adrenaline potions can be drunk on the same tick as an ultimate [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846).
- Adrenaline crystals in practice areas let you top up before a dummy rotation
  [Carguy, 8 Apr 2026 @5:04](https://youtu.be/UrObmwGTX08?t=304).
- Magic is the adrenaline-rich style — Carguy stopped using Smoke Tendrils entirely partly because
  magic has adrenaline to spare [Carguy, 8 Apr 2026 @16:48](https://youtu.be/UrObmwGTX08?t=1008). Necromancy is the opposite: "we're
  constantly starving for adrenaline" [DiamondFang, 12 May 2026 @31:52](https://youtu.be/7x5efr5WlwI?t=1912).
- Solid food now drains 3% adrenaline (down from 10 before the update)
  [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66); DiamondFang says even 3% is bad enough that Necromancy should avoid solids
  and use Guthix/Saradomin brews and blubber-type food instead [DiamondFang, 12 May 2026 @20:42](https://youtu.be/7x5efr5WlwI?t=1242).

#### Stalling
- Stalling (charging an ability and releasing it as you enter the arena / on target cycle) is still
  central to fast openers on the other styles: Carguy stalls Assault (captions: "easy case") and
  releases with Meteor Strike at the start of a boss [Carguy, 8 Apr 2026 @1:07](https://youtu.be/UrObmwGTX08?t=67), and KevMcGames
  stalls a Dark Bow into the arena and releases it [KevMcGames, 25 Mar 2026 @0:00](https://youtu.be/mxoVHIPzUh4?t=0).
- **New/notable:** you can Surge and Escape while holding a stall, and their cooldowns are not
  shared at all [Carguy, 8 Apr 2026 @5:04](https://youtu.be/UrObmwGTX08?t=304).
- **Necromancy exception:** Necromancy can only stall with weapon specials, because specs are HP
  abilities rather than Necromancy abilities; DiamondFang believes Jagex did not intend Necromancy
  to stall. Most of the time he recommends not stalling and pre-casting Command Skeleton instead —
  a small damage loss [DiamondFang, 12 May 2026 @33:32](https://youtu.be/7x5efr5WlwI?t=2012).
- Releasing stalls cleanly is the hardest part to learn: KevMcGames spent ~10 kills failing to
  release a Dark Bow stall [KevMcGames, 25 Mar 2026 @1:55](https://youtu.be/mxoVHIPzUh4?t=115).

#### Revolution vs full manual
- Invoked by Red frames the choice: standard EoC is fully manual; Revolution has the game pick and
  time abilities for you, likened to automatic vs manual transmission; classic mode exists but just
  spams the basic attack and is unsuitable for modern bosses [Invoked by Red, 16 Jun 2026 @0:33](https://youtu.be/xpghcq6-Zik?t=33).
- The practical hybrid taught by MrEznorb: put conjures, Command Ghost and Command Skeleton (plus
  necrosis and soul builders) on the revo bar, and manually press the payoff abilities — Living
  Death, Death Skulls, Finger of Death, Volley of Souls [MrEznorbRS, 7 Jun 2026 @1:42](https://youtu.be/kwKL_X8zVcY?t=102).
- MrEznorb: even after the rework the other styles are still far more mentally intensive; on
  magic he must track which ability to use, when to Tsunami, when to Sunshine, and to keep
  Greater Concentrated Blast up for crit chance and adrenaline. Necromancy's only real combo is
  Living Death + Death Skulls (+ Finger of Death) [MrEznorbRS, 7 Jun 2026 @3:20](https://youtu.be/kwKL_X8zVcY?t=200).

#### Global cooldown and queueing
- The GCD is only referenced obliquely: the value of Conjure Undead Army is that it saves the GCDs
  that individual conjure casts would cost [DiamondFang, 12 May 2026 @10:11](https://youtu.be/7x5efr5WlwI?t=611), and Soul Sap is limited to once
  every three abilities [DiamondFang, 12 May 2026 @7:56](https://youtu.be/7x5efr5WlwI?t=476).
- **Gap:** none of these seven transcripts state GCD length, explain ability queueing/input
  buffering, or give the tick-level rules. Do not source those from this note.

#### What changed with the update, per these videos
- Necromancy became "the most adaptive style" after the combat rework, which DiamondFang finds
  ironic given his earlier claim that Necromancy removed adaptation from the game
  [DiamondFang, 12 May 2026 @24:38](https://youtu.be/7x5efr5WlwI?t=1478).
- Melee received a damage nerf roughly a week after the rework; values were toned down but
  cooldowns were untouched, so old rotations still function [Carguy, 8 Apr 2026 @1:07](https://youtu.be/UrObmwGTX08?t=67).
- Slice no longer exists [DiamondFang, 12 May 2026 @14:03](https://youtu.be/7x5efr5WlwI?t=843); adaptive strike is the replacement referenced.
- Wind arrows were buffed back to 30% damage and now need only 10 stacks; Death Spore arrows need
  12 stacks; "wind sporing" is gone, so building 22 stacks total before a Death Swiftness is
  tedious and best done on a dummy [Carguy, 8 Apr 2026 @6:46](https://youtu.be/UrObmwGTX08?t=406).
- Death Swiftness is now mobile [Carguy, 8 Apr 2026 @3:57](https://youtu.be/UrObmwGTX08?t=237).
- Equilibrium is a newly added perk that is a strong fit for Necromancy (which builds around
  Equilibrium rather than crit) but generally not worth it on melee [[DiamondFang, 12 May 2026 @26:53](https://youtu.be/7x5efr5WlwI?t=1613), 28:34;
  [Carguy, 8 Apr 2026 @2:49](https://youtu.be/UrObmwGTX08?t=169)–04:30].
- Magic received a slight buff; Wild Magic gained extra crit chance and crit damage
  [Carguy, 8 Apr 2026 @16:15](https://youtu.be/UrObmwGTX08?t=975).
- Asphyxiate now applies Channelled Might: 3.6 s / 15% crit damage without the full set, 9 s / 35%
  with full Tumeken's [Carguy, 8 Apr 2026 @18:30](https://youtu.be/UrObmwGTX08?t=1110).
- Food's adrenaline penalty dropped from 10 to 3 [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66).

#### What people get wrong about it
- MrEznorb's central claim: the rework was "a step in the right direction" but did not dislodge
  Necromancy. A community survey he cites went from 56% Necromancy usage two years ago to 44%
  after the rework — still a plurality, despite Necromancy being the weakest style at the top level
  [MrEznorbRS, 7 Jun 2026 @0:34](https://youtu.be/kwKL_X8zVcY?t=34).
- The reasons he gives are not damage but ease of use, built-in sustain/tankiness, cross-style
  quality-of-life incantations, and cost [[MrEznorbRS, 7 Jun 2026 @1:08](https://youtu.be/kwKL_X8zVcY?t=68), 09:33].
- DiamondFang's counterpoint to "Necromancy is weak": as the least-DPS style it is still worth
  bringing one Necromancer to a hybrid team purely for the ghost's Haunted debuff, and Necromancy
  makes an excellent base tank because it survives longer with less input [DiamondFang, 12 May 2026 @32:27](https://youtu.be/7x5efr5WlwI?t=1947).

---

### Adrenaline potions, relics and food

#### Adrenaline renewal vs enhanced replenishment
- Adrenaline renewal: 40% adrenaline over the next 6 seconds, at 4% per tick. Enhanced
  replenishment: 30% adrenaline instantly on drink [Wings of Absurdity, 27 May 2026 @0:00](https://youtu.be/uRPVLAKjyx0?t=0).
- The naive answer ("renewal, it's 10% more") is what the video argues against
  [Wings of Absurdity, 27 May 2026 @0:00](https://youtu.be/uRPVLAKjyx0?t=0).
- **Renewals are fine when you are not using the full duration of your ultimate** — e.g. Hard Mode
  Raksha's cooking phase: Death Swiftness → renewal → Imbued Shadows [Wings of Absurdity, 27 May 2026 @0:32](https://youtu.be/uRPVLAKjyx0?t=32).
- **Instant is better when the opener is tight.** At Grandmaster Raksha the required first three
  abilities are Death Swiftness → Imbued Shadows → Divert; with the replenishment potion the
  adrenaline is there immediately and Divert still fits, whereas waiting for renewal ticks pushes
  Divert out of the window [Wings of Absurdity, 27 May 2026 @1:06](https://youtu.be/uRPVLAKjyx0?t=66).
- The extra 10% often does nothing, because you cap at 100% anyway: after Rapid Fire both potions
  left him at exactly 100% [Wings of Absurdity, 27 May 2026 @2:47](https://youtu.be/uRPVLAKjyx0?t=167). Trying to exploit the extra 10% by using Rapid
  Fire earlier left him short for Dead Shot afterwards [Wings of Absurdity, 27 May 2026 @3:20](https://youtu.be/uRPVLAKjyx0?t=200).
- **Emergency use** favours instant: if you realise late that you will not reach 100% for
  Barricade, replenishment salvages it; renewal ticks arrive too late [Wings of Absurdity, 27 May 2026 @3:52](https://youtu.be/uRPVLAKjyx0?t=232).
- Instant is more forgiving of a mistimed drink — you can just drink it late and carry on
  [Wings of Absurdity, 27 May 2026 @4:24](https://youtu.be/uRPVLAKjyx0?t=264).
- **Verdict:** no universal answer; the right choice depends on your rotations and on whether you
  run Conservation of Energy or Heightened Senses, both of which change adrenaline flow. Bringing
  both is a legitimate answer [Wings of Absurdity, 27 May 2026 @4:57](https://youtu.be/uRPVLAKjyx0?t=297).
- Carguy's usage rule for hybrid: save the adrenaline potion for magic or ranged, almost never for
  Berserk [Carguy, 8 Apr 2026 @14:33](https://youtu.be/UrObmwGTX08?t=873).
- For Necromancy, DiamondFang drinks the potion on the same tick as Living Death
  [DiamondFang, 12 May 2026 @30:46](https://youtu.be/7x5efr5WlwI?t=1846).

#### Hungry Like the Wolf relic
- Effects: completely removes the adrenaline loss from eating, and adds 100 life points to every
  food item's healing [RSBANDB, 23 Jun 2026 @0:00](https://youtu.be/h0seitvhpOc?t=0).
- Unlock chain: complete the Guthixian One artefact collection at Taverley → receive a guardian's
  tear → combine with expensive spices from the quest *Let Them Eat Pie* → creates the tear of Enna
  → offer at the mysterious monolith [RSBANDB, 23 Jun 2026 @0:33](https://youtu.be/h0seitvhpOc?t=33). (The video says it was released with
  the "Moonrise" dig site content; the site name may be mis-transcribed.)
- Stacks with Blessing of Het: Het's +10% is applied first, then +100 from Hungry Like the Wolf,
  then a further +50 from expensive spices [RSBANDB, 23 Jun 2026 @2:12](https://youtu.be/h0seitvhpOc?t=132).
- **Who it is for:** beginners whose inventory is overload + prayer restores + a lot of solid food.
  Explicitly *not* recommended for mid-level or advanced PvMers, whose inventories are mostly
  switches, brews and auxiliary items [RSBANDB, 23 Jun 2026 @2:12](https://youtu.be/h0seitvhpOc?t=132).

#### Eating during a rotation
- Food both stalls your abilities and costs adrenaline — historically called a noob trap
  [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66).
- Solid food (sharks, soups, meat) causes the combat delay; non-solid food (Saradomin/Guthix brews,
  blubber jellyfish) heals without it [RSBANDB, 23 Jun 2026 @1:39](https://youtu.be/h0seitvhpOc?t=99).
- Necromancy specifically: DiamondFang says do not use solids unless you absolutely must (he names
  Telos as a case where you might), because Necromancy cannot afford the adrenaline
  [DiamondFang, 12 May 2026 @20:42](https://youtu.be/7x5efr5WlwI?t=1242).

---

### Numeric claims to verify

| claim | source |
|---|---|
| Living Death reduces Death Skulls cooldown to 10.2 s | [DiamondFang, 12 May 2026 @1:45](https://youtu.be/7x5efr5WlwI?t=105) |
| Necromancy basic grants 2 necrosis stacks under Living Death | [DiamondFang, 12 May 2026 @2:17](https://youtu.be/7x5efr5WlwI?t=137) |
| Finger of Death deals 50% more damage under Living Death | [DiamondFang, 12 May 2026 @2:17](https://youtu.be/7x5efr5WlwI?t=137) |
| Touch of Death gives +6% adrenaline under Living Death (15% total) | [DiamondFang, 12 May 2026 @2:17](https://youtu.be/7x5efr5WlwI?t=137), 06:14 |
| Death Skulls: 3 hits on main target without Zuk cape, 4 with | [DiamondFang, 12 May 2026 @3:24](https://youtu.be/7x5efr5WlwI?t=204) |
| Death Skulls costs 60% adrenaline, 40% with adrenaline-saving setup | [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237) |
| Split Soul: 60-second cooldown, lasts 24.4 s | [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237) |
| Bloat deals its damage over 19.8 s | [DiamondFang, 12 May 2026 @4:32](https://youtu.be/7x5efr5WlwI?t=272) |
| Necromancy basic gains 1% extra adrenaline from Invigorating | [DiamondFang, 12 May 2026 @5:39](https://youtu.be/7x5efr5WlwI?t=339) |
| Touch of Death generates 4 necrosis stacks | [DiamondFang, 12 May 2026 @5:39](https://youtu.be/7x5efr5WlwI?t=339) |
| Finger of Death ≈300% damage, ≈445% average under Living Death | [DiamondFang, 12 May 2026 @6:14](https://youtu.be/7x5efr5WlwI?t=374) |
| Finger consumes up to 6 necrosis stacks; each stack = 10% flat cheaper; free at 6 | [DiamondFang, 12 May 2026 @6:48](https://youtu.be/7x5efr5WlwI?t=408) |
| Necrosis caps at 12 stacks | [DiamondFang, 12 May 2026 @6:48](https://youtu.be/7x5efr5WlwI?t=408) |
| Occultist's ring: 10% chance of 2 necrosis stacks per ability cast | [DiamondFang, 12 May 2026 @6:48](https://youtu.be/7x5efr5WlwI?t=408) |
| Occultist's ring averages ~7 necrosis stacks per minute | [DiamondFang, 12 May 2026 @7:22](https://youtu.be/7x5efr5WlwI?t=442) |
| Residual souls cap at 3, or 5 with Soulbound lantern | [DiamondFang, 12 May 2026 @7:22](https://youtu.be/7x5efr5WlwI?t=442) |
| Soul Sap usable every 3 abilities | [DiamondFang, 12 May 2026 @7:56](https://youtu.be/7x5efr5WlwI?t=476) |
| Volley of Souls at 5 souls = 750% damage | [DiamondFang, 12 May 2026 @8:32](https://youtu.be/7x5efr5WlwI?t=512) |
| Soul Strike with Flanking ≈390% damage, consumes 1 soul | [DiamondFang, 12 May 2026 @9:06](https://youtu.be/7x5efr5WlwI?t=546) |
| A 1-soul Flanking Soul Strike out-damages a 2-soul Volley | [DiamondFang, 12 May 2026 @9:39](https://youtu.be/7x5efr5WlwI?t=579) |
| Conjure Undead Army can hold 4 conjures (he is unsure) | [DiamondFang, 12 May 2026 @10:11](https://youtu.be/7x5efr5WlwI?t=611) |
| Haunted debuff: up to 10% extra damage, often ~3k per hit | [DiamondFang, 12 May 2026 @10:44](https://youtu.be/7x5efr5WlwI?t=644) |
| Skeleton attacks every 5 ticks; 10 attacks in 10 ticks when commanded | [DiamondFang, 12 May 2026 @11:51](https://youtu.be/7x5efr5WlwI?t=711) |
| Command Skeleton ≈305% ability damage, 0 adrenaline | [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744) |
| Command Zombie ≈400% damage, heavily delayed | [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744) |
| Command Phantom Guardian up to 300 damage at max stacks | [DiamondFang, 12 May 2026 @13:30](https://youtu.be/7x5efr5WlwI?t=810) |
| Blood Siphon: 45-second cooldown | [DiamondFang, 12 May 2026 @13:30](https://youtu.be/7x5efr5WlwI?t=810) |
| Threads of Fate converts the next 3 abilities to AoE | [DiamondFang, 12 May 2026 @15:09](https://youtu.be/7x5efr5WlwI?t=909) |
| Invoke Death executes below 20% health and under 30k HP | [DiamondFang, 12 May 2026 @15:42](https://youtu.be/7x5efr5WlwI?t=942) |
| Invoke Death is worth ~30k free damage | [DiamondFang, 12 May 2026 @26:18](https://youtu.be/7x5efr5WlwI?t=1578) |
| Solid food drains 3% adrenaline | [DiamondFang, 12 May 2026 @20:42](https://youtu.be/7x5efr5WlwI?t=1242) |
| Life Transfer needed if fight > ~1 min (~45 s without Rasial gear) | [DiamondFang, 12 May 2026 @21:15](https://youtu.be/7x5efr5WlwI?t=1275) |
| Bracelet codex from Angel of Death: +2–3% damage | [DiamondFang, 12 May 2026 @27:29](https://youtu.be/7x5efr5WlwI?t=1649) |
| Genesis shard (Nakatra / Amascut): +2–3% damage | [DiamondFang, 12 May 2026 @27:29](https://youtu.be/7x5efr5WlwI?t=1649) |
| T95 spec auto-attack buff lasts 30 s | [DiamondFang, 12 May 2026 @29:07](https://youtu.be/7x5efr5WlwI?t=1747) |
| Weapon spec best used on 4–8 necrosis stacks | [DiamondFang, 12 May 2026 @24:04](https://youtu.be/7x5efr5WlwI?t=1444) |
| Necromancy T95 main + off hand ≈600m gp | [MrEznorbRS, 7 Jun 2026 @7:49](https://youtu.be/kwKL_X8zVcY?t=469) |
| Melee equivalent (with the "xx tech kill" weapon) ≈2.1b gp | [MrEznorbRS, 7 Jun 2026 @8:23](https://youtu.be/kwKL_X8zVcY?t=503) |
| Fractured Staff of Armadyl ≈2× the Necromancy T95 pair | [MrEznorbRS, 7 Jun 2026 @8:23](https://youtu.be/kwKL_X8zVcY?t=503) |
| Ranged T95 ≈1.7b gp | [MrEznorbRS, 7 Jun 2026 @8:23](https://youtu.be/kwKL_X8zVcY?t=503) |
| Ranged Split Soul access ≈1b gp of gear (ECB + EoF) | [MrEznorbRS, 7 Jun 2026 @6:05](https://youtu.be/kwKL_X8zVcY?t=365) |
| Greater Chain unlock ≈200–300m gp | [MrEznorbRS, 7 Jun 2026 @6:40](https://youtu.be/kwKL_X8zVcY?t=400) |
| Darkness (Necromancy 86) ≈10–20% tankier | [MrEznorbRS, 7 Jun 2026 @4:26](https://youtu.be/kwKL_X8zVcY?t=266) |
| Great Bone Shield unlocks at Necromancy 73 | [MrEznorbRS, 7 Jun 2026 @5:00](https://youtu.be/kwKL_X8zVcY?t=300) |
| Split Soul unlocks at Necromancy 92 | [MrEznorbRS, 7 Jun 2026 @6:05](https://youtu.be/kwKL_X8zVcY?t=365) |
| Necromancy usage: 56% two years ago, 44% after the rework (Silence's survey) | [MrEznorbRS, 7 Jun 2026 @0:34](https://youtu.be/kwKL_X8zVcY?t=34) |
| Adrenaline renewal: 40% over 6 s at 4% per tick | [Wings of Absurdity, 27 May 2026 @0:00](https://youtu.be/uRPVLAKjyx0?t=0) |
| Enhanced replenishment: instant 30% adrenaline | [Wings of Absurdity, 27 May 2026 @0:00](https://youtu.be/uRPVLAKjyx0?t=0) |
| Hungry Like the Wolf: +100 LP healing per food, 0 adrenaline loss | [RSBANDB, 23 Jun 2026 @0:00](https://youtu.be/h0seitvhpOc?t=0) |
| Food adrenaline penalty was 10, now 3 | [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66) |
| Blessing of Het: +10% food healing; expensive spices +50 | [RSBANDB, 23 Jun 2026 @2:12](https://youtu.be/h0seitvhpOc?t=132) |
| Shark 2350, rocktail 2680, rocktail soup 2900 LP with the full stack | [RSBANDB, 23 Jun 2026 @2:45](https://youtu.be/h0seitvhpOc?t=165) |
| Wind arrows: 30% damage, 10 stacks to activate | [Carguy, 8 Apr 2026 @7:18](https://youtu.be/UrObmwGTX08?t=438) |
| Death Spore arrows: 12 stacks to proc (22 total with wind arrows) | [Carguy, 8 Apr 2026 @7:51](https://youtu.be/UrObmwGTX08?t=471) |
| Dracolich infusion ≈6.6 s with the full five-piece effect | [Carguy, 8 Apr 2026 @10:39](https://youtu.be/UrObmwGTX08?t=639) |
| Wind arrow effect lasts ~30 s | [Carguy, 8 Apr 2026 @11:45](https://youtu.be/UrObmwGTX08?t=705) |
| Channelled Might: 3.6 s / 15% crit damage without full Tumeken's | [Carguy, 8 Apr 2026 @18:30](https://youtu.be/UrObmwGTX08?t=1110) |
| Channelled Might: 9 s / 35% crit damage with full Tumeken's | [Carguy, 8 Apr 2026 @18:30](https://youtu.be/UrObmwGTX08?t=1110) |
| Eclipse soul gives +4% crit chance | [Carguy, 8 Apr 2026 @2:49](https://youtu.be/UrObmwGTX08?t=169) |
| King Black Dragon: 45,000 life points | [Invoked by Red, 16 Jun 2026 @6:32](https://youtu.be/xpghcq6-Zik?t=392) |

---

### Contradictions and dated advice

**Dated by patch**
- *Melee damage values* — Carguy's melee rotation predates further nerfs he expects; he says melee
  was nerfed about a week after EoC 2.0 and that he thinks it should be nerfed more
  [Carguy, 8 Apr 2026 @1:07](https://youtu.be/UrObmwGTX08?t=67), 2026-04-08.
- *Wild Magic / Asphyxiate buffs* — Carguy notes that at time of recording only the small Wild Magic
  buff had landed and more may come [Carguy, 8 Apr 2026 @16:15](https://youtu.be/UrObmwGTX08?t=975), 2026-04-08. Anything about magic
  rotations from this video should be re-checked against later patches.
- *Wind arrow / Death Spore stack requirements* — explicitly described as changed since release
  [Carguy, 8 Apr 2026 @7:18](https://youtu.be/UrObmwGTX08?t=438), 2026-04-08.
- *Food adrenaline penalty* — 10 before "this year's combat update", 3 after
  [RSBANDB, 23 Jun 2026 @1:06](https://youtu.be/h0seitvhpOc?t=66), 2026-06-23. DiamondFang's 3% figure agrees [DiamondFang, 12 May 2026 @20:42](https://youtu.be/7x5efr5WlwI?t=1242).
- *Conjure Undead Army* — on Necromancy release conjures had to be summoned one at a time; the
  single-cast version is newer [DiamondFang, 12 May 2026 @10:11](https://youtu.be/7x5efr5WlwI?t=611).
- *Slice* — stated to no longer exist [DiamondFang, 12 May 2026 @14:03](https://youtu.be/7x5efr5WlwI?t=843).
- *"Wind sporing"* — stated to no longer exist [Carguy, 8 Apr 2026 @7:51](https://youtu.be/UrObmwGTX08?t=471).
- *Equilibrium perk* — described as "somewhat recently" added [Carguy, 8 Apr 2026 @2:49](https://youtu.be/UrObmwGTX08?t=169).
- *Hungry Like the Wolf* — brand new at 2026-06-23 [RSBANDB, 23 Jun 2026 @0:00](https://youtu.be/h0seitvhpOc?t=0).

**Disagreements / tensions**
- *Is Necromancy weak or strong?* DiamondFang: least DPS in the game [DiamondFang, 12 May 2026 @1:12](https://youtu.be/7x5efr5WlwI?t=72).
  MrEznorb agrees it is worst at the top level but argues it still dominates usage
  [MrEznorbRS, 7 Jun 2026 @1:08](https://youtu.be/kwKL_X8zVcY?t=68). Both are consistent, but a trainer should not present "worst style" as
  "bad choice".
- *Equilibrium perk value* — DiamondFang treats Equilibrium as a core Necromancy perk and builds
  around it instead of crit [[DiamondFang, 12 May 2026 @26:53](https://youtu.be/7x5efr5WlwI?t=1613), 28:34]; Carguy declines to run it on any of his
  setups and considers it not worthwhile on melee unless you stack every damage buff
  [Carguy, 8 Apr 2026 @2:49](https://youtu.be/UrObmwGTX08?t=169). Different styles, so not a direct contradiction, but the reasoning
  differs (hit caps vs. Necromancy's low hits).
- *Living Death vs Split Soul as the bigger damage cooldown* — DiamondFang says Split Soul is
  "probably more damage than living death" because Living Death only boosts Finger, yet the entire
  rotation is architected around Living Death [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546). Worth verifying which the
  trainer should treat as the anchor cooldown.
- *Bloat uptime* — "keep Bloat active as long as you can" [DiamondFang, 12 May 2026 @25:46](https://youtu.be/7x5efr5WlwI?t=1546) directly conflicts
  with the late-game advice that you cannot afford Bloat inside Living Death once you use the T95
  spec [[DiamondFang, 12 May 2026 @29:07](https://youtu.be/7x5efr5WlwI?t=1747), 32:27]. The resolution he gives is gear-dependent: Bloat uptime is a
  mid-game priority that gets displaced late game.
- *Command Zombie* — he calls it "quite useless", then says the commanded hit can beat a Flanking
  Soul Strike, then concludes it usually is not worth it, then says it is a big DPS gain in
  poisonable encounters [DiamondFang, 12 May 2026 @12:24](https://youtu.be/7x5efr5WlwI?t=744). Net: situational, poison-gated.
- *Adrenaline potion choice* — Wings of Absurdity concludes there is no right answer and both are
  valid [Wings of Absurdity, 27 May 2026 @4:57](https://youtu.be/uRPVLAKjyx0?t=297), while DiamondFang's Necromancy rotation assumes an adrenaline
  renewal specifically, on the same tick as Living Death [[DiamondFang, 12 May 2026 @6:14](https://youtu.be/7x5efr5WlwI?t=374), 30:46].
- *Necromancy and stalling* — DiamondFang says Necromancy is not meant to stall and that spec-based
  stalling is likely an oversight, while also saying a stalled T95 spec is worth using in some
  encounters [DiamondFang, 12 May 2026 @33:32](https://youtu.be/7x5efr5WlwI?t=2012). Treat spec stalling as advanced/optional.

**Terms I could not resolve from the transcripts**
- The three-melee-copy AoE ability at [DiamondFang, 12 May 2026 @14:03](https://youtu.be/7x5efr5WlwI?t=843) is captioned "soul split"; that is
  certainly wrong, and Spectral Scythe is my best reading, but the transcript does not name it.
- "COE and bigger" as the second adrenaline-cost reducer for Death Skulls
  [DiamondFang, 12 May 2026 @3:57](https://youtu.be/7x5efr5WlwI?t=237) — the first is Conservation of Energy; the second word is unrecoverable.
- "the bracelet codex from AOD" [DiamondFang, 12 May 2026 @27:29](https://youtu.be/7x5efr5WlwI?t=1649) — a codex dropped by Angel of Death worth
  2–3% damage; the actual name is not recoverable from the captions.
- "Lord of Bones from Warcat" [DiamondFang, 12 May 2026 @27:29](https://youtu.be/7x5efr5WlwI?t=1649) — an item that reduces enemy defence, relevant
  only at Amascut, Vorago and Angel of Death. Source boss name is garbled.
- "the Swirl Ring" vs "the Necro ring" [DiamondFang, 12 May 2026 @28:34](https://youtu.be/7x5efr5WlwI?t=1714) — the soul-generating ring (locked
  behind rituals, which he refuses to do) versus the necrosis ring he actually uses. Exact names
  unclear.
- "the ful book" [DiamondFang, 12 May 2026 @26:53](https://youtu.be/7x5efr5WlwI?t=1613) — almost certainly the Scripture of Ful, but stated only as
  "ful book".
- "the wars nexus" [DiamondFang, 12 May 2026 @33:32](https://youtu.be/7x5efr5WlwI?t=2012) vs "the devious nexus" [DiamondFang, 12 May 2026 @11:18](https://youtu.be/7x5efr5WlwI?t=678) — probably
  the same item, the one that converts ghost healing into damage.
- Carguy's melee names are heavily garbled ("easy case" = Assault, "langs" = Laniakea's/Lengs,
  "D backs" unclear); melee specifics from that video should not be trusted verbatim.

---

## At the bosses

*How the styles above are actually spent on a fight, phase by phase.*


Source: 10 YouTube transcripts, March–May 2026. Captions are auto-generated; boss and
ability names are normalised to canonical RS3 spellings where the intent is clear, and
flagged as *unclear* where it is not. Nothing here is inferred beyond what is said.

### Per boss

#### TzKal-Zuk — full run, melee, 100% Revolution
`rV5PB2sGV7U` — The RS Guy, 5 April 2026. The single richest source in this set.

**Assumed style and gear.** Melee only, Revolution for the whole fight, deliberately low
stats (the run ends on an account with 90 Attack, 1 Necromancy, 1 Archaeology, Invention in
the 50s) [The RS Guy, 5 Apr 2026 @49:12](https://youtu.be/rV5PB2sGV7U?t=2952). Obsidian armour from Brink of Extinction is the strong
recommendation; full elder rune works but worse [The RS Guy, 5 Apr 2026 @0:00](https://youtu.be/rV5PB2sGV7U?t=0). Cinderbane gloves +
weapon poison++ (poison does not work on Zuk himself), skillcape/kiln cape/defence cape,
amulet of Zealots at 53 Prayer (Essence of Finality or amulet of souls if you have Soul
Split), TokKul-Zo ring (+10% damage during the Zuk waves and Har-Aken), scrimshaw of
vampyrism [The RS Guy, 5 Apr 2026 @0:32](https://youtu.be/rV5PB2sGV7U?t=32). Weapons: drygores (or chaotics, twin fury blades,
longswords, leng swords) plus a two-handed Dragon Rider lance (Masuta's warspear also fine;
"Lanica spear" *unclear*, apparently a weaker spear; scythe or Tumeken's light if rich)
[The RS Guy, 5 Apr 2026 @1:36](https://youtu.be/rV5PB2sGV7U?t=96). Perks used on the weapons: Precise 3 and Energizing 2, the latter
"recently updated" to give extra flat accuracy [The RS Guy, 5 Apr 2026 @2:09](https://youtu.be/rV5PB2sGV7U?t=129).

**Two Revolution bars, swapped by weapon.** Action bar binding (Settings > Combat > Action
bar) is set so equipping the dual wields swaps the main bar to bar 9 and the two-hander to
bar 8 [The RS Guy, 5 Apr 2026 @3:44](https://youtu.be/rV5PB2sGV7U?t=224).

- Dual-wield bar (single target: Zuk's feet, Har-Aken, pizza phase): Berserk, Meteor Strike,
  "Adaptive Strike" (*name uncertain, no such melee ability is otherwise known to me*), Rend,
  Dismember, Fury, Overpower, Assault, basic attack [The RS Guy, 5 Apr 2026 @2:40](https://youtu.be/rV5PB2sGV7U?t=160).
- Two-handed bar (all the waves): Meteor Strike, "Adaptive Strike", Rend, Hurricane, Fury,
  Overpower, Dismember, basic attack [The RS Guy, 5 Apr 2026 @3:12](https://youtu.be/rV5PB2sGV7U?t=192).
- Kept **off** the Revolution bar and fired manually: Backhand (stun), Barge; also Freedom,
  Devotion, Surge/Dive, Resonance, Barricade elsewhere on the bars [[The RS Guy, 5 Apr 2026 @2:40](https://youtu.be/rV5PB2sGV7U?t=160),
  07:31].

**Rotation, step list.**
1. Pre-fight: bonfire/elder-log HP boost, desert pantheon aura or Anachronia thermal spa;
   powder of penance and powder of protection; TokKul-Zo teleport; donate Tokkul inside the
   Fight Cauldron twice for +10% damage reduction each [The RS Guy, 5 Apr 2026 @4:16](https://youtu.be/rV5PB2sGV7U?t=256).
2. Turn auto-retaliate **off** and click every target manually — auto-retaliate drags you
   into extra damage [The RS Guy, 5 Apr 2026 @6:59](https://youtu.be/rV5PB2sGV7U?t=419).
3. One overhead protection prayer per wave, plus the Attack and Strength boosting prayers
   (amplified by the amulet of Zealots); the Defence prayer is not worth a slot
   [[The RS Guy, 5 Apr 2026 @8:04](https://youtu.be/rV5PB2sGV7U?t=484), 10:45].
4. Waves 1–3: protect Melee. Kill the two rangers first on waves 2 and 3; prioritise bats
   whenever they are on you because they drain prayer and wreck your damage
   [The RS Guy, 5 Apr 2026 @8:36](https://youtu.be/rV5PB2sGV7U?t=516).
5. Igneous wave 4 (melee): the three igneous mobs must be **stunned with Backhand** or they
   regenerate behind a shield and cannot be killed [The RS Guy, 5 Apr 2026 @11:50](https://youtu.be/rV5PB2sGV7U?t=710).
6. Zuk's feet (after each igneous wave): swap to dual wields, then either press Berserk
   manually or simply keep auto-attacking Zuk **before** pressing the special action button
   until Revolution has fired Meteor Strike and built you to Berserk; then vulnerability bomb
   + adrenaline potion, press the button, let Revolution deal the 50,000
   [[The RS Guy, 5 Apr 2026 @12:21](https://youtu.be/rV5PB2sGV7U?t=741)–13:26, 22:39–23:11].
7. Waves 6, 11, 16 (Jads): pray one style and accept the hits. Jads melee at a one-tile
   range — if you get meleed, step one tile back and keep attacking [The RS Guy, 5 Apr 2026 @16:42](https://youtu.be/rV5PB2sGV7U?t=1002).
   With a shield you can Resonance a Jad hit as a full heal [The RS Guy, 5 Apr 2026 @25:54](https://youtu.be/rV5PB2sGV7U?t=1554).
8. Waves 7, 8, 12, 13 (rangers/mages): Devotion on cooldown; kill the off-style mobs first so
   only one combat style is hitting you; rangers gain damage stacks while standing still, so
   force them to move [[The RS Guy, 5 Apr 2026 @17:47](https://youtu.be/rV5PB2sGV7U?t=1067), 19:24, 19:57].
9. Igneous wave 9 (rangers): their shields need a **powerful ability** — Hurricane, Assault,
   Overpower, or the Dismember recast — and Revolution supplies these automatically
   [The RS Guy, 5 Apr 2026 @21:35](https://youtu.be/rV5PB2sGV7U?t=1295).
10. Igneous wave 14 (mages): break the bubbles by damaging from inside them (trivial as
    melee), and use the igneous mages as line-of-sight blockers against the small mages
    [The RS Guy, 5 Apr 2026 @30:46](https://youtu.be/rV5PB2sGV7U?t=1846).
11. Har-Aken: drygores, adrenaline potion, vulnerability bomb, surge in, Revolution does
    100% of it. Step two tiles north or south from the lava projectile — being hit costs
    adrenaline and your one-cycle [The RS Guy, 5 Apr 2026 @35:06](https://youtu.be/rV5PB2sGV7U?t=2106). If not one-cycled he
    submerges (45 s or 1 min, the video is unsure); kill tentacles for lifesteal, and dodge
    the X-shaped bombardment by stepping four tiles in one cardinal direction
    [The RS Guy, 5 Apr 2026 @36:44](https://youtu.be/rV5PB2sGV7U?t=2204).
12. Zuk himself — mechanic → answer:
    - "You will break beneath me" (burn debuff) → **Freedom**.
    - "Suffer" / searing pain, 15 stacks → each stack is one tile, so **move 15 tiles**
      (Surge out and run back); if you are slow your max HP drops, fix it with a super
      restore.
    - "Tremble before me" (frontal cone) → Surge through Zuk or just run through him, then
      avoid standing on the fissures (a fissure applies the same burn → Freedom again).
    - "Die" (rock drop, ~2k) → tank it, or Resonance / Disruption Shield.
    [The RS Guy, 5 Apr 2026 @38:22](https://youtu.be/rV5PB2sGV7U?t=2302)
13. Pizza phase: you are teleported south-west and stunned (Freedom clears the stun if you
    have not spent it on fissures). Reach each igneous mob with Surge, Dive or Barge.
    **Backhand** the melee one; the ranged one needs a powerful ability — and Berserk does
    *not* count, because it is not a targeted ability, which is exactly how Revolution wasted
    a cycle on camera [The RS Guy, 5 Apr 2026 @41:35](https://youtu.be/rV5PB2sGV7U?t=2495). Manually pressing Assault makes this phase
    much easier. Keep protect/deflect Magic on throughout, because the arena fire is magic
    damage. Follow the pizza; leave a not-quite-dead mob to the bleeds and move on
    [[The RS Guy, 5 Apr 2026 @42:07](https://youtu.be/rV5PB2sGV7U?t=2527), 43:45, 46:27].
14. "Flames unending" → press the special action button before the instant-kill bar fills
    [The RS Guy, 5 Apr 2026 @44:17](https://youtu.be/rV5PB2sGV7U?t=2657).
15. Second cycle repeats identically — **except** that dropping Zuk below 100,000 LP resets
    his special-attack order back to the first one [The RS Guy, 5 Apr 2026 @47:33](https://youtu.be/rV5PB2sGV7U?t=2853).

**What it says to avoid.** Do not put Backhand or Barge on the Revolution bar. Do not bother
prayer-flicking every Jad (a missed flick is ~3k with this setup). Do not chase the
challenge waves: all three can be failed and you still get the cape — the only requirement is
finishing without banking or using the checkpoint [The RS Guy, 5 Apr 2026 @13:59](https://youtu.be/rV5PB2sGV7U?t=839). Do not panic about
failing the 50,000 DPS check; the igneous wave just repeats and costs no supplies
[[The RS Guy, 5 Apr 2026 @13:26](https://youtu.be/rV5PB2sGV7U?t=806), 23:11]. Challenge 2 ("the Unbreakable") ignores every hitsplat below
3,000, so a low-level setup should not attempt it [The RS Guy, 5 Apr 2026 @23:44](https://youtu.be/rV5PB2sGV7U?t=1424).

#### Zamorak — first 100% enrage kill, necromancy
`PRAUrPvS_ww` — MrEznorbRS, 26 April 2026. Explicitly a "skip every mechanic" guide; the
author refers viewers to The RS Guy for real mechanic teaching [MrEznorbRS, 26 Apr 2026 @0:32](https://youtu.be/PRAUrPvS_ww?t=32).

**Assumed style and gear.** Necromancy, deliberately unaugmented and perk-less: tier 80 power
armour, tier 90 weapons, cheap scripture (name garbled, ~2–3M), a Deathwarden nexus charged
with runes and ectoplasm (*transcript says "death ward necklace"*), occultist ring (ring of
vigor or the souls-based equivalent ring as alternatives), a conjures-buffing amulet
(+5% conjure damage, under 300k — *name garbled as "conjurer's raising amulet"*), defence
cape for the free sign of life; **no** Essence of Finality by choice
[MrEznorbRS, 26 Apr 2026 @7:49](https://youtu.be/PRAUrPvS_ww?t=469). Inventory: blood reaver conjure (stated as 73 Summoning; ripper
demon quoted as 96), scrolls, power burst of vitality, vulnerability bombs, restore flasks,
enhanced Excalibur, summoning renewal, adrenaline potion, prayer renewal, elder overloads
[MrEznorbRS, 26 Apr 2026 @10:05](https://youtu.be/PRAUrPvS_ww?t=605).

**Rotation, step list.**
1. Kill the six Zamorak mages with protect Magic up; Devotion helps [MrEznorbRS, 26 Apr 2026 @11:47](https://youtu.be/PRAUrPvS_ww?t=707).
2. Grey-health phases: he only auto-attacks. Left hand / orb projectile = magic, right hand /
   pointy projectile = ranged — switch the overhead accordingly. Early on you can
   deliberately drop the prayer and **Resonance** the harder hit for a bigger heal
   [MrEznorbRS, 26 Apr 2026 @12:20](https://youtu.be/PRAUrPvS_ww?t=740).
3. Get grey health to ~0, apply **Bloat** so he cannot regenerate while you are away, press
   the special action button, enter the other realm [MrEznorbRS, 26 Apr 2026 @14:38](https://youtu.be/PRAUrPvS_ww?t=878).
4. In the other realm: protect Magic, **Anticipation or Freedom** because the mage opens with
   a stun; **double Surge** so the conjures teleport in with you and start damaging
   [MrEznorbRS, 26 Apr 2026 @15:12](https://youtu.be/PRAUrPvS_ww?t=912).
5. Back out, stand on the next rune, and one game tick before it finishes charging fire the
   burst that must do 60,000 damage: **Death Skulls → spam Volley of Souls → Finger of Death
   ×2 on necrosis stacks → weapon special attack** as the guarantee
   [[MrEznorbRS, 26 Apr 2026 @13:29](https://youtu.be/PRAUrPvS_ww?t=809)–14:02, 15:45]. Repeat for all six runes.
6. Rune order used: 2, 4, 6, 1, 3, 5 — the lifeweaver/protect-mage rune (3) is saved until
   late because it is annoying; chaos traps (5) second-to-last [[MrEznorbRS, 26 Apr 2026 @4:26](https://youtu.be/PRAUrPvS_ww?t=266), 07:15].
7. Chaos-trap rune: on the tick you cast Death Skulls, **Dive** off the rune — but not too
   far, or Death Skulls loses its bounce target [MrEznorbRS, 26 Apr 2026 @18:31](https://youtu.be/PRAUrPvS_ww?t=1111). For the last
   trapped rune, wait for a magic auto, then **Devotion + Anticipation** and simply stand on
   it: zero magic damage, no stun [MrEznorbRS, 26 Apr 2026 @19:37](https://youtu.be/PRAUrPvS_ww?t=1177).
8. Once the hexes stack up, spend the grey phases on defensives: Resonance whenever it is up,
   Reflect, Debilitate, Devotion [MrEznorbRS, 26 Apr 2026 @16:52](https://youtu.be/PRAUrPvS_ww?t=1012).
9. After rune 3: **Invoke Death** so he executes at 30,000, leaving only 45,000 to burst
   [MrEznorbRS, 26 Apr 2026 @20:10](https://youtu.be/PRAUrPvS_ww?t=1210).
10. Phase 7: Invoke Death + weapon spec on the demon, spawn conjures. He drags two runes to
    himself; kill those two. **Living Death** during the first rune (it buffs Death Skulls and
    Finger of Death), adrenaline potion after the first rune, and **Devotion + melee prayer**
    before the second — a kill while Devotion is active extends it (6 s became 11 s on camera)
    [MrEznorbRS, 26 Apr 2026 @22:25](https://youtu.be/PRAUrPvS_ww?t=1345).
11. Final burst: Volley of Souls → power burst of vitality + **Reflect** into the fully
    charged blast of energy → Finger of Death under Living Death → Invoke Death (execute at
    20,000) → second Finger of Death [MrEznorbRS, 26 Apr 2026 @25:11](https://youtu.be/PRAUrPvS_ww?t=1511).

**Phase-specific ability choices and avoidances.** Rune edicts change ability value: rune 4
makes shield effects leak 7% per stack, so Resonance/Reflect stop zeroing hits; rune 6 cuts
all healing 10% per stack; rune 2 gives −8% ability cooldowns; rune 1 makes basics generate
extra adrenaline; rune 4's edict buffs and heals your next basic after any ultimate
[MrEznorbRS, 26 Apr 2026 @3:19](https://youtu.be/PRAUrPvS_ww?t=199). **Do not use Death Skulls in phase 7** unless the B rune was one
of the two he pulled — it bounces onto the B rune, and killing the B rune executes you
[MrEznorbRS, 26 Apr 2026 @25:11](https://youtu.be/PRAUrPvS_ww?t=1511). Do not let him survive a rune burst: if he is not one-shot into
the next threshold he starts using mechanics, each of which can one-shot you
[MrEznorbRS, 26 Apr 2026 @17:58](https://youtu.be/PRAUrPvS_ww?t=1078). The author's own noted mistake: forgetting the vulnerability bomb
(+10% damage) in phase 7 [MrEznorbRS, 26 Apr 2026 @26:52](https://youtu.be/PRAUrPvS_ww?t=1612).

#### Raksha — ranged pool skip, Dracolich
`3LNhQaTgduE` — Oyi RS, 28 April 2026.

**Assumed style and gear.** Ranged, three-piece Dracolich minimum (vambraces, boots, coif;
the cheapest pieces are fine), Greater Ricochet unlocked, Caroming 4 on the bow (transcribed
as "cromatic four") called a must-have, Essence of Finality holding dark bow and Seren
godbow; Eldritch crossbow mentioned but skipped as advanced
[[Oyi RS, 28 Apr 2026 @0:33](https://youtu.be/3LNhQaTgduE?t=33)–01:39, 05:33].

**Ammunition as an ability resource.** Death spore arrows let you cast an **ultimate at 0%
adrenaline** once you have procced 12 stacks; Wen arrows stack to 10 ("icy chills" on the
buff bar) and raise hit chance and base damage. Greater Ricochet is singled out as the fastest
death-spore builder because it lands so many hits — from 2 stacks to 10 or 11 in one cast
[Oyi RS, 28 Apr 2026 @5:00](https://youtu.be/3LNhQaTgduE?t=300).

**Rotation, step list.**
1. Damage Raksha normally to about 500k HP, just after the shadow energies
   [Oyi RS, 28 Apr 2026 @2:12](https://youtu.be/3LNhQaTgduE?t=132).
2. Build Wen stacks to 10 first, then swap to death spore arrows and build to the proc
   (keybound penance quiver) [Oyi RS, 28 Apr 2026 @6:05](https://youtu.be/3LNhQaTgduE?t=365).
3. On the proc: **Death Swiftness → Imbued Shadows → bow special attack → Rapid Fire**
   (vulnerability bomb, optional adrenaline flask, in this window)
   [[Oyi RS, 28 Apr 2026 @2:12](https://youtu.be/3LNhQaTgduE?t=132), 06:38].
4. Switch back to Wen arrows, then **Seren godbow spec → dark bow → Greater Ricochet → dark
   bow → dark bow → dark bow**, more thresholds, then another Greater Ricochet
   [[Oyi RS, 28 Apr 2026 @2:46](https://youtu.be/3LNhQaTgduE?t=166), 06:38]. That skips the pool phase.
5. Last phase, same rotation: normal damage until the bubble mechanic, clear the bubble, pick
   up about four of the nearest anima shards, rebuild Wen and death spore stacks, Death
   Swiftness → Imbued Shadows, dodge the second mirror, come back in with **Rapid Fire**,
   switch to Wen arrows, spend the anima as Rapid Fire ends, then Seren godbow → dark bow →
   dark bow [Oyi RS, 28 Apr 2026 @3:17](https://youtu.be/3LNhQaTgduE?t=197).

**Notes.** The author stresses the rotation tolerates errors — he messed it up on camera and
still skipped the phase and finished under three minutes [[Oyi RS, 28 Apr 2026 @3:17](https://youtu.be/3LNhQaTgduE?t=197), 04:28]. He
says the same ranged rotation transfers to Zamorak phase skips [Oyi RS, 28 Apr 2026 @1:39](https://youtu.be/3LNhQaTgduE?t=99). He does
not claim to know how melee or magic compare [Oyi RS, 28 Apr 2026 @7:46](https://youtu.be/3LNhQaTgduE?t=466).

#### Rasial — necromancy
`q1JVE10ISsE` — PsychAttack, 14 May 2026. Six minutes of terse voiceover notes, not a
structured guide; the ability list is real but the ordering is loose.

**Setup.** Blood reaver conjure, relics Conservation of Energy, Fury of the Small, Persistent
Rage; powder of protection and powder of penance; Lunar spellbook. Perks: Aftershock 4 +
Eruptive 2 on the Soulbound lantern, Precise 6 + Aftershock 1 on the omniguard, Undead Slayer
on the death dealer robe bottom, plus Relentless 5, Crackling 4, Mobile, Reflexes,
Invigorating, Impatient. Occultist ring, Essence of Finality with **Death Grasp**. Anachronia
thermal bath. He recommends the hard-mode Zuk cape with all challenges (igneous cape)
[PsychAttack, 14 May 2026 @0:02](https://youtu.be/q1JVE10ISsE?t=2). Explicitly says not to bring the salve amulet
[PsychAttack, 14 May 2026 @1:15](https://youtu.be/q1JVE10ISsE?t=75).

**Fight beats as stated.** Spawn conjures and eat before entering; bone bomb on entry; Death
Skulls repeatedly whenever available; keep **Undead Slayer** re-applied (mentioned twice,
including at the end of the kill); use defensive abilities throughout; super adrenaline
potion; Reflect whenever he uses the necromancy-flagged attack ("reflect necro whenever he
says that"); **Freedom** on the stun and walk where the attack goes; **Resonance** on the big
hits; Volley of Souls (transcribed "folly"); Death Grasp; when he goes airborne, run and
attack at the same time and equip the ring; then Resonance, Devotion, keep moving, eat if
needed [PsychAttack, 14 May 2026 @2:26](https://youtu.be/q1JVE10ISsE?t=146). No rotation ordering beyond this is given — treat as a
checklist, not a sequence.

#### Silverquill — new early-game boss
`75Z9zdfrquM` — RainyScape, 28 March 2026, released the same week.

**Mechanics that drive ability choice.** It never walks, so melee only reaches you when you
stand adjacent — and standing adjacent gives you typeless reflect damage. Every four attacks
it spreads blood clots (magic damage on explosion). At 66% health it spawns one or two
sanguine tumors and becomes fully immune, reflecting massive damage if you attack it while
immune; destroy the tumors or it absorbs them and heals. Immediately after the tumors it
throws a blood hog attack (magic) [RainyScape, 28 Mar 2026 @0:00](https://youtu.be/75Z9zdfrquM?t=0).

**Active laid-back method (any style, preferably not melee).** Stand away from the boss, run a
standard Revolution++ bar, and keybind **cycle target forward** (Settings > Controls, bound to
Tab) plus a hotkeyed basic attack (E). When the tumors appear, press cycle-target then the
basic attack — one basic destroys a tumor at high level, with no mouse movement
[RainyScape, 28 Mar 2026 @2:52](https://youtu.be/75Z9zdfrquM?t=172). Risk called out: switching back to the boss too fast KOs you with
reflect damage.

**Achievement-specific ability restrictions.** The Haven-silver-only kill fails if Crackling,
reflect prayers or damage-dealing armour contribute any damage. The melee-no-reflect kill needs
a melee weapon with 2 range so you stand one tile away, and reflect prayers/necklaces break it.
The blocking achievement wants **Resonance or Divert** on both blood hog attacks (66% and 33%)
— press it shortly after the last tumor dies, and slow your damage down so Resonance is off
cooldown for the second one [RainyScape, 28 Mar 2026 @1:43](https://youtu.be/75Z9zdfrquM?t=103).

**PVME AFK setups quoted.** Magic: blood fury amulet, level 95 magic weapon (Fractured Staff of
Armadyl or Sanctum weapons), full cryptbloom, a scripture, the magic Zuk cape, **Greater
Concentrated Blast** unlocked, Incite Fear as the spell, Animate Dead re-cast every 12 minutes,
holy scarab familiar, penance powder, potion reservoirs for overloads and three archaeology
relics — fast but with massive upkeep [RainyScape, 28 Mar 2026 @4:31](https://youtu.be/75Z9zdfrquM?t=271). Necromancy budget AFK:
amulet of souls, two death dealer pieces, three First Necromancer pieces, scripture, necromancy
Zuk cape, omniguard + soulbound lantern, ring of death, penance aura/aspect, hellhound familiar
plus prism of restoration, potion reservoir, Fury of the Small and Persistent Rage relics. The
bar idea is to let the **upgraded scythe ability** clear tumors (it hits several squares around
you) while **Debilitate and Reflect** cut incoming damage; if a tumor spawns between you and the
boss your character simply stops attacking until it is gone, and the boss will eventually absorb
it [RainyScape, 28 Mar 2026 @5:39](https://youtu.be/75Z9zdfrquM?t=339).

#### Kalphite King, Blackstone Dragon, Verak Lith, Arch-Glacor, Raksha, Zamorak — masterwork range
`ufHZj98ZXYw` — The RS Guy, 1 April 2026. A gear review, but it is the clearest statement in
this set about *rotation shape*.

**The claim.** Masterwork range gear has tank HP plus the masterwork effect (delays 50% of
damage taken) while still being power gear with tier 100 power bonus. Because it has no crit
effect (unlike Dracolich), you can run the new **Equilibrium** perk: no crits at all, but +14%
damage on every ability, and +14% on poison damage too [The RS Guy, 1 Apr 2026 @0:00](https://youtu.be/ufHZj98ZXYw?t=0).

**Rotation consequences.** Dracolich forces a rigid rotation: channel a full Rapid Fire, then
three high-hitting abilities. Masterwork does not, so you can "just hit the good abilities"
and improvise around mechanics [The RS Guy, 1 Apr 2026 @2:10](https://youtu.be/ufHZj98ZXYw?t=130). Concrete examples:
- Blackstone Dragon phase 1 nuked with a two-ability pre-phase: **Deadshot into Seren godbow
  special attack** [The RS Guy, 1 Apr 2026 @3:48](https://youtu.be/ufHZj98ZXYw?t=228).
- Verak Lith: a dummy pre-build, then 600,000 damage in 19 seconds with no Rapid Fire
  [The RS Guy, 1 Apr 2026 @4:21](https://youtu.be/ufHZj98ZXYw?t=261).
- Zamorak at 4,000% enrage solo: every DPS check hit, phase 7 one-cycled, effective HP pool
  about 64,000 with power burst of vitality stacking on the masterwork effect
  [The RS Guy, 1 Apr 2026 @6:36](https://youtu.be/ufHZj98ZXYw?t=396).
- No five-piece set requirement frees slots: death-touch bracelet at ranged Zamorak,
  Cinderbane gloves + Bik arrows for the Arch-Glacor grandmaster speed kill, asylum surgeon's
  ring at low-hitting bosses, ring of retribution at hard ones, and no stalker's ring since
  crits are off [The RS Guy, 1 Apr 2026 @1:06](https://youtu.be/ufHZj98ZXYw?t=66).
- Split Soul (stated explicitly to be the **Eldritch crossbow special attack, not a necromancy
  ability**) becomes sustainable because of the larger life pool, at the cost of Soul Split
  healing [The RS Guy, 1 Apr 2026 @4:57](https://youtu.be/ufHZj98ZXYw?t=297).

**Verdict as stated.** Dracolich still wins with a perfect rotation and counted bolg stacks;
masterwork wins for anyone who has to cancel a Rapid Fire to handle a mechanic
[The RS Guy, 1 Apr 2026 @5:29](https://youtu.be/ufHZj98ZXYw?t=329).

#### Arch-Glacor, Araxxor, Elite Dungeon 2 — mid-game money
`RPmmk66BAqA` — MrEznorbRS, 29 March 2026. Almost entirely gear/economy; two ability-relevant
facts only.

- Necromancy is called the best starting style for bossing because of the support abilities in
  its kit, and the heal from the ghost conjure makes Araxxor manageable in scuffed gear
  [[MrEznorbRS, 29 Mar 2026 @0:32](https://youtu.be/RPmmk66BAqA?t=32), 08:16].
- Death Skulls now costs only **60 adrenaline**, which is why a Saradomin cape is no longer
  needed for decent Living Death rotations [MrEznorbRS, 29 Mar 2026 @2:09](https://youtu.be/RPmmk66BAqA?t=129).
- Non-ability but rotation-adjacent: Araxxor's spawn form is chosen by equipping the *opposite*
  style's weapon in a private instance (bow → magic spider, staff → melee spider, melee weapon →
  ranged spider); magic form is the easiest fight, melee form the best drop table
  [MrEznorbRS, 29 Mar 2026 @8:52](https://youtu.be/RPmmk66BAqA?t=532).

#### King Black Dragon — AFK kill-count farming
`vEFQVrVKjZc` — Abir RS, 21 April 2026. See the War's Retreat section; the only ability content
is that he runs a manual Revolution bar with just two ultimates pressed by hand, killing KBD in
20–30 seconds [Abir RS, 21 Apr 2026 @6:47](https://youtu.be/vEFQVrVKjZc?t=407).

#### Files with no boss-ability content
- `igPnkZa2QTU` (Bear, F2P 1–99 skill guide) — no boss ability usage at all. Only generic
  Revolution setup: combat modes are Revolution, full manual and Legacy; the action bar has
  1–14 slots; ability categories are named basic, enhanced, threshold and ultimate; the main
  action bar and the Revolution action bar must use the same bar number
  [Bear, 28 Mar 2026 @0:55](https://youtu.be/igPnkZa2QTU?t=55).
- `esoSvgF6ItI` (kruxor, ecliptic components market analysis) — nothing on ability usage; useful
  only for dating the Equilibrium perk to the 9 March 2026 update (level 92 Invention, new
  ecliptic components) [kruxor, 18 Mar 2026 @1:06](https://youtu.be/esoSvgF6ItI?t=66).

### Patterns across bosses

**Pre-build is a distinct step, not part of the fight.** Every serious guide here front-loads
buffs and adrenaline before the boss is engaged: HP boosts (bonfire, thermal spa, aura) and
protection powders at Zuk [The RS Guy, 5 Apr 2026 @4:16](https://youtu.be/rV5PB2sGV7U?t=256), conjures and overloads before entering Zamorak
[MrEznorbRS, 26 Apr 2026 @10:05](https://youtu.be/PRAUrPvS_ww?t=605), Wen and death-spore stacks built *before* the phase you intend to skip at
Raksha [Oyi RS, 28 Apr 2026 @6:05](https://youtu.be/3LNhQaTgduE?t=365), and an explicit dummy pre-build before Verak Lith
[The RS Guy, 1 Apr 2026 @4:21](https://youtu.be/ufHZj98ZXYw?t=261). The one AFK-farming video exists purely to unlock the adrenaline crystal
so that pre-build can include 100% adrenaline [Abir RS, 21 Apr 2026 @3:26](https://youtu.be/vEFQVrVKjZc?t=206).

**Special attacks are spent as a guarantee, not as filler.** At Zamorak the weapon spec is the
insurance that the 60,000-damage burst actually lands, used every single rune
[[MrEznorbRS, 26 Apr 2026 @14:02](https://youtu.be/PRAUrPvS_ww?t=842), 17:24]. At Raksha the bow spec opens the burst and the Seren godbow spec
starts the second half [Oyi RS, 28 Apr 2026 @2:46](https://youtu.be/3LNhQaTgduE?t=166). At Blackstone Dragon a Seren godbow spec is half
of a two-ability phase [The RS Guy, 1 Apr 2026 @3:48](https://youtu.be/ufHZj98ZXYw?t=228). At Zamorak phase 7 the spec is dumped on the demon
before the boss is even reachable [MrEznorbRS, 26 Apr 2026 @22:25](https://youtu.be/PRAUrPvS_ww?t=1345).

**Adrenaline is deliberately carried across a phase boundary.** The Zuk guide's central trick is
to keep attacking the *previous* target until Revolution has fired Meteor Strike and put Berserk
in reach, and only then press the special action button that opens the damage window
[[The RS Guy, 5 Apr 2026 @12:21](https://youtu.be/rV5PB2sGV7U?t=741), 22:39]. Zamorak drinks an adrenaline potion between the two phase-7 runes
so the final burst starts full [MrEznorbRS, 26 Apr 2026 @22:58](https://youtu.be/PRAUrPvS_ww?t=1378). Raksha's death spore arrows exist to fire
an ultimate at 0% adrenaline, which is the same problem solved from the other end
[Oyi RS, 28 Apr 2026 @5:00](https://youtu.be/3LNhQaTgduE?t=300).

**Switches are automated where possible.** Zuk uses action bar binding so the weapon switch
also switches the whole Revolution bar [The RS Guy, 5 Apr 2026 @3:44](https://youtu.be/rV5PB2sGV7U?t=224); Raksha's "switches" are arrow
swaps timed to the end of a channel [Oyi RS, 28 Apr 2026 @3:52](https://youtu.be/3LNhQaTgduE?t=232); Silverquill's active method replaces
a mouse switch with a target-cycle hotkey plus a basic-attack hotkey [RainyScape, 28 Mar 2026 @3:24](https://youtu.be/75Z9zdfrquM?t=204).

**Defensives are treated as damage-neutral filler in the safe phases.** Resonance is used
offensively for healing (drop the prayer, take the bigger hit, heal more) at Zamorak
[MrEznorbRS, 26 Apr 2026 @12:20](https://youtu.be/PRAUrPvS_ww?t=740) and at Zuk on a Jad [The RS Guy, 5 Apr 2026 @25:54](https://youtu.be/rV5PB2sGV7U?t=1554); Devotion is used to eat whole
waves of one damage type [The RS Guy, 5 Apr 2026 @17:47](https://youtu.be/rV5PB2sGV7U?t=1067) and is extended by killing something while it is
active [MrEznorbRS, 26 Apr 2026 @23:32](https://youtu.be/PRAUrPvS_ww?t=1412).

**Shield-breaking is a category requirement, not a damage requirement.** Igneous melee mobs need
a *stun* (Backhand); igneous ranged mobs need a *powerful* ability (Hurricane, Assault,
Overpower, Dismember recast) — and Berserk, being untargeted, does not qualify
[[The RS Guy, 5 Apr 2026 @11:50](https://youtu.be/rV5PB2sGV7U?t=710), 21:35, 43:11].

**What beginners are told to skip.** All three Zuk challenge waves, since the cape only requires
finishing without banking [The RS Guy, 5 Apr 2026 @13:59](https://youtu.be/rV5PB2sGV7U?t=839); every Zamorak mechanic, by one-shotting each
threshold from a charged rune [MrEznorbRS, 26 Apr 2026 @0:32](https://youtu.be/PRAUrPvS_ww?t=32); Raksha's pool phase entirely
[Oyi RS, 28 Apr 2026 @2:46](https://youtu.be/3LNhQaTgduE?t=166); prayer flicking, where the damage-reduction stack makes a missed flick
irrelevant [The RS Guy, 5 Apr 2026 @16:42](https://youtu.be/rV5PB2sGV7U?t=1002); manual ability presses generally — the Zuk run is completed
with Revolution and a handful of manual utility abilities [The RS Guy, 5 Apr 2026 @36:11](https://youtu.be/rV5PB2sGV7U?t=2171).

### Pre-build and War's Retreat

**What the unlocks are and what they cost.** `vEFQVrVKjZc` is entirely about grinding boss kill
count for War's Retreat unlocks: boss teleport, prayer altar, adrenaline crystal (both the
adrenaline reset and the adrenaline potions) and the campfire, which gives a quick HP boost
[Abir RS, 21 Apr 2026 @0:00](https://youtu.be/vEFQVrVKjZc?t=0). He is at roughly 400 kills, believes the first adrenaline unlock needs
about 1,000, and estimates about 600 more kills at ~100 kills/hour, i.e. about six hours of AFK
King Black Dragon [Abir RS, 21 Apr 2026 @0:32](https://youtu.be/vEFQVrVKjZc?t=32). He refers to 2,000 boss kills as the full set
[Abir RS, 21 Apr 2026 @7:20](https://youtu.be/vEFQVrVKjZc?t=440).

**Why adrenaline pre-build matters.** His stated motivation is that his DPS is "chalked" without
adrenaline: Imbued Shadows costs 40% off the bat, and Death Swiftness is an ultimate costing
100% [Abir RS, 21 Apr 2026 @3:59](https://youtu.be/vEFQVrVKjZc?t=239). He says he knows there is a way to cast Death Swiftness
without spending adrenaline but does not know it — Raksha's death spore arrows in `3LNhQaTgduE`
are exactly that mechanism, which he apparently has not connected [Oyi RS, 28 Apr 2026 @5:00](https://youtu.be/3LNhQaTgduE?t=300). He also
notes that an adrenaline pre-build lets you skip phases outright [Abir RS, 21 Apr 2026 @5:40](https://youtu.be/vEFQVrVKjZc?t=340), which is
what the Raksha and Zamorak videos actually do.

**Where the adrenaline crystal is and is not usable.** He points out you can already fake it in
Elite Dungeon 3 by checkpointing to the final boss, portalling out for 100% adrenaline and going
back in — but not at Zuk, because you cannot checkpoint if you are going for the cape
[Abir RS, 21 Apr 2026 @5:06](https://youtu.be/vEFQVrVKjZc?t=306). This matches the Zuk guide, which builds adrenaline in-fight off the
igneous mobs instead [The RS Guy, 5 Apr 2026 @12:21](https://youtu.be/rV5PB2sGV7U?t=741).

**Non-War's-Retreat pre-build items across the set.** Adrenaline potion in the inventory at Zuk
and Zamorak [[The RS Guy, 5 Apr 2026 @5:53](https://youtu.be/rV5PB2sGV7U?t=353); [MrEznorbRS, 26 Apr 2026 @11:13](https://youtu.be/PRAUrPvS_ww?t=673)]; super adrenaline potion at Rasial
[PsychAttack, 14 May 2026 @2:26](https://youtu.be/q1JVE10ISsE?t=146); adrenaline flask as an optional Raksha burst extender
[Oyi RS, 28 Apr 2026 @6:38](https://youtu.be/3LNhQaTgduE?t=398); ancient elven ritual shard at Zuk [The RS Guy, 5 Apr 2026 @5:53](https://youtu.be/rV5PB2sGV7U?t=353); conjures spawned
before entry at Zamorak and Rasial [[MrEznorbRS, 26 Apr 2026 @22:25](https://youtu.be/PRAUrPvS_ww?t=1345); [PsychAttack, 14 May 2026 @1:51](https://youtu.be/q1JVE10ISsE?t=111)]; vulnerability
bombs treated as universal ("always advised at every boss") [MrEznorbRS, 26 Apr 2026 @10:39](https://youtu.be/PRAUrPvS_ww?t=639); and a plain
combat dummy used as a pre-build target before Verak Lith [The RS Guy, 1 Apr 2026 @4:21](https://youtu.be/ufHZj98ZXYw?t=261).

**Buff-stacking before the fight, Zuk specifically.** Powder of penance (prayer points on
damage) plus powder of protection (protection prayers 10% more effective, and explicitly does
*not* stack with amulet of souls or Essence of Finality); an HP boost from a bonfire, the desert
pantheon aura or the Anachronia thermal spa; and, once inside the Fight Cauldron, donating
Tokkul for +10% damage reduction in obsidian armour, up to three times for 60 minutes — twice is
recommended for a 20–25 minute run [The RS Guy, 5 Apr 2026 @4:16](https://youtu.be/rV5PB2sGV7U?t=256).

### Numeric claims to verify

| Claim | Source |
| --- | --- |
| Zuk run completed in 25 minutes 48 seconds, no food | [The RS Guy, 5 Apr 2026 @49:12](https://youtu.be/rV5PB2sGV7U?t=2952) |
| Account used: 90 Attack, 1 Necromancy, 1 Archaeology, Invention in the 50s | [The RS Guy, 5 Apr 2026 @49:12](https://youtu.be/rV5PB2sGV7U?t=2952) |
| TokKul-Zo ring: +10% damage during Zuk waves and Har-Aken | [The RS Guy, 5 Apr 2026 @1:05](https://youtu.be/rV5PB2sGV7U?t=65) |
| Powder of protection: protection prayers 10% more effective | [The RS Guy, 5 Apr 2026 @4:16](https://youtu.be/rV5PB2sGV7U?t=256) |
| Tokkul donation: +10% damage reduction, up to 3 times, 60 minutes | [The RS Guy, 5 Apr 2026 @4:48](https://youtu.be/rV5PB2sGV7U?t=288) |
| Obsidian armour = 55% damage reduction; hellhound adds 20% | [The RS Guy, 5 Apr 2026 @5:21](https://youtu.be/rV5PB2sGV7U?t=321) |
| Vulnerability bomb: +10% damage for 1 minute | [The RS Guy, 5 Apr 2026 @6:26](https://youtu.be/rV5PB2sGV7U?t=386) |
| 50,000 damage needed per Zuk feet window | [The RS Guy, 5 Apr 2026 @11:18](https://youtu.be/rV5PB2sGV7U?t=678) |
| Missed Jad flick ≈ 3,000 damage with this setup | [The RS Guy, 5 Apr 2026 @16:09](https://youtu.be/rV5PB2sGV7U?t=969) |
| Jad melee swipe hit close to 4,000 | [The RS Guy, 5 Apr 2026 @34:34](https://youtu.be/rV5PB2sGV7U?t=2074) |
| Devotion: 10 seconds, +5 seconds per kill, max 2 → 20 seconds | [The RS Guy, 5 Apr 2026 @17:47](https://youtu.be/rV5PB2sGV7U?t=1067) |
| Challenge 2 boss: 58% hit chance; ignores hitsplats below 3,000 | [The RS Guy, 5 Apr 2026 @23:44](https://youtu.be/rV5PB2sGV7U?t=1424) |
| Challenge 3 final hit: 2,500 | [The RS Guy, 5 Apr 2026 @32:55](https://youtu.be/rV5PB2sGV7U?t=1975) |
| Har-Aken submerges for 45 seconds or 1 minute (author unsure which) | [The RS Guy, 5 Apr 2026 @36:44](https://youtu.be/rV5PB2sGV7U?t=2204) |
| Har-Aken final 12,000 HP after resurfacing | [The RS Guy, 5 Apr 2026 @37:49](https://youtu.be/rV5PB2sGV7U?t=2269) |
| Har-Aken bombardment dodged by moving 4 tiles in a cardinal direction | [The RS Guy, 5 Apr 2026 @37:16](https://youtu.be/rV5PB2sGV7U?t=2236) |
| "Suffer" debuff = 15 stacks, one tile of movement each | [The RS Guy, 5 Apr 2026 @38:55](https://youtu.be/rV5PB2sGV7U?t=2335) |
| Zuk rock drop ("die") ≈ 2,000 damage | [The RS Guy, 5 Apr 2026 @40:31](https://youtu.be/rV5PB2sGV7U?t=2431) |
| Arena fire during pizza phase: 800–900 damage per tick while praying | [The RS Guy, 5 Apr 2026 @42:07](https://youtu.be/rV5PB2sGV7U?t=2527) |
| Zuk's special attack order resets below 100,000 LP | [The RS Guy, 5 Apr 2026 @47:33](https://youtu.be/rV5PB2sGV7U?t=2853) |
| Unprotected burn ticks: 252 per hit; fissure ticks 589 | [The RS Guy, 5 Apr 2026 @48:04](https://youtu.be/rV5PB2sGV7U?t=2884), 48:37 |
| Zamorak: 60,000 damage needed per rune burst | [MrEznorbRS, 26 Apr 2026 @13:29](https://youtu.be/PRAUrPvS_ww?t=809) |
| Rune 1 hex: second hitsplat at 10% per stack | [MrEznorbRS, 26 Apr 2026 @3:19](https://youtu.be/PRAUrPvS_ww?t=199) |
| Rune 2 edict: ability cooldowns reduced 8% | [MrEznorbRS, 26 Apr 2026 @3:52](https://youtu.be/PRAUrPvS_ww?t=232) |
| Rune 3 edict: near a hex rune, deal and take 5% more damage | [MrEznorbRS, 26 Apr 2026 @4:26](https://youtu.be/PRAUrPvS_ww?t=266) |
| Rune 4 hex: 7% damage through shield effects per stack | [MrEznorbRS, 26 Apr 2026 @5:00](https://youtu.be/PRAUrPvS_ww?t=300) |
| Rune 5 edict: ±5% damage near the sword; 30-second trap immunity, 60-second cooldown | [MrEznorbRS, 26 Apr 2026 @6:07](https://youtu.be/PRAUrPvS_ww?t=367) |
| Rune 6 hex: healing reduced 10% per stack; edict: more damage below 60% max LP | [MrEznorbRS, 26 Apr 2026 @6:39](https://youtu.be/PRAUrPvS_ww?t=399) |
| Invoke Death execute threshold: 30,000 (20,000 in phase 7) | [MrEznorbRS, 26 Apr 2026 @20:10](https://youtu.be/PRAUrPvS_ww?t=1210), 26:19 |
| Devotion extended from ~6 s to 11 s by a kill | [MrEznorbRS, 26 Apr 2026 @23:32](https://youtu.be/PRAUrPvS_ww?t=1412) |
| Phase 7 blast of energy: 9,000 damage, halved by Reflect | [MrEznorbRS, 26 Apr 2026 @26:19](https://youtu.be/PRAUrPvS_ww?t=1579) |
| Follow-up blasts are 25–50% of the first blast's damage | [MrEznorbRS, 26 Apr 2026 @24:06](https://youtu.be/PRAUrPvS_ww?t=1446) |
| Blood reaver conjure requires 73 Summoning; ripper demon 96 | [MrEznorbRS, 26 Apr 2026 @10:05](https://youtu.be/PRAUrPvS_ww?t=605) |
| Occultist ring ≈ 14 million | [MrEznorbRS, 26 Apr 2026 @8:23](https://youtu.be/PRAUrPvS_ww?t=503) |
| Occultist ring ≈ 70 million | [MrEznorbRS, 29 Mar 2026 @1:04](https://youtu.be/RPmmk66BAqA?t=64) |
| Ring of death ≈ 40 million | [MrEznorbRS, 26 Apr 2026 @10:39](https://youtu.be/PRAUrPvS_ww?t=639) |
| Death Skulls now costs only 60 adrenaline | [MrEznorbRS, 29 Mar 2026 @2:09](https://youtu.be/RPmmk66BAqA?t=129) |
| Greater Ricochet ability ≈ 300 million | [Oyi RS, 28 Apr 2026 @0:33](https://youtu.be/3LNhQaTgduE?t=33) |
| Raksha kills under 3 minutes with this rotation | [Oyi RS, 28 Apr 2026 @1:06](https://youtu.be/3LNhQaTgduE?t=66), 04:28 |
| Death spore arrows proc at 12 stacks; Wen arrows cap at 10 | [Oyi RS, 28 Apr 2026 @5:00](https://youtu.be/3LNhQaTgduE?t=300) |
| Greater Ricochet jumps death spore stacks from 2 to 10–11 in one cast | [Oyi RS, 28 Apr 2026 @6:05](https://youtu.be/3LNhQaTgduE?t=365) |
| Raksha pool skip started at ~500k HP remaining | [Oyi RS, 28 Apr 2026 @2:12](https://youtu.be/3LNhQaTgduE?t=132) |
| Seren godbow spec hit for roughly 15k and 12k splats at Raksha | [Oyi RS, 28 Apr 2026 @7:12](https://youtu.be/3LNhQaTgduE?t=432) |
| Kalphite King green attack: over 40,000 damage through prayer | [The RS Guy, 1 Apr 2026 @0:00](https://youtu.be/ufHZj98ZXYw?t=0) |
| Masterwork range survives a 35k hit; delays 50% of damage taken | [The RS Guy, 1 Apr 2026 @0:33](https://youtu.be/ufHZj98ZXYw?t=33) |
| Equilibrium perk: no crits, +14% damage on abilities and on poison | [The RS Guy, 1 Apr 2026 @1:06](https://youtu.be/ufHZj98ZXYw?t=66), 01:38 |
| Raksha: Dracolich ~1:25, masterwork low 1:30s (5–6 seconds slower) | [The RS Guy, 1 Apr 2026 @3:16](https://youtu.be/ufHZj98ZXYw?t=196) |
| Blackstone Dragon kill ~30 seconds under the grandmaster timer | [The RS Guy, 1 Apr 2026 @4:21](https://youtu.be/ufHZj98ZXYw?t=261) |
| Verak Lith: 600,000 damage in 19 seconds | [The RS Guy, 1 Apr 2026 @4:21](https://youtu.be/ufHZj98ZXYw?t=261) |
| Zamorak 4,000% enrage: effective HP pool ≈ 64,000 with power burst + masterwork | [The RS Guy, 1 Apr 2026 @6:36](https://youtu.be/ufHZj98ZXYw?t=396) |
| Silverquill: tumors at 66% and 33% health; blood hog immediately after | [RainyScape, 28 Mar 2026 @2:17](https://youtu.be/75Z9zdfrquM?t=137) |
| Silverquill: one basic attack destroys a tumor in 99% of cases at high level | [RainyScape, 28 Mar 2026 @3:57](https://youtu.be/75Z9zdfrquM?t=237) |
| Animate Dead re-cast every 12 minutes in the AFK magic setup | [RainyScape, 28 Mar 2026 @4:31](https://youtu.be/75Z9zdfrquM?t=271) |
| Silverquill: 12,350 average loot per kill; ~57 kills/hour necro AFK ≈ 700k/hour | [RainyScape, 28 Mar 2026 @8:26](https://youtu.be/75Z9zdfrquM?t=506), 09:00 |
| Silverquill pet at 322 kills; some players dry past 600 | [RainyScape, 28 Mar 2026 @7:51](https://youtu.be/75Z9zdfrquM?t=471) |
| War's Retreat: ~1,000 boss kills for the first adrenaline unlock; 2,000 total | [Abir RS, 21 Apr 2026 @0:32](https://youtu.be/vEFQVrVKjZc?t=32), 07:20 |
| KBD AFK: ~2 kills/minute, ~100 kills/hour, ~200k combat xp/hour | [Abir RS, 21 Apr 2026 @0:32](https://youtu.be/vEFQVrVKjZc?t=32), 01:10 |
| KBD killed in 20–30 seconds on a mostly-Revolution bar | [Abir RS, 21 Apr 2026 @6:47](https://youtu.be/vEFQVrVKjZc?t=407) |
| Imbued Shadows costs 40% adrenaline; Death Swiftness is a 100% ultimate | [Abir RS, 21 Apr 2026 @3:59](https://youtu.be/vEFQVrVKjZc?t=239) |
| Rasial: 137 kills, zero unique drops; Raksha 44 kills, zero | [PsychAttack, 14 May 2026 @5:31](https://youtu.be/q1JVE10ISsE?t=331) |
| Arch-Glacor ≈ 18M/hour at 0 enrage; 1 in 170 rare at a 20-kill 250-enrage streak | [MrEznorbRS, 29 Mar 2026 @3:51](https://youtu.be/RPmmk66BAqA?t=231), 04:24 |
| Araxxor: +20% enrage per kill, resets daily or with a ~1M pheromone; ≈ 40M/hour | [MrEznorbRS, 29 Mar 2026 @6:03](https://youtu.be/RPmmk66BAqA?t=363), 09:58 |
| Elite Dungeon 2: Greater Fury codex ≈ 450M; draconic energy 180,000 | [MrEznorbRS, 29 Mar 2026 @10:32](https://youtu.be/RPmmk66BAqA?t=632), 11:06 |
| Equilibrium perk needs level 92 Invention; arrived with the 9 March 2026 update | [kruxor, 18 Mar 2026 @1:06](https://youtu.be/esoSvgF6ItI?t=66) |

### Contradictions and dated advice

**Ability category naming.** The Zuk guide states thresholds "were formerly called threshold
abilities, but now they're called enhanced abilities" [The RS Guy, 5 Apr 2026 @21:35](https://youtu.be/rV5PB2sGV7U?t=1295), but also calls them
"powerful abilities" in the same breath, and the pizza-phase explanation reverts to "powerful"
[The RS Guy, 5 Apr 2026 @43:11](https://youtu.be/rV5PB2sGV7U?t=2591). The F2P guide, three days earlier, still lists basic, **enhanced** and
**threshold** as separate categories [Bear, 28 Mar 2026 @3:11](https://youtu.be/igPnkZa2QTU?t=191), and the Raksha video still says
"thresholds" [Oyi RS, 28 Apr 2026 @6:38](https://youtu.be/3LNhQaTgduE?t=398). Treat the naming as unsettled in this corpus.

**Berserk and shield-breaking.** Berserk builds the burst at Zuk's feet but does *not* break an
igneous shield, because it is not a targeted ability [The RS Guy, 5 Apr 2026 @43:11](https://youtu.be/rV5PB2sGV7U?t=2591). That is easy to get
wrong given that the same bar puts Berserk first.

**Rigid vs improvised ranged rotations, same month, opposite advice.** Oyi teaches a fixed
Dracolich sequence built around a full Rapid Fire channel [[Oyi RS, 28 Apr 2026 @6:38](https://youtu.be/3LNhQaTgduE?t=398), 28 April 2026];
The RS Guy argues that *not* having to channel Rapid Fire is the main practical advantage of
masterwork range, and that Dracolich only wins with a perfect rotation
[[The RS Guy, 1 Apr 2026 @2:10](https://youtu.be/ufHZj98ZXYw?t=130), 06:02, 1 April 2026]. Both are current; they are aimed at different skill
levels.

**Powder of protection stacking.** The Zuk guide says powder of protection does not stack with
an amulet of souls or Essence of Finality, so wear the amulet instead
[The RS Guy, 5 Apr 2026 @4:48](https://youtu.be/rV5PB2sGV7U?t=288). The Rasial setup lists both powders while also equipping an Essence of
Finality [PsychAttack, 14 May 2026 @0:02](https://youtu.be/q1JVE10ISsE?t=2). Either the Rasial setup is wasting the powder or the
non-stacking claim is narrower than stated — worth checking.

**Occultist ring price moved by roughly 5×** between 29 March (≈70M) and 26 April (≈14M)
[[MrEznorbRS, 29 Mar 2026 @1:04](https://youtu.be/RPmmk66BAqA?t=64); [MrEznorbRS, 26 Apr 2026 @8:23](https://youtu.be/PRAUrPvS_ww?t=503)]. Consistent with the same author's other claim that
necromancy gear crashed after the combat update [kruxor, 18 Mar 2026 @2:17](https://youtu.be/esoSvgF6ItI?t=137).

**Explicitly patch-tied, will expire.**
- Vampyrism aura is to become the vampyrism aspect "later in the year"; the guide says the
  aspect replaces the aura and works identically [The RS Guy, 5 Apr 2026 @8:04](https://youtu.be/rV5PB2sGV7U?t=484). The Silverquill guide
  hedges the same way about the penance aura/aspect [RainyScape, 28 Mar 2026 @6:12](https://youtu.be/75Z9zdfrquM?t=372).
- The desert pantheon aura is described as being deleted [The RS Guy, 5 Apr 2026 @4:16](https://youtu.be/rV5PB2sGV7U?t=256).
- Death Skulls' cost was reduced to 60 adrenaline, which devalues the Saradomin cape
  [MrEznorbRS, 29 Mar 2026 @2:09](https://youtu.be/RPmmk66BAqA?t=129).
- The Energizing perk was "recently updated" to give extra flat accuracy [The RS Guy, 5 Apr 2026 @2:09](https://youtu.be/rV5PB2sGV7U?t=129).
- Bik arrows were updated with the combat modernisation and are now more usable
  [The RS Guy, 1 Apr 2026 @1:38](https://youtu.be/ufHZj98ZXYw?t=98).
- The Equilibrium perk (level 92 Invention, ecliptic components) arrived with the 9 March 2026
  update [kruxor, 18 Mar 2026 @1:06](https://youtu.be/esoSvgF6ItI?t=66) — i.e. one week after the 2 March modernisation.
- Reaper assignments are no longer limited to one per day, and War's blessing 4 lets you pick
  the assignment, which is what makes trimmed masterwork effectively permanent
  [The RS Guy, 1 Apr 2026 @2:43](https://youtu.be/ufHZj98ZXYw?t=163).
- Silverquill was released the week of 28 March 2026, so its drop rates and prices are
  provisional by the author's own admission [RainyScape, 28 Mar 2026 @9:00](https://youtu.be/75Z9zdfrquM?t=540).

**Uncertain transcription — do not treat as canonical.** "Adaptive Strike" on both Zuk
Revolution bars [[The RS Guy, 5 Apr 2026 @2:40](https://youtu.be/rV5PB2sGV7U?t=160), 03:12]; "Imbued Shadows" as a ranged ability costing 40%
adrenaline (appears in two independent videos, so probably real) [[Oyi RS, 28 Apr 2026 @2:12](https://youtu.be/3LNhQaTgduE?t=132);
[Abir RS, 21 Apr 2026 @3:59](https://youtu.be/vEFQVrVKjZc?t=239)]; the Zamorak amulet described as a "conjurer's raising amulet"
[MrEznorbRS, 26 Apr 2026 @8:59](https://youtu.be/PRAUrPvS_ww?t=539); the "sac cape" the Zamorak author declines to use [MrEznorbRS, 26 Apr 2026 @9:32](https://youtu.be/PRAUrPvS_ww?t=572);
"indication sticks" among Arch-Glacor poison boosters [MrEznorbRS, 29 Mar 2026 @3:17](https://youtu.be/RPmmk66BAqA?t=197); and the Rasial
brews ("super serotonin brews") [PsychAttack, 14 May 2026 @1:15](https://youtu.be/q1JVE10ISsE?t=75). The Rasial video also names the Zuk cape
as "igneous Zul'jin", which is certainly a caption error for the style-specific igneous Zuk cape
[PsychAttack, 14 May 2026 @1:15](https://youtu.be/q1JVE10ISsE?t=75).

---


## Verified numbers

Every video number that mattered for a rotation was checked against the wiki on 7 September 2026. This table is the
authority; where a video disagreed, the disagreement is named. The trainer's own data
(`public/data/abilities.json`) was checked against the same values and matches all of them.

| Ability | Adrenaline | Cooldown | Damage | Notes from the wiki |
|---|---|---|---|---|
| [Berserk](https://runescape.wiki/w/Berserk) | −100 % | 100 t (60 s) | — | 19.8 s (33 t) base, 1.75× melee damage, +25 % damage taken. Greater Flurry extends it up to 8 t per use, Vestments of havoc +10 t, maximum 59 t |
| [Meteor Strike](https://runescape.wiki/w/Meteor_Strike) | −60 % | 100 t | 220–250 % | 30 s buff: 4.5 % adrenaline per tick with a melee weapon, and melee basics generate 1.5× adrenaline |
| [Greater Flurry](https://runescape.wiki/w/Greater_Flurry) | −25 % | 34 t | 60–70 % × 8 | Channel over 8 t; **each hit extends Berserk by 1 tick** — it does not shorten Berserk's cooldown |
| [Hurricane](https://runescape.wiki/w/Hurricane) | −25 % | 34 t | 135–165 % × 2 | Two-handed weapon required — this resolves Carguy's unattributed "135–165 %" |
| [Overpower](https://runescape.wiki/w/Overpower) | −60 % | 50 t | 520–570 % | With Igneous Kal-Ket / Kal-Zuk instead: two hits of 280–340 % |
| [Greater Ricochet](https://runescape.wiki/w/Greater_Ricochet) | +9 % | 17 t | 75–85 % | Hits the target plus up to 6 enemies within 5 tiles; arrows return to the primary target when there are too few |
| [Deadshot](https://runescape.wiki/w/Deadshot) | −60 % | 50 t | 105–125 % × 4 | **No longer a bleed** since the rework; with Igneous Kal-Xil / Kal-Zuk it is 55–75 % × 8 |
| [Greater Death's Swiftness](https://runescape.wiki/w/Greater_Death%27s_Swiftness) | −100 % | 100 t | — | 37.8 s, 1.5× ranged damage, **self-buff that follows you**, so it does not benefit from Planted Feet |
| [Imbue: Shadows](https://runescape.wiki/w/Imbue:_Shadows) | −40 % | 100 t | — | 30 s; ranged attacks generate **5 % adrenaline per hit**, 10 % with Natural Instinct; Shadow Tendrils extends it by 3.6 s |
| [Galeshot](https://runescape.wiki/w/Galeshot) | +9 % | 34 t | 90–110 % | Applies Searing Winds for 6 s: **+20 % ability damage per hit**. There is no ability called "Imbue: Gales" — that name in search results is a garbled Galeshot |
| [Greater Sunshine](https://runescape.wiki/w/Greater_Sunshine) | −100 % | 100 t | — | 37.8 s, 7×7 **ground area**, 1.5× magic damage inside it |
| [Omnipower](https://runescape.wiki/w/Omnipower) | −60 % | 50 t | 420–500 % | **One hit** without an igneous cape; with Kal-Mej / Kal-Zuk it becomes 4 hits of 120–150 %. Resolves Carguy (1 hit) against DiamondFang (2 hits): Carguy is right |
| [Tsunami](https://runescape.wiki/w/Tsunami) | −100 % | 100 t | 225–275 % | Cost drops 12 % per Glacial Embrace stack from Incite Fear, **floor 40 %** — not zero, so Qp RS is wrong and Carguy is right. Afterwards, magic critical strikes generate +8 % adrenaline for 30 s |
| [Asphyxiate](https://runescape.wiki/w/Asphyxiate) | −25 % | 34 t | 120–140 % × 4 | Magic **level 59** (Qp RS is right); 4.2 s channel; a completed channel gives Channelled Might, +15 % critical strike damage for 3.6 s |
| [Death Skulls](https://runescape.wiki/w/Death_Skulls) | −60 % | 100 t | 250–750 % total | Maximum **3 hits** on a single target; the igneous capes add 2 bounces, so 4 — this confirms DiamondFang. Inside Living Death the cooldown drops to 17 t |
| [Living Death](https://runescape.wiki/w/Living_Death) | −100 % | 150 t | — | 30 s. Resets Touch of Death and Death Skulls, Finger of Death deals 1.5×, Touch of Death gives +6 % extra adrenaline, the basic attack gives 2 necrosis |
| [Finger of Death](https://runescape.wiki/w/Finger_of_Death) | −60 %, −10 % per necrosis | none | 270–330 % | Free at 6 necrosis and consumes up to 6; 405–495 % inside Living Death |
| [Touch of Death](https://runescape.wiki/w/Touch_of_Death) | **+9 %** | 24 t | 90–110 % | 4 necrosis. The videos' "15 % adrenaline" is only true inside Living Death (9 + 6) |
| [Split Soul](https://runescape.wiki/w/Split_Soul) | free (incantation) | 100 t | — | **20.4 s**, not the 24.4 s a video states. 400 % of the life points Soul Split would have healed is dealt as damage instead |

### Claims that stayed unverified

The per-style chapters each end with a "numeric claims to verify" table. Those numbers were not checked one by one —
they are mostly gear-specific damage figures and gold prices that age faster than the abilities do. Treat them as what
a good player said on a given date, not as game data.

---


## What this means for the trainer

The point of collecting all this was to check the trainer against it. That check was run on 7 September 2026.

### What was checked

1. **All data re-fetched from the wiki** (`tools/fetch-abilities.py`, `fetch-specs.py`, `fetch-spells.py`,
   `fetch-prayers.py`) and diffed against what the repository shipped: **126 abilities, 75 special attacks and 30
   spells came back byte-identical**, so nothing in the game's numbers has moved since the last fetch on 3 September.
   Prayer texts improved only in wording (the wiki now names the combat style: "+6 % Necromancy damage" instead of
   "+6 % damage"). One parser bug surfaced and was fixed: an empty wikitext parameter swallowed the one after it,
   which had emptied the *effects* text of Death Spark and Soul Reave.
2. **Every mechanic the videos teach was looked up in the engine rules.** Meteor Strike's 4.5 % adrenaline per tick
   and 1.5× melee basics, Greater Flurry extending Berserk by one tick per hit, Asphyxiate's Channelled Might,
   Tsunami's Glacial Embrace discount and its post-cast crit adrenaline, Galeshot's Searing Winds, Imbue: Shadows'
   5 % per hit, Living Death's cooldown resets and Finger of Death's 1.5×, Death Skulls' bounce pattern, Rapid Fire's
   Dracolich infusion, Perfect Equilibrium — all of them are in `src/app/engine/rules-*.ts` with the wiki link next
   to them, and the values match.
3. **Every ability the videos discuss exists in the trainer.** 123 ability sections across the four style chapters
   were matched against `public/data/abilities.json`, `specs.json` and `spells.json`; the only misses were spelling
   variants ("Pulverize" for Pulverise, "Snapshot" for Snap Shot) and headings that are not abilities.
4. **The igneous capes' hit-splitting** (Overpower 2 × 280–340, Omnipower 4 × 120–150, Deadshot 8 × 55–75, Death
   Skulls' two extra bounces) is modelled data-driven from `set-effects.json` through the loadout resolver's
   `hitsOverrides` / `damageOverrides`.

So the answer to "does the trainer match what the community plays?" is: **on the numbers and the mechanics, yes.**

### Where the trainer cannot express what these guides teach

These are not wrong values; they are things the model has no room for. Listed in the order they would pay off.

| Gap | What the videos do with it | What it would take |
|---|---|---|
| **Stalling** | The standard opener on melee, ranged and magic: start an ability out of range or on a target cycle, release it as the fight starts. Cooldown and adrenaline are spent at the stall, the damage lands later. KevMcGames spends a whole video on releasing a stall cleanly | The PvME importer currently folds "stall X … release X" into one cast. A real model needs a held-cast state in the engine, plus a key to release it |
| **Revolution practice** | Qp RS's guides are entirely about *bar order*: which abilities revolution should fire for you and in which priority | The engine has a revolution mode, but a player cannot practise "is my bar ordered right?" — there is no bar-scoring screen |
| **Eating** | Food costs 3 % adrenaline since the rework (down from 10 %), which is why the guides pick brews and blubber over solid food, and why the "Hungry Like the Wolf" relic matters | Life points are not simulated, so food has nothing to interact with. A cheap version: an "eat" action that only charges the adrenaline |
| **A fight as a chain of phases** | Every boss guide carries adrenaline across a phase boundary on purpose — the Zuk guide's core trick, Zamorak's potion between runes | Pre-builds exist per rotation, but not "this rotation starts where that one ended" |
| **Perks and relics on a preset** | Rotations assume Conservation of Energy, Ring of Vigour, Invigorating 4, Fury of the Small, Equilibrium; some assume Double Surge or Mobile | The loadout has all of these, but the PvME preset importer does not read them from the guides, so imported setups start without them |

### Where the videos disagree with each other

Resolved against the wiki in *Verified numbers* above: Omnipower's hit count, Tsunami's floor cost, Asphyxiate's
level, Death Skulls' hits with a cape, Split Soul's duration. The remaining disagreements — Galeshot's magnitude,
Piercing Shot's cooldown cut on Snipe, Bloodlust's HP threshold (Carguy ~60 %, DiamondFang 70 %), Snipe inside or
outside Death's Swiftness — are strategy or unverified figures, and are left standing in the style chapters with
both sides named.
