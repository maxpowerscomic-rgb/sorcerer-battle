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

  /* ---------------- 3. Fight Club ----------------
     (1.0.21) A wager board. Entering a bounty costs STAKE gems; winning pays WIN. Beating all three wizards, all three sorcerers
     and all six each pay a bonus. A beaten bounty can be starred to keep it after the board turns over (rematch for a little gold).
     The whole board can be re-rolled for RESET gems. */
  const SLOT_MS = 30 * 60 * 1000, STAKE = 15, WIN = 25, SET_W = 40, SET_S = 40, ALL = 250, RESET = 100, FAVGOLD = 10, FAVMAX = 10, LVL = 3;
  window.ECON = Object.assign(window.ECON || {}, { clubStake: STAKE, clubWin: WIN, clubSet: SET_W, clubAll: ALL, clubReset: RESET, clubSlotMin: 30 });
  const slotNow = () => Math.floor(Date.now() / SLOT_MS);
  const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const FIRST = { wiz: ['Maelis', 'Orrin', 'Thessaly', 'Bram', 'Isolde', 'Quill', 'Fenwick', 'Odalys', 'Corvane', 'Ysolt', 'Hesper', 'Dunmore'], sorc: ['Kaito', 'Ren', 'Mako', 'Tova', 'Juno', 'Brask', 'Sable', 'Ikko', 'Vesna', 'Garrow', 'Nyx', 'Tamsa'] };
  const LAST = { wiz: ['the Unwritten', 'Ashquill', 'of the Ninth Bell', 'Glasswick', 'the Pale Ledger', 'Mournstar', 'of Hollow Tower', 'Inkveil'], sorc: ['Ironknuckle', 'the Unbowed', 'Redhand', 'of the Long Road', 'Stonebreath', 'the Last Bell', 'Nine Scars', 'Quietfist'] };
  const st = () => { const s = (PR.club = PR.club || { slot: 0, won: [], clear: 0 }); if (s.slot !== slotNow()) { s.slot = slotNow(); s.won = []; s.clear = 0; s.off = 0; s.setW = 0; s.setS = 0; } s.off = s.off || 0; return s; };
  const favs = () => (PR.clubFav = Array.isArray(PR.clubFav) ? PR.clubFav : []);
  let cache = null;
  function board() { const slot = slotNow(), off = st().off, key = slot + ':' + off; if (cache && cache.key === key) return cache.list;
    const R = rng(slot * 7919 + 13 + off * 104729), pick = a => a[Math.floor(R() * a.length)], keep = Math.random, list = [];
    const all = Object.keys(SP).filter(k => !(window.VARIANTS && VARIANTS[k]) && (SP[k].t || 0) >= .5 && TYPE_OF[k]);
    Math.random = R;   // looks are rolled with the board's own dice, so every player sees the same six
    try { for (const cls of ['wiz', 'wiz', 'wiz', 'sorc', 'sorc', 'sorc']) { const mine = all.filter(k => SCHOOL_OF(k) === cls), hit = mine.filter(k => TYPE_OF[k] !== 'support'), sup = mine.filter(k => TYPE_OF[k] === 'support'), hand = [];
        const take = from => { const c = from.filter(k => !hand.includes(k)); if (c.length) hand.push(pick(c)); };
        take(hit); take(hit); take(sup); take(sup); while (hand.length < 4) take(mine);
        const ups = []; for (const k of hand) { const c = (UPG[k] || []).filter(u => !u.req && !u.sig); if (c.length) ups.push(k + '.' + pick(c).id); } { const c = (UPG[hand[0]] || []).filter(u => !u.req && !u.sig && !ups.includes(hand[0] + '.' + u.id)); if (c.length) ups.push(hand[0] + '.' + pick(c).id); }
        let n; do { n = pick(FIRST[cls]) + ' ' + pick(LAST[cls]); } while (list.some(b => b.n === n));
        const look = Object.assign({}, typeof randomLook === 'function' ? randomLook() : {}, { cls });
        list.push({ id: key + ':' + list.length, n, cls, hand, mains: hand.slice(0, 2), ups, look, aura: cls === 'sorc' ? pick(['crimson', 'azure', 'jade', 'violet']) : undefined, title: SP[hand[0]].n + ' and ' + SP[hand[1]].n }); } }
    finally { Math.random = keep; }
    cache = { key, list }; return list; }
  const left = () => { const ms = (slotNow() + 1) * SLOT_MS - Date.now(), m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60; return m + ':' + String(s).padStart(2, '0'); };
  const handOk = () => { if (typeof fixHand === 'function') fixHand(); if ((PR.hand || []).length < 4) { toast('Fill your battle hand first: ' + (PR.hand || []).length + ' of 4'); nav('spells'); return false; } return true; };

  window.clubFight = function (i) { const b = board()[i], s = st(); if (!b || !handOk()) return;
    if (s.won.includes(b.id)) return toast('Already beaten. Star it to keep it for rematches.');
    if ((PR.gems || 0) < STAKE) return toast(`The wager is ${STAKE} gems`);
    PR.gems -= STAKE; try { save(); if (window.chaChing) chaChing(); } catch (e) {} closeSheet(); newMatch({ bounty: i }); };
  window.clubFavFight = function (j) { const b = favs()[j]; if (!b || !handOk()) return; closeSheet(); newMatch({ bountyObj: b }); };
  window.clubStar = function (i) { const b = board()[i], F = favs(); if (!b) return; const at = F.findIndex(q => q.id === b.id); if (at >= 0) F.splice(at, 1); else { if (F.length >= FAVMAX) return toast(`You can keep ${FAVMAX} favourites. Remove one first.`); F.push(JSON.parse(JSON.stringify(b))); } try { save(); sfx('ui_pick'); } catch (e) {} render(); };
  window.clubUnstar = function (j) { favs().splice(j, 1); try { save(); } catch (e) {} render(); };
  window.clubReset = function () { const s = st(); if ((PR.gems || 0) < RESET) return toast(`A new board costs ${RESET} gems`); const b = document.getElementById('clReset'); if (b && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = `Tap again: new board for ${RESET} 💎`; return; }
    PR.gems -= RESET; s.off++; s.won = []; s.clear = 0; s.setW = 0; s.setS = 0; cache = null; try { save(); if (window.chaChing) chaChing(); refreshMeta(); } catch (e) {} render(); toast('Six new bounties'); };
  window.clubOpen = function (i, fav) { const b = fav ? favs()[i] : board()[i], s = st(); if (!b) return; const done = !fav && s.won.includes(b.id);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">${esc(b.n)}</div><div class="ssub" style="margin:0">${b.cls === 'sorc' ? 'Sorcerer' : 'Wizard'} ${fav ? 'favourite' : 'bounty'} · ${LVL} levels above your hand</div>
      <div class="clav"><canvas id="clCv" width="176" height="176"></canvas></div>
      <div class="dml">Hand</div><div class="clhand">${b.hand.map(k => `<span><img src="${ICON[k]}"><small>${esc(SP[k].n)}</small></span>`).join('')}</div>
      <div class="dml">Starts with</div><div class="clups">${b.ups.map(u => { const [k, id] = u.split('.'), up = (UPG[k] || []).find(q => q.id === id); return up ? `<span><b>${esc(up.n)}</b>${esc(up.d)}</span>` : ''; }).join('')}</div>
      ${fav ? `<button class="upbtn" style="margin-top:10px" onclick="clubFavFight(${i})">Rematch · win ${FAVGOLD} gold</button>` : done ? '<div class="ssub" style="margin:10px 0 0">Beaten. Star it on the board to keep it.</div>' : `<button class="upbtn" style="margin-top:10px" onclick="clubFight(${i})" ${(PR.gems || 0) < STAKE ? 'disabled' : ''}>Wager ${STAKE} 💎 · win ${WIN} 💎</button>`}`;
    $('sheet').classList.add('on'); try { drawAva($('clCv'), lookWiz(Object.assign({}, b.look, { aura: b.aura }))); } catch (e) {} };
  function render() { const host = $('friends'); if (!host) return; const mc = host.querySelector('.mc'), L = board(), s = st(), F = favs(), n = L.filter(b => s.won.includes(b.id)).length;
    const row = (b, i, fav) => { const done = !fav && s.won.includes(b.id), star = !fav && F.some(q => q.id === b.id);
      return `<div class="frow clrow ${b.cls} ${done ? 'done' : ''}" onclick="clubOpen(${i}${fav ? ',1' : ''})"><div class="fav"><canvas width="88" height="88" data-b="${fav ? 'f' : ''}${i}"></canvas></div><div class="g"><b>${esc(b.n)}</b><small>${b.cls === 'sorc' ? 'Sorcerer' : 'Wizard'} · ${esc(b.title)}</small><span class="clh">${b.hand.map(k => `<img src="${ICON[k]}">`).join('')}</span></div>
        ${fav ? `<button class="fbtn" onclick="event.stopPropagation();clubFavFight(${i})">Fight</button><button class="clx" onclick="event.stopPropagation();clubUnstar(${i})" aria-label="Remove favourite">✕</button>` : done ? `<button class="clstar ${star ? 'on' : ''}" onclick="event.stopPropagation();clubStar(${i})" aria-label="Favourite">${star ? '★' : '☆'}</button>` : `<button class="fbtn" onclick="event.stopPropagation();clubFight(${i})">${STAKE} 💎</button>`}</div>`; };
    mc.innerHTML = `<div class="sh">Fight Club</div><div class="ssub">Wager ${STAKE} gems on a bounty; win and take ${WIN}. Tough builds, ${LVL} levels above you.</div>
      <div class="clbar"><span>New faces in <b id="clT">${left()}</b></span><span>${n} / 6 beaten</span></div>
      <div class="clsets"><span class="${s.setW ? 'ok' : ''}">All wizards <b>+${SET_W} 💎</b></span><span class="${s.setS ? 'ok' : ''}">All sorcerers <b>+${SET_S} 💎</b></span><span class="${s.clear ? 'ok' : ''}">All six <b>+${ALL} 💎</b></span></div>
      <div id="flist" style="display:flex;flex-direction:column;gap:8px">${L.map((b, i) => row(b, i, 0)).join('')}</div>
      <button class="hbtn out" id="clReset" style="margin-top:10px" onclick="clubReset()">↻ New board · ${RESET} 💎</button>
      ${F.length ? `<div class="lbl" style="margin-top:14px">★ Favourites <small style="opacity:.7">rematch any time · ${FAVGOLD} gold a win</small></div><div style="display:flex;flex-direction:column;gap:8px">${F.map((b, i) => row(b, i, 1)).join('')}</div>` : '<div class="ssub" style="margin-top:10px">Beat a bounty, then star it to keep it for rematches after the board changes.</div>'}`;
    mc.querySelectorAll('canvas[data-b]').forEach(c => { try { const v = c.dataset.b, b = v[0] === 'f' ? F[+v.slice(1)] : L[+v]; drawAva(c, lookWiz(Object.assign({}, b.look, { aura: b.aura }))); } catch (e) {} }); }
  window.renderFriends = renderFriends = render;
  setInterval(() => { try { const h = $('friends'); if (!h || !h.classList.contains('on')) return; const t = $('clT'); if (cache && cache.key.split(':')[0] !== String(slotNow())) return render(); if (t) t.textContent = left(); } catch (e) {} }, 1000);
  if (typeof nav === 'function') { const _n = nav; window.nav = nav = function (t) { const r = _n.apply(this, arguments); if (t === 'friends') { try { render(); } catch (e) {} } return r; }; }

  if (typeof newMatch === 'function') { const _nm = newMatch;
    window.newMatch = newMatch = function (o) { o = o || {}; const b = o.bountyObj || (o.bounty !== undefined ? board()[o.bounty] : null); if (!b) return _nm.apply(this, arguments);
      const lvs = (PR.hand || []).map(k => PR.spells[k].lvl), base = Math.round(lvs.reduce((a, c) => a + c, 0) / Math.max(1, lvs.length)), lv = clamp(base + LVL, 1, MAXL);
      const res = _nm.call(this, Object.assign({}, o, { name: b.n, look: Object.assign({}, b.look, { aura: b.aura }), mode: 'casual', lv: Object.fromEntries(Object.keys(SP).map(k => [k, lv])) }));
      try { M.bounty = b; M.bountyFav = !!o.bountyObj; M.rival = b; M.foe.pool = b.hand.filter(k => SP[k]); M.foe.up = new Set(b.ups); M.foeAcct = Math.max(1, PR.lvl + LVL);
        M.profile = Object.assign({}, M.profile, { n: 'Bounty', fav: Object.fromEntries(b.hand.map((k, j) => [k, j < 2 ? 12 : 8])) }); if (typeof synergyOf === 'function') M.foeSyn = synergyOf(M.foe.pool); } catch (e) {}
      return res; }; }
  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () { const r = _sr.apply(this, arguments);
      try { const b = M && M.bounty; if (b) { const md = $('rwMode'); if (md) md.textContent = 'Fight Club · vs ' + b.n;
          if (!M._clubDone) { M._clubDone = 1; M._club = null; const s = st(), won = M.score.me > M.score.foe, L = board(), live = L.some(q => q.id === b.id);
            if (M.bountyFav) { if (won) { PR.coins += FAVGOLD; M._club = [`Favourite beaten: +${FAVGOLD} gold`]; } }
            else if (won && live && !s.won.includes(b.id)) { s.won.push(b.id); let g = WIN; const msgs = [`Wager won: +${WIN} gems`]; const all = cls => L.filter(q => q.cls === cls).every(q => s.won.includes(q.id));
              if (!s.setW && all('wiz')) { s.setW = 1; g += SET_W; msgs.push(`All three wizards: +${SET_W} gems`); } if (!s.setS && all('sorc')) { s.setS = 1; g += SET_S; msgs.push(`All three sorcerers: +${SET_S} gems`); }
              if (!s.clear && L.every(q => s.won.includes(q.id))) { s.clear = 1; g += ALL; msgs.push(`Board cleared: +${ALL} gems`); } PR.gems = (PR.gems || 0) + g; M._club = msgs; }
            else if (won) M._club = [live ? 'Already beaten: no payout' : 'This bounty left the board before you won: stake lost'];
            else M._club = [`Wager lost: ${STAKE} gems`];
            try { save(); } catch (e) {} }
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
  .clsets{display:flex;gap:6px;margin-bottom:8px}.clsets span{flex:1;font:800 10.500px/1.25 Nunito;color:#d9cdfa;background:#0006;border:2px solid #000;border-radius:10px;padding:4px 6px;text-align:center}.clsets b{display:block;font:12px 'Lilita One';font-weight:400;color:#ffd45e}.clsets .ok{border-color:#7ee08a;color:#7ee08a}.clsets .ok b{color:#7ee08a}
  .clstar,.clx{all:unset;cursor:pointer;font-size:22px;color:#b9a6ee;padding:4px 8px}.clstar.on{color:#ffd45e;text-shadow:0 0 8px #ffd45e}.clx{font-size:15px;color:#ff8a96}
  #rwClub{margin:8px 0;background:linear-gradient(#3a1f1a,#241028);border:2px solid #ffd75e;border-radius:13px;padding:8px 11px;display:flex;flex-direction:column;gap:3px}#rwClub b{font:14px 'Lilita One';font-weight:400;color:#ffd75e}#rwClub span{font:800 12.500px Nunito;color:#f1eaff}`;
  document.head.appendChild(css);
  window.CLUB = { board, st };
})();
