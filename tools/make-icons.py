"""Draws the small icons for client actions (target cycle) into public/assets/actions."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "actions"
OUT.mkdir(parents=True, exist_ok=True)

im = Image.new("RGBA", (60, 60), (0, 0, 0, 255))
d = ImageDraw.Draw(im)
gold = (201, 162, 39, 255)
d.ellipse((8, 8, 51, 51), outline=gold, width=4)
d.ellipse((22, 22, 37, 37), fill=(229, 57, 53, 255))
for a, b in (((29, 2), (29, 14)), ((29, 45), (29, 57)), ((2, 29), (14, 29)), ((45, 29), (57, 29))):
    d.line((a, b), fill=gold, width=4)
im.save(OUT / "target-cycle.png")
print("target-cycle.png", im.size)

note = Image.new("RGBA", (60, 60), (0, 0, 0, 0))
d = ImageDraw.Draw(note)
d.rounded_rectangle((4, 4, 55, 55), radius=8, outline=(154, 150, 140, 255), width=3)
for y in (20, 30, 40):
    d.line(((14, y), (46, y)), fill=(154, 150, 140, 255), width=3)
note.save(OUT / "note.png")
phase = Image.new("RGBA", (60, 60), (0, 0, 0, 0))
d = ImageDraw.Draw(phase)
d.rounded_rectangle((4, 4, 55, 55), radius=8, outline=gold, width=3)
d.polygon(((22, 16), (42, 30), (22, 44)), fill=gold)
phase.save(OUT / "phase.png")
print("note.png phase.png")
