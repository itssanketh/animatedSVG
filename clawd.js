/**
 * Clawd: the Claude Code mascot, a small blocky creature: a wide body, two tall eyes on its front, a stub of an arm
 * on each side and four short legs. Bring the pointer over it and it perks up: its eyes slide to look at the pointer,
 * it marches on the spot, legs stepping in pairs and body bobbing, and it waves its arms. Leave and it stands still
 * and looks ahead again. The part under the pointer takes the bright edge. The read-out says where it is looking; the
 * slider is how fast it marches, in steps a second. A tribute: the mascot belongs to Anthropic.
 *
 * Every part is a rounded box, a silhouette and one crease, painted back to front: the far arm and the legs, the
 * body, the near arm, then the eyes on the body's face. The hit test reads the parts' outlines at rest.
 */
const { Cam, clamp, facing, fit, mk, poly, prism, proj, rings, spring, stepS, reducedMotion, disposer, pointer, put, register, solid } = HL;

const U = 4.2, LEG = 2.2 * U, BODY = 5 * U, HW = 5 * U, HD = 1.4 * U, AZ = 20;
const LEGS = [-3.5, -1.5, 1.5, 3.5].map((c) => c * U);
const loops = (d) => (d || "").split("M").filter((s) => s.trim()).map((s) => { const n = s.match(/-?\d*\.?\d+/g).map(Number), out = []; for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]); return out; });
const inPoly = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let pace = value;
  const C = Cam(AZ, 0.5, 5.0);
  fit(C, [[-HW - 1.4 * U, -HD, 0], [HW + 1.4 * U, HD, 0], [-HW, HD, 0], [HW, -HD, 0], [-HW, -HD, LEG + BODY + 3], [HW, HD, LEG + BODY + 3]], 200, 170);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const box = (x0, y0, x1, y1, r = 1.4) => rings(x0, y0, x1, y1, r, Math.min(0.9, r * 0.6));

  // the parts, in paint order
  const farArm = solid(g), legs = LEGS.map(() => solid(g)), body = solid(g), nearArm = solid(g);
  const eyes = mk("path", { class: "sil" }, g);
  const parts = [{ name: "the far arm", el: farArm }, ...legs.map((el, i) => ({ name: `leg ${i + 1}`, el })), { name: "the body", el: body }, { name: "the near arm", el: nearArm }];

  const alive = spring(0, { eps: 0.002 }), look = spring(0, { eps: 0.01 });
  let clock = 0, last = performance.now();
  /** Draws the creature at a pose: legs lifted by step, body bobbed, arms raised, eyes slid sideways by look (-1..1). */
  function pose(step, bob, wave, eye) {
    const lift = (i) => Math.max(0, Math.sin(step + (i % 2) * Math.PI)) * 2.2;
    legs.forEach((el, i) => { const [r, n] = box(LEGS[i] - U / 2, -U / 2, LEGS[i] + U / 2, U / 2, 1); put(el, prism(P, front, r, n, lift(i), LEG + bob)); });
    const z0 = LEG + bob, [br, bi] = box(-HW, -HD, HW, HD, 2);
    put(body, prism(P, front, br, bi, z0, z0 + BODY));
    // the arms: a stub out of each side, half way up, raised by the wave
    const arm = (s, el, w) => { const [r, n] = s < 0 ? box(-HW - 1.2 * U, -U / 2, -HW + 1, U / 2, 0.7) : box(HW - 1, -U / 2, HW + 1.2 * U, U / 2, 0.7); put(el, prism(P, front, r, n, z0 + 1.8 * U + w, z0 + 3 * U + w)); };
    arm(-1, farArm, wave * Math.sin(step * 2) * 3); arm(1, nearArm, wave * Math.sin(step * 2 + 1) * 3);
    // the eyes: two tall slots on the body's face toward you, slid toward where it looks
    const slot = (cx) => { const x0 = cx + eye * 0.8 * U - 0.5 * U, x1 = x0 + U, za = z0 + 2.4 * U, zb = z0 + 4.2 * U, y = HD + 0.01; return poly([P(x0, y, za), P(x1, y, za), P(x1, y, zb), P(x0, y, zb)]); };
    eyes.setAttribute("d", slot(-2.5 * U) + slot(2.5 * U));
  }
  function draw(now) {
    const dt = Math.min(now - last, 50) / 1000; last = now;
    let moving = [stepS(alive, dt), stepS(look, dt)].some(Boolean);
    if (alive.x > 0.001 && !reducedMotion()) { clock += dt * pace * Math.PI; moving = true; }
    const a = alive.x;
    pose(clock, a * Math.abs(Math.sin(clock)) * 1.6, a, look.x);
    return moving;
  }
  pose(0, 0, 0, 0);
  // the outlines at rest, for the hit test; topmost last
  const rest = parts.map((p) => ({ ...p, ls: loops(p.el.sil.getAttribute("d")) }));

  const B = register(stage, () => draw(performance.now()));
  bag.add(B.unregister);

  let lit = null;
  const mid = P(0, 0, LEG + BODY / 2);
  function point(q) {
    const under = q ? rest.slice().reverse().find((p) => p.ls.some((l) => inPoly(q, l))) : null, on = !!q && (under || Math.hypot(q[0] - mid[0], q[1] - mid[1]) < 120);
    alive.t = on ? 1 : 0;
    look.t = on ? clamp((q[0] - mid[0]) / 90, -1, 1) : 0;
    const hot = under ? under.el : null;
    if (hot !== lit) { if (lit) lit.sil.classList.remove("hi"); lit = hot; if (hot) hot.sil.classList.add("hi"); }
    read.textContent = !on ? "rest" : under ? `${under.name}` : look.t < -0.3 ? "looking left" : look.t > 0.3 ? "looking right" : "looking at you";
    last = performance.now(); B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pace = v; }, destroy: bag.dispose };
}

hairline({
  name: "clawd",
  means: "Clawd, the Claude Code mascot: hover it and it marches on the spot, waves its arms and watches the pointer.",
  rules: [1, 4, 7, 9],
  range: [1.2, 2, 3],
  mount,
});
