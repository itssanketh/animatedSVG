/**
 * Turtle: a tortoise out walking, head forward on its neck, one front leg
 * reaching, its shell marked with plates. Bring the pointer over it and it
 * hides: head and legs draw into the shell one after another, the part nearest
 * the pointer first, and the shell settles to the ground. Take the pointer away
 * and they come back out in the same order. The read-out says `hide`. The
 * slider is the stagger, in ms.
 *
 * Head and legs are painted before the shell, so its rim covers them as they
 * draw in. The plates are drawn on the dome's surface and only where it faces
 * the eye. The hit test is the shell's resting footprint on a fixed plane.
 */
const {
  Cam, clamp, facing, fit, hull, lerp, mk, open, place, pointer, poly, prism, proj, put, register,
  rrect, solid, tdone, tset, tval, tween, unproj, disposer,
} = HL;

const A = 22, B = 16, H = 13, LIFT = 4.5, EYE = [0.612, 0.612, 0.5];
// the parts that draw in: [x, y] where each sits when out, and where it hides
const LEGS = [[B + 1, A - 7, 2.5], [-(B + 1), A - 9, 0], [B, -(A - 7), -1.5], [-B, -(A - 8), 0]];

/** An ellipse as a ring of samples with their normals. */
const ering = (rx, ry, n = 40) => Array.from({ length: n }, (_, k) => {
  const t = (k / n) * 2 * Math.PI, nu = Math.cos(t) / rx, nv = Math.sin(t) / ry, l = Math.hypot(nu, nv);
  return { u: rx * Math.cos(t), v: ry * Math.sin(t), nu: nu / l, nv: nv / l };
});
const shift = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

