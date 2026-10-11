/**
 * PC case: a mid-tower case standing on the desk: its body on four feet, the mesh front with three intake fans behind it, the vents
 * along the top, the power button, and the glass side panel through which the build shows: the motherboard, the tower cooler with
 * its fan, the memory, the graphics card lying across, and the shroud over the power supply. Bring the pointer near and it is
 * opened: the glass side panel slides off toward you and the build inside lights up, the fans spinning; leave and the panel slides
 * back on and the fans run down. The panel takes the bright edge as it comes off. The read-out says what is happening. The slider is
 * how far the panel slides.
 *
 * The body and the parts inside are prisms of rounded rings, a silhouette and one crease; the glass is drawn as its edges only, so
 * the build shows through it; the fans are rings with turning blades. The pointer is read against the case's resting outline.
 */
const { Cam, fit, proj, facing, rrect, prism, solid, put, hull, ringAt, poly, open, spring, stepS, mk, register, pointer, disposer } = HL;

const blk = (x0, y0, x1, y1, r = 1.5, b = 0.8) => [rrect(x0, y0, x1, y1, r, 4), rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.2, r - b), 4)];
const X = 22, Y = 11, H = 52, GLASS = Y + 0.6;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let far = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-X, -Y, 0], [X, Y + 24, 0], [X, -Y, 0], [-X, Y + 24, 0], [0, 0, H + 2]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  // the feet and the body: the case is open on the glass side, so the body is a shell, its far walls and floor
  [[-X + 3, -Y + 3], [X - 3, -Y + 3], [-X + 3, Y - 3], [X - 3, Y - 3]].forEach(([x, y]) => put(solid(g), prism(P, front, ...blk(x - 2.5, y - 2, x + 2.5, y + 2, 1, 0.5), 0, 1.6)));
  put(solid(g), prism(P, front, ...blk(-X, -Y, X, Y, 2.2, 1), 1.6, H));
  // the build, drawn on the inside of the glass wall: motherboard, cooler, memory, graphics card, shroud
  const side = (x, z) => P(x, Y, z), box2 = (x0, z0, x1, z1) => poly([side(x0, z0), side(x1, z0), side(x1, z1), side(x0, z1)]);
  const build = mk("path", { class: "nf lo" }, g), parts = mk("path", { class: "nf" }, g), fanEls = [mk("path", { class: "nf" }, g), mk("path", { class: "nf" }, g), mk("path", { class: "nf" }, g), mk("path", { class: "nf" }, g)];
  build.setAttribute("d", box2(-16, 18, 10, 48) + [0, 2.4, 4.8, 7.2].map((x) => box2(x, 34, x + 1.2, 46)).join(""));
  // the front mesh and the top vents, and the power button
  mk("path", { class: "nf lo", d: Array.from({ length: 12 }, (_, i) => open([P(X, -Y + 2 + i * 1.6, 4), P(X, -Y + 2 + i * 1.6, H - 4)])).join("") + Array.from({ length: 8 }, (_, i) => open([P(-X + 6 + i * 4, -Y + 3, H), P(-X + 6 + i * 4, Y - 3, H)])).join("") }, g);
  const btn = mk("path", { class: "sil", d: poly(Array.from({ length: 14 }, (_, i) => P(X - 4 + 1.8 * Math.cos((i / 14) * 2 * Math.PI), 1.8 * Math.sin((i / 14) * 2 * Math.PI), H))) }, g);
  // the glass panel: its edges and a glint, sliding out toward you
  const glass = mk("path", { class: "nf sil" }, g), glint = mk("path", { class: "nf lo" }, g);
  const slide = spring(0, { k: 40, c: 10 }), spin = spring(0, { k: 4, c: 3 });
  let a = 0, on = false;
  const fanRing = (cx, cz, r, wall) => Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * 2 * Math.PI; return wall === "front" ? P(X, cx + r * Math.cos(t), cz + r * Math.sin(t)) : side(cx + r * Math.cos(t), cz + r * Math.sin(t)); });
  const fanBlades = (cx, cz, r, wall) => Array.from({ length: 6 }, (_, k) => { const a0 = a + (k / 6) * 2 * Math.PI; return open(Array.from({ length: 5 }, (_, i) => { const t = i / 4, rr = r * (0.25 + 0.7 * t), aa = a0 + t * 0.7; return wall === "front" ? P(X, cx + rr * Math.cos(aa), cz + rr * Math.sin(aa)) : side(cx + rr * Math.cos(aa), cz + rr * Math.sin(aa)); })); }).join("");

  function draw() {
    const s = slide.x;
    // the cooler's fan, the graphics card and the shroud stand out once the panel is off
    parts.setAttribute("d", box2(-12, 24, -2, 44) + box2(-18, 12, 14, 17) + box2(-20, 3, 20, 9));
    fanEls[0].setAttribute("d", poly(fanRing(-7, 34, 6)) + (spin.x > 0.02 ? fanBlades(-7, 34, 6) : ""));
    [12, 26, 40].forEach((z, i) => fanEls[i + 1].setAttribute("d", poly(fanRing(0, z, 6.2, "front")) + (spin.x > 0.02 ? fanBlades(0, z, 6.2, "front") : "")));
    const gy = GLASS + s * far, gz = s * 3;
    glass.setAttribute("d", poly([P(-X + 1, gy, 2.5 + gz), P(X - 1, gy, 2.5 + gz), P(X - 1, gy, H - 1 + gz), P(-X + 1, gy, H - 1 + gz)]));
    glint.setAttribute("d", open([P(-X + 6, gy, H - 8 + gz), P(-X + 16, gy, H - 1 + gz)]) + open([P(-X + 6, gy, H - 15 + gz), P(-X + 24, gy, H - 2 + gz)]));
  }
  draw();

  const B = register(stage, (dt) => {
    const m = [stepS(slide, dt), stepS(spin, dt)].some(Boolean);
    a += dt * spin.x * 14;
    draw();
    glass.classList.toggle("hi", on);
    read.textContent = on ? (slide.x < 0.95 ? "opening" : "panel off · fans on") : slide.x > 0.02 || spin.x > 0.02 ? "closing" : "rest";
    return m || spin.x > 0.003;
  });
  bag.add(B.unregister);

  const outline = hull([...ringAt(P, rrect(-X, -Y, X, Y + 6, 2, 4), 0), ...ringAt(P, rrect(-X, -Y, X, Y + 6, 2, 4), H)]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) { on = !!q && inside(q, outline); slide.t = on ? 1 : 0; spin.t = on ? 1 : 0; btn.classList.toggle("hi", false); B.wake(); }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { far = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "pccase",
  means: "A PC case: bring the pointer near and its glass side panel slides off, the build inside showing and its fans spinning up.",
  rules: [1, 6, 7, 8],
  range: [12, 18, 24],
  mount,
});
