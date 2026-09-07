"""Build public/data/presets.json: every PvME boss guide as a boss setup (gear preset + rotations), loadable on the Presets page.

Sources: PvME boss guides (github.com/pvme/pvme-guides, rs3-full-boss-guides/) for the rotations and the preset links, the
PvME preset maker storage (github.com/pvme/preset-maker-storage) for the worn gear and backpack. Gear and ability aliases
resolve through public/data/pvme-aliases.json; unknown gear is listed in `unknown` so the page can say what was left out.

The guide list comes from the GitHub tree of the repo, so new guides show up on the next run. Per guide:
* boss = BOSS_NAMES[folder or file stem], style = the first style word of the file name (hybrids: the other styles go
  into the title), variant = the rest of the file name ("HM solo", "1000% group", "minion tank");
* a guide without a style word but with style-named headings ("## Melee Method", "## T90 Necro Rotation") becomes one
  preset per heading, its preset id taken from the link whose label names the style;
* rotations = `##`/`###` sections (and bold "… Rotation" labels) that contain an ability line with an arrow;
  mechanics / overview / tips guides and guides without such a section are skipped.
OVERRIDES pins a preset id, section filter or variant for the few guides that need one.

    python tools/fetch-presets.py                 # fetch everything
    PVME_CACHE=dir python tools/fetch-presets.py  # keep the fetched files in `dir` and reuse them next time
"""
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

from fetch_wiki import DATA, UA, write_json

REPO_TREE = "https://api.github.com/repos/pvme/pvme-guides/git/trees/master?recursive=1"
GUIDE_DIR = "rs3-full-boss-guides/"
GUIDES = "https://raw.githubusercontent.com/pvme/pvme-guides/master/" + GUIDE_DIR
GUIDE_WEB = "https://github.com/pvme/pvme-guides/blob/master/" + GUIDE_DIR
STORE = "https://raw.githubusercontent.com/pvme/preset-maker-storage/master/presets/"

# folder (or single-file stem) -> boss name as shown on the page
BOSS_NAMES = {
    "amascut": "Amascut, the Devourer",
    "angel-of-death-7s": "Angel of Death (7-man)",
    "angel-of-death-small-teams": "Angel of Death (small teams)",
    "araxxor": "Araxxor",
    "arch-glacor": "Arch-Glacor",
    "barrows": "Barrows",
    "beastmaster-durzag": "Beastmaster Durzag",
    "corporeal-beast": "Corporeal Beast",
    "croesus": "Croesus",
    "dagannoth-kings": "Dagannoth Kings",
    "ed1-temple-of-aminishi": "ED1 – Temple of Aminishi",
    "ed2-dragonkin-laboratory": "ED2 – Dragonkin Laboratory",
    "ed3-shadow-reef": "ED3 – The Shadow Reef",
    "fight-kiln": "Fight Kiln",
    "flesh-hatcher-mhekarnahz": "Flesh-hatcher Mhekarnahz",
    "gate-of-elidinis": "Gate of Elidinis",
    "giant-mole-hm": "Giant Mole (HM)",
    "gregorovic": "Gregorovic",
    "helwyr": "Helwyr",
    "hermod": "Hermod, the Spirit of War",
    "kalphite-king": "Kalphite King",
    "kalphite-queen": "Kalphite Queen",
    "kerapac": "Kerapac, the bound",
    "legiones": "Legiones",
    "magister": "The Magister",
    "nex": "Nex",
    "queen-black-dragon": "Queen Black Dragon",
    "raksha": "Raksha, the Shadow Colossus",
    "rasial": "Rasial, the First Necromancer",
    "rex-matriarchs": "Rex Matriarchs",
    "rise-of-the-six": "Rise of the Six",
    "sanctum": "Sanctum of Rebirth",
    "solak": "Solak",
    "telos": "Telos, the Warden",
    "twin-furies": "Twin Furies",
    "tzkal-zuk": "TzKal-Zuk",
    "vindicta": "Vindicta",
    "vorago": "Vorago",
    "vorago-hm": "Vorago (HM)",
    "vorkath": "Vorkath",
    "yakamaru": "Yakamaru",
    "zamorak": "Zamorak, Lord of Chaos",
}
# per guide path: "id" = fixed preset id, "filter" = regex on the `##` heading the rotations must sit under, "variant" = fixed variant,
# "first" = the preset the Train page's "Load a demo" uses (stays presets[0])
OVERRIDES: dict[str, dict] = {
    "rasial.txt": {"id": "63366c75-7dcb-4514-a8a4-723577a98b92", "filter": r"T90 Equilibrium", "variant": "T90 Equilibrium", "first": True},
    "telos/necromancy.txt": {"filter": r"Safe Push", "variant": "Safe Push"},
    "rex-matriarchs/rex-rotations.txt": {"variant": "all matriarchs"},
}
# guides that describe the boss, not a way to kill it
SKIP_NAMES = re.compile(r"mechanics|overview|tips-and-tricks|stuns|movement")

