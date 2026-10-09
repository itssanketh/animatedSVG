/**
 * Manjaro: the mark's four bars, a tall one on the left, a lintel across the
 * top and two short ones under it, as thick plates facing you, with nothing under them.
 * The pointer picks a bar: it slides out toward the eye and takes the bright
 * edge, and the others follow less the farther they stand from it, staggered
 * outwards on the 700ms curve. The read-out names the bar; the slider is the
 * stagger, in ms. A tribute: the mark belongs to the Manjaro project.
 *
 * Each bar is an extruded plate: back face, sides, front face. The hit test is
 * each bar's resting outline on screen.
 */
const { clamp, fillet, mk, poly, register, tdone, tset, tval, tween, disposer, pointer } = HL;

const K = 62, CX = 92, CY = 270, T = 7, OUT = 16, REST = [0.35, 0, 0.1, 0.05];
/** The screen point of (u, v) on the plate, d deep: the front leans down and left of the back. */
const W = (u, v, d) => [CX + u * K - d * 0.7, CY - v * K + d * 0.5];
// bars in the mark's own plane, a across and b up, in cells: [a0, b0, a1, b1]
const BARS = [[0, 0, 1, 3.6], [1.3, 2.6, 3.6, 3.6], [1.3, 0, 2.3, 2.3], [2.6, 0, 3.6, 2.3]];

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
  const bag = disposer(); let stag = value;

  const g = mk("g", {}, svg);
  const bars = BARS.map(([a0, b0, a1, b1], i) => {
    const pts = fillet([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], [0.12, 0.12, 0.12, 0.12], 4);
    return { i, pts, mid: [(a0 + a1) / 2, (b0 + b1) / 2], el: plate(g), out: tween(REST[i]) };
  });
  let drawn = "";
  function draw(now) {
    const key = bars.map((b) => tval(b.out, now).toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    for (const b of bars) { const o = tval(b.out, now) * OUT; setPlate(b.el, b.pts, o, o + T); }
  }
  draw(performance.now());

  const B = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ draw(now); return !bars.every((b) => tdone(b.out, now)); });
  bag.add(B.unregister);

  // the hit test: each bar's resting outline on screen, as its box
  const boxes = bars.map((b) => { const s = b.pts.flatMap(([u, v]) => [W(u, v, 0), W(u, v, T)]), xs = s.map((p) => p[0]), ys = s.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const hit = ([x, y]) => { let best = -1, bd = 1e9; boxes.forEach((q, i) => { if (x > q[0] && x < q[2] && y > q[1] && y < q[3]) { const d = Math.hypot(x - (q[0] + q[2]) / 2, y - (q[1] + q[3]) / 2); if (d < bd) { bd = d; best = i; } } }); return best; };
  let act = -2;
  function pick(i) {
    if (i === act) return;
    const now = performance.now(), from = bars[i >= 0 ? i : Math.max(act, 0)];
    act = i;
    for (const b of bars) {
      const d = Math.hypot(b.mid[0] - from.mid[0], b.mid[1] - from.mid[1]);
      tset(b.out, i < 0 ? REST[b.i] : b.i === i ? 1 : Math.max(0, 0.45 - d * 0.14), now, d * stag);
      b.el.face.classList.toggle("hi", i < 0 ? b.i === 0 : b.i === i);
    }
    read.textContent = i < 0 ? "rest" : `bar ${i + 1}`;
    B.wake();
  }
  pick(-1);

  bag.add(pointer(stage, { move: (p) => pick(hit(p)), leave: () => pick(-1) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { stag = clamp(v, 0, 200); }, destroy: bag.dispose };
}

hairline({
  name: "manjaro",
  means: "Manjaro's four bars: the bar under the pointer slides out toward you, the others less the farther they stand.",
  rules: [1, 2, 8, 10],
  range: [0, 50, 110],
  mount,
});
