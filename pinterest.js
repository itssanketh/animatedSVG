/**
 * Pinterest: the Pinterest mark, the round badge with its P, as a thick plate facing you. A Pinterest pin is pushed into a
 * board, and in the reference animation the badge bounces in like one; here the pointer pins it: the badge lifts toward you and
 * swells, jabs back down into the board with a squash, and wobbles as it settles in, standing a little proud while the pointer
 * stays; leave and it sinks back flat.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "pin";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[12.02,0],[11.74,0],[11.46,0.01],[11.18,0.03],[10.9,0.05],[10.62,0.08],[10.34,0.12],[10.07,0.16],[9.79,0.21],[9.52,0.26],[9.24,0.32],[8.97,0.39],[8.7,0.46],[8.43,0.55],[8.17,0.63],[7.9,0.72],[7.64,0.82],[7.38,0.93],[7.12,1.04],[6.87,1.16],[6.62,1.28],[6.37,1.41],[6.12,1.55],[5.88,1.69],[5.64,1.83],[5.41,1.98],[5.18,2.14],[4.95,2.3],[4.72,2.47],[4.5,2.65],[4.29,2.82],[4.08,3.01],[3.87,3.19],[3.67,3.39],[3.47,3.58],[3.27,3.79],[3.08,3.99],[2.9,4.2],[2.72,4.42],[2.55,4.64],[2.38,4.86],[2.21,5.09],[2.05,5.32],[1.9,5.55],[1.75,5.79],[1.61,6.03],[1.47,6.28],[1.34,6.52],[1.22,6.77],[1.1,7.03],[0.99,7.28],[0.88,7.54],[0.78,7.8],[0.68,8.07],[0.6,8.33],[0.51,8.6],[0.44,8.87],[0.37,9.14],[0.31,9.41],[0.25,9.69],[0.2,9.96],[0.16,10.24],[0.12,10.52],[0.09,10.8],[0.06,11.08],[0.05,11.35],[0.03,11.63],[0.03,11.91],[0.03,12.19],[0.04,12.47],[0.05,12.75],[0.07,13.03],[0.1,13.31],[0.14,13.59],[0.18,13.87],[0.22,14.14],[0.28,14.42],[0.34,14.69],[0.4,14.96],[0.47,15.23],[0.55,15.5],[0.64,15.77],[0.73,16.03],[0.83,16.3],[0.93,16.56],[1.04,16.81],[1.16,17.07],[1.28,17.32],[1.41,17.57],[1.54,17.82],[1.68,18.06],[1.82,18.3],[1.97,18.53],[2.13,18.77],[2.29,19],[2.46,19.22],[2.63,19.44],[2.81,19.66],[2.99,19.87],[3.18,20.08],[3.37,20.28],[3.56,20.48],[3.76,20.68],[3.97,20.87],[4.18,21.06],[4.39,21.24],[4.61,21.41],[4.83,21.58],[5.06,21.75],[5.29,21.91],[5.52,22.06],[5.76,22.21],[6,22.35],[6.24,22.49],[6.49,22.62],[6.74,22.75],[6.99,22.87],[7.25,22.99],[7.51,23.09],[7.62,22.86],[7.59,22.58],[7.57,22.3],[7.56,22.02],[7.54,21.74],[7.54,21.46],[7.54,21.18],[7.55,20.9],[7.56,20.62],[7.58,20.34],[7.62,20.07],[7.67,19.79],[7.73,19.52],[7.8,19.25],[7.86,18.97],[7.93,18.7],[7.99,18.43],[8.05,18.16],[8.12,17.88],[8.18,17.61],[8.25,17.34],[8.31,17.07],[8.38,16.79],[8.44,16.52],[8.5,16.25],[8.57,15.98],[8.63,15.7],[8.7,15.43],[8.76,15.16],[8.83,14.89],[8.89,14.61],[8.95,14.34],[9.02,14.07],[9.08,13.8],[9,13.54],[8.92,13.27],[8.85,13],[8.8,12.72],[8.76,12.45],[8.74,12.17],[8.74,11.89],[8.75,11.61],[8.79,11.33],[8.84,11.05],[8.91,10.78],[9.01,10.52],[9.13,10.27],[9.27,10.03],[9.44,9.8],[9.63,9.6],[9.84,9.42],[10.08,9.27],[10.34,9.16],[10.61,9.09],[10.89,9.06],[11.17,9.08],[11.44,9.14],[11.69,9.26],[11.92,9.42],[12.1,9.63],[12.24,9.88],[12.34,10.14],[12.4,10.41],[12.42,10.69],[12.41,10.97],[12.38,11.25],[12.33,11.52],[12.27,11.8],[12.2,12.07],[12.13,12.34],[12.05,12.61],[11.97,12.88],[11.89,13.14],[11.8,13.41],[11.72,13.68],[11.64,13.95],[11.57,14.22],[11.49,14.49],[11.42,14.76],[11.38,15.04],[11.38,15.31],[11.42,15.59],[11.51,15.86],[11.64,16.1],[11.82,16.32],[12.02,16.51],[12.25,16.67],[12.51,16.78],[12.78,16.86],[13.05,16.9],[13.33,16.9],[13.61,16.88],[13.89,16.83],[14.16,16.75],[14.42,16.64],[14.67,16.52],[14.9,16.37],[15.13,16.2],[15.34,16.02],[15.53,15.82],[15.72,15.6],[15.88,15.38],[16.04,15.15],[16.18,14.9],[16.31,14.65],[16.42,14.4],[16.52,14.14],[16.61,13.87],[16.69,13.61],[16.76,13.33],[16.82,13.06],[16.87,12.78],[16.91,12.51],[16.94,12.23],[16.96,11.95],[16.97,11.67],[16.97,11.39],[16.96,11.11],[16.94,10.83],[16.91,10.55],[16.86,10.28],[16.79,10.01],[16.71,9.74],[16.61,9.47],[16.5,9.22],[16.37,8.97],[16.23,8.73],[16.08,8.5],[15.91,8.27],[15.72,8.06],[15.52,7.86],[15.31,7.68],[15.09,7.51],[14.86,7.35],[14.62,7.2],[14.37,7.08],[14.12,6.96],[13.86,6.86],[13.59,6.77],[13.32,6.7],[13.05,6.65],[12.77,6.6],[12.49,6.57],[12.21,6.55],[11.93,6.55],[11.65,6.56],[11.37,6.58],[11.09,6.61],[10.82,6.65],[10.54,6.71],[10.27,6.78],[10.01,6.87],[9.74,6.97],[9.49,7.08],[9.24,7.2],[8.99,7.34],[8.76,7.5],[8.53,7.66],[8.32,7.84],[8.11,8.03],[7.92,8.23],[7.73,8.44],[7.56,8.66],[7.4,8.89],[7.26,9.13],[7.12,9.38],[7,9.63],[6.9,9.89],[6.8,10.15],[6.73,10.42],[6.66,10.69],[6.61,10.97],[6.58,11.25],[6.56,11.53],[6.56,11.81],[6.57,12.09],[6.6,12.36],[6.64,12.64],[6.71,12.91],[6.78,13.18],[6.87,13.45],[6.98,13.71],[7.1,13.96],[7.24,14.2],[7.4,14.43],[7.54,14.67],[7.5,14.95],[7.44,15.22],[7.37,15.49],[7.3,15.76],[7.24,16.04],[7.16,16.3],[6.93,16.41],[6.67,16.3],[6.43,16.16],[6.2,15.99],[5.99,15.81],[5.8,15.61],[5.61,15.4],[5.45,15.17],[5.29,14.94],[5.15,14.7],[5.02,14.45],[4.9,14.19],[4.79,13.94],[4.7,13.67],[4.61,13.41],[4.54,13.14],[4.48,12.86],[4.43,12.59],[4.39,12.31],[4.37,12.03],[4.36,11.75],[4.36,11.47],[4.38,11.19],[4.4,10.91],[4.44,10.63],[4.48,10.36],[4.54,10.08],[4.6,9.81],[4.68,9.54],[4.77,9.28],[4.86,9.01],[4.97,8.75],[5.09,8.5],[5.21,8.25],[5.35,8.01],[5.5,7.77],[5.66,7.54],[5.82,7.31],[6,7.09],[6.18,6.88],[6.38,6.68],[6.58,6.49],[6.79,6.3],[7,6.12],[7.23,5.95],[7.46,5.79],[7.69,5.64],[7.94,5.5],[8.18,5.37],[8.43,5.25],[8.69,5.14],[8.95,5.03],[9.21,4.94],[9.48,4.85],[9.75,4.78],[10.02,4.71],[10.3,4.65],[10.57,4.6],[10.85,4.56],[11.13,4.53],[11.41,4.5],[11.68,4.48],[11.96,4.47],[12.24,4.47],[12.52,4.47],[12.8,4.48],[13.08,4.5],[13.36,4.53],[13.64,4.57],[13.91,4.62],[14.19,4.68],[14.46,4.75],[14.73,4.83],[14.99,4.92],[15.26,5.02],[15.51,5.12],[15.77,5.24],[16.02,5.37],[16.26,5.5],[16.5,5.65],[16.74,5.8],[16.96,5.97],[17.18,6.14],[17.4,6.32],[17.6,6.51],[17.8,6.71],[17.99,6.91],[18.17,7.12],[18.35,7.34],[18.51,7.57],[18.66,7.81],[18.81,8.05],[18.94,8.29],[19.06,8.55],[19.17,8.8],[19.27,9.06],[19.36,9.33],[19.44,9.6],[19.51,9.87],[19.56,10.14],[19.61,10.42],[19.64,10.7],[19.66,10.98],[19.67,11.26],[19.67,11.54],[19.66,11.82],[19.65,12.1],[19.62,12.38],[19.59,12.65],[19.55,12.93],[19.5,13.21],[19.44,13.48],[19.37,13.75],[19.3,14.02],[19.21,14.29],[19.12,14.55],[19.02,14.81],[18.9,15.07],[18.78,15.32],[18.65,15.57],[18.52,15.81],[18.37,16.05],[18.21,16.28],[18.04,16.51],[17.87,16.73],[17.68,16.94],[17.49,17.14],[17.29,17.33],[17.08,17.52],[16.86,17.69],[16.63,17.86],[16.4,18.01],[16.16,18.15],[15.91,18.28],[15.66,18.4],[15.4,18.5],[15.13,18.59],[14.86,18.67],[14.59,18.73],[14.31,18.78],[14.04,18.82],[13.76,18.84],[13.48,18.85],[13.2,18.84],[12.92,18.81],[12.64,18.76],[12.37,18.69],[12.11,18.6],[11.85,18.49],[11.6,18.36],[11.37,18.21],[11.15,18.03],[10.95,17.84],[10.77,17.62],[10.59,17.81],[10.52,18.08],[10.45,18.35],[10.38,18.62],[10.31,18.89],[10.24,19.16],[10.17,19.43],[10.1,19.7],[10.02,19.97],[9.95,20.24],[9.88,20.51],[9.79,20.78],[9.69,21.04],[9.59,21.3],[9.47,21.56],[9.36,21.81],[9.23,22.06],[9.1,22.31],[8.97,22.56],[8.83,22.8],[8.69,23.04],[8.55,23.28],[8.65,23.53],[8.92,23.6],[9.19,23.67],[9.47,23.73],[9.74,23.79],[10.02,23.84],[10.29,23.88],[10.57,23.92],[10.85,23.95],[11.13,23.97],[11.41,23.99],[11.69,24],[11.97,24],[12.25,24],[12.53,23.99],[12.81,23.97],[13.09,23.95],[13.36,23.92],[13.64,23.89],[13.92,23.84],[14.19,23.8],[14.47,23.74],[14.74,23.68],[15.01,23.61],[15.28,23.54],[15.55,23.46],[15.82,23.37],[16.08,23.28],[16.34,23.18],[16.6,23.08],[16.86,22.96],[17.12,22.85],[17.37,22.72],[17.62,22.6],[17.86,22.46],[18.1,22.32],[18.34,22.17],[18.58,22.02],[18.81,21.87],[19.04,21.7],[19.26,21.54],[19.48,21.36],[19.7,21.18],[19.91,21],[20.12,20.81],[20.32,20.62],[20.52,20.42],[20.71,20.22],[20.9,20.02],[21.09,19.81],[21.27,19.59],[21.44,19.37],[21.61,19.15],[21.78,18.92],[21.94,18.69],[22.09,18.46],[22.24,18.22],[22.38,17.98],[22.52,17.74],[22.65,17.49],[22.77,17.24],[22.89,16.98],[23.01,16.73],[23.11,16.47],[23.21,16.21],[23.31,15.95],[23.4,15.68],[23.48,15.41],[23.56,15.14],[23.63,14.87],[23.69,14.6],[23.75,14.32],[23.8,14.05],[23.84,13.77],[23.88,13.5],[23.91,13.22],[23.93,12.94],[23.95,12.66],[23.96,12.38],[23.97,12.1],[23.97,11.82],[23.96,11.54],[23.95,11.26],[23.93,10.98],[23.9,10.7],[23.87,10.42],[23.83,10.15],[23.78,9.87],[23.73,9.6],[23.67,9.32],[23.6,9.05],[23.53,8.78],[23.45,8.51],[23.36,8.24],[23.27,7.98],[23.18,7.72],[23.07,7.46],[22.96,7.2],[22.85,6.94],[22.73,6.69],[22.6,6.44],[22.46,6.2],[22.33,5.95],[22.18,5.71],[22.03,5.48],[21.88,5.24],[21.71,5.02],[21.55,4.79],[21.38,4.57],[21.2,4.35],[21.02,4.14],[20.83,3.93],[20.64,3.73],[20.44,3.53],[20.24,3.33],[20.04,3.14],[19.83,2.95],[19.62,2.77],[19.4,2.6],[19.18,2.43],[18.95,2.26],[18.72,2.1],[18.49,1.94],[18.25,1.8],[18.01,1.65],[17.77,1.51],[17.52,1.38],[17.27,1.25],[17.02,1.13],[16.76,1.02],[16.5,0.91],[16.24,0.81],[15.98,0.71],[15.72,0.62],[15.45,0.54],[15.18,0.46],[14.91,0.39],[14.64,0.32],[14.36,0.26],[14.09,0.21],[13.81,0.16],[13.54,0.13],[13.26,0.09],[12.98,0.07],[12.7,0.05],[12.42,0.03],[12.14,0.03]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "pin" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  const e = since < 0 ? 9 : since, up = Math.min(1, e / 0.22), jab = Math.min(1, Math.max(0, (e - 0.22) / 0.1)), w = Math.max(0, e - 0.32);
  const lift = since < 0 ? 0 : Math.sin((Math.PI / 2) * up) * (1 - jab), squash = jab * Math.exp(-w * 9);
  p.pose.dz = 16 * lift * v + 3 * v; p.pose.sx = 1 + 0.08 * lift * v + 0.07 * squash * v; p.pose.sy = 1 + 0.08 * lift * v - 0.1 * squash * v;
  p.pose.rot = since < 0 ? 0 : 0.12 * v * Math.exp(-w * 4) * Math.sin(w * 22) * jab;
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
  name: "pinterest",
  means: "Pinterest's badge lifts, then jabs down into the board with a squash and wobbles as the pointer nears, like a pin pushed in.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
