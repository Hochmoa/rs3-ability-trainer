#!/usr/bin/env python3
"""
Turns the guide-content dump (tools/guide-seed.json, made by tools/guide-seed-dump.js) into a Supabase migration
that seeds the PVME guide account (0012_guide_accounts.sql ensure_guide_account, 0018_setups.sql tables) with every
PvME setup: one setups row per preset (loadout inside) and its rotations.

    python tools/guide-seed-to-sql.py                       # tools/guide-seed.json -> supabase/migrations/<next>_guide_content.sql
    python tools/guide-seed-to-sql.py --number 0019         # explicit migration number
    python tools/guide-seed-to-sql.py --in dump.json --out /tmp/x.sql
    python tools/guide-seed-to-sql.py --selftest            # no files touched

Input shape (one entry per setup):

    [
      {
        "id": "<uuid>", "boss": "Nex", "name": "solo ranged", "style": "Ranged", "presetId": "nex-ranged",
        "loadout": Loadout,                       # src/app/core/models.ts Loadout as the app stores it (id + name required)
        "rotations": [
          { "id": "<uuid>", "name": "Blood Phase", "steps": [RotationStep, ...], "position": 0 },
          ...
        ]
      },
      ...
    ]

Output, in this order:

    select public.ensure_guide_account('PVME');
    insert into public.setups (id, owner_id, boss, name, style, loadout, is_public, preset_id) values (...)
      on conflict (id) do update set boss = ..., name = ..., style = ..., loadout = ..., is_public = true, preset_id = ...;
    delete from public.setups where owner_id = public.guide_id('PVME') and id not in (...);
    insert into public.rotations (id, owner_id, setup_id, name, steps, position) values (...)
      on conflict (id) do update set setup_id = ..., name = ..., steps = ..., position = ...;
    delete from public.rotations where owner_id = public.guide_id('PVME') and id not in (...);

Every statement is an upsert keyed by the deterministic ids, so the generated migration – and a regenerated one with
the same numbers – can be applied again without duplicates. Setups and rotations that disappeared from the dump are
deleted from the account (a deleted setup takes its rotations with it).

Validation mirrors the database constraints (0018_setups.sql, rotation_steps_valid after 0008): boss ≤ 60, name 1-60,
style ≤ 40, 1-200 steps, every step an object with kind + id of an allowed kind. A violation stops the run with the
offending setup / rotation named – nothing is written half-way.
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

ACCOUNT = "PVME"

# public.rotation_steps_valid() after 0008_spell_steps.sql
STEP_KINDS = {"ability", "prayer", "special", "weapon", "spec", "action", "spell", "note"}
# optional RotationStep fields the app keeps (migrations.ts cleanStep); everything else is dropped
STEP_EXTRAS = ("note", "phase", "sameTick", "offsetTicks", "hint", "cancelAfterTicks", "afterHits", "stall", "release", "requiresAction", "actionTicks")

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


def clean_rotation(r, where_setup: str, position: int) -> dict:
    where = f'{where_setup}, rotation {r.get("id") if isinstance(r, dict) else r!r}'
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
    pos = r.get("position", position)
    if not isinstance(pos, int) or not 0 <= pos <= 999:
        raise SeedError(f"{where}: position must be 0-999")
    return {"id": rid.lower(), "name": name, "steps": [clean_step(s, f"{where}, step {i + 1}") for i, s in enumerate(steps)], "position": pos}


def clean_setup(s) -> dict:
    if not isinstance(s, dict):
        raise SeedError(f"setup entry is not an object: {s!r}")
    sid = s.get("id")
    if not isinstance(sid, str) or not UUID_RE.match(sid):
        raise SeedError(f"setup {sid!r}: id must be a uuid")
    where = f"setup {sid}"
    boss = s.get("boss") or ""
    if not isinstance(boss, str) or len(boss) > 60:
        raise SeedError(f"{where}: boss must be a string of at most 60 chars")
    name = s.get("name")
    if not isinstance(name, str) or not 1 <= len(name) <= 60:
        raise SeedError(f"{where}: name must be 1-60 chars: {name!r}")
    style = s.get("style") or ""
    if not isinstance(style, str) or len(style) > 40:
        raise SeedError(f"{where}: style must be a string of at most 40 chars")
    preset = s.get("presetId")
    if preset is not None and (not isinstance(preset, str) or not 1 <= len(preset) <= 80):
        raise SeedError(f"{where}: presetId must be 1-80 chars")
    loadout = s.get("loadout")
    if not isinstance(loadout, dict) or not isinstance(loadout.get("id"), str) or not loadout["id"] or not isinstance(loadout.get("name"), str):
        raise SeedError(f"{where}: loadout needs a string id and name")
    rotations = [clean_rotation(r, where, i) for i, r in enumerate(s.get("rotations") or [])]
    rids = [r["id"] for r in rotations]
    if len(set(rids)) != len(rids):
        raise SeedError(f"{where}: duplicate rotation ids")
    return {"id": sid.lower(), "boss": boss, "name": name, "style": style, "presetId": preset, "loadout": loadout, "rotations": rotations}


def clean_seed(seed) -> list[dict]:
    if not isinstance(seed, list):
        raise SeedError("the seed must be a list of setups")
    setups = [clean_setup(s) for s in seed]
    ids = [s["id"] for s in setups]
    if len(set(ids)) != len(ids):
        raise SeedError("duplicate setup ids")
    lids = [s["loadout"]["id"] for s in setups]
    if len(set(lids)) != len(lids):
        raise SeedError("duplicate loadout ids")
    all_rids = [r["id"] for s in setups for r in s["rotations"]]
    if len(set(all_rids)) != len(all_rids):
        raise SeedError("a rotation id appears under two setups")
    return setups


# ---------------------------------------------------------------- generation

def render(setups: list[dict], source: str) -> str:
    guide = f"public.guide_id({sql_text(ACCOUNT)})"
    out = [
        f"-- Guide content: every PvME setup (loadout + rotations) under the guide account {ACCOUNT} (0012 ensure_guide_account, 0018 setups).",
        f"-- Generated by tools/guide-seed-to-sql.py from {source} – do not edit, regenerate.",
        "-- Every statement is an upsert on a deterministic id, so applying this again is harmless.",
        "",
        f"select public.ensure_guide_account({sql_text(ACCOUNT)});",
        "",
    ]
    for s in setups:
        out.append(f"-- ---------------------------------------------------------------- {s['boss']} – {s['name']}")
        out.append(
            "insert into public.setups (id, owner_id, boss, name, style, loadout, is_public, preset_id) values\n"
            f"  ({sql_text(s['id'])}, {guide}, {sql_text(s['boss'])}, {sql_text(s['name'])}, {sql_text(s['style'])}, "
            f"{sql_json(s['loadout'])}, true, {sql_text(s['presetId']) if s['presetId'] else 'null'})\n"
            "  on conflict (id) do update set boss = excluded.boss, name = excluded.name, style = excluded.style, "
            "loadout = excluded.loadout, is_public = true, preset_id = excluded.preset_id;"
        )
        for r in s["rotations"]:
            out.append(
                "insert into public.rotations (id, owner_id, setup_id, name, steps, position) values\n"
                f"  ({sql_text(r['id'])}, {guide}, {sql_text(s['id'])}, {sql_text(r['name'])}, {sql_json(r['steps'])}, {r['position']})\n"
                "  on conflict (id) do update set setup_id = excluded.setup_id, name = excluded.name, steps = excluded.steps, position = excluded.position;"
            )
        out.append("")
    # what left the dump goes, so the guide account never shows stale content
    sids = ", ".join(sql_text(s["id"]) for s in setups)
    rids = ", ".join(sql_text(r["id"]) for s in setups for r in s["rotations"])
    out.append(f"delete from public.rotations where owner_id = {guide}" + (f" and id not in ({rids});" if rids else ";"))
    out.append(f"delete from public.setups where owner_id = {guide}" + (f" and id not in ({sids});" if sids else ";"))
    out.append("")
    return "\n".join(out)


def next_number() -> str:
    numbers = [int(p.name[:4]) for p in MIGRATIONS.glob("[0-9][0-9][0-9][0-9]_*.sql")]
    return f"{(max(numbers) + 1) if numbers else 1:04d}"


def convert(src: Path, dest: Path) -> tuple[int, int]:
    seed = json.loads(src.read_text(encoding="utf-8"))
    setups = clean_seed(seed)
    sql = render(setups, src.name)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(sql, encoding="utf-8", newline="\n")
    return len(setups), sum(len(s["rotations"]) for s in setups)


# ---------------------------------------------------------------- self-test

def selftest() -> None:
    seed = [
        {
            "id": "8D2A6C8E-1B2C-4D3E-9F40-0123456789AB",
            "boss": "Vorkath",
            "name": "it's a 'test'",
            "style": "Necromancy",
            "presetId": "vorkath-necro",
            "loadout": {"id": "l1", "name": "Necro", "prayerBook": "Curses"},
            "rotations": [
                {
                    "id": "8D2A6C8E-1B2C-4D3E-9F40-0123456789AC",
                    "name": "full kill",
                    "steps": [
                        {"kind": "ability", "id": "death-skulls", "sameTick": False, "hint": "/ alt"},
                        {"kind": "note", "id": "", "note": "Phase 2 $json$ nested", "phase": True, "requiresAction": True, "actionTicks": 4},
                        {"kind": "spell", "id": "vengeance", "offsetTicks": 2, "junk": 1},
                    ],
                    "position": 3,
                }
            ],
        },
        {"id": "8d2a6c8e-1b2c-4d3e-9f40-0123456789ad", "boss": "", "name": "General", "style": "", "loadout": {"id": "l2", "name": "x"}, "rotations": []},
    ]
    sql = render(clean_seed(seed), "selftest")

    assert "select public.ensure_guide_account('PVME');" in sql
    assert "('8d2a6c8e-1b2c-4d3e-9f40-0123456789ab', public.guide_id('PVME'), 'Vorkath', 'it''s a ''test''', 'Necromancy'," in sql
    assert "true, 'vorkath-necro')" in sql and "true, null)" in sql
    assert "('8d2a6c8e-1b2c-4d3e-9f40-0123456789ac', public.guide_id('PVME'), '8d2a6c8e-1b2c-4d3e-9f40-0123456789ab', 'full kill'," in sql
    assert ", 3)\n  on conflict (id) do update set setup_id = excluded.setup_id" in sql
    assert "delete from public.setups where owner_id = public.guide_id('PVME') and id not in ('8d2a6c8e-1b2c-4d3e-9f40-0123456789ab', '8d2a6c8e-1b2c-4d3e-9f40-0123456789ad');" in sql
    # the JSON containing "$json$" switched to another tag; sameTick=false, the "/"-hint and unknown keys are dropped
    steps_literal = re.search(r"\$json1\$(\[.*?\])\$json1\$::jsonb", sql)
    assert steps_literal, "steps need the alternative dollar tag"
    steps = json.loads(steps_literal.group(1))
    assert steps[0] == {"kind": "ability", "id": "death-skulls"}
    assert steps[1] == {"kind": "note", "id": "", "note": "Phase 2 $json$ nested", "phase": True, "requiresAction": True, "actionTicks": 4}
    assert steps[2] == {"kind": "spell", "id": "vengeance", "offsetTicks": 2}
    loadout_literal = re.search(r"\$json\$(\{\"id\":\"l1\".*?\})\$json\$::jsonb", sql)
    assert loadout_literal and json.loads(loadout_literal.group(1))["prayerBook"] == "Curses"

    def rejects(bad, fragment: str) -> None:
        try:
            clean_seed(bad)
        except SeedError as e:
            assert fragment in str(e), f"expected {fragment!r} in {e}"
        else:
            raise AssertionError(f"accepted invalid seed: {fragment}")

    s0 = seed[0]
    rot = s0["rotations"][0]
    rejects([{**s0, "id": "nope"}], "id must be a uuid")
    rejects([{**s0, "name": "x" * 61}], "1-60 chars")
    rejects([{**s0, "loadout": {"name": "x"}}], "loadout needs")
    rejects([{**s0, "rotations": [{**rot, "id": "nope"}]}], "must be a uuid")
    rejects([{**s0, "rotations": [{**rot, "steps": []}]}], "1-200 steps")
    rejects([{**s0, "rotations": [{**rot, "steps": [{"kind": "potion", "id": "x"}]}]}], "unknown step kind")
    rejects([{**s0, "rotations": [{**rot, "steps": [{"kind": "ability"}]}]}], "id must be a string")
    rejects([{**s0, "rotations": [rot, rot]}], "duplicate rotation ids")
    rejects([s0, s0], "duplicate setup ids")
    rejects([s0, {**seed[1], "loadout": {"id": "l1", "name": "y"}}], "duplicate loadout ids")
    print("selftest ok")


# ---------------------------------------------------------------- main

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--in", dest="src", default=str(DEFAULT_IN), help="dump file (default tools/guide-seed.json)")
    ap.add_argument("--out", dest="dest", help="migration file (default supabase/migrations/<number>_guide_content.sql)")
    ap.add_argument("--number", help="migration number, e.g. 0019 (default: the next free one)")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args(argv)
    if args.selftest:
        selftest()
        return 0
    src = Path(args.src)
    dest = Path(args.dest) if args.dest else MIGRATIONS / f"{args.number or next_number()}_guide_content.sql"
    try:
        setups, rotations = convert(src, dest)
    except SeedError as e:
        print(f"seed rejected: {e}", file=sys.stderr)
        return 1
    print(f"{dest}: {setups} setups, {rotations} rotations")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
