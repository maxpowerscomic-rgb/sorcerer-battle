/* =====================================================================
   WIZARDS VS SORCERERS: first-time onboarding
   Hoot the owl walks a new player through: name → look → spells (free
   Spell Token for a 4th spell) → first duel (short, easy, coached) →
   first upgrade → Shop, Friends and Ranks tour → welcome gift.
   State lives in PR.onb = { step, done }. Replay from Settings.
   ===================================================================== */
const ONB = { el: null, i: -1, tick: null, t0: 0, seen: {} };
const WIZ_NAMES = ['Ember', 'Quill', 'Mossbeard', 'Lumen', 'Pip', 'Sable', 'Thistle', 'Brin', 'Corvin', 'Wren', 'Juniper', 'Ash'];
const WIZ_TAILS = ['wick', 'spark', 'weaver', 'gleam', 'brook', 'thorn', 'mantle', 'hollow', 'fang', 'shade'];
const randName = () => WIZ_NAMES[Math.random() * WIZ_NAMES.length | 0] + WIZ_TAILS[Math.random() * WIZ_TAILS.length | 0];

/* ---------- overlay ---------- */
function onbBuild() {
  if (ONB.el) return;
  const css = document.createElement('style');
  css.textContent = `
  .onb{position:absolute;inset:0;z-index:70;pointer-events:none;font-family:'Nunito',sans-serif}
  .onb.hide{display:none}
  .onb .blk{position:absolute;background:transparent;pointer-events:auto}
  .onb .spot{position:absolute;border-radius:18px;box-shadow:0 0 0 2000px rgba(6,3,18,.74);transition:all .35s cubic-bezier(.3,1.3,.5,1);pointer-events:none}
  .onb .spot.none{box-shadow:0 0 0 2000px rgba(6,3,18,.74);width:0!important;height:0!important;left:50%!important;top:50%!important}
  .onb .spot.clear{box-shadow:none}
  .onb .spot:not(.none):not(.clear)::after{content:'';position:absolute;inset:-6px;border-radius:22px;border:3px solid #ffd45e;box-shadow:0 0 18px #ffd45eaa;animation:onbPulse 1.1s ease-in-out infinite}
  @keyframes onbPulse{50%{transform:scale(1.04);opacity:.55}}
  .onb .bub{position:absolute;left:14px;right:14px;display:flex;gap:10px;align-items:flex-start;pointer-events:auto;transition:top .35s,bottom .35s;animation:onbIn .35s cubic-bezier(.3,1.5,.5,1)}
  @keyframes onbIn{from{transform:translateY(14px) scale(.94);opacity:0}}
  .onb .owl{flex:none;width:74px;height:74px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#5a3fa8,#1d1240);border:3px solid #000;box-shadow:0 4px 0 #000}
  .onb .say{flex:1;background:#fff8e6;color:#2a1a40;border:3px solid #000;border-radius:16px;padding:10px 12px 10px;box-shadow:0 4px 0 #000;position:relative;font-weight:800;font-size:14px;line-height:1.3}
  .onb .say:before{content:'';position:absolute;left:-11px;top:24px;border:8px solid transparent;border-right-color:#000}
  .onb .say:after{content:'';position:absolute;left:-6px;top:26px;border:6px solid transparent;border-right-color:#fff8e6}
  .onb .say b.who{display:block;font:15px 'Lilita One';color:#7a3fd6;letter-spacing:.3px;margin-bottom:2px}
  .onb .say em{font-style:normal;color:#c2410c}
  .onb .row{display:flex;gap:8px;align-items:center;margin-top:9px;flex-wrap:wrap}.onb .pathrow{gap:6px}.onb .go.pth{flex:1 1 30%;padding:6px 4px;font-size:14px;line-height:1.1}.onb .go.pth small{display:block;font:800 9.5px Nunito;letter-spacing:0;opacity:.9;margin-top:2px;white-space:nowrap}.onb .pathrow+.dots,.onb .pathrow .dots{flex-basis:100%;justify-content:center}.onb .say{min-width:0}
  .onb .go{font:16px 'Lilita One';color:#2a1600;background:linear-gradient(#ffe27a,#f0a830);border:3px solid #000;border-radius:12px;padding:6px 16px;box-shadow:0 3px 0 #000;cursor:pointer}
  .onb .go:active{transform:translateY(2px);box-shadow:0 1px 0 #000}
  .onb .go[disabled]{filter:grayscale(1) brightness(.8)}
  .onb .skip{margin-left:auto;font:12px 'Nunito';font-weight:800;color:#8a7aa8;background:none;border:none;cursor:pointer;text-decoration:underline}
  .onb .dots{display:flex;gap:4px;margin-left:4px}.onb .dots i{width:6px;height:6px;border-radius:50%;background:#d8cdee}.onb .dots i.on{background:#7a3fd6}
  .onb .nin{width:100%;box-sizing:border-box;margin-top:8px;font:20px 'Lilita One';padding:8px 10px;border:3px solid #000;border-radius:12px;background:#fff;color:#2a1a40;outline:none}
  .onb .dice{font:18px 'Lilita One';background:#e9defc;border:3px solid #000;border-radius:12px;padding:5px 10px;cursor:pointer;box-shadow:0 3px 0 #000}
  .onb .gift{display:flex;align-items:center;gap:6px;font:18px 'Lilita One';color:#7a3fd6;margin-top:6px}
  .onb .tapme{position:absolute;width:34px;height:34px;pointer-events:none;animation:onbTap 1s ease-in-out infinite;filter:drop-shadow(0 3px 0 #000)}
  @keyframes onbTap{50%{transform:translate(6px,8px) scale(.9)}}`;
  document.head.appendChild(css);
  const el = ONB.el = document.createElement('div'); el.className = 'onb hide';
  el.innerHTML = `<div class="spot none"></div><div class="blk"></div><div class="blk"></div><div class="blk"></div><div class="blk"></div><div class="bub"></div><svg class="tapme" viewBox="0 0 40 40" style="display:none"><path d="M14 4c2 0 3.5 1.6 3.5 3.5v11l2-.3c1.6 0 2.8 1 3 2.3l.2.1c1.5-.4 3 .5 3.3 2l.3.1c1.4-.3 2.8.6 3 2 .9 5-1 10-5 12.3H16c-3-2-6-6-8-10-.6-1.4.4-3 2-3.2 1-.1 2 .4 2.6 1.3l.4.6V7.5C10.5 5.6 12 4 14 4z" fill="#fff" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  document.querySelector('.phone').appendChild(el);
  // a Skip button that stays up for the whole tour, not just the first screen
  if (!document.getElementById('onbSkipAll')) { const b = document.createElement('button'); b.id = 'onbSkipAll'; b.textContent = 'Skip tutorial'; b.onclick = e => { e.stopPropagation(); onbAskSkip(); }; document.querySelector('.phone').appendChild(b);
    const css = document.createElement('style'); css.textContent = `#onbSkipAll{position:absolute;top:calc(8px + env(safe-area-inset-top,0px));right:8px;z-index:9999;font:12px 'Lilita One';letter-spacing:.5px;padding:6px 11px;border-radius:11px;border:2px solid #000;background:#150f27e6;color:#e8e0ff;cursor:pointer;box-shadow:0 3px 0 #000;display:none}html.onb-on #onbSkipAll{display:block}`; document.head.appendChild(css); }
}
function onbAskSkip() {
  try { $('sheetP').innerHTML = `<button class="xbtn" onclick="closeSheet()">✕</button><div class="sh">Skip the tutorial?</div><div class="ssub" style="margin:0">You can replay it any time from Options.</div><button class="upbtn" onclick="closeSheet();onbFinish(true)">Skip it</button><button class="upbtn" style="background:linear-gradient(#4a3a80,#2b2050)" onclick="closeSheet()">Keep going</button>`; $('sheet').classList.add('on'); } catch (e) { if (confirm('Skip the tutorial? You can replay it from Options.')) onbFinish(true); } }
