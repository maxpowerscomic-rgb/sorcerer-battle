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
    runner: { id: 'rabbit', n: 'Skitter', e: '🐇', sz: .6, spd: 2.1, hp: 8, dmg: 3, acd: .45, path: 'line', hue: 290 },
    brute: { id: 'ox', n: 'Hulk', e: '🐂', sz: 1.45, spd: .55, hp: 130, dmg: 12, acd: 1.1, path: 'line', hue: 105 },
    bomber: { id: 'rooster', n: 'Burster', e: '🐓', sz: .8, spd: 1.5, hp: 10, dmg: 0, acd: .2, path: 'line', hue: 130, boom: 16 },
  };
  for (const k in MOBS) MOBS[k].mob = k;
  const sv = () => (typeof M !== 'undefined' && M && M.sv) || null;
  const ramp = t => 1 + .05 * Math.floor(t / 10);
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const cfg = () => { const c = (PR.svCfg = PR.svCfg || { mode: 'waves', pt: 'none', pi: 0 }); if (!KINDS[c.kind]) c.kind = 'zodiac'; return c; };
  // (1.0.25) what you are surviving: shadow beasts, a zombie horde, or enemy casters with 25 health and one random ability per wave number
  const KINDS = { zodiac: ['Zodiac', 'Shadow beasts of four kinds'], zombie: ['Zombies', 'More and more of the dead'], wiz: ['Wizards', 'Casters, 25 health, 1 spell each (2 on wave 2, 3 on wave 3)'], sorc: ['Sorcerers', 'Casters, 25 health, 1 technique each (2 on wave 2, 3 on wave 3)'], mixed: ['Mixed', 'Wizards and sorcerers together'] };
  const isCast = k => k === 'wiz' || k === 'sorc' || k === 'mixed';
  // (1.0.26) the enemy improves too: one of these after every wave you clear (and every 45 seconds in Endless)
  const HUPS = { swift: ['Swift', 'they move 25% faster'], tough: ['Tough', 'they have 35% more health'], vicious: ['Vicious', 'they hit 30% harder'], swarm: ['Swarming', 'they arrive 25% faster'] };
  const hn = (s, id) => (s.hu || []).filter(q => q === id).length, hmul = (s, id, per) => Math.pow(1 + per, hn(s, id));
  function hGain(s) { s.hu = s.hu || []; const ids = Object.keys(HUPS), id = ids[Math.random() * ids.length | 0]; s.hu.push(id); s.huNew = id; return id; }
  const ZUPS = ['frenzy', 'grip', 'clawed'];   // zombie hordes also pick up the zombies' own upgrades, one per wave
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
    const un = typeof unlockedSpells === 'function' ? unlockedSpells() : PR.hand, avg = Math.max(1, Math.round(un.reduce((a, k) => a + ((PR.spells[k] && PR.spells[k].lvl) || 1), 0) / Math.max(1, un.length)));
    newMatch({ mode: 'casual', name: 'The Horde', survival: 1, lv: Object.fromEntries(Object.keys(SP).map(k => [k, avg])) }); if (typeof M === 'undefined' || !M) return;
    if (pt) { pt.up = new Set(); pt.log = []; pt.hand = pt.hand.slice(0, 4); }
    M.sv = { kind: c.kind, endless: c.mode === 'endless', total: 0, t: 0, kills: 0, pt, group: 0, hand0: PR.hand.slice() }; M.rival = null; M.foeName = pt ? pt.n : 'The Horde'; if (pt && pt.look) M.foeLook = pt.look; try { WIN = 3; } catch (e) {} };

  /* ---------------- the round ---------------- */
  // (1.0.28) enemies come in from off screen: a point just outside one of the four edges
  const edge = () => { const sd = Math.random() * 4 | 0, m = 46; return sd === 0 ? { x: rnd(F.x0, F.x1), y: F.y0 - m - 30 } : sd === 1 ? { x: rnd(F.x0, F.x1), y: F.y1 + m } : sd === 2 ? { x: F.x0 - m - 20, y: rnd(F.y0, F.y1) } : { x: F.x1 + m + 20, y: rnd(F.y0, F.y1) }; };
  const spot = () => edge();
  function spawnZombie(s, fo, me, at) { const wave = s.endless ? 0 : Math.min(2, M.score.me), q = at ? { x: at.x + rnd(-14, 14), y: at.y + rnd(-14, 14) } : spot(me);
    const hm = s.endless ? 1 + s.t / 70 : WAVE_MUL[wave], dm = (s.endless ? 1 : WAVE_MUL[wave]) * ramp(s.t), hp = 18 * hm;
    const hp2 = hp * hmul(s, 'tough', .35); zombies.push({ o: fo, x: q.x, y: q.y, mx: hp2, hp: hp2, rise: 1, cd: rnd(0, .5), t: rnd(0, 9), flash: 0, lunge: 0, svMob: 1, dmg: 6 * dm * hmul(s, 'vicious', .3), spd: rnd(1.05, 1.6) * hmul(s, 'swift', .25) }); }
  function spawnCaster(s, fo, me) { const wave = s.endless ? Math.min(2, Math.floor(s.t / 45)) : Math.min(2, M.score.me), q = spot(me);
    const cls = s.kind === 'mixed' ? (Math.random() < .5 ? 'wiz' : 'sorc') : s.kind, pool = Object.keys(SP).filter(k => !SELF.has(k) && !(window.VARIANTS && VARIANTS[k]) && typeof SCHOOL_OF === 'function' && SCHOOL_OF(k) === cls && TYPE_OF[k] && ICON[k]).sort(() => Math.random() - .5), book = pool.slice(0, wave + 1); if (!book.length) return;
    const look = Object.assign(typeof randomLook === 'function' ? randomLook() : {}, { cls, pet: 'none' }), keep = M.foeLook; let wz; M.foeLook = look; try { wz = mkWiz('foe'); } finally { M.foeLook = keep; } Object.assign(wz, { petId: 'none', svSprite: 1, t: rnd(0, 9) });
    const hp = 25 * (s.endless ? 1 + s.t / 90 : 1) * hmul(s, 'tough', .35);
    const cup = new Set(); { const opts = []; for (const k of book) for (const u of (UPG[k] || [])) if (!u.sig && !u.req) opts.push(k + '.' + u.id); opts.sort(() => Math.random() - .5); for (const u of opts.slice(0, (s.hu || []).length)) cup.add(u); }   // one upgrade for its abilities per wave cleared
    zombies.push({ o: fo, x: q.x, y: q.y, mx: hp, hp, rise: 1, cd: 9, t: rnd(0, 9), flash: 0, lunge: 0, svMob: 1, svCaster: { wz, book, up: cup, i: 0, c: rnd(.4, 1.6), hx: q.x, hy: q.y, sp: hmul(s, 'swift', .25), dm: (s.endless ? 1 : WAVE_MUL[wave]) * ramp(s.t) * hmul(s, 'vicious', .3) }, dmg: .01, spd: .01, noFx: 1 });
  }
  function spawn(s, fo, me) { if (s.kind === 'zombie') return spawnZombie(s, fo, me); if (isCast(s.kind)) return spawnCaster(s, fo, me); const wave = s.endless ? 0 : Math.min(2, M.score.me), t = s.t, r = Math.random();
    let kind = 'walker'; const late = s.endless ? t > 20 : (wave > 0 || t > 18);
    if (r < .22 && t > 6) kind = 'runner'; else if (r < .38 && late) kind = 'bomber'; else if (r < .47 && (s.endless ? t > 35 : (wave > 0 || t > 24))) kind = 'brute';
    const b = MOBS[kind], q = spot(me);
    const hm = (s.endless ? 1 + t / 70 : WAVE_MUL[wave]) * hmul(s, 'tough', .35), dm = (s.endless ? 1 : WAVE_MUL[wave]) * ramp(t) * hmul(s, 'vicious', .3), hp = b.hp * hm;
    zombies.push({ o: fo, x: q.x, y: q.y, mx: hp, hp, rise: 1, cd: rnd(.1, .4), t: rnd(0, 9), flash: 0, lunge: 0, beast: b, hue: b.hue, spd: b.spd * hmul(s, 'swift', .25), dmg: Math.max(.01, b.dmg * dm), acd: b.acd, svMob: 1, boomD: b.boom ? b.boom * dm : 0, onHit: b.boom ? boom : null });
  }
  function boom(z, tgt, kind) { if (z.hp <= 0) return; const R = 46; try { inkRing(z.x, z.y, '#ff7a2a', 3, 10, R * 1.3, .5); burst(z.x, z.y - 20 * HS, 26, ['#ffb347', '#ff5a1f', '#fff'], 240, 6, .5); shake = Math.max(shake, 9); sfx('boom', { x: z.x, vol: .7 }); } catch (e) {}
    const me = ents[0]; if (!me.dead && me.ghostT <= 0 && Math.hypot(me.x - z.x, me.y - z.y) < R + 10) { const sv0 = SRC; SRC = 'horde'; try { damage(me, z.boomD, (me.x - z.x) * 4, (me.y - z.y) * 4, '#ffb347'); } finally { SRC = sv0; } }
    try { for (const c of enemyCreatures(z.o)) if (c.e.x !== undefined && Math.hypot(c.e.x - z.x, c.e.y - z.y) < R) hurtCreature(c.e, c.k, z.boomD, 'fire'); } catch (e) {}
    hurtZ(z, 1e6, null, 'fire'); }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments);
      try { const s = sv(); if (s) { const me = ents[0], fo = ents[1]; fo.svAnchor = 1; fo.petId = 'none'; fo.x = CX; fo.y = F.y0 - 300; me.x = CX; me.y = CY; me.petX = me.x - 30; me.petY = me.y + 8;
          if (M.tgtNow === undefined || M.tgtNow === 'caster') M.tgtNow = 'near'; try { V123.tgHud(); } catch (e) {}   /* in Survival you aim at whatever is nearest by default, and there is no enemy caster to pick */
          s.t = 0; s.spT = 1.2; s.over = 0; s.seen = new Set(); s.drops = []; s.hearts = [];
          if (s.boon && s.boon.hp) { me.maxHp += s.boon.hp; me.hp = me.maxHp; } s.huE = 0; s.grpT = undefined; s.pts = null;
          s.hu = s.hu || []; if (!s.endless) { while (s.hu.length < M.score.me) hGain(s); }
          if (s.kind === 'zombie') fo.up = new Set(ZUPS.slice(0, s.endless ? 0 : M.score.me).map(u => 'zombies.' + u));
          if (s.hu.length) setTimeout(() => { try { if (!ended) text(W / 2, H / 2 - 60, 'ENEMY: ' + [...new Set(s.hu)].map(id => HUPS[id][0] + (hn(s, id) > 1 ? ' x' + hn(s, id) : '')).join(', ').toUpperCase(), '#ff9aa6', true); } catch (e) {} }, 1700); s.pc = 0; s.pi = 0; s.P = null;
          if (s.pt) { const keep = M.foeLook; M.foeLook = s.pt.look || keep; try { s.P = mkWiz('foe'); } finally { M.foeLook = keep; } Object.assign(s.P, { x: CX - 60, y: CY + 40, petId: 'none', svPartner: 1, face: 1, me: false, hp: 150 + ((s.boon && s.boon.hp) || 0), maxHp: 150 + ((s.boon && s.boon.hp) || 0), dead: 0 }); if (s.dueDraft) { s.dueDraft = 0; } }
          try { const bar = $('hpF') && $('hpF').parentElement; if (bar) bar.style.visibility = s.pt ? '' : 'hidden'; const n = $('hpnF'); if (n) n.style.visibility = s.pt ? '' : 'hidden'; } catch (e) {} groupBtn();
          // (1.0.30) the top bar shows your partner's actual hand, not hidden question marks; solo, it is empty
          try { const q = $('qF'); if (q) q.innerHTML = s.pt ? s.pt.hand.map(k => `<div class="qi rev" onclick="tipFromQueue(this,'${k}','foe')"><img src="${ICON[k]}"></div>`).join('') : ''; } catch (e) {}
          hud(); } else { const h = $('svHud'); if (h) h.style.display = 'none'; const g = $('svGroup'); if (g) g.style.display = 'none'; try { const bar = $('hpF') && $('hpF').parentElement; if (bar) bar.style.visibility = ''; const n = $('hpnF'); if (n) n.style.visibility = ''; } catch (e2) {} } } catch (e) { try { window.logCrash && logCrash(e, 'svStart'); } catch (e2) {} }
      return r; }; }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const s = sv();
      if (s && typeof ents !== 'undefined' && ents && ents[1] && !ended && !(introT > 0)) { try { const me = ents[0], fo = ents[1], wave = Math.min(2, M.score.me), dur = s.endless ? Infinity : DUR[wave];
          s.t += dt; s.total += dt; const mobs = zombies.filter(z => z.svMob && z.hp > 0);
          s.seen = s.seen || new Set(); for (const z of s.seen) if (z.hp <= 0) { s.seen.delete(z); s.kills++; if (s.endless) dropRoll(s, z); heartRoll(s, z); }
          dropTick(s, me, dt); heartTick(s, dt); for (const z of mobs) s.seen.add(z);
          // the anchor rides the nearest mob, so every ability aims at it; with nothing alive it waits off the field
          let near = null, nd = 1e9; for (const z of mobs) { if (z.rise < 1) continue; const d = Math.hypot(z.x - me.x, z.y - me.y); if (d < nd) { nd = d; near = z; } }
          if (near) { fo.x = near.x; fo.y = near.y; } else { fo.x = me.x; fo.y = me.y - 150 < F.y0 ? me.y + 150 : me.y - 150; } fo.vx = fo.vy = 0; fo.stunT = .5; fo._immSaid = T; fo.p = 0; fo.ghostT = 0; fo.svNear = near;
          fo.hp = fo.maxHp; fo.lag = fo.hp;   /* the top bar is the partner's health; solo, it is hidden */ try { clock = s.endless ? 99 : Math.max(.5, dur - s.t); } catch (e) {}
          s.spT -= dt * (s.endless ? 1 : WAVE_MUL[wave]) * ramp(s.t) * hmul(s, 'swarm', .25);
          if (s.endless && s.t > 45 * ((s.huE || 0) + 1)) { s.huE = (s.huE || 0) + 1; const id = hGain(s); text(W / 2, H / 2 - 40, 'THE ENEMY GROWS: ' + HUPS[id][0].toUpperCase(), '#ff9aa6', true); } if (isCast(s.kind)) {   // casters arrive in groups: 2, 4 or 6 to open the wave, then a fresh group every 30 seconds (or sooner if none are left)
            const size = s.endless ? 2 + Math.floor(s.t / 30) : [2, 4, 6][wave], again = s.endless ? Math.min(6, 2 + Math.floor(s.t / 30)) : [2, 3, 4][wave];
            if (s.grpT === undefined) { s.grpT = 30; for (let i = 0; i < Math.min(8, size); i++) spawnCaster(s, fo, me); }
            s.grpT -= dt * hmul(s, 'swarm', .25); if (!mobs.length && s.grpT > 3) s.grpT = 3;
            if (s.grpT <= 0) { s.grpT = 30; for (let i = 0; i < again && mobs.length + i < (s.endless ? 16 : 9); i++) spawnCaster(s, fo, me); } }
          else if (s.kind === 'zombie') {   // zombies pour in from spawn points at the edges: more points each wave, and one more every 8 seconds in Endless. Never more than 25 on the field.
            s.pts = s.pts || []; const want = s.endless ? Math.min(24, 3 + Math.floor(s.t / 5)) /* (1.0.32.4) Endless: a new spawn point every 5 s, up to 24 */ : 2 + wave;   /* 2, 3 then 4 spawn points */ while (s.pts.length < want) { const e = edge(); e.c = rnd(.2, 1.6); s.pts.push(e); }
            for (const pt of s.pts) { pt.c -= dt * ramp(s.t) * hmul(s, 'swarm', .25); if (pt.c <= 0) { pt.c = rnd(1.3, 2.1); if (mobs.length < (s.endless ? 50 : 25)) { spawnZombie(s, fo, me, pt); mobs.push(0); } } } }
          else if (s.spT <= 0) { s.spT = 1.45 * rnd(.7, 1.3) * (s.endless ? .6 : 1); if (mobs.length < (s.endless ? 50 : 25)) { spawn(s, fo, me); if (s.t > 40 && Math.random() < .35) spawn(s, fo, me); } }
          casters(s, fo, me, dt);
          if (!s.over && s.t >= dur && !me.dead) { s.over = 1; text(W / 2, H / 2, 'WAVE CLEARED', '#7dffa8', true); for (const z of mobs) hurtZ(z, 1e6, null, 'crush'); endRound('me', 900); }
        } catch (e) { try { window.logCrash && logCrash(e, 'svTick'); } catch (e2) {} } }
      if (s && s.P && !s.P.dead && typeof zombies !== 'undefined') for (const z of zombies) if (z.svMob) { z._px = z.x; z._py = z.y; }
      const r = _u.apply(this, arguments);
      if (s && typeof ents !== 'undefined' && ents && ents[0]) { try { partner(s, dt); hud(); } catch (e) { try { window.logCrash && logCrash(e, 'svPartner'); } catch (e2) {} } }
      return r; }; }
  // a hit aimed at the anchor lands on the mob it is riding
  if (typeof damage === 'function') { const _d = damage; window.damage = damage = function (t, d) { { const s0 = sv(); if (s0 && s0.castAtP && t && t.me && d > 0) { phurt(s0, d); return; } } if (t && t.svAnchor) { try { const z = t.svNear; if (z && z.hp > 0 && d > 0) hurtZ(z, d, null, 'hit'); } catch (e) {} return; } return _d.apply(this, arguments); }; }
  if (typeof drawWiz === 'function') { const _dw = drawWiz; window.drawWiz = drawWiz = function (w) { if (w && w.svAnchor) return; return _dw.apply(this, arguments); }; }
  if (typeof kill === 'function') { const _k = kill; window.kill = kill = function (w) { if (w && w.svAnchor) { w.hp = w.maxHp; return; } return _k.apply(this, arguments); }; }   // nothing can end a wave by "killing" the anchor

  /* ---------------- (1.0.32.2) Endless: upgrade drops ----------------
     A defeated enemy may drop an upgrade crystal: 15% a basic upgrade, 10% a tier 2 upgrade, 5% a signature (tier 3) upgrade.
     It floats to you; touching it pauses the run and offers three upgrades of that tier for abilities in your hand. Your partner takes one of the same tier.
     So the run is not one long menu: one crystal at a time, and none for 12 seconds after a pick. */
  const DTIER = [null, ['Upgrade', '#bfe6ff', '#3b9bff'], ['Tier 2 upgrade', '#ffc27a', '#e0661a'], ['Signature upgrade', '#ffe27a', '#c9861a']];
  // (1.0.32.5) hearts for your partner: 6% of defeats drop one (two on the field at most, each lasts 15 s). A hurt partner walks over and picks it up for 20% of its health.
  function heartRoll(s, z) { if (!s.P) return; s.hearts = s.hearts || []; if (s.hearts.length >= 2 || Math.random() >= .06) return; s.hearts.push({ x: clamp(z.x, F.x0 + 10, F.x1 - 10), y: clamp(z.y, F.y0 + 10, F.y1 - 10), t: 0 }); }
  function heartTick(s, dt) { if (!s.hearts || !s.hearts.length) return; for (const h of s.hearts) h.t += dt; const Pw = s.P;
    if (Pw && !Pw.dead) for (const h of s.hearts) if (!h.got && Math.hypot(Pw.x - h.x, Pw.y - h.y) < 18) { h.got = 1; const g = Math.min(Pw.maxHp - Pw.hp, Pw.maxHp * .2); Pw.hp += g; try { text(Pw.x, Pw.y - 90 * HS, '+' + Math.round(g), '#7dffa8', true); burst(h.x, h.y - 20 * HS, 16, ['#ff5a6e', '#ffffff', '#7dffa8'], 150, 4, .45); sfx('ui_coin', { rate: 1.3 }); } catch (e) {} }
    s.hearts = s.hearts.filter(h => !h.got && h.t < 15); }
  function dropRoll(s, z) { s.drops = s.drops || []; if (s.drops.length || T - (s.lastDraft || -99) < 12) return; const r = Math.random(), tier = r < .05 ? 3 : r < .15 ? 2 : r < .30 ? 1 : 0; if (!tier) return;
    s.drops.push({ x: clamp(z.x, F.x0 + 10, F.x1 - 10), y: clamp(z.y, F.y0 + 10, F.y1 - 10), t: 0, tier }); try { burst(z.x, z.y - 20 * HS, 14, [DTIER[tier][1], '#ffffff'], 160, 4, .45); sfx('ui_deal', { x: z.x, rate: 1.4 }); } catch (e) {} }
  function dropTick(s, me, dt) { for (const d of (s.drops || [])) { d.t += dt; if (d.t > .7) { const dx = me.x - d.x, dy = me.y - d.y, dd = Math.hypot(dx, dy) || 1, sp = Math.min(420, 140 + d.t * 220); d.x += dx / dd * Math.min(dd, sp * dt); d.y += dy / dd * Math.min(dd, sp * dt); if (dd < 18 && !paused) { s.drops = s.drops.filter(q => q !== d); openDrop(s, d.tier); return; } } } }
  const tierFits = (u, k, have, tier) => { if (have.has(k + '.' + u.id)) return false; const reqOk = !u.req || have.has(k + '.' + u.req); if (!reqOk) return false; return tier === 3 ? !!u.sig : tier === 2 ? !u.sig && (!!u.req || !!u.rare) : !u.sig && !u.req && !u.rare; };
  function optionsFor(hand, have, tier) { for (let t = tier; t >= 1; t--) { const L = []; for (const k of new Set(hand)) for (const u of (UPG[k] || [])) if (tierFits(u, k, have, t)) L.push({ k, u, t }); if (L.length) return L.sort(() => Math.random() - .5); } return []; }
  function openDrop(s, tier) { const down = s.P && s.P.dead; let ops = optionsFor(M.me.book, M.me.up, tier).slice(0, down ? 2 : 3);
    if (!ops.length && !down) return openBoons(s, tier);
    if (down) ops = ops.concat([{ revive: 1, t: tier }]);   // (1.0.32.5) your partner is down: one choice brings it back at 25% health
    paused = true; s.dropOps = ops; const b = $('battle'); let el = $('svDrop'); if (!el) { b.insertAdjacentHTML('beforeend', '<div id="svDrop"></div>'); el = $('svDrop'); } const t0 = ops[0].t, tt = DTIER[t0];
    el.innerHTML = `<div class="svd-box"><div class="svd-h" style="--a:${tt[1]};--b:${tt[2]}">${tt[0]}</div><div class="svd-l">${ops.map((o, i) => o.revive ? `<button onclick="svDropPick(${i})"><span class="svd-bi" style="color:#ff7a8a">♥</span><span><b>Revive ${esc(s.pt.n)}</b><em>Bring your partner back with 25% health.</em></span></button>` : `<button onclick="svDropPick(${i})"><img src="${ICON[o.k]}"><span><b>${esc(o.u.n)}</b><small>${esc(SP[o.k].n)}</small><em>${esc(o.u.d)}</em></span></button>`).join('')}</div></div>`;
    el.style.display = 'grid'; try { sfx('ui_unlock'); } catch (e) {} }
  // (1.0.32.3) when your hand has no upgrades left at any tier, the crystal offers run boons instead; a bigger crystal gives a bigger boon
  const BOONS = [['dmg', 'Sharpened', 'Your side deals {v}% more damage to enemies for the rest of the run.', [5, 8, 12]], ['cs', 'Quickened', 'You cast {v}% faster for the rest of the run.', [6, 9, 13]], ['hp', 'Hardy', '+{v} max health for you and your partner, and heals that much now.', [12, 18, 26]]];
  function openBoons(s, tier) { paused = true; s.boonTier = tier; s.dropOps = null; const b = $('battle'); let el = $('svDrop'); if (!el) { b.insertAdjacentHTML('beforeend', '<div id="svDrop"></div>'); el = $('svDrop'); } const tt = DTIER[tier];
    if (s.P && s.P.dead) { s.dropOps = [{ revive: 1, t: tier }]; }
    el.innerHTML = `<div class="svd-box"><div class="svd-h" style="--a:${tt[1]};--b:${tt[2]}">Boon</div><div class="ssub" style="margin:0 0 8px;text-align:center">Every upgrade for your hand is taken. Choose a boon instead.</div><div class="svd-l">${BOONS.map((q, i) => `<button onclick="svBoon(${i})"><span class="svd-bi">${['⚔', '⚡', '♥'][i]}</span><span><b>${q[1]} +${q[3][tier - 1]}${q[0] === 'hp' ? '' : '%'}</b><em>${q[2].replace('{v}', q[3][tier - 1])}</em></span></button>`).join('')}${s.P && s.P.dead ? `<button onclick="svDropPick(0)"><span class="svd-bi" style="color:#ff7a8a">♥</span><span><b>Revive ${esc(s.pt.n)}</b><em>Bring your partner back with 25% health.</em></span></button>` : ''}</div></div>`;
    el.style.display = 'grid'; try { sfx('ui_unlock'); } catch (e) {} }
  window.svBoon = function (i) { const s = sv(); if (!s) return; const q = BOONS[i], v = q[3][(s.boonTier || 1) - 1]; s.boon = s.boon || { dmg: 0, cs: 0, hp: 0 }; s.boon[q[0]] += v;
    if (q[0] === 'hp') { const me = ents[0]; me.maxHp += v; me.hp = Math.min(me.maxHp, me.hp + v); if (s.P && !s.P.dead) { s.P.maxHp += v; s.P.hp = Math.min(s.P.maxHp, s.P.hp + v); } }
    s.lastDraft = T; const el = $('svDrop'); if (el) el.style.display = 'none'; paused = false; try { last = performance.now(); } catch (e) {}
    try { text(ents[0].x, ents[0].y - 100 * HS, (q[1] + ' +' + v + (q[0] === 'hp' ? '' : '%')).toUpperCase(), DTIER[s.boonTier || 1][1], true); sfx('ui_pick'); } catch (e) {}
    try { if (s.P && !s.P.dead && window.emoteSay) emoteSay(s.P, null, q[0] === 'hp' ? 'Feeling sturdier already!' : q[0] === 'dmg' ? 'Let\'s hit them harder!' : 'Faster it is!'); } catch (e) {} };
  // boons apply for the rest of the run: damage to the horde, your cast speed, and health carried into each attempt
  if (typeof hurtZ === 'function') { const _hzB = hurtZ; window.hurtZ = hurtZ = function (z, d) { try { const s = sv(); if (s && s.boon && s.boon.dmg && z && z.svMob && d > 0 && d < 1e5) arguments[1] = d * (1 + s.boon.dmg / 100); } catch (e) {} return _hzB.apply(this, arguments); }; }
  if (typeof castT === 'function') { const _ct = castT; window.castT = castT = function (w) { const t = _ct.apply(this, arguments); try { const s = sv(); if (s && s.boon && s.boon.cs && w && w.me) return t / (1 + s.boon.cs / 100); } catch (e) {} return t; }; }
  window.svDropPick = function (i) { const s = sv(); if (!s || !s.dropOps) return; const o = s.dropOps[i]; if (!o) return;
    if (o.revive) { const Pw = s.P, me = ents[0]; s.dropOps = null; s.lastDraft = T; const el0 = $('svDrop'); if (el0) el0.style.display = 'none'; paused = false; try { last = performance.now(); } catch (e) {}
      if (Pw) { Pw.dead = 0; Pw.hp = Pw.maxHp * .25; Pw.x = clamp(me.x - 40, F.x0 + 10, F.x1 - 10); Pw.y = clamp(me.y + 20, F.y0 + 10, F.y1 - 10); try { burst(Pw.x, Pw.y - 40 * HS, 30, ['#7dffa8', '#ffffff', '#ffd45e'], 220, 5, .6); text(Pw.x, Pw.y - 100 * HS, 'REVIVED', '#7dffa8', true); sfx('ui_unlock'); if (window.emoteSay) setTimeout(() => { try { if (!ended) emoteSay(Pw, null, 'Back on my feet. Thanks!'); } catch (e) {} }, 300); } catch (e) {} }
      return; }
    M.me.up.add(o.k + '.' + o.u.id); s.dropOps = null; s.lastDraft = T; const el = $('svDrop'); if (el) el.style.display = 'none'; paused = false; try { last = performance.now(); } catch (e) {}
    try { text(ents[0].x, ents[0].y - 100 * HS, o.u.n.toUpperCase(), DTIER[o.t][1], true); sfx('ui_pick'); } catch (e) {}
    if (s.pt) { const po = optionsFor(s.pt.hand, s.pt.up, o.t); if (po.length) { const q = po[0]; s.pt.up.add(q.k + '.' + q.u.id); s.pt.log.push({ k: q.k, n: q.u.n, t: SP[q.k].n + ' upgrade' });
        // (1.0.32.3) your partner says what it took, in a speech bubble over its head
        const LINES = ['I\'ll take {u}!', '{u} for me!', 'Ooh, {u}. Mine!', 'Grabbing {u}.', '{u}. Let\'s go!'];
        try { if (s.P && !s.P.dead && window.emoteSay) emoteSay(s.P, null, LINES[Math.random() * LINES.length | 0].replace('{u}', q.u.n)); else toast(`${s.pt.n} took ${q.u.n}`); } catch (e) {} } } };
  function drawHearts(s) { if (!s.hearts || !s.hearts.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const h of s.hearts) { const fade = h.t > 12 ? (Math.sin(h.t * 18) > 0 ? 1 : .35) : 1, bob = Math.sin(h.t * 5) * 2.5, cx = h.x, cy = h.y - 18 * HS + bob; x.globalAlpha = fade; x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(cx, cy, 2, cx, cy, 18); g.addColorStop(0, 'rgba(255,90,110,.75)'); g.addColorStop(1, 'rgba(255,90,110,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 18, 0, 7); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#ff4a5e'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, cy + 7); x.bezierCurveTo(cx - 11, cy - 1, cx - 7, cy - 10, cx, cy - 4); x.bezierCurveTo(cx + 7, cy - 10, cx + 11, cy - 1, cx, cy + 7); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffffff'; x.globalAlpha = fade * .8; x.beginPath(); x.arc(cx - 4, cy - 4, 1.8, 0, 7); x.fill(); }
    x.restore(); }
  function drawDrops() { const s = sv(); if (s) drawHearts(s); if (!s || !s.drops || !s.drops.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const d of s.drops) { const tt = DTIER[d.tier], bob = Math.sin(d.t * 6) * 3, y = d.y - 24 * HS + bob; x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(d.x, y, 2, d.x, y, 22); g.addColorStop(0, tt[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(d.x, y, 22, 0, 7); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = tt[1]; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(d.x, y - 10); x.lineTo(d.x + 7, y); x.lineTo(d.x, y + 10); x.lineTo(d.x - 7, y); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffffff'; x.globalAlpha = .7; x.beginPath(); x.moveTo(d.x - 2, y - 6); x.lineTo(d.x + 2, y - 1); x.lineTo(d.x - 3, y + 1); x.closePath(); x.fill(); x.globalAlpha = 1; }
    x.restore(); }

  /* ---------------- enemy casters ---------------- */
  // each one stands off at range and casts its own small hand; the cast goes out through the anchor from where the caster stands
  function casters(s, fo, me, dt) { for (const z of zombies) { const c = z.svCaster; if (!c || z.hp <= 0) continue; const wz = c.wz;
      const dx = me.x - c.hx, dy = me.y - c.hy, d = Math.hypot(dx, dy) || 1, want = 150, mv = (d > want + 25 ? 1 : d < want - 35 ? -1 : 0) * 34 * (c.sp || 1) * dt;
      const out = c.hx < F.x0 + 6 || c.hx > F.x1 - 6 || c.hy < F.y0 + 6 || c.hy > F.y1 - 6;
      if (out && !(z.frozen > 0) && !(z.stun > 0)) { const ix = CX - c.hx, iy = CY - c.hy, id = Math.hypot(ix, iy) || 1, st = 46 * (c.sp || 1) * dt; c.hx += ix / id * st; c.hy += iy / id * st; }   // still walking in from off screen
      else if (mv && !(z.frozen > 0) && !(z.stun > 0)) { const q = (window.TECHX && TECHX.inArena) ? TECHX.inArena(c.hx + dx / d * mv, c.hy + dy / d * mv) : { x: c.hx + dx / d * mv, y: c.hy + dy / d * mv }; c.hx = q.x; c.hy = q.y; }
      z.x = c.hx; z.y = c.hy; z.cd = 9; wz.x = z.x; wz.y = z.y; wz.vx = mv ? dx / d * 30 * Math.sign(mv) : 0; wz.vy = 0; wz.t += dt; wz.face = me.x > z.x ? 1 : -1; wz.flash = z.flash; wz.recoil = Math.max(0, (wz.recoil || 0) - dt);
      if (z.frozen > 0 || z.stun > 0 || me.dead || out) continue; const k = c.book[c.i % c.book.length]; c.c -= dt; wz.book = c.book; wz.i = c.i % c.book.length; wz.p = Math.max(0, 1 - c.c);
      if (c.c <= 0) { c.c = (SP[k].t || 1.5) * 1.7 + rnd(.3, 1.2); c.i++; const keep = { x: fo.x, y: fo.y, face: fo.face, lv: fo.lv, up: fo.up, i: fo.i, p: fo.p, castN: fo.castN, lastK: fo.lastK }, sc = window.CLONE_SCALE;
        // it picks you or your partner at random; aimed at the partner, the cast is thrown at where it stands and what would have struck you strikes it
        const Pw = s.P && !s.P.dead ? s.P : null, atP = Pw && Math.random() < .5, mk = { x: me.x, y: me.y };
        try { fo.x = z.x; fo.y = z.y; fo.face = wz.face; fo.up = c.up || NOUP; window.CLONE_SCALE = .75 * c.dm; if (atP) { me.x = Pw.x; me.y = Pw.y; s.castAtP = 1; wz.face = Pw.x > z.x ? 1 : -1; } cast(fo, k); wz.recoil = .25; } catch (e) {} finally { s.castAtP = 0; me.x = mk.x; me.y = mk.y; fo.x = keep.x; fo.y = keep.y; fo.face = keep.face; fo.up = keep.up; fo.i = keep.i; fo.p = keep.p; fo.castN = keep.castN; fo.lastK = keep.lastK; window.CLONE_SCALE = sc; } } } }
  const NOUP = new Set();
  if (typeof drawZombie === 'function') { const _dz = drawZombie; window.drawZombie = drawZombie = function (z) { if (z && z.svCaster) { if (z.hp > 0) { try { drawWiz(z.svCaster.wz); const x = ctx, W0 = 30; x.fillStyle = '#000'; x.fillRect(z.x - W0 / 2, z.y - 104 * HS, W0, 5); x.fillStyle = '#ff5a6e'; x.fillRect(z.x - W0 / 2 + 1, z.y - 104 * HS + 1, (W0 - 2) * Math.max(0, z.hp / z.mx), 3); } catch (e) {} } return; } return _dz.apply(this, arguments); }; }

  /* ---------------- the partner ---------------- */
  function partner(s, dt) { const Pw = s.P; if (!Pw || introT > 0) return; const me = ents[0], fo = ents[1];
    if (Pw.dead) { Pw.dead += dt; return; } if (ended) return;
    const mobs = zombies.filter(z => z.svMob && z.hp > 0 && z.rise >= 1); let near = null, nd = 1e9; for (const z of mobs) { const d = Math.hypot(z.x - Pw.x, z.y - Pw.y); if (d < nd) { nd = d; near = z; } }
    // Regroup: it holds a spot at your side. Split up: it roams, keeping its own distance from whatever is nearest to it.
    let tx, ty; if (s.group || !near) { const ax = me.x - fo.x, ay = me.y - fo.y, ad = Math.hypot(ax, ay) || 1; tx = me.x + ax / ad * 30 - ay / ad * 38; ty = me.y + ay / ad * 30 + ax / ad * 38; if (!s.group && !near) { tx = Pw.hx === undefined ? Pw.x : Pw.hx; ty = Pw.hy === undefined ? Pw.y : Pw.hy; } }
    else { const dx = Pw.x - near.x, dy = Pw.y - near.y, d = Math.hypot(dx, dy) || 1, want = 115; Pw.wa = (Pw.wa || 0) + dt * .6; tx = near.x + dx / d * want + Math.cos(Pw.wa) * 40; ty = near.y + dy / d * want + Math.sin(Pw.wa * 1.3) * 30; const ex = tx - me.x, ey = ty - me.y, ed = Math.hypot(ex, ey) || 1; if (ed < 70) { tx = me.x + ex / ed * 70; ty = me.y + ey / ed * 70; } }
    if (s.hearts && s.hearts.length && Pw.hp < Pw.maxHp * .9) { let hb = null, hd = 1e9; for (const h of s.hearts) { const d = Math.hypot(h.x - Pw.x, h.y - Pw.y); if (d < hd) { hd = d; hb = h; } } if (hb) { tx = hb.x; ty = hb.y; } }   // hurt: go and get the heart
    tx = clamp(tx, F.x0 + 10, F.x1 - 10); ty = clamp(ty, F.y0 + 10, F.y1 - 10); const mx = tx - Pw.x, my = ty - Pw.y, md = Math.hypot(mx, my) || 1, sp = Math.min(md * 4, 70);
    Pw.vx = mx / md * sp; Pw.vy = my / md * sp; Pw.x += Pw.vx * dt; Pw.y += Pw.vy * dt; Pw.hx = Pw.x; Pw.hy = Pw.y; Pw.t += dt; Pw.face = near ? (near.x > Pw.x ? 1 : -1) : Pw.face; Pw.recoil = Math.max(0, (Pw.recoil || 0) - dt); Pw.flash = Math.max(0, (Pw.flash || 0) - dt);
    // mobs that are nearer to it than to you go for it, and hurt it when they reach it
    for (const z of mobs) { if (z.svCaster) continue; const dp = Math.hypot(z.x - Pw.x, z.y - Pw.y), dm = Math.hypot(z.x - me.x, z.y - me.y);
      if (dp < dm - 20 && !(z.frozen > 0) && !(z.stun > 0) && z._px !== undefined) { const st = 44 * (z.beast ? 1 : .8) * (z.spd || 1) * dt; if (dp > 20) { z.x = z._px + (Pw.x - z._px) / (Math.hypot(Pw.x - z._px, Pw.y - z._py) || 1) * st; z.y = z._py + (Pw.y - z._py) / (Math.hypot(Pw.x - z._px, Pw.y - z._py) || 1) * st; } else { z.x = z._px; z.y = z._py; } }
      if (dp < 26) { z.pcd = (z.pcd || 0) - dt; if (z.pcd <= 0) { z.pcd = z.acd || .6; z.lunge = .2; if (z.boomD) { phurt(s, z.boomD); hurtZ(z, 1e6, null, 'fire'); try { burst(z.x, z.y - 20 * HS, 22, ['#ffb347', '#ff5a1f', '#fff'], 220, 6, .5); } catch (e) {} } else phurt(s, z.dmg || 4); } } }
    try { for (const p of projs) if (p.o === fo && p.life > 0 && Math.hypot(p.x - Pw.x, p.y - (Pw.y - 38 * HS)) < 24) { p.life = 0; phurt(s, S(fo, 'fireball', 'dmg') * (p.dmgMul || 1)); burst(p.x, p.y, 16, ['#ffb347', '#ff5a1f', '#fff'], 180, 5, .4); } } catch (e) {}
    if (Pw.dead) return;
    const hand = s.pt.hand, k = hand[s.pi % hand.length]; s.pc += dt; const need = (SP[k].t || 1.5) * 1.25;
    if (s.pc >= need && near) { s.pc = 0; s.pi++;
      // the cast goes out from where the partner stands, at what is nearest to it, with its own upgrades. Its summons and shots are on your side.
      const keep = { x: me.x, y: me.y, face: me.face, i: me.i, p: me.p, castN: me.castN, lastK: me.lastK, lv: me.lv[k], up: me.up, fx: fo.x, fy: fo.y, tg: M.tgtNow };
      try { me.x = Pw.x; me.y = Pw.y; me.face = Pw.face; me.up = s.pt.up; fo.x = near.x; fo.y = near.y; M.tgtNow = null; if (!me.lv[k]) me.lv[k] = Math.max(1, Math.round(me.book.reduce((a, q) => a + (me.lv[q] || 1), 0) / Math.max(1, me.book.length))); cast(me, k); Pw.recoil = .25; }
      catch (e) {} finally { me.x = keep.x; me.y = keep.y; me.face = keep.face; me.i = keep.i; me.p = keep.p; me.castN = keep.castN; me.lastK = keep.lastK; me.up = keep.up; fo.x = keep.fx; fo.y = keep.fy; M.tgtNow = keep.tg; if (keep.lv === undefined && !me.book.includes(k)) delete me.lv[k]; } } }
  function phurt(s, d) { const Pw = s.P; if (!Pw || Pw.dead) return; Pw.hp -= d; Pw.flash = .12; try { text(Pw.x + rnd(-8, 8), Pw.y - 75 * HS, Math.round(d), '#ffb0b0'); } catch (e) {}
    if (Pw.hp <= 0) { Pw.hp = 0; Pw.dead = .001; try { text(Pw.x, Pw.y - 100 * HS, (s.pt.n || 'Partner').toUpperCase() + ' IS DOWN', '#ff9aa6', true); burst(Pw.x, Pw.y - 35 * HS, 30, ['#ffffff', '#ff9aa6'], 220, 6, .9); sfx('ko', { x: Pw.x, vol: .7 }); } catch (e) {} } }
  // the partner drafts for itself between attempts: an upgrade for something it holds, or a fifth ability
  function pDraft(s) { const pt = s.pt; if (!pt) return null; const ups = []; for (const k of pt.hand) for (const u of (UPG[k] || [])) if (!u.sig && !u.req && !pt.up.has(k + '.' + u.id)) ups.push([k, u]);
    const un = typeof unlockedSpells === 'function' ? unlockedSpells() : [], extra = usable(un.filter(k => !pt.hand.includes(k) && !(window.VARIANTS && VARIANTS[k]))); let pick = null;
    if (pt.hand.length < 5 && extra.length && (Math.random() < .35 || !ups.length)) { const k = extra[Math.random() * extra.length | 0]; pt.hand.push(k); pick = { k, n: SP[k].n, t: 'New ability' }; }
    else if (ups.length) { const [k, u] = ups[Math.random() * ups.length | 0]; pt.up.add(k + '.' + u.id); pick = { k, n: u.n, t: SP[k].n + ' upgrade' }; }
    if (pick) pt.log.push(pick); return pick; }
  function pStrip() { const s = sv(), host = $('draft'); if (!host) return; let el = $('svPd'); if (!s) { if (el) el.remove(); return; } const pt = s.pt, last = pt && pt.log[pt.log.length - 1], npk = (() => { try { return Math.max(1, myPicks()); } catch (e) { return 1; } })(), lastN = pt ? pt.log.slice(-npk).map(q => q.n).join(', ') : '';
    const foeN = (s.endless ? 0 : M.score.me), will = s.kind === 'zombie' && !s.endless ? ZUPS.slice(0, foeN).map(u => ((UPG.zombies || []).find(q => q.id === u) || { n: u }).n) : [];
    const eh = `<em>Enemy</em><small>${(s.hu || []).length || will.length ? [...new Set(s.hu || [])].map(id => HUPS[id][0] + (hn(s, id) > 1 ? ' x' + hn(s, id) : '') + ': ' + HUPS[id][1]).concat(will).join(' · ') : 'no upgrades yet: it gains one for every wave you clear'}</small>`;
    const h = (!pt ? '' : `<b>${esc(pt.n)}</b><span class="sv-h">${pt.hand.map(k => `<img src="${ICON[k]}">`).join('')}</span><small>${last ? 'drafted ' + esc(lastN) : 'is choosing for itself'} · ${pt.up.size} upgrade${pt.up.size === 1 ? '' : 's'}</small>`) + eh;
    if (!el) { (host.querySelector('.content') || host).insertAdjacentHTML('afterbegin', '<div id="svPd"></div>'); el = $('svPd'); } el.innerHTML = h; }
  if (typeof show === 'function') { const _sh = show; window.show = show = function (id) { const r = _sh.apply(this, arguments); try { const s = sv(); if (id === 'draft' && s && s.pt && s.draftRd !== M.round) { s.draftRd = M.round; let n = 1; try { n = Math.max(1, myPicks()); } catch (e) {} const got = []; for (let i = 0; i < n; i++) { const pk = pDraft(s); if (pk) got.push(pk.n); } if (got.length) toast(`${s.pt.n} drafted ${got.join(', ')}`); } if (id === 'draft' && s && !s.endless) { s.hu = s.hu || []; while (s.hu.length < M.score.me) hGain(s); } if (id === 'draft') pStrip(); } catch (e) {} return r; }; }
  window.svGroup = function () { const s = sv(); if (!s) return; s.group = s.group ? 0 : 1; groupBtn(); try { sfx('ui_click'); const me = ents[0]; text(me.x, me.y - 100 * HS, s.group ? 'REGROUP' : 'SPLIT UP', '#ffe08a'); } catch (e) {} };
  function groupBtn() { const s = sv(), b = $('battle'); if (!b) return; let g = $('svGroup'); if (!s || !s.pt) { if (g) g.style.display = 'none'; return; }
    if (!g) { b.insertAdjacentHTML('beforeend', '<button id="svGroup"></button>'); g = $('svGroup'); g.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); svGroup(); }); } g.style.display = ''; g.textContent = s.group ? 'Split up' : 'Regroup'; g.classList.toggle('on', !!s.group); }
  if (typeof render === 'function') { const _r = render; window.render = render = function () {
      // (1.0.27) the unseen anchor is moved off the field while the frame is drawn, so nothing that follows a caster around (aura, stun stars, glow) shows up on the mob it is riding
      let hid = null; try { const s0 = sv(), fo = s0 && typeof ents !== 'undefined' && ents && ents[1]; if (fo && fo.svAnchor) { hid = { fo, x: fo.x, y: fo.y, st: fo.stunT }; fo.x = -4000; fo.y = -4000; fo.stunT = 0; } } catch (e) {}
      let r; try { r = _r.apply(this, arguments); } finally { if (hid) { hid.fo.x = hid.x; hid.fo.y = hid.y; hid.fo.stunT = hid.st; } }
      try { if ($('battle').classList.contains('on')) drawDrops(); } catch (e) {}
      try { const s1 = sv(), q = $('qF'); if (s1 && s1.pt && q) { const n = s1.pt.hand.length, cur = s1.pi % n, k = s1.pt.hand[cur], need = (SP[k].t || 1.5) * 1.25; if (q.children.length !== n) q.innerHTML = s1.pt.hand.map(k2 => `<div class="qi rev" onclick="tipFromQueue(this,'${k2}','foe')"><img src="${ICON[k2]}"></div>`).join(''); for (let i = 0; i < q.children.length; i++) { q.children[i].style.opacity = s1.P && s1.P.dead ? '.35' : i === cur ? '1' : '.85'; q.children[i].classList.toggle('now', i === cur && !(s1.P && s1.P.dead)); if (i === cur) q.children[i].style.setProperty('--p', Math.min(1, s1.pc / need)); } } } catch (e) {}
      try { const s = sv(); if (s && s.P && $('battle').classList.contains('on') && !(s.P.dead > 1.2)) { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); drawWiz(s.P); x.restore(); } } catch (e) {}
      return r; }; }

  /* ---------------- battle HUD chip ---------------- */
  function hud() { const s = sv(), b = $('battle'); if (!b) return; let h = $('svHud'); if (!s) { if (h) h.style.display = 'none'; return; }
    // the top bar is the partner's health (the anchor itself can never be hurt or killed)
    try { if (s.P) { const f = Math.max(0, s.P.hp / s.P.maxHp) * 100 + '%', a = $('hpF'), l = $('lagF'), n = $('hpnF'); if (a && a.style.width !== f) a.style.width = f; if (l && l.style.width !== f) l.style.width = f; const tx = String(Math.ceil(Math.max(0, s.P.hp))); if (n && n.textContent !== tx) n.textContent = tx; } } catch (e) {}
    if (!h) { b.insertAdjacentHTML('beforeend', '<div id="svHud"></div>'); h = $('svHud'); } const lives = Math.max(0, 3 - M.score.foe), wave = Math.min(2, M.score.me);
    const txt = `<b>${s.endless ? 'ENDLESS' : 'WAVE ' + (wave + 1) + ' / 3'}</b><span>${s.endless ? fmt(s.total) : fmt(Math.max(0, DUR[wave] - s.t))}</span><i>${'♥'.repeat(lives)}<u>${'♥'.repeat(3 - lives)}</u></i><em>+${Math.round((ramp(s.t) - 1) * 100)}%</em>`;
    if (h._t !== txt) { h._t = txt; h.innerHTML = txt; } h.style.display = ''; }

  /* ---------------- leaderboard ---------------- */
  if (typeof showRewards === 'function') { const _sr = showRewards; window.showRewards = showRewards = function () { const s = sv();
      try { if (s && !s.saved) { s.saved = 1; const B = best(); if (s.endless) { /* Endless has no win */ }
          B.push({ kd: s.kind, m: s.endless ? 'endless' : 'waves', t: Math.round(s.total), w: s.endless ? 0 : M.score.me, k: s.kills, h: M.me.book.slice(0, 6), p: s.pt ? s.pt.n : '', d: Date.now() });
          B.sort((a, b) => (b.w - a.w) || (b.t - a.t)); const keep = []; const cnt = { waves: 0, endless: 0 }; for (const e of B) if (cnt[e.m]++ < 10) keep.push(e); PR.svBest = keep; save(); } } catch (e) {}
      // a survival run is not a duel: it leaves the win streak and the win/loss record alone, and has no rematch
      let stats0 = null; if (s) { try { stats0 = JSON.stringify(PR.stats || null); M._stkDone = 1; M._stk = null; } catch (e) {} }
      const coins0 = PR.coins;
      const r = _sr.apply(this, arguments);
      // gold: 2 a zombie, 3 a beast, 5 a caster, paid only for clearing all three waves (Endless pays half as it has no end); a failed run pays a flat 10. Capped at 250 a run.
      try { if (s) { const rate = s.kind === 'zombie' ? 2 : s.kind === 'zodiac' ? 3 : 5, won = !s.endless && M.score.me >= 3, g = won ? Math.min(250, s.kills * rate) : s.endless ? Math.max(10, Math.min(250, Math.floor(s.kills * rate / 2))) : 10; PR.coins = coins0 + g; s.gold = g; save(); const put = () => { const el = $('rwC'); if (el) el.textContent = '+' + g; }; put(); setTimeout(put, 900); setTimeout(put, 2200); if (typeof refreshMeta === 'function') refreshMeta(); } } catch (e) {}
      try { if (s && stats0) { PR.stats = JSON.parse(stats0); save(); const rm = $('rwRm'); if (rm) rm.remove(); document.querySelectorAll('#rewards .stknote').forEach(e => e.remove()); } } catch (e) {}
      try { if (s) { const el = $('rewards'), at = $('rwRow'); if (at && !el.querySelector('.sv-res')) at.insertAdjacentHTML('beforebegin', `<div class="sv-res"><b>${s.endless ? 'Endless' : (M.score.me >= 3 ? 'All 3 waves survived' : 'Fell on wave ' + (Math.min(2, M.score.me) + 1))}</b><span>${fmt(s.total)} survived · ${s.kills} defeated · +${s.gold || 0} gold</span></div>`); } } catch (e) {}
      return r; }; }

  /* ---------------- the Fight Club tab ---------------- */
  function panel() { const c = cfg(), D = decks(), Fv = favs(), B = best();
    const opt = (pt, pi, label, sub, ic) => `<button class="sv-opt ${c.pt === pt && (pt === 'none' || pt === 'random' || c.pi === pi) ? 'on' : ''}" onclick="svSet('pt','${pt}',${pi})">${ic || ''}<b>${label}</b><small>${sub}</small></button>`;
    const hand = h => `<span class="sv-h">${(h || []).map(k => ICON[k] ? `<img src="${ICON[k]}">` : '').join('')}</span>`;
    const rows = m => { const L = B.filter(e => e.m === m); return L.length ? L.map((e, i) => `<div class="sv-row"><i>${i + 1}</i><b>${m === 'waves' ? e.w + '/3 · ' : ''}${fmt(e.t)}</b>${hand(e.h)}<small>${(KINDS[e.kd || 'zodiac'] || KINDS.zodiac)[0]} · ${e.k} defeated${e.p ? ' · with ' + esc(e.p) : ''}</small></div>`).join('') : '<div class="ssub" style="margin:4px 0">No runs yet.</div>'; };
    return `<div class="ssub">Mobs rise all around you. Their damage and numbers grow 5% every 10 seconds. You have 3 lives, and you draft between attempts with a bonus pick after a fall.</div>
      <div class="sv-modes"><button class="${c.mode === 'waves' ? 'on' : ''}" onclick="svSet('mode','waves')"><b>3 Waves</b><small>Survive 30s, 60s, 90s</small></button><button class="${c.mode === 'endless' ? 'on' : ''}" onclick="svSet('mode','endless')"><b>Endless</b><small>How long can you last?</small></button></div>
      <div class="lbl" style="margin-top:12px">Enemy</div>
      <div class="sv-kinds">${Object.keys(KINDS).map(k => `<button class="${c.kind === k ? 'on' : ''}" onclick="svSet('kind','${k}')">${KINDS[k][0]}</button>`).join('')}</div><div class="ssub" style="margin:6px 0 0">${KINDS[c.kind][1]}.</div>
      <div class="lbl" style="margin-top:12px">Partner</div>
      <div class="sv-opts">${opt('none', 0, 'Solo', 'No partner')}${opt('random', 0, 'Random ally', 'An AI with a random hand')}
        ${D.map((d, i) => opt('deck', i, esc(d.n), 'Your saved hand ' + hand(usable(d.h)))).join('')}${Fv.map((b, i) => opt('fav', i, esc(b.n), 'Club favourite ' + hand(usable(b.hand)))).join('')}</div>
      <div class="ssub" style="margin:6px 0 0">A partner has its own health and drafts for itself. If it falls you can still win the wave for both of you. It uses only shots, summons and area abilities.</div>
      <button class="battle sv-go" onclick="svStart()"><span>SURVIVE</span><small>${KINDS[c.kind][0]} · ${c.mode === 'endless' ? 'Endless' : '3 waves'} · ${c.pt === 'none' ? 'solo' : 'with a partner'}</small></button>
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
  #svGroup{position:absolute;right:6px;top:calc(50% + 78px);z-index:4;font:12px 'Lilita One';letter-spacing:.3px;padding:7px 8px;border-radius:11px;border:2px solid #000;background:#1a1236;color:#d6cbf5;box-shadow:0 2px 0 #000;touch-action:none}#svGroup.on{background:linear-gradient(#ffe27a,#f0a830);color:#2a1600}
  #svDrop{position:absolute;inset:0;z-index:30;display:none;place-items:center;background:#0009;padding:16px;box-sizing:border-box}.svd-box{width:100%;max-width:360px;background:linear-gradient(#2c2150,#150f27);border:3px solid #000;border-radius:20px;padding:14px;box-shadow:0 8px 0 #000}
  .svd-h{font:20px 'Lilita One';text-align:center;letter-spacing:.5px;color:#1a0f00;background:linear-gradient(var(--a),var(--b));border:2px solid #000;border-radius:12px;padding:6px 0;margin-bottom:10px}
  .svd-l{display:flex;flex-direction:column;gap:8px}.svd-l button{display:flex;gap:10px;align-items:center;text-align:left;padding:9px 10px;border-radius:14px;border:2px solid #000;background:#1a1236;color:#f3ecff;box-shadow:0 3px 0 #000;cursor:pointer}.svd-bi{width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #000;background:#3a2d66;display:grid;place-items:center;font-size:22px;color:#ffd45e}.svd-l img{width:44px;height:44px;border-radius:12px;border:2px solid #000;flex:none}
  .svd-l span{display:flex;flex-direction:column;gap:2px;min-width:0}.svd-l b{font:16px 'Lilita One';font-weight:400}.svd-l small{font:800 11px Nunito;color:#b9a9e6}.svd-l em{font:700 12px/1.35 Nunito;font-style:normal;color:#e6defc}
  #svPd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 10px 0;padding:7px 10px;border-radius:12px;border:2px solid #000;background:#171029;position:relative;z-index:3}#svPd b{font:14px 'Lilita One';font-weight:400;color:#ffd45e}#svPd small{font:800 11.5px Nunito;color:#d6cbf5;flex:1 1 100%}#svPd em{font:14px 'Lilita One';font-style:normal;color:#ff9aa6}
  #svHud b{font:13px 'Lilita One';font-weight:400;letter-spacing:.6px;color:#ffd45e}#svHud span{font:15px 'Lilita One';color:#fff;min-width:38px;text-align:center}#svHud i{font-style:normal;color:#ff5a6e;font-size:14px;letter-spacing:1px}#svHud i u{text-decoration:none;color:#ffffff2e}#svHud em{font:800 11px Nunito;font-style:normal;color:#ff9aa6}
  .sv-tabs{display:flex;gap:6px;background:#0007;border:2px solid #000;border-radius:14px;padding:4px;margin:6px 0 10px}.sv-tabs button{flex:1;font:15px 'Lilita One';letter-spacing:.3px;padding:8px 0;border-radius:10px;border:0;background:transparent;color:#b9a9e6}.sv-tabs button.on{background:linear-gradient(#4a3a80,#2b2050);color:#fff;box-shadow:0 2px 0 #000}
  .sv-modes{display:flex;gap:8px;margin-top:10px}.sv-modes button,.sv-opt{flex:1;display:flex;flex-direction:column;gap:2px;align-items:flex-start;text-align:left;padding:10px 12px;border-radius:14px;border:2px solid #000;background:#1a1236;color:#fff;box-shadow:0 3px 0 #000}
  .sv-modes b,.sv-opt b{font:15px 'Lilita One';font-weight:400;letter-spacing:.3px}.sv-modes small,.sv-opt small{font:800 11.5px Nunito;color:#b9a9e6;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.sv-modes button.on,.sv-opt.on{background:#3a2d66;outline:2px solid #ffd45e}
  .sv-kinds{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.sv-kinds button{flex:1 1 auto;font:14px 'Lilita One';letter-spacing:.3px;padding:8px 10px;border-radius:12px;border:2px solid #000;background:#1a1236;color:#d6cbf5;box-shadow:0 2px 0 #000}.sv-kinds button.on{background:#3a2d66;color:#fff;outline:2px solid #ffd45e}
  .sv-opts{display:flex;flex-direction:column;gap:7px;margin-top:6px}.sv-opt{flex:none;width:100%}.sv-h{display:inline-flex;gap:3px}.sv-h img{width:22px;height:22px;border-radius:6px;border:1.5px solid #000}
  .sv-go{margin-top:12px;width:100%}.sv-row{display:flex;align-items:center;gap:8px;padding:7px 10px;margin-top:6px;border-radius:12px;border:2px solid #000;background:#1a1236;flex-wrap:wrap}.sv-row i{font:14px 'Lilita One';font-style:normal;color:#ffd45e;width:16px}.sv-row b{font:15px 'Lilita One';font-weight:400;color:#fff}.sv-row small{font:800 11px Nunito;color:#b9a9e6;flex:1 1 100%;margin-left:24px}
  .sv-res{margin:10px auto;padding:9px 14px;max-width:340px;border-radius:14px;border:2px solid #000;background:#171029;text-align:center;box-shadow:0 3px 0 #000}.sv-res b{display:block;font:17px 'Lilita One';font-weight:400;color:#ffd45e}.sv-res span{font:800 12.5px Nunito;color:#e6defc}`;
  document.head.appendChild(css);
  window.SURVIVAL = { MOBS, ramp, best };
})();
