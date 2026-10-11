/**
 * Motherboard: a motherboard lying on the desk with its parts in their places: the CPU socket with its retention frame, the VRM
 * heatsinks either side of it, four memory slots, two PCIe slots, the chipset heatsink, an M.2 slot with its drive, the 24-pin
 * power connector, the rear I/O block, the CMOS battery and a row of capacitors. Sweep the pointer across it and the part under it
 * lifts up off the board, takes the bright edge and is named in the read-out, settling back when the pointer moves on. The
 * slider is how high a part lifts.
 *
 * Every part is a prism of a rounded ring, a silhouette and one crease, on its own spring, painted from the far side to the near
 * one. The part under the pointer is read from the parts' resting footprints on the board's fixed plane.
 */
const { Cam, fit, proj, facing, rrect, circ, prism, solid, put, unproj, open, spring, stepS, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 1, b = 0.6) => [rrect(x0, y0, x1, y1, r, 4), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.2, r - b), 4)];
const disc = (x, y, r) => [circ(r, 18).map((q) => ({ ...q, u: q.u + x, v: q.v + y })), circ(r - 0.5, 18).map((q) => ({ ...q, u: q.u + x, v: q.v + y }))];
// the parts: name, footprint (x0, y0, x1, y1) or a round one (x, y, r), height
const PARTS = [
  { name: "rear I/O", box: [-48, -46, -36, -8], h: 12 },
  { name: "VRM heatsink", box: [-32, -46, -6, -38], h: 7 },
  { name: "VRM heatsink", box: [-32, -36, -26, -6], h: 7 },
  { name: "CPU socket", box: [-22, -34, 2, -10], h: 3 },
  { name: "memory slot", box: [8, -42, 10.5, -4], h: 4 }, { name: "memory slot", box: [12.5, -42, 15, -4], h: 4 },
  { name: "memory slot", box: [17, -42, 19.5, -4], h: 4 }, { name: "memory slot", box: [21.5, -42, 24, -4], h: 4 },
  { name: "24-pin power", box: [30, -26, 36, -8], h: 5 },
  { name: "M.2 drive", box: [-26, 0, 4, 5], h: 1.4 },
  { name: "PCIe slot", box: [-34, 10, 10, 13], h: 3 }, { name: "PCIe slot", box: [-34, 26, 10, 29], h: 3 },
  { name: "chipset", box: [16, 14, 30, 28], h: 5 },
  { name: "CMOS battery", disc: [24, 38, 4], h: 1.2 },
  ...[-8, -3, 2].map((x) => ({ name: "capacitor", disc: [x, -4, 1.6], h: 4 })),
  ...[18, 22, 26].map((y) => ({ name: "capacitor", disc: [36, y, 1.6], h: 4 })),
];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let lift = value;
  const C = Cam(45, 0.5, 2.7);
  fit(C, [[-50, -48, -2], [40, 46, -2], [40, -48, -2], [-50, 46, -2], [-48, -46, 12 + 14]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  put(solid(g), prism(P, front, ...blk(-50, -48, 40, 46, 2.5, 1), -2, 0));
  // traces on the board, and the screw holes
  mk("path", { class: "nf lo", d: [[[-6, -22], [8, -22]], [[-6, -18], [8, -18]], [[-10, 5], [-10, 10]], [[4, 2.5], [16, 2.5], [16, 14]], [[10, 20], [16, 20]], [[-40, 20], [-40, 36], [10, 36]]].map((l) => open(l.map(([x, y]) => P(x, y, 0)))).join("") + [[-46, -44], [36, -44], [-46, 42], [36, 42], [-8, 20]].map(([x, y]) => open(circ(1.2, 12).concat([circ(1.2, 12)[0]]).map((q) => P(x + q.u, y + q.v, 0)))).join("") }, g);
  const parts = PARTS.map((p) => ({ ...p, rings: p.box ? blk(...p.box) : disc(...p.disc), s: null, sp: spring(0), c: p.box ? [(p.box[0] + p.box[2]) / 2, (p.box[1] + p.box[3]) / 2] : [p.disc[0], p.disc[1]] }))
    .sort((a, b) => a.c[0] + a.c[1] - (b.c[0] + b.c[1]));
  parts.forEach((p) => { p.s = solid(g); });
  // the socket's pin field and the drive's chips, drawn on their tops
  const marks = mk("path", { class: "nf lo" }, g);

  function draw() {
    for (const p of parts) { const z = p.sp.x * lift; put(p.s, prism(P, front, p.rings[0], p.rings[1], z, z + p.h)); }
    const sock = parts.find((p) => p.name === "CPU socket"), m2 = parts.find((p) => p.name === "M.2 drive"), zs = sock.sp.x * lift + sock.h, zm = m2.sp.x * lift + m2.h;
    marks.setAttribute("d", open([[-18, -30], [-2, -30], [-2, -14], [-18, -14], [-18, -30]].map(([x, y]) => P(x, y, zs))) + [[-22, 0.8, -15, 4.2], [-12, 0.8, -6, 4.2], [-4, 0.8, 2, 4.2]].map(([a, b, c, d]) => open([[a, b], [c, b], [c, d], [a, d], [a, b]].map(([x, y]) => P(x, y, zm)))).join(""));
    // a lifted part is painted over the rest, and the marks over all
    parts.filter((p) => p.sp.x > 0.02).forEach((p) => g.append(p.s.g));
    g.append(marks);
  }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const p of parts) if (stepS(p.sp, dt)) m = true; if (m) { parts.forEach((p) => g.insertBefore(p.s.g, marks)); } draw(); return m; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    const w = q ? unproj(C, q[0], q[1], 0) : null;
    let p = null;
    if (w) {
      // the smallest part whose footprint holds the pointer, so a capacitor beats the board round it
      const hits = parts.filter((x) => (x.box ? w[0] > x.box[0] - 1 && w[0] < x.box[2] + 1 && w[1] > x.box[1] - 1 && w[1] < x.box[3] + 1 : Math.hypot(w[0] - x.disc[0], w[1] - x.disc[1]) < x.disc[2] + 1.5));
      p = hits.sort((a, b) => (a.box ? (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) : 10) - (b.box ? (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]) : 10))[0] || null;
    }
    if (p !== lit) { if (lit) lit.s.sil.classList.remove("hi"); lit = p; if (p) p.s.sil.classList.add("hi"); parts.forEach((x) => { x.sp.t = x === p ? 1 : 0; }); }
    read.textContent = p ? p.name : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { lift = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "motherboard",
  means: "A motherboard: sweep the pointer across it and the part under it, socket, slots, chipset or drive, lifts off the board and is named.",
  rules: [1, 4, 6, 10],
  range: [5, 9, 13],
  mount,
});
