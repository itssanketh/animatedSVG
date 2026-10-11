/**
 * Turntable: a record player on its plinth, a platter with a record on it, grooves in four tracks round a label and a
 * spindle, and at the back corner the tonearm on its pivot, a counterweight behind, a headshell at its tip, resting on
 * its post. Bring the pointer over the record and it plays: the platter spins up, the tonearm swings across to the
 * groove under the pointer and lowers its needle onto it; move the pointer in or out and the arm follows to that track.
 * Leave and the arm lifts, swings back to its rest and the platter spins down and stops. The part under the pointer
 * takes the bright edge. The read-out says which track is playing; the slider is the speed, in revolutions a minute.
 *
 * Plinth, platter, posts and counterweight are rounded blocks and cylinders; the record is a thin disc, its grooves
 * and label open rings, its turning shown by a mark on the label; the arm is a slim band. The pointer is read on the
 * record's plane, and the hit test is the turntable at rest.
 */
const { Cam, circ, clamp, facing, fit, lerp, mk, open, poly, prism, proj, put, rings, spring, stepS, unproj, disposer, pointer, register, solid } = HL;

const PL = 4, PC = [-6, 0], PR = 15, REC = 14.2, TOP = PL + 2.2, PIV = [14, -11], ARM = 21.5, REST = Math.PI / 2 + 0.12;
const TRACKS = [13.6, 11.7, 9.8, 7.9, 6];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
/** Where the arm's tip is, at angle a round its pivot. */
const tip = (a) => [PIV[0] + ARM * Math.cos(a), PIV[1] + ARM * Math.sin(a)];
/** The arm's angle that puts its tip r from the record's centre: the tip sweeps inward as the angle grows. */
const angleFor = (r) => { let lo = REST, hi = REST + 1.6; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, t = tip(m); if (Math.hypot(t[0] - PC[0], t[1] - PC[1]) > r) lo = m; else hi = m; } return (lo + hi) / 2; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rpm = value;
  const C = Cam(45, 0.5, 5.2);
  fit(C, [[-24, -18, 0], [22, 18, 0], [-24, 18, 0], [22, -18, 0], [PIV[0], PIV[1], TOP + 6]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), at = (x, y, z) => P(x, y, z);
  const plinth = solid(g), platter = solid(g), record = solid(g);
  put(plinth, prism(P, front, ...rings(-24, -18, 22, 18, 3, 1.2), 0, PL));
  put(platter, prism(P, front, circ(PR, 64).map((q) => ({ u: q.u + PC[0], v: q.v + PC[1] })), circ(PR - 0.8, 64).map((q) => ({ u: q.u + PC[0], v: q.v + PC[1] })), PL, PL + 1.8));
  put(record, prism(P, front, circ(REC, 64).map((q) => ({ u: q.u + PC[0], v: q.v + PC[1] })), circ(REC - 0.3, 64).map((q) => ({ u: q.u + PC[0], v: q.v + PC[1] })), PL + 1.8, TOP));
  const ring = (r, z, n = 64) => circ(r, n).map((q) => at(q.u + PC[0], q.v + PC[1], z));
  const grooves = mk("path", { class: "nf" }, g), label = mk("path", { class: "nf" }, g), mark = mk("path", { class: "nf" }, g);
  // the grooves: fine rings in four bands, a plain gap between each track
  grooves.setAttribute("d", TRACKS.slice(0, 4).flatMap((r0, k) => [0.35, 0.8, 1.25].map((d) => poly(ring(r0 - d, TOP)))).join(""));
  label.setAttribute("d", poly(ring(4.4, TOP)) + poly(ring(0.5, TOP + 1.2, 16)));
  // the arm's furniture: the rest post, the pivot post, the counterweight
  const restPost = solid(g), pivot = solid(g);
  const rt = tip(REST);
  put(restPost, prism(P, front, circ(0.8, 16).map((q) => ({ u: q.u + rt[0], v: q.v + rt[1] + 1.6 })), circ(0.6, 16).map((q) => ({ u: q.u + rt[0], v: q.v + rt[1] + 1.6 })), PL, PL + 4.2));
  put(pivot, prism(P, front, circ(1.7, 24).map((q) => ({ u: q.u + PIV[0], v: q.v + PIV[1] })), circ(1.4, 24).map((q) => ({ u: q.u + PIV[0], v: q.v + PIV[1] })), PL, PL + 3.6));
  const arm = mk("path", { class: "sil" }, g), weight = mk("path", { class: "sil" }, g), head = mk("path", { class: "sil" }, g);

  const swing = spring(REST, { k: 60, c: 13, eps: 0.002 }), lift = spring(0, { k: 80, c: 16, eps: 0.002 }), speed = spring(0, { k: 9, c: 6, eps: 0.002 });
  let turn = 0, want = REST, on = false;
  /** A slim band between two screen points, w wide. */
  const band = (p, q, w) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, n = [-(q[1] - p[1]) / d * w, (q[0] - p[0]) / d * w]; return poly([[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]], [q[0] - n[0], q[1] - n[1]], [p[0] - n[0], p[1] - n[1]]]); };
  function draw() {
    // the record turning: a slot across the label and a short arc of shine on the grooves ride round with it
    const c = Math.cos(turn), s = Math.sin(turn), on2 = (r, a) => [PC[0] + r * Math.cos(turn + a), PC[1] + r * Math.sin(turn + a)];
    mark.setAttribute("d", open([at(PC[0] + 1.3 * c, PC[1] + 1.3 * s, TOP), at(PC[0] + 3.6 * c, PC[1] + 3.6 * s, TOP)]) + open(Array.from({ length: 9 }, (_, k) => at(...on2(10.6, Math.PI + 0.06 * k), TOP))));
    // the arm: from the pivot's top out to the headshell, its tip lowered onto the record by lift
    const a = swing.x, t = tip(a), zp = PL + 4.4, zt = lerp(PL + 5.4, TOP + 0.9, lift.x), back = [PIV[0] - 4.8 * Math.cos(a), PIV[1] - 4.8 * Math.sin(a)];
    weight.setAttribute("d", band(at(...back, zp), at(PIV[0] - 2.2 * Math.cos(a), PIV[1] - 2.2 * Math.sin(a), zp), 2.2));
    arm.setAttribute("d", band(at(PIV[0] - 5.2 * Math.cos(a), PIV[1] - 5.2 * Math.sin(a), zp), at(...t, zt), 0.9));
    const h = [Math.cos(a + 0.5), Math.sin(a + 0.5)], hs = [t[0] + 2.6 * h[0], t[1] + 2.6 * h[1]];
    head.setAttribute("d", band(at(t[0] - 0.4 * h[0], t[1] - 0.4 * h[1], zt), at(...hs, zt - 0.4), 1.9));
  }
  draw();
  const rest = [["arm", head], ["arm", arm], ["arm", weight], ["pivot", pivot.sil], ["record", record.sil], ["platter", platter.sil], ["plinth", plinth.sil]].map(([name, el]) => ({ name, el, ls: loops(el.getAttribute("d")) }));

  const B = register(stage, (dt) => {
    // the needle comes down only once the arm is over the groove, and lifts before the arm swings away
    lift.t = on && Math.abs(swing.x - want) < 0.03 ? 1 : 0;
    swing.t = !on && lift.x > 0.15 ? swing.x : want;
    const m = [stepS(swing, dt), stepS(lift, dt), stepS(speed, dt)].some(Boolean);
    turn += speed.x * (rpm / 60) * 2 * Math.PI * dt;
    draw();
    return m || speed.x > 0.002;
  });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    let track = 0;
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], TOP), r = Math.hypot(x - PC[0], y - PC[1]);
      on = r < PR + 6;
      if (on) { const rr = clamp(r, TRACKS[4] + 0.5, TRACKS[0] - 0.3); want = angleFor(rr); track = TRACKS.findIndex((t, k) => rr <= t && rr > TRACKS[k + 1]) + 1; }
    } else on = false;
    if (!on) want = REST;
    speed.t = on ? 1 : 0;
    read.textContent = on ? `playing · track ${track} · ${rpm} rpm` : "rest";
    const h = q ? rest.find((p) => inLoops(q, p.ls)) : null, el = h ? h.el : null;
    if (el !== lit) { if (lit) lit.classList.remove("hi"); lit = el; if (el) el.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rpm = v; }, destroy: bag.dispose };
}

hairline({
  name: "turntable",
  means: "A turntable: bring the pointer over the record and it spins and the tonearm drops onto the track beneath; leave and it lifts and stops.",
  rules: [1, 3, 7, 8],
  range: [33, 45, 78],
  mount,
});
