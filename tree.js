/**
 * Tree: a binary search tree of seven round nodes laid out flat, the root at the back and its children
 * spreading toward you, each node's value in dots on its top (one to seven), smaller values to the left. Point at a
 * node and the tree is searched for it: the nodes on the path from the root down to it lift, one level after
 * another, the way the search compares and steps left or right; the found node takes the bright edge. Leave and they
 * settle. The read-out names the value and how many steps it took; the slider is the time per step, in ms.
 *
 * Nodes are short cylinders, a silhouette and one crease, painted from the root forward; the branches are drawn
 * under them, between the tops of the nodes they join. The hit test reads the pointer on the nodes' fixed plane
 * against each node's resting place.
 */
const { Cam, circ, clamp, facing, fit, flatDot, mk, open, place, prism, proj, tween, tset, tval, tdone, unproj, disposer, pointer, put, register, solid } = HL;

const R = 7, H = 5, LIFT = 15, LEVEL = 28, S2 = Math.SQRT1_2;
// the tree in order: value, its place across (X) and its level; X runs left to right as you look at it
const NODES = [[4, 0, 0], [2, -26, 1], [6, 26, 1], [1, -39, 2], [3, -13, 2], [5, 13, 2], [7, 39, 2]].map(([v, X, l]) => ({ v, l, x: (X + l * LEVEL) * S2, y: (l * LEVEL - X) * S2 }));
const PARENT = { 2: 4, 6: 4, 1: 2, 3: 2, 5: 6, 7: 6 };
/** The values a search for v visits, from the root. */
function path(v) { const out = []; let at = 4; for (;;) { out.push(at); if (at === v) return out; const kids = NODES.filter((n) => PARENT[n.v] === at); at = (v < at ? kids.find((k) => k.v < at) : kids.find((k) => k.v > at)).v; } }

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y), [x0, x1, y0, y1] = [Math.min(...xs) - 22, Math.max(...xs) + 22, Math.min(...ys) - 22, Math.max(...ys) + 22];
  const C = Cam(45, 0.5, 3.3);
  fit(C, [[x0, y0, -3], [x1, y1, -3], [x1, y0, -3], [x0, y1, -3], [0, 0, H + LIFT]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  const branches = mk("path", { class: "nf" }, g);
  const ring = circ(R, 40), inner = circ(R - 1.2, 40), at = (r, n) => r.map((q) => ({ ...q, u: q.u + n.x, v: q.v + n.y }));
  // painted from the root forward
  const nodes = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((n) => {
    const el = solid(g), dots = Array.from({ length: n.v }, () => flatDot(el.g, C, 0.75, "dot m"));
    return { ...n, el, dots, tw: tween(0), drawn: NaN };
  });
  const byV = Object.fromEntries(nodes.map((n) => [n.v, n]));
  // a node's dots: one in the middle, or a ring of them
  const dotAt = (n, k) => (n.v === 1 ? [n.x, n.y] : [n.x + 3 * Math.cos((k / n.v) * 2 * Math.PI), n.y + 3 * Math.sin((k / n.v) * 2 * Math.PI)]);

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
    branches.setAttribute("d", nodes.filter((n) => PARENT[n.v]).map((n) => { const p = byV[PARENT[n.v]]; return open([P(p.x, p.y, z(p) + H), P(n.x, n.y, z(n) + H)]); }).join(""));
    return moving;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  let want = -1, lit = null;
  function point(q) {
    let v = -1;
    if (q) { const w = unproj(C, q[0], q[1], H), near = nodes.reduce((a, n) => (Math.hypot(n.x - w[0], n.y - w[1]) < Math.hypot(a.x - w[0], a.y - w[1]) ? n : a)); if (Math.hypot(near.x - w[0], near.y - w[1]) < R + 6) v = near.v; }
    if (v !== want) {
      want = v;
      // the search: each node on the path lifts in turn, one level per step; the rest settle
      const now = performance.now(), on = v < 0 ? [] : path(v);
      for (const n of nodes) { const k = on.indexOf(n.v); tset(n.tw, k >= 0 ? 1 : 0, now, k >= 0 ? k * step : 0); }
      const found = v < 0 ? null : byV[v];
      if (found !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = found; if (found) found.el.sil.classList.add("hi"); }
      read.textContent = v < 0 ? "rest" : `find ${v} · ${on.length} step${on.length > 1 ? "s" : ""}`;
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = clamp(v, 0, 600); }, destroy: bag.dispose };
}

hairline({
  name: "tree",
  means: "A binary search tree: point at a node and the search path from the root down to it lifts, one level at a time.",
  rules: [1, 2, 5, 10],
  range: [120, 220, 360],
  mount,
});
