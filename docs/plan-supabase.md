# Plan: Online-Features mit Supabase (Frankfurt)

Stand: 2026-09-03, aufbauend auf Commit `34b0006` (Data v2 + Engine v2). Eine andere Session arbeitet parallel
am Trainer selbst; dieser Plan ist so geschnitten, dass er fast nur neue Dateien anlegt und bestehende nur
additiv erweitert (siehe "Koordination").

## 1. Scope v1

- **Login mit Registrierung per E-Mail + Passwort.** E-Mail-Bestätigung Pflicht. E-Mails sind eindeutig
  (Supabase Auth erzwingt das). Zusätzlich ein eindeutiger **Anzeigename** (für Explorer/Scoreboard).
  Passwort-vergessen-Mail.
- **Rotations-Explorer**: alle öffentlichen Rotationen aller User, **ohne Login sichtbar**. Suche nach Name,
  Filter nach Style, Sortierung neu / meist kopiert.
- **Rotation erstellen**: Checkbox "Public", **default an**. Ohne Login bleibt die Rotation lokal (IndexedDB),
  mit Login wird sie zusätzlich am Server gespeichert.
- **Login nur für Schreibzugriffe** (eigene Rotationen speichern/ändern/löschen, später Scores). Lesen ist frei.
- **"Copy to my rotations"**: erzeugt eine **private** Kopie mit Herkunftsverweis (`sourceId`), lokal und, falls
  eingeloggt, am Server unter dem eigenen Account. Kopie ist frei editierbar. Der Original-Zähler "copies" geht hoch.
- **Vorbereitet, aber nicht in v1**: Scoreboard (Sessions-Tabelle wird schon angelegt), Discord-OAuth,
  eigener Mail-Dienst, Account löschen.

## 2. Architektur

- Frontend bleibt Angular auf GitHub Pages. Es spricht direkt mit Supabase über `@supabase/supabase-js`.
  Der `anon key` steht im Frontend, das ist so vorgesehen; Sicherheit kommt ausschließlich aus
  **Row Level Security (RLS)** in Postgres. Der `service_role` key kommt nie ins Repo.
- Supabase-Projekt: Region **eu-central-1 (Frankfurt)**, Free Tier. Martin legt es an (GitHub-Login bei Supabase)
  und gibt mir **Project URL + anon key**. Beides landet in `src/environments/environment.ts` (kein Secret).
- Auth-Einstellungen im Supabase-Dashboard: "Confirm email" an, Site URL `https://rs3trainer.hochware.com`,
  Redirect URLs `https://rs3trainer.hochware.com/**` und `http://localhost:4400/**`.
- E-Mail-Versand v1: Supabase-eigener SMTP (reicht für Bestätigungs- und Reset-Mails, aber nur ein paar pro
  Stunde). v2: Resend oder Brevo als Custom SMTP, dafür 2–3 DNS-Einträge bei GoDaddy (berührt Microsoft 365 nicht).
- Free-Tier-Pause nach 7 Tagen Inaktivität: GitHub-Actions-Cron alle 3 Tage macht einen Lese-Request mit dem
  anon key (`.github/workflows/keepalive.yml`).

## 3. Datenmodell (Postgres, `supabase/migrations/0001_init.sql`)

```sql
-- Profil = öffentlicher Teil eines Users
profiles   (id uuid pk -> auth.users, display_name citext unique not null, created_at)
-- Rotationen; steps = RotationStep[] genau wie im Frontend ({kind:'ability'|'prayer'|'special', id})
rotations  (id uuid pk, owner_id uuid -> profiles, name text (<= 60), steps jsonb (array, <= 200),
            is_public bool default true, source_id uuid null -> rotations (on delete set null),
            styles text[] (abgeleitet, für Filter), copies int default 0, created_at, updated_at)
-- Keybinds pro Account (synchronisiert über Geräte)
keybinds   (user_id uuid -> profiles, entity_key text, keybind jsonb ({code,ctrl,shift,alt}), updated_at,
            primary key (user_id, entity_key))
-- für das spätere Scoreboard, v1 nur befüllt
sessions   (id bigint pk, user_id -> profiles, rotation_id uuid null, rotation_name text,
            accuracy numeric, perfect int, late int, too_early int, wrong int, missed int,
            settings jsonb, loadout jsonb, results jsonb, started_at, ended_at)
```

- Trigger `handle_new_user`: legt bei Registrierung das Profil aus `raw_user_meta_data.display_name` an.
  Anzeigename: 3–20 Zeichen, `[A-Za-z0-9 _-]`, eindeutig ohne Groß/Klein (citext).
