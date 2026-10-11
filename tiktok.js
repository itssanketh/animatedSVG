/**
 * TikTok: the TikTok note, as a thick plate facing you, with two echoes of it behind. In the reference animation the
 * note glitches, its coloured echoes slipping out from behind it and flickering; here the pointer does the same: the note lifts toward
 * you and its two echoes slip out to either side, jittering while the pointer stays; leave and they slide back behind it.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = true, VERB = "glitch";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[12.52,0.02],[12.8,0.02],[13.08,0.01],[13.36,0.01],[13.64,0.01],[13.92,0.01],[14.2,0.01],[14.48,0.01],[14.76,0.01],[15.04,0.01],[15.32,0],[15.6,0],[15.88,0],[16.16,0],[16.44,0.01],[16.46,0.29],[16.49,0.57],[16.53,0.84],[16.58,1.12],[16.64,1.39],[16.72,1.66],[16.8,1.93],[16.9,2.19],[17,2.45],[17.12,2.7],[17.25,2.95],[17.4,3.19],[17.55,3.43],[17.72,3.65],[17.9,3.87],[18.09,4.07],[18.29,4.27],[18.5,4.45],[18.72,4.63],[18.94,4.79],[19.18,4.94],[19.42,5.08],[19.67,5.21],[19.93,5.33],[20.18,5.43],[20.45,5.53],[20.71,5.62],[20.98,5.69],[21.25,5.76],[21.53,5.82],[21.8,5.87],[22.08,5.92],[22.36,5.95],[22.42,6.21],[22.42,6.49],[22.42,6.77],[22.42,7.05],[22.42,7.33],[22.42,7.61],[22.42,7.89],[22.42,8.17],[22.42,8.45],[22.42,8.73],[22.42,9.01],[22.42,9.29],[22.42,9.57],[22.42,9.85],[22.2,9.98],[21.92,9.96],[21.65,9.94],[21.37,9.91],[21.09,9.87],[20.81,9.83],[20.54,9.77],[20.26,9.72],[19.99,9.65],[19.72,9.58],[19.45,9.5],[19.19,9.41],[18.92,9.32],[18.66,9.21],[18.41,9.1],[18.15,8.99],[17.9,8.86],[17.65,8.73],[17.41,8.59],[17.17,8.45],[16.93,8.3],[16.7,8.15],[16.6,8.42],[16.6,8.7],[16.6,8.98],[16.6,9.26],[16.6,9.54],[16.6,9.82],[16.6,10.1],[16.6,10.38],[16.6,10.66],[16.6,10.94],[16.6,11.22],[16.6,11.5],[16.6,11.78],[16.6,12.06],[16.6,12.34],[16.6,12.62],[16.6,12.9],[16.6,13.18],[16.6,13.46],[16.6,13.74],[16.6,14.02],[16.6,14.3],[16.6,14.58],[16.6,14.86],[16.6,15.14],[16.6,15.42],[16.59,15.7],[16.59,15.98],[16.59,16.26],[16.59,16.54],[16.59,16.82],[16.57,17.1],[16.54,17.38],[16.5,17.66],[16.44,17.93],[16.39,18.2],[16.32,18.48],[16.24,18.74],[16.15,19.01],[16.05,19.27],[15.94,19.53],[15.82,19.78],[15.69,20.03],[15.56,20.28],[15.41,20.52],[15.26,20.75],[15.09,20.98],[14.92,21.2],[14.75,21.42],[14.56,21.62],[14.36,21.82],[14.16,22.02],[13.95,22.2],[13.74,22.38],[13.51,22.55],[13.28,22.71],[13.05,22.86],[12.81,23.01],[12.56,23.14],[12.31,23.27],[12.06,23.39],[11.8,23.49],[11.54,23.59],[11.27,23.68],[11,23.75],[10.73,23.82],[10.46,23.88],[10.18,23.92],[9.9,23.96],[9.62,23.98],[9.34,23.99],[9.06,24],[8.78,24],[8.5,23.99],[8.22,23.96],[7.95,23.93],[7.67,23.88],[7.4,23.82],[7.12,23.75],[6.86,23.68],[6.59,23.59],[6.33,23.49],[6.07,23.38],[5.81,23.26],[5.56,23.14],[5.32,23],[5.08,22.86],[4.84,22.71],[4.62,22.54],[4.39,22.37],[4.18,22.19],[3.97,22.01],[3.77,21.81],[3.58,21.61],[3.39,21.4],[3.21,21.19],[3.04,20.97],[2.88,20.74],[2.72,20.5],[2.58,20.27],[2.44,20.02],[2.31,19.77],[2.19,19.52],[2.08,19.26],[1.98,19],[1.89,18.73],[1.81,18.47],[1.75,18.19],[1.69,17.92],[1.64,17.64],[1.61,17.37],[1.59,17.09],[1.58,16.81],[1.58,16.53],[1.57,16.25],[1.58,15.97],[1.59,15.69],[1.63,15.41],[1.67,15.13],[1.73,14.86],[1.79,14.59],[1.87,14.32],[1.96,14.05],[2.05,13.79],[2.16,13.53],[2.27,13.27],[2.4,13.02],[2.53,12.78],[2.68,12.54],[2.83,12.3],[2.99,12.07],[3.16,11.85],[3.33,11.63],[3.52,11.42],[3.71,11.22],[3.91,11.02],[4.12,10.84],[4.34,10.66],[4.56,10.48],[4.78,10.32],[5.02,10.16],[5.25,10.02],[5.5,9.88],[5.75,9.75],[6,9.63],[6.26,9.52],[6.52,9.42],[6.78,9.33],[7.05,9.25],[7.32,9.17],[7.59,9.11],[7.87,9.06],[8.15,9.02],[8.42,8.99],[8.7,8.97],[8.98,8.96],[9.26,8.97],[9.54,8.98],[9.82,9.01],[10.1,9.04],[10.32,9.18],[10.32,9.46],[10.32,9.74],[10.32,10.02],[10.32,10.3],[10.31,10.58],[10.31,10.86],[10.31,11.14],[10.3,11.42],[10.3,11.7],[10.29,11.98],[10.29,12.26],[10.28,12.54],[10.28,12.82],[10.28,13.1],[10.28,13.38],[10.02,13.45],[9.75,13.39],[9.47,13.35],[9.19,13.34],[8.91,13.34],[8.63,13.37],[8.36,13.42],[8.09,13.49],[7.82,13.58],[7.57,13.7],[7.33,13.84],[7.1,14],[6.88,14.18],[6.68,14.37],[6.49,14.58],[6.32,14.8],[6.17,15.04],[6.04,15.29],[5.93,15.54],[5.84,15.81],[5.77,16.08],[5.75,16.36],[5.74,16.64],[5.75,16.92],[5.75,17.2],[5.8,17.47],[5.87,17.74],[5.97,18.01],[6.08,18.26],[6.22,18.5],[6.38,18.74],[6.56,18.95],[6.75,19.16],[6.95,19.35],[7.17,19.52],[7.41,19.67],[7.65,19.81],[7.91,19.92],[8.17,20.01],[8.45,20.08],[8.72,20.12],[9,20.13],[9.28,20.12],[9.56,20.1],[9.84,20.06],[10.11,19.99],[10.37,19.9],[10.63,19.78],[10.88,19.65],[11.11,19.49],[11.33,19.32],[11.53,19.13],[11.72,18.93],[11.9,18.7],[12.05,18.47],[12.19,18.23],[12.31,17.97],[12.4,17.71],[12.44,17.43],[12.45,17.15],[12.46,16.87],[12.47,16.59],[12.48,16.31],[12.49,16.03],[12.49,15.75],[12.5,15.47],[12.5,15.19],[12.5,14.91],[12.5,14.63],[12.5,14.35],[12.5,14.07],[12.5,13.79],[12.5,13.51],[12.5,13.23],[12.5,12.95],[12.5,12.67],[12.5,12.39],[12.5,12.11],[12.51,11.83],[12.51,11.55],[12.51,11.27],[12.51,10.99],[12.51,10.71],[12.51,10.43],[12.51,10.15],[12.51,9.87],[12.51,9.59],[12.51,9.31],[12.51,9.03],[12.51,8.75],[12.51,8.47],[12.51,8.19],[12.51,7.91],[12.51,7.63],[12.51,7.35],[12.51,7.07],[12.51,6.79],[12.51,6.51],[12.51,6.23],[12.51,5.95],[12.51,5.67],[12.51,5.39],[12.51,5.11],[12.51,4.83],[12.51,4.55],[12.51,4.27],[12.51,3.99],[12.51,3.71],[12.51,3.43],[12.51,3.15],[12.51,2.87],[12.51,2.59],[12.51,2.31],[12.51,2.03],[12.52,1.75],[12.52,1.47],[12.52,1.19],[12.52,0.91],[12.52,0.63],[12.52,0.35],[12.52,0.07]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "note" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  p.pose.dz = 8 * v;
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
  // the note's two echoes, behind it: at rest they sit exactly under it and are hidden
  const eg = mk("g", {}, svg); svg.insertBefore(eg, g);
  const echoes = [-1, 1].map((sg) => ({ ...ps[0], sg, pose: {}, el: plate(eg) }));
  function draw() {
    const r = ps[0].sp.x * amt;
    echoes.forEach((e) => { const j = on ? 0.012 * Math.sin(now / 70 + e.sg * 2) : 0; e.pose = { dx: e.sg * (0.06 + j) * r, dy: -e.sg * (0.045 - j) * r, dz: 3 * r }; drawPart(e); });
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
  name: "tiktok",
  means: "TikTok's note lifts as the pointer nears and its two echoes slip out to either side, jittering; leave and they slide back behind it.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
