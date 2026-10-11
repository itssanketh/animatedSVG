/**
 * Dog: a flat line puppy, drawn face on, its outline measured off a reference drawing: a round head between two long
 * floppy ears, big round eyes, a white blaze and muzzle, a little nose and a w of a mouth, blushing cheeks, a collar,
 * sitting up, its outline divided by heavy lines as the drawing has it: two front legs meeting in a V between their
 * paws, a white bib, the paws and back feet cut off by curves with their toes, the right hip; its tail curls up on the
 * right with a tufted tip. At
 * rest it dozes: head low, ears hanging, eyes shut. Bring the pointer near and it wakes on the 700ms curve, ears
 * lifting, round eyes open with their pupils on the pointer, tail wagging, and its head follows the pointer on two
 * springs. At its head it is happy: eyes squeezed into arches, tongue out, head tilted, tail going faster. The
 * read-out names where it watches; the slider is how far the head can go. The hit test is the head's fixed centre.
 */
const {
  clamp, fillet, lerp, mk, open, place, pointer, poly, rad, reducedMotion, register,
  spring, stepS, tdone, tset, tval, tween, disposer,
} = HL;

// every point below is in the reference's pixels; img() scales them onto the stage
const PX = 1.08, OX = 180, OY = 182, HC = [168, 140], REST = [-10, -14];
const DIRS = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
const img = ([x, y]) => [200 + (x - OX) * PX, 166 + (y - OY) * PX];
/** A Catmull-Rom curve through points, sampled n steps a span; closed or open. */
function smooth(pts, closed, n = 8) {
  const m = pts.length, out = [], get = (i) => pts[closed ? (i + m) % m : clamp(i, 0, m - 1)];
  for (let i = 0; i < (closed ? m : m - 1); i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  if (!closed) out.push(pts[m - 1]);
  return out;
}
const turn = ([x, y], [cx, cy], a) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };

