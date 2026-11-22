'use strict';
/* ===== Compte et synchronisation avec Supabase =====
   L'application reste utilisable hors ligne : les données sont d'abord dans le navigateur.
   Une fois connecté, les plans et les notes sont copiés dans la base Supabase et retrouvés sur tous vos appareils.
   La clé ci-dessous est une clé « publiable » : elle est faite pour être publique. La sécurité vient des règles
   de la base (chaque ligne n'est lisible et modifiable que par son propriétaire). */
const CLOUD_URL = 'https://tdpjtrzhmyngifhuheaj.supabase.co';
const CLOUD_KEY = 'sb_publishable_XQME9tOZ3D2H7v3bJZduyw_fUK2uJ2H';
const CKEY = 'mon-chantier-cloud';
const Cloud = { st: null, status: 'off', msg: '', busy: false, recovery: false, pushT: null, again: false };

function cloudLoad() {
  let s = null; try { s = JSON.parse(localStorage.getItem(CKEY)); } catch (e) { /* vide */ }
  s = s || {}; s.meta = s.meta || {}; s.meta.plans = s.meta.plans || {}; s.meta.notes = s.meta.notes || {}; s.set = s.set || {}; return s;
}
function cloudSave() { try { localStorage.setItem(CKEY, JSON.stringify(Cloud.st)); } catch (e) { /* ignoré */ } }
const newId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
const djb = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };

/* ---------- requêtes ---------- */
async function http(method, path, o = {}) {
  const h = { apikey: CLOUD_KEY, 'Content-Type': 'application/json' };
  if (o.auth !== false && Cloud.st.tok) { if (o.forceRefresh) Cloud.st.tok.exp = 0; await ensureToken(); h.Authorization = 'Bearer ' + Cloud.st.tok.access; }
  if (o.token) h.Authorization = 'Bearer ' + o.token;
  if (o.prefer) h.Prefer = o.prefer;
  let r;
  try { r = await fetch(CLOUD_URL + path, { method, headers: h, body: o.body === undefined ? undefined : JSON.stringify(o.body) }); }
  catch (e) { const err = new Error('Pas de connexion internet.'); err.offline = true; throw err; }
  const txt = await r.text(); let js = null; try { js = txt ? JSON.parse(txt) : null; } catch (e) { /* texte */ }
  if (!r.ok) {
    if (r.status === 401 && o.auth !== false && !o.token && !o.retried && Cloud.st.tok) return http(method, path, { ...o, retried: true, forceRefresh: true });   // jeton refusé : on tente un renouvellement
    const raw = (js && (js.msg || js.message || js.error_description || js.error)) || ('Erreur ' + r.status);
    const err = new Error(friendly(raw, js && js.error_code)); err.status = r.status; throw err;
  }
  return js;
}
function friendly(m, code) {
  const s = String(m).toLowerCase();
  if (code === 'invalid_credentials' || s.includes('invalid login')) return 'Email ou mot de passe incorrect.';
  if (code === 'email_not_confirmed' || s.includes('not confirmed')) return "Email pas encore confirmé : ouvrez le message reçu et cliquez sur le lien.";
  if (code === 'user_already_exists' || s.includes('already registered')) return 'Un compte existe déjà avec cet email : choisissez « Se connecter ».';
  if (code === 'weak_password' || s.includes('password should')) return 'Mot de passe trop faible : au moins 8 caractères, avec lettres et chiffres.';
  if (code === 'over_email_send_rate_limit' || s.includes('rate limit')) return "Trop d'essais. Réessayez dans quelques minutes.";
  if (s.includes('email address') && s.includes('invalid')) return 'Adresse email non valide.';
  if (s.includes('refresh token') || s.includes('jwt') || s.includes('session')) return 'Session expirée : reconnectez-vous.';
  return String(m);
}
function setSession(js) {
  Cloud.st.tok = { access: js.access_token, refresh: js.refresh_token, exp: js.expires_at || Math.floor(Date.now() / 1000) + (js.expires_in || 3600) };
  if (js.user) Cloud.st.user = { id: js.user.id, email: js.user.email };
  cloudSave();
}
let refreshing = null;
async function ensureToken() {
  const t = Cloud.st.tok; if (!t) throw new Error('Non connecté.');
  if (t.exp - Date.now() / 1000 > 60) return;
  if (!refreshing) refreshing = (async () => {
    try { const js = await http('POST', '/auth/v1/token?grant_type=refresh_token', { auth: false, body: { refresh_token: t.refresh } }); setSession(js); }
    catch (e) { if (!e.offline) { Cloud.st.tok = null; cloudSave(); setStatus('off'); } throw e; }
    finally { refreshing = null; }
  })();
  await refreshing;
}

