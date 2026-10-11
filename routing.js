/**
 * Routing: a small network laid out as a mesh, eight switches and a router. The router stands at the back corner, a
 * box with two antennas; the switches are flat boxes with a row of ports along their fronts; cables join them. Point at a
 * switch and a packet is sent to it: the shortest route lights up as a dashed line over the cables, then an envelope
 * leaves the router and travels it, pausing at each switch on the way, which lifts as the envelope passes through, and
 * drops into the switch you chose; then the next one goes, for as long as the pointer stays. Leave and the network
 * settles. The switch pointed at takes the bright edge. The read-out names it and how many hops away it is; the
 * slider is the time per hop, in ms.
 *
 * Every box is a rounded box, a silhouette and one crease, painted back to front; the cables run between the tops of
 * the boxes they join, under them. The hit test reads the pointer on the ground against each box's resting place.
 */
const { Cam, clamp, facing, fit, lerp, mk, open, prism, proj, rings, seg, spring, stepS, unproj, reducedMotion, disposer, pointer, put, register, solid } = HL;

const S = 6, SH = 3.2, RH = 7, LIFT = 4, ARC = 10, PORTS = 4;
// a three by three mesh, a little uneven; the router at the back corner
const SPOTS = [[0, 0], [30, -4], [62, 2], [-2, 30], [32, 28], [60, 32], [4, 62], [30, 60], [62, 60]];
const LINKS = [[0, 1], [1, 2], [0, 3], [3, 6], [1, 4], [3, 4], [4, 5], [2, 5], [4, 7], [6, 7], [7, 8], [5, 8]];
const NODES = SPOTS.map(([x, y], i) => ({ i, x: x - 30, y: y - 30, h: i === 0 ? RH : SH }));
/** The shortest route from the router to switch t, breadth first. */
function route(t) {
  const prev = NODES.map(() => -1), seen = new Set([0]), q = [0];
  while (q.length) { const a = q.shift(); for (const [u, v] of LINKS) for (const [x, y] of [[u, v], [v, u]]) if (x === a && !seen.has(y)) { seen.add(y); prev[y] = a; q.push(y); } }
  const path = [t];
  while (path[0] !== 0) path.unshift(prev[path[0]]);
  return path;
}
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 3.1);
  fit(C, [[-40, -40, 0], [40, 40, 0], [40, -40, 0], [-40, 40, 0], [-30, -30, RH + 10], [0, 0, ARC + SH + 4]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const cables = mk("path", { class: "nf" }, g), planned = mk("path", { class: "nf dash" }, g);
  const box = (x, y, w, d) => rings(x - w, y - d, x + w, y + d, 1.8, 0.9);
  // painted back to front
  const nodes = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((n) => ({ ...n, el: solid(g), extra: mk("path", { class: "nf" }, g), z: spring(0) }));
  const byI = Object.fromEntries(nodes.map((n) => [n.i, n]));
  const env = solid(g), flap = mk("path", { class: "nf" }, g);

  let path = null, t0 = 0, lit = null;
  /** Where the envelope is, e hops into a trip; it rests a quarter of each hop at a switch, then crosses the cable. */
  function goals(now) {
    nodes.forEach((n) => { n.z.t = 0; });
    if (!path) return null;
    const hops = path.length - 1, e = (Math.max(0, now - t0) / step) % (hops + 1.2), j = Math.floor(e), f = e - j;
    if (j >= hops) { byI[path[hops]].z.t = LIFT * Math.max(0, 1 - (e - hops) * 3); return null; }
    const u = EASE(clamp((f - 0.25) / 0.75, 0, 1)), a = byI[path[j]], b = byI[path[j + 1]];
    if (f < 0.25) a.z.t = LIFT;
    if (u > 0.85) b.z.t = LIFT * (u - 0.85) / 0.15;
    return [lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.h + a.z.x, b.h + b.z.x, u) + ARC * Math.sin(Math.PI * u) + 1];
  }
  function draw(pk) {
    for (const n of nodes) {
      const z = n.z.x, [r, i] = n.i === 0 ? box(n.x, n.y, 6, 6) : box(n.x, n.y, S, S * 0.7);
      put(n.el, prism(P, front, r, i, z, z + n.h));
      // the router's two antennas; a switch's row of ports
      n.extra.setAttribute("d", n.i === 0
        ? [-2.5, 2.5].map((d) => seg(P(n.x + d, n.y - 3, z + n.h), P(n.x + d, n.y - 3, z + n.h + 7))).join("")
        : Array.from({ length: PORTS }, (_, k) => { const x = n.x - S + 2.4 + k * ((2 * S - 4.8) / (PORTS - 1)), y = n.y + S * 0.7; return open([P(x - 0.9, y, z + 0.8), P(x + 0.9, y, z + 0.8), P(x + 0.9, y, z + 2.3), P(x - 0.9, y, z + 2.3), P(x - 0.9, y, z + 0.8)]); }).join(""));
    }
    cables.setAttribute("d", LINKS.map(([u, v]) => { const a = byI[u], b = byI[v]; return open([P(a.x, a.y, a.z.x + a.h * 0.5), P(b.x, b.y, b.z.x + b.h * 0.5)]); }).join(""));
    planned.setAttribute("d", path ? open(path.map((i) => P(byI[i].x, byI[i].y, byI[i].z.x + byI[i].h + 1.5))) : "");
    env.g.setAttribute("display", pk ? "inline" : "none");
    flap.setAttribute("d", "");
    if (pk) {
      const [x, y, z] = pk, [r, i] = box(x, y, 4, 3);
      put(env, prism(P, front, r, i, z, z + 2));
      flap.setAttribute("d", open([P(x - 3.5, y - 2.5, z + 2), P(x, y + 0.6, z + 2), P(x + 3.5, y - 2.5, z + 2)]));
      g.append(env.g, flap);
    }
  }
  const B = register(stage, (dt, now) => {
    const pk = goals(now);
    let moving = !!path;
    for (const n of nodes) if (stepS(n.z, dt)) moving = true;
    draw(pk);
    return moving;
  });
  bag.add(B.unregister);
  draw(null);

  let target = -1;
  function point(q) {
    let t = -1;
    if (q) { const w = unproj(C, q[0], q[1], SH), near = nodes.reduce((a, n) => (Math.hypot(n.x - w[0], n.y - w[1]) < Math.hypot(a.x - w[0], a.y - w[1]) ? n : a)); if (Math.hypot(near.x - w[0], near.y - w[1]) < 11 && near.i !== 0) t = near.i; }
    if (t !== target) {
      target = t;
      path = t < 0 || reducedMotion() ? null : route(t);
      t0 = performance.now();
      const hot = t < 0 ? null : byI[t].el;
      if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; if (hot) hot.sil.classList.add("hi"); }
      const hops = t < 0 ? 0 : route(t).length - 1;
      read.textContent = t < 0 ? "rest" : `router → switch ${t} · ${hops} hop${hops > 1 ? "s" : ""}`;
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = clamp(v, 150, 2000); }, destroy: bag.dispose };
}

hairline({
  name: "routing",
  means: "Packet routing: point at a switch, the shortest route lights up, and an envelope travels it from the router, hop by hop.",
  rules: [1, 2, 7, 10],
  range: [900, 650, 420],
  mount,
});
