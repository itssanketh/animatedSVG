/**
 * Minecraft: a grass block, sixteen pixels a side as the game draws it: grass on top, its ragged pixel fringe hanging down the
 * sides, and dirt below, with a few pixels picked out on its faces. Hold the pointer on it and you mine it: chips fly off it at
 * each hit, and cracks spread over its faces through the game's ten stages of breaking. At the last stage it breaks as a block
 * does: it is gone in a puff of its own pieces, which fall and shrink away, and it drops a single small grass block, which hops
 * out, lands and floats there, bobbing and turning, as a dropped item does. Leave and the drop flies back and grows into the
 * block again. The block takes the bright edge while it is mined, the drop once it has fallen, and the read-out gives how far
 * the mining has got. The slider is how long the mining takes, in seconds.
 *
 * Everything is a prism of a square ring. The pointer is read against the block's resting silhouette, which never moves.
 */
const { Cam, fit, proj, facing, rings, prism, solid, put, hull, ringAt, poly, open, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const PX = 16, DROP = 4.2, LAND = [11, 14];
// the grass's fringe: how many pixels it hangs down each column of the two near faces
const FRINGE = [[3, 4, 3, 5, 3, 3, 6, 4, 3, 4, 5, 3, 3, 4, 6, 3], [4, 3, 3, 5, 4, 3, 3, 6, 3, 4, 3, 5, 3, 3, 4, 3]];
// the pixels picked out on each face, [u, v] in that face's own grid of sixteen
const TOP_PX = [[3, 2], [9, 4], [5, 9], [12, 7], [2, 13], [10, 12], [14, 2], [7, 14]];
const DIRT_PX = [[[2, 8], [6, 11], [11, 9], [13, 13], [4, 14], [9, 6], [14, 7]], [[3, 10], [8, 8], [12, 12], [5, 13], [10, 14], [1, 7], [14, 9]]];
// the cracks: runs from the middle of each near face and of the top, a few more shown at each stage
const CRACKS = [
  { f: 2, r: [[8, 8], [6, 7], [5, 5], [3, 4]] }, { f: 0, r: [[8, 7], [6, 9], [5, 11], [3, 12], [2, 14]] }, { f: 1, r: [[8, 7], [10, 9], [11, 11], [13, 12]] },
  { f: 2, r: [[8, 8], [10, 10], [12, 11]] }, { f: 0, r: [[8, 7], [10, 5], [12, 4]] }, { f: 1, r: [[8, 7], [6, 5], [4, 4], [3, 2]] },
  { f: 2, r: [[6, 7], [7, 4], [9, 2]] }, { f: 0, r: [[5, 11], [7, 13], [9, 15]] }, { f: 1, r: [[11, 11], [10, 13], [12, 15]] }, { f: 2, r: [[10, 10], [9, 13], [6, 14]] },
];
/** A point on a face of a block of size s with its corner at o: f 0 is the face at x = s, f 1 at y = s, f 2 the top; (u, v) in pixels. */
const onFace = (f, u, v, s = PX, o = [0, 0, 0]) => (f === 0 ? [o[0] + s, o[1] + (u * s) / PX, o[2] + s - (v * s) / PX] : f === 1 ? [o[0] + s - (u * s) / PX, o[1] + s, o[2] + s - (v * s) / PX] : [o[0] + (u * s) / PX, o[1] + (v * s) / PX, o[2] + s]);
/** A ring turned by a about (cx, cy): its samples and their normals. */
const turn = (ring, a, cx, cy) => { const c = Math.cos(a), s = Math.sin(a); return ring.map((q) => ({ ...q, u: cx + (q.u - cx) * c - (q.v - cy) * s, v: cy + (q.u - cx) * s + (q.v - cy) * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })); };
const rand = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let secs = value;
  const C = Cam(45, 0.5, 8.2);
  fit(C, [[-4, -4, 0], [PX + 4, PX + 4, 0], [PX + 4, -4, 0], [-4, PX + 4, 0], [0, 0, PX + 2], [PX, PX, PX]], 200, 166);
  const P = proj(C), front = facing(C), W = (p) => P(...p), none = { sil: "", crease: "" };
  const g = mk("g", {}, svg), shadow = mk("path", { class: "nf lo" }, g);
  const block = solid(g), [br, bi] = rings(0, 0, PX, PX, 0.5, 0.6), marks = mk("path", { class: "nf lo" }, g), fringe = mk("path", { class: "nf" }, g), cracks = mk("path", { class: "nf" }, g);
  const chips = Array.from({ length: 14 }, (_, i) => ({ i, s: solid(g) })), drop = solid(g), dropMarks = mk("path", { class: "nf" }, g);
  const box = (x, y, s) => rings(x, y, x + s, y + s, s * 0.04, s * 0.12);

  let mining = 0, on = false, broken = false, tBreak = 0, clock = 0, lastHit = 0;
  let back = tween(1); // 1 while the drop lies where it fell; tweened to 0 as it flies back into the block

  /** The fringe and the pixels of a grass block of size s with its corner at o: the block's, and the drop's. */
  const fringePath = (s, o) => [0, 1].map((f) => open(FRINGE[f].flatMap((d, u) => [onFace(f, u, d, s, o), onFace(f, u + 1, d, s, o)]).map(W))).join("");
  const pixel = (f, u, v) => poly([[u, v], [u + 1, v], [u + 1, v + 1], [u, v + 1]].map(([a, b]) => W(onFace(f, a, b))));

  function draw(now) {
    const e = broken ? (now - tBreak) / 1000 : 0, k = tval(back, now), whole = !broken;
    // the block, while it stands, with its fringe, its pixels and its cracks
    put(block, whole ? prism(P, front, br, bi, 0, PX) : none);
    marks.setAttribute("d", whole ? [...TOP_PX.map(([u, v]) => pixel(2, u, v)), ...DIRT_PX.flatMap((ps, f) => ps.map(([u, v]) => pixel(f, u, v)))].join("") : "");
    fringe.setAttribute("d", whole ? fringePath(PX, [0, 0, 0]) : "");
    cracks.setAttribute("d", whole ? CRACKS.slice(0, Math.min(10, Math.floor(mining * 10))).map((c) => open(c.r.map(([u, v]) => W(onFace(c.f, u, v))))).join("") : "");
    // the chips: a few fly at each hit while mining; at the break all of them burst out, fall, bounce once and shrink away
    chips.forEach((c) => {
      const t = broken ? e - (c.i % 3) * 0.03 : clock - lastHit, life = broken ? 0.95 : 0.3;
      const show = broken ? t > 0 && t < life && k > 0.999 : on && c.i < 4 && mining > 0 && t < life;
      if (!show) { put(c.s, none); return; }
      const a = rand(c.i + (broken ? 0 : Math.floor(clock * 4) * 17)) * 2 * Math.PI, sp = broken ? 9 + 6 * rand(c.i + 7) : 5, up = broken ? 10 + 8 * rand(c.i + 3) : 7;
      const st = broken ? [PX / 2 + (rand(c.i + 13) - 0.3) * PX * 0.8, PX / 2 + (rand(c.i + 17) - 0.3) * PX * 0.8, PX * (0.3 + 0.6 * rand(c.i + 19))] : [PX + 0.5, PX / 2 + (rand(c.i + 11) - 0.5) * 10, PX * 0.5 + rand(c.i + 5) * 6];
      let z = st[2] + up * t - 25 * t * t; if (z < 0) z = Math.abs(z) * 0.3;
      const s = 1.4 * (1 - t / life), x = st[0] + Math.cos(a) * sp * t - s / 2, y = st[1] + Math.sin(a) * sp * t - s / 2, [r, i] = box(x, y, s);
      put(c.s, prism(P, front, r, i, z, z + s));
    });
    // the drop: one small grass block that hops out, lands and floats, bobbing and turning; it flies back as the block mends
    if (!broken) { put(drop, none); dropMarks.setAttribute("d", ""); shadow.setAttribute("d", ""); return; }
    const hop = Math.min(1, e / 0.45), fx = PX / 2 + (LAND[0] - PX / 2) * hop, fy = PX / 2 + (LAND[1] - PX / 2) * hop;
    const fz = hop < 1 ? PX * 0.35 * (1 - hop) + 9 * hop * (1 - hop) : 1.6 + 0.9 * Math.sin((e - 0.45) * 3);
    const s = DROP + (PX - DROP) * (1 - k), cx = PX / 2 + (fx - PX / 2) * k, cy = PX / 2 + (fy - PX / 2) * k, z = fz * k, a = k * Math.max(0, e - 0.45) * 1.3;
    const [r, i] = box(cx - s / 2, cy - s / 2, s);
    put(drop, prism(P, front, turn(r, a, cx, cy), turn(i, a, cx, cy), z, z + s));
    // its fringe, on whichever of its four sides face you as it turns
    const c = Math.cos(a), sn = Math.sin(a), R = ([x, y, zz]) => W([cx + (x - cx) * c - (y - cy) * sn, cy + (x - cx) * sn + (y - cy) * c, zz]);
    const x0 = cx - s / 2, y0 = cy - s / 2, side = [[[x0 + s, y0], [0, 1], [1, 0]], [[x0 + s, y0 + s], [-1, 0], [0, 1]], [[x0, y0 + s], [0, -1], [-1, 0]], [[x0, y0], [1, 0], [0, -1]]];
    dropMarks.setAttribute("d", side.filter(([, , n]) => front({ u: cx, v: cy, nu: n[0] * c - n[1] * sn, nv: n[0] * sn + n[1] * c })).map(([o, d], f) => open(FRINGE[f % 2].flatMap((h, u) => [u, u + 1].map((uu) => R([o[0] + (d[0] * uu * s) / PX, o[1] + (d[1] * uu * s) / PX, z + s - (h * s) / PX])))) ).join(""));
    shadow.setAttribute("d", poly(Array.from({ length: 20 }, (_, j) => W([cx + s * 0.6 * Math.cos((j / 20) * 2 * Math.PI), cy + s * 0.6 * Math.sin((j / 20) * 2 * Math.PI), 0]))));
  }
  draw(performance.now());

  const B = register(stage, (dt, now) => {
    let m = !tdone(back, now);
    if (on && !broken) {
      clock += dt; mining = Math.min(1, mining + dt / secs);
      if (clock - lastHit > 0.25) lastHit = clock; // a hit every quarter second, each throwing a few chips
      read.textContent = `mining ${Math.round(mining * 100)}%`;
      if (mining >= 1) { broken = true; tBreak = now; block.sil.classList.remove("hi"); drop.sil.classList.add("hi"); read.textContent = "dropped"; }
      m = true;
    }
    if (broken && on) m = true;
    // the drop has flown back: the block stands whole again
    if (broken && !on && tdone(back, now)) { broken = false; back = tween(1); mining = 0; }
    draw(now);
    return m;
  });
  bag.add(B.unregister);

  const rest = hull([...ringAt(P, br, 0), ...ringAt(P, br, PX)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) {
    const now = performance.now(), n = !!q && inside(q, rest);
    if (n && !on) { on = true; if (!broken) { mining = 0; clock = 0; lastHit = 0; block.sil.classList.add("hi"); } }
    else if (!n && on) {
      on = false; block.sil.classList.remove("hi"); drop.sil.classList.remove("hi");
      if (broken) tset(back, 0, now, 0); else mining = 0;
      read.textContent = "rest";
    }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { secs = v; }, destroy: bag.dispose };
}

hairline({
  name: "minecraft",
  means: "A grass block: hold the pointer on it and it cracks, breaks in a puff of pieces and drops one small block that floats there.",
  rules: [1, 4, 6, 7, 9],
  range: [1.6, 1, 0.6],
  mount,
});
