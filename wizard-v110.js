/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.10
   Summons can be bowled. A Repel orb, a Late Detonation blast, or a Boundary letting go of a summon it
   caught sends that summon sliding; if it runs into another summon on its side, that one is knocked on
   in turn, like pins. Each knock hurts a little and throws sparks.
   Also: sparks from the Repel detonation.
   ===================================================================== */
(function () {
  'use strict';
  let slides = [];
  const pinsOf = o => { const L = []; try { for (const z of zombies) if (z.o === o && z.hp > 0 && z.rise >= 1) L.push({ e: z, k: 'z' }); for (const g of golems) if (g.o === o && g.hp > 0) L.push({ e: g, k: 'g' }); for (const d of decoys) if (d.o === o && !d.gone) L.push({ e: d, k: 'd' }); } catch (e) {} return L; };
  function sparks(x0, y0, big) { const n = big ? 34 : 12; for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), v = rnd(big ? 180 : 110, big ? 520 : 300); P({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75 - (big ? 60 : 20), color: ['#ffffff', '#ffe27a', '#ff8a8a', '#ff4a4a'][i % 4], size: rnd(1.6, big ? 3.6 : 2.8), life: rnd(.25, big ? .7 : .45), grav: 380, drag: .96 }); }
    if (big) { try { inkRing(x0, y0 + 36 * HS, '#ffe27a', 2, 8, 46, .5); } catch (e) {} for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + rnd(-.2, .2); P({ x: x0 + Math.cos(a) * 10, y: y0 + Math.sin(a) * 8, vx: Math.cos(a) * 640, vy: Math.sin(a) * 480, color: '#fff7c8', size: 2.4, life: .22 }); } } }
  window.repelSparks = sparks;
  // send one summon sliding; `chain` is the set already knocked by this throw, so pins never ping-pong
  function bowl(e, k, ux, uy, power, chain) { if (!e || e.x === undefined) return; chain = chain || new Set(); chain.add(e); slides = slides.filter(s => s.e !== e); slides.push({ e, k, vx: ux * power, vy: uy * power * .85, t: 0, chain }); if (k === 'z') e.stun = Math.max(e.stun || 0, .5); }
  window.bowl = bowl;
  function step(dt) {
    // a summon Boundary was holding is let go: it is thrown at the nearest other summon on its own side (or straight back)
    try { for (const [list, k] of [[zombies, 'z'], [golems, 'g']]) for (const e of list) if (e._bndBy && !(e.bndT > 0)) { const by = e._bndBy; e._bndBy = null; if (!(e.hp > 0) || by.dead) continue;
          let tgt = null, bd = 1e9; for (const p of pinsOf(e.o)) if (p.e !== e) { const d = Math.hypot(p.e.x - e.x, p.e.y - e.y); if (d < bd) { bd = d; tgt = p.e; } }
          let ux, uy; if (tgt && bd < 260) { ux = (tgt.x - e.x) / (bd || 1); uy = (tgt.y - e.y) / (bd || 1); } else { const d = Math.hypot(e.x - by.x, e.y - by.y) || 1; ux = (e.x - by.x) / d; uy = (e.y - by.y) / d; }
          bowl(e, k, ux, uy, 380); sparks(e.x, e.y - 30 * HS, 0); try { text(e.x, e.y - 70 * HS, 'FLUNG', '#bcd2ff'); if (window.bndOut) bndOut(e, 'orb', 20 * HS); } catch (x) {} } } catch (x) {}
    for (const s of slides) { const e = s.e; s.t += dt; if (!(e.hp === undefined || e.hp > 0) || e.gone) { s.done = 1; continue; }
      e.x += s.vx * dt; e.y += s.vy * dt; const f = Math.exp(-3.1 * dt); s.vx *= f; s.vy *= f;
      if (e.x < F.x0 + 10 || e.x > F.x1 - 10) { s.vx = -s.vx * .5; e.x = Math.max(F.x0 + 10, Math.min(F.x1 - 10, e.x)); } if (e.y < F.y0 + 10 || e.y > F.y1 - 10) { s.vy = -s.vy * .5; e.y = Math.max(F.y0 + 10, Math.min(F.y1 - 10, e.y)); }
      const sp = Math.hypot(s.vx, s.vy); if (Math.random() < dt * 40) P({ x: e.x + rnd(-5, 5), y: e.y + rnd(-2, 3), vx: -s.vx * .1, vy: -rnd(8, 30), color: '#b9a98a', size: rnd(2.5, 4.5), life: .35, glow: false, grow: 1.5, fade: .5, shrink: false });
      if (sp > 90) for (const p of pinsOf(e.o)) { if (s.chain.has(p.e)) continue; const dx = p.e.x - e.x, dy = p.e.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > 24) continue;
          const nx = dx / d * .6 + s.vx / sp * .4, ny = dy / d * .6 + s.vy / sp * .4, nl = Math.hypot(nx, ny) || 1; bowl(p.e, p.k, nx / nl, ny / nl, sp * .85, s.chain); s.vx *= .5; s.vy *= .5;
          try { const keep = SRC; SRC = 'polarity'; hurtCreature(p.e, p.k, 4, 'crush'); hurtCreature(e, s.k, 2, 'crush'); SRC = keep; } catch (x) {} sparks((e.x + p.e.x) / 2, (e.y + p.e.y) / 2 - 26 * HS, 0); try { shake = Math.max(shake, 4); sfx('hit', { x: e.x, vol: .5 }); } catch (x) {} break; }
      if (sp < 26 || s.t > 1.3) s.done = 1; }
    slides = slides.filter(s => !s.done); }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { if (typeof ents !== 'undefined' && ents && ents.length && !ended) step(dt); } catch (e) {} return r; }; }
  if (typeof startDuel === 'function') { const _s = startDuel; window.startDuel = startDuel = function () { slides = []; return _s.apply(this, arguments); }; }
  window.BOWL_DEBUG = { get slides() { return slides; } };
})();

