/**
 * Birds: five small birds perched on a sagging wire between two posts, each
 * turned a little its own way, one with a bright eye. The pointer picks a
 * bird: it lifts off the wire, wings out and beating, while the others shuffle
 * along the wire away from the gap, staggered outwards from it on the 700ms
 * curve. The read-out names the bird. The slider is the stagger, in ms.
 *
 * Every part is a rounded solid: bodies and heads are ellipsoids drawn as the
 * hull of their surface, beaks and tails small plates. The hit test is each
 * bird's resting centre on screen, nearest in x within a band round the wire.
 */
const {
  Cam, clamp, facing, fit, hull, lerp, mk, open, place, pointer, poly, prism, proj, put, rad, reducedMotion,
  register, rings, solid, tdone, tset, tval, tween, disposer,
} = HL;

const N = 5, GAP = 21, X0 = -58, X1 = 58, ZW = 30, SAG = 5, LIFT = 22, SHUF = 4, K = 1.6;
const YAW = [-18, 16, -4, 28, -12], EYE = 2;
const SPH = [];
for (let i = 1; i < 10; i++) for (let j = 0; j < 20; j++) {
  const t = (i / 10) * Math.PI, f = (j / 20) * 2 * Math.PI;
  SPH.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]);
}
SPH.push([0, 0, 1], [0, 0, -1]);
const wireZ = (x) => ZW - SAG * (1 - (x / X1) ** 2);

