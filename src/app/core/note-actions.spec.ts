import { describe, expect, it } from 'vitest';
import { isPlayerAction, markPlayerAction } from './note-actions';

describe('notes that ask for a click', () => {
  it('movement and interaction prose from the PvME guides', () => {
    for (const n of ['enter instance', 'Enter portal', 'quick-enter instance', 'rejoin last instance', 'run md', 'step under', 'click', '(click crystal)', 'out role: click', 'click tumeken', 'destroy', 'start fight', 'tag pillar', 'equip rod', 'dismiss conjures', 'move to new hand', 'target zemouregal', 'enter door', 'click enhreplen 2t after tendril']) {
      expect(isPlayerAction(n), n).toBe(true);
    }
  });

  it('remarks stay remarks', () => {
    for (const n of ['improvise', 'improv', '4 autos', 'repeat', 'fularrow', 'wait 2t', '100% adrenaline', 'finish with basics', 'start with at least 2 bloodlust stack meteorstrike', 'soulfire wave', 'melee', 'blue', '', 'inside']) {
      expect(isPlayerAction(n), n).toBe(false);
    }
  });

  it('marks only plain notes, never headings, inputs or notes already marked', () => {
    expect(markPlayerAction({ kind: 'note', id: '', note: 'enter instance' })).toEqual({ kind: 'note', id: '', note: 'enter instance', requiresAction: true });
    expect(markPlayerAction({ kind: 'note', id: '', note: 'enter instance', phase: true })).toEqual({ kind: 'note', id: '', note: 'enter instance', phase: true });
    expect(markPlayerAction({ kind: 'note', id: '', note: 'improvise' })).toEqual({ kind: 'note', id: '', note: 'improvise' });
    expect(markPlayerAction({ kind: 'ability', id: 'sever' })).toEqual({ kind: 'ability', id: 'sever' });
    const marked = { kind: 'note' as const, id: '', note: 'run md', requiresAction: true, actionTicks: 8 };
    expect(markPlayerAction(marked)).toBe(marked);
  });
});
