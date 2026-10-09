/**
 * NixOS: the snowflake of six lambdas as thick plates, facing you, with nothing
 * under them. Hover it and the lambdas drift apart, each out along its own arm,
 * staggered from the one nearest the pointer; leave and they lock back
 * together. The slider is the stagger, in ms. A tribute: the mark belongs to
 * the NixOS project.
 *
 * Each lambda is one extruded plate: back face, sides, front face. The hit
 * test is a fixed disc round the mark's resting centre.
 */
const { clamp, mk, poly, register, tdone, tset, tval, tween, disposer, pointer } = HL;

const K = 118, CX = 202, CY = 160, T = 7, APART = 0.14;

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
// the six lambdas, each one outline in the mark's own units, from the simple-icons drawing of the mark
const LAMBDAS = [
  [[-0.423, 0.946], [-0.547, 0.946], [-0.607, 0.841], [-0.466, 0.594], [-0.751, 0.595], [-0.871, 0.382], [0.192, 0.382], [0.069, 0.594], [-0.221, 0.595], [-0.423, 0.946]],
  [[0.139, 0.946], [-0.105, 0.944], [0.426, 0.023], [0.548, 0.236], [0.403, 0.487], [0.607, 0.837], [0.545, 0.945], [0.423, 0.945], [0.281, 0.699], [0.139, 0.946]],
  [[0.765, 0.565], [0.233, -0.356], [0.479, -0.355], [0.624, -0.104], [1.029, -0.105], [1.091, 0.002], [1.03, 0.107], [0.746, 0.108], [0.889, 0.355], [0.765, 0.565]],
  [[-0.233, 0.356], [-0.479, 0.355], [-0.624, 0.104], [-1.029, 0.106], [-1.091, -0.002], [-1.03, -0.107], [-0.746, -0.108], [-0.889, -0.354], [-0.765, -0.565], [-0.233, 0.356]],
  [[-0.425, -0.023], [-0.547, -0.236], [-0.403, -0.487], [-0.606, -0.837], [-0.544, -0.945], [-0.423, -0.945], [-0.28, -0.699], [-0.138, -0.946], [0.106, -0.944], [-0.425, -0.023]],
  [[-0.193, -0.38], [-0.07, -0.592], [0.221, -0.593], [0.422, -0.944], [0.546, -0.944], [0.607, -0.839], [0.465, -0.592], [0.75, -0.593], [0.87, -0.38], [-0.193, -0.38]],
].map((pts) => {
  const c = [0, 1].map((i) => pts.reduce((t, p) => t + p[i], 0) / pts.length), l = Math.hypot(...c);
  return { pts: pts.slice(0, -1), out: [c[0] / l, c[1] / l], ang: Math.atan2(c[1], c[0]) };
});

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let stag = value;

  const g = mk("g", {}, svg);
  const ls = LAMBDAS.map((l) => ({ ...l, el: plate(g), tw: tween(0) }));
  ls[0].el.face.classList.add("hi");

  let drawn = "";
  function draw(now) {
    const key = ls.map((l) => tval(l.tw, now).toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    for (const l of ls) {
      const o = tval(l.tw, now) * APART, mv = ([u, v]) => [u + o * l.out[0], v + o * l.out[1]];
      setPlate(l.el, l.pts.map(mv), 0, T);
    }
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => { draw(now); return !ls.every((l) => tdone(l.tw, now)); });
  bag.add(B.unregister);

  // the hit test: a fixed disc round the resting mark; the lambda nearest the pointer by angle starts the spread
  let on = null;
  function hover(p) {
    const u = p ? (p[0] - CX) / K : 0, v = p ? (CY - p[1]) / K : 0, inside = !!p && Math.hypot(u, v) < 1.1;
    if (inside === on) return;
    on = inside;
    const now = performance.now(), pa = Math.atan2(v, u), gap = (l) => Math.abs(Math.atan2(Math.sin(l.ang - pa), Math.cos(l.ang - pa)));
    const from = ls.indexOf(ls.reduce((a, b) => (gap(b) < gap(a) ? b : a)));
    ls.forEach((l, k) => { const d = Math.round(Math.abs(Math.atan2(Math.sin(l.ang - ls[from].ang), Math.cos(l.ang - ls[from].ang))) / (Math.PI / 3)); tset(l.tw, inside ? 1 : 0, now, d * stag); });
    read.textContent = inside ? "apart" : "rest";
    B.wake();
  }
  hover(null);

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { stag = clamp(v, 0, 120); }, destroy: bag.dispose };
}

hairline({
  name: "nixos",
  means: "NixOS's snowflake of six lambdas: hover it and they drift apart along their arms; leave and they lock back together.",
  rules: [1, 2, 8, 10],
  range: [0, 40, 80],
  mount,
});
