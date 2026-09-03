/**
 * Crawlable static content per route, injected into <app-root> by postbuild.mjs. Angular replaces
 * it as soon as it bootstraps, so it is only ever seen by crawlers without JavaScript, link
 * previews and users on a very slow connection. Keep it truthful to what the page really offers.
 */
const nav = `
<nav aria-label="Pages">
  <a href="/">Train</a> · <a href="/rotations">Rotations</a> · <a href="/bars">Action bars</a> · <a href="/keybinds">Keybinds</a> ·
  <a href="/loadout">Loadout</a> · <a href="/settings">Settings</a> · <a href="/explore">Explore</a> · <a href="/privacy">Privacy</a>
</nav>`;

const footer = `
<p><small>Not affiliated with Jagex. Ability, prayer and item icons and names are © Jagex Ltd, taken from the
<a href="https://runescape.wiki" rel="noopener">RuneScape Wiki</a> (CC BY-NC-SA 3.0). Non-commercial fan tool ·
<a href="https://github.com/Hochmoa/rs3-ability-trainer" rel="noopener">source on GitHub</a> · <a href="https://hochware.com" rel="noopener">hochware.com</a></small></p>
<noscript><p><strong>This trainer needs JavaScript</strong> – it runs a live combat clock in your browser.</p></noscript>`;

export const content = {
  '': `
<p>RS3 Ability Trainer is a free browser tool for practising <strong>RuneScape 3 ability rotations</strong> outside the game.
It runs on the real combat clock – 0.6 second ticks and a 1.8 second global cooldown – and simulates adrenaline, cooldowns,
buffs, the in-game “Allow ability queueing” option and your ping, so you learn <em>when</em> to press, not just what to press.</p>
<h2>What you can practise</h2>
<ul>
  <li>Rotations built from RuneScape Wiki data: abilities, prayers and curses, weapon switches, special attacks and adrenaline potions.</li>
  <li>Rotations written in <strong>PvME notation</strong> (→, +, tc, spec …) – paste them and they become a trainable queue.</li>
  <li>Your own action bars and keybinds, including Ctrl, Shift and Alt combinations, laid out like your in-game interface.</li>
  <li>Loadouts with weapons, armour, perks, relics and prayer book, whose effects change cooldowns and adrenaline.</li>
  <li>A session summary that marks every input as perfect, early or late, with the tick offset.</li>
  <li>Public rotations shared by other players, ready to copy and train.</li>
</ul>
<h2>How it works</h2>
<ol>
  <li>Build a rotation in the editor or import it from PvME notation.</li>
  <li>Put the abilities on your action bars and bind keys exactly like in RuneScape.</li>
  <li>Press Start and follow the queue on the real tick and global cooldown timing.</li>
  <li>Review the summary, adjust ping or ability queueing, and go again.</li>
</ol>
<p>Everything is stored in your browser. An optional free account syncs rotations and keybinds between devices and lets you publish rotations.</p>`,

  rotations: `
<p>Build a RuneScape 3 rotation step by step: abilities, prayers and curses, weapon switches, special attacks and adrenaline potions,
each with cooldown, adrenaline cost, damage and effect data from the RuneScape Wiki (state after the Combat Style Modernisation, March 2026).</p>
<p>Or paste a rotation in <strong>PvME notation</strong> – arrows for the next global cooldown, <code>+</code> for the same tick,
<code>(tc)</code> for target cycle, <code>spec</code> for the special attack of the wielded weapon – and it becomes a trainable queue.
Rotations can be public so other players can find them on the Explore page.</p>`,

  explore: `
<p>Browse public RuneScape 3 rotations shared by other players. Filter by combat style (melee, ranged, magic, necromancy),
sort by newest or most copied, and copy any rotation into your own list to practise it with real tick timing.</p>`,

  bars: `
<p>Recreate your RuneScape 3 action bars: create presets, put abilities, prayers and items on the slots, choose the slot layout
and bind bars to positions – exactly like the in-game interface, so what you see in the trainer matches what you see in the game.</p>`,

  keybinds: `
<p>Keys belong to a bar position and slot, exactly like in the game: whatever preset is shown there fires on that key.
Bind single keys or combinations with Ctrl, Shift and Alt, plus keys for weapon switches and client actions such as target cycle.</p>`,

  loadout: `
<p>Set up your loadout: main hand, off hand and two-handed weapons, carried switches, armour set, perks, relics and prayer book.
The trainer applies their effects – for example to ability cooldowns and adrenaline – so the rotation behaves like it does in the game.</p>`,

  settings: `
<p>Adjust how the trainer simulates the game: ping and jitter, the in-game “Allow ability queueing” option
(off: only a press in the last tick of the global cooldown queues; on: any press during the cooldown queues), looping and enemy behaviour.</p>`,

  privacy: `
<p>The trainer stores rotations, action bars, keybinds, loadouts and settings in your browser (IndexedDB) after you accept the cookie banner.
With an optional account the same data is synced to a database hosted in the EU (Ireland). You can delete your account and all its data at any time.</p>`,
};

export function staticBody(route) {
  const body = content[route.path] ?? `<p>${route.description}</p>`;
  return `<div class="seo-static" style="max-width:900px;margin:0 auto;padding:16px">
<h1>${route.h1}</h1>${body}${nav}${footer}</div>`;
}
