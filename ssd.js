/**
 * SSD: an M.2 drive in its slot on a strip of motherboard: the slot connector at one end, the screw holding the other end down, and
 * on the drive's little board its controller, its cache chip and two flash chips, the gold contacts at its connector end. Bring the
 * pointer near and it is read and written: data streams along the drive as dots, in through the connector to the controller and out
 * to the flash chips and back, each chip lighting as it is reached. Leave and the stream stops. The chip being reached takes the
 * bright edge. The read-out gives the transfer speed. The slider is the speed, in gigabytes a second.
 *
 * Every part is a prism of a rounded ring, a silhouette and one crease, painted from the far side to the near one; the data are dots
 * running along the drive. The pointer is read against the drive's resting outline.
 */
const { Cam, fit, proj, facing, rrect, circ, prism, solid, put, hull, ringAt, open, poly, flatDot, place, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 0.8, b = 0.5) => [rrect(x0, y0, x1, y1, r, 4), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.1, r - b), 4)];
const X0 = -40, X1 = 40, W = 11, ZB = 3;
// the chips on the drive: name, footprint, height; the controller, cache and two flash chips, along the drive
const CHIPS = [{ name: "controller", box: [-26, -7, -12, 7], h: 1.6 }, { name: "cache", box: [-8, -5, -1, 5], h: 1.2 }, { name: "flash", box: [3, -8, 17, 8], h: 1.4 }, { name: "flash", box: [21, -8, 35, 8], h: 1.4 }];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let gbps = value;
  const C = Cam(45, 0.5, 3.8);
  fit(C, [[X0 - 12, -W - 6, -2], [X1 + 8, W + 6, -2], [X1 + 8, -W - 6, -2], [X0 - 12, W + 6, -2], [0, 0, 10]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  put(solid(g), prism(P, front, ...blk(X0 - 14, -W - 7, X1 + 9, W + 7, 2, 1), -2, 0));
  // the slot connector, the standoff with its screw, the drive's board and its contacts
  put(solid(g), prism(P, front, ...blk(X0 - 10, -W - 1, X0 + 1, W + 1, 1, 0.5), 0, ZB + 2.5));
  put(solid(g), prism(P, front, circ(3, 20).map((q) => ({ ...q, u: q.u + X1 + 2, v: q.v })), circ(2.4, 20).map((q) => ({ ...q, u: q.u + X1 + 2, v: q.v })), 0, ZB));
  put(solid(g), prism(P, front, ...blk(X0, -W, X1 + 4, W, 1.4, 0.6), ZB, ZB + 0.8));
  mk("path", { class: "nf lo", d: Array.from({ length: 12 }, (_, i) => { const y = -W + 1.5 + i * 1.75; return open([P(X0 + 1, y, ZB + 0.8), P(X0 + 4, y, ZB + 0.8)]); }).join("") }, g);
  put(solid(g), prism(P, front, circ(2.2, 16).map((q) => ({ ...q, u: q.u + X1 + 2, v: q.v })), circ(1.6, 16).map((q) => ({ ...q, u: q.u + X1 + 2, v: q.v })), ZB + 0.8, ZB + 2));
  // the traces between the chips, along which the data runs
  const zt = ZB + 0.8, PATH = [[X0 + 2, 0], [-26, 0], [-12, 0], [-8, 0], [-1, 0], [3, 0], [17, 0], [21, 0], [35, 0]];
  mk("path", { class: "nf lo", d: open(PATH.map(([x, y]) => P(x, y + 9.6, zt))) + open(PATH.map(([x, y]) => P(x, y - 9.6, zt))) }, g);
  const chips = CHIPS.map((c) => { const s = solid(g); put(s, prism(P, front, ...blk(...c.box), ZB + 0.8, ZB + 0.8 + c.h)); return { ...c, s }; });
  let on = false, last = 0, bits = [], lit = null, clock = 0;

  const B = register(stage, (dt, now) => {
    clock += dt;
    // a packet every so often, in along one lane and out along the other
    if (on && now - last > 600 / (gbps * 2)) {
      last = now;
      const out = Math.random() < 0.5, to = 2 + Math.floor(Math.random() * 2);
      bits.push({ lane: out ? -9.6 : 9.6, x: out ? (CHIPS[to].box[0] + CHIPS[to].box[2]) / 2 : X0 + 2, dir: out ? -1 : 1, end: out ? X0 + 2 : (CHIPS[to].box[0] + CHIPS[to].box[2]) / 2, to, dot: flatDot(g, C, 0.75, "dot") });
    }
    let reach = null;
    bits = bits.filter((b) => {
      b.x += b.dir * dt * (30 + gbps * 6);
      if ((b.dir > 0 && b.x >= b.end) || (b.dir < 0 && b.x <= b.end)) { b.dot.remove(); if (b.dir > 0) reach = chips[b.to]; return false; }
      if (b.x > -26 && b.x < -12) reach = reach || chips[0];
      place(b.dot, P(b.x, b.lane, zt + 0.3)); return true;
    });
    if (reach && reach !== lit) { if (lit) lit.s.sil.classList.remove("hi"); lit = reach; lit.s.sil.classList.add("hi"); }
    if (!on && !bits.length && lit) { lit.s.sil.classList.remove("hi"); lit = null; }
    read.textContent = on ? `${(gbps * (0.94 + 0.06 * Math.sin(clock * 3))).toFixed(1)} GB/s · ${lit ? lit.name : "idle"}` : bits.length ? "finishing" : "rest";
    return on || bits.length > 0;
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, rrect(X0 - 14, -W - 7, X1 + 9, W + 7, 2, 4), 0), ...ringAt(P, rrect(X0 - 14, -W - 7, X1 + 9, W + 7, 2, 4), 6)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) { on = !!q && inside(q, outline); B.wake(); }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gbps = v; }, destroy: bag.dispose };
}

hairline({
  name: "ssd",
  means: "An M.2 SSD: bring the pointer near and data streams along it to the controller and the flash chips, each lighting as it is reached.",
  rules: [1, 4, 7, 10],
  range: [3.5, 7, 14],
  mount,
});
