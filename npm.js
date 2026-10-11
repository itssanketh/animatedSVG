/**
 * npm:  the npm mark, the blocky wordmark in its frame, as thick plates facing you: an old pixel font. Here the pointer
 * presses start: the letters hop one after another like the sprites of an old arcade game, round and round while the pointer stays,
 * moving in whole pixel steps at a few frames a second as the old machines did; leave and they drop back into their slots.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 150, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 60, POP = { k: 140, c: 13 }, AMBIENT = true, VERB = "press start";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[0,7.33],[0,7.61],[0,7.89],[0,8.17],[0,8.45],[0,8.73],[0,9.01],[0,9.29],[0,9.57],[0,9.85],[0,10.13],[0,10.41],[0,10.69],[0,10.97],[0,11.25],[0,11.53],[0,11.81],[0,12.09],[0,12.37],[0,12.65],[0,12.93],[0,13.21],[0,13.49],[0,13.77],[0,14.05],[0,14.33],[0,14.61],[0,14.89],[0,15.17],[0.2,15.33],[0.48,15.33],[0.76,15.33],[1.04,15.33],[1.32,15.33],[1.6,15.33],[1.88,15.33],[2.16,15.33],[2.44,15.33],[2.72,15.33],[3,15.33],[3.28,15.33],[3.56,15.33],[3.84,15.33],[4.12,15.33],[4.4,15.33],[4.68,15.33],[4.96,15.33],[5.24,15.33],[5.52,15.33],[5.8,15.33],[6.08,15.33],[6.36,15.33],[6.64,15.33],[6.67,15.59],[6.67,15.87],[6.67,16.15],[6.67,16.43],[6.75,16.67],[7.03,16.67],[7.31,16.67],[7.59,16.67],[7.87,16.67],[8.15,16.67],[8.43,16.67],[8.71,16.67],[8.99,16.67],[9.27,16.67],[9.55,16.67],[9.83,16.67],[10.11,16.67],[10.39,16.67],[10.67,16.67],[10.95,16.67],[11.23,16.67],[11.51,16.67],[11.79,16.67],[12,16.52],[12,16.24],[12,15.96],[12,15.68],[12,15.4],[12.26,15.33],[12.54,15.33],[12.82,15.33],[13.1,15.33],[13.38,15.33],[13.66,15.33],[13.94,15.33],[14.22,15.33],[14.5,15.33],[14.78,15.33],[15.06,15.33],[15.34,15.33],[15.62,15.33],[15.9,15.33],[16.18,15.33],[16.46,15.33],[16.74,15.33],[17.02,15.33],[17.3,15.33],[17.58,15.33],[17.86,15.33],[18.14,15.33],[18.42,15.33],[18.7,15.33],[18.98,15.33],[19.26,15.33],[19.54,15.33],[19.82,15.33],[20.1,15.33],[20.38,15.33],[20.66,15.33],[20.94,15.33],[21.22,15.33],[21.5,15.33],[21.78,15.33],[22.06,15.33],[22.34,15.33],[22.62,15.33],[22.9,15.33],[23.18,15.33],[23.46,15.33],[23.74,15.33],[24,15.32],[24,15.04],[24,14.76],[24,14.48],[24,14.2],[24,13.92],[24,13.64],[24,13.36],[24,13.08],[24,12.8],[24,12.52],[24,12.24],[24,11.96],[24,11.68],[24,11.4],[24,11.12],[24,10.84],[24,10.56],[24,10.28],[24,10],[24,9.72],[24,9.44],[24,9.16],[24,8.88],[24,8.6],[24,8.32],[24,8.04],[24,7.76],[24,7.48],[23.78,7.33],[23.5,7.33],[23.22,7.33],[22.94,7.33],[22.66,7.33],[22.38,7.33],[22.1,7.33],[21.82,7.33],[21.54,7.33],[21.26,7.33],[20.98,7.33],[20.7,7.33],[20.42,7.33],[20.14,7.33],[19.86,7.33],[19.58,7.33],[19.3,7.33],[19.02,7.33],[18.74,7.33],[18.46,7.33],[18.18,7.33],[17.9,7.33],[17.62,7.33],[17.34,7.33],[17.06,7.33],[16.78,7.33],[16.5,7.33],[16.22,7.33],[15.94,7.33],[15.66,7.33],[15.38,7.33],[15.1,7.33],[14.82,7.33],[14.54,7.33],[14.26,7.33],[13.98,7.33],[13.7,7.33],[13.42,7.33],[13.14,7.33],[12.86,7.33],[12.58,7.33],[12.3,7.33],[12.02,7.33],[11.74,7.33],[11.46,7.33],[11.18,7.33],[10.9,7.33],[10.62,7.33],[10.34,7.33],[10.06,7.33],[9.78,7.33],[9.5,7.33],[9.22,7.33],[8.94,7.33],[8.66,7.33],[8.38,7.33],[8.1,7.33],[7.82,7.33],[7.54,7.33],[7.26,7.33],[6.98,7.33],[6.7,7.33],[6.42,7.33],[6.14,7.33],[5.86,7.33],[5.58,7.33],[5.3,7.33],[5.02,7.33],[4.74,7.33],[4.46,7.33],[4.18,7.33],[3.9,7.33],[3.62,7.33],[3.34,7.33],[3.06,7.33],[2.78,7.33],[2.5,7.33],[2.22,7.33],[1.94,7.33],[1.66,7.33],[1.38,7.33],[1.1,7.33],[0.82,7.33],[0.54,7.33],[0.26,7.33]],[[6.67,14],[6.39,14],[6.11,14],[5.83,14],[5.55,14],[5.33,13.85],[5.33,13.57],[5.33,13.29],[5.33,13.01],[5.33,12.73],[5.33,12.45],[5.33,12.17],[5.33,11.89],[5.33,11.61],[5.33,11.33],[5.33,11.05],[5.33,10.77],[5.33,10.49],[5.33,10.21],[5.19,10],[4.91,10],[4.63,10],[4.35,10],[4.07,10],[4,10.25],[4,10.53],[4,10.81],[4,11.09],[4,11.37],[4,11.65],[4,11.93],[4,12.21],[4,12.49],[4,12.77],[4,13.05],[4,13.33],[4,13.61],[4,13.89],[3.75,14],[3.47,14],[3.19,14],[2.91,14],[2.63,14],[2.35,14],[2.07,14],[1.79,14],[1.51,14],[1.34,13.81],[1.34,13.53],[1.34,13.25],[1.34,12.97],[1.34,12.69],[1.34,12.41],[1.34,12.13],[1.34,11.85],[1.34,11.57],[1.34,11.29],[1.34,11.01],[1.34,10.73],[1.34,10.45],[1.34,10.17],[1.34,9.89],[1.34,9.61],[1.34,9.33],[1.34,9.05],[1.34,8.77],[1.59,8.67],[1.87,8.67],[2.15,8.67],[2.43,8.67],[2.71,8.67],[2.99,8.67],[3.27,8.67],[3.55,8.67],[3.83,8.67],[4.11,8.67],[4.39,8.67],[4.67,8.67],[4.95,8.67],[5.23,8.67],[5.51,8.67],[5.79,8.67],[6.07,8.67],[6.35,8.67],[6.63,8.67],[6.67,8.95],[6.67,9.23],[6.67,9.51],[6.67,9.79],[6.67,10.07],[6.67,10.35],[6.67,10.63],[6.67,10.91],[6.67,11.19],[6.67,11.47],[6.67,11.75],[6.67,12.03],[6.67,12.31],[6.67,12.59],[6.67,12.87],[6.67,13.15],[6.67,13.43],[6.67,13.71],[6.67,13.99]],[[10.67,14],[10.67,14.28],[10.67,14.56],[10.67,14.84],[10.67,15.12],[10.52,15.33],[10.24,15.33],[9.96,15.33],[9.68,15.33],[9.4,15.33],[9.12,15.33],[8.84,15.33],[8.56,15.33],[8.28,15.33],[8,15.33],[8,15.05],[8,14.77],[8,14.49],[8,14.21],[8,13.93],[8,13.65],[8,13.37],[8,13.09],[8,12.81],[8,12.53],[8,12.25],[8,11.97],[8,11.69],[8,11.41],[8,11.13],[8,10.85],[8,10.57],[8,10.29],[8,10.01],[8,9.73],[8,9.45],[8,9.17],[8,8.89],[8.13,8.67],[8.41,8.67],[8.69,8.67],[8.97,8.67],[9.25,8.67],[9.53,8.67],[9.81,8.67],[10.09,8.67],[10.37,8.67],[10.65,8.67],[10.93,8.67],[11.21,8.67],[11.49,8.67],[11.77,8.67],[12.05,8.67],[12.33,8.67],[12.61,8.67],[12.89,8.67],[13.17,8.67],[13.34,8.87],[13.34,9.14],[13.34,9.43],[13.34,9.71],[13.34,9.98],[13.34,10.27],[13.34,10.54],[13.34,10.82],[13.34,11.11],[13.34,11.38],[13.34,11.66],[13.34,11.95],[13.34,12.22],[13.34,12.51],[13.34,12.79],[13.34,13.06],[13.34,13.35],[13.34,13.62],[13.34,13.9],[13.07,14],[12.79,14],[12.51,14],[12.23,14],[11.95,14],[11.67,14],[11.39,14],[11.11,14],[10.83,14]],[[22.67,14],[22.39,14],[22.11,14],[21.83,14],[21.55,14],[21.34,13.85],[21.34,13.57],[21.34,13.29],[21.34,13.01],[21.34,12.73],[21.34,12.45],[21.34,12.17],[21.34,11.89],[21.34,11.61],[21.34,11.33],[21.34,11.05],[21.34,10.77],[21.34,10.49],[21.34,10.21],[21.19,10],[20.91,10],[20.63,10],[20.35,10],[20.07,10],[20,10.25],[20,10.53],[20,10.81],[20,11.09],[20,11.37],[20,11.65],[20,11.93],[20,12.21],[20,12.49],[20,12.77],[20,13.05],[20,13.33],[20,13.61],[20,13.89],[19.75,14],[19.47,14],[19.19,14],[18.91,14],[18.67,13.92],[18.67,13.64],[18.67,13.36],[18.67,13.08],[18.67,12.8],[18.67,12.52],[18.67,12.24],[18.67,11.96],[18.67,11.68],[18.67,11.4],[18.67,11.12],[18.67,10.84],[18.67,10.56],[18.67,10.28],[18.67,10],[18.39,10],[18.11,10],[17.83,10],[17.55,10],[17.34,10.15],[17.34,10.43],[17.34,10.71],[17.34,10.99],[17.34,11.27],[17.34,11.55],[17.34,11.83],[17.34,12.11],[17.34,12.39],[17.34,12.67],[17.34,12.95],[17.34,13.23],[17.34,13.51],[17.34,13.79],[17.19,14],[16.91,14],[16.63,14],[16.35,14],[16.07,14],[15.79,14],[15.51,14],[15.23,14],[14.95,14],[14.67,14],[14.67,13.72],[14.67,13.44],[14.67,13.16],[14.67,12.88],[14.67,12.6],[14.67,12.32],[14.67,12.04],[14.67,11.76],[14.67,11.48],[14.67,11.2],[14.67,10.92],[14.67,10.64],[14.67,10.36],[14.67,10.08],[14.67,9.8],[14.67,9.52],[14.67,9.24],[14.67,8.96],[14.67,8.68],[14.93,8.67],[15.21,8.67],[15.49,8.67],[15.77,8.67],[16.05,8.67],[16.33,8.67],[16.61,8.67],[16.89,8.67],[17.17,8.67],[17.45,8.67],[17.73,8.67],[18.01,8.67],[18.29,8.67],[18.57,8.67],[18.85,8.67],[19.13,8.67],[19.41,8.67],[19.69,8.67],[19.97,8.67],[20.25,8.67],[20.53,8.67],[20.81,8.67],[21.09,8.67],[21.37,8.67],[21.65,8.67],[21.93,8.67],[22.21,8.67],[22.49,8.67],[22.67,8.85],[22.67,9.13],[22.67,9.41],[22.67,9.69],[22.67,9.97],[22.67,10.25],[22.67,10.53],[22.67,10.81],[22.67,11.09],[22.67,11.37],[22.67,11.65],[22.67,11.93],[22.67,12.21],[22.67,12.49],[22.67,12.77],[22.67,13.05],[22.67,13.33],[22.67,13.61],[22.67,13.89]],[[10.66,10],[10.94,10],[11.23,10],[11.51,10],[11.78,10],[12,10.15],[12,10.43],[12,10.7],[12,10.98],[12,11.26],[12,11.55],[12,11.82],[12,12.1],[12,12.39],[12,12.66],[11.72,12.67],[11.44,12.67],[11.16,12.67],[10.88,12.67],[10.66,12.52],[10.66,12.24],[10.66,11.96],[10.66,11.68],[10.66,11.4],[10.66,11.12],[10.66,10.84],[10.66,10.56],[10.66,10.28],[10.66,10]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1, 2, 3], NAMES = { base: "frame", 0: "frame", 1: "n", 2: "p", 3: "m", 4: "p" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.d === 0 ? 0 : 1);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  // the old machines' clock: twelve frames a second, and every position snapped to a pixel of the font
  const tq = Math.floor(t * 12) / 12, px = (x) => Math.round(x / 0.045) * 0.045;
  if (p.d === 0) { p.pose.dz = 3 * v; return; }
  const k = p.k === 4 ? 2 : p.k, ph = (((tq * 1.25 - (k - 1) * 0.27) % 1) + 1) % 1, hop = ph < 0.42 ? Math.sin((Math.PI * ph) / 0.42) : 0;
  p.pose.dy = px(0.2 * hop * v); p.pose.dz = 10 * v;
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
  name: "npm",
  means: "npm's blocky letters hop in turn like old arcade sprites as the pointer nears, in whole pixel steps; leave and they drop back in.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
