"""Build public/data/spells.json: the combat spells of the three spellbooks that are pressed as actions
(Disruption Shield, Vengeance, Smoke Cloud, Vulnerability ...) or selected as the auto-cast attack spell
(Exsanguinate, Incite Fear, the Barrages ...), and download their icons into public/assets/spells/.

Level, description, icon and the wiki id come from the runescape.wiki bucket `infobox_spell`; cooldown,
duration, GCD behaviour and the effect summary are hand-checked against the wiki (docs/research/spells.md,
2026-09-04) because the infobox `cooldown` field is the cast speed, not an ability cooldown.

Run:  python tools/fetch-spells.py
"""
from fetch_wiki import ASSETS, DATA, bucket_all, download, file_of, image_urls, slug, strip_markup, write_json

# name, book, kind, triggers the GCD, cooldown ticks, duration ticks (None = until removed / consumed), effect summary
# kind: "cast" = pressed as an action, "autocast" = combat spell selected as the basic Magic attack (no cast of its own)
SPELLS = [
    # ---------------------------------------------------------------- Lunar
    ("Disruption Shield", "lunar", "cast", False, 100, None,
     "Blocks the next hit you take (one hitsplat of melee, ranged, magic, necromancy or soft typeless damage). Off the global cooldown, 60 s cooldown; cannot be recast while it is still up. Takes priority over Vengeance and Resonance."),
    ("Vengeance", "lunar", "cast", False, 50, None,
     "The next hit you take deals 75% of its damage back to the attacker (cap 8,000, boosted by Vulnerability). You still take the full hit. Off the global cooldown; 30 s cooldown shared with Vengeance Other / Group."),
    ("Vengeance Other", "lunar", "cast", False, 50, None,
     "Vengeance on the targeted player. Off the global cooldown; shares the 30 s Vengeance cooldown."),
    ("Vengeance Group", "lunar", "cast", False, 50, None,
     "Vengeance on yourself and every player within 4 tiles (up to 50). Off the global cooldown; shares the 30 s Vengeance cooldown."),
    ("Heal Other", "lunar", "cast", True, 0, None,
     "Consumes 75% of your current life points to heal the targeted player."),
    ("Heal Group", "lunar", "cast", True, 0, None,
     "Consumes 75% of your current life points to heal all nearby players."),
    ("Cure Me", "lunar", "cast", True, 0, None,
     "Cures poison."),
    ("Spellbook Swap", "lunar", "cast", False, 0, 200,
     "Cast a single spell from the Standard or Ancient spellbook (up to 2 minutes to use it). Off the global cooldown from the action bar."),
    # ---------------------------------------------------------------- Ancient Magicks
    ("Animate Dead", "ancient", "cast", False, 0, 1200,
     "Flat damage reduction from worn magic tank armour (10% of its armour value per piece + 25% of your Defence level, max 60%) for 12 minutes. Ignores the global cooldown and does not interrupt channels."),
    ("Smoke Cloud", "ancient", "cast", True, 0, 200,
     "Target debuff for 2 minutes: critical strike damage against it +15% (+6% for non-magic attacks). A normal GCD cast, no magic weapon needed."),
    ("Penance", "ancient", "cast", True, 0, 1200,
     "For 12 minutes 5% of the damage you take is restored as prayer points (up to 100 per hit)."),
    ("Vampyrism", "ancient", "cast", True, 0, 1200,
     "For 12 minutes heal 5% of the damage you deal (up to 50 life points per hit)."),
    ("Intercept", "ancient", "cast", True, 0, 17,
     "Ward on an ally for 10 seconds: you take the damage they would receive, reduced by 5%."),
    ("Shield Dome", "ancient", "cast", True, 0, 25,
     "Energy shield for 15 seconds reducing damage to every player inside by up to 50% (diminishing on repeated casts)."),
    ("Exsanguinate", "ancient", "autocast", False, 0, None,
     "Auto-cast fire spell: every ability cast grants a Blood Tithe stack (max 12, 20 s), +1% basic ability damage per stack."),
    ("Incite Fear", "ancient", "autocast", False, 0, None,
     "Auto-cast water spell: every ability cast grants a Glacial Embrace stack (max 5, 20 s); at 5 stacks Frost Surge fires (12 s cooldown) and Tsunami costs 12% less per stack."),
    ("Ice Barrage", "ancient", "autocast", False, 0, None,
     "Auto-cast water spell: hits a 3x3 area and freezes creatures for up to 9.6 s."),
    ("Blood Barrage", "ancient", "autocast", False, 0, None,
     "Auto-cast fire spell: hits a 3x3 area and heals 5% of the damage dealt."),
    ("Smoke Barrage", "ancient", "autocast", False, 0, None,
     "Auto-cast air spell: hits a 3x3 area and lowers the targets' accuracy by 5% for 10 s."),
    ("Shadow Barrage", "ancient", "autocast", False, 0, None,
     "Auto-cast earth spell: hits a 3x3 area and lowers the targets' damage by 5% for 10 s."),
    # ---------------------------------------------------------------- Standard
    ("Vulnerability", "standard", "cast", True, 0, 100,
     "Target takes 10% more damage for 1 minute (the same debuff as a vulnerability bomb). A normal GCD cast, no magic weapon needed."),
    ("Enfeeble", "standard", "cast", True, 0, 100,
     "Target deals 10% less damage for 1 minute. A normal GCD cast."),
    ("Stagger", "standard", "cast", True, 0, 100,
     "Target's chance to hit −10% for 1 minute. A normal GCD cast."),
    ("Bind", "standard", "cast", True, 0, 20,
     "Holds a creature in place for 12 seconds (players 6 s). A normal GCD cast."),
    ("Snare", "standard", "cast", True, 0, 30,
     "Holds a creature in place for 18 seconds (players 9 s). A normal GCD cast."),
    ("Entangle", "standard", "cast", True, 0, 40,
     "Holds a creature in place for 24 seconds (players 12 s). A normal GCD cast."),
    ("Air Surge", "standard", "autocast", False, 0, None, "Auto-cast air spell (the strongest standard air attack)."),
    ("Water Surge", "standard", "autocast", False, 0, None, "Auto-cast water spell."),
    ("Earth Surge", "standard", "autocast", False, 0, None, "Auto-cast earth spell."),
    ("Fire Surge", "standard", "autocast", False, 0, None, "Auto-cast fire spell (the strongest standard attack spell)."),
]
BOOK_OF_WIKI = {"standard": "standard", "ancient": "ancient", "lunar": "lunar"}


