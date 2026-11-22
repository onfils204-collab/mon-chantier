'use strict';
/* ===== Meubles et aménagement des pièces, puis fonctions d'affichage des formes ===== */

/* ----- tables, rangements, établis ----- */
SYM.table = {
  d(g, w, d) { g.r(0, 0, w, d, g.steel, { r: 0.02 }); g.r(w * 0.06, d * 0.1, w * 0.88, d * 0.8, mixC(g.steel, '#ffffff', 0.5), { lw: 0.6 }); g.l([[w * 0.1, d * 0.2], [w * 0.4, d * 0.2]], rgbaC('#ffffff', 0.9), 1.4); [[0.04, 0.08], [0.96, 0.08], [0.04, 0.92], [0.96, 0.92]].forEach(([x, y]) => g.o(w * x, d * y, Math.min(w, d) * 0.03, Math.min(w, d) * 0.03, g.steelD, { s: false })); },
  m(w, d, h, c) { return [B(0, h * 0.92, 0, w, h, d, STEELC), ...[[0.03, 0.06], [0.93, 0.06], [0.03, 0.9], [0.93, 0.9]].map(([x, z]) => B(w * x, 0, d * z, w * x + 0.05, h * 0.92, d * z + 0.05, '#7f8b94'))]; }
};
SYM.rack = {
  long: true,
  d(g, L, W) {
    g.r(0, 0, L, W, '#dde3e6', { lw: 0.9 }); const n = Math.max(2, Math.round(L / 0.7)); const cols = ['#c9a679', '#8fb0c8', '#d9a0a0', '#a9c79a', '#e6d28c'];
    for (let i = 0; i < n; i++) { g.r(L * (0.03 + i * 0.97 / n), W * 0.14, L * 0.97 / n * 0.8, W * 0.34, cols[i % 5], { lw: 0.6 }); g.r(L * (0.03 + i * 0.97 / n), W * 0.56, L * 0.97 / n * 0.8, W * 0.3, cols[(i + 2) % 5], { lw: 0.6 }); }
    g.l([[0, W * 0.5], [L, W * 0.5]], g.steelD, 1.6); for (let i = 0; i <= n; i += Math.max(1, Math.round(n / 3))) g.r(L * i / n - 0.02, -0.01, 0.04, W + 0.02, g.dark, { s: false });
  },
  m(w, d, h, c) { const o = []; const n = Math.max(2, Math.round(w / 1.0)); for (let i = 0; i <= n; i++) { const x = Math.min(w - 0.05, w * i / n); o.push(B(x, 0, 0, x + 0.05, h, 0.05, '#4a6a8a'), B(x, 0, d - 0.05, x + 0.05, h, d, '#4a6a8a')); } [0.05, 0.4, 0.7, 0.98].forEach(k => o.push(B(0, h * k - 0.03, 0, w, h * k, d, '#dde3e6'))); const cols = ['#c9a679', '#8fb0c8', '#d9a0a0', '#a9c79a']; for (let i = 0; i < n; i++) { o.push(B(w * i / n + 0.08, h * 0.4, d * 0.15, w * (i + 1) / n - 0.08, h * 0.4 + h * 0.2, d * 0.85, cols[i % 4]), B(w * i / n + 0.08, h * 0.05, d * 0.15, w * (i + 1) / n - 0.08, h * 0.05 + h * 0.2, d * 0.85, cols[(i + 2) % 4])); } return o; }
};
SYM.gondola = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, '#e9ecee', { lw: 1 }); g.l([[0, W / 2], [L, W / 2]], g.steelD, 1.4); const cols = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#c77dba']; const n = Math.max(3, Math.round(L / 0.3)); for (let i = 0; i < n; i++) { g.r(L * (0.02 + i * 0.96 / n), W * 0.1, L * 0.96 / n * 0.75, W * 0.32, cols[i % 5], { lw: 0.5 }); g.r(L * (0.02 + i * 0.96 / n), W * 0.58, L * 0.96 / n * 0.75, W * 0.32, cols[(i + 3) % 5], { lw: 0.5 }); } },
  m(w, d, h, c) { const o = [B(0, 0, 0, w, h * 0.12, d, '#8a9aa5'), B(w * 0.48, 0, d * 0.45, w * 0.52, h, d * 0.55, '#8a9aa5')]; const cols = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#c77dba']; const n = Math.max(3, Math.round(w / 0.3)); [0.3, 0.6, 0.85].forEach((k, j) => { for (let i = 0; i < n; i++) o.push(B(w * i / n + 0.02, h * k, d * 0.05, w * (i + 1) / n - 0.04, h * k + h * 0.12, d * 0.45, cols[(i + j) % 5]), B(w * i / n + 0.02, h * k, d * 0.55, w * (i + 1) / n - 0.04, h * k + h * 0.12, d * 0.95, cols[(i + j + 2) % 5])); }); return o; }
};
SYM.workbench = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.wood, { r: 0.02 }); g.r(L * 0.04, W * 0.12, L * 0.92, W * 0.76, mixC(g.wood, '#ffffff', 0.18), { lw: 0.6 }); g.r(0, W * 0.18, L * 0.08, W * 0.3, g.steelD, { lw: 0.8 }); g.o(L * 0.04, W * 0.7, W * 0.12, W * 0.12, g.steel); g.l([[L * 0.3, W * 0.3], [L * 0.5, W * 0.3]], g.black, 2); g.o(L * 0.65, W * 0.55, W * 0.14, W * 0.14, g.steel); g.r(L * 0.78, W * 0.3, L * 0.14, W * 0.4, g.light, { lw: 0.7 }); },
  m(w, d, h, c) { return [B(0, h * 0.9, 0, w, h, d, '#bd8f5e'), B(w * 0.03, 0, d * 0.1, w * 0.07, h * 0.9, d * 0.9, '#8c6542'), B(w * 0.93, 0, d * 0.1, w * 0.97, h * 0.9, d * 0.9, '#8c6542'), B(0, h * 1.0, d * 0.1, w * 0.07, h * 1.12, d * 0.45, '#7f8b94')]; }
};
SYM.labBench = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, '#d9e1e4', { r: 0.02 }); g.r(L * 0.05, W * 0.15, L * 0.18, W * 0.7, g.steel, { lw: 0.8 }); g.o(L * 0.14, W * 0.5, W * 0.08, W * 0.08, g.steelD); [0.4, 0.52, 0.64, 0.8].forEach((x, i) => g.o(L * x, W * (i % 2 ? 0.35 : 0.62), W * 0.13, W * 0.13, i % 2 ? '#bfe2f0' : '#f0d9b8', { lw: 0.7 })); g.r(L * 0.88, W * 0.2, L * 0.08, W * 0.6, g.dark, { lw: 0.7 }); },
  m(w, d, h, c) { return [B(0, h * 0.9, 0, w, h, d, '#d9e1e4'), B(w * 0.02, 0, d * 0.1, w * 0.06, h * 0.9, d * 0.9, '#7f8b94'), B(w * 0.94, 0, d * 0.1, w * 0.98, h * 0.9, d * 0.9, '#7f8b94'), CY(w * 0.5, h, d * 0.5, h * 1.18, 0.05, 0.05, 0.05, 0.05, '#bfe2f0'), CY(w * 0.65, h, d * 0.4, h * 1.14, 0.04, 0.04, 0.04, 0.04, '#f0d9b8')]; }
};
SYM.desk = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.wood, { r: 0.02 }); g.r(L * 0.04, W * 0.08, L * 0.92, W * 0.84, mixC(g.wood, '#ffffff', 0.15), { lw: 0.5 }); g.r(L * 0.32, W * 0.1, L * 0.3, W * 0.14, g.black, { r: 0.01 }); g.r(L * 0.38, W * 0.26, L * 0.18, W * 0.05, '#cfd6da', { lw: 0.5 }); g.r(L * 0.36, W * 0.4, L * 0.22, W * 0.2, '#e8edf0', { lw: 0.6 }); for (let i = 0; i < 3; i++) g.l([[L * 0.72, W * (0.28 + i * 0.22)], [L * 0.94, W * (0.28 + i * 0.22)]], g.woodD, 1); },
  m(w, d, h, c) { return [B(0, h * 0.93, 0, w, h, d, '#bd8f5e'), B(w * 0.02, 0, d * 0.05, w * 0.28, h * 0.93, d * 0.95, '#8c6542'), B(w * 0.74, 0, d * 0.05, w * 0.98, h * 0.93, d * 0.95, '#8c6542'), B(w * 0.38, h, d * 0.1, w * 0.62, h * 1.4, d * 0.16, BLACKC), B(w * 0.42, h, d * 0.22, w * 0.58, h * 1.01, d * 0.3, '#cfd6da')]; }
};
SYM.chair = {
  d(g, w, d) { g.r(w * 0.1, d * 0.2, w * 0.8, d * 0.72, '#4a5e78', { r: Math.min(w, d) * 0.25 }); g.r(w * 0.08, d * 0.02, w * 0.84, d * 0.2, '#35465c', { r: Math.min(w, d) * 0.1 }); g.o(w / 2, d * 0.58, w * 0.12, w * 0.12, '#5d7592', { s: false }); },
  m(w, d, h, c) { return [CY(w / 2, 0, d * 0.58, h * 0.45, w * 0.05, w * 0.05, w * 0.05, w * 0.05, STEELC), B(w * 0.1, h * 0.45, d * 0.2, w * 0.9, h * 0.55, d * 0.92, '#4a5e78'), B(w * 0.08, h * 0.55, d * 0.02, w * 0.92, h, d * 0.2, '#35465c')]; }
};
SYM.bench = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.woodD, { r: 0.02 }); for (let i = 0; i < 3; i++) g.r(L * 0.02, W * (0.06 + i * 0.32), L * 0.96, W * 0.26, g.wood, { lw: 0.6 }); },
  m(w, d, h, c) { return [B(0, h * 0.85, 0, w, h, d, '#bd8f5e'), B(w * 0.05, 0, d * 0.1, w * 0.1, h * 0.85, d * 0.9, '#7f8b94'), B(w * 0.9, 0, d * 0.1, w * 0.95, h * 0.85, d * 0.9, '#7f8b94')]; }
};
SYM.counter = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.wood, { r: 0.02 }); g.r(L * 0.04, W * 0.12, L * 0.6, W * 0.76, mixC('#bfe2f0', '#ffffff', 0.3), { lw: 0.6 }); g.r(L * 0.72, W * 0.1, L * 0.2, W * 0.45, g.black, { r: 0.01 }); g.r(L * 0.74, W * 0.14, L * 0.16, W * 0.18, g.green, { s: false }); g.r(L * 0.74, W * 0.62, L * 0.16, W * 0.2, '#e8edf0', { lw: 0.6 }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.95, d, '#9b7650'), B(0, h * 0.95, 0, w, h, d, '#e8edf0'), B(w * 0.72, h, d * 0.1, w * 0.92, h * 1.25, d * 0.5, BLACKC)]; }
};
SYM.acUnit = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.white, { r: 0.03 }); for (let i = 0; i < 3; i++) g.l([[L * 0.06, W * (0.3 + i * 0.2)], [L * 0.62, W * (0.3 + i * 0.2)]], g.steelD, 1.2); g.o(L * 0.82, W * 0.5, W * 0.32, W * 0.32, g.steel); for (let k = 0; k < 3; k++) { const a = k * 2.1; g.l([[L * 0.82, W * 0.5], [L * 0.82 + Math.cos(a) * W * 0.3, W * 0.5 + Math.sin(a) * W * 0.3]], g.dark, 1.4); } },
  m(w, d, h, c) { return [B(0, 1.9, 0, w, 1.9 + Math.max(h, 0.25), d, '#f3f6f6'), B(w * 0.05, 1.95, d, w * 0.65, 2.0, d * 1.1, '#7f8b94')]; }
};
SYM.camera = {
  d(g, w, d) { const r = Math.min(w, d) / 2; g.o(w / 2, d / 2, r, r, g.dark); g.o(w / 2, d / 2, r * 0.6, r * 0.6, g.black); g.o(w / 2, d / 2, r * 0.25, r * 0.25, '#6d9dc5', { s: false }); },
  m(w, d, h, c) { return [B(w * 0.2, 2.4, d * 0.2, w * 0.8, 2.4 + h, d * 0.8, '#2b3136'), CZ(d * 0.8, d * 1.1, w / 2, 2.4 + h / 2, w * 0.25, w * 0.2, '#6d9dc5')]; }
};

