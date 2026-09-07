import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import ALIASES_JSON from '../../../public/data/pvme-aliases.json';
import FAMILIARS from '../../../public/data/familiars.json';
import PRAYERS from '../../../public/data/prayers.json';
import PRESETS from '../../../public/data/presets.json';
import SPECIALS from '../../../public/data/specials.json';
import SPECS from '../../../public/data/specs.json';
import SPELLS from '../../../public/data/spells.json';
import WEAPONS from '../../../public/data/weapons.json';
import { ACTIONS, RotationStep } from './models';
import { normalizeAlias, parsePvme, PVME_MARKERS, PVME_MECHANICS, PVME_TARGETS } from './pvme';

const ALIASES: Record<string, RotationStep[]> = {
  bloat: [{ kind: 'ability', id: 'bloat' }],
  vulnbomb: [{ kind: 'special', id: 'vulnerability-bomb' }],
  deathskulls: [{ kind: 'ability', id: 'death-skulls' }],
  skulls: [{ kind: 'ability', id: 'death-skulls' }],
  necrobasic: [{ kind: 'ability', id: 'necromancy' }],
  touchofdeath: [{ kind: 'ability', id: 'touch-of-death' }],
  soulsap: [{ kind: 'ability', id: 'soul-sap' }],
  soulstrike: [{ kind: 'ability', id: 'soul-strike' }],
  livingdeath: [{ kind: 'ability', id: 'living-death' }],
  adrenrenewal: [{ kind: 'special', id: 'adrenaline-renewal-potion' }],
  undeadslayer: [{ kind: 'ability', id: 'undead-slayer' }],
  volleyofsouls: [{ kind: 'ability', id: 'volley-of-souls' }],
  commandskeleton: [{ kind: 'ability', id: 'command-skeleton-warrior' }],
  omniguard: [{ kind: 'weapon', id: 'necromancy' }, { kind: 'spec', id: 'death-essence' }],
  deathguard90: [{ kind: 'weapon', id: 'necromancy' }, { kind: 'spec', id: 'death-grasp' }],
  dba: [{ kind: 'weapon', id: 'dragon-battleaxe' }, { kind: 'spec', id: 'rampage' }],
  spec: [{ kind: 'ability', id: 'weapon-special-attack' }],
  eof: [{ kind: 'ability', id: 'essence-of-finality' }],
  tc: [{ kind: 'action', id: 'target-cycle' }],
  turmoil: [{ kind: 'prayer', id: 'turmoil' }],
  grico: [{ kind: 'ability', id: 'greater-ricochet' }],
  gchain: [{ kind: 'ability', id: 'greater-chain' }],
  overpower: [{ kind: 'ability', id: 'overpower' }],
  omni: [{ kind: 'ability', id: 'omnipower' }],
  omnipower: [{ kind: 'ability', id: 'omnipower' }],
  gflurry: [{ kind: 'ability', id: 'greater-flurry' }],
  impact: [{ kind: 'ability', id: 'impact' }],
  sunshine: [{ kind: 'ability', id: 'sunshine' }],
  tsunami: [{ kind: 'ability', id: 'tsunami' }],
  anti: [{ kind: 'ability', id: 'anticipation' }],
  surge: [{ kind: 'ability', id: 'surge' }],
  cade: [{ kind: 'ability', id: 'barricade' }],
  rapid: [{ kind: 'ability', id: 'rapid-fire' }],
  magmatempest: [{ kind: 'ability', id: 'magma-tempest' }],
  smokecloud: [{ kind: 'spell', id: 'smoke-cloud' }],
  bloodbarrage: [{ kind: 'spell', id: 'blood-barrage' }],
  gconc: [{ kind: 'ability', id: 'greater-concentrated-blast' }],
  veng: [{ kind: 'spell', id: 'vengeance' }],
};
const resolve = (alias: string) => ALIASES[alias] ?? null;

const ALIASES_EXTRA: Record<string, RotationStep[]> = {
  wm: [{ kind: 'ability', id: 'wild-magic' }],
  asphyx: [{ kind: 'ability', id: 'asphyxiate' }],
  dbreath: [{ kind: 'ability', id: 'dragon-breath' }],
  assault: [{ kind: 'ability', id: 'assault' }],
  punish: [{ kind: 'ability', id: 'punish' }],
};
Object.assign(ALIASES, ALIASES_EXTRA);

const ids = (steps: RotationStep[]) => steps.map((s) => (s.kind === 'note' ? 'note:' + s.note : s.id + (s.sameTick ? '+' : '') + (s.offsetTicks !== undefined ? '@' + s.offsetTicks : '')));

