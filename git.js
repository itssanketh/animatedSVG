/**
 * Git: the diamond with the branch cut through it, as one thick plate facing you. Bring the pointer over it and the
 * logo plays in, frame for frame as its animation does: the diamond grows out of nothing, overshoots and settles like
 * a spring, while the branch is drawn through it: the line growing both ways from the top node, out to the corner and
 * on toward the right, the top node swelling, the right node, then the line running down and the bottom node growing
 * from a point. It plays once each time the pointer comes; leave part way and it hurries to the end. The diamond takes
 * the bright edge under the pointer. The read-out names the stage; the slider is the speed. A tribute: the mark belongs
 * to the Git project (logo by Jason Long).
 *
 * The timing is measured from the animation, frame by frame at 30 a second. While the branch is being drawn, the
 * diamond's outline is found afresh each frame, marching squares over the diamond less the branch so far; after, it is
 * the mark's own outline.
 */
const { clamp, lerp, mk, poly, register, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 160, T = 8, END = 30, DRAWN = 18;
const DIAMOND = [[23.55,10.93],[23.32,10.7],[23.09,10.48],[22.87,10.25],[22.64,10.03],[22.41,9.8],[22.19,9.57],[21.96,9.35],[21.74,9.12],[21.51,8.89],[21.28,8.67],[21.06,8.44],[20.83,8.21],[20.6,7.99],[20.38,7.76],[20.15,7.54],[19.93,7.31],[19.7,7.08],[19.47,6.86],[19.25,6.63],[19.02,6.41],[18.79,6.18],[18.57,5.95],[18.34,5.73],[18.11,5.5],[17.89,5.27],[17.66,5.05],[17.44,4.82],[17.21,4.59],[16.98,4.37],[16.76,4.14],[16.53,3.92],[16.3,3.69],[16.08,3.46],[15.85,3.24],[15.63,3.01],[15.4,2.79],[15.17,2.56],[14.95,2.33],[14.72,2.11],[14.49,1.88],[14.27,1.65],[14.04,1.43],[13.82,1.2],[13.59,0.97],[13.36,0.75],[13.14,0.52],[12.9,0.31],[12.63,0.14],[12.32,0.04],[12.01,0],[11.69,0.03],[11.38,0.12],[11.1,0.27],[10.86,0.47],[10.63,0.7],[10.4,0.93],[10.18,1.15],[9.95,1.38],[9.73,1.61],[9.5,1.83],[9.27,2.06],[9.05,2.29],[8.82,2.51],[9.05,2.96],[9.27,3.19],[9.5,3.42],[9.72,3.64],[9.95,3.87],[10.18,4.1],[10.4,4.32],[10.63,4.55],[10.86,4.78],[11.08,5.0],[11.31,5.23],[11.6,5.35],[11.91,5.3],[12.23,5.3],[12.55,5.36],[12.85,5.47],[13.12,5.63],[13.37,5.84],[13.57,6.08],[13.73,6.36],[13.84,6.66],[13.89,6.98],[13.89,7.3],[13.83,7.61],[13.96,7.89],[14.19,8.12],[14.41,8.35],[14.64,8.57],[14.87,8.8],[15.09,9.03],[15.32,9.25],[15.55,9.48],[15.77,9.71],[16.0,9.93],[16.22,10.16],[16.45,10.38],[16.76,10.31],[17.08,10.29],[17.4,10.32],[17.7,10.4],[17.99,10.54],[18.25,10.73],[18.48,10.96],[18.66,11.22],[18.79,11.51],[18.87,11.82],[18.89,12.14],[18.86,12.46],[18.78,12.77],[18.64,13.05],[18.46,13.31],[18.23,13.54],[17.97,13.72],[17.68,13.86],[17.37,13.94],[17.05,13.97],[16.73,13.94],[16.42,13.86],[16.13,13.72],[15.87,13.54],[15.65,13.31],[15.46,13.05],[15.33,12.76],[15.24,12.45],[15.21,12.13],[15.24,11.81],[15.32,11.5],[15.15,11.23],[14.92,11.01],[14.7,10.78],[14.47,10.56],[14.24,10.33],[14.02,10.1],[13.79,9.88],[13.56,9.65],[13.34,9.43],[13.11,9.2],[12.88,8.98],[12.86,9.29],[12.86,9.61],[12.86,9.93],[12.86,10.25],[12.86,10.57],[12.86,10.89],[12.86,11.21],[12.86,11.53],[12.86,11.85],[12.86,12.17],[12.86,12.49],[12.86,12.81],[12.86,13.13],[12.86,13.45],[12.86,13.77],[12.86,14.09],[12.86,14.41],[12.86,14.73],[12.86,15.05],[12.86,15.37],[13.07,15.6],[13.32,15.8],[13.53,16.04],[13.7,16.32],[13.81,16.62],[13.87,16.93],[13.88,17.25],[13.83,17.57],[13.73,17.87],[13.58,18.15],[13.38,18.4],[13.14,18.61],[12.86,18.78],[12.57,18.89],[12.25,18.96],[11.93,18.96],[11.62,18.92],[11.31,18.82],[11.03,18.67],[10.78,18.47],[10.57,18.23],[10.4,17.96],[10.28,17.66],[10.21,17.35],[10.2,17.03],[10.25,16.72],[10.35,16.41],[10.5,16.13],[10.69,15.88],[10.93,15.66],[11.2,15.49],[11.34,14.94],[11.34,14.62],[11.34,14.3],[11.34,13.98],[11.34,13.66],[11.34,13.34],[11.34,13.02],[11.34,12.7],[11.34,12.38],[11.34,12.06],[11.34,11.74],[11.34,11.42],[11.34,11.1],[11.34,10.78],[11.34,10.46],[11.34,10.14],[11.34,9.82],[11.34,9.5],[11.34,9.18],[11.34,8.86],[11.05,8.68],[10.8,8.49],[10.58,8.25],[10.41,7.98],[10.29,7.68],[10.22,7.37],[10.21,7.05],[10.25,6.74],[10.35,6.43],[10.13,6.2],[9.9,5.98],[9.68,5.75],[9.45,5.52],[9.22,5.3],[9.0,5.07],[8.77,4.84],[8.55,4.62],[8.32,4.39],[8.1,4.16],[7.87,3.94],[7.64,3.71],[7.39,3.95],[7.16,4.17],[6.94,4.4],[6.71,4.62],[6.49,4.85],[6.26,5.08],[6.03,5.3],[5.81,5.53],[5.58,5.75],[5.35,5.98],[5.13,6.21],[4.9,6.43],[4.67,6.66],[4.45,6.89],[4.22,7.11],[4.0,7.34],[3.77,7.57],[3.54,7.79],[3.32,8.02],[3.09,8.24],[2.86,8.47],[2.64,8.7],[2.41,8.92],[2.18,9.15],[1.96,9.37],[1.73,9.6],[1.5,9.83],[1.28,10.05],[1.05,10.28],[0.83,10.51],[0.6,10.73],[0.38,10.96],[0.19,11.22],[0.07,11.52],[0.01,11.83],[0.01,12.15],[0.08,12.46],[0.21,12.75],[0.4,13.01],[0.62,13.24],[0.85,13.47],[1.07,13.69],[1.3,13.92],[1.52,14.14],[1.75,14.37],[1.98,14.6],[2.2,14.82],[2.43,15.05],[2.66,15.28],[2.88,15.5],[3.11,15.73],[3.33,15.96],[3.56,16.18],[3.79,16.41],[4.01,16.63],[4.24,16.86],[4.47,17.09],[4.69,17.31],[4.92,17.54],[5.15,17.77],[5.37,17.99],[5.6,18.22],[5.83,18.44],[6.05,18.67],[6.28,18.9],[6.5,19.12],[6.73,19.35],[6.96,19.57],[7.18,19.8],[7.41,20.03],[7.63,20.25],[7.86,20.48],[8.09,20.71],[8.31,20.93],[8.54,21.16],[8.77,21.38],[8.99,21.61],[9.22,21.84],[9.45,22.06],[9.67,22.29],[9.9,22.52],[10.12,22.74],[10.35,22.97],[10.58,23.19],[10.8,23.42],[11.03,23.64],[11.3,23.82],[11.6,23.94],[11.91,24.0],[12.23,23.99],[12.54,23.91],[12.83,23.77],[13.08,23.58],[13.31,23.35],[13.54,23.13],[13.76,22.9],[13.99,22.68],[14.21,22.45],[14.44,22.22],[14.67,22.0],[14.89,21.77],[15.12,21.54],[15.35,21.32],[15.57,21.09],[15.8,20.86],[16.02,20.64],[16.25,20.41],[16.48,20.19],[16.7,19.96],[16.93,19.73],[17.16,19.51],[17.38,19.28],[17.61,19.05],[17.83,18.83],[18.06,18.6],[18.29,18.38],[18.51,18.15],[18.74,17.92],[18.97,17.7],[19.19,17.47],[19.42,17.25],[19.64,17.02],[19.87,16.79],[20.1,16.57],[20.32,16.34],[20.55,16.11],[20.78,15.89],[21.0,15.66],[21.23,15.44],[21.45,15.21],[21.68,14.98],[21.91,14.76],[22.13,14.53],[22.36,14.3],[22.59,14.08],[22.81,13.85],[23.04,13.62],[23.27,13.4],[23.49,13.17],[23.7,12.93],[23.86,12.66],[23.96,12.35],[24,12.04],[23.97,11.72],[23.87,11.41],[23.72,11.13]];
const S = (x, y, d) => [CX + ((x - 12) * K) / 12 - (d - T / 2) * 0.7, CY + ((y - 12) * K) / 12 + (d - T / 2) * 0.7];
const EASE = (u) => u * u * (3 - 2 * u);
const curve = (keys) => (f) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) if (f < keys[i + 1][0]) {
    const [t1, p1] = keys[i], [t2, p2] = keys[i + 1], p0 = (keys[i - 1] || keys[i])[1], p3 = (keys[i + 2] || keys[i + 1])[1], u = (f - t1) / (t2 - t1);
    return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
  }
  return keys[keys.length - 1][1];
};
// the diamond's size: steady growth, an overshoot, a dip, and rest
const SIZE = curve([[0, 0], [9, 0.99], [12, 1.072], [15.5, 1.02], [19, 0.967], [22, 1], [24, 1]]);

