/**
 * Call stack: the frames of a recursive call, fact(5) down to fact(1), stacked as flat plates on a tray, the deepest
 * call on top. Bring the pointer over it and the recursion plays: it unwinds first, the top frame lifting off and away
 * while a small bead, the value it returns, drops into the frame below; frame after frame, down to the first; then the
 * calls go in again, each frame dropping onto the one that called it, back up to the base case; and round again for as
 * long as the pointer stays. Leave and the stack builds back up. The frame on top takes the bright edge. The read-out
 * says which call or return is happening; the slider is the time per frame, in ms.
 *
 * Frames and bead are rounded solids, a silhouette and one crease, painted bottom up; each frame falls and lifts on its
 * own spring. The hit test is a fixed box round the stack at rest.
 */
const { Cam, circ, clamp, facing, fit, lerp, mk, place, prism, proj, rings, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const DEPTH = 5, FH = 5, GAP = 1.2, RUN = 2.6, PITCH = FH + GAP, AWAY = 26, FACT = [1, 1, 2, 6, 24, 120];
const slot = (k) => k * PITCH;
// one round, in steps: the four returns, a hold on the first frame, the four calls, a hold at the base case
const ROUND = 2 * (DEPTH - 1) + 2;
const EASE = (u) => u * u * (3 - 2 * u);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 5.4), TOP = slot(DEPTH - 1) + FH;
  fit(C, [[-17, -12, -3], [17, 12, -3], [17, -12, -3], [-17, 12, -3], [0, 0, TOP + AWAY * 0.7]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tr, ti] = rings(-17, -12, 17, 12, 4, 1.4);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  // frame k is the call fact(5 - k); each a plate with its rim inset, narrowing a little with depth, and its argument
  // in dots along its front face: five for fact(5), down to one for fact(1)
  const frames = Array.from({ length: DEPTH }, (_, k) => {
    const w = 14 - k * 0.9, d = 9 - k * 0.5, [r, n] = rings(-w, -d, w, d, 3, 1.3), el = solid(g);
    return { k, w, d, r, n, el, z: spring(slot(k)), dots: Array.from({ length: DEPTH - k }, () => mk("circle", { class: "dot m", r: 1.1 }, el.g)) };
  });
  const bead = solid(g), [br, bi] = [circ(3, 28), circ(1.9, 28)];

  let t0 = null, lit = null;
  /** Where each frame is meant to be, and the bead, s steps into a round. */
  function goals(now) {
    const s = t0 === null ? -1 : Math.max(0, now - t0) / step, k = Math.floor(s) % ROUND, u = s - Math.floor(s);
    let top = DEPTH - 1, beadAt = null;
    if (t0 === null) read.textContent = "rest";
    else if (k < DEPTH - 1) {
      // returning: frame DEPTH-1-k leaves, its value drops into the frame below
      const leaving = DEPTH - 1 - k;
      top = leaving - 1;
      frames.forEach((f) => { f.z.t = f.k < leaving ? slot(f.k) : f.k === leaving ? slot(f.k) + AWAY * EASE(u) : slot(f.k) + AWAY; });
      if (u > 0.2 && u < 0.9) beadAt = lerp(slot(leaving) + FH + 4, slot(leaving - 1) + FH, EASE((u - 0.2) / 0.7));
      read.textContent = `fact(${5 - leaving}) returns ${FACT[5 - leaving]}`;
    } else if (k === DEPTH - 1) {
      top = 0; frames.forEach((f) => { f.z.t = f.k === 0 ? slot(0) : slot(f.k) + AWAY; });
      read.textContent = `fact(5) = ${FACT[5]}`;
    } else if (k < 2 * DEPTH - 1) {
      // calling: frame k - DEPTH + 1 drops in onto its caller
      const coming = k - DEPTH + 1;
      top = coming;
      frames.forEach((f) => { f.z.t = f.k <= coming ? slot(f.k) : slot(f.k) + AWAY; });
      read.textContent = `fact(${6 - coming}) calls fact(${5 - coming})`;
    } else read.textContent = "base case fact(1)";
    if (t0 === null) frames.forEach((f) => { f.z.t = slot(f.k); });
    // the frame that is running lifts a little off the one under it
    else frames[top].z.t += RUN;
    return { top, beadAt };
  }
  function draw(beadAt) {
    for (const f of frames) {
      // a frame far enough up has gone; it comes back into sight as it drops
      const away = f.z.x > slot(f.k) + AWAY * 0.85;
      f.el.g.setAttribute("display", away ? "none" : "inline");
      if (!away) {
        put(f.el, prism(P, front, f.r, f.n, f.z.x, f.z.x + FH));
        f.dots.forEach((c, i) => place(c, P(-((f.dots.length - 1) * 2.6) / 2 + i * 2.6, f.d, f.z.x + FH / 2)));
      }
    }
    bead.g.setAttribute("display", beadAt === null ? "none" : "inline");
    if (beadAt !== null) { put(bead, prism(P, front, br, bi, beadAt, beadAt + 2.6)); g.append(bead.g); }
  }
  const B = register(stage, (dt, now) => {
    const { top, beadAt } = goals(now);
    let moving = t0 !== null;
    for (const f of frames) if (stepS(f.z, dt)) moving = true;
    draw(beadAt);
    const hot = frames[top].el;
    if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; hot.sil.classList.add("hi"); }
    return moving;
  });
  bag.add(B.unregister);
  draw(null);
  frames[DEPTH - 1].el.sil.classList.add("hi"); lit = frames[DEPTH - 1].el;

  const pts = [[-17, -12, 0], [17, 12, 0], [17, -12, 0], [-17, 12, 0], [0, 0, TOP + 10]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])) - 12, Math.max(...pts.map((p) => p[0])) + 12, Math.min(...pts.map((p) => p[1])) - 12, Math.max(...pts.map((p) => p[1])) + 12];
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
  name: "callstack",
  means: "A call stack: hover it and fact(5) unwinds, each frame returning its value to the one below, then the calls stack up again.",
  rules: [2, 5, 7, 10],
  range: [1000, 750, 500],
  mount,
});
