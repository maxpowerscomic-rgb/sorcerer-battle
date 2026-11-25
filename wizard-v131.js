/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.10
   1. Spell Cannon impact frame: the first time a beam connects (a caster, a summon, a Sanctum, a Boundary or a Titan Shell)
      the screen flashes white for two frames and a white star bursts where it struck. Once per beam: a held beam does not keep flashing.
   2. Draw near miss: an outbound Draw orb that passes close to the enemy caster without catching them tugs them gently toward it.
   3. Every hit on any unit sprays blood drops.
   ===================================================================== */
(function () {
  'use strict';
  const FLASH = .09;   // seconds the impact frame lasts
  let hits = [];       // { x, y, t }

  function connectPoint(c) { const g = c.g; if (!g) return null;
    if (c.bdT === T && c.bdP) return c.bdP;          // a caster or a summon
    if (c.dmT === T && c.dmP) return c.dmP;          // a Sanctum's skin
    if (g.shl && g.shlP) return g.shlP;               // a Titan Shell
    if (g.bnd) return g.E;                             // a Boundary
    return null; }

  /* ---------------- Draw: a near miss tugs the enemy caster toward the orb ---------------- */
  const NEAR = 74, CATCH = 28, PULL = 140;   // px; PULL is px/s at the edge of the catch radius, easing to 0 at NEAR
  function drawTug(dt) { const X = window.TECH_DEBUG; if (!X) return; const domes = X.domes || [];
    for (const c of X.orbs || []) { if (!c.draw || !c.out || !(c.life > 0)) continue; const f = c.o && c.o.foe; if (!f || f.dead || f.ghostT > 0 || f.svAnchor) continue;
      if (domes.some(d => d.o === f && d.t < d.dur && Math.hypot(f.x - d.x, (f.y - d.y) * 1.4) < d.r)) continue;   // anchored in their Sanctum
      const big = c.big || 1, dx = c.x - f.x, dy = c.y - f.y, d = Math.hypot(dx, dy), lo = CATCH * big, hi = NEAR * big; if (d <= lo || d >= hi) continue;
      const k = 1 - (d - lo) / (hi - lo), v = Math.min(PULL * k * k * dt, Math.max(0, d - lo - 8));   /* a tug, never a catch: it stops 8 px short of the catch radius */ f.x = clamp(f.x + dx / d * v, F.x0, F.x1); f.y = clamp(f.y + dy / d * v, F.y0, F.y1);
      if (Math.random() < .35) try { P({ x: f.x + rnd(-10, 10), y: f.y - 40 * HS + rnd(-14, 14), vx: dx / d * 120, vy: dy / d * 120, color: Math.random() < .5 ? '#bfe6ff' : '#6fb8ff', size: rnd(2, 3.5), life: .3, glow: true }); } catch (e) {} } }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof cannons !== 'undefined' && !ended) for (const c of cannons) { if (c._hitFx || !(c.t < c.dur)) continue; const p = connectPoint(c); if (!p) continue;
          c._hitFx = 1; hits.push({ x: p.x, y: p.y - 40 * HS, t: T });
          try { burst(p.x, p.y - 40 * HS, 18, ['#ffffff', '#ffffff', c.o && !c.o.me ? '#ffd0d5' : '#bff6ff'], 260, 4, .35); shake = Math.max(shake, 7); } catch (e) {} } } catch (e) {}
      try { if (!ended && !(introT > 0) && !window.V131.off) drawTug(dt); } catch (e) {}
      hits = hits.filter(h => T - h.t < FLASH && T >= h.t); return r; }; }

  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { if (hits.length) { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
          for (const h of hits) { const u = (T - h.t) / FLASH, a = 1 - u;
            x.globalAlpha = .38 * a; x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);   // the impact frame
            x.globalAlpha = a; x.fillStyle = '#ffffff'; x.strokeStyle = '#000'; x.lineWidth = 2.5; const R = 16 + 26 * u; x.beginPath();
            for (let i = 0; i < 16; i++) { const ang = i * Math.PI / 8, rr = i % 2 ? R * .38 : R; x.lineTo(h.x + Math.cos(ang) * rr, h.y + Math.sin(ang) * rr); }
            x.closePath(); x.fill(); x.stroke(); }
          x.restore(); } } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { hits = []; return _sd.apply(this, arguments); }; }
  /* ---------------- 3. every hit draws blood ----------------
     Any damage to any unit (casters, summons, zombies) sprays a few drops, more for bigger hits.
     Damage over time (a held beam, a burn) drips steadily instead: at most one spray per unit every 0.08 s, carrying what it took since. */
  const BLOOD = ['#ff5a6e', '#c8102e', '#7a0a18'];
  function bleed(u, lost, yOff) { if (!u || !(lost > 0) || u.x === undefined || u.svAnchor || u.isDecoy) return; u._bAcc = (u._bAcc || 0) + lost;
    if (u._bT !== undefined && T - u._bT < .08 && T >= u._bT) return; const amt = u._bAcc; u._bAcc = 0; u._bT = T;
    const n = Math.min(7, 2 + Math.floor(amt / 3)), y = u.y - yOff;
    try { for (let i = 0; i < n; i++) P({ x: u.x + rnd(-6, 6), y: y + rnd(-8, 8), vx: rnd(-90, 90), vy: rnd(-150, -30), color: BLOOD[i % 3], size: rnd(1.8, 3.4), life: rnd(.35, .6), grav: 520, glow: false }); } catch (e) {} }
  // casters: watched frame to frame, since some damage (the Spell Cannon's burn) takes health directly rather than through damage()
  if (typeof update === 'function') { const _ub = update; window.update = update = function () { const r = _ub.apply(this, arguments);
      try { const L = (typeof ents !== 'undefined' && ents) ? ents.slice() : []; try { if (M && M.sv && M.sv.P) L.push(M.sv.P); } catch (e) {}
        for (const w of L) { if (!w) continue; if (w._hpW !== undefined && w.hp < w._hpW && !w.dead && !ended) bleed(w, w._hpW - w.hp, 46 * HS); w._hpW = w.hp; } } catch (e) {}
      return r; }; }
  if (typeof hurtCreature === 'function') { const _hc = hurtCreature; window.hurtCreature = hurtCreature = function (c) { const h0 = c ? c.hp : 0, r = _hc.apply(this, arguments); try { if (c && c.hp < h0) bleed(c, h0 - c.hp, 30 * HS); } catch (e) {} return r; }; }
  if (typeof hurtZ === 'function') { const _hz = hurtZ; window.hurtZ = hurtZ = function (z, d) { const h0 = z ? z.hp : 0, r = _hz.apply(this, arguments); try { if (z && z.hp < h0 && d < 1e5) bleed(z, h0 - Math.max(0, z.hp), 26 * HS); } catch (e) {} return r; }; }
  try { (0, eval)('hurtZ = window.hurtZ'); } catch (e) {}

  window.V131 = { connectPoint, drawTug, off: 0, get hits() { return hits; } };
})();
