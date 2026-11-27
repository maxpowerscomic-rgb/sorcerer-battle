/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.25
   Draft guard. Loaded last, so every offer passes through it whatever made it:
   - exactly three cards, never fewer;
   - no card twice, and never two cards that add the same ability (new / replace of the same one).
   Cause of the old duplicates: the Zodiac "+2 animal" limiter could swap two animal cards for the same replacement,
   and the counter-card layer could insert a card the offer already had.
   ===================================================================== */
(function () {
  'use strict';
  if (typeof genOffer !== 'function') return;
  const same = (a, b) => a.type === b.type && a.k === b.k && (a.type !== 'up' || (a.u && b.u && a.u.id === b.u.id));
  const sameAbility = (a, b) => a.type !== 'up' && b.type !== 'up' && a.k === b.k;
  const clash = (list, c) => list.some(q => same(q, c) || sameAbility(q, c));
  const valid = c => c && c.k && SP[c.k] && (c.type !== 'up' || (c.u && c.u.id));
  const _go = genOffer;
  function guarded(p, round) {
    const out = [], add = c => { if (out.length < 3 && valid(c) && !clash(out, c)) out.push(c); };
    let first = []; try { first = _go.apply(this, arguments) || []; } catch (e) {}
    first.forEach(add);
    for (let i = 0; i < 6 && out.length < 3; i++) { let again = []; try { again = _go.apply(this, arguments) || []; } catch (e) {} again.forEach(add); }
    if (out.length < 3) {   // last resort, in order: upgrades for owned abilities, the hand, anything unlocked
      const full = p.book.length >= capOf() && round > 1, owned = [...new Set(p.book)].sort(() => Math.random() - .5);
      for (const k of owned) for (const u of UPG[k] || []) if (!p.up.has(k + '.' + u.id) && (!u.req || p.up.has(k + '.' + u.req)) && k !== 'chosen') add({ type: 'up', k, u });
      const kind = full ? 'replace' : 'new', ok = k => !(ONE_COPY.has(k) && p.book.includes(k));
      for (const k of (p.pool || M.unlocked || []).slice().sort(() => Math.random() - .5)) if (ok(k)) add({ type: kind, k });
      const any = (typeof unlockedSpells === 'function' ? unlockedSpells() : Object.keys(SP)).filter(k => !(window.VARIANTS && VARIANTS[k]));
      for (const k of any.sort(() => Math.random() - .5)) if (ok(k)) add({ type: kind, k });
    }
    if (out.length < 3) try { console.error('[draft] offer short', out.length); if (typeof logCrash === 'function') logCrash('draft-short', 'offer had ' + out.length, ''); } catch (e) {}
    return out;
  }
  window.genOffer = genOffer = guarded;
  try { (0, eval)('genOffer = window.genOffer'); } catch (e) {}
  window.DRAFT_GUARD = { same, sameAbility, clash };
})();

/* ---------------- (1.0.33.25) a screen's lesson plays the first time you open it ----------------
   Hoot used to only offer lessons (1.0.33.13), so a new screen like Survival could open with no tutorial at all.
   Now the first visit to any screen with a lesson starts it, however you got there; the Club picks Survival or the
   Fight Club by its tab. Every step keeps Skip and "No more tips", and Hoot can replay any lesson later. */
(function () {
  'use strict';
  const tipOpen = () => { const t = document.getElementById('tipT'); return !!(t && t.style.display === 'block' && !t.classList.contains('hide')); };
  function tick() {
    try { if (!window.V133 || !window.TIP_TOURS || !V133.lessonHere) return; if (tipOpen() || window.ONB_ACTIVE || !(PR.onb && PR.onb.done)) return;
      if (document.querySelector('#sheet.on, #upm.on, #lvup.on, #chestOv.on, #rep.on') || document.querySelector('.screen.on#battle')) return;   /* (1.0.33.33) not over a reward or token pop-up either */
      const L = V133.lessonHere(); if (!L) return; const tr = PR.tours || {}; if (tr[L[0]] || tr.__off) return;
      if (window.LANDED && !window.LANDED()) return;
      TIP_TOURS.start(L[0]); try { V133.paintDot(); } catch (e) {} } catch (e) {} }
  setInterval(tick, 900);
})();

