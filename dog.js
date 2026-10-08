/**
 * Dog: a puppy in a collar, dozing, head tipped, ears down. Bring the pointer
 * onto the stage and it wakes: eyes open, ears lift, tongue out, head turns to
 * watch on springs, and the tail wags while the pointer stays (the one ambient
 * motion). Built as the cat is: ellipsoids whose outlines are hulls, the face
 * drawn on head and muzzle. The hit test is the head's fixed centre on screen.
 */
const {
  Cam, clamp, disposer, fit, hull, lerp, mk, open, pointer, poly, proj, rad, reducedMotion, register, spring, stepS,
} = HL;

const add = (a, b, s = 1) => a.map((x, i) => x + b[i] * s);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const SPH = [];
for (let i = 1; i < 18; i++) for (let j = 0; j < 40; j++) {
  const t = (i / 18) * Math.PI, f = (j / 40) * 2 * Math.PI;
  SPH.push([Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f)]);
}
SPH.push([0, 1, 0], [0, -1, 0]);

const HEAD = [11, 10, 10], MUZ = [5.3, 4, 5.2], REST = { yaw: 20, pitch: -8 }, WAG_HZ = 2.6;

/** A frame facing az degrees round z (45 faces the eye) and pitch up, rolled: right, up, forward. */
function frame(az, pitch = 0, roll = 0) {
  const a = rad(az), p = rad(pitch);
  const F = [Math.cos(p) * Math.cos(a), Math.cos(p) * Math.sin(a), Math.sin(p)];
  let Rt = [Math.sin(a), -Math.cos(a), 0], Up = cross(Rt, F);
  const c = Math.cos(rad(roll)), s = Math.sin(rad(roll));
  [Rt, Up] = [add(Rt.map((x) => x * c), Up, s), add(Up.map((x) => x * c), Rt, -s)];
  return { Rt, Up, F };
}
/** The world point at local (a right, b up, c forward) on an ellipsoid of radii r round o. */
const at = (o, { Rt, Up, F }, r, [a, b, c]) => add(add(add(o, Rt, a * r[0]), Up, b * r[1]), F, c * r[2]);
/** A point on the ellipsoid's front surface at face coordinates (a, b). */
const face = (o, fr, r, a, b, lift = 0) => at(o, fr, r, [a, b, Math.sqrt(Math.max(0, 1 - a * a - b * b)) + lift]);

/** A tapering tube along screen points, with a round end: the outline of a tail. */
function tube(pts, r0, r1) {
  const n = pts.length, L = [], R = [];
  pts.forEach((p, k) => {
    const q = pts[Math.min(k + 1, n - 1)], o = pts[Math.max(k - 1, 0)], dx = q[0] - o[0], dy = q[1] - o[1], m = Math.hypot(dx, dy) || 1;
    const r = lerp(r0, r1, k / (n - 1));
    L.push([p[0] - (dy / m) * r, p[1] + (dx / m) * r]); R.push([p[0] + (dy / m) * r, p[1] - (dx / m) * r]);
  });
  const e = pts[n - 1], a0 = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]), d = pts[n - 1], b = pts[n - 2];
  const dir = Math.atan2(d[1] - b[1], d[0] - b[0]), sg = Math.sign(Math.sin(dir - a0)) || 1;
  const cap = Array.from({ length: 9 }, (_, k) => { const t = a0 + sg * (k / 8) * Math.PI; return [e[0] + r1 * Math.cos(t), e[1] + r1 * Math.sin(t)]; });
  return poly([...L, ...cap, ...R.reverse()]);
}

