import { describe, expect, it } from 'vitest';
import { spokenLabel, spokenSequence } from './coach.service';
import { keybindLabel } from './keybind.util';
import { Keybind } from './models';

const kb = (code: string, mods: Partial<Keybind> = {}): Keybind => ({ code, ctrl: false, shift: false, alt: false, ...mods });

describe('spokenLabel', () => {
  it('says digits and letters as they are', () => {
    expect(spokenLabel('3')).toBe('3');
    expect(spokenLabel('Q')).toBe('Q');
    expect(spokenLabel('q')).toBe('Q');
    expect(spokenLabel('F5')).toBe('F5');
  });

  it('spells the modifiers short, like a caller', () => {
    expect(spokenLabel('c+4')).toBe('Ctrl 4');
    expect(spokenLabel('s+Q')).toBe('Shift Q');
    expect(spokenLabel('a+2')).toBe('Alt 2');
    expect(spokenLabel('c+s+a+X')).toBe('Ctrl Shift Alt X');
  });

  it('names punctuation keys', () => {
    expect(spokenLabel('-')).toBe('minus');
    expect(spokenLabel('=')).toBe('equals');
    expect(spokenLabel('[')).toBe('left bracket');
    expect(spokenLabel(']')).toBe('right bracket');
    expect(spokenLabel('c+-')).toBe('Ctrl minus');
    expect(spokenLabel('s+/')).toBe('Shift slash');
    expect(spokenLabel('`')).toBe('backtick');
    expect(spokenLabel("'")).toBe('quote');
  });

  it('names special and numpad keys', () => {
    expect(spokenLabel('Space')).toBe('space');
    expect(spokenLabel('Esc')).toBe('escape');
    expect(spokenLabel('PgUp')).toBe('page up');
    expect(spokenLabel('→')).toBe('right');
    expect(spokenLabel('Num 7')).toBe('numpad 7');
    expect(spokenLabel('Num +')).toBe('numpad plus');
    expect(spokenLabel('c+Num -')).toBe('Ctrl numpad minus');
  });

  it('works on what keybindLabel produces', () => {
    expect(spokenLabel(keybindLabel(kb('Digit4', { ctrl: true })))).toBe('Ctrl 4');
    expect(spokenLabel(keybindLabel(kb('KeyQ', { shift: true })))).toBe('Shift Q');
    expect(spokenLabel(keybindLabel(kb('BracketLeft')))).toBe('left bracket');
    expect(spokenLabel(keybindLabel(kb('Minus', { alt: true })))).toBe('Alt minus');
    expect(spokenLabel(keybindLabel(kb('NumpadAdd')))).toBe('numpad plus');
    expect(spokenLabel(keybindLabel(kb('KeyS')))).toBe('S');
  });

  it('leaves "click" and empty labels to the caller', () => {
    expect(spokenLabel('click')).toBe('click');
    expect(spokenLabel('')).toBe('');
    expect(spokenLabel('  ')).toBe('');
  });
});

describe('spokenSequence', () => {
  it('joins a group with "then"', () => {
    expect(spokenSequence(['Ctrl 4', '3'])).toBe('Ctrl 4, then 3');
    expect(spokenSequence(['3'])).toBe('3');
    expect(spokenSequence(['', 'Q', ''])).toBe('Q');
    expect(spokenSequence([])).toBe('');
  });
});
