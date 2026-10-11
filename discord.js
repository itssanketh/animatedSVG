/**
 * Discord: the Discord mark, Clyde with his eyes cut through him, as thick plates facing you. In the reference animation
 * Clyde squashes and stretches as he hops; here the pointer makes him jump: he stretches tall and hops up off his feet, his eyes
 * lifting toward you, and lands with a squash when the pointer leaves.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 40, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "hop";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[20.32,4.37],[20.06,4.25],[19.8,4.14],[19.55,4.04],[19.29,3.93],[19.03,3.83],[18.76,3.73],[18.5,3.64],[18.23,3.55],[17.97,3.47],[17.7,3.39],[17.43,3.31],[17.16,3.23],[16.89,3.16],[16.62,3.1],[16.34,3.03],[16.07,2.98],[15.79,2.92],[15.52,2.87],[15.29,3.01],[15.16,3.26],[15.03,3.51],[14.91,3.76],[14.8,4.02],[14.56,4.11],[14.28,4.08],[14,4.04],[13.72,4.02],[13.45,3.99],[13.17,3.97],[12.89,3.96],[12.61,3.94],[12.33,3.94],[12.05,3.93],[11.77,3.94],[11.49,3.94],[11.21,3.95],[10.93,3.97],[10.65,3.98],[10.37,4.01],[10.09,4.03],[9.81,4.07],[9.54,4.1],[9.26,4.14],[9.15,3.88],[9.03,3.63],[8.9,3.38],[8.77,3.13],[8.64,2.89],[8.37,2.89],[8.1,2.94],[7.82,3],[7.55,3.06],[7.28,3.12],[7,3.19],[6.73,3.26],[6.46,3.34],[6.2,3.41],[5.93,3.5],[5.66,3.58],[5.4,3.68],[5.13,3.77],[4.87,3.87],[4.61,3.97],[4.35,4.08],[4.09,4.18],[3.84,4.3],[3.61,4.45],[3.46,4.68],[3.31,4.92],[3.16,5.16],[3.01,5.39],[2.87,5.63],[2.73,5.88],[2.59,6.12],[2.46,6.37],[2.32,6.61],[2.2,6.86],[2.07,7.11],[1.95,7.37],[1.83,7.62],[1.71,7.87],[1.6,8.13],[1.49,8.39],[1.39,8.65],[1.29,8.91],[1.19,9.17],[1.1,9.44],[1.01,9.7],[0.92,9.97],[0.84,10.23],[0.76,10.5],[0.68,10.77],[0.61,11.04],[0.54,11.31],[0.48,11.59],[0.42,11.86],[0.36,12.14],[0.31,12.41],[0.27,12.69],[0.22,12.96],[0.18,13.24],[0.15,13.52],[0.11,13.8],[0.09,14.07],[0.06,14.35],[0.04,14.63],[0.03,14.91],[0.01,15.19],[0.01,15.47],[0,15.75],[0,16.03],[0,16.31],[0.01,16.59],[0.02,16.87],[0.03,17.15],[0.05,17.43],[0.07,17.71],[0.09,17.99],[0.25,18.2],[0.48,18.36],[0.71,18.52],[0.94,18.68],[1.17,18.83],[1.41,18.98],[1.65,19.13],[1.89,19.27],[2.13,19.41],[2.37,19.55],[2.62,19.69],[2.87,19.82],[3.12,19.94],[3.37,20.07],[3.62,20.18],[3.88,20.3],[4.13,20.41],[4.39,20.52],[4.65,20.63],[4.91,20.73],[5.17,20.82],[5.44,20.92],[5.7,21.01],[5.97,21.09],[6.22,21.1],[6.38,20.87],[6.54,20.64],[6.7,20.4],[6.85,20.17],[6.99,19.93],[7.13,19.69],[7.27,19.44],[7.4,19.19],[7.25,18.96],[6.99,18.86],[6.73,18.74],[6.48,18.63],[6.23,18.5],[5.98,18.38],[5.73,18.24],[5.49,18.1],[5.64,17.9],[5.86,17.72],[6.12,17.76],[6.37,17.87],[6.63,17.98],[6.89,18.08],[7.16,18.18],[7.42,18.27],[7.69,18.36],[7.95,18.44],[8.22,18.52],[8.49,18.59],[8.77,18.66],[9.04,18.72],[9.31,18.78],[9.59,18.83],[9.86,18.87],[10.14,18.91],[10.42,18.95],[10.7,18.98],[10.98,19],[11.26,19.02],[11.54,19.03],[11.82,19.04],[12.1,19.04],[12.38,19.03],[12.66,19.02],[12.94,19.01],[13.21,18.99],[13.49,18.96],[13.77,18.93],[14.05,18.89],[14.33,18.84],[14.6,18.8],[14.88,18.74],[15.15,18.68],[15.42,18.62],[15.69,18.54],[15.96,18.47],[16.23,18.39],[16.5,18.3],[16.76,18.21],[17.02,18.11],[17.28,18.01],[17.54,17.91],[17.8,17.79],[18.06,17.69],[18.28,17.85],[18.5,18.03],[18.32,18.21],[18.08,18.34],[17.83,18.47],[17.58,18.6],[17.32,18.71],[17.07,18.83],[16.81,18.93],[16.56,19.05],[16.65,19.3],[16.78,19.55],[16.92,19.79],[17.06,20.03],[17.21,20.27],[17.36,20.5],[17.52,20.74],[17.67,20.97],[17.87,21.14],[18.14,21.06],[18.4,20.97],[18.67,20.88],[18.93,20.78],[19.19,20.68],[19.45,20.58],[19.71,20.48],[19.97,20.37],[20.22,20.25],[20.48,20.14],[20.73,20.01],[20.98,19.89],[21.23,19.76],[21.48,19.63],[21.72,19.5],[21.97,19.36],[22.21,19.22],[22.45,19.07],[22.69,18.92],[22.92,18.77],[23.15,18.61],[23.39,18.46],[23.61,18.3],[23.84,18.13],[23.91,17.88],[23.94,17.6],[23.96,17.32],[23.97,17.04],[23.98,16.76],[23.99,16.48],[24,16.2],[24,15.92],[24,15.64],[23.99,15.36],[23.98,15.08],[23.97,14.8],[23.95,14.52],[23.93,14.24],[23.9,13.96],[23.88,13.68],[23.84,13.4],[23.8,13.13],[23.76,12.85],[23.72,12.57],[23.67,12.3],[23.62,12.02],[23.56,11.75],[23.5,11.48],[23.43,11.2],[23.37,10.93],[23.29,10.66],[23.22,10.39],[23.14,10.12],[23.05,9.86],[22.96,9.59],[22.87,9.33],[22.78,9.06],[22.68,8.8],[22.58,8.54],[22.47,8.28],[22.36,8.02],[22.25,7.77],[22.13,7.51],[22.01,7.26],[21.89,7.01],[21.76,6.76],[21.63,6.51],[21.49,6.27],[21.36,6.02],[21.22,5.78],[21.08,5.54],[20.93,5.3],[20.78,5.06],[20.63,4.82],[20.48,4.59]],[[8.02,15.33],[7.74,15.31],[7.47,15.25],[7.21,15.15],[6.96,15.02],[6.74,14.85],[6.53,14.66],[6.35,14.44],[6.2,14.21],[6.08,13.96],[5.98,13.7],[5.91,13.42],[5.87,13.15],[5.86,12.87],[5.88,12.59],[5.93,12.31],[6.01,12.04],[6.11,11.78],[6.24,11.54],[6.4,11.31],[6.59,11.1],[6.8,10.91],[7.03,10.76],[7.28,10.64],[7.55,10.55],[7.83,10.5],[8.11,10.5],[8.38,10.53],[8.65,10.6],[8.91,10.71],[9.15,10.85],[9.37,11.02],[9.57,11.22],[9.74,11.44],[9.89,11.68],[10,11.93],[10.09,12.2],[10.15,12.47],[10.17,12.75],[10.17,13.03],[10.15,13.31],[10.09,13.59],[10.01,13.85],[9.9,14.11],[9.76,14.35],[9.59,14.58],[9.4,14.78],[9.18,14.96],[8.94,15.1],[8.68,15.22],[8.42,15.29],[8.14,15.33]],[[15.99,15.33],[15.72,15.31],[15.44,15.25],[15.18,15.15],[14.94,15.02],[14.71,14.85],[14.51,14.66],[14.33,14.44],[14.18,14.21],[14.05,13.96],[13.95,13.7],[13.89,13.42],[13.85,13.15],[13.84,12.87],[13.86,12.59],[13.9,12.31],[13.98,12.04],[14.09,11.78],[14.22,11.54],[14.38,11.31],[14.56,11.1],[14.78,10.91],[15.01,10.76],[15.26,10.64],[15.53,10.55],[15.8,10.5],[16.08,10.5],[16.36,10.53],[16.63,10.6],[16.89,10.71],[17.13,10.85],[17.35,11.02],[17.55,11.22],[17.72,11.44],[17.86,11.68],[17.98,11.93],[18.06,12.2],[18.12,12.47],[18.15,12.75],[18.15,13.03],[18.12,13.31],[18.07,13.59],[17.98,13.85],[17.87,14.11],[17.73,14.35],[17.57,14.58],[17.37,14.78],[17.16,14.96],[16.92,15.1],[16.66,15.22],[16.39,15.29],[16.11,15.33]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2], NAMES = { base: "Clyde", 0: "Clyde", 1: "eye", 2: "eye" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.k ? 1 : 0);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  p.pose.pivot = [0, -0.75]; p.pose.dy = 0.14 * v; p.pose.sx = 1 - 0.07 * v; p.pose.sy = 1 + 0.12 * v; p.pose.dz = (p.k ? 10 : 4) * v;
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
  name: "discord",
  means: "Discord's Clyde stretches tall and hops up as the pointer nears, his eyes lifting; leave and he lands back down with a squash.",
  rules: [1, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