function owlCanvas() {
  const c = document.createElement('canvas'); c.width = c.height = 148; c.className = 'owl';
  const x = c.getContext('2d'); let t = 0;
  const draw = () => { if (!c.isConnected) return; t += 1 / 60; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 148, 148); x.translate(74, 136 + Math.sin(t * 2.4) * 2); x.scale(2.75, 2.75); try { drawPet(x, 'owl', t, 1); } catch (e) {} requestAnimationFrame(draw); };
  requestAnimationFrame(draw); return c;
}
/* keep what the tour is pointing at on screen: scroll its scrolling parent so the target sits in view,
   and keep it there while the step is up (a scrolled-away page used to strand the player) */
function onbAnchor(sel) {
  try { const list = Array.isArray(sel) ? sel : [sel], el = list.map(q => typeof q === 'string' ? document.querySelector(q) : q).find(Boolean); if (!el) return;
    let sc = el.parentElement; while (sc && sc !== document.body) { const st = getComputedStyle(sc); if (/(auto|scroll)/.test(st.overflowY) && sc.scrollHeight > sc.clientHeight + 1) break; sc = sc.parentElement; }
    if (!sc || sc === document.body) return; const r = el.getBoundingClientRect(), b = sc.getBoundingClientRect(), pad = 70;
    if (r.top < b.top + pad || r.bottom > b.bottom - pad) { const want = sc.scrollTop + (r.top - b.top) - Math.max(pad, (b.height - Math.min(r.height, b.height * .6)) / 2); sc.scrollTop = Math.max(0, want); }
  } catch (e) {} }
