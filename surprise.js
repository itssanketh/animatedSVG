/**
 * Surprise: a gift box tied with a ribbon, its lid sitting a little crooked.
 * Hover it and the lid flips up and back while a question mark, built as a
 * solid bent bar over a loose ball, springs out of it. The pop rides one spring,
 * softened from the default (k 170 · c 11) on purpose: the overshoot is the
 * surprise. The read-out says `pop`. The slider is how high it springs.
 *
 * The box is open, so it is drawn as Riffle's tray is: far walls, then what is
 * inside, then the near walls. The hit test is a static band over the box and
 * the space the mark pops into.
 */
const {
  Cam, clamp, facing, fit, hull, lerp, open, poly, proj, rad, ringAt, rrect, run, seg,
  spring, stepS, disposer, mk, pointer, reflect, register,
} = HL;

const B = 60, H = 40, WT = 2, OV = 2.5, LD = 8, LT = 2.5, RIB = 3.2;
const REST_TILT = 7, OPEN_TILT = 58, LIFT = 22, PHI = rad(-28), T = 4.2, G = 1.7;

/** The question mark's outline in its own plane, u across and v up: a bent bar, and a ball under it. */
function glyph() {
  const pts = [];
  for (let k = 0; k <= 16; k++) { const a = rad(158 - (k * 208) / 16); pts.push([9 * Math.cos(a), 29 + 9 * Math.sin(a)]); }
  pts.push([2.4, 18.2], [0.6, 15.2], [0, 12.6], [0, 11]);
  const h = 3, L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], n = Math.hypot(tx, ty);
    L.push([p[0] - (ty / n) * h, p[1] + (tx / n) * h]); R.push([p[0] + (ty / n) * h, p[1] - (tx / n) * h]);
  });
  const cap = (p, from, to) => {
    const a0 = Math.atan2(from[1] - p[1], from[0] - p[0]), out = [];
    for (let k = 1; k < 6; k++) { const a = a0 - (k * Math.PI) / 6; out.push([p[0] + h * Math.cos(a), p[1] + h * Math.sin(a)]); }
    return out;
  };
  const n = pts.length - 1;
  const bar = [...L, ...cap(pts[n], L[n], R[n]), ...R.reverse(), ...cap(pts[0], R[R.length - 1], L[0])];
  const ball = Array.from({ length: 20 }, (_, k) => [3.4 * Math.cos((k * Math.PI) / 10), 3.6 + 3.4 * Math.sin((k * Math.PI) / 10)]);
  return { bar, ball };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;

  const C = Cam(45, 0.5, 1.58);
  const U = [Math.cos(PHI), Math.sin(PHI)], N = [-Math.sin(PHI), Math.cos(PHI)];
  const top = (r, p) => H + 4 + r * p - 2;
  fit(C, [[-OV, -OV, 0], [B + OV, B + OV, 0], [B + OV, -OV, 0], [-OV, B + OV, 0], [B / 2, B / 2, top(16, 1.15) + 42 * G * 1.12], [B / 2 - 6, -OV - 30, H + LIFT * 1.2 + 40]], 200, 168);
  const P = proj(C), front = facing(C);

  // the box: far walls and the rim, then the mark, then the near walls with the ribbon down them
  const outer = rrect(0, 0, B, B, 4, 6), inner = rrect(WT, WT, B - WT, B - WT, 4 - WT, 6);
  const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());
  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, H)))), class: "sil" }, g);
  mk("path", { d: poly(ringAt(P, inner, H)), class: "nf" }, g);
  mk("path", { d: open(ringAt(P, run(inner, (q) => !front(q)), 2)), class: "nf lo" }, g);

  const mark = mk("g", {}, g);
  const back = mk("path", { class: "lo" }, mark), face = mk("path", { class: "sil" }, mark);
  const ballB = mk("path", { class: "lo" }, mark), ballF = mk("path", { class: "sil" }, mark);

  const iF = LR(ringAt(P, run(inner, front), H)), oT = LR(ringAt(P, run(outer, front), H)), oB = LR(ringAt(P, run(outer, front), 0));
  const near = mk("g", {}, g);
  mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, near);
  mk("path", { d: open(oT), class: "nf lo" }, near);
  mk("path", { d: open(iF), class: "nf" }, near);
  mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, near);
  mk("path", { d: [-RIB, RIB].flatMap((o) => [seg(P(B, B / 2 + o, 0), P(B, B / 2 + o, H)), seg(P(B / 2 + o, B, 0), P(B / 2 + o, B, H))]).join(""), class: "nf lo" }, near);

  // the lid: a shallow tray turned over, hinged on its back bottom edge
  const lid = mk("g", {}, g);
  const lsil = mk("path", { class: "sil hi" }, lid), lcr = mk("path", { class: "nf lo" }, lid), lrib = mk("path", { class: "nf lo" }, lid);
  // the bow, tied where the ribbons cross: two tails on the lid, two loops, the knot over their roots
  const tails = mk("path", { class: "" }, lid);
  const loops = [-1, 1].map(() => ({ back: mk("path", { class: "lo" }, lid), face: mk("path", { class: "sil" }, lid), hole: mk("path", { class: "nf lo" }, lid) }));
  const knot = mk("path", { class: "sil" }, lid), knotTop = mk("path", { class: "nf lo" }, lid);
  const BU = [Math.SQRT1_2, -Math.SQRT1_2], BN = [Math.SQRT1_2, Math.SQRT1_2];
  /** One loop of the bow in its own plane: s out from the knot, h up; pinched at the knot, tipped up. */
  const loop = (sg, k) => Array.from({ length: 28 }, (_, j) => {
    const t = (j / 28) * 2 * Math.PI, s0 = 8.5 + 8.5 * Math.cos(t + Math.PI), h0 = 5 * k * Math.sin(t) * Math.sqrt(s0 / 17);
    const a = rad(24);
    return [sg * (s0 * k + (1 - k) * 6) * Math.cos(a) - sg * 0 + 0, (s0 * k + (1 - k) * 6) * Math.sin(a) + h0 * Math.cos(a) + 1.5];
  });
  const lo = rrect(-OV, -OV, B + OV, B + OV, 5, 6), li = rrect(-OV + 1.6, -OV + 1.6, B + OV - 1.6, B + OV - 1.6, 3.4, 6);
  const z0 = H - LD + LT, z1 = H + LT;

  const pop = spring(0, { k: 170, c: 11 });
  let drawn = NaN, behind = false;
  function draw() {
    const p = pop.x;
    if (p === drawn) return;
    drawn = p;
    // lid: up and over first, the mark a beat behind it
    const lp = clamp(p * 1.5, 0, 1.2), t = rad(lerp(REST_TILT, OPEN_TILT, lp)), lift = LIFT * lp;
    const L = (x, y, z) => {
      const dy = y + OV, dz = z - z0;
      return P(x, -OV + dy * Math.cos(t) - dz * Math.sin(t), z0 + lift + dy * Math.sin(t) + dz * Math.cos(t));
    };
    const at = (ring, z) => ring.map((q) => L(q.u, q.v, z));
    lsil.setAttribute("d", poly(hull(at(lo, z0).concat(at(lo, z1)))));
    lcr.setAttribute("d", poly(at(li, z1)));
    const bow = (sv, h, d) => L(B / 2 + 1.5 * sv * BU[0] + d * BN[0], B / 2 + 1.5 * sv * BU[1] + d * BN[1], z1 + 1.5 * h);
    tails.setAttribute("d", [-1, 1].map((sg) => poly([[1.5, 3], [6.5, 3], [12, 24], [8.5, 20.5], [5.8, 25.5]].map(([a, dd]) => {
      const q = L(B / 2 + sg * a * BU[0] + dd * BN[0], B / 2 + sg * a * BU[1] + dd * BN[1], z1 + 0.3);
      return q;
    }))).join(""));
    loops.forEach((lp, i) => {
      const sg = i ? 1 : -1;
      lp.back.setAttribute("d", poly(loop(sg, 1).map(([sv, h]) => bow(sv, h, -1.6))));
      lp.face.setAttribute("d", poly(loop(sg, 1).map(([sv, h]) => bow(sv, h, 1.6))));
      lp.hole.setAttribute("d", poly(loop(sg, 0.55).map(([sv, h]) => bow(sv, h, 1.6))));
    });
    const kr = (z) => Array.from({ length: 16 }, (_, j) => { const a = (j / 16) * 2 * Math.PI; return L(B / 2 + 4.6 * Math.cos(a), B / 2 + 4.6 * Math.sin(a), z1 + z); });
    knot.setAttribute("d", poly(hull(kr(0).concat(kr(7.5)))));
    knotTop.setAttribute("d", poly(kr(7.5)));
    lrib.setAttribute("d", [-RIB, RIB].flatMap((o) => [seg(L(B / 2 + o, -OV, z1), L(B / 2 + o, B + OV, z1)), seg(L(-OV, B / 2 + o, z1), L(B + OV, B / 2 + o, z1))]).join(""));

    // the mark, standing in its own plane over the box's middle
    // it grows as it rises: small enough to hide in the box, big once out, a little bigger on the bounce
    const q = clamp(p * 1.25 - 0.15, -0.2, 1.15), zb = lerp(-3, top(rise, 1), q), sc = G * lerp(0.4, 1, clamp(q, 0, 1.12));
    const Q = ([u, v], d) => P(B / 2 + sc * (u * U[0] + d * N[0]), B / 2 + sc * (u * U[1] + d * N[1]), zb + sc * v);
    const { bar, ball } = GL;
    back.setAttribute("d", poly(bar.map((q) => Q(q, -T / 2))));
    face.setAttribute("d", poly(bar.map((q) => Q(q, T / 2))));
    ballB.setAttribute("d", poly(ball.map((q) => Q(q, -T / 2))));
    ballF.setAttribute("d", poly(ball.map((q) => Q(q, T / 2))));

    // once the lid has swung back past the mark, the mark is in front of it
    const b = lp > 0.45;
    if (b !== behind) { behind = b; if (b) mark.before(lid); else g.append(lid); }
  }
  const GL = glyph();
  draw();

  const Bk = register(stage, (dt) => { const m = stepS(pop, dt); draw(); return m; });
  bag.add(Bk.unregister);

  // hit band: from the box's foot up to the top of the popped mark, across the box
  const xl = P(-OV, B + OV, 0)[0], xr = P(B + OV, -OV, 0)[0];
  const yb = P(B + OV, B + OV, 0)[1] + 4, yt = P(B / 2, B / 2, top(16, 1) + 42 * G)[1] - 4;
  function hover(p) {
    const on = !!p && p[0] > xl && p[0] < xr && p[1] > yt && p[1] < yb;
    pop.t = on ? 1 : 0;
    lsil.classList.toggle("hi", !on); face.classList.toggle("hi", on); ballF.classList.toggle("hi", on);
    read.textContent = on ? "pop" : "rest";
    Bk.wake();
  }

  bag.add(pointer(stage, { move: hover, leave: () => hover(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { rise = v; drawn = NaN; draw(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "surprise",
  means: "A gift box with its lid askew: hover it and the lid flips back as a question mark springs out.",
  rules: [1, 5, 6, 10],
  range: [0, 8, 16],
  mount,
});
