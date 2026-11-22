'use strict';
/* ===== Formes des machines : dessin 2D (vue de dessus) et modèle 3D ===== */
/* Chaque forme : d(g, w, d) dessine dans un rectangle w × d (mètres) ; m(w, d, h, couleur) renvoie des volumes 3D.
   long:true = forme allongée : dessinée dans le sens de la plus grande dimension, puis pivotée si besoin. */
const SYM = {};

function rrectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/* Outils de dessin : u = mètres par pixel, body = couleur de la machine, ink = couleur des contours */
function makeG(ctx, u, body, ink) {
  const g = { c: ctx, u, body, ink, dark: mixC(body, '#000000', 0.36), light: mixC(body, '#ffffff', 0.5), mid: mixC(body, '#000000', 0.14),
    steel: '#c3ccd2', steelD: '#7f8b94', red: '#c4413a', yellow: '#e2b53a', blue: '#5aa6d4', black: '#2b3136', white: '#f3f6f6', wood: '#bd8f5e', woodD: '#8c6542', green: '#4f9a5a', orange: '#e8872a', ol: rgbaC(ink, 0.72) };
  const stroke = (o, lw) => { if (o.s !== false) { ctx.lineWidth = (o.lw || lw) * u; ctx.strokeStyle = o.sc || g.ol; ctx.stroke(); } };
  g.r = (x, y, w, h, f, o = {}) => { ctx.beginPath(); if (o.r) rrectPath(ctx, x, y, w, h, o.r); else ctx.rect(x, y, w, h); if (f) { ctx.fillStyle = f; ctx.fill(); } stroke(o, 1.1); };
  g.o = (cx, cy, rx, ry, f, o = {}) => { ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(rx, 1e-3), Math.max(ry, 1e-3), 0, 0, 7); if (f) { ctx.fillStyle = f; ctx.fill(); } stroke(o, 1.1); };
  g.l = (pts, col, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineWidth = (lw || 1) * u; ctx.strokeStyle = col || g.ol; ctx.stroke(); };
  g.p = (pts, f, o = {}) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (f) { ctx.fillStyle = f; ctx.fill(); } stroke(o, 1.1); };
  g.flame = (cx, cy, s) => { g.p([[cx, cy - s], [cx + s * 0.55, cy + s * 0.15], [cx + s * 0.25, cy + s * 0.85], [cx - s * 0.25, cy + s * 0.85], [cx - s * 0.55, cy + s * 0.15]], g.orange, { s: false }); g.p([[cx, cy - s * 0.2], [cx + s * 0.28, cy + s * 0.35], [cx, cy + s * 0.8], [cx - s * 0.28, cy + s * 0.35]], '#ffd34a', { s: false }); };
  return g;
}

/* ----- volumes 3D (repère local : x, z au sol, y vers le haut) ----- */
const sh = (c, t) => t >= 0 ? mixC(c, '#ffffff', t) : mixC(c, '#000000', -t);
const B = (x0, y0, z0, x1, y1, z1, col, a) => ({ k: 'box', x0, y0, z0, x1, y1, z1, col, a });
const CY = (cx, y0, cz, y1, rx0, rz0, rx1, rz1, col) => ({ k: 'cyl', p0: [cx, y0, cz], p1: [cx, y1, cz], a: [1, 0, 0], b: [0, 0, 1], r0: [rx0, rz0], r1: [rx1, rz1], col });
const CX = (x0, x1, cy, cz, r0, r1, col) => ({ k: 'cyl', p0: [x0, cy, cz], p1: [x1, cy, cz], a: [0, 1, 0], b: [0, 0, 1], r0: [r0, r0], r1: [r1, r1], col });
const CZ = (z0, z1, cx, cy, r0, r1, col) => ({ k: 'cyl', p0: [cx, cy, z0], p1: [cx, cy, z1], a: [1, 0, 0], b: [0, 1, 0], r0: [r0, r0], r1: [r1, r1], col });
const PY = (y0, y1, b, tp, col) => ({ k: 'pyr', y0, y1, b, tp, col });
const SP = (cx, cy, cz, r, col) => ({ k: 'sph', cx, cy, cz, r, col });
const DOME = (cx, y0, cz, rx, rz, h, col, n = 5) => Array.from({ length: n }, (_, i) => {
  const a0 = i / n * Math.PI / 2, a1 = (i + 1) / n * Math.PI / 2;
  return CY(cx, y0 + h * Math.sin(a0), cz, y0 + h * Math.sin(a1), rx * Math.cos(a0), rz * Math.cos(a0), rx * Math.cos(a1), rz * Math.cos(a1), col);
});
const STEELC = '#b9c4cb', DARKC = '#4a545c', REDC = '#c4413a', BLACKC = '#2b3136';

