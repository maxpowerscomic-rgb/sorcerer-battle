/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.22  (playtest batch B: new cosmetics)
   Eight trails, seven aura styles, streak rewards at 30 / 40 / 50. (Animated emblems are in wizard-look.js
   and wizard-data.js; the ten new Ladder rivals are in wizard-ladder.js.)
   ===================================================================== */
(function () {
  'use strict';
  const rgb = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; };

  /* ---------------- trails ---------------- */
  // each: every `step` px walked, drop `n` particles made by mk(w)
  const TR = {
    frostbite: { n: 'Frostbite', r: 'rare', u: { type: 'gems', v: 90 }, step: 5, cols: ['#ffffff', '#bfe9ff', '#7fd0ff'], mk: w => ({ x: w.x + rnd(-9, 9), y: w.y + rnd(-2, 5), vx: rnd(-6, 6), vy: -rnd(4, 16), size: rnd(2.6, 4.6), life: rnd(.7, 1.2), glow: false, drag: .9 }) },
    leaves: { n: 'Falling Leaves', r: 'rare', u: { type: 'gems', v: 90 }, step: 7, cols: ['#e08a2a', '#c9521a', '#e0c04a', '#7a9a2a'], mk: w => ({ x: w.x + rnd(-12, 12), y: w.y - rnd(20, 60) * HS, vx: rnd(-34, 34), vy: rnd(18, 46), size: rnd(2.6, 4.2), life: rnd(.8, 1.3), glow: false, grav: 26 }) },
    bubbles: { n: 'Bubbles', r: 'rare', u: { type: 'gems', v: 110 }, step: 7, cols: ['#bff5ff', '#7fe0ff', '#ffffff'], mk: w => ({ x: w.x + rnd(-10, 10), y: w.y - rnd(0, 20) * HS, vx: rnd(-12, 12), vy: -rnd(26, 60), size: rnd(3, 6.5), life: rnd(.7, 1.2), glow: false, grav: -30, fade: .45 }) },
    voltage: { n: 'Voltage', r: 'epic', u: { type: 'gems', v: 160 }, step: 5, n2: 3, cols: ['#fff7b0', '#9fd8ff', '#ffffff'], mk: w => ({ x: w.x + rnd(-10, 10), y: w.y - rnd(0, 46) * HS, vx: rnd(-150, 150), vy: rnd(-150, 60), size: rnd(1.2, 2.2), life: rnd(.1, .22) }) },
    inkblots: { n: 'Ink Blots', r: 'epic', u: { type: 'gems', v: 160 }, step: 9, cols: ['#0b0816', '#1a1236', '#2b2050'], mk: w => ({ x: w.x + rnd(-8, 8), y: w.y + rnd(-1, 6), vx: rnd(-5, 5), vy: rnd(-3, 3), size: rnd(5, 10), life: rnd(1.2, 1.9), glow: false, shrink: false, grow: 1.25, fade: .5, drag: .8 }) },
    coins: { n: 'Coin Shower', r: 'epic', u: { type: 'gems', v: 200 }, step: 8, cols: ['#ffd45e', '#f0a830', '#fff3b0'], mk: w => ({ x: w.x + rnd(-8, 8), y: w.y - rnd(10, 30) * HS, vx: rnd(-60, 60), vy: -rnd(90, 170), size: rnd(2.4, 3.6), life: rnd(.5, .8), grav: 520 }) },
    wisps: { n: 'Grave Wisps', r: 'legendary', u: { type: 'gems', v: 260 }, step: 6, cols: ['#9fffd0', '#3fd0a0', '#e6fff4'], mk: w => ({ x: w.x + rnd(-12, 12), y: w.y - rnd(0, 50) * HS, vx: rnd(-22, 22), vy: -rnd(20, 50), size: rnd(2.4, 4.6), life: rnd(.8, 1.4), grav: -18, drag: .96 }) },
    prism: { n: 'Prism', r: 'legendary', u: { type: 'streak', v: 30 }, step: 3, cols: null, mk: w => ({ x: w.x + rnd(-6, 6), y: w.y - rnd(0, 56) * HS, vx: rnd(-10, 10), vy: rnd(-12, 12), size: rnd(2.6, 4.4), life: rnd(.5, .9), color: `hsl(${(T * 300 + rnd(0, 40)) % 360 | 0},100%,62%)` }) },
  };
  try { for (const id in TR) if (!COSMETICS.trail.some(t => t.id === id)) COSMETICS.trail.push({ id, n: TR[id].n, r: TR[id].r, unlock: TR[id].u }); } catch (e) {}
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && !ended) for (const w of ents) { const t = TR[w.trail]; if (!t || w.dead) continue; const mv = Math.hypot(w.x - (w._t2x === undefined ? w.x : w._t2x), w.y - (w._t2y === undefined ? w.y : w._t2y)); w._t2x = w.x; w._t2y = w.y; if (mv > 60) continue; w._t2a = (w._t2a || 0) + mv;
          if (w._t2a > t.step) { w._t2a = 0; for (let i = 0; i < (t.n2 || 1); i++) { const p = t.mk(w); if (!p.color) p.color = t.cols[Math.random() * t.cols.length | 0]; P(p); } } } } catch (e) {}
      return r; }; }
  // wardrobe tiles for the new trails: a spray of their own colours
  if (typeof renderWardrobe === 'function') { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'trail') { const items = catItems('trail'); document.querySelectorAll('#items canvas').forEach(c => { const it = items[+c.dataset.i], t = it && TR[it.id]; if (!t) return; const g = c.getContext('2d'), W = c.width, H = c.height; g.setTransform(1, 0, 0, 1, 0, 0);
            const bg = g.createRadialGradient(W / 2, H * .45, 4, W / 2, H / 2, W * .6); bg.addColorStop(0, '#3a2d66'); bg.addColorStop(1, '#150f27'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
            for (let i = 0; i < 16; i++) { const sx = Math.sin(i * 12.9898) * 43758.5453, rx = sx - Math.floor(sx), sy = Math.sin(i * 78.233) * 12543.123, ry = sy - Math.floor(sy), col = t.cols ? t.cols[i % t.cols.length] : `hsl(${i * 23},100%,62%)`;
              g.globalAlpha = .45 + rx * .55; g.fillStyle = col; g.strokeStyle = '#000'; g.lineWidth = W / 110; g.beginPath(); g.arc(W * (.14 + rx * .72), H * (.2 + ry * .6), W * (.03 + ((i * 7) % 5) * .012) * (it.id === 'inkblots' ? 1.7 : 1), 0, 7); g.fill(); if (it.id === 'bubbles' || it.id === 'coins') g.stroke(); } g.globalAlpha = 1; }); } } catch (e) {}
      return r; }; }

  /* ---------------- aura styles ---------------- */
  const AS = window.AURA_STYLES || (window.AURA_STYLES = {});
  // crackling arcs leaping around the body
  AS.arcs = function (x, w, inten, l, m) { const L = rgb(l), t = T; x.save(); x.translate(w.x, w.y - 40 * HS); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < 5; i++) { const seed = Math.floor(t * 9 + i * 3.7), rr = k => { const s = Math.sin((seed + k) * 91.7) * 43758.5; return s - Math.floor(s); }, a0 = rr(1) * 6.283, a1 = a0 + 1 + rr(2) * 1.6, R = 30 * SC;
      x.beginPath(); for (let j = 0; j <= 5; j++) { const u = j / 5, a = a0 + (a1 - a0) * u, r0 = R * (.8 + rr(10 + j) * .5); x.lineTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.5); }
      x.strokeStyle = `rgba(${L},${.5 * inten})`; x.lineWidth = 5; x.stroke(); x.strokeStyle = `rgba(255,255,255,${.95 * inten})`; x.lineWidth = 1.6; x.stroke(); }
    x.restore(); };
  // small moons circling on tilted rings
  AS.orbit = function (x, w, inten, l, m) { const L = rgb(l), Mc = rgb(m), t = T; x.save(); x.translate(w.x, w.y - 40 * HS);
    for (const [tilt, sp, R, sz, col] of [[.35, 1.3, 34, 4.5, L], [-.5, -.9, 42, 3.4, Mc], [.9, 1.9, 27, 2.6, '255,255,255']]) { x.save(); x.rotate(tilt); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(${col},${.3 * inten})`; x.lineWidth = 1.2; x.beginPath(); x.ellipse(0, 0, R * SC, R * SC * .32, 0, 0, 7); x.stroke();
      const a = t * sp, px = Math.cos(a) * R * SC, py = Math.sin(a) * R * SC * .32; for (let q = 1; q <= 5; q++) { const a2 = a - q * .12 * Math.sign(sp); x.fillStyle = `rgba(${col},${(.5 - q * .09) * inten})`; x.beginPath(); x.arc(Math.cos(a2) * R * SC, Math.sin(a2) * R * SC * .32, sz * SC * (1 - q * .12), 0, 7); x.fill(); }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = Math.min(1, inten); x.fillStyle = `rgb(${col})`; x.strokeStyle = '#07020d'; x.lineWidth = 1.4; x.beginPath(); x.arc(px, py, sz * SC, 0, 7); x.fill(); x.stroke(); x.restore(); }
    x.restore(); };
  // a slow whirl of petals
  AS.petals = function (x, w, inten, l, m) { const t = T; x.save(); x.translate(w.x, w.y);
    for (let i = 0; i < 12; i++) { const ph = (t * .28 + i / 12) % 1, a = t * 1.4 + i * 1.9, R = (30 - ph * 8) * SC, px = Math.cos(a) * R, py = -ph * 96 * HS + Math.sin(a) * R * .3, s = (5 - ph * 1.5) * SC; x.save(); x.translate(px, py); x.rotate(a * 1.7); x.globalAlpha = Math.sin(ph * Math.PI) * Math.min(1, inten);
      x.fillStyle = i % 3 ? l : m; x.strokeStyle = '#07020d'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(0, -s); x.quadraticCurveTo(s * .9, 0, 0, s); x.quadraticCurveTo(-s * .9, 0, 0, -s); x.fill(); x.stroke(); x.restore(); }
    x.restore(); };
  // a turning rune circle on the floor, glyphs lifting off it
  AS.runes = function (x, w, inten, l, m) { const L = rgb(l), Mc = rgb(m), t = T; x.save(); x.translate(w.x, w.y); x.globalCompositeOperation = 'lighter';
    x.save(); x.scale(1, .34); x.rotate(t * .6); x.strokeStyle = `rgba(${L},${.8 * inten})`; x.lineWidth = 2.2; x.beginPath(); x.arc(0, 0, 34 * SC, 0, 7); x.stroke(); x.setLineDash([4, 6]); x.beginPath(); x.arc(0, 0, 27 * SC, 0, 7); x.stroke(); x.setLineDash([]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.save(); x.translate(Math.cos(a) * 30.5 * SC, Math.sin(a) * 30.5 * SC); x.rotate(a); x.strokeStyle = `rgba(255,255,255,${.9 * inten})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-2.5, -3); x.lineTo(2.5, 0); x.lineTo(-2.5, 3); x.moveTo(0, -3.5); x.lineTo(0, 3.5); x.stroke(); x.restore(); } x.restore();
    for (let i = 0; i < 6; i++) { const ph = (t * .45 + i / 6) % 1, a = i * 1.047 + t * .3, px = Math.cos(a) * 26 * SC, py = -ph * 90 * HS; x.save(); x.translate(px, py); x.globalAlpha = Math.sin(ph * Math.PI) * Math.min(1, inten); x.strokeStyle = `rgb(${i % 2 ? L : Mc})`; x.lineWidth = 1.8; x.lineCap = 'round'; const s = 4 * SC;
      x.beginPath(); if (i % 3 === 0) { x.moveTo(-s, s); x.lineTo(0, -s); x.lineTo(s, s); x.moveTo(-s * .5, 0); x.lineTo(s * .5, 0); } else if (i % 3 === 1) { x.moveTo(0, -s); x.lineTo(0, s); x.moveTo(-s, -s * .3); x.lineTo(0, s * .4); x.lineTo(s, -s * .3); } else { x.moveTo(-s, -s); x.lineTo(s, s); x.moveTo(s, -s); x.lineTo(-s, s); x.moveTo(-s, 0); x.lineTo(s, 0); } x.stroke(); x.restore(); }
    x.restore(); };
  // dark tendrils curling up from the feet
  AS.tendrils = function (x, w, inten, l, m) { const Mc = rgb(m), t = T; x.save(); x.translate(w.x, w.y); x.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const bx = (i - 3) * 8 * SC, h = (50 + (i % 3) * 20) * HS * (.8 + .2 * Math.sin(t * 2 + i)), sway = Math.sin(t * 2.2 + i * 1.3) * 12 * SC;
      x.beginPath(); x.moveTo(bx, 2); x.bezierCurveTo(bx - sway, -h * .35, bx + sway * 1.4, -h * .7, bx + sway * .5, -h);
      x.globalCompositeOperation = 'source-over'; x.strokeStyle = `rgba(7,2,13,${.8 * Math.min(1, inten)})`; x.lineWidth = 5.5 * SC; x.stroke(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(${Mc},${.75 * inten})`; x.lineWidth = 2 * SC; x.stroke(); }
    x.restore(); };
  // a crown of ice spikes rising in a ring
  AS.frostcrown = function (x, w, inten, l, m) { const t = T; x.save(); x.translate(w.x, w.y);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + .2, dep = Math.sin(a); if ((dep < 0) !== (pass === 0)) continue; const bx = Math.cos(a) * 28 * SC, by = dep * 9 * SC, h = (20 + (i % 3) * 12) * HS * (.85 + .15 * Math.sin(t * 3 + i)), wd = 4.2 * SC; x.globalAlpha = Math.min(1, inten);
      const g = x.createLinearGradient(bx, by, bx, by - h); g.addColorStop(0, m); g.addColorStop(.6, l); g.addColorStop(1, '#ffffff'); x.fillStyle = g; x.strokeStyle = '#07020d'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(bx - wd, by); x.lineTo(bx + Math.cos(a) * 3, by - h); x.lineTo(bx + wd, by); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = .9; x.beginPath(); x.moveTo(bx - wd * .2, by - 2); x.lineTo(bx + Math.cos(a) * 2.4, by - h * .85); x.stroke(); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const ph = (t * .5 + i / 8) % 1; x.fillStyle = `rgba(255,255,255,${(1 - ph) * inten})`; x.beginPath(); x.arc(Math.sin(i * 2.4 + t) * 30 * SC, -10 * HS - ph * 70 * HS, 1.5, 0, 7); x.fill(); }
    x.restore(); };
  // a dark sun behind the fighter with a burning corona (40 wins in a row)
  AS.eclipse = function (x, w, inten, l, m) { const L = rgb(l), Mc = rgb(m), t = T, cy = -46 * HS, R = 26 * SC; x.save(); x.translate(w.x, w.y + cy); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(0, 0, R * .9, 0, 0, R * 2.4); g.addColorStop(0, `rgba(${L},${.75 * inten})`); g.addColorStop(.4, `rgba(${Mc},${.35 * inten})`); g.addColorStop(1, `rgba(${Mc},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * 2.4, 0, 7); x.fill();
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283 + t * .25, len = R * (.5 + .45 * Math.abs(Math.sin(t * 3 + i * 1.7))); x.strokeStyle = `rgba(255,255,255,${.6 * inten})`; x.lineWidth = 1.6; x.beginPath(); x.moveTo(Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05); x.lineTo(Math.cos(a) * (R * 1.05 + len), Math.sin(a) * (R * 1.05 + len)); x.stroke(); }
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = Math.min(1, inten * 1.2); x.fillStyle = '#07020d'; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.strokeStyle = `rgb(${L})`; x.lineWidth = 2; x.stroke();
    x.restore(); };
  try { const add = (id, n, r, unlock) => { if (!COSMETICS.aurastyle.some(a => a.id === id)) COSMETICS.aurastyle.push({ id, n, r, unlock }); };
    add('arcs', 'Live Wire', 'rare', { type: 'gems', v: 120 }); add('petals', 'Petal Whirl', 'rare', { type: 'gems', v: 120 }); add('orbit', 'Moons', 'epic', { type: 'gems', v: 180 }); add('runes', 'Rune Circle', 'epic', { type: 'gems', v: 220 });
    add('tendrils', 'Shadow Tendrils', 'epic', { type: 'gems', v: 220 }); add('frostcrown', 'Frost Crown', 'legendary', { type: 'gems', v: 300 }); add('eclipse', 'Eclipse', 'legendary', { type: 'streak', v: 40 }); } catch (e) {}

  /* ---------------- streak sheet lists the new goals ---------------- */
  if (typeof window.streakInfo === 'function') { const _si = window.streakInfo; window.streakInfo = function () { const r = _si.apply(this, arguments);
      try { const box = document.querySelector('#sheetP .stkgoals'), best = (PR.stats && PR.stats.best) || 0; if (box && !box.querySelector('.s30')) box.insertAdjacentHTML('beforeend', [[30, 'Prism trail', 's30'], [40, 'Eclipse aura', 's40'], [50, 'Phoenix emblem', 's50']].map(([n, t, c]) => `<div class="${c} ${best >= n ? 'ok' : ''}"><b>${n} in a row</b><span>${t}</span><em>${best >= n ? '✓' : Math.min(best, n) + ' / ' + n}</em></div>`).join('')); } catch (e) {}
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `.crow.s span{color:#9fd8ff}.crow .cwrap{max-height:66px;overflow-y:auto}`;
  document.head.appendChild(css);
})();
