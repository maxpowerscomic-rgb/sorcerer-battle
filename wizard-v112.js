/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.13
   1. Pets celebrate a win and droop at a loss (end of a round in the arena, and on the results screen).
   2. A red dot on Challenges and the Ladder when something is ready to collect or fight.
   3. Bigger Battle Hand icons on the Abilities page.
   4. Every page and sheet opens at the top.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- 1. pet moods ---------------- */
  function mood() { try { const w = window._petW;
      if (w) { if (typeof ended === 'undefined' || !ended || (typeof M !== 'undefined' && M && M.practice)) return null; const f = w.foe; if (w.dead) return 'sad'; if (f && f.dead) return 'happy'; if (!f) return null; const a = w.hp / (w.maxHp || 1), b = f.hp / (f.maxHp || 1); return a > b + .01 ? 'happy' : b > a + .01 ? 'sad' : null; }
      const rw = $('rewards'); if (rw && rw.classList.contains('on') && typeof rwWon !== 'undefined') return rwWon ? 'happy' : 'sad'; } catch (e) {} return null; }
  if (typeof drawPet === 'function') { const _dp = drawPet;
    window.drawPet = drawPet = function (x, id, t, face) { const m = mood(); if (!m) return _dp.apply(this, arguments); const T2 = performance.now() / 1000, fc = face || 1;
      x.save();
      if (m === 'happy') { const ph = T2 * 7.5, h = Math.abs(Math.sin(ph)), sq = (1 - h) * .1; x.translate(0, -h * 10); x.rotate(Math.sin(ph) * .09); x.scale(1 + sq, 1 - sq); _dp.call(this, x, id, (t || 0) * 1.7 + T2, face);
        // little stars popping around it
        x.fillStyle = '#ffe27a'; x.strokeStyle = '#000'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { const q = (T2 * 1.3 + i / 4) % 1, a = i * 1.7 + 4, r = 12 + q * 12, px = Math.cos(a) * r, py = -22 + Math.sin(a) * r * .6 - q * 6, s = 3.2 * (1 - q); if (s < .4) continue; x.globalAlpha = 1 - q * q; x.beginPath(); for (let j = 0; j < 8; j++) { const an = j / 8 * 6.283, rr = j % 2 ? s * .42 : s; x.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr); } x.closePath(); x.fill(); x.stroke(); } x.globalAlpha = 1; }
      else { x.translate(0, 1.5); x.rotate(-.07 * fc + Math.sin(T2 * 1.6) * .015); x.scale(1.05, .88); _dp.call(this, x, id, (t || 0) * .25, face);
        // a tear, and a small grey cloud
        const q = (T2 * .9) % 1; x.globalAlpha = 1 - q; x.fillStyle = '#7ec8ff'; x.strokeStyle = '#000'; x.lineWidth = 1; x.beginPath(); const tx = 6 * fc, ty = -14 + q * 12; x.moveTo(tx, ty - 3.2); x.quadraticCurveTo(tx + 2.4, ty + .6, tx, ty + 2); x.quadraticCurveTo(tx - 2.4, ty + .6, tx, ty - 3.2); x.fill(); x.stroke(); x.globalAlpha = .85;
        x.fillStyle = '#8a8fa3'; const cy = -34 + Math.sin(T2 * 1.2) * 1; for (const [ox, r] of [[-5, 4.2], [0, 5.4], [5.5, 4]]) { x.beginPath(); x.arc(ox, cy, r, 0, 7); x.fill(); } x.globalAlpha = 1; }
      x.restore(); }; }

  /* ---------------- 4. pages and sheets open at the top ---------------- */
  const toTop = el => { try { if (el) { el.scrollTop = 0; el.querySelectorAll('.mc,.txlist,.crlog,.llist').forEach(c => { c.scrollTop = 0; }); } } catch (e) {} };
  try { const sh = $('sheet'), sp = $('sheetP'); let was = sh.classList.contains('on');
    new MutationObserver(() => { const on = sh.classList.contains('on'); if (on && !was) { toTop(sp); toTop(sh); requestAnimationFrame(() => { toTop(sp); toTop(sh); }); } was = on; }).observe(sh, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
  // a different ability's page is a new page, even if the sheet never closed in between
  if (typeof openSpell === 'function') { const _os = openSpell; let last = null; window.openSpell = openSpell = function (k) { const fresh = k !== last || !$('sheet').classList.contains('on'); last = k; const r = _os.apply(this, arguments); if (fresh) { toTop($('sheetP')); toTop($('sheet')); } return r; }; }
  if (typeof show === 'function') { const _sh = show; let cur = null; window.show = show = function (s0) { const r = _sh.apply(this, arguments); try { if (s0 !== cur) { cur = s0; const el = $(s0); toTop(el); if (el) el.querySelectorAll('*').forEach(c => { if (c.scrollTop > 0) c.scrollTop = 0; }); } } catch (e) {} return r; }; }

  /* ---------------- 5. how many of its things an ability has on the field, in a blue circle on its queue icon ---------------- */
  const baseOf = k => (window.VARIANTS && VARIANTS[k] && VARIANTS[k].base) || k;
  function fieldCounts(w) { const n = {}, add = (k, c) => { if (c > 0) n[k] = (n[k] || 0) + c; }, mine = L => (L || []).filter(e => e.o === w);
    try { const zs = mine(typeof zombies !== 'undefined' ? zombies : []).filter(z => z.hp > 0); add('zombies', zs.filter(z => !z.beast).length); add('zodiac', zs.filter(z => z.beast).length);
      add('golem', mine(typeof golems !== 'undefined' ? golems : []).filter(g => g.hp > 0).length); add('archer', mine(typeof archers !== 'undefined' ? archers : []).filter(a => a.hp > 0).length);
      add('mirror', mine(typeof decoys !== 'undefined' ? decoys : []).filter(d => !d.gone).length); add('totem', mine(typeof totems !== 'undefined' ? totems : []).length); add('hourglass', mine(typeof hgs !== 'undefined' ? hgs : []).filter(h => !h.done).length);
      const ws = mine(typeof walls !== 'undefined' ? walls : []).filter(wl => wl.hp > 0); add('icewall', ws.filter(wl => !wl.mud).length); add('earthm', ws.filter(wl => wl.mud).reduce((a, wl) => a + Math.max(1, (wl.cr || []).filter(c => !c.gone).length > 5 ? 1 : 1), 0));
      if (typeof swarms !== 'undefined') add('flies', mine(swarms).filter(q => q.hp === undefined || q.hp > 0).length);
      if (window.TECH_DEBUG && TECH_DEBUG.domes) add('sanctum', TECH_DEBUG.domes.filter(d => d.o === w && d.t < d.dur).length); } catch (e) {}
    return n; }
  let tick = 0;
  if (typeof update === 'function') { const _u = update; window.update = update = function () { const r = _u.apply(this, arguments);
      try { if ((tick = (tick + 1) % 6) === 0 && typeof ents !== 'undefined' && ents && ents[0] && ents[0].book) { const w = ents[0], n = fieldCounts(w), done = {};
          document.querySelectorAll('#qM .qi').forEach((el, i) => { const k = baseOf(w.book[i]); let c = n[k] || 0; if (done[k]) c = 0; if (c) done[k] = 1;   // shown once, on the first copy of that ability
            let b = el.querySelector('.spn'); if (!c) { if (b) b.remove(); return; } if (!b) { el.insertAdjacentHTML('beforeend', '<em class="spn"></em>'); b = el.querySelector('.spn'); } if (b.textContent !== String(c)) b.textContent = c; }); } } catch (e) {}
      return r; }; }

  /* ---------------- 6. your own fire thaws your frozen units, and does them no harm ---------------- */
  const isFire = k => { try { return ELEM_OF[baseOf(k)] === 'fire' || ELEM_OF[k] === 'fire'; } catch (e) { return false; } };
  function fireNear(o, x0, y0) { try {
      if (o.bodyT > 0 && Math.hypot(o.x - x0, o.y - y0) < 74) return true;                                             // Burning Body
      if (typeof projs !== 'undefined') for (const p of projs) if (p.o === o && p.life > 0 && isFire(p.src || 'fireball') && Math.hypot(p.x - x0, p.y + 40 * HS - y0) < 30) return true;
      if (typeof firerings !== 'undefined') for (const f of firerings) if (f.o === o) { const d = Math.hypot((f.x || 0) - x0, (f.y || 0) - y0), r = f.r || 0; if (Math.abs(d - r) < 26 || d < 30) return true; }
      if (typeof meteors !== 'undefined') for (const m of meteors) if (m.o === o && m.t >= m.fall - .05 && Math.hypot(m.tx - x0, m.ty - y0) < m.r + 8) return true;
      if (typeof fireFx !== 'undefined') for (const f of fireFx) if (f.o === o && f.x !== undefined && Math.hypot(f.x - x0, f.y - y0) < (f.r || 24) + 10) return true; } catch (e) {} return false; }
  function thawFx(x0, y0) { try { text(x0, y0 - 64 * HS, 'THAWED', '#ffd9a0'); for (let i = 0; i < 12; i++) P({ x: x0 + rnd(-12, 12), y: y0 - rnd(4, 40) * HS, vx: rnd(-14, 14), vy: -rnd(30, 80), color: i % 2 ? '#ffffff' : '#bfe9ff', size: rnd(3, 6), life: rnd(.4, .8), glow: false, grow: 1.6, fade: .5, shrink: false }); sfx('hit', { x: x0, vol: .3, rate: 1.6 }); } catch (e) {} }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && ents.length && !ended) {
          for (const L of [typeof zombies !== 'undefined' ? zombies : [], typeof swarms !== 'undefined' ? swarms : []]) for (const e of L) if (e.frozen > 0 && e.o && fireNear(e.o, e.x, e.y)) { e.frozen = 0; thawFx(e.x, e.y); }
          for (const w of ents) { if (w.frzT > 0) { w.frzT -= dt; if (!w.dead && w.stunT > 0 && fireNear(w, w.x, w.y)) { w.stunT = 0; w.frzT = 0; thawFx(w.x, w.y); } } } } } catch (e) {}
      return r; }; }

  /* ---------------- 7. order screen: drag an ability onto another slot to swap them ---------------- */
  (function () { let d = null;   // { i, el, x0, y0, ghost, on }
    const tileAt = (x0, y0) => { const el = document.elementFromPoint(x0, y0), t = el && el.closest && el.closest('#ring .tile[data-i]'); return t || null; };
    document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest('#ring .tile[data-i]'); if (!t || window.ONB_ACTIVE || typeof M === 'undefined' || !M || !M.me) return; d = { i: +t.dataset.i, el: t, x0: e.clientX, y0: e.clientY, ghost: null, on: false }; }, true);
    document.addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.on) { if (Math.hypot(dx, dy) < 10) return; d.on = true; const r = d.el.getBoundingClientRect(), g = d.el.cloneNode(true); g.id = 'dragGhost'; g.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:9999;pointer-events:none;opacity:.92;transform:scale(1.12);box-shadow:0 8px 18px #000a;transition:none`; document.body.appendChild(g); d.ghost = g; d.r = r; d.el.classList.add('dragsrc'); }
      d.ghost.style.left = (d.r.left + dx) + 'px'; d.ghost.style.top = (d.r.top + dy) + 'px';
      document.querySelectorAll('#ring .tile.dragover').forEach(t => t.classList.remove('dragover')); const over = tileAt(e.clientX, e.clientY); if (over && over !== d.el) over.classList.add('dragover'); e.preventDefault(); }, { capture: true, passive: false });
    const end = e => { if (!d) return; const cur = d; d = null; if (!cur.on) return; if (cur.ghost) cur.ghost.remove(); cur.el.classList.remove('dragsrc'); document.querySelectorAll('#ring .tile.dragover').forEach(t => t.classList.remove('dragover'));
      // the tap that would follow a drag must not also select
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); document.removeEventListener('click', stop, true); }; document.addEventListener('click', stop, true); setTimeout(() => document.removeEventListener('click', stop, true), 80);
      try { const over = e.type === 'pointerup' ? tileAt(e.clientX, e.clientY) : null, j = over ? +over.dataset.i : -1, b = M.me.book; if (j >= 0 && j !== cur.i && b[j] !== undefined) { [b[cur.i], b[j]] = [b[j], b[cur.i]]; const p = (M.pz = M.pz || []); [p[cur.i], p[j]] = [p[j], p[cur.i]]; M.swapSel = j; M.moveArm = 0; try { sfx('ui_deal'); } catch (x) {} renderBook(); } } catch (x) {} };
    document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true); })();

  /* ---------------- 8. text size: Normal, Large, Extra large ---------------- */
  // Sizes in this game are fixed pixels, so the menus, sheets, tooltips and speech bubbles are scaled as a whole (text and its boxes together).
  const SIZES = [['normal', 'Normal'], ['large', 'Large'], ['xl', 'Extra large']];
  const applyText = () => { try { const v = (typeof SET === 'function' && SET().textSize) || 'normal'; document.documentElement.classList.toggle('tx-l', v === 'large'); document.documentElement.classList.toggle('tx-xl', v === 'xl'); } catch (e) {} };
  window.setTextSize = function (v) { try { SET().textSize = v; save(); } catch (e) {} applyText(); try { toast(v === 'xl' ? 'Text: extra large' : v === 'large' ? 'Text: large' : 'Text: normal'); } catch (e) {} };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML; window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), v = (SET().textSize) || 'normal';
      const row = `<div class="opt"><span>Text size</span><select class="bgmsel" onchange="setTextSize(this.value)">${SIZES.map(([id, n]) => `<option value="${id}" ${v === id ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
      return h.includes('<div class="opt"><span>My fighter talks</span>') ? h.replace('<div class="opt"><span>My fighter talks</span>', row + '<div class="opt"><span>My fighter talks</span>') : h.replace(/<\/div>$/, row + '</div>'); }; }
  applyText();

  /* ---------------- 2 and 3: red dots, bigger hand icons ---------------- */
  const css = document.createElement('style');
  css.textContent = `#chBtn,#ldBtn{overflow:visible}#chBtn:has(#chDot.ready)::after,#ldBtn.ready::after,#stkBtn.newcos::after{content:"";position:absolute;top:-5px;right:-5px;width:12px;height:12px;border-radius:50%;background:#ff3b4a;border:2px solid #000;box-shadow:0 0 6px #ff3b4a;animation:ndot 1.1s ease-in-out infinite}
  @keyframes ndot{50%{transform:scale(1.25)}}
  .qi .spn{position:absolute;top:-7px!important;right:-7px;left:auto;bottom:auto;width:16px!important;height:16px!important;box-sizing:border-box;border-radius:50%;background:#2f8dff;color:#fff;border:1.500px solid #000;font:10px/13px 'Lilita One';font-style:normal;text-align:center;z-index:3;box-shadow:0 0 6px #2f8dffaa;pointer-events:none}
  #ring .tile[data-i]{touch-action:none;-webkit-user-select:none;user-select:none}#ring .tile.dragsrc{opacity:.35}#ring .tile.dragover{box-shadow:0 0 0 3px #ffd45e,0 0 14px #ffd45e!important;transform:scale(1.06)}
  .tx-l .screen>.mc,.tx-l #sheetP,.tx-l #detail,.tx-l #rwTip,.tx-l #dtip,.tx-l #sytip,.tx-l .onb .bub,.tx-l .rwwrap,.tx-l #toast{zoom:1.14}.tx-xl .screen>.mc,.tx-xl #sheetP,.tx-xl #detail,.tx-xl #rwTip,.tx-xl #dtip,.tx-xl #sytip,.tx-xl .onb .bub,.tx-xl .rwwrap,.tx-xl #toast{zoom:1.28}
  .tx-xl #handBar .hsl{width:54px;height:54px}.tx-xl #handBar .hsl img{width:48px;height:48px}.tx-xl #handBar .hs{gap:6px}.tx-l #handBar .hsl{width:60px;height:60px}.tx-l #handBar .hsl img{width:52px;height:52px}
  #handBar{flex-wrap:wrap}#handBar .hl{flex:1 1 100%}#handBar .hs{width:100%;justify-content:center;gap:10px;margin-top:8px}#handBar .hsl{width:66px;height:66px;border-radius:16px}#handBar .hsl img{width:58px;height:58px}`;
  document.head.appendChild(css);
})();
