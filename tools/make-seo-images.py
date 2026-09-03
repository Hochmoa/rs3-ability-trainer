"""Generate the PWA icons and the Open Graph preview image.

    python tools/make-seo-images.py

Writes public/assets/icons/*.png and public/assets/og-image.png. Needs Pillow and the Segoe UI /
Bahnschrift fonts (Windows); falls back to Pillow's default font elsewhere.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / 'public/assets/icons'
ABIL = ROOT / 'public/assets/abilities'
BG, PANEL, BORDER, GOLD, TEXT, MUTED = '#0f0f12', '#1b1a1f', '#35333c', '#c9a227', '#e8e4d8', '#9a968c'


def font(size, bold=True):
    for name in (['seguisb.ttf', 'segoeuib.ttf', 'bahnschrift.ttf'] if bold else ['segoeui.ttf', 'bahnschrift.ttf']):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def app_icon(size, maskable=False):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = 0 if maskable else 0
    r = size * (0 if maskable else 0.2)
    d.rounded_rectangle([pad, pad, size - 1 - pad, size - 1 - pad], radius=r, fill=BG)
    # gold cooldown sweep ring, like the overlay on an ability slot
    m = size * (0.2 if maskable else 0.12)
    w = max(3, int(size * 0.07))
    d.arc([m, m, size - m, size - m], start=-90, end=200, fill=GOLD, width=w)
    d.arc([m, m, size - m, size - m], start=200, end=270, fill=BORDER, width=w)
    f = font(int(size * 0.34))
    d.text((size / 2, size / 2 + size * 0.01), 'RS3', font=f, fill=TEXT, anchor='mm')
    return im


def og_image():
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 6], fill=GOLD)
    d.text((72, 96), 'RS3 Ability Trainer', font=font(76), fill=GOLD)
    d.text((72, 200), 'Practise RuneScape 3 rotations on the real combat clock', font=font(36, bold=False), fill=TEXT)
    d.text((72, 256), '0.6 s ticks  ·  1.8 s global cooldown  ·  adrenaline  ·  ability queueing  ·  PvME import', font=font(26, bold=False), fill=MUTED)
    # action bar with ability icons
    wanted = ['assault', 'berserk', 'death-s-swiftness', 'sunshine', 'hurricane', 'asphyxiate', 'death-skulls', 'conjure-undead-army', 'bladed-dive', 'greater-flurry']
    icons = [ABIL / f'{n}.png' for n in wanted if (ABIL / f'{n}.png').exists()][:9]
    slot, gap, x0, y0 = 96, 12, 72, 340
    for i, p in enumerate(icons):
        x = x0 + i * (slot + gap)
        d.rounded_rectangle([x, y0, x + slot, y0 + slot], radius=10, fill=PANEL, outline=BORDER, width=2)
        ic = Image.open(p).convert('RGBA').resize((slot - 16, slot - 16), Image.LANCZOS)
        im.paste(ic, (x + 8, y0 + 8), ic)
        d.text((x + slot - 8, y0 + slot - 6), str(i + 1), font=font(20), fill=TEXT, anchor='rb')
    # tick / GCD bars
    bx, by, bw = 72, 480, 9 * (slot + gap) - gap
    d.text((bx, by - 30), 'Tick 0.6 s', font=font(20, bold=False), fill=MUTED)
    d.rectangle([bx, by, bx + bw, by + 18], fill=PANEL, outline=BORDER)
    d.rectangle([bx, by, bx + int(bw * 0.62), by + 18], fill=GOLD)
    d.text((bx, by + 34), 'Global cooldown 1.8 s', font=font(20, bold=False), fill=MUTED)
    d.rectangle([bx, by + 64, bx + bw, by + 82], fill=PANEL, outline=BORDER)
    d.rectangle([bx, by + 64, bx + int(bw * 0.28), by + 82], fill='#4caf50')
    d.text((W - 72, H - 40), 'rs3trainer.hochware.com', font=font(26), fill=MUTED, anchor='rb')
    return im


if __name__ == '__main__':
    ICONS.mkdir(parents=True, exist_ok=True)
    app_icon(192).save(ICONS / 'icon-192.png')
    app_icon(512).save(ICONS / 'icon-512.png')
    app_icon(512, maskable=True).save(ICONS / 'icon-maskable-512.png')
    app_icon(180).save(ICONS / 'apple-touch-icon.png')
    og_image().save(ROOT / 'public/assets/og-image.png', optimize=True)
    print('written', sorted(p.name for p in ICONS.iterdir()), 'og-image.png')
