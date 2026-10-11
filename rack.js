/**
 * Rack: a server rack, a tall cabinet holding six servers one above the other, each with a row of drive bays and three
 * status lights across its front. Bring the pointer near and it is busy: the lights blink in a wave that runs down the
 * rack, and the server at the pointer's height slides out on its rails toward you; move up or down and that one slides
 * back as the next comes out. Leave and the server slides home and the lights go still. The server out on its rails
 * takes the bright edge. The read-out names the server and its load; the slider is how fast the lights run.
 *
 * The cabinet and every server are rounded blocks, a silhouette and one crease, the servers painted from the bottom up
 * so one slid out covers the face below it; the bays are open lines and the lights small rings on each server's face.
 * The pointer is read by its height on the cabinet's face.
 */
const { Cam, clamp, fit, mk, open, poly, prism, proj, put, rings, spring, stepS, reducedMotion, disposer, pointer, register, solid, facing } = HL;

const W = 8, D = 10, U = 5.4, N = 6, BASE = 2.4, OUT = 7;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let pace = value;
  const C = Cam(45, 0.5, 5.6);
  const TOPZ = BASE + N * U + 1.8;
  fit(C, [[-W - 1, -D - 1, 0], [W + 1, D + OUT + 1, 0], [W + 1, -D - 1, 0], [-W - 1, D + OUT + 1, 0], [0, 0, TOPZ]], 200, 160);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const cab = solid(g);
  put(cab, prism(P, front, ...rings(-W - 1, -D - 1, W + 1, D + 0.4, 1, 0.8), 0, TOPZ));
  // the cabinet's open front: its frame, inset, so the servers sit inside it
  const frame = mk("path", { class: "nf" }, g);
  frame.setAttribute("d", poly([[-W - 0.2, D + 0.4, BASE - 0.4], [W + 0.2, D + 0.4, BASE - 0.4], [W + 0.2, D + 0.4, TOPZ - 1], [-W - 0.2, D + 0.4, TOPZ - 1]].map((q) => P(...q))));
  const units = Array.from({ length: N }, (_, k) => ({ k, s: solid(g), face: mk("path", { class: "nf" }, g), leds: [0, 1, 2].map(() => mk("path", { class: "sil" }, g)), sp: spring(0, { k: 90, c: 16, eps: 0.002 }) }));
  // bottom up, so a server slid out is painted over the one below it
  for (const u of units) g.append(u.s.g, u.face, ...u.leds);
  // the cabinet's roof over them all
  const roof = solid(g);
  put(roof, prism(P, front, ...rings(-W - 1, -D - 1, W + 1, D + 0.4, 1, 0.8), TOPZ - 1.4, TOPZ));

  const ring = (c, r) => poly(Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * 2 * Math.PI; return P(c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)); }));
  let clock = 0, on = false;
  function draw() {
    for (const u of units) {
      const z0 = BASE + u.k * U + 0.25, z1 = z0 + U - 0.5, y1 = D + u.sp.x * OUT, f = y1 + 0.02;
      put(u.s, prism(P, front, ...rings(-W, -D, W, y1, 0.6, 0.5), z0, z1));
      // the face: a row of drive bays, then the lights at the right
      u.face.setAttribute("d", Array.from({ length: 5 }, (_, i) => { const x0 = -W + 1 + i * 2.3; return poly([[x0, f, z0 + 1], [x0 + 1.9, f, z0 + 1], [x0 + 1.9, f, z1 - 1], [x0, f, z1 - 1]].map((q) => P(...q))); }).join("") + open([P(W - 3.6, f, z0 + 0.8), P(W - 3.6, f, z1 - 0.8)]));
      u.leds.forEach((l, i) => {
        l.setAttribute("d", ring([W - 2.6 + i * 0.95 - 0.95, f, (z0 + z1) / 2], 0.32));
        // the wave: a crest running down the rack, each light a beat behind the one beside it
        const lit = on && Math.sin(clock * pace - (N - u.k) * 0.9 - i * 0.6) > 0.35;
        l.classList.toggle("hi", lit);
      });
    }
  }
  draw();

  const B = register(stage, (dt) => { let m = false; for (const u of units) if (stepS(u.sp, dt)) m = true; if (on && !reducedMotion()) clock += dt; draw(); return m || on; });
  bag.add(B.unregister);

  let out = null;
  function point(q) {
    on = !!q;
    let pick = null;
    if (q) {
      // the server at the pointer's height on the cabinet's face
      const zs = units.map((u) => P(0, D, BASE + u.k * U + U / 2)[1]), k = zs.reduce((b, z, i) => (Math.abs(z - q[1]) < Math.abs(zs[b] - q[1]) ? i : b), 0);
      pick = units[k];
      read.textContent = `server ${N - k} · ${Math.round(35 + 60 * Math.abs(Math.sin(k * 2.1 + 1)))}% load`;
    } else read.textContent = "rest";
    for (const u of units) u.sp.t = u === pick ? 1 : 0;
    if (pick !== out) { if (out) out.s.sil.classList.remove("hi"); out = pick; if (pick) pick.s.sil.classList.add("hi"); }
    if (!on) draw();
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pace = clamp(v, 1, 20); }, destroy: bag.dispose };
}

hairline({
  name: "rack",
  means: "A server rack: bring the pointer near and its lights blink in a wave and the server at the pointer's height slides out; leave and it rests.",
  rules: [1, 3, 7, 9],
  range: [3, 6, 11],
  mount,
});
