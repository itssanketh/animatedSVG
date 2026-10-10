/**
 * Debian: the swirl as a thick plate, facing you, with nothing under it. The
 * pointer turns it like a dial: the swirl follows the pointer's angle round its
 * centre on a spring, as far as the slider allows, and settles back when the
 * pointer leaves. The read-out says how far it has turned. A tribute: the mark
 * belongs to the Debian project.
 *
 * The swirl is one outline, a stroke of changing width along a spiral, extruded:
 * back face, sides, front face. The hit test is the swirl's fixed centre on
 * screen.
 */
const { clamp, mk, poly, rad, register, spring, stepS, disposer, pointer } = HL;

const K = 118, CX = 202, CY = 160, T = 7, REST = -8;
/** The screen point of (u, v) on the plate, d deep: the front leans down and left of the back. */
const W = (u, v, d) => [CX + u * K - d * 0.7, CY - v * K + d * 0.5];

/** An extruded plate: back face, sides, front face, each a path. */
const plate = (g) => ({ back: mk("path", { class: "sil" }, g), side: mk("path", { class: "fo" }, g), face: mk("path", { class: "sil" }, g) });
/** Draws a plate of outline pts (u, v) between depths d0 (back) and d1 (front). */
function setPlate(pl, pts, d0, d1) {
  const f = pts.map(([u, v]) => W(u, v, d1)), b = pts.map(([u, v]) => W(u, v, d0));
  pl.back.setAttribute("d", poly(b));
  pl.side.setAttribute("d", f.map((p, i) => { const j = (i + 1) % f.length; return poly([p, f[j], b[j], b[i]]); }).join(""));
  pl.face.setAttribute("d", poly(f));
}
/** The swirl's outline: a spiral from the curl at the middle out to the tail, wide where it sweeps round, thin at both ends. */
function swirl() {
  const c = [], w = [], n = 90;
  for (let k = 0; k <= n; k++) {
    const t = k / n, a = rad(70 + 560 * t), r = 0.1 + 0.82 * Math.pow(t, 0.85);
    c.push([r * Math.cos(a), r * Math.sin(a)]); w.push(0.02 + 0.13 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 1.4));
  }
  const L = [], R = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    L.push([p[0] - (dy / l) * w[i], p[1] + (dx / l) * w[i]]); R.push([p[0] + (dy / l) * w[i], p[1] - (dx / l) * w[i]]);
  });
  return [...L, ...R.reverse()];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;

  const g = mk("g", {}, svg);

  const sw = plate(g), shape = swirl();
  const turn = spring(REST, { eps: 0.05 });
  let drawn = NaN;
  function draw() {
    const a = Math.round(turn.x * 10) / 10;
    if (a === drawn) return;
    drawn = a;
    const c = Math.cos(rad(a)), s = Math.sin(rad(a));
    setPlate(sw, shape.map(([u, v]) => [u * c - v * s, u * s + v * c]), 0, T);
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(turn, dt); draw(); return m; });
  bag.add(B.unregister);

  // the swirl's centre on screen never moves; the pointer's angle round it sets the turn
  const [cx, cy] = W(0, 0, T / 2);
  function dial(p) {
    let t = REST;
    if (p) { const a = (Math.atan2(cy - p[1], p[0] - cx) * 180) / Math.PI - 90; t = clamp(((a + 540) % 360) - 180, -reach, reach); }
    turn.t = t;
    sw.face.classList.toggle("hi", !!p); // the swirl takes the bright edge while the pointer turns it
    read.textContent = p ? `turn ${Math.round(t)}°` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: dial, leave: () => dial(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "debian",
  means: "Debian's swirl: it turns like a dial to follow the pointer round its centre, then settles back.",
  rules: [1, 3, 8, 10],
  range: [60, 120, 180],
  mount,
});
