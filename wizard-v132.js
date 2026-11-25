/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.12
   Blood colours: a Blood tab in the wardrobe. Your fighter's blood (drops, puddles, what Bloodcraft gathers of it, and the blood of
   your summons) takes the colour you pick. Everyone else bleeds red, so it always reads whose blood it is.
   Unlocked by player level; Crimson is the standard.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  //            drops [light, mid, dark]                pool [rim, body, shine]                          glow
  const PAL = {
    crimson:  { drops: ['#ff5a6e', '#c8102e', '#7a0a18'], pool: ['#3a0008', '#a00d22', 'rgba(255,150,160,.55)'] },
    sapphire: { drops: ['#7cc0ff', '#2468e0', '#0d2f78'], pool: ['#061a44', '#1f55c4', 'rgba(175,215,255,.6)'] },
    ichor:    { drops: ['#ffe680', '#e8a91e', '#7d5408'], pool: ['#3d2a02', '#c98d12', 'rgba(255,242,185,.65)'] },
    toxic:    { drops: ['#d4ff70', '#62ec2a', '#1f7a12'], pool: ['#0d3306', '#41c41a', 'rgba(225,255,175,.65)'], glow: '#7dff3a' },
    void:     { drops: ['#c99aff', '#3a1060', '#0c0216'], pool: ['#000000', '#1c0733', 'rgba(200,150,255,.55)'], glow: '#9a4dff' },
    spectral: { drops: ['#ffffff', '#c4f1ff', '#6fb8d8'], pool: ['#24465a', '#a6e2f4', 'rgba(255,255,255,.75)'], glow: '#bff2ff' },
  };
  const ITEMS = [
    { id: 'crimson', n: 'Crimson', r: 'common', unlock: { type: 'free' } },
    { id: 'sapphire', n: 'Sapphire', r: 'rare', unlock: { type: 'level', v: 3 } },
    { id: 'ichor', n: 'Ichor', r: 'rare', unlock: { type: 'level', v: 5 } },
    { id: 'toxic', n: 'Toxic', r: 'epic', unlock: { type: 'level', v: 8 } },
    { id: 'void', n: 'Void', r: 'epic', unlock: { type: 'level', v: 12 } },
    { id: 'spectral', n: 'Spectral', r: 'legendary', unlock: { type: 'level', v: 16 } },
  ];
  try { COSMETICS.blood = ITEMS; if (!CATS.some(c => c[0] === 'blood')) CATS.push(['blood', 'Blood']); } catch (e) {}
  { const _cf = window.catsFor; if (_cf) window.catsFor = () => { const b = _cf(); return b.some(c => c[0] === 'blood') ? b : b.concat([['blood', 'Blood']]); }; }

  // whose blood is it: your fighter, or anything you own (summons, your zombies), takes your colour
  const mine = o => { try { return !!o && typeof ents !== 'undefined' && ents && o === ents[0] && o.me && !(typeof M !== 'undefined' && M && M.practice && o.isDummy); } catch (e) { return false; } };
  window.bloodPal = function (o) { if (!o) return null; const w = mine(o) ? o : (o.o && mine(o.o) ? o.o : null); if (!w) return null; const id = PR.look && PR.look.blood; if (!id || id === 'crimson') return null; return PAL[id] || null; };
  window.BLOOD_PALETTES = PAL;

  // the wardrobe tile: a splash of the blood on a dark floor
  function swatch(c, id) { const g = c.getContext('2d'), S = c.width, p = PAL[id] || PAL.crimson; g.clearRect(0, 0, S, S);
    const bg = g.createRadialGradient(S / 2, S * .45, 4, S / 2, S / 2, S * .62); bg.addColorStop(0, '#3a2d66'); bg.addColorStop(1, '#150f27'); g.fillStyle = bg; g.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S * .6;
    if (p.glow) { const gl = g.createRadialGradient(cx, cy, 4, cx, cy, S * .48); gl.addColorStop(0, p.glow + 'aa'); gl.addColorStop(1, p.glow + '00'); g.fillStyle = gl; g.fillRect(0, 0, S, S); }
    g.save(); g.translate(cx, cy); g.scale(1, .55); g.fillStyle = p.pool[0]; g.beginPath(); g.arc(0, 0, S * .3 + 2.5, 0, 7); g.fill(); g.fillStyle = p.pool[1]; g.beginPath(); g.arc(0, 0, S * .3, 0, 7); g.fill();
    g.fillStyle = p.pool[2]; g.beginPath(); g.ellipse(-S * .1, -S * .1, S * .1, S * .055, -.5, 0, 7); g.fill(); g.restore();
    // three falling drops
    [[-.2, -.32, .055], [.06, -.42, .07], [.24, -.24, .045]].forEach(([dx, dy, r], i) => { const x = cx + dx * S, y = cy + dy * S, R = r * S;
      g.fillStyle = p.drops[i === 1 ? 1 : 0]; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y - R * 1.9); g.quadraticCurveTo(x + R * 1.1, y - R * .2, x, y + R); g.quadraticCurveTo(x - R * 1.1, y - R * .2, x, y - R * 1.9); g.closePath(); g.stroke(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - R * .3, y - R * .1, R * .25, 0, 7); g.fill(); }); }
  if (typeof renderWardrobe === 'function') { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'blood') { document.querySelectorAll('#items canvas').forEach(c => { const it = ITEMS[+c.dataset.i]; if (it) swatch(c, it.id); });
          const box = $('items'); if (box && !box.querySelector('.bl-foot')) box.insertAdjacentHTML('beforeend', '<div class="bl-foot">Your fighter and your summons bleed this colour. Everyone else bleeds red.</div>'); } } catch (e) {}
      return r; }; }
  // the wardrobe's preview canvas draws a fighter; for blood, show the swatch instead
  { const _dA = window.drawAva; if (_dA) { const isBloodPreview = c => c && (c.id === 'buyCv' || c.closest && c.closest('#items')) && typeof wCat !== 'undefined' && wCat === 'blood'; window.drawAva = function (c) { if (isBloodPreview(c)) return; return _dA.apply(this, arguments); }; try { (0, eval)('drawAva = window.drawAva'); } catch (e) {} } }
  if (PR.look && !PR.look.blood) PR.look.blood = 'crimson';
  const css = document.createElement('style'); css.textContent = '.bl-foot{grid-column:1/-1;font:700 12px Nunito,sans-serif;color:#c9bff0;text-align:center;padding:8px 10px 2px}';
  document.head.appendChild(css);
  window.V132 = { PAL, ITEMS, swatch };
})();
