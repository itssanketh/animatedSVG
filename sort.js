/**
 * Sort: eight bars of different heights standing shuffled on a tray. Bring the pointer over it and a bubble sort runs,
 * one comparison at a time: the two bars being compared lift a little, and if the taller stands first they trade
 * places, one passing in front of the other; the tallest bubble along to the end, pass after pass, until the row climbs
 * evenly. It holds a moment, shuffles back and sorts again, for as long as the pointer stays. Leave and the bars go
 * back to where they stood. The bar being carried along takes the bright edge. The read-out gives the comparison and
 * the swaps so far; the slider is the time per comparison, in ms.
 *
 * Each bar is a rounded box, a silhouette and one crease, repainted back to front as they pass; each follows the sort
 * on its own springs. The hit test is a fixed box round the tray at rest.
 */
const { Cam, clamp, facing, fit, lerp, mk, prism, proj, rings, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const START = [5, 2, 7, 1, 8, 3, 6, 4], N = START.length, PITCH = 11, W = 8, PASS = 7, BUMP = 3;
const H = (v) => 6 + v * 4.6, xAt = (slot) => slot * PITCH;
const EASE = (u) => u * u * (3 - 2 * u);
// the sort, worked out once: each comparison, whether it swaps, and the row before it
const OPS = [];
{
  const row = START.slice();
  for (let end = N - 1; end > 0; end--) for (let j = 0; j < end; j++) {
    const swap = row[j] > row[j + 1];
    OPS.push({ j, swap, row: row.slice() });
    if (swap) [row[j], row[j + 1]] = [row[j + 1], row[j]];
  }
}
const SORTED = START.slice().sort((a, b) => a - b), ROUND = OPS.length + 3;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 3.4), END = xAt(N - 1);
  fit(C, [[-8, -PASS - 6, -3], [END + 8, PASS + 6, -3], [END + 8, -PASS - 6, -3], [-8, PASS + 6, -3], [END, 0, H(8) + BUMP], [0, 0, H(8) + BUMP]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [tr, ti] = rings(-8, -8, END + 8, 8, 5, 1.6);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const barsG = mk("g", {}, g);
  const bars = {};
  for (const v of START) bars[v] = { v, el: solid(barsG), x: spring(xAt(START.indexOf(v))), y: spring(0), z: spring(0) };
  const shift = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  const [ring, inner] = rings(-W / 2, -W / 2, W / 2, W / 2, 2, 0.9);

  let t0 = null, lit = null;
  /** Sets every bar's springs to where the sort has it at time e into a round. */
  function goals(now) {
    if (t0 === null) { START.forEach((v, s) => { bars[v].x.t = xAt(s); bars[v].y.t = 0; bars[v].z.t = 0; }); return null; }
    const e = Math.max(0, now - t0) / step, k = Math.floor(e) % ROUND, u = EASE(e - Math.floor(e));
    let hot = null, swaps = 0;
    if (k < OPS.length) {
      const op = OPS[k];
      for (let i = 0; i < k; i++) if (OPS[i].swap) swaps++;
      op.row.forEach((v, s) => { bars[v].x.t = xAt(s); bars[v].y.t = 0; bars[v].z.t = 0; });
      const a = bars[op.row[op.j]], b = bars[op.row[op.j + 1]];
      a.z.t = b.z.t = BUMP * Math.sin(Math.PI * u);
      if (op.swap) { a.x.t = lerp(xAt(op.j), xAt(op.j + 1), u); b.x.t = lerp(xAt(op.j + 1), xAt(op.j), u); a.y.t = PASS * Math.sin(Math.PI * u); b.y.t = -PASS * Math.sin(Math.PI * u); }
      hot = a;
      read.textContent = `compare ${op.row[op.j]} · ${op.row[op.j + 1]}${op.swap ? " · swap" : ""} · ${swaps} swaps`;
    } else if (k < ROUND - 1) {
      SORTED.forEach((v, s) => { bars[v].x.t = xAt(s); bars[v].y.t = 0; bars[v].z.t = 0; });
      read.textContent = `sorted · ${OPS.filter((o) => o.swap).length} swaps`;
    } else {
      // shuffle back: each bar lifts and goes back to where it started
      START.forEach((v, s) => { bars[v].x.t = lerp(xAt(SORTED.indexOf(v)), xAt(s), u); bars[v].y.t = 0; bars[v].z.t = BUMP * 2 * Math.sin(Math.PI * u); });
      read.textContent = "shuffle";
    }
    return hot;
  }
  function draw() {
    const all = Object.values(bars);
    for (const b of all) { const x = b.x.x, y = b.y.x, z = b.z.x; put(b.el, prism(P, front, shift(ring, x, y), shift(inner, x, y), z, z + H(b.v))); }
    // painted back to front: along the row, and the one passing in front last
    const order = all.slice().sort((a, b) => a.x.x + a.y.x - (b.x.x + b.y.x));
    if (order.some((b, i) => barsG.children[i] !== b.el.g)) order.forEach((b) => barsG.append(b.el.g));
  }
  const B = register(stage, (dt, now) => {
    const hot = goals(now);
    if (hot !== lit) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
    if (t0 === null) read.textContent = "rest";
    let moving = t0 !== null;
    for (const b of Object.values(bars)) for (const s of [b.x, b.y, b.z]) if (stepS(s, dt)) moving = true;
    draw();
    return moving;
  });
  bag.add(B.unregister);
  draw();

  const pts = [[-8, -8, 0], [END + 8, 8, 0], [END + 8, -8, 0], [-8, 8, 0], [END, 0, H(8)], [0, 0, H(8)]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])) - 10, Math.max(...pts.map((p) => p[0])) + 10, Math.min(...pts.map((p) => p[1])) - 10, Math.max(...pts.map((p) => p[1])) + 10];
  function point(q) {
    const on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3] && !reducedMotion();
    if (on && t0 === null) t0 = performance.now();
    if (!on) t0 = null;
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { if (t0 !== null) { const now = performance.now(); t0 = now - ((now - t0) / step) * v; } step = clamp(v, 120, 2000); }, destroy: bag.dispose };
}

hairline({
  name: "sort",
  means: "Bubble sort: hover it and bars are compared in pairs and swapped, the tallest bubbling to the end, until the row climbs.",
  rules: [2, 5, 7, 10],
  range: [600, 400, 240],
  mount,
});