/* ----- élevage ----- */
SYM.trough = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.steel, { r: W * 0.25 }); g.r(L * 0.04, W * 0.14, L * 0.92, W * 0.72, g.blue, { r: W * 0.2, lw: 0.6 }); g.l([[L * 0.12, W * 0.4], [L * 0.3, W * 0.4]], rgbaC('#ffffff', 0.8), 1.2); g.l([[L * 0.5, W * 0.62], [L * 0.75, W * 0.62]], rgbaC('#ffffff', 0.8), 1.2); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d * 0.12, STEELC), B(0, 0, d * 0.88, w, h, d, STEELC), B(0, 0, 0, w * 0.04, h, d, STEELC), B(w * 0.96, 0, 0, w, h, d, STEELC), B(w * 0.04, 0, d * 0.12, w * 0.96, h * 0.8, d * 0.88, '#5aa6d4')]; }
};
SYM.feeder = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.woodD, { r: W * 0.15 }); g.r(L * 0.04, W * 0.14, L * 0.92, W * 0.72, '#d8b878', { lw: 0.6 }); for (let i = 0; i < 18; i++) g.o(L * (0.06 + ((i * 0.37) % 1) * 0.88), W * (0.2 + ((i * 0.61) % 1) * 0.6), 0.012, 0.012, '#8a6a30', { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d * 0.12, '#8c6542'), B(0, 0, d * 0.88, w, h, d, '#8c6542'), B(0, 0, 0, w * 0.04, h, d, '#8c6542'), B(w * 0.96, 0, 0, w, h, d, '#8c6542'), B(w * 0.04, 0, d * 0.12, w * 0.96, h * 0.75, d * 0.88, '#d8b878')]; }
};
SYM.nest = {
  d(g, w, d) { g.r(0, 0, w, d, g.wood, { r: 0.02 }); g.r(w * 0.12, d * 0.1, w * 0.76, d * 0.8, '#e6cf8f', { lw: 0.6 }); g.o(w / 2, d * 0.55, w * 0.22, d * 0.2, '#fff6d6', { lw: 0.7 }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#bd8f5e'), B(w * 0.15, h * 0.1, d * 0.15, w * 0.85, h * 1.01, d * 0.85, '#e6cf8f')]; }
};
SYM.gate = {
  long: true,
  d(g, L, W) { [0, 1].forEach(k => g.r(k ? L - W * 0.4 : 0, 0, W * 0.4, W, g.steelD, { r: 0.01 })); [0.2, 0.5, 0.8].forEach(y => g.l([[W * 0.4, W * y], [L - W * 0.4, W * y]], g.dark, 2)); g.l([[W * 0.4, W * 0.2], [L - W * 0.4, W * 0.8]], g.dark, 1.2); },
  m(w, d, h, c) { return [B(0, 0, 0, w * 0.04, h, d, '#7f8b94'), B(w * 0.96, 0, 0, w, h, d, '#7f8b94'), ...[0.2, 0.5, 0.85].map(k => B(w * 0.04, h * k, d * 0.3, w * 0.96, h * k + 0.05, d * 0.7, '#5d6b75'))]; }
};
SYM.stall = {
  d(g, w, d) { g.r(0, 0, w, d, '#e4d6a8', { lw: 0.5 }); for (let i = 0; i < 26; i++) g.l([[w * ((i * 0.37) % 1), d * ((i * 0.53 + 0.1) % 1)], [w * ((i * 0.37) % 1) + 0.06, d * ((i * 0.53 + 0.1) % 1) + 0.02]], '#bfa86a', 1); g.l([[0, 0], [0, d]], g.woodD, 3); g.l([[w, 0], [w, d]], g.woodD, 3); g.r(w * 0.1, 0, w * 0.8, d * 0.16, g.woodD, { lw: 0.7 }); g.r(w * 0.14, d * 0.03, w * 0.72, d * 0.1, '#d8b878', { s: false }); },
  m(w, d, h, c) { return [B(0, 0, 0, w * 0.04, h, d, '#8c6542'), B(w * 0.96, 0, 0, w, h, d, '#8c6542'), B(w * 0.1, 0, 0, w * 0.9, h * 0.35, d * 0.16, '#8c6542'), B(w * 0.12, h * 0.3, d * 0.02, w * 0.88, h * 0.4, d * 0.14, '#d8b878')]; }
};
SYM.perchRow = {
  long: true,
  d(g, L, W) { [0.15, 0.5, 0.85].forEach(y => g.l([[0, W * y], [L, W * y]], g.wood, 3)); for (let i = 0; i <= 3; i++) g.r(L * i / 3 - 0.02, W * 0.05, 0.04, W * 0.9, g.woodD, { s: false }); },
  m(w, d, h, c) { return [...[0.15, 0.5, 0.85].map((k, i) => B(0, h * (0.5 + i * 0.25), d * k - 0.02, w, h * (0.5 + i * 0.25) + 0.04, d * k + 0.02, '#bd8f5e')), ...[0, 1].map(k => B(k ? w - 0.04 : 0, 0, 0, k ? w : 0.04, h, d, '#8c6542'))]; }
};
SYM.crate = {
  d(g, w, d) { g.r(0, 0, w, d, g.wood, { r: 0.02 }); g.r(w * 0.08, d * 0.1, w * 0.84, d * 0.8, mixC(g.wood, '#ffffff', 0.15), { lw: 0.6 }); g.l([[w * 0.08, d * 0.1], [w * 0.92, d * 0.9]], g.woodD, 1.4); g.l([[w * 0.92, d * 0.1], [w * 0.08, d * 0.9]], g.woodD, 1.4); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#bd8f5e'), B(w * 0.05, h * 0.98, d * 0.05, w * 0.95, h, d * 0.95, '#d0a574')]; }
};

/* ----- maison ----- */
SYM.bed = {
  d(g, w, d) { g.r(0, 0, w, d, g.woodD, { r: 0.04 }); g.r(w * 0.04, d * 0.03, w * 0.92, d * 0.94, g.body, { r: 0.05, lw: 0.6 }); g.r(w * 0.08, d * 0.06, w * 0.38, d * 0.16, '#f6f4ee', { r: 0.04, lw: 0.6 }); g.r(w * 0.54, d * 0.06, w * 0.38, d * 0.16, '#f6f4ee', { r: 0.04, lw: 0.6 }); g.r(w * 0.04, d * 0.42, w * 0.92, d * 0.55, mixC(g.body, '#ffffff', 0.35), { r: 0.04, lw: 0.6 }); g.l([[w * 0.04, d * 0.42], [w * 0.96, d * 0.42]], g.ol, 1); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.45, d, '#8c6542'), B(0, 0, 0, w, h, d * 0.04, '#8c6542'), B(w * 0.03, h * 0.45, d * 0.03, w * 0.97, h * 0.8, d * 0.97, c), B(w * 0.08, h * 0.8, d * 0.06, w * 0.46, h * 0.95, d * 0.22, '#f6f4ee'), B(w * 0.54, h * 0.8, d * 0.06, w * 0.92, h * 0.95, d * 0.22, '#f6f4ee')]; }
};
SYM.sofa = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, g.dark, { r: 0.08 }); g.r(L * 0.07, W * 0.3, L * 0.86, W * 0.66, g.body, { r: 0.06, lw: 0.7 }); g.r(0, W * 0.1, L * 0.07, W * 0.85, g.mid, { r: 0.04, lw: 0.7 }); g.r(L * 0.93, W * 0.1, L * 0.07, W * 0.85, g.mid, { r: 0.04, lw: 0.7 }); const n = L > 1.6 ? 3 : 2; for (let i = 1; i < n; i++) g.l([[L * (0.07 + 0.86 * i / n), W * 0.32], [L * (0.07 + 0.86 * i / n), W * 0.94]], g.ol, 0.9); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.45, d, sh(c, -0.2)), B(w * 0.07, h * 0.45, d * 0.3, w * 0.93, h * 0.62, d * 0.96, c), B(0, 0, 0, w, h, d * 0.28, sh(c, -0.1)), B(0, 0, 0, w * 0.07, h * 0.75, d, sh(c, -0.1)), B(w * 0.93, 0, 0, w, h * 0.75, d, sh(c, -0.1))]; }
};
SYM.coffeeTable = {
  d(g, w, d) { g.r(0, 0, w, d, g.wood, { r: 0.05 }); g.r(w * 0.1, d * 0.14, w * 0.8, d * 0.72, '#cfe4ea', { r: 0.03, lw: 0.6 }); g.l([[w * 0.2, d * 0.3], [w * 0.4, d * 0.3]], rgbaC('#ffffff', 0.9), 1.2); },
  m(w, d, h, c) { return [B(0, h * 0.85, 0, w, h, d, '#bd8f5e'), ...[[0.03, 0.08], [0.93, 0.08], [0.03, 0.85], [0.93, 0.85]].map(([x, z]) => B(w * x, 0, d * z, w * x + 0.05, h * 0.85, d * z + 0.05, '#8c6542'))]; }
};
SYM.tv = {
  long: true,
  d(g, L, W) { g.r(0, W * 0.25, L, W * 0.75, g.dark, { r: 0.02 }); g.r(L * 0.04, 0, L * 0.92, W * 0.3, g.black, { r: 0.01 }); g.l([[L * 0.1, W * 0.08], [L * 0.4, W * 0.08]], rgbaC('#ffffff', 0.3), 1); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.4, d, '#4a545c'), B(w * 0.05, h * 0.4, d * 0.4, w * 0.95, h, d * 0.55, BLACKC)]; }
};
SYM.kitchenRun = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, '#e6e3da', { lw: 1 }); g.r(L * 0.1, W * 0.14, L * 0.2, W * 0.72, g.steel, { r: 0.02, lw: 0.8 }); g.o(L * 0.2, W * 0.5, W * 0.1, W * 0.1, g.steelD); g.l([[L * 0.2, W * 0.14], [L * 0.2, W * 0.02]], g.steelD, 2); [[0.55, 0.3], [0.7, 0.3], [0.55, 0.7], [0.7, 0.7]].forEach(([x, y]) => { g.o(L * x, W * y, W * 0.17, W * 0.17, g.black); g.o(L * x, W * y, W * 0.08, W * 0.08, g.dark, { s: false }); }); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.92, d, '#e6e3da'), B(0, h * 0.92, 0, w, h, d, '#9b8a78'), B(w * 0.1, h * 0.9, d * 0.14, w * 0.3, h * 0.94, d * 0.86, '#c3ccd2'), ...[[0.55, 0.3], [0.7, 0.3], [0.55, 0.7], [0.7, 0.7]].map(([x, z]) => CY(w * x, h, d * z, h * 1.02, d * 0.16, d * 0.16, d * 0.16, d * 0.16, BLACKC))]; }
};
SYM.fridge = {
  d(g, w, d) { g.r(0, 0, w, d, '#f3f6f6', { r: 0.03 }); g.r(w * 0.08, d * 0.08, w * 0.84, d * 0.84, null, { lw: 0.6 }); g.l([[w * 0.85, d * 0.2], [w * 0.85, d * 0.45]], g.steelD, 2); g.l([[w * 0.85, d * 0.55], [w * 0.85, d * 0.8]], g.steelD, 2); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#f3f6f6'), B(w * 0.05, h * 0.6, d, w * 0.95, h * 0.605, d * 1.005, '#8a9aa5'), B(w * 0.85, h * 0.7, d, w * 0.9, h * 0.9, d * 1.02, '#8a9aa5')]; }
};
SYM.bath = {
  long: true,
  d(g, L, W) { g.r(0, 0, L, W, '#f3f6f6', { r: 0.08 }); g.r(L * 0.05, W * 0.1, L * 0.9, W * 0.8, '#bfe2f0', { r: W * 0.3, lw: 0.7 }); g.o(L * 0.92, W * 0.5, W * 0.05, W * 0.05, g.steelD); g.o(L * 0.06, W * 0.5, W * 0.07, W * 0.07, g.steel); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h, d, '#f3f6f6'), B(w * 0.06, h * 0.9, d * 0.1, w * 0.94, h * 1.01, d * 0.9, '#bfe2f0')]; }
};
SYM.showerStall = {
  d(g, w, d) { g.r(0, 0, w, d, '#d3e8ee', { lw: 1 }); g.o(w / 2, d / 2, Math.min(w, d) * 0.07, Math.min(w, d) * 0.07, g.steelD); g.o(w * 0.2, d * 0.2, Math.min(w, d) * 0.12, Math.min(w, d) * 0.12, g.steel); g.l([[w * 0.02, d * 0.98], [w * 0.98, d * 0.98]], '#8fc3d8', 3); g.l([[w * 0.98, d * 0.02], [w * 0.98, d * 0.98]], '#8fc3d8', 3); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.05, d, '#d3e8ee'), B(0, h * 0.05, d * 0.98, w, h, d, '#9fd0e8', 0.35), B(w * 0.98, h * 0.05, 0, w, h, d, '#9fd0e8', 0.35), CY(w * 0.2, h * 0.9, d * 0.2, h * 0.93, w * 0.12, w * 0.12, w * 0.12, w * 0.12, STEELC), CY(w * 0.2, h * 0.3, d * 0.2, h * 0.9, 0.02, 0.02, 0.02, 0.02, STEELC)]; }
};
SYM.toilet = {
  d(g, w, d) { g.r(w * 0.1, 0, w * 0.8, d * 0.28, '#f3f6f6', { r: 0.03 }); g.o(w / 2, d * 0.62, w * 0.44, d * 0.34, '#f3f6f6'); g.o(w / 2, d * 0.64, w * 0.3, d * 0.22, '#dfe7ea', { lw: 0.7 }); g.o(w * 0.5, d * 0.14, w * 0.06, w * 0.06, g.steelD, { s: false }); },
  m(w, d, h, c) { return [B(w * 0.1, 0, 0, w * 0.9, h * 0.95, d * 0.28, '#f3f6f6'), CY(w / 2, 0, d * 0.62, h * 0.5, w * 0.44, d * 0.34, w * 0.44, d * 0.34, '#f3f6f6'), CY(w / 2, h * 0.5, d * 0.64, h * 0.52, w * 0.3, d * 0.22, w * 0.3, d * 0.22, '#c8d3d7')]; }
};
SYM.basin = {
  d(g, w, d) { g.r(0, 0, w, d, '#e8edf0', { r: 0.03 }); g.o(w / 2, d * 0.58, w * 0.32, d * 0.3, '#ffffff', { lw: 0.8 }); g.o(w / 2, d * 0.58, w * 0.05, w * 0.05, g.steelD, { s: false }); g.l([[w / 2, d * 0.1], [w / 2, d * 0.3]], g.steelD, 2.4); },
  m(w, d, h, c) { return [B(0, 0, 0, w, h * 0.92, d, '#e8edf0'), CY(w / 2, h * 0.9, d * 0.58, h * 0.95, w * 0.32, d * 0.3, w * 0.28, d * 0.26, '#ffffff'), CY(w / 2, h * 0.95, d * 0.14, h * 1.15, 0.015, 0.015, 0.015, 0.015, STEELC)]; }
};
SYM.locker = {
  long: true,
  d(g, L, W) { const n = Math.max(2, Math.round(L / 0.45)); g.r(0, 0, L, W, g.body, { lw: 1 }); for (let i = 0; i < n; i++) { g.r(L * i / n + L * 0.01, W * 0.08, L / n * 0.96, W * 0.86, g.light, { lw: 0.7 }); g.o(L * (i + 0.8) / n, W * 0.5, W * 0.05, W * 0.05, g.black, { s: false }); } },
  m(w, d, h, c) { const o = [B(0, 0, 0, w, h, d, c)]; const n = Math.max(2, Math.round(w / 0.45)); for (let i = 0; i <= n; i++) o.push(B(Math.min(w - 0.02, w * i / n), h * 0.03, d, Math.min(w, w * i / n + 0.02), h * 0.97, d * 1.01, '#2b3136')); return o; }
};
SYM.car = {
  long: true,
  d(g, L, W) { [0.18, 0.82].forEach(x => [0, 1].forEach(s => g.r(L * x - L * 0.07, s ? W * 0.94 : -W * 0.02, L * 0.14, W * 0.08, g.black, { s: false }))); g.r(0, W * 0.04, L, W * 0.92, '#4a78b0', { r: W * 0.3 }); g.p([[L * 0.66, W * 0.17], [L * 0.76, W * 0.1], [L * 0.76, W * 0.9], [L * 0.66, W * 0.83]], '#26323f', { lw: 0.6 }); g.p([[L * 0.22, W * 0.14], [L * 0.16, W * 0.1], [L * 0.16, W * 0.9], [L * 0.22, W * 0.86]], '#26323f', { lw: 0.6 }); g.r(L * 0.26, W * 0.14, L * 0.38, W * 0.72, '#6b93c6', { r: W * 0.1, lw: 0.6 }); g.o(L * 0.97, W * 0.22, W * 0.06, W * 0.06, '#fff2b0', { s: false }); g.o(L * 0.97, W * 0.78, W * 0.06, W * 0.06, '#fff2b0', { s: false }); },
  m(w, d, h, c) { return [B(0, h * 0.2, d * 0.04, w, h * 0.55, d * 0.96, '#4a78b0'), B(w * 0.2, h * 0.55, d * 0.1, w * 0.68, h, d * 0.9, '#6b93c6'), ...[[0.18, 0.02], [0.18, 0.88], [0.8, 0.02], [0.8, 0.88]].map(([x, z]) => CZ(d * z, d * z + d * 0.1, w * x, h * 0.2, h * 0.2, h * 0.2, BLACKC))]; }
};
SYM.diningTable = {
  long: true,
  d(g, L, W) { const n = Math.max(2, Math.round(L / 0.6)); for (let i = 0; i < n; i++) [0, 1].forEach(s => g.r(L * (0.12 + i * 0.76 / n), s ? W * 0.82 : 0, L * 0.76 / n * 0.8, W * 0.17, '#4a5e78', { r: 0.03, lw: 0.6 })); g.r(0, W * 0.14, L, W * 0.72, g.wood, { r: 0.04 }); g.r(L * 0.04, W * 0.22, L * 0.92, W * 0.56, mixC(g.wood, '#ffffff', 0.15), { lw: 0.5 }); },
  m(w, d, h, c) { return [B(0, h * 0.9, d * 0.14, w, h, d * 0.86, '#bd8f5e'), ...[[0.03, 0.2], [0.93, 0.2], [0.03, 0.8], [0.93, 0.8]].map(([x, z]) => B(w * x, 0, d * z - 0.03, w * x + 0.06, h * 0.9, d * z + 0.03, '#8c6542'))]; }
};
SYM.sofaFix = SYM.sofa;

