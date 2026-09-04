"""Build public/data/pvme-aliases.json: PvME emoji alias -> entity key of this app.

Source: https://github.com/pvme/pvme-settings (emojis/emojis_v2.json). Aliases are matched by name or by
slug against our abilities, prayers, specials, specs, spells, weapons (gear:<weapon id>) and armour / jewellery (item:<gear id>);
a few are mapped by hand. Unmatched aliases
(removed abilities, gear we do not model, bosses, ...) are left out and show up as notes when importing.
Perk / cape / flank variants ("gricocaroming", "overpowerigneous"), stack markers ("bloodlust"), boss targets ("aod")
and inline boss mechanics ("realmmovement") are not aliases: src/app/core/pvme.ts handles them.
Keys are normalised like the importer does (lower case, [a-z0-9] only).
Run:  python tools/fetch-pvme-aliases.py [path/to/emojis_v2.json]   (after the other fetch scripts)
"""
import json
import re
import sys
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
    "occulistring": "item:occultist-s-ring",
    "vampaura": "item:vampyrism-aura",
    "renewal4": "special:adrenaline-renewal-potion",
    "adrenalinepotion": "special:adrenaline-potion",
    "vulnbombs": "special:vulnerability-bomb",
    "adrenrenewalflask": "special:adrenaline-renewal-potion",
    "adrenalinerenewalflask": "special:adrenaline-renewal-potion",
    "arenewalflask": "special:adrenaline-renewal-potion",
    # abbreviations whose emoji name is the abbreviation itself
    "gconc": "ability:greater-concentrated-blast",
    "greaterconc": "ability:greater-concentrated-blast",
    "greaterconcentrated": "ability:greater-concentrated-blast",
    "greaterconcentratedblast": "ability:greater-concentrated-blast",
    "conc": "ability:concentrated-blast",
    "concblast": "ability:concentrated-blast",
    "concentratedblast": "ability:concentrated-blast",
    "gsonic": "ability:greater-sonic-wave",
    "gsonicwave": "ability:greater-sonic-wave",
    "greatersonic": "ability:greater-sonic-wave",
    "greatersonicwave": "ability:greater-sonic-wave",
    "sonic": "ability:sonic-wave",
    "sonicwave": "ability:sonic-wave",
    "gchain": "ability:greater-chain",
    "greaterchain": "ability:greater-chain",
    "anti": "ability:anticipation",
    "anticipate": "ability:anticipation",
    "deathsswift": "ability:death-s-swiftness",
    "corruptblast": "ability:corruption-blast",
    "comb": "ability:combust",
    "magmatempest": "ability:magma-tempest",
    "magmatemptest": "ability:magma-tempest",
    "magma": "ability:magma-tempest",
    "cgrico": "ability:greater-ricochet",
    "omnipower": "ability:omnipower",  # base of "omnipowerigneous"; PvME only has "omni"
    "necroflank": "ability:soul-strike",
    "flanknecro": "ability:soul-strike",
    # "Death Spark or Soul Reave": the empowered Necromancy basic (the stacks alone are a marker, see pvme.ts)
    "deathsparkorsoulreave": "ability:necromancy",
    "soulreave": "ability:necromancy",
    "sreave": "ability:necromancy",
    # prayers named differently on PvME
    "deflectrange": "prayer:deflect-ranged",
    "deflectranged": "prayer:deflect-ranged",
    "deflectmissiles": "prayer:deflect-ranged",
    "protectfrommissiles": "prayer:protect-from-ranged",
    "protectmissiles": "prayer:protect-from-ranged",
    "protectrange": "prayer:protect-from-ranged",
    "protectranged": "prayer:protect-from-ranged",
    "protectfromranged": "prayer:protect-from-ranged",
    # spells (spells.json) whose emoji name does not match
    "bloodbarrage": "spell:blood-barrage",
    "icebarrage": "spell:ice-barrage",
    "shadowbarrage": "spell:shadow-barrage",
    "smokebarrage": "spell:smoke-barrage",
    "penanceaspect": "spell:penance",  # plain "penance" is PvME's id alias for the aura
    "vampyrismaspect": "spell:vampyrism",
    "vampyrism": "spell:vampyrism",
    "vuln": "spell:vulnerability",
    "vulnerability": "spell:vulnerability",
    "airsurge": "spell:air-surge",
    "watersurge": "spell:water-surge",
    "earthsurge": "spell:earth-surge",
    "firesurge": "spell:fire-surge",
    "veng": "spell:vengeance",
    "vengeance": "spell:vengeance",
    "vengance": "spell:vengeance",
    "vengother": "spell:vengeance-other",
    "vengeanceother": "spell:vengeance-other",
    "venggroup": "spell:vengeance-group",
    "groupveng": "spell:vengeance-group",
    "ent": "spell:entangle",
    "entangle": "spell:entangle",
    "cept": "spell:intercept",
    "intercept": "spell:intercept",
    "sc": "spell:smoke-cloud",
    "smokecloud": "spell:smoke-cloud",
    "exsang": "spell:exsanguinate",
    "exsanguinate": "spell:exsanguinate",
    "incitefear": "spell:incite-fear",
    "animatedead": "spell:animate-dead",
    "shielddome": "spell:shield-dome",
    "enfeeble": "spell:enfeeble",
    "healother": "spell:heal-other",
    "healgroup": "spell:heal-group",
    "cureme": "spell:cure-me",
    "disruptionshield": "spell:disruption-shield",
    "sbs": "spell:spellbook-swap",
    "spellbookswap": "spell:spellbook-swap",
    "bind": "spell:bind",
    "snare": "spell:snare",
    "stagger": "spell:stagger",
}
# id aliases that are not the emoji's thing: "deathspark" is the stack marker (a hint in pvme.ts), not the empowered basic
NOT_ALIASES = {"deathspark", "dspark"}
CATEGORIES = {
    "Melee abilities", "Ranged Abilities", "Magic Abilities", "Necromancy abilities", "Defence and Constitution Abilities",
    "Unlockable Abilities", "Ability targetting", "Prayers", "Melee Gear", "Ranged Gear", "Magic Gear", "Necromancy Gear",
    "Other Gear", "Consumables, Currencies, and Combat Support Items", "Jewellery", "Auras and Pocket slot",
    "uncategorised", "uncategorized", "Uncategorised",
}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main():
    if len(sys.argv) > 1:  # a local copy of emojis_v2.json
        emojis = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        req = urllib.request.Request(SRC, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            emojis = json.load(r)

    by_name: dict[str, str] = {}
    by_norm: dict[str, str] = {}
    for f, kind in (("abilities", "ability"), ("prayers", "prayer"), ("specials", "special"), ("specs", "spec"), ("spells", "spell"), ("weapons", "gear"), ("gear", "item")):
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
            extras = [str(x) for x in em.get("id_aliases") or []]  # preset-maker ids ("edracolichcoif") point at the same item
            base = re.sub(r"\s*\([^)]*\)", "", em["name"])  # "(red)", "(or)", "(black)" variants -> the base item
            key = MANUAL.get(norm(alias)) or by_name.get(em["name"].lower()) or by_norm.get(norm(em["name"])) or by_norm.get(norm(alias)) or by_norm.get(norm(base))
            if not key and em["name"].lower().startswith("eof"):
                key = "item:essence-of-finality-amulet"  # "EoF (red)", "EoF (or)(pink)" ... are all the same amulet
            if key and (key in known or key.startswith("action:")):
                aliases[norm(alias)] = key
                for extra in extras:
                    if norm(extra) not in NOT_ALIASES:
                        aliases.setdefault(norm(extra), key)
    for alias, key in MANUAL.items():
        if key in known or key.startswith("action:"):
            aliases[norm(alias)] = key
    write_json(DATA / "pvme-aliases.json", dict(sorted(aliases.items())))
    print(len(aliases), "aliases ->", DATA / "pvme-aliases.json")


if __name__ == "__main__":
    main()
