/* The version shown at the bottom of Options. Bump the last number with every update pushed live (1.0 -> 1.0.1 -> 1.0.2);
   bump the middle number for a big content drop. */
const GAME_VERSION = '1.0.19';
/* =====================================================================
   SPELLBINDER: GAME DATA
   Pure data, no rendering. Port these tables straight into the real build.
   ===================================================================== */

/* ---------- Element colors: [light, mid, dark] ---------- */
const COL = {
  fire:   ['#ffb347', '#ff5a1f', '#7a1600'],
  ice:    ['#d8f6ff', '#5cc8ff', '#123e7a'],
  death:  ['#d8ff9a', '#62c23a', '#173d10'],
  storm:  ['#fff7b0', '#ffd23a', '#7a5a00'],
  spirit: ['#e0fffb', '#5fe0d0', '#0d4a44'],
  swamp:  ['#eef7a0', '#9ab832', '#2a3a08'],
  arcane: ['#f0d2ff', '#b06bff', '#3a1478'],
  void:   ['#d9c8ff', '#6a3fd6', '#160a3a'],
  beam:   ['#ffffff', '#4fe3ff', '#0a3a6a'],
  aegis:  ['#e8fffb', '#38e0c0', '#0a4a40'],
  earth:  ['#efe0b8', '#a8824a', '#3a2a14'],
  time:   ['#fff3c0', '#e0b040', '#5a3a10'],
  nature: ['#d8f5a0', '#4caf3a', '#163d10'],
};

/* ---------- Spells ----------
   t = cast time (s), range = preferred distance the wizard keeps while this spell is next. */
const SP = {
  fireball:  { n: 'Fireball',        el: 'fire',   t: 1.5, range: 160, d: 'Hurls a blazing fireball that sets the target alight.' , tag: 'Burns' },
  icewall:   { n: 'Ice Wall',        el: 'ice',    t: 1.1, range: 130, d: 'Raises a wall of ice between you and the enemy.' , tag: 'Blocks' },
  zombies:   { n: 'Raise Dead',      el: 'death',  t: 2.4, range: 190, d: 'Three zombies burst out of the ground halfway to the enemy and hunt them down.' , tag: 'Summons' },
  lightning: { n: 'Lightning Bolt',  el: 'storm',  t: 1.7, range: 170, d: 'Zaps the closest enemy creature, or the wizard, and stuns it.' , tag: 'Stuns' },
  meteor:    { n: 'Meteor',          el: 'fire',   t: 4.0, range: 230, d: 'A huge meteor lands where the enemy stands. Dodgeable.' , tag: 'Big hit' },
  flies:     { n: 'Fly Swarm',       el: 'swamp',  t: 2.0, range: 180, d: 'A buzzing swarm streams out and chews on the enemy. Takes half damage, but fire burns it at once.' , tag: 'Swarms' },
  ghost:     { n: 'Ghost Form',      el: 'spirit', t: 0.8, range: 150, d: 'Turn see-through for a moment. Attacks pass right through you. Once per loop.' , tag: 'Phases' },
  mirror:    { n: 'Mirror Image',    el: 'arcane', t: 1.2, range: 150, d: 'Conjures a decoy that fools the enemy 2 times in 3. Each new decoy in a round has half the health of the last.' , tag: 'Decoys' },
  orbs:      { n: 'Arcane Orbs',     el: 'arcane', t: 1.6, range: 120, d: 'Three orbs circle you and pop on enemy fireballs, zombies and flies.', tag: 'Guards' },
  bubbles:   { n: 'Acid Bubbles',    el: 'swamp',  t: 2.0, range: 170, d: 'Wobbling bubbles drift at the enemy and pop into acid puddles.', tag: 'Puddles' },
  ricochet:  { n: 'Ricochet Rune',   el: 'arcane', t: 1.4, range: 160, d: 'A rune bolt that bounces off the arena walls, hitting everything it passes.', tag: 'Bounces' },
  archer:    { n: 'Spirit Archer',   el: 'spirit', t: 2.6, range: 190, d: 'Summons a ghost archer that shoots the nearest enemy until destroyed.', tag: 'Turret' },
  beam:      { n: 'Spell Cannon',    el: 'beam',   t: 3.0, range: 210, d: 'Charges up, then fires a sustained beam that burns through anything in its path. Only one per spellbook.', tag: 'Beam' },
  shield:    { n: 'Spell Shield',    el: 'aegis',  t: 1.4, range: 150, d: 'A barrier soaks up incoming spells, holds them, then fires them back. Meteors smash through. Once per loop.', tag: 'Absorbs' },
  golem:     { n: 'Stone Golem',     el: 'earth',  t: 2.8, range: 170, d: 'A slow stone golem walks at the enemy, blocking their spells, and stomps when it arrives.', tag: 'Tank' },
  hourglass: { n: 'Hourglass',       el: 'time',   t: 1.2, range: 140, d: 'A time bubble around you slows enemy spells and creatures inside it, and enemy casters there charge 25% slower. Once per loop.', tag: 'Slows' },
  ringfire:  { n: 'Ring of Fire',    el: 'fire',   t: 3.0, range: 130, d: 'A ring of flame bursts out from you, scorching and shoving back everything it passes.', tag: 'Shoves' },
  burnbody:  { n: 'Burning Body',    el: 'fire',   t: 1.6, range: 90,  d: 'Your body erupts in flame. Anything that touches you burns, and so do you, a little.', tag: 'Aura' },
  thorns:    { n: 'Thornfield',      el: 'nature', t: 1.8, range: 170, d: 'Seeds sprout into thorny vine patches that root whatever walks in.', tag: 'Roots' },
  storm:     { n: 'Storm Cloud',     el: 'storm',  t: 2.2, range: 190, d: 'A thundercloud follows the enemy and strikes where its shadow falls.', tag: 'Hunts' },
  rift:      { n: 'Rift Portals',    el: 'void',   t: 1.6, range: 170, d: 'Two portals: your spells enter one and come out beside the enemy.', tag: 'Flanks' },
  totem:     { n: 'Grounding Totem', el: 'earth',  t: 1.2, range: 150, d: 'A copper rod that pulls enemy lightning, storm strikes, ricochet runes and orb shots into itself.', tag: 'Grounds' },
  blink:     { n: 'Blink',           el: 'arcane', t: 0.8, range: 160, d: 'Teleport away from the biggest threat, leaving an afterimage behind.', tag: 'Escapes' },
  sinkhole:  { n: 'Sinkhole',        el: 'earth',  t: 2.0, range: 180, d: 'A pit opens under the enemy, swallowing creatures and dragging the wizard down.', tag: 'Swallows' },
  gale:      { n: 'Gale',            el: 'aegis',  t: 1.4, range: 150, d: 'One big shove of wind: knocks enemy spells off course and shoves everything back.', tag: 'Deflects' },
  gravity:   { n: 'Gravity Well',    el: 'void',   t: 2.2, range: 200, d: 'A drifting vortex that hunts the enemy and drags them and their creatures in for 3 seconds.' , tag: 'Pulls' },
};
const STARTERS = ['fireball', 'icewall', 'zombies'];

