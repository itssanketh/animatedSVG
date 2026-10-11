/**
 * Zangetsu: Ichigo's sword from Bleach in its first released form, a cleaver of a blade with no guard, its tip cut on
 * the slant, its hilt bound in crossed wrapping and a strip of cloth hanging from the pommel. It is held up and back,
 * ready. Bring the pointer near and it swings: the blade sweeps round toward the pointer, curved swing lines trailing
 * the sweep, the cloth flying out behind, and as it comes through, a crescent of energy, the Getsuga Tenshō, flies off
 * the edge toward the pointer and spreads as it goes; leave and it swings back up to ready. The blade takes the bright
 * edge in the swing. The read-out names the move; the slider is how hard it swings.
 *
 * The blade and hilt are closed shapes turned about the grip; the swing lines are arcs behind the blade's path, longer
 * the faster it moves, the curved swing-line technique of anime motion; the crescent is two arcs; the cloth flows.
 */
const { clamp, lerp, mk, open, poly, rad, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const PV = [120, 232], READY = rad(-100), LO = rad(-68), HI = rad(4);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let force = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const swing = el("nf"), wave = el("sil"), cloth = el("sil"), hilt = el("sil"), wrap = el("nf"), blade = el("sil"), edge = el("nf");
  const a = spring(READY, { k: 60, c: 9, eps: 0.002 });
  let clock = 0, slashes = [], fired = false, aim = READY;
  const rot = (t) => ([x, y]) => [PV[0] + x * Math.cos(t) - y * Math.sin(t), PV[1] + x * Math.sin(t) + y * Math.cos(t)];
  function draw() {
    const R = rot(a.x);
    // the blade: broad, its back straight, its tip cut on the slant; the hilt bound in crossed wrapping
    // measured from the reference (blade axis from the base of the blade to its point, t across it, the edge side
    // positive): the back runs nearly straight to the point, the edge bows out, the hilt sits toward the back
    const L = ([s0, t0]) => [(s0 + 35) * 1.1, (t0 + 22) * 1.1];
    const SPINE = [[-10, -21], [9, -17], [36, -12.4], [81.5, -4.8], [125, -1.9], [160, -0.5]];
    const EDGE = [[160.5, 0.9], [145, 6], [130, 11.2], [110, 16], [90, 18.6], [70, 20.5], [48.6, 21.4], [22.6, 20.4], [4.8, 18.5]];
    blade.setAttribute("d", poly([...SPINE, ...EDGE].map(L).map(R)));
    edge.setAttribute("d", open(EDGE.slice(1, -1).map(([s0, t0]) => [s0, t0 - 4]).map(L).map(R)));
    const HILT = (s0, t0) => L([s0, lerp(-19, -26, (-12 - s0) / 47) + t0]);
    hilt.setAttribute("d", poly([HILT(-7, -4.5), HILT(-59, -4.5), HILT(-59, 4.5), HILT(-7, 4.5)].map(R)));
    wrap.setAttribute("d", Array.from({ length: 6 }, (_, i) => { const a0 = -14 - i * 7.5, a1 = a0 - 7.5; return open([HILT(a0, -4.5), HILT(a1, 4.5)].map(R)) + open([HILT(a0, 4.5), HILT(a1, -4.5)].map(R)); }).join(""));
    // the cloth from the pommel, flowing back from the way the blade moves
    const v = a.v, back = clamp(-v * 0.18, -1, 1);
    cloth.setAttribute("d", poly([...Array.from({ length: 12 }, (_, i) => { const u = i / 11, w = Math.sin(u * 6 - clock * 9) * 4 * u; return [-25 - u * 38, -9 + w + back * u * u * 50 + u * 10]; }), ...Array.from({ length: 12 }, (_, i) => { const u = 1 - i / 11, w = Math.sin(u * 6 - clock * 9) * 4 * u; return [-25 - u * 38, 0 + w + back * u * u * 50 + u * 10]; })].map(R)));
    // swing lines: arcs behind the blade along its sweep, as long as it is fast
    const span = clamp(-v * 0.09, -0.9, 0.9);
    swing.setAttribute("d", Math.abs(span) < 0.04 ? "" : [120, 160, 200, 232].map((r) => open(Array.from({ length: 14 }, (_, i) => { const t = a.x + span * (i / 13) * (r / 232); return [PV[0] + r * Math.cos(t), PV[1] + r * Math.sin(t)]; }))).join(""));
    // the Getsuga Tensho: crescents flying off along the line of the cut, spreading as they go
    wave.setAttribute("d", slashes.map((s) => { const c = [PV[0] + s.d * Math.cos(s.t), PV[1] + s.d * Math.sin(s.t)], n = [Math.cos(s.t), Math.sin(s.t)], p = [-n[1], n[0]], w = s.w;
      const arc = (bulge) => Array.from({ length: 17 }, (_, i) => { const u = (i / 16) * 2 - 1; return [c[0] + p[0] * u * w + n[0] * bulge * (1 - u * u), c[1] + p[1] * u * w + n[1] * bulge * (1 - u * u)]; });
      return poly([...arc(w * 0.55), ...arc(w * 0.18).reverse()]); }).join(""));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = stepS(a, dt);
    if (!reducedMotion()) clock += dt;
    // as the blade comes through toward the pointer, loose a crescent once
    if (!fired && Math.abs(a.v) > 2 && Math.abs(a.x - aim) < 0.25) { fired = true; slashes.push({ t: aim, d: 190, w: 44 }); }
    for (const s of slashes) { s.d += 420 * dt * force; s.w += 110 * dt; }
    slashes = slashes.filter((s) => s.d < 330 && PV[0] + s.d * Math.cos(s.t) < 430 && PV[1] + s.d * Math.sin(s.t) > -30);
    draw();
    return m || slashes.length > 0 || Math.abs(a.v) > 0.05;
  });
  bag.add(B.unregister);

  let on = false;
  function point(q) {
    const was = on; on = !!q;
    if (q) {
      const t = clamp(Math.atan2(q[1] - PV[1], q[0] - PV[0]), LO, HI);
      if (!was) fired = false;
      aim = t;
      // from up and back at the ready, the blade sweeps down onto the pointer's line
      a.k = 60 * force; a.c = 9 * Math.sqrt(force); a.t = aim;
      read.textContent = "Getsuga Tenshō";
    } else { a.t = READY; a.k = 40; a.c = 9; read.textContent = "rest"; }
    blade.classList.toggle("hi", on);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { force = v; }, destroy: bag.dispose };
}

hairline({
  name: "zangetsu",
  means: "Ichigo's Zangetsu: bring the pointer near and it swings, swing lines trailing, and looses a Getsuga Tenshō; leave and it readies.",
  rules: [1, 7, 8, 10],
  range: [0.6, 1, 1.5],
  mount,
});
