/**
 * Arch: the Arch peak, its own outline (a tall peak with curved flanks, a thin
 * wedge cut into the left flank, a smaller one low on the right, an arch under
 * it and long curved feet), built of blocks laid like bricks: thick plates
 * facing you, six rows from foot to apex, with nothing under them. The
 * pointer's height says how far the build has got: rows below it sit in place,
 * rows above it lift off, drift and tilt, loose; move up and the next rows drop
 * in and lock, row after row from where the build stood. Leave and the peak
 * stands whole. Whatever stands reads as one solid piece: its joints are never
 * drawn, only its outline, which takes the bright edge; a loose block shows its
 * own. The read-out counts the rows; the slider is the stagger between rows, in ms. A tribute: the mark belongs to the Arch Linux project.
 *
 * Each block is the peak clipped to one cell of the bond, extruded: back face, sides, front face, painted back to front.
 * Which stretches of edge are joints is worked out once, so a landing redraws nothing but the one outline.
 * The hit test is a fixed band across the peak's resting outline, read by height alone.
 */
const { clamp, lerp, mk, open, poly, rad, register, tset, tval, tdone, tween, disposer, pointer } = HL;
const K = 118, CX = 214, CY = 282, T = 4, ROWS = 6, COL = 0.3;
/** The screen point of (u, v) on the plate, d deep: the front leans down and left of the back. */
const W = (u, v, d) => [CX + u * K - d * 0.7, CY - v * K + d * 0.5];
// the mark's outline in its own 256 square, y down: apex, left flank and its wedge, left foot, the arch, right foot,
// the low wedge on the right flank, and back up to the apex
const MARK = "M128,0C116.6,27.9 109.8,46.2 97.1,73.3c7.8,8.3 17.3,17.9 32.8,28.7c-16.6,-6.8 -28,-13.7 -36.5,-20.8C77.2,114.9 51.6,163.5 0,256C40.5,232.6 72,218.2 101.2,212.7C99.9,207.3 99.2,201.4 99.3,195.3l0,-1.3c0.6,-25.9 14.1,-45.8 30.1,-44.5c16,1.4 28.4,23.5 27.8,49.4c-0.1,4.9 -0.7,9.6 -1.6,13.9c28.9,5.7 60,20.1 100,43.2c-7.9,-14.5 -14.9,-27.6 -21.6,-40.1c-10.5,-8.2 -21.5,-18.8 -43.9,-30.3c15.4,4 26.4,8.6 35,13.7C157.3,72.1 151.2,53.5 128,0Z";