/* ---------- Per-level stats (index 0 = level 1) ---------- */
const MAXL = 20;
const STATS = {
  fireball:  { dmg: [12, 14, 16, 19, 22], burn: [3, 3, 4, 4, 5] },
  icewall:   { hp: [24, 28, 33, 39, 46], dur: [8, 8, 9, 9, 10] },
  zombies:   { hp: [32, 36, 42, 48, 56], dmg: [3, 3.5, 4, 4.5, 5.25] },
  lightning: { dmg: [7, 8, 9, 11, 13], stun: [0.6, 0.6, 0.7, 0.8, 0.9] },
  meteor:    { dmg: [28, 32, 35, 40, 46], radius: [52, 55, 58, 62, 66] },
  flies:     { dps: [4, 5, 5, 6, 7], hp: [10, 12, 14, 16, 18] },
  ghost:     { dur: [1, 1.1, 1.2, 1.35, 1.5] },
  mirror:    { hp: [16, 19, 22, 26, 30] },
  orbs:      { dmg: [8, 9, 10, 12, 14], dur: [7, 7, 8, 8, 9] },
  bubbles:   { dps: [5, 5, 6, 7, 8], radius: [34, 36, 38, 40, 44] },
  ricochet:  { dmg: [8, 9, 10, 12, 14], bounces: [3, 3, 4, 4, 5] },
  archer:    { dmg: [4, 4, 5, 6, 7], hp: [20, 23, 26, 30, 35] },
  beam:      { dps: [17, 18, 20, 22, 24], dur: [1.6, 1.6, 1.7, 1.7, 1.8] },
  shield:    { cap: [2, 2, 2, 3, 3], power: [100, 105, 110, 115, 120] },
  golem:     { hp: [40, 45, 50, 58, 66], dmg: [8, 9, 10, 12, 14] },
  hourglass: { dur: [3, 3.2, 3.4, 3.7, 4], radius: [70, 72, 74, 78, 82] },
  ringfire:  { dmg: [6, 7, 8, 9, 10], radius: [165, 170, 176, 184, 195] },
  burnbody:  { dps: [10, 11, 12, 14, 16], dur: [4.5, 4.5, 5, 5, 5.5] },
  thorns:    { dps: [4, 4, 5, 6, 7], root: [1, 1, 1.1, 1.2, 1.3] },
  storm:     { dmg: [8, 9, 10, 11, 13], dur: [6, 6, 6.5, 6.5, 7] },
  rift:      { dur: [4, 4, 4.5, 4.5, 5] },
  totem:     { hp: [20, 22, 25, 28, 32], dur: [8, 8, 9, 9, 10] },
  blink:     { dist: [110, 115, 120, 130, 140] },
  sinkhole:  { dps: [5, 5, 6, 7, 8], radius: [40, 42, 44, 47, 50] },
  gale:      { push: [300, 310, 320, 340, 360], dur: [1.8, 1.9, 2.0, 2.1, 2.2] },
  gravity:   { pull: [120, 130, 140, 155, 170], radius: [70, 74, 78, 82, 86] },
};
/* Stretch the 5 hand-tuned levels to 20: the per-level step continues to level 10, then halves to level 20. */
/* (1.0.5) Levels were out-running health: damage roughly doubled by level 6 while a rank adds 25 HP. Each level now adds
   60% of what it used to, for damage and for the things damage is measured against (summon, wall and shell health, healing).
   Level 1 values are unchanged. One number to turn if fights feel too slow or too fast. */
const LEVEL_GROWTH = .6, LEVEL_SCALED = new Set(['dmg', 'dps', 'hp', 'wall', 'heal', 'regen']);
(function stretchStats() {
  for (const k in STATS) for (const st in STATS[k]) {
    const a = STATS[k][st], step = (a[4] - a[0]) / 4 * (LEVEL_SCALED.has(st) ? LEVEL_GROWTH : 1), dec = a.some(v => v % 1) ? 1 : 0;
    STATS[k][st] = Array.from({ length: MAXL }, (_, i) => { const v = a[0] + step * Math.min(i, 9) + step / 2 * Math.max(0, i - 9); return dec ? Math.round(v * 10) / 10 : Math.round(v); });
  }
})();
const STAT_LBL = { bounces: 'Bounces', dmg: 'Damage', burn: 'Burn per second', hp: 'Health', dur: 'Lasts (seconds)', radius: 'Radius', stun: 'Stun (seconds)', dps: 'Damage per second', pull: 'Pull strength' };
const STAT_LBL_SPELL = {
  zombies: { hp: 'Zombie health', dmg: 'Zombie damage per hit' },
  icewall: { hp: 'Wall health' },
  flies:   { hp: 'Swarm health' },
  mirror:  { hp: 'Decoy health' },
  ghost:   { dur: 'Ghost time (seconds)' },
  meteor:  { radius: 'Blast radius' },
  gravity: { radius: 'Vortex radius' },
  shield:  { cap: 'Spells absorbed', power: 'Return damage (%)' },
  totem:   { hp: 'Totem health', dur: 'Lasts (seconds)' }, blink: { dist: 'Blink distance' }, sinkhole: { dps: 'Damage per second', radius: 'Pit radius' }, gale: { push: 'Shove strength', dur: 'Long Gust time (seconds)' },
  golem:   { hp: 'Golem health', dmg: 'Stomp damage' },
  hourglass: { dur: 'Bubble time (seconds)', radius: 'Bubble radius' },
  ringfire: { dmg: 'Ring damage', radius: 'Ring reach' }, burnbody: { dps: 'Burn damage per second', dur: 'Lasts (seconds)' },
  thorns:  { dps: 'Thorn damage per second', root: 'Root time on wizards (seconds)' },
  storm:   { dmg: 'Strike damage', dur: 'Cloud lifetime (seconds)' },
  rift:    { dur: 'Portal time (seconds)' },
  beam:    { dps: 'Beam damage per second', dur: 'Beam time (seconds)' },
  orbs:    { dmg: 'Orb damage', dur: 'Orbit time (seconds)' },
  bubbles: { dps: 'Acid damage per second', radius: 'Puddle radius' },
  archer:  { dmg: 'Arrow damage', hp: 'Archer health' },
};
/* Leveling cost: skill points and coins needed to go from level i to i+1 */
/* Spell-point and coin cost to go from level L to L+1 (index = current level). */
const CARDS = Array.from({ length: MAXL }, (_, l) => l ? Math.round(3 + l * l * 0.9) : 0);
const COST  = Array.from({ length: MAXL }, (_, l) => l ? Math.round(50 * Math.pow(l, 1.7) / 10) * 10 : 0);

