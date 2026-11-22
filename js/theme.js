'use strict';
/* ===== Page Couleurs : 15 palettes, mode clair / sombre / automatique ===== */

/* id, nom, ambiance, [fond, encre, couleur principale, couleur d'appoint, terrain, toit] */
const PALETTES = [
  ['foret', 'Forêt et bois', 'Vert profond et citron vert', '#F4F1E8', '#1D2822', '#2F6B4F', '#A8C256', '#DDE9D0', '#B5654A'],
  ['sahel', 'Terre du Sahel', 'Terracotta, sable et ocre', '#F5EBDD', '#2B2118', '#B5532F', '#D9A441', '#E4D3A8', '#8C3B22'],
  ['chantier', 'Bleu chantier', 'Bleu marine et orange sécurité', '#F1F4F8', '#14233A', '#1F3A5F', '#F28C28', '#D5E3F0', '#F28C28'],
  ['ardoise', 'Ardoise et cuivre', 'Gris bleuté et cuivre', '#EEF1F3', '#1E2830', '#2E3A46', '#C8743A', '#D6DFD9', '#C8743A'],
  ['brique', 'Brique et nuit', 'Rouge brique et moutarde', '#F7F1E6', '#1B2A41', '#A63D2F', '#E2A72E', '#E8E0CC', '#A63D2F'],
  ['lac', 'Lac et sable', 'Turquoise et jaune miel', '#F7F3EA', '#17313A', '#0F7C8A', '#E9B44C', '#F0E2BF', '#C9852B'],
  ['savane', 'Savane', 'Olive, herbes sèches et orange', '#F6F0DC', '#2E2A14', '#8A7A1F', '#D96C2B', '#E7E0B0', '#B5542A'],
  ['rose', 'Rose des sables', 'Rose poudré et pêche', '#F8EDE8', '#3A2420', '#C2615A', '#E8A87C', '#F0D9CC', '#9C4A3F'],
  ['menthe', 'Menthe fraîche', 'Vert menthe et jaune soleil', '#EEF6F2', '#173228', '#2E9C7A', '#F2B84B', '#D5EBDD', '#C26A4A'],
  ['prune', 'Prune et or', 'Violet profond et or', '#F5EEF2', '#2D1830', '#7B3F73', '#E0B04A', '#E8DCE6', '#8E4A64'],
  ['ocean', 'Océan profond', 'Bleu océan et abricot', '#EEF3F6', '#0E2230', '#146C94', '#F5A25D', '#D2E4EC', '#D9783B'],
  ['argile', 'Argile et olive', 'Olive et argile cuite', '#F3EEE4', '#2B2A1C', '#6B7A3A', '#C97B4A', '#DDE2C4', '#A85D3A'],
  ['graphite', 'Graphite et citron', 'Gris anthracite et vert acide', '#F2F2EF', '#1F2123', '#3A3F44', '#C7D63B', '#DCE0DA', '#6F7479'],
  ['corail', 'Corail et marine', 'Corail vif et bleu marine', '#FFF3EE', '#1D2B3A', '#E4572E', '#2E5E8C', '#F3DDD2', '#2E5E8C'],
  ['lavande', 'Lavande et sauge', 'Violet doux et vert sauge', '#F3F1F7', '#25233A', '#6A5ACD', '#8FB996', '#DFE3EE', '#7D6BB5']
].map(([id, name, mood, bg, ink, accent, accent2, terrain, roof]) => ({ id, name, mood, bg, ink, accent, accent2, terrain, roof }));

