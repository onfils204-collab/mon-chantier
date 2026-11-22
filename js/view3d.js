'use strict';
/* ===== Vue 3D : rendu logiciel sur canvas 2D (aucune bibliothèque, fonctionne hors ligne) ===== */
const View3D = (() => {
  const cams = {};
  const opt = { roof: true, trees: true };
  let attached = false;
  const LIGHT = (() => { const l = [-0.45, 0.85, 0.4], n = Math.hypot(...l); return l.map(v => v / n); })();

  const hex = c => { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
  const defCam = b => ({ yaw: 0.6, pitch: 0.62, dist: Math.max(b.tw, b.td) * 1.25, tx: b.tw / 2, ty: 0, tz: b.td / 2 });
  function cam() { const b = curB(); return cams[b.id] || (cams[b.id] = defCam(b)); }
  function ensure() { cam(); if (!attached) { attach(); attached = true; } }

  /* ----- construction de la scène ----- */
  function buildScene(b) {
    const flats = [], objs = [];
    const box = (x0, y0, z0, x1, y1, z1, col, a = 1) => objs.push({ t: 'box', x0, y0, z0, x1, y1, z1, col, a, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2 });
    const poly = (pts, col, a = 1) => objs.push({ t: 'poly', pts, col, a, cx: pts.reduce((s, p) => s + p[0], 0) / pts.length, cy: pts.reduce((s, p) => s + p[1], 0) / pts.length, cz: pts.reduce((s, p) => s + p[2], 0) / pts.length });
    const flat = (pts, col, a = 1) => flats.push({ pts, col, a });
    const rect = (e, y) => [[e.x, y, e.y], [e.x + e.w, y, e.y], [e.x + e.w, y, e.y + e.d], [e.x, y, e.y + e.d]];
    const els = b.elements;

    els.filter(e => e.t === 'path').forEach(e => flat(rect(e, 0.01), [205, 191, 166]));
    els.filter(e => e.t === 'room').forEach(e => flat(rect(e, 0.03), hex((KINDS[e.kind] || KINDS.autre)[1])));
    els.filter(e => e.t === 'pond').forEach(e => {
      const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([e.x + e.w / 2 + Math.cos(a) * e.w / 2, 0.04, e.y + e.d / 2 + Math.sin(a) * e.d / 2]); }
      flat(pts, [86, 160, 205], 0.92);
    });
    els.filter(e => e.t === 'bed').forEach(e => {
      box(e.x, 0, e.y, e.x + e.w, 0.3, e.y + e.d, [128, 96, 62]);
      const step = Math.max(0.9, Math.sqrt(e.w * e.d / 90));
      for (let x = e.x + step / 2; x < e.x + e.w; x += step) for (let z = e.y + step / 2; z < e.y + e.d; z += step)
        objs.push({ t: 'sprite', cx: x, cy: 0.55, cz: z, r: 0.3, col: (Math.floor(x * 7 + z * 13) % 3) ? [88, 150, 64] : [112, 168, 72] });
    });

    // machines et équipements
    const addPrims = (prims, ox, oz) => prims.forEach(p => {
      const col = hexRgb(p.col || '#999999');
      if (p.k === 'box') box(p.x0 + ox, p.y0, p.z0 + oz, p.x1 + ox, p.y1, p.z1 + oz, col, p.a || 1);
      else if (p.k === 'cyl') objs.push({ t: 'cyl', p0: [p.p0[0] + ox, p.p0[1], p.p0[2] + oz], p1: [p.p1[0] + ox, p.p1[1], p.p1[2] + oz], a: p.a, b: p.b, r0: p.r0, r1: p.r1, col, cx: (p.p0[0] + p.p1[0]) / 2 + ox, cy: (p.p0[1] + p.p1[1]) / 2, cz: (p.p0[2] + p.p1[2]) / 2 + oz });
      else if (p.k === 'pyr') objs.push({ t: 'pyr', y0: p.y0, y1: p.y1, b: [p.b[0] + ox, p.b[1] + oz, p.b[2] + ox, p.b[3] + oz], tp: [p.tp[0] + ox, p.tp[1] + oz, p.tp[2] + ox, p.tp[3] + oz], col, cx: (p.tp[0] + p.tp[2]) / 2 + ox, cy: (p.y0 + p.y1) / 2, cz: (p.tp[1] + p.tp[3]) / 2 + oz });
      else if (p.k === 'sph') objs.push({ t: 'sprite', cx: p.cx + ox, cy: p.cy, cz: p.cz + oz, r: p.r, col, big: false });
    });
    els.filter(e => e.t === 'equip').forEach(e => addPrims(modelOf(eqSymOf(e.k), e.w, e.d, e.h, eqColor(e.k)), e.x, e.y));
    if (Plan.decor !== false) els.filter(e => e.t === 'room').forEach(r => roomDecor(r.kind, r.w, r.d, r.h).forEach(([s, x, y, iw, id, col, h]) => addPrims(modelOf(s, iw, id, h, col), r.x + x, r.y + y)));

    // murs
    const wallCol = [238, 230, 212];
    wallParts(computeWalls(b)).forEach(({ p, solids, gaps }) => {
      const h = p.h;
      const bx = (a0, a1, y0, y1, col, a, th = WT / 2) => p.axis === 'h' ? box(a0, y0, p.c - th, a1, y1, p.c + th, col, a) : box(p.c - th, y0, a0, p.c + th, y1, a1, col, a);
      solids.forEach(([s0, s1]) => { const n = Math.max(1, Math.ceil((s1 - s0) / 1.5)); for (let i = 0; i < n; i++) bx(s0 + (s1 - s0) * i / n, s0 + (s1 - s0) * (i + 1) / n, 0, h, wallCol); });
      gaps.forEach(g => {
        const [z0, z1] = openZ(g.op.o.kind, h, g.op.o), k = g.op.o.kind;
        if (z1 < h - 0.01) bx(g.a0, g.a1, z1, h, wallCol);
        if (z0 > 0.01) bx(g.a0, g.a1, 0, z0, wallCol);
        if (k === 'door') bx(g.a0 + 0.04, g.a1 - 0.04, 0, z1, [138, 90, 59], 1, 0.04);
        else if (k === 'window') bx(g.a0, g.a1, z0, z1, [150, 205, 235], 0.5, 0.03);
        else bx(g.a0, g.a1, 0, z1, [118, 134, 150], 1, 0.05);
      });
    });

    // toits
    if (opt.roof) els.filter(e => e.t === 'roof').forEach(r => {
      const ov = 0.4, X0 = r.x - ov, X1 = r.x + r.w + ov, Z0 = r.y - ov, Z1 = r.y + r.d + ov, base = r.base;
      if (r.type === 'plat') {
        const nx = Math.ceil((X1 - X0) / 2.5), nz = Math.ceil((Z1 - Z0) / 2.5);
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) box(X0 + (X1 - X0) * i / nx, base, Z0 + (Z1 - Z0) * j / nz, X0 + (X1 - X0) * (i + 1) / nx, base + 0.22, Z0 + (Z1 - Z0) * (j + 1) / nz, [186, 180, 166]);
        return;
      }
      const rise = roofRise(r), eave = base - 0.12, ridge = base + rise, col = hexRgb(cssv('--roof') || '#b25e42'), gab = [236, 228, 210];
      if (r.w >= r.d) {
        const zm = (Z0 + Z1) / 2, n = Math.ceil((X1 - X0) / 2);
        for (let i = 0; i < n; i++) {
          const xa = X0 + (X1 - X0) * i / n, xb = X0 + (X1 - X0) * (i + 1) / n;
          [Z0, Z1].forEach(zs => { for (let j = 0; j < 2; j++) { const t0 = j / 2, t1 = (j + 1) / 2, za = zs + (zm - zs) * t0, zb = zs + (zm - zs) * t1, ya = eave + (ridge - eave) * t0, yb = eave + (ridge - eave) * t1; poly([[xa, ya, za], [xb, ya, za], [xb, yb, zb], [xa, yb, zb]], col); } });
        }
        [X0, X1].forEach(xe => poly([[xe, eave, Z0], [xe, eave, Z1], [xe, ridge, zm]], gab));
      } else {
        const xm = (X0 + X1) / 2, n = Math.ceil((Z1 - Z0) / 2);
        for (let i = 0; i < n; i++) {
          const za = Z0 + (Z1 - Z0) * i / n, zb = Z0 + (Z1 - Z0) * (i + 1) / n;
          [X0, X1].forEach(xs => { for (let j = 0; j < 2; j++) { const t0 = j / 2, t1 = (j + 1) / 2, xa = xs + (xm - xs) * t0, xb = xs + (xm - xs) * t1, ya = eave + (ridge - eave) * t0, yb = eave + (ridge - eave) * t1; poly([[xa, ya, za], [xa, ya, zb], [xb, yb, zb], [xb, yb, za]], col); } });
        }
        [Z0, Z1].forEach(ze => poly([[X0, eave, ze], [X1, eave, ze], [xm, ridge, ze]], gab));
      }
    });

    // clôtures
    els.filter(e => e.t === 'fence').forEach(e => {
      const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1), n = Math.max(1, Math.round(L / 2));
      for (let i = 0; i <= n; i++) { const x = e.x1 + (e.x2 - e.x1) * i / n, z = e.y1 + (e.y2 - e.y1) * i / n; box(x - 0.06, 0, z - 0.06, x + 0.06, e.h, z + 0.06, [120, 90, 60]); }
      for (let i = 0; i < n; i++) {
        const xa = e.x1 + (e.x2 - e.x1) * i / n, za = e.y1 + (e.y2 - e.y1) * i / n, xb = e.x1 + (e.x2 - e.x1) * (i + 1) / n, zb = e.y1 + (e.y2 - e.y1) * (i + 1) / n;
        poly([[xa, e.h * 0.2, za], [xb, e.h * 0.2, zb], [xb, e.h * 0.92, zb], [xa, e.h * 0.92, za]], [150, 120, 84], 0.55);
      }
    });

    // arbres
    if (opt.trees) els.filter(e => e.t === 'tree').forEach(e => {
      const sh = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sh.push([e.x + 0.5 + Math.cos(a) * e.r * 0.95, 0.05, e.y + 0.4 + Math.sin(a) * e.r * 0.7]); }
      flat(sh, [20, 40, 20], 0.2);
      const th = e.h * 0.5; box(e.x - 0.12, 0, e.y - 0.12, e.x + 0.12, th, e.y + 0.12, [112, 78, 48]);
      objs.push({ t: 'sprite', cx: e.x, cy: th + e.r * 0.65, cz: e.y, r: e.r, col: [58, 130, 66], big: true });
    });
    return { flats, objs };
  }

  /* ----- rendu ----- */
  function draw() {
    if (S.page !== 'plan' || Plan.tab !== '3d') return;
    const cv = $('#c3d'), ctx = cv.getContext('2d'), dpr = cv._dpr || 1, W = cv.width / dpr, H = cv.height / dpr;
    if (W < 10) return;
    const b = curB(), c = cam();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dark = isDark();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cssv('--sky1') || '#cfe2ee'); g.addColorStop(1, cssv('--sky2') || '#efeadb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const cp = Math.cos(c.pitch), pos = [c.tx + c.dist * cp * Math.sin(c.yaw), c.ty + c.dist * Math.sin(c.pitch), c.tz + c.dist * cp * Math.cos(c.yaw)];
    const sub = (a, b2) => [a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]], dot = (a, b2) => a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2];
    const crs = (a, b2) => [a[1] * b2[2] - a[2] * b2[1], a[2] * b2[0] - a[0] * b2[2], a[0] * b2[1] - a[1] * b2[0]];
    const nrm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const f = nrm(sub([c.tx, c.ty, c.tz], pos)), r = nrm(crs(f, [0, 1, 0])), u = crs(r, f), fl = H * 1.05, near = 0.3;
    const toCam = p => { const d = sub(p, pos); return { x: dot(d, r), y: dot(d, u), z: dot(d, f) }; };
    const clip = pts => {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b2 = pts[(i + 1) % pts.length], ai = a.z >= near, bi = b2.z >= near;
        if (ai) out.push(a);
        if (ai !== bi) { const t = (near - a.z) / (b2.z - a.z); out.push({ x: a.x + (b2.x - a.x) * t, y: a.y + (b2.y - a.y) * t, z: near }); }
      }
      return out;
    };
    const fillPoly = (pts3, col, shade, alpha, edge) => {
      const cl = clip(pts3.map(toCam)); if (cl.length < 3) return;
      ctx.beginPath();
      cl.forEach((q, i) => { const sx = W / 2 + fl * q.x / q.z, sy = H / 2 - fl * q.y / q.z; i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
      ctx.closePath();
      ctx.fillStyle = `rgba(${Math.round(col[0] * shade)},${Math.round(col[1] * shade)},${Math.round(col[2] * shade)},${alpha})`; ctx.fill();
      if (edge) { ctx.strokeStyle = 'rgba(0,0,0,.26)'; ctx.lineWidth = 0.7; ctx.stroke(); }
    };
    const shadeOf = n => 0.56 + 0.44 * Math.max(0, dot(n, LIGHT));

    const sc = buildScene(b);
    // sol
    const ground = [[0, 0, 0], [b.tw, 0, 0], [b.tw, 0, b.td], [0, 0, b.td]];
    fillPoly(ground, hexRgb(cssv('--grass') || '#b0cd96').map(v => v * (dark ? 1.05 : 0.93)), 1, 1, true);
    sc.flats.forEach(fp => fillPoly(fp.pts, fp.col, 1, fp.a, false));

    // objets triés du plus loin au plus proche
    const dist2 = o => { const dx = o.cx - pos[0], dy = o.cy - pos[1], dz = o.cz - pos[2]; return dx * dx + dy * dy + dz * dz; };
    sc.objs.forEach(o => { o.d = dist2(o); });
    sc.objs.sort((a, b2) => b2.d - a.d);
    for (const o of sc.objs) {
      if (o.t === 'box') {
        const { x0, y0, z0, x1, y1, z1 } = o, faces = [];
        if (pos[1] > y1) faces.push([[0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]]);
        if (pos[2] > z1) faces.push([[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]]);
        if (pos[2] < z0) faces.push([[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]]);
        if (pos[0] > x1) faces.push([[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]]);
        if (pos[0] < x0) faces.push([[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]]);
        faces.forEach(([n, v]) => fillPoly(v, o.col, shadeOf(n), o.a, true));
      } else if (o.t === 'poly') {
        let n = nrm(crs(sub(o.pts[1], o.pts[0]), sub(o.pts[2], o.pts[0])));
        if (dot(n, sub(pos, [o.cx, o.cy, o.cz])) < 0) n = [-n[0], -n[1], -n[2]];
        fillPoly(o.pts, o.col, shadeOf(n), o.a, o.a === 1);
      } else if (o.t === 'cyl') {
        const n = 14, ring = (p, r) => Array.from({ length: n }, (_, i) => {
          const an = i / n * Math.PI * 2, c = Math.cos(an) * r[0], s = Math.sin(an) * r[1];
          return [p[0] + o.a[0] * c + o.b[0] * s, p[1] + o.a[1] * c + o.b[1] * s, p[2] + o.a[2] * c + o.b[2] * s];
        });
        const R0 = ring(o.p0, o.r0), R1 = ring(o.p1, o.r1);
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, am = (i + 0.5) / n * Math.PI * 2, cc = Math.cos(am), ss = Math.sin(am);
          const nv = nrm([o.a[0] * cc + o.b[0] * ss, o.a[1] * cc + o.b[1] * ss, o.a[2] * cc + o.b[2] * ss]);
          const mid = [(R0[i][0] + R1[j][0]) / 2, (R0[i][1] + R1[j][1]) / 2, (R0[i][2] + R1[j][2]) / 2];
          if (dot(nv, sub(pos, mid)) > 0) fillPoly([R0[i], R0[j], R1[j], R1[i]], o.col, shadeOf(nv), 1, false);
        }
        const dir = nrm(sub(o.p1, o.p0));
        if (o.r1[0] > 0.004 && dot(dir, sub(pos, o.p1)) > 0) fillPoly(R1, o.col, shadeOf(dir), 1, true);
        if (o.r0[0] > 0.004 && dot([-dir[0], -dir[1], -dir[2]], sub(pos, o.p0)) > 0) fillPoly(R0, o.col, shadeOf([-dir[0], -dir[1], -dir[2]]), 1, true);
      } else if (o.t === 'pyr') {
        const [bx0, bz0, bx1, bz1] = o.b, [tx0, tz0, tx1, tz1] = o.tp;
        const Bc = [[bx0, o.y0, bz0], [bx1, o.y0, bz0], [bx1, o.y0, bz1], [bx0, o.y0, bz1]], Tc = [[tx0, o.y1, tz0], [tx1, o.y1, tz0], [tx1, o.y1, tz1], [tx0, o.y1, tz1]];
        const faces = [0, 1, 2, 3].map(i => { const j = (i + 1) % 4, q = [Bc[i], Bc[j], Tc[j], Tc[i]], c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2]; return { q, c, d: dist2({ cx: c[0], cy: c[1], cz: c[2] }) }; }).sort((a, b2) => b2.d - a.d);
        faces.forEach(f => { let nn = nrm(crs(sub(f.q[1], f.q[0]), sub(f.q[3], f.q[0]))); if (dot(nn, sub(pos, f.c)) < 0) nn = [-nn[0], -nn[1], -nn[2]]; fillPoly(f.q, o.col, shadeOf(nn), 1, true); });
      } else {
        const q = toCam([o.cx, o.cy, o.cz]); if (q.z < near) continue;
        const sx = W / 2 + fl * q.x / q.z, sy = H / 2 - fl * q.y / q.z, rr = fl * o.r / q.z;
        if (o.big) {
          const gr = ctx.createRadialGradient(sx - rr * 0.3, sy - rr * 0.35, rr * 0.1, sx, sy, rr);
          gr.addColorStop(0, 'rgb(104,176,96)'); gr.addColorStop(1, 'rgb(40,100,52)');
          ctx.fillStyle = gr;
        } else ctx.fillStyle = `rgb(${o.col[0]},${o.col[1]},${o.col[2]})`;
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, rr), 0, 7); ctx.fill();
        if (o.big) { ctx.strokeStyle = 'rgba(20,60,30,.5)'; ctx.lineWidth = 1; ctx.stroke(); }
      }
    }
    // boussole
    // boussole : le nord du plan est la direction -z du monde
    const nvx = -r[2], nvy = u[2], vl = Math.hypot(nvx, nvy) || 1;
    ctx.save(); ctx.translate(W - 34, 34);
    ctx.strokeStyle = cssv('--ink'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#b5532f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(nvx / vl * 12, nvy / vl * 12); ctx.stroke();
    ctx.fillStyle = '#b5532f'; ctx.font = '600 12px "Segoe UI",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('N', nvx / vl * 26, nvy / vl * 26 + 4);
    ctx.restore();
  }

  /* ----- interactions ----- */
  function attach() {
    const cv = $('#c3d'), ptrs = new Map(); let pinch = 0;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, btn: ev.button, shift: ev.shiftKey }); pinch = 0; });
    cv.addEventListener('pointerup', ev => ptrs.delete(ev.pointerId));
    cv.addEventListener('pointercancel', ev => ptrs.delete(ev.pointerId));
    cv.addEventListener('pointermove', ev => {
      const p = ptrs.get(ev.pointerId); if (!p) return;
      const c = cam(), dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY;
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) c.dist = clamp(c.dist * pinch / d, 3, 500); pinch = d; draw(); return;
      }
      if (p.btn === 2 || p.btn === 1 || p.shift) {
        const k = c.dist * 0.0016, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
        c.tx += (-dx * cy - dy * sy) * k; c.tz += (dx * sy - dy * cy) * k;
        c.tx = clamp(c.tx, -50, curB().tw + 50); c.tz = clamp(c.tz, -50, curB().td + 50);
      } else { c.yaw -= dx * 0.008; c.pitch = clamp(c.pitch + dy * 0.006, 0.05, 1.5); }
      draw();
    });
    cv.addEventListener('wheel', ev => { ev.preventDefault(); const c = cam(); c.dist = clamp(c.dist * Math.exp(ev.deltaY * 0.0012), 3, 500); draw(); }, { passive: false });
  }
  function act(a) {
    const b = curB(), c = cam();
    if (a === 'iso') Object.assign(c, { yaw: 0.6, pitch: 0.62, dist: Math.max(b.tw, b.td) * 1.25, tx: b.tw / 2, tz: b.td / 2 });
    if (a === 'top') Object.assign(c, { yaw: 0, pitch: 1.5, dist: Math.max(b.tw, b.td) * 1.35, tx: b.tw / 2, tz: b.td / 2 });
    if (a === 'front') Object.assign(c, { yaw: 0, pitch: 0.14, dist: Math.max(b.tw, b.td) * 1.1, tx: b.tw / 2, tz: b.td / 2 });
    if (a === 'turn') c.yaw += Math.PI / 2;
    if (a === 'zin') c.dist = clamp(c.dist * 0.8, 3, 500);
    if (a === 'zout') c.dist = clamp(c.dist * 1.25, 3, 500);
    if (a === 'roof') opt.roof = !opt.roof;
    if (a === 'trees') opt.trees = !opt.trees;
    if (a === 'decor') Plan.decor = Plan.decor === false;
    renderTools(); draw();
  }
  function toolsHtml() {
    const B = (id, ico, txt, on) => `<button class="tool ${on ? 'on' : ''}" data-v3="${id}">${ic(ico)}<span>${txt}</span></button>`;
    return B('iso', 'iso', 'Vue 3D') + B('top', 'top', 'Dessus') + B('front', 'front', 'Face') + B('turn', 'redo', 'Tourner de 90°') +
      '<span class="sep"></span>' + B('roof', 'roofv', opt.roof ? 'Toit affiché' : 'Toit masqué', opt.roof) + B('trees', 'tree', 'Arbres', opt.trees) + B('decor', 'sofa', 'Aménagement', Plan.decor !== false) +
      '<span class="sep"></span><button class="tool icon" data-v3="zout" title="Éloigner">' + ic('minus') + '</button><button class="tool icon" data-v3="zin" title="Rapprocher">' + ic('plus') + '</button>';
  }
  return { ensure, draw, act, toolsHtml };
})();
