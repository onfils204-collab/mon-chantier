'use strict';
/* ===== Page Plan : géométrie, éditeur 2D, panneau, étapes ===== */
const WT = 0.2;           // épaisseur des murs (m)
const EPS = 0.05;
const RECTS = ['room', 'bed', 'pond', 'path', 'roof', 'equip'];
const Plan = { tab: '2d', tool: 'select', sel: null, roomKind: 'salon', snap: true, views: {}, hist: {}, drag: null, space: false };

/* ---------- Géométrie des murs ---------- */
function subtractIv(list, b0, b1) {
  const out = [];
  for (const [a0, a1] of list) {
    if (b1 <= a0 || b0 >= a1) { out.push([a0, a1]); continue; }
    if (b0 > a0) out.push([a0, b0]);
    if (b1 < a1) out.push([b1, a1]);
  }
  return out;
}
function openZ(kind, h, o) {
  if (kind === 'window') return [Math.min(0.9, h - 0.3), Math.min(2.1, h)];
  if (kind === 'gate') return [0, Math.min(3, h)];
  return [0, Math.min(2.1, h)];
}
function computeWalls(b) {
  const rooms = b.elements.filter(e => e.t === 'room');
  const segs = [];
  rooms.forEach(r => {
    segs.push({ axis: 'h', c: r.y, a0: r.x, a1: r.x + r.w, h: r.h, room: r.id });
    segs.push({ axis: 'h', c: r.y + r.d, a0: r.x, a1: r.x + r.w, h: r.h, room: r.id });
    segs.push({ axis: 'v', c: r.x, a0: r.y, a1: r.y + r.d, h: r.h, room: r.id });
    segs.push({ axis: 'v', c: r.x + r.w, a0: r.y, a1: r.y + r.d, h: r.h, room: r.id });
  });
  const ops = [];
  b.elements.filter(e => e.t === 'open').forEach(o => {
    const r = rooms.find(x => x.id === o.room); if (!r) return;
    const horiz = o.side === 'N' || o.side === 'S';
    const len = horiz ? r.w : r.d;
    const w = Math.min(o.w, len);
    const pos = clamp(o.pos, w / 2, len - w / 2);
    const c = o.side === 'N' ? r.y : o.side === 'S' ? r.y + r.d : o.side === 'W' ? r.x : r.x + r.w;
    const mid = (horiz ? r.x : r.y) + pos;
    ops.push({ o, room: r, axis: horiz ? 'h' : 'v', c, a0: mid - w / 2, a1: mid + w / 2, h: r.h });
  });
  const groups = [];
  segs.forEach(s => {
    let g = groups.find(g => g.axis === s.axis && Math.abs(g.c - s.c) < EPS);
    if (!g) { g = { axis: s.axis, c: s.c, items: [] }; groups.push(g); }
    g.items.push(s);
  });
  const pieces = [];
  groups.forEach(g => {
    const done = [];
    g.items.forEach(s => {
      let rem = [[s.a0, s.a1]];
      done.forEach(([d0, d1]) => { rem = subtractIv(rem, d0, d1); });
      rem.forEach(([a0, a1]) => {
        if (a1 - a0 > EPS) pieces.push({ axis: s.axis, c: g.c, a0, a1, h: s.h, room: s.room, e0: Math.abs(a0 - s.a0) < 1e-6, e1: Math.abs(a1 - s.a1) < 1e-6 });
      });
      done.push([s.a0, s.a1]);
    });
  });
  return { pieces, ops };
}
/* Découpe une pièce de mur en parties pleines et en ouvertures */
function wallParts(W) {
  return W.pieces.map(p => {
    const gaps = W.ops.filter(op => op.axis === p.axis && Math.abs(op.c - p.c) < EPS && op.a1 > p.a0 && op.a0 < p.a1)
      .map(op => ({ op, a0: Math.max(op.a0, p.a0), a1: Math.min(op.a1, p.a1) })).sort((a, b) => a.a0 - b.a0);
    const solids = []; let cur = p.a0;
    gaps.forEach(g => { if (g.a0 > cur + 1e-6) solids.push([cur, g.a0]); cur = Math.max(cur, g.a1); });
    if (cur < p.a1 - 1e-6) solids.push([cur, p.a1]);
    const ext = WT / 2;
    solids.forEach(s => {
      if (p.axis === 'h') { if (p.e0 && Math.abs(s[0] - p.a0) < 1e-6) s[0] -= ext; if (p.e1 && Math.abs(s[1] - p.a1) < 1e-6) s[1] += ext; }
    });
    return { p, solids, gaps };
  });
}
function roofRise(r) { return r.type === 'plat' ? 0 : clamp(Math.min(r.w, r.d) * 0.2, 0.7, 2.6); }
function roofArea(r) {
  const ov = 0.8;
  if (r.type === 'plat') return (r.w + ov) * (r.d + ov);
  const span = Math.min(r.w, r.d) + ov, len = Math.max(r.w, r.d) + ov, rise = roofRise(r);
  return 2 * Math.hypot(span / 2, rise) * len;
}
const NO_TILE = ['hangar', 'etable', 'poulailler', 'reserve', 'garage', 'atelier', 'cuve', 'technique'];
function stats(b) {
  const els = b.elements, rooms = els.filter(e => e.t === 'room');
  const W = computeWalls(b);
  let wallLen = 0, wallArea = 0, openArea = 0;
  W.pieces.forEach(p => { const L = p.a1 - p.a0; wallLen += L; wallArea += L * p.h; });
  W.ops.forEach(op => { const [z0, z1] = openZ(op.o.kind, op.h, op.o); openArea += (op.a1 - op.a0) * (z1 - z0); });
  const floor = rooms.reduce((s, r) => s + r.w * r.d, 0);
  const tile = rooms.filter(r => !NO_TILE.includes(r.kind)).reduce((s, r) => s + r.w * r.d, 0);
  const roofs = els.filter(e => e.t === 'roof').reduce((s, r) => s + roofArea(r), 0);
  const wallNet = Math.max(0, wallArea - openArea);
  return {
    rooms: rooms.length, floor, tile, wallLen, wallNet, roofs, terrain: b.tw * b.td,
    doors: els.filter(e => e.t === 'open' && e.kind === 'door').length,
    windows: els.filter(e => e.t === 'open' && e.kind === 'window').length,
    gates: els.filter(e => e.t === 'open' && e.kind === 'gate').length,
    trees: els.filter(e => e.t === 'tree').length, equips: els.filter(e => e.t === 'equip').length,
    parpaings: Math.round(wallNet * 10 * 1.05), tole: Math.ceil(roofs / 2.4 * 1.1)
  };
}
function applyQuantities(b) {
  const s = stats(b), done = [];
  const set = (keys, q, label) => {
    const row = b.materials.find(m => keys.includes(m.k) && (m.qty > 0 || keys.length === 1)) || b.materials.find(m => keys.includes(m.k));
    if (row && q > 0) { row.qty = q; done.push(`${label} : ${fmt(q)}`); }
  };
  set(['p15', 'p20'], s.parpaings, 'parpaings');
  set(['tond', 'tbac'], s.tole, 'tôles');
  set(['carr'], Math.round(s.tile), 'carrelage (m²)');
  save();
  return done;
}

/* ---------- Historique (annuler / rétablir) ---------- */
function histOf(b) { return Plan.hist[b.id] || (Plan.hist[b.id] = { u: [], r: [], key: '', t: 0 }); }
function pushUndo(key) {
  const b = curB(), h = histOf(b), now = Date.now();
  if (key && key === h.key && now - h.t < 1500) { h.t = now; return; }
  h.key = key || ''; h.t = now;
  h.u.push(JSON.stringify(b.elements)); if (h.u.length > 80) h.u.shift(); h.r = [];
}
function undo() {
  const b = curB(), h = histOf(b); if (!h.u.length) return;
  const eq = equipCounts(b.elements);
  h.r.push(JSON.stringify(b.elements)); b.elements = JSON.parse(h.u.pop()); h.key = '';
  syncEquip(b, eq); afterHist();
}
function redo() {
  const b = curB(), h = histOf(b); if (!h.r.length) return;
  const eq = equipCounts(b.elements);
  h.u.push(JSON.stringify(b.elements)); b.elements = JSON.parse(h.r.pop()); h.key = '';
  syncEquip(b, eq); afterHist();
}
function afterHist() {
  const b = curB(); if (!b.elements.some(e => e.id === Plan.sel)) Plan.sel = null;
  save(); renderTools(); renderSide(); draw2D();
}

