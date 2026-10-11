/**
 * Ramen: a bowl of ramen on the table: the bowl, its broth, the noodles curling in it, half a soft-boiled egg, a sheet of nori
 * standing at the back, a slice of narutomaki with its spiral, green onion, and a pair of chopsticks resting across the rim. Bring
 * the pointer near and the chopsticks dip in and lift a bundle of noodles high out of the broth, the strands hanging from them and
 * swinging, while the steam rises in curls off the bowl; leave and the noodles slip back and the chopsticks settle on the rim. The
 * chopsticks take the bright edge while they lift. The read-out says what is happening. The slider is how high the noodles go.
 *
 * The bowl is a solid whose rim is wider than its foot, its silhouette the hull of the two rings; the broth and what floats in it
 * are drawn on its surface, the chopsticks and noodles over it. The pointer is read against the bowl's resting outline.
 */
const { Cam, fit, proj, circ, hull, ringAt, poly, open, spring, stepS, mk, register, pointer, disposer } = HL;

const RT = 34, RF = 17, HB = 24, ZS = 22.5;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let high = value;
  const C = Cam(45, 0.5, 3.0);
  fit(C, [[-RT, -RT, 0], [RT, RT, 0], [RT, -RT, 0], [-RT, RT, 0], [0, 0, HB + 50]], 200, 180);
  const P = proj(C), g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const top = circ(RT, 64), foot = circ(RF, 40), at = (pts, z) => pts.map(([x, y]) => P(x, y, z));
  const ringPts = (r, n = 48, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
  // the table shadow, the bowl, its rim
  el("sil").setAttribute("d", poly(hull([...ringAt(P, foot, 0), ...ringAt(P, top, HB)])));
  el("").setAttribute("d", poly(at(ringPts(RT), HB)));
  el("nf lo").setAttribute("d", poly(at(ringPts(RT - 2.2), HB)));
  // the broth
  el("nf lo").setAttribute("d", poly(at(ringPts(RT - 3.5), ZS)));
  // the nori, standing at the back
  const nori = [[-14, -24], [8, -28]];
  el("sil").setAttribute("d", poly([P(nori[0][0], nori[0][1], ZS), P(nori[1][0], nori[1][1], ZS), P(nori[1][0] + 1, nori[1][1] - 1, ZS + 20), P(nori[0][0] + 1, nori[0][1] - 1, ZS + 18)]));
  // the noodles: wavy loops across the broth
  el("nf").setAttribute("d", [-6, 0, 6, 12].map((o, k) => open(Array.from({ length: 80 }, (_, i) => { const t = i / 79, x = -24 + t * 34 + 1.6 * Math.cos(t * 22 + k), y = o + 2.2 * Math.sin(t * 22 + k * 1.7); return P(x, y, ZS); }))).join(""));
  // the egg, halved, its yolk; the narutomaki and its spiral; green onion rings
  el("").setAttribute("d", poly(at(ringPts(8.5, 28, 14, -6), ZS + 0.6)));
  el("nf").setAttribute("d", poly(at(ringPts(4.4, 20, 14.5, -5.5), ZS + 0.7)));
  el("").setAttribute("d", poly(at(ringPts(7, 28, -6, 18), ZS + 0.6)));
  el("nf").setAttribute("d", open(Array.from({ length: 30 }, (_, i) => { const t = i / 29, a = t * 4 * Math.PI, r = 5.6 * (1 - t); return P(-6 + r * Math.cos(a), 18 + r * Math.sin(a), ZS + 0.7); })));
  el("nf lo").setAttribute("d", [[20, 10], [24, 14], [17, 16], [25, 6]].map(([x, y]) => poly(at(ringPts(1.6, 10, x, y), ZS + 0.6))).join(""));
  const steam = el("nf lo"), strands = el("nf"), sticks = [el("sil"), el("sil")];
  const lift = spring(0, { k: 50, c: 10 });
  let clock = 0, on = false;

  function draw() {
    const l = lift.x, sw = Math.sin(clock * 3) * 2 * l;
    // the chopsticks: resting across the rim, then dipped and lifted, tips together
    const tip = [6 + sw * 0.3, 2, ZS + 2 + l * high], base = [44 - 6 * l, -30 + 4 * l, HB + 2 + l * (high * 0.7)];
    [[-1.6, 0], [1.6, 1.4]].forEach(([o, s], k) => {
      const a = [tip[0] + o, tip[1] + o * 0.6 + s, tip[2]], b = [base[0] + o * 2.2, base[1] + o * 1.4 + s, base[2] + s * 0.5], w = 1.2;
      sticks[k].setAttribute("d", poly([P(a[0] - w, a[1] + w, a[2]), P(b[0] - w * 1.7, b[1] + w * 1.7, b[2]), P(b[0] + w * 1.7, b[1] - w * 1.7, b[2]), P(a[0] + w, a[1] - w, a[2])]));
    });
    // the noodles hanging from the tips down into the broth, swinging
    strands.setAttribute("d", l < 0.05 ? "" : [-3, -1, 1, 3].map((o, k) => open(Array.from({ length: 16 }, (_, i) => { const t = i / 15, z = tip[2] - (tip[2] - ZS) * t, wob = Math.sin(t * 5 + clock * 4 + k) * 1.2 * l; return P(tip[0] + o * t * 1.6 + wob + sw * (1 - t) * 0.5, tip[1] + o * 0.4 + wob * 0.5, z); }))).join(""));
    // steam: curls rising off the broth, livelier while the noodles are up
    steam.setAttribute("d", [-12, 0, 12].map((o, k) => open(Array.from({ length: 14 }, (_, i) => { const t = i / 13; return P(o - 4 + Math.sin(t * 5 + clock * 2 + k * 2) * (2 + 3 * t), o * 0.3 + 4, ZS + 8 + t * (22 + 14 * l)); }))).join(""));
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(lift, dt); if (on || m) clock += dt; draw(); read.textContent = on ? (lift.x > 0.8 ? "noodles up" : "lifting") : m ? "settling" : "rest"; return m || on; });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, foot, 0), ...ringAt(P, top, HB), ...ringAt(P, top, HB + 40)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) {
    const n = !!q && inside(q, outline);
    if (n !== on) { on = n; lift.t = n ? 1 : 0; sticks.forEach((s) => s.classList.toggle("hi", n)); }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { high = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "ramen",
  means: "A bowl of ramen: bring the pointer near and the chopsticks lift the noodles high out of the broth as the steam rises.",
  rules: [1, 6, 7, 8],
  range: [24, 34, 44],
  mount,
});
