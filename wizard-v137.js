/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.17
   1. Abilities screen: each ability in the Battle Hand shows its level under it, like the home loadout.
   2. Hoot's panel ends with music controls: music and sound volume, the next song, and the full music menu.
   3. Spell Cannon against Spell Cannon: the clash point refracts, not the casters. Each beam throws 4 wild lasers from it (8 in all).
   4. Spell Cannon colours: Gold, Jade, Violet and Aurora (earned like every attack's colourways, on its ability page),
      plus Starfire, a white-gold beam from the Season Pass.
   5. Season Pass premium cosmetics: Starforged robe/gi (1), Comet trail (3), Starfire cannon (5), Starfall aura style (7), Void Crown (9).
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- 1. levels under the Battle Hand ---------------- */
  const tierCol = l => l >= 15 ? '#ff8a8a' : l >= 10 ? '#7fb0ff' : l >= 5 ? '#6ee58a' : '#4b6bff';
  function handLevels() { document.querySelectorAll('#handBar .hs .hsl[onclick]').forEach(el => { if (el.querySelector('.hb-lv')) return; const m = /openSpell\('([^']+)'\)/.exec(el.getAttribute('onclick') || ''); if (!m) return;
      const l = (PR.spells[m[1]] && PR.spells[m[1]].lvl) || 1; el.insertAdjacentHTML('beforeend', `<span class="hb-lv" style="border-color:${tierCol(l)}">Lv ${l}</span>`); }); }
  if (typeof renderSpells === 'function') { const _rs = renderSpells; window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments); try { handLevels(); } catch (e) {} return r; }; }
  setInterval(() => { try { if ($('spells') && $('spells').classList.contains('on')) handLevels(); } catch (e) {} }, 600);

  /* ---------------- 2. music in Hoot's panel ---------------- */
  if (window.openHootGoals) { const _og = openHootGoals; window.openHootGoals = function () { const r = _og.apply(this, arguments);
      try { const P = $('sheetP'); if (P && !P.querySelector('.hm-mus')) { const o = SET(), name = (() => { try { const id = AU && AU.cur; const t = (window.MUSIC_TRACKS || []).find(q => q[0] === id); return t ? t[1] : ''; } catch (e) { return ''; } })();
          P.insertAdjacentHTML('beforeend', `<div class="hm-mus"><div class="hm-h">Music${name ? ` <small>Now playing: ${name}</small>` : ''}</div>
            <div class="opt"><span>Music</span><input type="range" min="0" max="100" value="${o.music}" oninput="setOpt('music',+this.value)"></div>
            <div class="opt"><span>Sound effects</span><input type="range" min="0" max="100" value="${o.sfx}" oninput="setOpt('sfx',+this.value)"></div>
            <div class="hm-row"><button class="hbtn out" onclick="hootNextSong()">⏭ Next song</button>${typeof openMusic === 'function' ? '<button class="hbtn out" onclick="closeSheet();setTimeout(openMusic,220)">♫ All music</button>' : ''}</div></div>`); } } catch (e) {}
      return r; }; }
  window.hootNextSong = function () { try { if (typeof setBgm === 'function') setBgm('menu', 'shuffle'); sfx('ui_click'); } catch (e) {} setTimeout(() => { try { if (document.querySelector('#sheet.on .hm-mus')) openHootGoals(); } catch (e) {} }, 400); };

  /* ---------------- 4. Spell Cannon colours ---------------- */
  const CW = window.COLOURWAYS; if (CW && !CW.beam) CW.beam = [190, [48, 140, 275, 'cycle']];
  const mine = c => !!(c && c.o && c.o.me && typeof ents !== 'undefined' && ents && c.o === ents[0]);
  function beamHex(c) { if (!mine(c)) return c && c.o && !c.o.me ? '#ff7a86' : '#4fe3ff';
    if (PR.look && PR.look.beamSkin === 'starfire' && (PR.owned || []).includes('beam.starfire')) return '#ffe28a';
    const i = PR.cway && PR.cway.beam; if (!i || !CW || !CW.beam) return '#4fe3ff'; const h = CW.beam[1][i - 1]; return hslHex(h === 'cycle' ? (T * 140) % 360 : h, .95, .62); }
  // hex, not hsl(): the cannon's drawing adds a hex alpha to this colour
  function hslHex(h, s2, l) { const a = s2 * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12, c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); }
  window.beamCol = beamHex;
  window.beamRGBA = function (c, a) { const n = parseInt(beamHex(c).slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // Starfire: a season skin row on the Spell Cannon's ability page
  window.starfirePick = function () { const own = (PR.owned || []).includes('beam.starfire'); if (!own) return toast('Starfire: Season Pass premium, tier 5'); PR.look.beamSkin = PR.look.beamSkin === 'starfire' ? '' : 'starfire'; try { save(); sfx('ui_click'); } catch (e) {} const el = document.querySelector('#sheetP .sf-row'); if (el) el.outerHTML = sfRow(); };
  const sfRow = () => { const own = (PR.owned || []).includes('beam.starfire'), on = PR.look && PR.look.beamSkin === 'starfire'; return `<div class="cw-row sf-row"><b>Season skin</b><div class="cw-sw"><button class="${on ? 'on' : ''}${own ? '' : ' lk'}" onclick="starfirePick()" style="--c:radial-gradient(circle at 35% 30%,#fff,#ffe28a 40%,#ff9a1a 75%,#000 130%)"><i></i><small>Starfire</small></button></div><p>${own ? (on ? 'Starfire is on: it shows over your colour.' : 'Tap to use Starfire.') : 'Season Pass premium reward (tier 5).'}</p></div>`; };
  if (typeof openSpell === 'function') { const _os = openSpell; window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments); try { if (k === 'beam') { const P = $('sheetP'), cw = P && P.querySelector('.cw-row'); if (P && !P.querySelector('.sf-row')) { if (cw) cw.insertAdjacentHTML('afterend', sfRow()); else { const at = P.querySelector('.trials') || P.lastElementChild; if (at) at.insertAdjacentHTML('beforebegin', sfRow()); } } } } catch (e) {} return r; }; }

  /* ---------------- 3. clashing beams refract at the clash ---------------- */
  let clash = [];   // { c, a, va, life }
  function clashTick(dt) { if (typeof cannons === 'undefined') return;
    for (const c of cannons) { const on = c.cpT !== undefined && T - c.cpT < .08 && c.cp && c.t < c.dur; const mineR = clash.filter(r => r.c === c);
      if (on && mineR.length < 4) for (let i = mineR.length; i < 4; i++) clash.push({ c, a: Math.random() * 6.283, va: (Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 5), seed: Math.random() * 9 });
      for (const r of clash.filter(q => q.c === c)) { r.on = on; if (on) { r.va += (Math.random() - .5) * 40 * dt; r.va = Math.max(-9, Math.min(9, r.va)); r.a += r.va * dt; } } }
    clash = clash.filter(r => r.on && cannons.includes(r.c)); }
  function drawClash(x) { if (!clash.length) return; x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (const r of clash) { const p = r.c.cp; if (!p) continue; const cx = p.x, cy = p.y - 40 * HS, L = 560, n = 8, pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, jx = i && i < n ? (Math.random() - .5) * 16 : 0, jy = i && i < n ? (Math.random() - .5) * 12 : 0; pts.push([cx + Math.cos(r.a) * L * u + jx, cy + Math.sin(r.a) * L * .8 * u + jy]); }
      for (const [lw, col] of [[10, beamRGBA(r.c, .4)], [3, 'rgba(255,255,255,.95)']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.stroke(); }
      if (Math.random() < .3) try { P({ x: pts[n][0] * .5 + cx * .5, y: pts[n][1] * .5 + cy * .5, vx: (Math.random() - .5) * 160, vy: (Math.random() - .5) * 160, color: Math.random() < .5 ? '#ffffff' : beamHex(r.c), size: 2.4, life: .3 }); } catch (e) {} }
    x.restore(); }

  /* ---------------- 5. premium cosmetics ---------------- */
  try {
    if (!COSMETICS.robe.some(q => q.id === 'starforged')) COSMETICS.robe.push({ id: 'starforged', n: 'Starforged', r: 'legendary', c: ['#9fb4ff', '#1c2c86', '#070c2e'], trim: '#ffd45e', unlock: { type: 'pass', v: 1 } });
    if (COSMETICS.trail && !COSMETICS.trail.some(q => q.id === 'comet')) COSMETICS.trail.push({ id: 'comet', n: 'Comet', r: 'legendary', unlock: { type: 'pass', v: 3 } });
    if (COSMETICS.aurastyle && !COSMETICS.aurastyle.some(q => q.id === 'starfall')) COSMETICS.aurastyle.push({ id: 'starfall', n: 'Starfall', r: 'legendary', unlock: { type: 'pass', v: 7 } });
    if (!COSMETICS.hat.some(q => q.id === 'voidcrown')) COSMETICS.hat.push({ id: 'voidcrown', n: 'Void Crown', r: 'legendary', unlock: { type: 'pass', v: 9 } });
  } catch (e) {}
  // Comet trail: a streak of blue-white light and gold sparks behind you as you move
  function cometTick() { if (typeof ents === 'undefined' || !ents) return; for (const w of ents) { if (!w || w.dead || !w.look || w.look.trail !== 'comet' || !isFinite(w.x)) continue;
      const d = w._cmx === undefined ? 0 : Math.hypot(w.x - w._cmx, w.y - w._cmy); w._cmx = w.x; w._cmy = w.y; w._cma = (w._cma || 0) + d; if (w._cma < 4) continue; w._cma = 0;
      try { P({ x: w.x + (Math.random() - .5) * 8, y: w.y - Math.random() * 30 * HS, vx: (Math.random() - .5) * 10, vy: (Math.random() - .5) * 10, color: Math.random() < .5 ? '#bfe9ff' : '#ffffff', size: 3 + Math.random() * 3, life: .7, drag: .9, glow: true, shrink: true });
        if (Math.random() < .5) P({ x: w.x + (Math.random() - .5) * 14, y: w.y - Math.random() * 40 * HS, vx: (Math.random() - .5) * 40, vy: 20 + Math.random() * 30, color: '#ffd45e', size: 1.6 + Math.random(), life: .6, grav: 60 }); } catch (e) {} } }
  // Starfall aura style (sorcerers): a ring of small stars drifting down around you
  if (window.AURA_STYLES && !AURA_STYLES.starfall) AURA_STYLES.starfall = function (x, w, inten, l, m) { x.save(); x.translate(w.x, w.y); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const ph = (T * .45 + i / 14) % 1, a = i * 2.39 + T * .6, rx = Math.cos(a) * 30 * SC, ry = Math.sin(a) * 9 * SC - (1 - ph) * 90 * HS, s = (2.6 + (i % 3)) * (1 - ph * .5);
      x.globalAlpha = Math.min(1, ph * 3) * (1 - ph) * 1.6 * inten; x.fillStyle = i % 3 ? l : '#ffffff'; x.beginPath(); x.moveTo(rx, ry - s * 1.8); x.lineTo(rx + s * .5, ry - s * .5); x.lineTo(rx + s * 1.8, ry); x.lineTo(rx + s * .5, ry + s * .5); x.lineTo(rx, ry + s * 1.8); x.lineTo(rx - s * .5, ry + s * .5); x.lineTo(rx - s * 1.8, ry); x.lineTo(rx - s * .5, ry - s * .5); x.closePath(); x.fill(); }
    x.globalAlpha = .35 * inten; x.strokeStyle = m; x.lineWidth = 2; x.beginPath(); x.ellipse(0, 0, 30 * SC, 9.3 * SC, 0, 0, 7); x.stroke(); x.restore(); };
  // wardrobe tiles for the trail and aura style
  if (typeof renderWardrobe === 'function') { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'trail' || wCat === 'aurastyle') document.querySelectorAll('#items canvas').forEach(c => { const it = catItems(wCat)[+c.dataset.i]; if (!it || (it.id !== 'comet' && it.id !== 'starfall')) return; const g = c.getContext('2d'), S = c.width;
          g.setTransform(1, 0, 0, 1, 0, 0); const bg = g.createRadialGradient(S / 2, S * .45, 4, S / 2, S / 2, S * .62); bg.addColorStop(0, '#2a2a6a'); bg.addColorStop(1, '#0c0a24'); g.fillStyle = bg; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'lighter';
          if (it.id === 'comet') { for (let i = 0; i < 14; i++) { const u = i / 14, px = S * .18 + u * S * .62, py = S * .72 - u * S * .44; g.globalAlpha = .2 + u * .8; g.fillStyle = i % 4 ? '#bfe9ff' : '#ffd45e'; g.beginPath(); g.arc(px, py, 3 + u * 9, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(S * .8, S * .28, 9, 0, 7); g.fill(); }
          else { for (let i = 0; i < 10; i++) { const a = i * .63, px = S / 2 + Math.cos(a) * S * .3, py = S * .2 + (i * 37 % 60) / 60 * S * .6, s = 5 + (i % 3) * 2; g.fillStyle = i % 3 ? '#c8d8ff' : '#fff'; g.beginPath(); g.moveTo(px, py - s * 1.8); g.lineTo(px + s * .5, py - s * .5); g.lineTo(px + s * 1.8, py); g.lineTo(px + s * .5, py + s * .5); g.lineTo(px, py + s * 1.8); g.lineTo(px - s * .5, py + s * .5); g.lineTo(px - s * 1.8, py); g.lineTo(px - s * .5, py - s * .5); g.closePath(); g.fill(); } }
          g.globalCompositeOperation = 'source-over'; }); } catch (e) {}
      return r; }; }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { clashTick(dt); } catch (e) {} try { cometTick(); } catch (e) {} return r; }; }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { if (clash.length && typeof ctx !== 'undefined') { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); drawClash(x); x.restore(); } } catch (e) {} return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { clash = []; return _sd.apply(this, arguments); }; }

  const css = document.createElement('style');
  css.textContent = `#handBar .hsl{position:relative}.hb-lv{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);font:10px/14px 'Lilita One';background:#000;border:2px solid #4b6bff;border-radius:7px;padding:0 5px;white-space:nowrap;color:#fff;pointer-events:none}#handBar .hs{padding-bottom:6px}
  .hm-mus{margin-top:12px;padding-top:10px;border-top:1px solid #ffffff22}.hm-h{font:16px 'Lilita One';color:#fff;margin-bottom:4px}.hm-h small{font:800 11px Nunito;color:#b9a9e6;margin-left:6px}.hm-mus .opt{display:flex;align-items:center;justify-content:space-between;gap:10px;font:800 13px Nunito;color:#e8e0ff;padding:5px 0}.hm-mus input[type=range]{flex:1;max-width:60%}.hm-row{display:flex;gap:8px;margin-top:6px}.hm-row .hbtn{flex:1}`;
  document.head.appendChild(css);
  window.V137 = { get clash() { return clash; }, beamHex };
})();