describe('parsePvme', () => {
  it('splits ticks on arrows and same-tick actions on plus', () => {
    const r = parsePvme('(tc) bloat + vulnbomb → deathskulls → necrobasic → touchofdeath → soulsap', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'bloat+', 'vulnerability-bomb+', 'death-skulls', 'necromancy', 'touch-of-death', 'soul-sap']);
    expect(r.unknown).toEqual([]);
  });

  it('a stalled ability and its release are marked as the pair of one cast', () => {
    const r = parsePvme('sassault → punish → rassault + bloat', resolve);
    expect(ids(r.steps)).toEqual(['assault', 'punish', 'assault', 'bloat+']);
    expect(r.steps[0]).toMatchObject({ id: 'assault', stall: true });
    expect(r.steps[2]).toMatchObject({ id: 'assault', release: true });
    expect(r.steps[0].hint).toBe('stall'); // the queue shows what the press is for
    expect(r.steps[2].hint).toBe('release');
    // a stall without a release stays an ordinary cast
    const alone = parsePvme('sassault → punish', resolve);
    expect(ids(alone.steps)).toEqual(['assault', 'punish']);
    expect(alone.steps[0].stall).toBeUndefined();
  });

  it('handles "2t x" offsets and weapon specs', () => {
    const r = parsePvme('deathskulls + 2t undeadslayer → volleyofsouls → omniguard spec → necrobasic → deathguard90 spec', resolve);
    expect(ids(r.steps)).toEqual([
      'death-skulls', 'undead-slayer+@2', 'volley-of-souls', 'necromancy', 'death-essence+', 'necromancy', 'necromancy', 'death-grasp+',
    ]);
  });

  it('turns prose and headings into notes', () => {
    const r = parsePvme('Phase 4\ncommandskeleton → deathskulls → improv with necrobasic / soulsap, build to 70%-80%', resolve);
    expect(r.steps[0]).toMatchObject({ kind: 'note', note: 'Phase 4', phase: true });
    expect(ids(r.steps).slice(1)).toEqual(['command-skeleton-warrior', 'death-skulls', 'note:improv with necrobasic / soulsap, build to 70%-80%']);
    expect(r.unknown).toEqual(['improv with necrobasic / soulsap, build to 70%-80%']);
  });

  it('accepts discord emoji syntax, ascii arrows and bullet lists', () => {
    const r = parsePvme('- <:livingdeath:123> + :adrenrenewal: -> touchofdeath', resolve);
    expect(ids(r.steps)).toEqual(['living-death', 'adrenaline-renewal-potion+', 'touch-of-death']);
  });

  it('keeps annotations as hints and (2t) waits as offsets', () => {
    const r = parsePvme('turmoil → (2t) → deathskulls (DW)', resolve);
    expect(r.steps[1]).toMatchObject({ id: 'death-skulls', offsetTicks: 2, hint: 'DW' });
  });

  it('keeps trailing prose after a known alias as a hint', () => {
    const r = parsePvme('deathskulls asap → soulsap', resolve);
    expect(r.steps[0]).toMatchObject({ id: 'death-skulls', hint: 'asap' });
  });

  it('imports spells as spell steps', () => {
    const r = parsePvme('smokecloud → gconc + bloodbarrage → veng', resolve);
    expect(r.steps.map((s) => s.kind + ':' + s.id)).toEqual(['spell:smoke-cloud', 'ability:greater-concentrated-blast', 'spell:blood-barrage', 'spell:vengeance']);
    expect(r.steps[2].sameTick).toBe(true);
    expect(r.unknown).toEqual([]);
  });

  it('"eof spec" is the Essence of Finality ability, not EoF + weapon special', () => {
    const r = parsePvme('eof spec → omniguard spec', resolve);
    expect(ids(r.steps)).toEqual(['essence-of-finality', 'necromancy', 'death-essence+']);
  });
});

