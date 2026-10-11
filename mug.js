/**
 * Mug: a coffee mug on its saucer, full nearly to the brim, its handle out to one side. Bring the pointer near and it
 * is hot: three wisps of steam curl up out of the coffee, rising and swaying, and the mug turns on its saucer to offer
 * you its handle, on the side the pointer is; leave and the steam stops and the mug settles. The part under the pointer
 * takes the bright edge. The read-out says which way the handle points; the slider is how tall the steam rises.
 *
 * Saucer and mug are short cylinders, a silhouette and one crease; the coffee is the ellipse of its surface; the handle
 * is a band bent round in the plane through the mug's axis, painted behind the mug when it points away and in front
 * when it points toward you. The steam is three open lines. The pointer is read on the table's plane, and the hit
 * test is against the mug at rest.
 */
const { Cam, circ, clamp, facing, fit, hull, mk, open, poly, prism, proj, put, rad, spring, stepS, unproj, reducedMotion, disposer, pointer, register, solid } = HL;

const R = 12, H = 19, SAUCER = 19, LEVEL = 15.5;
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rise = value;
  const C = Cam(45, 0.5, 5.2);
  fit(C, [[-SAUCER, -SAUCER, 0], [SAUCER, SAUCER, 0], [SAUCER, -SAUCER, 0], [-SAUCER, SAUCER, 0], [0, 0, H + 34]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const saucer = solid(g);
  put(saucer, prism(P, front, circ(SAUCER, 56), circ(SAUCER - 3, 56), 0, 1.6));
  const tube = () => ({ band: mk("path", { class: "fo" }, g), edge: mk("path", { class: "nf" }, g) });
  const handleBack = tube(), mug = { sil: mk("path", { class: "sil" }, g) }, lip = mk("path", { class: "nf" }, g), coffee = mk("path", { class: "nf" }, g), handleFront = tube();
  const top = 1.6 + H, opening = circ(R - 1.3, 56).map((q) => P(q.u, q.v, top));
  mug.sil.setAttribute("d", poly(hull([...circ(R, 56).map((q) => P(q.u, q.v, 1.6)), ...circ(R, 56).map((q) => P(q.u, q.v, top))])));
  lip.setAttribute("d", poly(opening));
  // the coffee: its surface a little below the rim, only the part seen through the opening (the near wall hides the rest)
  const surf = circ(R - 1.3, 72).map((q) => P(q.u, q.v, 1.6 + LEVEL)), runs = [[]];
  surf.concat([surf[0]]).forEach((q) => { if (inLoops(q, [opening])) runs[runs.length - 1].push(q); else if (runs[runs.length - 1].length) runs.push([]); });
  coffee.setAttribute("d", runs.filter((r) => r.length > 1).map((r) => open(r)).join(""));
  const steam = mk("path", { class: "nf" }, g);

  const turn = spring(rad(-45), { eps: 0.002 }), heat = spring(0, { eps: 0.002 });
  let clock = 0, last = performance.now(), on = false;
  /** The handle at angle a round the mug: a round tube bent out from the side, its outline the curve's projection
   * widened by the tube's own width on screen, so it reads at any angle, edge on included. */
  const unit = Math.hypot(...[0, 1].map((i) => P(1, 0, 0)[i] - P(0, 0, 0)[i]));
  function handle(a) {
    const c = Math.cos(a), s = Math.sin(a), w = 1.5 * unit;
    const mid = Array.from({ length: 17 }, (_, k) => { const t = (k / 16) * Math.PI, r = R - 0.2 + 6.6 * Math.sin(t), z = 1.6 + 10 + 5.2 * Math.cos(t); return P(r * c, r * s, z); });
    const side = (sgn) => mid.map((q, k) => {
      const a0 = mid[Math.max(0, k - 1)], b0 = mid[Math.min(mid.length - 1, k + 1)], dx = b0[0] - a0[0], dy = b0[1] - a0[1], l = Math.hypot(dx, dy) || 1;
      return [q[0] - (dy / l) * w * sgn, q[1] + (dx / l) * w * sgn];
    });
    return { band: poly([...side(1), ...side(-1).reverse()]), edge: open(side(1)) + open(side(-1)) };
  }
  function draw(now) {
    const dt = Math.min(now - last, 50); last = now;
    if (heat.x > 0.001 && !reducedMotion()) clock += dt;
    const a = turn.x, toward = Math.cos(a - rad(45)) > 0, d = handle(a);
    for (const [t, show] of [[handleFront, toward], [handleBack, !toward]]) { t.band.setAttribute("d", show ? d.band : ""); t.edge.setAttribute("d", show ? d.edge : ""); }
    // the steam: three wisps up from the coffee, swaying as they rise, fading out at the top
    const h = heat.x * rise;
    steam.setAttribute("d", h < 0.5 ? "" : [-4.5, 0, 4.5].map((x0, k) => open(Array.from({ length: 20 }, (_, i) => {
      const f = i / 19, z = 1.6 + LEVEL + 2 + f * h, sway = Math.sin(f * 7 - clock * 0.004 + k * 2.1) * (1 + f * 2.6);
      return P(x0 * (1 - f * 0.3) + sway * 0.7, x0 * 0.3 - sway * 0.7, z);
    }))).join(""));
  }
  draw(performance.now());
  const rest = [{ name: "mug", el: mug.sil }, { name: "saucer", el: saucer.sil }].map((p) => ({ ...p, ls: loops(p.el.getAttribute("d")) }));
  const handleRest = loops(handle(turn.x).band);

  const B = register(stage, (dt) => { const now = performance.now(), m = [stepS(turn, dt), stepS(heat, dt)].some(Boolean); draw(now); return m || heat.x > 0.001; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    on = !!q;
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], 0), raw = Math.atan2(y, x), off = Math.atan2(Math.sin(raw - rad(45)), Math.cos(raw - rad(45))), want = rad(45) + clamp(off, rad(-115), rad(115));
      turn.t = turn.x + Math.atan2(Math.sin(want - turn.x), Math.cos(want - turn.x));
      read.textContent = "steaming · handle to the " + ["e", "se", "s", "sw", "w", "nw", "n", "ne"][(Math.round(raw / (Math.PI / 4)) + 8) % 8];
    } else read.textContent = "rest";
    heat.t = on ? 1 : 0;
    const hit = q ? (inLoops(q, handleRest) ? { el: (Math.cos(turn.x - rad(45)) > 0 ? handleFront : handleBack).edge } : rest.find((p) => inLoops(q, p.ls))) : null, el = hit ? hit.el : null;
    if (el !== lit) { if (lit) lit.classList.remove("hi"); lit = el; if (el) el.classList.add("hi"); }
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rise = clamp(v, 8, 34); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "mug",
  means: "A coffee mug: bring the pointer near and steam curls up out of it, and it turns to offer you its handle; leave and it settles.",
  rules: [1, 7, 8, 9],
  range: [14, 22, 30],
  mount,
});
