/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.23
   The Season Pass screen, rebuilt. Same rewards, rules and purchase; new presentation:
   - every reward is a tile with a drawn icon, its amount and what it is ("55 Gold"), on a rarity-coloured card
   - a central tier path that fills up to your tier; claimable tiles glow, claimed ones are ticked, locked premium shows a lock
   - a premium showcase with live previews of the season cosmetics and the full value of the track
   - claiming says exactly what you got
   ===================================================================== */
(function () {
  'use strict';
  if (!window.PASS) return;
  const $ = id => document.getElementById(id);
  const P = window.PASS, DAY = 86400e3, S0 = Date.UTC(2026, 10, 15), LEN = 30 * DAY;
  const seasonEnd = s => S0 + (s + 1) * LEN;
  let PRICE = '$4.99';
  if (window.SB_IAP_PRICES) { const _pr = SB_IAP_PRICES; window.SB_IAP_PRICES = function (map) { try { if (map && map.pass) PRICE = map.pass; } catch (e) {} return _pr.apply(this, arguments); }; }
  const BLOOD = { molten: { n: 'Molten', c: ['#fff0a0', '#ff8a1f', '#a8300a'] }, inkwell: { n: 'Inkwell', c: ['#ffd45e', '#2a2038', '#05030a'] }, prismatic: { n: 'Prismatic', c: null } };
  const list = r => Array.isArray(r) ? r : [r];
  const fmt = n => n.toLocaleString();

  /* ---------------- icons (outlined cartoon, shaded) ---------------- */
  let uid = 0; const id = p => p + (++uid);
  const ICON = {
    gold() { const g = id('g'), h = id('h'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffc93a"/><stop offset="1" stop-color="#c27a08"/></linearGradient><linearGradient id="${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#d98d12"/></linearGradient></defs>
      <g stroke="#1a0f00" stroke-width="2.6" stroke-linejoin="round"><ellipse cx="22" cy="48" rx="15" ry="6" fill="#b8730a"/><rect x="7" y="40" width="30" height="8" fill="url(#${h})"/><ellipse cx="22" cy="40" rx="15" ry="6" fill="url(#${g})"/>
      <ellipse cx="24" cy="38" rx="15" ry="6" fill="#b8730a"/><rect x="9" y="30" width="30" height="8" fill="url(#${h})"/><ellipse cx="24" cy="30" rx="15" ry="6" fill="url(#${g})"/>
      <circle cx="42" cy="30" r="17" fill="url(#${g})"/><circle cx="42" cy="30" r="12.5" fill="none" stroke-width="2"/></g>
      <path d="M42 21.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff2a0" stroke="#7a4a00" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M31 22a14 14 0 0 1 9-6" stroke="#fffbe0" stroke-width="3" stroke-linecap="round" fill="none" opacity=".9"/><circle cx="55" cy="14" r="2.2" fill="#fff"/><path d="M55 8v12M49 14h12" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>`; },
    gems() { const a = id('a'), b = id('b'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd6f6"/><stop offset=".5" stop-color="#ff5fd2"/><stop offset="1" stop-color="#9a1a7a"/></linearGradient><linearGradient id="${b}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9b0ff"/><stop offset="1" stop-color="#7a2ad6"/></linearGradient></defs>
      <g stroke="#1a0016" stroke-width="2.4" stroke-linejoin="round"><path d="M6 36l6-8h12l5 8-11 13z" fill="url(#${b})"/><path d="M40 38l5-7h11l4 7-10 12z" fill="url(#${b})"/>
      <path d="M17 14h30l9 13-24 29L8 27z" fill="url(#${a})"/><path d="M17 14l5 13h20l5-13" fill="#ffc2f0" stroke-width="1.6"/><path d="M8 27h48M22 27l10 29 10-29" fill="none" stroke="#7a1a63" stroke-width="1.6"/></g>
      <path d="M21 18l3 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="52" cy="10" r="1.8" fill="#fff"/><path d="M52 4v12M46 10h12" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>`; },
    rune() { const a = id('r'), gl = id('rg'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b79bff"/><stop offset=".55" stop-color="#5b3bd1"/><stop offset="1" stop-color="#2a1470"/></linearGradient><radialGradient id="${gl}"><stop offset="0" stop-color="#e9ddff"/><stop offset="1" stop-color="#e9ddff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="32" cy="32" r="28" fill="url(#${gl})" opacity=".55"/><path d="M32 5l21 12v30L32 59 11 47V17z" fill="url(#${a})" stroke="#0c0428" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 12l15 8.5v21L32 50 17 41.5v-21z" fill="none" stroke="#c9b6ff" stroke-width="1.6" opacity=".8"/>
      <path d="M24 26a9 9 0 0 1 15-3M40 38a9 9 0 0 1-15 3" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M39 17l1 6-6 0M25 47l-1-6 6 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 19l6-3.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/></svg>`; },
    sp() { const a = id('s'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6fbff"/><stop offset=".5" stop-color="#3fd0e8"/><stop offset="1" stop-color="#0b6f8e"/></linearGradient></defs>
      <path d="M32 3l7.5 17.5L58 22l-14 12.5L48 54 32 44 16 54l4-19.5L6 22l18.5-1.5z" fill="url(#${a})" stroke="#03202a" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 14l4 9.5 10 .8-7.6 6.7 2.3 10L32 35.6 23.3 41l2.3-10-7.6-6.7 10-.8z" fill="#eaffff" opacity=".55"/><path d="M24 19l4-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="54" cy="8" r="1.8" fill="#fff"/><path d="M54 3v10M49 8h10" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>`; },
    comet() { const a = id('c'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#8fd8ff"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
      <path d="M6 58C20 46 30 36 40 24" stroke="url(#${a})" stroke-width="14" stroke-linecap="round" fill="none" opacity=".9"/><path d="M14 58C25 49 33 41 41 31" stroke="#c48cff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>
      <circle cx="44" cy="20" r="12" fill="#fff8d0" stroke="#1a1030" stroke-width="2.8"/><circle cx="44" cy="20" r="7" fill="#ffe27a"/><circle cx="41" cy="17" r="2.6" fill="#fff"/>
      <circle cx="16" cy="18" r="2" fill="#fff"/><circle cx="56" cy="42" r="1.6" fill="#fff"/><path d="M26 8v8M22 12h8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>`; },
    beam() { const a = id('b'); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${a}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ad0"/><stop offset=".5" stop-color="#ffd45e"/><stop offset="1" stop-color="#8fd8ff"/></linearGradient></defs>
      <rect x="4" y="27" width="56" height="12" rx="6" fill="url(#${a})" stroke="#1a1030" stroke-width="2.6"/><rect x="8" y="31" width="48" height="3" rx="1.5" fill="#fff" opacity=".9"/>
      <path d="M12 16l4 5M30 12v6M48 16l-4 5M12 50l4-5M30 54v-6M48 50l-4-5" stroke="#ffe27a" stroke-width="3" stroke-linecap="round"/>
      <path d="M54 22l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#fff" stroke="#1a1030" stroke-width="1.6" stroke-linejoin="round"/></svg>`; },
    aura() { const a = id('u'); return `<svg viewBox="0 0 64 64"><defs><radialGradient id="${a}"><stop offset="0" stop-color="#fff6c8"/><stop offset=".55" stop-color="#ffb347" stop-opacity=".8"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="32" cy="50" rx="24" ry="8" fill="#ffb347" opacity=".35" stroke="#1a1030" stroke-width="2.2"/><circle cx="32" cy="32" r="26" fill="url(#${a})"/>
      ${[[18, 14, 6], [44, 10, 5], [32, 24, 7], [14, 34, 4], [50, 30, 5], [26, 42, 4], [42, 44, 5]].map(([x, y, r]) => `<path d="M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}z" fill="#fff8d0" stroke="#1a1030" stroke-width="1.4" stroke-linejoin="round"/>`).join('')}</svg>`; },
    blood(idb) { const b = BLOOD[idb] || BLOOD.molten, a = id('d'), c = b.c; const fill = c ? `<linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>` : `<linearGradient id="${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd45e"/><stop offset=".5" stop-color="#5aff8a"/><stop offset=".75" stop-color="#5ab8ff"/><stop offset="1" stop-color="#c48cff"/></linearGradient>`;
      return `<svg viewBox="0 0 64 64"><defs>${fill}</defs><ellipse cx="32" cy="56" rx="18" ry="4.5" fill="${c ? c[1] : '#c48cff'}" opacity=".45"/>
      <path d="M32 4C32 4 12 28 12 40a20 20 0 0 0 40 0C52 28 32 4 32 4z" fill="url(#${a})" stroke="#120008" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M22 36c0-6 5-13 7-16" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="24" cy="44" r="2.4" fill="#fff" opacity=".8"/></svg>`; },
    lock() { return `<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="#ffd45e" stroke="#000" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#000" stroke-width="2.4"/><circle cx="12" cy="15.5" r="1.8" fill="#000"/></svg>`; },
    check() { return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4ad66a" stroke="#000" stroke-width="2"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`; },
  };

  /* ---------------- what each reward is ---------------- */
  const COS_KIND = { robe: 'avatar', hat: 'avatar', trail: 'comet', beam: 'beam', aurastyle: 'aura' };
  function meta(r) {
    if (r.k === 'gold') return { cls: 'gold', icon: ICON.gold(), amt: fmt(r.n), name: 'Gold', say: `${fmt(r.n)} Gold` };
    if (r.k === 'gems') return { cls: 'gems', icon: ICON.gems(), amt: fmt(r.n), name: 'Gems', say: `${fmt(r.n)} Gems` };
    if (r.k === 'rune') return { cls: 'rune', icon: ICON.rune(), amt: fmt(r.n), name: r.n > 1 ? 'Echo Runes' : 'Echo Rune', say: `${r.n} Echo Rune${r.n > 1 ? 's' : ''}` };
    if (r.k === 'sp') return { cls: 'sp', icon: ICON.sp(), amt: '+' + r.n, name: 'Skill Points', say: `${r.n} Skill Points for each ability in your hand` };
    if (r.k === 'blood') { const b = BLOOD[r.id] || {}; return { cls: 'leg', icon: ICON.blood(r.id), amt: '', name: (b.n || r.id) + ' Blood', tag: 'Blood colour', say: `${b.n || r.id} Blood colour` }; }
    if (r.k === 'cos') { const kind = COS_KIND[r.cat] || 'aura'; return { cls: 'leg', icon: kind === 'avatar' ? `<canvas width="120" height="120" data-cos="${r.cat}.${r.id}"></canvas>` : ICON[kind](), amt: '', name: r.n, tag: { robe: 'Outfit', hat: 'Hat', trail: 'Trail', beam: 'Cannon skin', aurastyle: 'Aura' }[r.cat] || 'Cosmetic', sub: r.cat === 'beam' ? 'for Spell Cannon' : '', say: r.n }; }
    return { cls: 'gold', icon: '', amt: '', name: '', say: '' };
  }
  // a tile: the first reward is the hero, any others ride along as small chips
  const CUR = ['gold', 'gems', 'rune', 'sp'];
  function tile(rs, state, t, track) { rs = list(rs); const m = meta(rs[0]), more = rs.slice(1).map(meta);
    if (rs.length > 1 && rs.every(r => CUR.includes(r.k))) {   // two currencies share the card at the same size
      const act = state === 'claim' ? ` onclick="passClaim(${t},'${track}')"` : '', ms = rs.map(meta);
      return `<div class="pp-tile pp-${m.cls} pp-s-${state}${track === 'p' ? ' pp-prem' : ''}"${act}><div class="pp-pair">${ms.map(q => `<div class="pp-pi"><div class="pp-ic">${q.icon}</div><b class="pp-amt">${q.amt}</b><span class="pp-nm">${q.name}</span></div>`).join('')}</div>
        ${state === 'got' ? `<i class="pp-badge">${ICON.check()}</i>` : state === 'lock' ? `<i class="pp-badge">${ICON.lock()}</i>` : ''}${state === 'claim' ? '<u class="pp-claim">Claim</u>' : ''}</div>`; }
    const act = state === 'claim' ? ` onclick="passClaim(${t},'${track}')"` : '';
    return `<div class="pp-tile pp-${m.cls} pp-s-${state}${track === 'p' ? ' pp-prem' : ''}"${act}>
      ${m.tag ? `<em class="pp-tag">${m.tag}</em>` : ''}<div class="pp-ic">${m.icon}</div>
      ${m.amt ? `<b class="pp-amt">${m.amt}</b>` : ''}<span class="pp-nm">${m.name}${m.sub ? `<small>${m.sub}</small>` : ''}</span>
      ${more.length ? `<div class="pp-more">${more.map(q => `<span class="pp-chip"><i>${q.icon}</i>${q.amt ? q.amt + ' ' : ''}${q.name}</span>`).join('')}</div>` : ''}
      ${state === 'got' ? `<i class="pp-badge">${ICON.check()}</i>` : state === 'lock' ? `<i class="pp-badge">${ICON.lock()}</i>` : ''}
      ${state === 'claim' ? '<u class="pp-claim">Claim</u>' : ''}</div>`; }

  function paintPreviews(root) { root.querySelectorAll('canvas[data-cos]').forEach(c => { try { const [cat, cid] = c.dataset.cos.split('.'), look = Object.assign({}, PR.look, cat === 'hat' ? {} : { hat: 'pointy' }); look[cat] = cid; if (cat === 'robe' && look.cls === 'sorc') look.outfit = look.outfit || 'gi'; drawAva(c, lookWiz(look)); } catch (e) {} }); }

  /* ---------------- the screen ---------------- */
  const fmtD = ms => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  window.openPass = function (keepScroll) {
    const p = P.st(), T = P.tierOf(p), prem = P.premium(), end = seasonEnd(p.s), daysLeft = Math.max(0, Math.ceil((end - Date.now()) / DAY)), into = p.xp - T * P.PER, TT = P.TIERS;
    const SP0 = $('sheetP'), top = keepScroll && SP0 ? SP0.scrollTop : 0;
    const row = t => { const fG = p.f.includes(t), pG = p.p.includes(t), ok = t <= T;
      const fs = fG ? 'got' : ok ? 'claim' : 'todo', ps = pG ? 'got' : !prem ? 'lock' : ok ? 'claim' : 'todo';
      return `<div class="pp-row${ok ? ' on' : ''}${t === T + 1 ? ' next' : ''}">${tile(P.freeR(t), fs, t, 'f')}<div class="pp-node"><span>${t}</span></div>${tile(P.premR(t), ps, t, 'p')}</div>`; };
    const n = P.claimable(), pct = T >= TT ? 100 : into / P.PER * 100, fill = Math.min(100, (T + (T >= TT ? 0 : into / P.PER)) / TT * 100);
    const preview = `<div class="pp-show">${[{ k: 'cos', cat: 'robe', id: 'starforged', n: 'Starforged Robe / Gi' }, { k: 'cos', cat: 'hat', id: 'voidcrown', n: 'Void Crown' }, { k: 'cos', cat: 'trail', id: 'comet', n: 'Comet Trail' }, { k: 'blood', id: 'prismatic' }].map(r => { const m = meta(r); return `<div class="pp-mini"><div class="pp-ic">${m.icon}</div><span>${m.name}</span></div>`; }).join('')}</div>`;
    $('sheetP').innerHTML = `<div class="pp-top"><b>Season Pass</b><button class="xbtn" onclick="closeSheet()">✕</button></div>
      <div class="pp-hero" id="spSheet"><small>Season ${p.s + 1}</small><h2>Starforged Pass</h2>
        <div class="pp-prog"><div class="pp-hex"><b>${T}</b><span>Tier</span></div><div class="pp-pw"><div class="pp-bar"><i style="width:${pct}%"></i><em>${T >= TT ? 'Every tier reached!' : `${into} / ${P.PER} XP`}</em></div>
        <div class="pp-meta"><span>${T >= TT ? 'Season complete' : `Next: tier ${T + 1}`}</span><span class="pp-time">⏳ ${daysLeft} day${daysLeft === 1 ? '' : 's'} left</span></div></div></div>
        <p class="pp-how">Fill the pass with the XP from every match. Ends ${fmtD(end)}.</p></div>
      ${prem ? '<div class="pp-active">★ Premium pass active this season</div>' : `<div class="pp-buy"><div class="pp-bh"><b>Premium Pass</b><span>Season ${p.s + 1} only</span></div>${preview}
        <ul class="pp-val"><li><i>${ICON.gold()}</i>15,000 Gold</li><li><i>${ICON.gems()}</i>650 Gems</li><li><i>${ICON.rune()}</i>100 Echo Runes</li><li><i>${ICON.aura()}</i>8 exclusive cosmetics</li></ul>
        <button class="pp-bb" onclick="passBuy()"><b>Unlock Premium</b><span>${window.PASS_PRICE || PRICE}</span></button>
        <p class="pp-fine">Unlocks the premium rewards for Season ${p.s + 1} until ${fmtD(end)}, including tiers already reached. A one-time purchase for this season only; it does not renew.${daysLeft <= 3 ? ` <b class="sp-warn">This season ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</b>` : ''}</p>
        <div class="sp-links"><button onclick="passRestore()">Restore purchases</button><button onclick="passLink('terms')">Terms of Use</button><button onclick="passLink('privacy')">Privacy</button></div></div>`}
      <div class="pp-cols"><span>Free</span><span></span><span class="pm">Premium</span></div>
      ${n ? `<button class="upbtn pp-all" onclick="passClaimAll()">Claim all (${n})</button>` : ''}
      <div class="pp-list"><div class="pp-track"><i style="height:${fill}%"></i></div>${Array.from({ length: TT }, (_, i) => row(i + 1)).join('')}</div>`;
    $('sheet').classList.add('on'); const S = $('sheetP'); S.classList.add('pp-sheet'); paintPreviews(S);
    if (keepScroll) S.scrollTop = top; else { const nx = S.querySelector('.pp-row.next') || S.querySelector('.pp-row:last-child'); if (nx && P.tierOf(p) > 1 && !window.SB_SHOT) setTimeout(() => { try { const sr = S.getBoundingClientRect(), nr = nx.getBoundingClientRect(); S.scrollTop = Math.max(0, S.scrollTop + nr.top - sr.top - sr.height * .35); } catch (e) {} }, 380); }
  };
  // the sheet is shared: drop the pass styling when anything else opens in it
  if (typeof closeSheet === 'function') { const _cs = closeSheet; window.closeSheet = closeSheet = function () { try { $('sheetP').classList.remove('pp-sheet'); } catch (e) {} return _cs.apply(this, arguments); }; try { (0, eval)('closeSheet = window.closeSheet'); } catch (e) {} }

  /* ---------------- claiming says what you got ---------------- */
  const sayAll = rs => { const tot = {}, other = []; for (const r of rs) { if (['gold', 'gems', 'rune'].includes(r.k)) tot[r.k] = (tot[r.k] || 0) + r.n; else if (r.k === 'sp') tot.sp = (tot.sp || 0) + r.n; else other.push(meta(r).say); }
    const bits = []; if (tot.gold) bits.push(`${fmt(tot.gold)} Gold`); if (tot.gems) bits.push(`${fmt(tot.gems)} Gems`); if (tot.rune) bits.push(`${tot.rune} Echo Rune${tot.rune > 1 ? 's' : ''}`); if (tot.sp) bits.push(`${tot.sp} Skill Points per hand ability`); return bits.concat(other); };
  const pending = () => { const p = P.st(), T = P.tierOf(p), out = []; for (let t = 1; t <= T; t++) { if (!p.f.includes(t)) out.push(...list(P.freeR(t))); if (P.premium() && !p.p.includes(t)) out.push(...list(P.premR(t))); } return out; };
  const _pc = window.passClaim; window.passClaim = function (t, track) { const p = P.st(), arr = track === 'p' ? p.p : p.f; const will = t <= P.tierOf(p) && !arr.includes(t) && (track !== 'p' || P.premium()) ? list(track === 'p' ? P.premR(t) : P.freeR(t)) : null;
    const r = _pc.apply(this, arguments); if (will) try { toast('+ ' + sayAll(will).join(' · ')); } catch (e) {} return r; };
  const _pa = window.passClaimAll; window.passClaimAll = function () { const will = pending(); const r = _pa.apply(this, arguments); if (will.length) setTimeout(() => { try { toast('Claimed: ' + sayAll(will).join(' · ')); } catch (e) {} }, 60); return r; };

  const css = document.createElement('style');
  css.textContent = `
  .pp-sheet > .xbtn{display:none!important}.pp-top{max-width:none!important;position:sticky;top:-18px;z-index:20;display:flex;justify-content:space-between;align-items:center;margin:-18px -16px 10px;padding:16px 16px 10px;background:#2a1660;box-shadow:0 8px 8px -8px #000c}.pp-top b{font:18px 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:4px #000;paint-order:stroke fill}.pp-top .xbtn{position:static;flex:none}
  #sheetP.pp-sheet .pp-ic canvas{max-width:100%}#sheetP.pp-sheet>*{max-width:100%;box-sizing:border-box}#sheetP.pp-sheet{overflow-x:hidden;background:linear-gradient(180deg,#2a1660 0%,#160c34 38%,#0f0824 100%)}
  .pp-hero{position:relative;margin:0 0 10px;box-sizing:border-box;padding:14px 14px 10px;border-radius:18px;border:3px solid #000;box-shadow:0 4px 0 #000;overflow:hidden;
    background:radial-gradient(120% 90% at 80% 0%,#ffcf5a55,transparent 55%),radial-gradient(90% 80% at 0% 100%,#7a4dff66,transparent 60%),linear-gradient(160deg,#3b1f86,#1a0f3e)}
  .pp-hero::after{content:'';position:absolute;inset:0;background-image:radial-gradient(#fff 1px,transparent 1.5px);background-size:22px 22px;opacity:.08;pointer-events:none}
  .pp-hero small{font:900 11px Nunito;letter-spacing:2px;text-transform:uppercase;color:#ffd45e}
  .pp-hero h2{margin:0 0 8px;font:28px/1 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:5px #000;paint-order:stroke fill;letter-spacing:.5px}
  .pp-prog{display:flex;align-items:center;gap:10px;position:relative;z-index:1}
  .pp-hex{flex:none;width:58px;height:64px;display:grid;place-content:center;text-align:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(#ffe27a,#e08a14);position:relative}
  .pp-hex::before{content:'';position:absolute;inset:4px;clip-path:inherit;background:linear-gradient(#5a35c8,#2a1670)}
  .pp-hex b{position:relative;font:26px/1 'Lilita One';color:#fff;-webkit-text-stroke:4px #000;paint-order:stroke fill}.pp-hex span{position:relative;font:900 9px Nunito;letter-spacing:1px;text-transform:uppercase;color:#ffd45e}
  .pp-pw{flex:1;min-width:0}.pp-bar{position:relative;height:22px;border-radius:12px;background:#0b0618;border:3px solid #000;overflow:hidden}
  .pp-bar i{display:block;height:100%;background:linear-gradient(180deg,#ffe98a,#ffb020 55%,#e07a10);box-shadow:inset 0 -3px 0 #0003,inset 0 3px 0 #fff8}
  .pp-bar em{position:absolute;inset:0;display:grid;place-items:center;font:13px 'Lilita One';font-style:normal;color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke fill}
  .pp-meta{display:flex;justify-content:space-between;margin-top:5px;font:800 12px Nunito;color:#e6dcff}.pp-time{background:#0008;border:1.5px solid #000;border-radius:9px;padding:0 7px}
  .pp-how{position:relative;z-index:1;margin:8px 0 0;font:700 12px Nunito;color:#cbbff0}
  .pp-active{font:16px 'Lilita One';color:#3a1d00;background:linear-gradient(#ffe27a,#f0a830);border:3px solid #000;box-shadow:0 3px 0 #000;border-radius:14px;padding:8px 10px;text-align:center;margin-bottom:10px}
  .pp-buy{border-radius:18px;border:3px solid #000;box-shadow:0 4px 0 #000;padding:12px;margin-bottom:12px;background:radial-gradient(100% 70% at 50% 0%,#ffcf5a44,transparent 60%),linear-gradient(170deg,#4a2a10,#24130a);position:relative}
  .pp-buy::before{content:'';position:absolute;inset:3px;border-radius:14px;border:2px solid #ffd45e88;pointer-events:none}
  .pp-bh{display:flex;justify-content:space-between;align-items:baseline}.pp-bh b{font:22px 'Lilita One';font-weight:400;color:#ffd45e;-webkit-text-stroke:4px #000;paint-order:stroke fill}.pp-bh span{font:900 11px Nunito;color:#ffe9b8;letter-spacing:1px;text-transform:uppercase}
  .pp-show{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0}
  .pp-mini{border-radius:12px;border:2.5px solid #000;padding:7px 7px 8px;text-align:center;background:radial-gradient(circle at 50% 35%,#ffe9a0,#f0a830 45%,#a8580a);box-shadow:0 3px 0 #000}
  .pp-mini{min-width:0}.pp-mini .pp-ic{width:100%;height:auto;aspect-ratio:1;display:grid;place-items:center;margin:0 0 3px;overflow:hidden}.pp-mini .pp-ic>*{width:84%!important;height:84%!important;max-width:100%}.pp-mini canvas{border-radius:9px;border:2px solid #0006}
  .pp-mini span{display:block;font:800 9.5px/1.1 Nunito;color:#2a1200;min-height:21px}
  .pp-val{list-style:none;margin:4px 0 10px;padding:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px 8px}.pp-val li{display:flex;align-items:center;gap:6px;font:900 13px Nunito;color:#fff}.pp-val i{flex:none;width:24px;height:24px}.pp-val i svg{width:100%;height:100%}
  .pp-bb{width:100%;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:14px;border:3px solid #000;background:linear-gradient(#fff08a,#f6b52a 55%,#e08a14);color:#3a1d00;box-shadow:0 4px 0 #000,inset 0 2px 0 #fff9;animation:ppPulse 1.8s ease-in-out infinite}
  .pp-bb b,.pp-bb span{font:20px 'Lilita One';font-weight:400}@keyframes ppPulse{50%{transform:scale(1.025)}}
  .pp-fine{font:700 11.5px/1.4 Nunito;color:#f0e2c8;margin:9px 0 6px}
  .pp-cols{display:grid;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr);font:14px 'Lilita One';letter-spacing:1px;text-transform:uppercase;color:#cfc4f2;text-align:center;margin-bottom:4px}.pp-cols .pm{color:#ffd45e}
  .pp-all{width:100%;margin:2px 0 8px}
  .pp-list{position:relative;display:flex;flex-direction:column;gap:10px;padding:4px 2px 90px}
  .pp-track{position:absolute;left:50%;top:10px;bottom:90px;width:8px;transform:translateX(-50%);background:#0b0618;border:2px solid #000;border-radius:5px}.pp-track i{display:block;width:100%;background:linear-gradient(#ffe98a,#ffb020);border-radius:4px}
  .pp-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr);align-items:stretch}
  .pp-node{display:grid;place-items:center;z-index:1}.pp-node span{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#2a2050;border:3px solid #000;font:15px 'Lilita One';color:#9a8ccc}
  .pp-row.on .pp-node span{background:linear-gradient(#ffe27a,#e08a14);color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke fill}
  .pp-row.next .pp-node span{background:#fff;color:#2a1660;box-shadow:0 0 0 4px #ffd45e66}
  .pp-tile{position:relative;min-height:104px;border-radius:16px;border:3px solid #000;box-shadow:0 4px 0 #000;padding:26px 8px 12px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;overflow:hidden;text-align:center}
  .pp-tile::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#fff5,transparent 60%);pointer-events:none}
  .pp-gold{background:linear-gradient(160deg,#ffcf5a,#d0790c)}.pp-gems{background:linear-gradient(160deg,#ff8ae0,#a41a8a)}.pp-rune{background:linear-gradient(160deg,#9d7dff,#3a1c9a)}.pp-sp{background:linear-gradient(160deg,#5fe0f0,#0b6f8e)}
  .pp-leg{background:conic-gradient(from 0deg at 50% 40%,#ffe27a,#ff9a3a,#ffe27a,#ffb347,#ffe27a);}.pp-leg::after{content:'';position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 40%,#fff3 0 8deg,transparent 8deg 20deg);pointer-events:none}
  .pp-prem{outline:3px solid #ffd45e;outline-offset:-7px}
  .pp-ic{position:relative;z-index:1;width:58px;height:58px;display:grid;place-items:center;margin-bottom:2px;filter:drop-shadow(0 3px 0 #0006)}.pp-ic svg,.pp-ic canvas{width:100%;height:100%}.pp-ic canvas{border-radius:12px;border:2.5px solid #000}
  .pp-amt{position:relative;z-index:1;font:22px/1 'Lilita One';font-weight:400;color:#fff;-webkit-text-stroke:5px #000;paint-order:stroke fill}
  .pp-nm{position:relative;z-index:1;font:900 12px/1.15 Nunito;color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke fill}.pp-nm small{display:block;font:800 9.5px Nunito;-webkit-text-stroke:2.5px #000;opacity:.95}
  .pp-tag{position:absolute;top:7px;left:7px;z-index:2;font:900 9px Nunito;font-style:normal;letter-spacing:.5px;text-transform:uppercase;color:#3a1d00;background:#fff3c8;border:1.5px solid #000;border-radius:6px;padding:0 4px}
  .pp-more{position:relative;z-index:1;display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:4px}.pp-chip{display:flex;align-items:center;gap:4px;font:900 10px Nunito;color:#fff;background:#000a;border-radius:8px;padding:3px 8px 3px 6px}.pp-chip i{width:15px;height:15px;display:grid}.pp-chip i>*{width:15px;height:15px}.pp-chip canvas{display:none}
.pp-pair{position:relative;z-index:1;display:flex;justify-content:center;gap:10px;width:100%}.pp-pi{display:flex;flex-direction:column;align-items:center;min-width:0}.pp-pair .pp-ic{width:42px;height:42px}.pp-pair .pp-amt{font-size:19px}.pp-pair .pp-nm{font-size:11px}
  .pp-badge{position:absolute;top:7px;right:7px;z-index:3;width:24px;height:24px}.pp-badge svg{width:100%;height:100%}
  .pp-s-got{filter:saturate(.35) brightness(.7)}.pp-s-lock{filter:brightness(.82)}.pp-s-todo{filter:saturate(.75) brightness(.85)}
  .pp-claim{position:relative;z-index:4;margin-top:8px;text-decoration:none;font:15px/1 'Lilita One';color:#062b10;background:linear-gradient(#a8f0a0,#2fb34a);border:2.5px solid #000;border-radius:10px;padding:6px 16px;box-shadow:0 2px 0 #000}
  .pp-tile.pp-s-claim{cursor:pointer;animation:ppGlow 1.2s ease-in-out infinite;padding-bottom:12px}@keyframes ppGlow{50%{box-shadow:0 4px 0 #000,0 0 18px 4px #fff7c8}}
  .pp-tile.pp-s-claim:active{transform:translateY(2px)}`;
  document.head.appendChild(css);
  window.V142 = { ICON, meta };
})();
