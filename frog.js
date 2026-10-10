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
const SEG = { 1: [3, 2], 14: [3, 2], 2: [2, 1], 13: [2, 1], 3: [3, 1], 12: [3, 1], 4: [0, 1], 11: [0, 1], 6: [0, 2], 9: [0, 2], 7: [3, 0], 8: [3, 0] }, LTBR = [3, 0, 2, 1], TRLB = [0, 1, 3, 2];
const SPH = [];
for (let i = 1; i < 9; i++) for (let j = 0; j < 18; j++) { const t = (i / 9) * Math.PI, f = (j / 18) * 2 * Math.PI; SPH.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); } SPH.push([0, 0, 1], [0, 0, -1]);
const rad = (d) => (d * Math.PI) / 180;
/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
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
  const at = (n, dn) => { const key = n * 2 + dn;
    if (n0[key] < 0) { const a = f[n], t = a / (a - f[dn ? n + W : n + 1]), i = n % W; px[key] = X0 + (i + (dn ? 0 : t)) * step; py[key] = Y0 + ((n - i) / W + (dn ? t : 0)) * step; }
    return key;
  };
  const edge = (n, e) => e === 0 ? at(n, 0) : e === 1 ? at(n + 1, 1) : e === 2 ? at(n + W, 0) : at(n, 1); const link = (a, b) => { if (n0[a] < 0) n0[a] = b; else n1[a] = b; if (n0[b] < 0) n0[b] = a; else n1[b] = a; };
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const n = j * W + i, a = f[n], b = f[n + 1], c = f[n + W + 1], dd = f[n + W];
    const cs = (a < 0 ? 8 : 0) | (b < 0 ? 4 : 0) | (c < 0 ? 2 : 0) | (dd < 0 ? 1 : 0);
    if (cs === 0 || cs === 15) continue;
    const mid = a + b + c + dd < 0, sg = cs === 5 ? (mid ? LTBR : TRLB) : cs === 10 ? (mid ? TRLB : LTBR) : SEG[cs];
    for (let q = 0; q < sg.length; q += 2) link(edge(n, sg[q]), edge(n, sg[q + 1]));
  }
  // walk each loop, even out the grid's stair-steps (three passes of neighbour averaging), round it once (Chaikin)
  const seen = new Uint8Array(N), lx = [], ly = []; let d = "";
  for (let start = 0; start < N; start++) {
    if (n0[start] < 0 || seen[start]) continue;
    lx.length = ly.length = 0; let cur = start, prev = -1;
    while (cur >= 0 && !seen[cur]) {
      seen[cur] = 1; lx.push(px[cur]); ly.push(py[cur]);
      const a = n0[cur], b = n1[cur], nx = a >= 0 && a !== prev && !seen[a] ? a : b >= 0 && b !== prev && !seen[b] ? b : -1;
      prev = cur; cur = nx;
    }
    const m = lx.length; if (m <= 6) continue;
    let X = lx.slice(), Y = ly.slice();
    for (let t = 0; t < 3; t++) { X = X.map((v, i) => (X[(i + m - 1) % m] + 2 * v + X[(i + 1) % m]) / 4); Y = Y.map((v, i) => (Y[(i + m - 1) % m] + 2 * v + Y[(i + 1) % m]) / 4); }
    for (let i = 0; i < m; i++) { const j = (i + 1) % m;
      d += (i ? "L" : "M") + (0.75 * X[i] + 0.25 * X[j]).toFixed(1) + " " + (0.75 * Y[i] + 0.25 * Y[j]).toFixed(1) + "L" + (0.25 * X[i] + 0.75 * X[j]).toFixed(1) + " " + (0.25 * Y[i] + 0.75 * Y[j]).toFixed(1);
    } d += "Z";
  }
  return d;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let high = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-34, -30, 0], [18, 34, 0], [30, -28, 0], [-34, 30, 0], [-4, -2, 34]], 200, 168);
  const P = proj(C), g = mk("g", {}, svg);
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

  // a limb set per side: the hind leg (thigh, shin, webbed foot) and the arm (upper, fore, hand), each one outline, each
  // in its own group; the body and everything on it in another. Every frame they are painted back to front (see order).
  const frog = mk("g", {}, g); // the frog: limbs and body, painted back to front
  // each part is its own outline, painted so the joints read: foot, shin, then the thigh over them; hand, forearm, then the upper arm
  const limbs = () => { const lg = mk("g", {}, frog), ag = mk("g", {}, frog), p = (el, c = "sil") => mk("path", { class: c }, el); return { lg, ag, foot: p(lg), shin: p(lg), thigh: p(lg), fold: p(lg, "nf lo"), hand: p(ag), fore: p(ag), upper: p(ag) }; };
  const far = limbs(), bodyG = mk("g", {}, frog), bodyEl = mk("path", { class: "sil" }, bodyG), rims = mk("path", { class: "nf lo" }, bodyG), mouth = mk("path", { class: "nf lo" }, bodyG), near = limbs();
  const pupils = [0, 1].map(() => mk("circle", { r: 1.1, class: "dot" }, bodyG)), spots = mk("path", { class: "nf lo" }, bodyG), belly = mk("path", { class: "nf lo" }, bodyG), nostrils = [0, 1].map(() => mk("circle", { r: 0.75, class: "dot off" }, bodyG)), ridge = mk("path", { class: "nf lo" }, bodyG); // on the body: pupils, back spots, a belly line, nostrils, and on the near side a ridge and an eardrum

  let from = PADS[HOME], to = PADS[HOME], hop = tween(1), face = tween(FACE), splash = tween(1), on = HOME, drawn = "";
  function draw(now) {
    const p = tval(hop, now), hd = tval(face, now), sp = tval(splash, now), key = [p, hd, sp].map((v) => v.toFixed(3)).join();
    if (key === drawn) return; drawn = key; // nothing moved
    const cx = lerp(from[0], to[0], p), cy = lerp(from[1], to[1], p), cz = 0.9 + Math.sin(Math.PI * p) * high;
    const a = rad(hd), F = [Math.cos(a), Math.sin(a)], R = [Math.sin(a), -Math.cos(a)];
    // mid-hop the frog stretches out: body level, legs back, arms ahead
    const st = Math.sin(Math.PI * p), pitch = lerp(0.42, 0.05, st), mix = (u, v) => u.map((x, i) => lerp(x, v[i], st));
    const Wb = (s, f, h) => { s *= K; f *= K; h *= K; const ff = f * Math.cos(pitch) - h * Math.sin(pitch), hh = f * Math.sin(pitch) + h * Math.cos(pitch); return P(cx + R[0] * s + F[0] * ff, cy + R[1] * s + F[1] * ff, cz + hh); };
    const Wg = (s, f, h) => P(cx + (R[0] * s + F[0] * f) * K, cy + (R[1] * s + F[1] * f) * K, cz + h * K);
    const E = (W, c, r) => SPH.map(([x, y, z]) => W(c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]));
    const cap = (p0, p1, r0, r1) => E(Wg, p0, [r0, r0, r0]).concat(E(Wg, p1, [r1, r1, r1]));
    // a fan of n digits from o along d, each of its own length; and their outline: thin digits, each ending in a round knob
    const fan = (o, d, l, spread) => l.map((len, k) => { const a = (k / (l.length - 1) - 0.5) * spread, c = Math.cos(a), s = Math.sin(a); return [o[0] + (d[0] * c - d[1] * s) * len, o[1] + (d[1] * c + d[0] * s) * len, o[2] + d[2] * len]; });
    const digits = (o, tips, r, knob) => soft([E(Wg, o, [r * 2, r * 2, r * 1.4]), ...tips.flatMap((t) => [cap(o, t, r, r * 0.8), E(Wg, t, [knob, knob, knob * 0.7])])], 0.8, 0.4);
    bodyEl.setAttribute("d", soft([E(Wg, [0, 2.4, 1.6], [4.4, 4.6, 1.6].map((r) => r * lerp(1, 0.3, st))), E(Wb, [0, 0, 4.4], [5.6, 7.2, 3.8]), E(Wb, [0, 5, 5.6], [4.8, 4, 3]), E(Wb, [0, 5.6, 3.4], [4.2, 3, 2.2]), E(Wb, [-2.9, 4.4, 8], [2.1, 2.1, 2.1]), E(Wb, [2.9, 4.4, 8], [2.1, 2.1, 2.1])], 5, 0.45));
    rims.setAttribute("d", [-1, 1].map((s) => open(Array.from({ length: 9 }, (_, k) => { const t = rad(10 + k * 20); return Wb(s * 2.9 + 2.2 * Math.cos(t), 4.4 + 1.2, 8 + 2.2 * Math.sin(t)); }))).join(""));
    mouth.setAttribute("d", F[0] + F[1] < -0.2 ? "" : open([-4, -2.4, 0, 2.4, 4].map((s) => Wb(s, 8.2 - Math.abs(s) * 0.3, 4.5 - (1 - (s / 4) ** 2) * 0.5))));
    const depth = ([s, f]) => (R[0] + R[1]) * s + (F[0] + F[1]) * f; // how near a frog-local point is to the viewer
    const nearS = R[0] + R[1] > 0 ? 1 : -1, toward = F[0] + F[1] > 0.3; // toward: the face is turned to the viewer, and the back with its spots away
    const onBack = (s, f) => 4.4 + 3.8 * Math.sqrt(Math.max(0, 1 - (s / 5.6) ** 2 - (f / 7.2) ** 2)) + 0.05;
    spots.setAttribute("d", toward ? "" : [[-1.7, -2.2, 0.95], [1.9, -3.4, 0.75], [0.1, -4.8, 0.6], [-2.6, -4.4, 0.5]].map(([s, f, r]) => poly(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI, u = s + r * 1.2 * Math.cos(t), v = f + r * Math.sin(t); return Wb(u, v, onBack(u, v)); }))).join(""));
    ridge.setAttribute("d", open([3.4, 1.5, -0.5, -2.5, -4.5].map((f) => Wb(nearS * 3.9, f, onBack(3.9, f)))) + poly(Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI; return Wb(nearS * 4.55, 3.4 + 0.9 * Math.cos(t), 5.9 + 0.9 * Math.sin(t)); })));
    belly.setAttribute("d", toward ? open([-2.8, -1.4, 0, 1.4, 2.8].map((u) => { const h = 3.5 - (1 - (u / 2.8) ** 2) * 1.4; return Wb(u, 5.6 + 3 * Math.sqrt(Math.max(0, 1 - (u / 4.2) ** 2 - ((h - 3.4) / 2.2) ** 2)) + 0.1, h); })) : "");
    nostrils.forEach((el, i) => { el.setAttribute("display", toward ? "inline" : "none"); place(el, Wb(i ? 0.9 : -0.9, 8.7, 6.6)); });
    [[far, -nearS], [near, nearS]].forEach(([L, sd]) => {
      // sitting, the hind leg folds flat against the side: the thigh runs low and forward to the knee, the shin tucks
      // back under it, and the foot lies flat beside it; mid-hop it is the same stretched leg as ever
      const hip = mix([sd * 4.2, -3.2, 1.8], [sd * 4.2, -3.6, 3.4]), knee = mix([sd * 5.9, 0.2, 1.5], [sd * 5.2, -9.5, 3]), ankle = mix([sd * 5.8, -2.8, 0.6], [sd * 4.2, -14.5, 2.4]);
      // the foot: four long thin toes fanned out ahead, each with a knob; a fold runs along the top of the thigh
      L.foot.setAttribute("d", digits(ankle, fan(ankle, mix([sd * 0.7, 0.72, 0], [sd * 0.2, -1, -0.15]), [3.4, 4.4, 4.8, 3.8], 1.1 * sd), 0.3, 0.42));
      L.shin.setAttribute("d", soft([cap(knee, ankle, 0.95, 0.7)], 2, 0.5)); L.thigh.setAttribute("d", soft([cap(hip, knee, 1.95, 1.4)], 2, 0.5));
      L.fold.setAttribute("d", open([0.25, 0.5, 0.78].map((t) => Wg(...hip.map((v, j) => lerp(v, knee[j], t) + (j === 2 ? 1.1 : 0)))))); L.dl = depth(knee);
      // the arm reaches ahead through the hop and plants its hand again to land
      const sh = mix([sd * 3.2, 5.4, 2.8], [sd * 3.4, 4.2, 3.4]), elbow = mix([sd * 4, 6.6, 1.5], [sd * 4.6, 9.2, 4.2]), hand = mix([sd * 3.7, 7.7, 0.45], [sd * 3.8, 12.6, 4.4]);
      L.hand.setAttribute("d", digits(hand, fan(hand, mix([sd * 0.45, 0.9, 0], [0, 1, 0.1]), [1.7, 2.1, 2.1, 1.7], 1.5 * sd), 0.24, 0.34));
      L.fore.setAttribute("d", soft([cap(elbow, hand, 0.72, 0.52)], 1.5, 0.45)); L.upper.setAttribute("d", soft([cap(sh, elbow, 1, 0.78)], 1.5, 0.45)); L.da = depth(elbow);
    });
    // order: back to front along the line of sight, so a hind leg behind the head is painted before it, never across the face
    const order = [[bodyG, depth([0, 1.5])], ...[far, near].flatMap((L) => [[L.lg, L.dl], [L.ag, L.da]])].sort((u, v) => u[1] - v[1]);
    if (order.some(([el], i) => frog.children[i] !== el)) order.forEach(([el]) => frog.append(el));
    pupils.forEach((d, i) => place(d, Wb((i ? 1 : -1) * nearS * 2.9 + (i ? 1 : -1) * nearS * 0.4, 6.1, 8.6)));
    // the ripple: a dashed ring that widens from the pad landed on, gone when it has spread
    const pad = PADS[on]; ripple.setAttribute("d", sp >= 0.99 ? "" : poly(Array.from({ length: 48 }, (_, k) => { const t = (k / 48) * 2 * Math.PI, r = pad[2] + 2 + sp * 10; return P(pad[0] + r * Math.cos(t), pad[1] + r * Math.sin(t), 0); })));
  }
  draw(performance.now());

  const B = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ draw(now); return !tdone(hop, now) || !tdone(face, now) || !tdone(splash, now); }); bag.add(B.unregister);

  // the hit test: the pointer on the water's plane, against each pad's footprint
  function hit(p) {
    const w = HL.unproj(C, p[0], p[1], 0); let best = -1, d = 1e9;
    PADS.forEach(([x, y, r], i) => { const e = Math.hypot(w[0] - x, w[1] - y); if (e < r + 4 && e < d) { d = e; best = i; } });
    return best;
  }

  let pick = -1; function choose(i) {
    if (i === pick) return; pick = i;
    pads.forEach((pd, k) => pd.top.classList.toggle("hi", k === i));
    pupils.forEach((d) => d.setAttribute("class", i < 0 ? "dot" : "dot m"));
    read.textContent = i < 0 ? "rest" : `pad ${i + 1}`;
    if (i >= 0 && i !== on) {
      const now = performance.now(), p = tval(hop, now);
      // start from wherever it is, on the ground or in the air
      from = [lerp(from[0], to[0], p), lerp(from[1], to[1], p)];
      to = PADS[i]; on = i;
      let want = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
      const cur = tval(face, now);
      while (want - cur > 180) want -= 360; while (want - cur < -180) want += 360;
      tset(face, want, now, 0);
      hop = tween(0); tset(hop, 1, now, 140);
      splash = tween(0); tset(splash, 1, now, 640);
    }
    B.wake();
  }

  // the frog lights while the pointer is on it, settled on its pad (its pose there is its rest); the pad then gives way
  const onFrog = (p) => { const f = !!p && tdone(hop, performance.now()) && inLoops(p, loops(bodyEl.getAttribute("d"))); bodyEl.classList.toggle("hi", f); pads[on].top.classList.toggle("hi", !f && pick === on); };
  bag.add(pointer(stage, { move: (p) => { choose(hit(p)); onFrog(p); }, leave: () => { choose(-1); onFrog(null); } })); bag.add(() => svg.replaceChildren());

  return { set: (v) => { high = clamp(v, 0, 30); }, destroy: bag.dispose };
}

hairline({
  name: "frog",
  means: "A frog on a lily pad: point at another pad and it turns, hops across on an arc, and a ripple spreads where it lands.",
  rules: [1, 4, 5, 8],
  range: [4, 9, 14],
  mount,
});