/* ---------- compte ---------- */
Cloud.signIn = async (email, pw) => {
  const js = await http('POST', '/auth/v1/token?grant_type=password', { auth: false, body: { email, password: pw } });
  setSession(js); await Cloud.sync();
};
Cloud.signUp = async (email, pw) => {
  const js = await http('POST', '/auth/v1/signup', { auth: false, body: { email, password: pw } });
  if (js && js.access_token) { setSession(js); await Cloud.sync(); return 'connecte'; }
  return 'confirmer';
};
Cloud.reset = email => http('POST', '/auth/v1/recover', { auth: false, body: { email } });
Cloud.newPassword = async pw => { await http('PUT', '/auth/v1/user', { body: { password: pw } }); Cloud.recovery = false; };
Cloud.signOut = async () => {
  try { if (Cloud.st.tok) await http('POST', '/auth/v1/logout', {}); } catch (e) { /* on se déconnecte quand même */ }
  Cloud.st.tok = null; Cloud.st.user = null; cloudSave(); setStatus('off');
};
/* Retour d'un lien reçu par email (confirmation du compte, mot de passe oublié) */
Cloud.fromHash = async () => {
  const h = location.hash.replace(/^#/, ''); if (!h.includes('access_token=') && !h.includes('error_description=')) return false;
  const p = new URLSearchParams(h);
  history.replaceState(null, '', location.pathname + location.search + '#compte');
  if (p.get('error_description')) { toast(friendly(p.get('error_description').replace(/\+/g, ' '), p.get('error_code'))); return true; }
  try {
    const user = await http('GET', '/auth/v1/user', { token: p.get('access_token'), auth: false });
    setSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: +p.get('expires_in') || 3600, user });
    if (p.get('type') === 'recovery') Cloud.recovery = true;
    else Cloud.sync();
  } catch (e) { toast(e.message); }
  return true;
};

/* ---------- état affiché ---------- */
function setStatus(s, msg) { Cloud.status = s; Cloud.msg = msg || ''; renderBadge(); if (S && S.page === 'compte') renderCompte(); }
function renderBadge() {
  const el = $('#cloudBadge'); if (!el) return;
  const t = { off: 'Non connecté', syncing: 'Synchronisation…', ok: 'Synchronisé', error: 'Erreur de synchro' }[Cloud.status];
  el.className = 'cloud ' + Cloud.status; el.textContent = t; el.title = Cloud.msg || (Cloud.st.user ? 'Connecté : ' + Cloud.st.user.email : 'Cliquez pour vous connecter');
}

/* ---------- repères de modification ---------- */
const planPayload = b => ({ name: b.name, tpl: b.tpl, tw: b.tw, td: b.td, elements: b.elements, steps: b.steps, materials: b.materials });
const planHash = b => djb(JSON.stringify(planPayload(b)));
const cidOfBuilding = id => { const b = S.buildings.find(x => x.id === id); return b ? b.cid || null : null; };
const notePayload = n => ({ title: n.title, body: n.body, color: n.color, plan: cidOfBuilding(n.bld), created: n.created });
const noteHash = n => djb(JSON.stringify(notePayload(n)));
const settingsData = () => ({ reserve: S.reserve, target: S.target, theme: (S.theme || {}).id });
const settingsHash = () => djb(JSON.stringify(settingsData()));

