/**
 * JavaScript: the JS mark, the square with J and S cut through it, as thick plates facing you. In the reference
 * animation the square wipes in and the letters slide into place from the left; here the pointer draws them back out: the letters
 * lift out of their slots and slide up and to the left, the J first, and leaving slides them home again, overshooting a little as they land.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "slide";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[0,0],[0.28,0],[0.56,0],[0.84,0],[1.12,0],[1.4,0],[1.68,0],[1.96,0],[2.24,0],[2.52,0],[2.8,0],[3.08,0],[3.36,0],[3.64,0],[3.92,0],[4.2,0],[4.48,0],[4.76,0],[5.04,0],[5.32,0],[5.6,0],[5.88,0],[6.16,0],[6.44,0],[6.72,0],[7,0],[7.28,0],[7.56,0],[7.84,0],[8.12,0],[8.4,0],[8.68,0],[8.96,0],[9.24,0],[9.52,0],[9.8,0],[10.08,0],[10.36,0],[10.64,0],[10.92,0],[11.2,0],[11.48,0],[11.76,0],[12.04,0],[12.32,0],[12.6,0],[12.88,0],[13.16,0],[13.44,0],[13.72,0],[14,0],[14.28,0],[14.56,0],[14.84,0],[15.12,0],[15.4,0],[15.68,0],[15.96,0],[16.24,0],[16.52,0],[16.8,0],[17.08,0],[17.36,0],[17.64,0],[17.92,0],[18.2,0],[18.48,0],[18.76,0],[19.04,0],[19.32,0],[19.6,0],[19.88,0],[20.16,0],[20.44,0],[20.72,0],[21,0],[21.28,0],[21.56,0],[21.84,0],[22.12,0],[22.4,0],[22.68,0],[22.96,0],[23.24,0],[23.52,0],[23.8,0],[24,0.16],[24,0.44],[24,0.72],[24,1],[24,1.28],[24,1.56],[24,1.84],[24,2.12],[24,2.4],[24,2.68],[24,2.96],[24,3.24],[24,3.52],[24,3.8],[24,4.08],[24,4.36],[24,4.64],[24,4.92],[24,5.2],[24,5.48],[24,5.76],[24,6.04],[24,6.32],[24,6.6],[24,6.88],[24,7.16],[24,7.44],[24,7.72],[24,8],[24,8.28],[24,8.56],[24,8.84],[24,9.12],[24,9.4],[24,9.68],[24,9.96],[24,10.24],[24,10.52],[24,10.8],[24,11.08],[24,11.36],[24,11.64],[24,11.92],[24,12.2],[24,12.48],[24,12.76],[24,13.04],[24,13.32],[24,13.6],[24,13.88],[24,14.16],[24,14.44],[24,14.72],[24,15],[24,15.28],[24,15.56],[24,15.84],[24,16.12],[24,16.4],[24,16.68],[24,16.96],[24,17.24],[24,17.52],[24,17.8],[24,18.08],[24,18.36],[24,18.64],[24,18.92],[24,19.2],[24,19.48],[24,19.76],[24,20.04],[24,20.32],[24,20.6],[24,20.88],[24,21.16],[24,21.44],[24,21.72],[24,22],[24,22.28],[24,22.56],[24,22.84],[24,23.12],[24,23.4],[24,23.68],[24,23.96],[23.72,24],[23.44,24],[23.16,24],[22.88,24],[22.6,24],[22.32,24],[22.04,24],[21.76,24],[21.48,24],[21.2,24],[20.92,24],[20.64,24],[20.36,24],[20.08,24],[19.8,24],[19.52,24],[19.24,24],[18.96,24],[18.68,24],[18.4,24],[18.12,24],[17.84,24],[17.56,24],[17.28,24],[17,24],[16.72,24],[16.44,24],[16.16,24],[15.88,24],[15.6,24],[15.32,24],[15.04,24],[14.76,24],[14.48,24],[14.2,24],[13.92,24],[13.64,24],[13.36,24],[13.08,24],[12.8,24],[12.52,24],[12.24,24],[11.96,24],[11.68,24],[11.4,24],[11.12,24],[10.84,24],[10.56,24],[10.28,24],[10,24],[9.72,24],[9.44,24],[9.16,24],[8.88,24],[8.6,24],[8.32,24],[8.04,24],[7.76,24],[7.48,24],[7.2,24],[6.92,24],[6.64,24],[6.36,24],[6.08,24],[5.8,24],[5.52,24],[5.24,24],[4.96,24],[4.68,24],[4.4,24],[4.12,24],[3.84,24],[3.56,24],[3.28,24],[3,24],[2.72,24],[2.44,24],[2.16,24],[1.88,24],[1.6,24],[1.32,24],[1.04,24],[0.76,24],[0.48,24],[0.2,24],[0,23.84],[0,23.56],[0,23.28],[0,23],[0,22.72],[0,22.44],[0,22.16],[0,21.88],[0,21.6],[0,21.32],[0,21.04],[0,20.76],[0,20.48],[0,20.2],[0,19.92],[0,19.64],[0,19.36],[0,19.08],[0,18.8],[0,18.52],[0,18.24],[0,17.96],[0,17.68],[0,17.4],[0,17.12],[0,16.84],[0,16.56],[0,16.28],[0,16],[0,15.72],[0,15.44],[0,15.16],[0,14.88],[0,14.6],[0,14.32],[0,14.04],[0,13.76],[0,13.48],[0,13.2],[0,12.92],[0,12.64],[0,12.36],[0,12.08],[0,11.8],[0,11.52],[0,11.24],[0,10.96],[0,10.68],[0,10.4],[0,10.12],[0,9.84],[0,9.56],[0,9.28],[0,9],[0,8.72],[0,8.44],[0,8.16],[0,7.88],[0,7.6],[0,7.32],[0,7.04],[0,6.76],[0,6.48],[0,6.2],[0,5.92],[0,5.64],[0,5.36],[0,5.08],[0,4.8],[0,4.52],[0,4.24],[0,3.96],[0,3.68],[0,3.4],[0,3.12],[0,2.84],[0,2.56],[0,2.28],[0,2],[0,1.72],[0,1.44],[0,1.16],[0,0.88],[0,0.6],[0,0.32],[0,0.04]],[[22.03,18.28],[21.98,18],[21.89,17.73],[21.78,17.48],[21.65,17.23],[21.48,17.01],[21.3,16.79],[21.1,16.6],[20.89,16.42],[20.66,16.25],[20.43,16.1],[20.19,15.95],[19.94,15.82],[19.69,15.69],[19.44,15.58],[19.18,15.46],[18.92,15.35],[18.67,15.24],[18.41,15.13],[18.16,15.01],[17.91,14.89],[17.67,14.74],[17.45,14.57],[17.28,14.35],[17.19,14.08],[17.15,13.81],[17.19,13.53],[17.31,13.28],[17.5,13.07],[17.74,12.93],[18.01,12.86],[18.29,12.83],[18.57,12.86],[18.83,12.95],[19.08,13.08],[19.3,13.25],[19.48,13.46],[19.63,13.7],[19.89,13.66],[20.12,13.51],[20.36,13.35],[20.59,13.2],[20.83,13.05],[21.07,12.9],[21.3,12.75],[21.32,12.5],[21.16,12.27],[20.99,12.05],[20.8,11.84],[20.6,11.65],[20.39,11.47],[20.15,11.31],[19.9,11.18],[19.65,11.08],[19.38,11],[19.1,10.93],[18.83,10.89],[18.55,10.87],[18.27,10.86],[17.99,10.86],[17.71,10.9],[17.43,10.93],[17.16,10.99],[16.89,11.08],[16.64,11.18],[16.39,11.31],[16.15,11.46],[15.93,11.63],[15.72,11.82],[15.54,12.03],[15.37,12.25],[15.23,12.5],[15.12,12.75],[15.03,13.02],[14.96,13.29],[14.92,13.57],[14.91,13.84],[14.92,14.12],[14.95,14.4],[15,14.68],[15.08,14.95],[15.18,15.21],[15.31,15.46],[15.45,15.7],[15.62,15.92],[15.81,16.13],[16.02,16.31],[16.24,16.48],[16.48,16.64],[16.72,16.78],[16.96,16.91],[17.21,17.04],[17.47,17.15],[17.72,17.27],[17.98,17.37],[18.24,17.48],[18.5,17.59],[18.75,17.71],[19,17.84],[19.24,17.98],[19.47,18.15],[19.65,18.36],[19.78,18.61],[19.82,18.88],[19.8,19.16],[19.7,19.42],[19.53,19.65],[19.31,19.82],[19.06,19.94],[18.79,20.01],[18.51,20.05],[18.23,20.07],[17.95,20.05],[17.68,20.01],[17.41,19.92],[17.16,19.8],[16.92,19.66],[16.7,19.48],[16.5,19.28],[16.32,19.07],[16.16,18.84],[15.9,18.8],[15.66,18.94],[15.41,19.08],[15.17,19.22],[14.93,19.36],[14.68,19.49],[14.44,19.63],[14.27,19.83],[14.4,20.07],[14.56,20.3],[14.74,20.52],[14.92,20.73],[15.11,20.93],[15.33,21.11],[15.55,21.28],[15.79,21.43],[16.04,21.55],[16.3,21.67],[16.56,21.76],[16.83,21.85],[17.1,21.91],[17.37,21.97],[17.65,22.01],[17.93,22.03],[18.21,22.05],[18.49,22.04],[18.77,22.03],[19.05,22],[19.32,21.95],[19.6,21.89],[19.86,21.81],[20.13,21.71],[20.38,21.6],[20.63,21.47],[20.86,21.32],[21.08,21.14],[21.29,20.95],[21.47,20.74],[21.63,20.51],[21.76,20.26],[21.87,20],[21.95,19.73],[22.01,19.46],[22.04,19.18],[22.05,18.9],[22.04,18.62],[22.01,18.35]],[[13.05,11.03],[12.77,11.03],[12.49,11.03],[12.21,11.03],[11.93,11.03],[11.65,11.03],[11.37,11.03],[11.09,11.03],[10.81,11.03],[10.8,11.3],[10.8,11.58],[10.8,11.86],[10.8,12.14],[10.8,12.42],[10.8,12.7],[10.8,12.98],[10.8,13.26],[10.8,13.54],[10.8,13.82],[10.8,14.1],[10.8,14.38],[10.8,14.66],[10.8,14.94],[10.8,15.22],[10.8,15.5],[10.79,15.78],[10.79,16.06],[10.79,16.34],[10.79,16.62],[10.79,16.9],[10.8,17.18],[10.8,17.46],[10.8,17.74],[10.8,18.02],[10.8,18.3],[10.8,18.58],[10.79,18.86],[10.76,19.14],[10.71,19.42],[10.59,19.67],[10.4,19.87],[10.16,20.02],[9.89,20.09],[9.61,20.11],[9.33,20.08],[9.06,20.01],[8.83,19.87],[8.62,19.68],[8.44,19.46],[8.29,19.23],[8.15,18.99],[7.91,19.11],[7.67,19.26],[7.43,19.41],[7.19,19.55],[6.96,19.7],[6.72,19.85],[6.48,20],[6.38,20.24],[6.52,20.49],[6.67,20.72],[6.85,20.94],[7.03,21.15],[7.24,21.34],[7.46,21.51],[7.7,21.66],[7.95,21.78],[8.21,21.89],[8.47,21.98],[8.74,22.05],[9.02,22.1],[9.3,22.13],[9.58,22.15],[9.86,22.15],[10.13,22.13],[10.41,22.1],[10.69,22.05],[10.96,21.99],[11.22,21.89],[11.48,21.77],[11.72,21.63],[11.95,21.47],[12.16,21.29],[12.35,21.08],[12.51,20.85],[12.65,20.61],[12.77,20.36],[12.87,20.1],[12.94,19.82],[12.99,19.55],[13.03,19.27],[13.05,18.99],[13.06,18.71],[13.06,18.43],[13.06,18.15],[13.05,17.87],[13.05,17.59],[13.05,17.31],[13.05,17.03],[13.05,16.75],[13.05,16.47],[13.05,16.19],[13.05,15.91],[13.05,15.63],[13.05,15.35],[13.05,15.07],[13.05,14.79],[13.05,14.51],[13.05,14.23],[13.05,13.95],[13.05,13.67],[13.05,13.39],[13.05,13.11],[13.05,12.83],[13.05,12.55],[13.05,12.27],[13.05,11.99],[13.05,11.71],[13.05,11.43],[13.05,11.15]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2], NAMES = { base: "square", 1: "S", 2: "J" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.k === 2 ? 0 : p.k === 1 ? 1 : 0);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k) { p.pose.dz = 14 * v; p.pose.dx = -0.07 * v; p.pose.dy = 0.1 * v; }
  else { p.pose.dz = 3 * v; p.pose.sx = 1 + 0.04 * v; p.pose.sy = 1 + 0.04 * v; p.pose.pivot = [-1, 0]; }
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
  name: "javascript",
  means: "JavaScript's letters lift out of the square and slide up-left as the pointer nears; leave and they slide home into their slots.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