def main():
    rows = bucket_all("infobox_spell", ["name", "level", "spellbook", "json"])
    by_name = {}
    for r in rows:
        j = r.get("json") or {}
        name = j.get("name") or r.get("name") or ""
        if name and name not in by_name:
            by_name[name] = r
    out = []
    files = {}
    for name, book, kind, gcd, cd, dur, effect in SPELLS:
        r = by_name.get(name)
        j = (r or {}).get("json") or {}
        wiki_book = str(j.get("spellbook") or (r or {}).get("spellbook") or "").lower()
        if r and BOOK_OF_WIKI.get(wiki_book, wiki_book) != book:
            print("book mismatch", name, wiki_book, "!=", book)
        level = int((r or {}).get("level") or j.get("level") or 0)
        try:
            wiki_id = int(j.get("id")) if j.get("id") not in (None, "") else None
        except (TypeError, ValueError):
            wiki_id = None
        icon_file = file_of(j.get("image")) or (name + " icon.png")
        sid = slug(name)
        files[sid] = icon_file
        out.append({
            "id": sid,
            "name": name,
            "book": book,
            "level": level,
            "kind": kind,
            "gcd": gcd,
            "cooldownTicks": cd,
            "durationTicks": dur,
            "description": strip_markup(j.get("description")) or effect,
            "effect": effect,
            "icon": "assets/spells/" + sid + ".png",
            "wikiId": wiki_id,
        })
        if not r:
            print("not in the wiki bucket:", name)
    urls = image_urls(list(files.values()))
    for s in out:
        url = urls.get(files[s["id"]])
        if url:
            download(url, ASSETS / "spells" / (s["id"] + ".png"))
        else:
            print("no icon for", s["name"], files[s["id"]])
    order = {"standard": 0, "ancient": 1, "lunar": 2}
    out.sort(key=lambda s: (order[s["book"]], s["level"], s["name"]))
    write_json(DATA / "spells.json", out)
    print(len(out), "spells ->", DATA / "spells.json")


if __name__ == "__main__":
    main()
