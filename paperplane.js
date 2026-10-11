/**
 * Paper plane: a folded paper plane, its two wings and the keel folded down beneath them, the crease lines along them. At rest it
 * hangs in the air in the middle. Bring the pointer over the stage and it flies to it and circles it, turning to follow its heading
 * and banking into the turn, a dashed trail drawn out behind it; move the pointer and it swoops after it. Leave and it glides back to
 * the middle and levels out. The plane takes the bright edge while it flies. The read-out gives its bank. The slider is its speed.
 *
 * The plane is three flat faces turned in space, by its heading, its climb and its bank, and painted from the farthest to the nearest;
 * the trail is a dashed line through where it has been. The pointer is read on the plane it flies in, which never moves.
 */
const { Cam, fit, proj, unproj, mk, poly, open, spring, stepS, disposer, pointer, register } = HL;

const ALT = 34, E = 70, REST_HEAD = -Math.PI * 0.32, REST_BANK = -0.3;
// the plane in its own frame, nose along +x: the two wings and the keel, and the creases on the wings
const NOSE = [50, 0, 0], TAIL = [-36, 0, 0], LW = [-36, -40, 5], RW = [-36, 40, 5], KEEL = [-30, 0, -14];
const FACES = [[NOSE, LW, TAIL], [NOSE, TAIL, RW], [NOSE, TAIL, KEEL]];
const CREASES = [[NOSE, [-36, -20, 2.5]], [NOSE, [-36, 20, 2.5]]];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let speed = value;
  const C = Cam(45, 0.5, 1.9);
  fit(C, [[-E, -E, 0], [E, E, 0], [E, -E, 0], [-E, E, 0], [0, 0, ALT + 20]], 200, 165);
  const P = proj(C), g = mk("g", {}, svg);
  const shadow = mk("path", { class: "nf lo" }, g), trail = mk("path", { class: "dash" }, g), faces = FACES.map(() => mk("path", { class: "sil" }, g)), creases = mk("path", { class: "nf lo" }, g);
  let x = 0, y = 0, head = REST_HEAD, bank = 0, climb = 0, orbit = 0, on = false, tx = 0, ty = 0;
  const bk = spring(REST_BANK, { k: 30, c: 9 }), hist = [];

  function draw() {
    const ch = Math.cos(head), sh = Math.sin(head), cb = Math.cos(bk.x), sb = Math.sin(bk.x), cp = Math.cos(climb), sp = Math.sin(climb);
    // turned by its bank about the nose line, its climb, then its heading, then placed
    const W = ([px, py, pz]) => { const y1 = py * cb - pz * sb, z1 = py * sb + pz * cb, x2 = px * cp - z1 * sp, z2 = px * sp + z1 * cp; return [x + x2 * ch - y1 * sh, y + x2 * sh + y1 * ch, ALT + z2]; };
    const list = FACES.map((f, i) => { const w = f.map(W); return { i, w, depth: w.reduce((s, p) => s + p[0] + p[1] + p[2] * 0.6, 0) / 3 }; }).sort((a, b) => a.depth - b.depth);
    list.forEach((f, k) => { faces[k].setAttribute("d", poly(f.w.map((p) => P(...p)))); });
    shadow.setAttribute("d", poly([NOSE, LW, TAIL, RW].map(W).map((p) => P(p[0], p[1], 0))));
    creases.setAttribute("d", CREASES.map((c) => open(c.map(W).map((p) => P(...p)))).join(""));
    trail.setAttribute("d", hist.length > 1 ? open(hist.map((p) => P(p[0], p[1], ALT))) : "");
  }
  draw();

  const B = register(stage, (dt) => {
    const m = stepS(bk, dt);
    // aim at a point circling the pointer, or at the middle; turn toward it at a limited rate, and fly on at speed
    if (on) orbit += dt * speed / 26;
    const ax = on ? tx + 26 * Math.cos(orbit) : 0, ay = on ? ty + 26 * Math.sin(orbit) : 0, d = Math.hypot(ax - x, ay - y);
    let turn = 0;
    if (on || d > 1.5) {
      let want = Math.atan2(ay - y, ax - x), diff = want - head; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
      turn = Math.max(-2.6, Math.min(2.6, diff * 4)); head += turn * dt;
      const v = on ? speed : Math.min(speed, d * 3); x += Math.cos(head) * v * dt; y += Math.sin(head) * v * dt;
      x = Math.max(-E, Math.min(E, x)); y = Math.max(-E, Math.min(E, y));
      hist.push([x, y]); if (hist.length > 50) hist.shift();
    } else if (hist.length) hist.shift();
    bk.t = on || d > 1.5 ? Math.max(-0.9, Math.min(0.9, turn * 0.35)) : REST_BANK;
    if (!on && d <= 1.5) { let diff = REST_HEAD - head; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; head += diff * Math.min(1, dt * 3); } climb = 0.1 * Math.sin(orbit * 2) * (on ? 1 : 0);
    draw();
    read.textContent = on || d > 1.5 ? `bank ${Math.round((bk.x * 180) / Math.PI)}°` : "rest";
    return m || on || d > 1.5 || hist.length > 0;
  });
  bag.add(B.unregister);

  function point(q) {
    const w = q ? unproj(C, q[0], q[1], ALT) : null;
    on = !!w;
    if (w) { tx = Math.max(-E + 26, Math.min(E - 26, w[0])); ty = Math.max(-E + 26, Math.min(E - 26, w[1])); }
    faces.forEach((f) => f.classList.toggle("hi", on));
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "paperplane",
  means: "A paper plane: it flies to the pointer and circles it, banking into the turn with a dashed trail; leave and it glides back to the middle.",
  rules: [1, 7, 8],
  range: [40, 60, 85],
  mount,
});
