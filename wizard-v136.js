/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.16
   Season Pass. Each 30-day season has 30 tiers, filled by the XP you earn (the same XP as your player level).
   Free track for everyone: gold, skill points for your hand, and gems every fifth tier.
   Premium track ($4.99 for the season, iOS app), as of 1.0.33.17: 500 gold every tier, 10 Echo Runes every third tier, 30 gems on the other plain tiers,
   five premium-only cosmetics at tiers 1, 3, 5, 7 and 9, three season bloods (Molten 10, Inkwell 20, Prismatic 30) and 200 gems at 30.
   The premium track belongs to the season it was bought in. It is a one-time purchase and does not renew.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const DAY = 86400e3, S0 = Date.UTC(2026, 10, 15), LEN = 30 * DAY, TIERS = 30, PER = 80;
  const seasonOf = t => Math.floor((t - S0) / LEN);
  const seasonEnd = s => S0 + (s + 1) * LEN;
  const iap = () => window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap;
  let PRICE = '$4.99';

  /* ---------------- the season's own blood colours ---------------- */
  const PASS_BLOOD = [
    { id: 'molten', n: 'Molten', tier: 10, drops: ['#fff0a0', '#ff8a1f', '#a8300a'], pool: ['#3a1000', '#e2560e', 'rgba(255,230,160,.75)'], glow: '#ff7a1a' },
    { id: 'inkwell', n: 'Inkwell', tier: 20, drops: ['#ffd45e', '#1a1424', '#05030a'], pool: ['#000000', '#120c1c', 'rgba(255,212,94,.8)'], glow: '#ffd45e' },
    { id: 'prismatic', n: 'Prismatic', tier: 30, cycle: 1 },
  ];
  try { const P = window.BLOOD_PALETTES; if (P && COSMETICS.blood) for (const b of PASS_BLOOD) { if (!b.cycle) P[b.id] = { drops: b.drops, pool: b.pool, glow: b.glow };
      if (!COSMETICS.blood.some(q => q.id === b.id)) COSMETICS.blood.push({ id: b.id, n: b.n, r: b.tier === 30 ? 'legendary' : 'epic', unlock: { type: 'pass', v: b.tier } }); } } catch (e) {}
  // Prismatic turns through the colours as it is drawn
  if (window.bloodPal) { const _bp = bloodPal; window.bloodPal = function (o) { const r = _bp.apply(this, arguments); try { if (r === null && PR.look && PR.look.blood === 'prismatic') { const mine = o && typeof ents !== 'undefined' && ents && (o === ents[0] || o.o === ents[0]) && ents[0].me; if (mine) { const h = (performance.now() / 12) % 360; return { drops: [`hsl(${h},100%,78%)`, `hsl(${h},90%,55%)`, `hsl(${h},80%,28%)`], pool: [`hsl(${h},70%,12%)`, `hsl(${h},85%,45%)`, 'rgba(255,255,255,.7)'], glow: `hsl(${h},100%,60%)` }; } } } catch (e) {} return r; }; }
  // the wardrobe tile for Prismatic, and what a pass item says when locked
  if (window.V132 && V132.swatch) { const _sw = V132.swatch; V132.swatch = function (c, id) { if (id === 'prismatic') { const P = window.BLOOD_PALETTES; P.prismatic = { drops: ['#ffd6ff', '#7a5cff', '#1a2a8a'], pool: ['#120a2a', '#5a8aff', 'rgba(255,255,255,.75)'], glow: '#c48cff' }; const r = _sw.apply(this, arguments); delete P.prismatic; return r; } return _sw.apply(this, arguments); }; }
  if (typeof unlockText === 'function') { const _ut = unlockText; window.unlockText = function (u) { if (u && u.type === 'pass') return `Season Pass tier ${u.v}`; return _ut.apply(this, arguments); }; try { (0, eval)('unlockText = window.unlockText'); } catch (e) {} }
  if (typeof renderWardrobe === 'function') { const _rw = renderWardrobe; window.renderWardrobe = renderWardrobe = function () { const r = _rw.apply(this, arguments);
      try { if (wCat === 'blood') document.querySelectorAll('#items canvas').forEach(c => { const it = COSMETICS.blood[+c.dataset.i]; if (it && V132.swatch && (it.id === 'prismatic' || BLOOD_PALETTES[it.id])) V132.swatch(c, it.id); }); } catch (e) {}
      return r; }; }

  /* ---------------- rewards ---------------- */
  function freeR(t) { if (t % 5 === 0) return { k: 'gems', n: 15 }; if (t % 2) return { k: 'gold', n: 50 + 5 * t }; return { k: 'sp', n: 3 }; }
  // (1.0.33.17) premium is generous on purpose: 500 gold every tier, 10 Echo Runes every third tier, and 5 premium-only cosmetics in the first 9 tiers
  const PCOS = { 1: { cat: 'robe', id: 'starforged', n: 'Starforged Robe / Gi' }, 3: { cat: 'trail', id: 'comet', n: 'Comet Trail' }, 5: { cat: 'beam', id: 'starfire', n: 'Starfire Cannon' }, 7: { cat: 'aurastyle', id: 'starfall', n: 'Starfall Aura' }, 9: { cat: 'hat', id: 'voidcrown', n: 'Void Crown' } };
  function premR(t) { const out = [{ k: 'gold', n: 500 }], b = PASS_BLOOD.find(q => q.tier === t), cs = PCOS[t];
    if (cs) out.unshift({ k: 'cos', cat: cs.cat, id: cs.id, n: cs.n }); if (b) out.unshift({ k: 'blood', id: b.id });
    if (t % 3 === 0) out.push({ k: 'rune', n: 10 }); else if (!cs && !b) out.push({ k: 'gems', n: 30 }); if (t === 30) out.push({ k: 'gems', n: 200 }); return out; }
  const rList = r => Array.isArray(r) ? r : [r];
  function give(r) { if (r.k === 'gems') PR.gems = (PR.gems || 0) + r.n; else if (r.k === 'gold') PR.coins = (PR.coins || 0) + r.n; else if (r.k === 'rune') PR.mTok = (PR.mTok || 0) + r.n;
    else if (r.k === 'sp') { for (const k of PR.hand || []) if (PR.spells[k]) PR.spells[k].cards += r.n; }
    else if (r.k === 'blood') { PR.owned = PR.owned || []; if (!PR.owned.includes('blood.' + r.id)) PR.owned.push('blood.' + r.id); }
    else if (r.k === 'cos') { PR.owned = PR.owned || []; if (!PR.owned.includes(r.cat + '.' + r.id)) PR.owned.push(r.cat + '.' + r.id); try { toast(r.n + ' unlocked!'); } catch (e) {} } }
  const GEM = () => (typeof SVG !== 'undefined' && SVG.gem) || '💎', COIN = () => (typeof SVG !== 'undefined' && SVG.coin) || '🪙';
  function rHTML(r) { if (r.k === 'gems') return `<span class="sp-r"><i>${GEM()}</i>${r.n}</span>`; if (r.k === 'gold') return `<span class="sp-r"><i>${COIN()}</i>${r.n}</span>`;
    if (r.k === 'rune') return `<span class="sp-r"><i>🔮</i>${r.n} Echo Rune${r.n > 1 ? 's' : ''}</span>`;
    if (r.k === 'cos') return `<span class="sp-r sp-cos"><i>✨</i>${r.n}</span>`; if (r.k === 'sp') return `<span class="sp-r"><i>✦</i>${r.n} skill pts</span>`;
    if (r.k === 'blood') { const b = PASS_BLOOD.find(q => q.id === r.id); return `<span class="sp-r sp-bl"><i class="sp-drop sp-${r.id}"></i>${b ? b.n : r.id} blood</span>`; } return ''; }

  /* ---------------- state ---------------- */
  function st() { const s = seasonOf(Date.now()); let p = PR.pass; if (!p || p.s !== s) { const prem = p && p.prem; p = PR.pass = { s, xp: 0, f: [], p: [], prem: prem === s ? s : null, last: totXp() }; try { save(); } catch (e) {} } return p; }
  function totXp() { let t = PR.xp || 0; try { for (let l = 1; l < (PR.lvl || 1); l++) t += xpNeed(l); } catch (e) {} return t; }
  const tierOf = p => Math.min(TIERS, Math.floor(p.xp / PER));
  const premium = () => st().prem === st().s;
  function claimable() { const p = st(), t = tierOf(p); let n = 0; for (let i = 1; i <= t; i++) { if (!p.f.includes(i)) n++; if (premium() && !p.p.includes(i)) n++; } return n; }
  window.PASS = { st, tierOf, claimable, premium, freeR, premR, TIERS, PER, seasonOf };
  // the pass fills with the same XP as your player level
  function trackXp() { const p = st(), now = totXp(); if (p.last === undefined) p.last = now; const d = now - p.last; if (d > 0 && d < 5000) { const before = tierOf(p); p.xp += d; p.last = now; try { save(); } catch (e) {} if (tierOf(p) > before) try { toast(`Season Pass: tier ${tierOf(p)} reached`); } catch (e) {} } else if (d !== 0) { p.last = now; } paintBtn(); }
  setInterval(() => { try { trackXp(); } catch (e) {} }, 1500);

  /* ---------------- claiming ---------------- */
  window.passClaim = function (t, track) { const p = st(); if (t > tierOf(p)) return; if (track === 'p' && !premium()) return;
    const arr = track === 'p' ? p.p : p.f; if (arr.includes(t)) return; arr.push(t); for (const r of rList(track === 'p' ? premR(t) : freeR(t))) give(r);
    try { save(); sfx('ui_coin'); refreshMeta(); } catch (e) {} openPass(true); };
  window.passClaimAll = function () { const p = st(), T = tierOf(p); for (let t = 1; t <= T; t++) { if (!p.f.includes(t)) { p.f.push(t); give(freeR(t)); } if (premium() && !p.p.includes(t)) { p.p.push(t); for (const r of premR(t)) give(r); } }
    try { save(); sfx('ui_unlock'); refreshMeta(); toast('Rewards claimed'); } catch (e) {} openPass(true); };

  /* ---------------- buying ---------------- */
  window.passBuy = function () { if (premium()) return; const I = iap(); if (!I) return toast('The Season Pass can be bought in the iOS app.'); try { I.postMessage({ action: 'buy', id: 'pass' }); } catch (e) {} };
  window.passRestore = function () { const I = iap(); if (!I) return toast('Restore works in the iOS app.'); try { I.postMessage({ action: 'restore' }); toast('Checking your purchases…'); } catch (e) {} };
  function grantPass(ms) { const s = seasonOf(ms || Date.now()), p = st(); if (s !== p.s) return false; if (p.prem === s) return true; p.prem = s; try { save(); sfx('ui_unlock'); toast('Premium pass unlocked for this season!'); } catch (e) {} if ($('spSheet')) openPass(true); paintBtn(); return true; }
  if (window.SB_IAP_DONE) { const _d = SB_IAP_DONE; window.SB_IAP_DONE = function (id, ok, msg, ms) { if (id === 'pass') { if (ok) grantPass(ms); else if (msg) toast(msg); return; } return _d.apply(this, arguments); }; }
  // purchases Apple still has on record (a reinstall, a new phone): only this season's counts
  window.SB_PASS_ENT = function (list) { let got = false; for (const ms of list || []) if (grantPass(ms)) got = true; if ($('spSheet') && !got) toast(premium() ? 'Premium pass is active.' : 'No Season Pass for this season found.'); };
  if (window.SB_IAP_PRICES) { const _pr = SB_IAP_PRICES; window.SB_IAP_PRICES = function (map) { try { if (map && map.pass) PRICE = map.pass; } catch (e) {} return _pr.apply(this, arguments); }; }
  if (iap()) setTimeout(() => { try { iap().postMessage({ action: 'entitlements' }); iap().postMessage({ action: 'prices' }); } catch (e) {} }, 2500);

  /* ---------------- the pass screen ---------------- */
  const fmtD = ms => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  window.openPass = function (keepScroll) { const p = st(), T = tierOf(p), prem = premium(), end = seasonEnd(p.s), daysLeft = Math.max(0, Math.ceil((end - Date.now()) / DAY)), into = p.xp - T * PER;
    const box = document.querySelector('#sheetP .sp-list'), top = keepScroll && box ? box.scrollTop : 0;
    const row = t => { const fr = freeR(t), pr = premR(t), fG = p.f.includes(t), pG = p.p.includes(t), ok = t <= T;
      const cell = (rw, got, track, lock) => `<div class="sp-c ${track}${got ? ' got' : ''}${lock ? ' lk' : ''}">${rList(rw).map(rHTML).join('')}${got ? '<b class="sp-ok">✓</b>' : ok && !lock ? `<button class="sp-claim" onclick="passClaim(${t},'${track}')">Claim</button>` : lock ? `<b class="sp-lock">${(typeof SVG !== 'undefined' && SVG.lock) || '🔒'}</b>` : ''}</div>`;
      return `<div class="sp-row${ok ? ' on' : ''}${t === T + 1 ? ' next' : ''}"><div class="sp-t">${t}</div>${cell(fr, fG, 'f', false)}${cell(pr, pG, 'p', !prem)}</div>`; };
    const n = claimable();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh" id="spSheet">Season ${p.s + 1} Pass</div>
      <div class="sp-head"><div class="sp-tier"><b>Tier ${T}</b><span>/ ${TIERS}</span></div><div class="sp-bar"><i style="width:${T >= TIERS ? 100 : into / PER * 100}%"></i></div><small>${T >= TIERS ? 'Every tier reached!' : `${into} / ${PER} XP to tier ${T + 1}`} · Ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${fmtD(end)})</small></div>
      ${prem ? '<div class="sp-prem on">★ Premium pass active this season</div>' : `<div class="sp-buy"><button class="sp-bb" onclick="passBuy()"><b>Unlock Premium</b><span>${PRICE}</span></button><p>Premium rewards for Season ${p.s + 1}, until ${fmtD(end)}: 8 exclusive cosmetics (a robe, trail, cannon skin, aura, crown and 3 blood colours), 15,000 gold, 100 Echo Runes and 650 gems. A one-time purchase for this season only; it does not renew.${daysLeft <= 3 ? ` <b class="sp-warn">This season ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</b>` : ''}</p><div class="sp-links"><button onclick="passRestore()">Restore purchases</button><button onclick="passLink('terms')">Terms of Use</button><button onclick="passLink('privacy')">Privacy</button></div></div>`}
      <div class="sp-cols"><span></span><span>Free</span><span class="pm">Premium</span></div>
      ${n ? `<button class="upbtn sp-all" onclick="passClaimAll()">Claim all (${n})</button>` : ''}
      <div class="sp-list">${Array.from({ length: TIERS }, (_, i) => row(i + 1)).join('')}</div>`;
    $('sheet').classList.add('on'); const L = document.querySelector('#sheetP .sp-list'); if (L) { if (keepScroll) L.scrollTop = top; else { const nx = L.querySelector('.sp-row.next') || L.querySelector('.sp-row:last-child'); if (nx) L.scrollTop = Math.max(0, nx.offsetTop - L.offsetTop - 80); } } paintBtn(); };
  window.passLink = function (k) { const url = k === 'terms' ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/' : 'https://maxpowerscomic-rgb.github.io/sorcerer-battle/privacy.html';
    try { if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.app) webkit.messageHandlers.app.postMessage({ action: 'open', url }); else window.open(url, '_blank'); } catch (e) {} };

  /* ---------------- the Home button, and Hoot ---------------- */
  function paintBtn() { const stg = document.querySelector('#home .stage'); if (!stg) return; let b = $('spBtn'); if (!b) { stg.insertAdjacentHTML('beforeend', '<button class="chbtn" id="spBtn" onclick="openPass()">Pass<i></i><u></u></button>'); b = $('spBtn'); }
    const p = st(); b.querySelector('i').textContent = tierOf(p) + '/' + TIERS; b.classList.toggle('sp-due', claimable() > 0); b.classList.toggle('sp-pm', premium()); }
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { paintBtn(); } catch (e) {} return r; }; }
  if (window.openHootGoals) { const _og = openHootGoals; window.openHootGoals = function () { const r = _og.apply(this, arguments);
      try { const n = claimable(), list = document.querySelector('#sheetP .hg-list'); if (n && list && !list.querySelector('.sp-hoot')) { const h = `<button class="hg-row ready sp-hoot" onclick="closeSheet();setTimeout(openPass,250)"><i>🏆</i><span>${n} Season Pass reward${n > 1 ? 's' : ''} to claim.</span><em>Go</em></button>`; const sep = list.querySelector('.hh-sep'); if (sep) sep.insertAdjacentHTML('afterend', h); else list.insertAdjacentHTML('afterbegin', h); } } catch (e) {}
      return r; }; }
  setTimeout(() => { try { st(); paintBtn(); } catch (e) {} }, 800);

  const css = document.createElement('style');
  css.textContent = `#spBtn{top:168px!important;background:linear-gradient(#b48cff,#6a3fd6)!important;color:#fff!important;position:absolute}#spBtn i{font:11px 'Lilita One';font-style:normal;background:#0006;border-radius:7px;padding:0 5px;margin-left:4px}#spBtn u{display:none;position:absolute;top:-5px;right:-5px;width:13px;height:13px;border-radius:50%;background:#ff4a5a;border:2px solid #000}#spBtn.sp-due u{display:block}#spBtn.sp-pm{background:linear-gradient(#ffe27a,#d99a1a)!important;color:#3a1d00!important}
  .sp-head{background:#160f2c;border:2px solid #000;border-radius:14px;padding:10px 12px;margin:4px 0 8px}.sp-tier{display:flex;align-items:baseline;gap:4px}.sp-tier b{font:22px 'Lilita One';font-weight:400;color:#ffd45e}.sp-tier span{font:800 13px Nunito;color:#b9a9e6}.sp-bar{height:12px;border-radius:7px;background:#0c0818;border:2px solid #000;overflow:hidden;margin:6px 0 5px}.sp-bar i{display:block;height:100%;background:linear-gradient(90deg,#b48cff,#ffd45e)}.sp-head small{font:700 12px Nunito;color:#cfc4f2}
  .sp-buy{background:linear-gradient(#2c1f58,#1b1338);border:2.5px solid #000;border-radius:14px;padding:10px 12px;margin-bottom:8px}.sp-bb{width:100%;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:12px;border:2.5px solid #000;background:linear-gradient(#ffe27a,#f0a830);color:#3a1d00;box-shadow:0 3px 0 #000}.sp-bb b{font:18px 'Lilita One';font-weight:400}.sp-bb span{font:18px 'Lilita One'}
  .sp-buy p{font:700 12px/1.4 Nunito;color:#d9d0f5;margin:8px 0 6px}.sp-warn{color:#ffb0b8}.sp-links{display:flex;gap:14px;flex-wrap:wrap}.sp-links button{background:none;border:0;padding:0;color:#9fd8ff;font:800 12px Nunito;text-decoration:underline}.sp-prem{font:15px 'Lilita One';color:#3a1d00;background:linear-gradient(#ffe27a,#f0a830);border:2px solid #000;border-radius:12px;padding:7px 10px;text-align:center;margin-bottom:8px}
  .sp-cols{display:grid;grid-template-columns:30px 1fr 1fr;gap:6px;font:12px 'Lilita One';letter-spacing:.5px;color:#cfc4f2;text-transform:uppercase;padding:0 2px}.sp-cols .pm{color:#ffd45e}.sp-all{width:100%;margin:6px 0}
  .sp-list{max-height:46vh;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:2px 0 70px}.sp-row{display:grid;grid-template-columns:30px 1fr 1fr;gap:6px;align-items:stretch;opacity:.62}.sp-row.on{opacity:1}.sp-row.next .sp-t{background:#ffd45e;color:#3a1d00}
  .sp-t{display:grid;place-items:center;font:15px 'Lilita One';color:#fff;background:#2a2050;border:2px solid #000;border-radius:10px}.sp-c{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:46px;padding:6px 8px;border-radius:11px;border:2px solid #000;background:#1e1640;position:relative}.sp-c.p{background:#2e2410}.sp-c.lk{opacity:.7}.sp-c.got{opacity:.55}
  .sp-r{display:flex;align-items:center;gap:4px;font:800 12.5px Nunito;color:#fff}.sp-cos{color:#ffe28a}.sp-r i{font-style:normal;width:15px;height:15px;display:grid;place-items:center}.sp-r i svg{width:15px;height:15px}.sp-claim{position:absolute;right:6px;top:50%;transform:translateY(-50%);padding:4px 9px;border-radius:9px;border:2px solid #000;background:linear-gradient(#7ee08a,#2f9a44);color:#062b10;font:12px 'Lilita One'}.sp-ok{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#7ee08a;font:16px 'Lilita One'}.sp-lock{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:16px;height:16px}.sp-lock svg{width:16px;height:16px}
  .sp-drop{width:12px!important;height:12px!important;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:1.5px solid #000}.sp-molten{background:#ff8a1f}.sp-inkwell{background:#120c1c;box-shadow:inset 0 0 0 2px #ffd45e}.sp-prismatic{background:conic-gradient(#ff5a5a,#ffd45e,#5aff8a,#5ab8ff,#c48cff,#ff5a5a)}`;
  document.head.appendChild(css);
})();
