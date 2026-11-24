/* =====================================================================
   WIZARDS VS SORCERERS: the Ladder and its boss variants
   Loaded after wizard-modes.js.

   The Ladder: twenty named rivals in order, each built around one ability with partners that make it hard to
   answer. Their hands are shown before the fight so the player can build against them. A rung opens when the
   one before is beaten and the player has 50 trophies per rung. First win: 10 gems and the rival's featured
   ability (if not owned). Every fifth rival is a boss who pays a VARIANT: an existing ability with a twist,
   shown in the spell book but only won here.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const X = window.TECHX;

  /* ---------------- boss variants ---------------- */
  COL.bluefire = ['#e6f6ff', '#3aa0ff', '#061a4a']; COL.violet = ['#f1dcff', '#a24dff', '#1c0640']; COL.openward = ['#ffffff', '#9fd0ff', '#102a5a']; COL.crimson = ['#ffd6d2', '#ff2a3a', '#3a0008'];
  const VARIANTS = {
    bluefire:     { base: 'fireball', n: 'Blue Flame', el: 'bluefire', t: 1, boss: 4, d: 'A fireball that burns hotter: 35% more damage. It burns itself out at half the distance.', tag: 'Variant',
                    ups: [{ id: 'wall', n: 'Blue Wall', d: 'Where a Blue Flame burns out, it leaves a wall of fire for 3 seconds.' }] },
    opensanctum:  { base: 'sanctum', n: 'Open Sanctum', el: 'openward', t: 1, boss: 9, d: 'A Sanctum with no walls. Its damage bonus and boosted blast reach you and the enemy anywhere. Nothing is trapped or slowed.', tag: 'Variant',
                    drop: ['oneway', 'vast'], ups: [{ id: 'endless', n: 'Endless Rite', d: 'Open Sanctum lasts 2 seconds longer.' }] },
    crimsontitan: { base: 'titan', n: 'Crimson Titan', el: 'crimson', t: 1.15, boss: 14, d: 'A red Titan Shell that fights back: every 3 seconds it swipes a line of force at the enemy, breaking any wall in the way.', tag: 'Variant',
                    ups: [{ id: 'burst', n: 'Bursting Swipe', d: 'The swipe ends in an explosion.' }] },
    violetbolt:   { base: 'lightning', n: 'Violet Bolt', el: 'violet', t: 1.2, boss: 19, d: 'Lightning that strikes twice: an echo bolt follows at 60% damage. It takes 20% longer to cast.', tag: 'Variant',
                    ups: [{ id: 'afterclap', n: 'Afterclap', d: 'The echo bolt stuns for half a second.' }] },
  };
  window.VARIANTS = VARIANTS;
  for (const k in VARIANTS) { const v = VARIANTS[k], b = SP[v.base];
    SP[k] = Object.assign({}, b, { n: v.n, el: v.el, t: +(b.t * v.t).toFixed(2), d: v.d, tag: v.tag, variantOf: v.base });
    STATS[k] = STATS[v.base]; if (typeof STAT_LBL_SPELL !== 'undefined' && STAT_LBL_SPELL[v.base]) STAT_LBL_SPELL[k] = STAT_LBL_SPELL[v.base];
    UPG[k] = (UPG[v.base] || []).filter(u => !(v.drop || []).includes(u.id) && !u.sig).concat(v.ups);
    TYPE_OF[k] = TYPE_OF[v.base]; if (typeof ELEM_OF !== 'undefined' && ELEM_OF[v.base]) ELEM_OF[k] = ELEM_OF[v.base]; if (typeof THREAT !== 'undefined') THREAT[k] = (THREAT[v.base] || 1) + .3;
    if (typeof COUNTERS !== 'undefined') COUNTERS[k] = COUNTERS[v.base] || [];
    if (typeof TECH !== 'undefined' && TECH[v.base]) { TECH[k] = SP[k]; try { SORC.add(k); } catch (e) {} }
    try { ONE_COPY.add(k); } catch (e) {}
    try { if (!EXTRA_UNLOCKS.some(e => e.k === k)) EXTRA_UNLOCKS.push({ k, t: Infinity, variant: 1 }); } catch (e) {}   // sorts last in the spell book; never a token checkpoint or part of a rival's random pool
    if (typeof PR !== 'undefined' && PR.spells && !PR.spells[k]) PR.spells[k] = { lvl: 1, cards: 0 };
    // the icon is the base icon washed in the variant's colour
    ICON[k] = ICON[v.base]; const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 96, 96); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .62; g.fillStyle = COL[v.el][1]; g.fillRect(0, 0, 96, 96);
      g.globalAlpha = .5; g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, 0, 96, 96); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, COL[v.el][2]); g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ffd75e'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, r = i % 2 ? 6 : 13; g.lineTo(78 + Math.cos(a) * r, 18 + Math.sin(a) * r); } g.closePath(); g.stroke(); g.fill();
      ICON[k] = c.toDataURL(); } catch (e) {} }; im.src = ICON[v.base]; }
  const isVar = k => !!VARIANTS[k];
  // a fighter carrying a variant uses the base ability's machinery: its level and shared upgrades are mirrored onto the base
  function mirror(w) { if (!w || !w.book) return; for (const k of new Set(w.book)) { const v = VARIANTS[k]; if (!v) continue; const b = v.base;
      if (!w.book.includes(b)) w.lv[b] = w.lv[k] || 1; for (const u of [...w.up]) if (u.startsWith(k + '.')) { const id = u.slice(k.length + 1); if ((UPG[b] || []).some(q => q.id === id)) w.up.add(b + '.' + id); } } }
  let swipes = [], vbolts = [];
  const listsNow = () => ({ projs: typeof projs !== 'undefined' ? new Set(projs) : new Set(), bolts: typeof bolts !== 'undefined' ? new Set(bolts) : new Set(), domes: X ? new Set(X.domes) : new Set() });
  const _cast = cast;
  window.cast = cast = function (w, k) {
    const v = VARIANTS[k]; if (!v) return _cast.apply(this, arguments);
    mirror(w); const before = listsNow(), b = v.base, shell0 = w.shell, r = _cast.call(this, w, b);
    try {
      if (w.me && typeof M !== 'undefined' && M) { for (const o of [M.casts, M.rc]) if (o && o[b]) { o[b]--; if (!o[b]) delete o[b]; o[k] = (o[k] || 0) + 1; } }
      if (k === 'bluefire') for (const p of projs) if (!before.projs.has(p) && p.o === w) { p.blue = 1; p.dmgMul = (p.dmgMul || 1) * 1.35; p.x0 = p.x; p.y0 = p.y; p.reach = 255; p.wallUp = U(w, k, 'wall'); }
      if (k === 'violetbolt') { for (const q of bolts) if (!before.bolts.has(q)) q.violet = 1; const stun = U(w, k, 'afterclap');
        setTimeout(() => { try { if (ended || w.dead || w.foe.dead) return; const b0 = new Set(bolts), keepLv = w.lv.lightning; zap(w, 'lightning', 1, .6); for (const q of bolts) if (!b0.has(q)) q.violet = 1; if (stun && !w.foe.dead && !(w.foe.ghostT > 0)) { w.foe.stunT = Math.max(w.foe.stunT || 0, .5); } text(w.x, w.y - 100 * HS, 'ECHO', '#d9b3ff'); } catch (e) {} }, 430); }
      if (k === 'opensanctum' && X) for (const d of X.domes) if (!before.domes.has(d) && d.o === w) { d.open = 1; d.r = 0; d.trap = []; d.hp = d.max = 9999; if (U(w, k, 'endless')) d.dur += 2;
        for (let i = texts.length - 1; i >= 0; i--) if ((texts[i].s === 'SANCTUM' || texts[i].s === 'TRAPPED') && texts[i].life > .8) texts.splice(i, 1); text(w.x, w.y - 90 * HS, 'OPEN SANCTUM', '#cfe6ff', true); }
      if (k === 'crimsontitan' && w.shell) { w.shell.crimson = 1; if (w.shell !== shell0 || w.shell.swT === undefined) w.shell.swT = 1.2; text(w.x, w.y - 112 * HS, 'CRIMSON TITAN', '#ff5a6e', true); }
    } catch (e) {}
    return r;
  };
  function swipe(w) {
    const f = w.foe, a = Math.atan2(f.y - w.y, f.x - w.x), L = 240, x1 = w.x + Math.cos(a) * L, y1 = w.y + Math.sin(a) * L, O = { x: w.x, y: w.y }, E = { x: x1, y: y1 }, dmg = 2 + S(w, 'titan', 'hp') * .07; SRC = 'titan';
    swipes.push({ x0: w.x, y0: w.y, a, L, t: 0, life: .32, burst: U(w, 'crimsontitan', 'burst') }); shake = Math.max(shake, 6); try { sfx('c_dissect', { x: w.x, rate: .7, vol: .8 }); } catch (e) {}
    const on = e => { const q = closestOn(O, E, e.x, e.y); return Math.hypot(e.x - q.x, e.y - q.y) < 24; };
    if (!f.dead && !(f.ghostT > 0) && on(f)) damage(f, dmg, Math.cos(a) * 240, Math.sin(a) * 240, '#ff8a96');
    for (const c of enemyCreatures(w)) if (c.e.x !== undefined && on(c.e)) hurtCreature(c.e, c.k, dmg * 1.6, 'slash');
    for (const wl of walls) { if (wl.o === w) continue; let n = 0; for (const c of wl.cr) if (!c.gone && on(c)) { c.gone = 1; n++; burst(c.x, c.y - 20 * HS, 10, wl.mud ? ['#d8c09a', '#8a6a48'] : ['#d8f6ff', '#fff'], 170, 4, .4); } if (n) { const live = wl.cr.filter(c => !c.gone).length; wl.hp = live ? Math.min(wl.hp, wl.max * live / wl.cr.length) : 0; } }
    if (U(w, 'crimsontitan', 'burst')) setTimeout(() => { try { if (ended) return; SRC = 'titan'; if (typeof boom === 'function') boom(x1, y1 - 20 * HS, .8); if (!f.dead && !(f.ghostT > 0) && Math.hypot(f.x - x1, f.y - y1) < 56) damage(f, dmg, 0, 0, '#ff8a96'); for (const c of enemyCreatures(w)) if (c.e.x !== undefined && Math.hypot(c.e.x - x1, c.e.y - y1) < 56) hurtCreature(c.e, c.k, dmg, 'fire'); } catch (e) {} }, 260);
  }
  const _su = startDuel;
  window.startDuel = startDuel = function () { swipes = []; const r = _su.apply(this, arguments);
    try { ents.forEach(mirror);  } catch (e) {} return r; };
  const _up = update;
  window.update = update = function (dt) {
    const r = _up.apply(this, arguments);
    try { if (typeof ents !== 'undefined' && ents && ents.length && !ended) {
      for (const p of projs) if (p.blue && p.life > 0) { if (Math.hypot(p.x - p.x0, p.y - p.y0) > p.reach) { p.life = 0; burst(p.x, p.y, 16, ['#e6f6ff', '#3aa0ff', '#fff'], 170, 4, .45); if (typeof steamFx === 'function') steamFx(p.x, p.y, 6);
            if (p.wallUp) { const gy = p.y + 46 * HS, sp = Math.hypot(p.vx, p.vy) || 1, nx = -p.vy / sp, ny = p.vx / sp; for (let i = -2; i <= 2; i++) decals.push({ k: 'fire', x: clamp(p.x + nx * i * 20, F.x0, F.x1), y: clamp(gy + ny * i * 12, F.y0, F.y1), r: 15, t: 0, life: 3, o: p.o }); text(p.x, p.y - 20 * HS, 'BLUE WALL', '#9fd0ff'); } }
        else for (let q = 0; q < 2; q++) fireFx.push({ x: p.x + rnd(-4, 4), y: p.y + rnd(-4, 4), vx: -p.vx * .1 + rnd(-12, 12), vy: -p.vy * .1 - rnd(6, 22), t: 0, life: rnd(.2, .34), s: rnd(7, 11), seed: rnd(0, 99), el: 'frost' }); }
      // the fresh orange puffs a blue flame just shed are turned blue
      const blues = projs.filter(p => p.blue && p.life > 0); if (blues.length) for (let i = fireFx.length - 1; i >= 0 && i > fireFx.length - 40; i--) { const f = fireFx[i]; if (f.el || f.smoke || f.steam || f.t > .09) continue; if (blues.some(p => Math.hypot(p.x - f.x, p.y - f.y) < 22)) f.el = 'frost'; }
      if (blues.length && typeof parts !== 'undefined') for (let i = parts.length - 1; i >= 0 && i > parts.length - 40; i--) { const q = parts[i]; if ((q.color === COL.fire[0] || q.color === COL.fire[1] || q.color === '#ffb347') && blues.some(p => Math.hypot(p.x - q.x, p.y - q.y) < 20)) q.color = Math.random() < .5 ? '#3aa0ff' : '#cfeaff'; }
      for (const w of ents) if (!w.dead && w.shell && w.shell.crimson && !w.foe.dead) { w.shell.swT -= dt; if (w.shell.swT <= 0) { w.shell.swT = 3; swipe(w); } }
    } for (const s of swipes) s.t += dt; swipes = swipes.filter(s => s.t < s.life); } catch (e) {}
    return r;
  };
  // a Blue Flame is drawn blue: a tapering streak of blue fire instead of the orange fireball
  if (typeof drawFireball === 'function') { const _df = drawFireball; window.drawFireball = drawFireball = function (x, p) { if (!p || !p.blue) return _df.apply(this, arguments);
      const tr = [{ x: p.x, y: p.y }].concat(p.trail || []), n = tr.length; x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const [w0, col, al] of [[20, '20,70,200', .5], [12, '70,160,255', .85], [5, '225,242,255', 1]]) for (let i = n - 1; i > 0; i--) { const u = 1 - i / n; x.strokeStyle = `rgba(${col},${u * al})`; x.lineWidth = 1 + w0 * u; x.beginPath(); x.moveTo(tr[i].x, tr[i].y); x.lineTo(tr[i - 1].x, tr[i - 1].y); x.stroke(); }
      x.restore(); }; }
  const _rn = render;
  window.render = render = function () {
    const r = _rn.apply(this, arguments);
    if (typeof ents === 'undefined' || !ents || !ents.length || document.getElementById('battle')?.classList.contains('on') === false) return r;
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    try {
      for (const p of projs) if (p.blue && p.life > 0) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.35, 'rgba(90,180,255,.8)'); g.addColorStop(1, 'rgba(30,90,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, 20, 0, 7); x.fill(); x.restore();
        x.save(); x.fillStyle = '#eaf6ff'; x.strokeStyle = '#061a4a'; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, 6.5, 0, 7); x.fill(); x.stroke(); x.restore(); }
      if (typeof bolts !== 'undefined') for (const b of bolts) if (b.violet && b.pts && b.life > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
        for (const [lw, col] of [[9, 'rgba(162,77,255,.55)'], [3, 'rgba(241,220,255,.95)']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); b.pts.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.stroke(); } x.restore(); }
      // Open Sanctum: no dome, only a seal turning under the caster and slow rings washing out across the floor
      if (X) for (const d of X.domes) if (d.open && d.t < d.dur) { const w = d.o, k = d.t / d.dur, a = Math.min(1, d.t * 4) * (k > .85 ? (1 - k) / .15 : 1); x.save(); x.translate(w.x, w.y); x.scale(1, .5); x.globalCompositeOperation = 'lighter';
        for (let q = 0; q < 3; q++) { const kk = (T * .45 + q / 3) % 1; x.strokeStyle = `rgba(190,220,255,${(1 - kk) * .5 * a})`; x.lineWidth = 2.5 * (1 - kk) + .6; x.beginPath(); x.arc(0, 0, 40 + 330 * kk, 0, 7); x.stroke(); }
        x.strokeStyle = `rgba(230,240,255,${.9 * a})`; x.lineWidth = 2.6; x.beginPath(); x.arc(0, 0, 42, 0, 7); x.stroke(); x.lineWidth = 1.4; x.beginPath(); x.arc(0, 0, 34, 0, 7); x.stroke();
        for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283 + T * .8; x.beginPath(); x.moveTo(Math.cos(an) * 34, Math.sin(an) * 34); x.lineTo(Math.cos(an) * 42, Math.sin(an) * 42); x.stroke(); }
        x.rotate(-T * .5); x.beginPath(); for (let i = 0; i < 4; i++) { const an = i / 4 * 6.283; x.lineTo(Math.cos(an) * 30, Math.sin(an) * 30); } x.closePath(); x.stroke(); x.restore(); }
      for (const s of swipes) { const k = s.t / s.life, d = s.L * Math.min(1, k * 1.5), px = s.x0 + Math.cos(s.a) * d, py = s.y0 + Math.sin(s.a) * d - 36 * HS; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
        x.strokeStyle = `rgba(255,60,80,${(1 - k) * .6})`; x.lineWidth = 16 * (1 - k) + 2; x.beginPath(); x.moveTo(s.x0, s.y0 - 36 * HS); x.lineTo(px, py); x.stroke(); x.strokeStyle = `rgba(255,255,255,${(1 - k) * .9})`; x.lineWidth = 3; x.stroke();
        x.translate(px, py); x.rotate(s.a); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1 - k * .7; x.fillStyle = '#07020d'; x.beginPath(); x.arc(0, 0, 30, -1.15, 1.15); x.arc(-13, 0, 28, 1, -1, true); x.closePath(); x.fill(); x.fillStyle = '#ff2a3a'; x.beginPath(); x.arc(0, 0, 27, -1.1, 1.1); x.arc(-12, 0, 25, .95, -.95, true); x.closePath(); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 21, -.9, .9); x.arc(-9, 0, 20, .8, -.8, true); x.closePath(); x.fill(); x.restore(); }
    } catch (e) {}
    x.restore(); return r;
  };

  /* ---------------- the rivals ---------------- */
  const L = [
    { id: 'tamsin', n: 'Tamsin Dewdrop', title: 'The First Lesson', cls: 'wiz', feat: 'icewall', hand: ['icewall', 'fireball', 'lightning', 'archer'], ups: ['icewall.thick', 'fireball.twin'], look: { robe: 'frost', hat: 'pointy', staff: 'wand', beard: 'none', skin: 'peach', pet: 'owl' }, aura: 'frost', line: 'Ready when you are.', mood: 'calm', tip: 'Her wall blocks straight shots. Go around it, drop things over it, or break it.' },
    { id: 'bo', n: 'Bo Harrow', title: 'Fists First', cls: 'sorc', feat: 'rush', hand: ['rush', 'counter', 'doubletake', 'secondwind'], ups: ['rush.relentless', 'counter.riposte'], look: { robe: 'ember', hat: 'feathered', staff: 'oak', beard: 'brown', skin: 'tan', pet: 'none' }, aura: 'crimson', line: 'Come closer.', mood: 'cocky', tip: 'He has to reach you to hurt you. Walls, mud and knockback buy time. Do not punch into his stance.' },
    { id: 'grue', n: 'Old Mother Grue', title: 'The Grave Tender', cls: 'wiz', feat: 'zombies', hand: ['zombies', 'flies', 'thorns', 'ghost'], ups: ['zombies.horde', 'flies.bigswarm', 'zombies.frenzy'], look: { robe: 'moss', hat: 'hood', staff: 'skull', beard: 'none', skin: 'ashen', pet: 'frog' }, aura: 'venom', line: 'They were so lonely.', mood: 'calm', tip: 'Clear the board or drown in it. Area damage pays here.' },
    { id: 'sela', n: 'Sela Quickwater', title: 'The Tide Reader', cls: 'wiz', feat: 'healspring', hand: ['bubbles', 'healspring', 'gale', 'shield'], ups: ['bubbles.sticky', 'healspring.deep', 'gale.sustain'], look: { robe: 'tide', hat: 'hood', staff: 'crystal', beard: 'teal', skin: 'moonlit', pet: 'wisp' }, aura: 'deepsea', line: 'Slow down. Breathe.', mood: 'calm', tip: 'She outlasts you. Push her off the spring or burst her down between heals.' },
    { id: 'pyrrha', n: 'Pyrrha Cindermaw', title: 'The Kiln Witch', cls: 'wiz', feat: 'ringfire', boss: 'bluefire', hand: ['bluefire', 'ringfire', 'burnbody', 'meteor'], ups: ['bluefire.twin', 'ringfire.wall', 'bluefire.wall', 'meteor.scorch'], look: { robe: 'sunfire', hat: 'witch', staff: 'crystal', beard: 'ginger', skin: 'emberskin', pet: 'dragon' }, aura: 'sunset', line: 'Blue burns hotter, dear.', mood: 'wild', tip: 'Her blue flames die at half range: fight her from far away. Up close she is an oven.' },
    { id: 'dorn', n: 'Dorn Mudfoot', title: 'The Wall Builder', cls: 'sorc', feat: 'earthm', hand: ['earthm', 'titan', 'icewall', 'dissect'], ups: ['earthm.mudwall', 'earthm.pillars', 'titan.fortified', 'icewall.thick'], look: { robe: 'moss', hat: 'mushroom', staff: 'oak', beard: 'green', skin: 'umber', pet: 'frog' }, aura: 'jade', line: 'Good fences. Good neighbours.', mood: 'calm', tip: 'Move him, break the shell, and deal your damage before it all comes back.' },
    { id: 'jun', n: 'Jun the Quiet', title: 'Hundred Cuts', cls: 'sorc', feat: 'dissect', hand: ['dissect', 'doubletake', 'copycast', 'chosen'], ups: ['dissect.triple', 'dissect.sting', 'dissect.ceaseless'], look: { robe: 'obsidian', hat: 'feathered', staff: 'oak', beard: 'none', skin: 'peach', pet: 'none' }, aura: 'bloodmoon', line: '...', mood: 'calm', skin: 'gilded', cos: { type: 'atk', id: 'gilded', n: 'Gilded Blood (Dissection attack style)' }, tip: 'Every cut bleeds. Block the line of fire, and give Copy Cast nothing worth copying.' },
    { id: 'wren', n: 'Wren Hollowell', title: 'The Storm Shepherd', cls: 'wiz', feat: 'storm', hand: ['storm', 'lightning', 'hourglass', 'blink'], ups: ['storm.twin', 'lightning.fork', 'storm.hail'], look: { robe: 'stormcl', hat: 'pointy', staff: 'moon', beard: 'blue', skin: 'spirit', pet: 'owl' }, aura: 'azure', line: 'Mind the weather.', mood: 'wild', tip: 'Keep moving out from under the clouds. A grounding totem swallows her bolts.' },
    { id: 'vant', n: 'Oro Vant', title: 'The Beastcaller', cls: 'sorc', feat: 'zodiac', hand: ['zodiac', 'healspring', 'earthm', 'sanctum'], ups: ['zodiac.pack', 'zodiac.mend', 'healspring.shared'], look: { robe: 'emerald', hat: 'witch', staff: 'skull', beard: 'green', skin: 'tan', pet: 'wolf' }, aura: 'jade', line: 'Meet the family.', mood: 'wild', cos: { type: 'pet', id: 'wolf', n: 'Wolf familiar' }, tip: 'His beasts heal and hit harder in his dome. Kill them as they arrive or kill him first.' },
    { id: 'veyra', n: 'Sister Veyra', title: 'Keeper of the Dome', cls: 'sorc', feat: 'sanctum', boss: 'opensanctum', hand: ['opensanctum', 'polarity', 'dissect', 'secondwind'], ups: ['opensanctum.surehit', 'polarity.boundary', 'dissect.triple', 'opensanctum.endless'], look: { robe: 'ivory', hat: 'hood', staff: 'moon', beard: 'long', skin: 'moonlit', pet: 'wisp' }, aura: 'frost', line: 'There are no walls. There never were.', mood: 'calm', tip: 'Her Sanctum has no dome to break or leave. Her next cast after it will land wherever you stand: have a block ready.' },
    { id: 'nix', n: 'Old Nix', title: 'The Trickster', cls: 'wiz', feat: 'mirror', hand: ['mirror', 'ricochet', 'rift', 'ghost'], ups: ['mirror.twin', 'mirror.mcast', 'ricochet.split'], look: { robe: 'amethyst', hat: 'mushroom', staff: 'wand', beard: 'violet', skin: 'goblin', pet: 'frog' }, aura: 'violet', line: 'Which one is me?', mood: 'wild', cos: { type: 'trail', id: 'afterimage', n: 'Afterimage trail' }, trail: 'afterimage', tip: 'Aimed shots chase his decoys. Area damage and summons do not care which one is real.' },
    { id: 'hesper', n: 'Hesper Vale', title: 'The Blood Scribe', cls: 'sorc', feat: 'bloodcraft', hand: ['bloodcraft', 'earthm', 'sanctum', 'counter'], ups: ['bloodcraft.lance', 'bloodcraft.venom', 'bloodcraft.bend', 'earthm.quag'], look: { robe: 'rosewood', hat: 'hood', staff: 'skull', beard: 'none', skin: 'ashen', pet: 'cat' }, aura: 'bloodmoon', line: 'This will leave a mark.', mood: 'calm', tip: 'Her lance bends after you and poisons. A wall or a dome stops blood dead.' },
    { id: 'galen', n: 'Galen Ashgrave', title: 'The Siege Engineer', cls: 'wiz', feat: 'beam', hand: ['beam', 'icewall', 'shield', 'archer'], ups: ['beam.wide', 'icewall.thick', 'beam.overload', 'archer.volley'], look: { robe: 'midnight', hat: 'crown', staff: 'crystal', beard: 'brown', skin: 'tan', pet: 'owl' }, aura: 'gold', line: 'Stand right there, please.', mood: 'cocky', tip: 'The cannon needs three seconds to charge. Interrupt it, hide behind something, or be somewhere else.' },
    { id: 'kessa', n: 'Kessa Thornwhistle', title: 'The Gardener', cls: 'wiz', feat: 'thorns', hand: ['thorns', 'bubbles', 'golem', 'healspring'], ups: ['thorns.creep', 'thorns.strangle', 'golem.iron', 'bubbles.linger'], look: { robe: 'emerald', hat: 'mushroom', staff: 'oak', beard: 'pink', skin: 'goblin', pet: 'frog' }, aura: 'jade', line: 'Mind the roses.', mood: 'calm', cos: { type: 'trail', id: 'bloom', n: 'Bloom trail' }, trail: 'bloom', tip: 'The floor is hers. Fight from where it is clean, and burn the garden if you can.' },
    { id: 'brakka', n: 'Brakka Ironknuckle', title: 'The Unbroken', cls: 'sorc', feat: 'titan', boss: 'crimsontitan', hand: ['crimsontitan', 'rush', 'counter', 'earthm'], ups: ['crimsontitan.fortified', 'rush.finisher', 'crimsontitan.burst', 'crimsontitan.walking'], look: { robe: 'ember', hat: 'pointy', staff: 'oak', beard: 'red', skin: 'umber', pet: 'none' }, aura: 'emberaura', line: 'Hit me. I dare you.', mood: 'cocky', tip: 'His red shell swipes every few seconds and breaks walls. Fists crack shells fastest; so does anything that ignores them.' },
    { id: 'mirelle', n: 'Mirelle Vantablack', title: 'The Event Horizon', cls: 'wiz', feat: 'gravity', hand: ['gravity', 'meteor', 'sinkhole', 'ringfire'], ups: ['gravity.crush', 'meteor.shower', 'gravity.horizon', 'sinkhole.cavein'], look: { robe: 'voidweave', hat: 'witch', staff: 'moon', beard: 'none', skin: 'spirit', pet: 'cat' }, aura: 'voidaura', line: 'Everything falls, in the end.', mood: 'calm', tip: 'She drags you into one spot, then drops the sky on it. Anything that moves you out of a well saves your life.' },
    { id: 'rook', n: 'Rook Sable', title: 'The Oathbound', cls: 'sorc', feat: 'bloodoath', hand: ['bloodoath', 'doubletake', 'secondwind', 'dissect'], ups: ['bloodoath.more', 'bloodoath.fleet', 'bloodoath.blitz', 'bloodoath.backstab'], look: { robe: 'obsidian', hat: 'hood', staff: 'oak', beard: 'none', skin: 'umber', pet: 'none' }, aura: 'bloodmoon', line: 'I swore I would not lose.', mood: 'cocky', cos: { type: 'aurastyle', id: 'tempest', n: 'Tempest aura style' }, auraStyle: 'tempest', tip: 'Less health, but he heals every second and never stops cutting. Burst damage beats regeneration.' },
    { id: 'thessaly', n: 'Thessaly Frost', title: 'The Long Winter', cls: 'wiz', feat: 'hourglass', hand: ['hourglass', 'icewall', 'archer', 'storm'], ups: ['hourglass.stasis', 'icewall.permafrost', 'archer.twin', 'hourglass.wide'], look: { robe: 'frost', hat: 'crown', staff: 'crystal', beard: 'white', skin: 'spirit', pet: 'owl' }, aura: 'frost', line: 'I can wait all day.', mood: 'calm', tip: 'Nothing reaches her quickly. Bring something that goes over or through, and patience.' },
    { id: 'ilyra', n: 'Ilyra Dusk', title: 'The Push and the Pull', cls: 'sorc', feat: 'polarity', hand: ['polarity', 'rush', 'sanctum', 'titan'], ups: ['polarity.collapse', 'polarity.drag', 'polarity.jolt', 'polarity.boundary'], look: { robe: 'midnight', hat: 'feathered', staff: 'moon', beard: 'none', skin: 'moonlit', pet: 'wisp' }, aura: 'azure', line: 'Away. No: here.', mood: 'wild', tip: 'Her Boundary sends your best shot straight back. Bait it with something small first.' },
    { id: 'gilda', n: 'Gilda Goldmantle', title: 'The Champion', cls: 'wiz', feat: 'lightning', boss: 'violetbolt', hand: ['violetbolt', 'beam', 'archer', 'sinkhole'], ups: ['violetbolt.fork', 'beam.wide', 'violetbolt.afterclap', 'archer.fire', 'violetbolt.overcharge'], look: { robe: 'royal', hat: 'crown', staff: 'moon', beard: 'goldlong', skin: 'gilded', pet: 'dragon' }, aura: 'gold', line: 'Bow. Then begin.', mood: 'cocky', cos: { type: 'aurastyle', id: 'halo', n: 'Halo aura style' }, tip: 'Every bolt lands twice. A totem, a shell or a Boundary turns her best weapon off.' },
  ].filter(r => r.hand.every(k => SP[k]));
  window.LADDER = L;
  const GATE = 50, GEMS = 10;
  const st = () => { PR.ladder = PR.ladder || { won: {} }; PR.ladder.won = PR.ladder.won || {}; return PR.ladder; };
  const beaten = i => !!st().won[L[i].id];
  const gateOf = i => i * GATE;
  const openAt = i => (i === 0 || beaten(i - 1)) && (PR.trophies || 0) >= gateOf(i);
  const owned = k => typeof isUnl === 'function' ? isUnl(k) : unlockedSpells().includes(k);
  const rewardOf = r => r.boss || r.feat;

  const _nm = newMatch;
  window.newMatch = newMatch = function (o) {
    o = o || {}; const i = o.ladder; if (i === undefined || !L[i]) return _nm.apply(this, arguments);
    const r = L[i], lvs = (PR.hand || []).map(k => PR.spells[k].lvl), base = Math.round(lvs.reduce((a, b) => a + b, 0) / Math.max(1, lvs.length)), lv = clamp(base + Math.floor(i / 5), 1, MAXL);
    const o2 = Object.assign({}, o, { name: r.n, look: Object.assign({}, r.look, { cls: r.cls, aura: r.aura }), mode: 'ladder', lv: Object.fromEntries(Object.keys(SP).map(k => [k, lv])) });
    const res = _nm.call(this, o2);
    try { M.ladder = r; M.ladderI = i; M.rival = r; M.foe.pool = r.hand.slice(); M.foe.up = new Set(r.ups.slice(0, 2 + Math.floor(i / 4)).filter(u => SP[u.split('.')[0]])); M.foeRank = rankOf(PR.trophies); M.foeAcct = Math.max(1, PR.lvl + Math.floor(i / 5));
      M.profile = Object.assign({}, M.profile, { n: r.title, fav: Object.fromEntries(r.hand.map((k, j) => [k, 9 - j])) }); if (typeof synergyOf === 'function') M.foeSyn = synergyOf(M.foe.pool); } catch (e) {}
    return res;
  };
  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () {
      const msgs = [];
      try { if (M && M.ladder && M.score.me > M.score.foe) { const r = M.ladder, s = st();
          if (!s.won[r.id]) { s.won[r.id] = Date.now(); PR.gems = (PR.gems || 0) + GEMS; msgs.push(`Ladder: ${r.n} beaten. +${GEMS} gems`);
            const k = rewardOf(r); if (!owned(k)) { PR.chosen = PR.chosen || []; PR.chosen.push(k); msgs.push(`${SP[k].n} unlocked${r.boss ? ' (boss variant)' : ''}`); if (typeof addNote === 'function') { try { addNote('unlock', 'Won ' + SP[k].n + ' on the Ladder'); } catch (e) {} } }
            if (r.cos) { try { if (typeof grantCosmetic === 'function') { grantCosmetic(r.cos.type, r.cos.id); msgs.push('New in your wardrobe: ' + r.cos.n); } } catch (e) {} }
            try { save(); } catch (e) {} } } } catch (e) {}
      const res = _sr.apply(this, arguments);
      try { if (M && M.ladder) { const md = $('rwMode'); if (md) md.textContent = 'The Ladder · rung ' + (M.ladderI + 1) + ' · vs ' + M.ladder.n; let box = $('rwLadder'); if (box) box.remove();
          if (msgs.length) { const at = document.querySelector('#rewards #rwCards') || $('rwBtn'); if (at) at.insertAdjacentHTML('beforebegin', `<div id="rwLadder"><b>Ladder rewards</b>${msgs.map(m => `<span>${m.replace(/^Ladder: /, '')}</span>`).join('')}</div>`); } } else { const box = $('rwLadder'); if (box) box.remove(); } } catch (e) {}
      msgs.forEach((m, j) => setTimeout(() => { try { toast(m); } catch (e) {} }, 900 + j * 1700)); return res; }; }

  /* ---------------- screens ---------------- */
  const icons = hand => hand.map(k => `<img src="${ICON[k]}" title="${SP[k].n}">`).join('');
  const upName = u => { const [k, id] = u.split('.'), o = (UPG[k] || []).find(q => q.id === id); return o ? o.n : id; };
  window.openLadder = function (detail) {
    const s = st(), n = L.filter((r, i) => beaten(i)).length, first = !PR.ladderSeen;
    if (detail !== undefined && L[detail]) { const i = detail, r = L[i], open = openAt(i) || beaten(i), k = rewardOf(r), shown = r.ups.slice(0, 2 + Math.floor(i / 4));
      $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">${r.n}</div><div class="ssub" style="margin:0">${r.title} · ${r.cls === 'sorc' ? 'Sorcerer' : 'Wizard'}${r.boss ? ' · <b style="color:#ffd75e">Boss</b>' : ''}</div>
        <div class="lq">“${r.line}”</div>
        <div class="lbox"><div class="trh">Their hand</div>${r.hand.map(a => `<div class="lab"><img src="${ICON[a]}"><span><b>${SP[a].n}</b><small>${shown.filter(u => u.startsWith(a + '.')).map(upName).join(', ') || SP[a].tag || ''}</small></span></div>`).join('')}</div>
        <div class="lbox ltip"><div class="trh">How to think about it</div><p>${r.tip}</p></div>
        <div class="lbox"><div class="trh">First win pays</div><div class="lrws"><span><i class="ci" style="display:inline-grid;width:16px;height:16px;vertical-align:-3px">${SVG.gem}</i> ${GEMS} gems</span><span><img src="${ICON[k]}"> ${SP[k].n}${owned(k) && !beaten(i) ? ' (you own it)' : ''}</span>${r.cos ? `<span>✦ ${r.cos.n}</span>` : ''}</div></div>
        ${beaten(i) ? '<div class="ssub" style="margin:6px 0 0;color:#7dffa8">Beaten. You can fight again for practice.</div>' : ''}
        <button class="upbtn" ${open ? '' : 'disabled'} onclick="closeSheet();startMatch({ladder:${i}})">${open ? (beaten(i) ? 'Fight again' : 'Fight') : (i > 0 && !beaten(i - 1) ? 'Beat ' + L[i - 1].n + ' first' : 'Needs ' + gateOf(i) + ' trophies')}</button>
        <button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050);margin-top:6px" onclick="openLadder()">Back to the Ladder</button>`;
      $('sheet').classList.add('on'); return; }
    PR.ladderSeen = 1; try { save(); } catch (e) {}
    const rows = L.map((r, i) => { const done = beaten(i), open = openAt(i), k = rewardOf(r);
      return `<button class="lrow ${done ? 'done' : open ? 'open' : 'lock'} ${r.boss ? 'boss' : ''}" onclick="openLadder(${i})"><span class="lno">${done ? '✓' : i + 1}</span><span class="lmid"><b>${r.n}</b><small>${r.title}</small><span class="lhand">${icons(r.hand)}</span></span><span class="lrt">${done ? '<em class="ok">Beaten</em>' : open ? '<em class="go">Fight</em>' : `<em>${i > 0 && !beaten(i - 1) ? 'Locked' : gateOf(i) + ' 🏆'}</em>`}<small><img src="${ICON[k]}">+${GEMS} 💎</small></span></button>`; }).join('');
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">The Ladder</div><div class="ssub" style="margin:0">${n} of ${L.length} beaten. Each first win pays ${GEMS} gems and the rival's ability.</div>
      ${first ? `<div class="lintro"><b>Hoot</b>These rivals do not change. Tap one to study their <em>hand</em>, then build a <em>Battle Hand</em> that answers it. Beat them in order. A new rung opens every ${GATE} trophies. Every fifth is a <em>boss</em> with an ability you can win nowhere else.</div>` : ''}
      <div class="llist">${rows}</div>`;
    $('sheet').classList.add('on');
    setTimeout(() => { try { const el = document.querySelector('#sheetP .lrow.open') || document.querySelector('#sheetP .lrow.lock'); if (el && !first) el.scrollIntoView({ block: 'center' }); } catch (e) {} }, 60);
  };
  // home button, and a banner on the Rank Road
  const stage = document.querySelector('#home .stage'); if (stage && !$('ldBtn')) stage.insertAdjacentHTML('beforeend', `<button class="chbtn" id="ldBtn" onclick="openLadder()">Ladder<i></i></button>`);
  const ldDot = () => { const b = $('ldBtn'); if (!b) return; const n = L.filter((r, i) => beaten(i)).length, next = L.findIndex((r, i) => !beaten(i)); b.querySelector('i').textContent = n + '/' + L.length; b.classList.toggle('ready', next >= 0 && openAt(next)); };
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { ldDot(); } catch (e) {} return r; }; }
  if (typeof renderRoad === 'function') { const _rr = renderRoad; window.renderRoad = renderRoad = function () { const r = _rr.apply(this, arguments);
      try { const road = $('road'); if (road && !$('ldBanner')) { const next = L.findIndex((q, i) => !beaten(i)), nx = next >= 0 ? L[next] : null; road.insertAdjacentHTML('beforebegin', `<button id="ldBanner" onclick="openLadder()"><b>The Ladder</b><small></small><em>Open</em></button>`); }
        const bn = $('ldBanner'); if (bn) { const next = L.findIndex((q, i) => !beaten(i)); bn.querySelector('small').textContent = next < 0 ? 'All twenty rivals beaten.' : openAt(next) ? `Next: ${L[next].n}, ${L[next].title}` : `Next rival at ${gateOf(next)} trophies: ${L[next].n}`; } } catch (e) {}
      return r; }; }
  // variants in the spell book: shown, but won on the Ladder instead of bought with a token
  if (typeof openLocked === 'function') { const _ol = openLocked; window.openLocked = openLocked = function (k) { const v = VARIANTS[k]; if (!v) return _ol.apply(this, arguments);
      const boss = L[v.boss], stt = STATS[k];
      $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="shd"><img src="${ICON[k]}" style="width:64px;height:64px"><div><div class="sh" style="text-align:left;margin:0">${SP[k].n}</div><div class="ssub" style="margin:2px 0 0;text-align:left">Boss variant of ${SP[v.base].n} · ${SP[k].t}s cast</div></div></div>
        <p class="lvd">${SP[k].d}</p><div class="lbox"><div class="trh">Its own upgrade</div>${v.ups.map(u => `<div class="lab"><span><b>${u.n}</b><small>${u.d}</small></span></div>`).join('')}</div>
        <div class="lbox ltip"><div class="trh">How to get it</div><p>Tokens cannot buy this. Beat <b>${boss ? boss.n : 'its boss'}</b>${boss ? ', ' + boss.title + ',' : ''} on the Ladder (rung ${v.boss + 1}).</p></div>
        <button class="upbtn" onclick="openLadder(${v.boss})">Show me the boss</button>`;
      $('sheet').classList.add('on'); }; }
  if (typeof renderSpells === 'function') { const _rs = renderSpells; window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments);
      try { document.querySelectorAll('#sgrid .scard.locked').forEach(el => { const m = /openSpell\('([a-z0-9]+)'\)/.exec(el.getAttribute('onclick') || ''); if (m && VARIANTS[m[1]]) { const u = el.querySelector('.unl'); if (u) { u.className = 'unl ldr'; u.textContent = 'Ladder boss'; } } }); } catch (e) {} return r; }; }

  const css = document.createElement('style');
  css.textContent = `#ldBtn{top:200px!important;background:linear-gradient(#ff8a5e,#c9361a)!important;color:#fff!important}#ldBtn i{font:11px 'Lilita One';font-style:normal;background:#0006;border-radius:7px;padding:0 5px;margin-left:2px}#ldBtn.ready{box-shadow:0 3px 0 #000,0 0 0 2px #ffd75e}
  #ldBanner{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 10px;padding:9px 12px;border:2px solid #000;border-radius:14px;background:linear-gradient(#ff8a5e,#b02a14);color:#fff;box-shadow:0 3px 0 #000;cursor:pointer;text-align:left}
  #ldBanner b{font:17px 'Lilita One';letter-spacing:.4px}#ldBanner small{flex:1;font:800 11.5px Nunito;opacity:.95}#ldBanner em{font:13px 'Lilita One';font-style:normal;background:#0005;border-radius:9px;padding:3px 9px}
  .llist{display:flex;flex-direction:column;gap:6px;margin-top:8px}.lrow{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:#1a1236;border:2px solid #000;border-radius:13px;padding:7px 9px;color:#f1eaff;box-shadow:0 2px 0 #000;cursor:pointer}
  .lrow.boss{background:linear-gradient(#3a1f1a,#241028);border-color:#ffd75e}.lrow.lock{opacity:.62}.lrow.done{background:#12281c}
  .lno{flex:0 0 30px;height:30px;border-radius:50%;display:grid;place-items:center;font:15px 'Lilita One';background:#2b2050;border:2px solid #000}.lrow.done .lno{background:#2fd08a;color:#062a16}.lrow.boss .lno{background:#ffd75e;color:#2a1600}
  .lmid{flex:1;min-width:0;display:flex;flex-direction:column}.lmid b{font:14.5px 'Lilita One';letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lmid small{font:800 10.5px Nunito;color:#b9a6ee}
  .lhand{display:flex;gap:3px;margin-top:3px}.lhand img{width:24px;height:24px}.lrt{display:flex;flex-direction:column;align-items:flex-end;gap:3px}.lrt em{font:12px 'Lilita One';font-style:normal;border-radius:8px;padding:2px 8px;background:#0006;color:#cdbbff;white-space:nowrap}
  .lrt em.go{background:linear-gradient(#ffe27a,#f0a830);color:#2a1600}.lrt em.ok{background:#2fd08a;color:#062a16}.lrt small{display:flex;align-items:center;gap:3px;font:800 10.5px Nunito;color:#e8e0ff}.lrt small img{width:18px;height:18px}
  .lintro{margin-top:8px;background:#fff8e6;color:#2a1a40;border:3px solid #000;border-radius:14px;padding:9px 11px;font:800 13px Nunito;line-height:1.3;box-shadow:0 3px 0 #000}.lintro b{display:block;font:15px 'Lilita One';color:#7a3fd6}.lintro em{font-style:normal;color:#c2410c}
  .lq{margin:8px 0 2px;text-align:center;font:italic 800 15px Nunito;color:#ffe9a8}.lbox{margin-top:8px;background:#0006;border:2px solid #000;border-radius:12px;padding:8px 10px}.lbox p{margin:2px 0 0;font:700 13px Nunito;line-height:1.35;color:#e8e0ff}
  .lbox.ltip{border-color:#7a5cff}.lab{display:flex;align-items:center;gap:8px;margin:5px 0}.lab img{width:34px;height:34px}.lab b{display:block;font:14px 'Lilita One'}.lab small{display:block;font:700 11px Nunito;color:#b9a6ee;line-height:1.25}
  .lrws{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.lrws span{display:flex;align-items:center;gap:4px;font:800 12px Nunito;background:#1a1236;border:1.5px solid #000;border-radius:9px;padding:3px 8px}.lrws img{width:20px;height:20px}
  #rwLadder{margin:8px 0;background:linear-gradient(#3a1f1a,#241028);border:2px solid #ffd75e;border-radius:13px;padding:8px 11px;display:flex;flex-direction:column;gap:3px}#rwLadder b{font:14px 'Lilita One';color:#ffd75e;letter-spacing:.4px}#rwLadder span{font:800 12.5px Nunito;color:#fff}
  .shd{display:flex;gap:10px;align-items:center}.lvd{font:700 13.5px Nunito;line-height:1.35;color:#e8e0ff;margin:8px 0 0}.scard .unl.ldr{background:linear-gradient(#ff8a5e,#c9361a);color:#fff;font:10px 'Lilita One';border:1.5px solid #000;border-radius:8px;padding:2px 6px}`;
  document.head.appendChild(css);
  try { ldDot(); } catch (e) {}
})();
