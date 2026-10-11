/**
 * Mushroom: a toadstool on a patch of ground, a smaller one beside it: its stem with the ring partway up, its domed cap with the
 * spots on it and the rim of gills under its edge. Bring the pointer near and it grows: the stem rises, the cap swells and opens out
 * flatter and wider, and once it is grown it lets go its spores, a cloud of them puffing out from under the cap and drifting up and
 * away. Leave and it shrinks back and the last spores drift off. The cap takes the bright edge while it is grown. The read-out says
 * how far it has grown and how many spores are in the air. The slider is how tall it grows.
 *
 * The stem is a solid whose foot is wider than its top, the cap a dome, each the hull of its rings; the spots are rings on the dome's
 * face toward you, and the spores are dots. The pointer is read against the mushroom's resting outline.
 */
const { Cam, fit, proj, circ, hull, ringAt, poly, open, spring, stepS, mk, flatDot, place, register, pointer, disposer } = HL;

const SPOTS = [[0.35, 0.4], [1.3, 0.55], [2.4, 0.3], [3.4, 0.6], [4.4, 0.35], [5.4, 0.55], [0.9, 0.9], [2.9, 0.88], [4.9, 0.9]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let tall = value;
  const C = Cam(45, 0.5, 3.2);
  fit(C, [[-40, -40, 0], [40, 40, 0], [40, -40, 0], [-40, 40, 0], [0, 0, 78]], 200, 178);
  const P = proj(C), g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  // the ground: a low mound, and a few blades of grass
  el("nf lo").setAttribute("d", poly(Array.from({ length: 48 }, (_, i) => P(38 * Math.cos((i / 48) * 2 * Math.PI), 30 * Math.sin((i / 48) * 2 * Math.PI), 0))) + [[-26, 14], [-30, 6], [24, -18], [30, 10], [-8, 26]].map(([x, y]) => open([P(x, y, 0), P(x + 1, y - 1, 5)])).join(""));
  /** a mushroom at (x, y): stem from z 0 to h, radius rs; cap of radius rc, dome height hc */
  const shroom = () => ({ stem: el("sil"), ring: el("nf lo"), cap: el("sil"), gills: el("nf lo"), spots: el("nf") });
  const small = shroom(), big = shroom();
  function drawShroom(m, x, y, h, rs, rc, hc) {
    const at = (r, z, n = 40) => Array.from({ length: n }, (_, i) => P(x + r * Math.cos((i / n) * 2 * Math.PI), y + r * Math.sin((i / n) * 2 * Math.PI), z));
    m.stem.setAttribute("d", poly(hull([...at(rs * 1.25, 0), ...at(rs, h)])));
    m.ring.setAttribute("d", open(at(rs * 1.18, h * 0.62).slice(4, 26)));
    // the cap: rings from its rim up the dome
    const rings = Array.from({ length: 7 }, (_, k) => { const t = k / 6, r = rc * Math.cos((t * Math.PI) / 2), z = h - hc * 0.15 + hc * Math.sin((t * Math.PI) / 2); return at(Math.max(0.5, r), z); });
    m.cap.setAttribute("d", poly(hull(rings.flat())));
    m.gills.setAttribute("d", open(at(rc * 0.97, h - hc * 0.15).slice(3, 27)) + open(at(rc * 0.55, h - hc * 0.15 + 0.5).slice(5, 25)));
    // the spots, on the side of the dome toward the viewer
    m.spots.setAttribute("d", SPOTS.map(([a, t]) => {
      const phi = a + 0.8, r = rc * Math.cos((t * Math.PI) / 2), z = h - hc * 0.15 + hc * Math.sin((t * Math.PI) / 2), s = 2.4 * (1 - t * 0.4) * (rc / 26);
      if (Math.cos(phi - Math.PI / 4) < -0.1 && t < 0.7) return "";
      return poly(Array.from({ length: 10 }, (_, i) => { const b = (i / 10) * 2 * Math.PI; return P(x + (r + 0.6) * Math.cos(phi) + s * Math.cos(b) * Math.sin(phi), y + (r + 0.6) * Math.sin(phi) - s * Math.cos(b) * Math.cos(phi), z + s * Math.sin(b) * 0.9); }));
    }).join(""));
  }
  drawShroom(small, -22, 14, 12, 3, 11, 7);
  const grow = spring(0, { k: 40, c: 8 });
  const spores = Array.from({ length: 26 }, () => ({ dot: null, live: false }));
  let on = false;

  function draw() {
    const s = grow.x, h = 30 + s * tall, rc = 25 + s * 5, hc = 16 - s * 2;
    drawShroom(big, 6, -4, h, 5.5 + s * 0.8, rc, hc);
    return { h, rc };
  }
  draw();

  const B = register(stage, (dt) => {
    let m = stepS(grow, dt);
    const { h, rc } = draw();
    // spores puff from under the cap once it is grown, and drift up and away
    for (const p of spores) {
      if (!p.live && on && grow.x > 0.85 && Math.random() < dt * 7) Object.assign(p, { dot: flatDot(g, C, 0.8, "dot m"), live: true, x: 6 + (Math.random() - 0.5) * rc * 1.6, y: -4 + (Math.random() - 0.5) * rc * 1.6, z: h - 4, vx: (Math.random() - 0.3) * 8, vy: (Math.random() - 0.5) * 8, vz: 6 + Math.random() * 8, life: 0 });
      if (p.live) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx += 3 * dt; if (p.life > 3.2 || p.z > h + 46) { p.live = false; p.dot.remove(); p.dot = null; } }
      if (p.live) place(p.dot, P(p.x, p.y, p.z));
    }
    const live = spores.filter((p) => p.live).length;
    big.cap.classList.toggle("hi", grow.x > 0.85 && on);
    read.textContent = on || grow.x > 0.02 || live ? `grown ${Math.round(Math.min(1, grow.x) * 100)}% · ${live} spores` : "rest";
    return m || on || live > 0;
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, circ(30, 32), 0), ...ringAt(P, circ(30, 32), 60)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) { const n = !!q && inside(q, outline); if (n !== on) { on = n; grow.t = n ? 1 : 0; } B.wake(); }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { tall = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "mushroom",
  means: "A toadstool: bring the pointer near and it grows, its cap opening out, then puffs a cloud of spores that drift away; leave and it shrinks.",
  rules: [1, 5, 7, 8],
  range: [10, 18, 26],
  mount,
});