const SEG = { 1: [3, 2], 14: [3, 2], 2: [2, 1], 13: [2, 1], 3: [3, 1], 12: [3, 1], 4: [0, 1], 11: [0, 1], 6: [0, 2], 9: [0, 2], 7: [3, 0], 8: [3, 0] };
const LTBR = [3, 0, 2, 1], TRLB = [0, 1, 3, 2];
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
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 4.1);
  fit(C, [[-B - 6, -A - 3, 0], [B + 6, A + 17, 0], [B + 6, -A - 3, 0], [-B - 6, A + 17, 0], [0, 0, LIFT + H + 2]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // a leg: a thick scaly limb from under the rim out to a round foot with three nails
  const legs = LEGS.map(() => ({ limb: mk("path", { class: "sil" }, g), scales: mk("path", { class: "nf lo" }, g), foot: mk("path", { class: "" }, g), nails: mk("path", { class: "nf" }, g) }));
  const sph = (c, r) => { const o = []; for (let i = 0; i <= 8; i++) for (let j = 0; j < 16; j++) { const t = (i / 8) * Math.PI, f = (j / 16) * 2 * Math.PI; o.push(P(c[0] + r[0] * Math.sin(t) * Math.cos(f), c[1] + r[1] * Math.sin(t) * Math.sin(f), c[2] + r[2] * Math.cos(t))); } return o; };
  const head = mk("path", { class: "sil" }, g), mouth = mk("path", { class: "nf lo" }, g);
  const eye = mk("circle", { r: 1.5, class: "dot" }, g);
  const rim = solid(g), dome = mk("path", { class: "sil" }, g), plates = mk("path", { class: "nf lo" }, g);

  // the dome as a function of where on it: nx, ny across and along, each -1..1
  const surf = (nx, ny, z0) => { const r = 1 - nx * nx - ny * ny; return [B * nx, A * ny, z0 + H * Math.sqrt(Math.max(0, r))]; };
  const seen = (nx, ny) => { const r = Math.max(1e-4, 1 - nx * nx - ny * ny), n = [nx / B, ny / A, Math.sqrt(r) / H]; return n[0] * EYE[0] + n[1] * EYE[1] + n[2] * EYE[2] > 0.02; };
  /** A line across the dome, sampled, drawn only where the dome faces the eye. */
  const line = (a, b, z0) => {
    let d = "", run = [];
    for (let k = 0; k <= 16; k++) {
      const nx = lerp(a[0], b[0], k / 16), ny = lerp(a[1], b[1], k / 16);
      if (seen(nx, ny) && nx * nx + ny * ny < 0.995) run.push(P(...surf(nx, ny, z0))); else { if (run.length > 1) d += open(run); run = []; }
    }
    return run.length > 1 ? d + open(run) : d;
  };
  // the plates: three down the spine, and the seams that run out to the rim
  const HEX = [-0.5, 0, 0.5].map((cy) => [[-0.2, cy - 0.2], [0.2, cy - 0.2], [0.3, cy], [0.2, cy + 0.2], [-0.2, cy + 0.2], [-0.3, cy]]);
  const SEAMS = [[[0.3, 0.25], [0.96, 0.25]], [[0.3, -0.25], [0.96, -0.25]], [[-0.3, 0.25], [-0.96, 0.25]], [[-0.3, -0.25], [-0.96, -0.25]],
    [[0.2, 0.7], [0.5, 0.85]], [[-0.2, 0.7], [-0.5, 0.85]], [[0.2, -0.7], [0.5, -0.85]], [[-0.2, -0.7], [-0.5, -0.85]]];

  // the hiding: one tween per part, 0 out and 1 in; the head is part 0
  const parts = [tween(0), ...LEGS.map(() => tween(0))], sink = tween(0);
  const at = [[0, A + 11], ...LEGS.map(([x, y]) => [x, y])];
  let drawn = "";
  function draw(now) {
    const v = parts.map((t) => tval(t, now)), s = tval(sink, now), key = v.map((x) => x.toFixed(3)).join() + s.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    const z0 = lerp(LIFT, 0.6, s);
    LEGS.forEach(([x, y, reach], i) => {
      const k = v[i + 1], cx = lerp(x, x * 0.5, k), cy = lerp(y + reach, y * 0.6, k);
      // the hip sits under the rim; the foot plants outward, and both draw in toward the middle
      const L = legs[i], hip = [cx * 0.78, cy * 0.86, lerp(z0 + 1.2, 2.6, k)], ft = [cx, cy, 1.4];
      const out = Math.sign(x), d = [ft[0] - hip[0], ft[1] - hip[1], ft[2] - hip[2]];
      L.scales.setAttribute("d", [0.35, 0.62].map((t) => { const c = [hip[0] + d[0] * t, hip[1] + d[1] * t, hip[2] + d[2] * t]; return open([-1, -0.5, 0, 0.5, 1].map((u) => P(c[0] + out * 2.9 * Math.cos(u), c[1] + u * 2.6, c[2] + 1.2 - u * u * 0.8))); }).join(""));
      const toe = [ft[0] + out * 1.4, ft[1] + 1.6 + (reach > 0 ? 1 : 0), 0.9];
      L.limb.setAttribute("d", soft([sph(hip, [3.6, 3.6, 3.2]).concat(sph(ft, [3, 3, 2.4])), sph(toe, [3.6, 3.8, 1.4])], 4, 0.6)); L.foot.setAttribute("d", "");
      L.nails.setAttribute("d", [-1, 0, 1].map((u) => { const a = Math.atan2(1, out * 0.6) + u * 0.5, b = [toe[0] + Math.cos(a) * 3.2, toe[1] + Math.sin(a) * 3.4]; return open([P(b[0], b[1], 0.9), P(b[0] + Math.cos(a) * 1.1, b[1] + Math.sin(a) * 1.1, 0.4)]); }).join(""));
    });
    const hy = lerp(A + 11, A - 6, v[0]), hz = lerp(LIFT + 5, 3, v[0]);
    const tube = (y, z, r, rz = r) => Array.from({ length: 24 }, (_, j) => { const t = (j / 24) * 2 * Math.PI; return P(r * Math.cos(t), y, z + rz * Math.sin(t)); });
    const ball = [];
    for (let i = 1; i < 8; i++) for (let j = 0; j < 16; j++) {
      const t = (i / 8) * Math.PI, f = (j / 16) * 2 * Math.PI;
      ball.push(P(4.2 * Math.sin(t) * Math.cos(f), hy + 5.4 * Math.cos(t), hz + 3.8 * Math.sin(t) * Math.sin(f)));
    }
    // neck and head in one outline, the head a little wider than the neck it rises from
    head.setAttribute("d", soft([tube(A - 6, LIFT + 2, 3).concat(tube(hy - 3.5, hz - 0.5, 2.7)), ball], 5, 0.6));
    mouth.setAttribute("d", open([P(2.4, hy + 4.4, hz - 1.2), P(3.2, hy + 2.2, hz - 1.1), P(3.6, hy + 0.4, hz - 0.6)]));
    place(eye, P(3.1, hy + 1.6, hz + 1.6));
    eye.setAttribute("display", v[0] < 0.6 ? "inline" : "none");

    put(rim, prism(P, front, ering(B + 2, A + 2), ering(B + 0.8, A + 0.8), z0, z0 + 1.6));
    const top = z0 + 1.6, pts = [];
    for (let k = 0; k <= 8; k++) { const f = (k / 8) * (Math.PI / 2) * 0.98; for (let j = 0; j < 40; j++) { const t = (j / 40) * 2 * Math.PI; pts.push(P(B * Math.cos(f) * Math.cos(t), A * Math.cos(f) * Math.sin(t), top + H * Math.sin(f))); } }
    dome.setAttribute("d", poly(hull(pts)));
    plates.setAttribute("d", HEX.map((h) => h.map((p, i) => line(p, h[(i + 1) % 6], top)).join("")).join("") + SEAMS.map(([a, b]) => line(a, b, top)).join(""));
  }
  draw(performance.now());

  const Bk = register(stage, (_dt) => { const now = performance.now(); /* not the frame's timestamp: in a lazy iframe it runs seconds behind the clock tset was given */ draw(now); return !parts.every((t) => tdone(t, now)) || !tdone(sink, now); });
  bag.add(Bk.unregister);

  // the hit test: the shell's resting footprint, grown a little, on the plane at its rim
  let hidden = false;
  function hover(p) {
    let on = false, w = null;
    if (p) { w = unproj(C, p[0], p[1], LIFT); on = Math.hypot(w[0] / (B + 6), w[1] / (A + 8)) < 1; }
    if (on === hidden) return;
    hidden = on;
    const now = performance.now(), from = w || [0, 0];
    // nearest part first: order by distance from the pointer on the ground
    const order = at.map((q, i) => [Math.hypot(q[0] - from[0], q[1] - from[1]), i]).sort((a, b) => a[0] - b[0]);
    order.forEach(([, i], r) => tset(parts[i], on ? 1 : 0, now, r * stag));
    tset(sink, on ? 1 : 0, now, on ? order.length * stag * 0.5 : 0);
    dome.classList.toggle("hi", on); eye.setAttribute("class", on ? "dot m" : "dot");
    read.textContent = on ? "hide" : "rest";
    Bk.wake();
  }

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = clamp(v, 0, 200); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "turtle",
  means: "A tortoise out walking: bring the pointer over it and it draws in head and legs, nearest first, and settles down.",
  rules: [1, 2, 6, 8],
  range: [0, 60, 120],
  mount,
});
