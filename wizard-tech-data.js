/* =====================================================================
   WIZARDS VS SORCERERS: sorcerer TECHNIQUES (data)
   Loaded after wizard-data.js and before the game script. Wizards cast Spells,
   sorcerers use Techniques. Every card has a school; the game logic for the
   techniques lives in wizard-techniques.js.
   ===================================================================== */
COL.ki = ['#ffd6d2', '#ff3b4a', '#4a0610'];     // sorcerer energy: crimson
COL.ward = ['#e6f0ff', '#7aa6ff', '#1a2a6a'];   // barrier blue
COL.beast = ['#e8dcff', '#8a6cff', '#140a30'];  // shadow ink
COL.mud = ['#f0d6a6', '#a8703a', '#3a220c'];    // earth and mud
COL.chosen = ['#effcff', '#7fd8ff', '#0b3a5c']; // Chosen One light
COL.blood = ['#ffc2c2', '#c8102e', '#3a0008'];  // spilled blood

const TECH = {
  dissect:    { n: 'Dissection',    el: 'ki',    t: 1.3, range: 170, d: 'Throw a razor-thin cutting slash. It stops at the first creature or caster it hits.', tag: 'Cuts' },
  sanctum:    { n: 'Sanctum',       el: 'ward',  t: 3, range: 150, d: 'A 100 HP dome. Inside it you deal 50% more damage and cast 20% faster, and enemies are trapped, slowed and hit by your casts. Leave it and it crumbles. Damage you take inside it hits the dome twice over.', tag: 'Dome' },
  doubletake: { n: 'Double Take',   el: 'ki',    t: 1.5, range: 150, d: 'Clap, and swap places with the enemy. Their aim is thrown off for a moment. Only one Double Take per loop.', tag: 'Swaps' },
  rush:       { n: 'Rushdown',      el: 'ki',    t: 1.6, range: 70,  d: 'Dash at the nearest enemy unit, land a 4-punch combo it cannot walk out of, then spring back. Ice in the way gets punched first.', tag: 'Brawls' },
  polarity:   { n: 'Polarity',      el: 'ward',  t: 1.8, range: 160, d: 'Alternates each cast: Draw fires an orb that hauls the first enemy it touches back to you; Repel fires one that shoves back all it passes through.', tag: 'Push/Pull' },
  zodiac:     { n: 'Zodiac Beasts', el: 'beast', t: 2.4, range: 180, d: 'Summon one of the twelve zodiac shadow-beasts at random. Each one fights differently.', tag: 'Summons' },
  titan:      { n: 'Titan Shell',   el: 'ward',  t: 1.6, range: 120, d: 'A spectral guardian soaks direct hits until it breaks and deals 5 back to whatever hits it. You are rooted inside. Once per loop.', tag: 'Armor' },
  counter:    { n: 'Counter Stance', el: 'ki',   t: 1.2, range: 120, d: 'Brace for a moment. The first melee hit is cancelled and the attacker is thrown back, hurt and stunned. Once per loop.', tag: 'Counters' },
  secondwind: { n: 'Spirit Tuning', el: 'ki',    t: 1.8, range: 160, d: 'Tune your spirit and mend your own wounds for a few seconds. Pauses for a moment each time you are hit.', tag: 'Heals' },
  earthm:     { n: 'Earth Manipulation', el: 'mud', t: 2.0, range: 140, d: 'Turn the ground around you to deep mud. Enemies in it move 45% slower, and an enemy caster in it charges 25% slower.', tag: 'Terrain' },
  chosen:     { n: 'Chosen One',    el: 'chosen', t: .25, range: 0, d: 'Passive: all your abilities cast 25% faster. Its own turn passes in a blink. Upgrades only show up after you lose 2 rounds in a row.', tag: 'Passive' },
  copycast:   { n: 'Copy Cast',     el: 'ki',    t: 1.75, range: 150, d: 'Your eyes lock on. The next spell or technique the enemy casts, you instantly cast right back.', tag: 'Copies' },
  bloodoath:  { n: 'Blood Oath',    el: 'ki',    t: 2.0, range: 70,  d: 'A pact while it is in your book: 35% less health, but you take 20% less damage, cast 12% faster and regenerate. Cast: dash in for 2 bleeding sword cuts.', tag: 'Pact' },
  bloodcraft: { n: 'Bloodcraft',    el: 'blood', t: 1.5, range: 170, d: 'Throw a spinning disc of blood that cuts the first enemy or wall it reaches. Spilled blood flows back to you every loop.', tag: 'Blood' },
};
const SORC = new Set(Object.keys(TECH));
function SCHOOL_OF(k) { return SORC.has(k) ? 'sorc' : 'wiz'; }
const SCHOOL_SYN = {
  wiz:  { n: 'spell damage', t: 'Pure Wizard', i: '✶', c: '#b9a6ff' },
  sorc: { n: 'technique damage', t: 'Pure Sorcerer', i: '✊', c: '#ff6b6b' },
};
Object.assign(SP, TECH);

