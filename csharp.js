/**
 * C#: the C# mark, a hexagon with the C and the hash cut through it, as thick plates facing you. As the pointer
 * nears, the hexagon pops toward you, the C lifts out spinning once and the hash pops out, growing and turning a quarter turn, as it
 * grows in the reference animation; leave and both drop back into their slots.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "lift";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[1.19,7.54],[1.19,7.82],[1.19,8.1],[1.19,8.38],[1.19,8.66],[1.19,8.94],[1.19,9.22],[1.19,9.5],[1.19,9.78],[1.19,10.06],[1.19,10.34],[1.19,10.62],[1.19,10.9],[1.19,11.18],[1.19,11.46],[1.19,11.74],[1.19,12.02],[1.19,12.3],[1.19,12.58],[1.19,12.86],[1.19,13.14],[1.19,13.42],[1.19,13.7],[1.19,13.98],[1.19,14.26],[1.19,14.54],[1.19,14.82],[1.19,15.1],[1.19,15.38],[1.19,15.66],[1.19,15.94],[1.19,16.22],[1.19,16.5],[1.21,16.78],[1.25,17.06],[1.32,17.33],[1.41,17.6],[1.53,17.85],[1.66,18.09],[1.82,18.32],[2,18.54],[2.2,18.74],[2.42,18.92],[2.65,19.08],[2.89,19.22],[3.13,19.36],[3.37,19.5],[3.62,19.64],[3.86,19.78],[4.1,19.92],[4.34,20.06],[4.59,20.2],[4.83,20.34],[5.07,20.48],[5.31,20.62],[5.56,20.76],[5.8,20.9],[6.04,21.04],[6.28,21.18],[6.53,21.32],[6.77,21.46],[7.01,21.6],[7.25,21.74],[7.5,21.88],[7.74,22.02],[7.98,22.16],[8.22,22.3],[8.47,22.44],[8.71,22.58],[8.95,22.72],[9.19,22.86],[9.44,23],[9.68,23.14],[9.92,23.28],[10.16,23.42],[10.41,23.56],[10.65,23.69],[10.91,23.8],[11.17,23.89],[11.45,23.95],[11.72,23.99],[12,24],[12.28,23.99],[12.56,23.95],[12.83,23.89],[13.1,23.8],[13.36,23.69],[13.6,23.55],[13.84,23.41],[14.09,23.27],[14.33,23.13],[14.57,22.99],[14.81,22.85],[15.06,22.71],[15.3,22.57],[15.54,22.43],[15.78,22.29],[16.03,22.15],[16.27,22.01],[16.51,21.87],[16.75,21.73],[17,21.59],[17.24,21.45],[17.48,21.31],[17.72,21.17],[17.97,21.03],[18.21,20.89],[18.45,20.75],[18.69,20.61],[18.94,20.47],[19.18,20.33],[19.42,20.19],[19.66,20.05],[19.91,19.91],[20.15,19.77],[20.39,19.63],[20.63,19.49],[20.88,19.35],[21.12,19.21],[21.36,19.07],[21.59,18.91],[21.81,18.73],[22,18.53],[22.18,18.32],[22.34,18.09],[22.48,17.84],[22.59,17.59],[22.68,17.32],[22.75,17.05],[22.79,16.77],[22.81,16.49],[22.81,16.21],[22.81,15.93],[22.81,15.65],[22.81,15.37],[22.81,15.09],[22.81,14.81],[22.81,14.53],[22.81,14.25],[22.81,13.97],[22.81,13.69],[22.81,13.41],[22.81,13.13],[22.81,12.85],[22.81,12.57],[22.81,12.29],[22.81,12.01],[22.81,11.73],[22.81,11.45],[22.81,11.17],[22.81,10.89],[22.81,10.61],[22.81,10.33],[22.81,10.05],[22.81,9.77],[22.81,9.49],[22.81,9.21],[22.81,8.93],[22.81,8.65],[22.81,8.37],[22.81,8.09],[22.81,7.81],[22.81,7.53],[22.79,7.25],[22.75,6.98],[22.69,6.7],[22.6,6.44],[22.49,6.18],[22.36,5.94],[22.2,5.71],[22.02,5.49],[21.83,5.29],[21.61,5.11],[21.39,4.94],[21.14,4.8],[20.9,4.66],[20.66,4.52],[20.42,4.38],[20.17,4.24],[19.93,4.1],[19.69,3.96],[19.45,3.82],[19.2,3.68],[18.96,3.54],[18.72,3.4],[18.48,3.26],[18.23,3.12],[17.99,2.98],[17.75,2.84],[17.51,2.7],[17.26,2.56],[17.02,2.42],[16.78,2.28],[16.54,2.14],[16.29,2],[16.05,1.86],[15.81,1.72],[15.57,1.58],[15.32,1.44],[15.08,1.3],[14.84,1.16],[14.6,1.02],[14.35,0.88],[14.11,0.74],[13.87,0.6],[13.63,0.46],[13.38,0.33],[13.13,0.21],[12.86,0.12],[12.59,0.06],[12.31,0.02],[12.03,0],[11.75,0.01],[11.48,0.04],[11.2,0.1],[10.94,0.19],[10.68,0.3],[10.43,0.43],[10.19,0.57],[9.95,0.71],[9.7,0.85],[9.46,0.99],[9.22,1.13],[8.98,1.27],[8.73,1.41],[8.49,1.55],[8.25,1.69],[8.01,1.83],[7.76,1.97],[7.52,2.11],[7.28,2.25],[7.04,2.39],[6.79,2.53],[6.55,2.67],[6.31,2.81],[6.07,2.95],[5.82,3.09],[5.58,3.23],[5.34,3.37],[5.1,3.51],[4.85,3.65],[4.61,3.79],[4.37,3.93],[4.13,4.07],[3.88,4.21],[3.64,4.35],[3.4,4.49],[3.16,4.63],[2.91,4.77],[2.67,4.91],[2.44,5.07],[2.22,5.24],[2.02,5.44],[1.84,5.65],[1.68,5.88],[1.54,6.12],[1.42,6.38],[1.33,6.64],[1.26,6.91],[1.21,7.19],[1.19,7.47]],[[6.6,10.46],[6.6,10.74],[6.6,11.02],[6.6,11.3],[6.6,11.58],[6.6,11.86],[6.6,12.14],[6.6,12.42],[6.6,12.7],[6.6,12.98],[6.6,13.26],[6.6,13.54],[6.64,13.81],[6.79,14.05],[7,14.22],[7.27,14.31],[7.55,14.3],[7.8,14.18],[8,13.99],[8.12,13.73],[8.15,13.46],[8.23,13.19],[8.4,12.97],[8.64,12.83],[8.91,12.77],[9.18,12.82],[9.42,12.97],[9.6,13.18],[9.68,13.45],[9.68,13.73],[9.64,14.01],[9.57,14.28],[9.46,14.54],[9.33,14.78],[9.16,15.01],[8.97,15.21],[8.76,15.4],[8.53,15.55],[8.28,15.68],[8.01,15.77],[7.74,15.83],[7.46,15.86],[7.18,15.85],[6.9,15.81],[6.63,15.74],[6.37,15.64],[6.13,15.5],[5.9,15.34],[5.7,15.15],[5.52,14.93],[5.36,14.7],[5.24,14.45],[5.14,14.18],[5.08,13.91],[5.05,13.63],[5.05,13.35],[5.05,13.07],[5.05,12.79],[5.05,12.51],[5.05,12.23],[5.05,11.95],[5.05,11.67],[5.05,11.39],[5.05,11.11],[5.05,10.83],[5.05,10.55],[5.06,10.27],[5.1,10],[5.17,9.73],[5.28,9.47],[5.41,9.22],[5.57,8.99],[5.76,8.79],[5.98,8.61],[6.21,8.45],[6.46,8.33],[6.72,8.23],[7,8.17],[7.28,8.14],[7.55,8.15],[7.83,8.19],[8.1,8.26],[8.36,8.36],[8.61,8.5],[8.83,8.66],[9.04,8.85],[9.22,9.07],[9.37,9.3],[9.5,9.55],[9.59,9.81],[9.65,10.09],[9.68,10.37],[9.66,10.64],[9.55,10.9],[9.35,11.09],[9.09,11.21],[8.82,11.22],[8.55,11.14],[8.33,10.97],[8.19,10.73],[8.14,10.45],[8.09,10.18],[7.94,9.94],[7.72,9.77],[7.46,9.69],[7.18,9.71],[6.93,9.82],[6.73,10.02],[6.62,10.28]],[[18.95,13.54],[18.9,13.82],[18.75,14.06],[18.53,14.23],[18.27,14.31],[17.99,14.32],[17.71,14.32],[17.43,14.32],[17.4,14.57],[17.4,14.85],[17.4,15.13],[17.32,15.4],[17.15,15.62],[16.92,15.77],[16.64,15.82],[16.37,15.78],[16.13,15.64],[15.95,15.42],[15.87,15.16],[15.86,14.88],[15.86,14.6],[15.86,14.32],[15.58,14.32],[15.3,14.32],[15.02,14.32],[14.74,14.32],[14.46,14.32],[14.32,14.53],[14.32,14.81],[14.31,15.09],[14.26,15.37],[14.12,15.6],[13.9,15.77],[13.63,15.85],[13.35,15.83],[13.1,15.72],[12.9,15.52],[12.79,15.26],[12.77,14.98],[12.77,14.7],[12.77,14.42],[12.52,14.32],[12.24,14.32],[11.96,14.32],[11.69,14.25],[11.46,14.09],[11.3,13.87],[11.23,13.6],[11.26,13.32],[11.39,13.07],[11.6,12.89],[11.85,12.79],[12.13,12.77],[12.41,12.77],[12.69,12.77],[12.77,12.53],[12.77,12.25],[12.77,11.97],[12.77,11.69],[12.77,11.41],[12.59,11.23],[12.31,11.23],[12.03,11.23],[11.76,11.19],[11.51,11.06],[11.33,10.84],[11.24,10.58],[11.24,10.3],[11.35,10.05],[11.54,9.84],[11.78,9.72],[12.06,9.69],[12.34,9.69],[12.62,9.69],[12.77,9.48],[12.77,9.2],[12.77,8.92],[12.82,8.64],[12.97,8.4],[13.19,8.23],[13.45,8.15],[13.73,8.17],[13.98,8.28],[14.18,8.48],[14.29,8.73],[14.32,9.01],[14.32,9.29],[14.32,9.57],[14.56,9.69],[14.84,9.69],[15.12,9.69],[15.4,9.69],[15.68,9.69],[15.86,9.5],[15.86,9.22],[15.86,8.94],[15.91,8.67],[16.06,8.43],[16.28,8.26],[16.54,8.18],[16.82,8.2],[17.08,8.32],[17.27,8.52],[17.38,8.77],[17.4,9.05],[17.4,9.33],[17.4,9.61],[17.65,9.69],[17.93,9.69],[18.21,9.69],[18.48,9.75],[18.71,9.9],[18.87,10.13],[18.94,10.4],[18.92,10.68],[18.79,10.92],[18.58,11.11],[18.33,11.21],[18.05,11.23],[17.77,11.23],[17.49,11.23],[17.4,11.47],[17.4,11.75],[17.4,12.03],[17.4,12.31],[17.4,12.59],[17.58,12.77],[17.86,12.77],[18.14,12.77],[18.41,12.81],[18.66,12.94],[18.84,13.15],[18.94,13.42]],[[15.86,11.23],[15.58,11.23],[15.3,11.23],[15.02,11.23],[14.74,11.23],[14.46,11.23],[14.32,11.45],[14.32,11.73],[14.32,12.01],[14.32,12.29],[14.32,12.57],[14.47,12.77],[14.75,12.77],[15.03,12.77],[15.31,12.77],[15.59,12.77],[15.86,12.76],[15.86,12.48],[15.86,12.2],[15.86,11.92],[15.86,11.64],[15.86,11.36]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2], NAMES = { base: "hexagon", 1: "C", 2: "hash", 3: "hash" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.dz = 10 * v; p.pose.rot = -v * 2 * Math.PI; }
  else if (p.k === 2) { p.pose.dz = 16 * v; p.pose.sx = p.pose.sy = 1 + 0.25 * v; p.pose.rot = (v * Math.PI) / 2; }
  else { p.pose.dz = 3 * v; p.pose.sx = p.pose.sy = 1 + 0.05 * v; }
}
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
const area = (l) => Math.abs(l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/** The mark's parts (u right, v up, -1..1): each solid loop with the loops just inside it as holes; a plug is a hole that is
 * also a part of its own, the glyph that lifts out of it. */