/* ---------- In-match upgrades (offered in the Scribe phase) ---------- */
const UPG = {
  fireball:  [{ id: 'twin', n: 'Twin Fireball', d: 'Every Fireball cast throws 2.' }, { id: 'triple', n: 'Triple Fireball', d: 'Every Fireball cast throws 3.', req: 'twin' }, { id: 'blast', n: 'Exploding Fireball', d: 'Fireballs explode, hitting everything nearby.' }, { id: 'seek', n: 'Seeker Flames', d: 'Fireballs curve to track their target.' }, { id: 'pierce', n: 'Piercing Flame', d: 'Fireballs burn through the first thing they hit.' }, { id: 'inferno', n: 'Inferno Bolt', d: 'Fireballs burn through up to 3 things.', req: 'pierce' }],
  icewall:   [{ id: 'thick', n: 'Thick Ice', d: 'Walls are two layers deep.' }, { id: 'spikes', n: 'Spiked Ice', d: 'Zombies clawing your wall, and wizards walking into it, get hurt.' }, { id: 'mirror', n: 'Mirror Ice', d: 'Fireballs bounce back at whoever threw them.' }, { id: 'frostbite', n: 'Frostbite', d: 'Enemies touching the wall are slowed.' }, { id: 'wide', n: 'Wide Wall', d: '7 ice pillars instead of 5.' }, { id: 'shrapnel', n: 'Shrapnel Ice', d: 'When the wall breaks, its chunks fly outward and hurt enemies.' }],
  zombies:   [{ id: 'circle', n: 'Grave Circle', d: 'The dead rise in a ring around the enemy wizard. With Death March as well, casts take turns between the two.', grp: 'spawn' }, { id: 'march', n: 'Death March', d: 'The dead rise in a line from you toward the enemy. With Grave Circle as well, casts take turns between the two.', grp: 'spawn' }, { id: 'bloat', n: 'Bloated Dead', d: 'Zombies burst when they die, splashing acid on everything nearby.' }, { id: 'grip', n: 'Grave Grip', d: 'A zombie that reaches the enemy wizard holds them in place briefly.' }, { id: 'horde', n: 'Horde', d: 'Raise 5 zombies instead of 3.' }, { id: 'legion', n: 'Legion', d: 'Raise 7 zombies.', req: 'horde' }, { id: 'clawed', n: 'Breakers', d: 'Zombies tear through anything in their way more than twice as fast: ice walls, mud walls, pillars, totems, turrets and Titan Shells.' }, { id: 'frenzy', n: 'Frenzy', d: 'Zombies move 30% faster.' }, { id: 'undying', n: 'Undying', d: 'Each zombie gets back up once after dying, headless and with half health.' }, { id: 'vessel', n: 'Second Body', d: 'Once a round, a killing blow moves you into one of your zombies at half health.' }],
  lightning: [{ id: 'fork', n: 'Chain Lightning', d: 'Each bolt jumps on to 2 more targets.' }, { id: 'twinbolt', n: 'Twin Bolts', d: 'Shoot 2 bolts per cast, each at 55% damage.' }, { id: 'tribolt', n: 'Triple Bolts', d: 'Shoot 3 bolts per cast, each at 38% damage.', req: 'twinbolt' }, { id: 'overcharge', n: 'Overcharge', d: 'Stuns last twice as long.' }, { id: 'thunder', n: 'Thunderclap', d: 'Also hits every enemy creature near the target.' }, { id: 'supercharge', n: 'Supercharge', d: '+1 jump, and double damage to creatures.' }],
  meteor:    [{ id: 'shower', n: 'Meteor Shower', d: 'Drops 3 meteors; the extra two hit for half damage.' }, { id: 'colossal', n: 'Colossal Meteor', d: 'Crater is much bigger.' }, { id: 'scorch', n: 'Scorched Earth', d: 'Craters burn for 5 seconds, hurting enemies inside.' }],
  flies:     [{ id: 'bigswarm', n: 'Two Swarms', d: 'Release 2 swarms per cast.' }, { id: 'chitin', n: 'Hardened Shells', d: 'Swarms take only 25% damage instead of 50%.' }, { id: 'plague', n: 'Plague Flies', d: 'Bitten enemies cast slower.' }, { id: 'hive', n: 'Hive', d: 'Swarms last twice as long.' }],
  ghost:     [{ id: 'linger', n: 'Lingering Spirit', d: 'Ghost Form lasts 25% longer.' }, { id: 'haunt', n: 'Haunt', d: 'While you are a ghost, the enemy casts slower.' }, { id: 'burst', n: 'Ectoplasm Burst', d: 'Explodes when it ends, hurting nearby enemies.' }, { id: 'step', n: 'Phase Step', d: 'Dash away from the enemy when Ghost Form starts.' }],
  mirror:    [{ id: 'twin', n: 'Two Mirrors', d: 'Conjure 2 decoys.' }, { id: 'shatter', n: 'Shatter', d: 'Decoys explode into shards when they pop.' }, { id: 'sturdy', n: 'Silvered Glass', d: 'Decoys have double health.' }, { id: 'mcast', n: 'Mirror Cast', d: 'Decoys repeat your spells at 33% power, halved per extra decoy. Not Rushdown.' }],
  orbs:      [{ id: 'five', n: 'Five Orbs', d: 'Summon 5 orbs instead of 3.' }, { id: 'wide', n: 'Wide Orbit', d: 'Orbs circle much farther out.' }, { id: 'nova', n: 'Orb Nova', d: 'When the orbit ends, leftover orbs fly at the enemy.' }],
  bubbles:   [{ id: 'more', n: 'Bubble Stream', d: 'Blow 5 bubbles instead of 3.' }, { id: 'sticky', n: 'Sticky Acid', d: 'Puddles slow enemies inside.' }, { id: 'linger', n: 'Lingering Acid', d: 'Puddles last twice as long.' }],
  ricochet:  [{ id: 'twin', n: 'Twin Runes', d: 'Fire 2 bolts in a V.' }, { id: 'pierce', n: 'Phasing Rune', d: 'Passes through creatures instead of stopping.' }, { id: 'build', n: 'Momentum', d: 'Every bounce adds +3 damage.' }, { id: 'split', n: 'Splitting Rune', d: 'The rune splits in two on every bounce.' }, { id: 'seeker', n: 'Seeking Shards', d: 'Split runes home in on the enemy.', req: 'split' }],
  archer:    [{ id: 'volley', n: 'Volley', d: 'Shoots 3 arrows at once.' }, { id: 'fire', n: 'Fire Arrows', d: 'Arrows set targets on fire.' }, { id: 'twin', n: 'Twin Archers', d: 'Summon 2 archers.' }],
  beam:      [{ id: 'wide', n: 'Wide Beam', d: 'A much thicker beam that is easier to land.' }, { id: 'overload', n: 'Overload', d: 'Beam hits 25% harder and melts walls 65% faster.' }, { id: 'quick', n: 'Quick Charge', d: 'Charges in 2.4 seconds instead of 3, but the beam is 35% shorter.' }],
  shield:    [{ id: 'grand', n: 'Grand Bubble', d: 'The bubble is 60% bigger, so it catches far more.' }, { id: 'longhold', n: 'Long Hold', d: 'Holds absorbed spells 3 seconds instead of 1.5, so you choose a better moment.' }, { id: 'capacity', n: 'Deep Barrier', d: 'Absorbs 2 more spells.' }, { id: 'amplify', n: 'Amplify', d: 'Spells fired back hit 50% harder.' }],
  golem:     [{ id: 'iron', n: 'Iron Skin', d: 'Double health.' }, { id: 'quake', n: 'Quake Stomp', d: 'Stomps hit everything nearby and knock them back.' }, { id: 'toss', n: 'Rock Toss', d: 'Throws a boulder at the enemy every 2 seconds while walking.' }, { id: 'bloom', n: 'Shatter Bloom', d: 'Breaks into 3 pebble golems when destroyed.' }],
  hourglass: [{ id: 'stasis', n: 'Stasis', d: 'Enemy spells and creatures inside stop completely.' }, { id: 'rewind', n: 'Rewind', d: 'Heal back half the health you lost while the bubble was up.' }, { id: 'wide', n: 'Wide Glass', d: 'A much bigger bubble.' }, { id: 'hasten', n: 'Hasten', d: 'You cast faster while inside your bubble.' }],
  ringfire:  [{ id: 'wide', n: 'Inferno Ring', d: 'The ring reaches 40% farther.' }, { id: 'wall', n: 'Wall of Flame', d: 'The ring stops at its edge and keeps burning for 3 seconds.' }, { id: 'blast', n: 'Backdraft', d: 'A much stronger shove that briefly stuns.' }, { id: 'inner', n: 'Scorched Ground', d: 'Enemies standing inside the ring burn while it lasts.' }],
  burnbody:  [{ id: 'heat', n: 'Searing Aura', d: 'The flames reach 50% farther.' }, { id: 'ward', n: 'Heat Shield', d: 'You no longer burn yourself.' }, { id: 'trail', n: 'Firewalk', d: 'Leave burning footprints behind you.' }, { id: 'flare', n: 'Flare Up', d: 'When it ends, you explode in a burst of flame.' }],
  thorns:    [{ id: 'spread', n: 'Spreading Roots', d: 'Patches grow 50% bigger over time.' }, { id: 'lifesap', n: 'Lifesap', d: 'Heal 3 every time something is rooted.' }, { id: 'bramble', n: 'Bramble Wall', d: 'Vines also catch enemy spells flying over them.' }, { id: 'strangle', n: 'Strangle', d: 'Rooted creatures take double thorn damage.' }, { id: 'creep', n: 'Creeping Vines', d: 'Patches squirm across the arena toward the enemy wizard.' }],
  storm:     [{ id: 'thunder', n: 'Thunderhead', d: 'Bigger strikes that stun.' }, { id: 'hail', n: 'Hailstorm', d: 'The enemy is slowed while under the cloud.' }, { id: 'twin', n: 'Twin Clouds', d: 'Summon 2 clouds.' }, { id: 'static', n: 'Static Link', d: 'Each strike also jumps to a nearby enemy creature.' }],
  rift:      [{ id: 'long', n: 'Long Rift', d: 'Portals last twice as long.' }, { id: 'burn', n: 'Riftburn', d: 'Spells passing through deal 50% more damage.' }, { id: 'oneway', n: 'One-Way', d: 'Enemy spells cannot use your portals.' }, { id: 'collapse', n: 'Collapse', d: 'Portals implode when they close, pulling in and hurting enemies.' }],
  totem:     [{ id: 'coil', n: 'Copper Coil', d: 'Survives the first bolt and grounds 2 per cast.' }, { id: 'lure', n: 'Lure Rod', d: 'Enemy zombies, golems and flies are drawn to attack the totem.' }, { id: 'discharge', n: 'Discharge', d: 'Grounded lightning is fired back at the enemy.' }, { id: 'twin', n: 'Twin Totems', d: 'Plant 2 totems.' }],
  blink:     [{ id: 'blast', n: 'Afterimage Blast', d: 'Your afterimage explodes, hurting enemies nearby.' }, { id: 'double', n: 'Double Blink', d: 'Blinks again if a new threat appears within 3 seconds.' }, { id: 'ambush', n: 'Ambush', d: 'Blink behind the enemy instead of away.' }, { id: 'echo', n: 'Phase Echo', d: 'Your afterimage lasts twice as long and soaks up hits aimed at it.' }],
  sinkhole:  [{ id: 'quick', n: 'Quicksand', d: 'Bigger pit that lasts longer.' }, { id: 'swallow', n: 'Swallow', d: 'Golems and ice pillars sink too.' }, { id: 'cavein', n: 'Cave-In', d: 'Collapses with a big hit when it closes.' }, { id: 'twin', n: 'Twin Pits', d: 'Opens 2 pits.' }],
  gale:      [{ id: 'current', n: 'Swirling Current', d: 'A current around you flings incoming spells off in random directions.' }, { id: 'return', n: 'Return Wind', d: 'The current sends spells straight back toward the enemy (no tracking).', req: 'current' }, { id: 'sustain', n: 'Long Gust', d: 'After the shove, the wind keeps pushing for about 2 seconds.' }, { id: 'cutting', n: 'Cutting Winds', d: 'The shove cuts everything it hits (wizards, zombies, flies).' }, { id: 'tail', n: 'Tailwind', d: 'Your own spells fly faster through your gust.' }],
  gravity:   [{ id: 'horizon', n: 'Event Horizon', d: 'Vortex is much bigger.' }, { id: 'crush', n: 'Crush', d: 'Damages everything inside.' }, { id: 'singularity', n: 'Singularity', d: 'Ends with a blast that throws enemies outward.' }],
};