/* ---------- Vue 2D ---------- */
function getView(b) {
  b = b || curB();
  return Plan.views[b.id] || (Plan.views[b.id] = { s: 12, ox: 20, oy: 20, fit: true });
}
function fitView(b) {
  const cv = $('#c2d'), v = getView(b), dpr = cv._dpr || 1, W = cv.width / dpr, H = cv.height / dpr;
  if (W < 50) return;
  v.s = clamp(Math.min((W - 60) / b.tw, (H - 60) / b.td), 4, 60);
  v.ox = (W - b.tw * v.s) / 2; v.oy = (H - b.td * v.s) / 2;   // v.fit reste vrai jusqu'à ce que l'utilisateur déplace ou zoome
}
function resizeCanvases() {
  const st = $('#stage'); if (!st) return;
  const dpr = window.devicePixelRatio || 1, w = st.clientWidth, h = st.clientHeight;
  ['#c2d', '#c3d'].forEach(sel => {
    const c = $(sel);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    c._dpr = dpr;
  });
}
const sn = v => Plan.snap ? roundTo(v, 0.5) : Math.round(v * 10) / 10;
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function draw2D() {
  const cv = $('#c2d'); if (!cv || cv.hidden || S.page !== 'plan') return;
  const b = curB(), ctx = cv.getContext('2d'), dpr = cv._dpr || 1;
  if (getView(b).fit) fitView(b);
  const v = getView(b), W = cv.width / dpr, H = cv.height / dpr, u = 1 / v.s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = cssv('--stage'); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(v.ox, v.oy); ctx.scale(v.s, v.s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const wallCol = cssv('--wall'), accent = cssv('--accent'), inkCol = cssv('--ink'), mut = cssv('--muted');

  // terrain + grille
  ctx.fillStyle = cssv('--grass'); ctx.fillRect(0, 0, b.tw, b.td);
  if (v.s >= 9) {
    ctx.strokeStyle = cssv('--grid'); ctx.lineWidth = u; ctx.beginPath();
    for (let x = 1; x < b.tw; x++) if (x % 5) { ctx.moveTo(x, 0); ctx.lineTo(x, b.td); }
    for (let y = 1; y < b.td; y++) if (y % 5) { ctx.moveTo(0, y); ctx.lineTo(b.tw, y); }
    ctx.stroke();
  }
  ctx.strokeStyle = cssv('--grid-major'); ctx.lineWidth = u; ctx.beginPath();
  for (let x = 5; x < b.tw; x += 5) { ctx.moveTo(x, 0); ctx.lineTo(x, b.td); }
  for (let y = 5; y < b.td; y += 5) { ctx.moveTo(0, y); ctx.lineTo(b.tw, y); }
  ctx.stroke();
  ctx.strokeStyle = mut; ctx.lineWidth = 1.5 * u; ctx.setLineDash([6 * u, 4 * u]); ctx.strokeRect(0, 0, b.tw, b.td); ctx.setLineDash([]);

  const els = b.elements;
  const label = (txt, x, y, size, col, bold, maxW) => {
    const setF = s => { ctx.font = `${bold ? '600 ' : ''}${s * u}px "Segoe UI",system-ui,sans-serif`; };
    let s = size; setF(s);
    if (maxW) {
      while (s > 9 && ctx.measureText(txt).width > maxW) { s -= 0.5; setF(s); }
      if (ctx.measureText(txt).width > maxW) { let t = txt; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); txt = t + '…'; }
    }
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  };
  // allées, parterres, bassins
  els.filter(e => e.t === 'path').forEach(e => { ctx.fillStyle = '#cdbfa6'; ctx.fillRect(e.x, e.y, e.w, e.d); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = u; ctx.strokeRect(e.x, e.y, e.w, e.d); });
  els.filter(e => e.t === 'bed').forEach(e => {
    ctx.fillStyle = '#a98456'; ctx.fillRect(e.x, e.y, e.w, e.d);
    ctx.strokeStyle = 'rgba(70,110,50,.7)'; ctx.lineWidth = 2 * u; ctx.beginPath();
    const horiz = e.w >= e.d;
    for (let t = 0.6; t < (horiz ? e.d : e.w) - 0.3; t += 0.9) {
      if (horiz) { ctx.moveTo(e.x + 0.3, e.y + t); ctx.lineTo(e.x + e.w - 0.3, e.y + t); } else { ctx.moveTo(e.x + t, e.y + 0.3); ctx.lineTo(e.x + t, e.y + e.d - 0.3); }
    }
    ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = u; ctx.strokeRect(e.x, e.y, e.w, e.d);
  });
  els.filter(e => e.t === 'pond').forEach(e => {
    ctx.fillStyle = '#7fbad8'; ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.d / 2, e.w / 2, e.d / 2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4b88a8'; ctx.lineWidth = 1.5 * u; ctx.stroke();
  });
  // sols des pièces
  els.filter(e => e.t === 'room').forEach(e => { ctx.fillStyle = (KINDS[e.kind] || KINDS.autre)[1]; ctx.fillRect(e.x, e.y, e.w, e.d); });
  if (Plan.decor !== false) els.filter(e => e.t === 'room').forEach(e => { drawRoomFloor(ctx, e, u, wallCol, v.s); drawRoomDecor(ctx, e, u, wallCol, v.s); });
  // clôtures
  els.filter(e => e.t === 'fence').forEach(e => {
    ctx.strokeStyle = '#8b6b4a'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
    ctx.strokeStyle = '#d9c3a0'; ctx.lineWidth = 1 * u; ctx.setLineDash([2 * u, 6 * u]); ctx.stroke(); ctx.setLineDash([]);
  });
  // murs
  const W3 = computeWalls(b), parts = wallParts(W3);
  ctx.fillStyle = wallCol;
  parts.forEach(({ p, solids }) => solids.forEach(([s0, s1]) => {
    const t = Math.max(WT, 3 * u);
    if (p.axis === 'h') ctx.fillRect(s0, p.c - t / 2, s1 - s0, t); else ctx.fillRect(p.c - t / 2, s0, t, s1 - s0);
  }));
  // ouvertures
  W3.ops.forEach(op => {
    const horiz = op.axis === 'h', o = op.o, r = op.room, w = op.a1 - op.a0;
    const P = (a, d) => horiz ? [a, op.c + d] : [op.c + d, a];
    if (o.kind === 'window') {
      ctx.strokeStyle = '#5aa6d4'; ctx.lineWidth = 2.5 * u; ctx.beginPath();
      let q = P(op.a0, 0), q2 = P(op.a1, 0); ctx.moveTo(...q); ctx.lineTo(...q2); ctx.stroke();
      ctx.strokeStyle = wallCol; ctx.lineWidth = 1 * u; ctx.beginPath();
      [-WT / 2, WT / 2].forEach(d => { q = P(op.a0, d); q2 = P(op.a1, d); ctx.moveTo(...q); ctx.lineTo(...q2); }); ctx.stroke();
    } else if (o.kind === 'gate') {
      ctx.strokeStyle = '#6b7b8c'; ctx.lineWidth = 3 * u; ctx.setLineDash([5 * u, 3 * u]); ctx.beginPath();
      ctx.moveTo(...P(op.a0, 0)); ctx.lineTo(...P(op.a1, 0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = wallCol; ctx.lineWidth = 1.5 * u; ctx.beginPath();
      ctx.moveTo(...P(op.a0, -WT / 2)); ctx.lineTo(...P(op.a0, WT / 2)); ctx.moveTo(...P(op.a1, -WT / 2)); ctx.lineTo(...P(op.a1, WT / 2)); ctx.stroke();
    } else {
      const inward = o.side === 'N' || o.side === 'W' ? 1 : -1;
      const A = horiz ? [1, 0] : [0, 1], I = horiz ? [0, inward] : [inward, 0];
      const H0 = P(op.a0, 0), tip = [H0[0] + I[0] * w, H0[1] + I[1] * w];
      ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(...H0); ctx.lineTo(...tip); ctx.stroke();
      ctx.strokeStyle = 'rgba(138,90,59,.6)'; ctx.lineWidth = 1 * u; ctx.beginPath();
      ctx.arc(H0[0], H0[1], w, Math.atan2(I[1], I[0]), Math.atan2(A[1], A[0]), (I[0] * A[1] - I[1] * A[0]) < 0); ctx.stroke();
    }
  });
  // machines et équipements (taille minimale de 9 px à l'écran pour rester visibles et saisissables)
  els.filter(e => e.t === 'equip').forEach(e => {
    const mw = Math.max(e.w, 9 * u), md = Math.max(e.d, 9 * u), cx = e.x + e.w / 2, cy = e.y + e.d / 2;
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(cx - mw / 2 + 2 * u, cy - md / 2 + 2 * u, mw, md);   // ombre portée
    drawSym(ctx, eqSymOf(e.k), cx - mw / 2, cy - md / 2, mw, md, u, eqColor(e.k), wallCol);
    if (mw * v.s > 70 && md * v.s > 40) label(e.name, cx, cy + md / 2 + 8 * u, 10.5, inkCol, true, mw * 1.6);
  });
  // arbres
  els.filter(e => e.t === 'tree').forEach(e => {
    ctx.fillStyle = 'rgba(52,120,60,.55)'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(30,80,40,.9)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = '#6e4a2b'; ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(0.12, 3 * u), 0, 7); ctx.fill();
  });
  // toits (pointillés)
  const roofC = cssv('--roof') || '#b5654a';
  els.filter(e => e.t === 'roof').forEach(e => {
    ctx.fillStyle = rgbaC(roofC, 0.12); ctx.fillRect(e.x, e.y, e.w, e.d);
    ctx.strokeStyle = rgbaC(roofC, 0.95); ctx.lineWidth = 1.5 * u; ctx.setLineDash([7 * u, 4 * u]); ctx.strokeRect(e.x, e.y, e.w, e.d); ctx.setLineDash([]);
    if (e.type !== 'plat') {
      ctx.beginPath(); ctx.strokeStyle = rgbaC(roofC, 0.5);
      if (e.w >= e.d) { ctx.moveTo(e.x, e.y + e.d / 2); ctx.lineTo(e.x + e.w, e.y + e.d / 2); } else { ctx.moveTo(e.x + e.w / 2, e.y); ctx.lineTo(e.x + e.w / 2, e.y + e.d); }
      ctx.stroke();
    }
  });
  // étiquettes
  els.forEach(e => {
    if (e.t === 'room' && Math.min(e.w, e.d) * v.s > 28) {
      label(e.name, e.x + e.w / 2, e.y + e.d / 2 - 7 * u, 13, inkCol, true, e.w - 0.3);
      label(fm1(e.w * e.d) + ' m²', e.x + e.w / 2, e.y + e.d / 2 + 8 * u, 11.5, mut, false, e.w - 0.3);
    } else if (['bed', 'pond', 'path'].includes(e.t) && Math.min(e.w, e.d) * v.s > 22 && e.name) {
      label(e.name, e.x + e.w / 2, e.y + e.d / 2, 12, inkCol, true);
    } else if (e.t === 'tree' && e.r * v.s > 16 && e.name) {
      label(e.name, e.x, e.y + e.r + 9 * u, 11, mut);
    }
  });
  // sélection
  const sel = els.find(e => e.id === Plan.sel);
  if (sel && Plan.tab === '2d') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2.2 * u;
    if (RECTS.includes(sel.t)) {
      ctx.setLineDash([6 * u, 3 * u]); ctx.strokeRect(sel.x, sel.y, sel.w, sel.d); ctx.setLineDash([]);
      label(fm1(sel.w) + ' m', sel.x + sel.w / 2, sel.y - 10 * u, 12, accent, true);
      ctx.save(); ctx.translate(sel.x - 10 * u, sel.y + sel.d / 2); ctx.rotate(-Math.PI / 2); label(fm1(sel.d) + ' m', 0, 0, 12, accent, true); ctx.restore();
    } else if (sel.t === 'tree') { ctx.beginPath(); ctx.arc(sel.x, sel.y, sel.r, 0, 7); ctx.stroke(); }
    else if (sel.t === 'fence') { ctx.beginPath(); ctx.moveTo(sel.x1, sel.y1); ctx.lineTo(sel.x2, sel.y2); ctx.stroke(); }
    else if (sel.t === 'open') { const op = W3.ops.find(o => o.o === sel); if (op) { ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(...(op.axis === 'h' ? [op.a0, op.c] : [op.c, op.a0])); ctx.lineTo(...(op.axis === 'h' ? [op.a1, op.c] : [op.c, op.a1])); ctx.stroke(); } }
    handlesOf(sel).forEach(([id, hx, hy]) => { const s = 9 * u; ctx.fillStyle = '#fff'; ctx.strokeStyle = accent; ctx.lineWidth = 2 * u; ctx.fillRect(hx - s / 2, hy - s / 2, s, s); ctx.strokeRect(hx - s / 2, hy - s / 2, s, s); });
  }
  // dessin en cours
  const d = Plan.drag;
  if (d && d.mode === 'draw') {
    const x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1), w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
    ctx.fillStyle = 'rgba(47,107,79,.18)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = accent; ctx.lineWidth = 2 * u; ctx.setLineDash([6 * u, 3 * u]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
    label(`${fm1(w)} × ${fm1(h)} m`, x + w / 2, y + h / 2, 13, accent, true);
  }
  if (d && d.mode === 'fence') { ctx.strokeStyle = accent; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(d.x0, d.y0); ctx.lineTo(d.x1, d.y1); ctx.stroke(); label(fm1(Math.hypot(d.x1 - d.x0, d.y1 - d.y0)) + ' m', (d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2 - 10 * u, 12, accent, true); }
  if (Plan.ghost) {                                   // aperçu pendant un glisser-déposer depuis la palette
    const g = createAt(Plan.ghost.key, Plan.ghost.x, Plan.ghost.y);
    ctx.strokeStyle = accent; ctx.fillStyle = 'rgba(47,107,79,.22)'; ctx.lineWidth = 2 * u;
    if (!g) { ctx.fillStyle = 'rgba(181,83,47,.9)'; ctx.beginPath(); ctx.arc(Plan.ghost.x, Plan.ghost.y, 5 * u, 0, 7); ctx.fill(); }
    else if (RECTS.includes(g.t)) { ctx.fillRect(g.x, g.y, g.w, g.d); ctx.setLineDash([6 * u, 3 * u]); ctx.strokeRect(g.x, g.y, g.w, g.d); ctx.setLineDash([]); label(`${fm1(g.w)} × ${fm1(g.d)} m`, g.x + g.w / 2, g.y + g.d / 2, 12, accent, true); }
    else if (g.t === 'tree') { ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (g.t === 'fence') { ctx.beginPath(); ctx.moveTo(g.x1, g.y1); ctx.lineTo(g.x2, g.y2); ctx.lineWidth = 3 * u; ctx.stroke(); }
    else if (g.t === 'open') {
      const r = els.find(x => x.id === g.room), hz = g.side === 'N' || g.side === 'S';
      const cx = hz ? r.x + g.pos : (g.side === 'W' ? r.x : r.x + r.w), cy = hz ? (g.side === 'N' ? r.y : r.y + r.d) : r.y + g.pos;
      ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(hz ? cx - g.w / 2 : cx, hz ? cy : cy - g.w / 2); ctx.lineTo(hz ? cx + g.w / 2 : cx, hz ? cy : cy + g.w / 2); ctx.stroke();
    }
  }
  ctx.restore();
  if (!els.length && !Plan.ghost && Plan.tab === '2d') {
    ctx.fillStyle = mut; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 17px "Segoe UI",system-ui,sans-serif';
    ctx.fillText('Plan vide', W / 2, H / 2 - 14); ctx.font = '14px "Segoe UI",system-ui,sans-serif';
    ctx.fillText('Glissez une pièce depuis la palette de gauche pour commencer.', W / 2, H / 2 + 12);
  }

  // échelle + nord (en pixels écran)
  const nice = [1, 2, 5, 10, 20, 50].find(n => n * v.s >= 70) || 50;
  ctx.fillStyle = inkCol; ctx.strokeStyle = inkCol; ctx.lineWidth = 2; ctx.font = '12px "Segoe UI",system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.beginPath(); ctx.moveTo(14, H - 16); ctx.lineTo(14 + nice * v.s, H - 16); ctx.moveTo(14, H - 20); ctx.lineTo(14, H - 12); ctx.moveTo(14 + nice * v.s, H - 20); ctx.lineTo(14 + nice * v.s, H - 12); ctx.stroke();
  ctx.fillText(nice + ' m', 14, H - 24);
  ctx.textAlign = 'center'; ctx.fillText('N', W - 24, 24);
  ctx.beginPath(); ctx.moveTo(W - 24, 30); ctx.lineTo(W - 24, 52); ctx.moveTo(W - 29, 36); ctx.lineTo(W - 24, 30); ctx.lineTo(W - 19, 36); ctx.stroke();
}

/* ---------- Sélection, poignées, recherche d'éléments ---------- */
function handlesOf(e) {
  if (RECTS.includes(e.t)) return [['nw', e.x, e.y], ['ne', e.x + e.w, e.y], ['sw', e.x, e.y + e.d], ['se', e.x + e.w, e.y + e.d]];
  if (e.t === 'tree') return [['r', e.x + e.r, e.y]];
  if (e.t === 'fence') return [['p1', e.x1, e.y1], ['p2', e.x2, e.y2]];
  return [];
}
function hitHandle(px, py) {
  const b = curB(), e = b.elements.find(x => x.id === Plan.sel); if (!e) return null;
  const v = getView(b);
  for (const [id, hx, hy] of handlesOf(e)) if (Math.hypot(hx * v.s + v.ox - px, hy * v.s + v.oy - py) <= 10) return { id, e };
  return null;
}
const inRect = (e, x, y, m = 0) => x >= e.x - m && x <= e.x + e.w + m && y >= e.y - m && y <= e.y + e.d + m;
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function hitTest(x, y) {
  const b = curB(), els = b.elements, v = getView(b), tol = Math.max(0.3, 8 / v.s);
  const W = computeWalls(b);
  for (const op of W.ops) {
    const along = op.axis === 'h' ? x : y, across = op.axis === 'h' ? y : x;
    if (Math.abs(across - op.c) <= Math.max(0.35, 6 / v.s) && along >= op.a0 - 0.1 && along <= op.a1 + 0.1) return op.o;
  }
  for (let i = els.length - 1; i >= 0; i--) { const e = els[i]; if (e.t === 'equip' && inRect(e, x, y, Math.max(0, 6 / v.s - Math.min(e.w, e.d) / 2))) return e; }
  for (let i = els.length - 1; i >= 0; i--) { const e = els[i]; if (e.t === 'tree' && Math.hypot(x - e.x, y - e.y) <= Math.max(e.r, tol)) return e; }
  for (let i = els.length - 1; i >= 0; i--) { const e = els[i]; if (e.t === 'fence' && distSeg(x, y, e.x1, e.y1, e.x2, e.y2) <= tol) return e; }
  for (let i = els.length - 1; i >= 0; i--) { const e = els[i]; if (e.t === 'roof' && inRect(e, x, y, tol) && !inRect({ x: e.x + tol, y: e.y + tol, w: e.w - 2 * tol, d: e.d - 2 * tol }, x, y)) return e; }
  const rooms = els.filter(e => e.t === 'room' && inRect(e, x, y)).sort((a, c) => a.w * a.d - c.w * c.d);
  if (rooms.length) return rooms[0];
  for (const t of ['pond', 'bed', 'path', 'roof']) for (let i = els.length - 1; i >= 0; i--) { const e = els[i]; if (e.t === t && inRect(e, x, y)) return e; }
  return null;
}
function nearestSide(x, y) {
  const b = curB(), v = getView(b), maxD = Math.max(0.6, 14 / v.s);
  let best = null;
  b.elements.filter(e => e.t === 'room').forEach(r => {
    [['N', r.x, r.y, r.x + r.w, r.y], ['S', r.x, r.y + r.d, r.x + r.w, r.y + r.d], ['W', r.x, r.y, r.x, r.y + r.d], ['E', r.x + r.w, r.y, r.x + r.w, r.y + r.d]].forEach(([side, x1, y1, x2, y2]) => {
      const d = distSeg(x, y, x1, y1, x2, y2);
      if (d <= maxD && (!best || d < best.d)) best = { d, room: r, side, pos: side === 'N' || side === 'S' ? x - r.x : y - r.y };
    });
  });
  return best;
}

/* ---------- Ajout / suppression ---------- */
function nextName(base) {
  const b = curB(); const names = b.elements.map(e => e.name);
  if (!names.includes(base)) return base;
  let i = 2; while (names.includes(base + ' ' + i)) i++; return base + ' ' + i;
}
function addEl(e) {
  const b = curB(), eq = equipCounts(b.elements); pushUndo(); b.elements.push(e); Plan.sel = e.id; save();
  if (syncEquip(b, eq) && e.t === 'equip') { const row = b.materials.find(m => m.k === e.k); toast(`Ajouté aux matériels : ${eqShort(e.k)} (quantité ${row ? row.qty : 1})`); }
  renderTools(); renderSide(); draw2D();
}
function deleteSel() {
  const b = curB(), e = b.elements.find(x => x.id === Plan.sel); if (!e) return;
  const eq = equipCounts(b.elements); pushUndo();
  b.elements = b.elements.filter(x => x.id !== e.id && !(e.t === 'room' && x.t === 'open' && x.room === e.id));
  Plan.sel = null; save(); if (syncEquip(b, eq) && e.t === 'equip') toast('Retiré des matériels : ' + eqShort(e.k));
  renderTools(); renderSide(); draw2D();
}
function duplicateSel() {
  const b = curB(), e = b.elements.find(x => x.id === Plan.sel); if (!e || e.t === 'open') return;
  const eq = equipCounts(b.elements); pushUndo();
  const c = JSON.parse(JSON.stringify(e)); c.id = uid();
  if (e.t === 'fence') { c.x1 += 1; c.x2 += 1; c.y1 += 1; c.y2 += 1; } else { c.x += 1; c.y += 1; }
  if (c.name && e.t !== 'tree') c.name = nextName(e.name);
  b.elements.push(c);
  if (e.t === 'room') b.elements.filter(x => x.t === 'open' && x.room === e.id).forEach(o => b.elements.push({ ...o, id: uid(), room: c.id }));
  Plan.sel = c.id; save(); syncEquip(b, eq); renderSide(); draw2D();
}
function setTool(t) {
  Plan.tool = t; Plan.drag = null; if (t !== 'select') Plan.sel = null;
  renderTools(); renderSide(); draw2D();
  $('#c2d').style.cursor = t === 'select' ? 'default' : 'crosshair';
}

/* ---------- Interactions souris / tactile ---------- */
function initEditor() {
  const cv = $('#c2d');
  const pos = ev => { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  const world = (px, py) => { const v = getView(); return { x: (px - v.ox) / v.s, y: (py - v.oy) / v.s }; };

  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', ev => {
    cv.setPointerCapture(ev.pointerId);
    const [px, py] = pos(ev), w = world(px, py), b = curB(), v = getView(b), tool = Plan.tool;
    if (ev.button === 1 || ev.button === 2 || Plan.space) { Plan.drag = { mode: 'pan', px, py, ox: v.ox, oy: v.oy }; return; }
    if (tool === 'select') {
      const h = hitHandle(px, py);
      if (h) { Plan.drag = { mode: 'handle', h: h.id, e: h.e, orig: JSON.parse(JSON.stringify(h.e)), moved: false }; return; }
      const hit = hitTest(w.x, w.y);
      if (hit) { Plan.sel = hit.id; Plan.drag = { mode: 'move', e: hit, sx: w.x, sy: w.y, orig: JSON.parse(JSON.stringify(hit)), moved: false }; renderSide(); draw2D(); }
      else { Plan.sel = null; Plan.drag = { mode: 'pan', px, py, ox: v.ox, oy: v.oy }; renderSide(); draw2D(); }
    } else if (['room', 'roof', 'bed', 'pond', 'path'].includes(tool)) {
      Plan.drag = { mode: 'draw', tool, x0: sn(w.x), y0: sn(w.y), x1: sn(w.x), y1: sn(w.y) };
    } else if (tool === 'fence') {
      Plan.drag = { mode: 'fence', x0: sn(w.x), y0: sn(w.y), x1: sn(w.x), y1: sn(w.y) };
    } else if (tool === 'tree') {
      addEl({ id: uid(), t: 'tree', x: sn(w.x), y: sn(w.y), r: 2, h: 5, name: 'Arbre' });
    } else if (['door', 'window', 'gate'].includes(tool)) {
      const n = nearestSide(w.x, w.y);
      if (!n) return toast('Cliquez sur un mur d\'une pièce pour y placer l\'ouverture.');
      const ow = tool === 'door' ? 0.9 : tool === 'window' ? 1.2 : 3;
      const len = n.side === 'N' || n.side === 'S' ? n.room.w : n.room.d;
      addEl({ id: uid(), t: 'open', kind: tool, room: n.room.id, side: n.side, pos: clamp(roundTo(n.pos, 0.25), ow / 2, Math.max(ow / 2, len - ow / 2)), w: Math.min(ow, len) });
    }
  });

  cv.addEventListener('pointermove', ev => {
    const [px, py] = pos(ev), w = world(px, py), d = Plan.drag, b = curB(), v = getView(b);
    if (!d) {
      if (['door', 'window', 'gate'].includes(Plan.tool)) {
        const n = nearestSide(w.x, w.y); const old = Plan.hover;
        Plan.hover = n ? [n.side === 'W' ? n.room.x : n.side === 'E' ? n.room.x + n.room.w : clamp(w.x, n.room.x, n.room.x + n.room.w), n.side === 'N' ? n.room.y : n.side === 'S' ? n.room.y + n.room.d : clamp(w.y, n.room.y, n.room.y + n.room.d)] : null;
        if (old || Plan.hover) { Plan.drag = null; drawHover(); }
      } else if (Plan.tool === 'select') {
        const h = hitHandle(px, py); cv.style.cursor = h ? 'nwse-resize' : (hitTest(w.x, w.y) ? 'move' : 'default');
      }
      return;
    }
    if (d.mode === 'pan') { v.fit = false; v.ox = d.ox + (px - d.px); v.oy = d.oy + (py - d.py); draw2D(); return; }
    if (d.mode === 'draw' || d.mode === 'fence') { d.x1 = sn(w.x); d.y1 = sn(w.y); draw2D(); return; }
    if (d.mode === 'move') {
      const e = d.e, o = d.orig; let dx = w.x - d.sx, dy = w.y - d.sy;
      if (!d.moved && Math.hypot(dx, dy) * v.s < 3) return;
      if (!d.moved) { pushUndo(); d.moved = true; }
      if (RECTS.includes(e.t)) {
        const sg = e.t === 'equip' ? (q => Plan.snap ? roundTo(q, 0.25) : Math.round(q * 10) / 10) : sn;
        let nx = sg(o.x + dx), ny = sg(o.y + dy);
        if (Plan.snap && (e.t === 'room' || e.t === 'roof')) [nx, ny] = magnet(e, nx, ny, b.elements.filter(x => x.t === 'room' && x.id !== e.id));
        e.x = nx; e.y = ny;
      } else if (e.t === 'tree') { e.x = sn(o.x + dx); e.y = sn(o.y + dy); }
      else if (e.t === 'fence') { dx = Plan.snap ? roundTo(dx, 0.5) : dx; dy = Plan.snap ? roundTo(dy, 0.5) : dy; e.x1 = o.x1 + dx; e.x2 = o.x2 + dx; e.y1 = o.y1 + dy; e.y2 = o.y2 + dy; }
      else if (e.t === 'open') {
        const r = b.elements.find(x => x.id === e.room); if (!r) return;
        const horiz = e.side === 'N' || e.side === 'S', len = horiz ? r.w : r.d;
        e.pos = clamp(roundTo((horiz ? w.x - r.x : w.y - r.y), 0.25), e.w / 2, Math.max(e.w / 2, len - e.w / 2));
      }
      draw2D(); updateFieldValues(); return;
    }
    if (d.mode === 'handle') {
      const e = d.e, o = d.orig;
      if (!d.moved) { pushUndo(); d.moved = true; }
      if (RECTS.includes(e.t)) {
        const west = d.h.includes('w'), north = d.h.includes('n');
        const ox = west ? o.x + o.w : o.x, oy = north ? o.y + o.d : o.y;
        let nx = sn(w.x), ny = sn(w.y);
        if (Math.abs(nx - ox) < 0.5) nx = ox + (west ? -0.5 : 0.5);
        if (Math.abs(ny - oy) < 0.5) ny = oy + (north ? -0.5 : 0.5);
        e.x = Math.min(nx, ox); e.w = Math.abs(nx - ox); e.y = Math.min(ny, oy); e.d = Math.abs(ny - oy);
      } else if (e.t === 'tree') e.r = Math.max(0.3, Math.round(Math.hypot(w.x - e.x, w.y - e.y) * 10) / 10);
      else if (e.t === 'fence') { if (d.h === 'p1') { e.x1 = sn(w.x); e.y1 = sn(w.y); } else { e.x2 = sn(w.x); e.y2 = sn(w.y); } }
      draw2D(); updateFieldValues();
    }
  });

  const finish = ev => {
    const d = Plan.drag; if (!d) return; Plan.drag = null;
    if (d.mode === 'draw') {
      const x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1), w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
      if (w >= 0.5 && h >= 0.5) {
        const base = { id: uid(), t: d.tool, x, y, w, d: h };
        if (d.tool === 'room') { const k = Plan.roomKind; Object.assign(base, { kind: k, name: nextName(KINDS[k][0].split(' / ')[0]), h: 3 }); }
        if (d.tool === 'roof') Object.assign(base, { type: 'pente', base: 3 });
        if (d.tool === 'bed') base.name = nextName('Potager');
        if (d.tool === 'pond') base.name = nextName('Bassin');
        if (d.tool === 'path') base.name = nextName('Allée');
        addEl(base); setTool('select'); Plan.sel = base.id; renderSide(); draw2D();
      } else draw2D();
    } else if (d.mode === 'fence') {
      if (Math.hypot(d.x1 - d.x0, d.y1 - d.y0) >= 0.5) addEl({ id: uid(), t: 'fence', x1: d.x0, y1: d.y0, x2: d.x1, y2: d.y1, h: 1.8 }); else draw2D();
    } else if (d.mode === 'move' || d.mode === 'handle') {
      if (d.moved) { save(); renderSide(); }
    }
  };
  cv.addEventListener('pointerup', finish);
  cv.addEventListener('pointercancel', finish);
  cv.addEventListener('pointerleave', () => { if (Plan.hover) { Plan.hover = null; draw2D(); } });

  cv.addEventListener('wheel', ev => {
    ev.preventDefault();
    const [px, py] = pos(ev), v = getView(), f = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    const ns = clamp(v.s * f, 3, 90), k = ns / v.s; v.fit = false;
    v.ox = px - (px - v.ox) * k; v.oy = py - (py - v.oy) * k; v.s = ns; draw2D();
  }, { passive: false });

  window.addEventListener('keydown', ev => {
    if (S.page !== 'plan' || Plan.tab !== '2d') return;
    const tg = ev.target.tagName; if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tg)) return;
    if (ev.code === 'Space') { Plan.space = true; ev.preventDefault(); return; }
    const mod = ev.ctrlKey || ev.metaKey, k = ev.key.toLowerCase();
    if (mod && k === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
    else if (mod && k === 'y') { ev.preventDefault(); redo(); }
    else if (mod && k === 'd') { ev.preventDefault(); duplicateSel(); }
    else if (k === 'delete' || k === 'backspace') { ev.preventDefault(); deleteSel(); }
    else if (k === 'escape') { setTool('select'); Plan.sel = null; renderSide(); draw2D(); }
    else if (k.startsWith('arrow') && Plan.sel) {
      ev.preventDefault();
      const e = curB().elements.find(x => x.id === Plan.sel); if (!e || e.t === 'open') return;
      const st = ev.shiftKey ? 0.1 : 0.5, dx = k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0, dy = k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0;
      pushUndo('nudge' + e.id);
      if (e.t === 'fence') { e.x1 += dx; e.x2 += dx; e.y1 += dy; e.y2 += dy; } else { e.x += dx; e.y += dy; }
      save(); draw2D(); updateFieldValues();
    }
  });
  window.addEventListener('keyup', ev => { if (ev.code === 'Space') Plan.space = false; });
  window.addEventListener('resize', () => { if (S.page === 'plan' && Plan.tab !== 'steps') { resizeCanvases(); Plan.tab === '2d' ? draw2D() : View3D.draw(); } });
  if (window.ResizeObserver) new ResizeObserver(() => { if (S.page === 'plan' && Plan.tab !== 'steps') { resizeCanvases(); Plan.tab === '2d' ? draw2D() : View3D.draw(); } }).observe($('#stage'));
}
function drawHover() { draw2D(); const cv = $('#c2d'), ctx = cv.getContext('2d'), v = getView(), dpr = cv._dpr || 1; if (!Plan.hover) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = cssv('--accent'); ctx.beginPath(); ctx.arc(Plan.hover[0] * v.s + v.ox, Plan.hover[1] * v.s + v.oy, 6, 0, 7); ctx.fill(); }

