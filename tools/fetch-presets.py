"""Build public/data/presets.json: boss setups from PvME (gear preset + rotations), loadable on the Presets page.

Sources: PvME boss guides (github.com/pvme/pvme-guides) for the rotations and the preset links, the PvME
preset maker storage (github.com/pvme/preset-maker-storage) for the worn gear and backpack. Gear and ability
aliases resolve through public/data/pvme-aliases.json; unknown aliases are listed in `unknown` so the page can
say what was left out.  python tools/fetch-presets.py
"""
import json
import re
import urllib.request

from fetch_wiki import DATA, UA, write_json

GUIDES = "https://raw.githubusercontent.com/pvme/pvme-guides/master/rs3-full-boss-guides/"
GUIDE_WEB = "https://github.com/pvme/pvme-guides/blob/master/rs3-full-boss-guides/"
STORE = "https://raw.githubusercontent.com/pvme/preset-maker-storage/master/presets/"

# (boss, style, guide file, preset id or None = first link in the guide, section filter regex or None = every rotation section)
PRESETS = [
    ("Rasial, the First Necromancer", "Necromancy", "rasial.txt", "63366c75-7dcb-4514-a8a4-723577a98b92", r"T90 Equilibrium"),
    ("Zamorak, Lord of Chaos (500%)", "Necromancy", "zamorak/zamorak-necro-500.txt", None, None),
    ("Zamorak, Lord of Chaos (500%)", "Ranged", "zamorak/zamorak-ranged-500.txt", None, None),
    ("Sanctum of Rebirth (HM solo)", "Necromancy", "sanctum/sanctum-hm-solo-necromancy.txt", None, None),
    ("Sanctum of Rebirth (HM solo)", "Melee", "sanctum/sanctum-hm-solo-melee.txt", None, None),
    ("Sanctum of Rebirth (HM solo)", "Ranged", "sanctum/sanctum-hm-solo-ranged.txt", None, None),
    ("Kerapac, the bound (HM solo)", "Necromancy", "kerapac/solo-hard-mode-necromancy.txt", None, None),
    ("Kerapac, the bound (HM solo)", "Melee", "kerapac/solo-hard-mode-melee.txt", None, None),
    ("Kerapac, the bound (HM solo)", "Ranged", "kerapac/solo-hard-mode-ranged.txt", None, None),
    ("Nex (solo)", "Necromancy", "nex/nex-solo-necromancy.txt", None, None),
    ("Nex (solo)", "Melee", "nex/nex-solo-melee.txt", None, None),
    ("Nex (solo)", "Ranged", "nex/nex-solo-bolg.txt", None, None),
    ("Arch-Glacor (high enrage)", "Necromancy", "arch-glacor/high-enrage-arch-glacor-necromancy.txt", None, None),
    ("Telos, the Warden", "Necromancy", "telos/necromancy.txt", None, r"Safe Push"),
    ("Telos, the Warden", "Melee", "telos/melee.txt", None, None),
    ("Telos, the Warden", "Magic", "telos/magic-fsoa.txt", None, None),
    ("Telos, the Warden", "Ranged", "telos/ranged-bolg.txt", None, None),
    ("Hermod, the Spirit of War", "Necromancy", "hermod.txt", None, None),
    ("Vorkath", "Necromancy", "vorkath/necro-vorkath.txt", None, None),
    ("Vorkath", "Melee", "vorkath/melee-vorkath.txt", None, None),
]
# PvME preset maker equipment slot order
EQUIP_SLOTS = ["head", "cape", "neck", "mainHand", "body", "offHand", "legs", "hands", "feet", "ring", "ammo", "aura", "pocket"]
EMOJI = re.compile(r"<a?:([A-Za-z0-9_]+):\d+>")
LINK = re.compile(r"\[([^\]]+)\]\(<?[^)]*>?\)")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def ref_of(key: str) -> dict | None:
    kind, _, ident = key.partition(":")
    if kind == "gear":
        return {"kind": "weapon", "id": ident}
    if kind == "item":
        return {"kind": "gear", "id": ident}
    if kind == "special":
        return {"kind": "special", "id": ident}
    return None


def clean_line(line: str) -> str:
    s = EMOJI.sub(lambda m: m.group(1), line)
    s = LINK.sub(r"\1", s)
    s = re.sub(r"[*_`]+", "", s)
    s = s.replace("⬥", "").replace("•", "").replace("⬩", "").replace(" ", " ").replace("​", "")
    return re.sub(r"[ \t]+", " ", s).strip()