/* Healing Spring: a wizard SPELL (not in TECH, so its school is 'wiz'). */
COL.life = ['#eafff6', '#5ff0c0', '#0b5a48'];
SP.healspring = { n: 'Healing Spring', el: 'life', t: 2.2, range: 150, d: 'A glowing spring wells up where you stand. Stay inside it and it heals you every second.', tag: 'Heals' };
ELEM_OF.healspring = 'water';
UPG.healspring = [{ id: 'shared', n: 'Shared Waters', d: 'Your creatures standing in the spring are healed too.' }, { id: 'wide', n: 'Wide Spring', d: 'The spring is 40% bigger.' }, { id: 'purify', n: 'Purifying Waters', d: 'The spring puts out burns and washes off slows.' }, { id: 'deep', n: 'Deep Spring', d: 'The spring lasts 2 seconds longer.' }];

const TECH_STATS = {
  healspring: { heal: [4, 4.5, 5, 5.5, 6], dur: [4, 4, 4.5, 4.5, 5], radius: [58, 60, 62, 65, 68] },
  dissect:    { dmg: [10, 11, 13, 15, 17] },
  sanctum:    { dur: [3, 3.2, 3.4, 3.7, 4], radius: [132, 139, 146, 156, 166] },
  doubletake: { stun: [0.3, 0.35, 0.4, 0.45, 0.5] },
  rush:       { dmg: [4.2, 4.6, 5.1, 5.7, 6.4] },
  polarity:   { dmg: [8, 9, 10, 12, 14], pull: [260, 280, 300, 330, 360] },
  zodiac:     { hp: [36, 40, 46, 52, 60], dmg: [6, 6.8, 7.5, 9, 10.5] },
  titan:      { hp: [26, 30, 34, 39, 45] },
  counter:    { dmg: [10, 11, 12, 14, 16], dur: [2.2, 2.3, 2.4, 2.6, 2.8] },
  secondwind: { heal: [3, 3.4, 3.8, 4.4, 5], dur: [3, 3, 3.2, 3.4, 3.6] },
  copycast:   { stun: [0.2, 0.25, 0.3, 0.35, 0.4] },
  bloodoath:  { dmg: [6, 6.6, 7.3, 8.1, 9], regen: [1, 1.1, 1.2, 1.3, 1.4] },
  bloodcraft: { dmg: [10, 11, 12, 14, 16] },
  chosen:     { haste: [25, 26, 27, 28, 30] },
  earthm:     { dur: [6, 6, 6.5, 6.5, 7], radius: [95, 98, 102, 106, 112], wall: [65, 71, 78, 87, 97] },
};
for (const k in TECH_STATS) for (const st in TECH_STATS[k]) {
  const a = TECH_STATS[k][st], step = (a[4] - a[0]) / 4 * (LEVEL_SCALED.has(st) ? LEVEL_GROWTH : 1), dec = a.some(v => v % 1) ? 1 : 0;
  TECH_STATS[k][st] = Array.from({ length: MAXL }, (_, i) => { const v = a[0] + step * Math.min(i, 9) + step / 2 * Math.max(0, i - 9); return dec ? Math.round(v * 100) / 100 : Math.round(v); });
}
Object.assign(STATS, TECH_STATS);
Object.assign(STAT_LBL_SPELL, {
  dissect: { dmg: 'Slash damage' }, sanctum: { dur: 'Dome time (seconds)', radius: 'Dome radius' }, doubletake: { stun: 'Daze (seconds)' },
  rush: { dmg: 'Damage per punch' }, polarity: { dmg: 'Repel damage', pull: 'Draw strength' }, zodiac: { hp: 'Beast health', dmg: 'Beast damage' },
  titan: { hp: 'Shell durability' }, chosen: { haste: 'Cast speed bonus (%)' }, earthm: { dur: 'Mud time (seconds)', radius: 'Mud radius', wall: 'Mud Wall health' }, counter: { dmg: 'Counter damage', dur: 'Stance time (seconds)' }, secondwind: { heal: 'Healing per second', dur: 'Lasts (seconds)' }, healspring: { heal: 'Healing per second', dur: 'Spring time (seconds)', radius: 'Spring radius' }, copycast: { stun: 'Daze on copy (seconds)' },
  bloodoath: { dmg: 'Damage per slash', regen: 'Health regained per second' }, bloodcraft: { dmg: 'Disc damage' },
});

