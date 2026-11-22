/* =====================================================================
   SORCERER BATTLE: wizard renderer v2 ("illustrated" style)
   Follows WIZARD-ART-BRIEF.md: same Canvas procedural approach, same look
   data and states, but with a designed silhouette, an outline hierarchy,
   cel shading (flat base + shadow shape + highlight shape), boots, a
   bell sleeve, a mantle, a sash, and an expressive face.

   Coordinates match v1 exactly: (0,0) = ground under the feet, figure
   rises to about y = -84, facing +x (flipped with scale(face,1)).
   The v1 renderer stays available: ART_STYLE = 'v1' | 'v2'.
   ===================================================================== */
const drawWizV1 = drawWiz;
let ART_STYLE = (() => { try { return localStorage.getItem('sb.artStyle') || 'v2'; } catch (e) { return 'v2'; } })();
function setArtStyle(s) { ART_STYLE = s; try { localStorage.setItem('sb.artStyle2', s); } catch (e) {} if (typeof refreshMeta === 'function') refreshMeta(); }
drawWiz = function (w, X, ava) { return ART_STYLE === 'v1' ? drawWizV1(w, X, ava) : drawWizV2(w, X, ava); };

/* ---------- helpers ---------- */
const OL = '#1b1026';                         // outline colour (deep violet-black, not pure black)
const LW = { out: 2.7, mid: 1.7, fine: .9 };  // outline hierarchy
function shadeHex(h, a) {                     // a < 0 darkens toward black, a > 0 lightens toward white
  if (!h || h[0] !== '#') return h; h = h.slice(1); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const t = a < 0 ? 0 : 255, p = Math.abs(a); r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const pathOf = (x, pts) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
function outline(x, w) { x.strokeStyle = OL; x.lineWidth = w; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }

/* ---------- main ---------- */
function drawWizV2(w, X, ava) {
  const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
  const mv = Math.hypot(w.vx || 0, w.vy || 0), walk = ava ? 0 : Math.min(1, mv / 25);
  const bob = ava ? 0 : Math.abs(Math.sin(w.t * 9)) * 3 * walk + (w.jump || 0);
  if (!ava) { x.fillStyle = 'rgba(10,6,20,.33)'; x.beginPath(); x.ellipse(0, 0.5, 19, 6, 0, 0, 7); x.fill(); }
  if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(w.t * 20) * .06;
  if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(w.t * 12) * .1;
  if (w.dead) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4); }
  if (w.slump) { x.rotate(.12 * w.face); x.translate(0, 3); }
  x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018); x.translate(0, -bob);

  const k = w.book[w.i], [l, m] = COL[SP[k].el], fl = w.flash > 0, F = c => fl ? '#fff' : c;
  const casting = w.recoil > 0, prog = Math.min(1, (w.p || 0) / SP[k].t), sway = Math.sin(w.t * 5) * 2;
  const raise = casting ? -.6 : -.15 - prog * .35, step = ava ? 0 : Math.sin(w.t * 9) * walk;
  const R = w.robe, base = mixHex(R[0], R[1], .45), hi = shadeHex(R[0], .2), sh = mixHex(R[1], R[2], .25), deep = mixHex(R[1], R[2], .55), trim = w.trim;
  // expression state (renderer-only memory on the entity)
  if (w.flash > 0) w._hitAt = w.t;
  const face = w.dead ? 'ko' : (w.stunT > 0 ? 'stun' : (w._hitAt !== undefined && w.t - w._hitAt < .45 ? 'hurt' : (casting || prog > .72 ? 'cast' : (w.slump ? 'tired' : 'idle'))));

  // 1. boots (peek out under the hem, step with the walk)
  [[-6 + step * 2.4, 1], [6 - step * 2.4, -1]].forEach(([bx]) => {
    x.fillStyle = F('#3b2418'); pathOf(x, [[bx - 4, -4], [bx - 4.6, 0], [bx - 1, 1.6], [bx + 5.4, 1.6], [bx + 6.2, -.4], [bx + 2.6, -4.2]]); x.fill(); outline(x, LW.mid);
    x.strokeStyle = F('#7a5238'); x.lineWidth = LW.fine; x.beginPath(); x.moveTo(bx - 2.5, -2.6); x.lineTo(bx + 1.5, -2.8); x.stroke();
  });

  // 2. staff + the hand holding it (behind the body)
  x.save(); x.translate(9, -34); x.rotate(raise); drawStaff(x, w.staffId, l, m, casting, fl);
  [[2.2, 1], [1.2, 8]].forEach(([wx, wy]) => { x.fillStyle = F('#5a3826'); x.beginPath(); x.ellipse(wx, wy, 3.1, 1.6, -.1, 0, 7); x.fill(); outline(x, LW.fine + .3); });
  x.restore();
  const gh = { x: 9 + Math.cos(raise) * 1.6 - Math.sin(raise) * 3.5, y: -34 + Math.sin(raise) * 1.6 + Math.cos(raise) * 3.5 };
  x.lineCap = 'round'; x.strokeStyle = OL; x.lineWidth = 8; x.beginPath(); x.moveTo(4, -37); x.lineTo(gh.x - 1.5, gh.y - 1); x.stroke();
  x.strokeStyle = F(sh); x.lineWidth = 5.4; x.stroke();
  x.fillStyle = F(w.skin); x.beginPath(); x.arc(gh.x, gh.y, 3.2, 0, 7); x.fill(); outline(x, LW.mid);

  // 3. hat/hood back layer
  hatV2(x, w, sway, fl, 'back');

  // 4. robe: designed silhouette, shaped hem, cel shadow + highlight, folds, hem trim
  const hem = [[-18 + sway * .5, -2], [-11, 1.6], [-5, -.6], [1, 2], [7, -.6], [13, 1.6], [18 + sway * .5, -2]];
  const robePath = () => {
    x.beginPath(); x.moveTo(-9, -41); x.quadraticCurveTo(-14.5, -20, hem[0][0], hem[0][1]);
    for (let i = 1; i < hem.length; i++) { const [px, py] = hem[i - 1], [qx, qy] = hem[i]; x.quadraticCurveTo((px + qx) / 2, Math.max(py, qy) + 1.4, qx, qy); }
    x.quadraticCurveTo(14, -20, 9, -41); x.quadraticCurveTo(0, -44.5, -9, -41); x.closePath();
  };
  robePath(); x.fillStyle = F(base); x.fill();
  if (!fl) {
    x.save(); robePath(); x.clip();
    x.fillStyle = sh; x.beginPath(); x.moveTo(3, -44); x.quadraticCurveTo(7, -24, 9, 4); x.lineTo(26, 4); x.lineTo(26, -44); x.closePath(); x.fill();
    x.fillStyle = hi; x.beginPath(); x.moveTo(-8.5, -41); x.quadraticCurveTo(-13.6, -22, -16, -2); x.lineTo(-12.2, -1); x.quadraticCurveTo(-10, -22, -5.5, -40); x.closePath(); x.fill();
    x.strokeStyle = deep; x.lineWidth = LW.mid; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-3.5, -21); x.quadraticCurveTo(-5.5, -10, -6.5, 0); x.moveTo(4.5, -19); x.quadraticCurveTo(6, -9, 7.6, 0); x.stroke();
    x.save(); x.translate(0, -2.6); x.strokeStyle = trim; x.lineWidth = 2.4; x.beginPath(); x.moveTo(hem[0][0], hem[0][1]);
    for (let i = 1; i < hem.length; i++) { const [px, py] = hem[i - 1], [qx, qy] = hem[i]; x.quadraticCurveTo((px + qx) / 2, Math.max(py, qy) + 1.4, qx, qy); } x.stroke(); x.restore();
    x.restore();
  }
  robePath(); outline(x, LW.out);
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'robe');

  // 5. sash belt with buckle and hanging tail
  x.fillStyle = F(deep); x.beginPath(); x.moveTo(-11.6, -25.5); x.quadraticCurveTo(0, -23, 11.4, -25.5); x.lineTo(11.6, -21.5); x.quadraticCurveTo(0, -19, -11.8, -21.5); x.closePath(); x.fill(); outline(x, LW.mid);
  x.fillStyle = F(deep); pathOf(x, [[-6.5, -21], [-4.5, -12.5], [-2.4, -13.6], [-3.6, -21]]); x.fill(); outline(x, LW.fine + .4);
  x.fillStyle = F(trim); x.beginPath(); x.roundRect(-3, -26.2, 6, 5.6, 1.4); x.fill(); outline(x, LW.mid);
  if (!fl) { x.fillStyle = shadeHex(trim, -.35); x.fillRect(-1.1, -24.5, 2.2, 2.2); }

  // 6. mantle / collar (separates head from torso, gives shoulders)
  x.fillStyle = F(mixHex(R[0], R[1], .7)); x.beginPath(); x.moveTo(-10.5, -40.5); x.quadraticCurveTo(-6, -33.5, 0, -33); x.quadraticCurveTo(6, -33.5, 10.5, -40.5); x.quadraticCurveTo(0, -45.5, -10.5, -40.5); x.closePath(); x.fill(); outline(x, LW.mid);
  if (!fl) { x.strokeStyle = trim; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-9.2, -39.6); x.quadraticCurveTo(-5.5, -34.6, 0, -34.2); x.quadraticCurveTo(5.5, -34.6, 9.2, -39.6); x.stroke();
    x.fillStyle = trim; x.beginPath(); x.arc(0, -34.4, 1.6, 0, 7); x.fill(); x.strokeStyle = OL; x.lineWidth = LW.fine; x.stroke(); }

  // 7. head: base + cel shadow crescent, nose
  const skin = w.skin, sk2 = shadeHex(skin, -.2);
  x.fillStyle = F(skin); x.beginPath(); x.arc(1, -46, 8.2, 0, 7); x.fill();
  if (!fl) { x.save(); x.beginPath(); x.arc(1, -46, 8.2, 0, 7); x.clip(); x.fillStyle = sk2; x.beginPath(); x.arc(-5, -44, 9.6, 0, 7); x.rect(-20, -60, 40, 30); x.fill('evenodd'); x.restore(); }
  x.beginPath(); x.arc(1, -46, 8.2, 0, 7); outline(x, LW.out - .3);
  x.fillStyle = F(sk2); x.beginPath(); x.ellipse(7.8, -43.6, 2.3, 1.9, 0, 0, 7); x.fill(); outline(x, LW.fine + .3);
  if (!fl) faceV2(x, w, face);
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'head');

  // 8. beard + moustache
  beardV2(x, w, sway, fl, face);

  // 9. front arm: bell sleeve, cuff trim, hand; lifts while charging, thrusts on cast
  x.save(); x.translate(-4.5, -35.5); x.rotate(casting ? -1.45 : .32 + Math.sin(w.t * 3) * .09 - prog * .45);
  x.fillStyle = F(base); x.beginPath(); x.moveTo(-3.4, 0); x.quadraticCurveTo(-6.2, 6, -6.4, 11.5); x.quadraticCurveTo(0, 13.4, 6.2, 11.2); x.quadraticCurveTo(5.4, 5, 3.6, 0); x.closePath(); x.fill();
  if (!fl) { x.save(); x.clip(); x.fillStyle = sh; x.fillRect(1, -2, 8, 16); x.restore(); x.strokeStyle = trim; x.lineWidth = 2; x.beginPath(); x.moveTo(-6, 10.2); x.quadraticCurveTo(0, 12, 5.8, 10); x.stroke(); }
  x.beginPath(); x.moveTo(-3.4, 0); x.quadraticCurveTo(-6.2, 6, -6.4, 11.5); x.quadraticCurveTo(0, 13.4, 6.2, 11.2); x.quadraticCurveTo(5.4, 5, 3.6, 0); outline(x, LW.mid + .3);
  x.fillStyle = F(skin); x.beginPath(); x.arc(0, 14.6, 3.4, 0, 7); x.fill(); outline(x, LW.mid);
  if (!fl) { x.fillStyle = shadeHex(skin, .35); x.beginPath(); x.arc(-1, 13.6, 1, 0, 7); x.fill(); }
  if (casting) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 16, 0, 0, 16, 9); g.addColorStop(0, '#fff'); g.addColorStop(.4, l); g.addColorStop(1, m + '00'); x.fillStyle = g; x.beginPath(); x.arc(0, 16, 9, 0, 7); x.fill(); }
  x.restore();

  // 10. hat front layer, then battle damage that floats on top
  if (w.hatId !== 'hood') { x.save(); x.translate(0, -2.6); hatV2(x, w, sway, fl, 'front'); x.restore(); } else hatV2(x, w, sway, fl, 'front');
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'top');
  x.restore();
}

