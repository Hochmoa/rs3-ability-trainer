"""
Slims the data files in public/data so the browser fetches and parses less:

* one record per line instead of an indented tree (still diff-friendly, ~20 % smaller);
* integral floats become ints (``0.0`` -> ``0``, ``3100.0`` -> ``3100``);
* gear.json / weapons.json / perks.json leave the ``icon`` out when it is the default
  ``assets/<dir>/<id>.png`` (DataService fills it in again when the file arrives; ``null`` = no icon stays);
* weapons.json drops the wiki columns nothing reads: speed, range, damage (auto-attack), charges, innateMastery.

``fetch_wiki.write_json`` runs this for every fetcher, so a refetch writes slim files. To re-slim the checked-in files:

    python tools/slim_data.py            # all of public/data
    python tools/slim_data.py gear.json  # one file
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data"

ICON_DIRS = {"gear": "gear", "weapons": "weapons", "perks": "perks"}
DROP_FIELDS = {"weapons": ("speed", "range", "damage", "charges", "innateMastery")}


def _ints(x):
    if isinstance(x, float) and x.is_integer():
        return int(x)
    if isinstance(x, dict):
        return {k: _ints(v) for k, v in x.items()}
    if isinstance(x, list):
        return [_ints(v) for v in x]
    return x


def slim(name: str, data):
    """``name`` is the file stem ("gear", "weapons", ...). Returns the slimmed copy."""
    data = _ints(data)
    if not isinstance(data, list):
        return data
    drop = DROP_FIELDS.get(name, ())
    icon_dir = ICON_DIRS.get(name)
    out = []
    for rec in data:
        if isinstance(rec, dict):
            rec = {k: v for k, v in rec.items() if k not in drop}
            if icon_dir and rec.get("icon") == "assets/" + icon_dir + "/" + str(rec.get("id")) + ".png":
                del rec["icon"]
        out.append(rec)
    return out


def _compact(x) -> str:
    return json.dumps(x, ensure_ascii=False, separators=(",", ":"))


def dumps(data) -> str:
    """One record (list element / dict entry) per line, compact separators."""
    if isinstance(data, list):
        return "[\n" + ",\n".join(_compact(r) for r in data) + "\n]\n"
    if isinstance(data, dict):
        return "{\n" + ",\n".join(_compact(k) + ":" + _compact(v) for k, v in data.items()) + "\n}\n"
    return _compact(data) + "\n"


def main(argv):
    files = [DATA / f for f in argv] if argv else sorted(DATA.glob("*.json"))
    for path in files:
        before = path.stat().st_size
        text = dumps(slim(path.stem, json.loads(path.read_text(encoding="utf-8"))))
        path.write_text(text, encoding="utf-8", newline="\n")
        print("%-20s %9d -> %9d bytes" % (path.name, before, len(text.encode("utf-8"))))


if __name__ == "__main__":
    main(sys.argv[1:])
