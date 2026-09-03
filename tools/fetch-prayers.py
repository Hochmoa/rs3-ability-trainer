"""Build public/data/prayers.json (Standard prayers + Ancient Curses) and download their icons.

Source: runescape.wiki bucket `infobox_prayer`. Run:  python tools/fetch-prayers.py
"""
from fetch_wiki import ASSETS, DATA, bucket, download, file_of, image_urls, slug, strip_markup, write_json

# prayers that touch adrenaline (runescape.wiki, Ancient Curses only)
ADRENALINE = {"Leech Adrenaline": 10, "Sap Adrenaline": -10}


def main():
    rows = bucket("infobox_prayer", ["name", "level", "book", "json"])
    prayers = {}
    for r in rows:
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        book = r.get("book") or j.get("book") or ""
        if not name or book not in ("Standard", "Ancient Curses") or name in prayers or j.get("removal"):
            continue
        icon_file = file_of(j.get("image")) or (name + ".png")
        drain = j.get("drain")
        try:
            drain = float(drain) if drain not in (None, "") else None
        except ValueError:
            drain = None
        prayers[name] = {
            "id": slug(name),
            "name": name,
            "book": "Curses" if book == "Ancient Curses" else "Prayers",
            "level": int(r.get("level") or j.get("level") or 0),
            "drainPerHour": drain,
            "effect": strip_markup(j.get("effect")),
            "description": strip_markup(j.get("description")),
            "adrenaline": ADRENALINE.get(name),
            "icon": "assets/prayers/" + slug(name) + ".png",
            "_iconFile": icon_file,
        }
    urls = image_urls([p["_iconFile"] for p in prayers.values()])
    for p in prayers.values():
        url = urls.get(p["_iconFile"])
        if url:
            download(url, ASSETS / "prayers" / (p["id"] + ".png"))
        else:
            print("no icon for", p["name"])
        del p["_iconFile"]
    out = sorted(prayers.values(), key=lambda p: (p["book"], p["level"], p["name"]))
    write_json(DATA / "prayers.json", out)
    print(len(out), "prayers ->", DATA / "prayers.json")


if __name__ == "__main__":
    main()
