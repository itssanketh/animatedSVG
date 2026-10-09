/**
 * Fedora: the speech bubble, round with one square corner, as a thick plate
 * facing you with nothing under it, its f raised from the face. Hover the
 * bubble and the f slithers like a snake, a wave running down it from hook to
 * tail, and settles back where it was; once per visit, never on a loop. The
 * slider is how long the slither takes, in ms. A tribute: the mark belongs to Red Hat and the Fedora
 * Project.
 *
 * Bubble and f are extruded plates: back face, sides, front face. The hit test
 * is a fixed disc round the bubble's resting centre.
 */
const { clamp, lerp, mk, poly, rad, register, tdone, tset, tval, tween, disposer, pointer } = HL;

const K = 108, CX = 200, CY = 160, T = 7;
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
/** A stroke along a centre line c, half width w, as one outline with round ends. */
function ribbon(c, w) {
  const L = [], R = [], n = c.length - 1;
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    L.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]); R.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  const cap = (p, from) => Array.from({ length: 7 }, (_, k) => { const a = Math.atan2(from[1] - p[1], from[0] - p[0]) - ((k + 1) / 8) * Math.PI; return [p[0] + w * Math.cos(a), p[1] + w * Math.sin(a)]; });
  return [...L, ...cap(c[n], L[n]), ...R.reverse(), ...cap(c[0], R[R.length - 1])];
}
/** A cubic from a to d, sampled. */
const cubic = (a, b, c, d, n = 14) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, s = 1 - t; return [0, 1].map((i) => s * s * s * a[i] + 3 * s * s * t * b[i] + 3 * s * t * t * c[i] + t * t * t * d[i]); });
/** The bubble: a circle whose lower right quarter is a square corner, softly rounded. */
const bubble = () => {
  const o = [];
  for (let k = 0; k <= 48; k++) { const a = rad(lerp(0, 270, k / 48)); o.push([Math.cos(a), Math.sin(a)]); }
  for (let k = 0; k <= 4; k++) { const a = rad(lerp(270, 360, k / 4)); o.push([0.84 + 0.16 * Math.cos(a), -0.84 + 0.16 * Math.sin(a)]); }
  return o;
};
// the f: a stem with a hook at the top, curling into a loop at its foot, and its bar
const STEM = [...cubic([0.48, 0.42], [0.3, 0.62], [0.06, 0.5], [0.06, 0.22]), ...cubic([0.06, 0.22], [0.06, -0.1], [0.06, -0.3], [-0.06, -0.44]).slice(1), ...cubic([-0.06, -0.44], [-0.22, -0.62], [-0.48, -0.42], [-0.34, -0.22]).slice(1)];
const BAR = [[-0.3, 0.04], [0.4, 0.04]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let dur = value;

  const g = mk("g", {}, svg);
  const bub = plate(g), stem = plate(g), bar = plate(g);
  stem.face.classList.add("hi"); bar.face.classList.add("hi");
  setPlate(bub, bubble(), 0, T);
  const f = [[bar, ribbon(BAR, 0.075)], [stem, ribbon(STEM, 0.075)]];
  // the slither: a wave runs down the f from hook to tail, swelling then dying away, so the f ends where it began
  const bend = (v, t) => 0.09 * Math.sin(Math.PI * t) * Math.sin(7 * v + 4 * Math.PI * t);
  const BEND_BAR = BAR[0][1];

  let wave = tween(0, dur), drawn = NaN;
  function draw(now) {
    const t = Math.round(tval(wave, now) * 1000) / 1000;
    if (t === drawn) return;
    drawn = t;
    // the bar rides the stem where it crosses it, so the f never comes apart
    setPlate(bar, f[0][1].map(([u, v]) => [u + bend(BEND_BAR, t), v]), T, T + 4);
    setPlate(stem, f[1][1].map(([u, v]) => [u + bend(v, t), v]), T, T + 4);
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => { draw(now); return !tdone(wave, now); });
  bag.add(B.unregister);

  // the hit test: a fixed disc round the bubble; entering it starts one slither, unless one is still playing
  let on = false;
  function hover(p) {
    const inside = !!p && Math.hypot((p[0] - CX) / K, (CY - p[1]) / K) < 1.05, now = performance.now();
    if (inside === on) return;
    on = inside;
    if (inside && tdone(wave, now)) { wave = tween(0, dur); tset(wave, 1, now, 0); }
    read.textContent = inside ? "slither" : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { dur = clamp(v, 600, 2400); }, destroy: bag.dispose };
}

hairline({
  name: "fedora",
  means: "Fedora's bubble and its f: hover it and the f slithers like a snake and settles back into place.",
  rules: [1, 8, 10],
  range: [900, 1400, 2000],
  mount,
});
