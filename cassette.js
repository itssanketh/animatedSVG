/**
 * Cassette: an audio cassette standing face on, its shell with a screw at each corner, a label across the top, a window
 * in the middle and through it the two reels, each a toothed hub inside its pack of wound tape, the tape running from
 * one pack down round the guides along the bottom and up to the other, and the head opening below. Bring the pointer
 * over it and it plays: the hubs turn and the tape winds from the left pack onto the right, the one shrinking as the
 * other grows; hold the pointer to the right and it fast-forwards, to the left and it rewinds. Leave and it spins down
 * and stops where it is. The window takes the bright edge while it runs. The read-out says what it is doing and where
 * on the tape it is; the slider is how fast it winds.
 *
 * The shell is a thin plate, the hull of its two faces with its face toward you inside it; everything else is open
 * lines on that face. The pointer's place across the shell picks play, fast-forward or rewind.
 */
const { clamp, hull, mk, open, poly, register, spring, stepS, disposer, pointer } = HL;

const K = 128, CX = 200, CY = 160, W = 1, H = 0.64, T = 7, HUB = 0.3, RMIN = 0.09, RMAX = 0.19, SIDE = 30 * 60;
const S = (u, v, d = T) => [CX + u * K - d * 0.3, CY - v * K + d * 0.3];
const round = (x0, y0, x1, y1, r, n = 5) => [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, 1], [x0 + r, y0 + r, 2], [x1 - r, y0 + r, 3]]
  .flatMap(([cx, cy, k]) => Array.from({ length: n }, (_, i) => { const a = (k + i / (n - 1)) * Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }));
const disc = (c, r, n = 32) => Array.from({ length: n }, (_, k) => [c[0] + r * Math.cos((k / n) * 2 * Math.PI), c[1] + r * Math.sin((k / n) * 2 * Math.PI)]);

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let fast = value;
  const g = mk("g", {}, svg);
  const shell = round(-W, -H, W, H, 0.07), outline = mk("path", { class: "sil" }, g), face = mk("path", { class: "sil" }, g);
  outline.setAttribute("d", poly(hull([...shell.map(([u, v]) => S(u, v, 0)), ...shell.map(([u, v]) => S(u, v))])));
  face.setAttribute("d", poly(shell.map(([u, v]) => S(u, v))));
  const lines = mk("path", { class: "nf" }, g);
  const pts = (ps) => ps.map(([u, v]) => S(u, v));
  // the label, the window, the head opening's trapezoid with its holes, the screws
  const win = round(-0.5, -0.17, 0.5, 0.2, 0.06);
  lines.setAttribute("d", [
    poly(pts(round(-0.88, -0.27, 0.88, 0.54, 0.05))),
    poly(pts([[-0.62, -H], [0.62, -H], [0.52, -0.4], [-0.52, -0.4]])),
    ...[-0.38, -0.13, 0.13, 0.38].map((u) => poly(pts(disc([u, -0.53], 0.035, 12)))),
    ...[[-0.92, 0.56], [0.92, 0.56], [-0.92, -0.56], [0.92, -0.56], [0, -0.32]].map((c) => poly(pts(disc(c, 0.03, 12))) + open(pts([[c[0] - 0.02, c[1]], [c[0] + 0.02, c[1]]]))),
  ].join(""));
  const windowEl = mk("path", { class: "nf" }, g);
  windowEl.setAttribute("d", poly(pts(win)));
  const packs = mk("path", { class: "nf" }, g), tape = mk("path", { class: "nf" }, g), hubs = mk("path", { class: "sil" }, g), teeth = mk("path", { class: "nf" }, g);

  const speed = spring(0, { k: 10, c: 6, eps: 0.0005 });
  let pos = 0.3, rotL = 0, rotR = 0, mode = "rest";
  const radii = () => { const A = RMAX * RMAX - RMIN * RMIN; return [Math.sqrt(RMIN * RMIN + (1 - pos) * A), Math.sqrt(RMIN * RMIN + pos * A)]; };
  function draw() {
    const [rL, rR] = radii(), L = [-HUB, 0.02], R = [HUB, 0.02];
    packs.setAttribute("d", poly(pts(disc(L, rL, 48))) + poly(pts(disc(R, rR, 48))));
    // the tape: off the bottom of each pack, round a guide at each lower corner, along the bottom past the head
    tape.setAttribute("d", open(pts([[L[0] - rL * 0.3, L[1] - rL], [-0.7, -0.36], [-0.6, -0.42], [0.6, -0.42], [0.7, -0.36], [R[0] + rR * 0.3, R[1] - rR]])));
    hubs.setAttribute("d", poly(pts(disc(L, 0.075, 24))) + poly(pts(disc(R, 0.075, 24))));
    teeth.setAttribute("d", [[L, rotL], [R, rotR]].flatMap(([c, a]) => Array.from({ length: 6 }, (_, k) => { const t = a + (k * Math.PI) / 3; return open(pts([[c[0] + 0.035 * Math.cos(t), c[1] + 0.035 * Math.sin(t)], [c[0] + 0.07 * Math.cos(t), c[1] + 0.07 * Math.sin(t)]])); })).join(""));
  }
  draw();
  const clock = () => { const s = Math.round(pos * SIDE); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  const B = register(stage, (dt) => {
    const m = stepS(speed, dt);
    // tape runs at a steady speed past the head, so each hub turns faster the less tape it holds
    const v = speed.x * 0.006, [rL, rR] = radii();
    pos = clamp(pos + v * dt * 6, 0, 1);
    if ((pos === 0 && speed.x < 0) || (pos === 1 && speed.x > 0)) speed.x = speed.t = 0;
    rotL -= (v / rL) * dt * 60; rotR -= (v / rR) * dt * 60;
    draw();
    read.textContent = mode === "rest" ? (Math.abs(speed.x) > 0.02 ? "stopping · " + clock() : "rest") : `${mode} · ${clock()}`;
    return m || Math.abs(speed.x) > 0.0005;
  });
  bag.add(B.unregister);

  function point(q) {
    if (q) {
      const u = (q[0] - CX) / K;
      mode = u > 0.45 ? "fast forward" : u < -0.45 ? "rewind" : "play";
      speed.t = mode === "play" ? 1 : mode === "rewind" ? -fast : fast;
    } else { mode = "rest"; speed.t = 0; }
    windowEl.classList.toggle("hi", !!q);
    B.wake();
  }
  point(null);
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { fast = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "cassette",
  means: "A cassette: bring the pointer over it and the reels wind the tape across; to the right it fast-forwards, to the left it rewinds.",
  rules: [1, 7, 8, 10],
  range: [3, 6, 10],
  mount,
});
