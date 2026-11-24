/* =====================================================================
   WIZARDS VS SORCERERS: combat rules added in 1.0.4
   Loaded after wizard-blood.js. Uses window.TECHX (techniques internals) and BLOOD_DEBUG.

   - Cast lock: no new cast while one of your abilities is still playing out.
   - Boundary: the first move to arrive opens a one-second window. Everything arriving in it is stopped; when it
     closes the caught shots fly off in random directions at full damage. A Spell Cannon beam is held off for as
     long as it fires and scatters into wild rays; blood sprays.
   - Raise Dead: Second Body (a killing blow moves you into one of your zombies).
   - Blink: enemy casts aim at the afterimage while it is visible.
   - Last stand: Not Yet and Final Attempt burn white.
   ===================================================================== */
(function () {
  'use strict';
  const X = window.TECHX; if (!X) return;
  const B = () => window.BLOOD_DEBUG || { bloods: [], cuts: [] };
  const loopOf = w => Math.floor(((w.castN || 1) - 1) / Math.max(1, w.book.length));

  /* ---------------- cast lock ---------------- */
  function busy(w) {
    if (w.dead) return false;
    if ((w.rush && w.rush.ph !== 'back') || (w.bo && w.bo.ph !== 'back') || w.ceaseT > 0) return true;
    if (X.orbsC.some(c => c.o === w && !c.draw && !c.repel && c.life > 0 && !c.fused && !c.bnd)) return true;     // Collapse: wind-up and flight
    if (X.cleaves.some(c => c.o === w && !c.end)) return true;                                                  // Grand Bisection
    if (X.slashes.some(s => s.o === w && s.vivi && s.life > 0)) return true;                                    // Vivisection
    if (typeof cannons !== 'undefined' && cannons.some(c => c.o === w && c.t < c.dur)) return true;             // Spell Cannon firing
    if (B().bloods.some(b => b.o === w && b.k === 'blob' && !b.dead)) return true;                              // Bloodburst in the air
    return false;
  }
  window.castBusy = busy;

  /* ---------------- Boundary ---------------- */
  const HOLD = 1;
  let held = [], returns = [], jets = [], rays = [], outs = [], wash = 0, slowUntil = 0;
  // a catch drops the fight into slow motion for a beat (the first catch of a window is the long one)
  function slowBeat(big) { wash = Math.max(wash, big ? 1 : .6);
    try { if (ended || typeof slow === 'undefined' || (window.YARD && YARD.on)) return; const now = performance.now(); if (!big && now < slowUntil + 140) return; slow = Math.min(slow, big ? .2 : .45);
      slowUntil = Math.max(slowUntil, now + (big ? 320 : 130)); setTimeout(() => { try { if (performance.now() >= slowUntil - 8 && !ended) slow = 1; } catch (e) {} }, slowUntil - now + 8); } catch (e) {} }
  // the window opens on the first catch and stays open for HOLD seconds
  function bndOpen(w) { if (w.bndWin > 0) { slowBeat(false); return; } slowBeat(true); w.boundary = 0; w.bndWin = HOLD; text(w.x, w.y - 96 * HS, 'BOUNDARY', '#bcd2ff', true); inkRing(w.x, w.y, '#bcd2ff', 2, 30, 36, .6); try { sfx('ui_deal', { x: w.x, rate: .7 }); } catch (e) {} }
  window.bndOpen = bndOpen;
  window.bndOut = function (o, kind, gy) { outs.push({ o, kind: kind || 'rune', gy: gy || 0, lx: o.x, ly: o.y, still: 0 }); };   // other files mark what they fling off
  function spend(w, x0, y0) { bndOpen(w); X.addFx({ k: 'ping', x: x0, y: y0, life: .4 }); burst(x0, y0 - 30 * HS, 14, ['#e6f0ff', '#7aa6ff'], 160, 3, .35); }
  // a flying thing is caught: it hangs where it is, then turns on whoever threw it
  function hold(w, o, kind, gy) { const sp = Math.hypot(o.vx || 0, o.vy || 0) || 380; o.bnd = 1; o.vx = 0; o.vy = 0; spend(w, o.x, o.y + (gy || 0)); held.push({ o, kind, by: w, src: o.o, t: Math.max(.05, w.bndWin), sp, gy: gy || 0 }); }
  function release(h) {
    const o = h.o, by = h.by; o.bnd = 0; if (ended) { if (o.life !== undefined) o.life = 0; return; }
    const tg = by.foe, a = tg && !tg.dead ? Math.atan2(tg.y - (o.y + (h.gy || 0)), tg.x - o.x) : rnd(0, 6.283);   /* (1.0.11) sent back at the enemy caster, not off at random */ o.o = by; o.vx = Math.cos(a) * h.sp; o.vy = Math.sin(a) * h.sp; if (o.hit) o.hit = new Set(); if (o.hitW) o.hitW = new Set(); if (o.tested) o.tested = new Set();
    if (o.life !== undefined) o.life = Math.max(o.life, 1.6); if (o.a !== undefined) o.a = a; if (h.kind === 'orb') { o.sx = o.x; o.sy = o.y; o.L = 600; o.inD = new Set(); }
    burst(o.x, o.y + h.gy - 30 * HS, 10, ['#e6f0ff', '#7aa6ff'], 150, 3, .3); inkRing(o.x, o.y + h.gy, '#bcd2ff', 1, 6, 24);
    outs.push({ o, kind: h.kind, gy: h.gy, lx: o.x, ly: o.y, still: 0 });
  }
  // an instant hit (lightning, a punch, a blast) inside the window is simply stopped: sparks fly off, nothing lands
  const DOT_SRC = new Set(['burnbody', 'bubbles', 'thorns', 'earthm', 'counter', 'titan']);
  function catchHit(t, d, col) {
    spend(t, t.x, t.y); text(t.x + rnd(-10, 10), t.y - 76 * HS, 'STOPPED', '#bcd2ff'); for (let i = 0; i < 10; i++) { const an = rnd(0, 6.283); P({ x: t.x + Math.cos(an) * 30, y: t.y - 40 * HS + Math.sin(an) * 30, vx: -Math.cos(an) * 60, vy: -Math.sin(an) * 60, color: '#bcd2ff', size: 3, life: .5 }); }
  }
  const _dm = damage;
  window.damage = damage = function (t, d) {
    if (d > 0 && t && (t.boundary || t.bndWin > 0) && !t.dead && !ended && t.foe && !t.foe.dead && !catchHit.back && SRC && !DOT_SRC.has(SRC) && !(t.book.includes(SRC) && !t.foe.book.includes(SRC))) { catchHit(t, d, arguments[4]); return; }
    return _dm.apply(this, arguments);
  };
  // blood does not come back: it bursts into high-pressure jets that gouge the floor where they land
  function sprayBlood(w, x0, y0, ang, dmg, owner) {
    spend(w, x0, y0); shake = Math.max(shake, 8);
    for (let i = 0; i < 14; i++) { const a = ang + Math.PI + rnd(-1.9, 1.9), v = rnd(170, 420); jets.push({ x: x0, y: y0, z: 36 * HS, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8, vz: rnd(60, 240), o: owner, lx: x0, ly: y0, t: 0 }); }
    for (let i = 0; i < 26; i++) { const a = rnd(0, 6.283), v = rnd(80, 300); P({ x: x0, y: y0 - 36 * HS, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - 40, color: ['#ff5a6e', '#c8102e', '#7a0a18'][i % 3], size: rnd(2, 4.5), life: rnd(.3, .7), grav: 420, glow: false }); }
  }
  function near(w, x0, y0, r) { return Math.hypot(x0 - w.x, y0 - w.y) < r; }
  function boundaryUpdate(dt) {
    for (const w of ents) {
      if (w.dead) continue; if (w.bndWin > 0) { w.bndWin -= dt; if (w.bndWin <= 0) { w.bndWin = 0; if (!w.bndBeam) w.bndSpent = 1; } }
      if (!(w.boundary || w.bndWin > 0)) continue; const f = w.foe; let got = false;
      const scan = (list, kind, gy, ok) => { if (!list) return; for (const o of list) { if (o.o === w || o.bnd || !(o.life > 0) || (ok && !ok(o))) continue; if (near(w, o.x, o.y + gy, 38)) hold(w, o, kind, gy); } };
      if (typeof runes !== 'undefined') scan(runes, 'rune', 0);
      if (typeof arrows !== 'undefined') scan(arrows, 'arrow', 42 * HS);
      scan(X.slashes, 'slash', 0); scan(X.tarrows, 'tarrow', 0); scan(B().cuts, 'cut', 0, o => !(o.t < 0));
      scan(X.orbsC, 'orb', 0, o => !o.fused && (o.repel || (o.draw && o.out) || (!o.draw && !o.repel && (!o.wind || o.launched))));
      for (const b of B().bloods) { if (b.o === w) continue; if (b.k === 'blob') { if (b.t / b.T > .7 && near(w, b.tx, b.ty, 80) && !b.dead) { b.dead = 1; sprayBlood(w, b.x, b.y, Math.atan2(b.ty - b.sy, b.tx - b.sx), b.dmg, b.o); } }
        else if (b.life > 0 && near(w, b.x, b.y, 40)) { b.life = 0; sprayBlood(w, b.x, b.y, Math.atan2(b.vy, b.vx), b.dmg, b.o); } }
      if (typeof meteors !== 'undefined') for (const m of meteors) if (m.o !== w && !m.done && !m.bnd && m.t > m.fall * .72 && near(w, m.tx, m.ty, m.r + 6)) { m.bnd = 1; spend(w, m.tx, m.ty); held.push({ o: m, kind: 'meteor', by: w, src: m.o, t: Math.max(.05, w.bndWin), at: m.t }); }
    }
    for (const h of held) { h.t -= dt; const o = h.o;
      if (h.kind === 'meteor') { o.t = h.at; if (h.t <= 0) { o.bnd = 0; { const tg = h.by.foe; if (tg && !tg.dead) { o.tx = tg.x; o.ty = tg.y; } else { o.tx = rnd(F.x0 + 30, F.x1 - 30); o.ty = rnd(F.y0 + 30, F.y1 - 30); } } o.o = h.by; o.t = o.fall * .45; outs.push({ o, kind: 'meteor', gy: 0 }); } continue; }   // it comes down somewhere else
      o.vx = 0; o.vy = 0; if (o.life !== undefined) o.life = Math.max(o.life, .6);
      if (Math.random() < .5) P({ x: o.x + rnd(-10, 10), y: o.y + h.gy - 36 * HS + rnd(-10, 10), vx: rnd(-20, 20), vy: rnd(-30, 10), color: Math.random() < .5 ? '#bcd2ff' : '#ffffff', size: rnd(1.6, 3), life: .3 });
      if (h.t <= 0) release(h); }
    held = held.filter(h => h.t > 0);
    // flung-off attacks keep a blue outline until they land or fade
    for (const q of outs) { const o = q.o; if (q.kind === 'meteor') { q.gone = o.done || o.t >= o.fall; continue; }
      if (Math.abs(o.x - q.lx) + Math.abs(o.y - q.ly) < .2) q.still += dt; else q.still = 0; q.lx = o.x; q.ly = o.y;
      q.gone = !(o.life > 0) || o.dead || o.done || o.bnd || q.still > .3 || o.x < F.x0 - 60 || o.x > F.x1 + 60 || o.y < F.y0 - 90 || o.y > F.y1 + 60;
      if (!q.gone && Math.random() < dt * 30) P({ x: o.x + rnd(-4, 4), y: o.y + q.gy - 36 * HS + rnd(-4, 4), vx: -(o.vx || 0) * .12, vy: -(o.vy || 0) * .12, color: Math.random() < .6 ? '#7aa6ff' : '#e6f0ff', size: rnd(1.4, 2.6), life: .28 }); }
    outs = outs.filter(q => !q.gone); wash = Math.max(0, wash - dt * 3.2);
    for (const r of returns) { r.t -= dt; if (r.t <= 0 && !r.done) { r.done = 1; const to = r.to, by = r.by; if (to && !to.dead && !ended) { const keep = SRC; SRC = 'polarity'; X.addFx({ k: 'redir', x: by.x, y: by.y - 40 * HS, x2: to.x, y2: to.y - 40 * HS, life: .35 }); catchHit.back = 1; try { damage(to, r.d, 0, 0, '#bcd2ff'); } finally { catchHit.back = 0; SRC = keep; } text(to.x, to.y - 100 * HS, 'SENT BACK', '#bcd2ff', true); } } }
    returns = returns.filter(r => !r.done);
    // blood jets: arc out, land, cut a groove and leave a pool
    for (const j of jets) { j.t += dt; j.x += j.vx * dt; j.y += j.vy * dt; j.z += j.vz * dt; j.vz -= 900 * dt;
      if (Math.random() < .6) P({ x: j.x, y: j.y - j.z, vx: rnd(-10, 10), vy: -rnd(8, 26), color: ['#6a5a5e', '#8a7a7e', '#4a3e42'][Math.random() * 3 | 0], size: rnd(3, 6), life: rnd(.4, .8), glow: false, grow: 1.8, drag: .9, fade: .4, shrink: false });
      if (j.z <= 0) { j.done = 1; const sp = Math.hypot(j.vx, j.vy) || 1, ux = j.vx / sp, uy = j.vy / sp, L = rnd(14, 34), q = X.inArena(j.x, j.y), q2 = X.inArena(j.x + ux * L, j.y + uy * L);
        try { scar('trench', 0, 0, { x0: q.x, y0: q.y, x1: q2.x, y1: q2.y }); scar('stain', (q.x + q2.x) / 2, (q.y + q2.y) / 2, { r: rnd(8, 14), c: '#5a0a14', a: .7 }); scar('splash', q2.x, q2.y, { s: .5 }); scar('crack', q.x, q.y); } catch (e) {}
        if (B().pool) { B().pool(j.o, q.x, q.y, rnd(3, 6)); B().pool(j.o, q2.x, q2.y, rnd(4, 7)); }
        for (let i = 0; i < 6; i++) P({ x: q2.x, y: q2.y, vx: ux * rnd(20, 120) + rnd(-40, 40), vy: -rnd(40, 160), color: ['#c8102e', '#7a0a18', '#6e6250'][i % 3], size: rnd(2, 4), life: rnd(.3, .6), grav: 500, glow: false }); } }
    jets = jets.filter(j => !j.done);
    // a beam held off by Boundary: the charge lasts as long as the beam does
    for (const w of ents) if (w.bndBeam) { const c = w.bndBeam; if (c.t >= c.dur || c.done || !cannons.includes(c)) { w.bndBeam = null; w.bndSpent = 1; rays = rays.filter(r => r.c !== c); } }
    for (const r of rays) { const c = r.c, g = c.g; if (!g || !g.bnd) { r.live = 0; continue; } r.live = 1; r.va += rnd(-60, 60) * dt; r.va = clamp(r.va, -7, 7); r.off += r.va * dt; if (Math.abs(r.off) > 2.7 || Math.abs(r.off) < .35) { r.va = -r.va; r.off = clamp(Math.abs(r.off), .36, 2.69) * Math.sign(r.off || 1); }
      const a = c.ang + r.off, E0 = g.E, far = { x: E0.x + Math.cos(a) * 520, y: E0.y + Math.sin(a) * 520 * .8 }, E = typeof clipToField === 'function' ? clipToField(E0, far) : far; r.x0 = E0.x; r.y0 = E0.y; r.x1 = E.x; r.y1 = E.y;
      r.sc -= dt; if (r.sc <= 0) { r.sc = .16; try { beamTrails.push({ O: { x: E0.x, y: E0.y }, E: { x: E.x, y: E.y }, t: 0, w: .45 }); } catch (e) {} }
      if (Math.random() < .5) P({ x: E.x, y: E.y - 20 * HS, vx: rnd(-90, 90), vy: rnd(-120, 10), color: Math.random() < .5 ? '#ffffff' : '#4fe3ff', size: rnd(2, 3.6), life: .35 });
      // the wild rays still burn whatever they sweep across, the beam's own caster included, but lightly
      SRC = 'beam'; for (const e of [c.o].concat(ents.filter(q => q !== c.o && q !== g.bnd))) if (!e.dead && e.ghostT <= 0) { const q = closestOn(E0, E, e.x, e.y); if (Math.hypot(e.x - q.x, e.y - q.y) < 14 && Math.hypot(q.x - E0.x, q.y - E0.y) > 30) { e.hp = Math.max(1, e.hp - 9 * dt); e.flash = .05; } } }
    shake = rays.some(r => r.live) ? Math.max(shake, 3) : shake;
  }
  // the beam stops short of a fighter whose Boundary is up
  if (typeof beamGeom === 'function') { const _bg = beamGeom;
    window.beamGeom = beamGeom = function (c) { const g = _bg.apply(this, arguments), f = c.o.foe;
      if (f && !f.dead && !ended && (f.bndBeam === c || ((f.boundary || f.bndWin > 0) && !f.bndBeam))) { const q = closestOn(g.O, g.E, f.x, f.y), d = Math.hypot(f.x - q.x, f.y - q.y), along = Math.hypot(q.x - g.O.x, q.y - g.O.y);
        if (d < 40 && along > 44) { if (f.bndBeam !== c) { f.bndBeam = c; bndOpen(f); for (let i = 0; i < 5; i++) rays.push({ c, off: (i - 2) * .9 + rnd(-.2, .2) || .5, va: rnd(-4, 4), sc: rnd(0, .16), live: 1 }); }
          const L = along - 40, ux = (q.x - g.O.x) / along, uy = (q.y - g.O.y) / along; g.E = { x: g.O.x + ux * L, y: g.O.y + uy * L }; g.blk = null; g.bnd = f; } }
      return g; }; }

  /* ---------------- hooks ---------------- */
  const AIM_SKIP = new Set(['doubletake', 'rush', 'bloodoath', 'sanctum', 'blink', 'ghost', 'shield', 'hourglass', 'burnbody', 'healspring', 'titan', 'counter', 'secondwind', 'chosen', 'copycast', 'mirror']);
  const _cast = cast;
  window.cast = cast = function (w, k) {
    const f = w && w.foe; let keep = null;
    // Blink: while the afterimage is still fading, enemy casts are aimed at it, not at where the caster went
    // (1.0.11) Targets: Structures. The cast is aimed at the nearest enemy wall, pillar, totem, hourglass or turret, if there is one.
    if (f && !f.dead && w.me && !AIM_SKIP.has(k) && window.tgtPref && tgtPref(w, k) === 'struct') { let best = null, bd = 1e9; const see = (x0, y0) => { const d = Math.hypot(x0 - w.x, y0 - w.y); if (d < bd) { bd = d; best = { x: x0, y: y0 }; } };
      try { for (const wl of walls) if (wl.o !== w && wl.hp > 0) for (const c of wl.cr) if (!c.gone) see(c.x, c.y); for (const L of [typeof totems !== 'undefined' ? totems : [], typeof hgs !== 'undefined' ? hgs.filter(h => !h.done) : [], typeof archers !== 'undefined' ? archers.filter(a => a.hp > 0) : []]) for (const e of L) if (e.o !== w && e.x !== undefined) see(e.x, e.y); } catch (e) {}
      if (best) { keep = { x: f.x, y: f.y }; f.x = best.x; f.y = best.y; } }
    if (!keep && f && !f.dead && typeof afters !== 'undefined' && !AIM_SKIP.has(k)) { const a = afters.find(q => q.look === f && q.t < q.life * .9); if (a) { keep = { x: f.x, y: f.y }; f.x = a.x; f.y = a.y; } }
    let r; try { r = _cast.apply(this, arguments); } finally { if (keep) { f.x = keep.x; f.y = keep.y; } }
    // Sanctum: raising the dome wipes the enemy's hazards standing inside it
    try { if (k === 'sanctum' && w && !X.isCopying()) { const dm = X.domes.filter(d => d.o === w && d.t < .05 && !d.open).pop(); if (dm) eraseHazards(w, dm); } } catch (e) {}
    return r;
  };
  let erases = [];
  function eraseHazards(w, dm) {
    const inD = (x0, y0, pad) => Math.hypot(x0 - dm.x, (y0 - dm.y) * 1.4) < dm.r + (pad || 0), zap = (x0, y0, r) => { erases.push({ x: x0, y: y0, r: Math.max(18, r || 24), t: 0 }); burst(x0, y0 - 14 * HS, 12, ['#ffffff', '#bcd2ff', '#7aa6ff'], 170, 3, .4); };
    let n = 0; const sweep = (list, rOf) => { if (!list) return; for (let i = list.length - 1; i >= 0; i--) { const q = list[i]; if (q.o === w || q.x === undefined || !inD(q.x, q.y, 0)) continue; zap(q.x, q.y, rOf ? rOf(q) : q.r); list.splice(i, 1); n++; } };
    try { sweep(typeof patches !== 'undefined' && patches, q => q.r); sweep(typeof pits !== 'undefined' && pits, q => q.rmax || q.r); sweep(typeof wells !== 'undefined' && wells, q => q.r * .6); } catch (e) {}
    try { if (typeof decals !== 'undefined') for (let i = decals.length - 1; i >= 0; i--) { const d = decals[i]; if ((d.k === 'acid' || d.k === 'fire' || d.k === 'frost') && d.o && d.o !== w && inD(d.x, d.y, 0)) { zap(d.x, d.y, d.r); decals.splice(i, 1); n++; } } } catch (e) {}
    try { for (const m of (window.TECH_DEBUG ? TECH_DEBUG.muds : [])) if (m.o !== w && m.t < m.dur && inD(m.x, m.y, m.r * .5)) { zap(m.x, m.y, m.r * .7); m.t = m.dur; n++; } for (const sp of (window.TECH_DEBUG ? TECH_DEBUG.springs : [])) if (sp.o !== w && sp.t < sp.dur && inD(sp.x, sp.y, 0)) { zap(sp.x, sp.y, sp.r); sp.t = sp.dur; n++; } } catch (e) {}
    try { if (typeof totems !== 'undefined') for (const q of totems.slice()) if (q.o !== w && q.hp > 0 && inD(q.x, q.y, 0)) { zap(q.x, q.y, 22); SRC = 'sanctum'; hurtTotem(q, 9999); n++; } } catch (e) {}
    if (n) { text(dm.x, dm.y - 118 * HS, 'ERASED', '#ffffff', true); shake = Math.max(shake, 8); try { sfx('shatter', { x: dm.x, vol: .6, rate: 1.3 }); } catch (e) {} }
  }
  window.eraseHazards = eraseHazards;

  // Raise Dead, Second Body: a killing blow moves the caster into one of their zombies
  const _kill = kill;
  window.kill = kill = function (w) {
    if (w && !w.dead && !ended && !w.hopUsed && U(w, 'zombies', 'vessel')) {
      const mine = zombies.filter(z => z.o === w && z.hp > 0 && z.rise >= 1 && !(z.beast && z.beast.boss));
      if (mine.length) { const z = mine.reduce((a, b) => Math.hypot(b.x - w.foe.x, b.y - w.foe.y) > Math.hypot(a.x - w.foe.x, a.y - w.foe.y) ? b : a), x0 = w.x, y0 = w.y;
        w.hopUsed = 1; zombies.splice(zombies.indexOf(z), 1); w.x = z.x; w.y = z.y; w.vx = w.vy = 0; w.hp = Math.round(w.maxHp * .5); w._hpSeen = w.hp; w.bleeds = null; w.burn = 0; w.poisonT = 0; w.stunT = 0; w.rush = null; w.bo = null;
        X.addFx({ k: 'redir', x: x0, y: y0 - 40 * HS, x2: w.x, y2: w.y - 40 * HS, life: .45 }); X.addFx({ k: 'after', x: x0, y: y0, life: .7, w });
        burst(x0, y0 - 35 * HS, 30, ['#7ef08a', '#1e3a12', '#fff'], 220, 5, .8, 200); burst(w.x, w.y - 35 * HS, 34, ['#7ef08a', '#b8ffcf', '#fff'], 260, 5, .7); inkRing(w.x, w.y, '#7ef08a', 3, 10, 70, .6);
        text(w.x, w.y - 108 * HS, 'SECOND BODY', '#7ef08a', true); shake = Math.max(shake, 12); slow = Math.min(slow, .3); setTimeout(() => { if (!ended) slow = 1; }, 300); try { sfx('c_zombies', { x: w.x }); } catch (e) {}
        return; } }
    return _kill.apply(this, arguments);
  };

  const _su = startDuel;
  window.startDuel = startDuel = function () { held = []; returns = []; jets = []; rays = []; erases = []; outs = []; wash = 0; const r = _su.apply(this, arguments); try { ents.forEach(w => { w.hopUsed = 0; w.bndBeam = null; w.bndWin = 0; }); } catch (e) {} return r; };

  const _up = update;
  window.update = update = function (dt) {
    // cast lock: the bar fills, but nothing new fires while a move of yours is still playing out
    if (typeof ents !== 'undefined' && ents && !ended) for (const w of ents) { if (w.dead || !w.book || !w.book.length) continue; w.busyT = busy(w) ? (w.busyT || 0) + dt : 0; if (w.busyT > 0 && w.busyT < 6) { const ct = castT(w, w.book[w.i]); w.p = Math.min(w.p, ct - .13); } }
    const r = _up.apply(this, arguments);
    if (typeof ents === 'undefined' || !ents || !ents.length || ended) return r;
    boundaryUpdate(dt); for (const e of erases) e.t += dt; erases = erases.filter(e => e.t < .55);
    for (const w of ents) if (!w.dead && (w.fate || w.finalBoost)) { if (Math.random() < dt * 26) P({ x: w.x + rnd(-16, 16), y: w.y - rnd(0, 20) * HS, vx: rnd(-8, 8), vy: -rnd(70, 170), color: Math.random() < .75 ? '#ffffff' : '#fff3c8', size: rnd(1.8, 3.4), life: rnd(.5, .9) }); }
    return r;
  };

  const _rn = render;
  window.render = render = function () {
    const r = _rn.apply(this, arguments);
    if (typeof ents === 'undefined' || !ents || !ents.length || document.getElementById('battle')?.classList.contains('on') === false) return r;
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    // last stand: a white blaze, light climbing off the body and a ring beating on the floor
    for (const w of ents) if (!w.dead && (w.fate || w.finalBoost)) { const pu = .5 + .5 * Math.sin(T * 9); x.save(); x.translate(w.x, w.y); x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, -36 * SC, 4, 0, -36 * SC, 58 * SC); g.addColorStop(0, `rgba(255,255,255,${.5 + .2 * pu})`); g.addColorStop(.5, 'rgba(235,240,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(0, -36 * SC, 36 * SC, 58 * SC, 0, 0, 7); x.fill();
      x.lineCap = 'round'; for (let i = 0; i < 7; i++) { const ph = (T * 1.4 + i * .143) % 1, bx = Math.sin(i * 2.4) * 20 * SC, h = (30 + (i % 3) * 16) * SC; x.strokeStyle = `rgba(255,255,255,${(1 - ph) * .85})`; x.lineWidth = 2.2 * (1 - ph) + .6; x.beginPath(); x.moveTo(bx, -ph * 70 * SC); x.lineTo(bx + Math.sin(T * 5 + i) * 2, -ph * 70 * SC - h * (1 - ph)); x.stroke(); }
      x.scale(1, .45); for (let q = 0; q < 2; q++) { const kk = (T * .9 + q * .5) % 1; x.strokeStyle = `rgba(255,255,255,${(1 - kk) * .9})`; x.lineWidth = 3 * (1 - kk) + 1; x.beginPath(); x.arc(0, 0, (22 + 34 * kk) * SC, 0, 7); x.stroke(); }
      x.restore(); }
    // things Boundary is holding in the air
    for (const h of held) { const o = h.o, px = h.kind === 'meteor' ? o.tx : o.x, py = (h.kind === 'meteor' ? o.ty : o.y + h.gy) - (h.kind === 'meteor' ? 0 : 36 * HS), k = 1 - h.t / HOLD; x.save(); x.translate(px, py); x.globalCompositeOperation = 'lighter';
      x.strokeStyle = `rgba(188,210,255,${.9 - k * .3})`; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 16 + Math.sin(T * 30) * 1.5, 0, 7); x.stroke(); x.setLineDash([4, 5]); x.lineDashOffset = -T * 40; x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 23, -1.57, -1.57 + 6.283 * (1 - k)); x.stroke(); x.restore(); }
    // attacks Boundary has flung off: a blue outline rides them
    const OR = { proj: [24, 19], rune: [18, 14], arrow: [19, 8], tarrow: [19, 8], slash: [27, 12], cut: [24, 11], orb: [0, 0] };
    for (const q of outs) { const o = q.o; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      if (q.kind === 'meteor') { const f = Math.min(1, o.t / o.fall), sz = o.r / 52, mx = o.tx + (1 - f) * 160, my = o.ty - (1 - f) * 520;
        x.save(); x.translate(o.tx, o.ty); x.scale(1, .5); x.setLineDash([9, 7]); x.lineDashOffset = -T * 60; x.strokeStyle = 'rgba(122,166,255,.95)'; x.lineWidth = 3.5; x.shadowColor = '#4f8dff'; x.shadowBlur = 12; x.beginPath(); x.arc(0, 0, o.r + 5, 0, 7); x.stroke(); x.restore();
        x.strokeStyle = 'rgba(188,210,255,.95)'; x.lineWidth = 3; x.shadowColor = '#4f8dff'; x.shadowBlur = 14; x.beginPath(); x.arc(mx, my, 24 * sz + Math.sin(T * 26) * 1.5, 0, 7); x.stroke(); x.restore(); continue; }
      const a = Math.atan2(o.vy || 0, o.vx || 1), d = OR[q.kind] || OR.rune, rx = q.kind === 'orb' ? (o.r || 12) * (o.big ? 1.3 : 1) + 7 : d[0], ry = q.kind === 'orb' ? rx : d[1], pu = 1 + Math.sin(T * 28) * .07;
      x.translate(o.x, o.y + q.gy - 36 * HS); x.rotate(a);
      // a hard blue rim that reads over a bright shot, a glow around it, and speed lines behind
      x.globalCompositeOperation = 'source-over'; x.strokeStyle = '#0b1c5a'; x.lineWidth = 6.5; x.beginPath(); x.ellipse(0, 0, rx * pu, ry * pu, 0, 0, 7); x.stroke();
      x.strokeStyle = '#3f7dff'; x.lineWidth = 4; x.shadowColor = '#4f8dff'; x.shadowBlur = 14; x.beginPath(); x.ellipse(0, 0, rx * pu, ry * pu, 0, 0, 7); x.stroke(); x.shadowBlur = 0;
      x.strokeStyle = '#e2ecff'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(0, 0, rx * pu, ry * pu, 0, 0, 7); x.stroke();
      x.globalCompositeOperation = 'lighter'; x.setLineDash([5, 6]); x.lineDashOffset = -T * 70; x.strokeStyle = 'rgba(160,196,255,.8)'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(0, 0, (rx + 6) * pu, (ry + 6) * pu, 0, 0, 7); x.stroke(); x.setLineDash([]);
      for (let i = 0; i < 3; i++) { const yy = (i - 1) * ry * .8, len = 14 + i * 6 + Math.sin(T * 40 + i) * 3; x.strokeStyle = `rgba(122,166,255,${.85 - i * .12})`; x.lineWidth = 2.2; x.beginPath(); x.moveTo(-rx - 8, yy); x.lineTo(-rx - 8 - len, yy); x.stroke(); }
      x.restore(); }
    // the slow beat: a blue wash closes in from the edges of the screen
    if (wash > 0) { x.save(); const g = x.createRadialGradient(W / 2, H / 2, H * .18, W / 2, H / 2, H * .62); g.addColorStop(0, 'rgba(60,110,255,0)'); g.addColorStop(1, `rgba(60,110,255,${.42 * wash})`); x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(150,190,255,${.07 * wash})`; x.fillRect(0, 0, W, H); x.restore(); }
    // a beam breaking on Boundary: a hard blue wall of light where it stops, and the wild rays whipping off it
    for (const r0 of rays) { if (!r0.live || r0.x0 === undefined) continue; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      const n = 7, pts = []; for (let i = 0; i <= n; i++) { const u = i / n, jx = i && i < n ? rnd(-7, 7) : 0, jy = i && i < n ? rnd(-5, 5) : 0; pts.push([r0.x0 + (r0.x1 - r0.x0) * u + jx, r0.y0 + (r0.y1 - r0.y0) * u + jy]); }
      for (const [lw, col] of [[9, 'rgba(79,227,255,.42)'], [2.6, 'rgba(255,255,255,.95)']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
      x.restore(); }
    const seen = new Set(); for (const r0 of rays) { if (!r0.live || seen.has(r0.c) || r0.x0 === undefined) continue; seen.add(r0.c); const f = r0.c.g && r0.c.g.bnd; if (!f) continue; x.save(); x.globalCompositeOperation = 'lighter'; x.translate(r0.x0, r0.y0);
      const g = x.createRadialGradient(0, 0, 2, 0, 0, 34); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.4, 'rgba(120,200,255,.6)'); g.addColorStop(1, 'rgba(79,227,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 34 + Math.sin(T * 40) * 4, 0, 7); x.fill();
      x.rotate(r0.c.ang + Math.PI / 2); x.strokeStyle = 'rgba(230,240,255,.95)'; x.lineWidth = 4; x.beginPath(); x.moveTo(-30, 0); x.quadraticCurveTo(0, -12, 30, 0); x.stroke(); x.restore(); }
    // a hazard erased by a Sanctum: a hard flash of light over where it stood
    for (const e of erases) { const k = e.t / .55; x.save(); x.translate(e.x, e.y); x.globalCompositeOperation = 'lighter'; x.save(); x.scale(1, .5);
      const g = x.createRadialGradient(0, 0, 2, 0, 0, e.r * 1.3); g.addColorStop(0, `rgba(255,255,255,${(1 - k) * .95})`); g.addColorStop(.6, `rgba(160,200,255,${(1 - k) * .5})`); g.addColorStop(1, 'rgba(120,170,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, e.r * 1.3, 0, 7); x.fill();
      x.strokeStyle = `rgba(255,255,255,${1 - k})`; x.lineWidth = 3 * (1 - k) + 1; x.beginPath(); x.arc(0, 0, e.r * (.4 + .9 * k), 0, 7); x.stroke(); x.restore();
      x.lineCap = 'round'; for (let i = 0; i < 7; i++) { const bx = Math.sin(i * 2.3) * e.r * .8, h = (30 + (i % 3) * 22) * (1 - k * .4); x.strokeStyle = `rgba(255,255,255,${(1 - k) * .9})`; x.lineWidth = 2.4 * (1 - k) + .5; x.beginPath(); x.moveTo(bx, Math.cos(i * 1.7) * e.r * .25 - k * 30); x.lineTo(bx, Math.cos(i * 1.7) * e.r * .25 - k * 30 - h); x.stroke(); }
      x.restore(); }
    // blood jets in flight
    for (const j of jets) { x.save(); x.shadowColor = '#4f8dff'; x.shadowBlur = 8; x.fillStyle = '#9cc0ff'; x.beginPath(); x.arc(j.x, j.y - j.z, 4.6, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = '#e0162f'; x.beginPath(); x.arc(j.x, j.y - j.z, 3, 0, 7); x.fill(); x.restore(); }
    // cast lock: a small hourglass tick over a fighter who is waiting on their own move
    x.restore();
    return r;
  };
  window.RULES_DEBUG = { get held() { return held; }, get rays() { return rays; }, get jets() { return jets; }, get returns() { return returns; }, get outs() { return outs; }, busy };
})();
