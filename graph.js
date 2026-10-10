/**
 * Graph: seven round nodes laid out flat, joined by edges that cross and loop, each node's name in dots on its top
 * (one to seven). Point at a node and a breadth-first search starts from it: the node lifts, then its neighbours all
 * at once, then theirs, one hop at a time, a wave spreading through the edges, each settling lower the farther it is, so the
 * layers stay to be read; the start takes the bright edge.
 * Leave and they settle. The read-out names the start and how many hops the farthest node is; the slider is the time
 * per hop, in ms.
 *
 * Nodes are short cylinders, a silhouette and one crease, painted back to front; the edges are drawn under them,
 * between the tops of the nodes they join. The hit test reads the pointer on the nodes' fixed plane against each
 * node's resting place.
 */
const { Cam, circ, clamp, facing, fit, flatDot, mk, open, place, prism, proj, tween, tset, tval, tdone, unproj, disposer, pointer, put, register, solid } = HL;

const R = 7, H = 5, LIFT = 15;
const SPOTS = [[0, 0], [30, -16], [-8, 30], [32, 22], [64, 4], [18, 54], [60, 44]];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 6], [4, 6], [2, 5], [5, 6]];
const cx = SPOTS.reduce((s, p) => s + p[0], 0) / SPOTS.length, cy = SPOTS.reduce((s, p) => s + p[1], 0) / SPOTS.length;
const NODES = SPOTS.map(([x, y], i) => ({ i, x: x - cx, y: y - cy }));
/** Hops from node s to every node, breadth first. */
function hops(s) {
  const d = NODES.map(() => -1), q = [s]; d[s] = 0;
  while (q.length) { const a = q.shift(); for (const [u, v] of EDGES) for (const [x, y] of [[u, v], [v, u]]) if (x === a && d[y] < 0) { d[y] = d[a] + 1; q.push(y); } }
  return d;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y), [x0, x1, y0, y1] = [Math.min(...xs) - 9, Math.max(...xs) + 9, Math.min(...ys) - 9, Math.max(...ys) + 9];
  const C = Cam(45, 0.5, 3.1);
  fit(C, [[x0, y0, 0], [x1, y1, 0], [x1, y0, 0], [x0, y1, 0], [0, 0, H + LIFT]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  const edges = mk("path", { class: "nf" }, g);
  const ring = circ(R, 40), inner = circ(R - 1.2, 40), at = (r, n) => r.map((q) => ({ ...q, u: q.u + n.x, v: q.v + n.y }));
  // painted back to front
  const nodes = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((n) => {
    const el = solid(g), dots = Array.from({ length: n.i + 1 }, () => flatDot(el.g, C, 0.75, "dot m"));
    return { ...n, el, dots, tw: tween(0), drawn: NaN };
  });
  const byI = Object.fromEntries(nodes.map((n) => [n.i, n]));
  const dotAt = (n, k) => (n.i === 0 ? [n.x, n.y] : [n.x + 3 * Math.cos((k / (n.i + 1)) * 2 * Math.PI), n.y + 3 * Math.sin((k / (n.i + 1)) * 2 * Math.PI)]);

  function draw(now) {
    let moving = false;
    const z = (n) => tval(n.tw, now) * LIFT;
    for (const n of nodes) {
      if (!tdone(n.tw, now)) moving = true;
      const t = tval(n.tw, now);
      if (t === n.drawn) continue;
      n.drawn = t;
      put(n.el, prism(P, front, at(ring, n), at(inner, n), z(n), z(n) + H));
      n.dots.forEach((d, k) => { const [x, y] = dotAt(n, k); place(d, P(x, y, z(n) + H)); });
    }
    edges.setAttribute("d", EDGES.map(([u, v]) => { const a = byI[u], b = byI[v]; return open([P(a.x, a.y, z(a) + H), P(b.x, b.y, z(b) + H)]); }).join(""));
    return moving;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  let start = -1, lit = null;
  function point(q) {
    let s = -1;
    if (q) { const w = unproj(C, q[0], q[1], H), near = nodes.reduce((a, n) => (Math.hypot(n.x - w[0], n.y - w[1]) < Math.hypot(a.x - w[0], a.y - w[1]) ? n : a)); if (Math.hypot(near.x - w[0], near.y - w[1]) < R + 6) s = near.i; }
    if (s !== start) {
      start = s;
      // the search: the start lifts, then every node one hop away, then two, a hop per step, each a step lower than the last
      const now = performance.now(), d = s < 0 ? null : hops(s);
      const far = d ? Math.max(...d) : 0;
      for (const n of nodes) tset(n.tw, d ? 1 - d[n.i] / (far + 1) : 0, now, d ? d[n.i] * step : 0);
      const first = s < 0 ? null : byI[s];
      if (first !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = first; if (first) first.el.sil.classList.add("hi"); }
      read.textContent = s < 0 ? "rest" : `start ${s + 1} · ${Math.max(...d)} hops`;
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = clamp(v, 0, 600); }, destroy: bag.dispose };
}

hairline({
  name: "graph",
  means: "A graph: point at a node and a breadth-first search spreads from it, its neighbours lifting first, then theirs, a hop at a time.",
  rules: [1, 2, 5, 10],
  range: [120, 220, 360],
  mount,
});