/* Donne un identifiant cloud à chaque plan et note, et date chaque modification locale */
Cloud.stamp = () => {
  if (!S || !(Cloud.st.user || Cloud.st.uid)) return;
  const now = Date.now();
  const one = (kind, list, hash) => list.forEach(r => {
    if (!r.cid) r.cid = newId();
    const m = Cloud.st.meta[kind], e = m[r.cid] || (m[r.cid] = {}), h = hash(r);
    if (e.lh !== h) { r.u = now; e.lh = h; } if (!r.u) r.u = now;
  });
  one('plans', S.buildings, planHash); one('notes', S.notes, noteHash);
  const h = settingsHash(); if (Cloud.st.set.lh !== h) { S.setU = now; Cloud.st.set.lh = h; } if (!S.setU) S.setU = now;
  cloudSave();
};
Cloud.afterSave = () => {
  Cloud.stamp();
  if (Cloud.st.tok) { clearTimeout(Cloud.pushT); Cloud.pushT = setTimeout(() => Cloud.sync(), 2500); }
};

/* ---------- synchronisation ---------- */
const MK = {
  plans: {
    table: 'plans',
    hash: planHash,
    row: b => ({ id: b.cid, user_id: Cloud.st.user.id, name: b.name, kind: b.tpl || 'vide', data: { tpl: b.tpl, tw: b.tw, td: b.td, elements: b.elements, steps: b.steps, materials: b.materials }, deleted: false, updated_at: new Date(b.u).toISOString() }),
    fromRow: (r, l) => {
      const d = r.data || {}, b = l || { id: r.id };
      Object.assign(b, { cid: r.id, name: r.name || 'Bâtiment', tpl: d.tpl || r.kind || 'vide', tw: d.tw || 30, td: d.td || 25, elements: d.elements || [], steps: d.steps || [], materials: d.materials || [], u: Date.parse(r.updated_at) });
      return b;
    },
    remove: l => { const i = S.buildings.indexOf(l); if (i >= 0) S.buildings.splice(i, 1); }
  },
  notes: {
    table: 'notes',
    hash: noteHash,
    row: n => ({ id: n.cid, user_id: Cloud.st.user.id, title: n.title || '', content: n.body || '', plan_id: cidOfBuilding(n.bld), color: n.color || '#e0b43a', created_at: new Date(n.created || n.u).toISOString(), deleted: false, updated_at: new Date(n.u).toISOString() }),
    fromRow: (r, l) => {
      const n = l || { id: uid() }, b = S.buildings.find(x => x.cid && x.cid === r.plan_id);
      Object.assign(n, { cid: r.id, title: r.title || '', body: r.content || '', color: r.color || '#e0b43a', bld: b ? b.id : '', created: Date.parse(r.created_at) || Date.now(), updated: Date.parse(r.updated_at), u: Date.parse(r.updated_at) });
      return n;
    },
    remove: l => { const i = S.notes.indexOf(l); if (i >= 0) S.notes.splice(i, 1); }
  }
};
async function syncKind(kind, list, cloudRows) {
  const mk = MK[kind], meta = Cloud.st.meta[kind], now = Date.now();
  const cloud = new Map(cloudRows.map(r => [r.id, { deleted: r.deleted, ru: Date.parse(r.updated_at) }]));
  const byCid = new Map(list.map(r => [r.cid, r])), pull = [], push = [], out = { pulled: 0, pushed: 0, removed: 0 };
  const wasSynced = id => meta[id] && meta[id].sh !== undefined;
  for (const [id, c] of cloud) {
    const l = byCid.get(id);
    if (c.deleted) { if (l) { if (l.u <= c.ru) { mk.remove(l); delete meta[id]; out.removed++; } else push.push(l); } continue; }
    if (!l) { if (!wasSynced(id)) pull.push(id); continue; }
    if (c.ru > l.u) pull.push(id);
    else if (l.u > c.ru && (!wasSynced(id) || meta[id].sh !== mk.hash(l))) push.push(l);
  }
  for (const l of list) if (!cloud.has(l.cid)) push.push(l);
  const tomb = Object.keys(meta).filter(id => wasSynced(id) && !byCid.has(id) && cloud.has(id) && !cloud.get(id).deleted);
  for (let i = 0; i < pull.length; i += 25) {
    const rows = await http('GET', `/rest/v1/${mk.table}?id=in.(${pull.slice(i, i + 25).join(',')})&select=*`);
    for (const r of rows) { const l = byCid.get(r.id), rec = mk.fromRow(r, l); if (!l) list.push(rec); const h = mk.hash(rec); meta[r.id] = { sh: h, lh: h, su: rec.u }; out.pulled++; }
  }
  for (let i = 0; i < push.length; i += 15) {
    const part = push.slice(i, i + 15);
    await http('POST', `/rest/v1/${mk.table}?on_conflict=id`, { body: part.map(mk.row), prefer: 'resolution=merge-duplicates,return=minimal' });
    part.forEach(l => { const h = mk.hash(l); meta[l.cid] = { sh: h, lh: h, su: l.u }; out.pushed++; });
  }
  for (const id of tomb) { await http('PATCH', `/rest/v1/${mk.table}?id=eq.${id}`, { body: { deleted: true, updated_at: new Date(now).toISOString() }, prefer: 'return=minimal' }); delete meta[id]; out.pushed++; }
  return out;
}
async function syncSettings() {
  const st = Cloud.st, rows = await http('GET', '/rest/v1/app_settings?select=data,updated_at'), c = rows[0], ru = c ? Date.parse(c.updated_at) : 0, h = settingsHash();
  if (c && ru > (S.setU || 0)) {
    const d = c.data || {}; if (d.reserve !== undefined) S.reserve = d.reserve; if (d.target !== undefined) S.target = d.target;
    if (d.theme && S.theme) S.theme.id = d.theme;
    S.setU = ru; const h2 = settingsHash(); st.set = { lh: h2, sh: h2 }; applyTheme(); return true;
  }
  if (!c || ((S.setU || 0) > ru && st.set.sh !== h)) {
    await http('POST', '/rest/v1/app_settings?on_conflict=user_id', { body: [{ user_id: st.user.id, data: settingsData(), updated_at: new Date(S.setU || Date.now()).toISOString() }], prefer: 'resolution=merge-duplicates,return=minimal' });
    st.set.sh = h;
  }
  return false;
}
function askFirstSync(np, nn) {
  return new Promise(res => {
    const dlg = $('#dlg');
    dlg.innerHTML = `<form class="dlg" method="dialog"><h2>Des données existent déjà dans votre compte</h2>
      <p class="note" style="margin:6px 0 0">Le cloud contient ${np} plan${np > 1 ? 's' : ''} et ${nn} note${nn > 1 ? 's' : ''}. Cet appareil a aussi ses propres données (celles de départ, si vous venez de l'ouvrir pour la première fois).</p>
      <div class="tpls"><label class="tpl"><input type="radio" name="c" value="cloud" checked><b>Reprendre les données du compte</b><span>Cet appareil est remplacé par ce qui est dans le cloud. Choix habituel sur un téléphone neuf.</span></label>
      <label class="tpl"><input type="radio" name="c" value="merge"><b>Garder les deux</b><span>Les plans et notes de cet appareil sont ajoutés à ceux du compte.</span></label></div>
      <div class="row"><button type="button" class="btn" data-x>Annuler</button><button class="btn primary" value="ok">Continuer</button></div></form>`;
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    dlg.showModal();
    dlg.querySelector('[data-x]').addEventListener('click', () => { dlg.close(); fin('cancel'); });
    dlg.addEventListener('close', () => fin('cancel'), { once: true });
    dlg.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); const v = new FormData(ev.target).get('c'); fin(v); dlg.close(); });
  });
}
Cloud.sync = async function () {
  if (!Cloud.st.tok) return;
  if (Cloud.busy) { Cloud.again = true; return; }
  Cloud.busy = true; setStatus('syncing');
  try {
    if (typeof flushSave === 'function') flushSave();
    const uid = Cloud.st.user.id;
    if (Cloud.st.uid && Cloud.st.uid !== uid) {                               // un autre compte : on repart de zéro
      S.buildings.forEach(b => { delete b.cid; delete b.u; }); S.notes.forEach(n => { delete n.cid; delete n.u; });
      Cloud.st.meta = { plans: {}, notes: {} }; Cloud.st.set = {}; Cloud.st.synced = false;
    }
    Cloud.st.uid = uid; Cloud.stamp();
    const [cp, cn] = await Promise.all([http('GET', '/rest/v1/plans?select=id,updated_at,deleted'), http('GET', '/rest/v1/notes?select=id,updated_at,deleted')]);
    let changed = false;
    if (!Cloud.st.synced) {
      const np = cp.filter(r => !r.deleted).length, nn = cn.filter(r => !r.deleted).length;
      if (np + nn > 0) {
        const choice = await askFirstSync(np, nn);
        if (choice === 'cancel') { await Cloud.signOut(); setStatus('off'); return; }
        if (choice === 'cloud') { S.buildings.length = 0; S.notes.length = 0; Cloud.st.meta = { plans: {}, notes: {} }; S.setU = 0; Cloud.st.set = {}; changed = true; }
        else S.setU = 0;
      }
    }
    const a = await syncKind('plans', S.buildings, cp);
    const b = await syncKind('notes', S.notes, cn);
    const c = await syncSettings();
    changed = changed || a.pulled || a.removed || b.pulled || b.removed || c;
    Cloud.st.synced = true; Cloud.st.last = Date.now(); cloudSave();
    if (changed) afterPull();
    setStatus('ok');
  } catch (e) {
    if (e.offline) setStatus('error', 'Hors ligne : la synchronisation reprendra dès que la connexion revient.');
    else setStatus(Cloud.st.tok ? 'error' : 'off', e.message);
  } finally {
    Cloud.busy = false;
    if (Cloud.again) { Cloud.again = false; setTimeout(() => Cloud.sync(), 300); }
  }
};
function afterPull() {
  if (!S.buildings.length) S.buildings.push(makeBuilding('vide', 'Nouveau bâtiment'));
  if (!S.buildings.some(b => b.id === S.cur)) S.cur = S.buildings[0].id;
  if (!S.notes.some(n => n.id === S.noteId)) S.noteId = S.notes.length ? S.notes[0].id : null;
  Plan.sel = null; Cloud.stamp(); if (typeof saveNow === 'function') saveNow();
  renderBar(); if (typeof refreshPage === 'function') refreshPage(); if (S.page === 'notes') renderNotes(); if (S.page === 'budget') renderBudget(); if (S.page === 'couleurs') renderTheme();
}