/* ---------- Ranks: each rank-up unlocks one spell ---------- */
const RANKS = [
  { n: 'Apprentice',  t: 0,    c: ['#c9bdf0', '#6f6496'], unlock: null,        r: {} },
  { n: 'Adept',       t: 150,  c: ['#a6e6ff', '#2f86c4'], unlock: 'lightning', r: { coins: 150 } },
  { n: 'Conjurer',    t: 350,  c: ['#a8fff0', '#1fa58f'], unlock: 'meteor',    r: { gems: 20 } },
  { n: 'Sorcerer',    t: 600,  c: ['#bff59a', '#3f9a25'], unlock: 'flies',     r: { coins: 300 } },
  { n: 'Warlock',     t: 900,  c: ['#ffb98a', '#c9361a'], unlock: 'ghost',     r: { gems: 40 } },
  { n: 'Archmage',    t: 1300, c: ['#e0c2ff', '#7a3fd6'], unlock: 'mirror',    r: { coins: 600 } },
  { n: 'Grand Magus', t: 1800, c: ['#fff0a8', '#d99a14'], unlock: 'gravity',   r: { gems: 100 } },
];
const MS_STEP = 50;
/* Extra spells unlock on Rank Road milestones (trophies) */
const EXTRA_UNLOCKS = [{ k: 'orbs', t: 250 }, { k: 'bubbles', t: 450 }, { k: 'ricochet', t: 750 }, { k: 'archer', t: 1100 }, { k: 'beam', t: 700 }, { k: 'shield', t: 600 }, { k: 'thorns', t: 400 }, { k: 'storm', t: 550 }, { k: 'golem', t: 650 }, { k: 'hourglass', t: 850 }, { k: 'rift', t: 950 }, { k: 'totem', t: 1200 }, { k: 'ringfire', t: 800 }, { k: 'burnbody', t: 1000 }, { k: 'blink', t: 1350 }, { k: 'sinkhole', t: 1500 }, { k: 'gale', t: 1650 }];
/* Spellbook size: copies count as slots. +1 slot at Sorcerer (rank 3) and Archmage (rank 5). */
const BOOK_BASE = 4, BOOK_SLOT_RANKS = [3, 5];
const GAME_NAME = ['WIZARDS', 'VS SORCERERS']; // working title shown on the logo; swap here
const ARENAS = ['bog', 'frost', 'bones', 'castle', 'critters', 'sea']; // Rank Road gives +5 skill points every 50 trophies between ranks