Object.assign(UPG, {
  dissect:    [{ id: 'triple', n: 'Triple Cut', d: 'Throw 3 slashes in a fan, each at 65% damage.' }, { id: 'ceaseless', n: 'Ceaseless Cut', d: 'Keep slashing for 1.6 seconds: a storm of cuts at 35% each.', req: 'triple' }, { id: 'vivisect', n: 'Vivisection', d: 'Every other loop, 4 cuts rebound around you for 1.6s, slicing all nearby.', req: 'ceaseless' }, { id: 'vivi2', n: 'Flaying Spiral', d: 'Vivisection throws 8 rebounding cuts instead of 4.', req: 'vivisect' }, { id: 'keen', n: 'Keen Edge', d: 'Slashes do 3 times damage to ice walls, pillars and mud walls, and 50% more to summons.' },
               { id: 'cutter', n: 'Spell Cutter', d: 'Slashes have a 50% chance to cut an enemy spell in two mid-flight.' }, { id: 'sting', n: 'Stinging Wounds', d: 'Hits make the enemy bleed 0.5 a second for 3s. Stacks up to 3 times.' }, { id: 'cleave', n: 'Grand Bisection', d: 'Every fifth cast counts down 3, 2, 1 into one huge chop for 3.5x damage.', sig: 1 }, { id: 'swift', n: 'Swift Bisection', d: 'Grand Bisection comes every third cast instead of every fifth.', req: 'cleave' }, { id: 'fated', n: 'Inevitable Cut', d: 'Grand Bisection cannot be dodged or phased through. It always lands.', req: 'cleave', rare: 1 }, { id: 'narrow', n: 'Honed Edge', d: 'Grand Bisection becomes a thin cut: 50% more damage, but it can miss.', req: 'cleave' }, { id: 'rend', n: 'Rending Cut', d: 'Cuts pass through 2 targets instead of stopping, losing half damage each.' }, { id: 'broad', n: 'Broad Slash', d: 'Slashes are 30% wider and hit everything across that width.' }],
  sanctum:    [{ id: 'bulwark', n: 'Bulwark', d: 'The dome has 50% more health: 150 instead of 100.' }, { id: 'unmake', n: 'Unmaking', d: 'Enemy walls, pillars, totems and turrets inside the dome lose 15% of their full health every second.' }, { id: 'surehit', n: 'Sure Hit', d: 'While the dome stands, your shots home in on enemies inside it, and other damaging casts land on every enemy inside it.' }, { id: 'rite', n: 'Unbroken Rite', d: 'Sanctum no longer has to rest every other loop.' }, { id: 'vast', n: 'Vast Sanctum', d: 'The dome is 44% bigger and the boosted blast 50% bigger.' }, { id: 'linger', n: 'Lingering Sanctum', d: 'The dome lasts twice as long.' }, { id: 'oneway', n: 'One-Way Walls', d: 'Enemies can walk into the dome but cannot walk back out.' }],
  doubletake: [{ id: 'behind', n: 'Behind You', d: 'Instead of swapping, appear right behind the enemy.', grp: 'swap' }, { id: 'quickdraw', n: 'Quick Draw', d: 'Fires early to dodge a hit. The next Double Take cast only refills it.' }, { id: 'clap', n: 'Shock to the Senses', d: 'The clap hurts the enemy for 3 damage.' }, { id: 'dizzy', n: 'Disoriented', d: 'After a swap the enemy aims in random directions for 3 seconds.' }, { id: 'abrupt', n: 'Abrupt Swap', d: 'The enemy you swap with is stunned for 1 second.' }],
  rush:       [{ id: 'flow', n: 'Flow State', d: 'Critical hits are more likely: 27% instead of 15%.' }, { id: 'cornered', n: 'Cornered', d: 'Below 30% health, your Rushdown punches do double damage.' }, { id: 'relentless', n: 'Relentless', d: 'Each punch in a combo lands 30% sooner than the last.' },
               { id: 'finisher', n: 'Finisher', d: 'The last blow hits twice as hard and launches the caster away.' },
               { id: 'chain', n: 'Chain Rush', d: 'If the target dies mid-combo, the rest of the punches go to the next enemy.' }, { id: 'flurry', n: 'Flurry of Blows', d: 'After the combo, keep jabbing for 1 second at 30% damage.' },
               { id: 'infused', n: 'Infused Strikes', d: 'Every other combo hits 50% harder and burns for 2 a second for 5s.' },
               { id: 'endless', n: 'Endless String', d: '+2 punches in every combo.', rare: 1 },
               { id: 'pain', n: 'Ignore the Pain', d: 'While rushing, stuns, knockback and slows cannot stop you.' }, { id: 'momentum', n: 'Momentum', d: 'Every punch that lands adds 2% punch damage. Resets each round.' }],
  polarity:   [{ id: 'cornered', n: 'Cornered Force', d: 'Below half health, Draw and Repel hit harder: +2% damage for every 1% of health missing under 50%.', sig: 1 }, { id: 'collapse', n: 'Collapse', d: 'Every fifth cast fuses both forces into a singularity that pierces everything.', sig: 1 }, { id: 'rapid', n: 'Rapid Collapse', d: 'Collapse comes every third cast instead of every fifth.', req: 'collapse' }, { id: 'amped', n: 'Amped Output', d: 'Collapse is 30% larger: it reaches further and looks it.', req: 'collapse' }, { id: 'unbound', n: 'Unrestrained Collapse', d: 'Halfway across, Collapse bursts into a huge blast that hurts everyone, you too.', req: 'collapse', rare: 1 }, { id: 'field', n: 'Strong Field', d: 'Draw and Repel are 40% stronger and reach farther.' },
               { id: 'late', n: 'Late Detonation', d: 'The Repel orb bounces off the arena edge, then explodes on contact.' }, { id: 'drag', n: 'Crescent Drag', d: 'Draw swings a caught enemy caster behind you, smashing what is in the way. Rests 2 loops.' }, { id: 'dragfast', n: 'Waxing Crescent', d: 'Crescent Drag rests 1 loop instead of 2.', req: 'drag' },
               { id: 'boundary', n: 'Boundary', d: 'When something would hit you, everything arriving for 1 second is stopped, then sent back at the enemy caster. Your next Polarity turn reloads it and still fires.' },
               { id: 'jolt', n: 'Stunning Force', d: 'Enemies caught by Draw or struck by Repel are stunned for 1 second.' },
               { id: 'fastorb', n: 'Swift Force', d: 'Polarity orbs fly 30% faster.' }, { id: 'bigorb', n: 'Wide Force', d: 'Polarity orbs are 30% bigger, so they catch and strike from farther.' }],
  zodiac:     [{ id: 'warren', n: 'Warren', d: 'The Rabbit comes as a litter of 7 instead of 4.' }, { id: 'snakepit', n: 'Snake Pit', d: 'The Snake comes as three snakes.' }, { id: 'vanguard', n: 'Vanguard', d: 'Your first summon each round is the Juggernaut.' }, { id: 'domebreak', n: 'Dome Breaker', d: 'While your Juggernaut is on the field, summoning from inside an enemy Sanctum shatters it.' }, { id: 'guard', n: 'Bodyguard', d: 'The Juggernaut stays at your side and strikes whatever comes close, instead of marching off. It leaps in front of a Collapse or a tier 3 technique aimed at you and takes it instead (once every 4 seconds).' }, { id: 'laststand', n: 'Take the Blow', d: 'Once a round the Juggernaut leaps in front of a killing blow. It dies, you live, and both casters are thrown apart.', req: 'guard' }, { id: 'cycle', n: 'Full Cycle', d: 'No repeats until all twelve beasts have been summoned.' }, { id: 'tempo', n: 'Rising Tempo', d: 'First summon is 40% slower, then each is 12% faster (down to half).' }, { id: 'pack', n: 'Pack Call', d: 'Rats come as a pack of 6 instead of 3, and the Rooster comes in a pair.' },
               { id: 'mend', n: 'Mend the Pack', d: 'Each Zodiac cast heals your living beasts by 50%.' }, { id: 'mend2', n: 'Full Mend', d: 'Each Zodiac cast heals your living beasts fully.', req: 'mend' }],
  titan:      [{ id: 'fortified', n: 'Fortified', d: 'The shell is 80% more durable.' }, { id: 'walking', n: 'Walking Titan', d: 'Move slowly while inside the shell instead of being rooted.', req: 'fortified' }, { id: 'mend', n: 'Deep Mend', d: 'Recasting repairs the shell fully instead of by half.' }, { id: 'arrow', n: 'Spirit Arrow', d: 'The shell fires an arrow at the enemy caster every 2 seconds for 7 damage. The arrow does not grow with level.' }],
  counter:    [{ id: 'riposte', n: 'Riposte', d: 'The counter hits twice as hard and stuns longer.' }, { id: 'deflect', n: 'Open Palm', d: 'The stance also cancels one spell or projectile hit.' }, { id: 'patient', n: 'Patient Guard', d: 'The stance lasts 1.5 seconds longer.' },
               { id: 'redirect', n: 'Redirect', d: 'The stance catches the first enemy spell and sends it back at them.' }, { id: 'store', n: 'Held Stance', d: 'The stance waits until it is used. Recast with one held: Braced, -40% damage 3s.' }],
  secondwind: [{ id: 'surge', n: 'Deep Breath', d: 'Heals 50% more per second.' }, { id: 'torrent', n: 'Overflowing', d: 'Heals twice the base amount per second.', req: 'surge' }, { id: 'steel', n: 'Unbroken', d: 'Healing no longer pauses when you are hit.' },
               { id: 'recall', n: 'Recollection', d: 'On cast, heal 12.5% of the damage you took since the last cast.' }, { id: 'recall2', n: 'Deep Recollection', d: 'Recollection heals 25% instead.', req: 'recall' },
               { id: 'recall3', n: 'Total Recollection', d: 'Recollection heals 50% instead.', req: 'recall2' }, { id: 'final', n: 'Final Attempt', d: 'Once a round, a killing blow leaves you at 20% HP with +10% damage.' }],
  earthm:     [{ id: 'pillars', n: 'Stone Pillars', d: '10 stone pillars rise at random spots in the mud. They block shots.' }, { id: 'mudwall', n: 'Mud Wall', d: 'A mud wall in three breakable sections rises at the edge of the mud.' },
               { id: 'quag', n: 'Quagmire', d: 'Deeper mud: enemies in it are 65% slower and take 2 damage a second.' },
               { id: 'fortify', n: 'Fortified Mud Wall', d: 'The mud wall is one solid structure with 60% more health.', req: 'mudwall' }],
  chosen:     [{ id: 'unbound', n: 'Unbound Flow', d: 'Your next ability starts casting right away, even while the last one is still going (a beam firing, a combo, a barrage).' }, { id: 'awaken', n: 'Awakening', d: 'The cast speed bonus doubles.' }, { id: 'fate', n: 'Not Yet', d: "Survive one killing blow a round. You can't fall until your next hit: a crit." }],
  copycast:   [{ id: 'perfect', n: 'Perfect Copy', d: 'Your copies are cast 2 levels higher than the original.' }, { id: 'twice', n: 'Second Sight', d: 'Stays armed for 2 copies.' }],
  bloodoath:  [{ id: 'fleet', n: 'Fleet Foot', d: 'You move 30% faster.' }, { id: 'more', n: 'Four Cuts', d: '+2 slashes in every string.' }, { id: 'linger', n: 'Unbroken Edge', d: 'After the string, keep slashing for 1 second at 35% damage.' },
               { id: 'flying', n: 'Flying Cuts', d: 'Every slash also throws a cut that flies on to the next enemy for 60% damage.' }, { id: 'free', n: 'Unbound', d: 'Enemy Sanctums cannot trap or slow you, and their sure hits miss you.' },
               { id: 'blitz', n: 'Blitz', d: 'Ricochet around the arena in a blur, then strike from a random side.', sig: 1 }, { id: 'backstab', n: 'Backstab', d: 'A Blitz strike that lands behind the target is a critical: triple damage.', req: 'blitz' }],
  bloodcraft: [{ id: 'absorb', n: 'Bloodthirst', d: 'Each loop you draw in all blood on the field. Blood that is not your own adds 2% damage per pool for the next loop, up to 50%.' }, { id: 'twin', n: 'Twin Discs', d: 'Throw 2 discs in a V, each at 65% damage.' }, { id: 'lance', n: 'Blood Lance', d: 'Every other cast is a lance that pierces every enemy and wall in its line.' },
               { id: 'surge', n: 'Red Surge', d: 'For 4s after casting, your hits do double damage. Each has a 33% chance to lash back at you.' }, { id: 'venom', n: 'Tainted Blood', d: 'Blood hits poison the enemy caster: 2 damage a second for 3 seconds.' }, { id: 'bend', n: 'Living Blood', d: 'The Blood Lance bends in flight to follow the enemy.', req: 'lance' },
               { id: 'burst', n: 'Bloodburst', d: 'Every third cast lobs a blob that bursts, hurting everyone near it but you. Allies and walls too.', sig: 1 }],
});

