/**
 * Dog: a puppy in a collar on a soft bed, dozing: head tipped down, ears hanging,
 * eyes shut. Bring the pointer near and it wakes on the 700ms curve, ears lift,
 * eyes open, tongue out, and its head follows the pointer on two springs, left
 * and right and up and down; its tail wags while the pointer stays, the one
 * ambient motion. The read-out names where it watches; the slider is how far the
 * head can go. Each mass is one soft outline: its rounded shapes merged where
 * they meet. The hit test is the head's fixed centre on screen.
 */
const {
  Cam, clamp, fit, hull, lerp, mk, open, place, pointer, poly, proj, rad, reducedMotion, register,
  spring, stepS, tdone, tset, tval, tween, disposer,
} = HL;

const S = 3.6, F0 = [Math.SQRT1_2, Math.SQRT1_2], R0 = [Math.SQRT1_2, -Math.SQRT1_2];
const BC = [-2, -2], HZ = 23, REST = [14, -14], WAG = 3.2;
const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
const SEG = { 1: "LB", 14: "LB", 2: "BR", 13: "BR", 3: "LR", 12: "LR", 4: "TR", 11: "TR", 6: "TB", 9: "TB", 7: "LT", 8: "LT" };
const SPH = [];
for (let i = 1; i < 9; i++) for (let j = 0; j < 18; j++) { const t = (i / 9) * Math.PI, f = (j / 18) * 2 * Math.PI; SPH.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); }
SPH.push([0, 0, 1], [0, 0, -1]);

/** A frame about o (x, y, z), turned by yaw from facing the eye and tipped up by pitch. */
function frame3(o, yaw, pitch) {
  const c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const R = [R0[0] * c - F0[0] * s, R0[1] * c - F0[1] * s, 0], Fh = [F0[0] * c + R0[0] * s, F0[1] * c + R0[1] * s];
  const F = [Fh[0] * cp, Fh[1] * cp, sp], U = [-Fh[0] * sp, -Fh[1] * sp, cp];
  return (u, v, h) => [0, 1, 2].map((i) => o[i] + R[i] * u + F[i] * v + U[i] * h);
}

