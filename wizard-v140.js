/* =====================================================================
   WIZARDS VS SORCERERS: 1.0.33.20
   1. Skipping the tutorial before the path step gives 2 Spell + 2 Technique Tokens (the tutorial gives 4 in all;
      a fresh save holds 4 + 4 from older one-off grants until the path step sets them).
   2. Short phones (iPhone SE / 8): the yard's range arrows (#yStHud, display only) shrink into the bottom-left
      corner when they would sit on the Challenges / Ladder / Pass buttons.
   (The coached first duel is Casual: see startMatch in wizard-mockup.html.)
   ===================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------------- 1. skipping before the path step ---------------- */
  if (typeof onbFinish === 'function') { const _of = onbFinish; window.onbFinish = function (skipped) {
      try { if (skipped && PR.noStart && !PR.pathPick && !(PR.chosen || []).length) { PR.tokens = 2; PR.tokS = 2; PR.pathPick = 'skip'; } } catch (e) {}
      return _of.apply(this, arguments); };
    try { (0, eval)('onbFinish = window.onbFinish'); } catch (e) {} }

  /* ---------------- 2. range arrows on short yards ---------------- */
  const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  function fitHud() { const h = $('yStHud'); if (!h || !h.offsetParent) return;
    h.classList.remove('v140-short'); const r = h.getBoundingClientRect();
    const clash = ['chBtn', 'ldBtn', 'spBtn'].some(id => { const b = $(id); return b && b.offsetParent && hit(r, b.getBoundingClientRect()); });
    if (clash) h.classList.add('v140-short'); }
  window.addEventListener('resize', () => setTimeout(fitHud, 50));
  setInterval(() => { try { if ($('home') && $('home').classList.contains('on')) fitHud(); } catch (e) {} }, 800);

  const css = document.createElement('style');
  css.textContent = `#yStHud.v140-short{bottom:6px;left:8px;transform:scale(.55)}`;
  document.head.appendChild(css);
})();
