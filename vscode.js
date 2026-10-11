/**
 * VS Code: the Visual Studio Code mark, the folded ribbon with the fold cut through it, as thick plates facing you.
 * The editor opens panels at its side; here the pointer opens the ribbon like one: it swings back on its right edge like a panel on
 * its hinge, showing its thickness, and the fold slides out of it toward you like a cursor; leave and it swings shut.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 90, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "open";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[23.15,2.59],[22.9,2.47],[22.65,2.34],[22.39,2.22],[22.14,2.1],[21.89,1.98],[21.64,1.86],[21.38,1.74],[21.13,1.62],[20.88,1.49],[20.63,1.37],[20.37,1.25],[20.12,1.13],[19.87,1.01],[19.62,0.89],[19.37,0.77],[19.11,0.64],[18.86,0.52],[18.61,0.4],[18.36,0.28],[18.1,0.16],[17.83,0.09],[17.55,0.06],[17.28,0.09],[17.01,0.17],[16.76,0.3],[16.54,0.47],[16.33,0.66],[16.13,0.85],[15.92,1.03],[15.71,1.22],[15.51,1.41],[15.3,1.6],[15.09,1.79],[14.88,1.98],[14.68,2.17],[14.47,2.36],[14.26,2.54],[14.06,2.73],[13.85,2.92],[13.64,3.11],[13.44,3.3],[13.23,3.49],[13.02,3.68],[12.82,3.87],[12.61,4.05],[12.4,4.24],[12.2,4.43],[11.99,4.62],[11.78,4.81],[11.57,5],[11.37,5.19],[11.16,5.37],[10.95,5.56],[10.75,5.75],[10.54,5.94],[10.33,6.13],[10.13,6.32],[9.92,6.51],[9.71,6.7],[9.51,6.88],[9.3,7.07],[9.09,7.26],[8.89,7.45],[8.68,7.64],[8.47,7.83],[8.27,8.02],[8.06,8.21],[7.85,8.39],[7.64,8.58],[7.44,8.77],[7.23,8.96],[7.02,9.11],[6.8,8.94],[6.58,8.77],[6.35,8.6],[6.13,8.44],[5.91,8.27],[5.68,8.1],[5.46,7.93],[5.24,7.76],[5.02,7.59],[4.79,7.42],[4.57,7.25],[4.35,7.08],[4.12,6.91],[3.9,6.74],[3.68,6.57],[3.45,6.4],[3.23,6.23],[3.01,6.07],[2.78,5.91],[2.51,5.82],[2.23,5.8],[1.96,5.87],[1.72,6],[1.51,6.19],[1.3,6.37],[1.09,6.56],[0.89,6.75],[0.68,6.94],[0.47,7.13],[0.27,7.32],[0.11,7.55],[0.02,7.81],[0,8.09],[0.07,8.36],[0.2,8.61],[0.4,8.81],[0.61,8.99],[0.81,9.18],[1.02,9.37],[1.23,9.56],[1.43,9.75],[1.64,9.94],[1.85,10.13],[2.05,10.32],[2.26,10.5],[2.47,10.69],[2.67,10.88],[2.88,11.07],[3.09,11.26],[3.29,11.45],[3.5,11.64],[3.71,11.83],[3.88,12.01],[3.68,12.2],[3.47,12.39],[3.26,12.58],[3.06,12.77],[2.85,12.96],[2.64,13.15],[2.44,13.34],[2.23,13.52],[2.02,13.71],[1.81,13.9],[1.61,14.09],[1.4,14.28],[1.19,14.47],[0.99,14.66],[0.78,14.85],[0.57,15.03],[0.37,15.22],[0.18,15.43],[0.05,15.68],[0,15.95],[0.03,16.23],[0.13,16.49],[0.3,16.71],[0.5,16.9],[0.71,17.09],[0.92,17.28],[1.13,17.47],[1.33,17.65],[1.54,17.84],[1.75,18.02],[2,18.15],[2.28,18.2],[2.56,18.17],[2.82,18.07],[3.04,17.91],[3.27,17.74],[3.49,17.57],[3.71,17.4],[3.94,17.23],[4.16,17.06],[4.38,16.89],[4.6,16.72],[4.83,16.55],[5.05,16.38],[5.27,16.21],[5.5,16.05],[5.72,15.88],[5.94,15.71],[6.17,15.54],[6.39,15.37],[6.61,15.2],[6.83,15.03],[7.06,14.88],[7.26,15.07],[7.47,15.26],[7.68,15.44],[7.88,15.63],[8.09,15.82],[8.3,16.01],[8.5,16.2],[8.71,16.39],[8.92,16.58],[9.13,16.77],[9.33,16.95],[9.54,17.14],[9.75,17.33],[9.95,17.52],[10.16,17.71],[10.37,17.9],[10.57,18.09],[10.78,18.28],[10.99,18.46],[11.19,18.65],[11.4,18.84],[11.61,19.03],[11.81,19.22],[12.02,19.41],[12.23,19.6],[12.44,19.79],[12.64,19.97],[12.85,20.16],[13.06,20.35],[13.26,20.54],[13.47,20.73],[13.68,20.92],[13.88,21.11],[14.09,21.29],[14.3,21.48],[14.5,21.67],[14.71,21.86],[14.92,22.05],[15.12,22.24],[15.33,22.43],[15.54,22.62],[15.74,22.8],[15.95,22.99],[16.16,23.18],[16.37,23.37],[16.57,23.56],[16.8,23.73],[17.05,23.85],[17.32,23.92],[17.6,23.94],[17.88,23.9],[18.14,23.82],[18.4,23.7],[18.65,23.58],[18.9,23.46],[19.15,23.34],[19.4,23.21],[19.66,23.09],[19.91,22.97],[20.16,22.85],[20.41,22.73],[20.67,22.61],[20.92,22.49],[21.17,22.36],[21.42,22.24],[21.68,22.12],[21.93,22],[22.18,21.88],[22.43,21.76],[22.69,21.64],[22.94,21.52],[23.19,21.39],[23.42,21.24],[23.63,21.05],[23.79,20.82],[23.91,20.57],[23.98,20.3],[24,20.02],[24,19.74],[24,19.46],[24,19.18],[24,18.9],[24,18.62],[24,18.34],[24,18.06],[24,17.78],[24,17.5],[24,17.22],[24,16.94],[24,16.66],[24,16.38],[24,16.1],[24,15.82],[24,15.54],[24,15.26],[24,14.98],[24,14.7],[24,14.42],[24,14.14],[24,13.86],[24,13.58],[24,13.3],[24,13.02],[24,12.74],[24,12.46],[24,12.18],[24,11.9],[24,11.62],[24,11.34],[24,11.06],[24,10.78],[24,10.5],[24,10.22],[24,9.94],[24,9.66],[24,9.38],[24,9.1],[24,8.82],[24,8.54],[24,8.26],[24,7.98],[24,7.7],[24,7.42],[24,7.14],[24,6.86],[24,6.58],[24,6.3],[24,6.02],[24,5.74],[24,5.46],[24,5.18],[24,4.9],[24,4.62],[24,4.34],[24,4.06],[23.99,3.78],[23.94,3.51],[23.83,3.25],[23.68,3.01],[23.49,2.81],[23.26,2.65]],[[18,17.45],[17.78,17.28],[17.56,17.11],[17.33,16.94],[17.11,16.77],[16.89,16.6],[16.67,16.43],[16.44,16.26],[16.22,16.09],[16,15.92],[15.77,15.76],[15.55,15.59],[15.33,15.42],[15.1,15.25],[14.88,15.08],[14.66,14.91],[14.44,14.74],[14.21,14.57],[13.99,14.4],[13.77,14.23],[13.54,14.06],[13.32,13.89],[13.1,13.72],[12.87,13.55],[12.65,13.39],[12.43,13.22],[12.21,13.05],[11.98,12.88],[11.76,12.71],[11.54,12.54],[11.31,12.37],[11.09,12.2],[10.87,12.03],[11.04,11.84],[11.26,11.67],[11.49,11.5],[11.71,11.33],[11.93,11.16],[12.16,10.99],[12.38,10.82],[12.6,10.65],[12.82,10.48],[13.05,10.31],[13.27,10.14],[13.49,9.98],[13.72,9.81],[13.94,9.64],[14.16,9.47],[14.39,9.3],[14.61,9.13],[14.83,8.96],[15.05,8.79],[15.28,8.62],[15.5,8.45],[15.72,8.28],[15.95,8.11],[16.17,7.94],[16.39,7.77],[16.62,7.61],[16.84,7.44],[17.06,7.27],[17.28,7.1],[17.51,6.93],[17.73,6.76],[17.95,6.59],[18,6.85],[18,7.13],[18,7.41],[18,7.69],[18,7.97],[18,8.25],[18,8.53],[18,8.81],[18,9.09],[18,9.37],[18,9.65],[18,9.93],[18,10.21],[18,10.49],[18,10.77],[18,11.05],[18,11.33],[18,11.61],[18,11.89],[18,12.17],[18,12.45],[18,12.73],[18,13.01],[18,13.29],[18,13.57],[18,13.85],[18,14.13],[18,14.41],[18,14.69],[18,14.97],[18,15.25],[18,15.53],[18,15.81],[18,16.09],[18,16.37],[18,16.65],[18,16.93],[18,17.21]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "ribbon", 0: "ribbon", 1: "fold" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => p.k;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.dz = 14 * v; p.pose.dx = -0.1 * v; }
  else { p.pose.yaw = -0.6 * v; p.pose.ypu = 0.9; p.pose.dz = 3 * v; }
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
  name: "vscode",
  means: "VS Code's ribbon swings back on its edge like a panel as the pointer nears and the fold slides out; leave and it swings shut.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
