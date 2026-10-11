/**
 * Snapchat: the Snapchat ghost, as a thick plate facing you. Snapchat's snaps vanish once seen, and in the reference animation
 * the ghost wobbles as it floats; here the pointer makes it vanish: the ghost rises a little and turns side on to you, until only its
 * edge is left, a thin sliver in the air; leave and it turns back to face you and settles.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "vanish";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[12.21,0.79],[12.49,0.8],[12.77,0.82],[13.04,0.85],[13.32,0.89],[13.6,0.94],[13.87,1],[14.14,1.08],[14.41,1.16],[14.67,1.26],[14.93,1.36],[15.18,1.48],[15.43,1.61],[15.67,1.75],[15.91,1.9],[16.14,2.06],[16.36,2.24],[16.57,2.42],[16.77,2.61],[16.97,2.81],[17.15,3.02],[17.33,3.24],[17.49,3.47],[17.65,3.7],[17.79,3.94],[17.93,4.19],[18.05,4.44],[18.17,4.69],[18.26,4.95],[18.34,5.22],[18.4,5.5],[18.44,5.77],[18.47,6.05],[18.5,6.33],[18.51,6.61],[18.52,6.89],[18.53,7.17],[18.53,7.45],[18.52,7.73],[18.51,8.01],[18.5,8.29],[18.49,8.57],[18.47,8.85],[18.46,9.13],[18.44,9.41],[18.42,9.69],[18.41,9.97],[18.64,10.11],[18.92,10.11],[19.2,10.06],[19.47,9.98],[19.73,9.87],[19.98,9.76],[20.26,9.72],[20.54,9.73],[20.81,9.81],[21.06,9.92],[21.29,10.09],[21.46,10.31],[21.54,10.57],[21.52,10.85],[21.4,11.1],[21.21,11.31],[20.99,11.48],[20.75,11.62],[20.5,11.74],[20.24,11.84],[19.97,11.94],[19.7,12.02],[19.44,12.12],[19.19,12.24],[18.95,12.39],[18.75,12.58],[18.63,12.83],[18.61,13.11],[18.67,13.38],[18.79,13.63],[18.91,13.88],[19.04,14.13],[19.18,14.37],[19.33,14.61],[19.49,14.84],[19.65,15.07],[19.82,15.29],[20,15.5],[20.19,15.71],[20.38,15.92],[20.58,16.11],[20.79,16.3],[21.01,16.48],[21.23,16.64],[21.46,16.8],[21.7,16.95],[21.94,17.09],[22.2,17.21],[22.45,17.32],[22.71,17.42],[22.98,17.5],[23.25,17.57],[23.53,17.63],[23.79,17.72],[23.96,17.94],[24,18.21],[23.9,18.47],[23.72,18.69],[23.5,18.86],[23.26,19],[23,19.11],[22.74,19.21],[22.47,19.29],[22.2,19.37],[21.93,19.43],[21.66,19.49],[21.38,19.55],[21.11,19.6],[20.83,19.64],[20.72,19.89],[20.66,20.16],[20.6,20.43],[20.53,20.7],[20.42,20.96],[20.2,21.13],[19.93,21.17],[19.65,21.14],[19.37,21.09],[19.1,21.04],[18.82,21],[18.54,20.98],[18.26,20.96],[17.98,20.96],[17.7,20.97],[17.42,21],[17.15,21.05],[16.88,21.12],[16.62,21.22],[16.37,21.34],[16.12,21.49],[15.89,21.64],[15.66,21.79],[15.43,21.95],[15.2,22.11],[14.97,22.27],[14.73,22.42],[14.49,22.57],[14.24,22.7],[13.99,22.82],[13.73,22.93],[13.47,23.02],[13.2,23.09],[12.92,23.15],[12.65,23.18],[12.37,23.2],[12.09,23.2],[11.81,23.19],[11.53,23.18],[11.25,23.15],[10.97,23.11],[10.7,23.04],[10.43,22.96],[10.17,22.86],[9.92,22.75],[9.67,22.62],[9.42,22.48],[9.19,22.33],[8.96,22.17],[8.73,22.01],[8.5,21.85],[8.27,21.69],[8.04,21.53],[7.8,21.39],[7.55,21.25],[7.3,21.14],[7.03,21.06],[6.75,21.01],[6.48,20.97],[6.2,20.95],[5.92,20.95],[5.64,20.96],[5.36,20.98],[5.08,21.02],[4.8,21.07],[4.53,21.12],[4.25,21.16],[3.97,21.16],[3.72,21.04],[3.57,20.81],[3.49,20.54],[3.43,20.27],[3.37,19.99],[3.29,19.72],[3.05,19.59],[2.77,19.55],[2.49,19.51],[2.22,19.46],[1.94,19.4],[1.67,19.34],[1.4,19.27],[1.13,19.18],[0.87,19.08],[0.62,18.95],[0.39,18.8],[0.19,18.6],[0.05,18.36],[0,18.09],[0.11,17.84],[0.33,17.68],[0.61,17.62],[0.88,17.56],[1.15,17.48],[1.41,17.39],[1.67,17.28],[1.93,17.17],[2.18,17.04],[2.42,16.89],[2.65,16.74],[2.88,16.58],[3.1,16.4],[3.31,16.22],[3.52,16.03],[3.71,15.83],[3.9,15.63],[4.09,15.41],[4.26,15.19],[4.43,14.97],[4.59,14.74],[4.74,14.51],[4.88,14.27],[5.02,14.02],[5.15,13.77],[5.27,13.52],[5.37,13.26],[5.4,12.98],[5.34,12.71],[5.17,12.49],[4.94,12.32],[4.7,12.19],[4.44,12.08],[4.18,11.98],[3.91,11.9],[3.65,11.8],[3.39,11.69],[3.14,11.56],[2.91,11.4],[2.7,11.22],[2.54,10.99],[2.46,10.72],[2.49,10.45],[2.63,10.2],[2.83,10.01],[3.07,9.87],[3.34,9.78],[3.61,9.74],[3.89,9.77],[4.15,9.87],[4.41,9.97],[4.68,10.05],[4.96,10.11],[5.23,10.11],[5.51,10.05],[5.57,9.78],[5.55,9.51],[5.53,9.23],[5.52,8.95],[5.5,8.67],[5.49,8.39],[5.48,8.11],[5.47,7.83],[5.46,7.55],[5.46,7.27],[5.46,6.99],[5.47,6.71],[5.48,6.43],[5.5,6.15],[5.53,5.87],[5.57,5.59],[5.63,5.32],[5.69,5.05],[5.78,4.78],[5.89,4.52],[6.01,4.27],[6.14,4.02],[6.28,3.78],[6.43,3.54],[6.59,3.31],[6.76,3.09],[6.94,2.88],[7.13,2.67],[7.33,2.48],[7.54,2.29],[7.76,2.11],[7.98,1.95],[8.22,1.8],[8.46,1.65],[8.71,1.52],[8.96,1.4],[9.22,1.29],[9.48,1.19],[9.74,1.11],[10.01,1.03],[10.29,0.97],[10.56,0.91],[10.84,0.87],[11.12,0.84],[11.4,0.82],[11.67,0.81],[11.95,0.8]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "ghost" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  p.pose.yaw = v * Math.PI * 0.48; p.pose.ypu = 0; p.pose.dy = 0.08 * v; p.pose.dz = 6 * v;
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
  name: "snapchat",
  means: "Snapchat's ghost rises and turns side on as the pointer nears, until only its edge is left; leave and it turns back to face you.",
  rules: [1, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
