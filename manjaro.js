/**
 * Manjaro: the mark's three bars as thick plates facing you. It plays like an equalizer: each bar comes toward you
 * by how near the pointer's x is to it, falling off with distance, each on its own spring; leave and they settle
 * flat. The read-out names the bar nearest the pointer; the slider is the tallest rise. A tribute: the mark
 * belongs to the Manjaro project.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[0,0],[0,0.32],[0,0.64],[0,0.96],[0,1.28],[0,1.6],[0,1.92],[0,2.24],[0,2.56],[0,2.88],[0,3.2],[0,3.52],[0,3.84],[0,4.16],[0,4.48],[0,4.8],[0,5.12],[0,5.44],[0,5.76],[0,6.08],[0,6.4],[0,6.72],[0,7.04],[0,7.36],[0,7.68],[0,8],[0,8.32],[0,8.64],[0,8.96],[0,9.28],[0,9.6],[0,9.92],[0,10.24],[0,10.56],[0,10.88],[0,11.2],[0,11.52],[0,11.84],[0,12.16],[0,12.48],[0,12.8],[0,13.12],[0,13.44],[0,13.76],[0,14.08],[0,14.4],[0,14.72],[0,15.04],[0,15.36],[0,15.68],[0,16],[0,16.32],[0,16.64],[0,16.96],[0,17.28],[0,17.6],[0,17.92],[0,18.24],[0,18.56],[0,18.88],[0,19.2],[0,19.52],[0,19.84],[0,20.16],[0,20.48],[0,20.8],[0,21.12],[0,21.44],[0,21.76],[0,22.08],[0,22.4],[0,22.72],[0,23.04],[0,23.36],[0,23.68],[0,24],[0.32,24],[0.64,24],[0.96,24],[1.28,24],[1.6,24],[1.92,24],[2.24,24],[2.56,24],[2.88,24],[3.2,24],[3.52,24],[3.84,24],[4.16,24],[4.48,24],[4.8,24],[5.12,24],[5.44,24],[5.76,24],[6.08,24],[6.4,24],[6.72,24],[6.75,23.67],[6.75,23.35],[6.75,23.03],[6.75,22.71],[6.75,22.39],[6.75,22.07],[6.75,21.75],[6.75,21.43],[6.75,21.11],[6.75,20.79],[6.75,20.47],[6.75,20.15],[6.75,19.83],[6.75,19.51],[6.75,19.19],[6.75,18.87],[6.75,18.55],[6.75,18.23],[6.75,17.91],[6.75,17.59],[6.75,17.27],[6.75,16.95],[6.75,16.63],[6.75,16.31],[6.75,15.99],[6.75,15.67],[6.75,15.35],[6.75,15.03],[6.75,14.71],[6.75,14.39],[6.75,14.07],[6.75,13.75],[6.75,13.43],[6.75,13.11],[6.75,12.79],[6.75,12.47],[6.75,12.15],[6.75,11.83],[6.75,11.51],[6.75,11.19],[6.75,10.87],[6.75,10.55],[6.75,10.23],[6.75,9.91],[6.75,9.59],[6.75,9.27],[6.75,8.95],[6.75,8.63],[6.75,8.31],[6.75,7.99],[6.75,7.67],[6.75,7.35],[6.75,7.03],[6.87,6.75],[7.19,6.75],[7.51,6.75],[7.83,6.75],[8.15,6.75],[8.47,6.75],[8.79,6.75],[9.11,6.75],[9.43,6.75],[9.75,6.75],[10.07,6.75],[10.39,6.75],[10.71,6.75],[11.03,6.75],[11.35,6.75],[11.67,6.75],[11.99,6.75],[12.31,6.75],[12.63,6.75],[12.95,6.75],[13.27,6.75],[13.59,6.75],[13.91,6.75],[14.23,6.75],[14.55,6.75],[14.87,6.75],[15.19,6.75],[15.38,6.58],[15.38,6.25],[15.38,5.93],[15.38,5.62],[15.38,5.29],[15.38,4.97],[15.38,4.66],[15.38,4.33],[15.38,4.01],[15.38,3.69],[15.38,3.38],[15.38,3.06],[15.38,2.73],[15.38,2.42],[15.38,2.1],[15.38,1.77],[15.38,1.46],[15.38,1.14],[15.38,0.81],[15.38,0.49],[15.38,0.17],[15.19,0],[14.87,0],[14.55,0],[14.23,0],[13.91,0],[13.59,0],[13.27,0],[12.95,0],[12.63,0],[12.31,0],[11.99,0],[11.67,0],[11.35,0],[11.03,0],[10.71,0],[10.39,0],[10.07,0],[9.75,0],[9.43,0],[9.11,0],[8.79,0],[8.47,0],[8.15,0],[7.83,0],[7.51,0],[7.19,0],[6.87,0],[6.55,0],[6.23,0],[5.91,0],[5.59,0],[5.27,0],[4.95,0],[4.63,0],[4.31,0],[3.99,0],[3.67,0],[3.35,0],[3.03,0],[2.71,0],[2.39,0],[2.07,0],[1.75,0],[1.43,0],[1.11,0],[0.79,0],[0.47,0],[0.15,0]],[[8.62,8.63],[8.62,8.96],[8.62,9.28],[8.62,9.6],[8.62,9.91],[8.62,10.23],[8.62,10.55],[8.62,10.88],[8.62,11.2],[8.62,11.52],[8.62,11.84],[8.62,12.15],[8.62,12.47],[8.62,12.79],[8.62,13.12],[8.62,13.44],[8.62,13.76],[8.62,14.07],[8.62,14.39],[8.62,14.71],[8.62,15.04],[8.62,15.36],[8.62,15.68],[8.62,15.99],[8.62,16.32],[8.62,16.64],[8.62,16.95],[8.62,17.27],[8.62,17.59],[8.62,17.91],[8.62,18.23],[8.62,18.55],[8.62,18.88],[8.62,19.2],[8.62,19.52],[8.62,19.84],[8.62,20.16],[8.62,20.48],[8.62,20.8],[8.62,21.11],[8.62,21.43],[8.62,21.75],[8.62,22.07],[8.62,22.39],[8.62,22.71],[8.62,23.04],[8.62,23.36],[8.62,23.68],[8.62,24.0],[8.94,24],[9.26,24],[9.58,24],[9.9,24],[10.22,24],[10.54,24],[10.86,24],[11.18,24],[11.5,24],[11.82,24],[12.14,24],[12.46,24],[12.78,24],[13.1,24],[13.42,24],[13.74,24],[14.06,24],[14.38,24],[14.7,24],[15.02,24],[15.34,24],[15.38,23.68],[15.38,23.36],[15.38,23.04],[15.38,22.71],[15.38,22.39],[15.38,22.07],[15.38,21.75],[15.38,21.43],[15.38,21.11],[15.38,20.8],[15.38,20.48],[15.38,20.16],[15.38,19.84],[15.38,19.52],[15.38,19.2],[15.38,18.88],[15.38,18.55],[15.38,18.23],[15.38,17.91],[15.38,17.59],[15.38,17.27],[15.38,16.95],[15.38,16.64],[15.38,16.32],[15.38,15.99],[15.38,15.68],[15.38,15.36],[15.38,15.04],[15.38,14.71],[15.38,14.39],[15.38,14.07],[15.38,13.76],[15.38,13.44],[15.38,13.12],[15.38,12.79],[15.38,12.47],[15.38,12.15],[15.38,11.84],[15.38,11.52],[15.38,11.2],[15.38,10.88],[15.38,10.55],[15.38,10.23],[15.38,9.91],[15.38,9.6],[15.38,9.28],[15.38,8.96],[15.38,8.63],[15.06,8.62],[14.74,8.62],[14.43,8.62],[14.11,8.62],[13.79,8.62],[13.46,8.62],[13.14,8.62],[12.82,8.62],[12.51,8.62],[12.19,8.62],[11.87,8.62],[11.54,8.62],[11.22,8.62],[10.9,8.62],[10.59,8.62],[10.27,8.62],[9.95,8.62],[9.62,8.62],[9.3,8.62],[8.98,8.62],[8.66,8.62]],[[17.25,0.04],[17.25,0.36],[17.25,0.68],[17.25,1],[17.25,1.32],[17.25,1.64],[17.25,1.96],[17.25,2.28],[17.25,2.6],[17.25,2.92],[17.25,3.24],[17.25,3.56],[17.25,3.88],[17.25,4.2],[17.25,4.52],[17.25,4.84],[17.25,5.16],[17.25,5.48],[17.25,5.8],[17.25,6.12],[17.25,6.44],[17.25,6.76],[17.25,7.08],[17.25,7.4],[17.25,7.72],[17.25,8.04],[17.25,8.36],[17.25,8.68],[17.25,9],[17.25,9.32],[17.25,9.64],[17.25,9.96],[17.25,10.28],[17.25,10.6],[17.25,10.92],[17.25,11.24],[17.25,11.56],[17.25,11.88],[17.25,12.2],[17.25,12.52],[17.25,12.84],[17.25,13.16],[17.25,13.48],[17.25,13.8],[17.25,14.12],[17.25,14.44],[17.25,14.76],[17.25,15.08],[17.25,15.4],[17.25,15.72],[17.25,16.04],[17.25,16.36],[17.25,16.68],[17.25,17],[17.25,17.32],[17.25,17.64],[17.25,17.96],[17.25,18.28],[17.25,18.6],[17.25,18.92],[17.25,19.24],[17.25,19.56],[17.25,19.88],[17.25,20.2],[17.25,20.52],[17.25,20.84],[17.25,21.16],[17.25,21.48],[17.25,21.8],[17.25,22.12],[17.25,22.44],[17.25,22.76],[17.25,23.08],[17.25,23.4],[17.25,23.72],[17.37,24],[17.69,24],[18.01,24],[18.33,24],[18.65,24],[18.97,24],[19.29,24],[19.61,24],[19.93,24],[20.25,24],[20.57,24],[20.89,24],[21.21,24],[21.53,24],[21.85,24],[22.17,24],[22.49,24],[22.81,24],[23.13,24],[23.45,24],[23.77,24],[24,23.83],[24,23.51],[24,23.19],[24,22.87],[24,22.55],[24,22.23],[24,21.91],[24,21.59],[24,21.27],[24,20.95],[24,20.63],[24,20.31],[24,19.99],[24,19.67],[24,19.35],[24,19.03],[24,18.71],[24,18.39],[24,18.07],[24,17.75],[24,17.43],[24,17.11],[24,16.79],[24,16.47],[24,16.15],[24,15.83],[24,15.51],[24,15.19],[24,14.87],[24,14.55],[24,14.23],[24,13.91],[24,13.59],[24,13.27],[24,12.95],[24,12.63],[24,12.31],[24,11.99],[24,11.67],[24,11.35],[24,11.03],[24,10.71],[24,10.39],[24,10.07],[24,9.75],[24,9.43],[24,9.11],[24,8.79],[24,8.47],[24,8.15],[24,7.83],[24,7.51],[24,7.19],[24,6.87],[24,6.55],[24,6.23],[24,5.91],[24,5.59],[24,5.27],[24,4.95],[24,4.63],[24,4.31],[24,3.99],[24,3.67],[24,3.35],[24,3.03],[24,2.71],[24,2.39],[24,2.07],[24,1.75],[24,1.43],[24,1.11],[24,0.79],[24,0.47],[24,0.15],[23.83,0],[23.51,0],[23.19,0],[22.87,0],[22.55,0],[22.23,0],[21.91,0],[21.59,0],[21.27,0],[20.95,0],[20.63,0],[20.31,0],[19.99,0],[19.67,0],[19.35,0],[19.03,0],[18.71,0],[18.39,0],[18.07,0],[17.75,0],[17.43,0]]];

const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
const area = (l) => Math.abs(l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/** The mark's parts: each an outline (u right, v up, -1..1) with the holes cut in it, its middle and its size. */
function parts() {
  const L = MARK.map((l) => l.map(([x, y]) => [(x - 12) / 12, (12 - y) / 12]));
  const depth = L.map((l, i) => L.filter((o, j) => j !== i && inPoly(l[0], o)).length), out = [];
  L.forEach((l, i) => { if (depth[i] % 2 === 0) out.push({ loops: [l], a: area(l) }); });
  L.forEach((l, i) => { if (depth[i] % 2) { const host = out.filter((p) => inPoly(l[0], p.loops[0])).sort((x, y) => x.a - y.a)[0]; if (host) host.loops.push(l); } });
  return out.map((p, i) => { const o = p.loops[0], n = o.length; return { ...p, i, c: [o.reduce((s, q) => s + q[0], 0) / n, o.reduce((s, q) => s + q[1], 0) / n], pose: { dx: 0, dy: 0, rot: 0, pivot: null, yaw: 0, ypu: 0, dz: 0 } }; });
}
/** A point on screen: (u, v), d deep, turned by yaw about the upright line u = ypu. The turn mostly narrows; how far it carries a
 * point toward you counts only a little (DEEP), so the mark stays level. The front leans down and left of the back. */
