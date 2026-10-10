/**
 * Spark: Claude's mark, twelve straight rays of uneven length round a solid middle, as one thick plate facing you.
 * Bring the pointer over it and it thinks, the way it does on claude.ai while Claude is answering: the mark turns, and
 * its rays draw in toward the middle and spring back out, one after another, the pull running round the ring twice a
 * turn. Leave and the rays grow back to full and it winds on round to where it started. The ray under the pointer
 * takes the bright edge. The read-out says it is thinking; the slider is how fast, as the time of one pull, in ms.
 * A tribute: the mark belongs to Anthropic.
 *
 * The outline is built each frame from the rays: each a centre line from the middle out, bent toward its tip, with
 * its two flanks and a round cap; the valleys between rays join them into one loop. The plate is the face turned
 * away, the sides, the face toward you. The pointer is read against the rays' resting angles.
 */
const { clamp, lerp, mk, poly, register, spring, stepS, reducedMotion, disposer, pointer } = HL;

const K = 128, CX = 200, CY = 156, T = 7, R0 = 0.2, W0 = 0.04, W1 = 0.086, NS = 9, NC = 7, SPIN = 0.0007, DRAW = 0.5;
// the rays, measured from the mark's outline: angle (degrees, counterclockwise from right) and tip radius (the mark is 1 across half)
const RAYS = [[177, 1.02], [145, 1.05], [116, 1.13], [82, 1.0], [50, 1.03], [11, 0.99], [-12, 1.0], [-41, 0.99], [-58, 0.96], [-94, 0.98], [-126, 0.98], [-148, 0.95]]
  .map(([a, r]) => ({ a: (a * Math.PI) / 180, r })).sort((x, y) => x.a - y.a);
const N = RAYS.length, TAU = 2 * Math.PI;
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
/** A point on screen: (u, v) on the mark, d deep; the front leans down and left of the back. */
const S = (u, v, d) => [CX + u * K - (d - T / 2) * 0.7, CY - v * K + (d - T / 2) * 0.7];

/** One ray's outline at a pose: its near flank out, the cap round the tip, its far flank back. */
function ray(k, rot, bend, reach) {
  const { a, r } = RAYS[k], R = r * (1 + reach) - W1, out = [], far = [];
  const at = (s) => { const t = a + rot + bend * s * s, d = R0 + (R - R0) * s; return [d * Math.cos(t), d * Math.sin(t), t + bend * s]; };
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, [x, y, t] = at(s), w = lerp(W0, W1, s), nx = -Math.sin(t), ny = Math.cos(t);
    out.push([x - nx * w, y - ny * w]); far.push([x + nx * w, y + ny * w]);
  }
  const [tx, ty, tt] = at(1);
  for (let i = 1; i < NC; i++) { const f = tt - Math.PI / 2 + (i / NC) * Math.PI; out.push([tx + W1 * Math.cos(f), ty + W1 * Math.sin(f)]); }
  return out.concat(far.reverse());
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let period = value;
  const g = mk("g", {}, svg);
  const away = mk("path", { class: "sil" }, g), side = mk("path", { class: "fo" }, g), toward = mk("path", { class: "sil" }, g), hot = mk("path", { class: "nf hi" }, g);

  // alive: 0 at rest, 1 while hovered; it eases in and out, and the clock runs only while it is above 0
  const alive = spring(0, { eps: 0.002 }), home = spring(0, { eps: 0.001 });
  let clock = 0, rot = 0, on = false, goal = null, lit = -1, last = performance.now();
  function draw(now) {
    const dt = Math.min(now - last, 50); last = now;
    let moving = stepS(alive, dt / 1000);
    if (alive.x > 0.001 && !reducedMotion()) { clock += dt; moving = true; }
    // turning while it thinks; let go, it winds on round to where it started
    if (on) { rot += dt * SPIN * alive.x; home.x = rot; home.v = 0; goal = null; } else { if (goal === null) goal = Math.ceil(rot / TAU - 1e-6) * TAU; home.t = goal; if (stepS(home, dt / 1000)) moving = true; rot = home.x; }
    // each ray draws in toward the middle and springs back out, the pull running round the ring
    const rays = RAYS.map((_, k) => ray(k, rot, 0, -DRAW * alive.x * (0.5 + 0.5 * Math.sin((clock / period) * TAU - (k / N) * TAU * 2))));
    const loop = rays.flat(), f = loop.map(([u, v]) => S(u, v, T)), b = loop.map(([u, v]) => S(u, v, 0)), sides = [];
    f.forEach((q, i) => { const j = (i + 1) % f.length; sides.push(poly([q, f[j], b[j], b[i]])); });
    away.setAttribute("d", poly(b)); side.setAttribute("d", sides.join("")); toward.setAttribute("d", poly(f));
    hot.setAttribute("d", lit < 0 ? "" : poly(rays[lit].map(([u, v]) => S(u, v, T))).replace(/Z$/i, ""));
    return moving;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  // the pointer, read against the rays at rest: the ray it is over lights
  const rest = RAYS.map((_, k) => ray(k, 0, 0, 0).map(([u, v]) => S(u, v, T)));
  function point(q) {
    on = !!q && Math.hypot(q[0] - CX, q[1] - CY) < K * 1.3;
    alive.t = on ? 1 : 0;
    lit = q ? rest.findIndex((l) => inPoly(q, l)) : -1;
    read.textContent = on ? "thinking" : "rest";
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { period = v; }, destroy: bag.dispose };
}

hairline({
  name: "spark",
  means: "Claude's spark as it thinks: hover it and it turns while its rays draw in and spring back out, one after another.",
  rules: [1, 4, 7, 8],
  range: [1700, 1200, 800],
  mount,
});
