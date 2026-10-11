/**
 * Docker: the whale and the nine containers on its back as thick plates facing you. Bring the pointer over it and
 * the cargo is loaded: the containers lift toward you and drop back in a wave running from the tail to the head,
 * over and over, the whale bobbing under them; leave and they settle. The container under the pointer takes the
 * bright edge. The slider is how high they lift. A tribute: the mark belongs to Docker.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from Docker's own mark (docker-mark-deep-blue.svg): closed loops in its own 24 square, y down
const MARK = [[[23.61,10.31],[23.43,10.21],[23.2,10.12],[22.94,10.04],[22.65,9.98],[22.34,9.94],[22.02,9.91],[21.68,9.89],[21.34,9.9],[21.0,9.93],[20.67,9.98],[20.35,10.05],[20.32,9.75],[20.27,9.46],[20.19,9.17],[20.08,8.89],[19.95,8.63],[19.8,8.37],[19.62,8.11],[19.41,7.86],[19.19,7.62],[18.93,7.39],[18.66,7.16],[18.27,6.9],[18.01,7.29],[17.86,7.54],[17.73,7.79],[17.62,8.05],[17.53,8.33],[17.46,8.61],[17.4,8.9],[17.36,9.19],[17.34,9.48],[17.34,9.76],[17.35,10.05],[17.4,10.34],[17.46,10.64],[17.56,10.94],[17.68,11.23],[17.83,11.51],[18.01,11.76],[17.86,11.83],[17.72,11.91],[17.58,11.97],[17.43,12.03],[17.29,12.09],[17.13,12.14],[16.98,12.19],[16.81,12.23],[16.64,12.26],[16.47,12.29],[16.28,12.32],[16.08,12.34],[15.88,12.36],[15.66,12.38],[15.43,12.4],[15.18,12.41],[14.92,12.42],[14.65,12.42],[14.35,12.43],[14.04,12.43],[13.72,12.43],[13.37,12.43],[13.0,12.43],[12.61,12.43],[12.2,12.42],[11.77,12.42],[11.31,12.42],[10.83,12.42],[10.32,12.41],[9.79,12.41],[9.22,12.41],[0.0,12.41],[0.0,12.6],[0.0,12.81],[0.01,13.03],[0.02,13.26],[0.04,13.5],[0.06,13.76],[0.09,14.02],[0.13,14.29],[0.17,14.57],[0.23,14.86],[0.29,15.15],[0.37,15.45],[0.46,15.75],[0.55,16.05],[0.66,16.36],[0.79,16.67],[0.92,16.97],[1.08,17.28],[1.24,17.58],[1.43,17.88],[1.63,18.17],[1.84,18.47],[2.03,18.7],[2.23,18.92],[2.44,19.14],[2.61,19.31],[2.79,19.47],[2.98,19.63],[3.17,19.78],[3.37,19.93],[3.58,20.07],[3.8,20.21],[4.02,20.34],[4.25,20.47],[4.5,20.59],[4.75,20.7],[5.01,20.81],[5.27,20.91],[5.55,21.0],[5.84,21.09],[6.13,21.17],[6.43,21.23],[6.75,21.3],[7.07,21.35],[7.4,21.39],[7.75,21.43],[8.1,21.45],[8.46,21.47],[8.84,21.47],[9.12,21.47],[9.4,21.46],[9.68,21.44],[9.96,21.42],[10.23,21.39],[10.5,21.36],[10.78,21.32],[11.04,21.27],[11.31,21.21],[11.58,21.15],[11.84,21.08],[12.1,21.01],[12.36,20.93],[12.62,20.84],[12.87,20.74],[13.12,20.64],[13.37,20.53],[13.62,20.41],[13.86,20.29],[14.11,20.16],[14.35,20.02],[14.58,19.87],[14.82,19.72],[15.05,19.55],[15.28,19.39],[15.5,19.21],[15.73,19.03],[15.95,18.83],[16.16,18.63],[16.38,18.43],[16.59,18.21],[16.8,17.99],[17.0,17.76],[17.21,17.52],[17.41,17.27],[17.6,17.02],[17.79,16.75],[17.98,16.48],[18.17,16.2],[18.35,15.91],[18.53,15.62],[18.7,15.31],[18.88,15.0],[19.04,14.68],[19.21,14.35],[19.37,14.01],[19.53,13.66],[19.68,13.3],[19.83,12.94],[20.01,12.94],[20.21,12.94],[20.44,12.94],[20.7,12.93],[20.97,12.91],[21.25,12.86],[21.55,12.8],[21.85,12.72],[22.15,12.6],[22.45,12.46],[22.74,12.27],[23.02,12.05],[23.28,11.78],[23.52,11.47],[23.74,11.1],[23.88,10.82],[24.0,10.57]],[[6.02,9.08],[3.43,9.08],[3.43,11.67],[6.02,11.67]],[[9.37,9.08],[6.78,9.08],[6.78,11.67],[9.37,11.67]],[[12.72,9.08],[10.13,9.08],[10.13,11.67],[12.72,11.67]],[[16.07,9.08],[13.48,9.08],[13.48,11.67],[16.07,11.67]],[[2.67,9.08],[0.08,9.08],[0.08,11.67],[2.67,11.67]],[[6.02,5.8],[3.43,5.8],[3.43,8.4],[6.02,8.4]],[[9.37,5.8],[6.78,5.8],[6.78,8.4],[9.37,8.4]],[[12.72,5.8],[10.13,5.8],[10.13,8.4],[12.72,8.4]],[[12.72,2.53],[10.13,2.53],[10.13,5.12],[12.72,5.12]]];

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

  const s = spring(0, { eps: 0.002 }), whale = big[0], boxes = ps.filter((p) => p !== whale).sort((a, b) => a.c[0] - b.c[0] || a.c[1] - b.c[1]);
  let clock = 0, on = false;
  function pose(dt) {
    const mv = stepS(s, dt); if (s.x > 0.001 && !reducedMotion()) clock += dt;
    boxes.forEach((p, k) => { const w = Math.max(0, Math.sin(clock * 5 - k * 0.7)); p.pose.dz = s.x * amt * w; p.pose.dy = s.x * 0.03 * w; });
    whale.pose.dy = s.x * 0.015 * Math.sin(clock * 2.5);
    return mv || s.x > 0.001;
  }
  function point(q) { on = near(q) > 0; s.t = on ? 1 : 0; read.textContent = on ? "loading" : "rest"; }
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
  name: "docker",
  means: "Docker's whale: bring the pointer over it and the containers lift and drop in a wave as it bobs; leave and they settle.",
  rules: [1, 2, 7, 10],
  range: [6, 10, 16],
  mount,
});
