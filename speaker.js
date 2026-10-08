/**
 * Speaker: a standing cabinet with a woofer and a tweeter. At rest two still
 * wavefronts hang just off the cone, the last of a note. Hover the cabinet and
 * it plays: the cone kicks on every beat and each kick sends a wavefront out,
 * widening as it travels. Nearer the cone is louder, so the waves reach
 * further. The volume rides a spring; the beat is ambient and stops once the
 * volume is back to nothing. The slider is the tempo, in bpm.
 *
 * The hit test is the cabinet's resting outline on screen, which never moves.
 */
const {
  Cam, clamp, circ, facing, fit, hull, lerp, poly, prism, proj, put, reducedMotion, rings, ringAt, solid,
  spring, stepS, disposer, mk, place, pointer, reflect, register,
} = HL;

const W = 50, DP = 42, H = 84, WZ = 32, TZ = 68, RW = 17, RC = 14.5, RT = 7;
const K = 4, REACH = 64, GROW = 14, KICK = 5;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let bpm = value, ph = 0;

  const C = Cam(45, 0.5, 2.05);
  fit(C, [[0, 0, 0], [W, 0, H], [0, 0, H], [W, DP, 0], [W / 2 + RW + GROW, DP + 6 + REACH, WZ], [W / 2 - RW - GROW, DP + 6 + REACH, WZ], [W / 2, DP + 6 + REACH, WZ - RW - GROW]], 200, 166);
  const P = proj(C), front = facing(C);
  /** A circle of radius r on the plane y, centred at (cx, cz): the front face and everything in front of it. */
  const disc = (r, y, cx, cz) => poly(circ(r, 48).map((q) => P(cx + q.u, y, cz + q.v)));

  const g = mk("g", {}, svg);
  const [ring, inner] = rings(0, 0, W, DP, 5, 1.6);
  reflect(svg, g, P, front, ring, 0, 16);
  put(solid(g), prism(P, front, ring, inner, 0, H));

  // the woofer: its rim on the face, the cone's mouth just inside, the dust cap set back and kicked forward
  const rim = mk("path", { d: disc(RW, DP, W / 2, WZ), class: "nf" }, g);
  const cone = mk("path", { class: "nf lo" }, g);
  const cap = mk("path", { class: "" }, g);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    place(mk("circle", { r: 1.1, class: "dot off" }, g), P(W / 2 + 20.5 * Math.cos(a), DP, WZ + 20.5 * Math.sin(a)));
  }
  // the tweeter: a ring and a dome, the bright mark at rest
  mk("path", { d: disc(RT, DP, W / 2, TZ), class: "nf lo" }, g);
  const dome = mk("path", { d: disc(4.4, DP + 1.2, W / 2, TZ), class: "sil hi" }, g);

  // wavefronts, in front of the face; rest holds them close and dashed
  const waves = [];
  for (let k = 0; k < K; k++) waves.push(mk("path", { class: "nf lo dash" }, g));

  const vol = spring(0);
  let drawn = "";
  function draw() {
    const v = vol.x, b = ph % 1, push = v * KICK * Math.exp(-b * 6);
    const key = v.toFixed(3) + ":" + b.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    cone.setAttribute("d", disc(RC, DP - 1 + push * 0.4, W / 2, WZ));
    cap.setAttribute("d", disc(5.2, DP - 3 + push, W / 2, WZ));
    waves.forEach((el, k) => {
      const f = (b + k) / K;
      // rest: two still fronts close to the cone; the others sit folded on the first
      const rd = 5 + Math.min(k, 1) * 5, rr = RW + 2 + Math.min(k, 1) * 3;
      const d = lerp(rd, 6 + f * REACH * v, clamp(v * 3, 0, 1)), r = lerp(rr, RW + f * GROW, clamp(v * 3, 0, 1));
      el.setAttribute("d", disc(r, DP + d, W / 2, WZ));
      el.setAttribute("class", v < 0.02 ? "nf lo dash" : f < 0.3 ? "nf" : "nf lo");
    });
  }
  draw();

  const B = register(stage, (dt) => {
    const m = stepS(vol, dt);
    if (vol.x > 0.01 && !reducedMotion()) ph += (dt * bpm) / 60;
    draw();
    return m || (vol.t > 0 && !reducedMotion());
  });
  bag.add(B.unregister);

  // hit area: the cabinet's resting outline; louder nearer the cone's centre
  const out = hull(ringAt(P, ring, 0).concat(ringAt(P, ring, H)));
  const ctr = P(W / 2, DP, WZ), span = Math.hypot(...[0, 1].map((i) => P(W / 2, DP, H)[i] - ctr[i]));
  const inside = ([x, y]) => out.every((a, i) => {
    const c = out[(i + 1) % out.length];
    return (c[0] - a[0]) * (y - a[1]) - (c[1] - a[1]) * (x - a[0]) >= 0;
  }) || out.every((a, i) => {
    const c = out[(i + 1) % out.length];
    return (c[0] - a[0]) * (y - a[1]) - (c[1] - a[1]) * (x - a[0]) <= 0;
  });

  function setVol(p) {
    const t = p && inside(p) ? clamp(1.1 - Math.hypot(p[0] - ctr[0], p[1] - ctr[1]) / (span * 1.6), 0.4, 1) : 0;
    const on = t > 0;
    vol.t = Math.round(t * 20) / 20;
    rim.classList.toggle("hi", on); rim.classList.toggle("sil", on); dome.classList.toggle("hi", !on);
    read.textContent = on ? "vol " + Math.round(vol.t * 100) : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: setVol, leave: () => setVol(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { bpm = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "speaker",
  means: "A speaker cabinet: hover it and the cone kicks on the beat, each kick sending a wavefront out; nearer the cone is louder.",
  rules: [1, 3, 5, 7],
  range: [70, 120, 170],
  mount,
});
