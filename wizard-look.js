/* =====================================================================
   SPELLBINDER: WIZARD + COSMETIC RENDERING
   Everything that draws a wizard, its gear, pets, spell icons and emblems.
   Driven entirely by the data in wizard-data.js.
   A wizard "look" is: {robe, hat, staff, beard, skin, pet} (ids from COSMETICS).
   ===================================================================== */

const cos = (cat, id) => COSMETICS[cat].find(i => i.id === id) || COSMETICS[cat][0];

/* Turn a look into the flat fields the renderer reads. */
function resolveLook(look) {
  look = Object.assign({}, DEFAULT_LOOK, look || {});
  const robe = cos('robe', look.robe), beard = cos('beard', look.beard);
  return { look, robe: robe.c, trim: robe.trim, hatId: look.hat, staffId: look.staff, beardC: beard.c, beardStyle: beard.style, skin: cos('skin', look.skin).c, petId: look.pet };
}
function randomLook() {
  const pick = cat => COSMETICS[cat][Math.random() * COSMETICS[cat].length | 0].id;
  return { robe: pick('robe'), hat: pick('hat'), staff: pick('staff'), beard: pick('beard'), skin: pick('skin'), pet: Math.random() < .5 ? 'none' : pick('pet') };
}

/* ---------------- WIZARD ----------------
   w needs: x,y,vx,vy,t,face,flash,recoil,dead,p,book,i + resolveLook() fields.
   ava=true draws a static portrait (no shadow/bob). */
function drawWiz(w, X, ava) {
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
  // staff (behind body)
  x.save(); x.translate(9, -34); x.rotate(raise); drawStaff(x, w.staffId, l, m, casting, fl); x.restore();
  // hat back layer (hood)
  drawHat(x, w, sway, fl, 'back');
  // robe
  const g = x.createLinearGradient(0, -44, 0, 0); g.addColorStop(0, w.robe[0]); g.addColorStop(1, w.robe[1]);
  x.fillStyle = fl ? '#fff' : g; x.strokeStyle = '#000'; x.lineWidth = 3; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(-8, -40); x.quadraticCurveTo(-14, -18, -17 + sway * .5, 0); x.quadraticCurveTo(-8, 3 + sway * .3, 0, 0); x.quadraticCurveTo(8, 3 - sway * .3, 17 + sway * .5, 0); x.quadraticCurveTo(13, -18, 8, -40); x.closePath(); x.fill(); x.stroke();
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
  x.fillStyle = '#000'; x.beginPath(); x.arc(4, -47, 1.6, 0, 7); x.arc(-1, -47, 1.6, 0, 7); x.fill();
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'head');
  drawHat(x, w, sway, fl, 'front');
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

function drawStaff(x, id, l, m, casting, fl) {
  const shaft = (c, x0, y0, x1, y1, lw = 3.5) => { x.strokeStyle = '#000'; x.lineWidth = lw + 2.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.strokeStyle = c; x.lineWidth = lw; x.stroke(); x.lineCap = 'butt'; };
  const glow = (gx, gy) => { const og = x.createRadialGradient(gx, gy, 0, gx, gy, 14 + (casting ? 6 : 0)); og.addColorStop(0, '#fff'); og.addColorStop(.35, l); og.addColorStop(1, m + '00'); x.globalCompositeOperation = 'lighter'; x.fillStyle = og; x.beginPath(); x.arc(gx, gy, 16 + (casting ? 8 : 0), 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; };
  x.strokeStyle = '#000'; x.lineWidth = 2.5; x.lineJoin = 'round';
  if (id === 'crystal') {
    shaft('#c3cfe0', 0, 22, 4, -22); glow(4, -30);
    x.beginPath(); x.moveTo(4, -40); x.lineTo(10, -30); x.lineTo(4, -21); x.lineTo(-2, -30); x.closePath(); x.fillStyle = fl ? '#fff' : l; x.fill(); x.stroke();
    x.fillStyle = '#fff9'; x.beginPath(); x.moveTo(4, -37); x.lineTo(6, -30); x.lineTo(4, -27); x.closePath(); x.fill();
  } else if (id === 'skull') {
    shaft('#5a4632', 0, 22, 4, -22); glow(4, -29);
    x.fillStyle = fl ? '#fff' : '#f1ead8'; x.beginPath(); x.arc(4, -30, 6.5, 0, 7); x.fill(); x.stroke(); x.fillRect(1, -25, 6, 4); x.strokeRect(1, -25, 6, 4);
    x.fillStyle = l; x.beginPath(); x.arc(1.8, -30.5, 1.8, 0, 7); x.arc(6.4, -30.5, 1.8, 0, 7); x.fill();
  } else if (id === 'wand') {
    shaft('#3a2a1a', 1, 10, 3, -12, 3); x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(2.6, -9); x.lineTo(3, -12); x.stroke(); glow(3, -16);
    x.strokeStyle = '#000'; x.lineWidth = 2; x.fillStyle = fl ? '#fff' : l; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.6 : 6; x.lineTo(3 + Math.cos(a) * r, -16 + Math.sin(a) * r); } x.closePath(); x.fill(); x.stroke();
  } else if (id === 'moon') {
    shaft('#d9b44a', 0, 22, 4, -22); glow(4, -30);
    x.fillStyle = fl ? '#fff' : '#fff3b0'; x.beginPath(); x.arc(4, -30, 8, -2.4, 2.4, false); x.arc(8, -30, 6.2, 2.1, -2.1, true); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = l; x.beginPath(); x.arc(5, -30, 2.6, 0, 7); x.fill();
  } else { // oak
    shaft('#7a4a24', 0, 22, 4, -24); glow(4, -28);
    x.fillStyle = fl ? '#fff' : l; x.beginPath(); x.arc(4, -28, 5.5, 0, 7); x.fill(); x.stroke();
  }
}

