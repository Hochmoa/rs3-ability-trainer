// Builds the guide-account seed (tools/guide-seed.json) from the loadouts and rotations the boss presets left in this
// browser's storage: one account per boss, deterministic ids (SHA-1 of preset id + rotation index, so a re-dump updates
// the same rows), rotation styles from the steps' abilities.
//
// Use: run tools/ui-sim.js first (it adds every preset), or add the presets by hand on the Boss setups page; then paste
// this into the dev app's console on the Train page. The seed lands in window.__guideSeed and localStorage 'guide-seed';
// save it as tools/guide-seed.json and run `python tools/guide-seed-to-sql.py --number <n>` for the migration.
(async () => {
  const root = ng.getComponent(document.querySelector('app-root'));
  const st = root.storage;
  const tc = ng.getComponent(document.querySelector('app-train'));
  const data = tc.data;
  const presets = await tc.presets.list();
  const byPreset = new Map(presets.map(p => [p.id, p]));
  // account names: the boss without its subtitle, at most 20 characters (profiles.display_name)
  const OVERRIDES = { 'ED1 – Temple of Aminishi': 'ED1 Aminishi', 'ED2 – Dragonkin Laboratory': 'ED2 Dragonkin Lab', 'ED3 – The Shadow Reef': 'ED3 Shadow Reef', 'Angel of Death (7-man)': 'Angel of Death', 'Angel of Death (small teams)': 'Angel of Death', 'Vorago (HM)': 'Vorago', 'Giant Mole (HM)': 'Giant Mole', 'Flesh-hatcher Mhekarnahz': 'Flesh-hatcher' };
  const accountName = boss => {
    if (OVERRIDES[boss]) return OVERRIDES[boss];
    let n = boss.split(/,|\(|–/)[0].trim();
    n = n.replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim();
    if (n.length > 20) n = n.slice(0, 20).trim();
    if (n.length < 3) n = (n + '   ').slice(0, 3);
    return n;
  };
  async function uuidOf(text) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode('rs3trainer-guide:' + text));
    const h = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-5' + h.slice(13, 16) + '-a' + h.slice(17, 20) + '-' + h.slice(20, 32);
  }
  const STYLES = ['Melee', 'Ranged', 'Magic', 'Necromancy'];
  const stylesOf = steps => {
    const out = new Set();
    for (const s of steps) {
      let style = null;
      if (s.kind === 'ability') style = data.get('ability:' + s.id)?.style || data.get('ability:' + s.id)?.ability?.style;
      else if (s.kind === 'spec') style = data.get('spec:' + s.id)?.spec?.style || data.get('spec:' + s.id)?.style;
      else if (s.kind === 'weapon') style = data.get('weapon:' + s.id)?.weapon?.style || data.get('weapon:' + s.id)?.style;
      if (style && STYLES.includes(style)) out.add(style);
    }
    return [...out];
  };
  const accounts = new Map();
  const loadouts = st.loadouts().filter(l => l.presetId && byPreset.has(l.presetId));
  const rotations = st.rotations().filter(r => r.presetId && byPreset.has(r.presetId));
  const seenLoadout = new Set(), seenRot = new Set();
  for (const l of loadouts) {
    const p = byPreset.get(l.presetId);
    if (seenLoadout.has(p.id)) continue; seenLoadout.add(p.id);
    const name = accountName(p.boss);
    const acc = accounts.get(name) || { name, loadouts: [], rotations: [] };
    accounts.set(name, acc);
    const copy = JSON.parse(JSON.stringify(l));
    copy.id = await uuidOf('loadout:' + p.id);
    copy.name = (p.title || p.boss + ' – ' + p.style).slice(0, 40);
    acc.loadouts.push(copy);
  }
  for (const r of rotations) {
    const p = byPreset.get(r.presetId);
    const key = p.id + '#' + r.presetIndex;
    if (seenRot.has(key)) continue; seenRot.add(key);
    const name = accountName(p.boss);
    const acc = accounts.get(name) || { name, loadouts: [], rotations: [] };
    accounts.set(name, acc);
    const variant = p.variant ? ' (' + p.variant + ')' : '';
    let rname = r.name.replace(p.boss + ' – ', '') + ' – ' + p.style + variant;
    if (rname.length > 60) rname = rname.slice(0, 57).trimEnd() + '…';
    acc.rotations.push({ id: await uuidOf('rotation:' + key), name: rname, steps: r.steps, styles: stylesOf(r.steps), updatedAt: Date.now() });
  }
  const out = [...accounts.values()].sort((a, b) => a.name.localeCompare(b.name));
  window.__guideSeed = out;
  const json = JSON.stringify(out);
  localStorage.setItem('guide-seed', json);
  return { accounts: out.length, loadouts: out.reduce((n, a) => n + a.loadouts.length, 0), rotations: out.reduce((n, a) => n + a.rotations.length, 0), bytes: json.length, names: out.map(a => a.name + ':' + a.loadouts.length + '/' + a.rotations.length) };
})();