/* ---------- Cosmetics ----------
   unlock: {type:'free'} | {type:'rank', v:rankIndex} | {type:'level', v:playerLevel} | {type:'gems', v:price}
   r (rarity): common | rare | epic | legendary */
const COSMETICS = {
  robe: [
    { id: 'azure',    n: 'Azure Robe',     r: 'common',    c: ['#4b6bff', '#2a2fa8', '#151457'], trim: '#ffd45e', unlock: { type: 'free' } },
    { id: 'crimson',  n: 'Crimson Robe',   r: 'common',    c: ['#ff4a4a', '#a8172d', '#4d0816'], trim: '#2b2b2b', unlock: { type: 'free' } },
    { id: 'moss',     n: 'Moss Robe',      r: 'common',    c: ['#7ed35a', '#2f8a3c', '#0d3a14'], trim: '#e0c070', unlock: { type: 'free' } },
    { id: 'amethyst', n: 'Amethyst Robe',  r: 'rare',      c: ['#c792ff', '#7a3fd6', '#2a1060'], trim: '#ffd45e', unlock: { type: 'level', v: 8 } },
    { id: 'midnight', n: 'Midnight Robe',  r: 'rare',      c: ['#4a4f7a', '#24264a', '#0c0d20'], trim: '#a6e6ff', unlock: { type: 'rank', v: 2 } },
    { id: 'frost',    n: 'Frostweave',     r: 'epic',      c: ['#d8f6ff', '#5cb8e8', '#1a4e80'], trim: '#ffffff', unlock: { type: 'rank', v: 4 } },
    { id: 'sunfire',  n: 'Sunfire Robe',   r: 'epic',      c: ['#ffd27a', '#ff7a2a', '#7a2a00'], trim: '#fff3b0', unlock: { type: 'gems', v: 30 } },
    { id: 'royal',    n: 'Royal Vestment', r: 'legendary', c: ['#ffe9a0', '#d99a14', '#5a3a00'], trim: '#ff4a5a', unlock: { type: 'rank', v: 6 } },
    { id: 'emerald',  n: 'Emerald Robe',   r: 'rare',      c: ['#6ff0b0', '#12a56a', '#064a30'], trim: '#fff3b0', unlock: { type: 'coins', v: 250 } },
    { id: 'rosewood', n: 'Rosewood Robe',  r: 'rare',      c: ['#ff9ac2', '#c2386f', '#5a0f30'], trim: '#ffe9a0', unlock: { type: 'coins', v: 250 } },
    { id: 'tide',     n: 'Tidecaller Robe', r: 'epic',     c: ['#8af0ff', '#1f9ab8', '#0a3f55'], trim: '#ffffff', unlock: { type: 'coins', v: 400 } },
    { id: 'ember',    n: 'Emberweave',     r: 'rare',      c: ['#ffb07a', '#d9481c', '#5a1606'], trim: '#2b2b2b', unlock: { type: 'title', v: 'hedge' } },
    { id: 'stormcl',  n: 'Stormcloud Robe', r: 'epic',     c: ['#b8c4e0', '#5a6a94', '#1e2742'], trim: '#ffe45e', unlock: { type: 'title', v: 'streak' } },
    { id: 'obsidian', n: 'Obsidian Robe',  r: 'epic',      c: ['#5a5a66', '#26262e', '#08080c'], trim: '#ff4a5a', unlock: { type: 'title', v: 'flawless' } },
    { id: 'ivory',    n: 'Ivory Vestment', r: 'epic',      c: ['#ffffff', '#d8d2c4', '#7a7264'], trim: '#d99a14', unlock: { type: 'title', v: 'vet' } },
    { id: 'voidweave', n: 'Voidweave',     r: 'legendary', c: ['#b06bff', '#3a1470', '#0a0218'], trim: '#6fd3ff', unlock: { type: 'title', v: 'cent' } },
  ],
  hat: [
    { id: 'pointy',    n: 'Pointy Hat',    r: 'common',    unlock: { type: 'free' } },
    { id: 'witch',     n: 'Witch Hat',     r: 'common',    unlock: { type: 'free' } },
    { id: 'hood',      n: 'Hood',          r: 'rare',      unlock: { type: 'level', v: 9 } },
    { id: 'feathered', n: 'Feathered Hat', r: 'rare',      unlock: { type: 'rank', v: 3 } },
    { id: 'mushroom',  n: 'Toadstool',     r: 'epic',      unlock: { type: 'gems', v: 40 } },
    { id: 'crown',     n: 'Crown',         r: 'legendary', unlock: { type: 'rank', v: 5 } },
  ],
  staff: [
    { id: 'oak',     n: 'Oak Staff',     r: 'common',    unlock: { type: 'free' } },
    { id: 'crystal', n: 'Crystal Staff', r: 'rare',      unlock: { type: 'rank', v: 1 } },
    { id: 'wand',    n: 'Star Wand',     r: 'rare',      unlock: { type: 'gems', v: 20 } },
    { id: 'skull',   n: 'Bone Staff',    r: 'epic',      unlock: { type: 'rank', v: 3 } },
    { id: 'moon',    n: 'Moon Staff',    r: 'legendary', unlock: { type: 'level', v: 10 } },
  ],
  beard: [
    { id: 'white',  n: 'White Beard',  r: 'common', c: '#eef2ff', style: 'short', unlock: { type: 'free' } },
    { id: 'brown',  n: 'Brown Beard',  r: 'common', c: '#7a4a24', style: 'short', unlock: { type: 'free' } },
    { id: 'ginger', n: 'Ginger Beard', r: 'common', c: '#e07a2a', style: 'short', unlock: { type: 'free' } },
    { id: 'pink',   n: 'Pink Beard',   r: 'common', c: '#ff8ad0', style: 'short', unlock: { type: 'free' } },
    { id: 'none',   n: 'Clean Shaven', r: 'common', c: null,      style: 'none',  unlock: { type: 'free' } },
    { id: 'long',   n: 'Sage Beard',   r: 'epic',   c: '#f4f6ff', style: 'long',  unlock: { type: 'level', v: 8 } },
    { id: 'blue',   n: 'Blue Beard',   r: 'rare',   c: '#4f9bff', style: 'short', unlock: { type: 'coins', v: 150 } },
    { id: 'green',  n: 'Mossy Beard',  r: 'rare',   c: '#5fc76a', style: 'short', unlock: { type: 'coins', v: 150 } },
    { id: 'teal',   n: 'Teal Beard',   r: 'rare',   c: '#2fd0c0', style: 'short', unlock: { type: 'coins', v: 175 } },
    { id: 'violet', n: 'Violet Beard', r: 'rare',   c: '#a46bff', style: 'short', unlock: { type: 'title', v: 'g3' } },
    { id: 'red',    n: 'Scarlet Beard', r: 'rare',  c: '#e8303f', style: 'short', unlock: { type: 'title', v: 'brawler' } },
    { id: 'goldlong', n: 'Golden Sage Beard', r: 'legendary', c: '#ffd45e', style: 'long', unlock: { type: 'title', v: 'spellwright' } },
  ],
  skin: [
    { id: 'peach',  n: 'Peach',  r: 'common', c: '#f2c9a0', unlock: { type: 'free' } },
    { id: 'tan',    n: 'Tan',    r: 'common', c: '#d39a6a', unlock: { type: 'free' } },
    { id: 'umber',  n: 'Umber',  r: 'common', c: '#8a5a3a', unlock: { type: 'free' } },
    { id: 'goblin', n: 'Goblin', r: 'epic',   c: '#8fd46a', unlock: { type: 'gems', v: 25 } },
    { id: 'spirit', n: 'Spirit', r: 'epic',   c: '#9fe6ff', unlock: { type: 'rank', v: 4 } },
    { id: 'ashen',  n: 'Ashen',  r: 'rare',   c: '#b8b4c0', unlock: { type: 'coins', v: 200 } },
    { id: 'moonlit', n: 'Moonlit', r: 'rare', c: '#d6dcff', unlock: { type: 'coins', v: 225 } },
    { id: 'emberskin', n: 'Ember-touched', r: 'epic', c: '#e8735a', unlock: { type: 'title', v: 'special' } },
    { id: 'gilded', n: 'Gilded', r: 'legendary', c: '#f2c95a', unlock: { type: 'title', v: 'warlock' } },
  ],
  pet: [
    { id: 'none',   n: 'No Pet',       r: 'common',    unlock: { type: 'free' } },
    { id: 'frog',   n: 'Bog Frog',     r: 'common',    unlock: { type: 'free' } },
    { id: 'owl',    n: 'Owl',          r: 'rare',      unlock: { type: 'rank', v: 2 } },
    { id: 'cat',    n: 'Black Cat',    r: 'rare',      unlock: { type: 'level', v: 10 } },
    { id: 'wisp',   n: 'Will-o-Wisp',  r: 'epic',      unlock: { type: 'gems', v: 50 } },
    { id: 'dragon', n: 'Pocket Dragon', r: 'legendary', unlock: { type: 'rank', v: 6 } },
  ],
};
const RARITY = { common: '#9a8cc4', rare: '#5cc8ff', epic: '#c792ff', legendary: '#ffd45e' };
const DEFAULT_LOOK = { robe: 'azure', hat: 'pointy', staff: 'oak', beard: 'white', skin: 'peach', pet: 'none' };

