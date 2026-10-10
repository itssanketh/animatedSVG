/**
 * Red Hat: the hat, its crown and its brim as two thick plates facing you. Bring the pointer over it and the hat
 * is tipped: the crown lifts and tilts away from the pointer, the brim following a little, on the 700ms curve;
 * leave and it settles back down. The slider is how far it tilts, in degrees. A tribute: the mark belongs to Red
 * Hat.
 *
 * Each part is an extruded plate, the mark's own outline with its holes cut in it: the face turned away, the sides,
 * the face turned toward you, nearer parts painted later. The part under the pointer, tested against its outline at
 * rest, takes the bright edge. The pointer is read against the mark's middle, which never moves.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, tween, tset, tval, tdone, reducedMotion, disposer, pointer } = HL;

const K = 118, CX = 200, CY = 158, T = 8, DEEP = 0.16;
// the mark's outline, from the simple-icons drawing of it: closed loops in its own 24 square, y down
const MARK = [[[16.01,13.39],[16.33,13.38],[16.65,13.37],[16.97,13.34],[17.29,13.3],[17.6,13.25],[17.91,13.19],[18.22,13.1],[18.52,12.99],[18.81,12.86],[19.09,12.69],[19.33,12.49],[19.54,12.25],[19.71,11.97],[19.81,11.67],[19.86,11.35],[19.87,11.03],[19.82,10.72],[19.75,10.41],[19.68,10.09],[19.61,9.78],[19.53,9.47],[19.46,9.16],[19.39,8.85],[19.32,8.54],[19.25,8.22],[19.17,7.91],[19.1,7.6],[19.03,7.29],[18.96,6.98],[18.89,6.66],[18.81,6.36],[18.7,6.05],[18.55,5.77],[18.35,5.52],[18.11,5.31],[17.86,5.12],[17.59,4.95],[17.31,4.79],[17.02,4.64],[16.74,4.5],[16.45,4.36],[16.16,4.22],[15.86,4.1],[15.57,3.97],[15.27,3.85],[14.98,3.73],[14.68,3.62],[14.38,3.51],[14.08,3.4],[13.77,3.29],[13.47,3.2],[13.16,3.1],[12.85,3.02],[12.54,2.96],[12.22,2.92],[11.91,2.99],[11.64,3.16],[11.4,3.37],[11.16,3.58],[10.89,3.75],[10.59,3.85],[10.27,3.86],[9.96,3.8],[9.66,3.7],[9.37,3.57],[9.08,3.42],[8.78,3.3],[8.48,3.2],[8.16,3.16],[7.84,3.19],[7.54,3.3],[7.28,3.48],[7.06,3.71],[6.88,3.97],[6.72,4.25],[6.6,4.55],[6.49,4.85],[6.38,5.15],[6.27,5.45],[6.17,5.75],[6.06,6.05],[5.95,6.36],[5.85,6.66],[5.74,6.96],[5.63,7.26],[5.53,7.56],[5.43,7.87],[5.33,8.17],[5.31,8.49],[5.41,8.79],[5.58,9.06],[5.78,9.31],[5.99,9.55],[6.21,9.78],[6.45,9.99],[6.7,10.2],[6.95,10.4],[7.2,10.59],[7.46,10.77],[7.73,10.95],[8.0,11.12],[8.28,11.29],[8.55,11.44],[8.84,11.6],[9.12,11.74],[9.41,11.88],[9.7,12.02],[9.99,12.14],[10.29,12.27],[10.59,12.38],[10.89,12.49],[11.19,12.59],[11.5,12.69],[11.8,12.78],[12.11,12.87],[12.42,12.95],[12.73,13.02],[13.05,13.09],[13.36,13.14],[13.68,13.2],[13.99,13.24],[14.31,13.28],[14.63,13.32],[14.95,13.34],[15.27,13.36],[15.59,13.38],[15.91,13.38]],[[20.11,11.96],[20.18,12.28],[20.24,12.59],[20.3,12.9],[20.33,13.22],[20.3,13.54],[20.24,13.85],[20.12,14.15],[19.96,14.43],[19.76,14.68],[19.53,14.9],[19.27,15.09],[19.0,15.26],[18.72,15.41],[18.42,15.53],[18.12,15.64],[17.81,15.73],[17.5,15.8],[17.19,15.86],[16.87,15.9],[16.55,15.93],[16.23,15.96],[15.91,15.97],[15.59,15.97],[15.27,15.96],[14.95,15.95],[14.63,15.93],[14.31,15.9],[13.99,15.87],[13.68,15.83],[13.36,15.79],[13.04,15.73],[12.73,15.68],[12.42,15.61],[12.1,15.54],[11.79,15.47],[11.48,15.38],[11.18,15.3],[10.87,15.2],[10.57,15.1],[10.27,15.0],[9.96,14.88],[9.67,14.77],[9.37,14.64],[9.08,14.51],[8.79,14.38],[8.51,14.23],[8.22,14.08],[7.94,13.93],[7.67,13.77],[7.39,13.6],[7.13,13.42],[6.87,13.24],[6.61,13.04],[6.36,12.84],[6.12,12.63],[5.88,12.42],[5.66,12.19],[5.45,11.95],[5.25,11.7],[5.07,11.43],[4.92,11.15],[4.79,10.86],[4.71,10.55],[4.67,10.23],[4.7,9.91],[4.76,9.6],[4.73,9.32],[4.41,9.34],[4.09,9.36],[3.78,9.39],[3.46,9.43],[3.14,9.48],[2.83,9.54],[2.52,9.61],[2.21,9.69],[1.9,9.79],[1.61,9.91],[1.32,10.05],[1.04,10.21],[0.79,10.41],[0.56,10.63],[0.37,10.89],[0.21,11.17],[0.1,11.47],[0.03,11.78],[0.0,12.1],[0.01,12.42],[0.05,12.73],[0.13,13.04],[0.24,13.35],[0.37,13.64],[0.52,13.92],[0.69,14.19],[0.87,14.45],[1.07,14.7],[1.28,14.95],[1.5,15.18],[1.72,15.41],[1.95,15.63],[2.19,15.84],[2.43,16.05],[2.68,16.25],[2.94,16.45],[3.19,16.64],[3.45,16.82],[3.72,17.0],[3.98,17.18],[4.26,17.35],[4.53,17.52],[4.8,17.68],[5.08,17.84],[5.36,17.99],[5.65,18.14],[5.93,18.29],[6.22,18.43],[6.5,18.57],[6.79,18.71],[7.09,18.84],[7.38,18.97],[7.67,19.09],[7.97,19.21],[8.27,19.33],[8.57,19.44],[8.87,19.55],[9.17,19.66],[9.47,19.77],[9.78,19.86],[10.08,19.96],[10.39,20.05],[10.69,20.14],[11.0,20.23],[11.31,20.31],[11.62,20.39],[11.93,20.47],[12.24,20.54],[12.56,20.61],[12.87,20.67],[13.19,20.73],[13.5,20.78],[13.82,20.83],[14.13,20.88],[14.45,20.92],[14.77,20.96],[15.09,20.99],[15.4,21.02],[15.72,21.04],[16.04,21.06],[16.36,21.07],[16.68,21.08],[17.0,21.08],[17.32,21.07],[17.64,21.06],[17.96,21.04],[18.28,21.02],[18.6,20.99],[18.92,20.95],[19.23,20.9],[19.55,20.84],[19.86,20.78],[20.17,20.7],[20.48,20.61],[20.79,20.51],[21.08,20.4],[21.38,20.27],[21.66,20.13],[21.94,19.97],[22.21,19.8],[22.47,19.61],[22.71,19.4],[22.94,19.18],[23.15,18.94],[23.34,18.68],[23.51,18.41],[23.65,18.12],[23.77,17.82],[23.86,17.52],[23.93,17.2],[23.98,16.89],[24.0,16.57],[23.99,16.25],[23.95,15.93],[23.88,15.62],[23.78,15.32],[23.65,15.02],[23.5,14.74],[23.34,14.47],[23.15,14.21],[22.95,13.96],[22.74,13.72],[22.51,13.49],[22.27,13.28],[22.03,13.07],[21.77,12.88],[21.51,12.7],[21.24,12.53],[20.96,12.37],[20.68,12.21],[20.39,12.07]]];

const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
const area = (l) => Math.abs(l.reduce((s, p, i) => { const q = l[(i + 1) % l.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
/** The mark's parts: each an outline (u right, v up, -1..1) with the holes cut in it, its middle and its size. */
function parts() {
  const L = MARK.map((l) => l.map(([x, y]) => [(x - 12) / 12, (12 - y) / 12]));
  const depth = L.map((l, i) => L.filter((o, j) => j !== i && inPoly(l[0], o)).length), out = [];
  L.forEach((l, i) => { if (depth[i] % 2 === 0) out.push({ loops: [l], a: area(l) }); });
  L.forEach((l, i) => { if (depth[i] % 2) { const host = out.filter((p) => inPoly(l[0], p.loops[0])).sort((x, y) => x.a - y.a)[0]; if (host) host.loops.push(l); } });
  return out.map((p, i) => { const o = p.loops[0], n = o.length; return { ...p, i, c: [o.reduce((s, q) => s + q[0], 0) / n, o.reduce((s, q) => s + q[1], 0) / n], pose: { dx: 0, dy: 0, rot: 0, pivot: null, yaw: 0, ypu: 0, dz: 0 } }; });
}
/** A point on screen: (u, v), d deep, turned by yaw about the upright line u = ypu. The turn mostly narrows; how far it carries a
 * point toward you counts only a little (DEEP), so the mark stays level. The front leans down and left of the back. */
