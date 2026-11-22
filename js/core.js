'use strict';
/* ===== Noyau : outils, état, sauvegarde, dialogues ===== */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const fmt = n => nf.format(Math.round(n || 0)).replace(/[  ]/g, ' ');
const fm1 = n => nf1.format(n || 0).replace(/[  ]/g, ' ');
const money = n => fmt(n) + ' FCFA';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const roundTo = (v, s) => Math.round(v / s) * s;
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : d; };

const KEY = 'mon-chantier-v1';
let S = null;

function curB() { return S.buildings.find(b => b.id === S.cur) || S.buildings[0]; }

function loadState() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) { const s = JSON.parse(r); if (s && Array.isArray(s.buildings) && s.buildings.length) return s; }
  } catch (e) { /* stockage indisponible */ }
  return null;
}

let saveTimer = null;
function setSaveState(t) { const el = $('#saveState'); if (el) el.textContent = t; }
function saveNow() {
  clearTimeout(saveTimer); saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(S)); setSaveState('Enregistré'); }
  catch (e) { setSaveState('Non enregistré : exportez une sauvegarde'); }
}
function flushSave() { if (saveTimer) { if (window.Cloud && Cloud.st) Cloud.afterSave(); saveNow(); } }
function save() {
  setSaveState('Enregistrement…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { if (window.Cloud && Cloud.st) Cloud.afterSave(); saveNow(); }, 250);
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2800);
}

/* ===== Navigation ===== */
const PAGES = ['plan', 'materiels', 'notes', 'budget', 'couleurs', 'compte'];
function go(page, fromHash) {
  if (!PAGES.includes(page)) page = 'plan';
  S.page = page;
  PAGES.forEach(p => { $('#page-' + p).hidden = p !== page; });
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.page === page));
  if (!fromHash && location.hash !== '#' + page) history.replaceState(null, '', '#' + page);
  renderBar();
  if (page === 'plan') renderPlan();
  if (page === 'materiels') renderMat();
  if (page === 'notes') renderNotes();
  if (page === 'budget') renderBudget();
  if (page === 'couleurs') renderTheme();
  if (page === 'compte') renderCompte();
  window.scrollTo(0, 0);
}

/* ===== Barre des bâtiments ===== */
function progressOf(b) {
  let t = 0, d = 0;
  (b.steps || []).forEach(p => p.items.forEach(i => { t++; if (i.done) d++; }));
  return t ? Math.round(100 * d / t) : 0;
}
function renderBar() {
  const bar = $('#bbar');
  const show = S.page === 'plan' || S.page === 'materiels';
  bar.hidden = !show;
  if (!show) return;
  const chips = S.buildings.map(b =>
    `<button class="chip ${b.id === S.cur ? 'active' : ''}" data-b="${b.id}">${esc(b.name)}</button>`).join('');
  bar.innerHTML = `<div class="bchips">${chips}<button class="chip add" data-act="newb">+ Nouveau bâtiment</button></div>
    <div class="bact"><button class="btn sm" data-act="renb">Renommer</button><button class="btn sm" data-act="dupb">Dupliquer</button><button class="btn sm danger" data-act="delb">Supprimer</button></div>`;
}
function selectBuilding(id) {
  S.cur = id; save(); renderBar();
  if (S.page === 'plan') { Plan.sel = null; renderPlan(true); }
  if (S.page === 'materiels') renderMat();
}
function initBar() {
  $('#bbar').addEventListener('click', e => {
    const chip = e.target.closest('[data-b]');
    if (chip) return selectBuilding(chip.dataset.b);
    const a = e.target.closest('[data-act]'); if (!a) return;
    const b = curB();
    if (a.dataset.act === 'newb') return openNewBuilding();
    if (a.dataset.act === 'renb') {
      const n = prompt('Nouveau nom du bâtiment :', b.name);
      if (n && n.trim()) { b.name = n.trim().slice(0, 40); save(); renderBar(); }
    }
    if (a.dataset.act === 'dupb') {
      const c = JSON.parse(JSON.stringify(b)); c.id = uid(); c.name = b.name + ' (copie)';
      S.buildings.push(c); S.cur = c.id; save(); renderBar(); refreshPage(); toast('Bâtiment dupliqué.');
    }
    if (a.dataset.act === 'delb') {
      if (S.buildings.length < 2) return toast('Il faut garder au moins un bâtiment.');
      if (confirm(`Supprimer « ${b.name} » avec son plan, ses étapes et ses matériels ? Cette action est définitive.`)) {
        S.buildings = S.buildings.filter(x => x.id !== b.id); S.cur = S.buildings[0].id; Plan.sel = null;
        save(); renderBar(); refreshPage();
      }
    }
  });
}
function refreshPage() {
  if (S.page === 'plan') renderPlan(true);
  if (S.page === 'materiels') renderMat();
  if (S.page === 'budget') renderBudget();
}

