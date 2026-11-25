/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.14
   1. Zombies and beasts take up room: they push apart instead of stacking, so they spread around a target
      rather than all hitting from one spot. Bigger beasts (the Juggernaut above all) shoulder smaller ones aside.
   2. The Juggernaut's attack reads: it lunges in and a heavy gold swipe sweeps in front of it, with a ground thump.
   3. Spell Cutter against a Spell Cannon: when a Dissection slash with Spell Cutter crosses an enemy beam and the cut lands
      (the same 50% roll), time slows, the beam is cut and dies, and a blade runs the length of it into the caster's face:
      the slash's damage plus a 5-damage blast, and blood. Sparks spray wildly from the cut and the blade, and land as embers.
   ===================================================================== */
(function () {
  'use strict';
  const near = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1; let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L; t = Math.max(0, Math.min(1, t)); const qx = a.x + dx * t, qy = a.y + dy * t; return { d: Math.hypot(p.x - qx, p.y - qy), x: qx, y: qy, t }; };

  /* ---------------- 1. zombies don't stack ---------------- */
  const rad = z => (z.beast ? 11 * (z.beast.sz || 1) * (z.beast.boss ? 1.25 : 1) : 9) * SC;
  function separate() { if (typeof zombies === 'undefined') return; const L = []; for (const z of zombies) if (z && z.hp > 0 && (z.rise === undefined || z.rise >= 1) && !z.svAnchor && isFinite(z.x)) L.push(z);
    const n = L.length; if (n < 2) return;
    for (let i = 0; i < n; i++) { const a = L[i], ra = rad(a); for (let j = i + 1; j < n; j++) { const b = L[j], rb = rad(b), dx = b.x - a.x, dy = (b.y - a.y) * 1.25, R = ra + rb; if (dx > R || dx < -R || dy > R || dy < -R) continue;
        let d = Math.hypot(dx, dy); if (d >= R) continue; let ux, uy; if (d < .01) { const k = Math.random() * 6.283; ux = Math.cos(k); uy = Math.sin(k); d = .01; } else { ux = dx / d; uy = dy / d; }
        const ov = Math.min(R - d, 6) * .5, ma = ra * ra, mb = rb * rb, fa = mb / (ma + mb), fb = ma / (ma + mb);   // the heavier one moves less
        a.x -= ux * ov * fa; a.y -= uy * ov * fa / 1.25; b.x += ux * ov * fb; b.y += uy * ov * fb / 1.25; } }
    for (const z of L) { z.x = Math.max(F.x0, Math.min(F.x1, z.x)); z.y = Math.max(F.y0, Math.min(F.y1, z.y)); } }

  /* ---------------- 2. the Juggernaut's swing ---------------- */
  let swings = [];
  function jugTick() { if (typeof zombies === 'undefined') return; for (const z of zombies) { if (!z.beast || !z.beast.boss || z.hp <= 0) continue;
      if (z.lunge > .16 && !(z._swT > T - .3)) { z._swT = T; const f = z.o && z.o.foe; let tx = f ? f.x : z.x + 30, ty = f ? f.y : z.y;
        try { if (M && M.sv && M.sv.P && !M.sv.P.dead && z.o === ents[1] && Math.hypot(M.sv.P.x - z.x, M.sv.P.y - z.y) < Math.hypot(tx - z.x, ty - z.y)) { tx = M.sv.P.x; ty = M.sv.P.y; } } catch (e) {}
        const a = Math.atan2(ty - z.y, tx - z.x); swings.push({ z, a, t: 0, sz: z.beast.sz || 1.6 });
        try { shake = Math.max(shake, 6); const ix = z.x + Math.cos(a) * 30 * SC, iy = z.y + Math.sin(a) * 18 * SC; burst(ix, iy - 6, 10, ['#e8d8b0', '#b89a6a', '#fff'], 150, 3.5, .4); inkRing(ix, iy, '#ffe08a', 2.5, 8, 40, .35); } catch (e) {} } } }
  // the lunge itself is bigger: the body throws forward into the swing
  if (typeof drawZombie === 'function') { const _dz = drawZombie; window.drawZombie = drawZombie = function (z) { if (z && z.beast && z.beast.boss && z.lunge > 0 && z.hp > 0) { const s = swings.find(q => q.z === z); const a = s ? s.a : 0, k = Math.sin(z.lunge / .2 * Math.PI) * 12 * SC, x0 = z.x, y0 = z.y; z.x += Math.cos(a) * k; z.y += Math.sin(a) * k * .6; try { return _dz.apply(this, arguments); } finally { z.x = x0; z.y = y0; } } return _dz.apply(this, arguments); }; try { (0, eval)('drawZombie = window.drawZombie'); } catch (e) {} }
  function drawSwings(x) { for (const s of swings) { const z = s.z, u = s.t / .26; if (u >= 1) continue; const R = 34 * s.sz * SC, cy = z.y - 26 * s.sz * SC, a0 = s.a - 1.3 + u * 2.2, a1 = a0 + 1.2 * (1 - u * .4), al = 1 - u;
      x.save(); x.translate(z.x, cy); x.scale(1, .72); x.lineCap = 'round';
      x.globalAlpha = al; x.strokeStyle = '#000'; x.lineWidth = 15; x.beginPath(); x.arc(0, 0, R, a0, a1); x.stroke();
      x.strokeStyle = '#ffd45e'; x.lineWidth = 10; x.beginPath(); x.arc(0, 0, R, a0, a1); x.stroke();
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#fff7d0'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R + 1, a0 + .2, a1); x.stroke(); x.restore(); } }

  /* ---------------- 3. Spell Cutter slices a Spell Cannon ---------------- */
  let slices = [], sparks = [], embers = [];
  // sparks fly from the cut in every direction, fall, and leave embers on the floor where they land
  function spray(x, y, h, n, pow) { for (let i = 0; i < n; i++) { if (sparks.length > 320) sparks.shift(); const a = Math.random() * 6.283, sp = (60 + Math.random() * 260) * pow;
      sparks.push({ x, y, h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .55, vh: 40 + Math.random() * 230 * pow, hot: Math.random() < .35 }); } }
  function sparkTick(dt) { for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vh -= 620 * dt; p.h += p.vh * dt; p.vx *= .985; p.vy *= .985;
      if (p.h <= 0) { p.dead = 1; if (embers.length > 160) embers.shift(); embers.push({ x: p.x, y: p.y, t: 0, life: 1.6 + Math.random() * 1.6, r: .9 + Math.random() * 1.5, s: Math.random() * 9 }); } }
    sparks = sparks.filter(p => !p.dead && p.x > F.x0 - 60 && p.x < F.x1 + 60); for (const e of embers) e.t += dt; embers = embers.filter(e => e.t < e.life); }
  function drawSparks(x) { if (!sparks.length && !embers.length) return; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (const e of embers) { const f = 1 - e.t / e.life, fl = .6 + .4 * Math.sin(T * 14 + e.s); x.globalAlpha = f * fl; x.fillStyle = f > .5 ? '#ffd27a' : '#ff6a2a'; x.beginPath(); x.arc(e.x, e.y, e.r * (1 + f * .6), 0, 7); x.fill(); x.globalAlpha = f * .25; x.fillStyle = '#ff7a2a'; x.beginPath(); x.arc(e.x, e.y, e.r * 3.2, 0, 7); x.fill(); }
    x.globalAlpha = 1; for (const p of sparks) { const sy = p.y - p.h * HS; x.strokeStyle = p.hot ? '#ffffff' : '#ffd45e'; x.lineWidth = p.hot ? 2.2 : 1.6; x.beginPath(); x.moveTo(p.x, sy); x.lineTo(p.x - p.vx * .022, sy + (p.vh * .022 - p.vy * .022) * HS); x.stroke(); }
    x.restore(); }
  function cutterTick() { const X = window.TECH_DEBUG; if (!X || typeof cannons === 'undefined' || ended) return;
    for (const s of X.slashes || []) { if (!s.cut || !(s.life > 0)) continue; s._bt = s._bt || new Set();
      for (const c of cannons) { if (c.o === s.o || !c.g || !(c.t < c.dur) || s._bt.has(c) || slices.some(q => q.c === c)) continue; const E = c.g.E, O = c.g.O, q = near(s, O, E); if (q.d > (c.wide ? 30 : 20) + 24) continue;   /* the beam's own width plus the blade: a slash thrown at a firing caster runs alongside the beam it overlaps */
        s._bt.add(c); if (Math.random() >= .5) continue;   // the same 50% as any other Spell Cutter cut
        const victim = c.o, from = { x: q.x, y: q.y }, path = { O: { x: O.x, y: O.y }, E: { x: E.x, y: E.y } };
        c.t = c.dur;   // the beam is cut: it dies here
        slices.push({ c, s, victim, from, path, t: 0, dur: .42, hit: 0, dmg: s.dmg || 10, mine: !!(s.o && s.o.me) }); spray(from.x, from.y, 40, 60, 1.2);
        try { if (SET().slowmo) { slow = .18; setTimeout(() => { if (!ended && slow < .3) slow = 1; }, 750); } shake = Math.max(shake, 8); text(from.x, from.y - 70 * HS, 'BEAM SLICED!', '#ffe08a', true); sfx('hit', { x: from.x, rate: .6 }); burst(from.x, from.y - 40 * HS, 22, ['#ffffff', '#ffd6d2', '#4fe3ff'], 240, 4, .5); } catch (e) {} } } }
  function sliceTick(dt) { for (const k of slices) { k.t += dt; const v = k.victim;
      if (k.t < k.dur && v) { const u = Math.min(1, k.t / k.dur), bx = k.from.x + (v.x - k.from.x) * u, by = k.from.y + (v.y - k.from.y) * u; k.acc = (k.acc || 0) + dt * 150; const n = Math.floor(k.acc); if (n) { k.acc -= n; spray(bx, by, 40, n, 1); } }   /* about 60 sparks along the run, by game time, so slow motion doesn't flood them */ if (k.hit || k.t < k.dur || !v) continue; k.hit = 1;
      if (!v.dead && !ended) { const s0 = SRC; SRC = 'dissect';
        try { damage(v, k.dmg, 0, 0, '#ff3b4a'); } catch (e) {}
        try { if (!v.dead) damage(v, 5, 0, 0, '#ffb347'); } catch (e) {} SRC = s0;
        try { const bx = v.x, by = v.y - 46 * HS; burst(bx, by, 34, ['#ffffff', '#ffd45e', '#ff7a2a', '#ff3b4a'], 320, 6, .7); inkRing(v.x, v.y, '#ffb347', 3, 10, 70, .45); shake = Math.max(shake, 16); text(v.x, v.y - 104 * HS, 'BLOWN BACK!', '#ffb347', true); sfx('ko', { x: v.x, vol: .5 });
          if (window.BLOOD_DEBUG && BLOOD_DEBUG.splat) BLOOD_DEBUG.splat(v, v.x, v.y + 4, 5); spray(v.x, v.y, 46, 45, 1.1);
          const a = Math.atan2(v.y - k.from.y, v.x - k.from.x); v.vx = (v.vx || 0) + Math.cos(a) * 260; v.vy = (v.vy || 0) + Math.sin(a) * 160; } catch (e) {} } }
    slices = slices.filter(k => k.t < k.dur + .5); }
  function drawSlices(x) { for (const k of slices) { const v = k.victim, u = Math.min(1, k.t / k.dur), tx = v ? v.x : k.path.O.x, ty = v ? v.y : k.path.O.y, bx = k.from.x + (tx - k.from.x) * u, by = k.from.y + (ty - k.from.y) * u, H = 40 * HS, fade = k.t > k.dur ? Math.max(0, 1 - (k.t - k.dur) / .5) : 1;
      const col = k.mine ? '#ff7a86' : '#4fe3ff';   // the colour of the beam that was cut (it belonged to the other side)
      x.save(); x.lineCap = 'round';
      // the dead beam, split in two along its length, peeling apart
      const ang = Math.atan2(k.path.E.y - k.path.O.y, k.path.E.x - k.path.O.x), nx = -Math.sin(ang), ny = Math.cos(ang), gap = 3 + u * 9;
      x.globalAlpha = .7 * fade; for (const sg of [-1, 1]) { x.strokeStyle = col; x.lineWidth = 5 * (1 - u * .6); x.beginPath(); x.moveTo(k.path.O.x + nx * gap * sg, k.path.O.y - H + ny * gap * sg); x.lineTo(k.path.E.x + nx * gap * sg, k.path.E.y - H + ny * gap * sg); x.stroke(); }
      // the cut: a white line from where the slash struck to the blade
      x.globalAlpha = fade; x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(k.from.x, k.from.y - H); x.lineTo(bx, by - H); x.stroke(); x.globalCompositeOperation = 'source-over';
      // the blade: a red-white crescent spinning up the beam
      if (k.t < k.dur) { x.translate(bx, by - H); x.rotate(T * 40); x.strokeStyle = '#000'; x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 15, -1.2, 1.2); x.stroke(); x.strokeStyle = '#ff3b4a'; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 15, -1.2, 1.2); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 2.2; x.beginPath(); x.arc(0, 0, 16, -1, 1); x.stroke(); }
      x.restore(); } }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { separate(); } catch (e) {} try { jugTick(); swings.forEach(s => s.t += dt); swings = swings.filter(s => s.t < .3); } catch (e) {} try { cutterTick(); sliceTick(dt); sparkTick(dt); } catch (e) {}
      return r; }; }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { if ((swings.length || slices.length || sparks.length || embers.length) && typeof ctx !== 'undefined') { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); drawSparks(x); drawSwings(x); drawSlices(x); x.restore(); } } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { swings = []; slices = []; sparks = []; embers = []; return _sd.apply(this, arguments); }; }
  window.V134 = { separate, spray, get slices() { return slices; }, get swings() { return swings; }, get sparks() { return sparks; }, get embers() { return embers; } };
})();
