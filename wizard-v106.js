/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.6
   1. Options: "Check for update" fetches the newest version and reloads onto it (web). The App Store
      app ships its files inside the app, so there it reports whether a newer version is out.
   2. Battle report: every round records what each side cast, what landed, the damage and the notable
      moments (shell broken, attack stopped, frozen...). The results screen opens it, split You / Rival.
   3. Training yard: the loadout icons on the home screen fill their cast ring in real time.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LIVE = 'https://maxpowerscomic-rgb.github.io/sorcerer-battle/';
  const isNative = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.app) || location.protocol === 'app:';
  const cmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 4; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };

  /* ---------------- 1. check for update ---------------- */
  window.checkUpdate = async function () { const b = $('updBtn'), say = t => { if (b) b.textContent = t; };
    say('Checking…');
    try { const base = isNative() || location.hostname === 'localhost' ? LIVE : new URL('.', location.href).href, r = await fetch(base + 'wizard-data.js?t=' + Date.now(), { cache: 'no-store' }), m = /GAME_VERSION = '([0-9.]+)'/.exec(await r.text()), live = m && m[1];
      if (!live) throw new Error('no version');
      const newer = cmp(live, GAME_VERSION) > 0;
      if (isNative()) { say('⟳ Check for update'); return toast(newer ? `Version ${live} is out. Update the app from the App Store to get it.` : `You are on the newest version (${GAME_VERSION}).`); }
      say(newer ? `Updating to ${live}…` : 'Refreshing…');
      // re-download every game file past the browser's cache, drop any offline caches, then restart
      const urls = [location.pathname].concat([...document.scripts].map(s => s.getAttribute('src')).filter(Boolean), ['audio/manifest.json']);
      await Promise.all(urls.map(u => fetch(u, { cache: 'reload' }).catch(() => null)));
      try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
      try { if (navigator.serviceWorker) for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.update(); } catch (e) {}
      try { save(); } catch (e) {}
      try { sessionStorage.setItem('sb.updated', newer ? live : 'same'); } catch (e) {}
      location.reload();
    } catch (e) { say('⟳ Check for update'); toast('Could not reach the update server. Check your connection and try again.'); } };
  try { const u = sessionStorage.getItem('sb.updated'); if (u) { sessionStorage.removeItem('sb.updated'); setTimeout(() => { try { toast(u === 'same' ? `Already on the newest version (${GAME_VERSION}). Files refreshed.` : `Updated to version ${GAME_VERSION}`); } catch (e) {} }, 2200); } } catch (e) {}
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML;
    window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = $('pause') && $('pause').classList.contains('on'); if (inMatch) return h;
      return h.replace(/<\/div>$/, `<button class="hbtn out" id="updBtn" style="width:100%;margin-top:6px" onclick="checkUpdate()">⟳ Check for update</button><div class="updv">Version ${GAME_VERSION}</div></div>`); }; }

  /* ---------------- 2. battle report ---------------- */
  const side = w => w && w.me ? 'me' : 'foe';
  let R = null;   // the round being recorded
  const blank = () => ({ ab: {}, ev: {}, dealt: 0, hp: 0, max: 0 });
  const row = (s, k) => (R[s].ab[k] = R[s].ab[k] || { c: 0, h: 0, d: 0, open: 0 });
  const live = () => R && typeof M !== 'undefined' && M && !M.practice && !ended;
  const ABN = () => (ABN.s = ABN.s || new Set(Object.keys(SP).map(k => String(SP[k].n).toUpperCase())));
  // labels that are noise in a report (announcements, counters that tick every frame)
  const SKIP = new Set(['TIME!', 'NEXT!', 'CHARGE I', 'CHARGED ', 'REFILL', 'BOUNDARY READY', 'ECHO', 'POP!', 'SPLAT!', 'CUT!', 'FLURRY!', 'MIRROR STANCE', 'MIRROR CAST', 'FISTS ALIGHT', 'FLYING CUTS', 'BLOOD LANCE', 'RED SURGE', 'SPIRIT TUNING', 'IGNORE THE PAIN', 'MUD WALL', 'FORTIFIED WALL', 'BLUE WALL', 'OPEN SANCTUM', 'CRIMSON TITAN', 'BLACK FROST', 'GRAND BISECTION', 'COLLAPSE', 'VIVISECTION', 'CRESCENT DRAG', 'QUICKSTEP', 'DRAW', 'REPEL', 'INEVITABLE', 'UNBROKEN EDGE', 'BRACED', 'CHARGED', 'RUSH!']);
  // what the label means for the fighter it appeared over
  const SAY = { 'CRIT!': 'Took a crit', 'SPLINTERING': 'Shell splintering', 'SHELL BROKEN': 'Titan Shell shattered', 'SHELL RELEASED': 'Left the Titan Shell', 'RIPPED OUT': 'Ripped out of the shell', 'STOPPED': 'Boundary stopped a hit', 'CAUGHT': 'Boundary caught a shot', 'BOUNDARY': 'Boundary opened', 'SENT BACK': 'Hit by a returned attack', 'COUNTER!': 'Countered a hit', 'DODGED': 'Dodged', 'MISS': 'Attack missed', 'PHASED': 'Phased through a hit', 'FROZEN': 'Frozen', 'ROOTED': 'Rooted', 'TRAPPED': 'Trapped', 'GROUNDED': 'Grounded', 'INTERRUPTED': 'Cast interrupted', 'BLOCKED': 'Blocked a hit', 'DEFLECTED': 'Deflected a shot', 'REFLECTED': 'Reflected a spell', 'REFLECT': 'Reflected a spell', 'SANCTUM BROKEN': 'Sanctum broken', 'SANCTUM CRUMBLES': 'Sanctum crumbled', 'SANCTUM CUT': 'Sanctum cut open', 'SANCTUM CLASH': 'Sanctum clash', 'CLASH!': 'Sanctum clash', 'CLASH WON': 'Won a Sanctum clash', 'BURNOUT': 'Sanctum burnt out', 'POISONED': 'Poisoned', 'BLOWN BACK': 'Blown back', 'SLAMMED': 'Slammed', 'LAUNCHED!': 'Launched', 'GRABBED': 'Grabbed', 'CRUSHED': 'Crushed', 'BACKSTAB!': 'Backstabbed', 'BACK HIT!': 'Hit from behind', 'BANISHED': 'Summon banished', 'DISORIENTED': 'Disoriented', 'SHATTERED': 'Shattered', 'MELTED': 'Wall melted', 'CRACKED': 'Cracked', 'NOT YET!': 'Refused to fall (Not Yet)', 'FINAL ATTEMPT': 'Final Attempt', 'RISES AGAIN': 'Rose again', 'SECOND BODY': 'Hopped to a second body', 'POLARITY SPENT': 'Polarity turn wasted', 'ALREADY SWAPPED': 'Double Take turn wasted', 'OUT OF REACH': 'Target out of reach', 'ANCHORED': 'Held in place', 'IMMUNE': 'Shrugged off an effect', 'UNBOUND': 'Broke free', 'CLEANSED': 'Cleansed', 'MENDED': 'Mended', 'BURNED': 'Set alight', 'BURNT': 'Set alight', 'REDIRECTED!': 'Attack redirected', 'SCATTERED!': 'Beam scattered', 'COPIED ': 'Copied an ability', 'MIRRORED ': 'Mirrored an ability', 'COMBO BROKEN': 'Combo broken', 'BACKLASH': 'Took Sanctum backlash', 'BLOODBURST': 'Bloodburst', 'DESTINED CRIT!': 'Destined crit', 'ABRUPT!': 'Stunned by a swap', 'SHRAPNEL!': 'Hit by shrapnel', 'RIFT DEEPENED': 'Rift deepened', 'ERASED': 'Hazard erased', 'SANCTUM RESTING': 'Sanctum turn wasted', 'SANCTUM SPENT': 'Sanctum turn wasted', 'HOURGLASS SPENT': 'Hourglass turn wasted' };
  const pretty = s => SAY[s] || (s.trim().charAt(0) + s.trim().slice(1).toLowerCase().replace(/!$/, ''));

  if (typeof startDuel === 'function') { const _su = startDuel;
    window.startDuel = startDuel = function () { const r = _su.apply(this, arguments);
      try { R = null; if (M && !M.practice && !(window.YARD && YARD.building)) { R = { n: M.round || 1, t0: T, me: blank(), foe: blank(), win: null }; ents.forEach(w => { R[side(w)].max = w.maxHp || w.hp; }); M.tx = M.tx || []; } } catch (e) { R = null; }
      return r; }; }
  if (typeof cast === 'function') { const _c = cast;
    window.cast = cast = function (w, k) { try { if (live() && w && SP[k]) { const q = row(side(w), k); q.c++; q.open = 1; } } catch (e) {} return _c.apply(this, arguments); }; }
  if (typeof damage === 'function') { const _d = damage;
    window.damage = damage = function (t, d) { const h0 = t ? t.hp : 0, src = SRC, r = _d.apply(this, arguments);
      try { if (live() && t && t.foe && h0 > t.hp) { const lost = h0 - t.hp, a = t.foe, own = src && t.book && t.book.includes(src) && !(a.book && a.book.includes(src));
          if (!own) { const s = side(a), k = src && SP[src] ? src : '?', q = row(s, k); q.d += lost; R[s].dealt += lost; if (q.open) { q.open = 0; q.h++; } else if (!q.c) q.h = 0; } } } catch (e) {}
      return r; }; }
  if (typeof text === 'function') { const _t = text;
    window.text = text = function (x, y, s) { try { if (live() && typeof s === 'string' && /^[A-Z][A-Z !']+$/.test(s) && !SKIP.has(s) && !ABN().has(s.trim())) { let best = null, bd = 1e9; if (s === 'CAUGHT' || s === 'STOPPED' || s === 'BOUNDARY') { best = ents.find(w => w.bndWin > 0) || null; if (best) bd = 0; } if (!best) for (const w of ents) { const d = Math.hypot(w.x - x, w.y - y); if (d < bd) { bd = d; best = w; } } if (best && bd < 190) { const ev = R[side(best)].ev; ev[s] = (ev[s] || 0) + 1; } } } catch (e) {} return _t.apply(this, arguments); }; }
  if (typeof endRound === 'function') { const _e = endRound;
    window.endRound = endRound = function (winner) { try { if (live()) { R.win = winner || null; R.t = Math.max(0, T - R.t0); ents.forEach(w => { R[side(w)].hp = Math.max(0, Math.round(w.hp)); }); M.tx.push(R); R = null; } } catch (e) {} return _e.apply(this, arguments); }; }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function colHTML(S, who) { const ks = Object.keys(S.ab).sort((a, b) => S.ab[b].d - S.ab[a].d || S.ab[b].c - S.ab[a].c);
    const rows = ks.map(k => { const q = S.ab[k], nm = SP[k] ? SP[k].n : 'Other', ic = SP[k] && typeof ICON !== 'undefined' && ICON[k] ? `<img src="${ICON[k]}">` : '<i></i>', d = Math.round(q.d);
      const line = q.c ? (d > 0 ? `${Math.min(q.h, q.c)} of ${q.c} landed · <b>${d}</b> dmg` : `${q.c} cast${q.c > 1 ? 's' : ''}${typeof TYPE_OF !== 'undefined' && ['proj', 'melee'].includes(TYPE_OF[k]) ? ' · none landed' : ''}`) : `<b>${d}</b> dmg from earlier casts`;
      return `<div class="txr">${ic}<span><em>${esc(nm)}</em><small>${line}</small></span></div>`; }).join('');
    const ev = Object.keys(S.ev).sort((a, b) => S.ev[b] - S.ev[a]).slice(0, 6).map(s => `<span>${esc(pretty(s))}${S.ev[s] > 1 ? ' ×' + S.ev[s] : ''}</span>`).join('');
    return `<div class="txc ${who}"><div class="txh"><b>${who === 'me' ? 'You' : 'Rival'}</b><small>${Math.round(S.dealt)} dealt · ${S.hp} / ${Math.round(S.max)} left</small></div>${rows || '<div class="txn">Nothing cast</div>'}${ev ? `<div class="txe">${ev}</div>` : ''}</div>`; }
  function totals(tx, s) { const ab = {}; let dealt = 0; for (const r of tx) { dealt += r[s].dealt; for (const k in r[s].ab) { const q = r[s].ab[k], a = (ab[k] = ab[k] || { c: 0, h: 0, d: 0 }); a.c += q.c; a.h += Math.min(q.h, q.c || q.h); a.d += q.d; } }
    const top = Object.keys(ab).filter(k => SP[k]).sort((a, b) => ab[b].d - ab[a].d).slice(0, 3).filter(k => ab[k].d >= 1).map(k => `${ab[k].c ? Math.min(ab[k].h, ab[k].c) + ' of ' + ab[k].c + ' ' : ''}${esc(SP[k].n)} for ${Math.round(ab[k].d)}`);
    return { dealt: Math.round(dealt), line: top.length ? top.join(', ') : 'no damage dealt' }; }
  window.openReport = function () { const tx = (typeof M !== 'undefined' && M && M.tx) || [];
    if (!tx.length) return toast('No rounds were recorded for this match');
    const me = totals(tx, 'me'), fo = totals(tx, 'foe');
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Battle report</div>
      <div class="txsum"><p><b class="me">You</b> dealt ${me.dealt}: landed ${me.line}.</p><p><b class="foe">${esc(M.foeName || 'Rival')}</b> dealt ${fo.dealt}: landed ${fo.line}.</p></div>
      <div class="txlist">${tx.map(r => `<div class="txrd"><div class="txt ${r.win || 'draw'}"><b>Round ${r.n}</b><span>${r.win === 'me' ? 'You won' : r.win === 'foe' ? 'Rival won' : 'Draw'} · ${Math.round(r.t || 0)}s</span></div><div class="txs">${colHTML(r.me, 'me')}${colHTML(r.foe, 'foe')}</div></div>`).join('')}</div>`;
    $('sheet').classList.add('on'); };
  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () { const r = _sr.apply(this, arguments);
      try { let b = $('rwRep'); const has = M && M.tx && M.tx.length; if (!b && $('rwBtn')) { $('rwBtn').insertAdjacentHTML('beforebegin', `<button class="hbtn out" id="rwRep" onclick="openReport()">📜 Battle report</button>`); b = $('rwRep'); } if (b) b.style.display = has ? '' : 'none'; } catch (e) {}
      return r; }; }

  /* ---------------- 3. cast rings on the home loadout while the yard runs ---------------- */
  function rings() { try { const lo = $('loadout'); if (!lo) return; const on = window.YARD && YARD.on && typeof ents !== 'undefined' && ents && ents[0] && ents[0].book, me = on && ents[0], els = lo.children;
      for (let i = 0; i < els.length; i++) { const now = !!me && i === me.i && !me.dead; els[i].classList.toggle('now', now); if (now) els[i].style.setProperty('--p', Math.max(0, Math.min(1, me.p / (castT(me, me.book[me.i]) || 1))).toFixed(3)); else if (els[i].style.getPropertyValue('--p')) els[i].style.removeProperty('--p'); } } catch (e) {}
    requestAnimationFrame(rings); }
  requestAnimationFrame(rings);

  /* ---------------- 4. ability icons are earned: win 3 matches with the ability (its first Wins trial step) ---------------- */
  const ICON_WINS = 3, winsOf = k => (PR.trial && PR.trial[k] && PR.trial[k].wins) || 0;
  if (typeof iconItems === 'function') { const _ii = iconItems; window.iconItems = iconItems = function () { return _ii.apply(this, arguments).map(it => it.id.slice(0, 6) === 'spell:' ? Object.assign({}, it, { unlock: { type: 'trialwins', k: it.id.slice(6), v: ICON_WINS } }) : it); }; }
  if (typeof owns === 'function') { const _ow = owns; window.owns = owns = function (cat, it) { const u = (it && it.unlock) || {}; if (u.type === 'trialwins') return winsOf(u.k) >= u.v; return _ow.apply(this, arguments); }; }
  if (typeof unlockText === 'function') { const _ut = unlockText; window.unlockText = unlockText = function (u) { if (u && u.type === 'trialwins') return `Win ${u.v} matches with it (${Math.min(winsOf(u.k), u.v)}/${u.v})`; return _ut.apply(this, arguments); }; }
  if (typeof pickItem === 'function') { const _pi = pickItem; window.pickItem = pickItem = function (i) { try { const it = catItems(wCat)[i]; if (it && it.unlock && it.unlock.type === 'trialwins' && !ownsItem(wCat, it)) return toast(`Win ${it.unlock.v} matches with ${it.n} in your hand to earn its icon (${winsOf(it.unlock.k)}/${it.unlock.v})`); } catch (e) {} return _pi.apply(this, arguments); }; }
  try { if (PR.icon && PR.icon.slice(0, 6) === 'spell:' && winsOf(PR.icon.slice(6)) < ICON_WINS) { PR.icon = 'wizard'; save(); } } catch (e) {}

  /* ---------------- 5. a new unlock can go straight into the Battle Hand (1.0.6.1) ---------------- */
  const hbox = () => { let b = $('upHandBox'); if (!b && $('upOk')) { $('upOk').insertAdjacentHTML('afterend', '<div id="upHandBox"></div>'); b = $('upHandBox'); } return b; };
  const hdone = msg => { try { save(); sfx('ui_deal'); } catch (e) {} try { refreshMeta(); } catch (e) {} const b = hbox(); if (b) b.innerHTML = ''; $('upm').classList.remove('on'); toast(msg); nextModal(); };
  window.upToHand = function (k) { PR.hand = PR.hand || []; if (PR.hand.includes(k)) return hdone(SP[k].n + ' is already in your hand');
    if (PR.hand.length < 4) { PR.hand.push(k); return hdone(SP[k].n + ' added to your hand'); }
    hbox().innerHTML = `<div class="uphl">Swap ${esc(SP[k].n)} in for:</div><div class="uphs">${PR.hand.map((h, i) => `<button onclick="upSwap(${i},'${k}')"><img src="${ICON[h]}"><small>${esc(SP[h].n)}</small></button>`).join('')}</div><button class="uphx" onclick="upHandBtn('${k}')">Keep my hand</button>`; };
  window.upSwap = function (i, k) { const old = PR.hand[i]; PR.hand[i] = k; hdone(`${SP[k].n} replaced ${SP[old] ? SP[old].n : 'it'}`); };
  window.upHandBtn = function (k) { const b = hbox(); if (b) b.innerHTML = k && !window.ONB_ACTIVE ? `<button class="btn uphb" onclick="upToHand('${k}')">Add to my hand</button>` : ''; };
  if (typeof showSpellModal === 'function') { const _sm = showSpellModal; window.showSpellModal = showSpellModal = function (k, from, to, unlockRankName) { const r = _sm.apply(this, arguments); try { upHandBtn(unlockRankName && SP[k] ? k : null); } catch (e) {} return r; }; }
  if (typeof window.showTokenModal === 'function' || typeof showTokenModal === 'function') { try { const _tm = showTokenModal; window.showTokenModal = showTokenModal = function () { try { upHandBtn(null); } catch (e) {} return _tm.apply(this, arguments); }; } catch (e) {} }

  const css = document.createElement('style');
  css.textContent = `.updv{text-align:center;font:800 11px Nunito;color:#8f80b8;margin-top:5px}
  .lo::before{content:"";position:absolute;inset:-5px;border-radius:50%;background:conic-gradient(#ffd45e calc(var(--p,0)*360deg),#ffffff22 0);-webkit-mask:radial-gradient(farthest-side,#0000 calc(100% - 4.5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,#0000 calc(100% - 4.5px),#000 calc(100% - 4px));opacity:0;transition:opacity .15s}
  .lo.now::before{opacity:1}.lo.now{transform:translateY(-3px) scale(1.08)}.lo.now img{filter:drop-shadow(0 0 6px #ffd45eaa)}
  #rwRep{width:100%;margin:0 0 8px}
  #upHandBox{width:100%;margin-top:8px}#upHandBox:empty{display:none}.uphb{width:100%;background:linear-gradient(#8a6bff,#5b3bd1)!important;color:#fff!important}.uphl{font:13px 'Lilita One';color:#e6defc;margin-bottom:6px}.uphs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.uphs button{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px;border-radius:12px;background:#0007;border:2px solid #ffd45e}.uphs img{width:40px;height:40px}.uphs small{font:800 9.5px/1.1 Nunito;color:#e6defc;text-align:center}.uphx{all:unset;cursor:pointer;display:block;margin:8px auto 0;font:800 12px Nunito;color:#b9a6ee;text-decoration:underline}
  .txsum{background:#0007;border:2px solid #000;border-radius:13px;padding:8px 11px;margin-bottom:10px}.txsum p{margin:2px 0;font:800 12.5px/1.35 Nunito;color:#e6defc}.txsum b{font:13px 'Lilita One';font-weight:400}.txsum .me,.txc.me .txh b{color:#7ee0a0}.txsum .foe,.txc.foe .txh b{color:#ff8a96}
  .txlist{display:flex;flex-direction:column;gap:10px;max-height:56vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .txrd{border:2px solid #000;border-radius:14px;overflow:hidden;background:#0006;flex:none}.txt{display:flex;justify-content:space-between;align-items:center;padding:5px 10px;background:#2b2050}.txt b{font:14px 'Lilita One';font-weight:400}.txt span{font:800 11.5px Nunito;color:#d9cdfa}.txt.me{background:linear-gradient(90deg,#1f5a3a,#2b2050)}.txt.foe{background:linear-gradient(90deg,#2b2050,#6a1f2c)}
  .txs{display:grid;grid-template-columns:1fr 1fr}.txc{padding:7px 8px;min-width:0}.txc.me{border-right:2px solid #000}
  .txh{display:flex;flex-direction:column;margin-bottom:5px}.txh b{font:13px 'Lilita One';font-weight:400}.txh small{font:800 10.5px Nunito;color:#b9a6ee}
  .txr{display:flex;align-items:center;gap:6px;margin:4px 0}.txr img,.txr i{width:26px;height:26px;flex:none}.txr span{display:flex;flex-direction:column;min-width:0}.txr em{font:12px 'Lilita One';font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.txr small{font:800 10.5px/1.25 Nunito;color:#cfc3f2}.txr small b{color:#ffd45e}
  .txn{font:800 11px Nunito;color:#8f80b8}.txe{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.txe span{font:800 10px Nunito;color:#dfe8ff;background:#3a4a8a88;border:1.5px solid #000;border-radius:7px;padding:1px 5px}`;
  document.head.appendChild(css);
  window.V106 = { get R() { return R; }, pretty };
})();
