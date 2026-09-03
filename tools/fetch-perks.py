"""Build public/data/perks.json: all live Invention perks with the simulator's classification.

Source: runescape.wiki pages transcluding Template:Infobox Perk (docs/research/perks-and-set-effects.md part A).
python tools/fetch-perks.py
"""
import re

from fetch_wiki import ASSETS, DATA, download, embedded_in, file_of, image_urls, slug, strip_markup, wikitext, write_json

# removed from the game on 20 July 2026 ("Mid-Game Rebalance"); pages still exist
REMOVED = {"Antitheism", "Profane", "Inaccurate", "Junk Food", "Undead Bait", "Demon Bait", "Dragon Bait", "Cautious",
           "Mediocrity", "Fatiguing", "Committed", "Butterfingers", "Blunted", "Cheapskate", "Confused"}

# simulator parameters for the combat perks (numbers from the research file; wiki URL = the perk page)
COMBAT = {
    "Impatient": {"class": "adrenaline", "chancePerRank": 0.09, "bonus": 3, "twoSlot": False},
    "Invigorating": {"class": "adrenaline", "basicAttackMultPerRank": 0.05},
    "Relentless": {"class": "adrenaline", "noCostChancePerRank": 0.01, "lockoutTicks": 50},
    "Planted Feet": {"class": "cooldown", "abilities": ["sunshine", "death-s-swiftness"], "durationTicks": 63, "removesDot": True},
    "Mobile": {"class": "cooldown", "abilities": ["surge", "escape", "dive", "bladed-dive", "barge", "greater-barge"], "cooldownMult": 0.5},
    "Preparation": {"class": "cooldown", "abilities": ["preparation"], "durationPerRank": 0.15, "cooldownPerRank": 0.15},
    "Turtling": {"class": "cooldown", "abilities": ["barricade"], "durationPerRank": 0.10, "cooldownPerRank": 0.10},
    "Devoted": {"class": "cooldown", "chancePerRank": 0.03, "buff": "devotion", "durationTicks": 5},
    "Enhanced Devoted": {"class": "cooldown", "chancePerRank": 0.045, "buff": "devotion", "durationTicks": 5, "twoSlot": True},
    "Brief Respite": {"class": "cooldown", "abilities": ["rejuvenate", "guthix-s-blessing", "ice-asylum"], "cooldownPerRank": -0.05},
    "Bulwark": {"class": "cooldown", "abilities": ["debilitate"], "durationPerRank": 0.06, "noDamage": True},
    "Crystal Shield": {"class": "cooldown", "chance": 0.10, "cooldownTicks": 100},
    "Clear Headed": {"class": "cooldown", "abilities": ["anticipation"], "extraTicksPerRank": 1.67, "removesDamageReduction": True},
    "Reflexes": {"class": "cooldown", "abilities": ["anticipation"], "durationMult": 0.5, "cooldownMult": 0.5},
    "Precise": {"class": "damage", "minDamagePerRank": 0.015},
    "Eruptive": {"class": "damage", "abilityDamagePerRank": 0.005},
    "Equilibrium": {"class": "damage", "abilityDamageBase": 0.06, "abilityDamagePerRank": 0.02, "noCrit": True},
    "Aftershock": {"class": "damage", "damagePerRank": 0.40, "threshold": 50000},
    "Biting": {"class": "damage", "critChancePerRank": 0.02},
    "Crackling": {"class": "damage", "damagePerRank": 0.50, "cooldownTicks": 100},
    "Ultimatums": {"class": "damage", "ultimateBase": 0.03, "ultimatePerRank": 0.01},
    "Lunging": {"class": "damage", "abilities": ["combust", "dismember"], "base": 0.10, "perRank": 0.03},
    "Caroming": {"class": "damage", "ricochetPerRank": 0.04, "chainBase": 0.05, "chainPerRank": 0.05},
    "Flanking": {"class": "damage", "abilities": ["soul-strike", "backhand", "impact", "binding-shot"], "perRank": 0.40, "removesStun": True},
    "Ruthless": {"class": "damage", "perStackPerRank": 0.005, "maxStacks": 5, "durationTicks": 34},
    "Genocidal": {"class": "damage", "maxBonus": 0.05},
    "Undead Slayer": {"class": "damage", "bonus": 0.07},
    "Dragon Slayer": {"class": "damage", "bonus": 0.07},
    "Demon Slayer": {"class": "damage", "bonus": 0.07},
    "Energising": {"class": "damage", "accuracyBase": 50, "accuracyPerRank": 25},
    "Spendthrift": {"class": "damage", "chancePerRank": 0.01, "damagePerRank": 0.01},
    "Shield Bashing": {"class": "damage", "abilities": ["debilitate"], "perRank": 0.15},
    "Absorbative": {"class": "defensive"}, "Lucky": {"class": "defensive"}, "Venomblood": {"class": "defensive"},
}
GIZMO = {"Weapon": ["weapon"], "Armour": ["armour"], "Tool": ["tool"], "Ancient weapon": ["ancient-weapon"],
         "Ancient armour": ["ancient-armour"], "Ancient tool": ["ancient-tool"]}


