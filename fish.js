/**
 * Fish: a goldfish in a round glass bowl on a low foot, pebbles on the floor,
 * resting turned to one side with its eye the bright mark. The pointer is read
 * on a plane at the fish's depth; the fish swims there, its position on two
 * springs and its heading on a third, turning the way it travels, the tail
 * beating harder the faster it goes. The read-out names where it swims. The
 * slider is how far from the middle it may go.
 *
 * The bowl is glass, so its far edges show through: the water line's far half
 * is painted before the fish and its near half after. The hit test is a fixed
 * plane, so the fish moving cannot change what is read.
 */
const {
  Cam, clamp, facing, fit, hull, mk, open, place, pointer, poly, prism, proj, put, register, rrect,
  solid, spring, stepS, unproj, disposer,
} = HL;

const RB = 26, ZC = 24, ZT = 40, ZF = 5, ZW = 34, ZM = 19, REST = [-3, 4, 150], EYE = [0.612, 0.612, 0.5];
const SPH = [];
for (let i = 1; i < 10; i++) for (let j = 0; j < 20; j++) { const t = (i / 10) * Math.PI, f = (j / 20) * 2 * Math.PI; SPH.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); }
SPH.push([0, 0, 1], [0, 0, -1]);
const DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];

/** A path's loops as point lists, read back from the numbers it was written with (M and L only). */
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
/** Whether point q lies inside any of the loops. */
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  const C = Cam(45, 0.5, 3.75);
  fit(C, [[-RB, -RB, 0], [RB, RB, 0], [RB, -RB, ZC], [-RB, RB, ZC], [0, 0, ZT + 1]], 200, 164);
  const P = proj(C), front = facing(C);
  const circle = (r, z, n = 48, from = 0, to = 2 * Math.PI) => Array.from({ length: n + 1 }, (_, k) => { const t = from + ((to - from) * k) / n; return P(r * Math.cos(t), r * Math.sin(t), z); });
  const at = (z) => Math.sqrt(RB * RB - (z - ZC) ** 2);
  // the near half of a horizontal circle is the run facing the eye, from -45° round to 135°
  const near = [-Math.PI / 4, (3 * Math.PI) / 4], far = [(3 * Math.PI) / 4, (7 * Math.PI) / 4];

  const g = mk("g", {}, svg);
  const foot = rrect(-15, -15, 15, 15, 15, 12), footIn = rrect(-13.6, -13.6, 13.6, 13.6, 13.6, 12);
  put(solid(g), prism(P, front, foot, footIn, 0, ZF));
  // the glass: its outline, the floor, the far half of the rim and of the water
  const glass = [];
  for (let k = 0; k <= 12; k++) { const z = ZF + ((ZT - ZF) * k) / 12; glass.push(...circle(at(z), z, 36)); }
  mk("path", { d: poly(hull(glass)), class: "fo" }, g);
  mk("path", { d: open(circle(at(ZF), ZF, 40)), class: "nf lo" }, g);
  for (const [x, y, r] of [[-6, 7, 2.2], [3, 9, 1.8], [8, 1, 2.4], [-1, -8, 2], [9, -7, 1.6], [-10, -2, 1.9]])
    mk("path", { d: poly(Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * 0.8 * Math.sin(t), ZF + 0.8); })), class: "nf lo" }, g);
  mk("path", { d: open(circle(at(ZT), ZT, 24, ...far)), class: "nf" }, g);
  mk("path", { d: open(circle(at(ZW), ZW, 24, ...far)), class: "nf lo" }, g);

  const fish = mk("g", {}, g), part = {};
  for (const k of ["tail", "fin", "body"]) part[k] = mk("path", { class: k === "body" ? "sil" : "" }, fish);
  part.gill = mk("path", { class: "nf lo" }, fish);
  const eye = mk("circle", { r: 1.3, class: "dot" }, fish);

  mk("path", { d: open(circle(at(ZW), ZW, 24, ...near)), class: "nf lo" }, g);
  mk("path", { d: open(circle(at(ZT), ZT, 24, ...near)), class: "nf" }, g);
  const out = mk("path", { d: poly(hull(glass)), class: "nf sil" }, g);
  // a glint on the glass
  mk("path", { d: open(Array.from({ length: 9 }, (_, k) => { const t = 2.5 + k * 0.06, z = ZC + 8 - k * 1.6; return P(at(z) * 0.97 * Math.cos(t), at(z) * 0.97 * Math.sin(t), z); })), class: "nf lo" }, g);
  void out;

  const px = spring(REST[0]), py = spring(REST[1]), hd = spring(REST[2]);
  let wag = 0, drawn = "";
  function draw() {
    const key = [px.x, py.x, hd.x, wag].map((v) => v.toFixed(2)).join();
    if (key === drawn) return;
    drawn = key;
    const a = (hd.x * Math.PI) / 180, F = [Math.cos(a), Math.sin(a)], R = [Math.sin(a), -Math.cos(a)];
    const W = (s, f, h) => P(px.x + R[0] * s + F[0] * f, py.x + R[1] * s + F[1] * f, ZM + h);
    part.body.setAttribute("d", poly(hull(SPH.map(([s, f, h]) => W(s * 3.4, f * 9.4, h * 6.4)))));
    const sw = Math.sin(wag) * 3;
    part.tail.setAttribute("d", poly([W(0, -7.6, 1.2), W(sw * 0.6, -12.5, 5.8), W(sw, -16.5, 7.6), W(sw * 0.7, -13.2, 0), W(sw, -16.5, -7.6), W(sw * 0.6, -12.5, -5.8), W(0, -7.6, -1.2)]));
    part.fin.setAttribute("d", poly([W(0, 2.6, 5.4), W(0, -3.6, 9.6), W(0, -6.4, 4.2)]));
    const s = R[0] * EYE[0] + R[1] * EYE[1] > 0 ? 1 : -1;
    part.gill.setAttribute("d", open([-0.8, -0.4, 0, 0.4, 0.8].map((t) => W(s * 2.9 * Math.cos(t * 0.6), 4 - Math.abs(t) * 0.9, t * 4.6))));
    place(eye, W(s * 2.6, 6.4, 1.6));
    // the tail sits behind the body when the fish faces the eye, in front when it faces away
    const towards = F[0] + F[1] > 0;
    if (towards) fish.prepend(part.tail); else part.body.after(part.tail);
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(px, dt), stepS(py, dt), stepS(hd, dt)].some(Boolean);
    const sp = Math.hypot(px.v || 0, py.v || 0);
    wag += dt * (3 + Math.min(sp, 40) * 0.5);
    draw();
    return m;
  });
  bag.add(B.unregister);

  const bowl = loops(out.getAttribute("d"));
  function swim(p) {
    let tx = REST[0], ty = REST[1], th = REST[2], on = false;
    if (p) {
      const w = unproj(C, p[0], p[1], ZM), d = Math.hypot(w[0], w[1]);
      if (d < RB * 1.25) {
        on = true;
        const k = Math.min(1, reach / Math.max(d, 1e-6));
        tx = w[0] * k; ty = w[1] * k;
        const dx = tx - px.x, dy = ty - py.x;
        if (Math.hypot(dx, dy) > 2) {
          // face screen left or right, angled at most 25° toward or away: a fish reads side on
          const sx = (dx - dy) * Math.SQRT1_2, fy = (dx + dy) * Math.SQRT1_2, base = sx >= 0 ? -45 : 135;
          const tilt = clamp((Math.atan2(fy, Math.abs(sx)) * 180) / Math.PI, -25, 25);
          let want = base + (base < 0 ? 1 : -1) * tilt;
          while (want - hd.t > 180) want -= 360;
          while (want - hd.t < -180) want += 360;
          th = want;
        } else th = hd.t;
      }
    }
    px.t = tx; py.t = ty; hd.t = th;
    // the bright edge: the fish while it swims to the pointer; the bowl while the pointer is on the glass but out of reach
    part.body.classList.toggle("hi", on); out.classList.toggle("hi", !on && !!p && inLoops(p, bowl)); eye.setAttribute("class", on ? "dot m" : "dot");
    read.textContent = !on ? "rest" : Math.hypot(tx, ty) < 3 ? "swim" : "swim " + DIRS[((Math.round(Math.atan2(ty, tx) / (Math.PI / 4)) % 8) + 8) % 8];
    B.wake();
  }

  bag.add(pointer(stage, { move: swim, leave: () => swim(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = clamp(v, 0, 12); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "fish",
  means: "A goldfish in a glass bowl: it swims to where the pointer is, turning the way it goes, tail beating as it travels.",
  rules: [1, 3, 6, 8],
  range: [4, 8, 11],
  mount,
});
