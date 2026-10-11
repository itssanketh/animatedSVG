/**
 * Coffee: an espresso machine, face on: its body with the group head under the top, the portafilter locked in with its handle out to
 * the left, the two spouts, the drip tray with a cup standing on it, and two buttons. Bring the pointer near and it pulls a shot: the
 * button lights, two thin streams run from the spouts into the cup, the coffee rises in it with its crema, and once it is full the
 * streams stop and steam curls up off the cup. Leave and the cup is taken away to drink, emptying, ready for the next. The pressed
 * button takes the bright edge. The read-out gives how full the cup is. The slider is how long a shot takes, in seconds.
 *
 * Every part is a plate, its back face, the strips round its edge and its front face, painted back to front; the streams, the coffee
 * and the steam are lines inside and above the cup. The pointer is read against the machine's resting outline.
 */
const { mk, open, poly, disposer, pointer, register } = HL;

const S = ([x, y], d) => [x - d * 0.6, y + d * 0.45];
const smooth = (ps, n = 4) => ps.flatMap((p, i) => { const q = ps[(i + 1) % ps.length], a = ps[(i - 1 + ps.length) % ps.length], b = ps[(i + 2) % ps.length]; return Array.from({ length: n }, (_, k) => { const t = k / n; return [0, 1].map((j) => 0.5 * (2 * p[j] + (q[j] - a[j]) * t + (2 * a[j] - 5 * p[j] + 4 * q[j] - b[j]) * t * t + (3 * p[j] - a[j] - 3 * q[j] + b[j]) * t * t * t)); }); });
const ell = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
/** a rectangle with round corners of radius r, each a true quarter circle */
const box = (x0, y0, x1, y1, r = 4) => [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]].flatMap(([cx, cy, a0]) => Array.from({ length: 7 }, (_, i) => [cx + r * Math.cos(a0 + (i / 6) * (Math.PI / 2)), cy + r * Math.sin(a0 + (i / 6) * (Math.PI / 2))]));
const CUP = { x0: 180, x1: 220, top: 196, bot: 236 };

function mount({ stage, svg, read }, value) {
  const bag = disposer(); let secs = value;
  const g = mk("g", {}, svg), el = (cls) => mk("path", { class: cls }, g);
  const plate = (loop, d0, d1, faceCls = "sil") => { const b = el("sil"), s = el("fo"), f = el(faceCls); b.setAttribute("d", poly(loop.map((p) => S(p, d0)))); s.setAttribute("d", loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return poly([S(p, d0), S(q, d0), S(q, d1), S(p, d1)]); }).join("")); f.setAttribute("d", poly(loop.map((p) => S(p, d1)))); return f; };
  // the body: a tall back column, the head across the top and the base along the bottom, the recess for the cup between
  plate(box(118, 54, 292, 270, 12), 0, 16);
  el("nf lo").setAttribute("d", poly(box(134, 132, 276, 240, 8).map((p) => S(p, 16))));
  const btns = [plate(ell(246, 90, 7, 7, 20), 16, 19), plate(ell(268, 90, 7, 7, 20), 16, 19)];
  el("nf lo").setAttribute("d", open([[136, 112], [274, 112]].map((p) => S(p, 16))));
  // the group head and the portafilter with its handle
  plate(box(172, 118, 228, 132, 3), 16, 24);
  plate(box(176, 132, 224, 144, 3), 17, 23);
  plate([[176, 135], [150, 137], [104, 146], [100, 145], [98, 141], [102, 139], [148, 131], [176, 131]], 18, 22);
  plate(box(190, 144, 196, 152, 1), 18, 21); plate(box(204, 144, 210, 152, 1), 18, 21);
  // the drip tray, then the cup on it
  plate(box(150, 236, 250, 246, 3), 16, 30);
  el("nf lo").setAttribute("d", [160, 172, 184, 196, 208, 220, 232, 244].map((x) => open([[x - 4, 241], [x + 4, 241]].map((p) => S(p, 30)))).join(""));
  const cupLoop = smooth([[CUP.x0, CUP.top], [CUP.x1, CUP.top], [CUP.x1 - 3, CUP.bot - 6], [CUP.x1 - 8, CUP.bot], [CUP.x0 + 8, CUP.bot], [CUP.x0 + 3, CUP.bot - 6]], 3);
  plate(smooth([[CUP.x1 - 2, 204], [CUP.x1 + 10, 202], [CUP.x1 + 14, 212], [CUP.x1 + 8, 222], [CUP.x1 - 3, 222], [CUP.x1 + 6, 214], [CUP.x1 + 6, 208], [CUP.x1 - 2, 208]], 2), 20, 25);
  const cup = plate(cupLoop, 19, 26);
  // the cup's open top, seen a little from above
  el("nf").setAttribute("d", poly(ell(200, CUP.top + 1, (CUP.x1 - CUP.x0) / 2, 4.5, 28).map((p) => S(p, 22.5))));
  const coffee = el("nf"), streams = el("nf"), steam = el("nf lo");

  let on = false, fill = 0, clock = 0;
  function draw() {
    // the coffee's surface inside the cup, and its crema ring
    // the coffee shows inside the open top once it is high enough to be seen, rising toward the rim
    const y = CUP.top + 1 + 3.5 * (1 - fill), w = (CUP.x1 - CUP.x0) / 2 - 2.5 - (1 - fill) * 5, sy = CUP.bot - 4 - (CUP.bot - CUP.top - 9) * fill;
    coffee.setAttribute("d", fill < 0.45 ? "" : poly(ell(200, y, w, 2.6, 24).map((p) => S(p, 22.5))) + poly(ell(200, y, w * 0.55, 1.3, 18).map((p) => S(p, 22.5))));
    const pouring = on && fill < 1;
    streams.setAttribute("d", !pouring ? "" : [193, 207].map((x, k) => open(Array.from({ length: 10 }, (_, i) => { const t = i / 9; return S([x + (200 - x) * 0.25 * t + Math.sin(clock * 30 + k + t * 8) * 0.5, 152 + (CUP.top + 4 - 152) * t], 21); }))).join(""));
    steam.setAttribute("d", fill < 0.98 || !on ? "" : [-8, 0, 8].map((o, k) => open(Array.from({ length: 12 }, (_, i) => { const t = i / 11; return S([200 + o + Math.sin(clock * 2.5 + k * 2 + t * 5) * 4 * t, CUP.top - 4 - t * 34], 31); }))).join(""));
  }
  draw();

  const B = register(stage, (dt) => {
    clock += dt;
    if (on) fill = Math.min(1, fill + dt / secs); else fill = Math.max(0, fill - dt / 0.8);
    btns[0].classList.toggle("hi", on && fill < 1);
    read.textContent = on ? (fill < 1 ? `pouring ${Math.round(fill * 100)}%` : "ready") : fill > 0 ? "drinking" : "rest";
    draw();
    return on || fill > 0;
  });
  bag.add(B.unregister);

  function point(q) { on = !!q && q[0] > 70 && q[0] < 330 && q[1] > 40 && q[1] < 300; B.wake(); }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: point, leave: () => point(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { secs = v; }, destroy: bag.dispose };
}

hairline({
  name: "coffee",
  means: "An espresso machine: bring the pointer near and it pulls a shot, two streams filling the cup until it steams; leave and it's drunk.",
  rules: [1, 4, 6, 7],
  range: [4, 3, 2],
  mount,
});