/* ---------------- (1.0.33.25) AI casters fight back against summons swarming them ----------------
   Swarmed: an enemy summon within 75 px, or two within 140 px. While swarmed the
   AI's aimed casts and homing shots go for the nearest summon (wizard-rules.js, wizard-techniques.js prefMob); it
   stays swarmed 1.2 s after the last of that, so it doesn't flicker between targets. */
(function () {
  'use strict';
  const SUM = new Set(['z', 'g', 'a']);
  function swarmTick() { if (typeof ents === 'undefined' || !ents || typeof enemyCreatures !== 'function') return; const now = typeof T === 'number' ? T : 0;
    for (const w of ents) { if (!w || w.me || w.dead) { if (w) w.swarmed = 0; continue; } let n75 = 0, n140 = 0;
      for (const c of enemyCreatures(w)) { if (!SUM.has(c.k) || !c.e || c.e.x === undefined) continue; const d = Math.hypot(c.e.x - w.x, c.e.y - w.y); if (d < 75) n75++; if (d < 140) n140++; }
      const on = n75 >= 1 || n140 >= 2;
      if (on) w.swarmUntil = now + 1.2; w.swarmed = (w.swarmUntil || 0) > now ? 1 : 0; } }
  if (typeof update === 'function') { const _u = update; window.update = update = function () { try { if (!ended) swarmTick(); } catch (e) {} return _u.apply(this, arguments); }; try { (0, eval)('update = window.update'); } catch (e) {} }
})();

/* ---------------- (1.0.33.25) the Dragon: hunts summons, sweeping out in a spiral ----------------
   While the enemy has summons on the field and none is within reach, the Dragon flies an outward spiral from its
   caster (an Uzumaki swirl), fast, breathing embers; it resets to a tight swirl when it reaches the arena's edge.
   A summon within 55 px: the normal summon code dives on it and attacks. No enemy summons: it goes for the caster. */
(function () {
  'use strict';
  const isDragon = z => z && z.beast && z.beast.id === 'dragon' && !z.beast.crim && z.hp > 0 && z.rise >= 1;
  const mobsOf = w => { try { return enemyCreatures(w).filter(c => c.e && c.e.x !== undefined && c.k !== 'tm'); } catch (e) { return []; } };
  let prev = new Map();
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) {
      try { prev = new Map(); if (typeof zombies !== 'undefined') for (const z of zombies) if (isDragon(z)) prev.set(z, { x: z.x, y: z.y }); } catch (e) {}
      const r = _u.apply(this, arguments);
      try { if (!ended && dt > 0) for (const [z, p] of prev) { if (!isDragon(z) || z.frozen > 0 || z.stun > 0) continue; const w = z.o, mobs = mobsOf(w); if (!mobs.length) { z.spR = 0; continue; }
          let near = 1e9; for (const c of mobs) near = Math.min(near, Math.hypot(c.e.x - z.x, c.e.y - z.y)); if (near < 55) continue;
          z.spA = (z.spA === undefined ? Math.atan2(z.y - w.y, z.x - w.x) : z.spA) + 2.4 * dt; z.spR = Math.min(260, (z.spR || 24) + 46 * dt); if (z.spR >= 260) z.spR = 24;
          const tx = clamp(w.x + Math.cos(z.spA) * z.spR, F.x0 + 8, F.x1 - 8), ty = clamp(w.y + Math.sin(z.spA) * z.spR * .8, F.y0 + 8, F.y1 - 8), dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, step = Math.min(d, 130 * dt);
          z.x = p.x + dx / d * step; z.y = p.y + dy / d * step; z.face = dx < 0 ? -1 : 1;
          if (Math.random() < .5) P({ x: z.x + rnd(-8, 8), y: z.y - 30 * HS + rnd(-6, 6), vx: -dx / d * 40 + rnd(-15, 15), vy: -dy / d * 40 - 20, color: Math.random() < .5 ? '#ff8a3a' : '#ffd45e', size: rnd(2, 3.5), life: .35, glow: true }); } } catch (e) {}
      return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }
})();

