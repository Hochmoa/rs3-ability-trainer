/**
 * The guided tour: a dark veil over the page with a hole around one element, a card next to it and a "Next"
 * button (shared/tour.ts draws it, this file is the script and the geometry).
 *
 * It is meant to be unobtrusive: it starts once on the first visit, every step can be skipped, the highlighted
 * element stays clickable so the reader can try it there and then, and Settings replays it. A step whose target
 * is not on the page – a panel that needs data, a page the simple view hides – is passed over instead of
 * showing an empty spotlight.
 */

export interface TourStep {
  id: string;
  /** page the step lives on ('' = the Train page); the tour navigates there before it shows the step */
  route: string;
  /** CSS selector of the element the spotlight sits on; missing = a card in the middle of the screen */
  target?: string;
  title: string;
  text: string;
  /** only shown in the advanced view (Settings → simple / advanced) */
  advancedOnly?: boolean;
}

/** what the veil covers and where the card goes */
export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: '/',
    title: 'Want the short tour?',
    text: 'This trainer runs a RuneScape rotation on the game clock: 0.6 second ticks, a 1.8 second global cooldown, your ping. Two minutes and you know your way around. Skip whenever you like.',
  },
  {
    id: 'setup',
    route: '/',
    target: '[data-tour="setup"]',
    title: 'A setup is what you train',
    text: 'One setup holds a boss, the gear for it and the rotations you play with it. Every PvME guide is in here as a ready-made one, and you can build your own.',
  },
  {
    id: 'rotation',
    route: '/',
    target: '[data-tour="rotation"]',
    title: 'Its rotations',
    text: 'A boss is a chain of phases, so a setup usually holds several rotations. Pick the one you want to drill.',
  },
  {
    id: 'start',
    route: '/',
    target: '[data-tour="start"]',
    title: 'Press Start, then your keys',
    text: 'The session runs on the game clock, with the ping you set. Every press comes back as perfect, early or late.',
  },
  {
    id: 'queue',
    route: '/',
    target: '[data-tour="queue"]',
    title: 'The queue tells you what is next',
    text: 'The big icon is due now, the small ones come after it. The dark sweep over an icon is the cooldown that still has to run.',
  },
  {
    id: 'bars',
    route: '/',
    target: '[data-tour="bars"]',
    title: 'Your action bars, as in game',
    text: 'Whatever sits here fires on your key. If a rotation needs something that has no key yet, a button above the bars puts it on a free slot.',
  },
  {
    id: 'setups-page',
    route: '/setups',
    target: '[data-tour="setup-tabs"]',
    title: 'Where setups come from',
    text: 'Under "All setups" you find every PvME boss setup and what other players share. One click copies gear and rotations to you. Your own are under "My setups".',
  },
  {
    id: 'gear',
    route: '/loadout',
    target: '[data-tour="catalog"]',
    title: 'The gear of a setup',
    text: 'The list is sorted by how often PvME setups use an item. Click a card to take the whole group, a weapon with its off-hand or a full armour set. Click one icon for that piece only.',
    advancedOnly: true,
  },
  {
    id: 'bars-page',
    route: '/bars',
    target: '[data-tour="bar-presets"]',
    title: '18 bars, like in the game',
    text: 'These belong to you alone. No setup you use and nothing you import ever writes into them.',
  },
  {
    id: 'keys',
    route: '/keybinds',
    target: '[data-tour="keys"]',
    title: 'Your keys',
    text: 'A key belongs to a bar slot, the way the game does it. Bind them one by one by pressing, or take a layout and let it fill what is still empty.',
  },
  {
    id: 'settings',
    route: '/settings',
    target: '[data-tour="game-options"]',
    title: 'Make it match your game',
    text: 'Set your ping, ability queueing and revolution the way you actually play. Then the scoring matches what you feel in game.',
  },
  {
    id: 'done',
    route: '/',
    title: 'That is the whole thing',
    text: 'Pick a setup, press Start, follow the queue. If you want this tour again, it is in Settings.',
  },
];

/** The steps that are actually shown: the advanced-only ones are dropped in the simple view. */
export function visibleSteps(steps: readonly TourStep[], advanced: boolean): TourStep[] {
  return steps.filter((s) => advanced || !s.advancedOnly);
}

/**
 * The spotlight around an element: its rectangle grown by `pad`. Deliberately not clamped to the viewport – an
 * element that is still below the fold (the smooth scroll has not landed yet) would otherwise collapse the hole
 * to a line. `blockers` cuts the veil to the screen instead.
 */
export function spotlight(rect: Box, pad: number): Box {
  return { left: rect.left - pad, top: rect.top - pad, width: rect.width + 2 * pad, height: rect.height + 2 * pad };
}

/**
 * The four rectangles that veil everything but the spotlight – above it, below it, and left and right of it.
 * Using four blockers instead of one masked overlay keeps the hole clickable in every browser.
 */
export function blockers(box: Box | null, view: Viewport): Box[] {
  if (!box) return [{ top: 0, left: 0, width: view.width, height: view.height }];
  const bottom = box.top + box.height;
  const right = box.left + box.width;
  // every part is cut to the screen, so a hole that reaches past an edge leaves its part at zero size and no two
  // parts ever overlap (two veils on the same pixels would paint it twice as dark)
  const bandTop = Math.max(0, Math.min(box.top, view.height));
  const bandBottom = Math.max(0, Math.min(bottom, view.height));
  const bandHeight = Math.max(0, bandBottom - bandTop);
  return [
    { top: 0, left: 0, width: view.width, height: bandTop },
    { top: bandBottom, left: 0, width: view.width, height: Math.max(0, view.height - bandBottom) },
    { top: bandTop, left: 0, width: Math.max(0, Math.min(box.left, view.width)), height: bandHeight },
    { top: bandTop, left: Math.max(0, Math.min(right, view.width)), width: Math.max(0, view.width - right), height: bandHeight },
  ].filter((r) => r.width > 0 && r.height > 0);
}

export type CardPlacement = 'below' | 'above' | 'centre';

/**
 * Where the card goes: under the spotlight when it fits, over it otherwise, centred when there is no spotlight
 * or neither side has room. Always inside the viewport with an 8 px margin.
 */
export function cardPosition(box: Box | null, card: { width: number; height: number }, view: Viewport, gap = 12): { top: number; left: number; placement: CardPlacement } {
  const margin = 8;
  const centre = () => ({ top: Math.max(margin, (view.height - card.height) / 2), left: Math.max(margin, (view.width - card.width) / 2), placement: 'centre' as const });
  if (!box) return centre();
  const below = box.top + box.height + gap;
  const above = box.top - gap - card.height;
  const placement: CardPlacement = below + card.height <= view.height - margin ? 'below' : above >= margin ? 'above' : 'centre';
  if (placement === 'centre') return centre();
  const left = Math.min(Math.max(margin, box.left + box.width / 2 - card.width / 2), Math.max(margin, view.width - card.width - margin));
  return { top: placement === 'below' ? below : above, left, placement };
}
