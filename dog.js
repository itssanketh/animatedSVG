/**
 * Dog: a chubby puppy sitting up, floppy ears hanging, dozing. Bring the pointer near and it wakes on the
 * 700ms curve, ears lift, eyes crease into a smile, tongue out, and its head follows the pointer on two
 * springs; its tail wags while the pointer stays. The slider is how far the head can go; the hit test is the
 * head's fixed centre on screen.
 */
const {
  Cam, clamp, fit, hull, lerp, mk, open, place, pointer, poly, proj, rad, reducedMotion, register,
  spring, stepS, tdone, tset, tval, tween, disposer,
} = HL;

const S = 6.9, F0 = [Math.SQRT1_2, Math.SQRT1_2], R0 = [Math.SQRT1_2, -Math.SQRT1_2];
const BC = [-1, -1], HZ = 21, REST = [14, -14], WAG = 3.2;
// the body, sitting: a wide seat, two haunches, a deep chest, the neck ([centre], [radii])
const BODY = [[[0, -1, 6], [8, 7.6, 6]], [[-6.8, -1.4, 4.8], [3.8, 6.4, 4.8]], [[6.8, -1.4, 4.8], [3.8, 6.4, 4.8]], [[0, 1, 12], [6.4, 5.6, 7.4]], [[0, 1.6, 18], [5, 4.6, 4]]];
/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
const SEG = { 1: [3, 2], 14: [3, 2], 2: [2, 1], 13: [2, 1], 3: [3, 1], 12: [3, 1], 4: [0, 1], 11: [0, 1], 6: [0, 2], 9: [0, 2], 7: [3, 0], 8: [3, 0] }, LTBR = [3, 0, 2, 1], TRLB = [0, 1, 3, 2];
const sph = (n, m) => { const o = [[0, 0, 1], [0, 0, -1]]; for (let i = 1; i < n; i++) for (let j = 0; j < m; j++) { const t = (i / n) * Math.PI, f = (j / m) * 2 * Math.PI; o.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); } return o; };
const SPH = sph(9, 18), SPH2 = sph(16, 40); // the head's rounds are sampled finer: its outline is their hull, smooth while it turns

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
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      d += (i ? "L" : "M") + (0.75 * lx[i] + 0.25 * lx[j]).toFixed(1) + " " + (0.75 * ly[i] + 0.25 * ly[j]).toFixed(1) + "L" + (0.25 * lx[i] + 0.75 * lx[j]).toFixed(1) + " " + (0.25 * ly[i] + 0.75 * ly[j]).toFixed(1);
    } d += "Z";
  }
  return d;
}


