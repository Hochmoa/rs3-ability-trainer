"""Build public/data/abilities.json + public/data/buffs.json and download ability / status icons.

Source: runescape.wiki buckets `infobox_ability` and `infobox_buff`, plus the wikitext of the
linked "(status)" pages for buff durations/effects. Removed abilities (Combat Style
Modernisation, 2 March 2026, and older) are dropped. Run:  python tools/fetch-abilities.py
"""
import re

from fetch_wiki import (ASSETS, DATA, bucket, download, file_of, image_urls, parse_percent,
                        parse_ticks, slug, strip_markup, wikitext, write_json)

# abilities that do not trigger / are not blocked by the global cooldown (runescape.wiki)
# verified list, docs/research/mechanics.md §8.2 – Anticipation and Freedom are normal GCD abilities
OFF_GCD = {"Surge", "Escape", "Dive", "Bladed Dive", "Provoke", "Limitless", "Runic Charge"}
# utility-type abilities worth having; the rest are shouts, stances, slayer buffs, food, ammo slots
UTILITY_KEEP = {"Surge", "Escape", "Dive", "Limitless", "Runic Charge"}
# Demoralise: the Ranged version was removed 2 March 2026, the Constitution version never went live
SKIP_NAMES = {"Revolution", "Single-Way Wilderness", "Magma Tempest (Targeted)", "Demoralise"}
STYLE = {"Attack": "Melee", "Strength": "Melee", "Melee": "Melee", "Ranged": "Ranged", "Magic": "Magic",
         "Necromancy": "Necromancy", "Defence": "Defence", "Constitution": "Constitution"}
TYPE_ORDER = {"Basic": 0, "Enhanced": 1, "Threshold": 2, "Ultimate": 3, "Special": 4, "Incantation": 5}
STYLE_ORDER = {"Melee": 0, "Ranged": 1, "Magic": 2, "Necromancy": 3, "Defence": 4, "Constitution": 5}


def parse_damage_range(desc: str) -> tuple[float | None, float | None, int | None]:
    """'25%-35% Melee damage per hit' + '8 hits' -> (25, 35, 8)."""
    m = re.search(r"(\d+(?:\.\d+)?)%?\s*[-–]\s*(\d+(?:\.\d+)?)%", desc)
    lo, hi = (float(m.group(1)), float(m.group(2))) if m else (None, None)
    h = re.search(r"(?:^|\n)\*?\s*(\d+)\s+hits?\b", desc) or re.search(r"Attack (\d+) times", desc)
    hits = int(h.group(1)) if h else (1 if lo is not None else None)
    return lo, hi, hits


def parse_duration_ticks(desc: str) -> int | None:
    m = re.search(r"(\d+(?:\.\d+)?)s \((\d+) (?:game )?ticks?\) duration", desc)
    return int(m.group(2)) if m else None


