/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.7
   1. Your own hand is shown on the versus screen, under your name.
   2. Wardrobe: No Aura (the aura can be switched off).
   3. Fight Club (replaces Friends): a bounty board of 3 wizards and 3 sorcerers that changes every
      30 minutes. Each is a strong, built rival; a first win in the window pays gems and gold.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- 1. my hand on the versus screen ---------------- */
  if (typeof showVs === 'function') { const _sv = showVs;
    window.showVs = showVs = function () { const r = _sv.apply(this, arguments);
      try { const box = $('vsMeInfo'); if (box && !box.querySelector('.vsh') && (PR.hand || []).length) box.insertAdjacentHTML('beforeend', `<div class="vsh">${PR.hand.filter(k => SP[k]).map(k => `<img src="${ICON[k]}">`).join('')}</div>`); } catch (e) {}
      return r; }; }

  /* ---------------- 2. No Aura ---------------- */
  try { if (COSMETICS.aura && !COSMETICS.aura.some(a => a.id === 'none')) COSMETICS.aura.unshift({ id: 'none', n: 'No Aura', r: 'common', c: ['#8f80b8', '#4a3a80'], unlock: { type: 'free' } }); } catch (e) {}
  if (typeof renderWardrobe === 'function') { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'aura') { const i = COSMETICS.aura.findIndex(a => a.id === 'none'), c = document.querySelector(`#items canvas[data-i="${i}"]`); if (c) { const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#140a26'; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#6f6496'; g.lineWidth = c.width * .07; g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width * .26, 0, 7); g.moveTo(c.width * .32, c.height * .68); g.lineTo(c.width * .68, c.height * .32); g.stroke(); } } } catch (e) {}
      return r; }; }

  /* ---------------- 3. Fight Club ---------------- */
  const SLOT_MS = 30 * 60 * 1000, GEMS = 15, GOLD = 60, CLEAR = 25, LVL = 3;
  window.ECON = Object.assign(window.ECON || {}, { clubGems: GEMS, clubClear: CLEAR, clubSlotMin: 30 });
  const slotNow = () => Math.floor(Date.now() / SLOT_MS);
  const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const FIRST = { wiz: ['Maelis', 'Orrin', 'Thessaly', 'Bram', 'Isolde', 'Quill', 'Fenwick', 'Odalys', 'Corvane', 'Ysolt', 'Hesper', 'Dunmore'], sorc: ['Kaito', 'Ren', 'Mako', 'Tova', 'Juno', 'Brask', 'Sable', 'Ikko', 'Vesna', 'Garrow', 'Nyx', 'Tamsa'] };
  const LAST = { wiz: ['the Unwritten', 'Ashquill', 'of the Ninth Bell', 'Glasswick', 'the Pale Ledger', 'Mournstar', 'of Hollow Tower', 'Inkveil'], sorc: ['Ironknuckle', 'the Unbowed', 'Redhand', 'of the Long Road', 'Stonebreath', 'the Last Bell', 'Nine Scars', 'Quietfist'] };
  let cache = null;
  function board() { const slot = slotNow(); if (cache && cache.slot === slot) return cache.list;
    const R = rng(slot * 7919 + 13), pick = a => a[Math.floor(R() * a.length)], keep = Math.random, list = [];
    const all = Object.keys(SP).filter(k => !(window.VARIANTS && VARIANTS[k]) && (SP[k].t || 0) >= .5 && TYPE_OF[k]);
    Math.random = R;   // looks are rolled with the board's own dice, so every player sees the same six
    try { for (const cls of ['wiz', 'wiz', 'wiz', 'sorc', 'sorc', 'sorc']) { const mine = all.filter(k => SCHOOL_OF(k) === cls), hit = mine.filter(k => TYPE_OF[k] !== 'support'), sup = mine.filter(k => TYPE_OF[k] === 'support'), hand = [];
        const take = from => { const c = from.filter(k => !hand.includes(k)); if (c.length) hand.push(pick(c)); };
        take(hit); take(hit); take(sup); take(sup); while (hand.length < 4) take(mine);
        const ups = []; for (const k of hand) { const c = (UPG[k] || []).filter(u => !u.req && !u.sig); if (c.length) ups.push(k + '.' + pick(c).id); } { const c = (UPG[hand[0]] || []).filter(u => !u.req && !u.sig && !ups.includes(hand[0] + '.' + u.id)); if (c.length) ups.push(hand[0] + '.' + pick(c).id); }
        let n; do { n = pick(FIRST[cls]) + ' ' + pick(LAST[cls]); } while (list.some(b => b.n === n));
        const look = Object.assign({}, typeof randomLook === 'function' ? randomLook() : {}, { cls });
        list.push({ id: slot + ':' + list.length, n, cls, hand, mains: hand.slice(0, 2), ups, look, aura: cls === 'sorc' ? pick(['crimson', 'azure', 'jade', 'violet']) : undefined, title: SP[hand[0]].n + ' and ' + SP[hand[1]].n }); } }
    finally { Math.random = keep; }
    cache = { slot, list }; return list; }
  const st = () => { const s = (PR.club = PR.club || { slot: 0, won: [], clear: 0 }); if (s.slot !== slotNow()) { s.slot = slotNow(); s.won = []; s.clear = 0; } return s; };
  const left = () => { const ms = (slotNow() + 1) * SLOT_MS - Date.now(), m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; return m + ':' + String(s).padStart(2, '0'); };

  window.clubFight = function (i) { const b = board()[i]; if (!b) return; if (typeof fixHand === 'function') fixHand(); if ((PR.hand || []).length < 4) { toast('Fill your battle hand first: ' + (PR.hand || []).length + ' of 4'); return nav('spells'); } closeSheet(); newMatch({ bounty: i }); };
  window.clubOpen = function (i) { const b = board()[i], s = st(); if (!b) return; const done = s.won.includes(b.id);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">${esc(b.n)}</div><div class="ssub" style="margin:0">${b.cls === 'sorc' ? 'Sorcerer' : 'Wizard'} bounty · ${LVL} levels above your hand</div>
      <div class="clav"><canvas id="clCv" width="176" height="176"></canvas></div>
      <div class="dml">Hand</div><div class="clhand">${b.hand.map(k => `<span><img src="${ICON[k]}"><small>${esc(SP[k].n)}</small></span>`).join('')}</div>
      <div class="dml">Starts with</div><div class="clups">${b.ups.map(u => { const [k, id] = u.split('.'), up = (UPG[k] || []).find(q => q.id === id); return up ? `<span><b>${esc(up.n)}</b>${esc(up.d)}</span>` : ''; }).join('')}</div>
      <button class="upbtn" style="margin-top:10px" onclick="clubFight(${i})">${done ? 'Fight again (no reward)' : `Fight · ${GEMS} 💎 + ${GOLD} gold`}</button>`;
    $('sheet').classList.add('on'); try { drawAva($('clCv'), lookWiz(Object.assign({}, b.look, { aura: b.aura }))); } catch (e) {} };
  function render() { const host = $('friends'); if (!host) return; const mc = host.querySelector('.mc'), L = board(), s = st(), n = L.filter(b => s.won.includes(b.id)).length;
    mc.innerHTML = `<div class="sh">Fight Club</div><div class="ssub">Six bounties: three wizards, three sorcerers. Tough builds, ${LVL} levels above you. Beat one for ${GEMS} gems; clear all six for ${CLEAR} more.</div>
      <div class="clbar"><span>New faces in <b id="clT">${left()}</b></span><span>${n} / 6 beaten${s.clear ? ' · cleared ✓' : ''}</span></div>
      <div id="flist" style="display:flex;flex-direction:column;gap:8px">${L.map((b, i) => { const done = s.won.includes(b.id);
        return `<div class="frow clrow ${b.cls} ${done ? 'done' : ''}" onclick="clubOpen(${i})"><div class="fav"><canvas width="88" height="88" data-b="${i}"></canvas></div><div class="g"><b>${esc(b.n)}</b><small>${b.cls === 'sorc' ? 'Sorcerer' : 'Wizard'} · ${esc(b.title)}</small><span class="clh">${b.hand.map(k => `<img src="${ICON[k]}">`).join('')}</span></div>
          <button class="fbtn ${done ? 'off' : ''}" onclick="event.stopPropagation();clubFight(${i})">${done ? '✓' : GEMS + ' 💎'}</button></div>`; }).join('')}</div>`;
    mc.querySelectorAll('canvas[data-b]').forEach(c => { try { const b = L[+c.dataset.b]; drawAva(c, lookWiz(Object.assign({}, b.look, { aura: b.aura }))); } catch (e) {} }); }
  window.renderFriends = renderFriends = render;
  setInterval(() => { try { const h = $('friends'); if (!h || !h.classList.contains('on')) return; const t = $('clT'); if (cache && cache.slot !== slotNow()) return render(); if (t) t.textContent = left(); } catch (e) {} }, 1000);
  if (typeof nav === 'function') { const _n = nav; window.nav = nav = function (t) { const r = _n.apply(this, arguments); if (t === 'friends') { try { render(); } catch (e) {} } return r; }; }

  if (typeof newMatch === 'function') { const _nm = newMatch;
    window.newMatch = newMatch = function (o) { o = o || {}; const b = o.bounty !== undefined ? board()[o.bounty] : null; if (!b) return _nm.apply(this, arguments);
      const lvs = (PR.hand || []).map(k => PR.spells[k].lvl), base = Math.round(lvs.reduce((a, c) => a + c, 0) / Math.max(1, lvs.length)), lv = clamp(base + LVL, 1, MAXL);
      const res = _nm.call(this, Object.assign({}, o, { name: b.n, look: Object.assign({}, b.look, { aura: b.aura }), mode: 'casual', lv: Object.fromEntries(Object.keys(SP).map(k => [k, lv])) }));
      try { M.bounty = b; M.rival = b; M.foe.pool = b.hand.slice(); M.foe.up = new Set(b.ups); M.foeAcct = Math.max(1, PR.lvl + LVL);
        M.profile = Object.assign({}, M.profile, { n: 'Bounty', fav: Object.fromEntries(b.hand.map((k, j) => [k, j < 2 ? 12 : 8])) }); if (typeof synergyOf === 'function') M.foeSyn = synergyOf(M.foe.pool); } catch (e) {}
      return res; }; }
  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () { const r = _sr.apply(this, arguments);
      try { const b = M && M.bounty; if (b) { const md = $('rwMode'); if (md) md.textContent = 'Fight Club · vs ' + b.n;
          if (!M._clubDone) { M._clubDone = 1; M._club = null; const s = st();
            if (M.score.me > M.score.foe && b.id.split(':')[0] === String(s.slot) && !s.won.includes(b.id)) { s.won.push(b.id); let g = GEMS; const msgs = [`Bounty: +${GEMS} gems, +${GOLD} gold`]; PR.coins += GOLD;
              if (s.won.length >= 6 && !s.clear) { s.clear = 1; g += CLEAR; msgs.push(`Board cleared: +${CLEAR} gems`); } PR.gems = (PR.gems || 0) + g; M._club = msgs; try { save(); } catch (e) {} }
            else if (M.score.me > M.score.foe) M._club = [b.id.split(':')[0] === String(s.slot) ? 'Bounty already claimed' : 'This bounty left the board before you won: no reward']; }
          let box = $('rwClub'); if (box) box.remove(); if (M._club) { const at = document.querySelector('#rewards #rwCards') || $('rwBtn'); if (at) at.insertAdjacentHTML('beforebegin', `<div id="rwClub"><b>Fight Club</b>${M._club.map(m => `<span>${m}</span>`).join('')}</div>`); } }
        else { const box = $('rwClub'); if (box) box.remove(); } } catch (e) {}
      return r; }; }
  try { const ti = $('tiFriends'); if (ti) ti.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 3h14v15l-7 3.500L5 18z" fill="#e6c98a" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.300l1.500 3.100 3.400.5-2.500 2.400.6 3.400-3-1.600-3 1.600.6-3.400-2.500-2.400 3.400-.5z" fill="#c8102e" stroke="#000" stroke-width="1.200" stroke-linejoin="round"/></svg>'; } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `.vsh{display:flex;gap:5px;margin-top:7px}.vsh img{width:34px;height:34px;filter:drop-shadow(0 2px 0 #0008)}
  .clbar{display:flex;justify-content:space-between;align-items:center;font:800 12px Nunito;color:#d9cdfa;background:#0007;border:2px solid #000;border-radius:11px;padding:6px 10px;margin-bottom:8px}.clbar b{font:14px 'Lilita One';font-weight:400;color:#ffd45e}
  .clrow{cursor:pointer}.clrow.wiz{background:linear-gradient(90deg,#4a1f2c,#1a1330)}.clrow.sorc{background:linear-gradient(90deg,#1f3466,#1a1330)}.clrow.done{opacity:.6}.clrow .g{min-width:0;flex:1;display:flex;flex-direction:column}.clrow .g b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.clrow .g small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .clh{display:flex;gap:3px;margin-top:3px}.clh img{width:22px;height:22px}.clrow .fav canvas{width:46px;height:46px;border-radius:12px;border:2px solid #000}.clrow .fbtn{white-space:nowrap}
  .clav{display:flex;justify-content:center;margin:8px 0}.clav canvas{width:110px;height:110px;border-radius:20px;border:3px solid #000}
  .clhand{display:flex;justify-content:center;gap:8px}.clhand span{width:70px;display:flex;flex-direction:column;align-items:center;gap:2px}.clhand img{width:46px;height:46px}.clhand small{font:800 10px/1.1 Nunito;color:#d9cdfa;text-align:center}
  .clups{display:flex;flex-direction:column;gap:4px}.clups span{font:800 11.5px/1.3 Nunito;color:#d9cdfa;background:#0006;border:2px solid #000;border-radius:10px;padding:5px 8px}.clups b{display:block;font:12.500px 'Lilita One';font-weight:400;color:#ffd45e}
  #rwClub{margin:8px 0;background:linear-gradient(#3a1f1a,#241028);border:2px solid #ffd75e;border-radius:13px;padding:8px 11px;display:flex;flex-direction:column;gap:3px}#rwClub b{font:14px 'Lilita One';font-weight:400;color:#ffd75e}#rwClub span{font:800 12.500px Nunito;color:#f1eaff}`;
  document.head.appendChild(css);
  window.CLUB = { board, st };
})();
