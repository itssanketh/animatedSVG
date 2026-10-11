/**
 * RAM: a memory stick and its slot on a strip of motherboard: the stick's board with its row of memory chips on its face, the gold
 * contacts along its bottom edge and the notch between them, and the slot with its latches open at both ends. Bring the pointer near
 * and it is fitted: the stick is pushed down into the slot, the latches swing up and clip onto its ends, and then it is detected,
 * its chips lighting one after another. Leave and the latches swing open and the stick rises out. The stick takes the bright edge
 * once it is seated. The read-out says how far it has got and the stick's size. The slider is its size, in gigabytes.
 *
 * The board and the slot are prisms of rounded rings, a silhouette and one crease; the slot's back rail is painted before the stick
 * and its front rail after, so the slot holds it. The pointer is read against the slot's resting outline.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, hull, ringAt, poly, open, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 0.6, b = 0.3) => [rrect(x0, y0, x1, y1, r, 4), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.1, r - b), 4)];
const HL_ = 44, ZS = 5, LIFT = 20, H = 22;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let gb = value;
  const C = Cam(45, 0.5, 3.3);
  fit(C, [[-HL_ - 6, -10, -2], [HL_ + 6, 10, -2], [HL_ + 6, -10, -2], [-HL_ - 6, 10, -2], [0, 0, ZS + LIFT + H]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  put(solid(g), prism(P, front, ...blk(-HL_ - 8, -12, HL_ + 8, 12, 2, 1), -2, 0));
  // the slot: its back rail, then the stick, then its front rail and the latches
  put(solid(g), prism(P, front, ...blk(-HL_ - 1, -2.6, HL_ + 1, -0.9), 0, ZS));
  const stick = solid(g), chips = mk("path", { class: "nf" }, g), lit = mk("path", { class: "nf" }, g), pins = mk("path", { class: "nf lo" }, g);
  put(solid(g), prism(P, front, ...blk(-HL_ - 1, 0.9, HL_ + 1, 2.6), 0, ZS));
  const latches = [-1, 1].map(() => mk("path", { class: "sil" }, g));
  const drop = tween(1), clip = tween(0);
  let on = false, t0 = 0, shown = 0;
  const N = 8;

  function draw(now) {
    const z = ZS - 3 + LIFT * tval(drop, now), c = tval(clip, now);
    put(stick, prism(P, front, ...blk(-HL_ + 1, -0.6, HL_ - 1, 0.6, 0.3, 0.15), z, z + H));
    const face = (x, zz) => P(x, 0.6, zz);
    // the chips on the stick's face, and the ones already lit
    const chip = (i) => { const x0 = -HL_ + 5 + i * 10.4; return poly([face(x0, z + 7), face(x0 + 8, z + 7), face(x0 + 8, z + 17), face(x0, z + 17)]); };
    chips.setAttribute("d", Array.from({ length: N }, (_, i) => chip(i)).join(""));
    lit.setAttribute("d", Array.from({ length: shown }, (_, i) => { const x0 = -HL_ + 7 + i * 10.4; return poly([face(x0, z + 9), face(x0 + 4, z + 9), face(x0 + 4, z + 15), face(x0, z + 15)]); }).join(""));
    // the gold contacts along the bottom edge, with the notch left off-centre
    pins.setAttribute("d", Array.from({ length: 34 }, (_, i) => { const x = -HL_ + 3 + i * 2.55; if (Math.abs(x - 6) < 2.5) return ""; return open([face(x, z + 0.6), face(x, z + 3.6)]); }).join("") + open([face(4, z), face(5, z + 2.2), face(7, z + 2.2), face(8, z)]));
    // the latches: arms hinged at the slot's ends, swung outward when open and up against the stick's ends when shut
    latches.forEach((e, k) => {
      const sx = k ? 1 : -1, hx = sx * (HL_ + 1), a = (1 - c) * 0.9, len = 9;
      const tip = [hx + sx * len * Math.sin(a), hx === 0 ? 0 : 0, ZS + len * Math.cos(a)];
      e.setAttribute("d", poly(hull([P(hx, -2.6, ZS - 2), P(hx, 2.6, ZS - 2), P(tip[0], -2.6, tip[2]), P(tip[0], 2.6, tip[2]), P(tip[0] - sx * 2, 2.6, tip[2] - 1)])));
    });
  }
  draw(performance.now());

  const B = register(stage, (_dt, now) => {
    const seated = on && tdone(drop, now) && tdone(clip, now);
    if (seated) shown = Math.min(N, Math.max(shown, Math.floor((now - t0 - 1200) / 120)));
    if (!on) shown = 0;
    draw(now);
    stick.sil.classList.toggle("hi", seated);
    read.textContent = !on ? (tdone(drop, now) ? "rest" : "releasing") : !seated ? "seating" : shown < N ? `detecting · ${Math.round(gb)} GB` : `DDR5 · ${Math.round(gb)} GB`;
    return !tdone(drop, now) || !tdone(clip, now) || (on && shown < N);
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, rrect(-HL_ - 8, -12, HL_ + 8, 12, 2, 4), 0), ...ringAt(P, rrect(-HL_, -2, HL_, 2, 1, 4), ZS + LIFT + H)]);
  const inside = (q, pts) => { let c_ = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c_ = !c_; return c_; };
  function point(q) {
    const n = !!q && inside(q, outline), now = performance.now();
    if (n !== on) { on = n; t0 = now; if (n) { tset(drop, 0, now, 0); tset(clip, 1, now, 600); } else { tset(clip, 0, now, 0); tset(drop, 1, now, 350); } }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gb = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "ram",
  means: "A RAM stick: bring the pointer near and it's pushed into its slot, the latches clip shut and its chips light as it's detected.",
  rules: [1, 2, 6, 8],
  range: [16, 32, 64],
  mount,
});