describe('parsePvme – perk / cape / flank variants', () => {
  it('strips known variant suffixes and prefixes when the base ability resolves', () => {
    const r = parsePvme('gricocaroming → overpowerigneous → soulstrikeflank + anticlearheaded → sunshinepf → tsunamiincite → surgemobile + cadeturtling → igneousomnipower → carominggchain → magmatempesttarget', resolve);
    expect(ids(r.steps)).toEqual([
      'greater-ricochet', 'overpower', 'soul-strike', 'anticipation+', 'sunshine', 'tsunami', 'surge', 'barricade+', 'omnipower', 'greater-chain', 'magma-tempest',
    ]);
    expect(r.steps.map((s) => s.hint)).toEqual(['Caroming', 'Igneous', 'Flank', 'Clear Headed', 'Planted Feet', 'Incite Fear', 'Mobile', 'Turtling', 'Igneous', 'Caroming', 'target']);
    expect(r.unknown).toEqual([]);
  });

  it('leaves variants of unknown abilities unknown', () => {
    const r = parsePvme('fbackhandflank → deepimpactflank', resolve);
    expect(ids(r.steps)).toEqual(['note:fbackhandflank', 'note:deepimpactflank']);
    expect(r.unknown).toEqual(['fbackhandflank', 'deepimpactflank']);
  });

  it('combines the variant hint with trailing prose and annotations', () => {
    const r = parsePvme('gricocaroming asap → overpowerigneous (DW)', resolve);
    expect(r.steps[0]).toMatchObject({ id: 'greater-ricochet', hint: 'Caroming, asap' });
    expect(r.steps[1]).toMatchObject({ id: 'overpower', hint: 'Igneous, DW' });
  });
});

describe('parsePvme – stack and status markers', () => {
  it('drops a marker standing alone and keeps it as a hint on the previous step', () => {
    const r = parsePvme('overpower → bloodlust → gflurry + pf → volleyofsouls → residualsoul', resolve);
    expect(ids(r.steps)).toEqual(['overpower', 'greater-flurry', 'volley-of-souls']);
    expect(r.steps[0].hint).toBe('Bloodlust');
    expect(r.steps[1].hint).toBe('Planted Feet');
    expect(r.steps[2].hint).toBe('Residual Soul');
    expect(r.unknown).toEqual([]);
  });

  it('a marker before or after an input becomes its hint', () => {
    const r = parsePvme('bloodlust gflurry → impact flankicon → volleyofsouls with 3 residualsoul', resolve);
    expect(ids(r.steps)).toEqual(['greater-flurry', 'impact', 'volley-of-souls']);
    expect(r.steps.map((s) => s.hint)).toEqual(['Bloodlust', 'Flank', 'with 3 residualsoul']);
    expect(r.unknown).toEqual([]);
  });

  it('a marker at the start of a tick does not make the next input same-tick', () => {
    const r = parsePvme('overpower → bloodlust + gflurry', resolve);
    expect(ids(r.steps)).toEqual(['overpower', 'greater-flurry']);
    expect(r.steps[0].hint).toBe('Bloodlust');
  });

  it('prose containing a marker stays a note', () => {
    const r = parsePvme('build 8 bloodlust stacks → overpower', resolve);
    expect(ids(r.steps)).toEqual(['note:build 8 bloodlust stacks', 'overpower']);
    expect(r.unknown).toEqual(['build 8 bloodlust stacks']);
  });
});

describe('parsePvme – targets', () => {
  it('a boss token is a target cycle with the boss as hint', () => {
    const r = parsePvme('(tc) aod → aod omni → click vorkath → telos → tc amascuthead → surge + vorkath', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'target-cycle', 'omnipower+', 'target-cycle', 'target-cycle', 'target-cycle', 'surge', 'target-cycle+']);
    expect(r.steps.filter((s) => s.id === 'target-cycle').map((s) => s.hint)).toEqual([
      'Angel of Death', 'Angel of Death', 'Vorkath', 'Telos', "Amascut's head", 'Vorkath',
    ]);
    expect(r.unknown).toEqual([]);
  });

  it('"(tc) aod" is one target cycle, not two', () => {
    const r = parsePvme('(tc) aod + bloat', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'bloat+']);
    expect(r.steps[0].hint).toBe('Angel of Death');
  });

  it('a target followed by prose keeps the prose in the hint', () => {
    const r = parsePvme('aod if it is close', resolve);
    expect(r.steps).toEqual([{ kind: 'action', id: 'target-cycle', hint: 'Angel of Death – if it is close' }]);
    expect(r.unknown).toEqual([]);
  });
});