- Ability-IDs in `steps` sind die Slugs aus `public/data/*.json`. Der Server validiert nur die Form, nicht den
  Katalog; entfernte Abilities zeigt der Client wie heute als "unknown step".
- RPC `copy_rotation(source uuid)` (security definer): kopiert eine öffentliche Rotation zum aufrufenden User,
  setzt `source_id`, erhöht `copies`, gibt die neue Zeile zurück. So kann niemand fremde Zähler manipulieren.
- RLS:
  - `profiles`: select für alle; update nur eigenes.
  - `rotations`: select wenn `is_public` oder `owner_id = auth.uid()`; insert/update/delete nur `owner_id = auth.uid()`.
  - `keybinds`: select/insert/update/delete nur eigene.
  - `sessions`: insert nur eigene; select v1 nur eigene (Scoreboard später über eine View).
- Explorer-Query (anon): `rotations?select=id,name,steps,styles,copies,updated_at,profiles(display_name)&is_public=eq.true&order=updated_at.desc&limit=50` plus `name=ilike.*text*`.

## 4. Frontend-Änderungen

Neu:
- `core/supabase.service.ts`: Client, Signale `session`/`user`/`profile`, `signUp(email, pw, displayName)`,
  `signIn`, `signOut`, `resetPassword`, `onAuthStateChange`.
- `core/sync.service.ts`: spiegelt Rotationen. Regeln: lokal ist Cache, Server ist Wahrheit sobald eingeloggt.
  Beim Login: eigene Rotationen vom Server holen; lokale Rotationen ohne Server-Pendant werden hochgeladen;
  bei gleicher ID gewinnt das neuere `updatedAt`. Jede Änderung (save/delete) geht zuerst lokal, dann als
  Upsert/Delete an den Server; Fehler werden angezeigt, lokal bleibt es gespeichert.
- Seite `/explore` (in der Navigation): Liste öffentlicher Rotationen mit Besitzer, Step-Icons (bestehende
  `ability-icon` + Tooltip), Style-Tags, Kopien-Zähler, Suche, Buttons "Copy to my rotations" und "Details".
- Seite `/account`: Registrieren, Login, Passwort vergessen, eingeloggt: Anzeigename, Logout.
- Seite `/auth/callback`: fängt die Bestätigungs-/Reset-Links ab (supabase-js `detectSessionInUrl`), zeigt
  "E-Mail bestätigt" und leitet weiter.
- Seite `/privacy`: kurzer Text, was lokal und was bei Supabase (Frankfurt) gespeichert wird.
- `.github/workflows/keepalive.yml`.

Additiv erweitert:
- `models.ts`: `Rotation` bekommt optionale Felder `isPublic?: boolean` (fehlt = true), `sourceId?: string`,
  `sourceName?`, `sourceOwner?`, `syncedAt?: number`. Sonst unverändert.
- `storage.service.ts`: Hooks nach `saveRotation`/`deleteRotation`, die der SyncService abonniert. Keine
  Änderung am IndexedDB-Schema (Felder liegen im JSON der Rotation).
- `rotations` Editor: Checkbox "Public" (default an), Badge "copied from X by Y", Sync-Status.
- `app.html`: Nav-Links "Explore" und "Account" / Anzeigename.
- `consent-banner`: Text wird zur Datenschutz-Info mit Link auf `/privacy`.

Keybinds werden ebenfalls synchronisiert (Entscheidung Martin): beim Login Server-Keybinds laden, lokale Keys ohne
Server-Pendant hochladen, bei Konflikt gewinnt das neuere `updated_at`; jede Bind-Änderung geht als Upsert/Delete
an den Server. Bleibt lokal (v1): Loadout, Settings. Sessions bleiben lokal und werden bei Login zusätzlich als
Zusammenfassung hochgeladen (für das spätere Scoreboard).

## 5. Sicherheit

- Alle Schreibrechte über RLS; anon kann nur lesen, was `is_public` ist.
- Postgres-CHECKs: Name ≤ 60 Zeichen, `steps` ist Array mit ≤ 200 Einträgen, jeder Eintrag hat `kind` und `id`.
- Supabase-Auth-Rate-Limits gegen Registrierungs-Spam bleiben an; Captcha (hCaptcha, gratis) erst wenn nötig.
- Zähler und Kopien nur über die RPC, nie durch direkte Updates von Fremdzeilen.

## 6. Reihenfolge

1. Martin: Supabase-Projekt in Frankfurt anlegen, Auth-Settings wie oben, mir URL + anon key geben.
2. Migration `0001_init.sql` schreiben und im SQL-Editor ausführen; RLS mit curl (anon key) gegenprüfen:
   Lesen öffentlich ok, Schreiben ohne Login abgelehnt.
