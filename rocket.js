/**
 * Rocket: a rocket standing on its launch pad, a nozzle at its foot, a round body with a porthole, a pointed nose and
 * three fins. Bring the pointer near and it fires: a flame flickers out of the nozzle, it lifts off the pad and leans
 * toward the pointer, the further the pointer the further it leans; leave and the flame dies and it settles back onto
 * the pad, upright. The part under the pointer takes the bright edge. The read-out says which way it is heading; the
 * slider is how long the flame is.
 *
 * Body and nose are the hull of rings along the rocket's axis; the nozzle is the hull of its throat and its bell; each
 * fin is a flat plate in a plane through the axis, the far ones painted before the body and the near ones after; the
 * flame is a closed curve under the nozzle. The pointer is read on the ground's plane, and the hit test is the rocket
 * at rest.
 */
const { Cam, circ, clamp, facing, fit, hull, mk, open, poly, prism, proj, put, rad, spring, stepS, unproj, reducedMotion, disposer, pointer, register, solid } = HL;

const PAD = 2, BODY = 2.6, LEN = 16, NOSE = 9, LEAN = rad(24);
const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k), sub = (a, b) => a.map((x, i) => x - b[i]);
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let flameLen = value;
  const C = Cam(45, 0.5, 7.4);
  fit(C, [[-12, -12, 0], [12, 12, 0], [12, -12, 0], [-12, 12, 0], [0, 0, PAD + 6 + LEN + NOSE]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const pad = solid(g);
  put(pad, prism(P, front, circ(10, 48), circ(8.6, 48), 0, PAD));
  const el = (cls) => mk("path", { class: cls }, g);
  const flame = el("nf"), finsBack = el("sil"), nozzle = el("sil"), body = el("sil"), bands = el("nf"), port = el("sil"), portIn = el("nf"), finsFront = el("sil");

  const tilt = spring(0, { k: 40, c: 11, eps: 0.002 }), lift = spring(0, { k: 30, c: 10, eps: 0.002 }), burn = spring(0, { k: 60, c: 14, eps: 0.002 });
  let dir = rad(45), clock = 0;
  /** A circle of radius r about point c, square to direction d, as world points. */
  const ring = (c, d, r, n = 32) => {
    const z = norm(d), U = norm(cross(Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], z)), V = cross(z, U);
    return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return add(add(c, U, r * Math.cos(t)), V, r * Math.sin(t)); });
  };
  const pts = (ws) => ws.map((q) => P(...q));
  // the view's direction toward you on the ground: things whose outward side faces it are near
  const near = norm([1, 1, 0]), eye = [0.612, 0.612, 0.5];
  function draw(dt) {
    const a = [Math.sin(tilt.x) * Math.cos(dir), Math.sin(tilt.x) * Math.sin(dir), Math.cos(tilt.x)];
    const base = [0, 0, PAD + 1.6 + lift.x * 7], at = (s) => add(base, a, s);
    // the body: a cylinder, then the nose curving in to its point
    const stations = [[0.4, BODY * 0.92], [1.2, BODY], [LEN, BODY], ...Array.from({ length: 8 }, (_, k) => { const f = (k + 1) / 8; return [LEN + f * NOSE, BODY * Math.sqrt(1 - f * f) + 0.05]; })];
    body.setAttribute("d", poly(hull(stations.flatMap(([s, r]) => pts(ring(at(s), a, r))))));
    // the seams round the body: only their near halves, the far halves being behind it
    bands.setAttribute("d", [1.2, LEN].map((s) => { const c = at(s), r = ring(c, a, BODY, 48), vis = r.map((q) => sub(q, c).reduce((t, x, i) => t + x * eye[i], 0) > 0); const k = vis.findIndex((v, i) => v && !vis[(i + r.length - 1) % r.length]); return k < 0 ? "" : open(pts(Array.from({ length: r.length }, (_, i) => r[(k + i) % r.length]).filter((_, i) => vis[(k + i) % r.length]))); }).join(""));
    nozzle.setAttribute("d", poly(hull([...pts(ring(at(0.6), a, BODY * 0.55)), ...pts(ring(at(-1.6), a, BODY * 0.8))])));
    // the porthole: on the side facing you, two thirds of the way up
    const out = norm(add(near, a, -(near[0] * a[0] + near[1] * a[1] + near[2] * a[2]))), pc = add(at(LEN * 0.66), out, BODY);
    port.setAttribute("d", poly(pts(ring(pc, out, 1.1, 24)))); portIn.setAttribute("d", poly(pts(ring(add(pc, out, 0.05), out, 0.75, 24))));
    // the fins: flat in planes through the axis, sweeping back from the body to a tip below its foot
    const U = norm(cross(Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], a)), V = cross(a, U);
    const fins = [0, 1, 2].map((k) => {
      // set round so that none points straight at you and shows only its edge
      const t = rad(105 + 120 * k), h = [Math.cos(t), Math.sin(t), 0], o = norm(add(h, a, -(h[0] * a[0] + h[1] * a[1]))), f = (s, r) => add(at(s), o, r);
      return { d: poly(pts([f(6.5, BODY - 0.1), f(1, BODY + 3.4), f(-1.4, BODY + 3.6), f(0.6, BODY - 0.1)])), toward: o[0] * near[0] + o[1] * near[1] > 0 };
    });
    finsBack.setAttribute("d", fins.filter((f) => !f.toward).map((f) => f.d).join(""));
    finsFront.setAttribute("d", fins.filter((f) => f.toward).map((f) => f.d).join(""));
    // the flame: a teardrop out of the bell, its length flickering while it burns
    if (burn.x > 0.02) {
      if (!reducedMotion()) clock += dt;
      const L = flameLen * burn.x * (1 + 0.12 * Math.sin(clock * 31) + 0.08 * Math.sin(clock * 53)), U2 = norm(cross(a, near)), n = 18;
      const side = (sg) => Array.from({ length: n + 1 }, (_, k) => { const f = k / n, w = BODY * 1.05 * Math.sin(Math.PI * (0.5 + f * 0.5)) * (1 - f * 0.2) * (1 + 0.1 * Math.sin(clock * 40 + k)); return add(at(-1.6 - f * L), U2, sg * w); });
      flame.setAttribute("d", poly(pts([...side(1), ...side(-1).reverse()])));
    } else flame.setAttribute("d", "");
    return a;
  }
  draw(0);
  const rest = [["body", body], ["fins", finsFront], ["nozzle", nozzle], ["pad", pad.sil]].map(([name, e]) => ({ name, e, ls: loops(e.getAttribute("d")) }));

  const B = register(stage, (dt) => { const m = [stepS(tilt, dt), stepS(lift, dt), stepS(burn, dt)].some(Boolean); draw(dt); return m || burn.x > 0.02; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], 0), d = Math.hypot(x, y);
      dir = Math.atan2(y, x); tilt.t = clamp(d / 30, 0.15, 1) * LEAN; lift.t = 1; burn.t = 1;
      read.textContent = "lift-off · heading " + ["e", "se", "s", "sw", "w", "nw", "n", "ne"][(Math.round(dir / (Math.PI / 4)) + 8) % 8];
    } else { tilt.t = 0; lift.t = 0; burn.t = 0; read.textContent = "rest"; }
    const h = q ? rest.find((p) => inLoops(q, p.ls)) : null, e = h ? h.e : null;
    if (e !== lit) { if (lit) lit.classList.remove("hi"); lit = e; if (e) e.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { flameLen = v; }, destroy: bag.dispose };
}

hairline({
  name: "rocket",
  means: "A rocket on its pad: bring the pointer near and it fires, lifts off and leans toward the pointer; leave and it settles back down.",
  rules: [1, 3, 7, 9],
  range: [4, 7, 11],
  mount,
});