/* ---------------- damage shown as a sum: base + level bonus + hand bonuses ---------------- */
(function () {
  'use strict';
  const f = v => String(Math.round(v * 10) / 10);
  // syn is a synergyOf() result; only bonuses this ability belongs to count
  window.dmgBreak = function (k, key, lv, syn) { const st = STATS[k] && STATS[k][key]; if (!st) return null; const base = st[0], cur = st[Math.min(lv, st.length) - 1]; let pct = 0;
    if (syn) { const a = syn['el:' + ELEM_OF[k]], b = syn['ty:' + TYPE_OF[k]], c = typeof SCHOOL_OF === 'function' ? syn['sc:' + SCHOOL_OF(k)] : null; pct = (a ? a.pct : 0) + (b ? b.pct : 0) + (c ? c.pct : 0); }
    const bonus = cur * pct, parts = [`<i class="b0" title="Base">${f(base)}</i>`]; if (cur - base > .04) parts.push(`<i class="b1" title="Level bonus">+${f(cur - base)}</i>`); if (bonus > .04) parts.push(`<i class="b2" title="Hand bonuses">+${f(bonus)}</i>`);
    // colour says what each part is: white base, green level bonus, gold hand bonuses
    const names = ['<i class="b0">base</i>']; if (cur - base > .04) names.push('<i class="b1">level</i>'); if (bonus > .04) names.push('<i class="b2">hand bonus</i>');
    return { total: f(cur + bonus), txt: parts.length > 1 ? '(' + parts.join(' ') + ')<span class="dbl">' + names.join(' + ') + '</span>' : '', base, level: cur - base, bonus }; };
  // spell book: the damage rows get the same breakdown (hand bonuses count only while the ability is in your hand)
  if (typeof openSpell === 'function') { const _os = openSpell;
    window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments);
      try { const st = STATS[k] || {}, lv = (PR.spells[k] && PR.spells[k].lvl) || 1, syn = (PR.hand || []).includes(k) && typeof synergyOf === 'function' ? synergyOf(PR.hand) : null, lblS = (typeof STAT_LBL_SPELL !== 'undefined' && STAT_LBL_SPELL[k]) || {}, gen = typeof STAT_LBL !== 'undefined' ? STAT_LBL : {};
        for (const key of ['dmg', 'dps']) { if (!st[key]) continue; const bk = dmgBreak(k, key, lv, syn), lbl = lblS[key] || gen[key]; if (!bk || !bk.txt) continue;
          const row = [...document.querySelectorAll('#sheetP .srow')].find(el => el.querySelector('.k') && el.querySelector('.k').textContent === lbl); if (!row || row.querySelector('.dbk')) continue;
          const val = row.lastElementChild, nx = val.querySelector('.nx'); val.firstChild && val.firstChild.nodeType === 3 ? (val.firstChild.textContent = bk.total) : null; row.insertAdjacentHTML('beforeend', `<em class="dbk">${bk.txt}</em>`); } } catch (e) {}
      return r; }; }
  const css = document.createElement('style');
  css.textContent = `.dbk{font:800 11.500px Nunito;font-style:normal;color:#8f80b8;margin-left:5px;white-space:nowrap}.dbk i{font-style:normal}.dbk .b0{color:#fff}.dbk .b1{color:#6ee58a}.dbk .b2{color:#ffd45e}.dbl{display:block;font-size:10px;margin-top:1px;color:#8f80b8}.ostats .dbk{white-space:normal;display:inline-block;vertical-align:middle}.srow{flex-wrap:wrap}.srow .dbk{flex-basis:100%;text-align:right;margin:1px 0 0}`;
  document.head.appendChild(css);
})();