/* ---------------- (1.0.33.25) the post-game XP ring updates live ----------------
   Upgrading an ability on the results screen gives player XP (10 per level since 1.0.33.27). The ring, level, XP text and the
   "+XP" total now update on the spot, and the level number ticks up if it levels you. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  function paint(gained) { const ring = $('rwRing'), need = xpNeed(PR.lvl); if (!ring) return;
    const lvEl = $('rwLvl'), was = +lvEl.textContent || PR.lvl; lvEl.textContent = PR.lvl; $('rwLvlT').textContent = 'Level ' + PR.lvl;
    const g = $('rwXpGain'), cur = parseInt((g.textContent || '').replace(/[^0-9]/g, ''), 10) || 0; g.textContent = '+' + (cur + gained) + ' XP';
    const from = was < PR.lvl ? 0 : parseFloat(getComputedStyle(ring).getPropertyValue('--p')) || 0, to = PR.xp / need, t0 = performance.now();
    const f = now => { const q = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - q, 2); ring.style.setProperty('--p', from + (to - from) * e); if (q < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
    $('rwXpTxt').textContent = PR.xp + ' / ' + need + ' XP';
    if (was < PR.lvl) { try { lvEl.parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 500 }); } catch (e) {} } }
  if (typeof gainXp === 'function') { const _g = gainXp; window.gainXp = gainXp = function (n) { const r = _g.apply(this, arguments);
      try { const rw = $('rewards'); if (rw && rw.classList.contains('on') && n > 0 && !window.__rwInitXp) setTimeout(() => { try { paint(n); } catch (e) {} }, 60); } catch (e) {} return r; };
    try { (0, eval)('gainXp = window.gainXp'); } catch (e) {} }
})();

/* ---------------- (1.0.33.25) hits on walls, ice and pillars: billowing smoke and shards ----------------
   Every time an ice wall, mud wall or stone pillar loses health, the crystal nearest whatever hit it throws out a
   cluster of soft, layered smoke puffs (pre-rendered billows: cold mist for ice, dust for mud and stone) that swell,
   drift and fade, plus small spinning shards in the material's colours that fly, fall, bounce once and fade.
   Scaled to the damage, at most one burst per wall every 0.12 s so damage over time doesn't flood the screen. */
