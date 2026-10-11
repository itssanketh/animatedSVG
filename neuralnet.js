/**
 * Neural net: a small network drawn as the diagram is, four layers of nodes (4, 6, 6, 3) standing in columns left to right,
 * the weights between them. Bring the pointer over it and a forward pass runs: the input nodes nearest the pointer's height fire, and the signal moves
 * one layer at a time, each node pushing out toward you as far as it is activated, the weights that carry a strong signal standing out, until the
 * outputs light and the strongest one takes the bright edge. Move the pointer and the input changes, and the pass runs again.
 * Leave and the network goes quiet. The read-out gives the layer the pass has reached, then the winning output. The slider is
 * the time per layer, in ms.
 *
 * Drawn as the diagram is, the layers standing in columns facing you: each node a round plate, its back face, the strips round
 * its edge and its front face, pushed toward you as it fires; the weights run between the plates' fronts, under them. The input is
 * read from the pointer's height against the input nodes' resting places, which never move.
 */
const { mk, open, poly, tween, tset, tval, tdone, disposer, pointer, register } = HL;

const LAYERS = [4, 6, 6, 3], GAP = 92, ROW = 34, R = 11, T = 4, LIFT = 9;
// the nodes, layer by layer along x, spread along y
const NODES = LAYERS.flatMap((n, l) => Array.from({ length: n }, (_, j) => ({ l, j, x: l * GAP - ((LAYERS.length - 1) * GAP) / 2, y: (j - (n - 1) / 2) * ROW })));
const W = [];
// fixed weights between each pair of neighbouring layers, from a small seeded generator
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (let l = 0; l < LAYERS.length - 1; l++) W.push(Array.from({ length: LAYERS[l + 1] }, () => Array.from({ length: LAYERS[l] }, rnd)));
/** The forward pass for an input: each layer's activations, 0 to 1. */
function forward(input) {
  const acts = [input];
  W.forEach((m) => { const prev = acts[acts.length - 1]; acts.push(m.map((row) => 1 / (1 + Math.exp(-3 * row.reduce((s, w, k) => s + w * prev[k], 0))))); });
  return acts;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let step = value;
  // a point on screen: (x, y) in the diagram, d toward you, which moves it down and to the left
  const S = (x, y, d) => [200 + x * 0.98 - d * 0.6, 168 + y * 0.98 + d * 0.45];
  const g = mk("g", {}, svg), weak = mk("path", { class: "nf lo" }, g), strong = mk("path", { class: "nf" }, g);
  const disc = (n) => Array.from({ length: 28 }, (_, i) => [n.x + R * Math.cos((i / 28) * 2 * Math.PI), n.y + R * Math.sin((i / 28) * 2 * Math.PI)]);
  const nodes = NODES.map((n) => ({ ...n, back: mk("path", { class: "sil" }, g), side: mk("path", { class: "fo" }, g), face: mk("path", { class: "sil" }, g), tw: tween(0), ring: disc(n) }));
  const byL = LAYERS.map((_, l) => nodes.filter((n) => n.l === l));

  let acts = null, t0 = 0, lit = null;
  function draw(now) {
    const reached = acts ? Math.floor((now - t0) / step) : -1;
    let ws = "", wl = "";
    for (let l = 0; l < W.length; l++) W[l].forEach((row, j) => row.forEach((w, k) => {
      const a = byL[l][k], b = byL[l + 1][j];
      const seg = open([S(a.x, a.y, T + tval(a.tw, now)), S(b.x, b.y, T + tval(b.tw, now))]);
      if (acts && reached > l && Math.abs(w) * acts[l][k] > 0.45) ws += seg; else wl += seg;
    }));
    weak.setAttribute("d", wl); strong.setAttribute("d", ws);
    for (const n of nodes) {
      const d = tval(n.tw, now), r = n.ring;
      n.back.setAttribute("d", poly(r.map(([x, y]) => S(x, y, d))));
      n.side.setAttribute("d", r.map((p, i) => { const q = r[(i + 1) % r.length]; return poly([S(...p, d), S(...q, d), S(...q, d + T), S(...p, d + T)]); }).join(""));
      n.face.setAttribute("d", poly(r.map(([x, y]) => S(x, y, d + T))));
    }
    return reached;
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => {
    const reached = draw(now);
    if (acts) {
      for (let l = 0; l <= Math.min(reached, LAYERS.length - 1); l++) byL[l].forEach((n, j) => tset(n.tw, LIFT * acts[l][j], now, 0));
      const out = acts[LAYERS.length - 1], best = out.indexOf(Math.max(...out)), win = reached >= LAYERS.length - 1 ? byL[LAYERS.length - 1][best] : null;
      if (win !== lit) { if (lit) lit.face.classList.remove("hi"); lit = win; if (win) win.face.classList.add("hi"); }
      read.textContent = win ? `output ${best + 1} · ${Math.round(out[best] * 100)}%` : `layer ${Math.max(1, reached + 1)} of ${LAYERS.length}`;
    }
    return (acts && reached < LAYERS.length) || nodes.some((n) => !tdone(n.tw, now));
  });
  bag.add(B.unregister);

  let lastIn = "";
  function point(q) {
    const now = performance.now(), on = !!q && Math.abs(q[0] - 200) < 175 && Math.abs(q[1] - 168) < 120;
    if (on) {
      // the inputs nearest the pointer's height fire
      const y = (q[1] - 168) / 0.98, input = byL[0].map((n) => Math.max(0, 1 - Math.abs(n.y - y) / 40)), key = input.map((v) => v.toFixed(1)).join();
      if (key !== lastIn) { lastIn = key; acts = forward(input); t0 = now; nodes.forEach((n) => tset(n.tw, 0, now, 0)); }
    } else if (acts) {
      acts = null; lastIn = ""; nodes.forEach((n) => tset(n.tw, 0, now, 0));
      if (lit) { lit.face.classList.remove("hi"); lit = null; }
      read.textContent = "rest";
    }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { step = v; }, destroy: bag.dispose };
}

hairline({
  name: "neuralnet",
  means: "A neural net: hover and a forward pass lights it layer by layer, strong weights standing out, until the winning output lights.",
  rules: [1, 2, 7, 8, 10],
  range: [420, 260, 140],
  mount,
});