describe('parsePvme – channel cuts', () => {
  it('"asphyx (4t) → x" puts the cut on the channel step instead of a hint', () => {
    const r = parsePvme('wm → asphyx (4t) → dbreath → assault (3t) → punish', resolve);
    expect(ids(r.steps)).toEqual(['wild-magic', 'asphyxiate', 'dragon-breath', 'assault', 'punish']);
    expect(r.steps[1]).toMatchObject({ id: 'asphyxiate', cancelAfterTicks: 4 });
    expect(r.steps[1].hint).toBeUndefined();
    expect(r.steps[3]).toMatchObject({ id: 'assault', cancelAfterTicks: 3 });
    expect(r.unknown).toEqual([]);
  });

  it('"7 hit rapid" and "rapid (7 hits)" become afterHits; a leading "(2t)" stays an offset', () => {
    const r = parsePvme('(tc) + vulnbomb + 7 hit rapid → rapid (7 hits) → (2t) rapid → 3 hits asphyx', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'vulnerability-bomb+', 'rapid-fire+', 'rapid-fire', 'rapid-fire@2', 'asphyxiate']);
    expect(r.steps[2]).toMatchObject({ afterHits: 7 });
    expect(r.steps[3]).toMatchObject({ afterHits: 7 });
    expect(r.steps[3].hint).toBeUndefined();
    expect(r.steps[4].afterHits).toBeUndefined();
    expect(r.steps[5]).toMatchObject({ afterHits: 3 });
    expect(r.unknown).toEqual([]);
  });

  it('a "(1t)" behind something that is not an ability stays prose', () => {
    const r = parsePvme('vulnbomb timewarp (1t) → deathskulls', resolve);
    expect(ids(r.steps)).toEqual(['vulnerability-bomb', 'death-skulls']);
    expect(r.steps.every((s) => s.cancelAfterTicks === undefined)).toBe(true);
    expect(r.steps[0].hint).toBe('timewarp (1t)');
  });
});

describe('parsePvme – alternatives', () => {
  it('"A / B" keeps the first option as the step and drops the alternative', () => {
    const r = parsePvme('necrobasic / fingerofdeath → soulsap → touchofdeath / necrobasic', resolve);
    expect(ids(r.steps)).toEqual(['necromancy', 'soul-sap', 'touch-of-death']);
    expect(r.steps.every((s) => !s.hint)).toBe(true);
    expect(r.unknown).toEqual([]);
  });
});

describe('parsePvme – boss mechanics', () => {
  it('inline mechanics become phase notes, not unknown tokens', () => {
    const r = parsePvme('grico + realmmovement → timewarp → warsretreatteleport dba → rapid + ballista at 2.4 seconds left', resolve);
    expect(ids(r.steps)).toEqual([
      'greater-ricochet', 'note:Realm movement', 'note:Time warp', "note:War's Retreat teleport", 'dragon-battleaxe+', 'rampage+', 'rapid-fire', 'note:Ballista at 2.4 seconds left',
    ]);
    expect(r.steps.filter((s) => s.kind === 'note').every((s) => s.phase)).toBe(true);
    expect(r.unknown).toEqual([]);
  });
});

describe('pvme-aliases.json', () => {
  const known = new Set<string>([
    ...(ABILITIES as { id: string }[]).map((a) => 'ability:' + a.id),
    ...(PRAYERS as { id: string }[]).map((p) => 'prayer:' + p.id),
    ...(SPECIALS as { id: string }[]).map((s) => 'special:' + s.id),
    ...(FAMILIARS as { scroll?: { id: string } }[]).filter((f) => f.scroll).map((f) => 'special:' + f.scroll!.id), // familiar scrolls are specials too
    ...(SPECS as { id: string }[]).map((s) => 'spec:' + s.id),
    ...(SPELLS as { id: string }[]).map((s) => 'spell:' + s.id),
    ...(WEAPONS as { id: string }[]).map((w) => 'gear:' + w.id),
    ...ACTIONS.map((a) => 'action:' + a.id),
    'action:weapon-special-attack', // DataService.resolvePvmeAlias maps it to the ability
  ]);
  const aliases = ALIASES_JSON as Record<string, string>;

  it('every alias key is normalised and every non-item target exists', () => {
    for (const [alias, key] of Object.entries(aliases)) {
      expect(alias, alias).toBe(normalizeAlias(alias));
      if (!key.startsWith('item:') && !key.startsWith('note:')) expect(known.has(key), `${alias} → ${key}`).toBe(true);
    }
  });

  it('maps the PvME spell, ability, prayer and potion tokens from the gap report', () => {
    const expected: Record<string, string> = {
      smokecloud: 'spell:smoke-cloud', bloodbarrage: 'spell:blood-barrage', icebarrage: 'spell:ice-barrage', incitefear: 'spell:incite-fear',
      exsanguinate: 'spell:exsanguinate', veng: 'spell:vengeance', vengeance: 'spell:vengeance', ent: 'spell:entangle', entangle: 'spell:entangle',
      enfeeble: 'spell:enfeeble', shielddome: 'spell:shield-dome', vuln: 'spell:vulnerability', animatedead: 'spell:animate-dead',
      cept: 'spell:intercept', intercept: 'spell:intercept', penanceaspect: 'spell:penance', vampyrismaspect: 'spell:vampyrism', healother: 'spell:heal-other',
      disrupt: 'spell:disruption-shield', airsurge: 'spell:air-surge',
      gconc: 'ability:greater-concentrated-blast', anti: 'ability:anticipation', gsonic: 'ability:greater-sonic-wave', gsonicwave: 'ability:greater-sonic-wave',
      sonicwave: 'ability:sonic-wave', gchain: 'ability:greater-chain', deathsswift: 'ability:death-s-swiftness', deathsswiftness: 'ability:death-s-swiftness',
      corruptblast: 'ability:corruption-blast', comb: 'ability:combust', magmatempest: 'ability:magma-tempest', magmatemptest: 'ability:magma-tempest',
      commandwarrior: 'ability:command-skeleton-warrior', deathsparkorsoulreave: 'ability:necromancy',
      adrenrenewalflask: 'special:adrenaline-renewal-potion', deflectrange: 'prayer:deflect-ranged', protectfrommissiles: 'prayer:protect-from-ranged',
    };
    for (const [alias, key] of Object.entries(expected)) expect(aliases[alias], alias).toBe(key);
    // "vulnbomb" is the special, "vuln" the spell
    expect(aliases['vulnbomb']).toBe('special:vulnerability-bomb');
  });

  it('markers, targets and mechanics are handled by the parser, not the alias table', () => {
    for (const k of [...Object.keys(PVME_MARKERS), ...Object.keys(PVME_TARGETS), ...Object.keys(PVME_MECHANICS)]) expect(aliases[k], k).toBeUndefined();
  });
});

