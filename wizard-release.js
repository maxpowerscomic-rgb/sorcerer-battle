/* =====================================================================
   WIZARDS VS SORCERERS: release (App Store) mode
   Active when the iOS wrapper sets window.SB_RELEASE (or ?release=1 in a browser).
   Strips playtest/demo content: fake friends, fake matchmaking, simulated purchases.
   Every opponent is an AI rival and is labelled as one.
   ===================================================================== */
(function () {
  const on = window.SB_RELEASE || /[?&]release=1/.test(location.search);
  if (!on) return;
  document.documentElement.classList.add('release');
  // 1. no demo friends: hide the tab and its onboarding stop
  try { FRIENDS.length = 0; } catch (e) {}
  const css = document.createElement('style');
  css.textContent = `.tab[data-t="friends"]{display:none!important}.pknote{display:none}.notes{display:none!important}
  html,body{height:100%;overflow:hidden;overscroll-behavior:none}body{padding:0!important;gap:0!important;background:#0d0a18!important;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  .phone{position:fixed!important;top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);left:0;right:0;width:auto!important;aspect-ratio:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important}`;
  const vp = document.querySelector('meta[name=viewport]'); if (vp) vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  document.head.appendChild(css);
  if (typeof ONB_STEPS !== 'undefined') { const i = ONB_STEPS.findIndex(s => s.id === 'friends'); if (i >= 0) ONB_STEPS.splice(i, 1); }
  // 2. matchmaking copy: AI rivals, not other players
  const vs = document.getElementById('vsFind');
  if (vs) new MutationObserver(() => {
    const t = vs.textContent; if (t === 'Finding opponent…') vs.textContent = 'Summoning an AI rival…'; else if (t === 'Opponent found!') vs.textContent = 'AI rival ready!';
  }).observe(vs, { childList: true, characterData: true, subtree: true });
  // 3. packs: real in-app purchases through the native StoreKit bridge
  const iap = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iap;
  if (typeof buyPack === 'function') {
    const grant = buyPack;
    window.SB_IAP_DONE = function (id, ok, msg) { if (ok) grant(id); else if (msg) toast(msg); };
    window.buyPack = function (id) { if (iap) iap.postMessage({ action: 'buy', id }); else toast('Purchases are only available in the app.'); };
    window.SB_IAP_PRICES = function (map) { try { PACKS.forEach(p => { if (map[p.id]) p.price = map[p.id]; }); if (typeof renderShop === 'function' && document.getElementById('shop')?.classList.contains('on')) renderShop(); } catch (e) {} };
    if (iap) iap.postMessage({ action: 'prices' });
  }
})();