/* ===== Cuves et réservoirs ===== */
SYM.tank = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2;
    g.o(cx, cy, w / 2, d / 2, g.body); g.o(cx, cy, w * 0.42, d * 0.42, g.light, { lw: 0.8 }); g.o(cx, cy, w * 0.34, d * 0.34, g.body, { lw: 0.8 });
    g.o(cx - w * 0.14, cy - d * 0.13, w * 0.1, d * 0.1, g.dark); g.o(cx - w * 0.14, cy - d * 0.13, w * 0.06, d * 0.06, g.steel, { s: false });
    g.l([[cx + w * 0.5, cy], [cx + w * 0.5 + Math.min(0.2, w * 0.12), cy]], g.steelD, 2.4);
  },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.92, w / 2, d / 2, w / 2, d / 2, c), CY(w / 2, h * 0.92, d / 2, h, w / 2, d / 2, w * 0.4, d * 0.4, sh(c, -0.25)), B(w * 0.3, h, d * 0.3, w * 0.42, h + Math.min(0.2, h * 0.08), d * 0.42, '#6b757d')]; }
};
SYM.tankMix = {
  d(g, w, d) {
    SYM.tank.d(g, w, d); const cx = w / 2, cy = d / 2, r = Math.min(w, d) * 0.3;
    g.l([[cx - r, cy], [cx + r, cy]], g.dark, 2.6); g.l([[cx, cy - r], [cx, cy + r]], g.dark, 2.6); g.o(cx, cy, r * 0.3, r * 0.3, g.steel);
  },
  m(w, d, h, c) { return [...SYM.tank.m(w, d, h * 0.86, c), B(w * 0.38, h * 0.86, d * 0.38, w * 0.62, h * 0.97, d * 0.62, DARKC), CY(w / 2, h * 0.97, d / 2, h, w * 0.05, d * 0.05, w * 0.05, d * 0.05, STEELC)]; }
};
SYM.tankHeat = {
  d(g, w, d) { SYM.tank.d(g, w, d); g.flame(w / 2, d / 2 + d * 0.02, Math.min(w, d) * 0.22); },
  m(w, d, h, c) { return [...SYM.tank.m(w, d, h, c), B(w * 0.38, 0, d * 0.02, w * 0.62, h * 0.18, d * 0.12, '#e8872a')]; }
};
SYM.digester = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2;
    g.o(cx, cy, w / 2, d / 2, g.dark); g.o(cx, cy, w * 0.46, d * 0.46, g.body);
    [0.38, 0.28, 0.18].forEach((k, i) => g.o(cx, cy, w * k, d * k, mixC(g.body, '#ffffff', 0.14 + i * 0.12), { lw: 0.7 }));
    g.l([[cx - w * 0.36, cy], [cx + w * 0.36, cy]], g.dark, 2); g.l([[cx, cy - d * 0.36], [cx, cy + d * 0.36]], g.dark, 2);
    g.o(cx, cy, w * 0.06, d * 0.06, g.steel); g.r(w * 0.9, cy - d * 0.04, w * 0.1, d * 0.08, g.steelD, { lw: 0.8 });
    g.l([[cx + w * 0.38, cy - d * 0.2], [cx + w * 0.5, cy - d * 0.2]], g.black, 2.5);
  },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.76, w / 2, d / 2, w / 2, d / 2, c), ...DOME(w / 2, h * 0.76, d / 2, w * 0.5, d * 0.5, h * 0.24, sh(c, 0.18)), CY(w / 2, h, d / 2, h * 1.12, w * 0.03, d * 0.03, w * 0.03, d * 0.03, STEELC), B(w * 0.96, 0, d * 0.46, w * 1.0, h * 0.8, d * 0.5, STEELC)]; }
};
SYM.gasholder = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2;
    g.o(cx, cy, w / 2, d / 2, mixC(g.body, '#000000', 0.1)); g.o(cx, cy, w * 0.46, d * 0.46, g.body); g.o(cx - w * 0.06, cy - d * 0.06, w * 0.34, d * 0.32, g.light, { s: false });
    for (let i = -2; i <= 2; i++) g.l([[cx + i * w * 0.15, cy - d * 0.44 * Math.sqrt(Math.max(0, 1 - (i * 0.3) ** 2))], [cx + i * w * 0.15, cy + d * 0.44 * Math.sqrt(Math.max(0, 1 - (i * 0.3) ** 2))]], rgbaC('#000000', 0.18), 0.8);
    g.r(w * 0.92, cy - d * 0.04, w * 0.08, d * 0.08, g.steelD, { lw: 0.8 });
  },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.12, w / 2, d / 2, w / 2, d / 2, sh(c, -0.3)), ...DOME(w / 2, h * 0.12, d / 2, w * 0.5, d * 0.5, h * 0.88, c, 6)]; }
};
SYM.membrane = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.dark, { r: Math.min(w, d) * 0.3 }); g.r(w * 0.04, d * 0.06, w * 0.92, d * 0.88, g.body, { r: Math.min(w, d) * 0.28, s: false });
    for (let i = 1; i < 4; i++) g.l([[w * 0.1, d * i / 4], [w * 0.9, d * i / 4]], rgbaC('#000000', 0.2), 0.9);
  },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.15, w / 2, d / 2, w / 2, d / 2, sh(c, -0.3)), ...DOME(w / 2, h * 0.15, d / 2, w * 0.5, d * 0.5, h * 0.85, c, 4)]; }
};
SYM.flare = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2;
    [[0.06, 0.06], [0.94, 0.06], [0.5, 1]].forEach(([x, y]) => g.l([[cx, cy], [w * x, d * y]], rgbaC('#000000', 0.35), 0.8));
    g.o(cx, cy, r * 0.95, r * 0.95, g.mid); g.o(cx, cy, r * 0.6, r * 0.6, g.dark); g.flame(cx, cy, r * 0.5);
  },
  m(w, d, h, c) { return [B(w * 0.2, 0, d * 0.2, w * 0.8, h * 0.05, d * 0.8, DARKC), CY(w / 2, 0, d / 2, h * 0.88, w * 0.1, d * 0.1, w * 0.08, d * 0.08, STEELC), CY(w / 2, h * 0.88, d / 2, h, w * 0.14, d * 0.14, w * 0.04, d * 0.04, '#e8872a'), SP(w / 2, h * 0.97, d / 2, w * 0.1, '#ffd34a')]; }
};
SYM.boiler = {
  d(g, w, d) {
    const r = Math.min(w, d) / 2, cx = w * 0.55, cy = d / 2;
    g.r(0, d * 0.3, w * 0.22, d * 0.4, g.dark, { r: 0.03 }); g.flame(w * 0.1, cy, d * 0.12);
    g.o(cx, cy, w * 0.42, d * 0.46, g.body); g.o(cx, cy, w * 0.34, d * 0.38, g.light, { lw: 0.8 }); g.o(cx, cy, w * 0.26, d * 0.3, g.body, { lw: 0.8 });
    g.o(cx + w * 0.12, cy - d * 0.12, w * 0.07, d * 0.07, g.black); g.o(cx - w * 0.1, cy + d * 0.1, w * 0.04, d * 0.04, g.steelD);
  },
  m(w, d, h, c) { return [CY(w * 0.58, 0, d / 2, h * 0.8, w * 0.4, d * 0.46, w * 0.4, d * 0.46, c), ...DOME(w * 0.58, h * 0.8, d / 2, w * 0.4, d * 0.46, h * 0.12, sh(c, 0.1), 3), CY(w * 0.68, h * 0.8, d * 0.4, h * 1.25, w * 0.05, d * 0.05, w * 0.045, d * 0.045, BLACKC), B(0, 0, d * 0.3, w * 0.2, h * 0.4, d * 0.7, DARKC)]; }
};
SYM.burner = {
  d(g, w, d) {
    g.r(w * 0.04, d * 0.2, w * 0.4, d * 0.6, g.body, { r: 0.04 }); g.r(w * 0.1, d * 0.3, w * 0.14, d * 0.4, g.dark, { s: false });
    g.p([[w * 0.44, d * 0.3], [w * 0.62, d * 0.4], [w * 0.62, d * 0.6], [w * 0.44, d * 0.7]], g.steelD);
    g.p([[w * 0.62, d * 0.5 - d * 0.2], [w * 0.98, d * 0.5], [w * 0.62, d * 0.5 + d * 0.2]], g.orange, { s: false }); g.p([[w * 0.62, d * 0.5 - d * 0.09], [w * 0.84, d * 0.5], [w * 0.62, d * 0.5 + d * 0.09]], '#ffd34a', { s: false });
  },
  m(w, d, h, c) { return [B(0, 0, d * 0.2, w * 0.42, h * 0.8, d * 0.8, c), CX(w * 0.42, w * 0.62, h * 0.4, d / 2, d * 0.2, d * 0.12, STEELC), CX(w * 0.62, w, h * 0.4, d / 2, d * 0.16, 0.01, '#e8872a')]; }
};
SYM.filterV = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2;
    g.o(cx, cy, w / 2, d / 2, g.body); g.o(cx, cy, w * 0.4, d * 0.4, g.light, { lw: 0.8 });
    for (let i = -2; i <= 2; i++) { g.l([[cx + i * w * 0.14, cy - d * 0.3], [cx + i * w * 0.14, cy + d * 0.3]], rgbaC('#000000', 0.22), 0.8); g.l([[cx - w * 0.3, cy + i * d * 0.14], [cx + w * 0.3, cy + i * d * 0.14]], rgbaC('#000000', 0.22), 0.8); }
    g.o(cx, cy, w * 0.12, d * 0.12, g.steel); g.l([[cx - w * 0.5, cy], [cx - w * 0.5 - Math.min(0.18, w * 0.12), cy]], g.steelD, 2.4); g.l([[cx + w * 0.5, cy], [cx + w * 0.5 + Math.min(0.18, w * 0.12), cy]], g.steelD, 2.4);
  },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.9, w / 2, d / 2, w / 2, d / 2, c), ...DOME(w / 2, h * 0.9, d / 2, w / 2, d / 2, h * 0.1, sh(c, 0.12), 3), CX(-w * 0.15, w * 0.05, h * 0.78, d / 2, w * 0.07, w * 0.07, STEELC), CX(w * 0.95, w * 1.15, h * 0.2, d / 2, w * 0.07, w * 0.07, STEELC)]; }
};
SYM.heatEx = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: Math.min(w, d) * 0.12 });
    const n = 6, pts = []; for (let i = 0; i <= n; i++) pts.push([w * (0.1 + 0.8 * i / n), i % 2 ? d * 0.78 : d * 0.22]);
    g.l(pts, '#c97a3a', 2.2); g.l([[0, d * 0.22], [w * 0.1, d * 0.22]], '#c97a3a', 2.2); g.l([[w * 0.9, d * (n % 2 ? 0.78 : 0.22)], [w, d * (n % 2 ? 0.78 : 0.22)]], '#c97a3a', 2.2);
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, c), CX(-0.1, 0, h * 0.7, d * 0.25, 0.04, 0.04, '#c97a3a'), CX(w, w + 0.1, h * 0.3, d * 0.75, 0.04, 0.04, '#c97a3a')]; }
};

