/**
 * Subagents: Claude handing work out, as a main block with Claude's star on its top and three empty pads in front of
 * it. Bring the pointer over it and three small agents rise out of the main block one after another, arc over to a
 * pad each and set to work there, bobbing as they go; each finishes in its own time, arcs back and sinks into the
 * main block with what it found; then they go out again, for as long as the pointer stays. Leave and any agent still
 * out glides straight home. The main block takes the bright edge while it waits on them. The read-out says how many
 * are working; the slider is the time a round takes, in ms.
 *
 * Blocks and pads are rounded boxes, a silhouette and one crease, painted back to front. The hit test is a fixed box
 * round the figure at rest.
 */
const { Cam, clamp, facing, fit, lerp, open, prism, proj, rings, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const MAIN = [-18, -18], MW = 12, MH = 16, AW = 4.5, AH = 6, ARC = 18;
const PADS = [[30, -16], [20, 20], [-16, 30]];
const EASE = (u) => u * u * (3 - 2 * u);
const STAR = (r) => Array.from({ length: 97 }, (_, j) => { const a = (j / 96) * 2 * Math.PI, rr = r * (1 - 0.68 * (1 - Math.abs(Math.cos(4 * a)) ** 1.4)); return [rr * Math.cos(a), rr * Math.sin(a)]; });
// each agent's round, as fractions of it: leaves, lands, is done, is home
const PLAN = PADS.map((_, k) => [k * 0.06, 0.2 + k * 0.06, 0.5 + k * 0.12, 0.68 + k * 0.12]);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const C = Cam(45, 0.5, 3.4);
  fit(C, [[MAIN[0] - MW, MAIN[1] - MW, 0], [36, -22, 0], [26, 26, 0], [-22, 36, 0], [MAIN[0], MAIN[1], MH + ARC], [20, 20, ARC]], 200, 164);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const box = (x, y, w) => rings(x - w, y - w, x + w, y + w, Math.min(2.2, w / 2), 0.9);

  mk("path", { class: "nf dash", d: PADS.map(([x, y]) => open([P(MAIN[0], MAIN[1], 0), P(x, y, 0)])).join("") }, g);
  const pads = PADS.map(([x, y]) => { const el = solid(g), [r, i] = box(x, y, 8); put(el, prism(P, front, r, i, 0, 1.5)); return el; });
  const main = solid(g), [mr, mi] = box(MAIN[0], MAIN[1], MW);
  put(main, prism(P, front, mr, mi, 0, MH));
  mk("path", { class: "sil", d: open(STAR(7).map(([u, v]) => P(MAIN[0] + u, MAIN[1] + v, MH))) }, g);
  const agentsG = mk("g", {}, g);
  const agents = PADS.map(() => ({ el: solid(agentsG), at: null }));

  /** Agent k's place, t through a round: rising out of the main block, arcing to its pad, bobbing, arcing home. */
  function where(k, t) {
    const [go, land, done, home] = PLAN[k], [px, py] = PADS[k];
    if (t <= go || t >= home) return null;
    const out = t < land ? EASE((t - go) / (land - go)) : t < done ? 1 : 1 - EASE((t - done) / (home - done));
    const bob = t >= land && t < done ? Math.abs(Math.sin(((t - land) / (done - land)) * Math.PI * 4)) * 3 : 0;
    return [lerp(MAIN[0], px, out), lerp(MAIN[1], py, out), lerp(MH, 1.5, out) + Math.sin(Math.PI * out) * ARC + bob];
  }
  let t0 = null, on = false, settle = null, lit = null;
  function draw(now) {
    let t = t0 === null ? 0 : (now - t0) / per;
    if (t0 !== null && t >= 1) { t0 = on ? now : null; t = 0; }
    const u = settle ? EASE(clamp((now - settle.s) / 600, 0, 1)) : 0;
    agents.forEach((a, k) => {
      let p = t0 === null ? null : where(k, t);
      if (settle && settle.from[k]) { const f = settle.from[k]; p = u < 1 ? [lerp(f[0], MAIN[0], u), lerp(f[1], MAIN[1], u), lerp(f[2], MH, u) + Math.sin(Math.PI * u) * 6] : null; }
      a.at = p;
      a.el.g.setAttribute("display", p ? "inline" : "none");
      if (p) { const [r, i] = box(p[0], p[1], AW); put(a.el, prism(P, front, r, i, p[2], p[2] + AH)); }
    });
    if (settle && u >= 1) settle = null;
    // painted back to front
    const order = agents.slice().sort((a, b) => (a.at ? a.at[0] + a.at[1] : -99) - (b.at ? b.at[0] + b.at[1] : -99));
    if (order.some((a, k) => agentsG.children[k] !== a.el.g)) order.forEach((a) => agentsG.append(a.el.g));
    const out = agents.filter((a) => a.at).length, working = t0 === null ? 0 : PLAN.filter(([, land, done]) => t >= land && t < done).length;
    const hot = out ? main : null;
    if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; if (hot) hot.sil.classList.add("hi"); }
    read.textContent = settle ? "called home" : working ? `${working} agent${working > 1 ? "s" : ""} working` : out ? "handing off" : on ? "merging results" : "rest";
    return t0 !== null || !!settle;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  const pts = [[MAIN[0] - MW, MAIN[1] - MW, 0], [36, -22, 0], [26, 26, 0], [-22, 36, 0], [MAIN[0], MAIN[1], MH + 10]].map((q) => P(...q));
  const hit = [Math.min(...pts.map((p) => p[0])) - 10, Math.max(...pts.map((p) => p[0])) + 10, Math.min(...pts.map((p) => p[1])) - 10, Math.max(...pts.map((p) => p[1])) + 10];
  function point(q) {
    on = !!q && q[0] > hit[0] && q[0] < hit[1] && q[1] > hit[2] && q[1] < hit[3];
    const now = performance.now();
    if (on && t0 === null && !reducedMotion()) { t0 = now; settle = null; }
    if (!on && t0 !== null) { settle = { s: now, from: agents.map((a) => a.at) }; t0 = null; }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = v; }, destroy: bag.dispose };
}

hairline({
  name: "subagents",
  means: "Claude handing work out: three agents leave the main block, work on their pads, and bring their results home.",
  rules: [2, 5, 7, 9],
  range: [3200, 4400, 6000],
  mount,
});
