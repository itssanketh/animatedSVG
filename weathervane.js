/**
 * Weathervane: a weathervane on a roof's ridge, a post up from a little roof, the four compass arms crossing below with
 * a ball at the end of each, and on top an arrow, a point at its head and a broad fin at its tail, free to turn. Bring
 * the pointer near and it is the wind: the arrow swings round to point into it, overshooting and wobbling before it
 * settles, the nearer the pointer the stronger the gust; leave and the wind drops and the arrow swings back to the north.
 * The arrow takes the bright edge while the wind blows. The read-out says where the wind comes from and how strong it
 * is; the slider is how loose the vane is on its pivot.
 *
 * The roof is a ridge of two slopes; the post and the balls are rounded rods and rings; the arrow is a flat plate in the
 * vertical plane through its axis. The pointer is read on the ground's plane, and the hit test is the vane at rest.
 */
const { Cam, clamp, fit, hull, mk, open, poly, proj, rad, spring, stepS, unproj, disposer, pointer, register } = HL;

const TOP = 30, ARMS = 20, NORTH = rad(135);
const DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let loose = value;
  const C = Cam(45, 0.5, 6);
  fit(C, [[-14, -14, 0], [14, 14, 0], [14, -14, 0], [-14, 14, 0], [0, 0, TOP + 4]], 200, 182);
  const P = proj(C), g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g), pts = (ws) => ws.map((q) => P(...q));
  // the roof: a short ridge, two slopes and their gable ends
  const roof = el("sil"), roofLines = el("nf");
  const R = [[-12, -7, 6], [12, -7, 6], [12, 0, 12], [12, 7, 6], [-12, 7, 6], [-12, 0, 12]];
  roof.setAttribute("d", poly(hull(pts([...R, [-12, -7, 0], [12, -7, 0], [12, 7, 0], [-12, 7, 0]]))));
  roofLines.setAttribute("d", open(pts([[-12, 0, 12], [12, 0, 12]])) + open(pts([[12, -7, 6], [12, 0, 12], [12, 7, 6]])) + open(pts([[12, 7, 6], [12, 7, 0]])) + open(pts([[-12, 7, 6], [12, 7, 6]])));
  // the post, the compass arms and their balls
  const rod = (a, b, w) => { const p = P(...a), q = P(...b), d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, n = [-(q[1] - p[1]) / d * w, (q[0] - p[0]) / d * w]; return poly([[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]], [q[0] - n[0], q[1] - n[1]], [p[0] - n[0], p[1] - n[1]]]); };
  const ball = (c, r) => poly(Array.from({ length: 20 }, (_, k) => { const p = P(...c), s = P(c[0] + r, c[1], c[2]), rr = Math.hypot(s[0] - p[0], s[1] - p[1]) * 1.2; return [p[0] + rr * Math.cos((k / 20) * 2 * Math.PI), p[1] + rr * Math.sin((k / 20) * 2 * Math.PI)]; }));
  const armsBack = el("sil"), post = el("sil"), armsFront = el("sil"), cap = el("sil"), arrowFront = el("sil");
  post.setAttribute("d", rod([0, 0, 12], [0, 0, TOP + 1], 0.9));
  const arm = (a) => { const e = [9 * Math.cos(a), 9 * Math.sin(a), ARMS]; return rod([0, 0, ARMS], e, 0.6) + ball(e, 0.9); };
  // compass arms along the world axes; the ones toward you painted after the post
  const ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  armsBack.setAttribute("d", ang.filter((a) => Math.cos(a - rad(45)) < 0).map(arm).join(""));
  armsFront.setAttribute("d", ang.filter((a) => Math.cos(a - rad(45)) >= 0).map(arm).join(""));
  cap.setAttribute("d", ball([0, 0, TOP + 1.2], 1.1));

  const yaw = spring(NORTH, { k: 30, c: 2.6, eps: 0.002 });
  /** The arrow at angle a: head pointing along a, the fin behind, flat in the vertical plane through the post. */
  function arrow(a) {
    const d = [Math.cos(a), Math.sin(a)], at = (s, z) => [d[0] * s, d[1] * s, TOP + z];
    const head = pts([at(9, 0), at(6, 1.6), at(6.4, 0.35), at(-5, 0.35), at(-5, -0.35), at(6.4, -0.35), at(6, -1.6)]);
    const fin = pts([at(-4.4, 0.3), at(-7, 3.4), at(-10.4, 3.4), at(-8.6, 0), at(-10.4, -3.4), at(-7, -3.4), at(-4.4, -0.3)]);
    return poly(head) + poly(fin);
  }
  const draw = () => arrowFront.setAttribute("d", arrow(yaw.x));
  draw();

  const B = register(stage, (dt) => { const m = stepS(yaw, dt); draw(); return m; });
  bag.add(B.unregister);

  function point(q) {
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], TOP), from = Math.atan2(y, x), d = Math.hypot(x, y);
      yaw.t = yaw.x + Math.atan2(Math.sin(from - yaw.x), Math.cos(from - yaw.x));
      const kmh = Math.round(clamp(60 - d * 1.4, 5, 60));
      read.textContent = `wind from the ${DIRS[(Math.round(from / (Math.PI / 4)) + 8) % 8]} · ${kmh} km/h`;
    } else { yaw.t = yaw.x + Math.atan2(Math.sin(NORTH - yaw.x), Math.cos(NORTH - yaw.x)); read.textContent = "rest"; }
    // looser on its pivot, the more it overshoots and wobbles
    yaw.c = loose;
    arrowFront.classList.toggle("hi", !!q);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { loose = v; yaw.c = v; }, destroy: bag.dispose };
}

hairline({
  name: "weathervane",
  means: "A weathervane on a roof: bring the pointer near and its arrow swings round to point into it, wobbling; leave and it turns back north.",
  rules: [1, 3, 7, 8],
  range: [9, 4.5, 2],
  mount,
});
