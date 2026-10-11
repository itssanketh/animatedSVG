/**
 * YouTube: the YouTube mark, the rounded screen with the play button cut through it, as thick plates facing you. Its
 * reference animation, measured frame by frame: the screen grows in over 290ms, easing out, from a tilt of about 14 degrees that it
 * loses over 420ms, and the play button grows in after it, from 420ms to 580ms. Here the pointer replays that: the screen dips back
 * small and tilted, grows in and straightens on those timings while the button follows, and then both stand a little toward you;
 * leave and they settle back.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 45, POP = { k: 140, c: 13 }, AMBIENT = false, VERB = "play";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[23.5,6.19],[23.41,5.92],[23.31,5.66],[23.17,5.41],[23.02,5.18],[22.84,4.96],[22.65,4.76],[22.44,4.58],[22.21,4.42],[21.96,4.28],[21.71,4.16],[21.45,4.07],[21.17,4],[20.9,3.95],[20.62,3.91],[20.34,3.87],[20.07,3.84],[19.79,3.81],[19.51,3.79],[19.23,3.77],[18.95,3.75],[18.67,3.73],[18.39,3.71],[18.11,3.69],[17.83,3.68],[17.55,3.67],[17.27,3.65],[16.99,3.64],[16.71,3.63],[16.43,3.62],[16.15,3.61],[15.87,3.6],[15.59,3.6],[15.31,3.59],[15.03,3.58],[14.75,3.58],[14.47,3.57],[14.19,3.57],[13.91,3.56],[13.63,3.56],[13.35,3.55],[13.07,3.55],[12.79,3.55],[12.51,3.55],[12.23,3.55],[11.95,3.55],[11.67,3.55],[11.39,3.55],[11.11,3.55],[10.83,3.55],[10.55,3.56],[10.27,3.56],[9.99,3.56],[9.71,3.57],[9.43,3.57],[9.15,3.58],[8.87,3.59],[8.59,3.59],[8.31,3.6],[8.03,3.61],[7.76,3.62],[7.48,3.63],[7.2,3.64],[6.92,3.65],[6.64,3.66],[6.36,3.67],[6.08,3.68],[5.8,3.7],[5.52,3.72],[5.24,3.73],[4.96,3.75],[4.68,3.77],[4.4,3.8],[4.12,3.82],[3.84,3.85],[3.56,3.88],[3.29,3.92],[3.01,3.97],[2.74,4.02],[2.47,4.1],[2.21,4.2],[1.96,4.32],[1.72,4.47],[1.49,4.64],[1.29,4.83],[1.1,5.03],[0.93,5.26],[0.78,5.49],[0.66,5.74],[0.56,6.01],[0.48,6.27],[0.42,6.55],[0.36,6.82],[0.32,7.1],[0.28,7.38],[0.24,7.65],[0.21,7.93],[0.18,8.21],[0.15,8.49],[0.13,8.77],[0.11,9.05],[0.09,9.33],[0.07,9.61],[0.06,9.88],[0.05,10.16],[0.03,10.44],[0.02,10.72],[0.02,11],[0.01,11.28],[0,11.56],[0,11.84],[0,12.12],[0,12.4],[0.01,12.68],[0.02,12.96],[0.02,13.24],[0.03,13.52],[0.04,13.8],[0.06,14.08],[0.07,14.36],[0.09,14.64],[0.11,14.92],[0.13,15.2],[0.15,15.48],[0.18,15.76],[0.2,16.04],[0.24,16.32],[0.27,16.59],[0.31,16.87],[0.36,17.15],[0.41,17.42],[0.47,17.69],[0.55,17.96],[0.64,18.23],[0.77,18.48],[0.91,18.72],[1.08,18.94],[1.26,19.15],[1.47,19.34],[1.69,19.51],[1.93,19.66],[2.18,19.79],[2.44,19.89],[2.71,19.97],[2.98,20.03],[3.26,20.07],[3.53,20.11],[3.81,20.15],[4.09,20.18],[4.37,20.2],[4.65,20.22],[4.93,20.25],[5.21,20.26],[5.49,20.28],[5.77,20.3],[6.04,20.31],[6.32,20.33],[6.6,20.34],[6.88,20.35],[7.16,20.36],[7.44,20.37],[7.72,20.38],[8,20.39],[8.28,20.4],[8.56,20.41],[8.84,20.41],[9.12,20.42],[9.4,20.43],[9.68,20.43],[9.96,20.44],[10.24,20.44],[10.52,20.44],[10.8,20.45],[11.08,20.45],[11.36,20.45],[11.64,20.45],[11.92,20.45],[12.2,20.45],[12.48,20.45],[12.76,20.45],[13.04,20.45],[13.32,20.45],[13.6,20.44],[13.88,20.44],[14.16,20.43],[14.44,20.43],[14.72,20.42],[15,20.42],[15.28,20.41],[15.56,20.4],[15.84,20.4],[16.12,20.39],[16.4,20.38],[16.68,20.37],[16.96,20.36],[17.24,20.35],[17.52,20.33],[17.8,20.32],[18.08,20.31],[18.36,20.29],[18.64,20.27],[18.92,20.26],[19.2,20.24],[19.48,20.21],[19.76,20.19],[20.03,20.16],[20.31,20.13],[20.59,20.1],[20.87,20.06],[21.14,20],[21.42,19.94],[21.68,19.85],[21.94,19.74],[22.18,19.6],[22.41,19.44],[22.63,19.26],[22.82,19.06],[23,18.85],[23.16,18.61],[23.29,18.37],[23.4,18.11],[23.49,17.85],[23.56,17.57],[23.61,17.3],[23.66,17.02],[23.71,16.75],[23.75,16.47],[23.78,16.19],[23.81,15.91],[23.84,15.64],[23.86,15.36],[23.88,15.08],[23.9,14.8],[23.92,14.52],[23.94,14.24],[23.95,13.96],[23.96,13.68],[23.97,13.4],[23.98,13.12],[23.99,12.84],[23.99,12.56],[24,12.28],[24,12],[24,11.72],[23.99,11.44],[23.99,11.16],[23.98,10.88],[23.97,10.6],[23.96,10.32],[23.95,10.04],[23.94,9.76],[23.92,9.48],[23.9,9.2],[23.88,8.92],[23.86,8.64],[23.84,8.36],[23.81,8.09],[23.78,7.81],[23.75,7.53],[23.71,7.25],[23.66,6.98],[23.61,6.7],[23.56,6.43]],[[9.55,15.57],[9.55,15.29],[9.55,15.01],[9.55,14.73],[9.55,14.45],[9.55,14.17],[9.55,13.89],[9.55,13.61],[9.55,13.33],[9.55,13.05],[9.55,12.77],[9.55,12.49],[9.55,12.21],[9.55,11.93],[9.55,11.65],[9.55,11.37],[9.55,11.09],[9.55,10.81],[9.55,10.53],[9.55,10.25],[9.55,9.97],[9.55,9.69],[9.55,9.41],[9.55,9.13],[9.55,8.85],[9.55,8.57],[9.81,8.58],[10.05,8.72],[10.3,8.86],[10.54,9],[10.78,9.14],[11.03,9.27],[11.27,9.41],[11.51,9.55],[11.76,9.69],[12,9.83],[12.24,9.97],[12.49,10.11],[12.73,10.24],[12.97,10.38],[13.22,10.52],[13.46,10.66],[13.7,10.8],[13.95,10.94],[14.19,11.07],[14.43,11.21],[14.68,11.35],[14.92,11.49],[15.16,11.63],[15.41,11.77],[15.65,11.9],[15.57,12.14],[15.32,12.28],[15.08,12.42],[14.84,12.56],[14.59,12.7],[14.35,12.83],[14.11,12.97],[13.86,13.11],[13.62,13.25],[13.38,13.39],[13.13,13.53],[12.89,13.66],[12.65,13.8],[12.4,13.94],[12.16,14.08],[11.92,14.22],[11.67,14.36],[11.43,14.5],[11.19,14.63],[10.94,14.77],[10.7,14.91],[10.46,15.05],[10.21,15.19],[9.97,15.33],[9.73,15.46]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [1], NAMES = { base: "screen", 0: "screen", 1: "play" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = null;
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  const out = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3, dip = since < 0 ? 0 : out(since / 0.12);
  // the screen's size and tilt: down to 0.6 and -14 degrees in 120ms, then the measured entrance from there
  const grow = since < 0 ? 1 : lerp(1, 0.6, dip) + (1 - 0.6) * out((since - 0.12) / 0.29) * dip, tilt = since < 0 ? 0 : -0.245 * dip * (1 - out((since - 0.12) / 0.42));
  const play = since < 0 ? 1 : Math.max(0.02, 1 - dip + dip * out((since - 0.54) / 0.16));
  const s = grow * (1 + 0.05 * v), c = Math.cos(tilt), sn = Math.sin(tilt);
  if (p.k === 1) { const k = play * (1 + 0.15 * v); p.pose.sx = p.pose.sy = k * s; p.pose.rot = tilt; p.pose.dx = (p.c[0] * c - p.c[1] * sn) * s - p.c[0]; p.pose.dy = (p.c[0] * sn + p.c[1] * c) * s - p.c[1]; p.pose.dz = 14 * v; }
  else { p.pose.pivot = [0, 0]; p.pose.sx = p.pose.sy = s; p.pose.rot = tilt; p.pose.dz = 4 * v; }
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
  name: "youtube",
  means: "YouTube's screen dips, then grows back in and straightens as the pointer nears, the play button following; leave and they settle.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.4],
  mount,
});
