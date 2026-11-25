/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.5
   Halt a cast: a button that pauses your next cast for up to 1 second (tap again to let it go early),
   then rests for 8 seconds. While held, a pause sign floats over the caster, so the other side can see it.
   The AI has the same tool and uses it to wait out a Counter Stance, a Boundary or a shield.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const HOLD = 1, REST = 8;

  function canHold(w) { return w && !w.dead && !ended && !(introT > 0) && !(w.holdT > 0) && !((w.holdCd || 0) > T); }
  function startHold(w) { if (!canHold(w)) return false; w.holdT = HOLD; w.holdCd = T + REST; try { sfx('ui_click', { x: w.x, rate: .7 }); } catch (e) {} return true; }
  function release(w) { if (w && w.holdT > 0) w.holdT = 0; }
  window.castHold = function () { const me = typeof ents !== 'undefined' && ents && ents[0]; if (!me) return; if (me.holdT > 0) release(me); else startHold(me); paint(); };

  // the AI waits out a punish that is set up against it, when its pause is ready
  function aiHold(f, me, dt) { if (!f || f.svAnchor || f.isDummy || !canHold(f)) return; const k = f.book && f.book[f.i]; if (!k || !SP[k]) return; const t = castT(f, k); if (f.p < t - .25 || f.p >= t) return;
    const trap = me.counter || me.boundary || me.bndWin > 0 || (typeof shieldOf === 'function' && shieldOf(me)); if (trap && Math.random() < .6) startHold(f); }

  if (typeof update === 'function') { const _u = update; window.update = update = function (dt) {
      try { if (typeof ents !== 'undefined' && ents && ents.length && !ended && !(introT > 0)) { aiHold(ents[1], ents[0], dt);
          for (const w of ents) if (w.holdT > 0 && !w.dead) { const k = w.book && w.book[w.i]; if (k && SP[k]) { const t = castT(w, k); w.p = Math.min(w.p, t - 2.2 * dt); } } } } catch (e) {}
      const r = _u.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents) for (const w of ents) if (w.holdT > 0) { w.holdT -= dt; if (w.holdT <= 0 || w.dead || ended) w.holdT = 0; } } catch (e) {}
      return r; }; }
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { for (const w of ents) { w.holdT = 0; w.holdCd = 0; } hud(); } catch (e) {} return r; }; }

  /* ---------------- the button and the visible tell ---------------- */
  function hud() { const b = $('battle'); if (!b) return; let h = $('holdBtn');
    if (!h) { b.insertAdjacentHTML('beforeend', '<button id="holdBtn" aria-label="Halt your next cast"><svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.200" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.200" fill="currentColor"/></svg><i></i></button>'); h = $('holdBtn');
      h.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); castHold(); }); }
    paint(); }
  function paint() { const h = $('holdBtn'); if (!h) return; const me = typeof ents !== 'undefined' && ents && ents[0]; if (!me) return; const held = me.holdT > 0, cd = Math.max(0, (me.holdCd || 0) - T);
    h.classList.toggle('on', held); h.classList.toggle('cd', !held && cd > 0); h.style.setProperty('--p', held ? 1 - me.holdT / HOLD : cd > 0 ? 1 - cd / REST : 1);
    h.style.display = (typeof M !== 'undefined' && M && M.practice && window.YARD && YARD.on) ? 'none' : ''; }
  setInterval(() => { try { if ($('battle') && $('battle').classList.contains('on')) paint(); } catch (e) {} }, 100);
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments);
      try { if (typeof ents !== 'undefined' && ents && $('battle').classList.contains('on')) { const x = ctx; for (const w of ents) { if (!(w.holdT > 0) || w.dead || w.svAnchor) continue; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); const cx = w.x, cy = w.y - 112 * HS, k = w.holdT / HOLD;
            x.fillStyle = '#170f2a'; x.strokeStyle = '#000'; x.lineWidth = 2.5; x.beginPath(); x.arc(cx, cy, 13, 0, 7); x.fill(); x.stroke();
            x.strokeStyle = '#9fd8ff'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 13, -Math.PI / 2, -Math.PI / 2 + k * 6.283); x.stroke();
            x.fillStyle = '#e6f6ff'; x.fillRect(cx - 5.5, cy - 6, 3.6, 12); x.fillRect(cx + 1.9, cy - 6, 3.6, 12); x.restore(); } } } catch (e) {}
      return r; }; }

  const css = document.createElement('style');
  css.textContent = `#holdBtn{position:absolute;left:8px;top:calc(50% + 100px);z-index:4;width:38px;height:38px;border-radius:12px;border:2px solid #000;background:#1a1236cc;color:#e6f6ff;display:grid;place-items:center;padding:0;box-shadow:0 2px 0 #000;touch-action:none}
  #holdBtn svg{width:20px;height:20px;position:relative;z-index:1}#holdBtn i{position:absolute;inset:3px;border-radius:9px;background:conic-gradient(#9fd8ff calc(var(--p,1)*1turn),transparent 0);opacity:.0}
  #holdBtn.on{background:#2b4a8a;outline:2px solid #9fd8ff}#holdBtn.on i{opacity:.35}#holdBtn.cd{color:#7a6e9a}#holdBtn.cd i{opacity:.28}`;
  document.head.appendChild(css);
  window.CAST_HOLD = { startHold, release, HOLD, REST };
})();
