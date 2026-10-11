/**
 * Black hole: a sheet of spacetime drawn as a grid, sunk into a well where a black hole sits, its event horizon a ring at the bottom
 * of the well and a disc of matter circling round it. Bring the pointer over the sheet and the hole follows it across, growing heavier
 * while the pointer stays, the well deepening and the grid lines bending down toward it wherever it goes; the disc turns faster the
 * heavier it grows. Leave and it drifts back to the middle and settles at its resting mass. The horizon takes the bright edge while
 * it feeds. The read-out gives its mass, as a multiple of the resting one. The slider is the mass it grows to.
 *
 * The grid lines are open lines over the sheet, each point sunk by the well's depth there, which falls off as one over distance;
 * the hole is read on the sheet's flat plane, which never moves.
 */
const { Cam, fit, mk, open, poly, proj, spring, stepS, unproj, disposer, pointer, register } = HL;

const E = 50, N = 13, S0 = 7, A0 = 20, ZM = 34;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let grow = value;
  const C = Cam(45, 0.5, 2.55);
  fit(C, [[-E, -E, 0], [E, E, 0], [E, -E, 0], [-E, E, 0], [0, 0, -ZM], [0, 0, 6]], 200, 145);
  const P = proj(C), g = mk("g", {}, svg);
  const grid = mk("path", { class: "nf" }, g), disc = mk("path", { class: "nf lo" }, g), horizon = mk("path", { class: "sil" }, g);
  const hx = spring(0, { k: 40, c: 11 }), hy = spring(0, { k: 40, c: 11 }), m = spring(1, { k: 30, c: 9 });
  let spin = 0;
  // the well's depth at distance r: one over distance, eased so the deepest well still fits the frame
  const well = (r) => { const A = A0 * m.x, z = (A * S0) / (r + S0) - (A * S0) / (E * 1.6 + S0); return -ZM * Math.tanh(z / ZM); };
  const depth = (x, y) => well(Math.hypot(x - hx.x, y - hy.x));

  function draw() {
    // the grid: lines along x and along y, sampled finely so they bend into the well
    const lines = [];
    for (let k = 0; k < N; k++) {
      const c = -E + (2 * E * k) / (N - 1);
      lines.push(open(Array.from({ length: 61 }, (_, i) => { const t = -E + (2 * E * i) / 60; return P(t, c, depth(t, c)); })));
      lines.push(open(Array.from({ length: 61 }, (_, i) => { const t = -E + (2 * E * i) / 60; return P(c, t, depth(c, t)); })));
    }
    grid.setAttribute("d", lines.join(""));
    // the horizon at the bottom of the well, and the disc circling it a little higher, its matter in dashes that turn
    const rh = 3.2 * Math.sqrt(m.x), zb = well(rh * 1.4);
    horizon.setAttribute("d", poly(Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * 2 * Math.PI; return P(hx.x + rh * Math.cos(a), hy.x + rh * Math.sin(a), zb); })));
    let d = "";
    for (let ring = 0; ring < 2; ring++) {
      const rr = rh * (2 + ring * 0.9), z = zb + 2.5;
      for (let k = 0; k < 10; k++) { const a0 = spin * (1.4 - ring * 0.4) + (k / 10) * 2 * Math.PI; d += open(Array.from({ length: 5 }, (_, i) => { const a = a0 + i * 0.08; return P(hx.x + rr * Math.cos(a), hy.x + rr * Math.sin(a), z); })); }
    }
    disc.setAttribute("d", d);
  }
  draw();

  let on = false;
  const B = register(stage, (dt) => {
    const mv = [stepS(hx, dt), stepS(hy, dt), stepS(m, dt)].some(Boolean);
    spin += dt * (0.6 + 1.6 * m.x);
    draw();
    read.textContent = on ? `mass ×${m.x.toFixed(1)}` : mv ? `mass ×${m.x.toFixed(1)}` : "rest";
    return mv || on;
  });
  bag.add(B.unregister);

  function point(q) {
    const w = q ? unproj(C, q[0], q[1], 0) : null, n = !!w && Math.abs(w[0]) < E && Math.abs(w[1]) < E;
    if (n) { hx.t = Math.max(-E + 14, Math.min(E - 14, w[0])); hy.t = Math.max(-E + 14, Math.min(E - 14, w[1])); m.t = grow; }
    else { hx.t = 0; hy.t = 0; m.t = 1; }
    if (n !== on) { on = n; horizon.classList.toggle("hi", n); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { grow = v; if (on) m.t = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "blackhole",
  means: "A black hole on a grid of spacetime: it follows the pointer and grows heavier, the well deepening and the grid bending into it.",
  rules: [1, 3, 7, 8, 10],
  range: [1.6, 2.2, 3],
  mount,
});