function onbRect(sel) {
  const els = (Array.isArray(sel) ? sel : [sel]).map(s => typeof s === 'string' ? document.querySelector(s) : s).filter(e => e && e.offsetParent !== null);
  if (!els.length) return null;
  const P = document.querySelector('.phone').getBoundingClientRect();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const e of els) { const r = e.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
  const pad = 6; return { x: x0 - P.left - pad, y: y0 - P.top - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, PW: P.width, PH: P.height };
}
const modalOpen = (except) => ['sheet', 'upm', 'lvup', 'chestOv', 'pause', 'rep'].filter(id => id !== except).some(id => { const e = document.getElementById(id); return e && e.classList.contains('on'); }) || (document.getElementById('curtain').className.includes(' on'));

/* ---------- steps ---------- */
const DOT_STEPS = ['name', 'path', 'look', 'spells', 'battle', 'upgrade', 'tour'];
function onbCur() { return ONB_STEPS[ONB.i]; }
const ONB_STEPS = [
  { id: 'welcome', dot: -1, enter() { nav('home'); },
    html: () => `<b class="who">Hoot</b>Hoo-hoo! Welcome to <em>Wizards vs Sorcerers</em>, apprentice. I'm Hoot, keeper of the spellbooks and the scrolls. Let's get you ready for your first duel!<div class="row"><button class="go" data-next>Let's go!</button><button class="skip" data-skip>Skip tutorial</button></div>` },
  { id: 'name', dot: 0,
    html: () => `<b class="who">Hoot</b>First things first. What shall the arena call you?<input class="nin" id="onbName" maxlength="16" value="${(PR.name && PR.name !== 'Starweaver') ? PR.name : randName()}"><div class="row"><button class="dice" id="onbDice" title="Random name">🎲</button><button class="go" id="onbNameGo">That's me!</button></div>`,
    after() { const i = document.getElementById('onbName'); i.focus(); i.select();
      document.getElementById('onbDice').onclick = () => { i.value = randName(); };
      const go = () => { const v = i.value.trim(); if (v.length < 3) { i.style.borderColor = '#d63a4a'; return; } PR.name = v; save(); refreshMeta(); onbNext(); };
      document.getElementById('onbNameGo').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); }; } },
  { id: 'path', dot: 1, enter() { nav('wardrobe'); if (typeof wCat !== 'undefined') { wCat = 'cls'; renderWardrobe(); } }, target: '.wstage', place: 'pinBottom',
    html: () => `<b class="who">Hoot</b><em>Wizards</em> wear robes and cast <em>Spells</em>: fire, ice, summons, clever tricks from a distance. <em>Sorcerers</em> wear the gi and use <em>Techniques</em>: cuts, fists and force, up close. Your pick decides your starting <em>tokens</em>, each one unlocks an ability. You can mix both later and switch looks any time.<div class="row pathrow"><button class="go pth" id="onbWiz">🪄 Wizard<small>4 Spell Tokens</small></button><button class="go pth" id="onbSorc" style="background:linear-gradient(#ff6b6b,#9a1020)">✊ Sorcerer<small>4 Technique Tokens</small></button><button class="go pth" id="onbBoth" style="background:linear-gradient(#c9b8ff,#6a4ad6)">✦ Try both<small>2 Spell + 2 Technique</small></button></div>`,
    after() { const pick = (c, sp, te) => { PR.look.cls = c; PR.tokens = sp; PR.tokS = te; PR.pathPick = sp && te ? 'both' : c; save(); refreshMeta(); try { renderWardrobe(); } catch (e) {} toast(sp && te ? '2 Spell Tokens and 2 Technique Tokens' : sp ? '4 Spell Tokens' : '4 Technique Tokens'); setTimeout(onbNext, 450); };
      document.getElementById('onbWiz').onclick = () => pick('wiz', 4, 0); document.getElementById('onbSorc').onclick = () => pick('sorc', 0, 4); document.getElementById('onbBoth').onclick = () => pick('wiz', 2, 2); } },
  { id: 'look', dot: 2, enter() { nav('wardrobe'); }, target: ['.wstage', '#cats', '#items'], place: 'pinBottom',
    html: () => `<b class="who">Hoot</b>Splendid, <em>${PR.name}</em>! Now dress the part. Tap a category, then pick your outfit, colours and pet.<div class="row"><button class="go" data-next>Looking sharp!</button></div>` },
  { id: 'spells', dot: 3, enter() { window.abTab = 'wiz'; nav('spells'); }, target: ['#abTabs', '#sgrid'], place: 'top',
    html: () => `<b class="who">Hoot</b>These are your <em>Abilities</em>. The <em>Spells</em> tab holds wizard magic, the <em>Techniques</em> tab holds sorcerer moves. You start with two of each. Using one in a duel earns <em>skill points</em> to level it up. A book of only one kind gets a <em>Pure</em> bonus!<div class="row"><button class="go" data-next>Got it</button></div>` },
  { id: 'token', dot: 3, enter() { window.abTab = PR.tokens > 0 ? 'wiz' : 'sorc'; window.abType = 'all'; nav('spells'); }, target: '#sgrid', place: 'top', allow: 'sheet',
    html: () => `<b class="who">Hoot</b>You have <em>${PR.tokens > 0 && PR.tokS > 0 ? PR.tokens + ' Spell Tokens and ' + PR.tokS + ' Technique Tokens' : PR.tokens > 0 ? PR.tokens + ' Spell Tokens' : (PR.tokS || 0) + ' Technique Tokens'}</em>. Spend one now: tap any locked ${PR.tokens > 0 ? 'spell' : 'technique'}, then <em>Unlock</em> it. The rest are yours to spend whenever you like. Every Rank Road checkpoint and level up gives another.`,
    // once the spell is unlocked, its reveal card closes by itself and the tour moves on
    guard() { if ((PR.chosen || []).length > 0 && !ONB.tokAuto) { const up = document.getElementById('upm'); if (up && getComputedStyle(up).display !== 'none') { ONB.tokAuto = 1; setTimeout(() => { const b = document.getElementById('upOk'); if (b) b.click(); }, 1500); } } },
    until: () => (PR.chosen || []).length > 0 && !modalOpen() },
  { id: 'hand', dot: 3, enter() { nav('spells'); }, target: '#handBar', place: 'bottom',
    html: () => `<b class="who">Hoot</b>Your <em>Battle Hand</em> is the 4 abilities you bring to a duel. Tap any ability to add or remove it. All 4 slots must be filled before you can battle.<div class="row"><button class="go" data-next>Ready to fight</button></div>` },
  { id: 'battle', dot: 4, enter() { nav('home'); }, target: '#battleBtn', place: 'top', tap: true,
    html: () => `<b class="who">Hoot</b>Time for your first duel! I've found you a gentle sparring partner. Tap <em>Battle</em>.`,
    until: () => ['vs', 'draft', 'order', 'battle'].some(id => document.getElementById(id).classList.contains('on')) },
  { id: 'match', dot: 4, coachMatch: true,
    until: () => { const r = document.getElementById('rewards').classList.contains('on'); if (r) ONB.won = M && M.score.me > M.score.foe; return r; } },
  { id: 'spoils', dot: 4, allow: 'all', target: () => PR.mTok > 0 ? '#rwCards' : '#rwBtn', place: 'top',
    html: () => `<b class="who">Hoot</b>Each ability you used earned <em>skill points</em>. Got an <em>Echo Rune</em>? Tap <em>×2</em> on one ability to double its points, win or lose. You get a token every level up.`,
    until: () => document.getElementById('home').classList.contains('on') && !modalOpen() },
  { id: 'upgrade', dot: 5, enter() { onbPrepUpgrade(); window.abTab = SCHOOL_OF(ONB.upK); nav('spells'); }, target: () => `.scard[onclick="openSpell('${ONB.upK}')"]`, place: 'auto', tap: true, allow: 'sheet',
    html: () => `<b class="who">Hoot</b>${ONB.won ? 'A fine first victory!' : 'Close one, but every duel pays!'} <em>${SP[ONB.upK].n}</em> now has enough skill points to level up. Tap it! Its page also shows what it is <em>strong against</em> and what to <em>watch out for</em>.`,
    until: () => document.getElementById('sheet').classList.contains('on') },
  { id: 'upgrade2', dot: 5, target: '#sheetP .upbtn', place: 'top', tap: true, over: 'sheet',
    html: () => `<b class="who">Hoot</b>Tap <em>Upgrade</em>. Spending skill points and coins makes the spell stronger for good.`,
    until: () => PR.spells[ONB.upK].lvl > ONB.upFrom && !modalOpen(),
    guard: () => { if (!document.getElementById('sheet').classList.contains('on') && !(PR.spells[ONB.upK].lvl > ONB.upFrom)) ONB.i -= 1; } },
  { id: 'shop', dot: 6, enter() { nav('shop'); }, target: ['#deals', '#chests'], place: 'pinBottom',
    html: () => `<b class="who">Hoot</b>The <em>Shop</em>. Daily deals and chests stuffed with skill points. Coins come from duels; <em>gems</em> are the rare stuff that buys chests and Echo Runes. Once you own everything, trade spare <em>tokens</em> for skill points here.<div class="row"><button class="go" data-next>Next</button></div>` },
  { id: 'friends', dot: 6, enter() { nav('friends'); }, target: '#flist', place: 'top',
    html: () => `<b class="who">Hoot</b>The <em>Fight Club</em>. Six tough bounties, three wizards and three sorcerers, with new faces every 30 minutes. Beat one for <em>gems</em>.<div class="row"><button class="go" data-next>Next</button></div>` },
  { id: 'ranks', dot: 6, enter() { nav('ranks'); }, target: '.tier.here', place: 'top',
    html: () => `<b class="who">Hoot</b>The <em>Rank Road</em>. This is you! Win ranked duels for trophies to climb it. Checkpoints pay out rewards and unlock tokens of your choice. Your account level also makes you cast faster, and earns <em>titles</em> to show under your name.<div class="row"><button class="go" data-next>Next</button></div>` },
  { id: 'done', dot: -1, enter() { nav('home'); },
    html: () => `<b class="who">Hoot</b>That's everything, <em>${PR.name}</em>. The arena awaits! Take these to get started.<div class="gift"><span class="ci" style="width:22px;height:22px;display:grid">${SVG.gem}</span>+100 gems</div><div class="row"><button class="go" data-finish>Let's duel!</button></div>` },
];

