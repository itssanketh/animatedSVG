/**
 * Hollow mask: Ichigo's Hollow mask from Bleach, face on, traced from a how-to-draw sheet and checked against the anime:
 * a tall domed skull narrowing at the cheeks to a flared jaw, slanted eye holes with a heavy lower lid, a ridge from
 * each brow running down beside the nose, a notch in each cheek, two rows of teeth, and the horn-shaped stripes sweeping
 * down the viewer's right from the centre line. Bring the pointer near and it breaks: a hit lands where the pointer is,
 * impact lines burst out from it, cracks run across the mask from there and the pieces spring apart, the pointer's side
 * flung furthest; leave and the pieces draw back together and the cracks close. The pieces take the bright edge while
 * it is broken. The read-out says how far it has broken; the slider is how hard the hit is.
 *
 * Every line is kept in the reference's pixels (centre line x = 311) and scaled down by S. The cracks are jagged lines
 * out from the hit to the edge; each piece is the part of the mask between two of them, and every line is cut where it
 * crosses a crack, each part moving with the piece it lies on.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const CX = 200, CY = 160, TAU = 2 * Math.PI, K = 8, SC = 1.2, S = 3.5;
const M = ([x, y]) => [(x - 311) / S, (y - 401) / S], mir = (p) => p.map(([x, y]) => [622 - x, y]);
/** Chaikin's corner cutting, twice, then each stretch split to about 1.5 units, so a crack can cut it anywhere. */
function line(p, closed, smooth = true) {
  let q = p.map(M);
  for (let it = 0; smooth && it < 2; it++) {
    const r = closed ? [] : [q[0]], n = q.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = q[i], b = q[(i + 1) % n]; r.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]); }
    if (!closed) r.push(q[n - 1]);
    q = r;
  }
  const out = [];
  q.forEach((a, i) => { const b = q[i + 1]; out.push(a); if (b) { const m = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5); for (let j = 1; j < m; j++) out.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]); } });
  return closed ? [...out, out[0]] : out;
}

// the outline, left half from the crown to the chin, measured row by row
const half = [[311, 28], [290, 28], [262, 31], [235, 40], [205, 50], [182, 60], [164, 70], [150, 80], [137, 90], [126, 100], [116, 110], [107, 120], [99, 130], [92, 140], [85, 150], [79, 160], [75, 170], [70, 180], [66, 190], [63, 200], [60, 210], [58, 220], [55, 230], [54, 240], [52, 250], [51, 260], [50, 270], [48, 284], [49, 300], [52, 316], [54, 332], [56, 348], [57, 364], [59, 380], [62, 396], [66, 406], [72, 420], [85, 436], [98, 452], [110, 468], [122, 484], [133, 500], [146, 516], [152, 540], [153, 560], [157, 580], [163, 600], [166, 620], [180, 640], [192, 660], [207, 680], [224, 700], [242, 720], [256, 740], [270, 760], [287, 771], [311, 774]];
const OUT = line([...half, ...mir(half).reverse().slice(1, -1)], true);
// the outline by angle round the middle: where the cracks end and what each piece's rim is
const RIM = OUT.slice(0, -1).map((p) => ({ p, a: ((Math.atan2(p[1], p[0]) % TAU) + TAU) % TAU })).sort((u, v) => u.a - v.a);
const edge = (t) => { t = ((t % TAU) + TAU) % TAU; const n = RIM.length; let i = RIM.findIndex((r) => r.a > t); if (i < 0) i = 0; const b = RIM[i], a = RIM[(i - 1 + n) % n], span = ((b.a - a.a) % TAU + TAU) % TAU || 1, f = (((t - a.a) % TAU) + TAU) % TAU / span; return [lerp(a.p[0], b.p[0], f), lerp(a.p[1], b.p[1], f)]; };