const S = (u, v, d, yaw, ypu) => { const x = (u - ypu) * K, z = d - T / 2, c = Math.cos(yaw), s = Math.sin(yaw), x2 = x * c - z * s + ypu * K, z2 = x * s * DEEP + z * c + T / 2; return [CX + x2 - z2 * 0.7, CY - v * K + z2 * 0.5]; };
/** A part as a plate: the face turned away, the sides, the face turned toward you. */
const plate = (g) => { const b = mk("g", {}, g); return { g: b, away: mk("path", { class: "sil" }, b), side: mk("path", { class: "fo" }, b), toward: mk("path", { class: "sil" }, b) }; };
/** Draws a part in its pose: moved (dx, dy), turned rot in the plane about its pivot, turned yaw upright, lifted dz toward you. */
function drawPart(p) {
  const { dx, dy, rot, pivot, yaw, ypu, dz } = p.pose, pv = pivot || p.c, c = Math.cos(rot), s = Math.sin(rot);
  const at = ([u, v]) => { const x = u - pv[0], y = v - pv[1]; return [pv[0] + x * c - y * s + dx, pv[1] + x * s + y * c + dy]; };
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
  const big = ps.slice().sort((x, y) => y.a - x.a), M = [0, 0]; // parts, largest first; the mark's middle
  // how near the pointer is to the mark's middle, which never moves: 1 at it, 0 well outside
  const near = (q) => (q ? clamp(1.25 - Math.hypot(q[0] - CX, q[1] - CY) / (K * 1.1), 0, 1) : 0);

  // tipping the hat: the crown lifts and tilts away from the side the pointer came from, the brim follows a little
  const tip = tween(0), crown = ps.slice().sort((x, y) => y.c[1] - x.c[1])[0], brim = ps.find((p) => p !== crown);
  let side = 1, on = false;
  function pose(dt, now) {
    const t = tval(tip, now);
    crown.pose.dy = t * 0.3; crown.pose.rot = -side * rad(amt) * t; crown.pose.pivot = [crown.c[0], crown.c[1] - 0.25];
    brim.pose.dy = t * 0.06; brim.pose.rot = -side * rad(amt * 0.35) * t;
    return !tdone(tip, now);
  }
  function point(q) {
    const inside = near(q) > 0;
    if (inside && !on) side = q[0] < CX ? -1 : 1;
    on = inside; tset(tip, on ? 1 : 0, performance.now(), 0);
    read.textContent = on ? "tip" : "rest";
  }
  let drawn = "";
  function draw() {
    const key = ps.map((p) => [p.pose.dx, p.pose.dy, p.pose.rot, p.pose.yaw, p.pose.dz].map((n) => n.toFixed(4)).join()).join("|");
    if (key === drawn) return; drawn = key;
    ps.forEach(drawPart);
    // nearer parts are painted later
    const order = ps.slice().sort((x, y) => x.pose.dz - y.pose.dz || x.i - y.i);
    if (order.some((p, k) => g.children[k] !== p.el.g)) order.forEach((p) => g.append(p.el.g));
  }
  draw();

  // each part lights while the pointer is over it, tested against its outline at rest; the topmost that holds it wins
  const hit = ps.map((p) => ({ p, ls: p.loops.map((l) => l.map(([u, v]) => S(u, v, T, 0, 0))) }));
  const under = (q) => { for (let k = hit.length - 1; k >= 0; k--) if (hit[k].ls.reduce((n, l) => n + (inPoly(q, l) ? 1 : 0), 0) % 2) return hit[k].p; return null; };
  let lit = null;
  const light = (q) => { const p = q ? under(q) : null; if (p !== lit) { lit = p; ps.forEach((x) => x.el.toward.classList.toggle("hi", x === p)); } };

  const B = register(stage, (dt) => { const m = pose(dt, performance.now()); draw(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, { move: (q) => { light(q); point(q); B.wake(); }, leave: () => { light(null); point(null); B.wake(); } }));
  bag.add(() => svg.replaceChildren());
  point(null);

  return { set: (v) => { amt = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "redhat",
  means: "Red Hat's hat: bring the pointer over it and the crown lifts and tilts, the brim following; leave and it settles back.",
  rules: [1, 5, 8, 10],
  range: [6, 12, 20],
  mount,
});
