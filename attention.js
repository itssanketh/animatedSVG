/**
 * Attention: a causal attention map, seven tokens by seven, laid out flat: a row for each query token and a column for each key,
 * and only the tiles at or below the diagonal there, as a causal model can look only back. Each tile stands as tall as the weight
 * that query gives that key, a softmax along its row, so at rest the map is a low staircase of weights. Bring the pointer over a
 * row and that query's tiles rise to their full weight while the others sink, the key it attends to most taking the bright edge.
 * Leave and the map settles. The read-out gives the query, its strongest key and the weight. The slider is how tall full weight is.
 *
 * Every tile is a rounded box, a silhouette and one crease, on its own spring, painted from the far corner to the near one. The
 * row under the pointer is read on the board's fixed plane.
 */
const { Cam, facing, fit, mk, prism, proj, rings, spring, stepS, unproj, disposer, pointer, put, register, solid } = HL;

const N = 7, P_ = 11, W = 9.4, REST = 0.28;
// the weights: a softmax along each row of fixed scores, a little favour to the token itself and the first token
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const WTS = Array.from({ length: N }, (_, i) => {
  const s = Array.from({ length: i + 1 }, (_, j) => 2.2 * rnd() + (j === i ? 1 : 0) + (j === 0 ? 0.8 : 0)), e = s.map((v) => Math.exp(v)), z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
});

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let tall = value;
  const C = Cam(45, 0.5, 3.0), E = (N - 1) * P_;
  fit(C, [[-8, -8, -2], [E + 8, E + 8, -2], [E + 8, -8, -2], [-8, E + 8, -2], [0, 0, 40], [E, E, 20]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const [br, bi] = rings(-8, -8, E + 8, E + 8, 4, 1.4);
  put(solid(g), prism(P, front, br, bi, -2, 0));
  const [r0, i0] = rings(-W / 2, -W / 2, W / 2, W / 2, 1.6, 0.8), at = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  // query i runs along y, key j along x; tiles painted far to near
  const tiles = [];
  for (let i = 0; i < N; i++) for (let j = 0; j <= i; j++) tiles.push({ i, j, x: j * P_, y: i * P_, w: WTS[i][j], h: spring(0.6 + WTS[i][j] * tall * REST) });
  tiles.sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((t) => { t.s = solid(g); });

  function draw() { for (const t of tiles) put(t.s, prism(P, front, at(r0, t.x, t.y), at(i0, t.x, t.y), 0, t.h.x)); }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const t of tiles) if (stepS(t.h, dt)) m = true; draw(); return m; });
  bag.add(B.unregister);

  let row = -1, lit = null;
  function point(q) {
    const w = q ? unproj(C, q[0], q[1], 0) : null;
    const r = w && w[0] > -8 && w[0] < E + 8 && w[1] > -8 && w[1] < E + 8 ? Math.max(0, Math.min(N - 1, Math.round(w[1] / P_))) : -1;
    if (r !== row) {
      row = r;
      for (const t of tiles) t.h.t = 0.6 + t.w * tall * (r < 0 ? REST : t.i === r ? 1 : 0.12);
      const best = r < 0 ? null : tiles.filter((t) => t.i === r).sort((a, b) => b.w - a.w)[0];
      if (best !== lit) { if (lit) lit.s.sil.classList.remove("hi"); lit = best; if (best) best.s.sil.classList.add("hi"); }
      read.textContent = best ? `query ${r + 1} → key ${best.j + 1} · ${Math.round(best.w * 100)}%` : "rest";
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { tall = v; row = -2; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "attention",
  means: "A causal attention map: the query row under the pointer rises to its weights, its strongest key lit; the others sink.",
  rules: [1, 5, 8, 10],
  range: [26, 40, 56],
  mount,
});
