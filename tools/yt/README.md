# YouTube transcript pipeline

Builds `docs/research/abilities-in-practice.md`: how the community actually uses each ability after the Combat Style
Modernisation of 2 March 2026. The wiki says what an ability does; the video guides say when to press it and why.

Needs `pip install yt-dlp youtube-transcript-api`.

```
python collect.py search      # YouTube searches -> candidates.json
python collect.py meta        # metadata, drops everything published before the rework -> videos.json
python expand.py filter       # keeps the hits that are really about RS3 combat -> relevant.json
python expand.py channels     # every upload of those channels -> candidates2.json
python expand.py meta         # same date + relevance filter -> videos2.json
python collect.py fetch relevant.json   # transcripts (YouTube rate-limits: expect to be cut off)
python patient.py relevant.json videos2.json   # slow retry for the ones that were refused
python linkify.py notes/*.md  # turns "[videoId @ 12:34]" into timestamp links
python assemble.py            # notes/ -> docs/research/abilities-in-practice.md
```

The transcripts themselves stay in the working directory and are not committed: they are third-party material, only
used to write the document, which quotes at most a sentence and links its source.

`notes/` holds one markdown file per topic (melee, ranged, magic, necro-general, bosses) plus the hand-written
frame (`00-frame.md`, `01-core.md`, `98-verified.md`, `99-trainer.md`). Regenerating the corpus does not rewrite
those — they are the reading, not the raw data.
