/**
 * Reddit: the Reddit mark, the speech bubble with Snoo cut through it, his eyes and smile cut into his face, as thick plates
 * facing you. In the reference animation Snoo bobs and rocks; here the pointer gets his attention: Snoo pops out of his bubble
 * toward you, tips his head, winks one eye and widens his smile; leave and he straightens, opens his eye and settles back in.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 90, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "wink";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[12,0],[11.72,0],[11.44,0.01],[11.16,0.03],[10.88,0.05],[10.6,0.08],[10.33,0.12],[10.05,0.16],[9.77,0.21],[9.5,0.26],[9.22,0.32],[8.95,0.39],[8.68,0.46],[8.42,0.54],[8.15,0.63],[7.88,0.72],[7.62,0.82],[7.36,0.93],[7.11,1.04],[6.85,1.16],[6.6,1.28],[6.35,1.41],[6.11,1.54],[5.86,1.68],[5.63,1.83],[5.39,1.98],[5.16,2.14],[4.93,2.3],[4.71,2.47],[4.49,2.64],[4.27,2.82],[4.06,3],[3.85,3.19],[3.65,3.38],[3.45,3.58],[3.25,3.78],[3.07,3.99],[2.88,4.2],[2.7,4.41],[2.53,4.63],[2.36,4.86],[2.19,5.08],[2.03,5.31],[1.88,5.55],[1.73,5.79],[1.59,6.03],[1.45,6.27],[1.32,6.52],[1.2,6.77],[1.08,7.02],[0.96,7.28],[0.86,7.54],[0.76,7.8],[0.66,8.06],[0.57,8.33],[0.49,8.59],[0.41,8.86],[0.34,9.14],[0.28,9.41],[0.22,9.68],[0.17,9.96],[0.13,10.23],[0.09,10.51],[0.06,10.79],[0.04,11.07],[0.02,11.35],[0.01,11.63],[0,11.91],[0,12.19],[0.01,12.47],[0.02,12.75],[0.04,13.03],[0.07,13.31],[0.1,13.58],[0.14,13.86],[0.19,14.14],[0.24,14.41],[0.3,14.69],[0.37,14.96],[0.44,15.23],[0.52,15.5],[0.6,15.76],[0.69,16.03],[0.79,16.29],[0.89,16.55],[1,16.81],[1.12,17.06],[1.24,17.32],[1.37,17.57],[1.5,17.81],[1.64,18.06],[1.78,18.3],[1.93,18.53],[2.09,18.77],[2.25,18.99],[2.41,19.22],[2.59,19.44],[2.76,19.66],[2.94,19.87],[3.13,20.08],[3.32,20.29],[3.51,20.49],[3.32,20.68],[3.12,20.88],[2.92,21.08],[2.72,21.28],[2.52,21.48],[2.33,21.67],[2.13,21.87],[1.93,22.07],[1.73,22.27],[1.53,22.47],[1.34,22.66],[1.15,22.87],[1.03,23.12],[1.03,23.4],[1.13,23.66],[1.32,23.87],[1.57,23.98],[1.85,24],[2.13,24],[2.41,24],[2.69,24],[2.97,24],[3.25,24],[3.53,24],[3.81,24],[4.09,24],[4.37,24],[4.65,24],[4.93,24],[5.21,24],[5.49,24],[5.77,24],[6.05,24],[6.33,24],[6.61,24],[6.89,24],[7.17,24],[7.45,24],[7.73,24],[8.01,24],[8.29,24],[8.57,24],[8.85,24],[9.13,24],[9.41,24],[9.69,24],[9.97,24],[10.25,24],[10.53,24],[10.81,24],[11.09,24],[11.37,24],[11.65,24],[11.93,24],[12.21,24],[12.49,23.99],[12.77,23.98],[13.05,23.95],[13.33,23.93],[13.6,23.89],[13.88,23.85],[14.16,23.81],[14.43,23.75],[14.7,23.69],[14.98,23.63],[15.25,23.56],[15.52,23.48],[15.78,23.39],[16.05,23.3],[16.31,23.2],[16.57,23.1],[16.83,22.99],[17.08,22.87],[17.33,22.75],[17.58,22.62],[17.83,22.49],[18.07,22.35],[18.31,22.21],[18.55,22.06],[18.78,21.9],[19.01,21.74],[19.24,21.57],[19.46,21.4],[19.67,21.23],[19.89,21.04],[20.1,20.86],[20.3,20.67],[20.5,20.47],[20.7,20.27],[20.89,20.06],[21.07,19.85],[21.25,19.64],[21.43,19.42],[21.6,19.2],[21.77,18.98],[21.93,18.75],[22.08,18.51],[22.23,18.28],[22.37,18.04],[22.51,17.79],[22.64,17.55],[22.77,17.3],[22.89,17.04],[23.01,16.79],[23.12,16.53],[23.22,16.27],[23.31,16.01],[23.41,15.74],[23.49,15.47],[23.57,15.21],[23.64,14.93],[23.7,14.66],[23.76,14.39],[23.81,14.11],[23.86,13.84],[23.9,13.56],[23.93,13.28],[23.96,13],[23.98,12.72],[23.99,12.44],[24,12.16],[24,11.88],[23.99,11.6],[23.98,11.32],[23.96,11.05],[23.94,10.77],[23.91,10.49],[23.87,10.21],[23.82,9.93],[23.77,9.66],[23.71,9.39],[23.65,9.11],[23.58,8.84],[23.5,8.57],[23.42,8.3],[23.33,8.04],[23.24,7.78],[23.13,7.52],[23.03,7.26],[22.91,7],[22.79,6.75],[22.67,6.5],[22.54,6.25],[22.4,6.01],[22.26,5.77],[22.11,5.53],[21.95,5.29],[21.79,5.06],[21.63,4.84],[21.46,4.62],[21.28,4.4],[21.1,4.18],[20.92,3.97],[20.73,3.77],[20.53,3.56],[20.34,3.37],[20.13,3.18],[19.92,2.99],[19.71,2.81],[19.49,2.63],[19.27,2.46],[19.05,2.29],[18.82,2.13],[18.59,1.97],[18.35,1.82],[18.11,1.67],[17.87,1.53],[17.63,1.4],[17.38,1.27],[17.13,1.15],[16.87,1.03],[16.61,0.92],[16.35,0.81],[16.09,0.72],[15.83,0.62],[15.56,0.54],[15.29,0.46],[15.02,0.38],[14.75,0.32],[14.48,0.26],[14.2,0.2],[13.93,0.15],[13.65,0.11],[13.37,0.08],[13.09,0.05],[12.82,0.03],[12.54,0.01],[12.26,0]],[[16.39,3.2],[16.67,3.22],[16.94,3.28],[17.2,3.37],[17.45,3.5],[17.68,3.67],[17.88,3.86],[18.05,4.09],[18.19,4.33],[18.29,4.59],[18.36,4.86],[18.39,5.14],[18.38,5.42],[18.33,5.69],[18.24,5.96],[18.11,6.21],[17.96,6.44],[17.77,6.65],[17.55,6.82],[17.31,6.97],[17.06,7.08],[16.79,7.16],[16.51,7.19],[16.23,7.19],[15.95,7.15],[15.69,7.07],[15.43,6.95],[15.2,6.8],[14.98,6.62],[14.8,6.41],[14.64,6.18],[14.52,5.93],[14.44,5.66],[14.17,5.72],[13.9,5.8],[13.65,5.92],[13.41,6.07],[13.19,6.25],[13,6.44],[12.82,6.67],[12.68,6.9],[12.56,7.16],[12.48,7.43],[12.43,7.7],[12.41,7.98],[12.66,8.02],[12.94,8.04],[13.22,8.07],[13.5,8.11],[13.77,8.15],[14.05,8.2],[14.32,8.26],[14.59,8.32],[14.86,8.4],[15.13,8.48],[15.4,8.57],[15.66,8.66],[15.92,8.77],[16.18,8.88],[16.43,9],[16.68,9.13],[16.92,9.27],[17.19,9.3],[17.43,9.15],[17.68,9.03],[17.94,8.93],[18.21,8.86],[18.48,8.81],[18.76,8.79],[19.04,8.8],[19.32,8.84],[19.59,8.91],[19.86,9],[20.11,9.12],[20.35,9.26],[20.58,9.43],[20.78,9.61],[20.97,9.82],[21.14,10.05],[21.28,10.29],[21.4,10.54],[21.49,10.8],[21.56,11.08],[21.59,11.35],[21.6,11.63],[21.59,11.91],[21.54,12.19],[21.47,12.46],[21.37,12.72],[21.24,12.97],[21.09,13.21],[20.92,13.43],[20.73,13.63],[20.51,13.81],[20.28,13.97],[20.04,14.11],[19.99,14.37],[19.96,14.64],[19.91,14.92],[19.85,15.19],[19.77,15.46],[19.67,15.72],[19.56,15.98],[19.43,16.23],[19.3,16.47],[19.14,16.71],[18.98,16.94],[18.81,17.16],[18.63,17.37],[18.43,17.57],[18.23,17.77],[18.02,17.95],[17.81,18.13],[17.58,18.3],[17.35,18.46],[17.12,18.61],[16.88,18.76],[16.64,18.89],[16.39,19.02],[16.13,19.14],[15.88,19.25],[15.62,19.36],[15.35,19.45],[15.09,19.54],[14.82,19.62],[14.55,19.69],[14.28,19.76],[14,19.81],[13.73,19.86],[13.45,19.9],[13.17,19.94],[12.89,19.96],[12.61,19.98],[12.33,20],[12.05,20],[11.77,20],[11.49,19.99],[11.21,19.97],[10.93,19.95],[10.66,19.92],[10.38,19.88],[10.1,19.83],[9.83,19.78],[9.56,19.71],[9.28,19.64],[9.02,19.57],[8.75,19.48],[8.48,19.39],[8.22,19.29],[7.97,19.18],[7.71,19.06],[7.46,18.94],[7.21,18.81],[6.97,18.66],[6.74,18.51],[6.5,18.36],[6.28,18.19],[6.06,18.02],[5.85,17.83],[5.65,17.64],[5.45,17.44],[5.26,17.23],[5.09,17.01],[4.92,16.79],[4.77,16.55],[4.62,16.31],[4.49,16.07],[4.38,15.81],[4.28,15.55],[4.19,15.28],[4.12,15.01],[4.07,14.74],[4.03,14.46],[4.01,14.18],[3.8,14.02],[3.57,13.87],[3.35,13.7],[3.15,13.51],[2.97,13.29],[2.81,13.06],[2.67,12.82],[2.56,12.56],[2.48,12.29],[2.43,12.02],[2.4,11.74],[2.4,11.46],[2.42,11.18],[2.48,10.91],[2.56,10.64],[2.67,10.38],[2.8,10.13],[2.96,9.9],[3.14,9.69],[3.34,9.49],[3.56,9.32],[3.8,9.17],[4.04,9.04],[4.3,8.94],[4.57,8.86],[4.85,8.81],[5.13,8.79],[5.41,8.8],[5.69,8.83],[5.96,8.9],[6.22,8.99],[6.48,9.1],[6.72,9.24],[6.95,9.35],[7.19,9.21],[7.44,9.07],[7.69,8.95],[7.94,8.83],[8.2,8.72],[8.46,8.62],[8.73,8.53],[8.99,8.44],[9.26,8.36],[9.53,8.29],[9.81,8.23],[10.08,8.18],[10.36,8.13],[10.63,8.09],[10.91,8.06],[11.19,8.03],[11.47,8.01],[11.56,7.77],[11.59,7.49],[11.64,7.22],[11.72,6.95],[11.83,6.69],[11.95,6.44],[12.1,6.2],[12.27,5.98],[12.45,5.77],[12.65,5.57],[12.87,5.4],[13.1,5.24],[13.35,5.11],[13.61,4.99],[13.87,4.9],[14.14,4.84],[14.42,4.8],[14.5,4.53],[14.61,4.28],[14.76,4.04],[14.94,3.82],[15.14,3.63],[15.37,3.48],[15.62,3.35],[15.89,3.26],[16.16,3.21]],[[8.3,11.57],[8.03,11.61],[7.76,11.7],[7.53,11.85],[7.32,12.04],[7.15,12.26],[7.01,12.5],[6.91,12.76],[6.84,13.03],[6.8,13.31],[6.8,13.59],[6.84,13.87],[6.94,14.13],[7.09,14.36],[7.3,14.55],[7.55,14.68],[7.82,14.76],[8.09,14.8],[8.37,14.8],[8.65,14.76],[8.92,14.67],[9.16,14.53],[9.35,14.33],[9.5,14.09],[9.59,13.83],[9.63,13.55],[9.64,13.27],[9.62,12.99],[9.57,12.72],[9.48,12.46],[9.35,12.21],[9.18,11.98],[8.97,11.8],[8.73,11.66],[8.46,11.59]],[[15.71,11.57],[15.43,11.61],[15.17,11.71],[14.94,11.87],[14.75,12.08],[14.6,12.31],[14.49,12.57],[14.42,12.84],[14.38,13.12],[14.37,13.4],[14.4,13.68],[14.46,13.95],[14.57,14.2],[14.74,14.43],[14.96,14.6],[15.21,14.72],[15.48,14.78],[15.76,14.8],[16.04,14.79],[16.32,14.73],[16.58,14.63],[16.81,14.47],[17,14.26],[17.13,14.02],[17.2,13.75],[17.22,13.47],[17.2,13.19],[17.15,12.91],[17.06,12.65],[16.95,12.39],[16.79,12.16],[16.61,11.95],[16.38,11.78],[16.14,11.65],[15.86,11.59]],[[12.01,15.59],[11.73,15.59],[11.45,15.59],[11.17,15.6],[10.89,15.61],[10.61,15.62],[10.33,15.64],[10.05,15.65],[9.77,15.68],[9.49,15.7],[9.21,15.73],[9.04,15.92],[9.12,16.19],[9.26,16.43],[9.41,16.67],[9.58,16.88],[9.78,17.09],[9.99,17.27],[10.21,17.44],[10.45,17.59],[10.7,17.71],[10.96,17.82],[11.23,17.9],[11.5,17.95],[11.78,17.98],[12.06,17.99],[12.34,17.97],[12.62,17.93],[12.89,17.87],[13.15,17.78],[13.41,17.67],[13.66,17.54],[13.89,17.38],[14.11,17.21],[14.31,17.01],[14.5,16.8],[14.66,16.58],[14.81,16.34],[14.93,16.09],[14.94,15.82],[14.69,15.72],[14.42,15.69],[14.14,15.67],[13.86,15.65],[13.58,15.63],[13.3,15.62],[13.02,15.61],[12.74,15.6],[12.46,15.59],[12.18,15.59]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "bubble", 0: "bubble", 1: "Snoo", 2: "eye", 3: "wink", 4: "smile" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.k ? 1 : 0);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (!p.k) { p.pose.dz = 3 * v; return; }
  // Snoo and his face turn together about one point; the winking eye and the smile also change shape about their own middles
  const P = [0, -0.1], rot = 0.13 * v, c = Math.cos(rot), s = Math.sin(rot), x = p.c[0] - P[0], y = p.c[1] - P[1];
  p.pose.pivot = p.c; p.pose.rot = rot; p.pose.dx = P[0] + x * c - y * s - p.c[0]; p.pose.dy = P[1] + x * s + y * c - p.c[1] + 0.07 * v; p.pose.dz = 12 * v;
  if (p.k === 3) p.pose.sy = Math.max(0.12, 1 - 0.88 * v);
  if (p.k === 4) { p.pose.sx = 1 + 0.18 * v; p.pose.sy = 1 + 0.3 * v; }
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
  name: "reddit",
  means: "Reddit's Snoo pops out of his bubble as the pointer nears, tips his head and winks; leave and he opens his eye and settles back in.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
