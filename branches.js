/**
 * Branches: a git history drawn as two rails. Main runs along the back rail, five commits standing on it; a feature
 * branch curves off the second onto the front rail, runs three commits along it, and curves back into a merge commit at
 * the end of main. A flag on a pole marks HEAD, the commit you are on. Bring the pointer over it and the history plays:
 * the branch folds away and HEAD goes back to main; then the branch curves out again, its commits popping up one at a
 * time with HEAD stepping onto each, and the merge commit joins the two lines; it holds, and plays again, for as long
 * as the pointer stays. Leave and the whole history stands. The newest commit takes the bright edge. The read-out says
 * what git just did; the slider is the time per commit, in ms.
 *
 * Rails and commits are rounded solids, a silhouette and one crease, painted back to front; the lines run over them
 * from rim to rim, and curve between the rails. The hit test is a fixed box round the rails at rest.
 */
const { Cam, circ, clamp, facing, fit, lerp, mk, open, prism, proj, rings, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const PITCH = 18, MAIN = -10, FEAT = 12, R = 3.5, H = 3.6, POLE = 12, RAIL = 1.1;
// the commits: main 0 to 4 on the back rail, the feature's three on the front rail, the merge at the end of main
const COMMITS = [
  ...[0, 1, 2, 3, 4].map((i) => ({ x: i * PITCH, y: MAIN, at: 0 })),
  ...[2, 3, 4].map((i, k) => ({ x: i * PITCH, y: FEAT, at: k + 1 })),
  { x: 5 * PITCH, y: MAIN, at: 4 },
];
// the lines: [from, to, curved between rails]
const LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5, 1], [5, 6], [6, 7], [4, 8], [7, 8, 1]];
const SAY = ["checkout main", "branch feature", "commit on feature", "commit on feature", "merge feature into main", "merged", "merged"];
const HEAD = [4, 5, 6, 7, 8, 8, 8], ROUND = SAY.length;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  const C = Cam(45, 0.5, 4.1), XE = 5 * PITCH;
  fit(C, [[-8, MAIN - 6, 0], [XE + 8, FEAT + 6, 0], [XE + 8, MAIN - 6, 0], [-8, FEAT + 6, 0], [XE, MAIN, H + POLE + 4], [0, MAIN, H + POLE]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the rails: main the whole way, the feature's alongside the middle
  const rail = (x0, x1, y) => { const [r, n] = rings(x0, y - RAIL, x1, y + RAIL, RAIL * 0.9, 0.4); put(solid(g), prism(P, front, r, n, 0, 0.8)); };
  rail(-7, XE + 7, MAIN); rail(1.6 * PITCH, 4.4 * PITCH, FEAT);
  const at = (r, c) => r.map((q) => ({ ...q, u: q.u + c.x, v: q.v + c.y }));
  const commits = COMMITS.map((c, i) => ({ ...c, i, s: spring(1, { k: 160, c: 13 }) })).sort((a, b) => a.x + a.y - (b.x + b.y));
  commits.forEach((c) => { c.el = solid(g); });
  // the lines go over the commits, from rim to rim, so each shows across its gap, curves and all
  const lines = mk("path", { class: "nf sil" }, g);
  const byI = Object.fromEntries(commits.map((c) => [c.i, c]));
  // HEAD: a pole and a flag, standing on the commit you are on
  const flag = mk("path", { class: "nf sil" }, g), hx = spring(byI[8].x), hy = spring(byI[8].y);

  let t0 = null, lit = null;
  function goals(now) {
    const k = t0 === null ? -1 : Math.floor(Math.max(0, now - t0) / step) % ROUND;
    for (const c of commits) c.s.t = c.at === 0 || t0 === null || k >= c.at ? 1 : 0;
    const h = byI[t0 === null ? 8 : HEAD[k]];
    hx.t = h.x; hy.t = h.y;
    read.textContent = t0 === null ? "rest" : SAY[k];
    return t0 === null || k === 0 ? null : byI[HEAD[k]];
  }
  /** A line from commit to commit, curving from rail to rail, on top of the commits and cut at their rims; drawn out as
   * far as its far end has grown. */
  function line([a, b, curve]) {
    const A = byI[a], Bc = byI[b], u = clamp(Bc.s.x, 0, 1);
    if (A.s.x < 0.05 || u < 0.03) return "";
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i / 24) * u, w = curve ? t * t * (3 - 2 * t) : t, x = lerp(A.x, Bc.x, t), y = lerp(A.y, Bc.y, w);
      if (Math.hypot(x - A.x, y - A.y) > R + 0.4 && Math.hypot(x - Bc.x, y - Bc.y) > R * Math.min(1, u) + 0.4) pts.push(P(x, y, H * Math.min(1, lerp(A.s.x, Bc.s.x, t))));
    }
    return pts.length > 1 ? open(pts) : "";
  }
  function draw() {
    for (const c of commits) {
      const s = Math.max(0, c.s.x);
      c.el.g.setAttribute("display", s < 0.04 ? "none" : "inline");
      if (s >= 0.04) put(c.el, prism(P, front, at(circ(R * Math.min(1.15, s), 40), c), at(circ(Math.max(0.3, R * Math.min(1.15, s) - 1.2), 40), c), 0, H * s));
    }
    lines.setAttribute("d", LINES.map(line).join(""));
    g.append(lines);
    const x = hx.x, y = hy.x;
    flag.setAttribute("d", open([P(x, y, H), P(x, y, H + POLE)]) + open([P(x, y, H + POLE), P(x + 5, y - 2, H + POLE - 1.6), P(x, y, H + POLE - 3.4)]));
    g.append(flag);
  }
  const B = register(stage, (dt, now) => {
    const hot = goals(now);
    if ((hot && hot.el) !== (lit && lit.el)) { if (lit) lit.el.sil.classList.remove("hi"); lit = hot; if (hot) hot.el.sil.classList.add("hi"); }
    let moving = t0 !== null;
    for (const s of [hx, hy, ...commits.map((c) => c.s)]) if (stepS(s, dt)) moving = true;
    draw();
    return moving;
  });
  bag.add(B.unregister);
  draw();

  const pts = [[-8, MAIN - 6, 0], [XE + 8, FEAT + 6, 0], [XE + 8, MAIN - 6, 0], [-8, FEAT + 6, 0]].map((q) => P(...q));
  const box = [Math.min(...pts.map((p) => p[0])) - 10, Math.max(...pts.map((p) => p[0])) + 10, Math.min(...pts.map((p) => p[1])) - 30, Math.max(...pts.map((p) => p[1])) + 10];
  function point(q) {
    const on = !!q && q[0] > box[0] && q[0] < box[1] && q[1] > box[2] && q[1] < box[3] && !reducedMotion();
    if (on && t0 === null) t0 = performance.now();
    if (!on) t0 = null;
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = clamp(v, 200, 3000); }, destroy: bag.dispose };
}

hairline({
  name: "branches",
  means: "Git branches: hover it and a feature branch curves off main, commits pop up with HEAD stepping on, then it merges back.",
  rules: [2, 5, 7, 10],
  range: [1100, 800, 550],
  mount,
});
