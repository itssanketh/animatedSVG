/**
 * Pizza: a pizza on its round board, cut in eight, each slice with its crust and its pepperoni. Bring the pointer over a slice and
 * it is pulled away: it slides out from the middle and lifts, the cheese stretching after it in strings between it and the slices
 * either side; move to another slice and that one comes out while the first drops back into its place. The slice being pulled
 * takes the bright edge. The read-out names the slice. The slider is how far a slice is pulled.
 *
 * Every slice is a prism of its wedge, a silhouette and one crease, painted from the far side to the near one; the cheese is lines
 * sagging between the edges. The slice under the pointer is read on the board's fixed plane by its angle from the middle.
 */
const { Cam, fit, proj, facing, rings, circ, prism, solid, put, unproj, open, poly, spring, stepS, mk, register, pointer, disposer } = HL;

const N = 8, R = 42, H = 2.6, BOARD = 50;
/** a closed run of points as a ring of samples with outward normals, as prism wants */
const ringOf = (pts) => pts.map((p, i) => { const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return { u: p[0], v: p[1], nu: dy / l, nv: -dx / l }; });
/** slice k's wedge, inset by b, its tip pulled in from the middle so the cuts show */
function wedge(k, b) {
  const a0 = (k / N) * 2 * Math.PI, a1 = ((k + 1) / N) * 2 * Math.PI, mid = (a0 + a1) / 2, tip = 1.2 + b * 2.4;
  const arc = Array.from({ length: 13 }, (_, i) => { const a = a0 + 0.012 + (a1 - a0 - 0.024) * (i / 12) + 0, r = R - b; return [r * Math.cos(a), r * Math.sin(a)]; });
  const side = (a) => [tip * Math.cos(mid) + (b / Math.sin(Math.PI / N)) * 0 * Math.cos(a), tip * Math.sin(mid)];
  return [side(a0), ...arc].map(([x, y], i) => (i === 0 ? [x, y] : [x - Math.cos(mid) * 0, y]));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let pull = value;
  const C = Cam(45, 0.5, 3.0);
  fit(C, [[-BOARD, -BOARD, -4], [BOARD, BOARD, -4], [BOARD, -BOARD, -4], [-BOARD, BOARD, -4], [0, 0, 22]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const board = circ(BOARD, 56), boardIn = circ(BOARD - 1.6, 56);
  put(solid(g), prism(P, front, board, boardIn, -4, 0));
  const strings = mk("path", { class: "nf lo" }, g);
  const slices = Array.from({ length: N }, (_, k) => {
    const mid = ((k + 0.5) / N) * 2 * Math.PI, w = wedge(k, 0), wi = wedge(k, 1.3);
    // pepperoni: two rounds on each slice
    const pep = [[0.45, -0.18], [0.72, 0.16]].map(([rr, da]) => ({ r: R * rr, a: mid + da }));
    return { k, mid, ring: ringOf(w), inner: ringOf(wi), crust: Array.from({ length: 11 }, (_, i) => { const a = (k / N) * 2 * Math.PI + 0.05 + ((2 * Math.PI) / N - 0.1) * (i / 10); return [(R - 5) * Math.cos(a), (R - 5) * Math.sin(a)]; }), pep, s: solid(g), marks: mk("path", { class: "nf" }, g), out: spring(0) };
  });

  const shift = (r, dx, dy) => r.map((q) => ({ ...q, u: q.u + dx, v: q.v + dy }));
  let drawn = "";
  function draw() {
    const key = slices.map((s) => s.out.x.toFixed(4)).join();
    if (key === drawn) return; drawn = key;
    for (const s of slices) {
      const o = s.out.x * pull, dx = Math.cos(s.mid) * o, dy = Math.sin(s.mid) * o, z = s.out.x * 7;
      put(s.s, prism(P, front, shift(s.ring, dx, dy), shift(s.inner, dx, dy), z, z + H));
      const top = z + H;
      s.marks.setAttribute("d", open(s.crust.map(([x, y]) => P(x + dx, y + dy, top))) + s.pep.map((p) => poly(Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 2 * Math.PI; return P(p.r * Math.cos(p.a) + dx + 4.2 * Math.cos(a), p.r * Math.sin(p.a) + dy + 4.2 * Math.sin(a), top); }))).join(""));
    }
    // painted far to near, a pulled slice over the others
    const order = slices.slice().sort((a, b) => Math.cos(a.mid) + Math.sin(a.mid) + a.out.x * 3 - (Math.cos(b.mid) + Math.sin(b.mid) + b.out.x * 3));
    order.forEach((s) => { g.append(s.s.g); g.append(s.marks); });
    g.append(strings);
    // the cheese: strings sagging from a pulled slice's cut edges back to its neighbours
    let d = "";
    for (const s of slices) {
      if (s.out.x < 0.05) continue;
      const o = s.out.x * pull, dx = Math.cos(s.mid) * o, dy = Math.sin(s.mid) * o, z = s.out.x * 7 + H;
      for (const edge of [(s.k / N) * 2 * Math.PI, ((s.k + 1) / N) * 2 * Math.PI]) for (const rr of [0.35, 0.6, 0.85]) {
        const ax = R * rr * Math.cos(edge), ay = R * rr * Math.sin(edge), sag = 3 + 3 * rr;
        d += open(Array.from({ length: 8 }, (_, i) => { const t = i / 7; return P(ax + dx * t, ay + dy * t, H + (z - H) * t - sag * Math.sin(Math.PI * t) * 0.6); }));
      }
    }
    strings.setAttribute("d", d);
  }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const s of slices) if (stepS(s.out, dt)) m = true; draw(); return m; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    const w = q ? unproj(C, q[0], q[1], 0) : null;
    let s = null;
    if (w && Math.hypot(w[0], w[1]) < BOARD + 6 && Math.hypot(w[0], w[1]) > 4) { let a = Math.atan2(w[1], w[0]); if (a < 0) a += 2 * Math.PI; s = slices[Math.floor((a / (2 * Math.PI)) * N) % N]; }
    if (s !== lit) { if (lit) lit.s.sil.classList.remove("hi"); lit = s; if (s) s.s.sil.classList.add("hi"); slices.forEach((x) => { x.out.t = x === s ? 1 : 0; }); }
    read.textContent = s ? `slice ${s.k + 1} of ${N}` : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pull = v; drawn = ""; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "pizza",
  means: "A pizza cut in eight: the slice under the pointer slides out and lifts, cheese stretching after it; the others stay in place.",
  rules: [1, 6, 8, 9, 10],
  range: [9, 13, 17],
  mount,
});
