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
    bloodoath: ['counter', 'titan', 'icewall', 'ghost', 'polarity', 'gale'],
    bloodcraft: ['icewall', 'shield', 'sanctum', 'ghost', 'titan'],
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
    { id: 'ch_e', n: 'Errand Runner', d: 'Complete 10 Easy challenges.', ok: () => ((PR.chDone || [])[0] || 0) >= 10, p: () => [(PR.chDone || [])[0] || 0, 10] },
    { id: 'ch_m', n: 'Taskmaster', d: 'Complete 10 Medium challenges.', ok: () => ((PR.chDone || [])[1] || 0) >= 10, p: () => [(PR.chDone || [])[1] || 0, 10] },
    { id: 'ch_h', n: 'Trial Breaker', d: 'Complete 10 Hard challenges.', ok: () => ((PR.chDone || [])[2] || 0) >= 10, p: () => [(PR.chDone || [])[2] || 0, 10] },
    { id: 'ch_all', n: 'Never Idle', d: 'Complete 50 challenges of any kind.', ok: () => (PR.chDone || []).reduce((a, b) => a + (b || 0), 0) >= 50, p: () => [(PR.chDone || []).reduce((a, b) => a + (b || 0), 0), 50] },
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
  window.TITLES = TITLES; window.statsOf = ST; window.activeTitle = () => (TITLES.find(t => t.id === PR.title && t.ok(ST())) || TITLES[0]).id;
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
  function titleHTML() { const cb = castBonus({ me: 1 }), hb = hpBonus({ me: 1 }); return `<span class="tn">${titleName()}</span>${cb > 0 ? `<span class="cs" style="white-space:nowrap">⚡+${Math.round(cb * 100)}%${hb > 0 ? ` ♥+${Math.round(hb * 100)}%` : ''}</span>` : ''}`; }
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
    robe: { azure: 'Azure Gi', crimson: 'Crimson Gi', moss: 'Moss Gi', amethyst: 'Amethyst Gi', midnight: 'Midnight Gi', frost: 'Frostweave Gi', sunfire: 'Sunfire Gi', royal: 'Royal Dogi', emerald: 'Emerald Gi', rosewood: 'Rosewood Gi', tide: 'Tidecaller Gi', ember: 'Emberweave Gi', stormcl: 'Stormcloud Gi', obsidian: 'Obsidian Gi', ivory: 'Ivory Dogi', voidweave: 'Voidweave Gi' },
    hat: { pointy: 'Headband', witch: 'Half Mask', hood: 'Cowl', feathered: 'Topknot', mushroom: 'Straw Hat', crown: 'Circlet' },
    beard: { white: 'White Hair', brown: 'Brown Hair', ginger: 'Ginger Hair', pink: 'Pink Hair', none: 'Black Hair', long: 'Silver Hair', blue: 'Blue Hair', green: 'Moss Hair', teal: 'Teal Hair', violet: 'Violet Hair', red: 'Scarlet Hair', goldlong: 'Golden Hair' },
  };
  const SORC_CATS = { robe: 'Gi', hat: 'Headgear', beard: 'Hair Colour' };
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
    // works well with: every ability that shares its element or its type (those pairs earn the hand bonuses), element matches first
    const base = q => (window.VARIANTS && VARIANTS[q] && VARIANTS[q].base) || q, all = Object.keys(SP).filter(q => q !== k && !(window.VARIANTS && VARIANTS[q]) && TYPE_OF[q]);
    const el = all.filter(q => ELEM_OF[q] && ELEM_OF[q] === ELEM_OF[base(k)]), ty = all.filter(q => !el.includes(q) && TYPE_OF[q] === TYPE_OF[base(k)] && SCHOOL_OF(q) === SCHOOL_OF(base(k))), well = el.concat(ty);
    const wrow = well.length ? `<div class="crow s"><span>Works well with</span><div class="cwrap">${well.map(q => `<img src="${ICON[q]}" title="${SP[q].n}" onclick="event.stopPropagation();toast('${SP[q].n.replace(/'/g, "\\'")} · ${ELEM_OF[q] === ELEM_OF[base(k)] ? 'same element' : 'same type'}')">`).join('')}</div></div>` : '';
    const h = row('Strong against', strong, 'g') + row('Watch out for', weak, 'b') + wrow;
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
  const SHORT = new Set(['rush', 'bloodoath', 'burnbody', 'orbs', 'counter', 'earthm', 'ringfire']), LONG = new Set(['beam', 'meteor', 'lightning', 'archer', 'storm', 'zombies', 'zodiac', 'golem', 'flies', 'dissect', 'bloodcraft']);
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
  window.buyMastery = function () { if (PR.gems < 50) return toast('Not enough gems'); PR.gems -= 50; PR.mTok = (PR.mTok || 0) + 1; try { save(); } catch (e) {} refreshMeta(); renderShop(); toast('+1 Echo Rune'); };
  const _rs = renderShop;
  window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments); const host = document.getElementById('packs'); if (host && !document.getElementById('mtkShop')) host.insertAdjacentHTML('afterend', `<div id="mtkShop"></div>`);
    const m = document.getElementById('mtkShop'); if (m) m.innerHTML = `<div class="mtkbuy">${TOK_SVG}<div><b>Echo Rune</b><small>After a match, double one ability's skill points. You have ${PR.mTok}.</small></div><button onclick="buyMastery()" ${PR.gems < 50 ? 'disabled' : ''}>${SVG.gem}50</button></div>`; return r; };

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
    if (!ended && M) { const loser = winner === 'me' ? 'foe' : 'me'; M.lossRun = M.lossRun || { me: 0, foe: 0 }; M.chosenOpen = M.chosenOpen || {}; M.lossRun[loser]++; M.lossRun[winner] = 0; if (M.lossRun[loser] >= 2 || (M.chosenShut && M.chosenShut[loser])) M.chosenOpen[loser] = 1;   /* (1.0.23) after a Chosen One upgrade is taken, the next one waits for another lost round */ }
    return _er0.apply(this, arguments);
  };

  // only one Chosen One per book (like Spell Cannon)
  try { ONE_COPY.add('chosen'); } catch (e) {}

  /* ---------------- daily challenges ----------------
     Five a day from a pool. Finishing one pays gold; a finished one can be swapped for coins. */
  // (1.0.28) tiers: t 0 easy (50 gold), 1 medium (100), 2 hard (150). A day's five and every swap are drawn at random across all tiers.
  const CH_POOL = [
    { id: 'deal', n: 'Deal 300 damage', key: 'dealt', need: 300, t: 0 }, { id: 'take', n: 'Take 250 damage', key: 'taken', need: 250, t: 0 }, { id: 'play3', n: 'Play 3 matches', key: 'matches', need: 3, t: 0 },
    { id: 'tech', n: 'Use techniques 25 times', key: 'techCasts', need: 25, t: 0 }, { id: 'spell', n: 'Cast spells 25 times', key: 'spellCasts', need: 25, t: 0 }, { id: 'rounds', n: 'Win 6 rounds', key: 'rounds', need: 6, t: 0 },
    { id: 'win2', n: 'Win 2 matches', key: 'wins', need: 2, t: 1 }, { id: 'flawless', n: 'Win a match without losing a round', key: 'flawless', need: 1, t: 1 }, { id: 'sorc', n: 'Win with a mostly technique book', key: 'sorcW', need: 1, t: 1 },
    { id: 'wiz', n: 'Win with a mostly spell book', key: 'wizW', need: 1, t: 1 }, { id: 'ups', n: 'Take 6 upgrades in drafts', key: 'ups', need: 6, t: 1 }, { id: 'big', n: 'Deal 150 damage in one match', key: 'dealtMax', need: 150, max: 1, t: 1 },
    { id: 'tank', n: 'Win a match after taking 100 damage', key: 'tankWin', need: 1, t: 1 }, { id: 'streak', n: 'Win 2 matches in a row', key: 'streakNow', need: 2, max: 1, t: 1 },
    { id: 'spell100', n: 'Cast spells 100 times', key: 'spellCasts', need: 100, t: 1 }, { id: 'tech100', n: 'Use techniques 100 times', key: 'techCasts', need: 100, t: 1 }, { id: 'deal1k', n: 'Deal 1,000 damage', key: 'dealt', need: 1000, t: 1 },
    { id: 'spell250', n: 'Cast spells 250 times', key: 'spellCasts', need: 250, t: 2 }, { id: 'tech250', n: 'Use techniques 250 times', key: 'techCasts', need: 250, t: 2 }, { id: 'deal2k', n: 'Deal 2,500 damage', key: 'dealt', need: 2500, t: 2 },
    { id: 'win5', n: 'Win 5 matches', key: 'wins', need: 5, t: 2 }, { id: 'streak3', n: 'Win 3 matches in a row', key: 'streakNow', need: 3, max: 1, t: 2 }, { id: 'rounds15', n: 'Win 15 rounds', key: 'rounds', need: 15, t: 2 }, { id: 'big300', n: 'Deal 300 damage in one match', key: 'dealtMax', need: 300, max: 1, t: 2 },
  ];
  const CH_TIER = [['Easy', 50, '#7dffa8'], ['Medium', 100, '#ffd45e'], ['Hard', 150, '#ff8a96']], chGold = def => CH_TIER[(def && def.t) || 0][1];
  const chLeft = () => { const n = new Date(), nx = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1), ms = Math.max(0, nx - n.getTime()), h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), sc = Math.floor(ms % 60000 / 1000); return h + 'h ' + String(m).padStart(2, '0') + 'm ' + String(sc).padStart(2, '0') + 's'; };
  setInterval(() => { try { const el = document.getElementById('chT'); if (el) el.textContent = chLeft(); } catch (e) {} }, 1000);
  const CH_COST = 10, CH_GOLD = 50, today = () => new Date().toISOString().slice(0, 10);
  window.ECON = Object.assign(window.ECON || {}, { challengeGold: CH_GOLD, challengeSwap: CH_COST });
  function chState() { if (!PR.ch || PR.ch.day !== today()) { PR.ch = { day: today(), list: CH_POOL.slice().sort(() => Math.random() - .5).slice(0, 5).map(c => ({ id: c.id, p: 0, done: 0 })) }; try { save(); } catch (e) {} } return PR.ch; }
  function chProgress(d) { const st = chState(), got = [];
    for (const c of st.list) { if (c.done) continue; const def = CH_POOL.find(q => q.id === c.id); if (!def) continue; const v = d[def.key] || 0; c.p = def.max ? Math.max(c.p, v) : c.p + v;
      if (c.p >= def.need) { c.done = 1; c.gold = chGold(def); c.claimed = 0; got.push(def.n); PR.chDone = PR.chDone || [0, 0, 0]; PR.chDone[def.t || 0]++; } }
    try { save(); } catch (e) {} if (got.length) setTimeout(() => toast('Challenge done: ' + got[0] + (got.length > 1 ? ' (+' + (got.length - 1) + ' more)' : '') + '. Collect it in Challenges.'), 4200); chDot(); }
  function chDot() { const st = chState(), el = document.getElementById('chDot'), ready = st.list.filter(c => c.done && c.claimed === 0).length; if (el) { el.textContent = st.list.filter(c => c.done).length + '/5'; el.classList.toggle('ready', ready > 0); } }
  window.collectChallenge = function (i) { const st = chState(), c = st.list[i]; if (!c || !c.done || c.claimed !== 0) return; c.claimed = 1; const g = c.gold || CH_GOLD; PR.coins = (PR.coins || 0) + g; try { save(); sfx('ui_coin'); } catch (e) {} refreshMeta(); toast(`+${g} gold`); openChallenges(); };
  window.swapChallenge = function (i) { const st = chState(), c = st.list[i]; if (!c || !c.done || PR.coins < CH_COST) return; const free = CH_POOL.filter(q => !st.list.some(l => l.id === q.id)); if (!free.length) return; PR.coins -= CH_COST; try { sfx('ui_deal'); setTimeout(() => { try { sfx('ui_pick'); } catch (e) {} }, 140); } catch (e) {} st.list[i] = { id: free[Math.random() * free.length | 0].id, p: 0, done: 0 }; try { save(); } catch (e) {} refreshMeta(); openChallenges(); };
  window.openChallenges = function () { const st = chState();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Daily Challenges</div><div class="ssub" style="margin:0">A free new set in <b id="chT" style="color:#ffd45e">${chLeft()}</b>. Easy pays 50 gold, Medium 100, Hard 150.</div><div class="chl">${st.list.map((c, i) => { const def = CH_POOL.find(q => q.id === c.id) || { n: c.id, need: 1 };
      const tr = CH_TIER[def.t || 0];
      return `<div class="chrow ${c.done ? 'done' : ''}"><div class="cg"><b>${def.n} <em style="font:800 10px Nunito;font-style:normal;letter-spacing:.5px;text-transform:uppercase;color:#17131f;background:${tr[2]};border:1.5px solid #000;border-radius:6px;padding:1px 5px;margin-left:4px;vertical-align:middle">${tr[0]} · ${tr[1]}</em></b><div class="chbar"><i style="width:${Math.min(100, c.p / def.need * 100)}%"></i><span>${c.done ? 'Done' : Math.floor(Math.min(c.p, def.need)) + ' / ' + def.need}</span></div>${c.done && c.claimed !== 0 ? `<small>+${c.gold || CH_GOLD} gold collected</small>` : ''}</div>${c.done && c.claimed === 0 ? `<button class="chcol" onclick="collectChallenge(${i})">Collect<small><span class="ci coin-i"></span>${c.gold || CH_GOLD}</small></button>` : c.done ? `<button onclick="swapChallenge(${i})" ${PR.coins < CH_COST ? 'disabled' : ''}>New<small><span class="ci coin-i"></span>${CH_COST}</small></button>` : ''}</div>`; }).join('')}</div>`;
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
      if (mine.length <= 10 || w.svAnchor) continue;   /* Survival's horde keeps its own limit of 25 */
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
      det.insertAdjacentHTML('beforeend', `<div class="tgtrow"><span>Targets</span><div class="bseg">${b('auto', k === 'rush' ? 'Nearest' : 'Auto', v === 'auto')}${b('caster', 'Caster', v === 'caster')}${b('mobs', 'Summons', mob)}${b('struct', 'Structures', v === 'struct')}</div>${mob ? `<div class="bseg sub">${b('strong', 'Strongest first', v === 'strong')}${b('weak', 'Weakest first', v === 'weak')}</div>` : ''}</div>`);
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
  // (1.0.5) Tracks run much further and pay about half as much per early step, with big chunks at the end.
  const TR = [
    { id: 'dmg', n: 'Deal damage with it', goals: [300, 1500, 5000, 9000, 14000, 20000, 28000, 40000], pay: [3, 5, 10, 10, 13, 15, 20, 30] },
    { id: 'games', n: 'Play matches with it', goals: [5, 20, 50, 75, 100, 130, 165, 200], pay: [3, 5, 10, 10, 13, 15, 20, 30] },
    { id: 'wins', n: 'Win matches with it', goals: [3, 12, 30, 40, 50, 60, 70, 80, 90, 100], pay: [3, 5, 10, 10, 13, 13, 15, 15, 20, 35] },
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
        for (const t of TR) while (s.got[t.id] < t.goals.length && s[t.id] >= t.goals[s.got[t.id]]) { const q = t.pay[s.got[t.id]]; s.got[t.id]++; PR.spells[k].cards += q; msgs.push(`${SP[k].n} trial cleared: +${q} skill points`); } }
      acc = {}; try { save(); } catch (e) {}
      msgs.slice(0, 3).forEach((m, i) => setTimeout(() => { try { toast(m); } catch (e) {} }, 1400 + i * 1600)); } } catch (e) {}
    return _sr.apply(this, arguments);
  };
  function trialHTML(k) { const s = st(k);
    return `<div class="trials"><div class="trh">Trials</div>${TR.map(t => { const N = t.goals.length, g = s.got[t.id], done = g >= N, goal = t.goals[Math.min(N - 1, g)], p = Math.min(1, s[t.id] / goal);
      return `<div class="trw ${done ? 'done' : ''}"><div class="trt"><span>${t.n}</span><b>${done ? 'Complete' : `${Math.min(s[t.id], goal).toLocaleString()} / ${goal.toLocaleString()}`}</b></div><div class="trb"><i style="width:${(done ? 1 : p) * 100}%"></i></div><div class="trp">${t.goals.map((q, i) => `<em class="${i < g ? 'on' : ''}">${i < g ? '✓' : '+' + t.pay[i]}</em>`).join('')}</div></div>`; }).join('')}</div>`; }
  window.trialHTML = trialHTML;
  const _os = window.openSpell;
  window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments); try { const P = document.getElementById('sheetP'); if (P && !P.querySelector('.trials') && (typeof isUnl !== 'function' || isUnl(k))) { const at = P.querySelector('.ctrs') || P.querySelector('.ups')?.parentElement || P.querySelector('.shd'); if (at) at.insertAdjacentHTML('afterend', trialHTML(k)); } } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `.trials{margin:10px 0 4px;background:#0006;border:2px solid #000;border-radius:12px;padding:8px 10px}.trh{font:13px 'Lilita One';letter-spacing:1px;color:#ffd75e;margin-bottom:4px}.trw{margin:6px 0}.trt{display:flex;justify-content:space-between;font:12px Nunito;font-weight:800;color:#e8e0ff}.trt b{color:#b9a6ee;font-weight:800}.trw.done .trt b{color:#7dffa8}.trb{height:7px;background:#000;border-radius:5px;overflow:hidden;margin:3px 0}.trb i{display:block;height:100%;background:linear-gradient(90deg,#7a5cff,#c48cff)}.trw.done .trb i{background:linear-gradient(90deg,#2fd08a,#7dffa8)}.trp{display:flex;gap:4px;flex-wrap:wrap}.trp em{font:10px 'Lilita One';font-style:normal;color:#8d7fbf;background:#1a1236;border:1.5px solid #000;border-radius:6px;padding:1px 6px}.trp em.on{color:#0b2a14;background:#7dffa8}`;
  document.head.appendChild(css);
})();

