/**
 * Pipeline: a CI pipeline as four stations on a line, build, test, lint and deploy, joined by pipes. Bring the pointer
 * near and a run starts: the first station lifts and a spinner turns on its top while it works, then it settles with a
 * tick on its top and a token rolls down the pipe to the next, and so on along the line until deploy is ticked; leave
 * and the run is cleared, the ticks wiped and the stations at rest. The station at work takes the bright edge. The
 * read-out names the stage and its state; the slider is how long each stage takes, in seconds.
 *
 * Each station is a rounded block, a silhouette and one crease; the pipes are slim bands and the token a small ring;
 * the spinner and the tick are open lines on a station's top. The run is a plan in time from the moment the pointer
 * arrives.
 */
const { Cam, clamp, fit, mk, open, poly, prism, proj, put, rings, spring, stepS, reducedMotion, disposer, pointer, register, solid, facing } = HL;

const NAMES = ["build", "test", "lint", "deploy"], GAP = 15, S = 4.6, TALL = 4;
const X = NAMES.map((_, k) => (k - 1.5) * GAP);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let dur = value;
  const C = Cam(45, 0.5, 6.4);
  fit(C, [[X[0] - S, -S, 0], [X[3] + S, S, 0], [X[0] - S, S, 0], [X[3] + S, -S, 0], [0, 0, TALL + 4]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), pts = (ws) => ws.map((q) => P(...q));
  const band = (a, b, w) => { const p = P(...a), q = P(...b), d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, n = [-(q[1] - p[1]) / d * w, (q[0] - p[0]) / d * w]; return poly([[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]], [q[0] - n[0], q[1] - n[1]], [p[0] - n[0], p[1] - n[1]]]); };
  const pipes = mk("path", { class: "sil" }, g), token = mk("path", { class: "sil" }, g);
  pipes.setAttribute("d", X.slice(0, -1).map((x, k) => band([x + S, 0, 1.6], [X[k + 1] - S, 0, 1.6], 2.2)).join(""));
  const st = NAMES.map((name, k) => ({ name, k, s: solid(g), top: mk("path", { class: "nf" }, g), face: mk("path", { class: "nf" }, g), lamp: mk("path", { class: "sil" }, g), lift: spring(0, { k: 120, c: 16, eps: 0.002 }) }));

  let t = 0, on = false;
  function draw() {
    const phase = t / dur, cur = Math.floor(phase), f = phase - cur;
    for (const s of st) {
      const z = s.lift.x * 1.6, top = TALL + z, cx = X[s.k];
      put(s.s, prism(P, front, ...rings(cx - S, -S, cx + S, S, 1, 0.8), z, top));
      const running = on && s.k === cur && f < 0.75, done = on && (s.k < cur || (s.k === cur && f >= 0.75));
      // the spinner: three quarters of a ring, turning; the tick: two strokes
      s.top.setAttribute("d", running ? open(pts(Array.from({ length: 19 }, (_, i) => { const a = t * 6 + (i / 18) * 1.5 * Math.PI; return [cx + 2.2 * Math.cos(a), 2.2 * Math.sin(a), top]; }))) : done ? open(pts([[cx - 2.2, 0.4, top], [cx - 0.4, 2.2, top], [cx + 2.6, -2.4, top]])) : "");
      // the station's front: a screen and a status lamp, lit while it works and once it has passed
      const fy = S + 0.02;
      s.face.setAttribute("d", poly(pts([[cx - 3.4, fy, z + 0.9], [cx + 1, fy, z + 0.9], [cx + 1, fy, top - 0.9], [cx - 3.4, fy, top - 0.9]])) + open(pts([[cx - 2.6, fy, z + 1.8], [cx - 0.4, fy, z + 1.8]])) + open(pts([[cx - 2.6, fy, z + 2.6], [cx - 1.2, fy, z + 2.6]])));
      s.lamp.setAttribute("d", poly(Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 2 * Math.PI; return P(cx + 2.7 + 0.7 * Math.cos(a), fy, z + 2 + 0.7 * Math.sin(a)); })));
      s.lamp.classList.toggle("hi", running || done);
      s.lift.t = running ? 1 : 0;
      s.s.sil.classList.toggle("hi", running);
    }
    // the token: rolling down the pipe in the last quarter of each stage
    const tk = on && cur < 3 && f >= 0.75 ? (f - 0.75) / 0.25 : -1;
    token.setAttribute("d", tk < 0 ? "" : poly(Array.from({ length: 16 }, (_, i) => { const c = P(X[cur] + S + tk * (GAP - 2 * S), 0, 3.6), a = (i / 16) * 2 * Math.PI; return [c[0] + 4 * Math.cos(a), c[1] + 4 * Math.sin(a)]; })));
    const sname = NAMES[clamp(cur, 0, 3)];
    read.textContent = !on ? "rest" : cur > 3 || (cur === 3 && f >= 0.75) ? "deployed · all passed" : f < 0.75 ? `${sname} · running` : `${sname} · passed`;
  }
  draw();

  const B = register(stage, (dt) => {
    let m = false;
    if (on && !reducedMotion()) t = Math.min(t + dt, 4 * dur);
    draw();
    for (const s of st) if (stepS(s.lift, dt)) m = true;
    return m || (on && t < 4 * dur);
  });
  bag.add(B.unregister);

  function point(q) {
    if (!!q !== on) { on = !!q; t = on && reducedMotion() ? 4 * dur : 0; }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { dur = v; }, destroy: bag.dispose };
}

hairline({
  name: "pipeline",
  means: "A CI pipeline: bring the pointer near and build, test, lint and deploy run one after another, each ticked off; leave and it clears.",
  rules: [1, 5, 7, 8],
  range: [0.5, 0.9, 1.5],
  mount,
});
