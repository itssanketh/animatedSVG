/**
 * Fedora: the speech bubble, round with one square corner, as a thick plate
 * facing you with nothing under it, its f raised from the face. Hover the
 * bubble and the bar holds still while the stem leaves the f, runs once round
 * an infinity sign like a loader, and curls back into place; once per visit.
 * The slider is how long the run takes, in ms. A tribute: the mark belongs to Red Hat and the Fedora
 * Project.
 *
 * Bubble and f are extruded plates: back face, sides, front face. The hit test
 * is a fixed disc round the bubble's resting centre.
 */
const { bezier, clamp, lerp, mk, poly, rad, register, tdone, tset, tween, disposer, pointer } = HL;

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
  // the loop: the bar holds still while the stem leaves the f, runs once round an infinity sign like a loader, and curls back in
  // where each point of the stem sits along it, 0 at the hook to 1 at the tail
  const along = [0];
  for (let i = 1; i < STEM.length; i++) along.push(along[i - 1] + Math.hypot(STEM[i][0] - STEM[i - 1][0], STEM[i][1] - STEM[i - 1][1]));
  const len = along[STEM.length - 1];
  /** The infinity sign (Bernoulli's lemniscate) at angle a, about the f's middle. */
  const INF = (a) => { const q = 1 + Math.sin(a) ** 2; return [0.07 + (0.72 * Math.cos(a)) / q, (0.72 * Math.sin(a) * Math.cos(a)) / q]; };
  // the stem keeps its own length on the sign: the lemniscate is 5.244 times its half-width round
  const SPAN = (2 * Math.PI * len) / (5.244 * 0.72);
  setPlate(bar, f[0][1], T, T + 4);

  // the tween is the clock (it lands at once under reduced motion); the run itself eases in and out, at a loader's even pace
  const pace = bezier(0.45, 0, 0.35, 1);
  let loop = tween(0, dur), t0 = 0, drawn = NaN;
  function draw(now) {
    const t = tdone(loop, now) ? 0 : Math.round(pace(clamp((now - t0) / dur, 0, 1)) * 1000) / 1000;
    if (t === drawn) return;
    drawn = t;
    // how far the stem has left the f, and where its head is on the sign: it laps the sign in the first four fifths,
    // back on the stretch it left from, then eases into the f the way it came out
    const w = Math.min(1, t * 5, (1 - t) * 5), on = w * w * (3 - 2 * w), head = Math.PI / 4 - 2 * Math.PI * Math.min(1, t / 0.8);
    let c = STEM.map(([u, v], i) => { const [x, y] = INF(head + (SPAN * along[i]) / len); return [lerp(u, x, on), lerp(v, y, on)]; });
    // half way between the f and the sign the blended line can curl tighter than the stroke is wide: ease its bends there, only there
    const ease = on * (1 - on) * 4;
    for (let r = 0; r < 6 && ease > 0.01; r++) c = c.map((p, i) => i === 0 || i === c.length - 1 ? p : [p[0] + ease * 0.5 * ((c[i - 1][0] + c[i + 1][0]) / 2 - p[0]), p[1] + ease * 0.5 * ((c[i - 1][1] + c[i + 1][1]) / 2 - p[1])]);
    setPlate(stem, ribbon(c, 0.075), T, T + 4);
  }
  draw(performance.now());

  const B = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ draw(now); return !tdone(loop, now); });
  bag.add(B.unregister);

  // the hit test: a fixed disc round the bubble; entering it starts one loop, unless one is still playing
  let on = false;
  function hover(p) {
    const inside = !!p && Math.hypot((p[0] - CX) / K, (CY - p[1]) / K) < 1.05, now = performance.now();
    if (inside === on) return;
    on = inside;
    if (inside && tdone(loop, now)) { loop = tween(0, dur); tset(loop, 1, now, 0); t0 = now; }
    read.textContent = inside ? "loop" : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { dur = clamp(v, 800, 3200); }, destroy: bag.dispose };
}

hairline({
  name: "fedora",
  means: "Fedora's bubble and its f: hover it and the f's stem runs once round an infinity sign, then curls back into place.",
  rules: [1, 8, 10],
  range: [1200, 1800, 2600],
  mount,
});