/* ---------------- Starting upgrades (F-455, F-462) ----------------
   Every 5 levels an ability earns a slot. Fill it with one of its upgrades that doesn't need another upgrade first;
   that ability then starts every match with it. Tap a chosen one to clear the slot. Rivals get the same number of
   random starting upgrades for their levels, so it stays fair. */
(function () {
  const slotsOf = lvl => Math.floor((lvl || 1) / 5);
  // tier 1 = no prerequisite and not a signature move. A tier 2 upgrade can only be slotted once every tier 1 of that
  // ability is slotted (one per either-or group) and its own prerequisite is slotted too.
  const tier1 = k => k === 'chosen' ? [] : (UPG[k] || []).filter(u => !u.req && !u.sig);
  const allT1 = (k, list) => { const seen = new Set(); return tier1(k).every(u => { if (u.grp) { if (seen.has(u.grp)) return true; seen.add(u.grp); return tier1(k).some(o => o.grp === u.grp && list.includes(o.id)); } return list.includes(u.id); }); };
  const canSlot = (k, list, u) => k !== 'chosen' && (!u.req && !u.sig ? true : allT1(k, list) && (!u.req || list.includes(u.req)));
  const eligible = (k, list) => (UPG[k] || []).filter(u => canSlot(k, list || [], u));
  const startOf = k => { const s = PR.spells && PR.spells[k]; if (!s) return []; let cur = s.start || [], prev;
    do { prev = cur.length; cur = cur.filter(id => { const u = (UPG[k] || []).find(q => q.id === id); return u && canSlot(k, cur.filter(q => q !== id), u); }); } while (cur.length !== prev);
    s.start = cur; return s.start; };
  const blocked = (k, list, u) => u.grp && list.some(id => { const o = UPG[k].find(q => q.id === id); return o && o.grp === u.grp; });
  window.startUps = startOf;
  const _nm = newMatch;
  window.newMatch = newMatch = function () {
    const r = _nm.apply(this, arguments);
    try { if (M && !window.ONB_ACTIVE) {
      for (const k of (PR.hand || [])) for (const id of startOf(k)) M.me.up.add(k + '.' + id);
      const fl = M.foeLv || {}; for (const k of (M.foe.pool || [])) { const n = slotsOf(fl[k]), pool = tier1(k).sort(() => Math.random() - .5), got = [];
        for (const u of pool) { if (got.length >= n) break; if (blocked(k, got, u)) continue; got.push(u.id); M.foe.up.add(k + '.' + u.id); } }
    } } catch (e) {}
    return r;
  };
  window.pickStart = function (k, id) { const s = PR.spells[k], list = startOf(k);
    if (list.includes(id)) s.start = list.filter(q => q !== id);
    else if (list.length < slotsOf(s.lvl)) { const u = UPG[k].find(q => q.id === id); if (!u || blocked(k, list, u) || !canSlot(k, list, u)) return; s.start = list.concat(id); }
    try { save(); } catch (e) {} openSpell(k); };
  function startHTML(k) { const s = PR.spells[k], n = slotsOf(s.lvl), list = startOf(k), el = eligible(k, list);
    if (!el.length) return '';
    const next = n < 4 ? `Next slot at level ${(n + 1) * 5}.` : '';
    const chips = el.map(u => { const on = list.includes(u.id), can = on || (list.length < n && !blocked(k, list, u));
      return `<button class="stc ${on ? 'on' : ''}" ${can ? `onclick="event.stopPropagation();pickStart('${k}','${u.id}')"` : 'disabled'}>${on ? '✓ ' : ''}${u.n}</button>`; }).join('');
    return `<div class="starts"><div class="trh">Starting upgrades <small>${list.length} / ${n}</small></div><div class="ssub2">Every 5 levels, pick a basic upgrade this ability always starts a match with while it's in your battle hand. Signature upgrades and ones that need another first can't be slotted until every basic one is. ${next}</div><div class="stl">${chips}</div></div>`; }
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

/* ---------------- music picker (F-456, F-517) ----------------
   Every track has a name, can be starred as a favourite, and each slot (menus, battles) can play one chosen track or
   Shuffle: a random pick every time, from your favourites in that slot if you have any. Switching crossfades. */
(function () {
  // Menus always play Candlelit Grimoire. Battles follow the fight by default: one track per phase, a harder one each time.
  const TRACKS = [['bgm_menu', 'Candlelit Grimoire', 'menu'],
    ['bgm_phase1', 'Opening Gambit', 'p1'], ['bgm_phase2', 'Rising Hex', 'p2'], ['bgm_phase3', 'Midnight Reckoning', 'p3'], ['bgm_battle_final', 'The Turning Tide', 'p3'],
    ['bgm_phase3b', 'Witching Hour', 'p3'], ['bgm_final2', 'Last Candle', 'final'], ['bgm_battle_finale', 'Last Spell Standing', 'final'], ['bgm_final3', 'Ember and Ash', 'final'],
    ['bgm_battle', "Duelist's Pulse", 'battle'], ['bgm_battle_take2', "Duelist's Pulse (Reprise)", 'battle'], ['bgm_battle_dark', 'Hexed Ostinato', 'battle'], ['bgm_battle_calm', 'Still Waters', 'battle']];
  const CAT_LBL = { menu: 'Menus', battle: 'Battles', p1: 'Rounds 1 and 2', p2: 'Rounds 3 and 4', p3: 'Rounds 5 and 6', final: 'Round 7' };
  window.MUSIC_TRACKS = TRACKS;
  const favs = () => (SET().bgmFav = SET().bgmFav || []);
  const poolOf = cat => { const all = TRACKS.filter(t => t[2] === cat).map(t => t[0]), f = all.filter(k => favs().includes(k)); return f.length ? f : all; };
  const cur = { menu: null, battle: null };
  const roll = cat => { let last = null; try { last = localStorage.getItem('sb.last.' + cat); } catch (e) {} const p = poolOf(cat), q = p.filter(k => k !== last && k !== cur[cat]); cur[cat] = (q.length ? q : p)[Math.random() * (q.length ? q.length : p.length) | 0]; try { localStorage.setItem('sb.last.' + cat, cur[cat]); } catch (e) {} return cur[cat]; };
  const choice = slot => { if (slot === 'menu') return 'bgm_menu'; const v = SET().bgmBattle; return !v || v === 'phase' ? 'phase' : v === 'shuffle' || v === 'random' || !TRACKS.some(t => t[0] === v) ? 'shuffle' : v; };
  window.bgmChoice = choice;
  const pick = slot => { const c = choice(slot); return c === 'shuffle' || c === 'phase' ? (cur[slot] || roll(slot)) : c; };
  let slot = null;
  const _mu = window.music;
  window.music = music = function (id) { if (id === 'bgm_menu') { if (slot !== 'menu') roll('menu'); slot = 'menu'; id = pick('menu'); } else if (id === 'bgm_battle') { slot = 'battle'; id = pick('battle'); } else slot = null; return _mu(id); };
  // a new battle song each match when battle music is on shuffle
  const _nm = newMatch; window.newMatch = newMatch = function () { if (choice('battle') !== 'phase' && choice('battle') === 'shuffle') roll('battle'); else if (choice('battle') === 'phase') roll('battle'); return _nm.apply(this, arguments); };
  window.setBgm = function (which, id) { SET()[which === 'menu' ? 'bgmMenu' : 'bgmBattle'] = id; try { save(); } catch (e) {} if (id === 'shuffle') id = roll(which); else if (id === 'phase') id = 'bgm_phase1'; try { auInit(); } catch (e) {} _mu(id); };
  window.toggleFav = function (id) { const f = favs(), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); try { save(); } catch (e) {} openMusic(); };
  window.playTrack = function (id) { try { auInit(); } catch (e) {} _mu(id); };
  window.openMusic = function () { const row = ([id, n, cat]) => `<div class="mrow"><button class="mplay" onclick="playTrack('${id}')">▶</button><span>${n}<small>${CAT_LBL[cat] || ''}</small></span><button class="mfav ${favs().includes(id) ? 'on' : ''}" onclick="toggleFav('${id}')" aria-label="Favourite">${favs().includes(id) ? '★' : '☆'}</button></div>`;
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Music</div><div class="ssub" style="margin:0">Tap ▶ to listen, ★ to favourite. Random picks from your favourite battle tracks.</div>${sel('battle')}<div class="mlist">${TRACKS.map(row).join('')}</div><button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="sheetBack()">Back</button>`;
    $('sheet').classList.add('on'); };
  // Back returns to where the player came from: the pause screen mid-match (just close this sheet), otherwise Options
  window.sheetBack = function () { const pz = document.getElementById('pause'); if (pz && pz.classList.contains('on')) { closeSheet(); try { music('bgm_battle'); } catch (e) {} } else openOptions(); };   /* mid-match, the fight's music comes back after previewing tracks */
  const sel = which => { const c = choice(which), list = TRACKS.filter(t => t[2] === 'battle'); if (c === 'shuffle' && !cur[which]) roll(which);
    return `<div class="opt"><span>Battle music</span><select class="bgmsel" onchange="setBgm('battle',this.value)"><option value="phase" ${c === 'phase' ? 'selected' : ''}>Follows the fight</option><option value="shuffle" ${c === 'shuffle' ? 'selected' : ''}>Random${favs().some(k => list.some(t => t[0] === k)) ? ' ★' : ''}</option>${list.map(([id, n]) => `<option value="${id}" ${c === id ? 'selected' : ''}>${favs().includes(id) ? '★ ' : ''}${n}</option>`).join('')}</select></div>`; };
  const _sh = settingsHTML;
  window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments); return h.replace(/<\/div>$/, sel('battle') + `<button class="hbtn out" style="width:100%;margin-top:6px" onclick="openMusic()">♫ All music and favourites</button></div>`); };
  const css = document.createElement('style');
  css.textContent = `.bgmsel{font:13px 'Lilita One';background:#1a1236;color:#e8e0ff;border:2px solid #000;border-radius:9px;padding:5px 8px;max-width:58%}
  .mlist{display:flex;flex-direction:column;gap:5px}.mrow{display:flex;align-items:center;gap:8px;background:#0006;border:2px solid #000;border-radius:12px;padding:6px 8px}.mrow span{flex:1;font:14px 'Lilita One';color:#e8e0ff;display:flex;flex-direction:column}.mrow small{font:11px Nunito;font-weight:800;color:#9a8cc4}
  .mplay,.mfav{width:34px;height:34px;border-radius:10px;border:2px solid #000;background:#2a1f52;color:#fff;font-size:15px;cursor:pointer;padding:0}.mfav{font-size:19px;color:#9a8cc4}.mfav.on{color:#ffd75e;background:#3a2c10}`;
  document.head.appendChild(css);
})();

/* ---------------- Options button on the home screen (F-456) ---------------- */
(function () {
  window.openOptions = function () {
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Options</div>${settingsHTML()}<div class="vernote">Wizards vs Sorcerers · Version ${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '1.0'}</div>`;
    $('sheet').classList.add('on');
  };
  const add = () => { const st = document.querySelector('#home .stage'); if (!st || st.querySelector('.optbtn')) return;
    st.insertAdjacentHTML('beforeend', `<button class="optbtn" onclick="openOptions()" aria-label="Options"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.7a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"/></svg></button>`); };
  add(); document.addEventListener('DOMContentLoaded', add);
  const css = document.createElement('style');
  css.textContent = `.vernote{text-align:center;font:11px Nunito;font-weight:800;color:#8d7fbf;letter-spacing:.3px;margin-top:2px}#chBtn{top:88px!important}.optbtn{position:absolute;top:10px;left:10px;z-index:2;width:34px;height:34px;display:grid;place-items:center;border-radius:11px;border:2px solid #000;background:linear-gradient(#4a3a80,#2b2050);color:#fff;cursor:pointer;box-shadow:0 3px 0 #000;padding:0}`;
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
  if (phone) document.addEventListener('touchmove', e => { let n = e.target; while (n && n !== document.body) { const st = getComputedStyle(n); if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 1) return; /* a sideways strip (wardrobe tabs) must keep scrolling even when the page itself fits the screen */ if (/(auto|scroll)/.test(st.overflowX) && n.scrollWidth > n.clientWidth + 1) return; n = n.parentElement; } if (e.cancelable) e.preventDefault(); }, { passive: false });
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
  window.showSpellModal = showSpellModal = function (k, from, to, unlockName) { const r = _sm.apply(this, arguments); if (!unlockName) try { const cu = document.getElementById('curtain'), busy = cu && /\bon\b/.test(cu.className); setTimeout(() => sfx('ui_abilityup'), busy ? 1000 : 250); } catch (e) {} return r; };   /* waits until the reveal transition is at least half done */
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

/* ---------------- Elemental Mirror: decoys burst into a random element when they pop (F-483);
   bigger spell-collision explosions (F-484) ---------------- */
(function () {
  const sparks = (x, y, cols, n, v0, v1) => { for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), v = rnd(v0, v1); P({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .75 - 60, color: cols[i % cols.length], size: rnd(1.5, 3.4), life: rnd(.4, 1), grav: 420 }); } };
  const embers = (x, y, R, n) => { for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), rr = rnd(8, R); decals.push({ k: 'ember', x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * .6, t: 0, life: rnd(2, 4), s: rnd(.7, 1.3) }); } };
  const EL = {
    fire:   { n: 'FIRE BURST', cols: ['#ffb347', '#ff5a1f', '#fff3c0'], fx: 'fire', hit(f) { f.burn = Math.max(f.burn || 0, 3); f.burnD = 2; f.burnSrc = 'mirror'; }, ground(x, y) { scar('scorch', x, y, { s: 2.2, a: .55 }); embers(x, y, 80, 26); } },
    ice:    { n: 'FROST BURST', cols: ['#d8f6ff', '#7fd8ff', '#ffffff'], fx: 'frost', hit(f) { f.slowT = Math.max(f.slowT || 0, 2.5); }, ground(x, y) { scar('frostcrack', x, y, { r: 46 }); decals.push({ k: 'frost', x, y, r: 60, t: 0, life: 8 }); } },
    storm:  { n: 'STORM BURST', cols: ['#fff7b0', '#ffd23a', '#ffffff'], fx: 'arcane', hit(f) { f.stunT = .5; }, ground(x, y) { scar('lich', x, y, { s: 2.4 }); for (let i = 0; i < 5; i++) { const an = rnd(0, 6.283), l = rnd(40, 90); bolts.push({ pts: [{ x, y: y - 40 * HS }, { x: x + Math.cos(an) * l * .5 + rnd(-8, 8), y: y - 40 * HS + Math.sin(an) * l * .3 + rnd(-8, 8) }, { x: x + Math.cos(an) * l, y: y - 20 * HS + Math.sin(an) * l * .6 }], life: .22, tier: 2 }); } } },
    acid:   { n: 'ACID BURST', cols: ['#d8f070', '#9fd04a', '#f4ffc0'], fx: 'arcane', hit(f) { f.slowT = Math.max(f.slowT || 0, 1); }, ground(x, y) { scar('etch', x, y, { r: 44 }); for (let i = 0; i < 16; i++) P({ x: x + rnd(-40, 40), y: y - rnd(0, 30), vx: rnd(-40, 40), vy: -rnd(60, 180), color: '#9fd04a', size: rnd(3, 6), life: rnd(.5, .9), grav: 520, glow: false }); } },
    arcane: { n: 'ARCANE BURST', cols: ['#f0d2ff', '#b06bff', '#ffffff'], fx: 'arcane', hit(f, x, y) { const d = Math.hypot(f.x - x, f.y - y) || 1; f.vx += (f.x - x) / d * 420; f.vy += (f.y - y) / d * 420; }, ground(x, y) { scar('glass', x, y); inkRing(x, y, '#b06bff', 2, 12, 110, .5); } },
  };
  function elementBurst(d) {
    const keys = Object.keys(EL), e = EL[keys[Math.random() * keys.length | 0]], x = d.x, y = d.y, cy = y - 38 * HS, R = 95, w = d.o, f = w.foe, keep = SRC; SRC = 'mirror';
    try { boom(x, cy, 1.25); const b = booms[booms.length - 1]; if (b) { b.cols = e.cols.concat(e.cols); b.style = Math.random() * 8 | 0; }   /* the explosion drawer needs six colours: with three it threw every frame and froze the duel */ } catch (er) {}
    lights.push({ x, y: y + 6, r: 150, c: e.cols[1], t: 0, life: .6 }); shake = Math.max(shake, 12);
    inkRing(x, y, e.cols[1], 2, 10, R, .5); inkRing(x, y, e.cols[0], 1, 6, R * .6, .5);
    for (let i = 0; i < 26; i++) { const an = rnd(0, 6.283), rr = rnd(0, 30); fireFx.push({ x: x + Math.cos(an) * rr, y: cy + Math.sin(an) * rr * .7, vx: Math.cos(an) * rnd(40, 170), vy: Math.sin(an) * rnd(40, 170) - 50, t: 0, life: rnd(.3, .6), s: rnd(10, 18), seed: rnd(0, 99), el: e.fx === 'fire' ? undefined : e.fx, smoke: 0 }); }
    sparks(x, cy, e.cols, 44, 160, 480); embers(x, y, 70, 14); e.ground(x, y);
    text(x, y - 96 * HS, e.n, e.cols[1], true);
    if (!f.dead && !(f.ghostT > 0) && Math.hypot(f.x - x, f.y - y) < R) { damage(f, 10, (f.x - x) * 1.5, (f.y - y) * 1.5, e.cols[0]); e.hit(f, x, y); }
    for (const c of enemyCreatures(w)) if (c.e.x !== undefined && Math.hypot(c.e.x - x, c.e.y - y) < R) hurtCreature(c.e, c.k, 10, 'arcane');
    SRC = keep;
  }
  window.elementBurst = elementBurst;
  const _hd = hurtDecoy;
  window.hurtDecoy = hurtDecoy = function (d) { const was = d && d.gone; const r = _hd.apply(this, arguments); try { if (d && !was && d.gone && d.echoT === undefined && U(d.o, 'mirror', 'elburst') && !ended) elementBurst(d); } catch (e) {} return r; };
  try { UPG.mirror.push({ id: 'elburst', n: 'Elemental Mirror', d: 'A popped decoy bursts into a random element: fire, frost, storm, acid or arcane.' }); } catch (e) {}

  // spell collisions: a harder flash, a hitstop, twin shock rings in both spells' colours, long sparks, embers and a scorch
  const _cl = clash;
  window.clash = clash = function (a, b) {
    const live = a && b && a.life > 0 && b.life > 0, ay = live && typeof runes !== 'undefined' && runes.includes(a) ? a.y - 36 * HS : a && a.y, by = live && typeof runes !== 'undefined' && runes.includes(b) ? b.y - 36 * HS : b && b.y;
    const x = live ? (a.x + b.x) / 2 : 0, y = live ? (ay + by) / 2 : 0, ka = live ? clashKind(a) : 0, kb = live ? clashKind(b) : 0, ang = live ? Math.atan2((b.vy || 0) - (a.vy || 0), (b.vx || 0) - (a.vx || 0)) : 0;
    const r = _cl.apply(this, arguments); if (!live) return r;
    try {
      const ca = (CLASH_ELEM_FX[ka] || CLASH_ELEM_FX.fire).cols, cb = (CLASH_ELEM_FX[kb] || CLASH_ELEM_FX.fire).cols, gy = y + 40 * HS;
      shake = Math.max(shake, 15); slow = Math.min(slow, .08); setTimeout(() => { if (!ended) slow = 1; }, 90); if (typeof flashScreen === 'function') flashScreen();
      inkRing(x, gy, ca[0], 2, 8, 96, .5); inkRing(x, gy, cb[0], 2, 14, 130, .5); inkRing(x, gy, '#ffffff', 1, 4, 60, .5);
      lights.push({ x, y: gy, r: 190, c: '#ffffff', t: 0, life: .35 });
      // sparks fly out sideways from the line the two spells met on
      for (let i = 0; i < 40; i++) { const side = i % 2 ? 1 : -1, an = ang + side * Math.PI / 2 + rnd(-.9, .9), v = rnd(220, 620); P({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .8 - 40, color: (i % 4 < 2 ? ca : cb)[i % 3] || '#fff', size: rnd(1.6, 3.6), life: rnd(.45, 1.1), grav: 380, drag: .96 }); }
      for (let i = 0; i < 18; i++) { const an = rnd(0, 6.283), rr = rnd(0, 22); fireFx.push({ x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr, vx: Math.cos(an) * rnd(60, 200), vy: Math.sin(an) * rnd(60, 200) - 40, t: 0, life: rnd(.3, .55), s: rnd(10, 17), seed: rnd(0, 99), el: i % 2 ? (ka === 'fire' ? undefined : ka) : (kb === 'fire' ? undefined : kb), smoke: 0 }); }
      embers(x, gy, 70, 18); scar('scorch', x, gy, { s: 2, a: .5 }); scar('crack', x, gy, { s: 1.1 });
    } catch (e) {}
    return r;
  };
})();

/* ---------------- cosmetics unlocked by titles or bought with gold (F-489) ---------------- */
(function () {
  const _ow = owns;
  window.owns = owns = function (cat, it) { const u = (it && it.unlock) || {}; if (u.type === 'title') { const t = TITLES.find(q => q.id === u.v); return !!(t && t.ok(statsOf())); } return _ow.apply(this, arguments); };
  const _ut = unlockText;
  window.unlockText = unlockText = function (u) { if (u && u.type === 'title') { const t = TITLES.find(q => q.id === u.v); return 'Title: ' + (t ? t.n : '?'); } if (u && u.type === 'coins') return u.v + ' gold'; return _ut.apply(this, arguments); };
  window.buyCoinItem = function (i) { const it = catItems(wCat)[i], u = it.unlock; if (!u || u.type !== 'coins' || PR.coins < u.v || PR.owned.includes(wCat + '.' + it.id)) return; PR.coins -= u.v; PR.owned.push(wCat + '.' + it.id); try { sfx('ui_unlock'); } catch (e) {} closeSheet(); equip(wCat, it.id); try { save(); } catch (e) {} toast((typeof cosN === 'function' ? cosN(wCat, it) : it.n) + ' unlocked!'); };
  const _pi = pickItem;
  window.pickItem = pickItem = function (i) { const it = catItems(wCat)[i], u = (it && it.unlock) || {};
    if (it && u.type === 'coins' && !ownsItem(wCat, it)) { const nm = typeof cosN === 'function' ? cosN(wCat, it) : it.n, can = PR.coins >= u.v;
      $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh" style="margin-top:4px">${nm}</div><div style="display:flex;justify-content:center"><canvas id="buyCv" width="180" height="180" style="width:140px;height:140px;border-radius:24px;border:3px solid #000"></canvas></div><div class="ssub" style="margin:0">${(it.r || 'common').toUpperCase()} · You have ${(PR.coins || 0).toLocaleString()} gold</div><button class="upbtn" ${can ? '' : 'disabled'} onclick="buyCoinItem(${i})">Buy · <span class="ci coin-i"></span>${u.v}</button>${can ? '' : '<div class="ssub" style="margin:0;color:#ff9aa6">Not enough gold yet.</div>'}`;
      $('sheet').classList.add('on'); try { const c = $('buyCv'); if (wCat === 'aura') { const x = c.getContext('2d'); x.translate(90, 150); if (window.heroAura) { const keep = PR.look.aura; PR.look.aura = it.id; try { heroAura(x, 0, 0, 1.1, 1.3); } finally { PR.look.aura = keep; } } } else drawAva(c, lookWiz(Object.assign({}, PR.look, { [wCat]: it.id }))); } catch (e) {}
      return; }
    if (it && u.type === 'title' && !ownsItem(wCat, it)) return toast('Earn the ' + unlockText(u).replace('Title: ', '') + ' title to unlock');
    return _pi.apply(this, arguments); };
})();

/* ---------------- title effects on your aura or hex (F-490) ----------------
   Earned titles add a small moving effect around your fighter, in battle and on the home screen. */
(function () {
  const FX = { flawless: 'stars', streak: 'bolts', cent: 'gold', cutter: 'slashes', brawler: 'embers', warlock: 'runes', spellwright: 'runes', special: 'leaves', hedge: 'leaves', vet: 'motes', g1: 'embers', g3: 'motes' };
  window.TITLE_FX = FX;
  function titleFx(x, cx, cy, t, kind, col, s) {
    if (!kind) return; s = s || 1; x.save(); x.translate(cx, cy); x.scale(s, s); x.lineCap = 'round'; x.lineJoin = 'round';
    const N = kind === 'runes' ? 8 : 6;
    for (let i = 0; i < N; i++) { const ph = i / N * 6.283, a = t * (kind === 'runes' ? .7 : 1.1) + ph, R = 30 + 5 * Math.sin(t * 2 + i), px = Math.cos(a) * R, py = Math.sin(a) * R * .38, up = ((t * .45 + i / N) % 1);
      x.save();
      if (kind === 'stars') { x.translate(px, py - 34 - 22 * Math.sin(t * 1.3 + i * 2)); const k = .5 + .5 * Math.sin(t * 5 + i * 1.9), r = 3 + 2.5 * k; x.globalAlpha = .5 + .5 * k; x.fillStyle = '#fff'; x.strokeStyle = '#07020d'; x.lineWidth = 1; x.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? r * .35 : r; x.lineTo(Math.cos(j * .785) * rr, Math.sin(j * .785) * rr); } x.closePath(); x.fill(); x.stroke(); }
      else if (kind === 'bolts') { if (Math.sin(t * 9 + i * 2.3) > .2) { x.translate(px, py - 30 - i * 6); x.strokeStyle = '#07020d'; x.lineWidth = 3.2; const seg = () => { x.beginPath(); x.moveTo(0, -8); x.lineTo(4, -2); x.lineTo(-3, 1); x.lineTo(2, 8); x.stroke(); }; seg(); x.strokeStyle = '#fff36b'; x.lineWidth = 1.6; seg(); } }
      else if (kind === 'gold') { x.translate(px, py - 4 - up * 70); x.globalAlpha = 1 - up; x.fillStyle = '#ffd75e'; x.strokeStyle = '#5a3a00'; x.lineWidth = 1; x.rotate(t * 2 + i); x.beginPath(); x.moveTo(0, -4); x.lineTo(2.6, 0); x.lineTo(0, 4); x.lineTo(-2.6, 0); x.closePath(); x.fill(); x.stroke(); }
      else if (kind === 'slashes') { x.translate(px * 1.1, py - 36); x.rotate(a + 1.57); x.globalAlpha = .85; x.fillStyle = '#fff'; x.strokeStyle = '#2a0006'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, 7, -1.1, 1.1); x.arc(-3, 0, 6.4, .95, -.95, true); x.closePath(); x.fill(); x.stroke(); }
      else if (kind === 'embers') { x.translate(px * .8 + Math.sin(t * 3 + i) * 4, py - up * 78); x.globalAlpha = 1 - up; x.globalCompositeOperation = 'lighter'; x.fillStyle = i % 2 ? '#ffb347' : '#ff5a1f'; x.beginPath(); x.arc(0, 0, 2.6 * (1 - up * .6), 0, 7); x.fill(); }
      else if (kind === 'runes') { x.translate(px * 1.25, py * 1.25 + 2); x.globalAlpha = .55 + .35 * Math.sin(t * 3 + i); x.strokeStyle = col || '#c9b8ff'; x.lineWidth = 1.6; x.beginPath(); const g = i % 4; if (g === 0) { x.moveTo(0, -4); x.lineTo(0, 4); x.moveTo(-3, -1); x.lineTo(0, -4); x.lineTo(3, -1); } else if (g === 1) { x.moveTo(-3, -4); x.lineTo(3, 4); x.moveTo(3, -4); x.lineTo(-3, 4); } else if (g === 2) { x.moveTo(-3, 4); x.lineTo(0, -4); x.lineTo(3, 4); } else { x.moveTo(0, -4); x.lineTo(0, 4); x.moveTo(0, -1); x.lineTo(3, -4); x.moveTo(0, 1); x.lineTo(3, 4); } x.stroke(); }
      else if (kind === 'leaves') { x.translate(px + Math.sin(t * 2 + i) * 6, py - 60 + up * 70); x.rotate(t * 2 + i * 1.3); x.globalAlpha = Math.min(1, (1 - up) * 2); x.fillStyle = i % 2 ? '#7ed35a' : '#c8f08a'; x.strokeStyle = '#0d3a14'; x.lineWidth = 1; x.beginPath(); x.ellipse(0, 0, 4.5, 2, 0, 0, 7); x.fill(); x.stroke(); }
      else { x.translate(px, py - up * 64); x.globalAlpha = (1 - up) * .9; x.globalCompositeOperation = 'lighter'; x.fillStyle = col || '#cfe6ff'; x.beginPath(); x.arc(0, 0, 2.2, 0, 7); x.fill(); }
      x.restore(); }
    x.restore();
  }
  window.titleFx = titleFx;
  const kindOf = w => w && w.me ? FX[activeTitle()] : (typeof M !== 'undefined' && M && M.rival && M.rival.fx);
  window.titleFxHome = (x, cx, cy, sc, t) => { try { titleFx(x, cx, cy, t, FX[activeTitle()], auraOf({ me: 1 })[1], sc * 1.35); } catch (e) {} };
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) { const r = _dd.apply(this, arguments); if (x !== ctx) return r;
    try { if (typeof ents !== 'undefined' && ents && document.getElementById('battle').classList.contains('on')) for (const w of ents) if (!w.dead) titleFx(x, w.x, w.y, T + (w.me ? 0 : 1.7), kindOf(w), auraOf(w)[1], 1); } catch (e) {}
    return r; };
})();