function parts() {
  const L = MARK.map((l) => l.map(([x, y]) => [(x - 12) / 12, (12 - y) / 12]));
  const depth = L.map((l, i) => L.filter((o, j) => j !== i && inPoly(l[0], o)).length), out = [];
  L.forEach((l, i) => { if (depth[i] % 2 === 0 || PLUGS.includes(i)) out.push({ loops: [l], a: area(l), k: i, d: depth[i] }); });
  L.forEach((l, i) => { if (!depth[i]) return; const host = out.filter((p) => p.d === depth[i] - 1 && inPoly(l[0], p.loops[0])).sort((x, y) => x.a - y.a)[0]; if (host) host.loops.push(l); });
  return out.map((p, i) => { const o = p.loops[0], n = o.length; return { ...p, i, name: NAMES[p.k] || NAMES.base, c: [o.reduce((s, q) => s + q[0], 0) / n, o.reduce((s, q) => s + q[1], 0) / n], sp: spring(0, { ...POP, eps: 0.002 }), delay: 0, pose: {} }; });
}
/** A point on screen: (u, v), d deep, turned by yaw about the upright line u = ypu. The front leans down and left of the back. */
const S = (u, v, d, yaw, ypu) => { const x = (u - ypu) * K, z = d - T / 2, c = Math.cos(yaw), s = Math.sin(yaw), x2 = x * c - z * s + ypu * K, z2 = x * s * DEEP + z * c + T / 2; return [CX + x2 - z2 * 0.7, CY - v * K + z2 * 0.5]; };
/** A part as a plate: the face turned away, the sides, the face turned toward you. */
const plate = (g) => { const b = mk("g", {}, g); return { g: b, away: mk("path", { class: "sil" }, b), side: mk("path", { class: "fo" }, b), toward: mk("path", { class: "sil" }, b) }; };
/** Draws a part in its pose: scaled (sx, sy) and turned rot about its pivot, moved (dx, dy), turned yaw upright, lifted dz toward you. */
function drawPart(p) {
  const { dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, pivot, yaw = 0, ypu = 0, dz = 0 } = p.pose, pv = pivot || p.c, c = Math.cos(rot), s = Math.sin(rot);
  const at = ([u, v]) => { const x = (u - pv[0]) * sx, y = (v - pv[1]) * sy; return [pv[0] + x * c - y * s + dx, pv[1] + x * s + y * c + dy]; };
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
  // how near the pointer is to the mark's middle, which never moves
  const near = (q) => !!q && Math.hypot(q[0] - CX, q[1] - CY) < K * 1.15;
  // when the pointer comes or goes, each part answers in turn, nearest the pointer first: the stagger
  let on = false, t0 = 0, now = 0;
  function turn(q) {
    const o = q ? [(q[0] - CX) / K, (CY - q[1]) / K] : [0, 0], by = ps.slice().sort((x, y) => Math.hypot(x.c[0] - o[0], x.c[1] - o[1]) - Math.hypot(y.c[0] - o[0], y.c[1] - o[1]));
    by.forEach((p, r) => { p.delay = (ORDER ? ORDER(p) : r) * STEP; });
  }
  function pose(dt) {
    let mv = false;
    // seconds since the pointer came, while it stays: a figure that plays a timed entrance reads it
    const since = on ? (now - t0) / 1000 : -1;
    for (const p of ps) { if (now - t0 >= p.delay) p.sp.t = on ? 1 : 0; else mv = true; if (stepS(p.sp, dt)) mv = true; p.pose = {}; POSE(p, p.sp.x * amt, now / 1000, since); }
    return mv || (AMBIENT && on) || (on && since < 1.2);
  }
  let drawn = "";
  function draw() {
    const key = ps.map((p) => Object.values(p.pose).map((n) => (typeof n === "number" ? n.toFixed(4) : n)).join()).join("|");
    if (key === drawn) return; drawn = key;
    ps.forEach(drawPart);
    // nearer parts are painted later
    const order = ps.slice().sort((x, y) => (x.pose.dz || 0) - (y.pose.dz || 0) || x.i - y.i);
    if (order.some((p, k) => g.children[k] !== p.el.g)) order.forEach((p) => g.append(p.el.g));
  }
  draw();

  // the part under the pointer lights, tested against its outline at rest; the topmost that holds it wins
  const hit = ps.map((p) => ({ p, ls: p.loops.map((l) => l.map(([u, v]) => S(u, v, T, 0, 0))) })).sort((x, y) => x.p.d - y.p.d);
  const under = (q) => { for (let k = hit.length - 1; k >= 0; k--) if (hit[k].ls.reduce((n, l) => n + (inPoly(q, l) ? 1 : 0), 0) % 2) return hit[k].p; return null; };
  let lit = null;
  function point(q) {
    const p = q ? under(q) : null;
    if (p !== lit) { lit = p; ps.forEach((x) => x.el.toward.classList.toggle("hi", x === p)); }
    const n = near(q);
    if (n !== on) { on = n; t0 = now = performance.now(); turn(q); }
    read.textContent = on ? (lit ? lit.name : VERB) : "rest";
  }

  const B = register(stage, (dt, t) => { now = t; const m = pose(dt); draw(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, { move: (q) => { point(q); B.wake(); }, leave: () => { point(null); B.wake(); } }));
  bag.add(() => svg.replaceChildren());
  point(null);

  return { set: (v) => { amt = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "csharp",
  means: "C#'s hexagon pops as the pointer nears; the C lifts out spinning and the hash pops out turning; leave and they drop back.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
