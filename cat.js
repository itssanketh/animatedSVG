/**
 * Cat: a flat line cat, drawn face on, its outline measured off a reference
 * drawing: head and ears one shape, a blaze down the face between two patches,
 * spots on a shoulder and a haunch, its tail wrapped along its front over the
 * paws, the tip curled up on the left. At rest it dozes: head down, ears
 * folded out, eyes shut. Bring the pointer near and it wakes on the 700ms
 * curve, ears up, round eyes open with their pupils on the pointer, tail tip
 * lifting, and its head follows the pointer on two springs. The read-out names
 * where it watches; the slider is how far the head can go. The hit test is the
 * head's fixed centre on screen.
 */
const {
  clamp, fillet, lerp, mk, open, place, pointer, poly, rad, reducedMotion, register,
  spring, stepS, tdone, tset, tval, tween, disposer,
} = HL;

// every point below is in the reference's pixels; img() scales them onto the stage
const PX = 2.2, OX = 344, OY = 253, HC = [346, 219], REST = [-16, -16];
const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
/** Whether point q lies inside any of the loops. */
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
const img = ([x, y]) => [200 + (x - OX) * PX, 166 + (y - OY) * PX];

/** A Catmull-Rom curve through points, sampled n steps a span; closed or open. */
function smooth(pts, closed, n = 10) {
  const m = pts.length, out = [], get = (i) => pts[closed ? (i + m) % m : clamp(i, 0, m - 1)];
  for (let i = 0; i < (closed ? m : m - 1); i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  if (!closed) out.push(pts[m - 1]);
  return out;
}

// the body's sides, from under the left of the jaw round the seat (hidden by the tail) to under the right
/** Evens out measured points, a quarter to each neighbour, a few times over; the ends of an open run and any index in keep stay put. */
function relax(pts, keep = [], iters = 3, closed = false) {
  let p = pts;
  for (let t = 0; t < iters; t++) p = p.map((q, i) => {
    if (keep.includes(i) || (!closed && (i === 0 || i === p.length - 1))) return q;
    const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length];
    return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4];
  });
  return p;
}

