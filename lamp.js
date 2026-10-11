/**
 * Lamp: an architect's desk lamp, as in the photograph: a flat round base, a short swivel post with a knob, a lower arm
 * and an upper arm each a pair of slim parallel rods with a spring along them, flat triangular plates at the knuckles,
 * and a bell of a shade, a narrow neck flaring out to a banded rim, its cable looping from the shade back over the
 * elbow to the base. At rest it is off, its head bowed. Bring the pointer over the desk and it switches on and looks
 * for it: it swivels on its post to face the pointer, its arms stretch out or fold in as the pointer is far or near,
 * and its shade tips to aim at the spot, which its light falls on, a pool on the desk inside a dashed cone; leave and
 * it switches off and bows its head again. The part under the pointer takes the bright edge. The read-out says where
 * it is looking; the slider is how far it reaches.
 *
 * Base and post are short cylinders; rods are slim bands along their axes; the shade is the hull of its neck and the
 * hull of its bell, the nearer painted last. The pointer is read on the desk's plane, and the hit test is the lamp at rest.
 */
const { Cam, circ, clamp, facing, fit, hull, lerp, mk, open, poly, prism, proj, put, rad, spring, stepS, unproj, disposer, pointer, register, solid } = HL;

const L1 = 26, L2 = 24, SHADE = 11, MOUTH = 6.6, BASE = 8.5, POST = 4.6, GAP = 0.9;
const REST = { yaw: rad(-45), a1: rad(-14), a2: rad(100), hp: rad(78) }, YAW = [rad(-95), rad(5)], REACH = [16, 30];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });
const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k), sub = (a, b) => a.map((x, i) => x - b[i]);
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let reach = value;
  const C = Cam(45, 0.5, 5.2);
  fit(C, [[-BASE, -BASE, 0], [BASE, BASE, 0], [0, 0, 50], ...Array.from({ length: 9 }, (_, k) => { const a = lerp(YAW[0], YAW[1], k / 8); return [50 * Math.cos(a), 50 * Math.sin(a), 0]; })], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const pool = mk("path", { class: "nf dash" }, g), beam = mk("path", { class: "nf dash" }, g);
  const base = solid(g), post = solid(g);
  put(base, prism(P, front, circ(BASE, 56), circ(BASE - 0.6, 56), 0, 1.3));
  put(post, prism(P, front, circ(1.1, 24), circ(0.9, 24), 1.3, POST));
  const knob = mk("path", { class: "sil" }, g);
  const el = (cls) => mk("path", { class: cls }, g);
  const cable = el("nf"), lower = el("sil"), springs = el("nf"), shoulder = el("sil"), upper = el("sil"), elbow = el("sil");
  const shade = [el("sil"), el("sil")], rim = el("nf"), mouth = el("nf"), screws = el("nf");

  // the pose: swivelled on the post by yaw; the lower and upper arms leaning a1 and a2 from upright; the shade tipped hp
  const sp = Object.fromEntries(Object.entries(REST).map(([k, v]) => [k, spring(v, { eps: 0.002 })]));
  const lit = spring(0, { eps: 0.01 });
  /** A circle of radius r about point c, square to direction d, as world points. */
  const ring = (c, d, r, n = 28) => {
    const z = norm(d), U = norm(cross(Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], z)), V = cross(z, U);
    return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return add(add(c, U, r * Math.cos(t)), V, r * Math.sin(t)); });
  };
  /** A slim rod from a to b: a band w wide on screen, as one closed path. */
  const rod = (a, b, w = 0.9) => { const p = P(...a), q = P(...b), d = norm([q[0] - p[0], q[1] - p[1], 0]), n = [-d[1] * w, d[0] * w]; return poly([[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]], [q[0] - n[0], q[1] - n[1]], [p[0] - n[0], p[1] - n[1]]]); };
  const pts = (ws) => ws.map((q) => P(...q));
  const screw = (c) => poly(circ(0.45, 10).map((q) => P(c[0] + q.u * 0.7, c[1] + q.v * 0.7, c[2] + 0.35)));
  /** The lamp's joints in the world, for a pose. */
  function joints({ yaw, a1, a2, hp }) {
    const c = Math.cos(yaw), s = Math.sin(yaw), W = (r, z) => [r * c, r * s, z];
    const S0 = [0, POST + 0.8], E = [S0[0] + L1 * Math.sin(a1), S0[1] + L1 * Math.cos(a1)], Wr = [E[0] + L2 * Math.sin(a2), E[1] + L2 * Math.cos(a2)];
    const D = [Math.cos(hp), -Math.sin(hp)], M = [Wr[0] + SHADE * D[0], Wr[1] + SHADE * D[1]];
    return { S: W(...S0), E: W(...E), Wr: W(...Wr), M: W(...M), D: [D[0] * c, D[0] * s, D[1]], side: [-s, c, 0] };
  }
  function draw() {
    const j = joints(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, v.x])));
    // each arm is a pair of rods, one above the other in the arm's own plane, a spring stretched along the lower rod
    const pair = (a, b) => { const n = norm(cross(j.side, norm(sub(b, a)))); return [[add(a, n, GAP), add(b, n, GAP)], [add(a, n, -GAP), add(b, n, -GAP)], n]; };
    const lo = pair(j.S, j.E), up = pair(j.E, j.Wr);
    lower.setAttribute("d", lo.slice(0, 2).map(([a, b]) => rod(a, b)).join(""));
    upper.setAttribute("d", up.slice(0, 2).map(([a, b]) => rod(a, b)).join(""));
    const coil = (a, b, n, t0, t1) => open(Array.from({ length: 29 }, (_, k) => { const t = lerp(t0, t1, k / 28); return P(...add(add(a, sub(b, a), t), n, (k % 2 ? 1 : -1) * 0.55 + 2 * GAP)); }));
    springs.setAttribute("d", coil(j.S, j.E, lo[2], 0.1, 0.4) + coil(j.E, j.Wr, up[2], 0.45, 0.75));
    // the knuckle plates: flat triangles across the pivots, a screw at each corner
    const plate = (c, u, v, k) => { const q = [add(c, u, k), add(c, v, k), add(c, add(u, v), -k * 0.45)]; return { d: poly(pts(q)), q }; };
    const uLo = norm(sub(j.E, j.S)), uUp = norm(sub(j.Wr, j.E));
    const sh = plate(j.S, uLo, lo[2].map((x) => -x), 2.6), eb = plate(j.E, uUp, uLo.map((x) => -x), 3.6);
    shoulder.setAttribute("d", sh.d); elbow.setAttribute("d", eb.d);
    screws.setAttribute("d", [...sh.q, ...eb.q, j.Wr].map((q) => screw(add(q, j.side, 0.2))).join(""));
    // the shade: a narrow neck, flaring to a bell with a band round its rim; the end nearer you painted last
    const at = (k) => add(j.Wr, j.D, k), neckP = hull(pts([...ring(at(-1), j.D, 2.3), ...ring(at(4), j.D, 2.5)])), bellP = hull(pts([...ring(at(4), j.D, 2.6), ...ring(at(8.6), j.D, MOUTH), ...ring(at(SHADE), j.D, MOUTH)]));
    const toward = j.D[0] + j.D[1] > 0;
    shade[0].setAttribute("d", poly(toward ? neckP : bellP)); shade[1].setAttribute("d", poly(toward ? bellP : neckP));
    rim.setAttribute("d", open(pts(ring(at(8.6), j.D, MOUTH, 40).concat([ring(at(8.6), j.D, MOUTH, 40)[0]]))));
    const m = pts(ring(j.M, j.D, MOUTH, 40));
    mouth.setAttribute("d", toward ? poly(m) : "");
    // the cable: out of the back of the shade, a loop up over the elbow, then down along the lower arm to the post
    const bez = (a, c, b, n = 14) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n; return [0, 1, 2].map((i) => (1 - t) * (1 - t) * a[i] + 2 * (1 - t) * t * c[i] + t * t * b[i]); });
    const out = add(at(-1), [0, 0, 1], 1.5), e2 = add(j.E, up[2], 2.4), foot = add([0, 0, POST - 1], j.side, -1.8);
    cable.setAttribute("d", open(pts([...bez(out, add(add(out, e2, 0.5).map((x) => x / 1.5), [0, 0, 7]), e2), ...bez(e2, add(add(e2, lo[2], 5), j.side, -2.5), foot).slice(1)])));
    knob.setAttribute("d", poly(circ(0.9, 14).map((q) => P(...add(add([0, 0, 3.6], j.side, 1.3 + q.u * 0.2), [0, 0, q.v * 0.9], 1)))));
    // the light: where the shade's axis meets the desk, a pool, and the cone's two outer edges down to it
    const t = j.D[2] < -0.15 ? j.M[2] / -j.D[2] : 0, on = lit.x > 0.5 && t > 0;
    if (on) {
      const hit = [j.M[0] + j.D[0] * t, j.M[1] + j.D[1] * t], R = MOUTH * 0.75 + t * 0.16;
      const spot = circ(R, 40).map((q) => P(hit[0] + q.u, hit[1] + q.v, 0));
      pool.setAttribute("d", poly(spot));
      const xs = spot.map((q) => q[0]), l = spot[xs.indexOf(Math.min(...xs))], r = spot[xs.indexOf(Math.max(...xs))], mx = m.map((q) => q[0]);
      beam.setAttribute("d", open([m[mx.indexOf(Math.min(...mx))], l]) + open([m[mx.indexOf(Math.max(...mx))], r]));
    } else { pool.setAttribute("d", ""); beam.setAttribute("d", ""); }
  }
  draw();
  const rest = [["shade", shade[1]], ["shade", shade[0]], ["upper arm", upper], ["elbow", elbow], ["lower arm", lower], ["shoulder", shoulder], ["post", post.sil], ["base", base.sil]].map(([name, e]) => ({ name, el: e, ls: loops(e.getAttribute("d")) }));

  const B = register(stage, (dt) => { let m = false; for (const s of [...Object.values(sp), lit]) if (stepS(s, dt)) m = true; draw(); return m; });
  bag.add(B.unregister);

  let hot = null;
  function point(q) {
    if (q) {
      // it turns only so far, never to face you head on, and reaches only so far, so its light stays on the desk in view
      const [x, y] = unproj(C, q[0], q[1], 0), raw = Math.atan2(y, x), off = Math.atan2(Math.sin(raw - rad(-45)), Math.cos(raw - rad(-45)));
      const want = clamp(rad(-45) + off, YAW[0], YAW[1]), d = clamp(Math.hypot(x, y), REACH[0], REACH[0] + (REACH[1] - REACH[0]) * reach), f = (d - REACH[0]) / (REACH[1] - REACH[0]);
      sp.yaw.t = want;
      sp.a1.t = rad(lerp(-24, 14, f)); sp.a2.t = rad(lerp(48, 92, f));
      const j = joints({ yaw: sp.yaw.t, a1: sp.a1.t, a2: sp.a2.t, hp: 0 }), wr = Math.hypot(j.Wr[0], j.Wr[1]);
      sp.hp.t = clamp(Math.atan2(j.Wr[2], d - wr), rad(15), rad(85));
      lit.t = 1;
      read.textContent = `looking ${f < 0.33 ? "close" : f < 0.75 ? "ahead" : "far"} · ${["e", "se", "s", "sw", "w", "nw", "n", "ne"][(Math.round(raw / (Math.PI / 4)) + 8) % 8]}`;
    } else {
      for (const [k, v] of Object.entries(REST)) sp[k].t = v;
      lit.t = 0; read.textContent = "rest";
    }
    const h = q ? rest.find((p) => inLoops(q, p.ls)) || null : null;
    if (h !== hot) { if (hot) hot.el.classList.remove("hi"); hot = h; if (h) h.el.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; }, destroy: bag.dispose };
}

hairline({
  name: "lamp",
  means: "A desk lamp: point at the desk and it switches on, turns, reaches and aims its light at the spot; leave and it bows its head.",
  rules: [1, 3, 8, 9],
  range: [0.5, 0.8, 1],
  mount,
});