// Spell Cannon: Desperate Output (beam grows with missing health, charges 2s longer)
UPG.beam.push({ id: 'desperate', n: 'Desperate Output', d: '+0.5% beam damage per missing HP. Charges 2s longer, fires 50% longer.' });
Object.assign(TYPE_OF, { dissect: 'proj', sanctum: 'support', doubletake: 'support', rush: 'melee', earthm: 'area', chosen: 'support', polarity: 'area', zodiac: 'summon', titan: 'support', copycast: 'support', counter: 'support', secondwind: 'support', healspring: 'support', bloodoath: 'melee', bloodcraft: 'proj' });
Object.assign(THREAT, { rush: 2, zodiac: 2, dissect: 1.5, bloodoath: 1.8, bloodcraft: 1.5 });

/* Starting deck: 2 wizard spells + 2 sorcerer techniques. Raise Dead becomes an unlock. */
STARTERS.length = 0; STARTERS.push('fireball', 'icewall', 'dissect', 'doubletake');
// unlock path for rivals and the Rank Road list: alternate spell, technique
EXTRA_UNLOCKS.push({ k: 'earthm', t: 350 }, { k: 'chosen', t: 450 }, { k: 'zombies', t: 50 }, { k: 'rush', t: 100 }, { k: 'sanctum', t: 300 }, { k: 'polarity', t: 500 }, { k: 'zodiac', t: 650 }, { k: 'titan', t: 800 }, { k: 'copycast', t: 1000 }, { k: 'healspring', t: 200 }, { k: 'counter', t: 150 }, { k: 'secondwind', t: 400 }, { k: 'bloodoath', t: 1050 }, { k: 'bloodcraft', t: 1250 });

