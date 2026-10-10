/**
 * Google: the G as four ring segments and a bar, thick plates facing you, the seams between the segments where its four
 * colours meet. Bring the pointer over it and it plays the Google logo animation, frame for frame: the G leaves through
 * its own opening, the segments chasing one another round the ring and out at the top, the bar pulling back; four dots
 * drop in and pop up in a row; three of them swirl round and run into the ring, and the G is drawn back on, the
 * segments sliding round into place while the last dot slides in to become the bar. It goes round again for as long as
 * the pointer stays; leave and it hurries on to the whole G and stops. The part under the pointer takes the bright
 * edge. The read-out names the stage; the slider is the speed. A tribute: the mark belongs to Google.
 *
 * The timing is measured from the animation: where each seam stands, in degrees round the ring, every few frames, and
 * where each dot goes. Each part is an extruded plate: the face turned away, the sides, the face toward you.
 */
const { clamp, lerp, mk, poly, register, reducedMotion, disposer, pointer } = HL;

const K = 112, CX = 200, CY = 160, T = 8, RO = 1, RI = 0.587, LOOP = 364, HOLD = 220;
const S = (u, v, d) => [CX + u * K - (d - T / 2) * 0.7, CY - v * K + (d - T / 2) * 0.7];
const EASE = (u) => u * u * (3 - 2 * u);
/** A curve through [frame, value] keys, smooth between them, flat outside. */
const curve = (keys) => (f) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) if (f < keys[i + 1][0]) {
    const [t1, p1] = keys[i], [t2, p2] = keys[i + 1], p0 = (keys[i - 1] || keys[i])[1], p3 = (keys[i + 2] || keys[i + 1])[1], u = (f - t1) / (t2 - t1);
    return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
  }
  return keys[keys.length - 1][1];
};
const join = (a, b) => (f) => (f < 240 ? a(f) : b(f));
// the ring's window: where the bar meets it, and the opening at the top; angles clockwise from the right, outer edge and inner
const LO = [11.9, 20.4], HI = [313.1, 311.8];
// the seams, as their outer angle over time (drawn on, then off); each seam's inner end leans by its own few degrees
const SEAMS = {
  head: [join(curve([[152, 11.9], [156, 15], [160, 30], [164, 55], [168, 75], [172, 112], [176, 165], [180, 200], [184, 230], [188, 295], [192, 313.1]]), () => 313.1), -1.3],
  ry: [join(curve([[160, 11.9], [164, 20], [168, 50], [172, 100], [176, 150], [180, 160], [184, 164], [188, 172], [192, 207]]), curve([[256, 207], [260, 210], [264, 215], [268, 225], [272, 232], [276, 245], [280, 258], [284, 270], [288, 282], [292, 295], [296, 305], [300, 313.1]])), -7.6],
  yg: [join(curve([[166, 11.9], [172, 35], [176, 60], [180, 90], [184, 97], [188, 120], [192, 153]]), curve([[256, 153], [264, 160], [268, 162], [272, 165], [276, 172], [280, 180], [284, 190], [288, 200], [292, 210], [296, 222], [300, 235], [304, 245], [308, 255], [312, 265], [316, 280], [320, 292], [324, 303], [328, 313.1]])), 7.6],
  gb: [join(curve([[180, 11.9], [184, 14], [188, 40], [192, 47.8]]), curve([[288, 47.8], [292, 50], [296, 55], [300, 62], [304, 75], [308, 95], [312, 112], [316, 130], [320, 150], [324, 175], [328, 210], [332, 255], [336, 280], [340, 300], [344, 313.1]])), 7.1],
  tail: [join(() => 11.9, curve([[312, 11.9], [316, 14], [320, 20], [324, 30], [328, 50], [332, 80], [336, 120], [340, 165], [344, 235], [348, 285], [352, 313.1]])), 8.5],
};
const SEGS = [["the red", "ry", "head"], ["the yellow", "yg", "ry"], ["the green", "gb", "yg"], ["the blue", "tail", "gb"]];
const at = (r, a) => [r * Math.cos((a * Math.PI) / 180), -r * Math.sin((a * Math.PI) / 180)];
const arc = (r, a, b) => { const n = Math.max(1, Math.ceil(Math.abs(b - a) / 3)); return Array.from({ length: n + 1 }, (_, i) => at(r, a + ((b - a) * i) / n)); };
/** A ring segment between two seams at frame f, cut to the window; null when there is none of it. */
function segment(f, from, to) {
  const [fa, la] = SEAMS[from], [fb, lb] = SEAMS[to], a = fa(f), b = fb(f);
  const o1 = Math.max(a, LO[0]), o2 = Math.min(b, HI[0]), i1 = Math.max(a + la, LO[1]), i2 = Math.min(b + lb, HI[1]);
  if (Math.min(o2 - o1, i2 - i1) <= 0.2) return null;
  return arc(RO, o1, Math.max(o1, o2)).concat(arc(RI, Math.max(i1, i2), i1));
}
// the bar: from its left end to the ring, drawn out to the right, later pulled back to the right
const BAR = [-0.206, 0.183], barL = curve([[290, 0.016], [313, 0.7]]), barR = (f) => lerp(0.016, 0.97, EASE(clamp((f - 173) / 18, 0, 1)));
function bar(f) {
  if (f < 173 || f > 313) return null;
  const l = f < 240 ? 0.016 : barL(f), r = f < 240 ? barR(f) : 0.97;
  if (r - l < 0.02) return null;
  return [[l, BAR[1]], [r, BAR[1]], [r, BAR[0]], [l, BAR[0]]];
}
// the dots: where each drops in, and the path it takes to the ring
const DOT = 0.198, ROW = [-1.162, -0.387, 0.387, 1.162];
const POP = [[0, 35, 8, 24], [6, 39, 14, 27], [9, 42, 16, 31], [13, 49, 19, 37]];
const PATHS = [[[166, -1.162, 0], [180, 0.1, 0]], [[100.3, -0.387, 0], [128.5, -0.077, 0.711], [163, 0.76, -0.138]], [[100.7, 0.387, 0], [121.2, -0.02, -0.478], [135, -0.413, 0.312], [170, 0.766, -0.116]], [[105, 1.162, 0], [134, -0.02, -0.478], [146, -0.413, 0.312], [175, 0.777, -0.116]]];
const GONE = [182, 161, 171, 177];
function dot(k, f) {
  if (f >= GONE[k] || f < POP[k][2]) return null;
  const [p0, p1, s0, s1] = POP[k], sc = EASE(clamp((f - s0) / (s1 - s0), 0, 1)), drop = 0.305 * (1 - EASE(clamp((f - p0) / (p1 - p0), 0, 1)));
  let x = ROW[k], y = drop;
  const P = PATHS[k];
  for (let i = 0; i < P.length - 1; i++) if (f >= P[i][0]) { const u = EASE(clamp((f - P[i][0]) / (P[i + 1][0] - P[i][0]), 0, 1)); x = lerp(P[i][1], P[i + 1][1], u); y = lerp(P[i][2], P[i + 1][2], u); }
  return Array.from({ length: 32 }, (_, j) => [x + DOT * sc * Math.cos((j / 32) * 2 * Math.PI), y + DOT * sc * Math.sin((j / 32) * 2 * Math.PI)]);
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let speed = value;
  const g = mk("g", {}, svg);
  const plate = () => { const b = mk("g", {}, g); return { g: b, away: mk("path", { class: "sil" }, b), side: mk("path", { class: "fo" }, b), toward: mk("path", { class: "sil" }, b) }; };
  const parts = [...SEGS.map(([name]) => ({ name, el: plate() })), { name: "the bar", el: plate() }, ...ROW.map(() => ({ name: "a dot", el: plate() }))];
  function put(p, loop) {
    p.el.g.setAttribute("display", loop ? "inline" : "none");
    if (!loop) return;
    const fr = loop.map(([u, v]) => S(u, v, T)), bk = loop.map(([u, v]) => S(u, v, 0));
    p.el.away.setAttribute("d", poly(bk));
    p.el.side.setAttribute("d", fr.map((q, i) => poly([q, fr[(i + 1) % fr.length], bk[(i + 1) % fr.length], bk[i]])).join(""));
    p.el.toward.setAttribute("d", poly(fr));
  }
  const shape = (f) => [...SEGS.map(([, a, b]) => segment(f, a, b)), bar(f), ...ROW.map((_, k) => dot(k, f))];
  const show = (f) => shape(f).forEach((l, i) => put(parts[i], l));

  // f: the frame, at 60 a second; rest holds the whole G
  let f = HOLD, on = false, last = performance.now();
  const B = register(stage, () => {
    const now = performance.now(), dt = Math.min(now - last, 50); last = now;
    if (reducedMotion()) { f = HOLD; show(f); return false; }
    if (!on && f >= 192 && f < 252) { f = HOLD; show(f); read.textContent = "rest"; return false; }
    const was = f;
    f = (f + (dt / 1000) * 60 * speed * (on ? 1 : 3)) % LOOP;
    if (!on && was < 192 && f >= 192) f = HOLD;
    show(f);
    read.textContent = f < 100 ? "listening" : f < 192 ? "forming" : f < 252 ? "Google" : "unwinding";
    return true;
  });
  bag.add(B.unregister);
  show(f);

  // the hit test: the parts of the whole G at rest
  const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  const rest = shape(HOLD).map((l) => (l ? l.map(([u, v]) => S(u, v, T)) : null));
  let lit = -1;
  function point(q) {
    const was = on;
    on = !!q && Math.hypot(q[0] - CX, q[1] - CY) < K * 1.35;
    if (on && !was && f >= 192 && f < 252) f = 252;
    const k = q ? rest.findIndex((l) => l && inPoly(q, l)) : -1;
    if (k !== lit) { lit = k; parts.forEach((p, i) => p.el.toward.classList.toggle("hi", i === k)); }
    if (!on) read.textContent = f >= 192 && f < 252 ? "rest" : read.textContent;
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "google",
  means: "Google's G plays its logo animation: it slips out through its opening, four dots bounce in, swirl, and draw the G back.",
  rules: [1, 5, 7, 8],
  range: [0.7, 1, 1.4],
  mount,
});
