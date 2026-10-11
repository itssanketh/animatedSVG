/**
 * Cloud: a rain cloud, face on, a heap of round puffs over a flat underside, above a strip of ground. Bring the pointer
 * near and it rains: the cloud drifts over to stand above the pointer and drops fall from its underside to the ground,
 * where a puddle spreads under it; leave and the rain stops, the last drops land, the cloud drifts back and the puddle
 * dries. The cloud takes the bright edge while it rains. The read-out says how hard it is raining; the slider is how
 * many drops fall a second.
 *
 * The cloud's outline is the edge of the union of its puffs, traced round its centre; each drop is a short slanted
 * line; the ground is a line and the puddle half an ellipse. The pointer's place across the stage sets where the cloud
 * goes.
 */
const { clamp, mk, open, poly, spring, stepS, reducedMotion, disposer, pointer, register } = HL;

const CY = 110, GROUND = 272, SLANT = 0.18;
const PUFFS = [[-62, 14, 34], [-24, -12, 44], [26, -20, 50], [68, 6, 36], [0, 18, 30], [-40, 22, 26], [44, 22, 28]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rate = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const ground = el("nf"), puddle = el("nf"), drops = el("nf"), cloud = el("sil"), inner = el("nf");
  ground.setAttribute("d", open([[24, GROUND], [376, GROUND]]));

  /** The cloud's outline about x: for each angle, the furthest edge of any puff along that ray, the bottom cut flat. */
  const outline = (cx) => Array.from({ length: 144 }, (_, k) => {
    const t = (k / 144) * 2 * Math.PI, d = [Math.cos(t), Math.sin(t)];
    let r = 0;
    for (const [px, py, pr] of PUFFS) { const b = px * d[0] + py * d[1], c = px * px + py * py - pr * pr, disc = b * b - c; if (disc >= 0) r = Math.max(r, b + Math.sqrt(disc)); }
    if (d[1] > 0) r = Math.min(r, 34 / d[1]);
    return [cx + r * d[0], CY + r * d[1]];
  });
  const x = spring(200, { k: 14, c: 7.5, eps: 0.05 }), wet = spring(0, { k: 3, c: 3.4, eps: 0.002 });
  let on = false, owed = 0, rain = [];
  function draw() {
    cloud.setAttribute("d", poly(outline(x.x)));
    // a fold or two inside, where the puffs overlap
    inner.setAttribute("d", open(Array.from({ length: 12 }, (_, k) => { const t = Math.PI * (1.15 + (k / 11) * 0.7); return [x.x - 24 + 30 * Math.cos(t), CY - 2 + 30 * Math.sin(t)]; })));
    drops.setAttribute("d", rain.map((d) => open([[d.x, d.y], [d.x - SLANT * 10, d.y + 10]])).join(""));
    const w = wet.x * 70;
    puddle.setAttribute("d", w > 1 ? open(Array.from({ length: 25 }, (_, k) => { const t = Math.PI * (k / 24); return [x.x + w * Math.cos(t), GROUND + 1 + w * 0.12 * Math.sin(t)]; })) : "");
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(x, dt), stepS(wet, dt)].some(Boolean);
    if (on && !reducedMotion()) {
      owed += rate * dt;
      while (owed >= 1) { owed--; rain.push({ x: x.x + (Math.random() - 0.5) * 140, y: CY + 32, v: 260 + Math.random() * 80 }); }
    }
    for (const d of rain) { d.y += d.v * dt; d.x -= d.v * dt * SLANT; }
    rain = rain.filter((d) => d.y < GROUND - 10);
    draw();
    read.textContent = on ? `raining · ${rate < 15 ? "a drizzle" : rate < 35 ? "steady rain" : "a downpour"}` : rain.length || wet.x > 0.02 ? "clearing" : "rest";
    return m || on || rain.length > 0;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    x.t = q ? clamp(q[0], 112, 286) : 200;
    wet.t = on ? 1 : 0;
    cloud.classList.toggle("hi", on);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

hairline({
  name: "cloud",
  means: "A rain cloud: bring the pointer near and it drifts over and rains, a puddle spreading below; leave and it stops and drifts back.",
  rules: [1, 7, 8, 10],
  range: [8, 24, 50],
  mount,
});