/* ===== Trémies, broyeurs, mélangeurs, extrudeuses ===== */
SYM.hopper = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: 0.03 }); const a = w * 0.26, b = d * 0.26;
    g.r(a, b, w - 2 * a, d - 2 * b, g.dark, { lw: 0.9 }); [[0, 0, a, b], [w, 0, w - a, b], [w, d, w - a, d - b], [0, d, a, d - b]].forEach(([x1, y1, x2, y2]) => g.l([[x1, y1], [x2, y2]], g.ol, 0.9));
  },
  m(w, d, h, c) { return [B(0, 0, 0, w * 0.1, h * 0.4, d * 0.1, STEELC), B(w * 0.9, 0, 0, w, h * 0.4, d * 0.1, STEELC), B(0, 0, d * 0.9, w * 0.1, h * 0.4, d, STEELC), B(w * 0.9, 0, d * 0.9, w, h * 0.4, d, STEELC), PY(h * 0.4, h, [w * 0.3, d * 0.3, w * 0.7, d * 0.7], [0, 0, w, d], c)]; }
};
SYM.grinder = {
  long: true,
  d(g, L, W) {
    g.r(0, 0, L, W, g.body, { r: 0.04 });
    g.r(L * 0.05, W * 0.1, L * 0.5, W * 0.8, g.dark, { lw: 0.9 }); g.r(L * 0.1, W * 0.2, L * 0.4, W * 0.6, g.mid, { lw: 0.8 });
    [0.36, 0.64].forEach(y => { g.o(L * 0.3, W * y, W * 0.17, W * 0.17, g.steel); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.l([[L * 0.3 + Math.cos(a) * W * 0.17, W * y + Math.sin(a) * W * 0.17], [L * 0.3 + Math.cos(a) * W * 0.24, W * y + Math.sin(a) * W * 0.24]], g.black, 1.4); } });
    g.r(L * 0.62, W * 0.18, L * 0.34, W * 0.64, g.dark, { r: 0.03 }); g.o(L * 0.79, W * 0.5, W * 0.18, W * 0.18, g.steelD); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.l([[L * 0.79, W * 0.5], [L * 0.79 + Math.cos(a) * W * 0.17, W * 0.5 + Math.sin(a) * W * 0.17]], g.black, 1); }
  },
  m(w, d, h, c) { return [B(0, 0, 0, w * 0.6, h * 0.5, d, c), PY(h * 0.5, h, [w * 0.14, d * 0.3, w * 0.46, d * 0.7], [w * 0.04, d * 0.06, w * 0.56, d * 0.94], sh(c, -0.1)), B(w * 0.62, 0, d * 0.18, w * 0.96, h * 0.55, d * 0.82, DARKC), CX(w * 0.6, w * 0.62, h * 0.3, d / 2, d * 0.12, d * 0.12, STEELC)]; }
};
SYM.rollers = {
  long: true,
  d(g, L, W) {
    g.r(0, 0, L, W, g.body, { r: 0.04 });
    [0.2, 0.5, 0.8].forEach(y => { g.r(L * 0.05, W * y - W * 0.11, L * 0.7, W * 0.22, g.steel, { r: W * 0.11 }); g.l([[L * 0.08, W * y - W * 0.03], [L * 0.72, W * y - W * 0.03]], rgbaC('#ffffff', 0.7), 1); });
    g.r(L * 0.8, W * 0.15, L * 0.17, W * 0.7, g.dark, { r: 0.03 });
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.45, d, c), ...[0.2, 0.5, 0.8].map(z => CX(w * 0.05, w * 0.75, h * 0.62, d * z, d * 0.11, d * 0.11, STEELC)), B(w * 0.8, 0, d * 0.15, w * 0.97, h * 0.9, d * 0.85, DARKC)]; }
};
SYM.mixerH = {
  long: true,
  d(g, L, W) {
    g.r(L * 0.16, 0, L * 0.84, W, g.steel, { r: W * 0.35 }); g.r(L * 0.2, W * 0.1, L * 0.76, W * 0.8, g.light, { r: W * 0.3, lw: 0.7 });
    for (let i = 0; i < 9; i++) { const x = L * (0.24 + i * 0.085); g.l([[x, W * 0.14], [x + L * 0.05, W * 0.86]], g.dark, 1.6); }
    g.o(L * 0.58, W * 0.5, W * 0.1, W * 0.1, g.steelD); g.r(0, W * 0.2, L * 0.15, W * 0.6, g.dark, { r: 0.03 }); g.o(L * 0.07, W * 0.5, W * 0.14, W * 0.14, g.steelD);
  },
  m(w, d, h, c) { return [B(w * 0.2, 0, d * 0.1, w * 0.26, h * 0.3, d * 0.9, STEELC), B(w * 0.8, 0, d * 0.1, w * 0.86, h * 0.3, d * 0.9, STEELC), CX(w * 0.16, w, h * 0.62, d / 2, d * 0.5, d * 0.5, STEELC), B(0, 0, d * 0.2, w * 0.15, h * 0.7, d * 0.8, DARKC)]; }
};
SYM.extruder = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.15, L * 0.17, W * 0.7, g.dark, { r: 0.03 }); g.r(L * 0.17, W * 0.25, L * 0.6, W * 0.5, g.steel, { r: W * 0.12 });
    for (let i = 0; i < 10; i++) { const x = L * (0.2 + i * 0.055); g.l([[x, W * 0.28], [x + L * 0.03, W * 0.72]], g.steelD, 1.4); }
    g.r(L * 0.24, W * 0.05, L * 0.2, W * 0.4, g.body, { lw: 1 }); g.r(L * 0.28, W * 0.12, L * 0.12, W * 0.26, g.dark, { s: false });
    g.p([[L * 0.77, W * 0.3], [L, W * 0.36], [L, W * 0.64], [L * 0.77, W * 0.7]], g.dark);
  },
  m(w, d, h, c) { return [B(0, 0, d * 0.15, w * 0.17, h * 0.7, d * 0.85, DARKC), B(w * 0.2, 0, d * 0.3, w * 0.25, h * 0.4, d * 0.7, STEELC), B(w * 0.65, 0, d * 0.3, w * 0.7, h * 0.4, d * 0.7, STEELC), CX(w * 0.17, w * 0.77, h * 0.55, d / 2, d * 0.22, d * 0.22, c), PY(h * 0.7, h * 1.05, [w * 0.27, d * 0.06, w * 0.39, d * 0.3], [w * 0.24, d * 0.02, w * 0.42, d * 0.38], sh(c, -0.1)), CX(w * 0.77, w, h * 0.55, d / 2, d * 0.2, d * 0.12, DARKC)]; }
};
SYM.cutter = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.2, L, W * 0.6, g.steel, { r: 0.02 }); for (let i = 0; i < 6; i++) g.r(L * (0.05 + i * 0.12), W * 0.3, L * 0.09, W * 0.4, '#e8d9b4', { lw: 0.8 });
    g.r(L * 0.82, 0, L * 0.06, W, g.dark, { s: false }); g.l([[L * 0.85, W * 0.02], [L * 0.85, W * 0.98]], g.steel, 1.2);
  },
  m(w, d, h, c) { return [B(0, h * 0.3, d * 0.2, w, h * 0.4, d * 0.8, STEELC), B(w * 0.05, 0, d * 0.25, w * 0.08, h * 0.3, d * 0.3, DARKC), B(w * 0.92, 0, d * 0.25, w * 0.95, h * 0.3, d * 0.3, DARKC), B(w * 0.82, h * 0.4, 0, w * 0.88, h, d * 0.1, c), B(w * 0.82, h * 0.4, d * 0.9, w * 0.88, h, d, c), B(w * 0.82, h * 0.9, 0, w * 0.88, h, d, c)]; }
};
SYM.press = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: 0.04 }); g.r(w * 0.2, d * 0.18, w * 0.6, d * 0.5, g.steel, { r: 0.02 }); g.r(w * 0.28, d * 0.26, w * 0.44, d * 0.34, g.steelD, { lw: 0.8 });
    [[0.1, 0.1], [0.9, 0.1], [0.1, 0.78], [0.9, 0.78]].forEach(([x, y]) => g.o(w * x, d * y, w * 0.05, w * 0.05, g.dark));
    g.r(w * 0.62, d * 0.76, w * 0.3, d * 0.18, g.black, { r: 0.02 }); g.o(w * 0.68, d * 0.85, w * 0.025, w * 0.025, g.green, { s: false }); g.o(w * 0.76, d * 0.85, w * 0.025, w * 0.025, g.red, { s: false });
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.25, d, c), ...[[0.1, 0.1], [0.9, 0.1], [0.1, 0.78], [0.9, 0.78]].map(([x, z]) => CY(w * x, h * 0.25, d * z, h * 0.9, w * 0.04, w * 0.04, w * 0.04, w * 0.04, STEELC)), B(w * 0.05, h * 0.9, d * 0.05, w * 0.95, h, d * 0.85, DARKC), B(w * 0.3, h * 0.5, d * 0.25, w * 0.7, h * 0.9, d * 0.6, STEELC), B(w * 0.64, h * 0.25, d * 0.78, w * 0.92, h * 0.55, d * 0.96, BLACKC)]; }
};
SYM.mould = {
  d(g, w, d) {
    g.r(0, 0, w, d, '#d9d6cc', { r: Math.min(w, d) * 0.15 }); const n = Math.max(2, Math.round(w / 0.18)), m = 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) g.r(w * (0.07 + i * 0.86 / n), d * (0.1 + j * 0.42), w * 0.86 / n * 0.8, d * 0.34, '#f0e6c8', { lw: 0.7, r: 0.01 });
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#d9d6cc'), B(w * 0.06, h, d * 0.1, w * 0.94, h * 1.01, d * 0.9, '#f0e6c8')]; }
};
SYM.sieve = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: 0.03 }); g.r(w * 0.07, d * 0.08, w * 0.86, d * 0.84, g.light, { lw: 0.8 });
    for (let i = 1; i < 9; i++) { g.l([[w * (0.07 + 0.86 * i / 9), d * 0.08], [w * (0.07 + 0.86 * i / 9), d * 0.92]], rgbaC('#000000', 0.25), 0.7); g.l([[w * 0.07, d * (0.08 + 0.84 * i / 9)], [w * 0.93, d * (0.08 + 0.84 * i / 9)]], rgbaC('#000000', 0.25), 0.7); }
    g.o(w * 0.92, d * 0.12, w * 0.05, w * 0.05, g.dark);
  },
  m(w, d, h, c) { return [B(0, 0, 0, w * 0.08, h * 0.5, d, STEELC), B(w * 0.92, 0, 0, w, h * 0.5, d, STEELC), B(0, h * 0.5, 0, w, h * 0.7, d * 0.06, c), B(0, h * 0.5, d * 0.94, w, h * 0.7, d, c), B(w * 0.06, h * 0.52, d * 0.06, w * 0.94, h * 0.58, d * 0.94, '#dfe5e8')]; }
};
SYM.sepSolid = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.15, L * 0.8, W * 0.7, g.steel, { r: W * 0.3 }); for (let i = 0; i < 9; i++) { const x = L * (0.05 + i * 0.08); g.l([[x, W * 0.2], [x + L * 0.04, W * 0.8]], g.dark, 1.6); }
    g.r(L * 0.82, W * 0.2, L * 0.16, W * 0.6, '#8c6a46', { r: 0.03 }); g.p([[0, W * 0.35], [L * 0.04, W * 0.2], [L * 0.04, W * 0.8], [0, W * 0.65]], g.blue);
    g.r(L * 0.12, 0, L * 0.18, W * 0.3, g.body, { lw: 1 }); g.r(L * 0.15, W * 0.05, L * 0.12, W * 0.2, g.dark, { s: false });
  },
  m(w, d, h, c) { return [B(w * 0.1, 0, d * 0.2, w * 0.14, h * 0.4, d * 0.8, STEELC), B(w * 0.7, 0, d * 0.2, w * 0.74, h * 0.3, d * 0.8, STEELC), CX(w * 0.04, w * 0.8, h * 0.55, d / 2, d * 0.32, d * 0.32, c), PY(h * 0.8, h, [w * 0.14, d * 0.06, w * 0.28, d * 0.3], [w * 0.1, 0, w * 0.32, d * 0.36], sh(c, -0.1)), B(w * 0.82, 0, d * 0.2, w, h * 0.3, d * 0.8, '#8c6a46')]; }
};
SYM.agitator = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2;
    g.o(cx, cy, r, r, g.steel); for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3 + 0.4; g.p([[cx, cy], [cx + Math.cos(a - 0.35) * r * 0.95, cy + Math.sin(a - 0.35) * r * 0.95], [cx + Math.cos(a + 0.35) * r * 0.95, cy + Math.sin(a + 0.35) * r * 0.95]], g.dark, { lw: 0.8 }); }
    g.o(cx, cy, r * 0.3, r * 0.3, g.body); g.o(cx, cy, r * 0.12, r * 0.12, g.steelD);
  },
  m(w, d, h, c) { return [CY(w / 2, h * 0.7, d / 2, h, w * 0.4, d * 0.4, w * 0.4, d * 0.4, DARKC), CY(w / 2, h * 0.1, d / 2, h * 0.7, w * 0.05, d * 0.05, w * 0.05, d * 0.05, STEELC), CY(w / 2, h * 0.08, d / 2, h * 0.12, w * 0.5, d * 0.5, w * 0.5, d * 0.5, c)]; }
};