/* ---------------- named rivals (F-491) ----------------
   Recurring characters with a look, a title, a signature hand and a line they open with. About a third of matches. */
(function () {
  const R = [
    { id: 'morwen', n: 'Morwen Ashgrave', title: 'The Bone Gardener', cls: 'wiz', hand: ['zombies', 'flies', 'thorns', 'golem'], look: { robe: 'moss', hat: 'hood', staff: 'skull', beard: 'none', skin: 'ashen', pet: 'cat' }, aura: 'venom', fx: 'leaves', line: 'Everything grows back.', mood: 'calm' },
    { id: 'kaelix', n: 'Kaelix Stormrend', title: 'Sky-Splitter', cls: 'wiz', hand: ['lightning', 'storm', 'gale', 'blink'], look: { robe: 'stormcl', hat: 'feathered', staff: 'wand', beard: 'blue', skin: 'tan', pet: 'owl' }, aura: 'azure', fx: 'bolts', line: 'Try to keep up!', mood: 'cocky' },
    { id: 'brakka', n: 'Brakka Ironknuckle', title: 'The Unbroken', cls: 'sorc', hand: ['rush', 'titan', 'counter', 'earthm'], look: { robe: 'ember', hat: 'pointy', staff: 'oak', beard: 'red', skin: 'umber', pet: 'none' }, aura: 'emberaura', fx: 'embers', line: 'Hit me. I dare you.', mood: 'cocky' },
    { id: 'veyra', n: 'Sister Veyra', title: 'Keeper of the Dome', cls: 'sorc', hand: ['sanctum', 'polarity', 'secondwind', 'dissect'], look: { robe: 'ivory', hat: 'hood', staff: 'moon', beard: 'long', skin: 'moonlit', pet: 'wisp' }, aura: 'frost', fx: 'runes', line: 'Step inside. Be still.', mood: 'calm' },
    { id: 'pyrrha', n: 'Pyrrha Cindermaw', title: 'The Kiln Witch', cls: 'wiz', hand: ['fireball', 'meteor', 'ringfire', 'burnbody'], look: { robe: 'sunfire', hat: 'witch', staff: 'crystal', beard: 'ginger', skin: 'emberskin', pet: 'dragon' }, aura: 'sunset', fx: 'embers', line: 'I love a warm welcome.', mood: 'wild' },
    { id: 'nix', n: 'Old Nix', title: 'The Trickster', cls: 'wiz', hand: ['mirror', 'ghost', 'rift', 'ricochet'], look: { robe: 'amethyst', hat: 'mushroom', staff: 'wand', beard: 'violet', skin: 'goblin', pet: 'frog' }, aura: 'violet', fx: 'stars', line: 'Which one is me?', mood: 'wild' },
    { id: 'jun', n: 'Jun the Quiet', title: 'Hundred Cuts', cls: 'sorc', hand: ['dissect', 'doubletake', 'copycast', 'chosen'], look: { robe: 'obsidian', hat: 'feathered', staff: 'oak', beard: 'none', skin: 'peach', pet: 'none' }, aura: 'bloodmoon', fx: 'slashes', line: '...', mood: 'calm' },
    { id: 'thessaly', n: 'Thessaly Frost', title: 'The Long Winter', cls: 'wiz', hand: ['icewall', 'hourglass', 'beam', 'shield'], look: { robe: 'frost', hat: 'crown', staff: 'crystal', beard: 'white', skin: 'spirit', pet: 'owl' }, aura: 'frost', fx: 'motes', line: 'I can wait all day.', mood: 'calm' },
    { id: 'vant', n: 'Oro Vant', title: 'The Beastcaller', cls: 'sorc', hand: ['zodiac', 'healspring', 'earthm', 'rush'], look: { robe: 'emerald', hat: 'witch', staff: 'skull', beard: 'green', skin: 'tan', pet: 'dragon' }, aura: 'jade', fx: 'leaves', line: 'Meet the family.', mood: 'wild' },
    { id: 'gilda', n: 'Gilda Goldmantle', title: 'The Champion', cls: 'wiz', hand: ['beam', 'archer', 'orbs', 'sinkhole'], look: { robe: 'royal', hat: 'crown', staff: 'moon', beard: 'goldlong', skin: 'gilded', pet: 'dragon' }, aura: 'gold', fx: 'gold', line: 'Bow. Then begin.', mood: 'cocky' },
  ];
  window.RIVALS = R;
  const _nm = newMatch;
  window.newMatch = newMatch = function (o) {
    o = o || {}; let rv = null;
    if (!window.ONB_ACTIVE && !o.tut && !o.profile && !o.name && Math.random() < .35) { PR.metRivals = PR.metRivals || {}; let pool = R.filter(q => q.hand.every(k => SP[k])); if (window.RIVAL_FILTER) { const f = pool.filter(RIVAL_FILTER); if (f.length) pool = f; } const fresh = pool.filter(q => !PR.metRivals[q.id]); rv = (fresh.length ? fresh : pool)[Math.random() * (fresh.length ? fresh.length : pool.length) | 0]; }
    if (rv) o = Object.assign({}, o, { name: rv.n, look: Object.assign({}, rv.look, { cls: rv.cls, aura: rv.aura }) });
    const r = _nm.call(this, o);
    try { if (rv && M) { M.rival = rv; M.foe.pool = rv.hand.slice(); M.profile = Object.assign({}, M.profile, { n: rv.title }); PR.metRivals[rv.id] = (PR.metRivals[rv.id] || 0) + 1; } } catch (e) {}
    return r;
  };
  const _sd = startDuel;
  window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { if (M && M.rival && ents[1]) { ents[1].auraId = M.rival.aura; if (M.round === 1 && window.emoteSay && M.rival.line) setTimeout(() => { if (!ended && M && M.rival && M.rival.line) emoteSay(ents[1], null, M.rival.line); }, 1100); } } catch (e) {} return r; };
})();

