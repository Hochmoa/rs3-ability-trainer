"""Build public/data/pvme-aliases.json: PvME emoji alias -> entity key of this app.

Source: https://github.com/pvme/pvme-settings (emojis/emojis_v2.json). Aliases are matched by name or by
slug against our abilities, prayers, specials, specs and weapons (gear:<weapon id>); a few are mapped by hand. Unmatched aliases
(removed abilities, gear we do not model, bosses, ...) are left out and show up as notes when importing.
Run:  python tools/fetch-pvme-aliases.py   (after the other fetch scripts)
"""
import json
import re
import urllib.request

from fetch_wiki import DATA, UA, slug, write_json

SRC = "https://raw.githubusercontent.com/pvme/pvme-settings/master/emojis/emojis_v2.json"

# alias -> entity key that name matching cannot find
MANUAL = {
    "necrobasic": "ability:necromancy",
    "meleebasic": "ability:attack",
    "rangedbasic": "ability:ranged",
    "magicbasic": "ability:magic",
    "auto": "ability:necromancy",  # replaced per style by the importer when it knows the style
    "tc": "action:target-cycle",
    "spec": "action:weapon-special-attack",
    "eofspec": "ability:essence-of-finality",
    "adrenrenewal": "special:adrenaline-renewal-potion",
    "adrenpot": "special:adrenaline-potion",
    "superadrenpot": "special:super-adrenaline-potion",
    "replen": "special:replenishment-potion",
    "enhreplen": "special:enhanced-replenishment-potion",
    "vulnbomb": "special:vulnerability-bomb",
    "undeadslayer": "ability:undead-slayer",
    "dragonslayer": "ability:dragon-slayer",
    "demonslayer": "ability:demon-slayer",
    "commandskeleton": "ability:command-skeleton-warrior",
    "commandwarrior": "ability:command-skeleton-warrior",
    "conjureskeleton": "ability:conjure-skeleton-warrior",
    "commandzombie": "ability:command-putrid-zombie",
    "conjurezombie": "ability:conjure-putrid-zombie",
    "commandghost": "ability:command-vengeful-ghost",
    "conjureghost": "ability:conjure-vengeful-ghost",
    "commandphantom": "ability:command-phantom-guardian",
    "conjurephantom": "ability:conjure-phantom-guardian",
    "conjurearmy": "ability:conjure-undead-army",
    "deathguard90": "gear:death-guard-tier-90",
    "deathguard80": "gear:death-guard-tier-80",
    "deathguard70": "gear:death-guard-tier-70",
}
CATEGORIES = {
    "Melee abilities", "Ranged Abilities", "Magic Abilities", "Necromancy abilities", "Defence and Constitution Abilities",
    "Unlockable Abilities", "Ability targetting", "Prayers", "Melee Gear", "Ranged Gear", "Magic Gear", "Necromancy Gear",
    "Other Gear", "Consumables, Currencies, and Combat Support Items", "Jewellery",
}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main():
    req = urllib.request.Request(SRC, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        emojis = json.load(r)

    by_name: dict[str, str] = {}
    by_norm: dict[str, str] = {}
    for f, kind in (("abilities", "ability"), ("prayers", "prayer"), ("specials", "special"), ("specs", "spec"), ("weapons", "gear")):
        for x in json.load(open(DATA / f"{f}.json", encoding="utf-8")):
            key = kind + ":" + x["id"]
            by_name.setdefault(x["name"].lower(), key)
            by_norm.setdefault(norm(x["name"]), key)
            by_norm.setdefault(norm(x["id"]), key)
    known = set(by_name.values())

    aliases: dict[str, str] = {}
    for cat in emojis["categories"]:
        if cat["name"] not in CATEGORIES:
            continue
        for em in cat["emojis"]:
            alias = em["id"]
            if alias.lower().startswith("old"):
                continue
            key = MANUAL.get(alias) or by_name.get(em["name"].lower()) or by_norm.get(norm(em["name"])) or by_norm.get(norm(alias))
            if key and (key in known or key.startswith("action:")):
                aliases[alias.lower()] = key
    for alias, key in MANUAL.items():
        if key in known or key.startswith("action:"):
            aliases[alias] = key
    write_json(DATA / "pvme-aliases.json", dict(sorted(aliases.items())))
    print(len(aliases), "aliases ->", DATA / "pvme-aliases.json")


if __name__ == "__main__":
    main()
