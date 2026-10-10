/**
 * Heap: a binary min-heap of six round nodes laid out flat like a tree, the root at the back, each node's value in
 * dots on its top, every parent smaller than its children. One place is open, the next leaf. Bring the pointer over
 * it and a new, smallest value, one dot, is inserted: it drops into the open leaf, then sifts up, swapping places with
 * its parent each step, the two arcing past each other, until it sits at the root. Leave and it sifts back down and
 * lifts out. The new node takes the bright edge. The read-out says where it is; the slider is the time per step, in ms.
 *
 * Nodes are short cylinders, a silhouette and one crease, painted back to front; the branches are drawn between the
 * places, under the nodes. The hit test is a fixed box round the tree's resting outline.
 */
const { Cam, circ, clamp, facing, fit, flatDot, lerp, mk, open, place, prism, proj, reducedMotion, disposer, pointer, put, register, solid } = HL;

const R = 7, H = 5, LEVEL = 28, HOP = 10, DROP = 30, S2 = Math.SQRT1_2;
// the places, in heap order: place i's children are 2i + 1 and 2i + 2
const SLOTS = [[0, 0], [-26, 1], [26, 1], [-39, 2], [-13, 2], [13, 2], [39, 2]].map(([X, l]) => ({ x: (X + l * LEVEL) * S2, y: (l * LEVEL - X) * S2 }));
// where each value sits after each step: before the insert, in the leaf, after one swap, at the root
const STATES = [[2, 4, 3, 5, 6, 7, 0], [2, 4, 3, 5, 6, 7, 1], [2, 4, 1, 5, 6, 7, 3], [1, 4, 2, 5, 6, 7, 3]];
const SAY = ["rest", "insert 1 · at the leaf", "1 < 3 · swap up", "1 < 2 · swap up · root"];
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const xs = SLOTS.map((n) => n.x), ys = SLOTS.map((n) => n.y), [x0, x1, y0, y1] = [Math.min(...xs) - 22, Math.max(...xs) + 22, Math.min(...ys) - 22, Math.max(...ys) + 22];
  const C = Cam(45, 0.5, 3.3);
  fit(C, [[x0, y0, 0], [x1, y1, 0], [x1, y0, 0], [x0, y1, 0], [SLOTS[6].x, SLOTS[6].y, DROP + H], [0, 0, H + HOP]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  const branches = mk("path", { class: "nf", d: SLOTS.slice(1).map((s, i) => { const p = SLOTS[i >> 1]; return open([P(p.x, p.y, H), P(s.x, s.y, H)]); }).join("") }, g);
  const ring = circ(R, 40), inner = circ(R - 1.2, 40), at = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  // the open place, the next leaf
  mk("path", { class: "nf dash", d: open(at(ring, SLOTS[6].x, SLOTS[6].y).concat([at(ring, SLOTS[6].x, SLOTS[6].y)[0]]).map((q) => P(q.u, q.v, 0))) }, g);
  const nodesG = mk("g", {}, g);
  const nodes = [1, 2, 3, 4, 5, 6, 7].map((v) => {
    const el = solid(nodesG), dots = Array.from({ length: v }, () => flatDot(el.g, C, 0.75, "dot m"));
    return { v, el, dots };
  });
  nodes[0].el.sil.classList.add("hi");
  const dotAt = (v, k, x, y) => (v === 1 ? [x, y] : [x + 3 * Math.cos((k / v) * 2 * Math.PI), y + 3 * Math.sin((k / v) * 2 * Math.PI)]);

  /** Where value v stands at p, a step count from 0 to 3: between the places of two states, hopping when it moves. */
  function where(v, p) {
    const k = Math.min(Math.floor(p), 2), u = EASE(clamp(p - k, 0, 1));
    const a = STATES[k].indexOf(v), b = STATES[k + 1].indexOf(v);
    if (a < 0) return [SLOTS[6].x, SLOTS[6].y, (1 - u) * DROP, u > 0]; // the new value drops into the leaf
    if (a === b) return [SLOTS[a].x, SLOTS[a].y, 0, true];
    // the new value hops over, its parent slides under
    const up = v === 1 ? 1 : -0.2;
    return [lerp(SLOTS[a].x, SLOTS[b].x, u), lerp(SLOTS[a].y, SLOTS[b].y, u), up * HOP * Math.sin(Math.PI * u), true];
  }
  // p moves toward its target at one step per `step` ms, on an even clock
  let p = 0, goal = 0, last = performance.now();
  function draw(now) {
    const dt = now - last; last = now;
    p = goal > p ? Math.min(goal, p + dt / step) : Math.max(goal, p - dt / step);
    const spots = nodes.map((n) => ({ n, w: where(n.v, p) }));
    for (const { n, w: [x, y, z, shown] } of spots) {
      n.el.g.setAttribute("display", shown ? "inline" : "none");
      put(n.el, prism(P, front, at(ring, x, y), at(inner, x, y), z, z + H));
      n.dots.forEach((d, k) => { const [u, v] = dotAt(n.v, k, x, y); place(d, P(u, v, z + H)); });
    }
    // painted back to front, the higher of two close nodes last
    const order = spots.slice().sort((a, b) => a.w[0] + a.w[1] + a.w[2] * 0.6 - (b.w[0] + b.w[1] + b.w[2] * 0.6));
    if (order.some((s, k) => nodesG.children[k] !== s.n.el.g)) order.forEach((s) => nodesG.append(s.n.el.g));
    read.textContent = SAY[Math.round(p)];
    return p !== goal;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the hit test: a fixed box round the tree at rest
  const corners = [[x0, y0, 0], [x1, y1, 0], [x1, y0, 0], [x0, y1, 0]].map((q) => P(...q));
  const box = [Math.min(...corners.map((c) => c[0])), Math.max(...corners.map((c) => c[0])), Math.min(...corners.map((c) => c[1])) - 20, Math.max(...corners.map((c) => c[1]))];
  function point(q) {
    const on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3];
    goal = on ? 3 : 0;
    if (reducedMotion()) p = goal;
    last = performance.now();
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "heap",
  means: "A min-heap: a new smallest value drops into the next leaf and sifts up, swapping with its parent, until it is the root.",
  rules: [2, 5, 7, 10],
  range: [450, 650, 900],
  mount,
});
