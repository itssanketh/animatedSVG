/**
 * Mouse: a computer mouse seen from above, traced from a photograph: the body broad at the front and narrowing a
 * little to a rounded back, the seam between its two buttons, the slot down the middle with the scroll wheel in it, a
 * grip line down each side and the cable running out of its nose. Bring the pointer near and it follows it: the mouse
 * slides over toward the pointer, turning a little the way it goes, its cable dragging after it, and its wheel's
 * ridges roll as it moves; leave and it slides back to the middle and settles. The body takes the bright edge while it
 * moves. The read-out gives its place on the screen it is driving; the slider is how quickly it follows.
 *
 * The outline is the photograph's measured half-widths, row by row, mirrored about the middle; the seam, slot, grips
 * and wheel are lines on it; the cable is a curve from the nose to the top of the stage. The pointer's place sets the
 * mouse's, within a box round the middle.
 */
const { clamp, lerp, mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

// measured from the photograph (740 px square, the mouse's middle at x 367): half-width at each row
const ROWS = [[100, 0], [101, 24], [103, 40], [107, 58], [116, 82], [130, 106], [150, 129], [170, 142], [190, 150], [210, 155], [250, 158], [290, 157], [330, 154], [370, 150], [410, 144], [450, 139], [490, 135], [530, 130], [565, 125], [590, 114], [612, 98], [627, 79], [636, 58], [643, 36], [647, 16], [648, 0]];
const K = 0.36, MX = 367, MY = 375, CX = 200, CY = 168;
/** The half-width at row y: a smooth curve (Catmull-Rom) through the measured rows. */
const half = (y) => { for (let i = 1; i < ROWS.length; i++) if (y <= ROWS[i][0]) { const p0 = ROWS[Math.max(0, i - 2)][1], p1 = ROWS[i - 1][1], p2 = ROWS[i][1], p3 = ROWS[Math.min(ROWS.length - 1, i + 1)][1], t = (y - ROWS[i - 1][0]) / (ROWS[i][0] - ROWS[i - 1][0]); return Math.max(0, 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t)); } return 0; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const cable = el("nf"), body = el("sil"), lines = el("nf"), slot = el("sil"), wheel = el("sil"), ridges = el("nf");
  const x = spring(0, { k: value, c: 2 * Math.sqrt(value), eps: 0.05 }), y = spring(0, { k: value, c: 2 * Math.sqrt(value), eps: 0.05 }), turn = spring(0, { k: 30, c: 10, eps: 0.002 });
  let roll = 0, lx = 0, ly = 0;
  function draw() {
    const c = Math.cos(turn.x), s = Math.sin(turn.x);
    // photograph pixels to the stage: about the mouse's middle, scaled, turned, then moved
    const T = ([px, py]) => { const u = (px - MX) * K, v = (py - MY) * K; return [CX + x.x + u * c - v * s, CY + y.x + u * s + v * c]; };
    const ys = Array.from({ length: 90 }, (_, i) => 100 + 548 * (0.5 - 0.5 * Math.cos((Math.PI * i) / 89)));
    body.setAttribute("d", poly([...ys.map((py) => [MX + half(py), py]), ...ys.slice().reverse().map((py) => [MX - half(py), py])].map(T)));
    // the seam between the buttons, from the nose to the slot, and the grip line down each side
    const grip = (sg) => open(Array.from({ length: 13 }, (_, i) => { const py = 150 + i * 37; return [MX + sg * (half(py) - lerp(30, 14, i / 12)), py]; }).map(T));
    lines.setAttribute("d", open([[MX, 102], [MX, 140]].map(T)) + grip(-1) + grip(1));
    // the slot: rounded at the top, drawn to a point at the bottom, the wheel in its upper part
    const sl = [...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1 + i / 8); return [MX + 33 * Math.cos(a), 168 + 33 * Math.sin(a)]; }), [MX + 33, 250], [MX + 22, 320], [MX, 365], [MX - 22, 320], [MX - 33, 250]];
    slot.setAttribute("d", poly(sl.map(T)));
    const wheelPts = [[MX - 16, 180], [MX + 16, 180], [MX + 16, 246], [MX - 16, 246]];
    wheel.setAttribute("d", poly(wheelPts.map(T)));
    // the wheel's ridges: lines across it, spaced by how the curve of the wheel foreshortens them, rolling
    ridges.setAttribute("d", Array.from({ length: 9 }, (_, i) => { const a = (((i / 9) * Math.PI + roll) % Math.PI + Math.PI) % Math.PI, py = 213 - 30 * Math.cos(a); return open([[MX - 13, py], [MX + 13, py]].map(T)); }).join(""));
    // the cable: out of the nose and up to the top, bending as the mouse moves under it
    const nose = T([MX, 100]), end = [CX + x.x * 0.3, 0], mid = [lerp(nose[0], end[0], 0.5) - x.x * 0.3, lerp(nose[1], end[1], 0.5)];
    cable.setAttribute("d", open(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [0, 1].map((j) => (1 - t) * (1 - t) * nose[j] + 2 * (1 - t) * t * mid[j] + t * t * end[j]); })));
  }
  draw();

  const B = register(stage, (dt) => {
    // it turns a little toward the way it is going, as a hand turns it, and straightens as it arrives
    turn.t = clamp((x.t - x.x) * 0.006, -0.3, 0.3);
    const m = [stepS(x, dt), stepS(y, dt), stepS(turn, dt)].some(Boolean);
    roll += (Math.hypot(x.x - lx, y.x - ly) / 30) * Math.sign(y.x - ly || 1); lx = x.x; ly = y.x;
    draw();
    return m;
  });
  bag.add(B.unregister);

  function point(q) {
    if (q) {
      x.t = clamp(q[0] - CX, -110, 110); y.t = clamp(q[1] - CY, -35, 35);
      read.textContent = `x ${Math.round(((x.t + 110) / 220) * 1920)} · y ${Math.round(((y.t + 35) / 70) * 1080)}`;
    } else { x.t = 0; y.t = 0; read.textContent = "rest"; }
    body.classList.toggle("hi", !!q);
    B.wake();
  }
  point(null);

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { for (const s of [x, y]) { s.k = v; s.c = 2 * Math.sqrt(v); } }, destroy: bag.dispose };
}

hairline({
  name: "mouse",
  means: "A computer mouse from above: bring the pointer near and it slides after it, turning, its wheel rolling; leave and it slides home.",
  rules: [1, 7, 8, 10],
  range: [12, 30, 70],
  mount,
});
