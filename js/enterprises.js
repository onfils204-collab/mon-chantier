'use strict';
/* ===== Entreprises : pièces, machines à glisser sur le plan, matériels, étapes ===== */
Object.assign(KINDS, {
  fabrication: ['Zone de fabrication', '#d9d2e4'], sechage: ['Zone de séchage', '#ebe0b9'], conditionnement: ['Conditionnement et emballage', '#d5e1ee'],
  stockmp: ['Stockage matières premières', '#ddd5c4'], stockfini: ['Stockage produits finis', '#d3ddd0'], labo: ['Laboratoire / contrôle qualité', '#d8ebf0'],
  reception: ['Réception des déchets', '#e6dcc8']
});

/* Quantités de la savonnerie = atelier + matériaux de savonnerie. Les machines sont à 0 : posez-les sur le plan (ou mettez 1 ou plus) pour les retenir. */
QTY.savon = Object.assign({}, QTY.atelier, {
  groupe: 0, res: 3, carr: 0, pein: 0,
  carrind: 200, murlav: 150, peinh: 8, cani: 60, evac: 1, disj: 12, priseind: 15, ventind: 4,
  sCuve: 0, sReact: 0, sMel: 0, sChauf: 0, sBroy: 0, sRaff: 0, sBoud: 0, sDec: 0, sPresse: 0, sEstamp: 0, sMoule: 0, sTable: 0, sClaie: 0, sPompe: 0, sChar: 0,
  lCuve: 0, lAgit: 0, lPrep: 0, lRes: 0, lPompe: 0, lFilt: 0, lRempl: 0, lBouch: 0, lEtiq: 0, lTuy: 0, lVisc: 0, lPh: 0,
  cEmb: 0, cSoud: 0, cEtiqA: 0, cImp: 0, cMarq: 0, cRempl: 0, cCaps: 0, cScel: 0, cConv: 0, cBal: 0,
  eGroupe: 0, eComp: 0, eChaud: 0, eChCuve: 0, ePompe: 0, eRes: 0, eTraite: 0, eVent: 0, eTrans: 0, eChar: 0, eEtag: 0, ePal: 0, eDouche: 0, eLave: 0
});
STEP_LISTS.savon = [...STEP_LISTS.atelier.slice(0, -1), 'savon', 'finale'];
LAYOUTS.savon = () => ({
  tw: 45, td: 36, els: lay({
    rooms: [['Fabrication', 'fabrication', 10, 8, 14, 10, 4.5], ['Séchage', 'sechage', 24, 8, 8, 10, 3.5], ['Matières premières', 'stockmp', 32, 8, 7, 10, 3.5],
      ['Conditionnement', 'conditionnement', 10, 18, 12, 8, 3.5], ['Produits finis', 'stockfini', 22, 18, 10, 8, 3.5], ['Laboratoire', 'labo', 32, 18, 7, 8, 3],
      ['Bureau', 'bureau', 10, 26, 6, 5], ['Vestiaire / sanitaires', 'vestiaire', 16, 26, 6, 5]],
    opens: [[0, 'gate', 'W', 5, 3.5], [0, 'door', 'E', 5, 1.2], [1, 'door', 'E', 5, 1.2], [2, 'gate', 'N', 3.5, 3], [3, 'door', 'N', 5, 1.2], [4, 'gate', 'S', 5, 3],
      [5, 'door', 'W', 4, 0.9], [6, 'door', 'N', 3, 1], [7, 'door', 'N', 3, 1], [0, 'window', 'N', 4, 2], [0, 'window', 'N', 10, 2]],
    roofs: [[10, 8, 29, 10, 'pente', 4.5], [10, 18, 29, 8, 'pente', 3.5], [10, 26, 12, 5, 'plat', 3]],
    paths: [[0, 25, 10, 6, 'Aire de manœuvre']], trees: [[4, 4, 2, 5, 'Arbre'], [42, 32, 2, 5, 'Arbre']], fences: fenceRect(2, 2, 43, 34)
  })
});

