"""Build public/data/familiars.json: the combat familiars PvME rotations use, with their special move scrolls.
Numbers hand-checked against runescape.wiki on 2026-09-04 (familiar pages + scroll pages); icons are the pouch /
scroll item icons from the wiki.  Run:  python tools/fetch-familiars.py

Damage model: a familiar hit is a flat roll between `damageMin` and `damageMax` life points (the wiki gives the max hit
only; the minimum is assumed to be half of it), every `everyTicks` ticks, first hit `firstTick` ticks after the session
start. Familiar hits never critically strike and ignore the player's ability damage.
"""
from fetch_wiki import ASSETS, DATA, download, image_urls, write_json

# id, name, pouch / binding contract item (icon), summoning level, attack interval (ticks), style, max hit, passive text, critChanceAdd,
# lp-scaling passive (Ripper: ×(1 + 0.05 × missing LP share)), scroll
FAMILIARS = [
    ("ripper-demon", "Ripper Demon", "Binding contract (ripper demon)", 96, 6, "Melee", 1341,
     "Deals up to 5% more damage the lower the target's life points are (×(1 + 0.05 × missing share)).", 0, 0.05,
     ("death-from-above", "Death From Above", "Ripper Demon scroll (Death From Above)", 20, 0,
      "The Ripper Demon jumps up and its next attack deals 200–320% of its max hit. 20 special move points.")),
    ("kalgerion-demon", "Kal'gerion demon", "Binding contract (kal'gerion demon)", 90, 4, "Magic", 1368,
     "+1% critical strike chance while it is out.", 0.01, 0,
     ("crit-i-kal", "Crit-i-Kal", "Kal'gerion Demon scroll (Crit-i-Kal)", 30, 0,
      "+5% critical strike chance for 60 seconds (all styles). 30 special move points; recasting refreshes the buff.")),
    ("blood-reaver", "Blood reaver", "Binding contract (blood reaver)", 73, 5, "Magic", 672,
     "Deals 33% of your healing as damage to its target (healing is not simulated).", 0, 0,
     ("blood-siphon", "Blood Siphon", "Blood Reaver scroll (Blood Siphon)", 15, 5,
      "Transfers 5% of the familiar's max life points (up to 1,000) to you; 3 s cooldown. 15 special move points. Healing is not simulated.")),
    ("blood-nihil", "Blood nihil", "Blood nihil pouch", 87, 4, "Melee", 768,
     "+5% melee accuracy (accuracy is not simulated).", 0, 0,
     ("annihilate-blood", "Annihilate (Blood nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("ice-nihil", "Ice nihil", "Ice nihil pouch", 87, 4, "Necromancy", 768,
     "+5% necromancy accuracy (accuracy is not simulated).", 0, 0,
     ("annihilate-ice", "Annihilate (Ice nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("smoke-nihil", "Smoke nihil", "Smoke nihil pouch", 87, 4, "Magic", 768,
     "+5% magic accuracy (accuracy is not simulated).", 0, 0,
     ("annihilate-smoke", "Annihilate (Smoke nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("shadow-nihil", "Shadow nihil", "Shadow nihil pouch", 87, 4, "Ranged", 768,
     "+5% ranged accuracy (accuracy is not simulated).", 0, 0,
     ("annihilate-shadow", "Annihilate (Shadow nihil)", "Nihil scroll (Annihilate)", 20, 0,
      "Attacks the target, 50–60% chance to stun it for 3.6 s (the wiki gives no damage numbers – dealt as a normal familiar hit). 20 special move points.")),
    ("hellhound", "Hellhound", "Binding contract (hellhound)", 45, 4, "Melee", 576,
     "Tank familiar: absorbs 20% of the damage dealt to you (damage taken is not simulated).", 0, 0,
     ("soul-food", "Soul Food", "Hellhound scroll (Soul Food)", 6, 0,
      "Heals the hellhound for 10% of its max life points (not simulated). 6 special move points.")),
    ("pack-mammoth", "Pack mammoth", "Pack mammoth pouch", 99, 4, "Melee", 1296,
     "Beast of burden: holds 32 items and food (not simulated).", 0, 0,
     ("mammoth-feast", "Mammoth Feast", "Pack Mammoth scroll (Mammoth Feast)", 6, 0,
      "Eats a piece of food from the mammoth's inventory and heals you with it without draining adrenaline (not simulated). 6 special move points.")),
]

MIN_SHARE = 0.5  # assumed minimum hit as a share of the max hit (the wiki gives no minimum)


def main():
    out = []
    files = {}
    for fid, name, pouch, level, every, style, max_hit, passive, crit, lp_scale, scroll in FAMILIARS:
        sid, sname, sitem, points, cd, text = scroll
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
