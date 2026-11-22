'use strict';
/* ===== Page Matériels et prix ===== */
const Mat = { q: '', todo: false, hideZero: false, collapsed: new Set() };

const matTotal = b => b.materials.reduce((s, m) => s + m.qty * m.price, 0);
const matBought = b => b.materials.reduce((s, m) => s + (m.bought ? m.qty * m.price : 0), 0);
function defaultMaterials(tpl) {
  return Object.entries(QTY[tpl] || {}).map(([k, q]) => { const c = CAT_BY_KEY[k]; return { id: uid(), k, cat: c.c, name: c.n, unit: c.u, price: c.p, qty: q, bought: false }; });
}

/* Lignes du modèle du bâtiment qui n'existent pas encore dans sa liste (utile après une mise à jour du catalogue) */
function missingFromTemplate(b) {
  const have = new Set(b.materials.map(m => m.k).filter(Boolean));
  return Object.entries(QTY[b.tpl] || {}).filter(([k]) => !have.has(k));
}

function renderMat() {
  const b = curB(), page = $('#page-materiels');
  page.innerHTML = `
    <h1 class="page-title">Matériels et prix — ${esc(b.name)}</h1>
    <p class="page-sub">Les prix sont des <b>estimations de départ</b> pour le Tchad (ciment et fer d'après la presse locale, le reste à confirmer). Remplacez-les par vos devis : tout se recalcule. Une machine glissée sur le plan ajoute 1 à sa ligne ci-dessous ; la supprimer du plan retire 1.</p>
    <div class="mat-tools">
      <input type="search" id="matQ" placeholder="Rechercher un matériel…" value="${esc(Mat.q)}" aria-label="Rechercher">
      <label><input type="checkbox" id="matTodo" ${Mat.todo ? 'checked' : ''}> Seulement ce qui reste à acheter</label>
      <label><input type="checkbox" id="matZero" ${Mat.hideZero ? 'checked' : ''}> Masquer les lignes à 0</label>
      <span class="spacer"></span>
      ${missingFromTemplate(b).length ? `<button class="btn" data-act="addmissing" title="Ajoute les lignes du modèle « ${esc((TPL[b.tpl] || {}).label || '')} » qui ne sont pas encore dans ce bâtiment">Ajouter les articles manquants du modèle (${missingFromTemplate(b).length})</button>` : ''}
      <button class="btn" data-act="reset">Remettre le catalogue de départ</button>
      <button class="btn" data-act="print">Imprimer</button>
    </div>
    <div class="card tablewrap"><table class="mat">
      <thead><tr><th title="Acheté">✓</th><th>Désignation</th><th>Unité</th><th class="r">Quantité</th><th class="r">Prix unitaire (FCFA)</th><th class="r">Total (FCFA)</th><th></th></tr></thead>
      <tbody id="matBody"></tbody></table></div>
    <form class="card addrow" id="matAdd" style="margin-top:12px">
      <label class="f">Ajouter une ligne<input name="name" list="catnames" type="text" placeholder="Nom (ou choisir dans le catalogue)" required autocomplete="off"></label>
      <label class="f">Unité<input name="unit" type="text" placeholder="sac, m²…" value="pièce"></label>
      <label class="f">Quantité<input name="qty" type="number" min="0" step="any" value="1"></label>
      <label class="f">Prix unitaire (FCFA)<input name="price" type="number" min="0" step="any" value="0"></label>
      <label class="f">Catégorie<select name="cat">${CATS.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
      <button class="btn primary">Ajouter</button>
      <datalist id="catnames">${CATALOG.map(c => `<option value="${esc(c.n)}"></option>`).join('')}</datalist>
    </form>
    <div class="grand" id="matGrand"></div>`;
  renderMatTable();
}