/** One soft outline round convex shapes on screen: the zero contour of the smooth minimum of their distances (fillet k), by marching squares. */
function soft(shapes, k = 2.5, step = 0.7) {
  const parts = shapes.map((pts) => {
    const h = hull(pts), n = h.length, cx = h.reduce((a, p) => a + p[0], 0) / n, cy = h.reduce((a, p) => a + p[1], 0) / n, pl = [];
    for (let i = 0; i < n; i++) {
      const a = h[i], b = h[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l < 1e-6) continue;
      let nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l;
      if (nx * (cx - a[0]) + ny * (cy - a[1]) > 0) { nx = -nx; ny = -ny; }
      pl.push(nx, ny, nx * a[0] + ny * a[1]);
    }
    const xs = h.map((p) => p[0]), ys = h.map((p) => p[1]); return { pl, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const X0 = Math.min(...parts.map((p) => p.x0)) - k - 2, Y0 = Math.min(...parts.map((p) => p.y0)) - k - 2;
  const W = Math.ceil((Math.max(...parts.map((p) => p.x1)) + k + 2 - X0) / step) + 1, H = Math.ceil((Math.max(...parts.map((p) => p.y1)) + k + 2 - Y0) / step) + 1;
  const f = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = X0 + i * step, y = Y0 + j * step; let v = 1e9;
    for (const p of parts) {
      const bx = Math.max(p.x0 - x, x - p.x1, 0), by = Math.max(p.y0 - y, y - p.y1, 0), bd = Math.hypot(bx, by);
      let d = bd;
      if (bd < k + 1) { d = -1e9; for (let q = 0; q < p.pl.length; q += 3) d = Math.max(d, p.pl[q] * x + p.pl[q + 1] * y - p.pl[q + 2]); }
      const hh = Math.max(k - Math.abs(v - d), 0) / k; v = Math.min(v, d) - hh * hh * k * 0.25;
    }
    f[j * W + i] = v;
  }
  // marching squares: each crossing is keyed by its grid edge; segments join crossings into loops
  const at = new Map(), nb = new Map();
  const cross = (i, j, dir) => {
    const key = (j * W + i) * 2 + dir;
    if (!at.has(key)) {
      const a = f[j * W + i], b = dir ? f[(j + 1) * W + i] : f[j * W + i + 1], t = a / (a - b);
      at.set(key, dir ? [X0 + i * step, Y0 + (j + t) * step] : [X0 + (i + t) * step, Y0 + j * step]);
    }
    return key;
  };
  const link = (a, b) => { (nb.get(a) || nb.set(a, []).get(a)).push(b); (nb.get(b) || nb.set(b, []).get(b)).push(a); };
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const a = f[j * W + i] < 0, b = f[j * W + i + 1] < 0, c = f[(j + 1) * W + i + 1] < 0, d = f[(j + 1) * W + i] < 0;
    const cs = (a ? 8 : 0) | (b ? 4 : 0) | (c ? 2 : 0) | (d ? 1 : 0);
    if (cs === 0 || cs === 15) continue;
    const E = { T: () => cross(i, j, 0), R: () => cross(i + 1, j, 1), B: () => cross(i, j + 1, 0), L: () => cross(i, j, 1) };
    const mid = (f[j * W + i] + f[j * W + i + 1] + f[(j + 1) * W + i + 1] + f[(j + 1) * W + i]) < 0;
    const segs = cs === 5 ? (mid ? "LTBR" : "TRLB") : cs === 10 ? (mid ? "TRLB" : "LTBR") : SEG[cs];
    for (let q = 0; q < segs.length; q += 2) link(E[segs[q]](), E[segs[q + 1]]());
  }
  const seen = new Set();
  let d = "";
  for (const start of nb.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let cur = start, prev = -1;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur); loop.push(at.get(cur));
      const nx = nb.get(cur).find((x) => x !== prev && !seen.has(x)); prev = cur; cur = nx;
    }
    let L = loop; for (let r = 0; r < 2; r++) L = L.flatMap((p, i) => { const q = L[(i + 1) % L.length]; return [[0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]]; });
    if (loop.length > 6) d += poly(L);
  }
  return d;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value, ph = 0;

  const C = Cam(45, 0.5, S);
  fit(C, [[-25, -25, -4], [25, 25, -4], [25, -25, -4], [-25, 25, -4], [0, 0, HZ + 17]], 200, 166);
  const P = proj(C);
  const body = frame3([BC[0], BC[1], 0], 0, 0), B3 = (u, v, z) => P(...body(u, v, z));
  const ell = (Fr, c, r) => SPH.map(([a, b, h]) => P(...Fr(c[0] + a * r[0], c[1] + b * r[1], c[2] + h * r[2])));
  /** A tube through [centre, radius] stations, as capsule segments, each the hull of its two end balls. */
  const tubeOf = (st, Fr = body) => st.slice(1).map(([c, r], i) => ell(Fr, st[i][0], [st[i][1], st[i][1], st[i][1]]).concat(ell(Fr, c, [r, r, r])));
  const HC = [BC[0] + 4.4 * F0[0], BC[1] + 4.4 * F0[1]];

  const g = mk("g", {}, svg);
  // the bed: a soft flattened round, its seam a dim line round the near side
  const ring = (r, z) => Array.from({ length: 64 }, (_, k) => P(r * Math.cos((k / 64) * 2 * Math.PI), r * Math.sin((k / 64) * 2 * Math.PI), z));
  mk("path", { d: poly(hull([...ring(25, -2), ...ring(23, 0.4), ...ring(23, -4.4)])), class: "sil" }, g);
  mk("path", { d: open(Array.from({ length: 25 }, (_, k) => { const t = rad(-45 + k * 7.5); return P(24.4 * Math.cos(t), 24.4 * Math.sin(t), -2); })), class: "nf lo" }, g);

  // the tail, rising from behind the haunches; painted first, so only what clears the body shows
  const tail = mk("path", { class: "sil" }, g);
  const drawTail = (wag) => tail.setAttribute("d", soft(tubeOf(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return [[7 + t * 6 + wag * t * t * 2.4, -8 - t * 4 + wag * t * t * 1.6, 5 + t * 14 - t * t * 2], lerp(2.4, 1.4, t)]; })), 3));

  // the body: haunches, belly, deep chest and neck, folded back paws, all one outline
  mk("path", { d: soft([
    ell(body, [-5.8, -4.4, 5.6], [5.2, 7.4, 5.6]), ell(body, [5.8, -4.4, 5.6], [5.2, 7.4, 5.6]), ell(body, [0, -2, 5.8], [6, 7.4, 5.8]),
    ell(body, [0, 2.2, 12], [5.6, 5.2, 10.4]), ell(body, [0, 3, 20], [4.8, 4.8, 5.2]),
    ell(body, [-8.2, 3.4, 1.4], [2.2, 3.4, 1.4]), ell(body, [8.2, 3.4, 1.4], [2.2, 3.4, 1.4]),
  ], 10), class: "sil" }, g);
  // the collar: a band round the neck, and its tag
  const band = (z) => open(Array.from({ length: 15 }, (_, k) => { const t = rad(-10 + k * 13.6); return B3(5 * Math.cos(t), 3 + 5 * Math.sin(t), z + Math.sin(t) * 0.6); }));
  mk("path", { d: band(19.2) + band(21.2), class: "nf" }, g);
  place(mk("circle", { r: 1.6, class: "dot m" }, g), B3(0, 8.4, 17.6));
  // front legs and paws, one outline each side, two toe lines on each paw
  for (const s of [-1, 1]) {
    mk("path", { d: soft([...tubeOf([[[s * 3, 5.6, 9.5], 2.3], [[s * 3.1, 6.8, 3], 2]]), ell(body, [s * 3.2, 8.4, 1.5], [2.6, 3.3, 1.6])], 3), class: "sil" }, g);
    mk("path", { d: [-0.9, 0.9].map((o) => open([B3(s * 3.2 + o, 11.1, 0.5), B3(s * 3.2 + o, 11.4, 2)])).join(""), class: "nf lo" }, g);
  }

  // the head: skull, cheeks and muzzle in one outline; the ears are soft flaps, the far one before the head
  const earBack = mk("path", { class: "sil" }, g), head = mk("path", { class: "sil" }, g), earFront = mk("path", { class: "sil" }, g);
  const tongue = mk("path", { class: "" }, g), mouth = mk("path", { class: "nf lo" }, g), lids = mk("path", { class: "nf" }, g);
  const eyes = [0, 1].map(() => mk("circle", { r: 1.7, class: "dot" }, g));
  const nose = mk("ellipse", { rx: 2, ry: 1.4, class: "dot" }, g);

  const yaw = spring(REST[0], { eps: 0.05 }), pitch = spring(REST[1], { eps: 0.05 }), wake = tween(0);
  let drawn = "";
  function draw(now) {
    const wk = tval(wake, now), wag = reducedMotion() ? 0 : Math.sin(ph) * WAG * wk;
    const key = [yaw.x, pitch.x, wk, wag].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    drawTail(wag);
    const H = frame3([HC[0], HC[1], HZ - (1 - wk) * 1.4], rad(yaw.x), rad(pitch.x)), F = (u, v, h) => P(...H(u, v, h));
    head.setAttribute("d", soft([ell(H, [0, 0, 6.8], [7.6, 7, 6.6]), ell(H, [-3.6, 3, 3.8], [3.6, 3.8, 3]), ell(H, [3.6, 3, 3.8], [3.6, 3.8, 3]), ell(H, [0, 6.6, 3.8], [3.8, 4.4, 3])], 4.5, 0.6));
    // an ear is a long rounded flap hung from the top of the skull; awake it swings out
    const sw = lerp(0.25, 0.7, wk);
    const flap = (s) => soft([Array.from({ length: 20 }, (_, k) => { const t = (k / 20) * 2 * Math.PI, v = 3.4 * Math.cos(t) - 0.6, hh = 6.4 + 6.4 * Math.sin(t); return F(s * (6.2 + hh * Math.sin(sw)), v, 11.4 - hh * Math.cos(sw)); })], 2, 0.6);
    const nearS = H(1, 0, 0)[0] + H(1, 0, 0)[1] > H(-1, 0, 0)[0] + H(-1, 0, 0)[1] ? 1 : -1;
    earFront.setAttribute("d", flap(nearS)); earBack.setAttribute("d", flap(-nearS));
    const front = (u, h) => F(u, 7 * Math.sqrt(Math.max(0.05, 1 - (u / 7.6) ** 2 - ((h - 6.8) / 6.6) ** 2)) + 0.3, h);
    const awake = wk > 0.5;
    lids.setAttribute("d", awake ? "" : [-1, 1].map((s) => open([-1.8, -0.9, 0, 0.9, 1.8].map((d) => front(s * 3.6 + d, 8.6 - 0.8 * (1 - (d / 1.8) ** 2))))).join(""));
    eyes.forEach((e, i) => { e.setAttribute("display", awake ? "inline" : "none"); place(e, front((i ? 1 : -1) * 3.6, 8.6)); });
    place(nose, F(0, 10.9, 5.4));
    // the mouth, and the snout's ridge where it rises from the face
    mouth.setAttribute("d", open([F(-2.6, 9.6, 2.4), F(-1.2, 10.4, 1.8), F(0, 10.8, 2.8), F(1.2, 10.4, 1.8), F(2.6, 9.6, 2.4)]) +
      open(Array.from({ length: 9 }, (_, k) => { const u = -3.2 + k * 0.8; return F(u, 7.2, 3.8 + 2.9 * Math.sqrt(Math.max(0, 1 - (u / 3.8) ** 2 - 0.02))); })));
    tongue.setAttribute("d", wk < 0.05 ? "" : poly([[-1.5, 0], [-1.6, -2.6 * wk], [-0.8, -3.6 * wk], [0.8, -3.6 * wk], [1.6, -2.6 * wk], [1.5, 0]].map(([u, z]) => F(u, 10.2, 1.9 + z))));
  }
  draw(performance.now());

  let on = false;
  const B = register(stage, (dt, now) => {
    const m = [stepS(yaw, dt), stepS(pitch, dt)].some(Boolean);
    if (tval(wake, now) > 0.01 && !reducedMotion()) ph += dt * 13;
    draw(now);
    return m || !tdone(wake, now) || (on && !reducedMotion());
  });
  bag.add(B.unregister);

  // the head's centre on screen never moves; the pointer is read against it
  const [hx, hy] = P(HC[0], HC[1], HZ + 7);
  function watch(p) {
    on = !!p;
    const ty = on ? clamp((p[0] - hx) / 130, -1, 1) * reach : REST[0], tp = on ? clamp((hy - p[1]) / 110, -1, 1) * reach * 0.7 : REST[1];
    yaw.t = ty; pitch.t = tp;
    tset(wake, on ? 1 : 0, performance.now(), 0);
    head.classList.toggle("hi", on);
    nose.setAttribute("class", on ? "dot m" : "dot");
    read.textContent = !on ? "rest" : Math.hypot(ty, tp / 0.7) < reach * 0.3 ? "watch" : "watch " + DIRS[(Math.round(Math.atan2(tp / 0.7, ty) / (Math.PI / 4)) + 8) % 8];
    B.wake();
  }
  watch(null);

  bag.add(pointer(stage, { move: watch, leave: () => watch(null) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "dog",
  means: "A puppy dozing on its bed: bring the pointer near and it wakes, ears up, tongue out, tail wagging, and watches.",
  rules: [1, 5, 7, 9],
  range: [15, 28, 40],
  mount,
});