STYLE_WORDS = {"necro": "Necromancy", "necromancy": "Necromancy", "melee": "Melee", "ranged": "Ranged", "range": "Ranged", "bolg": "Ranged", "magic": "Magic", "mage": "Magic", "fsoa": "Magic"}
# file-name words that are neither boss, style nor variant
NOISE_WORDS = {"hybrid", "guide", "rots", "rotations", "rotation", "aod", "bm", "vork", "zuk", "rex", "and", "ed1", "ed2", "ed3", "method", "strategy", "only", "preset", "presets"}
VARIANT_WORDS = {"hm": "HM", "nm": "NM", "hmvork": "HM", "mt": "minion tank", "4man": "4-man", "7s": "7-man", "4s": "4-man", "1mid": "1 mid", "kph": "KPH", "t90": "T90", "t95": "T95", "t100": "T100", "hamm": "HAMM", "orikalka": "Orikalka", "osseous": "Osseous", "pthentraken": "Pthentraken", "rathis": "Rathis"}
# PvME preset maker equipment slot order
EQUIP_SLOTS = ["head", "cape", "neck", "mainHand", "body", "offHand", "legs", "hands", "feet", "ring", "ammo", "aura", "pocket"]
EMOJI = re.compile(r"<a?:([A-Za-z0-9_]+):\d+>")
LINK = re.compile(r"\[([^\]]+)\]\(<?[^)]*>?\)")
PRESET_LINK = re.compile(r"(?:\[([^\]]*)\]\(<?)?https?://presets\.pvme\.io/?\?id=([A-Za-z0-9-]+)")
ARROW = re.compile(r"→|->")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def fetch_cached(name: str, url: str) -> str:
    """fetch(), kept under $PVME_CACHE/<name> when that is set (re-runs while tuning the tool then need no network)."""
    cache = os.environ.get("PVME_CACHE")
    if not cache:
        return fetch(url)
    path = Path(cache) / name
    if path.exists():
        return path.read_text(encoding="utf-8")
    text = fetch(url)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return text


def guide_paths() -> list[str]:
    """every file below rs3-full-boss-guides/ in the PvME guides repo, relative to that folder"""
    tree = json.loads(fetch_cached("_tree.json", REPO_TREE))["tree"]
    return sorted(e["path"][len(GUIDE_DIR):] for e in tree if e["type"] == "blob" and e["path"].startswith(GUIDE_DIR))


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
    s = s.replace("⬥", "").replace("•", "").replace("⬩", "").replace(" ", " ").replace("​", "")
    return re.sub(r"[ \t]+", " ", s).strip()


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def words_of(s: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9]+", s.lower()) if w]


def style_of_heading(title: str) -> str | None:
    """the style a short heading names ("Melee Method", "T90 Necro Rotation", "Ranged"); None for phases and prose"""
    words = words_of(title)
    if len(words) > 5:
        return None
    styles = [STYLE_WORDS[w] for w in words if w in STYLE_WORDS]
    return styles[0] if len(set(styles)) == 1 else None


# ---------------------------------------------------------------- guide text


