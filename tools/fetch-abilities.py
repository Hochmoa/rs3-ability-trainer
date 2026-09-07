"""Build public/data/abilities.json + public/data/buffs.json and download ability / status icons.

Source: runescape.wiki buckets `infobox_ability` and `infobox_buff`, plus the wikitext of the
linked "(status)" pages for buff durations/effects. Removed abilities (Combat Style
Modernisation, 2 March 2026, and older) are dropped. Run:  python tools/fetch-abilities.py
"""
import re

from fetch_wiki import (ASSETS, DATA, bucket, download, file_of, image_urls, parse_percent,
                        parse_ticks, slug, strip_markup, wikitext, write_json)

# abilities that do not trigger / are not blocked by the global cooldown (runescape.wiki)
# verified list, docs/research/mechanics.md §8.2 – Anticipation and Freedom are normal GCD abilities
OFF_GCD = {"Surge", "Escape", "Dive", "Bladed Dive", "Provoke", "Limitless", "Runic Charge"}
# utility-type abilities worth having; the rest are shouts, stances, slayer buffs, food, ammo slots
UTILITY_KEEP = {"Surge", "Escape", "Dive", "Limitless", "Runic Charge"}
# (Bladed Dive is typed "Basic" on the wiki, not Utility - it is kept because it can be cast during the GCD)
# Demoralise: the Ranged version was removed 2 March 2026, the Constitution version never went live
SKIP_NAMES = {"Revolution", "Single-Way Wilderness", "Magma Tempest (Targeted)", "Demoralise"}
STYLE = {"Attack": "Melee", "Strength": "Melee", "Melee": "Melee", "Ranged": "Ranged", "Magic": "Magic",
         "Necromancy": "Necromancy", "Defence": "Defence", "Constitution": "Constitution"}
TYPE_ORDER = {"Basic": 0, "Enhanced": 1, "Threshold": 2, "Ultimate": 3, "Utility": 4, "Special": 5, "Incantation": 6}
STYLE_ORDER = {"Melee": 0, "Ranged": 1, "Magic": 2, "Necromancy": 3, "Defence": 4, "Constitution": 5}

# ---------------------------------------------------------------------------------------------------------------
# What the damage fields mean (docs/research/post-combat-change-review.md 3):
#   damageMin / damageMax  damage of ONE hit against a single target, in % of ability damage, exactly as the wiki's
#                          ability text states it ("225%-275% Necromancy damage per hit"). The engine falls back to
#                          these when the rule in src/app/engine/rules-*.ts carries no `hitDamage` of its own.
#   hits                   how many hits a SINGLE target takes (Ricochet's missing secondaries return to the
#                          primary, Death Skulls bounces back, a DoT hits N times); null when nothing is dealt.
#   damageAvg / damageText the wiki infobox's total, verbatim. Deliberately NOT damageMin..damageMax x hits:
#                          decaying DoTs (Corruption Shot), flat bleeds (Massacre), guaranteed crits (Smoke
#                          Tendrils) and Rage stacks (the conjures) make the total differ from the naive product.
#
# HITS holds the single-target hit counts the ability text does not spell out; the wiki sentence naming the number
# is quoted on every entry. Everything else is parsed. Checked against runescape.wiki on 2026-09-07.
HITS = {
    # "The target will be hit for an additional 15-20% Ranged damage (4-6% Ranged damage after 2 hits) for each
    # enemy that cannot be found." -> 1 primary hit + 6 returning secondaries (/w/Greater_Ricochet)
    "Greater Ricochet": 7,
    # "...and up to 2 additional enemies within 5 tiles of the target. The target will be hit for an additional
    # 15%-20% Ranged damage for each enemy that cannot be found." (/w/Ricochet)
    "Ricochet": 3,
    # "In a single-target scenario, the skulls will hit the monster a maximum of three times (monster, player,
    # monster, player, and monster once more)." (/w/Death_Skulls)
    "Death Skulls": 3,
    # "While commanded, the Skeleton Warrior will attack 10 times over the duration" - the infobox's "2 hits" is
    # what the uncommanded skeleton would land in those 6 seconds (/w/Command_Skeleton_Warrior)
    "Command Skeleton Warrior": 10,
    # "135%-165% Necromancy damage is dealt for each stack of Residual Soul consumed"; "Equipping a soulbound
    # lantern increases the cap for Residual Soul stacks to five" (/w/Volley_of_Souls)
    "Volley of Souls": 5,
    # "135%-165% Necromancy damage. / Applies Bloated to the target for 10 hits." -> the direct hit plus 10 DoT
    # hits of "25% of initial damage per hit every 1.8s (3 ticks)" (/w/Bloat)
    "Bloat": 11,
    # "10%-20% Magic damage per hit every 1.8s (3 ticks) ... 30s (50 ticks) duration" -> 50 / 3 (/w/Sunshine)
    "Sunshine": 16,
    # "10-20 Magic damage per hit every 1.8s (3 ticks) ... 37.8s (63 ticks) duration" -> 63 / 3; 21 x 15% is the
    # infobox's 315% (/w/Greater_Sunshine)
    "Greater Sunshine": 21,
    # "22%-28% Necromancy Spirit damage every 3s (5 ticks)" over the 100-tick conjure -> 20 attacks; with "Damage
    # is increased by 3% for each Rage stack" those are the infobox's 642.5% (/w/Conjure_Skeleton_Warrior)
    "Conjure Skeleton Warrior": 20,
    # "18%-22% Necromancy Spirit damage every 3.6s (6 ticks)" over 100 ticks -> 16 attacks; the remainder of the
    # infobox's 650% is the zombie's poison aura (/w/Conjure_Putrid_Zombie)
    "Conjure Putrid Zombie": 16,
    # "18%-22% Necromancy Spirit damage every 4.2s (7 ticks)" over 100 ticks -> 14 attacks = the infobox's 280%
    # (/w/Conjure_Vengeful_Ghost)
    "Conjure Vengeful Ghost": 14,
}


