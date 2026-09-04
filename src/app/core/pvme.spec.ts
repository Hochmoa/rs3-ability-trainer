import { describe, expect, it } from 'vitest';
import ABILITIES from '../../../public/data/abilities.json';
import ALIASES_JSON from '../../../public/data/pvme-aliases.json';
import PRAYERS from '../../../public/data/prayers.json';
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

const ids = (steps: RotationStep[]) => steps.map((s) => (s.kind === 'note' ? 'note:' + s.note : s.id + (s.sameTick ? '+' : '') + (s.offsetTicks !== undefined ? '@' + s.offsetTicks : '')));

describe('parsePvme', () => {
  it('splits ticks on arrows and same-tick actions on plus', () => {
    const r = parsePvme('(tc) bloat + vulnbomb → deathskulls → necrobasic → touchofdeath → soulsap', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'bloat+', 'vulnerability-bomb+', 'death-skulls', 'necromancy', 'touch-of-death', 'soul-sap']);
    expect(r.unknown).toEqual([]);
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
    const r = parsePvme('(tc) aod → aod omni → click dummy → telos → tc amascuthead → surge + dummy', resolve);
    expect(ids(r.steps)).toEqual(['target-cycle', 'target-cycle', 'omnipower+', 'target-cycle', 'target-cycle', 'target-cycle', 'surge', 'target-cycle+']);
    expect(r.steps.filter((s) => s.id === 'target-cycle').map((s) => s.hint)).toEqual([
      'Angel of Death', 'Angel of Death', 'Combat dummy', 'Telos', "Amascut's head", 'Combat dummy',
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
      if (!key.startsWith('item:')) expect(known.has(key), `${alias} → ${key}`).toBe(true);
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