function openNewBuilding() {
  const dlg = $('#dlg');
  dlg.innerHTML = `<form class="dlg" method="dialog">
    <h2>Nouveau bâtiment</h2>
    <p class="note" style="margin:0">Le plan démarre toujours vide : vous le formez en glissant des éléments depuis la palette. Le modèle choisi ne remplit que les étapes et la liste de matériels.</p>
    <label class="f" style="margin-top:12px">Nom du bâtiment<input name="nm" type="text" maxlength="40" placeholder="Ex. : Maison de la famille" autofocus></label>
    <div class="fields" style="margin-top:10px"><label class="f">Terrain : largeur (m)<input name="tw" type="number" min="5" step="1" value="30"></label><label class="f">Terrain : profondeur (m)<input name="td" type="number" min="5" step="1" value="25"></label></div>
    <div class="tpls">${Object.entries(TPL).filter(([, t]) => !t.sub).map(([k, t], i) =>
      `<label class="tpl"><input type="radio" name="tpl" value="${k}" ${i === 0 ? 'checked' : ''}><b>${esc(t.label)}</b><span>${esc(t.desc)}</span></label>`).join('')}</div>
    <label class="chk" style="padding:0"><input type="checkbox" name="sample"><span>Ajouter aussi le plan d'exemple du modèle (inutile pour « Page vide »)</span></label>
    <div class="row"><button type="button" class="btn" data-close>Annuler</button><button class="btn primary" value="ok">Créer</button></div>
  </form>`;
  dlg.showModal();
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('form').addEventListener('submit', ev => {
    ev.preventDefault();
    const f = new FormData(ev.target), tpl = f.get('tpl') || 'vide';
    const base = { name: (f.get('nm') || '').trim(), sample: !!f.get('sample'), tw: clamp(num(f.get('tw'), 30), 5, 500), td: clamp(num(f.get('td'), 25), 5, 500) };
    if (TPL[tpl].subs) chooseEnterprise(tpl, base); else finishNewBuilding(tpl, base);
  });
}
/* Deuxième étape : par exemple Atelier / usine → Savonnerie, Entreprise de biogaz ou atelier général */
function chooseEnterprise(parent, base) {
  const dlg = $('#dlg'), subs = TPL[parent].subs;
  dlg.innerHTML = `<form class="dlg" method="dialog">
    <h2>Quelle entreprise ?</h2>
    <p class="note" style="margin:0">Le plan sera vide. La palette de gauche proposera les pièces et les machines de cette entreprise à glisser sur le plan, et la liste de matériels et les étapes s'adaptent.</p>
    <div class="tpls">${subs.map((k, i) => `<label class="tpl"><input type="radio" name="sub" value="${k}" ${i === 0 ? 'checked' : ''}><b>${esc(TPL[k].sublabel || TPL[k].label)}</b><span>${esc(TPL[k].desc)}</span></label>`).join('')}</div>
    <div class="row"><button type="button" class="btn" data-back>Retour</button><button class="btn primary" value="ok">Créer</button></div>
  </form>`;
  dlg.querySelector('[data-back]').addEventListener('click', () => openNewBuilding());
  dlg.querySelector('form').addEventListener('submit', ev => {
    ev.preventDefault();
    finishNewBuilding(new FormData(ev.target).get('sub') || parent, base);
  });
}
function finishNewBuilding(tpl, base) {
  const name = base.name || (tpl === 'vide' ? 'Nouveau bâtiment' : TPL[tpl].label);
  const b = makeBuilding(tpl, name, { samplePlan: base.sample && tpl !== 'vide', tw: base.tw, td: base.td });
  $('#dlg').close();
  S.buildings.push(b); S.cur = b.id; Plan.sel = null; save(); renderBar(); refreshPage();
  toast('Bâtiment créé : ' + b.name);
}

/* ===== Export / import ===== */
function initIO() {
  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mon-chantier-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Sauvegarde téléchargée.');
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!s || !Array.isArray(s.buildings) || !s.buildings.length) throw new Error('format');
      if (!confirm('Remplacer tout le contenu actuel par cette sauvegarde ?')) return;
      S = s; S.cur = S.buildings.some(b => b.id === S.cur) ? S.cur : S.buildings[0].id; Plan.sel = null;
      save(); go(S.page || 'plan'); toast('Sauvegarde importée.');
    } catch (err) { toast('Fichier non reconnu.'); }
  });
}