/* ---------------- emotes (F-492) ----------------
   Tap the face button in a duel to send one. The rival answers, and sometimes starts: after a big hit, a round win or loss. */
(function () {
  const EM = [['happy', '😀'], ['tear', '🥲'], ['cry', '😭'], ['up', '👍'], ['down', '👎'], ['shock', '😱']];
  const REPLY = { happy: ['happy', 'up', 'happy'], tear: ['up', 'happy', 'tear'], cry: ['happy', 'tear', 'up'], up: ['up', 'happy'], down: ['down', 'cry', 'happy', 'shock'], shock: ['happy', 'shock', 'up'] };
  const MOOD = { cocky: { happy: 3, down: 1 }, calm: { up: 3, tear: 1 }, wild: { happy: 2, shock: 2 } };
  let bubbles = [], lastMine = -9, lastFoe = -9, hpPrev = null;
  const glyph = id => (EM.find(e => e[0] === id) || [0, id])[1];
  function say(w, id, txt) { if (!w || w.dead) return; bubbles = bubbles.filter(b => b.w !== w); bubbles.push({ w, e: id ? glyph(id) : null, txt: txt || null, t0: performance.now() }); try { sfx('ui_pick', { vol: .5 }); } catch (e) {} }
  window.emoteSay = say;
  const now = () => performance.now() / 1000;
  function foeSay(id, delay) { if (now() - lastFoe < 2.2) return; lastFoe = now() + (delay || 0); setTimeout(() => { try { if (typeof ents !== 'undefined' && ents && ents[1] && running !== undefined && document.getElementById('battle').classList.contains('on')) say(ents[1], id); } catch (e) {} }, (delay || 0) * 1000); }
  const pickFor = list => { const mood = M && M.rival && MOOD[M.rival.mood]; if (mood && Math.random() < .4) { const ks = Object.keys(mood), tot = ks.reduce((a, k) => a + mood[k], 0); let r = Math.random() * tot; for (const k of ks) { r -= mood[k]; if (r <= 0) return k; } } return list[Math.random() * list.length | 0]; };
  window.sendEmote = function (id) { const row = document.getElementById('emoRow'); if (row) row.classList.remove('on'); if (now() - lastMine < 1.5 || typeof ents === 'undefined' || !ents || !ents[0]) return; lastMine = now(); say(ents[0], id);
    if (Math.random() < .85) foeSay(pickFor(REPLY[id] || ['happy']), rnd(.7, 1.6)); };
  // the button and its tray
  const host = document.getElementById('battle');
  if (host) { host.insertAdjacentHTML('beforeend', `<button id="emoBtn" aria-label="Emotes">😀</button><div id="emoRow">${EM.map(([id, g]) => `<button onclick="sendEmote('${id}')">${g}</button>`).join('')}</div>`);
    document.getElementById('emoBtn').onclick = e => { e.stopPropagation(); document.getElementById('emoRow').classList.toggle('on'); }; }
  const css = document.createElement('style');
  css.textContent = `#emoBtn{position:absolute;left:8px;bottom:112px;z-index:6;width:40px;height:40px;border-radius:50%;border:2px solid #000;background:linear-gradient(#4a3a80,#2b2050);font-size:20px;line-height:1;cursor:pointer;box-shadow:0 3px 0 #000;padding:0}
  #emoRow{position:absolute;left:54px;bottom:108px;z-index:6;display:none;gap:4px;padding:5px;border-radius:16px;border:2px solid #000;background:#150f27f2;box-shadow:0 4px 0 #000;flex-wrap:wrap;max-width:calc(100% - 70px)}#emoRow.on{display:flex}
  #emoRow button{width:38px;height:38px;border-radius:11px;border:2px solid #000;background:#2a1f52;font-size:20px;line-height:1;cursor:pointer;padding:0}html.onb-on #emoBtn{display:none}`;
  document.head.appendChild(css);
  // the rival reacts to the fight
  const _up = update;
  window.update = update = function (dt) { const r = _up.apply(this, arguments);
    try { if (typeof ents !== 'undefined' && ents && ents[1] && !ended && !window.ONB_ACTIVE) { const a = ents[0], b = ents[1];
      if (hpPrev && hpPrev.a === a && hpPrev.b === b) { const da = hpPrev.ha - a.hp, db = hpPrev.hb - b.hp;
        if (da >= 16 && Math.random() < .35) foeSay(pickFor(['happy', 'up', 'happy']), rnd(.3, .8));
        else if (db >= 16 && Math.random() < .35) foeSay(pickFor(['shock', 'down', 'tear']), rnd(.3, .8)); }
      hpPrev = { a, b, ha: a.hp, hb: b.hp }; } } catch (e) {}
    return r; };
  const _er = endRound;
  window.endRound = endRound = function (winner) { try { if (!ended && !window.ONB_ACTIVE && typeof ents !== 'undefined' && ents && ents[1]) { const last = M && (M.score[winner] + 1 >= (typeof WIN !== 'undefined' ? WIN : 4)); if (winner === 'foe') say(ents[1], last ? 'up' : pickFor(['happy', 'up'])); else say(ents[1], last ? 'up' : pickFor(['cry', 'tear', 'shock'])); } } catch (e) {} return _er.apply(this, arguments); };
  const _sd = startDuel;
  window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); bubbles = []; hpPrev = null; try { if (M && M.round === 1 && !M.rival && !window.ONB_ACTIVE && Math.random() < .5) foeSay('happy', 1.2); } catch (e) {} return r; };
  // speech bubbles, drawn over everything
  const _rn = render;
  window.render = render = function () { const r = _rn.apply(this, arguments);
    try { const t1 = performance.now(); bubbles = bubbles.filter(b => t1 - b.t0 < (b.txt ? 2800 : 2200) && !b.w.dead);
      for (const b of bubbles) { const k = (t1 - b.t0) / 1000, life = b.txt ? 2.8 : 2.2, pop = k < .18 ? 1.25 - .25 * (k / .18) * (2 - k / .18) + (k < .09 ? -(1 - k / .09) * .9 : 0) : 1, al = k > life - .3 ? (life - k) / .3 : 1, x = ctx, w = b.w;
        x.save(); x.translate(clamp(w.x + (w.me ? 30 : -30), 50, W - 50), w.y - 128 * HS); x.scale(Math.max(.1, pop), Math.max(.1, pop)); x.globalAlpha = Math.max(0, al);
        x.font = b.txt ? "16px 'Lilita One', system-ui" : '24px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        // (1.0.32.3) speech is set larger and wraps onto a second line instead of being squeezed
        let lines = null; if (b.txt) { if (!b.lines) { const words = b.txt.split(' '), L = []; let cur = ''; for (const wd of words) { const t2 = cur ? cur + ' ' + wd : wd; if (x.measureText(t2).width > 176 && cur) { L.push(cur); cur = wd; } else cur = t2; } if (cur) L.push(cur); b.lines = L.slice(0, 2); } lines = b.lines; }
        const tw = b.txt ? Math.min(200, Math.max(...lines.map(l => x.measureText(l).width)) + 22) : 40, th = b.txt ? 14 + lines.length * 18 : 38;
        x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); if (x.roundRect) x.roundRect(-tw / 2, -th / 2, tw, th, 12); else x.rect(-tw / 2, -th / 2, tw, th); x.fill(); x.stroke();
        const tx = w.me ? -10 : 10; x.beginPath(); x.moveTo(tx - 6, th / 2 - 1); x.lineTo(tx - (w.me ? 12 : -12), th / 2 + 11); x.lineTo(tx + 6, th / 2 - 1); x.closePath(); x.fill(); x.beginPath(); x.moveTo(tx - 6, th / 2); x.lineTo(tx - (w.me ? 12 : -12), th / 2 + 11); x.lineTo(tx + 6, th / 2); x.stroke();
        x.fillStyle = '#1a1030'; if (b.txt) lines.forEach((l, i) => x.fillText(l, 0, 1 + (i - (lines.length - 1) / 2) * 18, 180)); else x.fillText(b.e, 0, 2);
        x.restore(); } } catch (e) {}
    return r; };
})();

