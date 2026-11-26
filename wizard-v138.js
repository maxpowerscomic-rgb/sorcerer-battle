/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.18
   1. The draft and order screens' top bar (you · round · rival) is centred: the pause button no longer pushes it right.
   2. Abilities: drag an ability in your Battle Hand onto another slot to swap them. A tap still opens the ability.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- 2. drag to reorder the hand ---------------- */
  let D = null;   // { el, i, x0, y0, on, ghost, over }
  const slots = () => [...document.querySelectorAll('#handBar .hs .hsl')];
  function bind() { slots().forEach((el, i) => { el.dataset.hi = i; if (el._dd) return; el._dd = 1; el.style.touchAction = 'pan-y'; el.addEventListener('pointerdown', down);
      el.addEventListener('click', e => { if (el._noClick) { e.stopImmediatePropagation(); e.preventDefault(); el._noClick = 0; } }, true); });
    const hl = document.querySelector('#handBar .hl small'); if (hl && PR.hand.length >= 2 && !hl.querySelector('.dd-hint') && /Tap an ability/.test(hl.textContent)) hl.insertAdjacentHTML('beforeend', '<span class="dd-hint"> · drag to reorder</span>'); }
  function down(e) { const el = e.currentTarget, i = +el.dataset.hi; if (!PR.hand[i]) return; D = { el, i, x0: e.clientX, y0: e.clientY, on: false, id: e.pointerId };
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel); }
  function move(e) { if (!D || e.pointerId !== D.id) return; const dx = e.clientX - D.x0, dy = e.clientY - D.y0;
    if (!D.on) { if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 12) cancel(); return; }   // vertical: let the page scroll
      D.on = true; const r = D.el.getBoundingClientRect(); D.ghost = D.el.cloneNode(true); D.ghost.className = 'hsl dd-ghost'; Object.assign(D.ghost.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: 999, pointerEvents: 'none' }); document.body.appendChild(D.ghost); D.r = r; D.el.classList.add('dd-src'); try { sfx('ui_click'); } catch (er) {} }
    e.preventDefault(); D.ghost.style.left = (D.r.left + dx) + 'px'; D.ghost.style.top = (D.r.top + dy) + 'px';
    const t = document.elementFromPoint(e.clientX, e.clientY), s = t && t.closest && t.closest('#handBar .hs .hsl'); if (D.over && D.over !== s) D.over.classList.remove('dd-over'); D.over = s && s !== D.el ? s : null; if (D.over) D.over.classList.add('dd-over'); }
  function up(e) { if (!D) return; const d = D; finish(); if (!d.on) return; d.el._noClick = 1; if (!d.over) return; const j = +d.over.dataset.hi, H = PR.hand.slice();
    if (j >= H.length) { const [k] = H.splice(d.i, 1); H.push(k); } else { const t = H[j]; H[j] = H[d.i]; H[d.i] = t; }
    PR.hand = H; try { save(); sfx('ui_deal'); refreshMeta(); } catch (er) {} try { renderSpells(); } catch (er) {} }
  function cancel() { if (!D) return; finish(); }
  function finish() { if (D) { if (D.ghost) D.ghost.remove(); D.el.classList.remove('dd-src'); if (D.over) D.over.classList.remove('dd-over'); } D = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); }
  if (typeof renderSpells === 'function') { const _rs = renderSpells; window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments); try { bind(); } catch (e) {} return r; }; }
  setInterval(() => { try { if ($('spells') && $('spells').classList.contains('on')) bind(); } catch (e) {} }, 700);
  window.HAND_DD = { bind };

  const css = document.createElement('style');
  css.textContent = `/* 1. the score bar: three centred columns; the pause button sits on the left edge, out of the flow */
  .score:has(> .pbtn){position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;column-gap:10px;padding-left:54px;padding-right:54px}
  .score > .pbtn{position:absolute;left:10px;top:50%;transform:translateY(-50%);margin:0}
  .score:has(> .pbtn) > .pbtn + .side{justify-self:stretch;justify-content:flex-end;min-width:0;overflow:hidden}.score:has(> .pbtn) > .side > *{flex:none}.score:has(> .pbtn) > .side > .sdn{flex:0 1 auto;min-width:0}.score:has(> .pbtn) > .rd + .side{justify-self:stretch;justify-content:flex-start;min-width:0;overflow:hidden}.score:has(> .pbtn) > .side:has(.pips){flex-direction:column;justify-content:center;gap:3px;line-height:1.05;padding:2px 0}.score:has(> .pbtn) > .pbtn + .side:has(.pips){align-items:flex-end}.score:has(> .pbtn) > .rd + .side:has(.pips){align-items:flex-start}.score:has(> .pbtn) > .side .pips{order:2;gap:3px}.score:has(> .pbtn) > .side .pips i{width:10px;height:10px}.score:has(> .pbtn) > .side:has(.pips) .sdn,.score:has(> .pbtn) > .side:has(.pips){max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#metatop{gap:8px}#metatop .curs{flex:none}#metatop .prof{flex:1 1 auto;min-width:0}#metatop .prof > div:last-child{flex:1 1 auto;min-width:0}#metatop .pname{display:flex;align-items:center;min-width:0}#pName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#pTitle{display:flex;align-items:center;flex-wrap:nowrap;min-width:0;overflow:hidden}#pTitle .tn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#pTitle .cs{flex:none}@media (max-width:410px){#pEmb{display:none}#pTitle .cs{display:none}#pName{font-size:16px}#metatop .curs{gap:4px}#metatop .cur{padding-left:5px;padding-right:7px;font-size:14px}#metatop .prof{gap:7px}}.score:has(> .pbtn):has(.svlives){grid-template-columns:minmax(0,1fr) auto auto;padding-right:14px}.score:has(> .pbtn) .sdn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #handBar .hsl.dd-src{opacity:.35}#handBar .hsl.dd-over{outline:3px solid #fff;outline-offset:2px;transform:scale(1.06)}.dd-ghost{transform:scale(1.12) rotate(-4deg);box-shadow:0 10px 22px #000a!important;border-radius:12px}.dd-hint{color:#ffd45e}`;
  document.head.appendChild(css);
})();
