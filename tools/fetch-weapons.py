"""Build public/data/weapons.json: every weapon, shield and defender a player can fight with, with icons.

Source: runescape.wiki bucket `infobox_bonuses` (see docs/research/weapons-data.md §4 for the filter).
Run after fetch-specs.py (links weapons to their special attack).  python tools/fetch-weapons.py
"""
import json
import re

from fetch_wiki import ASSETS, DATA, bucket_all, category_members, download, image_urls, slug, write_json

FIELDS = ["page_name", "page_name_sub", "combat_class", "equipment_slot", "equipment_type", "weapon_damage",
          "weapon_accuracy", "attack_style", "attack_range", "equipment_armour", "equipment_life_points",
          "weapon_attack_speed", "equipment_tier", "degradation_charges", "json"]
STYLE = {"melee": "Melee", "ranged": "Ranged", "magic": "Magic", "necromancy": "Necromancy"}
SLOT = {"main hand weapon": "main", "off-hand weapon": "off", "2h weapon": "2h"}
DYE = re.compile(r" \((blood|ice|shadow|Barrows|Third Age|Soulflame|or|Soul|broken|used)\)$")
SUB_RANK = {"": 0, "new": 0, "Normal": 0, "unbound": 1, "usable": 1, "charged": 2, "Innate Mastery": 3}
SPEED = {"fastest": 4, "fast": 5, "average": 6, "slowest": 12}


def speed_of(v) -> int | None:
    if v is None or v == "no":
        return None
    v = str(v)
    if v.isdigit():
        return int(v)
    return SPEED.get(v)


def main():
    rows = bucket_all("infobox_bonuses", FIELDS)
    print(len(rows), "equipment rows")
    removed = set(r["page_name"] for r in bucket_all("removal_date", ["page_name"]))
    dungeoneering = set(category_members("Dungeoneering items"))
    specs = json.loads((DATA / "specs.json").read_text(encoding="utf-8")) if (DATA / "specs.json").exists() else []
    spec_of = {w: s["id"] for s in specs for w in s["weapons"]}

    best: dict[str, dict] = {}
    for r in rows:
        page = r.get("page_name") or ""
        cls = STYLE.get(r.get("combat_class") or "")
        slot_raw = r.get("equipment_slot") or ""
        etype = r.get("equipment_type") or ""
        if not page or not cls or page.startswith("Augmented ") or DYE.search(page):
            continue
        if page in removed or page in dungeoneering:
            continue
        if slot_raw in SLOT:
            slot = SLOT[slot_raw]
        elif slot_raw == "off-hand" and etype == "Shield":
            slot = "shield"
        else:
            continue
        tier = int(r.get("equipment_tier") or 0)
        if tier < 1:
            continue
        sub = (r.get("page_name_sub") or page).split("#", 1)
        version = sub[1] if len(sub) > 1 else ""
        rank = SUB_RANK.get(version, 5)
        cur = best.get(page)
        if cur is None or rank < cur["_rank"]:
            j = r.get("json") or {}
            best[page] = {
                "id": slug(page),
                "name": page,
                "style": cls,
                "slot": slot,
                "type": etype or None,
                "tier": tier,
                "tierDamage": int(j.get("tier_damage") or tier),
                "tierAccuracy": int(j.get("tier_accuracy") or tier),
                "speed": speed_of(r.get("weapon_attack_speed")),
                "attackStyle": r.get("attack_style"),
                "range": int(r.get("attack_range") or 0) or None,
                "damage": float(r.get("weapon_damage") or 0),
                "accuracy": float(r.get("weapon_accuracy") or 0),
                "abilityDamage": float(str(j.get("ability_damage") or 0).replace(",", "")) if str(j.get("ability_damage") or "0").replace(",", "").replace(".", "").isdigit() else None,
                "armour": float(r.get("equipment_armour") or 0),
                "lifePoints": int(r.get("equipment_life_points") or 0),
                "charges": r.get("degradation_charges") or None,
                "spec": spec_of.get(page),
                "innateMastery": False,
                "icon": "assets/weapons/" + slug(page) + ".png",
                "_rank": rank,
            }
        if version == "Innate Mastery" and page in best:
            best[page]["innateMastery"] = True

    for w in best.values():
        del w["_rank"]
        if w["style"] == "Necromancy":
            w["role"] = "siphon" if w["slot"] == "main" else ("conduit" if w["slot"] == "off" else None)
        elif w["slot"] == "shield":
            w["role"] = "shield"
        elif w["type"] in ("Defender", "Rebounder", "Repriser"):
            w["role"] = "defender"
        else:
            w["role"] = None

    files = {w["name"] + ".png": w for w in best.values()}
    urls = image_urls(list(files.keys()))
    missing = 0
    for f, w in files.items():
        url = urls.get(f)
        if url:
            download(url, ASSETS / "weapons" / (w["id"] + ".png"))
        else:
            w["icon"] = None
            missing += 1
    out = sorted(best.values(), key=lambda w: (w["style"], w["slot"], -w["tier"], w["name"]))
    write_json(DATA / "weapons.json", out)
    from collections import Counter
    print(len(out), "weapons ->", DATA / "weapons.json", "| missing icons:", missing)
    print(Counter((w["style"], w["slot"]) for w in out))


if __name__ == "__main__":
    main()