/* Zodiac beasts: hp/dmg are multipliers on the technique stats; spd x zombie speed. */
const ZODIAC = [
  { path: 'zig', id: 'rat',     n: 'Rat',     e: '🐀', hp: .45, dmg: .3 /* (1.0.33.25) half, now a pack of 3 */,  spd: 2.0,  sz: .55, acd: .3,  q: 'A quick pack of three' },
  { path: 'charge', id: 'ox',      n: 'Ox',      e: '🐂', hp: 2.0, dmg: 1.4, spd: .7,   sz: 1.25, acd: .8, q: 'Charges, knocking the enemy back' },
  { path: 'pounce', id: 'tiger',   n: 'Tiger',   e: '🐅', hp: 1.2, dmg: 1.7, spd: 1.5,  sz: 1.05, acd: .5, q: 'Fierce claws' },
  { path: 'zig', id: 'rabbit',  n: 'Rabbit',  e: '🐇', hp: .5,  dmg: .6,  spd: 2.2,  sz: .6,  acd: .35, q: 'Lightning fast' },
  { path: 'spiral', id: 'dragon',  n: 'Dragon',  e: '🐉', hp: 2.24 /* (1.0.33.25) +40% */, dmg: 1.2, spd: .9,   sz: 1.3, acd: .7,  q: 'Hunts summons first, sweeping out in a spiral. Breathes fire', fire: 1 },
  { path: 'weave', id: 'snake',   n: 'Snake',   e: '🐍', hp: 1.5, dmg: 1.0, spd: 1.0,  sz: 1.5,  acd: .5,  q: 'Venom slows', slow: 1 },
  { path: 'line', id: 'horse',   n: 'Horse',   e: '🐎', hp: 1.1, dmg: 1.0, spd: 2.0,  sz: 1.1, acd: .55, q: 'Gallops in fast' },
  { path: 'zig', id: 'goat',    n: 'Goat',    e: '🐐', hp: 1.3, dmg: 1.0, spd: 1.1,  sz: .9,  acd: .6,  q: 'Headbutts knock back', ram: 1 },
  { path: 'circle', id: 'monkey',  n: 'Monkey',  e: '🐒', hp: .8,  dmg: .8,  spd: 1.6,  sz: .8,  acd: .4,  q: 'Steals cast time', steal: 1 },
  { path: 'weave', id: 'rooster', n: 'Rooster', e: '🐓', hp: .55, dmg: .6,  spd: 1.5,  sz: .65, acd: .5,  q: 'Its crow dazes', stun: 1 },
  { path: 'flank', id: 'dog',     n: 'Dog',     e: '🐕', hp: 1.0, dmg: 1.0, spd: 1.6,  sz: .85, acd: .45, q: 'Loyal and quick' },
  { path: 'line', id: 'pig',     n: 'Pig',     e: '🐖', hp: 2.4, dmg: .7,  spd: .8,   sz: 1.1, acd: .6,  q: 'Tanky and stubborn' },
];