/* ===== Pompes, moteurs, énergie ===== */
SYM.pump = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.2, L * 0.52, W * 0.6, g.body, { r: 0.03 }); for (let i = 1; i < 6; i++) g.l([[L * 0.04 * i * 2, W * 0.22], [L * 0.04 * i * 2, W * 0.78]], rgbaC('#000000', 0.25), 0.8);
    g.r(L * 0.52, W * 0.4, L * 0.1, W * 0.2, g.steelD, { s: false }); g.o(L * 0.78, W * 0.5, Math.min(L * 0.22, W * 0.46), Math.min(L * 0.22, W * 0.46), g.steel);
    g.o(L * 0.78, W * 0.5, Math.min(L * 0.12, W * 0.26), Math.min(L * 0.12, W * 0.26), g.mid, { lw: 0.8 }); g.l([[L * 0.78, 0], [L * 0.78, W * 0.04]], g.steelD, 3); g.l([[L * 0.78, W * 0.96], [L * 0.78, W]], g.steelD, 3);
  },
  m(w, d, h, c) { return [B(0, 0, d * 0.1, w * 0.98, h * 0.12, d * 0.9, DARKC), CX(0, w * 0.5, h * 0.5, d / 2, d * 0.3, d * 0.3, c), CZ(d * 0.2, d * 0.8, w * 0.77, h * 0.5, d * 0.32, d * 0.32, STEELC), CY(w * 0.77, h * 0.5, d * 0.1, h * 0.95, d * 0.08, d * 0.08, d * 0.08, d * 0.08, STEELC)]; }
};
SYM.generator = {
  long: true,
  d(g, L, W) {
    g.r(0, 0, L, W, g.body, { r: 0.05 }); g.r(L * 0.04, W * 0.12, L * 0.3, W * 0.76, g.dark, { r: 0.03 }); g.o(L * 0.19, W * 0.5, W * 0.28, W * 0.28, g.steelD); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.l([[L * 0.19, W * 0.5], [L * 0.19 + Math.cos(a) * W * 0.27, W * 0.5 + Math.sin(a) * W * 0.27]], g.black, 1.2); }
    for (let i = 0; i < 4; i++) g.r(L * (0.4 + i * 0.1), W * 0.18, L * 0.07, W * 0.3, g.mid, { lw: 0.8 }); g.o(L * 0.9, W * 0.25, W * 0.07, W * 0.07, g.black);
    g.r(L * 0.38, W * 0.62, L * 0.55, W * 0.28, g.black, { r: 0.02 }); g.p([[L * 0.62, W * 0.64], [L * 0.57, W * 0.78], [L * 0.62, W * 0.78], [L * 0.58, W * 0.88], [L * 0.7, W * 0.72], [L * 0.64, W * 0.72], [L * 0.68, W * 0.64]], g.yellow, { s: false });
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.85, d, c), CX(0, w * 0.3, h * 0.45, d / 2, d * 0.3, d * 0.3, DARKC), B(w * 0.36, h * 0.85, d * 0.1, w * 0.46, h, d * 0.5, DARKC), CY(w * 0.9, h * 0.85, d * 0.25, h * 1.2, d * 0.06, d * 0.06, d * 0.06, d * 0.06, BLACKC), B(w * 0.38, h * 0.1, d * 0.99, w * 0.93, h * 0.7, d * 1.0, BLACKC)]; }
};
SYM.compressor = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.3, L, W * 0.62, g.body, { r: W * 0.3 }); g.l([[L * 0.5, W * 0.32], [L * 0.5, W * 0.9]], rgbaC('#000000', 0.3), 1);
    g.r(L * 0.15, 0, L * 0.5, W * 0.34, g.dark, { r: 0.03 }); g.o(L * 0.4, W * 0.17, W * 0.12, W * 0.12, g.steelD); g.o(L * 0.85, W * 0.5, W * 0.12, W * 0.12, g.white); g.l([[L * 0.85, W * 0.5], [L * 0.9, W * 0.45]], g.red, 1.2);
  },
  m(w, d, h, c) { return [CX(0, w, h * 0.35, d * 0.6, d * 0.3, d * 0.3, c), B(w * 0.1, 0, d * 0.4, w * 0.2, h * 0.1, d * 0.8, DARKC), B(w * 0.8, 0, d * 0.4, w * 0.9, h * 0.1, d * 0.8, DARKC), B(w * 0.15, h * 0.65, d * 0.05, w * 0.65, h, d * 0.4, DARKC), CZ(d * 0.88, d * 0.93, w * 0.85, h * 0.5, d * 0.1, d * 0.1, '#f3f6f6')]; }
};
SYM.cabinet = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: 0.02 }); g.r(w * 0.06, d * 0.1, w * 0.88, d * 0.8, g.light, { lw: 0.8 }); g.l([[w / 2, d * 0.1], [w / 2, d * 0.9]], g.ol, 0.9);
    g.o(w * 0.44, d * 0.5, Math.min(w, d) * 0.04, Math.min(w, d) * 0.04, g.black); g.o(w * 0.8, d * 0.25, Math.min(w, d) * 0.045, Math.min(w, d) * 0.045, g.green, { s: false });
    g.p([[w * 0.7, d * 0.55], [w * 0.62, d * 0.72], [w * 0.68, d * 0.72], [w * 0.64, d * 0.88], [w * 0.8, d * 0.66], [w * 0.72, d * 0.66], [w * 0.77, d * 0.55]], g.yellow, { s: false });
  },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, c), B(w * 0.05, h * 0.05, d * 0.99, w * 0.95, h * 0.95, d * 1.0, sh(c, 0.15)), B(w * 0.48, h * 0.05, d * 1.0, w * 0.5, h * 0.95, d * 1.01, BLACKC), SP(w * 0.8, h * 0.85, d * 1.0, Math.min(w, h) * 0.03, '#4f9a5a')]; }
};
SYM.fan = {
  d(g, w, d) {
    const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2;
    g.o(cx, cy, r, r, g.body); g.o(cx, cy, r * 0.88, r * 0.88, g.light, { lw: 0.7 });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.3; g.p([[cx, cy], [cx + Math.cos(a - 0.45) * r * 0.82, cy + Math.sin(a - 0.45) * r * 0.82], [cx + Math.cos(a + 0.25) * r * 0.82, cy + Math.sin(a + 0.25) * r * 0.82]], g.dark, { lw: 0.7 }); }
    g.o(cx, cy, r * 0.16, r * 0.16, g.steel);
  },
  m(w, d, h, c) { return [CZ(0, d * 0.4, w / 2, h / 2, w / 2, w / 2, c), CZ(d * 0.4, d * 0.46, w / 2, h / 2, w * 0.42, w * 0.42, STEELC), B(w * 0.45, h * 0.45, d * 0.46, w * 0.55, h * 0.55, d * 0.5, DARKC)]; }
};

