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
    noseq: ['Not twice in a row', '<svg viewBox="0 0 20 20"><rect x="2.500" y="6" width="6.500" height="8" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.900"/><rect x="11" y="6" width="6.500" height="8" rx="1.500" fill="none" stroke="currentColor" stroke-width="1.900"/><path d="M3 17 17 3" stroke="currentColor" stroke-width="2.100" stroke-linecap="round"/></svg>'],
    one: ['One copy only', '<svg viewBox="0 0 20 20"><rect x="5" y="3" width="10" height="14" rx="2.2" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M9 8l1.600-1.200v6.400" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  };
  const restrCodes = k => { const out = [], L = window.LOOP_ONCE || {};
    if (k === 'chosen' || k === 'bloodoath') out.push('passive'); if (L[k] || k === 'doubletake' || k === 'polarity') out.push('once'); if (k === 'sanctum' || k === 'opensanctum') out.push('rest'); if (window.NOSEQ && NOSEQ.has(k)) out.push('noseq');
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
          if (!(M.rival && M.rival.line) && !M.ladder && Math.random() < (first ? .65 : .22)) { const cls = (M.foeLook && M.foeLook.cls) === 'sorc' ? 'sorc' : 'wiz'; setTimeout(() => { try { if (!ended && ents[1] && !ents[1].dead) emoteSay(ents[1], null, pickOf(LINES[cls])); } catch (e) {} }, 1100); }
          if (Math.random() < (window.talkChance ? talkChance(first) : (first ? .3 : .12))) { const cls = (PR.look && PR.look.cls) === 'sorc' ? 'sorc' : 'wiz'; setTimeout(() => { try { if (!ended && ents[0] && !ents[0].dead) emoteSay(ents[0], null, pickOf(LINES[cls])); } catch (e) {} }, 2300); } } } catch (e) {}
      return r; }; }

  /* ---------------- What's New ---------------- */
  const LOG = [
    { v: '1.0.33.33', d: '27 Nov 2026', items: [
      'Fixed: Rematch could crash the battle as soon as it started.',
      'Large and Extra Large text: Hoot\'s lesson cards and the draft, synergy and reward tips now stay on the screen.',
      'Options → Crash log has a new Copy button that copies the whole log, ready to paste into a message.',
    ] },
    { v: '1.0.33.32', d: '26 Nov 2026', items: [
      'The opening splash: WIZARDS and SORCERERS now ride in on their curtains and meet in the middle.',
      'Fixed: menus and popups could stay hidden after a battle you played without touching the screen.',
      'Fixed: a Mirror shatter or a spell clash could stutter the battle and show an error message.',
      'The countdown ring on messages now drains every time and sits centred on the ✕, which is also easier to tap.',
      'Small phones: long titles no longer run under the ✕. The Wardrobe keeps your character clear of your name and title.',
      'Randomize Hand and switched-off options now look switched off and say why.'] },
    { v: '1.0.33.31', d: '26 Nov 2026', items: [
      'Your next ability only starts casting once the current attack is over: a Spell Cannon beam, a Rushdown combo, a Meteor barrage, a Draw orb hauling its catch, and the like.',
      'New Chosen One upgrade, Unbound Flow: your next ability starts casting right away, even while the last one is still going.',
      'The sorcerer\'s auto-attack jab now throws a real punch, the same as Rushdown\'s.'] },
    { v: '1.0.33.30', d: '26 Nov 2026', items: [
      'Sorcerers wearing the Crown or the Void Crown now wear an actual crown, not a thin circlet.',
      'Starfire Cannon (Season Pass): a gold beam with a white-hot core, streaming stars and a starburst where it lands. When you unlock it, the game tells you where to switch it on.',
      'Buying the Season Pass unlocks premium straight away (before, it could need a restart), and the pass shows your local price.',
      'The wizard\'s auto-attack is now a spinning star bolt with a comet tail and sparkles.'] },
    { v: '1.0.33.29', d: '26 Nov 2026', items: [
      'Auto-attacks: between casts, wizards fire a short-range Magic Bolt (stopped by walls) and sorcerers throw a lunging Jab up close. Each one that lands speeds up your current cast a little.',
      'The Gilded skin is now a proper gold.',
      'Faster start-up: the game no longer loads 83 unused character images.'] },
    { v: '1.0.33.28', d: '26 Nov 2026', items: ['The white chunk on a health bar after a hit now clears in about a second.'] },
    { v: '1.0.33.27', d: '26 Nov 2026', items: [
      'Overtime: if the deciding round runs out of time with both fighters standing, it goes on for 15 more seconds and every hit deals double damage.',
      'Sanctum: damage its caster takes inside it hits the dome twice over, so pressing a sorcerer in their domain can collapse it.',
      'Zodiac: the Pig is a damage sponge (more health, shrugs off a quarter of every hit), the Rooster runs wide loops, and the Monkey hops from point to point.',
      'Ability level-ups give 10 player XP.',
      'Battery: menus pause their decorative animations after 15 seconds untouched, the battle HUD only redraws what changed, and with music off the audio system sleeps between sounds.'] },
    { v: '1.0.33.26', d: '26 Nov 2026', items: ['Survival: you and your partner keep a target for at least a second instead of flicking between mobs that are about the same distance away.'] },
    { v: '1.0.33.25', d: '26 Nov 2026', items: [
      'Battery: the Home screen\'s training yard runs at a calmer frame rate and slows right down when you put the phone down; idle menus no longer redraw 60 times a second.',
      'Drafts always offer three different cards: no repeats, never only two. Survival crystals always offer three choices too.',
      'A screen\'s Hoot lesson now plays the first time you open it (Survival included). Every step can be skipped.',
      'Enemy casters fight back when your summons swarm them.',
      'Zodiac: the Dragon hunts summons first, sweeping out in a spiral, with 40% more health. Rats come as a pack of three, each dealing half damage.',
      'New Zodiac upgrade, Wallbreaker: the Juggernaut walks straight through enemy walls and pillars.',
      'Hitting ice walls, mud walls and pillars throws up smoke and shards.',
      'Ladder first wins pay more as you climb: +5 gems every five rivals, up to 50.',
      'The results screen\'s level ring updates when you upgrade an ability there.',
      'Sanctum-boosted hits no longer draw a ring on the ground under the target.'] },
    { v: '1.0.33.24', d: '26 Nov 2026', items: [
      'Sound is steadier: music loads one track at a time (it used to load every track at once and could starve the phone), and audio comes back on its own after a call, Siri or another app interrupts it.',
      'The pause button no longer covers your name in the battle and Survival bars; names now sit above the round pips.',
      'On smaller phones your coins and gems always stay on screen at the top.'] },
    { v: '1.0.33.23', d: '25 Nov 2026', items: ['The Season Pass has a new look: every reward is a card with its own art, amount and name, a tier path runs down the middle, and claiming tells you exactly what you got.'] },
    { v: '1.0.33.22', d: '25 Nov 2026', items: [
      'Fixed: a rare freeze where both fighters stopped moving mid-duel while their walk animation kept playing. The duel now recovers on its own.',
      'Polarity Draw: a near miss pulls the enemy caster, and now their summons, much harder.',
      'Polarity Repel bursts on the first caster or summon it touches. Walls no longer stop it, but every wall it crosses takes the hit.',
      'Zodiac Juggernaut: 15% more health.',
      'New Zodiac upgrade, Adaptation: each repeat hit from the same ability deals 15% less to your Juggernaut (up to 7 times) for the rest of the round, even after it falls. Seven orbs on its chest fill in that ability\'s colour.'] },
    { v: '1.0.33.21', d: '25 Nov 2026', items: ['Sorcerers\' mouths now sit under their eyes, where they belong, instead of down on the chin.'] },
    { v: '1.0.33.20', d: '25 Nov 2026', items: [
      'Fight Club: bounties now read as an entry fee and a prize (15 gems in, 25 for a win). Nothing about the rules changed.',
      'Your first coached duel is a Casual match: it never changes your trophies, even when you replay the tutorial.',
      'Skipping the tutorial before choosing a path gives 2 Spell Tokens and 2 Technique Tokens, the same 4 unlocks as finishing it.',
      'Small phones: the training yard\'s range arrows no longer sit on the Challenges, Ladder and Pass buttons.',
      'Fixed: the Ladder said first wins pay 10 gems; they pay 5.'] },
    { v: '1.0.33.19', d: '25 Nov 2026', items: [
      'New players start with every ability locked and choose their first four with tokens. Hoot suggests one to start with.',
      'Gem packs are bigger: 400 for $0.99, 2,200 for $4.99, 5,000 for $9.99.',
      'Chests are bigger and pricier: Magic Chest 25 skill points for 150 gems, Arcane Chest 80 for 400 gems.',
      'Cosmetics are bought with gems only. Former gold items cost 100 or 200 gems, and no gem cosmetic is under 100.',
      'Gems earned from level ups, ranks, the Ladder, Fight Club bonuses, the free pass track and the tutorial are halved. Free gems in the Shop are unchanged.',
      'Notices fit the screen, stay up for 3.5 seconds, and have a ✕ with a countdown ring.',
      'Hoot: "See the tutorial again" at the bottom of his panel. If you skip the tutorial he tells you where to find it.',
      'Fixed: the Skip tutorial button covered Hoot\'s words and the ✕ on ability pages. The 👁 button no longer covers long draft titles.'] },
    { v: '1.0.33.18', d: '25 Nov 2026', items: ['Drag an ability in your Battle Hand onto another slot to rearrange it.', 'Fixed: the bar at the top of the draft and order screens (you, the round, your rival) is centred again.'] },
    { v: '1.0.33.17', d: '25 Nov 2026', items: [
      'Season Pass premium is far bigger: 500 gold every tier, 10 Echo Runes every third tier, and five premium-only cosmetics in the first tiers (Starforged robe, Comet trail, Starfire cannon, Starfall aura, Void Crown), on top of the three season bloods.',
      'Spell Cannon colours: Gold, Jade, Violet and Aurora, earned on its ability page, plus the Starfire season skin.',
      'When two Spell Cannons collide, the clash point throws 8 wild lasers in both beams\' colours, instead of refracting off the casters.',
      'Abilities: your Battle Hand shows each ability\'s level.',
      'Hoot\'s panel ends with music controls: volume, sound, next song.'] },
    { v: '1.0.33.16', d: '25 Nov 2026', items: [
      'Season Pass: 30 tiers each season, filled by the XP you already earn. A free track for everyone with gold, skill points and gems.',
      'Premium track ($4.99 for the season, iOS app): about 740 gems, 9 Echo Runes, and three season blood colours: Molten, Inkwell and Prismatic. Tap Pass on the home screen.'] },
    { v: '1.0.33.15', d: '25 Nov 2026', items: ['Drafts give 3 picks every round, and 4 after you lose a round, so builds come together sooner now that matches are first to 3.', 'Free gems are bigger: 5 every hour, 20 a day, 50 a week, and 100 every 3 weeks.'] },
    { v: '1.0.33.14', d: '25 Nov 2026', items: [
      'Free gems in the Shop: 1 every hour, 5 a day, 20 a week and 60 a month. Come back to claim each one.',
      'Reminders (iOS app, next update): choose what Hoot reminds you about in Options, Notifications. Free gems, daily rewards, new rivals, the season ending.',
      'Spell Cutter now cuts a Spell Cannon: time slows, the beam splits, sparks fly and land as embers, and a blade runs up the beam into the caster for the cut plus a 5-damage blast.',
      'The Juggernaut swings: a heavy gold sweep shows exactly when it attacks.',
      'Zombies and beasts push apart instead of stacking, so a crowd surrounds you rather than all hitting from one spot.',
      'Endless shows how many enemies you have defeated, live.',
      'A severed zombie arm flies off in any direction.'] },
    { v: '1.0.33.13', d: '24 Nov 2026', items: [
      'Hoot is your help button: he sits bottom-right on every menu screen. A red dot means he has something new for you, like a lesson about the screen you are on or a mode that just opened. Screens no longer start tutorials on their own.',
      'The Club opens as you level: Survival at player level 2, the Fight Club at level 4. If you have already played them, they stay open.',
      'Training yard: pick its map. Tap the dummy and choose from all six arenas.',
      'Randomize your battle hand: a new button beside Saved hands deals a random 4 from everything, spells only, or techniques only.',
      'The loading curtains now keep their angle as they open.',
      'Survival: the opening now searches for your partner, not a rival. Choose how a partner looks: like a Fight Club fighter, a random stranger, or a clone of you. Solo runs show the horde.'] },
    { v: '1.0.33.12', d: '24 Nov 2026', items: [
      'Blood colours: a new Blood tab in the wardrobe. Crimson, Sapphire, Ichor, Toxic, Void and Spectral, unlocked by player level. Your fighter and your summons bleed your colour; everyone else bleeds red.',
      'Smoother big fights: zombies draw about 30% faster, and a crowd caught in one blast no longer floods the screen with blood.'] },
    { v: '1.0.33.11', d: '24 Nov 2026', items: ['Fixed: fighters without Bloodcraft (the training dummy included) no longer soak up the blood on the floor. Only Bloodcraft gathers it.'] },
    { v: '1.0.33.10', d: '24 Nov 2026', items: [
      'Fixed: the tabs at the bottom of the home screen could stop working and leave you stuck on Battle.',
      'Endless is now one life: fall once and the run is over. Hearts drop for you too, and you can grab one when hurt for 20% of your health.',
      'A revived partner is invincible for 3 seconds, glowing gold, and flickers as it wears off.',
      'Spell Cannon: a white impact flash the moment a beam first connects (once per beam), and the rays it throws off take the beam\'s own colour.',
      'Draw: an orb that just misses the enemy tugs them a little toward it as it passes.',
      'Every hit on any fighter, summon or zombie now draws blood. A held beam drips steadily.',
      'Training yard: the ground around the arena joins it without a visible edge, at any zoom.'] },
    { v: '1.0.33.9', d: '24 Nov 2026', items: ['The training yard\'s ground now carries on past the arena in every direction, so the camera never pans into empty space.'] },
    { v: '1.0.33.8', d: '24 Nov 2026', items: ['Spell Cannon burns hotter the longer it stays on a caster: each quarter second without a break hits 0.5 harder. Anything that breaks the beam resets it.'] },
    { v: '1.0.33.7', d: '24 Nov 2026', items: ['Nothing pops up for a second after a screen opens or a curtain clears: tips, the tutorial and the login reward now wait.'] },
    { v: '1.0.33.6', d: '24 Nov 2026', items: ['Halt a cast: the halt button under the target buttons stops your next cast for up to 1 second (tap again to let it go), then rests for 8 seconds. A halt sign over your fighter shows it, and rivals can do it too.'] },
    { v: '1.0.33.4', d: '24 Nov 2026', items: ['When a new version is out, Hoot tells you: a notification, a red dot on Hoot, and the Help section\'s button reads New update available.', 'Hoot stays animated in his panel, and the training yard keeps going behind it.'] },
    { v: '1.0.33.3', d: '24 Nov 2026', items: ['A shorter first tutorial: just your name, path, first unlock, your hand, a first duel and a first upgrade.', 'Hoot now gives a short tip the first time you open each screen. Skip any of them, or turn tips off.', 'On an ability page, Upgrades, Matchups, Colour, Trials and Starting upgrades fold away with a tap.', 'Chests show their odds clearly.'] },
    { v: '1.0.33.2', d: '24 Nov 2026', items: ['Tap your level badge or XP bar to see your player level, XP to the next level, how XP is earned and what each level gives.', 'Survival gives 25% less XP than a duel.'] },
    { v: '1.0.33.1', d: '24 Nov 2026', items: ['Sure Hit reworked: while the dome stands, your shots home in on enemies inside it, and other damaging casts land on every enemy inside it, summons included.',
      'Zodiac Beasts: a +2 upgrade for each animal. A draft offers at most one at a time.',
      'An enemy hidden behind one of your units now shows through it, faded with a red outline.',
      'Performance: fixed long freezes when enemies were hidden behind your units, and a drawing error when a Survival partner cast Arcane Orbs.'] },
    { v: '1.0.33', d: '24 Nov 2026', items: ['Matches are now first to 3 round wins.', 'Hoot sits on the home screen with ideas for what to do next: abilities ready to level, the next Ladder rival, rewards waiting. A red dot means something is ready now.',
      'Draft cards show a short stat line (damage, health, how many) instead of text.', 'Summons show a health bar from their first hit until they fall: green for yours, red for the enemy\'s.',
      'The daily login reward now appears after your first match instead of when you open the game.',
      'Survival: one timer, wave numbers instead of rounds, Survival results and pause text, your partner\'s hand shown large and labelled, and enemy area spells (meteors, fire rings, pits, thorns, acid, storms) now hurt your partner too.'] },
    { v: '1.0.32.5', d: '24 Nov 2026', items: ['Survival with a partner: defeated enemies sometimes drop a heart. A hurt partner walks over to collect it and heals 20%.', 'Endless: while your partner is down, upgrade crystals include a choice to revive them at 25% health.'] },
    { v: '1.0.32.4', d: '24 Nov 2026', items: ['Endless Survival: once every upgrade for your hand is taken, crystals offer a boon instead: more damage, faster casting, or more health for you and your partner. Bigger crystals give bigger boons.', 'Endless Survival: up to 50 enemies on the field (was 25), and zombie spawn points keep appearing, one every 5 seconds up to 24.'] },
    { v: '1.0.32.3', d: '24 Nov 2026', items: ['Every hit on a caster spills a small puddle of blood, and Bloodcraft can gather every puddle on the floor, whoever spilled it.', 'Endless Survival: your partner says which upgrade it took when you pick from a crystal.', 'Speech bubbles use larger text and wrap long lines.'] },
    { v: '1.0.32.2', d: '24 Nov 2026', items: ['Endless Survival: defeated enemies can drop an upgrade crystal (15% an upgrade, 10% a tier 2 upgrade, 5% a signature upgrade). It floats to you and lets you pick one of three for your hand; your partner takes one of the same kind.',
      'Spell Cannon beams now stop and refract on the first thing they hit, summons included, so a Juggernaut or zombie in the way takes the beam instead of you.',
      'A beam that burns you always refracts off you, including inside a Sanctum.'] },
    { v: '1.0.32.1', d: '24 Nov 2026', items: ['The Juggernaut\'s body now blocks shots: arrows, fireballs and other bolts, ricochet runes, blood lances and Dissection slashes stop on it instead of passing through to its caster.'] },
    { v: '1.0.32', d: '24 Nov 2026', items: ['Take the Blow now throws you well clear of the attack, and nothing can hurt you for a moment afterwards.', 'Bodyguard: your Juggernaut leaps in front of a Collapse or a tier 3 technique (Repel, Dissection, Blood lance, Rushdown) aimed at you and takes it instead, once every 4 seconds.'] },
    { v: '1.0.31', d: '24 Nov 2026', items: ['Collapse (and Unrestrained Collapse) catches every summon it touches, the Juggernaut included, drags them along, and destroys them all when it ends.',
      'Polarity\'s Draw: whatever its catch is dragged past takes 2 damage.',
      'The order screen lists the Zodiac upgrades you have taken.',
      'Survival round curtain: the horde, wave number and enemies defeated on top; you and your partner with your hands below.'] },
    { v: '1.0.30', d: '24 Nov 2026', items: ['Zodiac Beasts: the Rabbit comes as a litter of 4 (Warren upgrade: 7), the Snake\'s bite poisons over 3 seconds (Snake Pit upgrade: three snakes), and you ride your Horse across the arena, trampling the enemy caster if it runs through them.',
      'The Juggernaut gets up to a walking caster\'s pace within 7 seconds.',
      'Lightning and fire leave a fighter smouldering for 3 seconds, trailing embers as they move. A Sanctum going up scatters enemy fly swarms inside it.',
      'Melee hits from summons and mobs have a 0.25 second guard, so a crowd cannot land all its hits at once. Spells are unaffected.',
      'Draft cards show the ability\'s tier: plain parchment, then amber, then gilded with a gold rule.',
      'Co-op survival shows your partner\'s abilities in the top bar instead of question marks.',
      'Options are grouped into Gameplay, Sound, Display, Help and Account.'] },
    { v: '1.0.29', d: '24 Nov 2026', items: ['Coloured ability text now appears only on the ability page from the Abilities screen. Descriptions during a match are back to plain, readable text.'] },
    { v: '1.0.28', d: '24 Nov 2026', items: ['Ability and upgrade text is colour coded: health in light blue, damage in orange, cast and timing numbers in green, status effects in purple, movement in a warmer orange, and rules to keep in mind in yellow.',
      'Daily Challenges now come in Easy (50 gold), Medium (100) and Hard (150), drawn at random, with a countdown to the next free set and four new titles for completing them.',
      'Survival: enemies walk in from off screen. Casters open a wave as a group of 2, 4 or 6, with a fresh group every 30 seconds. Zombies pour from spawn points (2, 3, then 4; one more every 8 seconds in Endless), up to 25 on the field.',
      'Survival: your partner drafts as many picks as you do.',
      'A Sanctum going up dispels enemy storm clouds already inside it.',
      'New Collapse upgrade: Amped Output, 30% larger.',
      'Live Wire now takes your aura colour. The shop lists the ways to earn gems by playing. Hoot always suggests an ability to try.'] },
    { v: '1.0.27', d: '24 Nov 2026', items: ['The pause menu now scrolls when it is taller than the screen.', 'Survival: you and your partner aim at the nearest enemy by default, and the enemy caster target button is hidden there.', 'Survival: removed the grey outline that appeared behind some enemies.'] },
    { v: '1.0.26', d: '24 Nov 2026', items: ['Survival enemies now improve too: every wave you clear gives them one upgrade (Swift, Tough, Vicious or Swarming), shown on your draft screen. In Endless they gain one every 45 seconds.',
      'Zombie hordes also pick up Frenzy, then Grave Grip. Enemy casters get an upgrade for their own abilities per wave cleared.',
      'Enemy casters now pick you or your partner at random.',
      'The opening screen shows the version number.'] },
    { v: '1.0.25', d: '24 Nov 2026', items: ['Survival now has five enemy types: Zodiac (shadow beasts), Zombies (an ever-growing horde), and Wizards, Sorcerers or Mixed casters with 25 health and one ability each (two on wave 2, three on wave 3).',
      'Colour options are back on each ability\'s own page, and the wardrobe\'s Attacks tab is gone. Gilded Blood and Prismatic Collapse are picked on their ability pages too.',
      'Survival partners now act on their own: they have health (shown in the top bar), can fall, draft their own upgrades between attempts (shown on your draft screen), and a Regroup / Split up button calls them back or lets them roam.',
      'Survival gold: 2 per zombie, 3 per beast, 5 per caster when you clear all three waves (up to 250 a run). A failed run pays 10.',
      'Sanctum designs: Crimson, Jade, Gilded and Aurora domes, on the Sanctum page.',
      'Sorcerer outfits: Fitted Tee and Hoodie, in the colours of your gi.',
      'Every Ladder variant has its own badge on its icon.',
      'Home screen tidy-up: gear, bell and streak share the top row, the other buttons are evenly spaced, and the mute button sits in the top right corner.'] },
    { v: '1.0.24', d: '24 Nov 2026', items: ['Survival, a new Fight Club tab: mobs rise all around you. Survive 30, 60 and 90 seconds with 3 lives, or go Endless. You draft between attempts.',
      'Four kinds of mob (Shambler, Skitter, Hulk, Burster). Their damage and numbers grow 5% every 10 seconds.',
      'Bring an AI partner: a random hand, one of your saved hands, or a Fight Club favourite. Best runs are listed with the build you used.',
      'Colour options moved to the wardrobe: the Attacks tab lists every colour by attack, split into Spells and Techniques.',
      'New cosmetics: six hairstyles, nine hair colours (Living Flame, Aurora and Storm Front are animated) and six premium pets with their own effects.',
      'Home screen: your fighter\'s head (bottom right) opens the wardrobe, the bell sits beside the gear, and the login bonus is inside notifications.',
      'Dome Breaker only works while your Juggernaut is on the field.'] },
    { v: '1.0.23.1', d: '24 Nov 2026', items: ['Skill points: a win now gives 5 to every ability in your hand (a loss gives 2), so an Echo Rune on a win makes it 10.', 'Levelling an ability needs 1.5 times as many skill points, and trials pay half as many.', 'A fallen Juggernaut cannot be summoned again for its caster\'s next 3 Zodiac casts.'] },
    { v: '1.0.23', d: '24 Nov 2026', items: ['Target buttons in battle: four buttons on the left choose what you aim at (caster, walls, summons, nearest). Tap the lit one again for auto.',
      'Colourways: four new colours each for Fireball, Arcane Orbs, Bubbles, Ricochet, Fly Swarm, Gravity Well, Thorns, Ice Wall and Zodiac Beasts. Earn them by playing, on the ability page.',
      'New Ladder variant: Crimson Zodiac, with five fused beasts and the Regent. Win it from the 30th rival.',
      'Juggernaut: walks faster the longer it lives. New upgrades: Vanguard, Dome Breaker, Bodyguard and Take the Blow.',
      'Collapse erases enemy walls and ground effects in its path, and wears a Sanctum down twice as fast.',
      'Copy Cast and Mirror Counter cannot fire twice in a row. One Sanctum per caster: a new one replaces the old. New Sanctum upgrade: Bulwark (+50% durability).',
      'Chosen One: after taking one of its upgrades, the next waits until you lose another round.',
      'New opening: the curtain closes on WIZARDS and SORCERERS and VS slams down.',
      'Order screen: solid cards, and five abilities fit on one row. Hoot can be folded away on the Battle Hand. The training camera keeps you and the dummy in view.',
      'Fixes: new trails now show in the preview, Fight Club rivals no longer say "null", bonus tooltips stay on screen, round damage icons are no longer cut off, Blue Wall has no guide lines, and music uses less memory.'] },
    { v: '1.0.22.1', d: '25 Nov 2026', items: ['A Spell Cannon beam that reaches the enemy caster now stops on them and refracts, instead of passing straight through.'] },
    { v: '1.0.22', d: '25 Nov 2026', items: ['Ten more Ladder rivals: the base Ladder now has 30.', 'Seven new aura styles: Live Wire, Petal Whirl, Moons, Rune Circle, Shadow Tendrils, Frost Crown and Eclipse.',
      'Eight new trails: Frostbite, Falling Leaves, Bubbles, Voltage, Ink Blots, Coin Shower, Grave Wisps and Prism.', 'Animated emblems: Storm Caller now sparks, and Inferno, Aurora, Void Star, Tempest and Phoenix are new.',
      'New streak rewards: Prism trail at 30 in a row, Eclipse aura at 40, Phoenix emblem at 50.', 'Ability pages have a Works well with row.'] },
    { v: '1.0.21', d: '25 Nov 2026', items: ['Fight Club bounties: a 15-gem entry, 25 gems for a win. Bonuses for beating all wizards, all sorcerers, and 250 gems for all six. Re-roll the board for 100 gems. Star a beaten bounty to keep it for rematches.',
      'The Rank Road now runs to 5,000 trophies, with five new ranks.', 'Ladder rungs open every 75 trophies.', 'Gem packs give three times as many gems. An Echo Rune costs 50 gems.',
      'Collapse stops on a Sanctum and grinds it down from outside; from inside it shatters the dome on contact. Its wake is violet with afterimages; a rainbow version is a new Attacks cosmetic.',
      'An Open Sanctum now clashes with a regular one, and breaking it costs its caster 7 health.', 'Copy Cast is 35% slower and cannot copy Chosen One.', 'Targeting the caster no longer sees through decoys.', 'Every rival brings at least one attack.',
      'Bloodcraft: the disc forms at your hand before it flies. From level 5 some casts come out as a lance or a bursting blob.', 'Draft: Hoot tags a recommended pick, the hold hint is one line under the cards, and a ? shows your book size and when it grows.',
      'Battle report and match history open with a short story of the match.', 'Notifications come in pages of 14 with Clear all.', 'Training yard: a whistle at each reset (Options can turn it off), portraits in the tracker, and a note when your hand is not full.',
      'Chests chime when they open, and long chest results scroll.', 'Options: slow motion on critical hits can be switched off.', 'Hold a cosmetic you own to see how you got it.', 'Fixed: fighters no longer slide before the round starts. Sanctum lines reach the floor. Up to 10 saved hands.'] },
    { v: '1.0.20.1', d: '25 Nov 2026', items: ['Tap the training yard damage tracker to fold it down to just the countdown, and tap again to open it.'] },
    { v: '1.0.20', d: '25 Nov 2026', items: ['The top curtain is red on every transition.', 'Hoot no longer drifts out of his portrait on the Abilities page.', 'A stability and smoothness pass: less interface work every frame during fights.'] },
    { v: '1.0.19.2', d: '25 Nov 2026', items: ['The training yard tracker now counts down from 30 seconds. At zero the yard resets and the count starts again.'] },
    { v: '1.0.19.1', d: '25 Nov 2026', items: ['Swipe up or down on the training yard to change your fighter\'s range there too, with the same arrows and cooldown as in a fight.'] },
    { v: '1.0.19', d: '25 Nov 2026', items: ['Training yard: a damage tracker shows the last 30 seconds by ability, with damage and casts. Yours on top, the dummy\'s below.', 'A Spell Cannon fired at a Sanctum from outside now stops on the dome, wears it down and refracts off it. An Open Sanctum still lets the beam through.'] },
    { v: '1.0.18', d: '24 Nov 2026', items: ['An eye button on the draft and order screens opens a legend of what every icon means. The draft timer waits while it is open.'] },
    { v: '1.0.17', d: '24 Nov 2026', items: ['Either-or upgrades now take turns instead of replacing each other. With both Grave Circle and Death March, Raise Dead alternates between them, starting with the one you took first.', 'Blue Flame leaves blue embers, and fighters it burns catch blue fire.', 'Options has a Text size setting: Normal, Large or Extra large.'] },
    { v: '1.0.16', d: '24 Nov 2026', items: ['Blue Flame is blue all the way through: the extra shots from Twin and Triple, and its explosions.', 'Blue Wall is rebuilt: each cast sprays a fountain of blue fire that stands as a cone of flame for 3 seconds and burns enemies inside it.', 'Order screen: drag an ability onto another slot to swap them.'] },
    { v: '1.0.15.1', d: '24 Nov 2026', items: ['On the results screen, Upgrade now upgrades the ability on the spot and shows its cost, without opening the ability page.'] },
    { v: '1.0.15', d: '24 Nov 2026', items: ['A Spell Cannon beam burning into a Titan Shell throws wild rays off it until the shell shatters.'] },
    { v: '1.0.14', d: '24 Nov 2026', items: ['Your own fire thaws your frozen units and does them no harm: a Fireball, Ring of Fire, Meteor or Burning Body near a frozen summon unfreezes it.', 'Ice Breakers is now Breakers: zombies tear through mud walls, pillars, totems, turrets and Titan Shells at the faster rate too.'] },
    { v: '1.0.13', d: '24 Nov 2026', items: ['Pets celebrate when you win and droop when you lose, in the arena and on the results screen.', 'A red dot marks Challenges with gold to collect and the Ladder when a rival is ready to fight.', 'Battle Hand icons on the Abilities page are bigger.', 'Fixed: pages and ability sheets now always open at the top.', 'Cast queue icons show a blue number for how many of that ability\'s summons, walls or other things you have on the field right now.'] },
    { v: '1.0.12', d: '24 Nov 2026', items: ['Sanctum: you deal 50% more damage inside it (was 20%) and cast 20% faster. When it ends it breaks into shards instead of fading.', 'Hoot now reviews your Battle Hand, and suggests up to three abilities that would cover its weakness.', 'Token trades say what they give: spell points or technique points, each with its own icon.', 'Spirit Arrow shows its damage: 7 per arrow.', 'New Sanctum upgrade, Unmaking: enemy walls, pillars, totems and turrets inside the dome lose 15% of their full health every second.', 'Summons have their own sound when they die.', 'Damage breakdown uses colour instead of words: white is base, green is the level bonus, gold is hand bonuses.', 'Swipe stance now holds real ranges: close stays right on the rival, default holds the middle, far keeps well back. Each swipe moves one step.', 'The order screen is tighter: the loop time is gone, bonuses are one small row, and an ability\'s upgrades fold behind one button.'] },
    { v: '1.0.11.3', d: '24 Nov 2026', items: ['Ability tiles show their level, separate from the cast order number.', 'Tiles change colour with level: green from 5, blue from 10, red from 15. This shows on the order screen and in your cast queue.', 'Buying anything now plays a cha-ching.'] },
    { v: '1.0.11.2', d: '24 Nov 2026', items: ['Order screen: tapping an ability now only selects it. To change the order, tap Move, then tap the slot it should go to.'] },
    { v: '1.0.11.1', d: '24 Nov 2026', items: ['New Bloodcraft upgrade, Bloodthirst: each loop you draw in all blood on the field. Blood that is not your own adds 2% damage per pool for the next loop, up to 50%.'] },
    { v: '1.0.11', d: '24 Nov 2026', items: ['Swipe to move: in Auto movement, swipe up on the arena to close in a zone, swipe down to fall back. Each move takes 1.3 seconds; two arrows at the side show the cooldown.', 'Boundary now sends what it catches back at the enemy caster instead of off at random.', 'New Polarity upgrade, Cornered Force: below half health, Draw and Repel gain 2% damage for every 1% of health missing.', 'Targets has a new choice: Structures (walls, pillars, totems, hourglasses, turrets).', 'On the results screen, tapping an ability shows a small tooltip instead of its whole page.', 'The battle bar shows your name instead of "You".'] },
    { v: '1.0.10.2', d: '24 Nov 2026', items: ['Music: during a fight, Loop this song keeps the current song for the rest of the match.', 'Double-tap a song to favourite it. Favourites sit right under Now playing.', 'The tutorial now covers the training yard, the Ladder, streaks, rematches, saved hands, the hand rating and the battle report.', 'The open slot in the draft tray now turns clockwise instead of pulsing.'] },
    { v: '1.0.10.1', d: '24 Nov 2026', items: ['Options shows the name of the song that is playing. The "Follows the fight" wording is gone; that choice is now called Auto.'] },
    { v: '1.0.10', d: '24 Nov 2026', items: ['Summons can be bowled: a Repel orb, or Boundary letting go of a summon it caught, sends it sliding into the others and knocks them on like pins.', 'The Repel detonation throws sparks.', 'Damage now shows where it comes from: base, level bonus and hand bonuses, on the order screen and in the spell book.', 'Signature upgrades like Grand Bisection, and boss abilities, arrive in the draft with a chime and a shine.'] },
    { v: '1.0.9', d: '24 Nov 2026', items: ['Rematch: after a ranked or casual loss, pay 75 gold to fight the same rival again with the same hand. In ranked, a win gives your trophies back plus 10; a second loss costs double.', 'Music: Options shows the song that is playing. Tap it, then Change, to pick a song. Songs are grouped into Main menu and Battle, and each says when it plays.'] },
    { v: '1.0.8', d: '24 Nov 2026', items: ['The battle report now reads in plain sentences: your total damage, where it came from, and what your walls and shell absorbed.', 'The report notes hits blocked at the last second, and has a timeline of the whole match you can copy as text.', 'Fighters hit by fire catch alight: small flames cling to them and go out one by one.', 'Mud Wall is weaker: 65 health at level 1, down from 75.', 'The Ladder says whether each rival is a wizard or a sorcerer.'] },
    { v: '1.0.7', d: '24 Nov 2026', items: ['Fixed: the text on the draft scrolls was unreadable (a dark box sat behind it).', 'Fight Club replaces Friends: six tough bounties, three wizards and three sorcerers, with new faces every 30 minutes. 15 gems for each, 25 more for clearing the board.', 'The Ladder shows each rival\'s portrait; rivals further up are a question mark.', 'Your own hand shows on the versus screen.', 'Wardrobe: No Aura switches your aura off.', 'You can hear the training yard now. The speaker button under your path button silences it.', 'Menu music starts at full volume instead of fading in.'] },
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
