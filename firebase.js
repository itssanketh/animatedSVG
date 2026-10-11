/**
 * Firebase: the Firebase mark, the flame with its two tongues inside, as thick plates facing you. Here the pointer lights it:
 * the whole flame flickers, stretching and swaying from its base, the tongues inside dance to their own beats, and embers rise off
 * its tip and fade as they climb, while the pointer stays; leave and the fire dies down and it stands still.
 * The part under the pointer takes the bright edge. The slider is how far the parts move. A tribute: the mark belongs to its owners.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides, the face turned
 * toward you, nearer parts painted later. Each part answers on its own spring, a little underdamped because the reference animation
 * overshoots as each part lands, and the parts start one after another, nearest the pointer first. The part under the pointer is
 * tested against its outline at rest, and the pointer is read against the mark's middle, which never moves.
 */
const { lerp, mk, poly, spring, stepS, disposer, pointer, register } = HL;

const K = 112, CX = 200, CY = 160, T = 8, DEEP = 0.16, STEP = 60, POP = { k: 140, c: 13 }, AMBIENT = true, VERB = "burn";
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[19.45,8.37],[19.29,8.14],[19.12,7.92],[18.95,7.7],[18.78,7.48],[18.6,7.26],[18.43,7.04],[18.25,6.82],[18.08,6.6],[17.9,6.38],[17.73,6.17],[17.55,5.95],[17.37,5.73],[17.19,5.52],[17.02,5.3],[16.84,5.08],[16.66,4.87],[16.48,4.65],[16.3,4.44],[16.12,4.22],[15.95,4.01],[15.77,3.79],[15.59,3.58],[15.41,3.36],[15.23,3.15],[15.05,2.93],[14.87,2.72],[14.69,2.5],[14.51,2.29],[14.33,2.07],[14.15,1.86],[13.97,1.65],[13.79,1.43],[13.61,1.22],[13.42,1],[13.24,0.79],[13.06,0.58],[12.88,0.37],[12.7,0.15],[12.44,0.1],[12.23,0.28],[12.01,0.45],[11.79,0.63],[11.58,0.81],[11.37,0.99],[11.16,1.18],[10.96,1.38],[10.76,1.58],[10.57,1.78],[10.38,1.99],[10.2,2.2],[10.01,2.41],[9.84,2.63],[9.67,2.85],[9.5,3.07],[9.34,3.3],[9.18,3.53],[9.03,3.77],[8.88,4.01],[8.74,4.25],[8.6,4.49],[8.47,4.74],[8.35,4.99],[8.22,5.24],[8.11,5.5],[7.99,5.75],[7.89,6.01],[7.78,6.27],[7.69,6.54],[7.6,6.8],[7.52,7.07],[7.44,7.34],[7.38,7.61],[7.32,7.88],[7.26,8.16],[7.21,8.43],[7.16,8.71],[7.12,8.99],[6.85,9.02],[6.57,9.01],[6.29,9],[6.01,9],[5.73,9.01],[5.45,9.04],[5.18,9.07],[4.9,9.11],[4.62,9.16],[4.35,9.23],[4.08,9.3],[3.82,9.38],[3.68,9.63],[3.54,9.87],[3.42,10.12],[3.3,10.37],[3.18,10.63],[3.08,10.89],[2.98,11.15],[2.89,11.42],[2.8,11.68],[2.73,11.95],[2.66,12.22],[2.6,12.5],[2.55,12.77],[2.5,13.05],[2.47,13.33],[2.44,13.61],[2.42,13.88],[2.41,14.16],[2.41,14.44],[2.41,14.72],[2.42,15],[2.45,15.28],[2.48,15.56],[2.51,15.84],[2.56,16.12],[2.61,16.39],[2.67,16.66],[2.74,16.93],[2.82,17.2],[2.91,17.47],[3,17.73],[3.1,18],[3.21,18.25],[3.33,18.51],[3.45,18.76],[3.58,19.01],[3.72,19.25],[3.86,19.49],[4.02,19.72],[4.17,19.96],[4.34,20.18],[4.51,20.4],[4.69,20.62],[4.87,20.83],[5.06,21.03],[5.26,21.23],[5.46,21.43],[5.67,21.62],[5.88,21.8],[6.1,21.97],[6.32,22.14],[6.55,22.31],[6.78,22.46],[7.02,22.61],[7.26,22.75],[7.51,22.89],[7.76,23.01],[8.01,23.13],[8.27,23.25],[8.53,23.35],[8.79,23.45],[9.05,23.54],[9.32,23.62],[9.59,23.69],[9.86,23.76],[10.14,23.82],[10.41,23.87],[10.69,23.91],[10.97,23.94],[11.25,23.97],[11.53,23.99],[11.81,24],[12.09,24],[12.37,23.99],[12.65,23.98],[12.92,23.96],[13.2,23.93],[13.48,23.89],[13.76,23.84],[14.03,23.78],[14.3,23.72],[14.57,23.65],[14.84,23.57],[15.11,23.48],[15.37,23.39],[15.63,23.29],[15.89,23.18],[16.14,23.06],[16.39,22.94],[16.64,22.8],[16.88,22.66],[17.12,22.52],[17.36,22.37],[17.59,22.21],[17.81,22.04],[18.03,21.87],[18.25,21.69],[18.46,21.5],[18.66,21.31],[18.86,21.11],[19.05,20.91],[19.24,20.7],[19.42,20.49],[19.59,20.27],[19.76,20.05],[19.92,19.82],[20.08,19.58],[20.23,19.35],[20.37,19.1],[20.5,18.86],[20.63,18.61],[20.75,18.35],[20.86,18.1],[20.96,17.84],[21.06,17.57],[21.15,17.31],[21.23,17.04],[21.3,16.77],[21.36,16.5],[21.42,16.22],[21.47,15.95],[21.51,15.67],[21.54,15.39],[21.57,15.11],[21.58,14.83],[21.59,14.55],[21.59,14.27],[21.58,13.99],[21.56,13.72],[21.54,13.44],[21.5,13.16],[21.46,12.88],[21.4,12.61],[21.34,12.33],[21.27,12.06],[21.2,11.79],[21.11,11.53],[21.02,11.26],[20.92,11],[20.81,10.74],[20.7,10.49],[20.58,10.23],[20.45,9.98],[20.32,9.74],[20.18,9.49],[20.04,9.25],[19.89,9.01],[19.74,8.78],[19.58,8.55]],[[12.37,15.06],[12.44,15.34],[12.49,15.61],[12.53,15.89],[12.56,16.17],[12.58,16.45],[12.58,16.73],[12.56,17.01],[12.53,17.28],[12.49,17.56],[12.43,17.83],[12.36,18.11],[12.28,18.37],[12.17,18.61],[11.98,18.41],[11.78,18.21],[11.59,18],[11.41,17.79],[11.23,17.58],[11.06,17.35],[10.9,17.13],[10.73,16.9],[10.58,16.67],[10.43,16.43],[10.29,16.19],[10.16,15.94],[10.03,15.69],[9.91,15.44],[9.8,15.18],[9.69,14.92],[9.59,14.66],[9.5,14.4],[9.41,14.13],[9.32,13.87],[9.24,13.6],[9.16,13.33],[9.09,13.06],[9.03,12.79],[8.96,12.51],[8.91,12.24],[8.86,11.96],[8.81,11.69],[8.78,11.41],[8.75,11.13],[9.01,11.08],[9.26,11.18],[9.52,11.3],[9.77,11.43],[10.01,11.58],[10.24,11.73],[10.46,11.9],[10.67,12.09],[10.87,12.28],[11.07,12.49],[11.24,12.7],[11.41,12.93],[11.57,13.16],[11.71,13.4],[11.84,13.65],[11.96,13.9],[12.07,14.16],[12.17,14.42],[12.26,14.68],[12.34,14.95]],[[12.58,21.09],[12.8,21.25],[13.03,21.42],[13.26,21.58],[13.49,21.73],[13.73,21.89],[13.96,22.04],[13.73,22.2],[13.46,22.26],[13.18,22.31],[12.9,22.34],[12.63,22.37],[12.35,22.39],[12.07,22.39],[11.79,22.39],[11.51,22.38],[11.62,22.12],[11.82,21.93],[12.02,21.73],[12.21,21.52],[12.39,21.31],[12.57,21.1]],[[13.93,14.65],[13.85,14.39],[13.77,14.12],[13.68,13.85],[13.58,13.59],[13.47,13.33],[13.35,13.08],[13.23,12.83],[13.1,12.58],[12.95,12.34],[12.8,12.11],[12.64,11.88],[12.47,11.66],[12.29,11.44],[12.1,11.23],[11.9,11.04],[11.7,10.85],[11.48,10.66],[11.26,10.49],[11.03,10.33],[10.8,10.18],[10.56,10.04],[10.31,9.9],[10.06,9.78],[9.8,9.67],[9.54,9.56],[9.28,9.47],[9.01,9.39],[8.74,9.31],[8.76,9.04],[8.79,8.76],[8.84,8.49],[8.9,8.21],[8.97,7.94],[9.04,7.67],[9.12,7.4],[9.2,7.14],[9.29,6.87],[9.39,6.61],[9.5,6.35],[9.61,6.09],[9.72,5.84],[9.85,5.59],[9.98,5.34],[10.12,5.1],[10.26,4.86],[10.4,4.62],[10.55,4.38],[10.71,4.15],[10.87,3.92],[11.04,3.7],[11.22,3.48],[11.39,3.27],[11.58,3.06],[11.77,2.85],[11.96,2.65],[12.16,2.45],[12.37,2.26],[12.55,2.46],[12.73,2.67],[12.91,2.89],[13.09,3.1],[13.27,3.31],[13.45,3.53],[13.63,3.74],[13.81,3.96],[13.99,4.17],[14.17,4.39],[14.35,4.6],[14.53,4.82],[14.71,5.03],[14.89,5.25],[15.07,5.46],[15.24,5.68],[15.42,5.89],[15.6,6.11],[15.78,6.33],[15.96,6.54],[16.13,6.76],[16.31,6.98],[16.49,7.19],[16.67,7.41],[16.84,7.63],[17.02,7.85],[17.19,8.06],[17.37,8.28],[17.54,8.5],[17.71,8.72],[17.88,8.95],[18.05,9.17],[18.21,9.4],[18.37,9.63],[18.53,9.86],[18.68,10.1],[18.82,10.34],[18.95,10.59],[19.08,10.83],[19.21,11.09],[19.32,11.34],[19.43,11.6],[19.53,11.86],[19.62,12.13],[19.7,12.39],[19.77,12.67],[19.83,12.94],[19.88,13.21],[19.92,13.49],[19.96,13.77],[19.98,14.05],[19.99,14.33],[19.98,14.61],[19.97,14.89],[19.95,15.17],[19.92,15.44],[19.88,15.72],[19.83,16],[19.77,16.27],[19.7,16.54],[19.62,16.81],[19.53,17.08],[19.43,17.34],[19.32,17.6],[19.21,17.85],[19.08,18.1],[18.95,18.35],[18.81,18.59],[18.65,18.82],[18.5,19.05],[18.33,19.28],[18.15,19.5],[17.97,19.71],[17.78,19.92],[17.58,20.11],[17.38,20.31],[17.17,20.49],[16.95,20.67],[16.73,20.84],[16.5,21],[16.27,21.16],[16.03,21.3],[15.78,21.22],[15.53,21.09],[15.29,20.95],[15.05,20.81],[14.81,20.67],[14.57,20.52],[14.34,20.37],[14.1,20.21],[13.88,20.05],[13.65,19.88],[13.46,19.7],[13.58,19.45],[13.69,19.19],[13.79,18.93],[13.88,18.67],[13.96,18.4],[14.02,18.13],[14.08,17.85],[14.13,17.58],[14.16,17.3],[14.18,17.02],[14.19,16.74],[14.19,16.46],[14.18,16.18],[14.16,15.9],[14.12,15.62],[14.08,15.35],[14.03,15.07],[13.96,14.8]],[[11.35,20.05],[11.18,20.27],[10.99,20.48],[10.8,20.68],[10.6,20.88],[10.39,21.07],[10.18,21.25],[9.96,21.43],[9.74,21.59],[9.51,21.75],[9.27,21.9],[9.01,21.81],[8.75,21.7],[8.5,21.58],[8.25,21.46],[8,21.32],[7.76,21.18],[7.53,21.02],[7.3,20.86],[7.08,20.69],[6.86,20.52],[6.65,20.33],[6.44,20.14],[6.25,19.94],[6.06,19.74],[5.87,19.53],[5.7,19.31],[5.53,19.09],[5.37,18.86],[5.22,18.62],[5.07,18.38],[4.94,18.13],[4.81,17.89],[4.69,17.63],[4.58,17.37],[4.48,17.11],[4.39,16.85],[4.31,16.58],[4.24,16.31],[4.18,16.03],[4.13,15.76],[4.09,15.48],[4.05,15.2],[4.03,14.93],[4.02,14.65],[4.02,14.37],[4.02,14.09],[4.04,13.81],[4.06,13.53],[4.1,13.25],[4.14,12.97],[4.2,12.7],[4.26,12.43],[4.34,12.16],[4.42,11.89],[4.51,11.63],[4.62,11.36],[4.73,11.11],[4.85,10.86],[5.06,10.71],[5.33,10.67],[5.61,10.63],[5.89,10.62],[6.17,10.61],[6.45,10.62],[6.73,10.64],[7.01,10.67],[7.11,10.91],[7.14,11.19],[7.16,11.47],[7.2,11.74],[7.24,12.02],[7.28,12.3],[7.34,12.57],[7.39,12.85],[7.45,13.12],[7.52,13.39],[7.59,13.66],[7.66,13.93],[7.74,14.2],[7.83,14.47],[7.92,14.74],[8.01,15],[8.1,15.26],[8.2,15.53],[8.31,15.78],[8.42,16.04],[8.53,16.3],[8.66,16.55],[8.79,16.79],[8.93,17.04],[9.07,17.28],[9.22,17.52],[9.37,17.75],[9.53,17.98],[9.69,18.21],[9.86,18.43],[10.04,18.65],[10.22,18.87],[10.4,19.08],[10.59,19.29],[10.78,19.49],[10.98,19.69],[11.18,19.89]]];
// the holes that are parts of their own, and what each part is called in the read-out
const PLUGS = [3, 4], NAMES = { base: "flame", 0: "flame", 3: "flame", 4: "flame" };
// the order the parts answer in, when it is not by distance from the pointer
const ORDER = (p) => (p.k === 4 ? 1 : p.k === 3 ? 2 : 0);
/** Each part's pose for its spring's value v (times the slider), at t seconds, since seconds after the pointer came (-1 once it has gone). */
function POSE(p, v, t, since) {
  const base = [0, Math.min(...p.loops[0].map((q) => q[1]))];
  if (p.k === 3 || p.k === 4) { const f = Math.sin(t * (p.k === 3 ? 11 : 13) + p.k), g = Math.sin(t * 7 + p.k * 2); p.pose.pivot = [p.c[0], base[1]]; p.pose.sy = 1 + 0.1 * v + 0.08 * v * f; p.pose.sx = 1 - 0.04 * v * f; p.pose.rot = 0.08 * v * g; p.pose.dz = 12 * v; }
  else { const f = Math.sin(t * 9) * 0.6 + Math.sin(t * 17) * 0.4; p.pose.pivot = base; p.pose.sy = 1 + 0.04 * v + 0.035 * v * f; p.pose.sx = 1 - 0.015 * v * f; p.pose.rot = 0.03 * v * Math.sin(t * 5); p.pose.dz = 3 * v; }
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
  // the embers: short sparks rising off the tip, each on its own cycle, while the fire burns
  const embers = mk("path", { class: "nf" }, svg);
  function draw() {
    const r = ps[0].sp.x * amt, ed = r < 0.05 ? "" : Array.from({ length: 6 }, (_, i) => { const ph = ((now / 1100 + i / 6) % 1), x = CX + K * (-0.28 + 0.11 * i + 0.06 * Math.sin(now / 240 + i * 2)), y = CY - K * (0.8 + 0.45 * ph), l = 5 * r * (1 - ph); return l < 0.6 ? "" : `M${x.toFixed(2)} ${y.toFixed(2)}L${(x + 1).toFixed(2)} ${(y - l).toFixed(2)}`; }).join("");
    if (embers.getAttribute("d") !== ed) embers.setAttribute("d", ed);
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
  name: "firebase",
  means: "Firebase's flame flickers as the pointer nears, its tongues dancing and embers rising off its tip; leave and the fire dies down.",
  rules: [1, 2, 7, 10],
  range: [0.6, 1, 1.4],
  mount,
});
