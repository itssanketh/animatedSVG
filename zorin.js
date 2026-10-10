/**
 * Zorin: the mark's four bars, a bar on top, two wedges meeting in the middle
 * and a bar underneath, as thick plates facing you with nothing under them.
 * The pointer's x wrings the mark like a cloth: each bar turns about the mark's
 * upright middle line, the top bar one way, the bottom bar the other, the
 * wedges between them a third as far, opposite ways too, so the bars swing edge-on and show their
 * thickness; it springs back flat when the pointer leaves. The read-out says
 * how far it is wrung; the slider is the widest twist, in degrees. A tribute:
 * the mark belongs to Zorin OS.
 *
 * Each bar is an extruded plate turned in three dimensions, then drawn the same
 * oblique way as the others: the face turned away, the sides from far to near,
 * then the face turned toward you. The hit test is a fixed box round the mark's
 * resting outline.
 */
const { clamp, mk, poly, rad, register, spring, stepS, disposer, pointer } = HL;

const K = 112, CX = 202, CY = 160, T = 12;
// the four bars, each one outline in the mark's own units, from the simple-icons drawing of the mark
const BARS = [
  [[-0.727, -0.631], [-0.546, -0.945], [0.546, -0.945], [0.727, -0.631]],
  [[1.091, 0.0], [0.908, -0.317], [-0.253, -0.317], [0.908, 0.317]],
  [[-1.091, 0.0], [-0.908, 0.317], [0.253, 0.317], [-0.908, -0.317]],
  [[-0.727, 0.631], [-0.546, 0.945], [0.546, 0.945], [0.727, 0.631]],
].map((pts) => ({ pts, h: pts.reduce((t, p) => t + p[1], 0) / pts.length }));

/** A point of a bar turned by angle a about the upright line u = 0 through the plate's middle depth, on screen.
 * The turn narrows the bar across; how far the turn carries a point toward you only counts a little (DEEP), so the
 * bars stay level and swing edge-on instead of slanting, while the plate's own thickness still leans down and left. */
const DEEP = 0.16;
const S = (u, v, d, a) => {
  const x = u * K, z = d - T / 2, c = Math.cos(a), s = Math.sin(a), x2 = x * c - z * s, z2 = x * s * DEEP + z * c + T / 2;
  return [CX + x2 - z2 * 0.7, CY - v * K + z2 * 0.5];
};
/** A turning plate: the face turned away, the sides, the face turned toward you, each a path. */
const plate = (g) => ({ away: mk("path", { class: "sil" }, g), side: mk("path", { class: "fo" }, g), toward: mk("path", { class: "sil" }, g) });
/** Draws a plate of outline pts (u, v), T deep, turned by a. */
function setPlate(pl, pts, a) {
  const f = pts.map(([u, v]) => S(u, v, T, a)), b = pts.map(([u, v]) => S(u, v, 0, a)), front = Math.cos(a) >= 0;
  // the sides, far ones first: a side is as near as its middle is to the front after the turn
  const sides = pts.map((p, i) => { const j = (i + 1) % pts.length, u = (p[0] + pts[j][0]) / 2; return { d: u * Math.sin(a), q: poly([f[i], f[j], b[j], b[i]]) }; });
  pl.away.setAttribute("d", poly(front ? b : f));
  pl.side.setAttribute("d", sides.sort((x, y) => x.d - y.d).map((x) => x.q).join(""));
  pl.toward.setAttribute("d", poly(front ? f : b));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;

  const g = mk("g", {}, svg);
  const bars = BARS.map((b) => ({ ...b, el: plate(g) }));
  // the bright edge: the bar at the pointer's height while it is over the mark, the top bar at rest
  let lit = null;
  const light = (b) => { if (b !== lit) { lit = b; bars.forEach((x) => x.el.toward.classList.toggle("hi", x === b)); } };
  light(bars[3]);
  // each bar turns by how high it sits: top and bottom bars fully, opposite ways; the two wedges about a third, opposite ways too
  const top = Math.max(...bars.map((b) => Math.abs(b.h)));
  const twist = spring(0, { eps: 0.05 });

  let drawn = NaN;
  function draw() {
    const tw = Math.round(twist.x * 10) / 10;
    if (tw === drawn) return;
    drawn = tw;
    for (const b of bars) setPlate(b.el, b.pts, rad(tw * Math.sign(b.h) * (0.35 + 0.65 * (Math.abs(b.h) / top))));
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(twist, dt); draw(); return m; });
  bag.add(B.unregister);

  // the hit test: a fixed box round the resting mark; the pointer's x across it sets the twist
  function wring(p) {
    const u = p ? (p[0] - CX) / K : 0, v = p ? (CY - p[1]) / K : 0, on = !!p && Math.abs(u) < 1.3 && Math.abs(v) < 1.15;
    twist.t = on ? clamp(u, -1, 1) * reach : 0;
    light(on ? bars.reduce((a, b) => (Math.abs(b.h - v) < Math.abs(a.h - v) ? b : a)) : bars[3]);
    read.textContent = on ? `twist ${Math.round(twist.t)}°` : "rest";
    B.wake();
  }
  wring(null);

  bag.add(pointer(stage, { move: wring, leave: () => wring(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "zorin",
  means: "Zorin's four bars: the pointer's x wrings the mark, top and bottom bars turning opposite ways, and it springs back flat.",
  rules: [1, 3, 8, 10],
  range: [35, 60, 85],
  mount,
});
