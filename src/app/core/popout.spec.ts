// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALT1_ADD_URL, POPOUT_FEATURES, POPOUT_NAME, alt1Announce, focusUrl, inAlt1, openFocusWindow } from './popout';

describe('focusUrl', () => {
  it('builds /focus?rotation=<id> under the base href', () => {
    expect(focusUrl('abc')).toBe('/focus?rotation=abc');
    expect(focusUrl('abc', '/app/')).toBe('/app/focus?rotation=abc');
    expect(focusUrl('abc', '/app')).toBe('/app/focus?rotation=abc');
  });

  it('encodes the id and leaves the query out when there is none', () => {
    expect(focusUrl('a b&c=d')).toBe('/focus?rotation=a%20b%26c%3Dd');
    expect(focusUrl(null)).toBe('/focus');
    expect(focusUrl(undefined)).toBe('/focus');
    expect(focusUrl('')).toBe('/focus');
  });
});

describe('ALT1_ADD_URL', () => {
  it('is the alt1://addapp link to the absolute appconfig url', () => {
    expect(ALT1_ADD_URL).toBe('alt1://addapp/https://rs3trainer.hochware.com/appconfig.json');
  });
});

describe('openFocusWindow', () => {
  const g = globalThis as { documentPictureInPicture?: unknown; window: Window & typeof globalThis };

  afterEach(() => {
    delete g.documentPictureInPicture;
    vi.restoreAllMocks();
  });

  it('falls back to window.open when Document Picture-in-Picture is missing', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({ focus: () => undefined } as unknown as Window);
    await expect(openFocusWindow('/focus?rotation=x')).resolves.toBe('popup');
    expect(open).toHaveBeenCalledWith('/focus?rotation=x', POPOUT_NAME, POPOUT_FEATURES);
  });

  it('reports a blocked popup as null', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(openFocusWindow('/focus')).resolves.toBeNull();
  });

  it('uses a PiP window with a full-size iframe when the API is there', async () => {
    const pipDoc = document.implementation.createHTMLDocument('pip');
    const requestWindow = vi.fn().mockResolvedValue({ document: pipDoc });
    g.documentPictureInPicture = { requestWindow };
    const open = vi.spyOn(window, 'open');
    await expect(openFocusWindow('/focus?rotation=x', 500, 300)).resolves.toBe('pip');
    expect(requestWindow).toHaveBeenCalledWith({ width: 500, height: 300 });
    const frame = pipDoc.body.querySelector('iframe');
    expect(frame?.getAttribute('src')).toBe('/focus?rotation=x');
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to the popup when PiP refuses', async () => {
    g.documentPictureInPicture = { requestWindow: vi.fn().mockRejectedValue(new Error('NotAllowedError')) };
    vi.spyOn(window, 'open').mockReturnValue({ focus: () => undefined } as unknown as Window);
    await expect(openFocusWindow('/focus')).resolves.toBe('popup');
  });
});

describe('alt1', () => {
  const g = globalThis as { alt1?: unknown };

  afterEach(() => {
    delete g.alt1;
  });

  it('is a no-op outside Alt1', () => {
    expect(inAlt1()).toBe(false);
    expect(() => alt1Announce('x')).not.toThrow();
  });

  it('sets the title and identifies the app config when the API offers it', () => {
    const setTitle = vi.fn();
    const identifyAppUrl = vi.fn();
    g.alt1 = { setTitle, identifyAppUrl };
    expect(inAlt1()).toBe(true);
    alt1Announce('RS3 Ability Trainer');
    expect(setTitle).toHaveBeenCalledWith('RS3 Ability Trainer');
    expect(identifyAppUrl).toHaveBeenCalledWith('https://rs3trainer.hochware.com/appconfig.json');
  });

  it('survives an Alt1 build without those methods or one that throws', () => {
    g.alt1 = { setTitle: () => { throw new Error('nope'); } };
    expect(() => alt1Announce('x')).not.toThrow();
    g.alt1 = {};
    expect(() => alt1Announce('x')).not.toThrow();
  });
});
