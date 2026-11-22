/* =====================================================================
   WIZARDS VS SORCERERS: zodiac beast art (drawn in code)
   Shadow-ink creatures: dark violet bodies, a glowing violet rim, white eyes.
   drawBeastArt(x, id, t, flash, spd) draws one beast with its feet at (0,0), facing LEFT.
   ===================================================================== */
(function () {
  const RIM = '#8a6cff', HI = '#c9b8ff';
  let fl = false;
  const fillB = (x, y0, y1) => { if (fl) return '#ffffff'; const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#463583'); g.addColorStop(.6, '#22154d'); g.addColorStop(1, '#0c0620'); return g; };
  const shape = (x, fn, y0, y1, far) => { x.beginPath(); fn(); x.fillStyle = far ? (fl ? '#ddd' : '#120a2c') : fillB(x, y0, y1); x.fill(); x.lineWidth = 2; x.strokeStyle = fl ? '#fff' : (far ? '#4a3a9a' : RIM); if (!far && !fl) { x.shadowColor = '#8a6cff'; x.shadowBlur = 6; } x.lineJoin = 'round'; x.stroke(); x.shadowBlur = 0; };
  const ell = (x, cx, cy, rx, ry, rot) => x.ellipse(cx, cy, rx, ry, rot || 0, 0, 6.283);
  const eye = (x, ex, ey, r) => { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(200,170,255,.7)'; x.beginPath(); x.arc(ex, ey, (r || 1.6) * 2.8, 0, 7); x.fill(); x.restore(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, ey, r || 1.6, 0, 7); x.fill(); };
  const leg = (x, lx, top, len, sw, wd, far) => shape(x, () => { x.moveTo(lx - wd, top); x.lineTo(lx - wd + sw, top + len); x.lineTo(lx + wd + sw, top + len); x.lineTo(lx + wd, top); x.closePath(); }, top, top + len, far);
  const line = (x, pts, w, col) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineWidth = w; x.strokeStyle = fl ? '#fff' : (col || RIM); x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); };
  const curve = (x, a, c, b, w, col) => { x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(c[0], c[1], b[0], b[1]); x.lineWidth = w; x.strokeStyle = fl ? '#fff' : (col || RIM); x.lineCap = 'round'; x.stroke(); };

  /* a four-legged body: L long, H tall, legs G long. Head goes at the left end. */
  function quad(x, t, o) {
    const s = Math.sin(t), c = Math.cos(t), top = -o.G - o.H / 2, by = -o.G - o.H / 2, sw = o.sw === undefined ? 3 : o.sw;
    if (o.tail) o.tail(s);
    leg(x, -o.L * .32 + 2, -o.G - 2, o.G + 2, -s * sw, o.lw || 2.2, 1); leg(x, o.L * .34 + 2, -o.G - 2, o.G + 2, s * sw, o.lw || 2.2, 1);
    shape(x, () => ell(x, 0, by, o.L / 2, o.H / 2), by - o.H / 2, by + o.H / 2);
    if (o.marks) o.marks(by);
    leg(x, -o.L * .32 - 2, -o.G - 2, o.G + 2, s * sw, o.lw || 2.2); leg(x, o.L * .34 - 2, -o.G - 2, o.G + 2, -s * sw, o.lw || 2.2);
    return { by, hx: -o.L / 2, bob: c * .6 };
  }

  const ART = {
    rat(x, t) { const q = quad(x, t, { L: 22, H: 11, G: 4, sw: 2, lw: 1.5, tail: s => curve(x, [10, -9], [22, -14 + s * 3], [27, -3], 1.8) });
      shape(x, () => { x.moveTo(-9, -15); x.quadraticCurveTo(-18, -15, -21, -8); x.quadraticCurveTo(-15, -4, -9, -6); x.closePath(); }, -15, -4);
      shape(x, () => ell(x, -10, -16.5, 3.4, 3.8), -20, -13); eye(x, -15, -11, 1.3); line(x, [[-20, -8], [-24, -9]], 1, HI); line(x, [[-20, -8], [-24, -6.5]], 1, HI); },
    ox(x, t) { const q = quad(x, t, { L: 34, H: 21, G: 9, sw: 2.5, lw: 3.2, tail: s => { curve(x, [17, -22], [23, -18], [21 + s * 2, -9], 2); } });
      shape(x, () => ell(x, -6, -31, 9, 5), -36, -26);                                            // hump
      shape(x, () => ell(x, -19, -18, 9, 8.5), -27, -10);
      curve(x, [-22, -25], [-30, -30], [-28, -36], 2.6, HI); curve(x, [-15, -26], [-10, -33], [-14, -37], 2.6, HI);   // horns
      eye(x, -22, -19, 1.7); line(x, [[-26, -12.5], [-22, -11.5]], 1.4, HI); },
    tiger(x, t) { const q = quad(x, t, { L: 32, H: 15, G: 9, lw: 2.6, tail: s => curve(x, [15, -19], [27, -24], [26 + s * 3, -32], 2.6),
        marks: by => { for (let i = -1; i <= 2; i++) line(x, [[i * 6 - 1, by - 6.5], [i * 6 + 1, by - 1]], 1.6, HI); } });
      shape(x, () => ell(x, -18, -20, 7.5, 7), -27, -13); shape(x, () => { x.moveTo(-23, -25); x.lineTo(-22, -30); x.lineTo(-18.5, -26.5); x.closePath(); }, -30, -25); shape(x, () => { x.moveTo(-16, -26.5); x.lineTo(-13, -30); x.lineTo(-12.5, -24.5); x.closePath(); }, -30, -25);
      eye(x, -21, -21, 1.6); line(x, [[-25, -16.5], [-21, -15.5], [-23, -13.5]], 1.2, HI); },
    rabbit(x, t) { const s = Math.sin(t), hop = Math.abs(s) * 2;
      x.save(); x.translate(0, -hop); shape(x, () => ell(x, 8.5, -8, 3.4, 3.4), -11, -5);
      leg(x, 5, -6, 6, s * 2, 2.4, 1); shape(x, () => ell(x, 0, -10, 10, 8), -18, -2); leg(x, -6, -5, 5, -s * 2, 1.6);
      shape(x, () => ell(x, -10, -17, 5.6, 5.2), -22, -12);
      shape(x, () => ell(x, -9.5, -28, 2, 7, -.15), -35, -21); shape(x, () => ell(x, -5.5, -27, 2, 7, .25), -34, -20);
      eye(x, -12.5, -17.5, 1.4); x.restore(); },
    dragon(x, t) { const s = Math.sin(t), pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([-20 + u * 46, -14 - Math.sin(u * 7 + t) * 5 * (.4 + u * .6) + u * 6]); }
      // long body as a thick ribbon
      x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineWidth = 12; x.strokeStyle = fl ? '#fff' : RIM; x.stroke(); x.lineWidth = 8.6; x.strokeStyle = fl ? '#fff' : '#22154d'; x.stroke();
      for (let i = 1; i < 12; i += 2) { const p = pts[i]; shape(x, () => { x.moveTo(p[0] - 2.4, p[1] - 5); x.lineTo(p[0] + .5, p[1] - 10.5); x.lineTo(p[0] + 2.6, p[1] - 5); x.closePath(); }, p[1] - 10, p[1] - 5); }
      leg(x, -8, -10, 10, s * 2, 1.8); leg(x, 12, -7, 7, -s * 2, 1.8);
      shape(x, () => { x.moveTo(-17, -24); x.quadraticCurveTo(-31, -24, -33, -14); x.quadraticCurveTo(-25, -9, -17, -11); x.closePath(); }, -24, -9);
      curve(x, [-20, -23], [-17, -31], [-13, -32], 2, HI); curve(x, [-23, -23], [-23, -30], [-19, -33], 2, HI);
      curve(x, [-32, -14], [-37, -12], [-38, -7 + s * 1.5], 1.2, HI); eye(x, -25, -18.5, 1.8); },
    snake(x, t) { const s = Math.sin(t), pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([18 - u * 30 + Math.sin(u * 9 + t * 1.2) * 1.5, -3 - Math.max(0, u - .55) * 46 + Math.sin(u * 8 + t) * 3 * (1 - u)]); }
      x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineWidth = 8.5; x.strokeStyle = fl ? '#fff' : RIM; x.stroke(); x.lineWidth = 5.4; x.strokeStyle = fl ? '#fff' : '#22154d'; x.stroke();
      const h = pts[14]; shape(x, () => ell(x, h[0] - 3, h[1] - 1, 6.5, 4.6, -.2), h[1] - 6, h[1] + 4); eye(x, h[0] - 5, h[1] - 2.2, 1.4);
      line(x, [[h[0] - 9, h[1] + .5], [h[0] - 14, h[1] + 1 + s], [h[0] - 16.5, h[1] - 1 + s]], 1.1, '#ff8a96'); line(x, [[h[0] - 14, h[1] + 1 + s], [h[0] - 16.5, h[1] + 3 + s]], 1.1, '#ff8a96'); },
    horse(x, t) { const q = quad(x, t, { L: 30, H: 14, G: 15, sw: 5, lw: 2, tail: s => curve(x, [14, -27], [25, -24], [22 + s * 3, -11], 3.4) });
      shape(x, () => { x.moveTo(-9, -29); x.lineTo(-19, -42); x.lineTo(-13, -44); x.lineTo(-4, -26); x.closePath(); }, -44, -26);                 // neck
      shape(x, () => { x.moveTo(-13, -46); x.quadraticCurveTo(-25, -46, -27, -36); x.quadraticCurveTo(-22, -33, -15, -38); x.closePath(); }, -46, -33);
      shape(x, () => { x.moveTo(-15, -46); x.lineTo(-13.5, -51); x.lineTo(-11.5, -45.5); x.closePath(); }, -51, -45);
      for (let i = 0; i < 4; i++) line(x, [[-12 + i * 2.6, -43 + i * 4.6], [-7 + i * 2.6, -42 + i * 4.6]], 1.8, HI);                                  // mane
      eye(x, -19, -41.5, 1.5); },
    goat(x, t) { const q = quad(x, t, { L: 24, H: 13, G: 10, lw: 1.9, tail: s => line(x, [[11, -21], [15, -25 + s]], 2.6) });
      shape(x, () => ell(x, -14, -23, 6.2, 5.6, -.3), -29, -17);
      curve(x, [-13, -28], [-6, -36], [-3, -27], 2.4, HI); curve(x, [-16, -28], [-12, -37], [-7, -33], 2.4, HI);
      line(x, [[-17.5, -18.5], [-18.5, -13]], 2, HI); eye(x, -16.5, -24, 1.4); },
    monkey(x, t) { const s = Math.sin(t);
      curve(x, [7, -10], [20, -8], [18, -22 + s * 2], 2.2); curve(x, [18, -22 + s * 2], [16, -28], [12, -24], 2.2);
      leg(x, 4, -8, 8, s * 3, 2.2, 1); shape(x, () => ell(x, 0, -15, 7.5, 9, .15), -24, -6); leg(x, -3, -8, 8, -s * 3, 2.2);
      line(x, [[-4, -19], [-12, -13 + s * 2], [-15, -8 + s * 2]], 2.6); line(x, [[2, -19], [9, -14 - s * 2]], 2.6, '#4a3a9a');
      shape(x, () => ell(x, -3, -28, 6.4, 6), -34, -22); shape(x, () => ell(x, 3.5, -29, 2.4, 2.6), -32, -26); shape(x, () => ell(x, -6, -26.5, 3.6, 3.2), -30, -23);
      eye(x, -5.5, -29.5, 1.4); },
    rooster(x, t) { const s = Math.sin(t);
      for (let i = 0; i < 3; i++) curve(x, [7, -15], [17 + i * 2, -24 - i * 5], [14 + i * 3 + s, -14 - i * 7], 3, i % 2 ? HI : RIM);       // tail feathers
      line(x, [[1, -6], [1 + s * 2, 0], [-2 + s * 2, 0]], 1.5, HI); line(x, [[-4, -6], [-4 - s * 2, 0], [-7 - s * 2, 0]], 1.5, HI);
      shape(x, () => ell(x, 0, -13, 9.5, 8), -21, -5);
      shape(x, () => { x.moveTo(-5, -18); x.lineTo(-9, -29); x.lineTo(-3, -30); x.lineTo(0, -19); x.closePath(); }, -30, -18);
      shape(x, () => ell(x, -7, -31, 4.6, 4.4), -35, -27);
      x.fillStyle = fl ? '#fff' : '#ff5a6e'; x.beginPath(); x.arc(-8.5, -36, 2, 0, 7); x.arc(-6, -37, 2.2, 0, 7); x.arc(-3.6, -35.6, 1.9, 0, 7); x.fill(); x.beginPath(); x.arc(-9.5, -27, 1.8, 0, 7); x.fill();
      x.fillStyle = fl ? '#fff' : '#ffd45e'; x.beginPath(); x.moveTo(-11, -32); x.lineTo(-16, -30.5); x.lineTo(-11, -29); x.closePath(); x.fill(); eye(x, -8.5, -32, 1.3); },
    dog(x, t) { const q = quad(x, t, { L: 26, H: 12, G: 9, lw: 2, tail: s => curve(x, [12, -19], [20, -24], [18 + s * 4, -30], 2.6) });
      shape(x, () => { x.moveTo(-10, -26); x.quadraticCurveTo(-20, -27, -24, -20); x.quadraticCurveTo(-25, -15, -18, -15); x.quadraticCurveTo(-11, -14, -9, -18); x.closePath(); }, -27, -14);
      shape(x, () => ell(x, -11, -22, 2.8, 6, .25), -28, -16); eye(x, -17.5, -21.5, 1.5); x.fillStyle = fl ? '#fff' : HI; x.beginPath(); x.arc(-24, -19, 1.3, 0, 7); x.fill();
      line(x, [[-21, -15.5], [-20, -12 + Math.abs(Math.sin(t * 2)) * 1.5]], 1.8, '#ff8a96'); },
    pig(x, t) { const q = quad(x, t, { L: 30, H: 21, G: 5, sw: 1.6, lw: 2.6, tail: s => { x.beginPath(); x.arc(17, -18, 2.6, 0, 5 + s); x.lineWidth = 1.8; x.strokeStyle = fl ? '#fff' : RIM; x.stroke(); } });
      shape(x, () => ell(x, -15, -14, 8, 7.6), -22, -6); shape(x, () => ell(x, -22.5, -12.5, 3.4, 3.2), -16, -9);
      x.fillStyle = fl ? '#fff' : HI; x.beginPath(); x.arc(-23.5, -12.5, .8, 0, 7); x.arc(-21.6, -12.5, .8, 0, 7); x.fill();
      shape(x, () => { x.moveTo(-15, -21); x.lineTo(-13, -26); x.lineTo(-10, -20); x.closePath(); }, -26, -20); eye(x, -17.5, -16.5, 1.4); },
    /* the Juggernaut: a hulking horned brute with slab shoulders and fists that drag */
    jugg(x, t) { const s = Math.sin(t * .5), st = s * 3;
      leg(x, 7, -16, 16, -st, 5, 1); x.save(); x.translate(0, Math.abs(s) * -1.2);
      shape(x, () => { x.moveTo(14, -40); x.lineTo(24, -18 + s * 2); x.lineTo(16, -14 + s * 2); x.lineTo(8, -34); x.closePath(); }, -40, -14, 1);
      shape(x, () => ell(x, 21, -13 + s * 2, 6.5, 6), -19, -7, 1);
      shape(x, () => { x.moveTo(-17, -42); x.quadraticCurveTo(0, -54, 17, -42); x.lineTo(11, -14); x.quadraticCurveTo(0, -10, -11, -14); x.closePath(); }, -52, -12);
      line(x, [[-9, -36], [-2, -32], [-8, -27]], 1.3, HI); line(x, [[8, -36], [3, -31]], 1.3, HI); line(x, [[-6, -21], [6, -21]], 1.2, HI);
      shape(x, () => { x.moveTo(-21, -46); x.quadraticCurveTo(-13, -53, -6, -46); x.lineTo(-9, -39); x.lineTo(-19, -39); x.closePath(); }, -52, -39);
      shape(x, () => { x.moveTo(21, -46); x.quadraticCurveTo(13, -53, 6, -46); x.lineTo(9, -39); x.lineTo(19, -39); x.closePath(); }, -52, -39);
      shape(x, () => { x.moveTo(-17, -40); x.lineTo(-27, -20 - s * 2); x.lineTo(-30, -9 - s * 2); x.lineTo(-20, -8 - s * 2); x.lineTo(-11, -33); x.closePath(); }, -40, -8);
      shape(x, () => ell(x, -26, -6 - s * 2, 8, 7.4), -13, 1);
      line(x, [[-31, -8 - s * 2], [-28, -4 - s * 2]], 1.2, HI); line(x, [[-27, -10 - s * 2], [-24, -5 - s * 2]], 1.2, HI);
      shape(x, () => ell(x, -2, -53, 6.4, 5.6), -58, -48);
      curve(x, [-7, -55], [-15, -57], [-14, -65], 2.8, HI); curve(x, [3, -56], [10, -59], [8, -66], 2.8, HI);
      line(x, [[-6, -50.5], [-6.5, -47]], 1.6, '#fff'); line(x, [[-1.5, -50], [-1.5, -46.5]], 1.6, '#fff');
      x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,90,90,.6)'; x.beginPath(); x.arc(-4.5, -54, 3.6, 0, 7); x.fill(); x.restore(); x.fillStyle = fl ? '#fff' : '#ff5a6a'; x.beginPath(); x.arc(-4.5, -54, 1.6, 0, 7); x.fill();
      x.restore(); leg(x, -7, -16, 16, st, 5); },
  };

  window.drawBeastArt = function (x, id, t, flash) {
    const f = ART[id]; if (!f) return false; fl = !!flash;
    x.save(); x.scale(1.25, 1.25); f(x, t); x.restore(); return true;
  };
  window.BEAST_ART = ART;
})();
