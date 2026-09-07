"""Widens the corpus: keeps only RS3 combat videos, then harvests the uploads of the channels that made them.

python expand.py filter    -> relevant.json  (search hits that are really about RS3 combat)
python expand.py channels  -> candidates2.json (every upload of those channels, flat)
python expand.py meta      -> videos2.json   (metadata + date cutoff + relevance)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
CUTOFF = '20260302'

KEEP = re.compile(
    r'\babilit|rotation|revolution|\bdps\b|\bdpm\b|combat|pvm|boss|melee|ranged|magic|necromanc|adrenaline'
    r'|special attack|\bspec\b|eoc|modernis|moderniz|action bar|damage|slayer|\bnex\b|zamorak|rasial|telos|araxxor|vorkath|kerapac|solak|raksha|zuk|amascut|sanctum',
    re.I,
)
DROP = re.compile(
    r'dragonwilds|dragon wilds|\bosrs\b|old school|linus|steam machine|money making|money-making|afk skilling|skilling method'
    r'|leagues|fashionscape|quest guide|\bironman\b|dig site|mining|fishing|woodcutting|invention guide|archaeology guide|farming run',
    re.I,
)


def run(args: list[str]) -> str:
    p = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return p.stdout


def relevant(v: dict) -> bool:
    hay = v['title'] + ' ' + v.get('description', '')[:600]
    return bool(KEEP.search(hay)) and not DROP.search(v['title'])


def filter_() -> None:
    videos = json.loads((HERE / 'videos.json').read_text(encoding='utf-8'))
    keep = [v for v in videos if relevant(v)]
    (HERE / 'relevant.json').write_text(json.dumps(keep, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(keep)} of {len(videos)} relevant')
    for v in keep:
        print(f'  {v["upload_date"]} {v["channel"][:20]:20} {v["title"][:70]}')
    dropped = [v for v in videos if v not in keep]
    print('\ndropped:', ', '.join(v['title'][:40] for v in dropped[:20]))


def channels() -> None:
    keep = json.loads((HERE / 'relevant.json').read_text(encoding='utf-8'))
    # one video per channel gives us the channel url
    first: dict[str, str] = {}
    for v in keep:
        first.setdefault(v['channel'], v['id'])
    urls: dict[str, str] = {}
    for name, vid in first.items():
        out = run([sys.executable, '-m', 'yt_dlp', '--dump-json', '--skip-download', '--no-warnings', f'https://www.youtube.com/watch?v={vid}'])
        for line in out.splitlines():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get('channel_url'):
                urls[name] = d['channel_url']
        print(f'{name}: {urls.get(name, "?")}', flush=True)
    (HERE / 'channels.json').write_text(json.dumps(urls, indent=1, ensure_ascii=False), encoding='utf-8')

    seen: dict[str, dict] = {}
    for name, url in urls.items():
        out = run([sys.executable, '-m', 'yt_dlp', f'{url}/videos', '--flat-playlist', '--dump-json', '--skip-download',
                   '--no-warnings', '--playlist-end', '120'])
        n = 0
        for line in out.splitlines():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            vid = d.get('id')
            if not vid or vid in seen:
                continue
            seen[vid] = {'id': vid, 'title': d.get('title') or '', 'channel': name, 'duration': d.get('duration') or 0,
                         'views': d.get('view_count') or 0, 'query': 'channel:' + name}
            n += 1
        print(f'{name}: {n} uploads', flush=True)
    (HERE / 'candidates2.json').write_text(json.dumps(list(seen.values()), indent=1, ensure_ascii=False), encoding='utf-8')
    print('channel candidates', len(seen))


def meta() -> None:
    cands = json.loads((HERE / 'candidates2.json').read_text(encoding='utf-8'))
    have = {v['id'] for v in json.loads((HERE / 'videos.json').read_text(encoding='utf-8'))}
    # a combat guide is longer than a minute; drop shorts, streams and anything we already have
    cands = [c for c in cands if 120 <= (c['duration'] or 0) <= 3 * 3600 and c['id'] not in have
             and KEEP.search(c['title']) and not DROP.search(c['title'])]
    print('fetching metadata for', len(cands))
    out: list[dict] = []
    for i in range(0, len(cands), 25):
        batch = cands[i:i + 25]
        args = [sys.executable, '-m', 'yt_dlp', '--dump-json', '--skip-download', '--no-warnings', '--ignore-errors']
        args += [f'https://www.youtube.com/watch?v={c["id"]}' for c in batch]
        for line in run(args).splitlines():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            out.append({'id': d.get('id'), 'title': d.get('title') or '', 'channel': d.get('channel') or '',
                        'upload_date': d.get('upload_date') or '', 'duration': d.get('duration') or 0,
                        'views': d.get('view_count') or 0, 'description': (d.get('description') or '')[:2000]})
        print(f'  {min(i + 25, len(cands))}/{len(cands)} → {len(out)}', flush=True)
    fresh = [v for v in out if v['upload_date'] >= CUTOFF and relevant(v)]
    fresh.sort(key=lambda v: v['upload_date'], reverse=True)
    (HERE / 'videos2.json').write_text(json.dumps(fresh, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(out)} videos, {len(fresh)} after {CUTOFF} and relevant')
    for v in fresh[:60]:
        print(f'  {v["upload_date"]} {v["channel"][:18]:18} {v["title"][:66]}')


if __name__ == '__main__':
    {'filter': filter_, 'channels': channels, 'meta': meta}[sys.argv[1]]()
