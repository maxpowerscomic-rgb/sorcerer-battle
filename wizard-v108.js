/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.8
   A fighter hit by fire catches: small flames cling to the body and go out one by one.
   (The battle report changes for 1.0.8 live in wizard-v106.js.)
   ===================================================================== */
(function () {
  'use strict';
  const BURN = 2.4, N = 8;
  if (typeof damage === 'function') { const _d = damage;
    window.damage = damage = function (t) { const h0 = t ? t.hp : 0, r = _d.apply(this, arguments);
      try { if (t && h0 > t.hp && t.lastCat === 'fire') { t.fireT = BURN; const a = t.foe; t.fireBlue = !!(a && a.book && a.book.includes('bluefire') && (a.blueT > T - 4 || SRC === 'bluefire')); } } catch (e) {}
      return r; }; }
  if (typeof update === 'function') { const _u = update;
    window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents) for (const w of ents) { if (w.burn > 0) w.fireT = Math.max(w.fireT || 0, .9); if (!(w.fireT > 0)) continue; w.fireT -= dt; if (w.dead) { w.fireT = 0; continue; }
          if (Math.random() < dt * 10 * Math.min(1, w.fireT / 1.2)) P({ x: w.x + rnd(-13, 13), y: w.y - rnd(8, 62) * HS, vx: rnd(-14, 14), vy: -rnd(40, 100), color: w.fireBlue ? (Math.random() < .5 ? '#5ab8ff' : '#e6f6ff') : (Math.random() < .5 ? '#ffb347' : '#fff3b0'), size: rnd(1.4, 2.6), life: rnd(.3, .6) }); } } catch (e) {}
      return r; }; }
  if (typeof render === 'function') { const _r = render;
    window.render = render = function () { const r = _r.apply(this, arguments);
      try { if (typeof ents === 'undefined' || !ents || !ents.length) return r; const x = ctx; let any = false; for (const w of ents) if (w.fireT > 0 && !w.dead) { any = true; break; } if (!any) return r;
        x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const w of ents) { if (!(w.fireT > 0) || w.dead || w.ghostT > 0) continue; const n = Math.max(1, Math.ceil(N * Math.min(1, w.fireT / (BURN * .75))));
          for (let i = 0; i < n; i++) { const sx = Math.sin(i * 12.9898 + 1.3) * 43758.5453, rx = sx - Math.floor(sx), sy = Math.sin(i * 78.233 + 2.1) * 12543.123, ry = sy - Math.floor(sy);
            const px = w.x + (rx - .5) * 30 * SC, py = w.y - (10 + ry * 54) * HS, fl = .75 + .25 * Math.sin(T * 17 + i * 2.7), life = Math.min(1, (w.fireT - (i / N) * BURN * .7) * 3 + .35), h = (9 + (i % 3) * 3.5) * SC * fl * Math.max(.3, Math.min(1, life)), wd = (3.4 + (i % 2)) * SC, sw = Math.sin(T * 11 + i) * 1.6;
            const flame = (s, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(px - wd * s, py); x.quadraticCurveTo(px - wd * 1.3 * s, py - h * .5 * s, px + sw, py - h * s); x.quadraticCurveTo(px + wd * 1.3 * s, py - h * .5 * s, px + wd * s, py); x.quadraticCurveTo(px, py + wd * .7 * s, px - wd * s, py); x.fill(); };
            x.globalCompositeOperation = 'source-over'; flame(1.25, w.fireBlue ? 'rgba(0,14,60,.55)' : 'rgba(60,10,0,.55)'); x.globalCompositeOperation = 'lighter'; if (w.fireBlue) { flame(1, '#1f6fff'); flame(.66, '#5ab8ff'); flame(.34, '#e6f6ff'); } else { flame(1, '#ff5a1f'); flame(.66, '#ffb347'); flame(.34, '#fff3b0'); } } }
        x.restore(); } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _s = startDuel; window.startDuel = startDuel = function () { const r = _s.apply(this, arguments); try { ents.forEach(w => { w.fireT = 0; }); } catch (e) {} return r; }; }
})();
