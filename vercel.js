/**
 * Vercel: the triangle as one thick plate facing you. Bring the pointer over it and it deploys: it lifts up off
 * its place and comes toward you, on a spring that overshoots a little; leave and it lands back. The slider is how
 * high it goes. A tribute: the mark belongs to Vercel.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[24,22.52],[23.68,22.52],[23.36,22.52],[23.04,22.52],[22.72,22.52],[22.4,22.52],[22.08,22.52],[21.76,22.52],[21.44,22.52],[21.12,22.52],[20.8,22.52],[20.48,22.52],[20.16,22.52],[19.84,22.52],[19.52,22.52],[19.2,22.52],[18.88,22.52],[18.56,22.52],[18.24,22.52],[17.92,22.52],[17.6,22.52],[17.28,22.52],[16.96,22.52],[16.64,22.52],[16.32,22.52],[16,22.52],[15.68,22.52],[15.36,22.52],[15.04,22.52],[14.72,22.52],[14.4,22.52],[14.08,22.52],[13.76,22.52],[13.44,22.52],[13.12,22.52],[12.8,22.52],[12.48,22.52],[12.16,22.52],[11.84,22.52],[11.52,22.52],[11.2,22.52],[10.88,22.52],[10.56,22.52],[10.24,22.52],[9.92,22.52],[9.6,22.52],[9.28,22.52],[8.96,22.52],[8.64,22.52],[8.32,22.52],[8,22.52],[7.68,22.52],[7.36,22.52],[7.04,22.52],[6.72,22.52],[6.4,22.52],[6.08,22.52],[5.76,22.52],[5.44,22.52],[5.12,22.52],[4.8,22.52],[4.48,22.52],[4.16,22.52],[3.84,22.52],[3.52,22.52],[3.2,22.52],[2.88,22.52],[2.56,22.52],[2.24,22.52],[1.92,22.52],[1.6,22.52],[1.28,22.52],[0.96,22.52],[0.64,22.52],[0.32,22.52],[0,22.52],[0.16,22.25],[0.32,21.97],[0.47,21.69],[0.63,21.41],[0.79,21.14],[0.95,20.86],[1.11,20.58],[1.27,20.3],[1.43,20.02],[1.58,19.75],[1.74,19.47],[1.9,19.19],[2.06,18.91],[2.22,18.63],[2.38,18.36],[2.54,18.08],[2.69,17.8],[2.85,17.52],[3.01,17.24],[3.17,16.96],[3.33,16.69],[3.49,16.41],[3.65,16.13],[3.8,15.85],[3.96,15.57],[4.12,15.3],[4.28,15.02],[4.44,14.74],[4.6,14.46],[4.75,14.19],[4.91,13.91],[5.07,13.63],[5.23,13.35],[5.39,13.07],[5.55,12.79],[5.71,12.52],[5.86,12.24],[6.02,11.96],[6.18,11.68],[6.34,11.4],[6.5,11.13],[6.66,10.85],[6.82,10.57],[6.97,10.29],[7.13,10.02],[7.29,9.74],[7.45,9.46],[7.61,9.18],[7.77,8.9],[7.92,8.62],[8.08,8.35],[8.24,8.07],[8.4,7.79],[8.56,7.51],[8.72,7.24],[8.88,6.96],[9.03,6.68],[9.19,6.4],[9.35,6.12],[9.51,5.84],[9.67,5.57],[9.83,5.29],[9.98,5.01],[10.14,4.73],[10.3,4.46],[10.46,4.18],[10.62,3.9],[10.78,3.62],[10.94,3.34],[11.09,3.06],[11.25,2.79],[11.41,2.51],[11.57,2.23],[11.73,1.95],[11.89,1.68],[12.1,1.66],[12.26,1.94],[12.42,2.21],[12.58,2.49],[12.74,2.77],[12.9,3.05],[13.05,3.33],[13.21,3.6],[13.37,3.88],[13.53,4.16],[13.69,4.44],[13.85,4.71],[14.01,4.99],[14.16,5.27],[14.32,5.55],[14.48,5.83],[14.64,6.11],[14.8,6.38],[14.96,6.66],[15.12,6.94],[15.27,7.22],[15.43,7.5],[15.59,7.77],[15.75,8.05],[15.91,8.33],[16.07,8.61],[16.22,8.88],[16.38,9.16],[16.54,9.44],[16.7,9.72],[16.86,10.0],[17.02,10.28],[17.18,10.55],[17.33,10.83],[17.49,11.11],[17.65,11.39],[17.81,11.66],[17.97,11.94],[18.13,12.22],[18.29,12.5],[18.44,12.78],[18.6,13.05],[18.76,13.33],[18.92,13.61],[19.08,13.89],[19.24,14.17],[19.39,14.45],[19.55,14.72],[19.71,15.0],[19.87,15.28],[20.03,15.56],[20.19,15.84],[20.34,16.11],[20.5,16.39],[20.66,16.67],[20.82,16.95],[20.98,17.23],[21.14,17.5],[21.3,17.78],[21.45,18.06],[21.61,18.34],[21.77,18.61],[21.93,18.89],[22.09,19.17],[22.25,19.45],[22.41,19.73],[22.56,20.0],[22.72,20.28],[22.88,20.56],[23.04,20.84],[23.2,21.12],[23.36,21.39],[23.51,21.67],[23.67,21.95],[23.83,22.23],[23.99,22.51]]];

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

  const up = spring(0, { k: 120, c: 12, eps: 0.002 });
  function pose(dt) { const mv = stepS(up, dt); for (const p of ps) { p.pose.dy = up.x * amt; p.pose.dz = up.x * 12; } return mv; }
  function point(q) { up.t = near(q) > 0 ? 1 : 0; read.textContent = up.t ? "deploying" : "rest"; }
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
  name: "vercel",
  means: "Vercel's triangle deploys: bring the pointer over it and it lifts up and toward you; leave and it lands back.",
  rules: [1, 5, 8, 10],
  range: [0.08, 0.14, 0.22],
  mount,
});