def sections(text: str) -> list[dict]:
    """
    The guide cut into sections: every `##` and `###` heading opens one, a bold "… Rotation" label opens a sub-section.
    Each has name, parent (the heading above it), h2 / h3 (the `##` / `###` heading it sits under, itself included), the ability lines
    (with an emoji or an arrow, cleaned) and the emoji names of those lines. Only sections with an arrow line are kept:
    those are rotations, the others describe the boss.
    """
    out: list[dict] = []
    h2 = ""
    h3 = ""
    current: dict | None = None
    in_embed = False

    def open_section(name: str, parent: str) -> dict:
        s = {"name": name, "parent": parent, "h2": h2, "h3": h3, "lines": [], "raw": [], "emoji": []}
        out.append(s)
        return s

    for raw in text.splitlines():
        if in_embed:
            in_embed = not raw.startswith(".embed")
            continue
        if raw.strip() == "{":
            in_embed = True
            continue
        m2 = re.match(r"^##\s+_*(.+?)_*\s*(<a?:[^>]+>\s*)*$", raw)
        m3 = re.match(r"^###\s+_*(.+?)_*\s*(<a?:[^>]+>\s*)*$", raw)
        bold = re.match(r"^\*\*_{0,2}([^*<]+?)_{0,2}\*\*\s*:?\s*$", raw)
        if m2:
            h2 = clean_line(m2.group(1))
            h3 = ""
            current = open_section(h2, "")
            continue
        if m3:
            h3 = clean_line(m3.group(1))
            current = open_section(h3, h2)
            continue
        if bold and re.search(r"rotation", bold.group(1), re.I) and current is not None:
            current = open_section(clean_line(bold.group(1)), current["name"])
            continue
        if raw.startswith(".") or not current:
            continue
        if "<:" in raw or ARROW.search(raw):
            current["lines"].append(clean_line(raw))
            current["raw"].append(raw)
            current["emoji"].extend(m.lower() for m in EMOJI.findall(raw))
    return [s for s in out if any(ARROW.search(l) for l in s["raw"])]


def rotations_of(secs: list[dict], section_filter: str | None) -> list[dict]:
    """{name, text} per section (under a `##` matching the filter, when given); names used twice get their parent heading in front"""
    secs = [s for s in secs if not section_filter or re.search(section_filter, s["h2"])]
    # "### Note:" under "## T90 Necro Rotation" is that rotation
    own = [s["parent"] if s["name"].rstrip(":").lower() in ("note", "notes") and s["parent"] else s["name"].rstrip(":") for s in secs]
    count = Counter(own)
    names = [s["parent"] + " – " + name if count[name] > 1 and s["parent"] else name for s, name in zip(secs, own)]
    seen: Counter[str] = Counter()
    rots = []
    for s, name in zip(secs, names):
        seen[name] += 1
        if seen[name] > 1:
            name = f"{name} ({seen[name]})"
        rots.append({"name": name, "text": "\n".join(s["lines"])})
    return rots


# ---------------------------------------------------------------- names


def variant_of(stem: str, boss_key: str) -> str:
    """the descriptive part of a file name: "sanctum-hm-solo-necromancy" -> "HM solo", "zamorak-1000-ranged-melee-group" -> "1000% group\""""
    s = stem.lower()
    s = re.sub(r"(\d+)-to-(\d+)", r"\1–\2 man", s)
    s = re.sub(r"\b(\d{3,4})-(\d{3,4})\b", r"\1–\2%", s)
    s = re.sub(r"\b(\d{3,4})\b(?!%)", r"\1%", s)
    s = re.sub(r"\bhard-mode\b", "hm", s).replace("normal-mode", "nm")
    skip = set(words_of(boss_key)) | set(STYLE_WORDS) | NOISE_WORDS
    words = [VARIANT_WORDS.get(w, w) for w in re.split(r"[-_ ]+", s) if w and w not in skip]
    # difficulty first: "solo HM" reads as "HM solo"
    words.sort(key=lambda w: 0 if w in ("HM", "NM") else 1)
    return " ".join(words)