function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value, ph = 0;

  const C = Cam(45, 0.5, S);
  fit(C, [[-13, -13, 0], [13, 13, 0], [13, -13, 0], [-13, 13, 0], [0, 0, HZ + 19]], 200, 166);
  const P = proj(C);
  const body = frame3([BC[0], BC[1], 0], 0, 0), B3 = (u, v, z) => P(...body(u, v, z));
  const ell = (Fr, c, r, U = SPH) => U.map(([a, b, h]) => P(...Fr(c[0] + a * r[0], c[1] + b * r[1], c[2] + h * r[2])));
  /** A tube through [centre, radius] stations, as capsule segments, each the hull of its two end balls. */
  const tubeOf = (st, Fr = body) => st.slice(1).map(([c, r], i) => ell(Fr, st[i][0], [st[i][1], st[i][1], st[i][1]]).concat(ell(Fr, c, [r, r, r])));
  /** A point on the front of the body, at (u, z): the nearest of its rounds. */
  const onBody = (u, z) => B3(u, 0.3 + Math.max(...BODY.map(([c, r]) => c[1] + r[1] * Math.sqrt(Math.max(0, 1 - ((u - c[0]) / r[0]) ** 2 - ((z - c[2]) / r[2]) ** 2)))), z);
  const HC = [BC[0] + 4.4 * F0[0], BC[1] + 4.4 * F0[1]];

  const g = mk("g", {}, svg);
  // the tail, raised from behind the right haunch, wagging side to side; painted first, so only what clears the body shows
  const tail = mk("path", { class: "sil" }, g);
  const drawTail = (wag) => tail.setAttribute("d", soft(tubeOf(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return [[8.6 + t * 5.2 + wag * t * t * 0.7, -7 - t * 2.4, 6 + t * 10 - t * t * 1.4], lerp(2.6, 1.6, t)]; })), 3, 0.5));

  // the body and haunches as one outline; the line down the chest; the back paws out at the sides
  const torso = mk("path", { d: soft(BODY.map(([c, r]) => ell(body, c, r)), 6, 0.3), class: "sil" }, g), legs = [];
  mk("path", { d: open(Array.from({ length: 7 }, (_, k) => onBody(0, lerp(16, 6, k / 6)))) + [-1, 1].map((s) => open([[5, 9.6], [4.6, 7], [5.2, 4]].map(([u, z]) => onBody(s * u, z)))).join(""), class: "nf lo" }, g);
  const paws = [-1, 1].map((s) => mk("path", { d: soft([ell(body, [s * 8, 3.6, 1.3], [2.6, 3.4, 1.3])], 1.5, 0.4), class: "sil" }, g));
  // the front legs, two columns down to round paws, two toe lines on each paw
  for (const s of [-1, 1]) {
    legs.push(mk("path", { d: soft([...tubeOf([[[s * 2.7, 5.2, 10], 2.4], [[s * 2.8, 6.4, 3], 2.2]]), ell(body, [s * 2.9, 7.8, 1.4], [2.6, 3.2, 1.5])], 2, 0.4), class: "sil" }, g));
    mk("path", { d: [-0.9, 0.9].map((o) => open([B3(s * 2.9 + o, 10.6, 0.5), B3(s * 2.9 + o, 10.9, 2)])).join(""), class: "nf lo" }, g);
  }

  // the head: a big round skull, cheeks and a short muzzle in one outline; the ears are wide flaps, the far one before the head
  const earBack = mk("path", { class: "sil" }, g), head = mk("path", { class: "sil" }, g), earFront = mk("path", { class: "sil" }, g);
  const muzzle = mk("path", { class: "nf lo" }, g), tongue = mk("path", { class: "" }, g), mouth = mk("path", { class: "nf" }, g), lids = mk("path", { class: "nf" }, g);
  const nose = mk("ellipse", { rx: 2.6, ry: 1.8, class: "dot" }, g);

  const yaw = spring(REST[0], { eps: 0.05 }), pitch = spring(REST[1], { eps: 0.05 }), wake = tween(0);
  let drawn = "";
  function draw(now) {
    const wk = tval(wake, now), wag = reducedMotion() ? 0 : Math.sin(ph) * WAG * wk;
    const key = [yaw.x, pitch.x, wk, wag].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;
    drawTail(wag);
    const H = frame3([HC[0], HC[1], HZ - (1 - wk) * 1.4], rad(yaw.x), rad(pitch.x)), F = (u, v, h) => P(...H(u, v, h));
    const M = [[0, 6.4, 3.6], [4.4, 3.4, 2.8]];
    head.setAttribute("d", poly(hull([[[0, 0, 7], [9.2, 7.6, 7]], [[-4.6, 3.2, 4], [4.2, 4, 3.2]], [[4.6, 3.2, 4], [4.2, 4, 3.2]], M].flatMap(([c, r]) => ell(H, c, r, SPH2)))));
    // an ear is a wide flap facing forward, hung from the top corner of the skull and widening to its tip; awake it swings out
    const sw = lerp(0.12, 0.55, wk);
    const flap = (s) => poly(hull(Array.from({ length: 48 }, (_, k) => {
      const t = (k / 48) * 2 * Math.PI, along = 5.8 * (1 - Math.cos(t)), across = 3.6 * Math.sin(t) * (0.6 + along / 29);
      return F(s * (6.8 + along * Math.sin(sw) + across * Math.cos(sw)), 1 + along * 0.12, 12.4 - along * Math.cos(sw) + across * Math.sin(sw));
    })));
    const nearS = H(1, 0, 0)[0] + H(1, 0, 0)[1] > H(-1, 0, 0)[0] + H(-1, 0, 0)[1] ? 1 : -1;
    earFront.setAttribute("d", flap(nearS)); earBack.setAttribute("d", flap(-nearS));
    // the face lies on the front of the skull and muzzle
    const front = (u, h) => F(u, 7.6 * Math.sqrt(Math.max(0.05, 1 - (u / 9.2) ** 2 - ((h - 7) / 7) ** 2)) + 0.3, h);
    const snout = (u, h) => F(u, 6.4 + 3.4 * Math.sqrt(Math.max(0.05, 1 - (u / 4.4) ** 2 - ((h - 3.6) / 2.8) ** 2)) + 0.2, h);
    // the eyes: closed curves asleep; awake, they crease up into a smile
    lids.setAttribute("d", [-1, 1].map((s) => open([-1.8, -0.9, 0, 0.9, 1.8].map((d) => front(s * 3.9 + d, 8.4 + lerp(-0.7, 0.9, wk) * (1 - (d / 1.8) ** 2))))).join(""));
    // the muzzle: its own round, drawn dim inside the head's outline, the patch the nose and smile sit on
    muzzle.setAttribute("d", poly(hull(ell(H, ...M, SPH2))));
    place(nose, snout(0, 5.3));
    // the mouth: a line down from the nose, then a wide smile whose corners turn up
    mouth.setAttribute("d", open([snout(0, 4.7), snout(0, 3.3)]) + open(Array.from({ length: 9 }, (_, k) => { const u = -3 + k * 0.75; return snout(u, 3.1 + 0.13 * u * u); })));
    tongue.setAttribute("d", wk < 0.05 ? "" : poly([[-1.4, 0], [-1.5, -2.4 * wk], [-0.7, -3.4 * wk], [0.7, -3.4 * wk], [1.5, -2.4 * wk], [1.4, 0]].map(([u, z]) => snout(u, 3.2 + z))));
  }
  draw(performance.now());
  // each part lights while the pointer is over it, tested against its outline at rest; the first that holds it wins
  const parts = [earFront, head, earBack, ...legs, ...paws, torso, tail].map((h) => ({ ls: loops(h.getAttribute("d")), els: [h] }));
  let lit = null, on = false;
  const light = (p) => { const pt = (p && parts.find((x) => inLoops(p, x.ls))) || null; if (pt !== lit) { lit = pt; parts.forEach((x) => x.els.forEach((e) => e.classList.toggle("hi", x === pt))); } };
  const B = register(stage, (dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */
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
    light(p);
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
  means: "A puppy sitting up, dozing: bring the pointer near and it wakes, ears up, smiling, tongue out, tail wagging, and watches.",
  rules: [1, 5, 7, 9],
  range: [15, 28, 40],
  mount,
});
