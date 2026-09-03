# Plan: Prayer tracking, prayer book, incoming attacks

Stand: 2026-09-03, Branch `feature/prayers` (Worktree `D:\Projekte\rs3-ability-trainer-bars`), abgezweigt von `main`
nach dem PvME-Import-Merge (`c2f2d82`).

## Ziel

1. Aktive Prayers werden immer angezeigt. Prayers schließen sich wie im Spiel gegenseitig aus (Overhead-Gruppe,
   Stat-Gruppen, Turmoil-Tier vs. Saps/Leeches, …); ein aktiver Prayer wird durch erneutes Drücken deaktiviert.
2. Prayer-Buch (Standard prayers oder Ancient curses) ist eine Loadout-Einstellung; innerhalb einer Session gibt es
   kein Mischen, ein Druck aus dem anderen Buch wird ignoriert.
3. Checkbox "Enable incoming attacks" beim Start: der Gegner greift in festem Takt an. Im Tick, in dem der Treffer
   landet, muss der passende Overhead aktiv sein (Protect/Deflect Melee/Ranged/Magic/Necromancy). Einstellbar:
   Styles, Muster (zufällig / nie zweimal derselbe / Reihe / Serien), Angriffstakt, Vorwarnzeit.
   Punkte: jeder Tick mit Soul Split (+1), jeder korrekt gebetete Treffer (+1); ungeschützter Treffer = "hit".
4. Presets: Nakatra (Magic + Ranged, 5 Ticks, Serien von 3), Zamorak (Magic + Ranged, 5 Ticks, zufällig),
   Raksha (Melee + Ranged + Magic, 5 Ticks, nie zweimal derselbe).

## Wiki-Fakten (runescape.wiki)

- Standard-Overheads: Protect from Melee / Ranged / Magic / Necromancy, Retribution, Redemption, Smite – nur einer.
  Protect from Summoning stapelt. Curses: Deflect Melee / Ranged / Magic / Necromancy, Soul Split, Wrath – nur
  einer; Deflect Summoning stapelt.
- Turmoil/Anguish/Torment/Sorrow/Malevolence/Desolation/Affliction/Ruination: untereinander exklusiv, nicht mit
  Saps/Leeches. Fortitude nicht mit Saps/Leeches. Light Form ↔ Dark Form, Soul Link ↔ Teamwork Protection.
- Stat-Gruppen (Standard): Thick/Rock/Steel Skin; Burst/Superhuman/Ultimate Strength; Clarity/Improved/Incredible
  Reflexes; Sharp/Hawk/Eagle Eye; Unstoppable/Unrelenting/Overpowering Force; Mystic Will/Lore/Might;
  Charge/Super Charge/Overcharge; Decay/Hastened/Accelerated Decay; Hand of Judgement/Fate/Doom; die kombinierten
  (Chivalry, Piety, Rigour, Augury, Sanctity) schließen alle Stat-Gruppen aus. Rapid Heal ↔ Rapid Renewal.
- Protect: 50 % weniger Schaden (PvM). Deflect: 50 % plus 67 % Chance auf 10 % Reflect. Soul Split schützt nicht.
- Flick-Timing: "the tick the opponent's attack reaches the player and deals damage" – Prayer im selben Tick reicht.
- Bosse: Nakatra Magic/Ranged, 5 Ticks, Style wechselt nach jeder Soulfire (praktisch alle 3 Autos). Zamorak
  Magic/Ranged, 5 Ticks, Audio-Telegraph, kein festes Muster. Raksha Melee/Ranged/Magic, 5 Ticks, im Nahkampf nie
  zweimal derselbe Style.

## Umsetzung

- `engine/prayer-rules.ts`: Gruppen pro Buch als Daten, `PROTECTION[book][style]`, `togglePrayer(active, id, book)`
  liefert neues Set + deaktivierte Prayers. Unit-Tests.
- Engine: `activePrayers`, `prayerBook`, Enemy-Schedule (`nextAttack {tick, style}`), Zähler
  `prayerStats {ticks, soulSplitTicks, attacks, prayed, hits}`. Events `prayer` (on/off/replaced), `wrong-book`,
  `attack` (style, prayed). Prayers sind keine Buffs mehr, sondern eigener Zustand. Angriff wird in `advanceTick`
  nach den Inputs dieses Ticks aufgelöst.
- Models: `Loadout.prayerBook`, `EnemyConfig` + `ENEMY_PRESETS`, `Session.prayerStats`. Storage: `enemy`-Signal
  (settings-Store, Key `enemy`).
- Train: Panel "Incoming attacks" (Checkbox, Preset, Styles, Muster, Takt, Vorwarnung), Zeile "Prayers" mit aktiven
  Icons, Widget "next attack" mit Style-Icon und Countdown, Score-Zeile, Summary-Block.
- Loadout: Prayer-Buch-Auswahl.
