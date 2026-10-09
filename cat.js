/**
 * Cat: a cat sitting up, tail curled round its front, dozing: head down, ears
 * folded out, eyes shut. Bring the pointer near and it wakes on the 700ms
 * curve, ears up, half-lidded eyes open and glance toward the pointer, tail tip
 * lifting, and its head follows the pointer on two springs. The blaze, the leg
 * lines and the patches lie on the round surfaces, so they turn with them. The
 * read-out names where it watches; the slider is how far the head can go. The
 * hit test is the head's fixed centre on screen.
 */
const {
  Cam, clamp, fit, lerp, mk, open, place, pointer, poly, proj, rad, register,
  spring, stepS, tdone, tset, tval, tween, disposer, hull,
} = HL;

const S = 6.2, F0 = [Math.SQRT1_2, Math.SQRT1_2], R0 = [Math.SQRT1_2, -Math.SQRT1_2];
const BC = [-1, -1], HZ = 23, REST = [-16, -16];
// the body, sitting: a wide round seat, a narrower chest, the neck ([centre], [radii])
const BODY = [[[0, 0, 6.8], [9, 8, 6.8]], [[0, 0.8, 13.4], [7, 6, 8]], [[0, 1.4, 20], [5.2, 4.8, 4.4]]];
const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
// marching squares: the crossing edges joined in each cell case, as pairs of edges T 0, R 1, B 2, L 3 (5 and 10, the saddles, are decided by the cell's middle)
const SEG = { 1: [3, 2], 14: [3, 2], 2: [2, 1], 13: [2, 1], 3: [3, 1], 12: [3, 1], 4: [0, 1], 11: [0, 1], 6: [0, 2], 9: [0, 2], 7: [3, 0], 8: [3, 0] };
const LTBR = [3, 0, 2, 1], TRLB = [0, 1, 3, 2];
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
  step *= 2; // twice the callers' spacing: the contour is interpolated, so it looks the same for a quarter of the work
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
      const bx = Math.max(p.x0 - x, x - p.x1, 0), by = Math.max(p.y0 - y, y - p.y1, 0), bd = Math.sqrt(bx * bx + by * by), pl = p.pl;
      let d = bd;
      if (bd < k + 1) { d = -1e9; for (let q = 0; q < pl.length && d < v + k; q += 3) { const e = pl[q] * x + pl[q + 1] * y - pl[q + 2]; if (e > d) d = e; } if (d >= v + k) continue; } // k above v: the smooth min ignores it
      const hh = Math.max(k - Math.abs(v - d), 0) / k; v = Math.min(v, d) - hh * hh * k * 0.25; if (d < -2 * step) break; // deep inside: only the sign matters now
    }
    f[j * W + i] = v;
  }
  // marching squares: each crossing has a slot for its grid edge (node * 2 + down) and joins exactly two others
  const N = W * H * 2, px = new Float32Array(N), py = new Float32Array(N), n0 = new Int32Array(N).fill(-1), n1 = new Int32Array(N).fill(-1);
  const at = (n, dn) => {
    const key = n * 2 + dn;
    if (n0[key] < 0) { const a = f[n], t = a / (a - f[dn ? n + W : n + 1]), i = n % W; px[key] = X0 + (i + (dn ? 0 : t)) * step; py[key] = Y0 + ((n - i) / W + (dn ? t : 0)) * step; }
    return key;
  };
  const edge = (n, e) => e === 0 ? at(n, 0) : e === 1 ? at(n + 1, 1) : e === 2 ? at(n + W, 0) : at(n, 1);
  const link = (a, b) => { if (n0[a] < 0) n0[a] = b; else n1[a] = b; if (n0[b] < 0) n0[b] = a; else n1[b] = a; };
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const n = j * W + i, a = f[n], b = f[n + 1], c = f[n + W + 1], dd = f[n + W];
    const cs = (a < 0 ? 8 : 0) | (b < 0 ? 4 : 0) | (c < 0 ? 2 : 0) | (dd < 0 ? 1 : 0);
    if (cs === 0 || cs === 15) continue;
    const mid = a + b + c + dd < 0, sg = cs === 5 ? (mid ? LTBR : TRLB) : cs === 10 ? (mid ? TRLB : LTBR) : SEG[cs];
    for (let q = 0; q < sg.length; q += 2) link(edge(n, sg[q]), edge(n, sg[q + 1]));
  }
  // walk each loop, round its corners once (Chaikin) and write it at a tenth of a unit
  const seen = new Uint8Array(N), lx = [], ly = [];
  let d = "";
  for (let start = 0; start < N; start++) {
    if (n0[start] < 0 || seen[start]) continue;
    lx.length = ly.length = 0;
    let cur = start, prev = -1;
    while (cur >= 0 && !seen[cur]) {
      seen[cur] = 1; lx.push(px[cur]); ly.push(py[cur]);
      const a = n0[cur], b = n1[cur], nx = a >= 0 && a !== prev && !seen[a] ? a : b >= 0 && b !== prev && !seen[b] ? b : -1;
      prev = cur; cur = nx;
    }
    const m = lx.length;
    if (m <= 6) continue;
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      d += (i ? "L" : "M") + (0.75 * lx[i] + 0.25 * lx[j]).toFixed(1) + " " + (0.75 * ly[i] + 0.25 * ly[j]).toFixed(1) + "L" + (0.25 * lx[i] + 0.75 * lx[j]).toFixed(1) + " " + (0.25 * ly[i] + 0.75 * ly[j]).toFixed(1);
    }
    d += "Z";
  }
  return d;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;

  const C = Cam(45, 0.5, S);
  fit(C, [[-13, -13, 0], [13, 13, 0], [13, -13, 0], [-13, 13, 0], [0, 0, HZ + 19]], 200, 166);
  const P = proj(C);
  const body = frame3([BC[0], BC[1], 0], 0, 0), B3 = (u, v, z) => P(...body(u, v, z));
  /** An ellipsoid's surface on screen, in a frame. */
  const ell = (Fr, c, r) => SPH.map(([a, b, h]) => P(...Fr(c[0] + a * r[0], c[1] + b * r[1], c[2] + h * r[2])));
  /** A tube through [centre, radius] stations, as capsule segments, each the hull of its two end balls. */
  const tubeOf = (st, Fr = body) => st.slice(1).map(([c, r], i) => ell(Fr, st[i][0], [st[i][1], st[i][1], st[i][1]]).concat(ell(Fr, c, [r, r, r])));
  /** A point on the front of the body, at (u, z): the nearest of its rounds. */
  const onBody = (u, z) => B3(u, 0.3 + Math.max(...BODY.map(([c, r]) => c[1] + r[1] * Math.sqrt(Math.max(0, 1 - ((u - c[0]) / r[0]) ** 2 - ((z - c[2]) / r[2]) ** 2)))), z);
  const HC = [BC[0] + 4.2 * F0[0], BC[1] + 4.2 * F0[1]];

  const g = mk("g", {}, svg);
  // the body as one soft outline, then what lies on it: two patches, and the front legs as three lines
  mk("path", { d: soft(BODY.map(([c, r]) => ell(body, c, r)), 8, 0.3), class: "sil" }, g);
  mk("path", { d: [[[6.5, 15.8], [5.2, 14.4], [4.8, 12.4], [5.2, 10.6], [6.6, 9.6]], [[-8.6, 9.4], [-7, 8.8], [-6.2, 7], [-6.6, 5], [-8, 3.6]]].map((c) => open(c.map(([u, z]) => onBody(u, z)))).join(""), class: "nf lo" }, g);
  mk("path", { d: [[-3.6, -2], [0, 0], [3.6, 2]].map(([a, b]) => open(Array.from({ length: 6 }, (_, k) => onBody(lerp(a, b, k / 5), lerp(12.5, 1.5, k / 5))))).join(""), class: "nf lo" }, g);

  // the tail: a chain of balls on the floor, merged into one thick tube: out of the right haunch, round the front, its tip free on the left
  const tail = mk("path", { class: "sil" }, g);
  const tailAt = (wk) => tubeOf(Array.from({ length: 25 }, (_, k) => {
    const t = k / 24, a = rad(lerp(25, 176, t)), R = lerp(8.6, 12.2, t * t), r = lerp(2.4, 3, t);
    return [[R * Math.cos(a), R * Math.sin(a), r + 0.2 + (t > 0.8 ? wk * 6 * ((t - 0.8) / 0.2) ** 2 : 0)], r];
  }));

  // the head: a wide skull, full cheeks and both ears in one outline, in the head's own turned and tipped frame
  const head = mk("path", { class: "sil" }, g), inner = mk("path", { class: "nf lo" }, g), blaze = mk("path", { class: "nf lo" }, g);
  const rims = mk("path", { class: "nf lo" }, g), lids = mk("path", { class: "nf" }, g), whisk = mk("path", { class: "nf lo" }, g);
  const eyes = [0, 1].map(() => mk("circle", { r: 1.6, class: "dot" }, g));
  const nose = mk("path", { class: "dot" }, g);

  const yaw = spring(REST[0], { eps: 0.05 }), pitch = spring(REST[1], { eps: 0.05 }), wake = tween(0);
  let drawn = "", tailW = -1;
  function draw(now) {
    const wk = tval(wake, now), key = [yaw.x, pitch.x, wk].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    const tw = Math.round(wk * 30) / 30;
    if (tw !== tailW) { tailW = tw; tail.setAttribute("d", soft(tailAt(tw), 3, 0.4)); }

    const H = frame3([HC[0], HC[1], HZ - (1 - wk) * 1.6], rad(yaw.x), rad(pitch.x)), F = (u, v, h) => P(...H(u, v, h));
    const ear = (s) => {
      const tip = [s * lerp(13.4, 8, wk), lerp(-1.6, -0.6, wk), lerp(10.8, 16.2, wk)];
      return { tip, pts: [[s * 2.6, -0.6, 11.2], [s * 9.6, -0.6, 7.8], [s * 6.2, -2.8, 10.4], [s * 6.2, 1.4, 10], tip].map((p) => F(...p)) };
    };
    const el = ear(-1), er = ear(1);
    head.setAttribute("d", soft([ell(H, [0, 0, 6.6], [9.4, 7.4, 6.8]), ell(H, [-5.2, 2.2, 3.8], [4.8, 4.6, 3.6]), ell(H, [5.2, 2.2, 3.8], [4.8, 4.6, 3.6]), el.pts, er.pts], 4.5, 0.4));
    inner.setAttribute("d", [[-1, el], [1, er]].map(([s, e]) => open([F(s * 3.8, 0.2, 11), F(e.tip[0] * 0.92, e.tip[1] + 0.6, e.tip[2] - 2.4), F(s * 8.4, 0.2, 8.6)])).join(""));

    // the face lies on the front of the skull: the blaze down the forehead, the eyes, the nose, the whiskers
    const front = (u, h) => F(u, 7.4 * Math.sqrt(Math.max(0.05, 1 - (u / 9.4) ** 2 - ((h - 6.6) / 6.8) ** 2)) + 0.3, h);
    blaze.setAttribute("d", [-1, 1].map((s) => open(Array.from({ length: 7 }, (_, k) => front(s * lerp(0.8, 2.6, (k / 6) ** 2), lerp(13.1, 8.8, k / 6))))).join(""));
    const awake = wk > 0.5, look = clamp(yaw.x / 25, -1, 1);
    rims.setAttribute("d", awake ? [-1, 1].map((s) => poly(Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * 2 * Math.PI; return front(s * 4 + 2.4 * Math.cos(a), 7.25 + 1.3 * Math.sin(a)); }))).join("") : "");
    // awake, a heavy lid across each eye's top: half-lidded; asleep, a closed curve
    lids.setAttribute("d", [-1, 1].map((s) => open([-2, -1, 0, 1, 2].map((d) => awake ? front(s * 4 + d * 1.15, 7.95 - 0.14 * Math.abs(d)) : front(s * 4 + d * 0.9, 7.6 - 0.8 * (1 - (d / 2) ** 2))))).join(""));
    eyes.forEach((e, i) => { e.setAttribute("display", awake ? "inline" : "none"); place(e, front((i ? 1 : -1) * 4 + look * 1.1, 7.05)); });
    nose.setAttribute("d", poly([front(-0.9, 6.2), front(0.9, 6.2), front(0, 5.3)]));
    whisk.setAttribute("d", [-1, 1].flatMap((s) => [open([F(s * 4.2, 6.6, 4.6), F(s * 14, 5.4, 5.8)]), open([F(s * 4.2, 6.6, 3.8), F(s * 13.5, 5.4, 2.6)])]).join(""));
  }
  draw(performance.now());

  const B = register(stage, (dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ const m = [stepS(yaw, dt), stepS(pitch, dt)].some(Boolean); draw(now); return m || !tdone(wake, now); });
  bag.add(B.unregister);

  // the head's centre on screen never moves; the pointer is read against it
  const [hx, hy] = P(HC[0], HC[1], HZ + 7);
  function watch(p) {
    const on = !!p, ty = on ? clamp((p[0] - hx) / 130, -1, 1) * reach : REST[0], tp = on ? clamp((hy - p[1]) / 110, -1, 1) * reach * 0.7 : REST[1];
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
  name: "cat",
  means: "A cat sitting with its tail round its front, dozing: bring the pointer near and it wakes, ears up, and turns to watch.",
  rules: [1, 5, 8, 9],
  range: [15, 28, 40],
  mount,
});
