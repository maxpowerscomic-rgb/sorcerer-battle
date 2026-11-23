/* =====================================================================
   WIZARDS VS SORCERERS: sorcerer techniques (logic + art)
   Loaded after the game script. Wraps cast / update / damage / render and
   adds the technique entities, the sorcerer look and the Copy Cast eye flash.
   ===================================================================== */
(function () {
  'use strict';
  let slashes = [], domes = [], orbsC = [], fx = [], springs = [], motes = [], cleaves = [], EYE = null;
  const SILS = {};

  /* ---------------- icons: techniques get an octagon seal, spells keep the circle ---------------- */
  function techIcon(k, S = 96) {
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), [l, m, d] = COL[SP[k].el];
    x.scale(S / 96, S / 96);
    const oct = r => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .3927; x.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r); } x.closePath(); };
    oct(46); x.fillStyle = '#000'; x.fill();
    const g = x.createRadialGradient(40, 34, 4, 48, 48, 46); g.addColorStop(0, m); g.addColorStop(1, d); oct(41); x.fillStyle = g; x.fill();
    oct(35); x.lineWidth = 2.5; x.strokeStyle = l + '99'; x.stroke();
    x.save(); x.translate(48, 48); x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 3; x.lineJoin = 'round'; x.lineCap = 'round'; x.shadowColor = l; x.shadowBlur = 10;
    const crescent = (cx, cy, r, a0, rot) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.beginPath(); x.arc(0, 0, r, -a0, a0); x.arc(-r * .35, 0, r * .9, a0 * .9, -a0 * .9, true); x.closePath(); x.stroke(); x.fill(); x.restore(); };
    if (k === 'dissect') { crescent(-6, 4, 22, 1.1, -.7); crescent(4, -2, 18, 1.0, -.7); x.fillStyle = l; crescent(12, -10, 13, .9, -.7); }
    else if (k === 'chosen') { x.fillStyle = l; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 - 1.571, r = i % 2 ? 13 : 30; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill(); x.stroke(); }
    else if (k === 'earthm') { x.fillStyle = l; x.beginPath(); x.ellipse(0, 16, 30, 9, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff';
      for (const [px, h, wd] of [[-15, 26, 9], [0, 38, 11], [15, 22, 9]]) { x.beginPath(); x.moveTo(px - wd, 16); x.lineTo(px - wd * .8, 16 - h); x.lineTo(px - wd * .2, 16 - h - 5); x.lineTo(px + wd * .8, 16 - h + 1); x.lineTo(px + wd, 16); x.closePath(); x.fill(); x.stroke(); } }
    else if (k === 'sanctum') { x.beginPath(); x.moveTo(-26, 14); x.bezierCurveTo(-26, -30, 26, -30, 26, 14); x.closePath(); x.fillStyle = l + 'cc'; x.fill(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * 9, 14); x.quadraticCurveTo(i * 6, -14, 0, -18); x.stroke(); } x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.moveTo(-30, 15); x.lineTo(30, 15); x.stroke(); }
    else if (k === 'doubletake') { x.lineWidth = 6; x.strokeStyle = '#000'; for (const s of [1, -1]) { x.beginPath(); x.arc(0, 0, 20, s > 0 ? 3.6 : .46, s > 0 ? 5.8 : 2.7); x.stroke(); } x.lineWidth = 3.5; x.strokeStyle = '#fff'; for (const s of [1, -1]) { x.beginPath(); x.arc(0, 0, 20, s > 0 ? 3.6 : .46, s > 0 ? 5.8 : 2.7); x.stroke(); } const head = (a, dir) => { const hx = Math.cos(a) * 20, hy = Math.sin(a) * 20; x.save(); x.translate(hx, hy); x.rotate(a + dir * 1.57); x.beginPath(); x.moveTo(0, -8); x.lineTo(8, 4); x.lineTo(-8, 4); x.closePath(); x.stroke(); x.fill(); x.restore(); }; head(5.8, 1); head(2.7, 1); x.beginPath(); x.arc(-7, 0, 4.5, 0, 7); x.arc(7, 0, 4.5, 0, 7); x.fillStyle = l; x.fill(); }
    else if (k === 'rush') { x.fillStyle = '#fff'; x.beginPath(); x.roundRect ? x.roundRect(-16, -14, 30, 26, 8) : x.rect(-16, -14, 30, 26); x.fill(); x.stroke(); x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-16 + 8 + i * 8, -14); x.lineTo(-16 + 8 + i * 8, -2); x.stroke(); } x.lineWidth = 3; x.beginPath(); x.moveTo(-16, 4); x.quadraticCurveTo(-24, 10, -14, 16); x.stroke(); x.strokeStyle = l; x.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = -2.2 + i * .45; x.beginPath(); x.moveTo(Math.cos(a) * 30 + 10, Math.sin(a) * 30); x.lineTo(Math.cos(a) * 38 + 10, Math.sin(a) * 38); x.stroke(); } }
    else if (k === 'polarity') { x.fillStyle = '#6fd3ff'; x.beginPath(); x.arc(-11, 3, 13, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(12, -5, 13, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 25, 3.5, 5.6); x.stroke(); x.beginPath(); x.arc(0, 0, 25, .4, 2.5); x.stroke(); }
    else if (k === 'zodiac') { x.shadowBlur = 0; const sil = beastSil('🐉', 60, '#140a30', l); x.drawImage(sil, -34, -36, 68, 68); }
    else if (k === 'titan') { x.beginPath(); x.moveTo(-18, 22); x.lineTo(-20, -6); x.quadraticCurveTo(0, -30, 20, -6); x.lineTo(18, 22); x.quadraticCurveTo(0, 14, -18, 22); x.fillStyle = l; x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-20, -6); x.quadraticCurveTo(-32, -20, -26, -32); x.quadraticCurveTo(-20, -18, -12, -14); x.fill(); x.stroke(); x.beginPath(); x.moveTo(20, -6); x.quadraticCurveTo(32, -20, 26, -32); x.quadraticCurveTo(20, -18, 12, -14); x.fill(); x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.moveTo(-12, 0); x.lineTo(-3, 4); x.lineTo(-12, 7); x.closePath(); x.moveTo(12, 0); x.lineTo(3, 4); x.lineTo(12, 7); x.closePath(); x.fill(); x.fillStyle = '#fff'; x.shadowColor = '#7aa6ff'; x.beginPath(); x.arc(-8, 4, 1.6, 0, 7); x.arc(8, 4, 1.6, 0, 7); x.fill(); }
    else if (k === 'copycast') { x.beginPath(); x.moveTo(-30, 0); x.quadraticCurveTo(0, -24, 30, 0); x.quadraticCurveTo(0, 24, -30, 0); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillStyle = '#d0102a'; x.beginPath(); x.arc(0, 0, 11, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#000'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, 7, 0, 7); x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.ellipse(0, 0, 2.2, 6, 0, 0, 7); x.fill(); }
    else if (k === 'counter') { x.lineCap = 'round'; for (const [lw, col] of [[9, '#000'], [5, '#fff']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(-2, 2, 17, -2.2, 1.2); x.stroke(); } x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.moveTo(-20, -8); x.lineTo(-4, -20); x.lineTo(-6, -4); x.closePath(); x.fill(); x.stroke(); x.fillStyle = l; x.beginPath(); x.roundRect ? x.roundRect(8, -6, 14, 14, 4) : x.rect(8, -6, 14, 14); x.fill(); x.stroke(); }
    else if (k === 'secondwind') { x.beginPath(); x.moveTo(0, 22); x.bezierCurveTo(-34, -2, -18, -30, 0, -12); x.bezierCurveTo(18, -30, 34, -2, 0, 22); x.closePath(); x.fill(); x.stroke(); x.shadowBlur = 0; x.fillStyle = '#ff3b4a'; x.fillRect(-4, -9, 8, 20); x.fillRect(-10, -3, 20, 8); x.strokeStyle = l; x.lineWidth = 3; for (const s2 of [-1, 1]) { x.beginPath(); x.arc(s2 * 30, 6, 10, s2 > 0 ? -2.2 : -.94, s2 > 0 ? -.94 : -2.2, s2 < 0); x.stroke(); } }
    x.restore(); return c.toDataURL();
  }
  Object.keys(TECH).forEach(k => ICON[k] = techIcon(k));
  ICON.healspring = (function () { // wizard spells keep the round seal
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), [l, m, d] = COL.life;
    const g = x.createRadialGradient(40, 34, 4, 48, 48, 46); g.addColorStop(0, m); g.addColorStop(1, d);
    x.beginPath(); x.arc(48, 48, 44, 0, 7); x.fillStyle = '#000'; x.fill(); x.beginPath(); x.arc(48, 48, 40, 0, 7); x.fillStyle = g; x.fill();
    x.lineWidth = 3; x.strokeStyle = l + '88'; x.beginPath(); x.arc(48, 48, 35, 0, 7); x.stroke();
    x.translate(48, 48); x.lineJoin = 'round'; x.strokeStyle = '#000'; x.lineWidth = 3;
    x.fillStyle = l + 'cc'; x.beginPath(); x.ellipse(0, 20, 27, 8, 0, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(0, 20, 16, 4, 0, 0, 7); x.stroke();
    x.strokeStyle = '#000'; x.lineWidth = 3; x.fillStyle = '#fff'; x.shadowColor = l; x.shadowBlur = 10; x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(14, -12, 17, -4, 17, 3); x.bezierCurveTo(17, 14, -17, 14, -17, 3); x.bezierCurveTo(-17, -4, -14, -12, 0, -30); x.closePath(); x.fill(); x.stroke();
    x.shadowBlur = 0; x.fillStyle = '#17b88a'; x.fillRect(-3, -9, 6, 16); x.fillRect(-8, -4, 16, 6);
    return c.toDataURL();
  })();
  // tokens: violet wizard token, crimson technique token
  const _tokenImg = tokenImg; let TOKS = '';
  window.tokenImg = tokenImg = function (school) {
    if (school !== 'sorc') return _tokenImg(); if (TOKS) return TOKS;
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), oct = r => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .3927; x.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r); } x.closePath(); };
    oct(45); x.fillStyle = '#000'; x.fill(); const g = x.createRadialGradient(40, 34, 4, 48, 48, 46); g.addColorStop(0, '#ff9a9a'); g.addColorStop(1, '#7a0a18'); oct(40); x.fillStyle = g; x.fill();
    oct(33); x.strokeStyle = '#ffd45e'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#ffd45e'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(36, 34, 24, 22, 6) : x.rect(36, 34, 24, 22); x.fill(); x.stroke(); x.beginPath(); x.moveTo(36, 50); x.quadraticCurveTo(30, 56, 38, 62); x.stroke();
    return TOKS = c.toDataURL();
  };

  /* ---------------- shadow beast silhouettes (emoji as an ink mask) ---------------- */
  function beastSil(e, S, ink, rim) {
    const key = e + S + ink + rim; if (SILS[key]) return SILS[key];
    const m = document.createElement('canvas'); m.width = m.height = S; const mx = m.getContext('2d');
    mx.font = (S * .78) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText(e, S / 2, S * .54);
    mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#000'; mx.fillRect(0, 0, S, S);
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    // glowing rim: the mask, tinted, offset in 8 directions
    const tint = document.createElement('canvas'); tint.width = tint.height = S; const tx = tint.getContext('2d'); tx.drawImage(m, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = rim; tx.fillRect(0, 0, S, S);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; x.drawImage(tint, Math.cos(a) * 2, Math.sin(a) * 2); }
    const body = document.createElement('canvas'); body.width = body.height = S; const bx = body.getContext('2d'); bx.drawImage(m, 0, 0); bx.globalCompositeOperation = 'source-in';
    const g = bx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#3a2a6a'); g.addColorStop(.55, ink); g.addColorStop(1, '#05020c'); bx.fillStyle = g; bx.fillRect(0, 0, S, S);
    x.drawImage(body, 0, 0); return SILS[key] = c;
  }

  /* ---------------- helpers ---------------- */
  const ghosted = w => w.ghostT > 0;
  const inArena = (x, y) => ({ x: clamp(x, F.x0 + 14, F.x1 - 14), y: clamp(y, F.y0 + 14, F.y1 - 10) });
  const has = (w, k) => w.book && w.book.includes(k);
  function dazeW(w, t) { if (!(w.stunImm > 0) && t > 0) { w.stunT = Math.max(w.stunT || 0, t); w.stunImm = t + .9; } }
  function clapFx(x, y, c) { inkRing(x, y, c, 2, 6, 40); burst(x, y - 36 * HS, 16, ['#fff', c], 200, 4, .35); }
  function isDamaging(k) { const s = STATS[k]; return !!(s && (s.dmg || s.dps)) && k !== 'sanctum'; }
  function addFx(o) { fx.push(Object.assign({ t: 0 }, o)); }

  /* ---------------- cast hook ---------------- */
  const _cast = cast;
  let copying = false;
  /* targeting setting (set per ability on the Your Abilities screen): auto, caster, or summons first (strongest / weakest) */
  const SUMMON_K = new Set(['z', 'g', 'a']);
  const TGT_ABLE = ['fireball', 'lightning', 'meteor', 'ricochet', 'beam', 'sinkhole', 'storm', 'bubbles', 'flies', 'gravity', 'dissect', 'rush', 'zombies', 'zodiac', 'archer'];
  const SUMMON_AIM = new Set(['zombies', 'zodiac', 'archer']);   // these choose targets as they fight, not when cast
  window.TGT_ABLE = TGT_ABLE;
  function tgtPref(w, k) { return w && w.me && typeof PR !== 'undefined' && PR.tgt && PR.tgt[k] || 'auto'; }
  window.tgtPref = tgtPref;
  function prefMob(w, k) { const p = tgtPref(w, k); if (p !== 'strong' && p !== 'weak') return null;
    const mobs = enemyCreatures(w).filter(c => SUMMON_K.has(c.k) && c.e.x !== undefined); if (!mobs.length) return null;
    return mobs.reduce((a, b) => (p === 'strong' ? b.e.hp > a.e.hp : b.e.hp < a.e.hp) ? b : a).e; }
  /* Titan Shell breaks like an ice wall: glassy shards in the shell's colour fly out, bounce and fade. Harmless. */
  let sshards = [];
  function shellShatter(w) {
    const ac = auraOf(w), n = 34;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd(-.1, .1), hgt = rnd(10, 95) * HS, v = rnd(70, 190);
      sshards.push({ x: w.x + Math.cos(a) * 20 * SC, y: w.y + Math.sin(a) * 8, z: hgt, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .55, vz: rnd(40, 200), rot: rnd(0, 6.3), vr: rnd(-12, 12), sz: rnd(4, 9), t: 0, land: 0, l: ac[0], m: ac[1], sh: Math.random() * 3 | 0 }); }
    burst(w.x, w.y - 50 * HS, 26, ['#ffffff', ac[0], ac[1]], 240, 5, .6, 200);
    inkRing(w.x, w.y, ac[1], 2, 20, 56, .5);
  }
  function updShards(dt) {
    for (const c of sshards) { c.t += dt;
      if (!c.land) { c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.vz -= 560 * dt; c.rot += c.vr * dt;
        if (c.z <= 0) { if (Math.abs(c.vz) > 120 && !c.bounced) { c.bounced = 1; c.z = 0; c.vz = -c.vz * .3; c.vx *= .5; c.vy *= .5; } else { c.z = 0; c.land = c.t; } } } }
    sshards = sshards.filter(c => !c.land || c.t - c.land < 1.6);
  }
  function drawShards(x) {
    for (const c of sshards) { const fade = c.land ? Math.max(0, 1 - (c.t - c.land) / 1.6) : 1; if (fade <= 0) continue;
      x.save(); x.translate(c.x, c.y - c.z); x.rotate(c.rot); x.globalAlpha = fade * .95; const s = c.sz;
      x.beginPath(); if (c.sh === 0) { x.moveTo(0, -s * 1.3); x.lineTo(s * .7, s * .5); x.lineTo(-s * .6, s * .7); } else if (c.sh === 1) { x.moveTo(-s, -s * .3); x.lineTo(s * .2, -s); x.lineTo(s, s * .4); x.lineTo(-s * .3, s * .8); } else { x.moveTo(0, -s); x.lineTo(s * .45, 0); x.lineTo(0, s * 1.2); x.lineTo(-s * .45, 0); }
      x.closePath(); const g = x.createLinearGradient(-s, -s, s, s); g.addColorStop(0, c.l); g.addColorStop(.55, c.m); g.addColorStop(1, c.m); x.fillStyle = g; x.fill();
      x.strokeStyle = '#07020d'; x.lineWidth = 1.3; x.stroke();
      if (!c.land && ((c.t * 14 + c.sz) % 3) < .6) { x.globalCompositeOperation = 'lighter'; x.fillStyle = '#ffffff'; x.globalAlpha = fade * .6; x.fill(); }
      x.restore();
      if (c.land) { x.save(); x.globalAlpha = fade * .25; x.fillStyle = c.m; x.beginPath(); x.ellipse(c.x, c.y + 1, c.sz * .9, c.sz * .35, 0, 0, 7); x.fill(); x.restore(); } }
  }
  /* Unrestrained Collapse: the singularity bursts into a violet sphere that erases everything in it, caster included */
  let pblasts = [];
  function unboundBlast(c, neutral) {   // neutral: set off by a Draw orb meeting a Repel orb, so it belongs to nobody and hurts everyone inside
    const w = c.o, f = w.foe, R = 125, dmg = neutral ? c.dmg : c.dmg * 1.8; SRC = 'polarity';
    pblasts.push({ x: c.x, y: c.y - 36 * HS, r0: performance.now(), R, seed: Math.random() * 99 });
    shake = Math.max(shake, 26); slow = Math.min(slow, .05); setTimeout(() => { if (!ended) slow = 1; }, 260);
    text(c.x, c.y - 120 * HS, neutral ? 'COLLAPSE!' : 'UNRESTRAINED', '#e8d8ff', true); try { sfx('shatter', { x: c.x }); if (neutral) sfx('boom', { x: c.x, vol: 1.1 }); } catch (e) {}
    const inR = e => Math.hypot(e.x - c.x, (e.y - c.y) * 1.2) < R;
    if (!f.dead && !ghosted(f) && inR(f)) { const d = Math.hypot(f.x - c.x, f.y - c.y) || 1; damage(f, dmg, (f.x - c.x) / d * 700, (f.y - c.y) / d * 700, '#e8d8ff'); }
    for (const e of enemyCreatures(w)) if (e.e.x !== undefined && inR(e.e)) hurtCreature(e.e, e.k, dmg, 'arcane');
    if (neutral) for (const e of enemyCreatures(f)) if (e.e.x !== undefined && inR(e.e)) hurtCreature(e.e, e.k, dmg, 'arcane');
    for (const wl of walls) for (const cr of wl.cr) if (!cr.gone && inR(cr)) { cr.gone = 1; const live = wl.cr.filter(q => !q.gone).length; wl.hp = live ? Math.min(wl.hp, wl.max * live / wl.cr.length) : 0; }
    // the caster feels it too: full damage inside the blast, a 30% backlash from anywhere else
    if (neutral) { if (!w.dead && !ghosted(w) && inR(w)) { const d = Math.hypot(w.x - c.x, w.y - c.y) || 1; damage(w, dmg, (w.x - c.x) / d * 700, (w.y - c.y) / d * 700, '#e8d8ff'); } }
    else if (!w.dead) { const keep = w.shell; w.shell = null; damage(w, inR(w) ? dmg : dmg * .3, 0, 0, '#c48cff'); w.shell = keep; text(w.x, w.y - 100 * HS, 'BACKLASH', '#c48cff'); }
    scar('crack', c.x, c.y, { s: 2 }); scar('scorch', c.x, c.y, { r: R * .8, c: '#1a0a30', a: .5 });
    if (typeof beamScar === 'function') for (let i = 0; i < 6; i++) { const an = i / 6 * 6.283 + rnd(-.3, .3), l = R * rnd(.6, .95); const d0 = beamScar({ x: c.x, y: c.y }, { x: c.x + Math.cos(an) * l, y: c.y + Math.sin(an) * l * .6 }, false, 1.1, true); d0.life = 5; decals.push(d0); }
    for (let i = 0; i < 40; i++) { const an = rnd(0, 6.283), rr = rnd(10, R); decals.push({ k: 'ember', x: c.x + Math.cos(an) * rr, y: c.y + Math.sin(an) * rr * .6, t: 0, life: rnd(2.5, 4.5), s: rnd(.8, 1.4) }); }
    for (let i = 0; i < 50; i++) { const an = rnd(0, 6.283), v = rnd(200, 560); P({ x: c.x, y: c.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7 - 120, color: ['#ffd45e', '#ff8a3a', '#ffffff'][i % 3], size: rnd(1.5, 3.5), life: rnd(.5, 1.1), grav: 420 }); }
    for (let i = 0; i < 70; i++) { const an = rnd(0, 6.283), v = rnd(160, 520); P({ x: c.x, y: c.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7, color: ['#c48cff', '#ffffff', '#ff4a4a', '#6fd3ff', '#2a0a5a'][i % 5], size: rnd(2, 6), life: rnd(.4, 1) }); }
  }
  function drawPBlasts(x) {
    for (const b of pblasts) {
      const t = (performance.now() - b.r0) / 1000, k = Math.min(1, t / .9); if (k >= 1) continue;
      x.save();
      if (t < .09) { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
      x.translate(b.x, b.y);
      const grow = 1 - Math.pow(1 - Math.min(1, t / .35), 3), Rr = b.R * (.25 + .9 * grow), fade = k < .55 ? 1 : 1 - (k - .55) / .45;
      // the sphere: white-hot edge, violet body, a hole of nothing in the middle
      x.globalAlpha = fade; x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, 0, Rr * .2, 0, 0, Rr * 1.15); g.addColorStop(0, 'rgba(120,40,255,.15)'); g.addColorStop(.55, 'rgba(170,90,255,.55)'); g.addColorStop(.85, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(196,140,255,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, Rr * 1.15, Rr * .95, 0, 0, 7); x.fill();
      // red and blue halves twisting into each other at the rim
      x.lineWidth = 5; x.lineCap = 'round'; for (const [cc, ph] of [['#ff4a4a', 0], ['#6fd3ff', Math.PI]]) { x.strokeStyle = cc; x.beginPath(); x.ellipse(0, 0, Rr, Rr * .82, 0, t * 9 + ph, t * 9 + ph + 2.4); x.stroke(); }
      // light rays tearing outward
      for (let i = 0; i < 18; i++) { const an = i / 18 * 6.283 + b.seed, l0 = Rr * .9, l1 = Rr * (1.25 + .5 * Math.sin(b.seed * 3 + i * 2.3)); x.strokeStyle = i % 2 ? 'rgba(255,255,255,.9)' : 'rgba(196,140,255,.8)'; x.lineWidth = 2 + (i % 3); x.beginPath(); x.moveTo(Math.cos(an) * l0, Math.sin(an) * l0 * .82); x.lineTo(Math.cos(an) * l1, Math.sin(an) * l1 * .82); x.stroke(); }
      x.globalCompositeOperation = 'source-over';
      // erased core
      x.fillStyle = '#04000c'; x.beginPath(); x.ellipse(0, 0, Rr * .38 * (1 - k * .7), Rr * .32 * (1 - k * .7), 0, 0, 7); x.fill(); x.strokeStyle = '#f0e6ff'; x.lineWidth = 2; x.stroke();
      // shockwave rings
      for (let j = 0; j < 3; j++) { const kk = Math.max(0, Math.min(1, (t - j * .08) / .6)); if (kk <= 0 || kk >= 1) continue; x.globalAlpha = (1 - kk) * fade; x.strokeStyle = ['#ffffff', '#c48cff', '#120a24'][j]; x.lineWidth = 6 - j * 1.5; x.beginPath(); x.ellipse(0, 36 * HS, b.R * (.4 + kk * 1.2), b.R * (.4 + kk * 1.2) * .45, 0, 0, 7); x.stroke(); }
      x.restore();
    }
    pblasts = pblasts.filter(b => performance.now() - b.r0 < 900);
  }
  /* Collapse wind-up. Where each orb is at wind-up progress kk (0..1): they hang either side of the charge point,
     then circle it faster and tighter until they touch at .78. sd = +1 red, -1 blue. */
  function collapsePos(c, kk, sd) {
    let r = 64, th = c.a + sd * Math.PI / 2;
    if (kk < .3) r = 64 * Math.min(1, kk / .1) + Math.sin(kk * 40) * 1.5;
    else { const u = Math.min(1, (kk - .3) / .48); r = 64 * (1 - Math.pow(u, 1.6)); th += 1.9 * 6.283 * u * u; }
    return [Math.cos(th) * r, Math.sin(th) * r * .72];
  }
  function drawCollapseWind(x, c) {
    const k = Math.min(1, c.t / c.wind), t = c.t, W0 = cv.width / dpr, H0 = cv.height / dpr, gyo = 36 * HS;
    const SIDES = [[1, '255,74,74', '#ff4a4a', '#ffd0d0'], [-1, '59,155,255', '#3b9bff', '#d0e6ff']];
    x.save(); x.translate(c.x, c.y - gyo); x.lineCap = 'round'; x.lineJoin = 'round';
    // a ward circle on the floor under the charge: red and blue halves chasing each other, tightening as it builds
    { const gr = 74 * Math.min(1, k / .25) * (k > .78 ? 1 - (k - .78) / .22 * .6 : 1), spin = t * (3 + k * 14); x.save(); x.translate(0, gyo); x.scale(1, .42); x.globalAlpha = .55 + .3 * k;
      for (const [sd, rgb] of SIDES) { x.strokeStyle = `rgba(${rgb},.9)`; x.lineWidth = 3 + 3 * k; x.beginPath(); x.arc(0, 0, gr, spin + (sd > 0 ? 0 : Math.PI), spin + (sd > 0 ? 0 : Math.PI) + 2.5); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.2; x.setLineDash([4, 6]); x.lineDashOffset = -t * 60; x.beginPath(); x.arc(0, 0, gr * .72, 0, 7); x.stroke(); x.setLineDash([]); x.restore(); }
    if (k < .78) {
      const u = k < .3 ? 0 : (k - .3) / .48, size = (k < .3 ? Math.min(1, k / .18) : 1 + .4 * u), pts = SIDES.map(sd => collapsePos(c, k, sd[0]));
      x.globalCompositeOperation = 'lighter';
      // comet tails: where each orb has just been
      for (let si = 0; si < 2; si++) { const [sd, rgb] = SIDES[si]; for (let j = 14; j >= 1; j--) { const kk = k - j * .011; if (kk <= 0) continue; const q = collapsePos(c, kk, sd), f = 1 - j / 15; x.fillStyle = `rgba(${rgb},${.34 * f})`; x.beginPath(); x.arc(q[0], q[1], (4 + 7 * f) * size, 0, 7); x.fill(); } }
      // the pull between them: a taut violet thread, then crackling arcs once they start to circle
      { const [p0, p1] = pts; x.strokeStyle = `rgba(196,140,255,${.25 + .5 * u})`; x.lineWidth = 1.5 + 2 * u; x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke();
        if (k > .3) for (let n = 0; n < 2; n++) { if (Math.sin(t * 61 + n * 2.1) < -.2) continue; x.strokeStyle = n ? 'rgba(255,255,255,.95)' : 'rgba(210,170,255,.9)'; x.lineWidth = n ? 1.4 : 3; x.beginPath(); x.moveTo(p0[0], p0[1]); for (let i = 1; i < 6; i++) { const f = i / 6, j = Math.sin(t * 97 + i * 12.9 + n * 5) * (10 + 8 * u) * Math.sin(f * 3.14); x.lineTo(p0[0] + (p1[0] - p0[0]) * f - (p1[1] - p0[1]) * .0 + j * .6, p0[1] + (p1[1] - p0[1]) * f + j); } x.lineTo(p1[0], p1[1]); x.stroke(); } }
      // the orbs themselves
      for (let si = 0; si < 2; si++) { const [sd, rgb, col, pale] = SIDES[si], [ox, oy] = pts[si], r = 10 * size;
        const g = x.createRadialGradient(ox, oy, 0, ox, oy, r * 3.4); g.addColorStop(0, '#ffffff'); g.addColorStop(.28, col); g.addColorStop(.6, `rgba(${rgb},.35)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.beginPath(); x.arc(ox, oy, r * 3.4, 0, 7); x.fill();
        if (sd > 0) { x.strokeStyle = `rgba(255,200,200,.9)`; x.lineWidth = 1.8; for (let i = 0; i < 7; i++) { const an = i * .9 + t * 5, l0 = r * 1.2, l1 = r * (1.9 + .7 * Math.sin(t * 30 + i * 2)); x.beginPath(); x.moveTo(ox + Math.cos(an) * l0, oy + Math.sin(an) * l0); x.lineTo(ox + Math.cos(an) * l1, oy + Math.sin(an) * l1); x.stroke(); } }    // red: jagged spikes pushing out
        else { x.strokeStyle = `rgba(200,225,255,.85)`; x.lineWidth = 1.6; for (let i = 0; i < 4; i++) { const ph = (t * 2.2 + i / 4) % 1, rr = r * (2.6 - 1.7 * ph), a0 = i * 1.57 + t * 7; x.globalAlpha = ph; x.beginPath(); x.arc(ox, oy, rr, a0, a0 + 1.3); x.stroke(); } x.globalAlpha = 1; } }                                             // blue: arcs spiralling in
      x.globalCompositeOperation = 'source-over';
      for (let si = 0; si < 2; si++) { const [sd, rgb, col, pale] = SIDES[si], [ox, oy] = pts[si], r = 10 * size; x.fillStyle = sd > 0 ? '#1a0206' : '#020a1a'; x.beginPath(); x.arc(ox, oy, r * .5, 0, 7); x.fill(); x.strokeStyle = pale; x.lineWidth = 1.5; x.stroke(); }
    } else if (k < .9) {   // the smash: a white core swelling out of the contact, shock rings, speed lines
      const v = (k - .78) / .12, e = 1 - Math.pow(1 - v, 3), R = 14 + 44 * e;
      x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, 0, 0, 0, 0, R * 2.4); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, 'rgba(255,255,255,.95)'); g.addColorStop(.6, 'rgba(196,140,255,.7)'); g.addColorStop(1, 'rgba(120,60,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * 2.4, 0, 7); x.fill();
      for (let i = 0; i < 18; i++) { const an = i / 18 * 6.283 + Math.sin(i * 7.3) * .15, r0 = R * 1.3 + 30 * v, r1 = r0 + 26 + 40 * ((i * 37) % 10) / 10; x.strokeStyle = `rgba(255,255,255,${.9 * (1 - v)})`; x.lineWidth = 2 + (i % 3); x.beginPath(); x.moveTo(Math.cos(an) * r0, Math.sin(an) * r0 * .8); x.lineTo(Math.cos(an) * r1, Math.sin(an) * r1 * .8); x.stroke(); }
      for (const [sd, rgb] of SIDES) { x.strokeStyle = `rgba(${rgb},${1 - v * .5})`; x.lineWidth = 5; const a0 = t * 26 + (sd > 0 ? 0 : Math.PI); x.beginPath(); x.ellipse(0, 0, R * 1.15, R * .95, 0, a0, a0 + 2.2); x.stroke(); }
      x.save(); x.translate(0, gyo); x.scale(1, .42); for (let j = 0; j < 2; j++) { const vv = Math.max(0, v - j * .25); if (vv <= 0) continue; x.strokeStyle = j ? `rgba(196,140,255,${1 - vv})` : `rgba(255,255,255,${1 - vv})`; x.lineWidth = 7 * (1 - vv) + 1; x.beginPath(); x.arc(0, 0, 30 + 170 * vv, 0, 7); x.stroke(); } x.restore();
      x.globalCompositeOperation = 'source-over';
    } else {   // the implosion: everything folds into a point, a black bead with a burning rim, and then it goes
      const z = (k - .9) / .1, R = 58 * (1 - z) * (1 - z) + 7;
      x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, 0, 0, 0, 0, R * 2.2 + 10); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, 'rgba(230,200,255,.95)'); g.addColorStop(1, 'rgba(120,60,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * 2.2 + 10, 0, 7); x.fill();
      for (let j = 0; j < 3; j++) { const zz = (z + j / 3) % 1, rr = 150 * (1 - zz); x.strokeStyle = `rgba(${j === 1 ? '255,110,110' : j === 2 ? '110,180,255' : '255,255,255'},${zz * .9})`; x.lineWidth = 1.5 + 4 * zz; x.beginPath(); x.ellipse(0, 0, rr, rr * .8, 0, 0, 7); x.stroke(); }
      for (let i = 0; i < 20; i++) { const an = i / 20 * 6.283 + t * 3, r1 = 150 * (1 - z * .7), r0 = r1 * .55; x.strokeStyle = `rgba(255,255,255,${.25 + .6 * z})`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(Math.cos(an) * r1, Math.sin(an) * r1 * .8); x.lineTo(Math.cos(an) * r0, Math.sin(an) * r0 * .8); x.stroke(); }
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = '#05010f'; x.beginPath(); x.arc(0, 0, 5 + 9 * z, 0, 7); x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = 2.5; x.stroke();
    }
    x.restore();
    if (k > .9) { x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = `rgba(255,255,255,${.22 * (k - .9) / .1})`; x.fillRect(0, 0, W0, H0); x.restore(); }   // the arena whites out just before it fires
  }
  /* Rushdown crit impact frame: a split-second inverted black-and-white frame with manga speed lines on the hit point */
  let impacts = [];
  function drawImpacts(x) {
    for (const f of impacts) {
      f.t = (performance.now() - f.r0) / 1000; const k = f.t / .22; if (k >= 1) continue;
      x.save();
      if (f.t < .07) { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'saturation'; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
      const ink = f.t < .07 ? '#fff' : '#120610';
      x.translate(f.x, f.y); x.globalAlpha = f.t < .07 ? 1 : 1 - (k - .3) / .7;
      for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + Math.sin(f.seed + i * 7.1) * .12, r0 = 26 + 18 * (.5 + .5 * Math.sin(f.seed * 3 + i * 4.3)) + k * 30, r1 = r0 + 90 + 80 * (.5 + .5 * Math.sin(f.seed + i * 2.7)), wd = 2.5 + 3 * (.5 + .5 * Math.sin(i * 5.9 + f.seed));
        x.beginPath(); x.moveTo(Math.cos(a - .025) * r0, Math.sin(a - .025) * r0); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a + .025) * r0, Math.sin(a + .025) * r0); x.closePath(); x.fillStyle = ink; x.fill(); x.lineWidth = wd * .2; }
      // the hit itself: a hard white star with an ink rim
      const R = 22 * (1 - k * .5); x.rotate(f.a); x.beginPath();
      for (let i = 0; i < 16; i++) { const rr = i % 2 ? R * .38 : R * (i % 4 ? 1 : 1.5); x.lineTo(Math.cos(i / 16 * 6.283) * rr, Math.sin(i / 16 * 6.283) * rr * .8); }
      x.closePath(); x.fillStyle = f.t < .07 ? '#000' : '#fff'; x.fill(); x.strokeStyle = f.t < .07 ? '#fff' : '#120610'; x.lineWidth = 3; x.stroke();
      x.restore();
    }
    impacts = impacts.filter(f => f.t < .22);
  }
  const DECOY_AIM_SKIP = new Set(['ghost', 'blink', 'shield', 'hourglass', 'ringfire', 'burnbody', 'totem', 'healspring', 'orbs', 'mirror', 'gale']);
  function lureOf(w, k) {
    if (k !== 'rush' && !SUMMON_AIM.has(k) && TGT_ABLE.includes(k)) { const m = prefMob(w, k); if (m) return m; }   // the player's "summons first" setting
    if (DECOY_AIM_SKIP.has(k) || (TECH[k] && k !== 'dissect') || typeof decoys === 'undefined') return null;
    const live = decoys.filter(d => d.o !== w && !d.gone); if (!live.length || Math.random() >= .66) return null;   // decoys fool the attacker 66% of the time
    return live[Math.random() * live.length | 0];
  }
  const LOOP_ONCE = { ghost: 'GHOST SPENT', shield: 'SHIELD SPENT', hourglass: 'HOURGLASS SPENT', titan: 'SHELL SPENT', counter: 'STANCE SPENT' };
  window.LOOP_ONCE = LOOP_ONCE;
  // the draft never offers a second copy of a once-per-loop ability
  try { ['doubletake', 'polarity', 'sanctum', 'chosen'].concat(Object.keys(LOOP_ONCE)).forEach(k => ONE_COPY.add(k)); } catch (e) {}
  window.cast = cast = function (w, k) {
    if (!copying) w.castN = (w.castN || 0) + 1;
    if (k !== 'blink' && !copying) w.blinkHaste = 0;     // turns taken, for once-per-loop rules
    if (k === 'flies' && !copying) w.flyN = (w.flyN || 0) + 1;
    // Quick Draw was spent early: this cast only refills it (no swap, no clap)
    if (k === 'doubletake' && w.qdSpent) { w.qdSpent = 0; w.qdFill = .6; text(w.x, w.y - 80 * HS, 'REFILL', '#ffb0b0'); w.recoil = .2; addFx({ k: 'refill', w, life: .6 }); return; }
    const loop = Math.floor((w.castN - 1) / Math.max(1, w.book.length));
    if (k === 'doubletake') { if (w.dtLoop === loop) { text(w.x, w.y - 80 * HS, 'ALREADY SWAPPED', '#bbb'); return; } w.dtLoop = loop; }
    if (k === 'polarity') { if (w.polLoop === loop) { text(w.x, w.y - 80 * HS, 'POLARITY SPENT', '#bbb'); return; } w.polLoop = loop;
      if (w.bndSpent) { w.bndSpent = 0; w.boundary = 1; text(w.x, w.y - 80 * HS, 'BOUNDARY REFILLED', '#bcd2ff'); addFx({ k: 'refill', w, life: .6 }); return; } }
    if (k === 'sanctum') { const rest = U(w, k, 'rite') ? 1 : 2; if (w.sancLoop >= 0 && loop - w.sancLoop < rest) { text(w.x, w.y - 80 * HS, loop === w.sancLoop ? 'SANCTUM SPENT' : 'SANCTUM RESTING', '#bbb'); return; } w.sancLoop = loop; }
    // once per loop, so stacked defences can't loop forever (Ghost Form, Spell Shield, Hourglass, Titan Shell, Counter Stance)
    if (LOOP_ONCE[k]) { w.once = w.once || {}; if (w.once[k] === loop) { text(w.x, w.y - 80 * HS, LOOP_ONCE[k], '#bbb'); return; } w.once[k] = loop; }
    // Disoriented: the cast is aimed at a random spot (or one of the caster's own creatures)
    let dz = null; if (w.dizzyT > 0 && w.foe && !copying) { const f = w.foe, own = enemyCreatures(f).filter(c => c.e.x !== undefined), t = own.length && Math.random() < .5 ? own[Math.random() * own.length | 0].e : { x: rnd(F.x0 + 20, F.x1 - 20), y: rnd(F.y0 + 20, F.y1 - 20) }; dz = { x: f.x, y: f.y }; f.x = t.x; f.y = t.y; }
    // Mirror Image: an enemy decoy draws the aim of every aimed spell (and Dissection / Grand Bisection) while it stands
    const lu = dz || copying ? null : lureOf(w, k), f0 = w.foe, lp = lu ? { x: f0.x, y: f0.y } : null; if (lu) { f0.x = lu.x; f0.y = lu.y; }
    try {
      try { _cast(w, k); } finally { if (dz) { w.foe.x = dz.x; w.foe.y = dz.y; } }
      if (TECH[k]) techCast(w, k); else { if (k === 'healspring') castSpring(w); spellSeal(w, k); }
    } finally { if (lp) { f0.x = lp.x; f0.y = lp.y; } }
    if (has(w, 'chosen')) w.cPulse = 1;
    // Sanctum: the next damaging cast also lands as a wide blast on the enemy
    if (k !== 'sanctum' && isDamaging(k) && k !== 'rush') { const st = STATS[k]; sanctumEcho(w, st.dmg ? S(w, k, 'dmg') : S(w, k, 'dps') * 1.5, null, COL[SP[k].el]); }
    // the boosted cast (and Sure Hit) only lands on an enemy standing inside your dome; it waits while they're outside
    if (w.sanctNext && k !== 'sanctum' && isDamaging(k)) { const live = domes.filter(d => d.o === w && d.t < d.dur && !d.left);
      if (!live.length) w.sanctNext = null;
      else if (!w.foe.dead && live.some(d => Math.hypot(w.foe.x - d.x, (w.foe.y - d.y) * 1.4) < d.r)) { const sn = w.sanctNext; w.sanctNext = null; domainBlast(w, k, sn); } }
    // Copy Cast: the armed side casts the same thing back at once
    const c = w.foe;
    if (!copying && c && c.copyArmed > 0 && !c.dead && !ended && k !== 'copycast') {
      c.copyArmed--; copying = true;
      const keep = c.lv[k], bonus = U(c, 'copycast', 'perfect') ? 2 : 0; c.lv[k] = clamp((w.lv[k] || 1) + bonus, 1, MAXL);
      eyeFlash(c, k); dazeW(w, S(c, 'copycast', 'stun'));
      try { _cast(c, k); if (TECH[k]) techCast(c, k); else if (k === 'healspring') castSpring(c); } finally { c.lv[k] = keep; copying = false; }
      text(c.x, c.y - 92 * HS, 'COPIED ' + SP[k].n.toUpperCase(), '#ff6b7a', true);
    }
    if (!copying && !w.dead && !ended && U(w, 'mirror', 'mcast') && !CLONE_SKIP.has(k)) mirrorCast(w, k);
  };
  /* Mirror Cast: each of your decoys repeats the spell from where it stands at 33% power, halved again for every
     extra decoy (2 decoys: 16.5% each). Rushdown and spells that act on your own body or position are not repeated. */
  const CLONE_SKIP = new Set(['rush', 'sanctum', 'doubletake', 'polarity', 'copycast', 'chosen', 'titan', 'counter', 'secondwind', 'ghost', 'blink', 'mirror', 'shield', 'hourglass', 'burnbody', 'healspring']);
  window.CLONE_SCALE = 0;
  function mirrorCast(w, k) {
    const ds = decoys.filter(d => d.o === w && !d.gone && d.echoT === undefined); if (!ds.length) return;
    const m = .33 * Math.pow(.5, ds.length - 1);
    const lists = () => [typeof projs !== 'undefined' && projs, typeof runes !== 'undefined' && runes, typeof arrows !== 'undefined' && arrows, typeof meteors !== 'undefined' && meteors, typeof swarms !== 'undefined' && swarms, typeof clouds !== 'undefined' && clouds, zombies, golems, archers, typeof firerings !== 'undefined' && firerings, typeof totems !== 'undefined' && totems, typeof pits !== 'undefined' && pits, typeof wells !== 'undefined' && wells, typeof bubbles !== 'undefined' && bubbles, typeof cannons !== 'undefined' && cannons, typeof patches !== 'undefined' && patches, slashes, orbsC, muds, cleaves].filter(Boolean);
    for (const d of ds) {
      const keep = { x: w.x, y: w.y, face: w.face, cleaveN: w.cleaveN, zn: w.zn, polN: w.polN, ceaseT: w.ceaseT, viviT: w.viviT }, before = lists().map(L => new Set(L));
      const st = window.setTimeout; copying = true; window.CLONE_SCALE = m;
      window.setTimeout = (f, ms) => st(() => { const o = window.CLONE_SCALE; window.CLONE_SCALE = m; try { f(); } finally { window.CLONE_SCALE = o; } }, ms);
      w.x = d.x; w.y = d.y; w.face = w.foe.x > d.x ? 1 : -1;
      try { _cast(w, k); if (TECH[k]) techCast(w, k); }
      catch (e) {}
      finally { window.setTimeout = st; window.CLONE_SCALE = 0; copying = false; w.x = keep.x; w.y = keep.y; w.face = keep.face; w.cleaveN = keep.cleaveN; w.zn = keep.zn; w.polN = keep.polN; w.ceaseT = keep.ceaseT; w.viviT = keep.viviT; }
      // everything the decoy just made is weaker
      lists().forEach((L, i) => { for (const o of L) { if (before[i] && before[i].has(o)) continue; o.clone = 1;
        for (const f of ['dmg', 'dps', 'wallDps', 'bodyDps']) if (typeof o[f] === 'number') o[f] *= m;
        if (L === (typeof projs !== 'undefined' && projs)) o.dmgMul = (o.dmgMul || 1) * m;
        for (const f of ['hp', 'mx', 'max', 'dmax']) if (typeof o[f] === 'number' && (L === zombies || L === golems || L === archers || L === (typeof swarms !== 'undefined' && swarms) || L === (typeof totems !== 'undefined' && totems))) o[f] = Math.max(1, o[f] * m); } });
      inkRing(d.x, d.y, '#f0d2ff', 1, 6, 30, .5); burst(d.x, d.y - 40 * HS, 10, ['#f0d2ff', '#b06bff', '#fff'], 140, 3, .35);
    }
    text(w.x, w.y - 104 * HS, 'MIRROR CAST', '#f0d2ff');
  }
  // instant hits made while a decoy is casting (and its delayed bolts) are scaled the same way
  { const _dmC = damage; window.damage = damage = function (t, d) { if (window.CLONE_SCALE && d > 0) arguments[1] = d * window.CLONE_SCALE; return _dmC.apply(this, arguments); };
    const _hcC = hurtCreature; window.hurtCreature = hurtCreature = function (c, kk, d) { if (window.CLONE_SCALE && d > 0) arguments[2] = d * window.CLONE_SCALE; return _hcC.apply(this, arguments); }; }

  /* Techniques throw a burst of ki sparks on cast; spells draw a magic seal. Both grow with the card's tier,
     and every upgrade owned adds one more element to a spell's seal. */
  const upsOf = (w, k) => (UPG[k] || []).filter(u => U(w, k, u.id)).length;
  function castFlourish(w, k) {
    const tier = tierOf(w, k), [l] = COL[SP[k].el], ups = upsOf(w, k), n = 7 + tier * 4 + ups * 2, cy = w.y - 40 * HS;
    const rays = []; for (let i = 0; i < n; i++) rays.push({ a: rnd(0, 6.283), len: rnd(16, 30) * (1 + tier * .18), kink: rnd(-.5, .5), d: rnd(0, .08) });
    addFx({ k: 'aura', w, l, m: COL[SP[k].el][1], tier, life: .42 + tier * .06 });
    for (let i = 0; i < 3 + tier * 2; i++) { const a = rnd(0, 6.283), v = rnd(150, 330) * (1 + tier * .12); P({ x: w.x, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8, color: i % 3 ? l : '#ffffff', size: rnd(1.6, 3), life: rnd(.16, .32), drag: .86 }); }
    if (tier >= 3) { addFx({ k: 'kiring', x: w.x, y: cy, l, life: .32 }); shake = Math.max(shake, 3); }
  }
  const isSorc = w => ((w.look && w.look.cls) || w.cls) === 'sorc';
  function spellSeal(w, k) {
    if (!SP[k] || TECH[k]) return; const [l, m] = COL[SP[k].el] || COL.arcane, tier = tierOf(w, k), ups = upsOf(w, k);
    if (isSorc(w)) { addFx({ k: 'aura', w, l, m, tier, life: .42 + tier * .06 }); return; }
    if (typeof hexBurst === 'function') hexBurst(w, k, l, m, tier, ups); else addFx({ k: 'mseal', x: w.x, y: w.y, l, m, tier, ups, life: .62 + ups * .05 + tier * .05, spin: rnd(0, 6.28) });
    if (tier >= 3) addFx({ k: 'pillar', x: w.x, y: w.y, l, m, life: .38 });
  }
  window.spellSeal = spellSeal; window.castFlourish = castFlourish;
  const colTag = w => { if (!U(w, 'polarity', 'collapse')) return ''; const need = U(w, 'polarity', 'rapid') ? 3 : 5; return ' ' + (w.polN % need) + '/' + need; };
  function techCast(w, k) {
    const o = w.foe, hx = w.x + w.face * 22, hy = w.y;
    castFlourish(w, k);
    if (k === 'dissect') {
      const aim = Math.atan2(o.y - w.y, o.x - w.x);
      // Grand Cleave: two casts build charge, the third is one enormous chop
      if (U(w, k, 'cleave')) { w.cleaveN = (w.cleaveN || 0) + 1; if (w.cleaveN >= cleaveNeed(w)) { w.cleaveN = 0; grandCleave(w, aim); return; } if (w.cleaveN === 1) text(w.x, w.y - 98 * HS, 'CHARGE I', '#ff8a96'); w.cdNum = 0; inkRing(w.x, w.y, '#ff3b4a', w.cleaveN, 34, 8, .5); }
      if (U(w, k, 'ceaseless')) { w.ceaseT = 1.6; w.ceaseCd = 0; }
      // Vivisection: once every other loop, cuts burst out and rebound around a Sanctum-sized area around you for 1.6s
      if (U(w, k, 'vivisect')) { const loop = Math.floor(((w.castN || 1) - 1) / Math.max(1, w.book.length));
        if (w.viviLoop === undefined || loop - w.viviLoop >= 2) { w.viviLoop = loop; const R = Math.max(96, S(w, 'sanctum', 'radius')), arms = U(w, k, 'vivi2') ? 8 : 4, a0 = rnd(0, 6.283);
          for (let j = 0; j < arms; j++) { const a = a0 + j * 6.283 / arms; mkSlash(w, w.x + Math.cos(a) * 14, w.y + Math.sin(a) * 9, a, 360, .3, .65); const sl = slashes[slashes.length - 1]; sl.vivi = { x: w.x, y: w.y, R }; sl.life = 1.6; }
          text(w.x, w.y - 112 * HS, 'VIVISECTION', '#ff8a96', true); } }
      if (U(w, k, 'triple')) [-.3, 0, .3].forEach(d => mkSlash(w, hx, hy, aim + d, 380, .65, .8)); else mkSlash(w, hx, hy, aim, 380, 1, 1);
    }
    if (k === 'sanctum') {
      const vast = U(w, k, 'vast') ? 1.5 : 1, r = S(w, k, 'radius') * (vast > 1 ? 1.4375 : 1);   /* Vast dome = the old Vast dome x1.15 on the 20% bigger base; the blast keeps x1.5 */
      const dome = { o: w, x: w.x, y: w.y, r, t: 0, dur: S(w, k, 'dur') * (U(w, k, 'linger') ? 2 : 1), hp: 100, max: 100, hit: 0, trap: [] }; domes.push(dome);
      const inD0 = e => Math.hypot(e.x - w.x, (e.y - w.y) * 1.4) < r; if (!o.dead && inD0(o)) { dome.trap.push(o); text(o.x, o.y - 96 * HS, 'TRAPPED', '#bcd2ff', true); }
      for (const c of enemyCreatures(w)) if (c.e.x !== undefined && inD0(c.e)) dome.trap.push(c.e);
      for (const wl of walls) { let n = 0; for (const c of wl.cr) if (!c.gone && inD0(c)) { c.gone = 1; n++; burst(c.x, c.y - 20 * HS, 12, wl.mud ? ['#d8c09a', '#8a6a48'] : ['#d8f6ff', '#fff'], 180, 4, .4); } if (n) { const live = wl.cr.filter(c => !c.gone).length; wl.hp = live ? Math.min(wl.hp, wl.max * live / wl.cr.length) : 0; } }
      w.sanctNext = { sure: U(w, k, 'surehit'), vast }; inkRing(w.x, w.y, COL.ward[1], 2, 20, r, .5); text(w.x, w.y - 90 * HS, 'SANCTUM', '#bcd2ff', true);
    }
    if (k === 'doubletake') doSwap(w, false);
    if (k === 'rush') {
      // 4 punches; only the combo upgrades add more (+1, +1, and the rare +2)
      const n = rushHits(w);
      // Infused Strikes: combos alternate. A normal one lights the fists; the glow lasts until the next combo, which is infused
      const infUp = U(w, k, 'infused'), inf = infUp && !!w.infused; if (inf) w.infused = 0; else if (infUp) w.infArm = 1;
      if (w.rush && w.rush.ph !== 'back') { w.rush.n += n; w.rush.inf = w.rush.inf || inf; }   // cast again mid-combo: it just keeps going
      else w.rush = { ph: 'dash', t: 0, dashT: 0, n, done: 0, cd: 0, gap: .135, side: 1, fl: 0, inf, tg: null, tier: tierOf(w, k) };
      text(w.x, w.y - 86 * HS, inf ? 'BLAZING RUSH!' : 'RUSH!', inf ? '#ffb347' : '#ff6b6b', inf);
    }
    if (k === 'counter') {
      const held = U(w, k, 'store');
      if (held && w.counter) { w.braceT = 3; text(w.x, w.y - 104 * HS, 'BRACED', '#ffe08a', true); inkRing(w.x, w.y, '#ffe08a', 2, 20, 46, .6); }
      w.counter = { t: held ? 1e9 : S(w, k, 'dur') + (U(w, k, 'patient') ? 1.5 : 0), held, dmg: S(w, k, 'dmg') * (U(w, k, 'riposte') ? 2 : 1), stun: U(w, k, 'riposte') ? 1.1 : .7, deflect: U(w, k, 'deflect'), redirect: U(w, k, 'redirect'), age: 0 };
      text(w.x, w.y - 90 * HS, held ? 'STANCE HELD' : 'COUNTER STANCE', '#ffd6d2'); inkRing(w.x, w.y, '#ffd6d2', 1, 40, 14, .5);
    }
    if (k === 'polarity') {
      w.polN = (w.polN || 0) + 1; const str = U(w, k, 'field') ? 1.4 : 1;
      if (U(w, k, 'collapse') && w.polN % (U(w, k, 'rapid') ? 3 : 5) === 0) {
        const a = Math.atan2(o.y - w.y, o.x - w.x); { let L = 0; for (let q = 0; q < 900; q += 6) { const px = w.x + Math.cos(a) * q, py = w.y + Math.sin(a) * q; if (px < F.x0 - 30 || px > F.x1 + 30 || py < F.y0 - 40 || py > F.y1 + 30) break; L = q; }   // journey to the edge, for Unrestrained Collapse
          orbsC.push({ o: w, x: w.x + Math.cos(a) * 20, y: w.y + Math.sin(a) * 20, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 2.9 + 1, wind: 1, dmg: S(w, k, 'dmg') * 2.4, hit: new Set(), t: 0, a, sx: w.x + Math.cos(a) * 20, sy: w.y + Math.sin(a) * 20, L, unbound: U(w, k, 'unbound') }); }
        text(w.x, w.y - 90 * HS, 'COLLAPSE', '#c48cff', true); shake = Math.max(shake, 4);
      } else if (w.polN % 2) { // Draw
        if (U(w, k, 'drag') && !ghosted(o) && !o.dead) { if (o.shell) { o.shell = null; o.shellDown = 1; shellShatter(o); text(o.x, o.y - 110 * HS, 'RIPPED OUT', '#9fb8ff', true); try { sfx('shatter', { x: o.x }); } catch (e) {} } const d0 = dist(w, o) || 1; o.drag = { by: w, t: 0, dur: .62, a0: Math.atan2(o.y - w.y, o.x - w.x), r0: d0, dir: Math.random() < .5 ? 1 : -1, dmg: S(w, k, 'dmg') }; if (o.rush) o.rush = null; text(o.x, o.y - 96 * HS, 'CRESCENT DRAG', '#6fd3ff', true); }
        else {   // Draw: a blue orb forms on the enemy and hauls them (and their creatures) back to you, slamming them into any wall on the way
          const a = rnd(0, 6.283), held = [];
          if (!o.dead && !ghosted(o) && !anchored(o)) { held.push({ e: o, k: 'wiz' }); if (o.rush) o.rush = null; }
          for (const c of enemyCreatures(w)) if (c.e.x !== undefined && c.k !== 'd' && Math.hypot(c.e.x - o.x, c.e.y - o.y) < 60) held.push({ e: c.e, k: c.k });
          orbsC.push({ o: w, draw: 1, vx: 0, vy: 0, x: o.x + Math.cos(a) * 8, y: o.y + Math.sin(a) * 5, sp: 250 * str, life: 3, t: 0, dmg: S(w, k, 'dmg'), held, hitW: new Set(), hit: new Set() });
          for (let i = 0; i < 18; i++) { const an = rnd(0, 6.283), v = rnd(40, 140); P({ x: o.x, y: o.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7, color: ['#3b9bff', '#bfe6ff', '#061030'][i % 3], size: rnd(2, 4), life: rnd(.3, .6) }); }
        }
        text(w.x, w.y - 86 * HS, 'DRAW' + colTag(w), '#6fd3ff');
      } else { // Repel: an orb fired straight ahead that shoves back whatever it passes through
        const a = Math.atan2(o.y - w.y, o.x - w.x); w.repelT = 1.3 * str; addFx({ k: 'repel', x: w.x + Math.cos(a) * 16, y: w.y + Math.sin(a) * 16, life: .3, r: 44 }); shake = Math.max(shake, 5); text(w.x, w.y - 86 * HS, 'REPEL' + colTag(w), '#ff5a5a');
        orbsC.push({ o: w, repel: 1, late: U(w, k, 'late'), bounced: 0, str, x: w.x + Math.cos(a) * 22, y: w.y + Math.sin(a) * 22, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, life: 4.5, dmg: S(w, k, 'dmg'), hit: new Set(), t: 0, a });
      }
    }
    if (k === 'zodiac') summonBeast(w);
    if (k === 'earthm') castEarth(w);
    if (k === 'chosen') { w.cPulse = 1.4; if (!w.chosenSaid) { w.chosenSaid = 1; text(w.x, w.y - 96 * HS, 'CHOSEN ONE', '#bff0ff', true); } }
    if (k === 'titan') {
      const max = S(w, k, 'hp') * (U(w, k, 'fortified') ? 1.8 : 1);
      if (w.shellDown) { w.shellDown = 0; w.shellForm = 1.2; text(w.x, w.y - 92 * HS, 'REFORMING…', '#9fb8ff'); }
      else if (w.shell) { const add = U(w, k, 'mend') ? max : max * .5; w.shell.max = max; w.shell.hp = Math.min(max, w.shell.hp + add); w.shell.mend = .6; text(w.x, w.y - 92 * HS, 'MENDED', '#bcd2ff'); }
      else { w.shell = { hp: max, max, t: 0, form: 0, mend: 0 }; shake = Math.max(shake, 6); text(w.x, w.y - 96 * HS, 'TITAN SHELL', '#bcd2ff', true); }
    }
    if (k === 'secondwind') {
      const mul = U(w, k, 'torrent') ? 2 : U(w, k, 'surge') ? 1.5 : 1;
      const prevSw = w.sw && w.sw.t < w.sw.dur ? w.sw : null;   // a second cast while still tuning adds its time and heals 15% faster
      w.sw = { t: 0, dur: S(w, k, 'dur') + (prevSw ? prevSw.dur - prevSw.t : 0), rate: S(w, k, 'heal') * mul * (prevSw ? 1.15 : 1), steel: U(w, k, 'steel') }; w.swPause = 0;
      text(w.x, w.y - 90 * HS, 'SPIRIT TUNING', '#b8ffcf', true); inkRing(w.x, w.y, '#b8ffcf', 2, 30, 8, .5);
      if (U(w, k, 'recall') && (w.dmgSince || 0) > 0) { const got = healW(w, w.dmgSince * (U(w, k, 'recall3') ? .5 : U(w, k, 'recall2') ? .25 : .125)); if (got >= .5) text(w.x + 16, w.y - 70 * HS, '+' + Math.round(got), '#7dffa8', true); }
      w.dmgSince = 0;
    }
    if (k === 'copycast') { addFx({ k: 'glint', x: w.x + w.face * 2, y: w.y - 48 * SC, life: .4 }); w.copyArmed = U(w, k, 'twice') ? 2 : 1; w.copyGlow = 1; text(w.x, w.y - 86 * HS, 'WATCHING…', '#ff8a96'); }
  }

  /* ---------------- healing ---------------- */
  function healW(w, amt) {
    if (w.dead || ended || amt <= 0) return 0; const before = w.hp; w.hp = Math.min(w.maxHp, w.hp + amt); const got = w.hp - before;
    w.healAcc = (w.healAcc || 0) + got; w.healT = (w.healT || 0);
    return got;
  }
  function healUnit(e, amt, max) { if (!(e.hp > 0) || !(max > 0)) return; e.hp = Math.min(max, e.hp + amt); }
  function castSpring(w) {
    const k = 'healspring', r = S(w, k, 'radius') * (U(w, k, 'wide') ? 1.4 : 1);
    const sp2 = springs.some(sp => sp.o === w && sp.t < sp.dur);   // a second spring while yours still flows is 15% stronger and lasts 1s longer
    springs.push({ o: w, x: w.x, y: w.y, r, t: 0, dur: S(w, k, 'dur') + (U(w, k, 'deep') ? 2 : 0) + (sp2 ? 1 : 0), rate: S(w, k, 'heal') * (sp2 ? 1.15 : 1), shared: U(w, k, 'shared'), purify: U(w, k, 'purify') });
    text(w.x, w.y - 90 * HS, 'HEALING SPRING', '#b8ffe8', true); inkRing(w.x, w.y, COL.life[1], 2, 8, r, .62);
  }
  const SQ = .62, inSpring = (sp, x, y) => Math.hypot(x - sp.x, (y - sp.y) / SQ) < sp.r;
  /* movement hook (called from the main loop): hurt casters drift back into their own spring */
  window.moveMod = function (w) {
    let mx = 0, my = 0;
    for (const sp of springs) if (sp.o === w && sp.t < sp.dur - .3 && w.hp < w.maxHp) { const dx = sp.x - w.x, dy = sp.y - w.y, d = Math.hypot(dx, dy / SQ) || 1; if (d > sp.r * .45) { mx += dx / d * 150; my += dy / d * 150; } }
    return [mx, my];
  };

  /* ---------------- Dissection ---------------- */
  function mkSlash(w, x0, y0, a, sp, mult, sz) {
    const tier = tierOf(w, 'dissect');
    slashes.push({ o: w, x: x0, y: y0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1, dmg: S(w, 'dissect', 'dmg') * mult, hit: new Set(), keen: U(w, 'dissect', 'keen'), cut: U(w, 'dissect', 'cutter'), sting: U(w, 'dissect', 'sting'), tested: new Set(), pierce: U(w, 'dissect', 'rend') ? 2 : 0, sz: sz * (1 + (tier - 1) * .16) * (U(w, 'dissect', 'broad') ? 1.3 : 1), wd: U(w, 'dissect', 'broad') ? 1.3 : 1, tier });
  }
  // a spell sliced in two: both halves drift apart and fizzle
  function cutSpell(x0, y0, cols, a) {
    addFx({ k: 'cut', x: x0, y: y0, a, c: cols, life: .6 }); text(x0, y0 - 26, 'CUT!', '#ffffff', true); shake = Math.max(shake, 5);
    for (let i = 0; i < 12; i++) P({ x: x0, y: y0, vx: rnd(-140, 140), vy: rnd(-140, 60), color: cols[i % cols.length], size: rnd(2, 5), life: rnd(.25, .5), grav: 200 });
  }
  function cleaveNeed(w) { return U(w, 'dissect', 'swift') ? 3 : 5; }
  /* Grand Bisection: no beam. After a short wind-up one giant crescent launches and travels down the arena,
     cutting each thing as the blade reaches it. The first cut triggers an impact frame. */
  function grandCleave(w, a) {
    cleaves.push({ o: w, x: w.x, y: w.y, a, t: 0, wind: .24, d: 0, pd: 0, L: 660, spd: 1050, hit: new Set(), dmg: S(w, 'dissect', 'dmg') * 3.5 * (U(w, 'dissect', 'narrow') ? 1.5 : 1), sting: U(w, 'dissect', 'sting'), sure: U(w, 'dissect', 'fated'), narrow: U(w, 'dissect', 'narrow'), trail: [] });
    text(w.x, w.y - 104 * HS, 'GRAND BISECTION', '#ffffff', true); w.recoil = .5; shake = Math.max(shake, 5);
  }
  function cleaveStep(c, dt) {
    c.t += dt; if (c.t < c.wind) return; const w = c.o, f = w.foe;
    if (!c.go) { if (w.dead) { c.d = c.L; c.end = c.t; return; } c.go = 1; shake = Math.max(shake, 8); try { sfx('c_dissect', { x: w.x }); } catch (e) {} }
    if (c.d >= c.L) { if (!c.end) c.end = c.t; return; }
    c.pd = c.d; c.d = Math.min(c.L, c.d + c.spd * dt);
    const ca = Math.cos(c.a), sa = Math.sin(c.a), W = c.narrow ? 14 : 40;
    const reach = (px, py, wd) => { const dx = px - c.x, dy = py - c.y, al = dx * ca + dy * sa; return al > c.pd - 10 && al <= c.d + 8 && Math.abs(dx * sa - dy * ca) < (wd || W); };
    const cut = () => { if (!c.impT) { c.impT = c.t; shake = Math.max(shake, 18); slow = Math.min(slow, .06); setTimeout(() => { if (!ended) slow = 1; }, 130); } };
    SRC = 'dissect';
    const sureHit = c.sure && !c.narrow && !f.dead && !c.hit.has(f) && (() => { const al = (f.x - c.x) * ca + (f.y - c.y) * sa; return (al > c.pd - 10 && al <= c.d + 8) || c.d >= c.L; })();   // Inevitable Cut: lands when the blade draws level, wherever they stand
    if (!f.dead && !c.hit.has(f) && (reach(f.x, f.y) || sureHit)) { c.hit.add(f); if (ghosted(f) && !c.sure) text(f.x, f.y - 70 * HS, 'PHASED', '#bff'); else { if (c.sure) text(f.x, f.y - 112 * HS, 'INEVITABLE', '#ff8a96', true); cut(); if (w.me && typeof PR !== 'undefined') { PR.stats = PR.stats || {}; PR.stats.cleaves = (PR.stats.cleaves || 0) + 1; } const h0 = f.hp; damage(f, c.dmg, ca * 420, sa * 420, '#c9fff4'); if (c.sting && f.hp < h0) addBleed(f); scar('splash', f.x, f.y + 6, { s: 1.4 }); if (window.bloodSplat && f.hp < h0) bloodSplat(f, c.a); } }
    for (const e of enemyCreatures(w)) if (!c.hit.has(e.e) && reach(e.e.x, e.e.y, W + 4)) { c.hit.add(e.e); cut(); hurtCreature(e.e, e.k, c.dmg, 'slash'); }
    for (const z of zombies) if (z.o !== w && z.hp > 0 && z.rise < 1 && !c.hit.has(z) && reach(z.x, z.y, W + 4)) { c.hit.add(z); cut(); hurtCreature(z, 'z', c.dmg, 'slash'); }
    for (const wl of walls) if (wl.o !== w) { let n = 0; for (const cr of wl.cr) if (!cr.gone && reach(cr.x, cr.y, W - 6)) { cr.gone = 1; n++; burst(cr.x, cr.y - 25 * HS, 14, wl.mud ? ['#d8c09a', '#8a6a48', '#fff'] : ['#d8f6ff', '#fff'], 200, 4, .5); } if (n) { cut(); const live = wl.cr.filter(q => !q.gone).length; wl.hp = live ? Math.min(wl.hp, wl.max * live / wl.cr.length) : 0; } }
    for (const dm of domes) if (dm.o !== w && dm.t < dm.dur && reach(dm.x, dm.y, dm.r)) { dm.t = dm.dur; cut(); text(dm.x, dm.y - 110 * HS, 'SANCTUM CUT', '#ffd6d2', true); }
    for (const p of projs) if (p.o !== w && p.life > 0 && reach(p.x, p.y + 40 * HS)) { p.life = 0; cutSpell(p.x, p.y, ['#ffb347', '#ff5a1f', '#fff'], c.a); }
    for (const r of runes) if (r.o !== w && r.life > 0 && reach(r.x, r.y)) { r.life = 0; cutSpell(r.x, r.y - 36 * HS, ['#f0d2ff', '#b06bff', '#fff'], c.a); }
    for (const q of arrows) if (q.o !== w && q.life > 0 && reach(q.x, q.y + 40 * HS)) { q.life = 0; cutSpell(q.x, q.y, ['#e0fffb', '#5fe0d0', '#fff'], c.a); }
    for (const q of bubbles) if (q.o !== w && !q.dead && reach(q.x, q.y)) { q.dead = 1; cutSpell(q.x, q.y - 30 * HS, ['#d8f070', '#9fd04a', '#fff'], c.a); }
    for (const q of slashes) if (q.o !== w && q.life > 0 && reach(q.x, q.y)) { q.life = 0; cutSpell(q.x, q.y - 36 * HS, ['#ffd6d2', '#ff3b4a', '#fff'], c.a); }
    for (const q of orbsC) if (q.o !== w && q.life > 0 && reach(q.x, q.y)) { q.life = 0; cutSpell(q.x, q.y - 36 * HS, ['#c48cff', '#6fd3ff', '#fff'], c.a); }
    // ink smoke and embers peel off the blade as it flies
    const fx0 = c.x + ca * c.d, fy0 = c.y + sa * c.d - 30 * HS;
    for (let i = 0; i < 5; i++) { const o = rnd(-34, 34); P({ x: fx0 - sa * o - ca * rnd(0, 30), y: fy0 + ca * o * .7, vx: -ca * rnd(20, 90) + rnd(-20, 20), vy: -sa * rnd(20, 90) - rnd(8, 40), color: i % 3 ? '#12060c' : '#3a0a14', size: rnd(6, 11), life: rnd(.5, 1), glow: false, grow: 2.2, drag: .9, fade: .5 }); }
    for (let i = 0; i < 3; i++) { const o = rnd(-34, 34); P({ x: fx0 - sa * o, y: fy0 + ca * o * .7, vx: -sa * rnd(-160, 160), vy: ca * rnd(-160, 160) - 30, color: i % 2 ? '#ffffff' : '#ff3b4a', size: rnd(2, 3.5), life: rnd(.2, .45) }); }
  }

  /* ---------------- creatures cut in half ---------------- */
  let halves = [];
  function splitUnit(z) {
    const big = z.beast ? z.beast.sz : 1, cutH = (z.beast ? 20 : 24) * big * SC, snap = Object.assign({}, z, { x: 0, y: 0, hp: z.mx || 1, mx: z.mx || 1, rise: 1, flash: 0, lunge: 0, sink: 0, shockT: 0, frozen: 0, noFx: 1 });
    const a = rnd(0, 6.283), v = rnd(110, 230);
    const wav = Array.from({ length: 9 }, () => rnd(-1, 1)), wide = (z.beast ? 13 : 10) * big * SC;
    halves.push({ z: snap, part: 'bot', x: z.x, y: z.y, vx: 0, vy: 0, h: 0, vh: 0, rot: 0, vr: (Math.random() < .5 ? 1 : -1) * 3.2, cutH, t: 0, life: 1.3, wav, wide });
    if (window.bloodPool) bloodPool(z.x, z.y, z.beast ? 'shade' : 'blood', 1.3);
    halves.push({ z: snap, part: 'top', x: z.x, y: z.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, h: 2, vh: rnd(150, 240), rot: 0, vr: rnd(-11, 11), cutH, t: 0, life: 1.5, wav, wide });
    addFx({ k: 'cut', x: z.x, y: z.y - cutH, a: rnd(-.4, .4), c: z.beast ? ['#8a6cff', '#140a30', '#fff'] : ['#9fe37a', '#2a5a1c', '#fff'], life: .35 });
    for (let i = 0; i < 12; i++) P({ x: z.x + rnd(-8, 8), y: z.y - cutH + rnd(-3, 3), vx: rnd(-120, 120), vy: rnd(-150, -20), color: z.beast ? ['#8a6cff', '#3a2a6a'][i % 2] : ['#5a8a3a', '#3a5a24', '#7a1a1a'][i % 3], size: rnd(2.5, 4.5), life: rnd(.35, .7), grav: 420, glow: false });
  }
  const _hurtZ = hurtZ;
  window.hurtZ = hurtZ = function (z, d, by, kind) {
    if (z.o && domes.some(dm => dm.o === z.o && dm.t < dm.dur && !dm.left && Math.hypot(z.x - dm.x, (z.y - dm.y) * 1.4) < dm.r)) d *= .85;
    const alive = z.hp > 0, r = _hurtZ.call(this, z, d, by, kind);
    if (alive && z.hp <= 0 && kind === 'slash' && halves.length < 40) { splitUnit(z); for (const c of corpses) if (!c._seen && Math.hypot(c.x - z.x, c.y - z.y) < 4 && c.t < .05) c.t = 9; }
    return r;
  };
  function halvesUpdate(dt) { for (const h of halves) { h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; h.vx *= .985; h.vy *= .985; if (h.part === 'top') { h.vh -= 620 * dt; h.h += h.vh * dt; if (h.h <= 0) { if (!h.landed) { h.landed = 1; if (window.bloodPool) bloodPool(h.x, h.y, h.z.beast ? 'shade' : 'blood', 1.1); } h.h = 0; h.vh = 0; h.vx *= .6; h.vy *= .6; h.vr *= .5; } h.rot += h.vr * dt; } else h.rot = Math.min(1.45, Math.abs(h.rot) + Math.abs(h.vr) * dt) * Math.sign(h.vr); } halves = halves.filter(h => h.t < h.life); }
  function drawHalves(x) {
    for (const h of halves) { const al = h.t > h.life - .4 ? (h.life - h.t) / .4 : 1; x.save(); x.globalAlpha = Math.max(0, al); x.translate(h.x, h.y - h.h);
      if (h.part === 'top') { x.translate(0, -h.cutH); x.rotate(h.rot); x.translate(0, h.cutH); x.beginPath(); x.rect(-70, -160, 140, 160 - h.cutH); }
      else { x.rotate(h.rot); x.beginPath(); x.rect(-70, -h.cutH, 140, h.cutH + 14); }
      x.save(); x.clip(); try { drawZombie(h.z); } catch (e) {} x.restore();
      // the cut face: a wavy, glistening red edge (dark ink for shadow-beasts)
      if (h.wav) { const W2 = h.wide, y0 = -h.cutH, n = h.wav.length - 1, beast = h.z.beast, path = () => { x.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, px = -W2 + u * W2 * 2, py = y0 + h.wav[i] * 2.4 + Math.sin(u * 9 + h.t * 6) * .8; i ? x.lineTo(px, py) : x.moveTo(px, py); } };
        x.lineCap = 'round'; x.lineJoin = 'round'; path(); x.strokeStyle = '#07020d'; x.lineWidth = 5.5; x.stroke(); path(); x.strokeStyle = beast ? '#3a1470' : '#9a0f1f'; x.lineWidth = 3.6; x.stroke(); path(); x.strokeStyle = beast ? '#8a6cff' : '#e8303f'; x.lineWidth = 1.4; x.stroke();
        if (h.t < .9 && Math.random() < .35) P({ x: h.x + rnd(-W2, W2) * .8, y: h.y - h.h + y0, vx: rnd(-20, 20), vy: rnd(-10, 40), color: beast ? '#5a3aa0' : '#8a0f1c', size: rnd(1.4, 2.6), life: rnd(.3, .6), grav: 600, glow: false }); }
      x.restore(); }
  }

  /* ---------------- Rushdown ---------------- */
  const tAlive = t => t.k === 'wiz' ? !t.e.dead : t.k === 'wall' ? (t.e.hp > 0 && !t.e.dead && walls.includes(t.e)) : t.k === 'd' ? !t.e.gone : t.e.hp > 0;
  const tPos = t => t.k === 'wall' ? t : t.e;
  function rushPick(w) {           // nearest enemy unit by default; the player's targeting setting can pick the caster or the strongest / weakest summon
    const o = w.foe, pref = tgtPref(w, 'rush'); if (pref === 'caster') return { k: 'wiz', e: o };
    const all = [{ k: 'wiz', e: o }].concat(enemyCreatures(w).map(c => ({ k: c.k, e: c.e }))), hp = t => t.k === 'd' ? 1 : (t.e.hp || 0);
    if (pref === 'strong' || pref === 'weak') { const mobs = all.filter(t => SUMMON_K.has(t.k)); if (mobs.length) return mobs.reduce((a, b) => (pref === 'strong' ? hp(b) > hp(a) : hp(b) < hp(a)) ? b : a); return { k: 'wiz', e: o }; }
    return all.reduce((a, b) => dist(w, b.e) < dist(w, a.e) ? b : a);
  }
  function rushWall(w, t) {        // an enemy ice wall standing between the fighter and the target
    const p = tPos(t), blk = wallBetween(w, { x: w.x, y: w.y }, { x: p.x, y: p.y });
    return blk ? { k: 'wall', e: blk.wl, x: blk.x, y: blk.y, behind: t } : null;
  }
  function rushMudF(w) { if (U(w, 'rush', 'pain')) return 1; let f = 1; for (const m of muds) if (m.o !== w && m.t < m.dur && Math.hypot(w.x - m.x, (w.y - m.y) / SQ) < m.r) f = Math.min(f, m.quag ? .35 : .55); return f; }
  function rushHits(w) { return 4 + (U(w, 'rush', 'endless') ? 2 : 0); }
  /* two Rushdowns meet head on: shockwave, smoke, both thrown back and both hurt */
  function rushClash(a, b) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = dist(a, b) || 1, ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
    const pa = S(a, 'rush', 'dmg'), pb = S(b, 'rush', 'dmg');
    for (const w of [a, b]) { if (w.rush && w.rush.inf) w.infused = 0; w.rush = null; w.jump = 0; w.infArm = 0; }
    SRC = 'rush'; damage(a, pb * 1.6, -ux * 700, -uy * 700, '#ffffff'); damage(b, pa * 1.6, ux * 700, uy * 700, '#ffffff');
    addFx({ k: 'clash', x: mx, y: my - 40 * HS, life: 1.1, a: Math.atan2(uy, ux) });
    for (let i = 0; i < 26; i++) { const an = rnd(0, 6.283), v = rnd(40, 170); P({ x: mx + Math.cos(an) * 8, y: my - rnd(0, 26) * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .5 - rnd(0, 30), color: ['#d9d3e6', '#b9b2c8', '#8f88a3', '#ffffff'][i % 4], size: rnd(7, 13), life: rnd(.7, 1.3), glow: false, grow: 2.4, drag: .9, fade: .5 }); }
    for (let i = 0; i < 18; i++) { const an = rnd(0, 6.283), v = rnd(260, 520); P({ x: mx, y: my - 40 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v, color: i % 2 ? '#ffffff' : '#ffe08a', size: rnd(2, 3.5), life: rnd(.2, .4) }); }
    for (let i = 0; i < 8; i++) decals.push({ k: 'ember', x: mx + rnd(-40, 40), y: my + rnd(-18, 18), t: -rnd(0, .3), life: 1.6, s: rnd(.6, .9) });
    comics.push({ x: mx + 8, y: my - 112 * HS, w: 'CLASH!', t: 0, life: 1.2, rot: -.12, sc: 1.05 });
    shake = Math.max(shake, 16); slow = Math.min(slow, .12); setTimeout(() => { if (!ended) slow = 1; }, 230);
    if (typeof flashScreen === 'function') flashScreen();
    try { sfx('c_rush', { x: mx }); } catch (e) {}
  }
  window.rushClash = rushClash;
  function rushUpdate(w, dt) {
    const r = w.rush, o = w.foe; r.t += dt;
    if (o.dead || r.t > 9) { w.rush = null; w.jump = 0; return; }
    if (r.ph === 'back') {
      const k2 = r.bt / .32; r.bt += dt; w.x += r.bx * (1 - k2) * 520 * dt; w.y += r.by * (1 - k2) * 520 * dt; const q = inArena(w.x, w.y); w.x = q.x; w.y = q.y; w.jump = Math.sin(Math.min(1, k2) * Math.PI) * 9; w.vx = w.vy = 0;
      if (k2 >= 1) { w.rush = null; w.jump = 0; } return;
    }
    if (w.stunT > 0 && U(w, 'rush', 'pain')) { w.stunT = 0; if (!r.painTxt) { r.painTxt = 1; text(w.x, w.y - 96 * HS, 'IGNORE THE PAIN', '#ff8a8a', true); } }
    if (w.stunT > 0) { if (r.hold) return; w.rush = null; text(w.x, w.y - 86 * HS, 'INTERRUPTED', '#ccc'); return; }     // a stun breaks the combo (a swap only pauses it)
    r.hold = 0;
    { const ro = o.rush, live = q => q && (q.ph === 'dash' || q.ph === 'hit') && q.tg && q.tg.k === 'wiz';   // both fists meet: clash before anyone lands a punch
      if (live(r) && live(ro) && !o.dead && dist(w, o) < 50) { rushClash(w, o); return; } }
    if (!r.tg || !tAlive(r.tg)) {
      const was = r.tg;
      if (was && was.k === 'wall' && was.behind && tAlive(was.behind)) r.tg = was.behind;                 // the ice broke: carry on to what was behind it
      else if (!was || was.k === 'wall' || U(w, 'rush', 'chain')) { r.tg = rushPick(w); if (was && was.k !== 'wall') text(w.x, w.y - 92 * HS, 'NEXT!', '#ffe08a', true); }   // Chain Rush: spend what is left on a new target
      else { r.ph = 'back'; r.bt = 0; const d = dist(w, o) || 1; r.bx = -(o.x - w.x) / d; r.by = -(o.y - w.y) / d; return; }
      r.ph = 'dash'; r.dashT = 0;
    }
    let tg = r.tg;
    if (r.ph === 'dash') {
      if (tg.k !== 'wall' && tgtPref(w, 'rush') === 'auto') { const nb = rushPick(w), dn = dist(w, nb.e), dc = dist(w, tPos(tg)); if (nb.e !== tg.e && dn < dc - 12) r.tg = tg = nb; }   // something nearer: go for that instead
      if (tg.k !== 'wall') { const wl = rushWall(w, tg); if (wl) r.tg = tg = wl; }                     // ice in the way: hit the ice
      const p = tPos(tg), d = Math.hypot(p.x - w.x, p.y - w.y) || 1, ux = (p.x - w.x) / d, uy = (p.y - w.y) / d, stop = tg.k === 'wiz' ? 30 : tg.k === 'wall' ? 16 : 24;
      const mv = Math.min(460 * dt * rushMudF(w), Math.max(0, d - stop)); w.x += ux * mv; w.y += uy * mv; w.face = Math.sign(p.x - w.x) || w.face; w.vx = w.vy = 0; r.dashT += dt;
      if (Math.random() < .9) P({ x: w.x - ux * 16 + rnd(-6, 6), y: w.y - rnd(10, 60) * HS, vx: -ux * 220, vy: -uy * 220, color: r.inf ? '#ffb347' : '#ffd6d2', size: 2.5, life: .2, glow: !!r.inf });
      if (r.tier >= 2 && Math.random() < .35) addFx({ k: 'after', x: w.x, y: w.y, life: .22, w });
      if (Math.hypot(p.x - w.x, p.y - w.y) <= stop + 3) { r.ph = 'hit'; r.cd = 0; }
      else if (r.dashT > 1.3) {                                                                         // ran out of dash time
        const left = Math.hypot(p.x - w.x, p.y - w.y);
        if (left < (tg.k === 'wall' ? 66 : 110)) { if (tg.k !== 'wall') { w.x = p.x - ux * stop; w.y = p.y - uy * stop; } r.ph = 'hit'; r.cd = 0; addFx({ k: 'after', x: w.x - ux * 30, y: w.y - uy * 30, life: .2, w }); }   // close: lunge in and throw the combo
        else { w.rush = null; text(w.x, w.y - 86 * HS, 'OUT OF REACH', '#ccc'); w.p = Math.max(w.p, castT(w, 'rush') * .5); return; }   // blocked far away: half the cast back
      }
    }
    if (r.ph !== 'hit') return;
    const p = tPos(tg), dd = Math.hypot(p.x - w.x, p.y - w.y) || 1;
    if (dd > 70) { r.ph = 'dash'; r.dashT = .7; return; }                                               // they slipped away: chase again, briefly
    const vx2 = (p.x - w.x) / dd, vy2 = (p.y - w.y) / dd, stop = tg.k === 'wiz' ? 30 : tg.k === 'wall' ? 16 : 24;
    if (tg.k !== 'wall') { w.x = p.x - vx2 * stop; w.y = p.y - vy2 * stop; }                            // glued to the target
    w.vx = w.vy = 0; w.face = Math.sign(p.x - w.x) || w.face; if (tg.k === 'wiz') { o.vx *= .6; o.vy *= .6; }
    r.cd -= dt; if (r.cd > 0) return;
    const jab = r.fl > 0;
    r.cd = jab ? .125 : r.gap; if (!jab && U(w, 'rush', 'relentless')) r.gap = Math.max(.045, r.gap * .7);   // Relentless: each punch 30% sooner than the last
    r.side = -r.side; w.recoil = .07;
    let last;
    if (jab) { r.fl -= .125; last = r.fl <= .001; }
    else { r.done++; const over = r.done >= r.n; if (over && U(w, 'rush', 'flurry')) { r.fl = 1; last = false; text(w.x, w.y - 92 * HS, 'FLURRY!', '#ffe08a', true); } else last = over; }
    const crit = Math.random() < (U(w, 'rush', 'flow') ? .27 : .15) + (U(w, 'rush', 'oath') ? .2 : 0), fin = last && U(w, 'rush', 'finisher');
    // flurry jabs are light and not boosted by Infused
    const dmg = S(w, 'rush', 'dmg') * (U(w, 'rush', 'momentum') ? 1 + .02 * (w.mom || 0) : 1) * (jab ? .3 : 1) * (crit ? 2 : 1) * (fin ? (jab ? 6.6 : 2) : 1) * (r.inf && !jab ? 1.5 : 1) * (U(w, 'rush', 'cornered') && w.hp < w.maxHp * .3 ? 2 : 1);   // Cornered: double below 30% health
    const px = (tg.k === 'wall' ? p.x : w.x + vx2 * (stop - 8)) - vy2 * r.side * 6, py = (tg.k === 'wall' ? p.y : w.y) - (40 + r.side * 7) * HS + vy2 * 10;
    SRC = 'rush';
    if (!(tg.k === 'wiz' && ghosted(o))) { w.mom = (w.mom || 0) + 1; if (U(w, 'rush', 'momentum') && w.mom % 10 === 0) text(w.x, w.y - 100 * HS, 'MOMENTUM +' + (w.mom * 2) + '%', '#ffe08a'); }
    if (tg.k === 'wiz') {
      if (ghosted(o)) text(px, py - 20, 'MISS', '#ccc');
      else { damage(o, dmg, vx2 * (fin ? 760 : 0), vy2 * (fin ? 760 : 0), crit ? '#ffe08a' : r.inf ? '#ffb347' : '#ffd6d2'); if (r.inf && !o.shell) { o.burn = 5; o.burnD = 2; o.burnSrc = 'rush'; } }
    } else if (tg.k === 'wall') { tg.e.hp -= dmg * 2.5; tg.e.flash = .12; burst(px, py, 6, ['#d8f6ff', '#fff'], 150, 3, .35); text(px + rnd(-6, 6), py - 14, Math.round(dmg * 2.5), '#d8f6ff'); }
    else { hurtCreature(tg.e, tg.k, dmg, 'crush'); text(px + rnd(-6, 6), py - 14, Math.round(dmg), '#ffd6d2'); }
    if (!(tg.k === 'wiz' && ghosted(o))) { sanctumEcho(w, dmg, tg.k === 'wall' ? null : tg.e, COL.ki); SRC = 'rush'; }
    if (crit && tg.k !== 'wall' && !(tg.k === 'wiz' && ghosted(o))) { impacts.push({ x: px, y: py, t: 0, r0: performance.now(), a: Math.atan2(vy2, vx2), seed: Math.random() * 99 }); shake = Math.max(shake, 14); slow = Math.min(slow, .05); setTimeout(() => { if (!ended) slow = 1; }, 90); }   // crit impact frame
    addFx({ k: crit ? 'crit' : 'punch', x: px, y: py, life: crit ? .34 : .18, a: rnd(0, 6.28), s: (jab ? .7 : 1) * (1 + (r.tier - 1) * .15), hot: r.inf });
    addFx({ k: 'jab', x: w.x, y: w.y - 40 * HS, x2: px, y2: py, life: .12, side: r.side, hot: r.inf });
    if (jab) { addFx({ k: 'after', x: w.x - vy2 * r.side * 10 - vx2 * 7, y: w.y + vx2 * r.side * 10 - vy2 * 7, life: .24, w }); addFx({ k: 'jab', x: w.x - vy2 * r.side * 10, y: w.y - 40 * HS + vx2 * r.side * 10, x2: px - vy2 * r.side * 6, y2: py + vx2 * r.side * 6, life: .2, side: -r.side, hot: r.inf }); }
    if (r.inf) for (let q = 0; q < 4; q++) fireFx.push({ x: px + rnd(-4, 4), y: py + rnd(-4, 4), vx: vx2 * 90 + rnd(-50, 50), vy: vy2 * 90 - rnd(10, 60), t: 0, life: rnd(.2, .36), s: rnd(5, 9), seed: rnd(0, 99), smoke: 0 });
    if (crit || fin) { shake = Math.max(shake, fin ? 10 : 6); text(px, py - 28, fin ? 'FINISHER!' : 'CRIT!', '#ffe08a', true); slow = Math.min(slow, .5); setTimeout(() => { if (!ended) slow = 1; }, fin ? 140 : 80); if (fin) { inkRing(px, py, '#ffe08a', 3, 8, 50); burst(px, py, 24, ['#fff6c8', '#ffb020', '#fff'], 260, 5, .5); } }
    else shake = Math.max(shake, jab ? 1.4 : 2.2);
    if (last) { r.ph = 'back'; r.bt = 0; r.bx = -vx2; r.by = -vy2; }
  }

  /* ---------------- Counter Stance ---------------- */
  const MELEE = new Set(['rush', 'zombies', 'zodiac', 'golem']);
  function doCounter(w, melee, src, redir) {
    const c = w.counter, f = w.foe; w.counter = null; w.recoil = .3;
    if (redir) { addFx({ k: 'counter', x: w.x, y: w.y - 40 * HS, life: .45 }); text(w.x, w.y - 96 * HS, 'REDIRECTED!', '#ffe08a', true); shake = Math.max(shake, 8); return; }
    addFx({ k: 'counter', x: w.x, y: w.y - 40 * HS, life: .45 }); shake = Math.max(shake, 9); slow = Math.min(slow, .4); setTimeout(() => { if (!ended) slow = 1; }, 150);
    if (!melee) { text(w.x, w.y - 96 * HS, 'DEFLECTED', '#ffd6d2', true); return; }
    text(w.x, w.y - 96 * HS, 'COUNTER!', '#ffe08a', true); SRC = 'counter';
    if (src === 'rush') { const d = dist(w, f) || 1; f.rush = null; f.jump = 0; f.stunT = Math.max(f.stunT || 0, c.stun); f.stunImm = c.stun + .9; damage(f, c.dmg, (f.x - w.x) / d * 620, (f.y - w.y) / d * 620, '#ffe08a'); }
    else { let best = null, bd = 60; for (const e of enemyCreatures(w)) { const d = dist(w, e.e); if (d < bd) { bd = d; best = e; } } if (best) { hurtCreature(best.e, best.k, c.dmg * 1.5, 'crush'); const d = dist(w, best.e) || 1; best.e.x += (best.e.x - w.x) / d * 40; best.e.y += (best.e.y - w.y) / d * 40; } }
  }

  const anchored = w => domes.some(d => d.o === w && d.t < d.dur && Math.hypot(w.x - d.x, (w.y - d.y) * 1.4) < d.r);
  function doSwap(w, early) {
    const o = w.foe; if (o.dead) return; if (anchored(o) && !U(w, 'doubletake', 'behind')) { clapFx(w.x, w.y, '#ffd6d2'); text(o.x, o.y - 96 * HS, 'ANCHORED', '#bcd2ff', true); return; } const ax = w.x, ay = w.y, keepRush = o.rush;
    clapFx(w.x, w.y, '#ffd6d2'); addFx({ k: 'after', x: ax, y: ay, life: .5, w });
    if (U(w, 'doubletake', 'behind')) { const d = dist(w, o) || 1, q = inArena(o.x - (w.x - o.x) / d * 34, o.y - (w.y - o.y) / d * 20); w.x = q.x; w.y = q.y; w.face = Math.sign(o.x - w.x) || 1; }
    else { w.x = o.x; w.y = o.y; o.x = ax; o.y = ay; clapFx(o.x, o.y, '#ffd6d2'); dazeW(o, S(w, 'doubletake', 'stun')); }
    w.vx = w.vy = 0; o.vx *= .2; o.vy *= .2;
    if (U(w, 'doubletake', 'clap') && !ghosted(o)) { SRC = 'doubletake'; damage(o, 3, 0, 0, '#ffd6d2'); }
    if (U(w, 'doubletake', 'dizzy') && !ghosted(o)) { o.dizzyT = 3; text(o.x, o.y - 108 * HS, 'DISORIENTED', '#ffd6d2'); }
    if (U(w, 'doubletake', 'abrupt') && !ghosted(o)) { o.stunT = Math.max(o.stunT || 0, 1); o.stunImm = Math.max(o.stunImm || 0, 1.9); text(o.x, o.y - 96 * HS, 'ABRUPT!', '#ffe08a', true); addFx({ k: 'stars', w: o, life: 1 }); }
    // a Rushdown in progress is not cancelled: it pauses while dazed, then dashes at its target from the new spot
    if (keepRush && keepRush.ph !== 'back') { o.rush = keepRush; keepRush.hold = 1; keepRush.ph = 'dash'; keepRush.dashT = 0; }
    // enemy projectiles aimed at our old spot keep flying straight
    for (const p of projs) if (p.o === o) { p.tgt = null; p.home = 0; }
    text(w.x, w.y - 88 * HS, early ? 'QUICK DRAW!' : 'DOUBLE TAKE', '#ffd6d2', early); shake = Math.max(shake, 4);
  }

  /* while your Sanctum stands, a hit also lands on every enemy inside the dome (except the one already struck) */
  function sanctumEcho(w, dmg, skip, cols) {
    const dm = domes.find(d => d.o === w && d.t < d.dur && !d.left); if (!dm || !(dmg > 0)) return; const inD = e => Math.hypot(e.x - dm.x, (e.y - dm.y) * 1.4) < dm.r, f = w.foe, c = (cols && cols[1]) || '#7aa6ff';
    const zap = e => { addFx({ k: 'redir', x: w.x, y: w.y - 40 * HS, x2: e.x, y2: e.y - 30 * HS, life: .22 }); burst(e.x, e.y - 30 * HS, 6, ['#fff', c], 120, 3, .3); };
    const keep = SRC; SRC = 'sanctum';
    if (f !== skip && !f.dead && !ghosted(f) && inD(f)) { zap(f); damage(f, dmg, 0, 0, '#d9c8ff'); }
    for (const e of enemyCreatures(w)) if (e.e !== skip && e.e.x !== undefined && inD(e.e)) { zap(e.e); hurtCreature(e.e, e.k, dmg, 'arcane'); }
    SRC = keep; dm.pulse = .25;
  }
  function domainBlast(w, k, sn) {
    const o = w.foe, st = STATS[k], base = st.dmg ? S(w, k, 'dmg') : S(w, k, 'dps') * 1.5, R = 105 * sn.vast, dmg = base * .8;
    const [l, m] = COL[SP[k].el] || COL.ward;
    addFx({ k: 'domain', x: o.x, y: o.y, life: .8, r: R, c: m, l, sure: sn.sure });
    text(o.x, o.y - 100 * HS, sn.sure ? 'SURE HIT' : 'SANCTUM BLAST', sn.sure ? '#ffe08a' : '#bcd2ff', true); shake = Math.max(shake, 8);
    SRC = 'sanctum';
    const insideNow = domes.some(d => d.o === w && d.t < d.dur && Math.hypot(o.x - d.x, (o.y - d.y) * 1.4) < d.r);
    if (sn.sure && insideNow) { const keep = o.shell; o.shell = null; if (!o.dead) damage(o, dmg, 0, 0, '#d9c8ff'); o.shell = keep; }
    else if (!ghosted(o) && !wallBetween(w, { x: w.x, y: w.y }, { x: o.x, y: o.y })) damage(o, dmg, 0, 0, '#d9c8ff');
    else text(o.x, o.y - 70 * HS, 'BLOCKED', '#9fb8ff');
    const inDome = e => domes.some(d => d.o === w && d.t < d.dur && Math.hypot(e.x - d.x, (e.y - d.y) * 1.4) < d.r);
    enemyCreatures(w).forEach(c => { if (Math.hypot(c.e.x - o.x, c.e.y - o.y) < R && inDome(c.e)) hurtCreature(c.e, c.k, dmg * .7, 'arcane'); });
  }

  function summonBeast(w) {
    const k = 'zodiac'; let b;
    if (U(w, k, 'cycle')) { if (!w.zbag || !w.zbag.length) w.zbag = ZODIAC.slice().sort(() => Math.random() - .5); b = w.zbag.pop(); }
    else b = ZODIAC[Math.random() * ZODIAC.length | 0];
    if (Math.random() < 1 / 12 && typeof JUGGERNAUT !== 'undefined' && !zombies.some(q => q.o === w && q.beast && q.beast.boss && q.hp > 0)) b = JUGGERNAUT;   // the rare thirteenth
    w.zn = (w.zn || 0) + 1;
    if (U(w, k, 'mend')) { const full = U(w, k, 'mend2'); for (const q of zombies) if (q.o === w && q.beast && q.hp > 0 && q.hp < q.mx) { q.hp = full ? q.mx : Math.min(q.mx, q.hp + q.mx * .5); text(q.x, q.y - 50 * HS, full ? 'MENDED' : '+50%', '#7dffa8'); burst(q.x, q.y - 20 * HS, 8, ['#7dffa8', '#fff'], 100, 3, .4); } }
    const dome = domes.find(d => d.o === w && d.t < d.dur);
    const o = w.foe, a = Math.atan2(o.y - w.y, o.x - w.x), n = (U(w, k, 'pack') && ['rat', 'rabbit', 'rooster'].includes(b.id) ? 2 : 1) * (dome && !b.boss ? 2 : 1);
    for (let i = 0; i < n; i++) {
      const ra = rnd(0, 6.283), rd = dome ? Math.sqrt(Math.random()) * dome.r * .85 : 0, q = dome ? inArena(dome.x + Math.cos(ra) * rd, dome.y + Math.sin(ra) * rd / 1.4) : inArena(w.x + Math.cos(a) * 34 + rnd(-12, 12), w.y + Math.sin(a) * 34 + rnd(-12, 12)), hp = S(w, k, 'hp') * b.hp;
      const z = { o: w, x: q.x, y: q.y, mx: hp, hp, rise: .35, cd: rnd(0, .3), t: rnd(0, 9), flash: 0, lunge: 0, beast: b, spd: b.spd, dmg: b.boss ? 20 : S(w, k, 'dmg') * b.dmg, acd: b.acd, onHit: beastHit };
      zombies.push(z); decals.push({ k: 'hole', x: q.x, y: q.y, t: 0, life: 4 });
      for (let j = 0; j < 14; j++) P({ x: q.x + rnd(-14, 14), y: q.y - rnd(0, 20), vx: rnd(-30, 30), vy: rnd(-90, -30), color: ['#8a6cff', '#140a30', '#3a2a6a'][j % 3], size: rnd(4, 8), life: rnd(.4, .8), glow: false });
    }
    text(w.x, w.y - 92 * HS, b.boss ? 'THE JUGGERNAUT' : b.n.toUpperCase(), b.boss ? '#ffe08a' : '#c9b8ff', true); if (b.boss) shake = Math.max(shake, 12); inkRing(w.x + Math.cos(a) * 34, w.y + Math.sin(a) * 34, '#8a6cff', 2, 6, 40, .5); shake = Math.max(shake, 4);
  }
  function beastHit(z, tgt, kind) {
    const b = z.beast; if (kind !== 'wiz' || tgt.ghostT > 0) return;
    const d = dist(z, tgt) || 1;
    if (b.boss) { tgt.vx += (tgt.x - z.x) / d * 720; tgt.vy += (tgt.y - z.y) / d * 720; shake = Math.max(shake, 12); text(tgt.x, tgt.y - 96 * HS, 'LAUNCHED!', '#ffe08a', true); inkRing(tgt.x, tgt.y, '#ffe08a', 3, 8, 60, .6); slow = Math.min(slow, .4); setTimeout(() => { if (!ended) slow = 1; }, 120); }
    if (b.id === 'ox' || b.ram) { tgt.vx += (tgt.x - z.x) / d * 260; tgt.vy += (tgt.y - z.y) / d * 260; }
    if (b.slow) tgt.slowT = Math.max(tgt.slowT || 0, 1.4);
    if (b.stun && Math.random() < .5) { dazeW(tgt, .4); text(z.x, z.y - 40 * HS, 'COCK-A-DOODLE!', '#ffe08a'); }
    if (b.steal) tgt.p = Math.max(0, (tgt.p || 0) - .25);
    if (b.fire) { tgt.burn = Math.max(tgt.burn || 0, 1.5); tgt.burnD = 3; tgt.burnSrc = 'zodiac'; for (let i = 0; i < 6; i++) fireFx.push({ x: z.x + Math.sign(tgt.x - z.x) * 14, y: z.y - 26 * HS, vx: (tgt.x - z.x) / d * 160 + rnd(-20, 20), vy: (tgt.y - z.y) / d * 160 - rnd(10, 40), t: 0, life: rnd(.2, .35), s: rnd(6, 9), seed: rnd(0, 99), smoke: 0 }); }
  }

  /* Rising Tempo: slower first summon, faster every summon after */
  window.castMod = function (w, k, base) {
    if (k === 'rush' && U(w, k, 'oath')) return base * .55;                     // Blood Oath: much faster Rushdown
    if (k === 'zodiac' && U(w, k, 'tempo')) return base * 1.4 * Math.max(.5 / 1.4, Math.pow(.88, w.zn || 0));
    return base;
  };

  /* ---------------- damage hook: Titan Shell absorbs direct hits ---------------- */
  const _damage = damage;
  window.damage = damage = function (w, d, kx = 0, ky = 0, col = '#fff') {
    if (w.counter && d > 0 && !w.dead && !ended && SRC !== 'counter') { const melee = MELEE.has(SRC);
      if (!melee && w.counter.redirect && w.foe && !w.foe.dead) { const f = w.foe, src = SRC; doCounter(w, false, src, true); SRC = 'counter'; addFx({ k: 'redir', x: w.x, y: w.y - 40 * HS, x2: f.x, y2: f.y - 40 * HS, life: .35 }); damage(f, d, 0, 0, '#ffe08a'); SRC = src; return; }
      if (melee || w.counter.deflect) { doCounter(w, melee, SRC); return; } }
    if (w.braceT > 0 && d > 0) d *= .6;
    if (d > 0 && U(w, 'rush', 'oath')) d /= 1.5;                                  // Blood Oath: +50% defence
    // your creatures fighting inside your Sanctum hit 15% harder
    if (d > 0 && (SRC === 'zombies' || SRC === 'zodiac' || SRC === 'golem') && w.foe && domes.some(dm => dm.o === w.foe && dm.t < dm.dur && !dm.left && Math.hypot(w.x - dm.x, (w.y - dm.y) * 1.4) < dm.r)) d *= 1.15;
    if (d > 0 && w.foe && w.foe.finalBoost) d *= 1.1;
    if (d > 0 && w.foe && w.foe.fate && !w.dead && !ended && SRC !== 'counter') { const a = w.foe; a.fate = 0; if (col !== '#ffe08a') d *= 2; text(w.x, w.y - 100 * HS, 'DESTINED CRIT!', '#bff0ff', true); addFx({ k: 'crit', x: w.x, y: w.y - 40 * HS, life: .5, a: 0, s: 1.6 }); addFx({ k: 'radiance', w: a, life: .6 }); shake = Math.max(shake, 10); }
    if (w.shell && d > 0 && !w.dead && !ended) {
      // the shell bites back: 5 damage to whatever hit it
      if (SRC !== 'titan' && SRC !== 'counter') { const src = SRC, f = w.foe; SRC = 'titan'; let bit = null;
        if (src === 'zombies' || src === 'zodiac' || src === 'golem') { let bd = 70; for (const e of enemyCreatures(w)) { const dd = dist(w, e.e); if (dd < bd) { bd = dd; bit = e; } } if (bit) { hurtCreature(bit.e, bit.k, 5, 'crush'); addFx({ k: 'redir', x: w.x, y: w.y - 50 * HS, x2: bit.e.x, y2: bit.e.y - 20 * HS, life: .2 }); } }
        if (!bit && f && !f.dead && !f.shell) { addFx({ k: 'redir', x: w.x, y: w.y - 50 * HS, x2: f.x, y2: f.y - 40 * HS, life: .22 }); _damage(f, 5, 0, 0, '#bcd2ff'); }
        SRC = src; }
      if (SRC === 'rush') d *= 2;   // fists crack the shell twice as fast
      w.shell.hp -= d; w.shell.hit = .18; text(w.x + rnd(-8, 8), w.y - 100 * HS, Math.round(d), '#9fb8ff');
      burst(w.x + rnd(-14, 14), w.y - rnd(30, 80) * HS, 8, ['#e6f0ff', '#7aa6ff'], 140, 4, .35);
      if (w.shell.hp <= 0) { w.shell = null; w.shellDown = 1; shake = Math.max(shake, 10); text(w.x, w.y - 104 * HS, 'SHELL BROKEN', '#9fb8ff', true); shellShatter(w); sfx('shatter', { x: w.x }); }
      return;
    }
    if (d > 0 && w.sw && !w.sw.steel) w.swPause = .6;
    if (d > 0 && w.rush && w.rush.ph !== 'back' && !U(w, 'rush', 'pain') && SRC !== 'rush' && !w.dead && !ended) { w.rush = null; w.jump = 0; text(w.x, w.y - 86 * HS, 'COMBO BROKEN', '#ccc'); }
    return _damage(w, d, kx, ky, col);
  };

  /* ---------------- update hook ---------------- */
  const _update = update;
  window.update = update = function (dt) {
    const prev = ents.map(w => ({ x: w.x, y: w.y }));
    const slowed = mudPre(dt);
    _update(dt);
    updShards(dt);
    // runes, orb shots and arrows that fly through an enemy swarm hurt it (swarms take half damage)
    if (typeof swarms !== 'undefined' && swarms.length && typeof hurtSwarm === 'function') for (const L of [typeof runes !== 'undefined' ? runes : [], typeof arrows !== 'undefined' ? arrows : []]) for (const r of L) { if (!(r.life > 0)) continue;
      for (const q of swarms) if (q.o !== r.o && q.hp > 0 && Math.hypot(r.x - q.x, r.y - q.y) < 26) { r.hitS = r.hitS || new Set(); if (r.hitS.has(q)) continue; r.hitS.add(q); hurtSwarm(q, r.dmg || 8); } }
    // a rushing fighter's movement belongs to the rush: undo the main loop's push-out (it shoved fighters out of their OWN walls, so dashes stalled)
    ents.forEach((w, i) => { if (w.rush && (w.rush.ph === 'dash' || w.rush.ph === 'hit') && !w.dead) { w.x = prev[i].x; w.y = prev[i].y; }
      else if (!w.dead && U(w, 'rush', 'oath') && !w.rush) { const q = inArena(prev[i].x + (w.x - prev[i].x) * 1.3, prev[i].y + (w.y - prev[i].y) * 1.3); w.x = q.x; w.y = q.y; }   // Blood Oath: 30% faster on foot
      // knocked back hard: dust drags from the feet
      const sp = Math.hypot(w.vx || 0, w.vy || 0); if (!w.dead && sp > 170 && !(w.rush && w.rush.ph !== 'back')) { const n = Math.min(3, sp / 160 | 0); for (let j = 0; j < n; j++) P({ x: w.x + rnd(-7, 7), y: w.y + rnd(-1, 3), vx: -w.vx * .12 + rnd(-20, 20), vy: -rnd(10, 35), color: ['#8a7a5a', '#a08f6c', '#6e6250'][j % 3], size: rnd(3.5, 6), life: rnd(.4, .7), glow: false, grow: 1.9, drag: .86, fade: .45 }); }
    });
    // ice walls thaw slowly unless their caster took Permafrost
    for (const wl of walls) if (!wl.mud && !wl.dead && wl.hp > 0 && !U(wl.o, 'icewall', 'permafrost')) { wl.hp -= 2.5 * dt; if (Math.random() < dt * 3) { const c = wl.cr[Math.random() * wl.cr.length | 0]; if (c && !c.gone) P({ x: c.x + rnd(-6, 6), y: c.y - rnd(4, 20) * HS, vx: 0, vy: rnd(20, 50), color: '#bfefff', size: 2, life: .5, grav: 200, glow: false }); } }
    mudPost(slowed);
    if (ended) { for (const f of fx) f.t += dt; fx = fx.filter(f => f.t < f.life); return; }
    techUpdate(dt, prev); scatterUpdate(dt); for (const f of flames) f.t += dt; flames = flames.filter(f => f.t < f.life);
  };
  function techUpdate(dt, prev) {
    { const [a, b] = ents, live = r => r && (r.ph === 'dash' || r.ph === 'hit') && r.tg && r.tg.k === 'wiz';
      if (!a.dead && !b.dead && live(a.rush) && live(b.rush) && dist(a, b) < 50) rushClash(a, b); }
    ents.forEach((w, i) => {
      if (w.dead) return; const o = w.foe;
      // Titan Shell roots you (Walking Titan: slow walk)
      if (w.shell) { w.shell.t += dt; w.shell.form = Math.min(1, w.shell.form + dt * 3); w.shell.hit = Math.max(0, (w.shell.hit || 0) - dt); w.shell.mend = Math.max(0, (w.shell.mend || 0) - dt);
        const kk = U(w, 'titan', 'walking') ? .35 : 0; w.x = prev[i].x + (w.x - prev[i].x) * kk; w.y = prev[i].y + (w.y - prev[i].y) * kk; }
      if (w.shellForm > 0) w.shellForm -= dt;
      // Draw pull
      if (w.pull && w.pull.t > 0) { w.pull.t -= dt; const b = w.pull.by, d = dist(w, b) || 1; if (d > 34) { w.x += (b.x - w.x) / d * w.pull.s * dt; w.y += (b.y - w.y) / d * w.pull.s * dt; } if (Math.random() < .5) P({ x: w.x + rnd(-10, 10), y: w.y - rnd(10, 60) * HS, vx: (b.x - w.x) / d * 120, vy: (b.y - w.y) / d * 120, color: '#6fd3ff', size: 3, life: .3 }); }
      // Ceaseless Cut
      if (w.ceaseT > 0) { w.ceaseT -= dt; w.ceaseCd -= dt; if (w.ceaseCd <= 0 && !o.dead) { w.ceaseCd = .16; const a = Math.atan2(o.y - w.y, o.x - w.x) + rnd(-.35, .35); mkSlash(w, w.x + w.face * 18, w.y, a, 400, .35, .7); } }
      if (w.rush) rushUpdate(w, dt);
      if (w.infArm && !(w.rush && w.rush.ph !== 'back')) { w.infArm = 0; w.infused = 1; text(w.x, w.y - 92 * HS, 'FISTS ALIGHT', '#ffb347'); inkRing(w.x, w.y, '#ffb347', 2, 30, 8, .5); }
      if (w.repelT > 0) w.repelT -= dt;
      if (w.braceT > 0) w.braceT -= dt;
      if (typeof M !== 'undefined' && M) (M.cnt = M.cnt || {})[w.side] = { p: w.polN || 0, c: w.cleaveN || 0 };   // remembered between rounds
      if (anchored(w)) { w.pull = null; w.drag = null; const mv = Math.hypot(w.x - prev[i].x, w.y - prev[i].y); if (mv > 5 && !(w.rush && w.rush.ph !== 'back')) { w.x = prev[i].x; w.y = prev[i].y; } if (Math.hypot(w.vx || 0, w.vy || 0) > 130) { w.vx = w.vy = 0; } }
      if (w.dizzyT > 0) { w.dizzyT -= dt; if (Math.random() < dt * 8) P({ x: w.x + rnd(-12, 12), y: w.y - 90 * HS + rnd(-4, 4), vx: rnd(-30, 30), vy: -rnd(5, 20), color: '#ffd6d2', size: 2.5, life: .4 }); }
      // an enemy Gale ends a Rushdown and throws the fighter back
      if (w.rush && w.rush.ph !== 'back' && !U(w, 'rush', 'pain')) for (const g of gales) if (g.o !== w && g.t < (g.sus ? g.dur : .5) && dist(w, g.o) < 170) { const d0 = dist(w, g.o) || 1; w.rush = null; w.jump = 0; w.vx += (w.x - g.o.x) / d0 * 560; w.vy += (w.y - g.o.y) / d0 * 560; text(w.x, w.y - 90 * HS, 'BLOWN BACK', '#9ff5e0', true); break; }
      // Crescent Drag: swung in a half circle to behind the puller, smashing whatever is in the way
      if (w.drag) { const g = w.drag, b = g.by; g.t += dt; const k = Math.min(1, g.t / g.dur), e = k * k * (3 - 2 * k), an = g.a0 + g.dir * Math.PI * e, rr = g.r0 + (58 - g.r0) * e, q = inArena(b.x + Math.cos(an) * rr, b.y + Math.sin(an) * rr * .8); w.x = q.x; w.y = q.y; w.vx = w.vy = 0; w.stunT = Math.max(w.stunT || 0, .1);
        for (const wl of walls) for (const c of wl.cr) if (!c.gone && Math.hypot(c.x - w.x, c.y - w.y) < 26) { c.gone = 1; burst(c.x, c.y - 20 * HS, 12, wl.mud ? ['#d8c09a', '#8a6a48'] : ['#d8f6ff', '#fff'], 180, 4, .4); const live = wl.cr.filter(c2 => !c2.gone).length; wl.hp = live ? Math.min(wl.hp, wl.max * live / wl.cr.length) : 0; shake = Math.max(shake, 5); }
        for (const c of enemyCreatures(b)) if (c.e.x !== undefined && Math.hypot(c.e.x - w.x, c.e.y - w.y) < 24) hurtCreature(c.e, c.k, 60, 'crush');
        if (Math.random() < .9) P({ x: w.x + rnd(-8, 8), y: w.y - rnd(10, 60) * HS, vx: rnd(-30, 30), vy: rnd(-30, 30), color: '#6fd3ff', size: 3, life: .35 });
        if (k >= 1) { w.drag = null; SRC = 'polarity'; damage(w, g.dmg, 0, 0, '#bfe9ff'); dazeW(w, .5); shake = Math.max(shake, 8); inkRing(w.x, w.y, '#6fd3ff', 2, 8, 46, .6); } }
      // Boundary: one shot stopped just before it lands
      if (w.boundary === undefined && U(w, 'polarity', 'boundary')) w.boundary = 1;
      // Boundary also stops a summon about to hit you: it freezes in place for a second
      if (w.boundary) { const near = zombies.find(z => z.o !== w && z.hp > 0 && z.rise >= 1 && !(z.stun > 0) && Math.hypot(z.x - w.x, z.y - w.y) < 30) || golems.find(g => g.o !== w && g.hp > 0 && !(g.bndT > 0) && Math.hypot(g.x - w.x, g.y - w.y) < 40);
        if (near) { w.boundary = 0; w.bndSpent = 1; near.bndT = 1; if (zombies.includes(near)) near.stun = 1; text(near.x, near.y - 70 * HS, 'BOUNDARY', '#bcd2ff', true); inkRing(w.x, w.y, '#bcd2ff', 2, 30, 36, .6); addFx({ k: 'ping', x: near.x, y: near.y - 20 * HS, life: .4 }); burst(near.x, near.y - 30 * HS, 14, ['#e6f0ff', '#7aa6ff'], 160, 3, .35); } }
      if (w.boundary) for (const p of projs) if (p.o !== w && p.life > 0 && p.held === undefined && Math.hypot(p.x - w.x, p.y + 40 * HS - w.y) < 36) { const fa = Math.atan2(o.y - w.y, o.x - w.x) + (Math.random() < .5 ? 1 : -1) * Math.PI / 2; p.held = 1; p.vx = 0; p.vy = 0; p.home = 0; p.flingA = fa; p.life = 2; w.boundary = 0; w.bndSpent = 1; text(w.x, w.y - 96 * HS, 'BOUNDARY', '#bcd2ff', true); addFx({ k: 'ping', x: p.x, y: p.y + 40 * HS, life: .4 }); inkRing(w.x, w.y, '#bcd2ff', 2, 30, 36, .6); burst(p.x, p.y, 14, ['#e6f0ff', '#7aa6ff'], 160, 3, .35); break; }
      // Spirit Arrow: the shell shoots while it stands
      if (w.shell && U(w, 'titan', 'arrow') && o && !o.dead) { w.shell.acd = (w.shell.acd === undefined ? 1 : w.shell.acd) - dt; if (w.shell.acd <= 0) { w.shell.acd = 2; const a = Math.atan2(o.y - w.y, o.x - w.x); tarrows.push({ o: w, x: w.x + Math.cos(a) * 24, y: w.y + Math.sin(a) * 24, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.6, dmg: 7 }); } }
      // bleeding casters drip blood pools
      if (w.bleeds && w.bleeds.length && typeof M !== 'undefined' && M) { w.dripT = (w.dripT || 0) - dt; if (w.dripT <= 0) { w.dripT = rnd(.22, .4); M.blood = M.blood || []; if (M.blood.length < 140) M.blood.push({ x: w.x + rnd(-8, 8), y: w.y + rnd(-3, 4), r: rnd(3, 6.5), rd: M.round, s: rnd(0, 9) }); } }
      // totals for daily challenges
      if (typeof M !== 'undefined' && M && w._hpLast !== undefined && w.hp < w._hpLast) { M.tot = M.tot || { dealt: 0, taken: 0 }; if (w.me) M.tot.taken += w._hpLast - w.hp; else M.tot.dealt += w._hpLast - w.hp; } w._hpLast = w.hp;
      if (w._hpSeen !== undefined && w.hp < w._hpSeen) w.dmgSince = (w.dmgSince || 0) + (w._hpSeen - w.hp); w._hpSeen = w.hp;
      if (w.bleeds && w.bleeds.length) { w.bleeds = w.bleeds.map(b => b - dt).filter(b => b > 0); const dps = .5 * w.bleeds.length; w.hp = Math.max(0, w.hp - dps * dt); w.bleedAcc = (w.bleedAcc || 0) + dps * dt; w.lastSrc = 'dissect';
        if (Math.random() < dt * 6 * w.bleeds.length) P({ x: w.x + rnd(-8, 8), y: w.y - rnd(20, 50) * HS, vx: rnd(-20, 20), vy: rnd(10, 40), color: Math.random() < .5 ? '#c8102e' : '#ff3b4a', size: rnd(2, 3.2), life: .5, grav: 260, glow: false });
        if (w.bleedAcc >= 1) { text(w.x + rnd(-8, 8), w.y - 70 * HS, Math.round(w.bleedAcc), '#ff5a6e'); w.bleedAcc = 0; } if (w.hp <= 0 && !w.dead && !ended) kill(w); }
      // Redirect: an enemy shot about to hit the stance is turned around and becomes yours
      if (w.counter && w.counter.redirect && o && !o.dead) { let hit = null;
        for (const p of projs) if (p.o !== w && p.life > 0 && Math.hypot(p.x - w.x, p.y + 40 * HS - w.y) < 42) { hit = p; const d = Math.hypot(o.x - p.x, o.y - p.y - 40 * HS) || 1, sp = Math.max(260, Math.hypot(p.vx, p.vy)); p.vx = (o.x - p.x) / d * sp; p.vy = (o.y - p.y - 40 * HS) / d * sp; p.o = w; p.tgt = null; break; }
        if (!hit) for (const q of slashes) if (q.o !== w && Math.hypot(q.x - w.x, q.y - w.y) < 38) { hit = q; const d = Math.hypot(o.x - q.x, o.y - q.y) || 1, sp = Math.max(320, Math.hypot(q.vx, q.vy)); q.vx = (o.x - q.x) / d * sp; q.vy = (o.y - q.y) / d * sp; q.o = w; q.hit = new Set(); break; }
        if (hit) { doCounter(w, false, null, true); addFx({ k: 'redir', x: w.x, y: w.y - 40 * HS, x2: o.x, y2: o.y - 40 * HS, life: .35 }); } }
      if (w.oathT > 0) { w.oathT -= dt; if (w.oathT <= 0) { text(w.x, w.y - 96 * HS, 'BLOOD OATH', '#ff4a5a', true); burst(w.x, w.y - 40 * HS, 22, ['#ff4a5a', '#8a0010', '#fff'], 200, 4, .5); inkRing(w.x, w.y, '#ff4a5a', 2, 10, 50, .6); } }
      if (w.infused && Math.random() < .8) for (const sx of [-1, 1]) fireFx.push({ x: w.x + sx * 9 * w.face + rnd(-2, 2), y: w.y - (sx > 0 ? 38 : 29) * SC + rnd(-2, 2), vx: rnd(-10, 10), vy: -rnd(20, 50), t: 0, life: rnd(.18, .3), s: rnd(4, 6.5), seed: rnd(0, 99), smoke: 0 });
      if (w.counter) { w.counter.t -= dt; w.counter.age += dt; if (w.counter.t <= 0) { w.counter = null; text(w.x, w.y - 86 * HS, 'stance dropped', '#bbb'); } }
      // Quick Draw: spend the next Double Take early to dodge
      if (w.reactT > 0) w.reactT -= dt;
      // incoming hits are handled in priority order: Counter Stance (Redirect, Open Palm), Titan Shell, Quick Draw, Blink
      const caught = (w.counter && (w.counter.redirect || w.counter.deflect)) || (w.shell && !w.shellDown);
      if (U(w, 'doubletake', 'quickdraw') && has(w, 'doubletake') && !w.qdSpent && !(w.stunT > 0) && !(w.reactT > 0) && !caught) {
        let threat = false;
        for (const p of projs) if (p.o !== w && p.life > 0 && Math.hypot(p.x - w.x, p.y + 40 * HS - w.y) < 46) threat = true;
        for (const s of slashes) if (s.o !== w && Math.hypot(s.x - w.x, s.y - w.y) < 40) threat = true;
        for (const m of meteors) if (m.o !== w && !m.done && m.t > m.fall - .3 && Math.hypot(w.x - m.tx, w.y - m.ty) < m.r) threat = true;
        // the dodge borrows the NEXT cast: if Double Take is the one charging right now, its charge starts over
        if (threat) { w.qdSpent = 1; w.reactT = .6; w.dtLoop = Math.floor((w.castN || 0) / Math.max(1, w.book.length)); if (w.book[w.i] === 'doubletake') w.p = 0; doSwap(w, true); }
      }
      if (w.copyGlow > 0 && !w.copyArmed) w.copyGlow = Math.max(0, w.copyGlow - dt * 3);
      if (w.qdFill > 0) w.qdFill -= dt;
      // Second Wind: personal heal over time, pauses briefly when hit
      if (w.sw) { const sw = w.sw; sw.t += dt; if (w.swPause > 0) w.swPause -= dt; else { healW(w, sw.rate * dt); if (Math.random() < dt * 9) motes.push({ x: w.x + rnd(-14, 14), y: w.y - rnd(4, 50) * HS, vy: -rnd(26, 50), t: 0, life: rnd(.6, 1), s: rnd(3, 5), c: '#b8ffcf' }); } if (sw.t >= sw.dur) w.sw = null; }
      // floating heal numbers, about twice a second
      w.healT = (w.healT || 0) + dt; if (w.healT > .5) { w.healT = 0; if (w.healAcc >= 1) { text(w.x + rnd(-10, 10), w.y - 78 * HS, '+' + Math.round(w.healAcc), '#7dffa8'); w.healAcc = 0; } }
    });
    // Healing Springs
    for (const sp of springs) {
      sp.t += dt; const w = sp.o; if (w.dead) sp.t = sp.dur;
      if (inSpring(sp, w.x, w.y)) { healW(w, sp.rate * dt); if (sp.purify) { if (w.burn > 0) { w.burn = 0; text(w.x, w.y - 96 * HS, 'CLEANSED', '#b8ffe8'); } w.slowT = 0; } }
      if (sp.shared) {
        for (const z of zombies) if (z.o === w && z.rise >= 1 && inSpring(sp, z.x, z.y)) healUnit(z, sp.rate * dt, z.mx);
        for (const g of golems) if (g.o === w && inSpring(sp, g.x, g.y)) healUnit(g, sp.rate * dt, g.max);
        for (const a of archers) if (a.o === w && inSpring(sp, a.x, a.y)) healUnit(a, sp.rate * dt, a.max);
        for (const d of decoys) if (d.o === w && !d.gone && inSpring(sp, d.x, d.y)) healUnit(d, sp.rate * dt, d.dmax);
        for (const q of swarms) if (q.o === w && inSpring(sp, q.x, q.y)) healUnit(q, sp.rate * dt, q.mx);
        for (const q of totems) if (q.o === w && inSpring(sp, q.x, q.y)) healUnit(q, sp.rate * dt, q.max);
      }
      if (Math.random() < dt * 10) { const a = rnd(0, 6.283), rr = Math.sqrt(Math.random()) * sp.r * .9; motes.push({ x: sp.x + Math.cos(a) * rr, y: sp.y + Math.sin(a) * rr * SQ, vy: -rnd(22, 44), t: 0, life: rnd(.7, 1.2), s: rnd(3, 5.5), c: '#b8ffe8' }); }
    }
    springs = springs.filter(sp => sp.t < sp.dur);
    for (const m of motes) { m.t += dt; m.y += m.vy * dt; m.x += Math.sin(m.t * 6 + m.s) * 8 * dt; }
    motes = motes.filter(m => m.t < m.life);
    // creature pulls
    for (const z of zombies) if (z.pullBy && z.pullBy.t > 0) { z.pullBy.t -= dt; const b = z.pullBy.by, d = dist(z, b) || 1; if (d > 30) { z.x += (b.x - z.x) / d * z.pullBy.s * dt; z.y += (b.y - z.y) / d * z.pullBy.s * dt; } }
    // slashes
    for (const s of slashes) {
      SRC = 'dissect'; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.cut) { const a = Math.atan2(s.vy, s.vx), roll = q => { if (s.tested.has(q)) return false; s.tested.add(q); return Math.random() < .5; };
        for (const p of projs) if (p.o !== s.o && p.life > 0 && Math.hypot(p.x - s.x, p.y + 40 * HS - s.y) < 24 && roll(p)) { p.life = 0; cutSpell(p.x, p.y, ['#ffb347', '#ff5a1f', '#fff'], a); }
        for (const q of runes) if (q.o !== s.o && q.life > 0 && Math.hypot(q.x - s.x, q.y - s.y) < 24 && roll(q)) { q.life = 0; cutSpell(q.x, q.y - 36 * HS, ['#f0d2ff', '#b06bff', '#fff'], a); }
        for (const q of arrows) if (q.o !== s.o && q.life > 0 && Math.hypot(q.x - s.x, q.y + 40 * HS - s.y) < 22 && roll(q)) { q.life = 0; cutSpell(q.x, q.y, ['#e0fffb', '#5fe0d0', '#fff'], a); }
        for (const q of slashes) if (q.o !== s.o && q.life > 0 && Math.hypot(q.x - s.x, q.y - s.y) < 22 && roll(q)) { q.life = 0; cutSpell(q.x, q.y - 36 * HS, ['#ffd6d2', '#ff3b4a', '#fff'], a); }
        for (const q of orbsC) if (q.o !== s.o && q.life > 0 && Math.hypot(q.x - s.x, q.y - s.y) < 26 && roll(q)) { q.life = 0; cutSpell(q.x, q.y - 36 * HS, ['#c48cff', '#6fd3ff', '#fff'], a); } }
      // Vivisection cuts stay inside their area and rebound off its edge, free to cut everything again after each bounce
      if (s.vivi) { const v = s.vivi, dx = s.x - v.x, dy = (s.y - v.y) * 1.4, d = Math.hypot(dx, dy);
        if (d > v.R) { const nx = dx / d, ny = dy / d, vy2 = s.vy * 1.4, dot = s.vx * nx + vy2 * ny; s.vx -= 2 * dot * nx; const ry = vy2 - 2 * dot * ny; s.vy = ry / 1.4; const k2 = (v.R - 2) / d; s.x = v.x + dx * k2; s.y = v.y + dy * k2 / 1.4; s.hit = new Set(); s.tested = new Set(); burst(s.x, s.y - 36 * HS, 5, ['#ffd6d2', '#ff3b4a', '#fff'], 120, 2.5, .25); } }
      else if (s.x < F.x0 - 20 || s.x > F.x1 + 20 || s.y < F.y0 - 30 || s.y > F.y1 + 20) s.life = 0;
      for (const c of enemyCreatures(s.o)) { if (s.hit.has(c.e)) continue; if (Math.hypot(c.e.x - s.x, c.e.y - s.y) < 22 * (s.wd || 1)) { s.hit.add(c.e); hurtCreature(c.e, c.k, s.dmg, 'slash'); burst(c.e.x, c.e.y - 20 * HS, 8, ['#fff', '#ff3b4a'], 140, 3, .3);
        // a cut stops at the first thing it hits; Rending Cut lets it carry on through two more, losing half its damage each time (Vivisection cuts keep rebounding)
        if (!s.vivi) { if (s.pierce > 0) { s.pierce--; s.dmg *= .5; inkRing(c.e.x, c.e.y, '#ff3b4a', 1, 5, 22); } else { s.life = 0; break; } } } }
      for (const wl of walls) if (wl.o !== s.o && s.life > 0 && wallD(wl, s.x, s.y) < 12 * (s.wd || 1)) {
        { const mud = wl.mud, k3 = s.keen ? 3 : 1; wl.hp -= s.dmg * k3; wl.flash = .12; s.life = 0; burst(s.x, s.y - 25 * HS, s.keen ? 16 : 10, mud ? ['#d8c09a', '#8a6a48', '#fff'] : ['#d8f6ff', '#fff'], s.keen ? 170 : 120, 3, .35); if (s.keen) text(s.x, s.y - 40 * HS, Math.round(s.dmg * k3), mud ? '#f0d6a6' : '#d8f6ff'); }   // slashes stop at walls; Keen Edge hits them 3x
      }
      // enemy domes stop slashes
      for (const dm of domes) if (dm.o !== s.o && s.life > 0 && Math.hypot(s.x - dm.x, (s.y - dm.y) * 1.4) < dm.r) { s.life = 0; dm.hp -= s.dmg * (Math.hypot(s.o.x - dm.x, (s.o.y - dm.y) * 1.4) < dm.r ? .5 : 1); dm.hit = .15; addFx({ k: 'ping', x: s.x, y: s.y, life: .3 }); }
      const f = s.o.foe; if (s.life > 0 && !s.hit.has(f) && !f.dead && Math.hypot(f.x - s.x, f.y - s.y) < 24 * (s.wd || 1)) { s.hit.add(f); if (ghosted(f)) text(f.x, f.y - 70 * HS, 'PHASED', '#bff'); else { const h0 = f.hp; damage(f, s.dmg, s.vx * .12, s.vy * .12, '#c9fff4'); scar('splash', f.x, f.y + 6, { s: .6 }); if (s.sting && f.hp < h0) addBleed(f); } if (!s.vivi) s.life = 0; }
    }
    slashes = slashes.filter(s => s.life > 0);
    for (const c of cleaves) cleaveStep(c, dt);
    // Spirit Arrows in flight
    for (const a of tarrows) { a.life -= dt; a.x += a.vx * dt; a.y += a.vy * dt; const f = a.o.foe; SRC = 'titan';
      if (!f.dead && Math.hypot(f.x - a.x, f.y - a.y) < 20) { a.life = 0; if (!ghosted(f)) damage(f, a.dmg, a.vx * .1, a.vy * .1, '#fff'); }
      for (const wl of walls) if (a.life > 0 && wl.o !== a.o && wallD(wl, a.x, a.y) < 12) { wl.hp -= a.dmg; wl.flash = .12; a.life = 0; }
      for (const dm of domes) if (a.life > 0 && dm.o !== a.o && Math.hypot(a.x - dm.x, (a.y - dm.y) * 1.4) < dm.r) { dm.hp -= a.dmg; dm.hit = .15; a.life = 0; } }
    tarrows = tarrows.filter(a => a.life > 0);
    // beasts: their own way of closing in, the Juggernaut's regeneration, and ink trails
    for (const z of zombies) { const b = z.beast; if (!b || z.hp <= 0 || z.rise < 1) continue; const tg = z.o.foe, dx = tg.x - z.x, dy = tg.y - z.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, px = -uy, py = ux; let mx = 0, my = 0; z.bt = (z.bt || 0) + dt;
      if (d > 34 && !(z.frozen > 0)) {
        if (b.path === 'zig') { const s2 = Math.sin(z.bt * 7 + (z.t || 0)); mx = px * s2 * 80; my = py * s2 * 80; }
        else if (b.path === 'weave') { const s2 = Math.sin(z.bt * 3.2); mx = px * s2 * 55; my = py * s2 * 55; }
        else if (b.path === 'circle' && d < 150) { const dir = (z.t || 0) % 2 > 1 ? 1 : -1; mx = px * dir * 70 - ux * 26; my = py * dir * 70 - uy * 26; }
        else if (b.path === 'flank' && d > 70) { const dir = (z.t || 0) % 2 > 1 ? 1 : -1; mx = px * dir * 45; my = py * dir * 45; }
        else if (b.path === 'charge') { const ph = z.bt % 2.6; if (ph > 1.7) { mx = ux * 190; my = uy * 190; if (Math.random() < .6) P({ x: z.x, y: z.y, vx: -ux * 40 + rnd(-20, 20), vy: -uy * 40 - rnd(5, 25), color: '#8a7a5a', size: rnd(3, 5), life: .4, glow: false, grow: 1.8, fade: .5 }); } else if (ph > 1.2) { mx = -ux * 30; my = -uy * 30; } }
        else if (b.path === 'pounce' && d < 120 && d > 50) { mx = ux * 120; my = uy * 120; }
        if (mx || my) { const q = inArena(z.x + mx * dt, z.y + my * dt); z.x = q.x; z.y = q.y; } }
      if (b.boss) { if (z._hp !== undefined && z.hp < z._hp) z.regT = 1; z._hp = z.hp; z.regT = (z.regT || 0) - dt; if (z.regT <= 0 && z.hp < z.mx) { z.hp = Math.min(z.mx, z.hp + z.mx * .06 * dt); if (Math.random() < dt * 5) P({ x: z.x + rnd(-14, 14), y: z.y - rnd(10, 70) * HS, vx: 0, vy: -rnd(20, 45), color: '#7dffa8', size: 2.5, life: .5 }); } z._hp = z.hp; }
      if (Math.random() < dt * 14) { const tr = BTRAIL[b.id] || BTRAIL.x; P({ x: z.x + rnd(-6, 6) * b.sz, y: z.y - rnd(2, 22) * HS * b.sz, vx: -ux * 20 + rnd(-10, 10), vy: -uy * 20 - rnd(4, 18), color: tr[Math.random() * tr.length | 0], size: rnd(2.5, 5) * Math.min(1.4, b.sz), life: rnd(.4, .8), glow: b.id === 'dragon' || b.id === 'rooster', grow: 1.4, fade: .5 }); } }
    cleaves = cleaves.filter(c => !(c.end && c.t > c.end + 1.1)); halvesUpdate(dt);
    // Sanctum domes
    for (const dm of domes) {
      dm.t += dt; const w = dm.o; if (w.dead) dm.t = dm.dur; if (dm.hit > 0) dm.hit -= dt; if (dm.pulse > 0) dm.pulse -= dt;
      const inD = (x, y) => Math.hypot(x - dm.x, (y - dm.y) * 1.4) < dm.r;
      // attacks wear the dome down; an attack made from inside the dome does half
      const wear = (amt, shooter) => { dm.hp -= amt * (shooter && inD(shooter.x, shooter.y) ? .5 : 1); dm.hit = .15; };
      for (const p of projs) if (p.o !== w && p.life > 0 && inD(p.x, p.y + 40 * HS)) { p.life = 0; wear(p.dmg || 10, p.o); addFx({ k: 'ping', x: p.x, y: p.y + 40 * HS, life: .35 }); burst(p.x, p.y, 10, ['#e6f0ff', '#7aa6ff'], 140, 3, .3); }
      for (const r of runes) if (r.o !== w && r.life > 0 && inD(r.x, r.y)) { r.life = 0; wear(r.dmg || 8, r.o); addFx({ k: 'ping', x: r.x, y: r.y, life: .35 }); }
      for (const a of arrows) if (a.o !== w && a.life > 0 && inD(a.x, a.y + 40 * HS)) { a.life = 0; wear(a.dmg || 6, a.o); addFx({ k: 'ping', x: a.x, y: a.y + 40 * HS, life: .35 }); }
      for (const c of cannons) if (c.o !== w && c.t < c.dur && c.g && inD(c.g.E.x, c.g.E.y)) wear(c.dps * dt, c.o);
      // the caster cannot leave their own Sanctum (they can move around inside it)
      { const dx = w.x - dm.x, dy = (w.y - dm.y) * 1.4, d = Math.hypot(dx, dy), lim = dm.r - 10, steering = w.me && window.STEER && STEER.p;
        if (!w.dead && !dm.left && d > lim) {
          if (steering && d > dm.r) { dm.left = 1; w.sanctNext = null; text(w.x, w.y - 96 * HS, 'LEFT THE SANCTUM', '#9fb8ff', true); inkRing(w.x, w.y, '#9fb8ff', 1, 10, 30, .5); }
          else if (!steering) { w.x = dm.x + dx / d * lim; w.y = dm.y + dy / d * lim / 1.4; w.vx *= .3; w.vy *= .3; } } }
      // enemies caught inside when it went up cannot leave until it falls
      for (const e of dm.trap) { if (e.dead || e.hp <= 0) continue; const dx = e.x - dm.x, dy = (e.y - dm.y) * 1.4, d = Math.hypot(dx, dy), lim = dm.r - 8; if (d > lim) { e.x = dm.x + dx / d * lim; e.y = dm.y + dy / d * lim / 1.4; if (e.vx !== undefined) { e.vx *= .3; e.vy *= .3; } } }
      if (dm.hp <= 0 && dm.t < dm.dur) { dm.t = dm.dur; text(dm.x, dm.y - 110 * HS, 'SANCTUM BROKEN', '#bcd2ff', true); shake = Math.max(shake, 10); burst(dm.x, dm.y - 50 * HS, 40, ['#e6f0ff', '#7aa6ff', '#1a2a6a'], 280, 6, .8, 200); try { sfx('shatter', { x: dm.x }); } catch (e) {} }
    }
    domes = domes.filter(d => d.t < d.dur);
    // Collapse orbs
    // a Draw orb meeting a Repel orb, whoever cast them: the two forces fuse and go off as a Collapse blast where they touch
    for (const a of orbsC) if (a.draw && a.life > 0) for (const b of orbsC) if (b.repel && b.life > 0 && a.life > 0 && Math.hypot(a.x - b.x, a.y - b.y) < 30) {
      a.life = 0; b.life = 0; a.fused = b.fused = 1; for (const h of a.held || []) h.gone = 1;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; if (typeof flashScreen === 'function') flashScreen(); impacts.push({ x: mx, y: my - 36 * HS, t: 0, r0: performance.now(), a: Math.atan2(b.vy, b.vx), seed: Math.random() * 99 });
      unboundBlast({ o: a.o, x: mx, y: my, dmg: (a.dmg + b.dmg) * 2.16 }, true); }
    for (const c of orbsC) {
      if (c.fused) continue;
      SRC = 'polarity'; c.t += dt; c.life -= dt;
      if (c.wind && !c.launched) {   // wind-up in four beats: the two orbs form, spiral in, smash, then implode and fire
        const w = c.o, k = c.t / c.wind;
        if (!w.dead) { c.x = w.x + Math.cos(c.a) * 22; c.y = w.y + Math.sin(c.a) * 22; }   // the charge rides with the caster
        if (c.t >= c.wind) { c.launched = 1; c.t0 = c.t;
          const f = w.foe; if (f && !f.dead) c.a = Math.atan2(f.y - c.y, f.x - c.x);   // it fires at where the enemy is now
          c.vx = Math.cos(c.a) * 150; c.vy = Math.sin(c.a) * 150; c.sx = c.x; c.sy = c.y;
          { let L = 0; for (let q = 0; q < 900; q += 6) { const px = c.x + Math.cos(c.a) * q, py = c.y + Math.sin(c.a) * q; if (px < F.x0 - 30 || px > F.x1 + 30 || py < F.y0 - 40 || py > F.y1 + 30) break; L = q; } c.L = L; }
          shake = Math.max(shake, 18); slow = Math.min(slow, .06); setTimeout(() => { if (!ended) slow = 1; }, 170); if (typeof flashScreen === 'function') flashScreen();
          impacts.push({ x: c.x, y: c.y - 36 * HS, t: 0, r0: performance.now(), a: c.a, seed: Math.random() * 99 });
          addFx({ k: 'collapse0', x: c.x, y: c.y - 36 * HS, life: .5 }); inkRing(c.x, c.y, '#ffffff', 2, 8, 120, .5); inkRing(c.x, c.y, '#c48cff', 2, 14, 170, .5);
          for (let i = 0; i < 56; i++) { const an = c.a + rnd(-1.2, 1.2) + (i % 3 ? 0 : Math.PI), v = rnd(180, 560); P({ x: c.x, y: c.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .75, color: ['#ff4a4a', '#3b9bff', '#ffffff', '#c48cff'][i % 4], size: rnd(1.8, 4.2), life: rnd(.35, .85), grav: 120, drag: .95 }); }
          try { sfx('boom', { x: c.x, vol: 1.1 }); } catch (e) {} }
        else {
          const beat = k < .3 ? 0 : k < .78 ? 1 : k < .9 ? 2 : 3; if (c.beat !== beat) { c.beat = beat; try { sfx(beat === 2 ? 'shatter' : 'ui_deal', { x: c.x, rate: 1 + beat * .25, vol: beat === 2 ? .7 : .9 }); } catch (e) {} if (beat === 2) { shake = Math.max(shake, 10); inkRing(c.x, c.y, '#ffffff', 2, 6, 90, .5); } }
          const cy = c.y - 36 * HS;
          if (beat < 2) { shake = Math.max(shake, 1 + 5 * k);
            for (const sd of [1, -1]) { const q = collapsePos(c, k, sd), ox = c.x + q[0], oy = cy + q[1];
              if (sd > 0) { if (Math.random() < .8) { const an = rnd(0, 6.283), v = rnd(60, 190); P({ x: ox, y: oy, vx: Math.cos(an) * v, vy: Math.sin(an) * v, color: Math.random() < .3 ? '#ffffff' : '#ff6b6b', size: rnd(1.6, 3), life: rnd(.18, .34) }); } }       // red throws sparks outward
              else if (Math.random() < .8) { const an = rnd(0, 6.283), rr = rnd(20, 34); P({ x: ox + Math.cos(an) * rr, y: oy + Math.sin(an) * rr, vx: -Math.cos(an) * rr * 4.5, vy: -Math.sin(an) * rr * 4.5, color: Math.random() < .3 ? '#ffffff' : '#6fb8ff', size: rnd(1.6, 3), life: .2 }); } } }   // blue drinks light inward
          else if (beat === 2) { shake = Math.max(shake, 8);
            for (let i = 0; i < 3; i++) { const an = rnd(0, 6.283), rr = rnd(10, 70); P({ x: c.x + Math.cos(an) * rr, y: c.y + Math.sin(an) * rr * .5, vx: rnd(-20, 20), vy: -rnd(90, 240), color: ['#3a2a4a', '#c48cff', '#ffffff'][i], size: rnd(2, 4.5), life: rnd(.3, .6), glow: i > 0 }); } }   // the floor lifts
          else { shake = Math.max(shake, 12);
            for (let i = 0; i < 4; i++) { const an = rnd(0, 6.283), rr = rnd(70, 130); P({ x: c.x + Math.cos(an) * rr, y: cy + Math.sin(an) * rr * .75, vx: -Math.cos(an) * rr * 9, vy: -Math.sin(an) * rr * 6.7, color: ['#ffffff', '#c48cff', '#ff8a8a', '#8ac4ff'][i], size: rnd(1.6, 3), life: .11 }); } }   // everything is sucked to a point
        }
        continue; }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.draw) {   // Draw orb: glides to its caster carrying whatever it caught; walls in the way take the hit, and so do those slammed into them
        const w = c.o, dx = w.x - c.x, dy = w.y - c.y, d = Math.hypot(dx, dy) || 1, k2 = Math.min(1, c.t * 3);
        c.x -= c.vx * dt || 0; c.y -= c.vy * dt || 0;   // undo the generic move: this orb steers itself
        c.vx = dx / d * c.sp * k2; c.vy = dy / d * c.sp * k2; const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt;
        for (const wl of walls) if (wl.o !== w && wl.hp > 0 && !c.hitW.has(wl) && wallD(wl, nx, ny) < 18) { c.hitW.add(wl);
          wl.hp -= c.dmg; wl.flash = .15; burst(nx, ny - 30 * HS, 12, ['#9fd8ff', '#fff', '#d8f6ff'], 160, 3, .4);   // the orb tears through the wall
          for (const h of c.held) { if (h.gone) continue; const e = h.e; if (h.k === 'wiz') { if (!ghosted(e)) damage(e, c.dmg, 0, 0, '#bfe6ff'); } else hurtCreature(e, h.k, c.dmg, 'crush'); wl.hp -= c.dmg; shake = Math.max(shake, 9); addFx({ k: 'ping', x: e.x, y: e.y, life: .35 }); }
          if (wl.hp > 0) { for (const h of c.held) { if (!h.gone) { h.gone = 1; text(h.e.x, h.e.y - 80 * HS, 'SLAMMED', '#bfe6ff'); } } } }
        c.x = nx; c.y = ny;
        for (const h of c.held) { if (h.gone) continue; const e = h.e; if ((h.k === 'wiz' && (e.dead || ghosted(e) || anchored(e))) || (h.k !== 'wiz' && !(e.hp > 0))) { h.gone = 1; continue; } const q = inArena(c.x, c.y); e.x += (q.x - e.x) * Math.min(1, dt * 14); e.y += (q.y - e.y) * Math.min(1, dt * 14); if (h.k === 'wiz') { e.vx = 0; e.vy = 0; } }
        if (d < 56 || c.life <= .05) { c.life = 0; for (const h of c.held) h.gone = 1; burst(c.x, c.y - 36 * HS, 18, ['#3b9bff', '#bfe6ff', '#fff'], 160, 4, .45); inkRing(c.x, c.y, '#3b9bff', 1, 8, 40, .5); }
        // ethereal smoke: soft red and dark wisps peel off as it travels
        for (let i = 0; i < 3; i++) P({ x: c.x + rnd(-9, 9), y: c.y - 36 * HS + rnd(-9, 9), vx: -c.vx * .12 + rnd(-24, 24), vy: -c.vy * .12 - rnd(10, 40), color: ['#6fb8ff', '#0a1a5a', '#c8e6ff', '#061030'][Math.random() * 4 | 0], size: rnd(4, 8), life: rnd(.5, 1), glow: Math.random() < .5, shrink: false, grow: 2, drag: .9, fade: .5 });
        continue; }
      if (c.repel) {
        const f = c.o.foe, sp = Math.hypot(c.vx, c.vy) || 1, ux = c.vx / sp, uy = c.vy / sp;
        if (!c.bounced) {   // first pass: everything it touches is hurt once and shoved along its path; enemy shots are turned around
          if (!f.dead && !ghosted(f) && !c.hit.has(f) && Math.hypot(f.x - c.x, f.y - c.y) < 28) { c.hit.add(f); damage(f, c.dmg, ux * 520 * c.str, uy * 520 * c.str, '#ffb0b0'); addFx({ k: 'repel', x: f.x, y: f.y, life: .35, r: 60 }); shake = Math.max(shake, 7); }
          for (const e of enemyCreatures(c.o)) if (e.e.x !== undefined && !c.hit.has(e.e) && Math.hypot(e.e.x - c.x, e.e.y - c.y) < 26) { c.hit.add(e.e); hurtCreature(e.e, e.k, c.dmg * .6, 'crush'); const q = inArena(e.e.x + ux * 70 * c.str, e.e.y + uy * 70 * c.str); e.e.x = q.x; e.e.y = q.y; }
          for (const p of projs) if (p.o !== c.o && p.life > 0 && Math.hypot(p.x - c.x, p.y + 40 * HS - c.y) < 26) { p.vx = ux * 300; p.vy = uy * 300; p.o = c.o; p.tgt = null; }
          for (const q of slashes) if (q.o !== c.o && Math.hypot(q.x - c.x, q.y - c.y) < 26) { q.vx = ux * 380; q.vy = uy * 380; q.o = c.o; q.hit = new Set(); }
        }
        let b = 0; if (c.x < F.x0 + 6 || c.x > F.x1 - 6) { c.vx = -c.vx; c.x = clamp(c.x, F.x0 + 6, F.x1 - 6); b = 1; } if (c.y < F.y0 + 6 || c.y > F.y1 - 6) { c.vy = -c.vy; c.y = clamp(c.y, F.y0 + 6, F.y1 - 6); b = 1; }
        if (b) { inkRing(c.x, c.y, '#ff5a5a', 2, 6, 30, .6); if (!c.late) { c.life = 0; burst(c.x, c.y - 36 * HS, 12, ['#ff8a8a', '#fff'], 150, 3, .35); } else { c.bounced++; if (c.bounced > 5) c.life = 0; } }
        if (c.late && c.bounced && c.life > 0) {   // Late Detonation: after the bounce it explodes on the first thing it touches
          let hitE = null; if (!f.dead && !ghosted(f) && Math.hypot(f.x - c.x, f.y - c.y) < 26) hitE = { e: f, k: 'wiz' }; if (!hitE) for (const e of enemyCreatures(c.o)) if (e.e.x !== undefined && Math.hypot(e.e.x - c.x, e.e.y - c.y) < 24) { hitE = e; break; } let hitW = null; if (!hitE) for (const wl of walls) if (wl.o !== c.o && wallD(wl, c.x, c.y) < 16) { hitW = wl; break; }
          if (hitE || hitW) { c.life = 0; addFx({ k: 'implode', x: c.x, y: c.y - 36 * HS, life: .6 }); shake = Math.max(shake, 10); const R2 = 70;
            if (!f.dead && !ghosted(f) && Math.hypot(f.x - c.x, f.y - c.y) < R2) { const d = Math.hypot(f.x - c.x, f.y - c.y) || 1; damage(f, c.dmg * 1.3, (f.x - c.x) / d * 620, (f.y - c.y) / d * 620, '#ffb0b0'); }
            for (const e of enemyCreatures(c.o)) if (e.e.x !== undefined && Math.hypot(e.e.x - c.x, e.e.y - c.y) < R2) { const d = Math.hypot(e.e.x - c.x, e.e.y - c.y) || 1; hurtCreature(e.e, e.k, c.dmg * 1.3, 'crush'); const q = inArena(e.e.x + (e.e.x - c.x) / d * 60, e.e.y + (e.e.y - c.y) / d * 60); e.e.x = q.x; e.e.y = q.y; }
            if (hitW) { hitW.hp -= c.dmg * 2.6; hitW.flash = .15; } } }
        if (Math.random() < .8) P({ x: c.x + rnd(-5, 5), y: c.y - 36 * HS + rnd(-5, 5), vx: -c.vx * .15 + rnd(-20, 20), vy: -c.vy * .15 + rnd(-20, 20), color: Math.random() < .5 ? '#ff6b6b' : '#ffffff', size: rnd(2, 3.6), life: rnd(.2, .4) });
        continue; }
      if (c.x < F.x0 - 30 || c.x > F.x1 + 30 || c.y < F.y0 - 40 || c.y > F.y1 + 30) c.life = 0;
      // suction: enemies near the singularity are dragged toward it
      { const f0 = c.o.foe, SR = 130;
        if (!f0.dead && !ghosted(f0) && !anchored(f0)) { const d = Math.hypot(c.x - f0.x, c.y - f0.y) || 1; if (d < SR && d > 8) { const s = 120 * (1 - d / SR) + 30; f0.x += (c.x - f0.x) / d * s * dt; f0.y += (c.y - f0.y) / d * s * dt;
          // being dragged in hurts: damage over time while caught in the pull, landing in small ticks
          c.dot = (c.dot || 0) + c.dmg * .4 * dt; if (c.dot >= 2) { damage(f0, c.dot, 0, 0, '#d9c8ff'); c.dot = 0; if (Math.random() < .6) burst(f0.x, f0.y - 40 * HS, 5, ['#c48cff', '#fff'], 90, 3, .3); } } }
        for (const e of enemyCreatures(c.o)) if (e.e.x !== undefined) { const d = Math.hypot(c.x - e.e.x, c.y - e.e.y) || 1; if (d < SR && d > 8) { const s = 150 * (1 - d / SR) + 30; e.e.x += (c.x - e.e.x) / d * s * dt; e.e.y += (c.y - e.e.y) / d * s * dt;
          // summons being dragged in take the same damage over time as casters, in small ticks
          e.e._cdot = (e.e._cdot || 0) + c.dmg * .4 * dt; if (e.e._cdot >= 2) { hurtCreature(e.e, e.k, e.e._cdot, 'arcane'); e.e._cdot = 0; } } }
        if (Math.random() < .7) { const an = rnd(0, 6.283), rr = rnd(60, SR); P({ x: c.x + Math.cos(an) * rr, y: c.y - 36 * HS + Math.sin(an) * rr * .7, vx: -Math.cos(an) * rr * 2.2, vy: -Math.sin(an) * rr * 1.5, color: Math.random() < .5 ? '#c48cff' : '#ffffff', size: rnd(1.5, 3), life: .4 }); } }
      // Unrestrained Collapse: halfway along its path the singularity bursts
      if (c.unbound && !c.burst && Math.hypot(c.x - c.sx, c.y - c.sy) >= c.L / 2) { c.burst = 1; c.life = 0; unboundBlast(c); continue; }
      for (const p of projs) if (p.o !== c.o && p.life > 0 && Math.hypot(p.x - c.x, p.y + 40 * HS - c.y) < 36) { p.life = 0; burst(p.x, p.y, 10, ['#c48cff', '#fff'], 150, 3, .3); }
      for (const e of enemyCreatures(c.o)) if (!c.hit.has(e.e) && Math.hypot(e.e.x - c.x, e.e.y - c.y) < 40) { c.hit.add(e.e); hurtCreature(e.e, e.k, c.dmg, 'arcane'); }
      for (const wl of walls) if (wl.o !== c.o && wallD(wl, c.x, c.y) < 30 && !c.hit.has(wl)) { c.hit.add(wl); wl.hp -= c.dmg * 1.5; wl.flash = .15; }
      const f = c.o.foe; if (!c.hit.has(f) && !f.dead && Math.hypot(f.x - c.x, f.y - c.y) < 40) { c.hit.add(f); if (!ghosted(f)) { damage(f, c.dmg, c.vx * .8, c.vy * .8, '#d9c8ff'); shake = Math.max(shake, 16); addFx({ k: 'implode', x: f.x, y: f.y - 36 * HS, life: .7 }); slow = Math.min(slow, .15); setTimeout(() => { if (!ended) slow = 1; }, 200); scar('crack', f.x, f.y); for (let i = 0; i < 24; i++) { const an = rnd(0, 6.283), v = rnd(120, 360); P({ x: f.x, y: f.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v, color: ['#c48cff', '#6fd3ff', '#ff4a4a', '#fff'][i % 4], size: rnd(2, 4.5), life: rnd(.3, .7) }); } } }
      c.arcs = c.arcs || []; if (Math.random() < .5) { const an = rnd(0, 6.283), rr = rnd(30, 62); c.arcs.push({ a: an, r: rr, t: 0, j: [rnd(-8, 8), rnd(-8, 8), rnd(-8, 8)] }); } c.arcs = c.arcs.filter(q => (q.t += dt) < .12);
      if (Math.random() < .5) scar('scorch', c.x + rnd(-6, 6), c.y + rnd(-3, 3), { r: 7, c: '#1a0a30', a: .25, s: .6 });
      // a deeper, wider version of the Spell Cannon's burn trench, laid down in pieces as it travels
      c.lsx = c.lsx === undefined ? c.sx : c.lsx; c.lsy = c.lsy === undefined ? c.sy : c.lsy;
      if (Math.hypot(c.x - c.lsx, c.y - c.lsy) > 46 && typeof beamScar === 'function') { const d0 = beamScar({ x: c.lsx, y: c.lsy }, { x: c.x, y: c.y }, true, 1.45, true); d0.life = 5; decals.push(d0); c.lsx = c.x; c.lsy = c.y; }
      // sparks and embers shed along the way
      for (let i = 0; i < 2; i++) { const an = c.a + Math.PI + rnd(-.9, .9), v = rnd(80, 240); P({ x: c.x + rnd(-10, 10), y: c.y - 36 * HS + rnd(-10, 10), vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, color: ['#ffd45e', '#ff8a3a', '#ffffff', '#c48cff'][Math.random() * 4 | 0], size: rnd(1.6, 3.2), life: rnd(.3, .7), grav: 260 }); }
      if (Math.random() < dt * 14) decals.push({ k: 'ember', x: c.x + rnd(-22, 22), y: c.y + rnd(-10, 10), t: 0, life: rnd(2, 3.4), s: rnd(.8, 1.3) });
      if (Math.random() < .9) fireFx.push({ x: c.x + rnd(-6, 6), y: c.y - 36 * HS + rnd(-6, 6), vx: -c.vx * .2 + rnd(-20, 20), vy: -c.vy * .2 + rnd(-20, 20), t: 0, life: rnd(.25, .4), s: rnd(8, 12), seed: rnd(0, 99), el: 'arcane' });
    }
    orbsC = orbsC.filter(c => c.life > 0);
    // ---- extra impact for the quieter spells (found in the effects audit) ----
    for (const b of bolts) if (!b.jz) { b.jz = 1; addFx({ k: 'bolt', pts: b.pts.map(q => ({ x: q.x, y: q.y })), life: .5 }); shake = Math.max(shake, 4); }
    for (const q of swarms) { if (!q.jz) { q.jz = 1; burst(q.x, q.y - 30 * HS, 16, ['#eef7a0', '#9ab832', '#2a3a08'], 150, 3, .45); }
      if (Math.random() < .8) { const a = rnd(0, 6.283), rr = rnd(6, 24); P({ x: q.x + Math.cos(a) * rr, y: q.y - 34 * HS + Math.sin(a) * rr * .7, vx: rnd(-40, 40), vy: rnd(-40, 40), color: Math.random() < .5 ? '#2a3a08' : '#cfe86a', size: rnd(1.5, 2.8), life: rnd(.2, .4), glow: false }); } }
    for (const q of pits) { if (!q.jz) { q.jz = 1; shake = Math.max(shake, 6); inkRing(q.x, q.y, '#a8824a', 2, 6, q.rmax || 40, .5); burst(q.x, q.y, 22, ['#a8824a', '#5a3d22', '#efe0b8'], 200, 4, .6, 400); }
      if (Math.random() < .6) { const a = rnd(0, 6.283); P({ x: q.x + Math.cos(a) * q.r, y: q.y + Math.sin(a) * q.r * .5, vx: -Math.cos(a) * 30, vy: -rnd(10, 50), color: ['#a8824a', '#5a3d22'][Math.random() * 2 | 0], size: rnd(2, 4), life: rnd(.4, .7), glow: false, grav: 120 }); } }
    for (const q of patches) if (!q.jz) { q.jz = 1; inkRing(q.x, q.y, '#4caf3a', 2, 4, 34, .5); burst(q.x, q.y - 6, 18, ['#d8f5a0', '#4caf3a', '#163d10'], 170, 4, .55, 300); shake = Math.max(shake, 3); }
    for (const q of clouds) { if (!q.jz) { q.jz = 1; burst(q.x, q.y - 70 * HS, 16, ['#fff', '#cfd8e8', '#8a96b0'], 120, 5, .6); }
      if (Math.random() < .7) P({ x: q.x + rnd(-16, 16), y: q.y - 56 * HS, vx: -20, vy: rnd(160, 240), color: '#9fd8ff', size: 1.6, life: .26, glow: false }); }
    for (const q of totems) { if (!q.jz) { q.jz = 1; inkRing(q.x, q.y, '#c87533', 2, 4, 30, .5); burst(q.x, q.y - 10, 14, ['#c87533', '#ffd23a', '#fff'], 160, 3, .5, 300); shake = Math.max(shake, 3); }
      if (q.hp > 0 && Math.random() < .12) P({ x: q.x + rnd(-3, 3), y: q.y - 44 * HS, vx: rnd(-50, 50), vy: rnd(-80, -20), color: '#ffd23a', size: 2, life: .3 }); }
    for (const f of fx) f.t += dt; fx = fx.filter(f => f.t < f.life);
  }

  /* reset per round */
  const _startDuel = startDuel;
  window.startDuel = startDuel = function () {
    slashes = []; domes = []; orbsC = []; halves = []; tarrows = []; fx = []; springs = []; motes = []; cleaves = []; muds = []; flames = []; EYE = null;
    const r = _startDuel.apply(this, arguments);
    if (typeof ents !== 'undefined') ents.forEach(w => { w.shell = null; w.shellDown = 0; w.copyArmed = 0; w.copyGlow = 0; w.sanctNext = null; w.rush = null; w.jump = 0; w.infused = 0; w.cleaveN = (M && M.cnt && M.cnt[w.side] && M.cnt[w.side].c) || 0; w.counter = null; w.qdSpent = 0; w.polN = (M && M.cnt && M.cnt[w.side] && M.cnt[w.side].p) || 0; w.zn = 0; w.zbag = null; w.ceaseT = 0; w.viviT = 0; w.viviLoop = undefined; w.pull = null; w.sw = null; w.swPause = 0; w.healAcc = 0; w.qdFill = 0; w.infArm = 0; w.repelT = 0; w.cdNum = 0; w.bleeds = null; w.braceT = 0; w.mom = 0; w.dmgSince = 0; w.finalUsed = 0; w.finalBoost = 0; w.fate = 0; w.fateUsed = 0; w.castN = 0; w.flyN = 0; w.dtLoop = -1; w.polLoop = -1; w.once = {}; w.mirN = 0; w.sancLoop = -9; w.chosenSaid = 0; w.dizzyT = 0; w.drag = null; w.boundary = undefined; w.bndSpent = 0; w._hpLast = w.hp; w._hpSeen = w.hp;
      if (U(w, 'rush', 'oath') && w.book.includes('rush')) { w.hp = Math.round(w.hp * .5); w.lag = w.hp; w._ph = w.hp; w.oathT = 1.6; } });
    return r;
  };

  /* ---------------- drawing ---------------- */
  const _drawZombie = drawZombie;
  // new art for fully risen zombies; the rising, sinking and electrocuted states keep their original animations
  // the selected art style draws the zombie the whole time: rising out of the ground, sinking, and shocked
  window.drawZombie = drawZombie = function (z) { if (z.beast) return drawBeast(z);
    if (!(ART_STYLE === 'hd' && typeof drawZombieHD === 'function')) return _drawZombie(z);
    if (z.rise <= 0) return;
    const x = ctx, r = Math.min(1, z.rise), down = (1 - r) * 46 * SC + (z.sink > 0 && r >= 1 ? z.sink * 34 : 0);
    if (r < 1) { x.save(); x.translate(z.x, z.y); x.scale(SC, SC); x.fillStyle = '#4a3020'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.ellipse(0, 0, 15 * (.6 + .4 * r), 5.5, 0, 0, 7); x.fill(); x.stroke(); x.restore(); }   // the hole it climbs out of
    if (z.shockT > 0) z.shockT -= .016;
    if (down > .5) { x.save(); x.beginPath(); x.rect(z.x - 40, z.y - 110, 80, 112); x.clip(); x.translate(0, down); const r0 = z.rise, s0 = z.sink; z.rise = 1; z.sink = 0; try { drawZombieHD(z); } finally { z.rise = r0; z.sink = s0; x.restore(); } }
    else drawZombieHD(z);
    if (z.shockT > 0 && Math.floor(T * 24) % 2 === 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .7; drawZombieHD(z); x.restore(); }   // shocked: flickers bright
  };
  const _drawGolem = drawGolem, _drawArcher = drawArcher;
  window.drawGolem = drawGolem = function (g) { return ART_STYLE === 'hd' && typeof drawGolemHD === 'function' ? drawGolemHD(g) : _drawGolem(g); };
  window.drawArcher = drawArcher = function (a) { return ART_STYLE === 'hd' && typeof drawArcherHD === 'function' ? drawArcherHD(a) : _drawArcher(a); };
  function drawBeast(z) {
    const x = ctx, b = z.beast, r = clamp(z.rise, 0, 1), S0 = 46 * b.sz, tgt = z.o.foe, fl = z.flash > 0;
    x.save(); x.translate(z.x, z.y);
    // ink pool
    x.fillStyle = 'rgba(10,4,24,.55)'; x.beginPath(); x.ellipse(0, 1, 16 * b.sz * (1.4 - r * .4), 5 * b.sz, 0, 0, 7); x.fill();
    x.scale(SC, SC); x.globalAlpha *= .35 + r * .65;
    const face = tgt.x > z.x ? -1 : 1, hop = Math.abs(Math.sin(z.t * 10 * (b.spd || 1))) * 3 * (b.spd > 1.4 ? 1.4 : 1), lng = z.lunge > 0 ? Math.sin(z.lunge / .2 * Math.PI) * 6 : 0;
    x.translate(-face * lng, -hop - (1 - r) * -S0 * .6); x.scale(face, 1);
    x.save(); x.scale(b.sz, b.sz); const drawn = typeof drawBeastArt === 'function' && drawBeastArt(x, b.id, z.t * 9 * (b.spd || 1), fl); x.restore();
    if (!drawn) { const sil = beastSil(b.e, 96, '#140a30', fl ? '#ffffff' : '#8a6cff'); x.drawImage(sil, -S0 / 2, -S0 * .92, S0, S0); }
    x.restore();
    // wisps
    if (!z.noFx && Math.random() < .25) P({ x: z.x + rnd(-10, 10) * b.sz, y: z.y - rnd(5, 30) * HS * b.sz, vx: rnd(-10, 10), vy: rnd(-40, -15), color: ['#3a2a6a', '#8a6cff'][Math.random() * 2 | 0], size: rnd(3, 5), life: .5, glow: false });
    if (z.hp < z.mx && !z.noFx) { const W = 26 * b.sz; x.fillStyle = '#000'; x.fillRect(z.x - W / 2, z.y - S0 * SC - 6, W, 4); x.fillStyle = '#b79cff'; x.fillRect(z.x - W / 2 + 1, z.y - S0 * SC - 5, (W - 2) * z.hp / z.mx, 2); }
  }

  /* ground layer: springs sit under the fighters (drawn right after the scorch/frost decals) */
  const _drawDecals = drawDecals;
  window.drawDecals = drawDecals = function (x) {
    _drawDecals(x); if (x !== ctx) return;          // bake() also draws decals into the permanent scar canvas: live effects stay off it
    drawMud(x); drawFlames(x);
    if (typeof M !== 'undefined' && M && M.blood) for (const b of M.blood) { const old = b.rd !== M.round; x.save(); x.translate(b.x, b.y); x.scale(1, .5); x.globalAlpha = old ? .38 : .8; x.fillStyle = old ? '#4a4347' : '#7a0c18'; x.beginPath(); x.arc(0, 0, b.r, 0, 7); x.arc(b.r * .7 * Math.cos(b.s), b.r * .7 * Math.sin(b.s), b.r * .55, 0, 7); x.fill(); if (!old) { x.fillStyle = 'rgba(255,120,130,.45)'; x.beginPath(); x.arc(-b.r * .3, -b.r * .3, b.r * .25, 0, 7); x.fill(); } x.restore(); }
    for (const f of fx) if (f.k === 'aura' && !f.w.dead) { const k = f.t / f.life; drawInkAura(x, f.w, (1 - k) * (k < .15 ? k / .15 : 1) * (.8 + (f.tier || 1) * .1), f.l, f.m, f.big); }
    // sorcerers: an ink-flame aura behind them that builds as the current cast charges (wizards keep the hex ring)
    if (typeof ents !== 'undefined' && ents && document.getElementById('battle')?.classList.contains('on')) for (const w of ents) { if (w.dead || !isSorc(w) || has(w, 'chosen') || ended) continue; const k = w.book[w.i]; if (!k || k === 'secondwind') continue;
      const [l, m] = w.me ? auraOf(w) : (COL[SP[k].el] || COL.ki), f = Math.max(0, Math.min(1, w.p / castT(w, k))); drawInkAura(x, w, .18 + f * .6, l, m); }
    // Spirit Tuning: the green healing aura builds behind the caster as it charges (ground pass, so it never covers them)
    if (typeof ents !== 'undefined' && ents && document.getElementById('battle')?.classList.contains('on')) for (const w of ents) if (!w.dead && !ended && w.book[w.i] === 'secondwind' && !(w.stunT > 0)) { const fr = Math.max(0, Math.min(1, w.p / castT(w, 'secondwind'))); if (fr > .08) drawInkAura(x, w, (fr - .08) / .92, '#eafff2', '#2fd08a'); }
    // Chosen One: the smoke aura is always on while it is in the book, drawn behind the caster; casts make it swell
    if (typeof ents !== 'undefined' && ents && document.getElementById('battle')?.classList.contains('on')) for (const w of ents) if (!w.dead && has(w, 'chosen')) { w.cPulse = Math.max(0, (w.cPulse || 0) - .03); drawSmokeAura(x, w, .55 + .45 * Math.min(1, w.cPulse) + (w.fate ? .35 : 0)); }
    for (const sp of springs) {
      const k = sp.t / sp.dur, a = Math.min(1, sp.t * 4) * (k > .85 ? (1 - k) / .15 : 1), R = sp.r * Math.min(1, .3 + sp.t * 3.5), [l, m, d] = COL.life;
      x.save(); x.translate(sp.x, sp.y); x.scale(1, SQ); x.globalAlpha = a;
      const g = x.createRadialGradient(0, 0, R * .05, 0, 0, R); g.addColorStop(0, 'rgba(234,255,246,.55)'); g.addColorStop(.55, 'rgba(95,240,192,.38)'); g.addColorStop(.92, 'rgba(40,190,160,.5)'); g.addColorStop(1, 'rgba(11,90,72,.0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
      x.strokeStyle = 'rgba(11,60,50,.8)'; x.lineWidth = 3.5; x.beginPath(); x.arc(0, 0, R * .96, 0, 7); x.stroke();
      x.strokeStyle = '#eafff6'; x.lineWidth = 1.8; x.beginPath(); x.arc(0, 0, R * .96, 0, 7); x.stroke();
      // ripples moving outward
      for (let i = 0; i < 3; i++) { const ph = (sp.t * .55 + i / 3) % 1; x.globalAlpha = a * (1 - ph) * .7; x.strokeStyle = '#ffffff'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, R * (.12 + ph * .8), 0, 7); x.stroke(); }
      // glints
      x.globalAlpha = a * .8; x.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const an = i * 1.05 + sp.t * .4, rr = R * (.3 + (i % 3) * .2); x.beginPath(); x.ellipse(Math.cos(an) * rr, Math.sin(an) * rr, 5, 1.4, an, 0, 7); x.fill(); }
      if (sp.shared) { x.globalAlpha = a * .9; x.setLineDash([6, 6]); x.strokeStyle = '#ffe9a0'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, R * .84, sp.t * .5, sp.t * .5 + 6.283); x.stroke(); }
      x.restore();
    }
  };

  const _render = render;
  window.render = render = function () {
    _render();
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (typeof ents !== 'undefined' && ents.length && document.getElementById('battle')?.classList.contains('on') !== false) drawTech(x);
    x.restore();
  };
  function crescentPath(x, r, a0) { x.beginPath(); x.arc(0, 0, r, -a0, a0); x.arc(-r * .42, 0, r * .92, a0 * .86, -a0 * .86, true); x.closePath(); }
  function drawTech(x) {
    // Sanctum domes (under the shells)
    for (const dm of domes) {
      const w = dm.o, k = dm.t / dm.dur, a = Math.min(1, dm.t * 5) * (k > .85 ? (1 - k) / .15 : 1), R = dm.r * Math.min(1, .2 + dm.t * 6), RY = R / 1.4, H = R * .95, hot = dm.hit > 0 ? 1 : 0, pl = Math.max(0, dm.pulse || 0) * 4, q = Math.max(0, dm.hp / dm.max);
      x.save(); x.translate(dm.x, dm.y); x.globalAlpha = a;
      // floor: tinted disc, a bright double rim and glyph ticks turning on it
      const g = x.createRadialGradient(0, 0, R * .1, 0, 0, R); g.addColorStop(0, `rgba(122,166,255,${.05 + pl * .1})`); g.addColorStop(.75, `rgba(90,130,255,${.14 + pl * .12})`); g.addColorStop(1, 'rgba(200,220,255,.5)');
      x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, R, RY, 0, 0, 7); x.fill();
      x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = hot ? '#ffffff' : 'rgba(170,200,255,.95)'; x.lineWidth = 3; x.shadowColor = '#7aa6ff'; x.shadowBlur = 12; x.beginPath(); x.ellipse(0, 0, R, RY, 0, 0, 7); x.stroke(); x.shadowBlur = 0;
      x.lineWidth = 1.2; x.strokeStyle = 'rgba(230,240,255,.8)'; x.beginPath(); x.ellipse(0, 0, R * .9, RY * .9, 0, 0, 7); x.stroke();
      x.lineWidth = 1.6; for (let i = 0; i < 24; i++) { const an = i / 24 * 6.283 + dm.t * .5, r0 = i % 3 ? .92 : .9, r1 = i % 3 ? .97 : 1; x.beginPath(); x.moveTo(Math.cos(an) * R * r0, Math.sin(an) * RY * r0); x.lineTo(Math.cos(an) * R * r1, Math.sin(an) * RY * r1); x.stroke(); }
      x.restore();
      // shell: a glassy hemisphere with a soft sheen, latitude bands and slow meridians
      const sg = x.createLinearGradient(0, -H, 0, 0); sg.addColorStop(0, `rgba(210,228,255,${.22 + pl * .2})`); sg.addColorStop(.5, 'rgba(122,166,255,.07)'); sg.addColorStop(1, 'rgba(122,166,255,.02)');
      x.fillStyle = sg; x.beginPath(); x.ellipse(0, 0, R, H, 0, Math.PI, 0); x.closePath(); x.fill();
      x.strokeStyle = hot ? '#fff' : 'rgba(215,230,255,.85)'; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, 0, R, H, 0, Math.PI, 0); x.stroke();
      x.lineWidth = 1; for (const lv of [.35, .62, .84]) { const rr = Math.sqrt(1 - lv * lv); x.strokeStyle = `rgba(190,210,255,${.4 - lv * .25})`; x.beginPath(); x.ellipse(0, -H * lv, R * rr, RY * rr, 0, 0, 7); x.stroke(); }
      for (let i = 0; i < 6; i++) { const ph = (i / 6 + dm.t * .1) % 1, rx = Math.cos(ph * Math.PI) * R; x.beginPath(); x.ellipse(0, 0, Math.abs(rx), H, 0, Math.PI, 0); x.strokeStyle = `rgba(190,210,255,${.12 + .22 * Math.abs(Math.sin(ph * Math.PI))})`; x.stroke(); }
      // drifting motes of light on the surface, a sheen streak, and cracks as it takes damage
      x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const ph = (dm.t * .25 + i * .37) % 1, an = i * 2.4 + dm.t * .3, hh = ph * H, rr = Math.sqrt(Math.max(0, 1 - ph * ph)); x.fillStyle = `rgba(230,240,255,${.8 * Math.sin(ph * Math.PI)})`; x.beginPath(); x.arc(Math.cos(an) * R * rr, -hh + Math.sin(an) * RY * rr * .3, 1.6, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.ellipse(-R * .12, -H * .1, R * .72, H * .78, 0, Math.PI * 1.12, Math.PI * 1.4); x.stroke(); x.restore();
      if (q < .75) { x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.3; const n = q < .25 ? 5 : q < .5 ? 3 : 1; for (let i = 0; i < n; i++) { const an = 3.5 + i * .55, bx = Math.cos(an) * R * .8, by2 = Math.sin(an) * H * .8; x.beginPath(); x.moveTo(bx, by2); x.lineTo(bx + 8, by2 + 10); x.lineTo(bx + 2, by2 + 18); x.lineTo(bx + 12, by2 + 27); x.moveTo(bx + 8, by2 + 10); x.lineTo(bx + 17, by2 + 12); x.stroke(); } }
      if (q < 1) { const W2 = 44; x.fillStyle = '#000'; x.fillRect(-W2 / 2, -H - 12, W2, 5); x.fillStyle = '#bcd2ff'; x.fillRect(-W2 / 2 + 1, -H - 11, (W2 - 2) * q, 3); }
      x.restore();
    }
    // Spirit Tuning: an ink-and-flame aura engulfs the caster while it charges
    // Second Wind aura: two ribbons spiralling up the body
    for (const w of ents) if (w.sw && !w.dead) { const paused = w.swPause > 0, t = w.sw.t; x.save(); x.translate(w.x, w.y); x.globalCompositeOperation = 'lighter'; x.globalAlpha = paused ? .25 : .85;
      const gg = x.createRadialGradient(0, -34 * SC, 4, 0, -34 * SC, 46 * SC); gg.addColorStop(0, 'rgba(184,255,207,.35)'); gg.addColorStop(1, 'rgba(60,220,140,0)'); x.fillStyle = gg; x.beginPath(); x.ellipse(0, -34 * SC, 30 * SC, 46 * SC, 0, 0, 7); x.fill();
      x.lineCap = 'round'; for (const ph of [0, Math.PI]) { x.beginPath(); for (let i = 0; i <= 18; i++) { const u = i / 18, a = t * 5 + ph + u * 5.2, px = Math.cos(a) * (20 - u * 6) * SC, py = -u * 70 * SC + Math.sin(a) * 4; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = 'rgba(184,255,207,.9)'; x.lineWidth = 2.4; x.stroke(); }
      x.restore(); }
    // heal motes: little plus signs drifting up
    for (const m of motes) { const k = m.t / m.life; x.save(); x.translate(m.x, m.y); x.globalAlpha = Math.sin(Math.PI * Math.min(1, k * 1.2)) * .95; x.fillStyle = '#0b3c32'; x.fillRect(-m.s * .28 - 1, -m.s - 1, m.s * .56 + 2, m.s * 2 + 2); x.fillRect(-m.s - 1, -m.s * .28 - 1, m.s * 2 + 2, m.s * .56 + 2); x.fillStyle = m.c; x.fillRect(-m.s * .28, -m.s, m.s * .56, m.s * 2); x.fillRect(-m.s, -m.s * .28, m.s * 2, m.s * .56); x.restore(); }
    // Quick Draw charge: a small afterimage mark at the feet while the dodge is loaded
    for (const w of ents) if (!w.dead && w.up && U(w, 'doubletake', 'quickdraw') && has(w, 'doubletake')) { const rdy = !w.qdSpent; x.save(); x.translate(w.x, w.y + 9); x.globalAlpha = rdy ? .9 : .35; x.strokeStyle = '#000'; x.lineWidth = 4; x.fillStyle = rdy ? '#ffd6d2' : '#6a5560'; for (const s2 of [-1, 1]) { x.beginPath(); x.moveTo(s2 * 3, -3.5); x.lineTo(s2 * 10, 0); x.lineTo(s2 * 3, 3.5); x.closePath(); x.stroke(); x.fill(); } x.restore(); }
    // Titan Shells
    for (const w of ents) if (w.shell && !w.dead) drawShell(x, w);
    for (const w of ents) if (w.shellForm > 0) { x.save(); x.globalAlpha = Math.min(1, w.shellForm) * .5; x.translate(w.x, w.y); x.strokeStyle = '#9fb8ff'; x.setLineDash([4, 5]); x.lineWidth = 1.5; x.beginPath(); x.ellipse(0, -46 * HS, 34 * SC, 62 * HS, 0, 0, 7); x.stroke(); x.restore(); }
    // Copy Cast armed: eye glow over the head
    for (const w of ents) if (w.copyArmed > 0 && !w.dead) { const ex = w.x + w.face * 3 * SC, ey = w.y - 47 * SC; x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(ex, ey, 0, ex, ey, 12); gg.addColorStop(0, 'rgba(255,60,80,.9)'); gg.addColorStop(1, 'rgba(255,0,40,0)'); x.fillStyle = gg; x.beginPath(); x.arc(ex, ey, 12 + Math.sin(T * 10) * 2, 0, 7); x.fill(); x.restore(); }
    // slashes (bigger, brighter and with a gold core as Dissection is levelled and upgraded)
    for (const s of slashes) {
      const a = Math.atan2(s.vy, s.vx), tr = s.tier || 1; x.save(); x.translate(s.x, s.y - 36 * HS); x.rotate(a); x.scale(SC * s.sz * 1.45, SC * s.sz * 1.45);
      for (let i = 2 + tr; i >= 1; i--) { x.save(); x.translate(-i * 7, 0); x.globalAlpha = .16 * (3 + tr - i) / (1 + tr * .3); x.fillStyle = tr >= 3 ? '#ffb020' : '#ff3b4a'; crescentPath(x, 17, 1.15); x.fill(); x.restore(); }
      x.globalCompositeOperation = 'lighter'; x.fillStyle = tr >= 3 ? 'rgba(255,190,60,.6)' : 'rgba(255,60,80,.55)'; crescentPath(x, 19 + tr, 1.2); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#fff'; x.strokeStyle = '#2a0006'; x.lineWidth = 1.6; crescentPath(x, 16, 1.1); x.fill(); x.stroke();
      if (tr >= 2) { x.fillStyle = tr >= 3 ? '#ffe08a' : '#ffd6d2'; crescentPath(x, 11, .8); x.fill(); }
      x.restore();
      if (tr >= 2 && Math.random() < .5) P({ x: s.x + rnd(-6, 6), y: s.y - 36 * HS + rnd(-8, 8), vx: -s.vx * .1, vy: -s.vy * .1, color: tr >= 3 ? '#ffe08a' : '#ff8a96', size: 2, life: .25 });
    }
    for (const w of ents) if (w._au && w._au.T === T && !w.dead) drawAuraFront(x, w, w._au.i, w._au.l, w._au.m);
    drawHalves(x);
    for (const a of tarrows) { const ac = auraOf(a.o), an = Math.atan2(a.vy, a.vx); x.save(); x.translate(a.x, a.y - 44 * HS); x.rotate(an); x.globalCompositeOperation = 'lighter'; x.strokeStyle = ac[1]; x.lineWidth = 6; x.lineCap = 'round'; x.globalAlpha = .5; x.beginPath(); x.moveTo(-30, 0); x.lineTo(6, 0); x.stroke(); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      x.fillStyle = ac[0]; x.strokeStyle = '#000'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(12, 0); x.lineTo(0, -5.5); x.lineTo(2, -1.6); x.lineTo(-20, -1.6); x.lineTo(-20, 1.6); x.lineTo(2, 1.6); x.lineTo(0, 5.5); x.closePath(); x.fill(); x.stroke(); x.restore(); }
    // Grand Bisection: gather, then a giant inked crescent flies down the arena
    for (const c of cleaves) {
      const ca = Math.cos(c.a), sa = Math.sin(c.a), yo = -30 * HS, W = cv.width / dpr, H = cv.height / dpr;
      if (c.t < c.wind) { // gathering: streaks pull into a blade forming over the caster
        const k = c.t / c.wind; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
        for (let i = 0; i < 9; i++) { const a = i * .7 + c.t * 3, r0 = 60 * (1 - k) + 12, r1 = r0 + 22; x.strokeStyle = `rgba(255,70,90,${.3 + k * .6})`; x.lineWidth = 2; x.beginPath(); x.moveTo(c.x + Math.cos(a) * r1, c.y - 46 * HS + Math.sin(a) * r1 * .7); x.lineTo(c.x + Math.cos(a) * r0, c.y - 46 * HS + Math.sin(a) * r0 * .7); x.stroke(); }
        x.translate(c.x + ca * 14, c.y + sa * 14 + yo); x.rotate(c.a); x.scale(1.2 + k * 2.4, 1.6 + k * 3.6); x.globalAlpha = k; x.fillStyle = '#fff'; crescentPath(x, 16, 1.1); x.fill(); x.restore(); continue; }
      const fx0 = c.x + ca * c.d, fy0 = c.y + sa * c.d + yo, done = c.d >= c.L, age = c.end ? c.t - c.end : 0;
      // the world shifts apart along the cut, starting at the first thing it hits
      if (c.impT && c.t - c.impT < .34) { const k = (c.t - c.impT) / .34, off = 8 * (1 - k) * (1 - k), nx = -sa, ny = ca, Lb = 2400, ax = c.x - ca * Lb, ay = c.y + yo - sa * Lb, bx = c.x + ca * Lb, by = c.y + yo + sa * Lb;
        for (const sd of [1, -1]) { x.save(); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(bx + nx * sd * Lb, by + ny * sd * Lb); x.lineTo(ax + nx * sd * Lb, ay + ny * sd * Lb); x.closePath(); x.clip(); x.drawImage(cv, 0, 0, cv.width, cv.height, nx * sd * off, ny * sd * off, W, H); x.restore(); }
        }
      // (no wake line: only the blade itself travels)
      if (!done) { // afterimages, then the blade: ink edge, crimson body, white core, hatch texture
        const sy = c.narrow ? 2.6 : 6.9, sx = c.narrow ? 5.4 : 4.8;
        // ghosting: a string of fading copies of the blade left where it has been, each a little smaller and offset
        c.trail = c.trail || []; if (!c.trail.length || c.d - c.trail[c.trail.length - 1] > 22) c.trail.push(c.d); if (c.trail.length > 9) c.trail.shift();
        for (let i = 0; i < c.trail.length - 1; i++) { const dd = c.trail[i], age = (c.trail.length - 1 - i) / 9, jit = Math.sin(c.t * 70 + i * 2.3) * 3; x.save(); x.translate(c.x + ca * dd - sa * jit, c.y + sa * dd + yo + ca * jit); x.rotate(c.a); x.scale(sx * (1 - age * .25), sy * (1 - age * .25)); x.globalAlpha = .55 * (1 - age); x.globalCompositeOperation = 'lighter'; x.fillStyle = i % 2 ? 'rgba(255,60,80,.9)' : 'rgba(255,255,255,.75)'; crescentPath(x, 18, 1.2); x.fill(); x.globalCompositeOperation = 'source-over'; x.globalAlpha = .35 * (1 - age); x.strokeStyle = '#12060c'; x.lineWidth = .6; crescentPath(x, 18, 1.2); x.stroke(); x.restore(); }
        const fl = Math.floor(c.t * 40) % 3, flick = fl === 0 ? 1 : fl === 1 ? .7 : .9;   // the blade flickers
        x.save(); x.translate(fx0, fy0); x.rotate(c.a); x.scale(sx, sy); x.globalAlpha = flick;
        x.fillStyle = '#07020a'; crescentPath(x, 22.5, 1.3); x.fill();
        x.fillStyle = fl === 1 ? '#ffffff' : '#ff2d45'; crescentPath(x, 19.5, 1.22); x.fill();
        x.fillStyle = fl === 1 ? '#ff2d45' : '#ffffff'; crescentPath(x, 16.5, 1.12); x.fill();
        x.save(); crescentPath(x, 16.5, 1.12); x.clip(); x.strokeStyle = '#07020a'; x.lineWidth = .5; for (let i = -6; i < 8; i++) { const o = i * 3.4 + (c.t * 60 % 3.4); x.beginPath(); x.moveTo(4, o - 9); x.lineTo(20, o + 5); x.stroke(); } x.restore();   // hatching sweeps across the blade
        x.fillStyle = '#ffe08a'; crescentPath(x, 10.5, .8); x.fill();
        x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,60,80,.45)'; crescentPath(x, 25, 1.34); x.fill(); x.restore();
        // speed lines beside the blade
        x.save(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1.5; x.lineCap = 'round'; for (let i = 0; i < 7; i++) { const o = (i - 3) * 13 + Math.sin(c.t * 50 + i) * 4, l0 = 30 + (i * 37 % 50); x.beginPath(); x.moveTo(fx0 - sa * o - ca * 20, fy0 + ca * o - sa * 20); x.lineTo(fx0 - sa * o - ca * (20 + l0), fy0 + ca * o - sa * (20 + l0)); x.stroke(); } x.restore(); }
      // impact frame: one beat of inverted black-and-white with a white cut line
      if (c.impT && c.t - c.impT < .1) { x.save(); x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'saturation'; x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
        x.restore(); }
    }
    drawShards(x);
    drawPBlasts(x);
    drawImpacts(x);
    drawScatter(x);
    // Not Yet: a steady light-blue halo until the destined hit lands
    for (const w of ents) if (w.fate && !w.dead) { x.save(); x.translate(w.x, w.y - 44 * HS); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .6 + Math.sin(T * 10) * .2; x.strokeStyle = '#bff0ff'; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 24 * SC, 52 * HS, 0, 0, 7); x.stroke(); x.restore(); }
    // Braced (Held Stance): a gold guard shimmer
    for (const w of ents) if (w.braceT > 0 && !w.dead) { x.save(); x.translate(w.x, w.y - 44 * HS); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, w.braceT) * (.45 + Math.sin(T * 12) * .15); x.strokeStyle = '#ffe08a'; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 26 * SC, 50 * HS, 0, 0, 7); x.stroke(); x.restore(); }
    // Grand Cleave countdown: 3, 2, 1 over the head while the cleaving cast charges
    for (const w of ents) { if (w.dead || ended || w.cleaveN !== cleaveNeed(w) - 1 || w.book[w.i] !== 'dissect' || !U(w, 'dissect', 'cleave')) continue;
      const fr = Math.max(0, Math.min(.999, w.p / castT(w, 'dissect'))), num = 3 - Math.floor(fr * 3), ph = fr * 3 % 1;
      if (w.cdNum !== num) { w.cdNum = num; try { sfx('ui_deal', { x: w.x }); } catch (e) {} }
      const pop = 1 + .7 * Math.pow(1 - Math.min(1, ph * 5), 2), al = ph < .1 ? ph / .1 : 1 - Math.max(0, ph - .45) / .55;
      x.save(); x.translate(w.x, w.y - 142 * HS); x.scale(pop, pop); x.globalAlpha = Math.max(0, al); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "56px 'Lilita One', system-ui";
      x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#2a0006'; x.strokeText(num, 0, 0); x.fillStyle = num === 1 ? '#ff3b4a' : '#ffffff'; x.fillText(num, 0, 0);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.max(0, al) * .5; x.strokeStyle = '#ff3b4a'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 34 + ph * 18, 0, 7); x.stroke(); x.restore(); }
    // Grand Cleave charge marks and Counter Stance guard
    for (const w of ents) { if (w.dead) continue;
      if (w.cleaveN > 0 && !(w.cleaveN === cleaveNeed(w) - 1 && w.book[w.i] === 'dissect' && U(w, 'dissect', 'cleave'))) for (let i = 0; i < w.cleaveN; i++) { const mx = w.x + (i - (w.cleaveN - 1) / 2) * 16, my = w.y - 96 * SC + Math.sin(T * 5 + i) * 2; x.save(); x.translate(mx, my); x.rotate(-.7); x.fillStyle = '#fff'; x.strokeStyle = '#2a0006'; x.lineWidth = 1.4; crescentPath(x, 8, 1.1); x.fill(); x.stroke(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,60,80,.6)'; crescentPath(x, 10, 1.2); x.fill(); x.restore(); }
      if (w.counter) { const c = w.counter, q = Math.max(0, Math.min(1, c.t / 2.4)), pul = 1 + Math.sin(c.age * 9) * .05; x.save(); x.translate(w.x, w.y); x.scale(1, .6); x.strokeStyle = '#000'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 26 * pul, -1.571, -1.571 + 6.283 * q); x.stroke(); x.strokeStyle = c.deflect ? '#9fd8ff' : '#ffd6d2'; x.lineWidth = 2.6; x.stroke(); x.restore();
        x.save(); x.translate(w.x + w.face * 14, w.y - 38 * SC); x.scale(w.face, 1); x.globalAlpha = .85; x.lineCap = 'round'; for (const [lw, col] of [[5, '#000'], [2.6, '#fff']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, 13, -1.1, 1.1); x.stroke(); } x.restore(); }
    }
    // collapse orbs
    // Collapse: the arena dims and a violet singularity drags light into itself
    if (orbsC.some(c => !c.repel && !c.draw)) { x.save(); x.fillStyle = 'rgba(10,2,30,.32)'; x.fillRect(0, 0, cv.width / dpr, cv.height / dpr); x.restore(); }
    for (const c of orbsC) { if (c.draw) {   // Draw orb: a blue core inside a wavering, smoky halo that drags light in behind it
        x.save(); x.translate(c.x, c.y - 36 * HS); const t = c.t, R = 13 + Math.sin(t * 16) * 1.5, grow = Math.min(1, t * 5); x.scale(grow, grow);
        x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const a = t * (1.6 + i * .3) + i * 1.05, rx = R * (2.2 + .5 * Math.sin(t * 3 + i)), ry = R * (1.3 + .4 * Math.cos(t * 2.4 + i)); x.save(); x.rotate(a); x.globalAlpha = .16 + .08 * Math.sin(t * 5 + i); const g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(90,170,255,.9)'); g.addColorStop(.5, 'rgba(20,80,220,.4)'); g.addColorStop(1, 'rgba(0,30,120,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(rx * .15, 0, rx, ry, 0, 0, 7); x.fill(); x.restore(); }
        const g3 = x.createRadialGradient(0, 0, 0, 0, 0, R * 2.6); g3.addColorStop(0, '#ffffff'); g3.addColorStop(.3, 'rgba(110,190,255,.95)'); g3.addColorStop(.7, 'rgba(40,120,255,.35)'); g3.addColorStop(1, 'rgba(40,120,255,0)'); x.fillStyle = g3; x.beginPath(); x.arc(0, 0, R * 2.6, 0, 7); x.fill();
        x.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a0 = i * .785 + t * 3, r0 = R * 3 * (1 - ((t * 1.4 + i / 8) % 1)) + R * .6; x.strokeStyle = `rgba(${i % 2 ? 190 : 90},${i % 2 ? 225 : 170},255,${.55 * (1 - ((t * 1.4 + i / 8) % 1))})`; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r0, a0, a0 + .9); x.stroke(); }
        x.globalCompositeOperation = 'source-over'; x.fillStyle = '#020a1a'; x.beginPath(); x.arc(0, 0, R * .55, 0, 7); x.fill(); x.strokeStyle = '#d6ecff'; x.lineWidth = 1.6; x.stroke();
        x.restore(); continue; }
      if (c.repel) { x.save(); x.translate(c.x, c.y - 36 * HS); x.fillStyle = '#12020a'; x.beginPath(); x.arc(0, 0, (c.bounced ? 11 : 9), 0, 7); x.fill(); x.globalCompositeOperation = 'lighter'; const R3 = (c.bounced ? 14 : 11) + Math.sin(c.t * 22) * 1.5, g3 = x.createRadialGradient(0, 0, 0, 0, 0, R3 * 2.4); g3.addColorStop(0, '#ffffff'); g3.addColorStop(.35, c.bounced ? 'rgba(255,90,90,.95)' : 'rgba(255,150,150,.6)'); g3.addColorStop(1, 'rgba(255,40,40,0)'); x.fillStyle = g3; x.beginPath(); x.arc(0, 0, R3 * 2.4, 0, 7); x.fill();
        if (c.bounced) { x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.setLineDash([3, 4]); x.beginPath(); x.arc(0, 0, R3 * 1.7, c.t * 8, c.t * 8 + 6.283); x.stroke(); } x.restore(); continue; }
      if (c.wind && !c.launched) { drawCollapseWind(x, c); continue; }
      // rainbow wake from the launch point to the singularity, cycling like Desperate Output
      { const L0 = Math.hypot(c.x - c.sx, c.y - c.sy); if (L0 > 4) { const N = 24, yo = -36 * HS, age = c.t - (c.t0 || 0), fadeIn = Math.min(1, age * 4); x.save(); x.lineCap = 'round';
          x.globalAlpha = .5 * fadeIn; x.strokeStyle = '#07020d'; x.lineWidth = 26; x.beginPath(); x.moveTo(c.sx + (c.x - c.sx) * .15, c.sy + (c.y - c.sy) * .15 + yo); x.lineTo(c.x, c.y + yo); x.stroke();   // ink underlay so the colours read on light floors
          for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; x.globalAlpha = (.25 + .7 * u1) * fadeIn; x.strokeStyle = `hsl(${(u0 * 360 - T * 420) % 360 + 360 | 0},100%,58%)`; x.lineWidth = 8 + 14 * u1; x.beginPath(); x.moveTo(c.sx + (c.x - c.sx) * u0, c.sy + (c.y - c.sy) * u0 + yo); x.lineTo(c.sx + (c.x - c.sx) * u1, c.sy + (c.y - c.sy) * u1 + yo); x.stroke(); }
          x.globalAlpha = .7 * fadeIn; x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.moveTo(c.sx + (c.x - c.sx) * .3, c.sy + (c.y - c.sy) * .3 + yo); x.lineTo(c.x, c.y + yo); x.stroke(); x.restore(); } }
      x.save(); x.translate(c.x, c.y - 36 * HS); const R = 26 + Math.sin(c.t * 18) * 2.6, grow = Math.min(1, c.t * 4);
      x.scale(grow, grow); x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, 0, 0, 0, 0, R * 3.2); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.25, 'rgba(196,140,255,.85)'); g.addColorStop(.6, 'rgba(110,40,220,.35)'); g.addColorStop(1, 'rgba(90,20,180,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * 3.2, 0, 7); x.fill();
      // light being pulled in: curved streaks spiralling to the core
      x.lineCap = 'round'; for (let i = 0; i < 12; i++) { const ph = (c.t * 1.6 + i / 12) % 1, a0 = i * 2.1 + c.t * 3, r0 = R * 3.4 * (1 - ph) + R * .5; x.strokeStyle = i % 2 ? `rgba(111,211,255,${ph})` : `rgba(255,90,90,${ph})`; x.lineWidth = 2.2; x.beginPath(); x.arc(0, 0, r0, a0, a0 + .7); x.stroke(); }
      // lightning arcs
      for (const q of (c.arcs || [])) { x.strokeStyle = 'rgba(235,220,255,.95)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(Math.cos(q.a) * R * .6, Math.sin(q.a) * R * .6); for (let s2 = 1; s2 <= 3; s2++) { const rr = R * .6 + (q.r - R * .6) * s2 / 3; x.lineTo(Math.cos(q.a) * rr - Math.sin(q.a) * q.j[s2 - 1], Math.sin(q.a) * rr + Math.cos(q.a) * q.j[s2 - 1]); } x.stroke(); }
      // accretion ring, tilted, blue and red halves chasing each other
      x.save(); x.rotate(.5); x.scale(1, .38); x.lineWidth = 4; for (const [cc, ph] of [['#6fd3ff', 0], ['#ff4a4a', Math.PI]]) { x.strokeStyle = cc; x.beginPath(); x.arc(0, 0, R * 1.9, c.t * 10 + ph, c.t * 10 + ph + 2.6); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, R * 1.9, 0, 7); x.stroke(); x.restore();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#05010f'; x.beginPath(); x.arc(0, 0, R * .62, 0, 7); x.fill(); x.strokeStyle = '#e8dcff'; x.lineWidth = 2; x.stroke(); x.restore(); }
    // one-shot fx
    for (const f of fx) {
      const k = f.t / f.life; x.save();
      if (f.k === 'repel') { x.translate(f.x, f.y); x.globalAlpha = 1 - k; x.strokeStyle = '#ff4a4a'; x.lineWidth = 6 * (1 - k) + 1; x.beginPath(); x.ellipse(0, 0, f.r * (.2 + k * .8), f.r * (.2 + k * .8) / 1.4, 0, 0, 7); x.stroke(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,80,80,${.25 * (1 - k)})`; x.fill(); }
      else if (f.k === 'draw') { const w = f.w; x.translate(w.x, w.y - 40 * HS); x.globalCompositeOperation = 'lighter';
        x.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a0 = i * .7 + f.t * 2, r0 = f.r * 1.5 * (1 - k * .8); x.strokeStyle = `rgba(${i % 3 ? '111,211,255' : '255,255,255'},${.6 * (1 - k)})`; x.lineWidth = 2.6 - (i % 3) * .6; x.beginPath(); for (let s2 = 0; s2 <= 10; s2++) { const u = s2 / 10, rr = r0 * (1 - u * .85), an = a0 + u * 2.6; s2 ? x.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * .7) : x.moveTo(Math.cos(an) * rr, Math.sin(an) * rr * .7); } x.stroke(); } for (let i = 0; i < 3; i++) { const rr = f.r * (1 - k) * (1 - i * .26); x.strokeStyle = `rgba(111,211,255,${.55 * (1 - k)})`; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 40 * HS, rr, rr * .6, 0, 0, 7); x.stroke(); } for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + f.t * 6, r0 = f.r * (1 - k) * (.6 + (i % 3) * .2); x.strokeStyle = `rgba(111,211,255,${.7 * (1 - k)})`; x.lineWidth = 2; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * .7); x.lineTo(Math.cos(a + .3) * r0 * .55, Math.sin(a + .3) * r0 * .55 * .7); x.stroke(); } const g = x.createRadialGradient(0, 0, 0, 0, 0, 18); g.addColorStop(0, 'rgba(200,240,255,.9)'); g.addColorStop(1, 'rgba(60,160,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 18, 0, 7); x.fill(); }
      else if (f.k === 'domain') { x.translate(f.x, f.y); const R = f.r * Math.min(1, k * 3); x.globalAlpha = 1 - Math.max(0, (k - .5) * 2); x.fillStyle = f.c + '33'; x.strokeStyle = f.sure ? '#ffe08a' : f.l; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, R, R / 1.4, 0, 0, 7); x.fill(); x.stroke(); x.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + f.t; x.beginPath(); x.moveTo(Math.cos(a) * R * .3, Math.sin(a) * R * .3 / 1.4); x.lineTo(Math.cos(a) * R, Math.sin(a) * R / 1.4); x.stroke(); } }
      else if (f.k === 'ping') { x.translate(f.x, f.y - 36 * HS); x.globalAlpha = 1 - k; x.strokeStyle = '#e6f0ff'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.lineTo(Math.cos(a) * (6 + k * 14), Math.sin(a) * (6 + k * 14)); } x.closePath(); x.stroke(); }
      else if (f.k === 'punch') { x.translate(f.x, f.y); x.rotate(f.a); x.scale(f.s || 1, f.s || 1); x.globalAlpha = 1 - k; x.fillStyle = f.hot ? '#ffd27a' : '#fff'; x.strokeStyle = '#000'; x.lineWidth = 1.5; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, r = (i % 2 ? 4 : 11) * (1 + k * .6); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke(); }
      else if (f.k === 'crit') { x.translate(f.x, f.y); x.rotate(f.a); const g2 = (1 + k * .9) * (f.s || 1); x.globalAlpha = 1 - k * k;   // gold starburst
        x.fillStyle = '#ffb020'; x.strokeStyle = '#000'; x.lineWidth = 1.8; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = (i % 2 ? 7 : 19) * g2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#fff6c8'; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + .2, r = (i % 2 ? 4 : 11) * g2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,224,138,${1 - k})`; x.lineWidth = 3 * (1 - k) + 1; x.beginPath(); x.arc(0, 0, 14 + k * 26, 0, 7); x.stroke(); }
      else if (f.k === 'jab') { x.globalAlpha = (1 - k) * .9; x.lineCap = 'round'; const mx2 = (f.x + f.x2) / 2 + f.side * 7, my2 = (f.y + f.y2) / 2 - 5; x.strokeStyle = '#000'; x.lineWidth = 6; x.beginPath(); x.moveTo(f.x, f.y); x.quadraticCurveTo(mx2, my2, f.x2, f.y2); x.stroke(); x.strokeStyle = f.hot ? '#ffb347' : '#fff'; x.lineWidth = 3.4; x.stroke(); }
      else if (f.k === 'cut') { // two halves of a sliced spell drifting apart, with the cut line between them
        const nx = -Math.sin(f.a), ny = Math.cos(f.a), off = 4 + k * 22; x.translate(f.x, f.y);
        for (const sd of [1, -1]) { x.save(); x.translate(nx * sd * off, ny * sd * off + k * k * 26); x.rotate(f.a + sd * k * .9); x.globalAlpha = 1 - k; const g3 = x.createRadialGradient(0, 0, 1, 0, 0, 11); g3.addColorStop(0, f.c[2] || '#fff'); g3.addColorStop(.5, f.c[0]); g3.addColorStop(1, f.c[1]); x.fillStyle = g3; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 10, sd > 0 ? 0 : Math.PI, sd > 0 ? Math.PI : Math.PI * 2); x.closePath(); x.fill(); x.stroke(); x.restore(); }
        x.rotate(f.a); x.globalAlpha = Math.max(0, 1 - k * 2.4); x.strokeStyle = '#000'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26, 0); x.lineTo(26, 0); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); }
      else if (f.k === 'counter') { x.translate(f.x, f.y); x.globalAlpha = 1 - k; x.lineCap = 'round'; for (const [lw, col] of [[7, '#000'], [4, '#ffe08a']]) { x.strokeStyle = col; x.lineWidth = lw; for (const sd of [1, -1]) { x.beginPath(); x.arc(0, 0, 16 + k * 30, sd > 0 ? -.9 : Math.PI - .9, sd > 0 ? .9 : Math.PI + .9); x.stroke(); } } x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,240,200,${.6 * (1 - k)})`; x.beginPath(); x.arc(0, 0, 22 * (1 - k * .5), 0, 7); x.fill(); }
      else if (f.k === 'bolt') { // lingering afterglow along a lightning bolt, with a flare where it lands
        x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; const e = f.pts[f.pts.length - 1];
        for (const [lw, col] of [[16, `rgba(255,220,90,${.3 * (1 - k)})`], [7, `rgba(255,247,176,${.6 * (1 - k)})`], [2.4, `rgba(255,255,255,${1 - k})`]]) { x.strokeStyle = col; x.lineWidth = lw * (1 - k * .5); x.beginPath(); f.pts.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.stroke(); }
        const g5 = x.createRadialGradient(e.x, e.y, 0, e.x, e.y, 34 * (1 - k * .4)); g5.addColorStop(0, `rgba(255,255,255,${1 - k})`); g5.addColorStop(.4, `rgba(255,230,120,${.7 * (1 - k)})`); g5.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = g5; x.beginPath(); x.arc(e.x, e.y, 34, 0, 7); x.fill(); }
      else if (f.k === 'spark') { // ki sparks: jagged streaks flying out from the caster
        x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
        for (const r of f.rays) { const q = Math.max(0, Math.min(1, (k - r.d) / (1 - r.d))); if (q <= 0) continue; const r0 = 8 + q * r.len * 2.2, L = r.len * .8 * (1 - q * .6), ca = Math.cos(r.a), sa = Math.sin(r.a);
          // a thin three-kink streak that flickers as it flies
          const pts = [[r0, 0], [r0 + L * .35, r.kink * 9], [r0 + L * .65, -r.kink * 7], [r0 + L, 0]].map(([d, o]) => [ca * d - sa * o, (sa * d + ca * o) * .8]);
          for (const [lw, col, al] of [[3.2 + f.tier * .6, f.m || f.l, .55], [1.1, '#ffffff', 1]]) { x.globalAlpha = (1 - q) * al * (.75 + Math.random() * .25); x.strokeStyle = col; x.lineWidth = lw * (1 - q * .6); x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); } }
        const g = x.createRadialGradient(0, 0, 0, 0, 0, 18 + f.tier * 4); g.addColorStop(0, `rgba(255,255,255,${.9 * (1 - k)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(0, 0, 18 + f.tier * 4, 0, 7); x.fill(); }
      else if (f.k === 'kiring') { x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1 - k; x.strokeStyle = '#ffffff'; x.lineWidth = 3 * (1 - k) + .5; x.beginPath(); x.ellipse(0, 0, 14 + k * 46, (14 + k * 46) * .8, 0, 0, 7); x.stroke(); x.strokeStyle = f.l; x.lineWidth = 6 * (1 - k); x.beginPath(); x.ellipse(0, 0, 10 + k * 36, (10 + k * 36) * .8, 0, 0, 7); x.stroke(); }
      else if (f.k === 'mseal') { // magic seal: base circle and triangle; each upgrade adds an element, each tier a ring
        const grow = .55 + .45 * Math.min(1, k * 4), R = (24 + f.tier * 5) * grow, rot = f.spin + k * 1.4, fade = k < .7 ? 1 : (1 - k) / .3;
        x.translate(f.x, f.y); x.scale(1, .55); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .9 * fade; x.lineCap = 'round';
        const ring = (r, lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); };
        const poly = (r, n, a0, col, lw) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (let i = 0; i <= n; i++) { const a = a0 + i / n * 6.283; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.stroke(); };
        x.save(); x.shadowColor = f.l; x.shadowBlur = 10; ring(R, 2.6, f.l); ring(R * .74, 1.4, '#ffffff'); x.restore();
        poly(R * .74, 3, rot, f.l, 1.8);                                                              // base triangle
        if (f.ups >= 1) { x.strokeStyle = '#ffffff'; x.lineWidth = 1.3; x.beginPath(); for (let i = 0; i < 16; i++) { const a = -rot * .6 + i / 16 * 6.283; x.moveTo(Math.cos(a) * R * .8, Math.sin(a) * R * .8); x.lineTo(Math.cos(a) * R * (i % 2 ? .9 : .95), Math.sin(a) * R * (i % 2 ? .9 : .95)); } x.stroke(); }   // rune ticks
        if (f.ups >= 2) poly(R * .74, 3, rot + Math.PI, f.m === '#000' ? '#fff' : f.l, 1.8);           // second triangle: hexagram
        if (f.ups >= 3) { x.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const a = rot + i / 6 * 6.283 + (i % 2 ? Math.PI / 3 : 0); x.beginPath(); x.arc(Math.cos(rot + i * 1.047) * R * .74, Math.sin(rot + i * 1.047) * R * .74, 2.2, 0, 7); x.fill(); } for (let i = 0; i < 4; i++) { const a = -rot * 2 + i * 1.571; x.fillStyle = f.l; x.beginPath(); x.arc(Math.cos(a) * R, Math.sin(a) * R, 3, 0, 7); x.fill(); } }   // nodes and orbiting motes
        if (f.ups >= 4) { x.strokeStyle = f.l; x.lineWidth = 1.6; for (let i = 0; i < 8; i++) { const a = rot * .5 + i / 8 * 6.283; x.beginPath(); x.arc(Math.cos(a) * R * 1.18, Math.sin(a) * R * 1.18, R * .2, a + 1.9, a + 4.4); x.stroke(); } }   // petal ring
        if (f.ups >= 5) { const g = x.createRadialGradient(0, 0, 0, 0, 0, R * .5); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * .5, 0, 7); x.fill(); }
        for (let t = 2; t <= f.tier; t++) { x.save(); x.setLineDash([3, 5]); x.lineDashOffset = -k * 40 * (t % 2 ? 1 : -1); ring(R * (1.1 + (t - 1) * .2) + (f.ups >= 4 ? R * .3 : 0), 1.6, t === 3 ? '#ffffff' : f.l); x.restore(); } }
      else if (f.k === 'clash') { // two fists meet: pressure rings, a white core, speed lines
        x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { const q = Math.max(0, k * 1.6 - i * .12); if (q <= 0 || q >= 1) continue; const R = 14 + q * (110 + i * 30); x.globalAlpha = (1 - q) * .9; x.strokeStyle = i ? '#d9e6ff' : '#ffffff'; x.lineWidth = (7 - i * 2) * (1 - q) + 1; x.beginPath(); x.ellipse(0, 0, R, R * .55, 0, 0, 7); x.stroke(); }
        if (k < .5) { const q = k / .5; x.globalAlpha = 1 - q; x.strokeStyle = '#ffffff'; x.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283 + i, r0 = 18 + q * 60, r1 = r0 + 30 + (i % 3) * 14; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * .7); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * .7); x.stroke(); } }
        if (k < .35) { const q = k / .35, g = x.createRadialGradient(0, 0, 0, 0, 0, 46); g.addColorStop(0, `rgba(255,255,255,${1 - q})`); g.addColorStop(.5, `rgba(255,240,200,${.6 * (1 - q)})`); g.addColorStop(1, 'rgba(255,220,150,0)'); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(0, 0, 46, 0, 7); x.fill(); } }
      else if (f.k === 'collapse0') { // blue and red spiral inward and fuse
        x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; for (const [cc, ph] of [['#6fd3ff', 0], ['#ff4a4a', Math.PI]]) { x.strokeStyle = cc; x.lineWidth = 5 * (1 - k) + 1; x.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, rr = 90 * (1 - k) * (1 - u) + 4, a = ph + u * 7 + k * 9; i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * .7) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * .7); } x.stroke(); }
        x.strokeStyle = `rgba(196,140,255,${1 - k})`; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 20 + k * 110, (20 + k * 110) * .7, 0, 0, 7); x.stroke(); }
      else if (f.k === 'implode') { // rings rush inward, then one violet burst outward
        x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter';
        if (k < .35) { const q = k / .35; for (let i = 0; i < 3; i++) { const rr = (110 - i * 26) * (1 - q) + 6; x.strokeStyle = `rgba(${i % 2 ? '111,211,255' : '255,90,90'},${.4 + q * .6})`; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, rr, 0, 7); x.stroke(); } x.fillStyle = '#000'; x.globalCompositeOperation = 'source-over'; x.beginPath(); x.arc(0, 0, 16 * (1 - q) + 4, 0, 7); x.fill(); }
        else { const q = (k - .35) / .65, R2 = 20 + q * 150, g = x.createRadialGradient(0, 0, 0, 0, 0, R2); g.addColorStop(0, `rgba(255,255,255,${1 - q})`); g.addColorStop(.5, `rgba(196,140,255,${.8 * (1 - q)})`); g.addColorStop(1, 'rgba(90,20,180,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R2, 0, 7); x.fill();
          x.strokeStyle = `rgba(255,255,255,${1 - q})`; x.lineWidth = 5 * (1 - q) + 1; x.beginPath(); x.ellipse(0, 0, R2, R2 * .6, 0, 0, 7); x.stroke(); for (let i = 0; i < 10; i++) { const a = i * .63; x.beginPath(); x.moveTo(Math.cos(a) * R2 * .5, Math.sin(a) * R2 * .5); x.lineTo(Math.cos(a) * R2 * 1.1, Math.sin(a) * R2 * 1.1); x.lineWidth = 1.5; x.stroke(); } } }
      else if (f.k === 'radiance') { const w = f.w; if (w.dead) { x.restore(); continue; } const a = (1 - k) * (k < .12 ? k / .12 : 1) * (f.big ? 1 : .75), cy = w.y - 42 * HS, R = (f.big ? 62 : 48) * (1 + k * .25);
        x.translate(w.x, cy); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 0, 6, 0, 0, R); g.addColorStop(0, `rgba(239,252,255,${.18 * a})`); g.addColorStop(.55, `rgba(127,216,255,${.32 * a})`); g.addColorStop(1, 'rgba(127,216,255,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, R * .62, R, 0, 0, 7); x.fill();
        x.strokeStyle = `rgba(191,240,255,${.9 * a})`; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, 0, R * .46, R * .82, 0, 0, 7); x.stroke();
        x.lineCap = 'round'; for (let i = 0; i < (f.big ? 10 : 6); i++) { const px = Math.sin(i * 2.4 + w.t) * R * .45, py = R * .7 - ((k * 1.6 + i * .17) % 1) * R * 1.6; x.strokeStyle = `rgba(239,252,255,${a})`; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - 9); x.stroke(); } }
      else if (f.k === 'aura') { /* drawn behind the caster, in the ground pass */ }
      else if (f.k === 'redir') { x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; const q = Math.min(1, k * 2.5), ex = f.x + (f.x2 - f.x) * q, ey = f.y + (f.y2 - f.y) * q;
        for (const [lw, col] of [[8, `rgba(255,224,138,${.5 * (1 - k)})`], [2.5, `rgba(255,255,255,${1 - k})`]]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(ex, ey); x.stroke(); } }
      else if (f.k === 'stars') { const w = f.w; if (w.dead || !(w.stunT > 0)) { x.restore(); continue; } x.translate(w.x, w.y - 92 * HS); x.globalAlpha = Math.min(1, (1 - k) * 3);
        for (let i = 0; i < 3; i++) { const a = f.t * 6 + i * 2.094, sx = Math.cos(a) * 16, sy = Math.sin(a) * 5; x.save(); x.translate(sx, sy); x.rotate(f.t * 4); x.fillStyle = '#ffe08a'; x.strokeStyle = '#000'; x.lineWidth = 1.4; x.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.4 : 6, b = j / 10 * 6.283 - 1.571; x.lineTo(Math.cos(b) * r, Math.sin(b) * r); } x.closePath(); x.fill(); x.stroke(); x.restore(); } }
      else if (f.k === 'seal') { // octagon seal on the ground: one ring per tier
        x.translate(f.x, f.y); x.scale(1, .6); x.rotate(f.spin + k * (1.2 + f.tier * .4)); const R0 = (18 + f.tier * 9) * (.5 + .5 * Math.min(1, k * 3)); x.globalAlpha = (1 - k) * .95; x.globalCompositeOperation = 'lighter';
        for (let rI = 0; rI < f.tier; rI++) { const rr = R0 * (1 - rI * .27); x.strokeStyle = rI % 2 ? '#ffffff' : f.l; x.lineWidth = 2.6 - rI * .5; x.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * 6.283 * (rI % 2 ? -1 : 1); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.stroke(); }
        x.strokeStyle = f.m; x.lineWidth = 1.6; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + .39; x.moveTo(Math.cos(a) * R0 * 1.06, Math.sin(a) * R0 * 1.06); x.lineTo(Math.cos(a) * R0 * 1.3, Math.sin(a) * R0 * 1.3); } x.stroke(); }
      else if (f.k === 'pillar') { x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter'; const wv = 26 * (1 - k * .6), g4 = x.createLinearGradient(0, -230, 0, 0); g4.addColorStop(0, 'rgba(255,255,255,0)'); g4.addColorStop(.6, f.l); g4.addColorStop(1, '#ffffff'); x.globalAlpha = (1 - k) * .7; x.fillStyle = g4; x.fillRect(-wv, -230, wv * 2, 230); }
      else if (f.k === 'glint') { x.translate(f.x, f.y); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1 - k; const wv = 70 * Math.sin(Math.PI * Math.min(1, k * 1.4)); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-wv, 0); x.lineTo(0, -2.2); x.lineTo(wv, 0); x.lineTo(0, 2.2); x.closePath(); x.fill(); x.fillStyle = '#ff3b4a'; x.beginPath(); x.moveTo(0, -14 * (1 - k)); x.lineTo(1.6, 0); x.lineTo(0, 14 * (1 - k)); x.lineTo(-1.6, 0); x.closePath(); x.fill(); }
      else if (f.k === 'refill') { const w = f.w; x.translate(w.x, w.y - 40 * HS); x.globalAlpha = 1 - k; x.strokeStyle = '#ffd6d2'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 34 * (1 - k) + 6, 0, 7); x.stroke(); x.setLineDash([3, 5]); x.beginPath(); x.arc(0, 0, 50 * (1 - k) + 8, 0, 7); x.stroke(); }
      else if (f.k === 'after') { x.globalAlpha = .5 * (1 - k); const ww = Object.assign(Object.create(Object.getPrototypeOf(f.w)), f.w, { x: f.x, y: f.y, flash: 0, recoil: 0, ghostT: 0, shell: null }); try { drawWiz(ww); } catch (e) {} }
      x.restore();
    }
    // Copy Cast eye flash (screen space)
    if (EYE) drawEye(x);
  }

  /* ink-and-flame aura: dark ink tongues, a coloured flame inside them, and a bright core glow */
  const mixHex = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t); return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
  const hsh = n => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  /* The sorcerer's aura, drawn behind the caster. One merged flame silhouette (tongues that swell, lean and shed
     droplets) is laid down as an ink outline, a graded body, a pale inner flame and a white core. At high intensity
     lightning crawls over it and chips of floor lift off the ground. drawAuraFront adds low flames in front of the feet. */
  function drawInkAura(x, w, inten, l, m, big) {
    if (inten <= .01) return;
    const S2 = 2, CW = 190, CH = 270, ox = CW / 2, oy = 204, mk = () => { const c = document.createElement('canvas'); c.width = CW * S2; c.height = CH * S2; return c; };
    const st = drawInkAura.st || (drawInkAura.st = { m: mk(), t: mk() }), mx = st.m.getContext('2d'), tx = st.t.getContext('2d');
    const t = T + (w.t || 0) * .37, k = Math.min(1.3, inten) * (big ? 1.25 : 1), RX = 18 * SC, RY = 40 * HS, cy0 = -40 * HS;
    const flame = sc => {
      mx.setTransform(S2, 0, 0, S2, 0, 0); mx.clearRect(0, 0, CW, CH);
      mx.beginPath(); mx.ellipse(ox, oy + cy0 + 8, RX * (1 + .22 * k) * sc, RY * (1 + .08 * k) * sc, 0, 0, 7); mx.fill();
      const N = 11;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), edge = Math.abs(u - .5) * 2, ang = (u - .5) * 2.75, rx0 = ox + Math.sin(ang) * RX * sc, ry0 = oy + cy0 - Math.cos(ang) * RY * .8 * sc;
        // each tongue runs its own cycle: it swells, hangs, then sheds a droplet and sinks back
        const cyc = (t * (.85 + (i * 37 % 7) * .07) + i * .413) % 1, grow = cyc < .72 ? Math.sin(cyc / .72 * 1.5708) : 1 - (cyc - .72) / .28 * .4;
        const h = (22 + 44 * (1 - edge * edge * .8)) * k * sc * (.5 + .5 * grow), lean = Math.sin(ang) * h * .42 + Math.sin(t * 5 + i * 1.9) * 4.5;
        const wd = (7 + 4.5 * (1 - edge)) * sc * (.78 + .22 * k), tipx = rx0 + lean, tipy = ry0 - h;
        mx.beginPath(); mx.moveTo(rx0 - wd, ry0 + 14);
        mx.bezierCurveTo(rx0 - wd * 1.3, ry0 - h * .3, tipx - wd * .7, tipy + h * .5, tipx, tipy);
        mx.bezierCurveTo(tipx + wd * .15, tipy + h * .4, rx0 + wd * 1.3, ry0 - h * .25, rx0 + wd, ry0 + 14);
        mx.closePath(); mx.fill();
        if (cyc > .68 && k > .42) { const q = (cyc - .68) / .32, dr = wd * .5 * (1 - q); if (dr > .7) { mx.beginPath(); mx.ellipse(tipx + Math.sin(t * 6 + i) * 2.5, tipy - 5 - q * 24 * k, dr * .75, dr * 1.55, 0, 0, 7); mx.fill(); } }
      }
      for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const bx = ox + sd * RX * (1.02 + i * .26) * sc, by = oy - 5 - i * 17, h = (13 + 8 * Math.sin(t * 9 + i + sd)) * k * sc; mx.beginPath(); mx.moveTo(bx - sd * 6, by + 8); mx.quadraticCurveTo(bx + sd * 7, by - h * .3, bx + sd * (4 + Math.sin(t * 8 + i) * 3), by - h); mx.quadraticCurveTo(bx - sd * 2, by - h * .3, bx - sd * 8, by - 2); mx.closePath(); mx.fill(); }
    };
    const tint = paint => { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, CW * S2, CH * S2); tx.drawImage(st.m, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = paint; tx.fillRect(0, 0, CW * S2, CH * S2); return st.t; };
    const X0 = w.x - ox, Y0 = w.y - oy, al = Math.min(1, inten * 1.5), top = (oy + cy0 - RY - 66 * k) * S2, bot = oy * S2; x.save();
    // seat it on the floor, and let it bloom on dark arenas
    x.fillStyle = `rgba(8,3,20,${.26 * al})`; x.beginPath(); x.ellipse(w.x, w.y + 1, 30 * k + 8, 10 * k + 3, 0, 0, 7); x.fill();
    x.globalCompositeOperation = 'lighter'; const bl = x.createRadialGradient(w.x, w.y + cy0, 6, w.x, w.y + cy0, 96 * k); bl.addColorStop(0, m); bl.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = al * .42; x.fillStyle = bl; x.beginPath(); x.arc(w.x, w.y + cy0, 96 * k, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over';
    flame(1);
    const ink = tint('#07020d'); x.globalAlpha = al * .95; for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283; x.drawImage(ink, X0 + Math.cos(a) * 2.8, Y0 + Math.sin(a) * 2.8, CW, CH); }
    const g1 = tx.createLinearGradient(0, top, 0, bot); g1.addColorStop(0, mixHex(m, '#12040c', .18)); g1.addColorStop(.22, m); g1.addColorStop(.7, mixHex(m, l, .55)); g1.addColorStop(1, l); x.globalAlpha = al; const body = tint(g1); x.drawImage(body, X0, Y0, CW, CH);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = al * .3; x.drawImage(body, X0, Y0, CW, CH); x.globalCompositeOperation = 'source-over';
    flame(.74); const g2 = tx.createLinearGradient(0, top + 50 * S2, 0, bot); g2.addColorStop(0, mixHex(m, l, .7)); g2.addColorStop(.45, l); g2.addColorStop(1, '#ffffff'); x.globalAlpha = al * .96; x.drawImage(tint(g2), X0, Y0 + 5, CW, CH);
    if (inten > .4) { flame(.47); x.globalAlpha = al * Math.min(1, (inten - .4) * 3) * .92; x.drawImage(tint('#ffffff'), X0, Y0 + 11, CW, CH); }
    // embers streak upward off the tips
    x.lineCap = 'round'; for (let i = 0; i < 9; i++) { const ph = (t * .8 + i * .37) % 1, ex = w.x + Math.sin(i * 2.4 + t * 1.6) * RX * 1.3, ey = w.y + cy0 - RY * .45 - ph * 86 * k; x.globalAlpha = al * (1 - ph); x.strokeStyle = i % 3 ? l : '#ffffff'; x.lineWidth = 1.7; x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex + Math.sin(t * 3 + i) * 1.5, ey + 3 + 5 * (1 - ph)); x.stroke(); }
    // chips of floor float up around the feet
    if (inten > .5) for (let i = 0; i < 5; i++) { const ph = (t * .55 + i * .21) % 1, px = w.x + (hsh(i * 3.3 + 1) - .5) * RX * 4, py = w.y + 2 - ph * 36 * k, sz = 1.6 + hsh(i + 5) * 1.8; x.save(); x.translate(px, py); x.rotate(t * 3 + i); x.globalAlpha = al * Math.sin(ph * Math.PI) * .9; x.fillStyle = '#1c1424'; x.beginPath(); x.moveTo(-sz, 0); x.lineTo(0, -sz * .8); x.lineTo(sz, 0); x.lineTo(0, sz * .7); x.closePath(); x.fill(); x.restore(); }
    // near full power, lightning crawls over the flame
    if (inten > .7) { const seed = Math.floor(t * 13); x.lineJoin = 'round';
      for (let a = 0; a < 2; a++) { if (hsh(seed * 3.1 + a * 7.7) < .3) continue;
        const a0 = Math.PI * (1.05 + hsh(seed + a * 11.3) * .9), da = (hsh(seed * 1.7 + a) < .5 ? 1 : -1) * (.5 + hsh(seed + a * 3.3) * .6), pts = [];
        for (let s2 = 0; s2 <= 4; s2++) { const aa = a0 + da * s2 / 4, rr = 1.12 + hsh(seed * 2.3 + a * 5 + s2) * .4; pts.push([w.x + Math.cos(aa) * RX * rr * 1.25 + (hsh(seed + s2 * 9.1 + a) - .5) * 8, w.y + cy0 + Math.sin(aa) * RY * rr + (hsh(seed * 4 + s2 + a) - .5) * 8]); }
        const trace = () => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); };
        x.globalAlpha = al * .85; x.strokeStyle = '#07020d'; x.lineWidth = 4; trace(); x.globalAlpha = al; x.strokeStyle = '#ffffff'; x.lineWidth = 1.7; trace();
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = al * .45; x.strokeStyle = l; x.lineWidth = 4.5; trace(); x.globalCompositeOperation = 'source-over'; } }
    x.restore();
    if (w && w.book) w._au = { i: inten, l, m, T };
  }
  /* low flames in front of the feet, so the fighter stands inside the aura rather than in front of it */
  function drawAuraFront(x, w, inten, l, m) {
    const t = T + (w.t || 0) * .37, k = Math.min(1.3, inten), al = Math.min(1, inten * 1.5) * .92; if (al <= .02) return;
    x.save(); x.lineJoin = 'round';
    for (let i = 0; i < 5; i++) { const bx = w.x + (i - 2) * 8.5 * SC + Math.sin(i * 3.1) * 2, by = w.y + 4, h = (7 + 6 * (.5 + .5 * Math.sin(t * 8 + i * 1.7))) * k * (i % 2 ? 1 : .75), wd = 4.6, tx2 = bx + Math.sin(t * 6 + i) * 2.4;
      x.beginPath(); x.moveTo(bx - wd, by); x.quadraticCurveTo(bx - wd * 1.1, by - h * .5, tx2, by - h); x.quadraticCurveTo(bx + wd * 1.1, by - h * .5, bx + wd, by); x.closePath();
      const g = x.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, m); g.addColorStop(1, l); x.globalAlpha = al; x.fillStyle = g; x.fill(); x.strokeStyle = '#07020d'; x.lineWidth = 1.8; x.stroke(); }
    x.restore();
  }
  /* Chosen One: smoky light-blue wisps with an ink edge, drifting up the caster's outline */
  function drawSmokeAura(x, w, inten) {
    // puffs are drawn as one merged mask, then laid down as an ink outline, a blue body and a pale core
    const S2 = 2, CW = 150, CH = 190, ox = CW / 2, oy = 128;
    const mk = () => { const c = document.createElement('canvas'); c.width = CW * S2; c.height = CH * S2; return c; };
    const st = w._smk || (w._smk = { m: mk(), t: mk() }), mx = st.m.getContext('2d'), tx = st.t.getContext('2d');
    mx.setTransform(S2, 0, 0, S2, 0, 0); mx.clearRect(0, 0, CW, CH);
    const N = 56, RX = 23 * SC, RY = 48 * HS, cy0 = -42 * HS, tt = T * .5;
    mx.globalAlpha = .9; mx.lineWidth = 4.5 + inten * 2; mx.beginPath(); mx.ellipse(ox, oy + cy0, RX, RY, 0, 0, 7); mx.stroke();   // the band the smoke rolls along
    for (let i = 0; i < N; i++) { const ph = (tt + i * .382) % 1, a = i / N * 6.283, ca = Math.cos(a), sa = Math.sin(a), top = Math.max(0, -sa);
      const lift = ph * (10 + 34 * top) * (.6 + inten * .6), px = ox + ca * (RX + ph * 4 * (1 - top)) + Math.sin(T * 1.7 + i * 2.1) * 2.2 * (1 + top), py = oy + cy0 + sa * RY - lift;
      const r = (2.6 + (2.8 + (i * 7 % 5) * .7) * Math.sin(ph * Math.PI)) * (.75 + inten * .4) * (1 - top * ph * .5);
      mx.globalAlpha = Math.min(1, (1 - ph * .85) * 1.2); mx.beginPath(); mx.arc(px, py, r, 0, 7); mx.fill(); }
    // a couple of loose wisps curling off the top
    for (let i = 0; i < 4; i++) { const ph = (tt * 1.3 + i * .25) % 1, px = ox + Math.sin(i * 2.6 + T * 1.3) * 10 + Math.sin(ph * 6 + i) * 4, py = oy + cy0 - RY - 6 - ph * 40 * inten; mx.globalAlpha = (1 - ph) * .9; mx.beginPath(); mx.arc(px, py, 3.4 * (1 - ph * .5), 0, 7); mx.fill(); }
    mx.globalAlpha = 1;
    const tint = col => { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, CW * S2, CH * S2); tx.drawImage(st.m, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, CW * S2, CH * S2); return st.t; };
    const X0 = w.x - ox, Y0 = w.y - oy; x.save();
    const ink = tint('#05182b'); x.globalAlpha = Math.min(1, .6 + inten * .4); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; x.drawImage(ink, X0 + Math.cos(a) * 2.6, Y0 + Math.sin(a) * 2.6, CW, CH); }
    x.globalAlpha = Math.min(1, .6 + inten * .35); x.drawImage(tint('#57c3f2'), X0, Y0, CW, CH);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = .18 + inten * .22; x.drawImage(tint('#cff3ff'), X0 + 1, Y0 - 2.5, CW, CH);
    x.restore();
  }
  window.heroAura = (x, cx, cy, sc, t) => { x.save(); x.translate(cx, cy); x.scale(sc / SC, sc / SC); const keepT = T; try { T = t; const ac = auraOf({ me: 1 }); drawInkAura(x, { x: 0, y: 0, t: 0 }, .7, ac[0], ac[1]); } finally { T = keepT; } x.restore(); };
  let tarrows = [];
  const BTRAIL = { rat: ['#6a5a8a', '#3a2a6a'], ox: ['#8a7a5a', '#5a3d22', '#8a6cff'], tiger: ['#ffb347', '#8a6cff'], rabbit: ['#e8dcff', '#c9b8ff'], dragon: ['#ff7a2a', '#ffd45e', '#8a6cff'], snake: ['#7ef08a', '#2f8a3c'], horse: ['#c9b8ff', '#ffffff'], goat: ['#b9a6ee', '#6a5a8a'], monkey: ['#c48cff', '#ffd45e'], rooster: ['#ff5a6e', '#ffd45e'], dog: ['#9fd8ff', '#8a6cff'], pig: ['#ff9ad0', '#8a6cff'], jugg: ['#1a0a30', '#5a1a2a', '#8a6cff'], x: ['#8a6cff', '#3a2a6a'] };
  let flames = [];
  window.addFlame = (x0, y0) => { if (flames.length < 60) flames.push({ x: x0, y: y0, t: 0, life: rnd(1.4, 2.6), s: rnd(1.1, 1.7), seed: rnd(0, 9) }); };
  function drawFlames(x, dt) {
    for (const f of flames) { const k = f.t / f.life, a = k < .1 ? k / .1 : k > .7 ? (1 - k) / .3 : 1; x.save(); x.translate(f.x, f.y); x.globalAlpha = a * .5; x.fillStyle = '#1a0c04'; x.beginPath(); x.ellipse(0, 0, 9 * f.s, 3.5 * f.s, 0, 0, 7); x.fill();
      x.globalAlpha = a; for (let i = 0; i < 4; i++) { const h = (8 + Math.sin(T * 16 + f.seed + i * 2) * 3) * f.s * (1 - k * .5), ox = (i - 1.5) * 3.6 * f.s; x.fillStyle = i % 2 ? '#ffd45e' : '#ff7a2a'; x.beginPath(); x.moveTo(ox - 2.6 * f.s, 0); x.quadraticCurveTo(ox - 2 * f.s, -h * .6, ox + Math.sin(T * 9 + i) * 1.5, -h); x.quadraticCurveTo(ox + 2 * f.s, -h * .6, ox + 2.6 * f.s, 0); x.closePath(); x.fill(); }
      x.restore(); }
  }

  function drawShell(x, w) {
    const sh = w.shell, f = sh.form, q = sh.hp / sh.max, H = 100, Wd = 44, t = sh.t, ac = auraOf(w), rgb = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; }, cL = rgb(ac[0]), cM = rgb(ac[1]), fort = U(w, 'titan', 'fortified');
    // liquid smoke outline: two slow, wobbling ink bands that hug the shell
    x.save(); x.translate(w.x, w.y); x.scale(SC, SC); x.lineJoin = 'round';
    for (let L2 = fort ? 2 : 1; L2 >= 0; L2--) { const off = 6 + L2 * 7, pts = []; for (let i = 0; i <= 40; i++) { const an = Math.PI + i / 40 * Math.PI, wob = Math.sin(an * 5 + t * 2.2 + L2 * 2) * 3.2 + Math.sin(an * 9 - t * 3.1 + L2) * 1.8; pts.push([Math.cos(an) * (Wd + off + wob), Math.sin(an) * (H * .6 + off + wob) - H * .42]); }
      x.beginPath(); x.moveTo(-(Wd + off), 2); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(Wd + off, 2);
      x.globalAlpha = f * (.5 - L2 * .12); x.strokeStyle = '#05020c'; x.lineWidth = 7 - L2; x.stroke(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = f * (.75 - L2 * .2); x.strokeStyle = `rgb(${L2 ? cM : cL})`; x.lineWidth = 2.6 - L2 * .5; x.stroke(); x.globalCompositeOperation = 'source-over'; }
    if (Math.random() < .35) P({ x: w.x + rnd(-Wd, Wd) * SC, y: w.y - rnd(40, H) * SC, vx: rnd(-8, 8), vy: -rnd(14, 34), color: Math.random() < .5 ? ac[1] : '#12060c', size: rnd(3, 6), life: rnd(.5, .9), glow: false, grow: 1.6, fade: .5 });
    if (fort) { x.globalAlpha = f * .9; x.strokeStyle = `rgb(${cL})`; x.fillStyle = `rgba(${cM},.45)`; x.lineWidth = 2; for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(sd * 30, -74); x.lineTo(sd * 52, -88); x.lineTo(sd * 46, -66); x.lineTo(sd * 56, -58); x.lineTo(sd * 36, -56); x.closePath(); x.fill(); x.stroke(); } x.beginPath(); x.moveTo(-10, -104); x.lineTo(0, -120); x.lineTo(10, -104); x.closePath(); x.fill(); x.stroke(); }
    x.restore();
    x.save(); x.translate(w.x, w.y); x.scale(SC, SC); x.globalAlpha = (.38 + .3 * q) * f * (sh.hit > 0 ? 1.4 : 1);
    const flick = i => Math.sin(t * 7 + i * 1.7) * 2;
    // flame aura outline
    x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(0, -H, 0, 0); g.addColorStop(0, `rgba(${cL},.55)`); g.addColorStop(1, `rgba(${cM},.2)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(-Wd, 0);
    for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, rx = Math.cos(a) * (Wd + flick(i)), ry = Math.sin(a) * (H * .55 + flick(i + 3)) - H * .42; x.lineTo(rx, ry); }
    x.lineTo(Wd, 0); x.closePath(); x.fill();
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = sh.hit > 0 ? '#fff' : 'rgba(225,235,255,.95)'; x.lineWidth = 2.5; x.lineJoin = 'round';
    // ribcage armour
    x.fillStyle = `rgba(${cM},.38)`;
    x.beginPath(); x.moveTo(-28, -30); x.quadraticCurveTo(-34, -62, -16, -76); x.lineTo(16, -76); x.quadraticCurveTo(34, -62, 28, -30); x.quadraticCurveTo(0, -18, -28, -30); x.closePath(); x.fill(); x.stroke();
    x.lineWidth = 1.8; for (let i = 0; i < 4; i++) { const y = -68 + i * 10; x.beginPath(); x.moveTo(-3, y); x.quadraticCurveTo(-24 + i * 1.5, y + 2, -26 + i, y + 9); x.moveTo(3, y); x.quadraticCurveTo(24 - i * 1.5, y + 2, 26 - i, y + 9); x.stroke(); }
    x.beginPath(); x.moveTo(0, -76); x.lineTo(0, -30); x.stroke();
    // shoulders + arms
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 30, -72, 13, 9, s * .3, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(s * 36, -66); x.quadraticCurveTo(s * 46, -40, s * 40, -16); x.lineTo(s * 32, -18); x.quadraticCurveTo(s * 36, -42, s * 28, -62); x.fill(); x.stroke(); }
    // horned helm
    x.fillStyle = 'rgba(120,150,255,.45)'; x.beginPath(); x.moveTo(-14, -78); x.quadraticCurveTo(-16, -100, 0, -104); x.quadraticCurveTo(16, -100, 14, -78); x.closePath(); x.fill(); x.stroke();
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 12, -96); x.quadraticCurveTo(s * 30, -104, s * 26, -122); x.quadraticCurveTo(s * 20, -106, s * 8, -102); x.fill(); x.stroke(); }
    x.globalCompositeOperation = 'lighter'; x.fillStyle = '#e6f0ff'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 6, -90, 3.2, 1.6, s * -.3, 0, 7); x.fill(); }
    // cracks as it weakens
    if (q < .55) { x.globalCompositeOperation = 'source-over'; x.strokeStyle = 'rgba(20,30,80,.8)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-18, -70); x.lineTo(-8, -58); x.lineTo(-14, -48); x.moveTo(16, -64); x.lineTo(6, -52); x.lineTo(12, -40); if (q < .3) { x.moveTo(-6, -98); x.lineTo(2, -88); x.lineTo(-2, -80); } x.stroke(); }
    x.restore();
    // durability bar
    x.save(); x.fillStyle = '#000'; x.fillRect(w.x - 20, w.y - 128 * SC, 40, 5); x.fillStyle = '#9fb8ff'; x.fillRect(w.x - 19, w.y - 128 * SC + 1, 38 * q, 3); x.restore();
    if (sh.mend > 0) { x.save(); x.globalAlpha = sh.mend / .6; x.strokeStyle = '#e6f0ff'; x.lineWidth = 3; x.beginPath(); x.ellipse(w.x, w.y - 50 * SC, 40 * SC * (1.4 - sh.mend), 60 * SC * (1.4 - sh.mend), 0, 0, 7); x.stroke(); x.restore(); }
  }

  /* ---------------- Copy Cast eye flash ---------------- */
  function eyeFlash(w, k) {
    EYE = { t0: performance.now(), me: !!w.me, look: w, k };
    slow = .3; setTimeout(() => { if (!ended) slow = 1; }, 520); shake = Math.max(shake, 4);
    if (typeof sfx === 'function') sfx('shatter', { vol: .2, rate: 1.6 });
  }
  function drawEye(x) {
    const e = (performance.now() - EYE.t0) / 1000, D = .95; if (e > D) { EYE = null; return; }
    const W = cv.width / dpr, H = cv.height / dpr, cy = H * .38, open = e < .12 ? e / .12 : e > D - .2 ? (D - e) / .2 : 1, bh = 92 * open;
    x.save();
    // dim the world
    x.fillStyle = `rgba(0,0,0,${.35 * open})`; x.fillRect(0, 0, W, H);
    // letterbox band
    x.fillStyle = '#0a0306'; x.fillRect(0, cy - bh / 2, W, bh);
    x.fillStyle = '#ff2a3a'; x.fillRect(0, cy - bh / 2, W, 2); x.fillRect(0, cy + bh / 2 - 2, W, 2);
    // speed streaks
    x.globalAlpha = .25 * open; x.fillStyle = '#ff6b7a'; for (let i = 0; i < 8; i++) { const yy = cy - bh / 2 + ((i * 37 + e * 600) % bh); x.fillRect((i * 97 + e * 900) % W - 60, yy, 60, 1.2); } x.globalAlpha = 1;
    // skin strip + eyes
    const skin = (EYE.look.skin) || '#f2c9a0', ew = 58, ehh = 18 * open, zoom = 1 + e * .08;
    x.save(); x.beginPath(); x.rect(0, cy - bh / 2 + 3, W, bh - 6); x.clip();
    x.fillStyle = skin; x.fillRect(0, cy - 34 * open, W, 68 * open);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, cy - 34 * open, W, 10 * open);
    for (const s of [-1, 1]) {
      const ex = W / 2 + s * 78 * zoom; x.save(); x.translate(ex, cy); x.scale(zoom, zoom);
      // brow
      x.fillStyle = '#1a0a08'; x.beginPath(); x.moveTo(-ew * .6, -ehh - 12); x.quadraticCurveTo(0, -ehh - 22 - s * 2, ew * .62, -ehh - 8); x.lineTo(ew * .6, -ehh - 3); x.quadraticCurveTo(0, -ehh - 14, -ew * .58, -ehh - 6); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-ew / 2, 0); x.quadraticCurveTo(0, -ehh * 1.6, ew / 2, 0); x.quadraticCurveTo(0, ehh * 1.2, -ew / 2, 0); x.closePath();
      x.fillStyle = '#fff6f0'; x.fill(); x.save(); x.clip();
      const ir = 15; const g = x.createRadialGradient(0, 0, 2, 0, 0, ir); g.addColorStop(0, '#ff6070'); g.addColorStop(.6, '#d0102a'); g.addColorStop(1, '#5a0010'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, ir, 0, 7); x.fill();
      x.strokeStyle = '#1a0004'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, ir * .62, 0, 7); x.stroke();
      x.save(); x.rotate(e * 9); x.strokeStyle = '#1a0004'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(0, 0, ir * .62, i * 1.571, i * 1.571 + .5); x.stroke(); } x.restore();
      x.fillStyle = '#000'; x.beginPath(); x.ellipse(0, 0, 2.4, 7, 0, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(-5, -5, 2.6, 0, 7); x.fill();
      x.restore();
      x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.moveTo(-ew / 2, 0); x.quadraticCurveTo(0, -ehh * 1.6, ew / 2, 0); x.stroke();
      // glow
      x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(0, 0, 0, 0, 0, 40); gg.addColorStop(0, `rgba(255,40,60,${.45 * open})`); gg.addColorStop(1, 'rgba(255,0,40,0)'); x.fillStyle = gg; x.beginPath(); x.arc(0, 0, 40, 0, 7); x.fill();
      x.restore();
    }
    x.restore();
    // caption
    x.font = '900 15px system-ui, sans-serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 4;
    const cap = 'COPY CAST · ' + SP[EYE.k].n.toUpperCase(); x.globalAlpha = open; x.strokeText(cap, W / 2, cy + bh / 2 + 22); x.fillText(cap, W / 2, cy + bh / 2 + 22);
    x.restore();
  }

  /* ---------------- sorcerer look: gi and martial-arts gear ---------------- */
  const _drawWiz = drawWiz;
  window.drawWiz = drawWiz = function (w, X, ava) {
    const sorc = ((w.look && w.look.cls) || w.cls) === 'sorc';
    if (ART_STYLE === 'hd' && typeof drawWizHD === 'function') return sorc ? drawSorcHD(w, X, ava) : drawWizHD(w, X, ava);   // the new character-sheet art
    return sorc ? drawSorc(w, X, ava) : _drawWiz(w, X, ava);
  };
  const _drawPet = drawPet;
  window.drawPet = drawPet = function (x, id, t, face) { return ART_STYLE === 'hd' && typeof drawPetHD === 'function' ? drawPetHD(x, id, t, face) : _drawPet(x, id, t, face); };
  function drawSorc(w, X, ava) {
    const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
    const mv = Math.hypot(w.vx || 0, w.vy || 0), walk = ava ? 0 : Math.min(1, mv / 25), bob = ava ? 0 : Math.abs(Math.sin(w.t * 9)) * 3 * walk + (w.jump || 0);
    if (!ava) { x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0, 0, 18, 6, 0, 0, 7); x.fill(); }
    if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(w.t * 20) * .06;
    if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(w.t * 12) * .1;
    if (w.dead) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4); }
    if (w.slump) { x.rotate(.12 * w.face); x.translate(0, 3); }
    x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018); x.translate(0, -bob);
    const k = w.book && w.book.length ? w.book[w.i] : 'dissect', [l, m] = COL[SP[k].el], fl = w.flash > 0, casting = w.recoil > 0, step = ava ? 0 : Math.sin(w.t * 9) * walk;
    const robe = w.robe || ['#3a3f5a', '#22263a', '#14172a'], trim = w.trim || '#e8e0d0', skin = w.skin || '#f2c9a0', hair = w.beardStyle === 'none' || !w.beardC ? '#1a1410' : w.beardC;
    const ink = '#000'; x.strokeStyle = ink; x.lineJoin = 'round'; x.lineCap = 'round';
    // legs: wide trousers + wraps
    for (const s of [-1, 1]) { const st = step * 2.6 * s; x.fillStyle = fl ? '#fff' : robe[2] || robe[1]; x.lineWidth = 2.5; x.beginPath(); x.moveTo(s * 2, -20); x.quadraticCurveTo(s * 12 + st, -12, s * 9 + st, -3); x.lineTo(s * 3 + st, -3); x.quadraticCurveTo(s * 2, -12, 0, -20); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = fl ? '#fff' : '#efe6d4'; x.beginPath(); x.rect(s * 3 + st - (s > 0 ? 0 : 6), -5, 6, 3); x.fill(); x.stroke();
      x.fillStyle = fl ? '#fff' : '#1a1410'; x.beginPath(); x.ellipse(s * 6 + st, -.8, 5, 2.4, 0, 0, 7); x.fill(); x.stroke(); }
    // gi top: wrap-front jacket
    const g = x.createLinearGradient(0, -44, 0, -16); g.addColorStop(0, robe[0]); g.addColorStop(1, robe[1]);
    x.fillStyle = fl ? '#fff' : g; x.lineWidth = 3;
    x.beginPath(); x.moveTo(-9, -41); x.quadraticCurveTo(-15, -36, -14, -18); x.quadraticCurveTo(-4, -14, 0, -15); x.quadraticCurveTo(4, -14, 14, -18); x.quadraticCurveTo(15, -36, 9, -41); x.quadraticCurveTo(0, -44, -9, -41); x.closePath(); x.fill(); x.stroke();
    // undershirt V + lapel
    if (!fl) { x.fillStyle = '#14121c'; x.beginPath(); x.moveTo(-5, -41); x.lineTo(1, -30); x.lineTo(6, -41); x.closePath(); x.fill(); x.strokeStyle = trim; x.lineWidth = 2.6; x.beginPath(); x.moveTo(-6, -41.5); x.lineTo(2, -28); x.lineTo(7, -20); x.stroke(); x.beginPath(); x.moveTo(7, -41.5); x.lineTo(2, -30); x.stroke(); x.strokeStyle = ink; }
    // belt with knot
    x.fillStyle = fl ? '#fff' : '#111'; x.lineWidth = 2; x.beginPath(); x.rect(-13.5, -22, 27, 4.5); x.fill(); x.stroke();
    if (!fl) { x.fillStyle = trim; x.beginPath(); x.ellipse(-5, -19.8, 2.6, 2.4, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(-6, -18); x.lineTo(-9 + Math.sin(w.t * 4), -10); x.lineTo(-5.5, -10.5); x.closePath(); x.fill(); x.stroke(); }
    if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'robe');
    // back fist (guard)
    x.save(); x.translate(8, -36); x.rotate(-.9 + Math.sin(w.t * 3) * .08); x.fillStyle = fl ? '#fff' : robe[1]; x.lineWidth = 2.5; x.beginPath(); x.ellipse(0, 6, 4.2, 7.5, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = skin; x.beginPath(); x.arc(0, 14, 3.6, 0, 7); x.fill(); x.stroke(); x.restore();
    // head
    x.fillStyle = skin; x.lineWidth = 2.5; x.beginPath(); x.arc(1, -48, 8, 0, 7); x.fill(); x.stroke();
    // spiky hair
    x.fillStyle = fl ? '#fff' : hair; x.beginPath(); x.moveTo(-7.5, -48);
    const sp = [[-10, -55], [-6, -54], [-8, -62], [-2, -57], [0, -65], [3, -57], [8, -62], [7, -54], [11, -55], [9.5, -48]];
    for (const [a, b] of sp) x.lineTo(a, b + Math.sin(w.t * 3 + a) * .4); x.quadraticCurveTo(4, -53, -7.5, -48); x.closePath(); x.fill(); x.stroke();
    // headband with tails
    if (!fl) { x.fillStyle = trim; x.lineWidth = 2; x.beginPath(); x.moveTo(-7.8, -51); x.quadraticCurveTo(1, -54, 9.6, -51); x.lineTo(9.4, -48); x.quadraticCurveTo(1, -51, -7.6, -48); x.closePath(); x.fill(); x.stroke();
      const tw = Math.sin(w.t * 6) * 2; x.beginPath(); x.moveTo(-7, -50); x.quadraticCurveTo(-14, -50 + tw, -18, -46 + tw); x.lineTo(-16, -44 + tw); x.quadraticCurveTo(-12, -47, -7, -48.5); x.closePath(); x.fill(); x.stroke(); }
    // face: determined brows + eyes
    x.fillStyle = '#000'; x.beginPath(); x.arc(4, -46.5, 1.5, 0, 7); x.arc(-1, -46.5, 1.5, 0, 7); x.fill();
    x.lineWidth = 1.6; x.beginPath(); x.moveTo(2.5, -50); x.lineTo(6, -49); x.moveTo(-2.6, -49); x.lineTo(.4, -50); x.stroke();
    if (w.copyArmed > 0 && !fl) { x.fillStyle = '#ff2a3a'; x.beginPath(); x.arc(4, -46.5, 1.2, 0, 7); x.arc(-1, -46.5, 1.2, 0, 7); x.fill(); }
    x.lineWidth = 1.4; x.beginPath(); if (casting) { x.arc(2.5, -42.5, 1.6, 0, 7); } else { x.moveTo(0.5, -42.6); x.lineTo(4, -43); } x.stroke();
    if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'head');
    // front arm: punches forward when casting, energy in the fist
    x.save(); x.translate(-4, -36); x.rotate(casting ? -1.5 : .55 + Math.sin(w.t * 3) * .1 - Math.min(.5, (w.p || 0) / (SP[k].t || 1) * .5));
    x.fillStyle = fl ? '#fff' : robe[1]; x.lineWidth = 2.5; x.beginPath(); x.ellipse(0, 7, 4.6, 8.5, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = fl ? '#fff' : '#efe6d4'; x.beginPath(); x.rect(-3.6, 12, 7.2, 3); x.fill(); x.stroke();
    x.fillStyle = skin; x.beginPath(); x.arc(0, 17.5, 4, 0, 7); x.fill(); x.stroke();
    if (!fl) { const pr = casting ? 1 : Math.min(1, (w.p || 0) / (SP[k].t || 1)); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(0, 18, 0, 0, 18, 6 + pr * 8); gg.addColorStop(0, '#ffffffcc'); gg.addColorStop(.4, l + 'aa'); gg.addColorStop(1, m + '00'); x.fillStyle = gg; x.beginPath(); x.arc(0, 18, 6 + pr * 8, 0, 7); x.fill(); }
    x.restore();
    if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'top');
    x.restore();
  }

  /* ---------------- Final Attempt (Spirit Tuning) ---------------- */
  const _kill = kill;
  /* Death saves, in priority order. One save per killing blow, never while another save is still running,
     each once per round: 1) Final Attempt (Spirit Tuning), 2) Not Yet (Chosen One) as the last stand. */
  window.kill = kill = function (w) {
    if (w && !w.dead && !ended && w.fate) { w.hp = Math.max(1, w.hp); return; }                       // Not Yet is running: cannot fall until the amped hit lands
    if (w && !w.dead && !ended && !w.finalUsed && U(w, 'secondwind', 'final')) {
      w.finalUsed = 1; w.finalBoost = 1; w.hp = Math.round(w.maxHp * .2); w._hpSeen = w.hp; w.bleeds = null; w.burn = 0;
      text(w.x, w.y - 108 * HS, 'FINAL ATTEMPT', '#b8ffcf', true); addFx({ k: 'aura', w, life: 1.2, l: '#eafff2', m: '#2fd08a', big: 1 }); shake = Math.max(shake, 12);
      slow = Math.min(slow, .3); setTimeout(() => { if (!ended) slow = 1; }, 300); inkRing(w.x, w.y, '#b8ffcf', 3, 10, 70, .6); return;
    }
    if (w && !w.dead && !ended && !w.fateUsed && U(w, 'chosen', 'fate')) {
      w.fateUsed = 1; w.fate = 1; w.hp = 1; w._hpSeen = 1; w.bleeds = null; w.burn = 0;
      text(w.x, w.y - 108 * HS, 'NOT YET!', '#bff0ff', true); addFx({ k: 'radiance', w, life: 1.4, big: 1 }); shake = Math.max(shake, 12); slow = Math.min(slow, .3); setTimeout(() => { if (!ended) slow = 1; }, 320); return;
    }
    return _kill.apply(this, arguments);
  };

  /* ---------------- bleeding (Stinging Wounds) ---------------- */
  function addBleed(f) { f.bleeds = f.bleeds || []; if (f.bleeds.length >= 3) { f.bleeds.sort((a, b) => a - b); f.bleeds[0] = 3; } else f.bleeds.push(3); text(f.x + 14, f.y - 92 * HS, 'BLEED ×' + f.bleeds.length, '#ff5a6e'); }

  /* ---------------- Earth Manipulation ----------------
     A mud field around the caster slows enemy units inside. Upgrades build inside it: stone pillars and a mud wall
     (both are walls, so they block shots like ice) and Quagmire (deeper mud that also hurts). */
  let muds = [];
  const inMud = (m, x, y) => Math.hypot(x - m.x, (y - m.y) / SQ) < m.r;
  function mudPiece(o, cx, cy, ang, n, gap, hp, life, kind, h) {
    const px = -Math.sin(ang), py = Math.cos(ang), cr = [];
    for (let j = 0; j < n; j++) { const off = (j - (n - 1) / 2) * gap, q = inArena(cx + px * off, cy + py * off); cr.push({ x: q.x, y: q.y, h: h + rnd(-4, 4), wd: 1, grow: -rnd(0, .25) - Math.abs(j - (n - 1) / 2) * .04, seed: rnd(0, 9) }); }
    const wl = { o, cr, n, hp, max: hp, life, mud: kind, stg: 99 }; walls.push(wl); return wl;
  }
  function castEarth(w) {
    const k = 'earthm', o = w.foe, m2 = muds.some(q => q.o === w && q.t < q.dur), r = S(w, k, 'radius') * (m2 ? 1.15 : 1), dur = S(w, k, 'dur') + (m2 ? 1 : 0), ang = Math.atan2(o.y - w.y, o.x - w.x);
    const m = { o: w, x: w.x, y: w.y, r, t: 0, dur, quag: U(w, k, 'quag'), seed: rnd(0, 99), tick: 0 }; muds.push(m);
    text(w.x, w.y - 100 * HS, 'EARTH MANIPULATION', '#f0d6a6', true); shake = Math.max(shake, 7); inkRing(w.x, w.y, '#a8703a', 2, 20, r, SQ);
    for (let i = 0; i < 30; i++) { const a = rnd(0, 6.283), d = rnd(10, r); P({ x: w.x + Math.cos(a) * d, y: w.y + Math.sin(a) * d * SQ, vx: rnd(-30, 30), vy: -rnd(60, 160), color: ['#6b4420', '#8a5a2b', '#3a220c'][i % 3], size: rnd(3, 6), life: rnd(.4, .8), grav: 420, glow: false }); }
    if (U(w, k, 'pillars')) for (let i = 0, tries = 0; i < 10 && tries < 80; tries++) {
      const a = rnd(0, 6.283), d = Math.sqrt(Math.random()) * r * .92, x0 = w.x + Math.cos(a) * d, y0 = w.y + Math.sin(a) * d * SQ;
      if (Math.hypot(x0 - w.x, y0 - w.y) < 26 || walls.some(wl => wl.mud === 'pillar' && Math.hypot(wl.cr[1].x - x0, wl.cr[1].y - y0) < 22)) continue;
      mudPiece(w, x0, y0, ang, 3, 6, 14, dur, 'pillar', 40); i++;
    }
    if (U(w, k, 'mudwall')) { const q = inArena(w.x + Math.cos(ang) * r * .85, w.y + Math.sin(ang) * r * .85 * SQ), hp = S(w, k, 'wall');
      if (U(w, k, 'fortify')) { mudPiece(w, q.x, q.y, ang, 9, 17, Math.round(hp * 1.6), dur + 1, 'wall', 38); text(q.x, q.y - 60 * HS, 'FORTIFIED WALL', '#f0d6a6'); }
      else { const px = -Math.sin(ang), py = Math.cos(ang); for (const sec of [-1, 0, 1]) mudPiece(w, q.x + px * sec * 54, q.y + py * sec * 54, ang, 3, 16, Math.round(hp / 3), dur + 1, 'wall', 34); text(q.x, q.y - 60 * HS, 'MUD WALL', '#f0d6a6'); } }
  }
  function mudPre(dt) {
    // mud pieces crumble into dirt instead of shattering like ice
    for (const wl of walls) if (wl.mud && (wl.hp <= 0 || wl.life <= dt)) { wl.dead = 1;
      for (const c of wl.cr) { if (c.gone) continue; for (let i = 0; i < (wl.mud === 'pillar' ? 5 : 4); i++) P({ x: c.x + rnd(-8, 8), y: c.y - rnd(4, c.h) * HS, vx: rnd(-90, 90), vy: rnd(-160, -40), color: ['#8a6a48', '#5a3d22', '#b89a74'][i % 3], size: rnd(3, 6), life: rnd(.4, .7), grav: 520, glow: false }); }
      if (wl.hp <= 0) { shake = Math.max(shake, 4); try { sfx('rock', { x: wl.cr[1].x, vol: .3 }); } catch (e) {} } }
    if (walls.some(wl => wl.dead)) walls = walls.filter(wl => !wl.dead);
    const out = [];
    for (const m of muds) { if (m.t >= m.dur) continue; const f = m.quag ? .35 : .55;
      const list = [{ e: m.o.foe, k: 'wiz' }].concat(enemyCreatures(m.o).map(c => ({ e: c.e, k: c.k })));
      for (const u of list) if (u.e && !u.e.dead && u.e.x !== undefined && inMud(m, u.e.x, u.e.y) && !(u.k === 'wiz' && u.e.rush && u.e.rush.ph !== 'back' && U(u.e, 'rush', 'pain'))) { const ex = out.find(q => q.e === u.e); if (ex) ex.f = Math.min(ex.f, f); else out.push({ e: u.e, x: u.e.x, y: u.e.y, f, p: u.k === 'wiz' ? u.e.p : null }); }
      m.t += dt; m.tick += dt;
      if (m.quag && m.tick >= .5) { m.tick = 0; const f2 = m.o.foe; SRC = 'earthm';
        if (!f2.dead && inMud(m, f2.x, f2.y) && !ghosted(f2)) damage(f2, 1, 0, 0, '#c9a56a');
        for (const c of enemyCreatures(m.o)) if (c.e.x !== undefined && inMud(m, c.e.x, c.e.y)) hurtCreature(c.e, c.k, 1, 'crush'); }
    }
    muds = muds.filter(m => m.t < m.dur);
    for (const dm of domes) { if (dm.t >= dm.dur) continue;   // every unit inside a Sanctum moves 30% slower
      const all = ents.concat(zombies.filter(z => z.hp > 0), golems.filter(g => g.hp > 0), archers.filter(a => a.hp > 0), decoys.filter(d => !d.gone));
      for (const e of all) if (!e.dead && e.x !== undefined && Math.hypot(e.x - dm.x, (e.y - dm.y) * 1.4) < dm.r) { const ex = out.find(q => q.e === e); if (ex) ex.f = Math.min(ex.f, .7); else out.push({ e, x: e.x, y: e.y, f: .7, p: null, nm: 1 }); }
      castSlow(dm.o.foe, Math.hypot(dm.o.foe.x - dm.x, (dm.o.foe.y - dm.y) * 1.4) < dm.r); }
    // enemy casters inside a Sanctum or an Hourglass charge 25% slower (one 25%, not stacked with mud)
    function castSlow(e, inside) { if (!e || e.dead || !inside) return; const ex = out.find(q => q.e === e); if (ex) { if (ex.p == null) ex.p = e.p; } else out.push({ e, x: e.x, y: e.y, f: 1, p: e.p, nm: 1 }); }
    if (typeof hgs !== 'undefined') for (const h of hgs) if (h.t < h.dur && h.o && h.o.foe) { const f = h.o.foe; castSlow(f, Math.hypot(f.x - h.o.x, (f.y - h.o.y) * 1.6) < h.r); }
    return out;
  }
  function mudPost(list) { for (const q of list) { if (q.e.dead) continue; q.e.x = q.x + (q.e.x - q.x) * q.f; q.e.y = q.y + (q.e.y - q.y) * q.f; if (q.p != null && q.e.p > q.p) q.e.p = q.p + (q.e.p - q.p) * .75; /* bogged down: casting 25% slower */ if (!q.nm && Math.random() < .12) P({ x: q.e.x + rnd(-8, 8), y: q.e.y + rnd(-2, 3), vx: rnd(-20, 20), vy: -rnd(20, 50), color: '#5a3d22', size: rnd(2, 4), life: .4, grav: 300, glow: false }); } }
  function drawMud(x) {
    for (const m of muds) { const k = m.t / m.dur, a = Math.min(1, m.t * 5) * (k > .85 ? (1 - k) / .15 : 1), R = m.r * Math.min(1, .25 + m.t * 4);
      x.save(); x.translate(m.x, m.y); x.scale(1, SQ); x.globalAlpha = a * .92;
      const edge = i => R * (1 + .07 * Math.sin(i * 5 + m.seed) + .05 * Math.sin(i * 11 + m.seed * 2) + .03 * Math.sin(i * 23 + m.seed));
      const blob = (sc) => { x.beginPath(); for (let i = 0; i <= 48; i++) { const t = i / 48 * 6.283, rr = edge(t) * sc; x.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } x.closePath(); };
      blob(1.04); x.fillStyle = 'rgba(30,16,4,.45)'; x.fill();
      const g = x.createRadialGradient(-R * .2, -R * .25, R * .05, 0, 0, R); g.addColorStop(0, m.quag ? '#5a3a1c' : '#8a5f34'); g.addColorStop(.7, m.quag ? '#3f2710' : '#6b4521'); g.addColorStop(1, m.quag ? '#2a1808' : '#4d3015');
      blob(1); x.fillStyle = g; x.fill(); x.strokeStyle = '#2a1606'; x.lineWidth = 2.5; x.stroke();
      // wet sheen and slow ripples
      x.globalAlpha = a * .35; x.strokeStyle = '#d8b88a'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { const rr = ((m.t * .35 + i / 3) % 1) * R * .9; x.beginPath(); x.ellipse(R * .15, R * .1, rr, rr * .8, 0, 0, 7); x.stroke(); }
      x.globalAlpha = a * .5; x.fillStyle = '#e8cfa0'; x.beginPath(); x.ellipse(-R * .35, -R * .35, R * .22, R * .07, -.4, 0, 7); x.fill();
      // bubbles
      for (let i = 0; i < (m.quag ? 9 : 5); i++) { const bt = (m.t * (.8 + i * .13) + i * .37) % 1, ba = i * 2.4 + m.seed, bd = R * (.2 + (i * .17) % .65), bx = Math.cos(ba) * bd, by = Math.sin(ba) * bd, br = 2 + bt * (m.quag ? 6 : 4);
        x.globalAlpha = a * (1 - bt) * .9; x.strokeStyle = '#d8b88a'; x.lineWidth = 1.4; x.beginPath(); x.arc(bx, by, br, 0, 7); x.stroke(); }
      x.restore(); }
  }
  function drawMudPiece(c, wl) {
    const x = ctx, g0 = Math.max(0, Math.min(1, c.grow)); if (g0 <= 0 || c.gone) return; const hurt = 1 - wl.hp / wl.max, fl = wl.flash > 0;
    x.save(); x.translate(c.x, c.y); x.scale(SC, SC);
    if (wl.mud === 'pillar') { if (c !== wl.cr[1]) { x.restore(); return; } const h = c.h * g0 * (1 - hurt * .25), W = 9;
      x.fillStyle = 'rgba(30,16,4,.4)'; x.beginPath(); x.ellipse(0, 1, 13, 5, 0, 0, 7); x.fill();
      const g = x.createLinearGradient(-W, 0, W, 0); g.addColorStop(0, fl ? '#fff' : '#d8c09a'); g.addColorStop(.45, fl ? '#fff' : '#a88a64'); g.addColorStop(1, fl ? '#eee' : '#6b5136');
      x.fillStyle = g; x.strokeStyle = '#1a1008'; x.lineWidth = 1.8; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(-W, 0); x.lineTo(-W * .85, -h * .55); x.lineTo(-W * .7, -h); x.lineTo(-W * .1, -h - 4); x.lineTo(W * .75, -h + 1); x.lineTo(W * .9, -h * .5); x.lineTo(W, 0); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(40,24,10,.55)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-W * .2, -h * .2); x.lineTo(W * .1, -h * .5); x.moveTo(W * .3, -h * .65); x.lineTo(-W * .1, -h * .85); if (hurt > .45) { x.moveTo(-W * .7, -h * .4); x.lineTo(W * .2, -h * .3); x.lineTo(W * .5, -h * .1); } x.stroke();
      x.fillStyle = '#5a3d22'; x.beginPath(); x.ellipse(0, -1, W + 2, 3.5, 0, 0, 3.14); x.fill();
    } else { // the mud wall is drawn once, as one continuous ridge through every standing piece
      x.restore(); if (c !== wl.cr[(wl.n / 2) | 0] && !(wl.cr[(wl.n / 2) | 0].gone && c === wl.cr.find(q => !q.gone))) return;
      const runs = []; let cur = []; for (const q of wl.cr) { if (q.gone || q.grow <= 0) { if (cur.length) runs.push(cur); cur = []; } else cur.push(q); } if (cur.length) runs.push(cur);
      x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
      for (const run of runs) { const A = run[0], B = run[run.length - 1], dx = (B.x - A.x) || 1, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, e = 10;
        const top = run.map(q => { const gg = Math.min(1, q.grow), h = q.h * gg * (1 - hurt * .35) * SC; return [q.x, q.y - h]; });
        const p0 = [A.x - ux * e, A.y - uy * e], p1 = [B.x + ux * e, B.y + uy * e];
        x.fillStyle = 'rgba(30,16,4,.4)'; x.beginPath(); x.moveTo(p0[0], p0[1] + 2); x.lineTo(p1[0], p1[1] + 2); x.lineWidth = 12; x.strokeStyle = 'rgba(30,16,4,.35)'; x.stroke();
        const yTop = Math.min(...top.map(t => t[1])), g = x.createLinearGradient(0, yTop, 0, Math.max(A.y, B.y)); g.addColorStop(0, fl ? '#fff' : '#b07a42'); g.addColorStop(.45, fl ? '#fff' : '#7a4d24'); g.addColorStop(1, fl ? '#ddd' : '#40250e');
        x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p0[0], top[0][1] + 8);
        for (let i = 0; i < top.length; i++) { const t = top[i], nx = top[i + 1]; if (nx) x.quadraticCurveTo(t[0], t[1] - 3, (t[0] + nx[0]) / 2, (t[1] + nx[1]) / 2); else x.quadraticCurveTo(t[0], t[1] - 3, p1[0], t[1] + 8); }
        x.lineTo(p1[0], p1[1]); x.closePath(); x.fillStyle = g; x.fill(); x.strokeStyle = '#1e1006'; x.lineWidth = 2; x.stroke();
        // wet drips and a lighter crest
        x.strokeStyle = 'rgba(216,184,138,.5)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < top.length; i++) { const t = top[i], s2 = run[i].seed; if (i % 2) continue; x.moveTo(t[0] + Math.sin(s2) * 3, t[1] + 6); x.lineTo(t[0] + Math.sin(s2) * 3, t[1] + 12 + (s2 % 3) * 4); } x.stroke();
        x.strokeStyle = 'rgba(232,207,160,.55)'; x.lineWidth = 2.4; x.beginPath(); top.forEach((t, i) => i ? x.lineTo(t[0], t[1] + 2) : x.moveTo(t[0], t[1] + 2)); x.stroke();
        if (hurt > .4) { x.strokeStyle = 'rgba(20,10,2,.75)'; x.lineWidth = 1.4; x.beginPath(); for (let i = 1; i < top.length; i += 3) { const t = top[i]; x.moveTo(t[0] - 4, t[1] + 6); x.lineTo(t[0] + 2, t[1] + 14); x.lineTo(t[0] - 2, t[1] + 22); } x.stroke(); }
      }
    }
    x.restore();
  }
  const _drawCrystal = drawCrystal;
  window.drawCrystal = drawCrystal = function (c, wl) { if (wl && wl.mud) return drawMudPiece(c, wl); return _drawCrystal(c, wl); };

  /* ---------------- Polarity Repel scatters Spell Cannon beams ----------------
     For a moment after Repel, an enemy beam aimed through the caster stops at the push field and breaks into
     shards that fan out and scorch the floor. The caster takes no beam damage while it is scattered. */
  const _beamGeom = beamGeom;
  window.beamGeom = beamGeom = function (c) {
    const g = _beamGeom(c), f = c.o.foe; g.scat = null;
    if (!f || f.dead || !(f.repelT > 0)) return g;
    const ux = Math.cos(c.ang), uy = Math.sin(c.ang), along = (f.x - g.O.x) * ux + (f.y - g.O.y) * uy, perp = Math.abs((f.x - g.O.x) * uy - (f.y - g.O.y) * ux);
    const reach = Math.hypot(g.E.x - g.O.x, g.E.y - g.O.y), cut = Math.max(8, along - 58);
    if (along > 0 && perp < 70 && cut < reach + 4) { g.E = { x: g.O.x + ux * cut, y: g.O.y + uy * cut }; g.blk = null; g.scat = { x: g.E.x, y: g.E.y, by: f }; }
    return g;
  };
  function scatterUpdate(dt) {
    for (const c of cannons) {
      c.shards = (c.shards || []).filter(h => (h.t += dt) < h.life);
      if (c.desp && c.g && c.t < c.dur && !(c.clashT > 0)) { const b = Math.max(0, Math.min(1, (despK(c) - 1) / .45)); c.spA = (c.spA || 0) + dt * 40 * b;
        while (c.spA > 1) { c.spA -= 1; const u = rnd(.1, 1), O = c.g.O, E = c.g.E, px0 = O.x + (E.x - O.x) * u, py0 = O.y + (E.y - O.y) * u, a = c.ang + (Math.random() < .5 ? 1 : -1) * rnd(.8, 2.2), v = rnd(60, 180);
          P({ x: px0, y: py0 - 40 * HS, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 - rnd(40, 120), color: 'hsl(' + ((T * 300 + u * 360) % 360 | 0) + ',100%,65%)', size: rnd(2, 3.5), life: rnd(.35, .6), grav: 420 });
          if (Math.random() < .22) { const lx = px0 + Math.cos(a) * rnd(10, 40), ly = py0 + Math.sin(a) * rnd(6, 24) * .6; if (lx > F.x0 && lx < F.x1 && ly > F.y0 && ly < F.y1) addFlame(lx, ly); } } }
      const sc = c.g && c.g.scat; if (!sc || c.t >= c.dur || c.clashT > 0) { c.wasScat = 0; continue; }
      if (!c.wasScat) { c.wasScat = 1; text(sc.by.x, sc.by.y - 100 * HS, 'SCATTERED!', '#ff8a8a', true); shake = Math.max(shake, 7); inkRing(sc.x, sc.y, '#ff5a5a', 2, 14, 60, .62); }
      c.shAcc = (c.shAcc || 0) + dt;
      while (c.shAcc > .05) { c.shAcc -= .05;
        const sd = Math.random() < .5 ? 1 : -1, a = c.ang + sd * rnd(.55, 1.7) + (Math.random() < .2 ? Math.PI * .85 * sd : 0), len = rnd(80, 210), E = clipToField(sc, { x: sc.x + Math.cos(a) * len, y: sc.y + Math.sin(a) * len });
        c.shards.push({ x: sc.x, y: sc.y, ex: E.x, ey: E.y, t: 0, life: rnd(.14, .26), w: rnd(.5, 1) });
        if (Math.random() < .3) decals.push(beamScar({ x: sc.x, y: sc.y }, E, false, .5));
        for (let i = 0; i < 2; i++) P({ x: E.x, y: E.y - 40 * HS, vx: rnd(-80, 80), vy: rnd(-90, 20), color: ['#ffffff', '#4fe3ff', '#ff8a8a'][i % 3], size: 2.5, life: .3 });
      }
      if (Math.random() < .6) P({ x: sc.x + rnd(-6, 6), y: sc.y - 40 * HS + rnd(-6, 6), vx: rnd(-140, 140), vy: rnd(-140, 60), color: Math.random() < .5 ? '#ffffff' : '#ff6b6b', size: rnd(2, 3.5), life: .25 });
    }
  }
  function drawScatter(x) {
    for (const c of cannons) {
      const sc = c.g && c.g.scat, col = c.o.me ? '#4fe3ff' : '#ff7a86';
      if (c.shards && c.shards.length) { x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
        for (const h of c.shards) { const k = h.t / h.life, y0 = h.y - 40 * HS, y1 = h.ey - 40 * HS, mx = (h.x + h.ex) / 2 + rnd(-4, 4), my = (y0 + y1) / 2 + rnd(-4, 4);
          for (const [lw, cc, al] of [[9 * h.w, col, .45], [3 * h.w, '#ffffff', 1]]) { x.globalAlpha = (1 - k) * al; x.strokeStyle = cc; x.lineWidth = lw * (1 - k * .5); x.beginPath(); x.moveTo(h.x, y0); x.lineTo(mx, my); x.lineTo(h.ex, y1); x.stroke(); } }
        x.restore(); }
      if (sc && c.t < c.dur) { // the push field the beam is breaking on
        const f = sc.by, a = Math.atan2(sc.y - f.y, sc.x - f.x); x.save(); x.translate(f.x, f.y - 40 * HS); x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { x.globalAlpha = .55 - i * .15; x.strokeStyle = i ? '#ff5a5a' : '#ffffff'; x.lineWidth = 5 - i * 1.4; x.beginPath(); x.arc(0, 0, 54 + i * 6 + Math.sin(T * 30 + i) * 2, a - .9, a + .9); x.stroke(); }
        const g = x.createRadialGradient(sc.x - f.x, sc.y - f.y, 0, sc.x - f.x, sc.y - f.y, 30); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,90,90,0)'); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(sc.x - f.x, sc.y - f.y, 30, 0, 7); x.fill(); x.restore(); }
    }
  }

  /* ---------------- meta: rivals, AI label, migration, shop packs, wardrobe ---------------- */
  const majority = list => { let s = 0, z = 0; (list || []).forEach(k => SCHOOL_OF(k) === 'sorc' ? s++ : z++); return s > z ? 'sorc' : 'wiz'; };
  const _newMatch = newMatch;
  window.newMatch = newMatch = function (o = {}) {
    const _sv = showVs; let ran = false;
    window.showVs = showVs = function (cb) { if (!ran && M && M.foe) { ran = true; M.foeLook = Object.assign({}, M.foeLook, { cls: (M.opts && M.opts.look && M.opts.look.cls) || majority(M.foe.pool) }); if (!/· AI$/.test(M.foeName)) M.foeName = M.foeName + ' · AI'; } window.showVs = showVs = _sv; return _sv(cb); };
    return _newMatch(o);
  };
  // the wardrobe gets a Path category (Wizard / Sorcerer)
  COSMETICS.cls = [{ id: 'wiz', n: 'Wizard', d: 'Robes, hats and a staff.', unlock: { type: 'free' } }, { id: 'sorc', n: 'Sorcerer', d: 'Gi, headband and bare fists.', unlock: { type: 'free' } }];
  if (typeof CATS !== 'undefined' && !CATS.some(c => c[0] === 'cls')) CATS.unshift(['cls', 'Path']);
  if (typeof PR !== 'undefined' && PR) {
    PR.look.cls = PR.look.cls || 'wiz'; PR.prog = PR.prog || { wiz: 0, sorc: 0 }; PR.tokS = PR.tokS || 0;
    // Raise Dead used to be a starter: keep it for players who had it
    if (!unlockedSpells().includes('zombies') && (PR.hand || []).includes('zombies')) { PR.chosen = (PR.chosen || []).concat(['zombies']); PR.unlocked = (PR.unlocked || []).concat(['zombies']); }
    // everyone gets one free Technique Token to pick a first sorcerer technique
    if (!PR.techGift) { PR.techGift = 1; PR.tokS = (PR.tokS || 0) + 1; }
    Object.keys(TECH).forEach(k => { if (!PR.spells[k]) PR.spells[k] = { lvl: 1, cards: 0 }; });
    if (typeof save === 'function') try { save(); } catch (e) {}
  }

  window.buyPack = function (id) {
    const pk = PACKS.find(p => p.id === id); if (!pk) return;
    const got = [];
    for (const sc of ['wiz', 'sorc']) { if (!pk[sc]) continue; PR.prog[sc] = (PR.prog[sc] || 0) + pk[sc]; while (PR.prog[sc] >= 100) { PR.prog[sc] -= 100; if (sc === 'sorc') PR.tokS = (PR.tokS || 0) + 1; else PR.tokens = (PR.tokens || 0) + 1; got.push(sc === 'sorc' ? 'a Technique Token' : 'a Spell Token'); } }
    // points spread over owned cards of the pack's school
    const owned = unlockedSpells().filter(k => pk.wiz && pk.sorc ? true : pk.sorc ? SCHOOL_OF(k) === 'sorc' : SCHOOL_OF(k) === 'wiz');
    for (let i = 0; i < pk.pts; i++) { const k = owned[Math.random() * owned.length | 0]; if (k) PR.spells[k].cards = (PR.spells[k].cards || 0) + 1; }
    if (pk.gems) PR.gems += pk.gems;
    sfx('ui_unlock'); if (typeof save === 'function') try { save(); } catch (e) {}
    if (typeof refreshMeta === 'function') refreshMeta(); renderPacks();
    toast(pk.n + ': ' + (got.length ? 'unlocked ' + got.join(' and ') + '!' : '+' + pk.pts + ' points'));
  };
  function renderPacks() {
    const host = document.getElementById('packs'); if (!host) return;
    const bar = (sc, lbl, c) => `<div class="pkbar"><span>${lbl}</span><div class="pkb"><i style="width:${PR.prog[sc] || 0}%;background:${c}"></i></div><b>${PR.prog[sc] || 0}/100</b></div>`;
    host.innerHTML = bar('wiz', 'Spell unlock', '#b9a6ff') + bar('sorc', 'Technique unlock', '#ff6b6b') +
      `<div class="pkrow">${PACKS.map(p => `<button class="pk ${p.best ? 'best' : ''}" style="--a:${p.c[0]};--b:${p.c[1]}" onclick="buyPack('${p.id}')">${p.best ? '<em>BEST VALUE</em>' : ''}<img src="${p.id === 'scroll' ? tokenImg('sorc') : p.id === 'tome' ? tokenImg() : tokenImg('sorc')}" ${p.id === 'grand' ? 'class="dbl"' : ''}>${p.id === 'grand' ? `<img class="dbl2" src="${tokenImg()}">` : ''}<b>${p.n}</b><small>${p.d}</small><span class="pp">${p.price}</span></button>`).join('')}</div><div class="pknote">Playtest build: purchases are simulated.</div>`;
  }
  const css = document.createElement('style'); css.textContent = `
  #packs{margin:6px 0 14px}.pkbar{display:flex;align-items:center;gap:8px;font:800 11px system-ui;color:#e8e0ff;margin:4px 2px}.pkbar span{width:104px}.pkb{flex:1;height:8px;border-radius:5px;background:#0006;border:1.5px solid #000;overflow:hidden}.pkb i{display:block;height:100%}.pkbar b{width:44px;text-align:right}
  .pkrow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.pk{position:relative;border:2.5px solid #000;border-radius:14px;padding:12px 6px 8px;background:linear-gradient(180deg,var(--a),var(--b));color:#fff;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 4px 0 #000;font-family:inherit}
  .pk img{width:44px;height:44px;filter:drop-shadow(0 2px 0 #000)}.pk img.dbl{margin-right:-18px;transform:rotate(-10deg)}.pk img.dbl2{position:absolute;top:12px;left:52%;transform:rotate(10deg)}.pk b{font:900 13px system-ui;text-shadow:0 2px 0 #000}.pk small{font:700 9.5px system-ui;line-height:1.2;opacity:.95;min-height:34px;text-align:center}
  .pk .pp{background:#000a;border-radius:8px;padding:3px 10px;font:900 13px system-ui}.pk em{position:absolute;top:-9px;background:#ffd45e;color:#000;font:900 9px system-ui;padding:2px 6px;border-radius:6px;border:2px solid #000;font-style:normal}.pknote{text-align:center;font:700 10px system-ui;color:#cdbbff;margin-top:6px;opacity:.8}
  .badge-sorc{display:inline-block;background:#9a1020;color:#fff;border:1.5px solid #000;border-radius:5px;font:900 8.5px system-ui;padding:0 4px;margin-left:4px;vertical-align:1px}`;
  document.head.appendChild(css);
  const _renderShop = renderShop;
  window.renderShop = renderShop = function () {
    const r = _renderShop.apply(this, arguments);
    let host = document.getElementById('packs');
    if (!host) { const anchor = document.getElementById('dealTm'); const lbl = anchor && anchor.closest('.lbl'); if (lbl) { const h = document.createElement('div'); h.className = 'lbl'; h.textContent = 'Unlock Packs'; host = document.createElement('div'); host.id = 'packs'; lbl.parentNode.insertBefore(h, lbl); lbl.parentNode.insertBefore(host, lbl); } }
    renderPacks(); return r;
  };
  try { if (typeof refreshMeta === 'function') refreshMeta(); } catch (e) {}
  /* Spell Cannon and other streams: damage goes into a Titan Shell first and only reaches the caster once it breaks */
  /* Boundary: a caught projectile hangs in the air for 1s, still burning, then is flung off to the side.
     It can't hit anything once caught. Called from the projectile loop; returns true to skip the normal update. */
  window.heldProj = function (p, dt) {
    if (p.held > 0) {
      p.held -= dt; p.life = Math.max(p.life, 1);
      if (Math.random() < dt * 8) P({ x: p.x + rnd(-14, 14), y: p.y + rnd(-14, 14), vx: rnd(-20, 20), vy: rnd(-20, 20), color: '#bcd2ff', size: 2, life: .3 });
      if (p.held <= 0) { p.vx = Math.cos(p.flingA) * 380; p.vy = Math.sin(p.flingA) * 380; p.life = 1.4; burst(p.x, p.y, 10, ['#e6f0ff', '#7aa6ff'], 150, 3, .3); inkRing(p.x, p.y, '#bcd2ff', 1, 6, 24); }
    } else { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < F.x0 - 60 || p.x > F.x1 + 60 || p.y < F.y0 - 100 || p.y > F.y1 + 60) p.life = 0; }
    const sp2 = Math.hypot(p.vx, p.vy) || 1;
    for (let q = 0; q < 2; q++) fireFx.push({ x: p.x - p.vx / sp2 * rnd(0, 10) + rnd(-3, 3), y: p.y - p.vy / sp2 * rnd(0, 10) + rnd(-3, 3), vx: -p.vx * .12 + rnd(-12, 12), vy: -p.vy * .12 - rnd(10, 30), t: 0, life: rnd(.22, .38), s: rnd(6, 10) * (p.r / 9), seed: rnd(0, 99), smoke: 0 });
    p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.pop();
    return true;
  };
  window.shellSoak = function (w, d) {
    if (!w.shell || w.dead || ended || !(d > 0)) return false;
    const sh = w.shell; sh.hp -= d; sh.hit = .18; sh.acc = (sh.acc || 0) + d;
    if (sh.acc >= 4) { text(w.x + rnd(-8, 8), w.y - 100 * HS, Math.round(sh.acc), '#9fb8ff'); sh.acc = 0; }
    if (Math.random() < .35) burst(w.x + rnd(-14, 14), w.y - rnd(30, 80) * HS, 4, ['#e6f0ff', '#7aa6ff'], 140, 3, .3);
    if (sh.hp <= 0) { w.shell = null; w.shellDown = 1; shake = Math.max(shake, 10); text(w.x, w.y - 104 * HS, 'SHELL BROKEN', '#9fb8ff', true); shellShatter(w); try { sfx('shatter', { x: w.x }); } catch (e) {} }
    return true;
  };
  window.TECH_DEBUG = { get muds() { return muds; }, castEarth, addBleed, get cleaves() { return cleaves; }, get springs() { return springs; }, get slashes() { return slashes; }, get domes() { return domes; }, get orbs() { return orbsC; }, get fx() { return fx; }, eyeFlash, doSwap, drawSorc };
})();
