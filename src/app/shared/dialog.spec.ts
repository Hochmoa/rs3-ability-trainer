import '@angular/compiler'; // dialog.ts imports the CDK focus trap, a partially compiled library that needs the JIT compiler here
import { describe, expect, it } from 'vitest';
import { isTypingTarget } from './dialog';

/** a DOM-less stand-in for an event target: `closest()` answers with the given match */
function target(matches: (sel: string) => boolean): EventTarget {
  return { closest: (sel: string) => (matches(sel) ? {} : null) } as unknown as EventTarget;
}

describe('isTypingTarget – the session hotkeys leave text fields alone', () => {
  it('is true for inputs, textareas, selects and contenteditable elements (or anything inside them)', () => {
    for (const tag of ['input', 'textarea', 'select', '[contenteditable]']) {
      expect(isTypingTarget(target((sel) => sel.includes(tag)))).toBe(true);
    }
  });

  it('is false for the page, buttons, the bars and a null target', () => {
    expect(isTypingTarget(target(() => false))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({} as EventTarget)).toBe(false); // window / document: no closest()
  });

  it('asks with one selector that excludes contenteditable="false"', () => {
    const seen: string[] = [];
    isTypingTarget(target((sel) => (seen.push(sel), false)));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('input');
    expect(seen[0]).toContain('textarea');
    expect(seen[0]).toContain('select');
    expect(seen[0]).toContain('[contenteditable]:not([contenteditable="false"])');
  });
});
