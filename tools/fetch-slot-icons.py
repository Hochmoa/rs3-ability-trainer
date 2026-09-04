"""Download the empty-slot silhouettes of the in-game Worn Equipment screen into public/assets/slots/.

Source: runescape.wiki (File:Head slot.png, File:Back slot.png, ...), (c) Jagex, used under fair use like on the
wiki (CC BY-NC-SA 3.0).  The files are 32x32 PNGs; the app draws them at low opacity as slot backgrounds.
python tools/fetch-slot-icons.py
"""
from fetch_wiki import ASSETS, download, image_urls

# app slot id -> wiki file title
SLOT_FILES = {
    "head": "Head slot.png",
    "cape": "Back slot.png",
    "neck": "Neck slot.png",
    "ammo": "Ammo slot.png",
    "mainHand": "Main hand slot.png",
    "twoHand": "2h slot.png",
    "body": "Torso slot.png",
    "offHand": "Off-hand slot.png",
    "legs": "Legs slot.png",
    "hands": "Hands slot.png",
    "feet": "Feet slot.png",
    "ring": "Ring slot.png",
    "pocket": "Pocket slot.png",
    "aura": "Aura slot (historical).png",  # "Aura slot.png" redirects here; still the icon of the aura slot
    "sigil": "Sigil slot.png",
    "weight": "Weight icon.png",
}


def main() -> None:
    urls = image_urls(list(SLOT_FILES.values()))
    out = ASSETS / "slots"
    for slot, title in SLOT_FILES.items():
        url = urls.get(title)
        if not url:
            print("missing on wiki:", title)
            continue
        target = out / f"{slot}.png"
        download(url, target)
        print(slot, "<-", title)


if __name__ == "__main__":
    main()
