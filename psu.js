/**
 * PSU: a power supply: its box, the fan behind the round grille on its top, the vents and the power switch and socket on its back,
 * and the bundle of cables coming out of its side, each ending in its plug. Bring the pointer near and it is switched on: the switch
 * flips, the fan spins up behind the grille, and the cables give a little start as the power comes through them; the nearer the
 * pointer, the harder it works and the faster the fan. Leave and it switches off and the fan runs down. The switch takes the bright
 * edge while it is on. The read-out gives the load and the fan speed. The slider is its rated power, in watts.
 *
 * Every part is a prism of a rounded ring, a silhouette and one crease, painted from the far side to the near one; the grille and
 * the fan are lines on the top, the cables lines with plugs on their ends. The pointer is read against the box's resting outline.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, hull, ringAt, poly, open, spring, stepS, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 3, b = 1) => [rrect(x0, y0, x1, y1, r, 6), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.2, r - b), 6)];
const X = 30, Y = 28, H = 34, RF = 22;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let watts = value;
  const C = Cam(45, 0.5, 2.9);
  fit(C, [[-X - 30, -Y, 0], [X, Y + 20, 0], [X, -Y, 0], [-X - 30, Y + 20, 0], [0, 0, H + 4]], 200, 168);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the cables come out of the far side and lie on the desk; they are painted first
  const cables = mk("path", { class: "nf" }, g), plugs = mk("path", { class: "nf" }, g);
  put(solid(g), prism(P, front, ...blk(-X, -Y, X, Y, 3, 1.2), 0, H));
  // the back, facing you to the right: vents, the socket and the switch
  const back = (y, z) => P(X, y, z);
  mk("path", { class: "nf lo", d: Array.from({ length: 8 }, (_, i) => open([back(-Y + 6, 6 + i * 3.4), back(-2, 6 + i * 3.4)])).join("") + poly([back(4, 10), back(16, 10), back(16, 22), back(4, 22)]) + poly([back(7, 13), back(13, 13), back(13, 19), back(7, 19)]) }, g);
  const sw = mk("path", { class: "sil" }, g);
  // the grille on the top and the fan under it
  const ring = (r, n = 48) => Array.from({ length: n }, (_, i) => P(r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI), H));
  mk("path", { class: "", d: poly(ring(RF)) }, g);
  const blades = mk("path", { class: "nf lo" }, g);
  mk("path", { class: "nf", d: [RF, RF * 0.72, RF * 0.44].map((r) => poly(ring(r))).join("") + Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * 2 * Math.PI; return open([P(5 * Math.cos(a), 5 * Math.sin(a), H), P(RF * Math.cos(a), RF * Math.sin(a), H)]); }).join("") + poly(ring(5, 20)) }, g);
  const fan = spring(0, { k: 3, c: 2.6 }), kick = spring(0, { k: 60, c: 5 });
  let a = 0, on = false, load = 0;

  function draw() {
    blades.setAttribute("d", Array.from({ length: 9 }, (_, k) => { const a0 = a + (k / 9) * 2 * Math.PI; return open(Array.from({ length: 6 }, (_, i) => { const t = i / 5, r = 5.5 + t * (RF - 6.5), aa = a0 + t * 0.8; return P(r * Math.cos(aa), r * Math.sin(aa), H - 1.5); })); }).join(""));
    // the cables: six lines from the side wall out across the desk, each with a plug
    const k = kick.x;
    cables.setAttribute("d", Array.from({ length: 6 }, (_, i) => { const y0 = -14 + i * 5.6, end = [-X - 26 + (i % 2) * 6, y0 * 1.6 + 10, 0]; return open(Array.from({ length: 10 }, (_, j) => { const t = j / 9, s = Math.sin(Math.PI * t); return P(-X + (end[0] + X) * t, y0 + (end[1] - y0) * t + s * k * 3 * (i % 2 ? 1 : -1), 10 - 10 * t + s * 4 + s * k * 3); })); }).join(""));
    plugs.setAttribute("d", Array.from({ length: 6 }, (_, i) => { const y0 = -14 + i * 5.6, e = [-X - 26 + (i % 2) * 6, y0 * 1.6 + 10]; return poly([P(e[0] - 3, e[1] - 2, 0), P(e[0] + 1, e[1] - 2, 0), P(e[0] + 1, e[1] + 2, 0), P(e[0] - 3, e[1] + 2, 0)]); }).join(""));
    // the switch, rocked one way off and the other on
    const tilt = on ? 1 : -1;
    sw.setAttribute("d", poly([back(7.5, 14 + tilt), back(12.5, 14 + tilt), back(12.5, 18 - tilt), back(7.5, 18 - tilt)].map(([x, y], i) => [x + (i < 2 ? tilt * 1.2 : -tilt * 1.2) * 0.6, y])));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(fan, dt), stepS(kick, dt)].some(Boolean);
    a += dt * fan.x * 9;
    draw();
    sw.classList.toggle("hi", on);
    read.textContent = fan.x > 0.02 ? `load ${Math.round(load * watts)} W · fan ${Math.round(fan.x * 1500)} rpm` : "rest";
    return m || fan.x > 0.003;
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, rrect(-X - 30, -Y, X, Y + 20, 3, 6), 0), ...ringAt(P, rrect(-X, -Y, X, Y, 3, 6), H)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  const mid = P(0, 0, H / 2);
  function point(q) {
    const n = !!q && inside(q, outline);
    if (n && !on) { kick.x = 0; kick.v = 18; }
    on = n;
    load = n ? Math.max(0.35, Math.min(0.95, 1.05 - Math.hypot(q[0] - mid[0], q[1] - mid[1]) / 160)) : 0;
    fan.t = n ? 0.4 + 0.6 * load : 0;
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { watts = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "psu",
  means: "A power supply: bring the pointer near and it switches on, the fan spinning up and the cables starting; leave and it runs down.",
  rules: [1, 3, 7, 8],
  range: [550, 750, 1000],
  mount,
});
