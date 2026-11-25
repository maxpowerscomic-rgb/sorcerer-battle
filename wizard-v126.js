/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.31
   Collapse drags every summon it touches and destroys them when it ends; Draw hurts what its catch is dragged past;
   the order screen lists Zodiac upgrades taken; the Survival round curtain shows the horde and your team.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const orbs = () => (window.TECH_DEBUG && TECH_DEBUG.orbs) || [];
  const isCollapse = c => c && !c.draw && !c.repel && c.dmg !== undefined && c.hit instanceof Set;

  /* ---------------- Collapse: catch every summon, drag it, destroy it when the singularity ends ---------------- */
  // Applies to Collapse and Unrestrained Collapse. Anything summoned (zombies, beasts including the Juggernaut, golems, turrets,
  // fly swarms, decoys, totems, survival mobs) that touches it is caught and pulled along; when it implodes or bursts, all of it is gone.
  const caught = new Map();   // collapse orb -> [{ e, k, ox, oy }]
  function collapseTick(dt) { const live = orbs();
    for (const c of live) { if (!isCollapse(c) || (c.wind && !c.launched) || c.life <= 0) continue; let L = caught.get(c); if (!L) { L = []; caught.set(c, L); }
      const R = 40 * (c.amp || 1); let list = []; try { list = enemyCreatures(c.o); } catch (e) {}
      for (const q of list) { const e = q.e; if (!e || e.x === undefined || e._colBy || L.some(h => h.e === e)) continue; if (Math.hypot(e.x - c.x, e.y - c.y) < R) { e._colBy = c; const a = Math.random() * 6.283; L.push({ e, k: q.k, ox: Math.cos(a) * rnd(6, 18), oy: Math.sin(a) * rnd(4, 12) }); try { burst(e.x, e.y - 20 * HS, 8, ['#c48cff', '#ffffff'], 120, 3, .35); } catch (e2) {} } }
      for (const h of L) { const e = h.e; if (!(e.hp > 0) && !(h.k === 'd' && !e.gone)) continue; const sp = (Date.now() / 1000) * 6; e.x = c.x + h.ox * Math.cos(sp) - h.oy * Math.sin(sp); e.y = c.y + h.ox * Math.sin(sp) * .6 + h.oy * Math.cos(sp) * .6; if (e.vx !== undefined) { e.vx = 0; e.vy = 0; } e.stun = Math.max(e.stun || 0, .2); e.rooted = Math.max(e.rooted || 0, .2); if (e.cd !== undefined) e.cd = Math.max(e.cd, .3); } }
    for (const [c, L] of caught) { if (live.includes(c) && c.life > 0) continue; caught.delete(c);
      for (const h of L) { const e = h.e; e._colBy = null; if (h.k === 'd' ? e.gone : !(e.hp > 0)) continue; try { burst(e.x, e.y - 24 * HS, 18, ['#c48cff', '#ff6b6b', '#6fb8ff', '#ffffff'], 220, 5, .5); } catch (e2) {}
        const s0 = SRC; SRC = 'polarity'; try { if (h.k === 'z' && typeof hurtZ === 'function') hurtZ(e, 1e6, null, 'arcane'); else if (typeof hurtCreature === 'function') hurtCreature(e, h.k, 1e6, 'arcane'); } catch (e2) {} finally { SRC = s0; } }
      if (L.length) { try { text(c.x, c.y - 90 * HS, L.length > 1 ? 'CONSUMED ×' + L.length : 'CONSUMED', '#e6d0ff', true); shake = Math.max(shake, 10); } catch (e) {} } } }

  /* ---------------- Draw: what its catch is dragged past takes 2 damage ---------------- */
  function drawTick() { for (const c of orbs()) { if (!c.draw || c.out || !c.held || !c.held.some(h => !h.gone)) continue; c.swept = c.swept || new Set(); const held = new Set(c.held.map(h => h.e));
      let list = []; try { list = enemyCreatures(c.o); } catch (e) {}
      for (const q of list) { const e = q.e; if (!e || e.x === undefined || held.has(e) || c.swept.has(e)) continue; if (Math.hypot(e.x - c.x, e.y - c.y) < 30) { c.swept.add(e); const s0 = SRC; SRC = 'polarity'; try { if (q.k === 'z' && typeof hurtZ === 'function') hurtZ(e, 2, null, 'crush'); else hurtCreature(e, q.k, 2, 'crush'); } catch (e2) {} finally { SRC = s0; } try { text(e.x, e.y - 50 * HS, '2', '#bfe6ff'); } catch (e2) {} } }
      const f = c.o.foe; if (f && !f.dead && !held.has(f) && !c.swept.has(f) && Math.hypot(f.x - c.x, f.y - c.y) < 30) { c.swept.add(f); const s0 = SRC; SRC = 'polarity'; try { damage(f, 2, 0, 0, '#bfe6ff'); } finally { SRC = s0; } } } }

  /* ---------------- (1.0.32) the Juggernaut as a bodyguard ----------------
     Take the Blow throws its caster back out of harm's way: a short hop away from the threat, and 0.9 s in which nothing can hurt them.
     With Bodyguard, the Juggernaut also leaps into the path of a big incoming technique aimed at its caster and takes it instead:
     Collapse, or a tier 3 Repel orb, Dissection slash, Blood lance or Rushdown. Once every 4 seconds. */
  function hopTick(dt) { for (const w of ents) { if (w.safeT > 0) w.safeT -= dt; const h = w.jHop; if (!h) continue; h.t += dt; const k = Math.min(1, h.t / .35), e = 1 - (1 - k) * (1 - k);
      w.x = clamp(h.x0 + h.dx * e, F.x0 + 8, F.x1 - 8); w.y = clamp(h.y0 + h.dy * e, F.y0 + 8, F.y1 - 8); w.vx = w.vy = 0; if (k >= 1) w.jHop = null; } }
  if (typeof damage === 'function') { const _dS = damage; window.damage = damage = function (t, d) { if (t && t.safeT > 0 && d > 0) return; return _dS.apply(this, arguments); }; }
  const tierAt = (w, k) => { try { return tierOf(w, k); } catch (e) { return 1; } };
  function threats(w) { const out = [], f = w.foe; const toward = (x, y, vx, vy) => { const dx = w.x - x, dy = w.y - y, d = Math.hypot(dx, dy) || 1; return d < 170 && (vx * dx + vy * dy) / d > 40; };
    for (const c of orbs()) { if (c.o === w || c.life <= 0 || c.draw) continue; const col = isCollapse(c); if (col && c.wind && !c.launched) continue; if ((col || (c.repel && tierAt(c.o, 'polarity') >= 3)) && toward(c.x, c.y, c.vx || 0, c.vy || 0)) out.push({ kind: col ? 'collapse' : 'repel', o: c, x: c.x, y: c.y }); }
    try { for (const s of TECHX.slashes || []) if (s.o !== w && s.life > 0 && tierAt(s.o, 'dissect') >= 3 && toward(s.x, s.y, s.vx, s.vy)) out.push({ kind: 'slash', o: s, x: s.x, y: s.y }); } catch (e) {}
    try { for (const b of (window.BLOOD_DEBUG ? BLOOD_DEBUG.bloods : [])) if (b.o !== w && b.k === 'lance' && b.life > 0 && tierAt(b.o, 'bloodcraft') >= 3 && toward(b.x, b.y, b.vx, b.vy)) out.push({ kind: 'lance', o: b, x: b.x, y: b.y }); } catch (e) {}
    if (f && f.rush && f.rush.ph === 'dash' && (f.rush.tier || 1) >= 3 && f.rush.tg && f.rush.tg.e === w && Math.hypot(f.x - w.x, f.y - w.y) < 170) out.push({ kind: 'rush', o: f, x: f.x, y: f.y });
    return out; }
  function guardTick(dt) { for (const w of ents) { if (w.dead) continue; const j = zombies.find(z => z.o === w && z.beast && z.beast.boss && z.hp > 0 && z.rise >= 1); if (!j) continue;
      if (j.leap) { const L = j.leap; L.t += dt; const k = Math.min(1, L.t / .2); j.x = L.x0 + (L.tx - L.x0) * k; j.y = L.y0 + (L.ty - L.y0) * k - Math.sin(k * Math.PI) * 26; j.stun = .1;
        if (Math.random() < .8) P({ x: j.x + rnd(-14, 14), y: j.y - rnd(10, 60) * HS, vx: rnd(-20, 20), vy: -rnd(10, 40), color: Math.random() < .5 ? '#ffd75e' : '#ffffff', size: rnd(2, 3.5), life: .3 });
        if (k >= 1) { j.leap = null; j.y = L.ty; const q = L.q, o = q.o; let took = 0;
          if (q.kind === 'collapse') { if (o.life > 0) { o.life = 0; took = 1e6; } }
          else if (q.kind === 'repel' || q.kind === 'slash' || q.kind === 'lance') { if (o.life > 0) { o.life = 0; took = (o.dmg || 15) * 1.5; } }
          else if (q.kind === 'rush') { if (o.rush) { const rd = (typeof S === 'function' ? S(o, 'rush', 'dmg') : 12) * 2; o.rush = null; o.jump = 0; const d = Math.hypot(o.x - j.x, o.y - j.y) || 1; o.vx += (o.x - j.x) / d * 520; o.vy += (o.y - j.y) / d * 520; took = rd; } }
          if (took) { const s0 = SRC; SRC = 'polarity'; try { hurtZ(j, took, null, 'crush'); } finally { SRC = s0; } text(j.x, j.y - 110 * HS, 'INTERCEPTED', '#ffd75e', true); shake = Math.max(shake, 12); try { burst(j.x, j.y - 40 * HS, 26, ['#ffd75e', '#ffffff', '#c48cff'], 260, 6, .5); sfx('c_rush', { x: j.x }); } catch (e) {} } }
        continue; }
      if (!U(w, 'zodiac', 'guard') || (j.icd || 0) > T || j.stun > .3 || j.frozen > 0) continue;
      const th = threats(w); if (!th.length) continue; th.sort((a, b) => Math.hypot(a.x - w.x, a.y - w.y) - Math.hypot(b.x - w.x, b.y - w.y)); const q = th[0];
      const tx = clamp(w.x + (q.x - w.x) * .4, F.x0 + 8, F.x1 - 8), ty = clamp(w.y + (q.y - w.y) * .4, F.y0 + 8, F.y1 - 8); if (Math.hypot(tx - j.x, ty - j.y) > 280) continue;
      j.icd = T + 4; j.leap = { t: 0, x0: j.x, y0: j.y, tx, ty, q }; text(j.x, j.y - 100 * HS, 'GUARD!', '#ffe08a'); slow = Math.min(slow, .5); setTimeout(() => { if (!ended) slow = 1; }, 180); } }

  /* ---------------- (1.0.32.1) the Juggernaut's body blocks shots ----------------
     Its big frame was only as wide as a zombie to incoming shots, so arrows aimed at its caster flew straight through it.
     Now any enemy shot that reaches its body (fireballs and other bolts, arrows, ricochet runes, blood lances, Dissection slashes) stops on it and hurts it instead. */
  function bodyBlock() { const js = zombies.filter(z => z.beast && z.beast.boss && z.hp > 0 && z.rise >= 1 && !z.leap); if (!js.length) return;
    const R = j => 30 * (j.beast.sz || 1.5) / 1.5, hit = (j, x, y) => Math.hypot(j.x - x, j.y - y) < R(j);
    const take = (j, d, x, y) => { const s0 = SRC; try { hurtZ(j, Math.max(1, d || 8), null, 'hit'); } finally { SRC = s0; } j.flash = .12; try { burst(x, y - 30 * HS, 10, ['#ffe08a', '#ffffff'], 140, 3, .3); text(j.x, j.y - 96 * HS, 'BLOCKED', '#ffe08a'); } catch (e) {} };
    for (const j of js) {
      if (typeof arrows !== 'undefined') for (const ar of arrows) if (ar.o !== j.o && ar.life > 0 && hit(j, ar.x, ar.y + 40 * HS)) { ar.life = 0; ar.miss = false; take(j, ar.dmg, ar.x, ar.y + 40 * HS); }
      if (typeof projs !== 'undefined') for (const p of projs) if (p.o !== j.o && p.life > 0 && p.held === undefined && hit(j, p.x, p.y + 38 * HS)) { p.life = 0; take(j, (p.dmg || (typeof S === 'function' ? S(p.o, p.src && SP[p.src] ? p.src : 'fireball', 'dmg') : 10)) * (p.dmgMul || 1), p.x, p.y + 38 * HS); }
      if (typeof runes !== 'undefined') for (const q of runes) if (q.o !== j.o && q.life > 0 && hit(j, q.x, q.y)) { q.life = 0; take(j, q.dmg, q.x, q.y); }
      try { for (const b of (window.BLOOD_DEBUG ? BLOOD_DEBUG.bloods : [])) if (b.o !== j.o && b.k === 'lance' && b.life > 0 && hit(j, b.x, b.y)) { b.life = 0; take(j, b.dmg, b.x, b.y); } } catch (e) {}
      try { for (const sl of (TECHX.slashes || [])) if (sl.o !== j.o && sl.life > 0 && hit(j, sl.x, sl.y)) { sl.life = 0; take(j, sl.dmg, sl.x, sl.y); } } catch (e) {} } }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) {
      try { if (typeof ents !== 'undefined' && ents && ents.length && !ended && !(introT > 0)) bodyBlock(); } catch (e) { try { window.logCrash && logCrash(e, 'bodyBlock'); } catch (e2) {} }
      const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && ents.length && !ended) { collapseTick(dt); drawTick(); hopTick(dt); guardTick(dt); } else if (ended) caught.clear(); } catch (e) { try { window.logCrash && logCrash(e, 'v126'); } catch (e2) {} }
      // a beam stopped on a big summon burns it even when its centre sits a little off the beam's line
      try { if (typeof cannons !== 'undefined' && !ended) for (const c of cannons) { const h = c.sumE; if (!h || h.T !== T || c.t >= c.dur || !(h.d >= (c.wide ? 30 : 20))) continue; const s0 = SRC; SRC = 'beam'; try { hurtCreature(h.e, h.k, 60 * dt * (U(c.o, 'beam', 'overload') ? 1.5 : 1), 'shock'); } finally { SRC = s0; } } } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { caught.clear(); return _sd.apply(this, arguments); }; }

  /* ---------------- (1.0.32.3) every hit on a caster spills a little blood ----------------
     Any damage to a fighter leaves a small puddle where they stand (bigger hits, bigger puddles; at most one every 0.25 s each).
     Bloodcraft gathers every puddle on the floor, whoever spilled it. */
  if (typeof damage === 'function') { const _dB = damage; window.damage = damage = function (t, d) { const h0 = t ? t.hp : 0, r = _dB.apply(this, arguments);
      try { if (t && !t.svAnchor && !t.isDecoy && t.hp < h0 && window.BLOOD_DEBUG && (t._bldT === undefined || T - t._bldT > .25 || T < t._bldT)) { t._bldT = T; const lost = h0 - t.hp; BLOOD_DEBUG.pool(t, t.x + rnd(-8, 8), t.y + rnd(-3, 5), Math.min(13, 4 + lost * .35), 0); } } catch (e) {}
      return r; }; }

  /* ---------------- order screen: Zodiac lists the upgrades you have taken ---------------- */
  if (typeof renderBook === 'function') { const _rb = renderBook; window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments);
      try { const b = M.me.book, sel = M.swapSel ?? (M.lastAdded >= 0 ? M.lastAdded : 0), k = b[sel]; if (k === 'zodiac' || k === 'crimsonzodiac') { const box = document.querySelector('#detail .ostat'); if (box) { box.querySelectorAll('i:not(.r)').forEach(i => i.remove());
            const got = (UPG[k] || []).filter(u => M.me.up.has(k + '.' + u.id)); box.insertAdjacentHTML('beforeend', got.length ? got.map(u => `<i>${u.n}</i>`).join('') : '<i>No upgrades yet</i>'); } } } catch (e) {}
      return r; }; }

  /* ---------------- Survival round curtain: the horde on top, your team below ---------------- */
  const IC = {
    horde: '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 4 6.500 4 10.500c0 2.300 1.100 4 2.600 5V19h2.400v-2h2v2h2v-2h2v2H17v-3.500c1.500-1 3-2.700 3-5C20 6.500 17 3 12 3z" fill="#e8e0ff" stroke="#000" stroke-width="1.600" stroke-linejoin="round"/><circle cx="9" cy="11" r="2" fill="#000"/><circle cx="15" cy="11" r="2" fill="#000"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M2 15c2.500 0 2.500-3 5-3s2.500 3 5 3 2.500-3 5-3 2.500 3 5 3M2 9c2.500 0 2.500-3 5-3s2.500 3 5 3 2.500-3 5-3 2.500 3 5 3" fill="none" stroke="#9fd8ff" stroke-width="2.600" stroke-linecap="round"/></svg>',
    kill: '<svg viewBox="0 0 24 24"><path d="M14.500 3H21v6.500L10 20.500 7.500 18 18.500 7z" fill="#ffd45e" stroke="#000" stroke-width="1.600" stroke-linejoin="round"/><path d="M5 15.500 8.500 19M3.500 20.500l3-3" stroke="#000" stroke-width="2.600" stroke-linecap="round"/><path d="M5 15.500 8.500 19" stroke="#c9861a" stroke-width="1.400" stroke-linecap="round"/></svg>',   /* a gold sword: enemies defeated (a red X read as failures) */
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (typeof startDuel === 'function') { const _sd2 = startDuel; window.startDuel = startDuel = function () { const r = _sd2.apply(this, arguments); try { const s = M && M.sv; if (s) { s.k0 = s.kills || 0; s.waveNo = s.endless ? 0 : Math.min(2, M.score.me) + 1; } } catch (e) {} return r; }; }
  if (typeof roundCurtain === 'function') { const _rc = roundCurtain; window.roundCurtain = roundCurtain = function () { const r = _rc.apply(this, arguments);
      try { const s = M && M.sv; if (s) { const top = $('rcTop'), bot = $('rcBot'), k = Math.max(0, (s.kills || 0) - (s.k0 || 0));
          top.innerHTML = `<div class="svc-top"><span class="svc-h">${IC.horde}</span><span class="svc-chip">${IC.wave}<b>${s.endless ? '∞' : s.waveNo || 1}</b></span><span class="svc-chip">${IC.kill}<b>${k}</b></span></div>`;
          const row = (look, n, hand, dead) => `<div class="svc-row${dead ? ' dead' : ''}"><canvas width="96" height="96"></canvas><div class="svc-g"><b>${esc(n)}</b><span>${hand.filter(q => ICON[q]).map(q => `<img src="${ICON[q]}">`).join('')}</span></div></div>`;
          const pt = s.pt; bot.innerHTML = `<div class="svc-team">${row(PR.look, PR.name, M.me.book)}${pt ? row(pt.look, pt.n, pt.hand, s.P && s.P.dead) : ''}</div>`;
          const cvs = bot.querySelectorAll('canvas'); try { drawAva(cvs[0], lookWiz(PR.look)); if (pt && cvs[1]) drawAva(cvs[1], lookWiz(pt.look || PR.look)); } catch (e) {} } } catch (e) { try { window.logCrash && logCrash(e, 'svCurtain'); } catch (e2) {} }
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `
  .svc-top{display:flex;align-items:center;gap:12px}.svc-h{width:74px;height:74px;border-radius:20px;border:4px solid #000;background:radial-gradient(circle at 40% 35%,#5a2340,#1c0a14);display:grid;place-items:center;box-shadow:0 5px 0 #000,0 0 24px #ff5d6c88}.svc-h svg{width:48px;height:48px}
  .svc-chip{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:16px;border:3px solid #000;background:#170f2a;box-shadow:0 4px 0 #000}.svc-chip svg{width:28px;height:28px}.svc-chip b{font:26px 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke}
  .svc-team{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px}.svc-row{display:flex;align-items:center;gap:10px}.svc-row canvas{width:58px!important;height:58px!important;border-radius:16px!important;border:3px solid #000!important}
  .svc-g{display:flex;flex-direction:column;gap:4px;min-width:0}.svc-g b{font:19px 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.svc-g span{display:flex;gap:4px}.svc-g img{width:28px;height:28px;border-radius:8px;border:2px solid #000;background:#170f2a}
  .svc-row.dead{opacity:.55}.svc-row.dead canvas{filter:grayscale(1)}`;
  document.head.appendChild(css);
})();