/* ---------- Barre d'outils ---------- */
const IC = {
  select: '<path d="M5 3l14 7-6 2-2 6z"/>', room: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M12 5v7h8"/>',
  roof: '<path d="M3 12l9-7 9 7M6 11v8h12v-8"/>', door: '<path d="M6 20V4h9l3 3v13M4 20h16"/><circle cx="13" cy="13" r=".8"/>',
  window: '<rect x="5" y="5" width="14" height="14"/><path d="M12 5v14M5 12h14"/>', gate: '<path d="M3 20V9l9-4 9 4v11M8 20v-8h8v8"/>',
  tree: '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21"/>', bed: '<rect x="4" y="7" width="16" height="10"/><path d="M8 7v10M12 7v10M16 7v10"/>',
  pond: '<ellipse cx="12" cy="12" rx="8.5" ry="5.5"/><path d="M8 12c1.3-1 2.7-1 4 0s2.7 1 4 0"/>', path: '<path d="M3 15h18M3 9h18M8 9v6M13 9v6M18 9v6"/>',
  fence: '<path d="M4 7v13M10 7v13M16 7v13M22 7v13M2 11h21M2 16h21"/>', undo: '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2"/>',
  redo: '<path d="M15 7l5 5-5 5M20 12H9a5 5 0 000 10h2"/>', fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', grid: '<path d="M4 4h16v16H4zM4 12h16M12 4v16"/>',
  top: '<rect x="5" y="5" width="14" height="14"/><path d="M5 5l14 14"/>', front: '<path d="M4 20h16M6 20V10l6-5 6 5v10"/>', iso: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  sofa: '<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3M3 13a2 2 0 014 0v2h10v-2a2 2 0 014 0v5H3zM6 18v2M18 18v2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V5H5v11h3"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', roofv: '<path d="M3 13l9-8 9 8M5 13v6h14v-6"/>'
};
const ic = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const TOOLS = [['select', 'Sélection'], ['room', 'Dessiner une pièce'], ['roof', 'Dessiner un toit'], ['fence', 'Tracer une clôture']];
const HINTS = {
  select: 'Glissez un élément de la palette vers le plan. Ensuite : cliquez-le pour le modifier, déplacez-le, tirez ses poignées pour le redimensionner. Molette : zoom. Glisser sur le vide : déplacer la vue.',
  room: 'Choisissez le type de pièce, puis glissez sur le plan pour dessiner un rectangle à la taille voulue. Des pièces collées partagent le même mur.',
  roof: 'Glissez pour dessiner un toit au-dessus de vos pièces. Réglez ensuite sa forme et sa hauteur dans le panneau de droite.',
  door: 'Cliquez sur un mur pour poser une porte. Vous pourrez la faire glisser le long du mur.',
  window: 'Cliquez sur un mur pour poser une fenêtre.',
  gate: 'Cliquez sur un mur pour poser un grand portail, une porte de hangar ou un rideau métallique.',
  tree: 'Cliquez pour planter un arbre. Tirez la poignée pour régler la taille de la couronne.',
  bed: 'Glissez pour dessiner un potager ou un parterre.', pond: 'Glissez pour dessiner un bassin ou un réservoir.',
  path: 'Glissez pour dessiner une allée, une cour ou un parking.', fence: 'Glissez d\'un point à un autre pour tracer une clôture.'
};
function renderTools() {
  const el = $('#tools');
  if (Plan.tab === '3d') { el.innerHTML = View3D.toolsHtml(); $('#hint').textContent = 'Glissez pour tourner autour du bâtiment. Clic droit ou Maj + glisser : déplacer. Molette : zoom.'; return; }
  const h = histOf(curB());
  el.innerHTML = TOOLS.map(([id, t]) => `<button class="tool ${Plan.tool === id ? 'on' : ''}" data-tool="${id}" title="${t}">${ic(id)}<span>${t}</span></button>`).join('') +
    (Plan.tool === 'room' ? `<select id="roomKind" title="Type de pièce">${Object.entries(KINDS).map(([k, [l]]) => `<option value="${k}" ${k === Plan.roomKind ? 'selected' : ''}>${l}</option>`).join('')}</select>` : '') +
    `<span class="sep"></span>
     <button class="tool icon" data-act="undo" title="Annuler (Ctrl+Z)" ${h.u.length ? '' : 'disabled'}>${ic('undo')}</button>
     <button class="tool icon" data-act="redo" title="Rétablir (Ctrl+Y)" ${h.r.length ? '' : 'disabled'}>${ic('redo')}</button>
     <button class="tool icon" data-act="zout" title="Zoom arrière">${ic('minus')}</button>
     <button class="tool icon" data-act="zin" title="Zoom avant">${ic('plus')}</button>
     <button class="tool icon" data-act="fit" title="Tout voir">${ic('fit')}</button>
     <button class="tool icon ${Plan.snap ? 'on' : ''}" data-act="snap" title="Aimantation à la grille (0,5 m)">${ic('grid')}</button>
     <button class="tool ${Plan.decor !== false ? 'on' : ''}" data-act="decor" title="Afficher ou masquer les meubles et les sols des pièces">${ic('sofa')}<span>Aménagement</span></button>`;
  $('#hint').textContent = HINTS[Plan.tool];
}
function initTools() {
  $('#tools').addEventListener('click', ev => {
    const t = ev.target.closest('[data-tool]'); if (t) return setTool(t.dataset.tool);
    const v3 = ev.target.closest('[data-v3]'); if (v3) return View3D.act(v3.dataset.v3);
    const a = ev.target.closest('[data-act]'); if (!a) return;
    const cv = $('#c2d'), v = getView(), dpr = cv._dpr || 1, cx = cv.width / dpr / 2, cy = cv.height / dpr / 2;
    const zoom = f => { const ns = clamp(v.s * f, 3, 90), k = ns / v.s; v.fit = false; v.ox = cx - (cx - v.ox) * k; v.oy = cy - (cy - v.oy) * k; v.s = ns; draw2D(); };
    switch (a.dataset.act) {
      case 'undo': undo(); break; case 'redo': redo(); break;
      case 'zin': zoom(1.25); break; case 'zout': zoom(0.8); break;
      case 'fit': v.fit = true; draw2D(); break;
      case 'snap': Plan.snap = !Plan.snap; renderTools(); break;
      case 'decor': Plan.decor = Plan.decor === false; renderTools(); draw2D(); break;
    }
  });
  $('#tools').addEventListener('change', ev => { if (ev.target.id === 'roomKind') Plan.roomKind = ev.target.value; });
}

