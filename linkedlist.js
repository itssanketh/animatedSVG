/**
 * Linked list: four nodes in a row on the table, each a box split in two, its value on the left and its pointer
 * on the right, a dot in the pointer half and a link line from it to the next node; a head post points at the first,
 * and the last node's pointer is empty. Each link is an arch from a pointer dot to the next node. Point at a gap between nodes and a new node is inserted there: the nodes
 * after the gap step aside one place, the new node drops into the gap, and the links re-wire, the one before it now
 * pointing at the new node and the new node at the one after. Move along and it moves to the new gap; leave and it is
 * taken out again. The new node takes the bright edge. The read-out says where it goes in; the slider is the stagger
 * between nodes, in ms.
 *
 * Nodes are rounded boxes, a silhouette and one crease, painted back to front; links are arches drawn over the nodes they
 * join. The hit test reads the pointer against the row's fixed line on screen.
 */
const { Cam, clamp, facing, fit, flatDot, lerp, open, place, prism, proj, rings, seg, tween, tset, tval, tdone, disposer, mk, pointer, put, register, solid } = HL;

const N = 4, PITCH = 30, BW = 18, BD = 13, H = 8, DROP = 22;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 2.4);
  fit(C, [[-26, -14, 0], [N * PITCH + 16, 14, 0], [N * PITCH + 16, -14, 0], [-26, 14, 0], [N * PITCH, 0, DROP + H]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // the table under the list, then the links (behind the nodes), then the head post and the nodes
  const [tr, ti] = rings(-28, -16, N * PITCH + 16, 16, 7, 2);
  put(solid(g), prism(P, front, tr, ti, -3, 0));
  const nodesG = mk("g", {}, g), links = mk("path", { class: "nf" }, g), tips = mk("g", {}, g);
  const post = solid(nodesG);
  put(post, prism(P, front, ...rings(-22, -3, -16, 3, 3, 0.8), 0, H + 4));
  const [ring, inner] = rings(-BW / 2, -BD / 2, BW / 2, BD / 2, 2.6, 1);
  const shift = (r, x) => r.map((q) => ({ ...q, u: q.u + x }));

  // a node: its box, the crease between value and pointer halves, its pointer dot; the new one is the last
  const node = (isNew) => ({ el: solid(nodesG), split: mk("path", { class: "nf lo" }, nodesG), dot: flatDot(nodesG, C, 1.1, "dot m"), tw: tween(0), isNew });
  const nodes = Array.from({ length: N }, () => node(false)), fresh = node(true);
  fresh.tw = tween(1); // 1 = out, lifted above its gap; 0 = in
  const tipEls = Array.from({ length: N + 1 }, () => flatDot(tips, C, 1, "dot off"));
  let gap = -1, at = 0; // gap: where the new node goes, -1 = not inserted; at: the gap it sits over

  function pose(now) {
    // node i stands at i places, plus one while it is after the gap; the new node at its gap, lifted while out
    const ps = nodes.map((n, i) => ({ n, x: (i + tval(n.tw, now)) * PITCH, z: 0 }));
    const f = tval(fresh.tw, now);
    return { ps, fresh: { n: fresh, x: at * PITCH, z: f * DROP, f } };
  }
  function draw(now) {
    const { ps, fresh: fr } = pose(now), list = ps.slice();
    if (fr.f < 0.999) list.splice(at, 0, fr);
    fresh.el.g.setAttribute("display", fr.f > 0.995 ? "none" : "inline");
    [fresh.split, fresh.dot].forEach((e) => e.setAttribute("display", fr.f > 0.995 ? "none" : "inline"));
    for (const { n, x, z } of [...ps, fr]) {
      put(n.el, prism(P, front, shift(ring, x), shift(inner, x), z, z + H));
      n.split.setAttribute("d", open([P(x + 3, -BD / 2 + 1.2, z + H), P(x + 3, BD / 2 - 1.2, z + H)]));
      place(n.dot, P(x + 6.2, 0, z + H));
    }
    // links: head post to the first node, then each node's pointer dot to the next node's value half, each an arch over
    // the gap, drawn above the nodes it joins; a dot where it lands
    const ends = [[-19, H + 4], ...list.map(({ x, z }) => [x + 6.2, z + H])], d = [];
    list.forEach(({ x, z }, k) => {
      const [fx, fz] = ends[k], tx = x - 3, tz = z + H;
      d.push(open(Array.from({ length: 13 }, (_, j) => { const t = j / 12; return P(lerp(fx, tx, t), 0, lerp(fz, tz, t) + Math.sin(Math.PI * t) * 7); })));
      place(tipEls[k], P(tx, 0, tz)); tipEls[k].setAttribute("display", "inline");
    });
    for (let k = list.length; k <= N; k++) tipEls[k].setAttribute("display", "none");
    links.setAttribute("d", d.join(""));
    // the new node is painted where it stands among the others
    const order = [post.g, ...list.map(({ n }) => n)].map((x) => (x.el ? [x.el.g, x.split, x.dot] : [x])).flat();
    if (order.some((e, k) => nodesG.children[k] !== e)) order.forEach((e) => nodesG.append(e));
    return [...nodes, fresh].some((n) => !tdone(n.tw, now));
  }
  draw(performance.now());
  fresh.el.sil.classList.add("hi");

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the hit band: the row's line on screen; the gap is the nearest place between two nodes, or either end
  const x0 = P(-PITCH / 2, 0, 0)[0], x1 = P((N - 0.5) * PITCH, 0, 0)[0], ym = (P(0, 0, 0)[1] + P(N * PITCH, 0, 0)[1]) / 2;
  function point(p) {
    const on = !!p && p[0] > x0 - 30 && p[0] < x1 + 30 && Math.abs(p[1] - ym) < 100;
    const want = on ? clamp(Math.round(((p[0] - x0) / (x1 - x0)) * N), 0, N) : -1;
    if (want !== gap) {
      const now = performance.now(), was = gap;
      gap = want;
      // the nodes after the gap step aside, outward from it; the new node drops in, or moves to the new gap
      nodes.forEach((n, i) => tset(n.tw, gap >= 0 && i >= gap ? 1 : 0, now, Math.abs(i - Math.max(gap, was)) * step));
      if (gap >= 0) { at = gap; fresh.tw = tween(1); tset(fresh.tw, 0, now, step); } else tset(fresh.tw, 1, now, 0);
    }
    read.textContent = gap < 0 ? "rest" : gap === 0 ? "insert at head" : gap === N ? "insert at tail" : `insert after ${gap}`;
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "linkedlist",
  means: "A linked list: point at a gap and a new node drops in there, the nodes after it step aside and the links re-wire around it.",
  rules: [1, 2, 6, 10],
  range: [40, 80, 140],
  mount,
});