/* ---------------- daily login streak (F-493) and a season that counts down (F-494) ---------------- */
(function () {
  const dayStr = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const PAY = [50, 75, 100, 150, 200, 250, 400];
  window.ECON = Object.assign(window.ECON || {}, { loginPay: PAY });
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
  function loginDue() { const L = PR.login || {}; return L.day !== dayStr(); }
  window.claimLogin = function () { const L = PR.login = PR.login || { day: null, streak: 0 }; if (L.day === dayStr()) return closeSheet();
    L.streak = L.day === yesterday() ? (L.streak || 0) + 1 : 1; L.day = dayStr(); const i = (L.streak - 1) % 7, gold = PAY[i]; PR.coins = (PR.coins || 0) + gold; let extra = '';
    if (i === 6) { PR.mTok = (PR.mTok || 0) + 1; extra = ' and an Echo Rune'; }
    try { save(); sfx('ui_coin'); } catch (e) {} closeSheet(); refreshMeta(); toast(`Day ${L.streak} streak: +${gold} gold${extra}`); };
  window.openLogin = function () { const L = PR.login || { streak: 0 }, cont = L.day === yesterday(), next = cont ? (L.streak || 0) + 1 : 1, idx = (next - 1) % 7, due = loginDue();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Daily Login</div><div class="ssub" style="margin:0">${due ? (cont ? `Day ${next} of your streak. Keep it going!` : (L.streak ? 'Your streak reset. Day 1 starts now.' : 'Come back every day for bigger rewards.')) : `Claimed today. Streak: ${L.streak} day${L.streak === 1 ? '' : 's'}. Come back tomorrow!`}</div>
      <div class="lgrid">${PAY.map((g, i) => { const cur = due ? i === idx : false, done = due ? i < idx : i <= ((L.streak - 1) % 7); return `<div class="lday ${done ? 'done' : ''} ${cur ? 'lcur' : ''}"><small>Day ${i + 1}</small><span class="ci coin-i"></span><b>${g}</b>${i === 6 ? '<em>+ Rune</em>' : ''}</div>`; }).join('')}</div>
      <div class="lgnote">Day 7 adds an Echo Rune: after a match, spend it to double one ability's skill points.</div>
      ${due ? `<button class="upbtn" onclick="claimLogin()">Claim ${PAY[idx]} gold</button>` : `<button class="upbtn" onclick="closeSheet()">OK</button>`}`;
    $('sheet').classList.add('on'); };
  // season: 30 days each, counted from a fixed start so every player sees the same clock
  const S0 = Date.UTC(2026, 10, 15), LEN = 30, NAMES = ['Bog of Echoes', 'The Long Frost', 'Bonefield Rising', 'Siege of the Keep', 'Wild Hunt', 'Drowned Coast'];
  const seasonNow = () => { const d = Math.max(0, Math.floor((Date.now() - S0) / 864e5)); return { n: Math.floor(d / LEN) + 1, left: LEN - (d % LEN), name: NAMES[Math.floor(d / LEN) % NAMES.length] }; };
  window.seasonNow = seasonNow;
  function seasonTick() { const s = seasonNow();
    if (PR.season && PR.season < s.n && !window.ONB_ACTIVE) { const rk = rankOf(PR.trophies), gold = 150 * (rk + 1); PR.coins = (PR.coins || 0) + gold; PR.mTok = (PR.mTok || 0) + 1; setTimeout(() => { try { toast(`Season ${PR.season < s.n ? s.n - 1 : s.n} ended! Rank reward: +${gold} gold and an Echo Rune`); } catch (e) {} }, 1200); }
    if (PR.season !== s.n) { PR.season = s.n; try { save(); } catch (e) {} }
    const el = document.querySelector('#home .stage .st'); if (el) el.innerHTML = `SEASON ${s.n} · ${s.left} DAY${s.left === 1 ? '' : 'S'} LEFT<b>${s.name}</b>`;
    const rk = document.getElementById('seasonRk'); if (rk) rk.textContent = `Season ${s.n}: ${s.name} · ${s.left} day${s.left === 1 ? '' : 's'} left`; }
  const _rm = refreshMeta;
  window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { seasonTick(); const b = document.getElementById('lgBtn'); if (b) b.classList.toggle('due', loginDue()); } catch (e) {} return r; };
  // a Login button under Challenges, and an automatic prompt once a day on the home screen
  const st = document.querySelector('#home .stage'); if (st && !document.getElementById('lgBtn')) st.insertAdjacentHTML('beforeend', `<button class="chbtn" id="lgBtn" onclick="openLogin()">Login<i></i></button>`);
  const mc = document.querySelector('#ranks .mc'); if (mc && !document.getElementById('seasonRk')) mc.insertAdjacentHTML('afterbegin', '<div id="seasonRk" class="seasonrk"></div>');
  const css = document.createElement('style');
  css.textContent = `#lgBtn{top:124px!important;background:linear-gradient(#8a6bff,#5b3bd1)!important;color:#fff!important}#lgBtn i{display:none;width:9px;height:9px;border-radius:50%;background:#ff4a5a;border:1.5px solid #000}#lgBtn.due i{display:block}
  .lgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}.lday{background:#1a1236;border:2px solid #000;border-radius:12px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;aspect-ratio:1;min-width:0;box-sizing:border-box}.lday small{font:10px 'Lilita One';color:#b9a6ee;letter-spacing:.5px}.lday b{font:15px 'Lilita One';font-weight:400;color:#ffd75e}.lday em{font:9px Nunito;font-style:normal;font-weight:800;color:#c9b8ff}.lday .ci{width:20px;height:20px}.lday.done{opacity:.45}.lday.lcur{background:linear-gradient(#4a3a80,#2b2050);border-color:#ffd75e;box-shadow:inset 0 0 0 2px #ffd75e55}.lgnote{font:11px Nunito;font-weight:800;color:#c9b8ff;text-align:center;margin-top:-2px}
  .seasonrk{font:13px 'Lilita One';letter-spacing:.5px;color:#ffd75e;text-align:center;background:#0006;border:2px solid #000;border-radius:12px;padding:7px}`;
  document.head.appendChild(css);
  try { refreshMeta(); } catch (e) {}
  const prompt = () => { try { if (!loginDue() || window.ONB_ACTIVE || !document.getElementById('home').classList.contains('on')) return; if (['sheet', 'upm', 'lvup', 'chestOv', 'pause'].some(id => { const e = document.getElementById(id); return e && (e.classList.contains('on') || (e.style.display && e.style.display !== 'none' && id !== 'sheet')); })) return; openLogin(); } catch (e) {} };
  setTimeout(prompt, 2200); const _sh = show; window.show = show = function (s) { const r = _sh.apply(this, arguments); if (s === 'home') setTimeout(prompt, 2600); return r; };
})();

/* ---------------- the final stretch: from round 5 the battle music switches to a harder track (F-496)
   and every draft offer holds one card picked to counter the build you are facing (F-497) ---------------- */
(function () {
  const FINAL = 5;
  const _mu = window.music;
  // battle music by round. "Follows the fight" (the default): rounds 1-2, 3-4, 5-6 and 7 each have their own track, with two
  // alternatives for the last two phases chosen once per match. Any other choice keeps the old rule: harder music from round 5.
  const ready = id => { const e = AU.man && AU.man[id]; return !!(e && e.files && AU.buf[e.files[0]] !== null); };
  window.music = music = function (id) { try { if (id === 'bgm_battle' && typeof M !== 'undefined' && M && AU.man) { const r = M.round || 1, mode = typeof bgmChoice === 'function' ? bgmChoice('battle') : 'shuffle';
      const one = a => { const ok = a.filter(ready); return (ok.length ? ok : a)[Math.random() * (ok.length || a.length) | 0]; }; M.musPick = M.musPick || [one(['bgm_phase3', 'bgm_battle_final', 'bgm_phase3b']), one(['bgm_final2', 'bgm_battle_finale', 'bgm_final3'])];
      if (mode === 'phase') { const want = r >= 7 ? M.musPick[1] : r >= 5 ? M.musPick[0] : r >= 3 ? 'bgm_phase2' : 'bgm_phase1'; if (ready(want)) return _mu(want); }
      if (r >= FINAL) { if (r >= 7 && ready(M.musPick[1])) return _mu(M.musPick[1]); if (ready(M.musPick[0])) return _mu(M.musPick[0]); } } } catch (e) {} return _mu.apply(this, arguments); };
  const _sd = startDuel;
  window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { if (M && M.round >= FINAL) { music('bgm_battle'); if (M.round === FINAL && !M._finalSaid) { M._finalSaid = 1; setTimeout(() => { try { toast('Final stretch! Each draft now includes a counter card.'); } catch (e) {} }, 600); } } } catch (e) {} return r; };
  // one counter card per offer from round 5
  const _go = genOffer;
  window.genOffer = genOffer = function (p, round) {
    const out = _go.apply(this, arguments);
    try { if (round >= FINAL && M && out && out.length && window.AI_DEBUG && AI_DEBUG.counterVs && !window.ONB_ACTIVE) {
      const opp = p === M.me ? M.foe : M.me, ob = opp.book || []; if (!ob.length) return out;
      const upsOn = k => [...opp.up].filter(u => u.startsWith(k + '.')).length, sc = k => AI_DEBUG.counterVs(k, ob, upsOn);
      const full = p.book.length >= capOf(), cands = [];
      for (const k of (p.pool || M.unlocked)) { const n = p.book.filter(b => b === k).length; if (ONE_COPY.has(k) && n) continue; if (n >= MAX_COPIES) continue; cands.push({ c: { type: full ? 'replace' : 'new', k }, s: sc(k) }); }
      for (const k of new Set(p.book)) for (const u of UPG[k]) if (!p.up.has(k + '.' + u.id) && (!u.req || p.up.has(k + '.' + u.req)) && (typeof upGate !== 'function' || upGate(p, k, u))) cands.push({ c: { type: 'up', k, u }, s: sc(k) * .9 });
      cands.sort((a, b) => b.s - a.s); const best = cands.find(q => q.s > 0); if (!best) return out;
      const same = (a, b) => a.type === b.type && a.k === b.k && (a.type !== 'up' || a.u.id === b.u.id);
      const have = out.findIndex(c => same(c, best.c));
      if (have >= 0) out[have].counter = 1; else { let wi = 0, ws = 1e9; out.forEach((c, i) => { const s = sc(c.k); if (s < ws) { ws = s; wi = i; } }); out[wi] = Object.assign({ counter: 1 }, best.c); }
    } } catch (e) {}
    return out;
  };
  // mark the counter card in the player's draft
  const _rd = renderDraft;
  window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments); try { (M.offer || []).forEach((c, i) => { if (!c.counter) return; const el = document.querySelector(`#cards .card[data-i="${i}"]`); if (el && !el.querySelector('.ctag')) el.insertAdjacentHTML('beforeend', '<span class="ctag">COUNTER</span>'); }); } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `.card .ctag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font:10px 'Lilita One';letter-spacing:1px;padding:2px 8px;border-radius:8px;border:2px solid #000;background:linear-gradient(#ff8a96,#d63a4a);color:#fff;z-index:3;white-space:nowrap}`;
  document.head.appendChild(css);
})();

/* ---------------- options: one art style, and Reset progress with a confirm (F-501, F-502) ---------------- */
(function () {
  try { ART_STYLE = 'hd'; localStorage.setItem('sb.artStyle2', 'hd'); } catch (e) {}
  window.askReset = function () { $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Reset progress?</div><div class="ssub" style="margin:0">This wipes your level, trophies, gold, unlocked abilities and cosmetics on this device. It can't be undone.</div><button class="upbtn" style="background:linear-gradient(#ff8a96,#d63a4a)" onclick="doReset()">Yes, erase everything</button><button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="openOptions()">Cancel</button>`; $('sheet').classList.add('on'); };
  window.doReset = function () { try { localStorage.removeItem(SAVE); } catch (e) {} location.reload(); };
  const _sh = settingsHTML;
  window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = document.getElementById('pause') && document.getElementById('pause').classList.contains('on'); return inMatch ? h : h.replace(/<\/div>$/, '<button class="hbtn out" style="width:100%;margin-top:8px;color:#ff9aa6;border-color:#d63a4a" onclick="askReset()">Reset progress</button></div>'); };
})();

/* ---------------- VFX pass (F-508 to F-511) ----------------
   Live effects: craters keep smoking, scorches keep glowing, frost keeps misting for the rest of the round they were
   made in; at the next round they go quiet and only the scar stays. Debris from broken summons lies on the field
   until the next round. Grand Bisection leaves a blood splatter. Ricochet runes spark on every bounce. */
