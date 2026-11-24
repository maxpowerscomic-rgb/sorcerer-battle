/* =====================================================================
   WIZARDS VS SORCERERS: Survival (1.0.24)
   A Fight Club tab. The player starts in the middle and mobs rise all around.
   Waves: survive 30, 60, then 90 seconds with 3 lives. Endless: last as long as you can over 3 lives.
   It runs on the duel engine: a wave is a round (so the draft, and the bonus pick after a loss, are the usual ones),
   the mobs are enemy summons, and the "enemy caster" is an unseen anchor that sits on the nearest mob so every ability aims at it.
   Damage and spawn rate both rise 5% every 10 seconds. An optional AI partner casts beside you.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const DUR = [30, 60, 90], WAVE_MUL = [1, 1.3, 1.65], CAP = 26, CX = 195, CY = 420;
  // each mob borrows a shadow-beast drawing and is tinted (hue turn in degrees)
  const MOBS = {
    walker: { id: 'goat', n: 'Shambler', e: '🐐', sz: .85, spd: .85, hp: 16, dmg: 5, acd: .8, path: 'line', hue: 200 },
    runner: { id: 'rabbit', n: 'Skitter', e: '🐇', sz: .6, spd: 2.1, hp: 8, dmg: 3, acd: .45, path: 'zig', hue: 290 },
    brute: { id: 'ox', n: 'Hulk', e: '🐂', sz: 1.45, spd: .55, hp: 85, dmg: 12, acd: 1.1, path: 'line', hue: 105 },
    bomber: { id: 'rooster', n: 'Burster', e: '🐓', sz: .8, spd: 1.5, hp: 10, dmg: 0, acd: .2, path: 'line', hue: 130, boom: 16 },
  };
  for (const k in MOBS) MOBS[k].mob = k;
  const sv = () => (typeof M !== 'undefined' && M && M.sv) || null;
  const ramp = t => 1 + .05 * Math.floor(t / 10);
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const cfg = () => (PR.svCfg = PR.svCfg || { mode: 'waves', pt: 'none', pi: 0 });
  const best = () => (PR.svBest = Array.isArray(PR.svBest) ? PR.svBest : []);
  const decks = () => Array.isArray(PR.decks) ? PR.decks : [];
  const favs = () => Array.isArray(PR.clubFav) ? PR.clubFav : [];
  // a partner casts through the player, so abilities that act on the caster's own body are left out of its hand
  const SELF = new Set(['doubletake', 'rush', 'bloodoath', 'sanctum', 'opensanctum', 'blink', 'ghost', 'shield', 'hourglass', 'burnbody', 'healspring', 'titan', 'crimsontitan', 'counter', 'mirrorcounter', 'secondwind', 'chosen', 'copycast', 'mirror', 'polarity', 'dissect', 'shadowrush', 'beam', 'bloodcraft']);
  const usable = h => (h || []).filter(k => SP[k] && !SELF.has(k));

  /* ---------------- starting a run ---------------- */
  function partnerOf(c) { const un = typeof unlockedSpells === 'function' ? unlockedSpells() : PR.hand;
    if (c.pt === 'random') { const pool = usable(un.filter(k => !(window.VARIANTS && VARIANTS[k]))).sort(() => Math.random() - .5); return { n: 'Hoot\'s Friend', hand: pool.slice(0, 4), look: typeof randomLook === 'function' ? randomLook() : PR.look }; }
    if (c.pt === 'deck') { const d = decks()[c.pi]; if (d) return { n: d.n, hand: usable(d.h).slice(0, 4), look: Object.assign({}, PR.look, { robe: PR.look.robe === 'frost' ? 'ember' : 'frost' }) }; }
    if (c.pt === 'fav') { const b = favs()[c.pi]; if (b) return { n: b.n, hand: usable(b.hand).slice(0, 4), look: Object.assign({}, b.look, { aura: b.aura }) }; }
    return null; }
  window.svStart = function () { const c = cfg(); if (typeof fixHand === 'function') fixHand(); if (PR.hand.length < 4) { toast('Fill your battle hand first: ' + PR.hand.length + ' of 4'); return nav('spells'); }
    const pt = partnerOf(c); if (pt && !pt.hand.length) pt.hand = ['fireball'];
    newMatch({ mode: 'casual', name: 'The Horde', survival: 1 }); if (typeof M === 'undefined' || !M) return;
    M.sv = { endless: c.mode === 'endless', total: 0, t: 0, kills: 0, pt, hand0: PR.hand.slice() }; M.rival = null; M.foeName = 'The Horde'; try { WIN = 3; } catch (e) {} };

  /* ---------------- the round ---------------- */
  function spawn(s, fo, me) { const wave = s.endless ? 0 : Math.min(2, M.score.me), t = s.t, r = Math.random();
    let kind = 'walker'; const late = s.endless ? t > 20 : (wave > 0 || t > 18);
    if (r < .22 && t > 6) kind = 'runner'; else if (r < .38 && late) kind = 'bomber'; else if (r < .47 && (s.endless ? t > 35 : (wave > 0 || t > 24))) kind = 'brute';
    const b = MOBS[kind], a = rnd(0, 6.283), d = rnd(150, 230), q = (window.TECHX && TECHX.inArena) ? TECHX.inArena(me.x + Math.cos(a) * d, me.y + Math.sin(a) * d * .8) : { x: clamp(me.x + Math.cos(a) * d, F.x0, F.x1), y: clamp(me.y + Math.sin(a) * d * .8, F.y0, F.y1) };
    if (Math.hypot(q.x - me.x, q.y - me.y) < 90) return;   // the corner pushed it too close: skip this one
    const hm = (s.endless ? 1 + t / 70 : WAVE_MUL[wave]), dm = (s.endless ? 1 : WAVE_MUL[wave]) * ramp(t), hp = b.hp * hm;
    zombies.push({ o: fo, x: q.x, y: q.y, mx: hp, hp, rise: .3, cd: rnd(.1, .4), t: rnd(0, 9), flash: 0, lunge: 0, beast: b, hue: b.hue, spd: b.spd, dmg: Math.max(.01, b.dmg * dm), acd: b.acd, svMob: 1, boomD: b.boom ? b.boom * dm : 0, onHit: b.boom ? boom : null });
    try { decals.push({ k: 'hole', x: q.x, y: q.y, t: 0, life: 3 }); } catch (e) {} }
  function boom(z, tgt, kind) { if (z.hp <= 0) return; const R = 46; try { inkRing(z.x, z.y, '#ff7a2a', 3, 10, R * 1.3, .5); burst(z.x, z.y - 20 * HS, 26, ['#ffb347', '#ff5a1f', '#fff'], 240, 6, .5); shake = Math.max(shake, 9); sfx('boom', { x: z.x, vol: .7 }); } catch (e) {}
    const me = ents[0]; if (!me.dead && me.ghostT <= 0 && Math.hypot(me.x - z.x, me.y - z.y) < R + 10) { const sv0 = SRC; SRC = 'horde'; try { damage(me, z.boomD, (me.x - z.x) * 4, (me.y - z.y) * 4, '#ffb347'); } finally { SRC = sv0; } }
    try { for (const c of enemyCreatures(z.o)) if (c.e.x !== undefined && Math.hypot(c.e.x - z.x, c.e.y - z.y) < R) hurtCreature(c.e, c.k, z.boomD, 'fire'); } catch (e) {}
    hurtZ(z, 1e6, null, 'fire'); }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments);
      try { const s = sv(); if (s) { const me = ents[0], fo = ents[1]; fo.svAnchor = 1; fo.petId = 'none'; fo.x = CX; fo.y = F.y0 - 300; me.x = CX; me.y = CY; me.petX = me.x - 30; me.petY = me.y + 8;
          s.t = 0; s.spT = 1.2; s.over = 0; s.pc = 0; s.pi = 0; s.P = null;
          if (s.pt) { const keep = M.foeLook; M.foeLook = s.pt.look || keep; try { s.P = mkWiz('foe'); } finally { M.foeLook = keep; } Object.assign(s.P, { x: CX - 44, y: CY + 26, petId: 'none', svPartner: 1, face: 1, me: false }); }
          hud(); } else { const h = $('svHud'); if (h) h.style.display = 'none'; } } catch (e) { try { window.logCrash && logCrash(e, 'svStart'); } catch (e2) {} }
      return r; }; }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const s = sv();
      if (s && typeof ents !== 'undefined' && ents && ents[1] && !ended && !(introT > 0)) { try { const me = ents[0], fo = ents[1], wave = Math.min(2, M.score.me), dur = s.endless ? Infinity : DUR[wave];
          s.t += dt; s.total += dt; const mobs = zombies.filter(z => z.svMob && z.hp > 0);
          // the anchor rides the nearest mob, so every ability aims at it; with nothing alive it waits off the field
          let near = null, nd = 1e9; for (const z of mobs) { if (z.rise < 1) continue; const d = Math.hypot(z.x - me.x, z.y - me.y); if (d < nd) { nd = d; near = z; } }
          if (near) { fo.x = near.x; fo.y = near.y; } else { fo.x = me.x; fo.y = me.y - 150 < F.y0 ? me.y + 150 : me.y - 150; } fo.vx = fo.vy = 0; fo.stunT = .5; fo.p = 0; fo.ghostT = 0; fo.svNear = near;
          fo.hp = fo.maxHp * (s.endless ? 1 : Math.max(.02, 1 - s.t / dur)); fo.lag = fo.hp; try { clock = s.endless ? 99 : Math.max(.5, dur - s.t); } catch (e) {}
          s.spT -= dt * (s.endless ? 1 : WAVE_MUL[wave]) * ramp(s.t); if (s.spT <= 0) { s.spT = 1.45 * rnd(.7, 1.3); if (mobs.length < CAP) { spawn(s, fo, me); if (s.t > 40 && Math.random() < .35) spawn(s, fo, me); } }
          if (!s.over && s.t >= dur && !me.dead) { s.over = 1; text(W / 2, H / 2, 'WAVE CLEARED', '#7dffa8', true); for (const z of mobs) hurtZ(z, 1e6, null, 'crush'); endRound('me', 900); }
        } catch (e) { try { window.logCrash && logCrash(e, 'svTick'); } catch (e2) {} } }
      const r = _u.apply(this, arguments);
      if (s && typeof ents !== 'undefined' && ents && ents[0]) { try { partner(s, dt); hud(); } catch (e) { try { window.logCrash && logCrash(e, 'svPartner'); } catch (e2) {} } }
      return r; }; }
  // a hit aimed at the anchor lands on the mob it is riding
  if (typeof damage === 'function') { const _d = damage; window.damage = damage = function (t, d) { if (t && t.svAnchor) { try { const z = t.svNear; if (z && z.hp > 0 && d > 0) hurtZ(z, d, null, 'hit'); } catch (e) {} return; } return _d.apply(this, arguments); }; }
  if (typeof drawWiz === 'function') { const _dw = drawWiz; window.drawWiz = drawWiz = function (w) { if (w && w.svAnchor) return; return _dw.apply(this, arguments); }; }
  if (typeof hurtZ === 'function') { const _hz = hurtZ; window.hurtZ = hurtZ = function (z) { const alive = z && z.svMob && z.hp > 0, r = _hz.apply(this, arguments); try { if (alive && z.hp <= 0) { const s = sv(); if (s && !s.over) s.kills++; } } catch (e) {} return r; }; }

  /* ---------------- the partner ---------------- */
  function partner(s, dt) { const Pw = s.P; if (!Pw || ended || introT > 0) return; const me = ents[0], fo = ents[1]; if (me.dead) return;
    // it keeps to your side, away from the nearest mob
    const ax = me.x - fo.x, ay = me.y - fo.y, ad = Math.hypot(ax, ay) || 1, tx = clamp(me.x + ax / ad * 30 - ay / ad * 34, F.x0 + 8, F.x1 - 8), ty = clamp(me.y + ay / ad * 30 + ax / ad * 34, F.y0 + 8, F.y1 - 8);
    Pw.vx = (tx - Pw.x) * 3; Pw.vy = (ty - Pw.y) * 3; Pw.x += Pw.vx * dt; Pw.y += Pw.vy * dt; Pw.t += dt; Pw.face = fo.x > Pw.x ? 1 : -1; Pw.recoil = Math.max(0, (Pw.recoil || 0) - dt); Pw.flash = 0;
    const hand = s.pt.hand, k = hand[s.pi % hand.length]; s.pc += dt; const need = (SP[k].t || 1.5) * 1.25;
    if (s.pc >= need && zombies.some(z => z.svMob && z.hp > 0 && z.rise >= 1)) { s.pc = 0; s.pi++;
      // the cast goes out from where the partner stands, under the player's name: its summons and shots are on your side
      const keep = { x: me.x, y: me.y, face: me.face, i: me.i, p: me.p, castN: me.castN, lastK: me.lastK, lv: me.lv[k] };
      try { me.x = Pw.x; me.y = Pw.y; me.face = Pw.face; if (!me.lv[k]) me.lv[k] = Math.max(1, Math.round(me.book.reduce((a, q) => a + (me.lv[q] || 1), 0) / Math.max(1, me.book.length))); cast(me, k); Pw.recoil = .25; }
      catch (e) {} finally { me.x = keep.x; me.y = keep.y; me.face = keep.face; me.i = keep.i; me.p = keep.p; me.castN = keep.castN; me.lastK = keep.lastK; if (keep.lv === undefined && !me.book.includes(k)) delete me.lv[k]; } } }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { const s = sv(); if (s && s.P && $('battle').classList.contains('on') && !(ents[0] && ents[0].dead && ended)) { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); drawWiz(s.P); x.restore(); } } catch (e) {}
      return r; }; }

  /* ---------------- battle HUD chip ---------------- */
  function hud() { const s = sv(), b = $('battle'); if (!b) return; let h = $('svHud'); if (!s) { if (h) h.style.display = 'none'; return; }
    if (!h) { b.insertAdjacentHTML('beforeend', '<div id="svHud"></div>'); h = $('svHud'); } const lives = Math.max(0, 3 - M.score.foe), wave = Math.min(2, M.score.me);
    const txt = `<b>${s.endless ? 'ENDLESS' : 'WAVE ' + (wave + 1) + ' / 3'}</b><span>${s.endless ? fmt(s.total) : fmt(Math.max(0, DUR[wave] - s.t))}</span><i>${'♥'.repeat(lives)}<u>${'♥'.repeat(3 - lives)}</u></i><em>+${Math.round((ramp(s.t) - 1) * 100)}%</em>`;
    if (h._t !== txt) { h._t = txt; h.innerHTML = txt; } h.style.display = ''; }

  /* ---------------- leaderboard ---------------- */
  if (typeof showRewards === 'function') { const _sr = showRewards; window.showRewards = showRewards = function () { const s = sv();
      try { if (s && !s.saved) { s.saved = 1; const B = best(); B.push({ m: s.endless ? 'endless' : 'waves', t: Math.round(s.total), w: s.endless ? 0 : M.score.me, k: s.kills, h: M.me.book.slice(0, 6), p: s.pt ? s.pt.n : '', d: Date.now() });
          B.sort((a, b) => (b.w - a.w) || (b.t - a.t)); const keep = []; const cnt = { waves: 0, endless: 0 }; for (const e of B) if (cnt[e.m]++ < 10) keep.push(e); PR.svBest = keep; save(); } } catch (e) {}
      // a survival run is not a duel: it leaves the win streak and the win/loss record alone, and has no rematch
      let stats0 = null; if (s) { try { stats0 = JSON.stringify(PR.stats || null); M._stkDone = 1; M._stk = null; } catch (e) {} }
      const r = _sr.apply(this, arguments);
      try { if (s && stats0) { PR.stats = JSON.parse(stats0); save(); const rm = $('rwRm'); if (rm) rm.remove(); document.querySelectorAll('#rewards .stknote').forEach(e => e.remove()); } } catch (e) {}
      try { if (s) { const el = $('rewards'), at = $('rwRow'); if (at && !el.querySelector('.sv-res')) at.insertAdjacentHTML('beforebegin', `<div class="sv-res"><b>${s.endless ? 'Endless' : (M.score.me >= 3 ? 'All 3 waves survived' : 'Fell on wave ' + (Math.min(2, M.score.me) + 1))}</b><span>${fmt(s.total)} survived · ${s.kills} defeated</span></div>`); } } catch (e) {}
      return r; }; }

  /* ---------------- the Fight Club tab ---------------- */
  function panel() { const c = cfg(), D = decks(), Fv = favs(), B = best();
    const opt = (pt, pi, label, sub, ic) => `<button class="sv-opt ${c.pt === pt && (pt === 'none' || pt === 'random' || c.pi === pi) ? 'on' : ''}" onclick="svSet('pt','${pt}',${pi})">${ic || ''}<b>${label}</b><small>${sub}</small></button>`;
    const hand = h => `<span class="sv-h">${(h || []).map(k => ICON[k] ? `<img src="${ICON[k]}">` : '').join('')}</span>`;
    const rows = m => { const L = B.filter(e => e.m === m); return L.length ? L.map((e, i) => `<div class="sv-row"><i>${i + 1}</i><b>${m === 'waves' ? e.w + '/3 · ' : ''}${fmt(e.t)}</b>${hand(e.h)}<small>${e.k} defeated${e.p ? ' · with ' + esc(e.p) : ''}</small></div>`).join('') : '<div class="ssub" style="margin:4px 0">No runs yet.</div>'; };
    return `<div class="ssub">Mobs rise all around you. Their damage and numbers grow 5% every 10 seconds. You have 3 lives, and you draft between attempts with a bonus pick after a fall.</div>
      <div class="sv-modes"><button class="${c.mode === 'waves' ? 'on' : ''}" onclick="svSet('mode','waves')"><b>3 Waves</b><small>Survive 30s, 60s, 90s</small></button><button class="${c.mode === 'endless' ? 'on' : ''}" onclick="svSet('mode','endless')"><b>Endless</b><small>How long can you last?</small></button></div>
      <div class="lbl" style="margin-top:12px">Partner</div>
      <div class="sv-opts">${opt('none', 0, 'Solo', 'No partner')}${opt('random', 0, 'Random ally', 'An AI with a random hand')}
        ${D.map((d, i) => opt('deck', i, esc(d.n), 'Your saved hand ' + hand(usable(d.h)))).join('')}${Fv.map((b, i) => opt('fav', i, esc(b.n), 'Club favourite ' + hand(usable(b.hand)))).join('')}</div>
      <div class="ssub" style="margin:6px 0 0">A partner fights at your side and cannot be hurt. It uses only shots, summons and area abilities from its hand.</div>
      <button class="battle sv-go" onclick="svStart()"><span>SURVIVE</span><small>${c.mode === 'endless' ? 'Endless' : '3 waves'} · ${c.pt === 'none' ? 'solo' : 'with a partner'}</small></button>
      <div class="lbl" style="margin-top:14px">Best runs: 3 Waves</div>${rows('waves')}<div class="lbl" style="margin-top:12px">Best runs: Endless</div>${rows('endless')}<div style="height:30px"></div>`; }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  window.svSet = function (f, v, pi) { const c = cfg(); c[f] = v; if (f === 'pt') c.pi = pi || 0; try { save(); sfx('ui_click'); } catch (e) {} tabs(true); };
  window.svTab = function (t) { PR.clubTab = t; try { save(); sfx('ui_click'); } catch (e) {} if (t === 'sv') tabs(true); else { try { renderFriends(); } catch (e) {} tabs(true); } };
  function tabs(force) { const host = $('friends'); if (!host || !host.classList.contains('on')) return; const mc = host.querySelector('.mc'); if (!mc) return; const on = PR.clubTab === 'sv';
    if (!force && mc.querySelector('.sv-tabs') && !!mc.querySelector('.sv-panel') === on) return;
    const head = `<div class="sh">Fight Club</div><div class="sv-tabs"><button class="${on ? '' : 'on'}" onclick="svTab('club')">Bounties</button><button class="${on ? 'on' : ''}" onclick="svTab('sv')">Survival</button></div>`;
    if (on) { const y = mc.scrollTop; mc.innerHTML = head + `<div class="sv-panel">${panel()}</div>`; mc.scrollTop = force ? y : 0; }
    else if (!mc.querySelector('.sv-tabs')) { const sh = mc.querySelector('.sh'); if (sh) sh.insertAdjacentHTML('afterend', `<div class="sv-tabs"><button class="on" onclick="svTab('club')">Bounties</button><button onclick="svTab('sv')">Survival</button></div>`); } }
  setInterval(() => { try { tabs(false); } catch (e) {} }, 250);
  if (typeof nav === 'function') { const _n = nav; window.nav = nav = function (t) { const r = _n.apply(this, arguments); if (t === 'friends') { try { tabs(true); } catch (e) {} } return r; }; }

  const css = document.createElement('style');
  css.textContent = `
  #svHud{position:absolute;left:50%;top:152px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:9px;padding:5px 12px;border-radius:14px;border:2px solid #000;background:#171029;box-shadow:0 3px 0 #000;pointer-events:none;white-space:nowrap}
  #svHud b{font:13px 'Lilita One';font-weight:400;letter-spacing:.6px;color:#ffd45e}#svHud span{font:15px 'Lilita One';color:#fff;min-width:38px;text-align:center}#svHud i{font-style:normal;color:#ff5a6e;font-size:14px;letter-spacing:1px}#svHud i u{text-decoration:none;color:#ffffff2e}#svHud em{font:800 11px Nunito;font-style:normal;color:#ff9aa6}
  .sv-tabs{display:flex;gap:6px;background:#0007;border:2px solid #000;border-radius:14px;padding:4px;margin:6px 0 10px}.sv-tabs button{flex:1;font:15px 'Lilita One';letter-spacing:.3px;padding:8px 0;border-radius:10px;border:0;background:transparent;color:#b9a9e6}.sv-tabs button.on{background:linear-gradient(#4a3a80,#2b2050);color:#fff;box-shadow:0 2px 0 #000}
  .sv-modes{display:flex;gap:8px;margin-top:10px}.sv-modes button,.sv-opt{flex:1;display:flex;flex-direction:column;gap:2px;align-items:flex-start;text-align:left;padding:10px 12px;border-radius:14px;border:2px solid #000;background:#1a1236;color:#fff;box-shadow:0 3px 0 #000}
  .sv-modes b,.sv-opt b{font:15px 'Lilita One';font-weight:400;letter-spacing:.3px}.sv-modes small,.sv-opt small{font:800 11.5px Nunito;color:#b9a9e6;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.sv-modes button.on,.sv-opt.on{background:#3a2d66;outline:2px solid #ffd45e}
  .sv-opts{display:flex;flex-direction:column;gap:7px;margin-top:6px}.sv-opt{flex:none;width:100%}.sv-h{display:inline-flex;gap:3px}.sv-h img{width:22px;height:22px;border-radius:6px;border:1.5px solid #000}
  .sv-go{margin-top:12px;width:100%}.sv-row{display:flex;align-items:center;gap:8px;padding:7px 10px;margin-top:6px;border-radius:12px;border:2px solid #000;background:#1a1236;flex-wrap:wrap}.sv-row i{font:14px 'Lilita One';font-style:normal;color:#ffd45e;width:16px}.sv-row b{font:15px 'Lilita One';font-weight:400;color:#fff}.sv-row small{font:800 11px Nunito;color:#b9a9e6;flex:1 1 100%;margin-left:24px}
  .sv-res{margin:10px auto;padding:9px 14px;max-width:340px;border-radius:14px;border:2px solid #000;background:#171029;text-align:center;box-shadow:0 3px 0 #000}.sv-res b{display:block;font:17px 'Lilita One';font-weight:400;color:#ffd45e}.sv-res span{font:800 12.5px Nunito;color:#e6defc}`;
  document.head.appendChild(css);
  window.SURVIVAL = { MOBS, ramp, best };
})();
