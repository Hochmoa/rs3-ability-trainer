"""Build public/data/familiars.json: the combat familiars PvME rotations use, with their special move scrolls.
Every number below is re-checked against runescape.wiki on each run (`verify()`): the familiar page's
`Infobox Monster` gives the attack speed and the max hit of its primary style, and the scroll page's sentence
"...requiring N Summoning. Casting the special move gives X experience and costs M special move points and one
scroll." gives the Summoning level and the special move points. A mismatch is printed and the wiki value wins, so
a re-run keeps the corrections instead of restoring a stale number.  Run:  python tools/fetch-familiars.py

Damage model: a familiar hit is a flat roll between `damageMin` and `damageMax` life points (the wiki gives the max hit
only; the minimum is assumed to be half of it), every `everyTicks` ticks, first hit `firstTick` ticks after the session
start. Familiar hits never critically strike and ignore the player's ability damage.
"""
import re

from fetch_wiki import ASSETS, DATA, download, image_urls, wikitext, write_json

# id, name, pouch / binding contract item (icon), wiki page of the familiar, summoning level, attack interval (ticks),
# style, max hit, passive text, critChanceAdd, lp-scaling passive (Ripper: x(1 + 0.05 x missing LP share)),
# scroll (id, name, scroll item = wiki page, special move points, cooldown ticks, description)
FAMILIARS = [
    ("ripper-demon", "Ripper Demon", "Binding contract (ripper demon)", "Ripper Demon (familiar)", 96, 6, "Melee", 1341,
     "Deals up to 5% more damage the lower the target's life points are (×(1 + 0.05 × missing share)).", 0, 0.05,
     ("death-from-above", "Death From Above", "Ripper Demon scroll (Death From Above)", 20, 0,
      "The Ripper Demon jumps up and its next attack deals 200–320% of its max hit. 20 special move points.")),
    ("kalgerion-demon", "Kal'gerion demon", "Binding contract (kal'gerion demon)", "Kal'gerion demon (familiar)", 90, 4, "Magic", 1368,
     "+1% critical strike chance while it is out.", 0.01, 0,
     ("crit-i-kal", "Crit-i-Kal", "Kal'gerion Demon scroll (Crit-i-Kal)", 30, 0,
      "+5% critical strike chance for 60 seconds (all styles). 30 special move points; recasting refreshes the buff.")),
    ("blood-reaver", "Blood reaver", "Binding contract (blood reaver)", "Blood reaver (familiar)", 73, 5, "Magic", 672,
     "Deals 33% of your healing as damage to its target (healing is not simulated).", 0, 0,
     ("blood-siphon", "Blood Siphon", "Blood Reaver scroll (Blood Siphon)", 15, 5,
      "Transfers 5% of the familiar's max life points (up to 1,000) to you; 3 s cooldown. 15 special move points. Healing is not simulated.")),
    ("blood-nihil", "Blood nihil", "Blood nihil pouch", "Blood nihil (familiar)", 87, 4, "Melee", 768,
     "+5% melee accuracy.", 0, 0,
     ("annihilate-blood", "Annihilate (Blood nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("ice-nihil", "Ice nihil", "Ice nihil pouch", "Ice nihil (familiar)", 87, 4, "Necromancy", 768,
     "+5% necromancy accuracy.", 0, 0,
     ("annihilate-ice", "Annihilate (Ice nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("smoke-nihil", "Smoke nihil", "Smoke nihil pouch", "Smoke nihil (familiar)", 87, 4, "Magic", 768,
     "+5% magic accuracy.", 0, 0,
     ("annihilate-smoke", "Annihilate (Smoke nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("shadow-nihil", "Shadow nihil", "Shadow nihil pouch", "Shadow nihil (familiar)", 87, 4, "Ranged", 768,
     "+5% ranged accuracy.", 0, 0,
     ("annihilate-shadow", "Annihilate (Shadow nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("hellhound", "Hellhound", "Binding contract (hellhound)", "Hellhound (familiar)", 45, 4, "Melee", 576,
     "Tank familiar: absorbs 20% of the damage dealt to you (damage taken is not simulated).", 0, 0,
     # "Casting the special move gives 1 experience and costs 20 special move points and one scroll."
     # (/w/Hellhound_scroll_(Soul_Food)) - the file said 6
     ("soul-food", "Soul Food", "Hellhound scroll (Soul Food)", 20, 0,
      "Heals the hellhound for 10% of its max life points (not simulated). 20 special move points.")),
    ("pack-mammoth", "Pack mammoth", "Pack mammoth pouch", "Pack mammoth", 99, 4, "Melee", 1296,
     "Beast of burden: holds 32 items and food (not simulated).", 0, 0,
     # "Casting the special move gives 5 experience and costs 20 special move points and one scroll."
     # (/w/Pack_Mammoth_scroll_(Mammoth_Feast)) - the file said 6
     ("mammoth-feast", "Mammoth Feast", "Pack Mammoth scroll (Mammoth Feast)", 20, 0,
      "Eats a piece of food from the mammoth's inventory and heals you with it without draining adrenaline (not simulated). 20 special move points.")),
    # "The King of the Titans!" - |speed=8, |max_ranged=1296.0, |primarystyle=ranged (/w/Steel_titan). The scroll
    # "costs 18 special move points" and "inflicts four ranged or melee attacks (depending on distance from target)
    # instead of one in the next attack" (/w/Steel_Titan_scroll_(Steel_of_Legends)).
    ("steel-titan", "Steel titan", "Steel titan pouch", "Steel titan", 99, 8, "Ranged", 1296,
     "The strongest Summoning familiar: attacks every 8 ticks for up to 1,296 life points, ranged or melee depending on the distance.", 0, 0,
     ("steel-of-legends", "Steel of Legends", "Steel Titan scroll (Steel of Legends)", 18, 0,
      "The titan's next attack lands four hits instead of one (ranged or melee, depending on the distance to the target). 18 special move points; the extra hits are not simulated.")),
]

MIN_SHARE = 0.5  # assumed minimum hit as a share of the max hit (the wiki gives no minimum)
MAX_HIT_PARAM = {"Melee": "max_melee", "Ranged": "max_ranged", "Magic": "max_magic", "Necromancy": "max_necromancy"}


def _param(text: str, key: str) -> str | None:
    """First '|key = value' of the page (every familiar page opens with its Infobox Monster)."""
    m = re.search(r"\|\s*" + key + r"\s*=\s*([^\n|}]*)", text)
    return m.group(1).strip() if m else None


def verify(row: tuple, pages: dict[str, str]) -> tuple[int, int, int, int]:
    """(level, everyTicks, maxHit, specialPoints) read off the wiki; every disagreement with the table is printed."""
    _, name, _, page, level, every, style, max_hit, _, _, _, scroll = row
    fam_text, scroll_text = pages.get(page, ""), pages.get(scroll[2], "")
    out = {"level": level, "everyTicks": every, "maxHit": max_hit, "specialPoints": scroll[3]}
    speed = _param(fam_text, "speed")
    if speed and speed.isdigit():
        out["everyTicks"] = int(speed)
    hit = _param(fam_text, MAX_HIT_PARAM[style])
    if hit:
        try:
            out["maxHit"] = int(float(hit))
        except ValueError:
            pass
    m = re.search(r"requiring (\d+) \[\[Summoning\]\].*?costs (\d+) \[\[Special moves#Points", scroll_text, re.S)
    if m:
        out["level"], out["specialPoints"] = int(m.group(1)), int(m.group(2))
    else:
        print("  ! %s: no 'costs N special move points' sentence on %s" % (name, scroll[2]))
    for key, table in (("level", level), ("everyTicks", every), ("maxHit", max_hit), ("specialPoints", scroll[3])):
        if out[key] != table:
            print("  ! %s %s: table %s, wiki %s - using the wiki" % (name, key, table, out[key]))
    return out["level"], out["everyTicks"], out["maxHit"], out["specialPoints"]


def main():
    pages = wikitext(sorted({r[3] for r in FAMILIARS} | {r[11][2] for r in FAMILIARS}))
    out = []
    files = {}
    for row in FAMILIARS:
        fid, name, pouch, _page, _level, _every, style, _max_hit, passive, crit, lp_scale, scroll = row
        sid, sname, sitem, _points, cd, text = scroll
        level, every, max_hit, points = verify(row, pages)
        files[fid] = pouch + ".png"
        files["scroll:" + sid] = sitem + ".png"
        out.append({
            "id": fid, "name": name, "level": level, "icon": "assets/familiars/" + fid + ".png",
            "attack": {"everyTicks": every, "firstTick": every, "style": style, "damageMin": round(max_hit * MIN_SHARE), "damageMax": max_hit},
            "passive": passive, "critChanceAdd": crit, "damagePerMissingLp": lp_scale,
            "scroll": {"id": sid, "name": sname, "icon": "assets/familiars/" + sid + ".png", "specialPoints": points, "cooldownTicks": cd, "description": text},
        })
    urls = image_urls(list(files.values()))
    for key, file in files.items():
        url = urls.get(file)
        target = ASSETS / "familiars" / (key.replace("scroll:", "") + ".png")
        if url:
            download(url, target)
        else:
            print("no icon for", key, file)
    write_json(DATA / "familiars.json", out)
    print(len(out), "familiars ->", DATA / "familiars.json")


if __name__ == "__main__":
    main()
