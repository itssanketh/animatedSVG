/**
 * Astronaut: an astronaut out on a spacewalk in the white EVA suit, tethered to the hatch of a station module: the bubble helmet
 * with its visor and the two helmet lights, the life-support pack showing behind the shoulders, the hard upper torso with the
 * control box on the chest, the waist ring, the bulky arms and legs with rings at the joints, the gloves and the boots, the flag
 * on the shoulder. At rest it floats near the hatch, swaying a little, the tether hanging slack. Bring the pointer near and the
 * astronaut drifts toward it, as far as the tether lets it, leaning into the way it goes and reaching out; the tether pulls
 * straight as it pays out and goes slack again as it comes back. The suit takes the bright edge while the tether is taut. Leave
 * and it drifts back to the hatch. The read-out gives how much of the tether is out. The slider is the tether's length.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face, painted back to front; the limbs are tubes
 * round a bent middle line, as wide as the suit is there. The pointer is read against the hatch, which never moves.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const HX = 88, HY = 160, T = 3.5, K = 0.98;
const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const ell = (cx, cy, rx, ry, n = 32) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
/** a closed Catmull-Rom curve through the points */
const smooth = (ps, n = 5) => ps.flatMap((p, i) => { const q = ps[(i + 1) % ps.length], a = ps[(i - 1 + ps.length) % ps.length], b = ps[(i + 2) % ps.length]; return Array.from({ length: n }, (_, k) => { const t = k / n; return [0, 1].map((j) => 0.5 * (2 * p[j] + (q[j] - a[j]) * t + (2 * a[j] - 5 * p[j] + 4 * q[j] - b[j]) * t * t + (3 * p[j] - a[j] - 3 * q[j] + b[j]) * t * t * t)); }); });
/** a tube round a middle line: its outline, with each point as wide as w says, rounded at both ends */
function tube(mid, w) {
  const side = (sg) => mid.map((p, i) => { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [p[0] - (sg * w[i] * (b[1] - a[1])) / l / 2, p[1] + (sg * w[i] * (b[0] - a[0])) / l / 2]; });
  const end = (p, q, r) => { const d = [p[0] - q[0], p[1] - q[1]], l = Math.hypot(...d) || 1; return [p[0] + (d[0] / l) * r * 0.55, p[1] + (d[1] / l) * r * 0.55]; };
  return smooth([end(mid[0], mid[1], w[0] / 2), ...side(1), end(mid[mid.length - 1], mid[mid.length - 2], w[w.length - 1] / 2), ...side(-1).reverse()], 3);
}
/** a ring across a tube at point i of its middle line: a short line, slightly bowed, as the suit's joint rings are */
function ringAcross(mid, w, i) { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l], u = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], p = mid[i], r = w[i] / 2; return Array.from({ length: 7 }, (_, k) => { const t = -1 + k / 3; return [p[0] + n[0] * r * t + u[0] * 1.6 * (1 - t * t), p[1] + n[1] * r * t + u[1] * 1.6 * (1 - t * t)]; }); }

