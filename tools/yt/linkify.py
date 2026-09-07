"""Turns the notes' raw citations `[videoId @ 12:34]` into readable links `[Carguy, 25 Jun 2026 @12:34](https://youtu.be/id?t=754)`.

python linkify.py notes/melee.md ...   (rewrites in place; ranges "12:34–13:00" keep the first timestamp)
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
INDEX = {v['id']: v for v in json.loads((HERE / 'index.json').read_text(encoding='utf-8'))}
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
CITE = re.compile(r'\[([A-Za-z0-9_-]{11})\s*@\s*(\d{1,2}):(\d{2})(?:\s*[–-]\s*\d{1,2}:\d{2})?\]')
# citations that share one bracket: "[id @ 01:23; id @ 04:56]" or "[id @ 01:23, 04:56]"
BARE = re.compile(r'(?<!\()([A-Za-z0-9_-]{11})\s*@\s*(\d{1,2}):(\d{2})')


def pretty_date(yyyymmdd: str) -> str:
    if len(yyyymmdd) != 8:
        return ''
    return f'{int(yyyymmdd[6:8])} {MONTHS[int(yyyymmdd[4:6]) - 1]} {yyyymmdd[:4]}'


def link(m: re.Match) -> str:
    vid, mm, ss = m.group(1), int(m.group(2)), int(m.group(3))
    v = INDEX.get(vid)
    if not v:
        return m.group(0)  # not one of our videos: leave the text alone
    secs = mm * 60 + ss
    label = f'{v["channel"]}, {pretty_date(v["upload_date"])} @{mm}:{ss:02d}'
    return f'[{label}](https://youtu.be/{vid}?t={secs})'


def main() -> None:
    for path in sys.argv[1:]:
        p = HERE / path if not Path(path).is_absolute() else Path(path)
        s = p.read_text(encoding='utf-8')
        out, n = CITE.subn(link, s)
        out, n2 = BARE.subn(link, out)
        n += n2
        p.write_text(out, encoding='utf-8', newline='\n')
        missing = {m.group(1) for m in CITE.finditer(s)} - set(INDEX)
        print(f'{p.name}: {n} citations linked' + (f', unknown video ids: {sorted(missing)}' if missing else ''))


if __name__ == '__main__':
    main()
