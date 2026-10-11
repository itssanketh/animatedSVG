/**
 * Go: the Go mark, the leaning G and O with the three speed lines behind them, as thick plates facing you. In the
 * reference animation the letters come in and the speed lines shoot in from the left; here the pointer sets it running: the letters
 * surge forward, the speed lines stretch out behind them one after another, and leaving lets them shrink back.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 150, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 60, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "run";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[1.81,10.23],[1.91,9.99],[2.11,9.8],[2.39,9.8],[2.67,9.8],[2.95,9.8],[3.23,9.8],[3.51,9.8],[3.79,9.8],[4.07,9.8],[4.35,9.8],[4.63,9.8],[4.91,9.8],[5.19,9.8],[5.47,9.8],[5.75,9.8],[6.03,9.8],[6.31,9.8],[6.24,10.04],[6.06,10.24],[5.78,10.24],[5.5,10.24],[5.22,10.24],[4.94,10.24],[4.66,10.24],[4.38,10.24],[4.1,10.24],[3.82,10.24],[3.54,10.24],[3.26,10.23],[2.98,10.23],[2.7,10.23],[2.42,10.23],[2.14,10.23],[1.86,10.23]],[[0.05,11.31],[0.15,11.07],[0.35,10.88],[0.63,10.87],[0.91,10.87],[1.19,10.87],[1.47,10.87],[1.75,10.87],[2.03,10.87],[2.31,10.87],[2.59,10.87],[2.87,10.87],[3.15,10.87],[3.43,10.87],[3.71,10.87],[3.99,10.87],[4.27,10.87],[4.55,10.87],[4.83,10.87],[5.11,10.87],[5.39,10.87],[5.67,10.87],[5.71,11.14],[5.48,11.29],[5.2,11.29],[4.92,11.3],[4.64,11.3],[4.36,11.3],[4.08,11.3],[3.8,11.3],[3.52,11.3],[3.24,11.3],[2.96,11.3],[2.68,11.3],[2.4,11.3],[2.12,11.3],[1.84,11.3],[1.56,11.3],[1.28,11.3],[1,11.3],[0.72,11.3],[0.44,11.31],[0.16,11.31]],[[2.88,12.38],[2.95,12.12],[3.14,11.95],[3.42,11.95],[3.7,11.95],[3.98,11.95],[4.26,11.95],[4.54,11.95],[4.82,11.95],[5.1,11.95],[5.38,11.95],[5.51,12.19],[5.35,12.39],[5.07,12.39],[4.79,12.39],[4.51,12.39],[4.23,12.39],[3.95,12.39],[3.67,12.38],[3.39,12.38],[3.11,12.38]],[[15,10.02],[14.73,10.09],[14.46,10.16],[14.19,10.23],[13.92,10.3],[13.65,10.38],[13.38,10.45],[13.11,10.52],[12.84,10.55],[12.64,10.35],[12.44,10.15],[12.21,10],[11.95,9.89],[11.68,9.8],[11.41,9.76],[11.13,9.76],[10.85,9.8],[10.58,9.88],[10.32,9.99],[10.08,10.12],[9.85,10.28],[9.64,10.46],[9.44,10.66],[9.27,10.88],[9.13,11.12],[9.01,11.38],[8.93,11.65],[8.87,11.92],[8.85,12.2],[8.85,12.48],[8.89,12.76],[8.96,13.03],[9.08,13.28],[9.23,13.51],[9.42,13.72],[9.64,13.9],[9.88,14.04],[10.14,14.14],[10.41,14.2],[10.69,14.22],[10.97,14.21],[11.25,14.17],[11.51,14.08],[11.77,13.96],[12,13.81],[12.22,13.63],[12.41,13.43],[12.58,13.21],[12.42,13],[12.14,13],[11.86,13],[11.58,13],[11.3,13],[11.02,13],[10.74,13],[10.46,13],[10.23,12.88],[10.27,12.61],[10.38,12.35],[10.49,12.1],[10.61,11.84],[10.73,11.59],[10.86,11.34],[11.09,11.19],[11.37,11.19],[11.65,11.19],[11.93,11.19],[12.21,11.19],[12.49,11.19],[12.77,11.19],[13.05,11.19],[13.33,11.19],[13.61,11.19],[13.89,11.19],[14.17,11.19],[14.45,11.19],[14.73,11.19],[15.01,11.19],[15.29,11.19],[15.37,11.45],[15.36,11.73],[15.34,12.01],[15.3,12.28],[15.24,12.56],[15.17,12.83],[15.08,13.09],[14.98,13.35],[14.86,13.61],[14.73,13.86],[14.59,14.1],[14.43,14.33],[14.26,14.55],[14.08,14.77],[13.89,14.97],[13.69,15.17],[13.48,15.35],[13.26,15.52],[13.03,15.68],[12.79,15.83],[12.54,15.96],[12.29,16.08],[12.03,16.18],[11.76,16.26],[11.49,16.33],[11.22,16.38],[10.94,16.42],[10.66,16.45],[10.38,16.46],[10.1,16.45],[9.82,16.42],[9.54,16.38],[9.27,16.32],[9,16.24],[8.74,16.14],[8.49,16.02],[8.24,15.88],[8.01,15.73],[7.79,15.56],[7.57,15.38],[7.37,15.18],[7.19,14.97],[7.02,14.75],[6.87,14.51],[6.74,14.26],[6.63,14],[6.55,13.74],[6.48,13.47],[6.42,13.19],[6.39,12.91],[6.37,12.64],[6.37,12.36],[6.39,12.08],[6.43,11.8],[6.48,11.52],[6.55,11.25],[6.64,10.99],[6.74,10.73],[6.86,10.47],[6.99,10.23],[7.14,9.99],[7.3,9.76],[7.47,9.53],[7.65,9.32],[7.83,9.11],[8.03,8.92],[8.24,8.73],[8.46,8.56],[8.69,8.39],[8.93,8.24],[9.17,8.11],[9.42,7.99],[9.68,7.88],[9.95,7.78],[10.21,7.7],[10.49,7.64],[10.76,7.59],[11.04,7.55],[11.32,7.52],[11.6,7.52],[11.88,7.53],[12.16,7.56],[12.43,7.6],[12.7,7.67],[12.97,7.76],[13.23,7.87],[13.48,8],[13.72,8.14],[13.95,8.3],[14.16,8.48],[14.36,8.67],[14.55,8.88],[14.72,9.1],[14.87,9.34],[15.01,9.58],[15.13,9.83]],[[18.87,16.48],[18.59,16.47],[18.31,16.44],[18.04,16.4],[17.76,16.34],[17.49,16.27],[17.23,16.18],[16.97,16.07],[16.72,15.94],[16.48,15.8],[16.25,15.64],[16.03,15.46],[15.82,15.28],[15.63,15.07],[15.45,14.86],[15.29,14.63],[15.15,14.38],[15.03,14.13],[14.93,13.87],[14.84,13.61],[14.78,13.33],[14.74,13.06],[14.71,12.78],[14.7,12.5],[14.71,12.22],[14.73,11.94],[14.78,11.66],[14.84,11.39],[14.92,11.12],[15.02,10.86],[15.13,10.6],[15.26,10.35],[15.4,10.11],[15.55,9.88],[15.72,9.65],[15.89,9.43],[16.08,9.23],[16.27,9.03],[16.48,8.84],[16.7,8.66],[16.93,8.5],[17.17,8.35],[17.41,8.22],[17.67,8.1],[17.93,8],[18.19,7.91],[18.46,7.83],[18.73,7.77],[19.01,7.71],[19.28,7.67],[19.56,7.64],[19.84,7.63],[20.12,7.63],[20.4,7.64],[20.68,7.68],[20.96,7.73],[21.23,7.8],[21.49,7.89],[21.75,8],[22,8.12],[22.24,8.27],[22.47,8.43],[22.69,8.6],[22.89,8.79],[23.09,8.99],[23.26,9.21],[23.42,9.44],[23.57,9.68],[23.69,9.93],[23.79,10.2],[23.87,10.46],[23.93,10.74],[23.97,11.02],[23.99,11.29],[24,11.57],[23.99,11.85],[23.97,12.13],[23.94,12.41],[23.88,12.68],[23.81,12.95],[23.71,13.22],[23.61,13.48],[23.48,13.73],[23.34,13.97],[23.18,14.2],[23.02,14.43],[22.84,14.64],[22.65,14.85],[22.45,15.04],[22.24,15.23],[22.02,15.4],[21.79,15.56],[21.55,15.71],[21.31,15.85],[21.06,15.97],[20.8,16.08],[20.54,16.18],[20.27,16.26],[20,16.33],[19.72,16.39],[19.45,16.43],[19.17,16.45],[18.89,16.48]],[[21.65,11.76],[21.63,11.48],[21.58,11.21],[21.49,10.94],[21.37,10.69],[21.21,10.46],[21.01,10.26],[20.79,10.09],[20.55,9.95],[20.29,9.85],[20.02,9.79],[19.74,9.77],[19.46,9.78],[19.18,9.83],[18.91,9.91],[18.65,10.01],[18.4,10.14],[18.17,10.29],[17.95,10.47],[17.76,10.67],[17.59,10.9],[17.45,11.14],[17.33,11.39],[17.24,11.66],[17.17,11.93],[17.14,12.2],[17.15,12.48],[17.19,12.76],[17.27,13.03],[17.39,13.28],[17.55,13.51],[17.74,13.72],[17.96,13.89],[18.2,14.03],[18.46,14.14],[18.73,14.21],[19.01,14.25],[19.29,14.25],[19.56,14.21],[19.83,14.14],[20.09,14.03],[20.34,13.9],[20.57,13.75],[20.79,13.57],[20.99,13.38],[21.17,13.16],[21.33,12.93],[21.45,12.68],[21.54,12.41],[21.61,12.14],[21.65,11.86]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "speed line", 3: "G", 4: "O" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.k >= 3 ? 0 : 1 + p.k);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k >= 3) { p.pose.dx = 0.08 * v; p.pose.dz = 6 * v; }
  else { const end = p.loops[0].reduce((m, q) => (q[0] > m[0] ? q : m)); p.pose.pivot = end; p.pose.sx = 1 + (0.4 + 0.15 * p.k) * v; p.pose.dx = 0.08 * v; p.pose.dz = 3 * v; }
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
  name: "golang",
  means: "Go's letters surge forward as the pointer nears and the speed lines stretch out behind them; leave and they shrink back.",
  rules: [1, 2, 8, 10],
  range: [0.5, 0.8, 1.1],
  mount,
});