describe('presets.json rotations (golden)', () => {
  /** the alias table as DataService.resolvePvmeAlias sees it: every key of pvme-aliases.json resolves to one step of its kind */
  const KIND: Record<string, RotationStep['kind']> = { ability: 'ability', prayer: 'prayer', special: 'special', spec: 'spec', spell: 'spell', gear: 'weapon', item: 'weapon', action: 'action', note: 'note' };
  const table = ALIASES_JSON as Record<string, string>;
  const fromTable = (alias: string): RotationStep[] | null => {
    const key = table[alias];
    if (!key) return null;
    const i = key.indexOf(':');
    const kind = KIND[key.slice(0, i)];
    return kind ? [kind === 'note' ? { kind, id: '', note: key.slice(i + 1) } : { kind, id: key.slice(i + 1) }] : null;
  };
  const presets = PRESETS as { id: string; boss: string; style: string; variant: string; rotations: { name: string; text: string }[] }[];

  it('the demo preset (Rasial, necromancy) is first, ids are unique, every preset has a variant field and rotations', () => {
    expect(presets[0].boss).toMatch(/^Rasial/);
    expect(presets[0].style).toBe('Necromancy');
    expect(new Set(presets.map((p) => p.id)).size).toBe(presets.length);
    for (const p of presets) {
      expect(typeof p.variant, p.id).toBe('string');
      expect(p.rotations.length, p.id).toBeGreaterThan(0);
    }
  });

  // unknown tokens per preset as of the snapshot (src/app/core/__snapshots__/presets-unknown.json) – update deliberately
  // with `vitest run -u` when the parser or the presets change, and read the diff: a new unknown is a parser regression
  // or an alias missing in pvme-aliases.json
  it('every rotation line parses with exactly the known unknown tokens (regressions of the parser show up here)', async () => {
    const unknown: Record<string, string[]> = {};
    for (const p of presets) {
      const u = p.rotations.flatMap((r) => parsePvme(r.text, fromTable).unknown);
      if (u.length) unknown[p.id] = u;
    }
    await expect(JSON.stringify(unknown, null, 2) + '\n').toMatchFileSnapshot('./__snapshots__/presets-unknown.json');
  });

  it('the shipped channel cuts are understood', () => {
    const steps = (id: string, name: string) => parsePvme(presets.find((p) => p.id === id)!.rotations.find((r) => r.name === name)!.text, fromTable).steps;
    expect(steps('telos-the-warden-magic', 'Drop').find((s) => s.id === 'asphyxiate')).toMatchObject({ cancelAfterTicks: 4 });
    expect(steps('kerapac-the-bound-melee-hm-solo', 'Clone 2').find((s) => s.id === 'assault')).toMatchObject({ cancelAfterTicks: 3 });
    expect(steps('nex-ranged-solo', 'Smoke Phase').find((s) => s.id === 'rapid-fire')).toMatchObject({ afterHits: 7 });
  });
});