/* ---------- in-match coaching (bubble only, no blocking) ---------- */
const MATCH_TIPS = {
  draft1: { when: () => isOn('draft') && M.round === 1, target: '#cards', place: 'bottom', text: 'Pick an <em>ability</em>. It goes into your book for this match. You pick a few each round, and the rival drafts to counter you.', ttl: 8 },
  order: { when: () => isOn('order'), target: '#loopt', place: 'bottom', clear: true, text: 'Your fighter uses the book <em>in order, then loops</em>. Tap two to swap. Below, pick a <em>Battle Style</em> (the ★ is my advice) and <em>Auto</em> or <em>Steer</em> movement, then <em>Begin Duel</em>.', ttl: 8 },
  fight: { when: () => isOn('battle') && M.round === 1, target: null, place: 'top', clear: true, text: 'Abilities fire on their own! Watch the cast bars. If you chose <em>Steer</em>, hold and drag on the arena to move.', ttl: 7 },
  draft2: { when: () => isOn('draft') && M.round >= 2, target: '#cards', place: 'bottom', text: 'Now you can add abilities or <em>upgrade</em> ones you have. The buttons below let you <em>Reroll</em> once a round, <em>Remove</em> an ability, or <em>Undo</em> a pick.', ttl: 8 },
};
const isOn = id => document.getElementById(id).classList.contains('on');

