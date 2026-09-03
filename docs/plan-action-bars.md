# Plan: In-game action bars, weapon switching, slot keybinds

Stand: 2026-09-03, Branch `feature/action-bars` (Worktree `D:\Projekte\rs3-ability-trainer-bars`), abgezweigt von
`main` nach dem Supabase-Commit `330c9c6`. Parallel läuft `feature/interactions` in einem eigenen Worktree.

## Ziel

Der Trainer zeigt statt einer reinen "nächste Ability"-Queue die fünf Action Bars des Spiels (Main + Additional
1–4, je 14 Slots). Der User zieht Abilities, Prayers, Potions und Waffenwechsel per Drag & Drop in bis zu 18
Presets, weist Presets den Bar-Positionen zu, und bindet pro Waffenstyle (Melee, Ranged, Magic, Necromancy) andere
Presets an beliebige Positionen. Keybinds hängen wie im Spiel an Position + Slot. Die Rotation bleibt die Aufgabe:
die Queue-Leiste oben zeigt den nächsten Schritt, unten leuchtet der passende Slot.

Entscheidungen (Martin, 2026-09-03): nur Slot-Keybinds (Ability-Keybinds fallen weg) · Waffenwechsel ist ein
Rotations-Schritt · Style-Binding frei pro Position · Waffen haben Style **und** Typ (2h / Dual wield / Shield),
Equipment-Anforderungen werden geprüft.

## Wiki-Fakten (runescape.wiki, Action bar / Action Bar Binding / Global cooldown)

- 14 Slots pro Bar, 18 Presets (Members), Main + bis zu 4 Additional Bars sichtbar; Additional Bars zeigen eines
  der 18 Presets.
- Keybinds gehören zu Position + Slot (Main: 1…9, 0, -, = als Default; Additional 1–4 je eigene Sets).
- Action Bar Binding: pro Style (Melee/Ranged/Magic/Necromancy, je Any / Two-handed / Dual Wield) → welche Bar
  (Main oder Additional 1–4) → welches Preset. Style kommt von der Main-Hand-Waffe. Defence ist nicht bindbar.
- Waffenwechsel ist instant, kostet keinen Tick und startet keinen GCD.
- Abilities brauchen die passende Waffe; Defence/Constitution gehen mit allem. Equipment-Spalte: Any, Two-handed,
  Dual wield, Shield. Ausgegraut wird bei Cooldown, zu wenig Adrenalin, falscher Ausrüstung.
- "Extra action button" ist etwas anderes (Boss-Button); gemeint sind Additional Action Bars.

## Datenmodell (lokal, IndexedDB `settings`-Store unter Key `actionbars`)

```ts
type Style4 = 'Melee' | 'Ranged' | 'Magic' | 'Necromancy';
type WeaponType = 'two-handed' | 'dual-wield' | 'shield';   // shield = one-handed + shield
interface ActionBarPreset { id: number /* 1..18 */; name: string; slots: (RotationStep | null)[] /* 14 */ }
interface ActionBarSetup {
  presets: ActionBarPreset[];                        // 18
  positions: (number | null)[];                      // 5: Preset-Id pro Position, wenn kein Binding greift
  bindings: Record<Style4, (number | null)[]>;       // pro Style, pro Position: Preset-Id oder null = bleibt
  slotKeybinds: (Keybind | null)[][];                // 5 × 14
  weaponKeybinds: Record<Style4, Keybind | null>;
  weapons: Record<Style4, WeaponType>;
  startWeapon: Style4;
}
```

- `RotationStep.kind` bekommt `'weapon'` mit `id` = `melee | ranged | magic | necromancy`. Neue Datei
  `public/data/weapons.json` + Icons `public/assets/weapons/*.png` (Skill-Icons der Wiki, `tools/fetch-weapons.py`).
- `Entity` bekommt `weapon?: Weapon`; `EngineEntity` bekommt `style?`, `equipment?`, `weapon?`.
- Alte Ability-Keybinds: Tabelle bleibt in IndexedDB und am Server, wird aber nicht mehr benutzt. Der Sync-Service
  synchronisiert Bars in dieser Version noch nicht (folgt mit Migration `0002`, siehe unten).
- Supabase: die CHECK-Constraint auf `rotations.steps` erlaubt nur `ability|prayer|special`. Migration
  `supabase/migrations/0002_weapon_steps.sql` erweitert sie um `weapon`; bis sie läuft, würde der Upload einer
  Rotation mit Waffenwechsel am Server abgelehnt (lokal bleibt sie gespeichert).

## Engine

- Zustand `weapon: Style4`, `weaponType`. Entity-Kind `weapon` ist ein Off-GCD-Schritt: aktiviert am Verarbeitungs-
  Tick, setzt die Waffe, kein GCD, kein Adrenalin.
- `canUse(key, tick)` → `'ok' | 'weapon' | 'equipment' | 'adrenaline' | 'cooldown'`. Die UI graut damit aus.
- Ability-Druck mit falschem Style oder falscher Equipment-Anforderung: Event `wrong-weapon`, ignoriert, zählt als
  wrong (im Spiel passiert nichts). Gilt in beiden Queueing-Modi.
- Gruppenlogik für Off-GCD-Schritte bleibt: ein Waffenwechsel-Schritt gehört zur Gruppe vor der nächsten GCD-Ability.

## UI

- **Train**: oben die bisherige Queue-Leiste (kleiner), darunter Adrenalin/Buffs, dann die 5 Bars im Spiel-Look:
  dunkle Reihen, 14 Zellen, Keybind unten links, GCD-Overlay auf allen GCD-Abilities, ausgegraut nach `canUse`,
  Cooldown-Sekunden auf Abilities mit eigenem Cooldown, Waffenanzeige mit den 4 Wechsel-Keys, der erwartete
  Schritt leuchtet gold im Slot. Tastendruck: Slot-Key → Entity im Slot (nach aktueller Waffe aufgelöst) → Engine.
  Waffen-Key → Weapon-Entity.
- **Action bars** (neue Seite `/bars`): links 18 Presets (umbenennen, auswählen), rechts das Preset mit 14 Slots.
  Drag & Drop (Angular CDK) aus dem Katalog (Tabs: Styles, Prayers, Curses, Special, Weapons) in Slots, Slot zu
  Slot verschieben, Slot leeren. Darunter: Positionen (5 Selects), Binding-Tabelle 4 Styles × 5 Positionen,
  Waffen-Typen, Startwaffe.
- **Keybinds** (umgebaut): Grid 5 Positionen × 14 Slots "click to bind" mit Defaults für die Main Bar, plus 4
  Waffenwechsel-Keys. Konflikte werden angezeigt.
- **Rotations**: Katalog-Tab "Weapons"; Warnung im Train, wenn ein Schritt auf keinem keybound Slot liegt.

## Verifikation

- Engine-Tests: Waffenwechsel-Schritt, falsche Waffe, Equipment-Mismatch, `canUse`-Gründe, Defence-Ability mit
  jeder Waffe.
- Browser (Port 4500): Preset per Drag & Drop füllen, Binding Magic → Main = Preset 2, Keybinds setzen, Rotation
  mit "switch to Magic" laufen lassen, Grau-Zustände und Overlay prüfen, Reload behält alles.