function renderMatTable() {
  const b = curB(), q = Mat.q.trim().toLowerCase();
  let html = '';
  const cats = [...CATS, ...new Set(b.materials.map(m => m.cat).filter(c => !CATS.includes(c)))];
  cats.forEach(cat => {
    const all = b.materials.filter(m => m.cat === cat);
    const rows = all.filter(m => (!q || (m.name + ' ' + cat).toLowerCase().includes(q)) && (!Mat.todo || !m.bought) && (!Mat.hideZero || m.qty > 0));
    if (!rows.length) return;
    const open = !Mat.collapsed.has(cat);
    html += `<tr class="cat" data-cat="${esc(cat)}"><td colspan="5">${open ? '▾' : '▸'} ${esc(cat)} <span style="font-weight:500;opacity:.8">(${rows.length})</span></td><td class="r" data-ctot="${esc(cat)}">${fmt(all.reduce((s, m) => s + m.qty * m.price, 0))}</td><td></td></tr>`;
    if (open) html += rows.map(m => `<tr data-id="${m.id}" class="${m.qty == 0 ? 'zero' : ''} ${m.bought ? 'bought' : ''}">
      <td style="width:34px"><input type="checkbox" data-f="bought" ${m.bought ? 'checked' : ''} title="Marquer comme acheté" aria-label="Acheté"></td>
      <td><input type="text" data-f="name" value="${esc(m.name)}" aria-label="Désignation"></td>
      <td style="width:92px"><input type="text" data-f="unit" value="${esc(m.unit)}" aria-label="Unité"></td>
      <td style="width:104px"><input type="number" data-f="qty" min="0" step="any" value="${m.qty}" aria-label="Quantité"></td>
      <td style="width:140px"><input type="number" data-f="price" min="0" step="any" value="${m.price}" aria-label="Prix unitaire"></td>
      <td class="tot" data-tot>${fmt(m.qty * m.price)}</td>
      <td style="width:34px"><button class="x" data-del title="Supprimer la ligne" aria-label="Supprimer">×</button></td></tr>`).join('');
  });
  $('#matBody').innerHTML = html || `<tr><td colspan="7" class="empty">Aucun matériel ne correspond. Ajoutez une ligne ci-dessous.</td></tr>`;
  updateMatTotals();
}
function updateMatTotals() {
  const b = curB(), t = matTotal(b), bo = matBought(b);
  $('#matGrand').innerHTML = `<div><small>Total estimé</small><b>${money(t)}</b></div><div><small>Déjà acheté</small><b>${money(bo)}</b></div>
    <div><small>Reste à payer</small><b>${money(t - bo)}</b></div><div><small>Lignes</small><b>${b.materials.filter(m => m.qty > 0).length} / ${b.materials.length}</b></div>`;
  $$('#matBody [data-ctot]').forEach(td => { td.textContent = fmt(b.materials.filter(m => m.cat === td.dataset.ctot).reduce((s, m) => s + m.qty * m.price, 0)); });
}

function initMat() {
  const page = $('#page-materiels');
  page.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'matQ') { Mat.q = t.value; return renderMatTable(); }
    if (t.name === 'name' && t.closest('#matAdd')) {
      const c = CATALOG.find(x => x.n === t.value);
      if (c) { const f = t.form; f.unit.value = c.u; f.price.value = c.p; f.cat.value = c.c; }
      return;
    }
    const f = t.dataset.f, tr = t.closest('tr[data-id]'); if (!f || !tr) return;
    const m = curB().materials.find(x => x.id === tr.dataset.id); if (!m) return;
    if (f === 'qty' || f === 'price') {
      const v = parseFloat(t.value); m[f] = Number.isFinite(v) && v >= 0 ? v : 0;
      tr.querySelector('[data-tot]').textContent = fmt(m.qty * m.price); tr.classList.toggle('zero', m.qty == 0); updateMatTotals();
    } else if (f === 'name' || f === 'unit') m[f] = t.value;
    save();
  });
  page.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'matTodo') { Mat.todo = t.checked; return renderMatTable(); }
    if (t.id === 'matZero') { Mat.hideZero = t.checked; return renderMatTable(); }
    if (t.dataset.f === 'bought') {
      const tr = t.closest('tr'), m = curB().materials.find(x => x.id === tr.dataset.id); m.bought = t.checked;
      tr.classList.toggle('bought', m.bought); save(); updateMatTotals(); if (Mat.todo) renderMatTable();
    }
  });
  page.addEventListener('click', ev => {
    const b = curB();
    const del = ev.target.closest('[data-del]');
    if (del) { const id = del.closest('tr').dataset.id; b.materials = b.materials.filter(m => m.id !== id); save(); return renderMatTable(); }
    const cat = ev.target.closest('tr.cat');
    if (cat) { const c = cat.dataset.cat; Mat.collapsed.has(c) ? Mat.collapsed.delete(c) : Mat.collapsed.add(c); return renderMatTable(); }
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'print') window.print();
    if (a.dataset.act === 'addmissing') {
      const miss = missingFromTemplate(b);
      miss.forEach(([k, q]) => { const c = CAT_BY_KEY[k]; b.materials.push({ id: uid(), k, cat: c.c, name: c.n, unit: c.u, price: c.p, qty: q, bought: false }); });
      save(); renderMat(); toast(`${miss.length} lignes ajoutées. Vos quantités et prix existants n'ont pas changé.`);
    }
    if (a.dataset.act === 'reset' && confirm('Remettre toutes les lignes, quantités et prix du catalogue de départ ? Vos modifications sur ce bâtiment seront perdues.')) {
      b.materials = defaultMaterials(b.tpl); save(); renderMat(); toast('Catalogue de départ remis.');
    }
  });
  page.addEventListener('submit', ev => {
    if (ev.target.id !== 'matAdd') return; ev.preventDefault();
    const f = ev.target, b = curB(), c = CATALOG.find(x => x.n === f.name.value.trim());
    b.materials.push({ id: uid(), k: c ? c.k : '', cat: f.cat.value, name: f.name.value.trim(), unit: f.unit.value.trim() || 'pièce', price: Math.max(0, num(f.price.value)), qty: Math.max(0, num(f.qty.value)), bought: false });
    save(); Mat.collapsed.delete(f.cat.value); f.reset(); f.unit.value = 'pièce'; f.qty.value = 1; f.price.value = 0; renderMatTable(); toast('Ligne ajoutée.');
  });
}
