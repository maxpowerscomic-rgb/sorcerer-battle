/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.22
   1. Freeze guard: if the duel's update throws on frame after frame (the fighters stop while the walk cycle keeps
      playing), the loop logs it once, drops the effects or projectiles with broken positions, puts any caster with
      a broken position back on the field, and as a last resort clears the round's temporary effects.
   2. Draw: a near miss pulls hard enough to really move the enemy caster, and now enemy summons too.
   3. Repel: bursts on the first caster or summon it touches; walls no longer stop it, but each wall it crosses is hit.
   4. Juggernaut: 15% more health (wizard-tech-data.js) and a new upgrade, Adaptation: each repeat hit from the same
      ability deals 15% less (×0.85 per hit, up to 7), for the rest of the round, even after it falls. Seven orbs on
      its chest fill in the colour of the ability it is adapting to.
   ===================================================================== */
(function () {
  'use strict';
  const fin = v => typeof v === 'number' && isFinite(v);
  const ghosted = w => w.ghostT > 0, TX = () => window.TECH_DEBUG || {};
  const addFx = o => { try { TX().addFx(o); } catch (e) {} }, joltHit = (w, e, k) => { try { TX().joltHit(w, e, k); } catch (er) {} };

  /* ---------------- 1. freeze guard ---------------- */
  let bad = 0, healed = 0;
  function heal(e) {
    healed++; try { if (typeof logCrash === 'function') logCrash('freeze-heal', (e && e.message) || 'update failed', '', e && e.stack); } catch (x) {}
    const okPos = o => o && fin(o.x) && fin(o.y);
    try { for (const w of ents || []) if (!okPos(w)) { w.x = (F.x0 + F.x1) / 2; w.y = w.me ? F.y1 - 60 : F.y0 + 60; w.vx = w.vy = 0; } } catch (x) {}
    const lists = ['projs', 'parts', 'texts', 'meteors', 'bolts', 'swarms', 'decoys', 'wells', 'walls', 'zombies', 'firerings', 'totems', 'golems'];
    for (const n of lists) { try { const a = (0, eval)(n); if (Array.isArray(a)) for (let i = a.length - 1; i >= 0; i--) if (!okPos(a[i])) a.splice(i, 1); } catch (x) {} }
    try { const X = window.TECH_DEBUG || {}; for (const n of ['orbs', 'slashes', 'cleaves', 'fx', 'springs', 'domes', 'muds']) { const a = X[n]; if (Array.isArray(a)) for (let i = a.length - 1; i >= 0; i--) if (a[i] && (a[i].x !== undefined || a[i].y !== undefined) && !okPos(a[i])) a.splice(i, 1); } } catch (x) {}
    if (healed >= 2) {   // still failing: clear the round's short-lived effects outright
      for (const n of ['projs', 'meteors', 'bolts', 'firerings']) { try { const a = (0, eval)(n); if (Array.isArray(a)) a.length = 0; } catch (x) {} }
      try { const X = window.TECH_DEBUG || {}; for (const n of ['orbs', 'slashes', 'cleaves', 'fx', 'springs']) if (Array.isArray(X[n])) X[n].length = 0; } catch (x) {}
    }
    if (healed >= 3) { try { if (typeof slow !== 'undefined') slow = 1; } catch (x) {} }
  }
  if (typeof update === 'function') { const _u = update; window.update = update = function () {
      try { const r = _u.apply(this, arguments); bad = 0; return r; }
      catch (e) { if (++bad >= 15) { bad = 0; heal(e); } throw e; } };
    try { (0, eval)('update = window.update'); } catch (e) {} }
  // a new round starts clean
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { bad = 0; healed = 0; return _sd.apply(this, arguments); }; try { (0, eval)('startDuel = window.startDuel'); } catch (e) {} }

  /* ---------------- 2. Draw near misses pull harder, summons too ---------------- */
  const NEAR = 104, CATCH = 28, PULL = 520;   // px; px/s at the catch edge, easing to 0 at NEAR
  if (window.V131) window.V131.off = 1;          // replace the old, gentler tug
  function drawTug(dt) { const X = window.TECH_DEBUG; if (!X) return; const domes = X.domes || [];
    for (const c of X.orbs || []) { if (!c.draw || !c.out || !(c.life > 0)) continue; const w = c.o, f = w && w.foe; if (!f) continue; const big = c.big || 1, lo = CATCH * big, hi = NEAR * big;
      const pull = (e, isCaster) => { const dx = c.x - e.x, dy = c.y - e.y, d = Math.hypot(dx, dy); if (d <= lo || d >= hi) return;
        const k = 1 - (d - lo) / (hi - lo), v = Math.min(PULL * k * dt, Math.max(0, d - lo - 6));
        const nx = clamp(e.x + dx / d * v, F.x0, F.x1), ny = clamp(e.y + dy / d * v, F.y0, F.y1); e.x = nx; e.y = ny;
        if (Math.random() < .4) try { P({ x: e.x + rnd(-10, 10), y: e.y - 40 * HS + rnd(-14, 14), vx: dx / d * 160, vy: dy / d * 160, color: Math.random() < .5 ? '#bfe6ff' : '#6fb8ff', size: rnd(2, 3.5), life: .3, glow: true }); } catch (er) {} };
      if (!f.dead && !(f.ghostT > 0) && !f.svAnchor && !domes.some(d => d.o === f && d.t < d.dur && Math.hypot(f.x - d.x, (f.y - d.y) * 1.4) < d.r)) pull(f, 1);
      try { for (const e of enemyCreatures(w)) if (e.e.x !== undefined && e.k !== 'tm' && e.k !== 'd' && !(e.e.beast && e.e.beast.boss)) pull(e.e, 0); } catch (er) {} } }
  if (typeof update === 'function') { const _u2 = update; window.update = update = function (dt) { const r = _u2.apply(this, arguments); try { if (!ended && !(introT > 0)) drawTug(dt); } catch (e) {} return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }

  /* ---------------- 3. Repel bursts on the first unit, passes walls ---------------- */
  // Runs before the orb update each frame: it detonates live first-pass Repel orbs that touch a caster or summon, and
  // hits each enemy wall once as the orb passes over it. (The orb code itself never stopped at walls.)
  function repelPass1(c) { if (!c.repel || !(c.life > 0) || c.bounced || c.fused) return false; { const w = c.o, f = w.foe, r = 28 * (c.big || 1);
      for (const wl of walls) if (wl.o !== w && wl.hp > 0 && !c.hit.has(wl) && wallD(wl, c.x, c.y) < 18) { c.hit.add(wl); wl.hp -= c.dmg; wl.flash = .15; try { burst(c.x, c.y - 30 * HS, 12, ['#ff8a8a', '#fff', '#ffd0d0'], 170, 3, .4); sfx('hit', { x: c.x, vol: .5 }); } catch (e) {} }
      let hitE = null; if (!f.dead && !ghosted(f) && Math.hypot(f.x - c.x, f.y - c.y) < r) hitE = { e: f, k: 'wiz' };
      if (!hitE) for (const e of enemyCreatures(w)) if (e.e.x !== undefined && Math.hypot(e.e.x - c.x, e.e.y - c.y) < r - 2) { hitE = e; break; }
      if (!hitE) return false;
      c.life = 0; c.hit.add(hitE.e); c.hit.add(f); SRC = 'polarity'; const sp = Math.hypot(c.vx, c.vy) || 1, ux = c.vx / sp, uy = c.vy / sp, R2 = 64;
      addFx({ k: 'implode', x: c.x, y: c.y - 36 * HS, life: .5 }); addFx({ k: 'repel', x: c.x, y: c.y, life: .35, r: 70 }); shake = Math.max(shake, 9);
      try { if (window.repelSparks) repelSparks(c.x, c.y - 36 * HS, 1); sfx('boom', { x: c.x, vol: .6 }); } catch (e) {}
      // the unit it touched takes the full hit and the shove; anything else close by takes half
      if (hitE.k === 'wiz') { damage(f, c.dmg, ux * 560 * c.str, uy * 560 * c.str, '#ffb0b0'); joltHit(w, f, 'wiz'); }
      else { hurtCreature(hitE.e, hitE.k, c.dmg, 'crush'); if (window.bowl) bowl(hitE.e, hitE.k, ux, uy, 320 * c.str); joltHit(w, hitE.e, hitE.k); }
      if (hitE.k !== 'wiz' && !f.dead && !ghosted(f) && Math.hypot(f.x - c.x, f.y - c.y) < R2) { const d = Math.hypot(f.x - c.x, f.y - c.y) || 1; damage(f, c.dmg * .5, (f.x - c.x) / d * 380, (f.y - c.y) / d * 380, '#ffb0b0'); }
      for (const e of enemyCreatures(w)) if (e.e !== hitE.e && e.e.x !== undefined && Math.hypot(e.e.x - c.x, e.e.y - c.y) < R2) { c.hit.add(e.e); const d = Math.hypot(e.e.x - c.x, e.e.y - c.y) || 1; hurtCreature(e.e, e.k, c.dmg * .5, 'crush'); if (window.bowl) bowl(e.e, e.k, (e.e.x - c.x) / d, (e.e.y - c.y) / d, 220); }
      return true; } }
  window.repelDetonate = function (c) { try { return repelPass1(c); } catch (e) { return false; } };

  /* ---------------- 4. Juggernaut: Adaptation ---------------- */
  try { const UP = (0, eval)('UPG'); if (UP && UP.zodiac && !UP.zodiac.some(u => u.id === 'adapt')) UP.zodiac.push({ id: 'adapt', n: 'Adaptation', d: 'Juggernaut: each repeat hit from the same ability deals 15% less (up to 7).' }); } catch (e) {}
  const ADAPT_MAX = 7, ADAPT_MUL = .85;
  const EL_COL = { fire: '#ff5a2a', ice: '#7fdcff', storm: '#ffe14a', arcane: '#c48cff', void: '#9a6aff', earth: '#c9a56a', mud: '#a0784a', swamp: '#8fc24a', nature: '#6fdc5a', life: '#7dffa8', beast: '#d8b26a', blood: '#e0243a', death: '#a6e05a', spirit: '#bff0ff', ki: '#ff8a5a', aegis: '#ffe08a', ward: '#9fb8ff', time: '#ffd45e', beam: '#ff7ad0', chosen: '#ffffff' };
  const colOf = key => { try { const s = SP[key]; if (s && EL_COL[s.el]) return EL_COL[s.el]; } catch (e) {} let h = 0; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h},85%,62%)`; };
  const isJugg = z => z && z.beast && z.beast.boss;
  function adaptBook(owner) { const rd = (typeof M !== 'undefined' && M && M.round) || 0; if (!owner.adapt || owner.adapt.rd !== rd) owner.adapt = { rd, n: {} }; return owner.adapt; }
  if (typeof hurtZ === 'function') { const _hz = hurtZ; window.hurtZ = hurtZ = function (z, d, by, kind) {
      try { if (isJugg(z) && z.hp > 0 && z.o && d > 0 && SRC !== 'auto' && U(z.o, 'zodiac', 'adapt')) {
          const key = (typeof SRC !== 'undefined' && SRC) || kind || 'hit', book = adaptBook(z.o), n = book.n[key] || 0;
          d *= Math.pow(ADAPT_MUL, Math.min(n, ADAPT_MAX)); book.n[key] = n + 1;
          z.adaptShow = { key, n: Math.min(n + 1, ADAPT_MAX), col: colOf(key), t: 0 };   // orbs count the hits: the third Fireball fills three
          if (n === 1) try { text(z.x, z.y - 110 * HS, 'ADAPTING', colOf(key)); } catch (e) {} } } catch (e) {}
      return _hz.call(this, z, d, by, kind); };
    try { (0, eval)('hurtZ = window.hurtZ'); } catch (e) {} }
  // seven orbs across its chest; the filled ones show how far it has adapted to the last ability that hit it
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { if (typeof zombies === 'undefined') return r; const x = ctx; let set = 0;
        for (const z of zombies) { if (!isJugg(z) || !(z.hp > 0) || !(z.rise >= 1) || !z.o || !U(z.o, 'zodiac', 'adapt')) continue;
          if (!set) { x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); set = 1; }
          const s = z.adaptShow, sz = (z.beast.sz || 1.5), cx = z.x, cy = z.y - 34 * HS * sz, gap = 5.6 * sz, rr = 2.3 * sz;
          for (let i = 0; i < ADAPT_MAX; i++) { const ox = cx + (i - 3) * gap, oy = cy + Math.abs(i - 3) * 1.4;
            x.beginPath(); x.arc(ox, oy, rr + 1.3, 0, 7); x.fillStyle = '#000'; x.fill();
            x.beginPath(); x.arc(ox, oy, rr, 0, 7); x.fillStyle = s && i < s.n ? s.col : 'rgba(255,255,255,.18)'; x.fill();
            if (s && i < s.n) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = .35; x.beginPath(); x.arc(ox, oy, rr * 2, 0, 7); x.fill(); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; } } }
        if (set) x.restore(); } catch (e) {}
      return r; }; try { (0, eval)('render = window.render'); } catch (e) {} }

  window.V141 = { heal, drawTug, repelPass1, colOf };
})();
