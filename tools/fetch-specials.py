"""Build public/data/specials.json: adrenaline consumables (icons from the wiki, numbers hand-checked
against runescape.wiki on 2026-09-03). Run:  python tools/fetch-specials.py
"""
from fetch_wiki import ASSETS, DATA, bucket, download, image_urls, slug, write_json

# name, wiki item (for the icon), instant adrenaline, over-time adrenaline, over-time ticks, herblore level, notes
SPECIALS = [
    ("Adrenaline potion", "Adrenaline potion (4)", 25, 0, 0, 77, "+25% adrenaline. Shares a 120 s cooldown with all adrenaline potions."),
    ("Super adrenaline potion", "Super adrenaline potion (4)", 30, 0, 0, 87, "+30% adrenaline. Shares the 120 s adrenaline potion cooldown."),
    ("Adrenaline renewal potion", "Adrenaline renewal potion (4)", 0, 40, 10, 115, "+40% adrenaline over 6 seconds. Shares the 120 s adrenaline potion cooldown."),
    ("Replenishment potion", "Replenishment potion (6)", 25, 0, 0, 87, "+25% adrenaline plus prayer/summoning restore. Shares the 120 s adrenaline potion cooldown."),
    ("Enhanced replenishment potion", "Enhanced replenishment potion (6)", 30, 0, 0, 90, "+30% adrenaline plus prayer/summoning restore. Shares the 120 s adrenaline potion cooldown."),
]
COOLDOWN_TICKS = 200  # 120 s shared cooldown
# thrown items: name, wiki item, debuff on the target, debuff duration in ticks, notes
BOMBS = [
    ("Vulnerability bomb", "Vulnerability bomb", "Vulnerability", 100,
     "Throws a 3x3 bomb: the target takes 10% more damage from all sources for 60 seconds. Off the global cooldown, no cooldown."),
]


def main():
    out = []
    files = {}
    for name, item, instant, over, over_ticks, lvl, notes in SPECIALS:
        rows = bucket("infobox_item", ["item_name", "image"], where=("item_name", item))
        icon_file = None
        for r in rows:
            img = r.get("image")
            if isinstance(img, list):
                img = img[0] if img else None
            if img:
                icon_file = str(img).replace("File:", "").split("|")[0].strip("[] ")
                break
        files[name] = icon_file or (item + ".png")
        out.append({
            "id": slug(name), "name": name, "kind": "potion", "adrenaline": instant,
            "adrenalineOverTime": over, "overTimeTicks": over_ticks, "cooldownTicks": COOLDOWN_TICKS,
            "sharedCooldown": "adrenaline-potion", "level": lvl, "description": notes,
            "icon": "assets/specials/" + slug(name) + ".png",
        })
    for name, item, debuff, dur, notes in BOMBS:
        rows = bucket("infobox_item", ["item_name", "image"], where=("item_name", item))
        icon_file = None
        for r in rows:
            img = r.get("image")
            if isinstance(img, list):
                img = img[0] if img else None
            if img:
                icon_file = str(img).replace("File:", "").split("|")[0].strip("[] ")
                break
        files[name] = icon_file or (item + ".png")
        out.append({
            "id": slug(name), "name": name, "kind": "bomb", "adrenaline": 0, "adrenalineOverTime": 0, "overTimeTicks": 0,
            "cooldownTicks": 0, "sharedCooldown": "", "level": 103, "description": notes,
            "debuff": {"name": debuff, "durationTicks": dur, "icon": "assets/status/vulnerability-target-status.png"},
            "icon": "assets/specials/" + slug(name) + ".png",
        })
    urls = image_urls(list(files.values()) + ["Vulnerability (target status).png"])
    vurl = urls.get("Vulnerability (target status).png")
    if vurl:
        download(vurl, ASSETS / "status" / "vulnerability-target-status.png")
    for s in out:
        url = urls.get(files[s["name"]])
        if url:
            download(url, ASSETS / "specials" / (s["id"] + ".png"))
        else:
            print("no icon for", s["name"], files[s["name"]])
    write_json(DATA / "specials.json", out)
    print(len(out), "specials ->", DATA / "specials.json")


if __name__ == "__main__":
    main()