/* ---------- Panneau de droite ---------- */
const fld = (label, k, val, o = {}) => `<label class="f ${o.wide ? 'wide' : ''}"><span>${label}</span><input data-k="${k}" type="${o.type || 'number'}" ${o.type === 'text' ? 'maxlength="40"' : `step="${o.step || 0.5}"`} value="${esc(typeof val === 'number' ? +val.toFixed(2) : val)}"></label>`;
const selF = (label, k, val, opts, wide) => `<label class="f ${wide ? 'wide' : ''}"><span>${label}</span><select data-k="${k}">${opts.map(([v, t]) => `<option value="${v}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
const MINS = { w: 0.5, d: 0.5, r: 0.3, h: 1, base: 1, pos: 0.2, tw: 5, td: 5 };

function renderSide() {
  const side = $('#side'); if (!side) return;
  const b = curB(), e = Plan.tab === '2d' ? b.elements.find(x => x.id === Plan.sel) : null;
  let html = '';
  const TN = { equip: 'Machine / équipement', room: 'Pièce', open: 'Ouverture', roof: 'Toit', tree: 'Arbre', bed: 'Potager / parterre', pond: 'Bassin', path: 'Allée / cour', fence: 'Clôture' };
  if (e) {
    let f = '';
    if (e.t === 'room') f = fld('Nom', 'name', e.name, { type: 'text', wide: 1 }) + selF('Type de pièce', 'kind', e.kind, Object.entries(KINDS).map(([k, v]) => [k, v[0]]), 1) +
      fld('Position x (m)', 'x', e.x) + fld('Position y (m)', 'y', e.y) + fld('Largeur (m)', 'w', e.w) + fld('Profondeur (m)', 'd', e.d) + fld('Hauteur des murs (m)', 'h', e.h, { wide: 1 });
    else if (e.t === 'open') f = selF('Type', 'kind', e.kind, [['door', 'Porte'], ['window', 'Fenêtre'], ['gate', 'Portail / rideau']], 1) + fld('Largeur (m)', 'w', e.w) + fld('Position sur le mur (m)', 'pos', e.pos, { step: 0.25 });
    else if (e.t === 'roof') f = selF('Forme du toit', 'type', e.type, [['pente', 'Deux pentes'], ['plat', 'Plat (dalle)']], 1) + fld('Hauteur de départ (m)', 'base', e.base, { wide: 1 }) +
      fld('Position x (m)', 'x', e.x) + fld('Position y (m)', 'y', e.y) + fld('Largeur (m)', 'w', e.w) + fld('Profondeur (m)', 'd', e.d);
    else if (e.t === 'equip') f = fld('Nom', 'name', e.name, { type: 'text', wide: 1 }) + fld('Position x (m)', 'x', e.x, { step: 0.25 }) + fld('Position y (m)', 'y', e.y, { step: 0.25 }) +
      fld('Largeur (m)', 'w', e.w, { step: 0.1 }) + fld('Profondeur (m)', 'd', e.d, { step: 0.1 }) + fld('Hauteur (m)', 'h', e.h, { step: 0.1, wide: 1 });
    else if (e.t === 'tree') f = fld('Nom', 'name', e.name, { type: 'text', wide: 1 }) + fld('Position x (m)', 'x', e.x) + fld('Position y (m)', 'y', e.y) + fld('Rayon (m)', 'r', e.r, { step: 0.1 }) + fld('Hauteur (m)', 'h', e.h);
    else if (e.t === 'fence') f = fld('x départ', 'x1', e.x1) + fld('y départ', 'y1', e.y1) + fld('x arrivée', 'x2', e.x2) + fld('y arrivée', 'y2', e.y2) + fld('Hauteur (m)', 'h', e.h, { wide: 1 });
    else f = fld('Nom', 'name', e.name, { type: 'text', wide: 1 }) + fld('Position x (m)', 'x', e.x) + fld('Position y (m)', 'y', e.y) + fld('Largeur (m)', 'w', e.w) + fld('Profondeur (m)', 'd', e.d);
    const area = RECTS.includes(e.t) ? `<div class="stat"><span>Surface</span><b id="selArea">${fm1(e.w * e.d)} m²</b></div>` : '';
    html += `<div class="card"><h3>${TN[e.t]}</h3><div class="fields">${f}</div>${area}
      ${e.t === 'equip' ? `<p class="note">Ligne de matériels : <b>${esc(CAT_BY_KEY[e.k] ? CAT_BY_KEY[e.k].n : e.name)}</b>. Poser ou supprimer une machine met à jour sa quantité.</p>` : ''}
      <div class="btnrow">${e.t === 'equip' ? '<button class="btn sm" data-act="rot">Pivoter de 90°</button>' : ''}${e.t !== 'open' ? `<button class="btn sm" data-act="dup">${ic('copy').replace('<svg', '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"')}Dupliquer</button>` : ''}<button class="btn sm danger" data-act="del">Supprimer</button></div></div>`;
  }
  const s = stats(b);
  const tplOpts = Object.entries(TPL).map(([k, t]) => [k, t.sublabel && !t.sub ? t.sublabel : t.label]);
  const terrainF = Plan.tab === '2d' ? `<div class="fields" style="margin-top:10px">${fld('Terrain : largeur (m)', 'tw', b.tw, { step: 1 })}${fld('Terrain : profondeur (m)', 'td', b.td, { step: 1 })}
    ${selF('Type d\'entreprise (palette et matériels)', 'tpl', b.tpl || 'vide', tplOpts, 1)}</div>` : '';
  html += `<div class="card"><h3>${esc(b.name)} en chiffres</h3>
    <div class="stat"><span>Pièces</span><b>${s.rooms}</b></div>
    <div class="stat"><span>Surface au sol</span><b>${fm1(s.floor)} m²</b></div>
    <div class="stat"><span>Terrain</span><b>${fmt(s.terrain)} m² (${s.terrain ? Math.round(100 * s.floor / s.terrain) : 0} % bâti)</b></div>
    <div class="stat"><span>Longueur de murs</span><b>${fm1(s.wallLen)} m</b></div>
    <div class="stat"><span>Portes · fenêtres · portails</span><b>${s.doors} · ${s.windows} · ${s.gates}</b></div>
    <div class="stat"><span>Surface de toiture</span><b>${fm1(s.roofs)} m²</b></div>
    <div class="stat"><span>Machines et équipements posés</span><b>${s.equips}</b></div>
    ${terrainF}</div>
    <div class="card"><h3>Quantités estimées d'après le plan</h3>
    <div class="stat"><span>Parpaings (10 par m², +5 %)</span><b>${fmt(s.parpaings)}</b></div>
    <div class="stat"><span>Tôles de 3 m (+10 %)</span><b>${fmt(s.tole)}</b></div>
    <div class="stat"><span>Carrelage</span><b>${fm1(s.tile)} m²</b></div>
    <div class="btnrow"><button class="btn sm primary" data-act="applyq">Reporter dans Matériels</button></div>
    <p class="note">Indications simples, à faire confirmer par votre maçon. Les murs sont comptés avec ${WT * 100} cm d'épaisseur.</p></div>`;
  if (Plan.tab === '2d' && !e) html += `<div class="card"><h3>Légende</h3>
    <div class="stat"><span><i class="swatch" style="background:var(--wall)"></i>Mur</span><span></span></div>
    <div class="stat"><span><i class="swatch" style="background:#5aa6d4"></i>Fenêtre</span><span><i class="swatch" style="background:#8a5a3b"></i>Porte</span></div>
    <div class="stat"><span><i class="swatch" style="background:var(--roof)"></i>Toit (pointillés)</span><span><i class="swatch" style="background:#8b6b4a"></i>Clôture</span></div></div>`;
  side.innerHTML = html;
  side.dataset.label = e ? TN[e.t] + (e.name ? ' · ' + e.name : '') : 'Propriétés et chiffres';
}
function updateFieldValues() {
  const b = curB(), e = b.elements.find(x => x.id === Plan.sel); if (!e) return;
  $$('#side [data-k]').forEach(i => { if (document.activeElement !== i && e[i.dataset.k] !== undefined && i.type === 'number') i.value = +(+e[i.dataset.k]).toFixed(2); });
  const a = $('#selArea'); if (a && RECTS.includes(e.t)) a.textContent = fm1(e.w * e.d) + ' m²';
}
function initSide() {
  const side = $('#side');
  side.addEventListener('input', ev => {
    const i = ev.target.closest('[data-k]'); if (!i) return;
    const b = curB(), k = i.dataset.k;
    const target = (k === 'tw' || k === 'td' || k === 'tpl') ? b : b.elements.find(x => x.id === Plan.sel); if (!target) return;
    let val = i.value;
    if (i.type === 'number') {
      val = parseFloat(val); if (!Number.isFinite(val)) return;
      const mn = (target.t === 'equip' && ['w', 'd', 'h'].includes(k)) ? 0.1 : MINS[k];
      if (mn !== undefined) val = Math.max(mn, val);
    }
    if (k === 'tpl') { target.tpl = val; save(); renderPalette(); renderSide(); toast('Palette adaptée : ' + (TPL[val] ? TPL[val].label : val)); return; }
    pushUndo('p' + k + (target.id || ''));
    target[k] = val; save(); draw2D();
    const a = $('#selArea'); if (a && RECTS.includes(target.t)) a.textContent = fm1(target.w * target.d) + ' m²';
    if (i.tagName === 'SELECT' || k === 'tw' || k === 'td') { if (k === 'tw' || k === 'td') getView(b).fit = true; renderSideStatsOnly(); }
    if (k === 'tw' || k === 'td') draw2D();
  });
  side.addEventListener('click', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'del') deleteSel();
    if (a.dataset.act === 'dup') duplicateSel();
    if (a.dataset.act === 'rot') { const e = curB().elements.find(x => x.id === Plan.sel); if (e) { pushUndo(); [e.w, e.d] = [e.d, e.w]; save(); draw2D(); renderSide(); } }
    if (a.dataset.act === 'applyq') {
      const done = applyQuantities(curB());
      toast(done.length ? 'Quantités reportées — ' + done.join(' · ') : 'Rien à reporter : ajoutez des pièces et un toit au plan.');
    }
  });
}
function renderSideStatsOnly() { /* met à jour les chiffres sans perdre le focus du champ */
  const act = document.activeElement, k = act && act.dataset && act.dataset.k, val = act && act.value, wasSel = act && act.tagName === 'SELECT';
  renderSide();
  if (k && !wasSel) { const n = $(`#side [data-k="${k}"]`); if (n) { n.focus(); n.value = val; try { n.setSelectionRange(val.length, val.length); } catch (e) { /* number */ } } }
}

