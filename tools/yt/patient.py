"""Fetches the transcripts YouTube's rate limit refused, slowly: one video per pause, several passes.

python patient.py relevant.json videos2.json ...   (any number of video lists; already fetched ids are skipped)
"""
import json
import random
import sys
import time
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi

import collect  # header(), plain(), OUT, HERE

HERE = Path(__file__).parent
PAUSE = 40  # seconds between videos; the block lifts after a while, hammering it keeps it closed
PASSES = 6


def main() -> None:
    api = YouTubeTranscriptApi()
    wanted: dict[str, dict] = {}
    for src in sys.argv[1:]:
        p = HERE / src
        if not p.exists():
            continue
        for v in json.loads(p.read_text(encoding='utf-8')):
            wanted.setdefault(v['id'], v)
    index = json.loads((HERE / 'index.json').read_text(encoding='utf-8')) if (HERE / 'index.json').exists() else []
    done = {x['id'] for x in index}
    hopeless: set[str] = set()
    for p in range(1, PASSES + 1):
        todo = [v for vid, v in wanted.items() if vid not in done and vid not in hopeless]
        if not todo:
            break
        print(f'pass {p}: {len(todo)} left', flush=True)
        for v in todo:
            try:
                snips = api.fetch(v['id'], languages=['en', 'en-US', 'en-GB']).to_raw_data()
            except Exception as e:  # noqa: BLE001
                name = type(e).__name__
                if name in ('TranscriptsDisabled', 'NoTranscriptFound', 'VideoUnavailable', 'AgeRestricted'):
                    hopeless.add(v['id'])
                print(f'  {v["id"]} {name}', flush=True)
                time.sleep(PAUSE + random.uniform(0, 20))
                continue
            (collect.OUT / f'{v["id"]}.json').write_text(json.dumps({**v, 'snippets': snips}, ensure_ascii=False), encoding='utf-8')
            text = collect.plain(snips)
            (collect.OUT / f'{v["id"]}.txt').write_text(collect.header(v) + text, encoding='utf-8')
            index.append({**{k: v.get(k) for k in ('id', 'title', 'channel', 'upload_date', 'duration', 'views')}, 'chars': len(text)})
            (HERE / 'index.json').write_text(json.dumps(index, indent=1, ensure_ascii=False), encoding='utf-8')
            done.add(v['id'])
            print(f'  OK {v["id"]} {len(text):6d} {v["title"][:60]}', flush=True)
            time.sleep(PAUSE + random.uniform(0, 20))
    print('done:', len(done), 'no transcript:', len(hopeless))


if __name__ == '__main__':
    main()