/* ---------- Profile emblems (badge shown next to your name) ---------- */
const EMBLEMS = [
  { id: 'founder', n: 'Founder',      c: ['#e0c2ff', '#6a3fd6'], glyph: 'flame', unlock: { type: 'free' } },
  ...RANKS.map((r, i) => ({ id: 'rank' + i, n: r.n, rank: i, unlock: { type: 'rank', v: i } })),
  { id: 'storm',   n: 'Storm Caller', c: ['#fff7b0', '#d9a514'], glyph: 'bolt',  unlock: { type: 'gems', v: 25 } },
];

/* ---------- AI opponent profiles ----------
   fav: weight per spell when the AI picks (default 1). They build toward a plan; they never counter-pick you. */
const PROFILES = [
  { id: 'pyro',   n: 'Pyromancer',   fav: { fireball: 6, meteor: 5, ringfire: 4, burnbody: 4, beam: 3 },              look: { robe: 'crimson', hat: 'witch', staff: 'oak', beard: 'ginger', skin: 'tan', pet: 'none' } },
  { id: 'frost',  n: 'Frost Warden', fav: { icewall: 6, lightning: 3, fireball: 2 }, look: { robe: 'frost', hat: 'hood', staff: 'crystal', beard: 'long', skin: 'spirit', pet: 'owl' } },
  { id: 'necro',  n: 'Necromancer',  fav: { zombies: 6, flies: 5, thorns: 4, golem: 3 },                 look: { robe: 'moss', hat: 'hood', staff: 'skull', beard: 'none', skin: 'goblin', pet: 'cat' } },
  { id: 'trick',  n: 'Trickster',    fav: { mirror: 6, ghost: 5, rift: 5, shield: 4, lightning: 2 },    look: { robe: 'amethyst', hat: 'feathered', staff: 'wand', beard: 'none', skin: 'peach', pet: 'wisp' } },
  { id: 'storm',  n: 'Stormcaller',  fav: { lightning: 6, storm: 5, gravity: 4, beam: 4, icewall: 2 }, look: { robe: 'midnight', hat: 'pointy', staff: 'moon', beard: 'white', skin: 'umber', pet: 'none' } },
  { id: 'warden', n: 'Bastion',      fav: { orbs: 6, archer: 5, golem: 5, hourglass: 4, icewall: 3 },        look: { robe: 'royal', hat: 'crown', staff: 'crystal', beard: 'long', skin: 'peach', pet: 'owl' } },
  { id: 'wild',   n: 'Wild Mage',    fav: {},                                       look: null },
];

