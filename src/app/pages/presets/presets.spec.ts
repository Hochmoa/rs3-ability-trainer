import { describe, expect, it } from 'vitest';
import { cleanNotes } from './preset-notes';

describe('cleanNotes', () => {
  it('renders emoji tokens as [name]', () => {
    expect(cleanNotes(':ripperpouch: autocast :ripperscroll: on 1')).toBe('[ripperpouch] autocast [ripperscroll] on 1');
    expect(cleanNotes('use <:deathdealer:123> here')).toBe('use [deathdealer] here');
  });

  it('drops sentences that lost their tokens', () => {
    expect(cleanNotes('Using will result in more damage mitigation, but a lower hit chance if below 106 If below 106 can use')).toBe('');
    expect(cleanNotes('This preset assumes / / are not needed for the t95 rotations.T95 can use instead of')).toBe('');
    expect(cleanNotes('Replace Weapon poison +++ and with food if using at the bank.')).toBe('');
  });

  it('keeps whole sentences and turns dash bullets into separators', () => {
    expect(cleanNotes('ring of vigour and infernal puzzlebox passives highly recommended')).toBe('ring of vigour and infernal puzzlebox passives highly recommended');
    expect(cleanNotes('- Red EOF with Dragon Claws- Omni guard for emergency KO- Can drop Dscim')).toBe('Red EOF with Dragon Claws · Omni guard for emergency KO · Can drop Dscim');
    expect(cleanNotes('')).toBe('');
  });
});