/* ===== Remplissage, emballage, convoyeurs ===== */
SYM.conveyor = {
  long: true,
  d(g, L, W) {
    g.r(0, 0, L, W, g.steelD, { r: W * 0.4 }); g.r(L * 0.03, W * 0.15, L * 0.94, W * 0.7, g.black, { s: false, r: W * 0.3 });
    for (let x = 0.08; x < 0.95; x += 0.07) g.l([[L * x, W * 0.17], [L * x, W * 0.83]], rgbaC('#ffffff', 0.18), 1);
    g.o(W * 0.5, W * 0.5, W * 0.3, W * 0.3, g.steel); g.o(L - W * 0.5, W * 0.5, W * 0.3, W * 0.3, g.steel);
    g.p([[L * 0.45, W * 0.3], [L * 0.58, W * 0.5], [L * 0.45, W * 0.7]], g.yellow, { s: false });
  },
  m(w, d, h, c) { const legs = []; for (let x = 0.1; x < 1; x += 0.35) { legs.push(B(w * x, 0, d * 0.05, w * x + 0.06, h * 0.6, d * 0.12, STEELC), B(w * x, 0, d * 0.88, w * x + 0.06, h * 0.6, d * 0.95, STEELC)); } return [...legs, B(0, h * 0.6, 0, w, h * 0.8, d, '#3b4349'), B(0, h * 0.8, 0, w, h, d * 0.06, STEELC), B(0, h * 0.8, d * 0.94, w, h, d, STEELC)]; }
};
SYM.packLine = {
  long: true,
  d(g, L, W) {
    g.r(0, W * 0.3, L, W * 0.4, g.steelD, { r: 0.02 }); const r = Math.max(0.03, W * 0.1);
    for (let x = 0.08; x < 0.95; x += 0.16) if (Math.abs(x - 0.5) > 0.14) g.o(L * x, W * 0.5, r, r, '#e6edf0');
    g.r(L * 0.36, 0, L * 0.28, W, g.body, { r: 0.03 }); g.r(L * 0.4, W * 0.1, L * 0.2, W * 0.22, g.black, { s: false, r: 0.01 }); g.r(L * 0.42, W * 0.14, L * 0.07, W * 0.06, g.green, { s: false });
    g.l([[L * 0.5, W * 0.35], [L * 0.5, W * 0.65]], g.dark, 2.4);
  },
  m(w, d, h, c) { return [B(0, h * 0.3, d * 0.3, w, h * 0.4, d * 0.7, '#3b4349'), B(w * 0.05, 0, d * 0.4, w * 0.08, h * 0.3, d * 0.46, STEELC), B(w * 0.92, 0, d * 0.4, w * 0.95, h * 0.3, d * 0.46, STEELC), B(w * 0.38, 0, 0, w * 0.62, h * 0.7, d, c), B(w * 0.38, h * 0.7, 0, w * 0.62, h, d, sh(c, -0.15)), CY(w * 0.5, h * 0.4, d * 0.5, h * 0.7, w * 0.03, d * 0.03, w * 0.03, d * 0.03, STEELC)]; }
};
SYM.filler = {
  d(g, w, d) {
    g.r(0, 0, w, d, g.body, { r: 0.04 }); const cx = w * 0.55, cy = d / 2, r = Math.min(w * 0.4, d * 0.4);
    g.o(cx, cy, r, r, g.steel); g.o(cx, cy, r * 0.35, r * 0.35, g.dark); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.o(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74, r * 0.12, r * 0.12, '#7fb8d8', { lw: 0.8 }); }
    g.r(0, d * 0.4, w * 0.16, d * 0.2, g.steelD, { s: false }); g.r(w * 0.9, d * 0.7, w * 0.08, d * 0.25, g.black, { s: false });
  },
  m(w, d, h, c) { const bt = []; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; bt.push(CY(w * 0.55 + Math.cos(a) * w * 0.28, h * 0.35, d / 2 + Math.sin(a) * d * 0.28, h * 0.55, w * 0.04, w * 0.04, w * 0.04, w * 0.04, '#7fb8d8')); } return [B(0, 0, 0, w, h * 0.33, d, c), CY(w * 0.55, h * 0.33, d / 2, h * 0.35, w * 0.4, d * 0.4, w * 0.4, d * 0.4, STEELC), ...bt, CY(w * 0.55, h * 0.35, d / 2, h * 0.95, w * 0.07, d * 0.07, w * 0.07, d * 0.07, DARKC), B(w * 0.3, h * 0.95, d * 0.3, w * 0.8, h, d * 0.7, DARKC)]; }
};
SYM.printer = {
  d(g, w, d) { g.r(0, 0, w, d, g.body, { r: 0.03 }); g.o(w * 0.25, d * 0.4, Math.min(w, d) * 0.22, Math.min(w, d) * 0.22, g.white); g.o(w * 0.25, d * 0.4, Math.min(w, d) * 0.08, Math.min(w, d) * 0.08, g.steelD); g.r(w * 0.5, d * 0.7, w * 0.42, d * 0.12, g.white, { lw: 0.7 }); g.o(w * 0.85, d * 0.25, w * 0.035, w * 0.035, g.green, { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, c), CZ(d * 0.1, d * 0.7, w * 0.25, h * 1.1, w * 0.22, w * 0.22, '#f3f6f6')]; }
};
SYM.scale = {
  d(g, w, d) { g.r(0, 0, w, d, g.body, { r: 0.03 }); g.r(w * 0.07, d * 0.07, w * 0.86, d * 0.62, g.steel, { lw: 0.8 }); g.l([[w * 0.07, d * 0.07], [w * 0.93, d * 0.69]], rgbaC('#000000', 0.22), 0.8); g.l([[w * 0.93, d * 0.07], [w * 0.07, d * 0.69]], rgbaC('#000000', 0.22), 0.8); g.r(w * 0.3, d * 0.76, w * 0.4, d * 0.16, g.black, { s: false }); g.r(w * 0.34, d * 0.8, w * 0.2, d * 0.08, g.green, { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.6, d, c), B(w * 0.05, h * 0.6, d * 0.05, w * 0.95, h * 0.68, d * 0.7, STEELC), B(w * 0.3, h * 0.6, d * 0.78, w * 0.7, h, d * 0.94, BLACKC)]; }
};
SYM.palletJack = {
  long: true,
  d(g, L, W) { g.r(L * 0.3, W * 0.05, L * 0.7, W * 0.22, g.body, { lw: 1 }); g.r(L * 0.3, W * 0.73, L * 0.7, W * 0.22, g.body, { lw: 1 }); g.r(L * 0.15, W * 0.2, L * 0.2, W * 0.6, g.dark, { r: 0.02 }); g.l([[L * 0.15, W * 0.5], [0, W * 0.5]], g.black, 3); g.o(0, W * 0.5, W * 0.06, W * 0.06, g.red); [[0.9, 0.16], [0.9, 0.84]].forEach(([x, y]) => g.o(L * x, W * y, W * 0.05, W * 0.05, g.black)); },
  m(w, d, h, c) { return [B(w * 0.3, 0, d * 0.05, w, h * 0.18, d * 0.27, c), B(w * 0.3, 0, d * 0.73, w, h * 0.18, d * 0.95, c), B(w * 0.15, 0, d * 0.2, w * 0.35, h * 0.5, d * 0.8, DARKC), B(0, h * 0.8, d * 0.4, w * 0.18, h * 0.86, d * 0.6, BLACKC), B(w * 0.15, h * 0.5, d * 0.45, w * 0.17, h * 0.85, d * 0.55, STEELC)]; }
};
SYM.pallet = {
  d(g, w, d) { g.r(0, 0, w, d, g.wood, { r: 0.01 }); for (let i = 1; i < 5; i++) g.l([[w * i / 5, 0], [w * i / 5, d]], g.woodD, 1.2); [0.1, 0.5, 0.9].forEach(y => g.l([[0, d * y], [w, d * y]], g.woodD, 1.2)); },
  m(w, d, h, c) { const s = []; for (let i = 0; i < 5; i++) s.push(B(w * i / 5 + w * 0.02, h * 0.6, 0, w * (i + 1) / 5 - w * 0.02, h, d, '#bd8f5e')); return [...s, B(0, 0, 0, w, h * 0.6, d * 0.15, '#8c6542'), B(0, 0, d * 0.42, w, h * 0.6, d * 0.58, '#8c6542'), B(0, 0, d * 0.85, w, h * 0.6, d, '#8c6542')]; }
};
SYM.trolley = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.body, { r: 0.03 }); g.r(L * 0.06, W * 0.1, L * 0.84, W * 0.8, g.light, { lw: 0.7 }); g.l([[0, W * 0.05], [0, W * 0.95]], g.black, 3); [[0.1, 0.06], [0.1, 0.94], [0.9, 0.06], [0.9, 0.94]].forEach(([x, y]) => g.o(L * x, W * y, W * 0.07, W * 0.07, g.black)); },
  m(w, d, h, c) { return [B(0, h * 0.2, 0, w, h * 0.3, d, c), B(0, h * 0.3, 0, w * 0.04, h, d, STEELC), ...[[0.1, 0.06], [0.1, 0.94], [0.9, 0.06], [0.9, 0.94]].map(([x, z]) => CZ(d * z - 0.03, d * z + 0.03, w * x, h * 0.1, h * 0.1, h * 0.1, BLACKC))]; }
};

