/**
 * Train: a toy train on a loop of track, laid out on the ground: an oval of two rails on their sleepers, a station platform along
 * the near straight, and a train of an engine, with its cab and its chimney, and two carriages. At rest it waits at the platform.
 * Bring the pointer near and it pulls away and runs round the loop, the carriages following the engine round the curves; leave
 * and it runs on to the station and brakes to a stop at the platform. The engine takes the bright edge while it runs. The
 * read-out gives the lap and the speed. The slider is its top speed, in units a second.
 *
 * The cars are prisms of rounded rectangles turned to the track's heading where they stand, painted from the far side to the near
 * one; the track is lines on the ground. The pointer is read against the layout's resting outline.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, open, poly, mk, register, pointer, disposer } = HL;

const RX = 34, RR = 22, LEN = 4 * RX + 2 * Math.PI * RR, STOP = 62;
/** where the track's middle line is at distance s along it, and its heading there */
function at(s) {
  s = ((s % LEN) + LEN) % LEN;
  const half = Math.PI * RR;
  if (s < 2 * RX) return { x: -RX + s, y: RR, h: 0 };
  s -= 2 * RX;
  if (s < half) { const a = Math.PI / 2 - s / RR; return { x: RX + RR * Math.cos(a), y: RR * Math.sin(a), h: -(s / RR) }; }
  s -= half;
  if (s < 2 * RX) return { x: RX - s, y: -RR, h: Math.PI };
  s -= 2 * RX;
  const a = -Math.PI / 2 - s / RR;
  return { x: -RX + RR * Math.cos(a), y: RR * Math.sin(a), h: Math.PI - s / RR };
}
/** a ring of samples turned by h and moved to (x, y) */
const place = (ring, x, y, h) => { const c = Math.cos(h), s = Math.sin(h); return ring.map((q) => ({ ...q, u: x + q.u * c - q.v * s, v: y + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })); };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let top = value;
  const C = Cam(45, 0.5, 2.55);
  fit(C, [[-RX - RR - 6, -RR - 8, 0], [RX + RR + 6, RR + 20, 0], [RX + RR + 6, -RR - 8, 0], [-RX - RR - 6, RR + 20, 0], [0, 0, 16]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the track: sleepers across, then the two rails
  const sleepers = [], rails = [[], []];
  for (let s = 0; s < LEN; s += 4) { const p = at(s), n = [-Math.sin(p.h), Math.cos(p.h)]; sleepers.push(open([P(p.x - n[0] * 5, p.y - n[1] * 5, 0), P(p.x + n[0] * 5, p.y + n[1] * 5, 0)])); }
  for (let s = 0; s <= LEN; s += 1.5) { const p = at(s), n = [-Math.sin(p.h), Math.cos(p.h)]; rails[0].push(P(p.x - n[0] * 3, p.y - n[1] * 3, 0.4)); rails[1].push(P(p.x + n[0] * 3, p.y + n[1] * 3, 0.4)); }
  mk("path", { class: "nf lo", d: sleepers.join("") }, g);
  mk("path", { class: "nf", d: poly(rails[0]) + poly(rails[1]) }, g);
  // the platform along the near straight
  const layer = mk("g", {}, g);
  // the platform is nearer than the track, so it is painted over the train
  put(solid(g), prism(P, front, rrect(-26, RR + 7, 36, RR + 16, 1.5, 4), rrect(-25, RR + 8, 35, RR + 15, 1, 4), 0, 3));
  // the train, engine first: each car's body, and the engine's cab and chimney
  const CARS = [
    { off: 0, body: [rrect(-9, -3.6, 9, 3.6, 1.6, 4), rrect(-8.2, -2.8, 8.2, 2.8, 1, 4)], h: 5, cab: [rrect(-9, -3.6, -2, 3.6, 1.2, 4), rrect(-8.3, -2.9, -2.7, 2.9, 0.8, 4)], chim: [rrect(4.5, -1.3, 7, 1.3, 1.2, 4), rrect(5, -0.8, 6.5, 0.8, 0.6, 4)] },
    { off: -21, body: [rrect(-9, -3.6, 9, 3.6, 1.6, 4), rrect(-8.2, -2.8, 8.2, 2.8, 1, 4)], h: 6.5 },
    { off: -41, body: [rrect(-9, -3.6, 9, 3.6, 1.6, 4), rrect(-8.2, -2.8, 8.2, 2.8, 1, 4)], h: 6.5 },
  ].map((c) => ({ ...c, solids: [solid(layer), c.cab ? solid(layer) : null, c.chim ? solid(layer) : null].filter(Boolean) }));
  let pos = STOP, v = 0, on = false, stopAt = null, laps = 0;

  function draw() {
    const items = CARS.map((c) => ({ c, p: at(pos + c.off) })).sort((a, b) => a.p.x + a.p.y - (b.p.x + b.p.y));
    items.forEach(({ c, p }) => {
      put(c.solids[0], prism(P, front, place(c.body[0], p.x, p.y, p.h), place(c.body[1], p.x, p.y, p.h), 1, 1 + c.h));
      if (c.cab) put(c.solids[1], prism(P, front, place(c.cab[0], p.x, p.y, p.h), place(c.cab[1], p.x, p.y, p.h), 1 + c.h, 1 + c.h + 4));
      if (c.chim) put(c.solids[2], prism(P, front, place(c.chim[0], p.x, p.y, p.h), place(c.chim[1], p.x, p.y, p.h), 1 + c.h, 1 + c.h + 3.5));
      c.solids.forEach((s) => layer.append(s.g));
    });
  }
  draw();

  const B = register(stage, (dt) => {
    let want = on ? top : 0;
    if (!on && stopAt !== null) {
      // brake so as to stop at the platform
      const left = stopAt - pos; want = left <= 0.05 ? 0 : Math.min(top, Math.sqrt(2 * 26 * left));
      if (left <= 0.05) { pos = stopAt; stopAt = null; }
    }
    v += Math.max(-26 * dt, Math.min(18 * dt, want - v));
    const before = Math.floor((pos - STOP) / LEN); pos += v * dt; if (Math.floor((pos - STOP) / LEN) > before) laps++;
    draw();
    read.textContent = v > 0.5 ? `lap ${laps + 1} · ${Math.round(v)} u/s` : on ? "starting" : "at the station";
    if (!on && v < 0.5 && stopAt === null) read.textContent = laps ? `back at the station · ${laps} laps` : "rest";
    return on || v > 0.01 || stopAt !== null;
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 20 && q[0] < 380 && q[1] > 60 && q[1] < 300;
    if (n && !on) { on = true; stopAt = null; laps = 0; }
    if (!n && on) { on = false; stopAt = STOP + Math.ceil((pos - STOP + 8) / LEN) * LEN; }
    CARS[0].solids[0].sil.classList.toggle("hi", on);
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v_) => { top = v_; }, destroy: bag.dispose };
}

hairline({
  name: "train",
  means: "A toy train on a loop of track: bring the pointer near and it pulls away round the loop; leave and it brakes to a stop at the station.",
  rules: [1, 6, 7, 9],
  range: [30, 45, 60],
  mount,
});