/* ---------------- a signature upgrade or boss ability in the draft arrives with a chime and a shine ---------------- */
(function () {
  'use strict';
  // a light two-note bell, made on the spot (no audio file)
  function chime() { try { if (typeof AU === 'undefined' || !AU.ctx) return; const c = AU.ctx, out = (AU.g && (AU.g.sfx || AU.g.master)) || c.destination, t0 = c.currentTime;
      [[1318.5, 0, .5], [1975.5, .09, .7], [2637, .09, .45]].forEach(([f, d, len]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(.16, t0 + d + .012); g.gain.exponentialRampToValueAtTime(.0008, t0 + d + len); o.connect(g).connect(out); o.start(t0 + d); o.stop(t0 + d + len + .05); }); } catch (e) {} }
  window.prizeChime = chime;
  const isPrize = c => !!c && ((c.type === 'up' && c.u && c.u.sig) || (c.type !== 'up' && window.VARIANTS && VARIANTS[c.k]));
  if (typeof renderDraft === 'function') { const _rd = renderDraft;
    window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments);
      try { const key = (M.offer || []).map(c => c.type + c.k + (c.u ? c.u.id : '')).join('|'), fresh = M._prizeKey !== key; M._prizeKey = key;
        (M.offer || []).forEach((c, i) => { if (!isPrize(c)) return; const el = document.querySelector(`#cards .card[data-i="${i}"]`); if (!el) return; el.classList.add('prize'); el.style.setProperty('--pd', (.45 + i * .16) + 's');
          if (fresh) setTimeout(chime, 450 + i * 160); }); } catch (e) {}
      return r; }; }
  const css = document.createElement('style');
  css.textContent = `.card.prize .in{overflow:hidden;box-shadow:inset 0 0 0 2px #ffd45e,0 0 16px #ffd45e88;animation:prizeGlow 1.6s ease-in-out var(--pd,.45s) 2 both}
  .card.prize .in::after{content:"";position:absolute;top:-20%;bottom:-20%;left:0;width:34%;background:linear-gradient(100deg,#fff0,#ffffffd9 45%,#fff7c8 55%,#fff0);transform:translateX(-140%) skewX(-18deg);animation:prizeShine 1s cubic-bezier(.3,.1,.3,1) var(--pd,.45s) 2 both;pointer-events:none;z-index:3;mix-blend-mode:screen}
  .card.prize .ic::after{content:"★";position:absolute;top:-4px;right:-6px;font-size:17px;color:#ffd45e;text-shadow:0 0 6px #fff,0 1px 0 #000;animation:prizeStar 1.2s ease-in-out var(--pd,.45s) infinite alternate both}.card.prize .ic{position:relative}
  @keyframes prizeShine{from{transform:translateX(-140%) skewX(-18deg)}to{transform:translateX(420%) skewX(-18deg)}}@keyframes prizeGlow{0%,100%{box-shadow:inset 0 0 0 2px #ffd45e,0 0 10px #ffd45e66}50%{box-shadow:inset 0 0 0 3px #fff3b0,0 0 26px #ffd45e}}@keyframes prizeStar{from{transform:scale(.8) rotate(-12deg);opacity:.7}to{transform:scale(1.2) rotate(12deg);opacity:1}}`;
  document.head.appendChild(css);
})();

/* ---------------- a sound of its own when a summon dies ---------------- */
(function () {
  'use strict';
  let seen = new Map(), lastT = 0;
  // a hollow thump dropping in pitch with a dry crumble over it, made on the spot (no audio file)
  function summonDown(pan) { try { if (typeof AU === 'undefined' || !AU.ctx) return; if (window.YARD && YARD.on && PR.yardMute === true) return; const c = AU.ctx, now = c.currentTime; if (now - lastT < .07) return; lastT = now; let out = (AU.g && (AU.g.sfx || AU.g.master)) || c.destination;
      try { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); p.connect(out); out = p; } catch (e) {}
      const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(240, now); o.frequency.exponentialRampToValueAtTime(58, now + .28); g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .34); o.connect(g).connect(out); o.start(now); o.stop(now + .36);
      const n = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * .22, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2); n.buffer = buf; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = .8; const gn = c.createGain(); gn.gain.value = .26; n.connect(bp).connect(gn).connect(out); n.start(now + .02); } catch (e) {} }
  window.summonDownSfx = summonDown;
  if (typeof update === 'function') { const _u = update;
    window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents === 'undefined' || !ents || !ents.length) return r; const next = new Map();
        const look = (L, alive) => { for (const e of L) { const a = alive(e); next.set(e, a); if (seen.get(e) === true && !a) summonDown(((e.x || 195) - 195) / 150); } };
        if (typeof zombies !== 'undefined') look(zombies, e => e.hp > 0); if (typeof golems !== 'undefined') look(golems, e => e.hp > 0); if (typeof archers !== 'undefined') look(archers, e => e.hp > 0); if (typeof decoys !== 'undefined') look(decoys, e => !e.gone);
        // one that was alive last frame and is no longer in its list at all also counts as down
        if (!ended) for (const [e, a] of seen) if (a === true && !next.has(e)) summonDown(((e.x || 195) - 195) / 150);
        seen = next; } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _s = startDuel; window.startDuel = startDuel = function () { seen = new Map(); return _s.apply(this, arguments); }; }
})();
