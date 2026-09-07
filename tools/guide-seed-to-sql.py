#!/usr/bin/env python3
"""
Turns a guide-content dump (tools/guide-seed.json) into a Supabase migration that seeds the guide accounts
(supabase/migrations/0012_guide_accounts.sql) with their PvME rotations and loadouts.

    python tools/guide-seed-to-sql.py                       # tools/guide-seed.json -> supabase/migrations/<next>_guide_content.sql
    python tools/guide-seed-to-sql.py --number 0013         # explicit migration number
    python tools/guide-seed-to-sql.py --in dump.json --out /tmp/x.sql
    python tools/guide-seed-to-sql.py --selftest            # no files touched

Input shape (one entry per guide account, the display name is the boss):

    [
      {
        "name": "Vorkath",                       # 3-20 chars, [A-Za-z0-9 _-] (profiles.display_name check)
        "loadouts": [Loadout, ...],              # src/app/core/models.ts Loadout, as the app stores it (id + name required)
        "rotations": [
          { "id": "<uuid>", "name": "Vorkath – full kill", "steps": [RotationStep, ...],
            "styles": ["Necromancy"], "updatedAt": 1757203200000 },
          ...
        ]
      },
      ...
    ]

Output (per account, in this order):

    select public.ensure_guide_account('Vorkath');
    insert into public.rotations (id, owner_id, name, steps, styles, is_public, created_at, updated_at) values (...)
      on conflict (id) do update set name = ..., steps = ..., styles = ..., is_public = true, updated_at = ...;
    insert into public.setups (user_id, settings, loadouts, enemy, is_public) values (public.guide_id('Vorkath'), ...)
      on conflict (user_id) do update set loadouts = ..., settings = ..., is_public = true;

Every statement is an upsert keyed by the deterministic ids (rotation id from the dump, account id from the name), so
the generated migration – and a regenerated one with the same numbers – can be applied again without duplicates.
Rotations that disappeared from the dump are deleted from the account; an account without loadouts gets
its setups row removed so it is not listed with an empty setup.
On a re-run the rotations' updated_at becomes server time (the rotations_protect_counters trigger sets it on every
update) and copies / owner_id stay as they are.

The settings of a guide setup are the app defaults (DEFAULT_SETTINGS in src/app/core/models.ts). They are mirrored as
JSON between the DEFAULT_SETTINGS markers below; src/app/core/guide-seed.spec.ts fails when models.ts and this copy
drift apart.

Validation mirrors the database constraints (0001_init.sql, 0008_spell_steps.sql, 0007_setups.sql): rotation names
1-60 chars, 1-200 steps, every step an object with kind + id, kind one of the allowed ones, styles from the app's list.
A violation stops the run with the offending account / rotation named – nothing is written half-way.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN = ROOT / "tools" / "guide-seed.json"
MIGRATIONS = ROOT / "supabase" / "migrations"

# DEFAULT_SETTINGS_JSON_BEGIN – keep in sync with DEFAULT_SETTINGS in src/app/core/models.ts (guide-seed.spec.ts checks)
DEFAULT_SETTINGS_JSON = """
{
  "pingMs": 60,
  "jitterMs": 20,
  "abilityQueueing": true,
  "autoAttacks": true,
  "loop": false,
  "fullAdrenaline": false,
  "rechargeAdrenaline": false,
  "hideObscureEquipment": true,
  "hideObscureAbilities": true,
  "hitDelayTicks": 2,
  "boneShield": "greater",
  "combatMode": "manual",
  "revolution": { "slots": 9, "basics": true, "enhanced": true, "thresholds": false, "ultimates": false },
  "hitChance": "scaled",
  "uiMode": "simple",
  "coach": { "callouts": false, "lead": false, "metronome": false, "volume": 80, "leadMs": 250, "voice": "" }
}
"""
# DEFAULT_SETTINGS_JSON_END

# public.rotation_steps_valid() after 0008_spell_steps.sql
STEP_KINDS = {"ability", "prayer", "special", "weapon", "spec", "action", "spell", "note"}
# STYLES in src/app/core/models.ts
STYLES = {"Melee", "Ranged", "Magic", "Necromancy", "Defence", "Constitution"}
# optional RotationStep fields the app keeps (migrations.ts cleanStep); everything else is dropped
STEP_EXTRAS = ("note", "phase", "sameTick", "offsetTicks", "hint", "cancelAfterTicks", "afterHits")

DISPLAY_NAME_RE = re.compile(r"^[A-Za-z0-9 _-]{3,20}$")
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


class SeedError(ValueError):
    pass


# ---------------------------------------------------------------- SQL helpers

def sql_text(s: str) -> str:
    """single-quoted SQL literal"""
    return "'" + s.replace("'", "''") + "'"


def sql_json(value) -> str:
    """dollar-quoted jsonb literal; the tag is changed when the JSON happens to contain it"""
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    tag = "$json$"
    n = 0
    while tag in text:
        n += 1
        tag = f"$json{n}$"
    return f"{tag}{text}{tag}::jsonb"


def sql_text_array(values: list[str]) -> str:
    return "array[" + ", ".join(sql_text(v) for v in values) + "]::text[]" if values else "'{}'::text[]"


def sql_timestamp(ms) -> str:
    return f"to_timestamp({int(ms)} / 1000.0)"


# ---------------------------------------------------------------- validation

def clean_step(step, where: str) -> dict:
    if not isinstance(step, dict):
        raise SeedError(f"{where}: step is not an object: {step!r}")
    kind, sid = step.get("kind"), step.get("id")
    if kind not in STEP_KINDS:
        raise SeedError(f"{where}: unknown step kind {kind!r} (allowed: {sorted(STEP_KINDS)})")
    if not isinstance(sid, str):
        raise SeedError(f"{where}: step id must be a string (kind {kind}): {sid!r}")
    out = {"kind": kind, "id": sid}
    for key in STEP_EXTRAS:
        v = step.get(key)
        if v is None or v is False:
            continue
        if key == "hint" and isinstance(v, str) and v.startswith("/"):
            continue  # "/ fingerofdeath": an either-or alternative from older imports, not a hint
        out[key] = v
    return out


def clean_rotation(r, account: str) -> dict:
    where = f'account "{account}", rotation {r.get("id") if isinstance(r, dict) else r!r}'
    if not isinstance(r, dict):
        raise SeedError(f"{where}: not an object")
    rid = r.get("id")
    if not isinstance(rid, str) or not UUID_RE.match(rid):
        raise SeedError(f"{where}: id must be a uuid")
    name = r.get("name")
    if not isinstance(name, str) or not 1 <= len(name) <= 60:
        raise SeedError(f"{where}: name must be 1-60 chars: {name!r}")
    steps = r.get("steps")
    if not isinstance(steps, list) or not 1 <= len(steps) <= 200:
        raise SeedError(f"{where}: needs 1-200 steps, has {len(steps) if isinstance(steps, list) else 'none'}")
    styles = r.get("styles") or []
    unknown = [s for s in styles if s not in STYLES]
    if unknown:
        raise SeedError(f"{where}: unknown styles {unknown} (allowed: {sorted(STYLES)})")
    updated = r.get("updatedAt")
    if not isinstance(updated, (int, float)) or updated <= 0:
        raise SeedError(f"{where}: updatedAt must be a positive epoch-ms number")
    return {
        "id": rid.lower(),
        "name": name,
        "steps": [clean_step(s, f"{where}, step {i + 1}") for i, s in enumerate(steps)],
        "styles": list(dict.fromkeys(styles)),
        "updatedAt": int(updated),
    }


def clean_account(a) -> dict:
    if not isinstance(a, dict):
        raise SeedError(f"account entry is not an object: {a!r}")
    name = a.get("name")
    if not isinstance(name, str) or not DISPLAY_NAME_RE.match(name):
        raise SeedError(f"account name {name!r} is not a valid display name (3-20 chars, letters, digits, space, _ -)")
    loadouts = a.get("loadouts") or []
    if not isinstance(loadouts, list):
        raise SeedError(f'account "{name}": loadouts must be a list')
    for i, l in enumerate(loadouts):
        if not isinstance(l, dict) or not isinstance(l.get("id"), str) or not l["id"] or not isinstance(l.get("name"), str):
            raise SeedError(f'account "{name}": loadout {i + 1} needs a string id and name')
    ids = [l["id"] for l in loadouts]
    if len(set(ids)) != len(ids):
        raise SeedError(f'account "{name}": duplicate loadout ids')
    rotations = [clean_rotation(r, name) for r in (a.get("rotations") or [])]
    rids = [r["id"] for r in rotations]
    if len(set(rids)) != len(rids):
        raise SeedError(f'account "{name}": duplicate rotation ids')
    return {"name": name, "loadouts": loadouts, "rotations": rotations}


def clean_seed(seed) -> list[dict]:
    if not isinstance(seed, list):
        raise SeedError("the seed must be a list of accounts")
    accounts = [clean_account(a) for a in seed]
    names = [a["name"].lower() for a in accounts]
    if len(set(names)) != len(names):
        raise SeedError("duplicate account names (display names are case-insensitive)")
    all_rids = [r["id"] for a in accounts for r in a["rotations"]]
    if len(set(all_rids)) != len(all_rids):
        raise SeedError("a rotation id appears under two accounts")
    return accounts


# ---------------------------------------------------------------- generation

def render(accounts: list[dict], source: str) -> str:
    settings = json.loads(DEFAULT_SETTINGS_JSON)
    out = [
        "-- Guide content: PvME rotations and loadouts of the guide accounts (0012_guide_accounts.sql).",
        f"-- Generated by tools/guide-seed-to-sql.py from {source} – do not edit, regenerate.",
        "-- Every statement is an upsert on a deterministic id, so applying this again is harmless.",
        "",
    ]
    for a in accounts:
        name, guide = a["name"], f"public.guide_id({sql_text(a['name'])})"
        out.append(f"-- ---------------------------------------------------------------- {name}")
        out.append(f"select public.ensure_guide_account({sql_text(name)});")
        out.append("")
        for r in a["rotations"]:
            out.append(
                "insert into public.rotations (id, owner_id, name, steps, styles, is_public, created_at, updated_at) values\n"
                f"  ({sql_text(r['id'])}, {guide}, {sql_text(r['name'])}, {sql_json(r['steps'])}, "
                f"{sql_text_array(r['styles'])}, true, {sql_timestamp(r['updatedAt'])}, {sql_timestamp(r['updatedAt'])})\n"
                "  on conflict (id) do update set name = excluded.name, steps = excluded.steps, styles = excluded.styles, "
                "is_public = true, updated_at = excluded.updated_at;"
            )
        # rotations that left the dump (a re-import split or renamed them) go, so a guide account never shows stale content
        ids = ", ".join(sql_text(r["id"]) for r in a["rotations"])
        out.append(f"delete from public.rotations where owner_id = {guide}" + (f" and id not in ({ids});" if ids else ";"))
        out.append("")
        if a["loadouts"]:
            loadouts = {"loadouts": a["loadouts"], "active": a["loadouts"][0]["id"]}
            out.append(
                "insert into public.setups (user_id, settings, loadouts, enemy, is_public) values\n"
                f"  ({guide}, {sql_json(settings)}, {sql_json(loadouts)}, null, true)\n"
                "  on conflict (user_id) do update set loadouts = excluded.loadouts, settings = excluded.settings, is_public = true;"
            )
        else:
            out.append(f"delete from public.setups where user_id = {guide};")
        out.append("")
    return "\n".join(out)


def next_number() -> str:
    numbers = [int(p.name[:4]) for p in MIGRATIONS.glob("[0-9][0-9][0-9][0-9]_*.sql")]
    return f"{(max(numbers) + 1) if numbers else 1:04d}"


def convert(src: Path, dest: Path) -> tuple[int, int, int]:
    seed = json.loads(src.read_text(encoding="utf-8"))
    accounts = clean_seed(seed)
    sql = render(accounts, src.name)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(sql, encoding="utf-8", newline="\n")
    return len(accounts), sum(len(a["rotations"]) for a in accounts), sum(len(a["loadouts"]) for a in accounts)


# ---------------------------------------------------------------- self-test

def selftest() -> None:
    settings = json.loads(DEFAULT_SETTINGS_JSON)
    assert settings["combatMode"] == "manual" and settings["revolution"]["slots"] == 9

    seed = [
        {
            "name": "Vorkath",
            "loadouts": [{"id": "l1", "name": "Necro", "prayerBook": "Curses"}, {"id": "l2", "name": "Mage"}],
            "rotations": [
                {
                    "id": "8D2A6C8E-1B2C-4D3E-9F40-0123456789AB",
                    "name": "Vorkath – it's a 'test'",
                    "steps": [
                        {"kind": "ability", "id": "death-skulls", "sameTick": False, "hint": "/ alt"},
                        {"kind": "note", "id": "", "note": "Phase 2 $json$ nested", "phase": True},
                        {"kind": "spell", "id": "vengeance", "offsetTicks": 2, "junk": 1},
                    ],
                    "styles": ["Necromancy", "Magic", "Necromancy"],
                    "updatedAt": 1757203200000,
                }
            ],
        },
        {"name": "Angel of Death", "loadouts": [], "rotations": []},
    ]
    sql = render(clean_seed(seed), "selftest")

    assert "select public.ensure_guide_account('Vorkath');" in sql
    assert "select public.ensure_guide_account('Angel of Death');" in sql
    assert "'8d2a6c8e-1b2c-4d3e-9f40-0123456789ab', public.guide_id('Vorkath'), 'Vorkath – it''s a ''test'''" in sql
    assert "array['Necromancy', 'Magic']::text[]" in sql, "styles are deduplicated in order"
    assert "to_timestamp(1757203200000 / 1000.0)" in sql
    assert "on conflict (id) do update set name = excluded.name, steps = excluded.steps" in sql
    assert "on conflict (user_id) do update set loadouts = excluded.loadouts, settings = excluded.settings, is_public = true;" in sql
    assert "delete from public.setups where user_id = public.guide_id('Angel of Death');" in sql
    # the JSON containing "$json$" switched to another tag; sameTick=false, the "/"-hint and unknown keys are dropped
    steps_literal = re.search(r"\$json1\$(\[.*?\])\$json1\$::jsonb", sql)
    assert steps_literal, "steps need the alternative dollar tag"
    steps = json.loads(steps_literal.group(1))
    assert steps[0] == {"kind": "ability", "id": "death-skulls"}
    assert steps[1] == {"kind": "note", "id": "", "note": "Phase 2 $json$ nested", "phase": True}
    assert steps[2] == {"kind": "spell", "id": "vengeance", "offsetTicks": 2}
    loadouts_literal = re.search(r"\$json\$(\{\"loadouts\".*?\})\$json\$::jsonb", sql)
    assert loadouts_literal and json.loads(loadouts_literal.group(1))["active"] == "l1"
    settings_literal = re.search(r"\$json\$(\{\"pingMs\".*?\})\$json\$::jsonb", sql)
    assert settings_literal and json.loads(settings_literal.group(1)) == settings

    def rejects(bad, fragment: str) -> None:
        try:
            clean_seed(bad)
        except SeedError as e:
            assert fragment in str(e), f"expected {fragment!r} in {e}"
        else:
            raise AssertionError(f"accepted invalid seed: {fragment}")

    rot = seed[0]["rotations"][0]
    rejects([{"name": "Vo"}], "valid display name")
    rejects([{"name": "Vorkath!"}], "valid display name")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "id": "nope"}]}], "must be a uuid")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "name": "x" * 61}]}], "1-60 chars")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "steps": []}]}], "1-200 steps")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "steps": [{"kind": "potion", "id": "x"}]}]}], "unknown step kind")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "steps": [{"kind": "ability"}]}]}], "id must be a string")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "styles": ["Ranged", "Summoning"]}]}], "unknown styles")
    rejects([{"name": "Vorkath", "rotations": [{**rot, "updatedAt": 0}]}], "updatedAt")
    rejects([{"name": "Vorkath", "rotations": [rot, rot]}], "duplicate rotation ids")
    rejects([{"name": "Vorkath", "loadouts": [{"id": "a", "name": "x"}, {"id": "a", "name": "y"}]}], "duplicate loadout ids")
    rejects([{"name": "Vorkath"}, {"name": "vorkath"}], "duplicate account names")
    rejects([{"name": "Vorkath", "rotations": [rot]}, {"name": "Rasial", "rotations": [rot]}], "two accounts")
    print("selftest ok")


# ---------------------------------------------------------------- main

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("--in", dest="src", default=str(DEFAULT_IN), help="seed JSON (default tools/guide-seed.json)")
    ap.add_argument("--number", help="migration number, e.g. 0013 (default: next free one in supabase/migrations)")
    ap.add_argument("--out", help="output file (default supabase/migrations/<number>_guide_content.sql)")
    ap.add_argument("--selftest", action="store_true", help="run the built-in checks and exit")
    args = ap.parse_args(argv)

    if args.selftest:
        selftest()
        return 0

    src = Path(args.src)
    if not src.is_file():
        print(f"seed not found: {src}", file=sys.stderr)
        return 2
    number = args.number or next_number()
    if not re.fullmatch(r"\d{4}", number):
        print(f"--number must be four digits, got {number!r}", file=sys.stderr)
        return 2
    dest = Path(args.out) if args.out else MIGRATIONS / f"{number}_guide_content.sql"
    try:
        accounts, rotations, loadouts = convert(src, dest)
    except (SeedError, json.JSONDecodeError) as e:
        print(f"seed rejected: {e}", file=sys.stderr)
        return 1
    print(f"{dest}: {accounts} guide accounts, {rotations} rotations, {loadouts} loadouts")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
