/**
 * Devil fruit: the Gum-Gum Fruit from One Piece, face on: a round fruit covered in swirls, a curled stem and a leaf on
 * top. The fruit that turned Luffy to rubber is rubber itself here: bring the pointer near and it stretches out toward
 * it like rubber, the swirls on its skin carried round as it turns, twist lines wrapping about it; leave and it snaps
 * back, wobbling, and settles round again. The fruit takes the bright edge while it stretches. The read-out says how
 * far it is stretched; the slider is how far it can stretch.
 *
 * The fruit is a circle drawn as a sphere: each swirl sits at a latitude and longitude on it and is drawn only on the
 * near side, squashed as it turns away; the whole is then stretched along the line to the pointer. The stem is a curl
 * and the leaf a closed curve; the twist lines are arcs round the fruit, the twist-wrap technique of anime motion.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const CX = 200, CY = 176, R = 88, TAU = 2 * Math.PI;
// swirls on the skin: latitude, longitude, size
// the skin is covered in swirls, as the real fruit is: spread evenly over the sphere on a golden spiral
const SWIRLS = Array.from({ length: 46 }, (_, k) => { const z = 1 - (2 * (k + 0.5)) / 46; return [Math.asin(z), k * 2.39996, 0.36]; });

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let most = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const wraps = el("nf"), body = el("sil"), swirls = el("nf"), stem = el("nf"), leaf = el("sil"), vein = el("nf");
  const st = spring(1, { k: 90, c: 5, eps: 0.002 }), spin = spring(0, { k: 6, c: 5, eps: 0.003 });
  let ang = 0, turn = 0, clock = 0, on = false;
  function draw() {
    const u = [Math.cos(ang), Math.sin(ang)], s = st.x, thin = 1 / Math.sqrt(Math.max(0.4, s));
    // rubber: stretched along the line to the pointer, thinner across it, keeping its volume
    const S = ([x, y]) => { const a = x * u[0] + y * u[1], b = -x * u[1] + y * u[0], A = a * s + (s - 1) * R * 0.35, Bb = b * thin; return [CX + A * u[0] - Bb * u[1], CY + A * u[1] + Bb * u[0]]; };
    body.setAttribute("d", poly(Array.from({ length: 96 }, (_, k) => { const t = (k / 96) * TAU; return S([R * Math.cos(t), R * Math.sin(t) * 0.96]); })));
    // each swirl: a little spiral on the sphere's skin, drawn while it faces you
    swirls.setAttribute("d", SWIRLS.map(([lat, lon, size]) => {
      const L = lon + turn, facing = Math.cos(L) * Math.cos(lat);
      if (facing < 0.42) return "";
      const cx = R * Math.sin(L) * Math.cos(lat), cy = -R * Math.sin(lat), sx = Math.cos(L), sy = Math.cos(lat);
      return open(Array.from({ length: 34 }, (_, i) => { const t = (i / 33) * 2.2 * TAU, r = (i / 33) * size * R * 0.5; return S([cx + r * Math.cos(t) * sx, cy + r * Math.sin(t) * sy]); }));
    }).join(""));
    // the stem: a curl up from the top, and a leaf off it
    const top = [0, -R * 0.96];
    stem.setAttribute("d", open([...Array.from({ length: 8 }, (_, i) => [top[0] + i * 0.4, top[1] - i * 2.6]), ...Array.from({ length: 22 }, (_, i) => { const t = Math.PI + (i / 21) * 1.6 * TAU, r = 10 * (1 - i / 26); return [top[0] + 3 + 10 + r * Math.cos(t), top[1] - 22 + r * Math.sin(t)]; })].map(S)));
    const lf = Array.from({ length: 24 }, (_, i) => { const t = (i / 23) * Math.PI; return [top[0] - 4 - 34 * (i / 23), top[1] - 14 - 12 * Math.sin(t) + 6 * (i / 23)]; });
    const lf2 = Array.from({ length: 24 }, (_, i) => { const t = (i / 23) * Math.PI; return [top[0] - 4 - 34 * (i / 23), top[1] - 14 + 4 * Math.sin(t) + 6 * (i / 23)]; });
    leaf.setAttribute("d", poly([...lf, ...lf2.reverse()].map(S)));
    vein.setAttribute("d", open([[top[0] - 4, top[1] - 14], [top[0] - 36, top[1] - 9]].map(S)));
    // twist lines: arcs wrapping round the fruit, turning with it, only while it is stretched and spinning
    const w = Math.min(1, Math.abs(spin.x) * 2 + (s - 1) * 2);
    wraps.setAttribute("d", w < 0.05 ? "" : [0, 1, 2].map((k) => { const tilt = 0.5 + k * 0.35, ph = clock * 4 + k * 2.1; return open(Array.from({ length: 30 }, (_, i) => { const t = ph + (i / 29) * Math.PI * 0.9 * w, x = (R + 14 + k * 6) * Math.cos(t), y = (R + 14 + k * 6) * Math.sin(t) * 0.32; return S([x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]); })); }).join(""));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(st, dt), stepS(spin, dt)].some(Boolean);
    if (!reducedMotion()) { turn += spin.x * dt; clock += dt * Math.min(1, Math.abs(spin.x) + Math.abs(st.x - 1) * 4); }
    draw();
    return m || Math.abs(spin.x) > 0.003;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (q) {
      const dx = q[0] - CX, dy = q[1] - CY, d = Math.hypot(dx, dy);
      ang = Math.atan2(dy, dx); st.t = lerp(1, lerp(most, Math.min(most, 1.3), Math.abs(Math.sin(ang))), clamp((d - 40) / 140, 0, 1)); spin.t = 1.4;
      read.textContent = `stretching · ${Math.round(st.t * 100)}%`;
    } else { st.t = 1; spin.t = 0; read.textContent = "rest"; }
    body.classList.toggle("hi", on);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { most = v; }, destroy: bag.dispose };
}

hairline({
  name: "devilfruit",
  means: "The Gum-Gum Fruit: bring the pointer near and it stretches toward you like rubber, swirls turning; leave and it snaps back, wobbling.",
  rules: [1, 2, 7, 8],
  range: [1.2, 1.45, 1.75],
  mount,
});
