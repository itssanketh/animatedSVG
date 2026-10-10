/**
 * Ceiling: a rate limit. Eight pillars stand in a row on a rail, one per
 * second of traffic, under a glass plate hung at the limit. A pillar's height
 * is the requests sent in its second; it stops flush against the plate, and
 * what it could not pass stands above the glass as a dashed ghost. The pointer
 * is a burst: the pillars near it surge, falling off with distance. The slider
 * is the limit, in requests a second.
 *
 * The pattern: a continuous field along one row. A spring per pillar on its
 * demand, the plate on a spring of its own, and a hit test on the pointer's
 * screen x against the pillars' rest centres, which never move.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const N = 8, CELL = 17, FOOT = 13.5, EXT = N * CELL, U = 7.5, B = 6, R = 2.4, DMAX = 12, PB = 4, PT = 2.5;
const BASE = [2.4, 3.6, 5.9, 7.2, 4.6, 2.8, 4.2, 3.2];

/** The share of the burst at u radii from the pointer: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.75);
  fit(C, [[-8, -12, -PB], [EXT + 8, 12, -PB], [-8, 12, -PB], [EXT + 8, -12, -PB], [EXT / 2, 0, DMAX * U]], 200, 166);
  const P = proj(C), front = facing(C);
  const lim = spring(value * U, { eps: 0.04 });
  let over = null;

  const g = mk("g", {}, svg);
  const [br, bi] = rings(-8, -12, EXT + 8, 12, 8, 2);
  put(solid(g), prism(P, front, br, bi, -PB, 0));
  const [pr, pi] = rings(-5.5, -2.5, -0.5, 2.5, 2.5, 0.8), [nr, ni] = rings(EXT + 0.5, -2.5, EXT + 5.5, 2.5, 2.5, 0.8);
  const farPost = solid(g);

  const cols = BASE.map((d, i) => {
    const x0 = i * CELL + (CELL - FOOT) / 2, [ring, inner] = rings(x0, -FOOT / 2, x0 + FOOT, FOOT / 2, 3, 1);
    return { i, d, ring, inner, sp: spring(d * U, { eps: 0.04 }), el: solid(g), ghost: null, drawn: "" };
  });
  const nearPost = solid(g);
  // The glass: no fill, so the pillars read through it; the ghosts stand on it, painted after.
  const [gr, gi] = rings(-7, -10, EXT + 7, 10, 7, 1.6);
  const glass = mk("path", { class: "sil nf" }, g), glassCr = mk("path", { class: "nf lo" }, g);
  for (const c of cols) c.ghost = mk("path", { class: "dash nf" }, g);
  const peak = cols.reduce((a, b) => (b.d > a.d ? b : a));

  // Screen x along the row is linear in world x, and the rest centres never move: the hit test reads only that.
  const sx0 = P(0, 0, 0)[0], sxU = P(1, 0, 0)[0] - sx0;
  let drawnLim = NaN, lit = null;

  function draw() {
    const L = lim.x;
    if (L !== drawnLim) {
      drawnLim = L;
      put(farPost, prism(P, front, pr, pi, 0, L));
      put(nearPost, prism(P, front, nr, ni, 0, L));
      const s = prism(P, front, gr, gi, L, L + PT);
      glass.setAttribute("d", s.sil);
      glassCr.setAttribute("d", s.crease);
    }
    for (const c of cols) {
      const h = Math.max(0.6, Math.min(c.sp.x, L - 0.05)), x = c.sp.x - L;
      const key = h.toFixed(2) + "|" + (x > 1 ? x.toFixed(2) : "");
      if (key === c.drawn) continue;
      c.drawn = key;
      put(c.el, prism(P, front, c.ring, c.inner, 0, h));
      c.ghost.setAttribute("d", x > 1 ? prism(P, front, c.ring, c.inner, L + PT, c.sp.x + PT).sil : "");
    }
    const want = over === null ? peak : cols[clamp(Math.round(over - 0.5), 0, N - 1)];
    if (want !== lit) {
      if (lit) lit.el.sil.classList.remove("hi");
      (lit = want).el.sil.classList.add("hi");
    }
  }

  const B2 = register(stage, (dt) => {
    let m = stepS(lim, dt);
    for (const c of cols) if (stepS(c.sp, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B2.unregister);

  function retarget() {
    for (const c of cols) {
      const burst = over === null ? 0 : B * falloff(Math.abs(c.i + 0.5 - over) / R);
      c.sp.t = clamp(c.d + burst, 0, DMAX) * U;
    }
    if (over === null) read.textContent = "rest";
    else {
      const c = cols[clamp(Math.round(over - 0.5), 0, N - 1)], sent = Math.round(c.sp.t / U), cap = Math.round(lim.t / U);
      read.textContent = `sec ${c.i + 1} · ${Math.min(sent, cap)}/${sent}`;
    }
    B2.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = clamp((p[0] - sx0) / sxU / CELL, 0, N); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lim.t = v * U; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "ceiling",
  means: "Each second's requests rise to a glass limit; what can't pass stands above it, dashed. The pointer is a burst.",
  rules: [1, 3, 5, 6],
  range: [4, 5.5, 8],
  mount,
});
