/* =====================================================================
   WIZARDS VS SORCERERS: Blood Oath and Bloodcraft (logic + art)
   Loaded after wizard-techniques.js. Both are sorcerer techniques; their cards, stats and
   upgrades live in wizard-tech-data.js. Internals shared by the techniques file come in
   through window.TECHX, and the cast itself through window.TECH_CAST.

   Blood Oath   a pact while it is in your book (less health, less damage taken, faster casts,
                regeneration) and a dash-in sword string that makes the enemy bleed.
   Bloodcraft   thrown discs of blood, with a lance, a bursting blob, a double-damage surge and
                poison as upgrades. Spilled blood pools on the floor and flows back each loop.
   ===================================================================== */
(function () {
  'use strict';
  const X = window.TECHX; if (!X) return;
  const inBook = (w, k) => !!(w && w.book && w.book.includes(k));
  const OATH_HP = .65, OATH_DEF = .8, OATH_HASTE = .88, SURGE_T = 4, POISON_T = 3, POISON_DPS = 2;
  let arcs = [], cuts = [], bloods = [], pools = [], drops = [], streaks = [];
  const CR = ['#ff5a6e', '#c8102e', '#7a0a18'];
  const scale = () => window.CLONE_SCALE || 1;
  const loopOf = w => Math.floor(((w.castN || 1) - 1) / Math.max(1, w.book.length));

  /* ---------------- shared: pools of spilled blood ---------------- */
  function pool(o, x, y, r) { const q = X.inArena(x, y); pools.push({ o, x: q.x + rnd(-3, 3), y: q.y + rnd(-2, 2), r, t: 0, sq: rnd(.35, .5), rot: rnd(0, 3) }); if (pools.length > 110) pools.shift(); }
  function splat(o, x, y, n) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), d = rnd(0, 20); pool(o, x + Math.cos(a) * d, y + Math.sin(a) * d * .6, rnd(3.5, 7.5)); }
    for (let i = 0; i < n * 3; i++) { const a = rnd(0, 6.283), v = rnd(60, 220); P({ x, y: y - 30 * HS, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7 - 40, color: CR[i % 3], size: rnd(2, 4), life: rnd(.3, .6), grav: 420, glow: false }); } }
  // every loop the caster's spilled blood lifts off the floor and streams back into them
  function recall(w) { const mine = pools.filter(p => p.o === w); if (!mine.length) return; pools = pools.filter(p => p.o !== w);
    for (const p of mine) drops.push({ o: w, x: p.x, y: p.y, x0: p.x, y0: p.y, r: p.r, t: -Math.min(.35, Math.hypot(p.x - w.x, p.y - w.y) / 900) - rnd(0, .1), life: rnd(.45, .7) }); }

  /* ---------------- Blood Oath: the sword string ---------------- */
  const nSlashes = w => 2 + (U(w, 'bloodoath', 'more') ? 2 : 0);
  function oathCast(w) {
    if (w.rush) { w.rush = null; w.jump = 0; }
    const blitz = U(w, 'bloodoath', 'blitz');
    w.bo = { ph: blitz ? 'blitz' : 'dash', t: 0, dashT: 0, n: nSlashes(w), done: 0, cd: 0, side: 1, fl: 0, tg: null, x: w.x, y: w.y, hops: blitz ? 3 : 0, hopT: 0, from: null, to: null, back: 0 };
    text(w.x, w.y - 86 * HS, blitz ? 'BLITZ!' : 'OATH STRIKE!', '#ff5a6e', blitz);
  }
  function slashAt(w, r, tg, p, ux, uy, mult, crit) {
    const o = w.foe, dmg = S(w, 'bloodoath', 'dmg') * mult * scale(), px = p.x - ux * 6, py = p.y - 38 * HS;
    SRC = 'bloodoath'; r.side = -r.side; w.recoil = .08; w.face = Math.sign(p.x - w.x) || w.face;
    arcs.push({ x: px, y: py, a: Math.atan2(uy, ux), side: r.side, t: 0, life: crit ? .3 : .2, s: crit ? 1.5 : mult < 1 ? .75 : 1, crit });
    if (tg.k === 'wiz') {
      if (X.ghosted(o)) text(px, py - 20, 'MISS', '#ccc');
      else { const h0 = o.hp; damage(o, dmg, 0, 0, crit ? '#ffe08a' : '#c9fff4'); if (o.hp < h0) { X.addBleed(o); splat(w, o.x, o.y + 4, crit ? 4 : 2); if (typeof scar === 'function') scar('splash', o.x, o.y + 6, { s: .5 }); } }
    } else if (tg.k === 'wall') { tg.e.hp -= dmg * 2; tg.e.flash = .12; burst(px, py, 6, ['#d8f6ff', '#fff'], 150, 3, .35); text(px + rnd(-6, 6), py - 14, Math.round(dmg * 2), '#d8f6ff'); }
    else { hurtCreature(tg.e, tg.k, dmg * 1.2, 'slash'); text(px + rnd(-6, 6), py - 14, Math.round(dmg * 1.2), '#ffd6d2'); splat(w, p.x, p.y, 1); }
    if (!(tg.k === 'wiz' && X.ghosted(o))) { X.sanctumEcho(w, dmg, tg.k === 'wall' ? null : tg.e, COL.ki); SRC = 'bloodoath'; }
    if (crit) { X.impacts.push({ x: px, y: py, t: 0, r0: performance.now(), a: Math.atan2(uy, ux), seed: Math.random() * 99 }); text(px, py - 30, 'BACKSTAB!', '#ffe08a', true); shake = Math.max(shake, 14); slow = Math.min(slow, .05); setTimeout(() => { if (!ended) slow = 1; }, 110); }
    else shake = Math.max(shake, mult < 1 ? 1.5 : 3.5);
    // Flying Cuts: the swing also throws a cut that carries on past this target to the next enemy
    if (U(w, 'bloodoath', 'flying')) cuts.push({ o: w, x: p.x, y: p.y, vx: ux * 400, vy: uy * 400, life: 1, dmg: dmg * .6, skip: tg.k === 'wall' ? null : tg.e, t: 0 });
    try { sfx('c_dissect', { x: px, vol: .7, rate: 1.15 + rnd(-.08, .08) }); } catch (e) {}
  }
  function oathUpdate(w, dt) {
    const r = w.bo, o = w.foe; r.t += dt;
    const end = () => { w.bo = null; w.jump = 0; };
    if (o.dead || r.t > 9) return end();
    if (r.ph === 'back') { const k = r.bt / .32; r.bt += dt; r.x += r.bx * (1 - k) * 520 * dt; r.y += r.by * (1 - k) * 520 * dt; const q = X.inArena(r.x, r.y); r.x = q.x; r.y = q.y; w.jump = Math.sin(Math.min(1, k) * Math.PI) * 9; w.vx = w.vy = 0; if (k >= 1) return end(); return; }
    if (w.stunT > 0) { text(w.x, w.y - 86 * HS, 'INTERRUPTED', '#ccc'); return end(); }
    if (!r.tg || !X.tAlive(r.tg)) { const was = r.tg;
      if (was && was.k === 'wall' && was.behind && X.tAlive(was.behind)) r.tg = was.behind;
      else if (!was || was.k === 'wall') r.tg = X.rushPick(w);
      else { r.ph = 'back'; r.bt = 0; const d = Math.hypot(o.x - r.x, o.y - r.y) || 1; r.bx = -(o.x - r.x) / d; r.by = -(o.y - r.y) / d; return; }
      if (r.ph === 'hit') { r.ph = 'dash'; r.dashT = 0; } }
    let tg = r.tg;
    if (r.ph === 'blitz') {   // ricochet between random spots, leaving afterimages, then arrive on a random side of the target
      if (r.face0 === undefined) r.face0 = tg.k === 'wall' ? 0 : (tg.e.face || 1);   // which way the target was looking when the blitz began: too fast to turn and follow
      if (!r.to) { const p = X.tPos(tg), last = r.hops <= 0;
        if (last) { const an = rnd(0, 6.283), stop = tg.k === 'wiz' ? 30 : 24, q = X.inArena(p.x + Math.cos(an) * stop, p.y + Math.sin(an) * stop * .7); r.to = { x: q.x, y: q.y, last: 1 }; }
        else r.to = { x: rnd(F.x0 + 30, F.x1 - 30), y: rnd(F.y0 + 30, F.y1 - 30) };
        r.from = { x: r.x, y: r.y }; r.hopT = 0; r.hopD = Math.max(.07, Math.hypot(r.to.x - r.x, r.to.y - r.y) / 1900); }
      r.hopT += dt; const k = Math.min(1, r.hopT / r.hopD); r.x = r.from.x + (r.to.x - r.from.x) * k; r.y = r.from.y + (r.to.y - r.from.y) * k; w.face = Math.sign(r.to.x - r.from.x) || w.face; w.vx = w.vy = 0;
      if (Math.random() < .9) X.addFx({ k: 'after', x: r.x, y: r.y, life: .28, w });
      if (k >= 1) { streaks.push({ x0: r.from.x, y0: r.from.y, x1: r.to.x, y1: r.to.y, t: 0, life: .28 }); inkRing(r.x, r.y, '#ff5a6e', 1, 6, 30, .3); shake = Math.max(shake, 3);
        try { sfx('ui_deal', { x: r.x, rate: 1.5, vol: .6 }); } catch (e) {}
        if (r.to.last) { const p = X.tPos(tg), fc = tg.k === 'wall' ? 0 : r.face0;
          r.stab = !!(U(w, 'bloodoath', 'backstab') && fc && Math.sign(r.x - p.x) === -fc); r.ph = 'hit'; r.cd = .05; }
        r.hops--; r.to = null; }
      return; }
    if (r.ph === 'dash') {
      if (tg.k !== 'wall') { const wl = X.rushWall(w, tg); if (wl) r.tg = tg = wl; }
      const p = X.tPos(tg), d = Math.hypot(p.x - r.x, p.y - r.y) || 1, ux = (p.x - r.x) / d, uy = (p.y - r.y) / d, stop = tg.k === 'wiz' ? 30 : tg.k === 'wall' ? 16 : 24;
      const mv = Math.min(480 * dt, Math.max(0, d - stop)); r.x += ux * mv; r.y += uy * mv; w.face = Math.sign(p.x - r.x) || w.face; w.vx = w.vy = 0; r.dashT += dt;
      if (Math.random() < .9) P({ x: r.x - ux * 16 + rnd(-6, 6), y: r.y - rnd(10, 60) * HS, vx: -ux * 220, vy: -uy * 220, color: Math.random() < .5 ? '#ff5a6e' : '#ffd6d2', size: 2.5, life: .2 });
      if (Math.random() < .3) X.addFx({ k: 'after', x: r.x, y: r.y, life: .2, w });
      if (Math.hypot(p.x - r.x, p.y - r.y) <= stop + 3) { r.ph = 'hit'; r.cd = 0; }
      else if (r.dashT > 1.3) {
        if (U(w, 'bloodoath', 'flying')) { for (let i = 0; i < r.n; i++) cuts.push({ o: w, x: r.x + ux * 14, y: r.y + uy * 14, vx: Math.cos(Math.atan2(uy, ux) + (i - (r.n - 1) / 2) * .16) * 400, vy: Math.sin(Math.atan2(uy, ux) + (i - (r.n - 1) / 2) * .16) * 400, life: 1, dmg: S(w, 'bloodoath', 'dmg') * .6 * scale(), skip: null, t: -i * .07 }); text(w.x, w.y - 86 * HS, 'FLYING CUTS', '#ff8a96'); }
        else text(w.x, w.y - 86 * HS, 'OUT OF REACH', '#ccc');
        return end(); }
      return; }
    // hit: glued to the target, one slash per beat
    const p = X.tPos(tg), dd = Math.hypot(p.x - r.x, p.y - r.y) || 1;
    if (dd > 70) { r.ph = 'dash'; r.dashT = .7; return; }
    const ux = (p.x - r.x) / dd, uy = (p.y - r.y) / dd, stop = tg.k === 'wiz' ? 30 : tg.k === 'wall' ? 16 : 24;
    if (tg.k !== 'wall') { r.x = p.x - ux * stop; r.y = p.y - uy * stop; }
    w.vx = w.vy = 0; w.face = Math.sign(p.x - r.x) || w.face; if (tg.k === 'wiz') { o.vx *= .6; o.vy *= .6; }
    r.cd -= dt; if (r.cd > 0) return;
    const light = r.fl > 0; let last;
    if (light) { r.cd = .125; r.fl -= .125; last = r.fl <= .001; }
    else { r.cd = .2; r.done++; const over = r.done >= r.n; if (over && U(w, 'bloodoath', 'linger')) { r.fl = 1; last = false; text(w.x, w.y - 92 * HS, 'UNBROKEN EDGE', '#ff8a96', true); } else last = over; }
    const crit = r.stab && !light; if (crit) r.stab = 0;
    slashAt(w, r, tg, p, ux, uy, (light ? .35 : 1) * (crit ? 3 : 1), crit);
    if (last) { r.ph = 'back'; r.bt = 0; r.bx = -ux; r.by = -uy; }
  }

  /* ---------------- Bloodcraft: discs, lance and the bursting blob ---------------- */
  function bloodCast(w) {
    const o = w.foe, a = Math.atan2(o.y - w.y, o.x - w.x), x0 = w.x + Math.cos(a) * 20, y0 = w.y + Math.sin(a) * 20, dmg = S(w, 'bloodcraft', 'dmg') * scale(), venom = U(w, 'bloodcraft', 'venom');
    w.bcN = (w.bcN || 0) + 1;
    const startIn = new Set(X.domes.filter(d => d.o !== w && d.t < d.dur && Math.hypot(x0 - d.x, (y0 - d.y) * 1.4) < d.r));
    if (U(w, 'bloodcraft', 'burst') && w.bcN % 3 === 0) { const d = Math.hypot(o.x - w.x, o.y - w.y);
      bloods.push({ k: 'blob', o: w, x: x0, y: y0, sx: x0, sy: y0, tx: o.x, ty: o.y, t: 0, T: Math.max(.5, Math.min(.95, d / 420)), dmg: dmg * 1.8, venom, z: 0 }); text(w.x, w.y - 86 * HS, 'BLOODBURST', '#ff5a6e', true); }
    else if (U(w, 'bloodcraft', 'lance') && w.bcN % 2 === 0) { bloods.push({ k: 'lance', o: w, x: x0, y: y0, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, a, life: 1.2, dmg, venom, hit: new Set(), hitW: new Set(), startIn, trail: 0, sx: x0, sy: y0 });
      text(w.x, w.y - 86 * HS, 'BLOOD LANCE', '#ff5a6e'); shake = Math.max(shake, 5); }
    else { const two = U(w, 'bloodcraft', 'twin'); for (const off of two ? [-.2, .2] : [0]) bloods.push({ k: 'disc', o: w, x: x0, y: y0, vx: Math.cos(a + off) * 360, vy: Math.sin(a + off) * 360, a: a + off, life: 3, dmg: dmg * (two ? .65 : 1), venom, startIn, trail: 0, spin: rnd(0, 6) });
      text(w.x, w.y - 86 * HS, 'BLOODCRAFT', '#ff5a6e'); }
    if (U(w, 'bloodcraft', 'surge')) { w.surgeT = SURGE_T; text(w.x, w.y - 128 * HS, 'RED SURGE', '#ff3b4a', true); inkRing(w.x, w.y, '#ff3b4a', 2, 10, 50, .5); }
    for (let i = 0; i < 10; i++) { const an = a + rnd(-.9, .9), v = rnd(80, 220); P({ x: x0, y: y0 - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7, color: CR[i % 3], size: rnd(2, 3.6), life: rnd(.2, .45), grav: 300, glow: false }); }
  }
  function poison(w, f) { if (f.dead || X.ghosted(f)) return; if (!(f.poisonT > 0)) text(f.x - 14, f.y - 92 * HS, 'POISONED', '#b6f06a'); f.poisonT = POISON_T; f.poisonBy = w; }
  function bloodHitWiz(b, f, kx, ky) { const h0 = f.hp; damage(f, b.dmg, kx, ky, '#ff8a96'); splat(b.o, f.x, f.y + 4, 3); if (typeof scar === 'function') scar('splash', f.x, f.y + 6, { s: .6 }); if (b.venom && f.hp < h0) poison(b.o, f); }
  function burstBlob(b) {
    const w = b.o, f = w.foe, R = 85, inR = e => Math.hypot(e.x - b.tx, (e.y - b.ty) * 1.2) < R; SRC = 'bloodcraft';
    arcs.push({ nova: 1, x: b.tx, y: b.ty, t: 0, life: .45, R }); splat(w, b.tx, b.ty, 12); shake = Math.max(shake, 14); text(b.tx, b.ty - 80 * HS, 'SPLAT!', '#ff5a6e', true);
    try { sfx('boom', { x: b.tx, vol: .8, rate: 1.2 }); } catch (e) {}
    if (!f.dead && !X.ghosted(f) && inR(f)) { const d = Math.hypot(f.x - b.tx, f.y - b.ty) || 1; bloodHitWiz(b, f, (f.x - b.tx) / d * 420, (f.y - b.ty) / d * 420); }
    // everyone's summons and walls are caught in it, the caster's own included; only the caster is spared
    for (const side of [w, f]) for (const e of enemyCreatures(side)) if (e.e.x !== undefined && inR(e.e)) hurtCreature(e.e, e.k, b.dmg, 'crush');
    for (const wl of walls) { let n = 0; for (const c of wl.cr) if (!c.gone && inR(c)) n++; if (n) { wl.hp -= b.dmg * Math.min(2, n * .7); wl.flash = .15; } }
    for (const dm of X.domes) if (dm.o !== w && dm.t < dm.dur && Math.hypot(b.tx - dm.x, (b.ty - dm.y) * 1.4) < dm.r + R * .5) { dm.hp -= b.dmg; dm.hit = .15; }
  }
  function bloodUpdate(dt) {
    for (const b of bloods) {
      SRC = 'bloodcraft'; const w = b.o, f = w.foe;
      if (b.k === 'blob') { b.t += dt; const k = Math.min(1, b.t / b.T); b.x = b.sx + (b.tx - b.sx) * k; b.y = b.sy + (b.ty - b.sy) * k; b.z = Math.sin(k * Math.PI) * 90 * HS + 36 * HS * (1 - k);
        if (Math.random() < .5) pool(w, b.x, b.y, rnd(2, 4));
        if (k >= 1) { b.dead = 1; burstBlob(b); } continue; }
      b.life -= dt; const step = Math.hypot(b.vx, b.vy) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.trail += step;
      if (b.trail > (b.k === 'lance' ? 26 : 34)) { b.trail = 0; pool(w, b.x, b.y, rnd(2.2, 4.2)); }
      if (b.x < F.x0 - 20 || b.x > F.x1 + 20 || b.y < F.y0 - 30 || b.y > F.y1 + 20) b.life = 0;
      // an enemy Sanctum stops blood at its edge (unless it was thrown from inside)
      for (const dm of X.domes) if (b.life > 0 && dm.o !== w && dm.t < dm.dur && !b.startIn.has(dm) && Math.hypot(b.x - dm.x, (b.y - dm.y) * 1.4) < dm.r) { b.life = 0; dm.hp -= b.dmg; dm.hit = .15; X.addFx({ k: 'ping', x: b.x, y: b.y, life: .3 }); splat(w, b.x, b.y, 2); }
      if (b.life <= 0) continue;
      if (b.k === 'disc') {
        for (const c of enemyCreatures(w)) if (c.e.x !== undefined && Math.hypot(c.e.x - b.x, c.e.y - b.y) < 22) { hurtCreature(c.e, c.k, b.dmg, 'slash'); splat(w, c.e.x, c.e.y, 2); b.life = 0; break; }
        if (b.life > 0) for (const wl of walls) if (wl.o !== w && wallD(wl, b.x, b.y) < 12) { wl.hp -= b.dmg; wl.flash = .12; b.life = 0; splat(w, b.x, b.y, 2); break; }
        if (b.life > 0 && !f.dead && Math.hypot(f.x - b.x, f.y - b.y) < 24) { b.life = 0; if (X.ghosted(f)) text(f.x, f.y - 70 * HS, 'PHASED', '#bff'); else bloodHitWiz(b, f, b.vx * .15, b.vy * .15); }
      } else {   // lance: through everything once
        for (const c of enemyCreatures(w)) if (c.e.x !== undefined && !b.hit.has(c.e) && Math.hypot(c.e.x - b.x, c.e.y - b.y) < 22) { b.hit.add(c.e); hurtCreature(c.e, c.k, b.dmg, 'slash'); splat(w, c.e.x, c.e.y, 1); }
        for (const wl of walls) if (wl.o !== w && !b.hitW.has(wl) && wallD(wl, b.x, b.y) < 14) { b.hitW.add(wl); wl.hp -= b.dmg; wl.flash = .12; burst(b.x, b.y - 25 * HS, 8, ['#ff8a96', '#fff'], 140, 3, .3); }
        if (!f.dead && !b.hit.has(f) && Math.hypot(f.x - b.x, f.y - b.y) < 24) { b.hit.add(f); if (X.ghosted(f)) text(f.x, f.y - 70 * HS, 'PHASED', '#bff'); else bloodHitWiz(b, f, b.vx * .08, b.vy * .08); }
      }
    }
    bloods = bloods.filter(b => b.k === 'blob' ? !b.dead : b.life > 0);
    // flying cuts thrown by the Blood Oath sword
    for (const c of cuts) { c.t += dt; if (c.t < 0) continue; SRC = 'bloodoath'; c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; const w = c.o, f = w.foe;
      if (c.x < F.x0 - 20 || c.x > F.x1 + 20 || c.y < F.y0 - 30 || c.y > F.y1 + 20) c.life = 0;
      for (const dm of X.domes) if (c.life > 0 && dm.o !== w && dm.t < dm.dur && Math.hypot(c.x - dm.x, (c.y - dm.y) * 1.4) < dm.r && Math.hypot(w.x - dm.x, (w.y - dm.y) * 1.4) > dm.r) { c.life = 0; dm.hp -= c.dmg; dm.hit = .15; }
      for (const e of enemyCreatures(w)) if (c.life > 0 && e.e !== c.skip && e.e.x !== undefined && Math.hypot(e.e.x - c.x, e.e.y - c.y) < 22) { hurtCreature(e.e, e.k, c.dmg, 'slash'); c.life = 0; }
      for (const wl of walls) if (c.life > 0 && wl.o !== w && wallD(wl, c.x, c.y) < 12) { wl.hp -= c.dmg; wl.flash = .12; c.life = 0; }
      if (c.life > 0 && f !== c.skip && !f.dead && Math.hypot(f.x - c.x, f.y - c.y) < 24) { c.life = 0; if (!X.ghosted(f)) { const h0 = f.hp; damage(f, c.dmg, c.vx * .1, c.vy * .1, '#c9fff4'); if (f.hp < h0) X.addBleed(f); } } }
    cuts = cuts.filter(c => c.life > 0);
    for (const a of arcs) a.t += dt; arcs = arcs.filter(a => a.t < a.life);
    for (const s of streaks) s.t += dt; streaks = streaks.filter(s => s.t < s.life);
    for (const p of pools) p.t += dt;
    for (const d of drops) { d.t += dt; if (d.t < 0) continue; const k = Math.min(1, d.t / d.life), e = k * k, w = d.o; d.x = d.x0 + (w.x - d.x0) * e; d.y = d.y0 + (w.y - 36 * HS - d.y0) * e - Math.sin(k * Math.PI) * 26;
      if (k >= 1 && !d.done) { d.done = 1; if (Math.random() < .5) P({ x: w.x + rnd(-6, 6), y: w.y - 36 * HS + rnd(-8, 8), vx: rnd(-40, 40), vy: rnd(-60, 10), color: '#ff5a6e', size: rnd(2, 3), life: .25 }); } }
    drops = drops.filter(d => !d.done);
  }

  /* ---------------- hooks ---------------- */
  // no recordings of their own yet: borrow the nearest cast sounds
  { const _sfx = sfx, AL = { c_bloodoath: ['c_rush', 1.1], c_bloodcraft: ['c_dissect', .82] }; window.sfx = sfx = function (id, o) { const al = AL[id]; return al ? _sfx(al[0], Object.assign({ rate: al[1] }, o || {})) : _sfx.apply(this, arguments); }; }
  window.TECH_CAST = Object.assign(window.TECH_CAST || {}, { bloodoath: oathCast, bloodcraft: bloodCast });
  try { ONE_COPY.add('bloodoath'); } catch (e) {}

  // each new loop of a Bloodcraft caster calls their blood home
  const _cast = cast;
  window.cast = cast = function (w, k) {
    if (w && w.book && w.castN > 0 && w.castN % Math.max(1, w.book.length) === 0 && (inBook(w, 'bloodcraft') || pools.some(p => p.o === w))) recall(w);
    return _cast.apply(this, arguments);
  };

  // the pact: faster casts
  const _cm = window.castMod;
  window.castMod = function (w, k, base) { const b = _cm ? _cm(w, k, base) : base; return inBook(w, 'bloodoath') ? b * OATH_HASTE : b; };

  // the pact: less damage taken. Red Surge: the caster's own hits land twice as hard and may lash back
  const NOT_STRIKES = new Set(['zombies', 'zodiac', 'golem', 'archer', 'flies', 'totem', 'titan']);
  function surgeRoll(a, d) { if (a.dead || ended || (a.surgeCd || 0) > 0 || Math.random() >= .33) return; a.surgeCd = .2;
    const cut = Math.min(d, Math.max(0, a.hp - 1)); if (cut <= 0) return; a.hp -= cut; if (a.prevHp !== undefined) a.prevHp -= cut; a.lastSrc = 'bloodcraft';
    text(a.x + rnd(-8, 8), a.y - 84 * HS, 'LASH -' + Math.max(1, Math.round(cut)), '#ff3b4a'); for (let i = 0; i < 6; i++) P({ x: a.x + rnd(-8, 8), y: a.y - rnd(20, 60) * HS, vx: rnd(-60, 60), vy: rnd(-40, 60), color: CR[i % 3], size: rnd(2, 3.4), life: .4, grav: 300, glow: false }); }
  const surging = (t, d) => d > 0 && t && t.foe && t.foe !== t && t.foe.surgeT > 0 && !NOT_STRIKES.has(SRC);
  const _dm = damage;
  window.damage = damage = function (t, d) {
    if (d > 0 && t && inBook(t, 'bloodoath')) arguments[1] = d = d * OATH_DEF;
    if (surging(t, d)) { surgeRoll(t.foe, d); arguments[1] = d * 2; }
    return _dm.apply(this, arguments);
  };
  const _hc = hurtCreature;
  window.hurtCreature = hurtCreature = function (c, k, d) {
    const a = c && c.o && c.o.foe; if (d > 0 && a && a.surgeT > 0 && !NOT_STRIKES.has(SRC)) { surgeRoll(a, d); arguments[2] = d * 2; }
    return _hc.apply(this, arguments);
  };

  const _su = startDuel;
  window.startDuel = startDuel = function () {
    arcs = []; cuts = []; bloods = []; pools = []; drops = []; streaks = [];
    const r = _su.apply(this, arguments);
    try { ents.forEach(w => { w.bo = null; w._oath = 0; w.surgeT = 0; w.surgeCd = 0; w.poisonT = 0; w.bcN = 0; w.domeFree = false; }); } catch (e) {}
    return r;
  };

  const _up = update;
  window.update = update = function (dt) {
    const r = _up.apply(this, arguments);
    if (typeof ents === 'undefined' || !ents || !ents.length) return r;
    for (const w of ents) {
      if (w.dead) { w.bo = null; continue; }
      w.domeFree = U(w, 'bloodoath', 'free');
      // the pact is struck on the first beat of the round: max health drops, and it mends from then on
      if (inBook(w, 'bloodoath')) {
        if (!w._oath) { w._oath = 1; w.maxHp = Math.max(1, Math.round(w.maxHp * OATH_HP)); w.hp = Math.min(w.hp, w.maxHp); w.lag = w.hp; w._ph = w.hp; w._hpLast = w.hp; w._hpSeen = w.hp; if (w.prevHp !== undefined) w.prevHp = w.hp;
          text(w.x, w.y - 100 * HS, 'BLOOD OATH', '#ff4a5a', true); burst(w.x, w.y - 40 * HS, 22, ['#ff4a5a', '#8a0010', '#fff'], 200, 4, .5); inkRing(w.x, w.y, '#ff4a5a', 2, 10, 50, .6); }
        if (!ended && w.hp > 0 && w.hp < w.maxHp) { const g = Math.min(S(w, 'bloodoath', 'regen') * dt, w.maxHp - w.hp); w.hp += g; if (w.prevHp !== undefined) w.prevHp += g; w.oathAcc = (w.oathAcc || 0) + g;
          if (w.oathAcc >= 2) { w.oathAcc = 0; P({ x: w.x + rnd(-12, 12), y: w.y - rnd(10, 50) * HS, vx: 0, vy: -rnd(30, 60), color: '#ff8a96', size: 3, life: .6 }); } } }
      if (ended) continue;
      if (w.bo) { oathUpdate(w, dt); if (w.bo) { w.x = w.bo.x; w.y = w.bo.y; } }
      if (w.surgeT > 0) { w.surgeT -= dt; w.surgeCd = Math.max(0, (w.surgeCd || 0) - dt); if (Math.random() < dt * 22) P({ x: w.x + rnd(-14, 14), y: w.y - rnd(0, 66) * HS, vx: rnd(-10, 10), vy: -rnd(40, 110), color: Math.random() < .7 ? '#ff3b4a' : '#ffd6d2', size: rnd(2, 3.6), life: rnd(.25, .5) }); if (w.surgeT <= 0) text(w.x, w.y - 92 * HS, 'surge fades', '#bbb'); }
      if (w.poisonT > 0) { w.poisonT -= dt; const d = Math.min(POISON_DPS * dt, w.hp); w.hp -= d; w.lastSrc = 'bloodcraft'; w.poisonAcc = (w.poisonAcc || 0) + d;
        if (Math.random() < dt * 9) P({ x: w.x + rnd(-10, 10), y: w.y - rnd(20, 64) * HS, vx: rnd(-12, 12), vy: -rnd(20, 50), color: Math.random() < .6 ? '#b6f06a' : '#9a4dff', size: rnd(2.2, 3.6), life: .6, glow: false });
        if (w.poisonAcc >= 1) { text(w.x + rnd(-8, 8), w.y - 70 * HS, Math.round(w.poisonAcc), '#b6f06a'); w.poisonAcc = 0; }
        if (w.hp <= 0 && !w.dead) kill(w); }
    }
    if (!ended) bloodUpdate(dt);
    return r;
  };

  /* ---------------- drawing ---------------- */
  // blood on the floor (drawn with the ground decals, under everything that stands)
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) {
    _dd.apply(this, arguments); if (x !== ctx || !pools.length) return;
    x.save();
    for (const p of pools) { const g = Math.min(1, p.t * 6); x.save(); x.translate(p.x, p.y); x.rotate(p.rot * .15); x.scale(1, p.sq); x.globalAlpha = .9;
      x.fillStyle = '#3a0008'; x.beginPath(); x.arc(0, 0, p.r * g + 1.2, 0, 7); x.fill(); x.fillStyle = '#a00d22'; x.beginPath(); x.arc(0, 0, p.r * g, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,150,160,.55)'; x.beginPath(); x.ellipse(-p.r * .3, -p.r * .3, p.r * .32, p.r * .18, -.5, 0, 7); x.fill(); x.restore(); }
    x.restore();
  };
  function drawSword(x, w) {   // a short curved blade: on the hip at rest, in hand through the string
    const r = w.bo, out = r && r.ph !== 'back', f = w.face || 1; x.save(); x.translate(w.x, w.y - (w.jump || 0)); x.scale(f * SC, SC);
    if (out) { x.translate(13, -33); x.rotate(r.ph === 'hit' ? -.5 + Math.sin(T * 40) * .9 : .95); } else { x.translate(-9, -43); x.rotate(3.72); }
    x.lineJoin = 'round'; x.strokeStyle = '#07020d'; x.lineWidth = 1.7;
    x.fillStyle = '#5a1420'; x.beginPath(); x.rect(-2, 0, 4, 9); x.fill(); x.stroke();                         // grip
    x.fillStyle = '#ffd75e'; x.beginPath(); x.rect(-5, -1.8, 10, 3); x.fill(); x.stroke();                     // guard
    x.beginPath(); x.moveTo(-3.2, -1.8); x.quadraticCurveTo(-5, -20, 1.6, -35); x.quadraticCurveTo(5, -20, 3.2, -1.8); x.closePath(); x.fillStyle = '#ffffff'; x.fill(); x.stroke();   // blade
    x.strokeStyle = 'rgba(255,60,80,.95)'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(.2, -4); x.quadraticCurveTo(-1.2, -18, 1.2, -30); x.stroke();   // blood groove
    x.restore();
  }
  function crescent(x, r, a0) { x.beginPath(); x.arc(0, 0, r, -a0, a0); x.arc(-r * .42, 0, r * .92, a0 * .86, -a0 * .86, true); x.closePath(); }
  const _rn = render;
  window.render = render = function () {
    const r = _rn.apply(this, arguments);
    if (typeof ents === 'undefined' || !ents || !ents.length || document.getElementById('battle')?.classList.contains('on') === false) return r;
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const w of ents) if (!w.dead && inBook(w, 'bloodoath')) drawSword(x, w);
    // Red Surge: veins of light climbing the body
    for (const w of ents) if (!w.dead && w.surgeT > 0) { const a = Math.min(1, w.surgeT * 2); x.save(); x.translate(w.x, w.y); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * (.5 + .2 * Math.sin(T * 14));
      const g = x.createRadialGradient(0, -34 * SC, 4, 0, -34 * SC, 44 * SC); g.addColorStop(0, 'rgba(255,60,80,.5)'); g.addColorStop(1, 'rgba(255,0,40,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(0, -34 * SC, 28 * SC, 44 * SC, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(255,90,110,.9)'; x.lineWidth = 1.6; x.lineCap = 'round'; for (let i = 0; i < 4; i++) { const ph = (T * 1.6 + i * .25) % 1, bx = (i - 1.5) * 7 * SC; x.beginPath(); for (let j = 0; j <= 6; j++) { const u = j / 6, yy = -u * 66 * SC * ph, xx = bx + Math.sin(u * 9 + i * 2 + T * 6) * 3; j ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
      x.restore(); }
    // blitz streaks
    for (const s of streaks) { const k = s.t / s.life; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.strokeStyle = `rgba(255,90,110,${(1 - k) * .8})`; x.lineWidth = 7 * (1 - k) + 1; x.beginPath(); x.moveTo(s.x0, s.y0 - 36 * HS); x.lineTo(s.x1, s.y1 - 36 * HS); x.stroke(); x.strokeStyle = `rgba(255,255,255,${(1 - k) * .9})`; x.lineWidth = 2 * (1 - k) + .5; x.stroke(); x.restore(); }
    // sword arcs and the Bloodburst flash
    for (const a of arcs) { const k = a.t / a.life;
      if (a.nova) { const R = a.R * (.35 + .65 * Math.min(1, k * 2.2)); x.save(); x.translate(a.x, a.y - 20 * HS); x.scale(1, .62); x.globalAlpha = (1 - k) * .85; const g = x.createRadialGradient(0, 0, R * .1, 0, 0, R); g.addColorStop(0, '#ffd6d2'); g.addColorStop(.35, '#ff3b4a'); g.addColorStop(.8, '#7a0a18'); g.addColorStop(1, 'rgba(58,0,8,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
        x.globalAlpha = 1 - k; x.strokeStyle = '#07020d'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, R * .96, 0, 7); x.stroke(); x.strokeStyle = '#ff8a96'; x.lineWidth = 2.5; x.stroke(); x.restore(); continue; }
      const sw = Math.min(1, k * 2.4), fade = k < .4 ? 1 : 1 - (k - .4) / .6, R = 30 * a.s * SC;
      x.save(); x.translate(a.x, a.y); x.rotate(a.a + a.side * (.9 - sw * 1.8)); x.globalAlpha = fade;
      x.fillStyle = '#07020d'; crescent(x, R + 2.5, 1.15); x.fill(); x.fillStyle = a.crit ? '#ffe08a' : '#ff3b4a'; crescent(x, R, 1.1); x.fill();
      x.globalCompositeOperation = 'lighter'; x.fillStyle = '#ffffff'; x.globalAlpha = fade * .9; x.translate(R * .1, 0); crescent(x, R * .72, .95); x.fill(); x.restore(); }
    // flying cuts
    for (const c of cuts) { if (c.t < 0) continue; x.save(); x.translate(c.x, c.y - 36 * HS); x.rotate(Math.atan2(c.vy, c.vx)); x.globalAlpha = Math.min(1, c.life * 3);
      x.fillStyle = '#07020d'; crescent(x, 17 * SC, 1.15); x.fill(); x.fillStyle = '#ff3b4a'; crescent(x, 15 * SC, 1.1); x.fill(); x.globalCompositeOperation = 'lighter'; x.fillStyle = '#fff'; x.translate(2, 0); crescent(x, 10 * SC, .9); x.fill(); x.restore(); }
    // blood in flight
    for (const b of bloods) {
      if (b.k === 'disc') { b.spin += .5; x.save(); x.translate(b.x, b.y - 36 * HS); x.scale(1, .78); x.rotate(b.spin); const R = 13 * SC;
        x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.lineTo(Math.cos(a) * R, Math.sin(a) * R); x.quadraticCurveTo(Math.cos(a + .5) * R * 1.2, Math.sin(a + .5) * R * 1.2, Math.cos(a + .55) * R * .62, Math.sin(a + .55) * R * .62); } x.closePath();
        x.fillStyle = '#c8102e'; x.strokeStyle = '#07020d'; x.lineWidth = 2.6; x.lineJoin = 'round'; x.fill(); x.stroke();
        x.fillStyle = b.venom ? '#b6f06a' : '#ff8a96'; x.beginPath(); x.arc(0, 0, R * .42, 0, 7); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(-R * .3, -R * .35, R * .22, R * .1, -.6, 0, 7); x.fill(); x.restore();
        x.save(); x.globalAlpha = .3; x.fillStyle = '#000'; x.beginPath(); x.ellipse(b.x, b.y + 2, 10 * SC, 3.5 * SC, 0, 0, 7); x.fill(); x.restore(); }
      else if (b.k === 'lance') { const L = Math.min(150, Math.hypot(b.x - b.sx, b.y - b.sy)); x.save(); x.translate(b.x, b.y - 36 * HS); x.rotate(b.a); x.lineCap = 'round';
        x.strokeStyle = '#07020d'; x.lineWidth = 8; x.beginPath(); x.moveTo(-L, 0); x.lineTo(6, 0); x.stroke(); const g = x.createLinearGradient(-L, 0, 6, 0); g.addColorStop(0, 'rgba(200,16,46,0)'); g.addColorStop(.5, '#c8102e'); g.addColorStop(1, '#ff8a96'); x.strokeStyle = g; x.lineWidth = 5; x.stroke();
        x.strokeStyle = b.venom ? '#d9ffa0' : '#fff'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-L * .5, 0); x.lineTo(6, 0); x.stroke();
        x.fillStyle = '#ff8a96'; x.strokeStyle = '#07020d'; x.lineWidth = 2; x.beginPath(); x.moveTo(16, 0); x.lineTo(2, -5.5); x.lineTo(2, 5.5); x.closePath(); x.fill(); x.stroke(); x.restore(); }
      else { const wob = 1 + Math.sin(b.t * 30) * .08, R = 15 * SC; x.save(); x.globalAlpha = .3; x.fillStyle = '#000'; x.beginPath(); x.ellipse(b.x, b.y + 2, R * .9, R * .32, 0, 0, 7); x.fill(); x.restore();
        x.save(); x.translate(b.x, b.y - b.z); x.scale(wob, 2 - wob); x.fillStyle = '#c8102e'; x.strokeStyle = '#07020d'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.stroke();
        x.fillStyle = '#7a0a18'; x.beginPath(); x.arc(R * .2, R * .25, R * .62, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(-R * .35, -R * .4, R * .28, R * .14, -.6, 0, 7); x.fill(); x.restore(); } }
    // blood flowing home
    for (const d of drops) { if (d.t < 0) continue; const k = Math.min(1, d.t / d.life), s = Math.max(1.6, d.r * (1 - k * .5)); x.save(); x.fillStyle = '#07020d'; x.beginPath(); x.arc(d.x, d.y, s + 1.2, 0, 7); x.fill(); x.fillStyle = '#e0162f'; x.beginPath(); x.arc(d.x, d.y, s, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(d.x - s * .3, d.y - s * .3, s * .3, 0, 7); x.fill(); x.restore(); }
    x.restore();
    return r;
  };
  window.BLOOD_DEBUG = { get pools() { return pools; }, get bloods() { return bloods; }, get cuts() { return cuts; }, get drops() { return drops; }, recall };
})();
