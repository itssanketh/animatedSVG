/**
 * Redis: the Redis mark as it is drawn, a stack of three rounded slabs seen from above, with a star, a circle and a triangle on
 * the top slab and a square sunk into it. Redis keeps its data in memory, in layers; here the pointer opens the stack: the slabs
 * lift apart, the top one highest, and the star, the circle and the triangle hop up off the top one after another, nearest the
 * pointer first, the star turning a fifth of a turn as it goes. The shape under the pointer takes the bright edge and its name
 * goes to the read-out. Leave and the shapes drop back onto the top and the slabs close up. The slider is how far they part.
 *
 * Every number is measured from the mark: the top face is a square ten units across, foreshortened to 0.42 of its width, as the
 * mark is; each slab is 1.6 units deep with a gap of 1.05 under it; the shapes sit where the mark has them, in that square. A
 * tribute: the mark belongs to Redis Ltd.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, ringAt, hull, poly, open, seg, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const SQ0 = -0.25, SQ1 = 10.4, R = 1.4, B = 0.7, DEEP = 1.6, GAP = 1.05, HOP = 1.8, PIT = 0.55, OPEN = [0, 1, 2];
// the shapes on the top face, in the face's own square, measured from the mark
const TIPS = [[0.74, 1.97], [2.08, 0.81], [4.17, 1.91], [4.52, 4.07], [1.87, 3.92]], STAR_C = [2.68, 2.55];
const STAR = TIPS.flatMap((t, i) => { const n = TIPS[(i + 1) % 5], m = [(t[0] + n[0]) / 2, (t[1] + n[1]) / 2]; return [t, [STAR_C[0] + (m[0] - STAR_C[0]) * 0.47, STAR_C[1] + (m[1] - STAR_C[1]) * 0.47]]; });
const CIRCLE = Array.from({ length: 40 }, (_, i) => [2.86 + 1.68 * Math.cos((i / 40) * 2 * Math.PI), 6.96 + 1.68 * Math.sin((i / 40) * 2 * Math.PI)]);
const TRI = [[7.11, 5.32], [8.98, 8.31], [5.85, 8.36]];
const PIT_SQ = [[5.7, 1.14], [8.55, 1.14], [8.55, 4.0], [5.7, 4.0]];
const SHAPES = [{ name: "star", pts: STAR, c: STAR_C }, { name: "circle", pts: CIRCLE, c: [2.86, 6.96] }, { name: "triangle", pts: TRI, c: [7.31, 7.33] }];
const z0 = (i) => i * (DEEP + GAP);
/** Where segment a-b crosses segment c-d on screen, or null. */
const cross = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], q = [d[0] - c[0], d[1] - c[1]], den = r[0] * q[1] - r[1] * q[0]; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t] : null; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let amt = value;
  const C = Cam(45, 0.42, 16);
  // fitted to the stack opened as far as the slider goes, a shape lifted off its top
  const top = z0(2) + DEEP, far = top + OPEN[2] * 1.4 + HOP * 1.4;
  fit(C, [[SQ0, SQ0, 0], [SQ1, SQ1, 0], [SQ1, SQ0, 0], [SQ0, SQ1, 0], [SQ0, SQ0, far], [SQ1, SQ0, far], [SQ0, SQ1, far]], 200, 166);
  // rings with fourteen steps round each corner: at this size the kernel's four would show as facets
  const P = proj(C), front = facing(C), ring = rrect(SQ0, SQ0, SQ1, SQ1, R, 14), inner = rrect(SQ0 + B, SQ0 + B, SQ1 - B, SQ1 - B, R - B, 14);

  const g = mk("g", {}, svg), slabs = [0, 1, 2].map(() => solid(g));
  const pit = { rim: mk("path", { class: "nf" }, g), walls: mk("path", { class: "nf lo" }, g) };
  const shapes = SHAPES.map((s) => ({ ...s, shadow: mk("path", { class: "nf lo" }, g), el: mk("path", { class: "sil" }, g), hop: tween(0) }));
  const part = [tween(0), tween(0), tween(0)];

  // rest outlines, for picking: the stack's silhouette and each shape on the resting top
  const W = (x, y, z) => P(x, y, z);
  const stack = hull([...ringAt(P, ring, 0), ...ringAt(P, ring, top)]);
  const rest = shapes.map((s) => s.pts.map(([x, y]) => W(x, y, top)));
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };

  let drawn = "";
  function draw(now) {
    const lift = part.map((t) => tval(t, now) * amt), hops = shapes.map((s) => tval(s.hop, now)), key = [...lift, ...hops].map((n) => n.toFixed(4)).join();
    if (key === drawn) return; drawn = key;
    // the slabs, bottom first, each lifted by its part of the opening
    slabs.forEach((s, i) => put(s, prism(P, front, ring, inner, z0(i) + lift[i], z0(i) + lift[i] + DEEP)));
    const zt = top + lift[2];
    // the square sunk into the top: its rim, and its far walls going down to the floor
    // the corners are far (0), right (1), near (2) and left (3); only the far walls show, cut off where the near rim hides the floor
    const rim = PIT_SQ.map(([x, y]) => W(x, y, zt)), floor = PIT_SQ.map(([x, y]) => W(x, y, zt - PIT));
    const left = cross(floor[0], floor[3], rim[3], rim[2]) || floor[3], right = cross(floor[0], floor[1], rim[1], rim[2]) || floor[1];
    pit.rim.setAttribute("d", poly(rim));
    pit.walls.setAttribute("d", open([left, floor[0], right]) + seg(rim[0], floor[0]));
    // the shapes, each hopping off the top, the star turning a fifth of a turn as it goes; its outline stays on the top as it lifts
    shapes.forEach((s, i) => {
      const h = hops[i], a = s.name === "star" ? (h * 2 * Math.PI) / 5 : 0, c = Math.cos(a), sn = Math.sin(a);
      const at = ([x, y]) => [s.c[0] + (x - s.c[0]) * c - (y - s.c[1]) * sn, s.c[1] + (x - s.c[0]) * sn + (y - s.c[1]) * c];
      s.el.setAttribute("d", poly(s.pts.map((p) => { const [x, y] = at(p); return W(x, y, zt + h * HOP * amt); })));
      s.shadow.setAttribute("d", h < 0.03 ? "" : poly(s.pts.map(([x, y]) => W(x, y, zt))));
    });
  }
  draw(performance.now());

  const Bk = register(stage, (_dt, now) => { draw(now); return part.some((t) => !tdone(t, now)) || shapes.some((s) => !tdone(s.hop, now)); });
  bag.add(Bk.unregister);

  let open_ = false, lit = null;
  function point(q) {
    const now = performance.now(), on = !!q && inside(q, stack);
    // the shape under the pointer, tested against where it rests
    const k = on ? rest.findIndex((pts) => inside(q, pts)) : -1, p = k >= 0 ? shapes[k] : null;
    if (p !== lit) { lit = p; shapes.forEach((s) => s.el.classList.toggle("hi", s === p)); slabs[2].sil.classList.toggle("hi", on && !p); }
    if (on !== open_) {
      open_ = on;
      // the slabs part, the top first; then the shapes hop, nearest the pointer first
      OPEN.forEach((d, i) => tset(part[i], on ? d : 0, now, on ? (2 - i) * 40 : i * 40));
      const o = q || [0, 0], order = rest.map((pts, i) => [i, pts.reduce((m, r) => m + Math.hypot(r[0] - o[0], r[1] - o[1]), 0) / pts.length]).sort((a, b) => a[1] - b[1]);
      order.forEach(([i], r) => tset(shapes[i].hop, on ? 1 : 0, now, on ? 140 + r * 60 : r * 40));
    }
    if (!on) slabs[2].sil.classList.remove("hi");
    read.textContent = on ? (p ? p.name : "layers") : "rest";
    Bk.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amt = v; drawn = ""; Bk.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "redis",
  means: "The Redis stack opens as the pointer nears: its three slabs lift apart and the shapes on top hop off it; leave and it closes up.",
  rules: [1, 2, 6, 8, 9, 10],
  range: [0.6, 1, 1.4],
  mount,
});