def rotation_sections(text: str, section_filter: str | None) -> list[dict]:
    """### sections that contain ability emojis, as {name, text}; `##` headings scope duplicate names."""
    out = []
    parent = ""
    current = None
    in_scope = section_filter is None
    for raw in text.splitlines():
        m2 = re.match(r"^##\s+_*(.+?)_*\s*(<:[^>]+>)?\s*$", raw)
        m3 = re.match(r"^###\s+_*(.+?)_*\s*$", raw)
        if m2:
            parent = clean_line(m2.group(1))
            if section_filter is not None:
                in_scope = re.search(section_filter, parent) is not None
            current = None
            continue
        if m3:
            current = {"name": clean_line(m3.group(1)), "parent": parent, "lines": []}
            if in_scope:
                out.append(current)
            continue
        if raw.startswith(".") or raw.startswith("{") or not current:
            continue
        if "<:" in raw or "→" in raw:
            current["lines"].append(clean_line(raw))
    return [{"name": s["name"], "parent": s["parent"], "text": "\n".join(s["lines"])} for s in out if s["lines"]]


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main():
    aliases = json.loads((DATA / "pvme-aliases.json").read_text(encoding="utf-8"))
    # older presets carry wiki names instead of emoji ids: resolve those by name
    by_name: dict[str, str] = {}
    for f, kind in (("weapons", "gear"), ("gear", "item"), ("specials", "special")):
        for x in json.loads((DATA / f"{f}.json").read_text(encoding="utf-8")):
            by_name.setdefault(norm(x["name"]), kind + ":" + x["id"])

    def resolve(slot: dict) -> str | None:
        alias = (slot.get("id") or slot.get("label") or "").lower()
        key = aliases.get(alias) if alias else None
        name = slot.get("name") or ""
        if not key and name:
            base = re.sub(r"\s*\([^)]*\)", "", name)
            key = by_name.get(norm(name)) or by_name.get(norm(base))
            if not key and name.lower().startswith("essence of finality"):
                key = "item:essence-of-finality-amulet"
        return key

    presets = []
    for boss, style, guide, preset_id, section_filter in PRESETS:
        try:
            text = fetch(GUIDES + guide)
        except Exception as e:  # noqa: BLE001
            print("guide failed", guide, e)
            continue
        ids = re.findall(r"presets\.pvme\.io/?\?id=([A-Za-z0-9-]+)", text)
        pid = preset_id or (ids[0] if ids else None)
        gear = {"presetName": "", "equipmentSlots": [], "inventorySlots": []}
        if pid:
            try:
                gear = json.loads(fetch(STORE + pid + ".json"))
            except Exception as e:  # noqa: BLE001
                print("preset failed", pid, e)
        unknown: list[str] = []
        equipment = {}
        for i, slot in enumerate(gear.get("equipmentSlots") or []):
            slot = slot or {}
            label = slot.get("name") or slot.get("label") or slot.get("id") or ""
            if not label or i >= len(EQUIP_SLOTS):
                continue
            key = resolve(slot)
            ref = ref_of(key) if key else None
            if ref and ref["kind"] != "special":
                equipment[EQUIP_SLOTS[i]] = ref
            else:
                unknown.append(label)
        inventory = []
        for slot in (gear.get("inventorySlots") or [])[:28]:
            slot = slot or {}
            label = slot.get("name") or slot.get("label") or slot.get("id") or ""
            key = resolve(slot) if label else None
            ref = ref_of(key) if key else None
            inventory.append(ref)
            if label and not ref and label not in unknown:
                unknown.append(label)
        # a two-handed weapon sits in the main-hand slot of the preset maker; the app keeps it under twoHand
        rotations = rotation_sections(text, section_filter)
        seen: set[str] = set()
        rots = []
        for r in rotations:
            name = r["name"]
            if name in seen:
                name = r["parent"] + " – " + r["name"] if r["parent"] else name
            seen.add(name)
            rots.append({"name": name, "text": r["text"]})
        presets.append({
            "id": re.sub(r"[^a-z0-9]+", "-", (boss + " " + style).lower()).strip("-"),
            "boss": boss,
            "style": style,
            "title": gear.get("presetName") or boss + " – " + style,
            "guide": GUIDE_WEB + guide,
            "presetUrl": ("https://pvme.io/preset-maker/#/" + pid) if pid else None,
            "notes": clean_line(re.sub(r"<[^>]+>", "", gear.get("presetNotes") or "")),
            "equipment": equipment,
            "inventory": inventory,
            "unknown": unknown,
            "rotations": rots,
        })
        print(boss, style, "| gear", len(equipment), "| inv", sum(1 for x in inventory if x), "| rotations", len(rots), "| unknown", unknown[:8])
    write_json(DATA / "presets.json", presets)
    print(len(presets), "presets ->", DATA / "presets.json")


if __name__ == "__main__":
    main()
