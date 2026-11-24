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
    return `<b>${esc(SP[k].n)} · Lv ${sp.lvl}</b><p>+${got} skill points this match${max ? '' : ` · ${sp.cards} / ${need}`}</p>${rune ? `<p class="ru">${rune}</p>` : ''}${rows ? `<div class="rwtl">Level ${sp.lvl + 1} gives</div><div class="ostats">${rows}</div>` : max ? '<p>Max level.</p>' : ''}${ready ? `<button class="hbtn" onclick="rwTipClose();openSpell('${k}')">Upgrade now</button>` : ''}`; }
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
      const keep = PR.behavior; PR.behavior = Z[M.zone]; try { return _u.apply(this, arguments); } finally { PR.behavior = keep; if (M.zoneCd > 0) M.zoneCd -= dt; paint(); } }; }
  // a swipe is a short, quick, mostly vertical stroke on the arena
  try { const cv = $('cv'); let s0 = null;
    cv.addEventListener('pointerdown', e => { if (active()) s0 = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    const end = e => { if (!s0) return; const dx = e.clientX - s0.x, dy = e.clientY - s0.y, ms = performance.now() - s0.t; s0 = null; if (ms > 600 || Math.abs(dy) < 34 || Math.abs(dy) < Math.abs(dx) * 1.2) return; stanceStep(dy < 0 ? -1 : 1); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', () => { s0 = null; }); } catch (e) {}
  document.addEventListener('keydown', e => { if (e.key === 'ArrowUp') stanceStep(-1); else if (e.key === 'ArrowDown') stanceStep(1); });

  const css = document.createElement('style');
  css.textContent = `.sdn{display:inline-block;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
  #rwTip{position:absolute;z-index:60;display:none;background:#0b0816f7;border:2px solid #ffd45e;border-radius:14px;padding:9px 11px;box-shadow:0 4px 0 #000;color:#f1eaff}#rwTip.on{display:block;animation:pop .18s}
  #rwTip>b{font:15px 'Lilita One';font-weight:400;color:#ffd45e}#rwTip p{margin:3px 0 0;font:800 12px/1.3 Nunito}#rwTip p.ru{color:#c9b8ff}#rwTip .rwtl{font:11px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;text-transform:uppercase;margin:7px 0 3px}#rwTip .hbtn{margin-top:8px;padding:6px;font-size:14px}
  #rwTip .ostats{display:flex;flex-wrap:wrap;gap:5px}#rwTip .ostats span{display:inline-flex;gap:6px;align-items:baseline;background:#0008;border:2px solid #000;border-radius:9px;padding:2px 8px}#rwTip .ostats small{font:800 11px Nunito;color:#cfc3f2}#rwTip .ostats b{font:13px 'Lilita One';font-weight:400;color:#7ee0a0}
  #stHud{position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:4;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
  .sta{position:relative;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:#ffd45e;background:#0009;border:2px solid #000;box-shadow:0 2px 0 #000}.sta svg{width:22px;height:22px}.sta.off{color:#6f6496;opacity:.55}
  .sta::before{content:"";position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(#ffd45e calc(var(--p,1)*360deg),#ffffff22 0);-webkit-mask:radial-gradient(farthest-side,#0000 calc(100% - 4px),#000 calc(100% - 3.500px));mask:radial-gradient(farthest-side,#0000 calc(100% - 4px),#000 calc(100% - 3.500px));opacity:0}.sta.cd::before{opacity:1}.sta.cd{color:#b9a6ee}.sta.no{animation:stNo .25s}
  @keyframes stNo{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
  .stz{display:flex;flex-direction:column;gap:3px}.stz i{width:8px;height:8px;border-radius:50%;background:#ffffff30;border:1.500px solid #000}.stz i.on{background:#ffd45e;box-shadow:0 0 6px #ffd45e}`;
  document.head.appendChild(css);
  setName();
  window.STANCE = { Z, CD };
})();