(function () {
  'use strict';
  const MAT = { ice: { smoke: [222, 240, 255], shards: ['#e9fbff', '#9fdcff', '#5cc8ff'] }, mud: { smoke: [150, 118, 86], shards: ['#d8c09a', '#8a6a48', '#5a3d22'] }, stone: { smoke: [165, 158, 150], shards: ['#d9d2c8', '#9a9087', '#5e5650'] } };
  const matOf = wl => wl.mud === 'pillar' ? 'stone' : wl.mud ? 'mud' : 'ice';
  const SPR = {};
  function sprite(mat, v) { const key = mat + v; if (SPR[key]) return SPR[key]; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), [r, gg, b] = MAT[mat].smoke;
    let seed = 7 + v * 31; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14; i++) { const a = rand() * 6.283, d = rand() * 30, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * .8, rr = 22 + rand() * 26, sh = .72 + rand() * .35;
      const gr = g.createRadialGradient(x - rr * .25, y - rr * .3, rr * .1, x, y, rr); gr.addColorStop(0, `rgba(${Math.min(255, r * sh + 30) | 0},${Math.min(255, gg * sh + 30) | 0},${Math.min(255, b * sh + 30) | 0},.55)`); gr.addColorStop(.55, `rgba(${r * sh | 0},${gg * sh | 0},${b * sh | 0},.32)`); gr.addColorStop(1, `rgba(${r * sh | 0},${gg * sh | 0},${b * sh | 0},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
    return (SPR[key] = c); }
  let puffs = [], shards = [];
  const last = new WeakMap(), lastHp = new WeakMap();
  function burstAt(x, y, mat, amt) { const n = Math.max(3, Math.min(8, Math.round(2 + amt / 4))), m = Math.max(3, Math.min(9, Math.round(2 + amt / 3)));
    for (let i = 0; i < n && puffs.length < 90; i++) { const a = Math.random() * 6.283, sp = 12 + Math.random() * 38;
      puffs.push({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .6 - 14 - Math.random() * 16, r0: 7 + Math.random() * 6, r1: 20 + Math.random() * 20 + amt * .6, t: 0, life: .7 + Math.random() * .6, rot: Math.random() * 6.283, vr: (Math.random() - .5) * 1.6, spr: sprite(mat, i % 3), a: .75 + Math.random() * .25 }); }
    const cols = MAT[mat].shards;
    for (let i = 0; i < m && shards.length < 140; i++) { const a = Math.random() * 6.283, sp = 35 + Math.random() * 85;
      shards.push({ x, y, z: 6 + Math.random() * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .55, vz: 70 + Math.random() * 120, rot: Math.random() * 6.283, vr: (Math.random() - .5) * 22, s: 1.6 + Math.random() * 2.2, c: cols[Math.random() * cols.length | 0], t: 0, life: .9 + Math.random() * .5, b: 0 }); } }
  function hitPoint(wl) { const live = (wl.cr || []).filter(c => !c.gone); if (!live.length) return null; const src = [];
    try { for (const p of (typeof projs !== 'undefined' ? projs : [])) if (p.o !== wl.o && p.life > 0) src.push([p.x, p.y + 40 * HS]); } catch (e) {}
    try { for (const z of (typeof zombies !== 'undefined' ? zombies : [])) if (z.o !== wl.o && z.hp > 0) src.push([z.x, z.y]); } catch (e) {}
    try { const X = window.TECH_DEBUG || {}; for (const L of [X.orbs || [], X.slashes || []]) for (const q of L) if (q.o !== wl.o) src.push([q.x, q.y]); } catch (e) {}
    try { for (const w of ents) if (w !== wl.o && !w.dead) src.push([w.x, w.y]); } catch (e) {}
    let best = null, bd = 1e9; for (const c of live) for (const [sx, sy] of src) { const d = Math.hypot(c.x - sx, c.y - sy); if (d < bd) { bd = d; best = c; } }
    if (!best || bd > 90) best = live[Math.random() * live.length | 0]; return best; }
  function watch() { if (typeof walls === 'undefined') return; const now = typeof T === 'number' ? T : performance.now() / 1000;
    for (const wl of walls) { const prev = lastHp.get(wl); lastHp.set(wl, wl.hp); if (prev === undefined || !(wl.hp < prev - .01)) continue; const acc = (wl._smk || 0) + (prev - Math.max(0, wl.hp)); wl._smk = acc;
      if (now - (last.get(wl) || -9) < .12) continue; last.set(wl, now); wl._smk = 0; const c = hitPoint(wl); if (c) burstAt(c.x + (Math.random() - .5) * 8, c.y - 16 * HS, matOf(wl), acc); } }
  function step(dt) { for (const p of puffs) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.18, dt); p.vy = p.vy * Math.pow(.25, dt) - 6 * dt; p.rot += p.vr * dt; } puffs = puffs.filter(p => p.t < p.life);
    for (const q of shards) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 520 * dt; q.rot += q.vr * dt; if (q.z <= 0) { q.z = 0; if (!q.b && q.vz < -60) { q.b = 1; q.vz = -q.vz * .3; q.vx *= .45; q.vy *= .45; q.vr *= .5; } else { q.vz = 0; q.vx *= Math.pow(.02, dt); q.vy *= Math.pow(.02, dt); } } } shards = shards.filter(q => q.t < q.life); }
  function draw() { if (!puffs.length && !shards.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const q of shards) { const fade = q.t > q.life - .35 ? Math.max(0, (q.life - q.t) / .35) : 1; x.globalAlpha = fade; x.save(); x.translate(q.x, q.y - q.z * HS); x.rotate(q.rot); x.beginPath(); x.moveTo(0, -q.s); x.lineTo(q.s * .8, q.s * .7); x.lineTo(-q.s * .7, q.s * .5); x.closePath(); x.fillStyle = q.c; x.fill(); x.lineWidth = 1.2; x.strokeStyle = '#0b0614'; x.stroke(); x.restore(); }
    for (const p of puffs) { const k = p.t / p.life, e = 1 - Math.pow(1 - k, 3), r = p.r0 + (p.r1 - p.r0) * e, a = p.a * (k < .12 ? k / .12 : Math.pow(1 - (k - .12) / .88, 1.4)); if (a <= .01) continue;
      x.globalAlpha = a; x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.drawImage(p.spr, -r, -r, r * 2, r * 2); x.restore(); }
    x.restore(); }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { if (!ended) watch(); step(dt || 0); } catch (e) {} return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { draw(); } catch (e) {} return r; }; try { (0, eval)('render = window.render'); } catch (e) {} }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { puffs = []; shards = []; return _sd.apply(this, arguments); }; try { (0, eval)('startDuel = window.startDuel'); } catch (e) {} }
  window.WALL_FX = { burstAt, get n() { return puffs.length + shards.length; } };
})();

/* ---------------- (1.0.33.25) Juggernaut upgrade: Wallbreaker ----------------
   The Juggernaut walks straight through enemy walls and pillars: on contact the whole wall or pillar shatters. */
(function () {
  'use strict';
  try { const UP = (0, eval)('UPG'); if (UP && UP.zodiac && !UP.zodiac.some(u => u.id === 'wallbreak')) UP.zodiac.push({ id: 'wallbreak', n: 'Wallbreaker', d: 'Juggernaut: walks straight through enemy walls and pillars, shattering them on contact.' }); } catch (e) {}
  const isJ = z => z && z.beast && z.beast.boss && z.hp > 0 && z.rise >= 1;
  function tick() { if (typeof zombies === 'undefined' || typeof walls === 'undefined') return;
    for (const z of zombies) { if (!isJ(z) || !z.o || !U(z.o, 'zodiac', 'wallbreak')) continue; const reach = 22 * ((z.beast && z.beast.sz) || 1.5);
      for (const wl of walls) { if (wl.o === z.o || !(wl.hp > 0)) continue; if (!(wl.cr || []).some(c => !c.gone && Math.hypot(c.x - z.x, c.y - z.y) < reach)) continue;
        const mud = wl.mud; wl.hp = 0; wl.flash = .2; for (const c of wl.cr || []) if (!c.gone) { c.gone = 1; try { if (window.WALL_FX) WALL_FX.burstAt(c.x, c.y - 16 * HS, mud === 'pillar' ? 'stone' : mud ? 'mud' : 'ice', 14); } catch (e) {} }
        try { text(z.x, z.y - 104 * HS, 'SMASH!', '#ffe08a', true); shake = Math.max(shake, 10); sfx('shatter', { x: z.x, vol: .8 }); } catch (e) {} } } }
  if (typeof update === 'function') { const _u = update; window.update = update = function () { try { if (!ended) tick(); } catch (e) {} return _u.apply(this, arguments); }; try { (0, eval)('update = window.update'); } catch (e) {} }
})();
