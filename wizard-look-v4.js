/* "Refined Classic" wizard (pitch): classic shapes, proportions and thick outlines untouched, plus light polish:
   boots under the hem, a soft cel shadow + highlight streak on the robe, eye sparkles, a cheek blush, a hat highlight. ART_STYLE 'v4'. */
function drawWizV4(w, X, ava) {
  const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
  const mv = Math.hypot(w.vx || 0, w.vy || 0), bob = ava ? 0 : Math.abs(Math.sin(w.t * 9)) * Math.min(3, mv / 25) + (w.jump || 0);
  if (!ava) { x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0, 0, 18, 6, 0, 0, 7); x.fill(); }
  if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(w.t * 20) * .06;
  if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(w.t * 12) * .1;
  if (w.dead) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4) }
  if (w.slump) { x.rotate(.12 * w.face); x.translate(0, 3); }
  x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018); x.translate(0, -bob);
  const casting = w.recoil > 0, k = w.book[w.i], [l, m] = COL[SP[k].el], sway = Math.sin(w.t * 5) * 2, fl = w.flash > 0;
  const raise = casting ? -.6 : -.15 - Math.min(.35, (w.p || 0) / SP[k].t * .35);
  // boots peek out under the hem
  { const st = ava ? 0 : Math.sin(w.t * 9) * Math.min(1, mv / 25); [[-7 + st * 2], [6 - st * 2]].forEach(([bx]) => { x.fillStyle = fl ? '#fff' : '#3b2418'; x.strokeStyle = '#000'; x.lineWidth = 2.2; x.beginPath(); x.ellipse(bx + 1, 0, 5, 2.6, 0, 0, 7); x.fill(); x.stroke(); }); }
  // staff (behind body)
  x.save(); x.translate(9, -34); x.rotate(raise); drawStaff(x, w.staffId, l, m, casting, fl); x.restore();
  // hat back layer (hood)
  drawHat(x, w, sway, fl, 'back');
  // robe
  const g = x.createLinearGradient(0, -44, 0, 0); g.addColorStop(0, w.robe[0]); g.addColorStop(1, w.robe[1]);
  x.fillStyle = fl ? '#fff' : g; x.strokeStyle = '#000'; x.lineWidth = 3; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(-8, -40); x.quadraticCurveTo(-14, -18, -17 + sway * .5, 0); x.quadraticCurveTo(-8, 3 + sway * .3, 0, 0); x.quadraticCurveTo(8, 3 - sway * .3, 17 + sway * .5, 0); x.quadraticCurveTo(13, -18, 8, -40); x.closePath(); x.fill(); x.stroke();
  if (!fl) { x.save(); x.beginPath(); x.moveTo(-8, -40); x.quadraticCurveTo(-14, -18, -17 + sway * .5, 0); x.quadraticCurveTo(-8, 3 + sway * .3, 0, 0); x.quadraticCurveTo(8, 3 - sway * .3, 17 + sway * .5, 0); x.quadraticCurveTo(13, -18, 8, -40); x.closePath(); x.clip();
    x.fillStyle = w.robe[2]; x.globalAlpha = .38; x.beginPath(); x.moveTo(3, -42); x.quadraticCurveTo(7, -20, 9, 4); x.lineTo(24, 4); x.lineTo(24, -42); x.closePath(); x.fill();
    x.globalAlpha = .55; x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(-7.5, -37); x.quadraticCurveTo(-12, -20, -14, -6); x.stroke(); x.globalAlpha = 1; x.restore(); }
  x.strokeStyle = w.trim; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-15 + sway * .4, -3); x.quadraticCurveTo(0, 1, 15 + sway * .4, -3); x.stroke();
  x.fillStyle = w.robe[2]; x.fillRect(-11, -22, 22, 4); x.fillStyle = w.trim; x.fillRect(-2, -23, 4, 6);
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'robe');
  // front arm
  x.save(); x.translate(-4, -34); x.rotate(casting ? -1.4 : .3 + Math.sin(w.t * 3) * .1); x.fillStyle = fl ? '#fff' : w.robe[1]; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(0, 8, 4.5, 9, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = w.skin; x.beginPath(); x.arc(0, 17, 3.5, 0, 7); x.fill(); x.stroke();
  if (casting) { x.globalCompositeOperation = 'lighter'; x.fillStyle = l; x.beginPath(); x.arc(0, 19, 7, 0, 7); x.fill(); } x.restore();
  // head
  x.fillStyle = w.skin; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.arc(1, -46, 8, 0, 7); x.fill(); x.stroke();
  if (w.beardStyle === 'long') { x.fillStyle = fl ? '#fff' : w.beardC; x.beginPath(); x.moveTo(-6, -44); x.quadraticCurveTo(0, -8 + sway * .6, 3 + sway * .3, -10); x.quadraticCurveTo(6, -20, 10, -44); x.closePath(); x.fill(); x.stroke(); }
  else if (w.beardStyle === 'short') { x.fillStyle = fl ? '#fff' : w.beardC; x.beginPath(); x.moveTo(-5, -44); x.quadraticCurveTo(2, -22 + sway * .3, 9, -44); x.closePath(); x.fill(); x.stroke(); }
  else { x.strokeStyle = '#000'; x.lineWidth = 1.6; x.beginPath(); x.arc(2.5, -42.5, 2.5, .2, Math.PI - .2); x.stroke(); }
  x.fillStyle = '#000'; x.beginPath(); x.arc(4, -47, 1.7, 0, 7); x.arc(-1, -47, 1.7, 0, 7); x.fill();
  if (!fl) { x.fillStyle = '#fff'; x.beginPath(); x.arc(3.5, -47.6, .6, 0, 7); x.arc(-1.5, -47.6, .6, 0, 7); x.fill(); x.fillStyle = 'rgba(255,110,110,.28)'; x.beginPath(); x.ellipse(7.2, -43.6, 2, 1.2, 0, 0, 7); x.fill(); }
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'head');
  drawHat(x, w, sway, fl, 'front');
  if (!fl && ['pointy', 'witch', 'feathered'].includes(w.hatId || 'pointy')) { x.save(); x.globalAlpha = .45; x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-5, -56); x.quadraticCurveTo(-3, -64, -2.5, -69); x.stroke(); x.restore(); }
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'top');
  x.restore();
}

