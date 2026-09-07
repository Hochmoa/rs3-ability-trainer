import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { Keybind, SetupBundle } from './models';
import { Throttle, safeWrite, setupReplacement } from './storage.service';

describe('safeWrite – IndexedDB writes never throw', () => {
  it('returns the result of a successful operation and reports nothing', async () => {
    const report = vi.fn();
    expect(await safeWrite(async () => 42, report)).toBe(42);
    expect(report).not.toHaveBeenCalled();
  });

  it('swallows a rejection, hands it to report and resolves undefined', async () => {
    const report = vi.fn();
    const err = new DOMException('quota', 'QuotaExceededError');
    expect(await safeWrite(() => Promise.reject(err), report)).toBeUndefined();
    expect(report).toHaveBeenCalledWith(err);
  });

  it('also catches an operation that throws synchronously (e.g. the database failed to open)', async () => {
    const report = vi.fn();
    const result = await safeWrite(() => {
      throw new Error('closed');
    }, report);
    expect(result).toBeUndefined();
    expect(report).toHaveBeenCalledOnce();
  });
});

describe('Throttle – one toast per window', () => {
  it('runs the first call, drops the ones inside the window, runs again after it', () => {
    let now = 1000;
    const t = new Throttle(30_000, () => now);
    const fn = vi.fn();
    expect(t.fire(fn)).toBe(true);
    now += 10_000;
    expect(t.fire(fn)).toBe(false);
    now += 19_999;
    expect(t.fire(fn)).toBe(false);
    now += 1;
    expect(t.fire(fn)).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

/** a shared setup as the Setups page hands it to replaceSetup */
function bundle(p: Partial<SetupBundle>): SetupBundle {
  return { settings: {} as SetupBundle['settings'], loadouts: [], activeLoadoutId: '', enemy: null, keybinds: {}, actionBars: null, ...p };
}

describe('setupReplacement – "load this setup" must not cost the player their configuration', () => {
  it('keeps the own keybinds and bars when the shared setup carries none (every guide account)', () => {
    const r = setupReplacement(bundle({}));
    expect(r.keybinds).toBeNull();
    expect(r.actionBars).toBeNull();
  });

  it('an action bar setup whose presets are all empty counts as none', () => {
    const bars = { presets: [{ id: 1, name: 'Main', slots: [null, null] }], positions: [], bindings: {}, slotKeybinds: [], weaponKeybinds: {} } as unknown as SetupBundle['actionBars'];
    expect(setupReplacement(bundle({ actionBars: bars })).actionBars).toBeNull();
  });

  it('takes the shared keybinds and bars when there are any, and drops malformed key entries', () => {
    const bars = { presets: [{ id: 1, name: 'Main', slots: ['ability:slice'] }], positions: [], bindings: {}, slotKeybinds: [], weaponKeybinds: {} } as unknown as SetupBundle['actionBars'];
    const r = setupReplacement(bundle({ keybinds: { 'ability:slice': { code: 'Digit1', shift: true } as Keybind, broken: {} as Keybind }, actionBars: bars }));
    expect(r.keybinds).toEqual({ 'ability:slice': { code: 'Digit1', ctrl: false, shift: true, alt: false } });
    expect(r.actionBars).toBe(bars);
  });
});