function drawHat(x, w, sway, fl, pass) {
  const id = w.hatId || 'pointy'; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.lineJoin = 'round';
  const hg = x.createLinearGradient(0, -82, 0, -48); hg.addColorStop(0, w.robe[0]); hg.addColorStop(1, w.robe[2]);
  if (id === 'hood') {
    if (pass === 'back') { x.fillStyle = fl ? '#fff' : hg; x.beginPath(); x.moveTo(-12, -36); x.quadraticCurveTo(-16, -62, 0, -62); x.quadraticCurveTo(-4, -70 + sway, -12 + sway, -66); x.quadraticCurveTo(8, -66, 13, -58); x.quadraticCurveTo(17, -46, 13, -36); x.closePath(); x.fill(); x.stroke(); }
    else { x.strokeStyle = '#000'; x.lineWidth = 6; x.beginPath(); x.arc(1, -46, 10.5, Math.PI * 1.02, Math.PI * 1.98); x.stroke(); x.strokeStyle = w.robe[1]; x.lineWidth = 3.5; x.stroke(); x.strokeStyle = w.trim; x.lineWidth = 1.5; x.beginPath(); x.arc(1, -46, 12, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    return;
  }
  if (pass !== 'front') return;
  if (id === 'crown') {
    x.fillStyle = fl ? '#fff' : '#ffd45e'; x.beginPath(); x.moveTo(-8, -51); x.lineTo(-10, -62); x.lineTo(-4, -56); x.lineTo(1, -65); x.lineTo(6, -56); x.lineTo(12, -62); x.lineTo(10, -51); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ff4a5a'; x.beginPath(); x.arc(1, -55, 2.2, 0, 7); x.fill(); x.fillStyle = '#5cc8ff'; x.beginPath(); x.arc(-5, -54, 1.6, 0, 7); x.arc(7, -54, 1.6, 0, 7); x.fill();
    x.fillStyle = '#fff8'; x.beginPath(); x.arc(-9.5, -61, 1.4, 0, 7); x.arc(1, -64, 1.4, 0, 7); x.arc(11.5, -61, 1.4, 0, 7); x.fill();
  } else if (id === 'mushroom') {
    x.fillStyle = '#f3e3c2'; x.beginPath(); x.ellipse(1, -52, 16, 3.5, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = fl ? '#fff' : '#e8423a'; x.beginPath(); x.ellipse(1, -53, 18, 15, 0, Math.PI, 0); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#fff'; [[-8, -58, 3], [3, -64, 3.6], [10, -57, 2.4], [-2, -55, 1.8]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
  } else if (id === 'witch') {
    x.fillStyle = fl ? '#fff' : hg; x.beginPath(); x.ellipse(1, -52, 21, 5, 0, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-7, -53); x.lineTo(-4, -68); x.quadraticCurveTo(-1, -78, 12 + sway, -80); x.quadraticCurveTo(3, -72, 9, -53); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = w.trim; x.lineWidth = 3.5; x.beginPath(); x.moveTo(-6.5, -56); x.lineTo(9.3, -56); x.stroke();
    x.strokeStyle = '#000'; x.lineWidth = 1.5; x.fillStyle = '#ffd45e'; x.fillRect(-1, -58.5, 5, 5); x.strokeRect(-1, -58.5, 5, 5);
  } else { // pointy (+ feathered)
    x.fillStyle = fl ? '#fff' : hg; x.beginPath(); x.ellipse(1, -52, 15, 4.5, 0, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-8, -53); x.quadraticCurveTo(-2, -70, -12 + sway, -82); x.quadraticCurveTo(6, -72, 10, -53); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = w.trim; x.lineWidth = 3; x.beginPath(); x.moveTo(-8, -56); x.quadraticCurveTo(1, -58, 10, -56); x.stroke();
    if (id === 'feathered') {
      x.strokeStyle = '#000'; x.lineWidth = 2; x.fillStyle = '#ff5d6c'; x.beginPath(); x.moveTo(7, -57); x.quadraticCurveTo(10, -72, 20 + sway, -80); x.quadraticCurveTo(18, -66, 10, -56); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = '#ffd0d4'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(8.5, -58); x.quadraticCurveTo(12, -70, 19 + sway, -78); x.stroke();
    } else { x.fillStyle = w.trim; x.beginPath(); x.arc(-1, -65, 2.2, 0, 7); x.fill(); }
  }
}

/* ---------------- PETS ----------------
   Drawn at (0,0) = ground under the pet. face = 1 or -1. */
function drawPet(x, id, t, face = 1) {
  if (!id || id === 'none') return;
  x.save(); x.scale(face, 1); x.strokeStyle = '#000'; x.lineWidth = 2; x.lineJoin = 'round';
  const shadow = (r = 8) => { x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(0, 0, r, 3, 0, 0, 7); x.fill(); };
  const eye = (ex, ey, r, irisC = '#000') => { x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, ey, r, 0, 7); x.fill(); x.stroke(); x.fillStyle = irisC; x.beginPath(); x.arc(ex + r * .3, ey, r * .5, 0, 7); x.fill(); };
  if (id === 'owl') {
    shadow(7); const y = -34 + Math.sin(t * 3) * 3, fl = Math.sin(t * 16) * .7;
    x.fillStyle = '#6b4226'; [-1, 1].forEach(s => { x.save(); x.translate(s * 8, y); x.rotate(s * (.5 + fl)); x.beginPath(); x.ellipse(s * 4, 0, 6, 3.5, 0, 0, 7); x.fill(); x.stroke(); x.restore(); });
    x.fillStyle = '#8a5a3a'; x.beginPath(); x.ellipse(0, y, 9, 10, 0, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-8, y - 6); x.lineTo(-7, y - 14); x.lineTo(-3, y - 8); x.moveTo(8, y - 6); x.lineTo(7, y - 14); x.lineTo(3, y - 8); x.fill(); x.stroke();
    x.fillStyle = '#e8c89a'; x.beginPath(); x.ellipse(0, y + 4, 5.5, 5, 0, 0, 7); x.fill();
    eye(-3.6, y - 3, 3.4); eye(3.6, y - 3, 3.4);
    x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(-1.5, y); x.lineTo(1.5, y); x.lineTo(0, y + 3); x.closePath(); x.fill(); x.stroke();
  } else if (id === 'frog') {
    const hop = Math.max(0, Math.sin(t * 4)) * 9, y = -hop; shadow(9 - hop * .3);
    x.fillStyle = '#4caf3a'; x.beginPath(); x.ellipse(-7, y - 2, 4, 2.5, 0, 0, 7); x.ellipse(7, y - 2, 4, 2.5, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#5fcf45'; x.beginPath(); x.ellipse(0, y - 7, 10, 7, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#d8f5a8'; x.beginPath(); x.ellipse(0, y - 4, 6, 3, 0, 0, 7); x.fill();
    x.fillStyle = '#5fcf45'; x.beginPath(); x.arc(-5, y - 13, 4, 0, 7); x.arc(5, y - 13, 4, 0, 7); x.fill(); x.stroke();
    eye(-5, y - 13.5, 2.6); eye(5, y - 13.5, 2.6);
    x.beginPath(); x.moveTo(-4, y - 8); x.quadraticCurveTo(0, y - 5.5, 4, y - 8); x.stroke();
  } else if (id === 'wisp') {
    shadow(5); const y = -32 + Math.sin(t * 2) * 4;
    x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, y, 0, 0, y, 18); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, '#8ff0ff'); g.addColorStop(1, '#2a8cff00'); x.fillStyle = g; x.beginPath(); x.arc(0, y, 18, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#bff6ff'; x.beginPath(); x.moveTo(-7, y + 2); x.quadraticCurveTo(-8, y - 8, 0 + Math.sin(t * 6) * 3, y - 16); x.quadraticCurveTo(8, y - 8, 7, y + 2); x.quadraticCurveTo(0, y + 9, -7, y + 2); x.fill(); x.stroke();
    x.fillStyle = '#0b2d55'; x.beginPath(); x.arc(-2.5, y - 1, 1.6, 0, 7); x.arc(2.8, y - 1, 1.6, 0, 7); x.fill();
  } else if (id === 'cat') {
    shadow(9); const sw = Math.sin(t * 2.2) * 5;
    x.strokeStyle = '#000'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-6, -4); x.quadraticCurveTo(-17, -8, -15 + sw, -22); x.stroke(); x.strokeStyle = '#2a2438'; x.lineWidth = 3.5; x.stroke(); x.lineCap = 'butt';
    x.strokeStyle = '#000'; x.lineWidth = 2; x.fillStyle = '#2a2438'; x.beginPath(); x.ellipse(0, -9, 8, 9, 0, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.arc(1, -21, 7, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-5, -25); x.lineTo(-5, -32); x.lineTo(-1, -27); x.moveTo(7, -25); x.lineTo(7, -32); x.lineTo(3, -27); x.fill(); x.stroke();
    x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(-1.5, -21, 2, 2.4, 0, 0, 7); x.ellipse(4, -21, 2, 2.4, 0, 0, 7); x.fill();
    x.fillStyle = '#000'; x.fillRect(-2, -23, 1, 4); x.fillRect(3.6, -23, 1, 4);
  } else if (id === 'dragon') {
    shadow(8); const y = -40 + Math.sin(t * 3) * 4, fl = Math.sin(t * 12) * 6;
    x.fillStyle = '#6a3fd6'; x.beginPath(); x.moveTo(-2, y - 4); x.lineTo(-12, y - 16 - fl); x.lineTo(-4, y - 12 - fl * .3); x.lineTo(2, y - 8); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = '#000'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-6, y + 2); x.quadraticCurveTo(-16, y + 6, -18, y - 2); x.stroke(); x.strokeStyle = '#8a4ad6'; x.lineWidth = 3; x.stroke(); x.lineCap = 'butt';
    x.strokeStyle = '#000'; x.lineWidth = 2; x.fillStyle = '#8a4ad6'; x.beginPath(); x.ellipse(0, y, 9, 7, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#f0c070'; x.beginPath(); x.ellipse(1, y + 3, 5, 3, 0, 0, 7); x.fill();
    x.fillStyle = '#8a4ad6'; x.beginPath(); x.arc(9, y - 6, 6, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#f0c070'; x.beginPath(); x.moveTo(6, y - 11); x.lineTo(4, y - 17); x.lineTo(9, y - 12); x.moveTo(10, y - 12); x.lineTo(11, y - 18); x.lineTo(13, y - 11); x.fill(); x.stroke();
    eye(11, y - 7, 2.2, '#000');
    x.fillStyle = '#7d4ac6'; x.beginPath(); x.moveTo(2, y - 5); x.lineTo(10, y - 18 - fl); x.lineTo(8, y - 9); x.closePath(); x.fill(); x.stroke();
  }
  x.restore();
}

/* Square portrait used for avatars, item previews and profile icons. */
function drawAva(c, w, size) {
  const S = size || c.width, x = c.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.scale(c.width / 88, c.height / 88);
  const g = x.createRadialGradient(44, 40, 4, 44, 44, 44); g.addColorStop(0, w.robe[0]); g.addColorStop(1, w.robe[2]); x.fillStyle = g; x.fillRect(0, 0, 88, 88);
  x.save(); x.translate(42, 136); x.scale(1.85, 1.85); drawWiz(Object.assign({ book: ['fireball'], i: 0, p: 0, t: 0 }, w, { x: 0, y: 0, vx: 0, vy: 0, flash: 0, recoil: 0, dead: 0, face: 1, ghostT: 0, isDecoy: 0 }), x, true); x.restore();
  x.restore();
}
function lookWiz(look) { return Object.assign({ book: ['fireball'], i: 0, p: 0, t: 0, face: 1 }, resolveLook(look)); }
function drawPetCard(c, id, bg = ['#3a2d66', '#150f27']) {
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.scale(c.width / 88, c.height / 88);
  const g = x.createRadialGradient(44, 40, 4, 44, 44, 44); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, 88, 88);
  if (id === 'none') { x.strokeStyle = '#6f6496'; x.lineWidth = 5; x.beginPath(); x.arc(44, 44, 18, 0, 7); x.moveTo(31, 57); x.lineTo(57, 31); x.stroke(); return; }
  x.translate(44, ['owl', 'wisp', 'dragon'].includes(id) ? 118 : id === 'cat' ? 76 : 64); x.scale(2, 2); drawPet(x, id, 0.6, 1);
}

/* ---------------- SPELL ICONS ---------------- */
function icon(key, S = 96) {
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const s = SP[key], [l, m, d] = COL[s.el];
  x.scale(S / 96, S / 96); let g = x.createRadialGradient(40, 34, 4, 48, 48, 46); g.addColorStop(0, m); g.addColorStop(1, d);
  x.beginPath(); x.arc(48, 48, 44, 0, 7); x.fillStyle = '#000'; x.fill(); x.beginPath(); x.arc(48, 48, 40, 0, 7); x.fillStyle = g; x.fill();
  x.lineWidth = 3; x.strokeStyle = l + '88'; x.beginPath(); x.arc(48, 48, 35, 0, 7); x.stroke();
  x.save(); x.translate(48, 48); x.fillStyle = l; x.strokeStyle = '#000'; x.lineWidth = 3; x.lineJoin = 'round'; x.shadowColor = l; x.shadowBlur = 10;
  const P = (pts) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke(); x.fill(); };
  if (key === 'fireball') { x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(14, -10, 22, 0, 18, 12); x.bezierCurveTo(14, 24, -14, 24, -18, 12); x.bezierCurveTo(-21, 2, -10, -6, -8, -14); x.bezierCurveTo(-4, -6, 2, -8, 0, -26); x.stroke(); x.fill(); x.fillStyle = '#fff6c8'; x.beginPath(); x.ellipse(0, 10, 8, 10, 0, 0, 7); x.fill(); }
  if (key === 'meteor') { for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-26 + i * 8, -24 + i * 2); x.lineTo(2 + i * 4, 4); x.strokeStyle = ['#fff3', '#ffd27a', '#ff7a3a'][i]; x.lineWidth = 8 - i * 2; x.stroke(); } x.strokeStyle = '#000'; x.lineWidth = 3; x.fillStyle = '#6b4a3a'; x.beginPath(); x.arc(8, 10, 15, 0, 7); x.stroke(); x.fill(); x.fillStyle = '#3c271e'; x.beginPath(); x.arc(4, 6, 4, 0, 7); x.arc(14, 15, 3, 0, 7); x.fill(); }
  if (key === 'icewall') { [[-16, 8], [0, 14], [16, 8]].forEach(([cx, h]) => P([[cx - 8, 18], [cx - 6, -h - 6], [cx, -h - 16], [cx + 6, -h - 6], [cx + 8, 18]])); }
  if (key === 'zombies') { x.fillStyle = '#9fd67a'; P([[-10, 26], [-12, 0], [-20, -8], [-16, -14], [-8, -6], [-8, -20], [-2, -24], [0, -10], [2, -26], [8, -24], [6, -8], [12, -20], [17, -17], [10, 0], [10, 26]]); x.fillStyle = '#4a2f1b'; x.fillRect(-26, 18, 52, 10); x.strokeRect(-26, 18, 52, 10); }
  if (key === 'lightning') { P([[4, -28], [-14, 2], [-2, 2], [-10, 28], [14, -6], [2, -6], [10, -28]]); x.fillStyle = '#fff'; x.shadowBlur = 0; P([[3, -22], [-8, 0], [-2, 0], [-6, 16], [6, -3]]); }
  if (key === 'ghost') { x.fillStyle = '#d8fffa'; x.beginPath(); x.moveTo(-16, 22); x.lineTo(-16, -4); x.quadraticCurveTo(-16, -24, 0, -24); x.quadraticCurveTo(16, -24, 16, -4); x.lineTo(16, 22); x.lineTo(10, 16); x.lineTo(5, 22); x.lineTo(0, 16); x.lineTo(-5, 22); x.lineTo(-10, 16); x.closePath(); x.stroke(); x.fill(); x.shadowBlur = 0; x.fillStyle = '#0d4a44'; x.beginPath(); x.ellipse(-6, -6, 3.5, 5, 0, 0, 7); x.ellipse(6, -6, 3.5, 5, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, 6, 3, 4, 0, 0, 7); x.fill(); }
  if (key === 'flies') { x.shadowBlur = 0; x.strokeStyle = '#eef7a0aa'; x.lineWidth = 2; x.setLineDash([3, 4]); x.beginPath(); x.arc(0, 2, 18, 0, 7); x.stroke(); x.setLineDash([]); [[-12, -10], [10, -14], [14, 8], [-8, 14], [0, -2]].forEach(([a, b], i) => { x.strokeStyle = '#000'; x.lineWidth = 2; x.fillStyle = '#ffffffcc'; x.beginPath(); x.ellipse(a - 3, b - 4, 3.5, 2.2, -.6, 0, 7); x.ellipse(a + 3, b - 4, 3.5, 2.2, .6, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#1e2a08'; x.beginPath(); x.ellipse(a, b, i === 4 ? 6 : 4.5, i === 4 ? 4.5 : 3.5, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(a + 2.5, b - 1, 1.3, 0, 7); x.fill(); }); }
  if (key === 'mirror') { x.shadowBlur = 0; const fig = (ox, a) => { x.globalAlpha = a; x.fillStyle = '#e8d2ff'; x.beginPath(); x.moveTo(ox - 10, 22); x.quadraticCurveTo(ox - 8, 0, ox - 4, -6); x.lineTo(ox - 9, -8); x.lineTo(ox + 1, -28); x.lineTo(ox + 9, -8); x.lineTo(ox + 4, -6); x.quadraticCurveTo(ox + 8, 0, ox + 10, 22); x.closePath(); x.fill(); x.stroke(); }; fig(9, .45); fig(-7, 1); x.globalAlpha = 1; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(-24, -20); x.lineTo(-18, -14); x.moveTo(20, 14); x.lineTo(26, 20); x.stroke(); }
  if (key === 'gravity') { x.shadowBlur = 0; for (let i = 0; i < 3; i++) { x.strokeStyle = ['#d9c8ff', '#a98bff', '#6a3fd6'][i]; x.lineWidth = 5 - i; x.beginPath(); for (let a = 0; a < 9; a += .15) { const r = 26 - a * 2.6 - i * 2; x.lineTo(Math.cos(a + i * 2.1) * r, Math.sin(a + i * 2.1) * r); } x.stroke(); } x.fillStyle = '#160a3a'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; [[-18, -12], [16, -16], [14, 16]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 2, 0, 7); x.fill(); }); }
  if (key === 'orbs') { x.shadowBlur = 0; x.strokeStyle = '#f0d2ff88'; x.lineWidth = 2; x.setLineDash([4, 4]); x.beginPath(); x.ellipse(0, 2, 24, 14, 0, 0, 7); x.stroke(); x.setLineDash([]); x.fillStyle = '#5a2a9a'; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 2, 7, 0, 7); x.fill(); x.stroke(); [[-22, 4], [14, -10], [12, 14]].forEach(([a, b]) => { const g = x.createRadialGradient(a - 2, b - 2, 1, a, b, 8); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#d9a8ff'); g.addColorStop(1, '#7a3fd6'); x.fillStyle = g; x.beginPath(); x.arc(a, b, 7.5, 0, 7); x.fill(); x.stroke(); }); }
  if (key === 'bubbles') { x.shadowBlur = 0; [[-10, 8, 13], [12, -4, 10], [4, -20, 6], [-16, -14, 5]].forEach(([a, b, r]) => { const g = x.createRadialGradient(a - r * .3, b - r * .3, 1, a, b, r); g.addColorStop(0, '#f6ffd0'); g.addColorStop(.6, '#b8d84a'); g.addColorStop(1, '#6a8a1a'); x.fillStyle = g; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(a - r * .35, b - r * .35, r * .28, r * .18, -.6, 0, 7); x.fill(); }); }
  if (key === 'ricochet') { x.shadowBlur = 0; x.strokeStyle = '#000'; x.lineWidth = 7; x.lineJoin = 'round'; x.beginPath(); x.moveTo(-26, -18); x.lineTo(-6, 18); x.lineTo(10, -16); x.lineTo(24, 10); x.stroke(); x.strokeStyle = '#d9a8ff'; x.lineWidth = 3.5; x.stroke(); x.fillStyle = '#f0d2ff'; x.lineWidth = 2.5; x.strokeStyle = '#000'; x.save(); x.translate(24, 10); x.rotate(.6); x.beginPath(); x.moveTo(0, -9); x.lineTo(7, 0); x.lineTo(0, 9); x.lineTo(-7, 0); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  if (key === 'archer') { x.shadowBlur = 0; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.fillStyle = '#9fe8de'; x.beginPath(); x.moveTo(-12, 22); x.quadraticCurveTo(-14, 0, -8, -6); x.quadraticCurveTo(0, -30, 8, -6); x.quadraticCurveTo(14, 0, 12, 22); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#0d4a44'; x.beginPath(); x.ellipse(0, -8, 6, 5, 0, 0, 7); x.fill(); x.fillStyle = '#e0fffb'; x.beginPath(); x.arc(-2, -8, 1.5, 0, 7); x.arc(3, -8, 1.5, 0, 7); x.fill(); x.lineWidth = 4; x.beginPath(); x.arc(14, 2, 16, -1.2, 1.2); x.stroke(); x.strokeStyle = '#e0c070'; x.lineWidth = 2; x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(20, -13); x.lineTo(20, 17); x.stroke(); }
  if (key === 'beam') { x.shadowBlur = 0; x.lineCap = 'round'; [['#000', 20], ['#4fe3ff', 14], ['#ffffff', 6]].forEach(([c, lw]) => { x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.moveTo(-22, 18); x.lineTo(26, -20); x.stroke(); }); x.fillStyle = '#e8fcff'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.arc(-20, 16, 11, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = -.9 + i * .9; x.beginPath(); x.moveTo(26 + Math.cos(a) * 6, -20 + Math.sin(a) * 6); x.lineTo(26 + Math.cos(a) * 14, -20 + Math.sin(a) * 14); x.stroke(); } }
  if (key === 'shield') { x.shadowBlur = 0; const g = x.createRadialGradient(-6, -8, 2, 0, 0, 26); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#9ff5e0'); g.addColorStop(1, '#38e0c0'); x.fillStyle = g; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.fill(); x.stroke(); x.strokeStyle = '#0a4a40'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 24, -2.6, -1.4); x.stroke(); [[-8, 4, '#ff7a2a'], [8, -2, '#ffd23a'], [2, 12, '#d9a8ff']].forEach(([a, b, c]) => { x.fillStyle = c; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); x.stroke(); }); x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 18, 3.6, 4.4); x.stroke(); }
  if (key === 'golem') { x.shadowBlur = 0; x.fillStyle = '#a8824a'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.moveTo(-18, 22); x.lineTo(-20, -4); x.lineTo(-12, -18); x.lineTo(12, -18); x.lineTo(20, -4); x.lineTo(18, 22); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#c9a56a'; x.beginPath(); x.moveTo(-10, -18); x.lineTo(-6, -28); x.lineTo(6, -28); x.lineTo(10, -18); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffd45e'; x.beginPath(); x.arc(-4, -22, 2.2, 0, 7); x.arc(4, -22, 2.2, 0, 7); x.fill(); x.strokeStyle = '#5a3d22'; x.lineWidth = 2; x.beginPath(); x.moveTo(-8, 0); x.lineTo(-2, 6); x.lineTo(-6, 12); x.moveTo(8, -6); x.lineTo(4, 2); x.stroke(); }
  if (key === 'hourglass') { x.shadowBlur = 0; x.strokeStyle = '#000'; x.lineWidth = 3; x.fillStyle = '#7a5020'; x.fillRect(-16, -26, 32, 6); x.strokeRect(-16, -26, 32, 6); x.fillRect(-16, 20, 32, 6); x.strokeRect(-16, 20, 32, 6); x.fillStyle = '#e8f6ff'; x.beginPath(); x.moveTo(-12, -20); x.lineTo(12, -20); x.lineTo(2, 0); x.lineTo(12, 20); x.lineTo(-12, 20); x.lineTo(-2, 0); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffd45e'; x.beginPath(); x.moveTo(-6, -12); x.lineTo(6, -12); x.lineTo(0, -2); x.closePath(); x.fill(); x.beginPath(); x.moveTo(-9, 19); x.quadraticCurveTo(0, 8, 9, 19); x.closePath(); x.fill(); }
  if (key === 'thorns') { x.shadowBlur = 0; x.strokeStyle = '#000'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, 20); x.bezierCurveTo(-10, -10, 10, 30, 20, -18); x.stroke(); x.strokeStyle = '#4caf3a'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#d8f5a0'; x.strokeStyle = '#000'; x.lineWidth = 2; [[-14, 6, -.8], [0, 10, .6], [12, -4, -.5], [-6, -2, 2.2]].forEach(([a, b, r]) => { x.save(); x.translate(a, b); x.rotate(r); x.beginPath(); x.moveTo(0, -9); x.lineTo(4, 0); x.lineTo(-4, 0); x.closePath(); x.fill(); x.stroke(); x.restore(); }); x.fillStyle = '#ff5d9a'; x.beginPath(); x.arc(20, -18, 5, 0, 7); x.fill(); x.stroke(); }
  if (key === 'storm') { x.shadowBlur = 0;   // one cloud silhouette: every lobe is outlined first, then all filled on top, so no seams show inside
    const lobes = [[-12, -2, 11], [0, -11, 14], [13, -5, 11], [21, 3, 7], [-21, 4, 7]], base = () => { x.beginPath(); x.moveTo(-26, 4); x.quadraticCurveTo(-26, 12, -16, 12); x.lineTo(20, 12); x.quadraticCurveTo(28, 12, 27, 4); x.lineTo(-26, 4); x.closePath(); };
    const shape = () => { for (const [cx, cy, r] of lobes) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, 6.283); } };
    x.strokeStyle = '#000'; x.lineWidth = 6; x.lineJoin = 'round'; x.beginPath(); shape(); x.stroke(); x.beginPath(); x.moveTo(-26, 4); x.quadraticCurveTo(-26, 12, -16, 12); x.lineTo(20, 12); x.quadraticCurveTo(28, 12, 27, 4); x.stroke();   /* only the bottom edge of the base gets an outline */
    x.fillStyle = '#5a6080'; x.beginPath(); shape(); x.fill(); base(); x.fill();
    x.fillStyle = '#8a92b8'; x.beginPath(); x.arc(-2, -14, 7, 3.4, 5.9); x.arc(-13, -5, 5, 3.6, 5.6); x.fill();   // a little light on the top lobes
    x.lineWidth = 3; x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(2, 10); x.lineTo(-6, 22); x.lineTo(0, 22); x.lineTo(-4, 31); x.lineTo(9, 16); x.lineTo(3, 16); x.lineTo(7, 10); x.closePath(); x.fill(); x.stroke(); }
  if (key === 'rift') { x.shadowBlur = 0; [[-11, 0, '#6a3fd6'], [11, 0, '#b06bff']].forEach(([a, b, c]) => { x.fillStyle = '#160a3a'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.ellipse(a, b, 9, 20, 0, 0, 7); x.fill(); x.stroke(); x.strokeStyle = c; x.lineWidth = 2.5; x.beginPath(); x.ellipse(a, b, 6, 16, 0, 0, 7); x.stroke(); }); x.strokeStyle = '#ffd45e'; x.lineWidth = 2.5; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(-3, -8); x.quadraticCurveTo(0, -20, 3, -8); x.stroke(); x.setLineDash([]); }
  if (key === 'totem') { x.shadowBlur = 0; x.fillStyle = '#c87533'; x.strokeStyle = '#000'; x.lineWidth = 3; x.fillRect(-4, -18, 8, 40); x.strokeRect(-4, -18, 8, 40); x.fillStyle = '#e8a060'; x.beginPath(); x.moveTo(-10, -18); x.lineTo(10, -18); x.lineTo(0, -32); x.closePath(); x.fill(); x.stroke(); x.strokeStyle = '#ffd23a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-20, -24); x.lineTo(-10, -14); x.lineTo(-14, -14); x.lineTo(-6, -4); x.stroke(); x.beginPath(); x.moveTo(20, -24); x.lineTo(10, -14); x.lineTo(14, -14); x.lineTo(6, -4); x.stroke(); x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.ellipse(0, 22, 14, 4, 0, 0, 7); x.stroke(); }
  if (key === 'blink') { x.shadowBlur = 0; x.globalAlpha = .4; x.fillStyle = '#e8d2ff'; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-22, 20); x.lineTo(-18, -6); x.lineTo(-12, -22); x.lineTo(-6, -6); x.lineTo(-2, 20); x.closePath(); x.fill(); x.stroke(); x.globalAlpha = 1; x.beginPath(); x.moveTo(4, 20); x.lineTo(8, -6); x.lineTo(14, -22); x.lineTo(20, -6); x.lineTo(24, 20); x.closePath(); x.fill(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.setLineDash([3, 4]); x.beginPath(); x.moveTo(-6, 4); x.lineTo(6, 4); x.stroke(); x.setLineDash([]); }
  if (key === 'sinkhole') { x.shadowBlur = 0; x.fillStyle = '#3a2416'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 6, 26, 12, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#160c06'; x.beginPath(); x.ellipse(0, 8, 16, 6, 0, 0, 7); x.fill(); x.strokeStyle = '#a8824a'; x.lineWidth = 2.5; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(0, 7, 22 - i * 6, 10 - i * 2.5, 0, 3.6 + i, 5.6 + i); x.stroke(); } x.fillStyle = '#9fd67a'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(4, 6); x.lineTo(8, -10); x.lineTo(12, -8); x.lineTo(10, 6); x.closePath(); x.fill(); x.stroke(); }
  if (key === 'gale') { x.shadowBlur = 0; x.lineCap = 'round'; [[-14, '#e8fffb', 5], [0, '#9ff5e0', 5], [14, '#e8fffb', 4]].forEach(([oy, c, lw]) => { x.strokeStyle = '#000'; x.lineWidth = lw + 3; x.beginPath(); x.moveTo(-26, oy); x.bezierCurveTo(-6, oy - 8, 8, oy + 8, 22, oy - 2); x.stroke(); x.strokeStyle = c; x.lineWidth = lw; x.stroke(); }); x.strokeStyle = '#000'; x.lineWidth = 6; x.beginPath(); x.arc(18, -12, 6, 3.4, 8.4); x.stroke(); x.strokeStyle = '#9ff5e0'; x.lineWidth = 3; x.stroke(); }
  if (key === 'ringfire') { x.shadowBlur = 0; x.save(); x.scale(1, .62); x.strokeStyle = '#000'; x.lineWidth = 9; x.beginPath(); x.arc(0, 10, 26, 0, 7); x.stroke(); x.strokeStyle = '#ff7a2a'; x.lineWidth = 5; x.stroke(); x.restore();
    for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283, fx = Math.cos(a) * 26, fy = 6 + Math.sin(a) * 16, h = 13 + (i % 3) * 4; x.fillStyle = i % 2 ? '#ffd45e' : '#ff7a2a'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(fx - 5, fy); x.quadraticCurveTo(fx - 4, fy - h * .6, fx, fy - h); x.quadraticCurveTo(fx + 4, fy - h * .6, fx + 5, fy); x.closePath(); x.fill(); x.stroke(); }
    x.fillStyle = '#fff3b0'; x.beginPath(); x.arc(0, 4, 5, 0, 7); x.fill(); }
  if (key === 'burnbody') { x.shadowBlur = 12; x.shadowColor = '#ff7a2a'; const fl = (fx, fy, h, w, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(fx - w, fy); x.quadraticCurveTo(fx - w, fy - h * .55, fx, fy - h); x.quadraticCurveTo(fx + w, fy - h * .55, fx + w, fy); x.quadraticCurveTo(fx, fy + w * .6, fx - w, fy); x.fill(); x.stroke(); };
    x.strokeStyle = '#000'; x.lineWidth = 2.5; fl(-15, 24, 30, 8, '#ff5a1f'); fl(15, 24, 30, 8, '#ff5a1f'); fl(0, 26, 50, 14, '#ff7a2a'); x.shadowBlur = 0;
    x.fillStyle = '#2a1408'; x.beginPath(); x.moveTo(-9, 24); x.lineTo(-6, -2); x.lineTo(0, -14); x.lineTo(6, -2); x.lineTo(9, 24); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.arc(0, -16, 6, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#ffd45e'; x.beginPath(); x.arc(-2, -17, 1.5, 0, 7); x.arc(2.5, -17, 1.5, 0, 7); x.fill(); }
  x.restore(); return c.toDataURL();
}

/* ---------------- EMBLEMS ---------------- */
function shieldSVG(c0, c1, glyph = 'star', stars = 1, crown = false) {
  const id = 'sg' + Math.random().toString(36).slice(2, 8);
  const G = {
    star:  '<path d="M24 15l3 6.2 6.8 1-4.9 4.7 1.2 6.7L24 30.4l-6.1 3.2 1.2-6.7-4.9-4.7 6.8-1z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/>',
    flame: '<path d="M24 13c5 6 9 9 9 15a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 1 5 3 5-1-4 0-8 2-12z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/>',
    bolt:  '<path d="M27 12l-9 13h6l-3 11 10-15h-6z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/>',
  };
  return `<svg viewBox="0 0 48 54" style="width:100%;height:100%"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
  <path d="M24 2l20 7v15c0 14-9 23-20 28C13 47 4 38 4 24V9z" fill="#000"/><path d="M24 6l16 5.5V24c0 11-7 19-16 23.5C15 43 8 35 8 24V11.5z" fill="url(#${id})"/>
  <path d="M24 6l16 5.5V18C30 20 18 20 8 18v-6.5z" fill="#fff" opacity=".22"/>${G[glyph]}
  ${crown ? '<path d="M14 4l4 5 6-7 6 7 4-5v6H14z" fill="#ffd45e" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>' : ''}
  ${Array.from({ length: stars }, (_, i) => `<circle cx="${24 + (i - (stars - 1) / 2) * 7}" cy="43" r="2.4" fill="#fff" stroke="#000" stroke-width="1.2"/>`).join('')}</svg>`;
}
function emblem(ri) { const r = RANKS[ri]; return shieldSVG(r.c[0], r.c[1], 'star', ri % 3 + 1, ri >= 5); }
function emblemSVG(id) { const e = EMBLEMS.find(e => e.id === id) || EMBLEMS[0]; return e.rank !== undefined ? emblem(e.rank) : shieldSVG(e.c[0], e.c[1], e.glyph, 0); }
