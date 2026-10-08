/**
 * Cat: a cat sitting with its tail wrapped round its front paws, napping, head
 * tipped, eyes shut. Bring the pointer onto the stage and it wakes: ears perk,
 * eyes open big and round, the tail tip lifts, and its head turns to watch the
 * pointer, on springs. The read-out names where it watches. The slider is how
 * far the head can turn, in degrees.
 *
 * Every part is an ellipsoid or a tube: its outline is the hull of its surface,
 * and the face is drawn on the head's own surface, so it turns with it. The hit
 * test is the head's fixed centre on screen.
 */
const {
  Cam, clamp, disposer, fit, hull, lerp, mk, open, pointer, poly, proj, rad, register, spring, stepS,
} = HL;

const add = (a, b, s = 1) => a.map((x, i) => x + b[i] * s);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const SPH = [];
for (let i = 1; i < 18; i++) for (let j = 0; j < 40; j++) {
  const t = (i / 18) * Math.PI, f = (j / 40) * 2 * Math.PI;
  SPH.push([Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f)]);
}
SPH.push([0, 1, 0], [0, -1, 0]);

const HEAD = [11.5, 9.5, 10], REST = { yaw: 22, pitch: -10 };

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

/** Whether the page shows the dark theme: the eyes swap classes, never colours, to keep light whites and a dark pupil in both. */
const isDark = () => getComputedStyle(document.documentElement).colorScheme === "dark";

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const B0 = [0, 0, 12], body = frame(45);
  const HC = add(add(B0, body.F, 4), [0, 0, 25]);
  const C = Cam(45, 0.5, 3.9);
  fit(C, [add(B0, [-24, -24, -12]), add(B0, [24, 24, -12]), add(B0, [24, -24, -12]), add(B0, [-24, 24, -12]), add(HC, [0, 0, 22]), add(HC, body.Rt, 25), add(HC, body.Rt, -25)], 200, 166);
  const P = proj(C);
  const W = (p) => P(...p);
  const blob = (o, fr, r) => poly(hull(SPH.map((d) => W(at(o, fr, r, d)))));

  const g = mk("g", {}, svg);
  const tailBack = mk("path", { class: "sil" }, g);
  // body: haunches and a round chest in one silhouette
  const CH = add(add(B0, body.F, 3), [0, 0, 13]);
  const ell = (o, r) => SPH.map((d) => W(at(o, body, r, d)));
  const thighAt = (s) => add(add(add(B0, body.Rt, s * 9.5), body.F, -1), [0, 0, -4.5]), THIGH = [5, 6.5, 8];
  mk("path", { d: poly(hull(ell(add(B0, [0, 0, -1.5]), [15, 10.5, 13]).concat(ell(CH, [8.8, 11, 8]), ell(thighAt(-1), THIGH), ell(thighAt(1), THIGH)))), class: "sil" }, g);
  // the back legs: a rounded thigh on each side, its long foot lying flat on the floor, pointing forward
  for (const s of [-1, 1]) {
    const th = hull(ell(thighAt(s), THIGH)), cx = W(thighAt(s))[0], inner = Math.sign(W(B0)[0] - cx);
    const keep = th.map((p) => (p[0] - cx) * inner > 0 && p[1] < W(thighAt(s))[1] + 18), i0 = keep.findIndex((k, j) => k && !keep[(j + keep.length - 1) % keep.length]);
    const arcT = [];
    for (let j = 0; j < th.length && keep[(i0 + j) % th.length]; j++) arcT.push(th[(i0 + j) % th.length]);
    mk("path", { d: open(arcT), class: "nf lo" }, g);
    const foot = add(add(add(B0, body.Rt, s * 11.8), body.F, 4.5), [0, 0, -10.4]);
    mk("path", { d: poly(hull(ell(foot, [2.4, 1.6, 6]))), class: "sil" }, g);
    mk("path", { d: [-1, 1].map((k) => open([W(add(add(foot, body.F, 5.7), body.Rt, k * 0.8)), W(add(add(add(foot, body.F, 4.6), body.Rt, k * 0.8), [0, 0, 1.2]))])).join(""), class: "nf lo" }, g);
  }
  // front legs: short tubes down to round paws, toes on the paws
  for (const s of [-1, 1]) {
    const top = add(add(add(B0, body.F, 9.5), body.Rt, s * 3.8), [0, 0, -2]), foot = add(add(add(B0, body.F, 10.5), body.Rt, s * 4.1), [0, 0, -9]);
    const tube = SPH.map((d) => W(add(top, d, 2.7))).concat(SPH.map((d) => W(add(foot, [d[0] * 3.3, d[2] * 3.3, d[1] * 2.4]))));
    mk("path", { d: poly(hull(tube)), class: "sil" }, g);
    mk("path", { d: [-1, 1].map((k) => open([W(add(add(foot, body.F, 3.3), body.Rt, k * 1.2)), W(add(add(add(foot, body.F, 2.2), body.Rt, k * 1.2), [0, 0, 1.6]))])).join(""), class: "nf lo" }, g);
  }

  // the head: ears behind it, then the head, then the face on it
  const ears = [-1, 1].map(() => ({ out: mk("path", { class: "sil" }, g), inn: mk("path", { class: "nf lo" }, g) }));
  const head = mk("path", { class: "sil" }, g);
  const eyes = [-1, 1].map(() => ({ lid: mk("path", { class: "" }, g), pupil: mk("path", { class: "dot" }, g), big: mk("path", { class: "fo", r: 2.1 }, g), small: mk("path", { class: "fo", r: 0.95 }, g) }));
  const nose = mk("path", { class: "nf" }, g), mouth = mk("path", { class: "nf lo" }, g), whisk = mk("path", { class: "nf lo" }, g);

  // the tail, wrapped round the paws, its tip lifting when awake
  const tail = mk("path", { class: "fo" }, g), tailEdge = mk("path", { class: "nf sil" }, g), tailTip = mk("path", { class: "nf lo" }, g);

  const yw = spring(REST.yaw), pt = spring(REST.pitch), wake = spring(0);
  let drawn = "";
  function draw() {
    const a = clamp(wake.x, 0, 1.2), dark = isDark(), key = [yw.x, pt.x, a].map((x) => x.toFixed(2)).join() + dark;
    if (key === drawn) return;
    drawn = key;
    const fr = frame(45 - yw.x, pt.x, lerp(13, 0, clamp(a, 0, 1)));
    const H = HC, F = (u, v, l = 0) => W(face(H, fr, HEAD, u, v, l));

    ears.forEach((e, i) => {
      const s = i ? 1 : -1, b1 = at(H, fr, HEAD, [s * 0.9, 0.42, 0.1]), b2 = at(H, fr, HEAD, [s * 0.22, 0.95, 0.15]);
      const tip = at(H, fr, HEAD, [s * lerp(0.95, 0.68, a), lerp(1.25, 1.62, a), 0.1]);
      const back = (p) => add(p, fr.F, -4);
      e.out.setAttribute("d", poly(hull([b1, b2, back(b1), back(b2), tip, back(tip)].map(W))));
      const m = [b1, b2, tip].reduce((q, p) => add(q, p, 1 / 3), [0, 0, 0]);
      e.inn.setAttribute("d", poly([b1, tip, b2].map((p) => W(add(add(m, add(p, m, -1), 0.62), fr.F, 1)))));
    });
    head.setAttribute("d", blob(H, fr, HEAD));

    // eyes: shut in soft curves at rest; awake, big round eyes, big pupils, two sparkles each
    const op = clamp(a, 0, 1);
    const ring = (cx, cy, rx, ry, n = 24) => poly(Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return F(cx + rx * Math.cos(t), cy + ry * Math.sin(t)); }));
    eyes.forEach((e, i) => {
      const s = i ? 1 : -1, cx = s * 0.38, cy = 0.1, open_ = op > 0.08;
      const ry = 0.025 + 0.2 * op;
      e.lid.setAttribute("d", open_ ? ring(cx, cy, 0.19, ry) : open(Array.from({ length: 9 }, (_, k) => { const t = -1 + k / 4; return F(cx + 0.15 * t, cy - 0.05 * (1 - t * t)); })));
      e.lid.setAttribute("class", open_ ? (dark ? "dot" : "") : "nf"); e.pupil.setAttribute("class", dark ? "fo" : "dot");
      e.pupil.setAttribute("d", open_ ? ring(cx + 0.01, cy - 0.02, 0.135, Math.max(0.01, ry - 0.045)) : "");
      for (const [el, dx, dy] of [[e.big, -0.05, 0.07], [e.small, 0.06, -0.07]]) {
        el.setAttribute("display", op > 0.5 ? "inline" : "none"); el.setAttribute("class", dark ? "dot" : "fo");
        const q = F(cx + dx, cy + dy * op), r = +el.getAttribute("r");
        el.setAttribute("d", poly(Array.from({ length: 12 }, (_, k) => [q[0] + r * Math.cos((k / 12) * 2 * Math.PI), q[1] + r * Math.sin((k / 12) * 2 * Math.PI)])));
      }
    });
    nose.setAttribute("d", poly([F(-0.07, -0.1), F(0.07, -0.1), F(0, -0.18)]));
    mouth.setAttribute("d", open([F(-0.15, -0.3), F(-0.07, -0.29), F(0, -0.22), F(0.07, -0.29), F(0.15, -0.3)]) + open([F(0, -0.18), F(0, -0.22)]));
    whisk.setAttribute("d", [-1, 1].flatMap((s) => [-0.05, 0.03, 0.11].map((k) => {
      const p0 = face(H, fr, HEAD, s * 0.3, -0.18 - k * 0.4);
      return open([W(p0), W(add(add(add(p0, fr.Rt, s * 13), fr.Up, -k * 22 + 2), fr.F, -2))]);
    })).join(""));

    // tail: a tube along a smooth curve on the floor, round the front of the paws; its tip lifts when awake
    const lift = 4.5 * op;
    const ctl = [[9, -9, 0], [15, -2, 0], [15, 9, 0], [8, 15.5, 0], [-5, 16.5, 0.3], [-13.5, 10, lift]].map(([u, f, z]) => add(add(add(B0, body.Rt, u), body.F, f), [0, 0, 2.6 + z - 12]));
    const pts = [];
    for (let k = 0; k < ctl.length - 1; k++) {
      const p0 = ctl[Math.max(k - 1, 0)], p1 = ctl[k], p2 = ctl[k + 1], p3 = ctl[Math.min(k + 2, ctl.length - 1)];
      for (let j = 0; j < 8; j++) {
        const t = j / 8, t2 = t * t, t3 = t2 * t;
        pts.push(p1.map((_, i) => 0.5 * (2 * p1[i] + (p2[i] - p0[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (3 * p1[i] - p0[i] - 3 * p2[i] + p3[i]) * t3)));
      }
    }
    pts.push(ctl[ctl.length - 1]);
    const n = pts.length, R = (k) => 2.7 - (0.9 * k) / n, L = [], Rr = [];
    let side = [0, 0, 0];
    pts.forEach((p, k) => {
      const q = pts[Math.min(k + 1, n - 1)], o = pts[Math.max(k - 1, 0)], d = [q[0] - o[0], q[1] - o[1]], m = Math.hypot(...d);
      side = [-d[1] / m, d[0] / m, 0];
      L.push(W(add(p, side, R(k)))); Rr.push(W(add(p, side, -R(k))));
    });
    // the tip: a half round in screen space, from one side of the tube to the other
    const lA = L[n - 1], rA = Rr[n - 1], m = [(lA[0] + rA[0]) / 2, (lA[1] + rA[1]) / 2], hr = Math.hypot(lA[0] - m[0], lA[1] - m[1]);
    const a0 = Math.atan2(lA[1] - m[1], lA[0] - m[0]), fw = W(pts[n - 1]), bk = W(pts[n - 3]);
    const sgn = Math.sign(Math.cos(a0 - Math.PI / 2 - Math.atan2(fw[1] - bk[1], fw[0] - bk[0]))) || 1;
    const cap = Array.from({ length: 9 }, (_, k) => { const t = a0 - sgn * (k / 8) * Math.PI; return [m[0] + hr * Math.cos(t), m[1] + hr * Math.sin(t)]; });
    const k0 = 10, rv = Rr.slice().reverse();
    tailBack.setAttribute("d", poly([...L.slice(0, k0 + 2), ...Rr.slice(0, k0 + 2).reverse()]));
    const front = [...L.slice(k0), ...cap, ...rv.slice(0, n - k0)];
    tail.setAttribute("d", poly(front));
    tailEdge.setAttribute("d", open(front));
    tailTip.setAttribute("d", open(pts.slice(12, -3).map((p) => W(add(p, [0, 0, 1.6])))));
  }
  draw();

  const B = register(stage, (dt) => { const m = [stepS(yw, dt), stepS(pt, dt), stepS(wake, dt)].some(Boolean); draw(); return m; });
  bag.add(B.unregister);

  // the head's centre on screen never moves; the pointer is read against it
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
  name: "cat",
  means: "A cat napping with its tail round its paws: bring the pointer near and it wakes, ears up, and turns its head to watch.",
  rules: [1, 3, 5, 8],
  range: [15, 25, 35],
  mount,
});
