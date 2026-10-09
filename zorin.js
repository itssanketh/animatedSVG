/**
 * Zorin: the mark's four bars, a bar on top, two wedges meeting in the middle
 * and a bar underneath, as thick plates facing you with nothing under them.
 * The pointer's x shears the stack on a spring: the higher a bar sits, the
 * farther it slides toward the pointer, the lower ones away, and it settles
 * square when the pointer leaves. The slider is the widest slide. A tribute:
 * the mark belongs to Zorin OS.
 *
 * Each bar is an extruded plate: back face, sides, front face. The hit test is
 * a fixed box round the mark's resting outline.
 */
const { clamp, mk, poly, register, spring, stepS, disposer, pointer } = HL;

const K = 112, CX = 202, CY = 160, T = 7;
// the four bars, each one outline in the mark's own units, from the simple-icons drawing of the mark
const BARS = [
  [[-0.727, -0.631], [-0.546, -0.945], [0.546, -0.945], [0.727, -0.631]],
  [[1.091, 0.0], [0.908, -0.317], [-0.253, -0.317], [0.908, 0.317]],
  [[-1.091, 0.0], [-0.908, 0.317], [0.253, 0.317], [-0.908, -0.317]],
  [[-0.727, 0.631], [-0.546, 0.945], [0.546, 0.945], [0.727, 0.631]],
].map((pts) => ({ pts, h: pts.reduce((t, p) => t + p[1], 0) / pts.length }));

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

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;

  const g = mk("g", {}, svg);
  const bars = BARS.map((b) => ({ ...b, el: plate(g) }));
  bars[3].el.face.classList.add("hi");
  const shear = spring(0, { eps: 0.002 });

  let drawn = NaN;
  function draw() {
    const s = Math.round(shear.x * 500) / 500;
    if (s === drawn) return;
    drawn = s;
    for (const b of bars) setPlate(b.el, b.pts.map(([u, v]) => [u + s * b.h, v]), 0, T);
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(shear, dt); draw(); return m; });
  bag.add(B.unregister);

  // the hit test: a fixed box round the resting mark; the pointer's x across it sets the shear
  function slide(p) {
    const u = p ? (p[0] - CX) / K : 0, v = p ? (CY - p[1]) / K : 0, on = !!p && Math.abs(u) < 1.3 && Math.abs(v) < 1.15;
    shear.t = on ? clamp(u, -1, 1) * reach : 0;
    read.textContent = on ? `slide ${Math.round(shear.t * 100)}` : "rest";
    B.wake();
  }
  slide(null);

  bag.add(pointer(stage, { move: slide, leave: () => slide(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "zorin",
  means: "Zorin's four bars: the pointer's x shears the stack, the top bar sliding most, and it settles square when you leave.",
  rules: [1, 3, 8, 10],
  range: [0.15, 0.25, 0.35],
  mount,
});
