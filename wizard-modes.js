/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.4 systems
   Loaded after wizard-onboard.js.
   - Rival hands are built (main ability, two partners, one cover), not rolled at random.
   - Rivals default to the school opposite the player's path; a setting changes that.
   - Ability type filter on the Abilities page.
   - Draft cards show restrictions and upgrades taken; holding one shows a tooltip.
   - Flavour lines for wizards and sorcerers.
   - What's New tab in Notifications.
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const pickOf = a => a[Math.random() * a.length | 0];

  /* ---------------- rival hands ---------------- */
  const SETUP = new Set(['icewall', 'thorns', 'earthm', 'hourglass', 'gravity', 'sinkhole', 'sanctum', 'flies', 'polarity']);          // hold, slow or herd the enemy
  const PAYOFF = new Set(['meteor', 'beam', 'storm', 'bubbles', 'ringfire', 'burnbody', 'rush', 'bloodoath', 'zodiac', 'zombies', 'golem', 'bloodcraft']);   // want a target that stays put
  const PAIRS = [['zombies', 'flies'], ['zombies', 'golem'], ['zodiac', 'healspring'], ['zodiac', 'sanctum'], ['zombies', 'sanctum'], ['golem', 'healspring'], ['icewall', 'beam'], ['icewall', 'archer'], ['titan', 'beam'], ['titan', 'zodiac'],
    ['rush', 'doubletake'], ['rush', 'earthm'], ['bloodoath', 'doubletake'], ['bloodoath', 'secondwind'], ['bloodoath', 'healspring'], ['polarity', 'burnbody'], ['polarity', 'ringfire'], ['polarity', 'orbs'], ['gravity', 'meteor'], ['gravity', 'ringfire'],
    ['sinkhole', 'meteor'], ['thorns', 'bubbles'], ['thorns', 'storm'], ['hourglass', 'beam'], ['mirror', 'ricochet'], ['mirror', 'fireball'], ['rift', 'fireball'], ['rift', 'ricochet'], ['gale', 'fireball'], ['gale', 'archer'], ['totem', 'archer'],
    ['shield', 'beam'], ['ghost', 'burnbody'], ['blink', 'burnbody'], ['blink', 'orbs'], ['counter', 'titan'], ['counter', 'secondwind'], ['dissect', 'sanctum'], ['dissect', 'copycast'], ['bloodcraft', 'sanctum'], ['bloodcraft', 'thorns'],
    ['lightning', 'storm'], ['lightning', 'flies'], ['chosen', 'beam'], ['chosen', 'meteor'], ['earthm', 'meteor'], ['earthm', 'dissect'], ['earthm', 'bloodcraft'], ['titan', 'secondwind'], ['sanctum', 'rush'], ['zodiac', 'earthm']];
  const paired = (a, b) => PAIRS.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const dmgAb = k => !!(STATS[k] && (STATS[k].dmg || STATS[k].dps)) && k !== 'sanctum';
  function syn(a, b) { let s = 0; if (paired(a, b)) s += 3; if (ELEM_OF[a] && ELEM_OF[a] === ELEM_OF[b]) s += 1; if ((SETUP.has(a) && PAYOFF.has(b)) || (SETUP.has(b) && PAYOFF.has(a))) s += 1.5; if (TYPE_OF[a] === TYPE_OF[b]) s += .4; return s; }
  window.abilitySyn = syn;
  const schoolWant = () => { const p = (typeof PR !== 'undefined' && PR.foeSchool) || 'opp'; return p === 'opp' ? ((PR.look && PR.look.cls) === 'sorc' ? 'wiz' : 'sorc') : p; };
  window.foeSchoolWant = schoolWant;
  /* main: what the rival loves and can hurt with. partners: what works with it. cover: what beats the things that beat those three. */
  function buildHand(prof, pool) {
    const fav = (prof && prof.fav) || {}, w = k => (fav[k] || 1) + Math.random() * 2;
    const mains = pool.filter(dmgAb); if (pool.length < 4 || !mains.length) return pool.slice().sort((a, b) => w(b) - w(a)).slice(0, 4);
    const main = mains.slice().sort((a, b) => w(b) - w(a))[0], hand = [main];
    for (let i = 0; i < 2; i++) { const rest = pool.filter(k => !hand.includes(k)); hand.push(rest.map(k => ({ k, s: hand.reduce((t, h) => t + syn(h, k), 0) + (fav[k] ? .6 : 0) + Math.random() * 1.2 })).sort((a, b) => b.s - a.s)[0].k); }
    const threat = {}; for (const h of hand) for (const c of (COUNTERS[h] || [])) threat[c] = (threat[c] || 0) + 1;
    const hasDef = hand.some(k => TYPE_OF[k] === 'support'), nDmg = hand.filter(dmgAb).length, rest = pool.filter(k => !hand.includes(k));
    const cover = rest.map(k => { let s = 0; for (const t in threat) if ((COUNTERS[t] || []).includes(k)) s += threat[t]; if (!hasDef && TYPE_OF[k] === 'support') s += 1.5; if (nDmg < 2 && dmgAb(k)) s += 2; return { k, s: s + Math.random() * .8 }; }).sort((a, b) => b.s - a.s)[0];
    hand.push(cover.k); return hand;
  }
  window.buildFoeHand = buildHand;
  if (typeof foeHand === 'function') { const _fh = foeHand;
    window.foeHand = foeHand = function (prof) {
      if (window.ONB_ACTIVE) return _fh.apply(this, arguments);
      try { const un = unlockedPath(), want = schoolWant(); let pool = un;
        if (want === 'wiz' || want === 'sorc') { const mine = un.filter(k => SCHOOL_OF(k) === want); pool = mine.length >= 4 ? mine : mine.concat(un.filter(k => !mine.includes(k)).sort(() => Math.random() - .5).slice(0, 4 - mine.length)); }
        else if (want === 'mix') { const a = un.filter(k => SCHOOL_OF(k) === 'wiz'), b = un.filter(k => SCHOOL_OF(k) === 'sorc'); if (a.length >= 2 && b.length >= 2) { const h = buildHand(prof, un); if (h.some(k => SCHOOL_OF(k) === 'wiz') && h.some(k => SCHOOL_OF(k) === 'sorc')) return h; const main = buildHand(prof, a)[0], other = buildHand(prof, b); return [main, other[0]].concat(buildHand(prof, un).filter(k => k !== main && k !== other[0]).slice(0, 2)); } }
        return buildHand(prof, pool); } catch (e) { return _fh.apply(this, arguments); }
    }; }
  // named rivals that turn up at random respect the preference too
  window.RIVAL_FILTER = q => { const w = schoolWant(); return w === 'mix' || q.cls === w; };
  window.setFoeSchool = function (v) { PR.foeSchool = v; try { save(); } catch (e) {} toast({ opp: 'Rivals will come from the other school.', wiz: 'Rivals will be wizards.', sorc: 'Rivals will be sorcerers.', mix: 'Rivals will mix spells and techniques.' }[v] || 'Saved'); };
  if (typeof settingsHTML === 'function') { const _sh = settingsHTML;
    window.settingsHTML = settingsHTML = function () { const h = _sh.apply(this, arguments), inMatch = $('pause') && $('pause').classList.contains('on'); if (inMatch) return h;
      const v = PR.foeSchool || 'opp', o = [['opp', 'The other school (default)'], ['wiz', 'Wizards'], ['sorc', 'Sorcerers'], ['mix', 'A mix of both']];
      const row = `<div class="opt"><span>Rivals I face</span><select class="bgmsel" onchange="setFoeSchool(this.value)">${o.map(([id, n]) => `<option value="${id}" ${v === id ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
      return h.replace('<div class="opt"><span>Battle music</span>', row + '<div class="opt"><span>Battle music</span>'); }; }

  /* ---------------- ability type filter ---------------- */
  const FILT = [['all', 'All'], ['melee', 'Melee'], ['proj', 'Projectile'], ['area', 'Area'], ['summon', 'Summon'], ['support', 'Support']];
  window.abType = 'all';
  window.setAbType = function (t) { window.abType = t; renderSpells(); };
  if (typeof renderSpells === 'function') { const _rs = renderSpells;
    window.renderSpells = renderSpells = function () { const r = _rs.apply(this, arguments);
      try { const grid = $('sgrid'); let bar = $('abFilt'); if (!bar) { bar = document.createElement('div'); bar.id = 'abFilt'; grid.parentNode.insertBefore(bar, grid); }
        bar.innerHTML = FILT.map(([id, n]) => `<button class="${abType === id ? 'on' : ''}" onclick="setAbType('${id}')">${n}</button>`).join('');
        let shown = 0; grid.querySelectorAll('.scard').forEach(el => { const m = /openSpell\('([a-z0-9]+)'\)/.exec(el.getAttribute('onclick') || ''), k = m && m[1], ok = abType === 'all' || (k && TYPE_OF[k] === abType); el.style.display = ok ? '' : 'none'; if (ok) shown++; });
        let none = $('abNone'); if (!none) { none = document.createElement('div'); none.id = 'abNone'; none.className = 'ssub'; grid.parentNode.insertBefore(none, grid.nextSibling); }
        const what = (window.abTab === 'sorc' ? 'technique' : 'spell'), label = (FILT.find(f => f[0] === abType) || [0, ''])[1].toLowerCase();
        none.textContent = abType === 'all' ? '' : shown ? `${shown} ${label} ${what}${shown > 1 ? 's' : ''}. Tap All to see every ${what}.` : `No ${label} ${what}s. Tap All to see every ${what}.`; none.style.display = abType === 'all' ? 'none' : '';
        /* A filtered list can be shorter than the screen. Then nothing scrolls and, with the phone touch guard blocking the bounce too,
           the page feels frozen (F-641). The page always keeps a little room to move, and says where the list ends. */
        const mc = grid.closest('.mc'); let pad = $('abPad'); if (!pad) { pad = document.createElement('div'); pad.id = 'abPad'; pad.style.flex = '0 0 auto'; mc.appendChild(pad); }
        pad.style.height = '0px'; pad.style.height = Math.max(0, mc.clientHeight + 70 - mc.scrollHeight) + 'px'; } catch (e) {}
      return r; }; }

  /* ---------------- draft cards: more at a glance, and a hold tooltip ---------------- */
  // casting restrictions, shown as small symbols on the cards and spelled out in the hold tooltip
  const RSYM = {
    once: ['Once a loop', '<svg viewBox="0 0 20 20"><path d="M15.6 6.2A6.6 6.6 0 1 0 16.6 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12.4 5.6h4v-4z" fill="currentColor"/><path d="M8.8 8l1.8-1.3v6.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
    rest: ['Rests every other loop', '<svg viewBox="0 0 20 20"><path d="M15.6 6.2A6.6 6.6 0 1 0 16.6 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12.4 5.6h4v-4z" fill="currentColor"/><path d="M8 7.4v5.4M12 7.4v5.4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>'],
    passive: ['Passive: always on', '<svg viewBox="0 0 20 20"><path d="M10 10c-1.6-2.8-3-3.8-4.6-3.8a3.8 3.8 0 0 0 0 7.6c1.600 0 3-1 4.600-3.800zm0 0c1.600 2.800 3 3.800 4.600 3.800a3.800 3.800 0 0 0 0-7.600c-1.600 0-3 1-4.600 3.800z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/></svg>'],
    one: ['One copy only', '<svg viewBox="0 0 20 20"><rect x="5" y="3" width="10" height="14" rx="2.2" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M9 8l1.600-1.200v6.400" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  };
  const restrCodes = k => { const out = [], L = window.LOOP_ONCE || {};
    if (k === 'chosen' || k === 'bloodoath') out.push('passive'); if (L[k] || k === 'doubletake' || k === 'polarity') out.push('once'); if (k === 'sanctum' || k === 'opensanctum') out.push('rest');
    try { if (ONE_COPY.has(k) && !out.length) out.push('one'); } catch (e) {} return out; };
  const restr = k => restrCodes(k).map(c => RSYM[c][0]);
  window.RESTR_SYMBOLS = RSYM;
  window.castRestr = restr;
  function tipShow(el, c) { let t = $('dtip'); if (!t) { t = document.createElement('div'); t.id = 'dtip'; $('draft').appendChild(t); }
    const s = SP[c.k], rs = restr(c.k), ups = [...M.me.up].filter(u => u.startsWith(c.k + '.')).map(u => { const o = UPG[c.k].find(q => c.k + '.' + q.id === u); return o ? o.n : ''; }).filter(Boolean);
    t.innerHTML = c.type === 'up' ? `<b>${c.u.n}</b><p>${c.u.d}</p><small class="r">Upgrade for ${s.n}${c.u.sig ? ' · Signature' : ''}</small>${ups.length ? `<small>Already taken: ${ups.join(', ')}</small>` : ''}`
      : `<b>${s.n}</b><p>${s.d}</p>${rs.length ? `<small class="r">${rs.join(' · ')}</small>` : ''}${ups.length ? `<small>Your upgrades: ${ups.join(', ')}</small>` : ''}`;
    const host = $('draft').getBoundingClientRect(), r = el.getBoundingClientRect(); t.style.display = 'block'; const th = t.offsetHeight, above = r.top - host.top > th + 14;
    t.style.top = (above ? r.top - host.top - th - 8 : r.bottom - host.top + 8) + 'px'; t.classList.toggle('below', !above); }
  function tipHide() { const t = $('dtip'); if (t) t.style.display = 'none'; }
  if (typeof renderDraft === 'function') { const _rd = renderDraft;
    window.renderDraft = renderDraft = function () { const r = _rd.apply(this, arguments);
      try { tipHide(); document.querySelectorAll('#cards .card').forEach(el => { const i = +el.dataset.i, c = M.offer[i]; if (!c) return; const up = c.type === 'up', txt = el.querySelector('.txt'), hold = el.querySelector('.hold');
          const n = [...M.me.up].filter(u => u.startsWith(c.k + '.')).length, copies = M.me.book.filter(b => b === c.k).length, rs = up ? [] : restrCodes(c.k);
          const meta = `<div class="cmeta">${rs.map(x => `<span class="ms" aria-label="${RSYM[x][0]}">${RSYM[x][1]}</span>`).join('')}${n ? `<span class="mu">${'<i></i>'.repeat(Math.min(n, 4))} ${n} upgrade${n > 1 ? 's' : ''}</span>` : ''}${!rs.length && !n && !up ? '<span class="mh">Hold for a description</span>' : ''}</div>`;
          if (hold) hold.outerHTML = meta; else if (txt) txt.insertAdjacentHTML('beforeend', meta);
          const foot = el.querySelector('.foot'); if (foot && up) foot.insertAdjacentHTML('beforeend', `<small>${SP[c.k].t}s</small>`);
          // hold: a tooltip with the description. The full ability page lives in the Abilities section, not mid-match.
          let lp = null, long = false; el.onpointerdown = () => { long = false; lp = setTimeout(() => { long = true; tipShow(el, c); if (navigator.vibrate) navigator.vibrate(12); }, 320); };
          const end = () => { clearTimeout(lp); tipHide(); }; el.onpointerup = end; el.onpointerleave = end; el.onpointercancel = end; el.oncontextmenu = e => e.preventDefault();
          el.onclick = () => { if (long) { long = false; return; } takeCard(i); }; }); } catch (e) {}
      return r; }; }

  /* ---------------- flavour lines ---------------- */
  const LINES = {
    wiz: ['I read ahead. You lose on page nine.', 'Mind the robe. It is dry-clean only.', 'I have a spell for this. I have a spell for everything.', 'Hold still. This one is still experimental.', 'My staff is older than your whole school.', 'Fire first, footnotes later.',
      'I failed alchemy for this.', 'You punch. I prepare. Guess who wins.', 'Do you know how long a beard like this takes?', 'This will only hurt for the duration.', 'The stars said you would lose. I checked twice.', 'Careful. I bite, and so does the book.',
      'I have tenure. I cannot be beaten.', 'Behold! No, wait. Other pocket.', 'A wizard is never late. You are simply early to lose.', 'I brought notes.', 'That was a warm-up cantrip.', 'Magic missile? No. Magic mistake: yours.',
      'I learned this one from a very angry owl.', 'Stand in the circle, please. For science.', 'Hats on. Gloves off.', 'I can do this all semester.', 'Your form is good. Your ending is not.', 'One of us studied. It shows.', 'Abracadabra is a real word and it means run.'],
    sorc: ['Talk less. Bleed more.', 'My hands are the spell.', 'You brought a stick to a fist fight.', 'Technique beats theory.', 'I trained on a mountain. You trained in a library.', 'Blink and it is over.', 'I felt that one coming yesterday.',
      'Robes tear. Remember that.', 'Step in. I dare you.', 'No chanting. Just hitting.', 'I have broken walls thicker than your plan.', 'One breath. One strike.', 'You read about power. I carry it.', 'My Sanctum has one rule: you lose.',
      'Stand up. I am not done.', 'My master hit harder than this. So will I.', 'Closer. I do my best work up close.', 'That hat makes a fine target.', 'I do not cast. I decide.', 'Every scar taught me something. You are about to learn.',
      'Your spell was pretty. Mine was faster.', 'I counted your openings. There were six.', 'Fists up, old man.', 'Do not look away. You will miss it.', 'Finish your sentence. It is your last.'],
  };
  window.FLAVOUR_LINES = LINES;
  if (typeof startDuel === 'function') { const _sd = startDuel;
    window.startDuel = startDuel = function () { const r = _sd.apply(this, arguments);
      try { if (typeof M !== 'undefined' && M && !M.practice && !window.ONB_ACTIVE && window.emoteSay && typeof ents !== 'undefined' && ents[1]) { const first = M.round === 1;
          if (!M.rival && !M.ladder && Math.random() < (first ? .65 : .22)) { const cls = (M.foeLook && M.foeLook.cls) === 'sorc' ? 'sorc' : 'wiz'; setTimeout(() => { try { if (!ended && ents[1] && !ents[1].dead) emoteSay(ents[1], null, pickOf(LINES[cls])); } catch (e) {} }, 1100); }
          if (Math.random() < (window.talkChance ? talkChance(first) : (first ? .3 : .12))) { const cls = (PR.look && PR.look.cls) === 'sorc' ? 'sorc' : 'wiz'; setTimeout(() => { try { if (!ended && ents[0] && !ents[0].dead) emoteSay(ents[0], null, pickOf(LINES[cls])); } catch (e) {} }, 2300); } } } catch (e) {}
      return r; }; }

  /* ---------------- What's New ---------------- */
  const LOG = [
    { v: '1.0.6.2', d: '24 Nov 2026', items: ['The dummy update: tap the training dummy, then the gear, to give it up to 4 abilities of its own. It casts them on a loop and can walk and keep its distance like a rival. Nobody has health, so the fight never ends.', 'Reset the scene from the same panel.'] },
    { v: '1.0.6.1', d: '24 Nov 2026', items: ['Tap the training dummy for a button that lets your hits move it: Repel shoves it, Draw hauls it in. It walks back to its mark when left alone.', 'A newly unlocked ability can go straight into your Battle Hand, swapping one out on the spot.'] },
    { v: '1.0.6', d: '24 Nov 2026', items: ['Battle report: after a match, see every round side by side. What each of you cast, how much landed, the damage, and moments like a shattered shell or a stopped attack.', 'Options has a Check for update button that fetches the newest version and restarts on it.', 'In the training yard, the ability icons fill their cast ring in real time, the same as in a match.', 'Ability icons for your profile are now earned: win 3 matches with an ability to wear its icon.', 'Fixed: the wardrobe tabs could get stuck after scrolling right to Attacks or Emblem.'] },
    { v: '1.0.5', d: '24 Nov 2026', items: ['The home screen is now a training yard: your fighter practises your Battle Hand on a straw dummy at battle size. A turret tests your walls and summons. Options can turn it off.',
      'The Advanced Ladder: thirty harder rivals built on two abilities at once, with 5-slot books. 100 gems for each first win.', 'Five new boss variants: Shadow Rush, Mirror Counter, Starfall Archer, Glass Golem and Black Frost.', 'Locked Ladder rivals hide their hands. Closing a rival returns to the Ladder.',
      'Levels were out-running health. Each ability level now adds 60% of what it used to.', 'Boundary now opens for 1 second: everything arriving is stopped, then flung off at random with a blue outline. A catch drops the fight into slow motion for a beat. Reloading it no longer costs your Polarity turn.', 'Sanctum is 15% bigger and wipes enemy hazards inside it when cast.',
      'You can leave a Titan Shell; it comes apart when you do. Walking Titan still moves with you.', 'Pause an ability for a round from the order screen. The order screen also shows what each ability does, in numbers.', 'New Polarity upgrades: Swift Force and Wide Force. Keen Edge also hits summons 50% harder. Overload melts walls 65% faster.',
      'Win streaks: each win in a row adds 25 gold to that win, up to 250. Ten in a row unlocks the Cinder Fox pet, twenty the Wildfire aura and Blaze trail.', 'Save favourite Battle Hands with a name and an icon, and load them with a tap.', 'The Abilities page rates your Battle Hand: one line on its strength, one on its weakness.', 'Trade spare tokens for skill points, gold or gems in the shop.', 'Wardrobe: try any locked item on before you get it, hairstyles for sorcerers, and outfits that come with their own trail.', 'Ability trials run much further, in smaller steps.', 'Tap a bonus like Warden or Pure Sorcerer to see what is giving it.',
      'Twelve new cast sounds and two more late-fight songs.', 'Options: how much your fighter talks, and a crash log you can send us.', 'Fixed: the Abilities page felt frozen after choosing a filter. Thornfield and other floor effects now have tooltips.', 'The results screen shows how many Echo Runes you hold.', 'A splash screen on load, and a new logo: Wizards in red, Sorcerers in blue.', 'Phones held sideways are asked to turn upright.'] },
    { v: '1.0.4', d: '24 Nov 2026', items: ['New mode: the Ladder. Twenty named rivals with built hands, gems for each first win, and their signature ability if you do not own it.', 'Boss variants: abilities with a twist that can only be won on the Ladder.',
      'You cannot start a new cast while one of your moves is still playing out (Collapse, Grand Bisection, strings, beams).', 'Boundary now stops any move, holds it for a second and sends it back. A Spell Cannon beam scatters for as long as it fires.',
      'New upgrades: One-Way Walls (Sanctum), Stunning Force (Polarity), Living Blood (Bloodcraft), Second Body (Raise Dead).', 'Sanctum clash burnout is shorter: 1 loop for the winner, 2 for the loser.',
      'Blink: enemies aim at your afterimage until it fades.', 'Not Yet and Final Attempt now burn white.', 'Rivals build real hands and come from the other school by default (change it in Options).',
      'Draft cards show restrictions and upgrades taken; hold a card for a quick description.', 'Filter your abilities by type.', 'New aura styles, trails and class pets in the wardrobe.', 'Menus always play Candlelit Grimoire. Four new battle tracks follow the fight.', 'New starting choice: Wizard, Sorcerer or Both, with tokens to match.', 'Rushdown casts a little faster, to offset the new cast rule.', 'Fixed a rare freeze when a Titan Shell bit a bursting zombie.', 'Tutorial bubbles no longer run off narrow phones.'] },
    { v: '1.0.3', d: '23 Nov 2026', items: ['Two new techniques: Blood Oath and Bloodcraft.', 'Draw is now a fired orb that hauls back the first enemy it touches.', 'Sanctum clashes are decided by health, then level. Both domes shatter.', 'Signature upgrades (Grand Bisection, Collapse, Blitz, Bloodburst) need one other upgrade first.',
      'Starting upgrade slots only take basic upgrades.', 'Burning Body uses the new fire.'] },
    { v: '1.0.2', d: '23 Nov 2026', items: ['Sanctum reworked: +20% damage inside, leave it and it crumbles, 20% bigger, and two Sanctums clash.', 'Challenge gold is collected by tapping Collect.'] },
    { v: '1.0.1', d: '22 Nov 2026', items: ['Gem packs, a feedback form and a rating prompt.', 'Smoother frame rate on phones.', 'Sheets opened from the pause screen now appear on top.', 'New Storm Cloud icon.'] },
    { v: '1.0', d: '22 Nov 2026', items: ['First release.'] },
  ];
  window.CHANGELOG = LOG;
  if (typeof openNotes === 'function') { const _on = openNotes; let mine = false;
    const addTab = () => { const tabs = document.querySelector('#sheetP .ntabs'); if (!tabs || tabs.querySelector('.wn')) return; const fresh = PR.seenVer !== GAME_VERSION;
      tabs.insertAdjacentHTML('beforeend', `<button class="wn ${mine ? 'on' : ''}" onclick="openNotes('new')">What's New${fresh ? '<i></i>' : ''}</button>`); if (mine) tabs.querySelectorAll('button:not(.wn)').forEach(b => b.classList.remove('on')); };
    window.openNotes = function (t) {
      if (t === 'new' || (t === undefined && mine)) { mine = true; _on('notes'); PR.seenVer = GAME_VERSION; try { save(); } catch (e) {}
        const P = $('sheetP'), tabs = P.querySelector('.ntabs'); P.querySelector('.sh').textContent = "What's New"; [...P.children].forEach(el => { if (el !== tabs && !el.classList.contains('xbtn') && !el.classList.contains('sh')) el.remove(); });
        P.insertAdjacentHTML('beforeend', `<div class="wnlist">${LOG.map(g => `<div class="wnv"><div class="wnh"><b>Version ${g.v}</b><small>${g.d}</small></div><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`); addTab(); return; }
      mine = false; const r = _on.apply(this, arguments); addTab(); return r; }; }

  const css = document.createElement('style');
  css.textContent = `#abFilt{display:flex;flex-wrap:wrap;gap:5px;padding:2px 1px 8px}
  #abFilt button{flex:1 1 auto;font:12.5px 'Lilita One';letter-spacing:.2px;color:#b9a6ee;background:#1a1236;border:2px solid #000;border-radius:11px;padding:4px 7px;cursor:pointer;box-shadow:0 2px 0 #000;white-space:nowrap}#abFilt button.on{color:#2a1600;background:linear-gradient(#ffe27a,#f0a830)}
  .card .cmeta{display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-top:4px}.card .cmeta span{font:800 9.5px Nunito;letter-spacing:.2px;border-radius:6px;padding:1px 6px;border:1.5px solid #3a2410;white-space:nowrap}
  .card .cmeta .ms{display:inline-grid;place-items:center;width:22px;height:22px;padding:0;border-radius:50%;background:#5a2a12;color:#ffe9c2}.card .cmeta .ms svg{width:16px;height:16px;display:block}.card .cmeta .mc{background:#fff3d6;color:#3a2410}.card .cmeta .mh{border-color:transparent;color:#8a6a48;padding-left:0;font-weight:700}
  .card .cmeta .mu{display:inline-flex;gap:2px;align-items:center;background:#3a2410;color:#ffd75e;padding:2px 5px}.card .cmeta .mu i{width:6px;height:6px;border-radius:50%;background:#ffd75e;box-shadow:0 0 0 1px #000}
  .card.isup .foot{flex-direction:column;gap:1px}.card .foot small{display:block;font:800 10px Nunito;opacity:.85}
  #dtip{position:absolute;left:16px;right:16px;z-index:9;display:none;background:#0b0816f5;border:2px solid #ffd45e;border-radius:14px;padding:9px 12px;box-shadow:0 4px 0 #000;pointer-events:none;animation:dtip .14s ease-out}
  #dtip b{font:16px 'Lilita One';color:#ffd75e;letter-spacing:.3px}#dtip p{margin:3px 0 0;font:700 13px Nunito;line-height:1.3;color:#f1eaff}#dtip small{display:block;margin-top:4px;font:800 11px Nunito;color:#b9a6ee}#dtip small.r{color:#ffb38a}
  @keyframes dtip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  .ntabs .wn{position:relative}.ntabs .wn i{position:absolute;top:3px;right:5px;width:8px;height:8px;border-radius:50%;background:#ff4a5a;box-shadow:0 0 0 1.5px #000}
  .wnlist{display:flex;flex-direction:column;gap:9px;margin-top:8px}.wnv{background:#0006;border:2px solid #000;border-radius:12px;padding:8px 11px}.wnh{display:flex;justify-content:space-between;align-items:baseline}
  .wnh b{font:15px 'Lilita One';color:#ffd75e;letter-spacing:.4px}.wnh small{font:800 11px Nunito;color:#8d7fbf}.wnv ul{margin:5px 0 0;padding-left:17px}.wnv li{font:700 12.5px Nunito;line-height:1.35;color:#e8e0ff;margin:3px 0}`;
  document.head.appendChild(css);
})();
