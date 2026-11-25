/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.30
   Snake venom ticks, riding the Horse across the arena, draft cards tinted by ability tier,
   and the options menu grouped into sections.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- snake venom: poison damage over time ---------------- */
  // ticks twice a second so the numbers read as poison, not as one big hit
  function venomTick(dt) { for (const w of ents) { const p = w.snPois; if (!p) continue; if (w.dead || ended) { w.snPois = null; continue; }
      p.t -= dt; p.acc += p.dps * dt; p.tk = (p.tk || 0) + dt;
      if (Math.random() < dt * 8) P({ x: w.x + rnd(-10, 10), y: w.y - rnd(10, 60) * HS, vx: rnd(-8, 8), vy: -rnd(15, 40), color: Math.random() < .5 ? '#7ef08a' : '#2f8a3c', size: rnd(1.6, 2.8), life: rnd(.35, .6), glow: false });
      if (p.tk >= .5 || p.t <= 0) { p.tk = 0; const d = p.acc; p.acc = 0; if (d > 0 && !(w.ghostT > 0)) { const s0 = SRC; SRC = 'zodiac'; try { damage(w, d, 0, 0, '#7ef08a'); } finally { SRC = s0; } } }
      if (p.t <= 0) w.snPois = null; } }

  /* ---------------- smouldering: lightning and fire leave a fighter smoking for 3 seconds ---------------- */
  // a grey smoke plume rises from them, and while they move they shed embers behind them
  if (typeof damage === 'function') { const _dm = damage; window.damage = damage = function (t, d) { const h0 = t ? t.hp : 0, r = _dm.apply(this, arguments);
      try { if (t && h0 > t.hp && !t.svAnchor && (t.lastCat === 'fire' || t.lastCat === 'shock' || SRC === 'lightning' || SRC === 'violetbolt' || SRC === 'storm')) t.smolderT = 3; } catch (e) {}
      return r; }; }
  function smoulder(dt) { for (const w of ents) { if (!(w.smolderT > 0)) continue; if (w.dead) { w.smolderT = 0; continue; } w.smolderT -= dt; const k = Math.min(1, w.smolderT / 1.2);
      if (Math.random() < dt * 24 * k) P({ x: w.x + rnd(-8, 8), y: w.y - rnd(30, 62) * HS, vx: rnd(-8, 8) - (w.vx || 0) * .2, vy: -rnd(25, 50), color: ['#2e2a33', '#45404c', '#24212a'][Math.random() * 3 | 0], size: rnd(5, 8), life: rnd(.7, 1.2), glow: false, grow: 2.2, fade: .6, drag: .96 });   /* dark charcoal so it reads on grass, sand and snow alike */
      const mv = Math.hypot(w.vx || 0, w.vy || 0); if (mv > 12 && Math.random() < dt * 22 * k) P({ x: w.x + rnd(-6, 6), y: w.y - rnd(2, 20) * HS, vx: -(w.vx || 0) * .15 + rnd(-15, 15), vy: rnd(-30, -5), color: Math.random() < .5 ? '#ff8a3a' : '#ffd45e', size: rnd(1.4, 2.4), life: rnd(.3, .6), grav: 60 }); } }

  /* ---------------- no dogpiling: a short guard after a melee hit ---------------- */
  // A blanket 0.1 s invincibility after any damage would swallow real multi-hit spells (twin fireballs, the echo bolt, triple Dissection, burn ticks),
  // and at 0.1 s it would barely slow a crowd anyway. So the guard only applies to melee hits from summons and survival mobs:
  // after one lands, a fighter ignores further melee hits for 0.25 s. Spells, shots and damage over time are untouched.
  const MELEE_COL = '#d8ff9a';
  if (typeof damage === 'function') { const _dg = damage; window.damage = damage = function (t, d, kx, ky, col) {
      try { if (t && d > 0 && col === MELEE_COL && (SRC === 'zombies' || SRC === 'zodiac') && !t.svAnchor && !t.isDummy) { if (t._meleeT !== undefined && T - t._meleeT < .25 && T >= t._meleeT) return; t._meleeT = T; } } catch (e) {}
      return _dg.apply(this, arguments); }; }

  /* ---------------- the Horse: its caster rides it across the arena ---------------- */
  // When your Horse rises, you climb on. It gallops in a straight line toward the enemy until it reaches the far edge,
  // trampling the enemy caster if it runs through them, then you hop off and it fights as normal.
  function rides(dt) { for (const z of zombies) { const b = z.beast; if (!b || b.id !== 'horse' || b.crim || z.rideDone || z.hp <= 0) continue; const w = z.o;
      if (!w || !ents.includes(w) || w.svAnchor || w.dead || w.isDummy) { z.rideDone = 1; continue; }
      if (z.rise < 1) continue;
      if (!z.ride) { if (zombies.some(q => q !== z && q.ride && q.o === w)) { z.rideDone = 1; continue; } const f = w.foe; z.ride = { a: Math.atan2(f.y - z.y, f.x - z.x), t: 0, hit: 0, x: z.x, y: z.y }; text(w.x, w.y - 96 * HS, 'MOUNTED', '#ffe08a'); try { sfx('ui_deal', { x: w.x, rate: .8 }); } catch (e) {} }
      const r = z.ride; r.t += dt; const sp = 240; r.x += Math.cos(r.a) * sp * dt; r.y += Math.sin(r.a) * sp * dt;
      const out = r.x < F.x0 + 6 || r.x > F.x1 - 6 || r.y < F.y0 + 6 || r.y > F.y1 - 6;
      r.x = clamp(r.x, F.x0 + 6, F.x1 - 6); r.y = clamp(r.y, F.y0 + 6, F.y1 - 6); z.x = r.x; z.y = r.y; z.cd = .3; z.bt = 0;
      w.x = r.x; w.y = r.y + 2; w.vx = Math.cos(r.a) * 40; w.vy = 0; w.face = Math.cos(r.a) >= 0 ? 1 : -1;
      if (Math.random() < dt * 30) P({ x: r.x - Math.cos(r.a) * 14 + rnd(-6, 6), y: r.y + rnd(-2, 4), vx: -Math.cos(r.a) * 60 + rnd(-20, 20), vy: -rnd(10, 40), color: '#8a7a5a', size: rnd(3, 5), life: .4, glow: false, grow: 1.6, fade: .5 });
      const f = w.foe; if (!r.hit && f && !f.dead && !f.svAnchor && Math.hypot(f.x - r.x, f.y - r.y) < 30) { r.hit = 1; if (!(f.ghostT > 0)) { const s0 = SRC; SRC = 'zodiac'; try { damage(f, 8, Math.cos(r.a) * 520, Math.sin(r.a) * 520, '#ffe08a'); } finally { SRC = s0; } text(f.x, f.y - 96 * HS, 'TRAMPLED', '#ffe08a', true); shake = Math.max(shake, 10); } }
      if (out || r.t > 2.6) { z.ride = null; z.rideDone = 1; text(w.x, w.y - 96 * HS, 'DISMOUNT', '#c9b8ff'); w.recoil = .15; } } }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && ents.length && !(introT > 0)) { if (!ended) { rides(dt); smoulder(dt); } venomTick(dt); } } catch (e) { try { window.logCrash && logCrash(e, 'v125'); } catch (e2) {} }
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { for (const w of ents) w.snPois = null; } catch (e) {} return r; }; }

  /* ---------------- draft cards: tier shows in the paper ---------------- */
  // tier 1 (no upgrades yet) is plain parchment, tier 2 a warmer amber, tier 3 (signature, or three upgrades) gilded with a gold rule.
  if (typeof renderDraft === 'function') { const _rd = renderDraft; window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments);
      try { const me = { up: M.me.up }; document.querySelectorAll('#cards .card').forEach(el => { const c = M.offer[+el.dataset.i]; if (!c || typeof tierOf !== 'function') return; const t = tierOf(me, c.k); el.classList.remove('dt-t2', 'dt-t3'); if (t >= 2) el.classList.add('dt-t' + t); }); } catch (e) {}
      return r; }; }

  /* ---------------- options: grouped into sections ---------------- */
  const GROUPS = [
    ['Gameplay', /^(Slow-motion moments|Slow motion on critical hits|Screen shake|Rivals I face|My fighter talks)/],
    ['Sound', /^(Music|Sound effects|Whistle when training resets|♫)/],
    ['Display', /^(Text size|Training yard on the home screen)/],
    ['Help', /^(Replay tutorial|✉ Send feedback|★ Rate the game|🐞 Crash log|⟳ Check for update)/],
    ['Account', /^(Reset progress)/],
  ];
  const openG = new Set(['Gameplay']);
  window.optToggle = function (el) { const g = el.dataset.g; if (el.open) openG.add(g); else openG.delete(g); };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML; window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments);
      try { const box = document.createElement('div'); box.innerHTML = h; const root = box.firstElementChild; if (!root) return h; const kids = [...root.children], bins = GROUPS.map(() => []), rest = [];
        for (const el of kids) { const t = (el.textContent || '').trim(); if (el.classList.contains('updv')) { rest.push(el); continue; } const i = GROUPS.findIndex(g => g[1].test(t)); (i >= 0 ? bins[i] : rest).push(el); }
        root.innerHTML = ''; GROUPS.forEach((g, i) => { if (!bins[i].length) return; const d = document.createElement('details'); d.className = 'og-sec'; d.dataset.g = g[0]; if (openG.has(g[0])) d.open = true; d.setAttribute('ontoggle', 'optToggle(this)');
          d.innerHTML = `<summary><b>${g[0]}</b><i></i></summary><div class="og-body"></div>`; const body = d.querySelector('.og-body'); for (const el of bins[i]) body.appendChild(el); root.appendChild(d); });
        for (const el of rest) root.appendChild(el); return box.innerHTML; } catch (e) { return h; } }; }

  const css = document.createElement('style');
  css.textContent = `
  /* tier 2: warm amber parchment; tier 3: gilded, with a gold rule inside the edge. Text stays dark brown on both (contrast checked). */
  .card.dt-t2 .in{background:linear-gradient(#c07a3a,#e2a262 18%,#ecb57a 50%,#e2a262 82%,#c07a3a)!important}
  .card.dt-t3 .in{background:linear-gradient(#b07a18,#e0b44a 18%,#efcd6c 50%,#e0b44a 82%,#b07a18)!important}
  .card.dt-t3 .in::after{content:"";position:absolute;inset:5px 4px;border:2px solid #8a5a08;box-shadow:inset 0 0 0 2px #fff2b0,0 0 0 1px #fff2b0;border-radius:3px;pointer-events:none}
  .card .role{filter:none!important;color:#5a3412!important;color:color-mix(in srgb,var(--c) 35%,#241000)!important}   /* plain dark brown where the browser cannot mix colours */
  .card.dt-t2 .role,.card.dt-t3 .role{color:#4a2208!important;color:color-mix(in srgb,var(--c) 26%,#1e0c00)!important}
  #sheetP .opts~.vernote{display:none}   /* the version already shows at the bottom of the menu */
  .og-sec{border:2px solid #000;border-radius:14px;background:#1a1236;margin:0 0 8px;overflow:hidden}
  .og-sec>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .og-sec>summary::-webkit-details-marker{display:none}.og-sec>summary b{font:15px 'Lilita One';font-weight:400;letter-spacing:.4px;color:#f3ecff}
  .og-sec>summary i{width:9px;height:9px;border-right:2.5px solid #d6cbf5;border-bottom:2.5px solid #d6cbf5;transform:rotate(45deg) translate(-2px,-2px);transition:transform .15s}.og-sec[open]>summary i{transform:rotate(-135deg) translate(-2px,-2px)}
  .og-sec[open]>summary{border-bottom:2px solid #000;background:#241a46}.og-body{display:flex;flex-direction:column;gap:8px;padding:10px 10px 12px}`;
  document.head.appendChild(css);
})();