/* Encombrement approximatif des machines : [largeur, profondeur, hauteur (m), rond ?] */
const EQ = {
  sCuve: [1.2, 1.2, 1.5, 1], sReact: [1.8, 1.8, 2.5, 1], sMel: [1.5, 1.2, 1.5], sChauf: [1.2, 1.2, 1.4, 1], sBroy: [1.5, 1, 1.3], sRaff: [2, 1, 1.3], sBoud: [2.5, 1, 1.4],
  sDec: [2, 1, 1.2], sPresse: [1.4, 1, 1.5], sEstamp: [1.2, 1, 1.4], sMoule: [0.5, 0.5, 0.15], sTable: [2, 0.8, 0.9], sClaie: [1.5, 0.6, 1.8], sPompe: [0.6, 0.5, 0.6], sChar: [1, 0.6, 1],
  lCuve: [1.5, 1.5, 1.8, 1], lAgit: [0.6, 0.6, 2], lPrep: [1.2, 1.2, 1.5, 1], lRes: [1.8, 1.8, 2.2, 1], lPompe: [0.6, 0.5, 0.6], lFilt: [1, 0.6, 1.2], lRempl: [2.5, 1.2, 1.8],
  lBouch: [1.5, 1, 1.6], lEtiq: [1.8, 1, 1.5], lTuy: [2, 0.3, 0.3], lVisc: [0.4, 0.4, 0.4], lPh: [0.3, 0.3, 0.3],
  cEmb: [3, 1.2, 1.8], cSoud: [1, 0.6, 0.6], cEtiqA: [1.8, 1, 1.5], cImp: [0.6, 0.5, 0.4], cMarq: [0.8, 0.6, 0.8], cRempl: [2.5, 1.2, 1.8], cCaps: [1.5, 1, 1.6],
  cScel: [1.5, 1, 1.2], cConv: [4, 0.6, 0.9], cBal: [0.7, 0.6, 0.4],
  eGroupe: [2.5, 1.1, 1.6], eComp: [1, 0.7, 1.2], eChaud: [1.5, 1.2, 2], eChCuve: [0.8, 0.6, 0.8], ePompe: [0.7, 0.5, 0.6], eRes: [2, 2, 2.5, 1], eTraite: [1.5, 1, 1.8],
  eVent: [0.8, 0.8, 0.8], eTrans: [1.6, 0.6, 1.2], eChar: [1, 0.6, 1], eEtag: [2, 0.6, 2], ePal: [1.2, 0.8, 0.15], eDouche: [1, 1, 2.4], eLave: [0.5, 0.4, 1.2],
  bgTrem: [2, 2, 1.2], bgBroy: [2, 1.2, 1.5], bgMel: [1.8, 1.5, 1.8], bgPrep: [2, 2, 2, 1], bgTampon: [3, 3, 2.5, 1], bgPAlim: [0.8, 0.6, 0.7], bgTamis: [1.5, 1, 1.2],
  bgBal: [1.5, 1.5, 0.2], bgChar: [1, 0.6, 1], bgBac: [1.2, 1, 0.8],
  bgDig: [8, 8, 4.5, 1], bgAgit: [0.6, 0.6, 3], bgChauf: [1, 0.8, 1], bgPRec: [0.8, 0.6, 0.7], bgPTrans: [0.8, 0.6, 0.7], bgCapT: [0.3, 0.3, 0.4], bgCapP: [0.3, 0.3, 0.4],
  bgCapN: [0.3, 0.3, 0.6], bgPh: [0.3, 0.3, 0.3], bgCtrl: [1, 0.6, 1.8],
  bgH2S: [1, 1, 2, 1], bgSepH: [0.6, 0.6, 1], bgFiltP: [0.5, 0.5, 0.8], bgSech: [1, 0.8, 1.2], bgDebit: [0.4, 0.4, 0.4], bgMano: [0.2, 0.2, 0.3], bgRegP: [0.4, 0.4, 0.5],
  bgAnal: [0.8, 0.6, 1.2], bgVIso: [0.3, 0.3, 0.4], bgTuyG: [4, 0.2, 0.3],
  bgGaz: [6, 4, 3], bgMemb: [4, 3, 0.5], bgSoup: [0.3, 0.3, 0.6], bgFlamme: [0.4, 0.4, 0.6], bgFuite: [0.3, 0.3, 0.4], bgCompt: [0.5, 0.4, 0.5], bgTorch: [1, 1, 4, 1], bgDist: [4, 0.2, 0.3],
  bgGroupe: [3, 1.3, 1.8], bgBrul: [1.2, 0.8, 1], bgChaud: [1.8, 1.4, 2], bgTabC: [1, 0.5, 1.8], bgRecup: [1.2, 0.8, 1.2], bgRegE: [0.5, 0.4, 0.5],
  bgDCuve: [6, 6, 4, 1], bgDPompe: [0.8, 0.6, 0.7], bgSepS: [2.5, 1.2, 2], bgCompo: [6, 4, 0.4], bgFert: [3, 3, 2.5, 1], bgDrain: [4, 0.4, 0.2],
  sfCH4: [0.3, 0.3, 0.4], sfH2S: [0.3, 0.3, 0.4], sfArret: [0.3, 0.3, 0.5], sfFoudre: [0.3, 0.3, 6], sfAtex: [0.6, 0.4, 0.6], sfSurp: [0.3, 0.3, 0.5], sfSign: [0.5, 0.1, 2], sfSecours: [0.6, 0.4, 0.5],
  abre: [1.5, 0.5, 0.5], mang: [2, 0.5, 0.5], pond: [0.5, 0.5, 0.4], barr: [3, 0.2, 1.4], pompe: [0.6, 0.5, 0.6], res: [2, 2, 2.5, 1], forage: [1, 1, 3, 1], groupe: [2, 1, 1.4],
  etabli: [1.8, 0.8, 0.9], extinc: [0.3, 0.3, 0.6], extrac: [0.6, 0.6, 0.6], ventind: [0.8, 0.8, 0.8], bur: [1.4, 0.7, 0.75], chaise: [0.5, 0.5, 0.9],
  clim: [0.8, 0.3, 0.3], ens: [2, 0.2, 0.6], alarm: [0.3, 0.3, 0.3], ray: [2, 0.5, 2], compt: [2, 0.7, 1], banc: [1.5, 0.5, 0.8]
};
const EQ_COL = {
  'Machines : savon solide': '#8ea6b8', 'Machines : savon liquide': '#7fb0c7', 'Conditionnement et emballage': '#a79bc4', 'Équipements industriels': '#9aa89a',
  'Biogaz : préparation des déchets': '#a58e6e', 'Biogaz : production': '#6aa07f', 'Biogaz : traitement du gaz': '#6fa3b5', 'Biogaz : stockage du gaz': '#d6b24e',
  'Biogaz : utilisation du gaz': '#d98a4a', 'Biogaz : digestat': '#9a7a5a', 'Sécurité': '#c4553f', 'Équipements': '#9aa8a0', 'Plomberie & eau': '#7fa9b8', 'Jardin & plantations': '#a58e6e'
};
const eqColor = k => { const c = CAT_BY_KEY[k]; return (c && EQ_COL[c.c]) || '#9aa7b0'; };
const eqShort = k => CAT_BY_KEY[k].n.replace(/\s*\(.*?\)/g, '').trim();
const catKeys = cat => CATALOG.filter(x => x.c === cat && EQ[x.k]).map(x => x.k);

