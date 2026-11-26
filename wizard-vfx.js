/* =====================================================================
   WIZARDS VS SORCERERS: shared VFX layer
   Loads after wizard-techniques.js.
   1. Particles: glow particles are soft sprites with motion streaks; smoke is soft-edged.
   2. Ink rings: tapered brush-stroke arcs over a soft halo.
   3. The wizard's hex: a layered magic circle that charges with the cast, grows with the
      card's upgrades and tier, and fires outward when the spell goes off.
   4. Hit pops: every hit that lands throws sparks and a comic flash.
   5. Zombies drop an arm when they fall below half health.
   ===================================================================== */
(function () {
  const TAU = 6.2832, cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex6 = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : (typeof c === 'string' && /^#[0-9a-f]{3}$/i.test(c) ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : '#ffffff');

  /* ---------------- 1. particles ---------------- */
  const SPR = new Map();
  function sprite(color, soft) {
    const key = (soft ? 's' : 'g') + color; let c = SPR.get(key); if (c) return c;
    if (SPR.size > 420) SPR.clear();
    c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    if (soft) { gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(.55, 'rgba(0,0,0,.8)'); gr.addColorStop(.85, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.22, 'rgba(0,0,0,.95)'); gr.addColorStop(.5, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, 48, 48);
    if (!soft) { g.globalCompositeOperation = 'source-over'; const w = g.createRadialGradient(24, 24, 0, 24, 24, 9); w.addColorStop(0, 'rgba(255,255,255,.9)'); w.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = w; g.fillRect(0, 0, 48, 48); }
    SPR.set(key, c); return c;
  }
  window.drawPartsFX = function (x) {
    x.lineCap = 'round';
    for (const p of parts) {
      const f = p.life / p.max, a = Math.min(1, f * 1.5) * (p.fade || 1); if (a <= 0) continue;
      const s = Math.max(.5, p.grow ? p.size * (1 + (1 - f) * p.grow) : p.shrink ? p.size * f : p.size);
      if (p.glow) {
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = a;
        const v = Math.hypot(p.vx, p.vy);
        if (v > 110 && s < 7) { const k = Math.min(.05, 18 / v); x.strokeStyle = p.color; x.lineWidth = Math.max(1, s * .85); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - p.vx * k, p.y - p.vy * k); x.stroke(); }
        const R = s * 2.3; x.drawImage(sprite(p.color, 0), p.x - R, p.y - R, R * 2, R * 2);
      } else if (p.grow) {                                   // smoke, dust, steam: soft-edged puffs
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = a; const R = s * 1.25; x.drawImage(sprite(p.color, 1), p.x - R, p.y - R, R * 2, R * 2);
      } else {                                               // debris, droplets, chips: crisp
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = a; x.fillStyle = p.color; x.beginPath(); x.arc(p.x, p.y, s, 0, 7); x.fill();
      }
    }
  };

  /* ---------------- 2. ink rings ---------------- */
  window.drawRings = drawRings = function (x) {
    for (const r of rings) {
      if (r.t < 0) continue; const f = r.t / r.life, e = 1 - Math.pow(1 - f, 3), rad = r.r0 + (r.r1 - r.r0) * e, th = (1 - f) * 7.5 + 1, al = Math.min(1, (1 - f) * 1.6);
      x.save(); x.translate(r.x, r.y); x.scale(1, r.sq);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = al * .3; x.strokeStyle = hex6(r.c); x.lineWidth = th * 2.4; x.beginPath(); x.arc(0, 0, rad, 0, 7); x.stroke();
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = al; x.lineJoin = 'round';
      for (let s = 0; s < 5; s++) {                         // five brush strokes, thick in the middle and tapering to points
        const len = .72 + .3 * Math.sin(r.seed * 7 + s * 2.3), a0 = r.seed + s * 1.2566 + f * .6, N = 9;
        x.beginPath();
        for (let i = 0; i <= N; i++) { const u = i / N, a = a0 + u * len, h = th / 2 * Math.pow(Math.min(1, Math.sin(Math.PI * u) * 2.4), .7) + .15; x.lineTo(Math.cos(a) * (rad + h), Math.sin(a) * (rad + h)); }
        for (let i = N; i >= 0; i--) { const u = i / N, a = a0 + u * len, h = th / 2 * Math.pow(Math.min(1, Math.sin(Math.PI * u) * 2.4), .7) + .15; x.lineTo(Math.cos(a) * (rad - h), Math.sin(a) * (rad - h)); }
        x.closePath(); x.fillStyle = r.c; x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1.5; x.stroke();
        if (th > 3) { x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = Math.max(.8, th * .16); x.beginPath(); x.arc(0, 0, rad + th * .12, a0 + len * .25, a0 + len * .75); x.stroke(); }
      }
      x.restore();
    }
  };

  /* ---------------- 3. the hex ---------------- */
  // rune glyphs: strokes inside a box about 1.6 wide and 2.8 tall
  const GLY = [
    [[[0, -1.4], [0, 1.4]], [[0, -.2], [.9, -1.1]]], [[[-.7, -1.4], [-.7, 1.4]], [[-.7, -1.4], [.7, -.5], [-.7, .3]]], [[[-.8, 1.4], [0, -1.4], [.8, 1.4]]],
    [[[0, -1.4], [0, 1.4]], [[-.8, -.6], [.8, .6]]], [[[-.7, -1.4], [.7, 0], [-.7, 1.4]]], [[[0, -1.4], [0, 1.4]], [[-.8, -.6], [0, -1.4], [.8, -.6]]],
    [[[-.7, -1.4], [.7, 1.4]], [[.7, -1.4], [-.7, 1.4]]], [[[-.7, 1.4], [-.7, -1.4], [.7, -.6], [-.7, .2], [.7, 1.4]]], [[[0, -1.4], [.8, 0], [0, 1.4], [-.8, 0], [0, -1.4]]],
    [[[-.7, -1.4], [-.7, 1.4]], [[.7, -1.4], [.7, 1.4]], [[-.7, -.4], [.7, .4]]], [[[-.8, -1.4], [.8, -1.4]], [[0, -1.4], [0, 1.4]], [[-.8, 1.4], [.8, 1.4]]], [[[-.8, -1.4], [0, 0], [-.8, 1.4]], [[.2, -1.4], [.2, 1.4]]],
  ];
  function glyphPath(x, i, s) { x.beginPath(); for (const st of GLY[i % GLY.length]) st.forEach((p, j) => j ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s)); }
  /* o: { R, t, f (0..1 charge), l, m, ups, tier, alpha, sq (ground squash), hot (0..1 white flash) } */
  function hexAt(x, cx, cy, o) {
    const R = o.R || 36, t = o.t || 0, f = cl(o.f || 0, 0, 1), l = o.l || '#ffffff', m = o.m || '#a36bff', ups = o.ups || 0, tier = o.tier || 1, A = o.alpha === undefined ? 1 : o.alpha, sq = o.sq || .42, hot = o.hot || 0;
    if (A <= .01) return;
    const RO = ups >= 1 ? R * 1.32 : R, u = R / 36;                        // outermost radius; u scales line weights with size
    x.save(); x.translate(cx, cy); x.scale(1, sq); x.lineCap = 'round'; x.lineJoin = 'round';
    // a dark bed so the circle reads on pale floors as well as dark ones
    const bed = x.createRadialGradient(0, 0, R * .15, 0, 0, RO * 1.18); bed.addColorStop(0, `rgba(8,3,20,${.36 * A})`); bed.addColorStop(.82, `rgba(8,3,20,${.22 * A})`); bed.addColorStop(1, 'rgba(8,3,20,0)');
    x.fillStyle = bed; x.beginPath(); x.arc(0, 0, RO * 1.18, 0, TAU); x.fill();
    // every line is laid down three times: ink, colour, then a soft additive glow
    const pass = (build, lw, col, glow) => {
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = A * .6; x.strokeStyle = '#06020f'; x.lineWidth = (lw + 2.2) * u; build(); x.stroke();
      x.globalAlpha = A; x.strokeStyle = col; x.lineWidth = lw * u; build(); x.stroke();
      if (glow) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = A * glow; x.lineWidth = lw * 3.4 * u; build(); x.stroke(); x.globalCompositeOperation = 'source-over'; x.globalAlpha = A; }
    };
    const circ = r => () => { x.beginPath(); x.arc(0, 0, r, 0, TAU); };
    const node = (px, py, r, lit, col) => { x.globalCompositeOperation = 'source-over'; x.globalAlpha = A; x.fillStyle = '#06020f'; x.beginPath(); x.arc(px, py, (r + 1.3) * u, 0, TAU); x.fill(); x.fillStyle = lit ? '#ffffff' : col; x.globalAlpha = A * (lit ? 1 : .55); x.beginPath(); x.arc(px, py, r * u, 0, TAU); x.fill();
      if (lit) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(px, py, 0, px, py, r * 4.2 * u); g.addColorStop(0, l); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = A * .9; x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 4.2 * u, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; } };

    // main ring, its inner companion, and a ring of measuring ticks between them
    { const tn = x.createRadialGradient(0, 0, R * .2, 0, 0, R); tn.addColorStop(0, 'rgba(0,0,0,0)'); tn.addColorStop(1, m); x.globalCompositeOperation = 'lighter'; x.globalAlpha = A * (.1 + f * .12); x.fillStyle = tn; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; }
    pass(circ(R), 2.4, m, .2 + f * .22); pass(circ(R * .87), 1, l, 0);
    x.globalAlpha = A * .85; x.strokeStyle = l; x.lineWidth = 1 * u; x.beginPath();
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU + t * .22, r0 = R * (i % 3 ? .925 : .895); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); x.lineTo(Math.cos(a) * R * .975, Math.sin(a) * R * .975); } x.stroke();
    // hexagram: two triangles turning together, with a circle threaded through their crossings
    const rot = t * .42, rh = R * .8, tri = a0 => () => { x.beginPath(); for (let i = 0; i < 3; i++) { const a = a0 + i * 2.0944; x.lineTo(Math.cos(a) * rh, Math.sin(a) * rh); } x.closePath(); };
    pass(tri(rot), 2, m, .2); pass(tri(rot + Math.PI), 2, l, .12); pass(circ(rh * .5), 1.1, l, 0);
    // upgrades add elements, from the inside out
    if (ups >= 2) { const sqr = () => { x.beginPath(); for (let i = 0; i < 4; i++) { const a = -t * .8 + i * 1.5708; x.lineTo(Math.cos(a) * rh * .36, Math.sin(a) * rh * .36); } x.closePath(); }; pass(sqr, 1.3, l, .15); }
    if (ups >= 5) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 0, 0, 0, 0, rh * .5); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, l); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = A * (.35 + .35 * f); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rh * .5, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; }
    if (ups >= 1) {                                                         // an outer band of runes, turning the other way
      pass(circ(RO), 1.3, m, .12);
      const n = 14, gr = R * 1.16;
      for (let i = 0; i < n; i++) { const a = -t * .3 + i / n * TAU; x.save(); x.translate(Math.cos(a) * gr, Math.sin(a) * gr); x.rotate(a + 1.5708);
        x.globalAlpha = A * .6; x.strokeStyle = '#06020f'; x.lineWidth = 2.6 * u; glyphPath(x, i * 5 + 1, 1.9 * u); x.stroke(); x.globalAlpha = A; x.strokeStyle = l; x.lineWidth = 1.15 * u; glyphPath(x, i * 5 + 1, 1.9 * u); x.stroke(); x.restore(); }
    }
    if (ups >= 4) for (let i = 0; i < 8; i++) { const a = t * .18 + i * .7854, px = Math.cos(a) * RO * 1.04, py = Math.sin(a) * RO * 1.04; pass(() => { x.beginPath(); x.arc(px, py, R * .15, a - 1.25, a + 1.25); }, 1.4, m, .14); }   // petals
    // tiers add dashed rings
    if (tier >= 2) { x.save(); x.setLineDash([5 * u, 6 * u]); x.lineDashOffset = t * 14; x.globalAlpha = A * .8; x.strokeStyle = l; x.lineWidth = 1.3 * u; circ(R * .66)(); x.stroke(); x.restore(); }
    if (tier >= 3) { x.save(); x.setLineDash([2 * u, 7 * u]); x.lineDashOffset = -t * 18; x.globalAlpha = A * .9; x.strokeStyle = '#ffffff'; x.lineWidth = 1.6 * u; circ(RO * 1.13)(); x.stroke(); x.restore(); }
    // the six points of the star light one by one as the cast charges
    for (let i = 0; i < 6; i++) { const a = rot + i * 1.0472 - 1.5708; node(Math.cos(a) * rh, Math.sin(a) * rh, ups >= 3 ? 2.9 : 2.3, f >= (i + 1) / 6 - .01, m); }
    if (ups >= 3) for (let i = 0; i < 3; i++) {                              // orbiters with short tails
      const a = t * 1.5 + i * 2.0944; x.globalCompositeOperation = 'lighter'; x.globalAlpha = A * .8; x.strokeStyle = l; x.lineWidth = 2.2 * u; x.beginPath(); x.arc(0, 0, R, a - .55, a); x.stroke(); x.globalCompositeOperation = 'source-over'; node(Math.cos(a) * R, Math.sin(a) * R, 2.2, true, l); }
    // charge: a bright arc sweeps round the main ring with a spark at its head
    if (f > .01) { const a1 = -1.5708 + f * TAU; pass(() => { x.beginPath(); x.arc(0, 0, R, -1.5708, a1); }, 2.6, '#ffffff', .0); x.globalCompositeOperation = 'lighter'; x.globalAlpha = A * .5; x.strokeStyle = l; x.lineWidth = 6 * u; x.beginPath(); x.arc(0, 0, R, -1.5708, a1); x.stroke(); x.globalCompositeOperation = 'source-over'; x.globalAlpha = A; node(Math.cos(a1) * R, Math.sin(a1) * R, 2.6, true, l); }
    if (hot > 0) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 0, 0, 0, 0, RO); g.addColorStop(0, `rgba(255,255,255,${.55 * hot * A})`); g.addColorStop(.7, `rgba(255,255,255,${.18 * hot * A})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(0, 0, RO, 0, TAU); x.fill(); }
    x.restore();
  }
  window.hexAt = hexAt;
  const upsOf = (w, k) => (UPG[k] || []).filter(q => U(w, k, q.id)).length;
  const isSorc = w => ((w.look && w.look.cls) || w.cls) === 'sorc';
  let vfx = [];
  /* ground layer: every wizard's hex, then the bursts of hexes that just fired */
  window.drawHexLayer = function (x) {
    for (const w of ents) { if (w.dead || isSorc(w)) continue; const k = w.book[w.i]; if (!k || !SP[k]) continue;
      const f = cl(w.p / (typeof castT === 'function' ? castT(w, k) : SP[k].t), 0, 1), c = COL[SP[k].el] || ['#fff', '#a36bff'], ups = upsOf(w, k), tier = tierOf(w, k);
      hexAt(x, w.x, w.y, { R: 34, t: w.t, f, l: c[0], m: c[1], ups, tier, alpha: .55 + .45 * f });
      if (f > .35 && Math.random() < f * .22 && !ended) { const a = rnd(0, TAU), R = 34 * (ups >= 1 ? 1.3 : 1); P({ x: w.x + Math.cos(a) * R, y: w.y + Math.sin(a) * R * .42, vx: rnd(-6, 6), vy: -rnd(22, 52), color: Math.random() < .3 ? '#ffffff' : c[0], size: rnd(1.3, 2.4), life: rnd(.4, .85), drag: .96 }); } }
    for (const f of vfx) if (f.k === 'hexb') { const k = Math.min(1, Math.max(0, f.t / f.life)), e = 1 - Math.pow(1 - k, 3);
      hexAt(x, f.x, f.y, { R: 34 * (1 + e * .5), t: f.t0 + k * 2.4, f: 1, l: f.l, m: f.m, ups: f.ups, tier: f.tier, alpha: Math.pow(1 - k, 1.4), hot: Math.max(0, 1 - k * 2.2) });
      x.save(); x.translate(f.x, f.y); x.scale(1, .42); x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#ffffff'; x.globalAlpha = (1 - k) * .9; x.lineWidth = 5 * (1 - k) + .6; x.beginPath(); x.arc(0, 0, 34 * (1 + e * 1.7), 0, TAU); x.stroke();
      x.strokeStyle = f.l; x.globalAlpha = (1 - k) * .6; x.lineWidth = 9 * (1 - k) + 1; x.beginPath(); x.arc(0, 0, 34 * (1 + e * 1.25), 0, TAU); x.stroke(); x.restore(); }
  };
  /* the hex fires: called when a wizard's spell goes off */
  window.hexBurst = function (w, k, l, m, tier, ups) {
    vfx.push({ k: 'hexb', x: w.x, y: w.y, l, m, tier, ups, t: 0, t0: w.t, life: .5 + ups * .03 });
    const R = 34 * (ups >= 1 ? 1.3 : 1), n = 10 + ups * 3 + tier * 2;
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(-.2, .2); P({ x: w.x + Math.cos(a) * R, y: w.y + Math.sin(a) * R * .42, vx: Math.cos(a) * rnd(30, 90), vy: Math.sin(a) * rnd(12, 38) - rnd(50, 150), color: i % 3 ? l : '#ffffff', size: rnd(1.6, 3), life: rnd(.35, .7), drag: .92, grav: 120 }); }
    if (typeof lights !== 'undefined') lights.push({ x: w.x, y: w.y, r: 70 + tier * 12, c: hex6(m), t: 0, life: .35 });
  };

  /* ---------------- 4. hit pops ---------------- */
  function impact(w, amt, kx, ky, col, src) {
    if (src === 'rush' || amt < 1.5) return; const c = hex6(col), kb = Math.hypot(kx, ky), dir = kb > 40 ? Math.atan2(ky, kx) : null, n = cl(3 + amt / 2.5 | 0, 4, 14), y0 = w.y - 42 * HS;
    for (let i = 0; i < n; i++) { const a = dir === null ? rnd(-Math.PI, 0) : dir + rnd(-.75, .75), v = rnd(130, 330) * (1 + amt / 40); P({ x: w.x + rnd(-5, 5), y: y0 + rnd(-8, 8), vx: Math.cos(a) * v, vy: Math.sin(a) * v, color: i % 3 ? c : '#ffffff', size: rnd(1.5, 2.8), life: rnd(.16, .38), drag: .87 }); }
    vfx.push({ k: 'pop', x: w.x + rnd(-7, 7), y: y0 + rnd(-9, 9), s: cl(.55 + amt / 15, .6, 1.9), c, a: rnd(0, 1.57), t: 0, life: .17 });
    if (amt >= 14 && typeof lights !== 'undefined') lights.push({ x: w.x, y: w.y, r: 56 + amt, c, t: 0, life: .3 });
  }
  const _dmg = damage;
  window.damage = damage = function (w, d, kx = 0, ky = 0, col = '#fff') {
    const h0 = w ? w.hp : 0, src = SRC, r = _dmg.apply(this, arguments);
    try { if (w && w.hp < h0 - .5) impact(w, h0 - w.hp, kx, ky, col, src); } catch (e) {}
    return r;
  };

  /* ---------------- 5. zombies drop an arm under half health ---------------- */
  let limbs = [];
  function dropLimb(z) {
    const f = z.o && z.o.foe, face = f && f.x > z.x ? 1 : -1, robe = (z.o && z.o.robe) || ['#7a6a9a', '#4a3f6a', '#2a2040'];
    const la = rnd(0, 6.283), lsp = rnd(35, 80);   /* (1.0.33.14) the arm flies off any way, not always the same */
    limbs.push({ x: z.x + face * 8, y: z.y, h: 20 * SC, vx: Math.cos(la) * lsp, vy: Math.sin(la) * lsp * .6, vh: rnd(110, 170), rot: rnd(-.5, .5), vr: rnd(-9, 9), face, skin: z.revived ? '#9ab4ac' : '#93d46c', skinD: z.revived ? '#62807a' : '#5f9c48', sleeve: robe[1], t: 0, land: 0, s: rnd(0, 9) });
    if (limbs.length > 26) limbs.shift();
    for (let i = 0; i < 9; i++) P({ x: z.x + face * 6 + rnd(-3, 3), y: z.y - 18 * SC + rnd(-3, 3), vx: Math.cos(la) * rnd(10, 90) + rnd(-30, 30), vy: rnd(-120, -20), color: ['#5a8a3a', '#3a5a24', '#7a1a1a'][i % 3], size: rnd(2, 3.6), life: rnd(.35, .7), grav: 420, glow: false });
    try { sfx('hit', { x: z.x, vol: .45 }); } catch (e) {}
  }
  const _hz = hurtZ;
  window.hurtZ = hurtZ = function (z, d, by, kind) {
    const r = _hz.apply(this, arguments);
    try { if (z && !z.beast && !z.limb && z.hp > 0 && z.rise >= 1 && z.hp < (z.mx || 1) * .5) { z.limb = 1; dropLimb(z); } } catch (e) {}
    return r;
  };
  function limbArt(x, L) {   // a severed arm: torn sleeve, forearm, clawed hand; drawn along +x from the torn end
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = '#000'; x.lineWidth = 6.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(13, 0); x.stroke(); x.strokeStyle = L.skin; x.lineWidth = 3.6; x.stroke();
    x.strokeStyle = '#000'; x.lineWidth = 6.8; x.beginPath(); x.moveTo(-1, 0); x.lineTo(4.4, 0); x.stroke(); x.strokeStyle = L.sleeve; x.lineWidth = 4.3; x.stroke();
    x.fillStyle = L.skin; x.strokeStyle = '#000'; x.lineWidth = 1.5; x.beginPath(); x.arc(14.4, 0, 2.8, 0, 7); x.fill(); x.stroke();
    x.lineWidth = 1.3; x.beginPath(); for (const cy of [-2, 0, 2]) { x.moveTo(16.4, cy); x.lineTo(19.6, cy * 1.5); } x.stroke();
    x.fillStyle = '#6a1422'; x.strokeStyle = '#000'; x.lineWidth = 1.1; x.beginPath(); x.arc(-1.6, 0, 2.3, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#efe6d0'; x.beginPath(); x.arc(-2.3, 0, 1, 0, 7); x.fill();
  }
  function drawLimbs(x, air) {
    for (const L of limbs) { if (!!L.land === air) continue; x.save();
      if (L.land) { x.fillStyle = 'rgba(60,10,16,.5)'; x.beginPath(); x.ellipse(L.x - L.face * 2, L.y + 1, 6.5, 2.6, 0, 0, 7); x.fill(); }
      else { x.fillStyle = 'rgba(8,4,18,.3)'; x.beginPath(); x.ellipse(L.x, L.y + 1, 7, 2.6, 0, 0, 7); x.fill(); }
      x.translate(L.x, L.y - L.h); x.scale(SC * L.face, SC * (L.land ? .62 : 1)); x.rotate(L.rot); limbArt(x, L); x.restore(); }
  }

  /* ---------------- 6. reworked weak effects: Storm Cloud, Fly Swarm, Grounding Totem ---------------- */
  // Storm Cloud: a heaped thunderhead with a dark belly, slanted rain with splashes, and lightning flickering inside
  window.drawStormCloud = function (x, c, cy) {
    const sc = c.big ? 1.7 : 1.3, t = T + c.x * .01, fl = hashT(Math.floor(t * 9) + c.x) < .14;
    x.fillStyle = 'rgba(12,12,30,.3)'; x.beginPath(); x.ellipse(c.x, c.y, 34 * sc, 10 * sc, 0, 0, 7); x.fill();
    // rain
    x.lineCap = 'round'; for (let i = 0; i < 16; i++) { const ph = (t * 2.6 + i * .173) % 1, rx = c.x + (hashT(i * 3.7) - .5) * 58 * sc - ph * 10, y0 = cy + 12 * sc, y1 = c.y - 4, ry = y0 + (y1 - y0) * ph;
      x.strokeStyle = `rgba(190,215,255,${.75 * (1 - ph * .4)})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 2.6, ry + 9); x.stroke();
      if (ph > .9) { x.strokeStyle = 'rgba(210,230,255,.8)'; x.lineWidth = 1.1; x.beginPath(); x.ellipse(rx - 3, y1 + 2, (ph - .9) * 40, (ph - .9) * 14, 0, 0, 7); x.stroke(); } }
    // the cloud: puffs outlined as one shape
    const puffs = [[-22, 2, 13], [-9, -8, 16], [8, -11, 18], [23, -3, 14], [-14, 7, 11], [4, 8, 13], [19, 8, 10]].map(([px, py, r], i) => [c.x + px * sc + Math.sin(t * 1.3 + i) * 1.2, cy + py * sc + Math.cos(t * 1.1 + i * 2) * .8, r * sc]);
    x.fillStyle = '#05040c'; for (const [px, py, r] of puffs) { x.beginPath(); x.arc(px, py, r + 2.6, 0, 7); x.fill(); }
    for (const [px, py, r] of puffs) { const g = x.createLinearGradient(0, py - r, 0, py + r); g.addColorStop(0, fl ? '#f4f6ff' : '#8f98bb'); g.addColorStop(.55, fl ? '#b9c2e6' : '#5a6286'); g.addColorStop(1, '#2c3150'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(235,240,255,.55)'; x.lineWidth = 1.6; for (const [px, py, r] of puffs.slice(1, 4)) { x.beginPath(); x.arc(px, py, r * .7, 3.6, 5.2); x.stroke(); }
    if (fl) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(c.x, cy, 2, c.x, cy, 46 * sc); g.addColorStop(0, 'rgba(255,250,200,.8)'); g.addColorStop(1, 'rgba(255,230,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(c.x, cy, 46 * sc, 0, 7); x.fill(); x.restore();
      x.lineJoin = 'round'; const bx = c.x + (hashT(Math.floor(t * 9)) - .5) * 30 * sc; for (const [lw, col] of [[5, '#000'], [2.4, '#fff3a0']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(bx, cy + 9 * sc); x.lineTo(bx + 5, cy + 19 * sc); x.lineTo(bx - 2, cy + 20 * sc); x.lineTo(bx + 4, cy + 32 * sc); x.stroke(); } }
  };
  const hashT = n => { const v = Math.sin(n * 91.7) * 43758.5453; return v - Math.floor(v); };
  // Fly Swarm: a buzzing dark haze, bigger flies with beating wings and glowing eyes, and curved flight trails
  if (typeof drawSwarm === 'function') window.drawSwarm = drawSwarm = function (q) {
    const x = ctx, cy = q.y - 34 * HS, eye = (q.o && q.o.robe && q.o.robe[0]) || '#cfe86a'; x.save();
    x.fillStyle = 'rgba(0,0,0,.24)'; x.beginPath(); x.ellipse(q.x, q.y, 20, 6, 0, 0, 7); x.fill();
    const hz = x.createRadialGradient(q.x, cy, 2, q.x, cy, 30); hz.addColorStop(0, 'rgba(26,36,6,.42)'); hz.addColorStop(1, 'rgba(26,36,6,0)'); x.fillStyle = hz; x.beginPath(); x.ellipse(q.x, cy, 30 + Math.sin(q.t * 9) * 2, 20, 0, 0, 7); x.fill();
    x.lineCap = 'round';
    for (const b of q.bugs) { const a = b.a + q.t * b.s, pos = aa => [q.x + Math.cos(aa) * b.r * 1.45, cy + Math.sin(aa * 1.3) * b.r * .8 + b.h], [bx, by] = pos(a), [px, py] = pos(a - .22 * Math.sign(b.s || 1)), [qx, qy] = pos(a - .44 * Math.sign(b.s || 1));
      x.strokeStyle = 'rgba(30,42,8,.5)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(qx, qy); x.quadraticCurveTo(px, py, bx, by); x.stroke();
      const fp = Math.sin(q.t * 70 + b.a * 9); x.fillStyle = 'rgba(255,255,255,.72)'; x.beginPath(); x.ellipse(bx - 2.6, by - 2.6, 3.4, 1.5 + Math.abs(fp) * .9, -.6 + fp * .5, 0, 7); x.ellipse(bx + 2.6, by - 2.6, 3.4, 1.5 + Math.abs(fp) * .9, .6 - fp * .5, 0, 7); x.fill();
      x.fillStyle = '#18220a'; x.strokeStyle = '#000'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(bx, by, 3.3, 2.7, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = eye; x.beginPath(); x.arc(bx + 1.3, by - .7, 1.15, 0, 7); x.fill(); }
    x.restore();
  };
  // Grounding Totem: a carved, banded post with a glowing face, a lightning rod, charge rings and a pulse on the ground
  if (typeof drawTotem === 'function') window.drawTotem = drawTotem = function (q) {
    const x = ctx, fl = q.flash > 0, on = q.charges > 0, t = T + q.x * .03, F = c => fl ? '#ffffff' : c; x.save(); x.translate(q.x, q.y);
    if (on) { x.save(); x.scale(1, .42); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 2; i++) { const ph = (t * .7 + i * .5) % 1; x.strokeStyle = `rgba(255,214,70,${.6 * (1 - ph)})`; x.lineWidth = 2.4 * (1 - ph) + .6; x.beginPath(); x.arc(0, 0, 10 + ph * 30, 0, 7); x.stroke(); } x.restore(); }
    x.scale(SC, SC); x.lineJoin = 'round'; x.fillStyle = 'rgba(0,0,0,.32)'; x.beginPath(); x.ellipse(0, 0, 12, 4, 0, 0, 7); x.fill();
    const block = (y0, y1, w0, col, colD) => { const g = x.createLinearGradient(-w0, 0, w0, 0); g.addColorStop(0, F(col)); g.addColorStop(1, F(colD)); x.fillStyle = g; x.strokeStyle = '#000'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(-w0, y0); x.lineTo(-w0 * .88, y1); x.lineTo(w0 * .88, y1); x.lineTo(w0, y0); x.closePath(); x.fill(); x.stroke(); };
    block(0, -9, 8, '#8a5a2e', '#5a3616'); block(-9, -27, 6.4, '#c07a3a', '#7e4a1e'); block(-27, -44, 5.8, '#a8622a', '#6a3c16');
    // carved face on the middle block: eyes glow while it has charges
    x.fillStyle = on && !fl ? '#fff3a0' : '#2a1608'; for (const ex of [-2.6, 2.6]) { x.beginPath(); x.moveTo(ex - 1.7, -21); x.lineTo(ex + 1.7, -21); x.lineTo(ex, -17.6); x.closePath(); x.fill(); }
    x.strokeStyle = '#2a1608'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(-3, -13.4); x.lineTo(-1, -12); x.lineTo(1, -13.4); x.lineTo(3, -12); x.stroke();
    if (on && !fl) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, -19.5, 0, 0, -19.5, 9); g.addColorStop(0, 'rgba(255,230,110,.75)'); g.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, -19.5, 9, 0, 7); x.fill(); x.restore(); }
    // copper bands and the rod
    x.strokeStyle = '#000'; x.lineWidth = 3.4; for (const by of [-9, -27]) { x.beginPath(); x.moveTo(-7, by); x.lineTo(7, by); x.stroke(); } x.strokeStyle = F('#e8a060'); x.lineWidth = 1.6; for (const by of [-9, -27]) { x.beginPath(); x.moveTo(-6.4, by); x.lineTo(6.4, by); x.stroke(); }
    x.strokeStyle = '#000'; x.lineWidth = 3.6; x.beginPath(); x.moveTo(0, -44); x.lineTo(0, -57); x.stroke(); x.strokeStyle = F('#d9dbe6'); x.lineWidth = 1.7; x.stroke();
    x.fillStyle = F(on ? '#ffe680' : '#8a8a96'); x.strokeStyle = '#000'; x.lineWidth = 1.6; x.beginPath(); x.arc(0, -59, 3.2, 0, 7); x.fill(); x.stroke();
    // one ring of light per charge, drifting up the post
    x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < q.charges; i++) { const yy = -14 - i * 11 + Math.sin(t * 3 + i) * 1.2; x.strokeStyle = 'rgba(255,214,70,.9)'; x.lineWidth = 1.8; x.beginPath(); x.ellipse(0, yy, 9.5, 3, 0, 0, 7); x.stroke(); }
    if (q.glow > 0 || hashT(Math.floor(t * 12)) < .1) { x.strokeStyle = '#fff7b0'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, -60); let lx = 0, ly = -60; for (let i = 0; i < 4; i++) { lx += (hashT(Math.floor(t * 12) + i) - .5) * 14; ly -= 3 + hashT(Math.floor(t * 12) * 2 + i) * 5; x.lineTo(lx, ly); } x.stroke(); }
    x.restore(); x.restore();
  };

  /* ---------------- hooks ---------------- */
  const _sd = startDuel;
  window.startDuel = startDuel = function () { limbs = []; vfx = []; return _sd.apply(this, arguments); };
  const _up = update;
  window.update = update = function (dt) {
    const r = _up(dt);
    for (const f of vfx) f.t += dt; vfx = vfx.filter(f => f.t < f.life);
    for (const L of limbs) { L.t += dt; if (L.land) continue; L.x += L.vx * dt; L.y += L.vy * dt; L.vh -= 620 * dt; L.h += L.vh * dt; L.rot += L.vr * dt;
      if (L.h <= 0) { L.h = 0; if (L.vh < -90 && !L.b) { L.b = 1; L.vh = -L.vh * .32; L.vx *= .5; L.vy *= .5; L.vr *= .4; } else { L.land = 1; L.rot = Math.round(L.rot / Math.PI) * Math.PI + rnd(-.25, .25); try { scar('stain', L.x, L.y, { r: 7, c: '#3a0a12', a: .4, s: .6 }); } catch (e) {} } }
      L.x = cl(L.x, F.x0 + 8, F.x1 - 8); L.y = cl(L.y, F.y0 + 8, F.y1 - 6); }
    if (typeof zombies !== 'undefined' && !ended) for (const z of zombies) if (z.limb && z.hp > 0 && Math.random() < dt * 2.2) P({ x: z.x + rnd(-2, 6), y: z.y - 18 * SC, vx: rnd(-8, 8), vy: rnd(10, 30), color: '#5a1420', size: rnd(1.6, 2.4), life: .45, grav: 300, glow: false });
    return r;
  };
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) { _dd(x); if (x !== ctx) return; drawLimbs(x, false); };
  const _rd = render;
  window.render = render = function () {
    const r = _rd.apply(this, arguments);
    const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLimbs(x, true);
    for (const f of vfx) if (f.k === 'pop') {                               // comic hit flash: a four-point star with a ring
      const k = f.t / f.life, s = f.s * (0.5 + k * 1.1); x.save(); x.translate(f.x, f.y); x.rotate(f.a); x.globalAlpha = 1 - k * k;
      x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * .7854, rr = (i % 2 ? 3.2 : 13) * s; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath();
      x.fillStyle = '#ffffff'; x.fill(); x.strokeStyle = '#000'; x.lineWidth = 1.4; x.stroke();
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = f.c; x.lineWidth = 2.4 * (1 - k) + .4; x.beginPath(); x.arc(0, 0, 9 * s + k * 10, 0, 7); x.stroke(); x.restore(); }
    x.restore(); return r;
  };
  window.VFX_DEBUG = { get limbs() { return limbs; }, get vfx() { return vfx; }, dropLimb, hexAt };
})();
