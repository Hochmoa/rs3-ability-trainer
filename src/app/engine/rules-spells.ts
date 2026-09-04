/**
 * Spell interactions – docs/research/spells.md. Spells are "spell:<id>" entities (public/data/spells.json);
 * their rules use the ability rule shape, keyed by the spell id, and every rule carries the spellbook
 * requirement the loadout has to match.
 */
import { SPELLBOOK_NAMES, Spellbook } from '../core/models';
import { AbilityRule, BuffDef, Effect, Requirement } from './rules-model';

const W = 'https://runescape.wiki/w/';

function book(b: Spellbook): Requirement {
  return { text: 'needs the ' + (b === 'ancient' ? 'Ancient Magicks' : b === 'lunar' ? 'Lunar' : 'Standard') + ' spellbook', spellbook: b };
}

/** combat spells that replace the basic Magic attack when selected; the selection is an instant toggle-like action */
const AUTOCAST: { id: string; name: string; book: Spellbook; text: string }[] = [
  { id: 'air-surge', name: 'Air Surge', book: 'standard', text: 'Basic Magic attack: Air Surge.' },
  { id: 'water-surge', name: 'Water Surge', book: 'standard', text: 'Basic Magic attack: Water Surge.' },
  { id: 'earth-surge', name: 'Earth Surge', book: 'standard', text: 'Basic Magic attack: Earth Surge.' },
  { id: 'fire-surge', name: 'Fire Surge', book: 'standard', text: 'Basic Magic attack: Fire Surge.' },
  { id: 'smoke-barrage', name: 'Smoke Barrage', book: 'ancient', text: 'Basic Magic attack: Smoke Barrage – 3x3 area, targets\' accuracy −5% for 10 s.' },
  { id: 'shadow-barrage', name: 'Shadow Barrage', book: 'ancient', text: 'Basic Magic attack: Shadow Barrage – 3x3 area, targets\' damage −5% for 10 s.' },
  { id: 'blood-barrage', name: 'Blood Barrage', book: 'ancient', text: 'Basic Magic attack: Blood Barrage – 3x3 area, heals 5% of the damage dealt.' },
  { id: 'ice-barrage', name: 'Ice Barrage', book: 'ancient', text: 'Basic Magic attack: Ice Barrage – 3x3 area, freezes creatures for up to 9.6 s.' },
  { id: 'exsanguinate', name: 'Exsanguinate', book: 'ancient', text: 'Basic Magic attack: Exsanguinate – every ability cast grants a Blood Tithe stack (max 12, 20 s), +1% basic ability damage per stack (stacks not simulated).' },
  { id: 'incite-fear', name: 'Incite Fear', book: 'ancient', text: 'Basic Magic attack: Incite Fear – every ability cast grants a Glacial Embrace stack (max 5, 20 s); at 5 stacks Frost Surge fires and Tsunami costs 12% less per stack (stacks not simulated).' },
];
const AUTOCAST_BUFF = (id: string) => 'autocast-' + id;

/** selecting a spell: its selection buff replaces every other one (one auto-cast spell at a time) */
function select(id: string): Effect[] {
  return [...AUTOCAST.filter((a) => a.id !== id).map<Effect>((a) => ({ kind: 'remove-buff', id: AUTOCAST_BUFF(a.id) })), { kind: 'buff', id: AUTOCAST_BUFF(id) }];
}