/* ---------- AI counter-picking ----------
   After each round the rival looks at what you cast most and favors cards (from its own fixed hand) that counter it. */
const COUNTERS = {
  ringfire: ['icewall', 'lightning', 'archer', 'ghost'], burnbody: ['archer', 'lightning', 'gale', 'ghost', 'meteor'],
  fireball: ['icewall', 'orbs', 'ghost', 'shield', 'golem', 'hourglass', 'gale'], icewall: ['zombies', 'meteor', 'beam', 'flies', 'rift'], zombies: ['fireball', 'bubbles', 'meteor', 'archer', 'thorns', 'golem', 'sinkhole', 'ringfire', 'burnbody'],
  lightning: ['totem', 'ghost', 'icewall', 'mirror', 'shield'], meteor: ['ghost', 'mirror', 'blink'], flies: ['fireball', 'orbs', 'bubbles', 'gale'],
  ghost: ['gravity', 'zombies', 'flies', 'bubbles'], mirror: ['lightning', 'ricochet', 'meteor'], gravity: ['ghost', 'icewall'],
  orbs: ['meteor', 'beam', 'lightning'], bubbles: ['ghost', 'icewall', 'fireball'], ricochet: ['icewall', 'orbs', 'shield'],
  shield: ['meteor', 'zombies', 'flies', 'gravity', 'thorns'],
  totem: ['fireball', 'meteor', 'zombies', 'beam'], blink: ['lightning', 'gravity', 'storm'], sinkhole: ['flies', 'ghost', 'blink', 'archer'], gale: ['lightning', 'beam', 'meteor', 'golem'],
  golem: ['beam', 'bubbles', 'lightning', 'thorns', 'sinkhole'], hourglass: ['lightning', 'beam', 'gravity'], thorns: ['fireball', 'meteor', 'flies', 'ghost'],
  storm: ['totem', 'shield', 'ghost', 'hourglass', 'blink'], rift: ['meteor', 'thorns', 'zombies', 'beam'],
  archer: ['fireball', 'meteor', 'lightning', 'zombies', 'shield'], beam: ['icewall', 'ghost', 'mirror', 'storm', 'golem'],
};
const THREAT = { meteor: 3, beam: 3, zombies: 2, golem: 2, storm: 2, fireball: 1.5, flies: 1.5 };

