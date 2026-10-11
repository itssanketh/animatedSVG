/**
 * HDD: a hard drive with its lid off: its case, the platter on its spindle with the data tracks on it, the actuator arm on its pivot
 * with the read head at its tip, the magnet block behind the pivot, and the connectors at the back. Bring the pointer over it and it
 * spins up: the platter turns, a mark on it going round, and the arm swings out from its park to put the head over the track under
 * the pointer, following it in and out as the pointer moves. Leave and the arm swings back to its park and the platter spins down.
 * The head takes the bright edge while it reads. The read-out gives the track and the speed. The slider is the speed, in thousands
 * of rpm.
 *
 * Every part is a prism of a rounded ring, a silhouette and one crease; the platter and its tracks are rings, the arm a plate turned
 * on its pivot. The track under the pointer is read on the platter's fixed plane.
 */
const { Cam, fit, proj, facing, rrect, circ, prism, solid, put, unproj, open, poly, hull, ringAt, spring, stepS, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 3, b = 1) => [rrect(x0, y0, x1, y1, r, 6), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.2, r - b), 6)];
const RP = 34, CXP = -8, CYP = 0, PIV = [36, 24], ARM = 46, ZP = 5;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let krpm = value;
  const C = Cam(45, 0.5, 2.9);
  fit(C, [[-46, -42, 0], [46, 42, 0], [46, -42, 0], [-46, 42, 0], [0, 0, 10]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  put(solid(g), prism(P, front, ...blk(-46, -42, 46, 42, 6, 1.6), 0, 4));
  put(solid(g), prism(P, front, ...blk(-46, 38, 20, 46, 1, 0.5), 0, 3));
  mk("path", { class: "nf lo", d: Array.from({ length: 14 }, (_, i) => open([P(-42 + i * 4, 46, 1.5), P(-40 + i * 4, 46, 1.5)])).join("") }, g);
  // the platter, its spindle and its tracks
  const disc = (r, n = 64) => Array.from({ length: n }, (_, i) => P(CXP + r * Math.cos((i / n) * 2 * Math.PI), CYP + r * Math.sin((i / n) * 2 * Math.PI), ZP));
  mk("path", { class: "", d: poly(disc(RP)) }, g);
  mk("path", { class: "nf lo", d: [30, 24, 18, 12].map((r) => poly(disc(r))).join("") }, g);
  put(solid(g), prism(P, front, circ(6, 24).map((q) => ({ ...q, u: q.u + CXP, v: q.v + CYP })), circ(5, 24).map((q) => ({ ...q, u: q.u + CXP, v: q.v + CYP })), ZP, ZP + 2));
  const mark = mk("path", { class: "nf" }, g);
  // the magnet block behind the pivot, the pivot, the arm and its head
  put(solid(g), prism(P, front, ...blk(28, 10, 44, 36, 4, 1), 4, 8));
  const arm = mk("path", { class: "sil" }, g), head = mk("path", { class: "sil" }, g);
  put(solid(g), prism(P, front, circ(4.5, 20).map((q) => ({ ...q, u: q.u + PIV[0], v: q.v + PIV[1] })), circ(3.6, 20).map((q) => ({ ...q, u: q.u + PIV[0], v: q.v + PIV[1] })), 8, 11));
  const PARK = Math.atan2(-30 - PIV[1], 44 - PIV[0]);
  const ang = spring(PARK, { k: 90, c: 14 }), spin = spring(0, { k: 3, c: 2.6 });
  let a = 0, on = false, track = 0;

  function draw() {
    // the arm: a tapered plate from the pivot to the head, turned to its angle
    const t = ang.x, u = [Math.cos(t), Math.sin(t)], n = [-u[1], u[0]], tip = [PIV[0] + u[0] * ARM, PIV[1] + u[1] * ARM];
    arm.setAttribute("d", poly([[PIV[0] + n[0] * 4, PIV[1] + n[1] * 4], [tip[0] + n[0] * 1.4, tip[1] + n[1] * 1.4], [tip[0] - n[0] * 1.4, tip[1] - n[1] * 1.4], [PIV[0] - n[0] * 4, PIV[1] - n[1] * 4]].map(([x, y]) => P(x, y, 9))));
    head.setAttribute("d", poly([[-2, -1.5], [2, -1.5], [2, 1.5], [-2, 1.5]].map(([x, y]) => P(tip[0] + u[0] * x + n[0] * y, tip[1] + u[1] * x + n[1] * y, 9.4))));
    mark.setAttribute("d", open([1, 0.6].map((r) => P(CXP + RP * r * Math.cos(a), CYP + RP * r * Math.sin(a), ZP))));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(ang, dt), stepS(spin, dt)].some(Boolean);
    a += dt * spin.x * krpm * 2;
    draw();
    head.classList.toggle("hi", on && Math.abs(ang.x - ang.t) < 0.05);
    read.textContent = spin.x > 0.02 ? `track ${track} · ${Math.round(spin.x * krpm * 1000)} rpm` : "rest";
    return m || spin.x > 0.003;
  });
  bag.add(B.unregister);

  function point(q) {
    const w = q ? unproj(C, q[0], q[1], ZP) : null;
    on = !!w && Math.abs(w[0]) < 48 && Math.abs(w[1]) < 44;
    if (on) {
      // the arm angle that puts the head at the pointer's distance from the spindle: on the head's arc, the point that far out
      const r = Math.max(10, Math.min(RP - 2, Math.hypot(w[0] - CXP, w[1] - CYP)));
      let best = ang.t, bd = 1e9;
      for (let k = 0; k <= 120; k++) { const t = PARK + (k / 120) * -1.6, tip = [PIV[0] + ARM * Math.cos(t), PIV[1] + ARM * Math.sin(t)], d = Math.abs(Math.hypot(tip[0] - CXP, tip[1] - CYP) - r); if (d < bd) { bd = d; best = t; } }
      ang.t = best; spin.t = 1; track = Math.round(((RP - r) / (RP - 10)) * 900 + 40);
    } else { ang.t = PARK; spin.t = 0; }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { krpm = v; }, destroy: bag.dispose };
}

hairline({
  name: "hdd",
  means: "A hard drive with its lid off: hover and the platter spins up and the arm swings the head to the track under the pointer.",
  rules: [1, 7, 8, 10],
  range: [5.4, 7.2, 10],
  mount,
});
