/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.31
   Collapse drags every summon it touches and destroys them when it ends; Draw hurts what its catch is dragged past;
   the order screen lists Zodiac upgrades taken; the Survival round curtain shows the horde and your team.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const orbs = () => (window.TECH_DEBUG && TECH_DEBUG.orbs) || [];
  const isCollapse = c => c && !c.draw && !c.repel && c.dmg !== undefined && c.hit instanceof Set;

  /* ---------------- Collapse: catch every summon, drag it, destroy it when the singularity ends ---------------- */
  // Applies to Collapse and Unrestrained Collapse. Anything summoned (zombies, beasts including the Juggernaut, golems, turrets,
  // fly swarms, decoys, totems, survival mobs) that touches it is caught and pulled along; when it implodes or bursts, all of it is gone.
  const caught = new Map();   // collapse orb -> [{ e, k, ox, oy }]
  function collapseTick(dt) { const live = orbs();
    for (const c of live) { if (!isCollapse(c) || (c.wind && !c.launched) || c.life <= 0) continue; let L = caught.get(c); if (!L) { L = []; caught.set(c, L); }
      const R = 40 * (c.amp || 1); let list = []; try { list = enemyCreatures(c.o); } catch (e) {}
      for (const q of list) { const e = q.e; if (!e || e.x === undefined || e._colBy || L.some(h => h.e === e)) continue; if (Math.hypot(e.x - c.x, e.y - c.y) < R) { e._colBy = c; const a = Math.random() * 6.283; L.push({ e, k: q.k, ox: Math.cos(a) * rnd(6, 18), oy: Math.sin(a) * rnd(4, 12) }); try { burst(e.x, e.y - 20 * HS, 8, ['#c48cff', '#ffffff'], 120, 3, .35); } catch (e2) {} } }
      for (const h of L) { const e = h.e; if (!(e.hp > 0) && !(h.k === 'd' && !e.gone)) continue; const sp = (Date.now() / 1000) * 6; e.x = c.x + h.ox * Math.cos(sp) - h.oy * Math.sin(sp); e.y = c.y + h.ox * Math.sin(sp) * .6 + h.oy * Math.cos(sp) * .6; if (e.vx !== undefined) { e.vx = 0; e.vy = 0; } e.stun = Math.max(e.stun || 0, .2); e.rooted = Math.max(e.rooted || 0, .2); if (e.cd !== undefined) e.cd = Math.max(e.cd, .3); } }
    for (const [c, L] of caught) { if (live.includes(c) && c.life > 0) continue; caught.delete(c);
      for (const h of L) { const e = h.e; e._colBy = null; if (h.k === 'd' ? e.gone : !(e.hp > 0)) continue; try { burst(e.x, e.y - 24 * HS, 18, ['#c48cff', '#ff6b6b', '#6fb8ff', '#ffffff'], 220, 5, .5); } catch (e2) {}
        const s0 = SRC; SRC = 'polarity'; try { if (h.k === 'z' && typeof hurtZ === 'function') hurtZ(e, 1e6, null, 'arcane'); else if (typeof hurtCreature === 'function') hurtCreature(e, h.k, 1e6, 'arcane'); } catch (e2) {} finally { SRC = s0; } }
      if (L.length) { try { text(c.x, c.y - 90 * HS, L.length > 1 ? 'CONSUMED ×' + L.length : 'CONSUMED', '#e6d0ff', true); shake = Math.max(shake, 10); } catch (e) {} } } }

  /* ---------------- Draw: what its catch is dragged past takes 2 damage ---------------- */
  function drawTick() { for (const c of orbs()) { if (!c.draw || c.out || !c.held || !c.held.some(h => !h.gone)) continue; c.swept = c.swept || new Set(); const held = new Set(c.held.map(h => h.e));
      let list = []; try { list = enemyCreatures(c.o); } catch (e) {}
      for (const q of list) { const e = q.e; if (!e || e.x === undefined || held.has(e) || c.swept.has(e)) continue; if (Math.hypot(e.x - c.x, e.y - c.y) < 30) { c.swept.add(e); const s0 = SRC; SRC = 'polarity'; try { if (q.k === 'z' && typeof hurtZ === 'function') hurtZ(e, 2, null, 'crush'); else hurtCreature(e, q.k, 2, 'crush'); } catch (e2) {} finally { SRC = s0; } try { text(e.x, e.y - 50 * HS, '2', '#bfe6ff'); } catch (e2) {} } }
      const f = c.o.foe; if (f && !f.dead && !held.has(f) && !c.swept.has(f) && Math.hypot(f.x - c.x, f.y - c.y) < 30) { c.swept.add(f); const s0 = SRC; SRC = 'polarity'; try { damage(f, 2, 0, 0, '#bfe6ff'); } finally { SRC = s0; } } } }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) { const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && ents.length && !ended) { collapseTick(dt); drawTick(); } else if (ended) caught.clear(); } catch (e) { try { window.logCrash && logCrash(e, 'v126'); } catch (e2) {} }
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { caught.clear(); return _sd.apply(this, arguments); }; }

  /* ---------------- order screen: Zodiac lists the upgrades you have taken ---------------- */
  if (typeof renderBook === 'function') { const _rb = renderBook; window.renderBook = renderBook = function () { const r = _rb.apply(this, arguments);
      try { const b = M.me.book, sel = M.swapSel ?? (M.lastAdded >= 0 ? M.lastAdded : 0), k = b[sel]; if (k === 'zodiac' || k === 'crimsonzodiac') { const box = document.querySelector('#detail .ostat'); if (box) { box.querySelectorAll('i:not(.r)').forEach(i => i.remove());
            const got = (UPG[k] || []).filter(u => M.me.up.has(k + '.' + u.id)); box.insertAdjacentHTML('beforeend', got.length ? got.map(u => `<i>${u.n}</i>`).join('') : '<i>No upgrades yet</i>'); } } } catch (e) {}
      return r; }; }

  /* ---------------- Survival round curtain: the horde on top, your team below ---------------- */
  const IC = {
    horde: '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 4 6.500 4 10.500c0 2.300 1.100 4 2.600 5V19h2.400v-2h2v2h2v-2h2v2H17v-3.500c1.500-1 3-2.700 3-5C20 6.500 17 3 12 3z" fill="#e8e0ff" stroke="#000" stroke-width="1.600" stroke-linejoin="round"/><circle cx="9" cy="11" r="2" fill="#000"/><circle cx="15" cy="11" r="2" fill="#000"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M2 15c2.500 0 2.500-3 5-3s2.500 3 5 3 2.500-3 5-3 2.500 3 5 3M2 9c2.500 0 2.500-3 5-3s2.500 3 5 3 2.500-3 5-3 2.500 3 5 3" fill="none" stroke="#9fd8ff" stroke-width="2.600" stroke-linecap="round"/></svg>',
    kill: '<svg viewBox="0 0 24 24"><path d="M14.500 3H21v6.500L10 20.500 7.500 18 18.500 7z" fill="#ffd45e" stroke="#000" stroke-width="1.600" stroke-linejoin="round"/><path d="M5 15.500 8.500 19M3.500 20.500l3-3" stroke="#000" stroke-width="2.600" stroke-linecap="round"/><path d="M5 15.500 8.500 19" stroke="#c9861a" stroke-width="1.400" stroke-linecap="round"/></svg>',   /* a gold sword: enemies defeated (a red X read as failures) */
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (typeof startDuel === 'function') { const _sd2 = startDuel; window.startDuel = startDuel = function () { const r = _sd2.apply(this, arguments); try { const s = M && M.sv; if (s) { s.k0 = s.kills || 0; s.waveNo = s.endless ? 0 : Math.min(2, M.score.me) + 1; } } catch (e) {} return r; }; }
  if (typeof roundCurtain === 'function') { const _rc = roundCurtain; window.roundCurtain = roundCurtain = function () { const r = _rc.apply(this, arguments);
      try { const s = M && M.sv; if (s) { const top = $('rcTop'), bot = $('rcBot'), k = Math.max(0, (s.kills || 0) - (s.k0 || 0));
          top.innerHTML = `<div class="svc-top"><span class="svc-h">${IC.horde}</span><span class="svc-chip">${IC.wave}<b>${s.endless ? '∞' : s.waveNo || 1}</b></span><span class="svc-chip">${IC.kill}<b>${k}</b></span></div>`;
          const row = (look, n, hand, dead) => `<div class="svc-row${dead ? ' dead' : ''}"><canvas width="96" height="96"></canvas><div class="svc-g"><b>${esc(n)}</b><span>${hand.filter(q => ICON[q]).map(q => `<img src="${ICON[q]}">`).join('')}</span></div></div>`;
          const pt = s.pt; bot.innerHTML = `<div class="svc-team">${row(PR.look, PR.name, M.me.book)}${pt ? row(pt.look, pt.n, pt.hand, s.P && s.P.dead) : ''}</div>`;
          const cvs = bot.querySelectorAll('canvas'); try { drawAva(cvs[0], lookWiz(PR.look)); if (pt && cvs[1]) drawAva(cvs[1], lookWiz(pt.look || PR.look)); } catch (e) {} } } catch (e) { try { window.logCrash && logCrash(e, 'svCurtain'); } catch (e2) {} }
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `
  .svc-top{display:flex;align-items:center;gap:12px}.svc-h{width:74px;height:74px;border-radius:20px;border:4px solid #000;background:radial-gradient(circle at 40% 35%,#5a2340,#1c0a14);display:grid;place-items:center;box-shadow:0 5px 0 #000,0 0 24px #ff5d6c88}.svc-h svg{width:48px;height:48px}
  .svc-chip{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:16px;border:3px solid #000;background:#170f2a;box-shadow:0 4px 0 #000}.svc-chip svg{width:28px;height:28px}.svc-chip b{font:26px 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke}
  .svc-team{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px}.svc-row{display:flex;align-items:center;gap:10px}.svc-row canvas{width:58px!important;height:58px!important;border-radius:16px!important;border:3px solid #000!important}
  .svc-g{display:flex;flex-direction:column;gap:4px;min-width:0}.svc-g b{font:19px 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.svc-g span{display:flex;gap:4px}.svc-g img{width:28px;height:28px;border-radius:8px;border:2px solid #000;background:#170f2a}
  .svc-row.dead{opacity:.55}.svc-row.dead canvas{filter:grayscale(1)}`;
  document.head.appendChild(css);
})();
