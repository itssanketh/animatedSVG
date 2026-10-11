/**
 * CPU: a processor and its socket on a patch of motherboard: the socket's frame with its field of pins, the retention bracket and
 * its lever, and the processor held above it, its green substrate, the metal lid on top with the notch in its corner. Bring the
 * pointer near and it is installed: the processor lowers into the socket, the bracket closes over it and the lever swings down to
 * lock, and then it boots, its eight cores lighting up under the lid one after another. Leave and the lever lifts, the bracket opens
 * and the processor rises out again. The lid takes the bright edge once it is seated. The read-out says how far it has got. The
 * slider is the number of cores.
 *
 * Every part is a prism of a rounded ring, a silhouette and one crease, painted from the far side to the near one; the pins are dots
 * and the cores small rings. The pointer is read against the socket's resting outline.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, hull, ringAt, poly, open, flatDot, place, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 1.2, b = 0.7) => [rrect(x0, y0, x1, y1, r, 4), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.2, r - b), 4)];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let cores = value;
  const C = Cam(45, 0.5, 4.2);
  fit(C, [[-26, -26, -2], [26, 26, -2], [26, -26, -2], [-26, 26, -2], [0, 0, 26]], 200, 178);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the board, with a few traces and capacitors round the socket
  put(solid(g), prism(P, front, ...blk(-26, -26, 26, 26, 2, 1), -2, 0));
  mk("path", { class: "nf lo", d: [[-24, -18, -18, -18], [-24, -14, -18, -14], [18, 22, 24, 22], [18, 18, 24, 18], [-14, 22, -14, 24], [-10, 22, -10, 24]].map(([a, b, c, d]) => open([P(a, b, 0), P(c, d, 0)])).join("") }, g);
  // the socket: its frame and its field of pins
  put(solid(g), prism(P, front, ...blk(-16, -16, 16, 16, 1.6, 1), 0, 1.6));
  const pins = []; for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) pins.push(flatDot(g, C, 0.32, "dot off"));
  const pinAt = (k) => [-11 + (k % 9) * 2.75, -11 + Math.floor(k / 9) * 2.75];
  pins.forEach((d, k) => place(d, P(...pinAt(k), 1.6)));
  // the processor: substrate, lid, cores; then the bracket and lever, which close over it
  const sub = solid(g), lid = solid(g), coreEls = Array.from({ length: 16 }, () => mk("path", { class: "nf" }, g)), notch = mk("path", { class: "nf lo" }, g);
  const bracket = mk("path", { class: "nf" }, g), lever = solid(g);
  const drop = tween(1), shut = tween(0);
  let lit = 0, on = false, t0 = 0;

  function draw(now) {
    const z = 1.6 + 14 * tval(drop, now), s = tval(shut, now);
    put(sub, prism(P, front, ...blk(-13, -13, 13, 13, 1, 0.6), z, z + 1.1));
    put(lid, prism(P, front, ...blk(-10, -10, 10, 10, 2, 0.8), z + 1.1, z + 2.8));
    const zt = z + 2.8, n = Math.round(cores), per = Math.ceil(Math.sqrt(n)), step = 14 / per;
    coreEls.forEach((e, k) => {
      if (k >= n) { e.setAttribute("d", ""); return; }
      const cx = -7 + step / 2 + (k % per) * step, cy = -7 + step / 2 + Math.floor(k / per) * step, h = step * 0.36;
      e.setAttribute("d", k < lit ? poly([P(cx - h, cy - h, zt), P(cx + h, cy - h, zt), P(cx + h, cy + h, zt), P(cx - h, cy + h, zt)]) : "");
    });
    notch.setAttribute("d", open([P(-12.5, 10, z + 1.1), P(-10, 12.5, z + 1.1)]));
    // the bracket: a frame hinged on the far edge, swung up open and down closed over the lid
    const ang = (1 - s) * 1.25, hz = 2.2, frame = [[-15, -15], [15, -15], [15, 15], [-15, 15]].map(([x, y]) => { const d = y + 15; return [x, -15 + d * Math.cos(ang), hz + d * Math.sin(ang)]; });
    bracket.setAttribute("d", poly(frame.map((p) => P(...p))) + poly(frame.map(([x, y, zz]) => [x * 0.8, -15 + (y + 15) * 0.8 + 3, zz]).map((p) => P(...p))));
    // the lever along the near side, swung from upright to lying down
    const la = (1 - s) * 1.45, end = [17.5, 15 - 26 * Math.cos(la), 1.6 + 26 * Math.sin(la)];
    put(lever, { sil: poly(hull([P(17, 15, 1.2), P(18.5, 15, 1.2), P(end[0] - 0.7, end[1], end[2]), P(end[0] + 0.8, end[1], end[2])])), crease: "" });
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => {
    const seated = on && tdone(drop, now) && tdone(shut, now);
    if (seated) { const want = Math.min(Math.round(cores), Math.floor((now - t0 - 1300) / 160)); if (want > lit) lit = want; }
    if (!on) lit = 0;
    draw(now);
    lid.sil.classList.toggle("hi", seated);
    read.textContent = !on ? (tdone(drop, now) ? "rest" : "lifting out") : !seated ? "installing" : lit < Math.round(cores) ? `booting · ${lit} of ${Math.round(cores)} cores` : `running · ${Math.round(cores)} cores`;
    return !tdone(drop, now) || !tdone(shut, now) || (on && lit < Math.round(cores));
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, rrect(-26, -26, 26, 26, 2, 4), 0), ...ringAt(P, rrect(-16, -16, 16, 16, 2, 4), 26)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) {
    const n = !!q && inside(q, outline), now = performance.now();
    if (n !== on) {
      on = n; t0 = now;
      if (n) { tset(drop, 0, now, 0); tset(shut, 1, now, 650); } else { tset(shut, 0, now, 0); tset(drop, 1, now, 450); }
    }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { cores = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "cpu",
  means: "A CPU and its socket: bring the pointer near and it drops in, the bracket and lever lock it down, and its cores light up one by one.",
  rules: [1, 2, 6, 8],
  range: [4, 8, 16],
  mount,
});
