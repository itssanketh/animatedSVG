/**
 * Spinner: the little star Claude Code shows while it thinks, as one thick plate facing you. At rest it is the
 * eight-petalled star. Bring the pointer over it and it starts thinking: it rounds into lobes, sharpens to six points,
 * thins to eight arms, four arms, shrinks to a dot and grows back the same way, over and over, turning a little each
 * time, each shape melting into the next. Leave and it runs on to the star and stops. It takes the bright edge while the pointer is
 * on it. The read-out is what Claude Code says it is doing; the slider is the time per shape, in ms.
 *
 * The outline is a star in polar form, its radius at each angle set by the number of arms, how deep the gaps between
 * them go and how sharp the tips are; two shapes in turn are mixed angle by angle. The plate is the face turned away,
 * the sides, the face toward you. The hit test is a fixed circle round the largest shape.
 */
const { clamp, lerp, mk, poly, register, reducedMotion, disposer, pointer } = HL;

const K = 120, CX = 200, CY = 160, T = 9, M = 240;
// the shapes in turn, as · ✢ ✳ ✶ ✻ ✽: arms, the gaps' depth (0 none, 1 to the middle), the tips' sharpness, the size
const SHAPES = [[4, 0, 1, 0.16], [4, 0.78, 1.6, 0.95], [8, 0.86, 3.2, 1], [6, 0.7, 0.9, 0.95], [8, 0.68, 1.4, 1], [8, 0.42, 0.8, 0.92]];
const VERBS = ["Thinking", "Pondering", "Noodling", "Clauding", "Percolating", "Ruminating", "Musing", "Brewing"];
const LOOP = [4, 5, 4, 3, 2, 1, 0, 1, 2, 3], REST = 4;
const EASE = (u) => u * u * (3 - 2 * u);
/** A point on screen: (u, v) on the mark, d deep; the front leans down and left of the back. */
const S = (u, v, d) => [CX + u * K - (d - T / 2) * 0.7, CY - v * K + (d - T / 2) * 0.7];
/** The radius of a shape at angle a. */
const radius = ([n, gap, sharp, size], a) => size * (1 - gap * (1 - Math.abs(Math.cos((n * a) / 2)) ** sharp));

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let per = value;
  const g = mk("g", {}, svg);
  const away = mk("path", { class: "sil" }, g), side = mk("path", { class: "fo" }, g), toward = mk("path", { class: "sil" }, g);

  // step: how many shapes along the loop it has gone; it runs only while hovered, and on leave runs on to the dot
  let step = 0, on = false, last = performance.now(), spin = 0, verb = 0;
  function draw(now) {
    const dt = Math.min(now - last, 50); last = now;
    const k = Math.floor(step), atDot = LOOP[k % LOOP.length] === REST && step === k;
    let moving = false;
    if ((on || !atDot) && !reducedMotion()) {
      const before = k;
      step += dt / per; spin += (dt / per) * 0.35; moving = true;
      // leaving: stop at the next dot
      if (!on && Math.floor(step) !== before && LOOP[Math.floor(step) % LOOP.length] === REST) step = Math.floor(step);
      if (Math.floor(step) !== before && LOOP[Math.floor(step) % LOOP.length] === REST) verb = (verb + 1) % VERBS.length;
    } else if (reducedMotion()) step = on ? 3 : 0;
    const i = Math.floor(step), u = EASE(step - i), A = SHAPES[LOOP[i % LOOP.length]], Bs = SHAPES[LOOP[(i + 1) % LOOP.length]];
    const loop = Array.from({ length: M }, (_, j) => {
      const a = (j / M) * 2 * Math.PI, r = lerp(radius(A, a), radius(Bs, a), u), t = a + Math.PI / 2 + spin;
      return [r * Math.cos(t), r * Math.sin(t)];
    });
    const f = loop.map(([x, y]) => S(x, y, T)), b = loop.map(([x, y]) => S(x, y, 0));
    away.setAttribute("d", poly(b));
    side.setAttribute("d", f.map((q, j) => poly([q, f[(j + 1) % M], b[(j + 1) % M], b[j]])).join(""));
    toward.setAttribute("d", poly(f));
    read.textContent = on ? `${VERBS[verb]}…` : moving ? "done" : "rest";
    return moving;
  }
  draw(performance.now());

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  function point(q) {
    on = !!q && Math.hypot(q[0] - CX, q[1] - CY) < K * 1.1;
    toward.classList.toggle("hi", on);
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { per = clamp(v, 60, 1000); }, destroy: bag.dispose };
}

hairline({
  name: "spinner",
  means: "Claude Code's thinking star: hover it and it melts from shape to shape, petals to arms to a dot and back.",
  rules: [4, 7, 8, 10],
  range: [220, 360, 560],
  mount,
});
