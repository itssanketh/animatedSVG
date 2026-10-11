/**
 * Shirayuki: Rukia's Sode no Shirayuki from Bleach, the white sword, held point up and out, its round open guard and
 * its long ribbon tied at the pommel. Its release is a dance: bring the pointer near and the ribbon flies out after it,
 * every length of it following the one before a moment late, so it ripples and curls through the air as you move,
 * twisting as it turns; leave and it falls and hangs still from the hilt again. The read-out names the dance; the slider
 * is how long the ribbon is.
 *
 * The blade, guard and hilt are closed shapes; the ribbon is a chain of points, each drawn toward the one before it,
 * the end of it toward the pointer or, at rest, straight down; it is drawn as a band whose width turns with a twist,
 * the flowing-cloth technique of anime motion.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const POM = [126, 180], DIR = [0.62, -0.78], TAU = 2 * Math.PI;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let len = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const ribbon = el("sil"), hilt = el("sil"), wrap = el("nf"), guard = el("sil"), blade = el("sil"), ridge = el("nf");
  const along = (s, o = 0) => [POM[0] + DIR[0] * s - DIR[1] * o, POM[1] + DIR[1] * s + DIR[0] * o];
  hilt.setAttribute("d", poly([along(0, -5), along(52, -5), along(52, 5), along(0, 5)]));
  wrap.setAttribute("d", Array.from({ length: 5 }, (_, i) => open([along(4 + i * 9.5, -5), along(13.5 + i * 9.5, 5)]) + open([along(4 + i * 9.5, 5), along(13.5 + i * 9.5, -5)])).join(""));
  // the guard: an open ring, square to the blade
  const ring = (r) => Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * TAU; return along(56 + 3 * Math.cos(t), r * Math.sin(t)); });
  guard.setAttribute("d", poly(ring(17)) + poly(ring(10).reverse()));
  blade.setAttribute("d", poly([along(58, -4.5), along(190, -3.5), along(204, 0), along(190, 3.5), along(58, 4.5)]));
  ridge.setAttribute("d", open([along(60, 1), along(194, 1)]));

  const N = 26;
  let pts = Array.from({ length: N }, (_, i) => [POM[0] - i * 2.5, POM[1] + i * 4.3]), vel = pts.map(() => [0, 0]), aim = null, clock = 0, seg = len / N;
  const on = spring(0, { k: 10, c: 6, eps: 0.002 });
  function draw() {
    // the band: the chain's line, widened square to itself, the width turning with a twist that runs along it
    const side = (sg) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = 5.6 * (0.25 + 0.75 * Math.abs(Math.cos(i * 0.35 - clock * 3 * on.x))) * (1 - 0.3 * (i / N)); return [p[0] - (dy / l) * w * sg, p[1] + (dx / l) * w * sg]; });
    ribbon.setAttribute("d", poly([...side(1), ...side(-1).reverse()]));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = stepS(on, dt);
    if (!reducedMotion()) clock += dt;
    // each link pulled toward its place a segment on from the one before; the last toward the pointer, or straight down
    const steps = Math.ceil(dt / 0.008), h = dt / steps;
    let moving = false;
    for (let s = 0; s < steps; s++) {
      pts[0] = [POM[0], POM[1]];
      for (let i = 1; i < N; i++) {
        const prev = pts[i - 1], p = pts[i];
        let want;
        if (aim) { const t = i / (N - 1), dx = aim[0] - POM[0], dy = aim[1] - POM[1], l = Math.hypot(dx, dy) || 1, wave = Math.sin(t * 6 - clock * 5) * 22 * t; want = [prev[0] + (dx / l) * seg - (dy / l) * wave * 0.08, prev[1] + (dy / l) * seg + (dx / l) * wave * 0.08]; }
        else want = [prev[0] - seg * 0.5 + Math.sin(i * 0.4) * 0.6, prev[1] + seg * 0.87];
        const ax = (want[0] - p[0]) * 260 - vel[i][0] * 26, ay = (want[1] - p[1]) * 260 - vel[i][1] * 26;
        vel[i][0] += ax * h; vel[i][1] += ay * h; p[0] += vel[i][0] * h; p[1] += vel[i][1] * h;
        // keep inside the stage
        p[0] = clamp(p[0], 6, 394); p[1] = clamp(p[1], 6, 314);
        if (Math.abs(vel[i][0]) + Math.abs(vel[i][1]) > 3) moving = true;
      }
    }
    draw();
    return m || moving || !!aim;
  });
  bag.add(B.unregister);

  function point(q) {
    aim = q ? [q[0], q[1]] : null; on.t = q ? 1 : 0;
    read.textContent = q ? "First Dance, Tsukishiro" : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { len = v; seg = len / N; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "shirayuki",
  means: "Rukia's Sode no Shirayuki: bring the pointer near and its long ribbon flies after it, rippling and twisting; leave and it hangs still.",
  rules: [1, 7, 8, 10],
  range: [100, 130, 160],
  mount,
});
