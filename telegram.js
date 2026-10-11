/**
 * Telegram: the Telegram mark, the round badge with the paper plane cut through it, as thick plates facing you. In the
 * reference animation the plane bobs and then flies; here the pointer sends it: the plane lifts out of its slot and flies up and to
 * the right, nosing up a little; leave and it glides back into its slot.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 90, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "send";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[11.94,0],[11.66,0],[11.38,0.02],[11.1,0.03],[10.83,0.06],[10.55,0.09],[10.27,0.12],[9.99,0.17],[9.72,0.22],[9.44,0.27],[9.17,0.34],[8.9,0.4],[8.63,0.48],[8.36,0.56],[8.1,0.65],[7.83,0.74],[7.57,0.84],[7.31,0.95],[7.06,1.06],[6.8,1.18],[6.55,1.31],[6.3,1.44],[6.06,1.57],[5.82,1.71],[5.58,1.86],[5.34,2.01],[5.11,2.17],[4.89,2.34],[4.66,2.5],[4.44,2.68],[4.23,2.86],[4.02,3.04],[3.81,3.23],[3.61,3.42],[3.41,3.62],[3.22,3.82],[3.03,4.03],[2.84,4.24],[2.67,4.46],[2.49,4.68],[2.32,4.9],[2.16,5.13],[2,5.36],[1.85,5.6],[1.7,5.83],[1.56,6.08],[1.43,6.32],[1.3,6.57],[1.17,6.82],[1.05,7.07],[0.94,7.33],[0.84,7.59],[0.74,7.85],[0.64,8.11],[0.56,8.38],[0.47,8.65],[0.4,8.92],[0.33,9.19],[0.27,9.46],[0.21,9.74],[0.16,10.01],[0.12,10.29],[0.08,10.57],[0.05,10.85],[0.03,11.12],[0.01,11.4],[0,11.68],[0,11.96],[0,12.24],[0.01,12.52],[0.03,12.8],[0.05,13.08],[0.08,13.36],[0.11,13.64],[0.15,13.92],[0.2,14.19],[0.25,14.47],[0.31,14.74],[0.38,15.01],[0.45,15.28],[0.53,15.55],[0.62,15.82],[0.71,16.08],[0.81,16.34],[0.91,16.6],[1.03,16.86],[1.14,17.12],[1.26,17.37],[1.39,17.62],[1.53,17.86],[1.67,18.1],[1.81,18.34],[1.96,18.58],[2.12,18.81],[2.28,19.04],[2.45,19.26],[2.62,19.49],[2.8,19.7],[2.98,19.91],[3.17,20.12],[3.36,20.33],[3.56,20.53],[3.76,20.72],[3.96,20.91],[4.17,21.1],[4.39,21.28],[4.61,21.45],[4.83,21.62],[5.05,21.79],[5.28,21.95],[5.52,22.1],[5.75,22.25],[6,22.39],[6.24,22.53],[6.49,22.66],[6.74,22.79],[6.99,22.91],[7.25,23.02],[7.5,23.13],[7.76,23.23],[8.03,23.33],[8.29,23.42],[8.56,23.5],[8.83,23.58],[9.1,23.65],[9.37,23.71],[9.65,23.77],[9.92,23.82],[10.2,23.87],[10.48,23.9],[10.75,23.94],[11.03,23.96],[11.31,23.98],[11.59,23.99],[11.87,24],[12.15,24],[12.43,23.99],[12.71,23.98],[12.99,23.96],[13.27,23.93],[13.55,23.9],[13.82,23.86],[14.1,23.82],[14.38,23.76],[14.65,23.71],[14.92,23.64],[15.19,23.57],[15.46,23.49],[15.73,23.41],[15.99,23.32],[16.26,23.22],[16.52,23.12],[16.78,23.01],[17.03,22.9],[17.28,22.78],[17.53,22.65],[17.78,22.52],[18.02,22.38],[18.26,22.24],[18.5,22.09],[18.74,21.93],[18.97,21.77],[19.19,21.61],[19.41,21.44],[19.63,21.26],[19.85,21.08],[20.05,20.9],[20.26,20.7],[20.46,20.51],[20.66,20.31],[20.85,20.11],[21.04,19.9],[21.22,19.68],[21.39,19.47],[21.57,19.25],[21.73,19.02],[21.89,18.79],[22.05,18.56],[22.2,18.32],[22.35,18.08],[22.48,17.84],[22.62,17.6],[22.75,17.35],[22.87,17.09],[22.98,16.84],[23.09,16.58],[23.2,16.32],[23.3,16.06],[23.39,15.79],[23.47,15.53],[23.55,15.26],[23.62,14.99],[23.69,14.72],[23.75,14.44],[23.8,14.17],[23.85,13.89],[23.89,13.62],[23.93,13.34],[23.95,13.06],[23.98,12.78],[23.99,12.5],[24,12.22],[24,11.94],[24,11.66],[23.98,11.38],[23.97,11.1],[23.94,10.82],[23.91,10.54],[23.88,10.27],[23.83,9.99],[23.78,9.71],[23.73,9.44],[23.66,9.17],[23.59,8.9],[23.52,8.63],[23.44,8.36],[23.35,8.09],[23.26,7.83],[23.15,7.57],[23.05,7.31],[22.94,7.05],[22.82,6.8],[22.69,6.55],[22.56,6.3],[22.43,6.06],[22.28,5.81],[22.14,5.58],[21.98,5.34],[21.83,5.11],[21.66,4.88],[21.49,4.66],[21.32,4.44],[21.14,4.22],[20.96,4.01],[20.77,3.81],[20.57,3.6],[20.38,3.41],[20.17,3.21],[19.97,3.03],[19.75,2.84],[19.54,2.66],[19.32,2.49],[19.1,2.32],[18.87,2.16],[18.64,2],[18.4,1.85],[18.16,1.7],[17.92,1.56],[17.68,1.42],[17.43,1.3],[17.18,1.17],[16.92,1.05],[16.67,0.94],[16.41,0.84],[16.15,0.74],[15.88,0.64],[15.62,0.55],[15.35,0.47],[15.08,0.4],[14.81,0.33],[14.53,0.27],[14.26,0.21],[13.98,0.16],[13.71,0.12],[13.43,0.08],[13.15,0.05],[12.87,0.03],[12.59,0.01],[12.31,0],[12.03,0]],[[16.91,7.22],[17.18,7.27],[17.42,7.41],[17.54,7.66],[17.57,7.94],[17.56,8.22],[17.53,8.5],[17.49,8.77],[17.46,9.05],[17.42,9.33],[17.39,9.61],[17.35,9.88],[17.31,10.16],[17.27,10.44],[17.23,10.72],[17.18,10.99],[17.14,11.27],[17.1,11.55],[17.05,11.82],[17.01,12.1],[16.97,12.37],[16.92,12.65],[16.88,12.93],[16.83,13.2],[16.78,13.48],[16.74,13.76],[16.69,14.03],[16.64,14.31],[16.6,14.58],[16.55,14.86],[16.5,15.14],[16.45,15.41],[16.4,15.69],[16.35,15.96],[16.3,16.24],[16.25,16.51],[16.2,16.79],[16.14,17.06],[16.06,17.33],[15.94,17.58],[15.78,17.81],[15.55,17.97],[15.28,18.02],[15,18],[14.74,17.91],[14.48,17.79],[14.25,17.65],[14.01,17.49],[13.79,17.32],[13.56,17.17],[13.32,17.01],[13.09,16.86],[12.86,16.7],[12.62,16.54],[12.39,16.39],[12.16,16.23],[11.93,16.07],[11.7,15.91],[11.47,15.76],[11.23,15.6],[11,15.45],[10.77,15.29],[10.54,15.12],[10.34,14.93],[10.21,14.69],[10.21,14.41],[10.33,14.16],[10.51,13.95],[10.71,13.75],[10.91,13.55],[11.11,13.36],[11.32,13.17],[11.52,12.97],[11.73,12.78],[11.93,12.59],[12.14,12.4],[12.34,12.21],[12.54,12.02],[12.75,11.83],[12.95,11.63],[13.15,11.44],[13.36,11.25],[13.56,11.05],[13.76,10.86],[13.95,10.66],[14.15,10.46],[14.33,10.24],[14.33,9.98],[14.07,9.94],[13.83,10.08],[13.59,10.23],[13.36,10.38],[13.12,10.53],[12.89,10.68],[12.65,10.84],[12.42,10.99],[12.19,11.15],[11.95,11.3],[11.72,11.46],[11.49,11.61],[11.26,11.77],[11.02,11.93],[10.79,12.08],[10.56,12.24],[10.33,12.39],[10.09,12.55],[9.86,12.71],[9.63,12.86],[9.4,13.02],[9.16,13.18],[8.93,13.33],[8.69,13.48],[8.44,13.6],[8.18,13.7],[7.9,13.76],[7.63,13.76],[7.35,13.73],[7.07,13.67],[6.8,13.61],[6.53,13.54],[6.26,13.46],[5.99,13.38],[5.73,13.29],[5.46,13.21],[5.19,13.12],[4.93,13.02],[4.69,12.88],[4.54,12.65],[4.6,12.38],[4.81,12.19],[5.05,12.05],[5.3,11.93],[5.56,11.82],[5.81,11.71],[6.07,11.6],[6.33,11.48],[6.58,11.37],[6.84,11.26],[7.1,11.15],[7.35,11.04],[7.61,10.93],[7.87,10.81],[8.13,10.7],[8.38,10.59],[8.64,10.48],[8.9,10.37],[9.15,10.26],[9.41,10.15],[9.67,10.04],[9.92,9.92],[10.18,9.81],[10.44,9.7],[10.7,9.59],[10.95,9.48],[11.21,9.37],[11.47,9.26],[11.73,9.15],[11.98,9.05],[12.24,8.94],[12.5,8.83],[12.76,8.72],[13.02,8.61],[13.28,8.51],[13.54,8.4],[13.8,8.29],[14.05,8.19],[14.31,8.08],[14.57,7.98],[14.83,7.88],[15.09,7.77],[15.36,7.67],[15.62,7.57],[15.88,7.48],[16.15,7.39],[16.41,7.31],[16.69,7.25]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "badge", 0: "badge", 1: "plane" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => p.k;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.dz = 16 * v; p.pose.dx = 0.24 * v; p.pose.dy = 0.18 * v; p.pose.rot = 0.1 * v; }
  else p.pose.dz = 3 * v;
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
  name: "telegram",
  means: "Telegram's paper plane lifts out of its badge and flies up to the right as the pointer nears; leave and it glides back in.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
