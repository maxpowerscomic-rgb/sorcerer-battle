/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.5, second part
   1. Win streak: +25 gold per win in a row on each win (from 2 in a row, capped at 250), a flame badge
      on the home screen and the reward screen. Best streaks unlock cosmetics (see wizard-cosmetics.js).
   2. Saved hands: keep up to 8 favourite Battle Hands with a name and an icon.
   3. Hand rating: stars, one sentence on what the hand does well and one on its biggest gap.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- 1. win streak ---------------- */
  const STEP = 25, CAP = 250, FROM = 2;
  const streakGold = n => n >= FROM ? Math.min(CAP, STEP * n) : 0;
  window.streakGold = streakGold;
  window.ECON = Object.assign(window.ECON || {}, { streakStep: STEP, streakCap: CAP, winGold: 60 });
  const FLAME = `<svg viewBox="0 0 24 24" class="stkf"><path d="M12 1.5c1 4-3.2 5.6-3.2 9.3 0 .9.3 1.7.8 2.3-.2-2 1-3.1 2-4 .3 2.6 3 3.4 3 6.3 0 .5-.1 1-.3 1.5 1.6-.9 2.7-2.6 2.7-4.6 0-4.4-3.6-5.7-5-10.800z" fill="none"/><path d="M12.4 1.2c.9 4.3-4.9 6-4.9 11.300a6.500 6.500 0 0 0 13 0c0-2.600-1.300-4.500-2.500-5.900-.2 1.500-.8 2.500-1.700 3.100.2-3.600-1.700-6.600-3.900-8.500z" fill="#ff6a1f" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/><path d="M12.300 10.200c.4 2.300-2.200 3.100-2.200 5.500a2.900 2.900 0 0 0 5.800 0c0-2.200-2.100-3.300-3.600-5.500z" fill="#ffd45e"/></svg>`;
  const curStreak = () => (typeof PR !== 'undefined' && PR.stats && PR.stats.streak) || 0;

  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () {
      const fresh = typeof M !== 'undefined' && M && !M._stkDone, was = curStreak(), bestWas = (PR.stats && PR.stats.best) || 0;
      const r = _sr.apply(this, arguments);
      try {
        if (fresh) { M._stkDone = 1; M._stk = null; const won = M.score.me > M.score.foe, n = curStreak(), best = (PR.stats && PR.stats.best) || 0;
          if (won && !M.practice) { const g = streakGold(n), got = []; if (bestWas < 10 && best >= 10) got.push('Cinder Fox pet'); if (bestWas < 20 && best >= 20) got.push('Wildfire aura and Blaze trail');
            if (g || got.length) { PR.coins += g; M._stk = { n, g, got }; try { save(); } catch (e) {} } }
          else if (!won && was >= FROM) M._stk = { lost: was }; }
        runePill();
        const row = $('rwRow'), old = $('rwStk'); if (old) old.remove(); document.querySelectorAll('#rewards .stknote').forEach(e => e.remove());
        const s = M && M._stk; if (row && s) {
          if (s.g) { row.insertAdjacentHTML('beforeend', `<div class="rwbox stkbox" id="rwStk" style="animation-delay:.5s">${FLAME}<div class="v">+${s.g}</div><div class="k">STREAK ×${s.n}</div></div>`); setTimeout(() => { try { sfx('ui_coin', { rate: 1.25 }); } catch (e) {} }, 1300); }
          const notes = []; if (s.g) notes.push(s.g >= CAP ? `${s.n} wins in a row. The streak bonus is at its ${CAP} gold cap.` : `${s.n} wins in a row. Win the next one for +${streakGold(s.n + 1)} gold.`);
          if (s.got && s.got.length) notes.push(`<b>Unlocked:</b> ${s.got.join(', ')}. Find ${s.got.length > 1 || /and/.test(s.got[0]) ? 'them' : 'it'} in the wardrobe.`);
          if (s.lost) notes.push(`Your streak of ${s.lost} is over. Two wins in a row starts the bonus again.`);
          if (notes.length) row.insertAdjacentHTML('afterend', `<div class="stknote">${notes.map(t => `<span>${t}</span>`).join('')}</div>`); }
      } catch (e) { try { window.logCrash && logCrash(e, 'streak'); } catch (e2) {} }
      return r;
    }; }

  // the results screen shows how many Echo Runes you hold, next to the score
  const RUNE = '<svg viewBox="0 0 24 24" class="mtk"><path d="M12 1.8 19.6 6v12L12 22.2 4.4 18V6z" fill="#5b3bd1" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 4.6 17 7.4v9.2L12 19.4 7 16.6V7.4z" fill="#8a6bff"/><path d="M12 7.5v9M9 9.5l3 2 3-2M9 13.5l3 2 3-2" fill="none" stroke="#f3ecff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function runePill() { const sc = $('rwScore'); if (!sc) return; let p = $('rwRune'); if (!p) { sc.insertAdjacentHTML('beforeend', `<span id="rwRune" onclick="toast('Echo Runes double the skill points one ability earned. Tap ×2 on a card below.')">${RUNE}<b></b></span>`); p = $('rwRune'); }
    const n = PR.mTok || 0; p.querySelector('b').textContent = '×' + n; p.classList.toggle('zero', !n); }
  { const _omu = window.onMasteryUsed; window.onMasteryUsed = function () { try { if (_omu) _omu.apply(this, arguments); } catch (e) {} try { runePill(); const p = $('rwRune'); if (p) { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } } catch (e) {} }; }

  // home screen badge
  function badge() { const stage = document.querySelector('#home .stage'); if (!stage) return; let b = $('stkBtn');
    if (!b) { stage.insertAdjacentHTML('beforeend', `<button class="chbtn" id="stkBtn" onclick="streakInfo()">${FLAME}<b></b></button>`); b = $('stkBtn'); }
    const n = curStreak(); b.style.display = n >= FROM ? '' : 'none'; b.querySelector('b').textContent = '×' + n; b.classList.toggle('hot', n >= 5); b.classList.toggle('max', streakGold(n) >= CAP); }
  window.streakInfo = function () { const n = curStreak(), best = (PR.stats && PR.stats.best) || 0, next = streakGold(n + 1);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Win streak</div>
      <div class="stkhero">${FLAME}<b>×${n}</b></div>
      <div class="ssub" style="margin:0">${n >= FROM ? `You have won ${n} in a row.` : 'Win two matches in a row to start a streak.'} Your next win pays <b style="color:#ffd45e">+${next} gold</b> on top${streakGold(n) >= CAP ? ' (the cap)' : ''}. Each win in a row adds ${STEP}, up to ${CAP}. A loss resets it.</div>
      <div class="stkgoals"><div class="${best >= 10 ? 'ok' : ''}"><b>10 in a row</b><span>Cinder Fox pet</span><em>${best >= 10 ? '✓' : Math.min(best, 10) + ' / 10'}</em></div><div class="${best >= 20 ? 'ok' : ''}"><b>20 in a row</b><span>Wildfire aura · Blaze trail</span><em>${best >= 20 ? '✓' : Math.min(best, 20) + ' / 20'}</em></div></div>
      <div class="ssub" style="margin:6px 0 0;font-size:11px">Best streak: ${best}</div>`;
    $('sheet').classList.add('on'); };
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { badge(); } catch (e) {} return r; }; }

  /* ---------------- 2. saved hands ---------------- */
  const MAXD = 10, GLYPHS = ['🔥', '❄️', '⚡', '☠️', '🛡️', '⚔️', '🌿', '🌀', '⭐', '👑', '🩸', '🐉'];
  const decks = () => (PR.decks = Array.isArray(PR.decks) ? PR.decks : []);
  const same = (a, b) => a.length === b.length && a.every(k => b.includes(k));
  const icHTML = ic => ic && ic.slice(0, 2) === 'k:' && typeof ICON !== 'undefined' && ICON[ic.slice(2)] ? `<img src="${ICON[ic.slice(2)]}">` : `<i>${esc(ic || '⭐')}</i>`;
  let ED = null;   // the deck being edited: { i, n, ic }
  window.deckLoad = function (i) { const d = decks()[i]; if (!d) return; const un = unlockedSpells(), list = d.h.filter(k => SP[k] && un.includes(k));
    PR.hand = list.slice(0, 4); try { save(); } catch (e) {} try { sfx('ui_deal'); } catch (e) {} refreshMeta(); if ($('spells').classList.contains('on')) renderSpells();
    toast(list.length < d.h.length ? `Loaded ${d.n}, but ${d.h.length - list.length} of its abilities ${d.h.length - list.length > 1 ? 'are' : 'is'} locked` : `Loaded ${d.n}`); };
  window.deckEdit = function (i) { const D = decks(), isNew = i < 0 || !D[i];
    if (isNew && (PR.hand || []).length < 4) return toast('Fill all 4 slots before saving a hand');
    if (isNew && D.length >= MAXD) return toast(`You can keep ${MAXD} saved hands. Delete one first.`);
    if (!ED || ED.i !== i) ED = isNew ? { i: -1, n: 'Hand ' + (D.length + 1), ic: 'k:' + PR.hand[0] } : { i, n: D[i].n, ic: D[i].ic };
    const hand = isNew ? PR.hand : D[i].h, opts = hand.filter(k => SP[k]).map(k => 'k:' + k).concat(GLYPHS);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="deckClose()">✕</button><div class="sh">${isNew ? 'Save this hand' : 'Edit saved hand'}</div>
      <div class="dkhand">${hand.map(k => SP[k] ? `<span><img src="${ICON[k]}"><small>${esc(SP[k].n)}</small></span>` : '').join('')}</div>
      <label class="dklab">Name<input id="dkName" maxlength="16" value="${esc(ED.n)}" oninput="deckName(this.value)" autocomplete="off" autocapitalize="words"></label>
      <div class="dklab">Icon</div><div class="dkicons">${opts.map(o => `<button class="${o === ED.ic ? 'on' : ''}" data-ic="${esc(o)}" onclick="deckIcon(this.dataset.ic)">${icHTML(o)}</button>`).join('')}</div>
      <button class="upbtn" onclick="deckSave()">${isNew ? 'Save hand' : 'Save changes'}</button>
      ${isNew ? '' : `<button class="upbtn dk2" onclick="deckOver()" ${(PR.hand || []).length < 4 || same(PR.hand, D[i].h) ? 'disabled' : ''}>Replace with my current hand</button><button class="upbtn dk3" onclick="deckDel()">Delete</button>`}`;
    $('sheet').classList.add('on'); };
  window.deckClose = function () { ED = null; closeSheet(); };
  window.deckName = v => { if (ED) ED.n = v; };
  window.deckIcon = function (ic) { if (!ED) return; ED.ic = ic; document.querySelectorAll('.dkicons button').forEach(b => b.classList.toggle('on', b.dataset.ic === ic)); try { sfx('ui_pick'); } catch (e) {} };
  const cleanName = () => (String(ED.n || '').replace(/\s+/g, ' ').trim().slice(0, 16)) || 'My hand';
  const done = msg => { ED = null; try { save(); } catch (e) {} closeSheet(); if ($('spells').classList.contains('on')) renderSpells(); toast(msg); };
  window.deckSave = function () { if (!ED) return; const D = decks(), n = cleanName();
    if (ED.i < 0) { D.push({ n, ic: ED.ic, h: PR.hand.slice(0, 4) }); try { sfx('ui_unlock'); } catch (e) {} done(`Saved ${n}`); }
    else if (D[ED.i]) { D[ED.i].n = n; D[ED.i].ic = ED.ic; done(`Saved ${n}`); } };
  window.deckOver = function () { if (!ED || !decks()[ED.i]) return; const d = decks()[ED.i]; d.h = PR.hand.slice(0, 4); d.n = cleanName(); if (ED.ic.slice(0, 2) === 'k:' && !d.h.includes(ED.ic.slice(2))) ED.ic = 'k:' + d.h[0]; d.ic = ED.ic; done(`${d.n} now holds your current hand`); };
  window.deckDel = function () { if (!ED || !decks()[ED.i]) return; const b = document.querySelector('.upbtn.dk3'); if (b && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Tap again to delete'; return; } const n = decks()[ED.i].n; decks().splice(ED.i, 1); done(`Deleted ${n}`); };
  function decksHTML() { const D = decks(), cur = PR.hand || [], saved = D.some(d => same(d.h, cur));
    return `<div class="decks"><span class="dkl">Saved hands</span>${D.map((d, i) => `<span class="dk ${same(d.h, cur) ? 'on' : ''}"><button onclick="deckLoad(${i})">${icHTML(d.ic)}<b>${esc(d.n)}</b></button><button class="ed" onclick="deckEdit(${i})" aria-label="Edit ${esc(d.n)}">✎</button></span>`).join('')}${cur.length >= 4 && !saved && D.length < MAXD ? `<button class="dk add" onclick="deckEdit(-1)">＋ Save this hand</button>` : ''}${!D.length && cur.length < 4 ? '<small>Fill your hand, then save it here.</small>' : ''}</div>`; }

  /* ---------------- 3. hand rating ---------------- */
  const S = a => new Set(a);
  const DMG = S(['fireball', 'lightning', 'ricochet', 'bubbles', 'beam', 'meteor', 'storm', 'thorns', 'sinkhole', 'ringfire', 'zombies', 'flies', 'archer', 'golem', 'burnbody', 'dissect', 'rush', 'zodiac', 'bloodoath', 'bloodcraft', 'sanctum']);
  const COVER = S(['icewall', 'ghost', 'mirror', 'shield', 'blink', 'titan', 'counter', 'orbs', 'gale', 'earthm', 'doubletake', 'sanctum', 'golem']);
  const HEAL = S(['secondwind', 'healspring', 'bloodoath']);
  const CTRL = S(['lightning', 'thorns', 'hourglass', 'sinkhole', 'gravity', 'polarity', 'gale', 'totem', 'earthm']);
  const WALLS = S(['meteor', 'storm', 'beam', 'dissect', 'rush', 'bloodoath', 'rift', 'sinkhole', 'gravity', 'flies']);
  const SWARM = S(['meteor', 'storm', 'ringfire', 'thorns', 'burnbody', 'bubbles', 'gravity', 'dissect', 'beam', 'sanctum', 'polarity', 'sinkhole', 'bloodcraft', 'ricochet', 'earthm']);
  const SHORT = S(['rush', 'bloodoath', 'burnbody', 'orbs', 'counter', 'earthm', 'ringfire', 'titan']), LONG = S(['beam', 'meteor', 'lightning', 'archer', 'storm', 'zombies', 'zodiac', 'golem', 'flies', 'dissect', 'bloodcraft']);
  const base = k => (window.VARIANTS && VARIANTS[k] && VARIANTS[k].base) || k;
  const names = a => a.length > 2 ? SP[a[0]].n + ', ' + SP[a[1]].n + ' and ' + SP[a[2]].n : a.map(k => SP[k].n).join(' and ');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function rateHand(hand) {
    const h = (hand || []).filter(k => SP[k]); if (h.length < 4) return null;
    const pick = set => h.filter(k => set.has(base(k))), dmg = pick(DMG), cover = pick(COVER), heal = pick(HEAL), ctrl = pick(CTRL), walls = pick(WALLS), swarm = pick(SWARM), short = pick(SHORT), long = pick(LONG);
    const loop = h.reduce((a, k) => a + (SP[k].t || 0), 0), summons = h.filter(k => TYPE_OF[k] === 'summon');
    const sy = typeof synergyOf === 'function' ? synergyOf(h) : {}, sk = Object.keys(sy).sort((a, b) => sy[b].n - sy[a].n);
    const synName = key => { const [kind, id] = key.split(':'), m = kind === 'el' ? ELEMS[id] : kind === 'sc' ? SCHOOL_SYN[id] : TYPE_SYN[id]; return m ? m.t || m.n : 'shared'; };
    const clash = short.length >= 2 && long.length >= 2;
    const good = [], bad = [], G = (w, t) => good.push([w, t]), Bd = (w, t, fix) => bad.push([w, t, fix]);
    if (dmg.length >= 3) G(3, dmg.length === 4 ? 'all 4 abilities deal damage' : '3 of 4 abilities deal damage');
    { const el = sk.filter(q => q.slice(0, 2) !== 'sc')[0], key = el || sk[0]; if (key) G(el ? 2.2 + sy[key].n * .3 : 1.5, `the ${synName(key)} bonus boosts ${sy[key].n === 4 ? 'all 4' : sy[key].n + ' of them'}`); }
    if (loop <= 6.5) G(2, `the ${loop.toFixed(1)}s loop is quick`);
    if (cover.length >= 2) G(2.6, `${names(cover.slice(0, 2))} keep hits off you`); else if (cover.length === 1) G(1.3, `${SP[cover[0]].n} gives you cover`);
    if (heal.length) G(1.6, `${names(heal.slice(0, 2))} heal${heal.length > 1 ? '' : 's'} you`);
    if (ctrl.length >= 2) G(2.1, `${names(ctrl.slice(0, 2))} lock the rival down`); else if (ctrl.length === 1) G(1, `${SP[ctrl[0]].n} controls the rival`);
    if (summons.length >= 2) G(1.8, 'summons soak hits for you');
    if (!cover.length && !heal.length) Bd(3, 'nothing in it blocks, dodges or heals', k => COVER.has(k) || HEAL.has(k));
    if (dmg.length <= 1) Bd(3.2, dmg.length ? 'only one ability deals damage' : 'nothing in it deals damage', k => DMG.has(k));
    if (loop >= 9.5) Bd(2, `the ${loop.toFixed(1)}s loop is slow`, k => (SP[k].t || 9) <= 1.4);
    if (clash) Bd(2.1, 'half of it wants to brawl and half wants range');
    if (!walls.length) Bd(1.6, 'it has no way past walls', k => WALLS.has(k));
    if (!swarm.length) Bd(1.5, 'it has no answer to summon swarms', k => SWARM.has(k));
    if (short.length >= 3) Bd(1.4, 'everything needs you up close', k => LONG.has(k));
    if (!ctrl.length) Bd(.8, 'nothing slows or stuns the rival', k => CTRL.has(k));
    if (!sk.length) Bd(.5, 'no two abilities share a bonus', k => h.some(q => ELEM_OF[q] === ELEM_OF[k] || TYPE_OF[q] === TYPE_OF[k]));
    let s = 0; s += dmg.length >= 3 ? 1 : dmg.length === 2 ? .5 : dmg.length ? -1 : -2; s += cover.length ? .75 : heal.length ? 0 : -1; s += heal.length ? .5 : 0; s += ctrl.length ? .5 : 0; s += walls.length ? .25 : -.5; s += swarm.length ? .25 : -.5;
    s += loop <= 6.5 ? .5 : loop >= 9.5 ? -.5 : 0; s += clash ? -.5 : 0; s += sk.length >= 2 ? .5 : sk.length ? .25 : 0;
    const stars = Math.max(1, Math.min(5, Math.round(2.75 + s * .5)));
    const top = (L, n) => L.sort((a, b) => b[0] - a[0]).slice(0, n).map(q => q[1]), g = top(good, 2), badL = bad.filter(q => q[0] >= 1).length ? bad.filter(q => q[0] >= 1) : bad, b = top(badL, 2);
    // up to three abilities that would cover the biggest gap: ones you own first, never ones already in the hand
    const fixes = []; { const un = typeof unlockedSpells === 'function' ? unlockedSpells() : [], pool = Object.keys(SP).filter(k => !h.includes(k) && !(window.VARIANTS && VARIANTS[k]) && TYPE_OF[k]), sch = typeof SCHOOL_OF === 'function' ? SCHOOL_OF(h[0]) : null;
      for (const q of badL.slice(0, 2)) { if (!q[2]) continue; const c = pool.filter(k => { try { return q[2](k); } catch (e) { return false; } }).sort((x, y) => (un.includes(y) - un.includes(x)) || ((SCHOOL_OF(y) === sch) - (SCHOOL_OF(x) === sch)) || ((PR.spells[y] ? PR.spells[y].lvl : 0) - (PR.spells[x] ? PR.spells[x].lvl : 0)));
        for (const k of c) { if (fixes.length < 3 && !fixes.includes(k)) fixes.push(k); } if (fixes.length >= 3) break; } }
    return { stars, fixes, good: g.length ? cap(g[0]) + (g[1] ? ', and ' + g[1] : '') + '.' : 'An even spread with no standout.', bad: b.length ? cap(b[0]) + (b[1] ? ', and ' + b[1] : '') + '.' : 'No clear gap: upgrades and cast order will decide it.' };
  }
  window.rateHand = rateHand;
  const WORD = ['', 'Shaky', 'Patchy', 'Solid', 'Strong', 'Complete'];
  // the review is Hoot's: the owl says it, with up to three abilities worth a look
  function rateHTML() { const r = rateHand(PR.hand); if (!r) return `<div class="hrate hoot none"><canvas class="hootc" width="96" height="96"></canvas><div class="hbub"><b class="who">Hoot</b><p>Fill all 4 slots and I will tell you what I think of the hand.</p></div></div>`;
    return `<div class="hrate hoot"><canvas class="hootc" width="96" height="96"></canvas><div class="hbub"><div class="hst"><b class="who">Hoot</b><span class="stars">${'★'.repeat(r.stars)}<i>${'★'.repeat(5 - r.stars)}</i></span><b>${WORD[r.stars]}</b></div><p class="hg"><b>Strength</b>${esc(r.good)}</p><p class="hb"><b>Weakness</b>${esc(r.bad)}</p>${r.fixes.length ? `<div class="hfix"><small>Worth a look</small>${r.fixes.map(k => `<button onclick="openSpell('${k}')"><img src="${ICON[k]}"><span>${esc(SP[k].n)}</span></button>`).join('')}</div>` : ''}</div></div>`; }
  function hootDraw() { try { const c = document.querySelector('#handX .hootc'); if (!c) return; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 96, 96); x.translate(48, 108); x.scale(2.1, 2.1);   /* sized so the owl's bob stays inside the circle */ drawPet(x, 'owl', performance.now() / 1000, 1); } catch (e) {} }
  setInterval(() => { const sp = $('spells'); if (sp && sp.classList.contains('on')) hootDraw(); }, 60);
  // small icons for skill points: a violet rune stone for spell points, a red octagon for technique points
  window.ptIcon = sc => sc === 'sorc' ? '<svg class="pti" viewBox="0 0 24 24"><path d="M8 2.500h8l5.500 5.500v8L16 21.500H8L2.500 16V8z" fill="#e0483e" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.500v11M6.500 12h11" stroke="#fff" stroke-width="2.600" stroke-linecap="round"/></svg>' : '<svg class="pti" viewBox="0 0 24 24"><path d="M12 2 21 12 12 22 3 12z" fill="#8a6bff" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.500v11M6.500 12h11" stroke="#fff" stroke-width="2.600" stroke-linecap="round"/></svg>';
  if (typeof renderSpells === 'function') { const _rs = renderSpells;
    window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments);
      try { const bar = $('handBar'); if (bar) { let x = $('handX'); if (!x) { x = document.createElement('div'); x.id = 'handX'; bar.after(x); } x.innerHTML = rateHTML() + decksHTML(); } } catch (e) { try { window.logCrash && logCrash(e, 'handX'); } catch (e2) {} }
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `.stkf{width:18px;height:18px;flex:none;filter:drop-shadow(0 1px 0 #0008)}
  #stkBtn{top:46px!important;left:10px;background:linear-gradient(#4a2a1a,#2a1420)!important;color:#ffd45e!important;padding:4px 9px 4px 6px;gap:3px}#stkBtn b{font:15px 'Lilita One';font-weight:400}
  #stkBtn.hot{box-shadow:0 3px 0 #000,0 0 12px #ff6a1f}#stkBtn.hot .stkf{animation:stkflick .5s ease-in-out infinite alternate}#stkBtn.max{background:linear-gradient(#ff8a2a,#c9361a)!important;color:#fff!important}
  @keyframes stkflick{from{transform:scale(1) rotate(-3deg)}to{transform:scale(1.14) rotate(3deg)}}
  .rwbox.stkbox{border-color:#ff8a2a;background:linear-gradient(#3a1a10cc,#000a)}.rwbox.stkbox .stkf{width:30px;height:30px;animation:stkflick .5s ease-in-out infinite alternate}.rwbox.stkbox .v{color:#ffd45e}
  .stknote{display:flex;flex-direction:column;gap:2px;margin:8px 0 0;text-align:center}.stknote span{font:800 12px Nunito;color:#ffcf9a}.stknote b{color:#ffd45e}
  .stkhero{display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0 8px}.stkhero .stkf{width:54px;height:54px}.stkhero b{font:44px 'Lilita One';font-weight:400;color:#ffd45e;-webkit-text-stroke:2px #000;paint-order:stroke fill}
  .stkgoals{display:flex;flex-direction:column;gap:6px;margin-top:10px}.stkgoals div{display:flex;align-items:center;gap:8px;background:#0006;border:2px solid #000;border-radius:12px;padding:7px 10px}.stkgoals b{font:14px 'Lilita One';font-weight:400;color:#ffd45e;white-space:nowrap}.stkgoals span{flex:1;font:800 12px Nunito;color:#d9cdfa}.stkgoals em{font:13px 'Lilita One';font-style:normal;color:#b9a6ee}.stkgoals .ok{border-color:#7ee08a}.stkgoals .ok em{color:#7ee08a}
  #rwScore{display:flex;align-items:center;justify-content:center;gap:10px}#rwRune{display:inline-flex;align-items:center;gap:3px;background:#0008;border:2px solid #000;border-radius:11px;padding:2px 9px 2px 5px;cursor:pointer;box-shadow:0 2px 0 #000}#rwRune .mtk{width:22px;height:22px}#rwRune b{font:16px 'Lilita One';font-weight:400;color:#e2d6ff}#rwRune.zero{opacity:.55}#rwRune.bump{animation:pop .35s}
  .pti{width:18px;height:18px;vertical-align:-4px;margin-right:3px}.tkrow span small{display:block;line-height:1.25}
  .hrate.hoot{display:flex;gap:9px;align-items:flex-start;padding:8px 10px}.hootc{flex:none;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240);border:2px solid #000;box-shadow:0 2px 0 #000}.hbub{flex:1;min-width:0;position:relative;background:#1a1236;border:2px solid #000;border-radius:12px;padding:7px 10px}.hbub::before{content:"";position:absolute;left:-8px;top:14px;border:6px solid transparent;border-right-color:#000;border-left:0}.hbub .who{font:13px 'Lilita One';font-weight:400;color:#ffd45e;margin-right:2px}.hrate.hoot.none{text-align:left}.hrate.hoot.none p{margin:2px 0 0;color:#cfc3f2}
  .hfix{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:7px}.hfix small{font:11px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;text-transform:uppercase;width:100%}.hfix button{all:unset;cursor:pointer;display:flex;align-items:center;gap:4px;background:#0007;border:2px solid #000;border-radius:10px;padding:2px 8px 2px 3px}.hfix img{width:24px;height:24px}.hfix span{font:12px 'Lilita One';color:#f1eaff;white-space:nowrap}
  #handX{display:flex;flex-direction:column;gap:8px;margin:8px 0 10px}
  .hrate{background:#0007;border:2px solid #000;border-radius:14px;padding:8px 11px;box-shadow:0 3px 0 #000}.hrate.none{font:800 12px Nunito;color:#8f80b8;text-align:center}
  .hrate .hst{display:flex;align-items:center;gap:8px;margin-bottom:4px}.hrate .stars{font-size:16px;letter-spacing:1px;color:#ffd45e;text-shadow:0 1px 0 #000}.hrate .stars i{font-style:normal;color:#ffffff26;text-shadow:none}.hrate .hst b{font:14px 'Lilita One';font-weight:400;color:#f3ecff;letter-spacing:.3px}
  .hrate p{margin:3px 0 0;font:800 12.5px/1.35 Nunito;color:#e6defc}.hrate p b{display:inline-block;font:11px 'Lilita One';font-weight:400;letter-spacing:.5px;text-transform:uppercase;border-radius:6px;padding:1px 6px;margin-right:6px;border:1.5px solid #000}.hrate .hg b{background:#2f8a4a;color:#eaffea}.hrate .hb b{background:#a8323e;color:#ffecee}
  .decks{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.decks .dkl{font:12px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;width:100%}.decks small{font:800 11px Nunito;color:#8f80b8}
  .dk{display:inline-flex;align-items:stretch;border:2px solid #000;border-radius:11px;overflow:hidden;background:linear-gradient(#4a3a80,#2b2050);box-shadow:0 2px 0 #000}.dk button{all:unset;cursor:pointer;display:flex;align-items:center;gap:5px;padding:4px 8px 4px 5px;color:#fff;-webkit-tap-highlight-color:transparent}
  .dk img{width:24px;height:24px}.dk i{font-style:normal;font-size:17px;line-height:24px;width:24px;text-align:center}.dk b{font:13px 'Lilita One';font-weight:400;max-width:104px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dk .ed{padding:4px 8px;background:#0005;border-left:2px solid #000;color:#d9cdfa;font-size:13px}.dk.on{border-color:#ffd45e;background:linear-gradient(#6a4a1a,#3a2410)}.dk.on b{color:#ffd45e}
  button.dk.add{font:13px 'Lilita One';color:#2a1a00;background:linear-gradient(#ffd45e,#d99a14);padding:6px 10px;cursor:pointer}
  .dkhand{display:flex;justify-content:center;gap:8px;margin:2px 0 10px}.dkhand span{display:flex;flex-direction:column;align-items:center;gap:2px;width:70px}.dkhand img{width:46px;height:46px;border-radius:12px;background:#0007;border:2px solid #ffd45e}.dkhand small{font:800 10px Nunito;color:#d9cdfa;text-align:center;line-height:1.1}
  .dklab{display:flex;flex-direction:column;gap:4px;font:12px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;margin:6px 0 4px}.dklab input{font:16px 'Lilita One';color:#fff;background:#0008;border:2px solid #000;border-radius:11px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box}.dklab input:focus{border-color:#ffd45e}
  .dkicons{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-bottom:12px}.dkicons button{all:unset;cursor:pointer;aspect-ratio:1;display:grid;place-items:center;border-radius:10px;background:#0007;border:2px solid #000}.dkicons button.on{border-color:#ffd45e;box-shadow:0 0 10px #ffd45e66}.dkicons img{width:82%;height:82%}.dkicons i{font-style:normal;font-size:19px}
  .upbtn.dk2{background:linear-gradient(#4a3a80,#2b2050);margin-top:6px}.upbtn.dk3{background:linear-gradient(#a8323e,#6a1420);margin-top:6px}`;
  document.head.appendChild(css);
  try { badge(); } catch (e) {}

  /* ---------------- load splash: the curtain starts shut with the logo, then opens ---------------- */
  (function () { const c = $('curtain'); if (!c || !c.classList.contains('splash')) return; try { if (typeof setLogo === 'function') setLogo(); } catch (e) {}
    try { const v = $('splVer'); if (v && typeof GAME_VERSION !== 'undefined') v.textContent = 'VERSION ' + GAME_VERSION; } catch (e) {}
    if (window.SB_SHOT) { c.className = 'curtain'; return; }
    const t0 = performance.now(), open = () => { if (!c.classList.contains('splash')) return; c.className = 'curtain opening spl'; setTimeout(() => { if (c.className === 'curtain opening spl') c.className = 'curtain'; }, 560); };
    const go = () => setTimeout(open, Math.max(0, 2550 - (performance.now() - t0)));
    let fired = false; const once = () => { if (fired) return; fired = true; go(); };
    try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { if (document.readyState === 'complete') once(); else addEventListener('load', once); }); } catch (e) { once(); }
    setTimeout(once, 3500); })();
  window.V105B = { rateHand, streakGold, decks };
})();
