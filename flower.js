/**
 * Flower: a flower on its stem, two leaves on the stem, its head a closed bud at rest, the petals folded up round its middle. Bring
 * the pointer near and it opens: the petals fold out one after another round the head, from upright to spread wide, showing the
 * round middle with its seeds, and the head turns a little to face the pointer, as a flower turns to the sun; leave and the petals
 * fold back up into a bud, one after another. The middle takes the bright edge while the flower is open. The read-out gives how far
 * it has opened. The slider is how wide the petals open.
 *
 * Every petal is a plate turned about its root on the head's rim, painted from the back of the head to its front; the stem is a tube
 * round a curving middle line. The pointer is read against the flower's resting outline.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const N = 9, HX = 200, HY = 116, RC = 15, PL = 46;
// a point on screen from the head's frame: (x, y) across its face, z toward you; the head is tilted back so its face shows
function project([x, y, z], tilt, turn) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), cu = Math.cos(turn), su = Math.sin(turn);
  const y1 = y * ct - z * st, z1 = y * st + z * ct, x2 = x * cu + z1 * su, z2 = -x * su + z1 * cu;
  return { p: [HX + x2, HY + y1], z: z2 };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let wide = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  // the stem, curving down to the ground, and its two leaves
  const stem = [[HX, HY + 10], [HX + 6, 160], [HX - 4, 210], [HX + 2, 262]];
  const tubeOf = (mid, w) => { const L = mid.map((p, i) => { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - (w * (b[1] - a[1])) / l / 2, p[1] + (w * (b[0] - a[0])) / l / 2]; }), R = mid.map((p, i) => { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] + (w * (b[1] - a[1])) / l / 2, p[1] - (w * (b[0] - a[0])) / l / 2]; }); return [...L, ...R.reverse()]; };
  const curve = (pts, n = 10) => pts.slice(0, -1).flatMap((p, i) => { const q = pts[i + 1]; return Array.from({ length: n }, (_, k) => [p[0] + ((q[0] - p[0]) * k) / n + Math.sin((Math.PI * k) / n) * (i % 2 ? -3 : 3), p[1] + ((q[1] - p[1]) * k) / n]); }).concat([pts[pts.length - 1]]);
  el("sil").setAttribute("d", poly(tubeOf(curve(stem), 5)));
  const leafShape = (x, y, a, s) => Array.from({ length: 24 }, (_, i) => { const t = (i / 24) * 2 * Math.PI, px = s * (1 - Math.cos(t)) / 2 * 2, py = s * 0.32 * Math.sin(t); return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]; });
  el("sil").setAttribute("d", poly(leafShape(HX + 2, 214, -0.5, 26)) + poly(leafShape(HX - 1, 190, Math.PI + 0.45, 22)));
  el("nf lo").setAttribute("d", open([[HX + 2, 214], [HX + 2 + 40 * Math.cos(-0.5), 214 + 40 * Math.sin(-0.5)]]) + open([[HX - 1, 190], [HX - 1 + 34 * Math.cos(Math.PI + 0.45), 190 + 34 * Math.sin(Math.PI + 0.45)]]));
  el("nf lo").setAttribute("d", open([[120, 262], [280, 262]]));
  const layer = mk("g", {}, g);
  const petals = Array.from({ length: N }, (_, k) => ({ k, a: (k / N) * 2 * Math.PI + 0.2, el: mk("path", { class: "sil" }, layer), vein: mk("path", { class: "nf lo" }, layer), open: spring(0, { k: 70, c: 11 }) }));
  const middle = mk("path", { class: "sil" }, layer), seeds = mk("path", { class: "nf lo" }, layer);
  const turn = spring(0, { k: 30, c: 9 });

  function draw() {
    const tilt = 0.75, tu = turn.x;
    // each petal: a teardrop from its root on the middle's rim, turned from upright (closed) out to spread (open)
    const items = petals.map((p) => {
      const ang = (Math.PI / 2) * (0.08 + 0.92 * p.open.x * wide), ca = Math.cos(p.a), sa = Math.sin(p.a);
      const local = Array.from({ length: 26 }, (_, i) => { const t = (i / 26) * 2 * Math.PI, along = (PL * (1 - Math.cos(t))) / 2, across = 11 * Math.sin(t) * Math.sin((Math.PI * (1 - Math.cos(t))) / 4 + 0.2); return [along, across]; });
      const W = ([along, across]) => { const r = RC * 0.8 + along * Math.sin(ang), z = along * Math.cos(ang); return project([r * ca - across * sa, r * sa + across * ca, z], tilt, tu); };
      const pts = local.map(W), depth = pts.reduce((s, q) => s + q.z, 0) / pts.length;
      return { p, pts: pts.map((q) => q.p), vein: [W([0, 0]).p, W([PL * 0.8, 0]).p], depth };
    }).sort((a, b) => a.depth - b.depth);
    // the petals behind the middle, the middle, then the petals in front of it
    const c = project([0, 0, 2], tilt, tu), mid = Array.from({ length: 28 }, (_, i) => project([RC * Math.cos((i / 28) * 2 * Math.PI), RC * Math.sin((i / 28) * 2 * Math.PI), 3], tilt, tu).p);
    let placed = false;
    items.forEach((it) => { if (!placed && it.depth > c.z) { layer.append(middle, seeds); placed = true; } it.p.el.setAttribute("d", poly(it.pts)); it.p.vein.setAttribute("d", open(it.vein)); layer.append(it.p.el, it.p.vein); });
    if (!placed) layer.append(middle, seeds);
    middle.setAttribute("d", poly(mid));
    seeds.setAttribute("d", Array.from({ length: 12 }, (_, i) => { const r = 4 + (i % 3) * 3.4, a = i * 2.4; const q = project([r * Math.cos(a), r * Math.sin(a), 3.2], tilt, tu).p; return poly([[q[0] - 1, q[1]], [q[0], q[1] - 1], [q[0] + 1, q[1]], [q[0], q[1] + 1]]); }).join(""));
  }
  draw();

  let on = false;
  const B = register(stage, (dt, now) => {
    let m = stepS(turn, dt);
    for (const p of petals) { if (now >= p.at) { p.open.t = on ? 1 : 0; } else m = true; if (stepS(p.open, dt)) m = true; }
    draw();
    const o = petals.reduce((s, p) => s + p.open.x, 0) / N;
    middle.classList.toggle("hi", o > 0.85);
    read.textContent = o > 0.02 ? `open ${Math.round(Math.min(1, o) * 100)}%` : "rest";
    return m;
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 100 && q[0] < 300 && q[1] > 40 && q[1] < 280, now = performance.now();
    if (n !== on) { on = n; petals.forEach((p, i) => { p.at = now + i * 55; }); }
    turn.t = q ? Math.max(-0.35, Math.min(0.35, (q[0] - HX) / 300)) : 0;
    B.wake();
  }
  petals.forEach((p) => { p.at = 0; });
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { wide = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "flower",
  means: "A flower: bring the pointer near and its bud opens, the petals folding out one by one as it turns toward you; leave and it closes.",
  rules: [1, 2, 5, 8],
  range: [0.7, 0.85, 1],
  mount,
});
