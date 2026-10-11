/**
 * X: the X mark, its broad stroke with the narrow one cut through it, as a thick plate facing you. In the reference animation
 * the X turns about inside its badge as it lands; here the pointer spins it: the X lifts toward you and turns a half turn, landing
 * the same way up with a wobble; leave and it turns back down.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "spin";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[18.9,1.15],[19.18,1.15],[19.46,1.15],[19.74,1.15],[20.02,1.15],[20.3,1.15],[20.58,1.15],[20.86,1.15],[21.14,1.15],[21.42,1.15],[21.7,1.15],[21.98,1.15],[22.26,1.15],[22.54,1.15],[22.4,1.36],[22.21,1.57],[22.03,1.79],[21.84,2],[21.66,2.21],[21.47,2.42],[21.29,2.63],[21.11,2.84],[20.92,3.05],[20.74,3.26],[20.55,3.47],[20.37,3.68],[20.18,3.89],[20,4.1],[19.82,4.31],[19.63,4.52],[19.45,4.74],[19.26,4.95],[19.08,5.16],[18.89,5.37],[18.71,5.58],[18.52,5.79],[18.34,6],[18.16,6.21],[17.97,6.42],[17.79,6.63],[17.6,6.84],[17.42,7.05],[17.23,7.26],[17.05,7.48],[16.87,7.69],[16.68,7.9],[16.5,8.11],[16.31,8.32],[16.13,8.53],[15.94,8.74],[15.76,8.95],[15.58,9.16],[15.39,9.37],[15.21,9.58],[15.02,9.79],[14.84,10],[14.65,10.21],[14.66,10.49],[14.82,10.72],[14.99,10.94],[15.16,11.16],[15.33,11.39],[15.5,11.61],[15.67,11.83],[15.84,12.06],[16.01,12.28],[16.18,12.5],[16.34,12.73],[16.51,12.95],[16.68,13.17],[16.85,13.4],[17.02,13.62],[17.19,13.84],[17.36,14.07],[17.53,14.29],[17.7,14.51],[17.87,14.74],[18.03,14.96],[18.2,15.18],[18.37,15.41],[18.54,15.63],[18.71,15.85],[18.88,16.08],[19.05,16.3],[19.22,16.52],[19.39,16.75],[19.55,16.97],[19.72,17.19],[19.89,17.42],[20.06,17.64],[20.23,17.86],[20.4,18.09],[20.57,18.31],[20.74,18.53],[20.91,18.76],[21.07,18.98],[21.24,19.2],[21.41,19.43],[21.58,19.65],[21.75,19.87],[21.92,20.1],[22.09,20.32],[22.26,20.54],[22.43,20.77],[22.6,20.99],[22.76,21.21],[22.93,21.44],[23.1,21.66],[23.27,21.88],[23.44,22.11],[23.61,22.33],[23.78,22.55],[23.95,22.78],[23.69,22.85],[23.41,22.85],[23.13,22.85],[22.85,22.85],[22.57,22.85],[22.29,22.85],[22.01,22.85],[21.73,22.85],[21.45,22.85],[21.17,22.85],[20.89,22.85],[20.61,22.85],[20.33,22.85],[20.05,22.85],[19.77,22.85],[19.49,22.85],[19.21,22.85],[18.93,22.85],[18.65,22.85],[18.37,22.85],[18.09,22.85],[17.81,22.85],[17.53,22.85],[17.25,22.85],[16.97,22.85],[16.69,22.85],[16.48,22.7],[16.31,22.48],[16.14,22.25],[15.97,22.03],[15.8,21.81],[15.63,21.59],[15.46,21.36],[15.29,21.14],[15.12,20.92],[14.95,20.7],[14.78,20.47],[14.61,20.25],[14.44,20.03],[14.27,19.81],[14.1,19.58],[13.93,19.36],[13.76,19.14],[13.59,18.92],[13.42,18.7],[13.25,18.47],[13.08,18.25],[12.91,18.03],[12.74,17.81],[12.57,17.58],[12.4,17.36],[12.23,17.14],[12.06,16.92],[11.89,16.69],[11.72,16.47],[11.55,16.25],[11.38,16.03],[11.21,15.8],[11.04,15.58],[10.87,15.36],[10.61,15.47],[10.43,15.68],[10.24,15.89],[10.06,16.1],[9.87,16.31],[9.69,16.52],[9.5,16.74],[9.32,16.95],[9.14,17.16],[8.95,17.37],[8.77,17.58],[8.58,17.79],[8.4,18],[8.21,18.21],[8.03,18.42],[7.84,18.63],[7.66,18.84],[7.48,19.05],[7.29,19.26],[7.11,19.47],[6.92,19.68],[6.74,19.9],[6.55,20.11],[6.37,20.32],[6.19,20.53],[6,20.74],[5.82,20.95],[5.63,21.16],[5.45,21.37],[5.26,21.58],[5.08,21.79],[4.89,22],[4.71,22.21],[4.53,22.42],[4.34,22.63],[4.16,22.85],[3.88,22.85],[3.6,22.85],[3.32,22.85],[3.04,22.85],[2.76,22.85],[2.48,22.85],[2.2,22.85],[1.92,22.85],[1.64,22.85],[1.36,22.85],[1.08,22.85],[0.8,22.85],[0.52,22.85],[0.66,22.64],[0.84,22.43],[1.03,22.22],[1.21,22.01],[1.39,21.79],[1.58,21.58],[1.76,21.37],[1.95,21.16],[2.13,20.95],[2.32,20.74],[2.5,20.53],[2.68,20.32],[2.87,20.11],[3.05,19.9],[3.24,19.69],[3.42,19.48],[3.61,19.27],[3.79,19.05],[3.98,18.84],[4.16,18.63],[4.34,18.42],[4.53,18.21],[4.71,18],[4.9,17.79],[5.08,17.58],[5.27,17.37],[5.45,17.16],[5.63,16.95],[5.82,16.74],[6,16.53],[6.19,16.32],[6.37,16.1],[6.56,15.89],[6.74,15.68],[6.92,15.47],[7.11,15.26],[7.29,15.05],[7.48,14.84],[7.66,14.63],[7.85,14.42],[8.03,14.21],[8.22,14],[8.4,13.79],[8.58,13.58],[8.77,13.37],[8.95,13.15],[8.97,12.88],[8.8,12.65],[8.63,12.43],[8.46,12.21],[8.29,11.99],[8.12,11.76],[7.95,11.54],[7.78,11.32],[7.61,11.1],[7.44,10.87],[7.27,10.65],[7.1,10.43],[6.93,10.21],[6.76,9.98],[6.59,9.76],[6.42,9.54],[6.24,9.32],[6.07,9.1],[5.9,8.87],[5.73,8.65],[5.56,8.43],[5.39,8.21],[5.22,7.98],[5.05,7.76],[4.88,7.54],[4.71,7.32],[4.54,7.09],[4.37,6.87],[4.2,6.65],[4.03,6.43],[3.86,6.2],[3.69,5.98],[3.52,5.76],[3.35,5.54],[3.18,5.31],[3.01,5.09],[2.84,4.87],[2.67,4.65],[2.5,4.43],[2.33,4.2],[2.16,3.98],[1.99,3.76],[1.82,3.54],[1.65,3.31],[1.48,3.09],[1.31,2.87],[1.14,2.65],[0.97,2.42],[0.8,2.2],[0.63,1.98],[0.46,1.76],[0.29,1.53],[0.12,1.31],[0.32,1.15],[0.6,1.15],[0.88,1.15],[1.16,1.15],[1.44,1.15],[1.72,1.15],[2,1.15],[2.28,1.15],[2.56,1.15],[2.84,1.15],[3.12,1.15],[3.4,1.15],[3.68,1.15],[3.96,1.15],[4.24,1.15],[4.52,1.15],[4.8,1.15],[5.08,1.15],[5.36,1.15],[5.64,1.15],[5.92,1.15],[6.2,1.15],[6.48,1.15],[6.76,1.15],[7.04,1.15],[7.32,1.15],[7.6,1.16],[7.77,1.38],[7.94,1.61],[8.11,1.83],[8.27,2.05],[8.44,2.28],[8.61,2.5],[8.78,2.72],[8.95,2.95],[9.12,3.17],[9.29,3.39],[9.46,3.62],[9.63,3.84],[9.79,4.06],[9.96,4.29],[10.13,4.51],[10.3,4.73],[10.47,4.96],[10.64,5.18],[10.81,5.4],[10.98,5.63],[11.15,5.85],[11.31,6.07],[11.48,6.3],[11.65,6.52],[11.82,6.74],[11.99,6.97],[12.16,7.19],[12.33,7.41],[12.5,7.64],[12.67,7.86],[12.83,8.08],[13.02,7.88],[13.2,7.67],[13.39,7.46],[13.57,7.25],[13.76,7.04],[13.94,6.82],[14.12,6.61],[14.31,6.4],[14.49,6.19],[14.68,5.98],[14.86,5.77],[15.05,5.56],[15.23,5.35],[15.42,5.14],[15.6,4.93],[15.78,4.72],[15.97,4.51],[16.15,4.3],[16.34,4.08],[16.52,3.87],[16.71,3.66],[16.89,3.45],[17.07,3.24],[17.26,3.03],[17.44,2.82],[17.63,2.61],[17.81,2.4],[18,2.19],[18.18,1.98],[18.36,1.77],[18.55,1.56],[18.73,1.34]],[[17.61,20.64],[17.89,20.64],[18.17,20.64],[18.45,20.64],[18.73,20.64],[19.01,20.64],[19.29,20.64],[19.57,20.64],[19.46,20.39],[19.29,20.16],[19.12,19.94],[18.95,19.72],[18.78,19.49],[18.61,19.27],[18.44,19.05],[18.27,18.82],[18.1,18.6],[17.94,18.38],[17.77,18.15],[17.6,17.93],[17.43,17.71],[17.26,17.48],[17.09,17.26],[16.92,17.04],[16.75,16.81],[16.58,16.59],[16.42,16.37],[16.25,16.14],[16.08,15.92],[15.91,15.7],[15.74,15.47],[15.57,15.25],[15.4,15.03],[15.23,14.8],[15.06,14.58],[14.9,14.36],[14.73,14.14],[14.56,13.91],[14.39,13.69],[14.22,13.47],[14.05,13.24],[13.88,13.02],[13.71,12.8],[13.54,12.57],[13.37,12.35],[13.21,12.13],[13.04,11.9],[12.87,11.68],[12.7,11.46],[12.53,11.23],[12.36,11.01],[12.19,10.79],[12.02,10.56],[11.85,10.34],[11.69,10.12],[11.52,9.89],[11.35,9.67],[11.18,9.45],[11.01,9.22],[10.84,9],[10.67,8.78],[10.5,8.55],[10.33,8.33],[10.17,8.11],[10,7.88],[9.83,7.66],[9.66,7.44],[9.49,7.21],[9.32,6.99],[9.15,6.77],[8.98,6.54],[8.81,6.32],[8.65,6.1],[8.48,5.87],[8.31,5.65],[8.14,5.43],[7.97,5.2],[7.8,4.98],[7.63,4.76],[7.46,4.53],[7.29,4.31],[7.13,4.09],[6.96,3.86],[6.79,3.64],[6.62,3.42],[6.43,3.24],[6.15,3.24],[5.87,3.24],[5.59,3.24],[5.31,3.24],[5.03,3.24],[4.75,3.24],[4.47,3.24],[4.51,3.52],[4.68,3.74],[4.85,3.96],[5.02,4.19],[5.19,4.41],[5.36,4.63],[5.53,4.85],[5.7,5.08],[5.87,5.3],[6.04,5.52],[6.21,5.74],[6.38,5.97],[6.55,6.19],[6.72,6.41],[6.89,6.63],[7.06,6.86],[7.23,7.08],[7.4,7.3],[7.57,7.52],[7.74,7.75],[7.91,7.97],[8.08,8.19],[8.25,8.41],[8.42,8.63],[8.59,8.86],[8.76,9.08],[8.93,9.3],[9.1,9.52],[9.27,9.75],[9.44,9.97],[9.62,10.19],[9.79,10.41],[9.96,10.64],[10.13,10.86],[10.3,11.08],[10.47,11.3],[10.64,11.53],[10.81,11.75],[10.98,11.97],[11.15,12.19],[11.32,12.42],[11.49,12.64],[11.66,12.86],[11.83,13.08],[12,13.31],[12.17,13.53],[12.34,13.75],[12.51,13.97],[12.68,14.19],[12.85,14.42],[13.02,14.64],[13.19,14.86],[13.36,15.08],[13.53,15.31],[13.7,15.53],[13.87,15.75],[14.04,15.97],[14.21,16.2],[14.38,16.42],[14.55,16.64],[14.72,16.86],[14.89,17.09],[15.06,17.31],[15.23,17.53],[15.4,17.75],[15.57,17.98],[15.74,18.2],[15.91,18.42],[16.08,18.64],[16.25,18.87],[16.42,19.09],[16.59,19.31],[16.76,19.53],[16.93,19.75],[17.1,19.98],[17.27,20.2],[17.44,20.42]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "X" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  p.pose.dz = 12 * v; p.pose.rot = -v * Math.PI; p.pose.sx = p.pose.sy = 1 + 0.06 * v;
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
  name: "x-logo",
  means: "X's mark lifts toward you and turns a half turn as the pointer nears, landing square with a wobble; leave and it turns back.",
  rules: [1, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
