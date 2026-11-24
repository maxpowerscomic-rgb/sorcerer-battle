/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.21  (playtest batch A)
   Book-size hint, rivals always bring an attack, Collapse against Sanctums, draft hints (hold note and
   a recommended pick), yard notice / whistle, notification pages, chest chimes, crit slow-motion switch,
   hold a cosmetic to see how it was earned, the rainbow Collapse skin.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const S = a => new Set(a);
  const baseOf = k => (window.VARIANTS && VARIANTS[k] && VARIANTS[k].base) || k;
  const DMG = S(['fireball', 'lightning', 'ricochet', 'bubbles', 'beam', 'meteor', 'storm', 'thorns', 'sinkhole', 'ringfire', 'zombies', 'flies', 'archer', 'golem', 'burnbody', 'dissect', 'rush', 'zodiac', 'bloodoath', 'bloodcraft', 'polarity']);
  const COVER = S(['icewall', 'ghost', 'mirror', 'shield', 'blink', 'titan', 'counter', 'orbs', 'gale', 'earthm', 'doubletake', 'sanctum', 'golem']);
  const HEAL = S(['secondwind', 'healspring', 'bloodoath']);
  const isDmg = k => DMG.has(baseOf(k));

  /* ---------------- book size: say how big it is and when it grows ---------------- */
  const slotInfo = () => { try { const ri = rankOf(PR.trophies), have = BOOK_BASE + BOOK_SLOT_RANKS.filter(r => ri >= r).length, next = BOOK_SLOT_RANKS.find(r => ri < r); return { have, next: next !== undefined ? RANKS[next] : null }; } catch (e) { return null; } };
  window.bookSlotInfo = slotInfo;
  function slotNote() { const i = slotInfo(); if (!i) return ''; return i.next ? `Your book holds ${i.have}. A ${i.have + 1}th slot opens at ${i.next.n} (${i.next.t.toLocaleString()} trophies).` : `Your book holds ${i.have}, the most there is.`; }
  if (typeof renderBookCap === 'function') { const _rc = renderBookCap; window.renderBookCap = renderBookCap = function () { const r = _rc.apply(this, arguments); try { const el = $('bookcap'); if (el && !el.querySelector('.bkn')) { el.insertAdjacentHTML('beforeend', `<button class="bkn" onclick="toast(bookSlotNote())" aria-label="Book size">?</button>`); } } catch (e) {} return r; }; }
  window.bookSlotNote = slotNote;
  if (typeof showRewards === 'function') { const _sr = showRewards; window.showRewards = showRewards = function () { const before = slotInfo(); const r = _sr.apply(this, arguments); try { const after = slotInfo(); if (before && after && after.have > before.have && M && !M._slotTold) { M._slotTold = 1; const msg = `New book slot: you reached ${RANKS[rankOf(PR.trophies)].n}. Your book now holds ${after.have}.`; setTimeout(() => { try { toast(msg); } catch (e) {} }, 2600); try { if (typeof addNote === 'function') addNote('unlock', msg); } catch (e) {} } } catch (e) {} return r; }; }

  /* ---------------- every rival brings something that attacks ---------------- */
  if (typeof startDuel === 'function') { const _s = startDuel; window.startDuel = startDuel = function () {
      try { if (typeof M !== 'undefined' && M && M.foe && !M.practice && !window.ONB_ACTIVE) { const b = M.foe.book || []; if (b.length && !b.some(isDmg)) { const pool = (M.foe.pool || []).filter(isDmg), sch = typeof SCHOOL_OF === 'function' ? SCHOOL_OF(b[0]) : 'wiz';
            const pick = pool[0] || Object.keys(SP).filter(k => isDmg(k) && !(window.VARIANTS && VARIANTS[k]) && SCHOOL_OF(k) === sch)[Math.random() * 6 | 0] || 'fireball'; b[b.length - 1] = pick; if (M.foe.pool && !M.foe.pool.includes(pick)) M.foe.pool.push(pick); } } } catch (e) {}
      return _s.apply(this, arguments); }; }
  if (typeof newMatch === 'function') { const _nm = newMatch; window.newMatch = newMatch = function () { const r = _nm.apply(this, arguments);
      try { if (M && M.foe && M.foe.pool && !M.practice && !M.foe.pool.some(isDmg)) { const sch = SCHOOL_OF(M.foe.pool[0] || 'fireball'), c = Object.keys(SP).filter(k => isDmg(k) && !(window.VARIANTS && VARIANTS[k]) && SCHOOL_OF(k) === sch); if (c.length) M.foe.pool[M.foe.pool.length - 1] = c[Math.random() * c.length | 0]; } } catch (e) {}
      return r; }; }

  /* ---------------- Collapse against a Sanctum ----------------
     Fired from outside, the singularity stops on the dome's skin and grinds it down, throwing violet rays, for as long as it lasts.
     Fired from inside, it shatters a closed Sanctum the moment it reaches the wall. An Open Sanctum has no wall. */
  let grind = [];   // { c, dm, x, y }
  const domes = () => (window.TECHX && TECHX.domes) || [];
  const collapses = () => ((window.TECHX && TECHX.orbsC) || []).filter(c => c.wind && c.launched && !c.draw && !c.repel && c.life > 0);
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents === 'undefined' || !ents || !ents.length || ended) { grind = []; return r; }
        for (const c of collapses()) { if (c._gr) continue; for (const dm of domes()) { if (dm.o === c.o || dm.t >= dm.dur || dm.open || dm.hp <= 0) continue; const d = Math.hypot(c.x - dm.x, (c.y - dm.y) * 1.4);
            if (c._in === undefined) c._in = new Set(domes().filter(q => q.o !== c.o && q.t < q.dur && !q.open && Math.hypot(c.sx - q.x, (c.sy - q.y) * 1.4) < q.r));
            if (c._in.has(dm)) { if (d > dm.r - 10) { dm.hp = 0; shake = Math.max(shake, 12); c._in.delete(dm); } }                                   // from inside: the wall goes on contact
            else if (d < dm.r + 6) { c._gr = { dm, vx: c.vx, vy: c.vy }; c.vx = 0; c.vy = 0; grind.push({ c, dm, rays: [0, 1, 2, 3].map(i => ({ off: (i - 1.5) * 1.1, va: rnd(-4, 4) })) }); break; } } }
        for (const g of grind) { const c = g.c, dm = g.dm; if (!(c.life > 0) || dm.t >= dm.dur || dm.hp <= 0) { g.done = 1; if (c.life > 0 && c._gr) { c.vx = c._gr.vx; c.vy = c._gr.vy; } c._gr = null; continue; }
          c.vx = 0; c.vy = 0; dm.hp -= (c.dmg || 20) * 1.6 * dt; dm.hit = .12; shake = Math.max(shake, 4);
          for (const q of g.rays) { q.va += rnd(-60, 60) * dt; q.va = Math.max(-7, Math.min(7, q.va)); q.off += q.va * dt; if (Math.abs(q.off) > 2.6 || Math.abs(q.off) < .4) { q.va = -q.va; q.off = Math.max(.41, Math.min(2.59, Math.abs(q.off))) * Math.sign(q.off || 1); } }
          if (Math.random() < .6) P({ x: c.x + rnd(-10, 10), y: c.y - 36 * HS + rnd(-10, 10), vx: rnd(-160, 160), vy: rnd(-160, 60), color: Math.random() < .5 ? '#ffffff' : '#c48cff', size: rnd(1.8, 3.4), life: .3 }); }
        grind = grind.filter(g => !g.done); } catch (e) {}
      return r; }; }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { if (!grind.length) return r; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
        for (const g of grind) { const c = g.c, base = Math.atan2(g.dm.y - c.y, g.dm.x - c.x) + Math.PI, x0 = c.x, y0 = c.y - 36 * HS;
          for (const q of g.rays) { const a = base + q.off, L = 150 + Math.sin(T * 9 + q.off) * 30, pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([x0 + Math.cos(a) * L * u + (i && i < 6 ? rnd(-6, 6) : 0), y0 + Math.sin(a) * L * u * .8 + (i && i < 6 ? rnd(-5, 5) : 0)]); }
            for (const [lw, col] of [[8, 'rgba(176,107,255,.4)'], [2.4, 'rgba(255,255,255,.95)']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); } }
          const gg = x.createRadialGradient(x0, y0, 2, x0, y0, 30); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(.5, 'rgba(196,140,255,.55)'); gg.addColorStop(1, 'rgba(110,40,220,0)'); x.fillStyle = gg; x.beginPath(); x.arc(x0, y0, 30 + Math.sin(T * 40) * 3, 0, 7); x.fill(); }
        x.restore(); } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _s2 = startDuel; window.startDuel = startDuel = function () { grind = []; return _s2.apply(this, arguments); }; }

  /* ---------------- draft: one "hold" note under the cards, and a recommended pick ---------------- */
  function recPick() { try { const offer = M.offer || [], book = M.me.book || []; if (offer.length < 2) return -1; const hasD = book.filter(isDmg).length, hasC = book.some(k => COVER.has(baseOf(k)) || HEAL.has(baseOf(k)));
      const score = c => { const k = c.k, lv = (PR.spells[k] && PR.spells[k].lvl) || 1; let s = lv * .15;
        if (c.type === 'up') { s += 2 + (c.u && c.u.sig ? 2.5 : 0) + book.filter(q => q === k).length * .6; }
        else { const b = baseOf(k); if (window.VARIANTS && VARIANTS[k]) s += 1.5; if (isDmg(k)) s += hasD < 2 ? 3 : hasD < 3 ? 1.2 : .4; if (COVER.has(b) || HEAL.has(b)) s += hasC ? .5 : 2.6;
          if (book.some(q => ELEM_OF[q] === ELEM_OF[k] || TYPE_OF[q] === TYPE_OF[k])) s += .8; if (book.includes(k)) s += .3; if (!book.length && !isDmg(k)) s -= 1.5; }
        return s; };
      const sc = offer.map(score), best = Math.max(...sc), i = sc.indexOf(best), second = Math.max(...sc.filter((v, j) => j !== i)); return best - second >= .25 ? i : -1; } catch (e) { return -1; } }
  if (typeof renderDraft === 'function') { const _rd = renderDraft; window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments);
      try { const cards = $('cards'); if (cards) { let n = $('holdNote'); if (!n) { cards.insertAdjacentHTML('afterend', '<div id="holdNote">Hold a card for its description</div>'); }
          if (!window.ONB_ACTIVE) { const i = recPick(); if (i >= 0) { const el = cards.querySelector(`.card[data-i="${i}"] .in`); if (el && !el.querySelector('.recp')) el.insertAdjacentHTML('beforeend', '<span class="recp">Hoot\'s pick</span>'); } } } } catch (e) {}
      return r; }; }

  /* ---------------- yard: say why training has not started; a whistle at each reset ---------------- */
  function yardNote() { try { const st = document.querySelector('#home .stage'); if (!st) return; let n = $('yardNote'); const need = 4 - (PR.hand || []).length, show = PR.yard !== false && need > 0 && !window.ONB_ACTIVE;
      if (!n) { st.insertAdjacentHTML('beforeend', '<button id="yardNote" onclick="nav(\'spells\')"></button>'); n = $('yardNote'); } n.style.display = show ? '' : 'none'; if (show) n.textContent = `Add ${need} more ${need > 1 ? 'abilities' : 'ability'} to your Battle Hand to start training`; } catch (e) {} }
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); yardNote(); return r; }; }
  window.yardWhistle = function () { try { if (PR.yardWhistle === false || PR.yardMute === true || typeof AU === 'undefined' || !AU.ctx) return; const c = AU.ctx, out = (AU.g && (AU.g.sfx || AU.g.master)) || c.destination, t0 = c.currentTime;
      for (const [d, len] of [[0, .16], [.2, .34]]) { const o = c.createOscillator(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(2350, t0 + d); o.frequency.linearRampToValueAtTime(2550, t0 + d + len); lf.frequency.value = 42; lg.gain.value = 110; lf.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(.13, t0 + d + .02); g.gain.setValueAtTime(.13, t0 + d + len - .04); g.gain.linearRampToValueAtTime(0, t0 + d + len); o.connect(g).connect(out); o.start(t0 + d); lf.start(t0 + d); o.stop(t0 + d + len + .02); lf.stop(t0 + d + len + .02); } } catch (e) {} };

  /* ---------------- notifications: 14 to a page, and Clear ---------------- */
  let nPage = 0, nTab = 'notes';
  if (typeof openNotes === 'function') { const _on = openNotes; window.openNotes = function (t) { if (t && t !== nTab) nPage = 0; if (t) nTab = t; const r = _on.apply(this, arguments);
      try { const list = document.querySelector('#sheetP .nlist'); const isNotes = nTab === 'notes' && list && list.querySelector('.nrow'); if (!isNotes) return r; const rows = [...list.querySelectorAll('.nrow')], PER = 14, pages = Math.max(1, Math.ceil(rows.length / PER)); nPage = Math.max(0, Math.min(pages - 1, nPage));
        rows.forEach((el, i) => { el.style.display = i >= nPage * PER && i < (nPage + 1) * PER ? '' : 'none'; });
        list.insertAdjacentHTML('afterend', `<div class="npg">${pages > 1 ? `<button ${nPage ? '' : 'disabled'} onclick="notePage(-1)">‹</button><span>${nPage + 1} / ${pages}</span><button ${nPage < pages - 1 ? '' : 'disabled'} onclick="notePage(1)">›</button>` : ''}<button class="ncl" onclick="noteClear()">Clear all</button></div>`); list.scrollTop = 0; } catch (e) {}
      return r; }; openNotes = window.openNotes; }
  window.notePage = d => { nPage += d; openNotes(); };
  window.noteClear = function () { const b = document.querySelector('.npg .ncl'); if (b && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Tap again to clear'; return; } PR.notes = []; PR.unread = 0; nPage = 0; try { save(); } catch (e) {} openNotes(); };

  /* ---------------- match history: each saved match opens with a short story ---------------- */
  if (typeof openMatch === 'function') { const _om = openMatch; window.openMatch = function (i) { const r = _om.apply(this, arguments);
      try { const h = (PR.history || [])[i]; if (!h) return r; const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        const tot = side => { const o = {}; (h.rounds || []).forEach(q => { for (const k in (q[side] || {})) o[k] = (o[k] || 0) + q[side][k]; }); const k = Object.keys(o).filter(q => SP[q]).sort((a, b) => o[b] - o[a])[0]; return k ? { k, d: Math.round(o[k]), all: Math.round(Object.values(o).reduce((a, b) => a + b, 0)) } : null; };
        const me = tot('me'), fo = tot('foe'), sc = h.score || [0, 0], out = [];
        out.push(h.won ? (sc[1] === 0 ? `You swept ${esc(h.foe)} ${sc[0]} rounds to 0.` : `You beat ${esc(h.foe)} ${sc[0]} rounds to ${sc[1]}.`) : (sc[0] === 0 ? `${esc(h.foe)} swept you ${sc[1]} rounds to 0.` : `${esc(h.foe)} beat you ${sc[1]} rounds to ${sc[0]}.`));
        if (me && fo) out.push(me.all >= fo.all ? `You out-damaged them ${me.all} to ${fo.all}, mostly with ${esc(SP[me.k].n)} (${me.d}).` : `They out-damaged you ${fo.all} to ${me.all}, mostly with ${esc(SP[fo.k].n)} (${fo.d}).`);
        if (me && fo && h.won !== (me.all >= fo.all)) out.push(h.won ? 'You won on fewer hits that mattered more.' : 'You dealt more, but not when it counted.');
        const sh = document.querySelector('#sheetP .sh'); if (sh && !document.querySelector('#sheetP .txstory')) sh.insertAdjacentHTML('afterend', `<div class="txstory">${out.join(' ')}</div>`); } catch (e) {}
      return r; }; openMatch = window.openMatch; }

  /* ---------------- chest chimes ---------------- */
  function chestChime(grand) { try { if (typeof AU === 'undefined' || !AU.ctx) return; const c = AU.ctx, out = (AU.g && (AU.g.sfx || AU.g.master)) || c.destination, t0 = c.currentTime;
      const notes = grand ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093] : [659.25, 783.99, 1046.5];
      notes.forEach((f, i) => { const d = i * (grand ? .085 : .11), len = grand ? 1.1 : .6; for (const [mul, vol, type] of [[1, .13, 'triangle'], [2, .05, 'sine']].concat(grand ? [[3, .025, 'sine']] : [])) { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f * mul; g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(vol, t0 + d + .012); g.gain.exponentialRampToValueAtTime(.0006, t0 + d + len); o.connect(g).connect(out); o.start(t0 + d); o.stop(t0 + d + len + .05); } });
      if (grand) { const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate), dd = buf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dd.length, 1.6) * (.5 + .5 * Math.sin(i / 300)); n.buffer = buf; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500; const g = c.createGain(); g.gain.value = .07; n.connect(hp).connect(g).connect(out); n.start(t0 + .5); } } catch (e) {} }
  window.chestChime = chestChime;
  if (typeof openChestEvent === 'function') { const _oc = openChestEvent; window.openChestEvent = openChestEvent = function (name) { try { const grand = /^Arcane/i.test(name || ''); setTimeout(() => chestChime(grand), 1960); } catch (e) {} return _oc.apply(this, arguments); }; }

  /* ---------------- options: slow motion on crits, yard whistle ---------------- */
  window.setCritSlow = v => { try { SET().critSlow = !!v; save(); } catch (e) {} };
  window.setYardWhistle = v => { PR.yardWhistle = !!v; try { save(); } catch (e) {} if (v) yardWhistle(); };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML; window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = $('pause') && $('pause').classList.contains('on');
      const rows = `<label class="opt"><span>Slow motion on critical hits</span><input type="checkbox" ${SET().critSlow !== false ? 'checked' : ''} onchange="setCritSlow(this.checked)"><i></i></label>` + (inMatch ? '' : `<label class="opt"><span>Whistle when training resets</span><input type="checkbox" ${PR.yardWhistle !== false ? 'checked' : ''} onchange="setYardWhistle(this.checked)"><i></i></label>`);
      return h.includes('<div class="opt"><span>Music</span>') ? h.replace('<div class="opt"><span>Music</span>', rows + '<div class="opt"><span>Music</span>') : h.replace(/<\/div>$/, rows + '</div>'); }; }

  /* ---------------- wardrobe: hold an item you own to see how you got it ---------------- */
  { let t = 0; const how = (cat, it) => { const u = (it && it.unlock) || { type: 'free' }; if (u.type === 'free') return 'Free for everyone.'; if (u.type === 'gems') return `Bought for ${u.v} gems.`; if (u.type === 'coins') return `Bought for ${u.v} gold.`; let s = ''; try { s = unlockText(u) || ''; } catch (e) {} return s ? 'Earned: ' + s.replace(/\s*\(\d+\/\d+\)\s*$/, '') + '.' : 'Earned.'; };
    document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('#items .item'); if (!el) return; clearTimeout(t); t = setTimeout(() => { try { const idx = [...el.parentElement.children].indexOf(el), it = catItems(wCat)[idx]; if (it && ownsItem(wCat, it)) toast(`${typeof cosN === 'function' ? cosN(wCat, it) : it.n}. ${how(wCat, it)}`); } catch (x) {} }, 480); }, true);
    for (const ev of ['pointerup', 'pointercancel', 'pointermove']) document.addEventListener(ev, e => { if (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(t); }, true); }

  /* ---------------- the rainbow Collapse wake, as an Attacks cosmetic ---------------- */
  try { if (COSMETICS.atk && !COSMETICS.atk.some(a => a.id === 'rainbow')) COSMETICS.atk.push({ id: 'rainbow', n: 'Prismatic Collapse', r: 'legendary', unlock: { type: 'trialwins', k: 'polarity', v: 10 }, note: 'Collapse leaves a rainbow wake instead of violet.' }); } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `.bkn{all:unset;cursor:pointer;margin-left:6px;width:18px;height:18px;border-radius:50%;background:#4a3a80;border:2px solid #000;color:#fff;font:12px/18px 'Lilita One';text-align:center}
  #holdNote{text-align:center;font:800 11px Nunito;color:#b9a6ee;opacity:.75;margin:2px 0 0;letter-spacing:.3px}.card .cmeta .mh{display:none!important}
  .recp{position:absolute;top:-9px;right:54px;z-index:4;font:11px 'Lilita One';color:#2a1a00;background:linear-gradient(#ffe27a,#f0a830);border:2px solid #000;border-radius:8px;padding:1px 7px;box-shadow:0 2px 0 #000;white-space:nowrap}
  #yardNote{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:3;max-width:74%;font:14px/1.3 'Lilita One';color:#fff;text-align:center;background:#000b;border:2px solid #ffd45e;border-radius:14px;padding:10px 14px;cursor:pointer;box-shadow:0 3px 0 #000}
  .npg{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px}.npg span{font:13px 'Lilita One';color:#d9cdfa}.npg button{font:14px 'Lilita One';color:#fff;background:linear-gradient(#4a3a80,#2b2050);border:2px solid #000;border-radius:9px;padding:3px 12px;cursor:pointer;box-shadow:0 2px 0 #000}.npg button:disabled{opacity:.35}.npg .ncl{margin-left:auto;background:linear-gradient(#a8323e,#6a1420);font-size:12px}`;
  document.head.appendChild(css);
  try { yardNote(); } catch (e) {}
})();
