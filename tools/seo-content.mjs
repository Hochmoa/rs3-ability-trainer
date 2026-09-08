/**
 * Crawlable static content per route, injected into <app-root> by postbuild.mjs. Angular replaces
 * it as soon as it bootstraps, and a browser with JavaScript hides it right away (the `js` class in
 * src/index.html) in favour of the loading indicator, so it is only ever read by crawlers without
 * JavaScript and by link previews. Keep it truthful to what the page really offers.
 */

/** what a visitor sees until Angular boots, the same markup src/index.html carries */
const boot = `
<div class="boot" role="status"><div class="boot-sweep" aria-hidden="true"></div><p id="boot-msg">Loading RS3 Ability Trainer…</p></div>`;
const nav = `
<nav aria-label="Pages">
  <a href="/">Train</a> · <a href="/rotations">Rotations</a> · <a href="/bars">Action bars</a> · <a href="/keybinds">Keybinds</a> ·
  <a href="/loadout">Loadout</a> · <a href="/setups">Setups</a> · <a href="/settings">Settings</a> · <a href="/privacy">Privacy</a>
</nav>`;

const footer = `
<p><small>Not affiliated with Jagex. Ability, prayer and item icons and names are © Jagex Ltd, taken from the
<a href="https://runescape.wiki" rel="noopener">RuneScape Wiki</a> (CC BY-NC-SA 3.0). Non-commercial fan tool ·
<a href="https://github.com/Hochmoa/rs3-ability-trainer" rel="noopener">source on GitHub</a> · <a href="https://hochware.com" rel="noopener">hochware.com</a></small></p>
<noscript><p><strong>This trainer needs JavaScript.</strong> It runs a live combat clock in your browser.</p></noscript>`;

export const content = {
  '': `
<p>RS3 Ability Trainer is a free browser tool for practising <strong>RuneScape 3 ability rotations</strong> outside the game.
It runs on the game clock: 0.6 second ticks, a 1.8 second global cooldown, plus adrenaline, cooldowns, buffs, the in-game
“Allow ability queueing” option and your ping. So it can tell you whether your timing was right, not only your ability order.</p>
<h2>What you can practise</h2>
<ul>
  <li>Rotations built from RuneScape Wiki data: abilities, prayers and curses, weapon switches, special attacks, adrenaline potions.</li>
  <li>Rotations written in <strong>PvME notation</strong> (→, +, tc, spec). Paste one and it becomes a trainable queue.</li>
  <li>Your own action bars and keybinds, Ctrl, Shift and Alt combinations included, laid out like your in-game interface.</li>
  <li>Gear with weapons, armour, perks, relics and prayer book, whose effects change cooldowns and adrenaline.</li>
  <li>A session summary that marks every input perfect, early or late, and by how many ticks.</li>
  <li>Setups other players share, ready to copy and train.</li>
</ul>
<h2>How it works</h2>
<ol>
  <li>Build a rotation in the editor or import it from PvME notation.</li>
  <li>Put the abilities on your action bars and bind your keys.</li>
  <li>Press Start and follow the queue on the game clock.</li>
  <li>Read the summary, change your ping or the queueing option, go again.</li>
</ol>
<p>Everything stays in your browser. A free account is optional: it syncs your setups, bars and keys between devices and lets
you share a setup, gear and rotations together, with other players.</p>`,

  rotations: `
<p>Build a RuneScape 3 rotation step by step from abilities, prayers and curses, weapon switches, special attacks and adrenaline
potions. Cooldown, adrenaline cost, damage and effects come from the RuneScape Wiki (state after the Combat Style Modernisation,
March 2026).</p>
<p>Or paste a rotation in <strong>PvME notation</strong>: arrows for the next global cooldown, <code>+</code> for the same tick,
<code>(tc)</code> for target cycle, <code>spec</code> for the special attack of the wielded weapon. It becomes a trainable queue.
Every rotation belongs to a setup, meaning the boss and the gear it is played with, and is shared together with it.</p>`,

  setups: `
<p>A setup is a RuneScape 3 boss, the gear for it and the rotations played with it. The Setups page lists every public one.
That includes the <strong>PvME</strong> guides for more than 40 bosses, among them Rasial, Zamorak, Nakatra, Kerapac, Nex, Telos,
Vorkath and Angel of Death, in every style and variant (solo, duo, hard mode, enrage brackets), with the worn gear, the backpack
and the guide's rotations in PvME notation. Next to them stand the setups other players share. Search by boss, setup or player,
filter by combat style, and copy any setup into your own list with one click. Your action bars and keys are never part of it.</p>` + nav + footer,

  bars: `
<p>Rebuild your RuneScape 3 action bars here: fill the 18 presets with abilities, prayers and items, choose which bar sits where
and bind a preset to a combat style. What you see in the trainer is then what you see in the game.</p>`,

  keybinds: `
<p>A key belongs to a bar position and slot, the way the game does it: whatever preset is shown there fires on that key.
Bind single keys or combinations with Ctrl, Shift and Alt, plus keys for weapon switches and client actions such as target cycle.</p>`,

  loadout: `
<p>Set up your gear: main hand, off hand and two-handed weapons, the switches you carry, armour, perks, relics and prayer book.
The trainer applies what they do, ability cooldowns and adrenaline included, so the rotation behaves the way it does in game.</p>`,

  settings: `
<p>Set how closely the trainer follows your game: ping and jitter, the in-game “Allow ability queueing” option
(off: only a press in the last tick of the global cooldown queues; on: any press during the cooldown queues), looping and how the
enemy attacks.</p>`,

  privacy: `
<p>The trainer keeps your setups, rotations, action bars, keys and settings in your browser (IndexedDB) once you accept the cookie
banner. With an account the same data is synced to a database in the EU (Ireland). You can delete the account and everything in it
at any time.</p>`,
};

export function staticBody(route) {
  const body = content[route.path] ?? `<p>${route.description}</p>`;
  return `${boot}<div class="seo-static" style="max-width:900px;margin:0 auto;padding:16px">
<h1>${route.h1}</h1>${body}${nav}${footer}</div>`;
}
