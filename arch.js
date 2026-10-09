/**
 * Arch: the peak, a tall triangle with an arch cut from its foot and a notch
 * in its left flank, as three thin layers, facing you, with nothing under them. The
 * pointer's x scrubs the gap between the layers, which part on a spring; its
 * height picks a layer, which takes the bright edge. The read-out names the
 * layer and the gap; the slider is the widest gap. A tribute: the mark belongs
 * to the Arch Linux project.
 *
 * Each layer is an extruded plate: back face, sides, front face, painted back to
 * front. The hit test is a fixed band across the peak's resting outline.
 */
const { clamp, lerp, mk, poly, rad, register, spring, stepS, disposer, pointer } = HL;

const K = 130, CX = 218, CY = 262, T = 4, LAYERS = 3, REST = 3;
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
/** The peak's outline, from the apex down the right flank, under the arch, up the left flank past the notch. */
function peak() {
  const o = [], side = (s, t) => [s * 0.62 * t * (0.82 + 0.18 * t), 1.6 * (1 - t)];
  for (let k = 0; k <= 16; k++) o.push(side(1, k / 16));
  o.push([0.36, 0]);
  for (let k = 0; k <= 16; k++) { const a = rad(lerp(0, 180, k / 16)); o.push([0.3 * Math.cos(a) + 0.03, 0.48 * Math.sin(a) * (a < Math.PI / 2 ? 1 : 0.94)]); }
  o.push([-0.36, 0]);
  for (let k = 16; k >= 0; k--) {
    const t = k / 16, p = side(-1, t);
    if (t < 0.5 && t > 0.43) { o.push([p[0] + 0.2, p[1] - 0.08]); continue; }
    o.push(p);
  }
  return o;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let wide = value;

  const g = mk("g", {}, svg);
  const shape = peak(), layers = Array.from({ length: LAYERS }, () => plate(g));
  const gap = spring(REST, { eps: 0.02 });
  let drawn = NaN, pick = -1;
  function draw() {
    const gp = Math.round(gap.x * 50) / 50;
    if (gp === drawn) return;
    drawn = gp;
    // back layer first; each layer sits gp in front of the one behind it
    layers.forEach((el, i) => setPlate(el, shape, i * (T + gp), i * (T + gp) + T));
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(gap, dt); draw(); return m; });
  bag.add(B.unregister);

  // the hit band: across the peak's resting outline, from its foot to its apex
  const xl = W(-0.8, 0.8, 0)[0], xr = W(0.8, 0.8, 0)[0], yt = W(0, 1.7, 0)[1], yb = W(0, -0.1, 0)[1];
  function scrub(p) {
    const on = !!p && p[0] > xl - 30 && p[0] < xr + 30 && p[1] > yt - 20 && p[1] < yb + 30;
    gap.t = on ? lerp(1, wide, clamp((p[0] - xl) / (xr - xl), 0, 1)) : REST;
    const i = on ? clamp(Math.floor(((yb - p[1]) / (yb - yt)) * LAYERS), 0, LAYERS - 1) : -1;
    if (i !== pick) { pick = i; layers.forEach((el, k) => el.face.classList.toggle("hi", k === (i < 0 ? LAYERS - 1 : i))); }
    read.textContent = on ? `layer ${i + 1} · ${Math.round(gap.t)}` : "rest";
    B.wake();
  }
  scrub(null);

  bag.add(pointer(stage, { move: scrub, leave: () => scrub(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { wide = v; }, destroy: bag.dispose };
}

hairline({
  name: "arch",
  means: "Arch's peak as three layers: the pointer's x pulls the layers apart and its height picks one to brighten.",
  rules: [1, 3, 6, 10],
  range: [6, 12, 18],
  mount,
});