/* ---------- engine ---------- */
function onbStart(fromStep) {
  onbBuild(); window.ONB_ACTIVE = 1;
  ONB.i = Math.max(0, ONB_STEPS.findIndex(s => s.id === (fromStep || 'welcome')));
  onbEnter();
  clearInterval(ONB.tick); ONB.tick = setInterval(onbTick, 120);
}
function onbEnter() {
  document.documentElement.classList.add('onb-on');
  const s = onbCur(); if (ONB.won === undefined && PR.onb) ONB.won = PR.onb.won; PR.onb = { step: s.id, won: ONB.won }; save(); ONB.t0 = performance.now();
  if (s.enter) s.enter();
  onbRenderBubble(); onbTick();
}
// spending an Echo Rune on the rewards screen during the tour carries straight on to the next step
window.onMasteryUsed = function () { try { const s = onbCur && onbCur(); if (window.ONB_ACTIVE && s && s.id === 'spoils') setTimeout(() => { const b = document.getElementById('rwBtn'); if (b && document.getElementById('rewards').classList.contains('on')) b.click(); }, 1200); } catch (e) {} };
function onbNext() { ONB.i++; if (ONB.i >= ONB_STEPS.length) return onbFinish(); onbEnter(); }
function onbRenderBubble(html, placeOverride) {
  const s = onbCur(), b = ONB.el.querySelector('.bub'); b.innerHTML = ''; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  const h = html || (s.html && s.html()); if (!h) { b.style.display = 'none'; return; } b.style.display = 'flex';
  b.appendChild(owlCanvas()); const say = document.createElement('div'); say.className = 'say'; say.innerHTML = h; b.appendChild(say);
  if (s.dot >= 0 && !html) { const d = document.createElement('div'); d.className = 'dots'; d.innerHTML = DOT_STEPS.map((_, i) => `<i class="${i <= s.dot ? 'on' : ''}"></i>`).join(''); (say.querySelector('.row') || say).appendChild(d); }
  say.querySelectorAll('[data-next]').forEach(e => e.onclick = () => { sfx('ui_click'); onbNext(); });
  say.querySelectorAll('[data-skip]').forEach(e => e.onclick = () => onbAskSkip());
  say.querySelectorAll('[data-finish]').forEach(e => e.onclick = () => onbFinish());
  ONB.place = placeOverride || s.place; if (s.after) s.after();
}
function onbLayout(target, place, opts = {}) {
  const el = ONB.el, spot = el.querySelector('.spot'), blk = el.querySelectorAll('.blk'), bub = el.querySelector('.bub'), tap = el.querySelector('.tapme');
  if (target) onbAnchor(typeof target === 'function' ? target() : target);
  const P = document.querySelector('.phone').getBoundingClientRect(), r = target ? onbRect(typeof target === 'function' ? target() : target) : null;
  const wasNone = spot.classList.contains('none');
  spot.classList.toggle('none', !r && !opts.clear); spot.classList.toggle('clear', !!opts.clear);
  if (r && wasNone) { spot.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => spot.style.transition = '')); }
  if (r) { Object.assign(spot.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); }
  // click blockers around the hole (or everywhere if no hole); none when the coach is just a tip
  const full = { x: 0, y: 0, w: P.width, h: P.height };
  if (opts.passAll) blk.forEach(b => b.style.display = 'none');
  else if (!r) { blk.forEach((b, i) => { b.style.display = i ? 'none' : 'block'; Object.assign(b.style, { left: 0, top: 0, width: full.w + 'px', height: full.h + 'px' }); }); }
  else {
    const rects = [[0, 0, full.w, r.y], [0, r.y + r.h, full.w, full.h - r.y - r.h], [0, r.y, r.x, r.h], [r.x + r.w, r.y, full.w - r.x - r.w, r.h]];
    blk.forEach((b, i) => { const [x, y, w, h] = rects[i]; b.style.display = 'block'; Object.assign(b.style, { left: x + 'px', top: y + 'px', width: Math.max(0, w) + 'px', height: Math.max(0, h) + 'px' }); });
  }
  // bubble above or below the hole
  let pl = place || 'auto'; if (r && pl === 'auto') pl = r.y + r.h / 2 > P.height / 2 ? 'top' : 'bottom';
  bub.style.top = bub.style.bottom = '';
  const bh = bub.offsetHeight || 120;
  if (!r) { if (opts.clear) bub.style.top = '118px'; else bub.style.top = Math.max(20, (P.height - bh) / 2 - 20) + 'px'; }
  else if (pl === 'pinBottom') bub.style.top = (P.height - bh - 8) + 'px';
  else if (pl === 'pinTop') bub.style.top = '8px';
  else if (pl === 'top') bub.style.top = Math.max(10, r.y - bh - 14) + 'px';
  else bub.style.top = Math.min(P.height - bh - 10, r.y + r.h + 14) + 'px';
  // pointing hand
  if (r && opts.tap) { tap.style.display = 'block'; tap.style.left = (r.x + r.w * .62) + 'px'; tap.style.top = (r.y + r.h * .55) + 'px'; } else tap.style.display = 'none';
}
function onbTick() {
  if (!ONB.el || ONB.i < 0) return; const s = onbCur(); if (!s) return;
  if (s.guard) s.guard();
  if (s.until && s.until()) return onbNext();
  if (s.coachMatch) return onbCoachMatch();
  if (s.silent) { ONB.el.classList.add('hide'); return; }
  const blocked = s.over ? modalOpen(s.over) : modalOpen();
  if (blocked && s.allow !== 'all') { ONB.el.classList.add('hide'); return; }
  ONB.el.classList.remove('hide');
  if (s.allow === 'all' && modalOpen()) { ONB.el.classList.add('hide'); return; }
  onbLayout(s.target, ONB.place, { tap: s.tap, passAll: s.allow === 'all', clear: s.clear });
}
function onbCoachMatch() {
  const el = ONB.el; window.ONB_SLOW = 1;
  const k = Object.keys(MATCH_TIPS).find(k => !ONB.seen[k] && MATCH_TIPS[k].when());
  if (ONB.cur && (!MATCH_TIPS[ONB.cur].when() || (MATCH_TIPS[ONB.cur].ttl && performance.now() - ONB.curT > MATCH_TIPS[ONB.cur].ttl * 1000))) { ONB.seen[ONB.cur] = 1; ONB.cur = null; }
  if (!ONB.cur && k && !modalOpen() && !document.getElementById('curtain').className.includes(' on')) { ONB.cur = k; ONB.curT = performance.now(); const t = MATCH_TIPS[k]; onbRenderBubble(`<b class="who">Hoot</b>${t.text}`, t.place); }
  if (!ONB.cur || modalOpen()) { el.classList.add('hide'); return; }
  el.classList.remove('hide'); const t = MATCH_TIPS[ONB.cur];
  onbLayout(t.target, t.place, { passAll: true, clear: t.clear });
  if (!t.clear) el.querySelector('.spot').classList.add('clear');
}
function onbPrepUpgrade() {
  // pick the hand spell closest to levelling and make sure it can level once
  const cand = PR.hand.filter(k => PR.spells[k].lvl < MAXL).sort((a, b) => (PR.spells[b].cards / CARDS[PR.spells[b].lvl]) - (PR.spells[a].cards / CARDS[PR.spells[a].lvl]));
  const k = ONB.upK = cand[0] || 'fireball', s = PR.spells[k];
  s.cards = Math.max(s.cards, CARDS[s.lvl]); PR.coins = Math.max(PR.coins, COST[s.lvl] + 60); ONB.upFrom = s.lvl; save(); refreshMeta();
}
function onbFinish(skipped) {
  document.documentElement.classList.remove('onb-on');
  clearInterval(ONB.tick); window.ONB_ACTIVE = 0; window.ONB_SLOW = 0; ONB.i = -1;
  if (!skipped && !(PR.onb && PR.onb.gifted)) { PR.gems += 100; PR.onb = { done: 1, gifted: 1 }; toast('+100 gems! Good luck out there.'); sfx('ui_coin'); }
  else PR.onb = Object.assign({}, PR.onb, { done: 1 });
  save(); refreshMeta(); if (ONB.el) ONB.el.classList.add('hide'); nav('home');
}
function replayTutorial() { PR.onb = { step: 'welcome' }; save(); location.reload(); }

/* first boot: a brand-new save starts the tutorial; a half-finished one resumes */
(function () {
  if (!PR.onb || PR.onb.done) return;
  let from = PR.onb.step || 'welcome';
  if (['match', 'battle'].includes(from)) from = 'battle';
  if (from === 'spoils') from = 'upgrade';
  if (from === 'upgrade2') from = 'upgrade';
  setTimeout(() => onbStart(from), 350);
})();