export const SPELL_BUFFS: BuffDef[] = [
  // ---------------------------------------------------------------- lunar
  { id: 'disruption-shield', absorbs: 'next', untilConsumed: true, name: 'Disruption Shield', kind: 'Buff', on: 'self', durationTicks: null, icon: 'assets/spells/disruption-shield.png',
    text: 'The next hit you take is negated (one hitsplat of melee, ranged, magic, necromancy or soft typeless damage). Takes priority over Vengeance and Resonance. No timer; cannot be recast while it is up.', source: W + 'Disruption_Shield' },
  { id: 'vengeance', untilConsumed: true, name: 'Vengeance', kind: 'Buff', on: 'self', durationTicks: null, icon: 'assets/spells/vengeance.png',
    text: 'The next hit you take deals 75% of its damage back to the attacker (cap 8,000). You still take the full hit; a hit Disruption Shield or Barricade blocks does not trigger it. No timer.', source: W + 'Vengeance' },
  { id: 'spellbook-swap', name: 'Spellbook Swap', kind: 'Buff', on: 'self', durationTicks: 200, icon: 'assets/spells/spellbook-swap.png',
    text: 'One spell of the Standard or Ancient spellbook can be cast within 2 minutes.', source: W + 'Spellbook_Swap' },
  // ---------------------------------------------------------------- ancient
  { id: 'animate-dead', name: 'Animate Dead', kind: 'Buff', on: 'self', durationTicks: 1200, icon: 'assets/spells/animate-dead.png',
    text: 'Flat damage reduction from worn magic tank armour (10% of the armour value per piece + 25% of the Defence level, max 60%) for 12 minutes.', source: W + 'Animate_Dead' },
  { id: 'smoke-cloud', name: 'Smoke Cloud', kind: 'Debuff', on: 'target', durationTicks: 200, critDamageAdd: 0.15, icon: 'assets/spells/smoke-cloud.png',
    text: 'Critical strikes against the target deal +15% (+6% for non-magic attacks) for 2 minutes.', source: W + 'Smoke_Cloud' },
  { id: 'penance', name: 'Penance', kind: 'Buff', on: 'self', durationTicks: 1200, icon: 'assets/spells/penance.png',
    text: '5% of the damage taken is restored as prayer points (up to 100 per hit) for 12 minutes.', source: W + 'Penance' },
  { id: 'vampyrism', name: 'Vampyrism', kind: 'Buff', on: 'self', durationTicks: 1200, icon: 'assets/spells/vampyrism.png',
    text: 'Heals 5% of the damage dealt (up to 50 life points per hit) for 12 minutes.', source: W + 'Vampyrism' },
  { id: 'intercept', name: 'Intercept', kind: 'Buff', on: 'self', durationTicks: 17, icon: 'assets/spells/intercept.png',
    text: 'You take the damage the warded ally would receive, reduced by 5%, for 10 seconds.', source: W + 'Intercept' },
  { id: 'shield-dome', name: 'Shield Dome', kind: 'Buff', on: 'self', durationTicks: 25, icon: 'assets/spells/shield-dome.png',
    text: 'Players inside the dome take up to 50% less damage for 15 seconds (diminishing on repeated casts).', source: W + 'Shield_Dome' },
  // ---------------------------------------------------------------- standard
  { id: 'vulnerability', name: 'Vulnerability', kind: 'Debuff', on: 'target', durationTicks: 100, icon: 'assets/status/vulnerability-target-status.png',
    text: 'Target takes 10% more damage for 1 minute (the same debuff as a vulnerability bomb).', source: W + 'Vulnerability' },
  { id: 'enfeeble', name: 'Enfeeble', kind: 'Debuff', on: 'target', durationTicks: 100, icon: 'assets/spells/enfeeble.png',
    text: 'Target deals 10% less damage for 1 minute.', source: W + 'Enfeeble' },
  { id: 'stagger', name: 'Stagger', kind: 'Debuff', on: 'target', durationTicks: 100, icon: 'assets/spells/stagger.png',
    text: 'Target\'s chance to hit −10% for 1 minute.', source: W + 'Stagger' },
  // ---------------------------------------------------------------- auto-cast selections (one at a time, no timer)
  ...AUTOCAST.map<BuffDef>((a) => ({ id: AUTOCAST_BUFF(a.id), untilConsumed: true, name: a.name + ' (auto-cast)', kind: 'Buff', on: 'self', durationTicks: null, icon: 'assets/spells/' + a.id + '.png', text: a.text, source: W + a.name.replace(/ /g, '_') })),
];

