/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.30 — Starfire Cannon, a real premium skin
   The Season Pass tier 5 reward used to only tint the Spell Cannon gold. Now, while it is on:
   - a white-hot core flickers down the beam's centre,
   - golden four-point stars stream from the caster along the beam, spinning and twinkling,
   - star motes spill off the beam and drift,
   - where it lands, a starburst blooms.
   And when the pass grants it, the claim tells you where to turn it on (the Spell Cannon's ability page).
   ===================================================================== */
(function () {
  'use strict';
  const isOn = c => { try { return c && c.o && c.o.me && typeof ents !== 'undefined' && c.o === ents[0] && PR.look && PR.look.beamSkin === 'starfire' && (PR.owned || []).includes('beam.starfire'); } catch (e) { return false; } };
  let stars = [];
  function tick(dt) { if (typeof cannons === 'undefined') return;
    for (const c of cannons) { if (!isOn(c) || !(c.t < c.dur)) continue; let g; try { g = beamGeom(c); } catch (e) { continue; } if (!g) continue;
      const dx = g.E.x - g.O.x, dy = g.E.y - g.O.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      if (Math.random() < dt * 22) stars.push({ c, s: 0, v: 220 + Math.random() * 160, off: (Math.random() - .5) * 10, r: 3 + Math.random() * 3.5, rot: Math.random() * 6.283, vr: (Math.random() < .5 ? -1 : 1) * (5 + Math.random() * 6) });
      if (Math.random() < dt * 30) { const k = Math.random(), px = g.O.x + dx * k, py = g.O.y + dy * k; try { P({ x: px + rnd(-6, 6), y: py - 40 * HS + rnd(-6, 6), vx: -uy * rnd(-40, 40) + rnd(-10, 10), vy: ux * rnd(-40, 40) - rnd(10, 40), color: Math.random() < .5 ? '#fff6c8' : '#ffd45e', size: rnd(1.2, 2.6), life: rnd(.3, .6), glow: true }); } catch (e) {} }
      if (Math.random() < dt * 8) try { burst(g.E.x, g.E.y - 40 * HS, 3, ['#ffffff', '#ffe28a', '#ff9a1a'], 120, 2.5, .35); } catch (e) {} }
    for (const st of stars) { st.s += st.v * dt; st.rot += st.vr * dt; }
    stars = stars.filter(st => { try { if (!(st.c.t < st.c.dur)) return false; const g = beamGeom(st.c); return g && st.s < Math.hypot(g.E.x - g.O.x, g.E.y - g.O.y); } catch (e) { return false; } }); }
  function draw() { if (typeof cannons === 'undefined') return; const live = cannons.filter(c => isOn(c) && c.t < c.dur); if (!live.length) return;
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of live) { let g; try { g = beamGeom(c); } catch (e) { continue; } if (!g) continue; const y0 = -40 * HS, f = .75 + Math.sin(performance.now() / 45) * .25;
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,255,240,${.75 * f})`; x.lineCap = 'round'; x.lineWidth = 3.2; x.beginPath(); x.moveTo(g.O.x, g.O.y + y0); x.lineTo(g.E.x, g.E.y + y0); x.stroke();
      const eg = x.createRadialGradient(g.E.x, g.E.y + y0, 0, g.E.x, g.E.y + y0, 26); eg.addColorStop(0, 'rgba(255,250,220,.9)'); eg.addColorStop(.4, 'rgba(255,200,80,.5)'); eg.addColorStop(1, 'rgba(255,150,30,0)'); x.fillStyle = eg; x.beginPath(); x.arc(g.E.x, g.E.y + y0, 26, 0, 7); x.fill();
      x.globalCompositeOperation = 'source-over'; }
    for (const st of stars) { let g; try { g = beamGeom(st.c); } catch (e) { continue; } const dx = g.E.x - g.O.x, dy = g.E.y - g.O.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = g.O.x + ux * st.s - uy * st.off, py = g.O.y + uy * st.s + ux * st.off - 40 * HS, r = st.r;
      x.save(); x.translate(px, py); x.rotate(st.rot); x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .36 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath();
      x.fillStyle = '#3a1a00'; x.lineWidth = 2; x.strokeStyle = '#3a1a00'; x.stroke(); x.fillStyle = Math.sin(st.rot * 2) > .6 ? '#ffffff' : '#ffe28a'; x.fill(); x.restore(); }
    x.restore(); }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { tick(dt || 0); } catch (e) {} return r; }; try { (0, eval)('update = window.update'); } catch (e) {} }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { draw(); } catch (e) {} return r; }; try { (0, eval)('render = window.render'); } catch (e) {} }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { stars = []; return _sd.apply(this, arguments); }; try { (0, eval)('startDuel = window.startDuel'); } catch (e) {} }

  // tell the player where it lives the moment they get it
  const hint = () => { try { if ((PR.owned || []).includes('beam.starfire') && !PR._sfHint) { PR._sfHint = 1; save(); setTimeout(() => { try { toast('Starfire Cannon unlocked: switch it on from the Spell Cannon\'s ability page.'); } catch (e) {} }, 1600); } } catch (e) {} };
  for (const fn of ['passClaim', 'passClaimAll']) { const _f = window[fn]; if (typeof _f === 'function') window[fn] = function () { const r = _f.apply(this, arguments); hint(); return r; }; }
  window.STARFIRE_FX = { get n() { return stars.length; } };
})();
