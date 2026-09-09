import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, defaultActionBars, newLoadout } from './models';
import { EngineDebugState, TRACE_EVENT_CAP, TraceRecorder, traceSummary } from './trace';

const state = (tick: number): EngineDebugState => ({
  tick,
  step: 0,
  expected: 'ability:sever',
  adrenaline: 50,
  gcdEnd: null,
  castTick: null,
  busyUntil: null,
  settleUntil: null,
  wield: { mainHand: 'a', offHand: 'b', twoHand: null },
  queued: null,
  inflight: [],
  held: null,
  channel: null,
  buffs: [],
  spirits: [],
  cooldowns: [],
  charges: [],
  prayers: [],
  targetHp: 0,
  damageDealt: 0,
});

function recorder(): TraceRecorder {
  return new TraceRecorder(
    {
      build: 'test',
      startedAt: 1000,
      setup: { boss: 'Nex', name: 'solo ranged', style: 'Ranged' },
      rotation: { id: 'r', name: 'Blood Phase', chained: false },
      steps: [{ kind: 'ability', id: 'sever' }],
      settings: DEFAULT_SETTINGS,
      loadout: newLoadout('x'),
      bars: defaultActionBars(),
      prebuild: null,
      enemy: null,
    },
    5000,
  );
}

describe('the session trace', () => {
  it('records inputs with their state, engine events with a state only where they decide something, feedback once per text', () => {
    const r = recorder();
    r.input('ability:sever', 'key 1', 5100, state(3));
    r.event({ kind: 'fired', result: { name: 'Sever' } }, 5200, 4, () => state(4));
    r.event({ kind: 'hit', key: 'ability:sever', amount: 1234 }, 5800, 5, () => state(5));
    r.feedback('Sever, on tick', 'good', 5210, 4);
    r.feedback('Sever, on tick', 'good', 5300, 4);
    const t = r.end('stopped', 6000, null);
    expect(t.events.map((e) => e.kind)).toEqual(['input', 'fired', 'hit', 'feedback', 'end']);
    expect(t.events[0]).toMatchObject({ t: 100, tick: 3, key: 'ability:sever', source: 'key 1' });
    expect(t.events[0].state?.adrenaline).toBe(50);
    expect(t.events[1].state?.tick).toBe(4);
    expect(t.events[2].state).toBeUndefined();
    expect(t.reason).toBe('stopped');
    expect(t.endedAt).not.toBeNull();
  });

  it('stops recording at the cap, so a runaway session cannot fill the storage', () => {
    const r = recorder();
    for (let i = 0; i < TRACE_EVENT_CAP + 50; i++) r.event({ kind: 'hit', key: 'x', amount: 1 }, 5000 + i, i, null);
    expect(r.trace.events.length).toBe(TRACE_EVENT_CAP);
  });

  it('summarises for the Settings page', () => {
    const t = recorder().end('finished', 6000, null);
    const s = traceSummary(t);
    expect(s).toContain('Nex · solo ranged');
    expect(s).toContain('Blood Phase');
    expect(s).toContain('1 events, finished');
  });
});
