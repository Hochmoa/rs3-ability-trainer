/**
 * The focus / popout view: a small always-visible window next to the game that runs a session like the
 * Train page (route /focus, Train component with route data `focus: true`). This file holds the pure
 * helpers (URL, Alt1 link) and the opener that tries Document Picture-in-Picture first and falls back to
 * a plain popup window.
 */

/** window.open name – a second click reuses the same popup instead of opening another one */
export const POPOUT_NAME = 'rs3focus';
const POPOUT_WIDTH = 520;
const POPOUT_HEIGHT = 360;
export const POPOUT_FEATURES = `popup,width=${POPOUT_WIDTH},height=${POPOUT_HEIGHT}`;

/** the site the Alt1 appconfig points at (Alt1 needs absolute URLs, see public/appconfig.json) */
const SITE_ORIGIN = 'https://rs3trainer.hochware.com';
/** "Add app" link Alt1 registers as a protocol handler: alt1://addapp/<absolute url of appconfig.json> */
export const ALT1_ADD_URL = 'alt1://addapp/' + SITE_ORIGIN + '/appconfig.json';

/** Path of the focus view for a rotation: `/focus?rotation=<id>`; `base` is the app's base href (default "/"). */
export function focusUrl(rotationId: string | null | undefined, base = '/'): string {
  const root = base.endsWith('/') ? base : base + '/';
  return root + 'focus' + (rotationId ? '?rotation=' + encodeURIComponent(rotationId) : '');
}

export type PopoutResult = 'pip' | 'popup' | null;

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

/**
 * Opens `url` in a small window. Chromium: a Document Picture-in-Picture window (stays on top of other windows,
 * also over the game) that hosts the focus view in a full-size iframe – the PiP document itself cannot navigate,
 * so the iframe is what runs the app. Everywhere else, or when PiP refuses (no user gesture, policy, closed
 * by the browser): `window.open(...)` as a normal popup. Returns which one was used, null when the popup was blocked.
 */
export async function openFocusWindow(url: string, width = POPOUT_WIDTH, height = POPOUT_HEIGHT): Promise<PopoutResult> {
  const dpip = (globalThis as { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture;
  if (dpip && typeof dpip.requestWindow === 'function') {
    try {
      const pip = await dpip.requestWindow({ width, height });
      const d = pip.document;
      d.documentElement.style.height = '100%';
      d.body.style.cssText = 'margin:0;height:100%;background:#0f0f12;overflow:hidden';
      const frame = d.createElement('iframe');
      frame.src = url;
      frame.title = 'RS3 Ability Trainer – focus view';
      frame.style.cssText = 'border:0;width:100%;height:100%;display:block';
      frame.addEventListener('load', () => frame.contentWindow?.focus());
      d.body.appendChild(frame);
      return 'pip';
    } catch {
      // fall through to the popup
    }
  }
  const win = window.open(url, POPOUT_NAME, POPOUT_FEATURES);
  if (win) {
    try {
      win.focus();
    } catch {
      // some browsers refuse focus() on popups – harmless
    }
    return 'popup';
  }
  return null;
}

// ------------------------------------------------------------------ Alt1

interface Alt1Api {
  setTitle?: (title: string) => void;
  identifyAppUrl?: (url: string) => void;
}

function alt1(): Alt1Api | null {
  const a = (globalThis as { alt1?: unknown }).alt1;
  return a && typeof a === 'object' ? (a as Alt1Api) : null;
}

/** true inside the Alt1 Toolkit's app browser */
export function inAlt1(): boolean {
  return alt1() !== null;
}

/**
 * Inside Alt1: set the app window's title and tell Alt1 which appconfig this page belongs to (so the
 * "add app" prompt works when the page is opened in the Alt1 browser). No-ops elsewhere; every call is guarded.
 */
export function alt1Announce(title: string, configUrl = SITE_ORIGIN + '/appconfig.json'): void {
  const a = alt1();
  if (!a) return;
  try {
    if (typeof a.setTitle === 'function') a.setTitle(title);
  } catch {
    // older Alt1 builds
  }
  try {
    if (typeof a.identifyAppUrl === 'function') a.identifyAppUrl(configUrl);
  } catch {
    // ignore
  }
}