const SEG = { 1: "LB", 14: "LB", 2: "BR", 13: "BR", 3: "LR", 12: "LR", 4: "TR", 11: "TR", 6: "TB", 9: "TB", 7: "LT", 8: "LT" };
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
  const bag = disposer();
  let stag = value, ph = 0, act = -1;

  const C = Cam(45, 0.5, 2.2);
  fit(C, [[0, X0, 0], [0, X1, 0], [0, X0, ZW + 6], [0, X1, ZW + 6], [0, 0, ZW + LIFT + 22]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const post = (x) => {
    const [r, i] = rings(-2, x - 2, 2, x + 2, 1.6, 0.6);
    const s = solid(g);
    put(s, prism(P, front, r, i, 0, ZW + 4));
    const [cr, ci] = rings(-1.4, x - 4, 1.4, x + 4, 1.2, 0.5);
    put(solid(g), prism(P, front, cr, ci, ZW - 1, ZW + 1));
  };
  post(X0);
  mk("path", { d: open(Array.from({ length: 41 }, (_, k) => { const x = lerp(X0, X1, k / 40); return P(0, x, wireZ(x)); })), class: "nf" }, g);

  const birds = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g), el = {};
    for (const k of ["wb", "tail", "body", "head", "beak", "wf"]) el[k] = mk("path", { class: k === "body" ? "sil" : k === "head" ? "nf lo" : "" }, grp);
    el.legs = mk("path", { class: "nf lo" }, grp);
    el.eye = mk("circle", { r: 1, class: i === EYE ? "dot" : "dot off" }, grp);
    birds.push({ x: (i - (N - 1) / 2) * GAP, el, up: tween(0), dx: tween(0) });
  }
  post(X1);

  /** Bird i's paths, lifted by u (0..1) and slid by dx along the wire. */
  function drawBird(i, u, dx) {
    const b = birds[i], el = b.el, x = b.x + dx, z = wireZ(x) + u * LIFT, yaw = rad(lerp(YAW[i], 0, u)), pitch = rad(lerp(18, -8, u));
    // facing +x, across the wire, turned by yaw toward the eye
    const R = [Math.sin(yaw), -Math.cos(yaw), 0], Fh = [Math.cos(yaw), Math.sin(yaw), 0];
    const F = [Fh[0] * Math.cos(pitch), Fh[1] * Math.cos(pitch), Math.sin(pitch)], U = [-Fh[0] * Math.sin(pitch), -Fh[1] * Math.sin(pitch), Math.cos(pitch)];
    const W = (a, f, h) => { a *= K; f *= K; h *= K; return P(R[0] * a + F[0] * f + U[0] * h, x + R[1] * a + F[1] * f + U[1] * h, z + R[2] * a + F[2] * f + U[2] * h); };
    const pts = (c, r) => SPH.map(([a, f, h]) => W(c[0] + a * r[0], c[1] + f * r[1], c[2] + h * r[2]));
    // breast, back and head in one outline: a plump body that rises into the head through a short neck
    el.body.setAttribute("d", soft([pts([0, -0.6, 4.4], [3.2, 5.8, 3.4]), pts([0, 1.6, 5.4], [3, 3.6, 3.4]), pts([0, 3.4, 8.2], [2.3, 2.5, 2.3]), pts([0, -5, 4], [1.6, 2.4, 1.2])], 4.5, 0.5));
    el.head.setAttribute("d", open([-1, -0.5, 0, 0.5, 1].map((t) => W(t * 2.6, 2.2 + (1 - t * t) * 1.2, 6.6 - (1 - t * t) * 0.6))));
    el.beak.setAttribute("d", poly(hull([W(-0.7, 5.6, 8.4), W(0.7, 5.6, 8.4), W(0, 5.6, 7.6), W(0, 5.6, 9), W(0, 8, 8)])));
    el.tail.setAttribute("d", poly([W(-1.4, -4.6, 4), W(1.4, -4.6, 4), W(2.4, -11.5, 2.2 + u * 2), W(0, -10.4, 2.6 + u * 2), W(-2.4, -11.5, 2.2 + u * 2)]));
    place(el.eye, W(1.6, 4.6, 8.9));
    el.legs.setAttribute("d", u > 0.15 ? "" : [-1, 1].map((s) => open([W(s * 1.3, 0.6, 1.6), W(s * 1.3, 1, -0.2)])).join(""));
    // wings: folded on the sides when perched; out and beating in the air
    const beat = reducedMotion() ? 0.3 : Math.sin(ph * 2 + i), wing = (s) => {
      if (u < 0.05) return "";
      const span = 11 * u, lift = 4 * beat * u;
      return soft([[W(s * 2.6, 2, 7), W(s * (2.6 + span * 0.6), 1.2, 7.4 + lift * 0.6), W(s * (2.6 + span), -1.6, 7 + lift), W(s * (2.6 + span * 0.7), -3.6, 6.6 + lift * 0.7), W(s * 2.6, -3, 6.2)]], 2, 0.6);
    };
    const nearS = R[0] + R[1] > 0 ? 1 : -1;
    el.wb.setAttribute("d", wing(-nearS)); el.wf.setAttribute("d", wing(nearS));
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    if (act >= 0 && !reducedMotion()) { ph += dt * 9; moving = true; }
    birds.forEach((b, i) => { drawBird(i, tval(b.up, now), tval(b.dx, now)); if (!tdone(b.up, now) || !tdone(b.dx, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // the hit test: each bird's resting centre on screen, the nearest in x, within a band round the wire
  const rest = birds.map((b) => P(0, b.x, wireZ(b.x) + 9));
  function hit([x, y]) {
    let best = -1, d = 1e9;
    rest.forEach((c, i) => { const e = Math.abs(c[0] - x); if (e < d && Math.abs(c[1] - y) < 55) { d = e; best = i; } });
    return d < GAP * 1.6 ? best : -1;
  }

  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    birds.forEach((b, i) => {
      const delay = Math.abs(i - from) * stag;
      tset(b.up, i === a ? 1 : 0, now, i === a ? 0 : delay);
      tset(b.dx, a < 0 || i === a ? 0 : Math.sign(i - a) * SHUF / Math.max(1, Math.abs(i - a) * 0.7), now, delay);
      b.el.body.classList.toggle("hi", i === a); b.el.head.classList.toggle("hi", i === a);
      b.el.eye.setAttribute("class", i === a ? "dot" : i === EYE && a < 0 ? "dot" : "dot off");
    });
    read.textContent = a < 0 ? "rest" : `bird ${a + 1}`;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = clamp(v, 0, 200); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "birds",
  means: "Five birds on a wire: the one under the pointer takes off, and the others shuffle away from the gap in turn.",
  rules: [1, 2, 8, 9],
  range: [0, 50, 110],
  mount,
});
