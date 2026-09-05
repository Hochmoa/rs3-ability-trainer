import { describe, expect, it, vi } from 'vitest';
import { Throttle, safeWrite } from './storage.service';

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
