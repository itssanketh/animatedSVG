/**
 * Stack: two base plates side by side, and five numbered blocks piled on the left one, each block's number in dots on
 * its top, 1 at the bottom. Hover the right plate and the left stack is moved onto it one block at a time: the top
 * block lifts straight off, crosses over and sets down on top of the right stack (pop, then push), then the next; the
 * pile comes out upside down, which is the whole of last in, first out. Hover the left plate and they move back the
 * same way. Nothing appears or disappears. The block moving, or the last one moved, takes the bright edge. The read-out
 * names the move; the slider is the time per move, in ms.
 *
 * Each block is a rounded box, a silhouette and one crease, painted back to front and bottom up. The hit test is a
 * fixed box round the two plates at rest, split between them.
 */
const { Cam, clamp, facing, fit, flatDot, lerp, prism, proj, place, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const N = 5, W = 20, H = 7, PITCH = 8.4, GAP = 40, CLEAR = N * PITCH + 8;
const X = [0, GAP];
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const C = Cam(45, 0.5, 3.0);
  fit(C, [[-15, -15, -3], [GAP + 15, 15, -3], [GAP + 15, -15, -3], [-15, 15, -3], [GAP / 2, 0, CLEAR + H]], 200, 164);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // the two plates, then the blocks
  const [pr, pi] = rings(-15, -15, 15, 15, 5, 1.6), shift = (r, x) => r.map((q) => ({ ...q, u: q.u + x }));
  for (const x of X) put(solid(g), prism(P, front, shift(pr, x), shift(pi, x), -3, 0));
  const blocksG = mk("g", {}, g), [ring, inner] = rings(-W / 2, -W / 2, W / 2, W / 2, 3, 1.1);
  const blocks = Array.from({ length: N }, (_, i) => {
    const el = solid(blocksG), dots = Array.from({ length: i + 1 }, () => flatDot(el.g, C, 0.9, "dot m"));
    return { id: i + 1, el, dots, at: [0, i * PITCH] };
  });
  const piles = [blocks.slice(), []]; // bottom first
  let want = 0, over = false, move = null, lit = null;

  /** Where a moving block stands, t through its move: straight up, across above both stacks, straight down. */
  function along(m, t) {
    const a = EASE(clamp(t / 0.3, 0, 1)), b = EASE(clamp((t - 0.3) / 0.4, 0, 1)), c = EASE(clamp((t - 0.7) / 0.3, 0, 1));
    return [lerp(X[m.from], X[m.to], b), lerp(lerp(m.z0, CLEAR, a), m.z1, c)];
  }
  function draw(now) {
    if (move && now - move.t0 >= per) { move.b.at = [X[move.to], move.z1]; move = null; }
    if (!move && over && piles[1 - want].length && !reducedMotion()) {
      // pop the top of the other stack, push it onto this one
      const from = 1 - want, b = piles[from].pop();
      move = { b, from, to: want, z0: piles[from].length * PITCH, z1: piles[want].length * PITCH, t0: now };
      piles[want].push(b);
      read.textContent = `pop ${b.id} · push ${b.id}`;
    }
    if (reducedMotion()) for (const s of [0, 1]) piles[s].forEach((b, k) => { b.at = [X[s], k * PITCH]; });
    if (move) move.b.at = along(move, clamp((now - move.t0) / per, 0, 1));
    for (const b of blocks) {
      const [x, z] = b.at;
      put(b.el, prism(P, front, shift(ring, x), shift(inner, x), z, z + H));
      b.dots.forEach((d, k) => place(d, P(x - ((b.dots.length - 1) * 2.4) / 2 + k * 2.4, 0, z + H)));
    }
    // painted back to front, bottom up
    const order = blocks.slice().sort((a, b) => a.at[0] - b.at[0] || a.at[1] - b.at[1]);
    // a block in the air goes over everything, until it comes down onto the stack at the back
    if (move && move.b.at[0] > GAP / 4) order.push(order.splice(order.indexOf(move.b), 1)[0]);
    if (order.some((b, k) => blocksG.children[k] !== b.el.g)) order.forEach((b) => blocksG.append(b.el.g));
    const hot = move ? move.b : piles[want].at(-1) || piles[1 - want].at(-1);
    if (hot !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; hot.el.sil.classList.add("hi"); }
    if (!move) read.textContent = over ? `${piles[0].length} · ${piles[1].length}` : "rest";
    return !!move;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the hit test: a fixed box round both plates and the full stacks at rest, split halfway between the plates
  const pts = [[-15, -15, 0], [GAP + 15, 15, 0], [GAP + 15, -15, 0], [-15, 15, 0], [0, 0, CLEAR], [GAP, 0, CLEAR]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])) - 16, Math.max(...pts.map((p) => p[0])) + 16, Math.min(...pts.map((p) => p[1])) - 16, Math.max(...pts.map((p) => p[1])) + 16];
  const mid = P(GAP / 2, 0, 0)[0];
  function point(q) {
    over = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3];
    if (over) want = q[0] < mid ? 0 : 1;
    B.wake();
  }

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "stack",
  means: "Two stacks: hover one and the other is moved onto it a block at a time, top first, so the pile comes out reversed.",
  rules: [1, 2, 5, 9],
  range: [500, 750, 1100],
  mount,
});
