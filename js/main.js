'use strict';
/* ===== Démarrage ===== */
(function () {
  S = loadState() || makeState();
  if (!S.buildings.some(b => b.id === S.cur)) S.cur = S.buildings[0].id;
  applyTheme();
  initBar(); initIO(); initPlan(); initMat(); initNotes(); initBudget(); initTheme();
  window.addEventListener('hashchange', () => go(location.hash.slice(1), true));
  window.addEventListener('beforeunload', () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoré */ } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.page === 'plan') Plan.tab === '2d' ? draw2D() : Plan.tab === '3d' && View3D.draw(); });
  go(location.hash.slice(1) || S.page || 'plan', true);
  save();
})();
