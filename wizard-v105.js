/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.5 systems
   Loaded after wizard-cosmetics.js.
   - Trade tokens for skill points (both schools), gold or gems.
   - Pause an ability for a round from the order screen.
   - Crash log: every error is kept on the device; the player can send it by email.
   - How much your fighter talks (Options).
   - Tooltips for things on the floor (thorns, pits, mud, springs, domes).
   - Phones held sideways see a turn-your-phone screen.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- tokens: skill points, gold or gems ---------------- */
  const PTS = 5, GOLD = 150, GEMS = 5;   /* 5 gems buy about 165 gold in the shop, so gold sits just under that: neither choice is a trap */
  window.ECON = Object.assign(window.ECON || {}, { tokenPts: PTS, tokenGold: GOLD, tokenGems: GEMS });
  const KIND = { tokens: { n: 'Spell Token', sc: 'wiz', what: 'spell' }, tokS: { n: 'Technique Token', sc: 'sorc', what: 'technique' } };
  window.tradeToken = function (kind, what, k) {
    const K = KIND[kind]; if (!K || !(PR[kind] > 0)) return;
    if (what === 'gold') { PR[kind]--; PR.coins = (PR.coins || 0) + GOLD; toast(`+${GOLD} gold`); }
    else if (what === 'gems') { PR[kind]--; PR.gems = (PR.gems || 0) + GEMS; toast(`+${GEMS} gems`); }
    else if (what === 'pts') { if (!k) return openTokenPts(kind); if (!PR.spells[k]) return; PR[kind]--; PR.spells[k].cards += PTS; toast(`+${PTS} skill points to ${SP[k].n}`); closeSheet(); }
    try { save(); sfx('ui_coin'); } catch (e) {} refreshMeta(); try { renderShop(); } catch (e) {}
  };
  function openTokenPts(kind) { const K = KIND[kind], own = Object.keys(SP).filter(k => SCHOOL_OF(k) === K.sc && isUnl(k) && PR.spells[k]);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Spend a ${K.n}</div><div class="ssub" style="margin:0">One token becomes ${PTS} skill points for the ${K.what} you pick. You have ${PR[kind] || 0}.</div>
      ${own.length ? `<div class="cvgrid">${own.map(k => `<button class="cvb" onclick="tradeToken('${kind}','pts','${k}')"><img src="${ICON[k]}"><span>${SP[k].n}</span><small>Lv ${PR.spells[k].lvl} · +${PTS}</small></button>`).join('')}</div>` : `<div class="ssub">Unlock a ${K.what} first.</div>`}`;
    $('sheet').classList.add('on'); }
  if (typeof renderShop === 'function') { const _rs = renderShop;
    window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments);
      try { const el = $('tokConv'); if (el) el.innerHTML = `<div class="tktrade"><b>Trade spare tokens</b><small>A token still unlocks any ability. Spare ones can become skill points, gold or gems.</small>${Object.keys(KIND).map(kind => { const K = KIND[kind], n = PR[kind] || 0, off = n > 0 ? '' : 'disabled';
          return `<div class="tkrow"><img src="${tokenImg(K.sc === 'sorc' ? 'sorc' : undefined)}"><span><b>${K.n}s</b><small>You have ${n}. Exchange each for ${PTS} ${K.what} points, ${GOLD} gold or ${GEMS} gems.</small></span><button ${off} onclick="tradeToken('${kind}','pts')" aria-label="${PTS} ${K.what} points">${window.ptIcon ? ptIcon(K.sc) : ''}${PTS}</button><button ${off} onclick="tradeToken('${kind}','gold')"><i class="ci coin-i"></i>${GOLD}</button><button ${off} class="gm" onclick="tradeToken('${kind}','gems')"><i class="ci">${SVG.gem}</i>${GEMS}</button></div>`; }).join('')}</div>`; } catch (e) {}
      return r; }; }

  /* ---------------- pause an ability for a round ---------------- */
  const pz = () => (M.pz = M.pz || []);
  window.togglePause = function (i) { const p = pz(), b = M.me.book; if (!p[i] && b.filter((k, j) => !p[j]).length <= 1) return toast('At least one ability has to stay active.'); p[i] = !p[i]; try { sfx('ui_pick'); } catch (e) {} renderBook(); };
  if (typeof renderBook === 'function') { const _rb = renderBook;
    window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments);
      try { const b = M.me.book, p = pz(); if (p.length > b.length) p.length = b.length;
        const sel = M.swapSel ?? (M.lastAdded >= 0 ? M.lastAdded : 0), ring = $('ring');
        ring.querySelectorAll('.tile[data-i]').forEach(t => { const i = +t.dataset.i; t.classList.toggle('pz', !!p[i]); if (p[i]) t.insertAdjacentHTML('beforeend', '<span class="pzm">⏸</span>');
          const swap = (a, c) => { [b[a], b[c]] = [b[c], b[a]]; [p[a], p[c]] = [p[c], p[a]]; };
          // (1.0.11.2) a tap only selects. Order changes go through the Move button, so looking at two abilities in a row never swaps them.
          t.classList.toggle('mvto', !!M.moveArm && i !== sel);
          t.onclick = () => { if (window.ONB_ACTIVE) { if (M.swapSel === null) M.swapSel = i; else { if (M.swapSel !== i) swap(M.swapSel, i); M.swapSel = null; } }
            else if (M.moveArm && sel !== i) { swap(sel, i); M.moveArm = 0; M.swapSel = i; try { sfx('ui_deal'); } catch (e) {} }
            else { M.swapSel = i; M.moveArm = 0; }
            renderBook(); }; });
        if (!window.ONB_ACTIVE) { const hint = $('hint'); if (hint) hint.textContent = b.length < 2 ? 'Draft more abilities to build a combo' : M.moveArm ? 'Tap the slot to move it to' : 'Tap an ability to see it. Move changes the order.'; }
        const d = $('detail'); if (d && b[sel] !== undefined && !window.ONB_ACTIVE) d.insertAdjacentHTML('beforeend', `<div class="odbtns">${b.length > 1 ? `<button class="pzbtn mvbtn ${M.moveArm ? 'on' : ''}" onclick="orderMove(${sel})">${M.moveArm ? '✕ Cancel move' : '⇄ Move'}</button>` : ''}<button class="pzbtn ${p[sel] ? 'on' : ''}" onclick="togglePause(${sel})">${p[sel] ? '▶ Resume' : '⏸ Pause this round'}</button></div>`);
        const act = b.filter((k, j) => !p[j]); if (p.some(Boolean)) $('loopt').innerHTML = (typeof synHTML === 'function' ? synHTML(PR.hand, 1) : '') + `<div class="pzn">${b.length - act.length} paused this round</div>`; } catch (e) {}
      return r; }; }
  { const _sd = startDuel; window.startDuel = startDuel = function () { const p = (typeof M !== 'undefined' && M && M.pz) ? M.pz.slice() : []; const r = _sd.apply(this, arguments);
      try { const me = ents[0]; me.pz = p.some(Boolean) && p.length <= me.book.length ? p : null; M.pz = [];   // a pause lasts one round
        const q = $('qM'); if (q) [...q.children].forEach((el, i) => el.classList.toggle('qpz', !!(me.pz && me.pz[i]))); } catch (e) {} return r; }; }
  { const _up = update; window.update = update = function (dt) {
      try { if (typeof ents !== 'undefined' && ents && !ended) { const w = ents[0]; if (w && w.pz && !w.dead) for (let n = 0; n < w.book.length && w.pz[w.i]; n++) { w.castN = (w.castN || 0) + 1; w.i = (w.i + 1) % w.book.length; w.p = 0; } } } catch (e) {}
      return _up.apply(this, arguments); }; }

  /* ---------------- crash log ---------------- */
  const CKEY = 'sb.crashes', MAXC = 25; let told = false;
  const readC = () => { try { return JSON.parse(localStorage.getItem(CKEY) || '[]'); } catch (e) { return []; } };
  const screenNow = () => { const s = document.querySelector('.screen.on'); return s ? s.id : '?'; };
  function logCrash(kind, msg, where, stack) {
    try { const L = readC(), sig = kind + '|' + msg + '|' + where, last = L[L.length - 1]; if (last && last.sig === sig) { last.n = (last.n || 1) + 1; last.t = Date.now(); }
      else L.push({ sig, t: Date.now(), v: typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?', kind, msg: String(msg).slice(0, 300), where: String(where || '').slice(0, 160), stack: String(stack || '').split('\n').slice(0, 6).join('\n').slice(0, 700), screen: screenNow(),
        round: (typeof M !== 'undefined' && M && M.round) || 0, me: (typeof M !== 'undefined' && M && M.me && M.me.book || []).join(','), foe: (typeof M !== 'undefined' && M && M.foe && M.foe.book || []).join(','), ups: (typeof M !== 'undefined' && M && M.me && [...(M.me.up || [])].concat([...(M.foe.up || [])]).join(',') || '').slice(0, 400) });
      while (L.length > MAXC) L.shift(); localStorage.setItem(CKEY, JSON.stringify(L));
      if (!told && typeof toast === 'function') { told = true; setTimeout(() => { try { toast('Something went wrong. Options has a crash log you can send us.'); } catch (e) {} }, 800); } } catch (e) {}
  }
  window.logCrash = logCrash;
  addEventListener('error', e => { if (!e || !e.message || /^Script error\.?$/.test(e.message)) return; logCrash('error', e.message, (e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno, e.error && e.error.stack); });
  addEventListener('unhandledrejection', e => { const r = e && e.reason; logCrash('promise', (r && r.message) || String(r), '', r && r.stack); });
  // errors the game loop caught and carried on from
  if (typeof loopErr === 'function') { const _le = loopErr; window.loopErr = loopErr = function (e, where) { try { logCrash('loop:' + where, e && e.message, '', e && e.stack); } catch (x) {} return _le.apply(this, arguments); }; }
  const crashText = () => { const L = readC(); return L.map(c => `[${new Date(c.t).toISOString()}] v${c.v} ${c.kind}${c.n > 1 ? ' x' + c.n : ''}\n${c.msg}\n${c.where}\nscreen ${c.screen}, round ${c.round}\nme: ${c.me}\nfoe: ${c.foe}\nupgrades: ${c.ups}\n${c.stack}`).join('\n\n'); };
  window.openCrashLog = function () { const L = readC();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Crash log</div><div class="ssub" style="margin:0">${L.length ? `${L.length} error${L.length > 1 ? 's' : ''} recorded on this device. Nothing is sent unless you send it. The report holds the error, the game version and the two books in play: no name, no account.` : 'No errors recorded. Nice.'}</div>
      ${L.length ? `<pre class="crlog">${crashText().replace(/</g, '&lt;')}</pre><button class="upbtn" onclick="sendCrashLog()">✉ Send to the developer</button><button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050);margin-top:6px" onclick="clearCrashLog()">Clear the log</button>` : ''}`;
    $('sheet').classList.add('on'); };
  window.clearCrashLog = function () { try { localStorage.removeItem(CKEY); } catch (e) {} closeSheet(); toast('Crash log cleared'); };
  window.sendCrashLog = function () { const to = window.FEEDBACK_TO; if (!to) return toast('Sending is not set up in this build. You can copy the text above.');
    const body = ('Crash log\n' + navigator.userAgent + '\n\n' + crashText()).slice(0, 5500);
    (window.openExternal || (u => window.open(u, '_blank')))('mailto:' + to + '?subject=' + encodeURIComponent('Wizards vs Sorcerers crash log v' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?')) + '&body=' + encodeURIComponent(body));
    closeSheet(); toast('Your mail app is opening. Tap Send there. Thank you!'); };

  /* ---------------- how much your fighter talks ---------------- */
  window.talkChance = first => { const t = (typeof PR !== 'undefined' && PR.talk) || 'some'; return t === 'off' ? 0 : t === 'lots' ? (first ? 1 : .75) : (first ? .3 : .12); };
  window.orderMove = function (i) { M.swapSel = i; M.moveArm = M.moveArm ? 0 : 1; renderBook(); };
  window.setTalk = function (v) { PR.talk = v; try { save(); } catch (e) {} toast({ off: 'Your fighter will stay silent.', some: 'Your fighter will speak now and then.', lots: 'Your fighter will have plenty to say.' }[v]); };
  // a chatty fighter also speaks up mid-round
  { let next = 0; const _up = update; window.update = update = function (dt) { const r = _up.apply(this, arguments);
      try { if ((PR.talk || 'some') === 'lots' && typeof M !== 'undefined' && M && !M.practice && typeof ents !== 'undefined' && ents && ents[0] && !ents[0].dead && !ended && window.emoteSay && window.FLAVOUR_LINES && $('battle').classList.contains('on')) { if (T < next - 20) next = 0; if (!next) next = T + rnd(7, 11);
          if (T > next) { next = T + rnd(8, 13); const L = FLAVOUR_LINES[(PR.look && PR.look.cls) === 'sorc' ? 'sorc' : 'wiz']; emoteSay(ents[0], null, L[Math.random() * L.length | 0]); } } } catch (e) {}
      return r; }; }
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML;
    window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = $('pause') && $('pause').classList.contains('on'), v = PR.talk || 'some', n = readC().length;
      const row = `<div class="opt"><span>My fighter talks</span><select class="bgmsel" onchange="setTalk(this.value)">${[['off', 'Never'], ['some', 'Sometimes'], ['lots', 'A lot']].map(([id, t]) => `<option value="${id}" ${v === id ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
      const crash = inMatch ? '' : `<button class="hbtn out" style="width:100%;margin-top:6px" onclick="openCrashLog()">🐞 Crash log${n ? ' (' + n + ')' : ''}</button>`;
      return h.replace('<div class="opt"><span>Battle music</span>', row + '<div class="opt"><span>Battle music</span>').replace(/<\/div>$/, crash + '</div>'); }; }

  /* ---------------- tooltips for things on the floor ---------------- */
  try { $('cv').addEventListener('pointerdown', e => { if (typeof ents === 'undefined' || !ents || !ents.length) return;
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height, css = v => v * r.width / W;
      // something that stands there takes the tap first (the game's own handler shows it)
      const near = (ex, ey, h, d) => Math.hypot(x - ex, y - (ey - h)) < d;
      if (ents.some(w => near(w.x, w.y, 45 * HS, 28)) || zombies.some(z => near(z.x, z.y, 22 * HS, 34)) || golems.some(g => near(g.x, g.y, 28, 34)) || archers.some(a => near(a.x, a.y, 30, 34)) || totems.some(q => near(q.x, q.y, 28, 34)) || decoys.some(d => near(d.x, d.y, 45 * HS, 34)) || walls.some(wl => wallD(wl, x, y + 16) < 34)) return;
      const flat = (q, rr) => Math.hypot(x - q.x, (y - q.y) * 1.6) / Math.max(12, rr), cand = [];
      const add = (list, k, rOf, label) => { for (const q of list || []) { if (q.x === undefined || !q.o) continue; const d = flat(q, rOf(q)); if (d < 1) cand.push({ d, k, q, label }); } };
      add(typeof patches !== 'undefined' && patches, 'thorns', q => q.r, 'Thorn patch'); add(typeof pits !== 'undefined' && pits, 'sinkhole', q => q.rmax || q.r, 'Sinkhole');
      if (window.TECH_DEBUG) { add(TECH_DEBUG.muds.filter(m => m.t < m.dur), 'earthm', q => q.r, 'Mud'); add(TECH_DEBUG.springs.filter(s => s.t < s.dur), 'healspring', q => q.r, 'Healing Spring'); add(TECH_DEBUG.domes.filter(d => d.t < d.dur && !d.open), 'sanctum', q => q.r, 'Sanctum'); }
      if (typeof clouds !== 'undefined') for (const c of clouds) if (Math.hypot(x - c.x, y - (c.y - 60 * HS)) < 40) cand.push({ d: .5, k: 'storm', q: c, label: 'Storm Cloud' });
      if (typeof hgs !== 'undefined') for (const h of hgs) if (h.o && Math.hypot(x - h.o.x, (y - h.o.y) * 1.4) < h.r) cand.push({ d: .9, k: 'hourglass', q: { o: h.o, x: h.o.x, y: h.o.y }, label: 'Hourglass' });
      cand.sort((a, b) => a.d - b.d); const hit = cand[0]; if (hit && typeof showTip === 'function') showTip(hit.k, hit.q.o.lv[hit.k] || 1, hit.q.o.me, css(hit.q.x), css(hit.q.y - 24 * HS), null, hit.label); }); } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `.tktrade{background:#0006;border:2px solid #000;border-radius:14px;padding:9px 11px;margin:8px 0}.tktrade>b{display:block;font:15px 'Lilita One';letter-spacing:.3px}.tktrade>small{display:block;font:700 11px Nunito;color:#b9a6ee;margin:1px 0 6px}
  .tkrow{display:flex;align-items:center;gap:6px;margin-top:6px}.tkrow img{width:34px;height:34px}.tkrow span{flex:1;min-width:0}.tkrow span b{display:block;font:13px 'Lilita One';white-space:nowrap}.tkrow span small{font:700 10.5px Nunito;color:#b9a6ee}
  .tkrow button{display:flex;align-items:center;gap:3px;font:12.5px 'Lilita One';color:#2a1600;background:linear-gradient(#ffe27a,#f0a830);border:2px solid #000;border-radius:10px;padding:5px 8px;box-shadow:0 2px 0 #000;cursor:pointer;white-space:nowrap}
  .tkrow button.gm{background:linear-gradient(#e07bff,#9a3fd6);color:#fff}.tkrow button[disabled]{filter:grayscale(1) brightness(.7)}.tkrow button .ci{width:14px;height:14px;display:inline-grid}
  .tile.pz img{opacity:.3;filter:grayscale(1)}.tile .pzm{position:absolute;inset:0;display:grid;place-items:center;font-size:24px;color:#ffd75e;text-shadow:0 2px 0 #000;pointer-events:none}
  .odbtns{display:flex;gap:8px;flex-wrap:wrap}.tile.mvto{box-shadow:0 0 0 2px #ffd45e,0 0 12px #ffd45e88;animation:breathe 1s ease-in-out infinite}
  .pzbtn{margin-top:6px;font:13px 'Lilita One';color:#fff;background:linear-gradient(#4a3a80,#2b2050);border:2px solid #000;border-radius:10px;padding:5px 12px;box-shadow:0 2px 0 #000;cursor:pointer}.pzbtn.on{background:linear-gradient(#ffe27a,#f0a830);color:#2a1600}
  #detail{flex-wrap:wrap}.q .qpz{opacity:.3;filter:grayscale(1)}
  .crlog{max-height:36vh;overflow:auto;background:#0009;border:2px solid #000;border-radius:10px;padding:8px;margin:8px 0;font:11px/1.35 ui-monospace,Menlo,monospace;color:#e8e0ff;white-space:pre-wrap;word-break:break-word;-webkit-user-select:text;user-select:text}
  #turnMe{display:none;position:fixed;inset:0;z-index:99998;background:#0d0a18;color:#fff;align-items:center;justify-content:center;flex-direction:column;gap:14px;text-align:center;font:22px 'Lilita One';letter-spacing:.5px}
  #turnMe i{font-size:56px;font-style:normal;animation:turnMe 1.6s ease-in-out infinite}@keyframes turnMe{0%,100%{transform:rotate(90deg)}50%{transform:rotate(0)}}
  @media (orientation:landscape) and (max-height:520px) and (pointer:coarse){#turnMe{display:flex}}`;
  document.head.appendChild(css);
  if (!$('turnMe')) document.body.insertAdjacentHTML('beforeend', '<div id="turnMe"><i>📱</i><span>Turn your phone upright to play</span></div>');
})();

