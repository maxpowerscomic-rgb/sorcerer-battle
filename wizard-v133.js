/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.13
   1. Modes open with player level: the Club (Survival) at level 2, the Fight Club's bounties at level 4.
      Anyone who has already played either keeps it.
   2. Hoot is the help button. He sits bottom-right on every menu screen (on home, in his usual spot on the stage).
      A red dot means he has something new: a lesson for the screen you are on that you have not seen, or a mode that just opened.
      His panel lists those first ("Learn about the Fight Club", "New: Survival"), then his usual suggestions.
      Screens no longer start a tutorial on their own.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOCK = { sv: 2, fc: 4 };
  const NAME = { sv: 'Survival', fc: 'the Fight Club' };
  const lvl = () => (typeof PR !== 'undefined' && PR.lvl) || 1;
  const unl = () => (PR.unl = PR.unl || {});
  // a player who has already been in either mode keeps it
  try { if (Array.isArray(PR.svBest) && PR.svBest.length) unl().sv = 1; if (PR.club && ((PR.club.won || []).length || PR.club.clear)) { unl().fc = 1; unl().sv = 1; } } catch (e) {}
  const open = id => lvl() >= LOCK[id] || !!unl()[id];
  window.MODE_OPEN = open;

  /* ---------------- lessons: what Hoot can teach on each screen ---------------- */
  const TT = window.TIP_TOURS && TIP_TOURS.TOURS;
  if (TT) { delete TT.friends;
    TT.survival = [['.sv-modes', '<em>3 Waves</em> ends after the third wave. <em>Endless</em> runs until you fall once.'], ['.sv-kinds', 'Pick who you fight: zombies, beasts or casters. Each brings its own tricks.'], ['.sv-opts', 'Bring a partner if you like. It drafts its own upgrades and you can revive it.'], ['.sv-go', 'Ready? Tap <em>Survive</em>. Gold is paid for kills.']];
    TT.fightclub = [['#flist', 'The <em>Fight Club</em>: tough bounties above your level. Pay a gem entry; beat it for a bigger gem prize.'], ['#flist > *', 'Beat all of a set for a big gem prize. Star a beaten bounty to rematch it for gold.']]; }
  const LESSON = { home: ['home', 'the training yard and home'], spells: ['spells', 'your abilities'], shop: ['shop', 'the shop'], ranks: ['ranks', 'ranks'], wardrobe: ['wardrobe', 'the wardrobe'] };
  const cur = () => { const s = document.querySelector('.screen.on'); return s ? s.id : ''; };
  function lessonHere() { const sc = cur(); if (sc === 'friends') { if (!open('sv') && !open('fc')) return null; return PR.clubTab === 'sv' || !open('fc') ? ['survival', 'Survival'] : ['fightclub', 'the Fight Club']; } return LESSON[sc] || null; }
  const seen = id => !!(PR.tours && PR.tours[id]);
  window.hootLearn = function (id) { try { closeSheet(); } catch (e) {} if (!window.TIP_TOURS) return; PR.tours = PR.tours || {}; delete PR.tours[id]; const off = PR.tours.__off; PR.tours.__off = 0;
    setTimeout(() => { try { TIP_TOURS.start(id); } catch (e) {} if (off) PR.tours.__off = off; try { save(); } catch (e) {} paintDot(); }, 250); };

  /* ---------------- news: a mode just opened ---------------- */
  const news = () => (PR.hootNews = Array.isArray(PR.hootNews) ? PR.hootNews : []);
  function checkUnlocks() { for (const id of ['sv', 'fc']) { if (lvl() >= LOCK[id] && !unl()[id]) { unl()[id] = 1; news().push({ id, read: 0 }); try { save(); } catch (e) {} say(id === 'sv' ? 'Survival is open in the Club! Tap me.' : 'The Fight Club is open! Tap me.'); } } paintTab(); }
  const unread = () => news().filter(n => !n.read);

  /* ---------------- locks on the Club ---------------- */
  if (typeof nav === 'function') { const _n = nav; window.nav = nav = function (t) {
      if (t === 'friends' && !open('sv') && !open('fc')) { lockedSheet(); return; }
      if (t === 'friends' && !open('fc')) PR.clubTab = 'sv';
      const r = _n.apply(this, arguments); setTimeout(paintDot, 60); return r; }; }
  if (window.svTab) { const _st = svTab; window.svTab = function (t) { if (t === 'club' && !open('fc')) { try { toast(`The Fight Club opens at player level ${LOCK.fc}`); sfx('ui_error'); } catch (e) {} return; } const r = _st.apply(this, arguments); setTimeout(paintDot, 60); return r; }; }
  function lockedSheet() { try { sfx('ui_click'); } catch (e) {} $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="hh-lock"><div class="hh-lk">${(typeof SVG !== 'undefined' && SVG.lock) || '🔒'}</div><b>The Club opens at player level ${LOCK.sv}</b><p>Level ${LOCK.sv}: <em>Survival</em>, waves of enemies alone or with a partner.<br>Level ${LOCK.fc}: <em>the Fight Club</em>, tough bounties for gems.</p><p class="hh-now">You are level ${lvl()}. Every match earns XP.</p><button class="upbtn" onclick="closeSheet()">Got it</button></div>`; $('sheet').classList.add('on'); }
  function paintTab() { const b = document.querySelector('.tab[data-t="friends"]'); if (!b) return; const lk = !open('sv') && !open('fc'); b.classList.toggle('hh-locked', lk);
    let i = b.querySelector('.hh-tl'); if (lk && !i) { b.insertAdjacentHTML('beforeend', `<span class="hh-tl">${(typeof SVG !== 'undefined' && SVG.lock) || ''}</span>`); } else if (!lk && i) i.remove(); }
  // the Bounties tab inside the Club shows its lock until level 4
  function paintClubTabs() { const t = document.querySelector('#friends .sv-tabs'); if (!t) return; const b = t.querySelector('button'); if (!b) return; const lk = !open('fc'); b.classList.toggle('hh-off', lk); if (lk && !b.querySelector('.hh-sm')) b.insertAdjacentHTML('beforeend', `<small class="hh-sm">Level ${LOCK.fc}</small>`); else if (!lk) { const s = b.querySelector('.hh-sm'); if (s) s.remove(); }
    if (lk && PR.clubTab !== 'sv') { PR.clubTab = 'sv'; try { svTab('sv'); } catch (e) {} } }

  /* ---------------- Hoot's button on every menu screen ---------------- */
  function btn() { const ph = document.querySelector('.phone'); if (!ph) return null; let b = $('hhBtn'); if (!b) { ph.insertAdjacentHTML('beforeend', '<button id="hhBtn" onclick="openHootGoals()" aria-label="Hoot: help and lessons"><canvas width="96" height="96"></canvas><i></i></button><div id="hhSay"></div>'); b = $('hhBtn'); } return b; }
  function want() { const sc = cur(); const tb = $('tabbar'); return sc && sc !== 'home' && tb && tb.classList.contains('on') && !window.ONB_ACTIVE && !document.querySelector('#sheet.on'); }
  function dotOn() { const L = lessonHere(); return unread().length > 0 || !!(L && !seen(L[0])); }
  function paintDot() { const b = btn(); if (!b) return; b.style.display = want() ? '' : 'none'; const on = dotOn(); b.classList.toggle('hh-new', on); const h = $('hgBtn'); if (h) h.classList.toggle('hh-new', on); paintTab(); paintClubTabs(); }
  // what Hoot says waits until one of his buttons is on screen (an unlock usually lands on the rewards screen)
  let sayT = 0, pend = null; function say(t) { pend = t; }
  function sayNow(t) { const s = $('hhSay') || (btn(), $('hhSay')); if (!s) return; s.textContent = t; s.classList.add('on'); clearTimeout(sayT); sayT = setTimeout(() => s.classList.remove('on'), 5200); }
  function face() { const b = $('hhBtn'); if (!b || b.style.display === 'none') return; const c = b.querySelector('canvas'); try { const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 96, 96); x.translate(48, 104); x.scale(2, 2); drawPet(x, 'owl', performance.now() / 1000, 1); } catch (e) {} }
  setInterval(() => { try { if (!document.hidden) face(); } catch (e) {} }, 83);   // (1.0.33.25) a light 12 fps timer, not a 60 fps frame loop; face() skips when the button is hidden
  setInterval(() => { try { checkUnlocks(); paintDot(); } catch (e) {} }, 700);
  // the Hoot bubble sits by whichever Hoot button is showing
  setInterval(() => { try { if (pend) { const tg = want() ? $('hhBtn') : $('hgBtn'); if (tg && tg.offsetParent && !document.querySelector('#sheet.on') && !window.ONB_ACTIVE && (!window.LANDED || LANDED())) { sayNow(pend); pend = null; } } const s = $('hhSay'); if (!s || !s.classList.contains('on')) return; const tgt = want() ? $('hhBtn') : $('hgBtn'); const ph = document.querySelector('.phone').getBoundingClientRect(); if (!tgt || !tgt.offsetParent) { s.classList.remove('on'); return; } const r = tgt.getBoundingClientRect(); s.style.right = (ph.right - r.left + 8) + 'px'; s.style.top = (r.top - ph.top + r.height / 2) + 'px'; } catch (e) {} }, 120);

  /* ---------------- his panel: new things and lessons first ---------------- */
  if (window.openHootGoals) { const _og = openHootGoals; window.openHootGoals = function () { const r = _og.apply(this, arguments);
      try { const list = document.querySelector('#sheetP .hg-list'); if (list) { let h = ''; const L = lessonHere();
          for (const n of unread()) h += `<button class="hg-row ready hh-row" onclick="hootNewsGo('${n.id}')"><i>✨</i><span><b class="hh-tag">New</b> ${n.id === 'sv' ? '<em>Survival</em> is open in the Club: hold out against waves, alone or with a partner.' : '<em>The Fight Club</em> is open: tough bounties with gem prizes.'}</span><em>Go</em></button>`;
          if (L) h += `<button class="hg-row${seen(L[0]) ? '' : ' ready'} hh-row" onclick="hootLearn('${L[0]}')"><i>🎓</i><span>${seen(L[0]) ? 'Show me' : 'Learn about'} ${L[1]}${seen(L[0]) ? ' again' : ''}</span><em>${seen(L[0]) ? 'Replay' : 'Start'}</em></button>`;
          if (h) list.insertAdjacentHTML('afterbegin', h + '<div class="hh-sep"></div>'); } } catch (e) {}
      return r; }; }
  window.hootNewsGo = function (id) { for (const n of news()) if (n.id === id) n.read = 1; try { save(); closeSheet(); } catch (e) {} PR.clubTab = id === 'sv' ? 'sv' : 'club'; nav('friends'); setTimeout(paintDot, 100); };
  // Survival is only suggested once it is open
  if (window.openHootGoals && typeof show === 'function') { /* the goals list is built inside v127; strip the Survival row while locked */ const _og2 = openHootGoals; window.openHootGoals = function () { const r = _og2.apply(this, arguments); try { if (!open('sv')) document.querySelectorAll('#sheetP .hg-row').forEach(b => { if (/Survival/.test(b.textContent) && !b.classList.contains('hh-row')) b.remove(); }); } catch (e) {} return r; }; }

  /* ---------------- Survival's opening: it searches for your partner, not a rival ---------------- */
  const HORDE = '<svg viewBox="0 0 24 24" width="96" height="96"><path d="M12 3C7 3 4 6.500 4 10.500c0 2.300 1.100 4 2.600 5V19h2.400v-2h2v2h2v-2h2v2H17v-3.500c1.500-1 3-2.700 3-5C20 6.500 17 3 12 3z" fill="#9fdc7a" stroke="#000" stroke-width="1.400" stroke-linejoin="round"/><circle cx="9" cy="11" r="2" fill="#000"/><circle cx="15" cy="11" r="2" fill="#000"/></svg>';
  if (typeof showVs === 'function') { const _sv = showVs; window.showVs = showVs = function () { const S = window.SV_VS; window.SV_VS = null; const r = _sv.apply(this, arguments);
      try { if (S) { const card = document.querySelector('#car .ci2.win'), find = $('vsFind'), K = { zombie: 'Zombies', zodiac: 'Beasts', caster: 'Casters' }[S.kind] || 'the horde';
          const m = document.querySelector('#vsMeInfo .vsm'); if (m) m.textContent = 'Survival · ' + K;
          if (S.pt) { find.textContent = 'Finding your partner…'; if (card) { const c = card.querySelector('canvas'); try { drawAva(c, lookWiz(S.pt.look)); } catch (e) {} const b = card.querySelector('b'); if (b) b.textContent = S.pt.n; } }
          else { find.textContent = 'Going in alone…'; if (card) { const c = card.querySelector('canvas'); if (c) c.outerHTML = `<div class="hh-horde">${HORDE}</div>`; const b = card.querySelector('b'); if (b) b.textContent = 'The Horde'; } }
          const mo = new MutationObserver(() => { if (/Opponent found/.test(find.textContent)) { mo.disconnect(); find.textContent = S.pt ? 'Partner found!' : 'The horde is waiting'; const pf = $('vsProf'); if (pf) pf.innerHTML = `<span>${S.pt ? esc(S.pt.n) + ' fights beside you' : K + ' · ' + (M.sv && M.sv.endless ? 'Endless' : '3 Waves')}</span>`; } });
          mo.observe(find, { childList: true, characterData: true, subtree: true }); setTimeout(() => mo.disconnect(), 8000); } } catch (e) {}
      return r; }; }

  /* ---------------- randomize my battle hand ---------------- */
  const school = k => (typeof SCHOOL_OF === 'function' ? SCHOOL_OF(k) : 'wiz');
  function poolFor(m) { const un = (typeof unlockedSpells === 'function' ? unlockedSpells() : []).filter(k => SP[k]); return m === 'spells' ? un.filter(k => school(k) === 'wiz') : m === 'tech' ? un.filter(k => school(k) === 'sorc') : un; }
  function pick4(pool, fill) { const out = [], sh = a => a.slice().sort(() => Math.random() - .5), V = window.VARIANTS || {};
    const clash = k => out.some(q => (V[k] && V[k].base === q) || (V[q] && V[q].base === k));
    for (const k of sh(pool)) { if (out.length >= 4) break; if (!clash(k)) out.push(k); }
    let topped = 0; if (out.length < 4 && fill) for (const k of sh(fill)) { if (out.length >= 4) break; if (!out.includes(k) && !clash(k)) { out.push(k); topped++; } }
    return { out, topped }; }
  window.openRandomHand = function () { const n = m => poolFor(m).length, none = !n('all'), row = (m, t, d) => `<button class="hh-rh" onclick="randomHand('${m}')" ${none ? 'disabled style="opacity:.45"' : ''}><b>${t}</b><small>${d} · ${n(m)} unlocked</small><i>🎲</i></button>`;
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Randomize my hand</div><div class="ssub" style="margin:0 0 10px">Deal a random battle hand of 4 from what you have unlocked.</div>${none ? '<div class="ssub" style="margin:0 0 10px;color:#ffd45e">Unlock an ability first: spend a token on any ability on this page.</div>' : ''}
      ${row('all', 'Everything', 'Spells and techniques')}${row('spells', 'Spells only', 'Wizard abilities')}${row('tech', 'Techniques only', 'Sorcerer abilities')}`;
    $('sheet').classList.add('on'); try { sfx('ui_click'); } catch (e) {} };
  window.randomHand = function (m) { const pool = poolFor(m), { out, topped } = pick4(pool, m === 'all' ? null : poolFor('all')); if (!out.length) return toast('Unlock an ability first: spend a token on any ability on the Abilities page.');
    PR.hand = out; try { save(); sfx('ui_deal'); } catch (e) {} try { closeSheet(); refreshMeta(); if ($('spells').classList.contains('on')) renderSpells(); } catch (e) {}
    toast(topped ? `Only ${4 - topped} ${m === 'tech' ? 'techniques' : 'spells'} unlocked: topped up with ${topped} more` : 'New hand: ' + out.map(k => SP[k].n).join(', ')); };
  function rhBtn() { const d = document.querySelector('#spells .decks'); if (!d || d.querySelector('.hh-rhb')) return; const lbl = d.querySelector('.dkl'); (lbl || d).insertAdjacentHTML(lbl ? 'afterend' : 'afterbegin', '<button class="dk add hh-rhb" onclick="openRandomHand()">🎲 Randomize</button>'); }
  if (typeof renderSpells === 'function') { const _rs = renderSpells; window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments); try { rhBtn(); } catch (e) {} return r; }; }
  setInterval(() => { try { if ($('spells') && $('spells').classList.contains('on')) rhBtn(); } catch (e) {} }, 500);

  const css = document.createElement('style');
  css.textContent = `#hhBtn{position:absolute;right:12px;bottom:96px;z-index:30;width:54px;height:54px;border-radius:50%;border:3px solid #000;padding:0;overflow:visible;background:radial-gradient(circle at 40% 35%,#6a54b8,#2a1f55);box-shadow:0 3px 0 #000,0 6px 14px #0008}
  .phone:has(#sheet.on) #hhBtn,.phone:has(#tipT[style*="block"]) #hhBtn{display:none!important}.hh-lock .upbtn{width:100%;margin-top:4px}
  #hhBtn canvas{width:100%;height:100%;border-radius:50%;display:block}#hhBtn i,#hgBtn.hh-new i{display:none;position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#ff4a5a;border:2px solid #000}
  #hhBtn.hh-new i,#hgBtn.hh-new i{display:block;animation:hhPing 1.6s ease-in-out infinite}@keyframes hhPing{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
  #hhSay{position:absolute;z-index:31;transform:translateY(-50%);max-width:200px;background:#fff8e6;color:#2a1a10;border:2.5px solid #000;border-radius:14px;padding:8px 11px;font:800 13px/1.25 Nunito,sans-serif;box-shadow:0 3px 0 #000;opacity:0;pointer-events:none;transition:opacity .25s}#hhSay.on{opacity:1}
  .hh-tag{font:12px 'Lilita One';font-weight:400;letter-spacing:.4px;color:#2a1a10;background:#ffd45e;border:1.5px solid #000;border-radius:6px;padding:0 5px;margin-right:3px}.hh-sep{height:1px;background:#ffffff22;margin:4px 2px}
  .tab.hh-locked{opacity:.55;position:relative}.hh-tl{position:absolute;top:4px;right:calc(50% - 22px);width:16px;height:16px;display:grid;place-items:center}.hh-tl svg{width:14px;height:14px}
  #friends .sv-tabs button.hh-off{opacity:.6}.hh-sm{display:block;font:800 10.5px Nunito;color:#ffd45e;margin-top:1px}
  .hh-horde{width:100%;aspect-ratio:1;display:grid;place-items:center;background:radial-gradient(circle,#3b5a2c,#141f10);border-radius:inherit}.hh-horde svg{width:70%;height:70%}
.hh-rh{display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin:0 0 8px;padding:12px 14px;border-radius:14px;border:2.5px solid #000;background:linear-gradient(#3a2d70,#261c4e);color:#fff;box-shadow:0 3px 0 #000}.hh-rh b{font:17px 'Lilita One';font-weight:400;letter-spacing:.3px;display:block}.hh-rh small{font:800 12px Nunito;color:#cfc4f2;display:block}.hh-rh>span,.hh-rh b+small{flex:1}.hh-rh i{font-style:normal;font-size:22px;margin-left:auto}
  .hh-lock{text-align:center;padding:6px 4px 2px}.hh-lock b{display:block;font:20px 'Lilita One';font-weight:400;color:#fff;margin:8px 0 6px}.hh-lock p{font:700 14px/1.4 Nunito;color:#d9d0f5;margin:0 0 10px}.hh-lock em{color:#ffd45e;font-style:normal}.hh-lock .hh-now{color:#b9f5c9;font-size:13px}.hh-lk{width:46px;height:46px;margin:0 auto;display:grid;place-items:center}.hh-lk svg{width:40px;height:40px}`;
  document.head.appendChild(css);
  window.V133 = { LOCK, open, checkUnlocks, paintDot, say, lessonHere };
})();
