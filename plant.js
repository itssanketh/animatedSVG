/**
 * Plant: a potted plant, one stem up out of the soil with leaves off it on every side. At rest it is in the dark and
 * wilts: its stem stands straight and its leaves hang down over the rim. Bring the pointer near and it is the light:
 * the stem leans toward it, the leaves lift and turn to face it; leave and it droops again. The part under the pointer
 * takes the bright edge. The read-out says which way it is reaching; the slider is how far it leans.
 *
 * The pot is the hull of its foot and its mouth, a rim on top and the soil inside it. The stem is a tube along a
 * curve; each leaf is a blade, its edges curved out from the stem and in to a tip, bent along its length, with a vein
 * down the middle, painted far to near. The pointer is read on the table's plane, and the hit test is the plant at rest.
 */
const { Cam, circ, clamp, facing, fit, hull, lerp, mk, open, poly, prism, proj, put, rad, spring, stepS, unproj, disposer, pointer, register, solid } = HL;

const POT = 14, HGT = 36, LEAVES = [[0.3, 200, 15], [0.45, 20, 15], [0.6, 115, 14], [0.74, 290, 13], [0.86, 60, 11], [1, 160, 9]];
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inLoops = (q, ls) => ls.some((pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let far = value;
  const C = Cam(45, 0.5, 5.2);
  fit(C, [[-20, -20, 0], [20, 20, 0], [20, -20, 0], [-20, 20, 0], [0, 0, POT + HGT + 4]], 200, 172);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const pot = mk("path", { class: "sil" }, g);
  pot.setAttribute("d", poly(hull([...circ(8, 48).map((q) => P(q.u, q.v, 0)), ...circ(10.5, 48).map((q) => P(q.u, q.v, POT - 2))])));
  const rim = solid(g);
  put(rim, prism(P, front, circ(11.5, 48), circ(10, 48), POT - 2, POT + 1));
  const soil = mk("path", { class: "nf" }, g);
  soil.setAttribute("d", poly(circ(9.6, 48).map((q) => P(q.u, q.v, POT - 0.2))));
  const leafG = mk("g", {}, g);
  const stem = mk("path", { class: "sil" }, leafG);
  const leaves = LEAVES.map(() => ({ el: mk("path", { class: "sil" }, leafG), vein: mk("path", { class: "nf" }, leafG) }));

  const yaw = spring(rad(-45), { k: 40, c: 11, eps: 0.002 }), lean = spring(0, { k: 40, c: 11, eps: 0.002 }), perk = spring(0, { k: 40, c: 11, eps: 0.002 });
  /** The stem's centre at s, 0 at the soil to 1 at the tip: up, and bent over toward yaw by lean. */
  const at = (s) => { const o = lean.x * 14 * s * s + (1 - perk.x) * 6 * s * s * s; return [o * Math.cos(yaw.x), o * Math.sin(yaw.x), POT + HGT * s * (1 - 0.12 * lean.x * s)]; };
  /** A band round a curve of world points, w wide on screen, as one closed path. */
  const band = (pts, w) => { const m = pts.map((q) => P(...q)); return poly([1, -1].flatMap((sgn) => { const side = m.map((q, k) => { const a = m[Math.max(0, k - 1)], b = m[Math.min(m.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [q[0] - (dy / l) * w * sgn, q[1] + (dx / l) * w * sgn]; }); return sgn > 0 ? side : side.reverse(); })); };
  function draw() {
    stem.setAttribute("d", band(Array.from({ length: 13 }, (_, k) => at(k / 12)), 1.4));
    // each leaf: out from the stem at angle phi, turned part way toward the light, lifted by perk, bending down as it goes
    const ls = LEAVES.map(([s, phi, len], i) => {
      const b = at(s), f = rad(phi) + Math.atan2(Math.sin(yaw.x - rad(phi)), Math.cos(yaw.x - rad(phi))) * 0.45 * lean.x;
      const h = [Math.cos(f), Math.sin(f)], n = [-h[1], h[0]], mid = [], N = 12;
      let p = b.slice(), e = lerp(rad(-18), rad(28), perk.x);
      for (let k = 0; k <= N; k++) { mid.push(p.slice()); const step = len / N, c = Math.cos(e); p = [p[0] + h[0] * c * step, p[1] + h[1] * c * step, p[2] + Math.sin(e) * step]; e -= rad(lerp(9, 3, perk.x)); }
      const w = (k) => Math.pow(Math.sin((k / N) * Math.PI), 0.7) * len * 0.3;
      const edge = (sgn) => mid.map((q, k) => P(q[0] + n[0] * w(k) * sgn, q[1] + n[1] * w(k) * sgn, q[2]));
      return { i, depth: mid[N >> 1][0] + mid[N >> 1][1], d: poly([...edge(1), ...edge(-1).reverse()]), vein: open(mid.slice(1, N - 1).map((q) => P(...q))) };
    }).sort((a, b) => a.depth - b.depth);
    const sm = at(0.5), sd = sm[0] + sm[1];
    leafG.append(stem);
    ls.forEach((l) => { const e = leaves[l.i]; e.el.setAttribute("d", l.d); e.vein.setAttribute("d", l.vein); leafG.append(e.el, e.vein); if (l.depth < sd) leafG.append(stem); });
  }
  draw();
  const rest = [...leaves.map((l, k) => ({ name: "leaf " + k, el: l.el })), { name: "stem", el: stem }, { name: "pot", el: rim.sil }, { name: "pot", el: pot }].map((p) => ({ ...p, ls: loops(p.el.getAttribute("d")) }));

  const B = register(stage, (dt) => { const m = [stepS(yaw, dt), stepS(lean, dt), stepS(perk, dt)].some(Boolean); draw(); return m; });
  bag.add(B.unregister);

  let lit = null;
  function point(q) {
    if (q) {
      const [x, y] = unproj(C, q[0], q[1], 0), want = Math.atan2(y, x);
      yaw.t = yaw.x + Math.atan2(Math.sin(want - yaw.x), Math.cos(want - yaw.x));
      lean.t = clamp(Math.hypot(x, y) / 30, 0.35, 1) * far; perk.t = 1;
      read.textContent = "reaching " + ["e", "se", "s", "sw", "w", "nw", "n", "ne"][(Math.round(want / (Math.PI / 4)) + 8) % 8];
    } else { lean.t = 0; perk.t = 0; read.textContent = "rest"; }
    const h = q ? rest.find((p) => inLoops(q, p.ls)) : null, el = h ? h.el : null;
    if (el !== lit) { if (lit) lit.classList.remove("hi"); lit = el; if (el) el.classList.add("hi"); }
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { far = v; }, destroy: bag.dispose };
}

hairline({
  name: "plant",
  means: "A potted plant: bring the pointer near and it is the light, the stem leans and the leaves lift to face it; leave and it wilts.",
  rules: [1, 5, 7, 8],
  range: [0.4, 0.7, 1],
  mount,
});
