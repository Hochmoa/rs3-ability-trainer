/**
 * House style for everything the app says out loud (Martin, 2026-09-08): no en dash and no em dash in a string
 * the user can read. They are the tell that gives machine-written copy away, and the app has its own voice: a
 * full stop, a comma, a colon or a pair of brackets says the same thing.
 *
 * Wiki and PvME text is exempt, because it is quoted, not written here: the ability, prayer, spell and buff
 * descriptions in engine/rules-*.ts and engine/prayer-rules.ts keep their "25–35%" ranges as the wiki prints them.
 */
import { describe, expect, it } from 'vitest';

/** every template and every source file of the app, as raw text (vite inlines these globs at build time) */
const TEMPLATES = import.meta.glob('../**/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const SOURCES = import.meta.glob('../**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const LONG_DASH = /[–—]/;
/** quoted text as the wiki prints it: rules and prayer data are copied from runescape.wiki */
const QUOTED_FROM_THE_WIKI = /\/(rules-[a-z]+|prayer-rules)\.ts$/;
/** not prose: the separator older builds wrote into setup names, and the PvME pattern that matches it */
const NOT_PROSE = /LEGACY_SEPARATOR|PREBUILD_ROTATION/;

/** drops line and block comments, so only what ends up in the app is left */
export function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

function offenders(files: Record<string, string>, strip: boolean): string[] {
  const out: string[] = [];
  for (const [path, raw] of Object.entries(files)) {
    if (path.includes('.spec.') || QUOTED_FROM_THE_WIKI.test(path)) continue;
    const text = strip ? withoutComments(raw) : raw;
    text.split('\n').forEach((line, i) => {
      if (LONG_DASH.test(line) && !NOT_PROSE.test(line)) out.push(path + ':' + (i + 1) + ' ' + line.trim().slice(0, 110));
    });
  }
  return out;
}

describe('the app writes without long dashes', () => {
  it('no template says anything with an en dash or an em dash', () => {
    expect(offenders(TEMPLATES, false)).toEqual([]);
  });

  it('no string in the code does either (comments are the author’s business, wiki text is quoted)', () => {
    expect(offenders(SOURCES, true)).toEqual([]);
  });

  it('the comment stripper leaves the strings alone', () => {
    expect(withoutComments("const a = 'keep –'; // drop –").trim()).toBe("const a = 'keep –';");
    expect(withoutComments("/* drop – */ const b = 'keep –';")).toContain("const b = 'keep –';");
    expect(withoutComments('/* drop – */ const b = 1;')).not.toContain('drop');
    expect(withoutComments("const url = 'https://x.test/a';")).toContain('https://x.test/a');
  });
});