// left side; the right is its mirror
const brow = [[48, 284], [107, 286], [150, 292], [187, 300], [209, 308], [225, 316], [235, 324], [243, 332], [248, 340], [253, 348], [257, 356], [263, 372], [268, 388], [273, 404], [277, 420], [279, 436], [282, 452], [285, 468], [287, 484], [290, 506]];
const lid = [[50, 300], [116, 301], [150, 304]];
const eye = [[105, 306], [150, 305], [181, 316], [202, 324], [216, 332], [226, 340], [234, 348], [240, 356], [250, 366], [258, 380], [264, 394], [270, 404], [248, 396], [218, 388], [191, 380], [171, 372], [145, 356], [136, 348], [129, 340], [123, 332], [117, 324], [112, 316]];
const band = [[107, 307], [142, 316], [148, 324], [157, 332], [167, 340], [181, 348], [199, 356], [230, 366], [253, 373], [261, 386], [270, 404]];
const cheek = [[55, 345], [60, 362], [67, 374], [74, 388], [82, 404], [90, 416], [103, 436], [117, 452], [134, 468], [150, 482], [166, 492]];
const notch = [[90, 416], [117, 436], [137, 452], [152, 468], [163, 484], [168, 492]];
// the stripes, on the viewer's right only
const stripes = [
  [[311, 28], [311, 150], [312, 250], [314, 318]],
  [[418, 57], [404, 70], [386, 90], [370, 110], [357, 130], [346, 150], [337, 170], [329, 190], [323, 210], [318, 230], [313, 250]],
  [[503, 108], [463, 120], [439, 130], [422, 140], [398, 160], [380, 180], [366, 200], [354, 220], [345, 240], [336, 260], [328, 284], [323, 300], [315, 318]],
  [[522, 128], [476, 140], [455, 150], [440, 160], [418, 180], [401, 200], [387, 220], [376, 240], [368, 260], [363, 281], [372, 270], [389, 250], [409, 230], [438, 210], [460, 200], [493, 192], [523, 190], [550, 196]],
  [[559, 214], [540, 209], [500, 211], [460, 220], [440, 230], [426, 240], [416, 250], [408, 260], [401, 270], [395, 279], [405, 270], [419, 260], [445, 250], [470, 247], [500, 246], [533, 250], [565, 262]],
];
// the teeth: tall arches over the upper lip, hanging arches under it, the gaps measured along each row
const lipU = (x) => 588 - 34 * ((x - 311) / 158) ** 2, jaw = (x) => 650 - 32 * ((x - 311) / 150) ** 2, crown = (x) => 518 - 26 * (Math.abs(x - 311) / 158) ** 0.7;
const arch = (a, b, y0, dir) => { const h = (b - a) * 0.42; return Array.from({ length: 9 }, (_, s) => [a + ((b - a) * (1 - Math.cos((Math.PI * s) / 8))) / 2, y0 + dir * (h - h * Math.sin((Math.PI * s) / 8))]); };
const UP = [152, 168, 188, 222, 246, 272, 308, 345, 370, 394, 429, 449, 464], DN = [163, 181, 204, 222, 249, 274, 306, 339, 364, 391, 410, 433, 449];
const teeth = [
  ...UP.slice(0, -1).map((a, i) => { const b = UP[i + 1], top = crown((a + b) / 2); return [[a, lipU(a)], ...arch(a, b, top, 1), [b, lipU(b)]]; }),
  ...DN.slice(0, -1).map((a, i) => { const b = DN[i + 1], bot = jaw((a + b) / 2) - 2; return [[a, lipU(a)], ...arch(a, b, bot, -1), [b, lipU(b)]]; }),
].map((p) => line(p, false, false));
const lips = [line(Array.from({ length: 13 }, (_, i) => { const x = lerp(153, 464, i / 12); return [x, lipU(x)]; }), false), line(Array.from({ length: 11 }, (_, i) => { const x = lerp(166, 432, i / 10); return [x, jaw(x)]; }), false)];
const MARKS = [...[brow, lid, band, cheek, notch].flatMap((p) => [line(p, false), line(mir(p), false)]), ...stripes.map((p) => line(p, false)), ...lips, ...teeth];
const HOLES = [line(eye, true), line(mir(eye), true)];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let hit = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const burst = el("nf"), whole = { face: el("sil"), holes: el("sil"), marks: el("nf") }, pieces = Array.from({ length: K }, () => ({ face: el("sil"), holes: el("sil"), marks: el("nf") }));
  const br = spring(0, { k: 26, c: 7, eps: 0.002 });
  let origin = [0, 0];
  const W = ([x, y]) => [CX + x * SC, CY + y * SC];
  whole.face.setAttribute("d", poly(OUT.map(W)));
  whole.holes.setAttribute("d", HOLES.map((h) => poly(h.map(W))).join(""));
  whole.marks.setAttribute("d", MARKS.map((m) => open(m.map(W))).join(""));
  function draw() {
    const b = br.x, o = origin, intact = b < 0.01;
    for (const e of Object.values(whole)) e.setAttribute("display", intact ? "inline" : "none");
    for (const pc of pieces) for (const e of [pc.face, pc.holes, pc.marks]) e.setAttribute("display", intact ? "none" : "inline");
    if (intact) { burst.setAttribute("d", ""); return; }
    // the cracks: from the hit out to the edge at K angles, each a jagged line
    const ang = Array.from({ length: K }, (_, k) => (k / K) * TAU + 0.3), ends = ang.map(edge);
    const crack = (k) => Array.from({ length: 6 }, (_, i) => { const t = i / 5, e = ends[k], j = i > 0 && i < 5 ? (((k * 7 + i * 3) % 5) - 2) * 4 : 0, d = [e[0] - o[0], e[1] - o[1]], l = Math.hypot(...d) || 1; return [o[0] + d[0] * t - (d[1] / l) * j, o[1] + d[1] * t + (d[0] / l) * j]; });
    const cracks = ang.map((_, k) => crack(k));
    // which piece a point lies on: between which two crack ends, seen from the hit
    const at = (p) => Math.atan2(p[1] - o[1], p[0] - o[0]), aE = ends.map(at), wrap = (a) => ((a % TAU) + TAU) % TAU;
    const sector = (p) => { const a = at(p); for (let k = 0; k < K; k++) if (wrap(a - aE[k]) < wrap(aE[(k + 1) % K] - aE[k])) return k; return 0; };
    // a line's runs that lie on piece k
    const runs = (pts, k) => { const out = []; let cur = []; for (const p of pts) { if (sector(p) === k) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } } if (cur.length > 1) out.push(cur); return out; };
    pieces.forEach((pc, k) => {
      // each piece is flung out along its middle direction, those on the pointer's side furthest, turning a little
      const mid = ang[k] + Math.PI / K, n = [Math.cos(mid), Math.sin(mid)], push = b * hit * (8 + 10 * Math.max(0, n[0] * Math.sign(o[0] || 1) * 0.5 + 0.5));
      const rot = b * 0.12 * (k % 2 ? 1 : -1), cm = [o[0] + n[0] * 30, o[1] + n[1] * 30];
      const T = ([x, y]) => { const dx = x - cm[0], dy = y - cm[1]; return [CX + SC * (cm[0] + dx * Math.cos(rot) - dy * Math.sin(rot) + n[0] * push), CY + SC * (cm[1] + dx * Math.sin(rot) + dy * Math.cos(rot) + n[1] * push)]; };
      const lo = ang[k], rim = RIM.filter((r) => wrap(r.a - lo) < TAU / K).sort((u, v) => wrap(u.a - lo) - wrap(v.a - lo)).map((r) => r.p);
      pc.face.setAttribute("d", poly([...cracks[k], ...rim, ...cracks[(k + 1) % K].slice().reverse()].map(T)));
      pc.holes.setAttribute("d", HOLES.flatMap((h) => runs(h, k)).map((r) => open(r.map(T))).join(""));
      pc.marks.setAttribute("d", MARKS.flatMap((m) => runs(m, k)).map((r) => open(r.map(T))).join(""));
    });
    // the impact: lines bursting out from the hit, longest just after it lands
    const pulse = b * (1 - Math.abs(b - 0.7));
    burst.setAttribute("d", pulse < 0.05 ? "" : Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * TAU, r0 = 22 + 48 * b, r1 = r0 + 24 * pulse * (i % 2 ? 1 : 0.6); return open([[CX + SC * (o[0] + r0 * Math.cos(a)), CY + SC * (o[1] + r0 * Math.sin(a))], [CX + SC * (o[0] + r1 * Math.cos(a)), CY + SC * (o[1] + r1 * Math.sin(a))]]); }).join(""));
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(br, dt); draw(); read.textContent = br.t ? `cracking · ${Math.min(100, Math.round(br.x * 100))}%` : br.x > 0.02 ? "re-forming" : "rest"; return m; });
  bag.add(B.unregister);

  function point(q) {
    // the hit lands where the pointer first comes in, and stays there while it is broken
    if (q && !br.t && br.x < 0.05) origin = [clamp((q[0] - CX) / SC, -30, 30), clamp((q[1] - CY) / SC, -40, 40)];
    br.t = q ? 1 : 0;
    pieces.forEach((p) => p.face.classList.toggle("hi", !!q));
    B.wake();
  }
  point(null);
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hit = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "hollowmask",
  means: "Ichigo's Hollow mask: bring the pointer near and a hit cracks it, impact lines bursting, the pieces flying apart; leave and it re-forms.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