/* ----- outils couleur ----- */
const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgbHex = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixC = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };   // t = part de b
const rgbaC = (h, al) => { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${al})`; };
const lumC = h => { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

function themeVars(p, dark) {
  const W = '#ffffff', B = '#000000';
  if (!dark) {
    return {
      '--bg': p.bg, '--panel': mixC(p.bg, W, 0.6), '--panel2': mixC(p.bg, p.ink, 0.04), '--ink': p.ink, '--muted': mixC(p.ink, p.bg, 0.42),
      '--line': mixC(p.bg, p.ink, 0.15), '--accent': p.accent, '--accent-ink': lumC(p.accent) > 0.45 ? p.ink : '#ffffff',
      '--accent-soft': mixC(p.bg, p.accent, 0.17), '--accent2': p.accent2, '--warn': '#b5532f', '--warn-soft': mixC(p.bg, '#b5532f', 0.15),
      '--shadow': '0 1px 2px rgba(30,30,20,.06),0 6px 20px rgba(30,30,20,.06)',
      '--stage': mixC(p.bg, p.ink, 0.07), '--grass': p.terrain, '--grid': rgbaC(p.ink, 0.08), '--grid-major': rgbaC(p.ink, 0.18), '--wall': p.ink,
      '--paper': mixC(p.accent2, W, 0.78), '--paper-line': rgbaC(p.ink, 0.16), '--paper-ink': p.ink, '--margin': 'rgba(200,70,60,.45)',
      '--roof': p.roof, '--sky1': mixC(p.bg, p.accent, 0.24), '--sky2': mixC(p.bg, W, 0.4)
    };
  }
  const db = mixC(p.ink, B, 0.35), ac = lumC(p.accent) < 0.3 ? mixC(p.accent, W, 0.4) : p.accent;
  return {
    '--bg': db, '--panel': mixC(db, W, 0.05), '--panel2': mixC(db, W, 0.09), '--ink': mixC(p.bg, db, 0.08), '--muted': mixC(p.bg, db, 0.55),
    '--line': mixC(db, W, 0.17), '--accent': ac, '--accent-ink': db, '--accent-soft': mixC(db, ac, 0.28), '--accent2': p.accent2,
    '--warn': '#e58a65', '--warn-soft': mixC(db, '#e58a65', 0.18), '--shadow': '0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.3)',
    '--stage': mixC(db, B, 0.25), '--grass': mixC(p.terrain, db, 0.72), '--grid': 'rgba(255,255,255,.06)', '--grid-major': 'rgba(255,255,255,.14)',
    '--wall': mixC(p.bg, W, 0.2), '--paper': mixC(db, p.accent2, 0.2), '--paper-line': 'rgba(255,255,255,.12)', '--paper-ink': p.bg, '--margin': 'rgba(230,110,100,.45)',
    '--roof': mixC(p.roof, W, 0.1), '--sky1': mixC(db, ac, 0.25), '--sky2': mixC(db, B, 0.1)
  };
}
const cssBlock = o => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');

function themeState() { if (!S.theme) S.theme = { id: 'foret', mode: 'auto' }; return S.theme; }
function isDark() {
  const m = themeState().mode;
  return m === 'dark' || (m === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}
function paletteOf(id) { return PALETTES.find(p => p.id === id) || PALETTES[0]; }

function applyTheme() {
  const t = themeState(), p = paletteOf(t.id);
  let st = $('#themeStyle');
  if (!st) { st = document.createElement('style'); st.id = 'themeStyle'; document.head.appendChild(st); }
  const L = cssBlock(themeVars(p, false)), D = cssBlock(themeVars(p, true));
  st.textContent = `:root{${L}}@media (prefers-color-scheme:dark){:root:not([data-mode="light"]){${D}}}:root[data-mode="dark"]{${D}}:root[data-mode="light"]{${L}}`;
  if (t.mode === 'auto') document.documentElement.removeAttribute('data-mode'); else document.documentElement.setAttribute('data-mode', t.mode);
  document.documentElement.style.colorScheme = t.mode === 'auto' ? 'light dark' : t.mode;
}

/* ----- page ----- */
function paletteCard(p, current) {
  const v = themeVars(p, isDark()), on = p.id === current;
  const room = v['--panel'], wall = v['--wall'];
  return `<div class="pcard ${on ? 'on' : ''}" role="button" tabindex="0" data-pid="${p.id}" aria-pressed="${on}" aria-label="Palette ${esc(p.name)}">
    <div class="pmock" style="background:${v['--bg']};border-color:${v['--line']}">
      <div class="pbar" style="background:${v['--accent']};color:${v['--accent-ink']}"><span>Mon Chantier</span><span style="opacity:.8">Plan · Matériels</span></div>
      <div class="pbody"><svg viewBox="0 0 160 84" width="100%" style="display:block;border-radius:5px"><rect width="160" height="84" fill="${v['--grass']}"/>
        <rect x="38" y="20" width="52" height="40" fill="${room}" stroke="${wall}" stroke-width="2.5"/>
        <rect x="90" y="20" width="30" height="40" fill="${v['--accent2']}" fill-opacity=".6" stroke="${wall}" stroke-width="2.5"/>
        <rect x="38" y="20" width="82" height="40" fill="none" stroke="${v['--roof']}" stroke-width="1.6" stroke-dasharray="5 3"/>
        <circle cx="20" cy="22" r="9" fill="#4f8f58" fill-opacity=".8"/><circle cx="140" cy="68" r="10" fill="#4f8f58" fill-opacity=".8"/></svg>
        <div class="pbtns"><span style="background:${v['--accent']};color:${v['--accent-ink']}">Sélection</span><span style="background:${v['--accent2']};color:${lumC(v['--accent2']) > 0.4 ? '#1d1d1d' : '#fff'}">Ajouter</span></div></div>
    </div>
    <div class="pname"><b>${esc(p.name)}</b>${on ? '<em>Utilisée</em>' : ''}</div>
    <div class="pmood">${esc(p.mood)}</div>
    <div class="psw">${[p.accent, p.accent2, p.bg, p.terrain, p.ink].map(c => `<span style="background:${c}" title="${c}"></span>`).join('')}</div></div>`;
}
function renderTheme() {
  const t = themeState(), page = $('#page-couleurs');
  const modes = [['auto', 'Automatique', 'suit l\'appareil'], ['light', 'Clair', ''], ['dark', 'Sombre', '']];
  page.innerHTML = `<h1 class="page-title">Couleurs</h1>
    <p class="page-sub">Choisissez l'ambiance de l'application. Le changement est immédiat : en-tête, boutons, plan 2D, vue 3D et bloc-notes. Il est enregistré avec vos données.</p>
    <div class="card set"><div class="f" style="min-width:0"><span>Mode d'affichage</span>
      <div class="modes" role="radiogroup" aria-label="Mode d'affichage">${modes.map(([m, l, h]) => `<button class="btn ${t.mode === m ? 'primary' : ''}" role="radio" aria-checked="${t.mode === m}" data-mode="${m}">${l}${h ? ` <small style="font-weight:400;opacity:.8">(${h})</small>` : ''}</button>`).join('')}</div></div>
      <span class="note" style="margin:0;flex:1;min-width:220px">Palette actuelle : <b>${esc(paletteOf(t.id).name)}</b>. Cliquez une carte ci-dessous pour en changer.</span></div>
    <div class="pgrid">${PALETTES.map(p => paletteCard(p, t.id)).join('')}</div>`;
}
function initTheme() {
  const page = $('#page-couleurs');
  const pick = el => {
    const card = el.closest('[data-pid]'); if (card) {
      const t = themeState(); t.id = card.dataset.pid; applyTheme(); save(); renderTheme(); toast('Palette : ' + paletteOf(t.id).name); return true;
    }
    const m = el.closest('[data-mode]'); if (m) { themeState().mode = m.dataset.mode; applyTheme(); save(); renderTheme(); return true; }
    return false;
  };
  page.addEventListener('click', ev => pick(ev.target));
  page.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-pid]')) { ev.preventDefault(); pick(ev.target); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (S.page === 'couleurs') renderTheme(); });
}