def heading_variant(title: str) -> str:
    """what a style heading says besides the style: "T95-T100 Necro Rotation" -> "T95–T100", "Melee Instance Camp (140 KPH)" -> "Instance Camp (140 KPH)\""""
    words = [w.strip("()") for w in title.replace("-", "–").split()]
    return " ".join(w for w in words if w.lower() not in STYLE_WORDS and w.lower() not in NOISE_WORDS).strip(" –")


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def title_of(boss: str, variant: str, styles: list[str]) -> str:
    label = "/".join(s.lower() for s in styles) + (" hybrid" if len(styles) > 1 else "")
    return boss + " – " + (variant + " " if variant else "") + label


def parser_tokens() -> tuple[set[str], list[str], list[str]]:
    """
    Tokens src/app/core/pvme.ts handles itself (they must not go into the alias table): the keys of PVME_MARKERS /
    PVME_TARGETS / PVME_MECHANICS, and the perk / cape / flank variant suffixes and prefixes it strips ("gricocaroming").
    """
    src = Path(__file__).resolve().parent.parent / "src" / "app" / "core" / "pvme.ts"
    if not src.exists():
        return set(), [], []
    text = src.read_text(encoding="utf-8")

    def keys_of(name: str) -> list[str]:
        m = re.search(name + r"[^{]*\{(.*?)\n\};", text, re.S)
        return re.findall(r"^\s+(\w+):", m.group(1), re.M) if m else []

    known = set(keys_of("PVME_MARKERS") + keys_of("PVME_TARGETS") + keys_of("PVME_MECHANICS"))
    m = re.search(r"VARIANT_PREFIXES = \[(.*?)\]", text)
    return known, keys_of("VARIANT_SUFFIXES"), re.findall(r"'(\w+)'", m.group(1)) if m else []


# ---------------------------------------------------------------- gear


class Gear:
    """resolves PvME preset maker slots through the alias table (and, for older presets that carry wiki names, by name)"""

    def __init__(self, aliases: dict[str, str]):
        self.aliases = aliases
        self.by_name: dict[str, str] = {}
        for f, kind in (("weapons", "gear"), ("gear", "item"), ("specials", "special")):
            for x in json.loads((DATA / f"{f}.json").read_text(encoding="utf-8")):
                self.by_name.setdefault(norm(x["name"]), kind + ":" + x["id"])

    def resolve(self, slot: dict) -> str | None:
        alias = (slot.get("id") or slot.get("label") or "").lower()
        key = self.aliases.get(alias) if alias else None
        name = slot.get("name") or ""
        if not key and name:
            base = re.sub(r"\s*\([^)]*\)", "", name)
            key = self.by_name.get(norm(name)) or self.by_name.get(norm(base))
            if not key and name.lower().startswith("essence of finality"):
                key = "item:essence-of-finality-amulet"
        return key

    def load(self, pid: str | None) -> tuple[dict, dict, list, list[str]]:
        """(raw preset, equipment, inventory, unknown labels) of a preset maker id; empty when there is none or it fails"""
        gear = {"presetName": "", "equipmentSlots": [], "inventorySlots": []}
        if pid:
            try:
                gear = json.loads(fetch_cached("_presets/" + pid + ".json", STORE + pid + ".json"))
            except Exception as e:  # noqa: BLE001
                print("preset failed", pid, e)
        unknown: list[str] = []
        equipment = {}
        for i, slot in enumerate(gear.get("equipmentSlots") or []):
            slot = slot or {}
            label = slot.get("name") or slot.get("label") or slot.get("id") or ""
            if not label or i >= len(EQUIP_SLOTS):
                continue
            key = self.resolve(slot)
            ref = ref_of(key) if key else None
            if ref and ref["kind"] != "special":
                equipment[EQUIP_SLOTS[i]] = ref  # a two-hander sits in mainHand here; the app re-slots it (presetLoadout)
            else:
                unknown.append(label)
        inventory = []
        for slot in (gear.get("inventorySlots") or [])[:28]:
            slot = slot or {}
            label = slot.get("name") or slot.get("label") or slot.get("id") or ""
            key = self.resolve(slot) if label else None
            ref = ref_of(key) if key else None
            inventory.append(ref)
            if label and not ref and label not in unknown:
                unknown.append(label)
        return gear, equipment, inventory, unknown


