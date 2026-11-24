/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.11
   1. Your name, not "You", on the battle bar.
   2. Results screen: tapping an ability shows a small tooltip (points earned, what an Echo Rune would
      add, what the next level changes) instead of opening its whole page.
   3. Stance by swipe: in Auto movement, swipe up on the arena to close in one zone, swipe down to move
      out one zone. A zone takes 1.3 seconds; two arrows at the side show the cooldown and where you are.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- 1. name ---------------- */
  const setName = () => { try { const n = $('nmMe'); if (n) n.textContent = PR.name || 'You'; } catch (e) {} };

  /* ---------------- 2. reward card tooltip ---------------- */
  function tipFor(k) { const sp = PR.spells[k], got = (window.rwGot || {})[k] || 0, used = M && (M.mtSet || []).includes(k), max = sp.lvl >= MAXL, need = CARDS[sp.lvl] || 1, st = STATS[k] || {};
    const lbl = (typeof STAT_LBL_SPELL !== 'undefined' && STAT_LBL_SPELL[k]) || {}, gen = typeof STAT_LBL !== 'undefined' ? STAT_LBL : {};
    const rows = max ? '' : Object.keys(st).filter(s0 => st[s0][sp.lvl] !== undefined && st[s0][sp.lvl] !== st[s0][sp.lvl - 1]).map(s0 => `<span><small>${lbl[s0] || gen[s0] || s0}</small><b>${st[s0][sp.lvl - 1]} ➜ ${st[s0][sp.lvl]}</b></span>`).join('');
    const rune = used ? 'Echo Rune used: these points were doubled.' : PR.mTok > 0 && got ? `Echo Rune (×2): +${got} more, to ${max ? 'the bank' : Math.min(sp.cards + got, 9999) + ' / ' + need}.` : '';
    const ready = !max && sp.cards >= need;
    return `<b>${esc(SP[k].n)} · Lv ${sp.lvl}</b><p>+${got} skill points this match${max ? '' : ` · ${sp.cards} / ${need}`}</p>${rune ? `<p class="ru">${rune}</p>` : ''}${rows ? `<div class="rwtl">Level ${sp.lvl + 1} gives</div><div class="ostats">${rows}</div>` : max ? '<p>Max level.</p>' : ''}${ready ? `<button class="hbtn" onclick="rwUpgrade('${k}')" ${PR.coins < COST[sp.lvl] ? 'disabled' : ''}>Upgrade now <span class="ci coin-i" style="display:inline-block;width:16px;height:16px;vertical-align:-3px"></span> ${COST[sp.lvl]}</button>${PR.coins < COST[sp.lvl] ? '<p class="ru">Not enough gold yet.</p>' : ''}` : ''}`; }
  // (1.0.15.1) Upgrade now does the upgrade on the spot: no ability page in between
  window.rwUpgrade = function (k) { const sp = PR.spells[k]; if (!sp || typeof canUp !== 'function' || !canUp(k)) { try { toast(sp && sp.cards >= (CARDS[sp.lvl] || 1) ? 'Not enough gold' : 'Not ready to upgrade'); } catch (e) {} return; }
    const cost = COST[sp.lvl], need = CARDS[sp.lvl]; PR.coins -= cost; sp.cards -= need; sp.lvl++; rwTipClose();
    try { sfx('ui_upgrade'); if (typeof flashScreen === 'function') flashScreen(); if (window.chaChing) chaChing(); } catch (e) {}
    let lv = 0; try { lv = gainXp(25); } catch (e) {} try { save(); refreshMeta(); if ($('rewards').classList.contains('on')) renderRwCards(); } catch (e) {}
    try { queueModal(() => showSpellModal(k, sp.lvl - 1, sp.lvl)); if (lv) { delete PR._lvPending; queueModal(showLevelUp); } } catch (e) {} };
  window.rwTipClose = () => { const t = $('rwTip'); if (t) t.classList.remove('on'); };
  function showTip(card, k) { let t = $('rwTip'); if (!t) { document.querySelector('.phone').insertAdjacentHTML('beforeend', '<div id="rwTip"></div>'); t = $('rwTip'); }
    t.innerHTML = tipFor(k); t.classList.add('on'); const p = document.querySelector('.phone').getBoundingClientRect(), r = card.getBoundingClientRect(), w = Math.min(280, p.width - 20); t.style.width = w + 'px';
    t.style.left = Math.max(10, Math.min(p.width - w - 10, r.left - p.left + r.width / 2 - w / 2)) + 'px'; const h = t.offsetHeight, top = r.top - p.top - h - 8; t.style.top = (top > 8 ? top : r.bottom - p.top + 8) + 'px'; }
  document.addEventListener('click', e => { const t = $('rwTip'); const card = e.target.closest && e.target.closest('#rwCards .rcard:not(.road)');
    if (!card) { if (t && t.classList.contains('on') && !(e.target.closest && e.target.closest('#rwTip'))) t.classList.remove('on'); return; }
    if (e.target.closest('button')) return;   // the ×2 button keeps working
    const img = card.querySelector('img'), k = img && Object.keys(window.rwGot || {}).find(q => ICON[q] === img.getAttribute('src')); if (!k) return;
    e.stopPropagation(); e.preventDefault(); showTip(card, k); }, true);

  /* ---------------- 3. stance by swipe ---------------- */
  const Z = ['push', 'default', 'away'], ZN = ['Close', 'Mid', 'Far'], CD = 1.3;
  const active = () => typeof M !== 'undefined' && M && !M.practice && M.steer !== 'steer' && typeof running !== 'undefined' && running && !ended && !paused;
  const ARW = up => `<svg viewBox="0 0 24 24"><path d="${up ? 'M12 4l7 8h-4.500v8h-5v-8H5z' : 'M12 20l7-8h-4.500V4h-5v8H5z'}" fill="currentColor" stroke="#000" stroke-width="1.600" stroke-linejoin="round"/></svg>`;
  function hud() { let h = $('stHud'); const b = $('battle'); if (!h && b) { b.insertAdjacentHTML('beforeend', `<div id="stHud"><div class="sta" id="stUp">${ARW(1)}</div><div class="stz" id="stZ"><i></i><i></i><i></i></div><div class="sta" id="stDn">${ARW(0)}</div></div>`); h = $('stHud'); } return h; }
  function paint() { const h = hud(); if (!h || typeof M === 'undefined' || !M) return; const show = !M.practice && M.steer !== 'steer'; h.style.display = show ? '' : 'none'; if (!show) return; const z = M.zone === undefined ? 1 : M.zone, cd = Math.max(0, M.zoneCd || 0), p = 1 - cd / CD;
    $('stUp').classList.toggle('off', z === 0); $('stDn').classList.toggle('off', z === 2); for (const id of ['stUp', 'stDn']) { $(id).style.setProperty('--p', p.toFixed(3)); $(id).classList.toggle('cd', cd > 0); }
    [...$('stZ').children].forEach((el, i) => el.classList.toggle('on', i === z)); }
  window.stanceStep = function (dir) { if (!active()) return false; const z = M.zone === undefined ? 1 : M.zone, nz = Math.max(0, Math.min(2, z + dir)); if (nz === z || (M.zoneCd || 0) > 0) { try { const el = $(dir < 0 ? 'stUp' : 'stDn'); el.classList.remove('no'); void el.offsetWidth; el.classList.add('no'); } catch (e) {} return false; }
    M.zone = nz; M.zoneCd = CD; try { sfx('ui_pick'); const me = ents[0]; text(me.x, me.y - 96 * HS, dir < 0 ? 'CLOSE IN' : 'FALL BACK', '#ffd45e'); } catch (e) {} paint(); return true; };
  if (typeof startDuel === 'function') { const _s = startDuel; window.startDuel = startDuel = function () { const r = _s.apply(this, arguments); try { setName(); if (M) { M.zone = Math.max(0, Z.indexOf(PR.behavior || 'default')); if (M.zone < 0) M.zone = 1; M.zoneCd = 0; } paint(); } catch (e) {} return r; }; }
  if (typeof update === 'function') { const _u = update;
    window.update = update = function (dt) { const on = typeof M !== 'undefined' && M && !M.practice && M.steer !== 'steer' && M.zone !== undefined && !(window.YARD && YARD.on); if (!on) return _u.apply(this, arguments);
      const keep = PR.behavior; PR.behavior = Z[M.zone]; try { return _u.apply(this, arguments); } finally { PR.behavior = keep; if (M.zoneCd > 0) M.zoneCd -= dt;
        // hold the range: an extra push toward the zone's distance, so a rival that backs off or presses in does not decide it for you
        try { const me = ents[0], fo = me && me.foe; if (me && fo && !ended && !me.dead && !fo.dead && !(me.stunT > 0) && !(me.rootT > 0) && !(me.pitT > 0) && !(me.grabT > 0) && !me.shell && !me.rush && !me.bo && !me.drag && !me.pull && !(me.beamT > 0)) {
            const dx = fo.x - me.x, dy = fo.y - me.y, d = Math.hypot(dx, dy) || 1, err = d - window.STANCE.D[M.zone]; if (Math.abs(err) > 10) { const st = Math.sign(err) * Math.min(Math.abs(err), 60 * dt), q = window.TECHX && TECHX.inArena ? TECHX.inArena(me.x + dx / d * st, me.y + dy / d * st) : { x: me.x + dx / d * st, y: me.y + dy / d * st };
              const blocked = typeof walls !== 'undefined' && typeof wallD === 'function' && walls.some(wl => wl.hp > 0 && wallD(wl, q.x, q.y) < 14); if (!blocked) { me.x = q.x; me.y = q.y; } } } } catch (e) {}
        paint(); } }; }
  // a swipe is a short, quick, mostly vertical stroke on the arena
  try { const cv = $('cv'); let s0 = null;
    cv.addEventListener('pointerdown', e => { if (active()) s0 = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    const end = e => { if (!s0) return; const dx = e.clientX - s0.x, dy = e.clientY - s0.y, ms = performance.now() - s0.t; s0 = null; if (ms > 600 || Math.abs(dy) < 34 || Math.abs(dy) < Math.abs(dx) * 1.2) return; stanceStep(dy < 0 ? -1 : 1); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', () => { s0 = null; }); } catch (e) {}
  document.addEventListener('keydown', e => { if (e.key === 'ArrowUp') stanceStep(-1); else if (e.key === 'ArrowDown') stanceStep(1); });
  /* the training yard takes the same swipes: up to close in a zone, down to fall back */
  function yardHud() { const st = document.querySelector('#home .stage'); if (!st) return null; let h = $('yStHud'); if (!h) { st.insertAdjacentHTML('beforeend', `<div id="yStHud"><div class="sta" id="yStUp">${ARW(1)}</div><div class="stz" id="yStZ"><i></i><i></i><i></i></div><div class="sta" id="yStDn">${ARW(0)}</div></div>`); h = $('yStHud'); } return h; }
  window.yardStancePaint = function () { const Y = window.YARD, h = yardHud(); if (!h || !Y) return; const z = Y.zone === undefined ? -1 : Y.zone, cd = Math.max(0, Y.zoneCd || 0), p = 1 - cd / CD;
    $('yStUp').classList.toggle('off', z === 0); $('yStDn').classList.toggle('off', z === 2); for (const id of ['yStUp', 'yStDn']) { $(id).style.setProperty('--p', p.toFixed(3)); $(id).classList.toggle('cd', cd > 0); } [...$('yStZ').children].forEach((el, i) => el.classList.toggle('on', i === z)); };
  function yardStance(dir) { const Y = window.YARD; if (!Y || !Y.on) return; let z = Y.zone; if (z === undefined) { try { z = Math.max(0, Z.indexOf((typeof recDistance === 'function' && recDistance() && recDistance().id) || 'default')); } catch (e) { z = 1; } if (z < 0) z = 1; }
    const nz = Math.max(0, Math.min(2, z + dir)); if (nz === z && Y.zone !== undefined) return; if ((Y.zoneCd || 0) > 0) return; Y.zone = nz; Y.zoneCd = CD; try { sfx('ui_pick'); const me = ents[0]; text(me.x, me.y - 96 * HS, dir < 0 ? 'CLOSE IN' : 'FALL BACK', '#ffd45e'); } catch (e) {} yardStancePaint(); }
  { let y0 = null; document.addEventListener('pointerdown', e => { if (e.target && e.target.id === 'yardCv') y0 = { x: e.clientX, y: e.clientY, t: performance.now() }; else y0 = null; }, true);
    document.addEventListener('pointerup', e => { if (!y0) return; const dx = e.clientX - y0.x, dy = e.clientY - y0.y, ms = performance.now() - y0.t; y0 = null; if (ms > 600 || Math.abs(dy) < 34 || Math.abs(dy) < Math.abs(dx) * 1.2) return; yardStance(dy < 0 ? -1 : 1); }, true); }

  /* ---------------- 4. ability tiles show their level, and change colour at levels 5, 10 and 15 ---------------- */
  const tier = l => l >= 15 ? 't15' : l >= 10 ? 't10' : l >= 5 ? 't5' : '';
  const lvOf = k => { try { const w = typeof ents !== 'undefined' && ents && ents[0]; return (w && w.lv && w.lv[k]) || (PR.spells[k] && PR.spells[k].lvl) || 1; } catch (e) { return 1; } };
  function tagQueue() { try { const w = ents[0]; document.querySelectorAll('#qM .qi').forEach((el, i) => { const k = w.book[i]; if (!k || el.querySelector('.lvb')) return; const l = lvOf(k), t = tier(l); if (t) el.classList.add(t); el.insertAdjacentHTML('beforeend', `<em class="lvb">${l}</em>`); }); } catch (e) {} }
  if (typeof startDuel === 'function') { const _s2 = startDuel; window.startDuel = startDuel = function () { const r = _s2.apply(this, arguments); tagQueue(); return r; }; }
  if (typeof renderBook === 'function') { const _rb = renderBook; window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments);
      try { const b = M.me.book; document.querySelectorAll('#ring .tile[data-i]').forEach(el => { const k = b[+el.dataset.i]; if (!k || el.querySelector('.lvb')) return; const l = (PR.spells[k] && PR.spells[k].lvl) || 1, t = tier(l); if (t) el.classList.add(t); el.insertAdjacentHTML('beforeend', `<em class="lvb">Lv ${l}</em>`); }); } catch (e) {}
      return r; }; }

  /* ---------------- 5. a cha-ching on every purchase ---------------- */
  function chaChing() { try { if (typeof AU === 'undefined' || !AU.ctx) return; const c = AU.ctx, out = (AU.g && (AU.g.sfx || AU.g.master)) || c.destination, t0 = c.currentTime;
      // "cha": a short rattle of coins; "ching": two bright bell partials ringing out
      const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * .09, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); n.buffer = buf; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200; const gn = c.createGain(); gn.gain.value = .22; n.connect(hp).connect(gn).connect(out); n.start(t0);
      [[2093, .1, .55, .17], [3136, .1, .7, .12], [4186, .16, .5, .07]].forEach(([f, dl, len, vol]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t0 + dl); g.gain.linearRampToValueAtTime(vol, t0 + dl + .008); g.gain.exponentialRampToValueAtTime(.0006, t0 + dl + len); o.connect(g).connect(out); o.start(t0 + dl); o.stop(t0 + dl + len + .05); }); } catch (e) {} }
  window.chaChing = chaChing;
  const spendOf = () => (PR.coins || 0) + (PR.gems || 0) * 1000;
  for (const name of ['buyDeal', 'buyCoins', 'buyChest', 'buyItem', 'refreshDeals', 'tradeToken', 'tryBuy', 'rematch', 'buyMastery', 'buyCoinItem', 'buyPack', 'swapChallenge', 'upgrade']) { try { const f = window[name]; if (typeof f !== 'function') continue;
      window[name] = function () { const before = spendOf(), tok = (PR.tokens || 0) + (PR.tokS || 0); const r = f.apply(this, arguments); try { if (spendOf() < before || (name === 'tradeToken' && (PR.tokens || 0) + (PR.tokS || 0) < tok)) chaChing(); } catch (e) {} return r; };
      try { eval(name + ' = window.' + name); } catch (e) {} } catch (e) {} }

  const css = document.createElement('style');
  css.textContent = `.rd{white-space:nowrap}.sdn{display:inline-block;max-width:64px;font-size:.88em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
  .lvb{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);font:10px/13px 'Lilita One';font-style:normal;color:#dfe8ff;background:#0b0816;border:2px solid #4b6bff;border-radius:7px;padding:0 5px;white-space:nowrap;z-index:2;pointer-events:none}
  .qi{position:relative}.qi .lvb{top:auto!important;width:auto!important;height:14px!important;box-sizing:border-box;bottom:-5px;left:auto;right:-6px;transform:none;font-size:9px!important;line-height:11px!important;padding:0 3px!important;border-width:1.500px;display:block}
  .tile.t5,.qi.t5{background:linear-gradient(#3fae5a,#1d6a35)!important}.tile.t10,.qi.t10{background:linear-gradient(#4f8dff,#1f4fc0)!important}.tile.t15,.qi.t15{background:linear-gradient(#ff5a5a,#a8182a)!important}
  .tile.t5 .lvb,.qi.t5 .lvb{border-color:#7ee08a}.tile.t10 .lvb,.qi.t10 .lvb{border-color:#9fc4ff}.tile.t15 .lvb,.qi.t15 .lvb{border-color:#ffb0b0}.qi.t5,.qi.t10,.qi.t15{border-radius:9px}
  #order .rwhy{display:none}#loopt{margin:2px 0!important}#loopt .syn{margin-top:0!important;gap:4px}#loopt .syn .sy{font-size:10px;padding:0 6px}#loopt:empty{display:none}.pzn{font:800 11px Nunito;color:#b9a6ee;text-align:center;margin-top:2px}#behav{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:5px 8px}#behav .bl{margin:0!important;font-size:10.500px;text-align:left;white-space:nowrap}#behav .bseg{margin:0!important}#behav .mvh{grid-column:1/-1;font-size:10.500px;margin:0}#behav .rtag{font-size:9px}.upsbtn{cursor:pointer}.upsbtn.on{background:#ffd45e!important;color:#2a1a00!important}
  #rwTip{position:absolute;z-index:60;display:none;background:#0b0816f7;border:2px solid #ffd45e;border-radius:14px;padding:9px 11px;box-shadow:0 4px 0 #000;color:#f1eaff}#rwTip.on{display:block;animation:pop .18s}
  #rwTip>b{font:15px 'Lilita One';font-weight:400;color:#ffd45e}#rwTip p{margin:3px 0 0;font:800 12px/1.3 Nunito}#rwTip p.ru{color:#c9b8ff}#rwTip .rwtl{font:11px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;text-transform:uppercase;margin:7px 0 3px}#rwTip .hbtn{margin-top:8px;padding:6px;font-size:14px}
  #rwTip .ostats{display:flex;flex-wrap:wrap;gap:5px}#rwTip .ostats span{display:inline-flex;gap:6px;align-items:baseline;background:#0008;border:2px solid #000;border-radius:9px;padding:2px 8px}#rwTip .ostats small{font:800 11px Nunito;color:#cfc3f2}#rwTip .ostats b{font:13px 'Lilita One';font-weight:400;color:#7ee0a0}
  #yStHud{position:absolute;left:10px;bottom:74px;z-index:2;display:none;flex-direction:column;align-items:center;gap:5px;pointer-events:none;transform:scale(.82);transform-origin:left bottom}.stage.yard #yStHud{display:flex}#yardCv{touch-action:none}
  #stHud{position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:4;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
  .sta{position:relative;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#ffd45e;background:#0009;border:2px solid #000;box-shadow:0 2px 0 #000}.sta svg{width:22px;height:22px}.sta.off{color:#6f6496;opacity:.55}
  .sta::before{content:"";position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(#ffd45e calc(var(--p,1)*360deg),#ffffff22 0);-webkit-mask:radial-gradient(farthest-side,#0000 calc(100% - 4px),#000 calc(100% - 3.500px));mask:radial-gradient(farthest-side,#0000 calc(100% - 4px),#000 calc(100% - 3.500px));opacity:0}.sta.cd::before{opacity:1}.sta.cd{color:#b9a6ee}.sta.no{animation:stNo .25s}
  @keyframes stNo{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
  .stz{display:flex;flex-direction:column;gap:3px}.stz i{width:8px;height:8px;border-radius:50%;background:#ffffff30;border:1.500px solid #000}.stz i.on{background:#ffd45e;box-shadow:0 0 6px #ffd45e}`;
  document.head.appendChild(css);
  setName();
  // D: the distance each zone holds (close, mid, far). on(): swipe stance is steering the player's range right now.
  window.STANCE = { Z, CD, D: [48, 150, 300], on: () => typeof M !== 'undefined' && M && M.zone !== undefined && (window.YARD && YARD.on ? YARD.zone !== undefined : (!M.practice && M.steer !== 'steer')) };
})();