(function () {
  let emit = [], debris = [];
  const LIVE = {
    ejecta:     o => ({ kind: 'smoke', r: (o && o.r) || 50, heavy: 1, embers: 1 }),
    scorch:     o => ({ kind: 'smoke', r: 14 * ((o && o.s) || 1), embers: ((o && o.s) || 1) >= 1.4 ? 1 : 0 }),
    firering:   o => ({ kind: 'ring', r: (o && o.r) || 60 }),
    lich:       o => ({ kind: 'wisp', r: 10 * ((o && o.s) || 1) }),
    frostcrack: o => ({ kind: 'mist', r: (o && o.r) || 24 }),
    etch:       o => ({ kind: 'fume', r: (o && o.r) || 20 }),
  };
  const _sc = scar;
  window.scar = scar = function (k, x, y, o) { const r = _sc.apply(this, arguments);
    try { if (LIVE[k] && typeof ended !== 'undefined' && !ended && typeof running !== 'undefined' && document.getElementById('battle').classList.contains('on')) {
      const e = LIVE[k](o); if (e.r >= 9 && !emit.some(q => q.kind === e.kind && Math.hypot(q.x - x, q.y - y) < Math.max(14, e.r * .45))) { if (emit.length > 36) emit.splice(emit.findIndex(q => !q.heavy), 1); emit.push(Object.assign(e, { x, y, t: 0, acc: Math.random() })); } } } catch (er) {}
    return r; };
  window.addEmitter = (x, y, kind, r, extra) => { if (emit.some(q => q.kind === kind && Math.hypot(q.x - x, q.y - y) < 30)) return; if (emit.length > 40) emit.splice(Math.max(0, emit.findIndex(q => !q.heavy)), 1); emit.push(Object.assign({ x, y, kind, r, t: 0, acc: 0 }, extra || {})); };
  function emitTick(dt) {
    for (const e of emit) { e.t += dt; const fade = Math.max(.35, 1 - e.t / 40);   // thins out a little over a long round, never stops
      const rate = (e.kind === 'smoke' ? (e.heavy ? 5 : 1.6) : e.kind === 'ring' ? 5 : e.kind === 'mist' ? 2.2 : e.kind === 'fume' ? 2 : 1.2) * fade;
      e.acc += rate * dt; while (e.acc >= 1) { e.acc -= 1; const R = e.r;
        if (e.kind === 'smoke') { const s = Math.min(2.2, R / 30); P({ x: e.x + rnd(-R * .35, R * .35), y: e.y + rnd(-R * .15, R * .12), vx: rnd(-10, 14), vy: rnd(-42, -18), color: ['#3b3346', '#4d4458', '#2e2838', '#5a5066'][Math.random() * 4 | 0], size: rnd(4, 8) * (e.heavy ? 1.3 : .8) * Math.max(.7, s * .6), life: rnd(1.4, 2.6), glow: false, shrink: false, grow: 1.9, drag: .88, fade: .6 });
          if (e.embers && Math.random() < .45) { if (Math.random() < .5) decals.push({ k: 'ember', x: e.x + rnd(-R * .5, R * .5), y: e.y + rnd(-R * .25, R * .25), t: 0, life: rnd(1.6, 3), s: rnd(.6, 1.1) }); else P({ x: e.x + rnd(-R * .3, R * .3), y: e.y, vx: rnd(-14, 14), vy: rnd(-70, -30), color: Math.random() < .5 ? '#ffb347' : '#ff5a1f', size: rnd(1.4, 2.6), life: rnd(.6, 1.2) }); } }
        else if (e.kind === 'ring') { const a = rnd(0, 6.283); if (Math.random() < .6) decals.push({ k: 'ember', x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * .55, t: 0, life: rnd(1.6, 3), s: rnd(.6, 1.1) }); else P({ x: e.x + Math.cos(a) * R, y: e.y + Math.sin(a) * R * .55, vx: rnd(-8, 8), vy: rnd(-36, -14), color: '#3b3346', size: rnd(3, 5), life: rnd(1, 1.8), glow: false, shrink: false, grow: 1.7, drag: .88 }); }
        else if (e.kind === 'wisp') P({ x: e.x + rnd(-4, 4), y: e.y, vx: rnd(-6, 6), vy: rnd(-34, -16), color: '#6a6078', size: rnd(2.5, 4.5), life: rnd(1, 1.7), glow: false, shrink: false, grow: 1.6, drag: .9 });
        else if (e.kind === 'mist') P({ x: e.x + rnd(-R, R), y: e.y + rnd(-R * .4, R * .4), vx: rnd(-16, 16), vy: rnd(-12, -3), color: Math.random() < .5 ? '#d8f6ff' : '#ffffff', size: rnd(3, 6), life: rnd(1.2, 2.2), glow: false, shrink: false, grow: 1.5, drag: .92, fade: .5 });
        else if (e.kind === 'fume') P({ x: e.x + rnd(-R * .7, R * .7), y: e.y + rnd(-R * .3, R * .3), vx: rnd(-6, 6), vy: rnd(-30, -12), color: Math.random() < .5 ? '#9fd04a' : '#d8f070', size: rnd(2, 4), life: rnd(.9, 1.6), glow: false, grow: 1.4, drag: .9 });
        else if (e.kind === 'violet') P({ x: e.x + rnd(-R * .5, R * .5), y: e.y + rnd(-R * .2, R * .2), vx: rnd(-10, 10), vy: rnd(-40, -16), color: ['#3a1470', '#6a3fd6', '#1a0a30'][Math.random() * 3 | 0], size: rnd(4, 7), life: rnd(1.3, 2.2), glow: false, shrink: false, grow: 1.8, drag: .88 }); } }
  }
  // debris: small pieces thrown from a broken summon; they land and lie there until the next round
  const DEB = { rock: ['#a8a29a', '#7a746c', '#5a554e'], bone: ['#f2ecd8', '#d8cfb4', '#b8ad8e'], wood: ['#8a5a2b', '#6b4420', '#a8703a'], copper: ['#e0935a', '#b86a32', '#ffd0a0'], glass: ['#f0d2ff', '#b06bff', '#ffffff'] };
  function scatter(x, y, kind, n, sz) { for (let i = 0; i < n; i++) { if (debris.length > 160) debris.shift(); const a = rnd(0, 6.283), v = rnd(30, 150); debris.push({ x, y, z: rnd(8, 34), vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, vz: rnd(60, 190), rot: rnd(0, 6.3), vr: rnd(-10, 10), kind, c: DEB[kind][i % 3], sz: rnd(.6, 1.25) * (sz || 3), sh: Math.random() * 3 | 0, land: 0 }); } }
  window.scatterDebris = scatter;
  function debTick(dt) { for (const d of debris) { if (d.land) continue; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.vz -= 560 * dt; d.rot += d.vr * dt; if (d.z <= 0) { if (d.vz < -130 && !d.b) { d.b = 1; d.z = 0; d.vz = -d.vz * .3; d.vx *= .5; d.vy *= .5; } else { d.z = 0; d.land = 1; d.x = clamp(d.x, F.x0, F.x1); d.y = clamp(d.y, F.y0, F.y1); } } } }
  function debDraw(x) { for (const d of debris) { x.save(); x.translate(d.x, d.y - d.z); if (d.land) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(1, 1.5, d.sz * 1.1, d.sz * .45, 0, 0, 7); x.fill(); } x.rotate(d.rot); x.fillStyle = d.c; x.strokeStyle = '#07020d'; x.lineWidth = 1.1; const s = d.sz; x.beginPath();
      if (d.kind === 'bone') { x.lineCap = 'round'; x.lineWidth = s * .7 + 1.6; x.strokeStyle = '#07020d'; x.moveTo(-s * 1.4, 0); x.lineTo(s * 1.4, 0); x.stroke(); x.strokeStyle = d.c; x.lineWidth = s * .7; x.stroke(); x.beginPath(); x.arc(-s * 1.4, 0, s * .55, 0, 7); x.arc(s * 1.4, 0, s * .55, 0, 7); x.fill(); }
      else if (d.kind === 'wood') { x.rect(-s * 1.6, -s * .3, s * 3.2, s * .6); x.fill(); x.stroke(); }
      else if (d.kind === 'glass' || d.sh === 0) { x.moveTo(0, -s * 1.2); x.lineTo(s * .8, s * .5); x.lineTo(-s * .7, s * .7); x.closePath(); x.fill(); x.stroke(); }
      else { x.moveTo(-s, -s * .2); x.lineTo(-s * .2, -s * .9); x.lineTo(s, -s * .3); x.lineTo(s * .7, s * .7); x.lineTo(-s * .6, s * .8); x.closePath(); x.fill(); x.stroke(); }
      x.restore(); } }
  // what breaks into what
  const dieHook = (nm, fn) => { const f = window[nm]; if (typeof f !== 'function') return; const g = function (e) { const alive = e && (e.hp > 0) && !e.gone; const r = f.apply(this, arguments); try { if (alive && (e.hp <= 0 || e.gone) && !ended) fn(e); } catch (er) {} return r; }; window[nm] = g; try { eval(nm + ' = g'); } catch (er) {} };
  dieHook('hurtGolem', g => { scatter(g.x, g.y, 'rock', g.mini ? 6 : 14, g.mini ? 2.4 : 3.6); scar('pebbles', g.x, g.y, { r: 34 }); });
  dieHook('hurtArcher', a => scatter(a.x, a.y, 'wood', 6, 2.6));
  dieHook('hurtTotem', t => scatter(t.x, t.y, 'copper', 7, 2.4));
  dieHook('hurtZ', z => { if (!z.beast) scatter(z.x, z.y, 'bone', 4, 2.2); });
  dieHook('hurtDecoy', d => scatter(d.x, d.y, 'glass', 8, 2.6));
  // Grand Bisection: blood under and behind the caster it hits, different every time
  window.__splatDraw = (x, all) => splatDraw(x, all);
  window.bloodSplat = function (f, a) { if (typeof M === 'undefined' || !M) return; M.splats = M.splats || []; const ca = Math.cos(a), sa = Math.sin(a), blobs = [];
    const n1 = 5 + (Math.random() * 4 | 0); for (let i = 0; i < n1; i++) blobs.push({ x: rnd(-14, 14), y: rnd(-6, 6), rx: rnd(7, 17), ry: rnd(3.5, 8), rot: rnd(0, 3.14) });                      // the pool beneath them
    const n2 = 9 + (Math.random() * 9 | 0), spread = rnd(.35, .8), reach = rnd(60, 130); for (let i = 0; i < n2; i++) { const an = rnd(-spread, spread), d = rnd(14, reach) * (1 - Math.abs(an) * .5), dx = Math.cos(an) * d, dy = Math.sin(an) * d; blobs.push({ x: ca * dx - sa * dy, y: (sa * dx + ca * dy) * .6, rx: rnd(4, 12) * (1 - d / (reach * 1.4)) + 2, ry: rnd(1.4, 3.4), rot: Math.atan2(sa * .6, ca) + an }); }   // the spray thrown along the cut
    const n3 = 10 + (Math.random() * 10 | 0); for (let i = 0; i < n3; i++) { const an = rnd(0, 6.283), d = rnd(18, 70); blobs.push({ x: Math.cos(an) * d, y: Math.sin(an) * d * .5, rx: rnd(1, 3), ry: rnd(1, 2.4), rot: 0 }); }               // stray drops
    M.splats.push({ x: f.x, y: f.y + 4, blobs, rd: M.round, t: 0 }); if (M.splats.length > 14) M.splats.shift();
    for (let i = 0; i < 26; i++) { const an = a + rnd(-.7, .7), v = rnd(120, 420); P({ x: f.x, y: f.y - 40 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7 - rnd(20, 120), color: i % 3 ? '#a8101f' : '#5a0610', size: rnd(2, 4.5), life: rnd(.4, .8), grav: 620, glow: false }); } };
  function splatDraw(x, all) { if (typeof M === 'undefined' || !M || !M.splats) return; for (const s of M.splats) { if (!all) { s.t += 1 / 60; if (s.t >= .25) continue; } const old = s.rd !== M.round, grow = Math.min(1, s.t * 5); x.save(); x.translate(s.x, s.y); x.globalAlpha = old ? .36 : .86; x.fillStyle = old ? '#4a4347' : '#7a0c18';
      for (const b of s.blobs) { x.beginPath(); x.ellipse(b.x * grow, b.y * grow, b.rx * grow, b.ry * grow, b.rot, 0, 7); x.fill(); }
      if (!old) { x.globalAlpha = .5; x.fillStyle = '#c21a2c'; for (let i = 0; i < Math.min(4, s.blobs.length); i++) { const b = s.blobs[i]; x.beginPath(); x.ellipse(b.x * grow - 2, b.y * grow - 1, b.rx * .45 * grow, b.ry * .4 * grow, b.rot, 0, 7); x.fill(); } }
      x.restore(); } }
  // hooks
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) { const r = _dd.apply(this, arguments); if (x !== ctx) return r; try { splatDraw(x); debDraw(x); } catch (e) {} return r; };
  const _up = update;
  window.update = update = function (dt) { const r = _up.apply(this, arguments);
    try { if (!ended) emitTick(dt); debTick(dt);
      // ricochet runes: sparks every time one bounces off the arena edge
      if (typeof runes !== 'undefined') for (const q of runes) { if (!(q.life > 0)) continue; if (q._vx !== undefined && ((q._vx > 0) !== (q.vx > 0) || (q._vy > 0) !== (q.vy > 0)) && (q.x <= F.x0 + 14 || q.x >= F.x1 - 14 || q.y <= F.y0 + 60 || q.y >= F.y1 - 2)) { const col = q.orb ? ['#f0d2ff', '#b06bff', '#fff'] : ['#ffffff', '#f0d2ff', '#ffd45e']; for (let i = 0; i < 12; i++) { const an = Math.atan2(q.vy, q.vx) + rnd(-1.1, 1.1), v = rnd(90, 300); P({ x: q.x, y: q.y - 36 * HS, vx: Math.cos(an) * v, vy: Math.sin(an) * v, color: col[i % 3], size: rnd(1.5, 3), life: rnd(.25, .55), grav: 300 }); } inkRing(q.x, q.y, '#b06bff', 1, 4, 20, .5); } q._vx = q.vx; q._vy = q.vy; }
    } catch (e) {}
    return r; };
  const _sd = startDuel;
  window.startDuel = startDuel = function () { emit = []; debris = []; return _sd.apply(this, arguments); };   // a new round: everything live goes quiet, the field is swept
  window.VFX2_DEBUG = { get emit() { return emit; }, get debris() { return debris; } };
})();

/* burn trenches (Spell Cannon, Collapse) keep smouldering for the rest of the round */
(function () { if (typeof beamScar !== 'function') return; const _bs = beamScar;
  window.beamScar = beamScar = function (O, E, wide, sc) { const d = _bs.apply(this, arguments);
    try { if (!ended && window.addEmitter && d && d.L > 30 && (sc === undefined || sc >= 1)) { const n = Math.max(1, Math.min(4, d.L / 110 | 0)); for (let i = 0; i < n; i++) { const u = (i + .5) / n; addEmitter(d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u, 'smoke', 16, { embers: 1 }); } } } catch (e) {}
    return d; }; })();

/* ---------------- App Store screenshot mode (only when the DEBUG iOS build sets window.SB_SHOT) ---------------- */
(function () {
  const shot = window.SB_SHOT; if (!shot) return;
  setTimeout(() => {
    try {
      window.ONB_ACTIVE = false; document.documentElement.classList.remove('onb-on'); document.querySelectorAll('.onb, #onbSkipAll').forEach(e => e.style.display = 'none'); try { if (typeof ONB !== 'undefined') { ONB.i = -1; } } catch (e) {}
      Object.assign(PR, { name: 'Starweaver', lvl: 14, trophies: 620, coins: 2450, gems: 180, onbDone: 1, title: 'flawless' });
      PR.stats = Object.assign(PR.stats || {}, { matches: 60, wins: 42, flawless: 3, wizW: 22, sorcW: 20, streak: 2, best: 6 });
      PR.chosen = ['meteor', 'mirror', 'rush', 'dissect', 'sanctum', 'polarity', 'storm', 'beam', 'titan', 'zodiac'].filter(k => SP[k]);
      PR.unlocked = Array.from(new Set((PR.unlocked || []).concat(PR.chosen)));
      for (const k in PR.spells) { PR.spells[k].lvl = Math.max(PR.spells[k].lvl, 3 + (k.length % 5)); PR.spells[k].cards = 12; }
      PR.look = Object.assign({}, PR.look, { cls: shot === 'battle' || shot === 'abilities' ? 'sorc' : 'wiz', robe: 'amethyst', hat: 'pointy', beard: 'white', aura: 'violet', pet: 'owl' });
      PR.hand = shot === 'battle' ? ['dissect', 'rush', 'sanctum', 'polarity'] : ['fireball', 'meteor', 'mirror', 'storm'];
      PR.login = { day: new Date().toISOString().slice(0, 10), streak: 4 };
      refreshMeta();
      const sa = setArena;
      if (shot === 'home') { nav('home'); }
      else if (shot === 'abilities') { window.abTab = 'sorc'; nav('spells'); setTimeout(() => openSpell('dissect'), 600); }
      else if (shot === 'wardrobe') { nav('wardrobe'); }
      else if (shot === 'shop') { nav('shop'); setTimeout(() => { try { const el = document.getElementById('packs'); if (el) el.scrollIntoView({ block: 'center' }); } catch (e) {} }, 700); }
      else if (shot === 'draft') { newMatch({ arena: 'castle', mode: 'ranked' }); M.round = 3; M.me.book = ['fireball', 'meteor']; M.me.up = new Set(['fireball.twin']); show('draft'); try { M.offer = genOffer(M.me, 3); renderDraft(); } catch (e) {} }
      else if (shot === 'battle') {
        newMatch({ arena: 'frost', mode: 'ranked' }); M.round = 4; M.score = { me: 2, foe: 1 };
        M.me.book = ['dissect', 'rush', 'polarity', 'dissect']; M.me.up = new Set(['dissect.triple', 'rush.flow', 'polarity.collapse']);
        M.foe.book = ['fireball', 'meteor', 'zombies', 'storm']; M.foe.up = new Set(['fireball.twin', 'zombies.horde']);
        M.foeLv = Object.fromEntries(Object.keys(SP).map(k => [k, 6]));
        const _show = show; window.show = show = function (sc) { if (sc !== 'battle') return; return _show.apply(this, arguments); };   /* the shot stays on the fight */
        _show('battle'); startDuel(); introT = 0; const ri = document.getElementById('rintro'); if (ri) ri.style.display = 'none';
      }
    } catch (e) { console.log('shot error ' + e.message); }
    // no reward pop-ups in screenshots
    const clean = () => { try { if (typeof MQ !== 'undefined') MQ.length = 0; mOpen = false; ['upm', 'lvup', 'chestOv'].forEach(id => { const e = document.getElementById(id); if (e) { e.classList.remove('on'); e.style.display = 'none'; } }); if (shot !== 'abilities') { const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('on'); } } catch (e) {} };
    clean(); let n = 0; const iv = setInterval(() => { clean(); if (++n > 40) clearInterval(iv); }, 150);
  }, 2500);
})();

/* ---------------- blood layer cache (F-549) ----------------
   Settled blood (pools, splatters, drips) is drawn once into an offscreen layer and reused every frame; only blood
   that is still spreading is drawn live. The layer is rebuilt when something settles, scrolls out, or the round changes. */
let __bloodSeq = 0;
function bloodLayer(x) {
  const L = bloodLayer, sp = (M.splats || []).filter(s => s.t >= .25), dr = (M.drips || []).filter(d => d.t >= .2);
  for (const q of sp.concat(dr)) if (!q.id) q.id = ++__bloodSeq;
  const key = M.round + '|' + sp.length + ':' + (sp[0] && sp[0].id) + ':' + (sp.length && sp[sp.length - 1].id) + '|' + dr.length + ':' + (dr[0] && dr[0].id) + ':' + (dr.length && dr[dr.length - 1].id) + '|' + dpr;
  if (!sp.length && !dr.length) return;
  if (L.key !== key || !L.c) { L.key = key; const c = L.c || (L.c = document.createElement('canvas')); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const d of dr) { const old = d.rd !== M.round; g.save(); g.translate(d.x, d.y); g.globalAlpha = old ? .32 : .8; g.fillStyle = old ? '#4a4347' : d.shade ? '#2a1450' : '#6e0a16'; for (const s of d.spots) { g.beginPath(); g.ellipse(s.x, s.y, s.rx, s.ry, s.rot, 0, 7); g.fill(); } g.restore(); }
    if (window.__splatDraw) { const keep = M.splats; M.splats = sp; try { __splatDraw(g, true); } finally { M.splats = keep; } } }
  x.drawImage(L.c, 0, 0, W, H);
}

