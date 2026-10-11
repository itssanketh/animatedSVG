/**
 * Ghost: a Pac-Man ghost, standing up as a thick plate over its shadow: the round dome of its head, its wavy skirt, and its big
 * eyes, looking off to the side at rest as the arcade ghosts do. Bring the pointer near and it gives chase: its eyes turn to the
 * pointer and its skirt flaps between its two frames, as the arcade sprite's does. Touch the ghost itself and it is the power
 * pellet: the ghost turns frightened, its eyes shrinking to dots and a wavering mouth showing, trembling; leave and it calms
 * down and looks away again. The ghost takes the bright edge while it is frightened. The slider is how far its eyes turn.
 *
 * The ghost is an upright plate in the x-z plane, one unit thick, its face toward you; it is drawn as its back face, the strips round its
 * edge and its front face. The pointer is read against the ghost's resting outline on screen, which never moves.
 */
const { Cam, fit, proj, hull, poly, open, spring, stepS, tween, tset, tval, tdone, mk, register, pointer, disposer } = HL;

const W = 20, H = 22, D = 3, FLOAT = 3;
// the outline in its own plane, x across and z up: the dome, the sides, and the skirt in one of its two frames
function outline(frame, bob) {
  const dome = Array.from({ length: 49 }, (_, i) => { const a = Math.PI - (i / 48) * Math.PI; return [10 + 10 * Math.cos(a), 12 + 10 * Math.sin(a)]; });
  const skirt = Array.from({ length: 7 }, (_, i) => [W - (i * W) / 6, (i + frame) % 2 ? 0 : 2.4]);
  return [[0, 3], ...dome, [W, 3], ...skirt].map(([x, z]) => [x, z + FLOAT + bob]);
}
const ring = (cx, cz, rx, rz, n = 36) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cz + rz * Math.sin((i / n) * 2 * Math.PI)]);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let turn = value;
  const C = Cam(30, 0.5, 9.5);
  fit(C, [[0, 0, 0], [W, D, 0], [0, D, H + FLOAT + 1], [W, 0, H + FLOAT + 1]], 200, 160);
  const P = proj(C), g = mk("g", {}, svg);
  const shadow = mk("path", { class: "nf lo" }, g), back = mk("path", { class: "sil" }, g), sides = mk("path", { class: "fo" }, g), body = mk("path", { class: "sil" }, g);
  const whites = [0, 1].map(() => mk("path", { class: "" }, g)), pupils = [0, 1].map(() => mk("path", { class: "" }, g)), mouth = mk("path", { class: "nf" }, g);

  const look = [spring(-1), spring(0)], fright = tween(0);
  let frame = 0, clock = 0, on = false, scared = false;
  // the face is the plate's front, y = D; points on it are (x, z)
  const F = ([x, z]) => P(x, D, z), Bk = ([x, z]) => P(x, 0, z);
  function draw(now) {
    const f = tval(fright, now), shake = scared ? Math.sin(clock * 60) * 0.25 : 0, bob = on ? Math.sin(clock * 5) * 0.5 : 0;
    const o = outline(frame, bob).map(([x, z]) => [x + shake, z]);
    shadow.setAttribute("d", poly(ring(10, 0, 8, 1.6, 40).map(([x, y]) => P(x, D / 2 + y, 0))));
    // a plate: the back face, the strips round its edge, the front face
    back.setAttribute("d", poly(o.map(Bk)));
    sides.setAttribute("d", o.map((a, i) => { const b = o[(i + 1) % o.length]; return poly([F(a), F(b), Bk(b), Bk(a)]); }).join(""));
    body.setAttribute("d", poly(o.map(F)));
    // the eyes: whites with pupils turned toward where it looks; frightened, they shrink to dots
    const lx = look[0].x, lz = look[1].x;
    [6.5, 13.5].forEach((ex, i) => {
      const c = [ex + shake + lx * 1.2 * (1 - f), 13 + FLOAT + bob + lz * 0.8 * (1 - f)];
      whites[i].setAttribute("d", f > 0.98 ? "" : poly(ring(c[0], c[1], 2.6 * (1 - f), 3.3 * (1 - f)).map(F)));
      const pr = 1.4 - 0.5 * f, pc = [c[0] + lx * 1.1 * (1 - f), c[1] + lz * 1.2 * (1 - f) + f * 1.5];
      pupils[i].setAttribute("d", poly(ring(pc[0], pc[1], pr, pr, 12).map(F)));
    });
    mouth.setAttribute("d", f < 0.05 ? "" : open(Array.from({ length: 9 }, (_, i) => [4.5 + i * 1.375 + shake, 7.5 + FLOAT + bob + (i % 2 ? 0.9 : -0.9) * f]).map(F)));
  }
  draw(performance.now());

  let last = 0;
  const B = register(stage, (dt, now) => {
    let m = [stepS(look[0], dt), stepS(look[1], dt)].some(Boolean) || !tdone(fright, now);
    if (on) { clock += dt; if (now - last > 160) { frame ^= 1; last = now; } m = true; }
    draw(now);
    return m;
  });
  bag.add(B.unregister);

  // the ghost's resting outline on screen, and where its eyes are
  const rest = hull([...outline(0, 0).map(F), ...outline(0, 0).map(Bk)]), eye = F([10, 13 + FLOAT]);
  const inside = (q, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > q[1]) !== (pts[j][1] > q[1]) && q[0] < ((pts[j][0] - pts[i][0]) * (q[1] - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c; return c; };
  function point(q) {
    const now = performance.now();
    on = !!q; const s = on && inside(q, rest);
    if (s !== scared) { scared = s; tset(fright, s ? 1 : 0, now, 0); body.classList.toggle("hi", s); }
    if (q) { const dx = q[0] - eye[0], dy = q[1] - eye[1], l = Math.hypot(dx, dy) || 1; look[0].t = (dx / l) * turn; look[1].t = (-dy / l) * turn; }
    else { look[0].t = -1; look[1].t = 0; }
    read.textContent = !on ? "rest" : scared ? "frightened" : "chasing";
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { turn = v; }, destroy: bag.dispose };
}

hairline({
  name: "ghost",
  means: "A Pac-Man ghost: its eyes follow the pointer as its skirt flaps; touch it and it turns frightened, trembling; leave and it calms.",
  rules: [1, 4, 7, 8, 10],
  range: [0.5, 0.8, 1],
  mount,
});