/* ---------- Étapes de construction ---------- */
function renderSteps() {
  const b = curB(), box = $('#stepsView');
  let t = 0, d = 0; b.steps.forEach(p => p.items.forEach(i => { t++; if (i.done) d++; }));
  const pct = t ? Math.round(100 * d / t) : 0;
  box.innerHTML = `<div class="steps-head"><div><h2 class="page-title">Étapes de construction — ${esc(b.name)}</h2>
      <p class="page-sub" style="margin:0">Cochez au fur et à mesure. Ajoutez vos propres tâches ou phases.</p></div>
      <div class="bigbar" title="${pct} %"><i style="width:${pct}%"></i></div><b>${d} / ${t} faites (${pct} %)</b>
      <button class="btn" data-act="addphase">+ Nouvelle phase</button></div>
    <div class="phases">${b.steps.map((p, n) => {
    const done = p.items.filter(i => i.done).length, all = p.items.length;
    return `<article class="card phase ${all && done === all ? 'done' : ''}" data-p="${p.id}">
        <header><span class="num">${all && done === all ? '✓' : n + 1}</span><h3>${esc(p.title)}</h3><span class="cnt">${done}/${all}</span>
        <button class="x" data-act="delphase" title="Supprimer la phase">×</button></header>
        ${p.items.map(i => `<div class="chk ${i.done ? 'done' : ''}"><input type="checkbox" data-i="${i.id}" ${i.done ? 'checked' : ''} aria-label="${esc(i.t)}"><span>${esc(i.t)}</span><button class="x" data-act="delitem" data-i="${i.id}" title="Supprimer">×</button></div>`).join('')}
        <form class="addline" data-act="additem"><input type="text" placeholder="Ajouter une tâche…" maxlength="120"><button class="btn sm">Ajouter</button></form></article>`;
  }).join('')}</div>`;
}
function initSteps() {
  const box = $('#stepsView');
  box.addEventListener('change', ev => {
    const c = ev.target.closest('input[type=checkbox][data-i]'); if (!c) return;
    const b = curB(), p = b.steps.find(x => x.id === c.closest('[data-p]').dataset.p), it = p.items.find(x => x.id === c.dataset.i);
    it.done = c.checked; save(); renderSteps();
  });
  box.addEventListener('submit', ev => {
    ev.preventDefault(); const f = ev.target.closest('form'); const inp = $('input', f); const txt = inp.value.trim(); if (!txt) return;
    const p = curB().steps.find(x => x.id === f.closest('[data-p]').dataset.p); p.items.push({ id: uid(), t: txt, done: false }); save(); renderSteps();
  });
  box.addEventListener('click', ev => {
    const a = ev.target.closest('button[data-act]'); if (!a) return; const b = curB();
    if (a.dataset.act === 'addphase') { const n = prompt('Nom de la nouvelle phase :'); if (n && n.trim()) { b.steps.push({ id: uid(), title: n.trim().slice(0, 60), open: true, items: [] }); save(); renderSteps(); } }
    const card = a.closest('[data-p]'); if (!card) return; const p = b.steps.find(x => x.id === card.dataset.p);
    if (a.dataset.act === 'delitem') { p.items = p.items.filter(i => i.id !== a.dataset.i); save(); renderSteps(); }
    if (a.dataset.act === 'delphase' && confirm(`Supprimer la phase « ${p.title} » ?`)) { b.steps = b.steps.filter(x => x.id !== p.id); save(); renderSteps(); }
  });
}

