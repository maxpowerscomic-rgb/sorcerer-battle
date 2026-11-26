/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.29 — auto-attacks
   Every fighter attacks on its own between casts, while its cast bar keeps charging.
   - Wizards: a short-range Magic Bolt, 1.75 damage every 1.3 s. It flies 130 px and is stopped by walls and enemy Sanctums.
   - Sorcerers: a lunging Jab, 2.25 damage every 0.7 s, within 76 px (they step in to throw it).
   - Tempo: each auto that lands shaves 3% off the attacker's current cast.
   Autos are not abilities: their source is 'auto', so they never trigger upgrades, Boundary, the Juggernaut's Adaptation
   or ability trials, and the battle report lists them as "Auto-attacks". Shields, shells and dodges still stop them.
   Off in the tutorial. On for players and AI alike; in Survival they hit the mobs.
   ===================================================================== */
(function () {
  'use strict';
  // tuned in 80-round simulations: at these ranges autos are ~8% of each class's damage (bolts were 23% at 190 px)
  const BOLT = { dmg: 1.75, cd: 1.3, range: 130, speed: 340 }, JAB = { dmg: 2.25, cd: .7, reach: 76 }, TEMPO = .03;
  const isSorc = w => ((w.look && w.look.cls) || w.cls) === 'sorc';
  let bolts = [], jabs = [];
  const on = () => typeof M !== 'undefined' && M && !window.ONB_ACTIVE && typeof ents !== 'undefined' && ents && ents.length >= 2;
  function targets(w) { const out = []; const f = w.foe;
    if (f && !f.dead && !f.svAnchor && !(f.ghostT > 0)) out.push({ e: f, k: 'wiz' });
    try { for (const c of enemyCreatures(w)) if (c.e && c.e.x !== undefined && c.k !== 'tm' && !(c.e.hp <= 0)) out.push(c); } catch (e) {}
    return out; }
  const near = (w, list, max) => { let best = null, bd = max; for (const t of list) { const d = Math.hypot(t.e.x - w.x, t.e.y - w.y); if (d < bd) { bd = d; best = t; } } return best; };
  function hit(w, t, dmg, col) { const s0 = SRC; SRC = 'auto';
    try { if (t.k === 'wiz') damage(t.e, dmg, (t.e.x - w.x) * .4, (t.e.y - w.y) * .4, col); else hurtCreature(t.e, t.k, dmg, 'auto'); } finally { SRC = s0; }
    // tempo: a landed auto shaves 3% off the current cast
    try { const k = w.book[w.i], ct = castT(w, k); if (ct > 0) w.p = Math.min(ct * .97, (w.p || 0) + ct * TEMPO); } catch (e) {} }
  function tick(dt) { if (window.AUTO_OFF || !on() || ended || introT > 0) return;
    for (const w of ents) { if (!w || w.dead || w.svAnchor || w.isDummy || !(w.book && w.book.length)) continue; w.autoCd = (w.autoCd || 0) - dt;
      if (w.autoCd > 0 || w.stunT > 0 || w.frozen > 0 || (w.rush && w.rush.ph !== 'back') || w.ghostT > 0) continue;
      const list = targets(w);
      if (isSorc(w)) { const t = near(w, list, JAB.reach + 6); if (!t) continue; if (typeof wallBetween === 'function' && wallBetween(w, w, t.e)) continue;
        w.autoCd = JAB.cd; w.face = t.e.x < w.x ? -1 : 1; { const dx = t.e.x - w.x, dy = t.e.y - w.y, d = Math.hypot(dx, dy) || 1, step = Math.min(16, Math.max(0, d - 30)); try { const q = inArena(w.x + dx / d * step, w.y + dy / d * step); w.x = q.x; w.y = q.y; } catch (e) {} } jabs.push({ x: (w.x + t.e.x) / 2, y: (w.y + t.e.y) / 2, a: Math.atan2(t.e.y - w.y, t.e.x - w.x), t: 0, o: w }); w.jabT = .14; hit(w, t, JAB.dmg, '#ffd6c8');
        try { sfx('hit', { x: w.x, vol: .25, rate: 1.4 }); } catch (e) {} }
      else { const t = near(w, list, BOLT.range); if (!t) continue; w.autoCd = BOLT.cd; const a = Math.atan2(t.e.y - w.y, t.e.x - w.x), c = (typeof auraOf === 'function' ? auraOf(w) : ['#bff', '#8fd8ff']);
        bolts.push({ o: w, x: w.x + Math.cos(a) * 14, y: w.y + Math.sin(a) * 14, vx: Math.cos(a) * BOLT.speed, vy: Math.sin(a) * BOLT.speed, left: BOLT.range, c, tr: [] });
        try { sfx('ui_deal', { x: w.x, vol: .18, rate: 1.8 }); } catch (e) {} } }
    // bolts in flight
    for (const b of bolts) { if (b.done) continue; const st = Math.hypot(b.vx, b.vy) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.left -= st; b.tr.push([b.x, b.y]); if (b.tr.length > 6) b.tr.shift(); if (Math.random() < .7) try { const cc = b.c || ['#fff', '#8fd8ff']; P({ x: b.x + rnd(-4, 4), y: b.y - 40 * HS + rnd(-4, 4), vx: -b.vx * .08 + rnd(-14, 14), vy: -b.vy * .08 + rnd(-14, 14), color: Math.random() < .4 ? '#ffffff' : cc[Math.random() * 2 | 0], size: rnd(1.2, 2.4), life: rnd(.22, .42), glow: true }); } catch (e) {}
      if (b.left <= 0 || b.x < F.x0 - 20 || b.x > F.x1 + 20 || b.y < F.y0 - 30 || b.y > F.y1 + 20) { b.done = 1; b.fizz = .2; continue; }
      for (const wl of walls) if (wl.o !== b.o && wl.hp > 0 && wallD(wl, b.x, b.y) < 10) { b.done = 1; b.fizz = .2; wl.hp -= BOLT.dmg; wl.flash = .1; break; }   // walls stop it
      if (b.done) continue;
      try { const D = (window.TECH_DEBUG && TECH_DEBUG.domes) || []; for (const dm of D) if (dm.o !== b.o && dm.t < dm.dur && !dm.open && Math.hypot(b.x - dm.x, (b.y - dm.y) * 1.4) < dm.r && !(Math.hypot(b.o.x - dm.x, (b.o.y - dm.y) * 1.4) < dm.r)) { b.done = 1; b.fizz = .2; dm.hp -= BOLT.dmg; dm.hit = .1; break; } } catch (e) {}
      if (b.done) continue;
      for (const t of targets(b.o)) { const r = t.k === 'wiz' ? 18 : 14 * ((t.e.beast && t.e.beast.sz) || 1); if (Math.hypot(t.e.x - b.x, t.e.y - b.y) < r) { b.done = 1; b.pop = .22; hit(b.o, t, BOLT.dmg, '#d8f6ff'); break; } } }
    bolts = bolts.filter(b => !b.done || (b.pop = (b.pop || 0) - dt) > 0 || (b.fizz = (b.fizz || 0) - dt) > 0);
    for (const j of jabs) j.t += dt; jabs = jabs.filter(j => j.t < .18);
    for (const w of ents) if (w && w.jabT > 0) w.jabT -= dt; }
  function draw() { if (!bolts.length && !jabs.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    // (1.0.33.30) the bolt: a spinning four-point star in the caster's aura colours, a tapered comet tail, a soft glow,
    // and twinkles shed along its path (spawned in tick); on impact a star-burst of rays
    const star = (cx, cy, r, rot) => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .38 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); };
    for (const b of bolts) { const y0 = -40 * HS, c = b.c || ['#bff', '#8fd8ff'], bx = b.x, by = b.y + y0;
      if (!b.done) { const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, L = 30, rot = (performance.now() / 1000) * 9 + bx * .05;
        x.globalCompositeOperation = 'lighter';
        const tg = x.createLinearGradient(bx, by, bx - ux * L, by - uy * L); tg.addColorStop(0, c[1]); tg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = tg;
        x.beginPath(); x.moveTo(bx - uy * 5, by + ux * 5); x.lineTo(bx - ux * L, by - uy * L); x.lineTo(bx + uy * 5, by - ux * 5); x.closePath(); x.fill();
        x.globalAlpha = .55; const hg = x.createRadialGradient(bx, by, 1, bx, by, 15); hg.addColorStop(0, c[0]); hg.addColorStop(.5, c[1]); hg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = hg; x.beginPath(); x.arc(bx, by, 15, 0, 7); x.fill(); x.globalAlpha = 1;
        x.globalCompositeOperation = 'source-over'; x.lineJoin = 'round';
        star(bx, by, 8.5, rot); x.fillStyle = '#0b0614'; x.fill(); star(bx, by, 7, rot); x.fillStyle = c[1]; x.fill(); star(bx, by, 4.2, rot + .4); x.fillStyle = '#fff'; x.fill(); }
      else { const pop = b.pop > 0, k = pop ? b.pop / .22 : (b.fizz || 0) / .2, e = 1 - k; x.globalAlpha = Math.max(0, k);
        if (pop) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(bx, by, 0, bx, by, 18 * e + 4); g.addColorStop(0, '#fff'); g.addColorStop(.4, c[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(bx, by, 18 * e + 4, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over';
          x.strokeStyle = '#fff'; x.lineWidth = 2; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + b.x * .1; x.beginPath(); x.moveTo(bx + Math.cos(a) * (5 + 8 * e), by + Math.sin(a) * (5 + 8 * e)); x.lineTo(bx + Math.cos(a) * (9 + 14 * e), by + Math.sin(a) * (9 + 14 * e)); x.stroke(); }
          star(bx, by, 6 * k + 1, e * 3); x.fillStyle = '#fff'; x.fill(); }
        else { x.strokeStyle = c[1]; x.lineWidth = 2; x.beginPath(); x.arc(bx, by, 4 + 6 * e, 0, 7); x.stroke(); }
        x.globalAlpha = 1; } }
    for (const j of jabs) { const k = j.t / .18; x.globalAlpha = 1 - k; x.save(); x.translate(j.x, j.y - 40 * HS); x.rotate(j.a); x.strokeStyle = '#0b0614'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, 10 + 8 * k, -.9, .9); x.stroke(); x.strokeStyle = '#fff4e0'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const a = -.6 + i * .6; x.beginPath(); x.arc(Math.cos(a) * (14 + 10 * k), Math.sin(a) * (14 + 10 * k), 1.8 * (1 - k), 0, 7); x.fill(); } x.restore(); }
    x.restore(); }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { tick(dt || 0); } catch (e) {} return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { draw(); } catch (e) {} return r; }; try { (0, eval)('render = window.render'); } catch (e) {} }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { bolts = []; jabs = []; try { for (const w of ents || []) w.autoCd = .8; } catch (e) {} const r = _sd.apply(this, arguments); try { for (const w of ents || []) w.autoCd = .8; } catch (e) {} return r; }; try { (0, eval)('startDuel = window.startDuel'); } catch (e) {} }
  window.AUTO = { BOLT, JAB, TEMPO, get bolts() { return bolts; }, get jabs() { return jabs; } };
})();
