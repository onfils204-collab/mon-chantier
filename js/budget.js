'use strict';
/* ===== Page Budget : récapitulatif de tous les bâtiments ===== */
function renderBudget() {
  const page = $('#page-budget');
  const rows = S.buildings.map(b => ({ b, total: matTotal(b), bought: matBought(b), prog: progressOf(b) }));
  const total = rows.reduce((s, r) => s + r.total, 0), bought = rows.reduce((s, r) => s + r.bought, 0);
  const reserve = total * (S.reserve || 0) / 100, planned = total + reserve, target = S.target || 0, gap = target - planned;

  const catSum = {};
  S.buildings.forEach(b => b.materials.forEach(m => { catSum[m.cat] = (catSum[m.cat] || 0) + m.qty * m.price; }));
  const cats = Object.entries(catSum).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]), maxCat = cats.length ? cats[0][1] : 1;
  const items = [];
  S.buildings.forEach(b => b.materials.forEach(m => { if (m.qty * m.price > 0) items.push({ b: b.name, n: m.name, t: m.qty * m.price, q: m.qty, u: m.unit }); }));
  items.sort((a, b) => b.t - a.t);
  const pct = v => total ? Math.round(100 * v / total) : 0;

  page.innerHTML = `<h1 class="page-title">Budget</h1>
    <p class="page-sub">Le total de tous vos bâtiments, calculé à partir des pages Matériels et prix. Rien à saisir ici, sauf votre budget disponible.</p>
    <div class="kpis">
      <div class="card kpi"><small>Total estimé</small><b>${money(total)}</b><span>${S.buildings.length} bâtiment${S.buildings.length > 1 ? 's' : ''}</span></div>
      <div class="card kpi"><small>Marge pour imprévus (${S.reserve || 0} %)</small><b>${money(reserve)}</b><span>Budget à prévoir : ${money(planned)}</span></div>
      <div class="card kpi"><small>Déjà acheté</small><b>${money(bought)}</b><span>${pct(bought)} % du total estimé</span></div>
      <div class="card kpi"><small>Reste à payer</small><b>${money(total - bought)}</b><span>hors marge pour imprévus</span></div>
      ${target > 0 ? `<div class="card kpi ${gap < 0 ? 'warn' : ''}"><small>${gap < 0 ? 'Il manque' : 'Budget restant'}</small><b>${money(Math.abs(gap))}</b><span>sur un budget de ${money(target)}</span></div>` : ''}
    </div>
    <div class="card set">
      <label class="f">Marge pour imprévus (%)<input type="number" id="bRes" min="0" max="100" step="1" value="${S.reserve || 0}"></label>
      <label class="f">Budget dont vous disposez (FCFA)<input type="number" id="bTarget" min="0" step="100000" value="${target || ''}" placeholder="Laisser vide si inconnu"></label>
      <span class="note" style="margin:0;flex:1;min-width:220px">Conseil : 10 à 15 % de marge est courant sur un chantier. Les prix des matériaux peuvent varier d'un mois à l'autre.</span>
    </div>
    <div class="grid2">
      <div class="card pad"><h2 style="font-size:17px;margin-bottom:10px">Par bâtiment</h2>
        <div class="tablewrap"><table class="bt"><thead><tr><th>Bâtiment</th><th class="r">Estimé</th><th class="r">Acheté</th><th class="r">Reste</th><th class="r">Part</th><th class="r">Étapes</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td><b>${esc(r.b.name)}</b></td><td class="r">${fmt(r.total)}</td><td class="r">${fmt(r.bought)}</td><td class="r">${fmt(r.total - r.bought)}</td><td class="r">${pct(r.total)} %</td><td class="r">${r.prog} %</td></tr>`).join('')}
        <tr><td><b>Total</b></td><td class="r"><b>${fmt(total)}</b></td><td class="r"><b>${fmt(bought)}</b></td><td class="r"><b>${fmt(total - bought)}</b></td><td class="r">100 %</td><td class="r"></td></tr></tbody></table></div>
        <p class="note">Montants en FCFA.</p></div>
      <div class="card pad"><h2 style="font-size:17px;margin-bottom:10px">Par catégorie</h2>
        ${cats.map(([c, v]) => `<div class="hbar"><span title="${esc(c)}">${esc(c)}</span><div class="track"><i style="width:${Math.max(2, 100 * v / maxCat)}%"></i></div><span>${fmt(v)}</span></div>`).join('') || '<div class="empty">Pas encore de matériels chiffrés.</div>'}
      </div>
    </div>
    <div class="card pad"><h2 style="font-size:17px;margin-bottom:10px">Les 8 plus gros postes</h2>
      <div class="tablewrap"><table class="bt"><thead><tr><th>Désignation</th><th>Bâtiment</th><th class="r">Quantité</th><th class="r">Total (FCFA)</th><th class="r">Part</th></tr></thead><tbody>
      ${items.slice(0, 8).map(i => `<tr><td>${esc(i.n)}</td><td>${esc(i.b)}</td><td class="r">${fmt(i.q)} ${esc(i.u)}</td><td class="r">${fmt(i.t)}</td><td class="r">${pct(i.t)} %</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Rien à afficher.</td></tr>'}
      </tbody></table></div></div>`;
}
function initBudget() {
  $('#page-budget').addEventListener('change', ev => {
    if (ev.target.id === 'bRes') { S.reserve = clamp(num(ev.target.value, 10), 0, 100); save(); renderBudget(); }
    if (ev.target.id === 'bTarget') { S.target = Math.max(0, num(ev.target.value, 0)); save(); renderBudget(); }
  });
}
