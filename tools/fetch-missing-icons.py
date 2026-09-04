"""Fill in the icons that fetch-gear.py / fetch-weapons.py could not find under "Name.png": stackable ammo
("Name 5.png") and level-scaled items ("Name (10).png"). Only the `icon` field of items with icon == null is
touched in public/data/gear.json and weapons.json.  python tools/fetch-missing-icons.py
"""
import json

from fetch_wiki import ASSETS, DATA, download, image_urls_any, write_json


def fill(file: str, folder: str) -> None:
    path = DATA / f"{file}.json"
    items = json.loads(path.read_text(encoding="utf-8"))
    todo = [i for i in items if not i.get("icon")]
    urls = image_urls_any([i["name"] for i in todo])
    still = []
    for i in todo:
        url = urls.get(i["name"])
        if not url:
            still.append(i["name"])
            continue
        download(url, ASSETS / folder / (i["id"] + ".png"))
        i["icon"] = f"assets/{folder}/{i['id']}.png"
    write_json(path, items)
    print(f"{file}: {len(todo) - len(still)} icons added, still missing {len(still)}: {still}")


if __name__ == "__main__":
    fill("gear", "gear")
    fill("weapons", "weapons")
