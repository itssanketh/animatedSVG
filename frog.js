/**
 * Frog: a frog sitting on one of three lily pads, eyes bulging, bright. The
 * pointer picks a pad: the frog turns to face it, then hops there on an arc,
 * hind legs kicking out behind and arms reaching ahead to land, and a ripple
 * spreads from the pad when it lands, all on the 700ms curve. The chosen pad
 * takes the bright edge. The read-out names the pad; the slider is how high it
 * hops. Body, head, throat and eye bulges are one soft outline, and each leg is
 * one too. The hit test is the water's plane, which never moves, against each
 * pad's footprint.
 */
const {
  Cam, clamp, fillet, fit, hull, lerp, mk, open, place, pointer, poly, proj, register,
  tdone, tset, tval, tween, disposer,
} = HL;

// pads: centre x, y, radius, and which way the notch points, in degrees
const PADS = [[-20, -12, 12, 30], [16, -16, 10, 160], [2, 18, 13, 250]], HOME = 0, FACE = 95, K = 1.4;
const SEG = { 1: "LB", 14: "LB", 2: "BR", 13: "BR", 3: "LR", 12: "LR", 4: "TR", 11: "TR", 6: "TB", 9: "TB", 7: "LT", 8: "LT" };
const SPH = [];
for (let i = 1; i < 9; i++) for (let j = 0; j < 18; j++) { const t = (i / 9) * Math.PI, f = (j / 18) * 2 * Math.PI; SPH.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); }
SPH.push([0, 0, 1], [0, 0, -1]);
const rad = (d) => (d * Math.PI) / 180;

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
  const bag = disposer(); let high = value;

  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-34, -30, 0], [18, 34, 0], [30, -28, 0], [-34, 30, 0], [-4, -2, 34]], 200, 168);
  const P = proj(C);

  const g = mk("g", {}, svg);
  const pads = PADS.map(([x, y, r, n]) => {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const a = rad(n + 14 + (k / 30) * 332); pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    pts.push([x + 1.2 * Math.cos(rad(n)), y + 1.2 * Math.sin(rad(n))]);
    const ring = fillet(pts, pts.map(() => 1.2), 2);
    mk("path", { d: poly(ring.map(([u, v]) => P(u, v, 0))), class: "lo" }, g);
    const top = mk("path", { d: poly(ring.map(([u, v]) => P(u, v, 0.9))), class: "sil" }, g);
    mk("path", { d: [70, 140, 220, 290].map((a) => open([P(x, y, 0.9), P(x + r * 0.7 * Math.cos(rad(n + a)), y + r * 0.7 * Math.sin(rad(n + a)), 0.9)])).join(""), class: "nf lo" }, g);
    return { x, y, r, top };
  });
  const ripple = mk("path", { class: "nf dash" }, g);

  // a limb set per side: the hind leg (thigh, shin, webbed foot) and the arm (upper, fore, hand), each one outline.
  // The far set is painted before the body, the near set after it.
  const frog = mk("g", {}, g);
  const limbs = () => ({ leg: mk("path", { class: "sil" }, frog), toes: mk("path", { class: "nf lo" }, frog), arm: mk("path", { class: "sil" }, frog), fingers: mk("path", { class: "nf lo" }, frog) });
  const far = limbs(), bodyEl = mk("path", { class: "sil" }, frog), rims = mk("path", { class: "nf lo" }, frog), mouth = mk("path", { class: "nf lo" }, frog), near = limbs();
  const pupils = [0, 1].map(() => mk("circle", { r: 1.1, class: "dot" }, frog));

  let from = PADS[HOME], to = PADS[HOME], hop = tween(1), face = tween(FACE), splash = tween(1), on = HOME;
  let drawn = "";
  function draw(now) {
    const p = tval(hop, now), hd = tval(face, now), sp = tval(splash, now), key = [p, hd, sp].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    const cx = lerp(from[0], to[0], p), cy = lerp(from[1], to[1], p), cz = 0.9 + Math.sin(Math.PI * p) * high;
    const a = rad(hd), F = [Math.cos(a), Math.sin(a)], R = [Math.sin(a), -Math.cos(a)];
    // mid-hop the frog stretches out: body level, legs back, arms ahead
    const st = Math.sin(Math.PI * p), pitch = lerp(0.42, 0.05, st), mix = (u, v) => u.map((x, i) => lerp(x, v[i], st));
    const Wb = (s, f, h) => { s *= K; f *= K; h *= K; const ff = f * Math.cos(pitch) - h * Math.sin(pitch), hh = f * Math.sin(pitch) + h * Math.cos(pitch); return P(cx + R[0] * s + F[0] * ff, cy + R[1] * s + F[1] * ff, cz + hh); };
    const Wg = (s, f, h) => P(cx + (R[0] * s + F[0] * f) * K, cy + (R[1] * s + F[1] * f) * K, cz + h * K);
    const E = (W, c, r) => SPH.map(([x, y, z]) => W(c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]));
    const cap = (p0, p1, r0, r1) => E(Wg, p0, [r0, r0, r0]).concat(E(Wg, p1, [r1, r1, r1]));
    bodyEl.setAttribute("d", soft([E(Wb, [0, 0, 4.4], [5.6, 7.2, 3.8]), E(Wb, [0, 5, 5.6], [4.8, 4, 3]), E(Wb, [0, 5.6, 3.4], [4.2, 3, 2.2]), E(Wb, [-2.9, 4.4, 8], [2.1, 2.1, 2.1]), E(Wb, [2.9, 4.4, 8], [2.1, 2.1, 2.1])], 5, 0.6));
    rims.setAttribute("d", [-1, 1].map((s) => open(Array.from({ length: 9 }, (_, k) => { const t = rad(10 + k * 20); return Wb(s * 2.9 + 2.2 * Math.cos(t), 4.4 + 1.2, 8 + 2.2 * Math.sin(t)); }))).join(""));
    mouth.setAttribute("d", open([-4, -2.4, 0, 2.4, 4].map((s) => Wb(s, 8.2 - Math.abs(s) * 0.3, 4.5 - (1 - (s / 4) ** 2) * 0.5))));
    const nearS = R[0] + R[1] > 0 ? 1 : -1;
    [[far, -nearS], [near, nearS]].forEach(([L, sd]) => {
      const hip = [sd * 4.2, -3.6, 3.4], knee = mix([sd * 7.4, 1.2, 1.8], [sd * 5.2, -9.5, 3]), ankle = mix([sd * 5.6, -3.4, 0.9], [sd * 4.2, -14.5, 2.4]);
      const td = mix([sd * 0.35, 1, 0], [sd * 0.2, -1, -0.15]), side = [-td[1], td[0]];
      const toes = [-1, 0, 1].map((k) => [ankle[0] + td[0] * 4.4 + side[0] * k * 1.9, ankle[1] + td[1] * 4.4 + side[1] * k * 1.9, ankle[2] + td[2] * 4]);
      L.leg.setAttribute("d", soft([cap(hip, knee, 2.4, 1.4), cap(knee, ankle, 1.2, 0.9), [Wg(...ankle), ...toes.flatMap((t) => E(Wg, t, [0.6, 0.6, 0.4]))]], 3, 0.6));
      L.toes.setAttribute("d", toes.map((t) => open([Wg(...ankle), Wg(...t)])).join(""));
      // the arm reaches ahead through the hop and plants its hand again to land
      const sh = [sd * 3.4, 4.2, 3.4], elbow = mix([sd * 5.4, 5.8, 1.8], [sd * 4.6, 9.2, 4.2]), hand = mix([sd * 5, 8, 0.5], [sd * 3.8, 12.6, 4.4]);
      L.arm.setAttribute("d", soft([cap(sh, elbow, 1.3, 1), cap(elbow, hand, 1, 0.8), E(Wg, hand, [1.4, 1.6, 0.6])], 2.5, 0.6));
      L.fingers.setAttribute("d", [-0.6, 0, 0.6].map((k) => open([Wg(...hand), Wg(hand[0] + sd * k * 1.6, hand[1] + 1.9, hand[2] - 0.2)])).join(""));
    });
    pupils.forEach((d, i) => place(d, Wb((i ? 1 : -1) * nearS * 2.9 + (i ? 1 : -1) * nearS * 0.4, 6.1, 8.6)));
    // the ripple: a dashed ring that widens from the pad landed on, gone when it has spread
    const pad = PADS[on];
    ripple.setAttribute("d", sp >= 0.99 ? "" : poly(Array.from({ length: 48 }, (_, k) => { const t = (k / 48) * 2 * Math.PI, r = pad[2] + 2 + sp * 10; return P(pad[0] + r * Math.cos(t), pad[1] + r * Math.sin(t), 0); })));
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => { draw(now); return !tdone(hop, now) || !tdone(face, now) || !tdone(splash, now); });
  bag.add(B.unregister);

  // the hit test: the pointer on the water's plane, against each pad's footprint
  function hit(p) {
    const w = HL.unproj(C, p[0], p[1], 0);
    let best = -1, d = 1e9;
    PADS.forEach(([x, y, r], i) => { const e = Math.hypot(w[0] - x, w[1] - y); if (e < r + 4 && e < d) { d = e; best = i; } });
    return best;
  }

  let pick = -1;
  function choose(i) {
    if (i === pick) return;
    pick = i;
    pads.forEach((pd, k) => pd.top.classList.toggle("hi", k === i));
    pupils.forEach((d) => d.setAttribute("class", i < 0 ? "dot" : "dot m"));
    read.textContent = i < 0 ? "rest" : `pad ${i + 1}`;
    if (i >= 0 && i !== on) {
      const now = performance.now(), p = tval(hop, now);
      // start from wherever it is, on the ground or in the air
      from = [lerp(from[0], to[0], p), lerp(from[1], to[1], p)];
      to = PADS[i];
      on = i;
      let want = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
      const cur = tval(face, now);
      while (want - cur > 180) want -= 360;
      while (want - cur < -180) want += 360;
      tset(face, want, now, 0);
      hop = tween(0); tset(hop, 1, now, 140);
      splash = tween(0); tset(splash, 1, now, 640);
    }
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { high = clamp(v, 0, 30); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "frog",
  means: "A frog on a lily pad: point at another pad and it turns, hops across on an arc, and a ripple spreads where it lands.",
  rules: [1, 4, 5, 8],
  range: [4, 9, 14],
  mount,
});