/* ---------------- order screen: what the selected ability does, in numbers; and what is behind each bonus chip ---------------- */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  // statuses an ability can put on the enemy (shown on the order screen card)
  const STATUS = { fireball: ['Burn'], meteor: ['Burn (Scorched Earth)'], ringfire: ['Burn', 'Knockback'], burnbody: ['Burn'], lightning: ['Stun'], storm: ['Stun (Thunderhead)', 'Slow (Hailstorm)'], icewall: ['Slow (Frostbite)'], thorns: ['Root'], bubbles: ['Slow (Sticky Acid)'],
    flies: ['Cast slow (Plague)'], zombies: ['Hold (Grave Grip)'], gravity: ['Pull'], sinkhole: ['Sink'], gale: ['Knockback'], hourglass: ['Time stop for shots'], dissect: ['Bleed (Stinging Wounds)'], rush: ['Burn (Infused Strikes)', 'Knockback (Finisher)'],
    polarity: ['Pull', 'Knockback', 'Stun (Stunning Force)'], sanctum: ['Trap', 'Slow'], doubletake: ['Daze'], counter: ['Stun', 'Knockback'], earthm: ['Slow'], copycast: ['Daze'], bloodoath: ['Bleed'], bloodcraft: ['Poison (Tainted Blood)'], zodiac: ['Varies by beast'],
    blackfrost: ['Freeze'], shadowrush: ['Stun (Ambush)'], violetbolt: ['Stun'], bluefire: ['Burn'] };
  if (typeof renderBook === 'function') { const _rb = renderBook;
    window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments);
      try { const b = M.me.book, sel = M.swapSel ?? (M.lastAdded >= 0 ? M.lastAdded : 0), k = b[sel], d = $('detail'); if (!d || !k || !SP[k]) return r;
        const lv = (PR.spells[k] && PR.spells[k].lvl) || 1, stt = STATS[k] || {}, lbl = (typeof STAT_LBL_SPELL !== 'undefined' && STAT_LBL_SPELL[k]) || {}, gen = typeof STAT_LBL !== 'undefined' ? STAT_LBL : {};
        const rows = Object.keys(stt).map(s0 => { const bk = window.dmgBreak && (s0 === 'dmg' || s0 === 'dps') ? dmgBreak(k, s0, lv, M.mySyn || (typeof synergyOf === 'function' ? synergyOf(PR.hand) : null)) : null; return `<span><small>${lbl[s0] || gen[s0] || s0}</small><b>${bk ? bk.total : stt[s0][Math.min(lv, stt[s0].length) - 1]}</b>${bk ? `<em class="dbk">${bk.txt}</em>` : ''}</span>`; }).join('');
        const sts = STATUS[k] || STATUS[SP[k].variantOf] || [], rs = window.castRestr ? castRestr(k) : [];
        d.insertAdjacentHTML('beforeend', `<div class="odet"><div class="odesc"><em>Lv ${lv}</em>${SP[k].d}</div>${rows ? `<div class="ostats">${rows}</div>` : ''}${sts.length || rs.length ? `<div class="ostat">${rs.map(x => `<i class="r">${x}</i>`).join('')}${sts.map(x => `<i>${x}</i>`).join('')}</div>` : ''}</div>`); } catch (e) {}
      return r; }; }

  // bonus chips: tag each with the bonus it stands for, so a tap can explain it
  if (typeof synHTML === 'function') { const _sy = synHTML;
    window.synHTML = synHTML = function (list, short) { const h = _sy.apply(this, arguments);
      try { const sy = synergyOf(list), ks = Object.keys(sy).sort((a, b) => sy[b].n - sy[a].n); let i = 0; return h.replace(/<span class="sy"/g, m => { const key = ks[i++]; return key ? `<span class="sy" data-sk="${key}" data-sl="${[...new Set(list || [])].join(',')}"` : m; }); } catch (e) { return h; } }; }
  function synTip(el) { const key = el.dataset.sk, list = (el.dataset.sl || '').split(',').filter(k => SP[k]), [kind, id] = key.split(':'), sy = synergyOf(list)[key]; if (!sy) return;
    let who = [], title = '', what = '';
    if (kind === 'el') { who = list.filter(k => ELEM_OF[k] === id); const m = ELEMS[id] || {}; title = m.t || m.n || id; what = `${who.length} abilities of the ${(m.n || id).toLowerCase()} element. Each one deals ${Math.round(sy.pct * 100)}% more damage.`; }
    else if (kind === 'ty') { who = list.filter(k => TYPE_OF[k] === id); const m = TYPE_SYN[id] || {}; title = m.t || id; what = `${who.length} ${(m.n || id).toLowerCase()} abilities. Each one is ${Math.round(sy.pct * 100)}% stronger.`; }
    else { who = list; const m = SCHOOL_SYN[id] || {}; title = m.t || id; what = `Every ability in the hand is a ${id === 'sorc' ? 'technique' : 'spell'}: +${Math.round(sy.pct * 100)}% ${m.n || 'damage'}.`; }
    let t = $('sytip'); if (!t) { t = document.createElement('div'); t.id = 'sytip'; document.body.appendChild(t); t.onclick = () => t.classList.remove('on'); }
    t.innerHTML = `<b>${title}</b><p>${what}</p><div>${who.map(k => `<span><img src="${ICON[k]}">${SP[k].n}</span>`).join('')}</div>`;
    // (1.0.23) kept inside the game frame on every side: the box is measured with its padding and border, and clamped left, right, top and bottom
    const r = el.getBoundingClientRect(), fr = (document.querySelector('.phone') || document.body).getBoundingClientRect(), L0 = Math.max(0, fr.left), R0 = Math.min(innerWidth, fr.right), T0 = Math.max(0, fr.top), B0 = Math.min(innerHeight, fr.bottom);
    t.classList.add('on'); t.style.boxSizing = 'border-box'; t.style.maxHeight = (B0 - T0 - 16) + 'px'; t.style.overflowY = 'auto'; const tw = Math.min(300, R0 - L0 - 16); t.style.width = tw + 'px'; t.style.left = Math.max(L0 + 8, Math.min(R0 - tw - 8, r.left + r.width / 2 - tw / 2)) + 'px';
    const th = t.offsetHeight; let top = r.top - th - 8 > T0 + 8 ? r.top - th - 8 : r.bottom + 8; top = Math.max(T0 + 8, Math.min(B0 - th - 8, top)); t.style.top = top + 'px'; clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 4500); }
  document.addEventListener('click', e => { const el = e.target && e.target.closest && e.target.closest('.sy[data-sk]'); if (el) { e.stopPropagation(); synTip(el); } else { const t = $('sytip'); if (t && !(e.target.closest && e.target.closest('#sytip'))) t.classList.remove('on'); } }, true);

  const css = document.createElement('style');
  css.textContent = `.odet{flex-basis:100%;margin-top:6px;border-top:1.5px solid #ffffff22;padding-top:6px}.odesc{font:700 12px Nunito;line-height:1.3;color:#e8e0ff}.odesc em{font:11px 'Lilita One';font-style:normal;background:#ffd75e;color:#2a1600;border-radius:6px;padding:1px 6px;margin-right:6px}
  .ostats{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}.ostats span{display:flex;align-items:baseline;gap:5px;background:#0006;border:1.5px solid #000;border-radius:8px;padding:2px 7px}.ostats small{font:700 10.5px Nunito;color:#b9a6ee}.ostats b{font:13px 'Lilita One';color:#fff}
  .ostat{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.ostat i{font:800 10px Nunito;font-style:normal;border-radius:6px;padding:1px 6px;background:#3a1f5a;color:#f1dcff;border:1.5px solid #000}.ostat i.r{background:#5a2a12;color:#ffe9c2}
  .sy[data-sk]{cursor:pointer}#sytip{position:fixed;z-index:99990;display:none;background:#0b0816f5;border:2px solid #ffd45e;border-radius:14px;padding:9px 12px;box-shadow:0 4px 0 #000}#sytip.on{display:block}
  #sytip b{font:15px 'Lilita One';color:#ffd75e}#sytip p{margin:3px 0 6px;font:700 12.5px Nunito;line-height:1.3;color:#f1eaff}#sytip div{display:flex;flex-wrap:wrap;gap:5px}#sytip span{display:flex;align-items:center;gap:4px;font:800 11px Nunito;color:#fff;background:#1a1236;border:1.5px solid #000;border-radius:8px;padding:2px 7px 2px 3px}#sytip img{width:20px;height:20px}`;
  document.head.appendChild(css);
})();
