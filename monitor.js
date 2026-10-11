/**
 * Monitor: a desktop monitor, face on: the thin bezel round the screen, the stand's neck and its foot, the power light on the
 * bezel's lower edge, and at rest the dark screen with a glint of reflection across it. Bring the pointer near and it switches on:
 * the power light comes on, the screen wakes from a line across its middle, and the desktop draws itself in, the taskbar along the
 * bottom, a row of icons down the left and two windows, one behind the other, while a cursor on the screen follows the pointer.
 * Leave and it goes back to sleep, the picture shrinking to a line and out. The power light takes the bright edge while it is on.
 * The read-out gives the state. The slider is how fast it wakes, in seconds.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face; what is on the screen is lines on the glass.
 * The pointer is read against the monitor's resting outline.
 */
const { mk, open, poly, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const box = (x0, y0, x1, y1, r = 4) => [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]].flatMap(([cx, cy, a0]) => Array.from({ length: 7 }, (_, i) => [cx + r * Math.cos(a0 + (i / 6) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 6) * (Math.PI / 2))]));
const SX0 = 70, SY0 = 44, SX1 = 330, SY1 = 200, D = 10;

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let wake = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = (loop, d0, d1, cls = "sil") => { el("sil").setAttribute("d", poly(loop.map((p) => S(p, d0)))); el("fo").setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); const f = el(cls); f.setAttribute("d", poly(loop.map((p) => S(p, d1)))); return f; };
  // the foot and the neck behind the screen, then the screen's body
  plate(box(132, 246, 268, 262, 7), 0, 14);
  plate([[188, 196], [212, 196], [214, 250], [186, 250]], 2, 8);
  plate(box(SX0 - 8, SY0 - 8, SX1 + 8, SY1 + 14, 6), 4, 4 + D);
  const glass = box(SX0, SY0, SX1, SY1, 2);
  el("nf").setAttribute("d", poly(glass.map((p) => S(p, 4 + D))));
  const led = el("sil"), glint = el("nf lo"), screen = el("nf"), dim = el("nf lo"), wins = [el(""), el("")], text = el("nf lo"), cursor = el("sil");
  const ledLoop = Array.from({ length: 12 }, (_, i) => [SX1 - 4 + 1.8 * Math.cos((i / 12) * 2 * Math.PI), SY1 + 7 + 1.8 * Math.sin((i / 12) * 2 * Math.PI)]);
  led.setAttribute("d", poly(ledLoop.map((p) => S(p, 4 + D))));
  let on = false, t = 0, cur = [200, 120];
  const Z = 4 + D, L = (pts) => open(pts.map((p) => S(p, Z)));
  const rect = (x0, y0, x1, y1) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map((p) => S(p, Z)));

  function draw() {
    // waking: a line across the middle opens to the full screen, then the desktop comes up piece by piece
    const open_ = Math.min(1, t / 0.35), k = Math.max(0, Math.min(1, (t - 0.35) / 0.9));
    glint.setAttribute("d", t > 0.05 ? "" : L([[SX0 + 30, SY1 - 10], [SX0 + 110, SY0 + 10]]) + L([[SX0 + 52, SY1 - 10], [SX0 + 132, SY0 + 10]]));
    if (t <= 0.001) { [screen, dim, cursor, text, ...wins].forEach((e) => e.setAttribute("d", "")); return; }
    const my = (SY0 + SY1) / 2, h = ((SY1 - SY0) / 2 - 2) * open_;
    let d = rect(SX0 + 2, my - Math.max(0.6, h), SX1 - 2, my + Math.max(0.6, h)), dd = "";
    if (k > 0) {
      // the taskbar, the icons, the two windows with their title bars and a few lines of content
      d += L([[SX0 + 2, SY1 - 14], [SX0 + 2 + (SX1 - SX0 - 4) * Math.min(1, k * 2), SY1 - 14]]);
      for (let i = 0; i < 4; i++) if (k > 0.15 + i * 0.08) dd += rect(SX0 + 10, SY0 + 10 + i * 22, SX0 + 24, SY0 + 24 + i * 22);
      const win = (x0, y0, x1, y1, a) => { if (k < a) return ""; const f = Math.min(1, (k - a) / 0.3), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = ((x1 - x0) / 2) * f, hh = ((y1 - y0) / 2) * f; return rect(cx - w, cy - hh, cx + w, cy + hh) + (f > 0.9 ? L([[x0, y0 + 10], [x1, y0 + 10]]) : ""); };
      // each window is opaque, so the front one hides the one behind it
      wins[0].setAttribute("d", win(SX0 + 44, SY0 + 14, SX0 + 190, SY0 + 104, 0.35)); wins[1].setAttribute("d", win(SX0 + 110, SY0 + 46, SX1 - 18, SY1 - 26, 0.55));
      text.setAttribute("d", k > 0.85 ? [0, 1, 2, 3].map((i) => L([[SX0 + 122, SY0 + 70 + i * 12], [SX0 + 122 + [90, 110, 70, 100][i], SY0 + 70 + i * 12]])).join("") : "");
    } else { wins.forEach((w) => w.setAttribute("d", "")); text.setAttribute("d", ""); }
    screen.setAttribute("d", d); dim.setAttribute("d", dd);
    cursor.setAttribute("d", k > 0.5 && on ? poly([[0, 0], [0, 13], [3.5, 10], [6, 15.5], [8.2, 14.5], [5.8, 9.3], [10, 9.3]].map(([x, y]) => S([cur[0] + x, cur[1] + y], Z))) : "");
  }
  draw();

  const B = register(stage, (dt) => {
    t = on ? Math.min(1.3, t + dt / wake * 1.3) : Math.max(0, t - dt * 2.6);
    draw();
    led.classList.toggle("hi", on);
    read.textContent = on ? (t < 1.3 ? "waking" : "on · 2560 × 1440") : t > 0 ? "going to sleep" : "rest";
    return (on && t < 1.3) || (!on && t > 0);
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 40 && q[0] < 360 && q[1] > 20 && q[1] < 280;
    if (n) cur = [Math.max(SX0 + 4, Math.min(SX1 - 14, q[0] + 6)), Math.max(SY0 + 4, Math.min(SY1 - 18, q[1] - 6))];
    on = n; draw(); B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { wake = v; }, destroy: bag.dispose };
}

hairline({
  name: "monitor",
  means: "A monitor: bring the pointer near and it wakes, the desktop drawing itself in while a cursor follows you; leave and it sleeps.",
  rules: [1, 4, 6, 7],
  range: [1.6, 1, 0.6],
  mount,
});
