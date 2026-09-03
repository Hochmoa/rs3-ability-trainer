"""Fetch the RS3 combat ability catalog + icons from the RuneScape Wiki.

Usage:  python tools/fetch-abilities.py [output-assets-dir]
Writes <assets>/abilities.json and <assets>/abilities/<slug>.png.
Icons are (c) Jagex, used under fair use like on runescape.wiki (CC BY-NC-SA 3.0 for wiki text).
The build never calls this; the results are committed.
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://runescape.wiki/api.php"
UA = "rs3-ability-trainer/0.1 (https://github.com/Hochmoa/rs3-ability-trainer)"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "public" / "assets"
ICON_DIR = OUT / "abilities"

# abilities that do not trigger / are not blocked by the global cooldown (runescape.wiki)
OFF_GCD = {"Surge", "Escape", "Dive", "Bladed Dive", "Anticipation", "Provoke", "Limitless",
           "Vengeance", "Disruption Shield"}
# utility-type abilities worth having in the catalog (the rest are shouts/stances/slayer buffs)
UTILITY_KEEP = {"Surge", "Escape", "Dive", "Limitless"}
SKIP = {"Magma Tempest (Targeted)", "Single-Way Wilderness", "Revolution"}
STYLE = {"Attack": "Melee", "Strength": "Melee", "Melee": "Melee", "Ranged": "Ranged", "Magic": "Magic",
         "Necromancy": "Necromancy", "Defence": "Defence", "Constitution": "Constitution"}
TYPE_ORDER = {"Basic": 0, "Enhanced": 1, "Threshold": 2, "Ultimate": 3, "Special": 4}
STYLE_ORDER = {"Melee": 0, "Ranged": 1, "Magic": 2, "Necromancy": 3, "Defence": 4, "Constitution": 5}


def get(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    rows = get({"action": "bucket", "format": "json", "formatversion": "2",
                "query": "bucket('infobox_ability').select('name','type','skill','level').limit(500).run()"})["bucket"]
    # a few names appear more than once (variants); keep the first row per name
    best = {}
    for r in rows:
        name, typ, skill = r.get("name", ""), r.get("type", ""), r.get("skill", "")
        if not name or name in SKIP or name.startswith("Lesser ") or skill not in STYLE:
            continue
        if typ == "Utility" and name not in UTILITY_KEEP:
            continue
        if name not in best:
            best[name] = {"name": name, "type": typ, "skill": skill, "level": int(r.get("level") or 0)}
    abilities = []
    for r in best.values():
        name, typ = r["name"], r["type"]
        if typ == "Utility":
            typ = "Basic"  # Surge/Escape/Dive/Limitless
        abilities.append({"id": slug(name), "name": name, "style": STYLE[r["skill"]], "type": typ,
                          "level": r["level"], "icon": "assets/abilities/" + slug(name) + ".png",
                          "triggersGcd": name not in OFF_GCD})

    # icon URLs, 50 titles per request
    urls = {}
    names = [a["name"] for a in abilities]
    for i in range(0, len(names), 50):
        titles = "|".join("File:" + n + ".png" for n in names[i:i + 50])
        data = get({"action": "query", "format": "json", "formatversion": "2", "titles": titles,
                    "prop": "imageinfo", "iiprop": "url"})
        for page in data["query"]["pages"]:
            if "imageinfo" in page:
                urls[page["title"][5:-4]] = page["imageinfo"][0]["url"]
        time.sleep(0.3)

    kept = []
    for a in abilities:
        url = urls.get(a["name"])
        if not url:
            print("no icon, skipping:", a["name"])
            continue
        target = ICON_DIR / (a["id"] + ".png")
        if not target.exists():
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                target.write_bytes(r.read())
            time.sleep(0.2)
        kept.append(a)

    kept.sort(key=lambda a: (STYLE_ORDER[a["style"]], TYPE_ORDER[a["type"]], a["level"], a["name"]))
    (OUT / "abilities.json").write_text(json.dumps(kept, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(len(kept), "abilities ->", OUT)


if __name__ == "__main__":
    main()
