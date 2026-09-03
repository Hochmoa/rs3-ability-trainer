"""Build public/data/specs.json (weapon special attacks) + public/data/gear.json (the weapons they belong to)
and download the weapon icons. Source: runescape.wiki bucket `infobox_weapon_special_attack`.
Run:  python tools/fetch-specs.py
"""
import re

from fetch_wiki import ASSETS, DATA, bucket, download, image_urls, parse_percent, parse_ticks, slug, strip_markup, write_json


def parse_damage_range(desc: str):
    m = re.search(r"(\d+(?:\.\d+)?)%?\s*[-–]\s*(\d+(?:\.\d+)?)%", desc)
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


def main():
    rows = bucket("infobox_weapon_special_attack", ["name", "json"])
    specs: dict[str, dict] = {}
    gear: dict[str, dict] = {}
    files: dict[str, str] = {}
    for r in rows:
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        if not name or j.get("removal") or name in specs:
            continue
        weapons = [w.strip() for w in re.findall(r"\[\[([^|\]]+)(?:\|[^\]]*)?\]\]", j.get("weapon") or "")]
        weapons = [w for w in weapons if not w.startswith("File:")]
        images = re.findall(r"\[\[File:([^|\]]+)", j.get("image") or "")
        desc = strip_markup(j.get("description"))
        lo, hi = parse_damage_range(desc)
        weapon_ids = []
        for i, w in enumerate(weapons):
            wid = slug(w)
            weapon_ids.append(wid)
            if wid not in gear:
                icon_file = images[i] if i < len(images) else (w + ".png")
                files[wid] = icon_file
                gear[wid] = {"id": wid, "name": w, "icon": "assets/gear/" + wid + ".png", "specId": slug(name)}
        specs[name] = {
            "id": slug(name),
            "name": name,
            "style": strip_markup(j.get("style")) or "",
            "weapons": weapon_ids,
            "adrenaline": parse_percent(j.get("adrenaline")),
            "cooldownTicks": parse_ticks(strip_markup(j.get("cooldown"))),
            "damageMin": lo,
            "damageMax": hi,
            "damageText": strip_markup(j.get("damage")),
            "target": j.get("target") or "Single",
            "description": desc,
            "icon": gear[weapon_ids[0]]["icon"] if weapon_ids else "assets/abilities/weapon-special-attack.png",
        }
    urls = image_urls(list(files.values()))
    for wid, f in files.items():
        url = urls.get(f)
        if url:
            download(url, ASSETS / "gear" / (wid + ".png"))
        else:
            print("no icon for", gear[wid]["name"], f)
            gear[wid]["icon"] = "assets/abilities/weapon-special-attack.png"
    for s in specs.values():
        if s["weapons"]:
            s["icon"] = gear[s["weapons"][0]]["icon"]
    write_json(DATA / "specs.json", sorted(specs.values(), key=lambda s: s["name"]))
    write_json(DATA / "gear.json", sorted(gear.values(), key=lambda g: g["name"]))
    print(len(specs), "specs,", len(gear), "weapons ->", DATA)


if __name__ == "__main__":
    main()
