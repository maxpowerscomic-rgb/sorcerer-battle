/* =====================================================================
   WIZARDS VS SORCERERS: the training yard (1.0.5)
   Loaded after wizard-v105.js.

   On the home screen the big portrait is replaced by a live practice duel at battle size: your fighter works
   through your Battle Hand on a straw dummy, keeping the distance the hand wants. A practice turret lobs slow
   fireballs at your walls, summons and decoys, and at you only while something of yours needs an attacker to
   show what it does. Nothing here counts: no rewards, no records, no sound, and nobody can be hurt for real.

   How it works: it builds a real match object without any of the match screens, runs update() and render()
   itself on the (hidden) battle canvas, and copies the arena onto a canvas in the home stage.
   It stops the moment a real match starts or the player leaves the home screen. Options can turn it off.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const Y = { on: false, raf: 0, last: 0, fails: 0, shot: 2, building: false, camY: 420 };
  const AX = 205, AY = 350, TX = 86, TY = 262;            // dummy and turret stand here (battle canvas coordinates)
  const wanted = () => typeof PR !== 'undefined' && PR.yard !== false && !window.ONB_ACTIVE && !window.SB_SHOT && Y.fails < 2 && (PR.hand || []).length >= 4 && (PR.hand || []).every(k => SP[k]);
  // what the dummy does: the abilities it casts on a loop (none = it just stands there) and whether it walks like a fighter
  const cfg = () => { const c = (PR.yardDummy = PR.yardDummy || {}); c.book = (Array.isArray(c.book) ? c.book : []).filter(k => SP[k]).slice(0, 4); c.walk = !!c.walk; return c; };
  const homeOn = () => { const h = $('home'); return h && h.classList.contains('on'); };
  const sheetOn = () => { const s = $('sheet'); return s && s.classList.contains('on'); };

  function build() {
    const sv = showVs; Y.building = true;
    try { window.showVs = showVs = function () {};       // a match object, none of the match screens
      newMatch({ name: 'Training Dummy', arena: 'bog', yard: 1, lv: Object.fromEntries(Object.keys(SP).map(k => [k, 1])) }); }
    finally { window.showVs = showVs = sv; Y.building = false; }
    M.practice = 1; M.rival = null; M.mode = 'casual'; M.me.book = PR.hand.slice(); M.foe.book = cfg().book.length ? cfg().book.slice() : ['fireball']; M.foe.up = new Set(); M.round = 1; M.pz = [];
    startDuel(); running = false; introT = 0;
    const me = ents[0], fo = ents[1]; fo.isDummy = 1; fo.maxHp = fo.hp = 99999; fo.x = AX; fo.y = AY; fo.petId = 'none'; me.x = 170; me.y = 560; Y.shot = 2.5; Y.t0 = performance.now();
  }
  const needsAttacker = w => !!(w.shell || w.counter || w.ghostT > 0 || w.boundary || (typeof shields !== 'undefined' && shields.some(s => s.o === w)) || (typeof hgs !== 'undefined' && hgs.some(h => h.o === w && !h.done)));
  function sparTarget(me) {
    const c = [];
    for (const wl of walls) if (wl.o === me && wl.hp > 0) { const cr = wl.cr.filter(q => !q.gone); if (cr.length) c.push(cr[Math.random() * cr.length | 0]); }
    for (const L of [zombies.filter(z => z.rise >= 1), golems, archers, typeof totems !== 'undefined' ? totems : [], decoys.filter(d => !d.gone)]) for (const e of L) if (e.o === me && (e.hp === undefined || e.hp > 0)) c.push(e);
    if (c.length) return c[Math.random() * c.length | 0];
    return needsAttacker(me) ? me : null;
  }
  function step(dt) {
    const me = ents[0], fo = ents[1], C = cfg(), fights = C.book.length > 0, walks = fights && C.walk, mov = PR.yardMove === true || walks, pin = () => { fo.walks = walks; if (!mov) { fo.x = AX; fo.y = AY; fo.vx = fo.vy = 0; fo.drag = null; fo.pull = null; } else { fo.x = Math.max(F.x0 + 24, Math.min(F.x1 - 24, fo.x)); fo.y = Math.max(F.y0 + 30, Math.min(F.y1 - 40, fo.y)); } fo.hp = fo.maxHp; fo.dead = 0; if (!fights) { fo.p = 0; fo.stunT = 0; } fo.burn = 0; fo.bleeds = null; fo.poisonT = 0; };
    pin(); clock = LIMIT; if (fights) me.hp = Math.max(me.hp, me.maxHp * .85);   /* a sparring dummy hits back, but nobody goes down: no health, no bars, just numbers */ if (me.hp < me.maxHp * .5) me.hp = me.maxHp; if (!me._oath) me.hp = Math.max(me.hp, me.maxHp * .6);
    if (Math.hypot(me.x - fo.x, me.y - fo.y) < 34 && !(me.rush || me.bo)) { me.x = fo.x - 60; me.y = Math.min(F.y1 - 30, fo.y + 150); }      // a swap dropped the fighter onto the dummy: step back out
    // the practice turret
    Y.shot -= dt; if (!fights && Y.shot <= 0) { Y.shot = 2.6; const t = sparTarget(me); if (t) { const mk = { x: me.x, y: me.y }, fk = { x: fo.x, y: fo.y }; fo.x = TX; fo.y = TY; me.x = t.x; me.y = t.y; try { cast(fo, 'fireball'); } catch (e) {} finally { me.x = mk.x; me.y = mk.y; fo.x = fk.x; fo.y = fk.y; } Y.puff = .3; } }
    if (Y.puff > 0) Y.puff -= dt;
    const bh = PR.behavior, b = $('battle'); let rec = bh; try { rec = (typeof recDistance === 'function' && recDistance() && recDistance().id) || bh; } catch (e) {}
    const px = fo.x, py = fo.y;
    try { PR.behavior = rec; b.classList.add('on'); T += dt; update(dt); pin();
      // a movable dummy is shoved, pulled and thrown like a fighter, then is walked back to its mark once left alone
      if (mov && !walks) { if (Math.hypot(fo.x - px, fo.y - py) > .4 || fo.drag || fo.pull) Y.idle = 0; else Y.idle = (Y.idle || 0) + dt; if (Y.idle > 2.2) { const k = Math.min(1, dt * 2.2); fo.x += (AX - fo.x) * k; fo.y += (AY - fo.y) * k; } }
      render(); if (!fights) drawProps(); }
    finally { b.classList.remove('on'); PR.behavior = bh; }
    if (ended || me.dead || T > 46) build();                                    // a fresh yard now and then, so it never fills up
  }
  // the turret, drawn on the battle canvas after the frame
  function drawProps() { const x = ctx; x.save(); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.translate(TX, TY); x.scale(SC, SC); x.lineJoin = 'round'; x.strokeStyle = '#000'; x.lineWidth = 2.2;
    x.fillStyle = 'rgba(8,4,18,.32)'; x.beginPath(); x.ellipse(0, 1, 15, 5, 0, 0, 7); x.fill();
    x.fillStyle = '#6a4a2a'; x.beginPath(); x.moveTo(-11, 0); x.lineTo(-4, -8); x.lineTo(4, -8); x.lineTo(11, 0); x.closePath(); x.fill(); x.stroke();
    const g = x.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, '#a37a48'); g.addColorStop(1, '#6a4a2a'); x.fillStyle = g; x.beginPath(); x.rect(-3.5, -34, 7, 28); x.fill(); x.stroke();
    x.fillStyle = '#8a8a96'; x.beginPath(); x.moveTo(-9, -34); x.quadraticCurveTo(-11, -46, 0, -47); x.quadraticCurveTo(11, -46, 9, -34); x.closePath(); x.fill(); x.stroke();
    const hot = Math.max(0, Y.puff || 0) / .3, r0 = 6.5 + hot * 3 + Math.sin(T * 6) * .6; x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(0, -47, 1, 0, -47, r0 * 2.4); gg.addColorStop(0, 'rgba(255,220,140,.9)'); gg.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = gg; x.beginPath(); x.arc(0, -47, r0 * 2.4, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#ffb347'; x.beginPath(); x.arc(0, -47, r0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff3c8'; x.beginPath(); x.arc(-1.6, -49, r0 * .4, 0, 7); x.fill();
    x.restore(); }
  // the straw dummy stands in for the enemy fighter
  function drawDummy(w, X0) { const x = X0 || ctx, hit = w.flash > 0 ? 1 : 0, wob = hit ? Math.sin(T * 44) * .09 : Math.sin(T * 1.6) * .012;
    x.save(); x.translate(w.x, w.y); x.scale(SC, SC); x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = '#000'; x.lineWidth = 2.3;
    x.fillStyle = 'rgba(8,4,18,.36)'; x.beginPath(); x.ellipse(0, .5, 17, 5.5, 0, 0, 7); x.fill();
    x.fillStyle = '#6a4a2a'; x.beginPath(); x.moveTo(-12, 1); x.lineTo(-3, -7); x.lineTo(3, -7); x.lineTo(12, 1); x.closePath(); x.fill(); x.stroke();      // stand
    x.rotate(wob);
    const pg = x.createLinearGradient(-3, 0, 3, 0); pg.addColorStop(0, '#a37a48'); pg.addColorStop(1, '#6a4a2a'); x.fillStyle = pg; x.beginPath(); x.rect(-3, -62, 6, 56); x.fill(); x.stroke();   // post
    x.fillStyle = '#8a623a'; x.beginPath(); x.rect(-23, -45, 46, 5.5); x.fill(); x.stroke();                                                                  // arms
    for (const s of [-1, 1]) { x.strokeStyle = '#e9c24a'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(s * 22, -42.5); x.lineTo(s * (27 + i % 2 * 3), -47 + i * 3.2); x.stroke(); } x.strokeStyle = '#000'; x.lineWidth = 2.3; }
    const tg = x.createLinearGradient(0, -52, 0, -18); tg.addColorStop(0, hit ? '#fff' : '#e6c98a'); tg.addColorStop(1, hit ? '#fff' : '#b98f52'); x.fillStyle = tg; x.beginPath(); x.ellipse(0, -34, 13.5, 16.5, 0, 0, 7); x.fill(); x.stroke();   // sack body
    x.save(); x.lineWidth = 1.5; x.strokeStyle = '#7a5a2c'; x.beginPath(); x.moveTo(-11, -40); x.quadraticCurveTo(0, -37, 11, -40); x.moveTo(-12.6, -30); x.quadraticCurveTo(0, -27, 12.6, -30); x.stroke();
    x.strokeStyle = '#5a3d1c'; x.lineWidth = 1.3; for (const [px, py] of [[-5, -24], [6, -44]]) { x.beginPath(); x.moveTo(px - 2.4, py - 2.4); x.lineTo(px + 2.4, py + 2.4); x.moveTo(px + 2.4, py - 2.4); x.lineTo(px - 2.4, py + 2.4); x.stroke(); }
    x.fillStyle = '#c94a3a'; x.strokeStyle = '#000'; x.lineWidth = 1.4; x.beginPath(); x.arc(1, -33, 4.4, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(1, -33, 2.2, 0, 7); x.fill(); x.restore();   // a painted target
    x.strokeStyle = '#e9c24a'; x.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = -2.4 + i * .28; x.beginPath(); x.moveTo(Math.cos(a) * 6, -68 + Math.sin(a) * 4); x.lineTo(Math.cos(a) * 12, -68 + Math.sin(a) * 11); x.stroke(); }   // straw hair
    x.strokeStyle = '#000'; x.lineWidth = 2.3; x.fillStyle = hit ? '#fff' : '#e6c98a'; x.beginPath(); x.arc(0, -62, 10, 0, 7); x.fill(); x.stroke();                                              // head
    x.lineWidth = 1.7; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 3.8 - 2, -65); x.lineTo(s * 3.8 + 2, -61); x.moveTo(s * 3.8 + 2, -65); x.lineTo(s * 3.8 - 2, -61); x.stroke(); }     // stitched eyes
    x.lineWidth = 1.4; x.beginPath(); x.moveTo(-4, -56.5); x.lineTo(4, -56.5); for (let i = -3; i <= 3; i += 2) { x.moveTo(i, -58); x.lineTo(i, -55); } x.stroke();                              // stitched mouth
    x.restore(); }
  { const _dw = drawWiz; window.drawWiz = drawWiz = function (w, X0, ava) { if (w && w.isDummy) return drawDummy(w, X0); return _dw.apply(this, arguments); }; }
  // the yard is heard by default; the speaker button under the Wizard button silences it (menu clicks still play)
  { const _s = sfx; window.sfx = sfx = function (id) { if (Y.on && PR.yardMute === true && !/^(ui_|j_)/.test(id || '')) return; return _s.apply(this, arguments); }; }

  // tap the dummy: one icon button appears over it that lets hits move it (or pins it again)
  const ICO = { free: '<svg viewBox="0 0 24 24"><path d="M12 2.5 15.2 6h-2.2v5h5V8.800L21.500 12 18 15.200V13h-5v5h2.200L12 21.500 8.800 18H11v-5H6v2.200L2.500 12 6 8.800V11h5V6H8.800z" fill="currentColor" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M10.300 2h3.400l.500 2.600 1.700.7 2.200-1.500 2.400 2.400-1.500 2.200.7 1.700 2.600.5v3.400l-2.600.5-.7 1.700 1.500 2.200-2.400 2.400-2.200-1.500-1.700.7-.5 2.600h-3.400l-.5-2.600-1.700-.7-2.200 1.500-2.400-2.400 1.500-2.200-.7-1.700L1.700 13.700v-3.400l2.600-.5.7-1.700-1.500-2.200 2.400-2.400 2.200 1.500 1.700-.7zM12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7z" fill="currentColor" fill-rule="evenodd" stroke="#000" stroke-width="1.200" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 3a2.600 2.600 0 0 1 1.100 4.960V10h3v2.200h-3v6.500c2.300-.5 4-2.300 4.300-4.700l-1.600.6 2.400-4.100 2.300 4.100-1.500-.5c-.5 4.200-3.700 7.200-7 7.400-3.300-.2-6.500-3.200-7-7.400l-1.500.5 2.300-4.100 2.400 4.100-1.600-.6c.3 2.400 2 4.200 4.300 4.700V12.200h-3V10h3V7.960A2.600 2.600 0 0 1 12 3z" fill="currentColor" stroke="#000" stroke-width="1.200" stroke-linejoin="round"/></svg>' };
  function tip(px, py) { const st = document.querySelector('#home .stage'); if (!st) return; let t = $('yardTip'); if (!t) { st.insertAdjacentHTML('beforeend', '<div id="yardTip"><button id="ytMove" aria-label="Let hits move the dummy"></button><button id="ytSet" aria-label="Dummy abilities">' + ICO.gear + '</button></div>'); t = $('yardTip');
      $('ytMove').onclick = e => { e.stopPropagation(); PR.yardMove = PR.yardMove !== true; Y.idle = 0; try { save(); sfx('ui_pick'); } catch (x) {} paint(); arm(); };
      $('ytSet').onclick = e => { e.stopPropagation(); t.classList.remove('on'); openDummy(); }; }
    const paint = () => { const on = PR.yardMove === true, b = $('ytMove'); b.innerHTML = on ? ICO.free : ICO.pin; b.classList.toggle('free', on); $('ytSet').classList.toggle('free', cfg().book.length > 0); }, arm = () => { clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3600); };
    t.style.left = Math.max(52, Math.min(st.clientWidth - 52, px)) + 'px'; t.style.top = Math.max(50, py) + 'px'; paint(); t.classList.add('on'); arm(); }
  // the dummy's own sheet: which abilities it casts on a loop, and whether it walks up and fights like a rival
  const pool = () => Object.keys(SP).filter(k => !(window.VARIANTS && VARIANTS[k]) && typeof ICON !== 'undefined' && ICON[k]);
  function openDummy() { const C = cfg(), sch = k => (typeof SCHOOL_OF === 'function' ? SCHOOL_OF(k) : 'wiz');
    const grid = id => pool().filter(k => sch(k) === id).map(k => { const n = C.book.indexOf(k); return `<button class="${n >= 0 ? 'on' : ''}" onclick="dummyPick('${k}')" title="${SP[k].n}"><img src="${ICON[k]}">${n >= 0 ? `<b>${n + 1}</b>` : ''}</button>`; }).join('');
    $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Sparring dummy</div>
      <div class="ssub" style="margin:0">Pick up to 4 abilities for the dummy to cast on a loop. Nobody has health here: the fight never ends, you just watch the numbers.</div>
      <div class="dmrow">${[0, 1, 2, 3].map(i => C.book[i] ? `<span onclick="dummyPick('${C.book[i]}')"><img src="${ICON[C.book[i]]}"><small>${SP[C.book[i]].n}</small></span>` : '<span class="em"></span>').join('')}</div>
      <div class="dmopt"><label class="opt"><span>It walks and keeps its distance like a rival</span><input type="checkbox" ${C.walk ? 'checked' : ''} ${C.book.length ? '' : 'disabled'} onchange="dummySet('walk',this.checked)"><i></i></label>
      <label class="opt"><span>My hits move it</span><input type="checkbox" ${PR.yardMove === true || (C.walk && C.book.length) ? 'checked' : ''} ${C.walk && C.book.length ? 'disabled' : ''} onchange="dummySet('move',this.checked)"><i></i></label></div>
      <div class="dml">Spells</div><div class="dmgrid">${grid('wiz')}</div><div class="dml">Techniques</div><div class="dmgrid">${grid('sorc')}</div>
      <button class="upbtn" style="margin-top:10px" onclick="dummyReset()">↺ Reset the scene</button>
      ${C.book.length ? '<button class="upbtn dk2" onclick="dummyClear()">Back to a plain dummy</button>' : ''}`;
    $('sheet').classList.add('on'); }
  window.openDummy = openDummy;
  const apply = () => { try { save(); } catch (e) {} Y.dirty = 1; openDummy(); };
  window.dummyPick = function (k) { const C = cfg(), i = C.book.indexOf(k); if (i >= 0) C.book.splice(i, 1); else if (C.book.length >= 4) return toast('The dummy holds 4 abilities. Tap one to take it out.'); else C.book.push(k); try { sfx('ui_pick'); } catch (e) {} apply(); };
  window.dummySet = function (what, v) { if (what === 'walk') cfg().walk = !!v; else PR.yardMove = !!v; apply(); };
  window.dummyReset = function () { Y.dirty = 1; try { if (typeof resetScars === 'function') resetScars(); sfx('ui_deal'); } catch (e) {} closeSheet(); toast('Scene reset'); };
  window.dummyClear = function () { cfg().book = []; cfg().walk = false; apply(); };
  function canvas() { let c = $('yardCv'); if (!c) { const st = document.querySelector('#home .stage'); if (!st) return null; c = document.createElement('canvas'); c.id = 'yardCv'; st.insertBefore(c, st.firstChild.nextSibling);
      c.addEventListener('pointerdown', e => { try { if (!Y.on || !Y.cam || !ents[1]) return; const r = c.getBoundingClientRect(), bx = Y.cam.sx + (e.clientX - r.left) / Y.cam.sc, by = Y.cam.sy + (e.clientY - r.top) / Y.cam.sc, d = ents[1];
          if (Math.abs(bx - d.x) < 30 && by > d.y - 82 * SC && by < d.y + 14) tip((d.x - Y.cam.sx) * Y.cam.sc, (d.y - 96 * SC - Y.cam.sy) * Y.cam.sc); else { const t = $('yardTip'); if (t) t.classList.remove('on'); } } catch (x) {} }); } return c; }
  function blit() { const c = canvas(); if (!c) return; const r = c.getBoundingClientRect(), w = r.width, h = r.height; if (!w || !h) return; const d2 = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(w * d2) || c.height !== Math.round(h * d2)) { c.width = Math.round(w * d2); c.height = Math.round(h * d2); }
    const g = c.getContext('2d'), me = ents[0], sw = 350, sc = w / sw, sh = h / sc, sx = 20; let cy = (me.y + AY) / 2 - 30; Y.camY += (cy - Y.camY) * .08; const sy = Math.max(120, Math.min(H - sh - 40, Y.camY - sh / 2));
    Y.cam = { sx, sy, sc }; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = true; g.drawImage(cv, sx * dpr, sy * dpr, sw * dpr, sh * dpr, 0, 0, c.width, c.height); }
  function frame(now) { if (!Y.on) return; Y.raf = requestAnimationFrame(frame); const dt = Math.min(.033, (now - Y.last) / 1000); Y.last = now; if (document.hidden || sheetOn() || !homeOn() || dt <= 0) return;
    try { if (Y.dirty || typeof M === 'undefined' || !M || !M.practice || typeof ents === 'undefined' || !ents || !ents[1] || !ents[1].isDummy) { Y.dirty = 0; build(); } step(dt); blit(); }
    catch (e) { Y.fails++; try { if (window.logCrash) logCrash('yard', e && e.message, '', e && e.stack); } catch (x) {} stop(); } }
  function start() { if (Y.on || !wanted() || !homeOn()) return; try { build(); } catch (e) { Y.fails++; try { if (window.logCrash) logCrash('yard', e && e.message, '', e && e.stack); } catch (x) {} return; }
    Y.on = true; Y.last = performance.now(); const st = document.querySelector('#home .stage'); if (st) st.classList.add('yard'); canvas(); cancelAnimationFrame(Y.raf); Y.raf = requestAnimationFrame(frame); }
  function stop() { if (!Y.on && !document.querySelector('#home .stage.yard')) return; Y.on = false; cancelAnimationFrame(Y.raf); const st = document.querySelector('#home .stage'); if (st) st.classList.remove('yard'); try { ended = true; running = false; } catch (e) {} }
  window.yardStart = start; window.yardStop = stop; window.YARD = Y;
  const SPK = m => `<svg viewBox="0 0 24 24"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor" stroke="#000" stroke-width="1.300" stroke-linejoin="round"/>${m ? '<path d="M15.500 9.500l5 5m0-5l-5 5" fill="none" stroke="#ff8a96" stroke-width="2.400" stroke-linecap="round"/>' : '<path d="M15.200 9a4.200 4.200 0 0 1 0 6M17.600 6.600a7.600 7.600 0 0 1 0 10.800" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}</svg>`;
  function muteBtn() { const st = document.querySelector('#home .stage'); if (!st) return; let b = $('ymBtn'); if (!b) { st.insertAdjacentHTML('beforeend', '<button id="ymBtn" aria-label="Training sound"></button>'); b = $('ymBtn'); b.onclick = () => { PR.yardMute = PR.yardMute !== true; try { save(); } catch (e) {} muteBtn(); if (!PR.yardMute) { try { sfx('ui_pick'); } catch (e) {} } }; }
    b.innerHTML = SPK(PR.yardMute === true); b.classList.toggle('off', PR.yardMute === true); }
  setTimeout(muteBtn, 900);

  // a real match takes the stage: the yard lets go before the match is built
  { const _nm = newMatch; window.newMatch = newMatch = function () { if (!Y.building) stop(); return _nm.apply(this, arguments); }; }
  { const _sh = show; window.show = show = function (s0) { if (s0 !== 'home') stop(); const r = _sh.apply(this, arguments); if (s0 === 'home') setTimeout(start, 350); return r; }; }
  // the hand changed while away: next visit shows the new hand (build() reads PR.hand each time)
  window.setYard = function (v) { PR.yard = !!v; try { save(); } catch (e) {} if (v) start(); else stop(); };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML;
    window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = $('pause') && $('pause').classList.contains('on'); if (inMatch) return h;
      return h.replace('<div class="opt"><span>Music</span>', `<label class="opt"><span>Training yard on the home screen</span><input type="checkbox" ${PR.yard !== false ? 'checked' : ''} onchange="setYard(this.checked)"><i></i></label><div class="opt"><span>Music</span>`); }; }

  const css = document.createElement('style');
  css.textContent = `#yardCv{position:absolute;inset:0;width:100%;height:100%;display:none}.stage.yard #yardCv{display:block}.stage.yard #heroCv{visibility:hidden}.stage.yard{background-image:none!important;background:#1a1228}
  #ymBtn{position:absolute;top:46px;right:10px;z-index:2;width:34px;height:34px;padding:5px;border-radius:11px;border:2px solid #000;background:linear-gradient(#4a3a80,#2b2050);color:#fff;box-shadow:0 3px 0 #000;cursor:pointer;display:none}.stage.yard #ymBtn{display:block}#ymBtn.off{color:#8f80b8}#ymBtn svg{width:100%;height:100%;display:block}
  #yardTip{position:absolute;z-index:3;display:none;gap:8px;transform:translate(-50%,-100%)}#yardTip.on{display:flex;animation:pop .25s}
  #yardTip button{width:42px;height:42px;padding:7px;border-radius:50%;border:2px solid #000;background:linear-gradient(#4a3a80,#2b2050);color:#b9a6ee;box-shadow:0 3px 0 #000;cursor:pointer;-webkit-tap-highlight-color:transparent}#yardTip button.free{background:linear-gradient(#ffd45e,#d99a14);color:#fff}#yardTip svg{width:100%;height:100%;display:block}
  .dmrow{display:flex;justify-content:center;gap:8px;margin:10px 0}.dmrow span{width:66px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer}.dmrow img{width:46px;height:46px;border-radius:12px;background:#0007;border:2px solid #ffd45e}.dmrow small{font:800 10px/1.1 Nunito;color:#d9cdfa;text-align:center}.dmrow .em{height:46px;width:46px;margin:0 10px;border-radius:12px;border:2px dashed #ffffff40;cursor:default}
  .dml{font:12px 'Lilita One';color:#b9a6ee;letter-spacing:.4px;margin:8px 0 4px}.dmgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}.dmgrid button{all:unset;cursor:pointer;position:relative;aspect-ratio:1;display:grid;place-items:center;border-radius:10px;background:#0007;border:2px solid #000}.dmgrid img{width:86%;height:86%}.dmgrid button.on{border-color:#ffd45e;box-shadow:0 0 8px #ffd45e88}.dmgrid b{position:absolute;top:-5px;right:-4px;width:16px;height:16px;border-radius:50%;background:#ffd45e;color:#2a1a00;font:11px/16px 'Lilita One';font-weight:400;text-align:center;border:1.5px solid #000}
  .dmopt{margin:4px 0}`;
  document.head.appendChild(css);
  setTimeout(() => { try { if (homeOn()) start(); } catch (e) {} }, 1200);
})();
