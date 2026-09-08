#!/usr/bin/env python3
"""
How often the PvME setups use each item, weapon pair and Essence of Finality special – the numbers behind the
Loadout page's catalog order and its "hide obscure equipment" threshold (src/app/core/obscure.ts USAGE_THRESHOLD).

    python tools/usage-stats.py        # public/data/presets.json + tools/guide-seed.json -> public/data/usage.json

Counts:
  items      "<kind>:<id>" -> number of PvME presets that wear or carry the item (presets.json equipment + inventory)
  pairs      "<main>|<off>" -> number of presets wielding that main-hand / off-hand pair
  eofSpecs   spec id -> number of PvME setups that store it in an Essence of Finality (guide-seed.json loadouts,
             where tools/guide-seed-dump.js already assigned the "X eofspec" specials of the rotations to amulets)
  specSteps  spec id -> number of "spec" steps over all PvME rotations (guide-seed.json)
The seed is optional: without it only `items` and `pairs` are written.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRESETS = ROOT / "public" / "data" / "presets.json"
SEED = ROOT / "tools" / "guide-seed.json"
WEAPONS = ROOT / "public" / "data" / "weapons.json"
OUT = ROOT / "public" / "data" / "usage.json"


def main() -> None:
    presets = json.loads(PRESETS.read_text(encoding="utf-8"))
    weapons = {w["id"]: w for w in json.loads(WEAPONS.read_text(encoding="utf-8"))}
    items: Counter[str] = Counter()
    pairs: Counter[str] = Counter()
    for p in presets:
        refs = [r for r in p["equipment"].values() if r] + [r for r in p["inventory"] if r]
        seen = set()
        for r in refs:
            key = r["kind"] + ":" + r["id"]
            if key in seen:
                continue
            seen.add(key)
            items[key] += 1
        eq = p["equipment"]
        m, o = eq.get("mainHand"), eq.get("offHand")
        if m and o and weapons.get(m["id"], {}).get("slot") != "2h":
            pairs[m["id"] + "|" + o["id"]] += 1

    eof: Counter[str] = Counter()
    spec_steps: Counter[str] = Counter()
    if SEED.exists():
        for s in json.loads(SEED.read_text(encoding="utf-8")):
            l = s["loadout"]
            refs = [r for r in (l.get("equipment") or {}).values() if r] + [r for r in l.get("inventory") or [] if r]
            for r in refs:
                if r.get("kind") == "gear" and "essence-of-finality" in r["id"] and r.get("spec"):
                    eof[r["spec"]] += 1
            for rot in s["rotations"]:
                for st in rot["steps"]:
                    if st["kind"] == "spec":
                        spec_steps[st["id"]] += 1

    out = {
        "presets": len(presets),
        "items": dict(sorted(items.items(), key=lambda kv: (-kv[1], kv[0]))),
        "pairs": dict(sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0]))),
        "eofSpecs": dict(sorted(eof.items(), key=lambda kv: (-kv[1], kv[0]))),
        "specSteps": dict(sorted(spec_steps.items(), key=lambda kv: (-kv[1], kv[0]))),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{OUT}: {len(items)} items, {len(pairs)} pairs, {len(eof)} EoF specials, {len(spec_steps)} spec ids")


if __name__ == "__main__":
    main()