/* ---------- face: eyes, brows, mouth by state ---------- */
function faceV2(x, w, face) {
  const ink = '#1b1026', brow = w.beardStyle === 'none' || !w.beardC ? shadeHex(w.skin, -.55) : shadeHex(w.beardC === '#eef2ff' || w.beardC === '#f4f6ff' ? '#c9cde0' : w.beardC, -.25);
  const eyes = [[2.3, -46.4, .85], [6.4, -46.2, 1]];
  const blink = face === 'idle' && (w.t % 3.7) < .11;
  x.lineCap = 'round';
  eyes.forEach(([ex, ey, s]) => {
    if (face === 'ko') { x.strokeStyle = ink; x.lineWidth = 1.3; x.beginPath(); x.moveTo(ex - 1.4, ey - 1.4); x.lineTo(ex + 1.4, ey + 1.4); x.moveTo(ex + 1.4, ey - 1.4); x.lineTo(ex - 1.4, ey + 1.4); x.stroke(); return; }
    if (face === 'stun') { x.strokeStyle = ink; x.lineWidth = .9; x.beginPath(); for (let a = 0; a < 9; a += .5) x.lineTo(ex + Math.cos(a + w.t * 8) * a * .2, ey + Math.sin(a + w.t * 8) * a * .2); x.stroke(); return; }
    if (face === 'hurt') { x.strokeStyle = ink; x.lineWidth = 1.2; x.beginPath(); x.moveTo(ex - 1.5, ey - 1.1); x.lineTo(ex + .6, ey); x.lineTo(ex - 1.5, ey + 1.1); x.stroke(); return; }
    if (blink || face === 'tired') { x.strokeStyle = ink; x.lineWidth = 1.1; x.beginPath(); x.moveTo(ex - 1.3, ey + (face === 'tired' ? .4 : 0)); x.lineTo(ex + 1.3, ey + (face === 'tired' ? .4 : 0)); x.stroke(); return; }
    const ry = face === 'cast' ? 1.5 : 2.05;
    x.fillStyle = ink; x.beginPath(); x.ellipse(ex, ey, 1.3 * s, ry * s, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex - .35, ey - .7 * s, .52, 0, 7); x.fill();
  });
  // brows
  x.strokeStyle = brow; x.lineWidth = 1.6;
  const by = -49.6, ang = face === 'cast' ? .45 : face === 'hurt' ? -.35 : face === 'tired' ? -.15 : 0;
  [[2.3, -1], [6.4, 1]].forEach(([bx, side]) => { x.beginPath(); x.moveTo(bx - 1.6, by + (side < 0 ? -ang : ang) * -1.2 - .2); x.lineTo(bx + 1.6, by + (side < 0 ? ang : -ang) * -1.2 - .2); x.stroke(); });
  // mouth (only visible when there's no beard covering it)
  if (w.beardStyle === 'none' || !w.beardC) {
    x.strokeStyle = ink; x.lineWidth = 1.1;
    if (face === 'hurt' || face === 'ko') { x.fillStyle = '#5a1e2a'; x.beginPath(); x.ellipse(4.6, -42.2, 1.3, 1.6, 0, 0, 7); x.fill(); }
    else if (face === 'cast') { x.beginPath(); x.moveTo(3, -42.4); x.lineTo(6.4, -42.8); x.stroke(); }
    else { x.beginPath(); x.arc(4.6, -43.6, 2.2, .35, Math.PI - .35); x.stroke(); }
  }
}