# ---------------------------------------------------------------- one guide -> presets


class Builder:
    def __init__(self):
        self.aliases: dict[str, str] = json.loads((DATA / "pvme-aliases.json").read_text(encoding="utf-8"))
        self.gear = Gear(self.aliases)
        self.ability_style = {a["id"]: a["style"] for a in json.loads((DATA / "abilities.json").read_text(encoding="utf-8"))}
        self.unknown_aliases: Counter[str] = Counter()
        self.parser_known, self.suffixes, self.prefixes = parser_tokens()
        self.skipped: list[tuple[str, str]] = []
        self.ids: set[str] = set()

    def dominant_style(self, secs: list[dict]) -> str | None:
        """the style most of the resolved abilities in the rotation lines belong to"""
        count: Counter[str] = Counter()
        for s in secs:
            for name in s["emoji"]:
                key = self.aliases.get(name)
                if not key:
                    continue
                if key.startswith("ability:"):
                    style = self.ability_style.get(key[8:])
                    if style in ("Melee", "Ranged", "Magic", "Necromancy"):
                        count[style] += 1
                elif key.startswith("spell:"):
                    count["Magic"] += 1
        return count.most_common(1)[0][0] if count else None

    def known(self, name: str) -> bool:
        """in the alias table, handled by the parser, or a perk variant of an alias ("overpowerigneous")"""
        if name in self.aliases or name in self.parser_known:
            return True
        if any(name.endswith(x) and name[: -len(x)] in self.aliases for x in self.suffixes):
            return True
        return any(name.startswith(x) and name[len(x):] in self.aliases for x in self.prefixes)

    def count_unknown(self, secs: list[dict]) -> None:
        for s in secs:
            for name in s["emoji"]:
                if not self.known(name):
                    self.unknown_aliases[name] += 1

    def build(self, path: str) -> list[dict]:
        """the presets of one guide file (usually one; one per style heading for multi-style guides; none when skipped)"""
        stem = re.sub(r"\.txt$", "", path.rsplit("/", 1)[-1])
        boss_key = path.split("/")[0] if "/" in path else stem
        boss = BOSS_NAMES.get(boss_key)
        if not boss:
            boss = boss_key.replace("-", " ").title()
            print("no boss name for", boss_key, "- using", boss)
        if SKIP_NAMES.search(stem):
            self.skipped.append((path, "describes mechanics / overview / tips"))
            return []
        try:
            text = fetch_cached(path, GUIDES + path)
        except Exception as e:  # noqa: BLE001
            self.skipped.append((path, "fetch failed: " + str(e)))
            return []
        over = OVERRIDES.get(path, {})
        secs = sections(text)
        if not secs:
            self.skipped.append((path, "no rotation section"))
            return []
        self.count_unknown(secs)
        links = PRESET_LINK.findall(text)  # (label, id) in guide order
        styles = list(dict.fromkeys(STYLE_WORDS[w] for w in words_of(stem) if w in STYLE_WORDS))
        variant = over.get("variant") or variant_of(stem, boss_key)

        # a guide without a style in its name but with style headings: one preset per heading
        if not styles and "filter" not in over:
            for level in ("h2", "h3"):  # `##` headings first, then `###`
                heads = list(dict.fromkeys(s[level] for s in secs if s[level] and style_of_heading(s[level])))
                if not heads:
                    continue
                out = []
                for head in heads:
                    scope = [s for s in secs if s[level] == head]
                    style = style_of_heading(head)
                    hv = heading_variant(head)
                    inner = [i for _, i in PRESET_LINK.findall(self.scope_text(text, head))]
                    pid = inner[0] if inner else self.link_for(links, style, hv)
                    out.append(self.preset(path, boss, [style], " ".join(x for x in (variant, hv) if x), pid, rotations_of(scope, None)))
                return out

        if not styles:
            style = self.dominant_style(secs)
            if not style:
                self.skipped.append((path, "no combat style found (no style in the name, no abilities in the rotations)"))
                return []
            styles = [style]
        pid = over.get("id") or (links[0][1] if links else None)
        p = self.preset(path, boss, styles, variant, pid, rotations_of(secs, over.get("filter")))
        if over.get("first"):
            p["_first"] = True
        return [p]

    @staticmethod
    def scope_text(text: str, head: str) -> str:
        """the guide text under the heading `head` up to the next heading of the same or a higher level"""
        lines = text.splitlines()
        for i, raw in enumerate(lines):
            m = re.match(r"^(##+)\s+_*(.+?)_*\s*(<a?:[^>]+>\s*)*$", raw)
            if m and clean_line(m.group(2)) == head:
                level = len(m.group(1))
                for j in range(i + 1, len(lines)):
                    m2 = re.match(r"^(##+)\s", lines[j])
                    if m2 and len(m2.group(1)) <= level:
                        return "\n".join(lines[i:j])
                return "\n".join(lines[i:])
        return ""

    @staticmethod
    def link_for(links: list[tuple[str, str]], style: str, variant: str) -> str | None:
        """the preset link whose label names the style (and, best, the variant words: "[T90 Necro](...)")"""
        want = set(words_of(variant))
        best, score = None, 0
        for label, pid in links:
            words = set(words_of(label))
            if style not in {STYLE_WORDS[w] for w in words if w in STYLE_WORDS}:
                continue
            s = 1 + len(want & words)
            if s > score:
                best, score = pid, s
        if best is None and len({pid for _, pid in links}) == 1:
            best = links[0][1]
        return best

    def preset(self, path: str, boss: str, styles: list[str], variant: str, pid: str | None, rotations: list[dict]) -> dict:
        gear, equipment, inventory, unknown = self.gear.load(pid)
        pid_id = slug(boss + " " + " ".join(styles) + " " + variant)
        base, n = pid_id, 2
        while pid_id in self.ids:
            pid_id = f"{base}-{n}"
            n += 1
        self.ids.add(pid_id)
        return {
            "id": pid_id,
            "boss": boss,
            "style": styles[0],
            "variant": variant,
            "title": title_of(boss, variant, styles),
            "guide": GUIDE_WEB + path,
            "presetUrl": ("https://pvme.io/preset-maker/#/" + pid) if pid else None,
            "notes": clean_line(re.sub(r"<[^>]+>", "", gear.get("presetNotes") or "")),
            "equipment": equipment,
            "inventory": inventory,
            "unknown": unknown,
            "rotations": rotations,
        }


