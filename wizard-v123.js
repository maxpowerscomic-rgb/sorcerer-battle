/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.23
   Juggernaut (speeds up, Bodyguard, Take the Blow), live target buttons in battle,
   colourways for attacks, the Hoot button on the Battle Hand.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const X = window.TECHX || {};
  const isJ = z => z && z.beast && z.beast.boss && z.hp > 0;

  /* ---------------- Juggernaut ---------------- */
  // It walks faster the longer it lives. Bodyguard: it holds a post in front of its caster and only leaves it for something close.
  // Take the Blow: once a round it leaps into a killing blow, dies in its caster's place, and the two casters are thrown apart.
  function threat(w, z) { const f = w.foe; if (f && !f.dead && (Math.hypot(f.x - w.x, f.y - w.y) < 120 || Math.hypot(f.x - z.x, f.y - z.y) < 56)) return true;
    try { for (const c of enemyCreatures(w)) if (c.e && c.e.x !== undefined && (Math.hypot(c.e.x - w.x, c.e.y - w.y) < 120 || Math.hypot(c.e.x - z.x, c.e.y - z.y) < 56)) return true; } catch (e) {}
    return false; }
  function land(w, s) { const z = s.z, f = w.foe, d = Math.hypot(f.x - w.x, f.y - w.y) || 1, ux = (f.x - w.x) / d, uy = (f.y - w.y) / d, mx = w.x + ux * 22, my = w.y + uy * 22;
    w.jSave = null; try { z.stun = 0; hurtZ(z, 1e6, null, 'crush'); } catch (e) {}
    w.vx -= ux * 700; w.vy -= uy * 700; if (!f.dead) { f.vx += ux * 700; f.vy += uy * 700; } w.recoil = Math.max(w.recoil || 0, .2);
    try { X.addFx && X.addFx({ k: 'clash', x: mx, y: my - 40 * HS, life: 1.1, a: Math.atan2(uy, ux) }); } catch (e) {}
    for (let i = 0; i < 22; i++) { const an = rnd(0, 6.283), v = rnd(40, 170); P({ x: mx + Math.cos(an) * 8, y: my - rnd(0, 26) * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .5 - rnd(0, 30), color: ['#d9d3e6', '#b9b2c8', '#8f88a3', '#ffffff'][i % 4], size: rnd(7, 13), life: rnd(.7, 1.3), glow: false, grow: 2.4, drag: .9, fade: .5 }); }
    for (let i = 0; i < 18; i++) { const an = rnd(0, 6.283), v = rnd(260, 520); P({ x: mx, y: my - 40 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v, color: i % 2 ? '#ffffff' : '#ffe08a', size: rnd(2, 3.5), life: rnd(.2, .4) }); }
    try { comics.push({ x: mx + 8, y: my - 112 * HS, w: 'SAVED!', t: 0, life: 1.2, rot: -.12, sc: 1.05 }); } catch (e) {}
    shake = Math.max(shake, 16); if (typeof flashScreen === 'function') flashScreen(); try { sfx('c_rush', { x: mx }); } catch (e) {}
    setTimeout(() => { if (!ended) slow = 1; }, 260); }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) {
      try { if (typeof zombies !== 'undefined' && !ended) for (const z of zombies) if (isJ(z) && z.rise >= 1) { z.spd = z.beast.spd * Math.min(4.3, 1 + (z.bt || 0) * .47);   /* (1.0.30) starts at a plod (about 18 px/s) and reaches a walking caster's pace (about 80 px/s) after 7 seconds */ if (U(z.o, 'zodiac', 'guard')) { z._gx = z.x; z._gy = z.y; } else z._gx = undefined; } } catch (e) {}
      const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && !ended) {
          for (const z of zombies) if (isJ(z) && z._gx !== undefined && !(z.stun > 0) && !(z.frozen > 0)) { const w = z.o, f = w.foe; if (w.dead || threat(w, z)) continue;
            const d = Math.hypot(f.x - w.x, f.y - w.y) || 1, px = w.x + (f.x - w.x) / d * 38, py = w.y + (f.y - w.y) / d * 38, dd = Math.hypot(px - z._gx, py - z._gy);
            if (dd < 3) { z.x = z._gx; z.y = z._gy; } else { const st = Math.min(dd, 44 * z.spd * 1.8 * dt); z.x = z._gx + (px - z._gx) / dd * st; z.y = z._gy + (py - z._gy) / dd * st; } }
          for (const w of ents) { const s = w.jSave; if (!s) continue; const k = Math.min(1, (performance.now() - s.t0) / 420), f = w.foe, d = Math.hypot(f.x - w.x, f.y - w.y) || 1, tx = w.x + (f.x - w.x) / d * 22, ty = w.y + (f.y - w.y) / d * 22, e = 1 - (1 - k) * (1 - k);
            s.z.x = s.x0 + (tx - s.x0) * e; s.z.y = s.y0 + (ty - s.y0) * e; s.z.stun = 9; w.hp = Math.max(w.hp, 1);
            P({ x: s.z.x + rnd(-10, 10), y: s.z.y - rnd(10, 60) * HS, vx: 0, vy: -rnd(10, 40), color: Math.random() < .5 ? '#ffd75e' : '#ffffff', size: rnd(2, 4), life: .35 });
            if (k >= 1) land(w, s); } }
        else if (ended && typeof ents !== 'undefined' && ents) for (const w of ents) w.jSave = null; } catch (e) { try { window.logCrash && logCrash(e, 'jugg'); } catch (e2) {} }
      return r; }; }
  if (typeof kill === 'function') { const _k = kill; window.kill = kill = function (w) {
      try { if (w && !w.dead && !ended) { if (w.jSave) { w.hp = Math.max(w.hp, 1); return; }
          const rd = (typeof M !== 'undefined' && M && M.round) || 0;
          if (w.jlsR !== rd && U(w, 'zodiac', 'laststand')) { const z = zombies.find(q => q.o === w && isJ(q) && q.rise >= 1);
            if (z) { w.jlsR = rd; w.hp = 1; w.jSave = { z, t0: performance.now(), x0: z.x, y0: z.y }; slow = .1; z.stun = 9; text(w.x, w.y - 112 * HS, 'TAKE THE BLOW', '#ffd75e', true); try { sfx('ui_deal', { x: w.x, rate: .5, vol: 1 }); } catch (e) {} return; } } } } catch (e) {}
      return _k.apply(this, arguments); }; }

  /* ---------------- live target buttons ---------------- */
  // Four buttons on the left edge of the battle: enemy caster, structures, summons, nearest. Tap the lit one again to go back to each ability's own setting.
  const TG = [
    ['caster', 'Enemy caster', '<path d="M12 3 6.500 13h11z" fill="currentColor"/><path d="M3.500 14.500h17" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/><circle cx="12" cy="18.500" r="2.600" fill="currentColor"/>'],
    ['struct', 'Walls and structures', '<path d="M3 6h18v12H3zM3 12h18M9 6v6M15 6v6M6 12v6M12 12v6M18 12v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'],
    ['summon', 'Summons', '<circle cx="7" cy="9" r="2.200" fill="currentColor"/><circle cx="12" cy="6.500" r="2.200" fill="currentColor"/><circle cx="17" cy="9" r="2.200" fill="currentColor"/><path d="M12 11c-3.500 0-6 3-6 5.500 0 2 1.800 2.800 3.500 2.300 1.600-.5 3.400-.5 5 0 1.700.5 3.500-.3 3.500-2.300 0-2.500-2.500-5.500-6-5.500z" fill="currentColor"/>'],
    ['near', 'Whatever is nearest', '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.200"/><circle cx="12" cy="12" r="2.200" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>'],
  ];
  function tgHud() { const b = $('battle'); if (!b) return; let h = $('tgHud');
    if (!h) { b.insertAdjacentHTML('beforeend', `<div id="tgHud">${TG.map(t => `<button data-t="${t[0]}" aria-label="${t[1]}"><svg viewBox="0 0 24 24">${t[2]}</svg></button>`).join('')}</div>`); h = $('tgHud');
      h.addEventListener('pointerdown', e => { e.stopPropagation(); const bt = e.target.closest('button'); if (!bt || typeof M === 'undefined' || !M) return; e.preventDefault(); const t = bt.dataset.t; M.tgtNow = M.tgtNow === t ? (M.sv ? 'near' : null) : t; tgPaint();
        try { sfx('ui_click'); } catch (e2) {} const me = typeof ents !== 'undefined' && ents && ents[0]; if (me && !ended) text(me.x, me.y - 100 * HS, M.tgtNow ? 'TARGET: ' + TG.find(q => q[0] === t)[1].toUpperCase() : 'TARGET: AUTO', '#ffe08a'); }); }
    tgPaint(); }
  function tgPaint() { const h = $('tgHud'); if (!h) return; const cur = typeof M !== 'undefined' && M ? M.tgtNow : null; h.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === cur)); h.style.display = (typeof M !== 'undefined' && M && M.practice && window.YARD && YARD.on) ? 'none' : ''; const cb = h.querySelector('button[data-t="caster"]'); if (cb) cb.style.display = (typeof M !== 'undefined' && M && M.sv) ? 'none' : ''; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { tgHud(); } catch (e) {} return r; }; }

  /* ---------------- colourways ---------------- */
  // Four colourways per attack, earned by using it: 20 matches, beating its Ladder rival (or 10 wins where it has none), level 10, level 20.
  // The attack's own drawing is re-used: while it draws, every colour it asks for is turned toward the colourway's hue.
  const HN = [[355, 'Crimson'], [20, 'Ember'], [48, 'Gold'], [140, 'Jade'], [200, 'Azure'], [275, 'Violet'], [325, 'Rose']];
  const SPEC = { white: ['Ivory', '#f4f0ff'], gold: ['Gilded', '#ffd04a'], dusk: ['Dusk', '#6a5cff'], cycle: ['Aurora', null] };
  const hname = h => typeof h === 'string' ? SPEC[h][0] : HN.find(q => q[0] === h)[1];
  const hcss = h => typeof h === 'string' ? (SPEC[h][1] ? `radial-gradient(circle at 35% 30%,#fff,${SPEC[h][1]} 45%,#000 130%)` : 'conic-gradient(#ff5a5a,#ffd45e,#5aff8a,#5ab8ff,#c48cff,#ff5a5a)') : `radial-gradient(circle at 35% 30%,#fff,hsl(${h},85%,58%) 45%,#000 130%)`;
  const CW = {   // ability: [base hue, [four target hues]]
    fireball: [22, [275, 140, 325, 48]], orbs: [272, [20, 140, 325, 48]], bubbles: [74, [200, 325, 275, 20]], ricochet: [272, [48, 200, 355, 140]],
    flies: [75, [355, 275, 200, 48]], gravity: [258, [355, 140, 48, 325]], thorns: [108, [325, 275, 20, 200]], icewall: [195, [325, 275, 140, 48]],
    zodiac: [0, ['white', 'dusk', 'gold', 'cycle']],
    sanctum: [225, [355, 140, 'gold', 'cycle']],   // (1.0.25) Sanctum designs: the dome itself changes colour   // the beasts: ivory, dusk, gilded, and Aurora, which never stops changing
  };
  window.COLOURWAYS = CW;
  const rival = k => { try { return (window.LADDER || []).find(r => r.feat === k && !r.adv); } catch (e) { return null; } };
  const tr = k => (PR.trial && PR.trial[k]) || {};
  function cwNeed(k, i) { const lv = (PR.spells[k] && PR.spells[k].lvl) || 1, rv = rival(k);
    if (i === 0) return [(tr(k).games || 0) >= 20, `Play 20 matches with it (${Math.min(20, tr(k).games || 0)}/20)`];
    if (i === 1) return rv ? [!!(PR.ladder && PR.ladder.won && PR.ladder.won[rv.id]), `Beat ${rv.n} on the Ladder`] : [(tr(k).wins || 0) >= 10, `Win 10 matches with it (${Math.min(10, tr(k).wins || 0)}/10)`];
    return [lv >= (i === 2 ? 10 : 20), `Reach level ${i === 2 ? 10 : 20} with it (now ${lv})`]; }
  const cwOf = o => k => { if (!(o && o.me && PR.cway && CW[k] && PR.cway[k])) return null; const t = CW[k][1][PR.cway[k] - 1]; return t === 'cycle' ? (Math.round(T * 7) * 15) % 360 : t === 'dusk' ? 215 : typeof t === 'string' ? t : t - CW[k][0]; };
  window.domeHue = dm => { try { return dm && dm.o ? cwOf(dm.o)('sanctum') : null; } catch (e) { return null; } };
  // colour maths
  const cache = new Map();
  function shift(col, d) { if (typeof col !== 'string') return col; const key = col + '|' + d; let v = cache.get(key); if (v !== undefined) return v; v = col; let r, g, b, a = 1, m;
    if (col[0] === '#') { let h = col.slice(1); if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join(''); if (h.length >= 6) { r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255; } }
    else if ((m = /^rgba?\(([^)]+)\)/.exec(col))) { const p = m[1].split(',').map(parseFloat); r = p[0]; g = p[1]; b = p[2]; if (p.length > 3) a = p[3]; }
    else if (typeof d === 'number' && (m = /^hsla?\(([^)]+)\)/.exec(col))) { const p = m[1].split(',').map(parseFloat); v = `hsla(${((p[0] + d) % 360 + 360) % 360},${p[1]}%,${p[2]}%,${p.length > 3 ? p[3] : 1})`; cache.set(key, v); return v; }
    if (r !== undefined && !isNaN(r + g + b)) { const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), df = mx - mn, l = (mx + mn) / 2;
      if (typeof d === 'string' && d[0] === 'h') { if (df > .07 && l > .1) v = `hsla(${d.slice(2)},${Math.max(60, Math.min(100, df / (1 - Math.abs(2 * l - 1) || 1) * 100)).toFixed(0)}%,${(l * 100).toFixed(0)}%,${a.toFixed(3)})`; }
      else if (d === 'white') { if (l > .16) v = `hsla(250,${df > .07 ? 14 : 0}%,${(l * 48 + 52).toFixed(0)}%,${a.toFixed(3)})`; }
      else if (d === 'gold') { if (l > .16) v = `hsla(${l > .8 ? 52 : 44},${l > .8 ? 100 : 86}%,${(l * 100).toFixed(0)}%,${a.toFixed(3)})`; }
      else if (df > .07) { const s = df / (1 - Math.abs(2 * l - 1) || 1); let h = mx === R ? ((G - B) / df) % 6 : mx === G ? (B - R) / df + 2 : (R - G) / df + 4; h = ((h * 60 + d) % 360 + 360) % 360; v = `hsla(${h.toFixed(0)},${(Math.min(1, s) * 100).toFixed(0)}%,${(l * 100).toFixed(0)}%,${a.toFixed(3)})`; } }
    if (cache.size > 4000) cache.clear(); cache.set(key, v); return v; }
  const CP = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : null, PROPS = ['fillStyle', 'strokeStyle', 'shadowColor'], DESC = {};
  if (CP) for (const p of PROPS) DESC[p] = Object.getOwnPropertyDescriptor(CP, p);
  function hueOn(x, d) { for (const p of PROPS) { const ds = DESC[p]; Object.defineProperty(x, p, { configurable: true, get() { return ds.get.call(this); }, set(v) { ds.set.call(this, shift(v, d)); } }); }
    for (const fn of ['createRadialGradient', 'createLinearGradient']) x[fn] = function () { const g = CP[fn].apply(this, arguments), add = g.addColorStop; g.addColorStop = (o, c) => add.call(g, o, shift(c, d)); return g; }; }
  function hueOff(x) { for (const p of PROPS) delete x[p]; delete x.createRadialGradient; delete x.createLinearGradient; }
  let ok = !!(CP && DESC.fillStyle && DESC.fillStyle.set);
  let curD = null;   // while a recoloured thing draws, sparks it throws are turned the same way
  if (typeof P === 'function') { const _P = P; window.P = P = function (o) { if (curD !== null && o && typeof o.color === 'string') o.color = shift(o.color, curD); return _P.apply(this, arguments); }; }
  function wrap(name, k, owner, skip, force) { const f = window[name]; if (typeof f !== 'function' || !ok) return;
    window[name] = function () { let d = null; try { d = force ? force.apply(null, arguments) : null; if (d === null || d === undefined) { d = null; const o = owner.apply(null, arguments); if (!(skip && skip.apply(null, arguments))) d = cwOf(o)(k); } } catch (e) {}
      if (d === null) return f.apply(this, arguments); const x = ctx, keep = curD; hueOn(x, d); curD = d; try { return f.apply(this, arguments); } finally { hueOff(x); curD = keep; } };
    try { (0, eval)(name + ' = window.' + name); } catch (e) {} }
  wrap('drawFireball', 'fireball', (x, p) => p && p.o, (x, p) => p.blue || (p.src && p.src !== 'fireball'));
  wrap('drawOrb', 'orbs', e => e && e.o); wrap('drawBubble', 'bubbles', e => e && e.o); wrap('drawRune', 'ricochet', e => e && e.o); wrap('drawSwarm', 'flies', e => e && e.o);
  wrap('drawZombie', 'zodiac', e => e && e.beast && e.o, null, e => e && e.crim ? 105 : e && e.hue ? e.hue : null);   /* Crimson Zodiac beasts are red for everyone */ wrap('drawWell', 'gravity', e => e && e.o); wrap('drawPatch', 'thorns', e => e && e.o); wrap('drawCrystal', 'icewall', (c, wl) => wl && wl.o, (c, wl) => wl && wl.mud);
  // sparks thrown off a recoloured attack follow its colour: any spark born this frame beside one is turned the same way
  const LISTS = { fireball: () => projs.filter(p => !p.blue && (!p.src || p.src === 'fireball')), orbs: () => orbs, bubbles: () => bubbles, ricochet: () => runes, flies: () => swarms, gravity: () => wells, zodiac: () => zombies.filter(z => z.beast && z.hp > 0), thorns: () => patches, icewall: () => { const o = []; for (const wl of walls) if (!wl.mud) for (const c of wl.cr) o.push({ o: wl.o, x: c.x, y: c.y }); return o; } };
  if (typeof update === 'function') { const _u2 = update; window.update = update = function (dt) { let spots = null;
      try { const me = typeof ents !== 'undefined' && ents && ents[0]; if (me && PR.cway && ok) { const of = cwOf(me); for (const k in CW) { const d = of(k); if (d === null) continue; for (const e of LISTS[k]()) if (e && e.o === me && e.x !== undefined) (spots = spots || []).push([e, e.x, e.y, d]); } if (spots) for (const p of parts) p._s = 1; } } catch (e) { spots = null; }
      const r = _u2.apply(this, arguments);
      try { if (spots && PR.cway.zodiac === 4) for (const s of spots) if (s[0].beast && Math.random() < dt * 16) P({ x: s[0].x + rnd(-14, 14), y: s[0].y - rnd(4, 44) * HS, vx: rnd(-14, 14), vy: -rnd(20, 60), color: `hsl(${Math.random() * 360 | 0},100%,68%)`, size: rnd(1.8, 3.4), life: rnd(.35, .7), _s: 1 }); } catch (e) {}
      try { if (spots) for (const p of parts) if (!p._s) { p._s = 1; for (const s of spots) { if (Math.abs(p.x - s[0].x) < 42 && Math.abs(p.y - s[0].y) < 70 || Math.abs(p.x - s[1]) < 42 && Math.abs(p.y - s[2]) < 70) { p.color = shift(p.color, s[3]); break; } } } } catch (e) {}
      return r; }; }
  // picker on the ability page
  window.cwPick = function (k, i) { PR.cway = PR.cway || {}; if (i > 0) { const n = cwNeed(k, i - 1); if (!n[0]) return toast(n[1]); } if (i) PR.cway[k] = i; else delete PR.cway[k]; save(); try { sfx('ui_click'); } catch (e) {} const el = document.querySelector('#sheetP .cw-row'); if (el) el.outerHTML = cwHTML(k); try { if ($('wardrobe').classList.contains('on')) renderWardrobe(); } catch (e) {} };
  function cwHTML(k) { const c = CW[k], cur = (PR.cway && PR.cway[k]) || 0;
    return `<div class="cw-row"><b>Colour</b><div class="cw-sw"><button class="${cur ? '' : 'on'}" onclick="cwPick('${k}',0)" style="--c:${k === 'zodiac' ? 'radial-gradient(circle at 35% 30%,#fff,#7dffa8 45%,#000 130%)' : hcss(c[0])}"><i></i><small>Standard</small></button>${c[1].map((h, i) => { const n = cwNeed(k, i); return `<button class="${cur === i + 1 ? 'on' : ''}${n[0] ? '' : ' lk'}" onclick="cwPick('${k}',${i + 1})" style="--c:${hcss(h)}"><i></i><small>${hname(h)}</small></button>`; }).join('')}</div>${cur ? '' : `<p>${(() => { const nx = [0, 1, 2, 3].find(i => !cwNeed(k, i)[0]); return nx === undefined ? 'All four colours earned.' : 'Next colour: ' + cwNeed(k, nx)[1] + '.'; })()}</p>`}</div>`; }
  /* (1.0.24) the colour picker moved to the wardrobe's Attacks tab (wizard-v124.js) */

  /* ---------------- Hoot button: fold his review of the hand away ---------------- */
  function hootBtn() { const hl = document.querySelector('#handBar .hl'), hx = $('handX'); if (!hl || !hx) return; hx.classList.toggle('hoot-off', !!PR.hootOff);
    if (!hl.querySelector('.hoot-btn')) { const b = hl.querySelector('b'); if (b) b.insertAdjacentHTML('afterend', `<button class="hoot-btn${PR.hootOff ? '' : ' on'}" onclick="hootFold()" aria-label="Hoot's review"><canvas width="64" height="64"></canvas></button>`); }
    hootFace(); }
  function hootFace() { try { const c = document.querySelector('#handBar .hoot-btn canvas'); if (!c || typeof drawPet !== 'function') return; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 64, 64); x.translate(32, 74); x.scale(1.45, 1.45); drawPet(x, 'owl', performance.now() / 1000, 1); } catch (e) {} }
  window.hootFold = function () { PR.hootOff = PR.hootOff ? 0 : 1; save(); const hx = $('handX'); if (hx) hx.classList.toggle('hoot-off', !!PR.hootOff); const b = document.querySelector('#handBar .hoot-btn'); if (b) b.classList.toggle('on', !PR.hootOff); try { sfx('ui_click'); } catch (e) {} };
  if (typeof renderSpells === 'function') { const _rs = renderSpells; window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments); try { hootBtn(); } catch (e) {} return r; }; }
  setInterval(() => { const sp = $('spells'); if (sp && sp.classList.contains('on')) hootFace(); }, 120);

  /* ---------------- Crimson Zodiac: the Regent heals and fires a Violet Bolt every 8 seconds ---------------- */
  if (typeof update === 'function') { const _u3 = update; window.update = update = function (dt) { const r = _u3.apply(this, arguments);
      try { if (typeof zombies !== 'undefined' && !ended) for (const z of zombies) { if (!z.beast || !z.beast.regent || z.hp <= 0 || z.rise < 1) continue; const w = z.o;
          if (z.hp < z.mx) { z.hp = Math.min(z.mx, z.hp + z.mx * .025 * dt); if (Math.random() < dt * 5) P({ x: z.x + rnd(-16, 16), y: z.y - rnd(10, 70) * HS, vx: 0, vy: -rnd(20, 45), color: '#ff8a8a', size: 2.5, life: .5 }); }
          z.vbT = (z.vbT === undefined ? 3 : z.vbT) - dt; if (z.vbT <= 0 && !w.dead && w.foe && !w.foe.dead && typeof zap === 'function') { z.vbT = 8; const kx = w.x, ky = w.y, b0 = new Set(bolts), src = SRC;
            try { w.x = z.x; w.y = z.y - 30 * HS; if (!w.lv.lightning) w.lv.lightning = w.lv.crimsonzodiac || w.lv.zodiac || 1; zap(w, 'lightning', 1, .6); for (const q of bolts) if (!b0.has(q)) q.violet = 1; } finally { w.x = kx; w.y = ky; SRC = src; }
            z.lunge = .2; text(z.x, z.y - 96 * HS, 'VIOLET BOLT', '#d9b3ff'); } } } catch (e) { try { window.logCrash && logCrash(e, 'regent'); } catch (e2) {} }
      return r; }; }

  /* ---------------- Chosen One: one upgrade per lost round ---------------- */
  if (typeof apply === 'function') { const _ap = apply; window.apply = apply = function (p, c) { const r = _ap.apply(this, arguments);
      try { if (c && c.type === 'up' && c.k === 'chosen' && typeof M !== 'undefined' && M) { const sd = p === M.me ? 'me' : 'foe'; M.chosenOpen = M.chosenOpen || {}; M.chosenShut = M.chosenShut || {}; M.chosenOpen[sd] = 0; M.chosenShut[sd] = 1; } } catch (e) {}
      return r; }; }

  /* ---------------- order screen: five abilities fit on one row ---------------- */
  function ringFit() { const r = $('ring'); if (!r) return; const n = r.querySelectorAll('.tile').length; r.classList.toggle('ord-many', n > 4); r.style.gridTemplateColumns = n > 4 ? `repeat(${n},minmax(0,1fr))` : ''; }
  if (typeof renderBook === 'function') { const _rb = renderBook; window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments); try { ringFit(); } catch (e) {} return r; }; }
  window.ringFit = ringFit;

  const css = document.createElement('style');
  css.textContent = `
  #order #scoreO,#order #ring,#order #detail{background:#171029}#order .bseg{background:#120c22}
  #ring.ord-many{gap:6px;padding:12px 8px}#ring.ord-many .tile{width:auto;height:auto;aspect-ratio:1;min-width:0}#ring.ord-many .tile img{width:84%;height:84%}
  #tgHud{position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:4;display:flex;flex-direction:column;gap:7px}
  #tgHud button{width:38px;height:38px;border-radius:12px;border:2px solid #000;background:#1a1236cc;color:#b9a9e6;display:grid;place-items:center;padding:0;box-shadow:0 2px 0 #000;touch-action:none}
  #tgHud button svg{width:22px;height:22px;pointer-events:none}#tgHud button.on{background:linear-gradient(#ffe27a,#f0a830);color:#2a1600;transform:scale(1.08)}
  .cw-row{margin:10px 0;padding:9px 10px;background:#0006;border:2px solid #000;border-radius:14px}.cw-row>b{font:13px 'Lilita One';font-weight:400;letter-spacing:.5px;color:#f3ecff;text-transform:uppercase}
  .cw-row p{margin:6px 0 0;font:800 11.5px Nunito;color:#b9a9e6}.cw-sw{display:flex;gap:6px;margin-top:6px}
  .cw-sw button{flex:1;min-width:0;background:#1a1236;border:2px solid #000;border-radius:11px;padding:6px 2px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 2px 0 #000}
  .cw-sw button i{width:26px;height:26px;border-radius:50%;border:2px solid #000;background:var(--c)}
  .cw-sw button small{font:800 10px Nunito;color:#d6cbf5;white-space:nowrap}.cw-sw button.on{background:#3a2d66;outline:2px solid #ffd45e}.cw-sw button.lk{opacity:.5}.cw-sw button.lk i{filter:grayscale(.7)}
  #handBar{position:relative}.hoot-btn{position:absolute;top:8px;right:10px;width:34px;height:34px;border-radius:50%;border:2px solid #000;padding:0;overflow:hidden;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240);box-shadow:0 2px 0 #000;opacity:.55}
  .hoot-btn.on{opacity:1;outline:2px solid #ffd45e}.hoot-btn canvas{width:100%;height:100%;display:block}#handX.hoot-off .hrate{display:none}`;
  document.head.appendChild(css);
  window.V123 = { cwNeed, shift, tgHud, hname, hcss, hueOn, hueOff, cwHTML, ok: () => ok };
})();
