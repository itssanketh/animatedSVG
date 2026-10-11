/**
 * Dijkstra: eight round nodes laid out flat, joined by roads whose weight is their length. Point at a node and Dijkstra's
 * search runs from it: a front runs out along every road at one steady speed, so each node is reached at the moment its
 * shortest distance comes up, in the order the algorithm settles them; a node lifts as it is settled, higher the nearer it
 * is, and the road that reached it first stays drawn whole, so the shortest-path tree is left standing, while a road that lost
 * the race keeps only its two fronts, dashed, to where they met. The start takes the bright edge. Leave and the nodes settle and the roads go dim again. The read-out
 * names the start and the last node settled, with its distance; the slider is how fast the front runs, in units a second.
 *
 * Nodes are short cylinders, a silhouette and one crease, painted back to front; the roads run between their bases, at
 * whatever height each node stands, drawn under them. The hit test reads the pointer on the nodes' fixed top plane against each node's resting place.
 */
const { Cam, circ, facing, fit, mk, open, prism, proj, tween, tset, tval, tdone, unproj, disposer, pointer, put, register, solid } = HL;

const R = 6, H = 4, LIFT = 9;
const SPOTS = [[0, 0], [34, -14], [70, -6], [-6, 34], [30, 22], [66, 30], [12, 64], [52, 62]];
const ROADS = [[0, 1], [1, 2], [0, 3], [0, 4], [1, 4], [2, 5], [4, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 7], [1, 5]];
const cx = SPOTS.reduce((s, p) => s + p[0], 0) / SPOTS.length, cy = SPOTS.reduce((s, p) => s + p[1], 0) / SPOTS.length;
const NODES = SPOTS.map(([x, y], i) => ({ i, x: x - cx, y: y - cy }));
const len = ([a, b]) => Math.hypot(NODES[a].x - NODES[b].x, NODES[a].y - NODES[b].y);
/** Dijkstra from s: each node's distance and the road it was reached by. */
function search(s) {
  const d = NODES.map(() => Infinity), via = NODES.map(() => -1), done = NODES.map(() => false); d[s] = 0;
  for (let k = 0; k < NODES.length; k++) {
    let a = -1; for (let i = 0; i < NODES.length; i++) if (!done[i] && (a < 0 || d[i] < d[a])) a = i;
    done[a] = true;
    ROADS.forEach((r, e) => { const b = r[0] === a ? r[1] : r[1] === a ? r[0] : -1; if (b >= 0 && d[a] + len(r) < d[b]) { d[b] = d[a] + len(r); via[b] = e; } });
  }
  return { d, via };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let speed = value;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y), [x0, x1, y0, y1] = [Math.min(...xs) - 8, Math.max(...xs) + 8, Math.min(...ys) - 8, Math.max(...ys) + 8];
  const C = Cam(45, 0.5, 3.0);
  fit(C, [[x0, y0, 0], [x1, y1, 0], [x1, y0, 0], [x0, y1, 0], [0, 0, H + LIFT]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const dim = mk("path", { class: "nf lo" }, g), lost = mk("path", { class: "dash" }, g), run = mk("path", { class: "nf" }, g);
  const ring = circ(R, 40), inner = circ(R - 1.1, 40), at = (r, n) => r.map((q) => ({ ...q, u: q.u + n.x, v: q.v + n.y }));
  const nodes = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).map((n) => ({ ...n, el: solid(g), tw: tween(0) }));
  const byI = []; nodes.forEach((n) => { byI[n.i] = n; });

  let start = -1, t0 = 0, res = null, maxD = 1;
  function draw(now) {
    const t = start < 0 ? -1 : ((now - t0) / 1000) * speed;
    // the front: along each road, out from whichever end it has reached, as far as the time allows; a road the tree
    // used stays whole; a road that lost the race stops where the two fronts met
    // the roads run between the nodes' bases, at whatever height each node stands
    const zOf = (i) => tval(byI[i].tw, now), W = (n, f, m) => P(n.x + (m.x - n.x) * f, n.y + (m.y - n.y) * f, zOf(n.i) + (zOf(m.i) - zOf(n.i)) * f);
    dim.setAttribute("d", ROADS.map(([a, b]) => open([W(NODES[a], 0, NODES[b]), W(NODES[a], 1, NODES[b])])).join(""));
    let d = "", dl = "";
    if (res) ROADS.forEach((r, e) => {
      const L = len(r), [a, b] = r, da = res.d[a], db = res.d[b], A = NODES[a], Bn = NODES[b];
      const seg = (from, to, f) => open([W(from, 0, to), W(from, f, to)]);
      if (res.via[a] === e || res.via[b] === e) { const [p, q, dp] = da <= db ? [A, Bn, da] : [Bn, A, db]; const f = Math.min(1, Math.max(0, (t - dp) / L)); if (f > 0) d += seg(p, q, f); return; }
      const meet = (L + db - da) / 2; // where the fronts from a and from b meet, measured from a
      const fa = Math.min(meet, Math.max(0, t - da)) / L, fb = Math.min(L - meet, Math.max(0, t - db)) / L;
      if (fa > 0.01) dl += seg(A, Bn, fa); if (fb > 0.01) dl += seg(Bn, A, fb);
    });
    run.setAttribute("d", d); lost.setAttribute("d", dl);
    let settled = null;
    for (const n of nodes) {
      if (res && t >= res.d[n.i] && !n.reached) { n.reached = true; tset(n.tw, LIFT * (1 - 0.75 * (res.d[n.i] / maxD)), now, 0); }
      if (res && n.reached && (!settled || res.d[n.i] > res.d[settled.i])) settled = n;
      const z = tval(n.tw, now);
      put(n.el, prism(P, front, at(ring, n), at(inner, n), z, z + H));
    }
    if (settled) read.textContent = `from ${start + 1} · ${settled.i + 1} at ${Math.round(res.d[settled.i])}`;
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => { draw(now); return (res && ((now - t0) / 1000) * speed < maxD + 1) || nodes.some((n) => !tdone(n.tw, now)); });
  bag.add(B.unregister);

  function point(q) {
    const now = performance.now(), w = q ? unproj(C, q[0], q[1], H) : null;
    const hit = w ? NODES.find((n) => Math.hypot(w[0] - n.x, w[1] - n.y) < R + 2) : null, s = hit ? hit.i : start >= 0 && q ? start : -1;
    if (s !== start) {
      start = s; t0 = now; res = s >= 0 ? search(s) : null; maxD = res ? Math.max(...res.d) : 1;
      for (const n of nodes) { n.reached = false; tset(n.tw, 0, now, 0); n.el.sil.classList.toggle("hi", n.i === s); }
      if (s < 0) read.textContent = "rest";
    }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "dijkstra",
  means: "Dijkstra: point at a node and a front runs out along the roads; nodes rise as reached and the shortest-path tree stays drawn.",
  rules: [1, 2, 8, 10],
  range: [30, 60, 110],
  mount,
});
