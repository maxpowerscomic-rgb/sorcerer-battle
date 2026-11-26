/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.27
   1. Overtime: in the deciding round (both one win from the match), if time runs out with both standing, the round
      goes on for 15 more seconds and every hit on either fighter deals double damage. Then the usual health check.
      Not in Survival, the training yard or the tutorial.
   2. Sanctum: while its caster stands inside their own Sanctum, twice any health they lose is dealt to the Sanctum,
      so beating on a sorcerer inside their domain can make it collapse.
   3. Zodiac: the Pig is a damage sponge (more health, takes 25% less, hits softer); the Rooster runs wide loops;
      the Monkey hops from point to point.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const live = () => typeof M !== 'undefined' && M && !M.sv && !M.practice && !M.tut && !(window.YARD && YARD.on) && !window.ONB_ACTIVE;

  /* ---------------- 1. Overtime ---------------- */
  const OT = 15;
  const decider = () => { try { return M.score.me === WIN - 1 && M.score.foe === WIN - 1; } catch (e) { return false; } };
  function otBanner() { try { text(W / 2, H / 2 - 30, 'OVERTIME!', '#ffd45e', true); setTimeout(() => { try { text(W / 2, H / 2 + 10, 'DOUBLE DAMAGE', '#ff8a96', true); } catch (e) {} }, 350);
      shake = Math.max(shake, 10); if (typeof flashScreen === 'function') flashScreen(); sfx('ui_unlock', { vol: .9 }); sfx('boom', { vol: .7 }); } catch (e) {} }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) {
      try { if (live() && !ended && !(introT > 0) && !M.otOn && decider() && clock - (dt || 0) <= 0 && ents && !ents[0].dead && !ents[1].dead) {
          M.otOn = 1; clock = OT + (dt || 0); otBanner(); const tm = $('timer'); if (tm) tm.classList.add('ot'); } } catch (e) {}
      return _u.apply(this, arguments); }; try { (0, eval)('update = window.update'); } catch (e) {} }
  if (typeof damage === 'function') { const _d = damage; window.damage = damage = function (w, d) {
      try { if (M && M.otOn && !ended && w && ents && (w === ents[0] || w === ents[1]) && d > 0) arguments[1] = d * 2; } catch (e) {}
      return _d.apply(this, arguments); }; try { (0, eval)('damage = window.damage'); } catch (e) {} }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { try { if (M) M.otOn = 0; const tm = $('timer'); if (tm) tm.classList.remove('ot'); } catch (e) {} return _sd.apply(this, arguments); }; try { (0, eval)('startDuel = window.startDuel'); } catch (e) {} }

  /* ---------------- 2. Sanctum takes what its caster takes inside it ---------------- */
  const inside = (d, e) => d.open || Math.hypot(e.x - d.x, (e.y - d.y) * 1.4) < d.r;
  if (typeof damage === 'function') { const _d2 = damage; window.damage = damage = function (w) {
      const h0 = w && typeof w.hp === 'number' ? w.hp : null; const r = _d2.apply(this, arguments);
      try { if (h0 !== null && w.hp < h0 && ents && (w === ents[0] || w === ents[1])) { const D = (window.TECH_DEBUG && TECH_DEBUG.domes) || [];
          for (const dm of D) if (dm.o === w && dm.t < dm.dur && !dm.left && dm.hp > 0 && inside(dm, w)) { dm.hp -= (h0 - w.hp) * 2; dm.hit = .15; if (Math.random() < .5) try { inkRing(w.x, w.y, '#bcd2ff', 1, 6, 26, .3); } catch (e) {} } } } catch (e) {}
      return r; }; try { (0, eval)('damage = window.damage'); } catch (e) {} }

  /* ---------------- 3. Zodiac: Pig, Rooster, Monkey ---------------- */
  try { const Z = (0, eval)('ZODIAC'), by = id => Z.find(b => b.id === id && !b.crim);
    const pig = by('pig'); if (pig) Object.assign(pig, { hp: 3.4, dmg: .55, sponge: .75, q: 'A damage sponge: lots of health, and it shrugs off a quarter of every hit' });
    const roo = by('rooster'); if (roo) Object.assign(roo, { path: 'loops', q: 'Runs in wide loops. Its crow dazes' });
    const mon = by('monkey'); if (mon) Object.assign(mon, { path: 'hop', q: 'Hops from point to point. Steals cast time' }); } catch (e) {}
  // the Pig shrugs off a quarter of every hit
  if (typeof hurtZ === 'function') { const _hz = hurtZ; window.hurtZ = hurtZ = function (z, d) { try { if (z && z.beast && z.beast.sponge && d > 0 && d < 1e4) arguments[1] = d * z.beast.sponge; } catch (e) {} return _hz.apply(this, arguments); }; try { (0, eval)('hurtZ = window.hurtZ'); } catch (e) {} }
  // movement: wide loops and hops replace the normal walk for these two
  const mover = z => z && z.beast && !z.beast.crim && (z.beast.path === 'loops' || z.beast.path === 'hop') && z.hp > 0 && z.rise >= 1;
  let prev = new Map();
  if (typeof update === 'function') { const _u2 = update; window.update = update = function (dt) {
      try { prev = new Map(); if (typeof zombies !== 'undefined') for (const z of zombies) if (mover(z)) prev.set(z, { x: z.x, y: z.y }); } catch (e) {}
      const r = _u2.apply(this, arguments);
      try { if (!ended && dt > 0) for (const [z, p] of prev) { if (!mover(z) || z.frozen > 0 || z.stun > 0) continue; const moved = Math.hypot(z.x - p.x, z.y - p.y); if (moved < .01) continue;   // attacking or held: leave it
          const ux = (z.x - p.x) / moved, uy = (z.y - p.y) / moved, sp = moved / dt;
          if (z.beast.path === 'loops') { z.lp = (z.lp || Math.random() * 6) + dt * 4.2; const R = 120; const q = inArena(p.x + (ux * sp * .7 + Math.cos(z.lp) * R) * dt, p.y + (uy * sp * .7 + Math.sin(z.lp) * R * .75) * dt); z.x = q.x; z.y = q.y; z.face = Math.cos(z.lp) < 0 ? -1 : 1; }
          else { const H = z.hopS; if (!H || H.done) { if ((z.hopWait = (z.hopWait || 0) - dt) > 0) { z.x = p.x; z.y = p.y; continue; }
              const len = 62, side = (Math.random() - .5) * 40, tx = p.x + ux * len - uy * side, ty = p.y + uy * len + ux * side, q = inArena(tx, ty); z.hopS = { x0: p.x, y0: p.y, x1: q.x, y1: q.y, t: 0, dur: .34 }; z.face = q.x < p.x ? -1 : 1; }
            const h = z.hopS; h.t += dt; const k = Math.min(1, h.t / h.dur); z.x = h.x0 + (h.x1 - h.x0) * k; z.y = h.y0 + (h.y1 - h.y0) * k; z.hopZ = Math.sin(k * Math.PI) * 26;
            if (k >= 1) { h.done = 1; z.hopZ = 0; z.hopWait = .22; try { burst(z.x, z.y, 4, ['#8a7a5a', '#c9b08a'], 60, 2.5, .3); } catch (e) {} } } } } catch (e) {}
      return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }
  // the hop's height: lift the Monkey while it is drawn, then put it back
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const lifted = [];
      try { if (typeof zombies !== 'undefined') for (const z of zombies) if (z.hopZ > 0) { lifted.push([z, z.hopZ]); z.y -= z.hopZ * HS; } } catch (e) {}
      try { return _r.apply(this, arguments); } finally { for (const [z, h] of lifted) z.y += h * HS; } }; try { (0, eval)('render = window.render'); } catch (e) {} }

  /* ---------------- 4. idle: after 15 s without a touch, decorative loops pause (battles excepted) ---------------- */
  // Every looping CSS animation (breathing cards, pulsing dots, spinners) keeps the phone's graphics chip drawing every frame,
  // so a still screen never idles. They pause after 15 s untouched and resume on the next touch; the hero preview slows too.
  let lastTouch = performance.now();
  const wake = () => { lastTouch = performance.now(); if (document.body.classList.contains('idle')) document.body.classList.remove('idle'); window.__idle = 0; };
  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, wake, { capture: true, passive: true }));
  // (1.0.33.32) Only endless decorative loops pause, never an entrance (a sheet sliding up, a reward popping in): the old blanket
  // CSS pause froze sheets off-screen whenever one opened without a fresh touch, e.g. right after a battle played hands-free.
  // A screen, sheet or popup opening also counts as activity (not #battle: the training yard flips it every frame).
  const looping = () => document.getAnimations().filter(a => { try { const t = a.effect && a.effect.target; return a.effect.getTiming().iterations === Infinity && t && !t.closest('#battle'); } catch (e) { return false; } });
  let held = [];
  const pauseLoops = () => { for (const a of looping()) if (a.playState === 'running') { a.pause(); held.push(a); } };
  const playLoops = () => { for (const a of held) try { a.play(); } catch (e) {} held = []; };
  const wake0 = wake; window.__wake = () => { wake0(); playLoops(); };
  ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, playLoops, { capture: true, passive: true }));
  try { const mo = new MutationObserver(() => window.__wake()); const watch = () => { document.querySelectorAll('.screen:not(#battle), #sheet, #lvup, #upm, #chestOv, #rep, #pause').forEach(e => mo.observe(e, { attributes: true, attributeFilter: ['class'] })); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch(); } catch (e) {}
  setInterval(() => { try { const inBattle = !!document.querySelector('.screen.on#battle');
      if (inBattle) lastTouch = performance.now();   // leaving a battle starts the idle clock fresh
      const idle = performance.now() - lastTouch > 15000; document.body.classList.toggle('idle', idle); window.__idle = idle ? 1 : 0;
      if (idle) pauseLoops(); } catch (e) {} }, 1000);

  const css = document.createElement('style');
  css.textContent = `#timer.ot{color:#ff8a96!important;text-shadow:0 0 10px #ff4a5a;animation:otPulse .6s ease-in-out infinite}@keyframes otPulse{50%{transform:scale(1.12)}}`;
  document.head.appendChild(css);
  window.V144 = { decider };
})();