/* ===== Fonctions d'affichage ===== */
function drawSym(ctx, type, x, y, w, d, u, body, ink) {
  const s = SYM[type] || SYM.generic; ctx.save(); ctx.translate(x, y);
  const g = makeG(ctx, u, body, ink);
  if (s.long && d > w) { ctx.transform(0, 1, 1, 0, 0, 0); s.d(g, d, w); } else s.d(g, w, d);
  ctx.restore();
}
function swapXZ(p) {
  const q = { ...p };
  if (p.k === 'box') { q.x0 = p.z0; q.z0 = p.x0; q.x1 = p.z1; q.z1 = p.x1; }
  else if (p.k === 'cyl') { const s = v => [v[2], v[1], v[0]]; q.p0 = s(p.p0); q.p1 = s(p.p1); q.a = s(p.a); q.b = s(p.b); }
  else if (p.k === 'pyr') { q.b = [p.b[1], p.b[0], p.b[3], p.b[2]]; q.tp = [p.tp[1], p.tp[0], p.tp[3], p.tp[2]]; }
  else if (p.k === 'sph') { q.cx = p.cz; q.cz = p.cx; }
  return q;
}
function modelOf(type, w, d, h, body) {
  const s = SYM[type] || SYM.generic;
  if (s.long && d > w) return s.m(d, w, h, body).map(swapXZ);
  return s.m(w, d, h, body);
}
const eqSymOf = k => EQ_SYM[k] || 'generic';

