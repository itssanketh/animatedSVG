/**
 * Twitter: the Twitter bird, as a thick plate facing you. In the reference animation the bird tweets: short chirp lines
 * flash out round it and twinkle; here the pointer sets it singing: the bird hops toward you and tips its beak up, and the chirp
 * lines burst out round it, longer and shorter in turn while the pointer stays; leave and the bird settles and the lines fold away.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = true, VERB = "tweet";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[21.54,7.1],[21.56,7.38],[21.56,7.66],[21.56,7.94],[21.55,8.22],[21.54,8.5],[21.52,8.78],[21.49,9.06],[21.46,9.34],[21.42,9.62],[21.38,9.89],[21.33,10.17],[21.28,10.45],[21.22,10.72],[21.16,10.99],[21.09,11.26],[21.02,11.53],[20.94,11.8],[20.85,12.07],[20.77,12.33],[20.67,12.6],[20.57,12.86],[20.47,13.12],[20.36,13.38],[20.24,13.63],[20.13,13.89],[20,14.14],[19.87,14.39],[19.74,14.63],[19.6,14.88],[19.46,15.12],[19.31,15.36],[19.16,15.59],[19.01,15.83],[18.85,16.05],[18.68,16.28],[18.51,16.5],[18.34,16.72],[18.16,16.94],[17.98,17.15],[17.79,17.36],[17.6,17.57],[17.41,17.77],[17.21,17.96],[17,18.16],[16.8,18.34],[16.59,18.53],[16.37,18.71],[16.15,18.88],[15.93,19.05],[15.71,19.22],[15.48,19.38],[15.24,19.54],[15.01,19.69],[14.77,19.84],[14.53,19.98],[14.28,20.11],[14.04,20.24],[13.78,20.37],[13.53,20.49],[13.28,20.6],[13.02,20.71],[12.76,20.81],[12.5,20.91],[12.23,21.01],[11.97,21.09],[11.7,21.17],[11.43,21.25],[11.16,21.32],[10.88,21.38],[10.61,21.44],[10.34,21.5],[10.06,21.55],[9.78,21.59],[9.51,21.63],[9.23,21.66],[8.95,21.69],[8.67,21.71],[8.39,21.73],[8.11,21.74],[7.83,21.75],[7.55,21.75],[7.27,21.74],[6.99,21.74],[6.72,21.72],[6.44,21.7],[6.16,21.68],[5.88,21.65],[5.6,21.61],[5.32,21.57],[5.05,21.52],[4.77,21.47],[4.5,21.41],[4.23,21.35],[3.96,21.28],[3.69,21.21],[3.42,21.13],[3.15,21.04],[2.89,20.95],[2.62,20.85],[2.36,20.75],[2.1,20.65],[1.85,20.54],[1.59,20.42],[1.34,20.3],[1.09,20.17],[0.84,20.04],[0.6,19.9],[0.36,19.76],[0.12,19.61],[0.38,19.58],[0.66,19.6],[0.94,19.61],[1.22,19.61],[1.5,19.6],[1.78,19.59],[2.06,19.57],[2.34,19.54],[2.61,19.51],[2.89,19.46],[3.16,19.41],[3.44,19.35],[3.71,19.28],[3.98,19.21],[4.25,19.12],[4.51,19.03],[4.77,18.93],[5.03,18.83],[5.29,18.72],[5.54,18.6],[5.79,18.47],[6.04,18.33],[6.28,18.19],[6.52,18.05],[6.75,17.89],[6.98,17.73],[7.2,17.56],[6.95,17.48],[6.67,17.45],[6.4,17.4],[6.13,17.34],[5.86,17.26],[5.59,17.16],[5.34,17.06],[5.08,16.93],[4.84,16.79],[4.6,16.64],[4.38,16.48],[4.16,16.3],[3.95,16.11],[3.76,15.91],[3.57,15.7],[3.4,15.48],[3.24,15.25],[3.1,15.01],[2.97,14.76],[2.85,14.51],[2.75,14.25],[2.98,14.13],[3.26,14.15],[3.54,14.17],[3.82,14.16],[4.1,14.14],[4.38,14.11],[4.65,14.06],[4.9,13.99],[4.62,13.93],[4.36,13.85],[4.09,13.75],[3.83,13.64],[3.58,13.52],[3.34,13.38],[3.1,13.23],[2.88,13.07],[2.66,12.89],[2.45,12.7],[2.26,12.5],[2.08,12.29],[1.9,12.07],[1.75,11.84],[1.6,11.6],[1.47,11.35],[1.35,11.09],[1.25,10.83],[1.16,10.57],[1.09,10.3],[1.03,10.02],[0.99,9.75],[0.97,9.47],[0.96,9.19],[1.21,9.23],[1.46,9.35],[1.72,9.45],[1.99,9.53],[2.26,9.6],[2.54,9.66],[2.81,9.69],[3.09,9.72],[2.92,9.52],[2.7,9.35],[2.5,9.16],[2.3,8.96],[2.12,8.75],[1.95,8.53],[1.79,8.29],[1.64,8.05],[1.51,7.81],[1.4,7.55],[1.29,7.29],[1.21,7.03],[1.14,6.76],[1.08,6.48],[1.04,6.2],[1.01,5.93],[1,5.65],[1.01,5.37],[1.03,5.09],[1.07,4.81],[1.12,4.53],[1.19,4.26],[1.28,4],[1.38,3.74],[1.49,3.48],[1.62,3.23],[1.86,3.38],[2.05,3.59],[2.24,3.8],[2.43,4.01],[2.62,4.21],[2.82,4.4],[3.03,4.59],[3.23,4.78],[3.44,4.97],[3.66,5.14],[3.88,5.32],[4.1,5.49],[4.33,5.66],[4.55,5.82],[4.79,5.98],[5.02,6.13],[5.26,6.28],[5.5,6.42],[5.74,6.56],[5.99,6.69],[6.24,6.82],[6.49,6.94],[6.74,7.06],[7,7.17],[7.26,7.28],[7.52,7.38],[7.78,7.48],[8.04,7.57],[8.31,7.66],[8.58,7.74],[8.85,7.82],[9.12,7.89],[9.39,7.96],[9.66,8.02],[9.94,8.07],[10.21,8.12],[10.49,8.16],[10.77,8.2],[11.05,8.23],[11.33,8.26],[11.6,8.28],[11.77,8.07],[11.73,7.8],[11.7,7.52],[11.69,7.24],[11.7,6.96],[11.72,6.68],[11.76,6.4],[11.81,6.13],[11.88,5.85],[11.96,5.59],[12.06,5.32],[12.17,5.07],[12.3,4.82],[12.44,4.58],[12.59,4.34],[12.76,4.12],[12.94,3.9],[13.13,3.7],[13.34,3.51],[13.55,3.33],[13.77,3.16],[14.01,3],[14.25,2.86],[14.5,2.73],[14.75,2.62],[15.01,2.52],[15.28,2.44],[15.55,2.37],[15.83,2.32],[16.11,2.28],[16.38,2.26],[16.66,2.25],[16.94,2.26],[17.22,2.29],[17.5,2.33],[17.77,2.39],[18.04,2.46],[18.31,2.55],[18.57,2.65],[18.82,2.77],[19.07,2.9],[19.31,3.05],[19.54,3.21],[19.76,3.38],[19.97,3.57],[20.17,3.76],[20.43,3.76],[20.7,3.69],[20.97,3.62],[21.24,3.54],[21.51,3.45],[21.77,3.36],[22.03,3.26],[22.29,3.15],[22.54,3.03],[22.79,2.91],[23.04,2.78],[23.29,2.64],[23.24,2.89],[23.13,3.15],[23.01,3.4],[22.87,3.64],[22.72,3.88],[22.55,4.1],[22.38,4.32],[22.19,4.53],[21.99,4.72],[21.78,4.91],[21.55,5.08],[21.32,5.24],[21.59,5.27],[21.87,5.22],[22.14,5.17],[22.41,5.1],[22.68,5.03],[22.95,4.95],[23.22,4.86],[23.48,4.77],[23.74,4.66],[24,4.56],[23.84,4.79],[23.68,5.01],[23.5,5.23],[23.33,5.45],[23.14,5.66],[22.95,5.87],[22.76,6.07],[22.56,6.26],[22.35,6.45],[22.14,6.64],[21.92,6.81],[21.7,6.99]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "bird" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  p.pose.dz = 12 * v; p.pose.rot = 0.14 * v; p.pose.dy = 0.05 * v; p.pose.sx = p.pose.sy = 1 + 0.06 * v;
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
  // the chirp lines: short strokes round the bird, as long as its spring has carried it, twinkling while the pointer stays
  const rays = mk("path", { class: "nf" }, svg);
  function draw() {
    const r = ps[0].sp.x * amt, rd = r < 0.02 ? "" : Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * Math.PI + 0.13, l = r * (0.1 + 0.08 * (0.5 + 0.5 * Math.sin(now / 160 + i * Math.PI))), r0 = 1.1; return poly([[CX + r0 * K * Math.cos(a), CY - r0 * K * Math.sin(a)], [CX + (r0 + l) * K * Math.cos(a), CY - (r0 + l) * K * Math.sin(a)]]).replace(/Z$/, ""); }).join("");
    if (rays.getAttribute("d") !== rd) rays.setAttribute("d", rd);
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
  name: "twitter",
  means: "The Twitter bird hops and tips its beak up as the pointer nears, chirp lines bursting round it; leave and it settles quiet.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
