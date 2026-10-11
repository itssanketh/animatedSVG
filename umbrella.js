/**
 * Umbrella: an umbrella seen from the side, as you would draw one: a dome of a canopy in panels, its seams curving down
 * from the tip to the rib ends, its hem a row of scallops between them, a point on top, a straight shaft and a hooked
 * handle. At rest it is furled, its canopy folded down tight round the shaft. Bring the pointer near and it opens: the
 * ribs spread, the canopy rises into its dome and the scallops sag in between, and it leans over toward the pointer as
 * if to keep it dry; leave and it folds shut and stands up straight. The canopy takes the bright edge while it is open.
 * The read-out says how open it is and which way it leans; the slider is how far it leans.
 *
 * The canopy's outline is the dome's two outer meridians and the scalloped hem; the seams are the meridians between;
 * the shaft and handle are one slim band. The whole umbrella turns about its handle. The pointer's place across the
 * stage sets the lean.
 */
const { clamp, lerp, mk, open, poly, rad, spring, stepS, disposer, pointer, register } = HL;

const GRIP = [200, 268], SHAFT = 196, RIBS = [-90, -55, -20, 20, 55, 90];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let lean = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const stick = el("sil"), canopy = el("sil"), seams = el("nf"), point = el("sil");
  const op = spring(0, { k: 40, c: 11, eps: 0.002 }), tilt = spring(0, { k: 30, c: 10, eps: 0.0005 });
  /** A slim band along a line of points, w wide each side. */
  const band = (ps, w) => { const side = (s) => ps.map((p, k) => { const a = ps[Math.max(0, k - 1)], b = ps[Math.min(ps.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - (dy / l) * w * s, p[1] + (dx / l) * w * s]; }); return poly([...side(1), ...side(-1).reverse()]); };
  function draw() {
    const o = op.x, c = Math.cos(tilt.x), s = Math.sin(tilt.x);
    // everything is laid out upright with the grip at the origin, then turned about the grip by the lean
    const R = ([x, y]) => [GRIP[0] + x * c - y * s, GRIP[1] + x * s + y * c];
    const top = -SHAFT, W = lerp(13, 118, o), H = lerp(150, 78, o);
    // a point on the dome along the meridian at angle phi (side to side), t from the top (0) to the hem (1)
    const dome = (phi, t) => { const a = (t * Math.PI) / 2; return [W * Math.sin(rad(phi)) * Math.sin(a), top + H * (1 - Math.cos(a)) + 7 * o * Math.cos(rad(phi)) * Math.sin(a)]; };
    const tips = RIBS.map((p) => dome(p, 1)), merid = (phi) => Array.from({ length: 13 }, (_, k) => dome(phi, k / 12));
    // the hem: a scallop sagging up between each pair of rib ends
    const scallops = tips.slice(0, -1).flatMap((p, k) => { const q = tips[k + 1], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - lerp(2, 16, o)]; return Array.from({ length: 9 }, (_, i) => { const u = (i + 1) / 9; return [(1 - u) * (1 - u) * p[0] + 2 * (1 - u) * u * m[0] + u * u * q[0], (1 - u) * (1 - u) * p[1] + 2 * (1 - u) * u * m[1] + u * u * q[1]]; }); });
    canopy.setAttribute("d", poly([...merid(-90), ...scallops, ...merid(90).reverse()].map(R)));
    seams.setAttribute("d", RIBS.slice(1, -1).map((p) => open(merid(p).map(R))).join(""));
    point.setAttribute("d", band([[0, top - 13], [0, top + 1]].map(R), 1.6));
    // the shaft down from the canopy, then the handle hooking round
    const hook = Array.from({ length: 13 }, (_, k) => { const t = Math.PI * (k / 12); return [-11 + 11 * Math.cos(t), 11 * Math.sin(t)]; });
    stick.setAttribute("d", band([[0, top], [0, -1], ...hook.slice(1)].map(R), 2.4));
  }
  draw();

  const B = register(stage, (dt) => { const m = [stepS(op, dt), stepS(tilt, dt)].some(Boolean); draw(); return m; });
  bag.add(B.unregister);

  function pointAt(q) {
    if (q) {
      const f = clamp((q[0] - 200) / 170, -1, 1);
      op.t = 1; tilt.t = rad(lean) * f;
      read.textContent = `open · ${Math.abs(f) < 0.15 ? "standing straight" : f < 0 ? "leaning left" : "leaning right"}`;
    } else { op.t = 0; tilt.t = 0; read.textContent = "rest"; }
    canopy.classList.toggle("hi", !!q);
    B.wake();
  }
  pointAt(null);

  bag.add(pointer(stage, { move: pointAt, leave: () => pointAt(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lean = v; }, destroy: bag.dispose };
}

hairline({
  name: "umbrella",
  means: "An umbrella: bring the pointer near and it opens into its scalloped dome and leans over toward the pointer; leave and it folds shut.",
  rules: [1, 2, 7, 8],
  range: [6, 14, 24],
  mount,
});