/* Crimson Zodiac (Ladder variant): five fused beasts, each drawn as one of its halves, and the Regent. */
const CRIMSON_BEASTS = [
  { crim: 1, path: 'charge', id: 'ox', n: 'Stormhorn', e: '🐂', hp: 1.36, dmg: 1.05, spd: 1.5, sz: 1.3, acd: .7, ram: 1, q: 'Ox and Horse: a charge at a gallop that knocks back' },
  { crim: 1, path: 'pounce', id: 'tiger', n: 'Emberfang', e: '🐅', hp: 1.12, dmg: 1.33, spd: 1.5, sz: 1.15, acd: .5, fire: 1, q: 'Tiger and Dragon: claws that set alight' },
  { crim: 1, path: 'zig', id: 'snake', n: 'Quickvenom', e: '🐍', hp: 0.87, dmg: 0.7, spd: 2.1, sz: 1.2, acd: .4, slow: 1, q: 'Snake and Rabbit: very fast, and its bite slows' },
  { crim: 1, path: 'circle', id: 'monkey', n: 'Jeerwing', e: '🐒', hp: 0.68, dmg: 0.63, spd: 1.6, sz: .9, acd: .4, steal: 1, stun: 1, q: 'Monkey and Rooster: steals cast time and dazes' },
  { crim: 1, path: 'flank', id: 'pig', n: 'Ironhide', e: '🐖', hp: 1.98, dmg: 0.77, spd: 1.2, sz: 1.2, acd: .55, ram: 1, q: 'Pig, Goat and Dog: a tank that flanks and headbutts' },
];
const CRIMSON_REGENT = { crim: 1, regent: 1, path: 'circle', id: 'dragon', n: 'The Regent', e: '🐉', hp: 3.1, dmg: 1.12, spd: 1.25, sz: 1.7, acd: .7, fire: 1, q: 'Huge, quick, heals itself, and fires a Violet Bolt every 8 seconds' };
window.CRIMSON_BEASTS = CRIMSON_BEASTS; window.CRIMSON_REGENT = CRIMSON_REGENT;

