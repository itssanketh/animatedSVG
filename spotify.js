/**
 * Spotify: the Spotify mark, the circle with its three sound waves cut through it, as thick plates facing you. Here the
 * pointer starts the music: the waves lift out of their slots, smallest first, and pulse like the bars of an equaliser, each a beat
 * after the one inside it, while the pointer stays; leave and the music stops and they settle back.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 70, POP = { k: 140, c: 13 }, AMBIENT = true, VERB = "play";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[12,0],[11.72,0],[11.44,0.01],[11.16,0.03],[10.88,0.05],[10.6,0.08],[10.33,0.12],[10.05,0.16],[9.77,0.21],[9.5,0.26],[9.23,0.33],[8.95,0.39],[8.68,0.47],[8.42,0.55],[8.15,0.64],[7.89,0.73],[7.62,0.83],[7.37,0.94],[7.11,1.05],[6.85,1.17],[6.6,1.29],[6.36,1.42],[6.11,1.56],[5.87,1.7],[5.63,1.84],[5.39,1.99],[5.16,2.15],[4.94,2.32],[4.71,2.48],[4.49,2.66],[4.28,2.83],[4.06,3.02],[3.86,3.21],[3.65,3.4],[3.45,3.6],[3.26,3.8],[3.07,4],[2.89,4.21],[2.71,4.43],[2.53,4.65],[2.36,4.87],[2.2,5.1],[2.04,5.33],[1.89,5.56],[1.74,5.8],[1.59,6.04],[1.46,6.28],[1.33,6.53],[1.2,6.78],[1.08,7.04],[0.97,7.29],[0.86,7.55],[0.76,7.81],[0.66,8.07],[0.57,8.34],[0.49,8.61],[0.41,8.88],[0.34,9.15],[0.28,9.42],[0.22,9.69],[0.17,9.97],[0.13,10.25],[0.09,10.52],[0.06,10.8],[0.04,11.08],[0.02,11.36],[0.01,11.64],[0,11.92],[0,12.2],[0.01,12.48],[0.02,12.76],[0.04,13.04],[0.07,13.32],[0.11,13.59],[0.15,13.87],[0.19,14.15],[0.25,14.42],[0.31,14.7],[0.37,14.97],[0.45,15.24],[0.53,15.51],[0.61,15.77],[0.7,16.04],[0.8,16.3],[0.91,16.56],[1.02,16.82],[1.13,17.07],[1.25,17.32],[1.38,17.57],[1.52,17.82],[1.66,18.06],[1.8,18.3],[1.95,18.54],[2.11,18.77],[2.27,19],[2.43,19.22],[2.61,19.45],[2.78,19.66],[2.96,19.88],[3.15,20.08],[3.34,20.29],[3.54,20.49],[3.74,20.68],[3.94,20.87],[4.15,21.06],[4.37,21.24],[4.59,21.42],[4.81,21.59],[5.03,21.75],[5.26,21.92],[5.49,22.07],[5.73,22.22],[5.97,22.36],[6.21,22.5],[6.46,22.64],[6.71,22.76],[6.96,22.88],[7.22,23],[7.48,23.11],[7.74,23.21],[8,23.31],[8.26,23.4],[8.53,23.49],[8.8,23.56],[9.07,23.64],[9.34,23.7],[9.62,23.76],[9.89,23.81],[10.17,23.86],[10.44,23.9],[10.72,23.93],[11,23.96],[11.28,23.98],[11.56,23.99],[11.84,24],[12.12,24],[12.4,23.99],[12.68,23.98],[12.96,23.96],[13.24,23.94],[13.52,23.9],[13.79,23.87],[14.07,23.82],[14.34,23.77],[14.62,23.71],[14.89,23.65],[15.16,23.57],[15.43,23.5],[15.7,23.41],[15.96,23.32],[16.23,23.23],[16.49,23.13],[16.74,23.02],[17,22.9],[17.25,22.78],[17.5,22.66],[17.75,22.52],[17.99,22.39],[18.23,22.24],[18.47,22.09],[18.7,21.94],[18.93,21.78],[19.16,21.61],[19.38,21.44],[19.6,21.27],[19.82,21.09],[20.03,20.9],[20.23,20.71],[20.43,20.52],[20.63,20.32],[20.82,20.11],[21.01,19.91],[21.19,19.69],[21.37,19.48],[21.54,19.26],[21.71,19.03],[21.87,18.8],[22.03,18.57],[22.18,18.34],[22.32,18.1],[22.46,17.86],[22.6,17.61],[22.73,17.36],[22.85,17.11],[22.97,16.86],[23.08,16.6],[23.18,16.34],[23.28,16.08],[23.38,15.81],[23.46,15.55],[23.54,15.28],[23.62,15.01],[23.68,14.74],[23.74,14.46],[23.8,14.19],[23.85,13.91],[23.89,13.64],[23.92,13.36],[23.95,13.08],[23.97,12.8],[23.99,12.52],[24,12.24],[24,11.96],[24,11.68],[23.99,11.4],[23.97,11.12],[23.94,10.84],[23.91,10.56],[23.88,10.29],[23.84,10.01],[23.79,9.73],[23.73,9.46],[23.67,9.19],[23.6,8.92],[23.52,8.65],[23.44,8.38],[23.36,8.11],[23.26,7.85],[23.16,7.59],[23.06,7.33],[22.94,7.07],[22.83,6.82],[22.7,6.57],[22.57,6.32],[22.44,6.07],[22.3,5.83],[22.15,5.59],[22,5.36],[21.84,5.13],[21.68,4.9],[21.51,4.68],[21.33,4.46],[21.15,4.24],[20.97,4.03],[20.78,3.82],[20.59,3.62],[20.39,3.42],[20.19,3.23],[19.98,3.04],[19.77,2.85],[19.56,2.68],[19.34,2.5],[19.11,2.33],[18.89,2.17],[18.66,2.01],[18.42,1.86],[18.18,1.71],[17.94,1.57],[17.7,1.43],[17.45,1.3],[17.2,1.18],[16.94,1.06],[16.69,0.95],[16.43,0.84],[16.17,0.74],[15.9,0.65],[15.64,0.56],[15.37,0.48],[15.1,0.4],[14.83,0.33],[14.56,0.27],[14.28,0.22],[14.01,0.17],[13.73,0.12],[13.45,0.09],[13.17,0.06],[12.89,0.03],[12.61,0.02],[12.33,0],[12.05,0]],[[17.52,17.34],[17.33,17.55],[17.09,17.68],[16.81,17.7],[16.55,17.61],[16.31,17.46],[16.06,17.33],[15.82,17.19],[15.57,17.07],[15.31,16.95],[15.06,16.84],[14.8,16.73],[14.54,16.63],[14.27,16.54],[14,16.45],[13.74,16.38],[13.47,16.3],[13.19,16.24],[12.92,16.18],[12.64,16.13],[12.37,16.08],[12.09,16.04],[11.81,16.01],[11.53,15.98],[11.26,15.95],[10.98,15.94],[10.7,15.93],[10.42,15.92],[10.14,15.92],[9.86,15.92],[9.58,15.93],[9.3,15.95],[9.02,15.96],[8.74,15.99],[8.46,16.01],[8.18,16.04],[7.9,16.08],[7.63,16.12],[7.35,16.16],[7.07,16.21],[6.8,16.26],[6.52,16.31],[6.25,16.37],[5.98,16.43],[5.7,16.46],[5.43,16.38],[5.22,16.21],[5.07,15.97],[5.01,15.7],[5.08,15.43],[5.24,15.21],[5.47,15.05],[5.74,14.97],[6.01,14.91],[6.28,14.85],[6.56,14.8],[6.84,14.75],[7.11,14.71],[7.39,14.67],[7.67,14.63],[7.94,14.59],[8.22,14.56],[8.5,14.54],[8.78,14.51],[9.06,14.49],[9.34,14.48],[9.62,14.47],[9.9,14.46],[10.18,14.46],[10.46,14.46],[10.74,14.47],[11.02,14.48],[11.3,14.5],[11.58,14.52],[11.86,14.55],[12.13,14.58],[12.41,14.62],[12.69,14.66],[12.96,14.71],[13.24,14.76],[13.51,14.82],[13.78,14.89],[14.06,14.96],[14.33,15.03],[14.59,15.12],[14.86,15.2],[15.12,15.3],[15.38,15.4],[15.64,15.51],[15.9,15.62],[16.15,15.74],[16.4,15.86],[16.65,15.99],[16.9,16.13],[17.14,16.27],[17.38,16.41],[17.55,16.63],[17.61,16.9],[17.58,17.18]],[[18.96,14.04],[18.77,14.25],[18.54,14.4],[18.27,14.48],[17.99,14.47],[17.74,14.37],[17.5,14.22],[17.25,14.08],[17.01,13.95],[16.76,13.82],[16.5,13.7],[16.25,13.59],[15.99,13.48],[15.73,13.38],[15.47,13.28],[15.2,13.19],[14.94,13.1],[14.67,13.02],[14.4,12.94],[14.13,12.87],[13.86,12.8],[13.59,12.74],[13.31,12.68],[13.04,12.62],[12.76,12.58],[12.48,12.53],[12.21,12.49],[11.93,12.46],[11.65,12.43],[11.37,12.4],[11.09,12.38],[10.81,12.36],[10.53,12.35],[10.25,12.35],[9.97,12.34],[9.69,12.35],[9.41,12.35],[9.13,12.37],[8.86,12.38],[8.58,12.41],[8.3,12.43],[8.02,12.47],[7.74,12.51],[7.47,12.55],[7.19,12.6],[6.92,12.66],[6.64,12.72],[6.37,12.78],[6.1,12.86],[5.83,12.94],[5.56,12.99],[5.28,12.96],[5.02,12.87],[4.8,12.69],[4.65,12.46],[4.59,12.19],[4.61,11.91],[4.7,11.64],[4.87,11.42],[5.1,11.26],[5.36,11.18],[5.63,11.1],[5.9,11.03],[6.18,10.97],[6.45,10.91],[6.72,10.85],[7,10.8],[7.28,10.75],[7.55,10.71],[7.83,10.68],[8.11,10.64],[8.39,10.62],[8.67,10.59],[8.94,10.58],[9.22,10.56],[9.5,10.55],[9.78,10.55],[10.06,10.55],[10.34,10.55],[10.62,10.56],[10.9,10.57],[11.18,10.58],[11.46,10.6],[11.74,10.63],[12.02,10.66],[12.3,10.69],[12.58,10.73],[12.85,10.77],[13.13,10.81],[13.4,10.86],[13.68,10.92],[13.95,10.97],[14.23,11.04],[14.5,11.1],[14.77,11.17],[15.04,11.25],[15.31,11.33],[15.57,11.41],[15.84,11.5],[16.1,11.59],[16.37,11.69],[16.63,11.79],[16.89,11.9],[17.14,12.01],[17.4,12.13],[17.65,12.25],[17.9,12.38],[18.15,12.51],[18.39,12.65],[18.63,12.79],[18.86,12.94],[19.03,13.17],[19.1,13.44],[19.1,13.72],[19,13.98]],[[19.08,10.68],[18.84,10.54],[18.59,10.41],[18.34,10.28],[18.09,10.16],[17.83,10.05],[17.58,9.94],[17.32,9.83],[17.05,9.74],[16.79,9.64],[16.52,9.56],[16.26,9.47],[15.99,9.39],[15.72,9.32],[15.45,9.25],[15.17,9.18],[14.9,9.12],[14.63,9.07],[14.35,9.01],[14.08,8.96],[13.8,8.92],[13.52,8.87],[13.25,8.83],[12.97,8.8],[12.69,8.77],[12.41,8.74],[12.13,8.71],[11.85,8.69],[11.57,8.67],[11.29,8.66],[11.01,8.65],[10.73,8.64],[10.45,8.64],[10.17,8.63],[9.89,8.64],[9.61,8.64],[9.33,8.65],[9.06,8.66],[8.78,8.68],[8.5,8.7],[8.22,8.73],[7.94,8.75],[7.66,8.79],[7.38,8.82],[7.11,8.86],[6.83,8.91],[6.55,8.96],[6.28,9.01],[6.01,9.07],[5.73,9.14],[5.46,9.21],[5.19,9.29],[4.92,9.34],[4.64,9.33],[4.38,9.24],[4.14,9.09],[3.95,8.89],[3.81,8.65],[3.74,8.38],[3.75,8.1],[3.82,7.83],[3.96,7.59],[4.15,7.39],[4.39,7.24],[4.66,7.15],[4.93,7.08],[5.2,7.01],[5.47,6.95],[5.75,6.89],[6.02,6.83],[6.3,6.78],[6.57,6.74],[6.85,6.7],[7.13,6.66],[7.4,6.62],[7.68,6.59],[7.96,6.56],[8.24,6.54],[8.52,6.52],[8.8,6.5],[9.08,6.49],[9.36,6.48],[9.64,6.47],[9.92,6.46],[10.2,6.46],[10.48,6.46],[10.76,6.47],[11.04,6.48],[11.32,6.49],[11.6,6.5],[11.88,6.52],[12.16,6.54],[12.43,6.56],[12.71,6.58],[12.99,6.61],[13.27,6.65],[13.55,6.68],[13.82,6.72],[14.1,6.76],[14.38,6.81],[14.65,6.86],[14.93,6.91],[15.2,6.96],[15.48,7.02],[15.75,7.09],[16.02,7.15],[16.29,7.22],[16.56,7.3],[16.83,7.37],[17.1,7.46],[17.37,7.54],[17.63,7.63],[17.89,7.73],[18.16,7.83],[18.42,7.93],[18.68,8.04],[18.93,8.15],[19.19,8.27],[19.44,8.39],[19.69,8.52],[19.93,8.65],[20.17,8.79],[20.41,8.95],[20.59,9.16],[20.71,9.41],[20.78,9.68],[20.78,9.96],[20.71,10.23],[20.57,10.47],[20.35,10.65],[20.09,10.76],[19.82,10.82],[19.54,10.82],[19.27,10.76]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2, 3], NAMES = { base: "circle", 0: "circle", 1: "wave", 2: "wave", 3: "wave" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => p.k;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  if (!p.k) { p.pose.dz = 3 * v; return; }
  const beat = Math.max(0, Math.sin(t * 9 - p.k * 0.9)); p.pose.dz = 10 * v + 6 * v * beat; p.pose.sy = 1 + 0.35 * v * beat; p.pose.sx = 1 + 0.04 * v * beat;
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
  name: "spotify",
  means: "Spotify's waves lift out as the pointer nears and pulse like an equaliser, one after another; leave and the music stops.",
  rules: [1, 2, 7, 10],
  range: [0.6, 1, 1.4],
  mount,
});
