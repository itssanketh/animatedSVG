/**
 * Facebook: the Facebook mark, the round badge with the f cut into it, its stem running out through the rim, as thick
 * plates facing you. In the reference animation the f stands out in depth and turns about its upright, showing its thickness; here the
 * pointer flips it: the badge pops toward you and the f lifts out of its slot and turns right round about its upright, edge on and
 * back, landing square with a wobble; leave and it turns back down into its slot.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 90, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "flip";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[24.02,12.0],[24.01,12.47],[23.98,12.94],[23.94,13.41],[23.87,13.88],[23.79,14.34],[23.69,14.81],[23.57,15.26],[23.43,15.71],[23.28,16.16],[23.11,16.6],[22.92,17.03],[22.71,17.46],[22.49,17.87],[22.25,18.28],[21.99,18.68],[21.72,19.07],[21.44,19.44],[21.14,19.81],[20.83,20.16],[20.5,20.5],[20.16,20.83],[19.81,21.14],[19.44,21.44],[19.07,21.72],[18.68,21.99],[18.28,22.25],[17.87,22.49],[17.46,22.71],[17.03,22.92],[16.6,23.11],[16.16,23.28],[15.71,23.43],[15.26,23.57],[14.81,23.69],[14.34,23.79],[13.88,23.87],[13.41,23.94],[12.94,23.98],[12.47,24.01],[12.0,24.02],[11.53,24.01],[11.06,23.98],[10.59,23.94],[10.12,23.87],[9.66,23.79],[9.19,23.69],[8.74,23.57],[8.29,23.43],[7.84,23.28],[7.4,23.11],[6.97,22.92],[6.54,22.71],[6.13,22.49],[5.72,22.25],[5.32,21.99],[4.93,21.72],[4.56,21.44],[4.19,21.14],[3.84,20.83],[3.5,20.5],[3.17,20.16],[2.86,19.81],[2.56,19.44],[2.28,19.07],[2.01,18.68],[1.75,18.28],[1.51,17.87],[1.29,17.46],[1.08,17.03],[0.89,16.6],[0.72,16.16],[0.57,15.71],[0.43,15.26],[0.31,14.81],[0.21,14.34],[0.13,13.88],[0.06,13.41],[0.02,12.94],[-0.01,12.47],[-0.02,12.0],[-0.01,11.53],[0.02,11.06],[0.06,10.59],[0.13,10.12],[0.21,9.66],[0.31,9.19],[0.43,8.74],[0.57,8.29],[0.72,7.84],[0.89,7.4],[1.08,6.97],[1.29,6.54],[1.51,6.13],[1.75,5.72],[2.01,5.32],[2.28,4.93],[2.56,4.56],[2.86,4.19],[3.17,3.84],[3.5,3.5],[3.84,3.17],[4.19,2.86],[4.56,2.56],[4.93,2.28],[5.32,2.01],[5.72,1.75],[6.13,1.51],[6.54,1.29],[6.97,1.08],[7.4,0.89],[7.84,0.72],[8.29,0.57],[8.74,0.43],[9.19,0.31],[9.66,0.21],[10.12,0.13],[10.59,0.06],[11.06,0.02],[11.53,-0.01],[12.0,-0.02],[12.47,-0.01],[12.94,0.02],[13.41,0.06],[13.88,0.13],[14.34,0.21],[14.81,0.31],[15.26,0.43],[15.71,0.57],[16.16,0.72],[16.6,0.89],[17.03,1.08],[17.46,1.29],[17.87,1.51],[18.28,1.75],[18.68,2.01],[19.07,2.28],[19.44,2.56],[19.81,2.86],[20.16,3.17],[20.5,3.5],[20.83,3.84],[21.14,4.19],[21.44,4.56],[21.72,4.93],[21.99,5.32],[22.25,5.72],[22.49,6.13],[22.71,6.54],[22.92,6.97],[23.11,7.4],[23.28,7.84],[23.43,8.29],[23.57,8.74],[23.69,9.19],[23.79,9.66],[23.87,10.12],[23.94,10.59],[23.98,11.06],[24.01,11.53]],[[14.77,4.49],[15.05,4.49],[15.33,4.5],[15.61,4.51],[15.89,4.53],[16.17,4.56],[16.44,4.59],[16.72,4.62],[17,4.67],[17.27,4.72],[17.55,4.78],[17.57,5.04],[17.57,5.32],[17.57,5.6],[17.57,5.88],[17.57,6.16],[17.57,6.44],[17.57,6.72],[17.57,7],[17.57,7.28],[17.57,7.56],[17.57,7.84],[17.55,8.11],[17.28,8.09],[17,8.07],[16.72,8.07],[16.44,8.06],[16.16,8.06],[15.88,8.07],[15.6,8.09],[15.32,8.12],[15.04,8.18],[14.78,8.26],[14.52,8.37],[14.28,8.51],[14.07,8.69],[13.89,8.91],[13.74,9.15],[13.64,9.41],[13.56,9.68],[13.51,9.95],[13.47,10.23],[13.46,10.51],[13.45,10.79],[13.45,11.07],[13.45,11.35],[13.45,11.63],[13.45,11.91],[13.68,12.04],[13.96,12.04],[14.24,12.04],[14.52,12.04],[14.8,12.04],[15.08,12.04],[15.36,12.04],[15.64,12.04],[15.92,12.04],[16.2,12.04],[16.48,12.04],[16.76,12.04],[17.04,12.04],[17.32,12.04],[17.33,12.3],[17.27,12.58],[17.22,12.86],[17.17,13.13],[17.12,13.41],[17.07,13.68],[17.02,13.96],[16.97,14.23],[16.92,14.51],[16.87,14.78],[16.82,15.06],[16.77,15.33],[16.72,15.61],[16.48,15.71],[16.2,15.71],[15.92,15.71],[15.64,15.71],[15.36,15.71],[15.08,15.71],[14.8,15.71],[14.52,15.71],[14.24,15.71],[13.96,15.71],[13.68,15.71],[13.45,15.84],[13.45,16.12],[13.45,16.4],[13.45,16.68],[13.45,16.96],[13.45,17.24],[13.45,17.52],[13.45,17.8],[13.45,18.08],[13.45,18.36],[13.45,18.64],[13.45,18.92],[13.45,19.2],[13.45,19.48],[13.45,19.76],[13.45,20.04],[13.45,20.32],[13.45,20.6],[13.45,20.88],[13.45,21.16],[13.45,21.44],[13.45,21.72],[13.45,22],[13.45,22.28],[13.45,22.56],[13.45,22.84],[13.45,23.12],[13.45,23.4],[13.45,23.68],[13.46,23.96],[13.74,23.92],[13.16,23.94],[12.57,23.99],[11.99,24.0],[11.41,23.99],[10.83,23.94],[10.25,23.87],[9.68,23.77],[9.1,23.69],[9.1,23.41],[9.1,23.13],[9.1,22.85],[9.1,22.57],[9.1,22.29],[9.1,22.01],[9.1,21.73],[9.1,21.45],[9.1,21.17],[9.1,20.89],[9.1,20.61],[9.1,20.33],[9.1,20.05],[9.1,19.77],[9.1,19.49],[9.1,19.21],[9.1,18.93],[9.1,18.65],[9.1,18.37],[9.1,18.09],[9.1,17.81],[9.1,17.53],[9.1,17.25],[9.1,16.97],[9.1,16.69],[9.1,16.41],[9.1,16.13],[9.1,15.85],[8.88,15.71],[8.6,15.71],[8.32,15.71],[8.04,15.71],[7.76,15.71],[7.48,15.71],[7.2,15.71],[6.92,15.71],[6.64,15.71],[6.63,15.44],[6.63,15.16],[6.63,14.89],[6.63,14.6],[6.63,14.32],[6.63,14.05],[6.63,13.77],[6.63,13.48],[6.63,13.2],[6.63,12.93],[6.63,12.64],[6.63,12.36],[6.63,12.09],[6.91,12.04],[7.19,12.04],[7.47,12.04],[7.75,12.04],[8.03,12.04],[8.31,12.04],[8.59,12.04],[8.87,12.04],[9.1,11.92],[9.1,11.64],[9.1,11.36],[9.1,11.08],[9.1,10.8],[9.1,10.52],[9.1,10.24],[9.11,9.96],[9.13,9.68],[9.15,9.4],[9.18,9.12],[9.22,8.84],[9.26,8.57],[9.32,8.29],[9.39,8.02],[9.47,7.75],[9.56,7.49],[9.67,7.23],[9.79,6.98],[9.92,6.73],[10.07,6.5],[10.24,6.27],[10.42,6.06],[10.61,5.86],[10.82,5.67],[11.04,5.5],[11.28,5.34],[11.52,5.2],[11.77,5.08],[12.02,4.96],[12.29,4.87],[12.55,4.78],[12.83,4.71],[13.1,4.65],[13.37,4.6],[13.65,4.56],[13.93,4.53],[14.21,4.51],[14.49,4.5]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "badge", 0: "badge", 1: "f" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => p.k;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.k === 1) { p.pose.yaw = -v * 2 * Math.PI; p.pose.ypu = p.c[0]; p.pose.dz = 14 * v; }
  else { p.pose.dz = 2 * v; p.pose.sx = p.pose.sy = 1 + 0.04 * v; }
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
  name: "facebook",
  means: "Facebook's f lifts out of its badge and flips right round as the pointer nears, landing square; leave and it flips back into its slot.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
