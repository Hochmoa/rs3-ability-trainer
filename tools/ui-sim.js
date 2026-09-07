// In-app fast playthrough of the boss presets (used for docs/research/guide-playthrough.md).
//
// Paste into the dev app's console (ng serve, so `ng.getComponent` exists), then:
//   window.__sim.run({ recharge: true, clear: true })            // every preset
//   window.__sim.run({ filter: p => p.boss === 'Vorkath' })       // some presets
// Results: window.__sim.results (also localStorage 'sim-results'); progress: window.__sim.progress.
//
// What it does: clears storage, sets the training settings (full adrenaline, no ping, no auto-attacks, hits always
// land), adds each preset through PresetsService, opens every rotation on the Train page, starts the session like
// the Start button, freezes the page's frame loop and drives the engine with synthetic ticks, pressing the current
// step like a perfect player. A preset's pre-build rotation is played first; its end state (conjures, buffs, prayers,
// stacks, adrenaline) becomes the pre-build of the fight rotations. A rotation ends as finished, stuck (the engine's
// stuck marker fired), timeout (1200 ticks without finishing), cannot-start or notes-only.
// Keep the tab in front while it runs – background tabs are throttled.
(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TICK = 600;
  const SPEC_KEY = 'ability:weapon-special-attack', EOF_KEY = 'ability:essence-of-finality';
  const PREBUILD_RE = /pre-?build|pre-?fight|war'?s? retreat|^wars?$|^prep|prephase|pre-?kill|fort forinthry/i;
  const text = () => document.body.innerText;
  async function waitFor(fn, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(100); } return null; }
  const names = (e, k) => (e.catalog.get(k) || {}).name || k;

  function snapshot(e) {
    const tick = e.lastTick;
    const remaining = {};
    const spirits = [];
    for (const s of e.spirits.values()) { spirits.push(s.spirit); remaining['spirit:' + s.spirit] = Math.max(1, s.endTick - tick); }
    const abilities = []; const stacks = {};
    for (const b of e.buffs) {
      if (b.endTick !== null && b.endTick <= tick) continue;
      if (b.stacks > 0) stacks[b.id] = b.stacks;
      if (b.on === 'self' && e.catalog.get('ability:' + b.id) && !abilities.includes(b.id)) { abilities.push(b.id); if (b.endTick !== null) remaining['ability:' + b.id] = Math.max(1, b.endTick - tick); }
    }
    return { adrenaline: Math.round(e.adrenaline), stacks, spirits, abilities, prayers: [...e.activePrayers], remaining };
  }
  const stateOf = e => ({ tick: e.lastTick, adrenaline: Math.round(e.adrenaline), spirits: [...e.spirits.values()].map(s => s.spirit + ':' + (s.endTick - e.lastTick)), stacks: Object.fromEntries(e.buffs.filter(b => b.stacks > 0 && (b.endTick === null || b.endTick > e.lastTick)).map(b => [b.id, b.stacks])), buffs: e.buffs.filter(b => b.endTick === null || b.endTick > e.lastTick).map(b => b.id).slice(0, 12) });

  function drive(tc, opts) {
    const e = tc.engine;
    const t0 = e.t0;
    let tick = 0, lastIdx = -1, lastPressTick = -99, presses = 0;
    const pressed = [];
    while (e.state === 'running' && tick < opts.maxTicks) {
      const now = t0 + tick * TICK + 5;
      e.update(now);
      if (e.state !== 'running') break;
      const step = e.steps[e.index];
      const chanRuns = e.channel && !e.channel.cancelled && tick < e.channel.endTick;
      if (step && !step.isNote && !e.pending && !chanRuns && (lastIdx !== e.index || tick - lastPressTick >= 5)) {
        let key = step.key;
        if (step.kind === 'spec' || key.startsWith('spec:')) key = (e.loadout.weaponSpec && e.loadout.weaponSpec.id === step.id) ? SPEC_KEY : EOF_KEY;
        e.press(key, now);
        presses++; lastIdx = e.index; lastPressTick = tick;
        if (pressed.length < 80) pressed.push(tick + ':' + (step.name || key).slice(0, 18));
      }
      tick++;
    }
    const kinds = ['requirement', 'on-cooldown', 'no-adrenaline', 'wrong-weapon', 'wrong-book', 'wrong-fired', 'stuck', 'channel-cancelled', 'missed'];
    const issues = [];
    for (const ev of e.events) {
      if (!kinds.includes(ev.kind)) continue;
      let s;
      if (ev.kind === 'on-cooldown') { if (ev.readyInTicks < 4) continue; s = 'on-cooldown ' + names(e, ev.key) + ' ' + ev.readyInTicks + 't'; }
      else if (ev.kind === 'requirement') s = 'requirement ' + names(e, ev.key) + ': ' + ev.text;
      else if (ev.kind === 'no-adrenaline') s = 'no-adrenaline ' + names(e, ev.key) + ' need ' + ev.need + ' have ' + ev.have;
      else if (ev.kind === 'wrong-weapon') s = 'wrong-weapon ' + names(e, ev.key) + ': ' + (ev.reason || '');
      else if (ev.kind === 'wrong-fired') s = 'wrong-fired ' + names(e, ev.key) + ' expected ' + names(e, ev.expected);
      else if (ev.kind === 'missed') s = 'missed ' + (ev.keys || []).map(k => names(e, k)).join(',');
      else if (ev.kind === 'stuck') s = 'STUCK step ' + (ev.step + 1) + ' ' + names(e, ev.key) + ' (' + ev.reason + '): ' + ev.text;
      else if (ev.kind === 'channel-cancelled') s = 'channel-cancelled ' + names(e, ev.key) + ' lost ' + ev.hitsLost;
      else s = ev.kind + ' ' + names(e, ev.key || '');
      if (!issues.includes(s)) issues.push(s);
    }
    const res = e.results || [];
    const count = o => res.filter(r => r.outcome === o).length;
    const late = res.filter(r => r.outcome === 'late');
    const out = {
      outcome: e.stuck ? 'stuck' : e.state === 'finished' ? 'finished' : 'timeout',
      ticks: tick, presses, done: res.length, perfect: count('perfect'), late: late.length, worstLate: late.reduce((m, r) => Math.max(m, r.lateTicks || 0), 0), missed: count('missed'),
      damage: Math.round(e.damageDealt), hits: e.events.filter(x => x.kind === 'hit' && !x.miss).length,
      stuck: e.stuck ? { step: e.stuck.step + 1, name: names(e, e.stuck.key), reason: e.stuck.reason, text: e.stuck.text } : null,
      issues: issues.slice(0, 12), pressed: pressed.slice(0, 40),
    };
    if (out.outcome !== 'finished') { out.state = stateOf(e); out.nextStep = e.steps[e.index] ? (e.steps[e.index].name || e.steps[e.index].key) : null; }
    return out;
  }

  async function run(o) {
    const opts = { maxTicks: 1200, presetIds: null, filter: null, rotationFilter: null, recharge: true, clear: false, ...o };
    const root = ng.getComponent(document.querySelector('app-root'));
    const router = root.router;
    const results = (window.__sim.results ||= []);
    const trainComp = async () => { const el = await waitFor(() => document.querySelector('app-train')); return el ? ng.getComponent(el) : null; };
    if (!document.querySelector('app-train')) await router.navigateByUrl('/');
    let tc = await trainComp();
    const st = root.storage;
    if (opts.clear) { await st.clearAll(); await sleep(300); try { await st.acceptConsentOnSave(); } catch {} await sleep(200); }
    const s = st.settings();
    await st.saveSettings({ ...s, fullAdrenaline: true, rechargeAdrenaline: !!opts.recharge, pingMs: 0, jitterMs: 0, autoAttacks: false, hitChance: 'off', uiMode: 'advanced', abilityQueueing: true });
    await sleep(200);
    tc = await trainComp();
    const ps = tc.presets;
    const all = await ps.list();
    const chosen = all.filter(p => (opts.presetIds ? opts.presetIds.includes(p.id) : true) && (opts.filter ? opts.filter(p) : true));
    window.__sim.progress = { total: chosen.length, done: 0, current: null, mode: opts.recharge ? 'recharge' : 'no-recharge' };
    for (const p of chosen) {
      window.__sim.progress.current = p.id;
      let added;
      try { added = await ps.add(p); } catch (err) { results.push({ mode: window.__sim.progress.mode, preset: p.id, boss: p.boss, style: p.style, outcome: 'add-failed', error: String(err) }); window.__sim.progress.done++; continue; }
      let prebuild = null, prebuildFrom = null;
      for (const r of added.rotations) {
        if (opts.rotationFilter && !opts.rotationFilter(r)) continue;
        const playable = r.steps.filter(x => x.kind !== 'note').length;
        const short = r.name.replace(p.boss + ' – ', '');
        const rec = { mode: window.__sim.progress.mode, preset: p.id, boss: p.boss, style: p.style, variant: p.variant || p.title, rotation: short, steps: r.steps.length, playable, left: added.left };
        if (playable === 0) { rec.outcome = 'notes-only'; results.push(rec); continue; }
        const isPrebuild = PREBUILD_RE.test(short);
        try {
          if (!isPrebuild && prebuild) {
            // like PresetsService: a necromancy fight rotation assumes the stacks are built, and starts without spirits when it conjures itself
            const pb = JSON.parse(JSON.stringify(prebuild));
            if (p.style === 'Necromancy') {
              pb.stacks.necrosis = Math.max(12, pb.stacks.necrosis || 0);
              pb.stacks['residual-souls'] = Math.max(5, pb.stacks['residual-souls'] || 0);
              const acts = r.steps.filter(x => x.kind !== 'note');
              const conjure = acts.findIndex(x => x.kind === 'ability' && x.id.startsWith('conjure-'));
              const command = acts.findIndex(x => x.kind === 'ability' && x.id.startsWith('command-'));
              if (conjure >= 0 && (command < 0 || conjure < command)) pb.spirits = [];
              else if (conjure >= 0) for (const sp of pb.spirits) pb.remaining['spirit:' + sp] = Math.max(6, 3 * conjure - 2);
            }
            await st.savePrebuild(r.id, pb); rec.prebuild = prebuildFrom;
          }
          await router.navigateByUrl('/?rotation=' + r.id);
          await sleep(250);
          tc = await trainComp();
          await waitFor(() => tc.selectedId && tc.selectedId() === r.id, 5000);
          await sleep(150);
          const t = text();
          rec.warnings = [];
          const cp = t.indexOf('cannot perform'); if (cp >= 0) rec.warnings.push(t.slice(cp + 16, cp + 300).split('\n').filter(x => x && !/You can still train/.test(x)).slice(0, 6).join(' | '));
          const ap = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Auto-place')); if (ap) { ap.click(); await sleep(300); }
          if (!tc.canStart()) {
            rec.outcome = 'cannot-start';
            rec.unreachable = (tc.unreachable ? tc.unreachable() : []).map(x => x.name || x.key || String(x)).slice(0, 10);
            rec.unknownSteps = tc.unknownSteps ? tc.unknownSteps() : null;
            rec.reason = (text().match(/Can't start[^\n]*|[^\n]*not on a keybound[^\n]*|[^\n]*did not fit[^\n]*/) || [''])[0];
            results.push(rec); continue;
          }
          tc.start();
          await sleep(60);
          if (!tc.engine || tc.engine.state !== 'running') { rec.outcome = 'cannot-start'; rec.reason = 'start() did not create a running engine'; results.push(rec); continue; }
          tc.stopLoops();
          Object.assign(rec, drive(tc, opts));
          if (isPrebuild && rec.outcome === 'finished') { prebuild = snapshot(tc.engine); prebuildFrom = short; rec.snapshot = { spirits: prebuild.spirits, abilities: prebuild.abilities, prayers: prebuild.prayers, adrenaline: prebuild.adrenaline, stacks: prebuild.stacks, remaining: prebuild.remaining }; }
          try { tc.stop(); } catch (err) { rec.stopError = String(err); }
        } catch (err) { rec.outcome = 'harness-error'; rec.error = String(err && err.stack || err).slice(0, 300); }
        results.push(rec);
        try { localStorage.setItem('sim-results', JSON.stringify(results)); } catch {}
        await sleep(50);
      }
      window.__sim.progress.done++;
    }
    window.__sim.progress.current = null;
    return results.length;
  }
  window.__sim = { run, results: (window.__sim && window.__sim.results) || [], progress: null };
  return 'sim harness ready';
})();