/* Shop packs: unlock progress per school (100 = one token) plus skill points. Prices are placeholders for real IAP. */
const PACKS = [
  { id: 'tome',   n: 'Wizard Tome',     d: '+60 spell unlock progress · 40 skill points', wiz: 60, sorc: 0, pts: 40, price: '$1.99', c: ['#b9a6ff', '#4a2aa8'] },
  { id: 'scroll', n: 'Sorcerer Scroll', d: '+60 technique unlock progress · 40 technique points', wiz: 0, sorc: 60, pts: 40, price: '$1.99', c: ['#ff9a9a', '#9a1020'] },
  { id: 'grand',  n: 'Grand Bundle',    d: '+100 to both unlock bars · 120 points · 200 gems', wiz: 100, sorc: 100, pts: 120, gems: 200, price: '$7.99', c: ['#ffe08a', '#b8760e'], best: 1 },
];

/* Chosen One's upgrades are only offered to a side that trails by 2 or more rounds. */
function upGate(p, k, u) {
  if (typeof M === 'undefined' || !M) return true;
  // signature upgrades (Grand Bisection, Collapse, Blitz, Bloodburst) need the ability at tier 2: one other upgrade first
  if (u && u.sig && ![...p.up].some(x => x.startsWith(k + '.'))) return false;
  // Rushdown: only one targeting upgrade at a time
  if (k === 'rush' && u && u.tgt && UPG.rush.some(o => o.tgt && o.id !== u.id && p.up.has('rush.' + o.id))) return false;
  // Chosen One: upgrades open up once this side has lost 2 rounds in a row this match
  if (k === 'chosen') return !!(M.chosenOpen && M.chosenOpen[p === M.me ? 'me' : 'foe']);
  return true;
}

