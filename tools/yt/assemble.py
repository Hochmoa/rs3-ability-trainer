"""Assembles the per-style notes into docs/research/abilities-in-practice.md."""
import re
from pathlib import Path

HERE = Path(__file__).parent
N = HERE / 'notes'
OUT = Path(r'D:\Projekte\rs3-ability-trainer\docs\research\abilities-in-practice.md')

CHAPTERS = [
    ('melee.md', 'Melee', 'Berserk is the window; Bloodlust and Greater Flurry decide what goes in it.'),
    ('ranged.md', 'Ranged', 'Everything counts hit splats: adrenaline, damage buffs and Perfect Equilibrium stacks.'),
    ('magic.md', 'Magic', 'Critical strikes are the adrenaline economy; Greater Concentrated Blast and Wild Magic are the loop.'),
    ('necro-general.md', 'Necromancy, and the rules that apply to every style', 'An adrenaline-budget problem: necrosis inside Living Death, residual souls outside it.'),
    ('bosses.md', 'At the bosses', 'How the styles above are actually spent on a fight, phase by phase.'),
]


def demote(text: str) -> str:
    """Drop the file's own H1 and push every other heading down one level."""
    out = []
    for line in text.split('\n'):
        if re.match(r'^# ', line):
            continue
        if re.match(r'^#{2,5} ', line):
            line = '#' + line
        out.append(line)
    return '\n'.join(out).strip('\n')


def body(name: str) -> str:
    return demote((N / name).read_text(encoding='utf-8'))


parts = [(N / '00-frame.md').read_text(encoding='utf-8').rstrip('\n')]
parts.append((HERE / 'sources-table.md').read_text(encoding='utf-8').rstrip('\n'))
parts.append('\nThe transcripts of these videos were read in full; the numbers they state were checked separately '
             '(see *Verified numbers*). Videos are listed by channel, then by date.\n')
parts.append((N / '01-core.md').read_text(encoding='utf-8').rstrip('\n'))
for name, title, blurb in CHAPTERS:
    parts.append(f'---\n\n## {title}\n\n*{blurb}*\n')
    parts.append(body(name))
parts.append('---\n')
parts.append((N / '98-verified.md').read_text(encoding='utf-8').rstrip('\n'))
if (N / '99-trainer.md').exists():
    parts.append('---\n')
    parts.append((N / '99-trainer.md').read_text(encoding='utf-8').rstrip('\n'))

doc = '\n\n'.join(parts) + '\n'
doc = re.sub(r'\n{4,}', '\n\n\n', doc)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(doc, encoding='utf-8', newline='\n')
print(f'{OUT}: {len(doc)} chars, {doc.count(chr(10))} lines, {doc.count("youtu.be")} citation links')
