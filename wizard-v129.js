/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.3
   A shorter first tutorial (only what you need for a first duel and a first upgrade), and short Hoot tips
   the first time you open each other screen. Every tip can be skipped, one screen or all of them.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- (1.0.33.7) landing time ----------------
     After any screen change, and after the opening or round curtain clears, nothing pops up for 1 second:
     no tutorial bubble, no screen tips, no login reward. The scene itself stays live. */
  let shownAt = performance.now(), curtainIdleAt = 0;
  const curtainBusy = () => { const c = $('curtain'); return !!c && c.className !== 'curtain'; };
  setInterval(() => { if (curtainBusy()) curtainIdleAt = 0; else if (!curtainIdleAt) curtainIdleAt = performance.now(); }, 100);
  window.LANDED = () => !curtainBusy() && curtainIdleAt && performance.now() - curtainIdleAt >= 1000 && performance.now() - shownAt >= 1000;
  if (typeof show === 'function') { const _sh = show; window.show = show = function () { shownAt = performance.now(); return _sh.apply(this, arguments); }; }
  // the tutorial waits for the landing too
  if (typeof onbStart === 'function') { const _ob = onbStart; window.onbStart = onbStart = function (from) { if (!window.LANDED()) { setTimeout(() => onbStart(from), 250); return; } return _ob.apply(this, arguments); }; }

  /* ---------------- the core tutorial: name, path, unlock, hand, first duel, spoils, first upgrade ---------------- */
  try { if (typeof ONB_STEPS !== 'undefined') {
      const drop = new Set(['look', 'spells', 'shop', 'friends', 'ranks', 'yard', 'ladder']);
      for (let i = ONB_STEPS.length - 1; i >= 0; i--) if (drop.has(ONB_STEPS[i].id)) ONB_STEPS.splice(i, 1);
      const DOT = { name: 0, path: 1, token: 2, hand: 2, battle: 3, match: 3, spoils: 3, upgrade: 4, upgrade2: 4 }; for (const s of ONB_STEPS) if (DOT[s.id] !== undefined) s.dot = DOT[s.id];
      if (typeof DOT_STEPS !== 'undefined') DOT_STEPS.splice(0, DOT_STEPS.length, 'name', 'path', 'hand', 'battle', 'upgrade');
      const hand = ONB_STEPS.find(s => s.id === 'hand'); if (hand) hand.html = () => `<b class="who">Hoot</b>Your <em>Battle Hand</em>: the 4 abilities you bring to a duel. Tap an ability to add or swap it.<div class="row"><button class="go" data-next>Ready to fight</button></div>`;
      const spoils = ONB_STEPS.find(s => s.id === 'spoils'); if (spoils) spoils.html = () => `<b class="who">Hoot</b>Every ability you used earned <em>skill points</em>. Enough of them levels it up.`;
      const done = ONB_STEPS.find(s => s.id === 'done'); if (done) done.html = () => `<b class="who">Hoot</b>That's all you need, <em>${PR.name}</em>. I'll pop up with a quick tip the first time you open anything new. Take these to get started.<div class="gift"><span class="ci" style="width:22px;height:22px;display:grid">${SVG.gem}</span>+100 gems</div><div class="row"><button class="go" data-finish>Let's duel!</button></div>`;
    } } catch (e) {}

  // (1.0.33.6) the coached first duel also points out the halt button
  try { if (typeof MATCH_TIPS !== 'undefined' && !MATCH_TIPS.halt) MATCH_TIPS.halt = { when: () => isOn('battle') && M.round === 1 && ONB.seen.fight && !!document.getElementById('holdBtn'), target: '#holdBtn', place: 'bottom', text: 'This is <em>Halt</em>. Tap it to stop your next cast for a moment, then tap again to fire. It rests 8 seconds.', ttl: 7 }; } catch (e) {}

  /* ---------------- first-visit tips ---------------- */
  const TOURS = {
    home: [['#battleBtn', 'Tap <em>Battle</em> to duel. Ranked wins earn trophies; Casual is just for fun.'],
      ['#hgBtn', 'Tap me any time for ideas on what to do next.'],
      ['#ldBtn', 'The <em>Ladder</em>: fixed rivals in order. First wins pay gems.'],
      ['#home .stage', 'Your fighter trains here between duels. Tap the dummy to change it.']],
    spells: [['#abTabs', '<em>Spells</em> are wizard abilities, <em>Techniques</em> are sorcerer ones. Mix them freely.'],
      ['#sgrid', 'Tap an ability to see it, level it up, or put it in your hand.']],
    shop: [['#deals', 'Daily deals: skill points for gold. New ones every day.'],
      ['#chests', 'Chests: a pile of skill points spread across your abilities.']],
    friends: [['#flist', 'The <em>Fight Club</em>: tough bounties. Bet gems, win more.'],
      ['.sv-tabs', '<em>Survival</em>: hold out against waves, alone or with a partner.']],
    ranks: [['.tier.here', 'This is you. Ranked wins move you up for rewards.']],
    wardrobe: [['#cats', 'Pick a category, then tap an item to wear it. Locked ones show how to earn them.']],
  };
  const tours = () => (PR.tours = PR.tours || {});
  let T0 = null;   // { id, i }
  let el = null;
  function build() { if (el) return; el = document.createElement('div'); el.id = 'tipT'; el.className = 'onb'; el.innerHTML = '<div class="spot none"></div><div class="tip-shade"></div><div class="bub"></div>'; document.querySelector('.phone').appendChild(el); }
  function startTour(id) { if (!TOURS[id] || tours()[id] || tours().__off) return; if (!window.LANDED()) return; /* tried again by the timers below once the screen has landed */ if (window.ONB_ACTIVE || !(PR.onb && PR.onb.done)) return; tours()[id] = 1; try { save(); } catch (e) {} T0 = { id, i: 0 }; build(); show(); }
  function steps() { return (TOURS[T0.id] || []).filter(s => document.querySelector(s[0]) && document.querySelector(s[0]).offsetParent !== null); }
  function show() { if (!T0) return; const L = steps(); if (T0.i >= L.length) return end(); const [sel, txt] = L[T0.i], last = T0.i === L.length - 1;
    el.classList.remove('hide'); el.style.display = 'block'; const bub = el.querySelector('.bub'); bub.innerHTML = '';
    try { bub.appendChild(owlCanvas()); } catch (e) {}
    const say = document.createElement('div'); say.className = 'say'; say.innerHTML = `<b class="who">Hoot</b>${txt}<div class="row"><button class="go" id="tipNext">${last ? 'Got it' : 'Next'}</button><span class="tip-n">${T0.i + 1} / ${L.length}</span><button class="skip" id="tipSkip">Skip</button><button class="skip" id="tipOff">No more tips</button></div>`; bub.appendChild(say);
    $('tipNext').onclick = e => { e.stopPropagation(); try { sfx('ui_click'); } catch (e2) {} T0.i++; show(); };
    $('tipSkip').onclick = e => { e.stopPropagation(); end(); };
    $('tipOff').onclick = e => { e.stopPropagation(); tours().__off = 1; try { save(); } catch (e2) {} end(); };
    place(sel); }
  function place(sel) { try { if (typeof onbAnchor === 'function') onbAnchor(sel); } catch (e) {}
    const r = typeof onbRect === 'function' ? onbRect(sel) : null, spot = el.querySelector('.spot'), bub = el.querySelector('.bub'), P = document.querySelector('.phone').getBoundingClientRect();
    spot.classList.toggle('none', !r); if (r) Object.assign(spot.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
    const bh = bub.offsetHeight || 130; bub.style.bottom = ''; bub.style.top = !r ? Math.max(20, (P.height - bh) / 2) + 'px' : (r.y + r.h / 2 > P.height / 2 ? Math.max(10, r.y - bh - 14) : Math.min(P.height - bh - 10, r.y + r.h + 14)) + 'px'; }
  function end() { T0 = null; if (el) { el.classList.add('hide'); el.style.display = 'none'; } }
  window.TIP_TOURS = { start: startTour, end, TOURS };
  if (typeof nav === 'function') { const _n = nav; window.nav = nav = function (t) { const r = _n.apply(this, arguments); try { if (T0 && T0.id !== t) end(); [1100, 1600, 2400].forEach(ms => setTimeout(() => { try { if ($(t) && $(t).classList.contains('on') && !document.querySelector('#sheet.on') && !T0) startTour(t); } catch (e) {} }, ms)); } catch (e) {} return r; }; }
  // the home tour also starts when you come back home after the core tutorial
  setInterval(() => { try { if (!T0 && $('home') && $('home').classList.contains('on') && !document.querySelector('#sheet.on') && !window.ONB_ACTIVE && PR.onb && PR.onb.done && !tours().home) startTour('home'); else if (T0) place((steps()[T0.i] || [])[0]); } catch (e) {} }, 700);
  // replaying the tutorial resets the tips too
  if (typeof replayTutorial === 'function') { const _rt = replayTutorial; window.replayTutorial = replayTutorial = function () { PR.tours = {}; try { save(); } catch (e) {} return _rt.apply(this, arguments); }; }

  /* ---------------- (1.0.33.4) tell the player when a new version is out ----------------
     The web game checks the live version quietly (shortly after opening, then every 10 minutes). When a newer one is out:
     Hoot shows it as a ready item with a red dot, it goes into notifications once, and the Help section's button reads
     "New update available" with a red dot. In the iPhone app the files are bundled and updates come from the App Store,
     so there the button keeps its manual check. */
  const native = () => !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.app) || location.protocol === 'app:';
  const vcmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 4; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };
  async function quietCheck() { if (native() || location.hostname === 'localhost') return; try { const r = await fetch(new URL('.', location.href).href + 'wizard-data.js?t=' + Date.now(), { cache: 'no-store' }), m = /GAME_VERSION = '([0-9.]+)'/.exec(await r.text()), live = m && m[1];
      if (live && vcmp(live, GAME_VERSION) > 0) { const first = window.UPDATE_READY !== live; window.UPDATE_READY = live; if (first && PR.updNoted !== live) { PR.updNoted = live; try { save(); if (window.logNote) logNote(`Hoot: version ${live} is out. Tap Hoot or Options › Help to update.`, 'update'); } catch (e) {} } paintUpd(); try { refreshMeta(); } catch (e) {} } } catch (e) {} }
  function paintUpd() { const v = window.UPDATE_READY; if (!v) return; const b = $('updBtn'); if (b && !b.dataset.ready) { b.dataset.ready = 1; b.innerHTML = `★ New update available (${v}) <span class="upd-dot"></span>`; b.classList.add('upd-ready'); }
    document.querySelectorAll('.og-sec[data-g="Help"] > summary b').forEach(h => { if (!h.querySelector('.upd-dot')) h.insertAdjacentHTML('beforeend', ' <span class="upd-dot"></span>'); }); }
  setTimeout(quietCheck, 6000); setInterval(quietCheck, 10 * 60 * 1000);
  if (typeof settingsHTML === 'function') { const _sh3 = settingsHTML; window.settingsHTML = settingsHTML = function () { const h = _sh3.apply(this, arguments); setTimeout(paintUpd, 0); return h; }; }
  window.UPDATE_ITEM = () => window.UPDATE_READY ? { ready: 1, ic: 'gift', t: `Version ${window.UPDATE_READY} is out. Tap to update.`, go: 'checkUpdate()' } : null;

  const css = document.createElement('style');
  css.textContent = `
  #tipT{position:absolute;inset:0;z-index:72;pointer-events:auto;font-family:'Nunito',sans-serif}#tipT.hide{display:none!important}
  #tipT .spot{position:absolute;border-radius:18px;box-shadow:0 0 0 2000px rgba(6,3,18,.72);transition:all .3s cubic-bezier(.3,1.3,.5,1);pointer-events:none}
  #tipT .spot.none{width:0!important;height:0!important;left:50%!important;top:50%!important}
  #tipT .spot:not(.none)::after{content:'';position:absolute;inset:-6px;border-radius:22px;border:3px solid #ffd45e;box-shadow:0 0 18px #ffd45eaa}
  #tipT .bub{position:absolute;left:14px;right:14px;display:flex;gap:10px;align-items:flex-start}
  #tipT .owl{flex:none;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240);border:3px solid #000;box-shadow:0 4px 0 #000}
  #tipT .say{flex:1;background:#fff8e6;color:#2a1a40;border:3px solid #000;border-radius:16px;padding:10px 12px;box-shadow:0 4px 0 #000;font-weight:800;font-size:14.5px;line-height:1.35}
  #tipT .say b.who{display:block;font:15px 'Lilita One';font-weight:400;color:#6a2fc6;letter-spacing:.3px;margin-bottom:2px}#tipT .say em{font-style:normal;color:#b23a0a}
  #tipT .row{display:flex;gap:8px;align-items:center;margin-top:9px;flex-wrap:wrap}
  #tipT .go{font:16px 'Lilita One';color:#2a1600;background:linear-gradient(#ffe27a,#f0a830);border:3px solid #000;border-radius:12px;padding:5px 14px;box-shadow:0 3px 0 #000;cursor:pointer}
  #tipT .skip{font:800 12px Nunito;color:#5a4a7a;background:none;border:none;cursor:pointer;text-decoration:underline;padding:4px}#tipT .row .skip:first-of-type{margin-left:auto}
  .upd-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff4a5a;border:2px solid #000;vertical-align:middle;margin-left:4px;font-style:normal}#updBtn.upd-ready{background:linear-gradient(#ffe27a,#f0a830)!important;color:#2a1600!important}
  #tipT .tip-n{font:800 12px Nunito;color:#5a4a7a}#tipT .tip-shade{display:none}`;
  document.head.appendChild(css);
})();
