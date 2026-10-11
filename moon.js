/**
 * Moon: the moon face on among a few stars, its craters drawn in, its night side shaded with fine lines and the
 * terminator, the edge between day and night, curving across it. At rest it is a waxing crescent. Move the pointer
 * across and you move through the month: from new moon at the left edge, through crescent, quarter and gibbous to full
 * in the middle, and back down through waning gibbous and quarter to a waning crescent at the right, the terminator
 * sweeping over the face as you go; leave and it eases back to its crescent. The read-out names the phase and how much
 * of the face is lit; the slider is how dense the shading is.
 *
 * The face is a circle and the craters smaller ones; the terminator is half an ellipse whose width is the cosine of the
 * phase, and the shading is level lines across the night side, between the terminator and the limb. The pointer's
 * place across the stage is the phase.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const CX = 200, CY = 160, R = 108, REST = 0.13, TAU = 2 * Math.PI;
const CRATERS = [[-0.35, 0.3, 0.16], [0.28, 0.42, 0.1], [0.4, -0.2, 0.18], [-0.15, -0.45, 0.12], [-0.55, -0.1, 0.08], [0.05, 0.05, 0.07], [0.6, 0.25, 0.06]];
const STARS = [[48, 52], [352, 70], [70, 270], [338, 262], [30, 160], [372, 168], [110, 30], [296, 296]];
const NAMES = [[0.03, "new moon"], [0.22, "waxing crescent"], [0.28, "first quarter"], [0.47, "waxing gibbous"], [0.53, "full moon"], [0.72, "waning gibbous"], [0.78, "last quarter"], [0.97, "waning crescent"], [1.01, "new moon"]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let gap = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const stars = el("nf"), face = el("sil"), craters = el("nf"), shade = el("nf lo"), term = el("nf");
  const circle = (c, r, n = 72) => poly(Array.from({ length: n }, (_, k) => [c[0] + r * Math.cos((k / n) * TAU), c[1] + r * Math.sin((k / n) * TAU)]));
  stars.setAttribute("d", STARS.map(([x, y], k) => { const s = k % 3 ? 3 : 5; return open([[x - s, y], [x + s, y]]) + open([[x, y - s], [x, y + s]]); }).join(""));
  face.setAttribute("d", circle([CX, CY], R, 120));
  craters.setAttribute("d", CRATERS.map(([u, v, r]) => circle([CX + u * R, CY - v * R], r * R, 28)).join(""));

  const phase = spring(REST, { k: 50, c: 14, eps: 0.0005 });
  /** The night side of the row at height y: from x0 to x1, measured from the centre. */
  const night = (y, p) => { const w = Math.sqrt(Math.max(0, R * R - y * y)), c = Math.cos(TAU * p); return p <= 0.5 ? [-w, w * c] : [-w * c, w]; };
  function draw() {
    const p = phase.x, rows = [];
    for (let y = -R + gap / 2; y < R; y += gap) { const [a, b] = night(y, p); if (b - a > 1.5) rows.push(open([[CX + a, CY + y], [CX + b, CY + y]])); }
    shade.setAttribute("d", rows.join(""));
    // the terminator: half an ellipse from pole to pole, bowed by the phase
    const t = Array.from({ length: 49 }, (_, k) => { const y = -R + (2 * R * k) / 48, [a, b] = night(y, p); return [CX + (p <= 0.5 ? b : a), CY + y]; });
    term.setAttribute("d", open(t));
    const lit = Math.round(((1 - Math.cos(TAU * p)) / 2) * 100), name = NAMES.find(([e]) => p < e)[1];
    return `${name} · ${lit}% lit`;
  }
  draw();

  let on = false;
  const B = register(stage, (dt) => { const m = stepS(phase, dt); const s = draw(); read.textContent = on ? s : "rest"; return m; });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    phase.t = q ? clamp((q[0] - 30) / 340, 0, 1) : REST;
    face.classList.toggle("hi", !!q && Math.hypot(q[0] - CX, q[1] - CY) < R);
    read.textContent = q ? draw() : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gap = v; draw(); }, destroy: bag.dispose };
}

hairline({
  name: "moon",
  means: "The moon: move the pointer across and it runs through its phases, new to full to new, the terminator sweeping over; leave and it waxes back.",
  rules: [1, 2, 7, 10],
  range: [11, 7, 4],
  mount,
});