/* ---------- page « Compte » ---------- */
function ago(t) { if (!t) return 'jamais'; const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "à l'instant" : s < 3600 ? `il y a ${Math.round(s / 60)} min` : new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
function renderCompte() {
  const page = $('#page-compte'); if (!page) return;
  const u = Cloud.st.user, logged = !!Cloud.st.tok;
  const err = Cloud.status === 'error' || (Cloud.status === 'off' && Cloud.msg) ? `<p class="msg err" role="alert">${esc(Cloud.msg)}</p>` : '';
  let body;
  if (Cloud.recovery && logged) {
    body = `<form class="card pad acc" id="accNew"><h2>Choisissez un nouveau mot de passe</h2><label class="f">Nouveau mot de passe<input name="pw" type="password" autocomplete="new-password" minlength="8" required></label><div class="btnrow"><button class="btn primary">Enregistrer</button></div></form>`;
  } else if (logged) {
    body = `<div class="card pad acc"><h2>Connecté</h2><p class="who">${esc(u ? u.email : '')}</p>
      <div class="stat"><span>État</span><b>${{ ok: 'Synchronisé', syncing: 'Synchronisation en cours…', error: 'Erreur' }[Cloud.status] || '—'}</b></div>
      <div class="stat"><span>Dernière synchronisation</span><b>${ago(Cloud.st.last)}</b></div>
      <div class="stat"><span>Plans et notes sur cet appareil</span><b>${S.buildings.length} plan${S.buildings.length > 1 ? 's' : ''} · ${S.notes.length} note${S.notes.length > 1 ? 's' : ''}</b></div>
      ${err}<div class="btnrow"><button class="btn primary" data-a="sync">Synchroniser maintenant</button><button class="btn" data-a="out">Se déconnecter</button></div>
      <p class="note">Vos plans, matériels, notes et réglages sont copiés dans votre compte à chaque modification, et mis à jour sur vos autres appareils quand vous les ouvrez. Se déconnecter garde les données sur cet appareil.</p></div>`;
  } else {
    body = `<form class="card pad acc" id="accForm"><h2>Se connecter pour garder vos données dans le cloud</h2>
      <p class="note" style="margin:0 0 12px">Sans compte, tout reste uniquement dans ce navigateur. Avec un compte, vos plans et vos notes se retrouvent sur votre téléphone et votre ordinateur.</p>
      <div class="fields"><label class="f wide">Email<input name="email" type="email" autocomplete="email" required placeholder="vous@exemple.com"></label>
      <label class="f wide">Mot de passe<input name="pw" type="password" autocomplete="current-password" minlength="8" required placeholder="8 caractères minimum"></label></div>
      ${err}<div class="btnrow"><button class="btn primary" data-a="in">Se connecter</button><button class="btn" data-a="up">Créer un compte</button><button class="btn ghost" type="button" data-a="forgot">Mot de passe oublié</button></div></form>`;
  }
  page.innerHTML = `<h1 class="page-title">Compte et synchronisation</h1><p class="page-sub">Retrouvez vos plans et vos notes sur tous vos appareils.</p>${body}`;
}
function initCompte() {
  const page = $('#page-compte');
  page.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-a]'); if (!a) return; const f = $('#accForm'); const act = a.dataset.a;
    if (act === 'sync') return Cloud.sync();
    if (act === 'out') { await Cloud.signOut(); return toast('Déconnecté. Vos données restent sur cet appareil.'); }
    if (!f) return; ev.preventDefault();
    const email = f.email.value.trim(), pw = f.pw.value;
    if (act === 'forgot') { if (!email) return toast("Entrez d'abord votre email."); try { await Cloud.reset(email); toast('Un email vient de vous être envoyé.'); } catch (e) { toast(e.message); } return; }
    if (!f.reportValidity()) return;
    Cloud.msg = ''; a.disabled = true;
    try {
      if (act === 'in') { await Cloud.signIn(email, pw); toast('Connecté.'); }
      else { const r = await Cloud.signUp(email, pw); toast(r === 'connecte' ? 'Compte créé et connecté.' : 'Compte créé : ouvrez l\'email reçu et cliquez sur le lien, puis revenez vous connecter.'); }
    } catch (e) { Cloud.msg = e.message; setStatus('off', e.message); }
    a.disabled = false; renderCompte();
  });
  page.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (ev.target.id === 'accNew') { try { await Cloud.newPassword(ev.target.pw.value); toast('Mot de passe changé.'); Cloud.sync(); } catch (e) { toast(e.message); } renderCompte(); }
  });
  window.addEventListener('online', () => Cloud.sync());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Cloud.st.tok && Date.now() - (Cloud.st.last || 0) > 20000) Cloud.sync(); });
  setInterval(() => { if (!document.hidden && Cloud.st.tok) Cloud.sync(); }, 90000);
}
Cloud.init = async () => {
  Cloud.st = cloudLoad();
  initCompte();
  const fromLink = await Cloud.fromHash();
  setStatus(Cloud.st.tok ? 'ok' : 'off');
  if (Cloud.st.tok && !fromLink) Cloud.sync();
  return fromLink;
};