/* ===== Petits appareils : vannes, capteurs, jauges ===== */
SYM.valve = {
  d(g, w, d) { const cx = w / 2, cy = d / 2; g.p([[0, cy - d * 0.3], [cx, cy], [0, cy + d * 0.3]], g.steel); g.p([[w, cy - d * 0.3], [cx, cy], [w, cy + d * 0.3]], g.steel); g.l([[cx, cy], [cx, d * 0.12]], g.ol, 1.6); g.o(cx, d * 0.12, w * 0.22, d * 0.1, g.red); },
  m(w, d, h, c) { return [CX(0, w / 2, h * 0.35, d / 2, d * 0.3, d * 0.1, STEELC), CX(w / 2, w, h * 0.35, d / 2, d * 0.1, d * 0.3, STEELC), CY(w / 2, h * 0.35, d / 2, h * 0.8, d * 0.05, d * 0.05, d * 0.05, d * 0.05, DARKC), CY(w / 2, h * 0.8, d / 2, h * 0.86, w * 0.25, w * 0.25, w * 0.25, w * 0.25, REDC)]; }
};
SYM.gauge = {
  d(g, w, d) { const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2; g.o(cx, cy, r, r, g.steel); g.o(cx, cy, r * 0.82, r * 0.82, g.white, { lw: 0.8 }); for (let k = 0; k < 9; k++) { const a = Math.PI * (0.8 + k * 0.175); g.l([[cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62], [cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78]], g.black, 0.9); } g.l([[cx, cy], [cx + r * 0.5, cy - r * 0.35]], g.red, 1.6); g.o(cx, cy, r * 0.08, r * 0.08, g.black); },
  m(w, d, h, c) { return [CZ(0, d * 0.5, w / 2, h * 0.6, w * 0.5, w * 0.5, STEELC), CZ(d * 0.5, d * 0.54, w / 2, h * 0.6, w * 0.42, w * 0.42, '#f3f6f6'), CY(w / 2, 0, d * 0.25, h * 0.4, w * 0.08, w * 0.08, w * 0.08, w * 0.08, STEELC)]; }
};
SYM.sensor = {
  d(g, w, d) { const cx = w * 0.42, cy = d / 2, r = Math.min(w, d) * 0.34; g.o(cx, cy, r, r, g.body); g.o(cx, cy, r * 0.45, r * 0.45, g.dark, { s: false }); for (let i = 1; i <= 2; i++) { ctx_arc(g, cx, cy, r * (1 + i * 0.35)); } },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.5, w * 0.1, d * 0.1, w * 0.1, d * 0.1, STEELC), CY(w / 2, h * 0.5, d / 2, h, w * 0.3, d * 0.3, w * 0.3, d * 0.3, c), SP(w / 2, h * 0.95, d / 2, w * 0.1, '#4f9a5a')]; }
};
function ctx_arc(g, cx, cy, r) { g.c.beginPath(); g.c.arc(cx, cy, r, -0.7, 0.7); g.c.lineWidth = 1.2 * g.u; g.c.strokeStyle = g.ol; g.c.stroke(); }
SYM.detector = {
  d(g, w, d) { g.r(0, 0, w, d, g.yellow, { r: Math.min(w, d) * 0.2 }); g.o(w * 0.5, d * 0.32, Math.min(w, d) * 0.1, Math.min(w, d) * 0.1, g.red, { s: false }); g.l([[w * 0.2, d * 0.65], [w * 0.35, d * 0.55], [w * 0.5, d * 0.75], [w * 0.65, d * 0.55], [w * 0.8, d * 0.65]], g.black, 1.2); },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.7, w * 0.05, d * 0.05, w * 0.05, d * 0.05, STEELC), B(0, h * 0.7, 0, w, h, d, '#e2b53a'), SP(w / 2, h * 0.88, d * 1.0, w * 0.1, '#c4413a')]; }
};
SYM.analyzer = {
  d(g, w, d) { g.r(0, 0, w, d, g.body, { r: 0.03 }); g.r(w * 0.1, d * 0.12, w * 0.8, d * 0.46, g.black, { lw: 0.8 }); g.l([[w * 0.15, d * 0.45], [w * 0.3, d * 0.25], [w * 0.45, d * 0.4], [w * 0.6, d * 0.2], [w * 0.85, d * 0.35]], g.green, 1.4); for (let i = 0; i < 4; i++) g.o(w * (0.2 + i * 0.2), d * 0.8, w * 0.04, w * 0.04, g.steelD, { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, c), B(w * 0.1, h * 0.5, d * 1.0, w * 0.9, h * 0.9, d * 1.01, BLACKC)]; }
};
SYM.pipe = {
  long: true,
  d(g, L, W) { const t = Math.max(0.05, W * 0.35), y = W / 2; g.r(0, y - t, L, t * 2, g.steel, { lw: 0.9 }); g.l([[0, y - t * 0.3], [L, y - t * 0.3]], rgbaC('#ffffff', 0.7), 1); [0, 0.5, 1].forEach(k => g.r(L * k - (k === 1 ? Math.min(0.06, L * 0.04) : 0), y - t * 1.5, Math.min(0.06, L * 0.04), t * 3, g.steelD, { lw: 0.7 })); },
  m(w, d, h, c) { return [CX(0, w, h / 2, d / 2, Math.min(h, d) * 0.5, Math.min(h, d) * 0.5, STEELC)]; }
};
SYM.extinguisher = {
  d(g, w, d) { const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2; g.o(cx, cy, r, r, g.red); g.o(cx, cy, r * 0.5, r * 0.5, g.black, { s: false }); g.l([[cx, cy], [cx + r * 0.9, cy - r * 0.2]], g.black, 1.6); g.o(cx - r * 0.2, cy - r * 0.25, r * 0.18, r * 0.18, '#ffd0cc', { s: false }); },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.8, w / 2, d / 2, w / 2, d / 2, REDC), CY(w / 2, h * 0.8, d / 2, h, w * 0.3, d * 0.3, w * 0.15, d * 0.15, BLACKC)]; }
};
SYM.shower = {
  d(g, w, d) { const cx = w / 2, cy = d * 0.42, r = Math.min(w, d) * 0.36; g.r(0, 0, w, d, '#e6f0f4', { r: 0.04 }); g.o(cx, cy, r, r, g.steel); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.o(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.07, r * 0.07, g.blue, { s: false }); } g.o(cx, cy, r * 0.12, r * 0.12, g.blue, { s: false }); g.l([[cx, d * 0.78], [cx, d * 0.95]], g.ol, 1.4); g.p([[cx - w * 0.1, d * 0.95], [cx + w * 0.1, d * 0.95], [cx, d * 0.8]], g.green); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.02, d, '#e6f0f4'), CY(w / 2, 0, d * 0.42, h, w * 0.05, w * 0.05, w * 0.05, w * 0.05, STEELC), CY(w / 2, h * 0.96, d * 0.42, h, w * 0.3, w * 0.3, w * 0.3, w * 0.3, STEELC), B(w * 0.45, h * 0.4, d * 0.6, w * 0.55, h * 0.45, d * 0.9, '#4f9a5a')]; }
};
SYM.eyewash = {
  d(g, w, d) { g.r(0, 0, w, d, g.white, { r: Math.min(w, d) * 0.2 }); [0.3, 0.7].forEach(x => { g.o(w * x, d * 0.5, w * 0.14, w * 0.14, g.blue); g.o(w * x, d * 0.5, w * 0.06, w * 0.06, g.white, { s: false }); }); g.r(w * 0.44, d * 0.8, w * 0.12, d * 0.14, g.green, { s: false }); },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.7, w * 0.08, d * 0.08, w * 0.08, d * 0.08, STEELC), CY(w / 2, h * 0.7, d / 2, h * 0.85, w * 0.45, d * 0.45, w * 0.3, d * 0.3, '#f3f6f6'), B(w * 0.4, h * 0.2, d * 0.1, w * 0.6, h * 0.35, d * 0.25, '#4f9a5a')]; }
};
SYM.estop = {
  d(g, w, d) { g.r(0, 0, w, d, g.yellow, { r: 0.02 }); const r = Math.min(w, d) * 0.34; g.o(w / 2, d / 2, r, r, g.red); g.o(w / 2, d / 2, r * 0.6, r * 0.6, mixC('#c4413a', '#ffffff', 0.25), { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.8, d, '#e2b53a'), CY(w / 2, h * 0.8, d / 2, h, w * 0.3, d * 0.3, w * 0.22, d * 0.22, REDC)]; }
};
SYM.lightning = {
  d(g, w, d) { const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.l([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], g.steelD, 1.4); } g.o(cx, cy, r * 0.35, r * 0.35, g.steel); g.o(cx, cy, r * 0.12, r * 0.12, g.red, { s: false }); },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.97, w * 0.15, d * 0.15, w * 0.05, d * 0.05, STEELC), SP(w / 2, h * 0.98, d / 2, w * 0.12, '#d8dfe3')]; }
};
SYM.signBoard = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, '#f1c93c', { r: 0.02 }); g.r(L * 0.04, W * 0.12, L * 0.92, W * 0.76, null, { lw: 1.1, sc: g.black }); const c = Math.min(L, W); if (L > W * 1.6) { for (let i = 0; i < 4; i++) g.l([[L * (0.15 + i * 0.2), W * 0.35], [L * (0.25 + i * 0.2), W * 0.35]], g.black, 1.6); } else g.p([[L / 2, W * 0.25], [L * 0.75, W * 0.75], [L * 0.25, W * 0.75]], null, { sc: g.black }); },
  m(w, d, h, c) { return [CY(w * 0.1, 0, d / 2, h * 0.9, w * 0.015, d * 0.4, w * 0.015, d * 0.4, STEELC), CY(w * 0.9, 0, d / 2, h * 0.9, w * 0.015, d * 0.4, w * 0.015, d * 0.4, STEELC), B(0, h * 0.4, 0, w, h, d, '#f1c93c')]; }
};
SYM.firstAid = {
  d(g, w, d) { g.r(0, 0, w, d, g.white, { r: 0.03 }); const s = Math.min(w, d) * 0.28; g.r(w / 2 - s * 0.3, d / 2 - s, s * 0.6, s * 2, g.green, { s: false }); g.r(w / 2 - s, d / 2 - s * 0.3, s * 2, s * 0.6, g.green, { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#f3f6f6'), B(w * 0.4, h * 0.2, d * 1.0, w * 0.6, h * 0.8, d * 1.01, '#4f9a5a'), B(w * 0.2, h * 0.4, d * 1.0, w * 0.8, h * 0.6, d * 1.01, '#4f9a5a')]; }
};
SYM.compost = {
  d(g, w, d) { g.r(0, 0, w, d, '#7a5f43', { r: 0.03 }); const n = Math.max(3, Math.round(w * d / 3)); for (let i = 0; i < n; i++) { const x = w * (0.12 + 0.76 * ((i * 0.618) % 1)), y = d * (0.14 + 0.72 * ((i * 0.37 + 0.2) % 1)), r = Math.min(w, d) * 0.12; g.o(x, y, r, r, i % 2 ? '#4d3a28' : '#5e4630', { lw: 0.7 }); } g.l([[w * 0.08, d * 0.5], [w * 0.92, d * 0.5]], rgbaC('#000000', 0.2), 1); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.3, d, '#7a5f43'), ...DOME(w * 0.3, h * 0.3, d * 0.5, w * 0.25, d * 0.35, h * 0.7, '#4d3a28', 3), ...DOME(w * 0.7, h * 0.3, d * 0.5, w * 0.25, d * 0.35, h * 0.55, '#5e4630', 3)]; }
};
SYM.drain = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.steelD, { r: 0.01 }); for (let x = 0.03; x < 0.98; x += 0.04) g.l([[L * x, W * 0.15], [L * x, W * 0.85]], g.black, 1); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#4a545c')]; }
};
SYM.bin = {
  d(g, w, d) { g.r(0, 0, w, d, g.body, { r: 0.04 }); g.r(w * 0.1, d * 0.1, w * 0.8, d * 0.8, g.dark, { r: 0.03, lw: 0.8 }); g.l([[w * 0.1, d * 0.1], [w * 0.3, d * 0.3]], rgbaC('#ffffff', 0.25), 1); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.06, d, sh(c, -0.4)), B(0, 0, 0, w, h, d * 0.08, c), B(0, 0, d * 0.92, w, h, d, c), B(0, 0, 0, w * 0.08, h, d, c), B(w * 0.92, 0, 0, w, h, d, c)]; }
};
SYM.borehole = {
  d(g, w, d) { const cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2; g.o(cx, cy, r, r, '#b7b2a6'); g.o(cx, cy, r * 0.55, r * 0.55, g.steelD); g.o(cx, cy, r * 0.3, r * 0.3, g.dark); g.r(cx, cy - r * 0.12, r * 0.95, r * 0.24, g.blue, { lw: 0.8 }); },
  m(w, d, h, c) { return [CY(w / 2, 0, d / 2, h * 0.1, w / 2, d / 2, w / 2, d / 2, '#b7b2a6'), CY(w / 2, h * 0.1, d / 2, h * 0.7, w * 0.15, d * 0.15, w * 0.15, d * 0.15, STEELC), B(w * 0.45, h * 0.6, d * 0.4, w, h * 0.7, d * 0.6, '#5aa6d4')]; }
};

