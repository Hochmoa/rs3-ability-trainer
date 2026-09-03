"""Build public/data/gear.json: every wearable non-weapon item (armour, capes, jewellery, ammo, pocket, aura, sigil)
with icons, so the loadout page can browse the whole wardrobe and drag items into equipment slots / the inventory.

Weapons, shields and defenders live in weapons.json (fetch-weapons.py); this file covers the other slots.
Source: runescape.wiki bucket `infobox_bonuses`.  python tools/fetch-gear.py
"""
import json
import re

from fetch_wiki import ASSETS, DATA, bucket_all, category_members, download, image_urls, slug, write_json

FIELDS = ["page_name", "page_name_sub", "combat_class", "equipment_slot", "equipment_type", "equipment_tier",
          "equipment_armour", "equipment_life_points", "prayer_bonus", "is_cosmetic_recolour", "json"]
STYLE = {"melee": "Melee", "ranged": "Ranged", "magic": "Magic", "necromancy": "Necromancy", "hybrid": "Hybrid"}
SLOT = {"head": "head", "torso": "body", "legs": "legs", "hands": "hands", "feet": "feet", "back": "cape",
        "neck": "neck", "ring": "ring", "ammo": "ammo", "pocket": "pocket", "aura": "aura", "sigil": "sigil"}
ARMOUR_SLOTS = {"head", "body", "legs", "hands", "feet"}
DYE = re.compile(r" \((blood|ice|shadow|aurora|barrows|third age|soulflame|or|soul|broken|used|lucky|crucible|deathmatch|"
                 r"damaged|degraded|new|uncharged|inactive|locked|unlocked|red|blue|green|yellow|purple|white|black|orange|pink|grey|gold|silver)\)$", re.I)
SUB_RANK = {"": 0, "new": 0, "Normal": 0, "unbound": 1, "usable": 1, "charged": 2, "active": 0, "Innate Mastery": 3}

# armour set (set-effects.json id) by page-name prefix; longest prefix wins
SET_PREFIX = [
    ("Vestments of havoc", "vestments-of-havoc"),
    ("First Necromancer's", "robes-of-the-first-necromancer"),
    ("Robes of the First Necromancer", "robes-of-the-first-necromancer"),
    ("Elite Dracolich", "elite-dracolich"),
    ("Dracolich", "dracolich"),
    ("of Tumeken's resplendence", "tumeken-s-resplendence"),
    ("of the First Necromancer", "robes-of-the-first-necromancer"),
    ("Elite tectonic", "elite-tectonic"),
    ("Tectonic", "tectonic"),
    ("Elite sirenic", "elite-sirenic"),
    ("Sirenic", "sirenic"),
    ("Trimmed masterwork", "trimmed-masterwork"),
    ("Achto", "achto"),
    ("Cryptbloom", "cryptbloom"),
    ("Deathdealer", "deathdealer-t90"),
    ("Elite void knight", "void-knight"),
    ("Superior elite void knight", "void-knight"),
    ("Void knight", "void-knight"),
    ("Superior void knight", "void-knight"),
    ("Warpriest of Armadyl", "warpriest-armadyl-bandos"),
    ("Warpriest of Bandos", "warpriest-armadyl-bandos"),
    ("Warpriest of Tuska", "warpriest-tuska"),
]
# passive item (set-effects.json kind "item") for pages whose slug differs from the effect id
PASSIVE_ALIAS = {"essence-of-finality-amulet": "essence-of-finality"}


def set_of(name: str) -> str | None:
    low = name.lower()
    best = None
    for prefix, sid in SET_PREFIX:
        hit = low.endswith(prefix.lower()) if prefix.startswith("of ") else low.startswith(prefix.lower())
        if hit and (best is None or len(prefix) > best[0]):
            best = (len(prefix), sid)
    return best[1] if best else None


def main():
    rows = bucket_all("infobox_bonuses", FIELDS)
    print(len(rows), "equipment rows")
    removed = set(r["page_name"] for r in bucket_all("removal_date", ["page_name"]))
    dungeoneering = set(category_members("Dungeoneering items"))
    effects = json.loads((DATA / "set-effects.json").read_text(encoding="utf-8"))
    passives = {e["id"] for e in effects if e["kind"] == "item"}
    augmentable = {r["page_name"][len("Augmented "):] for r in rows if (r.get("page_name") or "").startswith("Augmented ")}

    best: dict[str, dict] = {}
    for r in rows:
        page = r.get("page_name") or ""
        slot = SLOT.get(r.get("equipment_slot") or "")
        if not page or not slot or page.startswith("Augmented ") or DYE.search(page):
            continue
        if page in removed or page in dungeoneering:
            continue
        etype = r.get("equipment_type") or ""
        if etype == "Cosmetic" or r.get("is_cosmetic_recolour"):
            continue
        tier = int(r.get("equipment_tier") or 0)
        cls = STYLE.get(r.get("combat_class") or "")
        # tier-0 helmets, bodies, legs, gloves and boots without a class are holiday / cosmetic items
        if slot in ARMOUR_SLOTS and tier <= 0 and cls is None:
            continue
        sub = (r.get("page_name_sub") or page).split("#", 1)
        version = sub[1] if len(sub) > 1 else ""
        rank = SUB_RANK.get(version, 5)
        cur = best.get(page)
        if cur is None or rank < cur["_rank"]:
            sid = slug(page)
            passive = PASSIVE_ALIAS.get(sid, sid)
            best[page] = {
                "id": sid,
                "name": page,
                "slot": slot,
                "style": cls,
                "tier": tier,
                "type": etype or None,
                "armour": float(r.get("equipment_armour") or 0),
                "lifePoints": int(r.get("equipment_life_points") or 0),
                "prayer": float(r.get("prayer_bonus") or 0),
                "set": set_of(page),
                "passive": passive if passive in passives else None,
                "augmentable": page in augmentable,
                "icon": "assets/gear/" + sid + ".png",
                "_rank": rank,
            }

    for g in best.values():
        del g["_rank"]
    files = {g["name"] + ".png": g for g in best.values()}
    urls = image_urls(list(files.keys()))
    missing = 0
    for f, g in files.items():
        url = urls.get(f)
        if url:
            try:
                download(url, ASSETS / "gear" / (g["id"] + ".png"))
            except Exception as e:  # noqa: BLE001
                print("icon failed", f, e)
                g["icon"] = None
                missing += 1
        else:
            g["icon"] = None
            missing += 1
    out = sorted(best.values(), key=lambda g: (g["slot"], -g["tier"], g["name"]))
    write_json(DATA / "gear.json", out)
    from collections import Counter
    print(len(out), "items ->", DATA / "gear.json", "| missing icons:", missing)
    print(Counter(g["slot"] for g in out))
    print("sets:", Counter(g["set"] for g in out if g["set"]))
    print("passives:", sorted(g["id"] for g in out if g["passive"]))


if __name__ == "__main__":
    main()