/* Ice Wall: Permafrost stops the wall thawing */
UPG.icewall.push({ id: 'permafrost', n: 'Permafrost', d: 'Your ice walls no longer thaw over time.' });

/* The rare thirteenth summon: slow, huge, and every hit launches its target. */
const JUGGERNAUT = { id: 'jugg', n: 'Juggernaut', e: '☸', hp: 8.05 /* (1.0.33.22) +15% */, dmg: 1, spd: .42, sz: 1.55, acd: 1.5, q: 'Marches in, faster the longer it lives. Every hit deals 20 and launches you. Regenerates. Once it falls it cannot return for 3 casts', boss: 1, path: 'line' };

/* Aura colours a sorcerer can pick: [light, main]. They tint the idle aura, the Titan Shell and its Spirit Arrow. */
const AURAS = [{ id: 'crimson', n: 'Crimson Aura', c: ['#ffd6d2', '#ff3b4a'] }, { id: 'azure', n: 'Azure Aura', c: ['#d6ecff', '#3b9bff'] }, { id: 'jade', n: 'Jade Aura', c: ['#d6ffe6', '#22c97a'] }, { id: 'violet', n: 'Violet Aura', c: ['#ecd6ff', '#9a4dff'] },
  { id: 'gold', n: 'Golden Aura', c: ['#fff3c8', '#ffb020'] }, { id: 'rose', n: 'Rose Aura', c: ['#ffe0f0', '#ff5aa8'] }, { id: 'frost', n: 'Frost Aura', c: ['#ffffff', '#9fe6ff'] }, { id: 'shadow', n: 'Shadow Aura', c: ['#c9b8ff', '#4a3a9a'] },
  { id: 'venom', n: 'Venom Aura', r: 'rare', c: ['#eaffb0', '#7ed321'], unlock: { type: 'coins', v: 250 } }, { id: 'deepsea', n: 'Deep Sea Aura', r: 'rare', c: ['#c8fff6', '#12b5a6'], unlock: { type: 'coins', v: 250 } },
  { id: 'sunset', n: 'Sunset Aura', r: 'epic', c: ['#ffe0b0', '#ff6a3a'], unlock: { type: 'coins', v: 325 } }, { id: 'voidaura', n: 'Void Aura', r: 'epic', c: ['#b9a0ff', '#2a0f5a'], unlock: { type: 'coins', v: 400 } },
  { id: 'emberaura', n: 'Ember Aura', r: 'rare', c: ['#fff0c0', '#ff8a1f'], unlock: { type: 'title', v: 'rank2' } }, { id: 'bloodmoon', n: 'Blood Moon Aura', r: 'epic', c: ['#ffc0c0', '#a8101f'], unlock: { type: 'title', v: 'cutter' } },
  { id: 'prism', n: 'Prism Aura', r: 'legendary', c: ['#ffffff', '#ff8ae0'], unlock: { type: 'title', v: 'g1' } }];
function auraOf(w) { const id = w && w.me && typeof PR !== 'undefined' && PR.look ? PR.look.aura : (w && w.auraId); const a = AURAS.find(q => q.id === id); return a ? a.c : (w && w.me ? AURAS[0].c : ['#e6f0ff', '#7aa6ff']); }

/* Fly Swarm: Gathering Swarm speeds up each cast after the first */
UPG.flies.push({ id: 'gather', n: 'Gathering Swarm', d: 'Each Fly Swarm cast this round makes your next one 10% faster.' });
