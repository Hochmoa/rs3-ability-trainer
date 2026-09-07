"""Collects RS3 combat YouTube videos published after the Combat Style Modernisation (2 March 2026) and their transcripts.

Step 1 (search):   python collect.py search   -> candidates.json (id, title, channel, duration from a flat search)
Step 2 (metadata): python collect.py meta     -> videos.json    (adds upload_date, views; drops anything before 2026-03-02)
Step 3 (fetch):    python collect.py fetch    -> transcripts/<id>.json + .txt, index.json

Transcripts are only a working copy for research; the finished document quotes at most a sentence and links the timestamp.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / 'transcripts'
OUT.mkdir(exist_ok=True)
CUTOFF = '20260302'  # Combat Style Modernisation

QUERIES = [
    'RS3 combat modernisation abilities explained',
    'RS3 combat update 2026 abilities guide',
    'RuneScape 3 revolution bar guide 2026 melee',
    'RuneScape 3 revolution bar guide 2026 ranged',
    'RuneScape 3 revolution bar guide 2026 magic',
    'RuneScape 3 revolution bar guide 2026 necromancy',
    'RS3 melee rotation guide 2026',
    'RS3 ranged rotation guide 2026',
    'RS3 magic rotation guide 2026',
    'RS3 necromancy rotation guide 2026',
    'RS3 DPM guide 2026 combat update',
    'RS3 best abilities after combat update',
    'RS3 ability rework guide 2026 basics thresholds',
    'RS3 PvM guide 2026 combat modernisation rotation',
    'RS3 how to use abilities 2026 guide',
    'RS3 bossing guide 2026 combat update rotation',
    'RS3 adrenaline guide 2026',
    'RS3 special attacks guide 2026',
]


def run(args: list[str]) -> str:
    p = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return p.stdout


def search() -> None:
    seen: dict[str, dict] = {}
    for q in QUERIES:
        out = run([sys.executable, '-m', 'yt_dlp', f'ytsearch25:{q}', '--flat-playlist', '--dump-json', '--skip-download', '--no-warnings'])
        n = 0
        for line in out.splitlines():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            vid = d.get('id')
            if not vid or vid in seen:
                continue
            seen[vid] = {
                'id': vid,
                'title': d.get('title') or '',
                'channel': d.get('channel') or d.get('uploader') or '',
                'duration': d.get('duration') or 0,
                'views': d.get('view_count') or 0,
                'query': q,
            }
            n += 1
        print(f'{q!r}: {n} new, {len(seen)} total', flush=True)
    (HERE / 'candidates.json').write_text(json.dumps(list(seen.values()), indent=1), encoding='utf-8')
    print('candidates', len(seen))


def meta() -> None:
    cands = json.loads((HERE / 'candidates.json').read_text(encoding='utf-8'))
    # obvious noise: shorts, streams over three hours, non-RS3 hits
    cands = [c for c in cands if 60 <= (c['duration'] or 0) <= 3 * 3600]
    print('fetching metadata for', len(cands))
    out: list[dict] = []
    for i in range(0, len(cands), 20):
        batch = cands[i:i + 20]
        args = [sys.executable, '-m', 'yt_dlp', '--dump-json', '--skip-download', '--no-warnings', '--ignore-errors']
        args += [f'https://www.youtube.com/watch?v={c["id"]}' for c in batch]
        for line in run(args).splitlines():
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            out.append({
                'id': d.get('id'),
                'title': d.get('title') or '',
                'channel': d.get('channel') or '',
                'upload_date': d.get('upload_date') or '',
                'duration': d.get('duration') or 0,
                'views': d.get('view_count') or 0,
                'description': (d.get('description') or '')[:2000],
            })
        print(f'  {min(i + 20, len(cands))}/{len(cands)} → {len(out)}', flush=True)
    fresh = [v for v in out if v['upload_date'] >= CUTOFF]
    fresh.sort(key=lambda v: v['upload_date'], reverse=True)
    (HERE / 'videos.json').write_text(json.dumps(fresh, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f'{len(out)} videos, {len(fresh)} after {CUTOFF}')


def fetch() -> None:
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    src = sys.argv[2] if len(sys.argv) > 2 else 'videos.json'
    videos = json.loads((HERE / src).read_text(encoding='utf-8'))
    index = json.loads((HERE / 'index.json').read_text(encoding='utf-8')) if (HERE / 'index.json').exists() else []
    known = {x['id'] for x in index}
    videos = [v for v in videos if v['id'] not in known]
    for i, v in enumerate(videos, 1):
        path = OUT / f'{v["id"]}.json'
        if path.exists():
            snips = json.loads(path.read_text(encoding='utf-8'))['snippets']
        else:
            try:
                snips = api.fetch(v['id'], languages=['en', 'en-US', 'en-GB']).to_raw_data()
            except Exception as e:  # noqa: BLE001 - no transcript, members only, blocked …
                print(f'{i}/{len(videos)} {v["id"]} skip: {type(e).__name__}', flush=True)
                continue
            path.write_text(json.dumps({**v, 'snippets': snips}, ensure_ascii=False), encoding='utf-8')
        text = plain(snips)
        (OUT / f'{v["id"]}.txt').write_text(header(v) + text, encoding='utf-8')
        index.append({**{k: v[k] for k in ('id', 'title', 'channel', 'upload_date', 'duration', 'views')}, 'chars': len(text)})
        print(f'{i}/{len(videos)} {v["id"]} {v["upload_date"]} {len(text):6d} {v["title"][:60]}', flush=True)
    (HERE / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False), encoding='utf-8')
    print('transcripts', len(index), 'chars', sum(x['chars'] for x in index))


def header(v: dict) -> str:
    return f'# {v["title"]}\n# {v["channel"]} · {v["upload_date"]} · https://youtu.be/{v["id"]}\n\n'


def plain(snips: list[dict]) -> str:
    """One line per ~30 s block, prefixed with [mm:ss] so the document can cite a timestamp."""
    lines, block, start = [], [], None
    for s in snips:
        if start is None:
            start = s['start']
        block.append(s['text'].replace('\n', ' ').strip())
        if s['start'] - start >= 30:
            lines.append(f'[{int(start // 60):02d}:{int(start % 60):02d}] ' + re.sub(r'\s+', ' ', ' '.join(block)))
            block, start = [], None
    if block:
        lines.append(f'[{int((start or 0) // 60):02d}:{int((start or 0) % 60):02d}] ' + re.sub(r'\s+', ' ', ' '.join(block)))
    return '\n'.join(lines)


if __name__ == '__main__':
    {'search': search, 'meta': meta, 'fetch': fetch}[sys.argv[1]]()
