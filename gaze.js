/**
 * Gaze: an acrylic standee of one anime eye, die-cut round its artwork, a heavy upper lash with a flick at
 * the corner, a tall iris with two shines, a thin lower lid and a brow. At rest
 * it glances up and aside. Anywhere on the stage, the iris turns to the
 * pointer on two springs, the pupil leading it a little and the shines lagging,
 * so it reads as a curved eye, not a sticker. The read-out names where it
 * looks. The slider is how far the iris can travel.
 *
 * The eye is cut by paint order: lids and cover plates are drawn over the iris,
 * never clipped. The hit test is the eye's fixed centre on screen.
 */
const {
  Cam, clamp, disposer, fit, hull, mk, open, place, pointer, poly, proj, rad, reflect, register,
  rrect, spring, stepS,
} = HL;

const PHI = rad(-30), T = 3, CX = 2, CY = 44, IRX = 10, IRY = 13.5, REST = [3.5, 2];
const U = [Math.cos(PHI), Math.sin(PHI)], N = [-Math.sin(PHI), Math.cos(PHI)];

/** A cubic from a to d, sampled n times. */
const cubic = (a, b, c, d, n = 16) => Array.from({ length: n + 1 }, (_, k) => {
  const t = k / n, s = 1 - t;
  return [0, 1].map((i) => s * s * s * a[i] + 3 * s * s * t * b[i] + 3 * s * t * t * c[i] + t * t * t * d[i]);
});
const UPPER = cubic([-25, 41], [-16, 59], [12, 61], [27, 47]);
const LOWER = cubic([-25, 41], [-12, 29], [14, 28], [27, 47]);
const BROW = cubic([-20, 68], [-8, 74], [10, 75], [24, 69], 10);
// the artwork sits V0 up the panel, which stands on a short tab in the foot
const V0 = 22;
const oval = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, k) => [cx + rx * Math.cos((k / n) * 2 * Math.PI), cy + ry * Math.sin((k / n) * 2 * Math.PI)]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const C = Cam(45, 0.5, 2.7);
  /** A point on the standee: u across its face, v up, d out of its face toward the eye. */
  const W = (u, v, d) => [u * U[0] + d * N[0], u * U[1] + d * N[1], v - V0];
  // die-cut: the eye's lids, lash and brow, a tab down into the foot, grown by a margin and hulled
  const art = [...UPPER, ...LOWER, [34, 56], ...BROW, [-12, V0 + 3], [12, V0 + 3]];
  const cut = (m) => hull(art.flatMap(([u, v]) => Array.from({ length: 32 }, (_, k) => [u + m * Math.cos(k * Math.PI / 16), v + m * Math.sin(k * Math.PI / 16)])));
  const panel = cut(7.5), crease = cut(5.6);
  const foot = rrect(-26, -9, 26, 9, 5, 5);
  fit(C, panel.flatMap(([u, v]) => [W(u, v, T / 2), W(u, v, -T / 2)]).concat(foot.map((q) => W(q.u, V0, q.v))), 200, 162);
  const P = proj(C);
  const Q = ([u, v], d = T / 2) => P(...W(u, v, d));
  const shape = (pts, d) => poly(pts.map((p) => Q(p, d)));

  const g = mk("g", {}, svg);
  // the foot, a rounded block the panel stands in; its far half is under the panel
  const fAt = (z) => foot.map((q) => P(...W(q.u, V0 + z, q.v)));
  const fIn = rrect(-24.6, -7.6, 24.6, 7.6, 3.6, 5).map((q) => P(...W(q.u, V0 + 7, q.v)));
  const fring = foot.map((q) => ({ u: q.u, v: q.v, nu: q.nu, nv: q.nv }));
  reflect(svg, g, (x, y, z) => P(...W(x, V0 + z, y)), () => true, fring, 0, 10);
  mk("path", { d: poly(hull(fAt(0).concat(fAt(7)))), class: "sil" }, g);
  mk("path", { d: poly(fIn), class: "nf lo" }, g);

  // the panel: its back shell, then its face
  mk("path", { d: shape(panel, -T / 2), class: "lo" }, g);
  mk("path", { d: shape(panel, T / 2), class: "sil" }, g);

  // the eye, back to front: iris, pupil, shines, then the plates that cut it, then the lids
  const iris = mk("path", { class: "sil" }, g), ring = mk("path", { class: "nf lo" }, g), pupil = mk("path", { class: "nf" }, g);
  const streaks = mk("path", { class: "nf lo" }, g);
  const shine = mk("circle", { r: 2.6, class: "dot" }, g), glint = mk("circle", { r: 1.2, class: "dot m" }, g);
  // cover plates over the iris's whole travel, kept inside the crease so they never cut the panel's edges
  mk("path", { d: shape([...UPPER, [28, 50], [22, 66], [-18, 66], [-26, 43]]), class: "fo" }, g);
  mk("path", { d: shape([...LOWER, [28, 46], [21, 25], [-17, 25], [-26, 40]]), class: "fo" }, g);
  mk("path", { d: shape(crease), class: "nf lo" }, g);
  mk("path", { d: open(LOWER.slice(3, 15).map((p) => Q(p))), class: "nf" }, g);
  // the upper lash: thick in the middle, a flick past the outer corner, standing proud of the face
  const top = UPPER.map(([u, v], k) => { const t = k / (UPPER.length - 1); return [u - 0.6 * t, v + 1 + 4.2 * Math.sin(Math.PI * Math.min(1, t * 1.1))]; });
  const lash = [...UPPER, [31, 51.5], [34, 56], [29, 53.5], ...top.reverse()];
  mk("path", { d: shape(lash, T / 2 + 0.2), class: "lo" }, g);
  mk("path", { d: shape(lash, T / 2 + 1.4), class: "sil" }, g);
  mk("path", { d: [[[8, 62.5], [10, 67]], [[15, 61], [18.5, 65]], [[21, 58.5], [25, 61.5]]].map(([a, b]) => open([Q(a, T / 2 + 1.4), Q(b, T / 2 + 1.4)])).join(""), class: "nf" }, g);
  mk("path", { d: open(BROW.map((p) => Q(p))), class: "nf" }, g);

  const iu = spring(REST[0]), iv = spring(REST[1]);
  let drawn = "";
  function draw() {
    const u = iu.x, v = iv.x, key = u.toFixed(2) + v.toFixed(2);
    if (key === drawn) return;
    drawn = key;
    const cx = CX + u, cy = CY + v, d = T / 2 - 0.6;
    iris.setAttribute("d", shape(oval(cx, cy, IRX, IRY), d));
    ring.setAttribute("d", shape(oval(cx + u * 0.08, cy + v * 0.08, IRX * 0.68, IRY * 0.7), d));
    pupil.setAttribute("d", shape(oval(cx + u * 0.18, cy + v * 0.18, 3.6, 5.6), d));
    // the lower iris catches light in short streaks, as anime eyes are drawn
    streaks.setAttribute("d", [-5, -2, 1, 4].map((o) => open([Q([cx + o, cy - 6], d), Q([cx + o * 1.25, cy - 10.5], d)])).join(""));
    place(shine, Q([cx - 4 - u * 0.25, cy + 6 - v * 0.25], d));
    place(glint, Q([cx + 5 - u * 0.25, cy - 3 - v * 0.25], d));
  }
  draw();

  const B = register(stage, (dt) => { const a = stepS(iu, dt), b = stepS(iv, dt); draw(); return a || b; });
  bag.add(B.unregister);

  // the eye's centre on screen never moves; the pointer is read against it
  const [ex, ey] = Q([CX, CY]);
  const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  function look(p) {
    let tu = REST[0], tv = REST[1], on = !!p;
    if (on) {
      tu = clamp((p[0] - ex) / 110, -1, 1) * reach;
      tv = clamp((ey - p[1]) / 90, -1, 1) * reach * 0.55;
      const m = Math.hypot(tu / reach, tv / (reach * 0.55));
      if (m > 1) { tu /= m; tv /= m; }
    }
    iu.t = tu; iv.t = tv;
    iris.classList.toggle("hi", on);
    const a = Math.atan2(tv / 0.55, tu), near = Math.hypot(tu, tv / 0.55) < reach * 0.3;
    read.textContent = !on ? "rest" : near ? "ahead" : "look " + DIRS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
    B.wake();
  }

  bag.add(pointer(stage, { move: look, leave: () => look(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "gaze",
  means: "An anime eye on an acrylic standee: its iris turns to follow the pointer, pupil leading and shines lagging behind.",
  rules: [1, 3, 6, 8],
  range: [4, 7, 10],
  mount,
});