def parse_infobox(text: str) -> dict:
    m = re.search(r"\{\{Infobox Perk(.*?)\n\}\}", text, re.S)
    if not m:
        return {}
    params = {}
    for line in re.split(r"\n\|", m.group(1)):
        if "=" in line:
            k, v = line.split("=", 1)
            params[k.strip().lstrip("|")] = v.strip()
    return params


def gizmos(value: str) -> list[str]:
    out = []
    for part in re.split(r"[,/]| and ", value or ""):
        part = part.strip().strip("[]").split("|")[0]
        for key, kinds in GIZMO.items():
            if part.lower() == key.lower():
                out += kinds
    return sorted(set(out)) or ["weapon", "armour"]


def main():
    pages = [t for t in embedded_in("Infobox Perk") if not t.startswith(("Template:", "User:"))]
    print(len(pages), "perk pages")
    texts = wikitext(pages)
    perks = []
    for title in pages:
        if title in REMOVED:
            continue
        p = parse_infobox(texts.get(title, ""))
        if not p:
            print("no infobox:", title)
            continue
        name = (strip_markup(p.get("name")) or title).replace(" (perk)", "")
        def lead(v: str) -> str:
            m = re.match(r"\s*(\d+)", v or "")
            return m.group(1) if m else ""
        std = lead(p.get("max rank standard") or p.get("max rank") or "")
        anc = lead(p.get("max rank ancient") or "") or std
        combat = COMBAT.get(name)
        perks.append({
            "id": slug(name),
            "name": name,
            "gizmos": gizmos(p.get("gizmo", "")),
            "maxRank": int(std) if std.isdigit() else 0,
            "maxRankAncient": int(anc) if str(anc).isdigit() else (int(std) if std.isdigit() else 0),
            "level": int(p["level"]) if p.get("level", "").isdigit() else None,
            "description": strip_markup(p.get("desc")),
            "class": (combat or {}).get("class", "none"),
            "params": {k: v for k, v in (combat or {}).items() if k != "class"},
            "twoSlot": bool((combat or {}).get("twoSlot")) or name == "Enhanced Efficient",
            "icon": "assets/perks/" + slug(name) + ".png",
            "_file": file_of(p.get("image")) or (name + ".png"),
        })
    urls = image_urls([p["_file"] for p in perks])
    for p in perks:
        url = urls.get(p["_file"])
        if url:
            download(url, ASSETS / "perks" / (p["id"] + ".png"))
        else:
            p["icon"] = None
        del p["_file"]
    order = {"adrenaline": 0, "cooldown": 1, "damage": 2, "defensive": 3, "none": 4}
    perks.sort(key=lambda p: (order[p["class"]], p["name"]))
    write_json(DATA / "perks.json", perks)
    from collections import Counter
    print(len(perks), "perks ->", DATA / "perks.json", Counter(p["class"] for p in perks))


if __name__ == "__main__":
    main()
