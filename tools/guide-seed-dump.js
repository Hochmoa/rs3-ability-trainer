// Builds the PVME guide-account seed (tools/guide-seed.json) from the setups the boss presets left in this browser's
// storage: one setup per PvME preset with its loadout and rotations, deterministic ids (SHA-1 of the preset id, and
// of preset id + rotation index, so a re-dump updates the same rows).
//
// Use: on a dev server with an EMPTY storage (Settings → "Delete all stored data"), add every preset from the console
// on the Train page:
//   const tc = ng.getComponent(document.querySelector('app-train')); for (const p of await tc.presets.list()) await tc.presets.add(p);
// then paste this file. The seed lands in window.__guideSeed and localStorage 'guide-seed'; save it as
// tools/guide-seed.json and run `python tools/guide-seed-to-sql.py --number <n>` for the migration.
(async () => {
  const root = ng.getComponent(document.querySelector('app-root'));
  const st = root.storage;
  const tc = ng.getComponent(document.querySelector('app-train'));
  const presets = await tc.presets.list();
  const byPreset = new Map(presets.map(p => [p.id, p]));
  async function uuidOf(text) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode('rs3trainer-guide:' + text));
    const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-5' + h.slice(13, 16) + '-a' + h.slice(17, 20) + '-' + h.slice(20, 32);
  }
  const out = [];
  const seen = new Set();
  for (const s of st.setups()) {
    const p = s.presetId && byPreset.get(s.presetId);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    const loadout = JSON.parse(JSON.stringify(st.loadoutOf(s)));
    loadout.id = await uuidOf('loadout:' + p.id);
    loadout.name = (p.title || p.boss + ' – ' + p.style).slice(0, 40);
    const rotations = [];
    for (const r of st.rotations().filter(r => r.setupId === s.id).sort((a, b) => (a.presetIndex ?? 0) - (b.presetIndex ?? 0))) {
      let name = r.name;
      if (name.length > 60) name = name.slice(0, 57).trimEnd() + '…';
      rotations.push({ id: await uuidOf('rotation:' + p.id + '#' + r.presetIndex), name, steps: r.steps, position: r.presetIndex ?? rotations.length });
    }
    out.push({ id: await uuidOf('setup:' + p.id), boss: s.boss, name: s.name, style: s.style, presetId: p.id, loadout, rotations });
  }
  out.sort((a, b) => a.boss.localeCompare(b.boss) || a.name.localeCompare(b.name));
  window.__guideSeed = out;
  const json = JSON.stringify(out);
  localStorage.setItem('guide-seed', json);
  return { setups: out.length, rotations: out.reduce((n, s) => n + s.rotations.length, 0), bytes: json.length };
})();
