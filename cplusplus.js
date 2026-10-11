/**
 * C++: the C++ mark, a hexagon with the C and two plus signs cut through it, as thick plates facing you. As the
 * pointer nears, the hexagon pops toward you, the C lifts out spinning once, and the plus signs pop out of their slots one after the
 * other, overshooting as they do in the reference animation; leave and each drops back into its slot.
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
const MARK = [[[22.39,6],[22.24,5.77],[22.06,5.56],[21.84,5.37],[21.6,5.23],[21.36,5.09],[21.12,4.95],[20.88,4.81],[20.63,4.67],[20.39,4.53],[20.15,4.39],[19.91,4.25],[19.66,4.11],[19.42,3.97],[19.18,3.83],[18.94,3.69],[18.69,3.55],[18.45,3.41],[18.21,3.27],[17.97,3.13],[17.72,2.99],[17.48,2.85],[17.24,2.71],[17,2.57],[16.75,2.43],[16.51,2.29],[16.27,2.15],[16.03,2.01],[15.78,1.87],[15.54,1.73],[15.3,1.59],[15.06,1.45],[14.81,1.31],[14.57,1.17],[14.33,1.03],[14.09,0.89],[13.84,0.75],[13.6,0.61],[13.36,0.47],[13.12,0.33],[12.87,0.19],[12.61,0.09],[12.34,0.03],[12.06,0],[11.78,0.01],[11.51,0.06],[11.24,0.14],[10.99,0.27],[10.75,0.41],[10.51,0.55],[10.26,0.69],[10.02,0.83],[9.78,0.97],[9.54,1.11],[9.29,1.25],[9.05,1.39],[8.81,1.53],[8.57,1.67],[8.32,1.81],[8.08,1.95],[7.84,2.09],[7.6,2.23],[7.35,2.37],[7.11,2.51],[6.87,2.65],[6.63,2.79],[6.38,2.93],[6.14,3.07],[5.9,3.21],[5.66,3.35],[5.41,3.49],[5.17,3.63],[4.93,3.77],[4.69,3.91],[4.44,4.05],[4.2,4.19],[3.96,4.33],[3.72,4.47],[3.47,4.61],[3.23,4.75],[2.99,4.89],[2.75,5.03],[2.5,5.17],[2.26,5.31],[2.03,5.47],[1.84,5.67],[1.67,5.9],[1.53,6.14],[1.43,6.4],[1.36,6.67],[1.34,6.95],[1.34,7.23],[1.34,7.51],[1.34,7.79],[1.34,8.07],[1.34,8.35],[1.34,8.63],[1.34,8.91],[1.34,9.19],[1.34,9.47],[1.34,9.75],[1.34,10.03],[1.34,10.31],[1.34,10.59],[1.34,10.87],[1.34,11.15],[1.34,11.43],[1.34,11.71],[1.34,11.99],[1.34,12.27],[1.34,12.55],[1.34,12.83],[1.34,13.11],[1.34,13.39],[1.34,13.67],[1.34,13.95],[1.34,14.23],[1.34,14.51],[1.34,14.79],[1.34,15.07],[1.34,15.35],[1.34,15.63],[1.34,15.91],[1.34,16.19],[1.34,16.47],[1.34,16.75],[1.34,17.03],[1.35,17.31],[1.42,17.58],[1.52,17.84],[1.66,18.08],[1.82,18.31],[2.02,18.51],[2.24,18.68],[2.48,18.82],[2.73,18.96],[2.97,19.1],[3.21,19.24],[3.45,19.38],[3.7,19.52],[3.94,19.66],[4.18,19.8],[4.42,19.94],[4.67,20.08],[4.91,20.22],[5.15,20.36],[5.39,20.5],[5.64,20.64],[5.88,20.78],[6.12,20.92],[6.36,21.06],[6.61,21.2],[6.85,21.34],[7.09,21.48],[7.33,21.62],[7.58,21.76],[7.82,21.9],[8.06,22.04],[8.3,22.18],[8.55,22.32],[8.79,22.46],[9.03,22.6],[9.27,22.74],[9.52,22.88],[9.76,23.02],[10,23.16],[10.24,23.3],[10.49,23.44],[10.73,23.58],[10.97,23.72],[11.22,23.85],[11.48,23.94],[11.76,23.99],[12.04,24],[12.32,23.98],[12.59,23.92],[12.85,23.82],[13.1,23.68],[13.34,23.54],[13.58,23.4],[13.82,23.26],[14.07,23.12],[14.31,22.98],[14.55,22.84],[14.79,22.7],[15.04,22.56],[15.28,22.42],[15.52,22.28],[15.76,22.14],[16.01,22],[16.25,21.86],[16.49,21.72],[16.73,21.58],[16.98,21.44],[17.22,21.3],[17.46,21.16],[17.7,21.02],[17.95,20.88],[18.19,20.74],[18.43,20.6],[18.67,20.46],[18.92,20.32],[19.16,20.18],[19.4,20.04],[19.64,19.9],[19.89,19.76],[20.13,19.62],[20.37,19.48],[20.61,19.34],[20.86,19.2],[21.1,19.06],[21.34,18.92],[21.58,18.78],[21.82,18.64],[22.04,18.46],[22.22,18.25],[22.38,18.02],[22.51,17.77],[22.6,17.51],[22.65,17.23],[22.66,16.95],[22.66,16.67],[22.66,16.39],[22.66,16.11],[22.66,15.83],[22.66,15.55],[22.66,15.27],[22.66,14.99],[22.66,14.71],[22.66,14.43],[22.66,14.15],[22.66,13.87],[22.66,13.59],[22.66,13.31],[22.66,13.03],[22.66,12.75],[22.66,12.47],[22.66,12.19],[22.66,11.91],[22.66,11.63],[22.66,11.35],[22.66,11.07],[22.66,10.79],[22.66,10.51],[22.66,10.23],[22.66,9.95],[22.66,9.67],[22.66,9.39],[22.66,9.11],[22.66,8.83],[22.66,8.55],[22.66,8.27],[22.66,7.99],[22.66,7.71],[22.66,7.43],[22.66,7.15],[22.66,6.87],[22.63,6.59],[22.55,6.33],[22.43,6.07]],[[12,19.11],[11.72,19.1],[11.44,19.09],[11.16,19.06],[10.88,19.02],[10.61,18.97],[10.34,18.91],[10.06,18.84],[9.8,18.76],[9.53,18.67],[9.27,18.57],[9.02,18.45],[8.76,18.33],[8.52,18.2],[8.28,18.05],[8.04,17.9],[7.81,17.74],[7.59,17.57],[7.37,17.39],[7.16,17.21],[6.96,17.01],[6.77,16.81],[6.58,16.6],[6.41,16.38],[6.24,16.16],[6.08,15.93],[5.93,15.69],[5.79,15.45],[5.66,15.21],[5.53,14.95],[5.42,14.7],[5.32,14.44],[5.23,14.17],[5.15,13.9],[5.08,13.63],[5.02,13.36],[4.97,13.08],[4.94,12.8],[4.91,12.53],[4.9,12.25],[4.89,11.97],[4.9,11.69],[4.92,11.41],[4.94,11.13],[4.98,10.85],[5.03,10.58],[5.1,10.3],[5.17,10.03],[5.25,9.76],[5.34,9.5],[5.45,9.24],[5.56,8.99],[5.69,8.73],[5.82,8.49],[5.96,8.25],[6.12,8.01],[6.28,7.79],[6.45,7.56],[6.63,7.35],[6.82,7.14],[7.01,6.94],[7.21,6.75],[7.43,6.56],[7.64,6.39],[7.87,6.22],[8.1,6.06],[8.33,5.91],[8.58,5.77],[8.82,5.64],[9.08,5.52],[9.33,5.41],[9.6,5.31],[9.86,5.22],[10.13,5.14],[10.4,5.07],[10.68,5.01],[10.95,4.97],[11.23,4.93],[11.51,4.91],[11.79,4.89],[12.07,4.89],[12.35,4.9],[12.63,4.92],[12.91,4.95],[13.18,4.99],[13.46,5.04],[13.73,5.11],[14,5.18],[14.27,5.26],[14.53,5.36],[14.79,5.46],[15.05,5.58],[15.3,5.7],[15.54,5.84],[15.78,5.98],[16.02,6.14],[16.24,6.3],[16.46,6.47],[16.68,6.65],[16.89,6.84],[17.09,7.03],[17.28,7.24],[17.46,7.45],[17.64,7.67],[17.8,7.89],[17.96,8.12],[18.11,8.36],[17.93,8.58],[17.68,8.72],[17.44,8.86],[17.2,9],[16.96,9.14],[16.72,9.28],[16.47,9.42],[16.23,9.56],[15.99,9.7],[15.75,9.84],[15.5,9.98],[15.26,10.12],[15,10.09],[14.84,9.86],[14.67,9.65],[14.47,9.44],[14.26,9.26],[14.04,9.09],[13.8,8.94],[13.56,8.8],[13.3,8.69],[13.04,8.6],[12.77,8.53],[12.49,8.48],[12.21,8.45],[11.93,8.44],[11.65,8.46],[11.38,8.5],[11.1,8.56],[10.84,8.64],[10.57,8.74],[10.32,8.86],[10.08,9.01],[9.85,9.17],[9.64,9.34],[9.43,9.54],[9.25,9.75],[9.08,9.97],[8.93,10.21],[8.8,10.45],[8.69,10.71],[8.59,10.98],[8.52,11.25],[8.48,11.52],[8.45,11.8],[8.45,12.08],[8.46,12.36],[8.5,12.64],[8.56,12.91],[8.65,13.18],[8.75,13.44],[8.87,13.69],[9.02,13.93],[9.18,14.16],[9.36,14.37],[9.55,14.57],[9.76,14.76],[9.99,14.93],[10.22,15.08],[10.47,15.21],[10.73,15.32],[10.99,15.41],[11.26,15.48],[11.54,15.52],[11.82,15.55],[12.1,15.55],[12.38,15.53],[12.65,15.49],[12.93,15.43],[13.19,15.35],[13.45,15.24],[13.7,15.12],[13.94,14.97],[14.17,14.81],[14.39,14.63],[14.59,14.44],[14.77,14.23],[14.94,14],[15.09,13.78],[15.33,13.92],[15.58,14.06],[15.82,14.2],[16.06,14.34],[16.3,14.49],[16.55,14.63],[16.79,14.77],[17.03,14.91],[17.27,15.05],[17.52,15.19],[17.76,15.33],[18,15.47],[18.07,15.71],[17.92,15.95],[17.75,16.18],[17.59,16.4],[17.41,16.61],[17.22,16.82],[17.03,17.03],[16.83,17.22],[16.62,17.41],[16.4,17.58],[16.18,17.75],[15.95,17.91],[15.71,18.06],[15.47,18.2],[15.22,18.34],[14.97,18.46],[14.71,18.57],[14.45,18.67],[14.19,18.76],[13.92,18.84],[13.65,18.91],[13.37,18.97],[13.1,19.02],[12.82,19.06],[12.54,19.09],[12.26,19.1]],[[19.11,12.4],[18.83,12.4],[18.55,12.4],[18.32,12.52],[18.32,12.8],[18.32,13.08],[18.06,13.19],[17.78,13.19],[17.53,13.16],[17.53,12.88],[17.53,12.6],[17.37,12.4],[17.09,12.4],[16.81,12.4],[16.74,12.15],[16.74,11.87],[16.76,11.61],[17.04,11.61],[17.32,11.61],[17.53,11.46],[17.53,11.18],[17.53,10.9],[17.77,10.82],[18.05,10.82],[18.32,10.82],[18.32,11.1],[18.32,11.38],[18.46,11.61],[18.74,11.61],[19.02,11.61],[19.11,11.87],[19.11,12.15]],[[22.07,12.4],[21.79,12.4],[21.51,12.4],[21.28,12.53],[21.28,12.81],[21.28,13.09],[21.02,13.19],[20.74,13.19],[20.49,13.16],[20.49,12.88],[20.49,12.6],[20.33,12.4],[20.05,12.4],[19.77,12.4],[19.7,12.15],[19.7,11.87],[19.72,11.61],[20,11.61],[20.28,11.61],[20.49,11.46],[20.49,11.18],[20.49,10.9],[20.73,10.82],[21.01,10.82],[21.28,10.82],[21.28,11.1],[21.28,11.38],[21.42,11.61],[21.7,11.61],[21.98,11.61],[22.07,11.87],[22.07,12.15]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2, 3], NAMES = { base: "hexagon", 1: "C", 2: "plus", 3: "plus" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.dz = 10 * v; p.pose.rot = -v * 2 * Math.PI; }
  else if (p.k > 1) { p.pose.dz = 16 * v; p.pose.sx = p.pose.sy = 1 + 0.35 * v; }
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
  name: "cplusplus",
  means: "C++'s hexagon pops as the pointer nears; the C lifts out spinning and the two plus signs pop out after it; leave and they drop back.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
