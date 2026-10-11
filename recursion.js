/**
 * Recursion: the calls of fib(4), laid out as the tree they make, fib(4) at the top, each call branching into the two
 * it makes, fib(n - 1) and fib(n - 2), down to fib(1) and fib(0) at the leaves; each call's argument in dots on its
 * top. At rest the whole tree stands. Bring the pointer over it and the recursion runs, one step at a time, in the
 * order a computer makes the calls: the tree clears to its root, and each call drops in under the one that made it,
 * left branch first, all the way down; a call that has its answer returns it and dims, and its caller goes on to its
 * next branch, until fib(4) has its answer; then it holds and runs again, for as long as the pointer stays. Leave and
 * the whole tree stands. The call running now lifts and takes the bright edge; the calls waiting under it stand; the
 * finished ones are dim. The read-out says which call or return is happening; the slider is the time per step, in ms.
 *
 * Calls are short cylinders, a silhouette and one crease, painted back to front; each call is joined to its caller by
 * a line drawn under them, between their tops. The hit test is a fixed box round the tree at rest.
 */
const { Cam, circ, clamp, facing, fit, lerp, mk, open, place, prism, proj, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const R = 5, H = 4, LIFT = 4, LEVEL = 22, SPREAD = 15, S2 = Math.SQRT1_2;
const FIB = (n) => (n < 2 ? n : FIB(n - 1) + FIB(n - 2));
// the call tree, and the order the calls and returns happen in: depth first, left (n - 1) before right (n - 2)
const NODES = [], EVENTS = [];
let leaf = 0;
(function grow(n, depth, parent) {
  const node = { id: NODES.length, n, depth, parent };
  NODES.push(node); EVENTS.push({ call: node.id });
  if (n >= 2) { const a = grow(n - 1, depth + 1, node.id), b = grow(n - 2, depth + 1, node.id); node.X = (NODES[a].X + NODES[b].X) / 2; } else node.X = leaf++ * SPREAD;
  EVENTS.push({ ret: node.id });
  return node.id;
})(4, 0, -1);
const MID = ((leaf - 1) * SPREAD) / 2;
for (const n of NODES) { const X = n.X - MID; n.x = (X + n.depth * LEVEL) * S2; n.y = (n.depth * LEVEL - X) * S2; }
const ROUND = EVENTS.length + 3;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y);
  const C = Cam(45, 0.5, 4.4);
  fit(C, [[Math.min(...xs) - 8, Math.min(...ys) - 8, 0], [Math.max(...xs) + 8, Math.max(...ys) + 8, 0], [Math.max(...xs) + 8, Math.min(...ys) - 8, 0], [Math.min(...xs) - 8, Math.max(...ys) + 8, 0], [NODES[0].x, NODES[0].y, H + LIFT + 2]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const lines = mk("path", { class: "nf" }, g);
  const at = (r, n, k = 1) => r.map((q) => ({ ...q, u: q.u * k + n.x, v: q.v * k + n.y }));
  const calls = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((n) => {
    const el = solid(g);
    return { ...n, el, s: spring(1, { k: 170, c: 14 }), z: spring(0), dots: Array.from({ length: n.n }, () => mk("circle", { class: "dot m", r: 1 }, el.g)) };
  });
  const byId = Object.fromEntries(calls.map((c) => [c.id, c]));

  let t0 = null, lit = null;
  /** The state k steps into a round: which calls are in, which are done, and which is running. */
  function goals(now) {
    const k = t0 === null ? -1 : Math.floor(Math.max(0, now - t0) / step) % ROUND;
    const inTree = new Set(), done = new Set(), stack = [];
    if (k >= 0) for (let i = 0; i <= Math.min(k, EVENTS.length - 1); i++) { const e = EVENTS[i]; if ("call" in e) { inTree.add(e.call); stack.push(e.call); } else { done.add(e.ret); stack.pop(); } }
    const running = k < 0 || k >= EVENTS.length ? null : "call" in EVENTS[k] ? EVENTS[k].call : stack[stack.length - 1] ?? null;
    for (const c of calls) {
      c.s.t = t0 === null || k >= EVENTS.length ? 1 : inTree.has(c.id) ? 1 : 0;
      c.z.t = c.id === running ? LIFT : 0;
      c.el.sil.classList.toggle("lo", t0 !== null && k < EVENTS.length && done.has(c.id));
    }
    if (t0 === null) read.textContent = "rest";
    else if (k >= EVENTS.length) read.textContent = `fib(4) = ${FIB(4)}`;
    else { const e = EVENTS[k]; if ("call" in e) { const n = NODES[e.call]; read.textContent = n.parent < 0 ? "call fib(4)" : `fib(${NODES[n.parent].n}) calls fib(${n.n})`; } else { const n = NODES[e.ret]; read.textContent = `fib(${n.n}) returns ${FIB(n.n)}`; } }
    return running === null ? null : byId[running];
  }
  function draw() {
    for (const c of calls) {
      const s = Math.max(0, c.s.x), z = c.z.x;
      c.el.g.setAttribute("display", s < 0.04 ? "none" : "inline");
      if (s < 0.04) continue;
      put(c.el, prism(P, front, at(circ(R, 40), c, Math.min(1.15, s)), at(circ(R - 1.2, 40), c, Math.min(1.15, s)), z, z + H * s));
      c.dots.forEach((d, i) => { const a = (i / c.n) * 2 * Math.PI, r = c.n === 1 ? 0 : 2.4; place(d, P(c.x + r * Math.cos(a), c.y + r * Math.sin(a), z + H * s)); });
    }
    lines.setAttribute("d", calls.filter((c) => c.parent >= 0).map((c) => {
      const p = byId[c.parent], u = clamp(c.s.x, 0, 1);
      if (u < 0.04 || p.s.x < 0.04) return "";
      const a = P(p.x, p.y, p.z.x + H), b = P(c.x, c.y, c.z.x + H * u);
      return open([a, [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]]);
    }).join(""));
  }
  const B = register(stage, (dt, now) => {
    const hot = goals(now);
    if ((hot && hot.el) !== (lit && lit.el)) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
    let moving = t0 !== null;
    for (const c of calls) { if (stepS(c.s, dt)) moving = true; if (stepS(c.z, dt)) moving = true; }
    draw();
    return moving;
  });
  bag.add(B.unregister);
  draw();

  const pts = [[Math.min(...xs) - 8, Math.min(...ys) - 8, 0], [Math.max(...xs) + 8, Math.max(...ys) + 8, 0], [Math.max(...xs) + 8, Math.min(...ys) - 8, 0], [Math.min(...xs) - 8, Math.max(...ys) + 8, 0]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])) - 10, Math.max(...pts.map((p) => p[1]))];
  function point(q) {
    const on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3] && !reducedMotion();
    if (on && t0 === null) t0 = performance.now();
    if (!on) t0 = null;
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = clamp(v, 200, 3000); }, destroy: bag.dispose };
}

hairline({
  name: "recursion",
  means: "Recursion: hover it and fib(4) branches into its calls, depth first; each finished call returns its answer and dims.",
  rules: [2, 5, 7, 10],
  range: [900, 650, 420],
  mount,
});