/** Whether the page shows the dark theme: the eyes swap classes, never colours, to keep light whites and a dark pupil in both. */
const isDark = () => getComputedStyle(document.documentElement).colorScheme === "dark";

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const B0 = [0, 0, 12], body = frame(45);
  const CH = add(add(B0, body.F, 3.5), [0, 0, 13]);
  const HC = add(add(B0, body.F, 5), [0, 0, 27]);
  const C = Cam(45, 0.5, 4.1);
  fit(C, [add(B0, [-24, -24, -12]), add(B0, [24, 24, -12]), add(B0, [24, -24, -12]), add(B0, [-24, 24, -12]), add(HC, [0, 0, 16]), add(HC, body.Rt, 22), add(HC, body.Rt, -22), add(add(B0, body.Rt, 30), [0, 0, 22])], 200, 168);
  const P = proj(C);
  const W = (p) => P(...p);
  const ell = (o, r, fr = body) => SPH.map((d) => W(at(o, fr, r, d)));

  const g = mk("g", {}, svg), tail = mk("path", { class: "sil" }, g); // the tail first: it stands behind the haunch

  // body: haunches, a deep chest, and the thighs in one silhouette
  const thighAt = (s) => add(add(add(B0, body.Rt, s * 9.5), body.F, -1), [0, 0, -4.5]), THIGH = [5, 6.5, 8];
  mk("path", { d: poly(hull(ell(add(B0, [0, 0, -1.5]), [14.5, 10.5, 12.5]).concat(ell(CH, [9.5, 12, 9]), ell(thighAt(-1), THIGH), ell(thighAt(1), THIGH)))), class: "sil" }, g);
  for (const s of [-1, 1]) {
    // the thigh's inner curve, and the back foot flat on the floor
    const th = hull(ell(thighAt(s), THIGH)), cx = W(thighAt(s))[0], inner = Math.sign(W(B0)[0] - cx);
    const keep = th.map((p) => (p[0] - cx) * inner > 0 && p[1] < W(thighAt(s))[1] + 18), i0 = keep.findIndex((k, j) => k && !keep[(j + keep.length - 1) % keep.length]);
    const arcT = [];
    for (let j = 0; j < th.length && keep[(i0 + j) % th.length]; j++) arcT.push(th[(i0 + j) % th.length]);
    mk("path", { d: open(arcT), class: "nf lo" }, g);
    const foot = add(add(add(B0, body.Rt, s * 11.8), body.F, 4.5), [0, 0, -10.3]);
    mk("path", { d: poly(hull(ell(foot, [2.6, 1.7, 6]))), class: "sil" }, g);
    mk("path", { d: [-1, 1].map((k) => open([W(add(add(foot, body.F, 5.7), body.Rt, k * 0.9)), W(add(add(add(foot, body.F, 4.6), body.Rt, k * 0.9), [0, 0, 1.2]))])).join(""), class: "nf lo" }, g);
  }
  // front legs: straight, as a dog sits, down to big round paws
  for (const s of [-1, 1]) {
    const top = add(add(add(B0, body.F, 9), body.Rt, s * 4.3), [0, 0, 3]), foot = add(add(add(B0, body.F, 11), body.Rt, s * 4.5), [0, 0, -9]);
    const legs = SPH.map((d) => W(add(top, d, 2.9))).concat(SPH.map((d) => W(add(foot, [d[0] * 3.7, d[2] * 3.7, d[1] * 2.6]))));
    mk("path", { d: poly(hull(legs)), class: "sil" }, g);
    mk("path", { d: [-1.3, 0, 1.3].map((k) => open([W(add(add(foot, body.F, 3.6), body.Rt, k)), W(add(add(add(foot, body.F, 2.6), body.Rt, k), [0, 0, 1.7]))])).join(""), class: "nf lo" }, g);
  }

  // the head, its floppy ears, the face; then the collar under the chin with its tag
  const head = mk("path", { class: "sil" }, g);
  const ears = [-1, 1].map(() => mk("path", { class: "sil" }, g));
  const brows = mk("path", { class: "nf lo" }, g);
  const eyes = [-1, 1].map(() => ({ lid: mk("path", { class: "" }, g), pupil: mk("path", { class: "dot" }, g), big: mk("path", { class: "fo", r: 1.9 }, g), small: mk("path", { class: "fo", r: 0.9 }, g) }));
  const tongue = mk("path", { class: "" }, g), tongueLine = mk("path", { class: "nf lo" }, g);
  const muzzle = mk("path", { class: "sil" }, g), nose = mk("path", { class: "" }, g), mouth = mk("path", { class: "nf lo" }, g);

  // the collar: a band round the neck, drawn where it faces the eye, and a round tag hanging from it
  const NK = add(add(CH, body.F, 1.5), [0, 0, 4.5]);
  const band = (z) => Array.from({ length: 25 }, (_, k) => { const t = rad(-180 + k * 7.5); return W(add(add(add(NK, body.Rt, 8.2 * Math.cos(t)), body.F, -6.8 * Math.sin(t)), [0, 0, z])); });
  mk("path", { d: poly([...band(1.4), ...band(-1.4).reverse()]), class: "sil" }, g);
  const tagC = W(add(add(NK, body.F, 7), [0, 0, -3.6]));
  mk("path", { d: open([W(add(add(NK, body.F, 6.9), [0, 0, -1.2])), [tagC[0], tagC[1] - 5]]), class: "nf lo" }, g);
  const disc = (r) => poly(Array.from({ length: 20 }, (_, k) => [tagC[0] + r * Math.cos((k / 20) * 2 * Math.PI), tagC[1] + r * Math.sin((k / 20) * 2 * Math.PI)]));
  mk("path", { d: disc(4.6), class: "" }, g); mk("path", { d: disc(2.6), class: "nf lo" }, g);

  [head, ...ears, brows, ...eyes.flatMap((e) => [e.lid, e.pupil, e.big, e.small]), tongue, tongueLine, muzzle, nose, mouth].forEach((el) => g.append(el));

  const yw = spring(REST.yaw), pt = spring(REST.pitch), wake = spring(0);
  let phase = 0, drawn = "";
  function draw() {
    const a = clamp(wake.x, 0, 1.2), op = clamp(a, 0, 1), dark = isDark(), key = [yw.x, pt.x, a, phase].map((x) => x.toFixed(3)).join() + dark;
    if (key === drawn) return;
    drawn = key;
    const fr = frame(45 - yw.x, pt.x, lerp(-12, 0, op));
    const H = HC, F = (u, v, l = 0) => W(face(H, fr, HEAD, u, v, l));

    // tail: low and out at rest; up and wagging when awake
    const wag = rad(28 * op * Math.sin(phase * 2 * Math.PI));
    const base = add(add(add(B0, body.Rt, 10), body.F, -6), [0, 0, -3]);
    const tp = Array.from({ length: 14 }, (_, k) => {
      const t = k / 13, up = lerp(2, 20, op) * t, out = lerp(15, 7, op) * t + 3 * t * t, back = -2 * t;
      const ox = out * Math.cos(wag) - back * Math.sin(wag), of = out * Math.sin(wag) + back * Math.cos(wag);
      return W(add(add(add(base, body.Rt, ox), body.F, of), [0, 0, up + 2 * Math.sin(Math.PI * t)]));
    });
    tail.setAttribute("d", tube(tp, 2.4 * 4.1, 1.3 * 4.1));

    head.setAttribute("d", poly(hull(ell(H, HEAD, fr))));
    // floppy ears hang at the sides of the head; awake, they lift and splay a little
    ears.forEach((e, i) => {
      const s = i ? 1 : -1, o = at(H, fr, HEAD, [s * lerp(1.0, 1.08, op), lerp(-0.05, 0.12, op), -0.15]);
      const ear = frame(45 - yw.x, pt.x, lerp(-12, 0, op) + s * lerp(8, 24, op));
      e.setAttribute("d", poly(hull(ell(add(o, ear.Up, 0), [2.1, 7.2, 4.6], ear))));
    });
    brows.setAttribute("d", [-1, 1].map((s) => poly(Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI; return F(s * 0.33 + 0.07 * Math.cos(t), 0.58 + lerp(0, 0.05, op) + 0.035 * Math.sin(t)); }))).join(""));

    // eyes: shut in soft curves at rest; awake, big round eyes with sparkles
    const ring = (cx, cy, rx, ry, n = 24) => poly(Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return F(cx + rx * Math.cos(t), cy + ry * Math.sin(t)); }));
    eyes.forEach((e, i) => {
      const s = i ? 1 : -1, cx = s * 0.4, cy = 0.32, isOpen = op > 0.08, ry = 0.025 + 0.18 * op;
      e.lid.setAttribute("d", isOpen ? ring(cx, cy, 0.17, ry) : open(Array.from({ length: 9 }, (_, k) => { const t = -1 + k / 4; return F(cx + 0.14 * t, cy - 0.05 * (1 - t * t)); })));
      e.lid.setAttribute("class", isOpen ? (dark ? "dot" : "") : "nf"); e.pupil.setAttribute("class", dark ? "fo" : "dot");
      e.pupil.setAttribute("d", isOpen ? ring(cx + 0.01, cy - 0.02, 0.125, Math.max(0.01, ry - 0.04)) : "");
      for (const [el, dx, dy] of [[e.big, -0.045, 0.065], [e.small, 0.055, -0.065]]) {
        el.setAttribute("display", op > 0.5 ? "inline" : "none"); el.setAttribute("class", dark ? "dot" : "fo");
        const q = F(cx + dx, cy + dy * op), r = +el.getAttribute("r");
        el.setAttribute("d", poly(Array.from({ length: 12 }, (_, k) => [q[0] + r * Math.cos((k / 12) * 2 * Math.PI), q[1] + r * Math.sin((k / 12) * 2 * Math.PI)])));
      }
    });

    // the muzzle: a round snout on the front of the face, a big nose on top, the mouth below it, and a tongue when awake
    const MC = at(H, fr, HEAD, [0, -0.52, 0.66]), M = (u, v, l = 0) => W(face(MC, fr, MUZ, u, v, l));
    const tl = 5.5 * op;
    tongue.setAttribute("d", op < 0.05 ? "" : poly([M(-0.3, -0.55), ...Array.from({ length: 9 }, (_, k) => { const t = Math.PI + (k / 8) * Math.PI; return W(add(face(MC, fr, MUZ, 0.3 * Math.cos(t), -0.62), fr.Up, -tl * (0.6 + 0.4 * -Math.sin(t)))); }), M(0.3, -0.55)]));
    tongueLine.setAttribute("d", op < 0.05 ? "" : open([M(0, -0.6), W(add(face(MC, fr, MUZ, 0, -0.62), fr.Up, -tl * 0.65))]));
    muzzle.setAttribute("d", poly(hull(ell(MC, MUZ, fr))));
    nose.setAttribute("d", poly(Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return M(0.3 * Math.cos(t), 0.38 + 0.2 * Math.sin(t) - 0.06 * Math.max(0, -Math.sin(t)), 0.08); })));
    mouth.setAttribute("d", open([M(0, 0.17), M(0, -0.18)]) + open([M(-0.48, -0.12), M(-0.24, -0.34), M(0, -0.18), M(0.24, -0.34), M(0.48, -0.12)]));
  }
  draw();
  // the wag runs only while the dog is awake and visible; reduced motion holds the tail still
  const B = register(stage, (dt) => {
    const m = [stepS(yw, dt), stepS(pt, dt), stepS(wake, dt)].some(Boolean), awake = wake.t > 0 && !reducedMotion();
    phase = awake ? (phase + dt * WAG_HZ) % 1 : wake.x < 0.02 ? 0 : phase;
    draw();
    return m || awake;
  });
  bag.add(B.unregister);

  const [hx, hy] = W(HC);
  const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  function watch(p) {
    const on = !!p;
    const y = on ? clamp((p[0] - hx) / 130, -1, 1) * reach : REST.yaw;
    const q = on ? clamp((hy - p[1]) / 110, -1, 1) * reach * 0.6 : REST.pitch;
    yw.t = y; pt.t = q; wake.t = on ? 1 : 0;
    nose.classList.toggle("hi", !on);
    const near = Math.hypot(y, q / 0.6) < reach * 0.3;
    read.textContent = !on ? "rest" : near ? "watch" : "watch " + DIRS[(Math.round(Math.atan2(q / 0.6, y) / (Math.PI / 4)) + 8) % 8];
    B.wake();
  }
  watch(null);

  bag.add(pointer(stage, { move: watch, leave: () => watch(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "dog",
  means: "A puppy dozing in its collar: bring the pointer near and it wakes, ears up, tongue out, tail wagging, and watches.",
  rules: [1, 3, 5, 7],
  range: [15, 25, 35],
  mount,
});
