/**
 * Toaster: a two-slot toaster, face on, two slices of bread standing in its slots, the lever and the browning dial on its front.
 * Bring the pointer near and it toasts: the lever goes down and the bread sinks into the slots, the lever stays down while the
 * bread browns, grill marks coming up on it, and then it pops, the lever springing up and the toast leaping out of the slots and
 * settling back with a bounce. Leave and it waits with its toast standing ready. The lever takes the bright edge while it toasts.
 * The read-out gives how far the toasting has got. The slider is how long it toasts, in seconds.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face; the toast stands between the body's back
 * and its front face, so the front hides it below the slots. The pointer is read against the toaster's resting outline.
 */
const { mk, open, poly, spring, stepS, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const ell = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
const box = (x0, y0, x1, y1, r = 4) => [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]].flatMap(([cx, cy, a0]) => Array.from({ length: 7 }, (_, i) => [cx + r * Math.cos(a0 + (i / 6) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 6) * (Math.PI / 2))]));
// a slice of bread, its bottom at y = 0: the rounded loaf top over straight sides
const BREAD = [[-52, 0], ...Array.from({ length: 25 }, (_, i) => { const t = i / 24; return [-52 + t * 104, -50 - 22 * Math.sin(Math.PI * t) ** 0.5]; }), [52, 0]];
const TOP = 140, SLOTS = [14, 30];

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let secs = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = () => ({ b: el("sil"), s: el("fo"), f: el("sil") });
  const drawPlate = (p, loop, d0, d1) => { p.b.setAttribute("d", poly(loop.map((q) => S(q, d0)))); p.s.setAttribute("d", loop.map((q, i) => { const r = loop[(i + 1) % loop.length]; return poly([S(q, d0), S(r, d0), S(r, d1), S(q, d1)]); }).join("")); p.f.setAttribute("d", poly(loop.map((q) => S(q, d1)))); };
  const BODY = box(104, TOP, 296, 262, 26);
  // the body's back and sides, the slots in its top, then the toast, then its front face over the toast
  const back = el("sil"), sides = el("fo"), slots = el("nf");
  back.setAttribute("d", poly(BODY.map((q) => S(q, 0))));
  sides.setAttribute("d", BODY.map((q, i) => { const r = BODY[(i + 1) % BODY.length]; return poly([S(q, 0), S(r, 0), S(r, 44), S(q, 44)]); }).join(""));
  slots.setAttribute("d", SLOTS.map((d) => poly([S([138, TOP], d), S([262, TOP], d), S([262, TOP], d + 6), S([138, TOP], d + 6)])).join(""));
  const toasts = SLOTS.map(() => ({ p: plate(), marks: el("nf lo") }));
  const front = el("sil"), trim = el("nf lo"), lever = plate(), dial = plate(), dialMark = el("nf");
  front.setAttribute("d", poly(BODY.map((q) => S(q, 44))));
  trim.setAttribute("d", open([[118, 246], [282, 246]].map((q) => S(q, 44))) + open([[276, 162], [276, 236]].map((q) => S(q, 44))));
  drawPlate(dial, ell(132, 218, 10, 10, 24), 44, 48);
  // the toast's height: 0 standing ready, negative sunk into the slots, positive leaping out
  const lift = spring(0, { k: 160, c: 7 }), lev = spring(0, { k: 160, c: 16 });
  let on = false, cook = 0, popped = false;

  function draw() {
    toasts.forEach((t, k) => {
      const y0 = TOP + 34 - lift.x - k * 2, loop = BREAD.map(([x, y]) => [200 + x + k * 4, y0 + y]);
      drawPlate(t.p, loop, SLOTS[k] + 1, SLOTS[k] + 5);
      // its crust, and grill marks that come up as it browns
      const crust = BREAD.map(([x, y]) => [200 + x * 0.86 + k * 4, y0 + (y + 4) * 0.88 - 2]);
      const n = Math.round(cook * 4);
      t.marks.setAttribute("d", open([...crust, crust[0]].map((q) => S(q, SLOTS[k] + 5))) + Array.from({ length: n }, (_, i) => open([[200 - 34 + i * 18 + k * 4, y0 - 12], [200 - 18 + i * 18 + k * 4, y0 - 52]].map((q) => S(q, SLOTS[k] + 5)))).join(""));
    });
    const ly = 168 + 62 * lev.x;
    drawPlate(lever, box(266, ly - 6, 296, ly + 6, 4), 44, 52);
    dialMark.setAttribute("d", open([[132, 218], [132 + 8 * Math.cos(-2.2 + 2.6 * cook), 218 + 8 * Math.sin(-2.2 + 2.6 * cook)]].map((q) => S(q, 48))));
  }
  draw();

  const B = register(stage, (dt) => {
    let m = [stepS(lift, dt), stepS(lev, dt)].some(Boolean);
    if (on && !popped) {
      cook = Math.min(1, cook + dt / secs); m = true;
      read.textContent = `toasting ${Math.round(cook * 100)}%`;
      if (cook >= 1) { popped = true; lev.t = 0; lift.x = -40; lift.t = 0; lift.v = 900; lever.f.classList.remove("hi"); read.textContent = "pop!"; }
    }
    draw();
    return m;
  });
  bag.add(B.unregister);

  function point(q) {
    const n = !!q && q[0] > 80 && q[0] < 330 && q[1] > 50 && q[1] < 300;
    if (n && !on) { on = true; popped = false; cook = 0; lev.t = 1; lift.t = -40; lever.f.classList.add("hi"); read.textContent = "toasting 0%"; }
    if (!n && on) { on = false; lev.t = 0; lift.t = 0; lever.f.classList.remove("hi"); if (!popped) { cook = 0; read.textContent = "rest"; } }
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { secs = v; }, destroy: bag.dispose };
}

hairline({
  name: "toaster",
  means: "A toaster: bring the pointer near and the lever goes down, the bread browns, then the toast pops out with a bounce.",
  rules: [1, 4, 6, 8],
  range: [3, 2, 1.2],
  mount,
});
