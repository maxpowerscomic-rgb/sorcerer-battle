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
  const blank = () => ({ ab: {}, ev: {}, abs: {}, dealt: 0, hp: 0, max: 0 });
  const clockOf = () => { const s = Math.max(0, Math.floor(T - R.t0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const note = (s, k, txt) => { if (R.log.length < 400) R.log.push({ t: clockOf(), s, k, txt, d: 0 }); return R.log[R.log.length - 1]; };
  const row = (s, k) => (R[s].ab[k] = R[s].ab[k] || { c: 0, h: 0, d: 0, open: 0 });
  const live = () => R && typeof M !== 'undefined' && M && !M.practice && !ended;
  const ABN = () => (ABN.s = ABN.s || new Set(Object.keys(SP).map(k => String(SP[k].n).toUpperCase())));
  // labels that are noise in a report (announcements, counters that tick every frame)
  const SKIP = new Set(['TIME!', 'NEXT!', 'CHARGE I', 'CHARGED ', 'REFILL', 'BOUNDARY READY', 'ECHO', 'POP!', 'SPLAT!', 'CUT!', 'FLURRY!', 'MIRROR STANCE', 'MIRROR CAST', 'FISTS ALIGHT', 'FLYING CUTS', 'BLOOD LANCE', 'RED SURGE', 'SPIRIT TUNING', 'IGNORE THE PAIN', 'MUD WALL', 'FORTIFIED WALL', 'BLUE WALL', 'OPEN SANCTUM', 'CRIMSON TITAN', 'BLACK FROST', 'GRAND BISECTION', 'COLLAPSE', 'VIVISECTION', 'CRESCENT DRAG', 'QUICKSTEP', 'DRAW', 'REPEL', 'INEVITABLE', 'UNBROKEN EDGE', 'BRACED', 'CHARGED', 'RUSH!']);
  // what the label means for the fighter it appeared over
  const SAY = { 'LASTBLOCK': 'Blocked at the last second', 'ABSORBED': 'Shield absorbed a shot', 'CRIT!': 'Took a crit', 'SPLINTERING': 'Shell splintering', 'SHELL BROKEN': 'Titan Shell shattered', 'SHELL RELEASED': 'Left the Titan Shell', 'RIPPED OUT': 'Ripped out of the shell', 'STOPPED': 'Boundary stopped a hit', 'CAUGHT': 'Boundary caught a shot', 'BOUNDARY': 'Boundary opened', 'SENT BACK': 'Hit by a returned attack', 'COUNTER!': 'Countered a hit', 'DODGED': 'Dodged', 'MISS': 'Attack missed', 'PHASED': 'Phased through a hit', 'FROZEN': 'Frozen', 'ROOTED': 'Rooted', 'TRAPPED': 'Trapped', 'GROUNDED': 'Grounded', 'INTERRUPTED': 'Cast interrupted', 'BLOCKED': 'Blocked a hit', 'DEFLECTED': 'Deflected a shot', 'REFLECTED': 'Reflected a spell', 'REFLECT': 'Reflected a spell', 'SANCTUM BROKEN': 'Sanctum broken', 'SANCTUM CRUMBLES': 'Sanctum crumbled', 'SANCTUM CUT': 'Sanctum cut open', 'SANCTUM CLASH': 'Sanctum clash', 'CLASH!': 'Sanctum clash', 'CLASH WON': 'Won a Sanctum clash', 'BURNOUT': 'Sanctum burnt out', 'POISONED': 'Poisoned', 'BLOWN BACK': 'Blown back', 'SLAMMED': 'Slammed', 'LAUNCHED!': 'Launched', 'GRABBED': 'Grabbed', 'CRUSHED': 'Crushed', 'BACKSTAB!': 'Backstabbed', 'BACK HIT!': 'Hit from behind', 'BANISHED': 'Summon banished', 'DISORIENTED': 'Disoriented', 'SHATTERED': 'Shattered', 'MELTED': 'Wall melted', 'CRACKED': 'Cracked', 'NOT YET!': 'Refused to fall (Not Yet)', 'FINAL ATTEMPT': 'Final Attempt', 'RISES AGAIN': 'Rose again', 'SECOND BODY': 'Hopped to a second body', 'POLARITY SPENT': 'Polarity turn wasted', 'ALREADY SWAPPED': 'Double Take turn wasted', 'OUT OF REACH': 'Target out of reach', 'ANCHORED': 'Held in place', 'IMMUNE': 'Shrugged off an effect', 'UNBOUND': 'Broke free', 'CLEANSED': 'Cleansed', 'MENDED': 'Mended', 'BURNED': 'Set alight', 'BURNT': 'Set alight', 'REDIRECTED!': 'Attack redirected', 'SCATTERED!': 'Beam scattered', 'COPIED ': 'Copied an ability', 'MIRRORED ': 'Mirrored an ability', 'COMBO BROKEN': 'Combo broken', 'BACKLASH': 'Took Sanctum backlash', 'BLOODBURST': 'Bloodburst', 'DESTINED CRIT!': 'Destined crit', 'ABRUPT!': 'Stunned by a swap', 'SHRAPNEL!': 'Hit by shrapnel', 'RIFT DEEPENED': 'Rift deepened', 'ERASED': 'Hazard erased', 'SANCTUM RESTING': 'Sanctum turn wasted', 'SANCTUM SPENT': 'Sanctum turn wasted', 'HOURGLASS SPENT': 'Hourglass turn wasted' };
  const pretty = s => SAY[s] || (s.trim().charAt(0) + s.trim().slice(1).toLowerCase().replace(/!$/, ''));

  if (typeof startDuel === 'function') { const _su = startDuel;
    window.startDuel = startDuel = function () { const r = _su.apply(this, arguments);
      try { R = null; if (M && !M.practice && !(window.YARD && YARD.building)) { R = { n: M.round || 1, t0: T, me: blank(), foe: blank(), win: null, log: [], seen: new Map() }; ents.forEach(w => { R[side(w)].max = w.maxHp || w.hp; }); M.tx = M.tx || []; } } catch (e) { R = null; }
      return r; }; }
  if (typeof cast === 'function') { const _c = cast;
    window.cast = cast = function (w, k) { try { if (live() && w && SP[k]) { const q = row(side(w), k); q.c++; q.open = 1; q.last = note(side(w), k, 'cast'); } } catch (e) {} return _c.apply(this, arguments); }; }
  if (typeof damage === 'function') { const _d = damage;
    window.damage = damage = function (t, d) { const h0 = t ? t.hp : 0, src = SRC, r = _d.apply(this, arguments);
      try { if (live() && t && t.foe && h0 > t.hp) { const lost = h0 - t.hp, a = t.foe, own = src && t.book && t.book.includes(src) && !(a.book && a.book.includes(src));
          if (!own) { const s = side(a), k = src && SP[src] ? src : '?', q = row(s, k); q.d += lost; R[s].dealt += lost; if (q.last) q.last.d += lost; if (q.open) { q.open = 0; q.h++; } else if (!q.c) q.h = 0; } } } catch (e) {}
      return r; }; }
  if (typeof text === 'function') { const _t = text;
    window.text = text = function (x, y, s) { try { if (live() && typeof s === 'string' && /^[A-Z][A-Z !']+$/.test(s) && !SKIP.has(s) && !ABN().has(s.trim())) { let best = null, bd = 1e9; if (s === 'CAUGHT' || s === 'STOPPED' || s === 'BOUNDARY') { best = ents.find(w => w.bndWin > 0) || null; if (best) bd = 0; } if (!best) for (const w of ents) { const d = Math.hypot(w.x - x, w.y - y); if (d < bd) { bd = d; best = w; } } if (best && bd < 190) { const ev = R[side(best)].ev; ev[s] = (ev[s] || 0) + 1; note(side(best), null, pretty(s)); } } } catch (e) {} return _t.apply(this, arguments); }; }
  if (typeof endRound === 'function') { const _e = endRound;
    window.endRound = endRound = function (winner) { try { if (live()) { R.win = winner || null; R.t = Math.max(0, T - R.t0); R.seen = null; ents.forEach(w => { R[side(w)].hp = Math.max(0, Math.round(w.hp)); }); M.tx.push(R); R = null; } } catch (e) {} return _e.apply(this, arguments); }; }

  // what walls and shells soaked up: watch their health each frame and credit the drop to the ability that made them.
  // A wall that simply runs out drops all at once, so a drop to zero only counts up to one hit's worth.
  if (typeof update === 'function') { const _u = update;
    window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (live()) { const seen = R.seen, soak = (obj, hp, max, s, k, near) => { const was = seen.get(obj); seen.set(obj, hp); if (was === undefined || hp >= was) return; let d = was - hp; if (d < 1) return; if (hp <= 0 && d > 30) return;   /* it ran out or was torn down, nothing was soaked */ const a = R[s].abs; a[k] = (a[k] || 0) + d;
              if (near) { const ev = R[s].ev; ev.LASTBLOCK = (ev.LASTBLOCK || 0) + 1; note(s, k, 'blocked a hit at the last second'); } };
          if (typeof walls !== 'undefined') for (const wl of walls) { if (!wl.o || wl.hp === undefined) continue; const o = wl.o, near = (wl.cr || []).some(c => !c.gone && Math.hypot(c.x - o.x, c.y - o.y) < 42); soak(wl, Math.max(0, wl.hp), wl.max, side(o), wl.mud ? 'earthm' : 'icewall', near); }
          for (const w of ents) if (w.shell && w.shell.hp !== undefined) soak(w.shell, Math.max(0, w.shell.hp), w.shell.max, side(w), 'titan', false); } } catch (e) {}
      return r; }; }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function colHTML(S, who) { S.abs = S.abs || {}; for (const k in S.abs) if (!S.ab[k] && SP[k]) S.ab[k] = { c: 0, h: 0, d: 0 }; const ks = Object.keys(S.ab).sort((a, b) => S.ab[b].d - S.ab[a].d || S.ab[b].c - S.ab[a].c);
    const rows = ks.map(k => { const q = S.ab[k], nm = SP[k] ? SP[k].n : 'Other', ic = SP[k] && typeof ICON !== 'undefined' && ICON[k] ? `<img src="${ICON[k]}">` : '<i></i>', d = Math.round(q.d);
      const line = q.c ? (d > 0 ? `${Math.min(q.h, q.c)} of ${q.c} landed · <b>${d}</b> dmg` : `${q.c} cast${q.c > 1 ? 's' : ''}${typeof TYPE_OF !== 'undefined' && ['proj', 'melee'].includes(TYPE_OF[k]) ? ' · none landed' : ''}`) : `<b>${d}</b> dmg from earlier casts`;
      const ab = Math.round(S.abs[k] || 0), soak = ab > 0 ? ` · absorbed <b class="ab">${ab}</b>` : '';
      return `<div class="txr">${ic}<span><em>${esc(nm)}</em><small>${q.c || d > 0 ? line : 'still standing from an earlier cast'}${soak}</small></span></div>`; }).join('');
    const ev = Object.keys(S.ev).sort((a, b) => S.ev[b] - S.ev[a]).slice(0, 6).map(s => `<span>${esc(pretty(s))}${S.ev[s] > 1 ? ' ×' + S.ev[s] : ''}</span>`).join('');
    return `<div class="txc ${who}"><div class="txh"><b>${who === 'me' ? 'You' : 'Rival'}</b><small>${Math.round(S.dealt)} dealt · ${S.hp} / ${Math.round(S.max)} left</small></div>${rows || '<div class="txn">Nothing cast</div>'}${ev ? `<div class="txe">${ev}</div>` : ''}</div>`; }
  // two or three plain sentences per side: total damage, where it came from, what was soaked up
  function totals(tx, s, who) { const ab = {}, abs = {}; let dealt = 0, casts = 0; for (const r of tx) { dealt += r[s].dealt; for (const k in r[s].ab) { const q = r[s].ab[k], a = (ab[k] = ab[k] || { c: 0, h: 0, d: 0 }); a.c += q.c; a.h += Math.min(q.h, q.c || q.h); a.d += q.d; casts += q.c; } for (const k in (r[s].abs || {})) abs[k] = (abs[k] || 0) + r[s].abs[k]; }
    const top = Object.keys(ab).filter(k => SP[k] && ab[k].d >= 1).sort((a, b) => ab[b].d - ab[a].d).slice(0, 2), You = who === 'me' ? 'You' : 'They', your = who === 'me' ? 'Your' : 'Their';
    const out = [`${You} dealt <b>${Math.round(dealt)} damage</b> from ${casts} casts.`];
    if (top.length) out.push('Most of it came from ' + top.map(k => `${esc(SP[k].n)} (${Math.round(ab[k].d)} damage${ab[k].c ? ', ' + Math.min(ab[k].h, ab[k].c) + ' of ' + ab[k].c + ' casts landed' : ''})`).join(' and ') + '.');
    const ak = Object.keys(abs).filter(k => SP[k] && abs[k] >= 1).sort((a, b) => abs[b] - abs[a]);
    if (ak.length) out.push(`${your} ${ak.map(k => `${esc(SP[k].n)} absorbed ${Math.round(abs[k])}`).join(' and ')}.`);
    return out.join(' '); }
  function timelineText() { const tx = (M && M.tx) || [], L = [`Wizards vs Sorcerers ${GAME_VERSION} · ${PR.name || 'You'} vs ${M.foeName || 'Rival'} · ${M.score.me}-${M.score.foe}`];
    for (const r of tx) { L.push('', `ROUND ${r.n} (${r.win === 'me' ? 'you won' : r.win === 'foe' ? 'rival won' : 'draw'}, ${Math.round(r.t || 0)}s)`);
      for (const e of (r.log || [])) L.push(`${e.t}  ${e.s === 'me' ? 'YOU  ' : 'RIVAL'}  ${e.k && SP[e.k] ? SP[e.k].n + (e.txt === 'cast' ? (e.d >= 1 ? ': ' + Math.round(e.d) + ' damage' : (typeof TYPE_OF !== 'undefined' && ['proj', 'melee'].includes(TYPE_OF[e.k]) ? ': no damage' : '')) : ' ' + e.txt) : e.txt}`); }
    return L.join('\n'); }
  window.reportTimeline = function () { const box = $('txTl'); if (!box) return; if (box.style.display !== 'none') { box.style.display = 'none'; return; } box.textContent = timelineText(); box.style.display = 'block'; };
  window.reportCopy = async function () { const t = timelineText(); try { await navigator.clipboard.writeText(t); toast('Match log copied'); } catch (e) { const box = $('txTl'); if (box) { box.textContent = t; box.style.display = 'block'; } toast('Select the log below to copy it'); } };
  window.openReport = function () { const tx = (typeof M !== 'undefined' && M && M.tx) || [];
    if (!tx.length) return toast('No rounds were recorded for this match');
    const me = totals(tx, 'me', 'me'), fo = totals(tx, 'foe', 'foe');
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Battle report</div>
      <div class="txsum"><p><b class="me">You</b>${me}</p><p><b class="foe">${esc(M.foeName || 'Rival')}</b>${fo}</p></div>
      <div class="txbtns"><button class="hbtn out" onclick="reportTimeline()">⏱ Timeline</button><button class="hbtn out" onclick="reportCopy()">⧉ Copy match log</button></div><pre id="txTl" class="crlog" style="display:none"></pre>
      <div class="txlist">${tx.map(r => `<div class="txrd"><div class="txhd ${r.win || 'draw'}"><b>Round ${r.n}</b><span>${r.win === 'me' ? 'You won' : r.win === 'foe' ? 'Rival won' : 'Draw'} · ${Math.round(r.t || 0)}s</span></div><div class="txs">${colHTML(r.me, 'me')}${colHTML(r.foe, 'foe')}</div></div>`).join('')}</div>`;
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
  .txsum{background:#0007;border:2px solid #000;border-radius:13px;padding:8px 11px;margin-bottom:10px}.txsum p{margin:2px 0;font:800 12.5px/1.35 Nunito;color:#e6defc}.txsum p>b:first-child{font:13px 'Lilita One';font-weight:400;display:block}.txsum p b{color:#ffd45e}.txsum p+p{margin-top:7px}.txbtns{display:flex;gap:6px;margin-bottom:8px}.txbtns button{flex:1}.txr small b.ab{color:#9fd8ff}.txsum .me,.txc.me .txh b{color:#7ee0a0}.txsum .foe,.txc.foe .txh b{color:#ff8a96}
  .txlist{display:flex;flex-direction:column;gap:10px;max-height:56vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .txrd{border:2px solid #000;border-radius:14px;overflow:hidden;background:#0006;flex:none}.txhd{display:flex;justify-content:space-between;align-items:center;padding:5px 10px;background:#2b2050}.txhd b{font:14px 'Lilita One';font-weight:400}.txhd span{font:800 11.5px Nunito;color:#d9cdfa}.txhd.me{background:linear-gradient(90deg,#1f5a3a,#2b2050)}.txhd.foe{background:linear-gradient(90deg,#2b2050,#6a1f2c)}
  .txs{display:grid;grid-template-columns:1fr 1fr}.txc{padding:7px 8px;min-width:0}.txc.me{border-right:2px solid #000}
  .txh{display:flex;flex-direction:column;margin-bottom:5px}.txh b{font:13px 'Lilita One';font-weight:400}.txh small{font:800 10.5px Nunito;color:#b9a6ee}
  .txr{display:flex;align-items:center;gap:6px;margin:4px 0}.txr img,.txr i{width:26px;height:26px;flex:none}.txr span{display:flex;flex-direction:column;min-width:0}.txr em{font:12px 'Lilita One';font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.txr small{font:800 10.5px/1.25 Nunito;color:#cfc3f2}.txr small b{color:#ffd45e}
  .txn{font:800 11px Nunito;color:#8f80b8}.txe{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.txe span{font:800 10px Nunito;color:#dfe8ff;background:#3a4a8a88;border:1.5px solid #000;border-radius:7px;padding:1px 5px}`;
  document.head.appendChild(css);
  window.V106 = { get R() { return R; }, pretty };
})();
