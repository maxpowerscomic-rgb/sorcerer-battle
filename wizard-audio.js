/* =====================================================================
   SORCERER BATTLE: audio manager
   Plays the ElevenLabs-generated files listed in audio/manifest.json.
   Groups: ui, sfx, jingle (follow the Sound slider) and music (Music slider).
   Missing files are skipped silently, so the game runs fine before generation.
   ===================================================================== */
const AU = { ctx: null, man: null, buf: {}, loading: {}, g: {}, last: {}, mus: null, musId: null, want: null, duckT: 0 };

fetch('audio/manifest.json').then(r => r.ok ? r.json() : null).then(m => { AU.man = m; if (AU.ctx) auPreload(); }).catch(() => {});

function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const c = AU.ctx = new C(), comp = c.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(c.destination);
  AU.g.master = c.createGain(); AU.g.master.connect(comp);
  for (const k of ['ui', 'sfx', 'jingle', 'music']) { AU.g[k] = c.createGain(); AU.g[k].connect(AU.g.master); }
  auVol(); if (AU.man) auPreload();
}
function auVol() {
  if (!AU.ctx) return; const o = (typeof SET === 'function') ? SET() : { sfx: 80, music: 70 }, s = o.sfx / 100, m = o.music / 100;
  AU.g.ui.gain.value = s * .8; AU.g.sfx.gain.value = s * .9; AU.g.jingle.gain.value = s;
  AU.g.music.gain.setTargetAtTime(m * .45 * (AU.duckT > 0 ? .25 : 1), AU.ctx.currentTime, .05);
}
function auLoad(f) {
  if (AU.buf[f] || AU.loading[f]) return AU.loading[f];
  return AU.loading[f] = fetch(f).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(a => AU.ctx.decodeAudioData(a)).then(b => (AU.buf[f] = b)).catch(() => { AU.buf[f] = null; });
}
function auPreload() {
  const ids = Object.keys(AU.man), first = ids.filter(k => AU.man[k].kind !== 'music'), mus = ids.filter(k => AU.man[k].kind === 'music');
  first.concat(mus).forEach(k => AU.man[k].files.forEach(auLoad));
  if (AU.want) { const w = AU.want; AU.musId = null; music(w); }
}
function sfx(id, o = {}) {
  if (!AU.ctx || !AU.man || AU.ctx.state !== 'running') return; const e = AU.man[id]; if (!e) return;
  const now = AU.ctx.currentTime; if (now - (AU.last[id] || -9) < (e.cd || .05)) return; AU.last[id] = now;
  const f = e.files[(Math.random() * e.files.length) | 0], b = AU.buf[f]; if (!b) { if (b === undefined) auLoad(f); return; }
  const src = AU.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = (o.rate || 1) * (e.group === 'sfx' ? 1 + (Math.random() - .5) * .08 : 1);
  const gn = AU.ctx.createGain(); gn.gain.value = (e.vol || 1) * (o.vol == null ? 1 : o.vol);
  let node = src.connect(gn);
  if (o.x != null && AU.ctx.createStereoPanner) { const p = AU.ctx.createStereoPanner(); p.pan.value = Math.max(-.7, Math.min(.7, (o.x / 390) * 2 - 1)) ; node = gn.connect(p); }
  node.connect(AU.g[e.group] || AU.g.sfx); src.start();
  if (e.group === 'jingle') { AU.duckT = b.duration; auVol(); setTimeout(() => { AU.duckT = 0; auVol(); }, b.duration * 1000); }
  return src;
}
function music(id) {
  AU.want = id; if (!AU.ctx || !AU.man) return; if (AU.musId === id) return;
  const XF = 1.6, now0 = AU.ctx.currentTime, old = AU.mus; if (old) { const g = old.g.gain; g.cancelScheduledValues(now0); g.setValueAtTime(g.value, now0); g.linearRampToValueAtTime(0, now0 + XF); setTimeout(() => { try { old.src.stop(); } catch (e) {} }, XF * 1000 + 200); }   /* crossfade out */
  AU.mus = null; AU.musId = id; if (!id) return;
  const e = AU.man[id]; if (!e) return; const f = e.files[0];
  const start = b => { if (!b || AU.musId !== id) return; const src = AU.ctx.createBufferSource(), g = AU.ctx.createGain(); src.buffer = b; src.loop = true; const t0 = AU.ctx.currentTime; if (old) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(e.vol || 1, t0 + 1.6); }   /* crossfade in over the track it replaces */ else g.gain.setValueAtTime(e.vol || 1, t0);   /* nothing was playing (first load): start at full volume, the intro is quiet enough */ src.connect(g).connect(AU.g.music); src.start(); AU.mus = { src, g }; };
  if (AU.buf[f]) start(AU.buf[f]); else Promise.resolve(auLoad(f)).then(() => start(AU.buf[f]));
  /* (1.0.23) decoded music is big (tens of megabytes a track). Keeping every track that has ever played ran phones out of memory,
     and the browser then reloaded the page with a white flash. Only the track playing now and the one fading out stay decoded. */
  try { const keep = new Set([f, AU.lastMusF]); AU.lastMusF = f; for (const id2 in AU.man) { if (id2.slice(0, 4) !== 'bgm_') continue; for (const g of (AU.man[id2].files || [])) if (!keep.has(g) && AU.buf[g]) { delete AU.buf[g]; delete AU.loading[g]; } } } catch (e2) {}
}
// phones only allow audio after a tap
['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, auInit, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; document.hidden ? AU.ctx.suspend() : AU.ctx.resume(); });
// every button press clicks
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('button,.btn,[onclick],.tab,.chip'); if (t) sfx('ui_click'); }, true);