/* ---------- Palette : glisser-déposer ---------- */
const ROOM_SIZES = { salon: [5, 4], chambre: [4, 3.5], cuisine: [3.5, 3], sdb: [2.5, 2.5], wc: [1.5, 1.5], bureau: [3.5, 3.5], boutique: [8, 6], reserve: [4, 4],
  atelier: [12, 8, 4.5], hangar: [15, 8, 4.5], etable: [12, 6], poulailler: [10, 5], vestiaire: [3, 3], garage: [3, 5.5], couloir: [1.2, 4], autre: [3, 3],
  cuve: [8, 8, 4.5], technique: [4, 4], fabrication: [10, 8, 4.5], sechage: [8, 6, 3.5], conditionnement: [8, 6, 3.5], stockmp: [6, 5, 3.5], stockfini: [8, 5, 3.5],
  labo: [4, 3.5, 3], reception: [10, 8, 3.5] };
const OPEN_W = { door: 0.9, window: 1.2, gate: 3 };
const OPEN_NAME = { door: 'Porte', window: 'Fenêtre', gate: 'Portail / rideau' };
const roomItem = k => ['room:' + k, KINDS[k][0], `${ROOM_SIZES[k][0]}×${ROOM_SIZES[k][1]} m`, 'sw:' + KINDS[k][1]];
const eqItem = k => ['eq:' + k, eqShort(k), `${EQ[k][0]}×${EQ[k][1]} m`, 'sw:' + eqColor(k)];
/* Groupes de la palette selon le type d'entreprise du bâtiment : [titre, éléments, repliable ?] */
function palGroups(b) {
  const ent = ENT[b.tpl] || ENT.vide, all = Object.keys(KINDS), mine = ent.rooms || all, others = all.filter(k => !mine.includes(k));
  const g = [['Pièces' + (ent.rooms ? ' de l\'entreprise' : ''), mine.map(roomItem), false]];
  ent.equip.forEach(([title, keys]) => { const items = keys.filter(k => EQ[k] && CAT_BY_KEY[k]).map(eqItem); if (items.length) g.push(['Machines : ' + title, items, true]); });
  g.push(['Ouvertures (sur un mur)', ['door', 'window', 'gate'].map(k => ['open:' + k, OPEN_NAME[k], `${OPEN_W[k]} m`, k]), false]);
  g.push(['Toits', [['roof:pente', 'Toit à deux pentes', '8×6 m', 'roof'], ['roof:plat', 'Toit plat', '8×6 m', 'roof']], false]);
  g.push(['Extérieur', [['tree', 'Arbre', '', 'tree'], ['bed', 'Potager / parterre', '4×3 m', 'bed'], ['pond', 'Bassin', '3×3 m', 'pond'], ['path', 'Allée / cour', '4×1,2 m', 'path'], ['fence', 'Clôture', '4 m', 'fence']], false]);
  if (others.length) g.push(['Autres types de pièces', others.map(roomItem), true]);
  return g;
}
function specOf(key) {
  const [t, v] = key.split(':');
  if (t === 'eq') { const [w, d, h, round] = EQ[v]; return { t: 'equip', k: v, w, d, h, round: !!round, name: eqShort(v) }; }
  if (t === 'room') { const [w, d, h] = ROOM_SIZES[v]; return { t, kind: v, w, d, h: h || 3, name: KINDS[v][0].split(' / ')[0] }; }
  if (t === 'roof') return { t, type: v, base: 3, w: 8, d: 6 };
  if (t === 'open') return { t, kind: v, w: OPEN_W[v] };
  if (t === 'tree') return { t, r: 2, h: 5, name: 'Arbre' };
  if (t === 'bed') return { t, w: 4, d: 3, name: 'Potager' };
  if (t === 'pond') return { t, w: 3, d: 3, name: 'Bassin' };
  if (t === 'path') return { t, w: 4, d: 1.2, name: 'Allée' };
  return { t: 'fence', h: 1.8 };
}
/* Colle les bords d'une pièce ou d'un toit à ceux des pièces voisines (à moins de 0,5 m) */
function magnet(e, nx, ny, others) {
  const T = 0.5; let bx = null, by = null;
  const best = (cur, d) => (Math.abs(d) <= T && (cur === null || Math.abs(d) < Math.abs(cur))) ? d : cur;
  others.forEach(o => {
    [o.x - nx, o.x + o.w - nx, o.x - (nx + e.w), o.x + o.w - (nx + e.w)].forEach(d => { bx = best(bx, d); });
    [o.y - ny, o.y + o.d - ny, o.y - (ny + e.d), o.y + o.d - (ny + e.d)].forEach(d => { by = best(by, d); });
  });
  return [nx + (bx || 0), ny + (by || 0)];
}
/* Crée l'élément correspondant à une entrée de palette posé en (wx, wy) ; null si impossible (ex. porte hors mur) */
function createAt(key, wx, wy) {
  const s = specOf(key), b = curB();
  if (s.t === 'open') {
    const n = nearestSide(wx, wy); if (!n) return null;
    const len = n.side === 'N' || n.side === 'S' ? n.room.w : n.room.d, w = Math.min(s.w, len);
    return { id: uid(), t: 'open', kind: s.kind, room: n.room.id, side: n.side, pos: clamp(roundTo(n.pos, 0.25), w / 2, Math.max(w / 2, len - w / 2)), w };
  }
  if (s.t === 'tree') return { id: uid(), t: 'tree', x: sn(wx), y: sn(wy), r: s.r, h: s.h, name: s.name };
  if (s.t === 'fence') return { id: uid(), t: 'fence', x1: sn(wx) - 2, y1: sn(wy), x2: sn(wx) + 2, y2: sn(wy), h: s.h };
  const sg = s.t === 'equip' ? (q => Plan.snap ? roundTo(q, 0.25) : Math.round(q * 10) / 10) : sn;
  let x = sg(wx - s.w / 2), y = sg(wy - s.d / 2);
  if (Plan.snap && (s.t === 'room' || s.t === 'roof')) [x, y] = magnet(s, x, y, b.elements.filter(e => e.t === 'room'));
  const e = { id: uid(), x, y, ...s };
  if (e.name && e.t !== 'equip') e.name = nextName(e.name);
  return e;
}
/* Vignette dessinée de la vraie forme (machine ou pièce aménagée) pour la palette */
const thumbCache = {};
function thumbOf(key) {
  const ink = cssv('--wall') || '#2b2f2c', ck = key + ink; if (thumbCache[ck]) return thumbCache[ck];
  const cv = document.createElement('canvas'), W = 96, H = 80; cv.width = W; cv.height = H; const ctx = cv.getContext('2d'), [t, v] = key.split(':');
  if (t === 'eq') {
    const s = specOf(key), sc = Math.min((W - 12) / s.w, (H - 12) / s.d);
    ctx.translate((W - s.w * sc) / 2, (H - s.d * sc) / 2); ctx.scale(sc, sc); drawSym(ctx, eqSymOf(v), 0, 0, s.w, s.d, 1 / sc, eqColor(v), ink);
  } else if (t === 'room') {
    const [w, d] = ROOM_SIZES[v], sc = Math.min((W - 10) / w, (H - 10) / d), r = { kind: v, x: 0, y: 0, w, d, h: 3 };
    ctx.translate((W - w * sc) / 2, (H - d * sc) / 2); ctx.scale(sc, sc); ctx.fillStyle = KINDS[v][1]; ctx.fillRect(0, 0, w, d);
    drawRoomFloor(ctx, r, 1 / sc, ink, Math.max(sc, 8)); drawRoomDecor(ctx, r, 1 / sc, ink, Math.max(sc, 8));
    ctx.strokeStyle = ink; ctx.lineWidth = 3 / sc; ctx.strokeRect(0, 0, w, d);
  } else return '';
  return (thumbCache[ck] = cv.toDataURL());
}
function renderPalette() {
  const pal = $('#palette'); if (!pal) return;
  const b = curB(), openKey = Plan.palOpen || (Plan.palOpen = {});
  pal.innerHTML = `<p class="tip">Glissez un élément sur le plan, ou cliquez-le pour le poser au centre de la vue. ${b.tpl && TPL[b.tpl] && b.tpl !== 'vide' ? `<b>${esc(TPL[b.tpl].label)}</b> : ses pièces et ses machines sont ci-dessous.` : ''}</p>` +
    palGroups(b).map(([title, items, fold]) => {
      const body = items.map(([key, label, size, look]) => {
        const th = (key.startsWith('eq:') || key.startsWith('room:')) ? thumbOf(key) : '';
        const mark = th ? `<img class="pt" src="${th}" alt="" width="48" height="40">` : look.startsWith('sw:') ? `<i style="background:${look.slice(3)}">${esc(label.trim()[0])}</i>` : `<span aria-hidden="true">${ic(IC[look] ? look : 'room')}</span>`;
        return `<button class="pal" data-pal="${key}" title="${esc(label)}">${mark}<span class="pl">${esc(label)}</span>${size ? `<small>${size}</small>` : ''}</button>`;
      }).join('');
      return fold ? `<details class="pdet" data-g="${esc(title)}" ${(openKey[title] || window.innerWidth <= 1100) ? 'open' : ''}><summary>${esc(title)} <small>(${items.length})</small></summary><div class="pgroup">${body}</div></details>`
        : `<h3>${esc(title)}</h3><div class="pgroup">${body}</div>`;
    }).join('');
}
function initPalette() {
  const pal = $('#palette'), cv = $('#c2d');
  pal.addEventListener('toggle', ev => { const d = ev.target.closest && ev.target.closest('details[data-g]'); if (d) (Plan.palOpen || (Plan.palOpen = {}))[d.dataset.g] = d.open; }, true);
  pal.addEventListener('pointerdown', ev => {
    const it = ev.target.closest('[data-pal]'); if (!it || ev.button > 0) return;
    ev.preventDefault();
    const key = it.dataset.pal, start = [ev.clientX, ev.clientY]; let ghost = null, dragging = false;
    const worldAt = e => { const r = cv.getBoundingClientRect(), v = getView(), px = e.clientX - r.left, py = e.clientY - r.top; return (px < 0 || py < 0 || px > r.width || py > r.height) ? null : { x: (px - v.ox) / v.s, y: (py - v.oy) / v.s }; };
    const move = e => {
      if (!dragging && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) {
        dragging = true; ghost = document.createElement('div'); ghost.className = 'dragghost'; ghost.textContent = it.title; document.body.appendChild(ghost);
        if (Plan.tool !== 'select') setTool('select');
      }
      if (!dragging) return;
      ghost.style.transform = `translate(${e.clientX + 12}px,${e.clientY + 12}px)`;
      const w = worldAt(e); Plan.ghost = w ? { key, x: w.x, y: w.y } : null; draw2D();
    };
    const end = e => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
      if (ghost) ghost.remove(); Plan.ghost = null;
      if (!dragging) { const v = getView(), W = cv.width / (cv._dpr || 1), H = cv.height / (cv._dpr || 1); return dropAt(key, (W / 2 - v.ox) / v.s, (H / 2 - v.oy) / v.s, true); }
      const w = e.type === 'pointerup' ? worldAt(e) : null;
      if (w) dropAt(key, w.x, w.y, false); else draw2D();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  });
}
function dropAt(key, wx, wy, fromClick) {
  if (Plan.tool !== 'select') setTool('select');
  if (key.startsWith('open:') && fromClick) { toast('Glissez la porte ou la fenêtre sur un mur d\'une pièce.'); return; }
  const e = createAt(key, wx, wy);
  if (!e) { toast('Déposez-la sur un mur d\'une pièce.'); draw2D(); return; }
  addEl(e);
}

/* ---------- Page ---------- */
function renderPlan() {
  $$('#planTabs button').forEach(bt => bt.classList.toggle('on', bt.dataset.t === Plan.tab));
  const steps = Plan.tab === 'steps';
  $('#planDraw').hidden = steps; $('#stepsView').hidden = !steps;
  if (steps) return renderSteps();
  $('#c2d').hidden = Plan.tab !== '2d'; $('#c3d').hidden = Plan.tab !== '3d';
  $('#planDraw').classList.toggle('no-pal', Plan.tab !== '2d');
  if (Plan.tab === '2d') renderPalette();
  renderTools(); renderSide(); resizeCanvases();
  if (Plan.tab === '2d') draw2D(); else { View3D.ensure(); View3D.draw(); }
}
function initPlan() {
  $('#planTabs').addEventListener('click', ev => {
    const t = ev.target.closest('[data-t]'); if (!t) return;
    Plan.tab = t.dataset.t; renderPlan();
  });
  renderPalette(); initPalette(); initEditor(); initTools(); initSide(); initSteps();
}
