/**
 * Speaker: a standing cabinet with a woofer, a tweeter and a bass port, silent
 * at rest with the tweeter's dome bright. Hover the cabinet and
 * it plays: the cone kicks on every beat and each kick sends a wavefront out,
 * widening as it travels. Nearer the cone is louder, so the waves reach
 * further. The volume rides a spring; the beat is ambient and stops once the
 * volume is back to nothing. The slider is the tempo, in bpm.
 *
 * The hit test is the cabinet's resting outline on screen, which never moves.
 */
const {
  Cam, clamp, circ, facing, fit, hull, poly, prism, proj, put, reducedMotion, rings, ringAt, rrect, solid,
  spring, stepS, disposer, mk, place, pointer, reflect, register,
} = HL;

const W = 50, DP = 42, H = 84, WZ = 32, TZ = 68, RW = 17, RC = 14.5, RT = 7;
const K = 4, REACH = 40, GROW = 10, KICK = 5;

/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
/** Whether point q lies inside any of the loops. */
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let bpm = value, ph = 0;

  const C = Cam(45, 0.5, 2.25);
  fit(C, [[0, 0, 0], [W, 0, H], [0, 0, H], [W, DP, 0], [W / 2 + RW + GROW, DP + 6 + REACH, WZ], [W / 2 - RW - GROW, DP + 6 + REACH, WZ], [W / 2, DP + 6 + REACH, WZ - RW - GROW]], 200, 166);
  const P = proj(C), front = facing(C);
  /** A circle of radius r on the plane y, centred at (cx, cz): the front face and everything in front of it. */
  const disc = (r, y, cx, cz) => poly(circ(r, 48).map((q) => P(cx + q.u, y, cz + q.v)));

  const g = mk("g", {}, svg);
  const [ring, inner] = rings(0, 0, W, DP, 5, 1.6);
  reflect(svg, g, P, front, ring, 0, 16);
  const box = solid(g); put(box, prism(P, front, ring, inner, 0, H));

  // the woofer: its rim on the face, the cone's mouth just inside, the dust cap set back and kicked forward
  const rim = mk("path", { d: disc(RW, DP, W / 2, WZ), class: "nf" }, g);
  const cone = mk("path", { class: "nf lo" }, g);
  const cap = mk("path", { class: "" }, g);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    place(mk("circle", { r: 1.1, class: "dot off" }, g), P(W / 2 + 20.5 * Math.cos(a), DP, WZ + 20.5 * Math.sin(a)));
  }
  // the bass port: a rounded slot under the woofer
  const port = mk("path", { d: poly(rrect(W / 2 - 11, 6, W / 2 + 11, 11, 2.5, 5).map((q) => P(q.u, DP, q.v))), class: "nf" }, g);
  // the tweeter: a ring and a dome, the bright mark at rest
  const tweet = mk("path", { d: disc(RT, DP, W / 2, TZ), class: "nf lo" }, g);
  const dome = mk("path", { d: disc(4.4, DP + 1.2, W / 2, TZ), class: "sil" }, g);

  // wavefronts, in front of the face; silent at rest
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
      el.setAttribute("d", v < 0.02 ? "" : disc(RW + f * GROW, DP + 6 + f * REACH * v, W / 2, WZ));
      el.setAttribute("class", f < 0.3 ? "nf" : f > 0.75 ? "nf lo dash" : "nf lo");
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

  // each part lights while the pointer is over it, tested against its outline at rest; the first that holds it wins
  const parts = [[dome, [dome]], [tweet, [tweet]], [cap, [cap, cone]], [rim, [rim]], [port, [port]], [box.sil, [box.sil]]].map(([h, els]) => ({ ls: loops(h.getAttribute("d")), els }));
  let lit = null;
  const light = (p) => { const pt = (p && parts.find((x) => inLoops(p, x.ls))) || null; if (pt !== lit) { lit = pt; parts.forEach((x) => x.els.forEach((e) => e.classList.toggle("hi", x === pt))); } };
  function setVol(p) {
    const t = p && inside(p) ? clamp(1.1 - Math.hypot(p[0] - ctr[0], p[1] - ctr[1]) / (span * 1.6), 0.4, 1) : 0;
    const on = t > 0;
    vol.t = Math.round(t * 20) / 20;
    light(p);
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
