"""Shared helpers for pulling RS3 data from the RuneScape Wiki (MediaWiki API + Bucket extension).

Icons and names are (c) Jagex, used under fair use like on runescape.wiki (text CC BY-NC-SA 3.0).
"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://runescape.wiki/api.php"
UA = "rs3-ability-trainer/0.2 (https://github.com/Hochmoa/rs3-ability-trainer)"
REPO = Path(__file__).resolve().parents[1]
ASSETS = REPO / "public" / "assets"
DATA = REPO / "public" / "data"


def get(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                raise
            print("retry", e)
            time.sleep(2)
    raise RuntimeError("unreachable")


def bucket(name: str, fields: list[str], limit: int = 5000, where: tuple[str, str] | None = None,
           offset: int = 0) -> list[dict]:
    w = f".where({where[0]!r},{where[1]!r})" if where else ""
    o = f".offset({offset})" if offset else ""
    q = f"bucket('{name}').select({','.join(repr(f) for f in fields)}){w}.limit({limit}){o}.run()"
    data = get({"action": "bucket", "format": "json", "formatversion": "2", "query": q})
    if "error" in data:
        raise RuntimeError(data["error"])
    rows = data["bucket"]
    for r in rows:
        if isinstance(r.get("json"), str):
            try:
                r["json"] = json.loads(r["json"])
            except json.JSONDecodeError:
                r["json"] = {}
    return rows


def bucket_all(name: str, fields: list[str]) -> list[dict]:
    """Whole bucket, 5000 rows per request."""
    out: list[dict] = []
    offset = 0
    while True:
        rows = bucket(name, fields, limit=5000, offset=offset)
        out.extend(rows)
        if len(rows) < 5000:
            return out
        offset += 5000
        time.sleep(0.5)


def category_members(category: str, namespace: int = 0) -> list[str]:
    """All page titles in a category (follows continuation)."""
    titles: list[str] = []
    params = {"action": "query", "format": "json", "formatversion": "2", "list": "categorymembers",
              "cmtitle": "Category:" + category, "cmlimit": "500", "cmnamespace": str(namespace)}
    while True:
        data = get(params)
        titles += [m["title"] for m in data["query"]["categorymembers"]]
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            return titles
        params["cmcontinue"] = cont
        time.sleep(0.3)


def embedded_in(template: str) -> list[str]:
    """Pages transcluding a template."""
    titles: list[str] = []
    params = {"action": "query", "format": "json", "formatversion": "2", "list": "embeddedin",
              "eititle": "Template:" + template, "eilimit": "500", "einamespace": "0"}
    while True:
        data = get(params)
        titles += [m["title"] for m in data["query"]["embeddedin"]]
        cont = data.get("continue", {}).get("eicontinue")
        if not cont:
            return titles
        params["eicontinue"] = cont
        time.sleep(0.3)


def parse_duration_ticks(desc: str) -> int | None:
    """'* 30s (50 ticks) duration.' -> 50"""
    m = re.search(r"(\d+(?:\.\d+)?)s \((\d+) (?:game )?ticks?\) duration", desc)
    return int(m.group(2)) if m else None


def wikitext(titles: list[str]) -> dict[str, str]:
    """Raw wikitext per title (50 titles per request)."""
    out: dict[str, str] = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        data = get({"action": "query", "format": "json", "formatversion": "2", "prop": "revisions",
                    "rvprop": "content", "rvslots": "main", "titles": "|".join(chunk), "redirects": "1"})
        redirects = {r["from"]: r["to"] for r in data["query"].get("redirects", [])}
        pages = {p["title"]: p for p in data["query"]["pages"]}
        for t in chunk:
            p = pages.get(redirects.get(t, t))
            if p and "revisions" in p:
                out[t] = p["revisions"][0]["slots"]["main"]["content"]
        time.sleep(0.3)
    return out


def image_urls(files: list[str]) -> dict[str, str]:
    """File title ("Sever.png") -> download URL, 50 per request."""
    out: dict[str, str] = {}
    files = sorted(set(files))
    for i in range(0, len(files), 50):
        chunk = files[i:i + 50]
        data = get({"action": "query", "format": "json", "formatversion": "2", "prop": "imageinfo",
                    "iiprop": "url", "titles": "|".join("File:" + f for f in chunk), "redirects": "1"})
        norm = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
        for page in data["query"]["pages"]:
            if "imageinfo" in page:
                title = norm.get(page["title"], page["title"])
                out[title[5:]] = page["imageinfo"][0]["url"]
        time.sleep(0.3)
    return out


def download(url: str, target: Path) -> None:
    if target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        target.write_bytes(r.read())
    time.sleep(0.15)


def slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "x"


def file_of(image_markup: str | None) -> str | None:
    """'[[File:Sever.png|40x40px]]' -> 'Sever.png'"""
    if not image_markup:
        return None
    m = re.search(r"\[\[File:([^|\]]+)", image_markup)
    return m.group(1).strip() if m else None


def strip_markup(s: str | None) -> str:
    """Turn wiki markup into readable plain text (keeps line breaks and bullets)."""
    if not s:
        return ""
    s = re.sub(r"\[\[File:[^\]]*?\|link=([^|\]]+)[^\]]*\]\]", r"\1", s)  # icon with link -> link text
    s = re.sub(r"\[\[File:[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[[^|\]]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"'''?", "", s)
    s = re.sub(r"\{\{[^}]*\}\}", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    return s.strip()


def parse_ticks(s: str | None) -> int | None:
    """'60 seconds (100 ticks)' / '19.8s (33 ticks)' -> ticks; '5.4 seconds' -> round(5.4/0.6)."""
    if not s:
        return None
    m = re.search(r"\((\d+)\s*(?:game )?ticks?\)", s)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:s\b|sec|seconds?)", s)
    if m:
        return round(float(m.group(1)) / 0.6)
    return None


def parse_percent(s: str | None) -> float | None:
    if not s:
        return None
    t = strip_markup(s)
    if "%" not in t:
        return None
    m = re.search(r"([+-]?\d+(?:\.\d+)?)", t)
    return float(m.group(1)) if m else None


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def image_urls_any(names: list[str]) -> dict[str, str]:
    """Item name -> icon URL, trying the wiki's naming variants: "Name.png", then stackables ("Name 5.png",
    "Name 1.png") and level-scaled items ("Name (10).png": first file with prefix "Name (")."""
    out: dict[str, str] = {}
    todo = list(dict.fromkeys(names))
    for suffix in (".png", " 5.png", " 1.png"):
        if not todo:
            break
        found = image_urls([n + suffix for n in todo])
        for n in todo:
            if n + suffix in found:
                out[n] = found[n + suffix]
        todo = [n for n in todo if n not in out]
    for n in todo:
        key = n.replace(" ", "_")  # allimages works on the underscored db key
        data = get({"action": "query", "format": "json", "list": "allimages", "aiprefix": key + "_(", "ailimit": "20"})
        imgs = [i for i in data["query"]["allimages"] if re.fullmatch(re.escape(key) + r"_\(\d+\)\.png", i["name"])]
        if imgs:
            out[n] = sorted(imgs, key=lambda i: int(re.search(r"\((\d+)\)", i["name"]).group(1)))[0]["url"]
        time.sleep(0.3)
    return out
