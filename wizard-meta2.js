/* =====================================================================
   WIZARDS VS SORCERERS: AI drafting, account perks, titles, sorcerer names
   Loads after wizard-techniques.js.
   ===================================================================== */
(function () {
  const sorcOf = k => typeof SCHOOL_OF === 'function' && SCHOOL_OF(k) === 'sorc';

  /* ---------------- what counters what (spells and techniques) ----------------
     COUNTERS[x] lists cards that beat x. Techniques get their own rows, and a few spell rows learn about techniques. */
  Object.assign(COUNTERS, {
    rush: ['counter', 'icewall', 'polarity', 'titan', 'doubletake', 'ghost', 'blink', 'sinkhole', 'gale'],
    dissect: ['icewall', 'shield', 'titan', 'mirror', 'counter', 'ghost'],
    sanctum: ['ghost', 'blink', 'counter', 'secondwind'],
    doubletake: ['zodiac', 'zombies', 'golem', 'storm', 'thorns'],
    polarity: ['icewall', 'titan', 'zombies', 'archer'],
    zodiac: ['dissect', 'polarity', 'fireball', 'ringfire', 'rush', 'thorns'],
    titan: ['sanctum', 'dissect', 'beam', 'gravity'],
    counter: ['fireball', 'lightning', 'beam', 'meteor', 'dissect'],
    secondwind: ['beam', 'meteor', 'sanctum', 'rush', 'burnbody'],
    healspring: ['meteor', 'polarity', 'gravity', 'gale', 'storm'],
    copycast: ['zombies', 'shield', 'icewall', 'titan'],
    earthm: ['blink', 'gale', 'lightning', 'meteor', 'storm', 'dissect'],
  });
  const addTo = (k, list) => { COUNTERS[k] = [...new Set((COUNTERS[k] || []).concat(list))]; };
  addTo('beam', ['polarity', 'titan']); addTo('fireball', ['dissect']); addTo('meteor', ['doubletake']); addTo('zombies', ['dissect', 'polarity']);
  addTo('lightning', ['titan']); addTo('orbs', ['rush']); addTo('burnbody', ['polarity']); addTo('golem', ['dissect', 'earthm']); addTo('rush', ['earthm']); addTo('zodiac', ['earthm']); addTo('flies', ['earthm']);
  Object.assign(THREAT, { sanctum: 1.5, titan: 1.5, healspring: 1.3, secondwind: 1.3 });
  for (const k in COUNTERS) COUNTERS[k] = COUNTERS[k].filter(c => SP[c]);

  // how strongly card k counters a list of the player's cards
  function counterVs(k, list, upsOn) {
    let s = 0; const cnt = {}; (list || []).forEach(q => cnt[q] = (cnt[q] || 0) + 1);
    for (const pk in cnt) if ((COUNTERS[pk] || []).includes(k)) s += (THREAT[pk] || 1) * cnt[pk] * (1 + .3 * (upsOn ? upsOn(pk) : 0));
    return s;
  }
  const pickW = (pool, wf) => { const ws = pool.map(wf); let r = Math.random() * ws.reduce((a, b) => a + b, 0), i = 0; for (; i < pool.length - 1; i++) { r -= ws[i]; if (r <= 0) break; } return i; };

  /* ---------------- the rival's four cards ----------------
     A random lean (sorcerer or wizard) sets how many techniques it brings, then each slot is drawn at random,
     weighted by the rival's style and by how well the card answers the player's hand. */
  window.foeHand = foeHand = function (prof) {
    // four different abilities, uniformly at random from everything in the game (no style or counter weighting)
    const all = Object.keys(SP).filter(k => UPG[k] && STATS[k]);
    if (window.ONB_ACTIVE) return ['fireball', 'icewall', 'zombies', 'lightning'].filter(k => SP[k]);   // the tutorial rival stays simple
    for (let i = all.length - 1; i > 0; i--) { const r = Math.random() * (i + 1) | 0; [all[i], all[r]] = [all[r], all[i]]; }
    return all.slice(0, 4);
  };
  // the rival's title on the versus screen is named after the hand it drew
  function titleFor(hand) {
    const ce = {}; hand.forEach(k => { const e = ELEM_OF[k]; if (e) ce[e] = (ce[e] || 0) + 1; }); const top = Object.keys(ce).sort((a, b) => ce[b] - ce[a])[0], nS = hand.filter(sorcOf).length;
    if (nS >= 3) return nS === 4 ? 'Pure Sorcerer' : 'Sorcerer'; if (top && ce[top] >= 2) return ELEMS[top].t; if (nS === 2) return 'Spellfist'; return 'Wild Mage';
  }

  /* ---------------- the rival's draft picks ----------------
     Each offered card is scored by how well it counters the player's current book (weighted by threat, copies and
     the player's upgrades on it), by what the player actually cast last round, and by synergy with its own book.
     Scores are squared before a weighted draw: it usually takes the best answer, but not always. */
  window.aiPick = aiPick = function (offer) {
    const you = M.me.book.length ? M.me.book : (PR.hand || []), fav = M.profile.fav || {};
    const upsOn = k => [...M.me.up].filter(u => u.startsWith(k + '.')).length;
    const syn = k => { let s = 0; M.foe.book.forEach(q => { if (q === k) return; if (ELEM_OF[q] && ELEM_OF[q] === ELEM_OF[k]) s += .12; if (TYPE_OF[q] === TYPE_OF[k]) s += .08; if (sorcOf(q) === sorcOf(k)) s += .05; }); return s; };
    const val = k => (1 + 1.5 * (counterVs(k, you, upsOn) + .5 * counterScore(k))) * (1 + syn(k));   // counters and synergy only: no style bias
    const score = c => c.type === 'up' ? val(c.k) * 1.25 * (c.u.rare ? 1.2 : 1)
      : c.type === 'replace' ? Math.max(.05, val(c.k) - Math.min(...M.foe.book.map(val)) * 1.1)
      : val(c.k) * (M.foe.book.includes(c.k) ? .5 : 1);   // prefers a new ability over a second copy
    let pick = offer[pickW(offer, c => Math.pow(score(c), 2) + .02)];
    if (pick.type === 'replace') { let bi = 0; M.foe.book.forEach((k, i) => { if (val(k) < val(M.foe.book[bi])) bi = i; }); pick = Object.assign({}, pick, { slot: bi }); }
    return pick;
  };
  window.AI_DEBUG = { counterVs };

  /* ---------------- account level: from level 3, every other level alternates +5% cast speed and +5% health
     (3 cast, 5 health, 7 cast, 9 health ...), each capped at +30% ---------------- */
  const acctLv = w => w && w.me ? PR.lvl : (typeof M !== 'undefined' && M && M.foeAcct) || PR.lvl;
  const lvSteps = w => { const L = acctLv(w) || 1; return L >= 3 ? Math.floor((L - 1) / 2) : 0; };
  const castBonus = w => .05 * Math.min(6, Math.ceil(lvSteps(w) / 2));
  const hpBonus = w => .05 * Math.min(6, Math.floor(lvSteps(w) / 2));
  window.hpBonusOf = hpBonus;
  { const _sdH = startDuel; window.startDuel = startDuel = function () { const r = _sdH.apply(this, arguments); try { if (!window.ONB_ACTIVE) for (const w of ents) { const m = 1 + hpBonus(w); if (m > 1) { w.maxHp = Math.round(w.maxHp * m); w.hp = w.maxHp; if (w.lag !== undefined) w.lag = w.maxHp; } } } catch (e) {} return r; }; }
  window.castBonusOf = castBonus;
  const _cm = window.castMod;
  window.castMod = function (w, k, b) {
    let v = _cm ? _cm(w, k, b) : b;
    if (k === 'doubletake' && w.dtLoop === Math.floor((w.castN || 0) / Math.max(1, (w.book || []).length)) && !w.qdSpent) return .25;   // already swapped this loop: the turn passes quickly
    { const nl = Math.floor((w.castN || 0) / Math.max(1, (w.book || []).length)); if (k === 'polarity' && w.polLoop === nl && !w.bndSpent) return .25; if (window.LOOP_ONCE && LOOP_ONCE[k] && w.once && w.once[k] === nl) return .25; }
    if (k === 'flies' && U(w, k, 'gather')) v *= Math.max(.4, Math.pow(.9, w.flyN || 0));   // Gathering Swarm
    if (k === 'beam' && U(w, k, 'desperate')) v += 2;
    if (w.blinkHaste && k !== 'blink') v *= .85;                                // Quickstep from a second Blink                          // Desperate Output charges 2s longer
    if (w.book && w.book.includes('chosen') && k !== 'chosen') v *= 1 - S(w, 'chosen', 'haste') / 100 * (U(w, 'chosen', 'awaken') ? 2 : 1);   // Chosen One: passive haste
    return Math.max(k === 'chosen' ? 0 : .5, v * (1 - castBonus(w)));   // no real cast charges faster than 0.5s (F-421)
  };
  const _nm = newMatch;
  window.newMatch = newMatch = function (o = {}) { const r = _nm(o); if (M) { M.foeAcct = Math.max(1, PR.lvl + Math.round(rnd(-3, 3))); if (!window.ONB_ACTIVE && M.foe && M.foe.pool) M.profile = Object.assign({}, M.profile, { n: titleFor(M.foe.pool) }); } return r; };

  /* ---------------- titles ---------------- */
  const ST = () => (PR.stats = Object.assign({ matches: 0, wins: 0, wizW: 0, sorcW: 0, streak: 0, best: 0, flawless: 0, rushW: 0, cleaves: 0 }, PR.stats || {}));
  const bestRank = () => Math.max(rankOf(PR.trophies), ...(PR.claimed || [0]));
  const TITLES = [
    { id: 'novice', n: 'Novice Duelist', d: 'Where everyone starts.', ok: () => 1 },
    ...RANKS.slice(1).map((r, i) => ({ id: 'rank' + (i + 1), n: r.n, d: 'Reach ' + r.n + ' rank.', ok: () => bestRank() >= i + 1 })),
    { id: 'g3', n: 'Novice Sorcerer', d: 'Win 5 matches as a sorcerer.', ok: s => s.sorcW >= 5, p: s => [s.sorcW, 5] },
    { id: 'g1', n: 'Enlightened Fighter', d: 'Win 10 matches as a sorcerer.', ok: s => s.sorcW >= 10, p: s => [s.sorcW, 10] },
    { id: 'special', n: 'Force of Nature', d: 'Win 20 matches as a sorcerer.', ok: s => s.sorcW >= 20, p: s => [s.sorcW, 20] },
    { id: 'hedge', n: 'Hedge Wizard', d: 'Win 5 matches as a wizard.', ok: s => s.wizW >= 5, p: s => [s.wizW, 5] },
    { id: 'spellwright', n: 'Spellwright', d: 'Win 10 matches as a wizard.', ok: s => s.wizW >= 10, p: s => [s.wizW, 10] },
    { id: 'warlock', n: 'Witching Warlock', d: 'Win 20 matches as a wizard.', ok: s => s.wizW >= 20, p: s => [s.wizW, 20] },
    { id: 'brawler', n: 'Brawler', d: 'Win 10 matches with Rushdown.', ok: s => s.rushW >= 10, p: s => [s.rushW, 10] },
    { id: 'cutter', n: 'World Cutter', d: 'Land 10 Grand Bisections.', ok: s => s.cleaves >= 10, p: s => [s.cleaves, 10] },
    { id: 'flawless', n: 'Flawless', d: 'Win a match without losing a round.', ok: s => s.flawless >= 1 },
    { id: 'streak', n: 'Unstoppable', d: 'Win 5 matches in a row.', ok: s => s.best >= 5, p: s => [s.streak, 5] },
    { id: 'vet', n: 'Seasoned Duelist', d: 'Play 50 matches.', ok: s => s.matches >= 50, p: s => [s.matches, 50] },
    { id: 'cent', n: 'Centurion', d: 'Win 100 matches.', ok: s => s.wins >= 100, p: s => [s.wins, 100] },
  ];
  window.TITLES = TITLES;
  const earned = () => TITLES.filter(t => t.ok(ST())).map(t => t.id);
  const titleName = () => (TITLES.find(t => t.id === PR.title && t.ok(ST())) || TITLES[0]).n;
  window.titleName = titleName;
  // a win counts for a school when most of the book (not a tie) is from that school
  function recordMatch(won) {
    const s = ST(), b = M.me.book, nS = b.filter(sorcOf).length, sch = nS * 2 > b.length ? 'sorc' : nS * 2 < b.length ? 'wiz' : null;
    s.matches++;
    if (won) { s.wins++; if (sch) s[sch + 'W']++; s.streak++; s.best = Math.max(s.best, s.streak); if (M.score.foe === 0) s.flawless++; if (b.includes('rush')) s.rushW++; }
    else s.streak = 0;
  }
  const _sr = showRewards;
  window.showRewards = showRewards = function () {
    if (M && !M._statsDone) {
      M._statsDone = 1; const before = earned(); const won = M.score.me > M.score.foe; recordMatch(won);
      try { const b = M.me.book, nS = b.filter(sorcOf).length, tot = M.tot || { dealt: 0, taken: 0 }, cs = M.casts || {}; let tc = 0, sc2 = 0; for (const k in cs) (sorcOf(k) ? tc += cs[k] : sc2 += cs[k]);
        chProgress({ dealt: tot.dealt, taken: tot.taken, dealtMax: tot.dealt, wins: won ? 1 : 0, flawless: won && M.score.foe === 0 ? 1 : 0, matches: 1, rounds: M.score.me, sorcW: won && nS * 2 > b.length ? 1 : 0, wizW: won && nS * 2 < b.length ? 1 : 0, techCasts: tc, spellCasts: sc2, ups: M.me.up.size, tankWin: won && tot.taken >= 100 ? 1 : 0, streakNow: ST().streak }); } catch (e) {}
      // losing streak help: the first time you lose 2 in a row, a token of your choice; after that, every 3 in a row gives a Spell Token and a Technique Token
      PR.lossStreak = won ? 0 : (PR.lossStreak || 0) + 1; let gift = null;
      if (!won && !PR.ls2Done && PR.lossStreak >= 2) { PR.ls2Done = 1; PR.lossStreak = 0; PR.tokPick = (PR.tokPick || 0) + 1; gift = 'Tough streak! Pick a free unlock token.'; }
      else if (!won && PR.ls2Done && PR.lossStreak >= 3) { PR.lossStreak = 0; PR.tokens = (PR.tokens || 0) + 1; PR.tokS = (PR.tokS || 0) + 1; gift = 'Tough streak! +1 Spell Token and +1 Technique Token.'; }
      if (gift) setTimeout(() => toast(gift), 3200);
      try { save(); } catch (e) {}
      const fresh = TITLES.filter(t => !before.includes(t.id) && t.ok(ST()));
      if (fresh.length) setTimeout(() => toast('New title: ' + fresh.map(t => t.n).join(', ') + '!'), 2600);
    }
    const r = _sr.apply(this, arguments);
    const b = $('rwBtn'), ob = b && b.onclick; if (b && ob && !ob._tok) { b.onclick = function () { const res = ob.apply(this, arguments); if (PR.tokPick > 0) setTimeout(() => queueModal(() => showTokenModal()), 1400); return res; }; b.onclick._tok = 1; }
    return r;
  };
  const _slu = showLevelUp;
  window.showLevelUp = showLevelUp = function () { try { sfx('ui_fanfare'); } catch (e) {} return _slu.apply(this, arguments); };
  window.openTitles = function () {
    const s = ST(), cur = (TITLES.find(t => t.id === PR.title && t.ok(s)) || TITLES[0]).id, cb = castBonus({ me: 1 });
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Titles</div>
      <div class="ssub" style="margin:0">Shown under your name. Level ${PR.lvl}: ${cb > 0 ? '+' + Math.round(cb * 100) + '% cast speed, +' + Math.round(hpBonus({ me: 1 }) * 100) + '% health' : 'bonuses start at level 3'} (from level 3, every other level alternates +5% cast speed and +5% health).</div>
      <div class="ttl">${TITLES.map(t => { const ok = t.ok(s), pr = !ok && t.p ? t.p(s) : null;
        return `<div class="trow ${ok ? '' : 'lk'} ${t.id === cur ? 'on' : ''}" ${ok ? `onclick="PR.title='${t.id}';save();refreshMeta();openTitles()"` : ''}><b>${t.n}</b><small>${t.d}${pr ? ` <em>${Math.min(pr[0], pr[1])}/${pr[1]}</em>` : ''}</small>${ok ? (t.id === cur ? '<i>✓</i>' : '') : `<span class="tlk">${SVG.lock}</span>`}</div>`; }).join('')}</div>`;
    $('sheet').classList.add('on');
  };
  function titleHTML() { const cb = castBonus({ me: 1 }), hb = hpBonus({ me: 1 }); return `<span class="tn">${titleName()}</span>${cb > 0 ? `<span class="cs">⚡ +${Math.round(cb * 100)}% cast${hb > 0 ? ` · ♥ +${Math.round(hb * 100)}%` : ''}</span>` : ''}`; }
  const _rm = refreshMeta;
  window.refreshMeta = refreshMeta = function () {
    const r = _rm.apply(this, arguments);
    const pn = document.getElementById('pName'); const row = pn && pn.closest('.pname');
    if (row) { let t = document.getElementById('pTitle'); if (!t) { t = document.createElement('div'); t.id = 'pTitle'; t.className = 'ptitle'; t.onclick = e => { e.stopPropagation(); openTitles(); }; row.after(t); } t.innerHTML = titleHTML(); }
    return r;
  };
  const _rw = renderWardrobe;
  window.renderWardrobe = renderWardrobe = function () {
    const r = _rw.apply(this, arguments);
    const nm = document.getElementById('wdName'), wrap = nm && nm.closest('.wname');
    if (wrap) { let t = document.getElementById('wdTitle'); if (!t) { t = document.createElement('div'); t.id = 'wdTitle'; t.className = 'ptitle wd'; t.onclick = () => openTitles(); wrap.after(t); } t.innerHTML = titleHTML() + '<span class="ch">Change</span>'; }
    return r;
  };
  const _sv = showVs;
  window.showVs = showVs = function (cb) {
    const r = _sv(cb); const v = document.querySelector('#vsMeInfo .vsn');
    if (v && !v.nextElementSibling?.classList.contains('vst')) v.insertAdjacentHTML('afterend', `<div class="vst">${titleName()}</div>`);
    return r;
  };

  /* ---------------- sorcerer names in the wardrobe ---------------- */
  const SORC_NAMES = {
    robe: { azure: 'Azure Gi', crimson: 'Crimson Gi', moss: 'Moss Gi', amethyst: 'Amethyst Gi', midnight: 'Midnight Gi', frost: 'Frostweave Gi', sunfire: 'Sunfire Gi', royal: 'Royal Dogi' },
    hat: { pointy: 'Headband', witch: 'Half Mask', hood: 'Cowl', feathered: 'Topknot', mushroom: 'Straw Hat', crown: 'Circlet' },
    beard: { white: 'White Hair', brown: 'Brown Hair', ginger: 'Ginger Hair', pink: 'Pink Hair', none: 'Black Hair', long: 'Silver Hair' },
  };
  const SORC_CATS = { robe: 'Gi', hat: 'Headgear', beard: 'Hair' };
  const isSorc = () => PR.look && PR.look.cls === 'sorc';
  window.cosN = (c, it) => (isSorc() && SORC_NAMES[c] && SORC_NAMES[c][it.id]) || it.n;
  window.catN = (c, n) => (isSorc() && SORC_CATS[c]) || n;
  // aura colour: a sorcerer-only wardrobe tab
  COSMETICS.aura = AURAS.map(a => Object.assign({ r: 'common', unlock: { type: 'free' } }, a)); if (!CATS.some(c => c[0] === 'aura')) CATS.splice(4, 0, ['aura', 'Aura']); if (!PR.look.aura) PR.look.aura = 'crimson';
  window.catsFor = () => isSorc() ? CATS.filter(c => c[0] !== 'staff') : CATS.filter(c => c[0] !== 'aura');
  const _rwA = renderWardrobe;
  window.renderWardrobe = renderWardrobe = function () { const r = _rwA.apply(this, arguments); if (wCat === 'aura') document.querySelectorAll('#items canvas').forEach(c => { const it = COSMETICS.aura[+c.dataset.i], g = c.getContext('2d'); if (!it) return; g.clearRect(0, 0, c.width, c.height); g.fillStyle = '#140a26'; g.fillRect(0, 0, c.width, c.height);
      for (const [sc, col] of [[1.12, '#07020d'], [1, it.c[1]], [.6, it.c[0]]]) { g.fillStyle = col; g.beginPath(); g.moveTo(64 - 34 * sc, 104); g.quadraticCurveTo(64 - 40 * sc, 104 - 50 * sc, 64 - 12 * sc, 104 - 62 * sc); g.quadraticCurveTo(64 - 6 * sc, 104 - 84 * sc, 64 + 6 * sc, 104 - 96 * sc); g.quadraticCurveTo(64 + 8 * sc, 104 - 70 * sc, 64 + 22 * sc, 104 - 66 * sc); g.quadraticCurveTo(64 + 42 * sc, 104 - 40 * sc, 64 + 34 * sc, 104); g.closePath(); g.fill(); } }); return r; };   // sorcerers fight bare-handed: no staff tab

  /* ---------------- ability pages: what it beats, what beats it ---------------- */
  function counterRows(k) {
    const strong = Object.keys(COUNTERS).filter(pk => SP[pk] && pk !== k && COUNTERS[pk].includes(k)), weak = (COUNTERS[k] || []).filter(q => SP[q] && q !== k);
    const row = (lbl, list, cls) => list.length ? `<div class="crow ${cls}"><span>${lbl}</span><div>${list.slice(0, 7).map(q => `<img src="${ICON[q]}" title="${SP[q].n}" onclick="event.stopPropagation();toast('${SP[q].n.replace(/'/g, "\\'")}')">`).join('')}</div></div>` : '';
    const h = row('Strong against', strong, 'g') + row('Watch out for', weak, 'b');
    return h ? `<div class="ctrs">${h}</div>` : '';
  }
  for (const nm of ['openSpell', 'openLocked']) { const f = window[nm]; if (typeof f !== 'function') continue;
    window[nm] = function (k) { const r = f.apply(this, arguments); try { const P = document.getElementById('sheetP'); if (P && !P.querySelector('.ctrs')) { const at = P.querySelector('.ups')?.parentElement || P.querySelector('.shd'); if (at) at.insertAdjacentHTML('afterend', counterRows(k)); } } catch (e) {} return r; }; }
  try { openSpell = window.openSpell; openLocked = window.openLocked; } catch (e) {}

  /* ---------------- per-round steering ----------------
     The order screen has a Movement switch (Auto / Steer). With Steer, holding a finger on the arena walks your caster
     toward it, a little slower than auto movement. Let go and auto movement takes over. Abilities always fire on their own. */
  let steerP = null;
  const steerOn = () => typeof M !== 'undefined' && M && M.steer === 'steer';
  const _rb = renderBehav;
  window.renderBehav = renderBehav = function () {
    const r = _rb.apply(this, arguments); if (typeof M === 'undefined' || !M) return r; if (!M.steer) M.steer = PR.steerPref || 'auto';
    $('behav').insertAdjacentHTML('beforeend', `<div class="bl" style="margin-top:6px">Movement</div><div class="bseg">${[['auto', 'Auto'], ['steer', 'Steer']].map(([id, n]) => `<button class="${M.steer === id ? 'on' : ''}" onclick="setSteer('${id}')">${n}</button>`).join('')}</div>${M.steer === 'steer' ? '<div class="mvh">Hold and drag on the arena to move. Abilities still fire on their own.</div>' : ''}`);
    return r;
  };
  window.setSteer = id => { M.steer = id; PR.steerPref = id; try { save(); } catch (e) {} renderBehav(); };
  const cvEl = document.getElementById('cv');
  const toGame = e => { const r = cvEl.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  cvEl.addEventListener('pointerdown', e => { if (!steerOn() || !running || paused || ended) return; steerP = toGame(e); try { cvEl.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
  cvEl.addEventListener('pointermove', e => { if (steerP) steerP = toGame(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => cvEl.addEventListener(ev, () => { steerP = null; }));
  cvEl.style.touchAction = 'none';
  window.STEER = { set p(v) { steerP = v; }, get p() { return steerP; } };
  function steerStep(w, pre, dt) {
    if ((w.rush && w.rush.ph !== 'back') || w.stunT > 0 || (w.rootT || 0) > 0) return;
    let spd = 64 * (w.slowT > 0 ? .5 : 1) * (w.beamT > 0 ? .15 : 1) * (w.pitT > 0 ? .35 : 1) * (w.recoil > 0 ? .4 : 1);
    if (w.shell) spd *= U(w, 'titan', 'walking') ? .35 : 0;
    try { for (const m of TECH_DEBUG.muds) if (m.o !== w && m.t < m.dur && Math.hypot(pre.x - m.x, (pre.y - m.y) / .62) < m.r) spd *= m.quag ? .35 : .55; } catch (e) {}
    const dx = steerP.x - pre.x, dy = steerP.y - pre.y, d = Math.hypot(dx, dy), want = d > 3 ? Math.min(spd, d * 6) : 0, vx = d ? dx / d * want : 0, vy = d ? dy / d * want : 0, k = Math.min(1, dt * 10);
    if (!w.sv || w.sv.t < T - .2) w.sv = { x: w.vx, y: w.vy };   // steering keeps its own velocity, so auto movement cannot drag on it
    w.sv.x += (vx - w.sv.x) * k; w.sv.y += (vy - w.sv.y) * k; w.sv.t = T; w.vx = w.sv.x; w.vy = w.sv.y;
    w.x = clamp(pre.x + w.vx * dt, F.x0 + 6, F.x1 - 6); w.y = clamp(pre.y + w.vy * dt, F.y0 + 6, F.y1 - 6); pushOut(w, 16, w);
  }
  const _up = update;
  window.update = update = function (dt) {
    const me = typeof ents !== 'undefined' && ents && ents[0], pre = me ? { x: me.x, y: me.y } : null;
    const r = _up(dt);
    if (me && steerP && steerOn() && !me.dead && !ended) steerStep(me, pre, dt);
    if (!steerOn() || ended) steerP = null;
    return r;
  };
  const _render = render;
  window.render = render = function () {
    const r = _render.apply(this, arguments);
    if (steerP && steerOn() && typeof ents !== 'undefined' && ents[0]) { const x = ctx, w = ents[0]; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.globalAlpha = .85;
      x.strokeStyle = '#000'; x.lineWidth = 5; x.beginPath(); x.ellipse(steerP.x, steerP.y, 16, 9, 0, 0, 7); x.stroke(); x.strokeStyle = '#9ff5e0'; x.lineWidth = 2.5; x.stroke();
      x.setLineDash([4, 6]); x.lineWidth = 2; x.globalAlpha = .55; x.beginPath(); x.moveTo(w.x, w.y); x.lineTo(steerP.x, steerP.y); x.stroke(); x.restore(); }
    return r;
  };

  /* ---------------- undo a draft pick ----------------
     Every pick this round is snapshotted; Undo restores the book and shows the same offer again. */
  const snap = () => ({ book: M.me.book.slice(), up: new Set(M.me.up), picked: (M.picked || []).slice(), pick: M.pick, offer: M.offer, lastAdded: M.lastAdded });
  const _sd = startDraft;
  window.startDraft = startDraft = function () { if (M) M.undo = []; return _sd.apply(this, arguments); };
  const _tc = takeCard;
  window.takeCard = takeCard = function (i) { const c = M.offer[i]; if (!M.lock && c && !(c.type === 'replace' && c.slot === undefined)) (M.undo = M.undo || []).push(snap()); return _tc.apply(this, arguments); };
  const _dr = doRemove;
  window.doRemove = doRemove = function (j) { if (!M.lock) (M.undo = M.undo || []).push(snap()); return _dr.apply(this, arguments); };
  window.undoPick = function () {
    if (!M.undo || !M.undo.length) return; const onDraft = $('draft').classList.contains('on'); if (onDraft && M.lock) return;
    const st = M.undo.pop(); M.me.book = st.book; M.me.up = st.up; M.picked = st.picked; M.pick = st.pick; M.offer = st.offer; M.lastAdded = st.lastAdded; M.lock = 0;
    sfx('ui_deal'); toast('Pick undone'); show('draft'); renderDraft(); startPickTimer();
  };
  const _rda = renderDraftActs;
  window.renderDraftActs = renderDraftActs = function () { const r = _rda.apply(this, arguments); const el = $('dacts'); if (el && !window.ONB_ACTIVE && M.undo && M.undo.length) el.insertAdjacentHTML('afterbegin', `<button class="dact ud" onclick="undoPick()"><span class="di">↶</span>Undo</button>`); return r; };

  /* ---------------- recommended battle distance ----------------
     Short-range and melee cards pull toward Close In; long-range shots, beams and summons toward Keep Away.
     A rival that brings melee pushes a little toward Keep Away. */
  const SHORT = new Set(['rush', 'burnbody', 'orbs', 'counter', 'earthm', 'ringfire']), LONG = new Set(['beam', 'meteor', 'lightning', 'archer', 'storm', 'zombies', 'zodiac', 'golem', 'flies', 'dissect']);
  function recDistance() {
    const b = M.me.book; if (!b.length) return null; let sc = 0;
    b.forEach(k => { sc += SHORT.has(k) ? -1.2 : LONG.has(k) ? .7 : (((SP[k].range || 140) - 140) / 60); });
    sc /= b.length; const foeMelee = (M.foe.book || []).filter(k => SHORT.has(k)).length; sc += foeMelee * .15;
    const id = sc < -.3 ? 'push' : sc > .3 ? 'away' : 'default';
    const why = id === 'push' ? 'Your book hits hardest up close.' : id === 'away' ? (foeMelee ? 'Your book works from range, and the rival wants to brawl.' : 'Your book works best from range.') : 'Your book is a mix of close and long range.';
    return { id, why };
  }
  const _rb2 = renderBehav;
  window.renderBehav = renderBehav = function () {
    const r = _rb2.apply(this, arguments); if (typeof M === 'undefined' || !M || !M.me) return r; const rec = recDistance(); if (!rec) return r;
    const seg = $('behav').querySelector('.bseg'), i = ['push', 'default', 'away'].indexOf(rec.id), btn = seg && seg.children[i];
    if (btn) { btn.classList.add('rec'); btn.insertAdjacentHTML('beforeend', '<em class="rtag">★ Best</em>'); seg.insertAdjacentHTML('afterend', `<div class="rwhy">Recommended: <b>${['Close In', 'Default', 'Keep Away'][i]}</b>. ${rec.why}</div>`); }
    return r;
  };
  const _rbk = renderBook;
  window.renderBook = renderBook = function () { const r = _rbk.apply(this, arguments); let u = document.getElementById('undoO'); const db = $('duelBtn');
    if (db) { if (!u) { u = document.createElement('button'); u.id = 'undoO'; u.className = 'undoO'; u.onclick = () => undoPick(); db.before(u); } u.style.display = M.undo && M.undo.length ? '' : 'none'; u.textContent = '↶ Undo last pick'; }
    return r; };

  /* ---------------- Echo Runes ----------------
     Spend one on an ability's page; at the end of your next match that ability's skill points are doubled, win or lose.
     The token is only used up when that ability was in your book. Start with 3, +1 per level up, or 3 for 40 gems. */
  if (PR.mTok === undefined) { PR.mTok = 3; try { save(); } catch (e) {} }
  const TOK_SVG = '<svg viewBox="0 0 24 24" class="mtk"><path d="M12 1.8 19.6 6v12L12 22.2 4.4 18V6z" fill="#5b3bd1" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M12 4.6 17 7.4v9.2L12 19.4 7 16.6V7.4z" fill="#8a6bff"/><path d="M12 7.5v9M9 9.5l3 2 3-2M9 13.5l3 2 3-2" fill="none" stroke="#f3ecff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.6 9.2a7.4 7.4 0 0 0 0 5.6M18.4 9.2a7.4 7.4 0 0 1 0 5.6" fill="none" stroke="#ffd75e" stroke-width="1.4" stroke-linecap="round"/></svg>';   // Echo Rune: a rune stone with an echo glyph
  // used on the rewards screen only: each ability that earned skill points this match gets a x2 button; spend one token per ability, on as many as you like
  window.masteryDouble = function (k) {
    const got = window.rwGot || {}, q = got[k] || 0; if (M) M.mtSet = M.mtSet || []; if (!(PR.mTok > 0) || !q || (M && M.mtSet.includes(k))) return;
    PR.mTok--; PR.spells[k].cards += q; got[k] = q * 2; if (M) { M.mtSet.push(k); M.mtUsed = k; } try { save(); } catch (e) {} sfx('ui_unlock'); toast(`Echo Rune: ${SP[k].n} +${q} skill points`);
    // update only this card: its +number and the new (yellow) part of its bar; the other cards are left alone
    const host = $('rwCards'); if (!host) return;
    { const mine = [...host.querySelectorAll('.rcard:not(.road)')].find(c => c.querySelector('img') && c.querySelector('img').getAttribute('src') === ICON[k]); if (mine) mine.querySelectorAll('button.x2').forEach(b => b.remove()); if (!(PR.mTok > 0)) host.querySelectorAll('button.x2').forEach(b => b.remove()); }
    const el = [...host.querySelectorAll('.rcard:not(.road)')].find(c => c.querySelector('img') && c.querySelector('img').getAttribute('src') === ICON[k]);
    if (el) { const sp = PR.spells[k], need = CARDS[sp.lvl] || 1, b = el.querySelector('b'); if (b) b.textContent = '+' + got[k];
      const bar = el.querySelector('.pbar'); if (bar && sp.lvl < MAXL) bar.outerHTML = notches(sp.cards, need, got[k]);
      el.insertAdjacentHTML('beforeend', '<span class="x2 done">×2</span>');
      if (sp.lvl < MAXL && sp.cards >= need && !el.classList.contains('tapup')) { el.classList.add('tapup'); el.onclick = () => openSpell(k); el.insertAdjacentHTML('beforeend', '<small class="rcl rdy2">Tap to upgrade</small>'); } }
    const note = document.getElementById('mtkNote'); if (note) note.innerHTML = `${TOK_SVG}<span>Echo Rune used on ${M.mtSet.map(q => SP[q].n).join(', ')}.${PR.mTok > 0 ? ` ${PR.mTok} left.` : ''}</span>`;
    try { if (window.onMasteryUsed) onMasteryUsed(k); } catch (e) {}
  };
  const _rrc = renderRwCards;
  window.renderRwCards = renderRwCards = function () {
    const r = _rrc.apply(this, arguments), host = $('rwCards'), got = window.rwGot || {}; if (!host) return r;
    const set = (M && M.mtSet) || [], used = set.length ? set[set.length - 1] : null, can = PR.mTok > 0;
    host.querySelectorAll('.rcard:not(.road)').forEach(el => { const k = Object.keys(got).find(q => el.querySelector('img') && el.querySelector('img').getAttribute('src') === ICON[q]); if (!k) return;
      if (set.includes(k)) el.insertAdjacentHTML('beforeend', '<span class="x2 done">×2</span>'); else if (can) el.insertAdjacentHTML('beforeend', `<button class="x2" onclick="event.stopPropagation();masteryDouble('${k}')">×2</button>`); });
    let note = document.getElementById('mtkNote'); if (!note) { note = document.createElement('div'); note.id = 'mtkNote'; note.className = 'mtknote'; host.after(note); }
    note.innerHTML = Object.keys(got).length ? (used && !(PR.mTok > 0) ? `${TOK_SVG}<span>Echo Rune used on ${set.map(q => SP[q].n).join(', ')}.</span>` : PR.mTok > 0 ? `${TOK_SVG}<span>Tap <b>×2</b> on any ability to spend an Echo Rune and double its points. You have ${PR.mTok}.</span>` : `${TOK_SVG}<span>No Echo Runes. Earn one each level up, or buy them in the shop.</span>`) : '';
    return r;
  };
  const _gx = gainXp;
  window.gainXp = gainXp = function () { const from = PR.lvl, r = _gx.apply(this, arguments); if (PR.lvl > from) { PR.mTok = (PR.mTok || 0) + (PR.lvl - from); PR.tokPick = (PR.tokPick || 0) + (PR.lvl - from); } return r; };
  window.buyMastery = function () { if (PR.gems < 40) return toast('Not enough gems'); PR.gems -= 40; PR.mTok = (PR.mTok || 0) + 3; try { save(); } catch (e) {} refreshMeta(); renderShop(); toast('+3 Echo Runes'); };
  const _rs = renderShop;
  window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments); const host = document.getElementById('packs'); if (host && !document.getElementById('mtkShop')) host.insertAdjacentHTML('afterend', `<div id="mtkShop"></div>`);
    const m = document.getElementById('mtkShop'); if (m) m.innerHTML = `<div class="mtkbuy">${TOK_SVG}<div><b>Echo Runes ×3</b><small>After a match, double one ability's skill points. You have ${PR.mTok}.</small></div><button onclick="buyMastery()" ${PR.gems < 40 ? 'disabled' : ''}>${SVG.gem}40</button></div>`; return r; };

  /* ---------------- path-aware wording ---------------- */
  const _rm2 = refreshMeta;
  window.refreshMeta = refreshMeta = function () { const r = _rm2.apply(this, arguments); const l = document.getElementById('custLbl'); if (l) l.textContent = PR.look && PR.look.cls === 'sorc' ? 'Sorcerer' : 'Wizard'; return r; };

  /* ---------------- unlock tokens: you choose Spell or Technique at each checkpoint ---------------- */
  window.dualTok = cls => `<span class="dtok ${cls}"><img src="${tokenImg()}"><img src="${tokenImg('sorc')}"></span>`;
  if (PR.tokPick === undefined) PR.tokPick = 0;
  window.showTokenModal = showTokenModal = function () {
    if (!(PR.tokPick > 0)) { nextModal(); return; }
    const el = $('upm'); el.style.setProperty('--c', '#ffd45e'); $('upK').textContent = PR.tokPick > 1 ? PR.tokPick + ' unlock tokens to choose!' : 'Unlock token earned!';
    $('upImg').src = tokenImg(); $('upName').textContent = 'Choose your token'; $('upLv').innerHTML = '<span class="to">Spell or Technique?</span>';
    $('upDesc').textContent = 'Spell Tokens unlock wizard spells. Technique Tokens unlock sorcerer techniques.'; $('upDesc').style.display = 'block';
    $('upStats').innerHTML = `<div class="tkch"><button onclick="pickTok('tokens')"><img src="${tokenImg()}"><b>Spell Token</b><small>You have ${PR.tokens || 0}</small></button><button class="s" onclick="pickTok('tokS')"><img src="${tokenImg('sorc')}"><b>Technique Token</b><small>You have ${PR.tokS || 0}</small></button></div>`;
    $('upOk').style.visibility = 'hidden'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  };
  window.pickTok = function (tk) { if (!(PR.tokPick > 0)) return; PR.tokPick--; PR[tk] = (PR[tk] || 0) + 1; try { save(); } catch (e) {} refreshMeta(); sfx('ui_unlock'); toast('+1 ' + (tk === 'tokS' ? 'Technique' : 'Spell') + ' Token');
    if (PR.tokPick > 0) showTokenModal(); else { $('upm').classList.remove('on'); $('upOk').style.visibility = 'visible'; $('upStats').innerHTML = ''; $('upDesc').style.display = 'none'; nextModal(); } };
  if (PR.tokPick > 0) setTimeout(() => queueModal(() => showTokenModal()), 800);

  // one-time grant asked for on 2026-11-22: 3 Spell Tokens and 3 Technique Tokens
  if (!PR.grant1122) { PR.grant1122 = 1; PR.tokens = (PR.tokens || 0) + 3; PR.tokS = (PR.tokS || 0) + 3; try { save(); } catch (e) {} }
  if (PR.hand && PR.hand.length >= 4) PR.handInit = 1;

  // round losing streaks (for Chosen One's upgrades): two losses in a row opens them for the rest of the match
  const _er0 = endRound;
  window.endRound = endRound = function (winner) {
    if (!ended && M) { const loser = winner === 'me' ? 'foe' : 'me'; M.lossRun = M.lossRun || { me: 0, foe: 0 }; M.chosenOpen = M.chosenOpen || {}; M.lossRun[loser]++; M.lossRun[winner] = 0; if (M.lossRun[loser] >= 2) M.chosenOpen[loser] = 1; }
    return _er0.apply(this, arguments);
  };

  // only one Chosen One per book (like Spell Cannon)
  try { ONE_COPY.add('chosen'); } catch (e) {}

  /* ---------------- daily challenges ----------------
     Five a day from a pool. Finishing one pays gold; a finished one can be swapped for coins. */
  const CH_POOL = [
    { id: 'deal', n: 'Deal 300 damage', key: 'dealt', need: 300 }, { id: 'take', n: 'Take 250 damage', key: 'taken', need: 250 }, { id: 'win2', n: 'Win 2 matches', key: 'wins', need: 2 },
    { id: 'flawless', n: 'Win a match without losing a round', key: 'flawless', need: 1 }, { id: 'play3', n: 'Play 3 matches', key: 'matches', need: 3 }, { id: 'rounds', n: 'Win 6 rounds', key: 'rounds', need: 6 },
    { id: 'sorc', n: 'Win with a mostly technique book', key: 'sorcW', need: 1 }, { id: 'wiz', n: 'Win with a mostly spell book', key: 'wizW', need: 1 }, { id: 'tech', n: 'Use techniques 25 times', key: 'techCasts', need: 25 },
    { id: 'spell', n: 'Cast spells 25 times', key: 'spellCasts', need: 25 }, { id: 'ups', n: 'Take 6 upgrades in drafts', key: 'ups', need: 6 }, { id: 'big', n: 'Deal 150 damage in one match', key: 'dealtMax', need: 150, max: 1 },
    { id: 'tank', n: 'Win a match after taking 100 damage', key: 'tankWin', need: 1 }, { id: 'streak', n: 'Win 2 matches in a row', key: 'streakNow', need: 2, max: 1 },
  ];
  const CH_COST = 60, CH_GOLD = 50, today = () => new Date().toISOString().slice(0, 10);
  function chState() { if (!PR.ch || PR.ch.day !== today()) { PR.ch = { day: today(), list: CH_POOL.slice().sort(() => Math.random() - .5).slice(0, 5).map(c => ({ id: c.id, p: 0, done: 0 })) }; try { save(); } catch (e) {} } return PR.ch; }
  function chProgress(d) { const st = chState(), got = [];
    for (const c of st.list) { if (c.done) continue; const def = CH_POOL.find(q => q.id === c.id); if (!def) continue; const v = d[def.key] || 0; c.p = def.max ? Math.max(c.p, v) : c.p + v;
      if (c.p >= def.need) { c.done = 1; PR.coins = (PR.coins || 0) + CH_GOLD; c.gold = CH_GOLD; got.push(def.n + ': +' + CH_GOLD + ' gold'); } }
    try { save(); } catch (e) {} if (got.length) setTimeout(() => toast('Challenge done! ' + got[0] + (got.length > 1 ? ' (+' + (got.length - 1) + ' more)' : '')), 4200); chDot(); }
  function chDot() { const st = chState(), el = document.getElementById('chDot'); if (el) el.textContent = st.list.filter(c => c.done).length + '/5'; }
  window.swapChallenge = function (i) { const st = chState(), c = st.list[i]; if (!c || !c.done || PR.coins < CH_COST) return; const free = CH_POOL.filter(q => !st.list.some(l => l.id === q.id)); if (!free.length) return; PR.coins -= CH_COST; st.list[i] = { id: free[Math.random() * free.length | 0].id, p: 0, done: 0 }; try { save(); } catch (e) {} refreshMeta(); openChallenges(); };
  window.openChallenges = function () { const st = chState();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Daily Challenges</div><div class="ssub" style="margin:0">New set every day. Each one pays ${CH_GOLD} gold.</div><div class="chl">${st.list.map((c, i) => { const def = CH_POOL.find(q => q.id === c.id) || { n: c.id, need: 1 };
      return `<div class="chrow ${c.done ? 'done' : ''}"><div class="cg"><b>${def.n}</b><div class="chbar"><i style="width:${Math.min(100, c.p / def.need * 100)}%"></i><span>${c.done ? 'Done' : Math.floor(Math.min(c.p, def.need)) + ' / ' + def.need}</span></div>${c.done ? `<small>+${c.gold || CH_GOLD} gold</small>` : ''}</div>${c.done ? `<button onclick="swapChallenge(${i})" ${PR.coins < CH_COST ? 'disabled' : ''}>New<small><span class="ci coin-i"></span>${CH_COST}</small></button>` : ''}</div>`; }).join('')}</div>`;
    $('sheet').classList.add('on'); };
  window.CH_DEBUG = { chProgress, chState };
  const _rmC = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rmC.apply(this, arguments); try { chDot(); } catch (e) {} return r; };

  /* ---------------- text length guard ----------------
     Upgrade text has to fit a draft card beside its button; ability text has to fit the detail sheet. */
  const MAX_UP = 80, MAX_AB = 140;
  for (const k in UPG) for (const u of UPG[k]) if (u.d.length > MAX_UP) console.warn(`[text] ${k}.${u.id} upgrade text is ${u.d.length} chars (max ${MAX_UP})`);
  for (const k in SP) if (SP[k].d && SP[k].d.length > MAX_AB) console.warn(`[text] ${k} description is ${SP[k].d.length} chars (max ${MAX_AB})`);

  const css = document.createElement('style'); css.textContent = `
  .card .desc{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
  .card .txt{min-width:0}.card .nm{overflow:hidden;text-overflow:ellipsis}
  .upinfo.on div{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .unl.lkonly{padding:3px 9px!important}.unl.lkonly svg{width:15px;height:15px;display:block}
  .ptitle{display:flex;align-items:center;gap:6px;margin:1px 0 3px;font:11.5px 'Lilita One',system-ui;color:#ffd45e;letter-spacing:.3px;cursor:pointer;-webkit-text-stroke:.6px #000;paint-order:stroke}
  .ptitle .cs{font:800 9.5px system-ui;-webkit-text-stroke:0;color:#9ff5e0;background:#0009;border:1.5px solid #000;border-radius:7px;padding:0 5px;letter-spacing:0}
  .ptitle.wd{justify-content:center;margin-top:4px}.ptitle .ch{font:800 9.5px system-ui;-webkit-text-stroke:0;color:#cdbbff;text-decoration:underline}
  .vst{font:12px 'Lilita One',system-ui;color:#ffd45e;-webkit-text-stroke:.6px #000;paint-order:stroke;margin-top:-2px}
  .ttl{display:flex;flex-direction:column;gap:6px;max-height:52vh;overflow:auto;padding:2px}
  .trow{position:relative;display:flex;flex-direction:column;gap:1px;padding:8px 34px 8px 12px;border:2px solid #000;border-radius:12px;background:#2a1f4a;cursor:pointer;text-align:left}
  .trow b{font:15px 'Lilita One',system-ui;color:#fff}.trow small{font:700 11px system-ui;color:#cdbbff}.trow small em{font-style:normal;color:#ffd45e}
  .trow.on{background:linear-gradient(#6a4bd6,#3f2a8f);box-shadow:0 0 0 2px #ffd45e inset}.trow i{position:absolute;right:12px;top:50%;transform:translateY(-50%);font:900 16px system-ui;color:#ffd45e;font-style:normal}
  .trow.lk{opacity:.6;cursor:default}.trow .tlk{position:absolute;right:11px;top:50%;transform:translateY(-50%);width:15px}.trow .tlk svg{width:15px;height:15px;display:block}
  #rep{background:#05030cee}
  #detail .ups{max-height:64px;overflow-y:auto}#detail .ups .more{background:#2a1f4a!important;color:#ffd45e!important;cursor:pointer}#detail .ups .none{opacity:.6;font-style:italic}
  .dact.ud{background:linear-gradient(#5a5a7a,#3a3a55)!important}.undoO{display:block;margin:0 auto 6px;background:none;border:0;color:#cdbbff;font:800 12px system-ui;text-decoration:underline;cursor:pointer}
  .bseg button.rec{position:relative;box-shadow:0 0 0 2px #ffd45e inset}.rtag{position:absolute;top:-8px;right:4px;font:900 8.5px system-ui;font-style:normal;background:#ffd45e;color:#000;border:1.5px solid #000;border-radius:6px;padding:0 4px}
  .rwhy{font:700 11px system-ui;color:#ffe9a8;text-align:center;margin-top:4px}
  .x2{position:absolute;top:-8px;right:-8px;font:13px 'Lilita One',system-ui;background:linear-gradient(#ffd45e,#d99a14);color:#2a1a00;border:2px solid #000;border-radius:9px;padding:1px 6px;cursor:pointer;z-index:2;animation:breathe 1.2s ease-in-out infinite}.x2.done{animation:none;background:#2fd08a;color:#000}
  .rcard{position:relative}.mtknote{display:flex;align-items:center;gap:8px;justify-content:center;font:700 11.5px system-ui;color:#ffe9a8;margin:6px 10px 0;text-align:left}.mtknote .mtk{width:22px;height:22px}
  .dtok{display:inline-flex;align-items:center}.dtok img{width:30px;height:30px}.dtok img+img{margin-left:-12px}.dtok.rsp img{width:26px;height:26px}.ms .mi .dtok img{width:21px;height:21px}.ms .mi .dtok img+img{margin-left:-11px}.ms .mx small{display:block;font:700 9.5px system-ui;color:#cdbbff}
  .tkch{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}.tkch button{display:flex;flex-direction:column;align-items:center;gap:3px;border:2.5px solid #000;border-radius:14px;padding:10px 6px;background:linear-gradient(#b9a6ff,#4a2aa8);color:#fff;cursor:pointer;box-shadow:0 4px 0 #000}.tkch button.s{background:linear-gradient(#ff9a9a,#9a1020)}.tkch img{width:44px;height:44px}.tkch b{font:15px 'Lilita One',system-ui}.tkch small{font:700 10px system-ui;opacity:.9}
  .mtk{width:30px;height:30px;flex:none}.mtkrow,.mtkbuy{display:flex;align-items:center;gap:9px;background:#0006;border:2px solid #000;border-radius:12px;padding:7px 9px;margin:2px 0}.mtkrow.on{box-shadow:0 0 0 2px #ffd45e inset;background:#3a2c0a99}
  .mtkrow div,.mtkbuy div{flex:1;display:flex;flex-direction:column}.mtkrow b,.mtkbuy b{font:14px 'Lilita One',system-ui;color:#ffd45e}.mtkrow small,.mtkbuy small{font:700 10.5px system-ui;color:#e8e0ff;line-height:1.2}
  .mtkrow button,.mtkbuy button{font:14px 'Lilita One',system-ui;background:linear-gradient(#ffd45e,#d99a14);border:2px solid #000;border-radius:10px;padding:6px 12px;color:#2a1a00;cursor:pointer;display:flex;align-items:center;gap:3px}.mtkrow button:disabled,.mtkbuy button:disabled{opacity:.45}.mtkbuy button svg{width:15px;height:15px}.mtkbuy{margin:0 0 14px}
  /* Safari: a filter on the clipped top curtain clipped its children (the damage tiles); draw the diagonal shadow as a band on the bottom panel instead */
  .curtain .top{filter:none!important}.curtain .bot::before{content:"";position:absolute;left:0;right:0;top:0;bottom:0;background:#000;clip-path:polygon(0 21.4%,100% 7.5%,100% calc(7.5% + 5px),0 calc(21.4% + 5px));z-index:3;pointer-events:none}
  /* Safari: keep the tab bar and its raised button in one layer so no seam line crosses the buttons */
  .tabbar{isolation:isolate;transform:translateZ(0)}.tab{will-change:transform}.tab.on{z-index:2}
  .abtabs{display:flex;gap:6px;margin:8px 0 10px;background:#000a;border:2px solid #000;border-radius:14px;padding:3px}.abtabs button{flex:1;font:15px 'Lilita One',system-ui;padding:8px 4px;border-radius:10px;border:none;background:none;color:#8d7fbf;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
  .abtabs button.on{background:linear-gradient(#4a3a80,#33275e);color:#fff;box-shadow:inset 0 -3px 0 #0006,0 0 0 2px #000}.abtabs small{font:800 10px system-ui;opacity:.75}
  .battle.needhand{filter:grayscale(.75) brightness(.8)}
  #custLbl{width:auto!important;height:auto!important;display:inline!important;white-space:nowrap}.cust{white-space:nowrap}
  .chbtn{position:absolute;top:10px;left:10px;z-index:2;display:flex;align-items:center;gap:6px;font:13px 'Lilita One',system-ui;padding:5px 9px;border-radius:12px;border:2px solid #000;background:linear-gradient(#ffd45e,#d99a14);color:#2a1a00;cursor:pointer;box-shadow:0 3px 0 #000}.chbtn i{font:800 10px system-ui;font-style:normal;background:#000a;color:#fff;border-radius:7px;padding:0 5px}
  .stage .st{pointer-events:none;top:44px!important}
  .chl{display:flex;flex-direction:column;gap:7px}.chrow{display:flex;align-items:center;gap:8px;background:#0006;border:2px solid #000;border-radius:12px;padding:8px 10px}.chrow.done{box-shadow:0 0 0 2px #2fd08a inset}.chrow .cg{flex:1;display:flex;flex-direction:column;gap:4px}
  .chrow b{font:14px 'Lilita One',system-ui;color:#fff}.chrow small{font:700 10.5px system-ui;color:#8ff0a4}.chbar{position:relative;height:14px;border-radius:8px;background:#000a;border:1.5px solid #000;overflow:hidden}.chbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#ffd45e,#d99a14)}.chrow.done .chbar i{background:linear-gradient(#5fe08a,#22a85a)}
  .chbar span{position:absolute;inset:0;font:800 9.5px/12px system-ui;color:#fff;text-align:center;text-shadow:0 1px 0 #000}.chrow button{font:13px 'Lilita One',system-ui;background:linear-gradient(#b9a6ff,#4a2aa8);color:#fff;border:2px solid #000;border-radius:10px;padding:4px 9px;cursor:pointer;display:flex;flex-direction:column;align-items:center}.chrow button small{color:#fff;display:flex;align-items:center;gap:2px}.chrow button:disabled{opacity:.45}
  .mvh{font:700 11px system-ui;color:#9ff5e0;text-align:center;margin-top:4px}
  .ctrs{display:flex;flex-direction:column;gap:5px;margin:2px 0}.crow{display:flex;align-items:center;gap:8px;background:#0006;border:2px solid #000;border-radius:12px;padding:5px 8px}
  .crow span{font:800 10.5px system-ui;width:74px;flex:none;line-height:1.1}.crow.g span{color:#8ff0a4}.crow.b span{color:#ff9aa6}.crow div{display:flex;gap:4px;flex-wrap:wrap}.crow img{width:28px;height:28px;cursor:pointer}`;
  document.head.appendChild(css);
  try { ST(); refreshMeta(); } catch (e) {}
})();

/* ---------------- anti-lock rules: chained-stun immunity, summon cap, draft offer limits ---------------- */
(function () {
  /* F-418: after a stun ends the fighter can't be stunned for 1s; each further stun that lands within 5s of the
     last one ending adds 0.5s to that window. A stun can't be extended while it is running. stunT and stunImm become
     accessors on each fighter so every stun source in the game goes through the same rule. */
  function hookStun(w) {
    if (w._stunHook) return; w._stunHook = 1;
    let st = +w.stunT || 0, im = +w.stunImm || 0;
    Object.defineProperty(w, 'stunImm', { configurable: true, enumerable: true, get() { return im; },
      set(v) { v = +v || 0; if (v < im || w._immSet) im = v; } });   // other code may only count it down
    Object.defineProperty(w, 'stunT', { configurable: true, enumerable: true, get() { return st; },
      set(v) {
        v = +v || 0;
        if (st <= 0 && v > 0) {
          if (im > 0) { if (T - (w._immSaid || -9) > .8 && typeof text === 'function') { w._immSaid = T; text(w.x, w.y - 96 * HS, 'IMMUNE', '#cfe6ff'); } return; }
          w.stunChain = T - (w.stunEndT === undefined ? -99 : w.stunEndT) < 5 ? (w.stunChain || 0) + 1 : 1;
        } else if (st > 0 && v > st) return;                                     // no stacking onto a running stun
        else if (st > 0 && v <= 0) { w.stunEndT = T; w._immSet = 1; w.stunImm = 1 + .5 * ((w.stunChain || 1) - 1); w._immSet = 0; }
        st = v;
      } });
  }
  window.STUN_DEBUG = { hookStun };

  /* F-420: at most 10 summons alive per caster; the oldest crumble */
  let seq = 0;
  function capSummons() {
    for (const w of ents) {
      const mine = [];
      for (const z of zombies) if (z.o === w && z.hp > 0) mine.push(z);
      for (const g of golems) if (g.o === w && g.hp > 0) mine.push(g);
      for (const a of archers) if (a.o === w && a.hp > 0) mine.push(a);
      for (const e of mine) if (!e._born) e._born = ++seq;
      if (mine.length <= 10) continue;
      mine.sort((p, q) => p._born - q._born);
      for (const e of mine.slice(0, mine.length - 10)) {
        e.hp = 0; e.crumbled = 1;
        burst(e.x, e.y - 14 * HS, 16, ['#bfb4a0', '#6e6456', '#3a332b'], 120, 4, .6);
        for (let j = 0; j < 6; j++) P({ x: e.x + rnd(-10, 10), y: e.y - rnd(0, 26), vx: rnd(-20, 20), vy: rnd(-40, -10), color: '#8a8070', size: rnd(3, 6), life: rnd(.5, .9), glow: false });
      }
    }
  }
  window.SUMMON_CAP = 10;

  const _u = update;
  window.update = update = function (dt) {
    if (typeof ents !== 'undefined' && ents) ents.forEach(hookStun);
    const r = _u(dt);
    try { if (typeof ents !== 'undefined' && ents && !ended) capSummons(); } catch (e) {}
    return r;
  };

  /* F-422 / F-423: a draft offer holds at most 2 cards for one ability, at most one targeting upgrade,
     and never two upgrades from the same either-or group */
  const okIn = (list, c) => {
    if (list.filter(q => q.k === c.k).length >= 2) return false;
    if (c.type === 'up' && c.u) {
      if (list.some(q => q.type === 'up' && q.k === c.k && q.u.id === c.u.id)) return false;
      if (c.u.tgt && list.some(q => q.type === 'up' && q.u && q.u.tgt)) return false;
      if (c.u.grp && list.some(q => q.type === 'up' && q.k === c.k && q.u && q.u.grp === c.u.grp)) return false;
    } else if (list.some(q => q.type === c.type && q.k === c.k)) return false;
    return true;
  };
  const _go = genOffer;
  window.genOffer = genOffer = function (p, round) {
    const out = [];
    const seen = [];
    for (let i = 0; i < 25 && out.length < 3; i++) { const o = _go(p, round) || []; if (!o.length) break; for (const c of o) { seen.push(c); if (out.length < 3 && okIn(out, c)) out.push(c); } }
    // never fewer than 3 cards: if the limits above leave a gap, they give way (an identical card is still never shown twice)
    const same = (a, b) => a.type === b.type && a.k === b.k && (a.type !== 'up' || a.u.id === b.u.id);
    for (const c of seen) if (out.length < 3 && !out.some(q => same(q, c))) out.push(c);
    if (out.length < 3) { const full = p.book.length >= capOf() && round > 1;
      for (const k of (p.pool || M.unlocked).slice().sort(() => Math.random() - .5)) { if (out.length >= 3) break; if (ONE_COPY.has(k) && p.book.includes(k)) continue; const c = { type: full ? 'replace' : 'new', k }; if (!out.some(q => same(q, c))) out.push(c); } }
    return out.sort(() => Math.random() - .5);
  };
  window.OFFER_DEBUG = { okIn };
})();

/* ---------------- targeting setting on the Your Abilities screen (F-447) ----------------
   For abilities that aim, pick who they go for: Auto (the ability's normal behaviour), Caster, or Summons first
   with a sub-choice of strongest or weakest. Saved on the profile, so it carries over between rounds and matches. */
(function () {
  const keyOf = () => { try { const b = M.me.book; return b[M.swapSel ?? (M.lastAdded >= 0 ? M.lastAdded : 0)]; } catch (e) { return null; } };
  window.setTgt = function (k, v) { PR.tgt = PR.tgt || {}; if (v === 'mobs') v = (PR.tgt[k] === 'weak' ? 'weak' : 'strong'); PR.tgt[k] = v; try { save(); } catch (e) {} renderBook(); };
  const _rb = renderBook;
  window.renderBook = renderBook = function () {
    const r = _rb.apply(this, arguments);
    try {
      const k = keyOf(), det = document.getElementById('detail'); if (!k || !det || !(window.TGT_ABLE || []).includes(k)) return r;
      const v = (PR.tgt && PR.tgt[k]) || 'auto', mob = v === 'strong' || v === 'weak';
      const b = (id, n, on) => `<button class="${on ? 'on' : ''}" onclick="event.stopPropagation();setTgt('${k}','${id}')">${n}</button>`;
      det.insertAdjacentHTML('beforeend', `<div class="tgtrow"><span>Targets</span><div class="bseg">${b('auto', k === 'rush' ? 'Nearest' : 'Auto', v === 'auto')}${b('caster', 'Caster', v === 'caster')}${b('mobs', 'Summons', mob)}</div>${mob ? `<div class="bseg sub">${b('strong', 'Strongest first', v === 'strong')}${b('weak', 'Weakest first', v === 'weak')}</div>` : ''}</div>`);
    } catch (e) {}
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.tgtrow{flex-basis:100%;width:100%;margin-top:8px}.tgtrow>span{display:block;font:11px 'Lilita One';letter-spacing:1px;color:#b9a6ee;margin:0 0 4px 2px;text-transform:uppercase}.tgtrow .bseg button{font-size:12px;padding:7px 2px}.tgtrow .bseg.sub{margin-top:4px}#detail{flex-wrap:wrap}`;
  document.head.appendChild(css);
})();

/* ---------------- Ability Trials (F-450) ----------------
   Every ability has three trial tracks: damage dealt with it, matches played with it in your book, and wins with it.
   Each track has three tiers; clearing a tier pays skill points to that ability. Shown on the ability's page. */
(function () {
  const TR = [
    { id: 'dmg', n: 'Deal damage with it', goals: [300, 1500, 5000], pay: [15, 30, 60] },
    { id: 'games', n: 'Play matches with it', goals: [5, 20, 50], pay: [10, 25, 50] },
    { id: 'wins', n: 'Win matches with it', goals: [3, 12, 30], pay: [15, 35, 70] },
  ];
  const st = k => { PR.trial = PR.trial || {}; return PR.trial[k] = PR.trial[k] || { dmg: 0, games: 0, wins: 0, got: { dmg: 0, games: 0, wins: 0 } }; };
  // damage is counted per round, so add it up before the next round wipes it
  let acc = {};
  const _sd = startDuel;
  window.startDuel = startDuel = function () { try { if (M && M.rdmg && M.rdmg.me) for (const k in M.rdmg.me) acc[k] = (acc[k] || 0) + M.rdmg.me[k]; } catch (e) {} return _sd.apply(this, arguments); };
  const _nm = newMatch;
  window.newMatch = newMatch = function () { acc = {}; return _nm.apply(this, arguments); };
  const _sr = showRewards;
  window.showRewards = showRewards = function () {
    try { if (M && !M._trialDone && !window.ONB_ACTIVE) { M._trialDone = 1;
      const dm = Object.assign({}, acc); if (M.rdmg && M.rdmg.me) for (const k in M.rdmg.me) dm[k] = (dm[k] || 0) + M.rdmg.me[k];
      const won = M.score.me > M.score.foe, msgs = [];
      for (const k of new Set(M.me.book.concat(Object.keys(dm)))) { if (!SP[k] || !PR.spells || !PR.spells[k]) continue; const s = st(k);
        if (dm[k]) s.dmg += Math.round(dm[k]); if (M.me.book.includes(k)) { s.games++; if (won) s.wins++; }
        for (const t of TR) while (s.got[t.id] < 3 && s[t.id] >= t.goals[s.got[t.id]]) { const q = t.pay[s.got[t.id]]; s.got[t.id]++; PR.spells[k].cards += q; msgs.push(`${SP[k].n} trial cleared: +${q} skill points`); } }
      acc = {}; try { save(); } catch (e) {}
      msgs.slice(0, 3).forEach((m, i) => setTimeout(() => { try { toast(m); } catch (e) {} }, 1400 + i * 1600)); } } catch (e) {}
    return _sr.apply(this, arguments);
  };
  function trialHTML(k) { const s = st(k);
    return `<div class="trials"><div class="trh">Trials</div>${TR.map(t => { const g = s.got[t.id], done = g >= 3, goal = t.goals[Math.min(2, g)], p = Math.min(1, s[t.id] / goal);
      return `<div class="trw ${done ? 'done' : ''}"><div class="trt"><span>${t.n}</span><b>${done ? 'Complete' : `${Math.min(s[t.id], goal).toLocaleString()} / ${goal.toLocaleString()}`}</b></div><div class="trb"><i style="width:${(done ? 1 : p) * 100}%"></i></div><div class="trp">${[0, 1, 2].map(i => `<em class="${i < g ? 'on' : ''}">${i < g ? '✓' : '+' + t.pay[i]}</em>`).join('')}</div></div>`; }).join('')}</div>`; }
  window.trialHTML = trialHTML;
  const _os = window.openSpell;
  window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments); try { const P = document.getElementById('sheetP'); if (P && !P.querySelector('.trials') && (typeof isUnl !== 'function' || isUnl(k))) { const at = P.querySelector('.ctrs') || P.querySelector('.ups')?.parentElement || P.querySelector('.shd'); if (at) at.insertAdjacentHTML('afterend', trialHTML(k)); } } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `.trials{margin:10px 0 4px;background:#0006;border:2px solid #000;border-radius:12px;padding:8px 10px}.trh{font:13px 'Lilita One';letter-spacing:1px;color:#ffd75e;margin-bottom:4px}.trw{margin:6px 0}.trt{display:flex;justify-content:space-between;font:12px Nunito;font-weight:800;color:#e8e0ff}.trt b{color:#b9a6ee;font-weight:800}.trw.done .trt b{color:#7dffa8}.trb{height:7px;background:#000;border-radius:5px;overflow:hidden;margin:3px 0}.trb i{display:block;height:100%;background:linear-gradient(90deg,#7a5cff,#c48cff)}.trw.done .trb i{background:linear-gradient(90deg,#2fd08a,#7dffa8)}.trp{display:flex;gap:6px}.trp em{font:10px 'Lilita One';font-style:normal;color:#8d7fbf;background:#1a1236;border:1.5px solid #000;border-radius:6px;padding:1px 6px}.trp em.on{color:#0b2a14;background:#7dffa8}`;
  document.head.appendChild(css);
})();

/* ---------------- Starting upgrades (F-455, F-462) ----------------
   Every 5 levels an ability earns a slot. Fill it with one of its upgrades that doesn't need another upgrade first;
   that ability then starts every match with it. Tap a chosen one to clear the slot. Rivals get the same number of
   random starting upgrades for their levels, so it stays fair. */
(function () {
  const slotsOf = lvl => Math.floor((lvl || 1) / 5);
  const eligible = k => (UPG[k] || []).filter(u => !u.req && k !== 'chosen');
  const startOf = k => { const s = PR.spells && PR.spells[k]; if (!s) return []; s.start = (s.start || []).filter(id => eligible(k).some(u => u.id === id)); return s.start; };
  const blocked = (k, list, u) => u.grp && list.some(id => { const o = UPG[k].find(q => q.id === id); return o && o.grp === u.grp; });
  window.startUps = startOf;
  const _nm = newMatch;
  window.newMatch = newMatch = function () {
    const r = _nm.apply(this, arguments);
    try { if (M && !window.ONB_ACTIVE) {
      for (const k of (PR.hand || [])) for (const id of startOf(k)) M.me.up.add(k + '.' + id);
      const fl = M.foeLv || {}; for (const k of (M.foe.pool || [])) { const n = slotsOf(fl[k]), pool = eligible(k).sort(() => Math.random() - .5), got = [];
        for (const u of pool) { if (got.length >= n) break; if (blocked(k, got, u)) continue; got.push(u.id); M.foe.up.add(k + '.' + u.id); } }
    } } catch (e) {}
    return r;
  };
  window.pickStart = function (k, id) { const s = PR.spells[k], list = startOf(k);
    if (list.includes(id)) s.start = list.filter(q => q !== id);
    else if (list.length < slotsOf(s.lvl)) { const u = UPG[k].find(q => q.id === id); if (!u || blocked(k, list, u)) return; s.start = list.concat(id); }
    try { save(); } catch (e) {} openSpell(k); };
  function startHTML(k) { const s = PR.spells[k], n = slotsOf(s.lvl), list = startOf(k), el = eligible(k);
    if (!el.length) return '';
    const next = n < 4 ? `Next slot at level ${(n + 1) * 5}.` : '';
    const chips = el.map(u => { const on = list.includes(u.id), can = on || (list.length < n && !blocked(k, list, u));
      return `<button class="stc ${on ? 'on' : ''}" ${can ? `onclick="event.stopPropagation();pickStart('${k}','${u.id}')"` : 'disabled'}>${on ? '✓ ' : ''}${u.n}</button>`; }).join('');
    return `<div class="starts"><div class="trh">Starting upgrades <small>${list.length} / ${n}</small></div><div class="ssub2">Every 5 levels, pick an upgrade this ability always starts a match with while it's in your battle hand. ${next}</div><div class="stl">${chips}</div></div>`; }
  const _os = window.openSpell;
  window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments); try { const P = document.getElementById('sheetP'); if (P && !P.querySelector('.starts') && (typeof isUnl !== 'function' || isUnl(k))) { const at = P.querySelector('.trials') || P.querySelector('.ctrs'); if (at) at.insertAdjacentHTML('afterend', startHTML(k)); } } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `.starts{margin:8px 0 4px;background:#0006;border:2px solid #000;border-radius:12px;padding:8px 10px}.starts .trh small{color:#b9a6ee;font:11px Nunito;font-weight:800;margin-left:6px}.ssub2{font:11px Nunito;font-weight:700;color:#b9a6ee;margin:2px 0 6px}.stl{display:flex;flex-wrap:wrap;gap:5px}.stc{font:12px 'Lilita One';padding:5px 9px;border-radius:9px;border:2px solid #000;background:#2a1f52;color:#e8e0ff;cursor:pointer}.stc.on{background:linear-gradient(#ffd75e,#e0a91c);color:#3a1d00}.stc:disabled{opacity:.38;cursor:default}`;
  document.head.appendChild(css);
})();

/* ---------------- every menu screen scrolls (F-452, F-453) ---------------- */
(function () {
  const css = document.createElement('style');
  css.textContent = `.screen:not(#battle):not(#vs)>.content{overflow-y:auto;overflow-x:hidden;min-height:0;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none}.screen:not(#battle):not(#vs)>.content::-webkit-scrollbar{display:none}.screen:not(#battle):not(#vs)>.content>*{flex-shrink:0}.mc,.rwwrap{min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none}.rwwrap::-webkit-scrollbar,.mc::-webkit-scrollbar{display:none}.mc>*,.rwwrap>*{flex-shrink:0}`;
  document.head.appendChild(css);
})();

/* ---------------- music picker (F-456) ----------------
   Options get a Menu music and a Battle music choice from every track made so far; switching crossfades. */
(function () {
  const TRACKS = [['bgm_menu', 'Late Night Lounge'], ['bgm_menu_whimsy', 'Whimsical Tower'], ['bgm_battle', 'Offbeat Duel'], ['bgm_battle_take2', 'Offbeat Duel (take 2)'], ['bgm_battle_dark', 'Dark Ostinato'], ['bgm_battle_calm', 'Still Water']];
  window.MUSIC_TRACKS = TRACKS;
  const pick = slot => (SET()[slot === 'menu' ? 'bgmMenu' : 'bgmBattle']) || (slot === 'menu' ? 'bgm_menu' : 'bgm_battle');
  let slot = null;
  const _mu = window.music;
  window.music = music = function (id) { if (id === 'bgm_menu') { slot = 'menu'; id = pick('menu'); } else if (id === 'bgm_battle') { slot = 'battle'; id = pick('battle'); } else slot = null; return _mu(id); };
  window.setBgm = function (which, id) { SET()[which === 'menu' ? 'bgmMenu' : 'bgmBattle'] = id; try { save(); } catch (e) {}
    // hear it right away: crossfade to the new choice (back to the right track when the screen changes)
    try { auInit(); } catch (e) {} _mu(id); };
  const _sh = settingsHTML;
  window.settingsHTML = settingsHTML = function () {
    const h = _sh.apply(this, arguments);
    const sel = (which) => `<div class="opt"><span>${which === 'menu' ? 'Menu music' : 'Battle music'}</span><select class="bgmsel" onchange="setBgm('${which}',this.value)">${TRACKS.map(([id, n]) => `<option value="${id}" ${pick(which) === id ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
    return h.replace(/<\/div>$/, sel('menu') + sel('battle') + '</div>');
  };
  const css = document.createElement('style');
  css.textContent = `.bgmsel{font:13px 'Lilita One';background:#1a1236;color:#e8e0ff;border:2px solid #000;border-radius:9px;padding:5px 8px;max-width:58%}`;
  document.head.appendChild(css);
})();

/* ---------------- Options button on the home screen (F-456) ---------------- */
(function () {
  window.openOptions = function () {
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Options</div>${settingsHTML()}`;
    $('sheet').classList.add('on');
  };
  const add = () => { const st = document.querySelector('#home .stage'); if (!st || st.querySelector('.optbtn')) return;
    st.insertAdjacentHTML('beforeend', `<button class="optbtn" onclick="openOptions()" aria-label="Options"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.7a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"/></svg></button>`); };
  add(); document.addEventListener('DOMContentLoaded', add);
  const css = document.createElement('style');
  css.textContent = `#chBtn{top:88px!important}.optbtn{position:absolute;top:10px;left:10px;z-index:2;width:34px;height:34px;display:grid;place-items:center;border-radius:11px;border:2px solid #000;background:linear-gradient(#4a3a80,#2b2050);color:#fff;cursor:pointer;box-shadow:0 3px 0 #000;padding:0}`;
  document.head.appendChild(css);
})();

/* ---------------- phones: the game fills the screen and never scrolls the page; every sheet can always be closed
   (F-471, F-472, F-473) ---------------- */
(function () {
  const phone = matchMedia('(max-width: 600px), (pointer: coarse)').matches || navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const css = document.createElement('style');
  css.textContent = (phone ? `html,body{height:100%;overflow:hidden;overscroll-behavior:none;position:fixed;inset:0;width:100%}body{padding:0!important;gap:0!important;background:#0d0a18!important;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.notes,.pknote{display:none!important}
    .phone{position:fixed!important;top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);left:0;right:0;width:auto!important;aspect-ratio:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important}` : '') +
    // sheets: never taller than the screen; the panel scrolls inside and the close button rides along at the top
    `.sheet .panel{max-height:calc(100% - 28px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}.sheet .panel::-webkit-scrollbar{display:none}
    .sheet .panel>.xbtn{position:sticky!important;top:0;align-self:flex-end;margin:-6px -4px -40px 0;z-index:5;flex-shrink:0}
    .sheet .panel>*{flex-shrink:0}`;
  document.head.appendChild(css);
  if (phone) { const vp = document.querySelector('meta[name=viewport]'); if (vp) vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover'; }
  // a page-level swipe never scrolls the page itself: only something that can scroll inside the game moves
  if (phone) document.addEventListener('touchmove', e => { let n = e.target; while (n && n !== document.body) { const st = getComputedStyle(n); if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 1) return; n = n.parentElement; } if (e.cancelable) e.preventDefault(); }, { passive: false });
  // every sheet gets a close button, even ones built without one; Escape / the back gesture key also closes
  new MutationObserver(() => { const P = document.getElementById('sheetP'); if (P && document.getElementById('sheet').classList.contains('on') && !P.querySelector(':scope>.xbtn')) P.insertAdjacentHTML('afterbegin', '<button class="xbtn" onclick="closeSheet()">✕</button>'); }).observe(document.getElementById('sheet'), { attributes: true, childList: true, subtree: true });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; const sh = document.getElementById('sheet'); if (sh && sh.classList.contains('on')) return closeSheet(); const up = document.getElementById('upm'); if (up && up.style.display !== 'none' && getComputedStyle(up).display !== 'none') { const b = document.getElementById('upOk'); if (b) b.click(); } });
})();

/* ---------------- summons flash white when hit (F-465); freezing hurts and shattering kills (F-467) ---------------- */
(function () {
  const FL = .11, hit = e => { if (e) e._wf = T; };
  // brighten the creature by drawing it a second time additively for a split second after each hit
  for (const nm of ['drawZombie', 'drawGolem', 'drawArcher', 'drawSwarm']) { const f = window[nm]; if (typeof f !== 'function') continue;
    const g = function (e) { const r = f.apply(this, arguments); if (e && e._wf !== undefined && T - e._wf < FL && T >= e._wf) { const k = 1 - (T - e._wf) / FL; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .9 * k; try { f.apply(this, arguments); f.apply(this, arguments); } catch (er) {} ctx.restore(); } return r; };
    window[nm] = g; try { eval(nm + ' = g'); } catch (er) {} }
  // ice: freezing takes half the creature's health at once; any hit while it is frozen shatters the ice and kills it
  const shatter = (e, kill) => { e.frozen = 0; burst(e.x, e.y - 20 * HS, 26, ['#ffffff', '#d8f6ff', '#9fe0ff'], 220, 5, .55, 300); text(e.x, e.y - 60 * HS, 'SHATTERED', '#d8f6ff'); try { sfx('shatter', { x: e.x, vol: .5 }); } catch (er) {} kill(); };
  let freezing = false;
  const _hz = hurtZ;
  window.hurtZ = hurtZ = function (z, d, by, kind) {
    if (z && d > 0 && z.frozen > 0 && !freezing && z.hp > 0) { hit(z); return shatter(z, () => _hz.call(this, z, z.hp + 999, by, 'crush')); }
    if (z && d > 0) hit(z); return _hz.apply(this, arguments); };
  const _hs = hurtSwarm;
  window.hurtSwarm = hurtSwarm = function (q, d, fire) {
    if (q && d > 0 && q.frozen > 0 && !freezing && q.hp > 0) { hit(q); return shatter(q, () => { q.hp = 0; }); }
    if (q && d > 0) hit(q); return _hs.apply(this, arguments); };
  for (const nm of ['hurtGolem', 'hurtArcher']) { const f = window[nm]; if (typeof f !== 'function') continue; const g = function (e, d) { if (e && d > 0) hit(e); return f.apply(this, arguments); }; window[nm] = g; try { eval(nm + ' = g'); } catch (er) {} }
  try { hurtTotem = (f => function (e, d) { if (e && d > 0) hit(e); return f.apply(this, arguments); })(hurtTotem); } catch (er) {}
  // notice the moment something becomes frozen and take half its health
  const _up = update;
  window.update = update = function (dt) { const r = _up.apply(this, arguments);
    try { freezing = true;
      for (const z of zombies) { if (z.frozen > 0 && !z._fz && z.hp > 0) { z._fz = 1; _hz(z, (z.mx || z.hp) * .5, null, 'ice'); hit(z); text(z.x, z.y - 70 * HS, 'FROZEN', '#bff0ff'); } else if (!(z.frozen > 0)) z._fz = 0; }
      for (const q of swarms) { if (q.frozen > 0 && !q._fz && q.hp > 0) { q._fz = 1; q.hp -= (q.mx || q.hp) * .5; hit(q); } else if (!(q.frozen > 0)) q._fz = 0; }
    } catch (e) {} finally { freezing = false; }
    return r; };
})();

/* ---------------- a reward sound of its own when a spell or technique levels up (F-470) ---------------- */
(function () {
  const _sm = showSpellModal;
  window.showSpellModal = showSpellModal = function (k, from, to, unlockName) { const r = _sm.apply(this, arguments); if (!unlockName) try { setTimeout(() => sfx('ui_abilityup'), 120); } catch (e) {} return r; };
})();

/* ---------------- your gold on every ability page, next to the upgrade button (F-476) ---------------- */
(function () {
  const _os = window.openSpell;
  window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments);
    try { const P = document.getElementById('sheetP'), b = P && P.querySelector('.upbtn[onclick^="upgrade"]'); if (b && !P.querySelector('.goldnow')) b.insertAdjacentHTML('beforebegin', `<div class="goldnow"><span class="ci coin-i"></span>You have <b>${(PR.coins || 0).toLocaleString()}</b> gold</div>`); } catch (e) {}
    return r; };
  const _up = window.upgrade;
  if (typeof _up === 'function') window.upgrade = upgrade = function () { const r = _up.apply(this, arguments); try { const g = document.querySelector('#sheetP .goldnow b'); if (g) g.textContent = (PR.coins || 0).toLocaleString(); } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `.goldnow{display:flex;align-items:center;justify-content:center;gap:6px;font:13px Nunito;font-weight:800;color:#e8e0ff;margin:2px 0 -2px}.goldnow b{color:#ffd75e;font-family:'Lilita One';font-weight:400;font-size:15px}.goldnow .ci{width:18px;height:18px}`;
  document.head.appendChild(css);
})();
