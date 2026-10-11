/**
 * Binary search: eleven blocks in a sorted row on a tray, each taller than the one before. Point at a block and the row
 * is searched for it, a step at a time: the middle block of what is left lifts as it is checked, and the half that
 * cannot hold the target sinks down flat; the next middle is checked in what remains, until the target is found and
 * rises clear of the row. Leave and every block stands back up. The block being checked takes the bright edge. The
 * read-out gives the step and, at the end, how many it took; the slider is the time per step, in ms.
 *
 * Each block is a rounded box, a silhouette and one crease, painted along the row from the back; each follows the
 * search on its own spring. The hit test reads the pointer against each block's resting place.
 */
const { Cam, clamp, facing, fit, mk, prism, proj, rings, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const N = 11, PITCH = 10, W = 7.4, LIFT = 12, FLAT = 0.18;
const H = Array.from({ length: N }, (_, i) => 7 + i * 2.6), xAt = (i) => i * PITCH;
const EASE = (u) => u * u * (3 - 2 * u);
/** The steps of a search for t: each step's middle, and the blocks it rules out. */
function plan(t) {
  const out = [];
  let lo = 0, hi = N - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, gone = [];
    if (mid === t) { out.push({ mid, gone }); break; }
    if (t > mid) { for (let i = lo; i <= mid; i++) gone.push(i); lo = mid + 1; } else { for (let i = mid; i <= hi; i++) gone.push(i); hi = mid - 1; }
    out.push({ mid, gone });
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 3.4), END = xAt(N - 1);
  fit(C, [[-8, -8, -3], [END + 8, 8, -3], [END + 8, -8, -3], [-8, 8, -3], [END, 0, H[N - 1] + LIFT], [0, 0, H[0] + LIFT]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tr, ti] = rings(-8, -8, END + 8, 8, 5, 1.6);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const blocks = H.map((h, i) => { const [r, n] = rings(xAt(i) - W / 2, -W / 2, xAt(i) + W / 2, W / 2, 1.8, 0.9); return { h, r, n, el: solid(g), z: spring(0), s: spring(1) }; });

  // the search: when it started, its steps, and for each block when it is checked and when it is ruled out
  let t0 = null, steps = [], target = -1, lit = null;
  function goals(now) {
    const e = t0 === null ? -1 : now - t0, k = t0 === null ? -1 : Math.floor(e / step);
    blocks.forEach((b, i) => {
      let z = 0, s = 1;
      steps.forEach((st, j) => {
        const u = (e - j * step) / step;
        if (st.mid === i && u >= 0) z = i === target ? LIFT : u < 0.8 ? LIFT * 0.6 * Math.sin(Math.PI * clamp(u / 0.8, 0, 1)) : 0;
        if (st.gone.includes(i) && u >= 0.55) s = FLAT;
      });
      b.z.t = t0 === null ? 0 : z; b.s.t = t0 === null ? 1 : s;
    });
    const at = t0 === null ? null : steps[Math.min(k, steps.length - 1)];
    const hot = at ? blocks[at.mid] : null;
    if (hot !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
    read.textContent = t0 === null ? "rest" : k < steps.length - 1 ? `find ${target + 1} · step ${k + 1}` : `found ${target + 1} · ${steps.length} step${steps.length > 1 ? "s" : ""}`;
    return t0 !== null && k < steps.length;
  }
  function draw() {
    blocks.forEach((b, i) => { const z = b.z.x, h = b.h * b.s.x; put(b.el, prism(P, front, b.r, b.n, z, z + h)); });
  }
  const B = register(stage, (dt, now) => {
    const running = goals(now);
    let moving = running;
    for (const b of blocks) { if (stepS(b.z, dt)) moving = true; if (stepS(b.s, dt)) moving = true; }
    draw();
    return moving;
  });
  bag.add(B.unregister);
  draw();

  // the hit test: the block whose resting place is nearest the pointer, near enough
  const rest = blocks.map((b, i) => P(xAt(i), 0, b.h / 2));
  function point(q) {
    let t = -1;
    if (q) { const k = rest.reduce((m, p, i) => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(rest[m][0] - q[0], rest[m][1] - q[1]) ? i : m), 0); if (Math.hypot(rest[k][0] - q[0], rest[k][1] - q[1]) < 40) t = k; }
    if (t !== target) {
      target = t;
      steps = t < 0 ? [] : plan(t);
      t0 = t < 0 || reducedMotion() ? (t < 0 ? null : performance.now() - steps.length * step) : performance.now();
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "binsearch",
  means: "Binary search: point at a block and the middle is checked, the wrong half sinks, step by step until it is found.",
  rules: [1, 2, 7, 10],
  range: [900, 650, 450],
  mount,
});