def main():
    b = Builder()
    paths = guide_paths()
    presets: list[dict] = []
    for path in paths:
        for p in b.build(path):
            presets.append(p)
            print(f"{p['title']:70s} | gear {len(p['equipment']):2d} | inv {sum(1 for x in p['inventory'] if x):2d} | rotations {len(p['rotations']):2d} | unknown {p['unknown'][:5]}")
    # the demo preset first, the rest grouped by boss
    presets.sort(key=lambda p: (not p.get("_first"), p["boss"], p["variant"].casefold(), p["style"]))
    for p in presets:
        p.pop("_first", None)
    write_json(DATA / "presets.json", presets)

    print()
    print(len(paths), "guides scanned,", len(presets), "presets ->", DATA / "presets.json")
    print("skipped:")
    for path, why in b.skipped:
        print("  ", path, "-", why)
    print("unknown aliases (top 20):", ", ".join(f"{k} x{n}" for k, n in b.unknown_aliases.most_common(20)))
    if "--report" in sys.argv:
        by_boss: dict[str, list[str]] = {}
        for p in presets:
            by_boss.setdefault(p["boss"], []).append(p["title"][len(p["boss"]) + 3 :] + (" (no gear)" if not p["equipment"] else ""))
        for boss, entries in sorted(by_boss.items()):
            print(f"  {boss}: " + "; ".join(entries))


if __name__ == "__main__":
    main()
