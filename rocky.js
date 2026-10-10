/**
 * Rocky Linux: the round badge with the peak cut through it, as thick plates facing you. It presses in like a
 * button where the pointer is: it sinks a little and turns away on the side the pointer presses, on springs; leave
 * and it springs back flat. The slider is how far it turns, in degrees. A tribute: the mark belongs to the Rocky
 * Enterprise Software Foundation.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[23.33,15.96],[23.43,15.65],[23.53,15.35],[23.61,15.04],[23.69,14.73],[23.76,14.42],[23.82,14.1],[23.87,13.79],[23.91,13.47],[23.95,13.15],[23.97,12.83],[23.99,12.51],[24.0,12.19],[24.0,11.87],[23.99,11.55],[23.98,11.23],[23.95,10.91],[23.92,10.6],[23.88,10.28],[23.83,9.96],[23.77,9.65],[23.7,9.33],[23.63,9.02],[23.54,8.71],[23.45,8.41],[23.35,8.1],[23.25,7.8],[23.13,7.5],[23.0,7.21],[22.87,6.92],[22.73,6.63],[22.59,6.34],[22.43,6.07],[22.27,5.79],[22.1,5.52],[21.92,5.25],[21.74,4.99],[21.55,4.73],[21.35,4.48],[21.15,4.23],[20.94,3.99],[20.72,3.76],[20.5,3.53],[20.27,3.3],[20.03,3.09],[19.79,2.88],[19.55,2.67],[19.3,2.47],[19.04,2.28],[18.78,2.1],[18.51,1.92],[18.24,1.75],[17.97,1.59],[17.69,1.43],[17.4,1.28],[17.11,1.14],[16.82,1.01],[16.53,0.88],[16.23,0.77],[15.93,0.66],[15.63,0.56],[15.32,0.47],[15.01,0.38],[14.7,0.3],[14.39,0.24],[14.07,0.18],[13.76,0.13],[13.44,0.09],[13.12,0.05],[12.8,0.03],[12.48,0.01],[12.16,0.0],[11.84,0.0],[11.52,0.01],[11.21,0.03],[10.89,0.05],[10.57,0.09],[10.25,0.13],[9.93,0.18],[9.62,0.24],[9.31,0.3],[9.0,0.38],[8.69,0.46],[8.38,0.56],[8.08,0.66],[7.78,0.77],[7.48,0.88],[7.18,1.01],[6.89,1.14],[6.6,1.28],[6.32,1.43],[6.04,1.58],[5.76,1.75],[5.49,1.92],[5.23,2.09],[4.97,2.28],[4.71,2.47],[4.46,2.67],[4.21,2.87],[3.97,3.08],[3.74,3.3],[3.51,3.52],[3.29,3.75],[3.07,3.99],[2.86,4.23],[2.65,4.47],[2.46,4.73],[2.27,4.98],[2.08,5.25],[1.9,5.51],[1.73,5.78],[1.57,6.06],[1.42,6.34],[1.27,6.62],[1.13,6.91],[1.0,7.2],[0.87,7.5],[0.76,7.79],[0.65,8.1],[0.55,8.4],[0.46,8.71],[0.37,9.02],[0.3,9.33],[0.23,9.64],[0.17,9.95],[0.12,10.27],[0.08,10.59],[0.05,10.9],[0.03,11.22],[0.01,11.54],[0.0,11.86],[0.0,12.18],[0.01,12.5],[0.03,12.82],[0.05,13.14],[0.09,13.46],[0.13,13.78],[0.18,14.09],[0.24,14.41],[0.31,14.72],[0.39,15.03],[0.47,15.34],[0.56,15.65],[0.67,15.95],[0.77,16.25],[0.89,16.55],[1.02,16.84],[1.15,17.13],[1.29,17.42],[1.44,17.7],[1.6,17.98],[1.76,18.26],[1.93,18.53],[2.11,18.8],[2.29,19.06],[2.48,19.31],[2.68,19.56],[2.89,19.81],[3.1,20.05],[3.32,20.28],[3.57,20.29],[3.8,20.07],[4.02,19.84],[4.25,19.61],[4.47,19.39],[4.7,19.16],[4.93,18.94],[5.15,18.71],[5.38,18.48],[5.61,18.26],[5.83,18.03],[6.06,17.8],[6.29,17.58],[6.51,17.35],[6.74,17.13],[6.96,16.9],[7.19,16.67],[7.42,16.45],[7.64,16.22],[7.87,15.99],[8.1,15.77],[8.32,15.54],[8.55,15.32],[8.78,15.09],[9.0,14.86],[9.23,14.64],[9.45,14.41],[9.68,14.19],[9.91,13.96],[10.13,13.73],[10.36,13.51],[10.59,13.28],[10.81,13.05],[11.04,12.83],[11.26,12.6],[11.49,12.38],[11.72,12.15],[11.94,11.92],[12.17,11.7],[12.39,11.47],[12.62,11.24],[12.85,11.02],[13.07,10.79],[13.3,10.56],[13.53,10.34],[13.75,10.11],[13.98,9.89],[14.21,9.66],[14.43,9.43],[14.66,9.21],[14.88,8.98],[15.11,8.76],[15.34,8.53],[15.56,8.3],[15.85,8.47],[16.07,8.7],[16.3,8.92],[16.52,9.15],[16.75,9.38],[16.98,9.6],[17.2,9.83],[17.43,10.05],[17.66,10.28],[17.88,10.51],[18.11,10.73],[18.34,10.96],[18.56,11.19],[18.79,11.41],[19.01,11.64],[19.24,11.87],[19.47,12.09],[19.69,12.32],[19.92,12.54],[20.14,12.77],[20.37,13.0],[20.6,13.22],[20.82,13.45],[21.05,13.68],[21.28,13.9],[21.5,14.13],[21.73,14.35],[21.95,14.58],[22.18,14.81],[22.41,15.03],[22.63,15.26],[22.86,15.48],[23.09,15.71],[23.31,15.94]],[[21.13,19.77],[20.91,19.54],[20.68,19.31],[20.45,19.09],[20.23,18.86],[20.0,18.64],[19.77,18.41],[19.55,18.18],[19.32,17.96],[19.09,17.73],[18.87,17.5],[18.64,17.28],[18.42,17.05],[18.19,16.82],[17.96,16.6],[17.74,16.37],[17.51,16.15],[17.28,15.92],[17.06,15.69],[16.83,15.47],[16.61,15.24],[16.38,15.02],[16.15,14.79],[15.93,14.56],[15.7,14.34],[15.42,14.46],[15.19,14.69],[14.96,14.91],[14.74,15.14],[14.51,15.36],[14.29,15.59],[14.06,15.82],[13.83,16.04],[13.61,16.27],[13.38,16.5],[13.15,16.72],[12.93,16.95],[12.7,17.17],[12.48,17.4],[12.25,17.63],[12.02,17.85],[11.8,18.08],[11.57,18.3],[11.34,18.53],[11.12,18.76],[10.89,18.98],[10.66,19.21],[10.44,19.44],[10.21,19.66],[9.99,19.89],[9.76,20.11],[9.53,20.34],[9.31,20.57],[9.08,20.79],[8.86,21.02],[8.63,21.25],[8.4,21.47],[8.18,21.7],[7.95,21.93],[7.72,22.15],[7.5,22.38],[7.27,22.6],[7.04,22.83],[7.29,23.04],[7.58,23.16],[7.88,23.27],[8.18,23.38],[8.49,23.48],[8.8,23.57],[9.11,23.65],[9.42,23.72],[9.73,23.79],[10.04,23.84],[10.36,23.89],[10.68,23.93],[11.0,23.96],[11.32,23.98],[11.64,24.0],[11.96,24],[12.28,24.0],[12.6,23.98],[12.92,23.97],[13.23,23.94],[13.55,23.9],[13.87,23.86],[14.19,23.8],[14.5,23.74],[14.81,23.67],[15.12,23.59],[15.43,23.5],[15.73,23.41],[16.04,23.3],[16.34,23.19],[16.63,23.07],[16.93,22.95],[17.22,22.81],[17.5,22.67],[17.79,22.52],[18.06,22.36],[18.34,22.19],[18.61,22.02],[18.87,21.84],[19.13,21.65],[19.39,21.46],[19.64,21.26],[19.88,21.05],[20.12,20.84],[20.35,20.62],[20.58,20.39],[20.8,20.16],[21.01,19.92]]];

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

  // pressed where the pointer is: the badge sinks, and turns away on that side
  const tilt = spring(0, { eps: 0.05 }), sink = spring(0, { eps: 0.01 });
  function pose(dt) { const mv = [stepS(tilt, dt), stepS(sink, dt)].some(Boolean); for (const p of ps) { p.pose.yaw = rad(tilt.x); p.pose.dz = -sink.x; } return mv; }
  function point(q) {
    const n = near(q); tilt.t = q && n > 0 ? clamp((q[0] - CX) / K, -1, 1) * amt : 0; sink.t = n * 8;
    read.textContent = n > 0 ? "press" : "rest";
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
  name: "rocky",
  means: "Rocky Linux's badge presses in like a button: it sinks and turns away on the side the pointer presses.",
  rules: [1, 3, 8, 10],
  range: [12, 20, 30],
  mount,
});