const BODY = relax([[327, 245], [325, 250], [323, 256], [321, 263], [319.5, 272], [319, 284], [322, 300], [345, 304], [370, 300], [379.5, 290], [378.5, 276], [377, 264], [375, 256], [372.5, 248], [370.5, 243]], [5, 6, 7, 8, 9]);
const LEGS = [[[336, 274.5], [339, 286], [342.3, 298]], [[349, 272], [349, 299]], [[362.5, 275], [359, 287], [356, 298]]];
const SPOTS = [[[320, 269], [326, 272], [331, 276], [332.5, 281], [331, 286], [328, 290]], [[371.5, 244], [367.5, 248], [366, 252], [367.5, 257], [370, 262], [374, 267], [378.5, 270]]].map((c) => relax(c));
// the tail, closed: its top edge from the right haunch to the tip, round the tip, back along the floor to the haunch
const TAIL = relax([[374.6, 289], [373, 292.5], [369, 295], [364, 298], [357, 299.6], [351, 300], [344, 298.4], [337, 296], [330, 292], [324, 288.3], [320, 286.3], [314.5, 286], [310, 288], [307.7, 292], [307.5, 297], [309, 301.5], [313, 305], [318.5, 307.6], [326, 309.6], [340, 310.6], [354, 309.8], [363, 308], [370, 305], [375, 301.5], [378.5, 297], [379.5, 290]], [], 1);
// the head and ears as one outline, from the left of the chin round over the top to the right of it; each ear tip is a pair of points, so it comes out rounded
const HEAD = [[334, 241.2], [328.5, 240.2], [323, 236], [320.9, 226], [321.6, 215], [319.4, 205.5], [318.6, 202.4], [319.8, 200.9], [325, 201.4], [331, 202], [339, 200.2], [346, 199.4], [354, 199.6], [361, 200.6], [366, 198.2], [369.6, 196.1], [372.6, 196.4], [374.1, 199.5], [374.5, 208], [375, 219], [374.4, 229], [372, 235.5], [368.8, 239.4], [364, 240.7]];
const CHIN = [[349, 241.4]];
const TIPS = [[6, [316.4, 204.8]], [16, [374.8, 198.6]]];
const INNER = [[[322.6, 205.6], [330, 205.6], [324.6, 211]], [[369, 199.5], [362.4, 203.2], [368.6, 208]]];
const BLAZE = [[[343, 199.6], [343.5, 208], [343, 216], [341, 226], [338, 232], [334, 236], [330, 239]], [[349, 199.4], [349.5, 210], [350, 216], [351, 220], [353, 224], [356, 228], [361, 233], [365, 236], [368, 238.5]]].map((c) => relax(c, [], 6));
const EYES = [[336, 220.5], [359.3, 218.6]];
const WHISKERS = [[[329, 226.5], [321, 225], [312, 224]], [[329, 227.6], [322, 227.4], [315, 227]], [[328.5, 229], [321, 229.6], [314, 231]], [[366, 224], [374, 221.6], [383, 221]], [[367, 225.4], [375, 224.6], [381, 224.2]], [[367, 227], [375, 228], [381.5, 229.6]]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const g = mk("g", {}, svg);

  const body = mk("path", { class: "sil nf" }, g);
  mk("path", { d: [...LEGS, ...SPOTS].map((c) => open(smooth(c, false).map(img))).join(""), class: "nf" }, g);
  // the tail lies in front, over the paws: a fill to cover them, then its edge, open where it leaves the haunch
  const tailFill = mk("path", { class: "fo" }, g), tail = mk("path", { class: "sil nf" }, g);
  const headFill = mk("path", { class: "fo" }, g), head = mk("path", { class: "sil nf" }, g), inner = mk("path", { class: "nf" }, g);
  const blaze = mk("path", { class: "nf" }, g), whisk = mk("path", { class: "nf" }, g);
  const rims = mk("path", { class: "nf" }, g), shut = mk("path", { class: "nf" }, g), mouth = mk("path", { class: "nf" }, g);
  const pupils = [0, 1].map(() => mk("circle", { r: 5.6, class: "dot" }, g)), shine = [0, 1].map(() => mk("circle", { r: 1.9, class: "fo" }, g));
  const nose = mk("path", { class: "dot" }, g);

  // wake: asleep to awake; joy: awake to purring, eyes squeezed shut, while the pointer is at its head
  const yaw = spring(REST[0], { eps: 0.05 }), pitch = spring(REST[1], { eps: 0.05 }), wake = tween(0), joy = tween(0);
  let drawn = "", tailW = "", on = false;
  function draw(now) {
    const wk = tval(wake, now), jy = tval(joy, now);
    // awake, the tail tip wags, slowly; reduced motion keeps it still
    const wag = on && !reducedMotion() ? Math.sin((now / 1000) * 2 * Math.PI * (0.9 + jy * 0.6)) * wk : 0;
    const key = [yaw.x, pitch.x, wk, jy, wag].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;

    const tw = Math.round(wk * 40) / 40, tg = Math.round(wag * 30) / 30;
    if (tw + "," + tg !== tailW) {
      tailW = tw + "," + tg;
      // awake, the tip lifts and sways: the further left along the tail, the more
      const t = smooth(TAIL.map(([x, y]) => { const f = clamp((332 - x) / 25, 0, 1) ** 1.5; return [x - tw * f * 2 + tg * f * 3, y - tw * f * 9 - tg * f * 3.5]; }), false).map(img);
      tailFill.setAttribute("d", poly(t));
      tail.setAttribute("d", open(t));
    }

    // the head slides and tilts toward the pointer; the face slides a little further across it, as a turn would
    const sx = yaw.x * 0.18, sy = -pitch.x * 0.15 + (1 - wk) * 2.5, tilt = rad(yaw.x * 0.2 - jy * 5), /* purring, it leans its head over */ c = Math.cos(tilt), s = Math.sin(tilt);
    const fx = yaw.x * 0.09, fy = -pitch.x * 0.08;
    const H = ([x, y]) => { const u = x - HC[0], v = y - HC[1]; return img([HC[0] + sx + u * c - v * s, HC[1] + sy + u * s + v * c]); };
    const Fc = ([x, y]) => H([x + fx, y + fy]);
    // the face's markings ride the face, but where they meet the outline they stay on it
    const onFace = ([x, y]) => { const w = clamp((y - 199) / 18, 0, 1) * clamp((240 - y) / 6, 0, 1); return H([x + fx * w, y + fy * w]); };

    // asleep, each ear tip lies folded out and down; awake it stands where the drawing has it
    const hp = HEAD.map((p) => p.slice());
    TIPS.forEach(([i, down]) => {
      const d = [(down[0] - HEAD[i][0]) * (1 - wk), (down[1] - HEAD[i][1]) * (1 - wk)];
      [[i, 1], [i - 1, 0.5], [i + 1, 0.5]].forEach(([j, f]) => { hp[j] = [HEAD[j][0] + d[0] * f, HEAD[j][1] + d[1] * f]; });
    });
    const outline = smooth(hp, false).map(H);
    head.setAttribute("d", open(outline));
    headFill.setAttribute("d", poly(outline.concat(CHIN.map(H))));
    inner.setAttribute("d", INNER.map((tri, e) => {
      const [i] = TIPS[e], d = [hp[i][0] - HEAD[i][0], hp[i][1] - HEAD[i][1]];
      return poly(fillet(tri.map(([x, y], k) => H([x + d[0] * (k === 0 ? 0.7 : 0.3), y + d[1] * (k === 0 ? 0.7 : 0.3)])), [2.5, 2.5, 2.5], 4));
    }).join(""));
    // the body's sides hang from the jaw's two corners, wherever the head has gone
    // near the jaw the sides follow its corner, slide for slide; lower down, less and less
    const jaw = [HEAD[1], HEAD[22]].map((q) => { const a = img(q), b = H(q); return [b[0] - a[0], b[1] - a[1]]; });
    const neck = (p) => { const w = clamp((264 - p[1]) / 22, 0, 1), d = jaw[p[0] < HC[0] ? 0 : 1], a = img(p); return [a[0] + d[0] * w, a[1] + d[1] * w]; };
    body.setAttribute("d", open(smooth([H(HEAD[1]), ...BODY.map(neck), H(HEAD[22])], false)));

    blaze.setAttribute("d", BLAZE.map((b) => open(smooth(b, false).map(onFace))).join(""));
    // a whisker's root rides the face, its tip the skull
    whisk.setAttribute("d", WHISKERS.map((w) => open(smooth(w, false).map(([x, y], k, a) => { const f = 1 - k / (a.length - 1); return H([x + fx * f, y + fy * f]); }))).join(""));

    // awake, big oval eyes, almost all pupil, with a fleck of light, the pupils on the pointer;
    // purring, squeezed shut into two happy arches; asleep, two closed curves hanging down
    const awake = wk > 0.5, glad = jy > 0.5, lx = clamp(yaw.x / 25, -1, 1), ly = clamp(-pitch.x / 25, -1, 1);
    const oval = ([ex, ey], rx, ry) => Array.from({ length: 28 }, (_, k) => { const a = (k / 28) * 2 * Math.PI; return Fc([ex + rx * Math.cos(a), ey + ry * Math.sin(a)]); });
    const arc = ([ex, ey], up) => open(smooth([-2, -1, 0, 1, 2].map((d) => ([ex + d * (up ? 2.3 : 1.9), ey + (up ? 1.6 - 3 * (1 - (d / 2) ** 2) : 0.4 + 1.3 * (1 - (d / 2) ** 2))])), false).map(Fc));
    rims.setAttribute("d", awake && !glad ? EYES.map((e) => poly(oval(e, 3.5, 4.3))).join("") : "");
    shut.setAttribute("d", !awake ? EYES.map((e) => arc(e, false)).join("") : glad ? EYES.map((e) => arc(e, true)).join("") : "");
    EYES.forEach(([ex, ey], i) => {
      const p = [ex + lx * 1.1, ey + 0.2 + ly * 1.4];
      [pupils[i], shine[i]].forEach((el) => el.setAttribute("display", awake && !glad ? "inline" : "none"));
      place(pupils[i], Fc(p)); place(shine[i], Fc([p[0] - 0.9, p[1] - 1.1]));
    });
    nose.setAttribute("d", poly(fillet([[345, 225], [349.6, 225], [347.3, 228.4]].map(Fc), [1.6, 1.6, 1.2], 4)));
    // awake, the little w smile under the nose, wider when it purrs; asleep, only the line down from the nose
    const sm = 1 + jy * 0.35;
    mouth.setAttribute("d", awake
      ? [[[347.3 - 4 * sm, 229.2], [347.3 - 2 * sm, 231.6], [347.3, 229.6]], [[347.3, 229.6], [347.3 + 2 * sm, 231.6], [347.3 + 4 * sm, 229.2]]].map((m) => open(smooth(m, false).map(Fc))).join("") + open([Fc([347.3, 228.4]), Fc([347.3, 229.6])])
      : open([Fc([347.3, 228.4]), Fc([347.3, 231.2])]));
  }
  draw(performance.now());
  // each part lights while the pointer is over it, tested against its outline at rest; the first that holds it wins
  const parts = [[headFill, [head]], [tailFill, [tail]], [body, [body]]].map(([h, els]) => ({ ls: loops(h.getAttribute("d")), els }));
  let lit = null;
  const light = (p) => { const pt = (p && parts.find((x) => inLoops(p, x.ls))) || null; if (pt !== lit) { lit = pt; parts.forEach((x) => x.els.forEach((e) => e.classList.toggle("hi", x === pt))); } };

  const B = register(stage, (dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ const m = [stepS(yaw, dt), stepS(pitch, dt)].some(Boolean); draw(now); return m || !tdone(wake, now) || !tdone(joy, now) || (on && !reducedMotion()); });
  bag.add(B.unregister);

  // the head's centre on screen never moves; the pointer is read against it
  const [hx, hy] = img(HC);
  function watch(p) {
    on = !!p;
    const near = on && Math.hypot(p[0] - hx, p[1] - hy) < 52, ty = on ? clamp((p[0] - hx) / 130, -1, 1) * reach : REST[0], tp = on ? clamp((hy - p[1]) / 110, -1, 1) * reach * 0.7 : REST[1];
    yaw.t = ty; pitch.t = tp;
    tset(wake, on ? 1 : 0, performance.now(), 0);
    tset(joy, near ? 1 : 0, performance.now(), 0);
    light(p);
    nose.setAttribute("class", on ? "dot m" : "dot");
    read.textContent = !on ? "rest" : near ? "purr" : Math.hypot(ty, tp / 0.7) < reach * 0.3 ? "watch" : "watch " + DIRS[(Math.round(Math.atan2(tp / 0.7, ty) / (Math.PI / 4)) + 8) % 8];
    B.wake();
  }
  watch(null);

  bag.add(pointer(stage, { move: watch, leave: () => watch(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "cat",
  means: "A cat sitting with its tail round its paws, dozing: bring the pointer near and it wakes happy and watches; at its head it purrs.",
  rules: [1, 5, 8, 9],
  range: [15, 28, 40],
  mount,
});
