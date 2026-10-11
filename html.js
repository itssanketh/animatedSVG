/**
 * HTML: the HTML5 mark, the shield with the 5 cut through it, as thick plates facing you. In the reference animation the
 * shield grows in, overshooting, and the 5 draws in after it; here the pointer pops the shield toward you and the 5 lifts out of its
 * slot after it, swelling a little; leave and the 5 drops back.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 90, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "lift";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[1.5,0],[1.78,0],[2.06,0],[2.34,0],[2.62,0],[2.9,0],[3.18,0],[3.46,0],[3.74,0],[4.02,0],[4.3,0],[4.58,0],[4.86,0],[5.14,0],[5.42,0],[5.7,0],[5.98,0],[6.26,0],[6.54,0],[6.82,0],[7.1,0],[7.38,0],[7.66,0],[7.94,0],[8.22,0],[8.5,0],[8.78,0],[9.06,0],[9.34,0],[9.62,0],[9.9,0],[10.18,0],[10.46,0],[10.74,0],[11.02,0],[11.3,0],[11.58,0],[11.86,0],[12.14,0],[12.42,0],[12.7,0],[12.98,0],[13.26,0],[13.54,0],[13.82,0],[14.1,0],[14.38,0],[14.66,0],[14.94,0],[15.22,0],[15.5,0],[15.78,0],[16.06,0],[16.34,0],[16.62,0],[16.9,0],[17.18,0],[17.46,0],[17.74,0],[18.02,0],[18.3,0],[18.58,0],[18.86,0],[19.14,0],[19.42,0],[19.7,0],[19.98,0],[20.26,0],[20.54,0],[20.82,0],[21.1,0],[21.38,0],[21.66,0],[21.94,0],[22.22,0],[22.5,0],[22.48,0.28],[22.45,0.56],[22.43,0.84],[22.4,1.12],[22.38,1.39],[22.35,1.67],[22.33,1.95],[22.3,2.23],[22.28,2.51],[22.25,2.79],[22.23,3.07],[22.2,3.35],[22.18,3.63],[22.15,3.9],[22.13,4.18],[22.1,4.46],[22.08,4.74],[22.06,5.02],[22.03,5.3],[22.01,5.58],[21.98,5.86],[21.96,6.14],[21.93,6.41],[21.91,6.69],[21.88,6.97],[21.86,7.25],[21.83,7.53],[21.81,7.81],[21.78,8.09],[21.76,8.37],[21.73,8.65],[21.71,8.93],[21.68,9.2],[21.66,9.48],[21.64,9.76],[21.61,10.04],[21.59,10.32],[21.56,10.6],[21.54,10.88],[21.51,11.16],[21.49,11.44],[21.46,11.71],[21.44,11.99],[21.41,12.27],[21.39,12.55],[21.36,12.83],[21.34,13.11],[21.31,13.39],[21.29,13.67],[21.26,13.95],[21.24,14.22],[21.22,14.5],[21.19,14.78],[21.17,15.06],[21.14,15.34],[21.12,15.62],[21.09,15.9],[21.07,16.18],[21.04,16.46],[21.02,16.73],[20.99,17.01],[20.97,17.29],[20.94,17.57],[20.92,17.85],[20.89,18.13],[20.87,18.41],[20.84,18.69],[20.82,18.97],[20.8,19.24],[20.77,19.52],[20.75,19.8],[20.72,20.08],[20.7,20.36],[20.67,20.64],[20.65,20.92],[20.62,21.2],[20.6,21.48],[20.37,21.63],[20.1,21.7],[19.83,21.78],[19.56,21.86],[19.29,21.93],[19.02,22.01],[18.75,22.08],[18.48,22.16],[18.21,22.24],[17.94,22.31],[17.67,22.39],[17.4,22.46],[17.13,22.54],[16.86,22.62],[16.59,22.69],[16.32,22.77],[16.06,22.85],[15.79,22.92],[15.52,23],[15.25,23.07],[14.98,23.15],[14.71,23.23],[14.44,23.3],[14.17,23.38],[13.9,23.46],[13.63,23.53],[13.36,23.61],[13.09,23.68],[12.82,23.76],[12.55,23.84],[12.28,23.91],[12.01,23.99],[11.74,23.93],[11.48,23.86],[11.21,23.78],[10.94,23.7],[10.67,23.63],[10.4,23.55],[10.13,23.47],[9.86,23.4],[9.59,23.32],[9.32,23.24],[9.05,23.17],[8.78,23.09],[8.51,23.01],[8.24,22.94],[7.97,22.86],[7.71,22.78],[7.44,22.71],[7.17,22.63],[6.9,22.55],[6.63,22.48],[6.36,22.4],[6.09,22.32],[5.82,22.25],[5.55,22.17],[5.28,22.09],[5.01,22.02],[4.74,21.94],[4.47,21.86],[4.2,21.79],[3.94,21.71],[3.67,21.63],[3.41,21.54],[3.39,21.27],[3.36,20.99],[3.34,20.71],[3.31,20.43],[3.29,20.15],[3.26,19.87],[3.24,19.59],[3.21,19.31],[3.19,19.03],[3.16,18.76],[3.14,18.48],[3.11,18.2],[3.09,17.92],[3.07,17.64],[3.04,17.36],[3.02,17.08],[2.99,16.8],[2.97,16.52],[2.94,16.25],[2.92,15.97],[2.89,15.69],[2.87,15.41],[2.84,15.13],[2.82,14.85],[2.79,14.57],[2.77,14.29],[2.74,14.01],[2.72,13.74],[2.69,13.46],[2.67,13.18],[2.64,12.9],[2.62,12.62],[2.59,12.34],[2.57,12.06],[2.55,11.78],[2.52,11.5],[2.5,11.23],[2.47,10.95],[2.45,10.67],[2.42,10.39],[2.4,10.11],[2.37,9.83],[2.35,9.55],[2.32,9.27],[2.3,8.99],[2.27,8.72],[2.25,8.44],[2.22,8.16],[2.2,7.88],[2.17,7.6],[2.15,7.32],[2.12,7.04],[2.1,6.76],[2.08,6.48],[2.05,6.21],[2.03,5.93],[2,5.65],[1.98,5.37],[1.95,5.09],[1.93,4.81],[1.9,4.53],[1.88,4.25],[1.85,3.97],[1.83,3.7],[1.8,3.42],[1.78,3.14],[1.75,2.86],[1.73,2.58],[1.7,2.3],[1.68,2.02],[1.65,1.74],[1.63,1.46],[1.61,1.18],[1.58,0.91],[1.56,0.63],[1.53,0.35],[1.51,0.07]],[[8.53,9.75],[8.51,9.47],[8.48,9.19],[8.46,8.91],[8.44,8.63],[8.41,8.36],[8.39,8.08],[8.36,7.8],[8.34,7.52],[8.32,7.24],[8.49,7.03],[8.77,7.03],[9.05,7.03],[9.33,7.03],[9.61,7.03],[9.89,7.03],[10.17,7.03],[10.45,7.03],[10.73,7.03],[11.01,7.03],[11.29,7.03],[11.57,7.03],[11.85,7.03],[12.13,7.03],[12.41,7.03],[12.69,7.03],[12.97,7.03],[13.25,7.03],[13.53,7.03],[13.81,7.03],[14.09,7.03],[14.37,7.03],[14.65,7.03],[14.93,7.03],[15.21,7.03],[15.49,7.03],[15.77,7.03],[16.05,7.03],[16.33,7.03],[16.61,7.03],[16.89,7.03],[17.17,7.03],[17.45,7.03],[17.73,7.03],[18.01,7.03],[18.29,7.03],[18.38,6.78],[18.4,6.5],[18.43,6.22],[18.45,5.95],[18.48,5.67],[18.5,5.39],[18.53,5.11],[18.55,4.83],[18.58,4.55],[18.37,4.41],[18.09,4.41],[17.81,4.41],[17.53,4.41],[17.25,4.41],[16.97,4.41],[16.69,4.41],[16.41,4.41],[16.13,4.41],[15.85,4.41],[15.57,4.41],[15.29,4.41],[15.01,4.41],[14.73,4.41],[14.45,4.41],[14.17,4.41],[13.89,4.41],[13.61,4.41],[13.33,4.41],[13.05,4.41],[12.77,4.41],[12.49,4.41],[12.21,4.41],[11.93,4.41],[11.65,4.41],[11.37,4.41],[11.09,4.41],[10.81,4.41],[10.53,4.41],[10.25,4.41],[9.97,4.41],[9.69,4.41],[9.41,4.41],[9.13,4.41],[8.85,4.41],[8.57,4.41],[8.29,4.41],[8.01,4.41],[7.73,4.41],[7.45,4.41],[7.17,4.41],[6.89,4.41],[6.61,4.41],[6.33,4.41],[6.05,4.41],[5.77,4.41],[5.49,4.41],[5.44,4.69],[5.46,4.97],[5.49,5.25],[5.51,5.53],[5.53,5.81],[5.56,6.09],[5.58,6.37],[5.61,6.65],[5.63,6.93],[5.66,7.2],[5.68,7.48],[5.7,7.76],[5.73,8.04],[5.75,8.32],[5.78,8.6],[5.8,8.88],[5.83,9.16],[5.85,9.44],[5.87,9.71],[5.9,9.99],[5.92,10.27],[5.95,10.55],[5.97,10.83],[6,11.11],[6.02,11.39],[6.04,11.67],[6.07,11.95],[6.09,12.23],[6.27,12.42],[6.55,12.42],[6.83,12.42],[7.11,12.42],[7.39,12.42],[7.67,12.42],[7.95,12.42],[8.23,12.42],[8.51,12.42],[8.79,12.42],[9.07,12.42],[9.35,12.42],[9.63,12.42],[9.91,12.42],[10.19,12.42],[10.47,12.42],[10.75,12.42],[11.03,12.42],[11.31,12.42],[11.59,12.42],[11.87,12.42],[12.15,12.42],[12.43,12.42],[12.71,12.42],[12.99,12.42],[13.27,12.42],[13.55,12.42],[13.83,12.42],[14.11,12.42],[14.39,12.42],[14.67,12.42],[14.95,12.42],[15.23,12.42],[15.21,12.7],[15.18,12.98],[15.16,13.25],[15.13,13.53],[15.1,13.81],[15.08,14.09],[15.05,14.37],[15.02,14.65],[15,14.93],[14.97,15.21],[14.94,15.48],[14.92,15.76],[14.68,15.91],[14.41,15.98],[14.14,16.06],[13.87,16.13],[13.6,16.21],[13.33,16.28],[13.06,16.36],[12.79,16.43],[12.52,16.51],[12.25,16.58],[11.98,16.65],[11.71,16.57],[11.44,16.5],[11.17,16.42],[10.9,16.35],[10.63,16.28],[10.36,16.2],[10.09,16.13],[9.82,16.05],[9.55,15.98],[9.28,15.9],[9.04,15.81],[9.02,15.53],[8.99,15.25],[8.97,14.97],[8.94,14.69],[8.92,14.41],[8.89,14.13],[8.87,13.85],[8.62,13.73],[8.34,13.73],[8.06,13.73],[7.78,13.73],[7.5,13.73],[7.22,13.73],[6.94,13.73],[6.66,13.73],[6.38,13.73],[6.27,13.96],[6.29,14.24],[6.31,14.51],[6.33,14.79],[6.35,15.07],[6.38,15.35],[6.4,15.63],[6.42,15.91],[6.44,16.19],[6.46,16.47],[6.49,16.75],[6.51,17.03],[6.53,17.31],[6.55,17.58],[6.58,17.86],[6.81,17.96],[7.08,18.04],[7.35,18.11],[7.62,18.18],[7.89,18.25],[8.17,18.33],[8.44,18.4],[8.71,18.47],[8.98,18.54],[9.25,18.61],[9.52,18.69],[9.79,18.76],[10.06,18.83],[10.33,18.9],[10.6,18.98],[10.87,19.05],[11.14,19.12],[11.41,19.19],[11.68,19.27],[11.95,19.34],[12.22,19.29],[12.49,19.22],[12.76,19.15],[13.03,19.07],[13.3,19],[13.57,18.93],[13.85,18.86],[14.12,18.78],[14.39,18.71],[14.66,18.64],[14.93,18.57],[15.2,18.49],[15.47,18.42],[15.74,18.35],[16.01,18.28],[16.28,18.2],[16.55,18.13],[16.82,18.06],[17.09,17.99],[17.36,17.91],[17.4,17.65],[17.43,17.37],[17.45,17.09],[17.48,16.81],[17.5,16.53],[17.53,16.25],[17.56,15.97],[17.58,15.7],[17.61,15.42],[17.63,15.14],[17.66,14.86],[17.68,14.58],[17.71,14.3],[17.73,14.02],[17.76,13.74],[17.78,13.47],[17.81,13.19],[17.84,12.91],[17.86,12.63],[17.89,12.35],[17.91,12.07],[17.94,11.79],[17.96,11.51],[17.99,11.23],[18.01,10.96],[18.04,10.68],[18.06,10.4],[18.09,10.12],[18.11,9.84],[17.85,9.75],[17.57,9.75],[17.29,9.75],[17.01,9.75],[16.73,9.75],[16.45,9.75],[16.17,9.75],[15.89,9.75],[15.61,9.75],[15.33,9.75],[15.05,9.75],[14.77,9.75],[14.49,9.75],[14.21,9.75],[13.93,9.75],[13.65,9.75],[13.37,9.75],[13.09,9.75],[12.81,9.75],[12.53,9.75],[12.25,9.75],[11.97,9.75],[11.69,9.75],[11.41,9.75],[11.13,9.75],[10.85,9.75],[10.57,9.75],[10.29,9.75],[10.01,9.75],[9.73,9.75],[9.45,9.75],[9.17,9.75],[8.89,9.75],[8.61,9.75]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "shield", 1: "5" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => p.k;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.dz = 16 * v; p.pose.sx = p.pose.sy = 1 + 0.12 * v; }
  else { p.pose.dz = 3 * v; p.pose.sx = p.pose.sy = 1 + 0.06 * v; }
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
  name: "html",
  means: "HTML5's shield pops as the pointer nears and the 5 lifts out of it after; leave and the 5 drops back into its slot.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
