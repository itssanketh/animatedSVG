/**
 * Figma: the Figma mark, its five shapes, as thick plates facing you. A Figma file is shapes in layers; here the pointer
 * opens them out like an exploded view of the layers panel: each shape slides away from the middle and stands at its own depth, one
 * after another, and leaving snaps them back onto the grid, overshooting a little as they lock.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 60, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "layers";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[4.0,4.0],[4.05,3.37],[4.2,2.76],[4.44,2.18],[4.76,1.65],[5.17,1.17],[5.65,0.76],[6.18,0.44],[6.76,0.2],[7.37,0.05],[8.0,0.0],[12.0,0],[12.0,8.0],[8.0,8.0],[7.37,7.95],[6.76,7.8],[6.18,7.56],[5.65,7.24],[5.17,6.83],[4.76,6.35],[4.44,5.82],[4.2,5.24],[4.05,4.63],[4.0,4.0]],[[12.0,0],[16.0,0.0],[16.63,0.05],[17.24,0.2],[17.82,0.44],[18.35,0.76],[18.83,1.17],[19.24,1.65],[19.56,2.18],[19.8,2.76],[19.95,3.37],[20.0,4.0],[20.0,4.0],[19.95,4.63],[19.8,5.24],[19.56,5.82],[19.24,6.35],[18.83,6.83],[18.35,7.24],[17.82,7.56],[17.24,7.8],[16.63,7.95],[16.0,8.0],[12.0,8.0]],[[4.0,12.0],[4.05,11.37],[4.2,10.76],[4.44,10.18],[4.76,9.65],[5.17,9.17],[5.65,8.76],[6.18,8.44],[6.76,8.2],[7.37,8.05],[8.0,8.0],[12.0,8.0],[12.0,16.0],[8.0,16.0],[7.37,15.95],[6.76,15.8],[6.18,15.56],[5.65,15.24],[5.17,14.83],[4.76,14.35],[4.44,13.82],[4.2,13.24],[4.05,12.63],[4.0,12.0]],[[20.0,12.0],[19.95,12.63],[19.8,13.24],[19.56,13.82],[19.24,14.35],[18.83,14.83],[18.35,15.24],[17.82,15.56],[17.24,15.8],[16.63,15.95],[16.0,16.0],[15.37,15.95],[14.76,15.8],[14.18,15.56],[13.65,15.24],[13.17,14.83],[12.76,14.35],[12.44,13.82],[12.2,13.24],[12.05,12.63],[12.0,12.0],[12.05,11.37],[12.2,10.76],[12.44,10.18],[12.76,9.65],[13.17,9.17],[13.65,8.76],[14.18,8.44],[14.76,8.2],[15.37,8.05],[16.0,8.0],[16.63,8.05],[17.24,8.2],[17.82,8.44],[18.35,8.76],[18.83,9.17],[19.24,9.65],[19.56,10.18],[19.8,10.76],[19.95,11.37]],[[4.0,20.0],[4.05,19.37],[4.2,18.76],[4.44,18.18],[4.76,17.65],[5.17,17.17],[5.65,16.76],[6.18,16.44],[6.76,16.2],[7.37,16.05],[8.0,16.0],[12.0,16.0],[12.0,20.0],[11.95,20.63],[11.8,21.24],[11.56,21.82],[11.24,22.35],[10.83,22.83],[10.35,23.24],[9.82,23.56],[9.24,23.8],[8.63,23.95],[8.0,24.0],[8.0,24.0],[7.37,23.95],[6.76,23.8],[6.18,23.56],[5.65,23.24],[5.17,22.83],[4.76,22.35],[4.44,21.82],[4.2,21.24],[4.05,20.63],[4.0,20.0]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [], NAMES = { base: "layer", 3: "circle" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  const l = Math.hypot(p.c[0], p.c[1]) || 1; p.pose.dx = (p.c[0] / l) * 0.13 * v; p.pose.dy = (p.c[1] / l) * 0.13 * v; p.pose.dz = (4 + 5 * p.k) * v;
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
  name: "figma",
  means: "Figma's five shapes spread out and stand at their own depths like layers as the pointer nears; leave and they snap back onto the grid.",
  rules: [1, 2, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
