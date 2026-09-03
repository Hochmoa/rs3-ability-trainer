"""Build public/data/specs.json: every current weapon special attack, plus the weapon sprites it needs.

Source: runescape.wiki bucket `infobox_weapon_special_attack` (see docs/research/special-attacks.md).
Run before fetch-abilities.py so the spec buffs end up in buffs.json.  python tools/fetch-specs.py
"""
import re

from fetch_wiki import (ASSETS, DATA, bucket, download, file_of, image_urls, parse_duration_ticks,
                        parse_percent, parse_ticks, slug, strip_markup, write_json)

# infobox says 0 but the Weapon Special Attack page documents a cooldown (docs/research/special-attacks.md §4.1)
COOLDOWN_OVERRIDES = {"Vine Call": 33, "Power of Darkness": 150}
# documented differences when the spec is used from an Essence of Finality amulet (§3.4)
EOF_NOTES = {
    "Balance by Force": "The Perfect Equilibrium passive does not trigger from an Essence of Finality.",
    "Igneous Showdown": "Extra hits, adrenaline refund and Ashen Vow need a wielded Ek-ZekKil; storability unclear (EoF copies were refunded in 2025).",
    "Death Essence": "No wiki statement about Essence of Finality; the Death Spark buff is lost on a main-hand swap.",
    "Soul Crush": "No wiki statement about Essence of Finality; the Soul Reave buff is lost on a main-hand swap.",
    "Vine Call": "No halberd 5x5 and no Masterwork Spear of Annihilation extension from an Essence of Finality.",
    "Icy Tempest": "No halberd 5x5 from an Essence of Finality.",
    "Destructive Shot": "Zamorak arrows cap the damage at tier 55 via Essence of Finality.",
    "Slice and Dice": "Both claws are needed to store it.",
    "Power of Light": "Works from an Essence of Finality without the staff.",
    "Rune Flame": "The rune-providing benefit of the staff is lost when consumed.",
    "Tempest of Armadyl": "The rune-providing benefit of the staff is lost when consumed.",
    "Locate": "Must be cast from the Essence of Finality or an equipped Decimation.",
    "Split Soul": "Tied to the main-hand weapon.",
}
EOF_UNKNOWN = {"Igneous Showdown", "Death Essence", "Soul Crush"}


def main():
    rows = bucket("infobox_weapon_special_attack",
                  ["page_name", "name", "image", "weapon", "style", "target", "is_members_only", "json"], limit=500)
    print(len(rows), "spec rows")
    specs = {}
    for r in rows:
        j = r.get("json") or {}
        name = j.get("name") or r.get("name") or r.get("page_name")
        if not name or j.get("removal") or name in specs:
            continue
        desc_raw = j.get("description") or ""
        desc = strip_markup(desc_raw)
        cost = parse_percent(j.get("adrenaline"))
        cd = COOLDOWN_OVERRIDES.get(name, parse_ticks(strip_markup(j.get("cooldown"))) or 0)
        weapons = r.get("weapon") or []
        if isinstance(weapons, str):
            weapons = [weapons]
        images = r.get("image") or []
        if isinstance(images, str):
            images = [images]
        m = re.search(r"(\d+(?:\.\d+)?)%?\s*[-–]\s*(\d+(?:\.\d+)?)%", desc)
        specs[name] = {
            "id": slug(name),
            "name": name,
            "page": r.get("page_name") or name,
            "style": r.get("style") or j.get("style"),
            "target": r.get("target") or "Single",
            "weapons": weapons,
            "weaponIds": [slug(w) for w in weapons],
            "adrenaline": abs(cost) if cost is not None else None,
            "cooldownTicks": cd,
            "ignoresGcd": "Can be cast during the global cooldown" in desc,
            "channelled": bool(re.search(r"(?m)^\*?\s*Channell?ed\.?$", desc)),
            "damageText": strip_markup(j.get("damage")),
            "damageMin": float(m.group(1)) if m else None,
            "damageMax": float(m.group(2)) if m else None,
            "durationTicks": parse_duration_ticks(desc),
            "description": desc,
            "buffs": [{"id": b.get("id", -1), "pagename": b.get("pagename")} for b in j.get("buffs", []) if isinstance(b, dict)],
            "weaponIcons": ["assets/weapons/" + slug(f[5:-4] if f.startswith("File:") else f[:-4]) + ".png" for f in images],
            "_files": [f[5:] if f.startswith("File:") else f for f in images],
            "eof": {"storable": "unknown" if name in EOF_UNKNOWN else True, "notes": EOF_NOTES.get(name)},
            "members": r.get("is_members_only") in ("", True),
        }
    files = [f for s in specs.values() for f in s["_files"]]
    urls = image_urls(files)
    for s in specs.values():
        for f in s["_files"]:
            url = urls.get(f)
            if url:
                download(url, ASSETS / "weapons" / (slug(f[:-4]) + ".png"))
        del s["_files"]
    out = sorted(specs.values(), key=lambda s: (s["style"] or "", s["name"]))
    write_json(DATA / "specs.json", out)
    print(len(out), "specs ->", DATA / "specs.json")


if __name__ == "__main__":
    main()