3. Auth: SupabaseService, Account-Seite, Callback-Seite, Nav.
4. Rotationen: Modellfelder, Public-Checkbox, SyncService (push/pull/merge), Copy-RPC.
5. Explorer-Seite.
6. Privacy-Seite, Banner-Text, README, Keep-alive-Workflow.
7. Verifikation: Unit-Tests für die Merge-Regeln des SyncService (Client gemockt); im Browser: registrieren,
   Mail bestätigen, Rotation anlegen (public), ausloggen, im Explorer sehen, in zweitem Browser kopieren.
8. Deploy auf Pages.

v2-Kandidaten: Scoreboard pro Rotation (mit Ping- und Queueing-Einstellung daneben, sonst unfair), Discord-Login,
Resend-SMTP, Account löschen, Likes/Rating, "Train directly from explorer" ohne Kopie.

## 7. Koordination mit der parallelen Session

- Dieser Teil läuft auf einem Branch `feature/supabase`, abgezweigt von `main`, sobald die andere Session ihren
  aktuellen Stand committet hat. Merge nach Schritt 7.
- Berührungspunkte mit dem laufenden Trainer-Umbau: `models.ts` (nur neue optionale Felder), `storage.service.ts`
  (nur Hooks), `rotations.*` (Checkbox/Badge), `app.html` (Nav), `consent-banner`. Engine, Train-Seite, Daten-Skripte
  und `public/data` werden nicht angefasst.
- Rotation-IDs bleiben die lokalen `crypto.randomUUID()`; dieselbe UUID ist der Primärschlüssel am Server. Dadurch
  braucht es keine ID-Übersetzung.

## 8. Entscheidungen (Martin, 2026-09-03)

1. Kopien sind **default privat**; Herkunft (`source_id`) wird gespeichert.
2. **Anzeigename ist Pflicht bei der Registrierung.**
3. Lokale Rotationen werden beim Login **automatisch hochgeladen**.
4. **Keybinds werden synchronisiert** (Tabelle `keybinds`, siehe oben).

## 9. Stand 2026-09-05 (Kurzfassung – die Abschnitte oben sind der Plan von 0001, nicht der Ist-Zustand)

- Projekt: Supabase Free Tier, Region **eu-west-1 (Irland)** – nicht Frankfurt (siehe `environment.ts`, Privacy-Seite).
- Migrationen 0001–0010 (`supabase/migrations/`): 0001 profiles/rotations/keybinds/sessions + `public_rotations`,
  0002/0004/0008 Step-Arten (`weapon`, `spec`, `special`, `action`, `spell`, `note` …, heute 8), 0003 `action_bars`,
  0005 `feedback` (anon-Insert), 0006 Rollen user/moderator/admin, Sperren, `admin_*`-RPCs, 0007 `setups` +
  `list_public_setups` / `get_public_setup` (definer, anon-aufrufbar), 0009 `client_errors` (anon-Insert, Staff liest),
  0010 Härtung (unten).
- `copy_rotation(source, new_id)` – der Client vergibt die UUID; die Kopie ist privat.
- Synchronisiert werden Rotationen, Keybinds, Action Bars **und** Settings + Loadouts + Enemy (`setups`); Sessions
  werden als Zusammenfassung hochgeladen, lokal bleiben die neuesten 50. Account löschen ist ausgeliefert
  (`delete_my_account`).
- Anon darf: `public_rotations` lesen, `display_name_taken`, `list_public_setups`, `get_public_setup` aufrufen,
  `feedback` und `client_errors` einfügen (seit 0010 gedrosselt). Sonst nichts – seit 0010 auch keine
  Tabellenrechte mehr auf sessions/setups/keybinds/action_bars.
- 0010: `profiles` nur eigene Zeile oder Staff lesbar, Anzeigenamen über die View `public_profiles`
  (`public_rotations` joint darauf); `client_errors.extra` ≤ 4 kB und max. 60 Inserts pro Fingerprint und Stunde;
  `feedback` max. 20 pro User-Agent und Stunde; `admin_set_role` meldet unbekannte User; `keybinds.updated_at`
  ist Serverzeit (Trigger); `admin_*` nur für angemeldete User ausführbar.
- Offen: `setups.is_public` ist weiterhin default **true** (Setup wird beim ersten Login ohne Nachfrage
  veröffentlicht) – Produktentscheidung steht aus. Keybind-Merge: Server gewinnt immer (kein "neueres updated_at
  gewinnt" wie in §4 geplant).