// the head: one wide dome over the tops of both ears, down under them, round under the chin to the collar; the
// ears cover its sides
const FACE = [[99, 93], [107, 81], [122, 71], [145, 65], [170, 63], [195, 66], [216, 72], [231, 82], [238, 92], [223, 108], [222, 150], [222, 182], [225, 190], [212, 196], [192, 201], [170, 204], [150, 203], [125, 197], [111, 190], [112, 150], [112, 108]];
// the ears, hanging from the dome: each drawn down its outer edge, round its tip and up its inner edge, open at the
// top where it grows out of the head; each turns about its root
const EARS = [
  { root: [108, 82], pts: [[99, 93], [87, 99], [77, 109], [70, 122], [66, 136], [64, 150], [67, 164], [74, 176], [84, 184], [96, 188], [106, 185], [112, 175], [114, 158], [114, 128], [115, 100], [117, 76]], dir: -1 },
  { root: [226, 80], pts: [[238, 92], [249, 99], [258, 111], [265, 125], [270, 140], [271, 155], [267, 168], [258, 178], [246, 185], [234, 185], [226, 178], [221, 161], [219, 130], [218, 100], [215, 74]], dir: 1 },
];
const MUZZLE = [[171, 138], [182, 143], [192, 152], [202, 162], [207, 175], [202, 188], [189, 197], [171, 200], [154, 197], [142, 187], [140, 174], [147, 162], [157, 150], [164, 141]];
const EYES = [[137, 151], [205, 148]], ER = 10;
const CHEEKS = [[127, 172], [216, 168]];
// the collar: a crescent hanging under the chin's curve, pointed at both ends where it goes round the neck
const COLLAR = [[[110, 190], [125, 197], [150, 203], [170, 204], [192, 201], [212, 196], [226, 190]], [[111, 198], [125, 205], [150, 211], [170, 213], [192, 210], [212, 204], [225, 198]]];
// the body, sitting, as one outline: from under the collar on the left, down the haunch, round the feet, up the right
// haunch to the collar
const BODY = [[110, 190], [111, 207], [112, 225], [112, 240], [109, 252], [106, 262], [103, 272], [101, 282], [104, 288], [115, 292], [135, 293], [155, 294], [172, 296], [190, 294], [210, 293], [230, 292], [250, 290], [260, 285], [263, 277], [262, 266], [259, 252], [255, 236], [247, 222], [236, 210], [226, 190]];
// and the lines that divide it, as heavy as the outline, as the drawing has them: the front legs' outer edges down to
// the ground, their inner edges meeting in a V between the paws, the white bib above, each front paw and back foot cut
// off its leg by a curve with a toe line, and the right hip sweeping round from the leg to the outline
const LINES = [
  [[110.5, 210], [117, 214], [122, 240], [126, 262], [129, 280], [131, 293]], [[238, 212], [227, 215], [220, 224], [219, 240], [217, 268], [216, 293]],
  [[146, 227], [150, 238], [158, 247]], [[196, 222], [194, 235], [187, 245], [184, 248]],
  [[158, 243], [165, 262], [172, 284], [172, 295]], [[181, 242], [178, 262], [172, 284]],
  [[131, 291], [136, 281], [142, 277.5], [151, 277], [162, 277.5], [168, 280], [172, 284]], [[172, 284], [176, 280], [182, 277.5], [195, 277.5], [202, 279], [206, 284], [208, 293]],
  [[157, 282], [157, 294]], [[186, 281], [186, 294]],
  [[104, 270], [109, 268], [118, 267.5], [125, 268], [127.5, 270]], [[112.5, 271], [112.5, 286]], [[121, 279], [121, 286]],
  [[217, 268], [229, 266.5], [239, 269], [245, 276], [250, 272], [256, 266]],
  [[220, 232], [232, 225], [242, 224.5], [251, 228], [256, 236], [259, 247], [260, 253]],
];
// the tail, from the right haunch curling up to its tip and back down
const TAIL = [[255, 224], [260, 222], [265, 219], [269, 212], [271, 204], [271, 197], [273, 192], [277, 190], [283, 191], [288, 196], [292, 204], [294, 211], [298, 214], [296, 222], [297, 231], [294, 239], [288, 245], [280, 250], [271, 254], [262, 257], [256, 256]], TAILROOT = [258, 240];
// the fur at its tip: two tufts
const TUFTS = [[[288, 226], [281, 233], [286, 238]], [[291, 242], [283, 246], [279, 248]]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const g = mk("g", {}, svg);
  const tailFill = mk("path", { class: "fo" }, g), tail = mk("path", { class: "sil nf" }, g);
  const tufts = mk("path", { class: "nf" }, g);
  const bodyFill = mk("path", { class: "fo" }, g), body = mk("path", { class: "sil nf" }, g), lines = mk("path", { class: "sil nf" }, g), pad = mk("circle", { r: 1.6, class: "dot m" }, g);
  const faceFill = mk("path", { class: "fo" }, g), face = mk("path", { class: "sil nf" }, g);
  // the collar: a filled crescent over the chin and the top of the body, so it hides where they meet
  const collarFill = mk("path", { class: "fo" }, g), collar = mk("path", { class: "sil nf" }, g);
  const muzzle = mk("path", { class: "nf" }, g), cheeks = mk("path", { class: "nf lo" }, g);
  const ears = EARS.map(() => ({ under: mk("path", { class: "fo" }, g), line: mk("path", { class: "sil nf" }, g) }));
  const rims = mk("path", { class: "nf" }, g), shut = mk("path", { class: "nf" }, g), mouth = mk("path", { class: "nf" }, g);
  const pupils = [0, 1].map(() => mk("circle", { r: ER * PX, class: "dot" }, g)), shine = [0, 1].map(() => mk("circle", { r: 3, class: "fo" }, g));
  const nose = mk("path", { class: "dot" }, g), tongueFill = mk("path", { class: "fo" }, g), tongue = mk("path", { class: "nf" }, g);

  // wake: asleep to awake; joy: awake to happy, while the pointer is at its head
  const yaw = spring(REST[0], { eps: 0.05 }), pitch = spring(REST[1], { eps: 0.05 }), wake = tween(0), joy = tween(0);
  let drawn = "", on = false;
  function draw(now) {
    const wk = tval(wake, now), jy = tval(joy, now);
    // awake, the tail wags, faster when happy; reduced motion keeps it still
    const wag = on && !reducedMotion() ? Math.sin((now / 1000) * 2 * Math.PI * (1.4 + jy * 1.6)) * wk : 0;
    const key = [yaw.x, pitch.x, wk, jy, wag].map((v) => v.toFixed(3)).join();
    if (key === drawn) return;
    drawn = key;

    const wagged = (p) => turn(p, TAILROOT, rad(wag * 14 - (1 - wk) * 10));
    const t = smooth(TAIL.map(wagged), false).map(img);
    tailFill.setAttribute("d", poly(t)); tail.setAttribute("d", open(t));
    tufts.setAttribute("d", TUFTS.map((l) => open(smooth(l.map(wagged), false).map(img))).join(""));

    // the head slides and tilts toward the pointer, the face a little further across it, as a turn would; asleep it hangs lower
    const sx = yaw.x * 0.2, sy = -pitch.x * 0.16 + (1 - wk) * 4, tilt = rad(yaw.x * 0.18 + jy * 7), c = Math.cos(tilt), s = Math.sin(tilt);
    const fx = yaw.x * 0.1, fy = -pitch.x * 0.09;
    const H = ([x, y]) => { const u = x - HC[0], v = y - HC[1]; return img([HC[0] + sx + u * c - v * s, HC[1] + sy + u * s + v * c]); };
    const Fc = ([x, y]) => H([x + fx, y + fy]);
    // each side of the body hangs from its own end of the collar, so outline and collar stay joined however the head turns
    const jaw = [[110, 190], [226, 190]].map((q) => { const a = img(q), b = H(q); return [b[0] - a[0], b[1] - a[1]]; });
    const neck = (p) => {
      const w = clamp((240 - p[1]) / 50, 0, 1), u = clamp((p[0] - 110) / 116, 0, 1), a = img(p);
      return [a[0] + lerp(jaw[0][0], jaw[1][0], u) * w, a[1] + lerp(jaw[0][1], jaw[1][1], u) * w];
    };
    const b = smooth(BODY, false).map(neck);
    bodyFill.setAttribute("d", poly(b)); body.setAttribute("d", open(b));
    place(pad, neck([238, 280]));
    lines.setAttribute("d", LINES.map((l) => open(smooth(l, false).map(neck))).join(""));

    const f = smooth(FACE, true).map(H);
    faceFill.setAttribute("d", poly(f)); face.setAttribute("d", poly(f));
    const band = smooth(COLLAR[0], false).concat(smooth(COLLAR[1], false).reverse()).map(H);
    collarFill.setAttribute("d", poly(band)); collar.setAttribute("d", poly(band));
    muzzle.setAttribute("d", poly(smooth(MUZZLE, true).map(Fc)));
    cheeks.setAttribute("d", CHEEKS.map(([x, y]) => poly(Array.from({ length: 20 }, (_, k) => Fc([x + 7 * Math.cos((k / 20) * 2 * Math.PI), y + 5.5 * Math.sin((k / 20) * 2 * Math.PI)])))).join(""));
    // the ears: asleep they hang in close; awake they lift out; happy they flap with the tail
    EARS.forEach((e, i) => {
      const a = rad(e.dir * (-3 * (1 - wk) + 2.5 * wk + jy * 2.5 + wag * jy * 3));
      const pts = smooth(e.pts.map((p) => turn(p, e.root, a)), false).map(H);
      ears[i].under.setAttribute("d", poly(pts)); ears[i].line.setAttribute("d", open(pts));
    });

    // awake, big round dark eyes with a fleck of light, looking at the pointer; happy, squeezed into arches; asleep, closed curves
    const awake = wk > 0.5, glad = jy > 0.5, lx = clamp(yaw.x / 25, -1, 1), ly = clamp(-pitch.x / 25, -1, 1);
    const arc = ([ex, ey], up) => open(smooth([-2, -1, 0, 1, 2].map((d) => [ex + d * 3.6, ey + (up ? 2 - 4.5 * (1 - (d / 2) ** 2) : 0.5 + 2.2 * (1 - (d / 2) ** 2))]), false).map(Fc));
    rims.setAttribute("d", "");
    shut.setAttribute("d", !awake ? EYES.map((e) => arc(e, false)).join("") : glad ? EYES.map((e) => arc(e, true)).join("") : "");
    EYES.forEach(([ex, ey], i) => {
      const p = [ex + lx * 1.6, ey + ly * 1.6];
      [pupils[i], shine[i]].forEach((el) => el.setAttribute("display", awake && !glad ? "inline" : "none"));
      place(pupils[i], Fc(p)); place(shine[i], Fc([p[0] - 3 + lx * 1.4, p[1] - 3.4 + ly * 1.4]));
    });
    nose.setAttribute("d", poly(fillet([[161, 161], [185, 160], [174, 172]].map(Fc), [4, 4, 3], 5)));
    // the w of a mouth under the nose, wider when happy; happy, the tongue hangs out of it
    const sm = 1 + jy * 0.3, my = 178;
    mouth.setAttribute("d", open([Fc([174, 172]), Fc([174, my])]) + open(smooth([[174 - 11 * sm, 183], [168, 183], [174, my]], false).map(Fc)) + open(smooth([[174, my], [180, 183], [174 + 13 * sm, 183]], false).map(Fc)));
    const tg = jy > 0.02 ? smooth([[169, 181], [168, 181 + 8 * jy], [174, 184 + 9 * jy], [180, 181 + 8 * jy], [179, 181]], false).map(Fc) : null;
    tongueFill.setAttribute("d", tg ? poly(tg) : ""); tongue.setAttribute("d", tg ? open(tg) + open([Fc([174, 182]), Fc([174, 181 + 6 * jy])]) : "");
  }
  draw(performance.now());
  // each part lights while the pointer is over it, tested against its outline at rest; the first that holds it wins
  const parts = [[ears[0].under, [ears[0].line]], [ears[1].under, [ears[1].line]], [faceFill, [face]], [bodyFill, [body]], [tailFill, [tail]]].map(([h, els]) => ({ ls: loops(h.getAttribute("d")), els }));
  let lit = null;
  const light = (p) => { const pt = (p && parts.find((x) => inLoops(p, x.ls))) || null; if (pt !== lit) { lit = pt; parts.forEach((x) => x.els.forEach((e) => e.classList.toggle("hi", x === pt))); } };

  const B = register(stage, (dt) => { const now = performance.now(); const m = [stepS(yaw, dt), stepS(pitch, dt)].some(Boolean); draw(now); return m || !tdone(wake, now) || !tdone(joy, now) || (on && !reducedMotion()); });
  bag.add(B.unregister);

  // the head's centre on screen never moves; the pointer is read against it
  const [hx, hy] = img(HC);
  function watch(p) {
    on = !!p;
    const near = on && Math.hypot(p[0] - hx, p[1] - hy) < 62, ty = on ? clamp((p[0] - hx) / 130, -1, 1) * reach : REST[0], tp = on ? clamp((hy - p[1]) / 110, -1, 1) * reach * 0.7 : REST[1];
    yaw.t = ty; pitch.t = tp;
    tset(wake, on ? 1 : 0, performance.now(), 0);
    tset(joy, near ? 1 : 0, performance.now(), 0);
    light(p);
    nose.setAttribute("class", on ? "dot m" : "dot");
    read.textContent = !on ? "rest" : near ? "happy" : Math.hypot(ty, tp / 0.7) < reach * 0.3 ? "watch" : "watch " + DIRS[(Math.round(Math.atan2(tp / 0.7, ty) / (Math.PI / 4)) + 8) % 8];
    B.wake();
  }
  watch(null);

  bag.add(pointer(stage, { move: watch, leave: () => watch(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "dog",
  means: "A puppy sitting up, dozing: bring the pointer near and it wakes, ears up, tail wagging, and watches; at its head it's happy.",
  rules: [1, 5, 8, 9],
  range: [15, 28, 40],
  mount,
});
