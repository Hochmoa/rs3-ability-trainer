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
  const presets = PRESETS as { id: string; rotations: { name: string; text: string }[] }[];

  it('every rotation line parses with exactly the known unknown tokens (regressions of the parser show up here)', () => {
    const unknown: Record<string, string[]> = {};
    for (const p of presets) {
      const u = p.rotations.flatMap((r) => parsePvme(r.text, fromTable).unknown);
      if (u.length) unknown[p.id] = u;
    }
    expect(unknown).toEqual(GOLDEN_UNKNOWN);
  });

  it('the shipped channel cuts are understood', () => {
    const steps = (id: string, name: string) => parsePvme(presets.find((p) => p.id === id)!.rotations.find((r) => r.name === name)!.text, fromTable).steps;
    expect(steps('telos-the-warden-magic', 'Drop').find((s) => s.id === 'asphyxiate')).toMatchObject({ cancelAfterTicks: 4 });
    expect(steps('kerapac-the-bound-hm-solo-melee', 'Clone 2').find((s) => s.id === 'assault')).toMatchObject({ cancelAfterTicks: 3 });
    expect(steps('nex-solo-ranged', 'Smoke Phase').find((s) => s.id === 'rapid-fire')).toMatchObject({ afterHits: 7 });
  });
});

/** unknown tokens per preset as of the snapshot – update deliberately when the parser or the presets change */
const GOLDEN_UNKNOWN: Record<string, string[]> = {
  'rasial-the-first-necromancer-necromancy': [
    'enter instance',
    'nip',
    'improv',
    'improv',
  ],
  'zamorak-lord-of-chaos-500-necromancy': [
    'Kill mages and build 12 necrosis and 5 residualsoul. Use conjurearmy',
    ') vulnbomb (run to pad )',
    'get 5 residualsoul and 4',
    'necrosis stacks.',
    'step on pad',
    'Flames of Zamorak (devo',
    "Infernal Tomb (get out ASAP and phase zamorak. Don't soulstrike or deathguard70 eofspec if zamorak is low LP), or",
    'residualsoul, necrosis stacks, and conjurearmy will not carry over to phase 7. Try to be high adren when going into p7.',
    'Save omniguard spec for phase 7.',
    "Before first rune is shown you should target and kill demon. Once it's dead throw vulnbomb on zamorak and apply invokedeath.",
    'Try to build to 12 necrosis stacks and 5 residualsoul as you kill demon',
    'runes.',
    'If you stacked stormshards, at 6',
    'shards it hits harder than a livingdeath fingerofdeath',
    'Use surge / dive if runes are far apart, or far from zamorak',
    'If you do not have disrupt, use reflect after devo.',
    'Optionally: pre-equip RoD to tank red bombs.',
    'Use splitsoul as second rune dies.',
    'Try to keep your hp low (<60% of your max) after first red bomb hit. Having low hp will not only increase the damage from 6th edict but also make it safer to survive since bleed from RoD will be lower.',
    'Spam anti (if needing adrenaline)',
    'target demon',
    'kill demon.',
    'Target zammy invokedeath',
    'Kill first rune with soulsap / touchofdeath / necrobasic and livingdeath at 100% adren. use splitsoul',
    'Second rune: touchofdeath',
    'move to zam',
    'There is an alternative p7 rotation that requires killing the B-rune. If the B-rune has died once you can use deathskulls on zamorak without it targeting the B-rune.',
    'This rotation assumes the B-rune is called, not that you kill it just to use deathskulls.',
    "If B-rune isn't killed, deathskulls will bounce to and kill B-rune, which deals heavy damage!",
    'Up to zamorak it is the same rotation as described above.',
  ],
  'zamorak-lord-of-chaos-500-ranged': [
    'Build 10 deathsporearrows before the 2nd last witch and use deathsswiftness',
    'after timer appears',
    'step on pad',
    'Witch: anti',
    'Witch: anti',
    'Witch: anti',
    'Witch: anti',
    'Witch: anti',
    'improv if not dead',
    'Demon: anti during cutscene',
    'Runes: rangedbasic',
    'filler if not dead, equip rod for bomb',
  ],
  'sanctum-of-rebirth-hm-solo-necromancy': [
    'Vermyx uses both Melee melee and Ranged range auto-attacks, while Coilspawns only attack with Ranged range',
    '3 autos',
    'Moonstone Shards',
    '2 autos',
    'Wyrmfire',
    '2 autos',
    'repeat',
    '3 autos',
    'Moonstone shards',
    '2 autos',
    'Soul Bomb',
    '1 auto',
    'bomb hit (in that order)',
    '1 auto',
    'Wyrmfire',
    '8 autos',
    'Scarab Healer',
    'Moonstone Shards',
    '3 autos',
    'Scarab Healer (',
    'autos continue)',
    '3 autos',
    'Moonstone shards',
    '2 autos',
    'Soul Bomb',
    '1 auto',
    'bomb hit (in that order)',
    '1 auto',
    'Wyrmfire',
    '7 autos',
    'Scarab Healer',
    'Wyrmfire',
    'Sometimes you may not be able to build off of Coilspawns due to the limited range of Necromancy necromancy',
    "You can flank flank4 by standing right next to Vermyx's head.",
    'Stay in the center after surge to not get attacked by Coilspawns from multiple sides, may stand on the green lines during phases 2 and 3 for a similar result.',
    'go to Coilspawn',
    'go to Vermyx',
    'go to Coilspawn',
    'go to Vermyx',
    'improv',
    'Kezalam uses both Magic magic and Melee melee auto-attacks.',
    'SB-Scattered',
    'Moonstone Prison',
    'Soul Bomb',
    'SB-Targeted',
    'SB-Scattered',
    'Unstable Scarabs',
    'SB-Targeted',
    'repeat',
    'Kill Moonstone Obelisk',
    'SB-Line',
    'SB-Targeted',
    'Unstable Scarabs',
    'SB-Line',
    'SB-Targeted',
    'Moonstone Prison',
    'Soul Bomb',
    'repeat',
    'Kill Moonstone Obelisk',
    'Moonstone Prison',
    'Soul Bomb',
    'SB-Line',
    'SB-Scattered',
    'Moonstone Prison',
    'Soul Bomb',
    'SB-Line',
    'SB-Targeted',
    'repeat',
    'Be MD',
    '1 when prisoned',
    'break free',
    'Do not powerburstofvitality scarabs if you want it to be off CD for Nakatra.',
    'improv',
    'Be MD',
    '1 when prisoned',
    'break free',
    'Do not powerburstofvitality scarabs if you want it to be off CD for Nakatra.',
    'Depending on LP may add more abilities before commandskeleton such as bloat',
    'Allow bloat to phase Kezalam, and use invokedeath while running to the Obelisk.',
    'improv',
    'improvise',
    'Allow deathskulls and conjures to phase Kezalam, and position yourself as shown here.',
    'Only possible if all moonstones are dead (e.g., bloat damage during threadsoffate)',
    'improv',
    'Nakatra switches between Magic magic and Ranged range auto-attacks after each set.',
    '2 magic autos',
    'Soulfire Wave',
    '3 range autos',
    'Obliterate',
    '3 magic autos',
    'Soulfire Wave',
    '3 range autos',
    'Soulfire Wave',
    'Summon Scarabs',
    '1 magic auto',
    'Soulfire Wave',
    '3 range autos',
    'repeat',
    '2 Tiles',
    '3 autos',
    'Obliterate',
    'Soulfire Wave',
    '3 autos',
    '2 Sanctum Hieroglyphs',
    '3 autos',
    'Soulfire Wave',
    'Summon Scarabs',
    '3 autos',
    '2 Sanctum Hieroglyphs',
    'repeat',
    'Summon Nefthys',
    'Soulfire Crosswave',
    'Soulfire Wave',
    'Soulfire Crosswave',
    'Soulfire Wave',
    'Heal Nefthys',
    'repeat',
    'Shadowsands',
    '3 autos',
    'Sanctum Shockwave',
    'Obliterate',
    '3 Sanctum Hieroglyphs',
    'Soulfire Wave',
    '3 Sanctum Hieroglyphs',
    'repeat',
    'In order to survive Obliterate without deflectmage you must be 12k LP before powerburstofvitality and have attunedportentofrestorationx / portentofrestorationx',
    'This may be achieved via brew or pantheonaura',
    'For Obliterate only deflectmage for hit 3.',
    'Make sure reflect is active.',
    'improv',
    'improv',
    'Note: if scarabs spawn you may soulstrikeflank or threadsoffate',
    'improv',
    'May fit in 4 abilities if using volleyofsouls 1 tick before phase 4 begins.',
    'feline akh',
    'improv',
    'Try to group felines and gorillas so that threadsoffate',
    'improv',
    'In order to survive Obliterate without deflectmage you must be 12k LP before powerburstofvitality and have attunedportentofrestorationx / portentofrestorationx',
    'This may be achieved via brew or pantheonaura',
    'Make sure reflect is active.',
    'improv',
    'For Obliterate pray deflectmage for hits 2 and 3.',
    '(equip) roarofawakening odetodeceit',
    '(equip) skulllantern90',
    '(equip) omniguard soulboundlantern',
    'After reflect stand in both Soulfire Waves for extra damage, ~4k damage taken with reflect',
    'Stand MD and tank Wave with deflectmage',
    'feline akh 1',
    'feline akh 2',
    'improv',
  ],
  'sanctum-of-rebirth-hm-solo-melee': [
    'smeleebasic',
    'soverpower',
    'roverpower',
    'scane',
    'rcane',
    'sadaptivestrike',
    'smeleebasic',
    'smeleebasic',
    'sadaptivestrike',
    'smeleebasic',
    'sadaptivestrike',
    'smeleebasic',
    'scane',
    'rcane',
    'prismofsalvation',
    'scane',
    'rcane',
    'click prismofsalvation',
    'sadaptivestrike',
    'scane',
    'rcane',
    'scane',
    'rcane',
    'scane',
    'rcane',
    'scane',
    'rcane',
  ],
  'sanctum-of-rebirth-hm-solo-ranged': [
    'wenarrows sgrico',
    'rgrico',
    'Build 10 wenarrows',
    'improvise with bolg spec / dbow eofspec / snapshot / grico / gloomfirebow eofspec based on stacks',
    'Build 12 deathsporearrows',
    '3-7 perfectequilibrium',
    'improvise',
    'rgrico',
    'target moonstone',
    'target kezalam',
    'build 12 deathsporearrows',
    '3 perfectequilibrium',
    'improvise based on stacks',
    'rdeadshot',
    'improvise until phased',
    'build adrenaline on Nakatra',
    'build wenarrows',
    'wenarrows rapid',
    'improvise',
  ],
  'kerapac-the-bound-hm-solo-necromancy': [
    '3%',
    'genocidal, Nodon dragonkin task required, flank4 switch',
    'Drinking spiritualprayer through the kill is required for this method to work, ideally 4-5',
    'There will be some RNG involved in this strategy due to low scriptureofful proc rates on necromancy and divert adrenaline gain during timewarp',
    'If you relentless5 on deathskulls you can skip adrenrenewal',
    'see !0tick on how to roarofawakening without losing conjurearmy',
    'If lifetransfer is available, use it while kerapac immune and get 100 adren for instant timewarp.',
    'On kills with 0 jumps, lifetransfer will not be up. if you have adren from relentless5 procs you can bloat while kerapac is immune for extra damage',
    'You can opt to flank4; soulstrike after step under for some consistent damage, but it is not required.',
    'If no divert adren, end timewarp with commandskeleton and deathskulls',
    'Try not to skip jump p3 as you cant conjurearmy if Kerapac is not in attack range',
  ],
  'kerapac-the-bound-hm-solo-melee': [
    'Start fight with lengmh berserk',
    'walk under cane',
    '2 or 3 hit assault to hit 110k',
    'Defensive',
    'walk under massacre',
    'improvise',
    'Rotation not as set in stone here because relentless5 / imp4 / adrenaline before timewarp can all change which abilities you use',
    'To save 1 GCD on clone 2 you need 3 primordialice',
    'primordialice and replace the assault',
    'On clone 3 you instead use pulverise / punish as the 3rd ability.',
  ],
  'kerapac-the-bound-hm-solo-ranged': [
    'Do not timewarp and deathsswiftness on the same tick.',
    'Have darkness active for a smoother P4.',
    'sdeadshot',
    'sgrico',
    'rgrico',
  ],
  'nex-solo-necromancy': [
    'walk to middle-south',
    '(at around 6s) dealerlegs80',
    'walk 1 tile north-east of Nex',
    'walk towards nex for skull bounce',
    'Umbra',
    'Cruor',
    'Position Nex near Cruor if possible so that bloat spreads to her when Cruor dies.',
    'Glacies',
    'improv',
  ],
  'nex-solo-melee': [
    'Fumus',
    'soverpowerigneous',
    'roverpowerigneous',
    'Cruor',
    'run a couple tiles towards Glacies then surge',
    'If Nex uses deflectmelee, can swap to roarofawakening spec, dbreath and combust, or just wait it out',
    'improvise with zgs spec / gflurry and basics',
    "Make sure you don't have crack4 or 100% as4 that accidentally phases Nex.",
    'If you get caught in an Ice Prison use Freedom freedom then divert, optionally also use powerburstofvitality',
    'no overhead curse',
    'If Nex ends her Ice Phase with DeflectMage, there is a chance it will carry over to Zaros Phase. She may also switch to DeflectMage during Zaros phase, improvise accordingly.',
    'When Nex uses DeflectMelee, there is a chance your attacks will be reflected back at you if you hit her.',
  ],
  'nex-solo-ranged': [
    'Use vampyrismaspect',
  ],
  'arch-glacor-high-enrage-necromancy': [
    "Rotations for Arch-Glacor are not strict, as per the random nature of the boss's mechanics. Aim to upkeep bloat & conjurearmy as much as possible.",
    'At 3500%',
    'enrage, always reserve splitsoul splitsoul for the exposed core.',
    "Living Death livingdeath is best used during the flurry mechanic. This mechanic gives you a long, uninterrupted window in which you can deal damage to Arch-Glacor. It can situationally be used to reset deathskulls cooldown in anticipation of an upcoming exposed core mechanic. livingdeath shouldn't be strategically reserved for arms, as the time it takes to clear the mechanic doesn't largely change with or without the ult active.",
    'Ensure that some Necrosis Stacks necrosis (4',
    ') and Residual Souls residualsoul (2',
    ') are held for the Exposed Core.',
    'It is best to start the fight with bloat , as it is a low adren investment that has no cooldown, and has high use priority during the fight. There is a 2/5 chance you get a mechanic (minions/exposed core) that will nullify your first attacks.',
    'Equipped before casting conjurearmy .',
    'Have your conjures conjurearmy active and Ghost commanded commandghost.',
    'In some cases, it may be best to equip excal excalibur to dismiss conjures, and re-conjure conjurearmy to refresh their timer before the next mechanic, if you are anticipating arms coming soon in the spec order. It is essential that conjures have a long enough timer to be active throughout the entire mechanic.',
    'Use limitless / adrenrenewal where required depending on adrenaline in order to use devo .',
    'If you need to cade , use divert and flick to soulsplit for 1 tick to get to 100% adrenaline.',
    'If starting with low residualsoul soul stacks (1-2), use soulstrikeflank over volleyofsouls.',
    'Use soulsap & touchofdeath where appropriate to build adren and stacks before dumping.',
    'Offstyle soulfire roarofawakening',
    'Use invokedeath',
    'Always cast spectralscythe before invokedeath',
    'Cast vulnbomb on the magic minion closest to the bolstering glacyte. This will cause vulnerability to apply to all five glacytes.',
    'Frost Cannon: anti',
    'Alternatively; anti',
    'be overhealed with brew on first hit. Use of any one of these will ensure you survive the mechanic.',
    'Exposed Core (arms): devo',
    'Glacyte Minions: debil on arch-glacor (2500%',
    ') and, rarely, anti / freedom to block or clear stun the freezing blood stun.',
    'Pillars of Ice: lifetransfer',
  ],
  'telos-the-warden-necromancy': [
    'Optional: to reduce P1-2 RNG pushing up from 3000%',
    '4000%, you can staffoflight eofspec at adrenaline crystal.',
    'enter instance.',
    '(wait 2t) surge',
    '(tendrils) volleyofsouls',
    'For information on how to use sticky bombs stickybomb in phase 4 for minions effectively, please see <#1252206370657271878>.',
    'Equip your clearheaded 4 clearheaded and turtling turtling4 switch.',
    'Alternatively, use freedom before volleyofsouls in font 1.',
    "( soulsap ) in font 1 is optional, and should only be needed if you're at 4/5 stacks due to phasing p2/3 faster.",
    'Use adrenrenewal',
    'sailfishsoup at the end of font 3 if needed, to overheal, and reach 100% adrenaline for p4 start.',
    '<50% adren: soulstrike',
    '( soulsap / necrobasic )',
    'turtling4 cade',
  ],
  'telos-the-warden-melee': [
    'Make sure you have at least 2 bloodlust stacks.',
    'wait 1 tick',
  ],
  'telos-the-warden-magic': [
    'equip (kerapacswristwraps)',
    'equip (tumekengloves)',
    'If redgolem then anti after gsunshine',
  ],
  'telos-the-warden-ranged': [
    '1000% P4 one rock will fall, P5 multiple rocks will fall, immort no longer works P5, and Telos will freedom stuns and binds with a 16 tick cooldown.',
    'T2 malletops and high necromancy level is required for cade with turtling4 and greaterboneshield during p5.',
    'wenarrows',
    'wenarrows deathsswiftness',
    'If using equilibrium and scriptureofful procs on gricocaroming replace gloomfirebow with zammybow and anti after while divemobile to jump spot',
    'wenarrows piercingshot',
    'run to middle, then in redbeam',
    'equip bolg',
    'go to greenbeam',
  ],
  'vorkath-necromancy': [
    'undeadslayerperk',
    "genocidal can be combo'd on the same gizmo",
    'Zemouregal: 250k constitution per player (500k in Hardmode)',
    'Enter gate conjurearmy',
    'giant commandskeleton vulnbomb',
    'Target Zemouregal',
    'prismofrestoration',
    'Replace 2nd soulsap with anti if no Zonal ice skip',
    'If Vorkath is below 800k hp, do not use balista',
    'prismofrestoration',
    'The 1st volleyofsouls assumes that 3 residualsoul stacks were obtained from the threadsoffate against Zemo. If more or less were obtained then adjust accordingly',
    'prismofrestoration',
  ],
  'vorkath-melee': [
    'enter portal',
    'claim loot and rejoin instance',
    'click door',
    'sadaptivestrike',
    'equip lengmh lengoh',
    'Two rotation options are provided using either dba',
    'Using dba',
    'stall w/basics until less than 10 sec left on meteorstrike cooldown',
    'equip amhej',
    'target Zemouregal',
    'sadaptivestrike',
    'equip ezk',
    'soverpower',
    'roverpower',
    'Using annihilation eof',
    'stall w/basics until less than 10 sec left on meteorstrike cooldown',
    'target Zemouregal',
    '2t',
    'Hit chance on Zemouregal is very tight under dba. If brewed down at all or without maximum accuracy, dragonscimitar is necessary to maintain 100% hitchance.',
    'It is extremely important to control damage to not overphase Vorkath below 765k into flight phase while there is significant >13 sec meteorstrike cooldown remaining. If this happens, the chance of a successful kill is low.',
    'Activate ballista 2-3 ticks into the first assault. Do not activate a 2nd ballista until after Vorkath departs for flight.',
    '(equip lengmh)',
    'claim',
    'instance',
    'enter door',
    'click Zemouregal',
    '(equip lengmh) adaptivestrike',
    'basics until 764k phased',
    '(equip ezk',
    'any defensive',
    'improv',
  ],
};