/** The suit, in its own frame with the chest at the origin, for a reach r from 0 to 1: its parts back to front. */
function suit(r) {
  const L = [[-12, 22], [-16, 40], [-18, 58], [-17, 70]], Lw = [19, 17, 15, 14];
  const R = [[12, 22], [17, 40], [20, 57], [21, 69]], Rw = [19, 17, 15, 14];
  // the left arm hangs, the right reaches out and up toward where it is going
  const LA = [[-25, -20], [-33, -4], [-36, 12], [-35, 22]], LAw = [16, 14, 12.5, 12];
  const RA = [[25, -20], [34 + 6 * r, -8 - 14 * r], [40 + 10 * r, 4 - 30 * r], [42 + 12 * r, 12 - 40 * r]], RAw = [16, 14, 12.5, 12];
  return [
    { name: "pack", loop: smooth([[-30, -46], [30, -46], [33, -40], [33, 8], [28, 13], [-28, 13], [-33, 8], [-33, -40]], 2), d: -3, marks: [] },
    { name: "leg", loop: tube(L, Lw), marks: [ringAcross(L, Lw, 1)], foot: L },
    { name: "leg", loop: tube(R, Rw), marks: [ringAcross(R, Rw, 1)], foot: R },
    { name: "boot", loop: smooth([[-27, 66], [-9, 66], [-7, 74], [-12, 80], [-28, 80], [-31, 73]], 2), d: 1, marks: [] },
    { name: "boot", loop: smooth([[12, 65], [30, 65], [33, 72], [30, 79], [14, 79], [10, 72]], 2), d: 1, marks: [] },
    { name: "trunk", loop: smooth([[-22, 6], [22, 6], [24, 24], [12, 30], [0, 26], [-12, 30], [-24, 24]], 3), d: 1, marks: [] },
    { name: "torso", loop: smooth([[-30, -34], [-18, -40], [18, -40], [30, -34], [30, -14], [24, 2], [22, 9], [-22, 9], [-24, 2], [-30, -14]], 3), d: 2,
      marks: [[[-22, 7], [22, 7]], [[-23, 3], [23, 3]], smooth([[-14, -24], [14, -24], [14, -8], [-14, -8]], 1).concat([[-14, -24]]),
        [[-8, -16], [-6, -16]], [[0, -16], [2, -16]], [[8, -16], [10, -16]], [[-20, -32], [-12, -32], [-12, -27], [-20, -27], [-20, -32]]] },
    { name: "arm", loop: tube(LA, LAw), d: 3, marks: [ringAcross(LA, LAw, 0), ringAcross(LA, LAw, 1), ringAcross(LA, LAw, 3)] },
    { name: "arm", loop: tube(RA, RAw), d: 3, marks: [ringAcross(RA, RAw, 0), ringAcross(RA, RAw, 1), ringAcross(RA, RAw, 3)] },
    { name: "glove", loop: ell(LA[3][0], LA[3][1] + 7, 6, 7.5, 20), d: 4, marks: [] },
    { name: "glove", loop: ell(RA[3][0] + 1, RA[3][1] - 6, 6.5, 7.5, 20), d: 4, marks: [] },
    { name: "helmet", loop: ell(0, -56, 21, 21, 40), d: 5,
      marks: [smooth([[-14, -66], [14, -66], [16, -54], [10, -44], [-10, -44], [-16, -54]], 4).concat([[-14, -66]]), [[-21, -64], [-25, -64], [-25, -56], [-21, -56]], [[21, -64], [25, -64], [25, -56], [21, -56]]] },
  ];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let len = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  // the station module and its hatch, at the left, never moving
  const plate = (loop, d0, d1) => { el("sil").setAttribute("d", poly(loop.map((p) => S(p, d0)))); el("fo").setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); el("sil").setAttribute("d", poly(loop.map((p) => S(p, d1)))); };
  plate([[14, 80], [62, 80], [76, 96], [76, 224], [62, 240], [14, 240]], 0, 10);
  plate(ell(HX - 20, HY, 13, 17), 10, 13);
  el("nf lo").setAttribute("d", [100, 120, 200, 220].map((y) => open([S([14, y], 10), S([68, y], 10)])).join(""));
  const tether = el("nf");
  const parts = suit(0).map(() => ({ back: el("sil"), side: el("fo"), face: el("sil"), marks: el("nf") }));
  const x = spring(HX + 92, { k: 18, c: 7 }), y = spring(HY - 6, { k: 18, c: 7 }), lean = spring(0, { k: 20, c: 7 }), reach = spring(0, { k: 30, c: 9 });
  let spin = 0;

  function draw() {
    const a = 0.12 * Math.sin(spin) + lean.x, c = Math.cos(a), s = Math.sin(a), at = ([px, py]) => [x.x + K * (px * c - py * s), y.x + K * (px * s + py * c)];
    // the tether: from the hatch to the clip at the waist, sagging when slack and pulled straight when taut
    const pack = at([-22, 8]), dist = Math.hypot(pack[0] - (HX - 10), pack[1] - HY), slack = Math.max(0, len * 1.05 - dist);
    const mid = [((HX - 10) + pack[0]) / 2, (HY + pack[1]) / 2 + slack * 0.45];
    tether.setAttribute("d", open(Array.from({ length: 20 }, (_, i) => { const t = i / 19; return S([(1 - t) ** 2 * (HX - 10) + 2 * (1 - t) * t * mid[0] + t * t * pack[0], (1 - t) ** 2 * HY + 2 * (1 - t) * t * mid[1] + t * t * pack[1]], 12); })));
    suit(reach.x).forEach((p, k) => {
      const e = parts[k], loop = p.loop.map(at), d0 = 14 + (p.d || 0), d1 = d0 + T;
      e.back.setAttribute("d", poly(loop.map((q) => S(q, d0))));
      e.side.setAttribute("d", loop.map((q, i) => { const r = loop[(i + 1) % loop.length]; return poly([S(q, d0), S(r, d0), S(r, d1), S(q, d1)]); }).join(""));
      e.face.setAttribute("d", poly(loop.map((q) => S(q, d1))));
      e.marks.setAttribute("d", p.marks.map((m) => open(m.map(at).map((q) => S(q, d1)))).join(""));
    });
    return dist / len;
  }
  draw();

  let on = false, taut = false;
  const B = register(stage, (dt) => {
    const m = [stepS(x, dt), stepS(y, dt), stepS(lean, dt), stepS(reach, dt)].some(Boolean);
    if (on) spin += dt * 0.9;
    const out = draw(), t = out > 0.95;
    if (t !== taut) { taut = t; [7].forEach(() => parts[6].face.classList.toggle("hi", t)); }
    read.textContent = on || m ? `tether ${Math.min(100, Math.round(out * 100))}%` : "rest";
    return m || on;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) {
      // as far toward the pointer as the tether reaches from the hatch
      const dx = q[0] - (HX - 10), dy = q[1] - HY, d = Math.hypot(dx, dy) || 1, r = Math.min(d, len), tx = (HX - 10) + (dx / d) * r, ty = HY + (dy / d) * r;
      lean.t = Math.max(-0.4, Math.min(0.4, (tx - x.x) * 0.004 + (ty - y.x) * 0.002)); reach.t = 1;
      x.t = Math.max(HX + 80, Math.min(330, tx)); y.t = Math.max(100, Math.min(215, ty));
    } else { x.t = HX + 92; y.t = HY - 6; lean.t = 0; reach.t = 0; }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { len = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "astronaut",
  means: "An astronaut in an EVA suit, tethered to a hatch: it drifts toward the pointer as far as the tether lets it, reaching out.",
  rules: [1, 3, 6, 8],
  range: [180, 230, 280],
  mount,
});
