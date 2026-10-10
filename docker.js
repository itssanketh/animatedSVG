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
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[13.98,11.08],[14.3,11.08],[14.62,11.08],[14.94,11.08],[15.26,11.08],[15.58,11.08],[15.9,11.08],[16.21,11.04],[16.29,10.74],[16.29,10.42],[16.29,10.1],[16.29,9.78],[16.29,9.46],[16.29,9.14],[16.2,8.85],[15.89,8.82],[15.57,8.82],[15.25,8.82],[14.93,8.82],[14.61,8.82],[14.29,8.82],[13.97,8.82],[13.8,9.05],[13.8,9.37],[13.8,9.69],[13.8,10.01],[13.8,10.33],[13.8,10.65],[13.81,10.96]],[[11.05,5.65],[11.37,5.65],[11.69,5.65],[12.01,5.65],[12.33,5.65],[12.65,5.65],[12.97,5.65],[13.28,5.59],[13.33,5.29],[13.33,4.97],[13.33,4.65],[13.33,4.33],[13.33,4.01],[13.33,3.69],[13.23,3.41],[12.91,3.39],[12.59,3.39],[12.27,3.39],[11.95,3.39],[11.63,3.39],[11.31,3.39],[10.99,3.39],[10.84,3.64],[10.84,3.96],[10.84,4.28],[10.84,4.6],[10.84,4.92],[10.84,5.24],[10.87,5.55]],[[11.04,8.36],[11.36,8.36],[11.68,8.36],[11.99,8.36],[12.31,8.36],[12.63,8.36],[12.96,8.36],[13.27,8.32],[13.33,8.02],[13.33,7.7],[13.33,7.38],[13.33,7.06],[13.33,6.74],[13.33,6.42],[13.24,6.13],[12.93,6.11],[12.61,6.11],[12.29,6.11],[11.97,6.11],[11.65,6.11],[11.33,6.11],[11.01,6.11],[10.84,6.34],[10.84,6.66],[10.84,6.98],[10.84,7.3],[10.84,7.62],[10.84,7.94],[10.86,8.26]],[[8.13,8.36],[8.45,8.36],[8.77,8.36],[9.09,8.36],[9.41,8.36],[9.73,8.36],[10.05,8.36],[10.35,8.3],[10.4,8.0],[10.4,7.68],[10.4,7.36],[10.4,7.04],[10.4,6.72],[10.4,6.4],[10.29,6.12],[9.97,6.11],[9.65,6.11],[9.34,6.11],[9.02,6.11],[8.7,6.11],[8.38,6.11],[8.06,6.11],[7.92,6.36],[7.92,6.68],[7.92,7.0],[7.92,7.32],[7.92,7.64],[7.92,7.96],[7.95,8.28]],[[5.15,8.36],[5.47,8.36],[5.79,8.36],[6.11,8.36],[6.43,8.36],[6.75,8.36],[7.07,8.36],[7.38,8.31],[7.44,8.01],[7.44,7.69],[7.44,7.37],[7.44,7.05],[7.44,6.73],[7.44,6.41],[7.34,6.13],[7.03,6.11],[6.71,6.11],[6.39,6.11],[6.07,6.11],[5.75,6.11],[5.43,6.11],[5.11,6.11],[4.95,6.35],[4.95,6.67],[4.95,6.99],[4.95,7.31],[4.95,7.63],[4.95,7.95],[4.97,8.27]],[[11.07,11.08],[11.39,11.08],[11.71,11.08],[12.03,11.08],[12.35,11.08],[12.67,11.08],[12.99,11.08],[13.29,11.01],[13.33,10.7],[13.33,10.38],[13.33,10.06],[13.33,9.74],[13.33,9.42],[13.33,9.1],[13.21,8.83],[12.9,8.82],[12.58,8.82],[12.26,8.82],[11.94,8.82],[11.62,8.82],[11.3,8.82],[10.98,8.83],[10.84,9.09],[10.84,9.41],[10.84,9.73],[10.84,10.05],[10.84,10.37],[10.84,10.69],[10.88,11]],[[8.12,11.08],[8.44,11.08],[8.76,11.08],[9.08,11.08],[9.4,11.08],[9.72,11.08],[10.04,11.08],[10.35,11.02],[10.4,10.72],[10.4,10.4],[10.4,10.08],[10.4,9.76],[10.4,9.44],[10.4,9.12],[10.3,8.84],[9.98,8.82],[9.66,8.82],[9.34,8.82],[9.02,8.82],[8.7,8.82],[8.38,8.82],[8.06,8.82],[7.92,9.07],[7.92,9.39],[7.92,9.71],[7.92,10.03],[7.92,10.35],[7.92,10.67],[7.94,10.99]],[[5.14,11.08],[5.46,11.08],[5.78,11.08],[6.1,11.08],[6.42,11.08],[6.74,11.08],[7.06,11.08],[7.37,11.04],[7.44,10.73],[7.44,10.41],[7.44,10.09],[7.44,9.77],[7.44,9.45],[7.44,9.13],[7.35,8.85],[7.04,8.82],[6.71,8.82],[6.39,8.82],[6.08,8.82],[5.75,8.82],[5.43,8.82],[5.12,8.82],[4.95,9.05],[4.95,9.38],[4.95,9.7],[4.95,10.02],[4.95,10.34],[4.95,10.65],[4.97,10.97]],[[2.25,11.08],[2.57,11.08],[2.89,11.08],[3.21,11.08],[3.53,11.08],[3.85,11.08],[4.17,11.08],[4.47,11.02],[4.52,10.71],[4.52,10.39],[4.52,10.07],[4.52,9.75],[4.52,9.43],[4.52,9.11],[4.41,8.84],[4.09,8.82],[3.77,8.82],[3.45,8.82],[3.13,8.82],[2.81,8.82],[2.49,8.82],[2.17,8.82],[2.03,9.08],[2.03,9.4],[2.03,9.72],[2.03,10.04],[2.03,10.36],[2.03,10.68],[2.06,10.99]],[[23.75,9.88],[23.48,9.72],[23.18,9.59],[22.88,9.5],[22.56,9.44],[22.24,9.4],[21.93,9.38],[21.61,9.38],[21.29,9.4],[20.97,9.44],[20.77,9.28],[20.69,8.97],[20.58,8.67],[20.45,8.38],[20.29,8.1],[20.11,7.84],[19.9,7.59],[19.68,7.36],[19.44,7.15],[19.18,6.96],[18.91,6.8],[18.64,6.84],[18.46,7.11],[18.31,7.38],[18.17,7.67],[18.05,7.97],[17.95,8.27],[17.87,8.58],[17.82,8.9],[17.8,9.22],[17.8,9.54],[17.83,9.86],[17.89,10.17],[17.99,10.47],[18.11,10.77],[18.26,11.05],[18.01,11.25],[17.71,11.35],[17.4,11.43],[17.08,11.48],[16.77,11.53],[16.45,11.54],[16.13,11.54],[15.81,11.54],[15.49,11.54],[15.17,11.54],[14.85,11.54],[14.53,11.54],[14.21,11.54],[13.89,11.54],[13.57,11.54],[13.25,11.54],[12.93,11.54],[12.61,11.54],[12.29,11.54],[11.97,11.54],[11.65,11.54],[11.33,11.54],[11.01,11.54],[10.69,11.54],[10.37,11.54],[10.05,11.54],[9.73,11.54],[9.41,11.54],[9.09,11.54],[8.77,11.54],[8.45,11.54],[8.13,11.54],[7.81,11.54],[7.49,11.54],[7.17,11.54],[6.85,11.54],[6.53,11.54],[6.21,11.54],[5.89,11.54],[5.57,11.54],[5.25,11.54],[4.93,11.54],[4.61,11.54],[4.29,11.54],[3.97,11.54],[3.65,11.54],[3.33,11.54],[3.01,11.54],[2.69,11.54],[2.37,11.54],[2.05,11.54],[1.73,11.54],[1.41,11.54],[1.09,11.54],[0.77,11.54],[0.46,11.6],[0.2,11.79],[0.04,12.06],[0,12.38],[0.0,12.7],[0.01,13.02],[0.04,13.34],[0.07,13.65],[0.1,13.97],[0.15,14.29],[0.21,14.6],[0.27,14.92],[0.35,15.23],[0.43,15.54],[0.52,15.84],[0.62,16.15],[0.73,16.45],[0.85,16.74],[0.99,17.03],[1.13,17.32],[1.29,17.6],[1.46,17.87],[1.65,18.13],[1.85,18.38],[2.06,18.62],[2.28,18.85],[2.52,19.06],[2.77,19.25],[3.04,19.43],[3.32,19.6],[3.6,19.74],[3.9,19.87],[4.19,19.98],[4.5,20.09],[4.8,20.18],[5.11,20.26],[5.43,20.33],[5.74,20.39],[6.06,20.44],[6.37,20.49],[6.69,20.52],[7.01,20.55],[7.33,20.58],[7.65,20.59],[7.97,20.61],[8.29,20.61],[8.61,20.61],[8.93,20.6],[9.25,20.59],[9.57,20.57],[9.88,20.54],[10.2,20.51],[10.52,20.47],[10.84,20.43],[11.15,20.37],[11.47,20.32],[11.78,20.25],[12.09,20.17],[12.4,20.09],[12.71,20.0],[13.01,19.9],[13.31,19.8],[13.61,19.68],[13.91,19.56],[14.2,19.43],[14.49,19.29],[14.78,19.15],[15.06,19.0],[15.33,18.84],[15.61,18.66],[15.87,18.49],[16.13,18.3],[16.38,18.11],[16.63,17.9],[16.87,17.69],[17.11,17.48],[17.34,17.25],[17.56,17.02],[17.77,16.78],[17.98,16.54],[18.18,16.29],[18.37,16.04],[18.56,15.77],[18.74,15.51],[18.91,15.24],[19.08,14.97],[19.24,14.69],[19.39,14.41],[19.54,14.12],[19.68,13.84],[19.82,13.55],[19.95,13.26],[20.07,12.96],[20.2,12.67],[20.39,12.42],[20.71,12.42],[21.03,12.39],[21.34,12.35],[21.66,12.28],[21.96,12.18],[22.26,12.06],[22.54,11.91],[22.81,11.74],[23.06,11.54],[23.29,11.32],[23.5,11.07],[23.68,10.81],[23.83,10.53],[23.95,10.23],[23.88,9.98]]];

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
