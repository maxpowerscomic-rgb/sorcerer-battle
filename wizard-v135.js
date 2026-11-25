/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.14
   1. Free gems in the Shop: Hourly 5, Daily 20, Weekly 50, every 3 weeks 100 (1.0.33.15). Claims never stack: come back to take the next one.
   2. Reminders (iOS app): local notifications the phone shows on its own, no server. Options → Notifications picks what you
      are reminded about: daily rewards (free gems, login bonus, new challenges), hourly gems, fresh Fight Club bounties,
      and the season ending. Reminders that land at the same time are merged into one. The permission is asked after your
      first free claim, or when you switch a reminder on.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const native = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.notify);
  const post = m => { try { window.webkit.messageHandlers.notify.postMessage(m); } catch (e) {} };
  const HOUR = 3600e3, DAY = 86400e3;

  /* ---------------- free gems ---------------- */
  const FREE = [{ id: 'h', n: 'Hourly', g: 5 }, { id: 'd', n: 'Daily', g: 20 }, { id: 'w', n: 'Weekly', g: 50 }, { id: 'm', n: '3 Weeks', g: 100 }];   /* (1.0.33.15) the user's amounts; 'm' is now every 3 weeks */
  window.ECON = Object.assign(window.ECON || {}, { freeGems: Object.fromEntries(FREE.map(f => [f.id, f.g])) });
  const st = () => (PR.freeG = PR.freeG || {});
  const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayKey = d => { const x = midnight(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
  const weekStart = d => { const x = midnight(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };   // Monday
  // the 3-week claim runs on fixed 21-day blocks counted from Monday 2 Nov 2026, so everyone's resets on the same Monday
  const ANCHOR = +new Date(2026, 10, 2), BLOCK = 21 * 86400e3;
  const blockOf = d => Math.floor((+weekStart(d) - ANCHOR) / BLOCK);
  const monthKey = d => 'b' + blockOf(d);
  function nextAt(id, now) { const s = st(); now = now || Date.now();
    if (id === 'h') return (s.h || 0) + HOUR;
    if (id === 'd') { if (s.d !== dayKey(now)) return now; const x = midnight(now); x.setDate(x.getDate() + 1); return +x; }
    if (id === 'w') { if (s.w !== dayKey(weekStart(now))) return now; const x = weekStart(now); x.setDate(x.getDate() + 7); return +x; }
    if (id === 'm') { if (s.m !== monthKey(now)) return now; const b = new Date(ANCHOR + (blockOf(now) + 1) * BLOCK); b.setHours(0, 0, 0, 0); return +b; } }
  const ready = id => nextAt(id) <= Date.now();
  window.FREE_GEMS_READY = () => FREE.filter(f => ready(f.id)).length;
  window.claimFree = function (id) { const f = FREE.find(q => q.id === id); if (!f || !ready(id)) return; const s = st(), now = Date.now();
    if (id === 'h') s.h = now; if (id === 'd') s.d = dayKey(now); if (id === 'w') s.w = dayKey(weekStart(now)); if (id === 'm') s.m = monthKey(now);
    PR.gems = (PR.gems || 0) + f.g; s.n = (s.n || 0) + 1;
    try { save(); sfx('ui_coin'); toast(`+${f.g} gem${f.g > 1 ? 's' : ''}`); refreshMeta(); } catch (e) {}
    paintFree(true); reschedule();
    if (s.n === 1 && native() && NS === 'undetermined' && !PR.notifAsked) setTimeout(softAsk, 700); };
  const left = ms => { const tm = Math.max(1, Math.ceil(Math.max(0, ms) / 60000)), h = Math.floor(tm / 60), m = tm % 60; return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; };
  const GEM = () => (typeof SVG !== 'undefined' && SVG.gem) || '💎';
  function paintFree(force) { const sh = $('shop'); if (!sh) return; const mc = sh.querySelector('.mc'); if (!mc) return; let row = $('fgRow');
    if (!row) { const first = mc.querySelector('.lbl'); if (!first) return; first.insertAdjacentHTML('beforebegin', '<div class="lbl">Free Gems</div><div class="fg-row" id="fgRow"></div>'); row = $('fgRow'); force = true; }
    const html = FREE.map(f => { const r = ready(f.id); return `<button class="fg-t${r ? ' on' : ''}" ${r ? `onclick="claimFree('${f.id}')"` : 'disabled'} aria-label="${f.n} free gems"><small>${f.n}</small><span class="fg-g"><i>${GEM()}</i>${f.g}</span><b>${r ? 'Claim' : left(nextAt(f.id) - Date.now())}</b></button>`; }).join('');
    if (force || row._h !== html) { row._h = html; row.innerHTML = html; } }
  if (typeof renderShop === 'function') { const _rs = renderShop; window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments); try { paintFree(true); } catch (e) {} return r; }; }
  setInterval(() => { try { if ($('shop') && $('shop').classList.contains('on')) paintFree(); } catch (e) {} }, 1000);
  // Hoot points at them too
  if (window.openHootGoals) { const _og = openHootGoals; window.openHootGoals = function () { const r = _og.apply(this, arguments);
      try { const n = FREE.filter(f => ready(f.id)), list = document.querySelector('#sheetP .hg-list'); if (n.length && list && !list.querySelector('.fg-hoot')) { const sum = n.reduce((a, f) => a + f.g, 0); const h = `<button class="hg-row ready fg-hoot" onclick="closeSheet();nav('shop')"><i>💎</i><span>${sum} free gem${sum > 1 ? 's' : ''} waiting in the Shop.</span><em>Go</em></button>`; const sep = list.querySelector('.hh-sep'); if (sep) sep.insertAdjacentHTML('afterend', h); else list.insertAdjacentHTML('afterbegin', h); } } catch (e) {}
      return r; }; }

  /* ---------------- reminders ---------------- */
  let NS = native() ? 'unknown' : 'web';   // granted | denied | undetermined | web
  window.SB_NOTIFY_STATUS = function (s) { NS = s; if (s === 'granted') reschedule(); try { if ($('nfSheet')) openNotify(); } catch (e) {} };
  const prefs = () => (PR.notif = Object.assign({ daily: true, gems: true, hourly: false, rivals: true, season: true }, PR.notif || {}));
  const OPTS = [['gems', 'Free gems are ready', 'Daily, weekly and 3-week gems in the Shop'], ['daily', 'Daily rewards', 'Your login bonus and new challenges'], ['hourly', 'Hourly gems', 'Every time an hourly gem is ready'], ['rivals', 'New rivals', 'Fresh Fight Club bounties and Ladder rivals'], ['season', 'Season ending', 'A day before the season closes']];
  const at = (base, h) => { const x = new Date(base); x.setHours(h, 0, 0, 0); return +x; };
  const nextHour = (h, now) => { let t = at(now, h); if (t <= now + 60e3) t += DAY; return t; };
  function seasonEnd(now) { const S0 = Date.UTC(2026, 10, 15), LEN = 30 * DAY; return S0 + Math.ceil((now - S0 + 1) / LEN) * LEN; }
  function plan() { const P = prefs(), now = Date.now(), out = [];
    // a morning note for the next 3 days, merging what is ready
    for (let k = 0; k < 3; k++) { const t = nextHour(10, now) + k * DAY, d = new Date(t), bits = [];
      if (P.gems) { bits.push('free gems'); if (d.getDay() === 1) bits.push('your weekly gems'); if (monthKey(d) !== monthKey(t - DAY)) bits.push('your 3-week gems'); }
      if (P.daily) bits.push('your login bonus', 'new challenges');
      if (bits.length) out.push({ id: 'morning' + k, at: t, title: 'Wizards vs Sorcerers', body: bits.length > 1 ? bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] + ' are ready.' : bits[0] + ' are ready.' }); }
    if (P.hourly) { const t = nextAt('h', now); if (t > now) out.push({ id: 'hourly', at: t, title: 'A free gem is ready', body: 'Your hourly gem is waiting in the Shop.' }); }
    if (P.rivals && window.MODE_OPEN && MODE_OPEN('fc')) for (let k = 0; k < 2; k++) out.push({ id: 'rivals' + k, at: nextHour(18, now) + k * DAY, title: 'New rivals in the Fight Club', body: 'A fresh board of bounties is up. Wager gems, win more.' });
    if (P.season) { const t = seasonEnd(now) - DAY; if (t > now) out.push({ id: 'season', at: t, title: 'The season ends tomorrow', body: 'Last chance to climb for this season\'s rank rewards.' }); }
    return out; }
  function reschedule() { if (!native()) return; post({ action: 'schedule', items: plan() }); }
  window.NOTIFY_PLAN = plan;
  document.addEventListener('visibilitychange', () => { if (document.hidden) reschedule(); });
  if (native()) setTimeout(() => post({ action: 'status' }), 1500);

  function softAsk() { PR.notifAsked = 1; try { save(); } catch (e) {} $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="nf-ask"><div class="nf-bell">🔔</div><b>Want a nudge?</b><p>Hoot can remind you when your next free gems are ready. You choose what you hear about in Options.</p><button class="upbtn" onclick="notifyAsk()">Remind me</button><button class="upbtn dk2" onclick="closeSheet()">Not now</button></div>`; $('sheet').classList.add('on'); }
  window.notifyAsk = function () { closeSheet(); post({ action: 'ask' }); };
  window.notifySet = function (k, v) { prefs()[k] = !!v; try { save(); } catch (e) {} if (v && NS === 'undetermined') post({ action: 'ask' }); else reschedule(); };
  window.openNotify = function () { const P = prefs(), off = !native() || NS === 'denied';
    const head = !native() ? '<p class="nf-note">Reminders work in the iOS app.</p>' : NS === 'denied' ? '<p class="nf-note">Notifications are off for this app. <button class="nf-link" onclick="webkit.messageHandlers.app.postMessage({action:\'settings\'})">Open iPhone Settings</button></p>' : NS === 'undetermined' ? '<p class="nf-note">Switch one on and your iPhone will ask once.</p>' : '';
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh" id="nfSheet">Notifications</div><div class="ssub" style="margin:0 0 8px">Pick what Hoot reminds you about. Everything is worked out on your phone.</div>${head}
      <div class="opts">${OPTS.map(([k, n, d]) => `<label class="opt nf-opt"><span><b>${n}</b><small>${d}</small></span><input type="checkbox" ${P[k] ? 'checked' : ''} ${off ? 'disabled' : ''} onchange="notifySet('${k}',this.checked)"><i></i></label>`).join('')}</div>`;
    $('sheet').classList.add('on'); };
  // Options gets a Notifications row
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML; window.settingsHTML = function () { return _sh.apply(this, arguments) + '<button class="hbtn out nf-btn" style="width:100%;margin:6px 0" onclick="openNotify()">🔔 Notifications</button>'; }; try { (0, eval)('settingsHTML = window.settingsHTML'); } catch (e) {} }

  const css = document.createElement('style');
  css.textContent = `.fg-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:2px 0 6px}.fg-t{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 7px;border-radius:14px;border:2.5px solid #000;background:linear-gradient(#2c2154,#1c1538);color:#fff;box-shadow:0 3px 0 #000}
  .fg-t small{font:800 11px Nunito;color:#cfc4f2}.fg-g{display:flex;align-items:center;gap:3px;font:19px 'Lilita One'}.fg-g i{width:16px;height:16px;display:grid;place-items:center}.fg-g i svg{width:16px;height:16px}.fg-t b{font:800 11.5px Nunito;color:#cfc4f2;min-height:15px}
  .fg-t.on{background:linear-gradient(#ffe27a,#f0a830);color:#3a1d00}.fg-t.on small{color:#5a3a08}.fg-t.on b{color:#3a1d00;font:14px 'Lilita One';letter-spacing:.4px}.fg-t.on{animation:fgPulse 1.8s ease-in-out infinite}@keyframes fgPulse{50%{transform:translateY(-2px)}}
  .nf-ask{text-align:center;padding:4px 2px}.nf-bell{font-size:40px}.nf-ask b{display:block;font:21px 'Lilita One';font-weight:400;color:#fff;margin:4px 0}.nf-ask p{font:700 14px/1.4 Nunito;color:#d9d0f5;margin:0 0 12px}.nf-ask .upbtn{width:100%;margin-top:6px}
  .nf-opt span{display:flex;flex-direction:column;gap:1px}.nf-opt b{font:800 14px Nunito;color:#fff}.nf-opt small{font:700 12px Nunito;color:#b9a9e6}.nf-note{font:700 13px/1.4 Nunito;color:#ffd45e;margin:0 0 8px}.nf-opt input:disabled~i,.nf-opt:has(input:disabled){opacity:.5}.nf-link{background:none;border:0;color:#9fd8ff;font:800 13px Nunito;text-decoration:underline;padding:0}`;
  document.head.appendChild(css);
  window.V135 = { FREE, nextAt, ready, plan, prefs };
})();
