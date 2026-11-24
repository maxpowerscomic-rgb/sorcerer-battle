/* =====================================================================
   WIZARDS VS SORCERERS: HD character renderers (code-drawn, no images)
   drawWizHD(w, X, ava)   wizard: robe, mantle, hats, staffs, beards
   drawSorcHD(w, X, ava)  sorcerer: gi, belt, wraps, headgear
   drawPetHD(x, id, t, face, mood)  frog, owl, cat, wisp, dragon
   Same frame as the classic art: feet at (0,0), head near y = -48, facing +x.
   Same look data (resolveLook) and the same state fields as the game, plus an
   optional w.pose ('idle','charge','cast','hurt','weary','cheer','ko') and
   w.prog (0..1 charge) used by the character sheets.
   Style rules: thick black silhouette line, thinner inner lines, light from the
   top-left, one cel shadow and one highlight per material.
   ===================================================================== */
(function () {
  'use strict';
  const LW = .84;   // one knob for every outline weight
  const PC = {}; const path = d => PC[d] || (PC[d] = new Path2D(d));
  const P = d => typeof d === 'string' ? path(d) : d;
  function fs(x, d, fill, lw, stroke) { const p = P(d); if (fill) { x.fillStyle = fill; x.fill(p); } if (lw) { x.lineWidth = LW * (lw); x.strokeStyle = stroke || '#000'; x.stroke(p); } return p; }
  function within(x, d, fn) { x.save(); x.clip(P(d)); fn(); x.restore(); }
  function vgrad(x, y0, y1, a, b) { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function rgb(hex) { if (hex[0] !== '#') return [128, 128, 128]; let h = hex.slice(1); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function mul(hex, f) { const [r, g, b] = rgb(hex), c = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(r)},${c(g)},${c(b)})`; }
  function mix(hex, to, f) { const a = rgb(hex), b = rgb(to), c = i => Math.round(a[i] + (b[i] - a[i]) * f); return `rgb(${c(0)},${c(1)},${c(2)})`; }
  function elOf(w) { try { return COL[SP[w.book[w.i]].el]; } catch (e) { return ['#ffe6a8', '#ffb347', '#7a3a00']; } }
  function poseOf(w) {
    if (w.pose) return w.pose; if (w.dead) return 'ko'; if (w.stunT > 0) return 'hurt';
    if (w.flash > 0) w._hitAt = w.t; if (w._hitAt !== undefined && w.t - w._hitAt < .4) return 'hurt';
    if (w.recoil > 0) return 'cast'; if (w.slump) return 'weary'; return 'idle';
  }
  function progOf(w) { if (w.prog !== undefined) return w.prog; try { return Math.max(0, Math.min(1, (w.p || 0) / SP[w.book[w.i]].t)); } catch (e) { return 0; } }
  const star4 = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 - 1.571, rr = i % 2 ? r * .38 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
  const star5 = (x, cx, cy, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, rr = i % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); };
  function glow(x, cx, cy, r, l, m, a) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha *= a; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, l); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore(); }

  /* ---------------- shared face (head-local, centre 0,0, radius ~9, looking +x) ---------------- */
  function drawFace(x, w, pose, o) {
    const t = w.t || 0, ey = o.eyeY, E = [3.9, -1.9], blink = (pose === 'idle' || pose === 'charge') && t > .12 && (t % 3.7) < .11;   // portraits sit at t = 0: eyes stay open
    x.lineCap = 'round'; x.lineJoin = 'round';
    // cheek blush
    x.fillStyle = 'rgba(255,90,90,.2)'; x.beginPath(); x.ellipse(5.6, ey + 3.6, 2, 1.2, 0, 0, 7); x.fill();
    x.strokeStyle = '#000'; x.fillStyle = '#000';
    if (pose === 'hurt') { x.lineWidth = LW * (1.6); x.beginPath(); x.moveTo(E[1] - 1.5, ey - 1.9); x.lineTo(E[1] + 1.3, ey); x.lineTo(E[1] - 1.5, ey + 1.9); x.moveTo(E[0] + 1.5, ey - 1.9); x.lineTo(E[0] - 1.3, ey); x.lineTo(E[0] + 1.5, ey + 1.9); x.stroke(); }
    else if (pose === 'ko') { x.lineWidth = LW * (1.6); x.beginPath(); for (const e of E) { x.moveTo(e - 1.6, ey - 1.6); x.lineTo(e + 1.6, ey + 1.6); x.moveTo(e + 1.6, ey - 1.6); x.lineTo(e - 1.6, ey + 1.6); } x.stroke(); }
    else if (pose === 'cheer') { x.lineWidth = LW * (1.7); x.beginPath(); for (const e of E) { x.moveTo(e - 1.8, ey + .9); x.quadraticCurveTo(e, ey - 2.4, e + 1.8, ey + .9); } x.stroke(); }
    else if (blink) { x.lineWidth = LW * (1.6); x.beginPath(); for (const e of E) { x.moveTo(e - 1.6, ey); x.lineTo(e + 1.6, ey); } x.stroke(); }
    else {
      const ry = pose === 'cast' ? 2.7 : pose === 'weary' ? 1.5 : o.sharp ? 2 : 2.25, rx = o.sharp ? 1.75 : 1.7;
      for (const e of E) { x.fillStyle = '#000'; x.beginPath(); x.ellipse(e, ey + (pose === 'weary' ? .7 : 0), rx, ry, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(e + .55, ey - .75 + (pose === 'weary' ? .9 : 0), .68, 0, 7); x.fill(); }
      if (pose === 'weary') { x.strokeStyle = '#000'; x.lineWidth = LW * (1.3); x.beginPath(); for (const e of E) { x.moveTo(e - 2, ey - .7); x.lineTo(e + 2, ey - .7); } x.stroke(); }
      if (o.sharp && pose !== 'weary') { x.strokeStyle = '#000'; x.lineWidth = LW * (1.1); x.beginPath(); for (const e of E) { x.moveTo(e - 2.1, ey - 1.6); x.lineTo(e + 2.2, ey - 1.9); } x.stroke(); }
    }
    // brows
    if (pose !== 'hurt' && pose !== 'ko') {
      const by = ey - (pose === 'cast' || pose === 'cheer' ? 4.4 : 3.6); x.strokeStyle = o.brow; x.lineWidth = LW * (o.sharp ? 1.9 : 1.6); x.beginPath();
      if (pose === 'charge' || (o.sharp && pose === 'idle') || pose === 'cast' && o.sharp) { x.moveTo(E[1] - 2.2, by - .9); x.lineTo(E[1] + 1.6, by + .7); x.moveTo(E[0] + 2.2, by - .9); x.lineTo(E[0] - 1.6, by + .7); }
      else if (pose === 'weary') { x.moveTo(E[1] - 2, by + 1); x.lineTo(E[1] + 1.6, by - .3); x.moveTo(E[0] + 2, by + 1); x.lineTo(E[0] - 1.6, by - .3); }
      else { x.moveTo(E[1] - 2, by + .3); x.quadraticCurveTo(E[1], by - .9, E[1] + 1.8, by + .2); x.moveTo(E[0] - 1.8, by + .2); x.quadraticCurveTo(E[0], by - .9, E[0] + 2, by + .3); }
      x.stroke();
    }
    // mouth (hidden by a beard or a mask)
    if (o.mouth) {
      const mx = 2.6, my = ey + 5.6; x.strokeStyle = '#000'; x.lineWidth = LW * (1.4);
      if (pose === 'cast') { x.fillStyle = '#5a1420'; x.beginPath(); x.ellipse(mx + .4, my + .3, 2, 2.3, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#ff7a8a'; x.beginPath(); x.ellipse(mx + .4, my + 1.5, 1.2, .8, 0, 0, 7); x.fill(); }
      else if (pose === 'cheer') { x.fillStyle = '#5a1420'; x.beginPath(); x.moveTo(mx - 2.6, my - .8); x.quadraticCurveTo(mx + .4, my + 4.4, mx + 3.2, my - .8); x.closePath(); x.fill(); x.stroke(); }
      else if (pose === 'hurt' || pose === 'ko') { x.beginPath(); x.moveTo(mx - 2.4, my + .6); x.quadraticCurveTo(mx - 1.2, my - .9, mx, my + .5); x.quadraticCurveTo(mx + 1.2, my + 1.8, mx + 2.6, my + .3); x.stroke(); }
      else if (pose === 'weary') { x.beginPath(); x.arc(mx + .3, my + 1.4, 1.5, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
      else if (pose === 'charge' || o.sharp) { x.lineWidth = LW * 1.05; x.beginPath(); x.moveTo(mx - 1.2, my + .5); if (o.sharp && pose === 'idle') x.quadraticCurveTo(mx + 1, my + 1.3, mx + 2.9, my - .5); else x.lineTo(mx + 2, my + .3); x.stroke(); }
      else { x.beginPath(); x.arc(mx + .2, my - .6, 2.2, .25, Math.PI - .35); x.stroke(); }
    }
    if (pose === 'weary') { x.fillStyle = '#8fdcff'; x.strokeStyle = '#000'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-8.4, ey - 6.2); x.quadraticCurveTo(-10.4, ey - 2.8, -8.4, ey - 2.2); x.quadraticCurveTo(-6.4, ey - 2.8, -8.4, ey - 6.2); x.fill(); x.stroke(); }
  }
  function drawHeadBase(x, skin, fl) {
    const sk = fl ? '#fff' : skin;
    x.fillStyle = sk; x.strokeStyle = '#000'; x.lineWidth = LW * (2.2);
    x.beginPath(); x.arc(-8, 1.2, 2.5, 0, 7); x.fill(); x.stroke();                // ear
    x.beginPath(); x.arc(8.7, 3.1, 1.75, 0, 7); x.fill(); x.stroke();              // nose
    x.lineWidth = LW * (2.6); x.beginPath(); x.arc(0, 0, 9.2, 0, 7); x.fill(); x.stroke();
    if (!fl) { within(x, (() => { const p = new Path2D(); p.arc(0, 0, 9.2, 0, 7); return p; })(), () => { x.fillStyle = mul(skin, .8); x.globalAlpha = .5; x.beginPath(); x.arc(-5.5, 5.5, 9.5, 0, 7); x.arc(1.2, -1.2, 9.6, 0, 7, true); x.fill('evenodd'); x.globalAlpha = 1; }); x.fillStyle = sk; x.beginPath(); x.arc(8.2, 3.1, 1.25, 0, 7); x.fill(); x.fillStyle = mul(skin, .78); x.beginPath(); x.arc(-8, 1.4, 1, 0, 7); x.fill(); }
  }

  /* ---------------- staffs (grip-local: 0,0 is the hand, shaft runs to y=+30 at the ground) ---------------- */
  function drawStaffHD(x, id, l, m, power, fl) {
    const wood = fl ? '#fff' : '#9a6a36', woodD = '#5e3a1c'; x.lineCap = 'round'; x.lineJoin = 'round';
    const wand = id === 'wand', top = wand ? -30 : -33, bot = wand ? 16 : 30;
    x.strokeStyle = '#000'; x.lineWidth = LW * (wand ? 4.4 : 5.4); x.beginPath(); x.moveTo(0, bot); x.lineTo(0, top); x.stroke();
    x.strokeStyle = wood; x.lineWidth = LW * (wand ? 2.2 : 3); x.stroke();
    if (!fl) { x.strokeStyle = '#d9a866'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(-.8, bot - 2); x.lineTo(-.8, top + 2); x.stroke(); x.strokeStyle = woodD; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(.9, 12); x.lineTo(.9, 20); x.moveTo(.9, -18); x.lineTo(.9, -12); x.stroke();
      x.strokeStyle = '#000'; x.lineWidth = LW * (3.6); x.beginPath(); x.moveTo(-2, -7.5); x.lineTo(2, -8.5); x.moveTo(-2, 7.5); x.lineTo(2, 6.5); x.stroke(); x.strokeStyle = '#ffd45e'; x.lineWidth = LW * (1.8); x.stroke(); }
    let gx = 0, gy = -44;
    if (id === 'crystal') {
      x.strokeStyle = '#000'; x.lineWidth = LW * (4.2); x.beginPath(); x.moveTo(-.6, -31); x.quadraticCurveTo(-6.4, -33.5, -4.6, -39.5); x.moveTo(.6, -31); x.quadraticCurveTo(6.4, -33.5, 4.6, -39.5); x.stroke(); x.strokeStyle = wood; x.lineWidth = LW * (2); x.stroke();
      const cg = x.createLinearGradient(-5, -54, 5, -36); cg.addColorStop(0, '#ffffff'); cg.addColorStop(.45, l); cg.addColorStop(1, m);
      fs(x, 'M0,-55 L5.4,-46 L2.8,-36.5 L-2.8,-36.5 L-5.4,-46 Z', fl ? '#fff' : cg, 2.2);
      if (!fl) { x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(0, -55); x.lineTo(-1.2, -36.5); x.moveTo(-5.4, -46); x.lineTo(5.4, -46); x.stroke(); } gy = -46;
    } else if (wand) {
      x.save(); x.translate(0, -39); x.rotate(-.2); star5(x, 0, 0, 9.4); x.fillStyle = fl ? '#fff' : vgrad(x, -9, 9, '#fff6c8', '#ffb020'); x.fill(); x.lineWidth = LW * (2.2); x.strokeStyle = '#000'; x.stroke(); if (!fl) { star5(x, -.6, -.8, 4); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill(); } x.restore();
      if (!fl) { x.strokeStyle = '#000'; x.lineWidth = LW * (3); x.beginPath(); x.moveTo(.5, -29.5); x.quadraticCurveTo(6, -27, 5, -21); x.moveTo(-.5, -29.5); x.quadraticCurveTo(-5.5, -26, -3.6, -20.5); x.stroke(); x.strokeStyle = '#ff5d8a'; x.lineWidth = LW * (1.5); x.stroke(); } gy = -39;
    } else if (id === 'skull') {
      x.fillStyle = fl ? '#fff' : '#f1ead8'; x.strokeStyle = '#000'; x.lineWidth = LW * (2.2);
      x.beginPath(); x.moveTo(-3.6, -36); x.lineTo(3.6, -36); x.lineTo(3.9, -32.2); x.lineTo(-3.9, -32.2); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.arc(0, -41.5, 6.4, 0, 7); x.fill(); x.stroke();
      if (!fl) { x.fillStyle = '#d9ceb4'; x.beginPath(); x.arc(2.4, -39.6, 5, -.4, 1.5); x.arc(0, -41.5, 6.2, 1.2, -.3, true); x.fill(); x.fillStyle = '#20141a'; x.beginPath(); x.ellipse(-2.6, -41.6, 1.9, 2.3, 0, 0, 7); x.ellipse(2.6, -41.6, 1.9, 2.3, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(0, -39.6); x.lineTo(-.9, -37.8); x.lineTo(.9, -37.8); x.fill();
        x.fillStyle = l; x.beginPath(); x.arc(-2.6, -41.4, .9, 0, 7); x.arc(2.6, -41.4, .9, 0, 7); x.fill(); x.strokeStyle = '#000'; x.lineWidth = LW * (.9); x.beginPath(); for (const tx of [-1.8, 0, 1.8]) { x.moveTo(tx, -36); x.lineTo(tx, -32.4); } x.stroke(); } gy = -41.5;
    } else if (id === 'moon') {
      fs(x, 'M-2.6,-54.5 A9,9 0 1,0 7.6,-40 A7,7 0 1,1 -2.6,-54.5 Z', fl ? '#fff' : vgrad(x, -55, -34, '#fffbe0', '#ffd45e'), 2.2);
      if (!fl) { x.strokeStyle = '#000'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(3.6, -47.6); x.lineTo(3.6, -44.6); x.stroke(); star4(x, 3.6, -42.6, 2.6, '#fff'); x.lineWidth = LW * (.9); x.strokeStyle = '#000'; x.stroke(); } gx = 1; gy = -44.5;
    } else { // oak crook cradling an orb
      const crook = 'M0,-32 C-1,-37.5 -8.2,-39 -8.4,-46 C-8.4,-52.4 -.6,-55 4,-51 C7.4,-47.8 5.6,-43 2,-43.4';
      x.strokeStyle = '#000'; x.lineWidth = LW * (5.6); x.stroke(path(crook)); x.strokeStyle = wood; x.lineWidth = LW * (3.1); x.stroke(path(crook));
      if (!fl) { x.strokeStyle = '#d9a866'; x.lineWidth = LW * (.9); x.stroke(path('M-7.6,-45.6 C-7.4,-50.4 -2,-52.8 2.4,-50.6')); }
      const og = x.createRadialGradient(-2.6, -48.4, .5, -1.2, -46.6, 4.6); og.addColorStop(0, '#ffffff'); og.addColorStop(.4, l); og.addColorStop(1, m);
      x.fillStyle = fl ? '#fff' : og; x.strokeStyle = '#000'; x.lineWidth = LW * (1.9); x.beginPath(); x.arc(-1.2, -46.6, 4.3, 0, 7); x.fill(); x.stroke(); gx = -1.2; gy = -46.6;
    }
    if (!fl) glow(x, gx, gy, 9 + power * 9, l, m, .45 + power * .5);
  }

  /* ---------------- wizard hats (brim-local: 0,0 = centre of the brim) ---------------- */
  const HAT = {
    pointy: 'M-9,-1.4 C-7,-10 -5.5,-16 -7,-21.5 C-8,-25.5 -11.5,-27.8 -15,-28 C-10,-31.8 -3.5,-30 0,-24.5 C4,-18 8,-9.5 9.6,-1.4 Q0,-4.8 -9,-1.4 Z',
    witch: 'M-8.4,-1.6 C-7.4,-9 -4.6,-17 -1.4,-22.4 C1.8,-27.6 8,-31 15.6,-29.8 C10.6,-27.4 8.8,-23.6 8.8,-19 C9,-13 9.6,-7 9.8,-1.6 Q.6,-5 -8.4,-1.6 Z',
    feathered: 'M-9,-1.4 C-7.4,-9 -6.4,-14 -8,-18 C-9,-21 -12,-22.6 -15,-22.4 C-10.4,-26.6 -3.4,-25.4 0,-20 C3.6,-14.4 8,-8 9.6,-1.4 Q0,-4.8 -9,-1.4 Z',
    mushroom: 'M-19.5,-1.2 C-19.5,-14.5 -9.5,-21 0,-21 C9.5,-21 19.5,-14.5 19.5,-1.2 Q0,-5.6 -19.5,-1.2 Z',
    crown: 'M-9.6,2.4 L-11.8,-9.6 L-5.8,-4.6 L0,-13 L5.8,-4.6 L11.8,-9.6 L9.6,2.4 Q0,-.6 -9.6,2.4 Z',
  };
  function drawHatHD(x, w, pass, fl, sway) {
    const id = w.hatId || 'pointy', c = w.robe, trim = w.trim;
    if (id === 'hood') {
      // head-local shapes (head centre 0,0)
      if (pass === 'back') { const hood = 'M-11.8,9.6 C-15.4,-2 -13.4,-11.8 -3.6,-13.8 C-9,-15.4 -13,-19.6 -16,-18.2 C-13.6,-22.6 -5.4,-23 1.8,-15.4 C9.4,-14.4 13.8,-7.2 13.4,1 C13.2,5 12.2,7.6 10.6,9.8 Z';
        fs(x, hood, fl ? '#fff' : vgrad(x, -22, 10, c[0], c[1]), 2.8); if (!fl) within(x, hood, () => { x.fillStyle = c[2]; x.globalAlpha = .4; x.fillRect(4, -24, 14, 40); x.globalAlpha = .5; x.strokeStyle = '#fff'; x.lineWidth = LW * (1.5); x.beginPath(); x.moveTo(-11.4, 4); x.quadraticCurveTo(-13.6, -6, -6, -11.6); x.stroke(); }); }
      else { x.lineCap = 'round'; x.strokeStyle = '#000'; x.lineWidth = LW * (6.6); x.beginPath(); x.arc(0, 0, 10.4, Math.PI * 1.03, Math.PI * 1.99); x.stroke(); x.strokeStyle = fl ? '#fff' : c[0]; x.lineWidth = LW * (4); x.stroke(); if (!fl) { x.strokeStyle = trim; x.lineWidth = LW * (1.3); x.beginPath(); x.arc(0, 0, 11.4, Math.PI * 1.08, Math.PI * 1.94); x.stroke(); } }
      return;
    }
    if (pass !== 'front') return;
    x.save(); x.translate(0, -7.4);                          // head-local -> brim-local
    x.rotate(sway * .02);
    if (id === 'crown') {
      fs(x, HAT.crown, fl ? '#fff' : vgrad(x, -13, 3, '#fff3b0', '#e39a14'), 2.4);
      if (!fl) { within(x, HAT.crown, () => { x.fillStyle = '#b8760e'; x.globalAlpha = .5; x.fillRect(3, -14, 12, 20); x.globalAlpha = 1; x.fillStyle = '#b8760e'; x.fillRect(-12, -1.6, 24, 1.2); x.strokeStyle = '#fff8'; x.lineWidth = LW * (1.2); x.beginPath(); x.moveTo(-9.6, -6.4); x.lineTo(-8.6, .4); x.stroke(); });
        const gem = (gx, gy, r, col) => { x.fillStyle = col; x.strokeStyle = '#000'; x.lineWidth = LW * (1.2); x.beginPath(); x.arc(gx, gy, r, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(gx - r * .3, gy - r * .35, r * .32, 0, 7); x.fill(); };
        gem(0, -4.6, 2.5, '#ff4a5a'); gem(-6.2, -1.4, 1.6, '#5cc8ff'); gem(6.2, -1.4, 1.6, '#5cc8ff'); gem(-11.8, -10.4, 1.7, '#fff3d0'); gem(0, -13.8, 1.9, '#fff3d0'); gem(11.8, -10.4, 1.7, '#fff3d0'); }
      x.restore(); return;
    }
    if (id === 'mushroom') {
      x.fillStyle = fl ? '#fff' : '#f6ead0'; x.strokeStyle = '#000'; x.lineWidth = LW * (2.2); x.beginPath(); x.ellipse(0, -.2, 15, 3.4, 0, 0, 7); x.fill(); x.stroke();
      if (!fl) { x.strokeStyle = '#c9b48a'; x.lineWidth = LW * (.9); x.beginPath(); for (let i = -4; i <= 4; i++) { x.moveTo(i * 3, -1.6); x.lineTo(i * 3.3, 2.2); } x.stroke(); }
      fs(x, HAT.mushroom, fl ? '#fff' : vgrad(x, -21, -1, '#ff6a55', '#c8281e'), 2.6);
      if (!fl) within(x, HAT.mushroom, () => { x.fillStyle = '#7a1210'; x.globalAlpha = .38; x.beginPath(); x.ellipse(13, -4, 12, 16, 0, 0, 7); x.fill(); x.globalAlpha = 1; x.fillStyle = '#fff8ee'; [[-9.5, -9, 3.4, 2.8], [2.6, -14.6, 4, 3.2], [11.6, -8, 2.8, 2.4], [-2.4, -5.6, 2.2, 1.7], [-15, -3.6, 2.2, 1.8]].forEach(([a, b, rx, ry]) => { x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, 7); x.fill(); }); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = LW * (1.6); x.lineCap = 'round'; x.beginPath(); x.moveTo(-15.6, -8.6); x.quadraticCurveTo(-13, -15.4, -6.6, -18.6); x.stroke(); });
      x.restore(); return;
    }
    const wide = id === 'witch', rx = wide ? 22 : 16, cone = HAT[id] || HAT.pointy;
    // brim
    const brim = new Path2D(); brim.ellipse(0, 0, rx, wide ? 4.9 : 4.3, -.04, 0, 7);
    fs(x, brim, fl ? '#fff' : vgrad(x, -4, 4, c[0], c[1]), 2.6);
    if (!fl) within(x, brim, () => { x.fillStyle = c[2]; x.globalAlpha = .55; x.beginPath(); x.ellipse(0, 3.4, rx + 2, 3.6, 0, 0, 7); x.fill(); x.globalAlpha = .5; x.strokeStyle = '#fff'; x.lineWidth = LW * (1.1); x.beginPath(); x.ellipse(0, .3, rx - 1.6, 3, -.04, Math.PI * 1.08, Math.PI * 1.5); x.stroke(); });
    // cone
    fs(x, cone, fl ? '#fff' : vgrad(x, -30, -1, c[0], c[1]), 0);
    if (!fl) within(x, cone, () => {
      x.fillStyle = c[2]; x.globalAlpha = .42; x.beginPath(); x.moveTo(2.4, -36); x.bezierCurveTo(6, -22, 5.4, -10, 4.6, 4); x.lineTo(24, 4); x.lineTo(24, -36); x.closePath(); x.fill(); x.globalAlpha = 1;
      // band + buckle
      x.fillStyle = trim; x.beginPath(); x.moveTo(-11, -6.2); x.quadraticCurveTo(0, -9.6, 12, -6.2); x.lineTo(12, -.4); x.quadraticCurveTo(0, -3.8, -11, -.4); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(-11, -6.2); x.quadraticCurveTo(0, -9.6, 12, -6.2); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = LW * (1.5); x.lineCap = 'round'; x.beginPath(); if (wide) { x.moveTo(-6, -8); x.quadraticCurveTo(-3.6, -17, .6, -23); } else { x.moveTo(-6.6, -8.6); x.bezierCurveTo(-5, -13, -4, -17, -5.4, -21); } x.stroke();
      x.strokeStyle = c[2]; x.lineWidth = LW * (1.2); x.beginPath(); if (wide) { x.moveTo(1, -22.6); x.quadraticCurveTo(5, -22, 8.4, -24.6); } else if (id === 'feathered') { x.moveTo(-7.4, -16.6); x.quadraticCurveTo(-3.4, -17, -.6, -20); } else { x.moveTo(-6.6, -19.6); x.quadraticCurveTo(-2.6, -20.4, .4, -24); } x.stroke();
    });
    x.lineWidth = LW * (2.6); x.strokeStyle = '#000'; x.stroke(path(cone));
    if (!fl) {
      const bx = wide ? 0 : -.6; x.fillStyle = '#ffd45e'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.3); x.beginPath(); x.rect(bx - 2.9, -9.3, 5.8, 5.8); x.fill(); x.stroke(); x.fillStyle = mul(c[2], .9); x.fillRect(bx - 1.2, -7.6, 2.4, 2.4);
      if (id === 'pointy') { star4(x, 3.4, -14.6, 2.6, '#ffe58a'); star4(x, -2.6, -24.4, 1.5, '#ffe58a'); }
      if (wide) { star4(x, 3.6, -15.4, 2.2, '#ffe58a'); x.fillStyle = '#ffe58a'; x.beginPath(); x.arc(-2.6, -12, 2.2, .6, 4.2); x.arc(-1.6, -12.6, 1.8, 4, .8, true); x.fill(); }
      if (id === 'feathered') {
        const fe = 'M7.6,-4.4 C9.6,-15 14.6,-24 23,-29 C23.4,-19 18.4,-9.4 10.6,-2.8 Z';
        x.save(); x.translate(8, -4); x.rotate(sway * .03); x.translate(-8, 4); fs(x, fe, vgrad(x, -29, -3, '#ff8a96', '#e0344a'), 2);
        within(x, fe, () => { x.strokeStyle = '#ffd0d4'; x.lineWidth = LW * (1.1); x.beginPath(); x.moveTo(9, -4.4); x.bezierCurveTo(11.6, -14, 16.4, -22, 22.4, -27.6); x.stroke(); x.strokeStyle = '#a81a30'; x.lineWidth = LW * (.8); x.beginPath(); for (let i = 0; i < 5; i++) { const fy = -8 - i * 4, fx = 10.6 + i * 2.2; x.moveTo(fx, fy); x.lineTo(fx + 4, fy + 1.4); } x.stroke(); }); x.restore();
      }
    }
    x.restore();
  }

  /* ---------------- WIZARD ---------------- */
  const ROBE = 'M-8.5,-41 C-13,-30 -17,-14 -19,-4 Q-14,-.4 -9.5,-4.4 Q-4.7,-.4 0,-4.4 Q4.7,-.4 9.5,-4.4 Q14,-.4 19,-4 C17,-14 13,-30 8.5,-41 Z';
  const HEM = 'M-19,-4 Q-14,-.4 -9.5,-4.4 Q-4.7,-.4 0,-4.4 Q4.7,-.4 9.5,-4.4 Q14,-.4 19,-4';
  const MANTLE = 'M-7,-43.5 C-12,-42 -15,-36.8 -15.6,-31.8 Q-12,-28.8 -8.7,-32.2 Q-4.4,-28.4 0,-31.8 Q4.4,-28.4 8.7,-32.2 Q12,-28.8 15.6,-31.8 C15,-36.8 12,-42 7,-43.5 Z';
  const MANTLE_EDGE = 'M-15.6,-31.8 Q-12,-28.8 -8.7,-32.2 Q-4.4,-28.4 0,-31.8 Q4.4,-28.4 8.7,-32.2 Q12,-28.8 15.6,-31.8';
  const BOOT = 'M-4.6,-7 L-4.6,-1 Q-4.6,1.6 -2,1.6 L5.2,1.6 Q9.8,1.6 9.6,-2.4 Q9.4,-5.2 6.4,-4.8 Q8,-2.8 5.4,-2.3 L1.8,-2.5 L1.8,-7 Z';
  const BEARD = {
    short: 'M-8.8,2.2 C-9.4,9 -4.6,16.4 1.6,18.8 C7.6,16.4 10.4,9.6 9.8,3.2 C8.2,5.6 5.6,5.8 3.6,4 C1.6,5.8 -1.2,5.6 -2.8,3.8 C-4.6,5.4 -7.2,4.8 -8.8,2.2 Z',
    long: 'M-8.8,2.2 C-10.4,12 -7.4,24 -2.4,31 C-.8,33.4 .8,35.6 2,38 C3.4,35.4 5,32.6 6.2,30 C10.2,22 10.8,11 9.8,3.2 C8.2,5.6 5.6,5.8 3.6,4 C1.6,5.8 -1.2,5.6 -2.8,3.8 C-4.6,5.4 -7.2,4.8 -8.8,2.2 Z',
  };
  const STACHE = 'M3.6,3.5 C5.6,2.3 9.6,3.5 11.8,6.8 C8.8,6.9 6,6.5 3.8,5.2 C2,6.5 -1.6,7 -4.8,7.1 C-3,3.8 1.4,2.3 3.6,3.5 Z';
  const SLEEVE = 'M-2.9,-.6 C-4.8,4.6 -6,10 -6.6,15.4 Q-1.5,18.6 4.6,15.4 C4.3,10 3.5,4.6 2.7,-.6 Z';

  function drawWizHD(w, X, ava) {
    const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
    const pose = poseOf(w), prog = pose === 'charge' ? (w.prog === undefined ? .8 : w.prog) : progOf(w), t = w.t || 0;
    const mv = Math.hypot(w.vx || 0, w.vy || 0), walk = ava ? 0 : Math.min(1, mv / 25), bob = ava ? 0 : Math.abs(Math.sin(t * 9)) * 3 * walk + (w.jump || 0);
    const breathe = ava ? 0 : Math.sin(t * 2.6) * .5, sway = ava ? 0 : Math.sin(t * 5) * 2;
    if (!ava) { x.fillStyle = 'rgba(8,4,18,.36)'; x.beginPath(); x.ellipse(0, .5, 20, 6, 0, 0, 7); x.fill(); }
    if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(t * 20) * .06;
    if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(t * 12) * .1;
    if (w.dead && !w.pose) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4); }
    if (w.slump || pose === 'weary') { x.rotate(.1 * (w.face || 1)); x.translate(0, 1.5); }
    x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018);
    if (pose === 'hurt') x.rotate(-.13); if (pose === 'cast') x.rotate(.05);
    x.translate(0, -bob);
    const [l, m] = elOf(w), fl = w.flash > 0 && !w.pose, c = w.robe, trim = w.trim, F = col => fl ? '#fff' : col;
    const casting = pose === 'cast', power = casting ? 1 : pose === 'charge' ? prog * .7 : prog * .5;
    x.lineJoin = 'round'; x.lineCap = 'round';
    // boots
    const step = Math.sin(t * 9) * walk * 2.4;
    for (const [bx, s] of [[-7 + step, 0], [6 - step, 1]]) { x.save(); x.translate(bx, 0); fs(x, BOOT, F(s ? '#4a2c18' : '#5e3a20'), 2.2); if (!fl) { x.strokeStyle = '#c98a4a'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(1, .4); x.lineTo(6, .4); x.stroke(); } x.restore(); }
    // robe
    x.save(); x.translate(0, -breathe * .4);
    fs(x, ROBE, fl ? '#fff' : vgrad(x, -42, 0, c[0], c[1]), 0);
    if (!fl) within(x, ROBE, () => {
      x.fillStyle = c[2]; x.globalAlpha = .45; x.beginPath(); x.moveTo(4.4, -44); x.bezierCurveTo(8.6, -30, 9.6, -14, 8.4, 2); x.lineTo(26, 2); x.lineTo(26, -44); x.closePath(); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = c[2]; x.globalAlpha = .7; x.lineWidth = LW * (1.3); x.beginPath(); x.moveTo(-3.4, -18.5); x.bezierCurveTo(-4.6, -13, -5.4, -9, -5, -5.2); x.moveTo(5.2, -19); x.bezierCurveTo(6.2, -13, 6, -9, 5.2, -5.6); x.moveTo(-11.6, -14); x.quadraticCurveTo(-13, -9, -13.6, -5.6); x.stroke(); x.globalAlpha = 1;
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = LW * (1.9); x.beginPath(); x.moveTo(-9.8, -35); x.bezierCurveTo(-12.8, -24, -15.2, -14.6, -16.4, -8.6); x.stroke();
      // hem band
      x.strokeStyle = trim; x.lineWidth = LW * (6.4); x.stroke(path(HEM)); x.save(); x.translate(0, -3.6); x.strokeStyle = mul(c[2], .8); x.lineWidth = LW * (1); x.stroke(path(HEM)); x.restore();
      star4(x, -10.6, -13.4, 2.1, trim); star4(x, 10.4, -11.6, 1.7, trim); star4(x, -1.6, -11, 1.4, trim); star4(x, 12.2, -27, 1.3, trim);
    });
    x.lineWidth = LW * (3); x.strokeStyle = '#000'; x.stroke(path(ROBE));
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') drawWounds(x, w, 'robe');
    // belt, buckle, potion and pouch
    fs(x, 'M-12.6,-24.4 Q0,-20.8 12.9,-24.4 L13.7,-20.2 Q0,-16.6 -13.5,-20.2 Z', F(mul(c[2], .75)), 1.8);
    if (!fl) {
      x.fillStyle = '#ffd45e'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.4); x.beginPath(); x.rect(-1.4, -23.9, 5.4, 5.8); x.fill(); x.stroke(); x.fillStyle = mul(c[2], .7); x.fillRect(.2, -22.3, 2.2, 2.6);
      fs(x, 'M7.4,-19.8 L13,-20.6 Q15.2,-13.6 10.6,-12.4 Q6.2,-12.8 7.4,-19.8 Z', '#7a4a22', 1.6); x.strokeStyle = '#000'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(7.4, -17.4); x.quadraticCurveTo(10.4, -15.6, 13.8, -17.6); x.stroke(); x.fillStyle = '#ffd45e'; x.beginPath(); x.arc(10.5, -16, .9, 0, 7); x.fill();
      // potion on the hip, filled with the colour of the spell being readied
      x.strokeStyle = '#000'; x.lineWidth = LW * (1.4); x.fillStyle = '#eaf6ff'; x.beginPath(); x.rect(-10.6, -20.4, 2.6, 3); x.fill(); x.stroke(); x.beginPath(); x.arc(-9.3, -14.2, 3.4, 0, 7); x.fill(); x.stroke();
      x.save(); x.beginPath(); x.arc(-9.3, -14.2, 2.7, 0, 7); x.clip(); x.fillStyle = m; x.fillRect(-13, -14.6, 8, 5); x.fillStyle = l; x.fillRect(-13, -15.2, 8, 1); x.restore(); x.fillStyle = '#fff'; x.beginPath(); x.arc(-10.4, -15.4, .7, 0, 7); x.fill(); x.fillStyle = '#8a5a2a'; x.fillRect(-10.4, -21.6, 2.2, 1.5);
    }
    // back sleeve + staff
    const sx = casting ? 15 : 12.5, sy = casting ? -31 : -29, rot = casting ? .42 : pose === 'hurt' ? -.5 : pose === 'cheer' ? -.12 : -.1 - prog * .16 + Math.sin(t * 2.6) * .015;
    fs(x, casting ? 'M5.6,-40.4 C11,-40 16.6,-37 18.6,-32.4 Q15.4,-28 11,-29.6 C10.4,-33.4 8.4,-37 5.6,-40.4 Z' : 'M5.6,-40.4 C10,-39.6 14.6,-36.4 16,-31.2 Q12.8,-27 8.6,-29.2 C8.6,-33 7.4,-36.8 5.6,-40.4 Z', F(c[1]), 2.4);
    x.save(); x.translate(sx, sy + (pose === 'cheer' ? -6 : 0)); x.rotate(rot);
    drawStaffHD(x, w.staffId || 'oak', l, m, power, fl);
    x.fillStyle = F(w.skin); x.strokeStyle = '#000'; x.lineWidth = LW * (2.2); x.beginPath(); x.ellipse(0, 0, 3.7, 3.3, 0, 0, 7); x.fill(); x.stroke(); if (!fl) { x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-2.8, -.8); x.lineTo(1.6, -.8); x.moveTo(-2.8, .9); x.lineTo(1.4, .9); x.stroke(); }
    x.restore();
    // mantle (capelet over the shoulders)
    const mantle = () => {
      fs(x, MANTLE, fl ? '#fff' : vgrad(x, -44, -29, mix(c[0], '#ffffff', .14), c[1]), 0);
      if (!fl) within(x, MANTLE, () => { x.fillStyle = c[2]; x.globalAlpha = .4; x.fillRect(5, -46, 14, 20); x.globalAlpha = 1; x.strokeStyle = trim; x.lineWidth = 4.2; x.stroke(path(MANTLE_EDGE)); x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(-9, -41); x.quadraticCurveTo(-13, -38, -13.8, -33.6); x.stroke(); });
      x.lineWidth = LW * 2.6; x.strokeStyle = '#000'; x.stroke(path(MANTLE));
    };
    // front arm goes under the capelet, and under the beard when it reaches across
    const ang = casting ? -1.72 : pose === 'charge' ? -.5 - prog * .75 : pose === 'hurt' ? 1.05 : pose === 'cheer' ? 2.72 : pose === 'weary' ? .12 : .22 + Math.sin(t * 3) * .08 - prog * .4;
    x.save(); x.translate(-6.4, -37.4 - breathe * .6); x.rotate(ang);
    fs(x, SLEEVE, fl ? '#fff' : vgrad(x, 0, 17, c[0], c[1]), 0);
    if (!fl) within(x, SLEEVE, () => { x.fillStyle = c[2]; x.globalAlpha = .4; x.fillRect(.8, -2, 8, 22); x.globalAlpha = 1; x.strokeStyle = trim; x.lineWidth = LW * (4); x.beginPath(); x.moveTo(-6.6, 15.6); x.quadraticCurveTo(-1.5, 18.8, 4.6, 15.6); x.stroke(); });
    x.lineWidth = LW * (2.5); x.strokeStyle = '#000'; x.stroke(path(SLEEVE));
    x.fillStyle = F(w.skin); x.lineWidth = LW * (2.1); x.beginPath(); x.ellipse(-1.2, 19, 3.6, 3.3, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(1.6, 17.6, 1.5, 0, 7); x.fill(); x.stroke();
    if (!fl && (casting || pose === 'charge')) { glow(x, -1.2, 21, casting ? 13 : 5 + prog * 7, l, m, casting ? .95 : .5 + prog * .4); if (casting) { x.strokeStyle = '#fff'; x.lineWidth = LW * (1.4); for (let i = 0; i < 5; i++) { const a = 1.571 + (i - 2) * .42; x.beginPath(); x.moveTo(-1.2 + Math.cos(a) * 9, 21 + Math.sin(a) * 9); x.lineTo(-1.2 + Math.cos(a) * 14, 21 + Math.sin(a) * 14); x.stroke(); } } }
    x.restore();
    mantle();
    x.restore();
    // head
    x.save(); x.translate(1, -48.5 - breathe + (pose === 'weary' ? 1.6 : 0)); if (pose === 'weary') x.rotate(.12); if (pose === 'hurt') x.rotate(-.1);
    drawHatHD(x, w, 'back', fl, sway);
    drawHeadBase(x, w.skin, fl);
    const beard = w.beardStyle || 'short', bc = w.beardC || '#eef2ff';
    if (!fl) drawFace(x, w, pose, { eyeY: .6, brow: beard === 'none' ? '#3a2616' : mul(bc, .82), sharp: false, mouth: beard === 'none' });
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') { x.save(); x.translate(-1, 48.5); drawWounds(x, w, 'head'); x.restore(); }
    if (beard !== 'none') {
      const bp = BEARD[beard] || BEARD.short; x.save(); x.translate(0, 1.1); x.rotate(sway * (beard === 'long' ? .014 : .006));
      fs(x, bp, F(bc), 0);
      if (!fl) within(x, bp, () => { x.fillStyle = mul(bc, .74); x.globalAlpha = .55; x.beginPath(); x.moveTo(3.4, 2); x.bezierCurveTo(6, 12, 5, 26, 2.6, 40); x.lineTo(14, 40); x.lineTo(14, 2); x.closePath(); x.fill(); x.globalAlpha = 1; x.strokeStyle = mul(bc, .66); x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-3.6, 8.6); x.quadraticCurveTo(-2.6, 12.6, -.4, 15.4); x.moveTo(.6, 8); x.quadraticCurveTo(1.6, 11.6, 1.8, 15.6); if (beard === 'long') { x.moveTo(-4.6, 17); x.quadraticCurveTo(-2.6, 23, .2, 28); x.moveTo(3.4, 18); x.quadraticCurveTo(3.6, 23, 2.6, 28); } x.stroke(); });
      x.lineWidth = LW * (2.4); x.strokeStyle = '#000'; x.stroke(path(bp));
      if (beard === 'long' && !fl) { fs(x, 'M-1.4,30.4 Q2,32 5.4,30 L4.6,33 Q2,34.4 -.4,33.2 Z', trim, 1.3); }
      fs(x, STACHE, F(mix(bc, '#ffffff', .25)), 1.7);
      x.restore();
    }
    drawHatHD(x, w, 'front', fl, sway);
    x.restore();
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') drawWounds(x, w, 'top');
    x.restore();
  }

  /* ---------------- SORCERER ---------------- */
  const GI = 'M-9.6,-42 C-13.8,-38.4 -14.4,-30 -12.8,-21.6 Q0,-18 12.8,-21.6 C14.4,-30 13.8,-38.4 9.6,-42 Q0,-45 -9.6,-42 Z';
  const GI_SKIRT = 'M-12.8,-22.4 Q0,-19 12.8,-22.4 L14.6,-15 Q7.6,-12.4 .6,-14.8 Q-6.4,-12.4 -14.6,-15 Z';
  const LEG_F = 'M1.4,-21.4 C-7.4,-21 -14.4,-15.4 -13.6,-7.4 L-12.4,-4.2 L-5.6,-4.2 C-5.8,-8.6 -3,-12.6 2,-14.6 Z';
  const LEG_B = 'M-1.4,-21.4 C7.4,-21 14.4,-15.4 13.6,-7.4 L12.4,-4.2 L5.6,-4.2 C5.8,-8.6 3,-12.6 -2,-14.6 Z';
  const HAIR = 'M-9.4,1.6 L-12.8,-3 L-9.2,-4.4 L-13.2,-10.8 L-7.2,-9.2 L-7.8,-16.6 L-2,-12 L1.6,-18.6 L4.2,-11.8 L9.8,-16 L9,-8.8 L13,-7.6 L9.8,-3.4 C6,-6.8 -1,-7 -5.4,-4.2 C-7.4,-2.8 -8.6,-.6 -9.4,1.6 Z';
  const HAIR_CAP = 'M-9.4,1.6 C-11.4,-6 -6.2,-11.8 0,-11.6 C6.2,-11.8 10.8,-7.6 9.8,-3.4 C6,-6.8 -1,-7 -5.4,-4.2 C-7.4,-2.8 -8.6,-.6 -9.4,1.6 Z';
  /* Hairstyles (wardrobe: Hairstyle). Each shares the hairline of the original so the headband still sits right. */
  const HAIR_STYLES = {
    spiky: HAIR,
    wild: 'M-9.4,1.6 L-15,-1 L-10.6,-5 L-17,-9.6 L-10,-10.6 L-13,-18.6 L-5.6,-14 L-4,-22 L.6,-14.4 L5,-20.6 L6.6,-12.6 L12.6,-15 L10.6,-8.4 L14.6,-5.4 L9.8,-3.4 C6,-6.8 -1,-7 -5.4,-4.2 C-7.4,-2.8 -8.6,-.6 -9.4,1.6 Z',
    mohawk: 'M-9.4,1.6 C-10.4,-3.4 -7.6,-8 -3.6,-9.6 L-5,-17 L-1.4,-13.6 L.4,-21.4 L2.8,-13.8 L6,-18 L6.2,-10.4 C9.4,-9 10.6,-6 9.8,-3.4 C6,-6.8 -1,-7 -5.4,-4.2 C-7.4,-2.8 -8.6,-.6 -9.4,1.6 Z',
    bob: 'M-10.8,7 C-13.6,-5 -7.6,-12.8 0,-12.6 C7.6,-12.8 13,-6 10.8,6 C9.6,2.4 9.2,-.8 8.8,-3.6 C5,-6.6 -1,-6.8 -5,-4.4 C-7.8,-2.2 -9.6,2.4 -10.8,7 Z',
    long: 'M-9.8,2 C-12,-6.4 -6.4,-12.4 0,-12.2 C6.4,-12.4 11.2,-7.8 9.8,-3.4 C6,-6.8 -1,-7 -5.4,-4.2 C-7.4,-2.8 -8.8,-.4 -9.8,2 Z',
    bald: null,
  };
  const HAIR_BACK = { long: 'M-10,-3 C-15.6,5 -16.4,15 -13.4,24 L-7.6,21.6 L-5.4,25.4 L-1.6,20.4 C-5.6,13 -5.6,5 -3.6,-1 Z', bob: 'M-10.6,-2 C-13.4,3 -12.6,8.4 -9.6,11 L-5,8 C-7,5 -7,1 -5.6,-2 Z' };
  window.HAIR_STYLE_IDS = Object.keys(HAIR_STYLES);
  const BAND = 'M-9,-3.4 C-4,-7 5,-7.4 10,-3.8 L9.8,-1 C5,-4.4 -4,-4 -8.8,-.5 Z';
  const ARMS = {      // [shoulder, elbow, hand] for the lead arm (front, +x) and the rear arm (-x)
    idle:   { lead: [[8, -38.6], [15.6, -31.6], [17.6, -40]], rear: [[-8.4, -38.4], [-14, -31.4], [-8, -27.6]] },
    charge: { lead: [[8, -38.6], [14, -34.4], [19.6, -38.6]], rear: [[-8.4, -38.4], [-15.6, -33.4], [-13.4, -26.4]] },
    cast:   { lead: [[8, -38.6], [13.4, -31.4], [8.4, -29.6]], rear: [[-7, -38.4], [5, -37.6], [19.4, -38.6]] },
    hurt:   { lead: [[8, -38.6], [14.6, -42], [17.6, -49]], rear: [[-8.4, -38.4], [-15, -41], [-17.6, -47.6]] },
    weary:  { lead: [[8, -38.6], [12, -30.4], [12.6, -21.6]], rear: [[-8.4, -38.4], [-12.4, -30.4], [-13, -21.6]] },
    cheer:  { lead: [[8, -38.6], [14.4, -45.4], [12.6, -56.4]], rear: [[-8.4, -38.4], [-14, -31.6], [-9, -26.6]] },
  };
  ARMS.ko = ARMS.hurt;
  const lerpP = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  function drawArm(x, pts, sleeve, skin, fl, opt) {
    const [S, E, H] = pts; x.lineCap = 'round'; x.lineJoin = 'round';
    // forearm (skin) with wraps
    x.strokeStyle = '#000'; x.lineWidth = LW * (7); x.beginPath(); x.moveTo(E[0], E[1]); x.lineTo(H[0], H[1]); x.stroke();
    x.strokeStyle = fl ? '#fff' : skin; x.lineWidth = LW * (4.4); x.stroke();
    if (!fl) { const dx = H[0] - E[0], dy = H[1] - E[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; x.strokeStyle = '#f3ead8'; x.lineWidth = LW * (4.4); x.beginPath(); x.moveTo(E[0] + dx * .4, E[1] + dy * .4); x.lineTo(E[0] + dx * .95, E[1] + dy * .95); x.stroke(); x.strokeStyle = '#b9a98a'; x.lineWidth = LW * (.9); x.beginPath(); for (const f of [.46, .6, .74]) { x.moveTo(E[0] + dx * f + nx * 2.2, E[1] + dy * f + ny * 2.2); x.lineTo(E[0] + dx * (f + .07) - nx * 2.2, E[1] + dy * (f + .07) - ny * 2.2); } x.stroke(); }
    // sleeve (upper arm)
    x.strokeStyle = '#000'; x.lineWidth = LW * (9.6); x.beginPath(); x.moveTo(S[0], S[1]); x.lineTo(S[0] + (E[0] - S[0]) * .82, S[1] + (E[1] - S[1]) * .82); x.stroke();
    x.strokeStyle = fl ? '#fff' : sleeve; x.lineWidth = LW * (7); x.stroke();
    if (!fl && opt.trim) { const ex = S[0] + (E[0] - S[0]) * .82, ey2 = S[1] + (E[1] - S[1]) * .82, dx = E[0] - S[0], dy = E[1] - S[1], L = Math.hypot(dx, dy) || 1; x.strokeStyle = opt.trim; x.lineWidth = LW * (1.8); x.lineCap = 'butt'; x.beginPath(); x.moveTo(ex - dy / L * 3.4 + dx / L * 2.4, ey2 + dx / L * 3.4 + dy / L * 2.4); x.lineTo(ex + dy / L * 3.4 + dx / L * 2.4, ey2 - dx / L * 3.4 + dy / L * 2.4); x.stroke(); x.lineCap = 'round'; }
    // fist: bare knuckles, wrap ends at the wrist
    const dx = H[0] - E[0], dy = H[1] - E[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    x.fillStyle = fl ? '#fff' : skin; x.strokeStyle = '#000'; x.lineWidth = LW * 2.2; x.beginPath(); x.arc(H[0], H[1], 4.1, 0, 7); x.fill(); x.stroke();
    if (!fl) { x.save(); x.beginPath(); x.arc(H[0], H[1], 3.3, 0, 7); x.clip(); x.fillStyle = 'rgba(0,0,0,.14)'; x.beginPath(); x.arc(H[0] - ux * 2.6 + 1.6, H[1] - uy * 2.6 + 1.8, 4, 0, 7); x.fill(); x.restore();
      x.strokeStyle = 'rgba(0,0,0,.75)'; x.lineWidth = .8; x.beginPath(); for (const kq of [-1.5, 0, 1.5]) { const bx = H[0] + ux * 1.3 - uy * kq, by = H[1] + uy * 1.3 + ux * kq; x.moveTo(bx, by); x.lineTo(bx + ux * 1.5, by + uy * 1.5); } x.stroke(); }
  }
  function sorcHead(x, w, pose, fl, t) {
    const gear = w.hatId || 'pointy', c = w.robe, trim = w.trim, hair = fl ? '#fff' : (w.beardStyle === 'none' || !w.beardC ? '#221a16' : w.beardC), hairD = mul(hair === '#fff' ? '#dddddd' : hair, .68);
    const flut = Math.sin(t * 6) * .12;
    if (gear === 'hood') drawHatHD(x, w, 'back', fl, 0);
    if (gear === 'feathered') { // topknot bun sits behind the head
      x.fillStyle = hair; x.strokeStyle = '#000'; x.lineWidth = LW * (2.2); x.beginPath(); x.arc(-4.4, -12.6, 4.6, 0, 7); x.fill(); x.stroke();
      if (!fl) { x.strokeStyle = trim; x.lineWidth = LW * (2); x.beginPath(); x.moveTo(-7.6, -9.6); x.lineTo(-1.4, -9.2); x.stroke(); fs(x, 'M-3.4,-13 C1,-20 7,-23.6 13,-24.6 C11,-19 6,-14 -1.4,-10.6 Z', vgrad(x, -25, -10, '#ff8a96', '#e0344a'), 1.6); }
    }
    { const hb = HAIR_BACK[w.hairStyle]; if (hb && gear !== 'hood' && gear !== 'feathered' && gear !== 'mushroom') fs(x, hb, fl ? '#fff' : hairD, 2); }   // hair that hangs behind the head
    drawHeadBase(x, w.skin, fl);
    const masked = gear === 'witch';
    if (!fl) drawFace(x, w, pose, { eyeY: 1.2, brow: mul(hair === '#fff' ? '#cccccc' : hair, .6), sharp: true, mouth: !masked });
    if (w.copyArmed > 0 && !fl) { x.fillStyle = '#ff2a3a'; x.beginPath(); x.arc(3.9, 1.2, 1.3, 0, 7); x.arc(-1.9, 1.2, 1.3, 0, 7); x.fill(); }
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') { x.save(); x.translate(-1, 49.5); drawWounds(x, w, 'head'); x.restore(); }
    if (masked) { const mk = 'M-8.9,3.2 C-3,1.4 5.4,1.6 9.4,2.8 C9.9,7.4 6.6,11 1.6,12 C-4.2,11.4 -8.4,8.2 -8.9,3.2 Z'; fs(x, mk, F2(fl, mul(c[2], .9)), 2); if (!fl) { x.strokeStyle = trim; x.lineWidth = LW * (1.2); x.beginPath(); x.moveTo(-8.6, 3.6); x.bezierCurveTo(-3, 2, 5.4, 2.2, 9.2, 3.2); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-2, 6); x.quadraticCurveTo(2, 7.4, 6, 6); x.moveTo(-1, 9); x.quadraticCurveTo(2, 10, 4.6, 9); x.stroke(); } }
    if (gear === 'hood') { drawHatHD(x, w, 'front', fl, 0); return; }
    const sleek = gear === 'feathered' || gear === 'mushroom', chosen = w.hairStyle && w.hairStyle in HAIR_STYLES ? HAIR_STYLES[w.hairStyle] : HAIR, hp = sleek ? HAIR_CAP : (chosen || HAIR_CAP), bald = !sleek && chosen === null;
    if (bald) { if (!fl) { x.save(); x.globalAlpha = .16; x.fillStyle = hair; x.fill(path(HAIR_CAP)); x.restore(); } }
    else fs(x, hp, hair, 0);
    if (!fl && !bald) within(x, hp, () => { x.fillStyle = hairD; x.globalAlpha = .55; x.fillRect(3.4, -22, 14, 26); x.globalAlpha = .6; x.strokeStyle = '#fff'; x.lineWidth = LW * (1.2); x.beginPath(); if (sleek) { x.moveTo(-6.6, -5.4); x.quadraticCurveTo(-3, -9.6, 2, -9.8); } else { x.moveTo(-9.4, -5); x.lineTo(-10.6, -8.4); x.moveTo(-5.4, -9.4); x.lineTo(-6, -13); x.moveTo(.4, -12); x.lineTo(1.4, -15); } x.stroke(); x.globalAlpha = 1; });
    if (!bald) { x.lineWidth = LW * (2.3); x.strokeStyle = '#000'; x.stroke(path(hp)); }
    if (gear === 'mushroom') { // straw hat
      const kasa = 'M-21.6,-5 L-.4,-18.6 L21.6,-5 Q0,1.2 -21.6,-5 Z';
      fs(x, kasa, fl ? '#fff' : vgrad(x, -18, 0, '#f2d78a', '#b98a3a'), 0);
      if (!fl) within(x, kasa, () => { x.strokeStyle = '#8a6424'; x.lineWidth = LW * (.8); x.globalAlpha = .75; x.beginPath(); for (let i = -6; i <= 6; i++) { x.moveTo(-.4, -18.6); x.lineTo(i * 3.8, 1); } x.stroke(); x.globalAlpha = .4; x.fillStyle = '#6a4a14'; x.beginPath(); x.moveTo(-.4, -18.6); x.lineTo(24, -2); x.lineTo(24, 2); x.lineTo(6, 2); x.closePath(); x.fill(); x.globalAlpha = 1; x.strokeStyle = '#8a6424'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-14.6, -9.4); x.quadraticCurveTo(0, -4.6, 14.8, -9.4); x.stroke(); });
      x.lineWidth = LW * (2.5); x.strokeStyle = '#000'; x.stroke(path(kasa));
      if (!fl) { x.strokeStyle = trim; x.lineWidth = LW * (1.1); x.beginPath(); x.moveTo(-7.4, -2.6); x.quadraticCurveTo(-8.6, 4, -4.6, 9.2); x.stroke(); }
      return;
    }
    if (masked || gear === 'feathered') return;
    if (gear === 'crown') { fs(x, BAND, fl ? '#fff' : vgrad(x, -7, 0, '#fff3b0', '#e39a14'), 1.7); if (!fl) { x.fillStyle = '#ff4a5a'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.1); x.beginPath(); x.moveTo(3.4, -8.4); x.lineTo(5.6, -5.2); x.lineTo(3.4, -2.4); x.lineTo(1.2, -5.2); x.closePath(); x.fill(); x.stroke(); } return; }
    // headband with fluttering tails
    for (const [dy, r] of [[0, flut], [2.6, -flut * .8 + .16]]) { x.save(); x.translate(-8.6, -2); x.rotate(r); fs(x, `M0,${-1.4 + dy * .2} C-5,-3.4 -8.6,.6 -13.4,-1.8 L-12.6,1.6 C-8.6,3.6 -4.6,.4 0,${1.6 + dy * .2} Z`, F2(fl, dy ? mul(trim, .8) : trim), 1.6); x.restore(); }
    fs(x, BAND, F2(fl, trim), 1.8); if (!fl) { x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(-8.4, -1.6); x.bezierCurveTo(-4, -5, 5, -5.4, 9.6, -2); x.stroke(); }
    x.fillStyle = F2(fl, trim); x.strokeStyle = '#000'; x.lineWidth = LW * (1.5); x.beginPath(); x.arc(-8.8, -2, 1.9, 0, 7); x.fill(); x.stroke();
  }
  const F2 = (fl, col) => fl ? '#fff' : col;

  function drawSorcHD(w, X, ava) {
    const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
    const pose = poseOf(w), prog = pose === 'charge' ? (w.prog === undefined ? .8 : w.prog) : progOf(w), t = w.t || 0;
    const mv = Math.hypot(w.vx || 0, w.vy || 0), walk = ava ? 0 : Math.min(1, mv / 25), bob = ava ? 0 : Math.abs(Math.sin(t * 9)) * 3 * walk + (w.jump || 0), breathe = ava ? 0 : Math.sin(t * 3) * .5;
    if (!ava) { x.fillStyle = 'rgba(8,4,18,.36)'; x.beginPath(); x.ellipse(0, .5, 19, 6, 0, 0, 7); x.fill(); }
    if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(t * 20) * .06;
    if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(t * 12) * .1;
    if (w.dead && !w.pose) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4); }
    if (w.slump || pose === 'weary') { x.rotate(.08 * (w.face || 1)); x.translate(0, 1.5); }
    x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018);
    x.translate(0, -bob);
    const [l, m] = elOf(w), fl = w.flash > 0 && !w.pose, c = w.robe || ['#3a3f5a', '#22263a', '#14172a'], trim = w.trim || '#e8e0d0', skin = w.skin || '#f2c9a0', F = col => fl ? '#fff' : col;
    const casting = pose === 'cast', pants = mul(c[2], 1.05), step = Math.sin(t * 9) * walk * 2.6;
    x.lineJoin = 'round'; x.lineCap = 'round';
    // legs: wide trousers, ankle wraps, soft shoes
    for (const [lp, s, sh] of [[LEG_B, 1, 1], [LEG_F, -1, 0]]) { const st = step * s; x.save(); x.translate(st, 0);
      fs(x, lp, F(sh ? mul(c[2], .82) : pants), 0);
      if (!fl) within(x, lp, () => { x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = LW * (1.1); x.beginPath(); x.moveTo(s * 5, -18.6); x.quadraticCurveTo(s * 9.6, -13, s * 9.6, -6); x.moveTo(s * 2, -15); x.quadraticCurveTo(s * 6.4, -11, s * 7, -6); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = LW * (1.4); x.beginPath(); x.moveTo(-10.4, -15.4); x.quadraticCurveTo(-12.6, -11, -12.4, -7); x.stroke(); });
      x.lineWidth = LW * (2.5); x.strokeStyle = '#000'; x.stroke(path(lp));
      x.fillStyle = F('#f3ead8'); x.lineWidth = LW * (1.8); x.beginPath(); x.rect(s > 0 ? 5.4 : -12.6, -5, 7.2, 3.4); x.fill(); x.stroke(); if (!fl) { x.strokeStyle = '#b9a98a'; x.lineWidth = LW * (.8); x.beginPath(); x.moveTo(s > 0 ? 5.6 : -12.4, -3.2); x.lineTo(s > 0 ? 12.4 : -5.6, -3.6); x.stroke(); x.strokeStyle = '#000'; }
      x.fillStyle = F('#241a14'); x.lineWidth = LW * (2); x.beginPath(); x.ellipse(s * 9 + 1.2, -.6, 6, 2.7, 0, 0, 7); x.fill(); x.stroke(); if (!fl) { x.strokeStyle = '#6a5440'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(s * 9 - 1.6, -1.6); x.lineTo(s * 9 + 4.6, -1.6); x.stroke(); }
      x.restore(); }
    // upper body leans with the pose
    x.save(); x.translate(0, -21); x.rotate(casting ? .1 : pose === 'hurt' ? -.16 : pose === 'charge' ? -.04 : 0); x.translate(0, 21 - breathe * .5);
    const A = ARMS[pose] || ARMS.idle, bobA = Math.sin(t * 3) * .5;
    let lead = A.lead, rear = A.rear;
    if (pose === 'idle') { lead = [lead[0], lead[1], [lead[2][0], lead[2][1] + bobA]]; rear = [rear[0], lerpP(rear[1], ARMS.charge.rear[1], prog), lerpP(rear[2], ARMS.charge.rear[2], prog)]; }
    // lead arm sits behind the torso unless it is the one punching
    drawArm(x, lead, c[1], skin, fl, { trim });
    // jacket skirt, jacket, lapels
    fs(x, GI_SKIRT, F(c[1]), 2.4); if (!fl) { within(x, GI_SKIRT, () => { x.fillStyle = c[2]; x.globalAlpha = .45; x.fillRect(4, -24, 14, 14); x.globalAlpha = 1; x.strokeStyle = c[2]; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(.6, -19.6); x.lineTo(.6, -14.8); x.stroke(); }); }
    fs(x, GI, fl ? '#fff' : vgrad(x, -44, -20, c[0], c[1]), 0);
    if (!fl) within(x, GI, () => {
      x.fillStyle = c[2]; x.globalAlpha = .42; x.beginPath(); x.moveTo(4.6, -46); x.bezierCurveTo(8, -36, 8, -28, 6.6, -18); x.lineTo(18, -18); x.lineTo(18, -46); x.closePath(); x.fill(); x.globalAlpha = 1;
      x.fillStyle = '#17131f'; x.beginPath(); x.moveTo(-5.6, -44); x.lineTo(1.6, -31.4); x.lineTo(7, -44); x.closePath(); x.fill();
      x.fillStyle = skin; x.beginPath(); x.moveTo(-2.6, -44); x.lineTo(1.4, -37); x.lineTo(4.6, -44); x.closePath(); x.fill();
      // lapels: left over right
      x.strokeStyle = '#000'; x.lineWidth = LW * (5.2); x.beginPath(); x.moveTo(7.6, -43.6); x.lineTo(1.2, -31); x.stroke(); x.strokeStyle = mul(trim, .86); x.lineWidth = LW * (3); x.stroke();
      x.strokeStyle = '#000'; x.lineWidth = LW * (5.2); x.beginPath(); x.moveTo(-6.6, -43.6); x.lineTo(2.4, -29.4); x.lineTo(8.6, -19.6); x.stroke(); x.strokeStyle = trim; x.lineWidth = LW * (3); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = LW * (1.7); x.beginPath(); x.moveTo(-11.2, -38.6); x.quadraticCurveTo(-13, -31, -11.8, -24.6); x.stroke();
      // small crest on the chest
      x.fillStyle = trim; x.strokeStyle = '#000'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-7.4, -34.6); x.lineTo(-5.4, -32.4); x.lineTo(-7.4, -30.2); x.lineTo(-9.4, -32.4); x.closePath(); x.fill(); x.stroke();
    });
    x.lineWidth = LW * (2.8); x.strokeStyle = '#000'; x.stroke(path(GI));
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') drawWounds(x, w, 'robe');
    // belt + knot + tails
    fs(x, 'M-13,-24.6 Q0,-21 13,-24.6 L13.4,-20.4 Q0,-16.8 -13.4,-20.4 Z', F('#15121c'), 2);
    if (!fl) { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(-12, -23.4); x.quadraticCurveTo(0, -20, 12, -23.4); x.stroke(); }
    { const sw2 = Math.sin(t * 4) * .1 + (walk ? Math.sin(t * 9) * .12 : 0); for (const [r0, len] of [[.34, 11.6], [-.06, 13]]) { x.save(); x.translate(-5.4, -19.4); x.rotate(r0 + sw2); fs(x, `M-1.6,0 L-2.4,${len} L1.4,${len - 1.2} L1.6,0 Z`, F('#15121c'), 1.7); if (!fl) { x.strokeStyle = trim; x.lineWidth = LW * (1.1); x.beginPath(); x.moveTo(-2, len - 2.6); x.lineTo(1.4, len - 3.4); x.stroke(); } x.restore(); } x.fillStyle = F('#15121c'); x.strokeStyle = '#000'; x.lineWidth = LW * (1.8); x.beginPath(); x.ellipse(-5.4, -20.6, 2.9, 2.5, 0, 0, 7); x.fill(); x.stroke(); }
    // neck + head
    x.fillStyle = F(mul(skin, .86)); x.strokeStyle = '#000'; x.lineWidth = LW * (2); x.beginPath(); x.rect(-2.2, -44.6, 6, 4.4); x.fill();
    x.save(); x.translate(1, -50.4 + (pose === 'weary' ? 2 : 0)); if (pose === 'weary') x.rotate(.16); if (pose === 'hurt') x.rotate(-.12); if (casting) x.rotate(.05);
    sorcHead(x, w, pose, fl, t); x.restore();
    // rear arm on top (the punching arm)
    drawArm(x, rear, c[0], skin, fl, { trim });
    if (!fl) { const H = casting ? rear[2] : pose === 'charge' || prog > .05 ? rear[2] : null, pw = casting ? 1 : pose === 'charge' ? prog : prog * .8;
      if (H && pw > .05) { glow(x, H[0], H[1], casting ? 15 : 5 + pw * 8, l, m, casting ? 1 : .45 + pw * .45);
        if (casting) { x.strokeStyle = '#fff'; x.lineWidth = LW * (1.5); for (let i = 0; i < 6; i++) { const a = (i - 2.5) * .36; x.beginPath(); x.moveTo(H[0] + Math.cos(a) * 8, H[1] + Math.sin(a) * 8); x.lineTo(H[0] + Math.cos(a) * 15, H[1] + Math.sin(a) * 15); x.stroke(); } x.strokeStyle = l; x.lineWidth = LW * (2); x.beginPath(); x.arc(H[0] - 2, H[1], 9, -1.1, 1.1); x.stroke(); }
        else { x.strokeStyle = l; x.lineWidth = LW * (1.2); x.globalAlpha = .8; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; x.beginPath(); x.arc(H[0], H[1], 6.4 + i, a, a + 1.2); x.stroke(); } x.globalAlpha = 1; } } }
    x.restore();
    if (w.wnd && w.wnd.lvl > 0 && !fl && typeof drawWounds === 'function') drawWounds(x, w, 'top');
    x.restore();
  }

  /* ---------------- PETS (0,0 = ground under the pet, facing +x) ---------------- */
  function eye(x, ex, ey, r, iris, o = {}) {
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.5); x.beginPath(); x.ellipse(ex, ey, r, r * (o.sy || 1), 0, 0, 7); x.fill(); x.stroke();
    if (o.closed) { x.fillStyle = o.lid || '#fff'; x.beginPath(); x.ellipse(ex, ey, r, r * (o.sy || 1), 0, 0, 7); x.fill(); x.stroke(); x.lineWidth = LW * (1.4); x.beginPath(); x.moveTo(ex - r * .7, ey + .2); x.quadraticCurveTo(ex, ey - r * .8, ex + r * .7, ey + .2); x.stroke(); return; }
    if (iris) { x.fillStyle = iris; x.beginPath(); x.arc(ex + r * .18, ey, r * .72, 0, 7); x.fill(); }
    x.fillStyle = '#000'; x.beginPath(); if (o.slit) x.ellipse(ex + r * .18, ey, r * .2, r * .68, 0, 0, 7); else if (o.wide) x.ellipse(ex + r * .18, ey, r * .46, r * .27, 0, 0, 7); else x.arc(ex + r * .22, ey, r * (iris ? .44 : .52), 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + r * .42, ey - r * .34, r * .24, 0, 7); x.fill();
  }
  function drawPetHD(x, id, t, face = 1, mood) {
    if (!id || id === 'none') return;
    x.save(); x.scale(face, 1); x.strokeStyle = '#000'; x.lineWidth = LW * (2.2); x.lineJoin = 'round'; x.lineCap = 'round';
    const shadow = (r, a = .3) => { x.fillStyle = `rgba(8,4,18,${a})`; x.beginPath(); x.ellipse(0, .5, r, r * .32, 0, 0, 7); x.fill(); }, happy = mood === 'happy';
    if (id === 'frog') {
      const hop = Math.max(0, Math.sin(t * 4)) * 10, air = hop > 1.5, y = -hop, puff = 1 + Math.sin(t * 5) * .05; shadow(11 - hop * .35);
      x.save(); x.translate(0, y);
      // back legs (stretch out mid-hop)
      for (const s of [-1, 1]) { x.save(); x.translate(s * 8.6, -2.8); x.rotate(s * (air ? .9 : .22)); x.fillStyle = '#3d9a34'; x.lineWidth = LW * (2); x.beginPath(); x.ellipse(0, air ? 3 : 0, air ? 3.2 : 5.4, air ? 5.6 : 3.2, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#e9c24a'; x.beginPath(); x.ellipse(s * 2.4, air ? 8.4 : 2.4, 3.4, 1.5, 0, 0, 7); x.fill(); x.stroke(); x.restore(); }
      const body = 'M-10.6,-6 C-11.8,-13.4 -6,-17 0,-17 C6,-17 11.8,-13.4 10.6,-6 C10,-1.4 5,-.4 0,-.4 C-5,-.4 -10,-1.4 -10.6,-6 Z';
      fs(x, body, vgrad(x, -17, 0, '#8ee866', '#43ae3c'), 0);
      within(x, body, () => { x.fillStyle = '#2f8a30'; x.globalAlpha = .45; x.beginPath(); x.ellipse(9, -4, 8, 12, 0, 0, 7); x.fill(); x.globalAlpha = 1; x.fillStyle = '#ecfac4'; x.beginPath(); x.ellipse(0, -3.6, 6.8 * puff, 4.2 * puff, 0, 0, 7); x.fill(); x.fillStyle = '#35903a'; x.beginPath(); x.ellipse(-7, -11.4, 1.8, 1.3, .4, 0, 7); x.ellipse(7.6, -12.4, 1.5, 1.1, -.4, 0, 7); x.ellipse(-8.6, -7.6, 1.1, .9, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = LW * (1.5); x.beginPath(); x.moveTo(-8.6, -11); x.quadraticCurveTo(-6.6, -15, -2.6, -15.8); x.stroke(); });
      x.lineWidth = LW * (2.4); x.strokeStyle = '#000'; x.stroke(path(body));
      // front feet
      x.fillStyle = '#e9c24a'; x.lineWidth = LW * (1.7); for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 4.4, -.4, 2.8, 1.4, 0, 0, 7); x.fill(); x.stroke(); }
      // eye bumps + eyes
      for (const s of [-1, 1]) { x.fillStyle = '#7fde5c'; x.lineWidth = LW * (2.2); x.beginPath(); x.arc(s * 5.4, -16.6, 5.2, 0, 7); x.fill(); x.stroke(); eye(x, s * 5.4, -17, 3.5, '#ffe36a', { wide: true, closed: happy, lid: '#7fde5c' }); }
      x.fillStyle = '#1f5a22'; x.beginPath(); x.arc(-1.3, -12.4, .6, 0, 7); x.arc(1.3, -12.4, .6, 0, 7); x.fill();
      x.strokeStyle = '#000'; x.lineWidth = LW * (1.6); x.beginPath(); x.moveTo(-6.6, -9.4); x.quadraticCurveTo(0, happy ? -4 : -6, 6.6, -9.4); x.stroke(); if (happy) { x.fillStyle = '#ff7a8a'; x.beginPath(); x.moveTo(-3.4, -7.6); x.quadraticCurveTo(0, -3.6, 3.4, -7.6); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = 'rgba(255,110,110,.4)'; x.beginPath(); x.ellipse(-8, -8.6, 1.8, 1.1, 0, 0, 7); x.ellipse(8, -8.6, 1.8, 1.1, 0, 0, 7); x.fill();
      // lily pad hat with a flower
      x.fillStyle = '#2f9a3a'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.6); x.beginPath(); x.ellipse(0, -19.6, 5.2, 1.8, 0, .5, 6.283); x.lineTo(0, -19.6); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#ff9ac0'; x.lineWidth = LW * (1.1); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 - 1.57; x.beginPath(); x.ellipse(-.6 + Math.cos(a) * 1.7, -21.6 + Math.sin(a) * 1.5, 1.3, 1.1, 0, 0, 7); x.fill(); x.stroke(); } x.fillStyle = '#ffe58a'; x.beginPath(); x.arc(-.6, -21.6, 1, 0, 7); x.fill();
      x.restore();
    } else if (id === 'owl') {
      shadow(8, .24); const y = -34 + Math.sin(t * 3) * 3, flap = Math.sin(t * 14), body = new Path2D(); body.ellipse(0, y, 9.8, 11.4, 0, 0, 7);
      // tail fan
      x.fillStyle = '#5e3a20'; x.lineWidth = LW * (1.8); for (const a of [-.4, 0, .4]) { x.save(); x.translate(0, y + 9.6); x.rotate(a); x.beginPath(); x.ellipse(0, 3.4, 2.2, 4.4, 0, 0, 7); x.fill(); x.stroke(); x.restore(); }
      // wings
      for (const s of [-1, 1]) { x.save(); x.translate(s * 8, y - 2.4); x.scale(s, 1); x.rotate(-.3 - flap * .42); const wing = 'M0,-4 C6,-7 12,-4.6 14.4,1 C15.2,3.4 14.4,5.4 13.2,6.4 C12.4,5.4 11.4,5 10.4,5.4 C10.4,7 9.4,8.4 8,9 C7.2,7.6 6.2,7 5,7.2 C4.8,8.6 3.8,9.8 2.6,10.2 C1,7 0,3 0,-4 Z'; fs(x, wing, vgrad(x, -6, 10, '#b98a5a', '#7a4e2c'), 2); within(x, wing, () => { x.strokeStyle = '#3e2412'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(2.4, -1.6); x.quadraticCurveTo(8, -1.6, 12.6, 2.6); x.moveTo(2.2, 1.6); x.quadraticCurveTo(6, 1.6, 9.4, 5); x.moveTo(2, 4.6); x.quadraticCurveTo(4, 5, 5.6, 7); x.stroke(); x.fillStyle = '#f0dab0'; x.globalAlpha = .55; x.beginPath(); x.ellipse(11, 7.4, 6, 2.6, .5, 0, 7); x.fill(); x.globalAlpha = 1; }); x.restore(); }
      fs(x, body, vgrad(x, y - 11, y + 11, '#a8744a', '#6b4226'), 0);
      within(x, body, () => { x.fillStyle = '#4e2e16'; x.globalAlpha = .4; x.beginPath(); x.ellipse(8, y + 2, 7, 13, 0, 0, 7); x.fill(); x.globalAlpha = 1; x.fillStyle = '#f0dab0'; x.beginPath(); x.ellipse(0, y + 4.6, 6.6, 7.4, 0, 0, 7); x.fill(); x.strokeStyle = '#a8744a'; x.lineWidth = LW * (1.1); x.beginPath(); for (const [a, b] of [[-2.6, 3], [2.6, 3], [0, 5.8], [-2.6, 8.4], [2.6, 8.4]]) { x.moveTo(a - 1.3, y + b - .8); x.lineTo(a, y + b + .6); x.lineTo(a + 1.3, y + b - .8); } x.stroke(); });
      x.lineWidth = LW * (2.4); x.strokeStyle = '#000'; x.stroke(body);
      // ear tufts
      x.fillStyle = '#6b4226'; x.lineWidth = LW * (2); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 3.6, y - 9.6); x.lineTo(s * 9.8, y - 16.4); x.lineTo(s * 8.8, y - 6.6); x.closePath(); x.fill(); x.stroke(); }
      // face discs + eyes
      for (const s of [-1, 1]) { x.fillStyle = '#f6e8c8'; x.lineWidth = LW * (1.6); x.beginPath(); x.arc(s * 4.1, y - 3.6, 5.1, 0, 7); x.fill(); x.stroke(); eye(x, s * 4.1, y - 3.6, 3.5, '#ffb52e', { closed: happy, lid: '#f6e8c8' }); }
      fs(x, `M-1.7,${y - 1.4} L1.7,${y - 1.4} L0,${y + 2.6} Z`, '#ffa23a', 1.6);
      x.fillStyle = '#ffa23a'; x.lineWidth = LW * (1.4); for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 2.6, y + 11.4, 1.7, 1.1, 0, 0, 7); x.fill(); x.stroke(); }
    } else if (id === 'cat') {
      shadow(10); const sw = Math.sin(t * 2.2) * 5, fur = '#2e2840', furL = '#4a4266', blink = (t % 4.1) < .12 || happy;
      // tail
      x.strokeStyle = '#000'; x.lineWidth = LW * (6.6); x.beginPath(); x.moveTo(-6, -3.6); x.bezierCurveTo(-16, -4, -19, -12, -15 + sw, -23); x.stroke(); x.strokeStyle = fur; x.lineWidth = LW * (4); x.stroke(); x.strokeStyle = '#f2ecff'; x.lineWidth = LW * (4); x.beginPath(); x.moveTo(-15.6 + sw * .86, -20); x.lineTo(-15 + sw, -23); x.stroke();
      const body = 'M-7.8,-1 C-10,-8 -6.4,-16.4 0,-17.4 C6.4,-16.4 10,-8 7.8,-1 Q0,1 -7.8,-1 Z';
      fs(x, body, vgrad(x, -17, 0, furL, fur), 0); within(x, body, () => { x.fillStyle = '#17131f'; x.globalAlpha = .45; x.fillRect(3, -18, 9, 20); x.globalAlpha = 1; x.fillStyle = '#f2ecff'; x.beginPath(); x.moveTo(-2.6, -15); x.quadraticCurveTo(1, -8.4, .6, -5.4); x.quadraticCurveTo(4, -9, 4.4, -15); x.closePath(); x.fill(); });
      x.lineWidth = LW * (2.3); x.strokeStyle = '#000'; x.stroke(path(body));
      x.fillStyle = '#f2ecff'; x.lineWidth = LW * (1.7); for (const px of [-2.8, 3.6]) { x.beginPath(); x.ellipse(px, -.9, 3, 2, 0, 0, 7); x.fill(); x.stroke(); }
      // ears
      for (const [a, b, c2] of [[-5.8, -6.8, -.8], [7.8, 8.8, 2.8]]) { fs(x, `M${a},-27 L${b},-36 L${c2},-30 Z`, fur, 2); x.fillStyle = '#ff9ab0'; x.beginPath(); x.moveTo(a + (c2 - a) * .28, -28.6); x.lineTo(b + (c2 - b) * .24, -33.4); x.lineTo(c2 - (c2 - a) * .2, -30); x.closePath(); x.fill(); }
      // head with cheek tufts
      const head = 'M-6.8,-22.6 C-6.8,-27.6 -3.4,-30.6 1,-30.6 C5.4,-30.6 8.8,-27.6 8.8,-22.6 L10.6,-20.4 L8,-19.4 C6.8,-16.4 4,-15 1,-15 C-2,-15 -4.8,-16.4 -6,-19.4 L-8.6,-20.4 Z';
      fs(x, head, vgrad(x, -30, -15, furL, fur), 2.3);
      // collar + bell
      x.strokeStyle = '#000'; x.lineWidth = LW * (3.6); x.beginPath(); x.moveTo(-4.4, -16.2); x.quadraticCurveTo(1, -13.6, 6.4, -16.2); x.stroke(); x.strokeStyle = '#e0344a'; x.lineWidth = LW * (2); x.stroke(); x.fillStyle = '#ffd45e'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.2); x.beginPath(); x.arc(1, -13.6, 1.9, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(1, -13.6); x.lineTo(1, -12); x.stroke();
      // face
      for (const ex of [-2.2, 4.4]) { if (blink) { x.strokeStyle = '#ffd23a'; x.lineWidth = LW * (1.5); x.beginPath(); x.moveTo(ex - 2, -22.4); x.quadraticCurveTo(ex, -24.4, ex + 2, -22.4); x.stroke(); } else { x.fillStyle = '#ffd23a'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.2); x.beginPath(); x.ellipse(ex, -23, 2.4, 2.8, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.ellipse(ex + .3, -23, .7, 2.2, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + .9, -24.2, .6, 0, 7); x.fill(); } }
      x.fillStyle = '#ff9ab0'; x.beginPath(); x.moveTo(.3, -20.2); x.lineTo(2.1, -20.2); x.lineTo(1.2, -19); x.closePath(); x.fill();
      x.strokeStyle = '#f2ecff'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(1.2, -19); x.quadraticCurveTo(.2, -17.6, -1, -18.2); x.moveTo(1.2, -19); x.quadraticCurveTo(2.2, -17.6, 3.4, -18.2); x.stroke();
      x.strokeStyle = 'rgba(242,236,255,.8)'; x.lineWidth = LW * (.8); x.beginPath(); for (const s of [-1, 1]) for (const dy of [-1.2, .4]) { x.moveTo(1 + s * 4.6, -19.4 + dy * .4); x.lineTo(1 + s * 11, -20 + dy * 1.6); } x.stroke();
    } else if (id === 'wisp') {
      shadow(6, .2); const y = -32 + Math.sin(t * 2) * 4;
      glow(x, 0, y - 2, 22, '#8ff0ff', '#2a8cff', .85);
      for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.094, sx2 = Math.cos(a) * 13, sy2 = y - 3 + Math.sin(a) * 6; if (Math.sin(a) < 0) star4(x, sx2, sy2, 1.8, '#eaffff'); }
      // trailing droplets
      x.fillStyle = '#8fe6ff'; x.strokeStyle = '#000'; x.lineWidth = LW * (1.4); for (const [dx, dy, r] of [[-7.6, 9.6, 2.2], [-11, 14.4, 1.4]]) { x.beginPath(); x.arc(dx + Math.sin(t * 3 + dy) * 1.2, y + dy, r, 0, 7); x.fill(); x.stroke(); }
      x.save(); x.translate(0, y); const tip = Math.sin(t * 6) * 3;
      const flame = `M-8.4,3 C-11,-3.4 -7,-8 ${-5.4 + tip * .6},-13.4 C${-4 + tip * .5},-11.2 -3.2,-10 -1.8,-9.6 C-2.2,-13.4 ${-.4 + tip},-17 ${2.8 + tip},-20.4 C${3 + tip * .4},-13.4 10.6,-8 8.4,3 C7.4,8.8 -7,9.2 -8.4,3 Z`;
      const fp = new Path2D(flame); fs(x, fp, vgrad(x, -18, 9, '#eaffff', '#4fc8ff'), 2.2);
      within(x, fp, () => { x.fillStyle = '#2a8cff'; x.globalAlpha = .35; x.beginPath(); x.ellipse(8, 2, 6, 12, 0, 0, 7); x.fill(); x.globalAlpha = .9; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(-4.4, 3.4); x.bezierCurveTo(-5.6, -1.6, -2, -4.6, -1 + tip * .5, -10); x.bezierCurveTo(1.6, -5.6, 5, -2, 4.4, 3.4); x.bezierCurveTo(3.6, 6.4, -3.6, 6.6, -4.4, 3.4); x.fill(); x.globalAlpha = 1; });
      if (happy) { x.strokeStyle = '#0b2d55'; x.lineWidth = LW * (1.5); x.beginPath(); for (const ex of [-2.8, 3]) { x.moveTo(ex - 1.5, .6); x.quadraticCurveTo(ex, -1.9, ex + 1.5, .6); } x.stroke(); }
      else { x.fillStyle = '#0b2d55'; x.beginPath(); x.ellipse(-2.8, .2, 1.5, 2, 0, 0, 7); x.ellipse(3, .2, 1.5, 2, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(-2.3, -.5, .6, 0, 7); x.arc(3.5, -.5, .6, 0, 7); x.fill(); }
      x.strokeStyle = '#0b2d55'; x.lineWidth = LW * (1.1); x.beginPath(); x.arc(.1, 2.6, 1.4, .2, Math.PI - .2); x.stroke();
      x.fillStyle = 'rgba(255,140,190,.5)'; x.beginPath(); x.ellipse(-5, 2.6, 1.4, .9, 0, 0, 7); x.ellipse(5.2, 2.6, 1.4, .9, 0, 0, 7); x.fill();
      x.restore();
      for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.094, sx2 = Math.cos(a) * 13, sy2 = y - 3 + Math.sin(a) * 6; if (Math.sin(a) >= 0) star4(x, sx2, sy2, 2.2, '#ffffff'); }
    } else if (id === 'dragon') {
      shadow(9, .24); const y = -38 + Math.sin(t * 3) * 4, flap = Math.sin(t * 11), sc = '#a56cf0', scD = '#6a3fd6', cream = '#f8dc96';
      const wing = (dark) => { x.save(); x.translate(-1, y - 5); x.rotate(-.25 - flap * .5 + (dark ? .35 : 0)); const wp = 'M0,0 C-3,-8 -10,-15 -18,-17.6 C-15.6,-13.4 -16.4,-11 -13.4,-9 C-13.4,-6.4 -11,-4.6 -8.6,-3.6 C-7.6,-1.6 -4,-.4 0,0 Z'; fs(x, wp, dark ? '#4a2aa8' : vgrad(x, -18, 0, '#c9a2ff', '#7a4ad6'), 2); if (!dark) within(x, wp, () => { x.strokeStyle = '#4a2aa8'; x.lineWidth = LW * (1); x.beginPath(); x.moveTo(0, 0); x.lineTo(-17, -16.6); x.moveTo(0, 0); x.lineTo(-13, -9.4); x.moveTo(0, 0); x.lineTo(-8.6, -4); x.stroke(); }); x.restore(); };
      wing(true);
      // tail with a spade tip
      x.strokeStyle = '#000'; x.lineWidth = LW * (6); x.beginPath(); x.moveTo(-6, y + 2); x.bezierCurveTo(-13, y + 8, -19, y + 5, -19.6, y - 2); x.stroke(); x.strokeStyle = sc; x.lineWidth = LW * (3.6); x.stroke();
      fs(x, `M-19.6,${y - 1} L-23.4,${y - 5} L-19.8,${y - 8.4} L-16.4,${y - 4.6} Z`, cream, 1.8);
      // legs
      x.fillStyle = scD; x.lineWidth = LW * (1.8); for (const lx of [-3, 3.4]) { x.beginPath(); x.ellipse(lx, y + 7, 2.4, 2.8, 0, 0, 7); x.fill(); x.stroke(); }
      const body = new Path2D(); body.ellipse(0, y, 9.8, 7.8, -.1, 0, 7);
      fs(x, body, vgrad(x, y - 8, y + 8, '#bb8cff', scD), 0); within(x, body, () => { x.fillStyle = cream; x.beginPath(); x.ellipse(2, y + 5.4, 7.4, 4.6, -.1, 0, 7); x.fill(); x.strokeStyle = '#c9a25a'; x.lineWidth = LW * (.9); x.beginPath(); for (const bx of [-2.4, .8, 4]) { x.moveTo(bx, y + 1.6); x.quadraticCurveTo(bx + .8, y + 5, bx - .4, y + 8.4); } x.stroke(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = LW * (1.5); x.beginPath(); x.moveTo(-7.6, y - 2.4); x.quadraticCurveTo(-5, y - 6.4, -.6, y - 6.8); x.stroke(); });
      x.lineWidth = LW * (2.3); x.strokeStyle = '#000'; x.stroke(body);
      // back spikes
      x.fillStyle = cream; x.lineWidth = LW * (1.4); for (const [bx, by] of [[-4.6, -6.4], [-.6, -7.6], [3.4, -7.4]]) { x.beginPath(); x.moveTo(bx - 1.6, y + by + .8); x.lineTo(bx, y + by - 3); x.lineTo(bx + 1.8, y + by + .6); x.closePath(); x.fill(); x.stroke(); }
      // head: frill, horns, snout
      x.fillStyle = scD; x.lineWidth = LW * (1.6); x.beginPath(); x.moveTo(4.6, y - 9); x.lineTo(1.6, y - 12.4); x.lineTo(5.2, y - 11.2); x.lineTo(3.6, y - 15); x.lineTo(7.6, y - 12.6); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = cream; x.lineWidth = LW * (1.6); for (const [a, b] of [[6.6, 4.6], [11, 10.4]]) { x.beginPath(); x.moveTo(a, y - 12); x.quadraticCurveTo(b - 1.6, y - 17.6, b + .6, y - 20); x.quadraticCurveTo(b + 2, y - 15.6, a + 3.2, y - 12.4); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = sc; x.lineWidth = LW * (2.2); x.beginPath(); x.arc(9.8, y - 7, 6.8, 0, 7); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(15.2, y - 5, 4.4, 3.5, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = sc; x.beginPath(); x.arc(11.6, y - 6.2, 4.6, 0, 7); x.fill();
      x.fillStyle = '#3a1a78'; x.beginPath(); x.arc(17.4, y - 6.2, .7, 0, 7); x.fill();
      eye(x, 10.4, y - 8.2, 3, '#ffd23a', { slit: true, closed: happy, lid: sc });
      x.strokeStyle = '#000'; x.lineWidth = LW * (1.4); x.beginPath(); x.moveTo(11.4, y - 2.8); x.quadraticCurveTo(15.4, y - 1.6, 18.6, y - 3.6); x.stroke(); x.fillStyle = '#fff'; x.lineWidth = LW * (.9); x.beginPath(); x.moveTo(15, y - 2.4); x.lineTo(15.8, y - .6); x.lineTo(16.6, y - 2.6); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,120,150,.4)'; x.beginPath(); x.ellipse(8, y - 3.8, 1.8, 1.1, 0, 0, 7); x.fill();
      // smoke puff from the nostril
      { const ph = (t * .9) % 1; x.globalAlpha = (1 - ph) * .7; x.fillStyle = '#e8e2f6'; x.beginPath(); x.arc(19.6 + ph * 5, y - 8 - ph * 7, 1.4 + ph * 2.2, 0, 7); x.fill(); x.globalAlpha = 1; }
      wing(false);
    }
    x.restore();
  }

  /* ---------------- SUMMONS (same frame as the game: 0,0 = ground, drawn on the game canvas) ---------------- */
  function hpBar(x, cx, top, hp, max, col) { if (!(hp < max)) return; x.fillStyle = '#000'; x.fillRect(cx - 14, top, 28, 5); x.fillStyle = col; x.fillRect(cx - 13, top + 1, 26 * Math.max(0, hp / max), 3); }
  const Z_TUNIC = 'M-8,-27 C-10.5,-22 -10.5,-12 -9.4,-5.4 L-6.4,-8 L-4,-4.6 L-1,-8.2 L1.6,-4.4 L4.6,-8 L7,-4.8 L9,-7.4 C10,-13 10,-22 7.6,-27 Q0,-29.6 -8,-27 Z';
  function drawZombieHD(z) {
    const x = ctx, t = z.t || 0, fl = z.flash > 0, rev = z.revived, face = z.o.foe.x > z.x ? 1 : -1, robe = (z.o && z.o.robe) || ['#7a6a9a', '#4a3f6a', '#2a2040'];
    const skin = fl ? '#fff' : rev ? '#9ab4ac' : '#93d46c', skinD = rev ? '#62807a' : '#5f9c48', F = c => fl ? '#fff' : c;
    x.save(); x.translate(z.x, z.y); x.scale(SC, SC); x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = 'rgba(8,4,18,.36)'; x.beginPath(); x.ellipse(0, .5, 12, 4, 0, 0, 7); x.fill();
    x.scale(face, 1);
    const shuf = Math.sin(t * 6), lu = z.lunge > 0 ? Math.sin(z.lunge / .2 * Math.PI) * 6 : 0;
    if (rev) { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(176,107,255,${.22 + Math.sin(T * 12) * .1})`; x.beginPath(); x.ellipse(0, -17, 16, 22, 0, 0, 7); x.fill(); x.restore(); }
    // legs + bare feet (shuffling)
    for (const [lx, s2] of [[-4.4, 1], [3.6, -1]]) { const st = shuf * s2 * 1.6; x.fillStyle = F(mul(robe[2], .9)); x.strokeStyle = '#000'; x.lineWidth = LW * 2.2; x.beginPath(); x.rect(lx - 2.6 + st, -9, 5.4, 7.4); x.fill(); x.stroke(); x.fillStyle = skin; x.beginPath(); x.ellipse(lx + 1.6 + st, -.9, 4.4, 2.2, 0, 0, 7); x.fill(); x.stroke(); }
    x.save(); x.translate(0, -4); x.rotate(.16 + Math.sin(t * 6) * .07); x.translate(lu * .5, 4);
    // back arm
    const arm = (ay, dark, ph) => { const sw = Math.sin(t * 6 + ph) * 1.2; x.strokeStyle = '#000'; x.lineWidth = LW * 6.4; x.beginPath(); x.moveTo(3, ay); x.lineTo(15 + lu, ay + 1 + sw); x.stroke(); x.strokeStyle = fl ? '#fff' : dark ? skinD : skin; x.lineWidth = LW * 3.6; x.stroke();
      x.strokeStyle = '#000'; x.lineWidth = LW * 6.8; x.beginPath(); x.moveTo(2, ay); x.lineTo(7, ay + .4); x.stroke(); x.strokeStyle = F(dark ? robe[2] : robe[1]); x.lineWidth = LW * 4.2; x.stroke();
      x.fillStyle = fl ? '#fff' : dark ? skinD : skin; x.strokeStyle = '#000'; x.lineWidth = LW * 1.8; x.beginPath(); x.arc(16.4 + lu, ay + 1 + sw, 2.9, 0, 7); x.fill(); x.stroke(); x.lineWidth = LW * 1.4; x.beginPath(); for (const cy of [-2, 0, 2]) { x.moveTo(18.4 + lu, ay + 1 + sw + cy); x.lineTo(21.4 + lu, ay + .6 + sw + cy * 1.5); } x.stroke(); };
    if (!rev) arm(-21, true, 1.4);
    // ragged tunic in the summoner's colours
    fs(x, Z_TUNIC, fl ? '#fff' : vgrad(x, -28, -5, rev ? '#4a4566' : robe[0], rev ? '#2e2a44' : robe[1]), 0);
    if (!fl) within(x, Z_TUNIC, () => { x.fillStyle = rev ? '#17142a' : robe[2]; x.globalAlpha = .45; x.fillRect(2.6, -30, 10, 28); x.globalAlpha = 1;
      x.fillStyle = '#6a4a2a'; x.strokeStyle = '#000'; x.lineWidth = LW * 1; x.beginPath(); x.rect(-6.4, -17, 5, 4.6); x.fill(); x.stroke(); x.strokeStyle = '#e8dcc0'; x.lineWidth = LW * .8; x.beginPath(); x.moveTo(-6.8, -15.8); x.lineTo(-7.8, -16.4); x.moveTo(-1.2, -14); x.lineTo(-.2, -13.4); x.moveTo(-4, -17.4); x.lineTo(-4, -18.4); x.stroke();
      x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = LW * 1; x.beginPath(); x.moveTo(3.4, -22); x.lineTo(2.6, -12); x.stroke();
      x.strokeStyle = '#c9a56a'; x.lineWidth = LW * 1.6; x.beginPath(); x.moveTo(-10, -11.6); x.quadraticCurveTo(0, -9.6, 10, -11.6); x.stroke(); });
    x.lineWidth = LW * 2.5; x.strokeStyle = '#000'; x.stroke(path(Z_TUNIC));
    if (!rev) {
      // head: lopsided, one big eye, hanging jaw
      x.save(); x.translate(2.4, -33); x.rotate(-.1 + Math.sin(t * 6 + 1) * .06);
      x.fillStyle = skin; x.strokeStyle = '#000'; x.lineWidth = LW * 2; x.beginPath(); x.arc(-6.8, .6, 2.2, 0, 7); x.fill(); x.stroke();
      const head = 'M-7.4,-1 C-8,-6.6 -3.6,-9.4 1,-9 C5.6,-8.6 8.6,-5 8,.4 C7.6,3.6 6,5.4 3.4,6.2 L3.8,8.6 L-2.6,8.2 L-3,5.6 C-5.6,4.6 -7,2.4 -7.4,-1 Z';
      fs(x, head, skin, 0); if (!fl) within(x, head, () => { x.fillStyle = skinD; x.globalAlpha = .55; x.beginPath(); x.ellipse(-5, 5, 7, 6, 0, 0, 7); x.fill(); x.globalAlpha = 1; x.fillStyle = '#3a1418'; x.fillRect(-2.6, 4.6, 6.4, 3.4); x.fillStyle = '#f4efd8'; for (const tx of [-2, .2, 2.2]) x.fillRect(tx, 4.6, 1.4, 1.6); x.fillRect(-.8, 6.6, 1.4, 1.4); });
      x.lineWidth = LW * 2.3; x.strokeStyle = '#000'; x.stroke(path(head));
      if (!fl) { x.fillStyle = '#fff36a'; x.strokeStyle = '#000'; x.lineWidth = LW * 1.2; x.beginPath(); x.arc(3.6, -2, 2.9, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(-1.8, -1.6, 1.8, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.arc(4.2, -2, 1, 0, 7); x.arc(-1.5, -1.6, .7, 0, 7); x.fill();
        x.strokeStyle = '#2b3d1a'; x.lineWidth = LW * 1; x.beginPath(); x.moveTo(-4.6, -6.6); x.lineTo(-.6, -5.4); x.moveTo(-3.6, -7.2); x.lineTo(-3.2, -5.6); x.moveTo(-1.8, -6.8); x.lineTo(-1.5, -5.2); x.stroke();
        x.strokeStyle = '#2f4a1c'; x.lineWidth = LW * 1.4; x.beginPath(); x.moveTo(-1, -9); x.lineTo(-2, -12); x.moveTo(1.6, -9); x.lineTo(2.2, -11.6); x.moveTo(4, -8.4); x.lineTo(5.6, -10.4); x.stroke(); }
      x.restore();
    } else if (!fl) { // headless risen: stump, eyes glowing on the chest
      x.fillStyle = '#9ab4ac'; x.strokeStyle = '#000'; x.lineWidth = LW * 1.8; x.beginPath(); x.ellipse(0, -27.6, 5.6, 2.8, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#b3202a'; x.beginPath(); x.ellipse(0, -28, 3.6, 1.6, 0, 0, 7); x.fill();
      x.fillStyle = '#d9a8ff'; x.beginPath(); x.arc(-2.8, -21, 1.8, 0, 7); x.arc(3, -21, 1.8, 0, 7); x.fill(); x.strokeStyle = '#000'; x.lineWidth = LW * 1; x.beginPath(); x.moveTo(-4.6, -16); x.lineTo(4.8, -15); for (let q = -3.6; q <= 4; q += 2.4) { x.moveTo(q, -16.8); x.lineTo(q + .4, -14.2); } x.stroke(); }
    if (z.limb) { // the front arm has been torn off: a sleeve stump with a bone nub
      const ay = rev ? -20 : -17.6; x.strokeStyle = '#000'; x.lineWidth = LW * 6.8; x.beginPath(); x.moveTo(2, ay); x.lineTo(6.4, ay + .4); x.stroke(); x.strokeStyle = F(robe[1]); x.lineWidth = LW * 4.2; x.stroke();
      x.fillStyle = fl ? '#fff' : '#6a1422'; x.strokeStyle = '#000'; x.lineWidth = LW * 1.1; x.beginPath(); x.arc(7.8, ay + .5, 2.1, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#efe6d0'; x.beginPath(); x.arc(8.6, ay + .4, .95, 0, 7); x.fill();
    } else arm(rev ? -20 : -17.6, false, 0);
    x.restore(); x.restore();
  }
  const G_BODY = 'M-17,-12 C-22,-20 -22,-34 -15,-42 C-10,-47.6 10,-47.6 15,-42 C22,-34 22,-20 17,-12 C10,-8 -10,-8 -17,-12 Z';
  function drawGolemHD(g) {
    const x = ctx, sc = SC * (g.mini ? .55 : 1), fl = g.flash > 0, t = g.t || 0, stone = fl ? '#fff' : '#bb9660', lite = '#dcbc82', dark = fl ? '#fff' : '#7d5c32', F = c => fl ? '#fff' : c;
    x.save(); x.translate(g.x, g.y); x.scale(sc * g.face, sc); x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = 'rgba(8,4,18,.34)'; x.beginPath(); x.ellipse(0, .5, 22, 6.6, 0, 0, 7); x.fill();
    const bob = Math.abs(Math.sin(t * 4)) * 2, st = g.stomp > 0; x.translate(0, -bob);
    // feet
    for (const fx2 of [-9, 9]) { fs(x, `M${fx2 - 7},0 L${fx2 - 5.6},-10 L${fx2 + 5.6},-10 L${fx2 + 7},0 Z`, dark, 2.6); if (!fl) { x.strokeStyle = '#5a3d22'; x.lineWidth = LW * 1.2; x.beginPath(); x.moveTo(fx2 - 2, -1); x.lineTo(fx2 - 2, -4); x.moveTo(fx2 + 2, -1); x.lineTo(fx2 + 2, -4); x.stroke(); } }
    // arms: big boulder fists, raised for a stomp
    const armAt = s2 => { x.save(); x.translate(s2 * 20, -36); x.rotate(s2 * (.26 + (st ? -.9 : Math.sin(t * 4 + s2) * .06))); fs(x, 'M-5.4,-2 L5.4,-2 L6.4,15 L-6.4,15 Z', dark, 2.6); const fist = new Path2D(); fist.arc(0, 21, 8.4, 0, 7); fs(x, fist, stone, 2.6); if (!fl) { within(x, fist, () => { x.fillStyle = '#7d5c32'; x.globalAlpha = .5; x.beginPath(); x.arc(4, 25, 8, 0, 7); x.fill(); x.globalAlpha = 1; }); x.strokeStyle = '#5a3d22'; x.lineWidth = LW * 1.2; x.beginPath(); x.moveTo(-3, 17); x.lineTo(-1, 22); x.lineTo(-4, 26); x.stroke(); } x.restore(); };
    armAt(-1);
    fs(x, G_BODY, fl ? '#fff' : vgrad(x, -47, -8, lite, stone), 0);
    if (!fl) within(x, G_BODY, () => {
      x.fillStyle = '#7d5c32'; x.globalAlpha = .5; x.beginPath(); x.moveTo(6, -50); x.bezierCurveTo(12, -36, 12, -22, 6, -6); x.lineTo(26, -6); x.lineTo(26, -50); x.closePath(); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = '#5a3d22'; x.lineWidth = LW * 1.6; x.beginPath(); x.moveTo(-10, -42); x.lineTo(-5, -34); x.lineTo(-9, -27); x.moveTo(10, -44); x.lineTo(6, -37); x.moveTo(-2, -14); x.lineTo(3, -20); x.lineTo(1, -24); x.stroke();
      x.fillStyle = '#6fae4a'; x.beginPath(); x.ellipse(-13, -40, 6.4, 3.6, -.6, 0, 7); x.ellipse(11, -15, 5, 2.6, .3, 0, 7); x.fill(); x.fillStyle = '#8fd06a'; x.beginPath(); x.ellipse(-14, -41, 2.6, 1.4, -.6, 0, 7); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = LW * 2; x.beginPath(); x.moveTo(-17, -24); x.quadraticCurveTo(-19, -34, -13, -41); x.stroke();
      // rune on the chest, lit when it stomps
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = st ? '#fff3b0' : 'rgba(255,212,94,.75)'; x.lineWidth = LW * (st ? 2.4 : 1.7); x.beginPath(); x.moveTo(-4, -32); x.lineTo(0, -37); x.lineTo(4, -32); x.lineTo(0, -27); x.closePath(); x.moveTo(0, -37); x.lineTo(0, -27); x.stroke(); x.globalCompositeOperation = 'source-over'; });
    x.lineWidth = LW * 3; x.strokeStyle = '#000'; x.stroke(path(G_BODY));
    // head: a slab with glowing eyes
    fs(x, 'M-10,-45 L-7.4,-57 L7.4,-57 L10,-45 Q0,-42.6 -10,-45 Z', F(lite), 2.6);
    if (!fl) { x.fillStyle = '#7d5c32'; x.globalAlpha = .45; x.beginPath(); x.moveTo(3, -57); x.lineTo(7.4, -57); x.lineTo(10, -45); x.lineTo(4, -44); x.closePath(); x.fill(); x.globalAlpha = 1;
      x.fillStyle = '#2a1c0c'; x.fillRect(-6.6, -53.6, 5, 3.4); x.fillRect(1.8, -53.6, 5, 3.4); x.fillStyle = st ? '#fff3b0' : '#ffd45e'; x.fillRect(-5.4, -52.8, 3, 1.9); x.fillRect(3, -52.8, 3, 1.9);
      x.strokeStyle = '#2a1c0c'; x.lineWidth = LW * 1.5; x.beginPath(); x.moveTo(-4.6, -47.6); x.lineTo(5, -47.6); x.stroke();
      glow(x, 0, -52, 9, '#ffd45e', '#ffb020', st ? .7 : .3); }
    armAt(1);
    x.restore();
    hpBar(x, g.x, g.y - 66 * sc, g.hp, g.max, '#c9a56a');
  }
  const A_CLOAK = 'M-9.6,-31 C-13,-20 -12.6,-9 -10,-1 C-7.6,-5 -5.6,-4.6 -3.6,0 C-1.6,-5 1.6,-5 3.4,.6 C5.4,-4.6 8,-4.6 10,-1 C12.6,-9 13,-20 9.6,-31 Q0,-35 -9.6,-31 Z';
  const A_HOOD = 'M-10.4,-29.6 C-11.6,-40.6 -5.6,-48.6 1,-48.6 C2.6,-52.6 6.6,-53.6 9.6,-51.6 C7,-50.6 6.6,-48.2 7.4,-46 C11.4,-42.6 12,-36 10.4,-29.6 Q0,-33.6 -10.4,-29.6 Z';
  function drawArcherHD(a) {
    const x = ctx, t = a.t || 0, fl = a.flash > 0, bob = Math.sin(t * 3) * 2, fade = Math.min(1, a.life * 1.5), pull = a.cd > .8, F = c => fl ? '#fff' : c;
    x.save(); x.translate(a.x, a.y); x.scale(SC, SC); x.lineJoin = 'round'; x.lineCap = 'round';
    x.globalAlpha = fade; x.fillStyle = 'rgba(8,4,18,.26)'; x.beginPath(); x.ellipse(0, .5, 12, 4, 0, 0, 7); x.fill();
    if (!fl) glow(x, 0, -26, 30, '#bffff4', '#5fe0d0', .34);
    x.globalAlpha = fade * (fl ? 1 : .92); x.translate(0, -6 + bob); x.scale(a.face, 1);
    // quiver on the back
    x.save(); x.translate(-9, -24); x.rotate(-.5); fs(x, 'M-2.6,-9 L2.6,-9 L2,7 L-2,7 Z', F('#7a4a22'), 1.8); if (!fl) { x.strokeStyle = '#e0c070'; x.lineWidth = LW * 1.2; for (const qx of [-1.2, .6]) { x.beginPath(); x.moveTo(qx, -9); x.lineTo(qx - .4, -14); x.stroke(); } x.fillStyle = '#bffff4'; x.beginPath(); x.moveTo(-2.6, -14); x.lineTo(-.4, -17.6); x.lineTo(1.4, -14); x.fill(); } x.restore();
    // wispy cloak (no legs: it trails off into mist)
    fs(x, A_CLOAK, fl ? '#fff' : vgrad(x, -33, 0, '#c9fff6', '#6fd6c8'), 0);
    if (!fl) within(x, A_CLOAK, () => { x.fillStyle = '#2f9a8c'; x.globalAlpha = .4; x.fillRect(3.6, -36, 12, 40); x.globalAlpha = .55; x.strokeStyle = '#fff'; x.lineWidth = LW * 1.6; x.beginPath(); x.moveTo(-9.6, -27); x.quadraticCurveTo(-11.6, -17, -9.6, -8); x.stroke(); x.globalAlpha = 1; x.strokeStyle = '#e0c070'; x.lineWidth = LW * 2; x.beginPath(); x.moveTo(-11, -17); x.quadraticCurveTo(0, -14.4, 11, -17); x.stroke(); });
    x.lineWidth = LW * 2.5; x.strokeStyle = '#000'; x.stroke(path(A_CLOAK));
    fs(x, A_HOOD, fl ? '#fff' : vgrad(x, -52, -30, '#8fe8dc', '#3fb0a2'), 2.5);
    if (!fl) { x.fillStyle = '#0d3a36'; x.beginPath(); x.ellipse(2, -37, 6.4, 6, 0, 0, 7); x.fill(); x.fillStyle = '#eafffb'; x.beginPath(); x.ellipse(.4, -37.6, 1.5, 1.9, 0, 0, 7); x.ellipse(5, -37.6, 1.5, 1.9, 0, 0, 7); x.fill(); glow(x, 2.6, -37.6, 7, '#eafffb', '#5fe0d0', .5);
      x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = LW * 1.4; x.beginPath(); x.moveTo(-8.6, -33); x.quadraticCurveTo(-9.6, -42, -3, -46.6); x.stroke(); }
    // bow, string and nocked arrow
    const bx = 13, by = -24, dr = pull ? 7 : 0;
    x.strokeStyle = '#000'; x.lineWidth = LW * 4.4; x.beginPath(); x.arc(bx, by, 13, -1.25, 1.25); x.stroke(); x.strokeStyle = F('#e9c877'); x.lineWidth = LW * 2.3; x.stroke();
    if (!fl) { x.strokeStyle = '#8a5a2a'; x.lineWidth = LW * 3; x.beginPath(); x.arc(bx, by, 13, -.22, .22); x.stroke(); }
    const sx = bx + Math.cos(1.25) * 13, sy0 = by - Math.sin(1.25) * 13, sy1 = by + Math.sin(1.25) * 13;
    x.strokeStyle = '#fff'; x.lineWidth = LW * 1; x.beginPath(); x.moveTo(sx, sy0); x.lineTo(sx - dr, by); x.lineTo(sx, sy1); x.stroke();
    x.strokeStyle = '#000'; x.lineWidth = LW * 2.6; x.beginPath(); x.moveTo(sx - dr, by); x.lineTo(bx + 15 - dr, by); x.stroke(); x.strokeStyle = a.fire ? '#ffb347' : '#eafffb'; x.lineWidth = LW * 1.3; x.stroke();
    fs(x, `M${bx + 14 - dr},${by - 2.6} L${bx + 19.6 - dr},${by} L${bx + 14 - dr},${by + 2.6} Z`, a.fire ? '#ff7a2a' : '#bffff4', 1.4);
    if (pull && !fl) glow(x, bx + 17 - dr, by, 7, a.fire ? '#ffd27a' : '#eafffb', a.fire ? '#ff7a2a' : '#5fe0d0', .7);
    // hands
    x.fillStyle = F('#c9fff6'); x.strokeStyle = '#000'; x.lineWidth = LW * 1.7; x.beginPath(); x.arc(bx + 12.6, by, 2.6, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(sx - dr, by, 2.4, 0, 7); x.fill(); x.stroke();
    x.restore();
    hpBar(x, a.x, a.y - 76 * HS, a.hp, a.max, '#5fe0d0');
  }
  window.drawZombieHD = drawZombieHD; window.drawGolemHD = drawGolemHD; window.drawArcherHD = drawArcherHD;

  window.drawWizHD = drawWizHD; window.drawSorcHD = drawSorcHD; window.drawPetHD = drawPetHD; window.drawStaffHD = drawStaffHD;
})();
