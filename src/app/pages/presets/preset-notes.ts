/** a sentence that lost an emoji token reads like "Using will result in" or ends in a dangling word */
const BROKEN = [
  / {2,}/,
  /\/\s*\//,
  /\b(using|use|bring|bringing|with|for|swapped for|instead of|assumes|and|or|of|are)\s*$/i,
  /\b(using|use|bring|bringing|with|for|and|or|of)\s+(will|result|if|are|not|instead|can|on|and|with|or|of)\b/i,
];

/**
 * PvME notes as shown on the page: Discord emoji tokens become [name], bullet dashes become " · ", and sentences
 * that lost a token (the guide's emoji were stripped) are dropped instead of shown as gibberish.
 */
export function cleanNotes(raw: string | null | undefined): string {
  if (!raw) return '';
  let text = raw.replace(/<a?:([\w-]+):\d+>/g, '[$1]').replace(/(^|[\s(])?:([\w-]+):/g, '$1[$2]');
  text = text.replace(/^\s*-\s*/, '').replace(/\s*-\s+(?=[A-Z])/g, ' · ');
  const sentences = text
    .split(/(?<=[.!?])\s*(?=[A-Z])/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !BROKEN.some((re) => re.test(x)));
  return sentences.join(' ');
}
