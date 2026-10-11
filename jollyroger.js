/**
 * Jolly Roger: the Straw Hat Pirates' flag on its mast, face on: a skull wearing the straw hat over two crossed bones.
 * At rest the air is still and the flag hangs, sagging from its top corner. Bring the pointer near and the wind gets up:
 * the flag lifts and streams out, waves running along it from the mast to its free edge, the skull and bones riding the
 * waves with the cloth, wind lines rushing past; the closer the pointer the harder it blows. Leave and the wind drops
 * and the flag sags back still. The flag takes the bright edge while it flies. The read-out gives the wind; the slider
 * is how hard it can blow.
 *
 * The flag is a sheet warped by a travelling wave, larger toward its free edge, and by a sag; every line of the mark is
 * drawn in the sheet's own coordinates and goes through the same warp, so it ripples with the cloth, the flowing-cloth
 * technique of anime motion. The mast is a slim band with a ball on top.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const PX = 96, TOP = 58, W = 230, H = 150, TAU = 2 * Math.PI;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let most = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const mast = el("sil"), ball = el("sil"), lines = el("nf"), flag = el("sil"), bones = el("sil"), skull = el("sil"), face = el("nf"), hat = el("sil"), band = el("nf");
  mast.setAttribute("d", poly([[PX - 4, TOP - 18], [PX, TOP - 18], [PX, 300], [PX - 4, 300]]));
  ball.setAttribute("d", poly(Array.from({ length: 20 }, (_, k) => [PX - 2 + 7 * Math.cos((k / 20) * TAU), TOP - 24 + 7 * Math.sin((k / 20) * TAU)])));
  const blow = spring(0, { k: 6, c: 5, eps: 0.002 });
  let clock = 0;
  const circ = (cx, cy, rx, ry = rx, n = 28, a0 = 0, a1 = TAU) => Array.from({ length: n }, (_, k) => { const t = a0 + ((a1 - a0) * k) / (n - 1); return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
  function draw() {
    const b = blow.x, sag = 1 - b, amp = lerp(1.5, 13, b);
    // the warp: a wave running out from the mast, growing toward the free edge; and the sag, the free edge drooping
    const Wp = ([fx, fy]) => { const u = fx / W; return [PX + fx * (1 - 0.16 * sag) - amp * 0.25 * u * Math.cos(u * TAU * 1.3 - clock * 6), TOP + fy * (1 - 0.1 * sag * u) + amp * u * Math.sin(u * TAU * 1.3 - clock * 6) + sag * u * u * 46]; };
    const sheet = [...Array.from({ length: 24 }, (_, i) => [(W * i) / 23, 0]), ...Array.from({ length: 10 }, (_, i) => [W, (H * (i + 1)) / 10]), ...Array.from({ length: 24 }, (_, i) => [W - (W * (i + 1)) / 24, H])];
    flag.setAttribute("d", poly(sheet.map(Wp)));
    // the crossed bones: two shafts with a knuckle of two rounds at each end
    const bone = (a, c) => { const d = [c[0] - a[0], c[1] - a[1]], l = Math.hypot(...d), n = [-d[1] / l * 4, d[0] / l * 4]; const end = (p, s) => poly(circ(p[0] + n[0] * 1.1, p[1] + n[1] * 1.1, 6.5, 6.5, 16).map(Wp)) + poly(circ(p[0] - n[0] * 1.1, p[1] - n[1] * 1.1, 6.5, 6.5, 16).map(Wp)); return poly([[a[0] + n[0], a[1] + n[1]], [c[0] + n[0], c[1] + n[1]], [c[0] - n[0], c[1] - n[1]], [a[0] - n[0], a[1] - n[1]]].map(Wp)) + end(a) + end(c); };
    bones.setAttribute("d", bone([62, 42], [170, 134]) + bone([170, 42], [62, 134]));
    // the skull: a round head and a jaw, eyes, nose, teeth
    skull.setAttribute("d", poly([...circ(116, 82, 31, 29, 30, Math.PI * 0.82, Math.PI * 2.18), [137, 112], [134, 120], [98, 120], [95, 112]].map(Wp)));
    face.setAttribute("d", [poly(circ(104, 84, 7.5, 8.5, 18).map(Wp)), poly(circ(128, 84, 7.5, 8.5, 18).map(Wp)), poly([[116, 94], [112, 102], [120, 102]].map(Wp)), ...[104, 112, 120, 128].map((x) => open([[x, 109], [x, 120]].map(Wp))), open([[98, 110], [134, 110]].map(Wp))].join(""));
    // the straw hat: its crown over the skull's top and its brim across the brow, with its band
    hat.setAttribute("d", poly([...circ(116, 62, 50, 8, 30, 0, Math.PI), ...circ(116, 60, 50, 6, 30, Math.PI, TAU)].map(Wp)) + poly([...circ(116, 58, 24, 24, 26, Math.PI, TAU), [140, 60], [92, 60]].map(Wp)));
    band.setAttribute("d", open(circ(116, 52, 24, 3, 20, 0, Math.PI).map(Wp)) + open([[92.5, 52], [92, 58]].map(Wp)) + open([[139.5, 52], [140, 58]].map(Wp)));
    // wind lines past the flag while it blows
    lines.setAttribute("d", b < 0.1 ? "" : [0, 1, 2, 3].map((k) => { const x = PX + 40 + ((clock * 160 + k * 70) % 290), y = TOP + 20 + k * 38 + 8 * Math.sin(clock * 3 + k); return open([[x, y], [Math.min(398, x + 30 * b), y]]); }).join(""));
  }
  draw();

  let target = 0;
  const B = register(stage, (dt) => { const m = stepS(blow, dt); if (!reducedMotion()) clock += dt * (0.3 + blow.x); draw(); return m || blow.x > 0.01; });
  bag.add(B.unregister);

  function point(q) {
    if (q) {
      const d = Math.hypot(q[0] - (PX + W / 2), q[1] - (TOP + H / 2));
      target = most * clamp(1.2 - d / 260, 0.45, 1); blow.t = target;
      read.textContent = `flying the Jolly Roger · wind ${Math.round(8 + 30 * target)} knots`;
    } else { blow.t = 0; read.textContent = "rest"; }
    flag.classList.toggle("hi", !!q);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { most = v; }, destroy: bag.dispose };
}

hairline({
  name: "jollyroger",
  means: "The Straw Hat Jolly Roger: bring the pointer near and the wind gets up and the flag streams and ripples; leave and it sags still.",
  rules: [1, 7, 8, 10],
  range: [0.45, 0.75, 1],
  mount,
});