/* ===== Aménagement des pièces : meubles et revêtements de sol ===== */
const FLOOR = { sdb: 'tile', wc: 'tile', cuisine: 'tile', labo: 'tile', vestiaire: 'tile', boutique: 'tile', salon: 'wood', chambre: 'wood', bureau: 'wood', couloir: 'wood',
  atelier: 'concrete', hangar: 'concrete', fabrication: 'concrete', conditionnement: 'concrete', reserve: 'concrete', stockmp: 'concrete', stockfini: 'concrete', sechage: 'concrete',
  reception: 'concrete', technique: 'concrete', garage: 'concrete', cuve: 'concrete', etable: 'straw', poulailler: 'straw' };
const WALKWAY = ['fabrication', 'conditionnement', 'atelier'];

/* Liste [forme, x, y, largeur, profondeur, couleur, hauteur] des meubles d'une pièce w × d (en mètres) */
function roomDecor(kind, w, d, hRoom) {
  const m = 0.32, W = w - 2 * m, D = d - 2 * m, it = [], cx = w / 2, cy = d / 2;
  if (W < 0.8 || D < 0.8) return it;
  const put = (s, x, y, iw, id, col, h) => { if (iw > 0.08 && id > 0.08 && x >= m - 1e-6 && y >= m - 1e-6 && x + iw <= w - m + 1e-6 && y + id <= d - m + 1e-6) it.push([s, x, y, iw, id, col, h]); };
  const rowFit = (len, step) => Math.max(0, Math.floor((len + 0.0001) / step));
  switch (kind) {
    case 'chambre': { const bw = Math.min(1.6, W * 0.6), bd = Math.min(2, D * 0.8); put('bed', cx - bw / 2, m, bw, bd, '#8fa8c4', 0.6);
      if (cx - bw / 2 - m > 0.5) { put('table', cx - bw / 2 - 0.45, m, 0.4, 0.4, '#bd8f5e', 0.5); put('table', cx + bw / 2 + 0.05, m, 0.4, 0.4, '#bd8f5e', 0.5); }
      if (W >= 3) put('cabinet', m, d - m - Math.min(1.6, D * 0.45), 0.6, Math.min(1.6, D * 0.45), '#9b7650', 2); break; }
    case 'salon': { const sw = Math.min(2.2, W * 0.65); put('sofa', cx - sw / 2, d - m - 0.9, sw, 0.9, '#6f8fae', 0.85);
      if (D > 2.6) put('coffeeTable', cx - 0.5, d - m - 0.9 - 0.35 - 0.55, 1, 0.55, '#bd8f5e', 0.4); put('tv', cx - 0.6, m, 1.2, 0.4, '#2b3136', 0.55);
      if (W > 4.4 && D > 3) put('diningTable', m + 0.2, m + 0.9, 1.4, 0.9, '#bd8f5e', 0.75); break; }
    case 'cuisine': { const rw = W > 2.4 ? W - 0.7 : W; put('kitchenRun', m, m, rw, 0.6, '#e6e3da', 0.9); if (W > 2.4) put('fridge', w - m - 0.65, m, 0.65, 0.65, '#f3f6f6', 1.8);
      if (D >= 3 && W >= 2.6) put('diningTable', cx - 0.7, Math.min(cy + 0.1, d - m - 0.95), 1.4, 0.95, '#bd8f5e', 0.75); break; }
    case 'sdb': { put('showerStall', w - m - 0.9, m, 0.9, 0.9, '#d3e8ee', 2); put('basin', m, m, 0.6, 0.45, '#e8edf0', 0.85); put('toilet', m, d - m - 0.7, 0.4, 0.7, '#f3f6f6', 0.75); if (W >= 3.2 && D >= 2) put('bath', m + 0.6, d - m - 0.75, 1.7, 0.75, '#f3f6f6', 0.55); break; }
    case 'wc': { put('toilet', cx - 0.2, m, 0.4, 0.7, '#f3f6f6', 0.75); put('basin', m, d - m - 0.35, 0.45, 0.35, '#e8edf0', 0.85); break; }
    case 'bureau': { const dw = Math.min(1.5, W); put('desk', cx - dw / 2, m, dw, 0.7, '#bd8f5e', 0.75); put('chair', cx - 0.25, m + 0.75, 0.5, 0.5, '#4a5e78', 0.9); if (W > 2.6) put('rack', w - m - 0.4, d - m - Math.min(1.6, D * 0.5), 0.4, Math.min(1.6, D * 0.5), '#b9c4cb', 1.8); break; }
    case 'boutique': { put('gondola', m, m, W, 0.45, '#e9ecee', 1.8); const iw = Math.min(2.4, W * 0.35); if (D >= 4) { put('gondola', m + W * 0.15, m + 1.2, iw, 0.8, '#e9ecee', 1.4); put('gondola', m + W * 0.6, m + 1.2, iw, 0.8, '#e9ecee', 1.4); } const cw = Math.min(2.2, W * 0.4); put('counter', w - m - cw, d - m - 0.7, cw, 0.7, '#9b7650', 1); break; }
    case 'reserve': case 'stockmp': case 'stockfini': {
      const n = rowFit(W, 2.1); for (let i = 0; i < n; i++) put('rack', m + i * 2.1, m, 2, 0.6, '#b9c4cb', 2.2);
      const px = rowFit(W, 1.4), py = rowFit(D - 1.2, 1.1); for (let j = 0; j < Math.min(2, py); j++) for (let i = 0; i < Math.min(5, px); i++) { put('pallet', m + i * 1.4, m + 1 + j * 1.1, 1.2, 0.8, '#bd8f5e', 0.15); if (kind === 'stockfini') put('crate', m + i * 1.4 + 0.1, m + 1 + j * 1.1 + 0.1, 1, 0.6, '#c9a679', 0.9); } break; }
    case 'atelier': { const n = Math.min(3, rowFit(W, 2)); for (let i = 0; i < n; i++) put('workbench', m + i * 2, m, 1.8, 0.8, '#bd8f5e', 0.9); put('pallet', m, d - m - 0.8, 1.2, 0.8, '#bd8f5e', 0.15); put('pallet', m + 1.4, d - m - 0.8, 1.2, 0.8, '#bd8f5e', 0.15); break; }
    case 'hangar': { const px = Math.min(5, rowFit(W, 1.4)); for (let j = 0; j < 2; j++) for (let i = 0; i < px; i++) put('pallet', m + i * 1.4, d - m - 0.8 - j * 1.1, 1.2, 0.8, '#bd8f5e', 0.15); put('crate', m, m, 1.2, 0.8, '#c9a679', 1); put('crate', m + 1.4, m, 1.2, 0.8, '#c9a679', 1); break; }
    case 'etable': { const n = Math.min(8, rowFit(W, 1.3)); for (let i = 0; i < n; i++) put('stall', m + i * 1.3, m, 1.2, Math.min(2.4, D * 0.6), '#e4d6a8', 1.1); break; }
    case 'poulailler': { const n = Math.min(8, rowFit(W, 0.5)); for (let i = 0; i < n; i++) put('nest', m + i * 0.5, m, 0.42, 0.42, '#bd8f5e', 0.45); put('perchRow', m, m + 0.9, W, 0.6, '#bd8f5e', 0.9); if (D > 3) put('perchRow', m, m + 1.7, W, 0.6, '#bd8f5e', 0.9); put('feeder', cx - 0.5, d - m - 0.45, 1, 0.4, '#d8b878', 0.25); put('trough', m, d - m - 0.35, Math.min(1.2, W * 0.4), 0.35, '#c3ccd2', 0.25); break; }
    case 'vestiaire': { put('locker', m, m, Math.min(W, 3.2), 0.5, '#8fa89b', 1.8); if (D > 2) put('bench', cx - 0.8, cy + 0.1, 1.6, 0.35, '#bd8f5e', 0.45); break; }
    case 'garage': { const L = Math.min(4.2, Math.max(W, D) * 0.85), Wd = Math.min(1.8, Math.min(W, D) * 0.8); if (W >= D) put('car', cx - L / 2, cy - Wd / 2, L, Wd, '#4a78b0', 1.4); else put('car', cx - Wd / 2, cy - L / 2, Wd, L, '#4a78b0', 1.4); break; }
    case 'sechage': { const rows = Math.min(5, rowFit(D, 1.0)); for (let r = 0; r < rows; r++) put('rack', m + 0.2, m + r * 1.0, Math.min(W - 0.4, 3.6), 0.6, '#b9c4cb', 1.8); break; }
    case 'conditionnement': { const n = Math.min(3, rowFit(W, 2.0)); for (let i = 0; i < n; i++) put('table', m + i * 2, m, 1.8, 0.8, '#c3ccd2', 0.9); put('pallet', m, d - m - 0.8, 1.2, 0.8, '#bd8f5e', 0.15); put('pallet', m + 1.4, d - m - 0.8, 1.2, 0.8, '#bd8f5e', 0.15); put('trolley', w - m - 1.0, d - m - 0.6, 1, 0.6, '#9aa8a0', 1); break; }
    case 'fabrication': { put('drain', m, d - m - 0.25, W, 0.25, '#7f8b94', 0.02); put('pallet', m, m, 1.2, 0.8, '#bd8f5e', 0.15); break; }
    case 'labo': { put('labBench', m, m, W, 0.7, '#d9e1e4', 0.9); if (D > 3.4) put('labBench', m + 0.6, cy, Math.min(2.4, W - 1.2), 0.8, '#d9e1e4', 0.9); put('basin', w - m - 0.6, d - m - 0.45, 0.6, 0.45, '#e8edf0', 0.85); break; }
    case 'reception': { for (let i = 0; i < Math.min(4, rowFit(W, 1.4)); i++) put('bin', m + i * 1.4, m, 1.2, 1, '#7a5f43', 0.9); put('drain', m, d - m - 0.25, W, 0.25, '#7f8b94', 0.02); break; }
    case 'technique': { for (let i = 0; i < Math.min(4, rowFit(W, 0.8)); i++) put('cabinet', m + i * 0.8, m, 0.7, 0.5, '#9aa8a0', 1.9); put('pipe', m, d - m - 0.3, W, 0.25, '#c3ccd2', 0.25); break; }
    case 'cuve': { const r = Math.min(W, D); put('tank', cx - r / 2, cy - r / 2, r, r, '#9fb4b0', Math.max(1, (hRoom || 3) * 0.75)); break; }
    default: break;
  }
  return it;
}
function drawRoomFloor(ctx, r, u, ink, scale) {
  const f = FLOOR[r.kind]; if (!f) return;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.d); ctx.clip(); ctx.lineWidth = u * 0.8; ctx.strokeStyle = rgbaC(ink, 0.11);
  if (f === 'tile' || f === 'wood') {
    const step = f === 'tile' ? 0.5 : 0.25;
    if (step * scale >= 6) { ctx.beginPath(); for (let y = r.y + step; y < r.y + r.d; y += step) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } if (f === 'tile') for (let x = r.x + step; x < r.x + r.w; x += step) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.d); } ctx.stroke(); }
  } else if (f === 'concrete') {
    if (scale >= 8) { ctx.beginPath(); for (let x = r.x + 3; x < r.x + r.w; x += 3) { ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.d); } for (let y = r.y + 3; y < r.y + r.d; y += 3) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); } ctx.stroke(); }
  } else if (f === 'straw' && scale >= 8) {
    ctx.strokeStyle = 'rgba(160,130,60,.55)'; ctx.beginPath(); const n = Math.min(160, Math.round(r.w * r.d * 1.2)); for (let i = 0; i < n; i++) { const x = r.x + r.w * ((i * 0.6180339) % 1), y = r.y + r.d * ((i * 0.4142136 + 0.3) % 1); ctx.moveTo(x, y); ctx.lineTo(x + 0.18, y + 0.04); } ctx.stroke();
  }
  if (WALKWAY.includes(r.kind) && Math.min(r.w, r.d) > 3) { ctx.setLineDash([0.4, 0.25]); ctx.strokeStyle = 'rgba(225,180,40,.85)'; ctx.lineWidth = u * 2; ctx.strokeRect(r.x + 0.55, r.y + 0.55, r.w - 1.1, r.d - 1.1); ctx.setLineDash([]); }
  ctx.restore();
}
function drawRoomDecor(ctx, r, u, ink, scale) {
  if (scale < 7) return;
  roomDecor(r.kind, r.w, r.d, r.h).forEach(([s, x, y, iw, id, col]) => drawSym(ctx, s, r.x + x, r.y + y, iw, id, u, col, ink));
}
