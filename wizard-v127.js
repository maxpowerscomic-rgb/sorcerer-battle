/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33
   Hoot's next steps on the home screen, short stat chips on draft cards, summon health bars,
   a readable partner hand in Survival, and the login reward after your first match.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- the login reward waits for your first match of the session ---------------- */
  if (typeof showRewards === 'function') { const _sr = showRewards; window.showRewards = showRewards = function () { window.MATCH_DONE_SESSION = 1; return _sr.apply(this, arguments); }; }

  /* ---------------- pause menu says Survival in Survival ---------------- */
  if (typeof openPause === 'function') { const _op = openPause; window.openPause = openPause = function () { const r = _op.apply(this, arguments);
      try { if (M && M.sv) { const sub = document.querySelector('#pzBody .sub'); if (sub) sub.textContent = `Survival · ${M.sv.endless ? 'Endless' : 'Wave ' + (Math.min(2, M.score.me) + 1) + ' of 3'}${M.sv.pt ? ' · with ' + M.sv.pt.n : ''}`; } } catch (e) {}
      return r; }; }

  /* ---------------- Hoot: what to do next ---------------- */
  // a Hoot button above the fighter button on the home screen; it always has a few concrete suggestions, and a dot when one is ready right now
  function goals() { const out = [];
    try { if (typeof loginDue === 'function' && loginDue()) out.push({ ready: 1, ic: 'gift', t: 'Your daily login reward is ready.', go: 'openLogin()' }); } catch (e) {}
    try { const st = window.CH_DEBUG && CH_DEBUG.chState(); if (st) { const done = st.list.filter(c => c.done && c.claimed === 0).length; if (done) out.push({ ready: 1, ic: 'gold', t: `${done} challenge${done > 1 ? 's' : ''} finished. Collect the gold.`, go: 'openChallenges()' }); } } catch (e) {}
    try { const un = unlockedSpells(), cand = []; for (const k of un) { const s = PR.spells[k]; if (!s || s.lvl >= MAXL) continue; const need = CARDS[s.lvl] || 1, cost = COST[s.lvl] || 0; if (s.cards >= need) cand.push({ k, ready: PR.coins >= cost, f: 2, cost }); else cand.push({ k, ready: 0, f: s.cards / need, left: need - s.cards }); }
      cand.sort((a, b) => b.f - a.f); const inHand = c => PR.hand.includes(c.k) ? 1 : 0;
      const up = cand.filter(c => c.f >= 2 && c.ready).sort((a, b) => inHand(b) - inHand(a))[0]; if (up) out.push({ ready: 1, k: up.k, t: `${SP[up.k].n} can level up now.`, go: `nav('spells');setTimeout(()=>openSpell('${up.k}'),200)` });
      const close = cand.filter(c => c.f < 2 && c.f >= .5).sort((a, b) => (inHand(b) - inHand(a)) || (b.f - a.f))[0]; if (close) out.push({ k: close.k, t: `${SP[close.k].n} is ${close.left} skill point${close.left > 1 ? 's' : ''} from level ${PR.spells[close.k].lvl + 1}.${PR.hand.includes(close.k) ? '' : ' Put it in your hand to earn them.'}`, go: `nav('spells');setTimeout(()=>openSpell('${close.k}'),200)` }); } catch (e) {}
    try { const L = window.LADDER || [], won = (PR.ladder && PR.ladder.won) || {}, i = L.findIndex(r => !r.adv && !won[r.id]); if (i >= 0) { const r = L[i], gate = i * 75; out.push({ ic: 'ladder', t: PR.trophies >= gate ? `Next on the Ladder: ${r.n}. First win pays ${r.adv ? 100 : 10} gems.` : `${r.n} opens on the Ladder at ${gate} trophies (${gate - PR.trophies} to go).`, go: 'openLadder()' }); } } catch (e) {}
    try { if (PR.tokens > 0) out.push({ ready: 1, ic: 'token', t: `You have ${PR.tokens} Spell Token${PR.tokens > 1 ? 's' : ''} to spend.`, go: "nav('spells')" }); } catch (e) {}
    try { if (!(Array.isArray(PR.svBest) && PR.svBest.length)) out.push({ ic: 'club', t: 'Try Survival in the Club: waves of enemies, with a partner if you like.', go: "PR.clubTab='sv';nav('friends')" }); } catch (e) {}
    try { const st = window.CH_DEBUG && CH_DEBUG.chState(); if (st) { const best = st.list.filter(c => !c.done).map(c => ({ c, f: c.p })).sort((a, b) => b.f - a.f)[0]; if (best && out.length < 5) out.push({ ic: 'gold', t: 'Work on today\'s challenges for extra gold.', go: 'openChallenges()' }); } } catch (e) {}
    return out.slice(0, 5); }
  const ICS = { gift: '🎁', gold: '🪙', ladder: '🪜', token: '🔮', club: '⚔️' };
  window.openHootGoals = function () { const G = goals();
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="hg-head"><canvas id="hgOwl" width="96" height="96"></canvas><div><b>Hoot</b><span>Here is what I would do next.</span></div></div>
      <div class="hg-list">${G.map(g => `<button class="hg-row${g.ready ? ' ready' : ''}" onclick="closeSheet();${g.go.replace(/"/g, '&quot;')}">${g.k ? `<img src="${ICON[g.k]}">` : `<i>${ICS[g.ic] || '★'}</i>`}<span>${esc(g.t)}</span><em>Go</em></button>`).join('') || '<div class="ssub">Nothing pressing. Go win a match!</div>'}</div>`;
    $('sheet').classList.add('on'); try { const c = $('hgOwl'), x = c.getContext('2d'); x.translate(48, 104); x.scale(2, 2); drawPet(x, 'owl', performance.now() / 1000, 1); } catch (e) {} };
  function hootBtn() { const st = document.querySelector('#home .stage'); if (!st) return; let b = $('hgBtn'); if (!b) { st.insertAdjacentHTML('beforeend', '<button id="hgBtn" onclick="openHootGoals()" aria-label="Hoot\'s suggestions"><canvas width="96" height="96"></canvas><i></i></button>'); b = $('hgBtn'); }
    let ready = false; try { ready = goals().some(g => g.ready); } catch (e) {} b.classList.toggle('ready', ready); }
  function hootFace() { try { const c = document.querySelector('#hgBtn canvas'); if (!c || !$('home').classList.contains('on')) return; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 96, 96); x.translate(48, 104); x.scale(2, 2); drawPet(x, 'owl', performance.now() / 1000, 1); } catch (e) {} }
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { hootBtn(); } catch (e) {} return r; }; }
  setInterval(hootFace, 120); try { hootBtn(); } catch (e) {}

  /* ---------------- draft cards: a short stat line, not a sentence ---------------- */
  // e.g. a sword with 12, a heart with 40, ×3. The role word already names the effect; a hold still opens the full page.
  const COUNT = { zombies: w => U(w, 'zombies', 'legion') ? 7 : U(w, 'zombies', 'horde') ? 5 : 3, icewall: w => U(w, 'icewall', 'wide') ? 7 : 5, fireball: w => U(w, 'fireball', 'triple') ? 3 : U(w, 'fireball', 'twin') ? 2 : 1, lightning: w => U(w, 'lightning', 'tribolt') ? 3 : U(w, 'lightning', 'twinbolt') ? 2 : 1, dissect: w => U(w, 'dissect', 'triple') ? 3 : 1 };
  const SVGI = { dmg: '<svg viewBox="0 0 24 24"><path d="M14.500 3H21v6.500L10 20.500 7.500 18 18.500 7z" fill="currentColor"/><path d="M5 15.500 8.500 19M3.500 20.500l3-3" stroke="currentColor" stroke-width="2.600" stroke-linecap="round"/></svg>', hp: '<svg viewBox="0 0 24 24"><path d="M12 21C5 15.500 2.500 12 2.500 8.500A4.800 4.800 0 0 1 12 6a4.800 4.800 0 0 1 9.500 2.500C21.500 12 19 15.500 12 21z" fill="currentColor"/></svg>' };
  function chips(k, me) { const lv = (PR.spells[k] && PR.spells[k].lvl) || 1, st = STATS[k] || {}, at = (a) => a ? a[Math.min(lv, a.length) - 1] : null, out = []; const fmt = v => (Math.round(v * 10) / 10).toString();
    if (st.dmg) out.push(`<span class="dc2">${SVGI.dmg}${fmt(at(st.dmg))}</span>`); else if (st.dps) out.push(`<span class="dc2">${SVGI.dmg}${fmt(at(st.dps))}/s</span>`);
    if (st.hp) out.push(`<span class="dc2 h">${SVGI.hp}${fmt(at(st.hp))}</span>`);
    const n = COUNT[k] ? COUNT[k](me) : 1; if (n > 1) out.push(`<span class="dc2 n">×${n}</span>`);
    return out.slice(0, 3).join(''); }
  if (typeof renderDraft === 'function') { const _rd = renderDraft; window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments);
      try { document.querySelectorAll('#cards .card').forEach(el => { const c = M.offer[+el.dataset.i]; if (!c || c.type === 'up') return; const h = el.querySelector('.cmeta') || el.querySelector('.hold'); if (!h) return; const html = chips(c.k, { up: M.me.up }); if (html) { h.className = 'dcrow'; h.innerHTML = html; h.style.display = 'flex'; } }); } catch (e) {}
      return r; }; }

  /* ---------------- (1.0.33.1) never draw something that has no position yet ----------------
     A partner's cast happens after the frame's update, so new Arcane Orbs had no position when the frame was drawn and the draw threw. */
  for (const n of ['drawOrb', 'drawBubble', 'drawRune', 'drawSwarm', 'drawArrow']) { const f = window[n]; if (typeof f !== 'function') continue;
    window[n] = function (o) { const e = o && (o.x !== undefined ? o : null); if (e && (!isFinite(e.x) || !isFinite(e.y))) return; return f.apply(this, arguments); }; try { (0, eval)(n + ' = window.' + n); } catch (e) {} }

  /* ---------------- summons: a health bar from the first hit until they fall ---------------- */
  // in every mode; green for yours, red for the enemy's. (Survival casters draw their own.)
  function bars() { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); const me = ents[0];
    const one = (e, mx, w0, top, mine) => { if (!(e.hp > 0) || !mx) return; if (e.hp < mx - .01) e._hurt = 1; if (!e._hurt) return; const f = Math.max(0, Math.min(1, e.hp / mx)), W0 = w0, y = top;
      x.fillStyle = '#000'; x.fillRect(e.x - W0 / 2 - 1, y - 1, W0 + 2, 6); x.fillStyle = '#3a2a4a'; x.fillRect(e.x - W0 / 2, y, W0, 4); x.fillStyle = mine ? '#6fe39a' : '#ff5a6e'; x.fillRect(e.x - W0 / 2, y, W0 * f, 4); };
    for (const z of zombies) { if (z.svCaster || z.rise < 1) continue; const sz = z.beast ? (z.beast.sz || 1) : 1; one(z, z.mx, 24 * Math.min(1.8, sz), z.beast ? z.y - 46 * sz * 1.62 * SC - 6 : z.y - 56 * HS, z.o === me); }   /* beasts are drawn about twice their base size tall */
    for (const g of (typeof golems !== 'undefined' ? golems : [])) one(g, g.max, g.mini ? 20 : 34, g.y - (g.mini ? 46 : 84) * HS, g.o === me);
    for (const a of (typeof archers !== 'undefined' ? archers : [])) one(a, a.max, 26, a.y - 76 * HS, a.o === me);
    x.restore(); }
  if (typeof render === 'function') { const _r = render; window.render = render = function () { const r = _r.apply(this, arguments); try { if (typeof ents !== 'undefined' && ents && ents.length && $('battle').classList.contains('on')) bars(); } catch (e) {} return r; }; }

  const css = document.createElement('style');
  css.textContent = `
  #hgBtn{position:absolute;right:12px;bottom:134px;z-index:2;width:56px;height:56px;border-radius:50%;border:3px solid #000;padding:0;overflow:visible;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240);box-shadow:0 3px 0 #000;cursor:pointer}
  #hgBtn canvas{width:100%;height:100%;border-radius:50%;display:block}#hgBtn i{display:none;position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:#ff4a5a;border:2px solid #000}#hgBtn.ready i{display:block}
  .hg-head{display:flex;align-items:center;gap:12px;margin:2px 0 12px}.hg-head canvas{width:64px;height:64px;border-radius:50%;border:3px solid #000;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240)}
  .hg-head b{display:block;font:22px 'Lilita One';font-weight:400;color:#f3ecff}.hg-head span{font:800 13px Nunito;color:#d6cbf5}
  .hg-list{display:flex;flex-direction:column;gap:8px;padding-bottom:20px}.hg-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border-radius:14px;border:2px solid #000;background:#1a1236;color:#f3ecff;box-shadow:0 3px 0 #000;cursor:pointer}
  .hg-row img{width:36px;height:36px;border-radius:10px;border:2px solid #000;flex:none}.hg-row i{width:36px;height:36px;flex:none;display:grid;place-items:center;font-size:20px;font-style:normal;border-radius:10px;border:2px solid #000;background:#2b2050}
  .hg-row span{flex:1;font:800 13.5px/1.35 Nunito}.hg-row em{font:14px 'Lilita One';font-style:normal;color:#1a0f00;background:linear-gradient(#ffe27a,#f0a830);border:2px solid #000;border-radius:10px;padding:5px 10px}.hg-row.ready{background:#2b2050;outline:2px solid #ffd45e}
  .card .dcrow{display:flex;gap:6px;margin-top:5px;flex-wrap:wrap}.dc2{display:inline-flex;align-items:center;gap:3px;font:15px 'Lilita One';color:#3a2410;background:#fff6dd;border:2px solid #3a2410;border-radius:9px;padding:1px 7px 1px 5px}.dc2 svg{width:14px;height:14px;color:#a83218}.dc2.h svg{color:#c41e3a}.dc2.n{color:#3a2410}
  #battle.sv-on #qF .qi{opacity:1!important;width:32px;height:32px}#battle.sv-on #qF{gap:6px;align-items:center}#battle.sv-on #qF::before{content:"Partner";font:12px 'Lilita One';letter-spacing:.4px;color:#bfe6ff;margin-right:2px}
  .svlives{color:#ff5a6e;letter-spacing:1px}.svlives u{text-decoration:none;color:#ffffff33}`;
  document.head.appendChild(css);
  // Survival: mark the battle screen so the partner's hand is drawn large and labelled
  if (typeof startDuel === 'function') { const _sd = startDuel; window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments); try { $('battle').classList.toggle('sv-on', !!(M && M.sv && M.sv.pt)); } catch (e) {} return r; }; }
})();
