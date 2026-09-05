import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DataService } from './data.service';

/** a DataService on a fake HttpClient: `get(url)` answers from `responder`, which the test can swap between calls */
function make(responder: { get: (url: string) => Observable<unknown> }): DataService {
  const http = { get: (url: string) => responder.get(url) } as unknown as HttpClient;
  return Injector.create({ providers: [DataService, { provide: HttpClient, useValue: http }] }).get(DataService);
}

const ok: { get: (url: string) => Observable<unknown> } = { get: () => of([]) };
const down: { get: (url: string) => Observable<unknown> } = { get: () => throwError(() => new Error('offline')) };

describe('DataService load errors', () => {
  it('sets loaded on success and no error', () => {
    const svc = make(ok);
    expect(svc.loaded()).toBe(true);
    expect(svc.loadError()).toBe(false);
  });

  it('flags loadError when a core file fails instead of staying on "Loading…" forever', () => {
    const svc = make(down);
    expect(svc.loaded()).toBe(false);
    expect(svc.loadError()).toBe(true);
  });

  it('retry() fetches the core files again and clears the error once they are in', () => {
    const responder = { get: down.get };
    const svc = make(responder);
    expect(svc.loadError()).toBe(true);
    responder.get = ok.get;
    svc.retry();
    expect(svc.loaded()).toBe(true);
    expect(svc.loadError()).toBe(false);
  });

  it('a failed catalog flags loadError too, and retry() requests that catalog again', async () => {
    const responder = { get: down.get };
    const calls: string[] = [];
    const svc = make({ get: (url) => (calls.push(url), responder.get(url)) });
    responder.get = ok.get; // the core files are fine …
    svc.retry();
    responder.get = down.get; // … but the weapon catalog is not
    await expect(svc.ensure('weapons')).rejects.toThrow('offline');
    expect(svc.loadError()).toBe(true);
    expect(svc.has('weapons')).toBe(false);

    responder.get = ok.get;
    svc.retry();
    expect(svc.loadError()).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.filter((u) => u.endsWith('weapons.json'))).toHaveLength(2);
    expect(svc.has('weapons')).toBe(true);
  });
});
