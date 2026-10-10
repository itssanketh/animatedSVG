/**
 * Queue: five numbered blocks waiting in a line on a long tray, the front of the line at the far end, each block's
 * number in dots on its top. Bring the pointer over it and the queue is served, one block at a time, round and
 * round: the front block lifts out of the line, travels back along the side of the tray in a slow arc and sets down
 * at the back, while the others each step up one place; then the new front block goes, and so on, for as long as the
 * pointer stays. First in, first out: the order never changes, it only turns. The block being served takes the bright
 * edge. The read-out says who was served and who is at the front; the slider is the time each turn takes, in ms.
 *
 * Each block is a rounded box, a silhouette and one crease, painted back to front along the tray. The hit test is a
 * fixed box round the tray's resting outline.
 */
const { Cam, clamp, facing, fit, flatDot, lerp, place, prism, proj, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const N = 5, PITCH = 18, B = 13, H = 10, TRAY = (N - 1) * PITCH, SIDE = -22, ARC = 8, GAP = 300;
const slot = (i) => i * PITCH;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let turn = value;
  const C = Cam(45, 0.5, 2.6);
  fit(C, [[-14, SIDE - 10, -3], [TRAY + 14, 12, -3], [TRAY + 14, SIDE - 10, -3], [-14, 12, -3], [TRAY / 2, SIDE, ARC + H]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  const [tr, ti] = rings(-14, -12, TRAY + 14, 12, 6, 1.8);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const blocksG = mk("g", {}, g), [ring, inner] = rings(-B / 2, -B / 2, B / 2, B / 2, 2.6, 1);
  const shift = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  // the blocks, in queue order: q[0] is at the front
  let q = Array.from({ length: N }, (_, i) => {
    const el = solid(blocksG), dots = Array.from({ length: i + 1 }, () => flatDot(el.g, C, 0.9, "dot m"));
    return { id: i + 1, el, dots };
  });
  // one turn: t runs 0 to 1; the front block goes round and back, the rest step up one place
  // a turn runs on its own even clock, so the arc keeps one slow pace; between turns t rests at 0
  let t0 = 0, on = false, served = null, lit = null;
  const tAt = (now) => (served ? clamp((now - t0) / turn, 0, 1) : 0);

  /** Where block k of the queue stands at t through a turn: the front one on its arc, the others stepping up. */
  function pos(k, t) {
    if (k > 0) return [lerp(slot(k), slot(k - 1), clamp((t - 0.15) / 0.6, 0, 1) ** 0.8), 0, 0];
    // out to the side and up, back along the tray, then in and down at the back
    const a = clamp(t / 0.2, 0, 1), b = clamp((t - 0.2) / 0.6, 0, 1), c = clamp((t - 0.8) / 0.2, 0, 1);
    const ease = (u) => u * u * (3 - 2 * u);
    return [lerp(slot(0), slot(N - 1), ease(b)), SIDE * (ease(a) - ease(c)), ARC * (ease(a) - ease(c)) + Math.sin(Math.PI * b) * 4];
  }
  function draw(now) {
    const t = tAt(now), spots = q.map((b, k) => ({ b, p: pos(k, t) }));
    for (const { b, p: [x, y, z] } of spots) {
      put(b.el, prism(P, front, shift(ring, x, y), shift(inner, x, y), z, z + H));
      b.dots.forEach((d, k) => place(d, P(x - ((b.dots.length - 1) * 2.4) / 2 + k * 2.4, y, z + H)));
    }
    // painted back to front: the far end and the far side first, the lifted block over what it passes
    const order = spots.slice().sort((a, b) => a.p[0] + a.p[1] + a.p[2] * 0.6 - (b.p[0] + b.p[1] + b.p[2] * 0.6));
    if (order.some((s, k) => blocksG.children[k] !== s.b.el.g)) order.forEach((s) => blocksG.append(s.b.el.g));
    const hot = served;
    if (hot !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
  }
  draw(performance.now());

  const Bk = register(stage, () => {
    const now = performance.now();
    if (served && tAt(now) >= 1) {
      // the turn is over: the served block is now at the back, and everyone stands in their new place
      q = [...q.slice(1), q[0]]; served = null;
    }
    if (on && !served && !reducedMotion()) {
      // the next turn, after a short pause
      served = q[0]; t0 = now + GAP;
      read.textContent = `served ${served.id} · front ${q[1].id}`;
    }
    draw(now);
    return on || !!served;
  });
  bag.add(Bk.unregister);

  // the hit test: a fixed box round the tray's outline at rest
  const xs = [P(-14, -12, 0)[0], P(TRAY + 14, 12, 0)[0], P(TRAY + 14, -12, 0)[0], P(-14, 12, 0)[0]], ys = [P(-14, -12, 0)[1], P(TRAY + 14, 12, 0)[1], P(TRAY + 14, -12, 0)[1], P(-14, 12, 0)[1]];
  const box = [Math.min(...xs) - 20, Math.max(...xs) + 20, Math.min(...ys) - 60, Math.max(...ys) + 20];
  function point(p) {
    on = !!p && p[0] > box[0] && p[0] < box[1] && p[1] > box[2] && p[1] < box[3];
    if (!on) read.textContent = served ? read.textContent : "rest";
    else if (!served) read.textContent = `front ${q[0].id}`;
    Bk.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { turn = v; }, destroy: bag.dispose };
}

hairline({
  name: "queue",
  means: "A queue served round and round: the front block leaves, travels back along the side and rejoins at the back, as the rest step up.",
  rules: [2, 5, 7, 10],
  range: [1400, 1900, 2600],
  mount,
});