// the branch, from the mark: the line y = x - 5 from past the corner to the right node, the line down, and three nodes
const TOP = [12.07, 7.07], RIGHT = [17.05, 12.12], BOTTOM = [12.04, 17.13], EDGE = [4.6, -0.4], HW = 0.758;
const box = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6, ux = dx / l, uy = dy / l, px = p[0] - a[0], py = p[1] - a[1], s = px * ux + py * uy - l / 2, n = -px * uy + py * ux; return Math.max(Math.abs(s) - l / 2, Math.abs(n) - HW); };
const disc = (p, c, r) => (r > 0.01 ? Math.hypot(p[0] - c[0], p[1] - c[1]) - r : 1e9);
/** How far a point is outside the diamond less the branch as drawn by frame f: below 0 inside. */
function field(p, f) {
  const qx = Math.abs((p[0] - 12 + p[1] - 12) / Math.SQRT2), qy = Math.abs((p[0] - 12 - (p[1] - 12)) / Math.SQRT2), h = 8.92 - 1.49;
  const dia = Math.hypot(Math.max(qx - h, 0), Math.max(qy - h, 0)) + Math.min(Math.max(qx - h, qy - h), 0) - 1.49;
  const g1 = EASE(clamp((f - 5) / 4.5, 0, 1)), down = EASE(clamp((f - 10.5) / 3.5, 0, 1));
  let br = 1e9;
  if (g1 > 0) br = Math.min(br, box(p, [lerp(TOP[0], EDGE[0], g1), lerp(TOP[1], EDGE[1], g1)], [lerp(TOP[0], RIGHT[0], g1), lerp(TOP[1], RIGHT[1], g1)]));
  if (down > 0) br = Math.min(br, box(p, [12.1, TOP[1]], [12.1, lerp(TOP[1], BOTTOM[1], down)]));
  br = Math.min(br, disc(p, TOP, 1.81 * EASE(clamp((f - 7.5) / 2.5, 0, 1))), disc(p, RIGHT, 1.84 * EASE(clamp((f - 8.5) / 3, 0, 1))), disc(p, BOTTOM, 1.84 * EASE(clamp((f - 11.5) / 4.5, 0, 1))));
  return Math.max(dia, -br);
}
/** The outline of field's inside at frame f, as loops: marching squares on a quarter-unit grid, segments joined. */
function outline(f) {
  const N = 104, st = 0.25, o = -1, v = [];
  for (let i = 0; i <= N; i++) { v.push([]); for (let j = 0; j <= N; j++) v[i].push(field([o + j * st, o + i * st], f)); }
  const pt = (i, j, e) => { const [a, b] = e === 0 ? [[i, j], [i, j + 1]] : e === 1 ? [[i, j + 1], [i + 1, j + 1]] : e === 2 ? [[i + 1, j], [i + 1, j + 1]] : [[i, j], [i + 1, j]]; const va = v[a[0]][a[1]], vb = v[b[0]][b[1]], t = va / (va - vb); return [o + (a[1] + (b[1] - a[1]) * t) * st, o + (a[0] + (b[0] - a[0]) * t) * st]; };
  const key = (i, j, e) => (e === 0 ? `h${i},${j}` : e === 2 ? `h${i + 1},${j}` : e === 3 ? `v${i},${j}` : `v${i},${j + 1}`);
  const TAB = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[3, 0], [2, 1]], 6: [[0, 2]], 7: [[3, 0]], 8: [[0, 3]], 9: [[0, 2]], 10: [[0, 1], [2, 3]], 11: [[0, 1]], 12: [[1, 3]], 13: [[1, 2]], 14: [[2, 3]] };
  const adj = new Map(), at = new Map(), link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const c = (v[i][j] < 0 ? 8 : 0) | (v[i][j + 1] < 0 ? 4 : 0) | (v[i + 1][j + 1] < 0 ? 2 : 0) | (v[i + 1][j] < 0 ? 1 : 0);
    for (const [a, b] of TAB[c] || []) { const ka = key(i, j, a), kb = key(i, j, b); at.set(ka, pt(i, j, a)); at.set(kb, pt(i, j, b)); link(ka, kb); link(kb, ka); }
  }
  const seen = new Set(), loops = [];
  for (const k0 of adj.keys()) {
    if (seen.has(k0)) continue;
    const loop = []; let k = k0;
    while (k && !seen.has(k)) { seen.add(k); loop.push(at.get(k)); k = adj.get(k).find((n) => !seen.has(n)); }
    if (loop.length > 4) loops.push(loop);
  }
  return loops;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let speed = value;
  const g = mk("g", {}, svg), away = mk("path", { class: "sil" }, g), side = mk("path", { class: "fo" }, g), toward = mk("path", { class: "sil" }, g);
  function show(f) {
    const loops = f < DRAWN ? outline(f) : [DIAMOND], sc = SIZE(f);
    g.setAttribute("display", sc > 0.005 ? "inline" : "none");
    if (sc <= 0.005) return;
    const tr = ([x, y]) => [12 + (x - 12) * sc, 12 + (y - 12) * sc];
    const fr = loops.map((l) => l.map((q) => S(...tr(q), T))), bk = loops.map((l) => l.map((q) => S(...tr(q), 0)));
    away.setAttribute("d", bk.map(poly).join(""));
    side.setAttribute("d", fr.map((l, k) => l.map((q, i) => poly([q, l[(i + 1) % l.length], bk[k][(i + 1) % l.length], bk[k][i]])).join("")).join(""));
    toward.setAttribute("d", fr.map(poly).join(""));
  }

  // f: the frame, 30 a second; rest is the end
  let f = END, on = false, last = performance.now();
  const B = register(stage, () => {
    const now = performance.now(), dt = Math.min(now - last, 50); last = now;
    if (reducedMotion() || f >= END) { f = END; show(f); read.textContent = on ? "git" : "rest"; return false; }
    f = Math.min(END, f + (dt / 1000) * 30 * speed * (on ? 1 : 4));
    show(f);
    read.textContent = f < 5 ? "init" : f < DRAWN ? "branching" : "git";
    return true;
  });
  bag.add(B.unregister);
  show(f);

  const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  const rest = DIAMOND.map((q) => S(...q, T));
  function point(q) {
    const was = on;
    on = !!q && Math.hypot(q[0] - CX, q[1] - CY) < K * 1.3;
    if (on && !was && f >= END) f = 0;
    toward.classList.toggle("hi", !!q && inPoly(q, rest));
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "git",
  means: "Git's logo plays in: the diamond springs up and overshoots while its branch draws itself through it, node by node.",
  rules: [1, 5, 8, 10],
  range: [0.7, 1, 1.4],
  mount,
});