/* ---------- battle damage on the wizard ----------
   w.wnd = { lvl: 0-3 (rounds the rival has won), cats: ['fire','shock',...] (most damage first), seed } */
function woundRng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
function drawWounds(x, w, layer) {
  const W = w.wnd, R = woundRng(W.seed + (layer === 'robe' ? 0 : layer === 'head' ? 99 : 7)), rr = (a, b) => a + (b - a) * R(), lvl = W.lvl;
  const cats = W.cats.length ? W.cats : ['slash'], main = cats[0], second = cats[1] || main;
  const nMarks = lvl === 1 ? 2 : lvl === 2 ? 4 : 7;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // robe silhouette clip so marks stay on cloth
  const robeClip = () => { x.beginPath(); x.moveTo(-8, -40); x.quadraticCurveTo(-14, -18, -17, 0); x.quadraticCurveTo(-8, 3, 0, 0); x.quadraticCurveTo(8, 3, 17, 0); x.quadraticCurveTo(13, -18, 8, -40); x.closePath(); x.clip(); };
  const pickCat = i => (i % 3 === 2 && lvl >= 2) ? second : main;
  if (layer === 'robe') {
    x.save(); robeClip();
    for (let i = 0; i < nMarks; i++) {
      const c = pickCat(i), mx = rr(-11, 11), my = rr(-36, -4);
      if (c === 'fire') { // scorch blotch with ember rim
        x.fillStyle = 'rgba(20,10,6,.75)'; x.beginPath(); for (let j = 0; j < 8; j++) { const a = j / 8 * 6.283, r = (j % 2 ? 2.5 : 4.5) * (1 + lvl * .25); x.lineTo(mx + Math.cos(a) * r, my + Math.sin(a) * r); } x.fill();
        if (lvl >= 2) { x.strokeStyle = 'rgba(255,122,42,.85)'; x.lineWidth = 1; x.stroke(); }
      } else if (c === 'shock') { // soot + zigzag burn
        x.fillStyle = 'rgba(25,20,15,.55)'; x.beginPath(); x.ellipse(mx, my, 4 + lvl, 3, 0, 0, 7); x.fill();
        x.strokeStyle = 'rgba(255,230,120,.85)'; x.lineWidth = 1; x.beginPath(); x.moveTo(mx - 4, my - 3); x.lineTo(mx - 1, my); x.lineTo(mx - 3, my + 1); x.lineTo(mx + 3, my + 4); x.stroke();
      } else if (c === 'ice') { // frost crust
        x.fillStyle = 'rgba(214,246,255,.85)'; x.beginPath(); for (let j = 0; j < 7; j++) { const a = j / 7 * 6.283, r = rr(2, 5) * (1 + lvl * .2); x.lineTo(mx + Math.cos(a) * r, my + Math.sin(a) * r); } x.fill();
        x.strokeStyle = 'rgba(80,170,220,.9)'; x.lineWidth = .8; x.stroke();
      } else if (c === 'acid') { // corroded holes
        x.fillStyle = 'rgba(154,184,50,.8)'; x.beginPath(); x.ellipse(mx, my, 3.5 + lvl * .6, 2.6 + lvl * .4, 0, 0, 7); x.fill();
        x.fillStyle = '#1a1208'; x.beginPath(); x.arc(mx + .5, my + .3, 1.4 + lvl * .4, 0, 7); x.fill();
        if (lvl >= 2) { x.strokeStyle = 'rgba(154,184,50,.8)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(mx, my + 2); x.lineTo(mx + .5, my + 6 + lvl); x.stroke(); }
      } else if (c === 'crush') { // dirt / dust smears
        x.fillStyle = 'rgba(110,84,52,.6)'; x.beginPath(); x.ellipse(mx, my, 5 + lvl, 2.5, rr(-.6, .6), 0, 7); x.fill();
        x.fillStyle = 'rgba(70,50,30,.5)'; x.beginPath(); x.arc(mx + 2, my - 1, 1.5, 0, 7); x.fill();
      } else if (c === 'arcane') { // glowing violet crack
        x.strokeStyle = '#2a1050'; x.lineWidth = 2; x.beginPath(); x.moveTo(mx - 4, my - 3); x.lineTo(mx, my); x.lineTo(mx - 1, my + 3); x.lineTo(mx + 4, my + 5); x.stroke();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(200,140,255,.9)'; x.lineWidth = .9; x.stroke(); x.globalCompositeOperation = 'source-over';
      } else { // slash: claw marks
        x.strokeStyle = 'rgba(30,10,10,.85)'; x.lineWidth = 1.6; const a = rr(-.9, -.3);
        for (let k = 0; k < (lvl >= 2 ? 3 : 2); k++) { x.beginPath(); x.moveTo(mx - 5 + k * 3, my - 4); x.lineTo(mx - 5 + k * 3 + Math.cos(a) * -8, my - 4 + Math.sin(a) * -8 + 9); x.stroke(); }
      }
    }
    // torn / burnt hem from lvl 2
    if (lvl >= 2) {
      const hc = main === 'fire' || main === 'shock' ? '#140a06' : main === 'ice' ? '#d6f6ff' : main === 'acid' ? '#3a4a10' : '#000';
      x.fillStyle = hc; x.beginPath(); x.moveTo(-18, 2); for (let i = 0; i <= 10; i++) { const hx = -17 + i * 3.4; x.lineTo(hx, i % 2 ? -3 - rr(1, 3 + lvl) : 1); } x.lineTo(18, 2); x.closePath(); x.fill();
      if (main === 'fire') { x.strokeStyle = 'rgba(255,122,42,.9)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i <= 10; i++) { const hx = -17 + i * 3.4; x.lineTo(hx, i % 2 ? -4 : 0); } x.stroke(); }
    }
    x.restore();
  } else if (layer === 'head') {
    // face: soot / scratch / bruise / frost
    const c = main;
    if (c === 'fire' || c === 'shock') { x.fillStyle = 'rgba(30,20,15,.55)'; x.beginPath(); x.ellipse(-2, -44, 3 + lvl * .5, 2, .3, 0, 7); x.fill(); if (lvl >= 2) { x.beginPath(); x.ellipse(5, -49, 2.4, 1.6, 0, 0, 7); x.fill(); } }
    else if (c === 'ice') { x.fillStyle = 'rgba(214,246,255,.8)'; x.beginPath(); x.ellipse(-4, -45, 2.6, 2, 0, 0, 7); x.fill(); }
    else if (c === 'crush') { x.fillStyle = 'rgba(120,70,140,.55)'; x.beginPath(); x.ellipse(4.5, -44, 2.4, 2, 0, 0, 7); x.fill(); }
    else if (c === 'acid') { x.fillStyle = 'rgba(154,184,50,.6)'; x.beginPath(); x.arc(-3, -43, 1.8, 0, 7); x.fill(); }
    else { x.strokeStyle = 'rgba(160,20,20,.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-4, -49); x.lineTo(-1, -44); x.moveTo(-2, -50); x.lineTo(1, -45); x.stroke(); }
    // bandage cross from lvl 2
    if (lvl >= 2) { x.save(); x.translate(-4, -42); x.rotate(-.4); x.fillStyle = '#f3ead2'; x.strokeStyle = '#000'; x.lineWidth = 1; x.fillRect(-3.5, -1.2, 7, 2.4); x.strokeRect(-3.5, -1.2, 7, 2.4); x.rotate(1.57); x.fillRect(-3.5, -1.2, 7, 2.4); x.strokeRect(-3.5, -1.2, 7, 2.4); x.restore(); }
    // frizzled beard ends for shock
    if ((c === 'shock' || second === 'shock') && w.beardStyle !== 'none') { x.strokeStyle = w.beardC; x.lineWidth = 1.2; for (let i = 0; i < 2 + lvl; i++) { const bx = rr(-4, 8), by = rr(-30, -18); x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + rr(-4, 4), by + 3); x.lineTo(bx + rr(-5, 5), by + 6); x.stroke(); } }
  } else if (layer === 'top') {
    // effects that float over everything: smoke, sparks, frost drips, icicles on brim
    const t = w.t || 0;
    if (lvl >= 3 && (main === 'fire' || main === 'shock')) { for (let i = 0; i < 3; i++) { const ph = (t * .6 + i / 3) % 1; x.fillStyle = `rgba(150,140,160,${.6 * (1 - ph)})`; x.strokeStyle = `rgba(0,0,0,${.35 * (1 - ph)})`; x.lineWidth = 1; x.beginPath(); x.arc((i % 2 ? 13 : -14) + Math.sin(t * 2 + i) * 3 + (i % 2 ? 1 : -1) * ph * 8, -18 - ph * 36, 2.5 + ph * 6, 0, 7); x.fill(); x.stroke(); } }
    if (lvl >= 2 && (main === 'shock' || second === 'shock') && (Math.sin(t * 13) > .7)) { x.strokeStyle = '#fff3a0'; x.lineWidth = 1.4; const sx = rr(-10, 10), sy = rr(-38, -14); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + 3, sy + 3); x.lineTo(sx, sy + 5); x.lineTo(sx + 4, sy + 9); x.stroke(); }
    if (lvl >= 2 && (main === 'ice' || second === 'ice')) { x.fillStyle = '#e4fbff'; x.strokeStyle = '#3a9ad8'; x.lineWidth = .8; for (let i = 0; i < lvl; i++) { const ix = -9 + i * 6; x.beginPath(); x.moveTo(ix - 2, -40); x.lineTo(ix + 2, -40); x.lineTo(ix, -33 - (i % 2) * 2); x.closePath(); x.fill(); x.stroke(); } }
    if (lvl >= 2 && (main === 'acid' || second === 'acid')) { const ph = (t * .8) % 1; x.fillStyle = `rgba(154,184,50,${1 - ph})`; x.beginPath(); x.arc(9, -10 + ph * 12, 1.4, 0, 7); x.fill(); }
    if (lvl >= 2 && (main === 'arcane' || second === 'arcane')) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(200,140,255,${.4 + Math.sin(t * 6) * .3})`; x.beginPath(); x.arc(rr(-8, 8), rr(-34, -10), 1.6, 0, 7); x.fill(); }
  }
  x.restore();
}

/* Default look is the new character-sheet art ('hd'). The key was bumped so older saved choices do not hide it. */
(function () { try { ART_STYLE = localStorage.getItem('sb.artStyle2') || 'hd'; } catch (e) { ART_STYLE = 'hd'; } })();
drawWiz = function (w, X, ava) { return ART_STYLE === 'v4' ? drawWizV4(w, X, ava) : ART_STYLE === 'v3' ? drawWizV3(w, X, ava) : ART_STYLE === 'v2' ? drawWizV2(w, X, ava) : drawWizV1(w, X, ava); };