/** An extruded plate: back face, sides, front face (fills), and the edges of back and front drawn as lines over them. */
const plate = (g) => {
  const b = mk("g", {}, g), p = (c) => mk("path", { class: c }, b);
  return { g: b, back: p("fo"), backLine: p("sil nf"), side: p("fo"), face: p("fo"), faceLine: p("sil nf") };
};
/** Draws a plate of outline pts (u, v) between depths d0 (back) and d1 (front); its drawn edges are the runs. */
function setPlate(pl, pts, runs, d0, d1) {
  const f = pts.map(([u, v]) => W(u, v, d1)), b = pts.map(([u, v]) => W(u, v, d0));
  pl.back.setAttribute("d", poly(b));
  pl.side.setAttribute("d", f.map((p, i) => { const j = (i + 1) % f.length; return poly([p, f[j], b[j], b[i]]); }).join(""));
  pl.face.setAttribute("d", poly(f));
  pl.backLine.setAttribute("d", runs.map((r) => open(r.map(([u, v]) => W(u, v, d0)))).join(""));
  pl.faceLine.setAttribute("d", runs.map((r) => open(r.map(([u, v]) => W(u, v, d1)))).join(""));
}
/** The peak: the mark's path sampled finely into points (u, v), v up, 1.6 tall and 1.6 wide, centred on u = 0. */
function peak() {
  const tok = MARK.match(/[MCcLlZz]|-?\d*\.?\d+/g), out = [], uv = ([x, y]) => [((x - 128) / 256) * 1.6, ((256 - y) / 256) * 1.6];
  let i = 0, cmd = "", at = [0, 0];
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "Z" || cmd === "z") break;
    const o = cmd === cmd.toLowerCase() ? at : [0, 0], pt = () => { const x = +tok[i++], y = +tok[i++]; return [o[0] + x, o[1] + y]; };
    if (cmd !== "C" && cmd !== "c") { at = pt(); out.push(uv(at)); continue; }
    const s = at, c1 = pt(), c2 = pt(), e = pt(), n = Math.max(6, Math.ceil(Math.hypot(e[0] - s[0], e[1] - s[1]) / 4));
    for (let k = 1; k <= n; k++) { const t = k / n, m = 1 - t; out.push(uv([0, 1].map((j) => m * m * m * s[j] + 3 * m * m * t * c1[j] + 3 * m * t * t * c2[j] + t * t * t * e[j]))); }
    at = e;
  }
  out.pop(); // the last point is the apex again
  return out;
}
const PEAK = peak();
/** Clips a polygon to the box u0..u1, v0..v1 (Sutherland-Hodgman, one edge of the box at a time). */
function clip(pts, u0, u1, v0, v1) {
  const edges = [[(p) => p[0] >= u0, 0, u0], [(p) => p[0] <= u1, 0, u1], [(p) => p[1] >= v0, 1, v0], [(p) => p[1] <= v1, 1, v1]];
  for (const [inside, ax, c] of edges) {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length], a = inside(p), b = inside(q);
      if (a) out.push(p);
      if (a !== b) { const t = (c - p[ax]) / (q[ax] - p[ax]); out.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t)]); }
    });
    pts = out;
    if (!pts.length) break;
  }
  return pts;
}
const signed = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
/** A repeatable number in -1..1 for block i and channel c: the loose blocks scatter the same way every time. */
const jit = (i, c) => Math.sin(i * 12.9898 + c * 78.233) * 43758.5453 % 1;
/** Whether point q lies inside polygon pts. */
function inside(q, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > q[1]) !== (yj > q[1]) && q[0] < ((xj - xi) * (q[1] - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}

/** The blocks: each row of the peak cut into equal blocks across its own width, every other row shifted half a block
 * like a brick bond. Each block's edge is cut into short pieces, and for each piece what lies just across it is noted
 * once: another block (a joint, hidden while both stand), or nothing (the peak's outline, always drawn). A piece on a
 * cut or row line with the peak's own outside across it is only where clipping bridged two parts of a cell: never drawn. */
function blocks() {
  const out = [], rh = 1.6 / ROWS;
  for (let r = 0; r < ROWS; r++) {
    const v0 = r * rh, v1 = (r + 1) * rh, row = clip(PEAK, -1, 1, v0, v1), ul = Math.min(...row.map((p) => p[0])), ur = Math.max(...row.map((p) => p[0]));
    const n = Math.max(1, Math.round((ur - ul) / COL)), w = (ur - ul) / n, cuts = [ul - 0.01], odd = n > 1 && r % 2;
    for (let k = 1; k < n + odd; k++) cuts.push(ul + (k - odd * 0.5) * w);
    cuts.push(ur + 0.01);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const pts = clip(PEAK, cuts[k], cuts[k + 1], v0, v1);
      if (pts.length < 3 || Math.abs(signed(pts)) < 0.002) continue;
      const cu = pts.reduce((s, p) => s + p[0], 0) / pts.length, cv = pts.reduce((s, p) => s + p[1], 0) / pts.length, i = out.length;
      // loose, a block rises above the peak, drifts outward from the middle, tilts, and comes toward you
      out.push({ i, r, v0, v1, cl: cuts[k], cr: cuts[k + 1], cu, cv, pts, lift: 0.22 + 0.14 * Math.abs(jit(i, 1)) + 0.05 * (ROWS - r), drift: cu * 0.35 + 0.06 * jit(i, 2), tilt: 22 * jit(i, 3), near: 10 + 8 * Math.abs(jit(i, 4)) });
    }
  }
  for (const b of out) {
    const P = b.pts, n = P.length, sg = Math.sign(signed(P));
    b.pieces = [];
    for (let i = 0; i < n; i++) {
      const a = P[i], c = P[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]), k = Math.max(1, Math.ceil(L / 0.02));
      if (L < 1e-9) continue;
      const nx = (sg * (c[1] - a[1])) / L, ny = (-sg * (c[0] - a[0])) / L;
      const line = (Math.abs(c[0] - a[0]) < 1e-9 && (Math.abs(a[0] - b.cl) < 1e-9 || Math.abs(a[0] - b.cr) < 1e-9)) || (Math.abs(c[1] - a[1]) < 1e-9 && a[1] > 1e-6 && (Math.abs(a[1] - b.v0) < 1e-9 || Math.abs(a[1] - b.v1) < 1e-9));
      for (let j = 0; j < k; j++) {
        const p0 = [lerp(a[0], c[0], j / k), lerp(a[1], c[1], j / k)], p1 = [lerp(a[0], c[0], (j + 1) / k), lerp(a[1], c[1], (j + 1) / k)];
        const q = [(p0[0] + p1[0]) / 2 + nx * 0.006, (p0[1] + p1[1]) / 2 + ny * 0.006];
        const bridge = line && !inside(q, PEAK), across = out.find((o) => o !== b && inside(q, o.pts));
        b.pieces.push({ p0, p1, bridge, across: across ? across.i : -1 });
      }
    }
  }
  return out;
}
/** Runs of points along a block's pieces that pass keep, joined end to end. */
function runs(blocks, keep) {
  const out = [];
  for (const b of blocks) {
    let run = null;
    for (const pc of b.pieces) {
      if (!keep(pc)) { run = null; continue; }
      if (!run) { run = [pc.p0]; out.push(run); }
      run.push(pc.p1);
    }
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  // painted in this order: the back of the standing part's outline, the standing blocks (fill only), the front of
  // its outline, then the loose blocks, each with its own edges
  const g = mk("g", {}, svg), backRim = mk("path", { class: "sil nf" }, g), built = mk("g", {}, g), rim = mk("path", { class: "sil nf" }, g), loose = mk("g", {}, g);
  // built blocks are painted top row first and right to left, so each covers the sides of the ones above and right of it
  const all = blocks(), bs = all.slice().sort((a, b) => b.r - a.r || b.cu - a.cu);
  bs.forEach((b) => Object.assign(b, { pl: plate(built), tw: tween(0), drawn: NaN, edges: runs([b], (pc) => !pc.bridge) }));
  let level = ROWS, standing = "";

  function draw(now) {
    let moving = false, regroup = false;
    for (const b of bs) {
      const t = tval(b.tw, now);
      if (!tdone(b.tw, now)) moving = true;
      if (t === b.drawn) continue;
      if ((t > 0) !== (b.drawn > 0)) regroup = true;
      b.drawn = t;
      const a = rad(b.tilt * t), c = Math.cos(a), s = Math.sin(a), du = b.drift * t, dv = b.lift * t;
      const at = ([u, v]) => { const x = u - b.cu, y = v - b.cv; return [b.cu + du + x * c - y * s, b.cv + dv + x * s + y * c]; };
      // a block in place draws no edges of its own; the standing part's outline is drawn once, round all of them
      setPlate(b.pl, b.pts.map(at), t > 0 ? b.edges.map((r) => r.map(at)) : [], b.near * t, b.near * t + T);
    }
    // a loose block is in front of the standing peak: move it to the front group, keeping the painting order within each
    if (regroup) for (const b of bs) (b.drawn > 0 ? loose : built).append(b.pl.g);
    const key = all.map((b) => (b.drawn === 0 ? 1 : 0)).join("");
    if (key !== standing) {
      standing = key;
      // whole rows standing from the foot up: the outline is the mark's own, cut level at the top; mid-landing, the pieces
      let L = 0; while (L < ROWS && all.every((b) => b.r !== L || b.drawn === 0)) L++;
      const whole = all.every((b) => (b.drawn === 0) === (b.r < L)), shape = L ? clip(PEAK, -1, 1, -1, (L / ROWS) * 1.6) : [];
      const r = whole ? (shape.length ? [shape.concat([shape[0]])] : []) : runs(all.filter((b) => b.drawn === 0), (pc) => !pc.bridge && !(pc.across >= 0 && key[pc.across] === "1"));
      rim.setAttribute("d", r.map((x) => open(x.map(([u, v]) => W(u, v, T)))).join(""));
      backRim.setAttribute("d", r.map((x) => open(x.map(([u, v]) => W(u, v, 0)))).join(""));
    }
    return moving;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now())); bag.add(B.unregister);

  // the hit band: across the peak's resting outline, from its foot to its apex; only the pointer's height is read
  const xl = W(-0.9, 0.8, 0)[0], xr = W(0.9, 0.8, 0)[0], yt = W(0, 1.75, 0)[1], yb = W(0, -0.05, 0)[1];
  function build(p) {
    const on = !!p && p[0] > xl - 40 && p[0] < xr + 40 && p[1] > yt - 30 && p[1] < yb + 30;
    const next = on ? clamp(Math.round(((yb - p[1]) / (yb - yt)) * ROWS), 0, ROWS) : ROWS;
    if (next !== level) {
      // rows change one after another, outward from where the build stood
      const now = performance.now(), from = level;
      for (const b of bs) tset(b.tw, b.r < next ? 0 : 1, now, Math.abs(b.r - (next > from ? from : from - 1)) * step + (b.cu + 0.8) * 40);
      level = next;
    }
    read.textContent = on ? `row ${level}/${ROWS}` : "rest"; rim.classList.toggle("hi", on); // bright while the pointer builds
    B.wake();
  }
  build(null);

  bag.add(pointer(stage, { move: build, leave: () => build(null) })); bag.add(() => svg.replaceChildren());

  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "arch",
  means: "Arch's peak built of blocks: raise the pointer and the rows drop in and lock, one after another; lower it and they come loose.",
  rules: [1, 2, 5, 6],
  range: [30, 60, 110],
  mount,
});
