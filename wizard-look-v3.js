/* =====================================================================
   SORCERER BATTLE: wizard renderer v3 (vex sprite parts)
   The wizard is drawn from vector parts authored in art-src/wizard.vx.js with vex
   (github.com/uilianks/vex) and exported to public/art/wiz/sprites at 4 px per unit.
   Every part shares one 60 x 100 frame with the feet at (30, 96), so the game stacks
   them paper-doll style at exactly the coordinates the old procedural wizard used.
   Same look data, same states (cast, hurt, ghost, slump, KO, wounds), same transforms.
   ART_STYLE: 'v3' (default) | 'v1' (classic) | 'v2' (hand-coded attempt).
   ===================================================================== */
(function () {
  try { const s = localStorage.getItem('sb.artStyle'); ART_STYLE = s && s !== 'v2' ? s : 'v3'; } catch (e) { ART_STYLE = 'v3'; }
})();
drawWiz = function (w, X, ava) { return ART_STYLE === 'v1' ? drawWizV1(w, X, ava) : ART_STYLE === 'v2' ? drawWizV2(w, X, ava) : drawWizV3(w, X, ava); };

const WIZ_DIR = 'art/wiz/sprites/', WIZ_PX = 4, WIZ_IMG = {}, WIZ_WHITE = {};
function wimg(n) { let im = WIZ_IMG[n]; if (!im) { im = WIZ_IMG[n] = new Image(); im.src = WIZ_DIR + n + '.png'; } return im.complete && im.naturalWidth ? im : null; }
function wwhite(n, im) {           // white silhouette for the hit flash, built once per part
  let c = WIZ_WHITE[n]; if (c) return c;
  c = WIZ_WHITE[n] = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c;
}
// draw part n whose design box (bw x bh units) has its top-left at (ox, oy); outlines extend past the box
function wpart(x, n, ox, oy, bw, bh, white) {
  const im = wimg(n); if (!im) return false;
  const W = im.naturalWidth / WIZ_PX, H = im.naturalHeight / WIZ_PX;
  x.drawImage(white ? wwhite(n, im) : im, ox - (W - bw) / 2, oy - (H - bh) / 2, W, H); return true;
}
const wframe = (x, n, white) => wpart(x, n, -30, -96, 60, 100, white);
// preload every part so the first battle frame is complete
(function preload() {
  const robes = COSMETICS.robe.map(r => r.id), names = ['boot', 'hat_mushroom', 'hat_crown', 'mouth_smile', 'mouth_open', 'mouth_flat', 'beard_white', 'beard_brown', 'beard_ginger', 'beard_long'];
  robes.forEach(r => names.push('body_' + r, 'arm_' + r, 'hat_pointy_' + r, 'hat_witch_' + r, 'hat_feathered_' + r, 'hood_back_' + r, 'hood_front_' + r));
  COSMETICS.skin.forEach(s => names.push('head_' + s.id)); COSMETICS.staff.forEach(s => names.push('staff_' + s.id));
  ['idle', 'blink', 'cast', 'hurt', 'tired', 'stun', 'ko'].forEach(f => names.push('face_' + f));
  names.forEach(wimg);
})();