def main():
    rows = bucket("infobox_ability", ["name", "skill", "type", "level", "target", "json"])
    print(len(rows), "ability rows")
    abilities: dict[str, dict] = {}
    for r in rows:
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        typ = j.get("type") or r.get("type") or ""
        skill = j.get("skill") or r.get("skill") or ""
        if not name or name in SKIP_NAMES or skill not in STYLE or name in abilities:
            continue
        if j.get("removal"):
            continue
        desc = strip_markup(j.get("description"))
        during_gcd = bool(re.search(r"during the global cooldown", desc, re.I))
        if typ == "Utility" and name not in UTILITY_KEEP and not during_gcd:
            continue
        lo, hi, hits = parse_damage_range(desc)
        icon_file = file_of(j.get("image")) or (name + ".png")
        abilities[name] = {
            "id": slug(name),
            "structId": int(j["id"]) if str(j.get("id", "")).isdigit() else None,
            "name": name,
            "style": STYLE[skill],
            "type": typ if typ != "Utility" else "Basic",
            "level": int(j.get("level") or 0),
            "target": j.get("target") or "Single",
            "equipment": strip_markup(j.get("equipment")) or "Any",
            "members": j.get("members") == "Yes",
            "basicAttack": bool(j.get("basic_attack")),
            "adrenaline": parse_percent(j.get("adrenaline")),
            "cooldownTicks": parse_ticks(strip_markup(j.get("cooldown"))),
            "damageAvg": parse_percent(j.get("damage")),
            "damageText": strip_markup(j.get("damage")),
            "damageMin": lo,
            "damageMax": hi,
            "hits": hits,
            "channelled": bool(re.search(r"(?m)^\*?\s*Channell?ed\.?$", desc)),
            "durationTicks": parse_duration_ticks(desc),
            "description": desc,
            "buffs": [b["id"] for b in j.get("buffs", []) if isinstance(b, dict) and "id" in b],
            "icon": "assets/abilities/" + slug(name) + ".png",
            "_iconFile": icon_file,
            "triggersGcd": name not in OFF_GCD and not during_gcd,
        }

    # Necromancy incantations (Split Soul, Invoke Death, Threads of Fate, ...) are cast like abilities
    for r in bucket("infobox_incantation", ["name", "json"]):
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        if not name or name in abilities or "Teleport" in name or j.get("removal"):
            continue
        desc = strip_markup(j.get("description"))
        cd = j.get("cooldown")
        dur = j.get("duration")
        abilities[name] = {
            "id": slug(name), "structId": None, "name": name, "style": "Necromancy", "type": "Incantation",
            "level": int(j.get("level") or 0), "target": j.get("target") or "Self", "equipment": "Any",
            "members": True, "basicAttack": False, "adrenaline": 0.0,
            "cooldownTicks": int(cd) if str(cd).isdigit() else parse_ticks(strip_markup(str(cd))) if cd else None,
            "damageAvg": None, "damageText": "", "damageMin": None, "damageMax": None, "hits": None, "channelled": False,
            "durationTicks": int(dur) if str(dur).isdigit() else None,
            "description": desc, "buffs": [], "icon": "assets/abilities/" + slug(name) + ".png",
            "_iconFile": file_of(j.get("image")) or (name + " icon.png"), "triggersGcd": True,
        }

    # ---- buffs / debuffs linked from abilities
    buff_rows = bucket("infobox_buff", ["id", "json"])
    print(len(buff_rows), "buff rows")
    wanted = {bid for a in abilities.values() for bid in a["buffs"]}
    specs_file = DATA / "specs.json"
    if specs_file.exists():  # status effects of weapon special attacks share buffs.json
        import json as _json
        for sp in _json.loads(specs_file.read_text(encoding="utf-8")):
            wanted.update(b["id"] for b in sp.get("buffs", []) if b.get("id", -1) >= 0)
    buffs: dict[int, dict] = {}
    for r in buff_rows:
        j = r["json"]
        bid = r.get("id")
        if bid not in wanted or j.get("removal"):
            continue
        version = j.get("version") or j.get("displayedon") or "Self"
        b = buffs.setdefault(bid, {"id": bid, "name": j.get("name"), "kind": j.get("buffordebuff") or "Buff",
                                   "category": j.get("cat"), "desc": strip_markup(j.get("desc")),
                                   "iconSelf": None, "iconTarget": None, "_files": {}})
        f = file_of(j.get("image"))
        if f:
            key = "iconTarget" if version == "Target" else "iconSelf"
            b["_files"][key] = f
            b[key] = "assets/status/" + slug(f[:-4]) + ".png"
        if version == "Self" or not b["desc"]:
            b["desc"] = strip_markup(j.get("desc")) or b["desc"]
            b["kind"] = j.get("buffordebuff") or b["kind"]
    print(len(buffs), "buffs used by abilities")

    # duration / effects from the "(status)" pages
    pagenames = {}
    for r in rows:
        for b in r["json"].get("buffs", []):
            if isinstance(b, dict) and b.get("id") in buffs:
                pagenames[b["id"]] = b["pagename"]
    if specs_file.exists():
        for sp in _json.loads(specs_file.read_text(encoding="utf-8")):
            for b in sp.get("buffs", []):
                if b.get("id") in buffs:
                    pagenames.setdefault(b["id"], b["pagename"])
    texts = wikitext(sorted(set(pagenames.values())))
    for bid, page in pagenames.items():
        t = texts.get(page, "")
        m = re.search(r"\{\{Infobox Buff details(.*?)\n\}\}", t, re.S)
        if not m:
            continue
        params = dict(re.findall(r"\|\s*(\w+)\s*=\s*(.*?)(?=\n\||\Z)", m.group(1), re.S))
        buffs[bid]["duration"] = strip_markup(params.get("duration"))
        buffs[bid]["durationTicks"] = parse_ticks(strip_markup(params.get("duration")))
        buffs[bid]["trigger"] = strip_markup(params.get("trigger"))
        buffs[bid]["effects"] = strip_markup(params.get("effects"))

    # ---- icons
    files = [a["_iconFile"] for a in abilities.values()]
    files += [f for b in buffs.values() for f in b["_files"].values()]
    urls = image_urls(files)
    missing = []
    for a in abilities.values():
        url = urls.get(a["_iconFile"])
        if url:
            download(url, ASSETS / "abilities" / (a["id"] + ".png"))
        else:
            missing.append(a["name"])
        del a["_iconFile"]
    for b in buffs.values():
        for key, f in b["_files"].items():
            url = urls.get(f)
            if url:
                download(url, ASSETS / "status" / (slug(f[:-4]) + ".png"))
            else:
                b[key] = None
        del b["_files"]
    if missing:
        print("no icon for:", ", ".join(missing))

    out = sorted(abilities.values(), key=lambda a: (STYLE_ORDER[a["style"]], TYPE_ORDER.get(a["type"], 9), a["level"], a["name"]))
    write_json(DATA / "abilities.json", out)
    write_json(DATA / "buffs.json", sorted(buffs.values(), key=lambda b: b["name"] or ""))
    print(len(out), "abilities ->", DATA / "abilities.json")


if __name__ == "__main__":
    main()
