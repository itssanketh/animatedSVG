/**
 * Database: the database you draw on a diagram, a cylinder banded into three platters, but made of glass, so you see
 * how full it is: a level inside, rows of records stacked under it. Bring the pointer near and it takes writes: blocks
 * of data drop in through the top one after another and each lands on the level and raises it a little; leave and the
 * transaction rolls back, the blocks stop and the level sinks to where it started. The cylinder takes the bright edge
 * while it is writing. The read-out says what it is doing and how full it is; the slider is how many writes a second.
 *
 * The cylinder is its outline and the near halves of its bands; the level is an ellipse with level lines beneath it;
 * each block is a small rounded block. The pointer only switches the writes on.
 */
const { Cam, circ, clamp, fit, lerp, mk, open, poly, prism, proj, put, rings, spring, stepS, reducedMotion, disposer, pointer, register, solid, facing } = HL;

const R = 12, H = 26, BASE = 5, BLOCK = 1.6;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let rate = value;
  const C = Cam(45, 0.5, 7.2);
  fit(C, [[-R, -R, 0], [R, R, 0], [R, -R, 0], [-R, R, 0], [0, 0, H + 12]], 200, 165);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg), pts = (ws) => ws.map((q) => P(...q));
  const eye = [0.612, 0.612, 0.5];
  const ring = (z, r = R, n = 72) => circ(r, n).map((q) => [q.u, q.v, z]);
  const near = (z, r = R) => { const rs = ring(z, r), vis = rs.map((q) => q[0] * eye[0] + q[1] * eye[1] > 0), k = vis.findIndex((v, i) => v && !vis[(i + rs.length - 1) % rs.length]); return open(pts(Array.from({ length: rs.length }, (_, i) => rs[(k + i) % rs.length]).filter((_, i) => vis[(k + i) % rs.length]))); };
  const back = mk("path", { class: "nf lo" }, g), rows = mk("path", { class: "nf lo" }, g), level = mk("path", { class: "nf" }, g), blocksG = mk("g", {}, g);
  const body = mk("path", { class: "nf" }, g), bands = mk("path", { class: "nf" }, g), lid = mk("path", { class: "nf" }, g);
  back.setAttribute("d", poly(pts(ring(0))));
  // the outline: the two sides and the near half of the base; the lid a full ellipse; the bands where the platters meet
  const xs = ring(0).map((q) => P(...q)), left = xs.reduce((a, q) => (q[0] < a[0] ? q : a)), right = xs.reduce((a, q) => (q[0] > a[0] ? q : a));
  body.setAttribute("d", open([left, [left[0], left[1] - (P(0, 0, 0)[1] - P(0, 0, H)[1])]]) + open([right, [right[0], right[1] - (P(0, 0, 0)[1] - P(0, 0, H)[1])]]) + near(0));
  bands.setAttribute("d", near(H / 3) + near((2 * H) / 3));
  lid.setAttribute("d", poly(pts(ring(H))));

  const lv = spring(BASE, { k: 20, c: 9, eps: 0.01 });
  let on = false, owed = 0, blocks = [];
  const cubes = [];
  function draw() {
    level.setAttribute("d", poly(pts(ring(lv.x, R - 0.4))));
    // level lines under the surface: the records already written
    rows.setAttribute("d", Array.from({ length: Math.floor(lv.x / 1.6) }, (_, k) => near(0.8 + k * 1.6, R - 0.4)).join(""));
    while (cubes.length < blocks.length) cubes.push(solid(blocksG));
    cubes.forEach((c, i) => { const b = blocks[i]; c.g.setAttribute("display", b ? "inline" : "none"); if (b) put(c, prism(P, front, ...rings(b.x - BLOCK, b.y - BLOCK, b.x + BLOCK, b.y + BLOCK, 0.4, 0.35), b.z, b.z + BLOCK * 1.2)); });
  }
  draw();
  const full = () => Math.round(((lv.x - 0) / (H - 1)) * 100);

  const B = register(stage, (dt) => {
    const m = stepS(lv, dt);
    if (on && !reducedMotion() && lv.t < H - 2) { owed += rate * dt; while (owed >= 1) { owed--; const a = Math.random() * 2 * Math.PI, r = Math.random() * 6; blocks.push({ x: r * Math.cos(a), y: r * Math.sin(a), z: H + 10, v: 0 }); } }
    for (const b of blocks) { b.v += 60 * dt; b.z -= b.v * dt; if (b.z <= lv.t) { b.done = true; lv.t = Math.min(H - 1, lv.t + 0.55); } }
    blocks = blocks.filter((b) => !b.done && on);
    draw();
    read.textContent = on ? (lv.t >= H - 2 ? "full" : `writing · ${full()}% full`) : lv.x > BASE + 0.05 ? `rolling back · ${full()}% full` : "rest";
    return m || on || blocks.length > 0;
  });
  bag.add(B.unregister);

  function point(q) {
    on = !!q;
    if (!on) { blocks = []; lv.t = BASE; }
    body.classList.toggle("hi", on); lid.classList.toggle("hi", on);
    B.wake();
  }
  point(null);
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = clamp(v, 1, 20); }, destroy: bag.dispose };
}

hairline({
  name: "database",
  means: "A database in glass: bring the pointer near and blocks of data drop in and the level rises; leave and it rolls back to where it was.",
  rules: [1, 2, 7, 8],
  range: [2, 5, 10],
  mount,
});
