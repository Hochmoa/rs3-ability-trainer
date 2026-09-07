import { describe, expect, it } from 'vitest';
import script from '../../../tools/guide-seed-to-sql.py?raw';
import { DEFAULT_SETTINGS } from './models';

/**
 * tools/guide-seed-to-sql.py seeds the guide accounts' setups with the app defaults; it carries them as a JSON copy of
 * DEFAULT_SETTINGS (python cannot import models.ts). This spec fails when the two drift apart.
 */
describe('guide seed converter – DEFAULT_SETTINGS copy', () => {
  it('matches DEFAULT_SETTINGS in models.ts', () => {
    const m =
      /# DEFAULT_SETTINGS_JSON_BEGIN[^\n]*\r?\nDEFAULT_SETTINGS_JSON = """([\s\S]*?)"""\r?\n# DEFAULT_SETTINGS_JSON_END/.exec(
        script,
      );
    expect(m, 'DEFAULT_SETTINGS_JSON markers in tools/guide-seed-to-sql.py').toBeTruthy();
    expect(JSON.parse(m![1])).toEqual(DEFAULT_SETTINGS);
  });
});
