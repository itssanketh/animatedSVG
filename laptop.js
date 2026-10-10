/**
 * Laptop: a notebook standing open, its screen asleep and the power light on.
 * Bring the pointer over it and the screen wakes, its window and lines of code
 * drawing in from the top on the 700ms curve, while the pointer's height tilts
 * the lid on a spring: low leans it toward you, high lays it back. The
 * read-out is the lid's angle. The slider is how far back the lid can go.
 *
 * The hit test is a static band over the laptop's footprint and the lid's
 * widest swing; the lid moving under the pointer cannot change the reading.
 */
const {
  Cam, clamp, fit, hull, lerp, open, poly, prism, proj, put, rad, rings, rrect, solid,
  spring, stepS, tween, tset, tval, tdone, disposer, mk, place, pointer, reflect, register, facing,
} = HL;

const W = 96, D = 64, BT = 2.6, LT = 2.4, REST = 100, LOW = 86;
// code on the screen: [indent, length] per line, top to bottom
const CODE = [[0, 34], [5, 44], [10, 28], [10, 50], [5, 24], [0, 38], [5, 20]];

/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
/** Whether point q lies inside any of the loops. */
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let max = value;

  const C = Cam(45, 0.5, 1.95);
  /** A point on the lid at angle th: u across, s up from the hinge, off along its normal (negative is the outer shell). */
  const lidAt = (P, th, u, s, off) => {
    const c = Math.cos(rad(th)), n = Math.sin(rad(th));
    return P(u, s * c + off * n, BT + s * n - off * c);
  };
  const ext = (th) => [[0, 0, 0], [W, D, 0], [W, 0, 0], [0, D, 0], [0, 0, 0]].concat(
    [[0, D], [W, D]].map(([u, s]) => { const c = Math.cos(rad(th)), n = Math.sin(rad(th)); return [u, s * c - LT * n, BT + s * n + LT * c]; }));
  fit(C, ext(130).concat(ext(LOW)), 200, 164);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [ring, inner] = rings(0, 0, W, D, 5, 1.4);
  reflect(svg, g, P, front, ring, 0, 6);
  const base = solid(g); put(base, prism(P, front, ring, inner, 0, BT));

  // the deck: hinge, keys, trackpad, and the power light at the front right
  const deck = (pts) => poly(pts.map((q) => P(q.u, q.v, BT)));
  let keys = "";
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 12; c++) {
      if (r === 3 && c > 3 && c < 8) continue;
      const x = 10 + c * 6.4, y = 10 + r * 6.4;
      keys += deck(rrect(x, y, x + 5, y + 5, 1.2, 2));
    }
  keys += deck(rrect(10 + 4 * 6.4, 10 + 3 * 6.4, 10 + 7 * 6.4 + 5, 10 + 3 * 6.4 + 5, 1.2, 2));
  mk("path", { d: keys, class: "nf lo" }, g);
  mk("path", { d: open([P(16, 3, BT), P(W - 16, 3, BT)]), class: "nf lo" }, g);
  const pad = mk("path", { d: deck(rrect(W / 2 - 15, 41, W / 2 + 15, 57, 2.4, 4)), class: "nf" }, g);
  const led = mk("circle", { r: 1.3, class: "dot" }, g);
  place(led, P(W - 7, D - 3.5, BT));

  // the lid: one silhouette round both shells, then whichever face is turned to the eye
  const lid = mk("g", {}, g);
  const sil = mk("path", { class: "sil" }, lid);
  const back = mk("path", { class: "nf lo" }, lid);
  const face = mk("g", {}, lid);
  const bezel = mk("path", { class: "nf lo" }, face);
  const disp = mk("path", { class: "nf" }, face);
  const bar = mk("path", { class: "nf lo" }, face);
  const code = mk("path", { class: "nf" }, face);
  const cam = mk("circle", { r: 0.9, class: "dot off" }, face);
  const lights = [0, 1, 2].map(() => mk("circle", { r: 0.95, class: "dot off" }, face));

  const shellIn = rrect(0, 0, W, D, 4.5, 4), shellOut = shellIn;
  const area = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
  const corners = (th) => [[0, 0], [W, 0], [W, D], [0, D]].map(([u, s]) => lidAt(P, th, u, s, 0));
  const UP = Math.sign(area(corners(100)));

  const ang = spring(REST, { eps: 0.05 }), awake = tween(0);
  let drawn = "";
  function draw(now) {
    const th = Math.round(ang.x * 20) / 20, wk = Math.round(tval(awake, now) * 200) / 200;
    if (th + "," + wk === drawn) return;
    drawn = th + "," + wk;
    const L = (u, s, off = 0) => lidAt(P, th, u, s, off);
    const pin = shellIn.map((q) => L(q.u, q.v, 0)), pout = shellOut.map((q) => L(q.u, q.v, -LT));
    sil.setAttribute("d", poly(hull(pin.concat(pout))));
    const shows = Math.sign(area(corners(th))) === UP;
    face.setAttribute("display", shows ? "inline" : "none");
    back.setAttribute("d", shows ? "" : poly(pout));
    if (!shows) return;
    bezel.setAttribute("d", poly(pin));
    disp.setAttribute("d", poly(rrect(4.5, 5, W - 4.5, D - 6, 1.6, 3).map((q) => L(q.u, q.v))));
    place(cam, L(W / 2, D - 3));
    // the screen wakes line by line from the top
    const on = (k) => clamp(wk * 1.7 - k * 0.09, 0, 1);
    bar.setAttribute("d", on(0) ? open([L(8, D - 13), L(8 + (W - 16) * on(0), D - 13)]) : "");
    lights.forEach((el, k) => { place(el, L(11 + k * 3.6, D - 9.5)); el.setAttribute("display", on(0) > 0.2 ? "inline" : "none"); });
    code.setAttribute("d", CODE.map(([i, n], k) => {
      const f = on(k + 1), s = D - 18.5 - k * 5.4;
      return f ? open([L(11 + i, s), L(11 + i + n * f, s)]) : "";
    }).join(""));
  }
  draw(performance.now());
  // each part lights while the pointer is over it, tested against its outline at rest; the first that holds it wins
  const parts = [[disp, [disp]], [sil, [sil]], [pad, [pad]], [base.sil, [base.sil]]].map(([h, els]) => ({ ls: loops(h.getAttribute("d")), els }));
  let lit = null;
  const light = (p) => { const pt = (p && parts.find((x) => inLoops(p, x.ls))) || null; if (pt !== lit) { lit = pt; parts.forEach((x) => x.els.forEach((e) => e.classList.toggle("hi", x === pt))); } };

  const B = register(stage, (dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ const m = stepS(ang, dt); draw(now); return m || !tdone(awake, now); });
  bag.add(B.unregister);

  // hit band: across the footprint, from the base's front edge up to the top of the widest swing
  const xl = P(0, D, 0)[0] - 6, xr = P(W, 0, 0)[0] + 6;
  const yb = P(W, D, 0)[1] + 6, yt = Math.min(lidAt(P, 130, 0, D, -LT)[1], lidAt(P, 90, 0, D, -LT)[1]) - 6;
  function lift(p) {
    const on = p && p[0] > xl && p[0] < xr && p[1] > yt && p[1] < yb;
    ang.t = on ? Math.round(lerp(LOW, max, clamp((yb - p[1]) / (yb - yt), 0, 1))) : REST;
    tset(awake, on ? 1 : 0, performance.now(), 0);
    light(p); led.classList.toggle("m", on);
    read.textContent = on ? ang.t + "°" : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: lift, leave: () => lift(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { max = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "laptop",
  means: "A laptop with its screen asleep: bring the pointer over it and the screen wakes, and its height tilts the lid.",
  rules: [1, 3, 5, 6],
  range: [100, 115, 130],
  mount,
});
