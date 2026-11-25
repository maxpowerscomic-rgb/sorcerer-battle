/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.19
   1. Tutorial: "Skip tutorial" lives inside Hoot's bubble (the floating button covered the bubble and sheet ✕ buttons).
   2. New players start with no abilities. The token step suggests the first ability on their path's tab, switches
      tabs when one kind of token runs out, and waits until every token is spent; each unlock fills the Battle Hand.
   3. Replaying the tutorial no longer re-grants path tokens, the welcome gift or a free upgrade.
   4. Skipping: Hoot says the tutorial can be replayed from him. His panel ends with "See the tutorial again".
   5. Toasts: wrap inside the screen, stay 3.5 s, and carry a ✕ ringed by a countdown.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const tokLeft = () => (PR.tokens || 0) + (PR.tokS || 0);

  /* ---------------- 5. toasts ---------------- */
  const TOAST_MS = 3500;
  function toastV139(t) {
    const e = $('toast'); if (!e) return;
    e.innerHTML = `<span class="tst-t"></span><button class="tst-x" aria-label="Dismiss"><svg viewBox="0 0 28 28"><circle class="tst-r0" cx="14" cy="14" r="12"/><circle class="tst-r" cx="14" cy="14" r="12" style="animation-duration:${TOAST_MS}ms"/><path d="M10 10l8 8M18 10l-8 8"/></svg></button>`;
    e.querySelector('.tst-t').textContent = t;
    e.querySelector('.tst-x').onclick = ev => { ev.stopPropagation(); clearTimeout(e._t); e.classList.remove('on'); };
    e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
    clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), TOAST_MS);
  }
  // run the existing chain (it logs the toast), then rebuild the element with the ✕ and the longer timer
  if (typeof window.toast === 'function') { const _prevToast = window.toast; window.toast = function (t) { const r = _prevToast.apply(this, arguments); try { toastV139(t); } catch (e) {} return r; };
    try { (0, eval)('toast = window.toast'); } catch (e) {} }

  /* ---------------- 2. start with nothing: each unlock goes into the hand ---------------- */
  if (typeof unlockSpell === 'function') { const _us = unlockSpell; window.unlockSpell = function (k) { const had = isUnl(k); const r = _us.apply(this, arguments);
      try { if (!had && isUnl(k)) { PR.hand = PR.hand || []; if (PR.hand.length < 4 && !PR.hand.includes(k)) { PR.hand.push(k); save(); } } } catch (e) {} return r; };
    try { (0, eval)('unlockSpell = window.unlockSpell'); } catch (e) {} }

  /* ---------------- 6. cosmetics are bought with gems only ----------------
     Gold items become gems at whichever of 100 or 200 is nearer the gold price (150 or less → 100, more → 200).
     Gem items under 100 rise to 100. Challenge, rank, level, title, Ladder, streak and pass items are unchanged. */
  const COS_GEM_FLOOR = 100;
  try { for (const c in COSMETICS) for (const it of COSMETICS[c]) { const u = it.unlock; if (!u) continue;
      if (u.type === 'coins') it.unlock = { type: 'gems', v: u.v <= 150 ? 100 : 200, wasGold: u.v };
      else if (u.type === 'gems' && u.v < COS_GEM_FLOOR) it.unlock = Object.assign({}, u, { v: COS_GEM_FLOOR, wasGems: u.v }); } } catch (e) { console.warn('v139 cosmetics', e); }

  /* ---------------- 2b. a player with no abilities yet (skipped the tour): chests and deals wait ---------------- */
  const none = () => typeof unlockedSpells === 'function' && unlockedSpells().length === 0;
  if (typeof buyChest === 'function') { const _bc = buyChest; window.buyChest = function () { if (none()) { toast('Unlock an ability first: chests fill your unlocked abilities'); return nav('spells'); } return _bc.apply(this, arguments); }; try { (0, eval)('buyChest = window.buyChest'); } catch (e) {} }
  if (typeof renderShop === 'function') { const _rs = renderShop; window.renderShop = function () { const r = _rs.apply(this, arguments);
      try { if (none()) { const d = $('deals'); if (d) d.innerHTML = '<div class="v139-none">Unlock an ability in <b>Abilities</b> and its deals show up here.</div>'; } } catch (e) {} return r; };
    try { (0, eval)('renderShop = window.renderShop'); } catch (e) {} }

  /* ---------------- 1-4. tutorial ---------------- */
  const SKIP = '<button class="skip v139-skip" data-skip>Skip tutorial</button>';
  const firstLocked = () => [...document.querySelectorAll('#sgrid .scard')].find(c => { const m = /openSpell\('([^']+)'\)/.exec(c.getAttribute('onclick') || ''); return m && SP[m[1]] && !isUnl(m[1]); });
  const keyOf = c => { const m = c && /openSpell\('([^']+)'\)/.exec(c.getAttribute('onclick') || ''); return m ? m[1] : null; };
  const replay = () => !!(PR.pathPick || PR.onbGifted || (PR.chosen || []).length);
  const wantTab = () => (PR.tokens || 0) > 0 ? 'wiz' : 'sorc';
  try { if (typeof ONB_STEPS !== 'undefined') {
      // the floating Skip button is retired; every bubble carries its own (welcome already has one, the final step needs none)
      const path = ONB_STEPS.find(s => s.id === 'path');
      if (path) { const a0 = path.after; path.after = function () { const rp = replay(); a0.apply(this, arguments); if (!rp) return;
          // a replay: the pick only changes the look, the tokens were handed out the first time
          const pick = c => { PR.look.cls = c; save(); refreshMeta(); try { renderWardrobe(); } catch (e) {} setTimeout(onbNext, 300); };
          $('onbWiz').onclick = () => pick('wiz'); $('onbSorc').onclick = () => pick('sorc'); $('onbBoth').onclick = () => pick('wiz');
          document.querySelectorAll('.onb .pth small').forEach(e => e.textContent = 'Already chosen'); }; }
      const tok = ONB_STEPS.find(s => s.id === 'token');
      if (tok) {
        tok.enter = function () { window.abTab = wantTab(); window.abType = 'all'; ONB.tokStart = (PR.chosen || []).length; ONB.tokSeen = tokLeft(); ONB.tokTab = window.abTab; nav('spells'); try { renderSpells(); } catch (e) {} const g = $('sgrid'); if (g) { let sc = g.parentElement; while (sc && sc.scrollHeight <= sc.clientHeight + 1) sc = sc.parentElement; if (sc) sc.scrollTop = 0; } };
        tok.target = '#sgrid'; tok.place = 'top';
        tok.html = () => { const sp = PR.tokens || 0, te = PR.tokS || 0, c = firstLocked(), k = keyOf(c), kind = sp > 0 ? 'spell' : 'technique';
          const have = sp > 0 && te > 0 ? `${sp} Spell Token${sp > 1 ? 's' : ''} and ${te} Technique Token${te > 1 ? 's' : ''}` : sp > 0 ? `${sp} Spell Token${sp > 1 ? 's' : ''}` : `${te} Technique Token${te > 1 ? 's' : ''}`;
          const first = (PR.chosen || []).length === ONB.tokStart;
          return `<b class="who">Hoot</b>${first ? 'Every ability starts locked. ' : ''}You have <em>${have}</em>. Tap a locked ${kind}, then <em>Unlock</em> it.${k ? ` Not sure? Try <em>${SP[k].n}</em>.` : ''} Each one you unlock goes into your <em>Battle Hand</em>.`; };
        // every reveal card closes by itself; the tab follows the tokens left; the bubble keeps the count current
        tok.guard = function () { const sg = firstLocked(); document.querySelectorAll('#sgrid .v139-sug').forEach(c => (c !== sg || !tokLeft()) && c.classList.remove('v139-sug')); if (sg && tokLeft() > 0) sg.classList.add('v139-sug');
          const up = $('upm'), open = up && getComputedStyle(up).display !== 'none';
          if (open && (PR.chosen || []).length > (ONB.tokAuto2 || ONB.tokStart)) { ONB.tokAuto2 = (PR.chosen || []).length; setTimeout(() => { const b = $('upOk'); if (b) b.click(); }, 1300); }
          if (tokLeft() !== ONB.tokSeen && !modalOpen()) { ONB.tokSeen = tokLeft(); if (tokLeft() > 0) { const t = wantTab(); if (t !== window.abTab) { window.abTab = t; try { renderSpells(); } catch (e) {} } onbRenderBubble(); } } };
        tok.until = () => !modalOpen() && (tokLeft() === 0 || ((PR.hand || []).length >= 4 && (PR.chosen || []).length > ONB.tokStart));
      }
      const hand = ONB_STEPS.find(s => s.id === 'hand');
      if (hand) { hand.enter = function () { nav('spells'); try { if (typeof fixHand === 'function') fixHand(); renderSpells(); } catch (e) {} }; }
      const done = ONB_STEPS.find(s => s.id === 'done');
      if (done) { const h0 = done.html; done.html = function () { let h = h0.apply(this, arguments); if (PR.onbGifted) h = h.replace(/<div class="gift">[\s\S]*?<\/div>/, '').replace('Take these to get started.', ''); return h; }; }
      // a replay with nothing ready to level skips the coached upgrade instead of handing out a free level
      const upg = ONB_STEPS.find(s => s.id === 'upgrade');
      if (upg && typeof onbPrepUpgrade === 'function') { const _pu = onbPrepUpgrade; window.onbPrepUpgrade = function () { if (!PR.onbUpFree && !PR.onbGifted) { PR.onbUpFree = 1; return _pu.apply(this, arguments); }
          const k = (PR.hand || []).find(k => PR.spells[k].lvl < MAXL && PR.spells[k].cards >= CARDS[PR.spells[k].lvl] && PR.coins >= COST[PR.spells[k].lvl]);
          if (k) { ONB.upK = k; ONB.upFrom = PR.spells[k].lvl; return; } ONB.upK = null; };
        (0, eval)('onbPrepUpgrade = window.onbPrepUpgrade');
        const e0 = upg.enter; upg.enter = function () { onbPrepUpgrade(); if (!ONB.upK) { ONB.upSkip = 1; return; } window.abTab = SCHOOL_OF(ONB.upK); nav('spells'); };
        upg.until = (u0 => () => ONB.upSkip ? true : u0())(upg.until);
        const up2 = ONB_STEPS.find(s => s.id === 'upgrade2'); if (up2) { const g0 = up2.until, gd = up2.guard; up2.until = () => ONB.upSkip ? (ONB.upSkip = 0, true) : g0(); up2.guard = () => { if (!ONB.upSkip) gd(); }; }
      }
      // last, so it also wraps the bubbles replaced above
      for (const s of ONB_STEPS) { if (!s.html || s.id === 'welcome' || s.id === 'done') continue; const h0 = s.html; s.html = function () { const h = h0.apply(this, arguments); return h + `<div class="row v139-sk">${SKIP}</div>`; }; }
    } } catch (e) { console.warn('v139 onboarding', e); }

  // the gift is paid once per save (PR.onbGifted survives a replay) and is now 50 gems
  try { if (PR.onb && PR.onb.gifted) PR.onbGifted = 1; } catch (e) {}
  if (typeof onbFinish === 'function') { const _of = onbFinish; window.onbFinish = function (skipped) {
      if (PR.onbGifted && PR.onb) PR.onb.gifted = 1;
      const pre = PR.gems || 0, r = _of.apply(this, arguments);
      try { if ((PR.gems || 0) > pre) { PR.onbGifted = 1; save(); } } catch (e) {}
      if (skipped) setTimeout(() => { try { window.V133 && V133.say("Skipped! Tap me any time and choose 'See the tutorial again' to replay it."); } catch (e) {} }, 600);
      return r; };
    (0, eval)('onbFinish = window.onbFinish'); }

  /* ---------------- 4. Hoot's panel ends with the tutorial ---------------- */
  if (window.openHootGoals) { const _og = openHootGoals; window.openHootGoals = function () { const r = _og.apply(this, arguments);
      try { const list = document.querySelector('#sheetP .hg-list'); if (list && !list.querySelector('.v139-tut')) list.insertAdjacentHTML('beforeend', `<div class="hh-sep"></div><button class="hg-row hh-row v139-tut" onclick="closeSheet();replayTutorial()"><i>🦉</i><span>See the tutorial again</span><em>Replay</em></button>`); } catch (e) {}
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `#onbSkipAll{display:none!important}
  .onb .v139-sk{margin-top:4px;justify-content:flex-end}.onb .v139-sk .skip{margin-left:auto}
  .onb .row:not(.v139-sk) + .v139-sk{margin-top:2px}
  #sgrid .scard.v139-sug{outline:3px solid #ffd45e;outline-offset:2px;animation:v139Sug 1.1s ease-in-out infinite}@keyframes v139Sug{50%{outline-color:#ffd45e55;transform:scale(1.03)}}
  /* the 👁 peek button no longer sits on the end of long draft titles */
  #draft #draftTitle,#order .h1{padding-left:48px;padding-right:48px;box-sizing:border-box;text-wrap:balance}
  /* wardrobe: the title line sat under the name plate; it now sits just below it */
  .wstage > #wdTitle{position:absolute;left:0;right:0;top:40px;z-index:2;margin:0;justify-content:center}
  /* Hoot's floating button sits above the tab bar on every screen but Home: let lists scroll their last row clear of him */
  #shop > .mc,#spells > .mc,#ranks > .mc,#wardrobe > .mc,#friends > .mc{padding-bottom:160px}
  .v139-none{grid-column:1/-1;padding:14px;text-align:center;font:800 13px Nunito;color:#d8cdee}
  #toast.toast{box-sizing:border-box;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 24px);display:none;align-items:center;gap:8px;padding:7px 8px 7px 14px;line-height:1.2;pointer-events:auto}
  #toast.toast.on{display:flex;animation:tstPop .3s}
  @keyframes tstPop{from{transform:translateX(-50%) scale(.6);opacity:0}}
  #toast .tst-t{flex:1;min-width:0;overflow-wrap:anywhere}
  #toast .tst-x{flex:none;width:28px;height:28px;padding:0;border:none;background:none;cursor:pointer}
  #toast .tst-x svg{width:28px;height:28px;display:block}
  #toast .tst-r0{fill:#ffffff1c;stroke:#ffffff33;stroke-width:2.5}
  #toast .tst-r{fill:none;stroke:#ffd45e;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:75.4;stroke-dashoffset:0;transform:rotate(-90deg);transform-origin:14px 14px;animation-name:tstRing;animation-timing-function:linear;animation-fill-mode:forwards}
  #toast .tst-x path{stroke:#fff;stroke-width:2.6;stroke-linecap:round}
  @keyframes tstRing{to{stroke-dashoffset:75.4}}`;
  document.head.appendChild(css);
  window.V139 = { toast: toastV139, firstLocked };
})();
