/**
 * Python: the two snakes, each with its eye, as thick plates facing you, wound round each other. As the pointer
 * nears they uncoil: each slides away from the middle along its own diagonal, turning a little, and comes toward
 * you, on springs; leave and they wind back together. The snake under the pointer takes the bright edge. The
 * slider is how far apart they slide. A tribute: the mark belongs to the Python Software Foundation.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[14.25,0.18],[14.56,0.25],[14.88,0.32],[15.19,0.39],[15.49,0.5],[15.79,0.61],[16.08,0.74],[16.36,0.89],[16.63,1.06],[16.89,1.24],[17.12,1.46],[17.34,1.7],[17.52,1.96],[17.66,2.25],[17.77,2.55],[17.81,2.87],[17.82,3.19],[17.82,3.51],[17.82,3.83],[17.82,4.15],[17.82,4.47],[17.82,4.79],[17.82,5.11],[17.82,5.43],[17.82,5.75],[17.82,6.07],[17.82,6.39],[17.82,6.71],[17.82,7.03],[17.82,7.35],[17.82,7.67],[17.82,7.99],[17.82,8.31],[17.81,8.63],[17.78,8.95],[17.74,9.26],[17.66,9.57],[17.55,9.87],[17.41,10.16],[17.23,10.43],[17.03,10.67],[16.8,10.89],[16.54,11.08],[16.26,11.23],[15.96,11.36],[15.66,11.46],[15.35,11.55],[15.04,11.61],[14.72,11.64],[14.4,11.64],[14.08,11.64],[13.76,11.64],[13.44,11.64],[13.12,11.64],[12.8,11.64],[12.48,11.64],[12.16,11.64],[11.84,11.64],[11.52,11.64],[11.2,11.64],[10.88,11.64],[10.56,11.64],[10.24,11.64],[9.92,11.64],[9.6,11.64],[9.28,11.64],[8.96,11.64],[8.64,11.65],[8.32,11.67],[8.01,11.71],[7.69,11.78],[7.39,11.87],[7.1,12.0],[6.82,12.16],[6.56,12.34],[6.33,12.57],[6.12,12.81],[5.94,13.07],[5.78,13.35],[5.66,13.65],[5.56,13.95],[5.49,14.26],[5.43,14.58],[5.4,14.89],[5.4,15.21],[5.4,15.53],[5.4,15.85],[5.4,16.17],[5.4,16.49],[5.4,16.81],[5.4,17.13],[5.4,17.45],[5.4,17.77],[5.24,17.93],[4.92,17.93],[4.6,17.93],[4.28,17.93],[3.96,17.93],[3.64,17.93],[3.32,17.93],[3.0,17.91],[2.69,17.83],[2.39,17.72],[2.1,17.58],[1.83,17.4],[1.58,17.2],[1.36,16.98],[1.15,16.73],[0.96,16.48],[0.8,16.2],[0.65,15.92],[0.53,15.62],[0.41,15.32],[0.31,15.02],[0.24,14.71],[0.17,14.4],[0.11,14.08],[0.07,13.77],[0.02,13.45],[-0.01,13.13],[-0.03,12.81],[-0.04,12.49],[-0.05,12.17],[-0.05,11.85],[-0.04,11.53],[-0.02,11.21],[-0.01,10.89],[0.03,10.57],[0.08,10.26],[0.12,9.94],[0.18,9.63],[0.27,9.32],[0.35,9.01],[0.46,8.71],[0.59,8.42],[0.72,8.13],[0.89,7.86],[1.06,7.58],[1.27,7.34],[1.49,7.11],[1.74,6.91],[2.0,6.73],[2.28,6.57],[2.58,6.45],[2.88,6.34],[3.19,6.27],[3.51,6.24],[3.83,6.24],[4.15,6.24],[4.47,6.24],[4.79,6.24],[5.11,6.24],[5.43,6.24],[5.75,6.24],[6.07,6.24],[6.39,6.24],[6.71,6.24],[7.03,6.24],[7.35,6.24],[7.67,6.24],[7.99,6.24],[8.31,6.24],[8.63,6.24],[8.95,6.24],[9.27,6.24],[9.59,6.24],[9.91,6.24],[10.23,6.24],[10.55,6.24],[10.87,6.24],[11.19,6.24],[11.51,6.24],[11.83,6.24],[12.02,6.07],[12.02,5.75],[12.02,5.43],[11.68,5.41],[11.36,5.41],[11.04,5.41],[10.72,5.41],[10.4,5.41],[10.08,5.41],[9.76,5.41],[9.44,5.41],[9.12,5.41],[8.8,5.41],[8.48,5.41],[8.16,5.41],[7.84,5.41],[7.52,5.41],[7.2,5.41],[6.88,5.41],[6.56,5.41],[6.24,5.41],[6.18,5.11],[6.18,4.79],[6.18,4.47],[6.17,4.15],[6.17,3.83],[6.17,3.51],[6.17,3.19],[6.17,2.87],[6.16,2.55],[6.16,2.23],[6.21,1.92],[6.32,1.62],[6.49,1.35],[6.71,1.12],[6.97,0.92],[7.24,0.76],[7.53,0.62],[7.83,0.5],[8.13,0.41],[8.44,0.33],[8.76,0.26],[9.07,0.2],[9.39,0.15],[9.7,0.11],[10.02,0.08],[10.34,0.06],[10.66,0.04],[10.98,0.03],[11.3,0.01],[11.62,0.01],[11.94,0.0],[12.26,0.01],[12.58,0.03],[12.9,0.04],[13.22,0.06],[13.54,0.09],[13.85,0.13],[14.17,0.17]],[[7.95,2.16],[7.77,2.42],[7.67,2.73],[7.67,3.04],[7.75,3.35],[7.92,3.61],[8.18,3.8],[8.47,3.91],[8.79,3.94],[9.1,3.87],[9.36,3.69],[9.56,3.45],[9.69,3.16],[9.73,2.85],[9.67,2.54],[9.5,2.27],[9.27,2.05],[8.99,1.92],[8.67,1.85],[8.36,1.92],[8.08,2.07]],[[21.08,6.12],[21.39,6.2],[21.69,6.31],[21.97,6.46],[22.23,6.65],[22.47,6.86],[22.7,7.08],[22.89,7.33],[23.08,7.59],[23.23,7.88],[23.38,8.16],[23.5,8.46],[23.61,8.76],[23.7,9.06],[23.78,9.37],[23.85,9.68],[23.9,10],[23.95,10.32],[23.99,10.63],[24.02,10.95],[24.03,11.27],[24.04,11.59],[24.05,11.91],[24.05,12.23],[24.04,12.55],[24.02,12.87],[24.0,13.19],[23.96,13.51],[23.91,13.82],[23.86,14.14],[23.8,14.45],[23.71,14.76],[23.63,15.07],[23.51,15.37],[23.38,15.66],[23.23,15.94],[23.06,16.21],[22.89,16.48],[22.67,16.72],[22.45,16.95],[22.2,17.14],[21.93,17.32],[21.65,17.47],[21.35,17.59],[21.05,17.68],[20.73,17.74],[20.41,17.77],[20.09,17.77],[19.77,17.77],[19.45,17.77],[19.14,17.77],[18.82,17.77],[18.5,17.77],[18.18,17.77],[17.86,17.77],[17.54,17.77],[17.21,17.77],[16.89,17.77],[16.57,17.77],[16.25,17.77],[15.94,17.77],[15.62,17.77],[15.29,17.77],[14.97,17.77],[14.65,17.77],[14.34,17.77],[14.02,17.77],[13.7,17.77],[13.38,17.77],[13.05,17.77],[12.73,17.77],[12.41,17.77],[12.1,17.77],[11.98,18.05],[11.98,18.38],[12.12,18.59],[12.45,18.59],[12.77,18.59],[13.09,18.59],[13.4,18.59],[13.72,18.59],[14.04,18.59],[14.37,18.59],[14.69,18.59],[15.01,18.59],[15.32,18.59],[15.64,18.59],[15.96,18.59],[16.29,18.59],[16.61,18.59],[16.93,18.59],[17.25,18.59],[17.57,18.59],[17.82,18.73],[17.82,19.05],[17.82,19.38],[17.82,19.7],[17.82,20.02],[17.83,20.34],[17.83,20.66],[17.83,20.98],[17.83,21.3],[17.84,21.61],[17.82,21.93],[17.73,22.24],[17.59,22.53],[17.4,22.77],[17.16,22.99],[16.9,23.17],[16.61,23.32],[16.32,23.44],[16.02,23.55],[15.71,23.64],[15.4,23.71],[15.09,23.78],[14.77,23.83],[14.45,23.87],[14.13,23.91],[13.82,23.94],[13.5,23.96],[13.18,23.98],[12.86,23.99],[12.54,24.0],[12.22,24.0],[11.9,23.99],[11.58,23.98],[11.26,23.97],[10.94,23.96],[10.62,23.93],[10.3,23.89],[9.98,23.85],[9.67,23.8],[9.36,23.73],[9.04,23.66],[8.74,23.58],[8.43,23.48],[8.13,23.37],[7.84,23.23],[7.56,23.09],[7.3,22.9],[7.04,22.7],[6.82,22.48],[6.62,22.23],[6.44,21.96],[6.31,21.67],[6.22,21.37],[6.18,21.05],[6.18,20.73],[6.18,20.41],[6.18,20.09],[6.18,19.77],[6.18,19.45],[6.18,19.13],[6.18,18.81],[6.18,18.49],[6.18,18.17],[6.18,17.85],[6.18,17.53],[6.18,17.21],[6.18,16.89],[6.18,16.57],[6.18,16.25],[6.18,15.93],[6.18,15.61],[6.2,15.29],[6.22,14.97],[6.28,14.66],[6.36,14.35],[6.49,14.06],[6.63,13.77],[6.82,13.51],[7.03,13.28],[7.27,13.07],[7.54,12.89],[7.82,12.73],[8.11,12.61],[8.42,12.51],[8.73,12.44],[9.04,12.39],[9.36,12.36],[9.68,12.36],[10.0,12.36],[10.32,12.36],[10.64,12.36],[10.96,12.36],[11.28,12.36],[11.6,12.36],[11.92,12.36],[12.24,12.36],[12.56,12.36],[12.88,12.36],[13.2,12.36],[13.52,12.36],[13.84,12.36],[14.16,12.36],[14.48,12.36],[14.8,12.36],[15.12,12.36],[15.44,12.35],[15.76,12.32],[16.08,12.27],[16.39,12.2],[16.69,12.09],[16.98,11.97],[17.25,11.79],[17.5,11.6],[17.73,11.38],[17.93,11.12],[18.11,10.86],[18.25,10.57],[18.37,10.28],[18.46,9.97],[18.53,9.66],[18.58,9.34],[18.6,9.02],[18.6,8.7],[18.6,8.38],[18.6,8.06],[18.6,7.74],[18.6,7.42],[18.6,7.1],[18.6,6.78],[18.6,6.46],[18.6,6.14],[18.93,6.07],[19.25,6.07],[19.57,6.07],[19.89,6.07],[20.21,6.07],[20.53,6.07],[20.85,6.08]],[[14.57,20.36],[14.38,20.63],[14.29,20.93],[14.29,21.24],[14.37,21.55],[14.55,21.81],[14.8,22.0],[15.1,22.11],[15.41,22.13],[15.73,22.07],[15.99,21.88],[16.19,21.64],[16.31,21.35],[16.35,21.04],[16.29,20.72],[16.12,20.45],[15.88,20.24],[15.6,20.11],[15.29,20.05],[14.97,20.12],[14.7,20.27]]];

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

  const s = spring(0, { eps: 0.002 });
  function pose(dt) {
    const mv = stepS(s, dt);
    for (const p of ps) { const l = Math.hypot(p.c[0], p.c[1]) || 1, side = p.c[0] < 0 ? 1 : -1; p.pose.dx = (p.c[0] / l) * amt * s.x; p.pose.dy = (p.c[1] / l) * amt * s.x; p.pose.rot = rad(8) * side * s.x; p.pose.dz = s.x * 6; }
    return mv;
  }
  function point(q) { s.t = near(q); read.textContent = s.t ? `uncoil ${Math.round(s.t * 100)}%` : "rest"; }
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
  name: "python",
  means: "Python's two snakes uncoil as the pointer nears, each sliding away along its diagonal; leave and they wind back.",
  rules: [1, 3, 8, 10],
  range: [0.06, 0.1, 0.16],
  mount,
});
