// Auto-player for the Train page – paste into the browser console (or run through a browser automation tool) with a
// rotation selected and the bars placed. It presses the key of the current step as soon as the step is shown (ability
// queueing on => the cast fires at the GCD end), waits inside long channels so the next press lands exactly at the
// channel end, records every hitsplat and reads the page's own counters. Used for docs/research/dpm-comparison.md.
//   window.__drv.summary()  -> { pageStats, finished, total, hits, presses, byName: { name: [hits, total, crits, min, max] } }
//   window.__drv.stop()
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (window.__drv) { try { window.__drv.stop(); } catch {} }
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
  await sleep(600);
  const LABELS = { 'Space':'Space','Enter':'Enter','Tab':'Tab','Esc':'Escape','Backspace':'Backspace','Del':'Delete','Ins':'Insert','Home':'Home','End':'End','PgUp':'PageUp','PgDn':'PageDown','↑':'ArrowUp','↓':'ArrowDown','←':'ArrowLeft','→':'ArrowRight','-':'Minus','=':'Equal','[':'BracketLeft',']':'BracketRight','\':'Backslash',';':'Semicolon',"'":'Quote','`':'Backquote',',':'Comma','.':'Period','/':'Slash','Caps':'CapsLock' };
  const CHAN = { 'Asphyxiate': 7, 'Rapid Fire': 8, 'Greater Flurry': 8, 'Flurry': 8, 'Assault': 7, 'Smoke Tendrils': 7, 'Blood Siphon': 9, 'Onslaught': 51 };
  function codeOf(label) {
    const parts = label.split('+'); const key = parts.pop();
    const mods = { ctrlKey: parts.includes('c'), shiftKey: parts.includes('s'), altKey: parts.includes('a') };
    let code;
    if (LABELS[key]) code = LABELS[key];
    else if (/^[A-Z]$/.test(key)) code = 'Key' + key;
    else if (/^[0-9]$/.test(key)) code = 'Digit' + key;
    else if (/^Num (.+)$/.test(key)) { const r = key.slice(4); code = { '+':'NumpadAdd','-':'NumpadSubtract','*':'NumpadMultiply','/':'NumpadDivide','.':'NumpadDecimal','Enter':'NumpadEnter' }[r] || 'Numpad' + r; }
    else code = key;
    return { code, ...mods };
  }
  const state = { hits: [], presses: [], pressed: new WeakSet(), chans: new WeakSet(), seen: new WeakSet(), holdUntil: 0, start: performance.now(), done: false, log: [] };
  const hs = document.querySelector('.hitsplats');
  if (!hs) return 'no .hitsplats on this page';
  const obs = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType !== 1 || !n.classList.contains('hitsplat') || state.seen.has(n)) continue;
      state.seen.add(n);
      const h = { t: Math.round(performance.now() - state.start), name: (n.title || '').replace(/ – missed$/, ''), amount: n.classList.contains('miss') ? 0 : Number(n.textContent.replace(/[^0-9.]/g, '')), crit: n.classList.contains('crit'), dot: n.classList.contains('dot'), miss: n.classList.contains('miss') };
      if (state.hits.slice(-12).some((p) => p.name === h.name && p.amount === h.amount && h.t - p.t < 700)) { state.log.push('dup? ' + h.name + ' ' + h.amount); continue; }
      state.hits.push(h);
    }
  });
  obs.observe(hs, { childList: true });
  const adren = () => (document.body.innerText.match(/Adrenaline\n(\d+)%/) || [])[1];
  const nameOf = el => ((el.querySelector('.name') || {}).textContent || el.title || '').trim();
  function press(label, name) {
    const k = codeOf(label);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: k.code, key: k.code, ctrlKey: k.ctrlKey, shiftKey: k.shiftKey, altKey: k.altKey, bubbles: true, cancelable: true }));
    state.presses.push({ t: Math.round(performance.now() - state.start), label, name, adren: adren() });
  }
  function handle(el) {
    if (!el || state.pressed.has(el)) return;
    const key = el.querySelector('.key');
    const name = nameOf(el);
    if (el.classList.contains('note')) { state.pressed.add(el); state.log.push('note skipped: ' + name); return; }
    if (!key || !key.textContent.trim()) { state.log.push('no key for ' + name); state.pressed.add(el); return; }
    state.pressed.add(el);
    press(key.textContent.trim(), name);
  }
  const timer = setInterval(() => {
    const now = performance.now();
    // a long channel that just fired: hold the next press until its last tick
    const tagged = [...document.querySelectorAll('.queue-strip .slot, .focus-strip .fslot')].find(s => /channelling/i.test(s.textContent));
    if (tagged && !state.chans.has(tagged)) {
      state.chans.add(tagged);
      const ticks = CHAN[nameOf(tagged)] || 3;
      if (ticks > 3) { state.holdUntil = now + (ticks - 1) * 600 + 150; state.log.push('hold for ' + nameOf(tagged) + ' ' + ticks + 't'); }
    }
    if (now < state.holdUntil) return;
    const cur = document.querySelector('.queue-strip .slot.current, .focus-strip .fslot.current');
    if (cur) handle(cur);
  }, 40);
  window.__drv = {
    state,
    stop() { clearInterval(timer); obs.disconnect(); state.done = true; },
    summary() {
      const byName = {};
      for (const h of state.hits) { const b = byName[h.name] ||= { n: 0, total: 0, crits: 0, min: Infinity, max: 0 }; b.n++; b.total += h.amount; if (h.crit) b.crits++; b.min = Math.min(b.min, h.amount); b.max = Math.max(b.max, h.amount); }
      const total = state.hits.reduce((s, h) => s + h.amount, 0);
      const t = document.body.innerText; const i = t.indexOf('Perfect');
      return { pageStats: t.slice(i, i + 90).replace(/\n/g, ' '), finished: /Try again/.test(t), total, hits: state.hits.length, presses: state.presses.map(p => p.name.slice(0, 10) + '@' + p.adren).join(','), byName: Object.fromEntries(Object.entries(byName).map(([k, v]) => [k, [v.n, Math.round(v.total), v.crits, Math.round(v.min), Math.round(v.max)]])), log: state.log.slice(0, 14), lastT: state.hits.at(-1)?.t };
    },
  };
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Start') || [...document.querySelectorAll('button')].find(b => /Restart/.test(b.textContent));
  if (!btn || btn.disabled) return 'start unavailable';
  btn.click();
  return 'started via ' + btn.textContent.trim();
})()
