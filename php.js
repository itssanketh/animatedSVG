/**
 * PHP: the PHP mark, the oval with "php" cut through it, as thick plates facing you. In the reference animation the oval
 * grows and the letters turn upright as they settle; here the pointer lifts the letters out of the oval, each tipping back a little,
 * one after another from the pointer, and leaving sets them back upright in their slots.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "lift";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[7.01,10.21],[6.73,10.21],[6.45,10.21],[6.17,10.21],[6.02,10.42],[5.97,10.69],[5.92,10.97],[5.86,11.24],[5.81,11.52],[5.76,11.79],[5.7,12.07],[5.65,12.34],[5.6,12.62],[5.71,12.85],[5.99,12.85],[6.27,12.85],[6.55,12.85],[6.83,12.83],[7.1,12.78],[7.37,12.69],[7.61,12.55],[7.81,12.36],[7.97,12.13],[8.08,11.87],[8.16,11.6],[8.21,11.33],[8.23,11.05],[8.2,10.77],[8.08,10.52],[7.86,10.35],[7.59,10.26],[7.32,10.22],[7.04,10.21]],[[12,5.69],[11.72,5.69],[11.44,5.69],[11.16,5.7],[10.88,5.72],[10.6,5.73],[10.32,5.75],[10.04,5.77],[9.76,5.8],[9.49,5.83],[9.21,5.86],[8.93,5.9],[8.65,5.94],[8.38,5.98],[8.1,6.03],[7.82,6.08],[7.55,6.14],[7.28,6.2],[7,6.26],[6.73,6.33],[6.46,6.4],[6.19,6.48],[5.92,6.56],[5.66,6.64],[5.39,6.73],[5.13,6.82],[4.87,6.92],[4.61,7.03],[4.35,7.14],[4.09,7.25],[3.84,7.37],[3.59,7.5],[3.34,7.63],[3.1,7.77],[2.86,7.91],[2.62,8.06],[2.39,8.22],[2.16,8.38],[1.94,8.55],[1.73,8.73],[1.52,8.92],[1.32,9.12],[1.13,9.32],[0.95,9.54],[0.78,9.76],[0.62,9.99],[0.48,10.23],[0.35,10.48],[0.24,10.74],[0.15,11],[0.08,11.27],[0.03,11.55],[0,11.83],[0,12.11],[0.02,12.39],[0.07,12.66],[0.13,12.93],[0.22,13.2],[0.32,13.46],[0.45,13.71],[0.59,13.95],[0.74,14.19],[0.91,14.41],[1.09,14.63],[1.27,14.83],[1.47,15.03],[1.68,15.22],[1.89,15.4],[2.11,15.58],[2.34,15.74],[2.57,15.9],[2.8,16.05],[3.04,16.2],[3.28,16.34],[3.53,16.47],[3.78,16.6],[4.03,16.72],[4.29,16.84],[4.54,16.95],[4.8,17.05],[5.07,17.15],[5.33,17.25],[5.59,17.34],[5.86,17.43],[6.13,17.51],[6.4,17.58],[6.67,17.66],[6.94,17.73],[7.21,17.79],[7.48,17.85],[7.76,17.91],[8.03,17.96],[8.31,18.01],[8.59,18.05],[8.86,18.1],[9.14,18.13],[9.42,18.17],[9.7,18.2],[9.98,18.22],[10.25,18.25],[10.53,18.27],[10.81,18.28],[11.09,18.3],[11.37,18.3],[11.65,18.31],[11.93,18.31],[12.21,18.31],[12.49,18.31],[12.77,18.3],[13.05,18.29],[13.33,18.27],[13.61,18.26],[13.89,18.24],[14.17,18.21],[14.45,18.18],[14.73,18.15],[15,18.11],[15.28,18.07],[15.56,18.03],[15.83,17.98],[16.11,17.93],[16.38,17.88],[16.66,17.82],[16.93,17.76],[17.2,17.69],[17.47,17.62],[17.74,17.54],[18.01,17.46],[18.28,17.38],[18.54,17.29],[18.81,17.2],[19.07,17.1],[19.33,17],[19.59,16.89],[19.85,16.78],[20.1,16.66],[20.35,16.53],[20.6,16.4],[20.84,16.27],[21.08,16.13],[21.32,15.98],[21.55,15.82],[21.78,15.66],[22,15.49],[22.22,15.31],[22.43,15.12],[22.63,14.93],[22.82,14.73],[23.01,14.52],[23.18,14.3],[23.34,14.07],[23.49,13.83],[23.62,13.58],[23.73,13.33],[23.83,13.06],[23.91,12.79],[23.96,12.52],[23.99,12.24],[24,11.96],[23.98,11.68],[23.95,11.4],[23.89,11.13],[23.81,10.86],[23.7,10.6],[23.59,10.35],[23.45,10.1],[23.3,9.87],[23.13,9.64],[22.96,9.42],[22.77,9.21],[22.58,9.01],[22.37,8.82],[22.16,8.64],[21.94,8.46],[21.72,8.3],[21.49,8.14],[21.25,7.98],[21.02,7.83],[20.77,7.69],[20.53,7.56],[20.28,7.43],[20.03,7.31],[19.77,7.19],[19.52,7.08],[19.26,6.97],[19,6.87],[18.73,6.78],[18.47,6.68],[18.2,6.6],[17.94,6.51],[17.67,6.43],[17.4,6.36],[17.13,6.29],[16.85,6.23],[16.58,6.16],[16.31,6.11],[16.03,6.05],[15.76,6],[15.48,5.96],[15.2,5.92],[14.93,5.88],[14.65,5.84],[14.37,5.81],[14.09,5.78],[13.81,5.76],[13.53,5.74],[13.25,5.72],[12.97,5.71],[12.69,5.7],[12.41,5.69],[12.13,5.69]],[[8.74,13.14],[8.53,13.32],[8.29,13.48],[8.05,13.6],[7.78,13.7],[7.51,13.77],[7.24,13.81],[6.96,13.84],[6.68,13.85],[6.4,13.85],[6.12,13.85],[5.84,13.85],[5.56,13.85],[5.33,13.97],[5.28,14.25],[5.23,14.52],[5.17,14.8],[5.12,15.07],[5.07,15.35],[4.9,15.53],[4.62,15.53],[4.34,15.53],[4.06,15.53],[3.78,15.53],[3.7,15.27],[3.76,15],[3.81,14.72],[3.86,14.45],[3.92,14.17],[3.97,13.9],[4.02,13.62],[4.08,13.35],[4.13,13.07],[4.18,12.8],[4.24,12.52],[4.29,12.25],[4.34,11.97],[4.4,11.7],[4.45,11.42],[4.51,11.15],[4.56,10.87],[4.61,10.6],[4.67,10.32],[4.72,10.05],[4.77,9.77],[4.83,9.5],[4.88,9.22],[5.15,9.21],[5.43,9.21],[5.71,9.21],[5.99,9.21],[6.27,9.21],[6.55,9.21],[6.83,9.21],[7.11,9.21],[7.39,9.21],[7.67,9.21],[7.95,9.23],[8.22,9.27],[8.49,9.34],[8.75,9.44],[9,9.59],[9.21,9.77],[9.39,9.98],[9.52,10.23],[9.61,10.49],[9.66,10.77],[9.67,11.05],[9.65,11.33],[9.6,11.6],[9.54,11.87],[9.44,12.14],[9.33,12.39],[9.18,12.63],[9.01,12.85],[8.82,13.06]],[[12.76,13.85],[12.82,13.58],[12.87,13.3],[12.92,13.03],[12.98,12.75],[13.03,12.48],[13.08,12.2],[13.14,11.93],[13.19,11.65],[13.24,11.38],[13.3,11.11],[13.34,10.83],[13.32,10.55],[13.15,10.34],[12.88,10.25],[12.61,10.23],[12.33,10.23],[12.05,10.23],[11.77,10.23],[11.49,10.23],[11.41,10.48],[11.36,10.75],[11.3,11.03],[11.25,11.3],[11.2,11.58],[11.14,11.85],[11.09,12.13],[11.04,12.4],[10.98,12.68],[10.93,12.95],[10.88,13.23],[10.82,13.5],[10.77,13.78],[10.51,13.86],[10.23,13.86],[9.95,13.86],[9.67,13.86],[9.39,13.86],[9.44,13.59],[9.49,13.31],[9.55,13.04],[9.6,12.76],[9.65,12.49],[9.71,12.21],[9.76,11.94],[9.81,11.66],[9.87,11.39],[9.92,11.11],[9.97,10.84],[10.03,10.56],[10.08,10.29],[10.13,10.01],[10.19,9.74],[10.24,9.46],[10.3,9.19],[10.35,8.91],[10.4,8.64],[10.46,8.36],[10.51,8.09],[10.56,7.81],[10.62,7.54],[10.89,7.53],[11.17,7.53],[11.45,7.53],[11.73,7.53],[11.98,7.55],[11.93,7.82],[11.87,8.1],[11.82,8.37],[11.77,8.65],[11.71,8.92],[11.66,9.2],[11.93,9.21],[12.21,9.21],[12.49,9.21],[12.77,9.21],[13.05,9.21],[13.33,9.23],[13.6,9.26],[13.88,9.32],[14.14,9.41],[14.38,9.55],[14.58,9.74],[14.71,9.99],[14.77,10.27],[14.77,10.55],[14.74,10.82],[14.69,11.1],[14.63,11.37],[14.58,11.65],[14.53,11.92],[14.47,12.2],[14.42,12.47],[14.37,12.75],[14.31,13.02],[14.26,13.3],[14.21,13.57],[14.15,13.85],[13.88,13.85],[13.6,13.85],[13.32,13.85],[13.04,13.85]],[[20.36,11.59],[20.3,11.86],[20.2,12.13],[20.09,12.38],[19.94,12.62],[19.78,12.84],[19.59,13.05],[19.38,13.24],[19.16,13.41],[18.92,13.55],[18.66,13.66],[18.39,13.74],[18.12,13.8],[17.84,13.83],[17.56,13.85],[17.28,13.85],[17,13.85],[16.72,13.85],[16.44,13.85],[16.16,13.85],[16.06,14.12],[16.01,14.4],[15.95,14.67],[15.9,14.95],[15.85,15.22],[15.79,15.5],[15.55,15.54],[15.27,15.54],[14.99,15.54],[14.71,15.54],[14.43,15.54],[14.46,15.28],[14.51,15],[14.56,14.73],[14.62,14.46],[14.67,14.18],[14.72,13.91],[14.78,13.63],[14.83,13.36],[14.88,13.08],[14.94,12.81],[14.99,12.53],[15.04,12.26],[15.1,11.98],[15.15,11.71],[15.21,11.43],[15.26,11.16],[15.31,10.88],[15.37,10.61],[15.42,10.33],[15.47,10.06],[15.53,9.78],[15.58,9.51],[15.63,9.23],[15.89,9.21],[16.17,9.21],[16.45,9.21],[16.73,9.21],[17.01,9.21],[17.29,9.21],[17.57,9.21],[17.85,9.21],[18.13,9.21],[18.41,9.21],[18.69,9.23],[18.97,9.27],[19.24,9.34],[19.5,9.44],[19.74,9.58],[19.96,9.76],[20.14,9.98],[20.27,10.22],[20.36,10.48],[20.41,10.76],[20.42,11.04],[20.4,11.32]],[[17.77,10.21],[17.49,10.21],[17.21,10.21],[16.93,10.21],[16.78,10.42],[16.73,10.69],[16.67,10.97],[16.62,11.24],[16.57,11.52],[16.51,11.79],[16.46,12.07],[16.41,12.34],[16.35,12.62],[16.47,12.85],[16.75,12.85],[17.03,12.85],[17.31,12.85],[17.59,12.83],[17.86,12.78],[18.13,12.69],[18.37,12.55],[18.57,12.36],[18.73,12.13],[18.84,11.87],[18.91,11.6],[18.97,11.33],[18.99,11.05],[18.95,10.77],[18.83,10.52],[18.61,10.35],[18.35,10.26],[18.07,10.22],[17.79,10.21]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [2, 3, 4], NAMES = { base: "oval", 0: "p", 5: "p", 2: "p", 3: "h", 4: "p" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (p.d === 1) { p.pose.dz = 14 * v; p.pose.rot = 0.22 * v; p.pose.dy = 0.05 * v; }
  else { p.pose.dz = 3 * v; p.pose.sx = p.pose.sy = 1 + 0.04 * v; }
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
  name: "php",
  means: "PHP's letters lift out of the oval and tip back as the pointer nears, one after another; leave and they settle upright again.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