def parse_damage_range(desc: str, damage_field: str) -> tuple[float | None, float | None, int | None]:
    """'25%-35% Melee damage per hit' + '8 hits' -> (25, 35, 8).

    `damage_field` is the infobox's plain-text damage ("300%", "None", "0% (stores 85%)"). An ability the wiki
    gives no damage (Runic Charge, Resonance, Ice Asylum) or 0% (Storm Shards, which only stores damage for
    Shatter) gets no range at all: the percentages in its text belong to a heal, a buff or a stored hit.
    """
    if re.match(r"^(none|n/a|0%)", (damage_field or "").strip(), re.I):
        return None, None, None
    # a range is a damage range only when "damage" follows it ("10-20 Magic damage per hit"); the trailing "%" is
    # optional because not every ability text writes it
    m = re.search(r"(\d+(?:\.\d+)?)%?\s*[-–]\s*(\d+(?:\.\d+)?)%?\s+(?:\w+\s+){0,2}damage", desc)
    lo, hi = (float(m.group(1)), float(m.group(2))) if m else (None, None)
    h = re.search(r"(?:^|\n)\*?\s*(\d+)\s+hits?\b", desc) or re.search(r"Attack (\d+) times", desc)
    hits = int(h.group(1)) if h else (1 if lo is not None else None)
    return lo, hi, hits


def adrenaline_text(field: str | None) -> str | None:
    """The infobox adrenaline string when it is not one plain number ("-60–0%", "Varies"), else None."""
    t = strip_markup(field)
    return None if not t or re.fullmatch(r"[+-]?\d+(?:\.\d+)?%", t) else t


