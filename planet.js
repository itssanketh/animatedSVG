/**
 * Planet: a ringed gas giant, banded, its rings tilted round it, and a small moon on a dashed orbit. Bring the pointer
 * near and the moon sets off round its orbit, passing behind the planet and the rings and out in front again, and the
 * nearer the pointer is to the planet the faster it goes, as if the pointer's pull were the planet's; leave and it
 * coasts to a stop where it is. The planet takes the bright edge when the pointer is on it. The read-out says how long
 * an orbit takes at this speed; the slider is how strong the pull is.
 *
 * The planet is a circle, its bands the near halves of rings of latitude; the rings and the orbit are rings in tilted
 * planes, their far halves painted before the planet and their near halves after; the moon is a small circle, painted
 * before or after by which side it is on. The pointer is read against the planet's centre on screen.
 */
const { Cam, clamp, fit, mk, open, poly, proj, rad, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const R = 10, RING = [13.5, 15.6, 18.5], ORBIT = 26, MOON = 2.2;
const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k);
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** The two unit axes of the plane square to n. */
const axes = (n) => { const U = norm(cross(Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], n)); return [U, cross(n, U)]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let pull = value;
  const C = Cam(45, 0.5, 5.2);
  const ringN = norm([0.3, -0.3, 1]), orbitN = norm([-0.12, 0.2, 1]);
  const [oU, oV] = axes(orbitN);
  fit(C, [[-ORBIT, -ORBIT, 0], [ORBIT, ORBIT, 0], [ORBIT, -ORBIT, 0], [-ORBIT, ORBIT, 0], [0, 0, R], [0, 0, -R]], 200, 160);
  const P = proj(C), O = P(0, 0, 0);
  // how big a unit is on screen, and which way is toward you: the direction that projects to a point
  let scale = 0, eye = [0, 0, 1], best = 1e9;
  for (let i = 0; i <= 90; i++) for (let j = 0; j < 72; j++) {
    const e = rad(i), a = rad(j * 5), u = [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)], q = P(...u), l = Math.hypot(q[0] - O[0], q[1] - O[1]);
    scale = Math.max(scale, l); if (l < best) { best = l; eye = u; }
  }
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const moonBack = el("sil"), orbitBack = el("nf dash"), ringBack = el("nf"), planet = el("sil"), bands = el("nf"), ringFront = el("nf"), orbitFront = el("nf dash"), moonFront = el("sil");
  const circle = (c, r, n = 64) => poly(Array.from({ length: n }, (_, k) => [c[0] + r * Math.cos((k / n) * 2 * Math.PI), c[1] + r * Math.sin((k / n) * 2 * Math.PI)]));
  /** A ring of world points split into the runs nearer you (front) and further (back), each as open paths. */
  const halves = (pts, test) => {
    const out = { front: [], back: [] }; let run = [], side = null;
    pts.concat([pts[0]]).forEach((p) => { const s = test(p) ? "front" : "back"; if (s !== side && run.length) { out[side].push(open(run.concat([P(...p)]))); run = []; } side = s; run.push(P(...p)); });
    if (run.length > 1) out[side].push(open(run));
    return { front: out.front.join(""), back: out.back.join("") };
  };
  const ringPts = (n, U, V, r, k = 96) => Array.from({ length: k }, (_, i) => { const t = (i / k) * 2 * Math.PI; return add(U.map((x) => x * r * Math.cos(t)), V, r * Math.sin(t)); });

  planet.setAttribute("d", circle(O, R * scale));
  // the bands: rings of latitude, only where they face you
  bands.setAttribute("d", [-0.62, -0.25, 0.12, 0.45].map((s) => halves(Array.from({ length: 64 }, (_, i) => { const t = (i / 64) * 2 * Math.PI, c = Math.sqrt(1 - s * s) * R; return [c * Math.cos(t), c * Math.sin(t), s * R]; }), (p) => dot(p, eye) > 0).front).join(""));
  // the rings: what is in front of the planet, or out beside it, is drawn after it
  const [rU, rV] = axes(ringN), front = (p) => dot(p, eye) > 0;
  const rs = RING.map((r) => halves(ringPts(ringN, rU, rV, r), front));
  ringBack.setAttribute("d", rs.map((h) => h.back).join("")); ringFront.setAttribute("d", rs.map((h) => h.front).join(""));
  const ob = halves(ringPts(orbitN, oU, oV, ORBIT), front);
  orbitBack.setAttribute("d", ob.back); orbitFront.setAttribute("d", ob.front);

  const speed = spring(0, { k: 6, c: 5, eps: 0.002 });
  let th = rad(-30);
  function draw() {
    const m = add(oU.map((x) => x * ORBIT * Math.cos(th)), oV, ORBIT * Math.sin(th)), q = P(...m), d = circle(q, MOON * scale, 28);
    const inFront = dot(m, eye) > 0;
    moonFront.setAttribute("d", inFront ? d : ""); moonBack.setAttribute("d", inFront ? "" : d);
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(speed, dt); if (!reducedMotion()) th += speed.x * dt; draw(); return m || speed.x > 0.002; });
  bag.add(B.unregister);

  function point(q) {
    let lit = false;
    if (q) {
      // the pull: strongest with the pointer on the planet, weakest at the orbit's edge and beyond
      const d = Math.hypot(q[0] - O[0], q[1] - O[1]) / scale, f = clamp(1 - (d - R) / (ORBIT * 1.2 - R), 0, 1);
      speed.t = 0.5 * (1 + pull * f);
      lit = d < R;
      read.textContent = `orbit · ${((2 * Math.PI) / speed.t).toFixed(1)} s`;
    } else { speed.t = 0; read.textContent = "rest"; }
    planet.classList.toggle("hi", lit);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pull = v; }, destroy: bag.dispose };
}

hairline({
  name: "planet",
  means: "A ringed planet and its moon: bring the pointer near and the moon orbits, faster the nearer you are to the planet; leave and it stops.",
  rules: [1, 2, 7, 9],
  range: [1, 3, 6],
  mount,
});
