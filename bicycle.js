/**
 * Bicycle: a road bicycle, side on: its two wheels with their tyres, rims, hubs and spokes, the diamond frame, the fork, the saddle
 * on its post, the drop handlebars, the chainring with its cranks and pedals and the chain running back to the rear cog. Bring the
 * pointer near and it is ridden: the cranks turn, the pedals staying level as they go round, the chain runs, the wheels spin up,
 * and speed lines stream behind; leave and it coasts to a stop, the wheels slowing. The chainring takes the bright edge while it is
 * pedalled. The read-out gives the speed. The slider is the cadence it is pedalled at, in turns a second.
 *
 * Every tube is a narrow plate along its line, its back face, the strips round its edge and its front face; the wheels are rings of
 * lines. The pointer is read against the bicycle's resting outline.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const ell = (cx, cy, r, n = 48) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
const RW = 56, BACK = [112, 214], FRONT = [292, 214], BB = [192, 218], SEAT = [172, 132], HEAD = [266, 136], HEADLO = [272, 160];
/** a straight tube from a to b, w wide, as a closed outline with rounded ends */
const tube = (a, b, w) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1, n = [-d[1] / l, d[0] / l], u = [d[0] / l, d[1] / l]; const cap = (p, s) => Array.from({ length: 7 }, (_, i) => { const t = s + (i / 6) * Math.PI, c = Math.cos(t), sn = Math.sin(t); return [p[0] + (n[0] * c + u[0] * sn) * (w / 2), p[1] + (n[1] * c + u[1] * sn) * (w / 2)]; }); return [...cap(b, -Math.PI / 2), ...cap(a, Math.PI / 2)]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let cadence = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = (loop, d0, d1, cls = "sil") => { el("sil").setAttribute("d", poly(loop.map((p) => S(p, d0)))); el("fo").setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); const f = el(cls); f.setAttribute("d", poly(loop.map((p) => S(p, d1)))); return f; };
  const lines = el("nf lo"), wheels = [el("nf"), el("nf")], spokes = [el("nf lo"), el("nf lo")], chain = el("nf lo");
  // the frame: the stays, the seat and down tubes, the top tube, the head tube and fork, the seat post and the stem
  [[BACK, BB, 4], [BACK, SEAT, 3.6], [BB, SEAT, 5.5], [BB, HEADLO, 6], [SEAT, HEAD, 5], [HEAD, HEADLO, 7], [HEADLO, FRONT, 4.5]].forEach(([a, b, w]) => plate(tube(a, b, w), 6, 9));
  plate(tube([172, 132], [168, 116], 4), 6, 9);
  plate([[150, 112], [184, 111], [190, 115], [170, 120], [152, 119], [146, 116]], 6, 10);
  plate(tube(HEAD, [262, 118], 5), 6, 9);
  // the drop bars, curling forward and down
  plate([...Array.from({ length: 14 }, (_, i) => { const a = -Math.PI / 2 + (i / 13) * Math.PI * 1.2; return [272 + 12 * Math.cos(a), 128 + 12 * Math.sin(a)]; }), ...Array.from({ length: 14 }, (_, i) => { const a = -Math.PI / 2 + (1 - i / 13) * Math.PI * 1.2; return [272 + 8 * Math.cos(a), 128 + 8 * Math.sin(a)]; }), [258, 120], [258, 116]], 7, 10);
  const ring = plate(ell(BB[0], BB[1], 15, 32), 10, 12), crank = el("sil"), pedals = [el("sil"), el("sil")], cog = el("nf");
  const spin = spring(0, { k: 6, c: 4 });
  let wheelA = 0, crankA = 0;

  function draw() {
    // the wheels: tyre and rim as two rings, the hub, and spokes that turn with the wheel
    [BACK, FRONT].forEach((c, k) => {
      wheels[k].setAttribute("d", poly(ell(c[0], c[1], RW).map((p) => S(p, 7.5))) + poly(ell(c[0], c[1], RW - 5).map((p) => S(p, 7.5))) + poly(ell(c[0], c[1], 4, 16).map((p) => S(p, 7.5))));
      spokes[k].setAttribute("d", Array.from({ length: 16 }, (_, i) => { const a = wheelA + (i / 16) * 2 * Math.PI, b = a + 0.5; return open([S([c[0] + 3.5 * Math.cos(a), c[1] + 3.5 * Math.sin(a)], 7.5), S([c[0] + (RW - 5) * Math.cos(b), c[1] + (RW - 5) * Math.sin(b)], 7.5)]); }).join(""));
    });
    cog.setAttribute("d", poly(ell(BACK[0], BACK[1], 7, 20).map((p) => S(p, 10))));
    chain.setAttribute("d", open([[BB[0], BB[1] - 15], [BACK[0], BACK[1] - 7]].map((p) => S(p, 11))) + open([[BB[0], BB[1] + 15], [BACK[0], BACK[1] + 7]].map((p) => S(p, 11))));
    // the cranks, opposite each other, and the pedals that stay level
    const ends = [0, Math.PI].map((o) => [BB[0] + 22 * Math.cos(crankA + o), BB[1] + 22 * Math.sin(crankA + o)]);
    crank.setAttribute("d", poly(tube(ends[0], ends[1], 4.5).map((p) => S(p, 13))));
    ends.forEach((e, k) => pedals[k].setAttribute("d", poly([[e[0] - 7, e[1] - 2], [e[0] + 7, e[1] - 2], [e[0] + 7, e[1] + 2], [e[0] - 7, e[1] + 2]].map((p) => S(p, k ? 8 : 15)))));
    // speed lines behind the rear wheel
    lines.setAttribute("d", spin.x < 0.15 ? "" : [150, 180, 210, 240].map((y, k) => { const l = 30 * spin.x * (0.6 + 0.4 * ((k * 7) % 3) / 2); return open([[44 - l, y], [44, y]].map((p) => S(p, 5))); }).join(""));
  }
  draw();

  let on = false;
  const B = register(stage, (dt) => {
    const m = stepS(spin, dt);
    crankA += dt * spin.x * cadence * 2 * Math.PI; wheelA += dt * spin.x * cadence * 2 * Math.PI * 2.4;
    draw();
    read.textContent = spin.x > 0.02 ? `${Math.round(spin.x * cadence * 2.4 * 2.1 * 3.6)} km/h` : "rest";
    return m || on || spin.x > 0.01;
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 40 && q[0] < 360 && q[1] > 90 && q[1] < 290;
    if (n !== on) { on = n; spin.t = n ? 1 : 0; ring.classList.toggle("hi", n); }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { cadence = v; }, destroy: bag.dispose };
}

hairline({
  name: "bicycle",
  means: "A road bicycle: bring the pointer near and it's ridden, the cranks turning and the wheels spinning up; leave and it coasts to a stop.",
  rules: [1, 7, 8, 9],
  range: [0.8, 1.2, 1.8],
  mount,
});