export const SPELL_RULES: AbilityRule[] = [
  // ---------------------------------------------------------------- lunar
  {
    ability: 'disruption-shield',
    requires: [book('lunar'), { text: 'Disruption Shield is still active', notBuff: 'disruption-shield' }],
    notes: [
      'Lunar, level 90, off the global cooldown, 100-tick (60 s) cooldown: the next hit you take is negated – one hitsplat; no timer, cannot be recast while active (' + W + 'Disruption_Shield )',
      'Takes priority over Vengeance and Resonance; a hit it blocks does not count against the prayer score (' + W + 'Disruption_Shield )',
    ],
    onCast: [{ kind: 'buff', id: 'disruption-shield' }],
  },
  {
    ability: 'vengeance',
    sharedCooldown: 'vengeance',
    requires: [book('lunar')],
    notes: [
      'Lunar, level 94, off the global cooldown, 50-tick (30 s) cooldown shared with Vengeance Other / Group: the next hit you take deals 75% of its damage back to the attacker (cap 8,000) – you still take the hit (' + W + 'Vengeance )',
    ],
    onCast: [{ kind: 'buff', id: 'vengeance' }],
  },
  {
    ability: 'vengeance-other',
    sharedCooldown: 'vengeance',
    requires: [book('lunar')],
    notes: ['Lunar, level 93, off the global cooldown: Vengeance on the targeted player; shares the 50-tick Vengeance cooldown (' + W + 'Vengeance_Other )'],
  },
  {
    ability: 'vengeance-group',
    sharedCooldown: 'vengeance',
    requires: [book('lunar')],
    notes: ['Lunar, level 95, off the global cooldown: Vengeance on yourself and every player within 4 tiles; shares the 50-tick Vengeance cooldown (' + W + 'Vengeance_Group )'],
    onCast: [{ kind: 'buff', id: 'vengeance' }],
  },
  { ability: 'heal-other', requires: [book('lunar')], notes: ['Lunar, level 92: consumes 75% of your current life points to heal the targeted player (' + W + 'Heal_Other )'] },
  { ability: 'heal-group', requires: [book('lunar')], notes: ['Lunar, level 95: consumes 75% of your current life points to heal all nearby players (' + W + 'Heal_Group )'] },
  { ability: 'cure-me', requires: [book('lunar')], notes: ['Lunar, level 71: cures poison (' + W + 'Cure_Me )'] },
  {
    ability: 'spellbook-swap',
    requires: [book('lunar')],
    notes: ['Lunar, level 96, off the global cooldown from the action bar: cast one spell of the Standard or Ancient spellbook within 2 minutes (' + W + 'Spellbook_Swap )'],
    onCast: [{ kind: 'buff', id: 'spellbook-swap' }],
  },
  // ---------------------------------------------------------------- ancient
  {
    ability: 'animate-dead',
    requires: [book('ancient')],
    notes: ['Ancient, level 84, ignores the global cooldown and does not interrupt channels: flat damage reduction from magic tank armour for 12 minutes (1200 ticks); recasting refreshes it (' + W + 'Animate_Dead )'],
    onCast: [{ kind: 'buff', id: 'animate-dead' }],
  },
  {
    ability: 'smoke-cloud',
    requires: [book('ancient')],
    notes: ['Ancient, level 74, a normal GCD cast on the target (no magic weapon needed): critical strike damage +15% (+6% for non-magic attacks) for 2 minutes (' + W + 'Smoke_Cloud )'],
    onCast: [{ kind: 'buff', id: 'smoke-cloud' }],
  },
  { ability: 'penance', requires: [book('ancient')], notes: ['Ancient, level 67: 5% of the damage taken restored as prayer points (up to 100 per hit) for 12 minutes (' + W + 'Penance )'], onCast: [{ kind: 'buff', id: 'penance' }] },
  { ability: 'vampyrism', requires: [book('ancient')], notes: ['Ancient, level 69: heals 5% of the damage dealt (up to 50 life points per hit) for 12 minutes (' + W + 'Vampyrism )'], onCast: [{ kind: 'buff', id: 'vampyrism' }] },
  { ability: 'intercept', requires: [book('ancient')], notes: ['Ancient, level 77: ward on an ally for 10 seconds – you take their damage, reduced by 5% (' + W + 'Intercept )'], onCast: [{ kind: 'buff', id: 'intercept' }] },
  { ability: 'shield-dome', requires: [book('ancient')], notes: ['Ancient, level 84: energy shield for 15 seconds reducing damage to every player inside by up to 50% (' + W + 'Shield_Dome )'], onCast: [{ kind: 'buff', id: 'shield-dome' }] },
  // ---------------------------------------------------------------- standard
  {
    ability: 'vulnerability',
    requires: [book('standard')],
    notes: ['Standard, level 66, a normal GCD cast (no magic weapon needed): the target takes 10% more damage for 1 minute (100 ticks) – the same debuff as a vulnerability bomb (' + W + 'Vulnerability )'],
    onCast: [{ kind: 'buff', id: 'vulnerability' }],
  },
  { ability: 'enfeeble', requires: [book('standard')], notes: ['Standard, level 73, GCD cast: the target deals 10% less damage for 1 minute (' + W + 'Enfeeble )'], onCast: [{ kind: 'buff', id: 'enfeeble' }] },
  { ability: 'stagger', requires: [book('standard')], notes: ['Standard, level 80, GCD cast: the target\'s chance to hit −10% for 1 minute (' + W + 'Stagger )'], onCast: [{ kind: 'buff', id: 'stagger' }] },
  { ability: 'bind', requires: [book('standard')], notes: ['Standard, level 20, GCD cast: holds a creature for 12 seconds (20 ticks; players 6 s) (' + W + 'Bind )'], onCast: [{ kind: 'buff', id: 'bound', durationTicks: 20 }] },
  { ability: 'snare', requires: [book('standard')], notes: ['Standard, level 50, GCD cast: holds a creature for 18 seconds (30 ticks; players 9 s) (' + W + 'Snare )'], onCast: [{ kind: 'buff', id: 'bound', durationTicks: 30 }] },
  { ability: 'entangle', requires: [book('standard')], notes: ['Standard, level 79, GCD cast: holds a creature for 24 seconds (40 ticks; players 12 s) (' + W + 'Entangle )'], onCast: [{ kind: 'buff', id: 'bound', durationTicks: 40 }] },
  // ---------------------------------------------------------------- auto-cast selections
  ...AUTOCAST.map<AbilityRule>((a) => ({
    ability: a.id,
    requires: [book(a.book)],
    notes: [SPELLBOOK_NAMES[a.book] + ': selecting ' + a.name + ' as the auto-cast spell is instant and off the global cooldown; it replaces the previously selected spell (' + W + a.name.replace(/ /g, '_') + ' )'],
    onCast: select(a.id),
  })),
];