/* ---------------- zombies bleed: a few small, random blood spots under them on every hit (F-515) ---------------- */
(function () {
  const _hz = hurtZ;
  window.hurtZ = hurtZ = function (z, d) { const alive = z && z.hp > 0; const r = _hz.apply(this, arguments);
    try { if (alive && d > 0 && !z.beast && typeof M !== 'undefined' && M) { M.drips = M.drips || []; const n = 2 + (Math.random() * 4 | 0), spots = [];
      for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), dd = rnd(2, 16); spots.push({ x: Math.cos(an) * dd, y: Math.sin(an) * dd * .5, rx: rnd(1.4, 4.2), ry: rnd(1, 2.6), rot: rnd(0, 3.14) }); }
      M.drips.push({ x: z.x + rnd(-6, 6), y: z.y + 2, spots, rd: M.round, t: 0 }); if (M.drips.length > 90) M.drips.shift();
      for (let i = 0; i < 5; i++) P({ x: z.x + rnd(-5, 5), y: z.y - rnd(14, 30) * HS, vx: rnd(-60, 60), vy: rnd(-90, -20), color: i % 2 ? '#8a0f1c' : '#5a0610', size: rnd(1.4, 2.8), life: rnd(.35, .6), grav: 600, glow: false }); } } catch (e) {}
    return r; };
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) { const r = _dd.apply(this, arguments); if (x !== ctx) return r;
    try { if (typeof M !== 'undefined' && M) bloodLayer(x); } catch (e) {}
    try { if (typeof M !== 'undefined' && M && M.drips) for (const d of M.drips) { d.t += 1 / 60; if (d.t >= .2) continue; const old = d.rd !== M.round, g = Math.min(1, d.t * 6); x.save(); x.translate(d.x, d.y); x.globalAlpha = old ? .32 : .8; x.fillStyle = old ? '#4a4347' : d.shade ? '#2a1450' : '#6e0a16'; for (const s of d.spots) { x.beginPath(); x.ellipse(s.x * g, s.y * g, s.rx * g, s.ry * g, s.rot, 0, 7); x.fill(); } x.restore(); } } catch (e) {}
    return r; };
})();

/* Scorched Earth (Meteor) burns with the new flame art instead of the old cartoon flame ring (F-519) */
(function () {
  const _up = update;
  window.update = update = function (dt) { const r = _up.apply(this, arguments);
    try { if (window.addFlame && !ended) for (const d of decals) if (d.k === 'fire' && d.t < d.life) { d._fa = (d._fa || 0) + dt * (6 + d.r * .08); while (d._fa >= 1) { d._fa -= 1; const an = rnd(0, 6.283), rr = Math.sqrt(Math.random()) * d.r * .8; addFlame(d.x + Math.cos(an) * rr, d.y + Math.sin(an) * rr * .45); } } } catch (e) {}
    return r; };
})();

/* ---------------- Shop: turn a Technique Token into 5 skill points for a technique you own (F-520) ---------------- */
(function () {
  const RATE = 5;
  window.convertTok = function (k) { if (!(PR.tokS > 0) || !PR.spells[k]) return; PR.tokS--; PR.spells[k].cards += RATE; try { save(); sfx('ui_coin'); } catch (e) {} closeSheet(); refreshMeta(); try { renderShop(); } catch (e) {} toast(`+${RATE} skill points to ${SP[k].n}`); };
  window.openConvert = function () { const own = Object.keys(SP).filter(k => SCHOOL_OF(k) === 'sorc' && isUnl(k) && PR.spells[k]);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Convert a Technique Token</div><div class="ssub" style="margin:0">One token becomes ${RATE} skill points for the technique you pick. You have ${PR.tokS || 0}.</div>
      ${own.length ? `<div class="cvgrid">${own.map(k => `<button class="cvb" onclick="convertTok('${k}')"><img src="${ICON[k]}"><span>${SP[k].n}</span><small>Lv ${PR.spells[k].lvl} · +${RATE}</small></button>`).join('')}</div>` : '<div class="ssub">Unlock a technique first.</div>'}`;
    $('sheet').classList.add('on'); };
  const _rs = renderShop;
  window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments);
    try { const host = document.getElementById('mtkShop'); if (host) { let el = document.getElementById('tokConv'); if (!el) { el = document.createElement('div'); el.id = 'tokConv'; host.after(el); }
      const n = PR.tokS || 0; el.innerHTML = `<div class="mtkbuy"><img src="${tokenImg('sorc')}" style="width:40px;height:40px"><div><b>Technique Tokens → skill points</b><small>Turn one token into ${RATE} skill points for a technique you own. You have ${n}.</small></div><button onclick="openConvert()" ${n > 0 ? '' : 'disabled'}>Convert</button></div>`; } } catch (e) {}
    return r; };
  const css = document.createElement('style');
  css.textContent = `.cvgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.cvb{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 3px;border-radius:12px;border:2px solid #000;background:#1a1236;color:#e8e0ff;cursor:pointer}.cvb img{width:40px;height:40px}.cvb span{font:11px 'Lilita One';text-align:center;line-height:1.1}.cvb small{font:10px Nunito;font-weight:800;color:#ffd75e}`;
  document.head.appendChild(css);
})();

/* ---------------- Notifications and match history (F-533) ----------------
   A bell under Login opens a record of every toast and event (newest first, last 150), with a Match history tab:
   each match keeps the rival, result, both spellbooks and upgrades, and damage by ability for every round. */
(function () {
  const now = () => Date.now();
  const log = (msg, kind) => { if (!msg) return; PR.notes = PR.notes || []; const last = PR.notes[0]; if (last && last.m === msg && now() - last.t < 4000) return; PR.notes.unshift({ t: now(), m: String(msg), k: kind || 'info' }); if (PR.notes.length > 150) PR.notes.length = 150; PR.unread = (PR.unread || 0) + 1; try { save(); } catch (e) {} badge(); };
  window.logNote = log;
  const _to = toast;
  window.toast = toast = function (t) { const r = _to.apply(this, arguments); try { if (!window.SB_SHOT) log(t); } catch (e) {} return r; };
  // events that don't always show a toast
  const _us = unlockSpell; window.unlockSpell = unlockSpell = function (k) { const had = isUnl(k); const r = _us.apply(this, arguments); try { if (!had && isUnl(k)) log(`Unlocked ${SP[k].n}`, 'unlock'); } catch (e) {} return r; };
  const _up = upgrade; window.upgrade = upgrade = function (k) { const lv = PR.spells[k] && PR.spells[k].lvl; const r = _up.apply(this, arguments); setTimeout(() => { try { if (PR.spells[k].lvl > lv) log(`${SP[k].n} reached level ${PR.spells[k].lvl}`, 'level'); } catch (e) {} }, 2200); return r; };
  const _lu = window.showLevelUp; if (typeof _lu === 'function') window.showLevelUp = showLevelUp = function () { try { log(`You reached account level ${PR.lvl}`, 'level'); } catch (e) {} return _lu.apply(this, arguments); };

  // ---- match history ----
  let rounds = [];
  const _nm = newMatch; window.newMatch = newMatch = function () { rounds = []; return _nm.apply(this, arguments); };
  const _er = endRound;
  window.endRound = endRound = function (winner) {
    try { if (!ended && M && !window.ONB_ACTIVE) { const d = M.rdmg || { me: {}, foe: {} }, r2 = o => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => v >= .5).map(([k, v]) => [k, Math.round(v)]));
      rounds.push({ n: M.round, w: winner, me: r2(d.me), foe: r2(d.foe), hpMe: Math.max(0, Math.round(ents[0].hp)), hpFoe: Math.max(0, Math.round(ents[1].hp)), t: Math.round(typeof LIMIT !== 'undefined' && typeof clock !== 'undefined' ? LIMIT - clock : 0) }); } } catch (e) {}
    return _er.apply(this, arguments); };
  const _sr = showRewards;
  window.showRewards = showRewards = function () {
    try { if (M && !M._histDone && !window.ONB_ACTIVE && rounds.length) { M._histDone = 1; const won = M.score.me > M.score.foe;
      PR.history = PR.history || []; PR.history.unshift({ t: now(), won, mode: M.mode, score: [M.score.me, M.score.foe], foe: String(M.foeName || 'Rival').replace(/ · AI$/, ''), title: (M.profile && M.profile.n) || '', arena: M.arena,
        myBook: M.me.book.slice(), foeBook: M.foe.book.slice(), myUps: [...M.me.up], foeUps: [...M.foe.up], rounds: rounds.slice() });
      if (PR.history.length > 30) PR.history.length = 30; log(`${won ? 'Won' : 'Lost'} ${M.score.me}–${M.score.foe} vs ${PR.history[0].foe}`, won ? 'win' : 'loss'); } } catch (e) {}
    return _sr.apply(this, arguments); };

  // ---- the screen ----
  const ago = t => { const s = Math.floor((now() - t) / 1000); if (s < 60) return 'just now'; const m = Math.floor(s / 60); if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; return Math.floor(h / 24) + 'd ago'; };
  const ICONS = { unlock: '🔓', level: '⬆️', win: '🏆', loss: '💀', info: '🔔' };
  const icon = k => `<img src="${ICON[k]}" title="${SP[k] ? SP[k].n : k}">`;
  const nameOf = id => { const [k, u] = id.split('.'); const o = UPG[k] && UPG[k].find(q => q.id === u); return o ? o.n : u; };
  let tab = 'notes';
  window.openNotes = function (t) { if (t) tab = t; PR.unread = 0; try { save(); } catch (e) {} badge();
    const tabs = `<div class="ntabs"><button class="${tab === 'notes' ? 'on' : ''}" onclick="openNotes('notes')">Notifications</button><button class="${tab === 'hist' ? 'on' : ''}" onclick="openNotes('hist')">Match history</button></div>`;
    let body = '';
    if (tab === 'notes') { const L = PR.notes || []; body = L.length ? `<div class="nlist">${L.map(n => `<div class="nrow"><span class="ni">${ICONS[n.k] || '🔔'}</span><span class="nm">${n.m.replace(/</g, '&lt;')}</span><small>${ago(n.t)}</small></div>`).join('')}</div>` : '<div class="ssub">Nothing yet. Unlocks, level-ups, rewards and match results will show up here.</div>'; }
    else { const H = PR.history || []; body = H.length ? `<div class="nlist">${H.map((h, i) => `<button class="hrow ${h.won ? 'w' : 'l'}" onclick="openMatch(${i})"><b>${h.won ? 'WIN' : 'LOSS'}</b><span><em>vs ${h.foe}</em><small>${h.score[0]}–${h.score[1]} · ${h.mode === 'ranked' ? 'Ranked' : 'Casual'} · ${ago(h.t)}</small></span><span class="hbk">${h.myBook.map(icon).join('')}</span></button>`).join('')}</div>` : '<div class="ssub">Play a match and it will be recorded here.</div>'; }
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">${tab === 'notes' ? 'Notifications' : 'Match history'}</div>${tabs}${body}`; $('sheet').classList.add('on'); };
  window.openMatch = function (i) { const h = (PR.history || [])[i]; if (!h) return;
    const tot = side => { const o = {}; h.rounds.forEach(r => { for (const k in r[side]) o[k] = (o[k] || 0) + r[side][k]; }); return o; };
    const bars = (o, max) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="dbar">${icon(k)}<i style="width:${Math.max(6, v / max * 100)}%"></i><b>${v}</b></div>`).join('') || '<small class="none">No damage</small>';
    const tm = tot('me'), tf = tot('foe'), mx = Math.max(1, ...Object.values(tm), ...Object.values(tf)), sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">${h.won ? 'Win' : 'Loss'} ${h.score[0]}–${h.score[1]}</div><div class="ssub" style="margin:0">vs ${h.foe}${h.title ? ' · ' + h.title : ''} · ${new Date(h.t).toLocaleString()}</div>
      <div class="mgrid"><div><div class="mh">You</div><div class="hbk">${h.myBook.map(icon).join('')}</div><div class="mups">${h.myUps.map(nameOf).join(' · ') || 'No upgrades'}</div><div class="mt">Total damage ${sum(tm)}</div>${bars(tm, mx)}</div>
        <div><div class="mh f">${h.foe}</div><div class="hbk">${h.foeBook.map(icon).join('')}</div><div class="mups">${h.foeUps.map(nameOf).join(' · ') || 'No upgrades'}</div><div class="mt">Total damage ${sum(tf)}</div>${bars(tf, mx)}</div></div>
      <div class="mh" style="margin-top:6px">Round by round</div>
      ${h.rounds.map(r => `<div class="rrow ${r.w === 'me' ? 'w' : 'l'}"><div class="rh"><b>Round ${r.n}</b><span>${r.w === 'me' ? 'Won' : 'Lost'}${r.t ? ' · ' + r.t + 's' : ''} · HP left ${r.hpMe} / ${r.hpFoe}</span></div><div class="rcols"><div>${Object.entries(r.me).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="rc">${icon(k)}${v}</span>`).join('') || '<small class="none">–</small>'}</div><div>${Object.entries(r.foe).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="rc f">${icon(k)}${v}</span>`).join('') || '<small class="none">–</small>'}</div></div></div>`).join('')}
      <button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="openNotes('hist')">Back to history</button>`;
    $('sheet').classList.add('on'); };
  function badge() { const b = document.getElementById('bellBtn'); if (b) { const n = PR.unread || 0; b.querySelector('i').textContent = n > 99 ? '99+' : n; b.classList.toggle('has', n > 0); } }
  const st = document.querySelector('#home .stage'); if (st && !document.getElementById('bellBtn')) st.insertAdjacentHTML('beforeend', `<button class="chbtn" id="bellBtn" onclick="openNotes('notes')" aria-label="Notifications">🔔<i></i></button>`);
  const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { badge(); } catch (e) {} return r; };
  const css = document.createElement('style');
  css.textContent = `#bellBtn{top:160px!important;background:linear-gradient(#4a3a80,#2b2050)!important;color:#fff!important;font-size:15px;padding:4px 9px!important}#bellBtn i{display:none;font:10px 'Lilita One';font-style:normal;background:#ff4a5a;color:#fff;border:1.5px solid #000;border-radius:8px;padding:0 4px;margin-left:2px}#bellBtn.has i{display:inline-block}
  .ntabs{display:flex;gap:4px;background:#000a;border:2px solid #000;border-radius:12px;padding:3px}.ntabs button{flex:1;font:13px 'Lilita One';padding:7px;border-radius:9px;border:none;background:none;color:#8d7fbf;cursor:pointer}.ntabs button.on{background:linear-gradient(#4a3a80,#33275e);color:#fff}
  .nlist{display:flex;flex-direction:column;gap:5px}.nrow{display:flex;align-items:center;gap:8px;background:#0006;border:2px solid #000;border-radius:11px;padding:7px 9px}.nrow .ni{font-size:16px}.nrow .nm{flex:1;font:13px Nunito;font-weight:800;color:#e8e0ff}.nrow small{font:11px Nunito;font-weight:700;color:#8d7fbf;white-space:nowrap}
  .hrow{display:flex;align-items:center;gap:8px;text-align:left;border:2px solid #000;border-radius:12px;padding:7px 9px;background:#0006;color:#e8e0ff;cursor:pointer}.hrow b{font:12px 'Lilita One';font-weight:400;padding:3px 7px;border-radius:7px;border:1.5px solid #000}.hrow.w b{background:#2fd08a;color:#062a16}.hrow.l b{background:#d63a4a;color:#fff}.hrow span{flex:1;display:flex;flex-direction:column;min-width:0}.hrow em{font:13px 'Lilita One';font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hrow small{font:11px Nunito;font-weight:700;color:#9a8cc4}
  .hbk{display:flex;gap:2px;flex:none}.hbk img{width:24px;height:24px}.hrow .hbk{flex-direction:row}
  .mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mgrid>div{background:#0006;border:2px solid #000;border-radius:12px;padding:7px;min-width:0}.mh{font:13px 'Lilita One';color:#ffd75e}.mh.f{color:#ff9aa6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mups{font:10px Nunito;font-weight:700;color:#b9a6ee;margin:4px 0}.mt{font:11px 'Lilita One';color:#e8e0ff;margin-bottom:3px}
  .dbar{display:flex;align-items:center;gap:4px;margin:2px 0}.dbar img{width:18px;height:18px}.dbar i{height:8px;border-radius:4px;background:linear-gradient(90deg,#7a5cff,#c48cff);border:1px solid #000}.dbar b{font:11px 'Lilita One';font-weight:400;color:#fff}.none{font:11px Nunito;color:#8d7fbf}
  .rrow{background:#0006;border:2px solid #000;border-left-width:5px;border-radius:11px;padding:6px 8px}.rrow.w{border-left-color:#2fd08a}.rrow.l{border-left-color:#d63a4a}.rh{display:flex;justify-content:space-between;align-items:center;gap:6px}.rh b{font:12px 'Lilita One';font-weight:400;color:#fff}.rh span{font:11px Nunito;font-weight:700;color:#9a8cc4}
  .rcols{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}.rcols>div{display:flex;flex-wrap:wrap;gap:4px}.rc{display:flex;align-items:center;gap:2px;font:11px 'Lilita One';color:#ffd75e}.rc.f{color:#ff9aa6}.rc img{width:18px;height:18px}`;
  document.head.appendChild(css);
  try { badge(); } catch (e) {}
})();