/* ---------- beard + moustache: tufted silhouettes with a shadow lobe ---------- */
function beardV2(x, w, sway, fl, face) {
  if (w.beardStyle === 'none' || !w.beardC) return;
  const bc = w.beardC, bs = shadeHex(bc, -.24), F = c => fl ? '#fff' : c;
  let shape;
  if (w.beardStyle === 'long') shape = [[-6, -44], [-7.5, -34], [-5.5, -24], [-2 + sway * .3, -17], [1 + sway * .4, -11], [3.5 + sway * .4, -16], [7 + sway * .3, -21], [9.8, -30], [10.4, -44]];
  else shape = [[-5.6, -44], [-6.4, -38], [-3.4, -34], [-.6, -31.4], [2.6, -33.4], [5.4, -31.2], [8.4, -34.6], [10.4, -39], [10.4, -44]];
  const bPath = () => { x.beginPath(); x.moveTo(shape[0][0], shape[0][1]); for (let i = 1; i < shape.length; i++) { const [px, py] = shape[i - 1], [qx, qy] = shape[i]; x.quadraticCurveTo(px + (qx - px) * .5 + (i % 2 ? -1 : 1), py + (qy - py) * .5 + 1, qx, qy); } x.quadraticCurveTo(2.4, -41.5, shape[0][0], shape[0][1]); x.closePath(); };
  bPath(); x.fillStyle = F(bc); x.fill();
  if (!fl) { x.save(); bPath(); x.clip(); x.fillStyle = bs; x.beginPath(); x.ellipse(9, -26, 7, 16, .15, 0, 7); x.fill();
    x.strokeStyle = bs; x.lineWidth = LW.fine; x.beginPath(); x.moveTo(1, -38); x.quadraticCurveTo(0, -32, 1.2, w.beardStyle === 'long' ? -18 : -33); x.moveTo(5, -38); x.quadraticCurveTo(5.6, -32, 4.4, w.beardStyle === 'long' ? -20 : -33.6); x.stroke(); x.restore(); }
  bPath(); outline(x, LW.mid + .3);
  // moustache: two lobes over the mouth; opens a little when casting/hurt
  const open = face === 'cast' || face === 'hurt' ? 1.1 : 0;
  [[-1, -1.8], [1, 9.6]].forEach(([s, tipX]) => {
    x.fillStyle = F(bc); x.beginPath(); x.moveTo(4.4, -43.4); x.quadraticCurveTo((4.4 + tipX) / 2, -45.2 - open * .4, tipX, -41.6 + open); x.quadraticCurveTo((4.4 + tipX) / 2, -40.8 + open, 4.4, -42.2); x.closePath(); x.fill(); outline(x, LW.fine + .4);
  });
}