const S = (u, v, d, yaw, ypu) => { const x = (u - ypu) * K, z = d - T / 2, c = Math.cos(yaw), s = Math.sin(yaw), x2 = x * c - z * s + ypu * K, z2 = x * s * DEEP + z * c + T / 2; return [CX + x2 - z2 * 0.7, CY - v * K + z2 * 0.5]; };
/** A part as a plate: the face turned away, the sides, the face turned toward you. */
const plate = (g) => { const b = mk("g", {}, g); return { g: b, away: mk("path", { class: "sil" }, b), side: mk("path", { class: "fo" }, b), toward: mk("path", { class: "sil" }, b) }; };
/** Draws a part in its pose: moved (dx, dy), turned rot in the plane about its pivot, turned yaw upright, lifted dz toward you. */
function drawPart(p) {
  const { dx, dy, rot, pivot, yaw, ypu, dz } = p.pose, pv = pivot || p.c, c = Math.cos(rot), s = Math.sin(rot);
  const at = ([u, v]) => { const x = u - pv[0], y = v - pv[1]; return [pv[0] + x * c - y * s + dx, pv[1] + x * s + y * c + dy]; };
  const ls = p.loops.map((l) => l.map(at)), front = Math.cos(yaw) >= 0;
  const f = ls.map((l) => l.map(([u, v]) => S(u, v, dz + T, yaw, ypu))), b = ls.map((l) => l.map(([u, v]) => S(u, v, dz, yaw, ypu))), sides = [];
  ls.forEach((l, k) => l.forEach((q, i) => { const j = (i + 1) % l.length; sides.push({ d: ((q[0] + l[j][0]) / 2 - ypu) * Math.sin(yaw), q: poly([f[k][i], f[k][j], b[k][j], b[k][i]]) }); }));
  p.el.away.setAttribute("d", (front ? b : f).map(poly).join(""));
  p.el.side.setAttribute("d", sides.sort((x, y) => x.d - y.d).map((x) => x.q).join(""));
  p.el.toward.setAttribute("d", (front ? f : b).map(poly).join(""));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let amt = value;
  const g = mk("g", {}, svg), ps = parts();
  ps.forEach((p) => { p.el = plate(g); });
  const big = ps.slice().sort((x, y) => y.a - x.a), M = [0, 0]; // parts, largest first; the mark's middle
  // how near the pointer is to the mark's middle, which never moves: 1 at it, 0 well outside
  const near = (q) => (q ? clamp(1.25 - Math.hypot(q[0] - CX, q[1] - CY) / (K * 1.1), 0, 1) : 0);

  // the equalizer: each bar's rise falls off with its distance from the pointer's x, on its own spring
  const sp = ps.map(() => spring(0, { eps: 0.05 })), bx = ps.map((p) => S(p.c[0], p.c[1], T, 0, 0)[0]);
  function pose(dt) { let mv = false; ps.forEach((p, k) => { if (stepS(sp[k], dt)) mv = true; p.pose.dz = sp[k].x; }); return mv; }
  function point(q) {
    const on = near(q) > 0;
    ps.forEach((p, k) => { sp[k].t = on ? amt * Math.max(0.15, 1 - Math.abs(q[0] - bx[k]) / 90) : 0; });
    const a = on ? ps.reduce((b, p, k) => (Math.abs(q[0] - bx[k]) < Math.abs(q[0] - bx[b]) ? k : b), 0) : -1;
    read.textContent = on ? `bar ${a + 1}` : "rest";
  }
  let drawn = "";
  function draw() {
    const key = ps.map((p) => [p.pose.dx, p.pose.dy, p.pose.rot, p.pose.yaw, p.pose.dz].map((n) => n.toFixed(4)).join()).join("|");
    if (key === drawn) return; drawn = key;
    ps.forEach(drawPart);
    // nearer parts are painted later
    const order = ps.slice().sort((x, y) => x.pose.dz - y.pose.dz || x.i - y.i);
    if (order.some((p, k) => g.children[k] !== p.el.g)) order.forEach((p) => g.append(p.el.g));
  }
  draw();

  // each part lights while the pointer is over it, tested against its outline at rest; the topmost that holds it wins
  const hit = ps.map((p) => ({ p, ls: p.loops.map((l) => l.map(([u, v]) => S(u, v, T, 0, 0))) }));
  const under = (q) => { for (let k = hit.length - 1; k >= 0; k--) if (hit[k].ls.reduce((n, l) => n + (inPoly(q, l) ? 1 : 0), 0) % 2) return hit[k].p; return null; };
  let lit = null;
  const light = (q) => { const p = q ? under(q) : null; if (p !== lit) { lit = p; ps.forEach((x) => x.el.toward.classList.toggle("hi", x === p)); } };

  const B = register(stage, (dt) => { const m = pose(dt, performance.now()); draw(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, { move: (q) => { light(q); point(q); B.wake(); }, leave: () => { light(null); point(null); B.wake(); } }));
  bag.add(() => svg.replaceChildren());
  point(null);

  return { set: (v) => { amt = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "manjaro",
  means: "Manjaro's bars as an equalizer: each comes toward you by how near the pointer's x is to it, and settles when you leave.",
  rules: [1, 2, 3, 8],
  range: [10, 18, 28],
  mount,
});
