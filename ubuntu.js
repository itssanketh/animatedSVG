/**
 * Ubuntu: the Circle of Friends as a thick plate, facing you, with nothing
 * under it: three heads and the three arms of the ring between them. Hover the
 * mark and its six pieces drift apart, outwards from its centre, staggered from
 * the piece nearest the pointer; leave and they come back together. The slider
 * is the stagger, in ms. A tribute: the mark belongs to Canonical.
 *
 * Each piece is an extruded plate: its back face, the sides between, then its
 * front face. The hit test is a fixed disc round the mark's resting centre.
 */
const { clamp, lerp, mk, poly, rad, register, tdone, tset, tval, tween, disposer, pointer } = HL;

const K = 92, CX = 202, CY = 158, T = 7, RI = 0.5, RO = 0.72, RH = 0.19, RC = 0.93, GAP = 13, APART = 0.2;
// the six pieces round the ring, by the angle they sit at: head, arm, head, arm, head, arm
const PIECES = [-60, 0, 60, 120, 180, 240];

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
const arc = (a0, a1) => {
  const o = [], n = 28;
  for (let k = 0; k <= n; k++) { const a = rad(lerp(a0, a1, k / n)); o.push([RO * Math.cos(a), RO * Math.sin(a)]); }
  for (let k = n; k >= 0; k--) { const a = rad(lerp(a0, a1, k / n)); o.push([RI * Math.cos(a), RI * Math.sin(a)]); }
  return o;
};
const disc = (cx, cy, r) => Array.from({ length: 40 }, (_, k) => [cx + r * Math.cos((k / 40) * 2 * Math.PI), cy + r * Math.sin((k / 40) * 2 * Math.PI)]);
const SHAPES = PIECES.map((a, i) => i % 2 ? arc(a - 60 + GAP, a + 60 - GAP) : disc(RC * Math.cos(rad(a)), RC * Math.sin(rad(a)), RH));

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let stag = value;

  const g = mk("g", {}, svg);
  const pieces = PIECES.map((a, i) => ({ a: rad(a), el: plate(g), out: tween(0) }));
  pieces[4].el.face.classList.add("hi");

  let drawn = "";
  function draw(now) {
    const key = pieces.map((p) => tval(p.out, now).toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    pieces.forEach((p, i) => {
      const o = tval(p.out, now) * APART, du = o * Math.cos(p.a), dv = o * Math.sin(p.a);
      setPlate(p.el, SHAPES[i].map(([u, v]) => [u + du, v + dv]), 0, T);
    });
  }
  draw(performance.now());

  const B = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ draw(now); return !pieces.every((p) => tdone(p.out, now)); });
  bag.add(B.unregister);

  // the hit test: a fixed disc round the resting mark; the nearest piece by angle starts the spread
  let on = null;
  function hover(p) {
    const u = p ? (p[0] - CX) / K : 0, v = p ? (CY - p[1]) / K : 0, inside = !!p && Math.hypot(u, v) < RC + RH + 0.1;
    const from = inside ? Math.round(((Math.atan2(v, u) * 180) / Math.PI + 60 + 360) % 360 / 60) % 6 : 0;
    if (inside === on) return;
    on = inside;
    const now = performance.now();
    pieces.forEach((pc, i) => { const d = Math.abs(i - from); tset(pc.out, inside ? 1 : 0, now, Math.min(d, 6 - d) * stag); });
    read.textContent = inside ? "apart" : "rest";
    B.wake();
  }
  hover(null);

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { stag = clamp(v, 0, 120); }, destroy: bag.dispose };
}

hairline({
  name: "ubuntu",
  means: "Ubuntu's Circle of Friends: hover it and the three heads and three arms drift apart; leave and they come back together.",
  rules: [1, 2, 8, 10],
  range: [0, 40, 80],
  mount,
});