/* ---------- spell tags: element + attack type ---------- */
const ELEM_OF = {
  fireball: 'fire', meteor: 'fire', ringfire: 'fire', burnbody: 'fire',
  icewall: 'water', bubbles: 'water',
  zombies: 'death', flies: 'death', archer: 'death', ghost: 'death',
  lightning: 'lightning', storm: 'lightning', totem: 'lightning',
  golem: 'earth', thorns: 'earth', sinkhole: 'earth',
  gale: 'air', blink: 'air',
  mirror: 'arcane', orbs: 'arcane', ricochet: 'arcane', beam: 'arcane', shield: 'arcane', hourglass: 'arcane', rift: 'arcane', gravity: 'arcane',
};
const TYPE_OF = {
  fireball: 'proj', lightning: 'proj', ricochet: 'proj', bubbles: 'proj', beam: 'proj',
  meteor: 'area', storm: 'area', thorns: 'area', sinkhole: 'area', gravity: 'area', gale: 'area', ringfire: 'area',
  zombies: 'summon', flies: 'summon', archer: 'summon', golem: 'summon',
  orbs: 'melee', burnbody: 'melee',
  icewall: 'support', ghost: 'support', mirror: 'support', shield: 'support', hourglass: 'support', rift: 'support', totem: 'support', blink: 'support',
};
const ELEMS = {
  fire: { n: 'Fire', c: '#ff7a2a', i: '🔥', t: 'Pyromancer' }, water: { n: 'Water', c: '#4fb8ff', i: '💧', t: 'Tidecaller' },
  earth: { n: 'Earth', c: '#c9a56a', i: '⛰', t: 'Geomancer' }, air: { n: 'Air', c: '#9ff5e0', i: '🌪', t: 'Windwalker' },
  lightning: { n: 'Lightning', c: '#ffd23a', i: '⚡', t: 'Stormcaller' }, arcane: { n: 'Arcane', c: '#c08cff', i: '✦', t: 'Arcanist' },
  death: { n: 'Necromancy', c: '#9fe37a', i: '☠', t: 'Necromancer' },
};
const TYPES = { proj: 'Projectile', area: 'Area', summon: 'Summon', melee: 'Close range', support: 'Support' };
/* Synergy: distinct spells of one element in your Battle Hand. 2 = +10%, 3 = +20%, 4 = +30% damage for that element. */
/* Synergy (Battle Hand): 2+ spells sharing an element or an attack type give +5% damage per spell to that group.
   4 fire spells = Pyromancer, +20% fire. Element and type bonuses stack. */
const TYPE_SYN = { proj: { n: 'Projectile', t: 'Marksman', i: '➶', c: '#ffb36b' }, area: { n: 'Area', t: 'Devastator', i: '◎', c: '#ff8a96' }, summon: { n: 'Summon', t: 'Summoner', i: '☗', c: '#9fe37a' }, melee: { n: 'Close range', t: 'Brawler', i: '✊', c: '#ffd45e' }, support: { n: 'Support', t: 'Warden', i: '⛨', c: '#9fd8ff' } };
function synergyOf(list) { const ce = {}, ct = {}; [...new Set(list || [])].forEach(k => { const e = ELEM_OF[k], t = TYPE_OF[k]; if (e) ce[e] = (ce[e] || 0) + 1; if (t) ct[t] = (ct[t] || 0) + 1; }); const out = {}; for (const e in ce) if (ce[e] >= 2) out['el:' + e] = { n: ce[e], pct: .05 * ce[e] }; for (const t in ct) if (ct[t] >= 2) out['ty:' + t] = { n: ct[t], pct: .05 * ct[t] }; const u = [...new Set(list || [])]; if (u.length >= 3 && typeof SCHOOL_OF === 'function') { const sc = SCHOOL_OF(u[0]); if (u.every(k => SCHOOL_OF(k) === sc)) out['sc:' + sc] = { n: u.length, pct: .10 }; } return out; }

/* ---------- rival generator: names ---------- */
const RIVAL_FIRST = ['Morgrath', 'Vexa', 'Ignis', 'Sable', 'Grizelda', 'Quill', 'Thistle', 'Zoltan', 'Elowen', 'Bramble', 'Corvina', 'Fennick', 'Hollis', 'Isolde', 'Jasper', 'Kestrel', 'Lirael', 'Magnus', 'Nyx', 'Orrin', 'Perrin', 'Rowan', 'Seraphine', 'Tamsin', 'Ulric', 'Vesper', 'Wendeline', 'Xander', 'Yarrow', 'Zephyra', 'Bartholomew', 'Cinder', 'Dorian', 'Esme', 'Gideon', 'Hester', 'Ignatius', 'Juno', 'Lucan', 'Mirabel', 'Ozzwald', 'Pell', 'Rook', 'Saffron', 'Tobias', 'Umbra', 'Wick', 'Agatha', 'Barnaby', 'Clementine', 'Drusilla', 'Elric', 'Fable', 'Gwendolyn', 'Horatio', 'Imogen'];
const RIVAL_EPI = {
  fire: ['the Red', 'Ashborn', 'Cinderhand', 'the Scorched', 'Emberwick', 'of the Ember Court', 'Flamecrown'],
  water: ['Tidewhisper', 'the Drowned', 'Frostmantle', 'of the Deep', 'Rimeheart', 'Saltbeard'],
  earth: ['Stonebeard', 'the Rooted', 'Mossheart', 'Thornback', 'of the Hollow Hill', 'Gravelgrin'],
  air: ['Galeborn', 'the Restless', 'Skyward', 'Featherstep', 'of the Four Winds'],
  lightning: ['Stormeye', 'the Crackling', 'Thunderbrow', 'Sparkfinger', 'of the High Spire'],
  arcane: ['the Learned', 'Runebinder', 'of the Violet Tower', 'Hexwright', 'the Curious', 'Glyphkeeper'],
  death: ['the Pale', 'Gravetender', 'Bonewhisper', 'the Unburied', 'Mournveil', 'of the Crypt'],
};