def parse_duration_ticks(desc: str) -> int | None:
    """The buff / debuff window an ability opens, in ticks.

    Only "... duration" was matched before, which left nine windows null (Chain, Chaos Roar, Greater Fury,
    Tsunami, Asphyxiate, Split Soul, Invoke Death, Threads of Fate). The wiki writes them three ways:
      '* 30s (50 ticks) duration.'                                -> 50
      '... for 30s (50 ticks).' / '... within 6s (10 ticks) ...'  -> 50 / 10
      '* 20.4s duration.' (the incantation pages, no tick count)  -> 34
    """
    m = re.search(r"(\d+(?:\.\d+)?)s \((\d+) (?:game )?ticks?\) duration", desc)
    if m:
        return int(m.group(2))
    for line in desc.split("\n"):
        # "Can be recast within 24s (40 ticks) of the previous cast." (Dismember, Spectral Scythe) and "will
        # reset the cooldown of Bladed Dive if they die within 6s (10 ticks)" are recast windows, not effects
        if re.search(r"recast|cooldown", line, re.I):
            continue
        m = re.search(r"\b(?:for|within) \d+(?:\.\d+)?s \((\d+) (?:game )?ticks?\)", line)
        if m:
            return int(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*s(?:econds?)? duration", desc)
    return round(float(m.group(1)) / 0.6) if m else None


def main():
    rows = bucket("infobox_ability", ["name", "skill", "type", "level", "target", "json"])
    print(len(rows), "ability rows")
    abilities: dict[str, dict] = {}
    for r in rows:
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        typ = j.get("type") or r.get("type") or ""
        skill = j.get("skill") or r.get("skill") or ""
        if not name or name in SKIP_NAMES or skill not in STYLE or name in abilities:
            continue
        if j.get("removal"):
            continue
        desc = strip_markup(j.get("description"))
        during_gcd = bool(re.search(r"during the global cooldown", desc, re.I))
        if typ == "Utility" and name not in UTILITY_KEEP and not during_gcd:
            continue
        damage_text = strip_markup(j.get("damage"))
        lo, hi, hits = parse_damage_range(desc, damage_text)
        hits = HITS.get(name, hits)
        icon_file = file_of(j.get("image")) or (name + ".png")
        abilities[name] = {
            "id": slug(name),
            "structId": int(j["id"]) if str(j.get("id", "")).isdigit() else None,
            "name": name,
            "style": STYLE[skill],
            "type": typ,  # "Utility ability" is a class of its own since the modernisation (/w/Surge)
            "level": int(j.get("level") or 0),
            "target": j.get("target") or "Single",
            "equipment": strip_markup(j.get("equipment")) or "Any",
            "members": j.get("members") == "Yes",
            "basicAttack": bool(j.get("basic_attack")),
            "adrenaline": parse_percent(j.get("adrenaline")),
            # the infobox text whenever the cost is not a single number: Finger of Death "-60–0%"
            # ("Adrenaline cost is reduced by 10% for each Necrosis stack." – free at 6), the special-attack
            # slots "Varies". `adrenaline` then holds the worst case, this the whole truth.
            "adrenalineText": adrenaline_text(j.get("adrenaline")),
            "cooldownTicks": parse_ticks(strip_markup(j.get("cooldown"))),
            "damageAvg": parse_percent(j.get("damage")),
            "damageText": damage_text,
            "damageMin": lo,
            "damageMax": hi,
            "hits": hits,
            "channelled": bool(re.search(r"(?m)^\*?\s*Channell?ed\.?$", desc)),
            "durationTicks": parse_duration_ticks(desc),
            "description": desc,
            "buffs": [b["id"] for b in j.get("buffs", []) if isinstance(b, dict) and "id" in b],
            "icon": "assets/abilities/" + slug(name) + ".png",
            "_iconFile": icon_file,
            "triggersGcd": name not in OFF_GCD and not during_gcd,
        }

    # Necromancy incantations (Split Soul, Invoke Death, Threads of Fate, ...) are cast like abilities
    for r in bucket("infobox_incantation", ["name", "json"]):
        j = r["json"]
        name = j.get("name") or r.get("name") or ""
        if not name or name in abilities or "Teleport" in name or j.get("removal"):
            continue
        desc = strip_markup(j.get("description"))
        cd = j.get("cooldown")
        dur = j.get("duration")
        abilities[name] = {
            "id": slug(name), "structId": None, "name": name, "style": "Necromancy", "type": "Incantation",
            "level": int(j.get("level") or 0), "target": j.get("target") or "Self", "equipment": "Any",
            "members": True, "basicAttack": False, "adrenaline": 0.0, "adrenalineText": None,
            "cooldownTicks": int(cd) if str(cd).isdigit() else parse_ticks(strip_markup(str(cd))) if cd else None,
            "damageAvg": None, "damageText": "", "damageMin": None, "damageMax": None, "hits": None, "channelled": False,
            "durationTicks": int(dur) if str(dur).isdigit() else parse_duration_ticks(desc),
            "description": desc, "buffs": [], "icon": "assets/abilities/" + slug(name) + ".png",
            "_iconFile": file_of(j.get("image")) or (name + " icon.png"), "triggersGcd": True,
        }

    # ---- buffs / debuffs linked from abilities
    buff_rows = bucket("infobox_buff", ["id", "json"])
    print(len(buff_rows), "buff rows")
    wanted = {bid for a in abilities.values() for bid in a["buffs"]}
    specs_file = DATA / "specs.json"
    if specs_file.exists():  # status effects of weapon special attacks share buffs.json
        import json as _json
        for sp in _json.loads(specs_file.read_text(encoding="utf-8")):
            wanted.update(b["id"] for b in sp.get("buffs", []) if b.get("id", -1) >= 0)
    buffs: dict[int, dict] = {}
    for r in buff_rows:
        j = r["json"]
        bid = r.get("id")
        if bid not in wanted or j.get("removal"):
            continue
        version = j.get("version") or j.get("displayedon") or "Self"
        b = buffs.setdefault(bid, {"id": bid, "name": j.get("name"), "kind": j.get("buffordebuff") or "Buff",
                                   "category": j.get("cat"), "desc": strip_markup(j.get("desc")),
                                   "iconSelf": None, "iconTarget": None, "_files": {}})
        f = file_of(j.get("image"))
        if f:
            key = "iconTarget" if version == "Target" else "iconSelf"
            b["_files"][key] = f
            b[key] = "assets/status/" + slug(f[:-4]) + ".png"
        if version == "Self" or not b["desc"]:
            b["desc"] = strip_markup(j.get("desc")) or b["desc"]
            b["kind"] = j.get("buffordebuff") or b["kind"]
    print(len(buffs), "buffs used by abilities")

    # duration / effects from the "(status)" pages
    pagenames = {}
    for r in rows:
        for b in r["json"].get("buffs", []):
            if isinstance(b, dict) and b.get("id") in buffs:
                pagenames[b["id"]] = b["pagename"]
    if specs_file.exists():
        for sp in _json.loads(specs_file.read_text(encoding="utf-8")):
            for b in sp.get("buffs", []):
                if b.get("id") in buffs:
                    pagenames.setdefault(b["id"], b["pagename"])
    texts = wikitext(sorted(set(pagenames.values())))
    for bid, page in pagenames.items():
        t = texts.get(page, "")
        m = re.search(r"\{\{Infobox Buff details(.*?)\n\}\}", t, re.S)
        if not m:
            continue
        # `=[ \t]*` (not `\s*`): an empty "|duration =" line must not swallow the next parameter (Soul Reave, Death Spark)
        params = dict(re.findall(r"\|\s*(\w+)\s*=[ \t]*(.*?)(?=\n\||\Z)", m.group(1), re.S))
        buffs[bid]["duration"] = strip_markup(params.get("duration"))
        buffs[bid]["durationTicks"] = parse_ticks(strip_markup(params.get("duration")))
        buffs[bid]["trigger"] = strip_markup(params.get("trigger"))
        buffs[bid]["effects"] = strip_markup(params.get("effects"))

    # only the handful of abilities with a variable cost carry the field (slim_data.py keeps the files small)
    for a in abilities.values():
        if a.get("adrenalineText") is None:
            a.pop("adrenalineText", None)
    # ---- icons
    files = [a["_iconFile"] for a in abilities.values()]
    files += [f for b in buffs.values() for f in b["_files"].values()]
    urls = image_urls(files)
    missing = []
    for a in abilities.values():
        url = urls.get(a["_iconFile"])
        if url:
            download(url, ASSETS / "abilities" / (a["id"] + ".png"))
        else:
            missing.append(a["name"])
        del a["_iconFile"]
    for b in buffs.values():
        for key, f in b["_files"].items():
            url = urls.get(f)
            if url:
                download(url, ASSETS / "status" / (slug(f[:-4]) + ".png"))
            else:
                b[key] = None
        del b["_files"]
    if missing:
        print("no icon for:", ", ".join(missing))

    out = sorted(abilities.values(), key=lambda a: (STYLE_ORDER[a["style"]], TYPE_ORDER.get(a["type"], 9), a["level"], a["name"]))
    write_json(DATA / "abilities.json", out)
    write_json(DATA / "buffs.json", sorted(buffs.values(), key=lambda b: b["name"] or ""))
    print(len(out), "abilities ->", DATA / "abilities.json")


if __name__ == "__main__":
    main()