/* ---------- hats: cel-shaded cone, shaped brim, band, ornament ---------- */
function hatV2(x, w, sway, fl, pass) {
  const id = w.hatId || 'pointy', F = c => fl ? '#fff' : c, base = mixHex(w.robe[0], w.robe[1], .45), sh = mixHex(w.robe[1], w.robe[2], .25), hi = shadeHex(w.robe[0], .2), trim = w.trim;
  if (id === 'crown' || id === 'mushroom') return drawHat(x, w, sway, fl, pass);   // already distinct; keep v1 art
  if (id === 'hood') {
    if (pass === 'back') {
      const hp = () => { x.beginPath(); x.moveTo(-12, -36); x.quadraticCurveTo(-17, -62, 0, -63); x.quadraticCurveTo(-3, -71 + sway, -13 + sway, -68); x.quadraticCurveTo(8, -67, 13.5, -58); x.quadraticCurveTo(17.5, -46, 13, -36); x.closePath(); };
      hp(); x.fillStyle = F(base); x.fill();
      if (!fl) { x.save(); hp(); x.clip(); x.fillStyle = sh; x.fillRect(4, -72, 20, 40); x.fillStyle = hi; x.beginPath(); x.ellipse(-9, -54, 2.5, 9, -.2, 0, 7); x.fill(); x.restore(); }
      hp(); outline(x, LW.out);
    } else {
      x.strokeStyle = OL; x.lineWidth = 6.4; x.beginPath(); x.arc(1, -46, 10.6, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
      x.strokeStyle = F(sh); x.lineWidth = 3.8; x.stroke(); x.strokeStyle = F(trim); x.lineWidth = 1.4; x.beginPath(); x.arc(1, -46, 12.1, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
    }
    return;
  }
  if (pass !== 'front') return;
  const witch = id === 'witch', bw = witch ? 21.5 : 16, bh = witch ? 5.8 : 4.9;
  // brim: top face + darker underside lip
  x.fillStyle = F(sh); x.beginPath(); x.ellipse(1, -51.4, bw, bh, 0, 0, 7); x.fill(); outline(x, LW.out);
  x.fillStyle = F(base); x.beginPath(); x.ellipse(1, -52.4, bw - 1.2, bh - 1.6, 0, 0, 7); x.fill();
  if (!fl) { x.strokeStyle = hi; x.lineWidth = 1.2; x.beginPath(); x.ellipse(1, -52.6, bw - 3, bh - 2.4, 0, Math.PI * 1.08, Math.PI * 1.6); x.stroke(); }
  // cone with a bent, swaying tip
  const tipX = (witch ? 13 : -13) + sway, tipY = witch ? -82 : -85;
  const cone = () => {
    x.beginPath(); x.moveTo(-8.4, -53.5);
    if (witch) { x.quadraticCurveTo(-5.5, -66, -3.5, -70); x.lineTo(-4.2, -72.5); x.quadraticCurveTo(0, -80, tipX, tipY); x.quadraticCurveTo(4, -74, 5.4, -70); x.quadraticCurveTo(8, -62, 10, -53.5); }
    else { x.quadraticCurveTo(-4.5, -66, -3.2, -72); x.quadraticCurveTo(-3.4, -80, tipX, tipY); x.quadraticCurveTo(3.4, -77, 5.6, -69); x.quadraticCurveTo(8.6, -61, 10.4, -53.5); }
    x.quadraticCurveTo(1, -51.4, -8.4, -53.5); x.closePath();
  };
  cone(); x.fillStyle = F(base); x.fill();
  if (!fl) {
    x.save(); cone(); x.clip(); x.fillStyle = sh; x.beginPath(); x.moveTo(2.4, -52); x.quadraticCurveTo(4.6, -66, 1, -74); x.lineTo(30, -96); x.lineTo(30, -46); x.closePath(); x.fill();
    x.strokeStyle = hi; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-5.6, -56.5); x.quadraticCurveTo(-3.4, -65, -2.6, -70); x.stroke();
    if (witch) { x.strokeStyle = shadeHex(base, -.45); x.lineWidth = LW.fine + .3; x.beginPath(); x.moveTo(-4.6, -71); x.quadraticCurveTo(0, -73, 4.8, -71); x.stroke(); }
    x.restore();
  }
  cone(); outline(x, LW.out);
  // band + ornament
  x.strokeStyle = OL; x.lineWidth = 5.6; x.lineCap = 'butt'; x.beginPath(); x.moveTo(-8.2, -56.4); x.quadraticCurveTo(1, -58.6, 10.2, -56.4); x.stroke();
  x.strokeStyle = F(trim); x.lineWidth = 3.4; x.stroke(); x.lineCap = 'round';
  if (witch) { x.fillStyle = F('#ffd45e'); x.beginPath(); x.roundRect(-1.4, -60, 5.6, 5.2, 1); x.fill(); outline(x, LW.mid); x.fillStyle = F(shadeHex(base, -.2)); x.fillRect(.4, -58.2, 2, 1.8); }
  else { x.fillStyle = F('#ffd45e'); x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.3 : 3; x.lineTo(1.6 + Math.cos(a) * r, -57.4 + Math.sin(a) * r); } x.closePath(); x.fill(); outline(x, LW.fine + .4); }
  // tip ornament (pointy) or feather
  if (id === 'feathered') {
    x.fillStyle = F('#ff5d6c'); x.beginPath(); x.moveTo(7, -57); x.quadraticCurveTo(10, -72, 20 + sway, -80); x.quadraticCurveTo(18, -66, 10, -56); x.closePath(); x.fill(); outline(x, LW.mid);
    if (!fl) { x.strokeStyle = '#ffd0d4'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(8.5, -58); x.quadraticCurveTo(12, -70, 19 + sway, -78); x.stroke(); }
  } else if (!witch) { x.fillStyle = F(trim); x.beginPath(); x.arc(tipX, tipY + 1, 2.4, 0, 7); x.fill(); outline(x, LW.fine + .4); }
}
