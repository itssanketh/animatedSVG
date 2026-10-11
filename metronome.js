/**
 * Metronome: a wind-up metronome standing face on, a pyramid of a case on a foot, a slot down its face with a tempo
 * scale beside it, and in the slot a pendulum hung from a pivot near the bottom with a sliding weight on it. Bring the
 * pointer near and it ticks: the pendulum swings side to side, a tick at one end and a tock at the other; move the
 * pointer up or down and the weight slides with it, higher for slower and lower for faster, as on the real thing.
 * Leave and the swing dies away and it stands still. The weight takes the bright edge while it ticks. The read-out says
 * the tempo in beats a minute; the slider is how wide it swings.
 *
 * Every part is a thin plate, the hull of its two faces and its face toward you, painted back to front: the foot,
 * the case, the rod and the weight. The slot and the scale are open lines on the case's face. The pointer's height
 * sets the weight; the hit test is the case at rest.
 */
const { clamp, hull, lerp, mk, open, poly, rad, register, spring, stepS, reducedMotion, disposer, pointer } = HL;

const K = 100, CX = 200, CY = 286, PIV = 0.42, ROD = 1.5, FACE = 16;
const S = (u, v, d) => [CX + u * K - d * 0.3, CY - v * K + d * 0.3];
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let swing = value;
  const g = mk("g", {}, svg);
  const plate = () => ({ away: mk("path", { class: "sil" }, g), toward: mk("path", { class: "sil" }, g) });
  function put(p, pts, d0, t) {
    const f = pts.map(([u, v]) => S(u, v, d0 + t)), b = pts.map(([u, v]) => S(u, v, d0));
    // the plate's outline is the hull of both faces, so its thickness reads as one solid, the face toward you inside it
    p.away.setAttribute("d", poly(hull([...f, ...b])));
    p.toward.setAttribute("d", poly(f));
    return f;
  }
  const foot = plate(), body = plate(), cap = plate();
  put(foot, [[-0.78, 0], [0.78, 0], [0.74, 0.14], [-0.74, 0.14]], 0, FACE + 4);
  const casePts = [[-0.62, 0.14], [0.62, 0.14], [0.2, 2.02], [-0.2, 2.02]];
  const caseFace = put(body, casePts, 2, FACE);
  put(cap, [[-0.24, 2.02], [0.24, 2.02], [0.2, 2.12], [-0.2, 2.12]], 2, FACE);
  // the slot down the face, and the tempo scale beside it: short marks, a longer one every fourth
  const slot = mk("path", { class: "nf" }, g), scale = mk("path", { class: "nf" }, g);
  slot.setAttribute("d", poly([[-0.2, 0.3], [0.2, 0.3], [0.11, 1.86], [-0.11, 1.86]].map(([u, v]) => S(u, v, 2 + FACE))));
  scale.setAttribute("d", Array.from({ length: 14 }, (_, k) => { const v = 0.75 + k * 0.08, x = 0.2 - (v - 0.3) * 0.058 + 0.03; return open([S(x, v, 2 + FACE), S(x + (k % 4 ? 0.05 : 0.1), v, 2 + FACE)]); }).join(""));
  const rod = plate(), weight = plate(), pin = plate();
  put(pin, Array.from({ length: 16 }, (_, k) => [0.035 * Math.cos(k * Math.PI / 8), PIV + 0.035 * Math.sin(k * Math.PI / 8)]), 2 + FACE, 3);

  const amp = spring(0, { k: 4, c: 3.2, eps: 0.002 }), at = spring(1.1, { k: 90, c: 18, eps: 0.002 });
  let phase = 0, side = 0, beats = 0, on = false;
  const bpm = () => Math.round(lerp(208, 40, clamp((at.x - 0.75) / 1.05, 0, 1)));
  function draw() {
    const th = amp.x * Math.sin(phase), d = [Math.sin(th), Math.cos(th)], n = [d[1], -d[0]];
    const along = (s, o) => [d[0] * s + n[0] * o, PIV + d[1] * s + n[1] * o];
    put(rod, [along(-0.12, 0.022), along(ROD, 0.016), along(ROD, -0.016), along(-0.12, -0.022)], 2 + FACE, 1.6);
    const w = at.x - PIV;
    put(weight, [along(w - 0.07, 0.1), along(w - 0.07, -0.1), along(w + 0.07, -0.075), along(w + 0.07, 0.075)], 2 + FACE + 1.6, 3.4);
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(amp, dt), stepS(at, dt)].some(Boolean);
    if (!reducedMotion()) phase += dt * (bpm() / 60) * Math.PI;
    const s = Math.sign(Math.sin(phase));
    if (s && s !== side) { side = s; beats++; }
    draw();
    read.textContent = on ? `${bpm()} bpm · ${beats % 2 ? "tick" : "tock"}` : amp.x > 0.01 ? "winding down" : "rest";
    if (!m && amp.x <= 0.002) { amp.x = 0; draw(); return false; }
    return true;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) {
      // the weight follows the pointer's height along the rod
      const v = (CY - q[1]) / K;
      at.t = clamp(v, 0.75, 1.8);
      amp.t = rad(swing);
    } else amp.t = 0;
    weight.toward.classList.toggle("hi", on);
    body.toward.classList.toggle("hi", !!q && inPoly(q, caseFace));
    if (!q) read.textContent = amp.x > 0.01 ? "winding down" : "rest";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { swing = v; if (on) amp.t = rad(v); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "metronome",
  means: "A metronome: bring the pointer near and the pendulum ticks; raise the pointer to slide the weight up and slow it; leave and it stops.",
  rules: [1, 7, 8, 10],
  range: [14, 22, 30],
  mount,
});