function drawWizV3(w, X, ava) {
  const lk = w.look || {}, robe = lk.robe || 'azure';
  if (!wimg('body_' + robe)) return drawWizV1(w, X, ava);             // parts still loading: fall back for that frame
  const x = X || ctx; x.save(); x.translate(w.x, w.y); if (!ava) x.scale(SC, SC);
  const mv = Math.hypot(w.vx || 0, w.vy || 0), walk = ava ? 0 : Math.min(1, mv / 25);
  const bob = ava ? 0 : Math.abs(Math.sin(w.t * 9)) * 3 * walk + (w.jump || 0);
  if (!ava) { x.fillStyle = 'rgba(10,6,20,.33)'; x.beginPath(); x.ellipse(0, 0.5, 19, 6, 0, 0, 7); x.fill(); }
  if (w.ghostT > 0 && !ava) x.globalAlpha *= .42 + Math.sin(w.t * 20) * .06;
  if (w.isDecoy) x.globalAlpha *= .72 + Math.sin(w.t * 12) * .1;
  if (w.dead) { const f = Math.min(1, w.dead * 1.5); x.globalAlpha *= 1 - f; x.rotate(f * 1.3 * w.face); x.translate(0, f * -4); }
  if (w.slump) { x.rotate(.12 * w.face); x.translate(0, 3); }
  x.scale(w.face || 1, 1); x.rotate(ava ? 0 : clamp((w.vx || 0) * (w.face || 1), -80, 80) * .0018); x.translate(0, -bob);

  const k = w.book[w.i], [l, m] = COL[SP[k].el], fl = w.flash > 0;
  const casting = w.recoil > 0, prog = Math.min(1, (w.p || 0) / SP[k].t), sway = Math.sin(w.t * 5);
  const raise = casting ? -.6 : -.15 - prog * .35, step = ava ? 0 : Math.sin(w.t * 9) * walk;
  if (w.flash > 0) w._hitAt = w.t;
  const face = w.dead ? 'ko' : (w.stunT > 0 ? 'stun' : (w._hitAt !== undefined && w.t - w._hitAt < .45 ? 'hurt' : (casting || prog > .72 ? 'cast' : (w.slump ? 'tired' : ((w.t % 3.7) < .11 ? 'blink' : 'idle')))));
  const beard = lk.beard || 'white', hat = w.hatId || 'pointy';

  // boots (step with the walk)
  wpart(x, 'boot', -6 - 6 + step * 2.4, -6.6, 12, 8, fl); wpart(x, 'boot', 6 - 6 - step * 2.4, -6.6, 12, 8, fl);
  // staff (behind the body), rotated about the gloved grip; spell glow on its head
  x.save(); x.translate(9, -34); x.rotate(raise);
  wpart(x, 'staff_' + (w.staffId || 'oak'), -8, -34, 20, 60, fl);
  if (!fl) { const gx = 4, gy = -26, r = 9 + (casting ? 6 : prog * 4); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, '#ffffffaa'); g.addColorStop(.35, l + '88'); g.addColorStop(1, m + '00'); x.fillStyle = g; x.beginPath(); x.arc(gx, gy, r, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; }
  x.restore();
  // body stack
  if (hat === 'hood') wframe(x, 'hood_back_' + robe, fl);
  wframe(x, 'body_' + robe, fl);
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'robe');
  wframe(x, 'head_' + (lk.skin || 'peach'), fl);
  if (!fl) { wframe(x, 'face_' + face); if (beard === 'none') wframe(x, face === 'hurt' || face === 'ko' ? 'mouth_open' : face === 'cast' ? 'mouth_flat' : 'mouth_smile'); }
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'head');
  if (beard !== 'none') { x.save(); if (beard === 'long') { x.translate(1, -42); x.rotate(sway * .02); x.translate(-1, 42); } wframe(x, 'beard_' + beard, fl); x.restore(); }
  // front arm: rests forward, lifts while charging, thrusts on cast (shoulder pivot = box 8,3)
  x.save(); x.translate(-4.5, -35.5); x.rotate(casting ? -1.45 : .32 + Math.sin(w.t * 3) * .09 - prog * .45);
  wpart(x, 'arm_' + robe, -8, -3, 16, 24, fl);
  if (casting) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 18, 0, 0, 18, 10); g.addColorStop(0, '#fff'); g.addColorStop(.4, l); g.addColorStop(1, m + '00'); x.fillStyle = g; x.beginPath(); x.arc(0, 18, 10, 0, 7); x.fill(); }
  x.restore();
  // hat (sways a little about the brim)
  x.save(); x.translate(1, -55); x.rotate(sway * .025); x.translate(-1, 55);
  if (hat === 'hood') wframe(x, 'hood_front_' + robe, fl);
  else wframe(x, hat === 'mushroom' || hat === 'crown' ? 'hat_' + hat : `hat_${hat}_${robe}`, fl);
  x.restore();
  if (w.wnd && w.wnd.lvl > 0 && !fl) drawWounds(x, w, 'top');
  x.restore();
}
