/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.4 cosmetics
   Loaded after wizard-ladder.js.
   - Class pets: four wizard-only, four sorcerer-only familiars, and a dog for anyone.
   - Aura styles (sorcerers): Tempest, Halo, Shards, beside the original flame.
   - Trails (anyone): Bloom, Afterimage, Smoke, Stardust.
   - Attack styles: recoloured attacks won from Ladder rivals (Gilded Blood for Dissection).
   Some are bought with gems, some are won on the Ladder (unlock type 'ladder').
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const cls = () => (PR.look && PR.look.cls) === 'sorc' ? 'sorc' : 'wiz';

  /* ---------------- pets ---------------- */
  const PETS = [
    { id: 'grimoire', n: 'Living Grimoire', r: 'rare', cls: 'wiz', fly: 1, unlock: { type: 'level', v: 4 } },
    { id: 'flamelet', n: 'Flamelet', r: 'rare', cls: 'wiz', fly: 1, unlock: { type: 'gems', v: 40 } },
    { id: 'zephyr', n: 'Zephyr', r: 'epic', cls: 'wiz', fly: 1, unlock: { type: 'gems', v: 60 } },
    { id: 'starling', n: 'Wishing Star', r: 'epic', cls: 'wiz', fly: 1, unlock: { type: 'rank', v: 3 } },
    { id: 'panda', n: 'Mini Panda', r: 'epic', cls: 'sorc', unlock: { type: 'gems', v: 60 } },
    { id: 'snake', n: 'Jade Serpent', r: 'rare', cls: 'sorc', unlock: { type: 'level', v: 4 } },
    { id: 'rooster', n: 'Dawn Rooster', r: 'rare', cls: 'sorc', unlock: { type: 'gems', v: 40 } },
    { id: 'wolf', n: 'Shadow Wolf', r: 'legendary', cls: 'sorc', unlock: { type: 'ladder', who: 'Oro Vant' } },
    { id: 'dog', n: 'Loyal Pup', r: 'common', unlock: { type: 'free' } },
  ];
  for (const p of PETS) if (!COSMETICS.pet.some(q => q.id === p.id)) COSMETICS.pet.push(p);
  const MINE = new Set(PETS.map(p => p.id));
  const el = (x, cx, cy, rx, ry, fill, rot) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); x.fillStyle = fill; x.fill(); x.stroke(); };
  const dot = (x, cx, cy, r, fill) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = fill || '#000'; x.fill(); };
  const eyes = (x, ex, ey, gap, r) => { r = r || 1.7; for (const s of [-1, 1]) { dot(x, ex + s * gap, ey, r); dot(x, ex + s * gap + r * .3, ey - r * .35, r * .36, '#fff'); } };
  const shadow = (x, r) => { x.save(); x.fillStyle = 'rgba(8,4,18,.3)'; x.beginPath(); x.ellipse(0, .5, r, r * .32, 0, 0, 7); x.fill(); x.restore(); };
  const grad = (x, y0, y1, a, b) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const smile = (x, cx, cy, w) => { x.save(); x.lineWidth = 1.3; x.beginPath(); x.arc(cx, cy, w, .25, Math.PI - .25); x.stroke(); x.restore(); };
  function petDraw(x, id, t, face) {
    x.save(); x.scale(face || 1, 1); x.strokeStyle = '#000'; x.lineWidth = 2; x.lineJoin = 'round'; x.lineCap = 'round';
    if (id === 'grimoire') { const y = -30 + Math.sin(t * 3) * 3, f = Math.sin(t * 5) * 2.4; shadow(x, 8); x.translate(0, y);
      for (const s of [-1, 1]) { x.save(); x.scale(s, 1); x.beginPath(); x.moveTo(0, 3); x.lineTo(15, -2 + f); x.lineTo(15, -17 + f); x.lineTo(0, -12); x.closePath(); x.fillStyle = grad(x, -17, 3, '#8a5cff', '#3a1f8a'); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(0, 1); x.lineTo(13, -3.5 + f * .9); x.lineTo(13, -15.5 + f * .9); x.lineTo(0, -11); x.closePath(); x.fillStyle = '#fff6dc'; x.fill(); x.stroke();
        x.save(); x.lineWidth = 1; x.strokeStyle = '#b9a27a'; for (let i = 0; i < 2; i++) { x.beginPath(); x.moveTo(3, -9 + i * 3.4); x.lineTo(10.5, -11 + i * 3.4 + f * .6); x.stroke(); } x.restore(); x.restore(); }
      x.fillStyle = '#ffd75e'; x.beginPath(); x.rect(-1.2, -12, 2.4, 14.5); x.fill(); x.stroke(); x.beginPath(); x.moveTo(-1, 2.5); x.lineTo(-1, 9); x.lineTo(.6, 7); x.lineTo(2, 9); x.lineTo(2, 2.5); x.closePath(); x.fillStyle = '#ff4a5a'; x.fill(); x.stroke();
      eyes(x, 0, -4.5, 5.6, 1.6); for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; x.save(); x.translate(Math.cos(a) * 15, -21 + Math.sin(a) * 4); x.fillStyle = '#ffe9a0'; x.lineWidth = 1; x.beginPath(); for (let j = 0; j < 8; j++) { const an = j / 8 * 6.283, r = j % 2 ? 1 : 2.6; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.closePath(); x.fill(); x.stroke(); x.restore(); } }
    else if (id === 'flamelet') { const y = -22 + Math.sin(t * 4) * 2.5, f = Math.sin(t * 13) * 1.6; shadow(x, 7); x.translate(0, y);
      const tear = (s, tip) => { x.beginPath(); x.moveTo(tip, -16 * s - f * s); x.bezierCurveTo(10 * s, -7 * s, 10 * s, 7 * s, 0, 8 * s); x.bezierCurveTo(-10 * s, 7 * s, -10 * s, -7 * s, tip, -16 * s - f * s); x.closePath(); };
      for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(sx * 6, -4); x.quadraticCurveTo(sx * 13, -9 - f, sx * 9, -15 + f * sx); x.quadraticCurveTo(sx * 8, -8, sx * 4, -8); x.closePath(); x.fillStyle = '#ff7a2a'; x.fill(); x.stroke(); }
      tear(1, Math.sin(t * 7) * 1.5); x.fillStyle = grad(x, -16, 8, '#ffb347', '#ff5a1f'); x.fill(); x.stroke(); x.save(); x.translate(0, 2.5); tear(.6, 0); x.fillStyle = '#ffe27a'; x.fill(); x.restore();
      eyes(x, 0, 0, 3.4, 1.8); smile(x, 0, 2.2, 2.6); dot(x, -6, 2.6, 1.3, 'rgba(255,90,110,.7)'); dot(x, 6, 2.6, 1.3, 'rgba(255,90,110,.7)'); }
    else if (id === 'zephyr') { const y = -27 + Math.sin(t * 2.6) * 3; shadow(x, 7); x.translate(0, y);
      x.save(); x.lineWidth = 3.6; x.strokeStyle = '#000'; x.beginPath(); x.moveTo(-2, 6); x.bezierCurveTo(-10, 12, 4, 18, 2 + Math.sin(t * 4) * 2, 22); x.stroke(); x.lineWidth = 2; x.strokeStyle = '#b8fff1'; x.stroke(); x.restore();
      el(x, -6, 2, 6.5, 5.6, '#d9fff6'); el(x, 6, 2.6, 6, 5, '#d9fff6'); el(x, 0, -3, 8.6, 7.6, grad(x, -11, 5, '#ffffff', '#9ff0de'));
      x.save(); x.fillStyle = '#d9fff6'; x.beginPath(); x.ellipse(0, 3, 9, 4, 0, 0, 7); x.fill(); x.lineWidth = 1.4; x.strokeStyle = '#3aa79a'; x.beginPath(); x.arc(-6.5, 2.4, 2.6, .6, 5.2); x.stroke(); x.beginPath(); x.arc(6.6, 2.8, 2.2, 4.2, 8.8); x.stroke(); x.restore();
      eyes(x, 0, -3, 3.4, 1.7); smile(x, 0, -.8, 2.2);
      for (let i = 0; i < 3; i++) { const ph = (t * .9 + i / 3) % 1; x.save(); x.globalAlpha = 1 - ph; x.lineWidth = 1.4; x.strokeStyle = '#b8fff1'; x.beginPath(); x.arc(-14 - ph * 6, -2 + i * 4, 3, -1, 1.4); x.stroke(); x.restore(); } }
    else if (id === 'starling') { const y = -28 + Math.sin(t * 3.2) * 3; shadow(x, 7); x.translate(0, y); x.save(); x.rotate(Math.sin(t * 2) * .16);
      x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, r = i % 2 ? 5.4 : 12; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fillStyle = grad(x, -12, 12, '#fff3a8', '#ffb020'); x.fill(); x.stroke();
      eyes(x, 0, -.5, 3, 1.6); smile(x, 0, 1.6, 2.2); dot(x, -5, 2.4, 1.1, 'rgba(255,120,90,.7)'); dot(x, 5, 2.4, 1.1, 'rgba(255,120,90,.7)'); x.restore();
      for (let i = 0; i < 4; i++) { const ph = (t * 1.3 + i / 4) % 1, a = i * 1.7 + 2.6; x.save(); x.globalAlpha = 1 - ph; x.translate(Math.cos(a) * (13 + ph * 8), Math.sin(a) * (13 + ph * 8)); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, -2.4); x.lineTo(.7, -.7); x.lineTo(2.4, 0); x.lineTo(.7, .7); x.lineTo(0, 2.4); x.lineTo(-.7, .7); x.lineTo(-2.4, 0); x.lineTo(-.7, -.7); x.closePath(); x.fill(); x.restore(); } }
    else if (id === 'panda') { const b = Math.abs(Math.sin(t * 3)) * 1.2, tl = Math.sin(t * 2) * .08; shadow(x, 11); x.translate(0, -b);
      el(x, -5, -1.4, 3.6, 2.6, '#16121c'); el(x, 5, -1.4, 3.6, 2.6, '#16121c'); el(x, 0, -8, 9.6, 8, grad(x, -16, 0, '#ffffff', '#e6e2ee')); el(x, -8, -8, 3.2, 5, '#16121c', .3); el(x, 8, -8, 3.2, 5, '#16121c', -.3);
      x.save(); x.translate(0, -18); x.rotate(tl); el(x, -7, -7, 3.4, 3.4, '#16121c'); el(x, 7, -7, 3.4, 3.4, '#16121c'); el(x, 0, 0, 9.4, 8.4, '#ffffff');
      el(x, -4, -.6, 2.8, 3.5, '#16121c', .45); el(x, 4, -.6, 2.8, 3.5, '#16121c', -.45); dot(x, -3.8, -.8, 1.15, '#fff'); dot(x, 3.8, -.8, 1.15, '#fff'); dot(x, -3.6, -.7, .55); dot(x, 4, -.7, .55);
      el(x, 0, 2.6, 1.5, 1.1, '#16121c'); smile(x, 0, 3.4, 1.9); x.restore();
      x.save(); x.translate(9.5, -10); x.rotate(.5 + tl); x.fillStyle = '#6fcf4a'; x.lineWidth = 1.6; x.beginPath(); x.rect(-1, -11, 2, 13); x.fill(); x.stroke(); x.beginPath(); x.ellipse(3.4, -9, 3.6, 1.5, -.5, 0, 7); x.fill(); x.stroke(); x.restore(); }
    else if (id === 'snake') { const sw = Math.sin(t * 2.4) * 2.2, hx = 5 + sw, hy = -23; shadow(x, 11);
      el(x, 0, -3, 10.5, 4.2, grad(x, -7, 1, '#7ef08a', '#2f9a4a')); el(x, .5, -7.6, 7.6, 3.6, grad(x, -11, -4, '#8cf59a', '#37a852'));
      x.save(); x.lineWidth = 8.6; x.strokeStyle = '#000'; x.beginPath(); x.moveTo(2, -9); x.bezierCurveTo(-4, -14, 9, -16, hx, hy + 2); x.stroke(); x.lineWidth = 5.4; x.strokeStyle = '#4fc466'; x.stroke(); x.lineWidth = 1.6; x.strokeStyle = '#eaffb0'; x.setLineDash([2, 3]); x.stroke(); x.restore();
      x.save(); x.lineWidth = 1.3; x.strokeStyle = '#eaffb0'; x.beginPath(); x.ellipse(0, -2.4, 6, 1.6, 0, 0, 3.14); x.stroke(); x.restore();
      if (Math.sin(t * 6) > .3) { x.save(); x.strokeStyle = '#ff4a5a'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(hx + 4, hy); x.lineTo(hx + 8.5, hy - .4); x.lineTo(hx + 10.5, hy - 2); x.moveTo(hx + 8.5, hy - .4); x.lineTo(hx + 10.5, hy + 1.4); x.stroke(); x.restore(); }
      el(x, hx, hy, 5, 3.9, grad(x, hy - 4, hy + 4, '#8cf59a', '#37a852')); dot(x, hx + 1.8, hy - .9, 1.5, '#ffe36a'); dot(x, hx + 2.1, hy - .9, .7); dot(x, hx + 4, hy + .6, .35); }
    else if (id === 'rooster') { const hb = Math.sin(t * 5) * 1.2, st = Math.sin(t * 5) * .15; shadow(x, 10);
      x.save(); x.strokeStyle = '#000'; x.lineWidth = 2.6; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 2.4, -4); x.lineTo(s * 2.6 + st * 4 * s, 0); x.stroke(); } x.strokeStyle = '#ffb020'; x.lineWidth = 1.4; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 2.4, -4); x.lineTo(s * 2.6 + st * 4 * s, 0); x.lineTo(s * 2.6 + st * 4 * s + 2.6, 0); x.stroke(); } x.restore();
      for (let i = 0; i < 3; i++) { x.save(); x.translate(-7, -11); x.rotate(-.9 + i * .38 + Math.sin(t * 3) * .05); el(x, -5.5, 0, 6.2, 2.2, ['#1f6f7a', '#2fb0a0', '#ffd75e'][i]); x.restore(); }
      el(x, 0, -9.5, 8.4, 7.2, grad(x, -17, -2, '#ffffff', '#ece6da')); el(x, -1.5, -8.6, 4.6, 3.4, '#f2e8d2', .3);
      x.save(); x.translate(6, -18 + hb); for (let i = 0; i < 3; i++) el(x, -1.8 + i * 2.2, -5.4 - (i === 1 ? 1.2 : 0), 1.9, 2.4, '#ff3b4a'); el(x, 0, 0, 5.2, 5, '#ffffff'); x.beginPath(); x.moveTo(4.2, -1.4); x.lineTo(9.6, .4); x.lineTo(4.2, 2); x.closePath(); x.fillStyle = '#ffb020'; x.fill(); x.stroke(); el(x, 3.6, 4.4, 1.5, 2.3, '#ff3b4a'); dot(x, 1.6, -1, 1.25); dot(x, 2, -1.4, .45, '#fff'); x.restore(); }
    else if (id === 'wolf' || id === 'dog') { const dg = id === 'dog', wag = Math.sin(t * (dg ? 9 : 4)) * (dg ? .5 : .22), A = dg ? '#e0a45a' : '#6a7088', Bc = dg ? '#fff1d6' : '#c9cfe0', D = dg ? '#b0763a' : '#3d4257', hb = Math.sin(t * 2.4) * .8; shadow(x, 10.5);
      x.save(); x.translate(-7.5, -5); x.rotate(-.9 + wag); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-5, -4, -3, -12); x.quadraticCurveTo(1.6, -7, 2.6, -1); x.closePath(); x.fillStyle = A; x.fill(); x.stroke(); if (!dg) { x.beginPath(); x.moveTo(-3.4, -8); x.quadraticCurveTo(-2.4, -11, -3, -12); x.quadraticCurveTo(-.4, -10, -.6, -8); x.closePath(); x.fillStyle = Bc; x.fill(); } x.restore();
      el(x, -1, -8, 8, 8.4, grad(x, -16, 0, A, D)); el(x, 1.6, -5.4, 4.2, 5.2, Bc); el(x, 3.6, -1.4, 3.2, 2, A); el(x, -4.4, -1.4, 3.2, 2, A);
      x.save(); x.translate(4.5, -19 + hb);
      if (dg) { el(x, -5.4, .6, 2.6, 5, D, .35); el(x, 4.2, .4, 2.4, 4.6, D, -.5); } else for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 2 - 1, -4.6); x.lineTo(s * 5.6 - 1, -12.6); x.lineTo(s * 6.6 - 1, -3.4); x.closePath(); x.fillStyle = A; x.fill(); x.stroke(); }
      el(x, 0, 0, 7.4, 6.6, A); el(x, 5.6, 2.2, 4.4, 3.3, Bc); el(x, 9, 1, 1.5, 1.2, '#16121c'); if (dg) { el(x, -2.6, -1.6, 3, 3, D); el(x, 5.8, 5.6, 1.6, 2.4, '#ff7a8a'); } else { x.save(); x.fillStyle = Bc; x.beginPath(); x.ellipse(-.4, 2.6, 4.4, 2.6, 0, 0, 7); x.fill(); x.restore(); }
      if (dg) eyes(x, .6, -1.4, 3, 1.5); else { for (const s of [-1, 1]) { x.save(); x.translate(.4 + s * 3, -1.6); x.rotate(s * .25); x.beginPath(); x.ellipse(0, 0, 1.9, 1.2, 0, 0, 7); x.fillStyle = '#ffe36a'; x.fill(); x.lineWidth = 1; x.stroke(); dot(x, .2, 0, .7); x.restore(); } }
      x.restore(); }
    x.restore();
  }
  window.petDraw = petDraw;
  const _dp = drawPet;
  window.drawPet = drawPet = function (x, id, t, face) { return MINE.has(id) ? petDraw(x, id, t, face) : _dp.apply(this, arguments); };
  const _dpc = drawPetCard;
  window.drawPetCard = drawPetCard = function (c, id, bg) { if (!MINE.has(id)) return _dpc.apply(this, arguments); bg = bg || ['#3a2d66', '#150f27'];
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.scale(c.width / 88, c.height / 88);
    const g = x.createRadialGradient(44, 40, 4, 44, 44, 44); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, 88, 88);
    const p = PETS.find(q => q.id === id); x.translate(44, p.fly ? 102 : 70); x.scale(2, 2); petDraw(x, id, .6, 1); };
  // a pet that belongs to the other path is not offered, and comes off if you switch paths
  const allowed = it => !it || !it.cls || it.cls === cls();

  /* ---------------- aura styles ---------------- */
  const rgb = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}`; };
  const AS = {
    // wind wrapping the body: arcs climbing in a helix, with dust riding them
    tempest(x, w, inten, l, m) { const L = rgb(l), Mc = rgb(m), t = T + (w.t || 0) * .01; x.save(); x.translate(w.x, w.y); x.lineCap = 'round';
      for (let i = 0; i < 11; i++) { const ph = (t * .9 + i / 11) % 1, y = -ph * 92 * HS, rx = (28 - ph * 9) * SC, a0 = t * 5 + i * 1.9, al = Math.sin(ph * Math.PI) * inten;
        x.strokeStyle = `rgba(5,2,12,${al * .45})`; x.lineWidth = 4.6; x.beginPath(); x.ellipse(0, y, rx, rx * .34, 0, a0, a0 + 2.3); x.stroke();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(${i % 2 ? L : Mc},${al * .95})`; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, y, rx, rx * .34, 0, a0, a0 + 2.3); x.stroke();
        x.fillStyle = `rgba(255,255,255,${al})`; x.beginPath(); x.arc(Math.cos(a0 + 2.3) * rx, y + Math.sin(a0 + 2.3) * rx * .34, 1.5, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; }
      x.restore(); },
    // a crown of light: a halo over the head, two tilted rings turning around the body, motes in orbit
    halo(x, w, inten, l, m) { const L = rgb(l), Mc = rgb(m), t = T; x.save(); x.translate(w.x, w.y - 40 * HS); x.globalCompositeOperation = 'lighter';
      const g = x.createRadialGradient(0, 0, 4, 0, 0, 52 * SC); g.addColorStop(0, `rgba(${Mc},${.22 * inten})`); g.addColorStop(1, `rgba(${Mc},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 52 * SC, 0, 7); x.fill();
      for (const [tilt, dir, col] of [[.5, 1, L], [-.5, -1, Mc]]) { x.save(); x.rotate(tilt); x.setLineDash([10, 7]); x.lineDashOffset = -t * 30 * dir; x.strokeStyle = `rgba(${col},${.85 * inten})`; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, 0, 31 * SC, 11 * SC, 0, 0, 7); x.stroke(); x.restore(); }
      x.strokeStyle = `rgba(255,255,255,${.95 * inten})`; x.lineWidth = 2.6; x.shadowColor = l; x.shadowBlur = 10; x.beginPath(); x.ellipse(0, -52 * HS + Math.sin(t * 3) * 1.5, 13 * SC, 4.2 * SC, 0, 0, 7); x.stroke(); x.shadowBlur = 0;
      for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * 1.047, px = Math.cos(a) * 34 * SC, py = Math.sin(a) * 12 * SC + Math.sin(t * 2 + i) * 14 * HS; x.fillStyle = `rgba(255,255,255,${(.5 + .5 * Math.sin(a)) * inten})`; x.beginPath(); x.arc(px, py, 2, 0, 7); x.fill(); }
      x.restore(); },
    // crystal shards circling the fighter
    shards(x, w, inten, l, m) { const t = T; x.save(); x.translate(w.x, w.y - 38 * HS);
      for (let i = 0; i < 7; i++) { const a = t * 1.5 + i * .8976, dep = Math.sin(a), px = Math.cos(a) * 30 * SC, py = dep * 9 * SC + Math.sin(t * 2.2 + i * 1.3) * 16 * HS, s = (6 + (i % 3) * 1.4) * (.8 + .25 * dep) * SC;
        x.save(); x.translate(px, py); x.rotate(a * 1.3 + i); x.globalAlpha = Math.min(1, inten * (.6 + .4 * (dep * .5 + .5)));
        x.beginPath(); x.moveTo(0, -s * 1.6); x.lineTo(s * .62, 0); x.lineTo(0, s * 1.6); x.lineTo(-s * .62, 0); x.closePath(); const g = x.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#ffffff'); g.addColorStop(.45, l); g.addColorStop(1, m); x.fillStyle = g; x.fill(); x.strokeStyle = '#07020d'; x.lineWidth = 1.4; x.stroke();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -s * 1.3); x.lineTo(0, s * 1.3); x.stroke(); x.restore(); }
      x.restore(); },
  };
  window.AURA_STYLES = AS;
  COSMETICS.aurastyle = [
    { id: 'flame', n: 'Ink Flame', r: 'common', unlock: { type: 'free' } },
    { id: 'shards', n: 'Shards', r: 'epic', unlock: { type: 'gems', v: 60 } },
    { id: 'tempest', n: 'Tempest', r: 'legendary', unlock: { type: 'ladder', who: 'Rook Sable' } },
    { id: 'halo', n: 'Halo', r: 'legendary', unlock: { type: 'ladder', who: 'Gilda Goldmantle' } },
  ];

  /* ---------------- trails ---------------- */
  COSMETICS.trail = [
    { id: 'none', n: 'No Trail', r: 'common', unlock: { type: 'free' } },
    { id: 'smoke', n: 'Smoke', r: 'rare', unlock: { type: 'gems', v: 40 } },
    { id: 'stardust', n: 'Stardust', r: 'epic', unlock: { type: 'gems', v: 60 } },
    { id: 'bloom', n: 'Bloom', r: 'legendary', unlock: { type: 'ladder', who: 'Kessa Thornwhistle' } },
    { id: 'afterimage', n: 'Afterimage', r: 'legendary', unlock: { type: 'ladder', who: 'Old Nix' } },
  ];
  COSMETICS.atk = [
    { id: 'none', n: 'Standard', r: 'common', unlock: { type: 'free' } },
    { id: 'gilded', n: 'Gilded Blood', r: 'legendary', unlock: { type: 'ladder', who: 'Jun the Quiet' }, note: 'Dissection cuts in blood red with a gold edge.' },
  ];
  if (!CATS.some(c => c[0] === 'trail')) { const i = CATS.findIndex(c => c[0] === 'pet'); CATS.splice(i + 1, 0, ['trail', 'Trail'], ['atk', 'Attacks']); const j = CATS.findIndex(c => c[0] === 'aura'); CATS.splice(j >= 0 ? j + 1 : 4, 0, ['aurastyle', 'Aura Style']); }
  PR.look.aurastyle = PR.look.aurastyle || 'flame'; PR.look.trail = PR.look.trail || 'none'; PR.look.atk = PR.look.atk || 'none';
  { const _cf = window.catsFor; window.catsFor = () => { const base = _cf ? _cf() : CATS; return cls() === 'sorc' ? base : base.filter(c => c[0] !== 'aurastyle'); }; }
  { const _ci = catItems; window.catItems = catItems = function (c) { const L = _ci.apply(this, arguments); if (c !== 'pet') return L;
      const cur = COSMETICS.pet.find(p => p.id === PR.look.pet); if (cur && !allowed(cur)) PR.look.pet = 'none'; return L.filter(allowed); }; }
  { const _ut = unlockText; window.unlockText = unlockText = function (u) { return u && u.type === 'ladder' ? 'Beat ' + u.who + ' on the Ladder' : _ut.apply(this, arguments); }; }
  window.grantCosmetic = function (cat, id) { PR.owned = PR.owned || []; const key = cat + '.' + id; if (!PR.owned.includes(key)) PR.owned.push(key); try { save(); } catch (e) {} };
  let blooms = [];
  const PETAL = ['#ff8ac0', '#ffd45e', '#c792ff', '#ffffff', '#7ef0d0', '#ff9a6b'];
  function trailStep(w, dt) { const tr = w.trail; if (!tr || tr === 'none' || w.dead) return; const mv = Math.hypot(w.x - (w._tx === undefined ? w.x : w._tx), w.y - (w._ty === undefined ? w.y : w._ty)); w._tx = w.x; w._ty = w.y; if (mv > 60) return; w._tacc = (w._tacc || 0) + mv;
    if (tr === 'bloom') { if (w._tacc > 11) { w._tacc = 0; if (blooms.length < 90) blooms.push({ x: w.x + rnd(-9, 9), y: w.y + rnd(-2, 7), t: 0, life: rnd(2.4, 3.4), c: PETAL[Math.random() * PETAL.length | 0], rot: rnd(0, 6.3), sz: rnd(3.4, 5.6) }); } }
    else if (tr === 'afterimage') { if (w._tacc > 14) { w._tacc = 0; try { window.TECHX.addFx({ k: 'after', x: w.x, y: w.y, life: .34, w }); } catch (e) {} } }
    else if (tr === 'smoke') { if (w._tacc > 7) { w._tacc = 0; P({ x: w.x + rnd(-6, 6), y: w.y + rnd(-2, 4), vx: rnd(-10, 10), vy: -rnd(10, 30), color: ['#4d4458', '#6a6078', '#2e2838'][Math.random() * 3 | 0], size: rnd(5, 9), life: rnd(.7, 1.2), glow: false, shrink: false, grow: 1.9, drag: .88, fade: .4 }); } }
    else if (tr === 'stardust') { if (w._tacc > 5) { w._tacc = 0; P({ x: w.x + rnd(-10, 10), y: w.y - rnd(0, 40) * HS, vx: rnd(-14, 14), vy: rnd(8, 40), color: ['#ffffff', '#ffe9a0', '#c8b8ff'][Math.random() * 3 | 0], size: rnd(1.6, 3.2), life: rnd(.5, 1), grav: 30 }); } } }
  function drawBlooms(x) { for (const b of blooms) { const k = b.t / b.life, gk = Math.min(1, b.t / .35), g = gk < 1 ? 1 + 2.70158 * Math.pow(gk - 1, 3) + 1.70158 * Math.pow(gk - 1, 2) : 1, a = k > .8 ? (1 - k) / .2 : 1, s = b.sz * Math.max(0, g);
      x.save(); x.translate(b.x, b.y); x.scale(1, .62); x.globalAlpha = a; x.fillStyle = '#3f9a4a'; x.beginPath(); x.ellipse(s * 1.2, s * .5, s * .9, s * .4, .5, 0, 7); x.ellipse(-s * 1.1, s * .6, s * .8, s * .36, -.5, 0, 7); x.fill();
      x.rotate(b.rot); for (let i = 0; i < 5; i++) { const an = i / 5 * 6.283; x.fillStyle = '#07020d'; x.beginPath(); x.arc(Math.cos(an) * s * .8, Math.sin(an) * s * .8, s * .62 + .8, 0, 7); x.fill(); } for (let i = 0; i < 5; i++) { const an = i / 5 * 6.283; x.fillStyle = b.c; x.beginPath(); x.arc(Math.cos(an) * s * .8, Math.sin(an) * s * .8, s * .62, 0, 7); x.fill(); }
      x.fillStyle = '#ffd45e'; x.beginPath(); x.arc(0, 0, s * .46, 0, 7); x.fill(); x.restore(); } }
  { const _dd = drawDecals; window.drawDecals = drawDecals = function (x) { _dd.apply(this, arguments); if (x === ctx && blooms.length) drawBlooms(x); }; }
  { const _su = startDuel; window.startDuel = startDuel = function () { blooms = []; const r = _su.apply(this, arguments);
      try { const me = ents[0], fo = ents[1], rv = (typeof M !== 'undefined' && M && (M.ladder || M.rival)) || {}; me.auraStyle = cls() === 'sorc' ? PR.look.aurastyle : null; me.trail = PR.look.trail; me.atkSkin = PR.look.atk !== 'none' ? PR.look.atk : null;
        fo.auraStyle = rv.auraStyle || null; fo.trail = rv.trail || null; fo.atkSkin = rv.skin || null; ents.forEach(w => { w._tx = w._ty = undefined; }); } catch (e) {} return r; }; }
  { const _up = update; window.update = update = function (dt) { const r = _up.apply(this, arguments); try { if (typeof ents !== 'undefined' && ents && !ended) for (const w of ents) trailStep(w, dt); for (const b of blooms) b.t += dt; blooms = blooms.filter(b => b.t < b.life); } catch (e) {} return r; }; }

  /* ---------------- wardrobe previews for the new tabs ---------------- */
  function preview(c, cat, it) { const x = c.getContext('2d'), W = c.width, H = c.height; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, H * .45, 4, W / 2, H / 2, W * .6); g.addColorStop(0, '#3a2d66'); g.addColorStop(1, '#150f27'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const keepT = T; try { T = performance.now() / 1000;
      if (cat === 'aurastyle') { const ac = auraOf({ me: 1 }); x.save(); x.translate(W / 2, H * .86); x.scale(W / 128 * 1.15 / SC, W / 128 * 1.15 / SC); const w = { x: 0, y: 0, t: 0, auraStyle: it.id === 'flame' ? null : it.id }; if (it.id === 'flame') { if (typeof heroAura === 'function') { x.restore(); x.save(); heroAura(x, W / 2, H * .86, W / 128 * 1.15, T); } } else AS[it.id](x, w, 1, ac[0], ac[1]); x.restore();
        x.save(); x.translate(W / 2, H * .86); x.scale(W / 128, W / 128); x.fillStyle = 'rgba(10,4,24,.82)'; x.beginPath(); x.ellipse(0, -30, 11, 26, 0, 0, 7); x.fill(); x.beginPath(); x.arc(0, -62, 9, 0, 7); x.fill(); x.restore(); }
      else if (cat === 'trail') { x.save(); x.translate(W / 2, H * .6); x.scale(W / 128, W / 128);
        if (it.id === 'none') { x.strokeStyle = '#6f6496'; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.moveTo(-17, 17); x.lineTo(17, -17); x.stroke(); }
        else if (it.id === 'bloom') { const keep = blooms; blooms = [[-36, 14, '#ff8ac0', 7], [-12, 4, '#ffd45e', 8], [12, 16, '#c792ff', 7.4], [36, 2, '#7ef0d0', 6.6]].map(([bx, by, col, sz], i) => ({ x: bx, y: by, t: 1, life: 3, c: col, rot: i, sz })); drawBlooms(x); blooms = keep; }
        else if (it.id === 'afterimage') { for (let i = 0; i < 4; i++) { x.globalAlpha = .18 + i * .22; x.fillStyle = i === 3 ? '#e8e0ff' : '#8a6cff'; x.beginPath(); x.ellipse(-36 + i * 24, -2, 9, 22, 0, 0, 7); x.fill(); x.beginPath(); x.arc(-36 + i * 24, -30, 8, 0, 7); x.fill(); } }
        else if (it.id === 'smoke') { for (let i = 0; i < 6; i++) { x.globalAlpha = .3 + i * .1; x.fillStyle = ['#4d4458', '#6a6078', '#8a8098'][i % 3]; x.beginPath(); x.arc(-40 + i * 16, 8 - i * 3 + Math.sin(i) * 4, 16 - i * 1.6, 0, 7); x.fill(); } }
        else if (it.id === 'stardust') { for (let i = 0; i < 16; i++) { const px = -44 + (i * 37 % 88), py = -30 + (i * 53 % 60), s = 2 + (i % 3) * 1.6; x.fillStyle = ['#ffffff', '#ffe9a0', '#c8b8ff'][i % 3]; x.beginPath(); x.moveTo(px, py - s * 2); x.lineTo(px + s * .5, py - s * .5); x.lineTo(px + s * 2, py); x.lineTo(px + s * .5, py + s * .5); x.lineTo(px, py + s * 2); x.lineTo(px - s * .5, py + s * .5); x.lineTo(px - s * 2, py); x.lineTo(px - s * .5, py - s * .5); x.closePath(); x.fill(); } }
        x.restore(); }
      else if (cat === 'atk') { x.save(); x.translate(W / 2, H / 2); x.scale(W / 128 * 2.6, W / 128 * 2.6); x.rotate(-.5); const gd = it.id === 'gilded', cp = (r, a0) => { x.beginPath(); x.arc(0, 0, r, -a0, a0); x.arc(-r * .42, 0, r * .92, a0 * .86, -a0 * .86, true); x.closePath(); };
        x.fillStyle = gd ? 'rgba(255,200,60,.5)' : 'rgba(255,60,80,.5)'; cp(20, 1.2); x.fill(); x.fillStyle = gd ? '#b00d24' : '#fff'; x.strokeStyle = gd ? '#ffd75e' : '#2a0006'; x.lineWidth = gd ? 2.2 : 1.6; cp(16, 1.1); x.fill(); x.stroke(); if (gd) { x.fillStyle = '#ffd75e'; cp(7, .7); x.fill(); } x.restore(); }
    } finally { T = keepT; } }
  { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'aurastyle' || wCat === 'trail' || wCat === 'atk') { const items = catItems(wCat); document.querySelectorAll('#items canvas').forEach(c => { const it = items[+c.dataset.i]; if (it) preview(c, wCat, it); }); } } catch (e) {} return r; }; }
  { const _pi = pickItem; window.pickItem = pickItem = function (i) { const r = _pi.apply(this, arguments); try { const c = $('buyCv'); if (c && (wCat === 'aurastyle' || wCat === 'trail' || wCat === 'atk')) preview(c, wCat, catItems(wCat)[i]);
        const it = catItems(wCat)[i]; if (it && it.unlock && it.unlock.type === 'ladder' && !ownsItem(wCat, it)) toast(unlockText(it.unlock)); } catch (e) {} return r; }; }
  // the home screen hero shows the chosen aura style through the drawInkAura hook (PR.look.aurastyle)
  window.COS_DEBUG = { PETS, get blooms() { return blooms; } };
})();