/* Ce que la palette propose pour chaque type d'entreprise : types de pièces (rooms) et groupes de machines (equip) */
const ENT = {
  vide: { rooms: null, equip: [] },
  maison: { rooms: ['salon', 'chambre', 'cuisine', 'sdb', 'wc', 'couloir', 'garage', 'bureau', 'autre'], equip: [['Équipements', ['res', 'pompe', 'groupe']]] },
  agri: {
    rooms: ['etable', 'poulailler', 'reserve', 'bureau', 'hangar', 'vestiaire', 'wc', 'technique', 'autre'],
    equip: [['Élevage et eau', ['abre', 'mang', 'pond', 'barr', 'pompe', 'res', 'forage']], ['Énergie et sécurité', ['groupe', 'extinc']]]
  },
  atelier: {
    rooms: ['atelier', 'reserve', 'bureau', 'vestiaire', 'wc', 'technique', 'hangar', 'autre'],
    equip: [['Équipements', ['etabli', 'groupe', 'extinc', 'extrac', 'ventind', 'bur', 'chaise', 'res']]]
  },
  savon: {
    rooms: ['fabrication', 'sechage', 'conditionnement', 'stockmp', 'stockfini', 'labo', 'technique', 'bureau', 'vestiaire', 'wc', 'hangar'],
    equip: [['Savon solide', catKeys('Machines : savon solide')], ['Savon liquide', catKeys('Machines : savon liquide')], ['Conditionnement et emballage', catKeys('Conditionnement et emballage')],
      ['Équipements industriels', catKeys('Équipements industriels')], ['Équipements généraux', ['etabli', 'bur', 'chaise', 'extinc', 'extrac', 'ventind']]]
  },
  biogaz: {
    rooms: ['reception', 'atelier', 'cuve', 'technique', 'reserve', 'bureau', 'vestiaire', 'wc'],
    equip: [['Préparation des déchets', catKeys('Biogaz : préparation des déchets')], ['Production du biogaz', catKeys('Biogaz : production')], ['Traitement du gaz', catKeys('Biogaz : traitement du gaz')],
      ['Stockage du gaz', catKeys('Biogaz : stockage du gaz')], ['Utilisation du gaz', catKeys('Biogaz : utilisation du gaz')], ['Digestat', catKeys('Biogaz : digestat')],
      ['Sécurité', catKeys('Sécurité')], ['Équipements généraux', ['bur', 'chaise', 'extinc']]]
  },
  commerce: { rooms: ['boutique', 'reserve', 'bureau', 'wc', 'couloir', 'autre'], equip: [['Aménagement', ['ray', 'compt', 'clim', 'ens', 'alarm', 'bur', 'chaise', 'extinc']]] },
  jardin: { rooms: ['autre'], equip: [['Jardin', ['banc', 'res', 'pompe']]] }
};

/* Lien plan → matériels : poser une machine sur le plan ajoute 1 à sa ligne de matériels, la supprimer retire 1 */
function equipCounts(els) { const m = {}; els.forEach(e => { if (e.t === 'equip' && e.k) m[e.k] = (m[e.k] || 0) + 1; }); return m; }
function syncEquip(b, before) {
  const now = equipCounts(b.elements); let changed = false;
  new Set([...Object.keys(before), ...Object.keys(now)]).forEach(k => {
    const d = (now[k] || 0) - (before[k] || 0); if (!d) return;
    let row = b.materials.find(m => m.k === k);
    if (!row) { const c = CAT_BY_KEY[k]; if (!c) return; row = { id: uid(), k, cat: c.c, name: c.n, unit: c.u, price: c.p, qty: 0, bought: false }; b.materials.push(row); }
    row.qty = Math.max(0, row.qty + d); changed = true;
  });
  if (changed) save();
  return changed;
}
