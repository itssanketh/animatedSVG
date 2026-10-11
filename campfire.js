/**
 * Campfire: a campfire on the ground: a ring of stones, logs laid crosswise in the middle, and the fire on them, low at rest, a few
 * small tongues over the embers. Bring the pointer near and it blazes up: the flames climb tall and flicker, each tongue to its own
 * beat, and sparks fly up off them, rising and drifting and going out; the nearer the pointer, the bigger the fire. Leave and it dies
 * back down to its embers. The tallest flame takes the bright edge while it blazes. The read-out gives how high the fire is and how
 * many sparks are in the air. The slider is how tall it burns.
 *
 * The stones and logs are prisms of rounded rings, painted from the far side to the near one; the flames stand upright over the
 * logs, drawn face on; the sparks are dots. The pointer is read against the fire's resting outline.
 */
const { Cam, fit, proj, facing, rrect, circ, prism, solid, put, hull, ringAt, poly, open, spring, stepS, mk, flatDot, place, register, pointer, disposer } = HL;

const turn = (ring, h, x, y) => { const c = Math.cos(h), s = Math.sin(h); return ring.map((q) => ({ ...q, u: x + q.u * c - q.v * s, v: y + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })); };
// the flames: where each tongue stands, how tall it is beside the others, its beat
const TONGUES = [[0, 0, 1, 0], [-6, 4, 0.72, 1.7], [6, -3, 0.78, 3.1], [-3, -6, 0.6, 4.4], [5, 6, 0.55, 5.6]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let tall = value;
  const C = Cam(45, 0.5, 3.4);
  fit(C, [[-32, -32, 0], [32, 32, 0], [32, -32, 0], [-32, 32, 0], [0, 0, 56]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the ground's scorch, the stones round the fire, far ones first; the logs crosswise
  mk("path", { class: "nf lo", d: poly(Array.from({ length: 40 }, (_, i) => P(30 * Math.cos((i / 40) * 2 * Math.PI), 30 * Math.sin((i / 40) * 2 * Math.PI), 0))) }, g);
  const stones = Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * 2 * Math.PI, r = 26, s = 3.4 + ((i * 7) % 4) * 0.4; return { a, x: r * Math.cos(a), y: r * Math.sin(a), s }; }).sort((p, q) => p.x + p.y - (q.x + q.y));
  const near = stones.filter((s) => s.x + s.y > 0), far = stones.filter((s) => s.x + s.y <= 0);
  const putStone = (s) => put(solid(g), prism(P, front, turn(rrect(-s.s, -s.s * 0.8, s.s, s.s * 0.8, s.s * 0.7, 5), s.a, s.x, s.y), turn(rrect(-s.s + 1, -s.s * 0.8 + 1, s.s - 1, s.s * 0.8 - 1, s.s * 0.6, 5), s.a, s.x, s.y), 0, s.s * 0.7));
  far.forEach(putStone);
  [[0.5, 0, 0], [-1.07, 0, 3.6], [0.5 + Math.PI / 2, 0, 7.2]].forEach(([h, , z]) => put(solid(g), prism(P, front, turn(rrect(-17, -3, 17, 3, 2.9, 6), h, 0, 0), turn(rrect(-16, -2.2, 16, 2.2, 2.1, 6), h, 0, 0), z, z + 5.4)));
  const flameEls = TONGUES.map(() => ({ out: mk("path", { class: "sil" }, g), core: mk("path", { class: "nf lo" }, g) }));
  near.forEach(putStone);
  const fire = spring(0.3, { k: 26, c: 7 });
  let clock = 0, on = false, want = 0.3, sparks = [];

  function draw() {
    const base = P(0, 0, 12.6);
    TONGUES.forEach(([x, y, k, beat], i) => {
      const b = P(x, y, 12.6), f = fire.x, h = 2.6 * (8 + tall * f * k) * (1 + 0.14 * Math.sin(clock * (6 + i) + beat) * (0.3 + f)), w = 2.4 * (4 + 4.5 * f) * (0.6 + 0.4 * k), lean = Math.sin(clock * 3.3 + beat) * 7 * f;
      // a tongue of flame: a teardrop standing on the logs, its tip swaying
      const shape = Array.from({ length: 28 }, (_, j) => { const t = (j / 28) * 2 * Math.PI, u = (1 - Math.cos(t)) / 2, s = Math.sin(t); return [b[0] + s * w * Math.sin(Math.PI * Math.pow(u, 0.7)) * 0.95 + lean * u * u, b[1] + 2 - u * h]; });
      flameEls[i].out.setAttribute("d", poly(shape));
      flameEls[i].core.setAttribute("d", f < 0.35 ? "" : poly(shape.map(([px, py]) => [b[0] + (px - b[0]) * 0.45 + lean * 0.1, b[1] + 2 + (py - b[1] - 2) * 0.55])));
    });
    void base;
  }
  draw();

  const B = register(stage, (dt) => {
    let m = stepS(fire, dt);
    if (on) clock += dt; else if (fire.x > 0.32) clock += dt;
    if (on && fire.x > 0.5 && Math.random() < dt * 14 * fire.x) sparks.push({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10, z: 20 + Math.random() * 10, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, vz: 20 + Math.random() * 18, life: 0, dot: flatDot(g, C, 0.7, "dot") });
    sparks = sparks.filter((s) => { s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vx += Math.sin(clock * 4 + s.life * 9) * 6 * dt; if (s.life > 1.6 || s.z > 70) { s.dot.remove(); return false; } place(s.dot, P(s.x, s.y, s.z)); return true; });
    draw();
    flameEls[0].out.classList.toggle("hi", on && fire.x > 0.7);
    read.textContent = on || fire.x > 0.33 || sparks.length ? `fire ${Math.round(fire.x * 100)}% · ${sparks.length} sparks` : "rest";
    return m || on || sparks.length > 0 || fire.x > 0.31;
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, circ(32, 32), 0), ...ringAt(P, circ(14, 20), 50)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  const mid = P(0, 0, 20);
  function point(q) {
    on = !!q && inside(q, outline);
    // the nearer the pointer to the fire's middle, the bigger it burns
    want = on ? Math.max(0.6, Math.min(1, 1.15 - Math.hypot(q[0] - mid[0], q[1] - mid[1]) / 140)) : 0.3;
    fire.t = want;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { tall = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "campfire",
  means: "A campfire: bring the pointer near and it blazes up, flames flickering tall and sparks flying; leave and it dies back to its embers.",
  rules: [1, 3, 6, 7],
  range: [24, 34, 44],
  mount,
});