const EQ_SYM = {
  sCuve: 'tankMix', sReact: 'tankMix', sMel: 'mixerH', sChauf: 'tankHeat', sBroy: 'grinder', sRaff: 'rollers', sBoud: 'extruder', sDec: 'cutter', sPresse: 'press', sEstamp: 'press',
  sMoule: 'mould', sTable: 'table', sClaie: 'rack', sPompe: 'pump', sChar: 'trolley',
  lCuve: 'tankMix', lAgit: 'agitator', lPrep: 'tankMix', lRes: 'tank', lPompe: 'pump', lFilt: 'filterV', lRempl: 'filler', lBouch: 'packLine', lEtiq: 'packLine', lTuy: 'pipe', lVisc: 'sensor', lPh: 'sensor',
  cEmb: 'packLine', cSoud: 'packLine', cEtiqA: 'packLine', cImp: 'printer', cMarq: 'packLine', cRempl: 'filler', cCaps: 'packLine', cScel: 'packLine', cConv: 'conveyor', cBal: 'scale',
  eGroupe: 'generator', eComp: 'compressor', eChaud: 'boiler', eChCuve: 'heatEx', ePompe: 'pump', eRes: 'tank', eTraite: 'filterV', eVent: 'fan', eTrans: 'palletJack', eChar: 'trolley',
  eEtag: 'rack', ePal: 'pallet', eDouche: 'shower', eLave: 'eyewash',
  bgTrem: 'hopper', bgBroy: 'grinder', bgMel: 'mixerH', bgPrep: 'tankMix', bgTampon: 'tank', bgPAlim: 'pump', bgTamis: 'sieve', bgBal: 'scale', bgChar: 'trolley', bgBac: 'bin',
  bgDig: 'digester', bgAgit: 'agitator', bgChauf: 'heatEx', bgPRec: 'pump', bgPTrans: 'pump', bgCapT: 'sensor', bgCapP: 'sensor', bgCapN: 'sensor', bgPh: 'sensor', bgCtrl: 'cabinet',
  bgH2S: 'filterV', bgSepH: 'filterV', bgFiltP: 'filterV', bgSech: 'filterV', bgDebit: 'gauge', bgMano: 'gauge', bgRegP: 'valve', bgAnal: 'analyzer', bgVIso: 'valve', bgTuyG: 'pipe',
  bgGaz: 'gasholder', bgMemb: 'membrane', bgSoup: 'valve', bgFlamme: 'filterV', bgFuite: 'detector', bgCompt: 'gauge', bgTorch: 'flare', bgDist: 'pipe',
  bgGroupe: 'generator', bgBrul: 'burner', bgChaud: 'boiler', bgTabC: 'cabinet', bgRecup: 'heatEx', bgRegE: 'cabinet',
  bgDCuve: 'tank', bgDPompe: 'pump', bgSepS: 'sepSolid', bgCompo: 'compost', bgFert: 'tank', bgDrain: 'drain',
  sfCH4: 'detector', sfH2S: 'detector', sfArret: 'estop', sfFoudre: 'lightning', sfAtex: 'cabinet', sfSurp: 'valve', sfSign: 'signBoard', sfSecours: 'firstAid',
  abre: 'trough', mang: 'feeder', pond: 'nest', barr: 'gate', pompe: 'pump', res: 'tank', forage: 'borehole', groupe: 'generator', etabli: 'workbench', extinc: 'extinguisher',
  extrac: 'fan', ventind: 'fan', bur: 'desk', chaise: 'chair', clim: 'acUnit', ens: 'signBoard', alarm: 'camera', ray: 'rack', compt: 'counter', banc: 'bench'
};
