/**
 * Tool loop: how Claude Code works, as a round hub with Claude's star on top and four tools set round it on spokes,
 * each its own shape: a low wide one to read, a round one to search, a tall one to edit, a cube to run commands. Bring
 * the pointer over it and the loop runs: a call, a small bead, leaves the hub, arcs out along a spoke to a tool, the
 * tool presses down as it works, and the bead arcs back with the result; then out to the next tool, round and round,
 * for as long as the pointer stays. Leave and the bead comes home and it stops. The tool being called takes the bright
 * edge. The read-out names the tool; the slider is the time per call, in ms.
 *
 * Hub, tools and bead are rounded solids, a silhouette and one crease, painted back to front; the spokes are drawn
 * under them. The hit test is a fixed box round the ring at rest.
 */
const { Cam, circ, clamp, facing, fit, lerp, open, prism, proj, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const RAD = 36, HUB = 11, HUBH = 10, ARC = 16, PRESS = 3;
// the tools, round the hub: name, place, and its shape as a footprint (half widths, or a radius) and a height
const TOOLS = [["Read", [RAD, 0], [8, 6], 5], ["Grep", [0, RAD], 6, 8], ["Edit", [-RAD, 0], [4, 4], 14], ["Bash", [0, -RAD], [6, 6], 10]];
const EASE = (u) => u * u * (3 - 2 * u);
const STAR = (r) => Array.from({ length: 96 }, (_, j) => { const a = (j / 96) * 2 * Math.PI, rr = r * (1 - 0.68 * (1 - Math.abs(Math.cos(4 * a)) ** 1.4)); return { u: rr * Math.cos(a), v: rr * Math.sin(a) }; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const C = Cam(45, 0.5, 3.9);
  fit(C, [[-RAD - 10, -RAD - 10, 0], [RAD + 10, RAD + 10, 0], [RAD + 10, -RAD - 10, 0], [-RAD - 10, RAD + 10, 0], [0, 0, HUBH + ARC + 6]], 200, 164);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const at = (r, x, y) => r.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

  mk("path", { class: "nf lo", d: TOOLS.map(([, [x, y]]) => open([P(0, 0, 0), P(x, y, 0)])).join("") }, g);
  // the hub and the tools, painted back to front
  const hub = { x: 0, y: 0, el: solid(g) };
  const tools = TOOLS.map(([name, [x, y], f, h]) => {
    const [r, i] = typeof f === "number" ? [circ(f, 40), circ(f - 1.2, 40)] : rings(-f[0], -f[1], f[0], f[1], 1.8, 0.9);
    return { name, x, y, h, r: at(r, x, y), i: at(i, x, y), el: null };
  });
  const order = [hub, ...tools].sort((a, b) => a.x + a.y - (b.x + b.y));
  order.forEach((p) => { if (p !== hub) p.el = solid(g); else hub.el = p.el; });
  put(hub.el, prism(P, front, circ(HUB, 48), circ(HUB - 1.3, 48), 0, HUBH));
  const star = mk("path", { class: "sil" }, g);
  star.setAttribute("d", open(STAR(7).concat([STAR(7)[0]]).map((q) => P(q.u, q.v, HUBH))));
  const bead = solid(g);

  // a call: out to tool k, the tool presses, back to the hub
  let call = null, next = 0, on = false, lit = null;
  function draw(now) {
    if (call && now - call.t0 >= per) call = null;
    if (!call && on && !reducedMotion()) { call = { k: next, t0: now }; next = (next + 1) % tools.length; }
    const t = call ? clamp((now - call.t0) / per, 0, 1) : 0, tool = call ? tools[call.k] : null;
    const press = tool ? Math.sin(Math.PI * clamp((t - 0.35) / 0.3, 0, 1)) * PRESS : 0;
    tools.forEach((p) => put(p.el, prism(P, front, p.r, p.i, 0, p.h - (p === tool ? press : 0))));
    if (tool) {
      // out over 0..0.35, held while the tool works, back over 0.65..1
      const s = t < 0.35 ? EASE(t / 0.35) : t < 0.65 ? 1 : 1 - EASE((t - 0.65) / 0.35);
      const x = lerp(0, tool.x * 0.86, s), y = lerp(0, tool.y * 0.86, s), z = lerp(HUBH, tool.h - press, s) + Math.sin(Math.PI * s) * ARC;
      put(bead, prism(P, front, at(circ(2.6, 24), x, y), at(circ(1.6, 24), x, y), z, z + 2.6));
    }
    bead.g.setAttribute("display", tool ? "inline" : "none");
    const hot = tool ? tool.el : null;
    if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; if (hot) hot.sil.classList.add("hi"); }
    read.textContent = tool ? `${tool.name}${t < 0.35 ? " · call" : t < 0.65 ? " · working" : " · result"}` : on ? "idle" : "rest";
    return !!call || on;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  const pts = [[-RAD - 10, -RAD - 10, 0], [RAD + 10, RAD + 10, 0], [RAD + 10, -RAD - 10, 0], [-RAD - 10, RAD + 10, 0], [0, 0, HUBH + ARC]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])) - 10, Math.max(...pts.map((p) => p[1]))];
  function point(q) {
    on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3];
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "toolloop",
  means: "How Claude Code works: a call leaves the hub, arcs out to a tool, the tool works, and the result comes back.",
  rules: [2, 5, 7, 9],
  range: [900, 1300, 1900],
  mount,
});
