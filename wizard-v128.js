/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.1
   Sure Hit reworked (homing shots, guaranteed hits inside the dome), Zodiac +2 upgrades per animal,
   and enemies hidden behind your units are drawn through them with an outline.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- Zodiac: +2 of one animal ---------------- */
  // twelve upgrades, one per animal. A draft offers at most one of them at a time, so they never crowd out everything else.
  try { if (typeof ZODIAC !== 'undefined' && UPG.zodiac) for (const b of ZODIAC) { const id = 'more_' + b.id; if (!UPG.zodiac.some(u => u.id === id)) UPG.zodiac.push({ id, n: b.n + ' +2', d: `When the ${b.n} comes, two more come with it.`, animal: 1 }); } } catch (e) {}
  if (typeof genOffer === 'function') { const _go = genOffer; window.genOffer = genOffer = function (p, round) { let out = _go.apply(this, arguments);
      try { const allow = Math.random() < .4 ? 1 : 0;   // a +2 shows up in well under half the offers, and never more than one at a time
        for (let tries = 0; tries < 8 && out && out.filter(c => c.type === 'up' && c.u && c.u.animal).length > allow; tries++) { const keep = allow ? out.find(c => c.type === 'up' && c.u && c.u.animal) : null; const again = _go.apply(this, arguments) || []; out = out.map(c => (c.type === 'up' && c.u && c.u.animal && c !== keep) ? (again.find(q => !(q.type === 'up' && q.u && q.u.animal) && !out.some(o => o.k === q.k && o.type === q.type && (!o.u || !q.u || o.u.id === q.u.id))) || c) : c); } } catch (e) {}
      return out; }; }
  window.ZODIAC_MORE = (w, id) => { try { return U(w, 'zodiac', 'more_' + id) ? 2 : 0; } catch (e) { return 0; } };

  /* ---------------- Sure Hit ----------------
     While your Sure Hit Sanctum stands, every enemy inside it is marked:
       - your shots (fireballs, bolts, runes, arrows, blood, slashes, orbs) steer onto those enemies, one target each, the enemy caster first;
       - a damaging cast that is not a shot (meteors, fire rings, storms and the like) lands once on every enemy inside, as if it had hit.
     The old instant blast no longer fires for Sure Hit; a plain Sanctum still gets its blast. */
  const sureDome = w => { try { const D = (window.TECHX && TECHX.domes) || (window.TECH_DEBUG && TECH_DEBUG.domes) || []; return D.find(d => d.o === w && d.t < d.dur && !d.left && ((U(w, 'sanctum', 'surehit') && !d.open) || (U(w, 'opensanctum', 'surehit') && d.open))); } catch (e) { return null; } };
  const inside = (d, e) => d.open || Math.hypot(e.x - d.x, (e.y - d.y) * 1.4) < d.r;
  function marked(w, d) { const L = []; const f = w.foe; if (f && !f.dead && !f.svAnchor && inside(d, f)) L.push({ e: f, k: 'wiz' }); try { for (const c of enemyCreatures(w)) if (c.e && c.e.x !== undefined && c.k !== 'd' && inside(d, c.e)) L.push(c); } catch (e) {} return L; }
  const LISTS = () => [['projs', typeof projs !== 'undefined' ? projs : []], ['runes', typeof runes !== 'undefined' ? runes : []], ['arrows', typeof arrows !== 'undefined' ? arrows : []], ['slashes', (window.TECHX && TECHX.slashes) || []], ['bloods', (window.BLOOD_DEBUG && BLOOD_DEBUG.bloods) || []], ['orbsC', (window.TECH_DEBUG && TECH_DEBUG.orbs) || []]];
  const steer = new Set();   // shots currently steering onto a marked enemy
  if (typeof cast === 'function') { const _c = cast; window.cast = cast = function (w, k) {
      const d = w && sureDome(w), dmgish = d && SP[k] && k !== 'sanctum' && k !== 'opensanctum' && STATS[k] && (STATS[k].dmg || STATS[k].dps) && TYPE_OF[k] !== 'summon';
      let before = null, fh = 0; if (dmgish) { before = new Map(LISTS().map(([n, L]) => [n, new Set(L)])); fh = w.foe ? w.foe.hp : 0; }
      const r = _c.apply(this, arguments);
      try { if (dmgish) { const T0 = marked(w, d); if (T0.length) { const fresh = []; for (const [n, L] of LISTS()) for (const s of L) if (!before.get(n).has(s) && s.o === w) fresh.push(s);
            if (fresh.length) { fresh.forEach((s, i) => { s._sure = T0[i % T0.length]; if (s.home !== undefined || 'home' in s) { s.home = 1; s.tgt = s._sure.e; } steer.add(s); }); }
            else { const dmg = STATS[k].dmg ? S(w, k, 'dmg') : S(w, k, 'dps') * 1.5, s0 = SRC; SRC = k;
              try { for (const t of T0) { const e = t.e; if (t.k === 'wiz') { if (w.foe.hp < fh) continue; const keep = e.shell; e.shell = null; damage(e, dmg, 0, 0, '#ffe08a'); e.shell = keep; } else hurtCreature(e, t.k, dmg, 'arcane'); mark(e); } } finally { SRC = s0; }
              text(w.foe.x, w.foe.y - 100 * HS, 'SURE HIT', '#ffe08a', true); } } } } catch (e) { try { window.logCrash && logCrash(e, 'sureHit'); } catch (e2) {} }
      return r; }; }
  let marks = []; function mark(e) { marks.push({ x: e.x, y: e.y, t: 0 }); }
  function steerTick(dt) { for (const s of steer) { const t = s._sure, alive = s.life === undefined ? !s.dead : s.life > 0; if (!alive || !t || (t.k === 'wiz' ? t.e.dead : !(t.e.hp > 0))) { steer.delete(s); continue; }
      if (s.vx === undefined || s.vy === undefined) continue; const ty = t.e.y - (s.held !== undefined || 'src' in s || s.trail ? 40 * HS : 0), dx = t.e.x - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(s.vx, s.vy) || 1;
      const a = Math.atan2(s.vy, s.vx), b = Math.atan2(dy, dx); let da = b - a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = a + Math.max(-6 * dt, Math.min(6 * dt, da)); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; if (s.a !== undefined) s.a = na; } }
  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments); try { if (!ended) steerTick(dt); for (const m of marks) m.t += dt; marks = marks.filter(m => m.t < .45); } catch (e) {} if (ended) steer.clear(); return r; }; }

  /* ---------------- (1.0.33.3) ability page: fold sections away ----------------
     Upgrades, Matchups, Colour, Attack skin, Trials and Starting upgrades each get a header you can tap to fold or open; the choice is remembered. */
  const SECS = [['.ups', 'Upgrades', 'up'], ['.ctrs', 'Matchups', 'ctrs'], ['.cw-row:not(.sk-row)', 'Colour', 'cw'], ['.sk-row', 'Attack skin', 'sk'], ['.trials', 'Trials', 'tr'], ['.starts', 'Starting upgrades', 'st']];
  window.secToggle = function (id, el) { PR.secOff = PR.secOff || {}; PR.secOff[id] = PR.secOff[id] ? 0 : 1; try { save(); sfx('ui_click'); } catch (e) {} const box = el.closest('.cs-box'); if (box) box.classList.toggle('cs-off', !!PR.secOff[id]); };
  function foldable() { const P0 = $('sheetP'); if (!P0) return; PR.secOff = PR.secOff || {};
    for (const [sel, name, id] of SECS) { let box = P0.querySelector(sel); if (!box) continue; if (id === 'up') box = box.parentElement === P0 ? box : box.closest('#sheetP > *') || box; if (!box || box.classList.contains('cs-box')) continue;
      box.classList.add('cs-box'); let head = box.querySelector(':scope > .trh') || (id === 'cw' || id === 'sk' ? box.querySelector(':scope > b') : null);
      if (!head) { box.insertAdjacentHTML('afterbegin', `<div class="cs-h cs-made"><b>${name}</b></div>`); head = box.firstElementChild; } else head.classList.add('cs-h');
      head.insertAdjacentHTML('beforeend', '<i class="cs-chev"></i>'); head.setAttribute('role', 'button'); head.onclick = ev => { ev.stopPropagation(); secToggle(id, head); };
      box.classList.toggle('cs-off', !!PR.secOff[id]); } }
  if (typeof openSpell === 'function') { const _os = openSpell; window.openSpell = openSpell = function () { const r = _os.apply(this, arguments); try { foldable(); setTimeout(foldable, 80); } catch (e) {} return r; }; }
  { const css = document.createElement('style'); css.textContent = `
  .cs-h{display:flex;align-items:center;justify-content:space-between;cursor:pointer;-webkit-tap-highlight-color:transparent}.cs-made{margin:2px 0 6px}.cs-made b{font:13px 'Lilita One';font-weight:400;letter-spacing:.5px;text-transform:uppercase;color:#f3ecff}
  .cs-chev{flex:none;width:9px;height:9px;margin-left:8px;border-right:2.5px solid #d6cbf5;border-bottom:2.5px solid #d6cbf5;transform:rotate(-135deg) translate(-2px,-2px);transition:transform .15s}.cs-off .cs-chev{transform:rotate(45deg) translate(-2px,-2px)}
  .cs-off>:not(.cs-h){display:none!important}.cs-box.cs-off{padding-bottom:6px!important}.cw-row>b.cs-h{display:flex}
  #sheetP .ups .off{color:#b4a8dc!important}   /* not-yet-owned upgrade names: 6.6:1 on the panel (was 2.7:1) */`; document.head.appendChild(css); }

  /* ---------------- see-through outline: an enemy hidden behind one of your units ---------------- */
  // after the frame is drawn, any enemy standing behind a friendly unit is drawn again over it, half see-through with a red rim
  // (no canvas filter here: a drop-shadow filter on the full-size battle canvas cost seconds per frame)
  function frontBox(u, kind) { if (kind === 'wiz') return { x: u.x, y: u.y, w: 30, h: 84 }; if (kind === 'g') return { x: u.x, y: u.y, w: u.mini ? 24 : 46, h: u.mini ? 50 : 92 }; const sz = u.beast ? (u.beast.sz || 1) : 1; return u.beast ? { x: u.x, y: u.y, w: 30 * sz, h: 46 * sz * 1.6 } : { x: u.x, y: u.y, w: 24, h: 58 }; }
  function xray() { const me = ents[0], foe = ents[1]; if (!me || !foe) return; const front = [[me, 'wiz']]; for (const z of zombies) if (z.o === me && z.hp > 0 && z.rise >= 1 && !z.svCaster) front.push([z, 'z']); for (const g of (typeof golems !== 'undefined' ? golems : [])) if (g.o === me && g.hp > 0) front.push([g, 'g']);
    const back = []; if (!foe.dead && !foe.svAnchor) back.push([foe, 'wiz']); for (const z of zombies) if (z.o !== me && z.hp > 0 && z.rise >= 1) back.push([z, 'z']); for (const g of (typeof golems !== 'undefined' ? golems : [])) if (g.o !== me && g.hp > 0) back.push([g, 'g']); for (const a of (typeof archers !== 'undefined' ? archers : [])) if (a.o !== me && a.hp > 0) back.push([a, 'a']);
    const hid = []; for (const [b, bk] of back) { for (const [f, fk] of front) { if (f === b || b.y >= f.y - 2) continue; const F0 = frontBox(f, fk); if (Math.abs(b.x - f.x) < F0.w * .55 && f.y - b.y < F0.h * .8) { hid.push([b, bk]); break; } } if (hid.length >= 8) break; }
    if (!hid.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const [b, bk] of hid) { x.globalAlpha = .45; try { if (bk === 'wiz') drawWiz(b); else if (bk === 'g') drawGolem(b); else if (bk === 'a') drawArcher(b); else drawZombie(b); } catch (e) {}
      const B = frontBox(b, bk === 'a' ? 'z' : bk); x.globalAlpha = .9; x.strokeStyle = '#ff5a6e'; x.lineWidth = 2; x.setLineDash([5, 4]); x.beginPath(); x.ellipse(b.x, b.y - B.h * .45, B.w * .62, B.h * .55, 0, 0, 7); x.stroke(); x.setLineDash([]); }
    x.restore(); }
  function drawMarks() { if (!marks.length) return; const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); for (const m of marks) { const k = m.t / .45, R = 26 * (.5 + k * .5); x.globalAlpha = 1 - k; x.strokeStyle = '#ffe08a'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(m.x, m.y, R, R / 1.4, 0, 0, 7); x.stroke(); } x.restore(); }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { if (typeof ents !== 'undefined' && ents && ents.length && $('battle').classList.contains('on')) { xray(); drawMarks(); } } catch (e) {} return r; }; }
})();
