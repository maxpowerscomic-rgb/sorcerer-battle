/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.24
   Home screen: wardrobe button is the fighter's head (bottom right), bell beside the gear, login inside notifications.
   Wardrobe: the Attacks tab lists every colourway, grouped into Spells and Techniques.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const BRUSH = '<svg viewBox="0 0 24 24"><path d="M14.500 3.500 20.500 9.500 11 19H5v-6z" fill="#ffd45e" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M5 19c-1.500 0-2.500 1-2.500 2.500 2 .3 4-.3 4.500-2" fill="#ff6b8a" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="m13 5 6 6" stroke="#000" stroke-width="2"/></svg>';

  /* ---------------- home buttons ---------------- */
  function custBtn() { const b = document.querySelector('#home .cust'); if (!b) return; if (!$('custAva')) { b.insertAdjacentHTML('beforeend', `<canvas id="custAva" width="128" height="128"></canvas><i class="hm-brush">${BRUSH}</i>`); b.setAttribute('aria-label', 'Customise your fighter'); }
    try { drawAva($('custAva'), lookWiz(PR.look)); } catch (e) {} }
  function bellDot() { const lg = $('lgBtn'), bell = $('bellBtn'); if (bell && lg) bell.classList.toggle('hm-due', lg.classList.contains('due')); }
  if (typeof refreshMeta === 'function') { const _rm = refreshMeta; window.refreshMeta = refreshMeta = function () { const r = _rm.apply(this, arguments); try { custBtn(); bellDot(); } catch (e) {} return r; }; }
  // the login bonus is a row at the top of the notifications sheet
  if (typeof openNotes === 'function') { const _on = openNotes; window.openNotes = function () { const r = _on.apply(this, arguments);
      try { const Pn = $('sheetP'), lg = $('lgBtn'), due = lg && lg.classList.contains('due'); if (Pn && !Pn.querySelector('.hm-login') && typeof openLogin === 'function') { const at = Pn.querySelector('.sh') || Pn.firstElementChild; const h = `<button class="hm-login${due ? ' due' : ''}" onclick="openLogin()"><b>Daily login bonus</b><small>${due ? 'Ready to claim' : 'See this week\'s rewards'}</small><i>›</i></button>`; if (at) at.insertAdjacentHTML('afterend', h); else Pn.insertAdjacentHTML('afterbegin', h); } } catch (e) {}
      return r; }; }

  /* ---------------- wardrobe: Attacks tab ---------------- */
  const isTech = k => { try { return typeof TECH !== 'undefined' && !!TECH[k]; } catch (e) { return false; } };
  const SKIN_OF = { gilded: 'dissect', rainbow: 'polarity' };   // the older one-off attack skins, and the attack each belongs to
  function atkTab() { const box = $('items'); if (!box || !window.COLOURWAYS || !window.V123) return; const CW = COLOURWAYS, legacy = catItems('atk');
    const tile = (cls, onclick, attack, name, foot, cv) => `<div class="item atk-t ${cls}" style="--r:#8a6bff" onclick="${onclick}">${cv}<b>${attack}</b><small class="atk-n">${name}</small>${foot}<i class="rb"></i></div>`;
    const group = tech => { let h = ''; const ks = Object.keys(CW).filter(k => isTech(k) === tech && SP[k]).sort((a, b) => SP[a].n.localeCompare(SP[b].n));
      for (const k of ks) CW[k][1].forEach((hh, i) => { const need = V123.cwNeed(k, i), on = PR.cway && PR.cway[k] === i + 1; h += tile((on ? 'eq ' : '') + (need[0] ? '' : 'lock'), `cwPick('${k}',${on ? 0 : i + 1})`, SP[k].n, V123.hname(hh), need[0] ? '' : `<small>${need[1]}</small>`, `<canvas width="128" height="128" data-cw="${k}|${i}"></canvas>${need[0] ? '' : `<span class="lk">${SVG.lock}</span>`}`); });
      legacy.forEach((it, i) => { const k = SKIN_OF[it.id]; if (!k || isTech(k) !== tech) return; const own = ownsItem('atk', it), eq = PR.look.atk === it.id; h += tile((eq ? 'eq ' : '') + (own ? '' : 'lock'), eq ? `equip('atk','none')` : `pickItem(${i})`, SP[k].n, it.n, own ? '' : `<small>${unlockText(it.unlock || {})}</small>`, `<canvas width="128" height="128" data-skin="${it.id}"></canvas>${own ? '' : `<span class="lk">${SVG.lock}</span>`}`); });
      return h; };
    const sp = group(false), te = group(true);
    box.innerHTML = `<div class="atk-h">Spells</div>${sp}<div class="atk-h">Techniques</div>${te}<div class="atk-foot">Tap a colour to use it. Tap it again to go back to the standard look.</div>`;
    box.querySelectorAll('canvas').forEach(c => { const g = c.getContext('2d'), W = 128; let k, col;
      if (c.dataset.cw) { const [kk, i] = c.dataset.cw.split('|'); k = kk; const hh = CW[k][1][+i]; col = typeof hh === 'number' ? `hsl(${hh},85%,56%)` : hh === 'white' ? '#f4f0ff' : hh === 'gold' ? '#ffd04a' : hh === 'dusk' ? '#6a5cff' : null; }
      else { k = SKIN_OF[c.dataset.skin]; col = c.dataset.skin === 'gilded' ? '#c9182a' : null; }
      const bg = g.createRadialGradient(W / 2, W * .45, 4, W / 2, W / 2, W * .62); bg.addColorStop(0, '#3a2d66'); bg.addColorStop(1, '#150f27'); g.fillStyle = bg; g.fillRect(0, 0, W, W);
      if (col) { const gl = g.createRadialGradient(W / 2, W / 2, 6, W / 2, W / 2, 56); gl.addColorStop(0, '#ffffff'); gl.addColorStop(.35, col); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(W / 2, W / 2, 56, 0, 7); g.fill(); }
      else { const gl = g.createConicGradient ? g.createConicGradient(0, W / 2, W / 2) : null; if (gl) { ['#ff5a5a', '#ffd45e', '#5aff8a', '#5ab8ff', '#c48cff', '#ff5a5a'].forEach((cc, i) => gl.addColorStop(i / 5, cc)); g.fillStyle = gl; g.globalAlpha = .85; g.beginPath(); g.arc(W / 2, W / 2, 50, 0, 7); g.fill(); g.globalAlpha = 1; } }
      const im = new Image(); im.onload = () => { g.drawImage(im, W - 54, W - 54, 48, 48); }; im.src = ICON[k]; }); }
  /* (1.0.25) the Attacks tab is gone again: colours are picked on each ability's own page, with the two older attack skins beside them */
  { const _cf = window.catsFor; window.catsFor = () => (_cf ? _cf() : CATS).filter(c => c[0] !== 'atk'); }
  window.skinPick = function (id) { const it = (COSMETICS.atk || []).find(q => q.id === id); if (!it) return; if (!ownsItem('atk', it)) return toast((unlockText(it.unlock || {}) || 'Locked') + ' to unlock'); PR.look.atk = PR.look.atk === id ? 'none' : id; try { save(); sfx('ui_click'); } catch (e) {} const el = document.querySelector('#sheetP .sk-row'); if (el) el.outerHTML = skinRow(el.dataset.k); };
  function skinRow(k) { const id = Object.keys(SKIN_OF).find(q => SKIN_OF[q] === k), it = id && (COSMETICS.atk || []).find(q => q.id === id); if (!it) return ''; const own = ownsItem('atk', it), on = PR.look.atk === id;
    return `<div class="cw-row sk-row" data-k="${k}"><b>Attack skin</b><div class="cw-sw"><button class="${on ? '' : 'on'}" onclick="${on ? `skinPick('${id}')` : ''}" style="--c:radial-gradient(circle at 35% 30%,#fff,#8a6bff 45%,#000 130%)"><i></i><small>Standard</small></button><button class="${on ? 'on' : ''}${own ? '' : ' lk'}" onclick="skinPick('${id}')" style="--c:${id === 'gilded' ? 'radial-gradient(circle at 35% 30%,#ffd45e,#c9182a 55%,#000 130%)' : 'conic-gradient(#ff5a5a,#ffd45e,#5aff8a,#5ab8ff,#c48cff,#ff5a5a)'}"><i></i><small>${it.n}</small></button></div><p>${own ? (it.note || '') : (unlockText(it.unlock || {}) || 'Locked')}</p></div>`; }
  if (typeof openSpell === 'function') { const _os = openSpell; window.openSpell = openSpell = function (k) { const r = _os.apply(this, arguments);
      try { const Pn = $('sheetP'); if (Pn && typeof isUnl === 'function' && isUnl(k)) { const at = Pn.querySelector('.trials') || Pn.lastElementChild; let h = ''; if (window.COLOURWAYS && COLOURWAYS[k] && window.V123 && V123.ok() && !Pn.querySelector('.cw-row:not(.sk-row)')) h += V123.cwHTML(k); if (!Pn.querySelector('.sk-row')) h += skinRow(k); if (h) { if (at) at.insertAdjacentHTML('beforebegin', h); else Pn.insertAdjacentHTML('beforeend', h); } } } catch (e) {}
      return r; }; }

  /* ---------------- cosmetics: hairstyles, hair colours, premium pets ---------------- */
  try { const HS2 = [['pompadour', 'Pompadour', 'rare', 60], ['topknot', 'Top Knot', 'rare', 60], ['afro', 'Big Curls', 'rare', 80], ['sweep', 'Side Sweep', 'epic', 100], ['ponytail', 'Ponytail', 'epic', 100], ['flattop', 'Flat Top', 'rare', 60]];
    for (const [id, n, r, v] of HS2) if (COSMETICS.hairstyle && !COSMETICS.hairstyle.some(q => q.id === id)) COSMETICS.hairstyle.push({ id, n, r, unlock: { type: 'gems', v } }); } catch (e) {}
  // nine hair (and beard) colours; three of them never sit still
  const HAIR_ANIM = { flamehair: t => `hsl(${22 + Math.sin(t * 7) * 16 + Math.sin(t * 13) * 6},100%,${54 + Math.sin(t * 11) * 8}%)`, aurorahair: t => `hsl(${(t * 60) % 360},85%,64%)`, stormhair: t => (Math.sin(t * 23) + Math.sin(t * 7.3) > 1.35 ? '#ffffff' : `hsl(205,90%,${60 + Math.sin(t * 3) * 8}%)`) };
  try { const HC = [['silver', 'Silver', 'rare', '#c9d2e0', 60], ['midnight', 'Midnight', 'rare', '#2a3a8a', 60], ['rosegold', 'Rose Gold', 'rare', '#e8a0a8', 80], ['emerald', 'Emerald', 'rare', '#1fa35a', 60], ['sunset', 'Sunset', 'rare', '#ff6a3a', 80], ['lilac', 'Lilac', 'rare', '#c9a6ff', 80],
      ['flamehair', 'Living Flame', 'legendary', '#ff7a2a', 300], ['aurorahair', 'Aurora', 'legendary', '#7ef0d0', 300], ['stormhair', 'Storm Front', 'legendary', '#8ac8ff', 250]];
    for (const [id, n, r, c, v] of HC) if (!COSMETICS.beard.some(q => q.id === id)) COSMETICS.beard.push({ id, n, r, c, style: 'short', unlock: { type: 'gems', v } }); } catch (e) {}
  if (typeof drawWiz === 'function') { const _dw = drawWiz; window.drawWiz = drawWiz = function (w) { try { const f = w && w.look && HAIR_ANIM[w.look.beard]; if (f) { const t = performance.now() / 1000; w.beardC = f(t);
          if (w.look.beard === 'flamehair' && w.x !== undefined && typeof ents !== 'undefined' && ents && ents.includes(w) && !w.dead && Math.random() < .25 && typeof P === 'function') P({ x: w.x + rnd(-7, 7), y: w.y - rnd(74, 86) * HS, vx: rnd(-8, 8), vy: -rnd(30, 70), color: Math.random() < .5 ? '#ffb347' : '#fff3b0', size: rnd(1.4, 2.6), life: rnd(.25, .5) }); } } catch (e) {}
      return _dw.apply(this, arguments); }; }
  // (1.0.25) sorcerer outfits: the gi, a fitted tee, or a hoodie, all over the same baggy trousers and in the colours of the chosen gi
  try { COSMETICS.outfit = COSMETICS.outfit || [{ id: 'gi', n: 'Gi', r: 'common', unlock: { type: 'free' } }, { id: 'tee', n: 'Fitted Tee', r: 'rare', unlock: { type: 'gems', v: 150 } }, { id: 'hoodie', n: 'Hoodie', r: 'epic', unlock: { type: 'gems', v: 200 } }];
    if (!CATS.some(c => c[0] === 'outfit')) { const i = CATS.findIndex(c => c[0] === 'robe'); CATS.splice(i + 1, 0, ['outfit', 'Outfit']); }
    PR.look.outfit = PR.look.outfit || 'gi';
    { const _cf2 = window.catsFor; window.catsFor = () => { const base = _cf2 ? _cf2() : CATS; return PR.look && PR.look.cls === 'sorc' ? base : base.filter(c => c[0] !== 'outfit'); }; }
    { const _rl = resolveLook; window.resolveLook = resolveLook = function (look) { const o = _rl.apply(this, arguments); try { o.outfit = (look && look.outfit) || 'gi'; } catch (e) {} return o; }; } } catch (e) {}
  // six premium pets: a familiar shape in a new skin, each with its own effect drawn around it
  const PP = {
    rubyserpent: { base: 'snake', n: 'Ruby Serpent', hue: 'h:350', v: 600, fx: 'embers', cols: ['#ffb347', '#ff5a1f', '#fff3b0'] },
    frostowl: { base: 'owl', n: 'Frost Owl', hue: 'h:195', v: 700, fx: 'snow', cols: ['#ffffff', '#bfe9ff'] },
    voidcat: { base: 'cat', n: 'Void Cat', hue: 'h:275', v: 700, fx: 'motes', cols: ['#b06bff', '#3a1a7a', '#e6d0ff'] },
    midasfrog: { base: 'frog', n: 'Midas Frog', hue: 'gold', v: 800, fx: 'shine', cols: ['#ffd45e', '#fff3b0'] },
    stormdrake: { base: 'dragon', n: 'Storm Drake', hue: 'h:210', v: 1000, fx: 'arcs', cols: ['#e6f6ff', '#5ab8ff'] },
    spiritwolf: { base: 'wolf', n: 'Spirit Wolf', hue: 'h:165', v: 900, fx: 'wisps', cols: ['#9fffd0', '#e6fff4'] },
  };
  try { for (const id in PP) if (!COSMETICS.pet.some(q => q.id === id)) COSMETICS.pet.push({ id, n: PP[id].n, r: 'legendary', unlock: { type: 'gems', v: PP[id].v } }); } catch (e) {}
  function petFx(x, p, t) { const rr = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }; x.save(); x.globalCompositeOperation = p.fx === 'motes' ? 'source-over' : 'lighter';
    if (p.fx === 'arcs') { x.strokeStyle = p.cols[0]; x.lineWidth = 1.4; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { const sd = Math.floor(t * 10 + i * 3.3), a0 = rr(sd, 1) * 6.283, R = 13 + rr(sd, 2) * 5; x.globalAlpha = .9; x.beginPath(); for (let j = 0; j <= 4; j++) { const a = a0 + j * .32, r0 = R + (rr(sd, 5 + j) - .5) * 6; x.lineTo(Math.cos(a) * r0, -12 + Math.sin(a) * r0 * .8); } x.stroke(); } }
    else if (p.fx === 'shine') { for (let i = 0; i < 5; i++) { const ph = (t * .9 + i / 5) % 1, a = i * 1.257 + t * .6, R = 15, px = Math.cos(a) * R, py = -11 + Math.sin(a) * R * .7, s = Math.sin(ph * Math.PI) * 3.4; x.fillStyle = p.cols[i % 2]; x.globalAlpha = Math.sin(ph * Math.PI); x.beginPath(); x.moveTo(px, py - s); x.lineTo(px + s * .3, py - s * .3); x.lineTo(px + s, py); x.lineTo(px + s * .3, py + s * .3); x.lineTo(px, py + s); x.lineTo(px - s * .3, py + s * .3); x.lineTo(px - s, py); x.lineTo(px - s * .3, py - s * .3); x.closePath(); x.fill(); } }
    else { const up = p.fx !== 'snow', N = 8; for (let i = 0; i < N; i++) { const ph = (t * (p.fx === 'wisps' ? .45 : .8) + i / N) % 1, px = (rr(i, 1) - .5) * 30 + Math.sin(t * 2 + i) * (p.fx === 'wisps' ? 5 : 2), py = up ? -2 - ph * 30 : -30 + ph * 30, s = (p.fx === 'wisps' ? 2.6 : p.fx === 'motes' ? 2.2 : 1.7) * (1 - ph * .5); x.globalAlpha = Math.sin(ph * Math.PI) * (p.fx === 'motes' ? .85 : 1); x.fillStyle = p.cols[i % p.cols.length]; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); } }
    x.restore(); }
  let cardAs = null;   // while a premium pet's card is drawn, its base pet's layout is used
  if (typeof drawPetCard === 'function') { const _pc = drawPetCard; window.drawPetCard = drawPetCard = function (c, id, bg) { const p = PP[id]; if (!p) return _pc.apply(this, arguments); cardAs = id; const x = c.getContext('2d'), H = window.V123 && V123.ok() ? V123 : null; if (H) H.hueOn(x, p.hue); try { return _pc.call(this, c, p.base, bg); } finally { cardAs = null; if (H) H.hueOff(x); } }; }
  if (typeof drawPet === 'function') { const _dp = drawPet; window.drawPet = drawPet = function (x, id, t, face) { if (cardAs && PP[cardAs].base === id) id = cardAs; const p = PP[id]; if (!p) return _dp.apply(this, arguments);
      const H = window.V123 && V123.ok() ? V123 : null; if (H) H.hueOn(x, p.hue); try { _dp.call(this, x, p.base, t, face); } finally { if (H) H.hueOff(x); } try { petFx(x, p, performance.now() / 1000); } catch (e) {} }; }
  window.PREMIUM_PETS = PP;

  /* ---------------- (1.0.28) shop: how gems are earned, and the small print ---------------- */
  if (typeof renderShop === 'function') { const _rs2 = renderShop; window.renderShop = renderShop = function () { const r = _rs2.apply(this, arguments);
      try { if (!$('shGemInfo')) { const at = $('mtkShop') || $('gemPacks'); if (at) at.insertAdjacentHTML('afterend', `<div id="shGemInfo"><b>Earning gems by playing</b><ul><li><em>Level up</em>: every player level pays gems.</li><li><em>Ranks</em>: reaching a new rank pays its reward once.</li><li><em>The Ladder</em>: 10 gems the first time you beat a rival, 100 for each advanced rival.</li><li><em>Fight Club</em>: win a bounty to turn 15 gems into 25, with bonus gems for beating all wizards, all sorcerers, or all six.</li><li><em>Tutorial</em>: 100 gems for finishing it.</li></ul><small>Gem packs are optional purchases made with real money through your app store account. Gems have no cash value and cannot be exchanged, transferred or refunded except where the law requires. Everything that affects a battle can be earned by playing.</small></div>`); } } catch (e) {}
      return r; }; }

  /* ---------------- (1.0.28) colour-coded ability text ----------------
     Health is light blue, damage light orange, cast and timing numbers light green, status effects light purple,
     movement words a warmer orange, and a sentence that states a rule to keep in mind is light yellow.
     It only touches text that is exactly an ability or upgrade description, wherever the game shows one. */
  const DC = [
    ['dc-hp', /\b\d+(?:\.\d+)?%?\s+(?:more\s+|extra\s+|bonus\s+)?(?:health|durability|HP)\b|\b(?:heals?|restores?|regenerates?|mends?)(?:\s+\d+(?:\.\d+)?%?)?\b|\bfull health\b|\bhalf (?:the )?health\b/gi],
    ['dc-dmg', /\b\d+(?:\.\d+)?%?\s+(?:more\s+|extra\s+|bonus\s+|of (?:its|the) )?damage\b|\bdeals?\s+\d+(?:\.\d+)?%?(?:\s+back)?|\b\d+(?:\.\d+)?%\s+harder\b|\bhits?\s+(?:them\s+)?\d+x\b|\b(?:double|triple) damage\b/gi],
    ['dc-cast', /\b\d+(?:\.\d+)?%?\s+(?:faster|quicker|sooner|longer|shorter|larger|wider|further)\b|\b(?:half a|\d+(?:\.\d+)?)\s+seconds?(?:\s+(?:longer|shorter|faster))?\b|\bcast(?:s|ing)?\s+(?:time|speed)\b|\bevery (?:second|third|fourth|fifth) (?:cast|summon)\b|\b(?:twice|two|three|four|five|six) (?:shots?|bolts?|arrows?|casts?|copies|beasts?|slashes)\b/gi],
    ['dc-st', /\b(?:stun(?:s|ned)?|slow(?:s|ed|er)?|root(?:s|ed)?|trap(?:s|ped)?|frozen|freezes?|froze|daze[sd]?|burn(?:s|ing|ed)?|poison(?:s|ed)?|bleed(?:s|ing)?|venom|grab(?:s|bed)?|silence[sd]?|alight|knock(?:s|ed|ing)?(?:\s+(?:the enemy|them|you))?\s+back|launch(?:es|ed)?|phased?|immune)\b/gi],
    ['dc-mv', /\b(?:dash(?:es|ing)?|blinks?|teleports?|leaps?|rush(?:es)?|charges?|gallops?|pounces?|marches|flanks?|jumps?)\b/gi],
  ];
  const RULE = /^(?:Once |Only |One copy|Cannot|Can't|Does not|Doesn't|Not |Never|You are rooted|Leave |No repeats|It takes|While )|once per (?:loop|round)|\bcannot\b|\bcrumbles\b|\binstead of\b|\bonly (?:works|while|one)\b|\bno longer\b/i;
  const escH = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function tintSentence(t) { let parts = [[t, null]]; for (const [cls, re] of DC) { const next = []; for (const [txt, c] of parts) { if (c) { next.push([txt, c]); continue; } let last = 0, m; re.lastIndex = 0; while ((m = re.exec(txt))) { if (m.index > last) next.push([txt.slice(last, m.index), null]); next.push([m[0], cls]); last = m.index + m[0].length; if (!m[0].length) re.lastIndex++; } if (last < txt.length) next.push([txt.slice(last), null]); } parts = next; }
    return parts.map(([txt, c]) => c ? `<span class="dc ${c}">${escH(txt)}</span>` : escH(txt)).join(''); }
  function tint(t) { return (t.match(/[^.!?]+(?:[.!?]+|$)\s*/g) || [t]).map(sn => { const body = sn.replace(/\s+$/, ''), tail = sn.slice(body.length); return (RULE.test(body) ? `<span class="dc-rule">${tintSentence(body)}</span>` : tintSentence(body)) + tail; }).join(''); }   /* no lookbehind: older Safari cannot parse it */
  let DMAP = null, DN = 0;
  function dmap() { const n = Object.keys(SP).length; if (DMAP && DN === n) return DMAP; DMAP = new Map(); DN = n; const add = d => { if (typeof d === 'string' && d.length > 12 && !DMAP.has(d)) { try { DMAP.set(d, tint(d)); } catch (e) {} } };
    for (const k in SP) add(SP[k].d); try { for (const k in UPG) for (const u of (UPG[k] || [])) add(u.d); } catch (e) {} try { for (const b of (typeof ZODIAC !== 'undefined' ? ZODIAC : [])) add(b.q); } catch (e) {} return DMAP; }
  function paintText(root) { if (!root) return; const mp = dmap(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hits = []; let n; while ((n = w.nextNode())) { const v = n.nodeValue; if (!v || v.length < 13) continue; const p = n.parentNode; if (!p || (p.classList && p.classList.contains('dc')) || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') continue; const t = v.trim(); if (mp.has(t)) hits.push([n, t]); }
    for (const [nd, t] of hits) { const sp = document.createElement('span'); sp.className = 'dc-wrap'; sp.innerHTML = mp.get(t); nd.parentNode.replaceChild(sp, nd); } }
  // (1.0.29) colours appear only on the ability page opened from the Abilities screen. Never in a match (draft, order, battle) or anywhere else,
  // because those panels sit on lighter or busier backgrounds where pale coloured text cannot be read.
  const onAbilities = () => { const sp = $('spells'); return !!(sp && sp.classList.contains('on')) && !['draft', 'order', 'battle', 'vs', 'rewards'].some(id => { const e = $(id); return e && e.classList.contains('on'); }); };
  if (typeof openSpell === 'function') { const _osT = openSpell; window.openSpell = openSpell = function () { const r = _osT.apply(this, arguments);
      try { if (onAbilities()) { const Pn = $('sheetP'); paintText(Pn); setTimeout(() => { try { if (onAbilities() && $('sheet').classList.contains('on')) paintText($('sheetP')); } catch (e) {} }, 60); } } catch (e) {}
      return r; }; }
  window.DESC_TINT = tint;

  const css = document.createElement('style');
  css.textContent = `
  /* (1.0.27) the pause menu scrolls when it is taller than the screen */
  .pzb{max-height:calc(100% - 48px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;box-sizing:border-box}.pzb>*{flex-shrink:0}
  #home .cust{top:auto!important;right:12px!important;bottom:60px;width:60px;height:60px;padding:0!important;border-radius:18px!important;overflow:visible;display:block!important}
  #home .cust #custIco,#home .cust #custLbl{display:none!important}#custAva{width:100%;height:100%;border-radius:15px;display:block}
  .hm-brush{position:absolute;right:-7px;bottom:-7px;width:26px;height:26px;border-radius:50%;background:#1a1236;border:2px solid #000;display:grid;place-items:center;box-shadow:0 2px 0 #000}.hm-brush svg{width:16px;height:16px}
  /* (1.0.25) top row: gear, bell, streak. Then Challenges and Ladder, evenly spaced. Mute sits in the top right corner. */
  #home #bellBtn{left:52px!important;top:10px!important;height:34px;box-sizing:border-box}#home #stkBtn{left:122px!important;top:10px!important;height:34px;box-sizing:border-box}#home #lgBtn{display:none!important}#home #chBtn{top:92px!important}#home #ldBtn{top:130px!important}#home #ymBtn{top:10px!important;right:10px!important}#home #yardDmg{top:52px!important}
  #bellBtn.hm-due::after{content:"";position:absolute;top:-4px;right:-4px;width:11px;height:11px;border-radius:50%;background:#ff4a5a;border:2px solid #000}
  .hm-login{display:flex;align-items:center;gap:8px;width:100%;margin:8px 0 10px;padding:10px 12px;border-radius:14px;border:2px solid #000;background:linear-gradient(#8a6bff,#5b3bd1);color:#fff;box-shadow:0 3px 0 #000;text-align:left}
  .hm-login b{font:15px 'Lilita One';font-weight:400;letter-spacing:.3px}.hm-login small{flex:1;font:800 11.5px Nunito;color:#e6defc}.hm-login i{font:20px 'Lilita One';font-style:normal}.hm-login.due{background:linear-gradient(#ffe27a,#f0a830);color:#2a1600}.hm-login.due small{color:#5a3a00}
  #shGemInfo{margin:10px 0 4px;padding:10px 12px;border-radius:14px;border:2px solid #000;background:#171029}#shGemInfo b{font:14px 'Lilita One';font-weight:400;letter-spacing:.4px;color:#f3ecff}#shGemInfo ul{margin:6px 0 8px;padding-left:18px}#shGemInfo li{font:800 12px/1.4 Nunito;color:#d6cbf5}#shGemInfo li em{font-style:normal;color:#ffd45e}#shGemInfo small{display:block;font:700 10.5px/1.4 Nunito;color:#9a8cc0}
  .dc-hp{color:#9fd8ff}.dc-dmg{color:#ffc27a}.dc-cast{color:#a8f0b0}.dc-st{color:#d9b8ff}.dc-mv{color:#ffa98a}.dc-rule{color:#fff0a0}.dc{font-weight:900}.dc-rule{font-weight:inherit}
  .atk-h{grid-column:1/-1;font:15px 'Lilita One';letter-spacing:.6px;text-transform:uppercase;color:#f3ecff;margin:6px 2px 0;text-shadow:0 2px 0 #000}.atk-foot{grid-column:1/-1;font:800 11.5px Nunito;color:#b9a9e6;text-align:center;margin:4px 0 30px}
  .item.atk-t.lock canvas{filter:none!important;opacity:1!important}.item.atk-t .lk{left:8px!important;top:8px!important;right:auto!important;bottom:auto!important;width:22px!important;height:22px!important;transform:none!important}
  .item.atk-t .atk-n{display:block;font:800 11px Nunito;color:#ffd45e;margin-top:-2px}`;
  document.head.appendChild(css);
  try { custBtn(); bellDot(); } catch (e) {}
})();
