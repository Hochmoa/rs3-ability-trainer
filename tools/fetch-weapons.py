"""Build public/data/weapons.json (the four weapon styles used for weapon switching) with the wiki's
combat style icons. Run:  python tools/fetch-weapons.py
"""
from fetch_wiki import ASSETS, DATA, download, image_urls, write_json

WEAPONS = [
    ("melee", "Melee", "Attack-icon.png", "Melee weapon (main hand)"),
    ("ranged", "Ranged", "Ranged-icon.png", "Ranged weapon (main hand)"),
    ("magic", "Magic", "Magic-icon.png", "Magic weapon (main hand)"),
    ("necromancy", "Necromancy", "Necromancy-icon.png", "Necromancy weapon (main hand)"),
]


def main():
    urls = image_urls([w[2] for w in WEAPONS])
    out = []
    for wid, style, icon_file, desc in WEAPONS:
        url = urls.get(icon_file)
        if url:
            download(url, ASSETS / "weapons" / (wid + ".png"))
        else:
            print("no icon for", style, icon_file)
        out.append({"id": wid, "name": style + " weapon", "style": style, "description": desc,
                    "icon": "assets/weapons/" + wid + ".png"})
    write_json(DATA / "weapons.json", out)
    print(len(out), "weapons ->", DATA / "weapons.json")


if __name__ == "__main__":
    main()