/* blood pools where sliced pieces land (F-535): an uneven pool of a few overlapping blobs, different every time */
(function () {
  window.bloodPool = function (x, y, kind, sc) { if (typeof M === 'undefined' || !M) return; sc = sc || 1; M.drips = M.drips || []; const n = 4 + (Math.random() * 4 | 0), spots = [];
    for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), dd = rnd(0, 10) * sc; spots.push({ x: Math.cos(an) * dd, y: Math.sin(an) * dd * .5, rx: rnd(5, 11) * sc, ry: rnd(2.6, 5) * sc, rot: rnd(-.4, .4) }); }
    for (let i = 0; i < 6; i++) { const an = rnd(0, 6.283), dd = rnd(12, 22) * sc; spots.push({ x: Math.cos(an) * dd, y: Math.sin(an) * dd * .5, rx: rnd(1.2, 2.6), ry: rnd(1, 2), rot: 0 }); }
    M.drips.push({ x, y: y + 2, spots, rd: M.round, t: 0, shade: kind === 'shade' }); if (M.drips.length > 90) M.drips.shift(); };
})();

/* ---------------- every draft offer has 3 cards, no matter what (F-539) ----------------
   Hands full of one-copy abilities (Shield, Spell Cannon, Ghost Form, Chosen One…) could run out of legal cards and
   leave only 2. This runs last and fills the gap, loosening rules step by step: any upgrade for an ability in your book
   (rare and gated ones included, except Chosen One's), then more copies of hand abilities past the copy cap, and as a last
   resort an ability you have unlocked outside your hand. Never a card already in the offer. */
(function () {
  const same = (a, b) => a.type === b.type && a.k === b.k && (a.type !== 'up' || (a.u && b.u && a.u.id === b.u.id));
  const _go = genOffer;
  window.genOffer = genOffer = function (p, round) {
    let out = []; try { out = _go.apply(this, arguments) || []; } catch (e) { out = []; }
    if (out.length >= 3) return out;
    try {
      const add = c => { if (out.length < 3 && !out.some(q => same(q, c))) out.push(c); };
      const full = p.book.length >= capOf() && round > 1, owned = new Set(p.book);
      for (const k of [...owned].sort(() => Math.random() - .5)) for (const u of UPG[k] || []) if (!p.up.has(k + '.' + u.id) && (!u.req || p.up.has(k + '.' + u.req)) && k !== 'chosen') add({ type: 'up', k, u });
      for (const k of (p.pool || []).slice().sort(() => Math.random() - .5)) { if (ONE_COPY.has(k) && p.book.includes(k)) continue; add({ type: full ? 'replace' : 'new', k }); }
      const extra = (typeof unlockedSpells === 'function' ? unlockedSpells() : Object.keys(SP)).filter(k => !(p.pool || []).includes(k) && !(ONE_COPY.has(k) && p.book.includes(k)));
      for (const k of extra.sort(() => Math.random() - .5)) add({ type: full ? 'replace' : 'new', k });
    } catch (e) {}
    return out;
  };
})();

/* summons held by Boundary: a pale ward shell and "BOUNDARY" stay on them for the second they are frozen (F-542) */
(function () {
  const _up = update; window.update = update = function (dt) { const r = _up.apply(this, arguments); try { for (const z of zombies) if (z.bndT > 0) z.bndT -= dt; } catch (e) {} return r; };
  const _dd = drawDecals;
  window.drawDecals = drawDecals = function (x) { const r = _dd.apply(this, arguments); if (x !== ctx) return r;
    try { for (const e of zombies.concat(golems)) if (e.bndT > 0 && e.hp > 0) { const k = Math.min(1, e.bndT * 3); x.save(); x.translate(e.x, e.y - 22 * HS); x.globalAlpha = .75 * k; x.strokeStyle = '#bcd2ff'; x.lineWidth = 2.5; x.setLineDash([5, 4]); x.lineDashOffset = -T * 30; x.beginPath(); x.ellipse(0, 0, 22, 30, 0, 0, 7); x.stroke(); x.setLineDash([]); x.fillStyle = 'rgba(188,210,255,.14)'; x.fill();
      x.font = "12px 'Lilita One', system-ui"; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = '#07020d'; x.lineJoin = 'round'; x.strokeText('BOUNDARY', 0, -40); x.fillStyle = '#d6e4ff'; x.fillText('BOUNDARY', 0, -40); x.restore(); } } catch (e) {}
    return r; };
})();

/* ---------------- App Store review prompt and feedback form (F-548) ----------------
   Review: after the first win, Apple's own review prompt (iOS decides whether to show it, and caps it at 3 a year).
   Apple's rule 5.6.1 forbids custom review prompts and filtering by mood, so the review ask goes to everyone the same way.
   Feedback: a form in Options, also suggested (separately from reviews) after 3 losses in a row.
   Sending opens the player's mail app with everything filled in. The address comes from wizard-config.js (FEEDBACK_TO). */
(function () {
  const APP_ID = '6838122041';
  const native = () => window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.app;
  const openURL = u => { const n = native(); if (n) n.postMessage({ action: 'open', url: u }); else window.open(u, '_blank'); };
  window.openExternal = openURL;
  window.askReview = function () {
    const n = native(); if (n) { n.postMessage({ action: 'review' }); return; }
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Rate Wizards vs Sorcerers</div><div class="ssub" style="margin:0">If you have a moment, a rating on the App Store helps a lot.</div><button class="upbtn" onclick="closeSheet();openExternal('https://apps.apple.com/app/id${APP_ID}?action=write-review')">Rate on the App Store</button><button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="closeSheet()">Not now</button>`;
    $('sheet').classList.add('on'); };
  const _sr = showRewards;
  window.showRewards = showRewards = function () { const r = _sr.apply(this, arguments);
    try { if (M && !window.ONB_ACTIVE && M.score.me > M.score.foe && !PR.reviewAsked) { PR.reviewAsked = 1; try { save(); } catch (e) {} setTimeout(() => { if (document.getElementById('rewards').classList.contains('on') && !document.getElementById('sheet').classList.contains('on')) askReview(); }, 3500); } } catch (e) {}
    try { if (M && !window.ONB_ACTIVE && M.score.me < M.score.foe && (PR.lossStreak || 0) >= 3 && !PR.fbOffered) { PR.fbOffered = 1; try { save(); } catch (e) {} setTimeout(() => { try { toast('Rough streak? Tell us what would make it better: Options, Send feedback.'); } catch (e) {} }, 4200); } } catch (e) {}
    return r; };
  const CATS = [['bug', 'Something broke'], ['balance', 'Too hard or unfair'], ['idea', 'An idea'], ['love', 'Something I love'], ['other', 'Other']];
  window.openFeedback = function (back) {
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Send feedback</div><div class="ssub" style="margin:0">Bugs, balance, ideas, anything. It goes straight to the developer.</div>
      <div class="fbcats">${CATS.map(([id, n], i) => `<button class="${i === 0 ? 'on' : ''}" data-c="${id}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${n}</button>`).join('')}</div>
      <textarea id="fbText" maxlength="2000" placeholder="What happened, or what would you change?"></textarea>
      <label class="fbinc"><input type="checkbox" id="fbInc" checked> Include game details (version, rank, current hand)</label>
      <button class="upbtn" onclick="sendFeedback()">Send</button>${back ? `<button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="openOptions()">Back</button>` : ''}`;
    $('sheet').classList.add('on'); };
  window.sendFeedback = function () {
    const to = window.FEEDBACK_TO; if (!to) return toast('Feedback is not set up yet in this build.');
    const txt = (document.getElementById('fbText').value || '').trim(); if (txt.length < 3) return toast('Write a few words first');
    const b = document.querySelector('.fbcats button.on'), cat = (b && b.dataset.c) || 'other', inc = document.getElementById('fbInc').checked;
    const info = inc ? `\n\n---\nVersion ${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?'} | ${native() ? 'iOS app' : 'web'} | level ${PR.lvl} | ${PR.trophies} trophies | ${(PR.look && PR.look.cls) === 'sorc' ? 'sorcerer' : 'wizard'}\nHand: ${(PR.hand || []).map(k => SP[k] ? SP[k].n : k).join(', ')}\n${navigator.userAgent}` : '';
    const subj = 'Wizards vs Sorcerers feedback: ' + (CATS.find(c => c[0] === cat) || [0, 'Other'])[1];
    openURL('mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(txt + info));
    closeSheet(); toast('Your mail app is opening. Tap Send there. Thank you!');
    try { if (window.logNote) logNote('Sent feedback: ' + subj.split(': ')[1]); } catch (e) {} };
  const _sh = settingsHTML;
  window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = document.getElementById('pause') && document.getElementById('pause').classList.contains('on'); return inMatch ? h : h.replace(/<\/div>$/, '<button class="hbtn out" style="width:100%;margin-top:6px" onclick="openFeedback(1)">✉ Send feedback</button><button class="hbtn out" style="width:100%;margin-top:6px" onclick="askReview()">★ Rate the game</button></div>'); };
  const css = document.createElement('style');
  css.textContent = `.fbcats{display:flex;flex-wrap:wrap;gap:5px}.fbcats button{font:12px 'Lilita One';padding:6px 10px;border-radius:10px;border:2px solid #000;background:#1a1236;color:#b9a6ee;cursor:pointer}.fbcats button.on{background:linear-gradient(#4a3a80,#33275e);color:#fff;border-color:#ffd75e}
  #fbText{width:100%;box-sizing:border-box;min-height:120px;resize:vertical;font:14px Nunito;font-weight:700;color:#1b1630;background:#f4f0ff;border:2px solid #000;border-radius:12px;padding:10px;-webkit-user-select:text;user-select:text}.fbinc{display:flex;align-items:center;gap:7px;font:12px Nunito;font-weight:800;color:#c9b8ff}`;
  document.head.appendChild(css);
})();

/* ---------------- Gem packs are the only real-money purchase (F-551) ----------------
   The Unlock Packs (Wizard Tome, Sorcerer Scroll, Grand Bundle) are gone. Money buys gems; gems buy chests, coins and
   Echo Runes. In the iOS app the packs go through StoreKit; on the web they explain that packs are in the app. */
const GEM_PACKS = [{ id: 'gems80', q: 240, price: '$0.99', n: 1 }, { id: 'gems500', q: 1500, price: '$4.99', n: 3, tag: 'POPULAR' }, { id: 'gems1200', q: 3600, price: '$9.99', n: 5, tag: '+20%' }];
window.GEM_PACKS = GEM_PACKS;
window.grantGems = function (id) { const p = GEM_PACKS.find(q => q.id === id); if (!p) return false; PR.gems = (PR.gems || 0) + p.q; try { save(); sfx('ui_coin'); } catch (e) {} try { refreshMeta(); renderShop(); } catch (e) {} toast(`+${p.q.toLocaleString()} gems. Thank you!`); return true; };
window.buyGems = function (id) { const iap = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap; if (iap) iap.postMessage({ action: 'buy', id }); else toast('Gem packs can be bought in the iOS app.'); };
(function () {
  const _rs = renderShop;
  window.renderShop = renderShop = function () { const r = _rs.apply(this, arguments);
    try {
      const pk = document.getElementById('packs'); if (pk) { const lbl = pk.previousElementSibling; if (lbl && /Unlock Packs/i.test(lbl.textContent)) lbl.remove(); pk.remove(); }
      const gp = document.getElementById('gemPacks'); if (gp) { gp.innerHTML = GEM_PACKS.map(p => `<div class="pack">${p.tag ? `<div class="tagx">${p.tag}</div>` : ''}<div class="gems">${SVG.gem.repeat(p.n)}</div><div class="q">${p.q.toLocaleString()}</div><button class="price" onclick="buyGems('${p.id}')">${p.price}</button></div>`).join('');
        // gem packs lead the shop now
        const lbl = gp.previousElementSibling, host = gp.parentNode; if (lbl && host && !gp._moved) { gp._moved = 1; const title = [...host.children].find(e => /^\s*Shop\s*$/.test(e.textContent || '')), after = title ? title.nextElementSibling : host.firstElementChild; host.insertBefore(lbl, after); host.insertBefore(gp, lbl.nextElementSibling); } }
    } catch (e) {}
    return r; };
})();

/* ---------------- sheets always open on top (F-553) ----------------
   Sheets opened from the pause screen (music list, ability info) used to sit underneath it. A sheet is always the thing
   the player just asked for, so it now stacks above pause, reward cards and level-up screens (below toasts and the curtain). */
(function () { const css = document.createElement('style'); css.textContent = `.sheet{z-index:29!important}`; document.head.appendChild(css); })();

/* ---------------- Sanctum: +50% damage (was 20% until 1.0.12) while you stand inside your own dome (F-554, F-728) ---------------- */
(function () {
  const inOwnDome = w => { if (!w || w.dead || !window.TECH_DEBUG) return false; return TECH_DEBUG.domes.some(d => d.o === w && d.t < d.dur && (d.open || Math.hypot(w.x - d.x, (w.y - d.y) * 1.4) < d.r)); };
  window.inOwnDome = inOwnDome;
  const _dm = damage;
  window.damage = damage = function (t, d) { if (d > 0 && t && t.foe && t.foe !== t && inOwnDome(t.foe)) arguments[1] = d * 1.5; return _dm.apply(this, arguments); };
  const _hc = hurtCreature;
  window.hurtCreature = hurtCreature = function (c, k, d) { if (d > 0 && c && c.o && c.o.foe && inOwnDome(c.o.foe)) arguments[2] = d * 1.5; return _hc.apply(this, arguments); };
})();

/* challenge Collect button and the ready dot (F-555) */
(function () { const css = document.createElement('style'); css.textContent = `.chrow .chcol{background:linear-gradient(#7ef08a,#2fb64c)!important;color:#fff!important;text-shadow:0 1px 0 #000}#chDot.ready{background:#2fd08a!important;color:#062a16!important;box-shadow:0 0 0 2px #7dffa8}`; document.head.appendChild(css); })();
