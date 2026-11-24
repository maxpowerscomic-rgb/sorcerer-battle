/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.9  Rematch, and the music chooser
   After a ranked or casual loss you can pay gold to fight the same rival again, straight away, with the
   same hand. Ranked stakes: win and the trophies you lost come back plus 10; lose again and you lose
   double. One rematch per match. Not offered on the Ladder or in the Fight Club (those are free to retry).
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const COST = 75, LOSS = 18, WIN = 30, BONUS = 10;
  window.ECON = Object.assign(window.ECON || {}, { rematchGold: COST });
  const can = () => typeof M !== 'undefined' && M && M.score.me < M.score.foe && !M.rematch && !M.ladder && !M.bounty && !M.practice && !window.ONB_ACTIVE && (M.mode === 'ranked' || M.mode === 'casual');
  window.rematch = function () { if (!can()) return; if ((PR.coins || 0) < COST) return toast(`A rematch costs ${COST} gold`);
    const old = M, hand = (old.handAt || PR.hand).slice(); PR.coins -= COST; PR.hand = hand; try { save(); sfx('ui_deal'); } catch (e) {}
    newMatch({ name: old.foeName, look: old.foeLook, profile: old.profile, mode: old.mode, arena: old.arena });
    try { M.rematch = { ranked: old.mode === 'ranked' }; M.foeRank = old.foeRank; if (old.foe && old.foe.pool) M.foe.pool = old.foe.pool.slice(); if (typeof synergyOf === 'function') M.foeSyn = synergyOf(M.foe.pool); } catch (e) {} };
  if (typeof newMatch === 'function') { const _nm = newMatch; window.newMatch = newMatch = function () { const r = _nm.apply(this, arguments); try { if (M) M.handAt = (PR.hand || []).slice(); } catch (e) {} return r; }; }
  if (typeof showRewards === 'function') { const _sr = showRewards;
    window.showRewards = showRewards = function () { const fresh = M && !M._rmDone, t0 = PR.trophies; const r = _sr.apply(this, arguments);
      try { const won = M.score.me > M.score.foe;
        if (M.rematch) { const md = $('rwMode'); if (md) md.textContent = 'Rematch · vs ' + M.foeName;
          if (fresh) { M._rmDone = 1; if (M.rematch.ranked) { const want = won ? LOSS + BONUS : -LOSS * 2, got = PR.trophies - t0; PR.trophies = Math.max(0, PR.trophies + (want - got)); M._rmT = PR.trophies - t0; try { save(); refreshMeta(); } catch (e) {} } }
          if (M.rematch.ranked && M._rmT !== undefined) { const el = $('rwT'); if (el) el.textContent = (M._rmT >= 0 ? '+' : '') + M._rmT; }
          let n = $('rwRm'); if (n) n.remove(); const at = $('rwBtn'); if (at) at.insertAdjacentHTML('beforebegin', `<div id="rwRm" class="rmnote">${M.rematch.ranked ? (won ? `Rematch won: your ${LOSS} trophies are back, plus ${BONUS}.` : `Rematch lost: double the trophy loss.`) : (won ? 'Rematch won.' : 'Rematch lost.')}</div>`); }
        else { if (fresh) M._rmDone = 1; let n = $('rwRm'); if (n) n.remove();
          if (can()) { const ranked = M.mode === 'ranked', poor = (PR.coins || 0) < COST; $('rwBtn').insertAdjacentHTML('beforebegin', `<div id="rwRm"><button class="hbtn rmbtn" onclick="rematch()" ${poor ? 'disabled' : ''}>↻ Rematch <span class="ci coin-i"></span>${COST}</button><small>${ranked ? `Same rival, same hand. Win: your ${LOSS} trophies back, plus ${BONUS}. Lose: ${LOSS * 2} more.` : 'Same rival, same hand.'}${poor ? ' Not enough gold.' : ''}</small></div>`); } } } catch (e) {}
      return r; }; }
  /* ---------------- music: what is playing, and a chooser grouped by Main menu / Battle ---------------- */
  const WHEN = { menu: 'Menus', p1: 'Rounds 1-2', p2: 'Rounds 3-4', p3: 'Rounds 5-6', final: 'Round 7', battle: 'Any round' };
  const TR = () => window.MUSIC_TRACKS || [], nameOf = id => { const t = TR().find(q => q[0] === id); return t ? t[1] : null; };
  const nowId = () => { try { return AU.musId || AU.want || null; } catch (e) { return null; } };
  const pickNow = () => { const v = (typeof SET === 'function' && SET().bgmBattle) || 'phase'; return v === 'random' ? 'shuffle' : v; };
  let musOpen = false;
  window.openMusic = function (keep) { if (!keep) musOpen = false; const now = nameOf(nowId()), sel = pickNow(), fav = (typeof SET === 'function' && SET().bgmFav) || [];
    const row = ([id, n, cat]) => `<div class="mu2 ${sel === id ? 'on' : ''} ${nowId() === id ? 'play' : ''}"><button class="mu2n" onclick="${cat === 'menu' ? `playTrack('${id}');setTimeout(()=>openMusic(1),60)` : `musSet('${id}')`}"><b>${n}</b><small>${WHEN[cat] || ''}</small></button><button class="mfav ${fav.includes(id) ? 'on' : ''}" onclick="musFav('${id}')" aria-label="Favourite">${fav.includes(id) ? '★' : '☆'}</button></div>`;
    const mode = (id, n, when) => `<div class="mu2 ${sel === id ? 'on' : ''}"><button class="mu2n" onclick="musSet('${id}')"><b>${n}</b><small>${when}</small></button></div>`;
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Music</div>
      <div class="munow"><i>♫</i><span><small>Now playing</small><b>${now || 'Nothing yet'}</b></span><button class="hbtn" onclick="musToggle()">${musOpen ? 'Done' : 'Change'}</button></div>
      ${musOpen ? `<div class="muh">Main menu</div>${TR().filter(t => t[2] === 'menu').map(row).join('')}
      <div class="muh">Battle</div>${mode('phase', 'Auto', 'A new song every 2 rounds')}${mode('shuffle', 'Random', '★ favourites first')}${TR().filter(t => t[2] !== 'menu').map(row).join('')}` : ''}
      <button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050);margin-top:10px" onclick="sheetBack()">Back</button>`;
    $('sheet').classList.add('on'); };
  window.musToggle = function () { musOpen = !musOpen; openMusic(1); };
  window.musSet = function (id) { try { setBgm('battle', id); } catch (e) {} setTimeout(() => openMusic(1), 60); };
  window.musFav = function (id) { const f = (SET().bgmFav = SET().bgmFav || []), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); try { save(); } catch (e) {} openMusic(1); };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML;
    window.settingsHTML = settingsHTML = function () { let h = _sh.apply(this, arguments);
      try { h = h.replace(/<div class="opt"><span>Battle music<\/span>\s*<select[\s\S]*?<\/select>\s*<\/div>/g, '').replace(/(onclick="openMusic\(\)">)[^<]*</, `$1♫ ${nameOf(nowId()) || 'Music'}<`); } catch (e) {}
      return h; }; }

  const css = document.createElement('style');
  css.textContent = `.munow{display:flex;align-items:center;gap:10px;background:#0007;border:2px solid #ffd45e;border-radius:14px;padding:9px 11px;margin:6px 0}.munow i{font-style:normal;font-size:24px;color:#ffd45e}.munow span{flex:1;min-width:0;display:flex;flex-direction:column}.munow small{font:800 10.500px Nunito;color:#b9a6ee;letter-spacing:.4px;text-transform:uppercase}.munow b{font:17px 'Lilita One';font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.munow .hbtn{width:auto;padding:7px 14px}\n  .muh{font:12px 'Lilita One';color:#ffd45e;letter-spacing:.6px;text-transform:uppercase;margin:10px 0 4px}.mu2{display:flex;align-items:center;gap:6px;background:#0006;border:2px solid #000;border-radius:11px;margin:4px 0;padding:0 6px 0 0}.mu2n{all:unset;cursor:pointer;flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px}.mu2n b{font:14px 'Lilita One';font-weight:400;color:#f1eaff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mu2n small{font:800 10.500px Nunito;color:#b9a6ee;white-space:nowrap}.mu2.on{border-color:#ffd45e}.mu2.on .mu2n b::before{content:'✓ ';color:#ffd45e}.mu2.play .mu2n b{color:#ffd45e}.mu2 .mfav{all:unset;cursor:pointer;font-size:17px;color:#8f80b8;padding:4px 6px}.mu2 .mfav.on{color:#ffd45e}\n  #rwRm{margin:0 0 8px;display:flex;flex-direction:column;gap:4px;align-items:stretch;text-align:center}#rwRm small{font:800 11.500px/1.3 Nunito;color:#d9cdfa}.rmbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(#ff8a5e,#c9361a)!important;color:#fff!important}.rmbtn .ci{width:18px;height:18px;display:inline-block}.rmbtn:disabled{opacity:.5}.rmnote{font:800 12.500px Nunito;color:#ffd45e;background:#0007;border:2px solid #000;border-radius:11px;padding:6px 10px}`;
  document.head.appendChild(css);
})();
