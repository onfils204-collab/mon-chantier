'use strict';
/* ===== Page Notes : un bloc-notes à papier ligné ===== */
const Notes = { q: '', bld: 'all' };
const NOTE_COLORS = ['#e0b43a', '#58a37a', '#d9674a', '#5b8fd0', '#9a76c8', '#8a8f88'];

const noteLabel = n => (n.title || '').trim() || (n.body || '').split('\n').find(l => l.trim()) || 'Sans titre';
const noteDate = t => new Date(t).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const wordCount = s => (s.trim().match(/\S+/g) || []).length;

function renderNotes() {
  const page = $('#page-notes');
  if (!S.notes.some(n => n.id === S.noteId)) S.noteId = S.notes.length ? S.notes[0].id : null;
  page.innerHTML = `<h1 class="page-title">Notes</h1>
    <p class="page-sub">Un bloc-notes pour vos idées, mesures et rappels. Tout s'enregistre pendant que vous écrivez.</p>
    <div class="notes-layout">
      <aside class="card nlist">
        <button class="btn primary" data-act="new">+ Nouvelle note</button>
        <input type="search" id="nQ" placeholder="Rechercher dans les notes…" value="${esc(Notes.q)}" aria-label="Rechercher">
        <select id="nB" aria-label="Filtrer par bâtiment"><option value="all">Toutes les notes</option><option value="">Générales</option>${S.buildings.map(b => `<option value="${b.id}" ${Notes.bld === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>
        <div id="nItems" style="display:flex;flex-direction:column;gap:8px"></div>
      </aside>
      <div id="nPad"></div>
    </div>`;
  $('#nB').value = Notes.bld;
  renderNoteList(); renderPad();
}

function renderNoteList() {
  const q = Notes.q.trim().toLowerCase();
  const list = S.notes.filter(n => (Notes.bld === 'all' || n.bld === Notes.bld) && (!q || (n.title + ' ' + n.body).toLowerCase().includes(q))).sort((a, b) => b.updated - a.updated);
  $('#nItems').innerHTML = list.map(n => {
    const bl = S.buildings.find(b => b.id === n.bld);
    const first = (n.body || '').split('\n').find(l => l.trim()) || '';
    return `<button class="nitem ${n.id === S.noteId ? 'on' : ''}" data-id="${n.id}" style="border-left-color:${n.color}"><b>${esc(noteLabel(n))}</b><span>${esc(bl ? bl.name + ' · ' : '')}${esc(first.slice(0, 60))}</span></button>`;
  }).join('') || '<div class="empty" style="padding:14px">Aucune note.</div>';
}

function renderPad() {
  const n = S.notes.find(x => x.id === S.noteId), box = $('#nPad');
  if (!n) { box.innerHTML = '<div class="card empty">Créez votre première note avec « + Nouvelle note ».</div>'; return; }
  box.innerHTML = `<div class="notepad">
    <div class="np-top"><input class="np-title" id="npTitle" value="${esc(n.title)}" placeholder="Titre de la note" maxlength="90" aria-label="Titre">
      <div class="colors" role="group" aria-label="Couleur">${NOTE_COLORS.map(c => `<button data-color="${c}" class="${c === n.color ? 'on' : ''}" style="background:${c}" aria-label="Couleur ${c}"></button>`).join('')}</div></div>
    <div class="np-meta"><span id="npDate">Modifiée le ${noteDate(n.updated)}</span>
      <label>Bâtiment : <select id="npBld"><option value="">Général</option>${S.buildings.map(b => `<option value="${b.id}" ${b.id === n.bld ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
      <span id="npCount">${wordCount(n.body)} mots</span></div>
    <textarea class="np-body" id="npBody" placeholder="Écrivez ici…" spellcheck="true" aria-label="Contenu de la note">${esc(n.body)}</textarea>
    <div class="np-tools"><button class="btn sm" data-ins="date">Insérer la date</button><button class="btn sm" data-ins="☐ ">☐ Case à cocher</button><button class="btn sm" data-ins="• ">• Puce</button>
      <span class="spacer"></span><button class="btn sm danger" data-act="del">Supprimer la note</button></div></div>`;
}

function touchNote(n) {
  n.updated = Date.now(); save();
  const d = $('#npDate'); if (d) d.textContent = 'Modifiée le ' + noteDate(n.updated);
  const c = $('#npCount'); if (c) c.textContent = wordCount(n.body) + ' mots';
}

function initNotes() {
  const page = $('#page-notes');
  page.addEventListener('click', ev => {
    const item = ev.target.closest('.nitem');
    if (item) { S.noteId = item.dataset.id; save(); renderNoteList(); return renderPad(); }
    const col = ev.target.closest('[data-color]');
    if (col) { const n = S.notes.find(x => x.id === S.noteId); n.color = col.dataset.color; touchNote(n); $$('.colors button').forEach(b => b.classList.toggle('on', b === col)); return renderNoteList(); }
    const ins = ev.target.closest('[data-ins]');
    if (ins) return insertText(ins.dataset.ins);
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'new') {
      const now = Date.now(), n = { id: uid(), title: '', body: '', color: NOTE_COLORS[S.notes.length % NOTE_COLORS.length], bld: Notes.bld !== 'all' ? Notes.bld : '', created: now, updated: now };
      S.notes.unshift(n); S.noteId = n.id; save(); renderNoteList(); renderPad(); $('#npTitle').focus();
    }
    if (a.dataset.act === 'del') {
      const n = S.notes.find(x => x.id === S.noteId);
      if (n && confirm(`Supprimer la note « ${noteLabel(n)} » ? Cette action est définitive.`)) {
        S.notes = S.notes.filter(x => x.id !== n.id); S.noteId = S.notes.length ? S.notes[0].id : null; save(); renderNoteList(); renderPad();
      }
    }
  });
  page.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'nQ') { Notes.q = t.value; return renderNoteList(); }
    const n = S.notes.find(x => x.id === S.noteId); if (!n) return;
    if (t.id === 'npTitle') { n.title = t.value; touchNote(n); renderNoteList(); }
    if (t.id === 'npBody') { n.body = t.value; touchNote(n); }
  });
  page.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'nB') { Notes.bld = t.value; return renderNoteList(); }
    if (t.id === 'npBld') { const n = S.notes.find(x => x.id === S.noteId); n.bld = t.value; touchNote(n); renderNoteList(); }
  });
  page.addEventListener('keydown', ev => {
    if (ev.target.id !== 'npBody') return;
    const ta = ev.target, n = S.notes.find(x => x.id === S.noteId), v = ta.value, s = ta.selectionStart;
    const ls = v.lastIndexOf('\n', s - 1) + 1, le = (v.indexOf('\n', s) + 1 || v.length + 1) - 1, line = v.slice(ls, le);
    const setBody = (text, caret) => { ta.value = text; ta.setSelectionRange(caret, caret); n.body = text; touchNote(n); };
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {            // coche / décoche
      ev.preventDefault();
      let nl = line;
      if (line.startsWith('☐ ')) nl = '☑ ' + line.slice(2); else if (line.startsWith('☑ ')) nl = '☐ ' + line.slice(2); else nl = '☐ ' + line;
      setBody(v.slice(0, ls) + nl + v.slice(le), s + (nl.length - line.length));
    } else if (ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey) {     // continue la liste
      const m = line.match(/^(☐ |☑ |• |- )/);
      if (m && s >= ls + m[1].length) {
        ev.preventDefault();
        if (line.trim() === m[1].trim()) setBody(v.slice(0, ls) + v.slice(le), ls);   // ligne vide : on quitte la liste
        else { const pre = m[1] === '☑ ' ? '☐ ' : m[1]; setBody(v.slice(0, s) + '\n' + pre + v.slice(s), s + 1 + pre.length); }
      }
    }
  });
}
function insertText(what) {
  const ta = $('#npBody'), n = S.notes.find(x => x.id === S.noteId); if (!ta || !n) return;
  const v = ta.value, s = ta.selectionStart; let text, caret;
  if (what === 'date') {
    const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    text = v.slice(0, s) + d + v.slice(ta.selectionEnd); caret = s + d.length;
  } else {
    const ls = v.lastIndexOf('\n', s - 1) + 1; text = v.slice(0, ls) + what + v.slice(ls); caret = s + what.length;
  }
  ta.value = text; ta.focus(); ta.setSelectionRange(caret, caret); n.body = text; touchNote(n);
}
